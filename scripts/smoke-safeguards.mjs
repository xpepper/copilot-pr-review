import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  collectInstructionFiles, describeDiscovery, discoveryEnvelope, discoveryInstructions, discoveryPrompt,
  instructionBudgetBytes, instructionFileMaxBytes, maxCommandLength, maxDiscoveredCommands,
} from "../extensions/pr-review/safeguards.mjs";
import { outputEnd, outputStart } from "../extensions/pr-review/findings.mjs";

// V1b reads the instruction files a project already carries, from the checkout
// the preflight has already proven is the reviewed revision. Nothing here runs
// a command, and nothing here decides whether a command may ever run.

const roots = [];
function project(files) {
  const root = mkdtempSync(join(tmpdir(), "pr-review-safeguards-"));
  roots.push(root);
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content);
  return root;
}
const names = ({ files }) => files.map((file) => file.name);
const skippedNames = ({ skipped }) => skipped.map((entry) => entry.name);

// The defaults must let at least one largest-allowed file through, or the cap
// and the budget would disagree about the same first file.
assert(instructionBudgetBytes >= instructionFileMaxBytes);

{
  // A project that documents nothing is a supported answer, not a failure.
  const collected = collectInstructionFiles(project({}));
  assert.deepEqual(collected.files, []);
  assert.deepEqual(collected.skipped, []);
}
{
  // The conventional instruction names come first, in their own order, so the
  // pass reads the most authoritative file before the rest of the root.
  const root = project({
    "zebra.md": "z", "AGENTS.md": "agents", "notes.md": "n", "CLAUDE.md": "claude", "CONTRIBUTING.md": "c",
  });
  assert.deepEqual(names(collectInstructionFiles(root)),
    ["AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md", "notes.md", "zebra.md"]);
}
{
  // Choice 4: conventional names plus any other markdown at the checkout root.
  // Nothing below the root, and nothing that is not markdown.
  const root = project({ "AGENTS.md": "agents", "HANDOFF.md": "handoff", "package.json": "{}", "Makefile": "all:" });
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs", "guide.md"), "nested");
  const collected = collectInstructionFiles(root);
  assert.deepEqual(names(collected), ["AGENTS.md", "HANDOFF.md"]);
  // A non-markdown file is not a candidate at all, so it is not reported as
  // skipped either: only a markdown file the pass could have read is.
  assert.deepEqual(skippedNames(collected), []);
  assert.equal(collected.files.find((file) => file.name === "HANDOFF.md").text, "handoff");
}
{
  // The size cap is what keeps an oversized document out of the pass. The file
  // is named as skipped, because a silently dropped source is indistinguishable
  // from a project that never documented anything.
  const root = project({ "AGENTS.md": "agents", "ROADMAP.md": "x".repeat(instructionFileMaxBytes + 1) });
  const collected = collectInstructionFiles(root);
  assert.deepEqual(names(collected), ["AGENTS.md"]);
  assert.deepEqual(skippedNames(collected), ["ROADMAP.md"]);
  assert.match(collected.skipped[0].reason, new RegExp(`exceeds ${instructionFileMaxBytes} bytes`));
  assert.equal(collected.skipped[0].bytes, instructionFileMaxBytes + 1);
  // A file exactly at the cap is readable; the cap is a maximum, not a limit
  // the largest allowed file already breaks.
  const edge = project({ "AGENTS.md": "y".repeat(instructionFileMaxBytes) });
  assert.deepEqual(names(collectInstructionFiles(edge)), ["AGENTS.md"]);
}
{
  // A symbolic link is refused rather than followed, for the reason project
  // configuration already refuses one: what it points at is not this file.
  const root = project({ "AGENTS.md": "agents" });
  symlinkSync(join(root, "AGENTS.md"), join(root, "LINKED.md"));
  const collected = collectInstructionFiles(root);
  assert.deepEqual(names(collected), ["AGENTS.md"]);
  assert.deepEqual(skippedNames(collected), ["LINKED.md"]);
  assert.match(collected.skipped[0].reason, /symbolic link/);
}
{
  // A directory that happens to be named like a markdown file is not one.
  const root = project({ "AGENTS.md": "agents" });
  mkdirSync(join(root, "generated.md"));
  const collected = collectInstructionFiles(root);
  assert.deepEqual(names(collected), ["AGENTS.md"]);
  assert.deepEqual(skippedNames(collected), ["generated.md"]);
  assert.match(collected.skipped[0].reason, /not a regular file/);
}
{
  // The total budget bounds what one run can spend on discovery, however many
  // small files a root holds. Files are taken in reading order, so the
  // conventional ones are never the ones dropped.
  const root = project({ "AGENTS.md": "a".repeat(16), "b-notes.md": "b", "c-notes.md": "c" });
  const collected = collectInstructionFiles(root, { maxBytes: 16, budgetBytes: 16 });
  assert.deepEqual(names(collected), ["AGENTS.md"]);
  assert.deepEqual(skippedNames(collected), ["b-notes.md", "c-notes.md"]);
  assert.match(collected.skipped[0].reason, /budget/);
}
{
  // Markdown is recognised by extension regardless of case.
  const root = project({ "Readme.MD": "r", "notes.Md": "n" });
  assert.deepEqual(names(collectInstructionFiles(root)), ["notes.Md", "Readme.MD"]);
}
console.log("PASS instruction files are collected from the checkout root, capped, ordered and reported");

// The discovery pass returns an envelope, and code decides what that envelope
// is allowed to say. The pass reads untrusted project prose, so nothing it
// returns is taken on trust: not the schema, not the command text, and above
// all not which file a command is attributed to.

const key = "d".repeat(64);
const sources = ["AGENTS.md", "HANDOFF.md"];
const body = (commands, overrides = {}) =>
  JSON.stringify({ schemaVersion: 1, discoveryKey: key, commands, ...overrides });
const wrapped = (raw) => [outputStart, raw, outputEnd].join("\n");
const suite = [{ command: "node scripts/smoke-findings.mjs", file: "HANDOFF.md" }];

{
  // The contract's own marker pair, which is how every other pass in this tool
  // delivers structured output. Nothing new is invented for this one.
  assert.deepEqual(discoveryEnvelope(wrapped(body(suite)), key, sources), { commands: suite });
  // A bare object and a fenced one unwrap exactly as they do for a reviewer.
  assert.deepEqual(discoveryEnvelope(body(suite), key, sources), { commands: suite });
  assert.deepEqual(discoveryEnvelope(["```json", body(suite), "```"].join("\n"), key, sources), { commands: suite });
  // A project that declares nothing is a valid answer, not a malformed one.
  assert.deepEqual(discoveryEnvelope(wrapped(body([])), key, sources), { commands: [] });
}
for (const [scenario, raw, expected] of [
  ["not JSON at all", "I read AGENTS.md and found the test suite.", /./],
  ["a wrong schema version", body(suite, { schemaVersion: 2 }), /schema version/i],
  ["a wrong binding key", body(suite, { discoveryKey: "e".repeat(64) }), /binding|key/i],
  ["an extra top-level field", body(suite, { safeguards: [] }), /field/i],
  ["a missing field", JSON.stringify({ schemaVersion: 1, discoveryKey: key }), /field/i],
  ["commands that are not an array", body({}), /array/i],
  ["an entry that is not an object", body(["npm test"]), /object|field/i],
  ["an extra entry field", body([{ ...suite[0], reason: "it is the test suite" }]), /field/i],
  ["an empty command", body([{ command: "   ", file: "AGENTS.md" }]), /nonempty|text/i],
  ["a command that is not text", body([{ command: 7, file: "AGENTS.md" }]), /nonempty|text/i],
  // The acceptance criterion in one assertion: a command may only be
  // attributed to a file this run actually supplied to the pass.
  ["a file that was never read", body([{ command: "npm test", file: "SECRETS.md" }]), /not (a )?(supplied|read)/i],
  ["a path escaping the supplied set", body([{ command: "npm test", file: "../AGENTS.md" }]), /not (a )?(supplied|read)/i],
  // Discovered text reaches a terminal, so a command is one line of it.
  ["a newline in the command", body([{ command: "npm test\nrm -rf /", file: "AGENTS.md" }]), /single line|control/i],
  ["an escape sequence in the command", body([{ command: "npm test[2J", file: "AGENTS.md" }]), /single line|control/i],
  ["an over-long command", body([{ command: "x".repeat(maxCommandLength + 1), file: "AGENTS.md" }]), /length|long/i],
  ["too many commands", body(Array.from({ length: maxDiscoveredCommands + 1 },
    () => ({ command: "npm test", file: "AGENTS.md" }))), /at most|many/i],
]) {
  assert.throws(() => discoveryEnvelope(raw, key, sources), expected, scenario);
  assert.throws(() => discoveryEnvelope(wrapped(raw), key, sources), expected, `${scenario}, delimited`);
}
{
  // A command exactly at the cap is usable; the cap is a maximum.
  const edge = [{ command: "x".repeat(maxCommandLength), file: "AGENTS.md" }];
  assert.deepEqual(discoveryEnvelope(body(edge), key, sources), { commands: edge });
}
console.log("PASS the discovery envelope is validated in code, including which file a command may cite");

// The pass is told what it is reading and what will happen to its answer.
{
  const instructions = discoveryInstructions();
  assert.match(instructions, /UNTRUSTED/);
  assert.match(instructions, new RegExp(outputStart));
  // It must never believe its output authorizes anything, and it holds no tool
  // with which to check a command itself.
  assert.match(instructions, /not (be )?(executed|run)|nothing .*(executed|run)/i);
  assert.match(instructions, /no tool|hold no|tools/i);
  const prompt = discoveryPrompt(key, [{ name: "AGENTS.md", bytes: 6, text: "run npm test" }]);
  assert.match(prompt, new RegExp(key));
  assert.match(prompt, /AGENTS\.md/);
  assert.match(prompt, /run npm test/);
}

// Presentation. Choice 3: the command and the file it came from, and nothing
// this increment cannot stand behind.
{
  const found = describeDiscovery({
    status: "found", commands: suite,
    files: [{ name: "AGENTS.md" }, { name: "HANDOFF.md" }],
    skipped: [{ name: "ROADMAP.md", reason: "exceeds 65536 bytes" }],
  });
  assert.match(found, /node scripts\/smoke-findings\.mjs/);
  assert.match(found, /HANDOFF\.md/);
  assert.match(found, /AGENTS\.md/);
  // Skipped sources are named, so an incomplete read is visible.
  assert.match(found, /ROADMAP\.md/);
  assert.match(found, /exceeds 65536 bytes/);
  // The presentation can never read as evidence that anything ran or was allowed to.
  assert.match(found, /None of this was approved and none of it ran/);
  assert.match(found, /No reviewer receives these commands/);
  assert.doesNotMatch(found, /pass(ed)?\b.*safeguard|safeguard.*pass(ed)?\b/i);
}
{
  // Choice 5: an empty result is reported plainly and the run carries on.
  const none = describeDiscovery({ status: "none", commands: [], files: [{ name: "AGENTS.md" }], skipped: [] });
  assert.match(none, /no .*command/i);
  assert.match(none, /grounds nothing|nothing .*grounded|ordinary review/i);
}
{
  // A root with no markdown at all is a project that documented nothing, and
  // says so differently from a pass that read files and found no command.
  const empty = describeDiscovery({ status: "none", commands: [], files: [], skipped: [] });
  assert.match(empty, /no instruction file|nothing to read|no such file/i);
}
{
  // A failed pass is reported as itself. Choice 5 keeps it out of coverage, so
  // the text must not claim the review is incomplete.
  const failed = describeDiscovery({
    status: "failed", commands: [], files: [{ name: "AGENTS.md" }], skipped: [],
    reason: "Discarded unusable discovery output: SyntaxError",
  });
  assert.match(failed, /SyntaxError/);
  assert.match(failed, /discovery/i);
  assert.doesNotMatch(failed, /incomplete coverage/i);
}
console.log("PASS discovery is presented with its source, its skipped files, and no claim that anything ran");

for (const root of roots) rmSync(root, { recursive: true, force: true });
