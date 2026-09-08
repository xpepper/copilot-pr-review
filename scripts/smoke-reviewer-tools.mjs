// Capability probe only: can a reviewer child session be granted a read-only
// built-in tool subset, and does the runtime actually enforce that subset?
// It sends no prompt, spends no inference, and changes no review behavior.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  absentDenial, assertReviewerTools, readOnlyToolFilters, readOnlyTools, readingReviewerPolicy, reviewerEvidence,
  reviewerPolicy,
} from "../extensions/pr-review/read-only.mjs";

const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
if (!sdkPath || !cliPath) {
  throw new Error("Set COPILOT_SDK_PATH to the bundled SDK directory and COPILOT_CLI_PATH to the CLI executable.");
}
const { CopilotClient, RuntimeConnection, ToolSet } = await import(
  pathToFileURL(resolve(sdkPath, "index.js")).href
);

const writeTools = ["bash", "create", "edit", "apply_patch", "task", "sql", "web_fetch", "write_agent"];
const checkout = mkdtempSync(join(tmpdir(), "pr-review-reviewer-tools-"));
const root = realpathSync(checkout);
mkdirSync(join(checkout, "src"));
writeFileSync(join(checkout, "src", "consumer.rs"), "use lapin::Channel;\nfn main() {}\n");
const outsideDirectory = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-outside-")));
const outside = join(outsideDirectory, "secret.txt");
writeFileSync(outside, "must never be readable by a reviewer\n");
mkdirSync(join(outsideDirectory, "nested"));
// A symlink out of the checkout plus a decoy of the same name inside it: the
// shape that made the handler approve one path while the tool opened another.
symlinkSync(join(outsideDirectory, "nested"), join(checkout, "escape"));
writeFileSync(join(checkout, "secret.txt"), "reviewed content\n");

const client = new CopilotClient({
  connection: RuntimeConnection.forStdio({ path: resolve(cliPath), env: process.env }),
});
const sessionOptions = process.env.PR_REVIEW_HEAVY_MODEL ? { model: process.env.PR_REVIEW_HEAVY_MODEL } : {};
const createSession = (options) => client.createSession({ ...sessionOptions, ...options });
const offered = async (session) => {
  await session.rpc.tools.initializeAndValidate();
  const { tools } = await session.rpc.tools.getCurrentMetadata();
  return tools.map((tool) => tool.name).sort();
};

try {
  await client.start();

  // 1. Enumerate the runtime's real built-in catalog instead of guessing names.
  const catalogSession = await createSession({ enableConfigDiscovery: false });
  const catalog = await offered(catalogSession);
  console.log(`Built-in catalog (${catalog.length}): ${catalog.join(", ")}`);
  const searchTool = catalog.includes("rg") ? "rg" : "grep";
  const readTools = ["view", searchTool, "glob"].filter((name) => catalog.includes(name));
  assert(readTools.length === 3,
    `Runtime does not offer the expected read tools; catalog was: ${catalog.join(", ")}`);

  // 2. Regression: today's reviewer policy must still offer nothing at all.
  const denied = await createSession({
    enableConfigDiscovery: false, ...reviewerPolicy(reviewerEvidence()),
  });
  assert.deepEqual(await offered(denied), [], "Current reviewer policy must remain zero-tool");
  console.log("PASS existing zero-tool reviewer policy unchanged");

  // 3. The shipped read-only policy must grant exactly the read subset. It uses
  // plain `builtin:` filter strings, which must behave like the ToolSet builder.
  assert.deepEqual(new ToolSet().addBuiltIn(readOnlyTools).toArray(), readOnlyToolFilters,
    "The shipped filter strings must equal what the SDK builder produces");
  const evidence = reviewerEvidence({ root });
  const reader = await createSession(readingReviewerPolicy(evidence, root));
  const readerTools = await offered(reader);
  assert.deepEqual(readerTools, [...readTools].sort(),
    `Runtime did not honor the read-only subset: ${readerTools.join(", ")}`);
  await assertReviewerTools(reader, readOnlyTools);
  for (const name of writeTools) {
    assert(!readerTools.includes(name), `Write/exec tool ${name} leaked into the read-only reviewer set`);
  }
  console.log(`PASS read-only subset granted exactly: ${readerTools.join(", ")}`);

  // 4. Forbidden tools must fail through the native pipeline, not just be absent.
  // The shipped policy also denies them in its pre-tool-use hook, so check both
  // the hook-guarded session and a hook-less session with the same filters.
  const unguarded = await createSession({
    enableConfigDiscovery: false, availableTools: readOnlyToolFilters,
    onPermissionRequest: async () => ({ kind: "reject" }),
  });
  assert.deepEqual(await offered(unguarded), [...readTools].sort(),
    "Plain builtin: filter strings must grant exactly the read subset");
  for (const [session, label, pattern] of [
    [unguarded, "native exclusion", /not (available|found)|unknown tool|does not exist/i],
    [reader, "policy hook", /not (available|found)|unknown tool|does not exist|only read inside the reviewed checkout/i],
  ]) {
    for (const name of writeTools) {
      let rejection;
      let result;
      try {
        result = await session.rpc.tools.execute({
          name, arguments: name === "apply_patch" ? "*** Begin Patch\n*** End Patch\n" : {},
        });
      } catch (error) {
        rejection = String(error);
      }
      // An excluded tool must be refused by the runtime, not merely prompted for.
      const refusal = rejection ?? (["denied", "failure"].includes(result?.resultType) ? result.error : undefined);
      assert(refusal !== undefined && pattern.test(refusal),
        `Forbidden tool ${name} was not refused (${label}): ${rejection ?? JSON.stringify(result)}`);
    }
  }
  assert.deepEqual(evidence.toolDenials, writeTools,
    "Every refused write/exec tool is recorded as reviewer evidence");
  console.log("PASS write/exec tools refused natively and by the reviewer policy hook");

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
  assert.deepEqual(evidence.reads, [join("src", "consumer.rs")]);
  assert.deepEqual(evidence.permissionDenials, []);
  console.log("PASS granted read tool executed against the chosen checkout directory");

  // 5b. Confinement: the same granted tool must not read outside the checkout.
  const escaped = await reader.rpc.tools.execute({ name: "view", arguments: { path: outside } });
  const escapedText = JSON.stringify(escaped);
  assert(escaped.resultType === "rejected", `Read outside the checkout was not rejected: ${escapedText}`);
  assert(!escapedText.includes("must never be readable"), "Denied read still leaked file content");
  assert.deepEqual(evidence.permissionDenials, ["read"], "The refused read is recorded as a denial");
  assert.deepEqual(evidence.reads, [join("src", "consumer.rs")], "A refused read is never recorded as read evidence");
  console.log("PASS reads outside the reviewed checkout are denied by the permission handler");

  // 5c. Q7: a path that would have been inside the checkout had it existed is
  // still refused, and the reviewer is told which of the two refusals it got.
  // This is the seam the reason has to survive: the runtime, not a test double,
  // decides what a rejected tool call says back to the model.
  // Paths are named the way a reviewer sees them: its working directory is the
  // resolved root, and that is the root the review prompt states, so a request
  // is expressed under the resolved root rather than a symlinked prefix of it.
  const absentRead = await reader.rpc.tools.execute({
    name: "view", arguments: { path: join(root, "src", "missing.rs") },
  });
  const absentText = JSON.stringify(absentRead);
  assert.equal(absentRead.resultType, "denied", `An absent in-root read was not denied: ${absentText}`);
  assert(absentRead.textResultForLlm.includes("No such path inside the reviewed checkout"),
    `The reviewer was not told the path is absent: ${absentText}`);
  assert(absentRead.textResultForLlm.includes(join("src", "missing.rs")),
    `The absent-path refusal did not name the requested path: ${absentText}`);
  assert(!absentText.includes(outsideDirectory), "An absent-path refusal never names anything outside the checkout");
  assert.equal(evidence.permissionDenials.at(-1), absentDenial,
    "An absent path is recorded apart from a refused boundary escape");
  assert.deepEqual(evidence.reads, [join("src", "consumer.rs")], "A refused read is never recorded as read evidence");

  // 5d. Every other refusal is unchanged, message included. Saying that a path
  // outside the checkout does not exist would report on the host filesystem.
  for (const [label, path] of [
    ["an absent path outside", join(outsideDirectory, "absent.txt")],
    // Node's fs.realpathSync would answer <checkout>/secret.txt for this; the
    // kernel, and the open the tool performs, resolve it outside the checkout.
    ["a symlink escape with a decoy inside", `${root}${sep}escape${sep}..${sep}secret.txt`],
    ["an absent path behind that symlink", `${root}${sep}escape${sep}..${sep}absent.txt`],
  ]) {
    const refused = await reader.rpc.tools.execute({ name: "view", arguments: { path } });
    const refusedText = JSON.stringify(refused);
    assert.equal(refused.resultType, "rejected", `${label} was not refused as today: ${refusedText}`);
    assert(!refusedText.includes("No such path"), `${label} leaked an absent-path reason: ${refusedText}`);
    assert(!refusedText.includes("must never be readable") && !refusedText.includes("not reviewed"),
      `${label} leaked file content: ${refusedText}`);
    assert.equal(evidence.permissionDenials.at(-1), "read", label);
  }
  assert(!evidence.reads.includes("secret.txt"),
    "A read whose file is outside the checkout is never recorded as an in-root read");
  console.log("PASS an absent path is refused as absent, and every escape is refused exactly as before");

  const searchArguments = (path) => ({ pattern: "lapin", ...(searchTool === "rg" ? { paths: path } : { path }) });
  const search = await reader.rpc.tools.execute({ name: searchTool, arguments: searchArguments(root) });
  assert(!["denied", "rejected", "failure"].includes(search.resultType), JSON.stringify(search));
  assert(JSON.stringify(search).includes("consumer.rs"), JSON.stringify(search));
  assert(evidence.reads.includes("."), "Search must pass through the in-root permission handler");
  const searchOutside = await reader.rpc.tools.execute({
    name: searchTool, arguments: searchArguments(outsideDirectory),
  });
  assert.equal(searchOutside.resultType, "rejected", JSON.stringify(searchOutside));
  assert.equal(evidence.permissionDenials.at(-1), "read");
  console.log(`PASS ${searchTool} uses the unchanged builtin:grep grant and stays confined`);

  // 5e. The runtime accepts only a fixed decision vocabulary. F4 demonstrated
  // that the previous `denied-no-approval-rule` value was refused as an unknown
  // variant, turning a denial into a transport failure. Show both halves now:
  // the malformed value still fails, and the shipped `reject` denies cleanly.
  const malformed = await createSession({
    enableConfigDiscovery: false,
    availableTools: new ToolSet().addBuiltIn(["view"]),
    onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
  });
  assert.deepEqual(await offered(malformed), ["view"]);
  const rejected = JSON.stringify(await malformed.rpc.tools.execute({
    name: "view", arguments: { path: join(checkout, "src", "consumer.rs") },
  }));
  assert(/unknown variant `denied-no-approval-rule`/.test(rejected),
    `Expected the runtime to reject the malformed denial kind: ${rejected}`);
  assert(!rejected.includes("lapin"), "A malformed denial must not fall through to file content");
  const clean = await createSession({
    enableConfigDiscovery: false,
    availableTools: ["builtin:view"],
    onPermissionRequest: async () => ({ kind: "reject" }),
  });
  assert.deepEqual(await offered(clean), ["view"], "Plain builtin: filter strings grant the same tool");
  const denied2 = await clean.rpc.tools.execute({
    name: "view", arguments: { path: join(checkout, "src", "consumer.rs") },
  });
  assert.equal(denied2.resultType, "rejected", `A "reject" decision must deny cleanly: ${JSON.stringify(denied2)}`);
  assert(!JSON.stringify(denied2).includes("lapin"), "A clean denial must not leak file content");
  console.log("PASS the corrected reject denial refuses cleanly where denied-no-approval-rule fails transport");

  // 6. The grant must not become ambient: a fresh policy session stays empty.
  const stillDenied = await createSession({
    enableConfigDiscovery: false, ...reviewerPolicy(reviewerEvidence()),
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
