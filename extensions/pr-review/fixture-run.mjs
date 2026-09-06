import { reviewFixture } from "./fixture.mjs";

export function watchRuntime(client, controller) {
  let stopped = false;
  let pending = false;
  // The SDK has no public disconnect event. Only a failed RPC ends the run:
  // this interval is a connection probe, never a review deadline or fallback.
  const interval = setInterval(async () => {
    if (stopped || pending) return;
    pending = true;
    try {
      await client.ping("pr-review connection probe");
    } catch (error) {
      if (!stopped) controller.abort(new Error(`Owned runtime disconnected: ${String(error)}`));
    } finally {
      pending = false;
    }
  }, 1000);
  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

export async function executeFixtureRun(parent, client, settings, {
  controller, experiment, onStopped = () => {},
}) {
  let report;
  let error;
  let stopWatching;
  const cleanupErrors = [];
  try {
    await client.start();
    controller.signal.throwIfAborted();
    stopWatching = watchRuntime(client, controller);
    report = await reviewFixture(parent, client, settings, { signal: controller.signal, experiment });
  } catch (failure) {
    error = String(failure);
  } finally {
    stopWatching?.();
    try {
      cleanupErrors.push(...(await client.stop()).map(String));
    } catch (failure) {
      cleanupErrors.push(String(failure));
    }
    if (cleanupErrors.length) {
      try {
        await client.forceStop();
      } catch (failure) {
        cleanupErrors.push(`Force-stop failed: ${String(failure)}`);
      }
    }
  }
  const outcome = {
    experiment,
    ...report,
    cancelled: controller.signal.aborted && controller.signal.reason?.name === "AbortError",
    complete: report?.complete === true && !error && cleanupErrors.length === 0,
    error,
    cleanupErrors,
  };
  onStopped();
  if (!outcome.complete) {
    await parent.log(`Fixture review has incomplete coverage. This is not a clean-review result. ${error ?? ""} ${cleanupErrors.join("; ")}`,
      { level: "error" });
  }
  await parent.log(`${experiment === "fixture" ? "F2" : "F3"} evidence: ${JSON.stringify(outcome)}`);
  return outcome;
}
