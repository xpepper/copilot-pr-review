import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { finishPreview } from "../extensions/pr-review/preview.mjs";
import { publishCurrent } from "../extensions/pr-review/publication.mjs";
import { executePublishLater, publishRetained } from "../extensions/pr-review/publish-later.mjs";
import {
  inspectRetained, retainedFilename, retainedRecord, sessionStore, validateRecord,
} from "../extensions/pr-review/retention.mjs";
import { reviewKey } from "../extensions/pr-review/findings.mjs";
import { retentionFixture } from "./retention-fixture.mjs";
import { contentsResponse, pull, validationDiff } from "./target-fixture.mjs";

const directory = mkdtempSync(join(tmpdir(), "pr-review-publish-later-"));
const response = (status, body) => `HTTP/2.0 ${status} Response\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(body)}`;
const repoResponse = { node_id: "R_fixture", full_name: "fixture/repository", html_url: "https://github.com/fixture/repository" };
const reviewUrl = "https://github.com/fixture/repository/pull/12#pullrequestreview-123";
try {
  // Every harness retains a real `--no-comment` result: the run itself never had
  // posting authority, so only the later explicit command can publish it.
  async function harness({ policy = { noComment: true }, post, read, prepare } = {}) {
    const sessionId = randomUUID();
    const workspacePath = join(directory, sessionId);
    mkdirSync(workspacePath);
    const messages = [];
    const parent = {
      sessionId,
      capabilities: { ui: { elicitation: true } },
      ui: { elicitation: () => { throw new Error("Publish-later must not consult a UI or reuse retained confirmation."); } },
      rpc: {
        metadata: { snapshot: async () => ({
          sessionId, workspacePath, workingDirectory: directory, isRemote: false,
        }) },
        model: { list: () => { throw new Error("Publish-later must not touch models."); },
          getCurrent: () => { throw new Error("Publish-later must not touch models."); } },
      },
      async log(message) { messages.push(message); },
    };
    const capture = new AbortController();
    const fixture = await retentionFixture(sessionId, { includeBoundary: true });
    fixture.outcome.noComment = policy.noComment === true;
    const reviewed = await finishPreview(parent, fixture.outcome, policy, capture, fixture.boundary);
    await publishCurrent(parent, reviewed, fixture.boundary, {
      controller: capture, cwd: "/controlled", persist: () => {},
      gh: () => { throw new Error("A suppressed run must not reach GitHub."); },
    });
    const store = await sessionStore(parent);
    store.write(retainedRecord(reviewed));
    const controller = new AbortController();
    const calls = [];
    const success = (payload) => response(200, {
      id: 123, state: "COMMENTED", commit_id: payload.commit_id, body: payload.body, html_url: reviewUrl,
    });
    const h = { parent, controller, store, reviewed, calls, messages, success, sessionId, workspacePath };
    let pullReads = 0;
    h.gh = async (args, cwd, options) => {
      calls.push({ args, cwd, options });
      assert.equal(cwd, directory, "Publish-later runs gh in the current session directory");
      assert.notEqual(cwd, "/controlled", "The capture cwd is gone; identity comes from the binding");
      assert.deepEqual(args.slice(0, 3), ["api", "--hostname", "github.com"]);
      if (args[4] === "POST") {
        const record = store.read();
        assert.equal(record.schemaVersion, 4);
        assert.equal(record.outcome.publication.status, "in-flight", "Atomic journal precedes the write");
        assert.equal(record.outcome.publication.authority.kind, "publish-later");
        assert.deepEqual(args, ["api", "--hostname", "github.com", "--method", "POST",
          "repos/fixture/repository/pulls/12/reviews", "--include", "--input", "-",
          "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2022-11-28"]);
        const payload = JSON.parse(options.input);
        assert.deepEqual(payload, h.reviewed.preview.request.payload, "Exact retained canonical payload");
        return post ? post(h, payload) : success(payload);
      }
      assert.equal(args[4], "GET");
      const path = args[5];
      let value;
      if (path === "repos/fixture/repository") value = repoResponse;
      else if (path === "repos/fixture/repository/pulls/12") {
        value = args[7] === "Accept: application/vnd.github.diff" ? validationDiff : pull(12);
        if (typeof value !== "string") pullReads++;
      } else {
        const contents = /contents\/([^?]+)\?ref=([0-9a-f]{40})$/.exec(path);
        assert(contents, `Unexpected publish-later request: ${path}`);
        value = contentsResponse(decodeURIComponent(contents[1]), contents[2]);
      }
      if (read) value = await read(h, typeof value === "string" ? value : structuredClone(value), args, pullReads);
      return typeof value === "string" ? value : JSON.stringify(value);
    };
    await prepare?.(h);
    // Deliberately unreadable records have no comparable "before" state.
    try { h.before = store.read(); } catch { h.before = undefined; }
    h.run = () => executePublishLater(parent, { controller }, { gh: h.gh });
    return h;
  }

  // A previous publish-later attempt of the same retained result.
  const earlier = (h) => ({ kind: "publish-later", invocationId: randomUUID(), sessionId: h.sessionId });

  const endpoints = (h) => h.calls.map((call) => `${call.args[4]} ${call.args[5].replace("repos/fixture/repository", "")}` +
    `${call.args[7] === "Accept: application/vnd.github.diff" ? " (diff)" : ""}`);

  const positive = await harness();
  assert.equal(positive.before.schemaVersion, 3);
  assert.equal(positive.before.outcome.preview.status, "suppressed");
  assert.equal(positive.before.outcome.preview.authorized, false);
  assert.equal(positive.before.outcome.publication.status, "not-attempted");
  const result = await positive.run();
  assert.equal(result.publication.status, "succeeded");
  assert.deepEqual(result.publication.review, { id: 123, url: reviewUrl });
  assert.equal(result.publication.authority.kind, "publish-later");
  assert.equal(result.publication.authority.sessionId, positive.sessionId);
  assert.notEqual(result.publication.authority.invocationId, positive.before.invocation.invocationId);
  assert.deepEqual(endpoints(positive), [
    "GET ", "GET /pulls/12", "GET /pulls/12 (diff)", "GET /pulls/12",
    "GET /contents/total.js?ref=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "GET /contents/total.js?ref=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "GET /pulls/12", "POST /pulls/12/reviews",
  ], "Refetch identity, lifecycle, diff and both reviewed source revisions before dispatch");
  const published = positive.store.read();
  validateRecord(published, positive.sessionId);
  assert.equal(published.schemaVersion, 4);
  assert.equal(published.digest, result.publishLater.digest);
  assert.deepEqual(published.invocation, positive.before.invocation, "The originating review invocation is preserved");
  assert.deepEqual({ ...published.outcome, publication: undefined }, { ...positive.before.outcome, publication: undefined },
    "Findings, selection, coverage and historical proposal are unchanged");
  assert.equal(published.outcome.preview.submitted, false, "Legacy proposal state stays historical");
  assert.equal(published.outcome.preview.authorized, false, "The write used new authority, not retained authority");
  await inspectRetained(positive.parent);
  assert(positive.messages.some((message) => message.includes(`COMMENT review published: ${reviewUrl}`)));
  assert(positive.messages.some((message) => message.includes("attempted by the later explicit publish command")));
  assert(positive.messages.some((message) => message.includes("No reviewer, validator or parent inference ran")));
  const repeated = await positive.run();
  assert.equal(repeated.publication.status, "not-attempted");
  assert.match(repeated.publishLater.error, /already published as .*pullrequestreview-123/);
  assert.equal(positive.calls.filter((call) => call.args[4] === "POST").length, 1, "No repeat write");
  assert.deepEqual(positive.store.read(), published, "A refused repeat leaves the record untouched");
  console.log("PASS explicit publish-later of a --no-comment result: refetched evidence, exact payload, version-4 authority and no repeat");

  for (const [name, prepare, pattern] of [
    ["missing", (h) => rmSync(join(h.workspacePath, retainedFilename)), /no retained review result/],
    ["pending", (h) => h.store.write({
      schemaVersion: 3, state: "pending", invocation: { invocationId: randomUUID(), sessionId: h.sessionId },
    }), /unfinished or interrupted/],
    ["legacy", (h) => {
      const outcome = { ...h.reviewed, preview: undefined, publication: undefined };
      h.store.write(retainedRecord(outcome));
    }, /predates publication support/],
    ["wrong-session", (h) => {
      const record = retainedRecord({ ...h.reviewed, invocation: { invocationId: randomUUID(), sessionId: randomUUID() } });
      writeFileSync(join(h.workspacePath, retainedFilename), JSON.stringify(record));
    }, /wrong originating session/],
    ["corrupt", (h) => writeFileSync(join(h.workspacePath, retainedFilename), "{\"schemaVersion\":3}"), /incompatible object schema/],
    ["cancelled", (h) => {
      const outcome = { ...h.reviewed, cancelled: true, complete: false, coverage: "incomplete",
        selection: { ...h.reviewed.selection, status: "cancelled", findingIds: [] },
        preview: { policy: h.reviewed.preview.policy, status: "cancelled", authorized: false, submitted: false } };
      h.store.write(retainedRecord(outcome));
    }, /was cancelled/],
    ["unselected", (h) => {
      const outcome = { ...h.reviewed, selection: { ...h.reviewed.selection, status: "none", findingIds: [] },
        preview: { policy: h.reviewed.preview.policy, status: "not-selected", authorized: false, submitted: false } };
      h.store.write(retainedRecord(outcome));
    }, /no selected findings/],
    ["uncertain", (h) => h.store.write(retainedRecord({ ...h.reviewed, publication: {
      status: "uncertain", attempted: true, authority: earlier(h), error: "Lost acknowledgment.",
    } })), /previous publication outcome is unresolved/],
    ["in-flight", (h) => h.store.write(retainedRecord({ ...h.reviewed, publication: {
      status: "in-flight", attempted: true, authority: earlier(h),
    } })), /previous publication outcome is unresolved/],
  ]) {
    const h = await harness({ prepare });
    const outcome = await h.run();
    assert.equal(outcome.publication.status, "not-attempted", name);
    assert.match(outcome.publishLater.error, pattern, name);
    assert.equal(h.calls.length, 0, `${name} must not contact GitHub`);
    assert.equal(outcome.publishLater.dispatched, false, name);
    assert.equal(outcome.publishLater.digest, undefined, name);
    if (h.before) assert.deepEqual(h.store.read(), h.before, `${name} leaves the retained record untouched`);
  }
  console.log("PASS missing, unfinished, legacy, wrong-session, corrupt, cancelled, unselected and unresolved records are refused offline");

  for (const [name, change, pattern] of [
    ["repository", (value) => { if (value.node_id === "R_fixture") value.node_id = "other"; }, /repository identity changed/],
    ["pull", (value) => { if (value.number) value.node_id = "other"; }, /PR identity, reviewed head, or base changed/],
    ["head", (value) => { if (value.number) value.head.sha = "c".repeat(40); }, /reviewed head/],
    ["base", (value) => { if (value.number) value.base.sha = "c".repeat(40); }, /reviewed head, or base changed/],
    ["draft", (value) => { if (value.number) value.draft = true; }, /draft review overrides/],
    ["closed", (value) => { if (value.number) value.state = "closed"; }, /require an open PR/],
    ["merged", (value) => { if (value.number) { value.state = "closed"; value.merged = true; } }, /require an open PR/],
  ]) {
    const h = await harness({ read: (harnessValue, value) => { change(value); return value; } });
    const outcome = await h.run();
    assert.equal(outcome.publication.status, "not-attempted", name);
    assert.match(outcome.publishLater.error, pattern, name);
    assert(!h.calls.some((call) => call.args[4] === "POST"), name);
    assert.deepEqual(h.store.read(), h.before, name);
  }
  for (const [name, read, pattern] of [
    ["diff", (h, value) => (typeof value === "string" && value.startsWith("diff --git")
      ? value.replace("cents + quantity", "cents / quantity") : value), /current diff differs from the captured anchors/],
    ["source", (h, value, args) => (args[5].endsWith(`ref=${"b".repeat(40)}`)
      ? contentsResponse("total.js", "a".repeat(40)) : value), /not the blob recorded in the captured diff/],
    ["final-head", (h, value, args, pullReads) => {
      if (value.number && pullReads === 3) value.head.sha = "c".repeat(40);
      return value;
    }, /reviewed head/],
    ["preflight-cancel", (h, value, args) => {
      if (args[5].includes("/contents/")) h.controller.abort(new Error("Publication cancelled before dispatch."));
      return value;
    }, /cancelled before dispatch/],
  ]) {
    const h = await harness({ read });
    const outcome = await h.run();
    assert.equal(outcome.publication.status, "not-attempted", name);
    assert.match(outcome.publishLater.error, pattern, name);
    assert(!h.calls.some((call) => call.args[4] === "POST"), name);
    assert.deepEqual(h.store.read(), h.before, `${name} leaves the retained record untouched`);
    assert(h.messages.some((message) => message.includes("Nothing was written and the retained record is unchanged")), name);
  }
  console.log("PASS fresh repository/PR/head/base/lifecycle/diff/source gates, final-head drift and pre-dispatch cancellation");

  for (const [name, post, status] of [
    ["422", () => response(422, {}), "failed"],
    ["503", () => response(503, {}), "uncertain"],
    ["transport", () => { throw new Error("connection lost"); }, "uncertain"],
    ["malformed", () => "HTTP/2.0 200 OK\r\n\r\n{", "uncertain"],
    ["cancel", (h, payload) => { h.controller.abort(); return h.success(payload); }, "succeeded"],
  ]) {
    const h = await harness({ post });
    const outcome = await h.run();
    assert.equal(outcome.publication.status, status, name);
    assert.equal(outcome.publication.authority.kind, "publish-later", name);
    assert.equal(h.calls.filter((call) => call.args[4] === "POST").length, 1, "No retries");
    const record = h.store.read();
    assert.equal(record.schemaVersion, 4);
    assert.equal(record.outcome.cancelled, false, "A historical review is not retroactively cancelled");
    assert.equal(record.outcome.selection.status, "selected");
    assert.equal(record.outcome.publication.cancelRequested, name === "cancel" ? true : undefined, name);
    if (status !== "failed") {
      const again = await h.run();
      assert.equal(again.publication.status, "not-attempted");
      assert.match(again.publishLater.error, status === "succeeded" ? /already published/ : /unresolved/);
      assert.deepEqual(h.store.read(), record, "An unresolved or completed write is never repeated or erased");
    }
  }
  const retried = await harness({ post: (h) => (h.calls.filter((call) => call.args[4] === "POST").length > 1
    ? h.success(JSON.parse(h.calls.at(-1).options.input)) : response(422, {})) });
  const failed = await retried.run();
  assert.equal(failed.publication.status, "failed");
  const retry = await retried.run();
  assert.equal(retry.publication.status, "succeeded", "A definite failure may be retried under fresh gates");
  assert.notEqual(retry.publication.authority.invocationId, failed.publication.authority.invocationId,
    "Each retry carries its own explicit authorization");
  assert.equal(retried.calls.filter((call) => call.args[4] === "GET").length, 14, "Every gate reran for the retry");
  assert(retried.messages.some((message) => message.includes("previous attempt definitely failed")));
  console.log("PASS rejection versus uncertainty, post-dispatch cancellation, no blind repeats and gated retry after definite failure");

  for (const failAt of ["in-flight", "succeeded"]) {
    const h = await harness();
    const store = {
      read: h.store.read, cwd: directory,
      write(record) {
        if (record.outcome.publication?.status === failAt) throw new Error("disk unavailable");
        h.store.write(record);
      },
    };
    await assert.rejects(publishRetained(h.parent, {
      controller: h.controller, gh: h.gh, store,
      authority: { kind: "publish-later", invocationId: randomUUID(), sessionId: h.sessionId },
    }), /disk unavailable/);
    assert.equal(h.calls.filter((call) => call.args[4] === "POST").length, failAt === "in-flight" ? 0 : 1);
    assert.equal(h.store.read().outcome.publication.status, failAt === "in-flight" ? "not-attempted" : "in-flight");
  }
  const journalled = await harness({ post: () => { throw new Error("connection lost"); } });
  await journalled.run();
  const record = journalled.store.read();
  for (const mutate of [
    (value) => { value.schemaVersion = 3; },
    (value) => { delete value.outcome.publication.authority; },
    (value) => { value.outcome.publication.authority.kind = "flag-authorized"; },
    (value) => { value.outcome.publication.authority.sessionId = randomUUID(); },
    (value) => { value.outcome.publication.authority.invocationId = value.invocation.invocationId; },
    (value) => { value.outcome.publication.authority.extra = true; },
    (value) => { value.outcome.publication.attempted = false; },
    (value) => { value.outcome.selection.findingIds = []; },
  ]) {
    const tampered = structuredClone(record);
    mutate(tampered);
    tampered.digest = reviewKey(tampered.outcome);
    assert.throws(() => validateRecord(tampered, journalled.sessionId));
  }
  const legacy = retainedRecord({ ...journalled.reviewed, publication: { status: "not-attempted", attempted: false } });
  assert.equal(legacy.schemaVersion, 3, "Version-3 records stay version 3");
  validateRecord(legacy, journalled.sessionId);
  console.log("PASS storage failure prevents dispatch or preserves the journal, and strict version-4 authority schema");
} finally {
  rmSync(directory, { recursive: true });
}
