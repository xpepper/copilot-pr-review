import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { buildReviewPreview, cancelPreview, validatePreview } from "./preview.mjs";
import { reviewKey } from "./findings.mjs";
import { pullFrom, repositoryFrom, runGh, validateDiff } from "./target.mjs";

function requirePublication(condition, message) {
  if (!condition) throw new Error(`Publication refused: ${message}.`);
}

export function publicationSummary(publication) {
  if (!publication) return "No publication was attempted by this version.";
  if (publication.status === "succeeded") return `COMMENT review published: ${publication.review.url}`;
  if (["in-flight", "uncertain"].includes(publication.status)) {
    return "Publication outcome is UNCERTAIN; GitHub may have received the review. Do not retry. " +
      "Inspect GitHub and reconcile this session's record before starting another review.";
  }
  return publication.status === "failed" ? "GitHub submission definitely failed; no review was published."
    : "No publication was attempted.";
}

export function cancelPublication(outcome) {
  if (outcome.publication?.attempted) {
    // Cancellation cannot undo a remote write or erase its historical authority.
    outcome.publication.cancelRequested = true;
  } else {
    cancelPreview(outcome);
  }
}

function responseParts(stdout) {
  if (typeof stdout !== "string") return {};
  const match = /^HTTP\/[\d.]+ (\d{3})[^\r\n]*\r?\n(?:[^\r\n]+\r?\n)*\r?\n([\s\S]*)$/.exec(stdout);
  return match ? { status: Number(match[1]), body: match[2] } : {};
}

export function interpretWrite(stdout, error, request) {
  const response = responseParts(stdout);
  // A server error, interruption, or malformed success is not proof of no write.
  if ([400, 401, 403, 404, 405, 410, 415, 422, 429].includes(response.status)) {
    return { status: "failed", attempted: true, error: `GitHub rejected the review (HTTP ${response.status}).` };
  }
  if (!error && [200, 201].includes(response.status)) {
    let review;
    try { review = JSON.parse(response.body); }
    catch { return { status: "uncertain", attempted: true, error: "GitHub returned malformed review JSON." }; }
    const { binding, payload } = request;
    const url = `https://${binding.repository.host}/${binding.repository.nameWithOwner}/pull/${binding.number}` +
      `#pullrequestreview-${review?.id}`;
    if (Number.isSafeInteger(review?.id) && review.id > 0 && review.state === "COMMENTED" &&
        review.commit_id === payload.commit_id && review.body === payload.body && review.html_url === url) {
      return { status: "succeeded", attempted: true, review: { id: review.id, url } };
    }
  }
  return { status: "uncertain", attempted: true,
    error: "No trustworthy submission acknowledgment; the request may have reached GitHub. Do not retry." };
}

export function validatePublication(outcome) {
  const value = outcome.publication;
  requirePublication(value && typeof value === "object" && !Array.isArray(value), "missing publication state");
  const expected = { status: value.status, attempted: value.status !== "not-attempted" };
  requirePublication(["not-attempted", "in-flight", "succeeded", "failed", "uncertain"].includes(value.status),
    "unknown publication state");
  if (value.error !== undefined) {
    requirePublication(typeof value.error === "string" && value.error.trim(), "missing publication error");
    expected.error = value.error;
  }
  if (value.attempted) {
    validatePreview(outcome);
    requirePublication(outcome.preview.authorized && outcome.selection.status === "selected" &&
      !outcome.cancelled, "write without historical authority or canonical selection");
  }
  if (value.cancelRequested !== undefined) {
    requirePublication(value.attempted && value.cancelRequested === true, "invalid post-attempt cancellation");
    expected.cancelRequested = true;
  }
  if (["failed", "uncertain"].includes(value.status)) requirePublication(value.error, "missing failure detail");
  if (value.status === "succeeded") {
    const id = value.review?.id;
    requirePublication(Number.isSafeInteger(id) && id > 0, "invalid review ID");
    expected.review = { id, url: `https://${outcome.binding.repository.host}/` +
      `${outcome.binding.repository.nameWithOwner}/pull/${outcome.binding.number}#pullrequestreview-${id}` };
    requirePublication(!value.error, "success with error");
  }
  requirePublication(isDeepStrictEqual(value, expected), "incompatible publication schema");
}

export async function publishCurrent(parent, outcome, boundary, {
  controller, cwd, gh = runGh, persist,
}) {
  requirePublication(!outcome.publication, "this invocation already has a publication disposition");
  outcome.publication = { status: "not-attempted", attempted: false };
  if (controller.signal.aborted) cancelPublication(outcome);
  if (!outcome.preview?.authorized || outcome.cancelled) return outcome;
  const inputKey = reviewKey(outcome);
  const guard = () => {
    controller.signal.throwIfAborted();
    requirePublication(parent.sessionId === outcome.invocation.sessionId && reviewKey(outcome) === inputKey,
      "originating invocation or proposal changed during preflight");
  };
  let request;
  try {
    guard();
    validatePreview(outcome);
    request = buildReviewPreview(outcome, boundary);
    requirePublication(isDeepStrictEqual(request, outcome.preview.request), "authorized proposal changed");
    requirePublication(typeof persist === "function", "durable write-ahead storage is unavailable");
    const { repository, number, pullId, head, base, diffSha256 } = outcome.binding;
    const endpoint = `repos/${repository.nameWithOwner}`;
    const get = async (path, accept = "application/vnd.github+json") => {
      guard();
      const raw = await gh(["api", "--hostname", repository.host, "--method", "GET",
        path, "-H", `Accept: ${accept}`], cwd, { signal: controller.signal });
      guard();
      return raw;
    };
    const rawRepository = JSON.parse(await get(endpoint));
    const freshRepository = repositoryFrom({
      id: rawRepository.node_id, nameWithOwner: rawRepository.full_name, url: rawRepository.html_url,
    });
    requirePublication(isDeepStrictEqual(freshRepository, repository), "repository identity changed");
    const readPull = async () => {
      const pull = pullFrom(JSON.parse(await get(`${endpoint}/pulls/${number}`)), repository, number);
      requirePublication(pull.id === pullId && pull.head.sha === head && pull.base.sha === base,
        "PR identity, reviewed head, or base changed; rerun review");
      requirePublication(!pull.draft, "draft review overrides do not authorize publication");
      // Upstream permits non-open publication only as a summary. Our current
      // findings all require inline anchors, so no eligible non-open payload exists.
      requirePublication(pull.state === "OPEN", "inline reviews require an open PR, even with a closed-review override");
      return pull;
    };
    const pull = await readPull();
    const diff = await get(`${endpoint}/pulls/${number}`, "application/vnd.github.diff");
    validateDiff(diff, pull);
    requirePublication(createHash("sha256").update(diff).digest("hex") === diffSha256,
      "current diff differs from the captured anchors");
    requirePublication(isDeepStrictEqual(await readPull(), pull), "PR changed during publication preflight");
    guard();
  } catch (error) {
    outcome.publication.error = String(error);
    if (controller.signal.aborted) cancelPublication(outcome);
    return outcome;
  }

  // Persist uncertainty BEFORE invoking gh. No awaited host RPC can split this
  // checkpoint from dispatch. Failure to journal prevents the remote mutation.
  outcome.publication = { status: "in-flight", attempted: true };
  persist(outcome);
  let stdout;
  let failure;
  try {
    stdout = await gh(["api", "--hostname", request.binding.repository.host, "--method", "POST",
      `repos/${request.binding.repository.nameWithOwner}/pulls/${request.binding.number}/reviews`,
      "--include", "--input", "-", "-H", "Accept: application/vnd.github+json",
      "-H", "X-GitHub-Api-Version: 2022-11-28"],
    cwd, { signal: controller.signal, input: JSON.stringify(request.payload) });
  } catch (error) {
    failure = error;
    stdout = error.cause?.stdout ?? error.stdout;
  }
  outcome.publication = interpretWrite(stdout, failure, request);
  if (controller.signal.aborted) cancelPublication(outcome);
  // A failed final write leaves the preceding in-flight record intact.
  persist(outcome);
  return outcome;
}
