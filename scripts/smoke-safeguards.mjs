import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  approveSafeguards, citationRefusal, collectInstructionFiles, commandRefusal, describeApproval,
  describeDiscovery, describeExecution, discoveryEnvelope, discoveryInstructions, discoveryPrompt,
  executeSafeguards, instructionBudgetBytes, instructionFileMaxBytes, maxCommandLength,
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
  assert.match(found, /Nothing here has been approved and nothing has run/);
  assert.match(found, /asked next which of these may run/);
  assert.match(found, /no reviewer receives one/i);
  // V1c asks in this same run, so discovery may no longer defer the offer to a
  // later increment. Pull request #18's contracts reviewer caught exactly this.
  assert.doesNotMatch(found, /a later increment would offer to run/);
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

// V2a: the gates. A discovered command is offered only if code can run it
// without a shell, only if it is not one of the kinds a safeguard is never, and
// only if it really appears in the file it cites. Every refusal names itself,
// because a command that vanishes is indistinguishable from one nobody declared.

// Choice 3: no shell. Anything that needs one to mean what it says is refused
// rather than run, so the exclusions below can read a real argument list.
for (const [scenario, command] of [
  ["a chain", "npm run lint && npm test"],
  ["a pipe", "npm test | tee log"],
  ["a redirect", "npm test > out.txt"],
  ["a sequence", "npm test; npm run lint"],
  ["a background job", "npm test &"],
  ["a subshell", "(npm test)"],
  ["a substitution", "node scripts/run.mjs $(pwd)"],
  ["a backtick", "node scripts/run.mjs `pwd`"],
  ["a variable", "node scripts/smoke-$s.mjs"],
  ["a quoted argument", 'pytest -k "test suite"'],
  ["a glob", "eslint src/**/*.ts"],
  ["a home path", "~/bin/check"],
  ["a continuation", "npm test \\"],
  ["an empty command", "   "],
]) {
  assert(commandRefusal(command), scenario);
}
for (const runnable of [
  "npm test", "node scripts/smoke-safeguards.mjs", "pytest -q", "./gradlew check",
  "cargo test --all-features", "npm run test:unit", "go vet ./...",
  "mvn -B verify", "tsc --noEmit", "eslint src",
]) {
  assert.equal(commandRefusal(runnable), undefined, runnable);
}
// Choice 4: the exclusions, as a heuristic that refuses in code rather than
// warning. A safeguard never installs, migrates, deploys, publishes, formats in
// place, fixes, or watches, and it is never a program that changes the machine
// or the checkout out from under the review.
for (const [scenario, command] of [
  ["installing", "npm install"],
  ["a short install alias", "pnpm i"],
  ["a clean install", "npm ci"],
  ["adding a dependency", "yarn add left-pad"],
  ["updating", "npm update"],
  ["publishing", "npm publish"],
  ["deploying", "mvn deploy"],
  ["migrating", "npx prisma migrate"],
  ["a script named for a deploy", "npm run deploy"],
  ["an auto-fix flag", "eslint src --fix"],
  ["a write-in-place flag", "prettier src --write"],
  ["a watch flag", "jest --watch"],
  ["a short watch flag", "tsc -w"],
  ["a snapshot update", "jest -u"],
  ["forcing", "npm test --force"],
  ["a shell", "sh scripts/check.sh"],
  ["an environment wrapper", "env npm test"],
  ["a package runner that installs", "npx eslint src"],
  ["the version control the review must not touch", "git clean -xdf"],
  ["a GitHub write", "gh pr merge 18"],
  ["a privilege escalation", "sudo make check"],
  ["a fetch", "curl https://example.test/install.sh"],
  ["a container", "docker compose up"],
  ["a watcher", "nodemon scripts/check.mjs"],
  ["a runner that watches unless told not to", "vitest"],
  ["a placeholder", "node scripts/dogfood-review.mjs NUMBER --all"],
]) {
  assert(commandRefusal(command), scenario);
}
// The same runner told to run once rather than watch is a safeguard again.
assert.equal(commandRefusal("vitest run"), undefined);
assert.equal(commandRefusal("vitest --run --reporter=dot"), undefined);
// The refusal says which rule refused it, so a project can see what to change.
assert.match(commandRefusal("npm install"), /install/i);
assert.match(commandRefusal("npm run lint && npm test"), /shell/i);
console.log("PASS a command is refused unless code can run it without a shell and it is a safeguard at all");

// Choice 5: the citation check. Code proved only that the cited file was read;
// now it also proves the command is written there, as a whole command rather
// than as part of a longer one.
{
  const text = "Run `node scripts/smoke-safeguards.mjs` before each checkpoint.\nThen npm run test:unit.\n";
  assert.equal(citationRefusal("node scripts/smoke-safeguards.mjs", text), undefined);
  assert.equal(citationRefusal("npm run test:unit", text), undefined);
  // A command the file does not contain is a fabrication, whoever wrote it.
  assert(citationRefusal("npm test", text));
  // Not a fragment of a longer command either: `npm run test` is not declared
  // here, `npm run test:unit` is.
  assert(citationRefusal("npm run test", text));
  // A file this run never read cannot support any citation.
  assert(citationRefusal("npm test", undefined));
}
{
  // The case that ruled out an exact-quote check in V1c: this repository states
  // its suites inside a shell loop. The loop is refused by shape, and the
  // per-suite command it expands to is refused as uncited, so neither can be
  // assembled out of prose and offered.
  const loop = "for s in findings review; do node scripts/smoke-$s.mjs; done";
  assert(commandRefusal(loop));
  assert(citationRefusal("node scripts/smoke-findings.mjs", loop));
}
console.log("PASS a command must appear in the file it cites, as a whole command");

// V2a: execution. This is the first thing in this tool that runs pull-request
// controlled code on the user's machine, so what it does and what it refuses to
// do are both asserted here.

const script = (root, name, body) => { writeFileSync(join(root, name), body); return `node ${name}`; };
const fakeGit = (output = "") => async (args, cwd) => {
  assert.deepEqual(args, ["status", "--porcelain"]);
  assert.equal(typeof cwd, "string");
  return output;
};
const approvalOf = (commands) => ({ status: "approved", approved: commands, offered: commands.length, refused: 0 });
const run = (approved, options = {}) => executeSafeguards(approvalOf(approved), {
  root: options.root, controller: options.controller ?? new AbortController(),
  git: options.git ?? fakeGit(), ...options,
});

{
  // A safeguard that passes, and one that fails, in the order they were
  // approved. Both are reported with their exit status and their output, and a
  // failing one never stops the next from running.
  const root = project({});
  const pass = script(root, "pass.mjs", "console.log('42 checks passed');");
  const fail = script(root, "fail.mjs", "console.error('one check failed'); process.exit(3);");
  const execution = await run([
    { command: pass, file: "AGENTS.md" }, { command: fail, file: "AGENTS.md" },
  ], { root });
  assert.equal(execution.status, "failed", "One failed safeguard makes the whole execution failed");
  assert.equal(execution.results.length, 2);
  assert.equal(execution.results[0].status, "passed");
  assert.equal(execution.results[0].code, 0);
  assert.match(execution.results[0].stdout, /42 checks passed/);
  assert.equal(execution.results[1].status, "failed");
  assert.equal(execution.results[1].code, 3);
  assert.match(execution.results[1].stderr, /one check failed/);
  assert.deepEqual(execution.results.map(({ command }) => command), [pass, fail]);
  assert(execution.results.every(({ milliseconds }) => Number.isInteger(milliseconds)));
}
{
  // A command that is not there at all fails as itself rather than taking the
  // run down with it.
  const root = project({});
  const execution = await run([{ command: "node no-such-check.mjs", file: "AGENTS.md" }], { root });
  assert.equal(execution.status, "failed");
  assert.equal(execution.results[0].status, "failed");
  assert.notEqual(execution.results[0].code, 0);
}
{
  // The gate is asserted again in the moment before the spawn, so an approved
  // entry that could not pass it now is refused rather than run. Approval is
  // the person's decision; this is the code's, and it is the one that spawns.
  const root = project({});
  const execution = await run([
    { command: "mvn deploy", file: "AGENTS.md" },
    { command: "npm test && npm run lint", file: "AGENTS.md" },
  ], { root });
  assert.equal(execution.status, "failed");
  assert(execution.results.every(({ status }) => status === "refused"));
  assert.match(execution.results[0].error, /deploy/i);
  assert.match(execution.results[1].error, /shell/i);
}
{
  // Nothing approved is nothing run, and no process is started to discover that.
  for (const approval of [
    { status: "none", approved: [], offered: 2, refused: 0 },
    { status: "unavailable", approved: [], offered: 2, refused: 0 },
    { status: "not-started", approved: [], offered: 0, refused: 0 },
    { status: "failed", approved: [], offered: 2, refused: 0, error: "invalid answer" },
  ]) {
    const execution = await executeSafeguards(approval, {
      root: project({}), controller: new AbortController(), git: fakeGit(),
    });
    assert.equal(execution.status, "not-started", approval.status);
    assert.deepEqual(execution.results, []);
  }
}
{
  // Output is bounded rather than unbounded, and a bound that is reached is
  // stated rather than hidden. Reaching it never kills a safeguard that is
  // otherwise passing: a chatty suite is not a failing one.
  const root = project({});
  const chatty = script(root, "chatty.mjs", "for (let i = 0; i < 400; i++) console.log('x'.repeat(100));");
  const execution = await run([{ command: chatty, file: "AGENTS.md" }], { root, captureBytes: 1024 });
  assert.equal(execution.results[0].status, "passed");
  assert.equal(execution.results[0].code, 0);
  assert(execution.results[0].stdout.length <= 1024);
  assert.deepEqual(execution.results[0].truncated, ["stdout"]);
}
{
  // SCOPE.md asks for artifacts as well as evidence. Running project code can
  // leave files behind, and the preflight has already proven the tree was clean,
  // so one status read afterwards says exactly what running it changed. Nothing
  // is cleaned, reverted or stashed.
  const root = project({});
  const writer = script(root, "writer.mjs", "console.log('wrote');");
  const execution = await run([{ command: writer, file: "AGENTS.md" }],
    { root, git: fakeGit("?? build.log\n M src/example.js\n") });
  assert.deepEqual(execution.artifacts.paths, ["?? build.log", " M src/example.js"]);
  const clean = await run([{ command: writer, file: "AGENTS.md" }], { root });
  assert.deepEqual(clean.artifacts.paths, []);
}
{
  // A status read that fails is reported, and does not turn a passing safeguard
  // into a failing one.
  const root = project({});
  const writer = script(root, "writer.mjs", "console.log('wrote');");
  const execution = await run([{ command: writer, file: "AGENTS.md" }], {
    root, git: async () => { throw new Error("git is unavailable"); },
  });
  assert.equal(execution.status, "passed");
  assert.match(execution.artifacts.error, /git is unavailable/);
}
{
  // A run cancelled before execution starts nothing at all.
  const controller = new AbortController();
  controller.abort(new DOMException("cancelled before execution", "AbortError"));
  const root = project({});
  const marker = join(root, "should-not-exist");
  const execution = await run([
    { command: script(root, "touch.cjs", `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'x');`),
      file: "AGENTS.md" },
  ], { root, controller });
  assert.equal(execution.status, "cancelled");
  assert.deepEqual(execution.results, []);
  assert.throws(() => readFileSync(marker));
}
{
  // Cancelling during a safeguard kills it, and every process it started with
  // it. There is no timeout anywhere in this: the only thing that ends a
  // running safeguard is the person who cancels the review.
  const root = project({});
  writeFileSync(join(root, "child.cjs"), "setTimeout(() => {}, 120000);");
  writeFileSync(join(root, "parent.cjs"), [
    "const { spawn } = require('node:child_process');",
    "const { writeFileSync } = require('node:fs');",
    "const child = spawn(process.execPath, ['child.cjs'], { cwd: __dirname, stdio: 'ignore' });",
    `writeFileSync(${JSON.stringify(join(root, "child.pid"))}, String(child.pid));`,
    "setTimeout(() => {}, 120000);",
  ].join("\n"));
  const controller = new AbortController();
  const started = Date.now();
  const pending = run([{ command: "node parent.cjs", file: "AGENTS.md" },
    { command: "node parent.cjs", file: "AGENTS.md" }], { root, controller });
  const pidFile = join(root, "child.pid");
  for (let waited = 0; waited < 5000 && !existsSync(pidFile); waited += 25) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  const grandchild = Number(readFileSync(pidFile, "utf8"));
  assert(Number.isInteger(grandchild) && grandchild > 0, "The safeguard really started a process of its own");
  process.kill(grandchild, 0);
  controller.abort(new DOMException("cancelled during execution", "AbortError"));
  const execution = await pending;
  assert.equal(execution.status, "cancelled");
  assert.equal(execution.results[0].status, "cancelled");
  assert.equal(execution.results.length, 1, "A cancelled run starts no further safeguard");
  assert(Date.now() - started < 60000, "Cancellation does not wait for the safeguard to finish on its own");
  let alive = true;
  for (let waited = 0; waited < 5000 && alive; waited += 25) {
    try { process.kill(grandchild, 0); await new Promise((resolve) => setTimeout(resolve, 25)); }
    catch { alive = false; }
  }
  assert.equal(alive, false, "Cancelling kills the whole process group, not only the command itself");
}
console.log("PASS an approved safeguard runs, is bounded, is re-checked before it spawns, and is killable");

// Presentation. What ran, what it said, and what it changed. It must never read
// as a claim about the review's own coverage: a safeguard grounds no finding in
// this increment, so a failing one cannot make the review less complete.
{
  const described = describeExecution({
    status: "failed",
    results: [
      { command: "node check.mjs", file: "AGENTS.md", status: "passed", code: 0, milliseconds: 12,
        stdout: "42 checks passed\n", stderr: "", truncated: [] },
      { command: "node lint.mjs", file: "AGENTS.md", status: "failed", code: 3, milliseconds: 40,
        stdout: "", stderr: "one check failed\n", truncated: [] },
      { command: "mvn deploy", file: "AGENTS.md", status: "refused", error: "`deploy` is not a check" },
    ],
    artifacts: { paths: ["?? build.log"] },
  });
  assert.match(described, /^V2a safeguard execution/);
  assert.match(described, /node check\.mjs/);
  assert.match(described, /42 checks passed/);
  assert.match(described, /one check failed/);
  assert.match(described, /exit 3/);
  assert.match(described, /\?\? build\.log/);
  assert.match(described, /deploy` is not a check/);
  // The rule this increment settled, in the text the user reads.
  assert.match(described, /not review coverage|does not.*coverage/i);
  assert.doesNotMatch(described, /incomplete coverage/i);
  // A safeguard grounds no finding here, so nothing may suggest a reviewer saw it.
  assert.doesNotMatch(described, /reviewer .*(saw|received|used)/i);
}
for (const [scenario, execution] of [
  ["nothing approved", { status: "not-started", results: [] }],
  ["a cancelled execution", { status: "cancelled", results: [
    { command: "node check.mjs", file: "AGENTS.md", status: "cancelled", milliseconds: 5, stdout: "", stderr: "",
      truncated: [] }] }],
  ["output that was truncated", { status: "passed", results: [
    { command: "node check.mjs", file: "AGENTS.md", status: "passed", code: 0, milliseconds: 5,
      stdout: "x".repeat(100), stderr: "", truncated: ["stdout"] }] }],
  ["artifacts that could not be read", { status: "passed", results: [], artifacts: { error: "git failed" } }],
]) {
  const described = describeExecution(execution);
  assert.match(described, /^V2a safeguard execution/, scenario);
  assert.doesNotMatch(described, /incomplete coverage/i, scenario);
}
assert.match(describeExecution({ status: "passed", results: [
  { command: "node check.mjs", file: "AGENTS.md", status: "passed", code: 0, milliseconds: 5,
    stdout: "x".repeat(100), stderr: "", truncated: ["stdout"] }] }), /truncat/i);
assert.match(describeExecution({ status: "not-started", results: [] }), /nothing was approved|no command/i);
console.log("PASS execution is presented with its evidence and its artifacts, and never as review coverage");

// V2a executes, so the module may spawn. What it may never do is open a shell:
// choice 3 is worth nothing if any path here can reach one.
{
  const source = readFileSync(new URL("../extensions/pr-review/safeguards.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /shell:\s*true|execSync|spawnSync|\/bin\/(sh|bash)/);
  assert.match(source, /\bspawn\b/, "V2a executes, so the module spawns exactly one kind of process");
}
console.log("PASS the safeguard module can spawn a process, and can never open a shell");

for (const root of roots) rmSync(root, { recursive: true, force: true });
