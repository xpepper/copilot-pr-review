export const diagnosticKinds = ["execution-failure", "coverage-gap", "caveat"];

export const blockingIssues = (diagnostics) =>
  diagnostics.filter((entry) => entry.kind !== "caveat").map((entry) => entry.message);

export function coverageDiagnostics(outcome) {
  const diagnostics = [...(outcome.validation?.diagnostics ??
    (outcome.validation?.issues ?? []).map((message) => ({
      kind: "coverage-gap", message: `Legacy unclassified issue (kept incomplete): ${message}`,
    })))];
  for (const reviewer of [...(outcome.reviewers ?? []), ...(outcome.adjudicator ? [outcome.adjudicator] : [])]) {
    if (reviewer.status !== "completed" &&
        !diagnostics.some((entry) => entry.kind === "execution-failure" && entry.message.startsWith(`${reviewer.label}:`))) {
      diagnostics.push({
        kind: "execution-failure",
        message: `${reviewer.label}: ${reviewer.status}${reviewer.error ? `; ${reviewer.error}` : ""}`,
      });
    }
  }
  for (const message of [
    ...(outcome.cancelled ? ["Run cancelled; coverage remains incomplete."] : []),
    ...(outcome.error ? [outcome.error] : []),
    ...(outcome.cleanupErrors ?? []).map((error) => `Runtime cleanup: ${error}`),
  ]) diagnostics.push({ kind: "execution-failure", message });
  return diagnostics;
}

export function formatCoverage(outcome) {
  const labels = {
    "execution-failure": "Execution failure",
    "coverage-gap": "Coverage gap",
    caveat: "Informational caveat",
  };
  const diagnostics = coverageDiagnostics(outcome);
  const count = (kind) => diagnostics.filter((entry) => entry.kind === kind).length;
  return [
    `Review coverage: ${outcome.complete ? "completed" : outcome.coverage === "not-started" ? "not-started" : "INCOMPLETE"}.`,
    `Execution failures: ${count("execution-failure")}; coverage gaps: ${count("coverage-gap")}; ` +
      `informational caveats: ${count("caveat")}.`,
    ...diagnostics.map((entry) => `${labels[entry.kind]}: ${entry.message}`),
  ].join("\n");
}
