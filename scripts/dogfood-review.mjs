// Review a real pull request of THIS repository through the installed plugin.
//
// This is the workflow's dogfooding step, not a no-inference probe: it spends
// Copilot credits on the mode's reviewers and, when candidates exist, on one
// adjudication pass. `copilot -p "/pr-review N"` cannot replace it: prompt mode
// starts an ambient model turn instead of dispatching the slash command (see
// the F1 integration caveats in ROADMAP.md), so the command is dispatched
// through the SDK's command RPC, exactly as the installed probes do.
import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runGit } from "../extensions/pr-review/checkout.mjs";
import { reviewModes } from "../extensions/pr-review/modes.mjs";
import { runGh } from "../extensions/pr-review/target.mjs";

const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
assert(sdkPath && cliPath, "Set COPILOT_SDK_PATH to the bundled SDK directory and COPILOT_CLI_PATH to the CLI");
const [number, ...flags] = process.argv.slice(2);
assert(/^[1-9]\d*$/.test(number ?? ""), "Usage: node scripts/dogfood-review.mjs NUMBER [--all] [mode/model flags]");
// Publication is a separate, explicitly authorized decision; this runner never
// makes it, and never silently selects findings for one.
assert(flags.includes("--no-comment"), "Pass --no-comment: this runner does not publish.");
assert(!flags.includes("--comment"), "Refusing --comment: publication needs its own explicit authorization.");
// This runner exists to capture an increment's own evidence: the models and
// efforts actually used, the credit cost, the tool calls and denials, the
// coverage diagnostics. All of that is read out of the lines --quiet suppresses,
// so a dogfood run may never be the run that hid its own evidence.
assert(!flags.includes("--quiet"), "Refusing --quiet: this runner records the whole timeline as an increment's evidence.");

const cwd = realpathSync(process.cwd());
const head = (await runGit(["rev-parse", "HEAD"], cwd)).trim();
const status = await runGit(["status", "--porcelain=v1", "--untracked-files=normal"], cwd);
const dirty = status.split("\n").filter((line) => line.trim() && !line.startsWith("??"));
assert.deepEqual(dirty, [], "Commit or discard tracked changes: the reviewer must read the reviewed revision");
const pull = JSON.parse(await runGh(["api", "--hostname", "github.com", "--method", "GET",
  `repos/${process.env.PR_REVIEW_DOGFOOD_REPOSITORY ?? "xpepper/copilot-pr-review"}/pulls/${number}`,
  "-H", "Accept: application/vnd.github+json"], cwd));
assert.equal(pull.head?.sha, head,
  `Local HEAD ${head} is not the head of PR #${number} (${pull.head?.sha}); push the branch first.`);
console.log(`Reviewing ${pull.base.repo.full_name}#${number} at ${head} from ${cwd}`);
console.log(`Diff size on GitHub: ${pull.additions} additions, ${pull.deletions} deletions, ${pull.changed_files} files`);

const { CopilotClient, RuntimeConnection } = await import(pathToFileURL(resolve(sdkPath, "index.js")).href);
const runtimeEnv = { ...process.env };
delete runtimeEnv.COPILOT_CLI_PATH;
const client = new CopilotClient({
  connection: RuntimeConnection.forStdio({ path: resolve(cliPath), env: runtimeEnv }),
});
try {
  const session = await client.createSession({
    enableExperimentalMode: true,
    enableConfigDiscovery: true,
    requestExtensions: true,
    availableTools: [],
    onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
    workingDirectory: cwd,
    ...(process.env.PR_REVIEW_AMBIENT_MODEL ? { model: process.env.PR_REVIEW_AMBIENT_MODEL } : {}),
  });
  await session.rpc.extensions.reload();
  const { extensions } = await session.rpc.extensions.list();
  const extension = extensions.find((entry) => entry.id.startsWith("plugin:copilot-pr-review:"));
  assert.equal(extension?.status, "running", "Install the current checkout before reviewing with it");
  console.log(`Running: ${extension.id}`);

  // Each mode labels its evidence with its own increment prefix, so the prefixes
  // are derived from the modes themselves: a hardcoded list silently waits for
  // an evidence line a newly added mode never emits.
  const evidencePrefixes = [...new Set(Object.values(reviewModes)
    .map((mode) => `${mode.evidencePrefix} evidence: `))];
  const review = Promise.withResolvers();
  const settled = Promise.withResolvers();
  const unsubscribe = session.on((event) => {
    if (!["session.info", "session.error"].includes(event.type)) return;
    const message = event.data.message;
    console.log(message);
    for (const prefix of evidencePrefixes) {
      if (message.startsWith(prefix)) review.resolve(JSON.parse(message.slice(prefix.length)));
    }
    if (message.startsWith("P2 evidence: ")) settled.resolve();
    if (message.startsWith("Review/publication failed:")) settled.reject(new Error(message));
  });
  try {
    const args = [number, ...flags].join(" ");
    console.log(`Dispatching /pr-review ${args}`);
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.equal(result.error, undefined, `Dispatch failed: ${result.error}`);
    // No deadline is imposed here either; cancellation stays the manual control.
    const report = await review.promise;
    await settled.promise;
    const billed = [...report.reviewers, ...(report.adjudicator ? [report.adjudicator] : [])];
    const charges = billed.flatMap((reviewer) => reviewer.billing ?? []);
    console.log(`Credit cost: ${charges.length &&
      billed.every((reviewer) => reviewer.billing?.length === reviewer.usage?.length) &&
      charges.every(({ totalNanoAiu }) => Number.isFinite(totalNanoAiu) && totalNanoAiu >= 0)
      ? `${charges.reduce((sum, charge) => sum + charge.totalNanoAiu, 0) / 1e9} AI credits (reported nano-AIU / 1e9)`
      : "unavailable: the runtime did not report every request charge"}`);
    assert.equal(report.publication?.attempted ?? false, false, "This runner must not publish");
    console.log(`Outcome: mode=${report.mode} coverage=${report.coverage} ` +
      `findings=${report.validation?.findings.length ?? 0} withheld=${report.validation?.capped?.length ?? 0} ` +
      `rejected=${report.validation?.rejected.length ?? 0} publication=${report.publication?.status}`);
  } finally {
    unsubscribe();
  }
} finally {
  const errors = await client.stop();
  if (errors.length) throw new AggregateError(errors, "Could not stop the review runtime cleanly");
}
