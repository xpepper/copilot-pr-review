import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assembleContext } from "../extensions/pr-review/context.mjs";
import { quickBinding } from "../extensions/pr-review/quick.mjs";
import {
  adjudicateCandidates, collectCandidates, evidenceBoundary, formatFindings, reviewKey,
} from "../extensions/pr-review/findings.mjs";
import { blobSha, validationBaseSource, validationHeadSource, validationDiff } from "./target-fixture.mjs";

const baseText = validationBaseSource;
const headText = validationHeadSource;
const diff = validationDiff;
const repository = { id: "R_fixture", nameWithOwner: "fixture/repository", host: "github.com" };
const snapshot = {
  repository, pull: { id: "PR_1", number: 1, changedFiles: 1, head: { sha: "b".repeat(40) }, base: { sha: "a".repeat(40) } },
  diff, diffSha256: createHash("sha256").update(diff).digest("hex"),
};
const context = await assembleContext(snapshot, {
  gh: async (args) => {
    const text = args[5].endsWith("b".repeat(40)) ? headText : baseText;
    return JSON.stringify({
      type: "file", path: "total.js", encoding: "base64", sha: blobSha(text),
      size: Buffer.byteLength(text), content: Buffer.from(text).toString("base64"),
    });
  },
});
const binding = quickBinding(snapshot, context);
const boundary = evidenceBoundary(snapshot, context, binding);
const key = reviewKey(binding);
const citation = (side, line = 3) => ({
  path: "total.js", side, startLine: line, endLine: line,
  quote: (side === "head" ? headText : baseText).split("\n")[line - 1],
});
const candidate = {
  title: "Multiply the unit price by quantity", severity: "P2", confidence: 0.95,
  location: citation("head"), trigger: "total(100, 3)",
  expected: "300 cents, per the documented multiplication contract",
  actual: "103 cents; the customer is undercharged by 197 cents",
  introduction: "The changed operator adds quantity instead of multiplying the unit price.",
  before: citation("base"), after: citation("head"), evidence: [citation("head", 1)],
};
const reviewer = (candidates = [candidate], changes = {}) => ({
  label: "correctness", status: "completed",
  result: JSON.stringify({ schemaVersion: 1, reviewKey: key, candidates, limitations: [] }), ...changes,
});
const decision = (id = "correctness:1", changes = {}) => ({
  candidateId: id, verdict: "accept", allClaimsSupported: true,
  reason: "The unchanged contract requires multiplication; 100 * 3 was 300, while the changed expression yields 103.",
  evidence: [citation("head", 1), citation("base"), citation("head")], duplicateOf: null, ...changes,
});
const validator = (decisions = [decision()], changes = {}) => ({
  status: "completed", result: JSON.stringify({ schemaVersion: 1, reviewKey: key, decisions, limitations: [] }),
  ...changes,
});
const collected = collectCandidates([reviewer()], boundary);
assert.equal(collected.issues.length, 0);
const result = adjudicateCandidates(collected, validator(), boundary);
assert.equal(result.complete, true);
assert.equal(result.findings.length, 1);
assert.equal(result.findings[0].validation.allClaimsSupported, true);
assert.equal(result.findings[0].location.ref, binding.head);
assert.equal(result.findings[0].before.blobSha, blobSha(baseText));
assert.match(formatFindings({ validation: result, complete: true }), /\[P2\].*Multiply/);
assert.match(formatFindings({ validation: result, complete: true }), /confidence 0.95/);

for (const mutate of [
  (c) => { c.severity = "P3"; }, (c) => { c.confidence = 0.4; },
  (c) => { c.confidence = "0.95"; }, (c) => { c.confidence = 1.1; },
  (c) => { c.actual = " "; }, (c) => { c.extra = true; },
  (c) => { c.location.path = "../total.js"; }, (c) => { c.location.side = "RIGHT"; },
  (c) => { c.location.startLine = 0; }, (c) => { c.location.endLine = 3.5; },
  (c) => { c.location.quote = "  return cents - quantity;"; },
  (c) => { c.location = citation("head", 1); },
  (c) => { c.before = null; }, (c) => { c.before = citation("head"); },
  (c) => { c.before = citation("base", 1); },
  (c) => { c.evidence = []; }, (c) => { c.evidence[0].quote += "\n"; },
  (c) => { c.location.ref = binding.head; },
]) {
  const bad = structuredClone(candidate);
  mutate(bad);
  const rejected = collectCandidates([reviewer([bad, candidate])], boundary);
  assert.equal(rejected.candidates.length, 1, "Reject only the invalid candidate, retaining its valid sibling");
  assert.equal(rejected.issues.length, 1);
}
for (const raw of ["not JSON", "```json\n{}\n```", '{"schemaVersion":1', "null", "[]",
  JSON.stringify({ schemaVersion: 1, reviewKey: "wrong", candidates: [candidate], limitations: [] }),
  JSON.stringify({ schemaVersion: 1, reviewKey: key, candidates: [], limitations: [], clean: true }),
]) {
  const malformed = collectCandidates([reviewer([], { result: raw })], boundary);
  assert.equal(malformed.candidates.length, 0);
  assert.equal(adjudicateCandidates(malformed, undefined, boundary).complete, false);
}
const preExisting = structuredClone(candidate);
preExisting.location = citation("head", 2);
assert.match(collectCandidates([reviewer([preExisting])], boundary).issues[0], /changed lines/);
for (const reason of [
  "False positive: the proposed expected behavior contradicts the unchanged contract.",
  "Pre-existing: the cited edge case already fails on the captured base; the changed operator is irrelevant.",
]) {
  const rejected = adjudicateCandidates(collected, validator([decision(undefined, {
    verdict: "reject", reason, evidence: [], allClaimsSupported: false,
  })]), boundary);
  assert.equal(rejected.findings.length, 0);
  assert.equal(rejected.rejected[0].reason, reason);
  assert.equal(rejected.complete, true, "A resolved false positive is not a validation failure");
}
const uncertain = adjudicateCandidates(collected, validator([decision(undefined, {
  verdict: "uncertain", reason: "The claimed caller is absent from supplied context.", evidence: [], allClaimsSupported: false,
})]), boundary);
assert.equal(uncertain.complete, false);
assert.equal(uncertain.findings.length, 0);

const peers = collectCandidates([
  reviewer(), reviewer([{ ...candidate, title: "Addition undercharges customers" }], { label: "contracts" }),
  reviewer([{ ...candidate, title: "Separate issue on same line", trigger: "a different condition", actual: "a distinct effect" }],
    { label: "security-performance-resources" }),
], boundary);
const deduplicated = adjudicateCandidates(peers, validator([
  decision(), decision("contracts:1", { duplicateOf: "correctness:1", reason: "Same changed operator, numeric trigger and undercharge." }),
  decision("security-performance-resources:1"),
]), boundary);
assert.equal(deduplicated.findings.length, 2, "Only an explicit same-defect decision merges reports");
assert.equal(deduplicated.duplicates.length, 1);
assert.deepEqual(deduplicated.findings[0].reportedBy, ["correctness", "contracts"]);
assert.equal(deduplicated.duplicates[0].candidate.title, "Addition undercharges customers");
const wider = structuredClone(candidate);
wider.before = { ...citation("base"), startLine: 2, quote: baseText.split("\n").slice(1, 3).join("\n") };
wider.after = { ...citation("head"), startLine: 2, quote: headText.split("\n").slice(1, 3).join("\n") };
wider.severity = "P1";
const widerPeers = collectCandidates([reviewer(), reviewer([wider], { label: "contracts" })], boundary);
const widerResult = adjudicateCandidates(widerPeers, validator([
  decision(), decision("contracts:1", { duplicateOf: "correctness:1" }),
]), boundary);
assert.equal(widerResult.findings.length, 1, "Different quote ranges can describe the same defect");
assert.equal(widerResult.findings[0].severity, "P1", "Do not suppress an accepted higher-severity report");
assert.equal(widerResult.duplicates[0].previousRepresentative.severity, "P2");
for (const changes of [
  { evidence: [] }, { evidence: [{ ...citation("head"), quote: "invented" }] },
  { duplicateOf: "not-a-candidate" }, { verdict: "APPROVE" },
  { extra: true }, { reason: "" }, { duplicateOf: "correctness:1" },
  { allClaimsSupported: false, reason: "The main defect exists but the candidate also asserts a false effect." },
  { allClaimsSupported: "true" },
  { allClaimsSupported: undefined },
]) {
  const invalid = adjudicateCandidates(collected, validator([decision(undefined, changes)]), boundary);
  assert.equal(invalid.findings.length, 0);
  assert.equal(invalid.complete, false);
}
const partlyTrue = adjudicateCandidates(peers, validator([
  decision(undefined, { allClaimsSupported: false, reason: "Only the core claim is true, not all its stated effects." }),
  decision("contracts:1"), decision("security-performance-resources:1", { verdict: "reject", allClaimsSupported: false }),
]), boundary);
assert.equal(partlyTrue.findings.length, 1, "Keep the fully supported peer, not the partially true report");
assert.equal(partlyTrue.findings[0].id, "contracts:1");
assert.equal(partlyTrue.complete, false, "Contradictory acceptance is not completed validation");
for (const decisions of [[], [decision(), decision()], [decision("wrong-id")]]) {
  assert.equal(adjudicateCandidates(collected, validator(decisions), boundary).complete, false);
}
for (const changes of [{ status: "incomplete" }, { result: "```json\n{}\n```" }, { result: "null" }]) {
  assert.equal(adjudicateCandidates(collected, validator(undefined, changes), boundary).findings.length, 0);
}
const degraded = collectCandidates([reviewer(), reviewer([], { label: "contracts", status: "incomplete" })], boundary);
const retained = adjudicateCandidates(degraded, validator(), boundary);
assert.equal(retained.complete, false);
assert.equal(retained.findings.length, 1);
assert.match(formatFindings({ validation: retained, complete: false }), /incomplete coverage/);
const empty = adjudicateCandidates(collectCandidates([reviewer([])], boundary), undefined, boundary);
assert.equal(empty.complete, true);
assert.match(formatFindings({ validation: empty, complete: true }), /not proof of a clean PR/);

for (const mutate of [
  (s, _c, _b) => { s.diff += "\n"; },
  (_s, c, _b) => { c.files[0].sources[0].lines[2] = "tampered"; },
  (_s, _c, b) => { b.head = "c".repeat(40); },
  (_s, _c, b) => { b.repository.id = "different"; },
  (_s, _c, b) => { b.number = 2; },
]) {
  const copies = [snapshot, context, binding].map((value) => structuredClone(value));
  mutate(...copies);
  assert.throws(() => evidenceBoundary(...copies), /binding/);
}
for (const mutate of [
  (c) => { c.files[0].sources[0].blobSha = "d".repeat(40); },
  (c) => { c.files[0].sources[0].ref = "d".repeat(40); },
  (c) => { c.files[0].sources[0].windows = [{ start: 1, end: 1 }]; },
]) {
  const bad = structuredClone(context);
  mutate(bad);
  assert.throws(() => evidenceBoundary(snapshot, bad, binding), /binding/);
}

// These cases test evidence eligibility, not a model's semantic judgment of these edits.
for (const kind of ["added", "deleted", "renamed", "inserted", "removed", "inserted-context", "removed-context"]) {
  const added = kind === "added";
  const deleted = kind === "deleted";
  const insertion = kind.startsWith("inserted");
  const removal = kind.startsWith("removed");
  const withContext = kind.endsWith("-context");
  const oldPath = added ? null : "old.js";
  const newPath = deleted ? null : kind === "renamed" ? "new.js" : "old.js";
  const base = withContext ? insertion ? "kept\n" : "kept\nold\n" : added ? "" : "old\n";
  const head = withContext ? removal ? "kept\n" : "kept\nnew\n"
    : deleted ? "" : insertion ? "new\nold\n" : removal ? "" : "new\n";
  const patch = [
    `diff --git a/${oldPath ?? newPath} b/${newPath ?? oldPath}`,
    ...(added ? ["new file mode 100644"] : deleted ? ["deleted file mode 100644"] :
      kind === "renamed" ? ["rename from old.js", "rename to new.js"] : []),
    `--- ${oldPath ? `a/${oldPath}` : "/dev/null"}`,
    `+++ ${newPath ? `b/${newPath}` : "/dev/null"}`,
    withContext ? insertion ? "@@ -1 +1,2 @@" : "@@ -1,2 +1 @@"
      : added || insertion ? "@@ -0,0 +1 @@"
      : deleted || removal ? "@@ -1 +0,0 @@" : "@@ -1 +1 @@",
    ...(withContext ? [" kept"] : []),
    ...(!added && !insertion ? ["-old"] : []),
    ...(!deleted && !removal ? ["+new"] : []), "",
  ].join("\n");
  const snap = { ...snapshot, diff: patch, diffSha256: createHash("sha256").update(patch).digest("hex") };
  const ctx = await assembleContext(snap, {
    gh: async (args) => {
      const headSide = args[5].endsWith(binding.head);
      const value = headSide ? head : base;
      return JSON.stringify({
        type: "file", path: headSide ? newPath : oldPath, encoding: "base64",
        content: Buffer.from(value).toString("base64"), size: Buffer.byteLength(value), sha: blobSha(value),
      });
    },
  });
  const bound = quickBinding(snap, ctx);
  const gate = evidenceBoundary(snap, ctx, bound);
  const before = added || insertion ? null :
    { path: oldPath, side: "base", startLine: withContext ? 2 : 1, endLine: withContext ? 2 : 1, quote: "old" };
  const after = deleted || removal ? null :
    { path: newPath, side: "head", startLine: withContext ? 2 : 1, endLine: withContext ? 2 : 1, quote: "new" };
  const entry = { ...candidate, before, after, location: after ?? before, evidence: [after ?? before] };
  const eligible = collectCandidates([{
    ...reviewer(), result: JSON.stringify({ schemaVersion: 1, reviewKey: reviewKey(bound), candidates: [entry], limitations: [] }),
  }], gate);
  assert.equal(eligible.issues.length, 0, `${kind}: ${eligible.issues.join("; ")}`);
  assert.equal(eligible.candidates.length, 1);
}
const crossSnapshot = {
  ...snapshot, pull: { ...snapshot.pull, changedFiles: 2 },
  diff: diff + diff.replaceAll("total.js", "other.js"),
};
crossSnapshot.diffSha256 = createHash("sha256").update(crossSnapshot.diff).digest("hex");
const crossContext = await assembleContext(crossSnapshot, {
  gh: async (args) => {
    const value = args[5].endsWith(binding.head) ? headText : baseText;
    return JSON.stringify({
      type: "file", path: args[5].includes("/other.js?") ? "other.js" : "total.js",
      encoding: "base64", content: Buffer.from(value).toString("base64"),
      size: Buffer.byteLength(value), sha: blobSha(value),
    });
  },
});
const crossBinding = quickBinding(crossSnapshot, crossContext);
const crossBoundary = evidenceBoundary(crossSnapshot, crossContext, crossBinding);
const other = structuredClone(candidate);
for (const field of ["location", "before", "after"]) other[field].path = "other.js";
for (const sharedCause of [true, false]) {
  other.evidence = [sharedCause ? citation("base") : { ...citation("base"), path: "other.js" }];
  const reports = [candidate, other].map((entry, index) => reviewer([], {
    label: `reviewer${index}`,
    result: JSON.stringify({ schemaVersion: 1, reviewKey: reviewKey(crossBinding), candidates: [entry], limitations: [] }),
  }));
  const decisions = [
    decision("reviewer0:1"),
    decision("reviewer1:1", { duplicateOf: "reviewer0:1", evidence: other.evidence }),
  ];
  const adjudication = validator([], {
    result: JSON.stringify({ schemaVersion: 1, reviewKey: reviewKey(crossBinding), decisions, limitations: [] }),
  });
  const crossResult = adjudicateCandidates(collectCandidates(reports, crossBoundary), adjudication, crossBoundary);
  assert.equal(crossResult.duplicates.length, sharedCause ? 1 : 0);
  assert.equal(crossResult.complete, sharedCause);
}
console.log("PASS strict candidates, exact provenance/changed lines, confidence/severity, and fail-closed malformed output");
console.log("PASS mocked semantic rejection/uncertainty, explicit same-defect deduplication, distinct same-line issues and degraded retention");
console.log("PASS renamed/added/deleted files, insertion/deletion context, and shared-cause cross-file deduplication");
