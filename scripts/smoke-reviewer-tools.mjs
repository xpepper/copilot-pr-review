// Capability probe only: can a reviewer child session be granted a read-only
// built-in tool subset, and does the runtime actually enforce that subset?
// It sends no prompt, spends no inference, and changes no review behavior.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { reviewerPolicy } from "../extensions/pr-review/read-only.mjs";

const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
if (!sdkPath || !cliPath) {
  throw new Error("Set COPILOT_SDK_PATH to the bundled SDK directory and COPILOT_CLI_PATH to the CLI executable.");
}
const { CopilotClient, RuntimeConnection, ToolSet } = await import(
  pathToFileURL(resolve(sdkPath, "index.js")).href
);

const writeTools = ["bash", "create", "edit", "task", "sql", "web_fetch", "write_agent"];
const checkout = mkdtempSync(join(tmpdir(), "pr-review-reviewer-tools-"));
const root = realpathSync(checkout);
mkdirSync(join(checkout, "src"));
writeFileSync(join(checkout, "src", "consumer.rs"), "use lapin::Channel;\nfn main() {}\n");
const outsideDirectory = mkdtempSync(join(tmpdir(), "pr-review-outside-"));
const outside = join(outsideDirectory, "secret.txt");
writeFileSync(outside, "must never be readable by a reviewer\n");

const client = new CopilotClient({
  connection: RuntimeConnection.forStdio({ path: resolve(cliPath), env: process.env }),
});
const offered = async (session) => {
  await session.rpc.tools.initializeAndValidate();
  const { tools } = await session.rpc.tools.getCurrentMetadata();
  return tools.map((tool) => tool.name).sort();
};

try {
  await client.start();

  // 1. Enumerate the runtime's real built-in catalog instead of guessing names.
  const catalogSession = await client.createSession({ enableConfigDiscovery: false });
  const catalog = await offered(catalogSession);
  console.log(`Built-in catalog (${catalog.length}): ${catalog.join(", ")}`);
  const readTools = ["view", "grep", "glob"].filter((name) => catalog.includes(name));
  assert.deepEqual(readTools, ["view", "grep", "glob"].filter((name) => catalog.includes(name)));
  assert(readTools.length === 3,
    `Runtime does not offer the expected read tools; catalog was: ${catalog.join(", ")}`);

  // 2. Regression: today's reviewer policy must still offer nothing at all.
  const denied = await client.createSession({
    enableConfigDiscovery: false, ...reviewerPolicy({ permissionDenials: [], toolDenials: [] }),
  });
  assert.deepEqual(await offered(denied), [], "Current reviewer policy must remain zero-tool");
  console.log("PASS existing zero-tool reviewer policy unchanged");

  // 3. Grant exactly the read-only subset; nothing else may appear.
  const permissionRequests = [];
  const reader = await client.createSession({
    enableConfigDiscovery: false,
    availableTools: new ToolSet().addBuiltIn(readTools),
    // The handler is the real confinement point: reads are approved only inside
    // the reviewed checkout, and every other permission kind stays denied.
    onPermissionRequest: async (request) => {
      permissionRequests.push({ kind: request.kind, path: request.path });
      if (request.kind !== "read" || typeof request.path !== "string") return { kind: "reject" };
      const path = realpathSync(request.path);
      return path === root || path.startsWith(`${root}${sep}`)
        ? { kind: "approve-once" }
        : { kind: "reject" };
    },
  });
  const readerTools = await offered(reader);
  assert.deepEqual(readerTools, [...readTools].sort(),
    `Runtime did not honor the read-only subset: ${readerTools.join(", ")}`);
  for (const name of writeTools) {
    assert(!readerTools.includes(name), `Write/exec tool ${name} leaked into the read-only reviewer set`);
  }
  console.log(`PASS read-only subset granted exactly: ${readerTools.join(", ")}`);

  // 4. Forbidden tools must fail through the native pipeline, not just be absent.
  for (const name of writeTools) {
    let rejection;
    let result;
    try {
      result = await reader.rpc.tools.execute({ name, arguments: {} });
    } catch (error) {
      rejection = String(error);
    }
    // An excluded tool must be absent from the pipeline, not merely prompted for.
    const refusal = rejection ?? (result?.resultType === "denied" ? result.error : undefined) ??
      (result?.resultType === "failure" ? result.error : undefined);
    assert(refusal !== undefined && /not (available|found)|unknown tool|does not exist/i.test(refusal),
      `Forbidden tool ${name} was not refused: ${rejection ?? JSON.stringify(result)}`);
  }
  console.log("PASS write/exec tools refused natively inside the read-only reviewer session");

  // 5. A granted read tool must really execute, bound to a chosen directory.
  const moved = await reader.rpc.metadata.setWorkingDirectory({ workingDirectory: checkout });
  assert.equal(realpathSync(moved.workingDirectory), realpathSync(checkout),
    "Reviewer session working directory was not honored");
  const read = await reader.rpc.tools.execute({
    name: "view", arguments: { path: join(checkout, "src", "consumer.rs") },
  });
  const text = JSON.stringify(read);
  assert(read.resultType !== "denied", `Granted read tool was denied: ${text}`);
  assert(text.includes("lapin"), `Granted read tool returned no file content: ${text}`);
  assert.deepEqual(permissionRequests.map((entry) => entry.kind), ["read"]);
  console.log("PASS granted read tool executed against the chosen checkout directory");

  // 5b. Confinement: the same granted tool must not read outside the checkout.
  const escaped = await reader.rpc.tools.execute({ name: "view", arguments: { path: outside } });
  const escapedText = JSON.stringify(escaped);
  assert(escaped.resultType === "rejected", `Read outside the checkout was not rejected: ${escapedText}`);
  assert(!escapedText.includes("must never be readable"), "Denied read still leaked file content");
  console.log("PASS reads outside the reviewed checkout are denied by the permission handler");

  // 5c. The runtime accepts only a fixed decision vocabulary. Record it, because
  // read-only.mjs currently returns "denied-no-approval-rule", which is NOT in
  // it; that denial is unreachable today only because reviewers hold no tools.
  const malformed = await client.createSession({
    enableConfigDiscovery: false,
    availableTools: new ToolSet().addBuiltIn(["view"]),
    onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
  });
  assert.deepEqual(await offered(malformed), ["view"]);
  const rejected = JSON.stringify(await malformed.rpc.tools.execute({
    name: "view", arguments: { path: join(checkout, "src", "consumer.rs") },
  }));
  assert(/unknown variant `denied-no-approval-rule`/.test(rejected),
    `Expected the runtime to reject the current denial kind: ${rejected}`);
  assert(!rejected.includes("lapin"), "A malformed denial must not fall through to file content");
  console.log("PASS runtime rejects the current denial kind; grants require approve-once/reject");

  // 6. The grant must not become ambient: a fresh policy session stays empty.
  const stillDenied = await client.createSession({
    enableConfigDiscovery: false, ...reviewerPolicy({ permissionDenials: [], toolDenials: [] }),
  });
  assert.deepEqual(await offered(stillDenied), [], "Reviewer tool grant leaked into a zero-tool session");
  console.log("PASS the grant is per-session and does not leak");

  const events = await reader.getEvents();
  assert(!events.some((event) => event.type === "user.message" || event.type.startsWith("assistant.")),
    "The probe must not start model turns");
  console.log("PASS no inference was spent");
} finally {
  assert.deepEqual(await client.stop(), []);
  rmSync(checkout, { recursive: true, force: true });
  rmSync(outsideDirectory, { recursive: true, force: true });
}
