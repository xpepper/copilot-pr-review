import assert from "node:assert/strict";
import {
  captureTarget, contextSummary, executeTargetCapture, parseTargetArgs, skipReason, validateDiff,
} from "../extensions/pr-review/target.mjs";
import { blobSha, diff, headSource, pull, repository, respond } from "./target-fixture.mjs";

const cwd = process.cwd();
const options = parseTargetArgs("1");
function fakeGh(transform = (value) => value) {
  const calls = [];
  const gh = async (args, directory) => {
    assert.equal(directory, cwd);
    const response = respond(args, directory, calls);
    calls.push({ args, cwd: directory });
    return transform(response, args, calls);
  };
  return { gh, calls };
}

for (const args of ["", "0", "-1", "01", "1.2", "1e2", "9007199254740992", "1;touch x",
  "1 --quick --no-comment", "1 --comment", "1 --verify", "1 --include-drafts --include-drafts"]) {
  assert.throws(() => parseTargetArgs(args), /integer|Unsupported/);
}
assert.deepEqual(parseTargetArgs("  12 --include-drafts --review-closed  "),
  { number: 12, includeDrafts: true, includeClosed: true });

for (const [args, disposition, reason, callCount] of [
  ["1", "captured", undefined, 4],
  ["2", "skipped", "draft", 2],
  ["2 --include-drafts", "captured", undefined, 4],
  ["3", "skipped", "obvious-bot", 2],
  ["4", "skipped", "empty-change", 2],
  ["5", "confirmation-required", undefined, 2],
  ["6", "confirmation-required", undefined, 2],
  ["5 --include-closed", "captured", undefined, 4],
  ["6 --review-closed", "captured", undefined, 4],
]) {
  const fake = fakeGh();
  const outcome = await captureTarget(parseTargetArgs(args), { cwd, gh: fake.gh });
  assert.equal(outcome.disposition, disposition);
  if (reason) assert.equal(outcome.reason, reason);
  assert.equal(fake.calls.length, callCount);
  if (disposition === "captured") {
    assert.equal(outcome.snapshot.diff, diff);
    assert.equal(outcome.snapshot.diffBytes, Buffer.byteLength(diff));
    assert.match(outcome.snapshot.diffSha256, /^[a-f0-9]{64}$/);
    assert.equal(outcome.snapshot.repository.id, repository.id);
    assert.equal(outcome.snapshot.pull.head.sha, pull().head.sha);
  } else assert.equal(outcome.snapshot, undefined);
}

for (const accepted of [true, false, undefined, "yes"]) {
  const fake = fakeGh();
  let confirmations = 0;
  const outcome = await captureTarget(parseTargetArgs("5"), {
    cwd, gh: fake.gh,
    confirm: async (message) => {
      confirmations++;
      assert.match(message, /CLOSED.*head b{40}/);
      assert.equal(fake.calls.length, 2, "Never hold a diff while awaiting confirmation");
      return accepted;
    },
  });
  assert.equal(confirmations, 1);
  assert.equal(outcome.disposition, accepted === true ? "captured" : "declined");
  assert.equal(fake.calls.length, accepted === true ? 5 : 2);
}

for (const args of ["8", "9", "10"]) {
  await assert.rejects(captureTarget(parseTargetArgs(args), { cwd, gh: fakeGh().gh }),
    /unavailable|changed during capture|truncated/i);
}
for (const mutation of [
  (p) => { p.number = 2; },
  (p) => { p.base.repo.node_id = "wrong"; },
  (p) => { p.html_url = "https://github.com/other/repo/pull/1"; },
  (p) => { p.head.sha = "unbound"; },
  (p) => { p.state = "unknown"; },
  (p) => { p.merged = true; },
  (p) => { delete p.draft; },
  (p) => { delete p.changed_files; },
]) {
  const fake = fakeGh((value, args) => {
    if (!args.includes("Accept: application/vnd.github+json")) return value;
    const raw = JSON.parse(value);
    mutation(raw);
    return JSON.stringify(raw);
  });
  await assert.rejects(captureTarget(options, { cwd, gh: fake.gh }), /Invalid or mismatched/);
  assert.equal(fake.calls.length, 2);
}
for (const mutate of [
  (p) => { p.head.sha = "c".repeat(40); },
  (p) => { p.base.sha = "c".repeat(40); },
  (p) => { p.draft = true; },
  (p) => { p.state = "closed"; },
  (p) => { p.updated_at = "2026-09-06T21:00:00Z"; },
]) {
  const fake = fakeGh((value, args, calls) => {
    if (calls.length < 3 || !args.includes("Accept: application/vnd.github+json")) return value;
    const raw = JSON.parse(value);
    mutate(raw);
    return JSON.stringify(raw);
  });
  await assert.rejects(captureTarget(options, { cwd, gh: fake.gh }), /changed during capture/);
}
const duringConfirmation = fakeGh((value, args, calls) => {
  if (calls.length !== 3) return value;
  const raw = JSON.parse(value);
  raw.head.sha = "c".repeat(40);
  return JSON.stringify(raw);
});
await assert.rejects(captureTarget(parseTargetArgs("5"), {
  cwd, gh: duringConfirmation.gh, confirm: async () => true,
}), /changed during capture/);
assert.equal(duringConfirmation.calls.length, 3);
await assert.rejects(captureTarget(options, { cwd, gh: async () => "{broken" }), SyntaxError);
await assert.rejects(captureTarget(options, { cwd, gh: async () => { throw new Error("auth failed"); } }), /auth failed/);

const normalized = (await captureTarget(options, { cwd, gh: fakeGh().gh })).pull;
for (const title of ["typo", "docs only", "chore: automated update"]) {
  assert.equal(skipReason({ ...normalized, title }, options), undefined, "Titles cannot prove triviality or bot authorship");
}
assert.equal(skipReason({ ...normalized, author: { login: "tool[bot]", type: "User" } }, options), "obvious-bot");
assert.equal(skipReason({ ...normalized, additions: 0, deletions: 0 }, options), undefined,
  "Mode changes, renames and binary changes are not trivial by line count");
validateDiff(diff, normalized);
validateDiff("", { changedFiles: 0, additions: 0, deletions: 0 });
validateDiff("diff --git a/icon.png b/icon.png\nBinary files a/icon.png and b/icon.png differ\n",
  { changedFiles: 1, additions: 0, deletions: 0 });
validateDiff(diff.replace("@@ -1 +1 @@", "@@ -1,1 +1,1 @@") + "\\ No newline at end of file\n", normalized);
for (const malformed of ["", "not a diff\n", diff.slice(0, -5), diff.replace("+export", " export"),
  diff.replace("@@ -1 +1 @@", "@@ -1,2 +1,2 @@"), diff + diff]) {
  assert.throws(() => validateDiff(malformed, normalized), /diff/i);
}

const logs = [];
const fake = fakeGh();
const session = {
  rpc: { metadata: { snapshot: async () => ({ workingDirectory: cwd, isRemote: false }) } },
  capabilities: {}, log: async (message) => logs.push(message),
};
const executed = await executeTargetCapture(session, "1", { gh: fake.gh });
assert.match(logs[0], /"disposition":"captured"/);
assert(!logs[0].includes(diff), "Do not put the diff in the parent conversation");
assert.match(logs[1], /^Q2 context: /);
assert(logs[1].includes(`"blob":"${blobSha(headSource)}"`), "Report the bound source provenance");
assert(!logs[1].includes("export const value"), "Do not put source context in the parent conversation");
assert.match(logs[1], /local checkout, its branch, and its uncommitted changes are never context evidence/);
assert.match(logs[1], /requires the checkout to be exactly this head before reviewers may read it/);
assert.equal(executed.context.head, "b".repeat(40));
assert.deepEqual(contextSummary(executed.context, 0),
  { ...contextSummary(executed.context), entries: [], undisplayedFiles: 1 },
  "Large PRs report an undisplayed-file count instead of an unbounded summary");
session.rpc.metadata.snapshot = async () => ({ workingDirectory: cwd, isRemote: true });
await assert.rejects(executeTargetCapture(session, "1", { gh: fake.gh }), /local Copilot session/);
assert.equal(fake.calls.length, 6, "Capture plus both bound source sides");
console.log("PASS Q1 capture, gates, strict confirmation, races, malformed metadata/diffs, command summary");
