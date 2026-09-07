# Next-session handoff prompt

Continue from the recorded repository state, not from prior conversations.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification
and `ROADMAP.md` as the progress/evidence record. Inspect git status, recent
commits and implementation before editing. Reconcile this prompt against git
and those documents if necessary. Do not reopen settled product decisions.

## Recorded state

Implementation checkpoint **`a4d3b35`** adds Q4 after Q3's `de4f00a`.
The session-ending commit containing this handoff adds the whole-claim support
guard and final native evidence, completing Q4; inspect git log for its hash.
All remaining changes at handoff creation belong to that session-ending commit.
There is no unrelated or unfinished work to carry forward.

`/pr-review NUMBER --quick --no-comment` (or `--major-only`) now runs the
three heavy specialists, validates their evidence, adjudicates candidates,
deduplicates accepted defects and presents a human-readable findings result.
Exactly one quick spelling and `--no-comment` remain required. `--all` and
selection are not implemented. A bare number remains capture-only.

Relevant implementation:

- `quick.mjs` owns parsing, assignments, bound input and orchestration.
- `findings.mjs` owns strict candidate/decision schemas, `reviewKey`, evidence
  gates, adjudication processing, deduplication and findings formatting.
- `context.mjs` retains actual added/removed line numbers separately from hunk
  context. Q2 source remains blob-verified and revision-bound.
- `reviewAssignments` in `fixture.mjs` runs the three specialists concurrently,
  then a separate `evidence-validator` session when eligible candidates exist.
  The validator uses the effective heavy assignment in the same owned runtime;
  it is not a fourth specialist. Isolation, actual usage checks and progress
  are shared, not duplicated.
- `executeOwnedRun` in `fixture-run.mjs` still owns cleanup/error reporting.
  The extension's `activeRun` currently clears after runtime cleanup, before
  the final findings log. Inspect that lifecycle when wiring selection and
  cancellation; do not keep inference alive just to wait for selection.

`Q3 evidence:` is now the diagnostic envelope for both Q3/Q4. It includes
`binding`, `executionComplete`, `validation`, optional `adjudicator`, original
reviewer records, and post-cleanup `complete`/`cancelled`/`coverage`.
`validation.findings` is the only eligible selection input. It is code-built,
deduplicated, severity/confidence sorted and bound to the same invocation.
`validation.rejected`, `duplicates`, `issues` and raw reviewer output are not
additional selectable findings. IDs are invocation-local, not archive IDs.

Do not confuse execution completion with validated or complete coverage.
Valid findings survive failed peers, malformed siblings and unresolved context.
Final `complete: false` can therefore coexist with useful findings. Empty
findings never imply a clean PR. No cache, selection, publication, saved
configuration, other modes, fallback or safeguards were added.

## Q4 boundaries to preserve

- Exact versioned JSON only: no fence stripping, fragment recovery or malformed
  finding extraction. Wrong keys/binding/types and invalid evidence stay visible.
- Candidate admission requires P0-P2 and numeric confidence 0.8-1. Every source
  quote must match the delivered window exactly with path/side/lines/ref/blob
  provenance. Primary locations span at most ten lines inside a hunk and
  intersect an actual changed line.
- Introduction compares the same hunk's before/after evidence. A null side is
  allowed when that side has no actual removals/additions, even if unchanged
  context lines remain. Do not regress to requiring a zero-length hunk.
- Exact grounding is deterministic; causal/severity assessment is model-based
  and fallible. The validator must explicitly report `allClaimsSupported: true`
  before acceptance. A real core defect does not excuse a false detail or
  overstated trigger; reject the whole candidate rather than accepting it
  with a correction buried in the rationale. No finding editing is implemented.
- Duplicates require an explicit same-cause/trigger/impact decision plus shared
  changed-source evidence. Supporting citations may establish that shared cause
  across different primary anchors/files. Sharing a location alone never merges
  distinct issues. Original accepted reports and reviewer attribution survive.

## Implement P1 only

Select validated findings with a minimal UI and `--all`; no GitHub writes or
retained-result cache yet. The exact next increment is also in `ROADMAP.md`.

Acceptance criteria:

- `--all` selects every final validated/deduplicated finding, never raw/rejected
  candidates. It does not authorize posting. Keep `--no-comment` required;
  publication flags/authority remain P3.
- Without `--all`, provide explicit subset/none/cancel selection. Consult the
  installed SDK and demonstrate the chosen interface through the real installed
  plugin. Unsupported host UI must be explicit, not a silent select-all.
- Bind selections to the same invocation, session, repository, PR and reviewed
  head. Reject invalid/unknown selections rather than silently choosing other
  findings. Do not implement P2 caching/reload/resume to support this increment.
- Preserve human-readable severity/location/confidence and visible degraded
  coverage. Supported findings from incomplete runs remain selectable; skips,
  empty results and cancellation do not imply clean coverage.
- Preserve cancellation and no-timeout/cleanup guarantees through the selection
  lifecycle. Selection must not rerun reviewers or perform any GitHub write.
- Extend the existing Node.js/assert probes and record installed-plugin behavior
  separately from controlled tests, model judgments and SDK declarations.

Do not implement publication, cached publish-later, configuration, other modes,
fallbacks or safeguards. Respect `SCOPE.md`; keep L1 pending and copy no upstream
source. Do not modify reviewed source or switch/fetch/reset the checkout.

## Demonstrated behavior and runtime caveats

- CLI 1.0.83, bundled SDK, Node.js 26.1.0, macOS arm64 is the demonstrated
  environment, not a portability claim. Consult current official documentation
  and installed SDK before choosing new runtime APIs.
- Final Q4 native runs used explicitly configured `gpt-5.6-terra` / `high`,
  not a product default or automatic fallback. Both explicit and ambient-alias
  public `ptitSeb/box64#3902` runs accepted one P2 CPUID finding, confidence 0.99,
  merging all three specialist reports. Both kept one missing-context coverage
  issue visible. The precise revisions, fingerprints, sessions, timings, and
  source/known-fix assessment are in `ROADMAP.md`.
- Earlier real outputs included fenced JSON and partially correct claims.
  These exposed fail-closed behavior and the need for the whole-claim guard.
  Do not loosen gates just to make a native probe report completed coverage.
- Final controlled arithmetic inference retained supported findings while
  refusing an invalid reject-plus-duplicate decision and an overstated trigger.
  Pure semantic judgments are mocks; native inference is separate evidence.
- Normal completion and active-specialist/active-validator cancellation have
  owned-PID exit evidence, empty cleanup errors and unchanged checkout evidence.
  The complete native F3 adversarial/loss/SIGSTOP suite was not rerun for Q4.
- Reviewer configuration discovery is disabled, tool sets are asserted empty,
  hooks deny invocation, and permissions are denied. This is capability
  isolation, not an OS sandbox or proof of prompt-injection immunity.
- Force-stop is necessary for unresponsive runtimes because abort RPCs can hang.
  Disposed-connection abort errors after force-stop remain visible. No elapsed
  time triggers cancellation/fallback; connection probes react only to RPC failure.
- Q1's native confirmation UI exists, but its late-answer cancellation guard
  was demonstrated by controlled tests, not native UI cancellation. A pending
  host dialog can outlive a cancelled local waiter. P1 must handle late answers.
- Context windows and provider/input-size limits remain as recorded in Q2.
  There is no prompt truncation, automatic capture retry or rate-limit handling.
  Missing evidence is not replaced by local checkout evidence.
- Local stored `gh` authentication is demonstrated; token-only forwarding,
  Enterprise, other operating systems and remote sessions remain unproven or
  rejected. SDK transcripts may persist, but there is no plugin archive/cache.
- Reinstall with `copilot plugin install "$(pwd)"` after extension edits and
  use a fresh runtime. Do not use `copilot -p '/pr-review ...'` as command dispatch.
- Pure probes: `node scripts/smoke-fixture.mjs`, `node scripts/smoke-target.mjs`,
  `node scripts/smoke-context.mjs`, `node scripts/smoke-quick.mjs`, and
  `node scripts/smoke-findings.mjs`.
- Runtime `--targets` uses child-only controlled `gh` responses; quick target 12
  is the original multiplication regression. `--regression-live` uses pinned
  public `ptitSeb/box64#3902`; `--target-live` retains the older SDK workflow
  target. Run variants separately. Adding `--quick` spends subscription credits
  and uses the explicit environment settings in `README.md`/`ROADMAP.md`.
  Without `--quick`, target variants are no-inference. Do not put fixture `gh`
  in the normal PATH. A harness kill is not successful plugin-cleanup evidence.

## Commit and hand off

Follow `AGENTS.md`: inspect diffs, validate coherent progress, update
`ROADMAP.md` with evidence, limitations, reproduction and the exact next
increment, and commit relevant checkpoints. Preserve unrelated changes.
Do not amend, rewrite history or push.

After implementation, validation and every other documentation update, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit. Carry
these rules forward, reference an existing checkpoint rather than that future
commit, and identify uncommitted work honestly. Report the commit outcome and
point to `HANDOFF.md` without duplicating its prompt.
