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

// ---------------------------------------------------------------------------
// The code half of the verdict, which runs in every review and spends nothing.
//
// It settles only what it can prove. "Still open" is provable: the commits
// added since that review did not touch the lines the comment anchors on, so
// the code it named is the code it named. "Obsolete" is provable: GitHub can no
// longer place the anchor, or those commits deleted the file outright. Anything
// else is left unsettled, because proving a defect fixed means reading the code
// and that is a judgment, not an arithmetic. The asymmetry is deliberate and is
// the same one `withinNewRange` keeps: prove that something still stands, never
// prove that it has gone away.

const sideOf = (comment) => (comment.side === "LEFT" ? "base" : "head");

// The anchor as the range's own coordinates see it. GitHub's `line` is already
// the comment's position in the current head's file, so a placeable comment
// needs no translation; `startLine` is absent for a single-line anchor.
const anchorOf = (comment) => ({
  side: sideOf(comment), path: comment.path,
  startLine: comment.startLine ?? comment.line, endLine: comment.line,
});

function codeVerdict(comment, relationship, range) {
  // GitHub nulls the line once an anchor has fallen out of the current diff.
  // That is the comment saying, about itself, that the code it named is no
  // longer where it was, and it holds whatever the relationship is.
  if (comment.outdated) return { verdict: "obsolete", proof: "anchor-unplaceable" };
  if (relationship === "same-head") return { verdict: "still-open", proof: "unchanged-head" };
  if (!range) return { verdict: "unsettled", proof: "no-range" };
  if (range.removed.has(comment.path)) return { verdict: "obsolete", proof: "file-deleted" };
  const anchor = anchorOf(comment);
  if (anchor.side !== "head") {
    // A base-side anchor names the captured base revision this comparison never
    // saw, so the only thing the range establishes about one is that its file
    // was never touched at all, on either side.
    return range.touched.has(anchor.path)
      ? { verdict: "unsettled", proof: "touched" } : { verdict: "still-open", proof: "untouched" };
  }
  const lines = range.changed.get(anchor.path);
  if (!lines) {
    // A path those commits touched but left with no head side at all was moved
    // away: a deletion is already obsolete above, so what is left is a rename,
    // and a rename moves code rather than removing it. Nothing is proved either
    // way, so nothing is claimed. A path they never touched is untouched.
    return range.touched.has(anchor.path)
      ? { verdict: "unsettled", proof: "path-moved" } : { verdict: "still-open", proof: "untouched" };
  }
  for (let line = anchor.startLine; line <= anchor.endLine; line++) {
    if (lines.has(line)) return { verdict: "unsettled", proof: "touched" };
  }
  return { verdict: "still-open", proof: "untouched" };
}

export function revalidatePrior(prior, head, read) {
  if (prior?.status !== "found") return undefined;
  const range = read?.range;
  const basis = prior.relationship === "same-head" ? "same-head" : range ? "range" : "no-range";
  const entries = [];
  const unreadable = [];
  for (const comment of prior.comments) {
    const finding = parseCommentFinding(comment.body);
    // A comment this tool cannot read back is not a finding it may judge. It is
    // named and counted rather than guessed at, exactly as an unparseable
    // reviewer envelope is: a reading nothing checks is worse than no reading.
    if (!finding) {
      unreadable.push({ commentId: comment.id, url: comment.url, path: comment.path });
      continue;
    }
    const anchor = anchorOf(comment);
    entries.push({
      commentId: comment.id, url: comment.url, path: comment.path, side: anchor.side,
      startLine: anchor.startLine, endLine: anchor.endLine, outdated: comment.outdated,
      finding, ...codeVerdict(comment, prior.relationship, range), decidedBy: "code",
    });
  }
  return {
    reviewedBefore: prior.review.head, head, relationship: prior.relationship, basis,
    ...(read?.error ? { rangeError: read.error } : {}),
    review: prior.review, entries, unreadable,
  };
}

export function revalidationCounts(result) {
  const count = (verdict) => result.entries.filter((entry) => entry.verdict === verdict).length;
  return {
    resolved: count("resolved"), stillOpen: count("still-open"), obsolete: count("obsolete"),
    unsettled: count("unsettled"), unreadable: result.unreadable.length,
  };
}
