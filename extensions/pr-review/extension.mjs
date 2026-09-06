import { joinSession } from "@github/copilot-sdk/extension";

const help = [
  "Copilot PR Review - runtime feasibility prototype",
  "",
  "Usage: /pr-review [status|help]",
  "",
  "status  Show the implemented capability boundary (default).",
  "help    Show this usage information.",
  "",
  "PR numbers and review flags are not supported yet.",
].join("\n");

const status = [
  "Copilot PR Review: entry point ready.",
  "The plugin extension joined this Copilot CLI session and handled /pr-review.",
  "",
  "Implemented: local plugin entry point, status, and help.",
  "Not implemented: reviewers, model/reasoning validation, reviewer read-only",
  "restrictions, progress, failure supervision, or cancellation.",
  "",
  "This command starts no models or background work, reads no review target,",
  "fetches no PRs, publishes nothing, and runs no project safeguards.",
  "No review has been performed; this is not a clean-review result.",
].join("\n");

const session = await joinSession({
  commands: [
    {
      name: "pr-review",
      description: "Show PR review prototype status or help (no reviews yet)",
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
          default: {
            const message = `Unsupported arguments. No review was started.\n\n${help}`;
            await session.log(message, { level: "error" });
            throw new Error(message);
          }
        }
      },
    },
  ],
});
