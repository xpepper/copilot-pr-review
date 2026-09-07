import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareTargetSmoke } from "./runtime-target.mjs";
import { assertExited, descendants } from "./runtime-fixture.mjs";
import { publicationNumbers } from "./target-fixture.mjs";
import { retainedFilename, validateRecord } from "../extensions/pr-review/retention.mjs";

// Native installed-plugin P4 harness: real CLI/SDK/inference against the
// controlled `gh` fixture, with explicit opt-in POST support (see
// target-fixture.mjs/runtime-target.mjs). This never contacts real GitHub;
// `scripts/smoke-publication-live.mjs` covers that separately.
const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
assert(sdkPath && cliPath, "Set COPILOT_SDK_PATH and COPILOT_CLI_PATH");
const settings = { model: process.env.PR_REVIEW_HEAVY_MODEL, reasoningEffort: process.env.PR_REVIEW_HEAVY_EFFORT };
assert(Object.values(settings).every((value) => value && !/\s/.test(value)), "Set explicit heavy model and effort");

const allCases = ["comment", "confirmed", "declined", "suppressed", "stale", "draft", "reject", "uncertain", "cancel"];
const cases = process.argv.find((arg) => arg.startsWith("--cases="))?.slice(8).split(",")
  ?? ["comment", "stale", "uncertain"];
assert(cases.length && cases.every((name) => allCases.includes(name)), "Unknown publication case");

// Only "comment"/"confirmed" flip authority via a real code path that reaches
// publishCurrent AND succeeds; "reject"/"uncertain"/"cancel" also reach it but
// end differently. "declined"/"suppressed"/"stale"/"draft" must never dispatch.
const expectedStatus = {
  comment: "succeeded", confirmed: "succeeded", declined: "not-attempted", suppressed: "not-attempted",
  stale: "not-attempted", draft: "not-attempted", reject: "failed", uncertain: "uncertain", cancel: "uncertain",
};
const expectedPreview = {
  comment: "flag-authorized", confirmed: "confirmed", declined: "declined", suppressed: "suppressed",
  stale: "flag-authorized", draft: "flag-authorized", reject: "flag-authorized", uncertain: "flag-authorized", cancel: "flag-authorized",
};
const reachesPost = (name) => ["comment", "confirmed", "reject", "uncertain", "cancel"].includes(name);
const usesUI = (name) => ["confirmed", "declined"].includes(name);
const errorPattern = {
  stale: /changed|rerun review/, draft: /draft review overrides/, reject: /rejected the review/,
  uncertain: /UNCERTAIN|acknowledgment/, cancel: /UNCERTAIN|acknowledgment/,
};

const { CopilotClient, RuntimeConnection } = await import(pathToFileURL(resolve(sdkPath, "index.js")).href);
const target = await prepareTargetSmoke({ allowPublish: true, coordinatePost: true });
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
  for (const name of cases) {
    // Uncertain journals intentionally block replacement; use a session per case.
    const session = await client.createSession(options);
    await session.rpc.extensions.reload();
    const workspacePath = (await session.rpc.metadata.snapshot()).workspacePath;
    const resultFile = join(workspacePath, retainedFilename);
    target.quickTarget.resetPost();
    pending = { request: Promise.withResolvers(), answer: Promise.withResolvers() };
    const done = Promise.withResolvers();
    const active = Promise.withResolvers();
    const labels = new Set();
    const messages = [];
    const before = await descendants();
    const tracedBefore = (await readFile(process.env.PR_REVIEW_SMOKE_TRACE, "utf8")).split("\n").filter(Boolean).length;
    const off = session.on((event) => {
      if (!["session.info", "session.error"].includes(event.type)) return;
      const message = event.data.message;
      messages.push(message);
      const match = /^Reviewer ([\w-]+): active$/.exec(message);
      if (match) labels.add(match[1]);
      if (labels.size === 3) active.resolve();
      if (message.startsWith("P2 evidence: ")) done.resolve(JSON.parse(message.slice(13)));
      if (message.startsWith("Review/publication failed:")) done.reject(new Error(message));
    });
    const observing = new AbortController();
    try {
      const number = publicationNumbers[name];
      const flags = name === "comment" ? "--all --comment" : name === "suppressed" ? "--all --no-comment"
        : usesUI(name) ? "--all" : "--all --comment";
      const args = `${number} --quick ${flags} heavyModel=${settings.model} heavyEffort=${settings.reasoningEffort}`;
      await command(session, args);
      await Promise.race([active.promise, done.promise.then(() => { throw new Error("Review never reached specialists"); })]);
      const owned = (await descendants()).filter((entry) => !before.some((old) => old.pid === entry.pid));
      assert.equal(owned.length, 1, "Exactly one owned inference runtime");
      if (usesUI(name)) {
        const request = await Promise.race([
          pending.request.promise,
          done.promise.then(() => { throw new Error("Positive publication probe ended without UI; inspect inference output"); }),
        ]);
        // Inference is fully stopped before the UI is ever consulted, let
        // alone before any write attempt further downstream.
        await assertExited(owned);
        assert.equal(request.sessionId, session.sessionId);
        pending.answer.resolve({ action: "accept", content: { authorize: name === "confirmed" } });
      }
      const watcher = (async () => {
        if (!reachesPost(name)) return;
        await Promise.race([
          target.quickTarget.awaitPost(observing.signal),
          done.promise.then(() => { throw new Error("Positive case settled before reaching POST"); }),
        ]);
        await assertExited(owned);
        const record = JSON.parse(await readFile(resultFile, "utf8"));
        validateRecord(record, session.sessionId);
        assert.equal(record.outcome.publication.status, "in-flight",
          "Write-ahead journal must be durable before the POST response arrives");
        const post = JSON.parse(await readFile(target.quickTarget.postMarker, "utf8"));
        if (name === "cancel") {
          assert((await descendants()).some((row) => row.pid === post.pid), "POST belongs to this harness");
          await command(session, "cancel");
          await assertExited([post]);
        } else target.quickTarget.releasePost();
      })();
      const [evidence] = await Promise.all([done.promise, watcher]);
      await assertExited(owned);
      const record = await inspect(session);
      validateRecord(record, session.sessionId);
      assert.equal(record.digest, evidence.digest);
      const outcome = record.outcome;
      assert(outcome.validation.findings.length > 0, "Native publication requires actual validated findings");
      assert.equal(outcome.preview.status, expectedPreview[name]);
      assert.equal(outcome.preview.submitted, false);
      assert.equal(outcome.publication.status, expectedStatus[name], JSON.stringify(outcome.publication));
      if (errorPattern[name]) assert.match(outcome.publication.error, errorPattern[name]);
      if (name === "cancel") assert.equal(outcome.publication.cancelRequested, true);
      else assert.equal(outcome.publication.cancelRequested, undefined);
      if (outcome.publication.status === "succeeded") {
        assert(Number.isSafeInteger(outcome.publication.review.id) && outcome.publication.review.id > 0);
        assert.equal(outcome.publication.review.url,
          `https://github.com/fixture/repository/pull/${number}#pullrequestreview-${outcome.publication.review.id}`);
      }
      assert.equal(messages.filter((m) => /^Reviewer [\w-]+: starting$/.test(m)).length, 4, "No hidden inference rerun");
      assert.equal(messages.filter((m) => m.startsWith("COMMENT review payload proposal")).length, 1);
      assert.equal(messages.filter((m) => m.startsWith("Publication: ")).length, 1, "No hidden retries");
      assert.equal(messages.filter((m) => m.startsWith("P2 evidence: ")).length, 1);
      const posts = (await readFile(process.env.PR_REVIEW_SMOKE_TRACE, "utf8")).split("\n").filter(Boolean)
        .slice(tracedBefore).map(JSON.parse).filter((call) => call.args[4] === "POST");
      assert.equal(posts.length, reachesPost(name) ? 1 : 0, "No hidden retries or unreachable dispatch");
      if (posts.length) assert.deepEqual(posts[0].input, outcome.preview.request.payload);
      await session.rpc.extensions.reload();
      assert.deepEqual(await inspect(session), record);
      await target.quickTarget.check();
      console.log(`PASS P4 native ${name}: ${JSON.stringify({
        sessionId: session.sessionId, digest: record.digest, ownedPid: owned[0].pid,
        coverage: outcome.coverage, selection: outcome.selection.findingIds,
        preview: outcome.preview.status, publication: outcome.publication, reloadPreserved: true,
      })}`);
    } finally {
      observing.abort();
      pending.answer.resolve({ action: "cancel" });
      pending = undefined;
      off();
    }
  }
} finally {
  try { await stop(); } finally { await target.cleanup(); }
}
