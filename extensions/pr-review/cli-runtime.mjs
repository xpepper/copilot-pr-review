import { accessSync, constants, statSync } from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";

function usableFile(path) {
  if (!statSync(path).isFile()) return false;
  accessSync(path, path.endsWith(".js") ? constants.R_OK : constants.X_OK);
  return true;
}

export function resolveCliPath(env = process.env) {
  if (env.COPILOT_CLI_PATH) {
    const path = resolve(env.COPILOT_CLI_PATH);
    if (!usableFile(path)) throw new Error(`COPILOT_CLI_PATH is not a file: ${path}`);
    return path;
  }
  const executable = process.platform === "win32" ? "copilot.exe" : "copilot";
  for (const directory of (env.PATH ?? "").split(delimiter)) {
    // Never turn an empty/relative PATH entry into execution of PR-local code.
    if (!isAbsolute(directory)) continue;
    const path = join(directory, executable);
    try {
      if (usableFile(path)) return path;
    } catch (error) {
      if (!["ENOENT", "ENOTDIR", "EACCES"].includes(error.code)) throw error;
    }
  }
  throw new Error("Could not find the Copilot CLI in an absolute PATH directory. " +
    "Add the installed copilot executable to PATH or set COPILOT_CLI_PATH to its full path, then restart Copilot.");
}
