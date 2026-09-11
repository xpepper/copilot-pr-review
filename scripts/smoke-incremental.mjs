import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assembleContext } from "../extensions/pr-review/context.mjs";
import {
  adjudicateCandidates, collectCandidates, evidenceBoundary, formatFindings, reviewKey,
} from "../extensions/pr-review/findings.mjs";
import {
  confineToNewCommits, confinedPaths, confinementCaveat, confinementInput, confinementSummary,
  describeConfinement, isConfined, lineRanges, newRangeFrom, withinNewRange,
} from "../extensions/pr-review/incremental.mjs";
import { parseDiffFiles } from "../extensions/pr-review/context.mjs";
import { describePrior } from "../extensions/pr-review/prior.mjs";
import { reviewModes } from "../extensions/pr-review/modes.mjs";
import { reviewBinding, reviewInstructions, reviewPrompt } from "../extensions/pr-review/review.mjs";
import { executeTargetCapture } from "../extensions/pr-review/target.mjs";
import {
  blobSha, identity, respond, shippingBaseSource, shippingDiff, shippingHeadSource,
  validationBaseSource, validationDiff, validationHeadSource,
} from "./target-fixture.mjs";

const cwd = process.cwd();
const policy = reviewModes.quick.policy;
const repository = {
  id: "R_fixture", nameWithOwner: "fixture/repository", host: "github.com",
  url: "https://github.com/fixture/repository",
};
const priorHead = "1".repeat(40);
const head = "b".repeat(40);
const base = "a".repeat(40);
const sourceOf = { "total.js": [validationBaseSource, validationHeadSource],
  "shipping.js": [shippingBaseSource, shippingHeadSource] };

// The captured pull request changes two files. The commits added since the
// earlier review touch only one of them, which is what gives the filter
// something to remove.
const captured = validationDiff + shippingDiff;
const rangeDiff = validationDiff;

// ---------------------------------------------------------------------------
// The range itself: head-side lines in the head's own coordinates.

const range = newRangeFrom(rangeDiff, { priorHead, head, commits: 2 });
assert.deepEqual([...range.touched].sort(), ["total.js"]);
assert.deepEqual([...range.changed.get("total.js")], [3]);
assert.equal(range.files, 1);
assert.equal(range.changed.has("shipping.js"), false);
// Consecutive lines read as one range; a gap starts another. The numbers are
// the reviewer's own coordinates already, so nothing is translated on the way.
assert.deepEqual(lineRanges([4, 2, 3, 9]), ["2-4", "9"]);
assert.deepEqual(lineRanges([7]), ["7"]);
assert.deepEqual(lineRanges([]), []);
const wide = newRangeFrom([
  "diff --git a/total.js b/total.js",
  `index ${blobSha(validationBaseSource)}..${blobSha(validationHeadSource)} 100644`,
  // Four old lines; six new, because two were added and one was replaced. The
  // completeness check caught this header when it was written as +1,5.
  "--- a/total.js", "+++ b/total.js", "@@ -1,4 +1,6 @@",
  " // Total is unit cents multiplied by quantity.",
  "+// added", "+// added too",
  " export function total(cents, quantity) {",
  "-  return cents * quantity;", "+  return cents + quantity;", " }", "",
].join("\n"), { priorHead, head, commits: 1 });
assert.deepEqual(confinedPaths({ status: "confined", range: wide }), [{ path: "total.js", lines: ["2-3", "5"] }]);
console.log("PASS I1b the new commit range is read as head-side lines in the head's own coordinates");

// ---------------------------------------------------------------------------
// A partial range is worse than no range. parseDiffFiles is a parser and not a
// completeness check: it accepts a diff cut mid-hunk and reports fewer changed
// lines, which would set every candidate in the truncated file aside as already
// covered. Completeness is asserted before anything is confined to it.

const rangeLines = validationDiff.split("\n");
const midHunk = rangeLines.slice(0, 8).join("\n");
assert.deepEqual(parseDiffFiles(midHunk)[0].changed.head, [],
  "The parser alone reports no changed line for the file it truncated, and raises nothing");
assert.deepEqual(parseDiffFiles(validationDiff)[0].changed.head, [3]);
for (const [broken, what] of [
  [midHunk, "a hunk cut before its declared lines are consumed"],
  [validationDiff.slice(0, -1), "a diff that does not end with a newline"],
  ["@@ -1,2 +1,2 @@\n a\n-b\n+c\n", "a diff with no file header"],
  [rangeLines.slice(0, 5).concat([" // Total is unit cents multiplied by quantity.", "?bogus", ""]).join("\n"),
    "an unexpected line inside a hunk"],
]) assert.throws(() => newRangeFrom(broken, { priorHead, head, commits: 1 }),
  /commit range diff/, what);
console.log("PASS I1b a range diff that cannot be shown complete refuses rather than confines");

// ---------------------------------------------------------------------------
// What the filter can and cannot establish.

const at = (path, side, startLine, endLine = startLine) => ({ path, side, startLine, endLine });
assert.equal(withinNewRange(at("total.js", "head", 3), range), true);
assert.equal(withinNewRange(at("total.js", "head", 2, 3), range), true, "one changed line in the span is enough");
assert.equal(withinNewRange(at("total.js", "head", 1, 2), range), false);
assert.equal(withinNewRange(at("shipping.js", "head", 3), range), false, "an untouched file holds nothing new");
// A base-side anchor names the captured base revision, which this comparison
// never saw, so the only thing establishable about one is that its file was
// never touched. Anything the range cannot place stays in scope.
assert.equal(withinNewRange(at("shipping.js", "base", 3), range), false);
assert.equal(withinNewRange(at("total.js", "base", 3), range), true);
assert.equal(withinNewRange(at("shipping.js", "head", 3), undefined), true, "no range confines nothing");
console.log("PASS I1b the filter removes only what it can prove an earlier turn covered");

// ---------------------------------------------------------------------------
// Deciding whether to confine at all, and saying which outcome it was.

const pull = { number: 7, head: { sha: head } };
const priorReview = { head: priorHead, url: `${repository.url}/pull/7#pullrequestreview-1`, label: "Deep review" };
const found = (relationship, extra = {}) => ({
  status: "found", relationship, review: priorReview,
  comparison: { status: "ahead", totalCommits: 2, mergeBase: priorHead }, ...extra,
});
const rangeGh = (response) => {
  const calls = [];
  const gh = async (args, directory, options) => {
    calls.push({ args, directory, signal: options?.signal });
    assert.equal(directory, cwd);
    assert.deepEqual(args.slice(0, 5), ["api", "--hostname", repository.host, "--method", "GET"]);
    assert.equal(args[5], `repos/${repository.nameWithOwner}/compare/${priorHead}...${head}`);
    assert.deepEqual(args.slice(6), ["-H", "Accept: application/vnd.github.diff"]);
    if (response instanceof Error) throw response;
    return response;
  };
  return { gh, calls };
};

assert.equal(await confineToNewCommits(found("incremental"), pull, repository,
  { requested: false, gh: rangeGh(rangeDiff).gh, cwd }), undefined,
"Without the flag nothing is read and nothing is reported");

for (const relationship of ["none", "same-head", "diverged", "unknown"]) {
  const asked = rangeGh(new Error("the comparison must not be read"));
  const outcome = await confineToNewCommits(found(relationship), pull, repository,
    { requested: true, gh: asked.gh, cwd });
  assert.equal(outcome.status, "not-applicable");
  assert.equal(outcome.relationship, relationship);
  assert.equal(asked.calls.length, 0, "A relationship with no forward range costs no request");
  assert.match(describeConfinement(outcome), /narrowed nothing/);
  assert.match(describeConfinement(outcome), /Fresh hunting is not confined/);
}
assert.equal((await confineToNewCommits({ status: "failed", relationship: "unknown" }, pull, repository,
  { requested: true, gh: rangeGh(rangeDiff).gh, cwd })).status, "not-applicable",
"A failed discovery leaves no relationship to confine to, and confines nothing");

const unreadable = await confineToNewCommits(found("incremental"), pull, repository,
  { requested: true, gh: rangeGh(new Error("HTTP 404 Not Found")).gh, cwd });
assert.equal(unreadable.status, "failed");
assert.match(unreadable.reason, /404/);
assert.match(describeConfinement(unreadable), /narrowed nothing: the commit range could not be read/);
assert.match(describeConfinement(unreadable), /proceeds as an ordinary one/);

// A truncated range reaches the same place as an unreadable one, and for the
// same reason: nothing established the range, so nothing is confined to it.
const truncated = await confineToNewCommits(found("incremental"), pull, repository,
  { requested: true, gh: rangeGh(midHunk).gh, cwd });
assert.equal(truncated.status, "failed", "A range that cannot be shown complete confines nothing");
assert.match(truncated.reason, /commit range diff/);
assert.match(describeConfinement(truncated), /narrowed nothing: the commit range could not be read/);

const nothingChanged = await confineToNewCommits(found("incremental"), pull, repository,
  { requested: true, gh: rangeGh("").gh, cwd });
assert.equal(nothingChanged.status, "empty", "A forward range that changes no file is not a failure");
assert.match(describeConfinement(nothingChanged), /change no file, so there is no forward range/);

const controller = new AbortController();
controller.abort(new DOMException("cancelled", "AbortError"));
await assert.rejects(confineToNewCommits(found("incremental"), pull, repository, {
  requested: true, cwd, signal: controller.signal,
  gh: async () => { throw new Error("killed"); },
}), /killed/, "A cancellation belongs to the run, never to the confinement report");

const confinement = await confineToNewCommits(found("incremental"), pull, repository,
  { requested: true, gh: rangeGh(rangeDiff).gh, cwd });
assert.equal(confinement.status, "confined");
assert.equal(isConfined(confinement), true);
for (const other of [unreadable, nothingChanged]) assert.equal(isConfined(other), false);
const prose = describeConfinement(confinement);
assert.match(prose, /confined to the 2 commit\(s\) added since 1{40}/);
assert.match(prose, /does not cover the whole pull request/);
assert.match(prose, /filter over the captured base-to-head binding and never a replacement for it/);
assert.match(prose, /whose own coverage this run does not read and does not vouch for/);
assert.deepEqual(confinementInput(confinement),
  { reviewedBefore: priorHead, commitsSince: 2, paths: [{ path: "total.js", lines: ["3"] }] });
const summary = confinementSummary(confinement);
assert.equal(summary.status, "confined");
assert.equal(summary.reviewedBefore, priorHead);
assert.deepEqual(summary.paths, [{ path: "total.js", lines: ["3"] }]);
assert.equal(confinementSummary(undefined), undefined);
assert.equal(confinementSummary(unreadable).status, "failed");
const many = confinementSummary({ status: "confined", requested: true, relationship: "incremental",
  range: { priorHead, head, commits: 1, files: 25,
    changed: new Map(Array.from({ length: 25 }, (value, index) => [`file${index}.js`, new Set([1])])) } }, 20);
assert.equal(many.paths.length, 20);
assert.equal(many.undisplayedPaths, 5);
console.log("PASS I1b every outcome but confined narrows nothing, and each says which it is");

// ---------------------------------------------------------------------------
// The filter over real candidates, at the evidence boundary.

const snapshot = {
  repository, diff: captured, diffSha256: createHash("sha256").update(captured).digest("hex"),
  pull: { id: "PR_7", number: 7, changedFiles: 2, head: { sha: head }, base: { sha: base } },
};
const context = await assembleContext(snapshot, {
  gh: async (args) => {
    const [path, ref] = /contents\/([^?]+)\?ref=([0-9a-f]{40})/.exec(args[5]).slice(1);
    const text = sourceOf[path][ref === head ? 1 : 0];
    return JSON.stringify({ type: "file", path, encoding: "base64", sha: blobSha(text),
      size: Buffer.byteLength(text), content: Buffer.from(text).toString("base64") });
  },
});
const binding = reviewBinding(snapshot, context);
const boundary = evidenceBoundary(snapshot, context, binding);
const key = reviewKey(binding);
const cite = (path, side, line = 3) => ({ path, side, startLine: line, endLine: line,
  quote: sourceOf[path][side === "head" ? 1 : 0].split("\n")[line - 1] });
const candidateFor = (path, title) => ({
  title, severity: "P2", confidence: 0.95, location: cite(path, "head"),
  trigger: `a call into ${path}`, expected: "the documented behaviour",
  actual: "the changed expression returns something else",
  introduction: "The changed operator is what makes this fail.",
  before: cite(path, "base"), after: cite(path, "head"), evidence: [cite(path, "head", 1)],
});
const reviewer = (candidates) => ({ label: "correctness", status: "completed",
  result: JSON.stringify({ schemaVersion: 2, reviewKey: key, candidates, limitations: [] }) });
const candidates = [candidateFor("total.js", "Multiply the unit price by quantity"),
  candidateFor("shipping.js", "Free shipping now applies to small orders")];

const unconfined = collectCandidates([reviewer(candidates)], boundary, policy);
assert.equal(unconfined.candidates.length, 2, "Without confinement both candidates stand");
assert.deepEqual(unconfined.outside, []);
assert.equal(unconfined.diagnostics.length, 0);

const collected = collectCandidates([reviewer(candidates)], boundary, policy, confinement);
assert.deepEqual(collected.candidates.map(({ id }) => id), ["correctness:1"]);
assert.equal(collected.outside.length, 1);
assert.deepEqual(collected.outside[0],
  { id: "correctness:2", reviewer: "correctness", severity: "P2",
    title: "Free shipping now applies to small orders", location: collected.outside[0].location });
assert.equal(collected.outside[0].location.path, "shipping.js");
// The set-aside candidate passed every check an unconfined run makes. It is not
// a refusal and not an execution failure, so it never blocks coverage.
assert.deepEqual(collected.issues, []);
const caveats = collected.diagnostics.filter((entry) => entry.kind === "caveat");
assert.equal(caveats.length, 1);
assert.match(caveats[0].message, /does not cover the whole pull request/);
assert.match(caveats[0].message, /1 candidate\(s\) anchored outside that range were set aside/);
assert.match(caveats[0].message, /the earlier review's own coverage was not read/);
assert.equal(confinementCaveat(unreadable, 0), undefined, "Only a confined run carries the caveat");
console.log("PASS I1b a candidate outside the range is set aside, never refused and never a coverage failure");

// ---------------------------------------------------------------------------
// What the run then reports.

const validator = { status: "completed", result: JSON.stringify({ schemaVersion: 2, reviewKey: key,
  decisions: [{ candidateId: "correctness:1", verdict: "accept", allClaimsSupported: true,
    reason: "The unchanged contract requires multiplication; the changed expression adds instead.",
    evidence: [cite("total.js", "head", 1)], duplicateOf: null }], limitations: [] }) };
const validation = adjudicateCandidates(collected, validator, boundary, policy);
assert.equal(validation.complete, true, "A confined review is complete over what it was asked to review");
assert.equal(validation.findings.length, 1);
assert.equal(validation.outside.length, 1);
const report = formatFindings({ mode: "quick", binding, complete: true, coverage: "completed",
  reviewers: [], validation });
assert.match(report, /1 candidate\(s\) set aside as already covered by the earlier review/);
assert.match(report, /none of them was adjudicated, so none is a validated finding and none is refuted/);
assert.match(report, /correctness:2: \[P2\] Free shipping now applies to small orders at shipping\.js:3-3 \(head\)/);
// The coverage block reaches the published review body, so the confinement is
// stated there too rather than only on the person's screen.
assert.match(report, /Informational caveat: Fresh hunting was confined/);
assert.match(report, /Review coverage: completed/);
console.log("PASS I1b the run and the published body both state that it did not cover the whole pull request");

// ---------------------------------------------------------------------------
// What the reviewers are told, and only when there is something to tell.

const confined = reviewInstructions(reviewModes.deep, confinement);
assert.match(confined, /fresh hunting is confined to the commits/);
assert.match(confined, /Report a candidate ONLY when its location anchors on a head-side line inside those supplied ranges/);
assert.match(confined, /do not treat its absence here as its absence/);
assert.match(confined, /Read the whole diff, the whole context and the checkout exactly as you/);
for (const off of [undefined, unreadable, nothingChanged]) {
  // "Reads are confined to that checkout" is in every reviewer's instructions,
  // so the check names the confinement this increment adds rather than a word.
  assert.doesNotMatch(reviewInstructions(reviewModes.deep, off), /fresh hunting is confined|confinedTo/,
    "A run that narrowed nothing must not tell a reviewer it did");
}
const access = { root: cwd };
const assignment = { label: "integrated" };
const withRange = JSON.parse(reviewPrompt(reviewModes.deep, assignment, snapshot, context, binding, access,
  confinement).split("\n").at(-1));
assert.deepEqual(withRange.confinedTo, confinementInput(confinement));
assert.equal(withRange.untrustedDiff, captured, "The captured diff reaches the reviewer whole");
assert.equal(withRange.untrustedContext, context.text, "So do the context windows");
const without = JSON.parse(reviewPrompt(reviewModes.deep, assignment, snapshot, context, binding, access,
  unreadable).split("\n").at(-1));
assert.equal(Object.hasOwn(without, "confinedTo"), false);
assert.equal(without.untrustedDiff, withRange.untrustedDiff, "Confinement changes no reviewer's evidence");
console.log("PASS I1b confinement narrows what may be reported and changes no reviewer's evidence");

// ---------------------------------------------------------------------------
// The prior-review report says what this run actually did with it.

const priorOutcome = { ...found("incremental"), identity, considered: 1, comments: [] };
assert.match(describePrior(priorOutcome, head, false), /acts on none of it/);
assert.match(describePrior(priorOutcome, head, true), /confines fresh hunting to the commit range reported below/);
for (const confinedFlag of [false, true]) {
  assert.match(describePrior(priorOutcome, head, confinedFlag), /earlier findings are not revalidated/,
    "Revalidating them is still nobody's work, in both branches");
}
console.log("PASS I1b the prior-review report never promises a confinement the run did not make");

// ---------------------------------------------------------------------------
// Wired into capture, verbosely and quietly, and only when asked.

const toolReview = {
  id: 5130714400, state: "COMMENTED", commit_id: priorHead,
  user: { login: identity.login, id: identity.id, type: "User" },
  submitted_at: "2026-09-07T10:11:11Z",
  html_url: `${repository.url}/pull/13#pullrequestreview-5130714400`,
  body: "Deep review: 1 selected validated finding(s). Review coverage: completed. This is not a clean-review claim.",
};
const history = [];
const capturing = async (args, directory) => {
  const path = args[5];
  const response = path?.endsWith("/reviews?per_page=100") ? JSON.stringify([[toolReview]])
    : path?.endsWith("/comments?per_page=100") ? JSON.stringify([[]])
      : path?.startsWith(`repos/${repository.nameWithOwner}/compare/`)
        ? (args[7] === "Accept: application/vnd.github.diff"
          ? rangeDiff
          : JSON.stringify({ status: "ahead", ahead_by: 2, behind_by: 0, total_commits: 2,
            merge_base_commit: { sha: priorHead } }))
        : respond(args, directory, history);
  history.push({ args, cwd: directory });
  return response;
};
const session = (sink) => ({
  rpc: { metadata: { snapshot: async () => ({ workingDirectory: cwd, isRemote: false }) } },
  capabilities: {}, log: async (message) => sink.push(message),
});
const asked = [];
const captureRun = await executeTargetCapture(session(asked), "13", { gh: capturing, incremental: true });
assert.equal(captureRun.prior.relationship, "incremental");
assert.equal(captureRun.confinement.status, "confined");
const evidence = asked.find((line) => line.startsWith("I1b confinement: "));
assert(evidence, "A verbose run dumps the confinement evidence like every other stage");
assert.match(evidence, /"status":"confined"/);
assert.match(evidence, /does not cover the whole pull request/);
assert(asked.some((line) => /confines fresh hunting to the commit range reported below/.test(line)),
  "The prior-review line agrees with the confinement that followed it");

const quiet = [];
await executeTargetCapture(session(quiet), "13", { gh: capturing, incremental: true, quiet: true });
assert(!quiet.some((line) => line.startsWith("I1b confinement: ")), "Quiet drops the evidence dump");
assert(quiet.some((line) => /does not cover the whole pull request/.test(line)),
  "Quiet never drops what the run did");

const unasked = [];
const ordinary = await executeTargetCapture(session(unasked), "13", { gh: capturing });
assert.equal(ordinary.confinement, undefined);
assert(!unasked.some((line) => line.includes("I1b confinement")), "A run that did not ask reports no confinement");
assert(unasked.some((line) => /acts on none of it/.test(line)));
console.log("PASS I1b capture confines only when asked, and reports it verbosely and quietly");
