import assert from "node:assert/strict";
import { commentBody } from "../extensions/pr-review/preview.mjs";
import { parseCommentFinding } from "../extensions/pr-review/revalidation.mjs";

const finding = {
  severity: "P2", title: "Restore multiplication when calculating total cents",
  trigger: "any call with more than one unit",
  expected: "total is unit price multiplied by quantity",
  actual: "total is unit price added to quantity",
  introduction: "the changed line replaced * with +",
  confidence: 0.9, reportedBy: ["correctness", "overview"],
};

// The writer and the reader share one template, so the only parse this accepts
// is one that rebuilds the body it was given, byte for byte.
{
  const body = commentBody(finding);
  const parsed = parseCommentFinding(body);
  assert(parsed, "A body this tool emitted must read back");
  assert.deepEqual(parsed, {
    severity: "P2", title: finding.title, trigger: finding.trigger,
    expected: finding.expected, actual: finding.actual, introduction: finding.introduction,
    confidence: 0.9, reportedBy: ["correctness", "overview"],
  });
  assert.equal(commentBody({ ...parsed }), body, "The parse must rebuild the exact body");
  console.log("PASS I1c a published finding reads back into its parts");
}

// Every severity the mode table admits, and a single reporter, because a deep
// review reports one and a balanced one reports several.
{
  for (const severity of ["P0", "P1", "P2", "P3", "nit"]) {
    const body = commentBody({ ...finding, severity, reportedBy: ["integrated"] });
    const parsed = parseCommentFinding(body);
    assert.equal(parsed?.severity, severity);
    assert.deepEqual(parsed.reportedBy, ["integrated"]);
  }
  console.log("PASS I1c every published severity and a single reporter read back");
}

// Model prose is not single-paragraph by contract, and nothing in this tool ever
// required it to be, so a field carrying a blank line must survive the trip.
{
  const multiline = { ...finding, trigger: "any call with more than one unit.\n\nSeen in the fixture." };
  const parsed = parseCommentFinding(commentBody(multiline));
  assert.equal(parsed?.trigger, multiline.trigger, "A paragraph break inside a field is part of the field");
  console.log("PASS I1c a field carrying a blank line reads back whole");
}

// Confidence is a number in the record and a number again after the trip: a
// verdict that compared "0.9" with 0.9 would be reasoning about the rendering.
{
  for (const confidence of [0.8, 0.85, 0.95, 1]) {
    const parsed = parseCommentFinding(commentBody({ ...finding, confidence }));
    assert.equal(parsed?.confidence, confidence);
    assert.equal(typeof parsed.confidence, "number");
  }
  console.log("PASS I1c confidence reads back as the number it was written from");
}

// Anything that is not this tool's own emitted shape is unreadable, and
// unreadable is reported as itself rather than guessed at.
{
  const body = commentBody(finding);
  const refused = {
    "a hand-written comment": "This looks wrong to me, can you double check the multiplication?",
    "an empty body": "",
    "a missing label": body.replace("\n\nActual: ", "\n\n"),
    "a reordered label": body.replace("When: ", "Actual: ").replace("\n\nActual: total is unit", "\n\nWhen: total is unit"),
    "an unknown severity": body.replace("[P2]", "[P9]"),
    "a severity that is not bracketed": body.replace("[P2] ", "P2: "),
    "a non-numeric confidence": body.replace("Confidence: 0.9", "Confidence: high"),
    "no reporter at all": body.replace(" Reported by: correctness, overview.", " Reported by: ."),
    "trailing whitespace": `${body}\n`,
    "a leading quote": `> ${body}`,
    "single newlines between the parts": body.replaceAll("\n\n", "\n"),
    "an empty title": body.replace(`[P2] ${finding.title}`, "[P2] "),
  };
  for (const [what, value] of Object.entries(refused)) {
    assert.equal(parseCommentFinding(value), undefined, `${what} must not read as a finding`);
  }
  assert.equal(parseCommentFinding(undefined), undefined);
  assert.equal(parseCommentFinding(42), undefined);
  console.log("PASS I1c anything but this tool's own emitted shape is unreadable");
}

// The parse is the reader's half of a contract the writer owns. If the emitted
// template ever changes without this parser changing with it, the round-trip is
// what says so, and it says so here rather than on somebody's pull request.
{
  const parsed = parseCommentFinding(commentBody(finding));
  assert.equal(commentBody(parsed), commentBody(finding),
    "The parser and the emitter must stay one template");
  console.log("PASS I1c the parser and the emitter are held to one template");
}
