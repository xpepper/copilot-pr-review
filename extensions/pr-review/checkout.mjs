import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { promisify } from "node:util";
import { reviewModes } from "./modes.mjs";

const execute = promisify(execFile);
const shaPattern = /^[0-9a-f]{40}$/;

// Verification opts a run into a stricter profile of the same gate. The flag is
// declared beside the gate it selects, so the parser and the checkout agree on
// what it means: a checkout safeguards could run in, not a review mode.
export const verifyFlag = "--verify";

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
export function refuseCheckout(condition, detail, number, mode = reviewModes.quick, { verify = false } = {}) {
  // A refused verification run says so, and repeats the flag in its fix, because
  // the same checkout may be perfectly reviewable without it.
  const rerun = `/pr-review ${number} ${mode.flag}${verify ? ` ${verifyFlag}` : ""}`;
  const fix = {
    "remote-head": `Fix: rerun ${rerun} after \`gh pr checkout ${number}\` to capture the new head.`,
    // Cleaning the checkout is the user's decision, never this gate's: it says
    // which paths are in the way and stops.
    untracked: `Fix: remove or ignore those paths yourself, then rerun ${rerun}.`,
    "head-branch": `Fix: run \`gh pr checkout ${number}\` in this checkout, then rerun ${rerun}.`,
  }[condition] ?? `Fix: run \`gh pr checkout ${number}\` in this checkout, commit or discard your own ` +
    `changes, then rerun ${rerun}.`;
  return [
    `${mode.label}${verify ? ` with ${verifyFlag}` : ""} refused before any reviewer started: ${detail}`,
    `Failed condition: ${condition}.`,
    "Reviewers read the local checkout, so it must be exactly the reviewed revision.",
    ...(verify ? [`${verifyFlag} additionally requires the pull request's head branch and a tree with no ` +
      "untracked path, because safeguards would run commands in this checkout."] : []),
    "There is no override flag; nothing was reviewed, and no local file was touched.",
    fix,
  ].join("\n");
}

// Displayed before a verification-enabled run starts, so the flag states its own
// boundary rather than being inferred from a review that looks like any other.
export const verificationNotice = [
  `Verification: ${verifyFlag} is set. This run additionally requires the pull request's head branch and a `,
  "tree with no untracked path, checked with the revision gate before any reviewer starts.",
  "\nNo project safeguard is discovered, presented, approved or executed, and no reviewer receives safeguard ",
  "output. A passing preflight is an ordinary review of the selected mode, so this flag grounds no claim in it.",
].join("");

function statusEntries(status) {
  const lines = status.split("\n").filter((line) => line.trim());
  return {
    // Untracked files cannot be mistaken for modified reviewed code, so they warn only.
    untracked: lines.filter((line) => line.startsWith("??")).map((line) => line.slice(3)),
    dirty: lines.filter((line) => !line.startsWith("??")).map((line) => line.slice(3)),
  };
}

// `verify` selects the stricter profile a verification-enabled run needs. It adds
// conditions to this one gate rather than introducing a second one, so a single
// place decides whether a checkout may be used at all, and the ordinary profile
// runs exactly the commands and checks it ran before.
export async function assertReviewableCheckout(snapshot,
  { cwd, gh, git = runGit, signal, mode = reviewModes.quick, verify = false } = {}) {
  signal?.throwIfAborted();
  const number = snapshot.pull.number;
  const captured = snapshot.pull.head.sha;
  const refuse = (condition, detail) => {
    throw new Error(refuseCheckout(condition, detail, number, mode, { verify }));
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
  // Safeguards run commands in this checkout and may leave artifacts behind, so a
  // verification run must be on the PR's own head branch: a detached HEAD at the
  // right commit is the reviewed revision but not a branch anything can land on.
  let branch;
  if (verify) {
    const expected = snapshot.pull.head.ref;
    if (typeof expected !== "string" || !expected) {
      throw new Error("The verification preflight requires the captured head branch.");
    }
    try {
      // symbolic-ref answers the question directly: it fails on a detached HEAD
      // instead of reporting a branch name that no branch could hold.
      branch = (await git(["symbolic-ref", "--quiet", "--short", "HEAD"], cwd, { signal })).trim();
    } catch {
      branch = "";
    }
    if (!branch) {
      refuse("head-branch",
        `this checkout has a detached HEAD at ${head}, not PR #${number}'s head branch ${expected}.`);
    }
    if (branch !== expected) {
      refuse("head-branch",
        `the current branch is ${branch}, but PR #${number}'s head branch is ${expected}.`);
    }
  }
  const { dirty, untracked } = statusEntries(await git(
    ["status", "--porcelain=v1", "--untracked-files=normal"], cwd, { signal },
  ));
  if (dirty.length) {
    refuse("working-tree",
      `${dirty.length} tracked file(s) are modified or staged, so the checkout is not the published revision: ` +
      `${dirty.slice(0, 5).join(", ")}${dirty.length > 5 ? ", ..." : ""}.`);
  }
  // An untracked path cannot be mistaken for modified reviewed code, which is why
  // an ordinary review only warns. A verification run refuses it: once safeguards
  // have written their own artifacts, nothing can tell the two apart.
  if (verify && untracked.length) {
    refuse("untracked",
      `${untracked.length} untracked path(s) are present, and a safeguard's own artifacts could not be ` +
      `told apart from them afterwards: ${untracked.slice(0, 5).join(", ")}${untracked.length > 5 ? ", ..." : ""}.`);
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
  return { root, head, untracked, ...(verify ? { branch } : {}) };
}
