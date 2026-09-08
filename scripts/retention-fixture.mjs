import { randomUUID } from "node:crypto";
import { captureTarget, parseTargetArgs } from "../extensions/pr-review/target.mjs";
import { assembleContext } from "../extensions/pr-review/context.mjs";
import { reviewBinding } from "../extensions/pr-review/review.mjs";
import { adjudicateCandidates, collectCandidates, evidenceBoundary, reviewKey } from "../extensions/pr-review/findings.mjs";
import { selectFindings } from "../extensions/pr-review/selection.mjs";
import { reviewModes } from "../extensions/pr-review/modes.mjs";
import { respond, validationBaseSource, validationHeadSource } from "./target-fixture.mjs";

export async function retentionFixture(sessionId, {
  includeBoundary = false, reviewerLimitations = [], adjudicatorLimitations = [], mode = "quick",
} = {}) {
  const reviewMode = reviewModes[mode];
  const history = [];
  const gh = async (args, cwd) => {
    const response = respond(args, cwd, history);
    history.push({ args, cwd });
    return response;
  };
  const { snapshot } = await captureTarget(parseTargetArgs("12"), { cwd: "/controlled", gh });
  const context = await assembleContext(snapshot, { cwd: "/controlled", gh });
  const binding = reviewBinding(snapshot, context);
  const boundary = evidenceBoundary(snapshot, context, binding);
  const cite = (side, line = 3) => ({
    path: "total.js", side, startLine: line, endLine: line,
    quote: (side === "head" ? validationHeadSource : validationBaseSource).split("\n")[line - 1],
  });
  const candidate = {
    title: "Multiply cents by quantity", severity: "P2", confidence: 0.95,
    trigger: "total(100, 3)", expected: "300 cents", actual: "103 cents",
    introduction: "The changed operator adds quantity instead of multiplying.",
    location: cite("head"), before: cite("base"), after: cite("head"), evidence: [cite("head", 1)],
  };
  const reviewers = reviewMode.reviewers.map(({ label }) => ({
    label, model: "controlled-model", reasoningEffort: "high", status: "completed", sessionId: randomUUID(),
    usage: [{ model: "controlled-model", reasoningEffort: "high", isByok: false }],
    result: JSON.stringify({
      schemaVersion: 2, reviewKey: boundary.key, candidates: [candidate],
      limitations: label === "correctness" ? reviewerLimitations : [],
    }),
  }));
  const collected = collectCandidates(reviewers, boundary, reviewMode.policy);
  const adjudicator = {
    label: "evidence-validator", model: "controlled-model", status: "completed",
    result: JSON.stringify({
      schemaVersion: 2, reviewKey: boundary.key, limitations: adjudicatorLimitations,
      decisions: collected.candidates.map((entry, index) => ({
        candidateId: entry.id, verdict: index === 2 ? "reject" : "accept", allClaimsSupported: index !== 2,
        reason: "Controlled adjudication for retention plumbing, not live inference.",
        evidence: index === 2 ? [] : [cite("head", 1), cite("head")],
        duplicateOf: index === 1 ? collected.candidates[0].id : null,
      })),
    }),
  };
  const outcome = {
    invocation: { invocationId: randomUUID(), sessionId }, binding, mode, noComment: true,
    validation: adjudicateCandidates(collected, adjudicator, boundary, reviewMode.policy), reviewers, adjudicator,
    complete: true, reviewComplete: true, executionComplete: true, coverage: "completed",
    cancelled: false, cleanupErrors: [],
  };
  outcome.complete = outcome.reviewComplete = outcome.validation.complete;
  outcome.coverage = outcome.complete ? "completed" : "incomplete";
  outcome.selection = await selectFindings({ sessionId }, outcome, { all: true, controller: new AbortController() });
  return includeBoundary ? { outcome, boundary } : outcome;
}
