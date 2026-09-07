import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join } from "node:path";

// The trusted-project boundary. A repository may supply configuration settings
// and nothing else: trust itself is recorded only in the personal store, so
// nothing inside a repository can grant, widen or refresh its own trust.
export const projectConfigSegments = [".copilot", "pr-review", "config.json"];
export const projectConfigDisplayPath = projectConfigSegments.join("/");
export const projectSchemaVersion = 1;
export const projectConfigMaxBytes = 64 * 1024;
export const trustFilename = "trusted-projects.json";
export const trustSchemaVersion = 1;

export function requireConfig(condition, message) {
  if (!condition) throw new Error(`Invalid PR review configuration: ${message}.`);
}

function requireWorkingDirectory(workingDirectory) {
  requireConfig(typeof workingDirectory === "string" && isAbsolute(workingDirectory),
    "this session reports no absolute working directory, so no project configuration can be located");
  return workingDirectory;
}

// Trust is bound to the canonical absolute path of the reviewed working
// directory. A repository's own contents cannot choose where it is checked out,
// and resolving symlinks here keeps two spellings of one directory from
// becoming two different trust decisions.
export function canonicalProjectPath(workingDirectory) {
  requireWorkingDirectory(workingDirectory);
  try {
    return realpathSync(workingDirectory);
  } catch (error) {
    return requireConfig(false,
      `cannot resolve the working directory ${workingDirectory} (${error.code ?? error.message})`);
  }
}

export function projectConfigPath(workingDirectory) {
  return join(requireWorkingDirectory(workingDirectory), ...projectConfigSegments);
}

// Locate without reading, and without following a symlink out of the checkout.
// Untrusted repositories are reported, never parsed.
export function locateProjectConfig(workingDirectory) {
  const filename = projectConfigPath(workingDirectory);
  let current = workingDirectory;
  for (const segment of projectConfigSegments) {
    current = join(current, segment);
    const last = current === filename;
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (["ENOENT", "ENOTDIR"].includes(error.code)) return { filename, status: "absent" };
      return { filename, status: "unsafe", reason: `${current} cannot be inspected (${error.code ?? error.message})` };
    }
    if (stat.isSymbolicLink()) return { filename, status: "unsafe", reason: `${current} is a symbolic link` };
    if (last ? !stat.isFile() : !stat.isDirectory()) {
      return { filename, status: "unsafe", reason: `${current} is not a ${last ? "regular file" : "directory"}` };
    }
    if (last && stat.size > projectConfigMaxBytes) {
      return { filename, status: "unsafe", reason: `${current} exceeds ${projectConfigMaxBytes} bytes` };
    }
  }
  return { filename, status: "file" };
}

// `validate` is the personal store's own settings validator, so a project file
// can carry exactly the same keys and no others. Passing it in keeps this module
// free of any dependency on the configuration command surface.
export function readProjectConfig(workingDirectory, validate) {
  const located = locateProjectConfig(workingDirectory);
  if (located.status === "absent") return located;
  requireConfig(located.status === "file", `unsafe project configuration: ${located.reason}`);
  const raw = readFileSync(located.filename, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    requireConfig(false,
      `${located.filename} is not valid JSON (${error.message}); fix or remove it. Nothing was changed`);
  }
  requireConfig(parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
    Object.hasOwn(parsed, "schemaVersion") && Object.hasOwn(parsed, "settings") &&
    Object.keys(parsed).every((key) => ["schemaVersion", "settings"].includes(key)),
  `${located.filename} does not hold a supported project configuration record`);
  requireConfig(parsed.schemaVersion === projectSchemaVersion,
    `${located.filename} has incompatible schema version ${JSON.stringify(parsed.schemaVersion)}; ` +
    `this build supports ${projectSchemaVersion}`);
  validate(parsed.settings);
  return { ...located, settings: parsed.settings };
}

export function validateTrustedProjects(entries) {
  requireConfig(Array.isArray(entries), "trusted projects must be a JSON array");
  const seen = new Set();
  for (const entry of entries) {
    requireConfig(entry && typeof entry === "object" && !Array.isArray(entry) &&
      Object.hasOwn(entry, "path") && Object.hasOwn(entry, "trustedAt") &&
      Object.keys(entry).every((key) => ["path", "trustedAt"].includes(key)),
    "each trusted project must be a {path, trustedAt} object");
    requireConfig(typeof entry.path === "string" && isAbsolute(entry.path),
      `trusted project path ${JSON.stringify(entry.path)} must be absolute`);
    requireConfig(typeof entry.trustedAt === "string" && Number.isFinite(Date.parse(entry.trustedAt)),
      `trusted project ${entry.path} has an invalid trustedAt timestamp`);
    requireConfig(!seen.has(entry.path), `duplicate trusted project ${entry.path}`);
    seen.add(entry.path);
  }
  return entries;
}

// What the binding proves, and what it does not. Displayed with every report so
// the limits travel with the feature rather than living only in the docs.
export const trustBindingNotes = [
  "Trust is bound to the canonical absolute path of the working directory on this machine, recorded by an",
  "explicit personal command. It proves you trusted that exact directory; it does not prove which repository,",
  "remote, branch or file content is there now. A different checkout later placed at the same path inherits the",
  "trust, and moving or renaming the directory silently drops it. Revoke with /pr-review-config untrust.",
].join("\n");
