import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assembleContext } from "../extensions/pr-review/context.mjs";
import { reviewBinding } from "../extensions/pr-review/review.mjs";
import {
  adjudicateCandidates, candidateFormat, collectCandidates, evidenceBoundary, formatFindings,
  outputEnd, outputStart, reviewKey, validationInstructions,
} from "../extensions/pr-review/findings.mjs";
import { formatCoverage, presentationDiagnostics } from "../extensions/pr-review/coverage.mjs";
import { reviewModes } from "../extensions/pr-review/modes.mjs";
import {
  blobSha, breakageBaseSource, breakageDiff, breakageHeadSource,
  validationBaseSource, validationDiff, validationHeadSource,
} from "./target-fixture.mjs";

const policy = reviewModes.quick.policy;
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
const binding = reviewBinding(snapshot, context);
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
  result: JSON.stringify({ schemaVersion: 2, reviewKey: key, candidates, limitations: [] }), ...changes,
});
const decision = (id = "correctness:1", changes = {}) => ({
  candidateId: id, verdict: "accept", allClaimsSupported: true,
  reason: "The unchanged contract requires multiplication; 100 * 3 was 300, while the changed expression yields 103.",
  evidence: [citation("head", 1), citation("base"), citation("head")], duplicateOf: null, ...changes,
});
const validator = (decisions = [decision()], changes = {}) => ({
  status: "completed", result: JSON.stringify({ schemaVersion: 2, reviewKey: key, decisions, limitations: [] }),
  ...changes,
});
const collected = collectCandidates([reviewer()], boundary, policy);
assert.equal(collected.issues.length, 0);
const result = adjudicateCandidates(collected, validator(), boundary, policy);
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
  (c) => { c.before = citation("head"); },
  (c) => { c.before = citation("base", 1); },
  (c) => { c.evidence = []; }, (c) => { c.evidence[0].quote += "\n"; },
  (c) => { c.location.ref = binding.head; },
]) {
  const bad = structuredClone(candidate);
  mutate(bad);
  const rejected = collectCandidates([reviewer([bad, candidate])], boundary, policy);
  assert.equal(rejected.candidates.length, 1, "Reject only the invalid candidate, retaining its valid sibling");
  assert.equal(rejected.issues.length, 1);
}
for (const raw of ["not JSON", "```json\n{}\n```", '{"schemaVersion":1', "null", "[]",
  JSON.stringify({ schemaVersion: 1, reviewKey: "wrong", candidates: [candidate], limitations: [] }),
  JSON.stringify({ schemaVersion: 1, reviewKey: key, candidates: [], limitations: [], clean: true }),
]) {
  const malformed = collectCandidates([reviewer([], { result: raw })], boundary, policy);
  assert.equal(malformed.candidates.length, 0);
  assert.equal(adjudicateCandidates(malformed, undefined, boundary, policy).complete, false);
}
const preExisting = structuredClone(candidate);
preExisting.location = citation("head", 2);
assert.match(collectCandidates([reviewer([preExisting])], boundary, policy).issues[0], /changed lines/);
for (const reason of [
  "False positive: the proposed expected behavior contradicts the unchanged contract.",
  "Pre-existing: the cited edge case already fails on the captured base; the changed operator is irrelevant.",
]) {
  const rejected = adjudicateCandidates(collected, validator([decision(undefined, {
    verdict: "reject", reason, evidence: [], allClaimsSupported: false,
  })]), boundary, policy);
  assert.equal(rejected.findings.length, 0);
  assert.equal(rejected.rejected[0].reason, reason);
  assert.equal(rejected.complete, true, "A resolved false positive is not a validation failure");
}
const uncertain = adjudicateCandidates(collected, validator([decision(undefined, {
  verdict: "uncertain", reason: "The claimed caller is absent from supplied context.", evidence: [], allClaimsSupported: false,
})]), boundary, policy);
assert.equal(uncertain.complete, false);
assert.equal(uncertain.findings.length, 0);

const peers = collectCandidates([
  reviewer(), reviewer([{ ...candidate, title: "Addition undercharges customers" }], { label: "contracts" }),
  reviewer([{ ...candidate, title: "Separate issue on same line", trigger: "a different condition", actual: "a distinct effect" }],
    { label: "security-performance-resources" }),
], boundary, policy);
const deduplicated = adjudicateCandidates(peers, validator([
  decision(), decision("contracts:1", { duplicateOf: "correctness:1", reason: "Same changed operator, numeric trigger and undercharge." }),
  decision("security-performance-resources:1"),
]), boundary, policy);
assert.equal(deduplicated.findings.length, 2, "Only an explicit same-defect decision merges reports");
assert.equal(deduplicated.duplicates.length, 1);
assert.deepEqual(deduplicated.findings[0].reportedBy, ["correctness", "contracts"]);
assert.equal(deduplicated.duplicates[0].candidate.title, "Addition undercharges customers");
const wider = structuredClone(candidate);
wider.before = { ...citation("base"), startLine: 2, quote: baseText.split("\n").slice(1, 3).join("\n") };
wider.after = { ...citation("head"), startLine: 2, quote: headText.split("\n").slice(1, 3).join("\n") };
wider.severity = "P1";
const widerPeers = collectCandidates([reviewer(), reviewer([wider], { label: "contracts" })], boundary, policy);
const widerResult = adjudicateCandidates(widerPeers, validator([
  decision(), decision("contracts:1", { duplicateOf: "correctness:1" }),
]), boundary, policy);
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
  const invalid = adjudicateCandidates(collected, validator([decision(undefined, changes)]), boundary, policy);
  assert.equal(invalid.findings.length, 0);
  assert.equal(invalid.complete, false);
}
const partlyTrue = adjudicateCandidates(peers, validator([
  decision(undefined, { allClaimsSupported: false, reason: "Only the core claim is true, not all its stated effects." }),
  decision("contracts:1"), decision("security-performance-resources:1", { verdict: "reject", allClaimsSupported: false }),
]), boundary, policy);
assert.equal(partlyTrue.findings.length, 1, "Keep the fully supported peer, not the partially true report");
assert.equal(partlyTrue.findings[0].id, "contracts:1");
assert.equal(partlyTrue.complete, false, "Contradictory acceptance is not completed validation");
for (const decisions of [[], [decision(), decision()], [decision("wrong-id")]]) {
  assert.equal(adjudicateCandidates(collected, validator(decisions), boundary, policy).complete, false);
}
for (const changes of [{ status: "incomplete" }, { result: "```json\n{}\n```" }, { result: "null" }]) {
  assert.equal(adjudicateCandidates(collected, validator(undefined, changes), boundary, policy).findings.length, 0);
}
const degraded = collectCandidates([reviewer(), reviewer([], { label: "contracts", status: "incomplete" })], boundary, policy);
const retained = adjudicateCandidates(degraded, validator(), boundary, policy);
assert.equal(retained.complete, false);
assert.equal(retained.findings.length, 1);
assert.match(formatFindings({ validation: retained, complete: false }), /incomplete coverage/);
const empty = adjudicateCandidates(collectCandidates([reviewer([])], boundary, policy), undefined, boundary, policy);
assert.equal(empty.complete, true);
assert.match(formatFindings({ validation: empty, complete: true }), /not proof of a clean PR/);

const caveat = { kind: "caveat", reason: "External library internals were not independently audited.", impact: null };
const gap = {
  kind: "coverage-gap", reason: "The changed rounding adapter's contract is absent.",
  impact: "Cannot assess whether the new caller rounds monetary totals correctly.",
};
const withLimitations = (report, limitations, schemaVersion = 2) => ({
  ...report, result: JSON.stringify({ ...JSON.parse(report.result), schemaVersion, limitations }),
});
for (const [limitations, complete, kinds] of [
  [[caveat], true, ["caveat"]],
  [[gap], false, ["coverage-gap"]],
  [[caveat, gap], false, ["caveat", "coverage-gap"]],
]) {
  const reports = collectCandidates([withLimitations(reviewer([]), limitations)], boundary, policy);
  const assessment = adjudicateCandidates(reports, undefined, boundary, policy);
  assert.equal(assessment.complete, complete);
  assert.deepEqual(assessment.diagnostics.map((entry) => entry.kind), kinds);
  assert.equal(assessment.issues.length, complete ? 0 : 1);
  const display = formatFindings({ validation: assessment, complete });
  assert.match(display, /0 validated finding/);
  assert.match(display, /No accepted findings is not proof of a clean PR/);
  if (complete) {
    assert.match(display, /Informational caveat: correctness: External library/);
    assert.doesNotMatch(display, /incomplete|INCOMPLETE/);
  } else assert.match(display, /Blocked assessment: Cannot assess/);
  const adjudicated = adjudicateCandidates(collected, withLimitations(validator(), limitations), boundary, policy);
  assert.equal(adjudicated.complete, complete, "Adjudicator uses the same limitation policy");
  assert.equal(adjudicated.findings.length, 1, "Useful findings survive gaps and caveats");
  assert.deepEqual(adjudicated.diagnostics.map((entry) => entry.kind), kinds);
}
const mixedCoverage = adjudicateCandidates(collectCandidates([
  withLimitations(reviewer(), [caveat, gap]),
  reviewer([], { label: "contracts", status: "incomplete", error: "Synthetic crash" }),
], boundary, policy), withLimitations(validator(), [caveat]), boundary, policy);
assert.equal(mixedCoverage.complete, false);
assert.equal(mixedCoverage.findings.length, 1);
assert.deepEqual(mixedCoverage.diagnostics.map((entry) => entry.kind),
  ["caveat", "coverage-gap", "execution-failure", "caveat"]);
assert.match(formatFindings({ validation: mixedCoverage, complete: false }), /Execution failure: contracts:.*Synthetic crash/);
const caveatedUncertainty = adjudicateCandidates(collected, withLimitations(validator([decision(undefined, {
  verdict: "uncertain", allClaimsSupported: false, evidence: [], reason: gap.impact,
})]), [caveat]), boundary, policy);
assert.equal(caveatedUncertainty.complete, false);
assert.deepEqual(caveatedUncertainty.diagnostics.map((entry) => entry.kind), ["caveat", "coverage-gap"]);
for (const limitations of [
  ["legacy text in v2"], [{ ...gap, impact: null }], [{ ...gap, impact: "" }],
  [{ ...caveat, impact: "A specific assessment is blocked" }], [{ ...caveat, kind: "info" }],
  [{ ...caveat, extra: true }], [{ ...caveat, reason: " " }],
]) {
  const malformed = adjudicateCandidates(
    collectCandidates([withLimitations(reviewer([]), limitations)], boundary, policy), undefined, boundary, policy);
  assert.equal(malformed.complete, false);
  assert.equal(malformed.diagnostics[0].kind, "execution-failure");
  const malformedAdjudication = adjudicateCandidates(collected, withLimitations(validator(), limitations), boundary, policy);
  assert.equal(malformedAdjudication.complete, false);
  assert.equal(malformedAdjudication.findings.length, 0);
  assert.equal(malformedAdjudication.diagnostics[0].kind, "execution-failure");
}
for (const assessment of [
  adjudicateCandidates(collectCandidates([withLimitations(reviewer([]), [caveat.reason], 1)], boundary, policy), undefined, boundary, policy),
  adjudicateCandidates(collected, withLimitations(validator(), [caveat.reason], 1), boundary, policy),
]) {
  assert.equal(assessment.complete, false, "Legacy uncertainty is never reclassified by prose keywords");
  assert.equal(assessment.diagnostics[0].kind, "coverage-gap");
  assert.match(assessment.issues[0], /legacy unclassified limitation/);
}
assert.equal(uncertain.diagnostics[0].kind, "coverage-gap");
assert.equal(retained.diagnostics[0].kind, "execution-failure");
console.log("PASS explicit reviewer/adjudicator caveats, consequential gaps, failures, mixed results and conservative legacy output");

const repeatedDependencyGaps = [
  {
    kind: "coverage-gap",
    message: "contracts: Only dependency manifests are available. Blocked assessment: Whether removing `lapin` causes unresolved imports, macro expansions, or feature-gated build failures cannot be determined.",
  },
  {
    kind: "coverage-gap",
    message: "correctness: Rust source and feature definitions are absent. Blocked assessment: Whether removing the direct `lapin` dependency breaks compilation through imports, macros, or gated builds cannot be determined.",
  },
  {
    kind: "coverage-gap",
    message: "security-performance-resources: No source or build result is supplied. Blocked assessment: Whether removing `lapin` leaves an import or macro use that causes a compilation failure cannot be determined.",
  },
];
const consolidated = presentationDiagnostics(repeatedDependencyGaps);
assert.equal(consolidated.length, 1, "Equivalent specialist gaps should collapse only in presentation");
assert.equal(consolidated[0].reports, 3);
assert.deepEqual(consolidated[0].reporters,
  ["contracts", "correctness", "security-performance-resources"]);
const consolidatedDisplay = formatCoverage({
  complete: false, coverage: "incomplete",
  validation: { diagnostics: repeatedDependencyGaps, issues: repeatedDependencyGaps.map((entry) => entry.message) },
});
assert.match(consolidatedDisplay, /coverage gaps: 1 \(3 reports\)/);
assert.match(consolidatedDisplay, /reported by contracts, correctness, security-performance-resources; 3 reports/);
assert.equal(repeatedDependencyGaps.length, 3, "Raw diagnostics remain unchanged");
const distinctLapinGap = {
  kind: "coverage-gap",
  message: "contracts: Runtime configuration is absent. Blocked assessment: Whether `lapin` reconnect authentication exposes credentials cannot be determined.",
};
assert.equal(presentationDiagnostics([...repeatedDependencyGaps, distinctLapinGap]).length, 2,
  "A shared identifier must not merge substantively different blocked assessments");
const unstructuredDuplicate = { kind: "coverage-gap", message: "Changed binary content was unavailable." };
assert.equal(presentationDiagnostics([unstructuredDuplicate, unstructuredDuplicate]).length, 2,
  "Code-owned and legacy gaps without structured reporter/impact text remain explicit");
console.log("PASS equivalent coverage-gap presentation consolidation preserves distinct and raw diagnostics");

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
  const bound = reviewBinding(snap, ctx);
  const gate = evidenceBoundary(snap, ctx, bound);
  const before = added || insertion ? null :
    { path: oldPath, side: "base", startLine: withContext ? 2 : 1, endLine: withContext ? 2 : 1, quote: "old" };
  const after = deleted || removal ? null :
    { path: newPath, side: "head", startLine: withContext ? 2 : 1, endLine: withContext ? 2 : 1, quote: "new" };
  const entry = { ...candidate, before, after, location: after ?? before, evidence: [after ?? before] };
  const eligible = collectCandidates([{
    ...reviewer(), result: JSON.stringify({ schemaVersion: 1, reviewKey: reviewKey(bound), candidates: [entry], limitations: [] }),
  }], gate, policy);
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
const crossBinding = reviewBinding(crossSnapshot, crossContext);
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
  const crossResult = adjudicateCandidates(collectCandidates(reports, crossBoundary, policy), adjudication, crossBoundary, policy);
  assert.equal(crossResult.duplicates.length, sharedCause ? 1 : 0);
  assert.equal(crossResult.complete, sharedCause);
}
// The balanced mode's findings policy admits minor severities, caps how many are
// presented, and records the rest instead of dropping or hiding them.
const balancedPolicy = reviewModes.balanced.policy;
const minorCandidate = (title, severity) => ({ ...structuredClone(candidate), title, severity });
const minorReports = [
  ["correctness", "P3"], ["contracts", "P3"], ["security", "P3"], ["overview", "nit"], ["performance-resources", "nit"],
].map(([label, severity]) => reviewer([minorCandidate(`Minor ${label} issue`, severity)], { label }));
assert.equal(collectCandidates(minorReports, boundary, policy).candidates.length, 0,
  "Quick mode admits no minor candidate at all");
assert.match(collectCandidates(minorReports, boundary, policy).issues[0], /P0\/P1\/P2/);
const minorCollected = collectCandidates(minorReports, boundary, balancedPolicy);
assert.equal(minorCollected.candidates.length, 5);
assert.equal(minorCollected.issues.length, 0);
const minorDecisions = minorCollected.candidates.map((entry, index) => decision(entry.id,
  index === 4 ? { duplicateOf: "overview:1" } : {}));
const cappedResult = adjudicateCandidates(minorCollected, validator(minorDecisions), boundary, balancedPolicy);
assert.deepEqual(cappedResult.findings.map((finding) => finding.id),
  ["correctness:1", "contracts:1", "security:1"]);
assert(cappedResult.findings.every((finding) => finding.severity === "P3"));
assert.deepEqual(cappedResult.capped.map((entry) => entry.id), ["overview:1", "performance-resources:1"]);
assert.equal(cappedResult.capped[0].severity, "nit");
assert.match(cappedResult.capped[0].reason, /limit of 3 P3\/nit finding\(s\)/);
assert.match(cappedResult.capped[1].reason, /Duplicate of withheld overview:1/);
assert.deepEqual(cappedResult.duplicates, [], "A duplicate of a withheld finding is withheld with it");
assert.equal(cappedResult.complete, true, "The presentation limit is policy, not incomplete coverage");
const balancedReport = { mode: "balanced", validation: cappedResult, complete: true };
assert.match(formatFindings(balancedReport), /^Balanced review: 3 validated finding\(s\)/);
assert.match(formatFindings(balancedReport), /2 minor finding\(s\) withheld by the balanced review findings policy/);
assert.match(formatFindings(balancedReport), /overview:1: \[nit\] Minor overview issue/);
assert.match(formatFindings({ mode: "quick", validation: result, complete: true }), /^Quick review: 1 validated/);
// A major finding always outranks a minor one, and three minors still fit.
const mixedReports = [
  ["correctness", "P1"], ["contracts", "P3"], ["security", "nit"], ["overview", "P3"],
].map(([label, severity]) => reviewer([minorCandidate(`Mixed ${label} issue`, severity)], { label }));
const mixedCollected = collectCandidates(mixedReports, boundary, balancedPolicy);
const mixed = adjudicateCandidates(mixedCollected,
  validator(mixedCollected.candidates.map((entry) => decision(entry.id))), boundary, balancedPolicy);
assert.deepEqual(mixed.findings.map((finding) => finding.severity), ["P1", "P3", "P3", "nit"]);
assert.deepEqual(mixed.capped, []);
console.log("PASS balanced minor severities, declared severity order, the three-finding cap and its withheld record");
// The full mode admits the same minor severities and presents every accepted
// one, so nothing is withheld and a duplicate stays an ordinary alias.
const fullPolicy = reviewModes.full.policy;
const fullCollected = collectCandidates(minorReports, boundary, fullPolicy);
assert.equal(fullCollected.candidates.length, 5);
assert.equal(fullCollected.issues.length, 0);
const fullResult = adjudicateCandidates(fullCollected, validator(minorDecisions), boundary, fullPolicy);
assert.deepEqual(fullResult.findings.map((finding) => finding.id),
  ["correctness:1", "contracts:1", "security:1", "overview:1"]);
assert.deepEqual(fullResult.findings.map((finding) => finding.severity), ["P3", "P3", "P3", "nit"]);
assert.deepEqual(fullResult.capped, [], "The full findings policy withholds no minor finding");
assert.deepEqual(fullResult.duplicates.map((entry) => entry.id), ["performance-resources:1"],
  "A duplicate of a presented finding stays an alias instead of being withheld with it");
assert.deepEqual(fullResult.findings.at(-1).reportedBy, ["overview", "performance-resources"]);
assert.equal(fullResult.complete, true);
const fullReport = { mode: "full", validation: fullResult, complete: true };
assert.match(formatFindings(fullReport), /^Full review: 4 validated finding\(s\)/);
assert(!formatFindings(fullReport).includes("withheld"), "Full reports no withheld minor finding");
console.log("PASS the full findings policy admits every minor severity, caps nothing and withholds nothing");
// Deep presents all substantiated severities too, and does it from one reviewer:
// the policy is a presentation rule, independent of how many reviewers ran.
const deepPolicy = reviewModes.deep.policy;
const deepReports = [reviewer([
  minorCandidate("Minor integrated issue", "P3"), minorCandidate("Another integrated issue", "nit"),
], { label: "integrated" })];
const deepCollected = collectCandidates(deepReports, boundary, deepPolicy);
assert.equal(deepCollected.candidates.length, 2);
assert.equal(deepCollected.issues.length, 0);
const deepResult = adjudicateCandidates(deepCollected,
  validator(deepCollected.candidates.map((entry) => decision(entry.id))), boundary, deepPolicy);
assert.deepEqual(deepResult.findings.map((finding) => finding.id), ["integrated:1", "integrated:2"]);
assert.deepEqual(deepResult.findings.map((finding) => finding.severity), ["P3", "nit"]);
assert.deepEqual(deepResult.capped, [], "The deep findings policy withholds no substantiated finding");
assert.equal(deepResult.complete, true);
assert.equal(collectCandidates(deepReports, boundary, policy).candidates.length, 0,
  "Quick still admits no minor candidate, whichever reviewer raised it");
const deepReport = { mode: "deep", validation: deepResult, complete: true };
assert.match(formatFindings(deepReport), /^Deep review: 2 validated finding\(s\)/);
assert(!formatFindings(deepReport).includes("withheld"), "Deep reports no withheld minor finding");
console.log("PASS the deep findings policy presents every substantiated severity from its single reviewer");
// F6: reviewers are asked for the envelope between two explicit markers, and
// code unwraps exactly that delimiter pair, plus one fence that wraps the whole
// response. Nothing else is recovered: prose without markers, an unmatched or
// repeated marker, two fenced blocks and a truncated object all fail whole, and
// every gate after the parse is untouched.
const envelopeText = (candidates = [candidate]) =>
  JSON.stringify({ schemaVersion: 2, reviewKey: key, candidates, limitations: [] });
const decisionsText = (decisions = [decision()]) =>
  JSON.stringify({ schemaVersion: 2, reviewKey: key, decisions, limitations: [] });
const delimit = (body) => `${outputStart}\n${body}\n${outputEnd}`;
for (const format of [
  candidateFormat(policy), validationInstructions(policy),
]) {
  assert(format.includes(outputStart) && format.includes(outputEnd),
    "Both output contracts name the exact markers reviewers must emit");
  assert.match(format, /raw JSON|no fences/i, "The contract still forbids a wrapper inside the markers");
}
for (const raw of [
  delimit(envelopeText()),
  `I'll trace the changed expression first.\n${delimit(envelopeText())}\nThat is my whole assessment.`,
  delimit("```json\n" + envelopeText() + "\n```"),
  "```json\n" + envelopeText() + "\n```",
  "```\n" + envelopeText() + "\n```",
  `  ${delimit(envelopeText())}  `,
  envelopeText(),
]) {
  const unwrapped = collectCandidates([reviewer([], { result: raw })], boundary, policy);
  assert.deepEqual(unwrapped.diagnostics, [], `Unwrap the delimited envelope: ${raw.slice(0, 40)}`);
  assert.equal(unwrapped.candidates.length, 1);
  assert.equal(adjudicateCandidates(unwrapped, validator(), boundary, policy).findings.length, 1);
}
for (const raw of [
  `I'll trace the changed expression first.\n${envelopeText()}`,
  "```json\n" + envelopeText() + "\n```\n```json\n" + envelopeText() + "\n```",
  `${outputStart}\n${envelopeText()}`,
  `${outputEnd}\n${envelopeText()}\n${outputStart}`,
  `${delimit(envelopeText())}\n${delimit(envelopeText())}`,
  delimit(envelopeText().slice(0, -1)),
  delimit(""),
  "```json\n" + envelopeText() + "\n```\nThat is my whole assessment.",
  "`" + envelopeText() + "`",
]) {
  const rejected = collectCandidates([reviewer([], { result: raw })], boundary, policy);
  assert.equal(rejected.candidates.length, 0, `Fail whole rather than search for JSON: ${raw.slice(0, 40)}`);
  assert.match(rejected.diagnostics[0].message, /invalid candidate output/);
  assert.equal(adjudicateCandidates(rejected, undefined, boundary, policy).complete, false);
}
// The unwrap feeds the same parser: a delimited envelope that fails any gate
// after the parse is rejected exactly as an undelimited one is.
for (const body of [
  JSON.stringify({ schemaVersion: 2, reviewKey: "wrong", candidates: [], limitations: [] }),
  JSON.stringify({ schemaVersion: 2, reviewKey: key, candidates: [], limitations: [], clean: true }),
  "null",
]) {
  const gated = collectCandidates([reviewer([], { result: delimit(body) })], boundary, policy);
  assert.equal(gated.candidates.length, 0, "The evidence boundary is unchanged by the unwrap");
  assert.equal(adjudicateCandidates(gated, undefined, boundary, policy).complete, false);
}
// The adjudicator's output travels the same path.
const delimitedAdjudication = adjudicateCandidates(
  collectCandidates([reviewer()], boundary, policy),
  validator(undefined, { result: delimit("```json\n" + decisionsText() + "\n```") }), boundary, policy);
assert.equal(delimitedAdjudication.findings.length, 1, "Unwrap the adjudicator's envelope the same way");
assert.equal(delimitedAdjudication.complete, true);
// A marker or a fence inside the JSON is payload, not a wrapper. The live full
// review of pull request #7 discarded four of six reviewers on exactly this:
// each had cited the source lines that define the markers, so counting marker
// substrings rather than marker lines turned their own citations into a second
// wrapper. Markers are matched only when they are the whole line, as the
// contract asks, and a fence only when its run starts a line.
const quoting = (text) => [{ ...candidate, title: `Marker text ${text} inside a payload` }];
for (const raw of [
  delimit(envelopeText(quoting(`${outputStart} and ${outputEnd}`))),
  envelopeText(quoting(`${outputStart} and ${outputEnd}`)),
  delimit(envelopeText(quoting(`${outputStart} twice ${outputStart}`))),
  "```json\n" + envelopeText(quoting("a ``` fence run")) + "\n```",
]) {
  const payload = collectCandidates([reviewer([], { result: raw })], boundary, policy);
  assert.deepEqual(payload.diagnostics, [], "Marker or fence text inside the JSON is payload");
  assert.equal(payload.candidates.length, 1);
}
for (const raw of [
  `${outputStart}${envelopeText()}${outputEnd}`,
  `${outputStart} ${envelopeText()}\n${outputEnd}`,
  `prose ${outputStart}\n${envelopeText()}\n${outputEnd} prose`,
]) {
  const inline = collectCandidates([reviewer([], { result: raw })], boundary, policy);
  assert.equal(inline.candidates.length, 0, "A marker is a marker only when it is the whole line");
  assert.match(inline.diagnostics[0].message, /invalid candidate output/);
}
console.log("PASS the delimited output contract, its deterministic unwrap, and fail-whole for everything else");
// Q5: a candidate anchored on a changed line can cite the code that change
// breaks, in `breaks`, which may be unchanged code, code in another hunk, or
// code in another changed file. The three true findings the same-changed-hunk
// rule discarded, on pull requests #4, #5 and #10, are reconstructed below from
// their recorded shapes rather than from a description of them.
const breakageSource = breakageDiff + validationDiff;
const breakageSnapshot = {
  repository,
  pull: { id: "PR_2", number: 2, changedFiles: 2, head: { sha: "b".repeat(40) }, base: { sha: "a".repeat(40) } },
  diff: breakageSource, diffSha256: createHash("sha256").update(breakageSource).digest("hex"),
};
const revisionOf = (path, head) => path === "breakage.js"
  ? head ? breakageHeadSource : breakageBaseSource
  : head ? headText : baseText;
const breakageContext = await assembleContext(breakageSnapshot, {
  gh: async (args) => {
    const request = /contents\/([^?]+)\?ref=([0-9a-f]{40})/.exec(args[5]);
    const path = decodeURIComponent(request[1]);
    const text = revisionOf(path, request[2] === "b".repeat(40));
    return JSON.stringify({
      type: "file", path, encoding: "base64", sha: blobSha(text),
      size: Buffer.byteLength(text), content: Buffer.from(text).toString("base64"),
    });
  },
});
const breakageBinding = reviewBinding(breakageSnapshot, breakageContext);
const breakageBoundary = evidenceBoundary(breakageSnapshot, breakageContext, breakageBinding);
const at = (path, side, startLine, endLine = startLine) => ({
  path, side, startLine, endLine,
  quote: revisionOf(path, side === "head").split("\n").slice(startLine - 1, endLine).join("\n"),
});
const breakageFile = breakageBoundary.files.find((entry) => entry.newPath === "breakage.js");
assert.equal(breakageFile.hunks.length, 2, "The fixture keeps two separate hunks in one changed file");
assert.deepEqual(breakageFile.changed.head, [5, 17]);
assert(!breakageFile.hunks.some((hunk) => hunk.newStart <= 9 && 9 < hunk.newStart + hunk.newLines),
  "Line 9 is unchanged code outside every hunk, and still inside a supplied context window");
assert(breakageFile.hunks[0].oldText.length > 0, "The anchoring hunk does remove base-side lines");

const breaker = {
  title: "Free shipping no longer applies at the threshold", severity: "P2", confidence: 0.94,
  location: at("breakage.js", "head", 5), trigger: "shipping(5000)",
  expected: "An order exactly at the threshold ships free, per the unchanged comment on line 1",
  actual: "shipping(5000) now charges 500 cents, so every order exactly at the threshold is billed",
  introduction: "The changed comparison excludes the boundary its unchanged callers still assume.",
  before: at("breakage.js", "base", 5), after: at("breakage.js", "head", 5),
  breaks: at("breakage.js", "head", 9), evidence: [at("breakage.js", "head", 1)],
};
const breakageReviewer = (candidates, changes = {}) => ({
  label: "correctness", status: "completed",
  result: JSON.stringify({
    schemaVersion: 2, reviewKey: reviewKey(breakageBinding), candidates, limitations: [],
  }), ...changes,
});
const breakageDecision = (id, changes = {}) => ({
  candidateId: id, verdict: "accept", allClaimsSupported: true,
  reason: "The unchanged caller reads the changed predicate, and the base revision admitted the boundary.",
  evidence: [at("breakage.js", "head", 1)], duplicateOf: null, ...changes,
});
const adjudicateBreakage = (candidates, decisions) => {
  const gathered = collectCandidates([breakageReviewer(candidates)], breakageBoundary, policy);
  const decided = decisions ?? gathered.candidates.map((entry) => breakageDecision(entry.id));
  return {
    gathered,
    result: adjudicateCandidates(gathered, {
      status: "completed", result: JSON.stringify({
        schemaVersion: 2, reviewKey: reviewKey(breakageBinding), decisions: decided, limitations: [],
      }),
    }, breakageBoundary, policy),
  };
};
for (const [victim, description] of [
  [at("breakage.js", "head", 9), "unchanged code outside every hunk"],
  [at("breakage.js", "head", 17), "changed code in another hunk of the same file"],
  [at("breakage.js", "base", 17), "the base side of another hunk"],
  [at("total.js", "head", 1), "unchanged code in another changed file"],
  [at("total.js", "head", 3), "changed code in another changed file"],
]) {
  const cited = adjudicateBreakage([{ ...breaker, breaks: victim }]);
  assert.deepEqual(cited.gathered.diagnostics, [], `A candidate may cite ${description}`);
  assert.equal(cited.result.findings.length, 1, `A candidate citing ${description} reaches adjudication`);
  assert.equal(cited.result.findings[0].breaks.blobSha, blobSha(revisionOf(victim.path, victim.side === "head")));
  assert.equal(cited.result.findings[0].breaks.ref, breakageBinding[victim.side]);
}
const displayed = formatFindings({
  validation: adjudicateBreakage([breaker]).result, complete: true, mode: "quick",
});
assert.match(displayed, /Breaks: breakage\.js:9-9 \(head\)/);

// The citation is optional, whether the reviewer omits it or nulls it, and the
// finding carries `breaks: null` either way rather than an absent key.
for (const candidates of [[{ ...breaker, breaks: null }], [(() => {
  const omitted = structuredClone(breaker);
  delete omitted.breaks;
  return omitted;
})()]]) {
  const optional = adjudicateBreakage(candidates);
  assert.equal(optional.result.findings.length, 1, "The broken-code citation is optional");
  assert.equal(optional.result.findings[0].breaks, null);
  assert(!formatFindings({ validation: optional.result, complete: true }).includes("Breaks:"),
    "A finding that cites no broken code displays no broken-code line");
}

// Every citation refusal still fires on the new field: unbound provenance, an
// out-of-window range, a fabricated quote and a malformed citation object.
for (const [invalid, expected] of [
  [{ ...at("breakage.js", "head", 9), path: "../breakage.js" }, /outside bound source provenance/],
  [{ ...at("breakage.js", "head", 9), path: "shipping.js" }, /outside bound source provenance/],
  [{ ...at("breakage.js", "head", 9), startLine: 40, endLine: 40 }, /does not exactly match a supplied context window/],
  [{ ...at("breakage.js", "head", 9), quote: "  return qualifies(subtotal) ? 0 : 501;" }, /does not exactly match/],
  [{ ...at("breakage.js", "head", 9), quote: " return qualifies(subtotal) ? 0 : 500;" }, /does not exactly match/],
  [{ ...at("breakage.js", "head", 9), ref: breakageBinding.head }, /Citation: expected exactly/],
  [{ path: "breakage.js", side: "head", startLine: 9, endLine: 9 }, /Citation: expected exactly/],
  ["breakage.js:9", /Citation: expected exactly/],
  [{ ...at("breakage.js", "head", 9), side: "RIGHT" }, /Invalid citation side, range, or quote/],
]) {
  const refused = collectCandidates([breakageReviewer([{ ...breaker, breaks: invalid }])],
    breakageBoundary, policy);
  assert.equal(refused.candidates.length, 0, `Refuse a broken-code citation: ${JSON.stringify(invalid).slice(0, 60)}`);
  assert.match(refused.diagnostics[0].message, expected);
}

// Reconstructed rejection, pull requests #4 and #10: the introduction citations
// named one changed hunk while the location named another. That refusal is
// unchanged, and the finding it discarded is now expressible instead by
// anchoring on the changed code and citing what it breaks.
const misanchored = collectCandidates([breakageReviewer([{
  ...breaker, location: at("breakage.js", "head", 17), breaks: null,
}])], breakageBoundary, policy);
assert.equal(misanchored.candidates.length, 0);
assert.match(misanchored.diagnostics[0].message, /Introduction citations and location must identify the same changed hunk/);
const reanchored = adjudicateBreakage([{ ...breaker, breaks: at("breakage.js", "head", 17) }]);
assert.equal(reanchored.result.findings.length, 1,
  "The same claim, anchored on the changed line and citing the other hunk, reaches adjudication");

// Reconstructed rejection, pull request #5: a null introduction side on a hunk
// that does change that side is no longer refused. The adjudicator still has to
// establish introduction; code no longer discards the candidate for it.
for (const introduction of [{ before: null }, { after: null }, { before: null, after: null }]) {
  const partial = adjudicateBreakage([{ ...breaker, ...introduction }]);
  assert.deepEqual(partial.gathered.diagnostics, [],
    `A null introduction citation is accepted: ${Object.keys(introduction).join("+")}`);
  assert.equal(partial.result.findings.length, 1);
}
const nullIntroduction = collectCandidates([reviewer([{ ...structuredClone(candidate), before: null }])],
  boundary, policy);
assert.deepEqual(nullIntroduction.diagnostics, [], "The single-hunk fixture accepts a null before as well");
assert.equal(nullIntroduction.candidates.length, 1);

// A supplied introduction citation is still bound to the location's own hunk,
// still on its own side and file, and still has to reach the changed code.
for (const [mutate, expected] of [
  [(c) => { c.before = at("breakage.js", "base", 17); }, /identify the same changed hunk/],
  [(c) => { c.after = at("breakage.js", "head", 17); }, /identify the same changed hunk/],
  [(c) => { c.before = at("breakage.js", "head", 5); }, /same file's captured before\/after revisions/],
  [(c) => { c.after = at("total.js", "head", 3); }, /same file's captured before\/after revisions/],
  [(c) => { c.before = at("breakage.js", "base", 4); }, /cite the changed code, not only nearby unchanged lines/],
  [(c) => { c.location = at("breakage.js", "head", 9); }, /not an anchor on changed lines/],
]) {
  const invalid = structuredClone(breaker);
  mutate(invalid);
  const refused = collectCandidates([breakageReviewer([invalid])], breakageBoundary, policy);
  assert.equal(refused.candidates.length, 0);
  assert.match(refused.diagnostics[0].message, expected);
}

// The broken-code citation is a supporting citation for deduplication, exactly
// as it would be if the same lines had been cited in `evidence`: shared changed
// source stays necessary, and never sufficient, for one report to merge into
// another.
const downstream = {
  ...breaker, title: "The summary separator changed with the threshold",
  location: at("breakage.js", "head", 17), before: at("breakage.js", "base", 17),
  after: at("breakage.js", "head", 17), breaks: null, evidence: [at("breakage.js", "head", 16)],
};
const merged = adjudicateBreakage([{ ...breaker, breaks: at("breakage.js", "head", 17) }, downstream],
  [breakageDecision("correctness:1"),
    breakageDecision("correctness:2", { duplicateOf: "correctness:1", evidence: [at("breakage.js", "head", 17)] })]);
assert.equal(merged.result.findings.length, 1, "A shared broken-code citation can carry a duplicate decision");
assert.equal(merged.result.duplicates.length, 1);
const unshared = adjudicateBreakage([{ ...breaker, breaks: null }, downstream],
  [breakageDecision("correctness:1"),
    breakageDecision("correctness:2", { duplicateOf: "correctness:1", evidence: [at("breakage.js", "head", 17)] })]);
assert.equal(unshared.result.findings.length, 1);
assert.equal(unshared.result.duplicates.length, 0);
assert.match(unshared.result.diagnostics.at(-1).message, /shared changed-source evidence/);

// Both output contracts name the new citation, so a reviewer is asked for it and
// the adjudicator is told what it is and that it proves nothing on its own.
assert.match(candidateFormat(policy), /"breaks"/);
assert.match(candidateFormat(policy), /anchor the location on the changed code/i);
assert.match(validationInstructions(policy), /breaks/);
console.log("PASS Q5: a changed-line anchor can cite the code it breaks, and every citation refusal still fires");
console.log("PASS strict candidates, exact provenance/changed lines, confidence/severity, and fail-closed malformed output");
console.log("PASS mocked semantic rejection/uncertainty, explicit same-defect deduplication, distinct same-line issues and degraded retention");
console.log("PASS renamed/added/deleted files, insertion/deletion context, and shared-cause cross-file deduplication");
