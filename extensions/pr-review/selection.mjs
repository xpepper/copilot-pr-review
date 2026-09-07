import { reviewKey } from "./findings.mjs";
import { waitForInteraction } from "./interaction.mjs";

export async function selectFindings(parent, outcome, { all = false, controller }) {
  const signal = controller.signal;
  const binding = outcome.binding ? {
    ...outcome.invocation,
    repository: structuredClone(outcome.binding.repository),
    number: outcome.binding.number, pullId: outcome.binding.pullId,
    head: outcome.binding.head, reviewKey: reviewKey(outcome.binding),
  } : undefined;
  const result = (status, findingIds = [], error) => ({ status, binding, findingIds, error });
  if (signal.aborted) return result("cancelled", [], String(signal.reason));
  if (!outcome.validation) return result("not-started");
  if (!binding?.invocationId || !binding.sessionId || binding.sessionId !== parent.sessionId) {
    throw new Error("Selection requires the originating invocation and session.");
  }
  const findings = outcome.validation.findings;
  const ids = findings.map((finding) => finding.id);
  if (ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) {
    throw new Error("Invalid validated finding identities; selection refused.");
  }
  if (!ids.length) return result("empty");
  if (all) return result("selected", ids);
  if (!parent.capabilities.ui?.elicitation) {
    return result("unavailable", [], "This host has no finding-selection UI. Nothing selected; rerun with --all to select all validated findings.");
  }
  // Opaque invocation-scoped values prevent a late/stale answer selecting reused candidate IDs.
  const choices = new Map(findings.map((finding) => [`${binding.invocationId}:${finding.id}`, finding.id]));
  const answer = await waitForInteraction(signal, () => parent.ui.elicitation({
    message: `Select findings for ${binding.repository.nameWithOwner}#${binding.number} at head ${binding.head}.\n` +
      `${outcome.complete ? "Completed" : "INCOMPLETE"} review coverage; this is not a clean-review claim.\n` +
      "Accept with no choices or decline to select none; cancel to cancel this run. Nothing will be published.",
    requestedSchema: {
      type: "object",
      properties: {
        findingIds: {
          type: "array", title: "Validated findings", default: [],
          items: { anyOf: findings.map((finding) => ({
            const: `${binding.invocationId}:${finding.id}`,
            title: `[${finding.severity}] ${finding.title} - ${finding.location.path}:` +
              `${finding.location.startLine}-${finding.location.endLine} (${finding.location.side}); confidence ${finding.confidence}`,
          })) },
        },
      },
      required: ["findingIds"],
    },
  }));
  if (parent.sessionId !== binding.sessionId || reviewKey(outcome.binding) !== binding.reviewKey ||
      outcome.invocation.invocationId !== binding.invocationId || outcome.invocation.sessionId !== binding.sessionId) {
    throw new Error("Selection binding changed while awaiting the answer; selection refused.");
  }
  if (answer?.action === "cancel") {
    controller.abort(new DOMException("Finding selection cancelled; no publication.", "AbortError"));
    return result("cancelled");
  }
  if (answer?.action === "decline") return result("none");
  const content = answer?.content;
  if (answer?.action !== "accept" || !content || Object.keys(content).length !== 1 ||
      !Array.isArray(content.findingIds) || content.findingIds.some((id) => !choices.has(id)) ||
      new Set(content.findingIds).size !== content.findingIds.length) {
    throw new Error("Invalid or unknown finding selection; nothing selected.");
  }
  const selected = new Set(content.findingIds.map((id) => choices.get(id)));
  return result(selected.size ? "selected" : "none", ids.filter((id) => selected.has(id)));
}

export async function finishSelection(parent, outcome, options, controller) {
  let selection;
  try {
    selection = await selectFindings(parent, outcome, { all: options.all, controller });
  } catch (error) {
    selection = {
      status: controller.signal.aborted ? "cancelled" : "failed",
      findingIds: [], error: String(error),
    };
  }
  const report = {
    ...outcome, selection, reviewComplete: outcome.complete,
  };
  const applyCancellation = () => {
    if (outcome.cancelled || controller.signal.aborted) {
      report.cancelled = true;
      report.complete = false;
      report.coverage = "incomplete";
      report.selection = { ...selection, status: "cancelled", findingIds: [] };
    }
  };
  applyCancellation();
  await parent.log(`Finding selection: ${report.selection.status}; ${report.selection.findingIds.length} selected. ` +
    `Review coverage: ${report.coverage}. Nothing was published; no result cache is retained. ` +
    `This is not a clean-review claim.${selection.error ? ` ${selection.error}` : ""}`,
  { level: ["failed", "unavailable", "cancelled"].includes(selection.status) ? "error" : "info" });
  applyCancellation();
  await parent.log(`P1 evidence: ${JSON.stringify({
    invocation: report.invocation, binding: report.binding, selection: report.selection,
    reviewComplete: report.reviewComplete, complete: report.complete, coverage: report.coverage,
    cancelled: report.cancelled, noComment: true, cleanupErrors: report.cleanupErrors,
  })}`);
  applyCancellation();
  return report;
}
