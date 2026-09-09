import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  collectInstructionFiles, instructionBudgetBytes, instructionFileMaxBytes,
} from "../extensions/pr-review/safeguards.mjs";

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

for (const root of roots) rmSync(root, { recursive: true, force: true });
