// T1: what a finished review reports about its own cost and elapsed time.
//
// The figures come from the runtime, so the interesting cases here are the
// dishonest ones a summary could tell: a partial sum presented as a total, a
// pass whose charge was silently dropped before the outcome was assembled, and
// a recovered reviewer whose failed attempt is billed but forgotten.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatCost, runCost } from "../extensions/pr-review/cost.mjs";
import { formatCoverage } from "../extensions/pr-review/coverage.mjs";

// A pass as reviewAssignments returns one: the evidence runReviewer collected,
// plus the label and assignment it was started with.
const pass = (label, { charges = [], startedAt, completedAt, status = "completed", ...rest } = {}) => ({
  label, status, model: "heavy", reasoningEffort: "high",
  billing: charges.map((totalNanoAiu) => ({ totalNanoAiu })),
  usage: charges.map(() => ({ model: "heavy", reasoningEffort: "high", isByok: false })),
  startedAt, completedAt, ...rest,
});

// A run that started no model pass has no cost to report, and reporting one
// anyway would put "0 AI credits" under every refused capture.
assert.equal(runCost([], 1200), undefined);
assert.equal(runCost(undefined, 1200), undefined);

// Every paid pass counts. A review pays for its specialists and its adjudicator,
// and a --verify --revalidate run pays for two more that used to drop their
// charge before the outcome was assembled. The user's decision on 2026-09-12 was
// that all of them count.
{
  const cost = runCost([
    pass("safeguard-discovery", { charges: [2_000_000_000], startedAt: 1000, completedAt: 3000 }),
    pass("correctness", { charges: [10_000_000_000, 500_000_000], startedAt: 4000, completedAt: 24000 }),
    pass("contracts", { charges: [9_000_000_000], startedAt: 4000, completedAt: 19000 }),
    pass("adjudicator", { charges: [29_656_500_000], startedAt: 25000, completedAt: 40000 }),
    pass("revalidator", { charges: [3_000_000_000], startedAt: 41000, completedAt: 48000 }),
  ], 47000);
  assert.equal(cost.passes, 5);
  assert.equal(cost.requests, 6);
  assert.equal(cost.reportedRequests, 6);
  assert.equal(cost.credits, 54.1565);
  // Model time is summed per pass, so two reviewers that ran side by side
  // contribute both of their durations: 2 + 20 + 15 + 15 + 7 seconds.
  assert.equal(cost.modelMs, 59000);
  assert.equal(cost.timedPasses, 5);
  assert.equal(cost.elapsedMs, 47000);
  const line = formatCost(cost);
  assert.equal(line.split("\n").length, 1, "the cost report is one line beside coverage");
  assert.match(line, /^Review cost: 54\.1565 AI credits over 6 request\(s\)/);
  assert.match(line, /59\.0 s of model work in 5 pass\(es\)/);
  assert.match(line, /47\.0 s elapsed/);
}

// A reviewer its fallback recovered spent credits on the attempt that failed.
// The recovery does not refund them, and the record that carries the failed
// attempt has to carry its charge too or the total silently under-reports.
{
  const cost = runCost([
    pass("correctness", {
      charges: [7_000_000_000], startedAt: 9000, completedAt: 14000,
      fallbackFrom: {
        model: "other", reasoningEffort: "low", status: "incomplete",
        error: "Reviewer produced no usable output.",
        billing: [{ totalNanoAiu: 1_250_000_000 }],
        usage: [{ model: "other", reasoningEffort: "low", isByok: false }],
        startedAt: 5000, completedAt: 8000,
      },
    }),
  ], 10000);
  assert.equal(cost.passes, 2, "the failed attempt is a pass this run paid for");
  assert.equal(cost.requests, 2);
  assert.equal(cost.credits, 8.25);
  assert.equal(cost.modelMs, 8000);
  assert.match(formatCost(cost), /^Review cost: 8\.25 AI credits over 2 request\(s\)/);
}

// One request the runtime reported no charge for makes the whole total
// unavailable. A partial sum printed beside a coverage line reads as the bill,
// and the rule this project already applies to its own dogfood runs is that an
// unreported charge is unknown rather than zero.
{
  const cost = runCost([
    pass("correctness", { charges: [10_000_000_000], startedAt: 1000, completedAt: 6000 }),
    pass("contracts", { charges: [undefined], startedAt: 1000, completedAt: 5000 }),
  ], 6000);
  assert.equal(cost.requests, 2);
  assert.equal(cost.reportedRequests, 1);
  assert.equal(cost.credits, undefined);
  const line = formatCost(cost);
  assert.equal(line.split("\n").length, 1);
  assert.match(line, /^Review cost: unavailable/);
  assert.match(line, /1 of 2 request\(s\)/);
  assert.match(line, /unknown rather than zero/);
  assert(!line.includes("10"), "a partial total must not be printed as the cost");
  // The timings are still the runtime's own and are still reported.
  assert.match(line, /9\.0 s of model work in 2 pass\(es\)/);
  assert.match(line, /6\.0 s elapsed/);
}
// A negative charge is not a charge either.
assert.equal(runCost([pass("correctness", { charges: [-1] })], 10).credits, undefined);

// A pass that failed before it ever reached inference emitted no usage event, so
// it has no request to charge. Its turn never started, which is what makes that a
// provable zero rather than an unknown, and it must not poison the total the way
// a dropped charge does.
{
  const cost = runCost([
    pass("correctness", { charges: [4_000_000_000], startedAt: 1000, completedAt: 3000 }),
    pass("contracts", { status: "incomplete", error: "Reviewer session shut down before completion." }),
  ], 4000);
  assert.equal(cost.passes, 2);
  assert.equal(cost.requests, 1);
  assert.equal(cost.uncharged, 0);
  assert.equal(cost.credits, 4);
  assert.equal(cost.timedPasses, 1, "an untimed pass contributes no model time");
  assert.match(formatCost(cost), /^Review cost: 4 AI credits over 1 request\(s\); 2\.0 s of model work in 1 pass\(es\)/);
}

// The pass that looks identical to that one and is not: its turn started, so it
// reached inference, and the runtime then reported no usage event at all for it.
// Counting requests from the billing entries alone cannot tell the two apart and
// calls this one a zero-credit pass, which is the plausible number T1 exists to
// refuse. Reported on pull request #37 by the review of this increment.
{
  const cost = runCost([
    pass("correctness", { charges: [4_000_000_000], startedAt: 1000, completedAt: 3000 }),
    pass("contracts", { status: "incomplete", startedAt: 1000, completedAt: 5000 }),
  ], 6000);
  assert.equal(cost.requests, 1);
  assert.equal(cost.uncharged, 1, "a pass that ran and reported no charge is an unknown, not a zero");
  assert.equal(cost.credits, undefined);
  const line = formatCost(cost);
  assert.match(line, /^Review cost: unavailable, /);
  assert.match(line, /no charge at all for 1 pass\(es\) that ran/);
  assert.match(line, /unknown rather than zero/);
  assert(!line.includes("4 AI credits"), "the charges it did report are not the total");
}
// The same pass with both causes at once names both.
{
  const line = formatCost(runCost([
    pass("correctness", { charges: [4_000_000_000, undefined], startedAt: 1000, completedAt: 3000 }),
    pass("contracts", { status: "incomplete", startedAt: 1000, completedAt: 5000 }),
  ], 6000));
  assert.match(line, /a charge for 1 of 2 request\(s\)/);
  assert.match(line, /no charge at all for 1 pass\(es\) that ran/);
}
// A pass with no charge that never ran is still not a gap, even beside one that did.
assert.equal(runCost([
  pass("correctness", { charges: [4_000_000_000], startedAt: 1000, completedAt: 3000 }),
  pass("contracts", { status: "incomplete" }),
], 4000).credits, 4);
// A reviewer that reached inference and then failed still spent what it spent,
// and so does a cancelled one. Neither is refunded by its own incompleteness.
{
  const cost = runCost([
    pass("correctness", { status: "cancelled", charges: [6_500_000_000], startedAt: 1000, completedAt: 2500 }),
  ], 3000);
  assert.equal(cost.credits, 6.5);
  assert.match(formatCost(cost), /^Review cost: 6\.5 AI credits over 1 request\(s\)/);
}

// A run whose elapsed time was never measured says nothing about it rather than
// printing a zero that reads as an instant review.
{
  const line = formatCost(runCost([pass("correctness", { charges: [1_000_000_000] })], undefined));
  assert.match(line, /^Review cost: 1 AI credits over 1 request\(s\); 0\.0 s of model work in 0 pass\(es\)\.$/);
  assert(!line.includes("elapsed"));
}

// The cost line is not part of the coverage report, and must never become part
// of it: preview.mjs embeds formatCoverage in the body it publishes to GitHub,
// so a cost sentence written there would post what a review cost to a public
// pull request. This is the assertion that keeps the two apart.
{
  const outcome = {
    complete: true, coverage: "completed", mode: "deep", reviewers: [],
    validation: { complete: true, findings: [], rejected: [], duplicates: [], diagnostics: [] },
  };
  const coverage = formatCoverage(outcome);
  assert(!/Review cost/.test(coverage), "formatCoverage must not carry the cost line into the published body");
  assert(!/AI credits/.test(coverage));
  assert(!/elapsed/.test(coverage));
}

// Four stages start a model pass, and only two of them put their reviewers on
// the outcome: a total taken from the outcome alone silently under-reports every
// --verify and every --revalidate run, which is the defect this increment fixed.
// The revalidation pass has no end-to-end run in any suite, so what is checked
// here is the source shape rather than a run: every reviewAssignments call in
// review.mjs goes through the collector. A fifth stage added later without it
// would under-report the same way, and this is what says so.
{
  const source = readFileSync(new URL("../extensions/pr-review/review.mjs", import.meta.url), "utf8");
  const calls = source.split("reviewAssignments(").length - 1;
  assert.equal(calls, 4, "review.mjs starts four kinds of model pass");
  assert.equal(source.split("payFor(await reviewAssignments(").length - 1, calls,
    "every model pass review.mjs starts must be counted towards what the run cost");
}

console.log("PASS smoke-cost");
