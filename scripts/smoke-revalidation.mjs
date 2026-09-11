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

// ---------------------------------------------------------------------------
// The code half: the verdicts this tool can prove without spending anything.

import { newRangeFrom } from "../extensions/pr-review/incremental.mjs";
import { revalidatePrior, revalidationCounts } from "../extensions/pr-review/revalidation.mjs";
import { blobSha, validationBaseSource, validationDiff, validationHeadSource } from "./target-fixture.mjs";

const priorHead = "1".repeat(40);
const head = "b".repeat(40);
let nextCommentId = 3948685115;

function priorComment(overrides = {}) {
  const id = (nextCommentId += 1);
  return {
    id, url: `https://github.com/fixture/repository/pull/7#discussion_r${id}`,
    path: "total.js", side: "RIGHT", startSide: undefined,
    line: 3, startLine: undefined, originalLine: 3, originalStartLine: undefined,
    outdated: false, commit: head, originalCommit: priorHead,
    body: commentBody(finding), ...overrides,
  };
}

const found = (relationship, comments, extra = {}) => ({
  status: "found", relationship,
  review: { id: 5130714400, head: priorHead, url: "https://example.invalid/r", mode: "deep",
    label: "Deep review", declaredFindings: comments.length, submittedAt: "2026-09-11T10:00:00Z" },
  comments, ...extra,
});

// The newer commits change total.js line 3 and nothing else.
const range = newRangeFrom(validationDiff, { priorHead, head, commits: 2 });

// Identical heads settle every comment at once and need no range at all: the
// reviewed head IS the head that review evaluated, so nothing has changed.
{
  const result = revalidatePrior(found("same-head", [priorComment(), priorComment({ path: "shipping.js", line: 3 })]), head);
  assert.equal(result.basis, "same-head");
  assert.deepEqual(result.entries.map((entry) => entry.verdict), ["still-open", "still-open"]);
  assert.deepEqual(result.entries.map((entry) => entry.proof), ["unchanged-head", "unchanged-head"]);
  assert(result.entries.every((entry) => entry.decidedBy === "code"));
  assert.deepEqual(revalidationCounts(result),
    { resolved: 0, stillOpen: 2, obsolete: 0, unsettled: 0, unreadable: 0 });
  console.log("PASS I1c identical heads prove every earlier finding still open, and cost nothing");
}

// A forward range proves two of the three: a comment on lines those commits did
// not touch is still open, and one on lines they did touch is not settled here.
{
  const untouched = priorComment({ path: "shipping.js", line: 3 });
  const touched = priorComment({ path: "total.js", line: 3 });
  const result = revalidatePrior(found("incremental", [untouched, touched]), head, { range });
  assert.equal(result.basis, "range");
  assert.deepEqual(result.entries.map((entry) => entry.verdict), ["still-open", "unsettled"]);
  assert.deepEqual(result.entries.map((entry) => entry.proof), ["untouched", "touched"]);
  assert.deepEqual(revalidationCounts(result),
    { resolved: 0, stillOpen: 1, obsolete: 0, unsettled: 1, unreadable: 0 });
  console.log("PASS I1c a forward range proves untouched findings still open and leaves touched ones unsettled");
}

// A multi-line anchor is touched when the commits changed any line it covers.
{
  const spanning = priorComment({ startLine: 1, line: 4 });
  const clear = priorComment({ startLine: 5, line: 8 });
  const result = revalidatePrior(found("incremental", [spanning, clear]), head, { range });
  assert.deepEqual(result.entries.map((entry) => entry.verdict), ["unsettled", "still-open"]);
  console.log("PASS I1c a multi-line anchor is touched when any line it covers was");
}

// GitHub nulls the line once an anchor has fallen out of the current diff, and
// that is the one thing a comment says about itself: the code it named is no
// longer where it was.
{
  const result = revalidatePrior(found("incremental",
    [priorComment({ outdated: true, line: undefined })]), head, { range });
  assert.equal(result.entries[0].verdict, "obsolete");
  assert.equal(result.entries[0].proof, "anchor-unplaceable");
  console.log("PASS I1c an anchor GitHub can no longer place is obsolete");
}

// A file the newer commits deleted has no head-side line left to be open at.
// A rename is not a deletion: the code moved, so the finding is not settled.
{
  const deletion = [
    "diff --git a/gone.js b/gone.js",
    `deleted file mode 100644`,
    `index ${blobSha(validationBaseSource)}..0000000 100644`,
    "--- a/gone.js", "+++ /dev/null", "@@ -1,2 +0,0 @@",
    "-const a = 1;", "-const b = 2;", "",
  ].join("\n");
  const renamed = [
    "diff --git a/old.js b/new.js",
    `index ${blobSha(validationBaseSource)}..${blobSha(validationHeadSource)} 100644`,
    "--- a/old.js", "+++ b/new.js", "@@ -1,1 +1,1 @@",
    "-const a = 1;", "+const a = 2;", "",
  ].join("\n");
  const wider = newRangeFrom(deletion + renamed, { priorHead, head, commits: 1 });
  const result = revalidatePrior(found("incremental", [
    priorComment({ path: "gone.js", line: 1 }),
    priorComment({ path: "old.js", line: 1 }),
  ]), head, { range: wider });
  assert.deepEqual(result.entries.map((entry) => entry.verdict), ["obsolete", "unsettled"]);
  assert.equal(result.entries[0].proof, "file-deleted");
  console.log("PASS I1c a deleted file is obsolete and a renamed one is not settled by the range");
}

// A base-side anchor names the captured base revision the comparison never saw,
// so the only thing a range establishes about one is that its file was never
// touched. That is the safe direction: prove still open, never prove resolved.
{
  const untouchedFile = priorComment({ path: "shipping.js", side: "LEFT", line: 2 });
  const touchedFile = priorComment({ path: "total.js", side: "LEFT", line: 2 });
  const result = revalidatePrior(found("incremental", [untouchedFile, touchedFile]), head, { range });
  assert.deepEqual(result.entries.map((entry) => entry.verdict), ["still-open", "unsettled"]);
  assert.deepEqual(result.entries.map((entry) => entry.side), ["base", "base"]);
  console.log("PASS I1c a base-side anchor is settled only by a file the commits never touched");
}

// Without a forward range nothing is provable either way, and the honest answer
// is that the code half settled none of them.
{
  for (const relationship of ["diverged", "unknown"]) {
    const result = revalidatePrior(found(relationship, [priorComment()]), head);
    assert.equal(result.basis, "no-range");
    assert.equal(result.entries[0].verdict, "unsettled");
    assert.equal(result.entries[0].proof, "no-range");
  }
  // An incremental relationship whose range could not be read reaches the same
  // place, for the same reason: nothing established the range.
  const unread = revalidatePrior(found("incremental", [priorComment()]), head, { error: "HTTP 404 Not Found" });
  assert.equal(unread.basis, "no-range");
  assert.equal(unread.rangeError, "HTTP 404 Not Found");
  assert.equal(unread.entries[0].verdict, "unsettled");
  console.log("PASS I1c no forward range settles nothing, and says that is why");
}

// A comment this tool cannot read back is not a finding it may judge. It is
// counted and named, never guessed at and never silently dropped.
{
  const result = revalidatePrior(found("same-head", [
    priorComment(),
    priorComment({ body: "Looks wrong to me, please check." }),
  ]), head);
  assert.equal(result.entries.length, 1);
  assert.equal(result.unreadable.length, 1);
  assert.equal(result.unreadable[0].path, "total.js");
  assert.deepEqual(revalidationCounts(result),
    { resolved: 0, stillOpen: 1, obsolete: 0, unsettled: 0, unreadable: 1 });
  console.log("PASS I1c a comment this tool cannot read back is named, not guessed at");
}

// Nothing to revalidate is not a verdict about anything.
{
  assert.equal(revalidatePrior({ status: "none", relationship: "none", comments: [] }, head), undefined);
  assert.equal(revalidatePrior({ status: "failed", relationship: "unknown", comments: [] }, head), undefined);
  const empty = revalidatePrior(found("same-head", []), head);
  assert.deepEqual(empty.entries, []);
  assert.deepEqual(revalidationCounts(empty),
    { resolved: 0, stillOpen: 0, obsolete: 0, unsettled: 0, unreadable: 0 });
  console.log("PASS I1c no prior review and no prior comment each revalidate nothing");
}
