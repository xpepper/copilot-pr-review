# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect the working tree,
recent commits, open pull requests and the implementation before editing
anything. `SCOPE.md` is the authoritative product specification; `ROADMAP.md`
records demonstrated evidence, runtime caveats and the exact next step.
Do not rely on previous conversations or reopen settled product decisions.

## How work lands here

Every increment lands on a branch and a pull request. `main` carries repository
ruleset `22479389`, which requires a pull request with zero approving reviews
and grants no bypass, so direct pushes to `main` are refused for admins and
agents alike. If you find yourself committing on `main`, move the commits to a
branch before pushing.

The increment's pull request is then reviewed **with this plugin**, and that
review is the increment's real integration test. The controlled suites run
against test doubles and prove logic only. The pull-request review runs the
installed plugin with the real Copilot runtime, real models, real `gh` requests,
the real revision gate against a real checkout, and real confined read tools. An
increment that changes anything under `extensions/` or `scripts/` is not
demonstrated until that review has run once and its evidence is in `ROADMAP.md`.
Read "Land every increment on a reviewed pull request" in `AGENTS.md` in full
before you start.

## Recorded state

- **You are starting on a clean `main` with no increment in flight.** `main` is
  the squash merge of pull request #11, which completed `C4`. Nothing should be
  uncommitted and no increment branch should be open. Branch from `main`.
- Pull requests #3, #4 and #5 delivered `M1`, #6 delivered `F5`, #7 delivered
  `F6`, #8 delivered `M2`, #10 delivered `C3`, #11 delivered `C4`. Read
  `git log` and the pull requests rather than looking for hashes from them:
  merged ones are squashed, so their individual commits are not ancestors of
  `main`.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- `M1`, `F5`, `F6`, `M2`, `C3` and `C4` are Completed. **`Q5` is the next
  increment**, chosen by the user on 2026-09-08 over `C5`, which stays open and
  still needs their go-ahead. `Q6` follows `Q5`. `L1` stays pending.
- Eight live reviews of this repository's own pull requests exist: #3 and #4
  balanced, #5 full, #6 balanced, #7 full, #8 deep, #10 balanced, #11 full. All
  eight are spent. **Any review you run needs its own authorization; none of
  these carry over.**

## What `C4` settled, so you do not redo it

A tier whose resolved model advertises no configurable reasoning effort resolves
to **no** effort instead of inheriting one, so a model like `claude-haiku-4.5`
can serve a tier. Read "Completed increment: C4" in `ROADMAP.md` before you touch
`config.mjs` or `fixture.mjs`.

- **Only an effort chosen somewhere else is replaced.** An effort set for this
  tier itself, by an invocation flag, by personal settings or by a trusted
  project's file, stays and is validated, so it is refused rather than dropped,
  substituted or lowered. `chosenForThisTier` in `config.mjs` is that list, and
  it is a positive list of the three explicit origins on purpose.
- **A model that does advertise efforts is untouched.** An inherited effort such
  a model cannot support still refuses the review. Nothing about nearest-tier
  inheritance, the heavier-tier tie-break or flag precedence changed.
- **A model the catalog does not offer drops nothing.** That case is refused on
  the model itself, so no conclusion is drawn about its effort.
- The origin `model` renders as `reasoning=(not configurable) [model]` and is
  reported **whenever the model is the reason**, including when no layer offered
  an effort to drop. The first attempt returned early in that case, and pull
  request #11's review caught it; do not reintroduce that early return.
- `C3`'s fallback surface carries the same rule, because an unset
  `<tier>FallbackEffort` follows the tier's own effort and that is an inherited
  origin like any other.
- **The model catalog is a required argument** of `resolveTier` and
  `resolveFallback`. Do not give it a default: without it a caller would silently
  get the old behaviour, and a tier would run at a different effort than the one
  displayed.
- **No configuration key was added**, and none is needed. There is still no way
  to say "this tier takes no effort" for a model that *does* support efforts;
  nobody has asked for one, and the `gpt-5.6` family exposes `none` as a value.
- The installed runtime represents "no configurable effort" by **omitting**
  `reasoning_effort` from `capabilities.supports`, and a session created on such a
  model reports no `reasoningEffort` at all. Both are asserted in
  `smoke-config-runtime.mjs`. Do not add a second notion of the catalog beside
  `reasoningEfforts` on the strength of a hypothetical malformed entry; pull
  request #11's rejected P2 argued for exactly that.

## What `C3` settled, which still stands

A tier may carry `<tier>FallbackModel` and `<tier>FallbackEffort`, and that pair
buys **one extra attempt, for the one reviewer whose own execution failed**.

- **Elapsed time never triggers a fallback**, because nothing imposes a deadline.
  Never add a timer, a deadline, a heartbeat or a "stuck reviewer" heuristic.
  `SCOPE.md` forbids it and the design depends on it.
- **Fallbacks never inherit across tiers**, unlike a tier's own model and effort.
  Only the fallback effort falls back, to the tier's own effective effort.
- Only that reviewer's own execution failure is eligible. Cancellation is not,
  and neither is an unusable explicit assignment, which still refuses the review
  before anything starts.
- A recovered reviewer keeps the failed attempt in `fallbackFrom` and reports it
  as a coverage caveat. Never reduce a record to the attempt that succeeded.

## What pull request #11's review found, so you inherit it

The full review cost 269.135657 credits, ran six reviewers across three model
families plus the adjudicator, and reported **incomplete** coverage on three
execution failures. Four things in it matter to you.

- **The one real defect was discarded by the evidence boundary**, for the fourth
  time on this project and the second time in a row on the overview reviewer's
  finding. Its quote was right except for two leading spaces, which is `Q6`. It
  was recovered by reading the raw timeline, not from the review's own output.
  Save the verbatim reviewer output before you analyse anything; that is now
  twice that this step was the only way a true finding survived.
- **A reviewer settled `completed` having emitted no envelope at all.**
  `correctness` returned one sentence of thinking-style prose. This is the `C5`
  case, not an `F6` unwrap failure: there was no envelope to unwrap, so it is not
  evidence against the marker contract.
- **A reviewer failed in exactly the way a `C3` fallback covers.** `contracts`
  settled `incomplete` with no usable output. No fallback was configured, so none
  was attempted. `C3`'s standing limitation is now "would have fired here"
  rather than "never observed".
- **The read denials landed on the two reviewers that then failed, again**, and
  this run shows the mechanism: `insideRoot` in `read-only.mjs` resolves a
  requested path with `realpathSync` and rejects anything that throws, so a path
  that simply **does not exist** is refused exactly like one outside the reviewed
  checkout. Both denied reviewers had asked for a path that does not exist. It is
  recorded in `ROADMAP.md` as an open observation, not an increment. It moves a
  confinement boundary, so it needs its own increment and its own review, and the
  safe direction is that an absent path stays refused with an accurate reason.

## The next increment: `Q5`

**Implement `Q5`, and only `Q5`, unless the user says otherwise.**
`ROADMAP.md`'s "Exact next increment" section states it in full, with the table
of every true finding the evidence boundary has discarded and which refusal did
it. Read that table before you touch `findings.mjs`.

A candidate anchored on a changed line must be able to cite the code that change
breaks, including unchanged code and code in another hunk. Today
`candidate()` requires one hunk to contain the location **and** both introduction
citations, so the common shape "this changed line breaks that other code" cannot
be expressed at all. That single rule has discarded three true findings, on pull
requests #4, #5 and #10, including the best finding in #10's review.

**Do not call this "the anchoring rule" and fix both gates at once.** Two
different refusals in `findings.mjs` have each discarded a true finding, and only
the first is `Q5`:

- `Q5`: "Introduction citations and location must identify the same changed
  hunk", which cost #4, #5 and #10.
- `Q6`: "Citation does not exactly match a supplied context window", which cost
  #11, where the quote was right except for two leading spaces on its first line.
  **`Q6` has real counter-evidence**: on #4 that same check stopped a
  0.99-confidence fabrication whose claimed defect was itself about a space the
  reviewer had invented in its own quote. Keep exact matching as the acceptance
  path; report or repair a near-miss from the cited line range rather than
  relaxing the comparison. Do not fold `Q6` into `Q5`.

The acceptance criterion for `Q5`: a candidate anchored on a changed line can
cite the code that change breaks and reach adjudication, while every refusal that
stops an unbound, out-of-window or fabricated citation still fires unchanged.
Reconstruct the three recorded rejections as controlled fixtures rather than
trusting a prose description of them. A candidate envelope change touches the
reviewer prompt, the adjudicator instructions, `findings.mjs` and
`retention.mjs` together; **ask the user before changing the retained record's
schema version**, which tracks publication authority rather than candidate shape.

`C5` remains open and still needs the user's explicit go-ahead. A reviewer whose
output the evidence boundary cannot parse settles as `completed`, so it never
becomes eligible for its tier's one fallback attempt, while a reviewer that
returns nothing does. Five of this project's eight live reviews were incomplete
for exactly that reason. Do not start it, and do not fold any part of it into
`Q5`.

Keep the evidence boundary exactly as it is, keep `L1` pending, copy no upstream
source, and update `README.md` if the change is user-visible.

## Running the real integration test

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --all --no-comment
```

Name the mode deliberately. Without a mode flag the runner takes the default,
balanced. Say in `ROADMAP.md` which mode you used and why. `C3` used `--balanced`
because it changed no mode and balanced is the default topology. `M2` used
`--deep` because deep was the mode it added and is the cheapest topology. `C4`
used `--full` because it changed the shared tier-resolution seam and full is the
only mode that resolves all three tiers.

Derive the SDK path instead of pinning a version. Old packages under
`~/.copilot/pkg/` are never pruned, so a pinned path keeps resolving after a
`copilot update` and silently drives a stale SDK against a newer CLI.
`copilot --version` is the only reliable source of the running version: on the
development host `command -v copilot` resolves into a Homebrew cask directory
labelled `1.0.48` while the CLI reports `1.0.83`.

Check out before installing, never the other way round. `copilot plugin
install` copies the working tree into the plugin cache, so installing first
installs whatever was checked out at the time. The revision gate only checks
that the *checkout* is at the pull request head, so a stale installed copy
would still be reviewed and reported as a passing integration test.

`scripts/dogfood-review.mjs` dispatches the real `/pr-review` command through
the SDK's command RPC, for agents that cannot type a Copilot CLI slash command.
It refuses to run unless local `HEAD` is the pull request head with a clean
tree, refuses `--comment`, prints the whole plugin timeline, and reports the
settled outcome with the runtime's credit figure. `copilot -p "/pr-review N"` is
not a substitute: prompt mode starts an ambient model turn instead of
dispatching the command. The run takes tens of minutes; do not treat a quiet
timeline as a hang. #11's full run took roughly forty minutes.

Do not modify the working tree while a review is running: the reviewer is
reading that checkout live.

Record from that run: the mode, the model and effort each reviewer actually
used, coverage, findings, withheld findings, coverage gaps, tool calls and
denials, and the reported credits. The per-reviewer `policy.toolCalls`,
`policy.reads`, `policy.permissionDenials` and `policy.toolDenials` fields in the
evidence record carry the read evidence, and `billing` carries the charge; the
per-reviewer figures sum to the reported total, so check that they do.
**Save the reviewers' verbatim output from the timeline before you analyse
anything.** `F6`'s diagnosis, `M2`'s marker evidence, `C3`'s and `C4`'s all came
from those strings, and on #10 and #11 the timeline was the only place the
review's one true finding survived. Fix real findings on the same branch and say
which you rejected and why. A refusal or failure is a defect report about the
tool; never weaken a gate to make the run pass.

## Runtime and validation caveats

- Consult the installed SDK and current official documentation before adopting
  runtime APIs. Installed SDK:
  `~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`, CLI `1.0.83`. Demonstrate
  capabilities; declarations and plugin format support alone are not proof.
- Reinstall with `copilot plugin install "$(pwd)"` after every extension change,
  before running any installed-runtime probe or the integration test.
- Controlled suites (no inference/network): `node scripts/smoke-<name>.mjs` for
  `findings`, `review`, `selection`, `retention`, `preview`, `publication`,
  `publish-later`, `checkout`, `config`, `context`, `fixture`, `target`. All
  twelve passed on pull request #11, as did `git diff --check`. Re-run them
  before you start: they need no network and no inference.
- Installed probes require both `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`, set
  the same derived way as the integration test above rather than pinned to a
  version. No-inference probes: `smoke-runtime.mjs --targets --startup` and
  `smoke-config-runtime.mjs` were both rerun on pull request #11 and passed,
  twice each, once before the review and once after its finding was fixed.
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs` and `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5` were last
  rerun on pull request #5; `F6`, `M2`, `C3` and `C4` changed nothing they
  exercise.
- **`smoke-config-runtime.mjs` does not refuse when a personal
  `<copilot-config-home>/pr-review/config.json` exists.** It fails its first
  assertion, which expects `not created yet`. Move the file aside, run the probe,
  move it back, and verify the restore with `shasum -a 256`; a shell that dies
  mid-script can leave it moved away. On this host the digest is
  `30794150a3db740f7dcf6f9d7a5a827d3729c5599f7456f582af735d3f297ea9`, mode `0600`.
  The probe needs two things from the subscription: a second usable model that is
  not the ambient one and advertises a configurable effort, which `C3` added, and
  since `C4` a model that advertises **no** configurable effort. Today
  `claude-haiku-4.5` is the only model in this subscription that does.
- `scripts/smoke-factory.mjs` is `F5`'s probe. Without `--spend` it starts no
  subagent and spends nothing, and it is a useful no-inference regression on the
  factory surface if you ever need to check whether the gate has lifted. With
  `--spend` it costs credits and needs explicit authorization.
- Reviewing costs real credits and scales with the diff and the reviewer count:
  269.135657 for six full reviewers on a 10-file, 563-addition pull request,
  233.19659 for five balanced reviewers on a 12-file, 984-addition one,
  68.27393 for one deep reviewer on a 12-file, 385-addition one, 79.238565 for
  five balanced reviewers on a 3-file, 848-addition one, 124.2079 for six full
  reviewers on a 4-file one, 276.266849 for six full reviewers on a 13-file one,
  414.14627 for five balanced reviewers on a 27-file one, and 27.89 for three
  quick reviewers on a small one. Report the runtime's figure; never estimate it.
- Inference authorization does not accumulate. The workflow authorizes the one
  review of your increment's pull request. `smoke-factory.mjs --spend`, the
  recorded R1 live command, harness `--quick` paths, `--read-live`, fixture
  inference and any publication each still need a fresh explicit instruction in
  your own session.
- Do not revisit the Agent Factories surface without new information from GitHub.
  `F5` demonstrated three independent blockers on CLI 1.0.83 and all three would
  have to change. A new CLI version is new information; a fresh reading of the
  same documentation is not.
- Do not reintroduce substring matching in the `F6` marker unwrap and do not
  widen it. It now has live evidence from four runs: five of six reviewers on #7,
  both sessions on #8, all six sessions on #10, and on #11 every session that
  produced an envelope at all, including `claude-sonnet-5` after paragraphs of
  prose. #11's one unparsed output contained no envelope of any kind, so it is
  not evidence against the unwrap.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.
- Older observations are listed in `ROADMAP.md` with their current status. The
  oldest is still the largest and still open: **no review of any mode has ever run
  against a substantial code diff**, and pull request #10 is still the closest at
  984 additions over 12 files. The four discarded true findings are now `Q5` and
  `Q6`. Read denials have landed on the failing reviewers on two of eight
  reviews, with the mechanism identified above, and that one is still an
  observation rather than an increment. A reviewer settling `completed` having
  produced no envelope at all is the `C5` case.
- Two sessions once worked on the same branch at the same time, and the second
  wrote a handoff from a stale premise. If that happens again, rebase rather
  than force-push, and say so in your report.

## Commit, pull-request and final-file handoff rules

Work on a branch named for the increment. Commit locally at meaningful validated
checkpoints, staging only that checkpoint's files and preserving unrelated
changes. Do not amend, rewrite published history, force-push, or push to `main`.
Update `ROADMAP.md` with evidence and remaining limitations before committing; a
checkpoint does not by itself complete an increment, and the roadmap should say
so while the increment is in flight.

Push the branch, open its pull request with `gh pr create`, run the integration
test above, record the outcome, and leave merging to the user.

Watch for one defect class that has now been the finding several reviews of this
project produced: a list or a count that enumerates something you just extended.
On `C3` it was a stale key count. On `C4` a draft roadmap sentence called the new
origin label "a seventh" when it was the eighth, caught before pushing, and a
stale "two live reviews" count in `README.md` was corrected in passing. Grep for
enumerations of whatever you add, and for the numbers that describe them, before
you push, and prefer deriving a sentence from the list over restating its size.

Recent commits carry no attribution trailer, because those sessions were
instructed to add none. Older commits carry `Co-authored-by: Copilot`. Follow
whatever attribution rule your own session gives you; the history is
deliberately inconsistent on this point.

Before ending, finish implementation and applicable validation, update
`ROADMAP.md` with outcomes, reproduction commands, uncertainties and the exact
next small increment, and update `README.md` for user-visible changes. Then
rewrite `HANDOFF.md` as the **final repository file edit** before the
session-ending commit, include it in that commit, and push it so the next agent
reads it from the pull request the work lives on. If any later file edit is
needed, refresh the handoff last again. Pass these same rules on to the next
agent. If committing or pushing is blocked, still write the handoff last and
report it as uncommitted.

Distinguish observations from assumptions. Do not present this handoff's
historical results as probes run in your session. The final response should
report the commit and pull-request outcome and point to `HANDOFF.md`, not repeat
this prompt.
