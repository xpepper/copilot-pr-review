import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  configFilename, configSchemaVersion, configDirectoryName, sessionStateDirectoryName,
} from "../extensions/pr-review/config.mjs";
import {
  projectConfigSegments, projectSchemaVersion, trustFilename, trustSchemaVersion,
} from "../extensions/pr-review/project.mjs";
import { prepareTargetSmoke } from "./runtime-target.mjs";
import { assertExited, descendants } from "./runtime-fixture.mjs";

const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
assert(sdkPath && cliPath, "Set COPILOT_SDK_PATH and COPILOT_CLI_PATH");
const { CopilotClient, RuntimeConnection } = await import(pathToFileURL(resolve(sdkPath, "index.js")).href);

const settings = {
  model: process.env.PR_REVIEW_HEAVY_MODEL,
  reasoningEffort: process.env.PR_REVIEW_HEAVY_EFFORT,
};
// The ambient assignment is session configuration, not inference: no prompt is
// ever sent, so this probe spends no Copilot credits.
assert(Object.values(settings).every((value) => value && !/\s/.test(value)),
  "Set PR_REVIEW_HEAVY_MODEL and PR_REVIEW_HEAVY_EFFORT to give this session an ambient assignment");
const target = await prepareTargetSmoke();
let confirmation = Promise.withResolvers();
let pending = Promise.withResolvers();
const options = {
  enableExperimentalMode: true, enableConfigDiscovery: true, requestExtensions: true,
  availableTools: [], onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
  ...settings, ...target.sessionOptions,
  // C2 reads a project file from the reviewed working directory, so the session
  // must run in the controlled fixture checkout rather than this repository.
  workingDirectory: target.quickTarget.workingDirectory,
  // A closed-PR confirmation that never answers keeps a quick review active
  // without starting any reviewer runtime or spending inference.
  onElicitationRequest: async (request) => {
    pending.resolve(request);
    return confirmation.promise;
  },
};
let client;
let restore;
async function stop() {
  if (!client) return;
  const errors = await client.stop();
  client = undefined;
  assert.deepEqual(errors, []);
}
async function run(session, args, commandName = "pr-review-config") {
  const before = (await session.getEvents()).length;
  const processes = await descendants();
  const result = await session.rpc.commands.execute({ commandName, args });
  const events = (await session.getEvents()).slice(before);
  assert(!events.some((event) => event.type === "user.message" || event.type.startsWith("assistant.") ||
    event.type.startsWith("subagent.") || event.type === "tool.execution_start"),
  `Configuration must start no inference: ${args}`);
  if (commandName === "pr-review-config") {
    assert.deepEqual(await descendants(), processes, "Configuration must start no owned work");
  }
  return {
    error: result.error,
    messages: events.filter((event) => ["session.info", "session.error"].includes(event.type))
      .map((event) => event.data.message),
  };
}
async function quickRun(session, args) {
  const before = (await session.getEvents()).length;
  const settled = Promise.withResolvers();
  const unsubscribe = session.on((event) => {
    if (!["session.info", "session.error"].includes(event.type)) return;
    // P2 evidence is logged after the run slot is cleared, so it is the point
    // at which another command may be dispatched.
    if (event.data.message.startsWith("P2 evidence: ")) settled.resolve(event.data.message);
    if (event.data.message.startsWith("Review/publication failed:")) settled.reject(new Error(event.data.message));
  });
  try {
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.equal(result.error, undefined, `quick dispatch failed: ${result.error}`);
    await settled.promise;
  } finally { unsubscribe(); }
  const events = (await session.getEvents()).slice(before);
  assert(!events.some((event) => event.type === "user.message" || event.type.startsWith("assistant.") ||
    event.type.startsWith("subagent.") || event.type === "tool.execution_start"),
  "A skipped quick target must start no inference");
  return events.filter((event) => ["session.info", "session.error"].includes(event.type))
    .map((event) => event.data.message);
}
async function show(session) {
  const result = await run(session, "show");
  assert.equal(result.error, undefined, `show failed: ${result.error}`);
  const report = result.messages.find((message) => message.startsWith("Personal PR review configuration"));
  assert(report, "show must report the personal configuration");
  return report;
}
async function reload(session) {
  const before = await descendants();
  await session.rpc.extensions.reload();
  const { extensions } = await session.rpc.extensions.list();
  assert.equal(extensions.find((entry) => entry.id.startsWith("plugin:copilot-pr-review:"))?.status, "running");
  const after = await descendants();
  await assertExited(before.filter((entry) => !after.some((current) => current.pid === entry.pid)));
}
try {
  client = new CopilotClient({ connection: RuntimeConnection.forStdio({ path: resolve(cliPath) }) });
  const session = await client.createSession(options);
  await reload(session);

  const { commands } = await session.rpc.commands.list();
  assert(commands.some((command) => command.name === "pr-review"), "The review command stays registered");
  assert(commands.some((command) => command.name === "pr-review-config"),
    "The plugin extension registers a second slash command");
  console.log("PASS both /pr-review and /pr-review-config are registered by one extension");

  const metadata = await session.rpc.metadata.snapshot();
  assert.equal(basename(dirname(metadata.workspacePath)), sessionStateDirectoryName);
  const home = dirname(dirname(metadata.workspacePath));
  const filename = join(home, configDirectoryName, configFilename);
  const trustPath = join(home, configDirectoryName, trustFilename);
  const projectFile = join(target.quickTarget.workingDirectory, ...projectConfigSegments);
  const directoryExisted = existsSync(dirname(filename));
  const snapshots = [filename, trustPath].map((path) => ({
    path, existed: existsSync(path), original: existsSync(path) ? readFileSync(path, "utf8") : undefined,
  }));
  const existed = snapshots[0].existed;
  restore = () => {
    // Every probe write to the real personal store is snapshotted and restored,
    // and the project file lives only in the disposable fixture checkout.
    rmSync(join(target.quickTarget.workingDirectory, ".copilot"), { recursive: true, force: true });
    for (const snapshot of snapshots) {
      if (snapshot.existed) writeFileSync(snapshot.path, snapshot.original, { mode: 0o600 });
      else rmSync(snapshot.path, { force: true });
    }
    if (!directoryExisted && existsSync(dirname(filename)) && !readdirSync(dirname(filename)).length) {
      rmSync(dirname(filename), { recursive: true });
    }
  };
  const writeProject = (record) => {
    mkdirSync(dirname(projectFile), { recursive: true });
    writeFileSync(projectFile, typeof record === "string" ? record : JSON.stringify(record, null, 2));
  };
  assert(!filename.startsWith(`${target.quickTarget.workingDirectory}/`),
    "Personal configuration lives outside the reviewed checkout");
  assert.equal((await session.rpc.metadata.snapshot()).workingDirectory, target.quickTarget.workingDirectory);
  console.log(`C1 personal configuration location: ${filename} ` +
    `(pre-existing=${existed}, trust record pre-existing=${snapshots[1].existed})`);

  const tracePath = process.env.PR_REVIEW_SMOKE_TRACE;
  const traceBefore = await readFile(tracePath, "utf8");
  const current = await session.rpc.model.getCurrent();
  const { list } = await session.rpc.model.list();
  const ambient = list.find((model) => model.id === current.modelId);
  const efforts = ambient?.capabilities?.supports?.reasoning_effort ?? [];
  assert(efforts.includes(current.reasoningEffort), "The ambient session model must report its own effort");
  const other = efforts.find((effort) => effort !== current.reasoningEffort);
  assert(other, "This probe needs a second supported reasoning effort");

  const initial = await show(session);
  assert.match(initial, /not created yet/);
  assert(initial.includes(`heavy: model=${current.modelId} [ambient] reasoning=${current.reasoningEffort} [ambient]`),
    `Unset tiers report the ambient assignment: ${initial}`);
  assert.match(initial, /autoPostReviews: false \[default\]/);
  assert(!existsSync(filename), "Inspection creates nothing");

  for (const [args, expected] of [
    ["nope=1", /unknown configuration key/],
    ["heavyModel", /malformed argument/],
    ["heavyModel=", /requires a value/],
    ["autoPostReviews=yes", /accepts only true or false/],
    ["heavyModel=definitely-not-a-model", /Unavailable or disabled Copilot-subscription model/],
    [`heavyEffort=definitely-not-an-effort`, /Unsupported reasoning effort/],
    ["unset", /unset requires at least one/],
    ["show extra", /takes no further arguments/],
  ]) {
    const result = await run(session, args);
    assert.match(result.error ?? "", expected, args);
    assert(!existsSync(filename), `A refused update writes nothing: ${args}`);
  }
  console.log("PASS native unknown keys, malformed assignments and unsupported models/efforts refused without substitution");

  const set = await run(session, `lightModel=${current.modelId} lightEffort=${other} autoPostReviews=true`);
  assert.equal(set.error, undefined, `set failed: ${set.error}`);
  assert.deepEqual(JSON.parse(readFileSync(filename, "utf8")), {
    schemaVersion: configSchemaVersion,
    settings: { lightModel: current.modelId, lightEffort: other, autoPostReviews: true },
  });
  await reload(session);
  const stored = await show(session);
  assert(stored.includes(`heavy: model=${current.modelId} [inherited:light] reasoning=${other} [inherited:light]`),
    `The reloaded extension inherits the stored light tier: ${stored}`);
  assert.match(stored, /autoPostReviews: true \[configured\]/);
  assert.equal(await readFile(tracePath, "utf8"), traceBefore,
    "Configuration inspection and updates make no GitHub request");
  console.log("PASS stored settings survive an extension reload and drive the unset heavy tier with no gh request");

  const effective = await quickRun(session, "2 --quick --no-comment");
  const invocation = effective.find((message) =>
    message.startsWith("Effective PR review configuration for this invocation."));
  assert(invocation, "Quick review displays its effective assignments before execution");
  assert(invocation.includes(`heavy: model=${current.modelId} [inherited:light] reasoning=${other} [inherited:light]`),
    `Saved tiers drive the quick heavy assignment: ${invocation}`);
  assert.match(invocation, /autoPostReviews: true \[configured\]/);

  const overridden = await quickRun(session, `2 --quick --no-comment heavyEffort=${current.reasoningEffort}`);
  const flagged = overridden.find((message) =>
    message.startsWith("Effective PR review configuration for this invocation."));
  assert(flagged.includes(`reasoning=${current.reasoningEffort} [flag]`), `Flags override saved settings: ${flagged}`);
  assert.deepEqual(JSON.parse(readFileSync(filename, "utf8")).settings,
    { lightModel: current.modelId, lightEffort: other, autoPostReviews: true },
    "An invocation flag never rewrites the saved configuration");
  console.log("PASS saved tiers drive a real quick invocation and invocation flags override them without rewriting the file");

  // Balanced consumes the light tier, so the saved light assignment must be the
  // one the overview reviewer would run, with its origin visible beforehand.
  const balanced = (await quickRun(session, "2 --balanced --no-comment")).find((message) =>
    message.startsWith("Effective reviewer assignments:"));
  assert(balanced, "A balanced review displays its per-reviewer assignments before execution");
  assert.match(balanced, /balanced mode, 5 reviewer\(s\)/);
  assert(balanced.includes(
    `overview [light]: model=${current.modelId} [configured:light] reasoning=${other} [configured:light]`),
  `The saved light tier drives the balanced overview reviewer: ${balanced}`);
  assert(balanced.includes(
    `correctness [heavy]: model=${current.modelId} [inherited:light] reasoning=${other} [inherited:light]`),
  `The heavy specialists still inherit the nearest configured tier: ${balanced}`);
  console.log("PASS the saved light tier drives the balanced overview reviewer without inference");

  // Full adds the medium conventions reviewer, so a saved medium tier must be
  // the one it resolves, distinct from the saved light tier beside it.
  const setMedium = await run(session, `mediumModel=${current.modelId} mediumEffort=${current.reasoningEffort}`);
  assert.equal(setMedium.error, undefined, `set failed: ${setMedium.error}`);
  const full = (await quickRun(session, "2 --full --no-comment")).find((message) =>
    message.startsWith("Effective reviewer assignments:"));
  assert(full, "A full review displays its per-reviewer assignments before execution");
  assert.match(full, /full mode, 6 reviewer\(s\)/);
  assert.match(full, /findings policy: P0-P2 findings, plus every substantiated P3\/nit finding/);
  assert(full.includes(`conventions-maintainability [medium]: model=${current.modelId} ` +
    `[configured:medium] reasoning=${current.reasoningEffort} [configured:medium]`),
  `The saved medium tier drives the full conventions reviewer: ${full}`);
  assert(full.includes(
    `overview [light]: model=${current.modelId} [configured:light] reasoning=${other} [configured:light]`),
  `The light overview reviewer keeps its own saved tier: ${full}`);
  assert(full.includes(`correctness [heavy]: model=${current.modelId} ` +
    `[inherited:medium] reasoning=${current.reasoningEffort} [inherited:medium]`),
  `An unset heavy tier now inherits the nearer medium tier: ${full}`);
  const unsetMedium = await run(session, "unset mediumModel mediumEffort");
  assert.equal(unsetMedium.error, undefined, `unset failed: ${unsetMedium.error}`);
  assert.deepEqual(JSON.parse(readFileSync(filename, "utf8")).settings,
    { lightModel: current.modelId, lightEffort: other, autoPostReviews: true },
    "Unsetting the medium tier leaves the rest of the saved configuration untouched");
  console.log("PASS the saved medium tier drives the full conventions reviewer without inference");

  writeFileSync(filename, JSON.stringify({ schemaVersion: configSchemaVersion,
    settings: { heavyModel: "definitely-not-a-model" } }), { mode: 0o600 });
  const refused = await run(session, "2 --quick --no-comment", "pr-review");
  assert.match(refused.error ?? "", /Unavailable or disabled Copilot-subscription model/,
    "An unusable saved model refuses the review instead of substituting one");
  writeFileSync(filename, "{ not json", { mode: 0o600 });
  assert.match((await run(session, "2 --quick --no-comment", "pr-review")).error ?? "", /not valid JSON/);
  assert.match((await run(session, "show")).error ?? "", /not valid JSON/);
  writeFileSync(filename, JSON.stringify({ schemaVersion: 99, settings: {} }), { mode: 0o600 });
  assert.match((await run(session, "show")).error ?? "", /incompatible schema version/);
  assert.match((await run(session, "autoPostReviews=false")).error ?? "", /incompatible schema version/);
  assert.equal(JSON.parse(readFileSync(filename, "utf8")).schemaVersion, 99, "A refused command rewrites nothing");
  rmSync(filename);
  console.log("PASS malformed and incompatible stored settings are explicit errors that refuse review and update");

  // A closed PR needing confirmation keeps the review active with no reviewer
  // runtime, so configuration must be refused while that work holds the slot.
  const held = await run(session, "5 --quick --no-comment", "pr-review");
  assert.equal(held.error, undefined, `held dispatch failed: ${held.error}`);
  await pending.promise;
  for (const args of ["show", "autoPostReviews=true"]) {
    assert.match((await run(session, args)).error ?? "", /A review is already running in this session/, args);
  }
  assert(!existsSync(filename), "A refused configuration update during a review writes nothing");
  confirmation.resolve({ action: "accept", content: { confirmed: false } });
  const settled = Promise.withResolvers();
  const unsubscribe = session.on((event) => {
    if (!["session.info", "session.error"].includes(event.type)) return;
    if (event.data.message.startsWith("P2 evidence: ")) settled.resolve(event.data.message);
    if (event.data.message.startsWith("Review/publication failed:")) settled.reject(new Error(event.data.message));
  });
  try { await settled.promise; } finally { unsubscribe(); }
  confirmation = Promise.withResolvers();
  pending = Promise.withResolvers();
  assert.match(await show(session), /not created yet/);
  console.log("PASS configuration is refused while review work holds the session slot, and works again once it settles");


  // --- C2: explicitly trusted project overrides ------------------------------
  const canonicalWorkingDirectory = realpathSync(target.quickTarget.workingDirectory);
  const personalSet = await run(session, `heavyModel=${current.modelId} heavyEffort=${other}`);
  assert.equal(personalSet.error, undefined, `personal set failed: ${personalSet.error}`);
  const personalBytes = readFileSync(filename, "utf8");
  writeProject({
    schemaVersion: projectSchemaVersion,
    settings: { heavyEffort: current.reasoningEffort, autoPostReviews: true },
  });
  const projectBytes = readFileSync(projectFile, "utf8");

  const ignored = await show(session);
  assert.match(ignored, /Project trust: NOT TRUSTED/);
  assert(ignored.includes(`Project configuration: IGNORED. ${projectFile}`), ignored);
  assert(ignored.includes(`heavy: model=${current.modelId} [configured:heavy] reasoning=${other} [configured:heavy]`),
    `An untrusted project file changes no assignment: ${ignored}`);
  assert.match(ignored, /autoPostReviews: false \[default\]/);
  assert(!existsSync(trustPath), "An untrusted repository's file creates no trust record");

  // Whatever a repository writes into its own file, it cannot become trusted.
  for (const selfTrust of [
    { schemaVersion: projectSchemaVersion, settings: {},
      trustedProjects: [{ path: canonicalWorkingDirectory, trustedAt: new Date().toISOString() }] },
    { schemaVersion: projectSchemaVersion, settings: { trustedProjects: [] } },
  ]) {
    writeProject(selfTrust);
    assert.match(await show(session), /Project trust: NOT TRUSTED/);
    assert(!existsSync(trustPath), "A repository cannot record its own trust");
    const tolerated = (await quickRun(session, "2 --quick --no-comment")).find((message) =>
      message.startsWith("Effective PR review configuration for this invocation."));
    assert.match(tolerated, /Project configuration: IGNORED/,
      "An untrusted repository's file is never parsed, so it cannot even fail a review");
  }
  writeProject(projectBytes);
  console.log("PASS an untrusted project file is ignored natively, is never parsed, and cannot trust itself");

  const traceBeforeTrust = await readFile(tracePath, "utf8");
  const granted = await run(session, "trust");
  assert.equal(granted.error, undefined, `trust failed: ${granted.error}`);
  const record = JSON.parse(readFileSync(trustPath, "utf8"));
  assert.equal(record.schemaVersion, trustSchemaVersion);
  assert.equal(record.trustedProjects.length, 1);
  assert.equal(record.trustedProjects[0].path, canonicalWorkingDirectory,
    "Trust records the canonical path of the reviewed working directory");
  assert(Number.isFinite(Date.parse(record.trustedProjects[0].trustedAt)));
  const trustBytes = readFileSync(trustPath, "utf8");
  assert.equal(readFileSync(projectFile, "utf8"), projectBytes, "Trust never writes the project file");
  assert.equal(readFileSync(filename, "utf8"), personalBytes, "Trust never rewrites the personal settings");

  await reload(session);
  const applied = await show(session);
  assert.match(applied, /Project trust: TRUSTED by an explicit personal command/);
  assert(applied.includes(
    `heavy: model=${current.modelId} [configured:heavy] reasoning=${current.reasoningEffort} [project:heavy]`),
  `The reloaded extension applies the trusted project file: ${applied}`);
  assert.match(applied, /autoPostReviews: true \[project\]/);
  assert.match(applied, /overriding personal heavyEffort/);
  assert.equal(await readFile(tracePath, "utf8"), traceBeforeTrust,
    "Trust, revocation and inspection make no GitHub request");
  console.log("PASS explicit trust survives an extension reload and overrides a personal tier with no gh request");

  const projected = (await quickRun(session, "2 --quick --no-comment")).find((message) =>
    message.startsWith("Effective PR review configuration for this invocation."));
  assert(projected.includes(`reasoning=${current.reasoningEffort} [project:heavy]`),
    `A trusted project drives the quick heavy assignment: ${projected}`);
  assert.match(projected, /autoPostReviews: true \[project\]/);
  const overriddenByFlag = (await quickRun(session, `2 --quick --no-comment heavyEffort=${other}`)).find((message) =>
    message.startsWith("Effective PR review configuration for this invocation."));
  assert(overriddenByFlag.includes(`reasoning=${other} [flag]`),
    `Invocation flags still win over a trusted project: ${overriddenByFlag}`);
  assert.equal(readFileSync(filename, "utf8"), personalBytes, "An invocation rewrites no personal setting");
  assert.equal(readFileSync(trustPath, "utf8"), trustBytes, "An invocation rewrites no trust record");
  assert.equal(readFileSync(projectFile, "utf8"), projectBytes, "An invocation rewrites no project file");
  console.log("PASS a trusted project drives a real quick invocation and flags override it, rewriting no saved file");

  const traceBeforeRefusals = await readFile(tracePath, "utf8");
  for (const [broken, expected] of [
    ["{ not json", /not valid JSON/],
    [{ schemaVersion: 99, settings: {} }, /incompatible schema version/],
    [{ schemaVersion: projectSchemaVersion, settings: {}, trustedProjects: [] },
      /does not hold a supported project configuration record/],
    [{ schemaVersion: projectSchemaVersion, settings: { trustedProjects: [] } }, /unknown configuration key/],
    [{ schemaVersion: projectSchemaVersion, settings: { verify: true } }, /unknown configuration key/],
    [{ schemaVersion: projectSchemaVersion, settings: { heavyModel: "definitely-not-a-model" } },
      /Unavailable or disabled Copilot-subscription model/],
  ]) {
    writeProject(broken);
    const refused = await run(session, "2 --quick --no-comment", "pr-review");
    assert.match(refused.error ?? "", expected, JSON.stringify(broken));
    assert.match((await run(session, "autoPostReviews=false")).error ?? "", expected,
      "A trusted project's error refuses a personal update too");
    assert.equal(readFileSync(filename, "utf8"), personalBytes, "A refused review rewrites nothing");
    assert.equal(readFileSync(trustPath, "utf8"), trustBytes, "A project file never changes the trust record");
  }
  console.log("PASS a trusted project's malformed, unknown-key and unavailable settings refuse and change nothing");

  writeProject(projectBytes);
  const revoked = await run(session, "untrust");
  assert.equal(revoked.error, undefined, `untrust failed: ${revoked.error}`);
  assert.deepEqual(JSON.parse(readFileSync(trustPath, "utf8")).trustedProjects, []);
  const afterRevocation = await show(session);
  assert.match(afterRevocation, /Project trust: NOT TRUSTED/);
  assert(afterRevocation.includes(`reasoning=${other} [configured:heavy]`), afterRevocation);
  assert.match(afterRevocation, /autoPostReviews: false \[default\]/);
  assert.equal(await readFile(tracePath, "utf8"), traceBeforeRefusals,
    "Refused reviews, revocation and inspection make no GitHub request");
  rmSync(join(target.quickTarget.workingDirectory, ".copilot"), { recursive: true });
  console.log("PASS revoked trust ignores the project file again and restores the personal assignment");

  await target.quickTarget.check();
  console.log("PASS native personal configuration: no inference, no owned runtime, no checkout change");
} finally {
  try { restore?.(); } finally {
    try { await stop(); } finally { await target.cleanup(); }
  }
}
