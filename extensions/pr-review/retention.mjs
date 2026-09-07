import { randomUUID } from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync,
  renameSync, unlinkSync, writeFileSync,
} from "node:fs";
import { basename, isAbsolute, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { formatFindings, minimumConfidence, reviewKey } from "./findings.mjs";

export const retainedFilename = "pr-review-result.json";
const hash = /^[a-f0-9]{64}$/;
const sha = /^[a-f0-9]{40}$/;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const statuses = ["selected", "none", "empty", "cancelled", "unavailable", "failed", "not-started"];
const pick = (value, keys) => Object.fromEntries(keys.filter((key) => value[key] !== undefined)
  .map((key) => [key, structuredClone(value[key])]));

function requireValue(condition, message) {
  if (!condition) throw new Error(`Invalid retained result: ${message}.`);
}
function object(value, required, optional = []) {
  requireValue(value && typeof value === "object" && !Array.isArray(value) &&
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => [...required, ...optional].includes(key)), "incompatible object schema");
}
function text(value) { requireValue(typeof value === "string" && value.trim(), "expected nonempty text"); }
function strings(value) {
  requireValue(Array.isArray(value), "expected string array");
  value.forEach(text);
}
function identity(value) {
  object(value, ["invocationId", "sessionId"]);
  requireValue(uuid.test(value.invocationId), "invalid invocation ID");
  text(value.sessionId);
}
function repository(value) {
  object(value, ["id", "host", "nameWithOwner"], ["url"]);
  Object.values(value).forEach(text);
}
function binding(value) {
  object(value, ["repository", "number", "pullId", "head", "base", "diffSha256", "contextSha256", "paths"]);
  repository(value.repository);
  requireValue(Number.isSafeInteger(value.number) && value.number > 0, "invalid PR number");
  text(value.pullId);
  requireValue(sha.test(value.head) && sha.test(value.base) &&
    hash.test(value.diffSha256) && hash.test(value.contextSha256), "invalid revision or review digest");
  requireValue(Array.isArray(value.paths), "missing source provenance");
  for (const file of value.paths) {
    object(file, ["path", "status", "sources"], ["reason"]);
    text(file.path); text(file.status);
    if (file.reason !== undefined) text(file.reason);
    requireValue(Array.isArray(file.sources), "missing sources");
    for (const source of file.sources) {
      object(source, ["path", "side", "ref", "blobSha"]);
      text(source.path);
      requireValue(["head", "base"].includes(source.side) && source.ref === value[source.side] &&
        sha.test(source.blobSha), "source revision mismatch");
    }
  }
}
function citation(value, target) {
  object(value, ["path", "side", "startLine", "endLine", "quote", "ref", "blobSha"]);
  text(value.path); text(value.quote);
  requireValue(["head", "base"].includes(value.side) &&
    Number.isSafeInteger(value.startLine) && value.startLine > 0 &&
    Number.isSafeInteger(value.endLine) && value.endLine >= value.startLine &&
    value.quote.split("\n").length === value.endLine - value.startLine + 1, "invalid citation");
  requireValue(target.paths.some((file) => file.sources.some((source) =>
    source.path === value.path && source.side === value.side &&
    source.ref === value.ref && source.blobSha === value.blobSha)), "citation outside reviewed binding");
}
function validation(value, target) {
  object(value, ["complete", "findings", "rejected", "duplicates", "issues"]);
  strings(value.issues);
  requireValue(typeof value.complete === "boolean" && value.complete === (value.issues.length === 0) &&
    [value.findings, value.rejected, value.duplicates].every(Array.isArray), "invalid validation state");
  const ids = new Set();
  const candidates = new Set();
  for (const finding of value.findings) {
    object(finding, ["id", "reviewer", "title", "severity", "confidence", "location", "trigger",
      "expected", "actual", "introduction", "before", "after", "evidence", "reportedBy", "candidateIds", "validation"]);
    for (const key of ["id", "reviewer", "title", "trigger", "expected", "actual", "introduction"]) text(finding[key]);
    requireValue(!ids.has(finding.id), "duplicate canonical finding ID");
    ids.add(finding.id);
    requireValue(["P0", "P1", "P2"].includes(finding.severity) &&
      Number.isFinite(finding.confidence) && finding.confidence >= minimumConfidence &&
      finding.confidence <= 1, "invalid quick severity/confidence");
    strings(finding.reportedBy); strings(finding.candidateIds);
    requireValue(finding.reportedBy.includes(finding.reviewer) && finding.candidateIds.includes(finding.id) &&
      finding.candidateIds.every((id) => !candidates.has(id)) &&
      new Set(finding.candidateIds).size === finding.candidateIds.length, "invalid finding attribution");
    finding.candidateIds.forEach((id) => candidates.add(id));
    citation(finding.location, target);
    requireValue(finding.location.endLine - finding.location.startLine <= 9, "oversized finding anchor");
    for (const side of ["before", "after"]) {
      if (finding[side] !== null) {
        citation(finding[side], target);
        requireValue(finding[side].side === (side === "before" ? "base" : "head"), "introduction side mismatch");
      }
    }
    requireValue(Array.isArray(finding.evidence) && finding.evidence.length, "missing evidence");
    finding.evidence.forEach((entry) => citation(entry, target));
    object(finding.validation, ["kind", "allClaimsSupported", "reason", "evidence"]);
    requireValue(finding.validation.kind === "source-grounded-model-adjudication" &&
      finding.validation.allClaimsSupported === true &&
      Array.isArray(finding.validation.evidence) && finding.validation.evidence.length, "unvalidated finding");
    text(finding.validation.reason);
    finding.validation.evidence.forEach((entry) => citation(entry, target));
  }
  const excluded = new Set();
  for (const entry of value.rejected) {
    object(entry, ["id", "verdict", "reason"]);
    text(entry.id); text(entry.reason);
    requireValue(["reject", "uncertain"].includes(entry.verdict) && !candidates.has(entry.id) &&
      !excluded.has(entry.id), "rejected candidate became a finding");
    excluded.add(entry.id);
  }
  for (const entry of value.duplicates) {
    object(entry, ["id", "duplicateOf", "reason"]);
    text(entry.id); text(entry.reason);
    requireValue(!ids.has(entry.id) && !excluded.has(entry.id) &&
      value.findings.some((finding) => finding.id === entry.duplicateOf &&
        finding.candidateIds.includes(entry.id)), "invalid duplicate alias");
    excluded.add(entry.id);
  }
  requireValue([...candidates].every((id) => ids.has(id) || excluded.has(id)), "unaccounted duplicate alias");
}

const reviewerKeys = ["label", "model", "reasoningEffort", "sessionId", "status", "error", "usage", "startedAt", "completedAt"];
const outcomeKeys = ["invocation", "binding", "mode", "noComment", "complete", "reviewComplete",
  "executionComplete", "coverage", "cancelled", "error", "cleanupErrors", "disposition", "reason", "selection"];

export function retainedRecord(outcome) {
  const result = pick(outcome, outcomeKeys);
  result.reviewers = (outcome.reviewers ?? []).map((reviewer) => pick(reviewer, reviewerKeys));
  if (outcome.adjudicator) result.adjudicator = pick(outcome.adjudicator, reviewerKeys);
  if (outcome.validation) {
    result.validation = {
      ...pick(outcome.validation, ["complete", "findings", "rejected", "issues"]),
      duplicates: outcome.validation.duplicates.map((entry) => pick(entry, ["id", "duplicateOf", "reason"])),
    };
  }
  // Normalize optional undefined properties in selection/binding before schema checks.
  const clean = JSON.parse(JSON.stringify(result));
  return {
    schemaVersion: 1, state: "settled", invocation: clean.invocation,
    outcome: clean, digest: reviewKey(clean),
  };
}

export function validateRecord(record, sessionId) {
  object(record, ["schemaVersion", "state", "invocation"], ["outcome", "digest"]);
  requireValue(record.schemaVersion === 1 && ["pending", "settled"].includes(record.state), "unsupported schema/state");
  identity(record.invocation);
  requireValue(record.invocation.sessionId === sessionId, "wrong originating session");
  if (record.state === "pending") {
    requireValue(!Object.hasOwn(record, "outcome") && !Object.hasOwn(record, "digest"), "pending record contains a result");
    return record;
  }
  const value = record.outcome;
  object(value, ["invocation", "mode", "noComment", "complete", "reviewComplete", "executionComplete",
    "coverage", "cancelled", "cleanupErrors", "selection", "reviewers"],
  ["binding", "validation", "adjudicator", "error", "disposition", "reason"]);
  requireValue(record.digest === reviewKey(value) && isDeepStrictEqual(value.invocation, record.invocation),
    "record digest or invocation mismatch");
  requireValue(value.mode === "quick" && value.noComment === true, "unsupported mode/publication state");
  for (const key of ["complete", "reviewComplete", "executionComplete", "cancelled"]) {
    requireValue(typeof value[key] === "boolean", "invalid coverage flag");
  }
  strings(value.cleanupErrors);
  for (const key of ["error", "disposition", "reason"]) if (value[key] !== undefined) text(value[key]);
  requireValue(["completed", "incomplete", "not-started"].includes(value.coverage) &&
    value.complete === (value.coverage === "completed"), "inconsistent coverage");
  if (value.binding) binding(value.binding);
  if (value.validation) {
    requireValue(value.binding, "validated result without review binding");
    validation(value.validation, value.binding);
  }
  requireValue(!value.complete || (value.reviewComplete && value.executionComplete && value.validation?.complete &&
    !value.cancelled && !value.error && !value.cleanupErrors.length), "false completed-coverage claim");
  requireValue(Array.isArray(value.reviewers), "missing reviewer coverage");
  for (const reviewer of [...value.reviewers, ...(value.adjudicator ? [value.adjudicator] : [])]) {
    object(reviewer, ["label", "model", "status"], reviewerKeys);
    text(reviewer.label); text(reviewer.model);
    requireValue(["completed", "incomplete", "cancelled"].includes(reviewer.status), "invalid reviewer state");
    for (const key of ["error", "reasoningEffort", "sessionId"]) if (reviewer[key] !== undefined) text(reviewer[key]);
    for (const key of ["startedAt", "completedAt"]) {
      if (reviewer[key] !== undefined) requireValue(reviewer[key] === null || Number.isFinite(reviewer[key]), "invalid reviewer timing");
    }
    if (reviewer.usage !== undefined) {
      requireValue(Array.isArray(reviewer.usage), "invalid usage attribution");
      for (const usage of reviewer.usage) {
        object(usage, [], ["model", "reasoningEffort", "isByok"]);
        if (usage.model !== undefined) text(usage.model);
        if (usage.reasoningEffort !== undefined) text(usage.reasoningEffort);
        requireValue(usage.isByok === undefined || typeof usage.isByok === "boolean", "invalid provider attribution");
      }
    }
  }
  if (value.complete) requireValue(value.reviewers.length === 3 &&
    value.reviewers.every((reviewer) => reviewer.status === "completed") &&
    (!value.adjudicator || value.adjudicator.status === "completed"), "incomplete reviewer coverage");
  const selection = value.selection;
  object(selection, ["status", "findingIds"], ["binding", "error"]);
  requireValue(statuses.includes(selection.status), "unknown selection status");
  strings(selection.findingIds);
  if (selection.error !== undefined) text(selection.error);
  const ids = value.validation?.findings.map((finding) => finding.id) ?? [];
  requireValue(new Set(selection.findingIds).size === selection.findingIds.length &&
    selection.findingIds.every((id) => ids.includes(id)), "stale/noncanonical selected finding ID");
  requireValue((selection.status === "selected") === (selection.findingIds.length > 0), "invalid selection disposition");
  if (selection.binding) {
    requireValue(value.binding && isDeepStrictEqual(selection.binding, {
      ...value.invocation, repository: value.binding.repository, number: value.binding.number,
      pullId: value.binding.pullId, head: value.binding.head, reviewKey: reviewKey(value.binding),
    }), "selection/review binding mismatch");
  }
  requireValue(selection.status !== "selected" || selection.binding, "unbound selection");
  requireValue(!value.cancelled || (!value.complete && selection.status === "cancelled" &&
    !selection.findingIds.length), "cancelled selection remains actionable");
  requireValue(selection.status !== "cancelled" || value.cancelled, "unrecorded cancellation");
  requireValue(selection.status !== "empty" || (value.validation && !ids.length), "false empty result");
  requireValue(selection.status !== "not-started" || !value.validation, "validation lost from selection state");
  return record;
}

export async function sessionStore(parent) {
  const metadata = await parent.rpc.metadata.snapshot();
  requireValue(metadata.sessionId === parent.sessionId && metadata.isRemote === false && !metadata.alreadyInUse &&
    typeof metadata.workspacePath === "string" && isAbsolute(metadata.workspacePath) &&
    basename(metadata.workspacePath) === parent.sessionId, "local originating-session workspace unavailable");
  const directory = realpathSync(metadata.workspacePath);
  requireValue(basename(directory) === parent.sessionId && directory !== realpathSync(metadata.workingDirectory),
    "workspace is not a distinct session-state directory");
  const filename = join(directory, retainedFilename);
  function read() {
    let raw;
    try {
      const stat = lstatSync(filename);
      requireValue(stat.isFile() && !stat.isSymbolicLink(), "unsafe retained file");
      raw = readFileSync(filename, "utf8");
    }
    catch (error) {
      if (error.code === "ENOENT") return undefined;
      throw error;
    }
    return validateRecord(JSON.parse(raw), parent.sessionId);
  }
  function write(record) {
    validateRecord(record, parent.sessionId);
    const temporary = join(directory, `.pr-review-${randomUUID()}.tmp`);
    let fd;
    try {
      fd = openSync(temporary, "wx", 0o600);
      writeFileSync(fd, JSON.stringify(record));
      fsyncSync(fd);
      closeSync(fd);
      fd = undefined;
      renameSync(temporary, filename);
    } finally {
      if (fd !== undefined) closeSync(fd);
      if (existsSync(temporary)) unlinkSync(temporary);
    }
  }
  return { read, write };
}

export async function inspectRetained(parent) {
  const record = (await sessionStore(parent)).read();
  if (!record) {
    await parent.log("No retained PR review result in this session. No review was run.");
    return;
  }
  if (record.state === "pending") {
    await parent.log(`Retained invocation ${record.invocation.invocationId} is unfinished/interrupted. ` +
      "No settled findings or actionable selection; review coverage is unknown. This is not a clean-review claim.",
    { level: "error" });
    return;
  }
  const value = record.outcome;
  await parent.log([
    `Retained invocation ${record.invocation.invocationId} from session ${record.invocation.sessionId}.`,
    `Coverage: ${value.coverage}. Selection: ${value.selection.status}; IDs: ${value.selection.findingIds.join(", ") || "(none)"}.`,
    "This is the captured review, not a current-head check. Nothing was rerun or published.",
    formatFindings(value),
    ...value.reviewers.map((reviewer) => `${reviewer.label}: ${reviewer.status}${reviewer.error ? `; ${reviewer.error}` : ""}`),
    ...[value.error, value.reason, value.selection.error, ...value.cleanupErrors].filter(Boolean),
    "No findings or completed execution is not a clean-review claim.",
  ].join("\n\n"), { level: value.complete ? "info" : "error" });
  await parent.log(`P2 inspection: ${JSON.stringify(record)}`);
}
