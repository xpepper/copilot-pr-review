import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { exerciseF3, startFixture } from "./runtime-fixture.mjs";
import { prepareLiveTargetSmoke, prepareRegressionTargetSmoke, prepareTargetSmoke } from "./runtime-target.mjs";
import { exerciseQuick } from "./runtime-quick.mjs";
import { selectionProbe } from "./runtime-selection.mjs";

function fixtureSettings() {
  const settings = {
    model1: process.env.PR_REVIEW_MODEL_1,
    effort1: process.env.PR_REVIEW_EFFORT_1,
    model2: process.env.PR_REVIEW_MODEL_2,
    effort2: process.env.PR_REVIEW_EFFORT_2,
  };
  assert(Object.values(settings).every((value) => value && !/\s/.test(value)),
    "Set PR_REVIEW_MODEL_1, PR_REVIEW_EFFORT_1, PR_REVIEW_MODEL_2, PR_REVIEW_EFFORT_2 explicitly");
  return settings;
}
const settingsArgs = (settings) =>
  Object.entries(settings).map(([key, value]) => `${key}=${value}`).join(" ");

const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
if (!sdkPath || !cliPath) {
  throw new Error(
    "Set COPILOT_SDK_PATH to the bundled SDK directory and COPILOT_CLI_PATH to the CLI executable.",
  );
}

const { CopilotClient, RuntimeConnection } = await import(
  pathToFileURL(resolve(sdkPath, "index.js")).href
);
const targetFlags = ["--targets", "--target-live", "--regression-live"].filter((flag) => process.argv.includes(flag));
if (targetFlags.length > 1) {
  throw new Error("Use --targets, --target-live and --regression-live separately.");
}
const quickSettings = process.argv.includes("--quick") ? {
  model: process.env.PR_REVIEW_HEAVY_MODEL,
  reasoningEffort: process.env.PR_REVIEW_HEAVY_EFFORT,
} : undefined;
if (quickSettings) {
  assert(Object.values(quickSettings).every((value) => value && !/\s/.test(value)),
    "Set PR_REVIEW_HEAVY_MODEL and PR_REVIEW_HEAVY_EFFORT explicitly for inference-spending Q3 probes");
  assert(targetFlags.length === 1, "Quick runtime probe requires a controlled or live target");
}
const targetSmoke = process.argv.includes("--targets") ? await prepareTargetSmoke()
  : process.argv.includes("--target-live") ? await prepareLiveTargetSmoke()
    : process.argv.includes("--regression-live") ? await prepareRegressionTargetSmoke() : undefined;
const selection = process.argv.includes("--selection") ? selectionProbe() : undefined;
const selectionNoUi = process.argv.includes("--selection-no-ui");
const selectionCases = process.argv.find((arg) => arg.startsWith("--selection-cases="))?.split("=")[1].split(",");
if (selection || selectionNoUi) {
  assert(quickSettings && process.argv.includes("--targets"), "Selection probes require --targets --quick");
}
const client = new CopilotClient({
  connection: RuntimeConnection.forStdio({ path: resolve(cliPath) }),
});
let parentKilled = false;

try {
  const session = await client.createSession({
    enableExperimentalMode: true,
    enableConfigDiscovery: true,
    requestExtensions: true,
    availableTools: [],
    onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
    ...targetSmoke?.sessionOptions,
    ...(selection ? { onElicitationRequest: (request) => request.requestedSchema?.properties.findingIds
      ? selection.answer(request) : targetSmoke.sessionOptions.onElicitationRequest(request) } : {}),
    ...(selectionNoUi ? { onElicitationRequest: undefined } : {}),
    ...quickSettings,
  });

  await session.rpc.extensions.reload();
  const { extensions } = await session.rpc.extensions.list();
  const extension = extensions.find((entry) =>
    entry.id.startsWith("plugin:copilot-pr-review:"),
  );
  assert.equal(extension?.status, "running", "Installed plugin extension must be running");
  console.log(`Running: ${extension.id}`);

  const { commands } = await session.rpc.commands.list();
  assert(commands.some((command) => command.name === "pr-review"));
  const parentModel = await session.rpc.model.getCurrent();

  for (const [args, expected] of [
    ["", "Copilot PR Review: entry point ready."],
    ["status", "Copilot PR Review: entry point ready."],
    ["  status  ", "Copilot PR Review: entry point ready."],
    ["help", "Usage: /pr-review [status|help|models|fixture"],
    ["--help", "Usage: /pr-review [status|help|models|fixture"],
    ["cancel", "No review is running."],
  ]) {
    const before = (await session.getEvents()).length;
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.equal(result.error, undefined);
    const output = (await session.getEvents()).slice(before);
    assert(output.some((event) =>
      event.type === "session.info" && event.data.message.includes(expected),
    ), `Missing timeline output for /pr-review ${args}`);
    console.log(`PASS /pr-review ${args}`);
  }

  for (const args of ["123 --balanced --no-comment", "status extra", "cancel extra", "--comment"]) {
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.match(result.error, /Unsupported arguments\. No review was started\./);
    console.log(`PASS rejected /pr-review ${args}`);
  }

  const listing = await session.rpc.model.list();
  const modelsResult = await session.rpc.commands.execute({ commandName: "pr-review", args: "models" });
  assert.equal(modelsResult.error, undefined);
  const available = listing.list.find((model) =>
    typeof model.id === "string" && !model.id.includes("/") &&
    (!model.policy || model.policy.state === "enabled") &&
    model.capabilities?.supports?.reasoning_effort?.length > 0,
  );
  assert(available, "Need an available reasoning-capable subscription model for rejection probes");
  for (const [args, error] of [
    ["fixture", /requires explicit/],
    ["fixture model1=a effort1=low model2=a effort2=high", /distinct models/],
    ["fixture model1=a effort1=low model2=b effort2=low", /distinct reasoning/],
    ["fixture model1=a effort1=low model2=b effort2=high extra=x", /Invalid/],
    ["fixture model1=missing-f2-model effort1=low model2=b effort2=high", /Unavailable/],
    [`fixture model1=${available.id} effort1=invalid-effort model2=b effort2=high`, /Unsupported reasoning/],
    ["123 --quick", /requires/],
    ["123 --quick --major-only --no-comment", /requires/],
    ["123 --quick --no-comment --comment", /Unsupported arguments/],
    ["123 --quick --no-comment heavyModel=missing-q3-model", /Unavailable/],
    [`123 --quick --no-comment heavyModel=${available.id} heavyEffort=invalid-effort`, /Unsupported reasoning/],
  ]) {
    const before = (await session.getEvents()).length;
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.match(result.error, error);
    assert(!(await session.getEvents()).slice(before).some((event) =>
      event.type === "session.info" && event.data.message.startsWith("Reviewer "),
    ), "Rejected settings must not start reviewers");
    console.log(`PASS rejected /pr-review ${args}`);
  }

  if (targetSmoke && !selectionNoUi) await targetSmoke.exercise(session);

  const events = await session.getEvents();
  assert(!events.some((event) =>
    event.type === "user.message" ||
    event.type.startsWith("assistant.") ||
    event.type.startsWith("subagent.") ||
    event.type === "tool.execution_start",
  ), "The entry point must not start model turns, agents, or tools");
  console.log("PASS no model turns, subagents, or tool executions");

  if (selection || selectionNoUi) {
    await (selection ?? selectionProbe()).exercise(session, { ...targetSmoke.quickTarget, args: "13" },
      quickSettings, { noUi: selectionNoUi, cases: selectionCases });
  } else if (quickSettings) await exerciseQuick(session, targetSmoke.quickTarget, quickSettings);

  if (process.argv.includes("--fixture") || process.argv.includes("--f3")) {
    const settings = fixtureSettings();
    const observed = [];
    const unsubscribe = session.on((event) => {
      observed.push(event);
      if (event.type === "session.info") console.log(event.data.message);
    });
    try {
      const run = await startFixture(session, `fixture ${settingsArgs(settings)}`);
      try { await run.done; } finally { run.unsubscribe(); }
      const reportEvent = observed.find((event) =>
        event.type === "session.info" && event.data.message.startsWith("F2 evidence: "),
      );
      assert(reportEvent, "Fixture evidence must be observable");
      const report = JSON.parse(reportEvent.data.message.slice("F2 evidence: ".length));
      assert.equal(report.complete, true);
      assert.equal(report.reviewers.length, 2, "Exactly two independent reviewers");
      assert.equal(new Set(report.reviewers.map((reviewer) => reviewer.sessionId)).size, 2);
      const messages = observed.filter((event) => event.type === "session.info")
        .map((event) => event.data.message);
      const firstStart = messages.findIndex((message) => /^Reviewer \w+: starting$/.test(message));
      assert(firstStart >= 0);
      for (const label of ["rounding", "shipping"]) {
        const assignmentIndex = messages.findIndex((message) => message.startsWith(`Assignment ${label}:`));
        assert(assignmentIndex >= 0 && assignmentIndex < firstStart,
          "Effective assignments must be displayed before either reviewer starts");
        assert(messages.includes(`Reviewer ${label}: starting`));
        assert(messages.some((message) => message.startsWith(`Reviewer ${label}: completed\n`)));
      }
      for (const [index, label] of ["rounding", "shipping"].entries()) {
        const reviewer = report.reviewers.find((entry) => entry.label === label);
        assert.equal(reviewer?.status, "completed");
        assert(reviewer.result.trim(), `Missing output for ${label}`);
        assert(reviewer.usage.length > 0, `Missing actual usage evidence for ${label}`);
        for (const usage of reviewer.usage) {
          assert.equal(usage.model, settings[`model${index + 1}`]);
          assert.equal(usage.reasoningEffort, settings[`effort${index + 1}`]);
          assert.equal(usage.isByok, false, "Must use Copilot, not BYOK");
        }
        assert(Number.isFinite(reviewer.startedAt));
        assert(Number.isFinite(reviewer.completedAt));
      }
      const overlap = Math.min(...report.reviewers.map((reviewer) => reviewer.completedAt)) -
        Math.max(...report.reviewers.map((reviewer) => reviewer.startedAt));
      assert(overlap > 0, "Reviewer execution intervals must overlap");
      assert(!observed.some((event) => event.type === "tool.execution_start"),
        "The fixture must not execute tools");
      console.log(`PASS two subscription models, explicit reasoning, and ${overlap}ms overlap`);
    } finally {
      unsubscribe();
    }
  }
  assert.deepEqual(await session.rpc.model.getCurrent(), parentModel,
    "Prototype must not alter the parent session's model or reasoning");
  if (process.argv.includes("--f3")) {
    await exerciseF3(session, settingsArgs(fixtureSettings()), parentModel, () => { parentKilled = true; });
  }
} finally {
  let errors;
  try { errors = await client.stop(); }
  finally { await targetSmoke?.cleanup(); }
  if (errors.length) {
    if (!parentKilled || errors.some((error) => !String(error).includes("Connection is closed."))) {
      throw new AggregateError(errors, "Could not stop smoke runtime cleanly");
    }
    console.log(`Expected smoke cleanup errors after injected parent loss: ${errors.map(String).join("; ")}`);
  }
}
