import { CopilotClient, RuntimeConnection } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";
import { describeConfiguration, executeConfiguration, loadConfiguration } from "./config.mjs";
import {
  parseFixtureArgs, reasoningEfforts, subscriptionModels, validateAssignments,
} from "./fixture.mjs";
import { executeFixtureRun } from "./fixture-run.mjs";
import { executeTargetCapture } from "./target.mjs";
import { describeAssignments, parseReviewArgs, reviewerAssignments } from "./review.mjs";
import { reviewMode } from "./modes.mjs";
import { executeRetainedReview } from "./retained-run.mjs";
import { inspectRetained } from "./retention.mjs";
import { executePublishLater } from "./publish-later.mjs";
import { publicationSummary } from "./publication.mjs";
import { resolveCliPath } from "./cli-runtime.mjs";
import { verificationNotice } from "./checkout.mjs";

const help = [
  "Copilot PR Review - runtime feasibility prototype",
  "",
  "Usage: /pr-review [status|help|models|fixture model1=ID effort1=LEVEL model2=ID effort2=LEVEL]",
  "       /pr-review NUMBER [--balanced|--full|--deep|--quick|--major-only] [--comment|--no-comment] [--all]",
  "                         [--verify] [--include-drafts] [--include-closed|--review-closed]",
  "                         [heavyModel=ID] [heavyEffort=LEVEL]",
  "       /pr-review NUMBER --capture-only [--include-drafts] [--include-closed|--review-closed]",
  "",
  "status  Show the implemented capability boundary (default).",
  "help    Show this usage information.",
  "models  List available subscription models and supported reasoning efforts.",
  "fixture Run two reviewers of the bundled original fixture (uses Copilot credits).",
  "adversarial  Same settings; exercise forbidden tools and untrusted fixture text.",
  "failure      Same settings; inject a failure in the first active reviewer.",
  "cancel       Cancel active review work and stop its owned runtime.",
  "inspect      Show this session's latest retained result without inference or GitHub requests.",
  "publish      Explicitly publish this session's retained selected findings without rerunning reviewers.",
  "",
  "Configuration: /pr-review-config [show] | key=value ... | unset key ... | trust | untrust [PATH] | help.",
  "Saved tiers supply unset assignments; a trusted project's file overrides them; invocation flags win.",
  "Each tier may carry one optional fallback model, used for at most one extra attempt after a reviewer's",
  "own explicit failure. Reviews have no timeout, so elapsed time alone never triggers one.",
  "An untrusted repository's .copilot/pr-review/config.json is ignored; a repository cannot trust itself.",
  "",
  "NUMBER  Capture PR metadata and diff, bind source context to the captured head/base",
  "        revisions, then run the selected review mode. Reviews use Copilot credits.",
  "Drafts and obvious bots are skipped, as are provably empty changes.",
  "Closed/merged PRs require confirmation or an explicit closed-PR override.",
  "--balanced  Four heavy specialists (correctness, contracts, security, performance/resources)",
  "            plus one light overview reviewer. This is the default when no mode flag is given.",
  "--full      The balanced reviewers plus one medium conventions/maintainability reviewer.",
  "--deep      One integrated heavy reviewer over the whole pull request, instead of parallel",
  "            specialists. Holistic review, not a larger parallel one and not a higher effort.",
  "--quick / --major-only  Three heavy specialists on captured PR content.",
  "Mode flags are mutually exclusive.",
  "Balanced presents P0-P2 findings plus at most three P3/nit findings anchored on changed lines;",
  "full and deep present every substantiated severity with no minor cap; quick presents P0-P2 only.",
  "Withheld minor findings are reported, never silently dropped.",
  "--verify  Opt into the stricter preflight before any reviewer starts: the current branch must be the",
  "          PR's head branch, and no path may be untracked, in addition to the checks every review makes.",
  "          Once it passes, the root instruction files of this checkout are read and the safeguard commands",
  "          they declare are presented with the file each came from. You are then asked which of them may",
  "          run, and an approved command runs in this checkout, as you, before any reviewer starts. That",
  "          question is the only thing that approves one, and the answer does not outlive the run. No",
  "          reviewer receives a command or its output, so a safeguard grounds no finding and a failing one",
  "          leaves this review's own coverage alone; a passing preflight is still an ordinary review of the",
  "          selected mode. It is orthogonal to the mode and posting flags, cannot be combined with --capture-only,",
  "          and is not a configuration key: no saved or trusted-project setting can turn verification on.",
  "--capture-only  Capture and bind the target, then stop: no reviewers, no inference, no publication.",
  "Reviewers additionally read this checkout, so it must be the reviewed revision:",
  "local HEAD must equal the captured PR head, the PR head must not have moved, and no tracked",
  "file may be modified or staged. Otherwise the review is refused; run `gh pr checkout NUMBER` first.",
  "A --verify run adds the head branch and the untracked-path conditions to that same gate. No refusal is",
  "ever repaired automatically: nothing is switched, pulled, stashed or cleaned to satisfy any of them.",
  "Reviewers get view/grep/glob confined to the checkout; every other tool stays unavailable.",
  "Each reviewer resolves its mode's tier: heavy specialists, light overview, medium conventions,",
  "and deep's single integrated reviewer on the heavy tier.",
  "Unset tiers inherit the nearest configured tier, then the ambient model/effort. Only",
  "heavyModel=/heavyEffort= are invocation flags; set lightModel/lightEffort,",
  "mediumModel/mediumEffort and the optional <tier>FallbackModel/<tier>FallbackEffort",
  "with /pr-review-config. A fallback never inherits from another tier.",
  "Strict evidence checks and an isolated adjudication pass validate/deduplicate candidates.",
  "Select validated findings in the host UI, or use --all. Selection never authorizes posting.",
  "--comment authorizes the proposal; --no-comment suppresses posting. The flags conflict.",
  "Without either flag, the effective saved autoPostReviews applies; it defaults to false and then requires final confirmation.",
  "Authorized selections submit a code-built COMMENT review after fresh head/lifecycle/anchor checks.",
  "Draft/closed/merged PRs cannot receive the current inline payload. Uncertain writes are never retried.",
  "Results are retained only in the originating local session; a new review replaces the previous result.",
  "publish is a new explicit authorization; retained flags, configuration and confirmations authorize nothing.",
  "It refetches the reviewed evidence and reruns every gate, and refuses repeats of published or unresolved writes.",
  "Project safeguards are discovered under --verify, presented with their source, and run only if you approve them.",
  "Validation also uses Copilot credits; publish uses none.",
  "Other review flags are not supported yet.",
].join("\n");

const status = [
  "Copilot PR Review: entry point ready.",
  "The plugin extension joined this Copilot CLI session and handled /pr-review.",
  "",
  "Implemented: PR target capture with revision-bound source context, model capability",
  "listing, the quick, balanced, full and deep review modes, and a two-reviewer fixture prototype.",
  "The fixture requires explicit distinct models and reasoning efforts.",
  "F3 experiments: adversarial read-only probes, failure injection, and manual cancellation.",
  "Balanced is the default mode: four heavy specialists plus one light overview reviewer,",
  "presenting P0-P2 plus at most three P3/nit findings. --full adds a medium",
  "conventions/maintainability reviewer and presents every qualifying severity with no minor cap.",
  "--quick runs three heavy specialists and presents P0-P2 only. --deep replaces the",
  "specialists with one integrated heavy reviewer over the whole change, presenting every",
  "substantiated severity. --capture-only starts no reviewer. Every mode applies the same",
  "grounded validation and deduplication.",
  "Validated findings can be selected via the host UI or --all, then retained in this local session.",
  "Use /pr-review inspect after extension reload or a CLI-supported same-session resume.",
  "Current-run COMMENT publication is implemented with fresh gates and a durable write-ahead journal.",
  "Use /pr-review publish to publish the retained selection later, under a new explicit authorization.",
  "Personal light/medium/heavy tier configuration, optional per-tier fallback models and autoPostReviews",
  "are inspected and updated by /pr-review-config, which also grants and revokes explicit per-directory",
  "project trust. A configured fallback gives one explicitly failed reviewer one more attempt; the review",
  "is never restarted and elapsed time never triggers one. A tier, or a fallback, whose model supports no",
  "configurable reasoning effort takes none instead of inheriting one it cannot hold.",
  "Only an explicitly trusted directory's .copilot/pr-review/config.json overrides personal settings.",
  "",
  "Status/help start no models or background work. PR capture and source context use",
  "read-only gh requests against the captured revisions, never the local checkout.",
  "Reviewers may read the local checkout read-only, but only after it is proven to be",
  "exactly the reviewed head revision; otherwise the review refuses to start.",
  "--verify additionally requires the PR's head branch and no untracked path before any reviewer starts,",
  "then presents the safeguard commands this project's own instruction files declare, with their source,",
  "and asks which of them may run. An approved command runs in this checkout, as you, before any reviewer",
  "starts. Nothing else approves one, and no reviewer receives a command or what it printed.",
  "Only authorized selected findings can publish.",
  "Status is not a review result or a clean-review claim.",
].join("\n");

let activeRun;
let shuttingDown = false;
const session = await joinSession({
  commands: [
    {
      name: "pr-review",
      description: "Read-only balanced/full/deep/quick PR review, target capture, status, or fixture experiment",
      handler: async ({ args }) => {
        if (shuttingDown) throw new Error("Extension is shutting down.");
        switch (args.trim()) {
          case "cancel": {
            const run = activeRun;
            if (!run) {
              await session.log("No review is running.");
              return;
            }
            run.controller.abort(new DOMException("Manually cancelled; incomplete coverage.", "AbortError"));
            // Cancellation must work even when the runtime cannot acknowledge an abort RPC.
            if (!run.runtimeStopped) await run.client.forceStop();
            const outcome = await run.done;
            if (outcome.cleanupErrors.length) {
              throw new Error(`Cancellation cleanup was not clean: ${outcome.cleanupErrors.join("; ")}`);
            }
            await session.log(`${run.ownsRuntime ? "Review cancellation finished; owned runtime stopped."
              : "Publication cancellation finished; no reviewers were running."} ${publicationSummary(outcome.publication)}`);
            return;
          }
          case "":
          case "status":
            await session.log(status);
            return;
          case "help":
          case "--help":
            await session.log(help);
            return;
          case "models": {
            const { list } = await session.rpc.model.list();
            const models = subscriptionModels(list);
            if (!models.length) throw new Error("No Copilot-subscription models are available.");
            await session.log(models.map((model) =>
              `${model.id}: reasoning=${reasoningEfforts(model).join(",") || "(not configurable)"}`,
            ).join("\n"));
            return;
          }
          case "inspect":
            assertIdle();
            await inspectRetained(session);
            return;
          case "publish":
            // No target, session or authority argument: this session's retained
            // selection is the only publishable result.
            startRun((client, lifecycle) => executePublishLater(session, lifecycle), { ownsRuntime: false });
            return;
          default: {
            if (/^\d/.test(args.trim())) {
              const options = parseReviewArgs(args);
              // Capture-only stops at the bound snapshot: no mode, no reviewer,
              // no inference. Every other invocation runs its mode, which is
              // balanced unless a mode flag selects another one.
              if (options.captureOnly) {
                await executeTargetCapture(session, options.captureArgs);
                return;
              }
              assertIdle();
              // Saved and trusted-project settings are displayed before any reviewer
              // starts, and before the assignment is resolved, so a refusal explains
              // itself. An unusable effective assignment refuses the review instead
              // of substituting.
              const mode = reviewMode(options.mode);
              const configuration = await loadConfiguration(session);
              await session.log(describeConfiguration(configuration, {
                flags: options.settings, heading: "Effective PR review configuration for this invocation.",
              }));
              const assignments = await reviewerAssignments(session, mode, options.settings, configuration);
              await session.log(describeAssignments(mode, assignments));
              // A verification-enabled run states its own boundary before it
              // starts. An ordinary run's output is unchanged.
              if (options.verify) await session.log(verificationNotice);
              startRun((client, lifecycle) => executeRetainedReview(session, client, options, assignments, lifecycle,
                { autoPostReviews: configuration.autoPostReviews }));
              return;
            }
            const experiment = args.trim().split(/\s+/)[0];
            if (["fixture", "adversarial", "failure"].includes(experiment)) {
              const settings = parseFixtureArgs(args);
              assertIdle();
              validateAssignments(settings, (await session.rpc.model.list()).list);
              startRun((client, lifecycle) =>
                executeFixtureRun(session, client, settings, { ...lifecycle, experiment }));
              return;
            }
            const message = `Unsupported arguments. No review was started.\n\n${help}`;
            await session.log(message, { level: "error" });
            throw new Error(message);
          }
        }
      },
    },
    {
      name: "pr-review-config",
      description: "Inspect or update personal PR review settings, or trust a project's overrides",
      handler: async ({ args }) => {
        if (shuttingDown) throw new Error("Extension is shutting down.");
        // Configuration is refused while review or publication work holds the run
        // slot, and it starts no inference, GitHub request or review work itself.
        assertIdle();
        await executeConfiguration(session, args);
      },
    },
  ],
});

function assertIdle() {
  if (activeRun) throw new Error("A review is already running in this session.");
  if (shuttingDown) throw new Error("Extension is shutting down.");
}

function startRun(execute, { ownsRuntime = true } = {}) {
  assertIdle();
  // Publication owns no inference runtime; it must still hold the active-run
  // slot so a concurrent review cannot race it, and stay cancellable.
  const client = ownsRuntime ? new CopilotClient({
    connection: RuntimeConnection.forStdio({ path: resolveCliPath() }),
  }) : undefined;
  const controller = new AbortController();
  const run = { client, controller, ownsRuntime, runtimeStopped: !ownsRuntime };
  activeRun = run;
  const clearRun = () => {
    if (activeRun === run) activeRun = undefined;
  };
  run.done = execute(client, {
    controller, onStopped: (outcome) => { run.runtimeStopped = outcome.cleanupErrors.length === 0; },
  }).finally(clearRun);
  // Return dispatch so cancel remains available. Parent transport loss can prevent timeline delivery.
  void run.done.then(async (outcome) => {
    if (outcome.retention) await session.log(`P2 evidence: ${JSON.stringify(outcome.retention)}`);
    if (outcome.publishLater) await session.log(`P5 evidence: ${JSON.stringify(outcome.publishLater)}`);
  }).catch(async (error) => {
    console.error(`Review run failed: ${String(error)}`);
    try {
      await session.log(`Review/publication failed: ${String(error)}. No settled result is guaranteed; ` +
        "use /pr-review inspect to examine the retained state. Publication may be uncertain; do not retry blindly.", { level: "error" });
    } catch (logError) { console.error(`Could not report review/retention failure: ${String(logError)}`); }
  });
}

async function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (activeRun) {
      activeRun.controller.abort(new Error(`Extension shutdown: ${reason}; incomplete coverage.`));
      // The host allows only 5s before SIGKILL. Do not wait on reviewer or parent RPCs here.
      if (!activeRun.runtimeStopped) await activeRun.client.forceStop();
    }
    process.exitCode = 0;
  } catch (error) {
    console.error(`PR review shutdown failed: ${String(error)}`);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

process.once("SIGTERM", () => { void shutdown("SIGTERM"); });
process.once("SIGINT", () => { void shutdown("SIGINT"); });
process.stdin.once("end", () => { void shutdown("parent transport ended"); });
process.stdin.once("error", (error) => { void shutdown(`parent transport error: ${String(error)}`); });
