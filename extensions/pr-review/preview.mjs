import { isDeepStrictEqual } from "node:util";
import {
  isOneLineSentence, minimumConfidence, opensCodeBlock, publishedProse, reviewKey,
} from "./findings.mjs";
import { reviewMode } from "./modes.mjs";
import { waitForInteraction } from "./interaction.mjs";
import { selectionBinding } from "./selection.mjs";
import { coverageDiagnostics, formatCoverage } from "./coverage.mjs";
import { summaryBody } from "./summary.mjs";

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

// The published shape of one finding, built in one place so the increment that
// reads it back reconstructs from the same template it was written with. I1c's
// parser rebuilds a parsed body with this function and requires byte equality,
// so the reader and the writer can never drift apart unnoticed.
//
// P7: the problem first and the fix prominent, with what justifies the finding
// (introduction, confidence, reporter) in a small footer. No field is dropped.
export function commentBody(finding) {
  const reporters = [...new Set(finding.reportedBy)];
  return [
    `**[${finding.severity}] ${oneLine(finding.title)}**`,
    finding.actual,
    `**When:** ${finding.trigger}\n**Expected:** ${finding.expected}`,
    // W1: a result retained before W1 has no remediation and still rebuilds its
    // request, so the paragraph stays optional here too.
    ...(finding.remediation === undefined ? [] : [`**Fix:** ${finding.remediation}`]),
    `<sub>Introduced by this diff: ${oneLine(finding.introduction)} · Confidence ${finding.confidence} · ` +
      `${reporters.join(", ")} ${reporters.length === 1 ? "reviewer" : "reviewers"}</sub>`,
  ].join("\n\n");
}

// A title and an introduction each sit on one rendered line, the title in bold
// and the introduction inside the footer's tag, so their whitespace folds.
function oneLine(text) {
  return text.replace(/\s+/g, " ").trim();
}

// P7: the shape `commentBody` wrote before P7, kept so that I1c still reads a
// comment published then and a proposal retained then still loads. It is never
// published again.
export function commentBodyBeforeP7(finding) {
  return [
    `[${finding.severity}] ${finding.title}`,
    `When: ${finding.trigger}`,
    `Expected: ${finding.expected}`,
    `Actual: ${finding.actual}`,
    `Introduced by this diff: ${finding.introduction}`,
    // W1: a finding carries its remediation sentence. A body published before
    // W1 has none, and I1c still has to rebuild that body byte for byte.
    ...(finding.remediation === undefined ? [] : [`Fix: ${finding.remediation}`]),
    `Confidence: ${finding.confidence}. Reported by: ${[...new Set(finding.reportedBy)].join(", ")}.`,
  ].join("\n\n");
}

function inlineComment(finding, binding, policy) {
  const location = finding.location;
  requirePreview(finding.validation?.kind === "source-grounded-model-adjudication" &&
    finding.validation.allClaimsSupported === true && policy.severities.includes(finding.severity) &&
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
    body: commentBody(finding),
  };
}

// Reconstruction on reload checks shape/binding, NOT the current GitHub head or diff.
export function reviewRequest(outcome) {
  const mode = reviewMode(outcome.mode);
  const findings = selectedFindings(outcome);
  const comments = findings.map((finding) => inlineComment(finding, outcome.binding, mode.policy));
  return {
    binding: selectionBinding(outcome),
    payload: {
      commit_id: outcome.binding.head, event: "COMMENT",
      // P6: a short summary for the pull request's author. `formatCoverage`
      // stays the terminal and retained presentation and is not published.
      body: summaryBody({
        mode: mode.id, head: outcome.binding.head, complete: outcome.complete,
        diagnostics: coverageDiagnostics(outcome),
        findings: findings.map((finding, index) => ({
          severity: finding.severity, title: finding.title, path: comments[index].path,
          startLine: finding.location.startLine, endLine: finding.location.endLine,
        })),
      }),
      comments,
    },
  };
}

// P6: the body `reviewRequest` built before P6, kept only to recognise a
// proposal retained by that version. It is never published again.
function bodyBeforeP6(outcome) {
  return `${reviewMode(outcome.mode).label}: ${selectedFindings(outcome).length} selected validated finding(s). ` +
    (outcome.validation.diagnostics === undefined
      ? `Review coverage: ${outcome.complete ? "completed" : "INCOMPLETE"}. `
      : `${formatCoverage(outcome)}\n`) +
    "This is not a clean-review claim.";
}

// A retained proposal matches the request rebuilt from its findings, or differs
// from it only as an earlier version's proposal does: inline comments written
// before P7, beside the summary or beside the body built before P6. An
// unreadable record refuses every later review in its session, so such a record
// has to keep loading.
export function matchesRetainedProposal(outcome, request) {
  const proposal = outcome.preview?.request;
  const findings = selectedFindings(outcome);
  const commentsBeforeP7 = request.payload.comments.map((comment, index) =>
    ({ ...comment, body: commentBodyBeforeP7(findings[index]) }));
  return [
    request.payload,
    { ...request.payload, comments: commentsBeforeP7 },
    { ...request.payload, body: bodyBeforeP6(outcome), comments: commentsBeforeP7 },
  ].some((payload) => isDeepStrictEqual(proposal, { ...request, payload }));
}

export function buildReviewPreview(outcome, boundary) {
  requirePreview(boundary?.key === reviewKey(outcome.binding), "captured evidence binding mismatch");
  const request = reviewRequest(outcome);
  for (const [index, finding] of selectedFindings(outcome).entries()) {
    // W1: every published finding carries its one-line remediation sentence. A
    // result retained before W1 still reloads, because reload rebuilds its request
    // through `reviewRequest`, but it is refused here rather than posted without.
    requirePreview(typeof finding.remediation === "string" && finding.remediation.trim() &&
      isOneLineSentence(finding.remediation), "finding carries no one-line remediation sentence");
    requirePreview(!publishedProse.some((key) => opensCodeBlock(finding[key])), "finding text opens a code block");
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
    const request = reviewRequest(outcome);
    expected.request = matchesRetainedProposal(outcome, request) ? preview.request : request;
  }
  requirePreview(isDeepStrictEqual(preview, expected), "incompatible schema or changed request");
}
