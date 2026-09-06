import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import {
  parseFixtureArgs, reasoningEfforts, subscriptionModels, validateAssignments,
} from "./fixture.mjs";
import { executeFixtureRun } from "./fixture-run.mjs";

const help = [
  "Copilot PR Review - runtime feasibility prototype",
  "",
  "Usage: /pr-review [status|help|models|fixture model1=ID effort1=LEVEL model2=ID effort2=LEVEL]",
  "",
  "status  Show the implemented capability boundary (default).",
  "help    Show this usage information.",
  "models  List available subscription models and supported reasoning efforts.",
  "fixture Run two reviewers of the bundled original fixture (uses Copilot credits).",
  "adversarial  Same settings; exercise forbidden tools and untrusted fixture text.",
  "failure      Same settings; inject a failure in the first active reviewer.",
  "cancel       Cancel active fixture reviewers and stop their owned runtime.",
  "",
  "PR numbers and review flags are not supported yet.",
].join("\n");

const status = [
  "Copilot PR Review: entry point ready.",
  "The plugin extension joined this Copilot CLI session and handled /pr-review.",
  "",
  "Implemented: entry point, model capability listing, and a two-reviewer fixture prototype.",
  "The fixture requires explicit distinct models and reasoning efforts.",
  "F3 experiments: adversarial read-only probes, failure injection, and manual cancellation.",
  "This is a runtime feasibility prototype, not a real PR review.",
  "",
  "Status/help start no models or background work. The prototype",
  "fetches no PRs, publishes nothing, and runs no project safeguards.",
  "No PR review has been performed; this is not a clean-review result.",
].join("\n");

let activeRun;
let shuttingDown = false;
const session = await joinSession({
  commands: [
    {
      name: "pr-review",
      description: "PR review prototype status, model listing, or fixture experiment",
      handler: async ({ args }) => {
        if (shuttingDown) throw new Error("Extension is shutting down.");
        switch (args.trim()) {
          case "cancel": {
            const run = activeRun;
            if (!run) {
              await session.log("No fixture review is running.");
              return;
            }
            run.controller.abort(new DOMException("Manually cancelled; incomplete coverage.", "AbortError"));
            // Cancellation must work even when the runtime cannot acknowledge an abort RPC.
            await run.client.forceStop();
            const outcome = await run.done;
            if (outcome.cleanupErrors.length) {
              throw new Error(`Cancellation cleanup was not clean: ${outcome.cleanupErrors.join("; ")}`);
            }
            await session.log("Fixture cancellation finished; owned runtime stopped. No publication is possible.");
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
            const experiment = args.trim().split(/\s+/)[0];
            if (["fixture", "adversarial", "failure"].includes(experiment)) {
              const settings = parseFixtureArgs(args);
              if (activeRun) throw new Error("A fixture review is already running in this session.");
              validateAssignments(settings, (await session.rpc.model.list()).list);
              if (activeRun) throw new Error("A fixture review is already running in this session.");
              if (shuttingDown) throw new Error("Extension is shutting down.");
              const client = new CopilotClient({ connection: RuntimeConnection.forStdio() });
              const controller = new AbortController();
              const run = { client, controller };
              activeRun = run;
              const clearRun = () => {
                if (activeRun === run) activeRun = undefined;
              };
              run.done = executeFixtureRun(session, client, settings, {
                controller, experiment, onStopped: clearRun,
              })
                .finally(clearRun);
              // Command dispatch must return so the interactive user can issue cancel.
              // A broken parent transport may prevent timeline delivery; stderr is the extension log.
              void run.done.catch((error) => console.error(`Fixture run failed: ${String(error)}`));
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
