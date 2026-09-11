import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { promisify } from "node:util";
import { assembleContext } from "./context.mjs";
import { waitForInteraction } from "./interaction.mjs";

const execute = promisify(execFile);
const shaPattern = /^[0-9a-f]{40}$/;

export function parseTargetArgs(args) {
  const [number, ...flags] = args.trim().split(/\s+/);
  if (!/^[1-9]\d*$/.test(number) || !Number.isSafeInteger(Number(number))) {
    throw new Error("PR number must be a positive safe integer.");
  }
  const supported = new Set(["--include-drafts", "--include-closed", "--review-closed"]);
  if (flags.some((flag) => !supported.has(flag)) || new Set(flags).size !== flags.length) {
    throw new Error("Unsupported arguments. No review was started. Target capture accepts only --include-drafts, --include-closed, or --review-closed.");
  }
  return {
    number: Number(number),
    includeDrafts: flags.includes("--include-drafts"),
    includeClosed: flags.includes("--include-closed") || flags.includes("--review-closed"),
  };
}

export async function runGh(args, cwd, { signal, input } = {}) {
  signal?.throwIfAborted();
  if (typeof cwd !== "string" || !isAbsolute(cwd)) {
    throw new Error("Target capture requires the session's absolute working directory.");
  }
  const env = { ...process.env, GH_PROMPT_DISABLED: "1", GH_PAGER: "cat" };
  // Invocation targets the checkout, never an ambient repository/checkout override.
  for (const key of ["GH_REPO", "GIT_DIR", "GIT_WORK_TREE", "GIT_COMMON_DIR"]) delete env[key];
  try {
    const pending = execute("gh", args, {
      cwd, env, signal, killSignal: "SIGKILL", encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
    });
    // POST payloads are code-built JSON on stdin, never shell interpolation.
    let inputError;
    pending.child.stdin.on("error", (error) => { inputError = error; });
    pending.child.stdin.end(input);
    const { stdout } = await pending;
    if (inputError) throw new Error("gh input transport failed.", { cause: inputError });
    return stdout;
  } catch (error) {
    throw new Error(`PR capture failed (${args.slice(0, 2).join(" ")}): ${error.message}`, { cause: error });
  }
}

export function repositoryFrom(raw) {
  if (typeof raw?.id !== "string" || !raw.id ||
      typeof raw.nameWithOwner !== "string" ||
      !/^[\w.-]+\/[\w.-]+$/.test(raw.nameWithOwner)) {
    throw new Error("Invalid GitHub repository identity.");
  }
  const url = new URL(raw.url);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      url.pathname !== `/${raw.nameWithOwner}`) {
    throw new Error("Invalid GitHub repository URL.");
  }
  return { id: raw.id, nameWithOwner: raw.nameWithOwner, host: url.host, url: url.href };
}

export function pullFrom(raw, repository, number) {
  if (raw?.number !== number || typeof raw.node_id !== "string" || !raw.node_id ||
      raw.base?.repo?.node_id !== repository.id ||
      raw.base?.repo?.full_name !== repository.nameWithOwner ||
      raw.html_url !== `${repository.url}/pull/${number}` ||
      !["open", "closed"].includes(raw.state) ||
      typeof raw.merged !== "boolean" || (raw.merged && raw.state !== "closed") ||
      typeof raw.draft !== "boolean" ||
      typeof raw.title !== "string" ||
      !(raw.body === null || typeof raw.body === "string") ||
      typeof raw.updated_at !== "string" || !Number.isFinite(Date.parse(raw.updated_at)) ||
      typeof raw.user?.login !== "string" || !raw.user.login ||
      !["User", "Bot", "Organization", "Mannequin"].includes(raw.user.type) ||
      !shaPattern.test(raw.head?.sha) || !shaPattern.test(raw.base?.sha) ||
      typeof raw.head?.ref !== "string" || !raw.head.ref ||
      typeof raw.base?.ref !== "string" || !raw.base.ref ||
      !["changed_files", "additions", "deletions"].every((key) =>
        Number.isSafeInteger(raw[key]) && raw[key] >= 0)) {
    throw new Error("Invalid or mismatched PR metadata; no snapshot accepted.");
  }
  return {
    id: raw.node_id, number, url: raw.html_url, title: raw.title, body: raw.body,
    state: raw.merged ? "MERGED" : raw.state.toUpperCase(), draft: raw.draft,
    author: { login: raw.user.login, type: raw.user.type },
    base: { sha: raw.base.sha, ref: raw.base.ref },
    head: { sha: raw.head.sha, ref: raw.head.ref },
    updatedAt: raw.updated_at,
    changedFiles: raw.changed_files, additions: raw.additions, deletions: raw.deletions,
  };
}

function assertSame(before, after) {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error("PR changed during capture or confirmation; discard this attempt and rerun.");
  }
}

export function skipReason(pull, options) {
  if (pull.draft && !options.includeDrafts) return "draft";
  if (pull.author.type === "Bot" || /\[bot\]$/i.test(pull.author.login)) return "obvious-bot";
  // Titles, file extensions, and small line counts cannot prove a change is correct.
  if (pull.changedFiles === 0 && pull.additions === 0 && pull.deletions === 0) return "empty-change";
  return undefined;
}

export function validateDiff(diff, pull) {
  if (typeof diff !== "string") throw new Error("Missing PR diff.");
  const files = diff.match(/^diff --git /gm)?.length ?? 0;
  if ((pull.changedFiles === 0 && diff !== "") || files !== pull.changedFiles ||
      (files > 0 && (!diff.startsWith("diff --git ") || !diff.endsWith("\n")))) {
    throw new Error("Missing, truncated, or inconsistent PR diff.");
  }
  let additions = 0;
  let deletions = 0;
  let oldRemaining = 0;
  let newRemaining = 0;
  for (const line of diff.split("\n")) {
    const hunk = /^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/.exec(line);
    if (hunk || line.startsWith("diff --git ")) {
      if (oldRemaining || newRemaining) throw new Error("Truncated PR diff hunk.");
      if (hunk) {
        oldRemaining = Number(hunk[1] ?? 1);
        newRemaining = Number(hunk[2] ?? 1);
      }
    } else if (oldRemaining || newRemaining) {
      if (line.startsWith("+")) { additions++; newRemaining--; }
      else if (line.startsWith("-")) { deletions++; oldRemaining--; }
      else if (line.startsWith(" ")) { oldRemaining--; newRemaining--; }
      else if (line !== "\\ No newline at end of file") throw new Error("Malformed PR diff hunk.");
      if (oldRemaining < 0 || newRemaining < 0) throw new Error("Inconsistent PR diff hunk.");
    }
  }
  if (oldRemaining || newRemaining || additions !== pull.additions || deletions !== pull.deletions) {
    throw new Error("Truncated or inconsistent PR diff line counts.");
  }
}

export async function captureTarget(options, { cwd, gh = runGh, confirm } = {}) {
  const repository = repositoryFrom(JSON.parse(await gh(["repo", "view", "--json", "id,nameWithOwner,url"], cwd)));
  const endpoint = `repos/${repository.nameWithOwner}/pulls/${options.number}`;
  const api = (accept) => ["api", "--hostname", repository.host, "--method", "GET",
    endpoint, "-H", `Accept: ${accept}`];
  const readPull = async () => pullFrom(
    JSON.parse(await gh(api("application/vnd.github+json"), cwd)), repository, options.number,
  );
  const pull = await readPull();
  const result = (disposition, reason) => ({ disposition, reason, repository, pull });
  if (pull.state !== "OPEN" && !options.includeClosed) {
    if (!confirm) return result("confirmation-required", "Use --include-closed or --review-closed to proceed.");
    const accepted = await confirm(
      `PR #${pull.number} in ${repository.nameWithOwner} is ${pull.state} (head ${pull.head.sha}). Review it anyway?`,
    );
    if (accepted !== true) return result("declined", "Closed/merged PR was not confirmed.");
    // No diff exists while approval is pending; approval cannot drift to another head.
    assertSame(pull, await readPull());
  }
  const reason = skipReason(pull, options);
  if (reason) return result("skipped", reason);
  const diff = await gh(api("application/vnd.github.diff"), cwd);
  assertSame(pull, await readPull());
  validateDiff(diff, pull);
  return {
    ...result("captured", "Capture only; no reviewers started and no review result."),
    snapshot: {
      repository, pull, diff, capturedAt: new Date().toISOString(),
      diffSha256: createHash("sha256").update(diff).digest("hex"),
      diffBytes: Buffer.byteLength(diff),
    },
  };
}

export function contextSummary(context, limit = 20) {
  return {
    head: context.head, base: context.base, radius: context.radius,
    files: context.files.length,
    sources: context.files.reduce((total, file) => total + file.sources.length, 0),
    contextBytes: context.bytes, contextSha256: context.sha256,
    entries: context.files.slice(0, limit).map((file) => ({
      path: file.path, status: file.status,
      ...(file.reason ? { reason: file.reason } : {}),
      sources: file.sources.map((source) => ({
        side: source.side, blob: source.blobSha, bytes: source.bytes, lines: source.lines.length,
        windows: source.windows.map((window) => `${window.start}-${window.end}`),
      })),
    })),
    ...(context.files.length > limit ? { undisplayedFiles: context.files.length - limit } : {}),
  };
}

export async function executeTargetCapture(session, args, {
  gh = runGh, signal, quiet = false, unattended = false,
} = {}) {
  const options = parseTargetArgs(args);
  signal?.throwIfAborted();
  const metadata = await session.rpc.metadata.snapshot();
  signal?.throwIfAborted();
  if (metadata.isRemote) throw new Error("PR capture requires a local Copilot session.");
  const cwd = metadata.workingDirectory;
  const outcome = await captureTarget(options, {
    cwd, gh,
    // U1: an unattended run offers no confirmation even where the host has one,
    // so a closed or merged pull request stops here with the message naming the
    // two override flags. Withholding the question can only refuse a capture; it
    // can never accept one on somebody's behalf.
    confirm: !unattended && session.capabilities.ui?.elicitation
      ? (message) => waitForInteraction(signal, () => session.ui.confirm(message)) : undefined,
  });
  signal?.throwIfAborted();
  // Keep PR-controlled text and the complete diff out of the parent timeline.
  // O1: a quiet run drops the JSON dump, never the decision it records. A
  // skipped or refused target is the whole reason nothing was reviewed, so it is
  // stated in words rather than left to a suppressed line.
  await session.log(`${quiet
    ? `Target ${outcome.repository.nameWithOwner}#${outcome.pull.number}: ${outcome.disposition}` +
      `${outcome.reason ? `; ${outcome.reason}` : ""}. State ${outcome.pull.state}` +
      `${outcome.pull.draft ? " (draft)" : ""}, head ${outcome.pull.head.sha}, ` +
      `${outcome.pull.changedFiles} changed file(s).`
    : `Q1 target: ${JSON.stringify({
      disposition: outcome.disposition, reason: outcome.reason,
      repository: outcome.repository, number: outcome.pull.number, state: outcome.pull.state,
      draft: outcome.pull.draft, head: outcome.pull.head.sha, base: outcome.pull.base.sha,
      changedFiles: outcome.pull.changedFiles,
      ...(outcome.snapshot ? {
        diffSha256: outcome.snapshot.diffSha256, diffBytes: outcome.snapshot.diffBytes,
        capturedAt: outcome.snapshot.capturedAt,
      } : {}),
    })}`}\nNo PR review performed; no clean-review claim. Nothing published.`);
  if (!outcome.snapshot) return outcome;
  // Context is bound to the captured revisions; unavailable or inconsistent source stops here.
  const context = await assembleContext(outcome.snapshot, { gh, cwd });
  signal?.throwIfAborted();
  const bound = "Source context comes only from the captured GitHub revisions. " +
    "The local checkout, its branch, and its uncommitted changes are never context evidence; " +
    "a review additionally requires the checkout to be exactly this head before reviewers may read it.";
  // The context summary is evidence about what was captured; what the capture
  // promises about its provenance is not, so quiet keeps the promise and drops
  // the dump. Unavailable source still reaches the coverage report either way.
  await session.log(quiet ? bound : `Q2 context: ${JSON.stringify(contextSummary(context))}\n${bound}`);
  return { ...outcome, context, workingDirectory: cwd };
}
