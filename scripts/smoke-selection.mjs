import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { finishSelection, selectFindings } from "../extensions/pr-review/selection.mjs";
import { reviewKey } from "../extensions/pr-review/findings.mjs";

function fixture({ all = false, complete = true, answer, ui = true } = {}) {
  const controller = new AbortController();
  const requests = [];
  const messages = [];
  const outcome = {
    invocation: { invocationId: randomUUID(), sessionId: "parent-session" },
    binding: {
      repository: { id: "repo", host: "github.com", nameWithOwner: "fixture/repository" },
      number: 12, pullId: "pull-12", head: "b".repeat(40), base: "a".repeat(40),
      diffSha256: "diff", contextSha256: "context", paths: [],
    },
    complete, cancelled: false, coverage: complete ? "completed" : "incomplete", cleanupErrors: [],
    validation: {
      findings: [1, 2, 3].map((id) => ({
        id: `candidate-${id}`, severity: id === 1 ? "P1" : "P2", title: `Supported defect ${id}`,
        confidence: 0.99, location: { path: "total.js", side: "head", startLine: id, endLine: id },
      })),
      rejected: [{ id: "rejected-id" }], duplicates: [{ id: "duplicate-id" }],
    },
    reviewers: [{ result: "raw-id" }],
  };
  const parent = {
    sessionId: "parent-session", capabilities: { ui: { elicitation: ui } },
    ui: { async elicitation(request) { requests.push(request); return answer(request); } },
    async log(message) { messages.push(message); },
  };
  return {
    parent, outcome, controller, requests, messages,
    select: () => selectFindings(parent, outcome, { all, controller }),
    finish: () => finishSelection(parent, outcome, { all }, controller),
  };
}
const values = (request) => request.requestedSchema.properties.findingIds.items.anyOf.map((item) => item.const);
const accept = (ids) => ({ action: "accept", content: { findingIds: ids } });

const all = fixture({ all: true, ui: false });
const selectedAll = await all.select();
assert.deepEqual(selectedAll.findingIds, ["candidate-1", "candidate-2", "candidate-3"]);
assert.equal(all.requests.length, 0);
assert.deepEqual(selectedAll.binding, {
  ...all.outcome.invocation, repository: all.outcome.binding.repository, number: 12, pullId: "pull-12",
  head: all.outcome.binding.head, reviewKey: reviewKey(all.outcome.binding),
});
for (const complete of [true, false]) {
  const subset = fixture({ complete, answer: (request) => accept([values(request)[2], values(request)[0]]) });
  const result = await subset.finish();
  assert.deepEqual(result.selection.findingIds, ["candidate-1", "candidate-3"]);
  assert.equal(result.complete, complete);
  assert.equal(result.coverage, complete ? "completed" : "incomplete");
  assert.match(subset.requests[0].message, complete ? /Completed review/ : /INCOMPLETE review/);
  assert(subset.requests[0].requestedSchema.properties.findingIds.items.anyOf.every((choice) =>
    /\[P[12]\].*total.js:\d-\d \(head\); confidence 0.99/.test(choice.title)));
  assert(subset.messages.some((message) => /Nothing was published/.test(message)));
}
for (const answer of [() => accept([]), () => ({ action: "decline" })]) {
  assert.equal((await fixture({ answer }).select()).status, "none");
}
const cancelled = fixture({ answer: () => ({ action: "cancel" }) });
const cancelledReport = await cancelled.finish();
assert.equal(cancelledReport.selection.status, "cancelled");
assert.deepEqual(cancelledReport.selection.findingIds, []);
assert.equal(cancelledReport.complete, false);
assert.equal(cancelledReport.reviewComplete, true);
assert.equal(cancelledReport.coverage, "incomplete");
assert.equal(cancelled.controller.signal.aborted, true);
assert.equal((await fixture({ ui: false }).select()).status, "unavailable");
for (const all of [true, false]) {
  const empty = fixture({ all });
  empty.outcome.validation.findings = [];
  assert.equal((await empty.select()).status, "empty");
  assert.equal(empty.requests.length, 0);
}
const skipped = fixture();
delete skipped.outcome.validation;
assert.equal((await skipped.select()).status, "not-started");
const preCancelled = fixture({ all: true });
preCancelled.controller.abort(new DOMException("cancel", "AbortError"));
assert.equal((await preCancelled.select()).status, "cancelled");
console.log("PASS all/subset/none/decline/cancel, unavailable UI, empty/skipped results and degraded coverage");

for (const answer of [
  () => undefined, () => ({ action: "other" }), () => ({ action: "accept" }),
  () => ({ action: "accept", content: {} }),
  () => ({ action: "accept", content: { findingIds: "candidate-1" } }),
  (request) => ({ action: "accept", content: { findingIds: [values(request)[0]], extra: true } }),
  (request) => accept([values(request)[0], values(request)[0]]),
  () => accept([null]), () => accept([42]), () => accept(["candidate-1"]),
  () => accept(["rejected-id"]), () => accept(["raw-id"]), () => accept(["duplicate-id"]),
  (request) => accept([values(request)[0], "unknown"]),
]) {
  const f = fixture({ answer });
  const result = await f.finish();
  assert.equal(result.selection.status, "failed");
  assert.deepEqual(result.selection.findingIds, []);
  assert.match(result.selection.error, /Invalid or unknown/);
  assert(f.messages.some((message) => /Invalid or unknown/.test(message)));
}
const transport = fixture({ answer() { throw new Error("UI transport failed"); } });
assert.match((await transport.finish()).selection.error, /UI transport failed/);
const duplicate = fixture({ all: true });
duplicate.outcome.validation.findings.push(duplicate.outcome.validation.findings[0]);
await assert.rejects(duplicate.select(), /Invalid validated finding identities/);
const wrongSession = fixture({ all: true });
wrongSession.parent.sessionId = "other-session";
await assert.rejects(wrongSession.select(), /originating invocation and session/);
for (const mutate of [
  (f) => { f.parent.sessionId = "other-session"; },
  (f) => { f.outcome.binding.head = "c".repeat(40); },
  (f) => { f.outcome.binding.repository.id = "other-repo"; },
  (f) => { f.outcome.binding.number = 13; },
  (f) => { f.outcome.invocation.invocationId = randomUUID(); },
  (f) => { f.outcome.invocation.sessionId = "other-session"; },
]) {
  const f = fixture({ answer(request) { mutate(f); return accept([values(request)[0]]); } });
  await assert.rejects(f.select(), /binding changed/);
}
let stale;
await fixture({ answer(request) { stale = values(request)[0]; return accept([]); } }).select();
await assert.rejects(fixture({ answer: () => accept([stale]) }).select(), /Invalid or unknown/);
console.log("PASS invalid/unknown/raw/rejected/duplicate selections and changed/stale invocation bindings fail closed");

for (const settle of ["accept", "reject"]) {
  const pending = Promise.withResolvers();
  const requested = Promise.withResolvers();
  const f = fixture({ answer(request) { requested.resolve(request); return pending.promise; } });
  const finished = f.finish();
  const request = await requested.promise;
  f.controller.abort(new DOMException("manual cancellation", "AbortError"));
  const result = await finished;
  assert.equal(result.selection.status, "cancelled");
  assert.deepEqual(result.selection.findingIds, []);
  const before = f.messages.length;
  if (settle === "accept") pending.resolve(accept([values(request)[0]]));
  else pending.reject(new Error("late UI failure"));
  await new Promise(setImmediate);
  assert.equal(f.messages.length, before, "Late UI completion cannot resume cancelled selection");
}
console.log("PASS manual cancellation without answering UI and inert late acceptance/rejection");

for (const cancelDuringLog of [false, true]) {
  const f = fixture({ all: true });
  if (cancelDuringLog) {
    const log = f.parent.log;
    f.parent.log = async (message) => {
      await log(message);
      if (message.startsWith("Finding selection:")) f.controller.abort(new DOMException("cancel", "AbortError"));
    };
  } else {
    queueMicrotask(() => f.controller.abort(new DOMException("cancel", "AbortError")));
  }
  const result = await f.finish();
  assert.equal(result.cancelled, true);
  assert.equal(result.selection.status, "cancelled");
  assert.deepEqual(result.selection.findingIds, []);
  const evidence = JSON.parse(f.messages.find((message) => message.startsWith("P1 evidence: ")).slice(13));
  assert.deepEqual(evidence.selection.findingIds, []);
}
console.log("PASS cancellation at selection completion invalidates selected IDs before final evidence");
