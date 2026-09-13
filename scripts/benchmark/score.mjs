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
// lies inside one hunk and covers a changed line on its own side.
function checkLocation(label, location, files) {
  const where = `location ${location.path}:${location.startLine}-${location.endLine} (${location.side})`;
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
