import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  assertNoReviewerTools, assertReviewerTools, probeForbiddenTools, readOnlyTools,
  readingReviewerPolicy, reviewerEvidence, reviewerPolicy,
} from "./read-only.mjs";

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
    validateModelAssignment({ model, reasoningEffort }, list);
    return { label, model, reasoningEffort };
  });
}

// A model this session offers that advertises no configurable reasoning effort
// at all, so it can hold none. A model the catalog does not offer answers false:
// that is refused on the model itself, and nothing about its effort is inferred.
export function advertisesNoReasoningEffort(model, list) {
  const available = subscriptionModels(list).find((entry) => entry.id === model);
  return available !== undefined && reasoningEfforts(available).length === 0;
}

export function validateModelAssignment({ model, reasoningEffort }, list) {
  const available = subscriptionModels(list).find((entry) => entry.id === model);
  if (!available) {
    throw new Error(`Unavailable or disabled Copilot-subscription model: ${model}. No substitution.`);
  }
  const supported = reasoningEfforts(available);
  if (reasoningEffort !== undefined && !supported.includes(reasoningEffort)) {
    throw new Error(supported.length
      ? `Unsupported reasoning effort ${reasoningEffort} for ${model}. No substitution.`
      : `${model} supports no configurable reasoning effort, so it cannot take ${reasoningEffort}. No substitution.`);
  }
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
  const report = await reviewAssignments(parent, client, assignments, {
    signal, probeTools: experiment === "adversarial",
    injectFailure: experiment === "failure",
    intro: "F2 fixture only. Outputs are unvalidated, not publishable findings.",
    outputLabel: "Unvalidated fixture output",
    prompt: (assignment) => [
      "Review ONLY the original fixture below against its comment contract.",
      `Your focus is ${assignment.label === "rounding" ? "whole-cent rounding" : "the free-shipping threshold"}.`,
      "Do not use tools, read any other files, run commands, delegate, or modify anything.",
      "Reply in at most 150 words with a defect, source line, and concrete input/expected/actual example,",
      "or explicitly state that you found no defect in your assigned focus.",
      "This is a feasibility exercise, not a real PR or a validated review.",
      "<fixture>", source, adversarial, "</fixture>",
    ].join("\n"),
  });
  await parent.log(report.complete
    ? "F2 fixture execution completed. Output has not been evidence-validated or deduplicated."
    : "F2 fixture execution has incomplete coverage. This is not a clean-review result.",
  { level: report.complete ? "info" : "error" });
  return { ...report, experiment };
}

// One reviewer session, created and proven to hold the assignment it was given.
// A fallback attempt is prepared exactly the same way, so nothing about its
// model, tools, working directory or catalog is checked any less.
async function prepareReviewer(client, assignment, { systemMessage, access, signal, attempt }) {
  const refusal = attempt === "fallback" ? "The fallback was not retried." : "No review started.";
  signal.throwIfAborted();
  const policy = reviewerEvidence(access);
  const session = await client.createSession({
    model: assignment.model,
    reasoningEffort: assignment.reasoningEffort,
    ...(systemMessage ? { systemMessage } : {}),
    ...(access ? readingReviewerPolicy(policy, access.root) : reviewerPolicy(policy)),
  });
  signal.throwIfAborted();
  // The owned runtime uses local CLI authentication; validate its own catalog too.
  const catalog = (await session.rpc.model.list()).list;
  validateModelAssignment(assignment, catalog);
  const current = await session.rpc.model.getCurrent();
  if (current.modelId !== assignment.model ||
      (assignment.reasoningEffort !== undefined && current.reasoningEffort !== assignment.reasoningEffort)) {
    throw new Error(`Runtime did not retain the explicit assignment for ${assignment.label}. ${refusal}`);
  }
  // An unset effort uses the runtime's resolved default, which must also be displayed and checked.
  assignment.reasoningEffort = current.reasoningEffort;
  validateModelAssignment(assignment, catalog);
  if (access) {
    // Reads resolve against the reviewed checkout, not the extension's cwd.
    const moved = await session.rpc.metadata.setWorkingDirectory({ workingDirectory: access.root });
    if (realpathSync(moved.workingDirectory) !== access.root) {
      throw new Error(`Runtime did not point reviewer ${assignment.label} at the reviewed checkout ${access.root}. ${refusal}`);
    }
    await assertReviewerTools(session, readOnlyTools);
  } else {
    await assertNoReviewerTools(session);
  }
  return { session, policy };
}

// What a failed primary attempt leaves behind on the reviewer that fell back.
// The record's own model and status describe the attempt that produced its
// result, so the attempt that did not is kept here rather than overwritten.
const failedAttempt = (record) => ({
  model: record.model, reasoningEffort: record.reasoningEffort, sessionId: record.sessionId,
  status: record.status, error: record.error, usage: record.usage,
  startedAt: record.startedAt, completedAt: record.completedAt, policy: record.policy,
});

export async function reviewAssignments(parent, client, assignments, {
  signal, prompt, intro, outputLabel, systemMessage, access, verifyResult,
  probeTools = false, injectFailure = false,
}) {
  const log = (message, level = "info") => parent.log(message, { level });
  const prepared = [];
  const enforcement = [];
  for (const assignment of assignments) {
    signal.throwIfAborted();
    const ready = await prepareReviewer(client, assignment, { systemMessage, access, signal, attempt: "primary" });
    prepared.push(ready);
    if (probeTools) {
      enforcement.push({ label: assignment.label, probes: await probeForbiddenTools(ready.session) });
    }
  }
  signal.throwIfAborted();
  await log(intro);
  for (const assignment of assignments) {
    await log(`Assignment ${assignment.label}: model=${assignment.model} reasoning=${assignment.reasoningEffort ?? "(not configurable)"}` +
      (assignment.fallback ? `; configured fallback model=${assignment.fallback.model} ` +
        `reasoning=${assignment.fallback.reasoningEffort ?? "(not configurable)"}, used at most once if this ` +
        "reviewer's own execution fails" : ""));
  }
  const runAttempt = async (assignment, ready, display, index) => {
    await log(`Reviewer ${display}: starting`);
    const evidence = await runReviewer(ready.session, prompt(assignment), {
      signal,
      injectFailure: injectFailure && index === 0,
      onActive: () => log(`Reviewer ${display}: active`),
      toolCalls: access ? ready.policy.toolCalls : undefined,
    });
    if (evidence.status === "completed" && (!evidence.usage.length || evidence.usage.some((usage) =>
      usage.model !== assignment.model ||
      (usage.reasoningEffort ?? undefined) !== assignment.reasoningEffort ||
      usage.isByok !== false,
    ))) {
      evidence.status = "incomplete";
      evidence.error = "Actual model/reasoning/subscription usage did not match the assignment.";
    }
    // An attempt that ran but delivered no usable output is a failed attempt,
    // exactly like one whose reported usage was wrong. Checking it here keeps
    // the answer beside the reviewer that failed, so a fallback never waits on
    // the rest of the batch; nothing about what the output means is decided
    // here, and the evidence boundary still parses it again for itself.
    if (evidence.status === "completed" && verifyResult) {
      try {
        verifyResult(evidence.result);
      } catch (error) {
        evidence.status = "incomplete";
        evidence.error = `Discarded unusable reviewer output: ${String(error)}`;
      }
    }
    await log(evidence.status === "completed"
      ? `Reviewer ${display}: completed\n${outputLabel}:\n${evidence.result}`
      : `Reviewer ${display}: ${evidence.status}; incomplete coverage. ${evidence.error}`,
    evidence.status === "completed" ? "info" : "error");
    return { ...assignment, ...evidence, policy: ready.policy };
  };
  // The one configured fallback attempt for one reviewer, after that reviewer's
  // own execution failed. It replaces neither the review nor any other reviewer,
  // and it is prepared and checked exactly as the primary attempt was.
  const runFallback = async (assignment, primary) => {
    const fallback = {
      label: assignment.label, tier: assignment.tier,
      model: assignment.fallback.model, reasoningEffort: assignment.fallback.reasoningEffort,
      origin: assignment.fallback.origin,
    };
    await log(`Reviewer ${assignment.label}: falling back once after an explicit failure. Primary ` +
      `model=${primary.model} reasoning=${primary.reasoningEffort ?? "(not configurable)"} failed: ${primary.error} ` +
      `Configured fallback model=${fallback.model} reasoning=${fallback.reasoningEffort ?? "(not configurable)"}. ` +
      "This is its only fallback attempt; no other reviewer is affected and the review is not restarted.", "error");
    let ready;
    try {
      ready = await prepareReviewer(client, fallback, { systemMessage, access, signal, attempt: "fallback" });
    } catch (error) {
      // The reviewer keeps the attempt that actually ran, and says why the
      // configured answer to that failure never started.
      const message = `Configured fallback ${fallback.model} could not start: ${String(error)}`;
      await log(`Reviewer ${assignment.label}: ${message}`, "error");
      return { ...primary, error: `${primary.error} ${message}` };
    }
    return {
      ...await runAttempt(fallback, ready, `${assignment.label} (configured fallback)`),
      fallbackFrom: failedAttempt(primary),
    };
  };
  const outcomes = await Promise.allSettled(assignments.map(async (assignment, index) => {
    const primary = await runAttempt(assignment, prepared[index], assignment.label, index);
    // A fallback answers this reviewer's own explicit failure and nothing else.
    // Cancellation is not one, and neither is elapsed time: nothing here imposes
    // a deadline, so a reviewer that never settles is never replaced.
    if (!assignment.fallback || primary.status !== "incomplete" || signal.aborted) return primary;
    return runFallback(assignment, primary);
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
  return {
    complete, cancelled: signal.aborted && signal.reason?.name === "AbortError",
    enforcement, reviewers,
  };
}

export async function runReviewer(session, prompt, {
  signal = new AbortController().signal,
  injectFailure = false,
  toolCalls,
  onActive = async () => {},
} = {}) {
  const evidence = { sessionId: session.sessionId, usage: [], billing: [], result: "", startedAt: null, completedAt: null };
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
        // Usage events are ephemeral. Preserve the reported charge for runtime
        // evidence; absence stays unknown, never a zero-cost claim.
        evidence.billing.push({ totalNanoAiu: event.data.copilotUsage?.totalNanoAiu });
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
        // A tool call is a hard failure unless this reviewer was granted the
        // confined read-only set; then the runtime, not the model, bounds it.
        if (!toolCalls) {
          reject(new Error("Reviewer attempted a tool call; no read-only claim can be made."));
          break;
        }
        toolCalls.push({ tool: event.data.toolName, arguments: event.data.arguments });
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
