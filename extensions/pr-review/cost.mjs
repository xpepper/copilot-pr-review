// T1: what a run cost and how long it took, as one line beside its coverage.
//
// This is deliberately not part of `formatCoverage`. That text is embedded in
// the review body `preview.mjs` publishes, so a cost sentence written there
// would post what a review cost to somebody's pull request. The figures belong
// in the run's own timeline and nowhere else.
//
// Nothing here is a budget. An elapsed figure is a report about a run that has
// already finished; no stage reads it, and no stage may start doing so.

// Every attempt a run paid for. A reviewer its one configured fallback
// recovered has two: the attempt that failed spent what it spent before it
// failed, and the recovery does not refund it.
const attemptsOf = (passes) =>
  (passes ?? []).flatMap((pass) => [pass, ...(pass.fallbackFrom ? [pass.fallbackFrom] : [])]);

// An attempt is timed once the runtime reported both ends of its turn. One that
// never started, or that the runtime never reported idle for, contributes no
// model time rather than a zero-length one.
const timed = (attempt) =>
  Number.isFinite(attempt.startedAt) && Number.isFinite(attempt.completedAt) &&
  attempt.completedAt >= attempt.startedAt;

const charged = ({ totalNanoAiu }) => Number.isFinite(totalNanoAiu) && totalNanoAiu >= 0;

export function runCost(passes, elapsedMs) {
  const attempts = attemptsOf(passes);
  if (!attempts.length) return undefined;
  const charges = attempts.flatMap((attempt) => attempt.billing ?? []);
  const reported = charges.filter(charged);
  const running = attempts.filter(timed);
  // A pass that never reached inference emitted no usage event, so it has no
  // request to charge, and that is a provable zero. A pass whose turn started
  // and that reported no usage event at all is the opposite: it ran, it was
  // billed for something, and the runtime said nothing about it. The two look
  // identical in the billing entries and are told apart by whether a turn ever
  // started, because counting requests from the charges alone calls the second
  // one a zero-credit pass. Reported on pull request #37 by this increment's
  // own review.
  const uncharged = attempts.filter((attempt) =>
    Number.isFinite(attempt.startedAt) && !(attempt.billing ?? []).length).length;
  return {
    passes: attempts.length,
    requests: charges.length,
    reportedRequests: reported.length,
    uncharged,
    // nano-AIU is the runtime's own unit, and this division is a change of unit
    // rather than a rounding: these figures are recorded verbatim as an
    // increment's evidence. One unreported charge leaves no total at all.
    credits: reported.length === charges.length && uncharged === 0
      ? reported.reduce((sum, { totalNanoAiu }) => sum + totalNanoAiu, 0) / 1e9
      : undefined,
    modelMs: running.reduce((sum, attempt) => sum + (attempt.completedAt - attempt.startedAt), 0),
    timedPasses: running.length,
    ...(Number.isFinite(elapsedMs) ? { elapsedMs } : {}),
  };
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;

export function formatCost(cost) {
  // Model time is summed per pass, so in a parallel mode it exceeds the elapsed
  // time by design: five reviewers working for a minute each is five minutes of
  // model work in one minute of waiting. Both are reported because neither
  // answers the other's question.
  return [
    `Review cost: ${cost.credits === undefined
      ? `unavailable, the runtime reported ${[
        ...(cost.reportedRequests === cost.requests
          ? [] : [`a charge for ${cost.reportedRequests} of ${cost.requests} request(s)`]),
        ...(cost.uncharged ? [`no charge at all for ${cost.uncharged} pass(es) that ran`] : []),
      ].join(" and ")}, and an unreported charge is unknown rather than zero`
      : `${cost.credits} AI credits over ${cost.requests} request(s)`}`,
    `${seconds(cost.modelMs)} of model work in ${cost.timedPasses} pass(es)`,
    ...(cost.elapsedMs === undefined ? [] : [`${seconds(cost.elapsedMs)} elapsed`]),
  ].join("; ") + ".";
}
