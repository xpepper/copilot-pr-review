// N1: the seeded corpus and the deterministic scorer that measures a review
// against it. Nothing here runs a model or opens a connection, and nothing here
// collects a review: every report scored below is scripted. What this suite
// guards is that the ground truth is explicit and checkable, so that a bad
// corpus entry or a surprising score can be diagnosed from the output alone.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { corpusDirectory, formatScore, loadCorpus, scoreReports } from "./benchmark/score.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// The whole corpus is versioned by the hash of its manifest, which pins every
// diff by its own hash. Editing a diff, a location, a concept or a severity
// moves this hash, and a score recorded against the old one no longer describes
// the new corpus. Repinning it is that decision, taken on purpose.
const pinnedCorpusHash = "31845b88b3ab34de18c81f40d5b46bccb472d82eb9e1616f7476f88c82bbcea4";

const corpus = loadCorpus();
assert.equal(corpus.hash, sha256(readFileSync(join(corpusDirectory, "corpus.json"))));
assert.equal(corpus.hash, pinnedCorpusHash, "corpus.json changed; repin only as a deliberate corpus version");
assert.deepEqual(corpus.cases.map((entry) => [entry.id, entry.kind, entry.defects.map((defect) => defect.id)]), [
  ["pagination-bounds", "seeded", ["pagination-inclusive-bound"]],
  ["timeout-units", "seeded", ["timeout-seconds-multiplied"]],
  ["attachment-replace", "seeded", ["attachment-replace-owner-check", "attachment-replace-lock-release"]],
  ["clean-extract-constant", "control", []],
  ["clean-empty-name-parts", "control", []],
]);
for (const entry of corpus.cases) {
  assert.equal(entry.sha256, sha256(readFileSync(join(corpusDirectory, "cases", `${entry.id}.diff`))));
}
console.log("PASS N1 the corpus loads, and every diff is pinned by its content hash");

// Each refusal below mutates a private copy of the corpus. The message has to
// name the case or defect and what is wrong with it, because nothing else will
// explain a corpus entry that no longer describes its own diff.
function refuses(pattern, mutate) {
  const directory = mkdtempSync(join(tmpdir(), "n1-corpus-"));
  try {
    cpSync(corpusDirectory, directory, { recursive: true });
    const manifestPath = join(directory, "corpus.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const find = (id) => manifest.cases.find((entry) => entry.id === id);
    const rewrite = (id, edit, { repin = true } = {}) => {
      const path = join(directory, "cases", `${id}.diff`);
      const text = edit(readFileSync(path, "utf8"));
      writeFileSync(path, text);
      if (repin) find(id).sha256 = sha256(text);
    };
    mutate({ manifest, find, rewrite, directory });
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    assert.throws(() => loadCorpus(directory), pattern);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
const defect = (find, id) => find(id).defects[0];

// A diff edited without repinning is refused with both hashes, so the reader
// can tell a stale pin from a corrupted file.
refuses(/pagination-bounds: cases\/pagination-bounds\.diff has sha256 [0-9a-f]{64}, but corpus\.json pins [0-9a-f]{64}/,
  ({ rewrite }) => rewrite("pagination-bounds", (text) => text.replace("i <= last", "i < last"), { repin: false }));
// Plain text only. A raw control byte once made this tool refuse its own
// review, and a carriage return would silently change how the diff parses.
refuses(/pagination-bounds: .*control byte/, ({ rewrite }) =>
  rewrite("pagination-bounds", (text) => text.replace("result = []", "result = [\u0007]")));
refuses(/pagination-bounds: .*control byte/, ({ rewrite }) =>
  rewrite("pagination-bounds", (text) => text.replaceAll("\n", "\r\n")));
// A hunk header that disagrees with its body is how a hand-edited fixture
// usually goes wrong, and the diff parser alone would not notice.
refuses(/pagination-bounds: src\/paginate\.js hunk at -1 \+1 declares 9 base and 9 head line\(s\) but carries 8 and 8/,
  ({ rewrite }) => rewrite("pagination-bounds", (text) => text.replace("@@ -1,8 +1,8 @@", "@@ -1,9 +1,9 @@")));
// Every fixture on disk is listed, so no stale diff can outlive its metadata.
refuses(/cases\/stale\.diff is not listed in corpus\.json/, ({ directory }) =>
  writeFileSync(join(directory, "cases", "stale.diff"), "diff --git a/x b/x\n"));
refuses(/Corpus case id "\.\.\/escape" must be lowercase words joined by hyphens/, ({ find }) => {
  find("pagination-bounds").id = "../escape";
});
refuses(/Duplicate corpus case id "timeout-units"/, ({ find }) => {
  find("pagination-bounds").id = "timeout-units";
});
// Field names are checked, not guessed, so a misspelt key cannot quietly drop
// a constraint from the ground truth.
refuses(/pagination-inclusive-bound: unknown field "allowedSeverity"/, ({ find }) => {
  defect(find, "pagination-bounds").allowedSeverity = ["P2"];
});
refuses(/pagination-inclusive-bound: missing field "summary"/, ({ find }) => {
  delete defect(find, "pagination-bounds").summary;
});
refuses(/clean-extract-constant: a control carries no defect/, ({ find }) => {
  find("clean-extract-constant").defects = [structuredClone(defect(find, "pagination-bounds"))];
  find("clean-extract-constant").defects[0].id = "control-defect";
});
refuses(/pagination-bounds: a seeded case carries at least one defect/, ({ find }) => {
  find("pagination-bounds").defects = [];
});
refuses(/Duplicate defect id "timeout-seconds-multiplied"/, ({ find }) => {
  defect(find, "pagination-bounds").id = "timeout-seconds-multiplied";
});
refuses(/pagination-inclusive-bound: target severity "P3" is not among its allowed severities/, ({ find }) => {
  defect(find, "pagination-bounds").severity = "P3";
});
refuses(/pagination-inclusive-bound: severity "P4" is not one this tool reports/, ({ find }) => {
  defect(find, "pagination-bounds").allowedSeverities.push("P4");
});
// An acceptable location follows the anchor rule a validated finding obeys: it
// sits inside a hunk and covers a changed line on its side. A location no
// finding could ever occupy would make its defect undetectable by construction.
refuses(/pagination-inclusive-bound: location src\/paginate\.js:6-8 \(head\) covers no changed line/, ({ find }) => {
  Object.assign(defect(find, "pagination-bounds").locations[0], { startLine: 6, endLine: 8 });
});
refuses(/pagination-inclusive-bound: location src\/paginate\.js:3-9 \(head\) is not inside one hunk/, ({ find }) => {
  Object.assign(defect(find, "pagination-bounds").locations[0], { startLine: 3, endLine: 9 });
});
refuses(/pagination-inclusive-bound: location src\/missing\.js:3-4 \(head\) names no file in the diff/, ({ find }) => {
  defect(find, "pagination-bounds").locations[0].path = "src/missing.js";
});
// The side is part of the location: base lines 5 and 6 are unchanged even
// though head lines 3 and 4 are not.
refuses(/pagination-inclusive-bound: location src\/paginate\.js:5-6 \(base\) covers no changed line/, ({ find }) => {
  Object.assign(defect(find, "pagination-bounds").locations[0], { side: "base", startLine: 5, endLine: 6 });
});
// Concept terms are matched literally after lowercasing, so the corpus stores
// them already normalised rather than trusting the scorer to fix them up.
refuses(/pagination-inclusive-bound: concept group 1 is empty/, ({ find }) => {
  defect(find, "pagination-bounds").concepts[0] = [];
});
refuses(/pagination-inclusive-bound: concept term " Off-by-one" is not lowercase, trimmed text/, ({ find }) => {
  defect(find, "pagination-bounds").concepts[0][0] = " Off-by-one";
});
refuses(/non-finding phrase "Is Safe" is not lowercase, trimmed text/, ({ manifest }) => {
  manifest.nonFindingPhrases.push("Is Safe");
});
console.log("PASS N1 a corpus entry that cannot describe its own diff is refused, and says why");

// The scorer reads findings in the shape this tool validates and presents them.
// Every report below is scripted; none was collected from a model.
const finding = (path, startLine, endLine, severity, title, actual = "") => ({
  severity, title, location: { path, side: "head", startLine, endLine },
  trigger: "", expected: "", actual, introduction: "", remediation: "",
});
const pagination = finding("src/paginate.js", 4, 4, "P2", "Page loop reads one past the end",
  "The inclusive <= bound pushes undefined once the page reaches the end of items.");
const timeout = finding("src/client.js", 4, 5, "P1", "Default timeout is multiplied as seconds after becoming milliseconds",
  "30000 * 1000 aborts after about eight hours.");
const owner = finding("src/routes/attachments.js", 13, 15, "P1", "replaceAttachment skips the owner check",
  "Any authenticated user can overwrite another user's attachment.");
const lock = finding("src/routes/attachments.js", 16, 16, "P2", "Oversized body returns before the lock is released",
  "The 413 early return leaves the lock held.");
const submit = (reports) => ({ corpus: corpus.hash, reports });
const every = (overrides = {}) => submit(corpus.cases.map((entry) => ({
  case: entry.id,
  findings: overrides[entry.id] ??
    { "pagination-bounds": [pagination], "timeout-units": [timeout], "attachment-replace": [owner, lock] }[entry.id] ?? [],
})));
const ref = (item) => `${item.location.path}:${item.location.startLine}-${item.location.endLine} ` +
  `(${item.location.side}) [${item.severity}] ${item.title}`;

{
  const score = scoreReports(corpus, every());
  assert.equal(score.corpus, corpus.hash);
  assert.deepEqual(score.unscored, []);
  assert.deepEqual(score.bands, {
    P0: { opportunities: 0, detected: 0 }, P1: { opportunities: 2, detected: 2 },
    P2: { opportunities: 2, detected: 2 }, P3: { opportunities: 0, detected: 0 }, nit: { opportunities: 0, detected: 0 },
  });
  assert.equal(score.falsePositives, 0);
  assert.equal(score.duplicates, 0);
  assert.equal(score.nonFindings, 0);
  assert.deepEqual(score.controlsWithFindings, []);
  assert.deepEqual(score.cases.find((entry) => entry.id === "attachment-replace").detected, [
    { defect: "attachment-replace-owner-check", severity: "P1", finding: ref(owner) },
    { defect: "attachment-replace-lock-release", severity: "P2", finding: ref(lock) },
  ]);
}
console.log("PASS N1 a report finding every seeded defect and nothing else detects each opportunity once");

// A match needs an acceptable location, an allowed severity and every concept
// group. A finding that misses says which of the three failed, per defect.
{
  const only = (findings) => scoreReports(corpus, every({ "pagination-bounds": findings })).cases[0];
  const vague = finding("src/paginate.js", 4, 4, "P2", "Loop bound changed", "The loop now compares differently.");
  assert.deepEqual(only([vague]), {
    id: "pagination-bounds", kind: "seeded", detected: [],
    missed: [{ defect: "pagination-inclusive-bound", severity: "P2" }],
    nonFindings: [], duplicates: [],
    falsePositives: [{ finding: ref(vague), checks: [{
      defect: "pagination-inclusive-bound", location: true, severity: true,
      missingConcepts: [corpus.cases[0].defects[0].concepts[0]],
    }] }],
  });
  // Every changed head line in pagination-bounds is acceptable, so a valid
  // anchor outside every acceptable range comes from timeout-units instead.
  const elsewhere = { ...timeout, location: { ...timeout.location, startLine: 2, endLine: 2 } };
  assert.deepEqual(scoreReports(corpus, every({ "timeout-units": [elsewhere] })).cases[1].falsePositives[0].checks,
    [{ defect: "timeout-seconds-multiplied", location: false, severity: true, missingConcepts: [] }]);
  const baseSide = { ...pagination, location: { ...pagination.location, side: "base" } };
  assert.equal(only([baseSide]).falsePositives[0].checks[0].location, false, "the side is part of the location");
  const minor = { ...pagination, severity: "P3" };
  assert.deepEqual(only([minor]).falsePositives[0].checks,
    [{ defect: "pagination-inclusive-bound", location: true, severity: false, missingConcepts: [] }]);
}
console.log("PASS N1 a finding matches only at an acceptable location, severity and concept set, and a miss says which failed");

// Recall is banded by the defect's target severity, so a detection at another
// allowed severity, or a reordering of the allowed list, moves nothing.
{
  const promoted = { ...pagination, severity: "P1" };
  const score = scoreReports(corpus, every({ "pagination-bounds": [promoted] }));
  assert.deepEqual(score.cases[0].detected.map((entry) => [entry.defect, entry.severity]), [["pagination-inclusive-bound", "P2"]]);
  assert.deepEqual(score.bands.P1, { opportunities: 2, detected: 2 });
  assert.deepEqual(score.bands.P2, { opportunities: 2, detected: 2 });
  const reordered = structuredClone(corpus);
  for (const entry of reordered.cases) for (const seeded of entry.defects) seeded.allowedSeverities.reverse();
  assert.deepEqual(scoreReports(reordered, every({ "pagination-bounds": [promoted] })).bands, score.bands);
}
console.log("PASS N1 an opportunity is banded by its target severity, whatever allowed severity detected it");

// Prose saying the code is fine must never score as finding its defect, even
// when it names the location, the severity and every concept.
{
  const denial = finding("src/paginate.js", 3, 4, "P2", "Pagination bound",
    "The <= bound is correct and never reads one past the end.");
  const headline = finding("src/paginate.js", 3, 4, "P2", "No issue: the loop only reads one past the end with <=");
  const score = scoreReports(corpus, every({ "pagination-bounds": [denial, headline] }));
  assert.deepEqual(score.cases[0].detected, []);
  assert.deepEqual(score.cases[0].falsePositives, []);
  assert.deepEqual(score.cases[0].nonFindings, [
    { finding: ref(headline), field: "title", phrase: "no issue" },
    { finding: ref(denial), field: "actual", phrase: "is correct" },
  ]);
  assert.equal(score.nonFindings, 2);
  const incorrect = finding("src/paginate.js", 3, 4, "P2", "Pagination bound is incorrect", "The <= bound reads one past the end.");
  assert.deepEqual(scoreReports(corpus, every({ "pagination-bounds": [incorrect] })).cases[0].detected.map((entry) => entry.defect),
    ["pagination-inclusive-bound"], "saying a thing is incorrect is still a finding");
}
console.log("PASS N1 an explicit non-finding is rejected before matching, so calling code safe never detects its defect");

// Matching is one-to-one and maximal. A second report of a detected defect is a
// duplicate, not a false positive, and no report or finding order changes a score.
{
  const again = finding("src/paginate.js", 3, 3, "P1", "Inclusive bound goes out of bounds", "Uses <= against the length.");
  const twice = scoreReports(corpus, every({ "pagination-bounds": [pagination, again] })).cases[0];
  assert.deepEqual(twice.detected, [{ defect: "pagination-inclusive-bound", severity: "P2", finding: ref(again) }]);
  assert.deepEqual(twice.duplicates, [{ finding: ref(pagination), defect: "pagination-inclusive-bound" }]);
  assert.deepEqual(twice.falsePositives, []);
  // The first finding could detect either attachment defect and the second only
  // the owner check. Taking the first eligible pairing would lose one.
  const both = finding("src/routes/attachments.js", 12, 15, "P1", "Lock taken without an owner check is never released",
    "Any user can overwrite it, and the 413 early return leaves the lock held.");
  const ownerOnly = finding("src/routes/attachments.js", 13, 14, "P1", "replaceAttachment skips the owner check",
    "Any user can overwrite it.");
  const scores = [[both, ownerOnly], [ownerOnly, both]].map((findings) =>
    scoreReports(corpus, every({ "attachment-replace": findings })));
  assert.deepEqual(scores[0], scores[1]);
  assert.deepEqual(scores[0].cases[2].detected.map((entry) => entry.defect),
    ["attachment-replace-owner-check", "attachment-replace-lock-release"]);
  assert.deepEqual(scores[0].cases[2].duplicates, []);
  const forward = every({ "attachment-replace": [both, ownerOnly], "pagination-bounds": [pagination, again] });
  const backward = submit([...forward.reports].reverse().map((report) => ({ ...report, findings: [...report.findings].reverse() })));
  assert.deepEqual(scoreReports(corpus, backward), scoreReports(corpus, forward));
  assert.equal(formatScore(scoreReports(corpus, backward)), formatScore(scoreReports(corpus, forward)));
}
console.log("PASS N1 matching is one-to-one, maximal, and independent of report and finding order");

// A clean control is scored like any case with no defect: every finding on it
// is a false positive, and the control is named. A case with no report at all
// is unscored rather than missed, because no report is not a clean review.
{
  const noise = finding("src/retry.js", 4, 4, "nit", "Delay constants could live in configuration", "Both limits are hard-coded.");
  const score = scoreReports(corpus, submit([
    { case: "clean-extract-constant", findings: [noise] },
    { case: "pagination-bounds", findings: [pagination] },
  ]));
  assert.deepEqual(score.cases.map((entry) => entry.id), ["pagination-bounds", "clean-extract-constant"]);
  assert.deepEqual(score.unscored, ["timeout-units", "attachment-replace", "clean-empty-name-parts"]);
  assert.deepEqual(score.controlsWithFindings, ["clean-extract-constant"]);
  assert.equal(score.falsePositives, 1);
  assert.deepEqual(score.cases[1].falsePositives, [{ finding: ref(noise), checks: [] }]);
  assert.deepEqual(score.bands.P1, { opportunities: 0, detected: 0 }, "an unscored case contributes no opportunity");
  assert.deepEqual(score.bands.P2, { opportunities: 1, detected: 1 });
}
console.log("PASS N1 a clean control that draws a finding is named, and a case with no report is unscored, not missed");

assert.throws(() => scoreReports(corpus, { corpus: "0".repeat(64), reports: [] }),
  new RegExp(`Reports were produced against corpus 0{64}, not ${corpus.hash}`));
assert.throws(() => scoreReports(corpus, submit([{ case: "missing-case", findings: [] }])),
  /Report names unknown corpus case "missing-case"/);
assert.throws(() => scoreReports(corpus, submit([
  { case: "pagination-bounds", findings: [] }, { case: "pagination-bounds", findings: [] },
])), /Duplicate report for corpus case "pagination-bounds"/);
assert.throws(() => scoreReports(corpus, submit([{ case: "pagination-bounds", findings: [{ ...pagination, location: undefined }] }])),
  /Report for pagination-bounds: finding 1 needs a title, a severity and a location/);
// The tool refuses a reversed or non-positive range before it becomes a finding,
// so the scorer does too: 4-3 would otherwise overlap the accepted 3-4 and count
// as a detection. Pull request #43's own review raised this.
for (const [startLine, endLine] of [[4, 3], [0, 3]]) {
  assert.throws(() => scoreReports(corpus, submit([{ case: "pagination-bounds",
    findings: [{ ...pagination, location: { ...pagination.location, startLine, endLine } }] }])),
  /Report for pagination-bounds: finding 1 needs .*1 <= startLine <= endLine/);
}
assert.throws(() => scoreReports(corpus, submit([{ case: "pagination-bounds", findings: [{ ...pagination, severity: "P9" }] }])),
  /Report for pagination-bounds: finding 1 has severity "P9", which this tool does not report/);
console.log("PASS N1 reports bound to another corpus, naming an unknown or repeated case, or malformed are refused");

// The tool also refuses a location it could not anchor: more than ten lines,
// outside one hunk, covering no changed line, or in no file of the diff. So the
// scorer does, naming the rule: 1-999, 3-13 and 3-9 would otherwise overlap the
// accepted 3-4 and count as detections. Pull request #43's Copilot review raised it.
for (const [location, rule] of [
  [{ startLine: 1, endLine: 999 }, "src/paginate.js:1-999 (head) spans more than 10 lines"],
  [{ startLine: 3, endLine: 13 }, "src/paginate.js:3-13 (head) spans more than 10 lines"],
  [{ startLine: 3, endLine: 9 }, "src/paginate.js:3-9 (head) is not inside one hunk"],
  [{ startLine: 5, endLine: 6 }, "src/paginate.js:5-6 (head) covers no changed line"],
  [{ path: "src/missing.js" }, "src/missing.js:4-4 (head) names no file in the diff"],
]) {
  assert.throws(() => scoreReports(corpus, submit([{ case: "pagination-bounds",
    findings: [pagination, { ...pagination, location: { ...pagination.location, ...location } }] }])),
  { message: `Report for pagination-bounds: finding 2: location ${rule}.` });
}
// Ten lines is the cap, not eleven: 11-20 is accepted, and 10-20, inside the same
// hunk and covering the same changed lines, is refused for its span alone.
{
  const spanning = (startLine) => scoreReports(corpus, submit([{ case: "attachment-replace",
    findings: [{ ...owner, location: { ...owner.location, startLine, endLine: 20 } }] }]));
  assert.deepEqual(spanning(11).cases[0].detected.map((entry) => entry.defect), ["attachment-replace-owner-check"]);
  assert.throws(() => spanning(10),
    { message: "Report for attachment-replace: finding 1: location src/routes/attachments.js:10-20 (head) spans more than 10 lines." });
}
console.log("PASS N1 a finding location the tool could not anchor is refused, naming the case, the finding and the rule");

// Terms are literal. A word term matches whole words only, so "ms" is not found
// inside "items"; case and runs of whitespace are normalised; a punctuation term
// such as "<=" matches wherever it appears.
{
  const timed = (title, actual) => scoreReports(corpus, every({
    "timeout-units": [finding("src/client.js", 4, 5, "P1", title, actual)],
  })).cases[1].detected.length;
  assert.equal(timed("Timeout items abort late", "30000 * 1000"), 0);
  assert.equal(timed("Timeout is 30000 MS   times 1000", ""), 1);
  const paged = (actual) => scoreReports(corpus, every({
    "pagination-bounds": [finding("src/paginate.js", 4, 4, "P2", "Loop", actual)],
  })).cases[0].detected.length;
  assert.equal(paged("Reads ONE   PAST the end with i<=last"), 1);
}
console.log("PASS N1 concept terms match whole words, ignoring case and spacing, and punctuation terms match anywhere");

// The formatted score is the diagnosis. It is pinned line for line, so a change
// to what a reader is told is a deliberate change to this test.
{
  const vague = finding("src/paginate.js", 4, 4, "P2", "Loop bound changed", "The loop now compares differently.");
  const denial = finding("src/paginate.js", 3, 4, "P2", "Pagination bound",
    "The <= bound is correct and never reads one past the end.");
  const noise = finding("src/retry.js", 4, 4, "nit", "Delay constants could live in configuration", "Both limits are hard-coded.");
  const text = formatScore(scoreReports(corpus, submit([
    { case: "pagination-bounds", findings: [vague, denial] },
    { case: "clean-extract-constant", findings: [noise] },
  ])));
  assert.deepEqual(text.split("\n"), [
    `Benchmark score against corpus ${corpus.hash}.`,
    "Scored 2 of 5 case(s); unscored: timeout-units, attachment-replace, clean-empty-name-parts.",
    "P0: 0 of 0 seeded defect(s) detected",
    "P1: 0 of 0 seeded defect(s) detected",
    "P2: 0 of 1 seeded defect(s) detected",
    "P3: 0 of 0 seeded defect(s) detected",
    "nit: 0 of 0 seeded defect(s) detected",
    "False positives: 2; duplicates: 0; non-findings rejected: 1; controls that drew a finding: clean-extract-constant.",
    "Counts only, banded by each defect's target severity; no rate, baseline or threshold is applied.",
    "pagination-bounds (seeded)",
    "  missed pagination-inclusive-bound [target P2]",
    '  non-finding rejected before matching: src/paginate.js:3-4 (head) [P2] Pagination bound; its actual says "is correct"',
    "  false positive: src/paginate.js:4-4 (head) [P2] Loop bound changed",
    "    against pagination-inclusive-bound: location matches; severity allowed; missing a concept (one of: off-by-one, " +
      "off by one, one past, past the end, out of bounds, out-of-bounds, one extra, extra element, extra item, undefined)",
    "clean-extract-constant (control)",
    "  false positive: src/retry.js:4-4 (head) [nit] Delay constants could live in configuration",
    "    no seeded defect to match: this is a clean control",
  ]);
}
console.log("PASS N1 the formatted score names every detection, miss, rejection and false positive, reproducibly");

console.log("PASS smoke-benchmark");
