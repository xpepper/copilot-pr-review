# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect the working tree,
recent commits and implementation before editing anything. `SCOPE.md` is the
authoritative product specification; `ROADMAP.md` records demonstrated evidence,
runtime caveats and the exact next increment. Do not rely on previous
conversations or reopen settled product decisions.

## Recorded state

R1 is complete. The existing implementation checkpoint is `4cc5562`
("fix: prepare revision-matched quick review probes"). The session-ending
commit containing this handoff also includes the `rg` alias correction, its
controlled/native probes and the live R1 outcome. Inspect git history for that
commit rather than assuming this file contains its own hash. No unrelated
uncommitted work was present when this handoff was written; all remaining
session changes belong in the same session-ending commit.

Read "R1 second-half harness checkpoint" and "Completed increment: R1, second
half" in `ROADMAP.md`. Do not repeat that work:

- Matching fixtures have a real committed head, explicit session cwd, matching
  fixture metadata/content/POST binding and post-gate drift thresholds of 4.
  The default dirty mismatched fixture still proves refusal without inference.
- Live harnesses fetch and detach pinned heads only in disposable new
  checkouts, never in user repositories.
- With `gpt-5.6-terra`, `builtin:grep` is exposed as `rg`. The exact-tool
  assertion and hook accept that alias without widening the three built-in
  grants. Native `rg` and `grep` confinement were demonstrated separately.
- The first authorized live attempt stopped before inference on that alias
  mismatch. After correction and separate explicit retry authorization, exactly
  one live quick review of `primait/starsky#8126` ran at head
  `06155b5ea4ed2d97656d65fc4c24a2799c0a44cd`, using `gpt-5.6-terra` / `high`.
  It made 18 `rg`, 5 `glob` and 4 `view` calls, all successful, with no denials.
  Findings stayed zero; the earlier recorded three missing-source gaps
  disappeared, leaving two informational caveats. This demonstrates context use,
  not detection of a missed bug or successful compilation.
- The runtime reported 27.89347 AI credits. No adjudicator ran because there
  were no candidates. Selection was empty, publication was not attempted, the
  retained result settled, and the disposable checkout was removed.
- Verbatim evidence, charge values, session IDs and reproduction commands are
  recorded in the roadmap. Read traces and billing are in raw timeline evidence,
  not the retained inspection schema. No cold transcript recovery was added.

## Implement only the exact next increment

Implement **the balanced half of M1**, as specified at the end of `ROADMAP.md`.
R1 needs no further inference. M1 remains pending until full mode lands in a
later increment.

Acceptance criteria:

1. `--balanced` runs four heavy specialists (correctness, contracts, security,
   performance/resources) and one light overview reviewer. Balanced becomes the
   default when no mode is supplied; flags stay mutually exclusive and
   `--major-only` remains the quick alias.
2. Resolve the light tier through existing personal/trusted-project/ambient
   layering, and show the effective assignment and origin before execution.
3. Apply the existing evidence validation and deduplication with the balanced
   findings policy from `SCOPE.md`: P0-P2 plus at most three direct-diff P3/nits.
   Preserve incomplete coverage and cancellation semantics.
4. Keep selection, retention and publication gates unchanged. Add no full/deep,
   fallbacks, timeouts, safeguards, reviewer shell tools, gate override,
   configuration surface or interactive menu. Keep L1 pending; copy no upstream
   source. Do not alter user checkouts to satisfy the revision gate.
5. Demonstrate with controlled probes and no-inference installed-runtime
   plumbing first. Any live balanced review requires new explicit authorization
   in that session. The R1 authorizations are consumed, not reusable.

## Runtime and validation caveats

- Consult the installed SDK and current official documentation before adopting
  runtime APIs. Installed SDK:
  `~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`. Demonstrate capabilities;
  declarations and plugin format support alone are not proof.
- Reinstall with `copilot plugin install "$(pwd)"` after every extension change,
  before running installed-runtime probes. The deprecation warning is expected.
- Controlled suites (no inference/network):
  `node scripts/smoke-<name>.mjs` for `findings`, `quick`, `selection`,
  `retention`, `preview`, `publication`, `publish-later`, `checkout`, `config`,
  `context`, `fixture`, `target`. All twelve passed in the R1 session. Also run
  `git diff --check`; prefer targeted validation while implementing.
- Installed probes require both `COPILOT_CLI_PATH="$(command -v copilot)"` and
  `COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk"`.
  No-inference probes include `smoke-runtime.mjs --targets --startup`,
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs` and `smoke-reviewer-tools.mjs`.
  Give the last probe `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` or
  `PR_REVIEW_HEAVY_MODEL=claude-sonnet-5` to exercise both search spellings.
- A matching fixture's capture and production gate were demonstrated without
  inference; fixture inference/publication suites were not rerun for R1.
  Do not describe them as live-inference evidence.
- Harness `--quick` spends credits. Most legacy harness paths run multiple
  reviews; `smoke-runtime.mjs --quick --once` limits its path to one.
  `--read-live` additionally requires explicit `PR_REVIEW_LIVE_REPOSITORY`,
  `PR_REVIEW_LIVE_NUMBER`, and `PR_REVIEW_LIVE_HEAD` values. Never rerun the
  recorded R1 command or publish without new applicable authorization.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.

## Commit and final-file handoff rules

Commit locally at meaningful validated checkpoints with the trailer
`Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
Stage only checkpoint files; preserve unrelated changes. Do not amend, rewrite
history or push. Record evidence and remaining limitations in `ROADMAP.md`
before committing; a checkpoint does not by itself complete an increment.

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
