import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  buildReviewPreview, cancelPreview, finishPreview, postingAuthority, validatePreview,
} from "../extensions/pr-review/preview.mjs";
import { reviewKey } from "../extensions/pr-review/findings.mjs";
import { retainedRecord, validateRecord } from "../extensions/pr-review/retention.mjs";
import { selectionBinding } from "../extensions/pr-review/selection.mjs";
import { retentionFixture } from "./retention-fixture.mjs";

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
  assert.match(h.messages[0], /PREVIEW ONLY/);
  assert.match(h.messages.at(-1), /Nothing was published/);
  const record = retainedRecord(result);
  assert.equal(record.schemaVersion, 2);
  validateRecord(record, h.parent.sessionId);
  if (expected === "confirmed") {
    assert.equal(h.requests[0].requestedSchema.properties.authorize.default, false);
    assert.match(h.requests[0].message, /PREVIEW ONLY.*will not submit/);
  }
}
console.log("PASS flag precedence, effective autoPostReviews seam, independent authority, missing UI and explicit confirmation");

const exact = await harness({ options: { comment: true } });
const request = buildReviewPreview(exact.outcome, exact.boundary);
assert.deepEqual(request, {
  binding: selectionBinding(exact.outcome),
  payload: {
    commit_id: "b".repeat(40), event: "COMMENT",
    body: "Quick review: 1 selected validated finding(s). Review coverage: completed. This is not a clean-review claim.",
    comments: [{
      path: "total.js", line: 3, side: "RIGHT",
      body: "[P2] Multiply cents by quantity\n\nWhen: total(100, 3)\n\nExpected: 300 cents\n\nActual: 103 cents\n\n" +
        "Introduced by this diff: The changed operator adds quantity instead of multiplying.\n\n" +
        "Confidence: 0.95. Reported by: correctness, contracts.",
    }],
  },
});
assert.equal(request.payload.comments.length, 1, "Rejected/raw/duplicate bodies never become comments");
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
assert.match(degradedResult.preview.request.payload.body, /INCOMPLETE/);
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
for (const prefix of ["COMMENT review", "Review preview:"]) {
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
