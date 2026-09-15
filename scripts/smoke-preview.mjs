import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  buildReviewPreview, cancelPreview, commentBody, finishPreview, postingAuthority, validatePreview,
} from "../extensions/pr-review/preview.mjs";
import { summaryBody } from "../extensions/pr-review/summary.mjs";
import { confinementCaveat } from "../extensions/pr-review/incremental.mjs";
import { reviewKey } from "../extensions/pr-review/findings.mjs";
import { retainedRecord, validateRecord } from "../extensions/pr-review/retention.mjs";
import { selectionBinding } from "../extensions/pr-review/selection.mjs";
import { retentionFixture } from "./retention-fixture.mjs";
import { formatCoverage } from "../extensions/pr-review/coverage.mjs";
import { toolReviewBody } from "../extensions/pr-review/prior.mjs";

for (const autoPostReviews of [true, false]) {
  for (const comment of [true, false]) {
    for (const noComment of [true, false]) {
      if (comment && noComment) {
        assert.throws(() => postingAuthority({ comment, noComment }, { autoPostReviews }), /Conflicting/);
        continue;
      }
      const authority = postingAuthority({ comment, noComment }, { autoPostReviews });
      assert.equal(authority.status, noComment ? "suppressed" : comment ? "flag-authorized"
        : autoPostReviews ? "config-authorized" : "confirmation-required");
      assert.equal(authority.authorized, !noComment && (comment || autoPostReviews));
      assert.equal(authority.submitted, false);
    }
  }
}
assert.equal(postingAuthority().status, "confirmation-required");
for (const policy of [{ comment: "true" }, { noComment: 1 }, { autoPostReviews: "false" }]) {
  assert.throws(() => postingAuthority(policy, policy), /booleans/);
}

async function harness({ options = {}, effective, ui = true, answer = { action: "accept", content: { authorize: true } } } = {}) {
  const sessionId = randomUUID();
  const { outcome, boundary } = await retentionFixture(sessionId, { includeBoundary: true });
  outcome.noComment = options.noComment ?? false;
  const controller = new AbortController();
  const messages = [];
  const requests = [];
  const parent = {
    sessionId, capabilities: { ui: { elicitation: ui } },
    ui: { async elicitation(request) {
      requests.push(request);
      return typeof answer === "function" ? answer(request) : answer;
    } },
    async log(message) { messages.push(message); },
  };
  return {
    outcome, boundary, controller, messages, requests, parent,
    run: () => finishPreview(parent, outcome, options, controller, boundary, effective),
  };
}
for (const [options, effective, ui, expected] of [
  [{ comment: true }, undefined, false, "flag-authorized"],
  [{ noComment: true }, { autoPostReviews: true }, false, "suppressed"],
  [{}, { autoPostReviews: true }, false, "config-authorized"],
  [{}, undefined, false, "unavailable"],
  [{}, undefined, true, "confirmed"],
]) {
  const h = await harness({ options, effective, ui });
  const result = await h.run();
  assert.equal(result.preview.status, expected);
  assert.equal(h.requests.length, expected === "confirmed" ? 1 : 0);
  assert.equal(result.complete, true);
  assert.equal(result.preview.submitted, false);
  assert.match(h.messages[0], /payload proposal/);
  assert.match(h.messages.at(-1), /No write has been attempted yet/);
  const record = retainedRecord(result);
  assert.equal(record.schemaVersion, 2);
  validateRecord(record, h.parent.sessionId);
  if (expected === "confirmed") {
    assert.equal(h.requests[0].requestedSchema.properties.authorize.default, false);
    assert.match(h.requests[0].message, /Acceptance authorizes publication after fresh/);
  }
}
console.log("PASS flag precedence, effective autoPostReviews seam, independent authority, missing UI and explicit confirmation");

const exact = await harness({ options: { comment: true } });
const request = buildReviewPreview(exact.outcome, exact.boundary);
assert.deepEqual(request, {
  binding: selectionBinding(exact.outcome),
  payload: {
    commit_id: "b".repeat(40), event: "COMMENT",
    body: "**Quick review: 1 finding (1 × P2)** at `bbbbbbb`\n\n" +
      "- P2 · Multiply cents by quantity · `total.js:3`\n\n" +
      "Coverage was complete. Finding nothing elsewhere does not mean nothing is there.\n\n" +
      "<!-- copilot-pr-review: mode=quick findings=1 coverage=completed -->",
    comments: [{
      path: "total.js", line: 3, side: "RIGHT",
      body: "[P2] Multiply cents by quantity\n\nWhen: total(100, 3)\n\nExpected: 300 cents\n\nActual: 103 cents\n\n" +
        "Introduced by this diff: The changed operator adds quantity instead of multiplying.\n\n" +
        "Fix: Multiply the unit price by quantity.\n\n" +
        "Confidence: 0.95. Reported by: correctness, contracts.",
    }],
  },
});
assert.equal(request.payload.comments.length, 1, "Rejected/raw/duplicate bodies never become comments");
// H1: a finding that relies on a project rule names it when presented, and never
// in its published comment, which carries no citation of any kind.
{
  const [finding] = exact.outcome.validation.findings;
  const ruled = { ...finding,
    rule: { file: "AGENTS.md", startLine: 3, endLine: 4, quote: "- **Totals multiply.**\n  Always.", blobSha: "e".repeat(40) } };
  assert.equal(commentBody(ruled), commentBody(finding));
  assert.doesNotMatch(commentBody(ruled), /Rule|AGENTS\.md/);
}
for (const kind of ["caveat", "coverage-gap", "execution-failure", "discarded-candidate", "mixed", "legacy"]) {
  const h = await harness({ options: { comment: true } });
  const diagnostics = [
    { kind: "caveat", message: "External library not independently audited." },
    { kind: "coverage-gap", message: "Changed adapter contract absent. Blocked assessment: compatibility cannot be settled." },
    { kind: "execution-failure", message: "contracts: invalid candidate output." },
    { kind: "discarded-candidate", message: "contracts:1: rejected at evidence boundary: breaks: Citation quote does " +
      "not match total.js head lines 1-2: the range names 2 line(s) and the quote has 3." },
  ].filter((entry) => kind === "mixed" || kind === "legacy" || entry.kind === kind);
  h.outcome.validation.diagnostics = diagnostics;
  h.outcome.validation.issues = diagnostics.filter((entry) => entry.kind !== "caveat").map((entry) => entry.message);
  h.outcome.complete = h.outcome.reviewComplete = h.outcome.validation.complete = kind === "caveat";
  h.outcome.coverage = h.outcome.complete ? "completed" : "incomplete";
  if (kind === "legacy") delete h.outcome.validation.diagnostics;
  const result = await h.run();
  const record = retainedRecord(result);
  validateRecord(record, h.parent.sessionId);
  assert.equal(result.preview.authorized, true);
  assert.equal(result.preview.request.payload.event, "COMMENT");
  // P6: one plain coverage sentence chosen by kind. The diagnostics themselves
  // stay in the terminal and the retained result and are never published.
  const body = result.preview.request.payload.body;
  const sentence = {
    caveat: "Coverage was complete.",
    "coverage-gap": "Coverage was partial: 1 part of the change could not be fully assessed.",
    "execution-failure": "Coverage was partial: part of the review did not run to completion.",
    "discarded-candidate": "Coverage was partial: 1 more possible issue was dropped unchecked because its " +
      "evidence could not be matched to the code.",
    mixed: "Coverage was partial: part of the review did not run to completion; 1 more possible issue was " +
      "dropped unchecked because its evidence could not be matched to the code; 1 part of the change could " +
      "not be fully assessed.",
    legacy: "Coverage was partial: 3 parts of the change could not be fully assessed.",
  }[kind];
  assert.equal(body, "**Quick review: 1 finding (1 × P2)** at `bbbbbbb`\n\n" +
    "- P2 · Multiply cents by quantity · `total.js:3`\n\n" +
    `${sentence} Finding nothing elsewhere does not mean nothing is there.\n\n` +
    `<!-- copilot-pr-review: mode=quick findings=1 coverage=${kind === "caveat" ? "completed" : "incomplete"} -->`, kind);
  for (const entry of diagnostics) assert(!body.includes(entry.message), `${kind} publishes no diagnostic`);
  // I1a recognises a published review of ours by its body, whatever coverage it reports.
  assert.equal(toolReviewBody(body)?.declaredFindings, 1, kind);
  // The terminal and retained presentation is unchanged.
  assert.match(formatCoverage(record.outcome), kind === "caveat" ? /^Review coverage: completed\./ : /INCOMPLETE/);
  if (kind === "legacy") assert.match(formatCoverage(result), /Legacy unclassified issue \(kept incomplete\)/);
}
// P6: severities counted in rank order, one line per finding in canonical
// order, a title folded onto one line with no HTML comment able to hide what
// follows it, and a basename unless two different paths would read the same.
assert.equal(summaryBody({
  mode: "balanced", head: "0123456789abcdef0123456789abcdef01234567", complete: true, diagnostics: [],
  findings: [
    { severity: "P2", title: "Second", path: "skills/a/SKILL.md", startLine: 176, endLine: 176 },
    { severity: "P1", title: "Spans\nlines  <!-- here", path: "skills/b/SKILL.md", startLine: 362, endLine: 364 },
    { severity: "nit", title: "Third", path: "src/total.js", startLine: 3, endLine: 3 },
    { severity: "P2", title: "Fourth", path: "skills/a/SKILL.md", startLine: 9, endLine: 9 },
  ],
}), "**Balanced review: 4 findings (1 × P1, 2 × P2, 1 × nit)** at `0123456`\n\n" +
  "- P2 · Second · `skills/a/SKILL.md:176`\n" +
  "- P1 · Spans lines &lt;!-- here · `skills/b/SKILL.md:362-364`\n" +
  "- nit · Third · `total.js:3`\n" +
  "- P2 · Fourth · `skills/a/SKILL.md:9`\n\n" +
  "Coverage was complete. Finding nothing elsewhere does not mean nothing is there.\n\n" +
  "<!-- copilot-pr-review: mode=balanced findings=4 coverage=completed -->");
assert.match(summaryBody({ mode: "deep", head: "a".repeat(40), complete: false, diagnostics: [
  { kind: "discarded-candidate", message: "a" }, { kind: "discarded-candidate", message: "b" },
  { kind: "coverage-gap", message: "c" }, { kind: "coverage-gap", message: "d" },
], findings: [{ severity: "P0", title: "Only", path: "x/y.js", startLine: 1, endLine: 1 }] }),
/^\*\*Deep review: 1 finding \(1 × P0\)\*\* at `aaaaaaa`\n\n- P0 · Only · `y\.js:1`\n\nCoverage was partial: 2 more possible issues were dropped unchecked because their evidence could not be matched to the code; 2 parts of the change could not be fully assessed\. /);
// A run that is incomplete for a reason no diagnostic names still says so.
assert.match(summaryBody({ mode: "quick", head: "a".repeat(40), complete: false, diagnostics: [],
  findings: [{ severity: "P1", title: "Only", path: "y.js", startLine: 1, endLine: 1 }] }),
/\n\nCoverage was partial\. Finding nothing elsewhere does not mean nothing is there\.\n\n.*coverage=incomplete -->$/);
// #55's review: a path is pull-request-controlled, and a backtick in it must not
// close the location's code span, where `<!--` would open a comment hiding the
// coverage sentence. The span's delimiter outruns any backtick run in the path,
// and a line break cannot end the finding's line.
{
  const location = (path) => summaryBody({ mode: "quick", head: "a".repeat(40), complete: false, diagnostics: [],
    findings: [{ severity: "P1", title: "Only", path, startLine: 3, endLine: 3 }] }).split("\n")[2];
  assert.equal(location("dir/report`<!--.js"), "- P1 · Only · ``report`<!--.js:3``");
  assert.equal(location("``x.js"), "- P1 · Only · ``` ``x.js:3 ```");
  assert.equal(location("a\n\n<!--b.js"), "- P1 · Only · `a <!--b.js:3`");
}
// P6, at the user's decision: a confined run still says on GitHub that it does
// not cover the whole pull request, as I1b promised, and nothing else of its
// caveat. Only the caveat incremental.mjs builds carries it, not one quoting it.
{
  const caveat = confinementCaveat({ status: "confined", range: { commits: 3, priorHead: "1".repeat(40) } }, 2);
  const input = (diagnostics) => ({ mode: "quick", head: "a".repeat(40), complete: true, diagnostics,
    findings: [{ severity: "P1", title: "Only", path: "y.js", startLine: 1, endLine: 1 }] });
  const body = summaryBody(input([{ kind: "caveat", message: "Unrelated caveat." }, caveat]));
  assert(body.endsWith("Coverage was complete. Finding nothing elsewhere does not mean nothing is there.\n\n" +
    "This review only looked at the commits added since this tool's earlier review, so it does not cover " +
    "the whole pull request.\n\n<!-- copilot-pr-review: mode=quick findings=1 coverage=completed -->"), body);
  assert(!body.includes("1".repeat(40)) && !body.includes("Unrelated caveat"), body);
  assert(!summaryBody(input([{ kind: "caveat", message: `Reviewer note: ${caveat.message}` }]))
    .includes("This review only looked"));
}
// P6: a result retained before P6 holds a proposal with the old body. It still
// loads, because an unreadable record refuses every later review in that
// session, and nothing else in that proposal may differ from what the retained
// findings rebuild.
{
  const earlier = await harness({ options: { comment: true } });
  const retained = await earlier.run();
  const before = "Quick review: 1 selected validated finding(s). Review coverage: completed.\n" +
    "Execution failures: 0; discarded candidates: 0; coverage gaps: 0; informational caveats: 0.\n" +
    "This is not a clean-review claim.";
  retained.preview.request.payload.body = before;
  validateRecord(retainedRecord(retained), earlier.parent.sessionId);
  for (const mutate of [
    (request) => { request.payload.body = before.replace("completed", "INCOMPLETE"); },
    (request) => { request.payload.body = `${before} `; },
    (request) => { request.payload.comments[0].line++; },
  ]) {
    const altered = structuredClone(retained);
    mutate(altered.preview.request);
    assert.throws(() => validateRecord(retainedRecord(altered), earlier.parent.sessionId), /changed request/);
  }
}
console.log("PASS P6 published summaries by coverage kind, marker, locations, confinement and pre-P6 proposals");
const finding = exact.outcome.validation.findings[0];
finding.location = { ...finding.before };
let comments = buildReviewPreview(exact.outcome, exact.boundary).payload.comments;
assert.deepEqual({ ...comments[0], body: undefined }, { path: "total.js", line: 3, side: "LEFT", body: undefined });
finding.location = exact.boundary.cite({
  path: "total.js", side: "head", startLine: 2, endLine: 3,
  quote: "export function total(cents, quantity) {\n  return cents + quantity;",
});
comments = buildReviewPreview(exact.outcome, exact.boundary).payload.comments;
assert.deepEqual({ ...comments[0], body: undefined }, {
  path: "total.js", line: 3, side: "RIGHT", start_line: 2, start_side: "RIGHT", body: undefined,
});
// Controlled path-mapping cases isolate rename/deletion behavior from source retrieval.
for (const renamed of [true, false]) {
  const h = await harness();
  const f = h.outcome.validation.findings[0];
  f.location = { ...f.before };
  h.outcome.binding.paths[0].path = renamed ? "renamed.js" : "total.js";
  h.outcome.binding.paths[0].status = renamed ? "renamed" : "deleted";
  h.outcome.selection.binding = selectionBinding(h.outcome);
  const boundary = {
    ...h.boundary, key: reviewKey(h.outcome.binding),
    files: h.boundary.files.map((file) => ({ ...file, newPath: renamed ? "renamed.js" : null })),
  };
  const comment = buildReviewPreview(h.outcome, boundary).payload.comments[0];
  assert.equal(comment.path, renamed ? "renamed.js" : "total.js");
  assert.equal(comment.side, "LEFT");
}
console.log("PASS exact COMMENT-only payload, canonical deduplication, head/base, multiline, rename/deletion path mapping");

for (const mutate of [
  (h) => { h.outcome.selection.findingIds = ["raw"]; },
  (h) => { h.outcome.selection.findingIds = ["contracts:1"]; },
  (h) => { h.outcome.selection.findingIds = ["security-performance-resources:1"]; },
  (h) => { h.outcome.selection.findingIds.push(h.outcome.selection.findingIds[0]); },
  (h) => { h.outcome.binding.head = "c".repeat(40); },
  (h) => { h.outcome.binding.repository.id = "other"; },
  (h) => { h.outcome.binding.number++; },
  (h) => { h.outcome.binding.pullId = "other"; },
  (h) => { h.outcome.invocation.invocationId = randomUUID(); },
  (h) => { h.outcome.selection.binding.sessionId = "other"; },
  (h) => { h.boundary.key = "bad"; },
  (h) => { h.outcome.validation.findings[0].validation.allClaimsSupported = false; },
  (h) => { h.outcome.validation.findings[0].location.quote = "false quote"; },
  (h) => { h.outcome.validation.findings[0].location.ref = "c".repeat(40); },
  (h) => { h.outcome.validation.findings[0].location = h.outcome.validation.findings[0].evidence[0]; },
  (h) => { h.outcome.validation.findings[0].location.endLine = 100; },
  (h) => { h.outcome.validation.findings[0].location = null; },
  (h) => { h.boundary.files[0].hunks = []; },
]) {
  const h = await harness({ options: { comment: true } });
  mutate(h);
  assert.throws(() => buildReviewPreview(h.outcome, h.boundary));
  const result = await h.run();
  assert.equal(result.preview.status, "failed");
  assert.equal(result.preview.authorized, false);
  assert.equal(result.preview.request, undefined, "Invalid anchors never fall back to a body-only payload");
  assert.match(h.messages.at(-1), /Error:/);
}
console.log("PASS invalid IDs, anchors, evidence and invocation/session/repository/PR/head bindings fail closed");

for (const answer of [
  { action: "decline" }, { action: "accept", content: { authorize: false } },
  { action: "cancel" }, {}, { action: "accept", content: { authorize: "true" } },
  { action: "accept", content: { authorize: true, extra: 1 } },
  () => { throw new Error("UI unavailable"); },
]) {
  const h = await harness({ answer });
  const result = await h.run();
  assert.equal(result.preview.authorized, false);
  const status = answer.action === "cancel" ? "cancelled" : answer.action === "decline" ||
    answer.content?.authorize === false ? "declined" : "failed";
  assert.equal(result.preview.status, status);
  validateRecord(retainedRecord(result), h.parent.sessionId);
  if (status === "cancelled") assert.deepEqual(result.selection.findingIds, []);
}
for (const status of ["none", "empty", "unavailable", "failed", "not-started"]) {
  const h = await harness({ options: { comment: true } });
  h.outcome.selection = { status, findingIds: [] };
  if (status === "empty") h.outcome.validation = { complete: true, findings: [], rejected: [], duplicates: [], issues: [] };
  if (status === "not-started") {
    delete h.outcome.validation;
    h.outcome.complete = false;
    h.outcome.coverage = "not-started";
  }
  const result = await h.run();
  assert.equal(result.preview.authorized, false);
  assert.equal(result.preview.request, undefined);
  assert.equal(h.requests.length, 0);
  validateRecord(retainedRecord(result), h.parent.sessionId);
}
const degraded = await harness();
degraded.outcome.complete = false;
degraded.outcome.reviewComplete = false;
degraded.outcome.coverage = "incomplete";
const degradedResult = await degraded.run();
assert.equal(degradedResult.preview.authorized, true, "Degraded validated findings can still be authorized");
assert.match(degradedResult.preview.request.payload.body,
  /\n\nCoverage was partial\. Finding nothing elsewhere does not mean nothing is there\.\n\n.*coverage=incomplete -->$/);
assert.match(degraded.requests[0].message, /INCOMPLETE/);
validateRecord(retainedRecord(degradedResult), degraded.parent.sessionId);
console.log("PASS decline, false/malformed/failed UI, empty/unavailable selection, and explicit degraded coverage");

for (const settle of ["accept", "reject"]) {
  const pending = Promise.withResolvers();
  const requested = Promise.withResolvers();
  const h = await harness({ answer(request) { requested.resolve(request); return pending.promise; } });
  const run = h.run();
  await requested.promise;
  h.controller.abort(new DOMException("manual cancellation", "AbortError"));
  const result = await run;
  assert.equal(result.preview.status, "cancelled");
  assert.equal(result.preview.request, undefined);
  assert.deepEqual(result.selection.findingIds, []);
  validateRecord(retainedRecord(result), h.parent.sessionId);
  const count = h.messages.length;
  if (settle === "accept") pending.resolve({ action: "accept", content: { authorize: true } });
  else pending.reject(new Error("late transport failure"));
  await new Promise(setImmediate);
  assert.equal(h.messages.length, count);
}
for (const prefix of ["COMMENT review", "Review proposal:"]) {
  const h = await harness({ options: { comment: true } });
  h.parent.log = async (message) => {
    h.messages.push(message);
    if (message.startsWith(prefix)) h.controller.abort(new DOMException("log cancellation", "AbortError"));
  };
  const result = await h.run();
  assert.equal(result.preview.status, "cancelled");
  assert.equal(result.preview.authorized, false);
  assert.equal(result.preview.request, undefined);
  validateRecord(retainedRecord(result), h.parent.sessionId);
}
for (const mutation of [
  (h) => { h.parent.sessionId = randomUUID(); },
  (h) => { h.outcome.binding.head = "c".repeat(40); },
  (h) => { h.outcome.selection.findingIds = []; },
  (h) => { h.outcome.validation.findings[0].actual = "changed"; },
]) {
  const h = await harness({ answer() { mutation(h); return { action: "accept", content: { authorize: true } }; } });
  const result = await h.run();
  assert.equal(result.preview.status, "failed");
  assert.equal(result.preview.request, undefined);
  assert.match(result.preview.error, /changed during preview/);
}
console.log("PASS pending confirmation cancellation, inert late answers, log-boundary cancellation and changed proposal refusal");

const h = await harness();
const settled = await h.run();
for (const mutate of [
  (r) => { r.schemaVersion = 1; },
  (r) => { delete r.outcome.preview; },
  (r) => { r.outcome.preview.submitted = true; },
  (r) => { r.outcome.preview.authorized = false; },
  (r) => { r.outcome.preview.policy.noComment = true; },
  (r) => { r.outcome.preview.status = "flag-authorized"; },
  (r) => { r.outcome.preview.request.payload.event = "APPROVE"; },
  (r) => { r.outcome.preview.request.payload.event = "REQUEST_CHANGES"; },
  (r) => { r.outcome.preview.request.payload.commit_id = "c".repeat(40); },
  (r) => { r.outcome.preview.request.binding.number++; },
  (r) => { r.outcome.preview.request.payload.comments[0].line++; },
  (r) => { r.outcome.preview.request.payload.comments[0].path = "other.js"; },
  (r) => { r.outcome.preview.request.payload.comments[0].side = "LEFT"; },
  (r) => { r.outcome.preview.request.payload.comments[0].body += " tampered"; },
  (r) => { r.outcome.preview.request.payload.body = "Clean review"; },
  (r) => { r.outcome.preview.request.payload.comments = []; },
  (r) => { r.outcome.preview.extra = "unknown"; },
]) {
  const record = retainedRecord(settled);
  mutate(record);
  record.digest = reviewKey(record.outcome);
  assert.throws(() => validateRecord(record, h.parent.sessionId));
}
cancelPreview(settled);
validatePreview(settled);
assert.equal(settled.preview.request, undefined);
const legacy = retainedRecord(await retentionFixture(h.parent.sessionId));
assert.equal(legacy.schemaVersion, 1);
validateRecord(legacy, h.parent.sessionId);
assert.equal(legacy.outcome.preview, undefined, "Legacy records gain neither preview nor authority");
console.log("PASS strict version-2 retained previews, altered payload/authority rejection, and read-only legacy compatibility");

// W1: a result retained before remediation sentences existed still loads and
// inspects, but publishing it is refused: every published finding carries its
// sentence, and code refuses one that has none rather than posting without it.
{
  const earlier = await harness({ options: { comment: true } });
  const current = await earlier.run();
  for (const finding of current.validation.findings) delete finding.remediation;
  const [comment] = current.preview.request.payload.comments;
  comment.body = comment.body.replace("\n\nFix: Multiply the unit price by quantity.", "");
  assert(!comment.body.includes("Fix:"), "The body an earlier run stored had no Fix paragraph");
  validateRecord(retainedRecord(current), earlier.parent.sessionId);
  assert.throws(() => buildReviewPreview(current, earlier.boundary), /remediation sentence/);
  // Nor does a sentence that is not one line get posted, whatever a record holds.
  for (const finding of current.validation.findings) finding.remediation = "Multiply instead.\nThen retest.";
  assert.throws(() => buildReviewPreview(current, earlier.boundary), /remediation sentence/);
  // Nor do two sentences become one merely because they share a physical line.
  for (const finding of current.validation.findings) finding.remediation = "Multiply instead. Then retest.";
  assert.throws(() => buildReviewPreview(current, earlier.boundary), /remediation sentence/);
  // And a code block in any published field is refused at publication as well,
  // because a retained record never passed back through the evidence boundary.
  for (const finding of current.validation.findings) {
    finding.remediation = "Multiply the unit price by quantity.";
    finding.actual = "103 cents\n\n```suggestion\nreturn cents * quantity;\n```";
  }
  assert.throws(() => buildReviewPreview(current, earlier.boundary), /code block/);
  console.log("PASS W1 a result retained before remediation sentences still loads, and publishing it, or a code block, is refused");
}
