# Next-session handoff prompt

Continue this project from its recorded repository state.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for progress, demonstrated runtime evidence, caveats, and the
exact next increment. Inspect git status, recent commits, and implementation
before editing. Do not depend on prior conversations or reopen settled scope
decisions. Reconcile this handoff with git state if necessary.

## Recorded state

The preceding checkpoint is `ac3599d` (Q2). The session-ending commit containing
this handoff completes Q3; inspect git log for its hash. All Q3 implementation,
exercises, README/roadmap updates, and this handoff belong in that commit.
There was no unrelated or unfinished work when this handoff was written.

`/pr-review NUMBER --quick --no-comment` now captures and binds PR input, then
dispatches three concurrent heavy specialists: correctness, contracts, and
combined security/performance/resources. `--major-only` is the alias; exactly
one quick spelling is required. A bare number still captures context without
reviewers. Existing draft/bot/empty/closed gates remain in place.

`extensions/pr-review/quick.mjs` owns argument parsing, assignments, prompts,
target binding, and quick orchestration. The F2/F3 machinery is shared rather
than duplicated: `reviewAssignments` and `validateModelAssignment` live in
`fixture.mjs`, while `executeOwnedRun` lives in `fixture-run.mjs`. The extension
owns one active review at a time, with independent reviewer sessions inside a
plugin-owned stdio runtime. Command dispatch returns after acceptance so
cancellation remains available.

Optional `heavyModel=ID` and `heavyEffort=LEVEL` are invocation-local. Unset
fields independently inherit the parent session's current model/effort; all
three specialists share the heavy-tier assignment. Invalid/unavailable models
or incompatible effort fail without substitution. No saved configuration,
fallback, nearest-saved-tier logic, or project trust was added. An unset ambient
effort uses the owned runtime's resolved default, displayed before prompts;
that branch is demonstrated by pure tests only. Explicit and ambient high
effort with `claude-sonnet-5` were demonstrated through real inference.

The prompts supply captured diff and Q2 context as untrusted JSON data, with
appended system instructions to ignore embedded requests, use no local evidence
or tools, and report only substantiated P0-P2 candidates with evidence and
severity/confidence/location. The code-owned binding records repository/PR,
head/base SHAs, diff/context hashes, and paths with source provenance, and is
attached to each reviewer output.

**The prose and its citations remain untrusted and unvalidated.** Binding an
output envelope does not make its claims correct. The live exercise produced
low-confidence candidates (including 0.4) and potential duplicate/pre-existing
claims; these are not accepted findings. Q4 is required before presenting
validated review findings.

`Q3 evidence:` follows cleanup. `complete: true` means successful specialist
execution with matching subscription usage and clean cleanup, not a clean PR.
Partial/failed reviewers retain their output without discarding successful
peers. Capture skips/declines/unconfirmed closed PRs have `coverage: "not-started"`
and start no reviewer runtime. Errors and cancellation show incomplete coverage.
No result cache, selection, publication, or safeguards exist.

## Implement Q4 only

Validate evidence, severity/location/confidence, and deduplicate quick
specialist candidates; demonstrate a real `--quick --no-comment` result with
validated findings.

Acceptance criteria:

- Define a strict candidate/result boundary for Q3 output. Malformed,
  incomplete, unsupported, or out-of-binding claims cannot silently become
  findings or clean coverage. Do not introduce the dropped experimental
  malformed-output extraction behavior.
- Validate accepted candidates against the captured diff and Q2 evidence:
  repository/head/path/side/lines, concrete impact, confidence/severity, and
  whether the diff introduced the defect. Quick results contain substantiated
  P0-P2 only. Model assertions are not independent validation.
- Deduplicate reports of the same defect across specialists without merging
  distinct issues merely because they share a file or location. Preserve the
  human-readable severity, location, confidence, and review structure.
- Preserve useful validated findings from degraded runs, with incomplete
  coverage visible. Neither completed execution nor zero accepted candidates
  justifies an unsupported clean-review claim.
- Extend the existing Node.js/assert exercises for accepted/rejected candidates,
  false positives/pre-existing claims, provenance, deduplication, malformed
  output, and incomplete coverage. Record real installed-plugin PR inference
  evidence separately from deterministic probes and assumptions.

Keep Q3 assignment, isolation, progress, cancellation, no-timeout, and cleanup
guarantees. Do not implement selection, retained-result caching, publication,
saved configuration, other modes, fallback, or safeguards. Do not switch
branches, fetch/reset the checkout, or modify reviewed source. Respect
`SCOPE.md`; keep L1 pending unless separately authorized and copy no upstream
source.

## Evidence and runtime caveats

- CLI 1.0.83 / bundled SDK / Node.js 26.1.0 / macOS arm64 is the demonstrated
  environment, not a portability claim. Consult the installed SDK and current
  official docs before choosing new runtime APIs.
- Final controlled Q3 runs showed three-way overlap of 2006 ms (explicit) and
  2445 ms (ambient alias). Live public `github/copilot-sdk#2543` showed 87406 ms
  and 74162 ms, respectively, on the immutable Q2 target. Both normal completion
  and cancellation have identified owned-process exit evidence. All pinned
  identities, reviewer sessions, timings, and commands are in `ROADMAP.md`.
- Pure Q3 exercises cover partial failures, wrong/missing usage, tool attempts,
  setup/capture/cleanup failures, cancellation, and a late closed-PR
  confirmation. The refactored F2 inference run passed with distinct models and
  1970 ms overlap. The full native F3 adversarial/loss/SIGSTOP suite was not
  rerun for Q3; do not claim it was.
- Reviewer configuration discovery is disabled, initialized tool sets must be
  empty, pre-tool hooks deny all invocation, and permissions are denied. F3's
  native denial evidence hits the hook, not the permission callback. This is
  capability isolation, not an OS sandbox or proof of prompt-injection immunity.
- `/pr-review cancel` aborts local waiters and force-stops the owned runtime;
  retain force-stop for unresponsive runtimes because abort RPCs can hang.
  Disposed-connection abort errors after force-stop remain visible. Normal
  completion uses `client.stop()`. SIGTERM/SIGINT/parent EOF stop owned work.
  A lost parent cannot receive a completion report.
- Quick capture passes an AbortSignal into `gh` and its confirmation waiter.
  Cancelling a pending host dialog may leave that UI visible, but a late answer
  cannot resume capture. Native UI cancellation was not demonstrated; the
  cancellation/late-answer check is a pure controlled exercise.
- No review timeouts or elapsed-time fallbacks. A single-in-flight connection
  probe interrupts only on actual RPC failure. A connected hung reviewer waits
  indefinitely until manual cancellation. Real Q3 inference took minutes.
- Q2 provenance, hunk/blob checks, and GitHub path-to-blob trust remain as
  recorded. Local checkout source is never evidence. No prompt-size budget,
  context truncation strategy, capture retry, or rate-limit handling was added.
  Inputs too large for the runtime/provider must remain visible failures.
- `gh` must already be authenticated. Local stored authentication is
  demonstrated; token-only environment forwarding is not. Remote sessions are
  rejected; Enterprise and other operating systems remain unproven.
- Context and results are invocation-local, not P2 caching. SDK transcripts may
  persist; there is no plugin cross-command/cross-session archive.
- Reinstall with an absolute path after extension edits and use a fresh runtime.
  Do not use `copilot -p '/pr-review ...'` as command dispatch.
- Pure commands: `node scripts/smoke-fixture.mjs`,
  `node scripts/smoke-target.mjs`, `node scripts/smoke-context.mjs`, and
  `node scripts/smoke-quick.mjs`.
- Runtime `--targets` uses a child-only `gh` fixture; `--target-live` uses
  pinned public GitHub evidence. Run them separately. Adding `--quick` spends
  subscription credits and requires the two explicit heavy environment
  settings documented in `README.md`. Without `--quick`, these variants remain
  no-inference. Do not put `scripts/fixtures` in the normal PATH.
- Runtime `--fixture` / `--f3` spend credits and use the four explicit F2
  settings in `README.md`. Process probes identify only their own descendants.
  A harness cleanup intervention is not successful plugin-cleanup evidence.

## Commit and hand off

Follow `AGENTS.md`: validate coherent progress, inspect diffs, update
`ROADMAP.md` with evidence, limitations, reproduction, and the exact next
increment, then commit relevant checkpoints. Preserve unrelated work.
Do not amend, rewrite history, or push.

After implementation, validation, and all other documentation updates, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit. Carry
these rules forward, reference an existing checkpoint rather than the commit
being written, and identify remaining uncommitted work honestly. Report the
commit outcome and point to `HANDOFF.md` without duplicating its prompt.
