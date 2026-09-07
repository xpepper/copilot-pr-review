import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  configFilename, configSchemaVersion, configurationStore, describeConfiguration, executeConfiguration,
  loadConfiguration, parseConfigArgs, resolveTier, validateConfiguredTiers, validateSettings,
} from "../extensions/pr-review/config.mjs";
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

function harness({ ambient = { modelId: "heavy", reasoningEffort: "high" }, home = "home" } = {}) {
  const sessionId = randomUUID();
  const copilotHome = join(root, home);
  const workspace = join(copilotHome, "session-state", sessionId);
  const working = join(root, "checkout");
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
  return { parent, copilotHome, filename: join(copilotHome, "pr-review", configFilename), working };
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
]) assert.throws(() => parseConfigArgs(args), /Invalid PR review configuration/, args);
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
  assert.deepEqual(shown, { action: "show", settings: {} });
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

rmSync(root, { recursive: true });
console.log("PASS personal tier configuration probe: no inference, no GitHub request, no review work");
