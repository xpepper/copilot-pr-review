import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareTargetSmoke } from "./runtime-target.mjs";
import { assertExited, descendants } from "./runtime-fixture.mjs";
import { reviewRequest } from "../extensions/pr-review/preview.mjs";
import { validateRecord } from "../extensions/pr-review/retention.mjs";

const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
assert(sdkPath && cliPath, "Set COPILOT_SDK_PATH and COPILOT_CLI_PATH");
const settings = { model: process.env.PR_REVIEW_HEAVY_MODEL, reasoningEffort: process.env.PR_REVIEW_HEAVY_EFFORT };
assert(Object.values(settings).every((value) => value && !/\s/.test(value)), "Set explicit heavy model and effort");
const modes = process.argv.find((arg) => arg.startsWith("--cases="))?.slice(8).split(",")
  ?? ["comment", "confirmed", "cancel-pending"];
assert(modes.length && modes.every((mode) =>
  ["comment", "confirmed", "declined", "cancel-pending", "subset-comment", "unavailable"].includes(mode)), "Unknown preview case");
const parentTurn = process.argv.includes("--parent-turn");
assert(!modes.includes("unavailable") || (modes.length === 1 && !parentTurn),
  "Run unavailable alone without --parent-turn; it uses a separate UI-less session");
const { CopilotClient, RuntimeConnection } = await import(pathToFileURL(resolve(sdkPath, "index.js")).href);
const target = await prepareTargetSmoke();
let client;
const connect = () => new CopilotClient({ connection: RuntimeConnection.forStdio({ path: resolve(cliPath) }) });
async function command(session, args) {
  const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
  assert.equal(result.error, undefined, `${args}: ${result.error}`);
}
async function inspect(session) {
  const before = (await session.getEvents()).length;
  const processes = await descendants();
  const trace = await readFile(process.env.PR_REVIEW_SMOKE_TRACE, "utf8");
  await command(session, "inspect");
  const events = (await session.getEvents()).slice(before);
  assert(!events.some((event) => event.type === "user.message" || event.type.startsWith("assistant.") ||
    event.type.startsWith("subagent.") || event.type === "tool.execution_start"));
  assert.deepEqual(await descendants(), processes);
  assert.equal(await readFile(process.env.PR_REVIEW_SMOKE_TRACE, "utf8"), trace);
  return JSON.parse(events.find((event) => event.data?.message?.startsWith("P2 inspection: ")).data.message.slice(15));
}
async function stop() {
  if (!client) return;
  const errors = await client.stop();
  client = undefined;
  assert.deepEqual(errors, []);
}
let pending;
const options = {
  ...target.sessionOptions, ...settings,
  enableExperimentalMode: true, enableConfigDiscovery: true, requestExtensions: true,
  availableTools: [], onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
  onElicitationRequest: async (request) => {
    assert(pending, "No unexpected UI request");
    pending.request.resolve(request);
    return pending.answer.promise;
  },
};
try {
  client = connect();
  let session = await client.createSession(options);
  await session.rpc.extensions.reload();
  if (parentTurn) {
    const idle = Promise.withResolvers();
    const off = session.on((event) => {
      if (event.type === "session.idle") idle.resolve();
      if (event.type === "session.error") idle.reject(new Error(event.data.message));
    });
    try {
      await session.send("Reply READY only. Initialize this resume-probe conversation; do not use tools.");
      await idle.promise;
    } finally { off(); }
    console.log("Harness-only parent turn initialized resumable history; not plugin behavior.");
  }
  for (const mode of modes) {
    if (mode === "unavailable") {
      session = await client.createSession({ ...options, onElicitationRequest: undefined });
      await session.rpc.extensions.reload();
    }
    pending = { request: Promise.withResolvers(), answer: Promise.withResolvers() };
    const done = Promise.withResolvers();
    const active = Promise.withResolvers();
    const labels = new Set();
    const messages = [];
    const before = await descendants();
    const off = session.on((event) => {
      if (!["session.info", "session.error"].includes(event.type)) return;
      const message = event.data.message;
      messages.push(message);
      const match = /^Reviewer ([\w-]+): active$/.exec(message);
      if (match) labels.add(match[1]);
      if (labels.size === 3) active.resolve();
      if (message.startsWith("P2 evidence: ")) done.resolve(JSON.parse(message.slice(13)));
      if (message.startsWith("Review/retention failed:")) done.reject(new Error(message));
    });
    try {
      const flags = mode === "subset-comment" ? "--comment" : mode === "comment" ? "--all --comment" : "--all";
      const args = `${mode === "subset-comment" ? 13 : 12} --quick ${flags} ` +
        `heavyModel=${settings.model} heavyEffort=${settings.reasoningEffort}`;
      await command(session, args);
      await Promise.race([active.promise, done.promise.then(() => { throw new Error("Review never reached specialists"); })]);
      const owned = (await descendants()).filter((entry) => !before.some((old) => old.pid === entry.pid));
      assert.equal(owned.length, 1, "Exactly one owned inference runtime");
      let cancellation;
      if (!["comment", "unavailable"].includes(mode)) {
        const request = await Promise.race([
          pending.request.promise,
          done.promise.then(() => { throw new Error("Positive preview probe ended without UI; inspect inference output"); }),
        ]);
        await assertExited(owned);
        assert.equal(request.sessionId, session.sessionId);
        assert.match((await session.rpc.commands.execute({ commandName: "pr-review", args })).error, /already running/);
        assert.match((await session.rpc.commands.execute({ commandName: "pr-review", args: "inspect" })).error, /already running/);
        if (mode === "subset-comment") {
          const choices = request.requestedSchema.properties.findingIds.items.anyOf;
          assert(choices.length >= 2);
          pending.answer.resolve({ action: "accept", content: { findingIds: [choices[0].const] } });
        } else {
          assert.equal(request.requestedSchema.properties.authorize.default, false);
          assert.match(request.message, /PREVIEW ONLY/);
          if (mode === "cancel-pending") cancellation = command(session, "cancel");
          else pending.answer.resolve({ action: "accept", content: { authorize: mode === "confirmed" } });
        }
      }
      const evidence = await done.promise;
      if (cancellation) {
        await cancellation;
        pending.answer.resolve({ action: "accept", content: { authorize: true } });
        await new Promise(setImmediate);
      }
      await assertExited(owned);
      const record = await inspect(session);
      validateRecord(record, session.sessionId);
      assert.equal(record.digest, evidence.digest);
      const outcome = record.outcome;
      assert(outcome.validation.findings.length > 0, "Native preview requires actual validated findings");
      const expected = ["comment", "subset-comment"].includes(mode) ? "flag-authorized"
        : mode === "cancel-pending" ? "cancelled" : mode;
      assert.equal(outcome.preview.status, expected);
      assert.equal(outcome.preview.submitted, false);
      assert.equal(outcome.preview.authorized, ["flag-authorized", "confirmed"].includes(expected));
      if (mode === "cancel-pending") {
        assert.deepEqual(outcome.selection.findingIds, []);
        assert.equal(outcome.preview.request, undefined);
      } else {
        assert.deepEqual(outcome.preview.request, reviewRequest(outcome));
        assert.equal(outcome.preview.request.payload.event, "COMMENT");
        if (mode === "subset-comment") assert.equal(outcome.preview.request.payload.comments.length, 1);
      }
      assert.equal(messages.filter((m) => /^Reviewer [\w-]+: starting$/.test(m)).length, 4, "No hidden inference rerun");
      assert.equal(messages.filter((m) => m.startsWith("COMMENT review payload PREVIEW ONLY")).length, 1);
      assert.equal(messages.filter((m) => m.startsWith("P2 evidence: ")).length, 1);
      await session.rpc.extensions.reload();
      assert.deepEqual(await inspect(session), record);
      await target.quickTarget.check();
      console.log(`PASS P3 native ${mode}: ${JSON.stringify({
        sessionId: session.sessionId, digest: record.digest, ownedPid: owned[0].pid,
        coverage: outcome.coverage, selection: outcome.selection.findingIds,
        preview: outcome.preview, reloadPreserved: true,
      })}`);
    } finally {
      pending.answer.resolve({ action: "cancel" });
      pending = undefined;
      off();
    }
  }
  if (parentTurn) {
    const sessionId = session.sessionId;
    const record = await inspect(session);
    const processes = await descendants();
    await client.rpc.sessions.save({ sessionId });
    await client.rpc.sessions.close({ sessionId });
    await stop();
    await assertExited(processes);
    client = connect();
    const resumed = await client.resumeSession(sessionId, options);
    await resumed.rpc.extensions.reload();
    assert.deepEqual(await inspect(resumed), record);
    console.log(`PASS P3 conversation-backed cold resume: session=${sessionId}; digest=${record.digest}`);
  }
} finally {
  try { await stop(); } finally { await target.cleanup(); }
}
