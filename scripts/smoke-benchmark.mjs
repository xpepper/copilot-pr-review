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
import { corpusDirectory, loadCorpus } from "./benchmark/score.mjs";

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
