import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, rmdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectRetained, retainedFilename, retainedRecord, sessionStore, validateRecord } from "../extensions/pr-review/retention.mjs";
import { executeRetainedReview } from "../extensions/pr-review/retained-run.mjs";
import { parseReviewArgs } from "../extensions/pr-review/review.mjs";
import { reviewKey } from "../extensions/pr-review/findings.mjs";
import { respond } from "./target-fixture.mjs";
import { retentionFixture } from "./retention-fixture.mjs";
import { formatCoverage } from "../extensions/pr-review/coverage.mjs";

const directory = mkdtempSync(join(tmpdir(), "pr-review-retention-"));
const sessionId = randomUUID();
const workspace = join(directory, sessionId);
mkdirSync(workspace);
const messages = [];
const parent = {
  sessionId,
  rpc: { metadata: { async snapshot() {
    return { sessionId, isRemote: false, workspacePath: workspace, workingDirectory: directory };
  } } },
  async log(message) { messages.push(message); },
};
try {
  const outcome = await retentionFixture(sessionId);
  const record = retainedRecord(outcome);
  validateRecord(record, sessionId);
  assert.equal(record.outcome.validation.findings.length, 1);
  assert.equal(record.outcome.validation.duplicates.length, 1);
  assert.equal(record.outcome.validation.rejected.length, 1);
  assert(!JSON.stringify(record).includes('"result":'), "No raw reviewer or adjudicator output");
  assert(!JSON.stringify(record).includes('"candidate":'), "No duplicate candidate payload");
  const store = await sessionStore(parent);
  assert.equal(store.read(), undefined);
  await inspectRetained(parent);
  assert.match(messages.at(-1), /No retained/);
  store.write(record);
  assert.deepEqual((await sessionStore(parent)).read(), record, "Fresh store reload preserves exact binding and findings");
  await inspectRetained(parent);
  assert(messages.some((message) => message.includes("Selection: selected; IDs: correctness:1")));
  assert.equal(readFileSync(join(workspace, retainedFilename), "utf8"), JSON.stringify(record));
  assert.throws(() => validateRecord(record, "other-session"), /wrong originating session/);

  // The same schema retains a balanced record, whose reviewer topology differs.
  const balanced = retainedRecord(await retentionFixture(sessionId, { mode: "balanced" }));
  validateRecord(balanced, sessionId);
  assert.equal(balanced.outcome.mode, "balanced");
  assert.equal(balanced.outcome.reviewers.length, 5);
  assert.deepEqual(balanced.outcome.reviewers.map((reviewer) => reviewer.label),
    ["correctness", "contracts", "security", "performance-resources", "overview"]);
  assert.deepEqual(balanced.outcome.validation.capped, []);
  const wrongTopology = structuredClone(balanced);
  wrongTopology.outcome.mode = "quick";
  wrongTopology.digest = reviewKey(wrongTopology.outcome);
  assert.throws(() => validateRecord(wrongTopology, sessionId), /incomplete reviewer coverage/);

  // A full record carries the same schema with one more reviewer again.
  const full = retainedRecord(await retentionFixture(sessionId, { mode: "full" }));
  validateRecord(full, sessionId);
  assert.equal(full.outcome.mode, "full");
  assert.equal(full.outcome.reviewers.length, 6);
  assert.deepEqual(full.outcome.reviewers.map((reviewer) => reviewer.label),
    ["correctness", "contracts", "security", "performance-resources", "overview", "conventions-maintainability"]);
  assert.deepEqual(full.outcome.validation.capped, []);
  const fullAsBalanced = structuredClone(full);
  fullAsBalanced.outcome.mode = "balanced";
  fullAsBalanced.digest = reviewKey(fullAsBalanced.outcome);
  assert.throws(() => validateRecord(fullAsBalanced, sessionId), /incomplete reviewer coverage/);

  for (const mutate of [
    (r) => { r.schemaVersion = 2; }, (r) => { r.extra = true; },
    (r) => { r.outcome.invocation.invocationId = randomUUID(); },
    (r) => { r.outcome.binding.repository.id = "other"; },
    (r) => { r.outcome.binding.number = 13; },
    (r) => { r.outcome.binding.pullId = "other"; },
    (r) => { r.outcome.binding.head = "c".repeat(40); },
    (r) => { r.outcome.binding.diffSha256 = "d".repeat(64); },
    (r) => { r.outcome.selection.binding.sessionId = "other"; },
    (r) => { r.outcome.selection.binding.invocationId = randomUUID(); },
    (r) => { r.outcome.selection.findingIds.push("unknown"); },
    (r) => { r.outcome.selection.findingIds = ["contracts:1"]; },
    (r) => { r.outcome.selection.findingIds = ["security-performance-resources:1"]; },
    (r) => { r.outcome.selection.findingIds.push("correctness:1"); },
    (r) => { r.outcome.cancelled = true; },
    (r) => { r.outcome.coverage = "incomplete"; },
    (r) => { r.outcome.validation.findings[0].validation.allClaimsSupported = false; },
    (r) => { r.outcome.validation.findings[0].location.ref = "c".repeat(40); },
    (r) => { r.outcome.validation.findings[0].id = "contracts:1"; },
    (r) => { r.outcome.validation.findings.push(r.outcome.validation.findings[0]); },
    (r) => { r.outcome.reviewers[0].result = "raw output"; },
    (r) => { r.outcome.reviewers[0].status = "incomplete"; },
    (r) => { r.outcome.cleanupErrors = ["cleanup failure"]; },
    (r) => { r.outcome.validation.diagnostics = "not an array"; },
    (r) => { r.outcome.validation.diagnostics.push({ kind: "info", message: "Unknown kind" }); },
    (r) => { r.outcome.validation.diagnostics.push({ kind: "caveat", message: "" }); },
    (r) => { r.outcome.validation.diagnostics.push({ kind: "coverage-gap", message: "Unrecorded gap" }); },
    (r) => { r.outcome.validation.issues.push("Unclassified blocker"); },
  ]) {
    const invalid = structuredClone(record);
    mutate(invalid);
    invalid.digest = reviewKey(invalid.outcome);
    assert.throws(() => validateRecord(invalid, sessionId), /Invalid retained result/);
  }
  // Q5: a finding may cite the code its changed line breaks. The retained record
  // keeps that citation and binds it to the reviewed revision like any other,
  // and a record that carries none, or omits the field entirely, still reloads.
  assert.equal(record.outcome.validation.findings[0].breaks, null,
    "A finding that cited no broken code retains an explicit null, not an absent key");
  const breaking = structuredClone(record);
  breaking.outcome.validation.findings[0].breaks =
    structuredClone(record.outcome.validation.findings[0].evidence[0]);
  breaking.digest = reviewKey(breaking.outcome);
  validateRecord(breaking, sessionId);
  store.write(breaking);
  assert.deepEqual((await sessionStore(parent)).read(), breaking,
    "A reloaded finding keeps the broken-code citation exactly");
  const absent = structuredClone(record);
  delete absent.outcome.validation.findings[0].breaks;
  absent.digest = reviewKey(absent.outcome);
  validateRecord(absent, sessionId);
  for (const mutate of [
    (r) => { r.outcome.validation.findings[0].breaks.ref = "c".repeat(40); },
    (r) => { r.outcome.validation.findings[0].breaks.blobSha = "d".repeat(40); },
    (r) => { r.outcome.validation.findings[0].breaks.path = "other.js"; },
    (r) => { r.outcome.validation.findings[0].breaks.side = "base"; },
    (r) => { r.outcome.validation.findings[0].breaks.quote += "\nextra"; },
    (r) => { delete r.outcome.validation.findings[0].breaks.quote; },
    (r) => { r.outcome.validation.findings[0].breaks.startLine = 0; },
  ]) {
    const invalid = structuredClone(breaking);
    mutate(invalid);
    invalid.digest = reviewKey(invalid.outcome);
    assert.throws(() => validateRecord(invalid, sessionId), /Invalid retained result/);
  }
  store.write(record);

  const corrupt = structuredClone(record);
  corrupt.outcome.validation.findings[0].actual += " corrupted";
  assert.throws(() => validateRecord(corrupt, sessionId), /digest/);
  for (const raw of ["{", "null", "[]", '{"schemaVersion":0}', JSON.stringify(corrupt)]) {
    writeFileSync(join(workspace, retainedFilename), raw);
    await assert.rejects(inspectRetained(parent));
  }
  console.log("PASS strict schemas, corruption, attribution, session/PR/head/digest binding and canonical-only selection");

  // A reviewer its configured fallback recovered retains both attempts: the one
  // that produced the result, and the failed one it replaced.
  const recovered = await retentionFixture(sessionId);
  recovered.reviewers[0] = {
    ...recovered.reviewers[0], model: "fallback-model",
    usage: [{ model: "fallback-model", reasoningEffort: "high", isByok: false }],
    fallbackFrom: {
      model: "controlled-model", reasoningEffort: "high", sessionId: randomUUID(),
      status: "incomplete", error: "Reviewer session shut down before completion.",
      usage: [], startedAt: 1, completedAt: 2,
      policy: { permissionDenials: [], toolDenials: [], reads: [], toolCalls: [] },
    },
  };
  const fallbackRecord = retainedRecord(recovered);
  validateRecord(fallbackRecord, sessionId);
  assert.equal(fallbackRecord.outcome.reviewers[0].model, "fallback-model");
  assert.equal(fallbackRecord.outcome.reviewers[0].fallbackFrom.model, "controlled-model");
  assert(!("policy" in fallbackRecord.outcome.reviewers[0].fallbackFrom),
    "The retained record keeps no live policy object, for a fallback attempt either");
  assert.equal(fallbackRecord.outcome.complete, true,
    "A recovered reviewer completes its coverage; the failed attempt is a caveat, not a blocker");
  const caveats = formatCoverage(fallbackRecord.outcome);
  assert.match(caveats, /Informational caveat: correctness: primary model=controlled-model reasoning=high failed/);
  assert.match(caveats, /completed this reviewer\./);
  store.write(fallbackRecord);
  await inspectRetained(parent);
  assert(messages.at(-2).includes("correctness: completed (one configured fallback attempt on fallback-model, " +
    "after controlled-model failed)"), "Inspection names the attempt that ran and the one it replaced");
  for (const mutate of [
    // A fallback never replaces an attempt that did not fail, and never repeats
    // the assignment that just failed.
    (r) => { r.outcome.reviewers[0].fallbackFrom.status = "completed"; },
    (r) => { r.outcome.reviewers[0].fallbackFrom.status = "cancelled"; },
    (r) => { r.outcome.reviewers[0].fallbackFrom.model = "fallback-model"; },
    (r) => { r.outcome.reviewers[0].fallbackFrom.label = "correctness"; },
    (r) => { delete r.outcome.reviewers[0].fallbackFrom.model; },
  ]) {
    const invalid = structuredClone(fallbackRecord);
    mutate(invalid);
    invalid.digest = reviewKey(invalid.outcome);
    assert.throws(() => validateRecord(invalid, sessionId), /Invalid retained result/);
  }
  console.log("PASS a recovered reviewer retains both attempts, and a fallback that replaced nothing is rejected");

  for (const mixed of [false, true]) {
    const value = await retentionFixture(sessionId, {
      reviewerLimitations: [{ kind: "caveat", reason: "External library internals not audited.", impact: null }],
      adjudicatorLimitations: mixed ? [{
        kind: "coverage-gap", reason: "Rounding contract absent.",
        impact: "The changed adapter's precision cannot be assessed.",
      }] : [],
    });
    if (mixed) {
      value.reviewers[2].status = "incomplete";
      value.reviewers[2].error = "Synthetic reviewer crash";
      value.executionComplete = false;
    }
    store.write(retainedRecord(value));
    const loaded = (await sessionStore(parent)).read();
    assert.equal(loaded.outcome.complete, !mixed);
    assert.equal(loaded.outcome.validation.findings.length, 1);
    assert.deepEqual(loaded.outcome.validation.diagnostics, value.validation.diagnostics);
    await inspectRetained(parent);
    assert(messages.at(-2).includes(formatCoverage(loaded.outcome)));
    assert.match(messages.at(-2), /Informational caveat: correctness: External library/);
    if (mixed) {
      assert.match(messages.at(-2), /Coverage gap: Adjudicator: Rounding contract absent/);
      assert.match(messages.at(-2), /Execution failure: security-performance-resources: incomplete; Synthetic reviewer crash/);
    } else assert.doesNotMatch(messages.at(-2), /INCOMPLETE|incomplete/);
  }
  const legacy = structuredClone(outcome);
  delete legacy.validation.diagnostics;
  legacy.validation.issues = ["External library internals not audited."];
  legacy.complete = legacy.reviewComplete = legacy.validation.complete = false;
  legacy.coverage = "incomplete";
  store.write(retainedRecord(legacy));
  await inspectRetained(parent);
  assert.match(messages.at(-2), /Legacy unclassified issue \(kept incomplete\)/);
  assert.equal(store.read().outcome.validation.diagnostics, undefined, "Inspection does not migrate legacy uncertainty");
  console.log("PASS classified inspection/reload and conservative unmodified legacy results");

  for (const state of ["empty", "none", "unavailable", "failed", "cancelled", "degraded"]) {
    const value = structuredClone(outcome);
    value.selection.status = state === "degraded" ? "selected" : state;
    if (state !== "degraded") value.selection.findingIds = [];
    if (state === "empty") value.validation = { complete: true, findings: [], issues: [], duplicates: [], rejected: [] };
    if (state === "cancelled" || state === "degraded") {
      value.complete = false;
      value.coverage = "incomplete";
      value.cancelled = state === "cancelled";
      value.reviewers[0].status = state === "cancelled" ? "cancelled" : "incomplete";
      value.reviewers[0].error = "interrupted reviewer";
      value.reviewers[0].completedAt = null;
      value.cleanupErrors = ["recorded cleanup error"];
    }
    store.write(retainedRecord(value));
    await inspectRetained(parent);
    assert.equal(store.read().outcome.selection.status, value.selection.status);
    assert.match(messages.at(-2), /not a clean-review claim/);
  }
  const pending = { schemaVersion: 1, state: "pending", invocation: outcome.invocation };
  store.write(pending);
  await inspectRetained(parent);
  assert.match(messages.at(-1), /unfinished\/interrupted/);
  assert.equal(store.read().outcome, undefined, "Interrupted next invocation supersedes old selected result");
  console.log("PASS selected/none/empty/failed/unavailable/degraded/cancelled states and interrupted replacement");

  const otherId = randomUUID();
  const otherWorkspace = join(directory, otherId);
  mkdirSync(otherWorkspace);
  const other = { ...parent, sessionId: otherId, rpc: { metadata: { async snapshot() {
    return { sessionId: otherId, workspacePath: otherWorkspace, isRemote: false, workingDirectory: directory };
  } } } };
  assert.equal((await sessionStore(other)).read(), undefined);
  writeFileSync(join(otherWorkspace, retainedFilename), JSON.stringify(record));
  await assert.rejects(inspectRetained(other), /wrong originating session/);
  for (const changes of [{ isRemote: true }, { alreadyInUse: true }, { workspacePath: null }, { sessionId: otherId },
    { workspacePath: directory }]) {
    await assert.rejects(sessionStore({ ...parent, rpc: { metadata: { async snapshot() {
      return { ...await parent.rpc.metadata.snapshot(), ...changes };
    } } } }), /workspace unavailable/);
  }
  rmSync(join(workspace, retainedFilename));
  symlinkSync(join(otherWorkspace, retainedFilename), join(workspace, retainedFilename));
  await assert.rejects(inspectRetained(parent), /unsafe retained file/);
  rmSync(join(workspace, retainedFilename));
  mkdirSync(join(workspace, retainedFilename));
  assert.throws(() => store.write(record), /directory|EISDIR/);
  await assert.rejects(inspectRetained(parent), /unsafe retained file/);
  rmdirSync(join(workspace, retainedFilename));
  console.log("PASS session isolation, unavailable/remote workspace and explicit unsafe-file/read/write errors");

  const assignments = ["correctness", "contracts", "security-performance-resources"].map((label) => ({ label, model: "controlled" }));
  for (const cancelAt of ["none", "before-run", "final-log"]) {
    store.write(record);
    const controller = new AbortController();
    if (cancelAt === "before-run") controller.abort(new DOMException("cancel", "AbortError"));
    const h = { ...parent, log: async (message) => {
      messages.push(message);
      if (cancelAt === "final-log" && message.startsWith("Publication:")) controller.abort(new DOMException("cancel", "AbortError"));
    } };
    const history = [];
    let stops = 0;
    const result = await executeRetainedReview(h, {
      async start() { assert.fail("Skipped target must not start inference"); },
      async stop() { stops++; return []; },
    }, parseReviewArgs("2 --quick --no-comment --all"), assignments, {
      controller, gh: async (args, cwd) => {
        const result = respond(args, cwd, history);
        history.push({ args, cwd });
        return result;
      },
    });
    assert.equal(stops, 1);
    assert.equal(result.retention.state, "settled");
    assert.deepEqual(store.read().outcome.selection.findingIds, []);
    assert.equal(store.read().outcome.selection.status, cancelAt === "none" ? "not-started" : "cancelled");
    assert.notEqual(store.read().invocation.invocationId, record.invocation.invocationId);
  }
  console.log("PASS retained-run integration, skipped target, pre-run and final-log cancellation with no inference");
} finally {
  rmSync(directory, { recursive: true });
}
