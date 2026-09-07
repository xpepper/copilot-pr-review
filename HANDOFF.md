# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect the working tree,
recent commits and implementation before editing anything. `SCOPE.md` is the
authoritative product specification; `ROADMAP.md` records demonstrated evidence,
runtime caveats and the exact next increment. Do not rely on previous
conversations or reopen settled product decisions.

## Recorded state

R1 is complete. The balanced half of M1 is complete and committed as
`6d231c7` ("feat(review): add the balanced mode and make it the default").
The session-ending commit containing this handoff adds only documentation.
Inspect git history rather than assuming this file contains its own hash.
No unrelated uncommitted work was present when this handoff was written.

Read "Completed increment: M1, balanced half" in `ROADMAP.md`. Do not repeat it:

- `extensions/pr-review/modes.mjs` declares each mode as data: reviewer topology
  with each reviewer's tier, findings policy, label, flag and evidence prefix.
  `quick.mjs` was renamed to `review.mjs` and now serves every mode;
  `scripts/smoke-quick.mjs` was renamed to `scripts/smoke-review.mjs`.
- `--balanced` runs four heavy specialists plus one light overview reviewer and
  is the default when no mode flag is given. `--major-only` is still the quick
  alias and mode flags are mutually exclusive.
- Because a bare PR number now runs a review, the capture-only path moved to an
  explicit `--capture-only` flag, which refuses to combine with a mode, posting,
  selection or model argument. That flag is prototype surface outside `SCOPE.md`.
- The balanced findings policy presents P0-P2 plus at most three P3/nit findings.
  Accepted minor findings beyond the cap are recorded in `validation.capped`,
  reported, and can never be selected or published. Retention enforces the
  mode's reviewer count, admitted severities and the cap.
- Each reviewer resolves its own tier through the existing layering, and an
  `Effective reviewer assignments:` block shows every reviewer, tier, model,
  reasoning effort and origin before execution. No light-tier invocation flag
  was added; the adjudicator still runs heavy with zero tools.
- **No live balanced review was run.** All balanced evidence is controlled
  probes plus no-inference installed dispatch. Balanced review quality, minor
  finding usefulness and five-reviewer cost are undemonstrated.

## Implement only the exact next increment

Implement **the full half of M1**, as specified at the end of `ROADMAP.md`.
M1 stays Pending until it lands; deep belongs to M2.

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
  twelve passed in this session, as did `git diff --check`. The suite is named
  `review`, not `quick`.
- Installed probes require both `COPILOT_CLI_PATH="$(command -v copilot)"` and
  `COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk"`.
  No-inference probes rerun in this session: `smoke-runtime.mjs --targets
  --startup`, `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs`, `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5`, and
  `smoke-config-runtime.mjs`. The first two now dispatch a skipped draft in both
  quick and balanced modes and assert the displayed assignments.
- `smoke-config-runtime.mjs` refuses to run while a personal
  `<copilot-config-home>/pr-review/config.json` exists. In this session that
  file was copied aside and restored byte-identically; do the same, or skip it.
- Harness `--quick` spends credits; `smoke-runtime.mjs --quick --once` limits
  its path to one review, and `--read-live` additionally requires explicit
  `PR_REVIEW_LIVE_REPOSITORY`, `PR_REVIEW_LIVE_NUMBER` and `PR_REVIEW_LIVE_HEAD`.
  There is no balanced harness path yet; adding one is implementation work, not
  a flag. Never rerun the recorded R1 live command or publish without new
  applicable authorization.
- **No inference authorization carries into your session.** The R1
  authorizations are consumed and no balanced authorization was ever given.
  A live balanced or full review needs new explicit authorization in that
  session, and one live review is not review-quality proof.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.

## Commit and final-file handoff rules

Commit locally at meaningful validated checkpoints. Stage only checkpoint files;
preserve unrelated changes. Do not amend, rewrite history or push. Record
evidence and remaining limitations in `ROADMAP.md` before committing; a
checkpoint does not by itself complete an increment.

This session's two commits omit the `Co-authored-by: Copilot
<223556219+Copilot@users.noreply.github.com>` trailer that earlier commits carry,
because this session was instructed to add no attribution lines. Follow whatever
attribution rule your own session gives you; the repository history is
deliberately inconsistent on this point.

Before ending, finish implementation and applicable validation, update
`ROADMAP.md` with outcomes, reproduction commands, uncertainties and the exact
next small increment, and update `README.md` for user-visible changes. Then
rewrite `HANDOFF.md` as the **final repository file edit** before the
session-ending commit and include it. If any later file edit is needed, refresh
the handoff last again. Pass these same rules on to the next agent. If commits
are blocked, still write the handoff last and report it as uncommitted.

Distinguish observations from assumptions. Do not present this handoff's
historical results as probes run in your session. The final response should
report the commit outcome and point to `HANDOFF.md`, not repeat this prompt.
