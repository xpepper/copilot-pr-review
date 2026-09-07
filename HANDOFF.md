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
- One live balanced review has been run, on pull request #3 itself. It produced
  no findings, so balanced review quality and minor-finding behavior remain
  undemonstrated, and no light model has ever run: the light tier inherited the
  saved heavy assignment.

## State of pull request #3: reviewed, not merged

The workflow's dogfooding step is **already done for #3**, so do not repeat it:
that would spend credits again. One balanced review ran at head
`5c05b7c` with `node scripts/dogfood-review.mjs 3 --all --no-comment`. All five
reviewers completed on `gpt-5.6-terra` at high effort, made 89 confined reads
with no denials, produced zero findings with incomplete coverage, and the
runtime reported 414.14627 AI credits. Nothing was published. The full record is
in "Live inference: the dogfood review of pull request #3" in `ROADMAP.md`.

That review found one real defect, a `README.md` command still naming the
renamed `scripts/smoke-quick.mjs`, which is fixed on the branch in commit
`5061b79`. It also exposed a tool limitation worth acting on later: a real
regression whose broken line is unchanged context cannot be anchored as a
candidate, so it surfaced only as a coverage gap.

What remains for #3 is a merge decision, which is the user's. If you push
further commits to that branch, the pull request head moves and its review
becomes stale; say so plainly rather than implying the new head was reviewed.

## Implement only the exact next increment

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
- Reviewing a doc-heavy pull request is expensive. Pull request #3 cost
  414.14627 credits for five reviewers on a 27-file diff, against R1's 27.89 for
  three reviewers on a small one. Budget for that before you dispatch, and
  report the runtime's actual figure rather than an estimate.
- `scripts/dogfood-review.mjs NUMBER --all --no-comment` is the SDK dispatcher
  for agents that cannot type a slash command. It refuses to run unless the
  local head is the pull request head with a clean tree, and refuses
  `--comment`. Reinstall the plugin from the checkout first.
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
