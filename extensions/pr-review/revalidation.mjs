import { commentBody } from "./preview.mjs";
import { reviewModes } from "./modes.mjs";

// I1c: reading this tool's own emitted comment prose back into a structured
// finding. I1a retained every inline comment of an earlier review with its body
// exactly as posted, and deliberately shipped no parser, because nothing there
// consumed one and a reading nothing checks is a reading nobody can trust. This
// is the increment that consumes it.
//
// The reader is held to the writer's template rather than to a guess about it.
// `commentBody` in preview.mjs builds every published finding, the pattern below
// is that same template with its six parts captured, and a parse is accepted
// only when rebuilding it reproduces the input byte for byte. An emitted body
// therefore always reads back, and a template change that forgot this parser
// fails the round-trip in the suite instead of misreading somebody's comment.

// Severities come from the mode table so the reader admits exactly what a
// published review may have written and never drifts from it. A prior review
// may have run in any mode, so the union across modes is the right vocabulary:
// this reads a comment, not a mode's findings policy.
const severities = [...new Set(Object.values(reviewModes).flatMap((mode) => mode.policy.severities))];

// Lazy field captures with literal separators, anchored at both ends. Anchoring
// is what makes the round-trip automatic for any match: a match consumes the
// whole body, so its parts can only reassemble into the body they came from.
const bodyPattern = new RegExp(
  `^\\[(${severities.join("|")})\\] ([\\s\\S]+?)` +
  "\\n\\nWhen: ([\\s\\S]+?)" +
  "\\n\\nExpected: ([\\s\\S]+?)" +
  "\\n\\nActual: ([\\s\\S]+?)" +
  "\\n\\nIntroduced by this diff: ([\\s\\S]+?)" +
  "\\n\\nConfidence: (0(?:\\.\\d+)?|1(?:\\.0+)?)\\. Reported by: ([^\\n]+)\\.$");

export function parseCommentFinding(body) {
  if (typeof body !== "string") return undefined;
  const match = bodyPattern.exec(body);
  if (!match) return undefined;
  const [, severity, title, trigger, expected, actual, introduction, confidence, reporters] = match;
  const reportedBy = reporters.split(", ");
  if (reportedBy.some((reporter) => !reporter.trim())) return undefined;
  const parsed = {
    severity, title, trigger, expected, actual, introduction,
    confidence: Number(confidence), reportedBy,
  };
  // The invariant, asserted rather than assumed. A parse that cannot rebuild
  // what it read is not a reading of this tool's output, whatever it matched.
  return commentBody(parsed) === body ? parsed : undefined;
}
