import { readFile } from "node:fs/promises";
import { assertNoReviewerTools, probeForbiddenTools, reviewerPolicy } from "./read-only.mjs";

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

export async function reviewFixture(parent, client, settings, {
  signal = new AbortController().signal,
  experiment = "fixture",
} = {}) {
  if (!["fixture", "adversarial", "failure"].includes(experiment)) {
    throw new Error(`Unknown fixture experiment: ${experiment}`);
  }
  signal.throwIfAborted();
  const { list } = await parent.rpc.model.list();
  const assignments = validateAssignments(settings, list);
  const fixture = await readFile(new URL("./fixtures/checkout.js", import.meta.url), "utf8");
  const source = fixture.split("\n").map((line, index) => `${index + 1}: ${line}`).join("\n");
  const adversarial = experiment === "adversarial"
    ? await readFile(new URL("./fixtures/adversarial.txt", import.meta.url), "utf8")
    : "";
  const log = (message, level = "info") => parent.log(message, { level });
  const sessions = [];
  const policies = [];
  const enforcement = [];
  for (const assignment of assignments) {
    signal.throwIfAborted();
    const policy = { permissionDenials: [], toolDenials: [] };
    const session = await client.createSession({
      model: assignment.model,
      reasoningEffort: assignment.reasoningEffort,
      ...reviewerPolicy(policy),
    });
    sessions.push(session);
    policies.push(policy);
    signal.throwIfAborted();
    // The owned runtime uses local CLI authentication; validate its own catalog too.
    validateAssignments(settings, (await session.rpc.model.list()).list);
    const current = await session.rpc.model.getCurrent();
    if (current.modelId !== assignment.model || current.reasoningEffort !== assignment.reasoningEffort) {
      throw new Error(`Runtime did not retain the explicit assignment for ${assignment.label}. No review started.`);
    }
    await assertNoReviewerTools(session);
    if (experiment === "adversarial") {
      enforcement.push({ label: assignment.label, probes: await probeForbiddenTools(session) });
    }
  }
  signal.throwIfAborted();
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
      adversarial,
      "</fixture>",
    ].join("\n"), {
      signal,
      injectFailure: experiment === "failure" && index === 0,
      onActive: () => log(`Reviewer ${assignment.label}: active`),
    });
    if (evidence.status === "completed" && (!evidence.usage.length || evidence.usage.some((usage) =>
      usage.model !== assignment.model ||
      usage.reasoningEffort !== assignment.reasoningEffort ||
      usage.isByok !== false,
    ))) {
      evidence.status = "incomplete";
      evidence.error = "Actual model/reasoning/subscription usage did not match the assignment.";
    }
    await log(evidence.status === "completed"
      ? `Reviewer ${assignment.label}: completed\nUnvalidated fixture output:\n${evidence.result}`
      : `Reviewer ${assignment.label}: ${evidence.status}; incomplete coverage. ${evidence.error}`,
    evidence.status === "completed" ? "info" : "error");
    return { ...assignment, ...evidence, policy: policies[index] };
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
  const complete = !signal.aborted && reviewers.every((reviewer) => reviewer.status === "completed");
  await log(complete
    ? "F2 fixture execution completed. Output has not been evidence-validated or deduplicated."
    : "F2 fixture execution has incomplete coverage. This is not a clean-review result.",
  complete ? "info" : "error");
  return {
    complete, cancelled: signal.aborted && signal.reason?.name === "AbortError",
    experiment, enforcement, reviewers,
  };
}

export async function runReviewer(session, prompt, {
  signal = new AbortController().signal,
  injectFailure = false,
  onActive = async () => {},
} = {}) {
  const evidence = { sessionId: session.sessionId, usage: [], result: "", startedAt: null, completedAt: null };
  const { promise, resolve, reject } = Promise.withResolvers();
  // Cancellation can reject before send, while cleanup is still awaiting an RPC.
  promise.catch(() => {});
  const cancel = () => reject(signal.reason);
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  const unsubscribe = session.on((event) => {
    switch (event.type) {
      case "assistant.turn_start":
        evidence.startedAt ??= Date.parse(event.timestamp);
        // Log delivery failures must settle the reviewer too, rather than leave a rejected callback.
        onActive().catch(reject);
        if (injectFailure) reject(new Error("Injected reviewer failure after turn start."));
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
      case "session.shutdown":
        reject(new Error("Reviewer session shut down before completion."));
        break;
      case "session.idle":
        evidence.completedAt = Date.parse(event.timestamp);
        if (!evidence.result?.trim()) reject(new Error("Reviewer produced no usable output."));
        else resolve(evidence);
        break;
    }
  });
  try {
    signal.throwIfAborted();
    // sendAndWait has a default deadline. Subscribe first and wait without a timer.
    await Promise.all([session.send({ prompt }), promise]);
    return { ...evidence, status: "completed" };
  } catch (error) {
    evidence.status = signal.aborted && signal.reason?.name === "AbortError" ? "cancelled" : "incomplete";
    evidence.error = String(error);
    // A failed local waiter does not stop inference. Abort before reporting it settled.
    try {
      await session.abort();
      evidence.abortAcknowledged = true;
    } catch (abortError) {
      evidence.abortAcknowledged = false;
      evidence.error += `; reviewer abort failed: ${String(abortError)}`;
    }
    return evidence;
  } finally {
    signal.removeEventListener("abort", cancel);
    unsubscribe();
  }
}
