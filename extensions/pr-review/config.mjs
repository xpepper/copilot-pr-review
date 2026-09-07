import { randomUUID } from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync,
  renameSync, unlinkSync, writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, sep } from "node:path";
import { reasoningEfforts, subscriptionModels, validateModelAssignment } from "./fixture.mjs";
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
const assignmentKeys = tiers.flatMap((tier) => [modelKey(tier), effortKey(tier)]);
const booleanKeys = ["autoPostReviews"];
export const configurationKeys = [...assignmentKeys, ...booleanKeys];
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

export function resolveTier(tier, { settings = {}, origins = {}, ambient = {}, flags = {} } = {}) {
  requireConfig(tiers.includes(tier), `unknown model tier ${JSON.stringify(tier)}`);
  return {
    tier,
    model: resolveField(tier, modelKey, settings, origins, flags, ambient.model),
    reasoningEffort: resolveField(tier, effortKey, settings, origins, flags, ambient.reasoningEffort),
  };
}

export function resolvedAssignment(resolution) {
  return { model: resolution.model.value, reasoningEffort: resolution.reasoningEffort.value };
}

export function describeTier(resolution) {
  const show = ({ value, source }) => `${value ?? "(unset)"} [${source}]`;
  return `${resolution.tier}: model=${show(resolution.model)} reasoning=${show(resolution.reasoningEffort)}`;
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
    .some((source) => source !== "ambient" && source !== "unset");
  try {
    validateModelAssignment(resolvedAssignment(resolution), models);
    return { explicit, valid: true };
  } catch (error) {
    return { explicit, valid: false, error: String(error.message ?? error) };
  }
}

export function validateConfiguredTiers(settings, ambient, models, origins = {}) {
  for (const tier of tiers) {
    const resolution = resolveTier(tier, { settings, origins, ambient });
    const checked = tierValidation(resolution, models);
    if (checked.explicit && !checked.valid) {
      throw new Error(`Refused ${tier}-tier configuration: ${checked.error} ` +
        `Effective ${describeTier(resolution)}. Set or unset a tier's model and reasoning effort ` +
        "together, or use /pr-review models to list supported values. Nothing was changed.");
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
  for (const tier of tiers) {
    const resolution = resolveTier(tier, { settings: effective.settings, origins: effective.origins, ambient, flags });
    const checked = tierValidation(resolution, models);
    lines.push(`  ${describeTier(resolution)}${checked.valid ? ""
      : ` -- UNUSABLE: ${checked.error}${checked.explicit ? "" : " (ambient only; no explicit setting)"}`}`);
  }
  lines.push(
    `autoPostReviews: ${autoPostReviews} [${autoPostSource}].`,
    "Precedence: invocation flags, then a trusted project's settings, then personal settings, then the ambient " +
      "session assignment. Unset tiers inherit the nearest configured tier, preferring the heavier tier when " +
      "equidistant. Quick review uses the heavy tier only.",
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
