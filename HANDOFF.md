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

- **You are starting on branch `m2-deep-mode`, on pull request #8, which is not
  merged.** Read this handoff from that pull request. If the user has merged it,
  start from a fresh `main` instead; the branch will be deleted and its
  individual commits will not be ancestors of `main`, so read `git log` and the
  pull requests rather than looking for hashes from it.
- Pull request #8 completed `M2`. Nothing is uncommitted. Branch from the
  merged `main` for the next increment; do not continue on `m2-deep-mode`.
- Pull requests #3, #4 and #5 delivered `M1`, #6 delivered `F5`, #7 delivered
  `F6`. All are merged and their branches are gone.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- `M1`, `F5`, `F6` and `M2` are Completed. `C3` and `C4` are the ready
  candidates; `L1` stays pending.
- Six live reviews of this repository's own pull requests exist: #3 and #4
  balanced, #5 full, #6 balanced, #7 full, #8 deep. All six are spent. **Any
  review you run needs its own authorization; none of these carry over.**

## What `M2` settled, so you do not redo it

`--deep` is implemented and demonstrated. It declares **one** reviewer,
`integrated`, on the heavy tier, and that is the whole topology: deep resolves no
light and no medium tier at all. Its findings policy is full's, `minorCap:
Infinity`, so every substantiated severity is presented and nothing is withheld.
Deep is the only mode declaring `holistic: true`, and exactly two pieces of
reviewer text read that flag: the instructions, which cast it as the pull
request's only reviewer rather than a specialist and scope a null result to the
whole change, and the prompt, which heads the assignment `Assigned reviewer:`.
Do not infer holism from the reviewer count, and do not make deep a further
specialist or a higher reasoning effort.

Read "Completed increment: M2" in `ROADMAP.md` before touching `modes.mjs`.
Three results there matter for whatever you do next.

- **The evidence boundary was not touched, and that is the point.** The marker
  contract and its unwrap, the exact-key check, the schema version and review-key
  binding, the citation, quote and changed-line gates, adjudication in a separate
  zero-tool session, deduplication, selection, retention and the publication
  gates are shared code that never learned about deep. Keep it that way.
- **The `F6` marker contract now has live evidence from a second run.** Both of
  #8's sessions emitted the markers on their own lines and both parsed. Do not
  reintroduce substring matching and do not widen the unwrap.
- **`mode.specialists` is now `mode.reviewers`**, because deep's one reviewer is
  deliberately not a specialist. Pure rename, no behaviour change.

One class of defect showed up three times in this increment and is worth
watching for: **a list or sentence that enumerates modes and forgets the new
one.** `scripts/dogfood-review.mjs` waited for a hardcoded `Q3`/`M1` evidence
prefix, so a deep run would have hung after printing its findings; the
configuration inspector's tier note named quick, balanced and full only; and the
roadmap's own exact-next section was stale, which the review itself caught. The
first two now derive from or are asserted against the mode declarations, and a
final sweep fixed four more prose enumerations in `README.md` and a probe
comment. If you add a mode, grep for the other four mode ids, and for
`quick, balanced`, `balanced and full` and `balanced/full`, before you push.

## The next increment: `C3` or `C4`

Every mode in `SCOPE.md`'s table now exists, so the next increment leaves the
mode surface. `ROADMAP.md`'s "Exact next increment" section states both
candidates in full. `C3` is the smaller one and is recommended.

`C3` is configured fallback models: at most one configured fallback attempt per
eligible failed reviewer, never a whole-review restart, never a timer, and never
a silent substitution. Optional fallbacks start unset and must be configured
explicitly. The constraint that makes it delicate is in `SCOPE.md`: **elapsed
time alone must never trigger a fallback**, so a hung reviewer waits
indefinitely and only an explicit failure is eligible. Extend `C1`'s tier
layering in `config.mjs` and the assertions in `smoke-config.mjs` rather than
inventing a parallel path.

`C4` is smaller still: a tier whose resolved model supports no configurable
reasoning effort should resolve to no effort instead of inheriting one, so such
a model can serve the tier. An explicit effort is still validated and never
silently lowered.

Whatever you pick, keep the evidence boundary exactly as it is, keep `L1`
pending, copy no upstream source, and update `README.md` if the change is
user-visible.

## Running the real integration test

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --all --no-comment
```

Name the mode deliberately. Without a mode flag the runner takes the default,
balanced. Say in `ROADMAP.md` which mode you used and why; `M2` used `--deep`
because deep was the mode it added, and because deep is the cheapest topology in
the tool, one reviewer plus the adjudicator. For an increment that changes no
mode, balanced is the honest default and full is the only mode that exercises the
medium tier.

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
timeline as a hang. #8's deep review took roughly twenty minutes for one
reviewer.

Do not modify the working tree while a review is running: the reviewer is
reading that checkout live.

Record from that run: the mode, the model and effort each reviewer actually
used, coverage, findings, withheld findings, coverage gaps, tool calls and
denials, and the reported credits. The per-reviewer `policy.toolCalls`,
`policy.reads`, `policy.permissionDenials` and `policy.toolDenials` fields in the
evidence record carry the read evidence; `billing` carries the charge. Save the
reviewers' verbatim output from the timeline before you analyse anything: `F6`'s
diagnosis and its replay evidence both came from those strings, and `M2`'s
marker evidence came from #8's. Fix real findings on the same branch and say
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
  twelve passed on pull request #8, as did `git diff --check`. Re-run them
  before you start: they need no network and no inference.
- Installed probes require both `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`, set
  the same derived way as the integration test above rather than pinned to a
  version. No-inference probes: `smoke-runtime.mjs --targets --startup` was rerun
  on pull request #8 and passed, now dispatching four modes.
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs`, `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5`, and
  `smoke-config-runtime.mjs` were last rerun on pull request #5; `F6` and `M2`
  changed nothing any of them exercises.
- `scripts/smoke-factory.mjs` is `F5`'s probe. Without `--spend` it starts no
  subagent and spends nothing, and it is a useful no-inference regression on the
  factory surface if you ever need to check whether the gate has lifted. With
  `--spend` it costs credits and needs explicit authorization.
- `smoke-config-runtime.mjs` refuses to run while a personal
  `<copilot-config-home>/pr-review/config.json` exists. Copy it aside and
  restore it byte-identically, or skip that probe. Verify the restore with
  `shasum -a 256`; a shell that dies mid-script can leave it moved away.
- Reviewing costs real credits and scales with the diff and the reviewer count:
  68.27393 for one deep reviewer on a 12-file, 385-addition pull request,
  79.238565 for five balanced reviewers on a 3-file, 848-addition one, 124.2079
  for six full reviewers on a 4-file one, 276.266849 for six full reviewers on a
  13-file one, 414.14627 for five balanced reviewers on a 27-file one, and 27.89
  for three quick reviewers on a small one. Report the runtime's figure; never
  estimate it.
- Inference authorization does not accumulate. The workflow authorizes the one
  review of your increment's pull request. `smoke-factory.mjs --spend`, the
  recorded R1 live command, harness `--quick` paths, `--read-live`, fixture
  inference and any publication each still need a fresh explicit instruction in
  your own session.
- Do not revisit the Agent Factories surface without new information from GitHub.
  `F5` demonstrated three independent blockers on CLI 1.0.83 and all three would
  have to change. A new CLI version is new information; a fresh reading of the
  same documentation is not.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.
- Three older observations remain open and separately authorizable. The oldest
  is the largest: **no review of any mode has ever run against a substantial code
  diff**, so review quality is undemonstrated; all six live runs reviewed this
  project's own documentation-heavy pull requests, and #8's two findings were
  both documentation defects. The changed-line anchoring rule keeps discarding
  true findings. And pull request #6's read denials landed on the two reviewers
  that then failed, though #7 and #8 had no denial at all.
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
