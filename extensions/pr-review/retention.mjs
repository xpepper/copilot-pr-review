import { randomUUID } from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync,
  renameSync, unlinkSync, writeFileSync,
} from "node:fs";
import { basename, isAbsolute, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { formatFindings, minimumConfidence, reviewKey } from "./findings.mjs";
import { validatePreview } from "./preview.mjs";
import { selectionBinding } from "./selection.mjs";
import { publicationSummary, validatePublication } from "./publication.mjs";
import { blockingIssues, diagnosticKinds } from "./coverage.mjs";
import { isMinor, modeIds, reviewModes } from "./modes.mjs";

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
function attempt(value) {
  text(value.model);
  requireValue(["completed", "incomplete", "cancelled"].includes(value.status), "invalid reviewer state");
  for (const key of ["error", "reasoningEffort", "sessionId"]) if (value[key] !== undefined) text(value[key]);
  for (const key of ["startedAt", "completedAt"]) {
    if (value[key] !== undefined) requireValue(value[key] === null || Number.isFinite(value[key]), "invalid reviewer timing");
  }
  if (value.usage !== undefined) {
    requireValue(Array.isArray(value.usage), "invalid usage attribution");
    for (const usage of value.usage) {
      object(usage, [], ["model", "reasoningEffort", "isByok"]);
      if (usage.model !== undefined) text(usage.model);
      if (usage.reasoningEffort !== undefined) text(usage.reasoningEffort);
      requireValue(usage.isByok === undefined || typeof usage.isByok === "boolean", "invalid provider attribution");
    }
  }
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
function validation(value, target, policy) {
  object(value, ["complete", "findings", "rejected", "duplicates", "issues"], ["diagnostics", "capped"]);
  strings(value.issues);
  if (value.diagnostics !== undefined) {
    requireValue(Array.isArray(value.diagnostics), "expected coverage diagnostics");
    for (const entry of value.diagnostics) {
      object(entry, ["kind", "message"]);
      requireValue(diagnosticKinds.includes(entry.kind), "invalid diagnostic category");
      text(entry.message);
    }
    requireValue(isDeepStrictEqual(value.issues, blockingIssues(value.diagnostics)),
      "coverage diagnostics disagree with blocking issues");
  }
  requireValue(typeof value.complete === "boolean" && value.complete === (value.issues.length === 0) &&
    [value.findings, value.rejected, value.duplicates].every(Array.isArray), "invalid validation state");
  const ids = new Set();
  const candidates = new Set();
  for (const finding of value.findings) {
    object(finding, ["id", "reviewer", "title", "severity", "confidence", "location", "trigger",
      "expected", "actual", "introduction", "before", "after", "evidence", "reportedBy", "candidateIds",
      "validation"], ["breaks"]);
    for (const key of ["id", "reviewer", "title", "trigger", "expected", "actual", "introduction"]) text(finding[key]);
    requireValue(!ids.has(finding.id), "duplicate canonical finding ID");
    ids.add(finding.id);
    requireValue(policy.severities.includes(finding.severity) &&
      Number.isFinite(finding.confidence) && finding.confidence >= minimumConfidence &&
      finding.confidence <= 1, "severity or confidence outside this mode's findings policy");
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
    // The code a finding breaks is optional and unanchored, but it is still a
    // citation bound to this reviewed revision.
    if (finding.breaks !== undefined && finding.breaks !== null) citation(finding.breaks, target);
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
  // A withheld minor finding was adjudicated but is outside the mode's presented
  // findings policy, so it can never be selected or published.
  requireValue(value.capped === undefined || Array.isArray(value.capped), "expected withheld minor findings");
  for (const entry of value.capped ?? []) {
    object(entry, ["id", "severity", "title", "reason"]);
    text(entry.id); text(entry.title); text(entry.reason);
    requireValue(isMinor(policy, entry.severity) && !ids.has(entry.id) && !excluded.has(entry.id),
      "invalid withheld minor finding");
    excluded.add(entry.id);
  }
  requireValue(value.findings.filter((finding) => isMinor(policy, finding.severity)).length <= policy.minorCap,
    "presented minor findings exceed this mode's findings policy");
  requireValue([...candidates].every((id) => ids.has(id) || excluded.has(id)), "unaccounted duplicate alias");
}

// I1c: the first thing this record has ever held about an earlier review of the
// same pull request. I1a retained none of its discovery and I1b none of its
// confinement, on the rule that the increment which consumes something is the
// one that puts it in the schema; this is that increment, because a reply posted
// to a thread has to be journalled against the verdict it carries.
//
// It is an optional key rather than a new rung of `schemaVersion`. That ladder
// means one thing, the publication capability a record was written with, and
// each rung implies the one below it: 4 implies publication implies preview. A
// revalidation is orthogonal to all of it, so hanging it off that ladder would
// either break the nesting or overwrite what rung 4 already says.
// Every proof `codeVerdict` can reach, including the two that leave a finding
// unsettled. Omitting "touched" made any review that revalidated and settled
// less than everything throw when it journalled itself, which the deep review
// of #32 caught and every test here had missed by judging its unsettled
// entries away before retaining them.
const codeProofs = ["unchanged-head", "untouched", "anchor-unplaceable", "file-deleted",
  "path-moved", "touched", "no-range"];
const verdicts = ["resolved", "still-open", "obsolete", "unsettled"];

function revalidationEntry(value, judged) {
  object(value, ["commentId", "url", "path", "side", "outdated",
    "finding", "verdict", "proof", "decidedBy"], ["startLine", "endLine", "reason"]);
  requireValue(Number.isSafeInteger(value.commentId) && value.commentId > 0, "invalid revalidated comment ID");
  text(value.url); text(value.path);
  // The line pair is present together or not at all: a comment GitHub can no
  // longer place keeps the line it was written at, and one nothing can place
  // carries no anchor rather than half of one.
  requireValue(["head", "base"].includes(value.side) && typeof value.outdated === "boolean" &&
    (value.startLine === undefined) === (value.endLine === undefined) &&
    (value.endLine === undefined || (Number.isSafeInteger(value.startLine) && value.startLine > 0 &&
      Number.isSafeInteger(value.endLine) && value.endLine >= value.startLine)), "invalid revalidated anchor");
  object(value.finding, ["severity", "title", "trigger", "expected", "actual", "introduction",
    "confidence", "reportedBy"]);
  for (const key of ["severity", "title", "trigger", "expected", "actual", "introduction"]) text(value.finding[key]);
  requireValue(Number.isFinite(value.finding.confidence) &&
    value.finding.confidence >= minimumConfidence && value.finding.confidence <= 1,
  "invalid revalidated confidence");
  strings(value.finding.reportedBy);
  requireValue(value.finding.reportedBy.length, "revalidated finding without attribution");
  requireValue(verdicts.includes(value.verdict) && ["code", "model"].includes(value.decidedBy),
    "invalid revalidation verdict");
  // The two halves are kept apart in the record, because which of them decided a
  // verdict is the whole reason one of them can be trusted without a model.
  // Code proves that something still stands and never that it has gone away, so
  // "resolved" is the model's alone, and anything still unsettled is code's.
  if (value.decidedBy === "code") {
    requireValue(codeProofs.includes(value.proof) && value.reason === undefined,
      "invalid code-proved verdict");
    requireValue(value.verdict !== "resolved", "code claims to have proved a finding resolved");
  } else {
    requireValue(value.proof === "judged" && value.verdict !== "unsettled", "invalid judged verdict");
    text(value.reason);
    requireValue(judged?.status === "completed", "a judged verdict without a completed revalidation pass");
  }
}

function revalidation(value, target) {
  object(value, ["reviewedBefore", "head", "relationship", "basis", "review", "entries", "unreadable"],
    ["rangeError", "judged"]);
  requireValue(sha.test(value.reviewedBefore) && sha.test(value.head) && value.head === target.head,
    "revalidation is not bound to the reviewed head");
  requireValue(["same-head", "incremental", "diverged", "unknown"].includes(value.relationship) &&
    ["same-head", "range", "no-range"].includes(value.basis) &&
    (value.basis === "same-head") === (value.relationship === "same-head"), "invalid revalidation basis");
  if (value.rangeError !== undefined) text(value.rangeError);
  object(value.review, ["id", "url", "submittedAt", "head", "mode", "label", "declaredFindings"]);
  requireValue(Number.isSafeInteger(value.review.id) && value.review.id > 0 &&
    sha.test(value.review.head) && value.review.head === value.reviewedBefore &&
    modeIds.includes(value.review.mode) &&
    Number.isSafeInteger(value.review.declaredFindings) && value.review.declaredFindings >= 0,
  "invalid revalidated review");
  for (const key of ["url", "submittedAt", "label"]) text(value.review[key]);
  if (value.judged !== undefined) {
    object(value.judged, ["status"], ["reviewer", "asked", "decided", "ignored", "reason"]);
    requireValue(["completed", "failed"].includes(value.judged.status), "invalid revalidation pass state");
    if (value.judged.status === "failed") {
      text(value.judged.reason);
      requireValue(value.judged.decided === undefined, "a failed revalidation pass decided something");
    } else {
      requireValue([value.judged.asked, value.judged.decided, value.judged.ignored]
        .every((count) => Number.isSafeInteger(count) && count >= 0) &&
        value.judged.decided <= value.judged.asked, "invalid revalidation pass counts");
    }
    if (value.judged.reviewer !== undefined) text(value.judged.reviewer);
  }
  requireValue(Array.isArray(value.entries) && Array.isArray(value.unreadable), "invalid revalidation lists");
  const seen = new Set();
  for (const entry of value.entries) {
    revalidationEntry(entry, value.judged);
    requireValue(!seen.has(entry.commentId), "duplicate revalidated comment");
    seen.add(entry.commentId);
  }
  for (const entry of value.unreadable) {
    object(entry, ["commentId", "url", "path"]);
    requireValue(Number.isSafeInteger(entry.commentId) && entry.commentId > 0 && !seen.has(entry.commentId),
      "invalid unreadable prior comment");
    text(entry.url); text(entry.path);
    seen.add(entry.commentId);
  }
  requireValue(value.judged?.status !== "completed" ||
    value.judged.decided === value.entries.filter((entry) => entry.decidedBy === "model").length,
  "the revalidation pass count disagrees with the judged verdicts");
}

// The reply write set. It is the first thing in this record that journals more
// than one remote write, so partial completion is an ordinary state here rather
// than an error: some threads answered, at most one unknown, the rest never
// attempted. Every thread carries its own disposition, because "we wrote some of
// them" is not something a person can act on.
const dispositions = ["not-attempted", "in-flight", "written", "skipped", "failed", "uncertain"];

function replies(value, revalidation) {
  object(value, ["status", "attempted", "entries"], ["reason"]);
  requireValue(["not-attempted", "in-flight", "completed", "partial", "uncertain"].includes(value.status) &&
    typeof value.attempted === "boolean" && value.attempted === (value.status !== "not-attempted") &&
    Array.isArray(value.entries), "invalid reply write state");
  if (value.reason !== undefined) {
    text(value.reason);
    requireValue(!value.attempted, "an attempted reply set explains itself by its entries");
  }
  if (!value.attempted) {
    requireValue(value.entries.length === 0, "an unattempted reply set wrote to a thread");
    return;
  }
  requireValue(revalidation, "a reply set without the revalidation it answers");
  const answerable = new Map(revalidation.entries
    .filter((entry) => entry.verdict !== "unsettled").map((entry) => [entry.commentId, entry]));
  const seen = new Set();
  let unknown = 0;
  for (const entry of value.entries) {
    object(entry, ["commentId", "verdict", "disposition"], ["replyId", "url", "error", "reason"]);
    const answered = answerable.get(entry.commentId);
    requireValue(answered && answered.verdict === entry.verdict && !seen.has(entry.commentId),
      "a reply to a thread this run settled no verdict for");
    seen.add(entry.commentId);
    requireValue(dispositions.includes(entry.disposition), "unknown reply disposition");
    if (entry.disposition === "written") {
      requireValue(Number.isSafeInteger(entry.replyId) && entry.replyId > 0 && !entry.error, "invalid written reply");
      text(entry.url);
    } else {
      requireValue(entry.replyId === undefined && entry.url === undefined, "an unwritten reply carries a reply ID");
    }
    if (["failed", "uncertain"].includes(entry.disposition)) text(entry.error);
    if (entry.reason !== undefined) text(entry.reason);
    if (entry.disposition === "uncertain") unknown += 1;
  }
  // At most one unknown, because an unknown stops the set. Anything after it
  // stays unattempted rather than becoming a second unknown.
  requireValue(unknown <= 1, "more than one reply outcome is unknown");
  requireValue((value.status === "uncertain") === (unknown === 1), "reply status disagrees with its entries");
  const settled = value.entries.every((entry) => ["written", "skipped"].includes(entry.disposition));
  requireValue((value.status === "completed") === settled, "reply status disagrees with its entries");
}

const attemptKeys = ["model", "reasoningEffort", "sessionId", "status", "error", "usage", "startedAt", "completedAt"];
const reviewerKeys = ["label", ...attemptKeys, "fallbackFrom"];
const outcomeKeys = ["invocation", "binding", "mode", "noComment", "complete", "reviewComplete",
  "executionComplete", "coverage", "cancelled", "error", "cleanupErrors", "disposition", "reason", "selection",
  "preview", "publication", "revalidation", "replies"];

// Version 4 marks a record whose write came from the explicit publish-later
// command. Optional validation diagnostics do not change publication authority.
// Records without diagnostics stay readable and keep their original preview text.
const publicationSchemaVersion = (outcome) =>
  outcome.publication ? (outcome.publication.authority ? 4 : 3) : outcome.preview ? 2 : 1;

export function retainedRecord(outcome) {
  const result = pick(outcome, outcomeKeys);
  // A reviewer that fell back keeps the failed attempt, reduced to the same
  // fields, so the record never presents the fallback as the only thing that ran.
  const reviewerRecord = (reviewer) => {
    const record = pick(reviewer, reviewerKeys);
    if (reviewer.fallbackFrom) record.fallbackFrom = pick(reviewer.fallbackFrom, attemptKeys);
    return record;
  };
  result.reviewers = (outcome.reviewers ?? []).map(reviewerRecord);
  if (outcome.adjudicator) result.adjudicator = reviewerRecord(outcome.adjudicator);
  if (outcome.validation) {
    result.validation = {
      ...pick(outcome.validation, ["complete", "findings", "rejected", "issues", "diagnostics", "capped"]),
      duplicates: outcome.validation.duplicates.map((entry) => pick(entry, ["id", "duplicateOf", "reason"])),
    };
  }
  // Normalize optional undefined properties in selection/binding before schema checks.
  const clean = JSON.parse(JSON.stringify(result));
  return {
    schemaVersion: publicationSchemaVersion(clean), state: "settled", invocation: clean.invocation,
    outcome: clean, digest: reviewKey(clean),
  };
}

export function validateRecord(record, sessionId) {
  object(record, ["schemaVersion", "state", "invocation"], ["outcome", "digest"]);
  requireValue([1, 2, 3, 4].includes(record.schemaVersion) && ["pending", "settled"].includes(record.state), "unsupported schema/state");
  identity(record.invocation);
  requireValue(record.invocation.sessionId === sessionId, "wrong originating session");
  if (record.state === "pending") {
    requireValue(!Object.hasOwn(record, "outcome") && !Object.hasOwn(record, "digest"), "pending record contains a result");
    return record;
  }
  const value = record.outcome;
  object(value, ["invocation", "mode", "noComment", "complete", "reviewComplete", "executionComplete",
    "coverage", "cancelled", "cleanupErrors", "selection", "reviewers"],
  ["binding", "validation", "adjudicator", "error", "disposition", "reason", "revalidation", "replies",
    ...(record.schemaVersion >= 2 ? ["preview"] : []), ...(record.schemaVersion >= 3 ? ["publication"] : [])]);
  requireValue(record.digest === reviewKey(value) && isDeepStrictEqual(value.invocation, record.invocation),
    "record digest or invocation mismatch");
  const mode = modeIds.includes(value.mode) ? reviewModes[value.mode] : undefined;
  requireValue(mode !== undefined && typeof value.noComment === "boolean" &&
    (record.schemaVersion >= 2 || value.noComment === true), "unsupported mode/publication state");
  for (const key of ["complete", "reviewComplete", "executionComplete", "cancelled"]) {
    requireValue(typeof value[key] === "boolean", "invalid coverage flag");
  }
  strings(value.cleanupErrors);
  for (const key of ["error", "disposition", "reason"]) if (value[key] !== undefined) text(value[key]);
  requireValue(["completed", "incomplete", "not-started"].includes(value.coverage) &&
    value.complete === (value.coverage === "completed"), "inconsistent coverage");
  if (value.binding) binding(value.binding);
  if (value.revalidation) {
    requireValue(value.binding, "revalidation without a review binding");
    revalidation(value.revalidation, value.binding);
  }
  if (value.replies) replies(value.replies, value.revalidation);
  if (value.validation) {
    requireValue(value.binding, "validated result without review binding");
    validation(value.validation, value.binding, mode.policy);
  }
  requireValue(!value.complete || (value.reviewComplete && value.executionComplete && value.validation?.complete &&
    !value.cancelled && !value.error && !value.cleanupErrors.length), "false completed-coverage claim");
  requireValue(Array.isArray(value.reviewers), "missing reviewer coverage");
  for (const reviewer of [...value.reviewers, ...(value.adjudicator ? [value.adjudicator] : [])]) {
    object(reviewer, ["label", "model", "status"], reviewerKeys);
    text(reviewer.label);
    attempt(reviewer);
    if (reviewer.fallbackFrom !== undefined) {
      object(reviewer.fallbackFrom, ["model", "status"], attemptKeys);
      attempt(reviewer.fallbackFrom);
      // Only an explicit failure is eligible for a fallback, and a fallback is
      // never the assignment that just failed.
      requireValue(reviewer.fallbackFrom.status === "incomplete", "fallback replaced an attempt that had not failed");
      requireValue(reviewer.fallbackFrom.model !== reviewer.model ||
        reviewer.fallbackFrom.reasoningEffort !== reviewer.reasoningEffort, "fallback repeated the failed assignment");
    }
  }
  if (value.complete) requireValue(value.reviewers.length === mode.reviewers.length &&
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
    requireValue(value.binding && isDeepStrictEqual(selection.binding, selectionBinding(value)), "selection/review binding mismatch");
  }
  requireValue(selection.status !== "selected" || selection.binding, "unbound selection");
  requireValue(!value.cancelled || (!value.complete && selection.status === "cancelled" &&
    !selection.findingIds.length), "cancelled selection remains actionable");
  requireValue(selection.status !== "cancelled" || value.cancelled, "unrecorded cancellation");
  requireValue(selection.status !== "empty" || (value.validation && !ids.length), "false empty result");
  requireValue(selection.status !== "not-started" || !value.validation, "validation lost from selection state");
  if (record.schemaVersion >= 2) {
    requireValue(value.preview, "missing preview state");
    validatePreview(value);
  }
  if (record.schemaVersion >= 3) {
    validatePublication(value);
    requireValue((record.schemaVersion === 4) === (value.publication.authority !== undefined),
      "publish-later authorization does not match the record schema version");
  }
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
  // The session working directory only hosts gh; remote identity always comes
  // from the explicitly captured binding, never from this checkout.
  const cwd = metadata.workingDirectory;
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
  return { read, write, cwd };
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
    "This is the captured review, not a current-head check. This inspection did not rerun reviewers or publish anything.",
    value.preview ? `Proposal: ${value.preview.status}; historical authorized=${value.preview.authorized}. ` +
      "Not permission for later publication." : "Legacy P2 record: no posting authority or preview.",
    publicationSummary(value.publication),
    ...(value.publication?.authority ? ["This write was attempted by the later explicit publish command, " +
      `authorization ${value.publication.authority.invocationId}, not by this run's flags or configuration.`] : []),
    ...(value.publication?.cancelRequested ? ["Cancellation was requested after dispatch; it cannot undo a remote write."] : []),
    ...(value.preview?.request ? [JSON.stringify(value.preview.request, null, 2)] : []),
    formatFindings(value),
    ...value.reviewers.map((reviewer) => `${reviewer.label}: ${reviewer.status}${reviewer.error ? `; ${reviewer.error}` : ""}` +
      (reviewer.fallbackFrom ? ` (one configured fallback attempt on ${reviewer.model}, after ${reviewer.fallbackFrom.model} failed)` : "")),
    ...[value.error, value.reason, value.selection.error, value.preview?.error, value.publication?.error, ...value.cleanupErrors].filter(Boolean),
    "No findings or completed execution is not a clean-review claim.",
  ].join("\n\n"), { level: value.complete ? "info" : "error" });
  await parent.log(`P2 inspection: ${JSON.stringify(record)}`);
}
