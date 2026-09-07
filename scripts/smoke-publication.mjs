import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { finishPreview, buildReviewPreview } from "../extensions/pr-review/preview.mjs";
import {
  cancelPublication, interpretWrite, publicationSummary, publishCurrent,
} from "../extensions/pr-review/publication.mjs";
import { retainedRecord, sessionStore, validateRecord, inspectRetained } from "../extensions/pr-review/retention.mjs";
import { executeRetainedQuick } from "../extensions/pr-review/retained-run.mjs";
import { reviewKey } from "../extensions/pr-review/findings.mjs";
import { retentionFixture } from "./retention-fixture.mjs";
import { pull, validationDiff } from "./target-fixture.mjs";

const directory = mkdtempSync(join(tmpdir(), "pr-review-publication-"));
const response = (status, body) => `HTTP/2.0 ${status} Response\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(body)}`;
const repoResponse = { node_id: "R_fixture", full_name: "fixture/repository", html_url: "https://github.com/fixture/repository" };
try {
  async function harness({ policy = { comment: true }, answer, post, read, persist } = {}) {
    const sessionId = randomUUID();
    const workspacePath = join(directory, sessionId);
    mkdirSync(workspacePath);
    const messages = [];
    const parent = {
      sessionId, capabilities: { ui: { elicitation: !!answer } },
      ui: { elicitation: answer },
      rpc: { metadata: { snapshot: async () => ({
        sessionId, workspacePath, workingDirectory: directory, isRemote: false,
      }) } },
      async log(message) { messages.push(message); },
    };
    const controller = new AbortController();
    const fixture = await retentionFixture(sessionId, { includeBoundary: true });
    fixture.outcome.noComment = policy.noComment ?? false;
    const outcome = await finishPreview(parent, fixture.outcome, policy, controller, fixture.boundary);
    const store = await sessionStore(parent);
    const calls = [];
    const writes = [];
    const success = (request) => response(200, {
      id: 123, state: "COMMENTED", commit_id: request.commit_id, body: request.body,
      html_url: "https://github.com/fixture/repository/pull/12#pullrequestreview-123",
    });
    const h = { parent, controller, outcome, boundary: fixture.boundary, store, calls, writes, messages, success };
    const gh = async (args, cwd, options) => {
      calls.push({ args, cwd, options });
      assert.equal(cwd, "/captured-checkout", "Never use a changed parent cwd to target the mutation");
      assert.deepEqual(args.slice(0, 3), ["api", "--hostname", "github.com"]);
      if (args[4] === "POST") {
        const record = store.read();
        assert.equal(record.schemaVersion, 3);
        assert.equal(record.outcome.publication.status, "in-flight", "Atomic journal precedes the write");
        assert.deepEqual(JSON.parse(options.input), outcome.preview.request.payload);
        assert.deepEqual(args, ["api", "--hostname", "github.com", "--method", "POST",
          "repos/fixture/repository/pulls/12/reviews", "--include", "--input", "-",
          "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2022-11-28"]);
        return post ? post(h, JSON.parse(options.input)) : success(JSON.parse(options.input));
      }
      assert.equal(args[4], "GET");
      let value = args[5] === "repos/fixture/repository" ? repoResponse :
        args[7] === "Accept: application/vnd.github.diff" ? validationDiff : pull(12);
      if (read) value = await read(h, structuredClone(value), args);
      return typeof value === "string" ? value : JSON.stringify(value);
    };
    h.run = () => publishCurrent(parent, outcome, fixture.boundary, {
      controller, cwd: "/captured-checkout", gh,
      persist(value) {
        if (persist) persist(h, value);
        const record = retainedRecord(value);
        store.write(record);
        writes.push(record);
      },
    });
    return h;
  }

  const positive = await harness();
  const published = await positive.run();
  assert.deepEqual(published.publication, {
    status: "succeeded", attempted: true,
    review: { id: 123, url: "https://github.com/fixture/repository/pull/12#pullrequestreview-123" },
  });
  assert.deepEqual(positive.calls.map((call) => call.args[4]), ["GET", "GET", "GET", "GET", "POST"]);
  assert.deepEqual(positive.writes.map((record) => record.outcome.publication.status), ["in-flight", "succeeded"]);
  assert.equal(positive.store.read().digest, retainedRecord(published).digest);
  await inspectRetained(positive.parent);
  assert(positive.messages.some((message) => message.includes("COMMENT review published:")));
  assert(!positive.messages.at(-2).includes("Nothing was published"));
  await assert.rejects(positive.run(), /already has a publication/);
  assert.equal(positive.calls.length, 5);
  console.log("PASS exact COMMENT payload, captured cwd/identity, fresh diff/head checks, atomic write-ahead and success retention");

  for (const policy of [{ noComment: true }, {}, { comment: false }]) {
    const h = await harness({ policy });
    await h.run();
    assert.equal(h.outcome.publication.status, "not-attempted");
    assert.equal(h.calls.length, 0);
    validateRecord(retainedRecord(h.outcome), h.parent.sessionId);
  }
  for (const answer of [
    async () => ({ action: "decline" }),
    async () => ({ action: "accept", content: { authorize: false } }),
    async () => ({ action: "accept", content: { authorize: "true" } }),
    async () => ({ action: "cancel" }),
  ]) {
    const h = await harness({ policy: {}, answer });
    await h.run();
    assert.equal(h.calls.length, 0);
    validateRecord(retainedRecord(h.outcome), h.parent.sessionId);
  }
  const confirmed = await harness({ policy: {}, answer: async () => ({ action: "accept", content: { authorize: true } }) });
  await confirmed.run();
  assert.equal(confirmed.outcome.publication.status, "succeeded");
  const cancelled = await harness();
  cancelled.controller.abort();
  await cancelled.run();
  assert.equal(cancelled.calls.length, 0);
  assert.equal(cancelled.outcome.selection.status, "cancelled");
  validateRecord(retainedRecord(cancelled.outcome), cancelled.parent.sessionId);
  console.log("PASS suppression, missing/declined/malformed confirmation and cancellation never write; explicit confirmation does");

  for (const mutate of [
    (h) => { h.outcome.preview.request.payload.event = "APPROVE"; },
    (h) => { h.outcome.preview.request.payload.event = "REQUEST_CHANGES"; },
    (h) => { h.outcome.preview.request.payload.comments = []; },
    (h) => { h.outcome.preview.request.payload.comments[0].line++; },
    (h) => { h.outcome.selection.findingIds = ["raw:1"]; },
    (h) => { h.outcome.validation.findings[0].location.quote = "not source"; },
    (h) => { h.boundary.files[0].hunks = []; },
    (h) => { h.parent.sessionId = "another-session"; },
  ]) {
    const h = await harness();
    mutate(h);
    await h.run();
    assert.equal(h.outcome.publication.status, "not-attempted");
    assert.equal(h.calls.length, 0);
    assert.match(h.outcome.publication.error, /Invalid|refused|Citation/);
  }
  for (const changed of ["repository", "pull", "head", "base", "draft", "closed", "merged", "diff", "final-head", "midflight-cancel", "input"]) {
    let pullReads = 0;
    const h = await harness({
      read(h, value) {
        if (value.node_id === "R_fixture" && changed === "repository") value.node_id = "other";
        if (typeof value === "string" && changed === "diff") return value.replace("cents + quantity", "cents - quantity");
        if (value.number) {
          pullReads++;
          if (changed === "head" || changed === "final-head" && pullReads === 2) value.head.sha = "c".repeat(40);
          if (changed === "base") value.base.sha = "c".repeat(40);
          if (changed === "pull") value.node_id = "other";
          if (changed === "draft") value.draft = true;
          if (["closed", "merged"].includes(changed)) { value.state = "closed"; value.merged = changed === "merged"; }
          if (changed === "midflight-cancel") h.controller.abort();
          if (changed === "input") h.outcome.validation.findings[0].actual = "changed after confirmation";
        }
        return value;
      },
    });
    await h.run();
    assert.equal(h.outcome.publication.status, "not-attempted", changed);
    assert(h.outcome.publication.error, changed);
    assert(!h.calls.some((call) => call.args[4] === "POST"));
  }
  console.log("PASS canonical anchor/event gates, repository/PR/head/base/diff drift, draft/non-open gates and preflight interruption");

  for (const [name, post, status] of [
    ["403", () => { throw Object.assign(new Error("gh rejected"), { cause: { stdout: response(403, {}) } }); }, "failed"],
    ["422", () => response(422, {}), "failed"],
    ["503", () => response(503, {}), "uncertain"],
    ["transport", () => { throw new Error("lost connection"); }, "uncertain"],
    ["malformed", () => "HTTP/2.0 200 OK\r\n\r\n{", "uncertain"],
    ["mismatched", () => response(200, { id: 1, state: "APPROVED" }), "uncertain"],
    ["cancel-pending", (h) => { h.controller.abort(); throw new Error("aborted"); }, "uncertain"],
    ["cancel-success", (h, payload) => { h.controller.abort(); return h.success(payload); }, "succeeded"],
  ]) {
    const h = await harness({ post });
    await h.run();
    assert.equal(h.outcome.publication.status, status, name);
    assert.equal(h.calls.filter((call) => call.args[4] === "POST").length, 1, "No retries");
    assert.equal(h.outcome.cancelled, false, "Review/selection are historical once a write may have happened");
    if (name.startsWith("cancel")) assert.equal(h.outcome.publication.cancelRequested, true);
    validateRecord(retainedRecord(h.outcome), h.parent.sessionId);
    if (status === "uncertain") {
      await assert.rejects(executeRetainedQuick(h.parent, {}, {}, [], { controller: h.controller }), /Previous publication is uncertain/);
      assert.equal(h.store.read().digest, retainedRecord(h.outcome).digest, "Do not replace an unresolved journal");
      assert.match(publicationSummary(h.outcome.publication), /UNCERTAIN.*may have received/);
    }
  }
  console.log("PASS HTTP rejection versus uncertainty, malformed/mismatched acknowledgments, cancellation after dispatch and no retry/overwrite");

  for (const failAt of ["in-flight", "succeeded"]) {
    const h = await harness({ persist(h, value) {
      if (value.publication.status === failAt) throw new Error("disk unavailable");
    } });
    await assert.rejects(h.run(), /disk unavailable/);
    assert.equal(h.calls.filter((call) => call.args[4] === "POST").length, failAt === "in-flight" ? 0 : 1);
    if (failAt === "succeeded") {
      assert.equal(h.store.read().outcome.publication.status, "in-flight");
      await assert.rejects(executeRetainedQuick(h.parent, {}, {}, [], { controller: h.controller }), /Previous publication is uncertain/);
      await inspectRetained(h.parent);
      assert(h.messages.some((message) => message.includes("UNCERTAIN")));
    }
  }
  cancelPublication(published);
  validateRecord(retainedRecord(published), positive.parent.sessionId);
  assert.equal(published.publication.status, "succeeded");
  assert(published.selection.findingIds.length);
  for (const mutate of [
    (r) => { r.schemaVersion = 2; },
    (r) => { delete r.outcome.publication; },
    (r) => { r.outcome.publication.extra = true; },
    (r) => { r.outcome.publication.attempted = false; },
    (r) => { r.outcome.publication.review.url = "https://example.invalid"; },
    (r) => { r.outcome.publication.status = "not-attempted"; },
    (r) => { r.outcome.preview.authorized = false; },
    (r) => { r.outcome.publication.cancelRequested = false; },
  ]) {
    const record = retainedRecord(published);
    mutate(record);
    record.digest = reviewKey(record.outcome);
    assert.throws(() => validateRecord(record, positive.parent.sessionId));
  }
  assert.equal(interpretWrite("not HTTP", null, buildReviewPreview(confirmed.outcome, confirmed.boundary)).status, "uncertain");
  console.log("PASS persistence failure prevents dispatch or preserves in-flight journal; post-write cancellation and strict version-3 schema");
} finally {
  rmSync(directory, { recursive: true });
}
