import { randomUUID } from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync,
  renameSync, unlinkSync, writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, sep } from "node:path";
import {
  advertisesNoReasoningEffort, reasoningEfforts, subscriptionModels, validateModelAssignment,
} from "./fixture.mjs";
import {
  canonicalProjectPath, locateProjectConfig, projectConfigDisplayPath, readProjectConfig,
  requireConfig, trustBindingNotes, trustFilename, trustSchemaVersion, validateTrustedProjects,
} from "./project.mjs";

// Personal configuration, plus the settings an explicitly trusted project may
// override. Trust lives only in the personal store: a repository that contains a
// configuration file cannot make itself trusted by containing anything at all.
export const configSchemaVersion = 1;
export const configDirectoryName = "pr-review";
export const configFilename = "config.json";
export const sessionStateDirectoryName = "session-state";

export const tiers = ["light", "medium", "heavy"];
export const modelKey = (tier) => `${tier}Model`;
export const effortKey = (tier) => `${tier}Effort`;
// A tier may also carry one optional fallback assignment, used at most once for
// a reviewer whose own execution failed explicitly. It is a separate key rather
// than a second value on the tier, so leaving it out means this tier has no
// fallback rather than that some other tier can stand in for it.
export const fallbackModelKey = (tier) => `${tier}FallbackModel`;
export const fallbackEffortKey = (tier) => `${tier}FallbackEffort`;
const assignmentKeys = tiers.flatMap((tier) => [modelKey(tier), effortKey(tier)]);
const fallbackAssignmentKeys = tiers.flatMap((tier) => [fallbackModelKey(tier), fallbackEffortKey(tier)]);
const booleanKeys = ["autoPostReviews"];
export const configurationKeys = [...assignmentKeys, ...fallbackAssignmentKeys, ...booleanKeys];
export const configurationDefaults = { autoPostReviews: false };

export function validateSettings(settings) {
  requireConfig(settings && typeof settings === "object" && !Array.isArray(settings),
    "stored settings must be a JSON object");
  for (const [key, value] of Object.entries(settings)) {
    requireConfig(configurationKeys.includes(key), `unknown configuration key ${JSON.stringify(key)}`);
    if (booleanKeys.includes(key)) {
      requireConfig(typeof value === "boolean", `${key} must be the boolean true or false`);
    } else {
      requireConfig(typeof value === "string" && value.trim() === value && value !== "" && !/\s/.test(value),
        `${key} must be a nonempty identifier without whitespace`);
    }
  }
  return settings;
}

export function parseConfigArgs(args) {
  const raw = String(args ?? "").trim();
  // Trust commands are personal and path-shaped, so they are read from the raw
  // argument: a directory may legitimately contain whitespace.
  if (raw === "trust") return { action: "trust" };
  if (raw === "untrust") return { action: "untrust" };
  if (raw.startsWith("untrust ")) {
    const path = raw.slice("untrust ".length).trim();
    requireConfig(isAbsolute(path), `untrust takes an absolute directory path, not ${JSON.stringify(path)}`);
    return { action: "untrust", path };
  }
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (!tokens.length) return { action: "show" };
  if (["show", "help", "--help"].includes(tokens[0])) {
    requireConfig(tokens.length === 1, `${tokens[0]} takes no further arguments`);
    return { action: tokens[0] === "show" ? "show" : "help" };
  }
  requireConfig(tokens[0] !== "trust", "trust takes no arguments; it trusts this session's working directory");
  if (tokens[0] === "unset") {
    const keys = tokens.slice(1);
    requireConfig(keys.length > 0, "unset requires at least one configuration key");
    requireConfig(new Set(keys).size === keys.length, "duplicate key in unset");
    for (const key of keys) requireConfig(configurationKeys.includes(key), `unknown configuration key ${JSON.stringify(key)}`);
    return { action: "unset", keys };
  }
  const assignments = {};
  for (const token of tokens) {
    const separator = token.indexOf("=");
    requireConfig(separator > 0,
      `malformed argument ${JSON.stringify(token)}; use "show", "unset KEY", "trust", "untrust", or "key=value"`);
    const key = token.slice(0, separator);
    const value = token.slice(separator + 1);
    requireConfig(configurationKeys.includes(key), `unknown configuration key ${JSON.stringify(key)}`);
    requireConfig(!(key in assignments), `duplicate assignment for ${key}`);
    requireConfig(value !== "", `${key} requires a value; use "unset ${key}" to clear it`);
    if (booleanKeys.includes(key)) {
      requireConfig(["true", "false"].includes(value), `${key} accepts only true or false, not ${JSON.stringify(value)}`);
      assignments[key] = value === "true";
    } else {
      assignments[key] = value;
    }
  }
  validateSettings(assignments);
  return { action: "set", assignments };
}

// The Copilot CLI resolves its own configuration home before the extension
// starts, so derive the personal store from the session workspace it reported
// instead of guessing an environment variable or a home directory.
export async function configurationStore(parent) {
  const metadata = await parent.rpc.metadata.snapshot();
  requireConfig(metadata.sessionId === parent.sessionId && metadata.isRemote === false &&
    typeof metadata.workspacePath === "string" && isAbsolute(metadata.workspacePath) &&
    basename(metadata.workspacePath) === parent.sessionId,
  "this session reports no local workspace, so the personal configuration location is unknown");
  const state = dirname(metadata.workspacePath);
  requireConfig(basename(state) === sessionStateDirectoryName,
    `unexpected Copilot session layout: ${state} is not a ${sessionStateDirectoryName} directory`);
  const directory = join(dirname(state), configDirectoryName);
  const filename = join(directory, configFilename);
  const trustFile = join(directory, trustFilename);
  const workingDirectory = metadata.workingDirectory;
  requireConfig(typeof workingDirectory === "string" && isAbsolute(workingDirectory) &&
    directory !== workingDirectory && !directory.startsWith(`${workingDirectory}${sep}`),
  "the personal configuration must live outside the reviewed checkout");
  function readRecord(target) {
    let raw;
    try {
      const stat = lstatSync(target);
      requireConfig(stat.isFile() && !stat.isSymbolicLink(), `unsafe configuration file ${target}`);
      raw = readFileSync(target, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return undefined;
      throw error;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return requireConfig(false, `${target} is not valid JSON (${error.message}); fix or remove it. Nothing was changed`);
    }
  }
  function writeRecord(target, record) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const temporary = join(directory, `.pr-review-config-${randomUUID()}.tmp`);
    let fd;
    try {
      fd = openSync(temporary, "wx", 0o600);
      writeFileSync(fd, JSON.stringify(record, null, 2));
      fsyncSync(fd);
      closeSync(fd);
      fd = undefined;
      renameSync(temporary, target);
    } finally {
      if (fd !== undefined) closeSync(fd);
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    return record;
  }
  function requireRecord(parsed, target, version, key) {
    requireConfig(parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
      Object.hasOwn(parsed, "schemaVersion") && Object.hasOwn(parsed, key) &&
      Object.keys(parsed).every((entry) => ["schemaVersion", key].includes(entry)),
    `${target} does not hold a supported configuration record`);
    requireConfig(parsed.schemaVersion === version,
      `${target} has incompatible schema version ${JSON.stringify(parsed.schemaVersion)}; this build supports ${version}`);
    return parsed[key];
  }
  function read() {
    const parsed = readRecord(filename);
    if (parsed === undefined) return { stored: false, settings: {} };
    return { stored: true, settings: validateSettings(requireRecord(parsed, filename, configSchemaVersion, "settings")) };
  }
  function write(settings) {
    validateSettings(settings);
    return writeRecord(filename, { schemaVersion: configSchemaVersion, settings });
  }
  function readTrust() {
    const parsed = readRecord(trustFile);
    if (parsed === undefined) return [];
    return validateTrustedProjects(requireRecord(parsed, trustFile, trustSchemaVersion, "trustedProjects"));
  }
  function writeTrust(trustedProjects) {
    validateTrustedProjects(trustedProjects);
    return writeRecord(trustFile, { schemaVersion: trustSchemaVersion, trustedProjects });
  }
  return { directory, filename, trustFile, workingDirectory, read, write, readTrust, writeTrust };
}

// Precedence is per key: invocation flags, then a trusted project's settings,
// then personal settings, then the ambient session assignment.
export function layerSettings(personal = {}, project = undefined) {
  const settings = {};
  const origins = {};
  for (const key of configurationKeys) {
    if (project && Object.hasOwn(project, key)) {
      settings[key] = project[key];
      origins[key] = "project";
    } else if (Object.hasOwn(personal, key)) {
      settings[key] = personal[key];
      origins[key] = "personal";
    }
  }
  return { settings, origins };
}

// A value's origin travels with it, so an inherited tier still names the layer
// the value actually came from.
function sourceLabel(origin, kind, tier) {
  if (origin !== "project") return `${kind}:${tier}`;
  return `${kind === "inherited" ? "project-inherited" : "project"}:${tier}`;
}

// The one origin no configuration layer supplies: the model this tier resolved
// to advertises no configurable reasoning effort, so the tier holds none.
const noEffortSource = "model";
// Origins nobody chose. A review resolves and validates them again for itself,
// so a configuration update is not refused on their account.
const implicitSources = ["ambient", "unset", noEffortSource];
// Origins that hand this tier an effort chosen somewhere else: the session, a
// neighbouring tier, or the tier a fallback belongs to. Only those are dropped.
// An effort set for this tier is explicit, and an explicit setting is refused by
// validation rather than silently dropped, substituted or lowered.
const inheritedEffort = (source) =>
  ["ambient", "primary", "inherited", "project-inherited"].includes(source.split(":")[0]);

// A model that advertises no configurable reasoning effort cannot hold one, so a
// tier resolving to such a model resolves to no effort rather than to the effort
// a neighbouring tier, a trusted project or the ambient session would supply.
// Without this a model like claude-haiku-4.5 could not serve a tier at all.
function effortForModel(model, reasoningEffort, models) {
  if (reasoningEffort.value === undefined || !inheritedEffort(reasoningEffort.source)) return reasoningEffort;
  return advertisesNoReasoningEffort(model, models) ? { value: undefined, source: noEffortSource } : reasoningEffort;
}

function resolveField(tier, key, settings, origins, flags, ambient) {
  const own = key(tier);
  if (flags[own] !== undefined) return { value: flags[own], source: "flag" };
  if (settings[own] !== undefined) {
    return { value: settings[own], source: sourceLabel(origins[own], "configured", tier) };
  }
  const index = tiers.indexOf(tier);
  // Nearest configured tier; an equidistant pair prefers the heavier tier so
  // inheritance never silently downgrades an assignment.
  for (let distance = 1; distance < tiers.length; distance += 1) {
    for (const position of [index + distance, index - distance]) {
      const other = tiers[position];
      if (other !== undefined && settings[key(other)] !== undefined) {
        return { value: settings[key(other)], source: sourceLabel(origins[key(other)], "inherited", other) };
      }
    }
  }
  return ambient === undefined ? { value: undefined, source: "unset" } : { value: ambient, source: "ambient" };
}

export function resolveTier(tier, { settings = {}, origins = {}, ambient = {}, flags = {}, models } = {}) {
  requireConfig(tiers.includes(tier), `unknown model tier ${JSON.stringify(tier)}`);
  requireConfig(Array.isArray(models),
    "resolving a tier needs this session's model catalog, which says whether its model takes a reasoning effort");
  const model = resolveField(tier, modelKey, settings, origins, flags, ambient.model);
  const reasoningEffort = resolveField(tier, effortKey, settings, origins, flags, ambient.reasoningEffort);
  return { tier, model, reasoningEffort: effortForModel(model.value, reasoningEffort, models) };
}

// A tier's fallback is explicit or absent; only its effort falls back, to the
// tier's own effective effort, and that pair is then validated like any other.
export function resolveFallback(primary, { settings = {}, origins = {}, models } = {}) {
  const { tier } = primary;
  requireConfig(Array.isArray(models),
    "resolving a tier fallback needs this session's model catalog, which says whether its model takes a reasoning effort");
  const model = settings[fallbackModelKey(tier)];
  if (model === undefined) return undefined;
  const effort = settings[fallbackEffortKey(tier)];
  // The tier's own effort reaches the fallback the way an inherited one reaches
  // a tier, so a fallback model that advertises none does not receive it either.
  const reasoningEffort = effortForModel(model, effort === undefined
    ? { value: primary.reasoningEffort.value, source: "primary" }
    : { value: effort, source: sourceLabel(origins[fallbackEffortKey(tier)], "configured", tier) }, models);
  return {
    tier,
    model: { value: model, source: sourceLabel(origins[fallbackModelKey(tier)], "configured", tier) },
    reasoningEffort,
    // A fallback resolving to this tier's own assignment is not a fallback, so
    // it is never offered; the same model at a different effort still is.
    identical: model === primary.model.value && reasoningEffort.value === primary.reasoningEffort.value,
  };
}

// An effort with no model configures nothing. Storing that pair is refused, and
// one that reaches us anyway stays inert and is reported rather than guessed at.
export function orphanFallbackEfforts(settings = {}) {
  return tiers.filter((tier) =>
    settings[fallbackEffortKey(tier)] !== undefined && settings[fallbackModelKey(tier)] === undefined);
}

export function resolvedAssignment(resolution) {
  return { model: resolution.model.value, reasoningEffort: resolution.reasoningEffort.value };
}

const assignmentText = (resolution) => {
  const show = ({ value, source }) =>
    `${value ?? (source === noEffortSource ? "(not configurable)" : "(unset)")} [${source}]`;
  return `model=${show(resolution.model)} reasoning=${show(resolution.reasoningEffort)}`;
};

export function describeTier(resolution) {
  return `${resolution.tier}: ${assignmentText(resolution)}`;
}

export function describeFallback(resolution) {
  if (!resolution) return "fallback: (none)";
  return `fallback: ${assignmentText(resolution)}${resolution.identical
    ? " -- NOT OFFERED: identical to this tier's own assignment" : ""}`;
}

export async function ambientAssignment(parent) {
  const current = await parent.rpc.model.getCurrent();
  return { model: current.modelId, reasoningEffort: current.reasoningEffort };
}

// An untrusted repository's file is located but never parsed, so its contents
// cannot influence this session in any way, including by failing to parse.
// A trusted file that will not parse is reported rather than thrown here, so the
// directory stays inspectable and revocable; every consumer of the settings
// refuses instead.
export function projectLayer(workingDirectory, trusted) {
  if (!trusted) return locateProjectConfig(workingDirectory);
  try {
    return readProjectConfig(workingDirectory, validateSettings);
  } catch (error) {
    return { ...locateProjectConfig(workingDirectory), error: String(error.message ?? error) };
  }
}

export function requireUsableProject(configuration) {
  if (configuration.project?.error) throw new Error(configuration.project.error);
  return configuration;
}

export async function loadConfiguration(parent) {
  const store = await configurationStore(parent);
  const { stored, settings } = store.read();
  const trustedProjects = store.readTrust();
  const projectPath = canonicalProjectPath(store.workingDirectory);
  const trustRecord = trustedProjects.find((entry) => entry.path === projectPath);
  const project = projectLayer(store.workingDirectory, trustRecord !== undefined);
  const effective = layerSettings(settings, project.settings);
  const ambient = await ambientAssignment(parent);
  const { list } = await parent.rpc.model.list();
  return {
    store, stored, settings, ambient, models: list,
    trustedProjects, trustRecord, projectPath, project, effective,
    autoPostReviews: effective.settings.autoPostReviews ?? configurationDefaults.autoPostReviews,
    autoPostSource: effective.origins.autoPostReviews === "project" ? "project"
      : effective.origins.autoPostReviews === "personal" ? "configured" : "default",
  };
}

// Only explicitly configured, inherited or project-supplied values are validated
// on update; a purely ambient tier carries no explicit setting and is validated
// again when a review actually resolves it.
export function tierValidation(resolution, models) {
  const explicit = [resolution.model.source, resolution.reasoningEffort.source]
    .some((source) => !implicitSources.includes(source));
  try {
    validateModelAssignment(resolvedAssignment(resolution), models);
    return { explicit, valid: true };
  } catch (error) {
    return { explicit, valid: false, error: String(error.message ?? error) };
  }
}

export function validateConfiguredTiers(settings, ambient, models, origins = {}) {
  for (const tier of orphanFallbackEfforts(settings)) {
    throw new Error(`Refused ${tier}-tier fallback configuration: ${fallbackEffortKey(tier)} is set but ` +
      `${fallbackModelKey(tier)} is not, so no fallback model exists. Set both, or unset ` +
      `${fallbackEffortKey(tier)}. Nothing was changed.`);
  }
  for (const tier of tiers) {
    const resolution = resolveTier(tier, { settings, origins, ambient, models });
    const checked = tierValidation(resolution, models);
    if (checked.explicit && !checked.valid) {
      throw new Error(`Refused ${tier}-tier configuration: ${checked.error} ` +
        `Effective ${describeTier(resolution)}. Set or unset a tier's model and reasoning effort ` +
        "together, or use /pr-review models to list supported values. Nothing was changed.");
    }
    // A configured fallback is always explicit, so it is always validated. An
    // effort the fallback model cannot support is refused, never lowered to fit.
    const fallback = resolveFallback(resolution, { settings, origins, models });
    const checkedFallback = fallback && tierValidation(fallback, models);
    if (checkedFallback && !checkedFallback.valid) {
      throw new Error(`Refused ${tier}-tier fallback configuration: ${checkedFallback.error} ` +
        `Effective ${tier} ${describeFallback(fallback)}. An unset ${fallbackEffortKey(tier)} follows the ` +
        `tier's own effective effort, so set ${fallbackEffortKey(tier)} explicitly or choose another ` +
        "fallback model. Nothing was changed.");
    }
  }
  return settings;
}

export function availabilityReport(models) {
  return subscriptionModels(models).map((model) =>
    `${model.id}: reasoning=${reasoningEfforts(model).join(",") || "(not configurable)"}`).join("\n");
}

function describeProject({ project, trustRecord, projectPath, settings }) {
  const lines = [`Working directory: ${projectPath}.`];
  if (!trustRecord) {
    return [...lines, "Project trust: NOT TRUSTED.", project.status === "absent"
      ? `Project configuration: none at ${projectConfigDisplayPath}.`
      : `Project configuration: IGNORED. ${project.filename} exists but this directory is not trusted, ` +
        "so it was not read or merged. A repository cannot trust itself; run /pr-review-config trust here to apply it."];
  }
  lines.push(`Project trust: TRUSTED by an explicit personal command at ${trustRecord.trustedAt}.`);
  if (project.error) {
    lines.push(`Project configuration: ERROR. ${project.error}`,
      "  Nothing was merged. Reviews and configuration updates are refused until it is fixed or this " +
      "directory is untrusted.");
  } else if (project.status === "absent") {
    lines.push(`Project configuration: none at ${projectConfigDisplayPath}; personal settings apply unchanged.`);
  } else {
    lines.push(`Project configuration: ${project.filename}`,
      `  applied settings: ${Object.keys(project.settings).length ? JSON.stringify(project.settings) : "(none)"}.`);
    const shadowed = Object.keys(project.settings).filter((key) => Object.hasOwn(settings, key));
    if (shadowed.length) lines.push(`  overriding personal ${shadowed.join(", ")}.`);
  }
  return lines;
}

export function describeConfiguration(configuration, { flags = {}, heading } = {}) {
  const {
    store, stored, settings, ambient, models, effective, autoPostReviews, autoPostSource, trustedProjects,
  } = configuration;
  const lines = [
    heading ?? "Personal PR review configuration.",
    `Location: ${store.filename}${stored ? "" : " (not created yet; defaults shown)"}.`,
    `Stored settings: ${Object.keys(settings).length ? JSON.stringify(settings) : "(none)"}.`,
    ...describeProject(configuration),
    `Ambient session model: ${ambient.model ?? "(unset)"} reasoning=${ambient.reasoningEffort ?? "(unset)"}.`,
    "Effective tier assignments:",
  ];
  const orphans = orphanFallbackEfforts(effective.settings);
  for (const tier of tiers) {
    const resolution = resolveTier(tier,
      { settings: effective.settings, origins: effective.origins, ambient, flags, models });
    const checked = tierValidation(resolution, models);
    lines.push(`  ${describeTier(resolution)}${checked.valid ? ""
      : ` -- UNUSABLE: ${checked.error}${checked.explicit ? "" : " (ambient only; no explicit setting)"}`}`);
    // Every tier reports its fallback, so an unset one is visibly unset rather
    // than left to be assumed, and a stored pair that configures nothing says so.
    const fallback = resolveFallback(resolution,
      { settings: effective.settings, origins: effective.origins, models });
    const checkedFallback = fallback && tierValidation(fallback, models);
    lines.push(`    ${describeFallback(fallback)}${fallback
      ? (checkedFallback.valid ? "" : ` -- UNUSABLE: ${checkedFallback.error}`)
      : (orphans.includes(tier) ? `; ${fallbackEffortKey(tier)} is set but ${fallbackModelKey(tier)} ` +
        "is not, so no fallback is configured." : "")}`);
  }
  lines.push(
    `autoPostReviews: ${autoPostReviews} [${autoPostSource}].`,
    "Precedence: invocation flags, then a trusted project's settings, then personal settings, then the ambient " +
      "session assignment. Unset tiers inherit the nearest configured tier, preferring the heavier tier when " +
      "equidistant. A tier whose resolved model supports no configurable reasoning effort takes none, reported " +
      `[${noEffortSource}], rather than inheriting an effort it cannot hold; an effort set for that tier is still ` +
      "validated against it and refused. Quick and deep reviews use the heavy tier only; balanced also runs its " +
      "overview reviewer on the light tier; full adds a conventions reviewer on the medium tier.",
    "Fallback models are optional and start unset. A tier's fallback is explicit or absent: it never inherits " +
      "from another tier, and an unset fallback effort follows that tier's own effective effort, unless the " +
      "fallback model supports no configurable effort, in which case it takes none too. A configured " +
      "fallback gets at most one attempt, for the one reviewer whose own execution failed explicitly, and never " +
      "a whole-review restart. A cancelled reviewer and an unusable explicit assignment are not eligible. " +
      "Reviews have no timeout, so elapsed time alone never triggers a fallback and a hung reviewer waits " +
      "indefinitely. Fallbacks have no invocation flag; configure them here.",
    "Invocation flags such as heavyModel=/heavyEffort= and --comment/--no-comment override these settings for " +
      "that invocation only and never rewrite the personal or project file.",
    "Explicit values are never silently substituted or lowered: an unusable assignment refuses the review.",
    `Trusted project directories: ${trustedProjects.length}${trustedProjects.length
      ? `\n${trustedProjects.map((entry) => `  ${entry.path} (trusted ${entry.trustedAt})`).join("\n")}` : ""}`,
    "A repository cannot authorize itself: only /pr-review-config trust records trust, only in the personal " +
      `store, and a project file may carry ${configurationKeys.join(", ")} and nothing else.`,
    "Trusting a repository lets its file set autoPostReviews=true, which can publish an --all run unattended.",
    trustBindingNotes,
    "This command ran no inference, made no GitHub request, and started no review work.",
  );
  return lines.join("\n");
}

export const configHelp = [
  "Copilot PR Review - personal configuration and trusted project overrides",
  "",
  "Usage: /pr-review-config [show]",
  "       /pr-review-config key=value [key=value ...]",
  "       /pr-review-config unset key [key ...]",
  "       /pr-review-config trust",
  "       /pr-review-config untrust [ABSOLUTE_PATH]",
  "       /pr-review-config help",
  "",
  `Keys: ${configurationKeys.join(", ")}.`,
  "Model and reasoning-effort values are validated against this session's available subscription models;",
  "use /pr-review models to list them. Unknown keys, malformed assignments and unsupported values are",
  "errors that change nothing. autoPostReviews accepts only true or false and defaults to false.",
  "Assignments in one invocation are applied together or not at all.",
  "",
  "A tier's optional <tier>FallbackModel is used for at most one attempt, for the one reviewer whose own",
  "execution failed explicitly; it never restarts the review and never replaces an unusable explicit",
  "assignment. Reviews have no timeout, so elapsed time alone never triggers it. Fallbacks start unset and",
  "never inherit from another tier. <tier>FallbackEffort is optional and follows that tier's own effective",
  "effort when unset; it cannot be set without <tier>FallbackModel.",
  "",
  "A model that supports no configurable reasoning effort takes none, whether it serves a tier or that tier's",
  "fallback: it does not inherit the effort a neighbouring tier, a trusted project or this session would",
  "otherwise supply. Setting <tier>Effort or <tier>FallbackEffort explicitly on such a model is still refused,",
  "because an explicit value is never dropped or lowered to fit. Use /pr-review models to see which models",
  "report a configurable effort.",
  "",
  `trust records this session's working directory in the personal store, so ${projectConfigDisplayPath}`,
  "in that directory may override the same keys. Without that record the project file is ignored, never",
  "merged, and never able to trust itself. untrust revokes the current directory, or the given path.",
  "Trusting a repository lets its file set autoPostReviews=true, which can publish an --all run unattended.",
  "",
  trustBindingNotes,
].join("\n");

function trustOutcome(configuration, command) {
  const { store, trustedProjects, projectPath } = configuration;
  if (command.action === "trust") {
    if (configuration.trustRecord) return { changed: false, heading: `Project already trusted: ${projectPath}.` };
    // Validate the configuration that trusting would produce before recording
    // trust, so a broken or unusable project file changes nothing.
    const project = readProjectConfig(store.workingDirectory, validateSettings);
    const merged = layerSettings(configuration.settings, project.settings);
    validateConfiguredTiers(merged.settings, configuration.ambient, configuration.models, merged.origins);
    store.writeTrust([...trustedProjects, { path: projectPath, trustedAt: new Date().toISOString() }]);
    return {
      changed: true,
      heading: `Project trusted: ${projectPath}. Its ${projectConfigDisplayPath} now overrides personal settings, ` +
        "including autoPostReviews, which can publish an --all run unattended.",
    };
  }
  // Revocation must always be available, even when the project file that trust
  // activated is itself unusable.
  const targets = new Set([command.path ?? projectPath]);
  if (command.path !== undefined) {
    try { targets.add(canonicalProjectPath(command.path)); } catch { /* a removed directory is still revocable */ }
  }
  const next = trustedProjects.filter((entry) => !targets.has(entry.path));
  if (next.length === trustedProjects.length) {
    return { changed: false, heading: `No trust record to revoke for ${[...targets].join(" or ")}.` };
  }
  store.writeTrust(next);
  return {
    changed: true,
    heading: `Project trust revoked for ${trustedProjects.filter((entry) => targets.has(entry.path))
      .map((entry) => entry.path).join(", ")}. Its project configuration is ignored again.`,
  };
}

export async function executeConfiguration(parent, args) {
  const command = parseConfigArgs(args);
  if (command.action === "help") {
    await parent.log(configHelp);
    return { action: "help" };
  }
  const configuration = await loadConfiguration(parent);
  if (command.action === "show") {
    await parent.log(describeConfiguration(configuration));
    return { action: "show", settings: configuration.settings, effective: configuration.effective.settings };
  }
  if (["trust", "untrust"].includes(command.action)) {
    const outcome = trustOutcome(configuration, command);
    // Re-read so the report describes the configuration the change produced.
    await parent.log(describeConfiguration(await loadConfiguration(parent), { heading: outcome.heading }));
    return { action: command.action, changed: outcome.changed, path: configuration.projectPath };
  }
  requireUsableProject(configuration);
  const previous = configuration.settings;
  const next = { ...previous };
  if (command.action === "set") Object.assign(next, command.assignments);
  else for (const key of command.keys) delete next[key];
  const changed = command.action === "set"
    ? Object.keys(command.assignments).filter((key) => next[key] !== previous[key])
    : command.keys.filter((key) => Object.hasOwn(previous, key));
  validateSettings(next);
  // A trusted project's settings are part of the configuration the change
  // produces, so they are validated with it.
  const merged = layerSettings(next, configuration.project.settings);
  validateConfiguredTiers(merged.settings, configuration.ambient, configuration.models, merged.origins);
  configuration.store.write(next);
  const effective = layerSettings(next, configuration.project.settings);
  const updated = {
    ...configuration, stored: true, settings: next, effective,
    autoPostReviews: effective.settings.autoPostReviews ?? configurationDefaults.autoPostReviews,
    autoPostSource: effective.origins.autoPostReviews === "project" ? "project"
      : effective.origins.autoPostReviews === "personal" ? "configured" : "default",
  };
  await parent.log(describeConfiguration(updated, {
    heading: changed.length
      ? `Personal PR review configuration updated: ${command.action === "set"
        ? changed.map((key) => `${key}=${next[key]}`).join(" ") : `unset ${changed.join(" ")}`}.`
      : "Personal PR review configuration unchanged; the requested values were already in effect.",
  }));
  return { action: command.action, changed, settings: next };
}
