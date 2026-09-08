// F5 feasibility probe harness. It answers four questions by demonstration:
//   1. can a factory-owned subagent hold exactly the confined view/grep/glob grant;
//   2. what the documented one-retry-on-schema-failure actually costs;
//   3. whether a failed subagent's `null` keeps incomplete coverage visible;
//   4. whether a factory run body can reach this extension's modules at all.
//
// It changes no shipped behaviour. Probe extensions are written into throwaway
// workspaces and discovered from there, so nothing is installed and the shipped
// plugin is untouched. Without --spend it starts no subagent and spends no
// inference; --spend runs the structured-output subagents and costs real
// Copilot credits, so it needs explicit authorization in the session that runs
// it.
import assert from "node:assert/strict";
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = realpathSync(resolve(here, ".."));
const sdkPath = process.env.COPILOT_SDK_PATH;
const cliPath = process.env.COPILOT_CLI_PATH;
if (!sdkPath || !cliPath) {
  throw new Error("Set COPILOT_SDK_PATH to the bundled SDK directory and COPILOT_CLI_PATH to the CLI executable.");
}
const spend = process.argv.includes("--spend");
const model = process.env.PR_REVIEW_F5_MODEL;
if (spend) {
  assert(model && !/\s/.test(model),
    "Set PR_REVIEW_F5_MODEL to the Claude-family model whose fenced output exposed the defect");
}

const { CopilotClient, RuntimeConnection, defineFactory } = await import(
  pathToFileURL(resolve(sdkPath, "index.js")).href
);

// Demonstrated below: the runtime gates the whole factory surface behind a
// feature flag that is off for this account, and reads it from the CLI
// process's own environment. Forcing it on here exercises the surface locally;
// it is not a configuration a user of this plugin could reach.
const factoryFlag = { COPILOT_CLI_ENABLED_FEATURE_FLAGS: "agent_factories" };

const evidence = {};
const workspaces = [];

function record(name, payload) {
  evidence[name] = payload;
  console.log(`\n--- ${name} ---\n${JSON.stringify(payload, undefined, 2)}`);
}

function workspace(prefix) {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  workspaces.push(directory);
  return directory;
}

function extension(root, name, source) {
  const directory = join(root, ".github", "extensions", name);
  mkdirSync(directory, { recursive: true });
  if (typeof source === "function") source(join(directory, "extension.mjs"));
  else writeFileSync(join(directory, "extension.mjs"), source);
}

function connect(env) {
  const runtimeEnv = { ...process.env, ...env };
  // The launcher's own override must not leak into extension children.
  delete runtimeEnv.COPILOT_CLI_PATH;
  return new CopilotClient({
    connection: RuntimeConnection.forStdio({ path: resolve(cliPath), env: runtimeEnv }),
  });
}

const statuses = (extensions) =>
  Object.fromEntries(extensions.filter((entry) => entry.source === "project")
    .map((entry) => [entry.name, entry.status]));

// Q0. Before any of the four questions matter, establish whether this plugin
// can reach the factory surface at all: whether an ordinary session has it, and
// whether the plugin's own owned runtime could register a factory on it.
async function probeAvailability() {
  const listRuns = async (env, config) => {
    const client = connect(env);
    try {
      await client.start();
      const session = await client.createSession({ enableConfigDiscovery: false, availableTools: [], ...config });
      try {
        return { ok: true, runs: await session.factory.listRuns() };
      } catch (error) {
        return { ok: false, error: String(error?.message ?? error) };
      }
    } finally {
      await client.stop().catch(() => {});
    }
  };
  const ordinary = await listRuns({}, { enableExperimentalMode: true });
  const flagged = await listRuns(factoryFlag, {});

  // The shipped reviewers run on a runtime this plugin owns as an SDK client.
  // If that client could register a factory, the plugin could set the flag on
  // its own child runtime and never depend on the user's CLI environment.
  const client = connect(factoryFlag);
  let owned;
  try {
    await client.start();
    const handle = defineFactory({
      meta: { name: "f5-owned-runtime", description: "d", phases: [{ title: "P" }] },
      run: async () => ({ ok: true }),
    });
    const session = await client.createSession({ enableConfigDiscovery: false, availableTools: [] });
    try {
      const joined = await client.resumeSessionForExtension(session.sessionId, { availableTools: [] }, [handle]);
      await joined.factory.run("f5-owned-runtime", { notifyOnComplete: false });
      owned = { registered: true };
    } catch (error) {
      owned = { registered: false, error: String(error?.message ?? error) };
    }
  } finally {
    await client.stop().catch(() => {});
  }
  return {
    ordinarySession: ordinary,
    featureFlagForcedOn: flagged,
    ownedRuntimeRegistration: owned,
  };
}

// Q1, step one. The shipped reviewers confine reads with a session permission
// handler, so the first thing to establish is whether a joining extension can
// register one at all. Each variant differs in exactly one `joinSession` option.
async function bisectJoinOptions() {
  const root = workspace("pr-review-f5-join-");
  const log = join(root, "join.log");
  const preamble = (name) => [
    'import { appendFileSync } from "node:fs";',
    `const note = (value) => appendFileSync(${JSON.stringify(log)}, \`[${name}] \${String(value?.stack ?? value)}\\n\`);`,
    'process.on("uncaughtException", note);',
    'process.on("unhandledRejection", note);',
    'import { defineFactory, joinSession } from "@github/copilot-sdk/extension";',
    'note("start");',
  ].join("\n");
  const variants = {
    "f5-join-control": "const session = await joinSession({ commands: [] });",
    "f5-join-factories":
      'const handle = defineFactory({ meta: { name: "f5-join-factory", description: "d", phases: [{ title: "P" }] }, ' +
      "run: async () => ({ ok: true }) });\nconst session = await joinSession({ factories: [handle] });",
    "f5-join-custom-agents":
      'const session = await joinSession({ customAgents: [{ name: "f5-join-agent", description: "d", ' +
      'prompt: "p", tools: ["view", "grep", "glob"] }] });',
    "f5-join-permission-handler":
      'const session = await joinSession({ onPermissionRequest: async () => ({ kind: "reject" }) });',
  };
  for (const [name, body] of Object.entries(variants)) {
    extension(root, name, `${preamble(name)}\n${body}\nnote("joined");\n`);
  }
  const client = connect(factoryFlag);
  try {
    await client.start();
    const session = await client.createSession({
      workingDirectory: root, enableExperimentalMode: true, enableConfigDiscovery: true,
      requestExtensions: true, availableTools: [],
      onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
    });
    await session.rpc.extensions.reload();
    const loaded = statuses((await session.rpc.extensions.list()).extensions);
    const joined = existsSync(log)
      ? [...new Set(readFileSync(log, "utf8").trim().split("\n"))].sort()
      : [];
    return { loaded, extensionLog: joined };
  } finally {
    await client.stop().catch(() => {});
  }
}

async function runProbe(inference) {
  const root = workspace("pr-review-f5-");
  const checkout = join(root, "checkout");
  mkdirSync(join(checkout, "src"), { recursive: true });
  extension(root, "pr-review-f5", (path) => copyFileSync(join(here, "f5-factory-extension.mjs"), path));
  const fixture = join("src", "cart.js");
  writeFileSync(join(checkout, fixture), [
    "// Free shipping applies from 50.00 inclusive.",
    "export function qualifiesForFreeShipping(subtotal) {",
    "  return subtotal > 50;",
    "}",
  ].join("\n") + "\n");
  const outsideRoot = workspace("pr-review-f5-outside-");
  const outside = join(outsideRoot, "secret.txt");
  writeFileSync(outside, "must never be readable by a factory subagent\n");
  const errorLog = join(root, "extension-error.log");

  // The host's handler is the only confinement point left once an extension
  // cannot register one. It approves reads inside the checkout and rejects
  // everything else, and records every request the runtime actually made.
  const permissionLog = [];
  const confine = (path) => {
    if (typeof path !== "string" || !path) return undefined;
    let real;
    try {
      real = realpathSync(path);
    } catch {
      return undefined;
    }
    if (real !== checkout && !real.startsWith(`${checkout}${sep}`)) return undefined;
    return relative(checkout, real) || ".";
  };

  const client = connect({
    ...factoryFlag,
    PR_REVIEW_F5_REPO: repoRoot,
    PR_REVIEW_F5_CHECKOUT: checkout,
    PR_REVIEW_F5_OUTSIDE: outside,
    PR_REVIEW_F5_ERROR: errorLog,
  });
  try {
    await client.start();
    const session = await client.createSession({
      workingDirectory: root, enableExperimentalMode: true, enableConfigDiscovery: true,
      requestExtensions: true,
      onPermissionRequest: async (request) => {
        const contained = request.kind === "read" ? confine(request.path) : undefined;
        const decision = contained === undefined ? "reject" : "approve-once";
        permissionLog.push({ kind: request.kind, path: request.path ?? null, contained: contained ?? null, decision });
        return { kind: decision };
      },
    });

    await session.rpc.extensions.reload();
    const { extensions } = await session.rpc.extensions.list();
    const probeExtension = extensions.find((entry) => entry.name === "pr-review-f5");
    assert.equal(probeExtension?.status, "running",
      `F5 probe extension must be running; saw ${JSON.stringify(probeExtension ?? statuses(extensions))}` +
      (existsSync(errorLog) ? `\nExtension startup error:\n${readFileSync(errorLog, "utf8")}` : ""));
    console.log(`Running: ${probeExtension.id}`);

    const probe = async (args) => {
      const before = (await session.getEvents()).length;
      const result = await session.rpc.commands.execute({ commandName: "f5-probe", args });
      assert.equal(result.error, undefined, `f5-probe ${args} failed: ${result.error}`);
      const messages = (await session.getEvents()).slice(before)
        .filter((event) => event.type === "session.info").map((event) => event.data.message);
      const line = messages.find((message) => message.startsWith("F5 probe "));
      assert(line, `f5-probe ${args} produced no evidence line. Timeline: ${messages.join(" | ")}`);
      return JSON.parse(line.slice(line.indexOf(": ") + 2));
    };

    // Q1, step two: does an extension's custom agent register, and does the
    // runtime report exactly the confined grant for it?
    record("q1-declared-agent", await probe("declare"));

    // Q4: what a factory run body can reach, with no subagent and no inference.
    const reach = await probe("reach");
    record("q4-reach", reach);
    assert.equal(reach.run.status, "completed", "The no-subagent factory run must complete");
    assert.equal(reach.consumed.subagents, 0, "The reach probe must spawn no subagent");
    assert.equal(reach.consumed.nanoAiu, 0, "The reach probe must spend no inference");

    if (!inference) {
      console.log("\nSkipping the inference probes. Re-run with --spend to answer Q2 and Q3.");
      return;
    }
    // Q1, step three, plus the baseline cost of one structured-output reviewer.
    permissionLog.length = 0;
    const confined = await probe(`structured model=${model} fixture=${fixture} agent=f5-confined-reviewer credits=15`);
    record("q1q2-confined", { ...confined, hostPermissionLog: [...permissionLog] });

    // Q2 and Q3: an unsatisfiable schema forces the documented retry, so the
    // second spawn and the `null` result are measured rather than assumed.
    permissionLog.length = 0;
    const unsatisfiable = await probe(
      `structured model=${model} fixture=${fixture} agent=f5-confined-reviewer unsatisfiable=true credits=15`);
    record("q2q3-unsatisfiable", { ...unsatisfiable, hostPermissionLog: [...permissionLog] });
  } finally {
    await client.stop().catch(() => {});
  }
}

try {
  record("q0-availability", await probeAvailability());
  record("q1-join-options", await bisectJoinOptions());
  await runProbe(spend);
  // Kept out of the repository: this is a run artifact, not a source file.
  const out = process.env.PR_REVIEW_F5_EVIDENCE ?? join(tmpdir(), "f5-evidence.json");
  writeFileSync(out, `${JSON.stringify(evidence, undefined, 2)}\n`);
  console.log(`\nWrote ${out}`);
} finally {
  for (const directory of workspaces) rmSync(directory, { recursive: true, force: true });
}
