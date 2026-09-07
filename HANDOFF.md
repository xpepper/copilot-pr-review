# Next-session handoff prompt

Continue from recorded files, not prior conversations.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification and
`ROADMAP.md` as the progress/evidence record. Inspect git status, recent commits
and implementation before editing. Reconcile this prompt against those sources
if necessary. Implement only the next recorded increment; do not reopen settled
product decisions.

## Recorded state

Implementation checkpoint **`1b6576e`** completes P3 after P2 `083684a` and
handoff `cf2db2f`. The session-ending documentation commit containing this
prompt records that checkpoint in the roadmap; inspect git log for its hash.
At handoff creation only `ROADMAP.md` and `HANDOFF.md` are uncommitted, both for
that final documentation commit. No unfinished or unrelated work is carried
forward. No GitHub mutation, push or merge was performed.

Quick review accepts exactly one of `--quick` / `--major-only`, optional
`--comment` or `--no-comment` (conflicting), and optional `--all`. A bare PR
number remains capture-only. Quick runs three heavy specialists, validates and
deduplicates, stops inference, selects findings, displays a code-built COMMENT
proposal, resolves posting authority and retains the settled result. **Even
`--all --comment` submits nothing in the current implementation.**

Relevant implementation:

- `quick.mjs` owns parsing, assignments, captured binding and orchestration.
  Its captured `evidenceBoundary` survives through selection into preview.
- `findings.mjs` owns strict candidates/adjudication, whole-claim support,
  exact source checks, deduplication and formatting. Only canonical
  `validation.findings` may be selected or turned into comments.
- `selection.mjs` exports the shared `selectionBinding` and owns
  invocation/session/repository/PR/head-bound selection. `interaction.mjs`
  makes late cancelled UI answers inert.
- `preview.mjs` owns `postingAuthority`, `buildReviewPreview`, `finishPreview`,
  `reviewRequest`, `validatePreview` and `cancelPreview`. Effective
  `autoPostReviews` is a boolean calculation seam, default false, not a saved
  setting or accepted command argument yet. Selection and authority are separate.
- `buildReviewPreview` rechecks quotations, provenance, changed-line inclusion
  and same-hunk ranges against captured evidence. `reviewRequest` reconstructs
  the expected REST-shaped request for retention validation; it is NOT a
  current-head/diff check and must not substitute for P4 publication gates.
- The request envelope contains the full selection binding plus
  `payload: { commit_id, event: "COMMENT", body, comments }`. Head/base anchors
  use RIGHT/LEFT and optional `start_line`/`start_side`. Renamed-file base
  citations map to the current diff path; deleted files keep the old path.
  Every current finding requires an inline anchor. There is no eligible
  non-inline category; invalid anchors must not become body-only fallback.
- `retention.mjs` stores strict version-2 unsubmitted previews and still
  inspects legacy version-1 P2 records without fabricating authority. New
  records retain policy/status/authority/request plus findings and coverage.
  All preview schemas currently require `submitted: false`.
- `retained-run.mjs` writes a pending marker before capture, then the final
  record synchronously after its last awaited log and cancellation check.
  `extension.mjs` clears `activeRun` in the same microtask checkpoint.
  Keep this boundary intact; `P2 evidence:` acknowledges the settled write.
- `/pr-review inspect` accepts no target/session argument, refuses active work,
  and reads the originating session's result without inference, GitHub calls,
  local source reads or head refresh. Retained authority is explicitly
  historical, not permission for a future run.

Cancellation currently clears selected IDs, revokes authority, drops the
actionable request and marks coverage incomplete while preserving findings.
P4 must NOT blindly apply this pre-submission model after a remote write:
cancellation cannot undo a mutation already received by GitHub.

## Implement P4 only

Implement the exact P4 increment and acceptance criteria at the end of
`ROADMAP.md`: code-controlled COMMENT publication for the **current run**,
with lifecycle/head/anchor gates and explicit uncertain-write handling.

- Only nonempty canonical selection plus current-invocation posting authority
  may reach a write. Preserve `--all` versus `--comment`, `--no-comment`
  suppression, missing/declined/invalid UI states and visible incomplete coverage.
- Bind the mutation to the originating repository identity/host, PR and
  reviewed head, not a later cwd. Recheck head and lifecycle before submission,
  reject changed heads and invalid anchors, and do not mistake a draft review
  override for publication permission. Consult the scope/upstream for exact
  lifecycle rules rather than assuming review capture authorizes publication.
- Send only code-built COMMENT payloads. Never APPROVE/REQUEST_CHANGES,
  model-created mutation commands, stale publication or body-only fallback.
- Distinguish no attempt, definite failure, confirmed success and uncertain
  outcome. Record write state sufficiently to avoid blind retries after
  transport loss/interruption. After a write may have reached GitHub,
  cancellation must not falsely claim nothing was published.
- Extend strict retention/publication schemas deliberately. Do not reinterpret
  old unsubmitted previews or reuse historical authority. Update affected
  preview-only user messaging when submission becomes real.
- Demonstrate positive and negative gates, exact requests and ambiguous failures
  through controlled and installed-plugin probes. A preview is not evidence that
  GitHub accepts its anchors. Record any remaining live-evidence gap honestly.
- Consult installed SDK and current official docs before choosing runtime APIs.
  Preserve no-timeout execution, cleanup, selection and session-bound storage.

Do not implement cached publish-later execution (P5), configuration, other modes,
fallbacks, safeguards or a cross-session archive. Keep L1 pending and copy no
upstream source. Do not modify reviewed source, switch branches, or fetch/reset
the checkout as part of review.

The user permits `xpepper/copilot-pr-review` as a synthetic PR playground,
including creating synthetic PRs and running reviews, but **never merge those
PRs into main**. Do not push. Use a suitable existing target if remote setup
would require conflicting permissions; clarify instead of working around the
no-push instruction.

## Demonstrated behavior and caveats

CLI 1.0.83, bundled SDK, Node.js 26.1.0, macOS arm64. P3 native inference used
explicit `gpt-5.6-terra` / `high`, not a product default or fallback. Native
SDK-host forms are real RPC interactions, not human terminal click evidence.

`scripts/smoke-preview-runtime.mjs` demonstrated six native cases: all plus
comment authority, pending-confirmation cancellation with inert late acceptance,
final confirmation acceptance, subset selection despite `--comment`, final false
answer, and missing confirmation UI. Every case produced positive validated
findings, used exactly three specialists plus one validator, exited owned
inference before UI, and preserved the exact record after reload. The UI-less
case retained useful findings with explicitly incomplete coverage because a
specialist reported missing caller context.

Session `0c15e99d-3e02-45b2-8aca-1b2a4ca65733` also demonstrated exact version-2
record preservation through cold resume in a fresh runtime after one harness-only
parent initialization turn. Its final digest was
`1ba86e9186d97479b1ceeaa80e942bb0f58338c80c808c4a8451b55ddf7dcc94`.
All IDs, digests, PIDs and reproduction commands are in the P3 roadmap section.

**Command-only SDK sessions still cannot cold-resume in this CLI:** they lack
resumable event history and return `Session not found` even after save/close.
The retained file survives and reload works. Do not fabricate transcript
history, initialize a model turn in plugin code or substitute another session.
`--parent-turn` is harness-only.

Controlled probes cover exact request fields, multiline/head/base anchors,
rename/deletion path mapping, invalid IDs/bindings, policy precedence,
degraded/empty/cancelled results, strict schemas and legacy compatibility.
An integrated probe cancels an already authorized proposal at the final
retention log and checks the actual atomic record has no authority/request/IDs.
No GitHub review endpoint was invoked; remote anchor acceptance and in-flight
write handling remain P4 work. No safeguard execution exists.

The digest detects corruption, not a local writer who can recompute it. Storage
uses host-reported local session metadata, not a guessed path. Remote/missing/
already-in-use workspaces fail explicitly; the host's in-use flag is not a
plugin-acquired cross-process lock. No OS sandbox or power-loss guarantee exists.
P2 storage and Q4 semantic/context-window limitations remain. Full F3 process
loss/SIGSTOP, native mid-write crashes, human resume clicks, real forks and
remote/other-platform clients were not re-exercised in P3.

Reinstall after extension edits and use a fresh runtime:

```sh
node scripts/smoke-preview.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-retention.mjs
node scripts/smoke-selection.mjs
node scripts/smoke-findings.mjs
node scripts/smoke-fixture.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-preview-runtime.mjs --cases=comment,cancel-pending,confirmed --parent-turn
```

Using the same environment, run `--cases=subset-comment,declined`, or separately
`--cases=unavailable` without `--parent-turn`. Each native case explicitly
spends inference credits; missing positive output is not auto-retried.
`scripts/smoke-runtime.mjs --targets` and `scripts/smoke-retention-runtime.mjs`
only need CLI/SDK paths and use no inference. Never put fixture `gh` in ordinary
PATH or use `copilot -p '/pr-review ...'` for deterministic command dispatch.
Local plugin install works but now emits a direct-install deprecation warning;
marketplace migration is not this increment.

## Commit and hand off

Follow `AGENTS.md`: inspect diffs, validate meaningful progress, update the
roadmap with evidence/limitations/reproduction and commit relevant checkpoints.
Preserve unrelated changes. Do not amend, rewrite history or push.

After implementation, validation and every other documentation update, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit. Carry
these rules forward, reference an existing checkpoint rather than the future
commit containing the handoff, and identify uncommitted work honestly. Report
the commit outcome and point to `HANDOFF.md` without duplicating its prompt.
