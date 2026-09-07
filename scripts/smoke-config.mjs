import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  configFilename, configSchemaVersion, configurationStore, describeConfiguration, executeConfiguration,
  layerSettings, loadConfiguration, parseConfigArgs, resolveTier, validateConfiguredTiers, validateSettings,
} from "../extensions/pr-review/config.mjs";
import {
  locateProjectConfig, projectConfigSegments, projectSchemaVersion, readProjectConfig, trustFilename,
  trustSchemaVersion, validateTrustedProjects,
} from "../extensions/pr-review/project.mjs";
import { parseQuickArgs, quickAssignments } from "../extensions/pr-review/quick.mjs";
import { executeRetainedQuick } from "../extensions/pr-review/retained-run.mjs";
import { sessionStore } from "../extensions/pr-review/retention.mjs";
import { respond } from "./target-fixture.mjs";

const catalog = [
  { id: "heavy", capabilities: { supports: { reasoning_effort: ["low", "high"] } } },
  { id: "other", capabilities: { supports: { reasoning_effort: ["low"] } } },
  { id: "disabled", policy: { state: "disabled" }, capabilities: { supports: { reasoning_effort: ["low"] } } },
  { id: "plain" },
];
const root = mkdtempSync(join(tmpdir(), "pr-review-config-"));

function harness({ ambient = { modelId: "heavy", reasoningEffort: "high" }, home = "home", work = "checkout" } = {}) {
  const sessionId = randomUUID();
  const copilotHome = join(root, home);
  const workspace = join(copilotHome, "session-state", sessionId);
  const working = join(root, work);
  mkdirSync(workspace, { recursive: true });
  mkdirSync(working, { recursive: true });
  const messages = [];
  const parent = {
    sessionId, messages,
    rpc: {
      metadata: { async snapshot() {
        return { sessionId, isRemote: false, workspacePath: workspace, workingDirectory: working };
      } },
      model: {
        async getCurrent() { return ambient; },
        async list() { return { list: catalog }; },
      },
    },
    async log(message) { messages.push(message); },
  };
  return {
    parent, copilotHome, working, canonical: realpathSync(working),
    filename: join(copilotHome, "pr-review", configFilename),
    trustFile: join(copilotHome, "pr-review", trustFilename),
    projectFile: join(working, ...projectConfigSegments),
    writeProject(record) {
      mkdirSync(dirname(join(working, ...projectConfigSegments)), { recursive: true });
      writeFileSync(join(working, ...projectConfigSegments),
        typeof record === "string" ? record : JSON.stringify(record, null, 2));
    },
  };
}

// --- argument parsing -------------------------------------------------------
assert.deepEqual(parseConfigArgs(""), { action: "show" });
assert.deepEqual(parseConfigArgs("   "), { action: "show" });
assert.deepEqual(parseConfigArgs(" show "), { action: "show" });
assert.deepEqual(parseConfigArgs("help"), { action: "help" });
assert.deepEqual(parseConfigArgs("--help"), { action: "help" });
assert.deepEqual(parseConfigArgs("heavyModel=heavy heavyEffort=high"),
  { action: "set", assignments: { heavyModel: "heavy", heavyEffort: "high" } });
assert.deepEqual(parseConfigArgs("autoPostReviews=true"), { action: "set", assignments: { autoPostReviews: true } });
assert.deepEqual(parseConfigArgs("autoPostReviews=false"), { action: "set", assignments: { autoPostReviews: false } });
assert.deepEqual(parseConfigArgs("unset heavyModel lightEffort"), { action: "unset", keys: ["heavyModel", "lightEffort"] });
for (const args of [
  "show heavyModel=heavy", "help me", "unset", "unset nope", "unset heavyModel heavyModel",
  "heavyModel", "=heavy", "heavyModel=", "heavy=model", "heavyModel=a heavyModel=b",
  "autoPostReviews=yes", "autoPostReviews=1", "autoPostReviews=TRUE", "autoPost=true",
  "heavy_thinking=high", "light=heavy", "verify=true",
  "trust me", "trust now", "untrust relative/path", "untrust .",
]) assert.throws(() => parseConfigArgs(args), /Invalid PR review configuration/, args);
assert.deepEqual(parseConfigArgs("trust"), { action: "trust" });
assert.deepEqual(parseConfigArgs(" untrust "), { action: "untrust" });
assert.deepEqual(parseConfigArgs("untrust /tmp/a repo with spaces"),
  { action: "untrust", path: "/tmp/a repo with spaces" });
for (const settings of [
  null, [], "x", { heavyModel: 1 }, { heavyModel: "" }, { heavyModel: "a b" }, { heavyModel: " a" },
  { autoPostReviews: "true" }, { unknown: "x" },
]) assert.throws(() => validateSettings(settings), /Invalid PR review configuration/);
console.log("PASS configuration argument parsing, unknown keys, malformed assignments and unsupported values");

// --- storage ----------------------------------------------------------------
{
  const h = harness();
  const store = await configurationStore(h.parent);
  assert.equal(store.filename, h.filename);
  assert.deepEqual(store.read(), { stored: false, settings: {} });
  assert(!existsSync(h.filename), "Reading must not create the configuration file");
  store.write({ heavyModel: "heavy", autoPostReviews: true });
  assert.deepEqual(JSON.parse(readFileSync(h.filename, "utf8")),
    { schemaVersion: configSchemaVersion, settings: { heavyModel: "heavy", autoPostReviews: true } });
  assert.equal(statSync(h.filename).mode & 0o777, 0o600);
  assert.deepEqual(store.read(), { stored: true, settings: { heavyModel: "heavy", autoPostReviews: true } });
  assert.deepEqual(readdirSync(join(h.copilotHome, "pr-review")), [configFilename], "No temporary file survives a write");

  for (const raw of ["{", "null", "[]", "3", '{"schemaVersion":1}', '{"settings":{}}',
    '{"schemaVersion":2,"settings":{}}', '{"schemaVersion":"1","settings":{}}',
    '{"schemaVersion":1,"settings":{"nope":1}}', '{"schemaVersion":1,"settings":{"heavyModel":7}}',
    '{"schemaVersion":1,"settings":{},"extra":1}']) {
    writeFileSync(h.filename, raw);
    assert.throws(() => store.read(), /Invalid PR review configuration/, raw);
    await assert.rejects(executeConfiguration(h.parent, "show"), /Invalid PR review configuration/);
    await assert.rejects(executeConfiguration(h.parent, "autoPostReviews=true"), /Invalid PR review configuration/);
    assert.equal(readFileSync(h.filename, "utf8"), raw, "A refused command changes nothing");
  }
  rmSync(h.filename);
  symlinkSync(join(root, "elsewhere.json"), h.filename);
  assert.throws(() => store.read(), /unsafe configuration file/);
  rmSync(h.filename);

  for (const changes of [{ isRemote: true }, { workspacePath: null }, { workspacePath: join(root, "loose", "x") },
    { workspacePath: join(root, "not-session-state", "x") }, { sessionId: randomUUID() }]) {
    const broken = { ...h.parent, rpc: { ...h.parent.rpc, metadata: { async snapshot() {
      return { ...await h.parent.rpc.metadata.snapshot(), ...changes };
    } } } };
    await assert.rejects(configurationStore(broken), /Invalid PR review configuration/);
  }
  const inside = { ...h.parent, rpc: { ...h.parent.rpc, metadata: { async snapshot() {
    return { ...await h.parent.rpc.metadata.snapshot(), workingDirectory: h.copilotHome };
  } } } };
  await assert.rejects(configurationStore(inside), /outside the reviewed checkout/);
  console.log("PASS versioned personal store outside the checkout, atomic 0600 write, and explicit malformed/incompatible errors");
}

// --- inheritance and precedence --------------------------------------------
{
  const ambient = { model: "heavy", reasoningEffort: "high" };
  const resolve = (settings, tier, flags) => resolveTier(tier, { settings, ambient, flags });
  assert.deepEqual(resolve({}, "heavy").model, { value: "heavy", source: "ambient" });
  assert.deepEqual(resolve({}, "light").reasoningEffort, { value: "high", source: "ambient" });
  assert.deepEqual(resolve({ heavyModel: "other" }, "heavy").model, { value: "other", source: "configured:heavy" });
  assert.deepEqual(resolve({ lightModel: "other" }, "heavy").model, { value: "other", source: "inherited:light" });
  assert.deepEqual(resolve({ lightModel: "other" }, "medium").model, { value: "other", source: "inherited:light" });
  assert.deepEqual(resolve({ heavyModel: "other" }, "light").model, { value: "other", source: "inherited:heavy" });
  assert.deepEqual(resolve({ mediumModel: "other", lightModel: "plain" }, "heavy").model,
    { value: "other", source: "inherited:medium" }, "Nearest configured tier wins over a farther one");
  assert.deepEqual(resolve({ lightModel: "plain", heavyModel: "other" }, "medium").model,
    { value: "other", source: "inherited:heavy" }, "An equidistant tie prefers the heavier tier");
  assert.deepEqual(resolve({ lightEffort: "low" }, "heavy"),
    { tier: "heavy", model: { value: "heavy", source: "ambient" }, reasoningEffort: { value: "low", source: "inherited:light" } },
    "Model and effort inherit independently");
  assert.deepEqual(resolve({ heavyModel: "other" }, "heavy", { heavyModel: "heavy" }).model,
    { value: "heavy", source: "flag" }, "Invocation flags win over saved settings");
  assert.deepEqual(resolveTier("heavy", { settings: {}, ambient: {} }),
    { tier: "heavy", model: { value: undefined, source: "unset" }, reasoningEffort: { value: undefined, source: "unset" } });
  assert.throws(() => resolveTier("giant", {}), /unknown model tier/);

  validateConfiguredTiers({}, { model: "auto" }, catalog);
  validateConfiguredTiers({ heavyModel: "heavy", heavyEffort: "high" }, ambient, catalog);
  for (const settings of [
    { heavyModel: "missing" }, { heavyModel: "disabled" }, { heavyModel: "auto" },
    { heavyModel: "provider/model" }, { heavyEffort: "max" }, { heavyModel: "other" },
    { heavyModel: "plain", heavyEffort: "low" }, { lightModel: "other" },
  ]) assert.throws(() => validateConfiguredTiers(settings, ambient, catalog), /Refused .*-tier configuration/, JSON.stringify(settings));
  validateConfiguredTiers({ heavyModel: "other", heavyEffort: "low" }, ambient, catalog);
  console.log("PASS nearest-tier and ambient inheritance, flag precedence, and refusal without substitution");
}

// --- command behaviour ------------------------------------------------------
{
  const h = harness();
  const shown = await executeConfiguration(h.parent, "");
  assert.deepEqual(shown, { action: "show", settings: {}, effective: {} });
  assert(!existsSync(h.filename), "show must not create the configuration file");
  const report = h.parent.messages.at(-1);
  assert.match(report, /not created yet/);
  assert.match(report, /heavy: model=heavy \[ambient\] reasoning=high \[ambient\]/);
  assert.match(report, /autoPostReviews: false \[default\]/);
  assert.match(report, /no inference, made no GitHub request, and started no review work/);
  assert.match(report, /repository cannot authorize itself/);

  assert.deepEqual((await executeConfiguration(h.parent, "help")), { action: "help" });
  assert.match(h.parent.messages.at(-1), /Usage: \/pr-review-config/);

  const set = await executeConfiguration(h.parent, "lightModel=other lightEffort=low autoPostReviews=true");
  assert.deepEqual(set.changed, ["lightModel", "lightEffort", "autoPostReviews"]);
  assert.deepEqual(set.settings, { lightModel: "other", lightEffort: "low", autoPostReviews: true });
  assert.match(h.parent.messages.at(-1), /updated: lightModel=other lightEffort=low autoPostReviews=true/);
  assert.match(h.parent.messages.at(-1), /heavy: model=other \[inherited:light\] reasoning=low \[inherited:light\]/);
  assert.match(h.parent.messages.at(-1), /autoPostReviews: true \[configured\]/);
  assert.deepEqual((await loadConfiguration(h.parent)).settings, set.settings);

  const unchanged = await executeConfiguration(h.parent, "autoPostReviews=true");
  assert.deepEqual(unchanged.changed, []);
  assert.match(h.parent.messages.at(-1), /unchanged/);

  const stored = readFileSync(h.filename, "utf8");
  // The saved light tier already supplies medium's model, so an unsupported heavy
  // effort is refused through inheritance before the heavy tier is reached.
  await assert.rejects(executeConfiguration(h.parent, "heavyEffort=max"),
    /Refused medium-tier configuration: Unsupported reasoning effort max for other/);
  await assert.rejects(executeConfiguration(h.parent, "lightModel=missing"), /Refused light-tier configuration/);
  await assert.rejects(executeConfiguration(h.parent, "nope=1"), /unknown configuration key/);
  assert.equal(readFileSync(h.filename, "utf8"), stored, "A refused update leaves the stored file byte-identical");

  // Clearing only the effort would leave an explicit light model the ambient
  // effort cannot support, so the unset is refused rather than silently lowered.
  await assert.rejects(executeConfiguration(h.parent, "unset lightEffort"), /Refused light-tier configuration/);
  assert.equal(readFileSync(h.filename, "utf8"), stored, "A refused unset leaves the stored file byte-identical");
  const cleared = await executeConfiguration(h.parent, "unset lightModel lightEffort");
  assert.deepEqual(cleared.settings, { autoPostReviews: true });
  assert.match(h.parent.messages.at(-1), /unset lightModel lightEffort/);
  assert.deepEqual((await executeConfiguration(h.parent, "unset lightModel")).changed, []);
  assert.deepEqual((await executeConfiguration(h.parent, "unset autoPostReviews")).settings, {});
  assert.deepEqual(JSON.parse(readFileSync(h.filename, "utf8")), { schemaVersion: configSchemaVersion, settings: {} });
  console.log("PASS show, set, unset, unchanged reporting, and refusals that write nothing");
}

// --- the saved configuration actually drives quick assignments --------------
{
  const h = harness();
  const configuration = await loadConfiguration(h.parent);
  const ambientAssignments = await quickAssignments(h.parent, {}, configuration);
  assert.deepEqual(ambientAssignments.map(({ label }) => label),
    ["correctness", "contracts", "security-performance-resources"]);
  assert(ambientAssignments.every((a) => a.model === "heavy" && a.reasoningEffort === "high"));

  configuration.store.write({ lightModel: "other", lightEffort: "low" });
  const saved = await loadConfiguration(h.parent);
  assert((await quickAssignments(h.parent, {}, saved)).every((a) => a.model === "other" && a.reasoningEffort === "low"),
    "An unset heavy tier inherits the configured light tier, not the ambient model");
  assert((await quickAssignments(h.parent, { heavyModel: "heavy", heavyEffort: "high" }, saved))
    .every((a) => a.model === "heavy" && a.reasoningEffort === "high"), "Invocation flags override saved settings");
  assert.deepEqual((await loadConfiguration(h.parent)).settings, { lightModel: "other", lightEffort: "low" },
    "A flag override never rewrites the saved configuration");

  configuration.store.write({ heavyModel: "plain", heavyEffort: "low" });
  await assert.rejects(quickAssignments(h.parent, {}, await loadConfiguration(h.parent)), /No substitution/);
  configuration.store.write({ heavyModel: "other" });
  await assert.rejects(quickAssignments(h.parent, {}, await loadConfiguration(h.parent)), /No substitution/,
    "An inherited ambient effort the configured model cannot support is refused, never lowered");
  assert((await quickAssignments(h.parent, { heavyEffort: "low" }, await loadConfiguration(h.parent)))
    .every((a) => a.model === "other" && a.reasoningEffort === "low"));

  configuration.store.write({ autoPostReviews: true });
  const posting = await loadConfiguration(h.parent);
  assert.equal(posting.autoPostReviews, true);
  assert.equal(posting.autoPostSource, "configured");
  assert.match(describeConfiguration(posting), /autoPostReviews: true \[configured\]/);
  console.log("PASS saved tiers drive quick assignments, flags override them, and invalid settings are refused");
}
// --- the effective autoPostReviews reaches the retained posting policy ------
for (const autoPostReviews of [true, false]) {
  const h = harness();
  const store = await sessionStore(h.parent);
  const history = [];
  const assignments = ["correctness", "contracts", "security-performance-resources"]
    .map((label) => ({ label, model: "heavy", reasoningEffort: "high" }));
  const result = await executeRetainedQuick(h.parent, {
    async start() { assert.fail("A skipped target must not start inference"); },
    async stop() { return []; },
  }, parseQuickArgs("2 --quick --all"), assignments, {
    controller: new AbortController(),
    gh: async (args, cwd) => {
      const response = respond(args, cwd, history);
      history.push({ args, cwd });
      return response;
    },
  }, { autoPostReviews });
  assert.equal(result.retention.state, "settled");
  const record = store.read();
  assert.equal(record.outcome.preview.policy.autoPostReviews, autoPostReviews,
    "The effective saved posting setting is recorded with the retained result");
  assert.deepEqual(record.outcome.preview.policy, { comment: false, noComment: false, autoPostReviews });
}
console.log("PASS effective autoPostReviews reaches the retained posting policy through a real retained run");

// --- C2: the trusted-project boundary --------------------------------------
{
  const h = harness({ home: "home-c2-shapes", work: "c2-shapes" });
  assert.deepEqual(validateTrustedProjects([]), []);
  validateTrustedProjects([{ path: "/a", trustedAt: new Date().toISOString() }]);
  for (const entries of [
    null, {}, [null], [{ path: "/a" }], [{ trustedAt: new Date().toISOString() }],
    [{ path: "relative", trustedAt: new Date().toISOString() }],
    [{ path: "/a", trustedAt: "not-a-date" }],
    [{ path: "/a", trustedAt: new Date().toISOString(), extra: 1 }],
    [{ path: "/a", trustedAt: new Date().toISOString() }, { path: "/a", trustedAt: new Date().toISOString() }],
  ]) assert.throws(() => validateTrustedProjects(entries), /Invalid PR review configuration/, JSON.stringify(entries));

  const store = await configurationStore(h.parent);
  assert.equal(store.trustFile, h.trustFile);
  assert.deepEqual(store.readTrust(), [], "An absent trust file trusts nothing");
  store.writeTrust([{ path: h.working, trustedAt: "2026-09-07T00:00:00.000Z" }]);
  assert.deepEqual(JSON.parse(readFileSync(h.trustFile, "utf8")), {
    schemaVersion: trustSchemaVersion, trustedProjects: [{ path: h.working, trustedAt: "2026-09-07T00:00:00.000Z" }],
  });
  assert.equal(statSync(h.trustFile).mode & 0o777, 0o600);
  for (const raw of ["{", "[]", '{"schemaVersion":1}', '{"trustedProjects":[]}',
    '{"schemaVersion":2,"trustedProjects":[]}', '{"schemaVersion":1,"trustedProjects":{}}',
    '{"schemaVersion":1,"trustedProjects":[{"path":"nope","trustedAt":"2026-09-07T00:00:00.000Z"}]}',
    '{"schemaVersion":1,"trustedProjects":[],"settings":{}}']) {
    writeFileSync(h.trustFile, raw);
    assert.throws(() => store.readTrust(), /Invalid PR review configuration/, raw);
    await assert.rejects(executeConfiguration(h.parent, "show"), /Invalid PR review configuration/);
    assert.equal(readFileSync(h.trustFile, "utf8"), raw, "A refused command changes the trust record nothing");
  }
  rmSync(h.trustFile);

  assert.equal(locateProjectConfig(h.working).status, "absent");
  assert.equal(locateProjectConfig(h.working).filename, h.projectFile);
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: { heavyModel: "other" } });
  assert.equal(locateProjectConfig(h.working).status, "file");
  assert.deepEqual(readProjectConfig(h.working, validateSettings).settings, { heavyModel: "other" });
  rmSync(h.projectFile);
  mkdirSync(h.projectFile);
  assert.equal(locateProjectConfig(h.working).status, "unsafe");
  assert.throws(() => readProjectConfig(h.working, validateSettings), /is not a regular file/);
  rmSync(h.projectFile, { recursive: true });
  writeFileSync(h.projectFile, `{"schemaVersion":1,"settings":{},"pad":"${"x".repeat(70000)}"}`);
  assert.match(locateProjectConfig(h.working).reason, /exceeds \d+ bytes/);
  assert.throws(() => readProjectConfig(h.working, validateSettings), /exceeds \d+ bytes/);
  rmSync(join(h.working, ".copilot"), { recursive: true });
  symlinkSync(join(root, "elsewhere"), join(h.working, ".copilot"));
  assert.match(locateProjectConfig(h.working).reason, /is a symbolic link/);
  assert.throws(() => readProjectConfig(h.working, validateSettings), /is a symbolic link/);
  rmSync(join(h.working, ".copilot"));
  console.log("PASS trust-record schema, atomic 0600 trust file, and safe project-file location");
}

// --- C2: an untrusted repository's file is ignored, never parsed ------------
{
  const h = harness({ home: "home-c2-untrusted", work: "c2-untrusted" });
  for (const record of [
    { schemaVersion: projectSchemaVersion, settings: { heavyModel: "other", autoPostReviews: true } },
    "{ not json at all",
    { schemaVersion: 99, settings: {} },
    // A repository cannot trust itself, whatever it writes in its own file.
    { schemaVersion: projectSchemaVersion, settings: {}, trustedProjects: [{ path: h.working, trustedAt: "2026-09-07T00:00:00.000Z" }] },
    { schemaVersion: projectSchemaVersion, settings: { trustedProjects: [] } },
    { schemaVersion: projectSchemaVersion, settings: { verify: true } },
  ]) {
    h.writeProject(record);
    const shown = await executeConfiguration(h.parent, "show");
    assert.deepEqual(shown.effective, {}, "An untrusted project file is never merged");
    const report = h.parent.messages.at(-1);
    assert.match(report, /Project trust: NOT TRUSTED/);
    assert(report.includes(`Project configuration: IGNORED. ${h.projectFile}`), report);
    assert.match(report, /A repository cannot trust itself/);
    assert.match(report, /heavy: model=heavy \[ambient\] reasoning=high \[ambient\]/);
    assert.match(report, /autoPostReviews: false \[default\]/);
    assert(!existsSync(h.trustFile), "Nothing in a repository creates a trust record");
    const configuration = await loadConfiguration(h.parent);
    assert.equal(configuration.trustRecord, undefined);
    assert.equal(configuration.project.settings, undefined, "An untrusted file is located, never parsed");
    assert((await quickAssignments(h.parent, {}, configuration))
      .every((a) => a.model === "heavy" && a.reasoningEffort === "high"),
    "An untrusted project file cannot change a review's assignment");
  }
  console.log("PASS an untrusted repository's configuration file is ignored with a visible message and never parsed");
}

// --- C2: explicit trust, override, precedence and revocation ---------------
{
  const h = harness({ home: "home-c2-trusted", work: "c2-trusted" });
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: { heavyModel: "other", heavyEffort: "low" } });
  await executeConfiguration(h.parent,
    "lightModel=heavy lightEffort=high heavyModel=heavy heavyEffort=high autoPostReviews=false");
  const personal = readFileSync(h.filename, "utf8");
  const projectBytes = readFileSync(h.projectFile, "utf8");

  const trusted = await executeConfiguration(h.parent, "trust");
  assert.deepEqual(trusted, { action: "trust", changed: true, path: h.canonical });
  assert.deepEqual(JSON.parse(readFileSync(h.trustFile, "utf8")).trustedProjects.map(({ path }) => path), [h.canonical],
    "Trust records the canonical absolute path, so one directory is never two trust decisions");
  assert.equal(readFileSync(h.filename, "utf8"), personal, "Trust never rewrites the personal settings file");
  assert.equal(readFileSync(h.projectFile, "utf8"), projectBytes, "Nothing ever writes the project file");
  const granted = h.parent.messages.at(-1);
  assert.match(granted, /Project trusted:/);
  assert.match(granted, /can publish an --all run unattended/);
  assert.match(granted, /heavy: model=other \[project:heavy\] reasoning=low \[project:heavy\]/);
  assert.match(granted, /light: model=heavy \[configured:light\] reasoning=high \[configured:light\]/);
  assert.match(granted, /medium: model=other \[project-inherited:heavy\] reasoning=low \[project-inherited:heavy\]/);
  assert.match(granted, /overriding personal heavyModel, heavyEffort/,
    "The report names the personal keys the project shadows");

  const configuration = await loadConfiguration(h.parent);
  assert.deepEqual(configuration.effective.settings,
    { lightModel: "heavy", lightEffort: "high", heavyModel: "other", heavyEffort: "low", autoPostReviews: false });
  assert.deepEqual(configuration.effective.origins,
    { lightModel: "personal", lightEffort: "personal", heavyModel: "project", heavyEffort: "project", autoPostReviews: "personal" });
  assert((await quickAssignments(h.parent, {}, configuration))
    .every((a) => a.model === "other" && a.reasoningEffort === "low"), "A trusted project drives the review assignment");
  assert((await quickAssignments(h.parent, { heavyModel: "heavy", heavyEffort: "high" }, configuration))
    .every((a) => a.model === "heavy" && a.reasoningEffort === "high"), "Invocation flags still win over a trusted project");
  assert.deepEqual((await loadConfiguration(h.parent)).settings, JSON.parse(personal).settings,
    "Resolving a review never rewrites the personal file");

  assert.deepEqual(await executeConfiguration(h.parent, "trust"), { action: "trust", changed: false, path: h.canonical });
  assert.match(h.parent.messages.at(-1), /already trusted/);

  // A trusted project may override autoPostReviews, as SCOPE.md records.
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: { autoPostReviews: true } });
  const posting = await loadConfiguration(h.parent);
  assert.equal(posting.autoPostReviews, true);
  assert.equal(posting.autoPostSource, "project");
  assert.match(describeConfiguration(posting), /autoPostReviews: true \[project\]/);

  const revoked = await executeConfiguration(h.parent, "untrust");
  assert.deepEqual(revoked, { action: "untrust", changed: true, path: h.canonical });
  assert.deepEqual(JSON.parse(readFileSync(h.trustFile, "utf8")).trustedProjects, []);
  assert.match(h.parent.messages.at(-1), /Project trust revoked/);
  assert.match(h.parent.messages.at(-1), /Project configuration: IGNORED/);
  const after = await loadConfiguration(h.parent);
  assert.equal(after.autoPostReviews, false, "Revoked trust drops the project's posting authority");
  assert.deepEqual(after.effective.settings, JSON.parse(personal).settings);
  assert.deepEqual(await executeConfiguration(h.parent, "untrust"), { action: "untrust", changed: false, path: h.canonical });
  assert.match(h.parent.messages.at(-1), /No trust record to revoke/);
  assert.deepEqual(await executeConfiguration(h.parent, `untrust ${join(root, "somewhere-else")}`),
    { action: "untrust", changed: false, path: h.canonical });
  console.log("PASS explicit trust applies a project override, flags still win, and revocation restores personal settings");
}

// --- C2: a trusted project's errors change nothing and refuse the review ----
{
  const h = harness({ home: "home-c2-refusals", work: "c2-refusals" });
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: {} });
  await executeConfiguration(h.parent, "trust");
  await executeConfiguration(h.parent, "heavyModel=heavy heavyEffort=high");
  const personal = readFileSync(h.filename, "utf8");
  const trust = readFileSync(h.trustFile, "utf8");

  for (const [record, expected] of [
    ["{ not json", /is not valid JSON/],
    [{ schemaVersion: 99, settings: {} }, /incompatible schema version/],
    [{ schemaVersion: projectSchemaVersion }, /does not hold a supported project configuration record/],
    [{ schemaVersion: projectSchemaVersion, settings: {}, trustedProjects: [] }, /does not hold a supported project configuration record/],
    [{ schemaVersion: projectSchemaVersion, settings: { trustedProjects: [] } }, /unknown configuration key "trustedProjects"/],
    [{ schemaVersion: projectSchemaVersion, settings: { verify: true } }, /unknown configuration key "verify"/],
    [{ schemaVersion: projectSchemaVersion, settings: { autoPostReviews: "true" } }, /must be the boolean/],
  ]) {
    h.writeProject(record);
    const configuration = await loadConfiguration(h.parent);
    assert.match(configuration.project.error ?? "", expected, JSON.stringify(record));
    assert.deepEqual(configuration.effective.settings, JSON.parse(personal).settings, "A broken project file merges nothing");
    // Inspection still explains the failure; everything that consumes the settings refuses.
    const report = describeConfiguration(configuration);
    assert.match(report, /Project configuration: ERROR/);
    assert.match(report, /Reviews and configuration updates are refused/);
    await assert.rejects(quickAssignments(h.parent, {}, configuration), expected);
    await assert.rejects(executeConfiguration(h.parent, "autoPostReviews=true"), expected);
    assert.equal(readFileSync(h.filename, "utf8"), personal, "A refused update leaves the personal file byte-identical");
    assert.equal(readFileSync(h.trustFile, "utf8"), trust, "A broken project file never changes the trust record");
  }
  // Revocation stays available even while the trusted file is unreadable.
  assert.equal((await executeConfiguration(h.parent, "untrust")).changed, true);
  assert.deepEqual(JSON.parse(readFileSync(h.trustFile, "utf8")).trustedProjects, []);
  assert.deepEqual((await loadConfiguration(h.parent)).effective.settings, JSON.parse(personal).settings);

  // Trusting a directory whose file is already broken is refused and records nothing.
  await assert.rejects(executeConfiguration(h.parent, "trust"), /must be the boolean/);
  assert.deepEqual(JSON.parse(readFileSync(h.trustFile, "utf8")).trustedProjects, []);

  // An unusable but well-formed project model refuses the review, never downgrades it.
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: { heavyModel: "disabled" } });
  await assert.rejects(executeConfiguration(h.parent, "trust"),
    /Refused .*-tier configuration: Unavailable or disabled Copilot-subscription model: disabled/);
  assert.deepEqual(JSON.parse(readFileSync(h.trustFile, "utf8")).trustedProjects, []);
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: { heavyModel: "other", heavyEffort: "low" } });
  await executeConfiguration(h.parent, "trust");
  // A trusted file that becomes unusable later is reported, never silently lowered.
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: { heavyModel: "other", heavyEffort: "high" } });
  const unusable = await loadConfiguration(h.parent);
  assert.match(describeConfiguration(unusable), /UNUSABLE: Unsupported reasoning effort high for other/);
  await assert.rejects(quickAssignments(h.parent, {}, unusable), /No substitution/);
  assert.equal(readFileSync(h.filename, "utf8"), personal);
  console.log("PASS a trusted project's malformed, unknown-key and unusable settings refuse and change nothing");
}

// --- C2: a trusted project's posting authority reaches the retained policy ---
for (const projectPosting of [true, false]) {
  const h = harness({ home: `home-c2-posting-${projectPosting}`, work: `c2-posting-${projectPosting}` });
  h.writeProject({ schemaVersion: projectSchemaVersion, settings: { autoPostReviews: projectPosting } });
  await executeConfiguration(h.parent, "trust");
  await executeConfiguration(h.parent, `autoPostReviews=${!projectPosting}`);
  const personal = readFileSync(h.filename, "utf8");
  const trust = readFileSync(h.trustFile, "utf8");
  const project = readFileSync(h.projectFile, "utf8");
  const configuration = await loadConfiguration(h.parent);
  assert.equal(configuration.autoPostReviews, projectPosting, "The trusted project overrides the personal setting");

  const store = await sessionStore(h.parent);
  const history = [];
  const assignments = await quickAssignments(h.parent, {}, configuration);
  const result = await executeRetainedQuick(h.parent, {
    async start() { assert.fail("A skipped target must not start inference"); },
    async stop() { return []; },
  }, parseQuickArgs("2 --quick --all"), assignments, {
    controller: new AbortController(),
    gh: async (args, cwd) => {
      const response = respond(args, cwd, history);
      history.push({ args, cwd });
      return response;
    },
  }, { autoPostReviews: configuration.autoPostReviews });
  assert.equal(result.retention.state, "settled");
  assert.equal(store.read().outcome.preview.policy.autoPostReviews, projectPosting);
  assert.equal(readFileSync(h.filename, "utf8"), personal, "An invocation leaves the personal file unmodified");
  assert.equal(readFileSync(h.trustFile, "utf8"), trust, "An invocation leaves the trust record unmodified");
  assert.equal(readFileSync(h.projectFile, "utf8"), project, "An invocation leaves the project file unmodified");
}
console.log("PASS a trusted project's autoPostReviews reaches the retained posting policy, with every saved file unmodified");

// --- C2: layering is per key ------------------------------------------------
{
  assert.deepEqual(layerSettings({ heavyModel: "a", lightModel: "b" }, { heavyModel: "c" }), {
    settings: { lightModel: "b", heavyModel: "c" },
    origins: { lightModel: "personal", heavyModel: "project" },
  });
  assert.deepEqual(layerSettings({ heavyModel: "a" }, undefined),
    { settings: { heavyModel: "a" }, origins: { heavyModel: "personal" } });
  assert.deepEqual(layerSettings({}, { autoPostReviews: false }),
    { settings: { autoPostReviews: false }, origins: { autoPostReviews: "project" } },
    "A project may override a personal true with an explicit false");
  const layered = layerSettings({ lightModel: "other" }, { heavyModel: "heavy" });
  assert.deepEqual(resolveTier("medium", { ...layered, ambient: { model: "heavy", reasoningEffort: "high" } }).model,
    { value: "heavy", source: "project-inherited:heavy" }, "Inheritance keeps the origin of the value it inherits");
  console.log("PASS per-key layering and origin reporting through tier inheritance");
}

rmSync(root, { recursive: true });
console.log("PASS tier configuration and trusted-project probe: no inference, no GitHub request, no review work");
