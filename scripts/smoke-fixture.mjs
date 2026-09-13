import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import {
  advertisesNoReasoningEffort, parseFixtureArgs, reasoningEfforts, subscriptionModels, validateAssignments,
  runReviewer,
} from "../extensions/pr-review/fixture.mjs";
import {
  assertNoReviewerTools, assertReviewerTools, probeForbiddenTools, readOnlyTools, readingReviewerPolicy,
  reviewerEvidence, reviewerPolicy,
} from "../extensions/pr-review/read-only.mjs";
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
assert.throws(() => validateAssignments({ ...settings, effort1: "max" }, catalog),
  /Unsupported reasoning effort max for model-a/);
// A model that advertises no configurable effort says exactly that, rather than
// reporting the explicit effort as one of several it happens not to support.
// The fixture requires an explicit effort, so this pair is still refused.
assert.throws(() => validateAssignments({ ...settings, model1: "no-reasoning" }, catalog),
  /no-reasoning supports no configurable reasoning effort, so it cannot take low/);
// The same catalog reading, asked as a question rather than as a refusal. A
// model this session does not offer answers false: it is refused on the model.
assert.equal(advertisesNoReasoningEffort("no-reasoning", catalog), true);
assert.equal(advertisesNoReasoningEffort("model-a", catalog), false);
assert.equal(advertisesNoReasoningEffort("disabled", catalog), false);
assert.equal(advertisesNoReasoningEffort("auto", catalog), false);
assert.equal(advertisesNoReasoningEffort("missing", catalog), false);
assert.throws(() => validateAssignments({ ...settings, extra: "value" }, catalog), /requires explicit/);
assert.throws(() => validateAssignments(settings, []), /Unavailable/);
console.log("PASS fixture argument, subscription policy, and reasoning validation (no models run)");

const policyEvidence = reviewerEvidence();
const policy = reviewerPolicy(policyEvidence);
assert.equal(policy.enableConfigDiscovery, false);
assert.deepEqual(policy.availableTools, []);
// The runtime accepts only its fixed decision vocabulary; an unknown variant
// would turn a denial into a transport failure.
for (const kind of ["write", "shell", "read", "url", "custom-tool"]) {
  assert.equal((await policy.onPermissionRequest({ kind })).kind, "reject");
}
assert.equal((await policy.hooks.onPreToolUse({ toolName: "task" })).permissionDecision, "deny");
assert.deepEqual(policyEvidence.toolDenials, ["task"]);
assert.deepEqual(policyEvidence.permissionDenials, ["write", "shell", "read", "url", "custom-tool"]);

const root = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-read-only-")));
mkdirSync(join(root, "src"));
writeFileSync(join(root, "src", "caller.js"), "import { value } from \"../example.js\";\n");
const outsideRoot = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-outside-")));
writeFileSync(join(outsideRoot, "secret.txt"), "not reviewed content\n");
mkdirSync(join(outsideRoot, "nested"));
writeFileSync(join(outsideRoot, "nested", "secret.txt"), "also not reviewed content\n");
// A symlink out of the checkout is the case the real-path resolution exists
// for, a symlink within it must not turn into an escape either, and a file of
// the same name inside the root is the decoy the escape below needs.
symlinkSync(join(outsideRoot, "nested"), join(root, "escape"));
symlinkSync(join(root, "src"), join(root, "mirror"));
writeFileSync(join(root, "secret.txt"), "reviewed content\n");
writeFileSync(join(root, "present.js"), "export const present = true;\n");
// Symlinks whose targets do not exist. The one pointing out of the checkout is
// the oracle: whether its target exists must not change the refusal.
symlinkSync(join(outsideRoot, "gone.txt"), join(root, "dangling-out"));
symlinkSync(join(root, "gone.js"), join(root, "dangling-in"));
const readEvidence = reviewerEvidence({ root });
const reading = readingReviewerPolicy(readEvidence, root);
assert.deepEqual(reading.availableTools, ["builtin:view", "builtin:grep", "builtin:glob"]);
assert.deepEqual(readOnlyTools, ["view", "grep", "glob"]);
assert.throws(() => readingReviewerPolicy(readEvidence, "relative/path"), /absolute reviewed checkout root/);
// Approval is unchanged, and still decided by resolving the requested path
// itself rather than a normalized rewrite of it.
const approved = [
  [root, "."],
  [join(root, "src"), "src"],
  [join(root, "src", "caller.js"), join("src", "caller.js")],
  [join(root, "src", "..", "src"), "src"],
  [`${root}${sep}.${sep}src`, "src"],
  [`${root}${sep}src${sep}`, "src"],
  [join(root, "mirror", "caller.js"), join("src", "caller.js")],
];
for (const [path] of approved) {
  assert.equal((await reading.onPermissionRequest({ kind: "read", path })).kind, "approve-once", path);
}
// Q7: a path that would have been inside the root had it existed is still
// refused, but with a reason the reviewer can act on. It names the path the
// reviewer itself asked for, relative to the root, and nothing else.
const absent = [
  [join(root, "missing.js"), "missing.js"],
  [join(root, "src", "missing.mjs"), join("src", "missing.mjs")],
  [join(root, "scripts", "smoke-{config,review}.mjs"), join("scripts", "smoke-{config,review}.mjs")],
  [join(root, "a", "b", "c.js"), join("a", "b", "c.js")],
  [join(root, "src", "caller.js", "nested.js"), join("src", "caller.js", "nested.js")],
  [join(root, "mirror", "missing.js"), join("mirror", "missing.js")],
  // The reason names the path as it was requested. Collapsing it first would
  // report an existing file as absent: this path does not resolve, but
  // present.js does exist.
  [`${root}${sep}missing${sep}..${sep}present.js`, `missing${sep}..${sep}present.js`],
];
for (const [path, named] of absent) {
  const decision = await reading.onPermissionRequest({ kind: "read", path });
  assert.equal(decision.kind, "reject", path);
  assert.match(decision.feedback, /No such path inside the reviewed checkout/, path);
  assert(decision.feedback.includes(named), `${decision.feedback} must name ${named}`);
  assert(!decision.feedback.includes(outsideRoot), "an absent-path refusal never names anything outside the root");
}
// Every other refusal stays exactly as mute as it was. Saying that a path
// outside the root does not exist would report on the host filesystem, which
// is what confinement is for, so a path that only looks contained, one that
// resolves outside through a symlink, and one whose base this handler cannot
// know all keep the bare rejection.
// A symlink out of the checkout, a decoy of the same name inside it, and one
// double-dot segment used to approve a read of the file outside. Node's
// fs.realpathSync collapses ".." textually before it resolves symlinks; the
// operating system, and so the tool that then opens the path, does not. The
// handler must resolve the way the kernel does, or it approves one path and
// the reviewer reads another.
const escape = `${root}${sep}escape${sep}..${sep}secret.txt`;
assert.equal(readFileSync(escape, "utf8"), "not reviewed content\n",
  "this request really does open a file outside the reviewed checkout");
const refused = [
  { kind: "read", path: join(outsideRoot, "secret.txt") },
  { kind: "read", path: join(outsideRoot, "absent.txt") },
  { kind: "read", path: join(root, "..") },
  { kind: "read", path: join(root, "src", "..", "..", "escape.js") },
  { kind: "read", path: `${root}${sep}..${sep}outside.txt` },
  { kind: "read", path: join(root, "escape", "secret.txt") },
  { kind: "read", path: join(root, "escape", "absent.txt") },
  { kind: "read", path: `${root}${sep}escape${sep}..${sep}absent.txt` },
  { kind: "read", path: escape },
  // A symlink that exists but does not resolve keeps the mute refusal, whether
  // it points out of the checkout or inside it. Calling it absent would say
  // whether its target exists, and a symlink in the checkout may point anywhere.
  { kind: "read", path: join(root, "dangling-out") },
  { kind: "read", path: join(root, "dangling-out", "nested.js") },
  { kind: "read", path: join(root, "dangling-in") },
  { kind: "read", path: join("relative", "missing.js") },
  { kind: "read", path: "" },
  { kind: "read", path: 7 },
  { kind: "read" },
  { kind: "write", path: join(root, "src", "caller.js") },
  { kind: "shell", path: root },
];
for (const request of refused) {
  const decision = await reading.onPermissionRequest(request);
  assert.equal(decision.kind, "reject", JSON.stringify(request));
  assert.equal(decision.feedback, undefined, JSON.stringify(request));
}
assert.deepEqual(readEvidence.reads, approved.map(([, recorded]) => recorded));
assert(!readEvidence.reads.includes("secret.txt"),
  "a read whose file is outside the checkout is never recorded as an in-root read");
// The two refusals are recorded apart, so a later run can say why coverage
// dropped without reconstructing it from tool calls.
assert.deepEqual(readEvidence.permissionDenials,
  [...absent.map(() => "read-absent"), ...refused.map((request) => request.kind)]);

// The refusal must not become an existence oracle for a path outside the root.
// A reviewer can ask for the same in-root symlink twice; the answer must not
// depend on whether the file it points at outside the checkout has appeared.
const dangling = { kind: "read", path: join(root, "dangling-out") };
const beforeTarget = await reading.onPermissionRequest(dangling);
writeFileSync(join(outsideRoot, "gone.txt"), "must never be readable\n");
const afterTarget = await reading.onPermissionRequest(dangling);
assert.deepEqual(afterTarget, beforeTarget,
  "the refusal for a checkout symlink must not reveal whether its target outside exists");
assert.equal(afterTarget.feedback, undefined);
assert.deepEqual(readEvidence.permissionDenials.slice(-2), ["read", "read"]);
// Granted read tools must reach the permission handler instead of being
// hook-approved, so confinement still applies to every read.
for (const toolName of [...readOnlyTools, "rg"]) {
  assert.equal(await reading.hooks.onPreToolUse({ toolName }), undefined);
}
for (const toolName of ["bash", "create", "edit", "task", "sql", "web_fetch", "write_agent"]) {
  assert.equal((await reading.hooks.onPreToolUse({ toolName })).permissionDecision, "deny");
}
assert.deepEqual(readEvidence.toolDenials, ["bash", "create", "edit", "task", "sql", "web_fetch", "write_agent"]);
rmSync(root, { recursive: true, force: true });
rmSync(outsideRoot, { recursive: true, force: true });
console.log("PASS zero-tool and confined read-only reviewer policies without a runtime");

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

// A granted reviewer's read is recorded evidence, not a failed read-only claim.
const readingEvents = [
  { type: "tool.execution_start", data: { toolName: "grep", arguments: { pattern: "lapin" } } },
  { type: "assistant.message", data: { content: "candidate output" } },
  { type: "session.idle" },
];
const recorded = [];
const readingSession = fakeSession(readingEvents);
assert.equal((await runReviewer(readingSession, "quick", { toolCalls: recorded })).status, "completed");
assert.deepEqual(recorded, [{ tool: "grep", arguments: { pattern: "lapin" } }]);
assert.equal((await runReviewer(fakeSession(readingEvents))).status, "incomplete",
  "A zero-tool reviewer's tool call must still fail the run");
const billed = await runReviewer(fakeSession([
  { type: "assistant.usage", data: { model: "model-a", copilotUsage: { totalNanoAiu: 123456789 } } },
  { type: "assistant.usage", data: { model: "model-a" } },
  { type: "assistant.message", data: { content: "candidate output" } },
  { type: "session.idle" },
]));
assert.deepEqual(billed.billing, [{ totalNanoAiu: 123456789 }, { totalNanoAiu: undefined }]);
assert.deepEqual(billed.usage, [
  { model: "model-a", reasoningEffort: undefined, isByok: undefined },
  { model: "model-a", reasoningEffort: undefined, isByok: undefined },
], "Billing evidence does not change retained usage attribution");

// B1: the runtime's own context-loss events are recorded on the pass's
// evidence, with the figures the runtime supplied and how far the pass had got
// when each began. The summary a compaction writes is not kept: code cannot
// know what it kept, and the figures are what the runtime reports about it.
const contextEvents = [
  { type: "assistant.turn_start" },
  { type: "tool.execution_start", data: { toolName: "view", arguments: { path: "a.js" } } },
  { type: "assistant.turn_start" },
  { type: "tool.execution_start", data: { toolName: "grep", arguments: { pattern: "b" } } },
  { type: "session.compaction_start", data: {
    trigger: "threshold", currentTokens: 265318, conversationTokens: 256126, tokenLimit: 272000,
  } },
  { type: "tool.execution_start", data: { toolName: "view", arguments: { path: "c.js" } } },
  { type: "session.compaction_complete", data: {
    success: true, trigger: "threshold", preCompactionTokens: 265318, postCompactionTokens: 26129,
    messagesRemoved: 0, tokensRemoved: 239192, tokenLimit: 272000, summaryContent: "A summary of the diff.",
  } },
  { type: "assistant.turn_start" },
  { type: "session.truncation", data: {
    performedBy: "BasicTruncator", tokenLimit: 272000, preTruncationTokensInMessages: 270000,
    postTruncationTokensInMessages: 200000, preTruncationMessagesLength: 12, postTruncationMessagesLength: 8,
    messagesRemovedDuringTruncation: 4, tokensRemovedDuringTruncation: 70000,
  } },
  { type: "session.compaction_start", data: { trigger: "context_limit_retry", currentTokens: 271000, tokenLimit: 272000 } },
  { type: "assistant.message", data: { content: "candidate output" } },
  { type: "session.idle" },
];
const lost = await runReviewer(fakeSession(contextEvents), "quick", { toolCalls: [] });
assert.equal(lost.status, "completed", "A context-loss event is a report about a pass, never a failure of it");
assert.deepEqual(lost.contextLoss, [
  { kind: "compaction", turns: 2, toolCalls: 2, trigger: "threshold", tokenLimit: 272000, tokensBefore: 265318,
    completed: true, success: true, tokensAfter: 26129, messagesRemoved: 0, tokensRemoved: 239192 },
  { kind: "truncation", turns: 3, toolCalls: 3, performedBy: "BasicTruncator", tokenLimit: 272000,
    tokensBefore: 270000, tokensAfter: 200000, messagesRemoved: 4, tokensRemoved: 70000 },
  { kind: "compaction", turns: 3, toolCalls: 3, trigger: "context_limit_retry", tokenLimit: 272000,
    tokensBefore: 271000, completed: false },
], "Each event keeps its figures and its moment; a compaction still open at settlement says so");
const failedCompaction = await runReviewer(fakeSession([
  { type: "assistant.turn_start" },
  { type: "session.compaction_start", data: { trigger: "threshold", currentTokens: 230000, tokenLimit: 272000 } },
  { type: "session.compaction_complete", data: {
    success: false, error: "Compaction response was empty", trigger: "threshold", tokenLimit: 272000,
  } },
  { type: "session.error", data: { message: "context overflow" } },
]));
assert.equal(failedCompaction.status, "incomplete");
assert.deepEqual(failedCompaction.contextLoss, [
  { kind: "compaction", turns: 1, toolCalls: 0, trigger: "threshold", tokenLimit: 272000, tokensBefore: 230000,
    completed: true, success: false, error: "Compaction response was empty" },
], "A failed compaction is recorded as what it was, and a failed pass keeps it");
assert.deepEqual(billed.contextLoss, [], "A pass the runtime never compacted or truncated records nothing");
// Only a host that asks clears a conversation, and this tool never asks.
const cleared = await runReviewer(fakeSession([
  { type: "session.context_cleared", data: { messagesCleared: 3 } },
  { type: "assistant.message", data: { content: "candidate output" } },
  { type: "session.idle" },
]));
assert.deepEqual(cleared.contextLoss, []);
console.log("PASS B1 compaction and truncation events are recorded on the pass with their figures and moment");

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
await assert.rejects(assertNoReviewerTools(toolsSession), /reviewer tool set \(none\).*offered: bash/);
toolsSession.rpc.tools.getCurrentMetadata = async () => ({ tools: readOnlyTools.map((name) => ({ name })) });
await assertReviewerTools(toolsSession, readOnlyTools);
await assert.rejects(assertNoReviewerTools(toolsSession), /reviewer tool set \(none\)/);
toolsSession.rpc.tools.getCurrentMetadata = async () => ({ tools: ["view", "rg", "glob"].map((name) => ({ name })) });
await assertReviewerTools(toolsSession, readOnlyTools);
await assert.rejects(assertNoReviewerTools(toolsSession), /reviewer tool set \(none\)/);
toolsSession.rpc.tools.getCurrentMetadata = async () => ({ tools: ["view", "grep", "rg", "glob"].map((name) => ({ name })) });
await assert.rejects(assertReviewerTools(toolsSession, readOnlyTools), /reviewer tool set/);
toolsSession.rpc.tools.getCurrentMetadata = async () => ({ tools: [{ name: "view" }, { name: "grep" }, { name: "bash" }] });
await assert.rejects(assertReviewerTools(toolsSession, readOnlyTools), /glob, grep, view.*offered: bash, grep, view/);
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
