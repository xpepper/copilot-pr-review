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

// K1: how a comment was received, read from the listing discovery already
// requested. Only the two thumbs count. A rollup GitHub did not send, or sent in
// a shape this does not recognise, is unread: a zero nobody measured would be
// reported as a reception. It never refuses the comment, which is still ours.
export function reactionsFrom(raw) {
  const rollup = raw?.reactions;
  if (rollup === null || rollup === undefined) {
    return { status: "unread", reason: "GitHub returned no reactions rollup for this comment" };
  }
  const count = (value) => Number.isSafeInteger(value) && value >= 0;
  if (typeof rollup !== "object" || Array.isArray(rollup) || !count(rollup["+1"]) || !count(rollup["-1"])) {
    return { status: "unread", reason: "GitHub returned a malformed reactions rollup for this comment" };
  }
  return { status: "read", plusOne: rollup["+1"], minusOne: rollup["-1"] };
}

// K1: thread resolution, which REST does not carry. The query lists the pull
// request's review threads with each one's first comment, whose fullDatabaseId
// is the REST id of the comment that opened it; read-only probes of #44 and #45
// showed the two agree. It is a BigInt sent as a decimal string, so it carries a
// 64-bit id whole. GitHub deprecates databaseId because it cannot, and its
// announced removal date has passed, as #45's Copilot review pointed out. gh
// sends GraphQL as a POST, but a query cannot mutate and this one is only ever
// sent from discovery, never from a publication or reply path.
export const reviewThreadsQuery = "query($owner: String!, $name: String!, $number: Int!, $endCursor: String) { " +
  "repository(owner: $owner, name: $name) { pullRequest(number: $number) { " +
  "reviewThreads(first: 100, after: $endCursor) { totalCount pageInfo { hasNextPage endCursor } " +
  "nodes { isResolved comments(first: 1) { nodes { fullDatabaseId } } } } } } }";

function requireThreads(condition, message) {
  if (!condition) throw new Error(`Review thread listing unreadable: ${message}.`);
}

// Every page must be the connection the query asked for. A page that is not
// cannot say which threads it held, so the whole listing is refused rather than
// partly trusted. A listing that is readable but stops short is incomplete: the
// threads it reached are read, and a comment it did not reach stays unread.
export function threadListingFrom(pages) {
  requireThreads(Array.isArray(pages) && pages.length > 0, "no pages");
  const roots = new Map();
  const declared = new Set();
  let listed = 0;
  let connection;
  for (const page of pages) {
    requireThreads(page?.errors === undefined, "GitHub returned errors");
    connection = page?.data?.repository?.pullRequest?.reviewThreads;
    requireThreads(Number.isSafeInteger(connection?.totalCount) && connection.totalCount >= 0 &&
      typeof connection.pageInfo?.hasNextPage === "boolean" && Array.isArray(connection.nodes),
    "not a review thread page");
    declared.add(connection.totalCount);
    for (const node of connection.nodes) {
      requireThreads(typeof node?.isResolved === "boolean" && Array.isArray(node.comments?.nodes),
        "not a review thread");
      listed++;
      // A thread whose opening comment is gone opens none of ours.
      if (!node.comments.nodes.length) continue;
      // Kept as GitHub's string: a number past 2^53 would already have lost digits.
      const { fullDatabaseId: id } = node.comments.nodes[0] ?? {};
      requireThreads(typeof id === "string" && /^[1-9]\d*$/.test(id), "a thread comment without a full database id");
      roots.set(id, roots.has(id) ? "conflicting" : node.isResolved ? "resolved" : "unresolved");
    }
  }
  const reason = connection.pageInfo.hasNextPage ? "the last page read still reported a next page"
    : declared.size > 1 ? "the declared thread count changed between pages"
      : listed !== connection.totalCount ? `${listed} thread(s) listed of ${connection.totalCount} declared`
        : undefined;
  return { status: reason ? "incomplete" : "complete", pages: pages.length, listed, roots,
    ...(reason ? { reason } : {}) };
}

// A REST comment id is a safe integer, which priorCommentFrom enforces, so its
// decimal string is exact and compares with a thread's fullDatabaseId losslessly.
export function threadOf(id, listing) {
  const state = listing.roots?.get(String(id));
  if (state === "resolved" || state === "unresolved") return { status: state };
  return { status: "unread", reason: listing.status === "failed" ? "the review thread listing could not be read"
    : state === "conflicting" ? "more than one review thread opens with this comment"
      : listing.status === "incomplete" ? "the incomplete review thread listing did not reach this comment"
        : "no review thread opens with this comment" };
}

// A failed read is reported as itself, exactly as a failed discovery is. A
// cancellation is never one of these and belongs to the run.
export async function readReviewThreads(repository, pull, { gh = runGh, cwd, signal } = {}) {
  const [owner, name] = repository.nameWithOwner.split("/");
  try {
    return threadListingFrom(JSON.parse(await gh(["api", "--hostname", repository.host, "--method", "POST",
      "graphql", "--paginate", "--slurp", "-f", `query=${reviewThreadsQuery}`, "-f", `owner=${owner}`,
      "-f", `name=${name}`, "-F", `number=${pull.number}`], cwd, { signal })));
  } catch (error) {
    if (signal?.aborted) throw error;
    return { status: "failed", reason: String(error.message ?? error) };
  }
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
  const listing = (await listed(`${endpoint}/comments`))
    .filter((raw) => raw?.pull_request_review_id === review.id);
  const comments = listing.map(priorCommentFrom);
  // K1: kept beside the comments rather than on them, so nothing that reads a
  // retained comment, revalidation included, can read how it was received. A
  // review that left no inline comment has no thread to read, so nothing is asked.
  const { roots, ...threads } = listing.length
    ? await readReviewThreads(repository, pull, { gh, cwd, signal }) : { status: "none" };
  const feedback = {
    threads,
    comments: listing.map((raw) =>
      ({ id: raw.id, reactions: reactionsFrom(raw), thread: threadOf(raw.id, { ...threads, roots }) })),
  };
  const found = { ...base, status: "found", review, comments, feedback };
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
    // K1: counts and reasons only, bounded whatever the number of comments.
    ...(prior.feedback ? { feedback: feedbackCounts(prior.feedback) } : {}),
    ...(prior.reason ? { reason: prior.reason } : {}),
  };
}

// The lines that must survive every path, and they have to say what this run
// actually did. I1b made confining fresh hunting possible and I1c made
// revalidating the earlier findings possible, so both halves of what used to be
// one flat denial are now conditional on what this run reached. A run that says
// it acts on none of the prior review while confining its hunting to that
// review's successor commits, or while reporting verdicts on that review's own
// findings, is exactly the paperwork defect this project keeps catching in
// itself. Each clause is therefore derived from the stage that settled it,
// never asserted ahead of one.
const confinesNothing = "Fresh hunting is not confined to any commit range.";
const confinesRange = "Fresh hunting is confined to the commit range reported below.";
const revalidatesFindings = "What became of that review's own findings is revalidated and reported below.";
const revalidatesNothing = "That review published no finding this tool could read back, so none is revalidated.";

// K1: counts of what was read, and grouped reasons for what was not. A comment
// whose thread or rollup is unread is counted as unread and in nothing else.
export function feedbackCounts(feedback) {
  const tally = (entries) => entries.reduce((reasons, { reason }) =>
    ({ ...reasons, [reason]: (reasons[reason] ?? 0) + 1 }), {});
  const threads = feedback.comments.map(({ thread }) => thread);
  const unreadThreads = threads.filter(({ status }) => status === "unread");
  const reactions = feedback.comments.map(({ reactions: read }) => read);
  const read = reactions.filter(({ status }) => status === "read");
  const unreadReactions = reactions.filter(({ status }) => status === "unread");
  return {
    threads: { ...feedback.threads,
      resolved: threads.filter(({ status }) => status === "resolved").length,
      unresolved: threads.filter(({ status }) => status === "unresolved").length,
      unread: unreadThreads.length, ...(unreadThreads.length ? { unreadReasons: tally(unreadThreads) } : {}) },
    reactions: {
      plusOne: read.reduce((sum, { plusOne }) => sum + plusOne, 0),
      minusOne: read.reduce((sum, { minusOne }) => sum + minusOne, 0),
      read: read.length, unread: unreadReactions.length,
      ...(unreadReactions.length ? { unreadReasons: tally(unreadReactions) } : {}) },
  };
}

// The scope's own limit on this line, stated where it is read: it is reported,
// and a resolved thread was resolved for a reason nobody recorded.
const informationOnly = "Information only: no reviewer or verdict reads it, and a resolved thread is not " +
  "evidence that a finding was fixed or was wrong.";

function describeFeedback(feedback) {
  if (feedback.threads.status === "none") {
    return "Feedback on those comments: none to read, as that review left no inline comment.";
  }
  // gh's error output can span lines; this report is one line whatever it says.
  const oneLine = (text) => String(text).replace(/\s+/g, " ").trim();
  const { threads, reactions } = feedbackCounts(feedback);
  const resolution = threads.status === "failed"
    ? `thread resolution could not be read (${oneLine(threads.reason)}), so all ${threads.unread} thread(s) are unread`
    : `${threads.resolved} thread(s) resolved, ${threads.unresolved} unresolved` +
      `${threads.unread ? `, ${threads.unread} unread` : ""}` +
      `${threads.status === "incomplete" ? ` (the thread listing was incomplete: ${oneLine(threads.reason)})` : ""}`;
  const thumbs = `reactions +1 ${reactions.plusOne}, -1 ${reactions.minusOne}` +
    `${reactions.unread ? ` on ${reactions.read} comment(s), ${reactions.unread} unread` : ""}`;
  return `Feedback on those comments: ${resolution}; ${thumbs}. ${informationOnly}`;
}

export function describePrior(prior, head, confined = false, revalidating = false) {
  const acts = `${confined ? confinesRange : confinesNothing} ` +
    (prior.status === "found" ? revalidating ? revalidatesFindings : revalidatesNothing
      : "There is no earlier finding of ours to revalidate.");
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
    ...(prior.feedback ? [describeFeedback(prior.feedback)] : []),
    `Relationship to this review's head: ${relationship}`,
    acts,
  ].join("\n");
}
