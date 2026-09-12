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
  "                         [--verify] [--quiet] [--unattended] [--incremental] [--revalidate]",
  "                         [--include-drafts] [--include-closed|--review-closed]",
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
  "--quiet   Print less of the same review: the evidence JSON lines (the target, the context, the mode's",
  "          binding, the settled run, the selection) and each reviewer's raw untrusted output, including",
  "          the adjudicator's, are left out. Everything that decides whether the result can be trusted",
  "          stays at every verbosity: the effective assignments, per-reviewer progress, every refusal and",
  "          failure, the coverage report and its diagnostics, the safeguard discovery, approval and",
  "          execution summaries, the findings, and every publication outcome including an uncertain write.",
  "          Verbose is the default and a run without the flag prints exactly what it printed before. The",
  "          flag changes presentation only: the same review settles the same way and the retained record",
  "          still holds every reviewer's own output. It authorizes nothing, opens no gate, and is not a",
  "          configuration key, so no saved or trusted-project setting can quieten a run. It cannot be",
  "          combined with --capture-only, whose entire output is the evidence it would suppress.",
  "--unattended  Declare that this run leaves no question for anybody to answer, for a headless environment,",
  "          a CI pipeline or an autonomous loop. It is checked before the target is captured and before any",
  "          credit is spent, and it refuses rather than proceeds: a run without --all is refused, because",
  "          finding selection is a question and --all is the only thing that settles it without a person;",
  "          a run without --comment or --no-comment is refused, so what this run may publish is visible in",
  "          the invocation rather than in a saved setting; and a run with --verify is refused, because a",
  "          safeguard command is approved by the question an unattended run cannot ask and by nothing else.",
  "          A closed or merged PR is not confirmed either, so it stops at capture unless --include-closed or",
  "          --review-closed was given. The flag authorizes nothing and opens no gate: --all still authorizes",
  "          no posting, every publication gate still runs, and it is not a configuration key, so no saved or",
  "          trusted-project setting can turn it on. It cannot be combined with --capture-only.",
  "--revalidate  Judge what became of the findings an earlier review of this pull request published, where",
  "          this tool cannot prove it for free. Every review already reports the verdicts it can prove: a",
  "          comment on lines the newer commits never touched is still open, and one GitHub can no longer",
  "          place, or whose file those commits deleted, is obsolete. What none of that settles needs the",
  "          current code read, so this flag buys one model pass over exactly those findings and nothing",
  "          else. It reports no new finding, is never asked about a verdict the code proved, and can never",
  "          overturn one. A pass that fails settles nothing and loses nothing. A settled verdict is posted",
  "          as a reply on the thread the earlier review left, under the same posting authority as the review",
  "          itself: --no-comment suppresses both, a confirmed proposal covers both, and a declined one refuses",
  "          both. A run that publishes no review has no proposal to confirm, so its replies ask for",
  "          themselves. A thread already carrying",
  "          this run's answer at this head is skipped rather than answered twice. It cannot be combined with",
  "          --capture-only.",
  "--incremental  Ask for fresh hunting to be confined to the commits added since an earlier review of this",
  "          pull request by this tool, so a re-review stops reporting hunks that review already covered.",
  "          It is a request rather than a parse-time contract, and the only flag that is: whether a forward",
  "          commit range exists at all is a fact about the pull request. When capture reports the relationship",
  "          as incremental, those commits' head-side line ranges become the confined scope; on any other",
  "          relationship, when the range cannot be read, or when those commits change no file, the run",
  "          narrows nothing and says which of those it was. Confinement is a filter over the captured",
  "          base-to-head binding and never a replacement for it: the captured diff, the context windows, the",
  "          provenance checks and every citation rule are exactly what an unconfined run uses. A candidate",
  "          anchored outside the range is set aside as already covered, reported with its location rather",
  "          than dropped, and never adjudicated, so it is neither a validated finding nor a refuted one; a",
  "          base-side anchor cannot be placed in the range, so one in a file those commits did touch stays",
  "          in scope. A confined review does not cover the whole pull request, and says so in the run and in",
  "          the published review body: what it did not hunt was covered by the earlier review, whose own",
  "          coverage this run does not read and does not vouch for. That is why it is opt-in rather than the",
  "          default. It authorizes nothing, opens no gate, and is not a configuration key, so no saved or",
  "          trusted-project setting can confine a run. It cannot be combined with --capture-only.",
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
  "A host with no UI at all reports unavailable for each decision the invocation did not settle, so --all",
  "--comment still publishes there, while safeguard approval stays unavailable whatever the posting flags",
  "say. --unattended refuses a run that left any of them unsettled, up front, before it costs anything.",
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
  "--quiet prints the same review without the evidence JSON lines and without the reviewers' raw untrusted",
  "output. Coverage, refusals, failures, safeguard summaries and publication outcomes are never suppressed,",
  "so a quiet run cannot be mistaken for a clean one. Verbose is the default.",
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
