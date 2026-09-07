import { randomUUID } from "node:crypto";
import { executeQuickRun } from "./quick.mjs";
import { retainedRecord, sessionStore } from "./retention.mjs";
import { cancelPreview } from "./preview.mjs";

export async function executeRetainedQuick(parent, client, options, assignments, lifecycle) {
  const invocation = { invocationId: randomUUID(), sessionId: parent.sessionId };
  const store = await sessionStore(parent);
  store.write({ schemaVersion: 2, state: "pending", invocation });
  const outcome = await executeQuickRun(parent, client, options, assignments, { ...lifecycle, invocation });
  await parent.log("Retaining the settled quick-review result in this session only. Nothing will be published.");
  // No await after this cancellation check/atomic write: activeRun clears in the
  // same microtask checkpoint, before another command or shutdown can intervene.
  if (lifecycle.controller.signal.aborted) {
    cancelPreview(outcome);
  }
  const record = retainedRecord(outcome);
  store.write(record);
  return { ...outcome, retention: { state: record.state, invocation, digest: record.digest } };
}
