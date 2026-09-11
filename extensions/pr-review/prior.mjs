import { reviewModes } from "./modes.mjs";
import { runGh } from "./target.mjs";

const shaPattern = /^[0-9a-f]{40}$/;
// The two halves of the body every published review of this tool carries.
// preview.mjs builds them from code in one place, from the same mode table read
// here, so recognising our own review is a fact about our own output rather
// than a guess about somebody's prose. A review written by hand by the same
// person matches neither, and is deliberately never treated as a prior review.
const claimSentence = "This is not a clean-review claim.";
const coverageSentence = "Review coverage: ";
const openingPattern = new RegExp(`^(${Object.values(reviewModes).map((mode) => mode.label).join("|")})` +
  ": (\\d+) selected validated finding\\(s\\)\\. ");

function requirePrior(condition, message) {
  if (!condition) throw new Error(`Prior review discovery refused: ${message}.`);
}

export function toolReviewBody(body) {
  // The opening and the closing alone would let anything sit between them.
  // Every body `reviewRequest` builds states the coverage, in both of its
  // branches, so requiring that narrows the shape at no cost to stability: a
  // review published by an older version of this tool must stay recognisable,
  // and the coverage wording between these three fixed parts is the half most
  // likely to change.
  if (typeof body !== "string" || !body.endsWith(claimSentence) ||
      !body.includes(coverageSentence)) return undefined;
  const opening = openingPattern.exec(body);
  if (!opening) return undefined;
  const mode = Object.values(reviewModes).find(({ label }) => label === opening[1]);
  const declaredFindings = Number(opening[2]);
  if (!mode || !Number.isSafeInteger(declaredFindings)) return undefined;
  return { mode: mode.id, label: mode.label, declaredFindings };
}

export function identityFrom(raw) {
  requirePrior(typeof raw?.login === "string" && raw.login.trim() &&
    Number.isSafeInteger(raw.id) && raw.id > 0, "invalid authenticated identity");
  return { login: raw.login, id: raw.id };
}

// Both halves must hold. The identity proves who submitted it; the body proves
// this tool wrote it. Either alone admits a review whose comments carry no
// severity, no anchor and no reviewed head that this tool put there.
export function isPriorReview(raw, identity) {
  return raw?.state === "COMMENTED" &&
    raw.user?.login === identity.login && raw.user?.id === identity.id &&
    shaPattern.test(raw.commit_id ?? "") &&
    typeof raw.submitted_at === "string" && Number.isFinite(Date.parse(raw.submitted_at)) &&
    toolReviewBody(raw.body) !== undefined;
}

export function priorReviewFrom(raw) {
  const summary = toolReviewBody(raw?.body);
  requirePrior(summary && Number.isSafeInteger(raw.id) && raw.id > 0 &&
    shaPattern.test(raw.commit_id ?? "") && typeof raw.html_url === "string" && raw.html_url &&
    typeof raw.submitted_at === "string" && Number.isFinite(Date.parse(raw.submitted_at)),
  "invalid prior review metadata");
  // commit_id is the head that review evaluated: publication sets it from the
  // binding and asserts the acknowledgment carries it back unchanged, so it is
  // the reviewed revision and not an approximation of one.
  return {
    id: raw.id, url: raw.html_url, submittedAt: raw.submitted_at, head: raw.commit_id,
    mode: summary.mode, label: summary.label, declaredFindings: summary.declaredFindings,
  };
}

function optionalLine(value, what) {
  if (value === null || value === undefined) return undefined;
  requirePrior(Number.isSafeInteger(value) && value > 0, `invalid prior comment ${what}`);
  return value;
}

function optionalSide(value, what) {
  if (value === null || value === undefined) return undefined;
  requirePrior(["LEFT", "RIGHT"].includes(value), `invalid prior comment ${what}`);
  return value;
}

// The body is kept exactly as posted; the anchor is normalised to a fixed shape
// and everything else GitHub returns is dropped. Nothing here reads the body:
// turning this tool's emitted comment prose back into a structured finding is
// the revalidation increment's work, and shipping that parser before anything
// consumes it would ship a reading nothing checks.
export function priorCommentFrom(raw) {
  requirePrior(Number.isSafeInteger(raw?.id) && raw.id > 0 &&
    typeof raw.path === "string" && raw.path && typeof raw.body === "string" && raw.body &&
    typeof raw.html_url === "string" && raw.html_url &&
    shaPattern.test(raw.commit_id ?? "") && shaPattern.test(raw.original_commit_id ?? ""),
  "invalid prior review comment");
  return {
    id: raw.id, url: raw.html_url, path: raw.path,
    side: optionalSide(raw.side, "side"), startSide: optionalSide(raw.start_side, "start side"),
    line: optionalLine(raw.line, "line"), startLine: optionalLine(raw.start_line, "start line"),
    // GitHub nulls `line` once the anchor has fallen out of the current diff.
    // The original pair is the anchor exactly as this tool wrote it, which is
    // what a re-review has to reason about, so both are kept and the run says
    // which comments GitHub can no longer place.
    originalLine: optionalLine(raw.original_line, "original line"),
    originalStartLine: optionalLine(raw.original_start_line, "original start line"),
    outdated: raw.line === null || raw.line === undefined,
    commit: raw.commit_id, originalCommit: raw.original_commit_id, body: raw.body,
  };
}

// Only `ahead` means the reviewed head descends from the head that review
// evaluated, which is the one case where a forward range exists to confine
// fresh hunting to. A rewound head is GitHub's `behind` and classifies as
// diverged for the same reason a genuinely divergent one does: there is no such
// range. GitHub's own word is kept in the record, so nothing is lost by folding.
export function classifyComparison(raw) {
  requirePrior(["identical", "ahead", "behind", "diverged"].includes(raw?.status) &&
    Number.isSafeInteger(raw.ahead_by) && raw.ahead_by >= 0 &&
    Number.isSafeInteger(raw.behind_by) && raw.behind_by >= 0 &&
    Number.isSafeInteger(raw.total_commits) && raw.total_commits >= 0 &&
    shaPattern.test(raw.merge_base_commit?.sha ?? ""), "invalid commit comparison");
  return {
    comparison: {
      status: raw.status, aheadBy: raw.ahead_by, behindBy: raw.behind_by,
      totalCommits: raw.total_commits, mergeBase: raw.merge_base_commit.sha,
    },
    relationship: raw.status === "identical" ? "same-head"
      : raw.status === "ahead" ? "incremental" : "diverged",
  };
}

export async function discoverPriorReview(repository, pull, { gh = runGh, cwd, signal } = {}) {
  const api = (path, paginate) => ["api", "--hostname", repository.host, "--method", "GET", path,
    "-H", "Accept: application/vnd.github+json", ...(paginate ? ["--paginate", "--slurp"] : [])];
  const read = async (path, paginate) => JSON.parse(await gh(api(path, paginate), cwd, { signal }));
  // Paginated listings are slurped into one array per page, so a page boundary
  // can never cut a listing short: "no prior review" and "one we did not read
  // far enough to see" must not be the same answer.
  const listed = async (path) => {
    const pages = await read(`${path}?per_page=100`, true);
    requirePrior(Array.isArray(pages) && pages.every(Array.isArray), "invalid paginated listing");
    return pages.flat();
  };
  const identity = identityFrom(await read("user"));
  const endpoint = `repos/${repository.nameWithOwner}/pulls/${pull.number}`;
  const reviews = await listed(`${endpoint}/reviews`);
  const ours = reviews.filter((raw) => isPriorReview(raw, identity));
  const base = { identity, considered: reviews.length, comments: [] };
  if (!ours.length) return { ...base, status: "none", relationship: "none" };
  const review = priorReviewFrom(ours.reduce((best, raw) => {
    const [candidate, incumbent] = [Date.parse(raw.submitted_at), Date.parse(best.submitted_at)];
    return candidate > incumbent || (candidate === incumbent && raw.id > best.id) ? raw : best;
  }));
  const comments = (await listed(`${endpoint}/comments`))
    .filter((raw) => raw?.pull_request_review_id === review.id).map(priorCommentFrom);
  const found = { ...base, status: "found", review, comments };
  // Two equal heads settle the relationship without asking, and a comparison
  // this run never made has no place in its record.
  if (review.head === pull.head.sha) return { ...found, relationship: "same-head" };
  try {
    return { ...found,
      ...classifyComparison(await read(
        `repos/${repository.nameWithOwner}/compare/${review.head}...${pull.head.sha}?per_page=1`)) };
  } catch (error) {
    if (signal?.aborted) throw error;
    // A reviewed head GitHub can no longer reach, force-pushed away and
    // collected, leaves the relationship unmeasured. Saying so is the honest
    // answer; calling it diverged would assert what no request established.
    return { ...found, relationship: "unknown", reason: String(error.message ?? error) };
  }
}

// Discovery grounds nothing a finding depends on. It reports what an earlier
// review evaluated and changes no reviewer's input, so a failure is reported as
// itself rather than refusing a review that can still run, exactly as safeguard
// discovery is. A cancellation is never one of these and belongs to the run.
export async function collectPriorReview(repository, pull, options = {}) {
  try {
    return await discoverPriorReview(repository, pull, options);
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return { status: "failed", relationship: "unknown", comments: [],
      reason: String(error.message ?? error) };
  }
}

export function priorSummary(prior, limit = 20) {
  const anchors = prior.comments.map(({ path, side, startLine, line, originalStartLine, originalLine, outdated }) =>
    ({ path, side, startLine, line, originalStartLine, originalLine, outdated }));
  return {
    status: prior.status, relationship: prior.relationship,
    ...(prior.identity ? { identity: prior.identity.login } : {}),
    ...(prior.considered === undefined ? {} : { considered: prior.considered }),
    ...(prior.review ? { review: prior.review } : {}),
    ...(prior.comparison ? { comparison: prior.comparison } : {}),
    comments: anchors.length, anchors: anchors.slice(0, limit),
    ...(anchors.length > limit ? { undisplayedAnchors: anchors.length - limit } : {}),
    ...(prior.reason ? { reason: prior.reason } : {}),
  };
}

// The one sentence that must survive every path, and it has to say what this
// run actually did. I1b made confining fresh hunting possible, so the sentence
// that used to promise it never happens is now conditional on the confinement
// this run reached: a run that says it acts on none of the prior review while
// confining its hunting to that review's successor commits is exactly the
// paperwork defect this project keeps catching in itself. Revalidating the
// earlier findings is still nobody's work, and stays denied in both branches.
const actsOnNone = "This run reports the prior review and acts on none of it: fresh hunting is not confined " +
  "to any commit range, and the earlier findings are not revalidated.";
const actsOnRange = "This run confines fresh hunting to the commit range reported below, which is the only " +
  "thing it takes from the prior review: the earlier findings are not revalidated.";

export function describePrior(prior, head, confined = false) {
  const acts = confined ? actsOnRange : actsOnNone;
  if (prior.status === "failed") {
    return `Prior review discovery failed: ${prior.reason}\n` +
      "The review is unaffected and proceeds as an ordinary one. No earlier review was read, " +
      "so this run makes no claim that none exists.";
  }
  if (prior.status === "none") {
    return `No prior review by this tool: ${prior.considered} submitted review(s) considered, none both ` +
      `submitted by ${prior.identity.login} and carrying a review body this tool builds. ${acts}`;
  }
  const { review, comparison } = prior;
  const outdated = prior.comments.filter((comment) => comment.outdated).length;
  const relationship = {
    "same-head": `unchanged. The reviewed head ${head} is exactly the head that review evaluated.`,
    incremental: `incremental. ${comparison?.totalCommits} commit(s) were added after it, and the reviewed ` +
      `head ${head} still descends from ${review.head} (merge base ${comparison?.mergeBase}).`,
    diverged: `diverged. The reviewed head ${head} does not descend from ${review.head}; GitHub reports ` +
      `${comparison?.status}, ${comparison?.aheadBy} ahead and ${comparison?.behindBy} behind ` +
      `(merge base ${comparison?.mergeBase}).`,
    unknown: `unmeasured. GitHub could not compare ${review.head} with ${head}: ${prior.reason}`,
  }[prior.relationship];
  return [
    `Prior review: ${review.label} at head ${review.head}, submitted ${review.submittedAt}, ` +
      `declaring ${review.declaredFindings} finding(s). ${review.url}`,
    `${prior.comments.length} inline comment(s) retained, bodies verbatim and anchors normalised` +
      `${outdated ? `, of which ${outdated} no longer anchor in the current diff` : ""}.`,
    `Relationship to this review's head: ${relationship}`,
    acts,
  ].join("\n");
}
