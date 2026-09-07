import { randomUUID } from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync,
  renameSync, unlinkSync, writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, sep } from "node:path";
import { reasoningEfforts, subscriptionModels, validateModelAssignment } from "./fixture.mjs";

// Personal configuration only. C2 owns explicitly trusted project overrides, so
// nothing here reads a repository-provided file: a repository must not be able
// to authorize itself by containing one.
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

function requireConfig(condition, message) {
  if (!condition) throw new Error(`Invalid PR review configuration: ${message}.`);
}

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
  const tokens = String(args ?? "").trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return { action: "show" };
  if (["show", "help", "--help"].includes(tokens[0])) {
    requireConfig(tokens.length === 1, `${tokens[0]} takes no further arguments`);
    return { action: tokens[0] === "show" ? "show" : "help" };
  }
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
      `malformed argument ${JSON.stringify(token)}; use "show", "unset KEY", or "key=value"`);
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
  const working = metadata.workingDirectory;
  requireConfig(typeof working === "string" && isAbsolute(working) &&
    directory !== working && !directory.startsWith(`${working}${sep}`),
  "the personal configuration must live outside the reviewed checkout");
  function read() {
    let raw;
    try {
      const stat = lstatSync(filename);
      requireConfig(stat.isFile() && !stat.isSymbolicLink(), `unsafe configuration file ${filename}`);
      raw = readFileSync(filename, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return { stored: false, settings: {} };
      throw error;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      requireConfig(false, `${filename} is not valid JSON (${error.message}); fix or remove it. Nothing was changed`);
    }
    requireConfig(parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
      Object.hasOwn(parsed, "schemaVersion") && Object.hasOwn(parsed, "settings") &&
      Object.keys(parsed).every((key) => ["schemaVersion", "settings"].includes(key)),
    `${filename} does not hold a supported configuration record`);
    requireConfig(parsed.schemaVersion === configSchemaVersion,
      `${filename} has incompatible schema version ${JSON.stringify(parsed.schemaVersion)}; this build supports ${configSchemaVersion}`);
    validateSettings(parsed.settings);
    return { stored: true, settings: parsed.settings };
  }
  function write(settings) {
    validateSettings(settings);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const record = { schemaVersion: configSchemaVersion, settings };
    const temporary = join(directory, `.pr-review-config-${randomUUID()}.tmp`);
    let fd;
    try {
      fd = openSync(temporary, "wx", 0o600);
      writeFileSync(fd, JSON.stringify(record, null, 2));
      fsyncSync(fd);
      closeSync(fd);
      fd = undefined;
      renameSync(temporary, filename);
    } finally {
      if (fd !== undefined) closeSync(fd);
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    return record;
  }
  return { directory, filename, read, write };
}

function resolveField(tier, key, settings, flags, ambient) {
  const own = key(tier);
  if (flags[own] !== undefined) return { value: flags[own], source: "flag" };
  if (settings[own] !== undefined) return { value: settings[own], source: `configured:${tier}` };
  const index = tiers.indexOf(tier);
  // Nearest configured tier; an equidistant pair prefers the heavier tier so
  // inheritance never silently downgrades an assignment.
  for (let distance = 1; distance < tiers.length; distance += 1) {
    for (const position of [index + distance, index - distance]) {
      const other = tiers[position];
      if (other !== undefined && settings[key(other)] !== undefined) {
        return { value: settings[key(other)], source: `inherited:${other}` };
      }
    }
  }
  return ambient === undefined ? { value: undefined, source: "unset" } : { value: ambient, source: "ambient" };
}

export function resolveTier(tier, { settings = {}, ambient = {}, flags = {} } = {}) {
  requireConfig(tiers.includes(tier), `unknown model tier ${JSON.stringify(tier)}`);
  return {
    tier,
    model: resolveField(tier, modelKey, settings, flags, ambient.model),
    reasoningEffort: resolveField(tier, effortKey, settings, flags, ambient.reasoningEffort),
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

export async function loadConfiguration(parent) {
  const store = await configurationStore(parent);
  const { stored, settings } = store.read();
  const ambient = await ambientAssignment(parent);
  const { list } = await parent.rpc.model.list();
  return {
    store, stored, settings, ambient, models: list,
    autoPostReviews: settings.autoPostReviews ?? configurationDefaults.autoPostReviews,
    autoPostSource: settings.autoPostReviews === undefined ? "default" : "configured",
  };
}

// Only explicitly configured or inherited values are validated on update; a
// purely ambient tier carries no explicit setting and is validated again when a
// review actually resolves it.
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

export function validateConfiguredTiers(settings, ambient, models) {
  for (const tier of tiers) {
    const resolution = resolveTier(tier, { settings, ambient });
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

export function describeConfiguration(configuration, { flags = {}, heading } = {}) {
  const { store, stored, settings, ambient, models, autoPostReviews, autoPostSource } = configuration;
  const lines = [
    heading ?? "Personal PR review configuration.",
    `Location: ${store.filename}${stored ? "" : " (not created yet; defaults shown)"}.`,
    `Stored settings: ${Object.keys(settings).length ? JSON.stringify(settings) : "(none)"}.`,
    `Ambient session model: ${ambient.model ?? "(unset)"} reasoning=${ambient.reasoningEffort ?? "(unset)"}.`,
    "Effective tier assignments:",
  ];
  for (const tier of tiers) {
    const resolution = resolveTier(tier, { settings, ambient, flags });
    const checked = tierValidation(resolution, models);
    lines.push(`  ${describeTier(resolution)}${checked.valid ? ""
      : ` -- UNUSABLE: ${checked.error}${checked.explicit ? "" : " (ambient only; no explicit setting)"}`}`);
  }
  lines.push(
    `autoPostReviews: ${autoPostReviews} [${autoPostSource}].`,
    "Unset tiers inherit the nearest configured tier, preferring the heavier tier when equidistant, " +
      "then the ambient session model and reasoning effort. Quick review uses the heavy tier only.",
    "Invocation flags such as heavyModel=/heavyEffort= and --comment/--no-comment override these saved " +
      "settings for that invocation only and never rewrite this file.",
    "Explicit values are never silently substituted or lowered: an unusable assignment refuses the review.",
    "No project-provided configuration is read; a repository cannot authorize itself. Trusted project " +
      "overrides remain unimplemented.",
    "This command ran no inference, made no GitHub request, and started no review work.",
  );
  return lines.join("\n");
}

export const configHelp = [
  "Copilot PR Review - personal configuration",
  "",
  "Usage: /pr-review-config [show]",
  "       /pr-review-config key=value [key=value ...]",
  "       /pr-review-config unset key [key ...]",
  "       /pr-review-config help",
  "",
  `Keys: ${configurationKeys.join(", ")}.`,
  "Model and reasoning-effort values are validated against this session's available subscription models;",
  "use /pr-review models to list them. Unknown keys, malformed assignments and unsupported values are",
  "errors that change nothing. autoPostReviews accepts only true or false and defaults to false.",
  "Assignments in one invocation are applied together or not at all.",
  "Configuration is personal, stored outside any reviewed checkout, and never read from a repository.",
].join("\n");

export async function executeConfiguration(parent, args) {
  const command = parseConfigArgs(args);
  if (command.action === "help") {
    await parent.log(configHelp);
    return { action: "help" };
  }
  const configuration = await loadConfiguration(parent);
  if (command.action === "show") {
    await parent.log(describeConfiguration(configuration));
    return { action: "show", settings: configuration.settings };
  }
  const previous = configuration.settings;
  const next = { ...previous };
  if (command.action === "set") Object.assign(next, command.assignments);
  else for (const key of command.keys) delete next[key];
  const changed = command.action === "set"
    ? Object.keys(command.assignments).filter((key) => next[key] !== previous[key])
    : command.keys.filter((key) => Object.hasOwn(previous, key));
  validateSettings(next);
  validateConfiguredTiers(next, configuration.ambient, configuration.models);
  configuration.store.write(next);
  const updated = {
    ...configuration, stored: true, settings: next,
    autoPostReviews: next.autoPostReviews ?? configurationDefaults.autoPostReviews,
    autoPostSource: next.autoPostReviews === undefined ? "default" : "configured",
  };
  await parent.log(describeConfiguration(updated, {
    heading: changed.length
      ? `Personal PR review configuration updated: ${command.action === "set"
        ? changed.map((key) => `${key}=${next[key]}`).join(" ") : `unset ${changed.join(" ")}`}.`
      : "Personal PR review configuration unchanged; the requested values were already in effect.",
  }));
  return { action: command.action, changed, settings: next };
}
