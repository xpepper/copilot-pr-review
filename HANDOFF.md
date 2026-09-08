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

- `main` is the squash merge of pull request #6, which completed `F5`. Pull
  requests #3, #4 and #5 delivered `M1` before it. Those branches are deleted and
  their individual commits are not ancestors of `main`, so read `git log` and the
  pull requests rather than looking for hashes from them.
- **Pull request #7 is open and unmerged: it is `F6`, on branch
  `f6-reviewer-output-contract`, and this handoff lives on it.** It carries two
  commits, the implementation and the fix its own review produced. Nothing is
  uncommitted. Merging is the user's call.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- `M1`, `F5` and `F6` are Completed. `M2` is next and is no longer blocked.
- Five live reviews of this repository's own pull requests exist: #3 and #4 in
  balanced mode, #5 in full mode, #6 in balanced mode, #7 in full mode. All five
  are spent. **Any review you run needs its own authorization; none of these
  carry over.**

## What `F6` settled, so you do not redo it

The user was asked to choose between `F5`'s three options and chose **both** that
change something: reviewers and the adjudicator are asked for the envelope
between `<<<PR_REVIEW_JSON>>>` and `<<<END_PR_REVIEW_JSON>>>`, each alone on its
line, **and** code unwraps that pair, then one fence wrapping the whole response.
Read "Completed increment: F6" in `ROADMAP.md` in full before touching
`findings.mjs`.

Two results matter for anything you do next.

- **The contract works on real models.** In pull request #7's full-mode review,
  five of six reviewers emitted the markers on their own lines, including
  `claude-sonnet-5`, which also emitted a line of prose first and no fence at
  all. That is pull request #5's fence failure and #6's prose failure both gone in
  one run. The light model ignored the markers and emitted a bare object, which
  the strict floor still accepts.
- **Payload text is not a wrapper.** The first implementation counted marker
  substrings, so a reviewer citing the lines that define the markers discarded its
  own output. Four of six reviewers died that way, three of them while reporting
  that very defect. Markers and fences now count only as whole lines. Do not
  reintroduce substring matching, and do not widen the unwrap: everything after
  the parse is unchanged, and `ROADMAP.md` carries a table of what still fails
  whole.

The fix is verified by the twelve controlled suites and by replaying the six
captured reviewer outputs, **not** by a second live review. Five of six parse
under the fix against two as reviewed. The next live review of any increment is
the first real evidence for that number; report it as such.

## The next increment is `M2`, deep mode

Deep uses one integrated heavy reviewer considering the whole pull request,
presents all substantiated severities, and rejects conflicting mode flags. Deep
means holistic review, not a larger parallel review and not an ascending fourth
effort level. Reviewer count and concurrency follow the selected mode. Keep the
evidence boundary exactly as it is, keep `L1` pending, and copy no upstream
source. Branch from `main` if pull request #7 is merged; if it is still open, its
branch `f6-reviewer-output-contract` carries this handoff and `F6`'s evidence.

## Running the real integration test

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --all --no-comment
```

Name the mode deliberately. Without a mode flag the runner takes the default,
balanced. Say in `ROADMAP.md` which mode you used and why; `F6` used full because
full is the only mode that assigns the medium tier, and the saved medium model is
the one whose output started the whole problem. `M2` will have its own obvious
answer, since deep is the mode it adds.

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

Record from that run: the mode, the model and effort each reviewer actually
used, coverage, findings, withheld findings, coverage gaps, tool calls and
denials, and the reported credits. The per-reviewer `policy.toolCalls`,
`policy.reads`, `policy.permissionDenials` and `policy.toolDenials` fields in the
evidence record carry the read evidence; `billing` carries the charge. Save the
reviewers' verbatim output from the timeline before you analyse anything: `F6`'s
diagnosis and its replay evidence both came from those strings. Fix real findings
on the same branch and say which you rejected and why. A refusal or failure is a
defect report about the tool; never weaken a gate to make the run pass.

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
  twelve passed on pull request #7, as did `git diff --check`. Re-run them
  before you start: they need no network and no inference.
- Installed probes require both `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`, set
  the same derived way as the integration test above rather than pinned to a
  version. No-inference probes: `smoke-runtime.mjs --targets --startup` was rerun
  on pull request #7 after the fix and passed. `smoke-runtime.mjs --targets
  --matching-checkout --startup`, `smoke-retention-runtime.mjs`,
  `smoke-reviewer-tools.mjs` with `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with
  `claude-sonnet-5`, and `smoke-config-runtime.mjs` were last rerun on pull
  request #5; `F6` changed `findings.mjs` only, which none of them exercises.
- `scripts/smoke-factory.mjs` is `F5`'s probe. Without `--spend` it starts no
  subagent and spends nothing, and it is a useful no-inference regression on the
  factory surface if you ever need to check whether the gate has lifted. With
  `--spend` it costs credits and needs explicit authorization.
- `smoke-config-runtime.mjs` refuses to run while a personal
  `<copilot-config-home>/pr-review/config.json` exists. Copy it aside and
  restore it byte-identically, or skip that probe. Verify the restore with
  `shasum -a 256`; a shell that dies mid-script can leave it moved away.
- Reviewing costs real credits and scales with the diff and the reviewer count:
  79.238565 for five balanced reviewers on a 3-file, 848-addition pull request,
  124.2079 for six full reviewers on a 4-file one, 276.266849 for six full
  reviewers on a 13-file one, 414.14627 for five balanced reviewers on a 27-file
  one, and 27.89 for three quick reviewers on a small one. Report the runtime's
  figure; never estimate it.
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
- Three older observations remain open and separately authorizable: no review has
  ever run against a substantial code diff, so review quality is undemonstrated;
  the changed-line anchoring rule keeps discarding true findings; and pull request
  #6's read denials landed on the two reviewers that then failed, though #7 had no
  denial at all.
- Two sessions once worked on the same branch at the same time, and the second
  wrote a handoff from a stale premise. If that happens again, rebase rather
  than force-push, and say so in your report.

## Commit, pull-request and final-file handoff rules

Work on a branch named for the increment. Commit locally at meaningful validated
checkpoints, staging only that checkpoint's files and preserving unrelated
changes. Do not amend, rewrite published history, force-push, or push to `main`.
Update `ROADMAP.md` with evidence and remaining limitations before committing; a
checkpoint does not by itself complete an increment.

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
