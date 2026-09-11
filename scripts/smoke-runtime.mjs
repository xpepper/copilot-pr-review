import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { exerciseF3, startFixture } from "./runtime-fixture.mjs";
import { prepareLiveTargetSmoke, prepareReadTargetSmoke, prepareRegressionTargetSmoke, prepareTargetSmoke } from "./runtime-target.mjs";
import { exerciseQuick } from "./runtime-quick.mjs";
import { selectionProbe } from "./runtime-selection.mjs";
import { resolveCliPath } from "../extensions/pr-review/cli-runtime.mjs";

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
const targetFlags = ["--targets", "--target-live", "--regression-live", "--read-live"].filter((flag) => process.argv.includes(flag));
if (targetFlags.length > 1) {
  throw new Error("Use --targets, --target-live, --regression-live and --read-live separately.");
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
const startup = process.argv.includes("--startup");
const once = process.argv.includes("--once");
assert(!once || (quickSettings && !process.argv.includes("--selection") && !process.argv.includes("--selection-no-ui") &&
  !process.argv.includes("--fixture") && !process.argv.includes("--f3")), "--once requires only a target --quick probe");
assert(!process.argv.includes("--read-live") || once, "--read-live requires --quick --once");
if (startup) assert(process.argv.includes("--targets") && !quickSettings &&
  !process.argv.includes("--fixture") && !process.argv.includes("--f3"),
"--startup requires --targets without --quick, --fixture or --f3; it spends no inference");
const targetSmoke = process.argv.includes("--targets") ? await prepareTargetSmoke({
  matchingCheckout: Boolean(quickSettings) || process.argv.includes("--matching-checkout"),
})
  : process.argv.includes("--target-live") ? await prepareLiveTargetSmoke()
    : process.argv.includes("--regression-live") ? await prepareRegressionTargetSmoke()
      : process.argv.includes("--read-live") ? await prepareReadTargetSmoke({
        repository: process.env.PR_REVIEW_LIVE_REPOSITORY,
        number: Number(process.env.PR_REVIEW_LIVE_NUMBER),
        head: process.env.PR_REVIEW_LIVE_HEAD,
      }) : undefined;
const selection = process.argv.includes("--selection") ? selectionProbe() : undefined;
const selectionNoUi = process.argv.includes("--selection-no-ui");
const selectionCases = process.argv.find((arg) => arg.startsWith("--selection-cases="))?.split("=")[1].split(",");
if (selection || selectionNoUi) {
  assert(quickSettings && process.argv.includes("--targets"), "Selection probes require --targets --quick");
}
// The launcher needs an explicit path; the installed extension must work without
// inheriting the override that previously masked broken CLI discovery.
const runtimeEnv = { ...process.env };
delete runtimeEnv.COPILOT_CLI_PATH;
const client = new CopilotClient({
  connection: RuntimeConnection.forStdio({ path: resolve(cliPath), env: runtimeEnv }),
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
    // Three false user-facing strings have shipped here, each surviving several
    // increments because nothing dispatches these commands and reads the text.
    // A flag the help does not mention is a flag nobody can find.
    ["help", "--unattended  Declare that this run leaves no question for anybody to answer"],
    ["status", "--unattended declares that a run leaves nothing for a person to answer"],
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

  for (const args of ["123 --unsupported --no-comment", "status extra", "cancel extra", "--comment"]) {
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.match(result.error, /Unsupported arguments\. No review was started\./);
    console.log(`PASS rejected /pr-review ${args}`);
  }
  // --verify is a supported review flag now, but it still starts no capture when
  // it is combined with the capture-only path, which reaches no preflight.
  const combined = await session.rpc.commands.execute({
    commandName: "pr-review", args: "123 --verify --capture-only",
  });
  assert.match(combined.error, /cannot be combined with --verify/);
  console.log("PASS rejected /pr-review 123 --verify --capture-only");

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
    ["123 --quick --major-only --no-comment", /mutually exclusive/],
    ["123 --quick --balanced --no-comment", /mutually exclusive/],
    ["123 --balanced --full --no-comment", /mutually exclusive/],
    ["123 --full --major-only --no-comment", /mutually exclusive/],
    ["123 --balanced --deep --no-comment", /mutually exclusive/],
    ["123 --deep --major-only --no-comment", /mutually exclusive/],
    ["123 --capture-only --balanced", /cannot be combined/],
    ["123 --capture-only --full", /cannot be combined/],
    ["123 --capture-only --deep", /cannot be combined/],
    ["123 --quick --no-comment --comment", /Conflicting posting flags/],
    ["123 --balanced --no-comment --comment", /Conflicting posting flags/],
    ["123 --full --no-comment --comment", /Conflicting posting flags/],
    ["123 --deep --no-comment --comment", /Conflicting posting flags/],
    ["123 --full --no-comment mediumModel=missing-m1-model", /Invalid or duplicate review setting/],
    ["123 --quick --no-comment heavyModel=missing-q3-model", /Unavailable/],
    ["123 --balanced --no-comment heavyModel=missing-m1-model", /Unavailable/],
    ["123 --full --no-comment heavyModel=missing-m1-model", /Unavailable/],
    ["123 --deep --no-comment mediumModel=missing-m2-model", /Invalid or duplicate review setting/],
    ["123 --deep --no-comment heavyModel=missing-m2-model", /Unavailable/],
    [`123 --quick --no-comment heavyModel=${available.id} heavyEffort=invalid-effort`, /Unsupported reasoning/],
    [`123 --balanced --no-comment heavyModel=${available.id} heavyEffort=invalid-effort`, /Unsupported reasoning/],
    [`123 --full --no-comment heavyModel=${available.id} heavyEffort=invalid-effort`, /Unsupported reasoning/],
    [`123 --deep --no-comment heavyModel=${available.id} heavyEffort=invalid-effort`, /Unsupported reasoning/],
    // U1: an unattended run is refused through the real dispatch path too, and
    // each refusal names the one flag that is missing. None of these reaches a
    // capture, let alone a reviewer, so the whole set costs nothing.
    ["123 --unattended", /--unattended needs --all/],
    ["123 --deep --no-comment --unattended", /--unattended needs --all/],
    ["123 --all --unattended", /--unattended needs --comment or --no-comment/],
    ["123 --deep --all --unattended", /--unattended needs --comment or --no-comment/],
    ["123 --quick --all --no-comment --verify --unattended", /--unattended cannot be combined with --verify/],
    ["123 --capture-only --unattended", /cannot be combined/],
    ["123 --deep --all --no-comment --unattended --unattended", /Duplicate review argument/],
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

  if (startup) {
    const original = (await session.rpc.metadata.snapshot()).workingDirectory;
    let settled = Promise.withResolvers();
    const unsubscribe = session.on((event) => {
      if (!["session.info", "session.error"].includes(event.type)) return;
      if (event.data.message.startsWith("P2 evidence: ")) settled.resolve();
      if (event.data.message.startsWith("Review/publication failed:")) {
        settled.reject(new Error(event.data.message));
      }
    });
    try {
      await session.rpc.metadata.setWorkingDirectory({ workingDirectory: targetSmoke.quickTarget.workingDirectory });
      // A draft target settles every mode before any reviewer starts, so this
      // exercises installed dispatch, tier resolution and settlement without
      // spending inference.
      for (const [mode, prefix, reviewers] of [
        ["--quick", "Q3", 3], ["--balanced", "M1", 5], ["--full", "M1", 6], ["--deep", "M2", 1],
      ]) {
        const before = (await session.getEvents()).length;
        settled = Promise.withResolvers();
        const result = await session.rpc.commands.execute({
          commandName: "pr-review",
          args: `2 ${mode} --no-comment --all heavyModel=${available.id} ` +
            `heavyEffort=${available.capabilities.supports.reasoning_effort[0]}`,
        });
        assert.equal(result.error, undefined, `CLI discovery without COPILOT_CLI_PATH: ${result.error}`);
        await settled.promise;
        const messages = (await session.getEvents()).slice(before)
          .filter((event) => event.type === "session.info").map((event) => event.data.message);
        assert(messages.some((message) => message.startsWith(`${prefix} evidence: `) &&
          JSON.parse(message.slice(`${prefix} evidence: `.length)).coverage === "not-started"),
        `Draft skip must settle ${mode} without inference`);
        const assignments = messages.find((message) => message.startsWith("Effective reviewer assignments:"));
        assert(assignments, `${mode} must display its effective reviewer assignments before execution`);
        assert.equal(assignments.split("\n").filter((line) => line.startsWith("  ")).length, reviewers,
          `${mode} must show one assignment line per reviewer`);
        assert(assignments.includes("[flag]"), "An invocation flag is reported as the origin it is");
        if (!["--quick", "--deep"].includes(mode)) {
          assert.match(assignments, /overview \[light\]: model=\S+ \[[^\]]+\]/,
            "The light overview reviewer resolves and reports its own tier");
        }
        if (mode === "--balanced") {
          assert.match(assignments, /findings policy: P0-P2 findings, plus at most 3 P3\/nit finding\(s\)/);
        }
        if (mode === "--full") {
          assert.match(assignments, /conventions-maintainability \[medium\]: model=\S+ \[[^\]]+\] reasoning=\S+ \[[^\]]+\]/,
            "The medium conventions reviewer resolves and reports its own tier");
          assert.match(assignments,
            /findings policy: P0-P2 findings, plus every substantiated P3\/nit finding/);
        }
        if (mode === "--deep") {
          assert.match(assignments, /integrated \[heavy\]: model=\S+ \[flag\] reasoning=\S+ \[flag\]/,
            "The single integrated reviewer resolves and reports the heavy tier");
          assert.match(assignments,
            /findings policy: P0-P2 findings, plus every substantiated P3\/nit finding/);
          assert(!/\[light\]|\[medium\]/.test(assignments), "Deep resolves no light or medium tier");
        }
        assert(!messages.some((message) => /^Reviewer /.test(message)), "A skipped draft starts no reviewer");
        console.log(`PASS installed ${mode} dispatch settled a skipped draft without inference`);
      }
    } finally {
      unsubscribe();
      await session.rpc.metadata.setWorkingDirectory({ workingDirectory: original });
    }
    // Exercise the exact resolver/transport used by startRun through a real
    // runtime handshake, without creating a reviewer or sending a prompt.
    const owned = new CopilotClient({
      connection: RuntimeConnection.forStdio({ path: resolveCliPath(runtimeEnv), env: runtimeEnv }),
    });
    try {
      await owned.start();
      await owned.ping("pr-review startup regression");
    } finally {
      assert.deepEqual(await owned.stop(), []);
    }
    console.log("PASS installed mode dispatch and owned-runtime start/ping/stop without COPILOT_CLI_PATH or inference");
  }

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
  } else if (quickSettings) await exerciseQuick(session, targetSmoke.quickTarget, quickSettings, { once });

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
