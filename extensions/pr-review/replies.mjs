import { identityFrom } from "./prior.mjs";
import { responseParts, verifyPublicationTarget } from "./publication.mjs";
import { runGh } from "./target.mjs";

// I1c: answering the threads an earlier review of this pull request left behind.
// Everything before this wrote one review in one request, and every safety
// property publication.mjs states is stated for exactly one write: journal the
// uncertainty first, check one acknowledgment against the payload, never retry
// an unknown outcome. A reply per thread cannot be one request, so partial
// completion stops being an error case and becomes an ordinary result: some
// threads answered, one unknown, the rest never attempted. The record says
// exactly that, per thread, and the run stops at the first unknown.
//
// The authority is the review's own. `--no-comment` suppresses these exactly as
// it suppresses the review, and one confirmation covers both, because a flag
// that says "post nothing" must mean it. What replies do not need is a review:
// a re-review that selects no finding and has three earlier findings to answer
// is the case this feature exists for.

function requireReplies(condition, message) {
  if (!condition) throw new Error(`Reply refused: ${message}.`);
}

// The signature, built in code in one place, exactly as the review body is. It
// is what lets a later run recognise its own reply on a thread and answer that
// thread again only when the head has moved.
const replyOpening = "Revalidated at head";
const replyClosing = "This is a revalidation of a finding an earlier review by this tool published. " +
  "It is not a re-review of this pull request.";
const verdictLabels = { resolved: "RESOLVED", "still-open": "STILL OPEN", obsolete: "OBSOLETE" };

// The reason a code-proved verdict carries is the proof itself, stated in words,
// because there is no model reason to quote and inventing one would present an
// arithmetic as a judgment.
const proofSentences = {
  "unchanged-head": "This review evaluates exactly the head that review evaluated, so nothing has changed since.",
  untouched: "The commits added since that review do not touch the lines this comment anchors on.",
  "anchor-unplaceable": "GitHub can no longer place this comment in the current diff.",
  "file-deleted": "The commits added since that review deleted this file.",
};

export function replyBody(entry, head) {
  const label = verdictLabels[entry.verdict];
  requireReplies(label && /^[0-9a-f]{40}$/.test(head ?? ""), "a reply needs a settled verdict and a reviewed head");
  const reason = entry.decidedBy === "model" ? entry.reason : proofSentences[entry.proof];
  requireReplies(typeof reason === "string" && reason.trim(), "a reply needs a reason");
  return [
    `${replyOpening} ${head}: ${label}.`,
    reason,
    `Decided by ${entry.decidedBy === "model" ? "one model pass reading the current code" : "this tool, from the commit range"}.`,
    replyClosing,
  ].join("\n\n");
}

// Ours, and about this head. A reply we left at an older head answered a
// different revision, so a moved head is answered again rather than skipped.
export const isOurReply = (raw, identity, head) =>
  raw?.user?.login === identity.login && raw.user?.id === identity.id &&
  typeof raw.body === "string" && raw.body.startsWith(`${replyOpening} ${head}: `) &&
  raw.body.endsWith(replyClosing);

// Only a settled verdict is worth a thread's attention. Replying "I could not
// tell" to somebody's review comment is noise, and an unsettled verdict is
// exactly this tool saying it did not pay to find out.
export const answerableEntries = (revalidation) =>
  (revalidation?.entries ?? []).filter((entry) => entry.verdict !== "unsettled");

export function planReplies(revalidation, head, existing, identity) {
  const answered = new Set();
  for (const raw of existing ?? []) {
    if (isOurReply(raw, identity, head) && Number.isSafeInteger(raw.in_reply_to_id)) {
      answered.add(raw.in_reply_to_id);
    }
  }
  return answerableEntries(revalidation).map((entry) => ({
    commentId: entry.commentId, verdict: entry.verdict,
    body: replyBody(entry, head),
    disposition: answered.has(entry.commentId) ? "skipped" : "not-attempted",
    ...(answered.has(entry.commentId) ? { reason: "already answered at this head" } : {}),
  }));
}

export function interpretReplyWrite(stdout, error, planned) {
  const response = responseParts(stdout);
  if ([400, 401, 403, 404, 405, 410, 415, 422, 429].includes(response.status)) {
    return { disposition: "failed", error: `GitHub rejected the reply (HTTP ${response.status}).` };
  }
  if (!error && [200, 201].includes(response.status)) {
    let comment;
    try { comment = JSON.parse(response.body); }
    catch { return { disposition: "uncertain", error: "GitHub returned malformed reply JSON." }; }
    if (Number.isSafeInteger(comment?.id) && comment.id > 0 &&
        comment.in_reply_to_id === planned.commentId && comment.body === planned.body &&
        typeof comment.html_url === "string" && comment.html_url) {
      return { disposition: "written", replyId: comment.id, url: comment.html_url };
    }
  }
  return { disposition: "uncertain",
    error: "No trustworthy reply acknowledgment; the request may have reached GitHub. Do not retry." };
}

// A definite rejection is known not to have been written, so the next thread is
// still safe to answer. An unknown outcome is not: it stops the whole set, and
// every thread after it stays unattempted rather than becoming a second unknown.
const replyStatus = (entries) => {
  if (entries.some((entry) => entry.disposition === "uncertain")) return "uncertain";
  if (entries.some((entry) => ["failed", "not-attempted"].includes(entry.disposition))) return "partial";
  return "completed";
};

export async function dispatchReplies(outcome, binding, planned, { controller, cwd, gh = runGh, persist }) {
  requireReplies(typeof persist === "function", "durable write-ahead storage is unavailable");
  const entries = planned.map((entry) => ({ ...entry }));
  const record = (status) => {
    outcome.replies = { status, attempted: true, entries: entries.map((entry) =>
      ({ commentId: entry.commentId, verdict: entry.verdict, disposition: entry.disposition,
        ...(entry.replyId ? { replyId: entry.replyId, url: entry.url } : {}),
        ...(entry.error ? { error: entry.error } : {}),
        ...(entry.reason ? { reason: entry.reason } : {}) })) };
    persist(outcome);
  };
  record("in-flight");
  for (const entry of entries) {
    if (entry.disposition !== "not-attempted") continue;
    if (controller.signal.aborted) break;
    // The same write-ahead checkpoint the single review write makes, made once
    // per thread: this entry is journalled as unknown before the request, so a
    // process that dies mid-request leaves a record saying which thread it was.
    entry.disposition = "in-flight";
    record("in-flight");
    let stdout;
    let failure;
    try {
      stdout = await gh(["api", "--hostname", binding.repository.host, "--method", "POST",
        `repos/${binding.repository.nameWithOwner}/pulls/${binding.number}/comments/${entry.commentId}/replies`,
        "--include", "--input", "-", "-H", "Accept: application/vnd.github+json",
        "-H", "X-GitHub-Api-Version: 2022-11-28"],
      cwd, { signal: controller.signal, input: JSON.stringify({ body: entry.body }) });
    } catch (error) {
      failure = error;
      stdout = error.cause?.stdout ?? error.stdout;
    }
    Object.assign(entry, interpretReplyWrite(stdout, failure, entry));
    record("in-flight");
    if (entry.disposition === "uncertain") break;
  }
  record(replyStatus(entries));
  return outcome;
}

export async function publishReplies(parent, outcome, {
  controller, cwd, gh = runGh, persist,
}) {
  requireReplies(!outcome.replies, "this invocation already has a reply disposition");
  outcome.replies = { status: "not-attempted", attempted: false, entries: [] };
  const planned = answerableEntries(outcome.revalidation);
  // Every reason not to write, each stated rather than left as silence.
  const refusal =
    controller.signal.aborted || outcome.cancelled ? "the run was cancelled"
      : !outcome.revalidation ? undefined
        : !outcome.preview?.authorized ? "this run has no posting authority"
          : !planned.length ? "no earlier finding reached a settled verdict"
            : ["in-flight", "uncertain"].includes(outcome.publication?.status)
              ? "the review write's outcome is unknown, and an unknown remote state is never compounded"
              : undefined;
  if (!outcome.revalidation) return outcome;
  if (refusal) {
    outcome.replies.reason = refusal;
    await parent.log(`No thread was answered: ${refusal}. ${planned.length} settled verdict(s) were retained ` +
      "and nothing was written.");
    return outcome;
  }
  try {
    const request = (args) => {
      controller.signal.throwIfAborted();
      return gh(args, cwd, { signal: controller.signal });
    };
    const binding = outcome.binding;
    const guard = () => controller.signal.throwIfAborted();
    // The review's own gates, run again for this write set: repository identity,
    // pull identity, the reviewed head, the base, draft, open, and the captured
    // diff. A reply states the head it revalidated at, so a moved head must
    // refuse it exactly as it refuses an inline comment.
    await verifyPublicationTarget(binding, { gh, cwd, signal: controller.signal, guard });
    const identity = identityFrom(JSON.parse(await request(["api", "--hostname", binding.repository.host,
      "--method", "GET", "user", "-H", "Accept: application/vnd.github+json"])));
    // Read fresh rather than from capture: whether a thread already carries our
    // answer is a fact about GitHub now, not about when this run started.
    const pages = JSON.parse(await request(["api", "--hostname", binding.repository.host, "--method", "GET",
      `repos/${binding.repository.nameWithOwner}/pulls/${binding.number}/comments?per_page=100`,
      "-H", "Accept: application/vnd.github+json", "--paginate", "--slurp"]));
    requireReplies(Array.isArray(pages) && pages.every(Array.isArray), "invalid paginated listing");
    const plan = planReplies(outcome.revalidation, binding.head, pages.flat(), identity);
    const skipped = plan.filter((entry) => entry.disposition === "skipped").length;
    await parent.log(`Answering ${plan.length - skipped} thread(s) of the earlier review at head ${binding.head}` +
      `${skipped ? `; ${skipped} already carry this run's answer at this head and are skipped` : ""}. ` +
      "Each reply is one write, journalled before it is sent.");
    guard();
    return await dispatchReplies(outcome, binding, plan, { controller, cwd, gh, persist });
  } catch (error) {
    // A reply set that never started is not a partial one. Nothing was written,
    // and the record says so rather than leaving the reason to the reader.
    if (!outcome.replies.attempted) outcome.replies.reason = String(error.message ?? error);
    return outcome;
  }
}

export function describeReplies(outcome) {
  const replies = outcome.replies;
  if (!replies) return undefined;
  const count = (disposition) => replies.entries.filter((entry) => entry.disposition === disposition).length;
  if (!replies.attempted) {
    return `No thread of the earlier review was answered${replies.reason ? `: ${replies.reason}` : ""}.`;
  }
  const lines = [
    `Earlier review threads: ${count("written")} answered, ${count("skipped")} already answered at this head, ` +
      `${count("failed")} refused by GitHub, ${count("uncertain")} UNCERTAIN, ` +
      `${count("not-attempted") + count("in-flight")} not attempted.`,
  ];
  if (replies.status === "uncertain") {
    lines.push("One reply's outcome is UNKNOWN; GitHub may have received it. Do not retry it. The threads after " +
      "it were deliberately not attempted, because an unknown remote state is never compounded by more writes. " +
      "Inspect the pull request and reconcile this session's record before writing again.");
  }
  for (const entry of replies.entries) {
    if (entry.url) lines.push(`${entry.commentId}: ${entry.verdict}: ${entry.url}`);
    else if (entry.error) lines.push(`${entry.commentId}: ${entry.disposition}: ${entry.error}`);
  }
  return lines.join("\n");
}
