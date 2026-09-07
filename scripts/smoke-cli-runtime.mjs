import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { resolveCliPath } from "../extensions/pr-review/cli-runtime.mjs";

const directory = mkdtempSync(join(tmpdir(), "pr-review-cli-path-"));
const executable = process.platform === "win32" ? "copilot.exe" : "copilot";
try {
  const missing = join(directory, "missing");
  const bin = join(directory, "bin with spaces");
  mkdirSync(bin);
  const cli = join(bin, executable);
  writeFileSync(cli, "", { mode: 0o755 });
  assert.equal(resolveCliPath({ PATH: [missing, bin].join(delimiter) }), cli);
  assert.equal(resolveCliPath({ COPILOT_CLI_PATH: cli, PATH: missing }), cli);
  assert.throws(() => resolveCliPath({ COPILOT_CLI_PATH: missing, PATH: bin }), /ENOENT/);
  assert.throws(() => resolveCliPath({ COPILOT_CLI_PATH: bin, PATH: bin }), /not a file/);
  for (const PATH of [undefined, "", ".", "relative", `${delimiter}.${delimiter}relative`]) {
    assert.throws(() => resolveCliPath({ PATH }), /COPILOT_CLI_PATH/);
  }
  const link = join(directory, "linked-bin");
  mkdirSync(link);
  symlinkSync(cli, join(link, executable));
  assert.equal(resolveCliPath({ PATH: link }), join(link, executable));
  if (process.platform !== "win32") {
    chmodSync(cli, 0o644);
    assert.throws(() => resolveCliPath({ PATH: bin }), /Could not find/);
    assert.throws(() => resolveCliPath({ COPILOT_CLI_PATH: cli, PATH: link }), /EACCES/);
  }
  const script = join(directory, "copilot.js");
  writeFileSync(script, "", { mode: 0o644 });
  assert.equal(resolveCliPath({ COPILOT_CLI_PATH: script }), script);
  console.log("PASS CLI PATH discovery, spaces/symlinks, explicit override, refusals and JS entrypoint");
} finally {
  rmSync(directory, { recursive: true });
}
