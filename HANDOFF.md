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

- `main` is the squash merge of pull request #4, which is documentation only. It
  recorded that an increment's pull-request review is its real integration test,
  documented how to run that review, added increment `C4`, and fixed the three
  findings its own review returned. Pull request #3, squash-merged as `db8bd69`,
  delivered the balanced half of M1 before it.
- Both branches are deleted, and their individual commits are not ancestors of
  `main`, so read `git log` and the pull requests rather than looking for hashes
  from those branches. Nothing is uncommitted and no pull request is open.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- Pull request #4 was reviewed with the plugin at head `ae2c55c`, on the user's
  explicit authorization. Read "Documentation checkpoint: pull request #4 and
  its review" in `ROADMAP.md` before running your own. Balanced mode, five
  reviewers, incomplete coverage, three validated findings all since fixed, and
  79.82605 credits. That review is spent. **Yours needs its own authorization,
  and this one does not carry over.**
- Two things it taught us. The light tier ran a light model for the first time
  and found something no heavy reviewer did, so a distinct light model earns its
  place. And the evidence gate discards true findings whose citations are
  mis-anchored, so read the rejected candidates yourself rather than trusting
  the validated list to be complete.

Read "Completed increment: M1, balanced half" in `ROADMAP.md`. Do not repeat it:

- `extensions/pr-review/modes.mjs` declares each mode as data: reviewer topology
  with each reviewer's tier, findings policy, label, flag and evidence prefix.
  `quick.mjs` is now `review.mjs`, and `scripts/smoke-quick.mjs` is now
  `scripts/smoke-review.mjs`.
- `--balanced` runs four heavy specialists plus one light overview reviewer and
  is the default when no mode flag is given. `--major-only` is still the quick
  alias, mode flags are mutually exclusive, and `--capture-only` is the
  capture-without-reviewers path that the no-inference probes use.
- Balanced presents P0-P2 plus at most three P3/nit findings. Accepted minor
  findings beyond the cap are recorded in `validation.capped`, reported, and can
  never be selected or published. Retention enforces the mode's reviewer count,
  admitted severities and the cap.
- Each reviewer resolves its own tier through the existing layering, and an
  `Effective reviewer assignments:` block shows every reviewer, tier, model,
  effort and origin before execution.
- One live balanced review exists: pull request #3 reviewed itself at head
  `5c05b7c`. Five reviewers completed on `gpt-5.6-terra` at high effort, made 89
  confined reads with no denials, returned zero findings with incomplete
  coverage, and the runtime reported 414.14627 AI credits. It found one real
  defect, a stale documentation command left by a rename, which is fixed. It
  produced no candidate, so nothing was adjudicated: balanced review quality and
  minor-finding behavior are still undemonstrated, and no light model has ever
  run, because the light tier inherits the heavy assignment when it is unset.

## Implement only the exact next increment

Implement **the full half of M1**, as specified at the end of `ROADMAP.md`, on
its own branch and pull request. M1 stays Pending until it lands; deep is M2.

Acceptance criteria:

1. `--full` runs the four heavy specialists, the light overview reviewer and one
   medium conventions/maintainability reviewer, resolving the medium tier
   through the existing layering, with every origin shown before execution.
2. The full findings policy presents all qualifying severities with no minor
   cap, while evidence validation, deduplication, incomplete-coverage reporting
   and cancellation stay unchanged.
3. Mode flags stay mutually exclusive, balanced stays the default, and quick and
   its alias are unchanged.
4. Add no deep mode, fallbacks, timeouts, safeguards, reviewer shell tools, gate
   overrides, configuration keys or interactive menu. Keep L1 pending, copy no
   upstream source, and do not alter user checkouts to satisfy the revision gate.
5. Demonstrate with controlled probes and the no-inference installed dispatch
   first, extending `smoke-review.mjs`, `smoke-findings.mjs`,
   `smoke-retention.mjs` and the installed draft-skip loop the way balanced did.
6. Finish by opening the pull request and reviewing it with the plugin, then
   record that review in `ROADMAP.md`. Update the M1 row to Completed only once
   the full mode is demonstrated that way.

## Running the real integration test

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --full --all --no-comment
```

Pass `--full`. Your increment is the full half of M1, and the review is what
demonstrates it. Without a mode flag the runner takes the default, balanced,
and would spend the increment's one authorized review without ever running
the medium conventions reviewer or the unrestricted findings policy that
`--full` is supposed to add.

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
denials, and the reported credits. Fix real findings on the same branch and say
which you rejected and why. A refusal or failure is a defect report about the
tool; never weaken a gate to make the run pass.

## Runtime and validation caveats

- Consult the installed SDK and current official documentation before adopting
  runtime APIs. Installed SDK:
  `~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`. Demonstrate capabilities;
  declarations and plugin format support alone are not proof.
- Reinstall with `copilot plugin install "$(pwd)"` after every extension change,
  before running any installed-runtime probe or the integration test.
- Controlled suites (no inference/network): `node scripts/smoke-<name>.mjs` for
  `findings`, `review`, `selection`, `retention`, `preview`, `publication`,
  `publish-later`, `checkout`, `config`, `context`, `fixture`, `target`. All
  twelve passed on pull request #4 before it merged, as did `git diff --check`.
  Re-run them before you start: they need no network and no inference.
- Installed probes require both `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`, set
  the same derived way as the integration test above rather than pinned to a
  version.
  No-inference probes: `smoke-runtime.mjs --targets --startup`,
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs`, `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5`, and
  `smoke-config-runtime.mjs`.
- `smoke-config-runtime.mjs` refuses to run while a personal
  `<copilot-config-home>/pr-review/config.json` exists. Copy it aside and
  restore it byte-identically, or skip that probe.
- Reviewing costs real credits and scales with the diff and the reviewer count:
  414.14627 credits for five reviewers on a 27-file documentation-heavy pull
  request, against 27.89 for three reviewers on a small one. Report the
  runtime's figure; never estimate it.
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
