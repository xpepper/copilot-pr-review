import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assembleContext, contextWindows, fetchSource, formatContext, parseDiffFiles, requiredSources,
} from "../extensions/pr-review/context.mjs";
import { captureTarget, parseTargetArgs } from "../extensions/pr-review/target.mjs";
import {
  advancedSource, baseSource, blobSha, contentsResponse, diff, headSource, repository, respond,
} from "./target-fixture.mjs";

const cwd = await mkdtemp(join(tmpdir(), "pr-review-context-"));
// A different local branch's source at the same path must never become review evidence.
const decoy = "export const value = 999; // local dirty checkout\n";
await writeFile(join(cwd, "example.js"), decoy);

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

const captured = fakeGh();
const { snapshot } = await captureTarget(parseTargetArgs("1"), { cwd, gh: captured.gh });

// --- diff parsing -----------------------------------------------------------
const [only] = parseDiffFiles(snapshot.diff);
assert.equal(parseDiffFiles(snapshot.diff).length, 1);
assert.deepEqual(
  { path: only.newPath, old: only.oldPath, status: only.status, binary: only.binary },
  { path: "example.js", old: "example.js", status: "modified", binary: false },
);
assert.equal(only.newBlob, blobSha(headSource).slice(0, 7));
assert.equal(only.oldBlob, blobSha(baseSource).slice(0, 7));
assert.deepEqual(only.hunks, [{
  oldStart: 1, oldLines: 1, newStart: 1, newLines: 1,
  oldText: ["export const value = 1;"], newText: ["export const value = 2;"],
}]);

const mixed = [
  "diff --git a/added.txt b/added.txt",
  "new file mode 100644",
  "index 0000000..1234567",
  "--- /dev/null",
  "+++ b/added.txt",
  "@@ -0,0 +1,2 @@",
  "+one",
  "+two",
  "diff --git a/gone.txt b/gone.txt",
  "deleted file mode 100644",
  "index 89abcde..0000000",
  "--- a/gone.txt",
  "+++ /dev/null",
  "@@ -1,2 +0,0 @@",
  "-old one",
  "-old two",
  "diff --git a/old name.txt b/new name.txt",
  "similarity index 90%",
  "rename from old name.txt",
  "rename to new name.txt",
  "index aaaaaaa..bbbbbbb 100644",
  "--- a/old name.txt",
  "+++ b/new name.txt",
  "@@ -3,2 +3,2 @@ context text",
  " kept",
  "-dropped",
  "+appended",
  "\\ No newline at end of file",
  "diff --git a/icon.png b/icon.png",
  "index ccccccc..ddddddd 100644",
  "Binary files a/icon.png and b/icon.png differ",
  "diff --git a/script.sh b/script.sh",
  "old mode 100644",
  "new mode 100755",
  "diff --git \"a/caf\\303\\251.txt\" \"b/caf\\303\\251.txt\"",
  "index eeeeeee..fffffff 100644",
  "--- \"a/caf\\303\\251.txt\"",
  "+++ \"b/caf\\303\\251.txt\"",
  "@@ -1 +1 @@",
  "-avant\r",
  "+après\r",
  "",
].join("\n");
const parsed = parseDiffFiles(mixed);
assert.deepEqual(parsed.map((file) => [file.newPath ?? file.oldPath, file.status, file.binary]), [
  ["added.txt", "added", false],
  ["gone.txt", "deleted", false],
  ["new name.txt", "renamed", false],
  ["icon.png", "modified", true],
  ["script.sh", "modified", false],
  ["café.txt", "modified", false],
]);
assert.deepEqual(parsed[2].hunks[0],
  { oldStart: 3, oldLines: 2, newStart: 3, newLines: 2, oldText: ["kept", "dropped"], newText: ["kept", "appended"] });
assert.deepEqual(parsed[5].hunks[0].newText, ["après\r"], "Keep CRLF bytes exactly as reviewed");
assert.deepEqual(parsed[3].hunks, []);
assert.deepEqual(parsed[4].hunks, []);
assert.equal(parsed[2].oldPath, "old name.txt");
for (const malformed of ["diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\nnot a diff body\n"]) {
  assert.throws(() => parseDiffFiles(malformed), /diff/i);
}

// --- required sides ---------------------------------------------------------
assert.deepEqual(requiredSources(parsed[0]).map((need) => need.side), ["head"], "Added files have no base side");
assert.deepEqual(requiredSources(parsed[1]).map((need) => need.side), ["base"], "Deleted files have no head side");
assert.deepEqual(requiredSources(parsed[2]).map((need) => [need.side, need.path]),
  [["head", "new name.txt"], ["base", "old name.txt"]], "Renames carry both provenance paths");
assert.deepEqual(requiredSources(parsed[3]), [], "Binary payloads are not textual review evidence");
assert.deepEqual(requiredSources(parsed[4]), []);

// --- windows ----------------------------------------------------------------
assert.deepEqual(contextWindows([{ newStart: 10, newLines: 3 }], "head", 100, 4), [{ start: 6, end: 16 }]);
assert.deepEqual(contextWindows([{ newStart: 2, newLines: 1 }], "head", 3, 40), [{ start: 1, end: 3 }],
  "Windows are clamped to the fetched revision's real line count");
assert.deepEqual(contextWindows(
  [{ newStart: 10, newLines: 1 }, { newStart: 18, newLines: 1 }, { newStart: 90, newLines: 2 }], "head", 200, 4),
  [{ start: 6, end: 22 }, { start: 86, end: 95 }], "Overlapping windows merge");
assert.deepEqual(contextWindows([{ oldStart: 5, oldLines: 2 }], "base", 50, 2), [{ start: 3, end: 8 }]);
assert.deepEqual(contextWindows([{ newStart: 0, newLines: 0 }], "head", 0, 5), [],
  "An empty revision yields no window rather than an invented one");

// --- single source fetch ----------------------------------------------------
const head = { repository: snapshot.repository, ref: snapshot.pull.head.sha, path: "example.js", blob: only.newBlob };
const single = fakeGh();
const source = await fetchSource(head, { cwd, gh: single.gh });
assert.deepEqual(single.calls[0].args, [
  "api", "--hostname", "github.com", "--method", "GET",
  `repos/fixture/repository/contents/example.js?ref=${"b".repeat(40)}`,
  "-H", "Accept: application/vnd.github+json",
]);
assert.equal(source.blobSha, blobSha(headSource));
assert.equal(source.repository, "fixture/repository");
assert.equal(source.ref, "b".repeat(40));
assert.equal(source.path, "example.js");
assert.equal(source.bytes, Buffer.byteLength(headSource));
assert.deepEqual(source.lines, headSource.split("\n").slice(0, -1));
assert(!source.lines.join("\n").includes("999"), "Never read the local checkout");

for (const [mutate, expected, target = head] of [
  [(raw) => { raw.type = "symlink"; }, /not a file/i],
  [(raw) => { raw.path = "other.js"; }, /not a file|path/i],
  [(raw) => { raw.encoding = "none"; raw.content = ""; }, /verifiable form/i],
  [(raw) => { raw.size = 3; }, /size/i],
  [(raw) => { raw.sha = "0".repeat(40); }, /blob identity/i],
  [(raw) => { raw.content = Buffer.from("wholly different\n").toString("base64"); }, /size|blob identity/i],
  [(raw) => {
    const bytes = Buffer.from([0x61, 0x00, 0x62]);
    raw.content = bytes.toString("base64");
    raw.size = bytes.length;
    raw.sha = createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest("hex");
  }, /UTF-8 text/i, { ...head, blob: null }],
]) {
  const broken = fakeGh((value, args) => {
    if (!args[5]?.includes("/contents/")) return value;
    const raw = JSON.parse(value);
    mutate(raw);
    return JSON.stringify(raw);
  });
  await assert.rejects(fetchSource(target, { cwd, gh: broken.gh }), expected);
}
await assert.rejects(fetchSource({ ...head, blob: "9999999" }, { cwd, gh: fakeGh().gh }),
  /not the blob recorded in the captured diff/i);
await assert.rejects(fetchSource({ ...head, path: "missing.js" }, { cwd, gh: fakeGh().gh }), /404/);

// --- assembled context ------------------------------------------------------
const assembling = fakeGh();
const context = await assembleContext(snapshot, { cwd, gh: assembling.gh });
assert.deepEqual(assembling.calls.map(({ args }) => args[5]), [
  `repos/fixture/repository/contents/example.js?ref=${"b".repeat(40)}`,
  `repos/fixture/repository/contents/example.js?ref=${"a".repeat(40)}`,
], "Both sides come from the captured immutable revisions");
assert(assembling.calls.every(({ args }) => args[0] === "api" && args[3] === "--method" && args[4] === "GET"));
assert.equal(context.head, "b".repeat(40));
assert.equal(context.base, "a".repeat(40));
assert.equal(context.files.length, 1);
assert.deepEqual(context.files[0].sources.map((entry) => [entry.side, entry.blobSha]),
  [["head", blobSha(headSource)], ["base", blobSha(baseSource)]]);
assert.deepEqual(context.files[0].sources[0].windows, [{ start: 1, end: 5 }]);
assert(context.text.includes("export const value = 2;"));
assert(context.text.includes("export const value = 1;"));
assert(!context.text.includes("999"), "Assembled context must not contain local working-tree source");
assert.equal(context.sha256, createHash("sha256").update(context.text).digest("hex"));
assert.equal(context.bytes, Buffer.byteLength(context.text));

const rendered = formatContext(context);
assert.equal(rendered, context.text);
for (const line of rendered.split("\n").filter((entry) => entry.startsWith("--- path "))) {
  assert.match(line, /^--- path example\.js blob [0-9a-f]{40} lines \d+-\d+$/);
}
for (const line of rendered.split("\n").filter((entry) => entry.startsWith("--- context "))) {
  assert.match(line, /^--- context fixture\/repository (head|base) [0-9a-f]{40}$/);
}
assert(rendered.split("\n").filter(Boolean).every((line) =>
  /^(--- (context|path) |\s*\d+\| )/.test(line)), "Every context line is numbered or a provenance header");

// --- binding survives an advancing PR --------------------------------------
const advancing = fakeGh();
const eleven = await captureTarget(parseTargetArgs("11"), { cwd, gh: advancing.gh });
assert.equal(eleven.disposition, "captured");
const boundContext = await assembleContext(eleven.snapshot, { cwd, gh: advancing.gh });
assert(advancing.calls.filter(({ args }) => args[5]?.includes("/contents/"))
  .every(({ args }) => args[5].endsWith(`ref=${"b".repeat(40)}`) || args[5].endsWith(`ref=${"a".repeat(40)}`)),
  "Context stays on the captured revisions after the PR advances");
assert(boundContext.text.includes("export const value = 2;"));
assert(!boundContext.text.includes(advancedSource.split("\n")[0]));
const moved = JSON.parse(await advancing.gh(
  ["api", "--hostname", "github.com", "--method", "GET", "repos/fixture/repository/pulls/11",
    "-H", "Accept: application/vnd.github+json"], cwd));
assert.equal(moved.head.sha, "c".repeat(40), "The fixture PR really did advance");
assert.notEqual(contentsResponse("example.js", "c".repeat(40)), contentsResponse("example.js", "b".repeat(40)));

// --- explicit stops ---------------------------------------------------------
const otherBranch = fakeGh((value, args) => {
  if (!args[5]?.includes("/contents/")) return value;
  return contentsResponse("example.js", "c".repeat(40));
});
await assert.rejects(assembleContext(snapshot, { cwd, gh: otherBranch.gh }),
  /not the blob recorded in the captured diff/i, "A different revision's blob is refused, not reviewed");

// Without diff blob identities, the fetched lines themselves must still match the captured diff.
const withoutBlobs = {
  ...snapshot,
  diff: snapshot.diff.split("\n").filter((line) => !line.startsWith("index ")).join("\n"),
};
assert.equal(parseDiffFiles(withoutBlobs.diff)[0].newBlob, null);
const unverifiableBlob = fakeGh((value, args) => {
  if (!args[5]?.includes("/contents/")) return value;
  return contentsResponse("example.js", "c".repeat(40));
});
await assert.rejects(assembleContext(withoutBlobs, { cwd, gh: unverifiableBlob.gh }),
  /line 1 does not match the captured diff/i, "Lines from another revision are refused, not reviewed");
assert.deepEqual(await assembleContext(withoutBlobs, { cwd, gh: fakeGh().gh })
  .then((result) => result.files[0].sources.map((entry) => entry.blobSha)),
  [blobSha(headSource), blobSha(baseSource)], "Provenance still records the real blob identities");

const mismatchedCounts = { ...snapshot, pull: { ...snapshot.pull, changedFiles: 2 } };
await assert.rejects(assembleContext(mismatchedCounts, { cwd, gh: fakeGh().gh }), /changed file count/i);
await assert.rejects(assembleContext(snapshot, { cwd }), /gh runner/i, "Context requires an explicit GitHub runner");

await rm(cwd, { recursive: true });
console.log("PASS Q2 diff parsing, revision-bound provenance, window binding, and explicit context stops");
