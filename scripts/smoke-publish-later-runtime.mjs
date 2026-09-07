import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareTargetSmoke } from "./runtime-target.mjs";
import { assertExited, descendants } from "./runtime-fixture.mjs";
import { publicationNumbers } from "./target-fixture.mjs";
import { retainedFilename, validateRecord } from "../extensions/pr-review/retention.mjs";

// Native installed-plugin P5 harness. Each case runs one real quick review with
// `--all --no-comment`, so the run itself never has posting authority, then
// publishes the retained selection through the explicit later command against
// the controlled `gh` fixture. No real GitHub mutation is possible here.
const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
assert(sdkPath && cliPath, "Set COPILOT_SDK_PATH and COPILOT_CLI_PATH");
const settings = { model: process.env.PR_REVIEW_HEAVY_MODEL, reasoningEffort: process.env.PR_REVIEW_HEAVY_EFFORT };
assert(Object.values(settings).every((value) => value && !/\s/.test(value)), "Set explicit heavy model and effort");

const allCases = ["publish", "stale", "uncertain", "cancel", "reject", "draft", "resume"];
const cases = process.argv.find((arg) => arg.startsWith("--cases="))?.slice(8).split(",")
  ?? ["publish", "stale", "uncertain"];
assert(cases.length && cases.every((name) => allCases.includes(name)), "Unknown publish-later case");
assert(!cases.includes("resume") || cases.length === 1,
  "Run resume alone; it initializes its own resumable conversation history");

const targetNumber = {
  publish: publicationNumbers.suppressed, resume: publicationNumbers.suppressed,
  stale: publicationNumbers.stale, uncertain: publicationNumbers.uncertain,
  cancel: publicationNumbers.cancel, reject: publicationNumbers.reject, draft: publicationNumbers.draft,
};
const expectedStatus = {
  publish: "succeeded", resume: "succeeded", stale: "not-attempted", draft: "not-attempted",
  uncertain: "uncertain", cancel: "uncertain", reject: "failed",
};
const reachesPost = (name) => ["publish", "resume", "uncertain", "cancel", "reject"].includes(name);
const errorPattern = {
  stale: /reviewed head, or base changed/, draft: /draft review overrides/,
  uncertain: /acknowledgment/, cancel: /acknowledgment/, reject: /rejected the review/,
};

const { CopilotClient, RuntimeConnection } = await import(pathToFileURL(resolve(sdkPath, "index.js")).href);
const target = await prepareTargetSmoke({ allowPublish: true, coordinatePost: true });
let client;
const connect = () => new CopilotClient({ connection: RuntimeConnection.forStdio({ path: resolve(cliPath) }) });
async function command(session, args) {
  const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
  assert.equal(result.error, undefined, `${args}: ${result.error}`);
}
const inferenceEvent = (event) => event.type === "user.message" || event.type.startsWith("assistant.") ||
  event.type.startsWith("subagent.") || event.type === "tool.execution_start";
async function inspect(session) {
  const before = (await session.getEvents()).length;
  const processes = await descendants();
  const trace = await readFile(process.env.PR_REVIEW_SMOKE_TRACE, "utf8");
  await command(session, "inspect");
  const events = (await session.getEvents()).slice(before);
  assert(!events.some(inferenceEvent));
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
const options = {
  ...target.sessionOptions, ...settings,
  enableExperimentalMode: true, enableConfigDiscovery: true, requestExtensions: true,
  availableTools: [], onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
  onElicitationRequest: async () => {
    throw new Error("Publish-later must not consult a UI; --all and the explicit command carry the decisions.");
  },
};

// Run the retained review. `--all --no-comment` proves the retained result holds
// no posting authority of its own.
async function retainReview(session, number) {
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
    if (message.startsWith("Review/publication failed:")) done.reject(new Error(message));
  });
  try {
    await command(session, `${number} --quick --all --no-comment ` +
      `heavyModel=${settings.model} heavyEffort=${settings.reasoningEffort}`);
    await Promise.race([active.promise, done.promise.then(() => { throw new Error("Review never reached specialists"); })]);
    const owned = (await descendants()).filter((entry) => !before.some((old) => old.pid === entry.pid));
    assert.equal(owned.length, 1, "Exactly one owned inference runtime");
    const evidence = await done.promise;
    await assertExited(owned);
    assert.equal(messages.filter((m) => /^Reviewer [\w-]+: starting$/.test(m)).length, 4);
    const record = await inspect(session);
    validateRecord(record, session.sessionId);
    assert.equal(record.digest, evidence.digest);
    assert(record.outcome.validation.findings.length > 0,
      "This inference run validated no finding, so there is nothing to publish later. " +
      "Model output is fallible; rerun this case deliberately rather than retrying automatically.");
    assert.equal(record.schemaVersion, 3, "A suppressed run retains a version-3 record");
    assert.equal(record.outcome.preview.status, "suppressed");
    assert.equal(record.outcome.preview.authorized, false);
    assert.equal(record.outcome.publication.status, "not-attempted");
    assert.deepEqual(record.outcome.selection.findingIds,
      record.outcome.validation.findings.map((finding) => finding.id));
    return { record, ownedPid: owned[0].pid };
  } finally { off(); }
}

// Publish the retained selection. Nothing here may start inference, consult a
// UI, or read the local checkout.
async function publish(session, { label, resultFile, expectPost, cancelPost = false }) {
  const done = Promise.withResolvers();
  const messages = [];
  const eventsBefore = (await session.getEvents()).length;
  const processesBefore = await descendants();
  const off = session.on((event) => {
    if (!["session.info", "session.error"].includes(event.type)) return;
    const message = event.data.message;
    messages.push(message);
    if (message.startsWith("P5 evidence: ")) done.resolve(JSON.parse(message.slice(13)));
    if (message.startsWith("Review/publication failed:")) done.reject(new Error(message));
  });
  const observing = new AbortController();
  try {
    target.quickTarget.resetPost();
    await command(session, "publish");
    const watcher = (async () => {
      if (!expectPost) return;
      await Promise.race([
        target.quickTarget.awaitPost(observing.signal),
        done.promise.then(() => { throw new Error("Publish-later settled before reaching POST"); }),
      ]);
      const journal = JSON.parse(await readFile(resultFile, "utf8"));
      validateRecord(journal, session.sessionId);
      assert.equal(journal.schemaVersion, 4, "The write-ahead journal already carries publish-later authority");
      assert.equal(journal.outcome.publication.status, "in-flight",
        "Write-ahead journal must be durable before the POST response arrives");
      assert.equal(journal.outcome.publication.authority.kind, "publish-later");
      const post = JSON.parse(await readFile(target.quickTarget.postMarker, "utf8"));
      if (cancelPost) {
        assert((await descendants()).some((row) => row.pid === post.pid), "POST belongs to this harness");
        await command(session, "cancel");
        await assertExited([post]);
      } else target.quickTarget.releasePost();
      return journal;
    })();
    const [evidence, journal] = await Promise.all([done.promise, watcher]);
    const events = (await session.getEvents()).slice(eventsBefore);
    assert(!events.some(inferenceEvent), `${label}: publish-later starts no inference`);
    // Only short-lived controlled gh children may appear; no owned runtime survives.
    await assertExited((await descendants()).filter((entry) => !processesBefore.some((old) => old.pid === entry.pid)));
    assert.equal(messages.filter((m) => /^Reviewer [\w-]+: starting$/.test(m)).length, 0);
    assert.equal(messages.filter((m) => m.startsWith("Publish-later publication: ")).length, 1, "No hidden retries");
    return { evidence, journal, messages };
  } finally {
    observing.abort();
    off();
  }
}

try {
  client = connect();
  for (const name of cases) {
    // Unresolved journals intentionally block replacement; use a session per case.
    let session = await client.createSession(options);
    await session.rpc.extensions.reload();
    const number = targetNumber[name];
    const retained = await retainReview(session, number);
    const tracedBefore = (await readFile(process.env.PR_REVIEW_SMOKE_TRACE, "utf8")).split("\n").filter(Boolean).length;
    let resumedFrom;
    if (name === "resume") {
      // A supported cold resume must publish the same retained result from a
      // fresh runtime, with no plugin-created transcript history.
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
      resumedFrom = session.sessionId;
      const processes = await descendants();
      await client.rpc.sessions.save({ sessionId: resumedFrom });
      await client.rpc.sessions.close({ sessionId: resumedFrom });
      await stop();
      await assertExited(processes);
      client = connect();
      session = await client.resumeSession(resumedFrom, options);
      await session.rpc.extensions.reload();
      assert.equal(session.sessionId, resumedFrom);
      assert.deepEqual(await inspect(session), retained.record, "Cold resume preserves the exact retained record");
    } else {
      // Publication must reload the record from disk, not from run memory.
      await session.rpc.extensions.reload();
      assert.deepEqual(await inspect(session), retained.record);
    }
    const workspacePath = (await session.rpc.metadata.snapshot()).workspacePath;
    const resultFile = join(workspacePath, retainedFilename);
    const { evidence, messages } = await publish(session, {
      label: name, resultFile, expectPost: reachesPost(name), cancelPost: name === "cancel",
    });
    assert(messages.some((m) => m.includes("Retained posting flags, configuration and confirmations")),
      "Publish-later states that retained authority grants nothing");
    assert.equal(evidence.status, expectedStatus[name], JSON.stringify(evidence));
    assert.equal(evidence.dispatched, reachesPost(name));
    assert.equal(evidence.authority.sessionId, session.sessionId);
    assert.notEqual(evidence.authority.invocationId, retained.record.invocation.invocationId);
    const record = await inspect(session);
    validateRecord(record, session.sessionId);
    const outcome = record.outcome;
    assert.equal(record.schemaVersion, reachesPost(name) ? 4 : 3);
    assert.equal(outcome.publication.status, expectedStatus[name]);
    assert.equal(outcome.preview.status, "suppressed", "The historical proposal is untouched");
    assert.equal(outcome.preview.authorized, false, "The write used new authority, not retained authority");
    assert.equal(outcome.preview.submitted, false);
    assert.equal(outcome.cancelled, false, "A historical review is never retroactively cancelled");
    assert.deepEqual(outcome.selection.findingIds, retained.record.outcome.selection.findingIds);
    assert.deepEqual(outcome.validation, retained.record.outcome.validation);
    if (errorPattern[name]) assert.match(outcome.publication.error ?? evidence.error, errorPattern[name]);
    if (reachesPost(name)) {
      assert.equal(record.digest, evidence.digest);
      assert.equal(outcome.publication.authority.kind, "publish-later");
      assert.equal(outcome.publication.cancelRequested, name === "cancel" ? true : undefined);
    } else {
      assert.deepEqual(record, retained.record, "A refused publish-later leaves the record untouched");
    }
    if (expectedStatus[name] === "succeeded") {
      assert.equal(outcome.publication.review.url,
        `https://github.com/fixture/repository/pull/${number}#pullrequestreview-${outcome.publication.review.id}`);
    }
    const traced = (await readFile(process.env.PR_REVIEW_SMOKE_TRACE, "utf8")).split("\n").filter(Boolean)
      .slice(tracedBefore).map(JSON.parse);
    const posts = traced.filter((call) => call.args[4] === "POST");
    assert.equal(posts.length, reachesPost(name) ? 1 : 0, "No hidden retries or unreachable dispatch");
    if (posts.length) assert.deepEqual(posts[0].input, retained.record.outcome.preview.request.payload,
      "The posted payload is the retained canonical request");
    if (reachesPost(name)) {
      assert(traced.some((call) => call.args[5]?.includes("/contents/")),
        "Publish-later refetches the reviewed source instead of trusting stored citations");
    }
    // A second explicit invocation must not repeat or erase the recorded write.
    const again = await publish(session, {
      label: `${name}-repeat`, resultFile, expectPost: name === "reject",
    });
    assert.equal(again.evidence.dispatched, name === "reject",
      "Only a definite failure may be published again");
    assert.notEqual(again.evidence.authority.invocationId, evidence.authority.invocationId);
    if (name === "reject") {
      assert.equal(again.evidence.status, "failed");
      assert(again.messages.some((m) => m.includes("previous attempt definitely failed")));
    } else {
      assert.match(again.evidence.error, name === "publish" || name === "resume" ? /already published as/
        : reachesPost(name) ? /unresolved/ : /reviewed head, or base changed|draft review overrides/);
      if (reachesPost(name)) assert.deepEqual(await inspect(session), record, "The recorded write is preserved");
    }
    await session.rpc.extensions.reload();
    const reloaded = await inspect(session);
    validateRecord(reloaded, session.sessionId);
    await target.quickTarget.check();
    console.log(`PASS P5 native ${name}: ${JSON.stringify({
      sessionId: session.sessionId, resumedFrom, reviewPid: retained.ownedPid,
      reviewDigest: retained.record.digest, digest: reloaded.digest,
      schemaVersion: reloaded.schemaVersion, coverage: outcome.coverage,
      selection: outcome.selection.findingIds, publication: reloaded.outcome.publication,
      reloadPreserved: true,
    })}`);
  }
} finally {
  try { await stop(); } finally { await target.cleanup(); }
}
