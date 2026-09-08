// F5 feasibility probe only. This file is never installed as part of the
// plugin: `smoke-factory.mjs` copies it into a throwaway workspace's
// `.github/extensions/` directory so the CLI discovers it for one session.
// It registers experimental Agent Factories next to the shipped extension's
// modules and reports what the runtime actually does, so nothing here may be
// mistaken for reviewer behaviour. It changes no shipped code path.
import { defineFactory, joinSession } from "@github/copilot-sdk/extension";
import { appendFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// A failed extension is reported to the session as a bare status, so the probe
// keeps its own startup diagnostics where the harness can read them.
const note = (error) => {
  if (process.env.PR_REVIEW_F5_ERROR) {
    appendFileSync(process.env.PR_REVIEW_F5_ERROR, `${String(error?.stack ?? error)}\n`);
  }
};
process.on("uncaughtException", note);
process.on("unhandledRejection", note);

const repoRoot = requireDirectory("PR_REVIEW_F5_REPO");
const checkoutRoot = requireDirectory("PR_REVIEW_F5_CHECKOUT");
const outsidePath = process.env.PR_REVIEW_F5_OUTSIDE;

function requireDirectory(name) {
  const value = process.env[name];
  if (!value) throw new Error(`F5 probe extension requires ${name}.`);
  return realpathSync(value);
}

// Module scope exists only in the extension process. A factory body that can
// read this closes over its authoring module, unlike a body authored through
// `factories_manage`, which is emitted verbatim into a generated module.
const moduleScopeWitness = `f5-module-scope-${process.pid}`;
const extensionModule = (name) => pathToFileURL(join(repoRoot, "extensions", "pr-review", name)).href;

// The probe records what the runtime actually surfaced to the extension,
// rather than trusting a subagent's own account of what it could reach.
const toolEventLog = [];

const reach = defineFactory({
  meta: {
    name: "f5-reach",
    description: "Spend no inference; report what a factory run body can reach. args: {}",
    phases: [{ title: "Reach" }],
    argsSchema: { type: "object" },
  },
  run: async (ctx) => {
    ctx.phase("Reach");
    ctx.log("Importing the shipped extension's modules from inside the factory body.");
    const reached = {};
    const failures = {};
    for (const name of ["modes.mjs", "findings.mjs", "read-only.mjs", "review.mjs", "fixture.mjs"]) {
      try {
        reached[name] = await import(extensionModule(name));
      } catch (error) {
        failures[name] = String(error);
      }
    }
    const mode = reached["modes.mjs"]?.reviewMode("balanced");
    // The exact defect F5 exists to answer, replayed through the shipped
    // parser with no inference: a fenced envelope is discarded whole.
    const envelopeBody = '{"schemaVersion":2,"reviewKey":"f5","candidates":[],"limitations":[]}';
    const parser = reached["findings.mjs"]?.collectCandidates;
    const parse = (result) => {
      if (!parser || !mode) return undefined;
      const collected = parser([{ label: "probe", status: "completed", result }], { key: "f5" }, mode.policy);
      return collected.diagnostics.map((entry) => entry.message);
    };
    return {
      closure: { moduleScopeWitness, staticImportVisible: typeof joinSession === "function" },
      dynamicImport: {
        reached: Object.keys(reached),
        failed: failures,
        modeId: mode?.id ?? null,
        policy: mode ? reached["modes.mjs"].describePolicy(mode.policy) : null,
        candidateFormatChars: mode ? reached["findings.mjs"]?.candidateFormat(mode.policy).length ?? null : null,
        reviewInstructionsChars: mode ? reached["review.mjs"]?.reviewInstructions(mode).length ?? null : null,
        readOnlyTools: reached["read-only.mjs"]?.readOnlyTools ?? null,
      },
      shippedParser: {
        plain: parse(envelopeBody),
        fenced: parse("```json\n" + envelopeBody + "\n```"),
      },
      runId: ctx.runId,
    };
  },
});

// One reviewer-shaped structured-output call. The schema is the shipped
// candidate envelope, so a success proves the real output shape survives the
// factory surface, not that some simpler shape does.
const candidateEnvelopeSchema = () => ({
  type: "object",
  required: ["schemaVersion", "reviewKey", "candidates", "limitations"],
  properties: {
    schemaVersion: { const: 2 },
    reviewKey: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "severity", "confidence", "location", "trigger", "expected", "actual",
          "introduction", "before", "after", "evidence"],
        properties: {
          title: { type: "string" },
          severity: { enum: ["P0", "P1", "P2", "P3", "nit"] },
          confidence: { type: "number" },
          location: citationSchema(),
          trigger: { type: "string" },
          expected: { type: "string" },
          actual: { type: "string" },
          introduction: { type: "string" },
          before: { anyOf: [citationSchema(), { type: "null" }] },
          after: { anyOf: [citationSchema(), { type: "null" }] },
          evidence: { type: "array", items: citationSchema() },
        },
      },
    },
    limitations: {
      type: "array",
      items: {
        type: "object",
        required: ["kind", "reason", "impact"],
        properties: {
          kind: { enum: ["coverage-gap", "caveat"] },
          reason: { type: "string" },
          impact: { type: ["string", "null"] },
        },
      },
    },
  },
});

function citationSchema() {
  return {
    type: "object",
    required: ["path", "side", "startLine", "endLine", "quote"],
    properties: {
      path: { type: "string" },
      side: { enum: ["head", "base"] },
      startLine: { type: "integer" },
      endLine: { type: "integer" },
      quote: { type: "string" },
    },
  };
}

// Deliberately unsatisfiable: `allOf` is honoured structurally, and no value is
// both a string and an integer. Every attempt must fail the match, so the
// documented one-retry becomes measurable instead of hypothetical.
const unsatisfiableSchema = () => ({
  type: "object",
  required: ["verdict"],
  properties: { verdict: { allOf: [{ type: "string" }, { type: "integer" }] } },
});

const reviewerPrompt = (fixture) => [
  "You are a read-only review probe. Your tools are view, grep and glob; nothing else exists.",
  `Read ${join(checkoutRoot, fixture)} and report the single most serious defect in it.`,
  `Then attempt, in order, to read ${outsidePath}, to run \`id\` with a shell tool, and to write a file.`,
  "Report each attempt that was refused as a separate limitations entry with kind \"caveat\" and impact null.",
  "Cite the file you read with exact quotes and line numbers from the file itself.",
  "Use side \"head\" for every citation. Set reviewKey to exactly f5-probe.",
].join("\n");

const spend = defineFactory({
  meta: {
    name: "f5-structured",
    description: "Spend inference on one structured-output subagent. " +
      "args: { model: string, fixture: string, unsatisfiable?: boolean, agent?: string }",
    phases: [{ title: "Subagent" }],
    argsSchema: {
      type: "object",
      required: ["model", "fixture"],
      properties: {
        model: { type: "string" },
        fixture: { type: "string" },
        unsatisfiable: { type: "boolean" },
        agent: { type: ["string", "null"] },
      },
    },
  },
  run: async (ctx) => {
    const { model, fixture, unsatisfiable = false, agent = null } = ctx.args ?? {};
    if (typeof model !== "string" || !model || typeof fixture !== "string" || !fixture) {
      throw new Error("f5-structured requires an explicit model and fixture.");
    }
    ctx.phase("Subagent");
    const options = {
      label: unsatisfiable ? "f5-unsatisfiable" : "f5-confined",
      model,
      schema: unsatisfiable ? unsatisfiableSchema() : candidateEnvelopeSchema(),
      ...(agent ? { agent } : {}),
    };
    ctx.log(`Spawning one subagent: ${JSON.stringify({ ...options, schema: "(omitted)" })}`);
    const started = Date.now();
    const result = await ctx.agent(reviewerPrompt(fixture), options);
    return {
      runId: ctx.runId,
      requested: { model, agent, unsatisfiable },
      // `null` is the documented ordinary-failure result. Record it as itself,
      // never as an empty review.
      resolvedNull: result === null,
      resultType: result === null ? "null" : Array.isArray(result) ? "array" : typeof result,
      result: result ?? null,
      elapsedMs: Date.now() - started,
    };
  },
});

const session = await joinSession({
  factories: [reach, spend],
  customAgents: [{
    name: "f5-confined-reviewer",
    displayName: "F5 confined reviewer",
    description: "F5 probe: a read-only reviewer holding exactly view, grep and glob.",
    tools: ["view", "grep", "glob"],
    prompt: [
      "You are a read-only review probe with exactly three tools: view, grep and glob.",
      "You cannot write, execute, delegate or reach any service. Report refusals rather than retrying.",
    ].join("\n"),
  }],
  // No `onPermissionRequest` here, deliberately. Demonstrated on CLI 1.0.83:
  // passing one makes `joinSession` never settle, and the extension is reported
  // as `failed`. The shipped reviewers confine reads with exactly such a
  // handler, so on this surface the session host owns that decision instead.
  // `scripts/smoke-factory.mjs` records the bisection that established it.
  commands: [{
    name: "f5-probe",
    description: "F5 feasibility probe: report factory reach, or run one structured-output subagent",
    handler: async ({ args }) => {
      const [verb, ...rest] = args.trim().split(/\s+/).filter(Boolean);
      switch (verb) {
        case "declare": {
          const custom = await session.rpc.agent.list({});
          const all = await session.rpc.agent.list({ includeBuiltInAgents: true });
          // The declared grant is not evidence that the runtime enforces it.
          // Selecting the agent and reading the runtime's own tool metadata is,
          // and costs no inference.
          const offered = async () => {
            await session.rpc.tools.initializeAndValidate();
            const { tools } = await session.rpc.tools.getCurrentMetadata();
            return tools.map((tool) => tool.name).sort();
          };
          const before = await offered();
          const previous = (await session.rpc.agent.getCurrent())?.name ?? null;
          await session.rpc.agent.select({ name: "f5-confined-reviewer" });
          const enforced = await offered();
          if (previous) await session.rpc.agent.select({ name: previous });
          else await session.rpc.agent.deselect();
          await report("declare", {
            customAgents: custom.agents?.map(({ name, id, tools, source }) => ({ name, id, tools, source })) ?? null,
            builtInAgentCount: all.agents?.length ?? null,
            confined: all.agents?.find((entry) => entry.name === "f5-confined-reviewer") ?? null,
            defaultAgentToolCount: before.length,
            defaultAgentTools: before,
            confinedAgentTools: enforced,
          });
          return;
        }
        case "reach": {
          toolEventLog.length = 0;
          const run = await session.factory.run(reach, { notifyOnComplete: false, logPhaseNames: true });
          await report("reach", await settle(run));
          return;
        }
        case "structured": {
          toolEventLog.length = 0;
          const settings = Object.fromEntries(rest.map((token) => token.split("=")));
          if (!settings.model || !settings.fixture) throw new Error("structured requires model= and fixture=.");
          const run = await session.factory.run(spend, {
            args: {
              model: settings.model,
              fixture: settings.fixture,
              unsatisfiable: settings.unsatisfiable === "true",
              agent: settings.agent === "none" ? null : settings.agent ?? null,
            },
            limits: { maxTotalSubagents: 4, maxAiCredits: Number(settings.credits ?? 15) },
            notifyOnComplete: false,
            logPhaseNames: true,
          });
          await report("structured", await settle(run));
          return;
        }
        default:
          throw new Error(`Unsupported F5 probe argument: ${args}`);
      }
    },
  }],
});

async function settle(run) {
  const detail = await session.factory.getRunDetail(run.runId);
  return {
    run: {
      runId: run.runId, status: run.status, result: run.result ?? null,
      error: run.error ?? null, failure: run.failure ?? null, reason: run.reason ?? null,
    },
    consumed: detail.consumed,
    totalSpawnedAgentCount: detail.totalSpawnedAgentCount,
    terminal: detail.terminal,
    agents: detail.agents.map(({ label, agentType, status, requestedModel, resolvedModel, activeMs }) =>
      ({ label, agentType, status, requestedModel, resolvedModel, activeMs })),
    progress: detail.progress?.records?.map((line) => `${line.kind}: ${line.text}`) ?? null,
    toolEventLog: [...toolEventLog],
  };
}

const report = (verb, payload) => session.log(`F5 probe ${verb}: ${JSON.stringify(payload)}`);

session.on((event) => {
  if (["tool.execution_start", "tool.execution_end", "permission.requested"].includes(event.type)) {
    toolEventLog.push({ type: event.type, tool: event.data?.toolName ?? null, agentId: event.data?.agentId ?? null });
  }
});

await session.log("F5 probe extension ready.");
