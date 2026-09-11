import { parseDiffFiles } from "./context.mjs";
import { assertCompleteDiff, runGh } from "./target.mjs";

// I1b: the declaration that this run wants fresh hunting confined to the commits
// added since an earlier review of the same pull request. Like the three flags
// before it, it is a flag and deliberately not a configuration key: narrowing
// what a reviewer may report is a reduction in what this run covers, and no
// saved state may make a run cover less than the person running it asked for.
//
// It is opt-in rather than the default, and that was the user's decision. Two
// cases decided it. A re-review in a heavier mode than the earlier one would
// silently never reach the hunks that earlier mode only skimmed. And the
// earlier review's own coverage cannot be read: `toolReviewBody` deliberately
// checks that a coverage sentence is present and never what it says, because
// that prose is the part most likely to change between versions, so a run that
// narrowed by default could rest on a degraded earlier review without ever
// being able to know it did.
export const incrementalFlag = "--incremental";

function requireRange(condition, message) {
  if (!condition) throw new Error(`Incremental confinement refused: ${message}.`);
}

// The comparison names head-side lines in the same head blob the captured
// base-to-head diff does, so the two are directly comparable. Base-side numbers
// are not comparable at all: they name the captured base revision, which this
// comparison never saw, so nothing here pretends to place them.
export function newRangeFrom(diff, { priorHead, head, commits } = {}) {
  requireRange(typeof diff === "string", "the comparison returned no diff");
  // A partial range is worse than no range at all. `parseDiffFiles` is a parser
  // and accepts a diff cut mid-hunk, reporting fewer changed lines rather than
  // failing, and every candidate in the file it truncated would then be set
  // aside as already covered. So completeness is asserted here, and a diff that
  // cannot be shown complete refuses rather than confines.
  assertCompleteDiff(diff, "commit range diff");
  const parsed = parseDiffFiles(diff);
  const touched = new Set();
  const changed = new Map();
  for (const file of parsed) {
    for (const path of [file.oldPath, file.newPath]) if (path) touched.add(path);
    if (!file.newPath) continue;
    const lines = changed.get(file.newPath) ?? new Set();
    for (const line of file.changed.head) lines.add(line);
    changed.set(file.newPath, lines);
  }
  return { priorHead, head, commits, touched, changed, files: parsed.length };
}

// Consecutive head-side lines read as one range, which is what a reviewer is
// given and what a person reads back. The numbers are the reviewer's own
// coordinate system already, so nothing is translated on the way out.
export function lineRanges(lines) {
  const sorted = [...lines].sort((left, right) => left - right);
  const ranges = [];
  for (const line of sorted) {
    const last = ranges.at(-1);
    if (last && line === last.end + 1) last.end = line;
    else if (!last || line !== last.end) ranges.push({ start: line, end: line });
  }
  return ranges.map(({ start, end }) => (start === end ? `${start}` : `${start}-${end}`));
}

// A location is inside the new range when the new commits changed one of the
// head-side lines it anchors on. A base-side anchor cannot be placed in the
// comparison at all, so the only thing that can be established about one is
// that its file was never touched, and a file the new commits never touched
// holds nothing new on either side. Anything the range cannot settle stays in
// scope: this increment removes candidates it can prove an earlier turn already
// covered, and never the ones it merely cannot place.
export function withinNewRange(location, range) {
  if (!range) return true;
  if (location.side !== "head") return range.touched.has(location.path);
  const lines = range.changed.get(location.path);
  if (!lines) return false;
  for (let line = location.startLine; line <= location.endLine; line++) if (lines.has(line)) return true;
  return false;
}

export async function readNewRange(repository, priorHead, head, { gh = runGh, cwd, signal } = {}) {
  const diff = await gh(["api", "--hostname", repository.host, "--method", "GET",
    `repos/${repository.nameWithOwner}/compare/${priorHead}...${head}`,
    "-H", "Accept: application/vnd.github.diff"], cwd, { signal });
  return diff;
}

// Confinement is decided here, once, from a discovery this run already made.
// Every outcome but `confined` narrows nothing, and each says which it is: a
// run that asked to be confined and was not must never read as one that was.
export async function confineToNewCommits(prior, pull, repository, {
  requested = false, gh = runGh, cwd, signal,
} = {}) {
  if (!requested) return undefined;
  if (prior?.relationship !== "incremental") {
    return { status: "not-applicable", relationship: prior?.relationship ?? "none", requested };
  }
  try {
    const diff = await readNewRange(repository, prior.review.head, pull.head.sha, { gh, cwd, signal });
    const range = newRangeFrom(diff, {
      priorHead: prior.review.head, head: pull.head.sha, commits: prior.comparison?.totalCommits,
    });
    // A forward range that changed no file leaves nothing to confine hunting
    // to. Confining to it would set every candidate aside, and calling it a
    // failure would name something that did not happen, so it is its own
    // outcome and it narrows nothing.
    if (!range.touched.size) {
      return { status: "empty", requested, relationship: "incremental", range, review: prior.review };
    }
    return { status: "confined", requested, relationship: "incremental", range, review: prior.review };
  } catch (error) {
    if (signal?.aborted) throw error;
    // A range this run could not read grounds no narrowing, so it narrows
    // nothing and says so. Refusing the review instead would turn a failed
    // optimisation into a failed review, and narrowing anyway would confine
    // hunting to a range nothing established.
    return { status: "failed", requested, relationship: "incremental",
      reason: String(error.message ?? error) };
  }
}

export const isConfined = (confinement) => confinement?.status === "confined";

export function confinedPaths(confinement) {
  if (!isConfined(confinement)) return [];
  return [...confinement.range.changed.entries()]
    .filter(([, lines]) => lines.size)
    .map(([path, lines]) => ({ path, lines: lineRanges(lines) }));
}

// Every path the new commits touched, on either side. This is what
// `withinNewRange` actually tests a base-side anchor against, so it has to
// reach the reviewers too: a file the new commits deleted has no head-side line
// at all and never enters `changed`, so `paths` alone would tell a reviewer not
// to emit the only anchor such a defect can have.
export const touchedPaths = (confinement) =>
  (isConfined(confinement) ? [...confinement.range.touched].sort() : []);

// What the reviewers are given. It is a filter expressed in the head-side
// coordinates they already cite in, and it is supplied beside the captured diff
// rather than in place of it: the diff, the context windows and every citation
// rule reach them exactly as they would in any other run.
export function confinementInput(confinement) {
  if (!isConfined(confinement)) return undefined;
  const { range } = confinement;
  return {
    reviewedBefore: range.priorHead, commitsSince: range.commits,
    paths: confinedPaths(confinement), basePaths: touchedPaths(confinement),
  };
}

export function confinementSummary(confinement, limit = 20) {
  if (!confinement) return undefined;
  if (!isConfined(confinement)) {
    return { status: confinement.status, requested: confinement.requested,
      relationship: confinement.relationship, ...(confinement.reason ? { reason: confinement.reason } : {}) };
  }
  const paths = confinedPaths(confinement);
  return {
    status: confinement.status, requested: confinement.requested, relationship: confinement.relationship,
    reviewedBefore: confinement.range.priorHead, head: confinement.range.head,
    commitsSince: confinement.range.commits, rangeFiles: confinement.range.files,
    paths: paths.slice(0, limit).map(({ path, lines }) => ({ path, lines })),
    ...(paths.length > limit ? { undisplayedPaths: paths.length - limit } : {}),
  };
}

const unconfined = "Fresh hunting is not confined: this run reports a candidate anywhere in the captured diff, " +
  "exactly as a run without the flag does.";

export function describeConfinement(confinement) {
  if (!confinement) return undefined;
  if (confinement.status === "not-applicable") {
    return `${incrementalFlag} narrowed nothing: the relationship to an earlier review of this pull request ` +
      `is ${confinement.relationship}, and only incremental leaves a forward commit range to confine ` +
      `hunting to. ${unconfined}`;
  }
  if (confinement.status === "failed") {
    return `${incrementalFlag} narrowed nothing: the commit range could not be read: ${confinement.reason}\n` +
      `${unconfined} The review is unaffected and proceeds as an ordinary one.`;
  }
  if (confinement.status === "empty") {
    return `${incrementalFlag} narrowed nothing: the ${confinement.range.commits} commit(s) added since ` +
      `${confinement.range.priorHead} change no file, so there is no forward range to confine hunting to. ` +
      unconfined;
  }
  const paths = confinedPaths(confinement);
  const lines = paths.reduce((total, entry) => total + entry.lines.length, 0);
  return [
    `Fresh hunting is confined to the ${confinement.range.commits} commit(s) added since ` +
      `${confinement.range.priorHead}, which is the head the earlier review evaluated. ${confinement.review.url}`,
    `${paths.length} file(s) and ${lines} head-side line range(s) are in scope; a candidate anchored ` +
      "anywhere else in the captured diff is set aside as already covered by that review, and is reported " +
      "rather than dropped.",
    "This is a filter over the captured base-to-head binding and never a replacement for it: the diff, the " +
      "context windows, the provenance checks and every citation rule are exactly what an unconfined run uses, " +
      "so a finding still anchors inside a hunk of the captured diff.",
    "**This review therefore does not cover the whole pull request.** What it did not hunt was covered by " +
      "the earlier review, whose own coverage this run does not read and does not vouch for.",
  ].join("\n");
}

// The one sentence that must reach the published review body. It goes in as an
// informational caveat rather than a coverage gap: nothing failed and no
// assessment was blocked, so the run is complete over what it was asked to
// review, and a run that reported INCOMPLETE for a narrowing the person asked
// for would make that word mean two different things.
export function confinementCaveat(confinement, setAside) {
  if (!isConfined(confinement)) return undefined;
  return { kind: "caveat", message:
    `Fresh hunting was confined to the ${confinement.range.commits} commit(s) added after ` +
    `${confinement.range.priorHead}, the head an earlier review by this tool evaluated, so this review does ` +
    `not cover the whole pull request; ${setAside} candidate(s) anchored outside that range were set aside ` +
    "as already covered, and the earlier review's own coverage was not read." };
}
