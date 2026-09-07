# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect the working tree,
recent commits, open pull requests and the implementation before editing
anything. `SCOPE.md` is the authoritative product specification; `ROADMAP.md`
records demonstrated evidence, runtime caveats and the exact next increment.
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

- **Pull request #5 is open and unmerged**, on branch `m1-full-mode`. It carries
  the full half of `M1` and is the work described below. Merging is the user's
  call; nothing in it has landed on `main` yet.
- `main` is still the squash merge of pull request #4. Pull requests #3 and #4
  are merged and their branches deleted, so read `git log` and the pull requests
  rather than looking for hashes from those branches.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- `M1` is now recorded as Completed. Both halves are in `ROADMAP.md` under
  "Completed increment: M1, balanced half" and "Completed increment: M1, full
  half". Read the second one in full before you start; do not repeat it.
- Three live reviews of this repository's own pull requests now exist: #3 and #4
  in balanced mode, #5 in full mode. All three are spent. **Yours needs its own
  authorization, and none of these carry over.**

What pull request #5 added, in one paragraph each:

- `--full` runs the balanced five plus one `conventions-maintainability`
  reviewer on the **medium** tier, and presents every qualifying severity with
  no minor cap. Balanced is still the default, mode flags are still mutually
  exclusive, and quick and `--major-only` are untouched.
- The medium tier resolves through the existing layering, so no configuration
  key and no medium invocation flag were added. `mediumModel=`/`mediumEffort=`
  on `/pr-review NUMBER` are rejected exactly as the light keys are.
- `modes.mjs` declares the severity vocabulary once through a `minorPolicy`
  helper. The full policy's `minorCap` is `Infinity`, so one number still drives
  the cap arithmetic, the retention check and the wording; `admitsMinor` and
  `capsMinor` read it.
- Nothing else changed. Evidence validation, deduplication, coverage reporting,
  selection, retention, publication gates and cancellation already read the
  topology and the policy from `modes.mjs`.

## What the pull request #5 review taught us

It ran full mode at head `e8da43b`, all six reviewers completed, 95 confined
reads with zero denials, **276.266849 credits**, and **zero validated findings
with incomplete coverage**. Two things matter more than those numbers.

**The medium tier's model fenced its JSON, and the whole output was discarded.**
`claude-sonnet-5` returned its candidates wrapped in a ```` ```json ```` fence.
The parser does no fence stripping by design, so `conventions-maintainability`
contributed an execution failure and a charge instead of candidates. This is the
first time any live run used a Claude-family model as a reviewer. Full mode is
the only mode that assigns the medium tier, so `--full` is partly broken today
for that model family. **This is the next increment**, and it needs a product
decision from the user first, because `SCOPE.md` deliberately drops
malformed-output extraction from v1. The two candidate paths, the recommendation
and the acceptance criteria are at the end of `ROADMAP.md`. Do not just relax the
parser on your own judgment.

**The evidence gate rejected a true finding for the second time in two reviews.**
`correctness:1` correctly observed that a README sentence stated the medium
tier's tie-break unconditionally, and was rejected because its introduction
citations did not identify the same changed hunk as its location. The point was
acted on anyway. Read the rejected candidates and the discarded reviewer output
yourself; the validated list is not the whole review.

## Implement only the exact next increment

The exact next increment, its required product decision, and its acceptance
criteria are at the end of `ROADMAP.md` under "Exact next increment". Implement
only that, on its own branch and pull request. `M2`, deep mode, comes after it,
and the roadmap says why that ordering.

Ask the user which of the two paths to take before implementing. Everything that
does not depend on that answer, the probes, the reproduction, the handoff, can be
prepared either way.

## Running the real integration test

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --full --all --no-comment
```

Pass `--full`, and make sure a Claude-family model is the configured medium
tier. The next increment is about the medium reviewer's output surviving, so a
review that never runs a medium reviewer, or runs one on a GPT-family model,
would not demonstrate it. Without a mode flag the runner takes the default,
balanced, and would spend the increment's one authorized review on the wrong
topology.

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
dispatching the command.

Record from that run: the mode, the model and effort each reviewer actually
used, coverage, findings, withheld findings, coverage gaps, tool calls and
denials, and the reported credits. The per-reviewer `policy.toolCalls`,
`policy.reads`, `policy.permissionDenials` and `policy.toolDenials` fields in the
`M1 evidence:` record carry the read evidence; `billing` carries the charge. Fix
real findings on the same branch and say which you rejected and why. A refusal or
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
  twelve passed on pull request #5, as did `git diff --check`. Re-run them
  before you start: they need no network and no inference.
- Installed probes require both `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`, set
  the same derived way as the integration test above rather than pinned to a
  version. No-inference probes, all rerun on pull request #5:
  `smoke-runtime.mjs --targets --startup`,
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs`, `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5`, and
  `smoke-config-runtime.mjs`.
- The installed draft-skip loop in `smoke-runtime.mjs --startup` now dispatches
  all three modes and asserts each one's reviewer count, tier lines and
  findings-policy text. Extend it the same way for any new mode.
- `smoke-config-runtime.mjs` refuses to run while a personal
  `<copilot-config-home>/pr-review/config.json` exists. Copy it aside and
  restore it byte-identically, or skip that probe. Verify the restore with
  `shasum -a 256`; a shell that dies mid-script can leave it moved away.
- Reviewing costs real credits and scales with the diff and the reviewer count:
  276.266849 for six full reviewers on a 13-file pull request, 414.14627 for
  five balanced reviewers on a 27-file one, 79.82605 for five on a 4-file one,
  and 27.89 for three quick reviewers on a small one. Report the runtime's
  figure; never estimate it.
- Inference authorization does not accumulate. The workflow authorizes the one
  review of your increment's pull request. The recorded R1 live command, harness
  `--quick` paths, `--read-live`, fixture inference and any publication still
  need a fresh explicit instruction in your own session.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.

## Commit, pull-request and final-file handoff rules

Work on a branch named for the increment. Commit locally at meaningful validated
checkpoints, staging only that checkpoint's files and preserving unrelated
changes. Do not amend, rewrite published history, force-push, or push to `main`.
Update `ROADMAP.md` with evidence and remaining limitations before committing; a
checkpoint does not by itself complete an increment.

Push the branch, open its pull request with `gh pr create`, run the integration
test above, record the outcome, and leave merging to the user.

Recent commits omit the `Co-authored-by: Copilot
<223556219+Copilot@users.noreply.github.com>` trailer that older commits carry,
because those sessions were instructed to add no attribution lines. Follow
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
