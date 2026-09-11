import assert from "node:assert/strict";
import {
  classifyComparison, collectPriorReview, describePrior, discoverPriorReview, identityFrom,
  isPriorReview, priorCommentFrom, priorReviewFrom, priorSummary, toolReviewBody,
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

function toolComment(overrides = {}) {
  return {
    id: 3948685115, pull_request_review_id: 5130714400,
    html_url: `${repository.url}/pull/7#discussion_r3948685115`,
    path: "total.js", side: "RIGHT", start_side: null, line: 3, start_line: null,
    original_line: 3, original_start_line: null,
    commit_id: currentHead, original_commit_id: reviewedHead,
    body: "[P2] Restore multiplication when calculating total cents\n\nWhen: any call.",
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

function priorGh({ reviews = [[]], comments = [[]], compare, unreachable = false } = {}) {
  const calls = [];
  const gh = async (args, directory, options) => {
    assert.equal(directory, cwd);
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

// Every page of both listings is read, so a page boundary can never be the
// reason a prior review looks absent.
const paged = priorGh({
  reviews: [[toolReview({ id: 1, submitted_at: "2026-09-07T09:00:00Z", commit_id: "9".repeat(40) })],
    [toolReview()]],
  comments: [[toolComment({ id: 1, pull_request_review_id: 999 })], [toolComment()]],
  compare: comparisons.ahead,
});
const incremental = await discoverPriorReview(repository, target, { gh: paged.gh, cwd });
assert.equal(incremental.status, "found");
assert.equal(incremental.review.id, 5130714400, "The latest of our reviews is the prior one");
assert.equal(incremental.relationship, "incremental");
assert.equal(incremental.comments.length, 1, "Only the prior review's own comments are kept");
assert.equal(incremental.comments[0].id, 3948685115);
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

// The one sentence that must survive every path where a prior review exists.
const acts = /reports the prior review and acts on none of it/;
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
const evidence = logs.find((line) => line.startsWith("I1 prior: "));
assert(evidence, "A verbose run dumps the discovery evidence like every other stage");
assert.match(evidence, acts);
assert(!evidence.includes("Restore multiplication"), "Keep comment prose out of the parent timeline");
const quietLogs = [];
const quietSession = { ...session, log: async (message) => quietLogs.push(message) };
await executeTargetCapture(quietSession, "1", { gh: capturing, quiet: true });
assert(!quietLogs.some((line) => line.startsWith("I1 prior: ")), "Quiet drops the evidence dump");
assert(quietLogs.some((line) => acts.test(line)), "Quiet never drops what the run did about it");
console.log("PASS I1a capture reports the prior review, verbosely and quietly, and acts on none of it");
