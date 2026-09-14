import assert from "node:assert/strict";
import {
  classifyComparison, collectPriorReview, describePrior, discoverPriorReview, identityFrom,
  isPriorReview, priorCommentFrom, priorReviewFrom, priorSummary, reactionsFrom, toolReviewBody,
} from "../extensions/pr-review/prior.mjs";
import { executeTargetCapture } from "../extensions/pr-review/target.mjs";
import { identity, respond } from "./target-fixture.mjs";

const cwd = process.cwd();
const repository = {
  id: "R_fixture", nameWithOwner: "fixture/repository", host: "github.com",
  url: "https://github.com/fixture/repository",
};
const reviewedHead = "1".repeat(40);
const currentHead = "2".repeat(40);
const target = { number: 7, head: { sha: currentHead, ref: "feature" } };
const closing = "This is not a clean-review claim.";

function toolReview(overrides = {}) {
  return {
    id: 5130714400, state: "COMMENTED", commit_id: reviewedHead,
    user: { login: identity.login, id: identity.id, type: "User" },
    submitted_at: "2026-09-07T10:11:11Z",
    html_url: `${repository.url}/pull/7#pullrequestreview-5130714400`,
    body: `Balanced review: 2 selected validated finding(s). Review coverage: INCOMPLETE. ${closing}`,
    ...overrides,
  };
}

// K1: the rollup GitHub attaches to every review comment in the listing, in the
// shape a read-only probe of #44 returned.
function rollup(counts = {}) {
  const kinds = { "+1": 0, "-1": 0, laugh: 0, hooray: 0, confused: 0, heart: 0, rocket: 0, eyes: 0, ...counts };
  return { url: "https://api.github.com/repos/fixture/repository/pulls/comments/3948685115/reactions",
    total_count: Object.values(kinds).reduce((sum, count) => sum + (Number(count) || 0), 0), ...kinds };
}

function toolComment(overrides = {}) {
  return {
    id: 3948685115, pull_request_review_id: 5130714400,
    html_url: `${repository.url}/pull/7#discussion_r3948685115`,
    path: "total.js", side: "RIGHT", start_side: null, line: 3, start_line: null,
    original_line: 3, original_start_line: null,
    commit_id: currentHead, original_commit_id: reviewedHead,
    body: "[P2] Restore multiplication when calculating total cents\n\nWhen: any call.",
    reactions: rollup(),
    ...overrides,
  };
}

const comparisons = {
  identical: { status: "identical", ahead_by: 0, behind_by: 0, total_commits: 0,
    merge_base_commit: { sha: reviewedHead } },
  ahead: { status: "ahead", ahead_by: 3, behind_by: 0, total_commits: 3,
    merge_base_commit: { sha: reviewedHead } },
  behind: { status: "behind", ahead_by: 0, behind_by: 2, total_commits: 0,
    merge_base_commit: { sha: currentHead } },
  diverged: { status: "diverged", ahead_by: 2, behind_by: 5, total_commits: 2,
    merge_base_commit: { sha: "3".repeat(40) } },
};

// K1: one slurped page of the review-thread connection, in the shape a read-only
// probe of #44 returned. Each thread is `[databaseId of its first comment,
// isResolved]`; a null id is a thread whose opening comment is gone.
function threadPage(threads, { total = threads.length, next = false } = {}) {
  return { data: { repository: { pullRequest: { reviewThreads: {
    totalCount: total, pageInfo: { hasNextPage: next, endCursor: next ? "Y3Vyc29yOnYyOpK0" : null },
    nodes: threads.map(([databaseId, isResolved]) =>
      ({ isResolved, comments: { nodes: databaseId === null ? [] : [{ databaseId }] } })),
  } } } } };
}

function priorGh({ reviews = [[]], comments = [[]], compare, unreachable = false, threads = [threadPage([])] } = {}) {
  const calls = [];
  const gh = async (args, directory, options) => {
    assert.equal(directory, cwd);
    // The one request that is not a REST GET. Its every argument is pinned, so
    // the thread read cannot drift into a different request unnoticed.
    if (args[5] === "graphql") {
      assert.deepEqual(args.filter((_, index) => index !== 9), ["api", "--hostname", repository.host,
        "--method", "POST", "graphql", "--paginate", "--slurp", "-f", "-f", "owner=fixture",
        "-f", "name=repository", "-F", `number=${target.number}`]);
      assert.match(args[9], /^query=query\(/);
      calls.push({ path: "graphql", query: args[9], paginated: true, signal: options?.signal });
      return typeof threads === "function" ? threads(args, options) : JSON.stringify(threads);
    }
    assert.equal(args[1], "--hostname");
    assert.equal(args[2], repository.host);
    assert.equal(args[3], "--method");
    assert.equal(args[4], "GET");
    assert.equal(args[7], "Accept: application/vnd.github+json");
    calls.push({ path: args[5], paginated: args.includes("--paginate"), signal: options?.signal });
    const path = args[5];
    if (path === "user") return JSON.stringify(identity);
    if (path.endsWith("/reviews?per_page=100")) return JSON.stringify(reviews);
    if (path.endsWith("/comments?per_page=100")) return JSON.stringify(comments);
    if (path.startsWith(`repos/${repository.nameWithOwner}/compare/`)) {
      if (unreachable) throw new Error("PR capture failed (api --hostname): HTTP 404 Not Found");
      return JSON.stringify(compare);
    }
    throw new Error(`Unexpected prior-discovery path: ${path}`);
  };
  return { gh, calls };
}

// The body every published review carries is built in one place from the mode
// table, so recognising our own output is exact rather than approximate.
for (const [label, mode] of [["Quick review", "quick"], ["Balanced review", "balanced"],
  ["Full review", "full"], ["Deep review", "deep"]]) {
  const summary = toolReviewBody(`${label}: 4 selected validated finding(s). Review coverage: completed. ${closing}`);
  assert.deepEqual(summary, { mode, label, declaredFindings: 4 });
}
assert.equal(toolReviewBody(`Balanced review: 0 selected validated finding(s). ` +
  `Review coverage: INCOMPLETE.\nExecution failures: 1; coverage gaps: 0; informational caveats: 0.\n${closing}`)
  .declaredFindings, 0, "A multi-line coverage report still ends in the closing sentence");
for (const rejected of [
  undefined, "", "LGTM", closing,
  `Balanced review: 2 selected validated finding(s). ${closing} Merging now.`,
  `Sneaky review: 2 selected validated finding(s). ${closing}`,
  `Balanced review: two selected validated finding(s). ${closing}`,
  `Balanced review: 2 selected validated findings. ${closing}`,
  "Balanced review: 2 selected validated finding(s). Review coverage: completed.",
  `A Balanced review: 2 selected validated finding(s). ${closing}`,
  // #29's discarded candidate: matching the opening and the closing alone let
  // anything at all sit between them. Every body reviewRequest builds states the
  // coverage, in both of its branches, so requiring that narrows the shape
  // without coupling this to formatCoverage's exact wording, which has to stay
  // recognisable in reviews published by older versions of this tool.
  `Balanced review: 2 selected validated finding(s). Ship it. ${closing}`,
]) assert.equal(toolReviewBody(rejected), undefined, `Not this tool's review body: ${JSON.stringify(rejected)}`);
console.log("PASS I1a only this tool's own code-built review body identifies a prior review");

assert.deepEqual(identityFrom({ login: "human", id: 4242, type: "User", extra: 1 }), { login: "human", id: 4242 });
for (const broken of [undefined, {}, { login: "", id: 1 }, { login: "human" }, { login: "human", id: 0 },
  { login: "human", id: 1.5 }]) {
  assert.throws(() => identityFrom(broken), /invalid authenticated identity/);
}

// Identity and body are both required. Either alone admits a review whose
// comments carry no severity, no anchor and no reviewed head this tool set.
assert.equal(isPriorReview(toolReview(), identity), true);
for (const [what, review] of [
  ["another account", toolReview({ user: { login: "someone", id: 99, type: "User" } })],
  ["the same login on another id", toolReview({ user: { login: identity.login, id: 99, type: "User" } })],
  ["a hand-written review", toolReview({ body: "Looks good to me." })],
  // #29's Copilot review argued that thread replies are mistaken for our own
  // comments. GitHub gives every reply its own review, whose body is empty, so
  // both filters exclude one independently. Verified against four real reply
  // pairs in this repository and in cli/cli, where each reply's
  // pull_request_review_id differed from its parent's. Pinned here because it is
  // observed API behaviour rather than a documented guarantee.
  ["the empty review a reply generates", toolReview({ body: "" })],
  ["an approval", toolReview({ state: "APPROVED" })],
  ["a pending review", toolReview({ state: "PENDING", submitted_at: undefined })],
  ["no reviewed head", toolReview({ commit_id: null })],
  ["an unparsable submission time", toolReview({ submitted_at: "whenever" })],
]) assert.equal(isPriorReview(review, identity), false, `Not a prior review: ${what}`);

assert.deepEqual(priorReviewFrom(toolReview()), {
  id: 5130714400, url: `${repository.url}/pull/7#pullrequestreview-5130714400`,
  submittedAt: "2026-09-07T10:11:11Z", head: reviewedHead,
  mode: "balanced", label: "Balanced review", declaredFindings: 2,
});
for (const broken of [{}, toolReview({ id: 0 }), toolReview({ html_url: "" }), toolReview({ body: "nope" })]) {
  assert.throws(() => priorReviewFrom(broken), /invalid prior review metadata/);
}

// GitHub nulls `line` once an anchor falls out of the current diff. The
// original pair is the anchor as this tool wrote it, so both are kept.
assert.deepEqual(priorCommentFrom(toolComment()), {
  id: 3948685115, url: `${repository.url}/pull/7#discussion_r3948685115`, path: "total.js",
  side: "RIGHT", startSide: undefined, line: 3, startLine: undefined,
  originalLine: 3, originalStartLine: undefined, outdated: false,
  commit: currentHead, originalCommit: reviewedHead,
  body: "[P2] Restore multiplication when calculating total cents\n\nWhen: any call.",
});
const stale = priorCommentFrom(toolComment({ line: null, side: null }));
assert.equal(stale.outdated, true);
assert.equal(stale.line, undefined);
assert.equal(stale.originalLine, 3, "An outdated comment keeps the line it was written at");
const ranged = priorCommentFrom(toolComment({ start_line: 2, start_side: "RIGHT", original_start_line: 2 }));
assert.deepEqual([ranged.startLine, ranged.startSide, ranged.originalStartLine], [2, "RIGHT", 2]);
for (const broken of [{}, toolComment({ path: "" }), toolComment({ body: "" }), toolComment({ id: -1 }),
  toolComment({ original_commit_id: "short" }), toolComment({ line: 0 }), toolComment({ side: "MIDDLE" })]) {
  assert.throws(() => priorCommentFrom(broken), /invalid prior (review comment|comment )/);
}
console.log("PASS I1a prior reviews and their comments are validated, not trusted");

// K1: the listing discovery already reads carries each comment's reactions
// rollup. Only the two thumbs are kept, and a rollup that is missing or
// malformed is reported as unread, never guessed as zero. A comment is still a
// comment without one, so neither case refuses discovery.
assert.deepEqual(reactionsFrom(toolComment({ reactions: rollup({ "+1": 2, "-1": 1, heart: 4 }) })),
  { status: "read", plusOne: 2, minusOne: 1 });
assert.deepEqual(reactionsFrom(toolComment()), { status: "read", plusOne: 0, minusOne: 0 },
  "A rollup GitHub sent with zero counts is a read zero");
for (const [what, reactions, reason] of [
  ["no rollup", undefined, /no reactions rollup/], ["a null rollup", null, /no reactions rollup/],
  ["a list", [], /malformed reactions rollup/],
  ["no thumbs-down", { ...rollup(), "-1": undefined }, /malformed reactions rollup/],
  ["a string count", rollup({ "+1": "2" }), /malformed reactions rollup/],
  ["a negative count", rollup({ "-1": -1 }), /malformed reactions rollup/],
  ["a fractional count", rollup({ "+1": 1.5 }), /malformed reactions rollup/],
]) {
  const read = reactionsFrom(toolComment({ reactions }));
  assert.equal(read.status, "unread", `Unread, never zero: ${what}`);
  assert.match(read.reason, reason, what);
  assert.equal(Object.hasOwn(read, "plusOne") || Object.hasOwn(read, "minusOne"), false,
    `An unread rollup carries no count at all: ${what}`);
  assert.doesNotThrow(() => priorCommentFrom(toolComment({ reactions })), what);
}
console.log("PASS K1 each earlier comment keeps its thumbs, and an unreadable rollup is unread, never zero");

// Only `ahead` leaves a forward range to confine hunting to. A rewound head is
// GitHub's `behind`, and folds into diverged for exactly that reason; GitHub's
// own word stays in the record, so the fold loses nothing.
for (const [status, relationship] of [["identical", "same-head"], ["ahead", "incremental"],
  ["behind", "diverged"], ["diverged", "diverged"]]) {
  const classified = classifyComparison(comparisons[status]);
  assert.equal(classified.relationship, relationship);
  assert.equal(classified.comparison.status, status, "GitHub's own status survives the classification");
}
assert.deepEqual(classifyComparison(comparisons.ahead).comparison,
  { status: "ahead", aheadBy: 3, behindBy: 0, totalCommits: 3, mergeBase: reviewedHead });
for (const broken of [undefined, {}, { ...comparisons.ahead, status: "unknown" },
  { ...comparisons.ahead, ahead_by: -1 }, { ...comparisons.ahead, merge_base_commit: {} }]) {
  assert.throws(() => classifyComparison(broken), /invalid commit comparison/);
}

// No prior review: two listings read, no comparison asked for, and the run says
// what it considered rather than asserting that nothing was ever reviewed.
const absent = priorGh({ reviews: [[toolReview({ body: "Looks good to me." })]] });
const none = await discoverPriorReview(repository, target, { gh: absent.gh, cwd });
assert.equal(none.status, "none");
assert.equal(none.relationship, "none");
assert.equal(none.considered, 1);
assert.deepEqual(none.comments, []);
assert.deepEqual(absent.calls.map((call) => call.paginated), [false, true]);
assert.match(describePrior(none, currentHead), /1 submitted review\(s\) considered/);
assert.equal(none.feedback, undefined, "No earlier review, so no feedback on one");

// Every page of both listings is read, so a page boundary can never be the
// reason a prior review looks absent.
const paged = priorGh({
  reviews: [[toolReview({ id: 1, submitted_at: "2026-09-07T09:00:00Z", commit_id: "9".repeat(40) })],
    [toolReview()]],
  comments: [[toolComment({ id: 1, pull_request_review_id: 999, reactions: rollup({ "-1": 7 }) })],
    // A person answering one of our findings. GitHub files the reply under a
    // review of its own, so it never carries the prior review's id and never
    // reaches priorCommentFrom, let alone I1c's reader.
    [toolComment({ reactions: rollup({ "+1": 2, "-1": 1 }) }), toolComment({ id: 2,
      pull_request_review_id: 5131451227, in_reply_to_id: 3948685115, body: "Thanks, fixed in abc1234.",
      reactions: rollup({ "+1": 5 }) })]],
  compare: comparisons.ahead,
});
const incremental = await discoverPriorReview(repository, target, { gh: paged.gh, cwd });
assert.equal(incremental.status, "found");
assert.equal(incremental.review.id, 5130714400, "The latest of our reviews is the prior one");
assert.equal(incremental.relationship, "incremental");
assert.equal(incremental.comments.length, 1,
  "Only the prior review's own comments are kept: not another review's, and not a reply to ours");
assert.equal(incremental.comments[0].id, 3948685115);
// K1: the thumbs come from the listing already read, for that review's own
// comments only, and they live beside the comments rather than on them, so
// nothing that reads a retained comment can read its reception.
assert.deepEqual(incremental.feedback.comments.map(({ id, reactions }) => ({ id, reactions })),
  [{ id: 3948685115, reactions: { status: "read", plusOne: 2, minusOne: 1 } }],
  "Neither another review's comment nor a reply to ours lends its reactions");
assert.equal(Object.hasOwn(incremental.comments[0], "reactions"), false);
assert.equal(paged.calls.at(-1).path,
  `repos/${repository.nameWithOwner}/compare/${reviewedHead}...${currentHead}?per_page=1`);
assert.match(describePrior(incremental, currentHead), /incremental\. 3 commit\(s\) were added after it/);

// Two equal heads settle the relationship without a request, and a comparison
// this run never made has no place in its record.
const unchanged = priorGh({ reviews: [[toolReview({ commit_id: currentHead })]], comments: [[toolComment()]] });
const same = await discoverPriorReview(repository, target, { gh: unchanged.gh, cwd });
assert.equal(same.relationship, "same-head");
assert.equal(same.comparison, undefined, "Never record a comparison no request established");
assert(!unchanged.calls.some((call) => call.path.includes("/compare/")), "Equal heads ask nothing");
assert.match(describePrior(same, currentHead), /unchanged\. The reviewed head/);
// #29's Copilot review: the run said "retained verbatim" of an object whose
// anchor fields are renamed and whose nulls become undefined. Only the body is
// verbatim, and the sentence has to say which half is which.
assert.match(describePrior(same, currentHead),
  /1 inline comment\(s\) retained, bodies verbatim and anchors normalised/);

for (const [status, phrase] of [["behind", /diverged\. The reviewed head/], ["diverged", /GitHub reports diverged/]]) {
  const gh = priorGh({ reviews: [[toolReview()]], compare: comparisons[status] });
  const outcome = await discoverPriorReview(repository, target, { gh: gh.gh, cwd });
  assert.equal(outcome.relationship, "diverged");
  assert.equal(outcome.comparison.status, status);
  assert.match(describePrior(outcome, currentHead), phrase);
}

// A reviewed head GitHub can no longer reach leaves the relationship
// unmeasured. Calling it diverged would assert what no request established.
const gone = priorGh({ reviews: [[toolReview()]], unreachable: true });
const unmeasured = await discoverPriorReview(repository, target, { gh: gone.gh, cwd });
assert.equal(unmeasured.status, "found");
assert.equal(unmeasured.relationship, "unknown");
assert.match(unmeasured.reason, /404/);
assert.match(describePrior(unmeasured, currentHead), /unmeasured\. GitHub could not compare/);
console.log("PASS I1a the head relationship is measured, folded honestly, or reported as unmeasured");

// K1: thread resolution is not in REST, so it is one paginated GraphQL read of
// the pull request's review threads, matched to the earlier review's comments by
// the database id of the comment that opened each thread.
const received = [toolComment({ reactions: rollup({ "+1": 1 }) }),
  toolComment({ id: 3948685116, html_url: `${repository.url}/pull/7#discussion_r3948685116` }),
  toolComment({ id: 3948685117, html_url: `${repository.url}/pull/7#discussion_r3948685117`, reactions: undefined })];
const threadScenario = (threads) =>
  priorGh({ reviews: [[toolReview()]], comments: [received], compare: comparisons.ahead, threads });
const graphqlCalls = (scenario) => scenario.calls.filter((call) => call.path === "graphql");
const twoPages = threadScenario([
  // Another review's thread, and one of ours, on the first page.
  threadPage([[1, true], [3948685116, false]], { total: 4, next: true }),
  // One of ours resolved, and a thread whose opening comment is gone.
  threadPage([[3948685115, true], [null, false]], { total: 4 }),
]);
const receivedOutcome = await discoverPriorReview(repository, target, { gh: twoPages.gh, cwd });
assert.deepEqual(receivedOutcome.feedback, {
  threads: { status: "complete", pages: 2, listed: 4 },
  comments: [
    { id: 3948685115, reactions: { status: "read", plusOne: 1, minusOne: 0 }, thread: { status: "resolved" } },
    { id: 3948685116, reactions: { status: "read", plusOne: 0, minusOne: 0 }, thread: { status: "unresolved" } },
    { id: 3948685117, reactions: { status: "unread", reason: "GitHub returned no reactions rollup for this comment" },
      thread: { status: "unread", reason: "no review thread opens with this comment" } },
  ],
}, "A comment with no thread of its own is unread, never unresolved");
const [threadRead] = graphqlCalls(twoPages);
assert.equal(graphqlCalls(twoPages).length, 1, "One paginated query reads every page");
for (const field of ["query($owner: String!, $name: String!, $number: Int!, $endCursor: String)",
  "reviewThreads(first: 100, after: $endCursor)", "totalCount", "pageInfo { hasNextPage endCursor }",
  "isResolved", "comments(first: 1) { nodes { databaseId } }"]) {
  assert(threadRead.query.includes(field), `The thread query asks for ${field}`);
}
assert.doesNotMatch(threadRead.query, /mutation/i, "Sent as a POST, and still only a query");
assert.equal(receivedOutcome.relationship, "incremental", "The thread read changes no relationship");
assert.equal(twoPages.calls.at(-1).path,
  `repos/${repository.nameWithOwner}/compare/${reviewedHead}...${currentHead}?per_page=1`);

// A thread two threads claim to open says nothing about which state is true.
const doubled = threadScenario([threadPage([[3948685115, true], [3948685115, false], [3948685116, false]])]);
const doubledOutcome = await discoverPriorReview(repository, target, { gh: doubled.gh, cwd });
assert.equal(doubledOutcome.feedback.comments[0].thread.status, "unread");
assert.match(doubledOutcome.feedback.comments[0].thread.reason, /more than one review thread/);
assert.deepEqual(doubledOutcome.feedback.comments[1].thread, { status: "unresolved" });

// A listing that is readable but stops short reads what it reached and leaves
// the rest unread.
for (const [what, pages, reason] of [
  ["a last page that still reports a next page",
    [threadPage([[3948685115, true]], { total: 3, next: true })], /still reported a next page/],
  ["fewer threads than declared", [threadPage([[3948685115, true]], { total: 3 })], /1 thread\(s\) listed of 3 declared/],
  ["a declared count that changed between pages",
    [threadPage([[3948685115, true]], { total: 2, next: true }), threadPage([[1, false]], { total: 3 })],
    /changed between pages/],
]) {
  const scenario = threadScenario(pages);
  const outcome = await discoverPriorReview(repository, target, { gh: scenario.gh, cwd });
  assert.equal(outcome.feedback.threads.status, "incomplete", what);
  assert.match(outcome.feedback.threads.reason, reason, what);
  assert.deepEqual(outcome.feedback.comments[0].thread, { status: "resolved" },
    `A thread the listing did reach is read: ${what}`);
  for (const { thread } of outcome.feedback.comments.slice(1)) {
    assert.equal(thread.status, "unread", `Not reached is unread, never unresolved: ${what}`);
    assert.match(thread.reason, /incomplete review thread listing/, what);
  }
}

// A read that failed, or a page that is not the connection asked for, reads no
// thread at all. Discovery still stands, the relationship is still measured and
// the reactions already read are kept.
const unresolvedPage = threadPage([[3948685115, false]]);
for (const [what, threads, reason] of [
  ["GitHub's refusal", async () => {
    throw new Error("PR capture failed (api --hostname): HTTP 502 Bad Gateway");
  }, /502/],
  ["an unparsable response", async () => "{not json", /JSON/],
  ["no pages at all", [], /no pages/],
  ["GraphQL errors", [{ errors: [{ message: "Something went wrong" }], data: null }], /errors/],
  ["no pull request", [{ data: { repository: { pullRequest: null } } }], /not a review thread page/],
  ["an unreadable page after a readable one",
    [threadPage([[3948685115, true]], { total: 2, next: true }), { data: {} }], /not a review thread page/],
  ["a thread with no resolution state", [{ data: { repository: { pullRequest: { reviewThreads: {
    ...unresolvedPage.data.repository.pullRequest.reviewThreads,
    nodes: [{ isResolved: "yes", comments: { nodes: [{ databaseId: 3948685115 }] } }] } } } } }],
  /not a review thread/],
  ["a thread comment with no database id", [{ data: { repository: { pullRequest: { reviewThreads: {
    ...unresolvedPage.data.repository.pullRequest.reviewThreads,
    nodes: [{ isResolved: false, comments: { nodes: [{ databaseId: "3948685115" }] } }] } } } } }],
  /database id/],
]) {
  const scenario = threadScenario(threads);
  const outcome = await discoverPriorReview(repository, target, { gh: scenario.gh, cwd });
  assert.equal(outcome.status, "found", `A failed thread read never fails discovery: ${what}`);
  assert.equal(outcome.relationship, "incremental", `The relationship is still measured: ${what}`);
  assert.equal(outcome.feedback.threads.status, "failed", what);
  assert.match(outcome.feedback.threads.reason, reason, what);
  assert(outcome.feedback.comments.every(({ thread }) => thread.status === "unread"),
    `Nothing read is unread, never unresolved: ${what}`);
  assert.deepEqual(outcome.feedback.comments[0].reactions, { status: "read", plusOne: 1, minusOne: 0 },
    `A failed thread read loses no reaction: ${what}`);
}

// A cancellation during the thread read belongs to the run, not to the report.
const cancelling = new AbortController();
const cancelledRead = threadScenario(async () => {
  cancelling.abort(new DOMException("cancelled", "AbortError"));
  throw new Error("killed");
});
await assert.rejects(discoverPriorReview(repository, target, { gh: cancelledRead.gh, cwd, signal: cancelling.signal }),
  /killed/, "A cancelled thread read is never reported as a failed one");
await assert.rejects(collectPriorReview(repository, target, { gh: threadScenario(async () => {
  throw new Error("killed");
}).gh, cwd, signal: cancelling.signal }), /killed/);

// Nothing to read back means nothing is asked: no earlier review, or one that
// left no inline comment.
assert.equal(graphqlCalls(absent).length, 0, "No earlier review, no GraphQL call");
const bareScenario = priorGh({ reviews: [[toolReview({ commit_id: currentHead })]], comments: [[]] });
const bare = await discoverPriorReview(repository, target, { gh: bareScenario.gh, cwd });
assert.deepEqual(bare.feedback, { threads: { status: "none" }, comments: [] });
assert.equal(graphqlCalls(bareScenario).length, 0, "A review with no inline comment has no thread to read");
console.log("PASS K1 one paginated GraphQL read settles each thread it reached, and leaves the rest unread");

// K1: one line joins the prior-review block, directly under the comments it is
// about, and it counts only what was read.
const feedbackLines = (text) => text.split("\n").filter((line) => line.startsWith("Feedback on those comments:"));
const informationOnly = /Information only: no reviewer or verdict reads it, and a resolved thread is not evidence that a finding was fixed or was wrong\.$/;
{
  const described = describePrior(receivedOutcome, currentHead).split("\n");
  assert.equal(feedbackLines(described.join("\n")).length, 1, "Exactly one feedback line");
  assert.match(described[2], /^Feedback on those comments: 1 thread\(s\) resolved, 1 unresolved, 1 unread; reactions \+1 1, -1 0 on 2 comment\(s\), 1 unread\. /);
  assert.match(described[2], informationOnly);
  assert.match(described[1], /^3 inline comment\(s\) retained/, "The line sits under the comments it is about");

  // The shape the user was shown, where everything was read.
  const allRead = threadScenario([threadPage([[3948685115, true], [3948685116, true], [3948685117, true]])]);
  const allReadOutcome = await discoverPriorReview(repository, target, { gh: allRead.gh, cwd });
  allReadOutcome.feedback.comments[2].reactions = { status: "read", plusOne: 0, minusOne: 0 };
  assert.match(describePrior(allReadOutcome, currentHead),
    /^Feedback on those comments: 3 thread\(s\) resolved, 0 unresolved; reactions \+1 1, -1 0\. Information only: /m);

  const shortListing = threadScenario([threadPage([[3948685115, false]], { total: 3, next: true })]);
  assert.match(describePrior(await discoverPriorReview(repository, target, { gh: shortListing.gh, cwd }), currentHead),
    /^Feedback on those comments: 0 thread\(s\) resolved, 1 unresolved, 2 unread \(the thread listing was incomplete: the last page read still reported a next page\); /m);

  // gh's own error output spans lines; the report stays one line regardless.
  const refused = threadScenario(async () => {
    throw new Error("PR capture failed (api --hostname): Command failed: gh api graphql\nHTTP 502 Bad Gateway\n");
  });
  const refusedLines = feedbackLines(describePrior(
    await discoverPriorReview(repository, target, { gh: refused.gh, cwd }), currentHead));
  assert.equal(refusedLines.length, 1);
  assert.match(refusedLines[0], /^Feedback on those comments: thread resolution could not be read \(PR capture failed \(api --hostname\): Command failed: gh api graphql HTTP 502 Bad Gateway\), so all 3 thread\(s\) are unread; reactions \+1 1, -1 0 on 2 comment\(s\), 1 unread\. /);

  assert.equal(feedbackLines(describePrior(bare, currentHead))[0],
    "Feedback on those comments: none to read, as that review left no inline comment.");
  for (const [what, outcome] of [["no earlier review", none],
    ["a failed discovery", { status: "failed", relationship: "unknown", comments: [], reason: "boom" }],
    ["an outcome built without feedback", { ...receivedOutcome, feedback: undefined }]]) {
    assert.equal(feedbackLines(describePrior(outcome, currentHead)).length, 0, `No feedback line: ${what}`);
  }

  // The evidence line carries the same counts, the listing's own status and the
  // grouped reasons for what stayed unread, and no comment prose.
  assert.deepEqual(priorSummary(receivedOutcome).feedback, {
    threads: { status: "complete", pages: 2, listed: 4, resolved: 1, unresolved: 1, unread: 1,
      unreadReasons: { "no review thread opens with this comment": 1 } },
    reactions: { plusOne: 1, minusOne: 0, read: 2, unread: 1,
      unreadReasons: { "GitHub returned no reactions rollup for this comment": 1 } },
  });
  assert.deepEqual(priorSummary(bare).feedback,
    { threads: { status: "none", resolved: 0, unresolved: 0, unread: 0 }, reactions: { plusOne: 0, minusOne: 0, read: 0, unread: 0 } });
  assert.equal(priorSummary(none).feedback, undefined);
  assert(!JSON.stringify(priorSummary(receivedOutcome)).includes("Restore multiplication"));
}
console.log("PASS K1 one feedback line and one evidence summary report only what was read");

// Discovery grounds nothing a finding depends on, so a failure is reported as
// itself and the review still runs. A cancellation is never one of these.
const broken = await collectPriorReview(repository, target,
  { gh: async () => "{not json", cwd });
assert.equal(broken.status, "failed");
assert.equal(broken.relationship, "unknown");
assert.deepEqual(broken.comments, []);
assert.match(describePrior(broken, currentHead), /The review is unaffected and proceeds as an ordinary one/);
assert.match(describePrior(broken, currentHead), /makes no claim that none exists/);
const controller = new AbortController();
controller.abort(new DOMException("cancelled", "AbortError"));
await assert.rejects(collectPriorReview(repository, target, {
  gh: async () => { throw new Error("killed"); }, cwd, signal: controller.signal,
}), /killed/, "A cancellation belongs to the run, never to the discovery report");

// The two clauses that must survive every path where a prior review exists, each
// derived from the stage that settled it rather than asserted ahead of one.
const acts = /Fresh hunting is not confined to any commit range\./;
for (const outcome of [none, incremental, same, unmeasured]) {
  assert.match(describePrior(outcome, currentHead), acts);
}

const summarised = priorSummary(incremental);
assert.equal(summarised.comments, 1);
assert.equal(summarised.identity, identity.login);
assert(!JSON.stringify(summarised).includes("Restore multiplication"),
  "Comment prose stays out of the evidence line, as the diff and the context do");
const many = priorSummary({ ...incremental, comments: Array.from({ length: 25 }, () => incremental.comments[0]) }, 20);
assert.equal(many.anchors.length, 20);
assert.equal(many.undisplayedAnchors, 5);
console.log("PASS I1a a failed discovery is reported as itself and never fails the review");

// Wired into capture, so every run reports it before any reviewer starts and
// --capture-only reports it for free.
const logs = [];
const session = {
  rpc: { metadata: { snapshot: async () => ({ workingDirectory: cwd, isRemote: false }) } },
  capabilities: {}, log: async (message) => logs.push(message),
};
const history = [];
const capturing = async (args, directory) => {
  const path = args[5];
  const response = path?.endsWith("/reviews?per_page=100")
    ? JSON.stringify([[toolReview({ commit_id: "b".repeat(40) })]])
    : path?.endsWith("/comments?per_page=100") ? JSON.stringify([[toolComment()]])
      : respond(args, directory, history);
  history.push({ args, cwd: directory });
  return response;
};
const executed = await executeTargetCapture(session, "1", { gh: capturing });
assert.equal(executed.prior.status, "found");
assert.equal(executed.prior.relationship, "same-head");
// K1: the shared fixture answers the thread read as the read it is, rather than
// routing a GraphQL POST to its publication fixture and failing it.
assert.deepEqual(executed.prior.feedback.threads, { status: "complete", pages: 1, listed: 0 });
const evidence = logs.find((line) => line.startsWith("I1 prior: "));
assert(evidence, "A verbose run dumps the discovery evidence like every other stage");
assert.match(evidence, acts);
assert(!evidence.includes("Restore multiplication"), "Keep comment prose out of the parent timeline");
const quietLogs = [];
const quietSession = { ...session, log: async (message) => quietLogs.push(message) };
await executeTargetCapture(quietSession, "1", { gh: capturing, quiet: true });
assert(!quietLogs.some((line) => line.startsWith("I1 prior: ")), "Quiet drops the evidence dump");
assert(quietLogs.some((line) => acts.test(line)), "Quiet never drops what the run did about it");
// K1: the feedback line is part of what the run reports, so quiet keeps it, and
// the evidence dump carries its summary. The fixture's comment has a zero
// rollup and no review thread.
const fixtureFeedback = "Feedback on those comments: 0 thread(s) resolved, 0 unresolved, 1 unread; reactions +1 0, -1 0. ";
const printsFeedback = (message) => message.split("\n").some((line) => line.startsWith(fixtureFeedback));
assert(printsFeedback(evidence), "A verbose run prints the feedback line");
assert.match(evidence.split("\n")[0], /"feedback":\{"threads":\{"status":"complete","pages":1,"listed":0,"resolved":0,"unresolved":0,"unread":1,/);
assert(quietLogs.some(printsFeedback), "Quiet never drops the feedback line");
console.log("PASS I1a capture reports the prior review, verbosely and quietly, and confines nothing");
