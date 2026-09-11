export const diagnosticKinds = ["execution-failure", "coverage-gap", "caveat"];

export const blockingIssues = (diagnostics) =>
  diagnostics.filter((entry) => entry.kind !== "caveat").map((entry) => entry.message);

export function coverageDiagnostics(outcome) {
  const diagnostics = [...(outcome.validation?.diagnostics ??
    (outcome.validation?.issues ?? []).map((message) => ({
      kind: "coverage-gap", message: `Legacy unclassified issue (kept incomplete): ${message}`,
    })))];
  for (const reviewer of [...(outcome.reviewers ?? []), ...(outcome.adjudicator ? [outcome.adjudicator] : [])]) {
    // A reviewer its fallback recovered has complete coverage, but the attempt
    // that failed is still part of how this review was produced, so it is
    // reported rather than hidden by the recovery.
    if (reviewer.fallbackFrom) {
      const effort = (value) => value ?? "(not configurable)";
      diagnostics.push({ kind: "caveat", message:
        `${reviewer.label}: primary model=${reviewer.fallbackFrom.model} ` +
        `reasoning=${effort(reviewer.fallbackFrom.reasoningEffort)} failed ` +
        `(${reviewer.fallbackFrom.error}); the one configured fallback attempt, model=${reviewer.model} ` +
        `reasoning=${effort(reviewer.reasoningEffort)}, ` +
        `${reviewer.status === "completed" ? "completed this reviewer" : "also failed"}.` });
    }
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

const gapPattern = /^([^:]+): (.+) Blocked assessment: (.+)$/;
const stopWords = new Set([
  "after", "also", "and", "any", "are", "because", "been", "before", "being", "cannot", "could",
  "directly", "each", "for", "from", "into", "its", "not", "of", "only", "or", "such", "that", "the",
  "their", "these", "this", "through", "to", "was", "were", "whether", "with", "without", "would",
]);

function gapParts(message) {
  const match = gapPattern.exec(message);
  return match && { reporter: match[1], reason: match[2], impact: match[3] };
}

function gapTokens(value) {
  return new Set(value.toLowerCase()
    .replaceAll("compilation", "compile").replaceAll("compile-time", "compile")
    .replaceAll("dependencies", "dependency").replaceAll("failures", "failure")
    .replaceAll("imports", "import").replaceAll("expansions", "expansion")
    .match(/[a-z0-9_-]+/g)?.filter((token) => token.length > 2 && !stopWords.has(token)) ?? []);
}

function overlap(left, right) {
  const shared = [...left].filter((token) => right.has(token)).length;
  return (2 * shared) / (left.size + right.size);
}

// Two gaps are comparable only when they name the same code, and a reviewer names
// it either in backticks or bare. E1's real review produced a pair that named
// isModelUnavailableError without them, so a backtick-only rule showed one blocked
// assessment twice while its impact clauses overlapped 0.645 against the 0.35
// threshold. Only shapes ordinary prose does not have count as a bare name: an
// internal capital after a lowercase letter, or an underscore.
const identifierPattern =
  /`[^`]+`|\b[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\b|\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\b/g;

function namedIdentifiers(message) {
  return new Set(message.match(identifierPattern) ?? []);
}

function equivalentGaps(left, right) {
  const leftParts = gapParts(left.message);
  const rightParts = gapParts(right.message);
  if (!leftParts || !rightParts) return false;
  // Naming the same code is what makes two gaps comparable; it never decides that
  // they are the same gap. The impact clauses still have to agree.
  const sharesIdentifier = [...namedIdentifiers(left.message)]
    .some((identifier) => right.message.includes(identifier));
  return sharesIdentifier && overlap(gapTokens(leftParts.impact), gapTokens(rightParts.impact)) >= 0.35;
}

export function presentationDiagnostics(diagnostics) {
  const presented = [];
  for (const diagnostic of diagnostics) {
    if (diagnostic.kind !== "coverage-gap") {
      presented.push({ ...diagnostic, reports: 1 });
      continue;
    }
    const group = presented.find((entry) => entry.kind === "coverage-gap" && equivalentGaps(entry, diagnostic));
    if (!group) {
      const parts = gapParts(diagnostic.message);
      presented.push({ ...diagnostic, reports: 1, reporters: parts ? [parts.reporter] : [] });
      continue;
    }
    const parts = gapParts(diagnostic.message);
    group.reports += 1;
    if (parts && !group.reporters.includes(parts.reporter)) group.reporters.push(parts.reporter);
  }
  return presented;
}

export function formatCoverage(outcome) {
  const labels = {
    "execution-failure": "Execution failure",
    "coverage-gap": "Coverage gap",
    caveat: "Informational caveat",
  };
  const diagnostics = coverageDiagnostics(outcome);
  const presented = presentationDiagnostics(diagnostics);
  const count = (kind) => presented.filter((entry) => entry.kind === kind).length;
  const rawGapCount = diagnostics.filter((entry) => entry.kind === "coverage-gap").length;
  const gapCount = count("coverage-gap");
  const lines = presented.map((entry) => {
    if (entry.kind !== "coverage-gap" || entry.reports === 1) return `${labels[entry.kind]}: ${entry.message}`;
    const parts = gapParts(entry.message);
    return `Coverage gap (reported by ${entry.reporters.join(", ")}; ${entry.reports} reports): ` +
      `${parts.reason} Blocked assessment: ${parts.impact}`;
  });
  if (rawGapCount > gapCount) {
    lines.push("Equivalent specialist coverage gaps are consolidated for presentation; full diagnostics remain retained.");
  }
  return [
    `Review coverage: ${outcome.complete ? "completed" : outcome.coverage === "not-started" ? "not-started" : "INCOMPLETE"}.`,
    `Execution failures: ${count("execution-failure")}; coverage gaps: ${gapCount}` +
      `${rawGapCount > gapCount ? ` (${rawGapCount} reports)` : ""}; ` +
      `informational caveats: ${count("caveat")}.`,
    ...lines,
  ].join("\n");
}
