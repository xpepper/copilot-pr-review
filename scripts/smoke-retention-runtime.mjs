import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { retainedFilename, retainedRecord } from "../extensions/pr-review/retention.mjs";
import { retentionFixture } from "./retention-fixture.mjs";
import { prepareTargetSmoke } from "./runtime-target.mjs";
import { assertExited, descendants } from "./runtime-fixture.mjs";

const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
assert(sdkPath && cliPath, "Set COPILOT_SDK_PATH and COPILOT_CLI_PATH");
const { CopilotClient, RuntimeConnection } = await import(pathToFileURL(resolve(sdkPath, "index.js")).href);
const live = process.argv.includes("--quick");
const parentTurn = process.argv.includes("--parent-turn");
const settings = {
  model: process.env.PR_REVIEW_HEAVY_MODEL,
  reasoningEffort: process.env.PR_REVIEW_HEAVY_EFFORT,
};
if (live || parentTurn) assert(Object.values(settings).every((value) => value && !/\s/.test(value)), "Set explicit heavy model/effort");
const target = await prepareTargetSmoke();
const options = {
  enableExperimentalMode: true, enableConfigDiscovery: true, requestExtensions: true,
  availableTools: [], onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
  ...target.sessionOptions, ...(live || parentTurn ? settings : {}),
};
let client;
const connect = () => new CopilotClient({ connection: RuntimeConnection.forStdio({ path: resolve(cliPath) }) });
async function stop() {
  if (!client) return;
  const errors = await client.stop();
  client = undefined;
  assert.deepEqual(errors, []);
}
async function command(session, args) {
  const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
  assert.equal(result.error, undefined, `Command failed: ${args}: ${result.error}`);
}
async function inspect(session) {
  const before = (await session.getEvents()).length;
  const processes = await descendants();
  await command(session, "inspect");
  const events = (await session.getEvents()).slice(before);
  assert(!events.some((event) => event.type === "user.message" || event.type.startsWith("assistant.") ||
    event.type.startsWith("subagent.") || event.type === "tool.execution_start"));
  const messages = events.filter((event) => ["session.info", "session.error"].includes(event.type))
    .map((event) => event.data.message);
  assert(!messages.some((message) => /^(Q1 |Q2 |Q3 |Reviewer )/.test(message)), "Inspection must not capture or infer");
  assert.deepEqual(await descendants(), processes, "Inspection must not start owned work");
  const evidence = messages.find((message) => message.startsWith("P2 inspection: "));
  return { record: evidence ? JSON.parse(evidence.slice("P2 inspection: ".length)) : undefined, messages };
}
async function reload(session) {
  const before = await descendants();
  await session.rpc.extensions.reload();
  const { extensions } = await session.rpc.extensions.list();
  assert.equal(extensions.find((entry) => entry.id.startsWith("plugin:copilot-pr-review:"))?.status, "running");
  const after = await descendants();
  const exited = before.filter((entry) => !after.some((current) => current.pid === entry.pid));
  await assertExited(exited);
  console.log(`P2 reload: old PIDs=${exited.map((p) => p.pid)}; current PIDs=${after.map((p) => p.pid)}`);
}
try {
  client = connect();
  const session = await client.createSession(options);
  const sessionId = session.sessionId;
  await reload(session);
  assert((await inspect(session)).messages.some((message) => message.startsWith("No retained")));
  const metadata = await session.rpc.metadata.snapshot();
  console.log(`P2 local metadata: ${JSON.stringify({
    sessionId, isRemote: metadata.isRemote, workspacePath: metadata.workspacePath,
  })}`);
  if (parentTurn) {
    const idle = Promise.withResolvers();
    const unsubscribe = session.on((event) => {
      if (event.type === "session.idle") idle.resolve();
      if (event.type === "session.error") idle.reject(new Error(event.data.message));
    });
    try {
      await session.send("Reply READY only. This initializes a conversation for a session-resume probe. Do not use tools.");
      await idle.promise;
      console.log("P2 harness initialization: one real parent conversation turn; not part of inspection or review");
    } finally { unsubscribe(); }
  }
  if (live) {
    const done = Promise.withResolvers();
    const active = Promise.withResolvers();
    const labels = new Set();
    const before = await descendants();
    const unsubscribe = session.on((event) => {
      if (!["session.info", "session.error"].includes(event.type)) return;
      const message = event.data.message;
      const match = /^Reviewer ([\w-]+): active$/.exec(message);
      if (match) labels.add(match[1]);
      if (labels.size === 3) active.resolve();
      if (message.startsWith("P2 evidence: ")) done.resolve(JSON.parse(message.slice(13)));
      if (message.startsWith("Review/publication failed:")) done.reject(new Error(message));
    });
    try {
      await command(session, `12 --quick --no-comment --all heavyModel=${settings.model} heavyEffort=${settings.reasoningEffort}`);
      await Promise.race([active.promise, done.promise]);
      const owned = (await descendants()).filter((entry) => !before.some((previous) => previous.pid === entry.pid));
      assert.equal(owned.length, 1, "Exactly one owned inference runtime");
      const evidence = await done.promise;
      await assertExited(owned);
      console.log(`P2 real inference retained: ${JSON.stringify(evidence)}; owned PID ${owned[0].pid} exited`);
    } finally { unsubscribe(); }
  } else {
    const seeded = retainedRecord(await retentionFixture(sessionId, {
      reviewerLimitations: [{
        kind: "caveat", reason: "Synthetic external library internals not independently audited.", impact: null,
      }],
    }));
    await writeFile(join(metadata.workspacePath, retainedFilename), JSON.stringify(seeded), { mode: 0o600 });
    console.log("P2 controlled seed: findings/adjudication are fixtures, NOT native inference evidence");
  }
  const inspection = await inspect(session);
  const initial = inspection.record;
  assert(initial, "Settled record must be inspectable");
  assert.equal(initial.invocation.sessionId, sessionId);
  assert.equal(initial.outcome.binding.repository.nameWithOwner, target.quickTarget.repository);
  assert.equal(initial.outcome.binding.head, target.quickTarget.head);
  assert.equal(initial.outcome.validation.findings.length, 1, "Positive lifecycle probe requires a validated finding");
  assert.equal(initial.outcome.selection.status, "selected");
  if (!live) {
    assert.equal(initial.outcome.complete, true);
    assert.deepEqual(initial.outcome.validation.issues, []);
    assert.equal(initial.outcome.validation.diagnostics[0].kind, "caveat");
    assert(inspection.messages.some((message) =>
      message.includes("Informational caveat: correctness: Synthetic external library")));
  }
  console.log(`P2 initial record: ${JSON.stringify(initial)}`);
  const tracePath = process.env.PR_REVIEW_SMOKE_TRACE;
  const traceBefore = await readFile(tracePath, "utf8");
  await reload(session);
  assert.deepEqual((await inspect(session)).record, initial);
  const firstProcesses = await descendants();
  await client.rpc.sessions.save({ sessionId });
  await client.rpc.sessions.close({ sessionId });
  await stop();
  await assertExited(firstProcesses);

  client = connect();
  let resumed;
  try { resumed = await client.resumeSession(sessionId, options); }
  catch (error) {
    if (parentTurn || !String(error).includes(`Session not found: ${sessionId}`)) throw error;
    assert.deepEqual(JSON.parse(await readFile(join(metadata.workspacePath, retainedFilename), "utf8")), initial);
    console.log(`UNSUPPORTED command-only cold resume: ${String(error)}. Retained file survives; no transcript recovery invented.`);
  }
  if (resumed) {
    await reload(resumed);
    assert.equal(resumed.sessionId, sessionId);
    const resumedMetadata = await resumed.rpc.metadata.snapshot();
    assert.equal(resumedMetadata.workspacePath, metadata.workspacePath);
    assert.deepEqual((await inspect(resumed)).record, initial);
    console.log(`PASS P2 same-session resume in fresh runtime: session=${sessionId}; digest=${initial.digest}`);
    await command(resumed, "cancel");
    assert.deepEqual((await inspect(resumed)).record, initial, "Cancel after completion does not rewrite a finished result");
  }

  const other = await client.createSession(options);
  await reload(other);
  assert((await inspect(other)).messages.some((message) => message.startsWith("No retained")));
  const otherMetadata = await other.rpc.metadata.snapshot();
  await writeFile(join(otherMetadata.workspacePath, retainedFilename), JSON.stringify(initial), { mode: 0o600 });
  const wrongSession = await other.rpc.commands.execute({ commandName: "pr-review", args: "inspect" });
  assert.match(wrongSession.error, /wrong originating session/);
  await writeFile(join(otherMetadata.workspacePath, retainedFilename), '{"schemaVersion":999}', { mode: 0o600 });
  const incompatible = await other.rpc.commands.execute({ commandName: "pr-review", args: "inspect" });
  assert.match(incompatible.error, /Invalid retained result/);
  await writeFile(join(otherMetadata.workspacePath, retainedFilename), JSON.stringify({
    schemaVersion: 1, state: "pending", invocation: { ...initial.invocation, sessionId: other.sessionId },
  }));
  assert((await inspect(other)).messages.some((message) => message.includes("unfinished/interrupted")));
  assert.equal(await readFile(tracePath, "utf8"), traceBefore, "Reload/resume/inspection must make no gh requests");
  await target.quickTarget.check();
  console.log(`PASS P2 native inspect/reload${resumed ? "/resume" : " (cold resume unsupported)"}, new-session isolation, wrong-session/schema rejection, interrupted marker; no gh or checkout changes`);
} finally {
  try { await stop(); } finally { await target.cleanup(); }
}
