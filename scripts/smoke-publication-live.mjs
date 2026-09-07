import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertExited, descendants } from "./runtime-fixture.mjs";
import { validateRecord } from "../extensions/pr-review/retention.mjs";

const number = Number(process.argv.find((arg) => arg.startsWith("--pr="))?.slice(5));
const head = process.argv.find((arg) => arg.startsWith("--head="))?.slice(7);
const verifyRecord = process.argv.find((arg) => arg.startsWith("--verify-record="))?.slice(16);
// `--publish-later` retains a suppressed review, then publishes it through the
// explicit P5 command; `--publish` keeps the P4 current-run path.
const publishLater = process.argv.includes("--publish-later");
assert([process.argv.includes("--publish"), publishLater, !!verifyRecord].filter(Boolean).length === 1 &&
  Number.isSafeInteger(number) && number > 0 && /^[a-f0-9]{40}$/.test(head),
  "Supply --pr=NUMBER --head=SHA and exactly one of --publish, --publish-later (LIVE MUTATION) " +
  "or --verify-record=PATH (read-only)");
const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
const settings = { model: process.env.PR_REVIEW_HEAVY_MODEL, reasoningEffort: process.env.PR_REVIEW_HEAVY_EFFORT };
assert(!process.env.PR_REVIEW_SMOKE_TRACE, "Never combine controlled gh with live publication");
const endpoint = `repos/xpepper/copilot-pr-review/pulls/${number}`;
const gh = (path) => JSON.parse(execFileSync("gh", ["api", "--hostname", "github.com", path], { encoding: "utf8" }));
const pull = gh(endpoint);
assert.equal(pull.head.sha, head);
assert.equal(pull.state, "open");
assert.equal(pull.draft, false);
assert(pull.head.ref.startsWith("playground/") && pull.base.ref.startsWith("playground/"), "Synthetic isolated branches only");
function verifyRemote(record) {
  validateRecord(record, record.invocation.sessionId);
  assert.equal(record.outcome.binding.repository.nameWithOwner, "xpepper/copilot-pr-review");
  assert.equal(record.outcome.binding.number, number);
  assert.equal(record.outcome.binding.head, head);
  assert.equal(record.outcome.publication.status, "succeeded", JSON.stringify(record.outcome.publication));
  const id = record.outcome.publication.review.id;
  const remote = gh(`${endpoint}/reviews/${id}`);
  assert.equal(remote.state, "COMMENTED");
  assert.equal(remote.commit_id, head);
  assert.equal(remote.body, record.outcome.preview.request.payload.body);
  // The per-review comments endpoint still returns legacy position-only objects.
  const comments = gh(`${endpoint}/comments?per_page=100`).filter((comment) => comment.pull_request_review_id === id);
  const expected = record.outcome.preview.request.payload.comments;
  assert.equal(comments.length, expected.length);
  for (const [index, comment] of comments.entries()) {
    for (const key of ["path", "line", "side", "body", "start_line", "start_side"]) {
      assert.equal(comment[key] ?? undefined, expected[index][key]);
    }
    assert.equal(comment.commit_id, head);
  }
  return comments.map(({ id, html_url, path, line, side, start_line, start_side }) =>
    ({ id, html_url, path, line, side, start_line, start_side }));
}
if (verifyRecord) {
  const record = JSON.parse(await readFile(resolve(verifyRecord), "utf8"));
  const comments = verifyRemote(record);
  console.log(`PASS ${record.schemaVersion === 4 ? "P5" : "P4"} read-only LIVE verification: ${JSON.stringify({
    sessionId: record.invocation.sessionId, digest: record.digest, head,
    coverage: record.outcome.coverage, publication: record.outcome.publication, comments,
  })}`);
  process.exit(0);
}
assert(sdkPath && cliPath && Object.values(settings).every((value) => value && !/\s/.test(value)), "Set CLI/SDK and explicit heavy model/effort");
const existing = gh(`${endpoint}/reviews?per_page=100`);
assert(!existing.some((review) => review.commit_id === head && review.body?.startsWith("Quick review:")),
  "A plugin review already exists at this head. Do not repeat the live exercise blindly.");
const directory = await realpath(await mkdtemp(join(tmpdir(), "pr-review-live-publication-")));
execFileSync("git", ["init", "--quiet", directory]);
execFileSync("git", ["-C", directory, "remote", "add", "origin", "https://github.com/xpepper/copilot-pr-review.git"]);
const localState = () => execFileSync("git", ["-C", directory, "status", "--porcelain=v1", "--branch"], { encoding: "utf8" });
const before = localState();
const { CopilotClient, RuntimeConnection } = await import(pathToFileURL(resolve(sdkPath, "index.js")).href);
const client = new CopilotClient({ connection: RuntimeConnection.forStdio({ path: resolve(cliPath) }) });
let off;
try {
  const session = await client.createSession({
    ...settings, workingDirectory: directory,
    enableExperimentalMode: true, enableConfigDiscovery: true, requestExtensions: true,
    availableTools: [], onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
  });
  await session.rpc.extensions.reload();
  const done = Promise.withResolvers();
  const published = Promise.withResolvers();
  const active = Promise.withResolvers();
  const labels = new Set();
  const messages = [];
  const processes = await descendants();
  off = session.on((event) => {
    if (!["session.info", "session.error"].includes(event.type)) return;
    const message = event.data.message;
    messages.push(message);
    const match = /^Reviewer ([\w-]+): active$/.exec(message);
    if (match) labels.add(match[1]);
    if (labels.size === 3) active.resolve();
    if (message.startsWith("P2 evidence: ")) done.resolve(JSON.parse(message.slice(13)));
    if (message.startsWith("P5 evidence: ")) published.resolve(JSON.parse(message.slice(13)));
    if (message.startsWith("Review/publication failed:")) {
      done.reject(new Error(message));
      published.reject(new Error(message));
    }
  });
  const command = async (args) => {
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.equal(result.error, undefined, result.error);
  };
  const inspectRecord = () => JSON.parse(messages.findLast((message) => message.startsWith("P2 inspection: ")).slice(15));
  await command(`${number} --quick --all ${publishLater ? "--no-comment" : "--comment"} ` +
    `heavyModel=${settings.model} heavyEffort=${settings.reasoningEffort}`);
  await Promise.race([active.promise, done.promise.then(() => { throw new Error("Review did not reach specialists"); })]);
  const owned = (await descendants()).filter((row) => !processes.some((old) => old.pid === row.pid));
  assert.equal(owned.length, 1);
  const evidence = await done.promise;
  await assertExited(owned);
  await command("inspect");
  const reviewed = inspectRecord();
  validateRecord(reviewed, session.sessionId);
  assert.equal(reviewed.digest, evidence.digest);
  assert.equal(reviewed.outcome.binding.head, head);
  assert(reviewed.outcome.validation.findings.length > 0,
    "This inference run validated no finding; rerun the live exercise deliberately, never automatically.");
  assert.equal(messages.filter((message) => /^Reviewer [\w-]+: starting$/.test(message)).length, 4);
  let record = reviewed;
  if (publishLater) {
    assert.equal(reviewed.schemaVersion, 3);
    assert.equal(reviewed.outcome.preview.status, "suppressed");
    assert.equal(reviewed.outcome.preview.authorized, false);
    assert.equal(reviewed.outcome.publication.status, "not-attempted");
    // Publish from the reloaded on-disk record, under a new explicit authorization.
    await session.rpc.extensions.reload();
    await command("inspect");
    assert.deepEqual(inspectRecord(), reviewed);
    const before = await descendants();
    await command("publish");
    const publication = await published.promise;
    assert.equal(publication.status, "succeeded", JSON.stringify(publication));
    assert.equal(publication.authority.kind, "publish-later");
    await assertExited((await descendants()).filter((row) => !before.some((old) => old.pid === row.pid)));
    assert.equal(messages.filter((message) => /^Reviewer [\w-]+: starting$/.test(message)).length, 4,
      "Publish-later reruns no reviewer");
    await command("inspect");
    record = inspectRecord();
    validateRecord(record, session.sessionId);
    assert.equal(record.schemaVersion, 4);
    assert.equal(record.digest, publication.digest);
    assert.deepEqual({ ...record.outcome, publication: undefined }, { ...reviewed.outcome, publication: undefined });
  }
  assert.equal(record.outcome.publication.status, "succeeded", JSON.stringify(record.outcome.publication));
  console.log(`${publishLater ? "P5" : "P4"} live settled: session=${session.sessionId}; ` +
    `digest=${record.digest}; ownedPid=${owned[0].pid}`);
  const comments = verifyRemote(record);
  await session.rpc.extensions.reload();
  await command("inspect");
  assert.deepEqual(inspectRecord(), record);
  assert.equal(localState(), before);
  assert.equal(gh(endpoint).merged, false);
  console.log(`PASS ${publishLater ? "P5" : "P4"} LIVE: ${JSON.stringify({
    sessionId: session.sessionId, digest: record.digest, head, ownedPid: owned[0].pid,
    coverage: record.outcome.coverage, publication: record.outcome.publication,
    comments,
    reloadPreserved: true, merged: false,
  })}`);
} finally {
  off?.();
  try { assert.deepEqual(await client.stop(), []); }
  finally { await rm(directory, { recursive: true }); }
}
