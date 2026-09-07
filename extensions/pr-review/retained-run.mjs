import { randomUUID } from "node:crypto";
import { executeQuickRun } from "./quick.mjs";
import { retainedRecord, sessionStore } from "./retention.mjs";
import { cancelPublication, publicationSummary } from "./publication.mjs";

export async function executeRetainedQuick(parent, client, options, assignments, lifecycle) {
  const invocation = { invocationId: randomUUID(), sessionId: parent.sessionId };
  const store = await sessionStore(parent);
  const previous = store.read();
  if (["in-flight", "uncertain"].includes(previous?.outcome?.publication?.status)) {
    throw new Error("Previous publication is uncertain. Do not retry or overwrite its journal; inspect GitHub and reconcile the retained record first.");
  }
  store.write({ schemaVersion: 3, state: "pending", invocation });
  const persist = (outcome) => store.write(retainedRecord(outcome));
  const outcome = await executeQuickRun(parent, client, options, assignments, { ...lifecycle, invocation, persist });
  await parent.log(`Publication: ${outcome.publication.status}. ${publicationSummary(outcome.publication)}` +
    `${outcome.publication.error ? ` ${outcome.publication.error}` : ""}\nRetaining the settled quick-review result in this session only.`);
  // No await after this cancellation check/atomic write: activeRun clears in the
  // same microtask checkpoint, before another command or shutdown can intervene.
  if (lifecycle.controller.signal.aborted) {
    cancelPublication(outcome);
  }
  const record = retainedRecord(outcome);
  store.write(record);
  return { ...outcome, retention: { state: record.state, invocation, digest: record.digest } };
}
