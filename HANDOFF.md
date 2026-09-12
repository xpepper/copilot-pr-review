# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed.

Every completed entry through `T1` is in
`docs/roadmap-archive-2026-09-10.md`, which you need only for an older
increment's evidence. The `--verify` guide is in `docs/safeguards.md`, the
re-review guide in `docs/re-review.md`, the previous README in
`docs/readme-archive-2026-09-10.md`, and the comparison against the field in
`docs/gap-analysis.md`.

## Your job this session is `X1`, and only `X1`

**`B1` is complete on pull request #39**, branch `b1-context-loss-coverage`.
Merging is the user's decision. **Confirm from `gh` that #39 is merged before
you start, and start `X1` from a fresh branch off `main`.** If it is not merged,
ask the user rather than branching off #39.

The backlog the user agreed on 2026-09-12 is `T1`, `B1`, `W1`, `N1`, `H1`, `K1`,
and the same day the user scheduled the long-context tier immediately after
`B1`. **On 2026-09-13 the user chose its ID, `X1`.** `T1` and `B1` are done.

**`X1`: a reviewer can run on a model's long-context window, so a large pull
request is reviewed without compaction.** It changes behaviour, so it needs its
own branch, its own pull request, and **one plugin review as its verification of
record**. That review spends real credits: **ask the user before you spend
them**, and ask again before requesting GitHub's own Copilot reviewer, which is
free but posts publicly.

### Two decisions come before any code, and both are the user's

1. **The `SCOPE.md` wording.** `X1` adds a setting the scope does not mention and
   can double a model's input cost. Put the exact sentence to the user and edit
   the file only after they approve it, as `T1` did.
2. **When the tier applies**: always on, configured per tier, or only when the
   bound input is large. Unsettled. **A size condition is a guess where `B1`'s
   event is a measurement**, which is why `B1` refused a threshold for its own
   signal; say so when you put the options.

Two further levers were recorded and not decided: the compaction threshold
itself, and the 40-line context windows being 57-80% of every large prompt.
Neither is `X1`. Mention them only if the user asks what else could help.

### What is known, and what is not

Read from the installed SDK and from a model listing that ran no inference, on
2026-09-12. **None of it has been demonstrated through this extension.**

- `createSession` and `setModel` accept `contextTier: "long_context"`, which pins
  the session to the model's long-context tier when it has one, at that tier's
  own prices.
- The runtime's model list on 2026-09-12:

| Model | Default prompt budget | Long-context budget | Input price, default then long |
| --- | --- | --- | --- |
| `gpt-5.6-terra` | 272k | 922k | 200 then 400 |
| `gpt-5.6-sol` | 272k | 922k | 400 then 800 |
| `gpt-5.6-luna` | 200k | 922k | 20 then 40 |
| `gpt-6-astra` | 272k | 872k | 1000 then 2000 |
| `claude-opus-5` | 200k | 936k | 500 then 500 |
| `claude-sonnet-5` | 200k | 936k | 200 then 200 |
| `kimi-k3` | 917k | none | 300 |

  Prices are AI credits per billing batch of input tokens as the runtime lists
  them. The fields were found by a key search over each model object after
  `client.start()` and `client.listModels()`, so **read the SDK types before
  relying on their exact paths.**
- **Not demonstrated**: that the runtime keeps the tier on our sessions (check it
  the way `prepareReviewer` checks model and effort, and refuse rather than
  silently run without it, as `SCOPE.md` refuses substitution), how a pinned
  session is actually billed, and how well models reason over 900k tokens.
- **A model with no long-context tier** (`kimi-k3` above) is a case the design
  has to answer, not skip.
- **`B1`'s gap stays as the backstop**, because a long-context window can fill
  too. Do not remove or weaken it.

### Acceptance criteria for `X1`, once both decisions are taken

- **Test first.** Script the tier in the test doubles, watch the suite fail for
  the right reason, then make it pass.
- The effective assignment display names the tier, the way it names model and
  effort, and `prepareReviewer` proves the runtime retained it or refuses.
- An explicit tier a model cannot hold is refused, never silently dropped.
- Whatever the user decides about when it applies, the run says which tier each
  pass used, on the evidence line and in a form a person reads.
- **`T1`'s cost line still counts every paid pass.** Route any new model pass
  through `payFor`; `scripts/smoke-cost.mjs` asserts it in source.
- `README.md` documents the setting and its cost. It has 5763 bytes spare.
- `ROADMAP.md`: **archive `B1`'s entry verbatim first**, then write `X1`'s, then
  update the closing section. The file has 1032 bytes spare.
- **One plugin review of `X1`'s pull request, after the user authorizes it.**
  That review will not exercise the long-context tier unless the configuration
  used for it selects one, and whether to pay for that is the user's call.

### What `B1` learned that bears on `X1`

- **Seven reviewer sessions in four of this project's own reviews compacted**:
  #3's four specialists at 912k characters of prompt, #24's deep reviewer at
  835k, #32's twice at 834k and 942k. Nothing at 616k or below. So on these
  models the boundary sits somewhere between 616k and 834k characters.
- **A compaction's own charge may be missing from `T1`'s cost line.** Each
  `session.compaction_complete` in the logs carries
  `compactionTokensUsed.copilotUsage.totalNanoAiu`, 9.2 and 11.6 credits on two
  real events. `assistant.usage` events are ephemeral and never persisted, so
  whether the runtime also emits one for the compaction call is unknown.
  **Recorded, not scheduled.** A live compaction would settle it, and that is a
  credit decision.
- **Upstream does not solve this with a larger window.** It embeds the diff below
  200000 bytes, switches to a manifest and host-planned reads above that, and
  refuses beyond 1 MiB. Read at 1.17.10 and 1.18.1; nothing was copied, and
  `L1`'s rule binds `X1` as it bound `B1`.

## How to work with this user on a decision

**Before asking the user to choose, explain any runtime concept in plain terms,
walked through a real run from this project, and give worked examples of real
cases where the options actually behave differently.** Then one decision per
message: what is at stake, the recommendation and why, the alternatives, ranked
by effort, cheapest viable first. A planning session's well-formed question was
rejected twice for skipping that.

## What `B1` did, so you can recognise it

`runReviewer` in `fixture.mjs` records `session.compaction_start`,
`session.compaction_complete` and `session.truncation` as `contextLoss` on the
pass's evidence. `contextLossGap` in `coverage.mjs` turns a reviewer's or the
adjudicator's events into one `coverage-gap`, added in `collectCandidates` and
`adjudicateCandidates` so it reaches `validation.diagnostics` and decides
completeness. Decisions taken inside the design, not to be reopened:

- `session.context_cleared` is left out: only a host calling `clearContext` emits
  it, and this tool never does.
- A fallback's replaced primary keeps `contextLoss` in `fallbackFrom` and adds no
  gap, because the review rests on the fallback's output.
- The retained record keeps the rendered gap and not the structured events,
  exactly as `T1` left `billing` out. #39's review raised that as a candidate and
  it was rejected with that reason.
- The gap has no "Blocked assessment" clause, so `presentationDiagnostics` never
  merges two passes' gaps.
- The discovery and revalidation passes record `contextLoss` and add no gap.
  Recorded as a follow-up, not scheduled.

## What GitHub's own reviewer said on #39

Requested at the user's authorization. On `b5831c4` it left two comments in its
review body and no inline thread. **Both were checked against the code and the
logs, and both are rejected**, with the reasons in `ROADMAP.md`:

- A replaced primary's `contextLoss` is dropped by `retainedRecord`. True, and
  the same point #39's plugin review raised. Rejected for the same reason: the
  retained record carries the rendered gap, not structured evidence, as with
  `billing`. **Two reviewers have now raised it.** If the user wants the
  structured events retained, that is a small follow-up for them to schedule,
  not something to fold into `X1`.
- `tokensBefore` takes `preCompactionTokens` over the start event's
  `currentTokens`, which the SDK's comments describe as different measures. In
  all seven compactions on disk the two are equal, and `currentTokens` is exactly
  system plus conversation plus tool-definition tokens. Both are the whole
  context, and before and after come from one event.

CodeRabbit is also installed on this repository. On #39 it posted only a
rate-limit notice.

## What is scheduled after `X1`, so you can recognise scope creep

Do not start any of these: `W1` a remediation sentence on every finding, `N1` a
seeded corpus and deterministic scorer, `H1` opt-in project standards steering
the review, `K1` a feedback channel on a published review. `ROADMAP.md` carries
the acceptance criteria for each. `W1` takes no committable suggestion block.
`N1` takes neither the collection runs that spend credits nor a baseline gate.

**Six of `G1`'s twelve were declined** and are in `ROADMAP.md` under "Recorded,
not scheduled" with the reason. Declined is not deferred, and
`docs/gap-analysis.md` is not an authorization.

## Headroom

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and **CI fails the build if any root file crosses the cap.**

- **`ROADMAP.md` has 1032 bytes spare.** Archive `B1`'s entry verbatim into
  `docs/roadmap-archive-2026-09-10.md` before you write a word of `X1`'s, with the
  same pointers the earlier moves left in both files. An archived entry keeps its
  own heading; nothing is rewritten or condensed.
- **`README.md` has 5763 bytes spare.**
- `HANDOFF.md` is a root file too.
- Measure with `wc -c` and run the collector check below before opening a pull
  request. **A scripted edit should refuse unless every old string matches
  exactly once**; `B1`'s first attempt went 202 bytes over the cap and the check
  caught it before a commit.

## Validation and runtime caveats

The **seventeen** controlled suites need no inference and no network, and all
seventeen pass at this handoff:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost; do node scripts/smoke-$s.mjs; done
```

If you add an eighteenth, add it to `.github/workflows/ci.yml` and to this loop.
GitHub Actions runs the same loop on every pull request and every push to
`main`, with two invariants this repository has broken before: that the tool can
still read its own instruction files, and that no tracked text carries a control
byte. It is not a substitute for running the suites locally before a checkpoint
commit, and it runs nothing that spends Copilot credits. A red run is a real
failure; do not rerun it hoping for green.

This cheap check runs the real discovery collector against this checkout:

```sh
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

**It should read all six root files and skip none.**

**The shell is zsh.** `PIPESTATUS` does not exist there, a bare `=====` word is
expanded as a command lookup, and **a Bash call beginning `cd /tmp && ...`
narrowed the sandbox during `G1`**. Stay in the working directory and use the
scratchpad by absolute path.

**While a plugin review is running, edit nothing in the checkout.** The reviewer
reads it. Draft in the scratchpad and apply afterwards.

**Reinstall the plugin before every review, and verify it.** Check out first,
then install:

```sh
copilot plugin install "$(pwd)"
diff -rq ~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review \
  extensions/pr-review   # expect no output
copilot plugin list
```

CLI 1.0.83 warns that direct local installs are deprecated for a future release.

**Dispatch the review through the SDK** when you cannot type a Copilot slash
command, exporting both paths in the same shell call:

```sh
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
node scripts/dogfood-review.mjs NUMBER --deep --all --no-comment --unattended > LOG 2>&1
```

It requires `--all` and `--unattended`, refuses `--comment` and `--quiet`, and
asserts a clean tree at the pull request head. **Run it as a background process
and never add a timeout.** `copilot -p "/pr-review N"` is not a substitute.

**Read the evidence from the log narrowly.** The run prints several `evidence:`
lines; the review's own is the one prefixed by the mode, `M2 evidence:` for deep,
and the last one, `P2 evidence:`, carries none of the passes. Per-pass tool calls
and denials are under `reviewers[].policy`, and `contextLoss` is on each pass.

**GitHub's own Copilot reviewer** needs GraphQL, because `gh pr edit
--add-reviewer copilot` fails with "Could not resolve user". It posts publicly,
so it is the user's call. A successful request leaves `reviewRequests` empty;
the timeline shows it as `review_requested` for `Copilot`.

```sh
PR_ID=$(gh api graphql -f query='query { repository(owner:"xpepper",name:"copilot-pr-review"){ pullRequest(number:NN){ id } } }' --jq '.data.repository.pullRequest.id')
gh api graphql -f query='mutation($pr: ID!, $bot: ID!) { requestReviews(input: { pullRequestId: $pr, botIds: [$bot], union: true }) { clientMutationId } }' -f pr="$PR_ID" -f bot="BOT_kgDOCnlnWA"
```

Check the premise of anything it leaves before implementing it.

**Claude is also installed on this repository**, since 2026-09-13. A
`claude-review` check appeared on #39's pushes after that, and mentioning
`@claude[agent]` in a pull request comment asks it for another point of view on
a review; the user offered it for exactly that. A mention is a public comment,
so say you are about to use it, and check the premise of anything it leaves as
you would GitHub's reviewer.

`node scripts/smoke-runtime.mjs --targets` **has not been run since `I1b`**, where
it passed with 75 assertions; 81 is expected and unverified. It spends no
credits but needs a live runtime connection. **Do not run it while a review is
in flight.** `X1` may well need a live probe of whether a session keeps its tier;
that is a runtime connection and possibly inference, so say which before running
it.

`scripts/smoke-reviewer-tools.mjs` must be run and reported for any increment
touching `read-only.mjs`. `X1` should not touch it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. The user's file sets `gpt-5.6-terra` high for
heavy, `gpt-5.6-luna` high for light and `claude-sonnet-5` medium for medium.
Move it aside only if running that probe, restore it afterwards, and verify with
`shasum -a 256`.

**Press Space on the option before pressing Enter** in any `--verify` run, in
finding selection, and in the reply confirmation.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review.

**Never add a timeout, deadline or stuck-reviewer heuristic.** `SCOPE.md` forbids
review timeouts, and `C3`, `C5`, the watch exclusion and `V2a`'s cancellation all
depend on their absence. **A compaction event is a report about what happened to
a pass, never a trigger to stop, retry or replace it.**

**Do not weaken the shell gate.** **Do not revert to `fs.realpathSync` anywhere in
`read-only.mjs`**, and do not replace the `lstat` check in `absentInsideRoot`.
**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned. **Do not revisit Agent Factories without a new CLI version.**

Cold resume of command-only records remains unsupported. Citations remain
limited to the captured diff and context windows, which is why #39's one
candidate was refused: it cited a file the diff does not change.

## Settled decisions, none of which is to be reopened

- **`B1` is closed**, with the decisions listed above: runtime events measured by
  code, a coverage gap and not a failure, the honesty half only, reviewers and
  the adjudicator only.
- **`X1` is the ID**, chosen by the user on 2026-09-13. Fetching the diff through
  `gh` or `git`, a DuckDB store, and turning compaction off were each declined
  during `B1`'s planning, for the reasons in `ROADMAP.md`.
- **The triage of 2026-09-12 is settled.** Do not re-triage, re-rank or re-argue
  it, and do not promote a declined item because the document ranks it highly.
- **`T1` is closed.** Both elapsed figures, every paid pass counted, an
  unreported charge left unavailable rather than summed, the line kept out of the
  published body and out of `--quiet`'s reach.
- **`I1c`'s six decisions stand**, as recorded in its archived entry.
- **Code proves that a finding still stands and never that it has gone away.**
- **An unknown write outcome stops the reply set.** A definite rejection does
  not. Do not add a retry.
- **A reply must never come back as a finding or as a review this tool wrote.**
- **`/pr-review publish` answers no thread**, deliberately.
- **`I1b` is opt-in and stays opt-in**, and a confined run's confinement is a
  caveat, never a coverage gap.
- **`I1a`'s slicing is settled and is not to be re-cut.**
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present, so `B1`'s gap wording broke no prior-review
  discovery.
- **`U1` is closed and its shape is not to be widened.** Posting authority still
  never authorizes safeguard execution.
- **`L1` is closed**, and it binds every adopted item: re-implement from
  behaviour, never copy.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s two remaining items are recorded limitations**: truncated evidence
  lines and silent per-reviewer progress.

## State at this handoff

**`main` is at `6ddd11d`** unless #39 has since been merged. **#39 carries `B1`**:
the feature and README commits the plugin reviewed at `b5831c4`, then the
roadmap commits and this handoff, all pushed. CI passed on `b5831c4`; confirm it
on the current head.

**Credits spent this session: 31.73861**, on the one authorized deep review of
#39. No finding was posted by this tool, and nothing was replied to on GitHub.
Nothing is uncommitted.

**Neither `I1b` nor `I1c` has live evidence, and both are blocked on the same
thing**: a pull request this tool has published a review on and that has since
moved. Arranging one is the user's call, and **playground #1 and #2 must never be
merged.**

If you land anything: follow `AGENTS.md`, with meaningful validated checkpoint
commits, a named branch and pull request, no direct `main` push, and no
force-push or amended published history. Keep findings local. Update `README.md`
for user-visible behaviour, and check its headroom before you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
