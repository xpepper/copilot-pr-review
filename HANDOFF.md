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

- **`C3` is complete and lives on branch `c3-fallback-models`, pull request #10,
  which is open and unmerged.** Merging is the user's call. If it has been
  merged by the time you read this, branch from `main`; if not, ask before
  building on top of an unmerged branch.
- Pull requests #3, #4 and #5 delivered `M1`, #6 delivered `F5`, #7 delivered
  `F6`, #8 delivered `M2`, #10 delivers `C3`. All but #10 are merged, their
  branches are deleted, and their individual commits are not ancestors of
  `main`, so read `git log` and the pull requests rather than looking for hashes
  from them.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- `M1`, `F5`, `F6`, `M2` and `C3` are Completed. `C4` and the new `C5` are the
  ready candidates; `L1` stays pending.
- Seven live reviews of this repository's own pull requests exist: #3 and #4
  balanced, #5 full, #6 balanced, #7 full, #8 deep, #10 balanced. All seven are
  spent. **Any review you run needs its own authorization; none of these carry
  over.**

## What `C3` settled, so you do not redo it

Configured fallback models are implemented and demonstrated. A tier may carry
`<tier>FallbackModel` and `<tier>FallbackEffort`; that pair buys **one extra
attempt, for the one reviewer whose own execution failed**, and nothing else.
Read "Completed increment: C3" in `ROADMAP.md` before you touch `config.mjs`,
`review.mjs` or `fixture.mjs`.

- **Eligibility is deliberately narrow.** Only that reviewer's own execution
  failure qualifies. Cancellation does not. An unusable explicit assignment does
  not: it still refuses the review before anything starts. Nor does a setup
  refusal, a runtime that will not retain the assignment, a checkout it will not
  point at, or a tool set it will not enforce.
- **Elapsed time never triggers a fallback**, because nothing imposes a deadline
  anywhere. Do not add a timer, a deadline, a heartbeat or a "stuck reviewer"
  heuristic to make fallbacks fire more often. `SCOPE.md` forbids it and the
  design depends on it.
- **Fallbacks never inherit across tiers**, unlike a tier's own model and effort.
  An unset fallback means that tier has none. Only the fallback effort falls
  back, to the tier's own effective effort.
- One attempt per reviewer, in place, concurrent with the others. Never a
  whole-review restart, never a second attempt, never another reviewer's problem.
  The adjudicator is a reviewer for this purpose and gets its own single attempt.
- A fallback identical to the tier's own resolved model **and** effort is not
  offered; the same model at a different effort still is.
- Fallbacks have no invocation flag, like `lightModel` and `mediumModel`.
- A reviewer that fell back keeps the failed attempt in `fallbackFrom` and
  reports it as a non-blocking coverage caveat. Do not "simplify" that away: a
  record showing only the fallback would be a silent substitution.

## What pull request #10's review found, so you inherit it

The balanced review cost 233.19659 credits, completed all six sessions with no
denial, and reported **incomplete** coverage on six blocking issues. Two things
in it matter to you more than the accepted finding.

- **Four reviewers independently reported the same true coverage gap**: no
  installed-runtime review has ever watched a reviewer actually fall back. The
  attempt is demonstrated only against test doubles. Do not claim otherwise.
- **The overview reviewer found a P2 at confidence 0.95 that nothing else found,
  and the changed-line anchoring rule discarded it.** Its substance is real and
  is now increment `C5`: a reviewer whose output the evidence boundary cannot
  parse settles as `completed`, so it gets no fallback, while an empty response
  does. Four of this project's own live reviews were incomplete for exactly the
  reason a fallback cannot answer. It was deliberately not fixed in `C3`, for
  the reasons recorded under "Remaining limitations" there. That rule has now
  thrown away a true finding on three separate pull requests, and this is the
  first time it threw away the most valuable finding in the review.

The accepted finding was a stale **count**: the trusted-project section still
promised "the same seven keys and no others". Both places now derive the sentence
from the key list. Watch for that defect class in your own increment: a list or a
count that enumerates something you just extended. It has now been the defect a
review of this project found four times.

## The next increment: `C4` or `C5`

`ROADMAP.md`'s "Exact next increment" section states both in full.

`C4` is the smaller one. A tier whose resolved model supports no configurable
reasoning effort should resolve to **no** effort instead of inheriting one, so
such a model can serve the tier. An explicit effort is still validated and never
silently lowered. `C3` gave that increment a second surface: a fallback model
that advertises no configurable effort is refused today for exactly the same
reason, and the roadmap's C3 evidence records that refusal as a test case.

`C5` is the one the review asked for, and the one that decides whether `C3` is
useful in practice. It is larger and it is a product decision as much as a
change: it moves the retry decision across the evidence boundary, so ask the user
before starting it.

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
because it changed no mode and balanced is the default topology users get, and
because it exercises both the light and the heavy tier. `M2` used `--deep`
because deep was the mode it added and is the cheapest topology in the tool.
Full is the only mode that exercises the medium tier.

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
timeline as a hang.

Do not modify the working tree while a review is running: the reviewer is
reading that checkout live.

Record from that run: the mode, the model and effort each reviewer actually
used, coverage, findings, withheld findings, coverage gaps, tool calls and
denials, and the reported credits. The per-reviewer `policy.toolCalls`,
`policy.reads`, `policy.permissionDenials` and `policy.toolDenials` fields in the
evidence record carry the read evidence; `billing` carries the charge. Save the
reviewers' verbatim output from the timeline before you analyse anything: `F6`'s
diagnosis, `M2`'s marker evidence and `C3`'s came from those strings. Fix real
findings on the same branch and say which you rejected and why. A refusal or
failure is a defect report about the tool; never weaken a gate to make the run
pass.

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
  twelve passed on pull request #10, as did `git diff --check`. Re-run them
  before you start: they need no network and no inference.
- Installed probes require both `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`, set
  the same derived way as the integration test above rather than pinned to a
  version. No-inference probes: `smoke-runtime.mjs --targets --startup` and
  `smoke-config-runtime.mjs` were both rerun on pull request #10 and passed.
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs` and `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5` were last
  rerun on pull request #5; `F6`, `M2` and `C3` changed nothing they exercise.
- **`smoke-config-runtime.mjs` does not refuse when a personal
  `<copilot-config-home>/pr-review/config.json` exists**, which an earlier
  handoff claimed. It fails its first assertion, which expects `not created
  yet`. Move the file aside, run the probe, move it back, and verify the restore
  with `shasum -a 256`; a shell that dies mid-script can leave it moved away.
  The probe also needs a second usable subscription model, one that is not the
  ambient model and advertises a configurable reasoning effort, because `C3`
  asserts a fallback that differs from the tier's own assignment.
- `scripts/smoke-factory.mjs` is `F5`'s probe. Without `--spend` it starts no
  subagent and spends nothing, and it is a useful no-inference regression on the
  factory surface if you ever need to check whether the gate has lifted. With
  `--spend` it costs credits and needs explicit authorization.
- Reviewing costs real credits and scales with the diff and the reviewer count:
  233.19659 for five balanced reviewers on a 12-file, 984-addition pull request,
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
  widen it. It now has live evidence from three runs: five of six reviewers on
  #7, both sessions on #8, and all six sessions on #10, the widest of the three.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.
- Three older observations remain open and separately authorizable. The oldest
  is the largest: **no review of any mode has ever run against a substantial
  code diff**, and pull request #10 is the closest yet at 984 additions over 12
  files, most of it real logic. The changed-line anchoring rule keeps discarding
  true findings. And pull request #6's read denials landed on the two reviewers
  that then failed, though #7, #8 and #10 had no denial at all.
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
