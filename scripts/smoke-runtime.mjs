import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
const client = new CopilotClient({
  connection: RuntimeConnection.forStdio({ path: resolve(cliPath) }),
});

try {
  const session = await client.createSession({
    enableExperimentalMode: true,
    enableConfigDiscovery: true,
    requestExtensions: true,
    availableTools: [],
    onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
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

  for (const [args, expected] of [
    ["", "Copilot PR Review: entry point ready."],
    ["status", "Copilot PR Review: entry point ready."],
    ["  status  ", "Copilot PR Review: entry point ready."],
    ["help", "Usage: /pr-review [status|help]"],
    ["--help", "Usage: /pr-review [status|help]"],
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

  for (const args of ["123 --quick --no-comment", "status extra", "--comment"]) {
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    assert.match(result.error, /Unsupported arguments\. No review was started\./);
    console.log(`PASS rejected /pr-review ${args}`);
  }

  const events = await session.getEvents();
  assert(!events.some((event) =>
    event.type === "user.message" ||
    event.type.startsWith("assistant.") ||
    event.type.startsWith("subagent.") ||
    event.type === "tool.execution_start",
  ), "The entry point must not start model turns, agents, or tools");
  console.log("PASS no model turns, subagents, or tool executions");
} finally {
  const errors = await client.stop();
  if (errors.length) {
    throw new AggregateError(errors, "Could not stop smoke runtime cleanly");
  }
}
