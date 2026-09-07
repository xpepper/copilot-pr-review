# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect the working tree,
recent commits, open pull requests and the implementation before editing
anything. `SCOPE.md` is the authoritative product specification; `ROADMAP.md`
records demonstrated evidence, runtime caveats and the exact next increment.
Do not rely on previous conversations or reopen settled product decisions.

**The working agreement changed on 2026-09-07: every increment lands on a branch
and a pull request that you review with this plugin before asking for a merge.**
`main` carries repository ruleset `22479389`, which requires a pull request with
zero approving reviews and grants no bypass, so direct pushes to `main` are
refused for admins and agents alike. Read "Land every increment on a reviewed
pull request" in `AGENTS.md` before you start.

## Recorded state

- `main` is at `d88774c` ("fix: accept the runtime search alias and complete R1")
  and is not directly pushable.
- Branch `m1-balanced-mode` and **open pull request #3** hold the balanced half
  of M1 plus the new pull-request workflow. Its commits are `6d231c7`
  (balanced mode), `1b924cb` and the documentation commits that follow,
  including this handoff. Inspect git history rather than assuming this file
  contains its own hash.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- Nothing else is uncommitted, and the extension installed by
  `copilot plugin install "$(pwd)"` matches that branch.

Read "Completed increment: M1, balanced half" in `ROADMAP.md`. Do not repeat it:

- `extensions/pr-review/modes.mjs` declares each mode as data: reviewer topology
  with each reviewer's tier, findings policy, label, flag and evidence prefix.
  `quick.mjs` was renamed to `review.mjs` and serves every mode;
  `scripts/smoke-quick.mjs` was renamed to `scripts/smoke-review.mjs`.
- `--balanced` runs four heavy specialists plus one light overview reviewer and
  is the default when no mode flag is given. `--major-only` is still the quick
  alias and mode flags are mutually exclusive.
- Because a bare PR number now runs a review, the capture-only path moved to an
  explicit `--capture-only` flag, which refuses to combine with a mode, posting,
  selection or model argument. That flag is prototype surface outside `SCOPE.md`.
- Balanced presents P0-P2 plus at most three P3/nit findings. Accepted minor
  findings beyond the cap are recorded in `validation.capped`, reported, and can
  never be selected or published. Retention enforces the mode's reviewer count,
  admitted severities and the cap.
- Each reviewer resolves its own tier through the existing layering, and an
  `Effective reviewer assignments:` block shows every reviewer, tier, model,
  effort and origin before execution. No light-tier invocation flag was added;
  the adjudicator still runs heavy with zero tools.
- **No live balanced review has been run.** All balanced evidence is controlled
  probes plus no-inference installed dispatch.

## Do this first: review pull request #3 with the tool

This is the dogfooding step the new workflow requires, and it is the one review
the workflow authorizes. It is also the first time this plugin reviews its own
repository, so treat the outcome as evidence about the tool, not just about the
diff.

1. Install the branch's extension and check out exactly the PR head with a clean
   tree: `copilot plugin install "$(pwd)"`, then `gh pr checkout 3`.
2. In a fresh Copilot CLI session started in this repository, run
   `/pr-review 3 --no-comment`. Balanced is the default, so no mode flag is
   needed. Do not use `--comment` or `/pr-review publish`.
3. Record the outcome in `ROADMAP.md` under the M1 balanced-half section: mode,
   model and effort actually used, reviewer coverage, findings and withheld
   minor findings, the reported credit cost, and what you changed in response.
   Zero findings is not a clean-review claim, and one review is not evidence
   about review quality in general.
4. Fix real findings on that same branch with new validated commits, and state
   which findings you rejected and why. Do not amend or force-push.
5. Ask the user to merge. Merging is their call.

If the tool refuses to review the pull request, for example because of the
revision gate, a skip rule, or a diff it cannot bind, record the refusal and its
cause as a defect report about the tool. Do not weaken a gate to make the review
run, and do not switch branches or modify the checkout to satisfy it.

## Then implement only the exact next increment

Implement **the full half of M1**, as specified at the end of `ROADMAP.md`, on
its own branch and pull request. M1 stays Pending until it lands; deep belongs
to M2.

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
   Update the M1 row to Completed only once full is demonstrated.

## Runtime and validation caveats

- Consult the installed SDK and current official documentation before adopting
  runtime APIs. Installed SDK:
  `~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`. Demonstrate capabilities;
  declarations and plugin format support alone are not proof.
- Reinstall with `copilot plugin install "$(pwd)"` after every extension change,
  before running installed-runtime probes. The deprecation warning is expected.
- Controlled suites (no inference/network): `node scripts/smoke-<name>.mjs` for
  `findings`, `review`, `selection`, `retention`, `preview`, `publication`,
  `publish-later`, `checkout`, `config`, `context`, `fixture`, `target`. All
  twelve passed in the previous session, as did `git diff --check`. The suite is
  named `review`, not `quick`.
- Installed probes require both `COPILOT_CLI_PATH="$(command -v copilot)"` and
  `COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk"`.
  No-inference probes rerun previously: `smoke-runtime.mjs --targets --startup`,
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs`, `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5`, and
  `smoke-config-runtime.mjs`.
- `smoke-config-runtime.mjs` refuses to run while a personal
  `<copilot-config-home>/pr-review/config.json` exists. Copy it aside and
  restore it byte-identically, or skip that probe.
- Inference authorization does not accumulate. The workflow authorizes **one**
  review per increment pull request. The recorded R1 live command, harness
  `--quick` paths, `--read-live`, fixture inference and any publication still
  need a fresh explicit instruction in your own session. There is still no
  balanced path in the live harness; adding one is implementation work.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.

## Commit, pull-request and final-file handoff rules

Work on a branch named for the increment. Commit locally at meaningful validated
checkpoints, staging only the files of that checkpoint and preserving unrelated
changes. Do not amend, rewrite published history, force-push, or push to `main`.
Update `ROADMAP.md` with evidence and remaining limitations before committing; a
checkpoint does not by itself complete an increment.

Push the branch, open its pull request with `gh pr create`, review that pull
request with this plugin, record the outcome, and leave merging to the user.

Recent commits omit the `Co-authored-by: Copilot
<223556219+Copilot@users.noreply.github.com>` trailer that older commits carry,
because that session was instructed to add no attribution lines. Follow whatever
attribution rule your own session gives you; the history is deliberately
inconsistent on this point.

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
