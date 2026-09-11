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

// ---------------------------------------------------------------------------
// The paid half: one model pass, asked only about what the code half could not
// settle, and never able to overturn what it could.

import { outputEnd, outputStart } from "../extensions/pr-review/findings.mjs";
import {
  applyJudgedVerdicts, describeRevalidation, retainedRevalidation, revalidateFlag,
  revalidationInstructions, revalidationPrompt, revalidationSummary, unsettledEntries,
} from "../extensions/pr-review/revalidation.mjs";

const key = "fixture-review-key";
const envelope = (payload) => `${outputStart}\n${JSON.stringify(payload)}\n${outputEnd}`;
const judged = (verdicts, overrides = {}) => ({
  label: "revalidator", status: "completed",
  result: envelope({ schemaVersion: 2, reviewKey: key, verdicts, limitations: [] }),
  ...overrides,
});

// The three files the range settles differently, so one result carries a
// code-proved still-open, a code-proved obsolete and two unsettled entries.
function mixed() {
  return revalidatePrior(found("incremental", [
    priorComment({ path: "shipping.js", line: 3 }),
    priorComment({ outdated: true, line: undefined }),
    priorComment({ path: "total.js", line: 3 }),
    priorComment({ path: "total.js", line: 3 }),
  ]), head, { range });
}

{
  assert.equal(revalidateFlag, "--revalidate");
  const instructions = revalidationInstructions();
  for (const word of ["resolved", "still-open", "obsolete"]) {
    assert(instructions.includes(`"${word}"`), `The contract must name ${word}`);
  }
  assert.match(instructions, /never generate new findings|not generate new findings/i);
  assert(instructions.includes(outputStart) && instructions.includes(outputEnd),
    "The pass uses the same marker contract every other structured output does");
  console.log("PASS I1c the revalidation contract names the three verdicts and forbids new findings");
}

// Only the unsettled entries are put to the model. Paying to judge a finding
// whose verdict is already proved is exactly what the code half exists to avoid.
{
  const result = mixed();
  const unsettled = unsettledEntries(result);
  assert.equal(unsettled.length, 2);
  const prompt = revalidationPrompt(result, key);
  assert(prompt.includes(key), "The prompt carries the review key the envelope must echo");
  for (const entry of unsettled) assert(prompt.includes(String(entry.commentId)));
  const settled = result.entries.filter((entry) => entry.verdict !== "unsettled");
  for (const entry of settled) {
    assert(!prompt.includes(String(entry.commentId)), "A proved verdict is never put to the model");
  }
  assert(prompt.includes(finding.title), "The model is given the finding it is judging");
  assert(prompt.includes(finding.trigger) && prompt.includes(finding.expected),
    "and every part of it, because a verdict on a title alone is a guess");
  console.log("PASS I1c only the unsettled findings are put to the model, with their whole text");
}

// A judged verdict replaces the unsettled one and says a model decided it.
{
  const result = mixed();
  const [first, second] = unsettledEntries(result);
  const applied = applyJudgedVerdicts(result, judged([
    { commentId: first.commentId, verdict: "resolved", reason: "the multiplication is restored at line 3" },
    { commentId: second.commentId, verdict: "still-open", reason: "the addition is still there" },
  ]), key);
  assert.equal(applied.judged.status, "completed");
  assert.equal(applied.judged.decided, 2);
  const byId = new Map(applied.entries.map((entry) => [entry.commentId, entry]));
  assert.equal(byId.get(first.commentId).verdict, "resolved");
  assert.equal(byId.get(first.commentId).decidedBy, "model");
  assert.equal(byId.get(first.commentId).reason, "the multiplication is restored at line 3");
  assert.equal(byId.get(second.commentId).verdict, "still-open");
  assert.deepEqual(revalidationCounts(applied),
    { resolved: 1, stillOpen: 2, obsolete: 1, unsettled: 0, unreadable: 0 });
  console.log("PASS I1c a judged verdict replaces the unsettled one and records that a model decided it");
}

// A code-proved verdict is not the model's to change. The proof stands.
{
  const result = mixed();
  const proved = result.entries.find((entry) => entry.verdict === "still-open");
  const applied = applyJudgedVerdicts(result, judged([
    { commentId: proved.commentId, verdict: "resolved", reason: "I think this one is fine now" },
  ]), key);
  const after = applied.entries.find((entry) => entry.commentId === proved.commentId);
  assert.equal(after.verdict, "still-open", "A proved verdict is not the model's to overturn");
  assert.equal(after.decidedBy, "code");
  assert.equal(applied.judged.decided, 0);
  assert(applied.judged.ignored.some((entry) => entry.commentId === proved.commentId));
  console.log("PASS I1c a verdict the code proved is not the model's to overturn");
}

// A verdict for something that was never asked about, and a word that is not a
// verdict, are both ignored rather than trusted.
{
  const result = mixed();
  const [first] = unsettledEntries(result);
  const applied = applyJudgedVerdicts(result, judged([
    { commentId: 999999, verdict: "resolved", reason: "about nothing in this run" },
    { commentId: first.commentId, verdict: "probably-fine", reason: "not one of the three" },
  ]), key);
  assert.equal(applied.judged.decided, 0);
  assert.equal(applied.judged.ignored.length, 2);
  assert(applied.entries.every((entry) => entry.decidedBy === "code"));
  assert.deepEqual(revalidationCounts(applied),
    { resolved: 0, stillOpen: 1, obsolete: 1, unsettled: 2, unreadable: 0 });
  console.log("PASS I1c an unknown comment and an invalid verdict are ignored, never trusted");
}

// A pass that did not complete, or whose envelope will not parse, leaves every
// unsettled verdict unsettled and says why. It is a failure of the revalidation
// and never of the review.
{
  const result = mixed();
  for (const [what, reviewer] of Object.entries({
    incomplete: { label: "revalidator", status: "incomplete", error: "transport closed" },
    unparseable: judged([], { result: "I had a look and they seem fine" }),
    "wrong binding": { label: "revalidator", status: "completed",
      result: envelope({ schemaVersion: 2, reviewKey: "another-review", verdicts: [], limitations: [] }) },
  })) {
    const applied = applyJudgedVerdicts(result, reviewer, key);
    assert.equal(applied.judged.status, "failed", `${what} must fail the pass`);
    assert(applied.judged.reason, `${what} must say why`);
    assert.equal(revalidationCounts(applied).unsettled, 2, `${what} must settle nothing`);
    assert.equal(revalidationCounts(applied).stillOpen, 1, `${what} must lose no proved verdict`);
  }
  console.log("PASS I1c a revalidation pass that fails settles nothing and loses no proved verdict");
}

// A finding the model was asked about and said nothing about stays unsettled.
{
  const result = mixed();
  const [first] = unsettledEntries(result);
  const applied = applyJudgedVerdicts(result, judged([
    { commentId: first.commentId, verdict: "obsolete", reason: "the function was removed entirely" },
  ]), key);
  assert.equal(applied.judged.decided, 1);
  assert.equal(revalidationCounts(applied).unsettled, 1, "Silence about a finding is not a verdict on it");
  assert.equal(revalidationCounts(applied).obsolete, 2);
  console.log("PASS I1c silence about a finding leaves it unsettled");
}

// What the run prints, and what the evidence line carries.
{
  const before = mixed();
  const applied = applyJudgedVerdicts(before, judged(unsettledEntries(before).map((entry) => ({
    commentId: entry.commentId, verdict: "resolved", reason: "fixed on the newer commits",
  }))), key);
  const described = describeRevalidation(applied, false);
  assert.match(described, /2 resolved/);
  assert.match(described, /1 still open/);
  assert.match(described, /1 obsolete/);
  assert.match(described, /earlier review/i);
  const summary = revalidationSummary(applied);
  assert.equal(summary.counts.resolved, 2);
  assert.equal(summary.basis, "range");
  assert.equal(summary.reviewedBefore, priorHead);
  assert(!JSON.stringify(summary).includes(finding.trigger),
    "Comment prose stays out of the evidence line, as every other captured prose does");
  // Without the flag the run says plainly that it judged nothing and why.
  const unasked = describeRevalidation(mixed(), false);
  assert.match(unasked, new RegExp(revalidateFlag));
  assert.match(unasked, /2 not settled/);
  console.log("PASS I1c the run states the verdicts, and states what it did not settle");
}

// ---------------------------------------------------------------------------
// The retained record, which is where this increment's schema change lands.
// I1a retained none of its discovery and I1b none of its confinement, on the
// rule that the increment which consumes something is the one that retains it.

import { retainedRecord, validateRecord } from "../extensions/pr-review/retention.mjs";
import { retentionFixture } from "./retention-fixture.mjs";
import { randomUUID } from "node:crypto";

const sessionId = randomUUID();
const base = await retentionFixture(sessionId);

function retained(revalidation) {
  return retainedRecord({ ...base, revalidation });
}

// A record carrying the verdicts round-trips through the strict validator, and
// the finding text is retained rather than the body, because the body rebuilds
// from it exactly and two copies of one thing can disagree.
{
  const before = mixed();
  before.head = base.binding.head;
  const applied = applyJudgedVerdicts(before, judged(unsettledEntries(before).map((entry) => ({
    commentId: entry.commentId, verdict: "resolved", reason: "restored on the newer commits",
  }))), key);
  const record = retained(retainedRevalidation(applied));
  validateRecord(record, sessionId);
  assert.equal(record.outcome.revalidation.entries.length, 4);
  assert.equal(record.outcome.revalidation.judged.decided, 2);
  const kept = record.outcome.revalidation.entries[0];
  assert.equal(commentBody(kept.finding), commentBody(finding),
    "The published body rebuilds from what the record keeps");
  assert(!JSON.stringify(record).includes('"body"'), "The record keeps the finding, not a second copy of the body");
  console.log("PASS I1c the retained record carries the verdicts and the findings they are about");
}

// Every cross-check the record makes about a verdict, each tested by breaking it.
{
  const before = mixed();
  before.head = base.binding.head;
  const applied = applyJudgedVerdicts(before, judged(unsettledEntries(before).map((entry) => ({
    commentId: entry.commentId, verdict: "still-open", reason: "unchanged in the current code",
  }))), key);
  const good = retainedRevalidation(applied);
  const broken = {
    "code proving a finding resolved": (value) => {
      const entry = value.entries.find((one) => one.decidedBy === "code");
      entry.verdict = "resolved";
    },
    "a judged verdict with no pass behind it": (value) => { delete value.judged; },
    "a judged verdict left unsettled": (value) => {
      value.entries.find((one) => one.decidedBy === "model").verdict = "unsettled";
    },
    "a judged verdict with no reason": (value) => {
      delete value.entries.find((one) => one.decidedBy === "model").reason;
    },
    "a code verdict carrying a model's proof": (value) => {
      value.entries.find((one) => one.decidedBy === "code").proof = "judged";
    },
    "a pass count disagreeing with the verdicts": (value) => { value.judged.decided = 1; },
    "a failed pass that decided something": (value) => {
      value.judged = { status: "failed", reason: "transport closed", decided: 2 };
    },
    "a basis disagreeing with the relationship": (value) => { value.basis = "same-head"; },
    "a revalidation of another head": (value) => { value.head = "9".repeat(40); },
    "a review head disagreeing with the revalidated one": (value) => { value.review.head = "9".repeat(40); },
    "a duplicate comment": (value) => { value.entries[1].commentId = value.entries[0].commentId; },
    "an unknown verdict": (value) => { value.entries[0].verdict = "probably-fine"; },
    "an unknown proof": (value) => { value.entries[0].proof = "vibes"; },
    "a confidence outside the findings policy": (value) => { value.entries[0].finding.confidence = 0.1; },
    "an extra field": (value) => { value.entries[0].note = "something"; },
  };
  for (const [what, breakIt] of Object.entries(broken)) {
    const value = structuredClone(good);
    breakIt(value);
    assert.throws(() => validateRecord(retained(value), sessionId), /Invalid retained result/,
      `${what} must not survive the strict validator`);
  }
  validateRecord(retained(structuredClone(good)), sessionId);
  console.log("PASS I1c the retained verdicts survive only when every cross-check holds");
}

// A comment this tool could not read back is retained as unreadable, and never
// as a finding with a guessed verdict.
{
  const result = revalidatePrior(found("same-head", [
    priorComment(), priorComment({ body: "Looks wrong to me." }),
  ]), base.binding.head);
  const record = retained(retainedRevalidation(result));
  validateRecord(record, sessionId);
  assert.equal(record.outcome.revalidation.entries.length, 1);
  assert.equal(record.outcome.revalidation.unreadable.length, 1);
  const clash = structuredClone(record.outcome.revalidation);
  clash.unreadable[0].commentId = clash.entries[0].commentId;
  assert.throws(() => validateRecord(retained(clash), sessionId), /Invalid retained result/,
    "One comment cannot be both read and unread");
  console.log("PASS I1c an unreadable prior comment is retained as one, and never as a verdict");
}
