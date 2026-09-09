import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  approveSafeguards, collectInstructionFiles, describeApproval, describeDiscovery, discoveryEnvelope,
  discoveryInstructions, discoveryPrompt, instructionBudgetBytes, instructionFileMaxBytes, maxCommandLength,
  maxDiscoveredCommands,
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
  ["an escape sequence in the command", body([{ command: "npm test\u001b[2J", file: "AGENTS.md" }]), /single line|control/i],
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

// V1c: command approval. A run that has discovered commands asks which of them
// may run, records that answer, and still executes nothing. Approval is per
// command, it is never granted by a flag or by configuration, and it does not
// survive the run. Nothing here filters the discovered list: the exclusions and
// the citation check belong to the increment that executes, where they guard
// something real rather than a command nothing can run.

const approvalBinding = {
  repository: { id: "repo", host: "github.com", nameWithOwner: "fixture/repository" },
  number: 18, pullId: "pull-18", head: "b".repeat(40), base: "a".repeat(40),
  diffSha256: "diff", contextSha256: "context", paths: [],
};
// One safeguard and one command that plainly is not a safeguard. V1c offers
// both, because nothing it can approve is able to run.
const declared = [
  { command: "node scripts/smoke-findings.mjs", file: "HANDOFF.md" },
  { command: "mvn deploy", file: "AGENTS.md" },
];
const foundDiscovery = {
  status: "found", commands: declared, files: [{ name: "AGENTS.md" }, { name: "HANDOFF.md" }], skipped: [],
};

function approvalFixture({ answer = () => ({ action: "decline" }), ui = true, discovery = foundDiscovery,
  sessionId = "parent-session", controller = new AbortController() } = {}) {
  const invocation = { invocationId: randomUUID(), sessionId };
  const requests = [];
  const parent = {
    sessionId: "parent-session", capabilities: { ui: { elicitation: ui } },
    ui: { async elicitation(request) { requests.push(request); return answer(request); } },
  };
  return {
    parent, controller, requests, invocation,
    approve: () => approveSafeguards(parent, discovery, { invocation, binding: approvalBinding, controller }),
  };
}
const offered = (request) => request.requestedSchema.properties.commands.items.anyOf;
const accepted = (commands) => ({ action: "accept", content: { commands } });

{
  // Per command, and the recorded answer keeps the order the commands were
  // discovered in rather than the order they were picked.
  const fixture = approvalFixture({
    answer: (request) => accepted([offered(request)[1].const, offered(request)[0].const]),
  });
  const approval = await fixture.approve();
  assert.equal(approval.status, "approved");
  assert.deepEqual(approval.approved, declared);
  assert.equal(approval.offered, 2);
  // Each choice is scoped to this invocation, so a late answer from another run
  // cannot approve a command by its position in this one.
  assert(offered(fixture.requests[0]).every(({ const: value }) =>
    value.startsWith(`${fixture.invocation.invocationId}:`)));
  // A choice carries the command and the file it was declared in, which is the
  // whole of what V1b can stand behind about it.
  assert.deepEqual(offered(fixture.requests[0]).map(({ title }) => title),
    ["node scripts/smoke-findings.mjs  [declared in HANDOFF.md]", "mvn deploy  [declared in AGENTS.md]"]);
  // The question must never read as though approving were running.
  assert.match(fixture.requests[0].message, /nothing .*(runs|ran|executed)|no command .*(runs|is run|executed)/i);
  assert.match(fixture.requests[0].message, /fixture\/repository#18/);
  assert.match(fixture.requests[0].message, new RegExp(approvalBinding.head));
}
{
  // Approving a subset is the point of asking per command.
  const fixture = approvalFixture({ answer: (request) => accepted([offered(request)[0].const]) });
  const approval = await fixture.approve();
  assert.equal(approval.status, "approved");
  assert.deepEqual(approval.approved, [declared[0]]);
  assert.equal(approval.offered, 2);
}
for (const [scenario, answer] of [
  ["accepting no choice", () => accepted([])],
  ["declining", () => ({ action: "decline" })],
]) {
  const approval = await approvalFixture({ answer }).approve();
  assert.equal(approval.status, "none", scenario);
  assert.deepEqual(approval.approved, [], scenario);
}
{
  // Cancelling the approval cancels the run, exactly as cancelling finding
  // selection does. Nothing afterwards may treat it as an answer.
  const fixture = approvalFixture({ answer: () => ({ action: "cancel" }) });
  const approval = await fixture.approve();
  assert.equal(approval.status, "cancelled");
  assert.deepEqual(approval.approved, []);
  assert.equal(fixture.controller.signal.aborted, true);
}
{
  // A host with no approval UI approves nothing and says so, the way finding
  // selection reports itself unavailable. There is deliberately no flag that
  // approves unattended, so there is nothing to suggest instead.
  const fixture = approvalFixture({ ui: false });
  const approval = await fixture.approve();
  assert.equal(approval.status, "unavailable");
  assert.deepEqual(approval.approved, []);
  assert.equal(fixture.requests.length, 0);
  assert.match(approval.error, /approval/i);
}
for (const [scenario, answer] of [
  ["an unknown choice value", () => accepted(["stale-invocation:0"])],
  ["a duplicate choice", (request) => accepted([offered(request)[0].const, offered(request)[0].const])],
  ["an extra field", () => ({ action: "accept", content: { commands: [], all: true } })],
  ["an answer that is not an array", () => accepted("all")],
  ["no content at all", () => ({ action: "accept" })],
  ["an unknown action", () => ({ action: "approve-everything" })],
]) {
  // An answer that code cannot account for approves nothing. Failing open here
  // is the one mistake this gate exists to prevent.
  const approval = await approvalFixture({ answer }).approve();
  assert.equal(approval.status, "failed", scenario);
  assert.deepEqual(approval.approved, [], scenario);
}
{
  // A choice minted for another invocation is refused even though the same
  // position exists in this one.
  const other = approvalFixture();
  const fixture = approvalFixture({ answer: () => accepted([`${other.invocation.invocationId}:0`]) });
  assert.equal((await fixture.approve()).status, "failed");
}
{
  // The approval belongs to the session that discovered the commands.
  const fixture = approvalFixture({ sessionId: "other-session" });
  const approval = await fixture.approve();
  assert.equal(approval.status, "failed");
  assert.equal(fixture.requests.length, 0);
}
for (const discovery of [
  { status: "none", commands: [], files: [], skipped: [] },
  { status: "none", commands: [], files: [{ name: "AGENTS.md" }], skipped: [] },
  { status: "failed", commands: [], files: [{ name: "AGENTS.md" }], skipped: [], reason: "pass failed" },
]) {
  // Nothing to approve is not a question worth asking, and a failed discovery
  // has produced no list that anyone could answer about.
  const fixture = approvalFixture({ discovery });
  const approval = await fixture.approve();
  assert.equal(approval.status, "not-started");
  assert.deepEqual(approval.approved, []);
  assert.equal(approval.offered, 0);
  assert.equal(fixture.requests.length, 0);
}
{
  // A run already cancelled asks nothing.
  const controller = new AbortController();
  controller.abort(new DOMException("cancelled before approval", "AbortError"));
  const fixture = approvalFixture({ controller });
  assert.equal((await fixture.approve()).status, "cancelled");
  assert.equal(fixture.requests.length, 0);
}
console.log("PASS approval is asked per command, bound to its invocation, and approves nothing it cannot account for");

// Presentation. Every status says plainly that nothing ran, and none of them
// may claim the review itself is incomplete: approval is not review coverage.
for (const [scenario, approval] of [
  ["an approved subset", { status: "approved", approved: [declared[0]], offered: 2 }],
  ["nothing approved", { status: "none", approved: [], offered: 2 }],
  ["no approval UI", { status: "unavailable", approved: [], offered: 2, error: "This host has no approval UI." }],
  ["a cancelled approval", { status: "cancelled", approved: [], offered: 2 }],
  ["a failed approval", { status: "failed", approved: [], offered: 2, error: "Invalid approval answer" }],
  ["nothing to approve", { status: "not-started", approved: [], offered: 0 }],
]) {
  const described = describeApproval(approval);
  assert.match(described, /^V1c safeguard approval/, scenario);
  assert.match(described, /nothing ran|no command ran|nothing was executed/i, scenario);
  assert.doesNotMatch(described, /incomplete coverage/i, scenario);
}
{
  const described = describeApproval({ status: "approved", approved: declared, offered: 2 });
  assert.match(described, /node scripts\/smoke-findings\.mjs {2}\[declared in HANDOFF\.md\]/);
  assert.match(described, /mvn deploy {2}\[declared in AGENTS\.md\]/);
  assert.match(described, /2 of 2/);
  // No exclusion rule exists, so the presentation must never imply a command
  // was vetted by anything other than the person who approved it.
  assert.doesNotMatch(described, /vetted|safe to run|checked for/i);
}
assert.match(describeApproval({ status: "failed", approved: [], offered: 2, error: "Invalid approval answer" }),
  /Invalid approval answer/);
console.log("PASS an approval is presented as an approval, never as evidence that a command ran");

// V1c executes nothing, and this keeps it that way while the increment that
// will execute is still ahead: a module that cannot spawn a process cannot run
// a discovered command by accident.
assert.doesNotMatch(readFileSync(new URL("../extensions/pr-review/safeguards.mjs", import.meta.url), "utf8"),
  /child_process|execFile|spawnSync|\bspawn\(/);
console.log("PASS the safeguard module cannot spawn a process at all");

for (const root of roots) rmSync(root, { recursive: true, force: true });
