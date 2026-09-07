import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { describeConfiguration, executeConfiguration, loadConfiguration } from "./config.mjs";
import {
  parseFixtureArgs, reasoningEfforts, subscriptionModels, validateAssignments,
} from "./fixture.mjs";
import { executeFixtureRun } from "./fixture-run.mjs";
import { executeTargetCapture } from "./target.mjs";
import { parseQuickArgs, quickAssignments } from "./quick.mjs";
import { executeRetainedQuick } from "./retained-run.mjs";
import { inspectRetained } from "./retention.mjs";
import { executePublishLater } from "./publish-later.mjs";
import { publicationSummary } from "./publication.mjs";
import { resolveCliPath } from "./cli-runtime.mjs";

const help = [
  "Copilot PR Review - runtime feasibility prototype",
  "",
  "Usage: /pr-review [status|help|models|fixture model1=ID effort1=LEVEL model2=ID effort2=LEVEL]",
  "       /pr-review NUMBER [--include-drafts] [--include-closed|--review-closed]",
  "       /pr-review NUMBER --quick|--major-only [--comment|--no-comment] [--all] [heavyModel=ID] [heavyEffort=LEVEL]",
  "",
  "status  Show the implemented capability boundary (default).",
  "help    Show this usage information.",
  "models  List available subscription models and supported reasoning efforts.",
  "fixture Run two reviewers of the bundled original fixture (uses Copilot credits).",
  "adversarial  Same settings; exercise forbidden tools and untrusted fixture text.",
  "failure      Same settings; inject a failure in the first active reviewer.",
  "cancel       Cancel active review work and stop its owned runtime.",
  "inspect      Show this session's latest retained result without inference or GitHub requests.",
  "publish      Explicitly publish this session's retained selected findings without rerunning reviewers.",
  "",
  "Configuration: /pr-review-config [show] | key=value ... | unset key ... | trust | untrust [PATH] | help.",
  "Saved tiers supply unset assignments; a trusted project's file overrides them; invocation flags win.",
  "An untrusted repository's .copilot/pr-review/config.json is ignored; a repository cannot trust itself.",
  "",
  "NUMBER  Capture PR metadata and diff, then bind source context to the captured",
  "        head/base revisions. No reviewers, no publication, no local source.",
  "Drafts and obvious bots are skipped, as are provably empty changes.",
  "Closed/merged PRs require confirmation or an explicit closed-PR override.",
  "--quick / --major-only  Run three heavy specialists on captured PR content.",
  "Unset heavy settings inherit the nearest configured tier, then the ambient model/effort.",
  "Strict evidence checks and an isolated adjudication pass validate/deduplicate candidates.",
  "Select validated findings in the host UI, or use --all. Selection never authorizes posting.",
  "--comment authorizes the proposal; --no-comment suppresses posting. The flags conflict.",
  "Without either flag, the effective saved autoPostReviews applies; it defaults to false and then requires final confirmation.",
  "Authorized selections submit a code-built COMMENT review after fresh head/lifecycle/anchor checks.",
  "Draft/closed/merged PRs cannot receive the current inline payload. Uncertain writes are never retried.",
  "Results are retained only in the originating local session; a new quick run replaces the previous result.",
  "publish is a new explicit authorization; retained flags, configuration and confirmations authorize nothing.",
  "It refetches the reviewed evidence and reruns every gate, and refuses repeats of published or unresolved writes.",
  "No safeguards yet. Validation also uses Copilot credits; publish uses none.",
  "Other review flags are not supported yet.",
].join("\n");

const status = [
  "Copilot PR Review: entry point ready.",
  "The plugin extension joined this Copilot CLI session and handled /pr-review.",
  "",
  "Implemented: PR target capture with revision-bound source context, model capability",
  "listing, three quick PR specialists, and a two-reviewer fixture prototype.",
  "The fixture requires explicit distinct models and reasoning efforts.",
  "F3 experiments: adversarial read-only probes, failure injection, and manual cancellation.",
  "Quick execution is available with --quick, grounded validation and deduplication.",
  "Validated findings can be selected via the host UI or --all, then retained in this local session.",
  "Use /pr-review inspect after extension reload or a CLI-supported same-session resume.",
  "Current-run COMMENT publication is implemented with fresh gates and a durable write-ahead journal.",
  "Use /pr-review publish to publish the retained selection later, under a new explicit authorization.",
  "Personal light/medium/heavy tier configuration and autoPostReviews are inspected and updated by",
  "/pr-review-config, which also grants and revokes explicit per-directory project trust.",
  "Only an explicitly trusted directory's .copilot/pr-review/config.json overrides personal settings.",
  "",
  "Status/help start no models or background work. PR capture and source context use",
  "read-only gh requests against the captured revisions, never the local checkout.",
  "Only authorized selected findings can publish; no project safeguards are run.",
  "Status is not a review result or a clean-review claim.",
].join("\n");

let activeRun;
let shuttingDown = false;
const session = await joinSession({
  commands: [
    {
      name: "pr-review",
      description: "Read-only quick PR specialists, target capture, status, or fixture experiment",
      handler: async ({ args }) => {
        if (shuttingDown) throw new Error("Extension is shutting down.");
        switch (args.trim()) {
          case "cancel": {
            const run = activeRun;
            if (!run) {
              await session.log("No review is running.");
              return;
            }
            run.controller.abort(new DOMException("Manually cancelled; incomplete coverage.", "AbortError"));
            // Cancellation must work even when the runtime cannot acknowledge an abort RPC.
            if (!run.runtimeStopped) await run.client.forceStop();
            const outcome = await run.done;
            if (outcome.cleanupErrors.length) {
              throw new Error(`Cancellation cleanup was not clean: ${outcome.cleanupErrors.join("; ")}`);
            }
            await session.log(`${run.ownsRuntime ? "Review cancellation finished; owned runtime stopped."
              : "Publication cancellation finished; no reviewers were running."} ${publicationSummary(outcome.publication)}`);
            return;
          }
          case "":
          case "status":
            await session.log(status);
            return;
          case "help":
          case "--help":
            await session.log(help);
            return;
          case "models": {
            const { list } = await session.rpc.model.list();
            const models = subscriptionModels(list);
            if (!models.length) throw new Error("No Copilot-subscription models are available.");
            await session.log(models.map((model) =>
              `${model.id}: reasoning=${reasoningEfforts(model).join(",") || "(not configurable)"}`,
            ).join("\n"));
            return;
          }
          case "inspect":
            assertIdle();
            await inspectRetained(session);
            return;
          case "publish":
            // No target, session or authority argument: this session's retained
            // selection is the only publishable result.
            startRun((client, lifecycle) => executePublishLater(session, lifecycle), { ownsRuntime: false });
            return;
          default: {
            if (/^\d/.test(args.trim())) {
              if (args.trim().split(/\s+/).some((token) => ["--quick", "--major-only"].includes(token))) {
                const options = parseQuickArgs(args);
                assertIdle();
                // Saved and trusted-project settings are displayed before any reviewer
                // starts, and before the assignment is resolved, so a refusal explains
                // itself. An unusable effective assignment refuses the review instead
                // of substituting.
                const configuration = await loadConfiguration(session);
                await session.log(describeConfiguration(configuration, {
                  flags: options.settings, heading: "Effective PR review configuration for this invocation.",
                }));
                const assignments = await quickAssignments(session, options.settings, configuration);
                startRun((client, lifecycle) => executeRetainedQuick(session, client, options, assignments, lifecycle,
                  { autoPostReviews: configuration.autoPostReviews }));
                return;
              }
              await executeTargetCapture(session, args);
              return;
            }
            const experiment = args.trim().split(/\s+/)[0];
            if (["fixture", "adversarial", "failure"].includes(experiment)) {
              const settings = parseFixtureArgs(args);
              assertIdle();
              validateAssignments(settings, (await session.rpc.model.list()).list);
              startRun((client, lifecycle) =>
                executeFixtureRun(session, client, settings, { ...lifecycle, experiment }));
              return;
            }
            const message = `Unsupported arguments. No review was started.\n\n${help}`;
            await session.log(message, { level: "error" });
            throw new Error(message);
          }
        }
      },
    },
    {
      name: "pr-review-config",
      description: "Inspect or update personal PR review settings, or trust a project's overrides",
      handler: async ({ args }) => {
        if (shuttingDown) throw new Error("Extension is shutting down.");
        // Configuration is refused while review or publication work holds the run
        // slot, and it starts no inference, GitHub request or review work itself.
        assertIdle();
        await executeConfiguration(session, args);
      },
    },
  ],
});

function assertIdle() {
  if (activeRun) throw new Error("A review is already running in this session.");
  if (shuttingDown) throw new Error("Extension is shutting down.");
}

function startRun(execute, { ownsRuntime = true } = {}) {
  assertIdle();
  // Publication owns no inference runtime; it must still hold the active-run
  // slot so a concurrent review cannot race it, and stay cancellable.
  const client = ownsRuntime ? new CopilotClient({
    connection: RuntimeConnection.forStdio({ path: resolveCliPath() }),
  }) : undefined;
  const controller = new AbortController();
  const run = { client, controller, ownsRuntime, runtimeStopped: !ownsRuntime };
  activeRun = run;
  const clearRun = () => {
    if (activeRun === run) activeRun = undefined;
  };
  run.done = execute(client, {
    controller, onStopped: (outcome) => { run.runtimeStopped = outcome.cleanupErrors.length === 0; },
  }).finally(clearRun);
  // Return dispatch so cancel remains available. Parent transport loss can prevent timeline delivery.
  void run.done.then(async (outcome) => {
    if (outcome.retention) await session.log(`P2 evidence: ${JSON.stringify(outcome.retention)}`);
    if (outcome.publishLater) await session.log(`P5 evidence: ${JSON.stringify(outcome.publishLater)}`);
  }).catch(async (error) => {
    console.error(`Review run failed: ${String(error)}`);
    try {
      await session.log(`Review/publication failed: ${String(error)}. No settled result is guaranteed; ` +
        "use /pr-review inspect to examine the retained state. Publication may be uncertain; do not retry blindly.", { level: "error" });
    } catch (logError) { console.error(`Could not report review/retention failure: ${String(logError)}`); }
  });
}

async function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (activeRun) {
      activeRun.controller.abort(new Error(`Extension shutdown: ${reason}; incomplete coverage.`));
      // The host allows only 5s before SIGKILL. Do not wait on reviewer or parent RPCs here.
      if (!activeRun.runtimeStopped) await activeRun.client.forceStop();
    }
    process.exitCode = 0;
  } catch (error) {
    console.error(`PR review shutdown failed: ${String(error)}`);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

process.once("SIGTERM", () => { void shutdown("SIGTERM"); });
process.once("SIGINT", () => { void shutdown("SIGINT"); });
process.stdin.once("end", () => { void shutdown("parent transport ended"); });
process.stdin.once("error", (error) => { void shutdown(`parent transport error: ${String(error)}`); });
