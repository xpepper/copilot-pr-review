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
import { helpReference } from "./help.mjs";

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
  "--quiet prints the same review without the evidence JSON lines and without the reviewers' raw untrusted",
  "output. Coverage, refusals, failures, safeguard summaries and publication outcomes are never suppressed,",
  "so a quiet run cannot be mistaken for a clean one. Verbose is the default.",
  "A finished review reports what it cost beside its coverage: the credit total the runtime reported, the",
  "model time its passes spent and the time the run took, counting every pass it paid for. An unreported",
  "charge leaves the total unavailable rather than a partial sum, because it is unknown and not zero. A",
  "failed or cancelled run still reports what it spent, and --quiet does not suppress it. The figure is a",
  "report about a finished run: nothing here is a budget, and no elapsed time bounds anything.",
  "--unattended declares that a run leaves nothing for a person to answer, and is refused at parse time",
  "unless --all and one of --comment or --no-comment settle selection and publication in the invocation",
  "itself. It cannot be combined with --verify, because nothing but the approval question ever approves a",
  "safeguard command. It authorizes nothing and relaxes no gate.",
  "--revalidate buys one model pass over the earlier review's findings that this tool cannot settle for free.",
  "Every review reports the verdicts it can prove without spending: untouched lines mean still open, an anchor",
  "GitHub can no longer place or a file those commits deleted means obsolete. A proved verdict is never put to",
  "a model and never overturned by one, and a failed pass settles nothing rather than guessing. A settled",
  "verdict is answered on the earlier review's own thread, under the review's posting authority and never any",
  "other; a run that publishes no review has no proposal to confirm, so its replies ask for themselves. A",
  "thread already answered at this head is skipped rather than answered again.",
  "--incremental asks for fresh hunting to be confined to the commits added since an earlier review of the same",
  "pull request by this tool. It is a request, not a parse-time contract: a run that finds no forward commit",
  "range narrows nothing and says so. A confined run does not cover the whole pull request, and says that in",
  "the run and in the published body; the captured binding, the context windows and every citation rule are",
  "unchanged, and a candidate outside the range is set aside and reported rather than dropped.",
  "--long-context asks every model pass for its model's long-context window, at that window's own and possibly",
  "higher price. A model that lists none runs on its own window and says so; a model that lists one and does",
  "not keep it is refused. It is chosen for one run and saved nowhere.",
  "Every review hands the root instruction files the reviewed head commits to its whole-change reviewer, which may",
  "rely on a rule only by quoting its exact lines; --no-standards turns that off for one run.",
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
            await session.log(helpReference);
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
                quiet: options.quiet,
              }));
              const assignments = await reviewerAssignments(session, mode, options.settings, configuration,
                { longContext: options.longContext });
              await session.log(describeAssignments(mode, assignments, { quiet: options.quiet }));
              // A verification-enabled run states its own boundary before it
              // starts. An ordinary run's output is unchanged.
              if (options.verify) await session.log(verificationNotice);
              startRun((client, lifecycle) => executeRetainedReview(session, client, options, assignments, lifecycle,
                { autoPostReviews: configuration.autoPostReviews }), { quiet: options.quiet });
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
            const message = `Unsupported arguments. No review was started.\n\n${helpReference}`;
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

function startRun(execute, { ownsRuntime = true, quiet = false } = {}) {
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
    // O1: the retention dump belongs to the review that asked to be quiet.
    // Publish-later takes no flag of its own, so its evidence is never quiet.
    if (outcome.retention && !quiet) await session.log(`P2 evidence: ${JSON.stringify(outcome.retention)}`);
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
