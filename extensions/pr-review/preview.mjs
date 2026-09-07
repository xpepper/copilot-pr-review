import { isDeepStrictEqual } from "node:util";
import { minimumConfidence, reviewKey } from "./findings.mjs";
import { waitForInteraction } from "./interaction.mjs";
import { selectionBinding } from "./selection.mjs";
import { formatCoverage } from "./coverage.mjs";

const authorizedStatuses = ["flag-authorized", "config-authorized", "confirmed"];

export function postingAuthority({ comment = false, noComment = false } = {}, { autoPostReviews = false } = {}) {
  if ([comment, noComment, autoPostReviews].some((value) => typeof value !== "boolean")) {
    throw new Error("Posting settings must be booleans.");
  }
  if (comment && noComment) throw new Error("Conflicting posting flags: --comment and --no-comment.");
  const status = noComment ? "suppressed" : comment ? "flag-authorized"
    : autoPostReviews ? "config-authorized" : "confirmation-required";
  return {
    policy: { comment, noComment, autoPostReviews }, status,
    authorized: authorizedStatuses.includes(status), submitted: false,
  };
}

function requirePreview(condition, message) {
  if (!condition) throw new Error(`Invalid review preview: ${message}.`);
}

function selectedFindings(outcome) {
  const { invocation, binding, selection, validation } = outcome;
  requirePreview(invocation?.invocationId && invocation.sessionId && binding &&
    isDeepStrictEqual(selection?.binding, selectionBinding(outcome)), "selection/review binding mismatch");
  requirePreview(!outcome.cancelled && selection.status === "selected" &&
    Array.isArray(selection.findingIds) && selection.findingIds.length &&
    new Set(selection.findingIds).size === selection.findingIds.length &&
    Array.isArray(validation?.findings), "no actionable canonical selection");
  const ids = validation.findings.map((finding) => finding.id);
  requirePreview(ids.every((id) => typeof id === "string" && id) && new Set(ids).size === ids.length &&
    selection.findingIds.every((id) => ids.includes(id)), "unknown or duplicate canonical finding ID");
  const selected = validation.findings.filter((finding) => selection.findingIds.includes(finding.id));
  requirePreview(isDeepStrictEqual(selected.map((finding) => finding.id), selection.findingIds),
    "selection is not in canonical order");
  return selected;
}

function inlineComment(finding, binding) {
  const location = finding.location;
  requirePreview(finding.validation?.kind === "source-grounded-model-adjudication" &&
    finding.validation.allClaimsSupported === true && ["P0", "P1", "P2"].includes(finding.severity) &&
    Number.isFinite(finding.confidence) && finding.confidence >= minimumConfidence && finding.confidence <= 1,
  "finding is not validated");
  requirePreview(location && ["head", "base"].includes(location.side) &&
    Number.isSafeInteger(location.startLine) && location.startLine > 0 &&
    Number.isSafeInteger(location.endLine) && location.endLine >= location.startLine &&
    location.endLine - location.startLine <= 9 && location.ref === binding[location.side],
  "invalid inline range or revision");
  const files = binding.paths.filter((file) => file.sources.some((source) =>
    source.path === location.path && source.side === location.side &&
    source.ref === location.ref && source.blobSha === location.blobSha));
  requirePreview(files.length === 1 && files[0].path, "ambiguous or missing inline source provenance");
  for (const key of ["title", "trigger", "expected", "actual", "introduction"]) {
    requirePreview(typeof finding[key] === "string" && finding[key].trim(), "missing finding text");
  }
  requirePreview(Array.isArray(finding.reportedBy) && finding.reportedBy.length, "missing attribution");
  const side = location.side === "head" ? "RIGHT" : "LEFT";
  return {
    path: files[0].path,
    line: location.endLine, side,
    ...(location.startLine !== location.endLine ? { start_line: location.startLine, start_side: side } : {}),
    body: [
      `[${finding.severity}] ${finding.title}`,
      `When: ${finding.trigger}`,
      `Expected: ${finding.expected}`,
      `Actual: ${finding.actual}`,
      `Introduced by this diff: ${finding.introduction}`,
      `Confidence: ${finding.confidence}. Reported by: ${[...new Set(finding.reportedBy)].join(", ")}.`,
    ].join("\n\n"),
  };
}

// Reconstruction on reload checks shape/binding, NOT the current GitHub head or diff.
export function reviewRequest(outcome) {
  const findings = selectedFindings(outcome);
  return {
    binding: selectionBinding(outcome),
    payload: {
      commit_id: outcome.binding.head, event: "COMMENT",
      body: `Quick review: ${findings.length} selected validated finding(s). ` +
        (outcome.validation.diagnostics === undefined
          ? `Review coverage: ${outcome.complete ? "completed" : "INCOMPLETE"}. `
          : `${formatCoverage(outcome)}\n`) +
        "This is not a clean-review claim.",
      comments: findings.map((finding) => inlineComment(finding, outcome.binding)),
    },
  };
}

export function buildReviewPreview(outcome, boundary) {
  requirePreview(boundary?.key === reviewKey(outcome.binding), "captured evidence binding mismatch");
  const request = reviewRequest(outcome);
  for (const [index, finding] of selectedFindings(outcome).entries()) {
    const { ref, blobSha, ...citation } = finding.location;
    requirePreview(isDeepStrictEqual(boundary.cite(citation), finding.location), "changed source citation");
    const file = boundary.files.find((entry) =>
      (citation.side === "head" ? entry.newPath : entry.oldPath) === citation.path);
    requirePreview(file && request.payload.comments[index].path === (file.newPath ?? file.oldPath) &&
      file.changed[citation.side].some((line) => line >= citation.startLine && line <= citation.endLine) &&
      file.hunks.some((hunk) => {
        const start = citation.side === "head" ? hunk.newStart : hunk.oldStart;
        const length = citation.side === "head" ? hunk.newLines : hunk.oldLines;
        return citation.startLine >= start && citation.endLine < start + length;
      }), "location is not a valid captured diff anchor");
  }
  return request;
}

export function cancelPreview(outcome) {
  outcome.cancelled = true;
  outcome.complete = false;
  outcome.coverage = "incomplete";
  outcome.selection = { ...outcome.selection, status: "cancelled", findingIds: [] };
  if (outcome.preview) outcome.preview = {
    policy: outcome.preview.policy, status: "cancelled", authorized: false, submitted: false,
  };
}

export async function finishPreview(parent, outcome, options, controller, boundary, effectiveConfig) {
  const initial = postingAuthority(options, effectiveConfig);
  const inputKey = reviewKey(outcome);
  let preview = { ...initial, status: "not-started", authorized: false };
  const guard = () => {
    controller.signal.throwIfAborted();
    requirePreview(parent.sessionId === outcome.invocation.sessionId && reviewKey(outcome) === inputKey,
      "originating session or review changed during preview");
  };
  try {
    guard();
    if (outcome.cancelled) preview.status = "cancelled";
    else if (!outcome.validation) preview.status = "not-started";
    else if (outcome.selection.status !== "selected") {
      preview.status = outcome.selection.status === "empty" ? "empty" : "not-selected";
    } else {
      const request = buildReviewPreview(outcome, boundary);
      preview = { ...initial, request };
      await parent.log("COMMENT review payload proposal - submission requires authority and fresh publication gates; no safeguards.\n" +
        `Posting authority: ${preview.status}. Review coverage: ${outcome.coverage}.\n` +
        JSON.stringify(request, null, 2));
      guard();
      if (preview.status === "confirmation-required") {
        if (!parent.capabilities.ui?.elicitation) {
          preview.status = "unavailable";
          preview.error = "This host has no final-confirmation UI. The proposed review is not authorized.";
        } else {
          const answer = await waitForInteraction(controller.signal, () => parent.ui.elicitation({
            message: `Authorize this exact COMMENT review proposal for ${request.binding.repository.nameWithOwner}` +
              `#${request.binding.number} at head ${request.binding.head}?\n` +
              `${request.payload.comments.length} selected finding(s).\n${formatCoverage(outcome)}\n` +
              "Acceptance authorizes publication after fresh head/lifecycle/anchor checks. This does not authorize safeguards.",
            requestedSchema: {
              type: "object",
              properties: { authorize: { type: "boolean", title: "Authorize the displayed review proposal", default: false } },
              required: ["authorize"],
            },
          }));
          guard();
          if (answer?.action === "cancel") {
            controller.abort(new DOMException("Review confirmation cancelled; no publication.", "AbortError"));
            controller.signal.throwIfAborted();
          }
          if (answer?.action === "decline") preview.status = "declined";
          else {
            requirePreview(answer?.action === "accept" && answer.content &&
              Object.keys(answer.content).length === 1 && typeof answer.content.authorize === "boolean",
            "invalid final-confirmation answer");
            preview.status = answer.content.authorize ? "confirmed" : "declined";
          }
        }
      }
      preview.authorized = authorizedStatuses.includes(preview.status);
    }
  } catch (error) {
    preview = {
      policy: initial.policy, status: controller.signal.aborted ? "cancelled" : "failed",
      authorized: false, submitted: false, error: String(error),
    };
  }
  const report = { ...outcome, preview };
  if (outcome.cancelled || controller.signal.aborted) cancelPreview(report);
  await parent.log(`Review proposal: ${report.preview.status}; authorized=${report.preview.authorized}; submitted=false. ` +
    `Selection: ${report.selection.status}; coverage: ${report.coverage}. No write has been attempted yet. ` +
    `Retained authority is historical, not permission for a later run.${report.preview.error ? ` ${report.preview.error}` : ""}`,
  { level: ["failed", "unavailable", "cancelled"].includes(report.preview.status) ? "error" : "info" });
  if (outcome.cancelled || controller.signal.aborted) cancelPreview(report);
  return report;
}

export function validatePreview(outcome) {
  const preview = outcome.preview;
  requirePreview(preview && typeof preview === "object" && !Array.isArray(preview), "missing preview state");
  const initial = postingAuthority(preview.policy, preview.policy);
  requirePreview(isDeepStrictEqual(preview.policy, initial.policy) &&
    preview.policy.noComment === outcome.noComment && preview.submitted === false &&
    preview.authorized === authorizedStatuses.includes(preview.status), "inconsistent posting state");
  const expected = { policy: initial.policy, status: preview.status, authorized: preview.authorized, submitted: false };
  if (preview.error !== undefined) {
    requirePreview(typeof preview.error === "string" && preview.error.trim(), "invalid preview error");
    expected.error = preview.error;
  }
  if (["cancelled", "failed"].includes(preview.status)) {
    requirePreview(preview.status === "cancelled" ? outcome.cancelled : !outcome.cancelled && preview.error,
      "unrecorded cancellation/failure");
  } else if (preview.status === "not-started") {
    requirePreview(!outcome.cancelled && !outcome.validation, "false not-started preview");
  } else if (["empty", "not-selected"].includes(preview.status)) {
    requirePreview(!outcome.cancelled && outcome.validation &&
      (preview.status === "empty" ? outcome.selection.status === "empty"
        : ["none", "unavailable", "failed"].includes(outcome.selection.status)), "false empty selection");
  } else {
    requirePreview(initial.status === "confirmation-required"
      ? ["confirmed", "declined", "unavailable"].includes(preview.status)
      : preview.status === initial.status, "authority does not follow posting policy");
    expected.request = reviewRequest(outcome);
  }
  requirePreview(isDeepStrictEqual(preview, expected), "incompatible schema or changed request");
}
