import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { promisify } from "node:util";
import { reviewModes } from "./modes.mjs";

const execute = promisify(execFile);
const shaPattern = /^[0-9a-f]{40}$/;

export async function runGit(args, cwd, { signal } = {}) {
  signal?.throwIfAborted();
  if (typeof cwd !== "string" || !isAbsolute(cwd)) {
    throw new Error("The revision check requires the session's absolute working directory.");
  }
  const env = { ...process.env, GIT_PAGER: "cat", GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0" };
  // The checked directory decides the repository, never an ambient override.
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_COMMON_DIR", "GIT_INDEX_FILE", "GIT_CEILING_DIRECTORIES"]) {
    delete env[key];
  }
  const { stdout } = await execute("git", args, {
    cwd, env, signal, killSignal: "SIGKILL", encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

// Reviewers read the local checkout, so a mismatched checkout would produce
// evidence about code that is not the reviewed revision. There is deliberately
// no override flag and no degraded context-only fallback, and this never
// switches branches, stashes, pulls or cleans to satisfy itself.
export function refuseCheckout(condition, detail, number, mode = reviewModes.quick) {
  return [
    `${mode.label} refused before any reviewer started: ${detail}`,
    `Failed condition: ${condition}.`,
    "Reviewers read the local checkout, so it must be exactly the reviewed revision.",
    "There is no override flag; nothing was reviewed, and no local file was touched.",
    condition === "remote-head"
      ? `Fix: rerun /pr-review ${number} ${mode.flag} after \`gh pr checkout ${number}\` to capture the new head.`
      : `Fix: run \`gh pr checkout ${number}\` in this checkout, commit or discard your own changes, then rerun /pr-review ${number} ${mode.flag}.`,
  ].join("\n");
}

function statusEntries(status) {
  const lines = status.split("\n").filter((line) => line.trim());
  return {
    // Untracked files cannot be mistaken for modified reviewed code, so they warn only.
    untracked: lines.filter((line) => line.startsWith("??")).map((line) => line.slice(3)),
    dirty: lines.filter((line) => !line.startsWith("??")).map((line) => line.slice(3)),
  };
}

export async function assertReviewableCheckout(snapshot, { cwd, gh, git = runGit, signal, mode = reviewModes.quick } = {}) {
  signal?.throwIfAborted();
  const number = snapshot.pull.number;
  const captured = snapshot.pull.head.sha;
  const refuse = (condition, detail) => {
    throw new Error(refuseCheckout(condition, detail, number, mode));
  };
  let top;
  try {
    top = (await git(["rev-parse", "--show-toplevel"], cwd, { signal })).trim();
  } catch (error) {
    refuse("not-a-git-checkout",
      `${cwd} is not inside a Git checkout of ${snapshot.repository.nameWithOwner} (${String(error.message)}).`);
  }
  if (!top || !isAbsolute(top)) refuse("not-a-git-checkout", `Git reported no usable checkout root for ${cwd}.`);
  const root = await realpath(top);
  let head;
  try {
    head = (await git(["rev-parse", "HEAD"], cwd, { signal })).trim();
  } catch (error) {
    refuse("local-head", `This checkout has no resolvable HEAD commit (${String(error.message)}).`);
  }
  if (!shaPattern.test(head)) refuse("local-head", `Git reported an unusable HEAD (${head || "empty"}).`);
  if (head !== captured) {
    refuse("local-head",
      `local HEAD is ${head}, but PR #${number} was captured at head ${captured}.`);
  }
  const { dirty, untracked } = statusEntries(await git(
    ["status", "--porcelain=v1", "--untracked-files=normal"], cwd, { signal },
  ));
  if (dirty.length) {
    refuse("working-tree",
      `${dirty.length} tracked file(s) are modified or staged, so the checkout is not the published revision: ` +
      `${dirty.slice(0, 5).join(", ")}${dirty.length > 5 ? ", ..." : ""}.`);
  }
  // A moved remote head means the captured snapshot is already stale; stop
  // rather than re-capturing mid-run.
  signal?.throwIfAborted();
  const current = JSON.parse(await gh([
    "api", "--hostname", snapshot.repository.host, "--method", "GET",
    `repos/${snapshot.repository.nameWithOwner}/pulls/${number}`,
    "-H", "Accept: application/vnd.github+json",
  ], cwd));
  if (current?.head?.sha !== captured) {
    refuse("remote-head",
      `PR #${number} now has head ${current?.head?.sha ?? "(unreadable)"}, but this run captured ${captured}.`);
  }
  return { root, head, untracked };
}
