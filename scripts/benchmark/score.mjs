// N1: a seeded review corpus, and the deterministic scorer that measures a
// review's findings against it. Nothing here runs a model, opens a connection
// or collects a review. The corpus is plain text pinned by content hash, and its
// ground truth is explicit metadata checked against its own diffs, so a bad
// entry or a surprising score can be diagnosed from the output alone.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDiffFiles } from "../../extensions/pr-review/context.mjs";
import { reviewModes } from "../../extensions/pr-review/modes.mjs";

export const corpusDirectory = join(dirname(fileURLToPath(import.meta.url)), "corpus");
// Full review admits every severity this tool can report, in rank order, so the
// corpus can never expect a severity no review would produce.
export const severities = reviewModes.full.policy.severities;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const normalize = (text) => text.toLowerCase().replace(/\s+/g, " ").trim();
const isTerm = (value) => typeof value === "string" && value !== "" && normalize(value) === value;

function fields(value, names, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}: expected an object.`);
  for (const key of Object.keys(value)) {
    if (!names.includes(key)) throw new Error(`${label}: unknown field ${JSON.stringify(key)}.`);
  }
  for (const key of names) {
    if (!Object.hasOwn(value, key)) throw new Error(`${label}: missing field ${JSON.stringify(key)}.`);
  }
}

function checkDefect(defect, seen) {
  fields(defect, ["id", "summary", "severity", "allowedSeverities", "locations", "concepts"], `Corpus defect ${defect?.id}`);
  if (typeof defect.id !== "string" || !slug.test(defect.id)) {
    throw new Error(`Corpus defect id ${JSON.stringify(defect.id)} must be lowercase words joined by hyphens.`);
  }
  if (seen.has(defect.id)) throw new Error(`Duplicate defect id ${JSON.stringify(defect.id)}.`);
  seen.add(defect.id);
  const label = `Corpus defect ${defect.id}`;
  if (typeof defect.summary !== "string" || !defect.summary.trim()) throw new Error(`${label}: summary must be text.`);
  if (!Array.isArray(defect.allowedSeverities) || !defect.allowedSeverities.length) {
    throw new Error(`${label}: allowedSeverities must be a non-empty list.`);
  }
  for (const severity of [defect.severity, ...defect.allowedSeverities]) {
    if (!severities.includes(severity)) {
      throw new Error(`${label}: severity ${JSON.stringify(severity)} is not one this tool reports (${severities.join(", ")}).`);
    }
  }
  if (!defect.allowedSeverities.includes(defect.severity)) {
    throw new Error(`${label}: target severity ${JSON.stringify(defect.severity)} is not among its allowed ` +
      `severities ${defect.allowedSeverities.join(", ")}.`);
  }
  if (!Array.isArray(defect.locations) || !defect.locations.length) throw new Error(`${label}: locations must be a non-empty list.`);
  for (const location of defect.locations) {
    fields(location, ["path", "side", "startLine", "endLine"], `${label} location`);
    if (typeof location.path !== "string" || !location.path || !["head", "base"].includes(location.side) ||
        !Number.isSafeInteger(location.startLine) || !Number.isSafeInteger(location.endLine) ||
        location.startLine < 1 || location.endLine < location.startLine) {
      throw new Error(`${label}: location ${JSON.stringify(location)} needs a path, a head or base side, ` +
        "and 1 <= startLine <= endLine.");
    }
  }
  if (!Array.isArray(defect.concepts) || !defect.concepts.length) throw new Error(`${label}: concepts must be a non-empty list.`);
  defect.concepts.forEach((group, index) => {
    if (!Array.isArray(group) || !group.length) throw new Error(`${label}: concept group ${index + 1} is empty.`);
    for (const term of group) {
      if (!isTerm(term)) throw new Error(`${label}: concept term ${JSON.stringify(term)} is not lowercase, trimmed text.`);
    }
  });
}

// Hunk headers are checked against their bodies here, independently of the
// product's parser, which reads a declared count as authoritative: a header that
// under-declares would leave body lines silently outside any hunk.
function checkHunks(label, diff) {
  let oldPath = null;
  let newPath = null;
  let hunk = null;
  const where = () => `${newPath === "/dev/null" ? oldPath : newPath} hunk at -${hunk.oldStart} +${hunk.newStart}`;
  const finish = () => {
    if (hunk && (hunk.base !== hunk.oldLines || hunk.head !== hunk.newLines)) {
      throw new Error(`${label}: ${where()} declares ${hunk.oldLines} base and ${hunk.newLines} head line(s) ` +
        `but carries ${hunk.base} and ${hunk.head}.`);
    }
    hunk = null;
  };
  const lines = diff.split("\n");
  if (lines.at(-1) === "") lines.pop();
  for (const line of lines) {
    const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (line.startsWith("diff --git ") || header) {
      finish();
      if (header) {
        hunk = { oldStart: Number(header[1]), oldLines: Number(header[2] ?? 1),
          newStart: Number(header[3]), newLines: Number(header[4] ?? 1), base: 0, head: 0 };
      }
      continue;
    }
    if (!hunk) {
      if (line.startsWith("--- ")) oldPath = line.slice(4).replace(/^a\//, "");
      else if (line.startsWith("+++ ")) newPath = line.slice(4).replace(/^b\//, "");
      continue;
    }
    if (line.startsWith(" ")) {
      hunk.base++;
      hunk.head++;
    } else if (line.startsWith("-")) hunk.base++;
    else if (line.startsWith("+")) hunk.head++;
    else throw new Error(`${label}: ${where()} carries a line that is not context, removal or addition: ${JSON.stringify(line)}.`);
  }
  finish();
}

// An acceptable location obeys the anchor rule a validated finding obeys: it
// lies inside one hunk and covers a changed line on its own side. A submitted
// finding also takes the tool's ten-line cap; an acceptable location takes none.
function checkLocation(label, location, files, maxLines = Infinity) {
  const where = `location ${location.path}:${location.startLine}-${location.endLine} (${location.side})`;
  if (location.endLine - location.startLine >= maxLines) throw new Error(`${label}: ${where} spans more than ${maxLines} lines.`);
  const file = files.find((entry) => (location.side === "head" ? entry.newPath : entry.oldPath) === location.path);
  if (!file) throw new Error(`${label}: ${where} names no file in the diff.`);
  const [start, count] = location.side === "head" ? ["newStart", "newLines"] : ["oldStart", "oldLines"];
  if (!file.hunks.some((hunk) => location.startLine >= hunk[start] && location.endLine < hunk[start] + hunk[count])) {
    throw new Error(`${label}: ${where} is not inside one hunk.`);
  }
  if (!file.changed[location.side].some((line) => line >= location.startLine && line <= location.endLine)) {
    throw new Error(`${label}: ${where} covers no changed line.`);
  }
}

export function loadCorpus(directory = corpusDirectory) {
  const manifestBytes = readFileSync(join(directory, "corpus.json"));
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  fields(manifest, ["nonFindingPhrases", "cases"], "Corpus manifest");
  if (!Array.isArray(manifest.nonFindingPhrases) || !manifest.nonFindingPhrases.length) {
    throw new Error("Corpus manifest: nonFindingPhrases must be a non-empty list.");
  }
  for (const phrase of manifest.nonFindingPhrases) {
    if (!isTerm(phrase)) throw new Error(`Corpus non-finding phrase ${JSON.stringify(phrase)} is not lowercase, trimmed text.`);
  }
  if (!Array.isArray(manifest.cases) || !manifest.cases.length) throw new Error("Corpus manifest: cases must be a non-empty list.");
  const caseIds = new Set();
  const defectIds = new Set();
  for (const entry of manifest.cases) {
    fields(entry, ["id", "kind", "sha256", "defects"], `Corpus case ${entry?.id}`);
    if (typeof entry.id !== "string" || !slug.test(entry.id)) {
      throw new Error(`Corpus case id ${JSON.stringify(entry.id)} must be lowercase words joined by hyphens.`);
    }
    if (caseIds.has(entry.id)) throw new Error(`Duplicate corpus case id ${JSON.stringify(entry.id)}.`);
    caseIds.add(entry.id);
    const label = `Corpus case ${entry.id}`;
    if (!["seeded", "control"].includes(entry.kind)) throw new Error(`${label}: kind must be "seeded" or "control".`);
    if (typeof entry.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(entry.sha256)) {
      throw new Error(`${label}: sha256 must be 64 lowercase hex digits.`);
    }
    if (!Array.isArray(entry.defects)) throw new Error(`${label}: defects must be a list.`);
    if (entry.kind === "control" && entry.defects.length) throw new Error(`${label}: a control carries no defect.`);
    if (entry.kind === "seeded" && !entry.defects.length) throw new Error(`${label}: a seeded case carries at least one defect.`);
    for (const defect of entry.defects) checkDefect(defect, defectIds);
  }
  for (const name of readdirSync(join(directory, "cases")).sort()) {
    if (!caseIds.has(name.replace(/\.diff$/, "")) || !name.endsWith(".diff")) {
      throw new Error(`Corpus fixture cases/${name} is not listed in corpus.json.`);
    }
  }
  const cases = manifest.cases.map((entry) => {
    const label = `Corpus case ${entry.id}`;
    const name = `cases/${entry.id}.diff`;
    const bytes = readFileSync(join(directory, name));
    const actual = sha256(bytes);
    if (actual !== entry.sha256) throw new Error(`${label}: ${name} has sha256 ${actual}, but corpus.json pins ${entry.sha256}.`);
    const diff = bytes.toString("utf8");
    for (let index = 0; index < diff.length; index++) {
      const code = diff.charCodeAt(index);
      if ((code < 32 && code !== 9 && code !== 10) || code === 127) {
        throw new Error(`${label}: ${name} carries control byte 0x${code.toString(16).padStart(2, "0")} at character ` +
          `${index}; corpus fixtures are plain text.`);
      }
    }
    checkHunks(label, diff);
    const files = parseDiffFiles(diff);
    for (const defect of entry.defects) {
      for (const location of defect.locations) checkLocation(`Corpus defect ${defect.id}`, location, files);
    }
    return { ...entry, diff, files };
  });
  return { hash: sha256(manifestBytes), nonFindingPhrases: manifest.nonFindingPhrases, cases };
}

// The prose a validated finding carries. Concepts may appear in any of it.
const proseFields = ["title", "trigger", "expected", "actual", "introduction", "remediation"];
const denialFields = ["title", "actual"];
const wordEdge = /[a-z0-9]/;

// A term is found literally in normalised text. A term that starts or ends with
// a letter or digit must meet a non-word character there, so "ms" is not found
// inside "items"; a punctuation edge such as "<=" matches wherever it appears.
function containsTerm(text, term) {
  for (let index = text.indexOf(term); index !== -1; index = text.indexOf(term, index + 1)) {
    const before = text[index - 1];
    const after = text[index + term.length];
    if ((!wordEdge.test(term[0]) || before === undefined || !wordEdge.test(before)) &&
        (!wordEdge.test(term.at(-1)) || after === undefined || !wordEdge.test(after))) return true;
  }
  return false;
}

const reference = (finding) => `${finding.location.path}:${finding.location.startLine}-${finding.location.endLine} ` +
  `(${finding.location.side}) [${finding.severity}] ${finding.title}`;

function checkFinding(label, finding, index, files) {
  const where = `${label}: finding ${index + 1}`;
  const location = finding?.location;
  if (!finding || typeof finding !== "object" || typeof finding.title !== "string" || typeof finding.severity !== "string" ||
      !location || typeof location.path !== "string" || !["head", "base"].includes(location.side) ||
      !Number.isSafeInteger(location.startLine) || !Number.isSafeInteger(location.endLine) ||
      location.startLine < 1 || location.endLine < location.startLine) {
    throw new Error(`${where} needs a title, a severity and a location with a path, a head or base side, ` +
      "and 1 <= startLine <= endLine.");
  }
  if (!severities.includes(finding.severity)) {
    throw new Error(`${where} has severity ${JSON.stringify(finding.severity)}, which this tool does not report.`);
  }
  for (const key of proseFields) {
    if (finding[key] !== undefined && typeof finding[key] !== "string") throw new Error(`${where}: ${key} must be text.`);
  }
  // A report holds validated findings, and the tool refuses a location it could
  // not anchor, so the scorer does too: 1-999 would otherwise overlap 3-4.
  checkLocation(where, location, files, 10);
}

const overlaps = (location, accepted) => location.path === accepted.path && location.side === accepted.side &&
  location.startLine <= accepted.endLine && accepted.startLine <= location.endLine;

function scoreCase(entry, findings, phrases) {
  // Findings are put in one canonical order before anything is decided, so the
  // order a report happened to list them in cannot change a pairing.
  const ordered = findings
    .map((finding) => ({ finding, key: JSON.stringify([finding.location.path, finding.location.side,
      finding.location.startLine, finding.location.endLine, finding.severity, ...proseFields.map((key) => finding[key] ?? "")]) }))
    .sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0))
    .map(({ finding }) => finding);
  // An explicit non-finding is set aside before matching, so a report calling
  // the code safe can never detect the defect it names. Only the headline and
  // the observed behaviour are read: the expected field describes correct
  // behaviour by design, so "is correct" there denies nothing.
  const nonFindings = [];
  const considered = [];
  for (const finding of ordered) {
    const denial = denialFields
      .map((field) => ({ field, phrase: phrases.find((phrase) => containsTerm(normalize(finding[field] ?? ""), phrase)) }))
      .find((entry) => entry.phrase);
    if (denial) nonFindings.push({ finding: reference(finding), ...denial });
    else considered.push(finding);
  }
  const checks = considered.map((finding) => {
    const text = normalize(proseFields.map((key) => finding[key] ?? "").join(" "));
    return entry.defects.map((defect) => {
      const location = defect.locations.some((accepted) => overlaps(finding.location, accepted));
      const severity = defect.allowedSeverities.includes(finding.severity);
      const missingConcepts = defect.concepts.filter((group) => !group.some((term) => containsTerm(text, term)));
      return { defect: defect.id, location, severity, missingConcepts };
    });
  });
  const eligible = (f, d) => checks[f][d].location && checks[f][d].severity && !checks[f][d].missingConcepts.length;
  // A maximum one-to-one matching, by augmenting paths. Taking the first
  // eligible pairing instead can spend a finding on one defect that only it
  // could not have detected, and lose the other.
  const owner = entry.defects.map(() => -1);
  const augment = (f, seen) => entry.defects.some((_, d) => {
    if (!eligible(f, d) || seen.has(d)) return false;
    seen.add(d);
    if (owner[d] !== -1 && !augment(owner[d], seen)) return false;
    owner[d] = f;
    return true;
  });
  considered.forEach((_, f) => augment(f, new Set()));
  const matched = new Set(owner);
  return {
    id: entry.id,
    kind: entry.kind,
    detected: entry.defects.flatMap((defect, d) => (owner[d] === -1 ? [] :
      [{ defect: defect.id, severity: defect.severity, finding: reference(considered[owner[d]]) }])),
    missed: entry.defects.flatMap((defect, d) => (owner[d] === -1 ? [{ defect: defect.id, severity: defect.severity }] : [])),
    nonFindings,
    // Unmatched but eligible means every defect it could detect was already
    // detected by another finding: a second report, not a false one.
    duplicates: considered.flatMap((finding, f) => {
      const d = entry.defects.findIndex((_, index) => eligible(f, index));
      return matched.has(f) || d === -1 ? [] : [{ finding: reference(finding), defect: entry.defects[d].id }];
    }),
    falsePositives: considered.flatMap((finding, f) => (matched.has(f) || entry.defects.some((_, d) => eligible(f, d)) ? [] :
      [{ finding: reference(finding), checks: checks[f] }])),
  };
}

// Scores reports of review findings against the corpus they were produced for.
// It spends nothing and decides nothing: it counts, per case and per target
// severity, and every count can be traced to the finding and check behind it.
export function scoreReports(corpus, submission) {
  if (!submission || typeof submission !== "object" || !Array.isArray(submission.reports)) {
    throw new Error("Reports must be an object carrying a corpus hash and a reports list.");
  }
  if (submission.corpus !== corpus.hash) {
    throw new Error(`Reports were produced against corpus ${submission.corpus}, not ${corpus.hash}.`);
  }
  const reported = new Map();
  for (const report of submission.reports) {
    const entry = corpus.cases.find((candidate) => candidate.id === report?.case);
    if (!entry) throw new Error(`Report names unknown corpus case ${JSON.stringify(report?.case)}.`);
    if (reported.has(entry.id)) throw new Error(`Duplicate report for corpus case ${JSON.stringify(entry.id)}.`);
    if (!Array.isArray(report.findings)) throw new Error(`Report for ${entry.id}: findings must be a list.`);
    report.findings.forEach((finding, index) => checkFinding(`Report for ${entry.id}`, finding, index, entry.files));
    reported.set(entry.id, report.findings);
  }
  const cases = corpus.cases.filter((entry) => reported.has(entry.id))
    .map((entry) => scoreCase(entry, reported.get(entry.id), corpus.nonFindingPhrases));
  const bands = Object.fromEntries(severities.map((severity) => [severity, { opportunities: 0, detected: 0 }]));
  for (const scored of cases) {
    for (const { severity } of scored.detected) bands[severity].detected++;
    for (const { severity } of [...scored.detected, ...scored.missed]) bands[severity].opportunities++;
  }
  const total = (key) => cases.reduce((sum, scored) => sum + scored[key].length, 0);
  return {
    corpus: corpus.hash,
    cases,
    unscored: corpus.cases.filter((entry) => !reported.has(entry.id)).map((entry) => entry.id),
    bands,
    falsePositives: total("falsePositives"),
    duplicates: total("duplicates"),
    nonFindings: total("nonFindings"),
    controlsWithFindings: cases.filter((scored) => scored.kind === "control" && scored.falsePositives.length)
      .map((scored) => scored.id),
  };
}

export function formatScore(score) {
  const lines = [
    `Benchmark score against corpus ${score.corpus}.`,
    `Scored ${score.cases.length} of ${score.cases.length + score.unscored.length} case(s); ` +
      `unscored: ${score.unscored.join(", ") || "none"}.`,
    ...severities.map((severity) =>
      `${severity}: ${score.bands[severity].detected} of ${score.bands[severity].opportunities} seeded defect(s) detected`),
    `False positives: ${score.falsePositives}; duplicates: ${score.duplicates}; non-findings rejected: ${score.nonFindings}; ` +
      `controls that drew a finding: ${score.controlsWithFindings.join(", ") || "none"}.`,
    "Counts only, banded by each defect's target severity; no rate, baseline or threshold is applied.",
  ];
  for (const scored of score.cases) {
    lines.push(`${scored.id} (${scored.kind})`);
    for (const entry of scored.detected) lines.push(`  detected ${entry.defect} [target ${entry.severity}] by ${entry.finding}`);
    for (const entry of scored.missed) lines.push(`  missed ${entry.defect} [target ${entry.severity}]`);
    for (const entry of scored.nonFindings) {
      lines.push(`  non-finding rejected before matching: ${entry.finding}; its ${entry.field} says "${entry.phrase}"`);
    }
    for (const entry of scored.duplicates) lines.push(`  duplicate of ${entry.defect}: ${entry.finding}`);
    for (const entry of scored.falsePositives) {
      lines.push(`  false positive: ${entry.finding}`);
      if (!entry.checks.length) lines.push("    no seeded defect to match: this is a clean control");
      for (const check of entry.checks) {
        const concepts = check.missingConcepts.length
          ? check.missingConcepts.map((group) => `missing a concept (one of: ${group.join(", ")})`).join("; ")
          : "every concept present";
        lines.push(`    against ${check.defect}: location ${check.location ? "matches" : "does not match"}; ` +
          `severity ${check.severity ? "allowed" : "not allowed"}; ${concepts}`);
      }
    }
  }
  return lines.join("\n");
}
