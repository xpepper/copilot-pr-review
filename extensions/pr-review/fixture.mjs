import { readFile } from "node:fs/promises";

const keys = ["model1", "effort1", "model2", "effort2"];

export function parseFixtureArgs(args) {
  const settings = {};
  for (const token of args.trim().split(/\s+/).slice(1)) {
    const [key, value, extra] = token.split("=");
    if (!keys.includes(key) || !value || extra !== undefined || key in settings) {
      throw new Error(`Invalid or duplicate fixture setting: ${token}`);
    }
    settings[key] = value;
  }
  requireSettings(settings);
  return settings;
}

function requireSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings) ||
      Object.keys(settings).length !== keys.length ||
      keys.some((key) => typeof settings[key] !== "string" || !settings[key].trim())) {
    throw new Error("Fixture requires explicit model1, effort1, model2, and effort2 settings.");
  }
  if (settings.model1 === settings.model2 || settings.effort1 === settings.effort2) {
    throw new Error("F2 requires distinct models and distinct reasoning efforts.");
  }
}

export function subscriptionModels(list) {
  return list.filter((model) =>
    typeof model?.id === "string" && !model.id.includes("/") && model.id !== "auto" &&
    (!model.policy || model.policy.state === "enabled"),
  );
}

export function reasoningEfforts(model) {
  // Session-scoped listing returns CAPI metadata, not client.listModels()'s projection.
  const efforts = model.capabilities?.supports?.reasoning_effort;
  return Array.isArray(efforts) ? efforts.filter((effort) => typeof effort === "string") : [];
}

export function validateAssignments(settings, list) {
  requireSettings(settings);
  return ["rounding", "shipping"].map((label, index) => {
    const model = settings[`model${index + 1}`];
    const reasoningEffort = settings[`effort${index + 1}`];
    const available = subscriptionModels(list).find((entry) => entry.id === model);
    if (!available) {
      throw new Error(`Unavailable or disabled Copilot-subscription model: ${model}. No substitution.`);
    }
    if (!reasoningEfforts(available).includes(reasoningEffort)) {
      throw new Error(`Unsupported reasoning effort ${reasoningEffort} for ${model}. No substitution.`);
    }
    return { label, model, reasoningEffort };
  });
}

export async function reviewFixture(parent, client, settings) {
  const { list } = await parent.rpc.model.list();
  const assignments = validateAssignments(settings, list);
  const fixture = await readFile(new URL("./fixtures/checkout.js", import.meta.url), "utf8");
  const source = fixture.split("\n").map((line, index) => `${index + 1}: ${line}`).join("\n");
  const log = (message, level = "info") => parent.log(message, { level });
  const sessions = [];
  for (const assignment of assignments) {
    const session = await client.createSession({
      model: assignment.model,
      reasoningEffort: assignment.reasoningEffort,
      enableConfigDiscovery: false,
      availableTools: [],
      onPermissionRequest: async () => ({ kind: "denied-no-approval-rule" }),
    });
    sessions.push(session);
    // The owned runtime uses local CLI authentication; validate its own catalog too.
    validateAssignments(settings, (await session.rpc.model.list()).list);
    const current = await session.rpc.model.getCurrent();
    if (current.modelId !== assignment.model || current.reasoningEffort !== assignment.reasoningEffort) {
      throw new Error(`Runtime did not retain the explicit assignment for ${assignment.label}. No review started.`);
    }
  }
  await log("F2 fixture only. Outputs are unvalidated, not publishable findings.");
  for (const assignment of assignments) {
    await log(`Assignment ${assignment.label}: model=${assignment.model} reasoning=${assignment.reasoningEffort}`);
  }
  const outcomes = await Promise.allSettled(assignments.map(async (assignment, index) => {
    await log(`Reviewer ${assignment.label}: starting`);
    const evidence = await runReviewer(sessions[index], [
      "Review ONLY the original fixture below against its comment contract.",
      `Your focus is ${assignment.label === "rounding" ? "whole-cent rounding" : "the free-shipping threshold"}.`,
      "Do not use tools, read any other files, run commands, delegate, or modify anything.",
      "Reply in at most 150 words with a defect, source line, and concrete input/expected/actual example,",
      "or explicitly state that you found no defect in your assigned focus.",
      "This is a feasibility exercise, not a real PR or a validated review.",
      "<fixture>",
      source,
      "</fixture>",
    ].join("\n"));
    if (!evidence.usage.length || evidence.usage.some((usage) =>
      usage.model !== assignment.model ||
      usage.reasoningEffort !== assignment.reasoningEffort ||
      usage.isByok !== false,
    )) {
      throw new Error(`${assignment.label}: actual model/reasoning/subscription usage did not match the assignment.`);
    }
    await log(`Reviewer ${assignment.label}: completed\nUnvalidated fixture output:\n${evidence.result}`);
    return { ...assignment, status: "completed", ...evidence };
  }));
  const reviewers = [];
  for (const [index, outcome] of outcomes.entries()) {
    if (outcome.status === "fulfilled") {
      reviewers.push(outcome.value);
    } else {
      const error = String(outcome.reason);
      await log(`Reviewer ${assignments[index].label}: failed; incomplete coverage. ${error}`, "error");
      reviewers.push({ ...assignments[index], status: "incomplete", error });
    }
  }
  const complete = reviewers.every((reviewer) => reviewer.status === "completed");
  await log(complete
    ? "F2 fixture execution completed. Output has not been evidence-validated or deduplicated."
    : "F2 fixture execution has incomplete coverage. This is not a clean-review result.",
  complete ? "info" : "error");
  return { complete, reviewers };
}

async function runReviewer(session, prompt) {
  const evidence = { sessionId: session.sessionId, usage: [], result: "", startedAt: null, completedAt: null };
  const { promise, resolve, reject } = Promise.withResolvers();
  const unsubscribe = session.on((event) => {
    switch (event.type) {
      case "assistant.turn_start":
        evidence.startedAt ??= Date.parse(event.timestamp);
        break;
      case "assistant.usage":
        evidence.usage.push({
          model: event.data.model,
          reasoningEffort: event.data.reasoningEffort,
          isByok: event.data.isByok,
        });
        break;
      case "assistant.message":
        evidence.result = event.data.content;
        break;
      case "tool.execution_start":
        reject(new Error("Fixture reviewer attempted a tool call; no read-only claim can be made."));
        break;
      case "session.error":
        reject(new Error(event.data.message));
        break;
      case "session.idle":
        evidence.completedAt = Date.parse(event.timestamp);
        if (!evidence.result?.trim()) reject(new Error("Reviewer produced no usable output."));
        else resolve(evidence);
        break;
    }
  });
  try {
    // sendAndWait has a default deadline. Subscribe first and wait without a timer.
    await Promise.all([session.send({ prompt }), promise]);
    return evidence;
  } finally {
    unsubscribe();
  }
}
