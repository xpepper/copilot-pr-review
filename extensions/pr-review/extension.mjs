import { CopilotClient } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import {
  parseFixtureArgs, reasoningEfforts, reviewFixture, subscriptionModels,
} from "./fixture.mjs";

const help = [
  "Copilot PR Review - runtime feasibility prototype",
  "",
  "Usage: /pr-review [status|help|models|fixture model1=ID effort1=LEVEL model2=ID effort2=LEVEL]",
  "",
  "status  Show the implemented capability boundary (default).",
  "help    Show this usage information.",
  "models  List available subscription models and supported reasoning efforts.",
  "fixture Run two reviewers of the bundled original fixture (uses Copilot credits).",
  "",
  "PR numbers and review flags are not supported yet.",
].join("\n");

const status = [
  "Copilot PR Review: entry point ready.",
  "The plugin extension joined this Copilot CLI session and handled /pr-review.",
  "",
  "Implemented: entry point, model capability listing, and a two-reviewer fixture prototype.",
  "The fixture requires explicit distinct models and reasoning efforts.",
  "Not demonstrated: adversarial read-only enforcement, failure supervision, or cancellation.",
  "",
  "Status/help start no models or background work. The prototype",
  "fetches no PRs, publishes nothing, and runs no project safeguards.",
  "No PR review has been performed; this is not a clean-review result.",
].join("\n");

let fixtureRunning = false;
const session = await joinSession({
  commands: [
    {
      name: "pr-review",
      description: "PR review prototype status, model listing, or fixture experiment",
      handler: async ({ args }) => {
        switch (args.trim()) {
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
            if (args.trim().split(/\s+/)[0] === "fixture") {
              const settings = parseFixtureArgs(args);
              if (fixtureRunning) throw new Error("A fixture review is already running in this session.");
              const client = new CopilotClient();
              fixtureRunning = true;
              try {
                const report = await reviewFixture(session, client, settings);
                await session.log(`F2 evidence: ${JSON.stringify(report)}`);
                if (!report.complete) throw new Error("Fixture review has incomplete coverage.");
              } finally {
                try {
                  const errors = await client.stop();
                  if (errors.length) throw new AggregateError(errors, "Could not stop fixture runtime cleanly");
                } finally {
                  fixtureRunning = false;
                }
              }
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
