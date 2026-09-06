import assert from "node:assert/strict";
import {
  parseFixtureArgs, reasoningEfforts, subscriptionModels, validateAssignments,
  runReviewer,
} from "../extensions/pr-review/fixture.mjs";
import { reviewerPolicy, assertNoReviewerTools, probeForbiddenTools } from "../extensions/pr-review/read-only.mjs";
import { executeFixtureRun } from "../extensions/pr-review/fixture-run.mjs";

const command = "fixture model1=model-a effort1=low model2=model-b effort2=high";
const settings = parseFixtureArgs(command);
const catalog = [
  { id: "model-a", policy: { state: "enabled" }, capabilities: { supports: { reasoning_effort: ["low", "high"] } } },
  { id: "model-b", capabilities: { supports: { reasoning_effort: ["high"] } } },
  { id: "disabled", policy: { state: "disabled" } },
  { id: "unconfigured", policy: { state: "unconfigured" } },
  { id: "external/model-a" },
  { id: "auto" },
  { id: "no-reasoning" },
];
assert.deepEqual(validateAssignments(settings, catalog), [
  { label: "rounding", model: "model-a", reasoningEffort: "low" },
  { label: "shipping", model: "model-b", reasoningEffort: "high" },
]);
assert.deepEqual(parseFixtureArgs(`  ${command}  `), settings);
assert.deepEqual(subscriptionModels(catalog).map((model) => model.id),
  ["model-a", "model-b", "no-reasoning"]);
assert.deepEqual(reasoningEfforts({}), []);
assert.deepEqual(reasoningEfforts({ capabilities: { supports: { reasoning_effort: true } } }), []);

for (const args of [
  "fixture",
  "fixture model1=model-a",
  `${command} model1=model-a`,
  `${command} extra=value`,
  command.replace("effort1=low", "effort1="),
  command.replace("effort1=low", "effort1=low=high"),
  command.replace("model2=model-b", "model2=model-a"),
  command.replace("effort2=high", "effort2=low"),
]) {
  assert.throws(() => parseFixtureArgs(args), /requires|requires explicit|Invalid/);
}
for (const model1 of ["missing", "disabled", "unconfigured", "external/model-a", "auto"]) {
  assert.throws(() => validateAssignments({ ...settings, model1 }, catalog), /No substitution/);
}
for (const override of [
  { effort1: "max" },
  { model1: "no-reasoning" },
]) {
  assert.throws(() => validateAssignments({ ...settings, ...override }, catalog), /Unsupported reasoning/);
}
assert.throws(() => validateAssignments({ ...settings, extra: "value" }, catalog), /requires explicit/);
assert.throws(() => validateAssignments(settings, []), /Unavailable/);
console.log("PASS fixture argument, subscription policy, and reasoning validation (no models run)");

const policyEvidence = { permissionDenials: [], toolDenials: [] };
const policy = reviewerPolicy(policyEvidence);
assert.equal(policy.enableConfigDiscovery, false);
assert.deepEqual(policy.availableTools, []);
for (const kind of ["write", "shell", "read", "url", "custom-tool"]) {
  assert.equal((await policy.onPermissionRequest({ kind })).kind, "denied-no-approval-rule");
}
assert.equal((await policy.hooks.onPreToolUse({ toolName: "task" })).permissionDecision, "deny");
assert.deepEqual(policyEvidence.toolDenials, ["task"]);

function fakeSession(events, sendError) {
  const handlers = new Set();
  return {
    sessionId: "fake-reviewer",
    abortCount: 0,
    on(handler) { handlers.add(handler); return () => handlers.delete(handler); },
    async send() {
      if (sendError) throw sendError;
      for (const event of events) {
        for (const handler of handlers) handler({ timestamp: new Date().toISOString(), data: {}, ...event });
      }
    },
    async abort() { this.abortCount++; },
    get listenerCount() { return handlers.size; },
  };
}

for (const [events, sendError, expected] of [
  [[{ type: "assistant.message", data: { content: "retained output" } }, { type: "session.idle" }], undefined, "completed"],
  [[{ type: "session.error", data: { message: "explicit runtime error" } }], undefined, "incomplete"],
  [[{ type: "session.shutdown" }], undefined, "incomplete"],
  [[{ type: "tool.execution_start" }], undefined, "incomplete"],
  [[{ type: "session.idle" }], undefined, "incomplete"],
  [[], new Error("send disconnected"), "incomplete"],
]) {
  const fake = fakeSession(events, sendError);
  const result = await runReviewer(fake, "fixture");
  assert.equal(result.status, expected);
  assert.equal(fake.abortCount, expected === "completed" ? 0 : 1);
  assert.equal(fake.listenerCount, 0);
}
for (const alreadyAborted of [false, true]) {
  const controller = new AbortController();
  const fake = fakeSession([]);
  fake.abort = async () => {
    await new Promise(setImmediate);
    fake.abortCount++;
  };
  if (alreadyAborted) controller.abort(new DOMException("manual cancellation", "AbortError"));
  const pending = runReviewer(fake, "fixture", { signal: controller.signal });
  controller.abort(new DOMException("manual cancellation", "AbortError"));
  assert.equal((await pending).status, "cancelled");
  assert.equal(fake.abortCount, 1);
  assert.equal(fake.listenerCount, 0);
}
const injected = fakeSession([{ type: "assistant.turn_start" }]);
assert.match((await runReviewer(injected, "fixture", { injectFailure: true })).error, /Injected reviewer failure/);
assert.equal(injected.abortCount, 1);
const partial = fakeSession([
  { type: "assistant.message", data: { content: "partial evidence" } },
  { type: "session.error", data: { message: "failed after output" } },
]);
assert.equal((await runReviewer(partial, "fixture")).result, "partial evidence");

const toolsSession = {
  rpc: { tools: {
    async initializeAndValidate() {},
    async getCurrentMetadata() { return { tools: [] }; },
    async execute() {
      return { resultType: "denied", error: "Denied by preToolUse hook: PR reviewers cannot execute tools." };
    },
  } },
};
assert.equal((await probeForbiddenTools(toolsSession)).length, 6);
for (const result of [{ resultType: "success" }, { resultType: "failure", error: "Invalid arguments" }]) {
  toolsSession.rpc.tools.execute = async () => result;
  await assert.rejects(probeForbiddenTools(toolsSession), /did not produce/);
}
toolsSession.rpc.tools.getCurrentMetadata = async () => ({ tools: [{ name: "bash" }] });
await assert.rejects(assertNoReviewerTools(toolsSession), /empty reviewer tool set/);
console.log("PASS read-only guards, reviewer errors, partial evidence, cancellation, and listener cleanup");

for (const cleanupFailure of [false, true]) {
  const messages = [];
  let stopped = false;
  let forced = false;
  let released = false;
  const outcome = await executeFixtureRun({
    async log(message) { messages.push(message); },
  }, {
    async start() { throw new Error("Injected runtime startup failure"); },
    async stop() {
      stopped = true;
      return cleanupFailure ? [new Error("Injected cleanup failure")] : [];
    },
    async forceStop() { forced = true; },
  }, settings, {
    controller: new AbortController(),
    experiment: "fixture",
    onStopped() { released = true; },
  });
  assert.equal(outcome.complete, false);
  assert.match(outcome.error, /Injected runtime startup failure/);
  assert.equal(outcome.cleanupErrors.length, cleanupFailure ? 1 : 0);
  assert.equal(stopped, true);
  assert.equal(forced, cleanupFailure);
  assert.equal(released, true);
  assert(messages.some((message) => /incomplete coverage/.test(message)));
}
console.log("PASS runtime startup failures, cleanup errors, and forced-cleanup reporting");
