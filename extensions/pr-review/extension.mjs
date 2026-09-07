import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import {
  parseFixtureArgs, reasoningEfforts, subscriptionModels, validateAssignments,
} from "./fixture.mjs";
import { executeFixtureRun } from "./fixture-run.mjs";
import { executeTargetCapture } from "./target.mjs";
import { executeQuickRun, parseQuickArgs, quickAssignments } from "./quick.mjs";

const help = [
  "Copilot PR Review - runtime feasibility prototype",
  "",
  "Usage: /pr-review [status|help|models|fixture model1=ID effort1=LEVEL model2=ID effort2=LEVEL]",
  "       /pr-review NUMBER [--include-drafts] [--include-closed|--review-closed]",
  "       /pr-review NUMBER --quick|--major-only --no-comment [heavyModel=ID] [heavyEffort=LEVEL]",
  "",
  "status  Show the implemented capability boundary (default).",
  "help    Show this usage information.",
  "models  List available subscription models and supported reasoning efforts.",
  "fixture Run two reviewers of the bundled original fixture (uses Copilot credits).",
  "adversarial  Same settings; exercise forbidden tools and untrusted fixture text.",
  "failure      Same settings; inject a failure in the first active reviewer.",
  "cancel       Cancel active review work and stop its owned runtime.",
  "",
  "NUMBER  Capture PR metadata and diff, then bind source context to the captured",
  "        head/base revisions. No reviewers, no publication, no local source.",
  "Drafts and obvious bots are skipped, as are provably empty changes.",
  "Closed/merged PRs require confirmation or an explicit closed-PR override.",
  "--quick / --major-only  Run three heavy specialists on captured PR content.",
  "Requires --no-comment. Unset heavy settings inherit the ambient model/effort.",
  "Strict evidence checks and an isolated adjudication pass validate/deduplicate candidates.",
  "No selection, publication, caching, or safeguards. Validation also uses Copilot credits.",
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
  "Quick execution is available with --quick --no-comment, grounded validation and deduplication.",
  "",
  "Status/help start no models or background work. PR capture and source context use",
  "read-only gh requests against the captured revisions, never the local checkout.",
  "The prototype publishes nothing and runs no project safeguards.",
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
            await run.client.forceStop();
            const outcome = await run.done;
            if (outcome.cleanupErrors.length) {
              throw new Error(`Cancellation cleanup was not clean: ${outcome.cleanupErrors.join("; ")}`);
            }
            await session.log("Review cancellation finished; owned runtime stopped. No publication is possible.");
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
          default: {
            if (/^\d/.test(args.trim())) {
              if (args.trim().split(/\s+/).some((token) => ["--quick", "--major-only"].includes(token))) {
                const options = parseQuickArgs(args);
                assertIdle();
                const assignments = await quickAssignments(session, options.settings);
                startRun((client, lifecycle) => executeQuickRun(session, client, options, assignments, lifecycle));
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
  ],
});

function assertIdle() {
  if (activeRun) throw new Error("A review is already running in this session.");
  if (shuttingDown) throw new Error("Extension is shutting down.");
}

function startRun(execute) {
  assertIdle();
  const client = new CopilotClient({ connection: RuntimeConnection.forStdio() });
  const controller = new AbortController();
  const run = { client, controller };
  activeRun = run;
  const clearRun = () => {
    if (activeRun === run) activeRun = undefined;
  };
  run.done = execute(client, { controller, onStopped: clearRun }).finally(clearRun);
  // Return dispatch so cancel remains available. Parent transport loss can prevent timeline delivery.
  void run.done.catch((error) => console.error(`Review run failed: ${String(error)}`));
}

async function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (activeRun) {
      activeRun.controller.abort(new Error(`Extension shutdown: ${reason}; incomplete coverage.`));
      // The host allows only 5s before SIGKILL. Do not wait on reviewer or parent RPCs here.
      await activeRun.client.forceStop();
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
