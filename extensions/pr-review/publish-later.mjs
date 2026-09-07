import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { assembleContext } from "./context.mjs";
import { evidenceBoundary, reviewKey } from "./findings.mjs";
import { buildReviewPreview } from "./preview.mjs";
import {
  cancelPublication, dispatchPublication, publicationSummary, verifyPublicationTarget,
} from "./publication.mjs";
import { retainedRecord, sessionStore } from "./retention.mjs";
import { runGh } from "./target.mjs";

function refuse(condition, message) {
  if (!condition) throw new Error(`Publish-later refused: ${message}.`);
}

// The retained record holds findings, canonical selection and binding, never the
// captured evidence boundary. Reconstructing the request from it proves nothing
// about the current source, so publication reestablishes the boundary from
// GitHub before building any mutation.
export async function publishRetained(parent, { controller, gh = runGh, store, authority, onOutcome }) {
  const record = store.read();
  refuse(record, "no retained review result in this session; nothing to publish");
  refuse(record.state === "settled", "the retained invocation is unfinished or interrupted");
  refuse(record.schemaVersion >= 2,
    "the retained record predates publication support; rerun the review to publish it");
  const outcome = record.outcome;
  refuse(!outcome.cancelled, "the retained review was cancelled");
  refuse(outcome.binding && outcome.validation, "the retained review has no bound validated findings");
  refuse(outcome.selection.status === "selected" && outcome.selection.findingIds.length > 0,
    "the retained review has no selected findings");
  const previous = outcome.publication;
  refuse(previous?.status !== "succeeded",
    `this retained result was already published as ${previous?.review?.url}; a repeat write is refused`);
  refuse(!["in-flight", "uncertain"].includes(previous?.status),
    "the previous publication outcome is unresolved; inspect GitHub and reconcile the record first");
  const inputKey = reviewKey(outcome);
  const guard = () => {
    controller.signal.throwIfAborted();
    refuse(parent.sessionId === record.invocation.sessionId && reviewKey(outcome) === inputKey,
      "the originating session or retained result changed during preflight");
  };
  guard();
  await parent.log([
    `Publish-later: explicit authorization ${authority.invocationId} for retained invocation ` +
      `${record.invocation.invocationId}, ${outcome.binding.repository.nameWithOwner}` +
      `#${outcome.binding.number} at reviewed head ${outcome.binding.head}.`,
    `${outcome.selection.findingIds.length} selected finding(s); review coverage: ${outcome.coverage}.`,
    "This is a new explicit publication action. Retained posting flags, configuration and confirmations " +
      "are historical and authorize nothing. No reviewer, validator or parent inference runs.",
    ...(previous?.status === "failed"
      ? [`The previous attempt definitely failed (${previous.error}); this retry reruns every gate.`] : []),
  ].join("\n"));
  guard();
  const cwd = store.cwd;
  const binding = outcome.binding;
  const { pull, diff, recheck } = await verifyPublicationTarget(binding, {
    gh, cwd, signal: controller.signal, guard,
  });
  const snapshot = {
    repository: binding.repository, pull, diff,
    diffSha256: createHash("sha256").update(diff).digest("hex"),
  };
  // Refetch the reviewed revisions' source. Blob identity, the captured diff and
  // the context digest must still agree, or the retained findings lose provenance.
  const context = await assembleContext(snapshot, {
    cwd, gh: (args, where) => { guard(); return gh(args, where, { signal: controller.signal }); },
  });
  guard();
  const boundary = evidenceBoundary(snapshot, context, binding);
  const request = buildReviewPreview(outcome, boundary);
  if (outcome.preview?.request) {
    refuse(isDeepStrictEqual(request, outcome.preview.request),
      "the retained proposal no longer matches the canonical payload");
  }
  await parent.log("Publish-later COMMENT review payload, rebuilt from the retained selection and " +
    `refetched evidence:\n${JSON.stringify(request, null, 2)}`);
  await recheck();
  guard();
  onOutcome?.(outcome);
  return dispatchPublication(outcome, request, {
    controller, cwd, gh, authority, persist: (value) => store.write(retainedRecord(value)),
  });
}

export async function executePublishLater(parent, { controller }, { gh = runGh } = {}) {
  const authority = { kind: "publish-later", invocationId: randomUUID(), sessionId: parent.sessionId };
  let store;
  let settled;
  let dispatchedOutcome;
  let failure;
  try {
    store = await sessionStore(parent);
    settled = await publishRetained(parent, {
      controller, gh, store, authority, onOutcome: (value) => { dispatchedOutcome = value; },
    });
  } catch (error) {
    failure = String(error);
  }
  const publication = (settled ?? dispatchedOutcome)?.publication
    ?? { status: "not-attempted", attempted: false, error: failure };
  const dispatched = publication.attempted === true;
  await parent.log([
    `Publish-later publication: ${publication.status}. ${publicationSummary(publication)}`,
    ...(failure ? [dispatched
      ? `The command failed after dispatch: ${failure} The durable journal in this session is ` +
        "authoritative; GitHub may hold the review. Do not retry blindly."
      : `${failure} Nothing was written and the retained record is unchanged.`] : []),
    "No reviewer, validator or parent inference ran; the retained review was not rerun.",
  ].join(" "), { level: publication.status === "succeeded" ? "info" : "error" });
  // No await after this cancellation check/atomic write: activeRun clears in the
  // same microtask checkpoint, before another command or shutdown can intervene.
  if (settled && controller.signal.aborted && dispatched && !publication.cancelRequested) {
    cancelPublication(settled);
    store.write(retainedRecord(settled));
  }
  return {
    cleanupErrors: [], publication,
    publishLater: {
      authority, status: publication.status, dispatched,
      ...(settled ? { digest: retainedRecord(settled).digest } : {}),
      ...(failure ? { error: failure } : {}),
    },
  };
}
