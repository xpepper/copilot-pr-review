# Next-session handoff prompt

Continue from recorded files, not prior conversations.

Read `AGENTS.md`, `SCOPE.md` as the authoritative product specification, and
`ROADMAP.md` as the progress/evidence record. Inspect git status, recent commits
and implementation before editing. Reconcile this prompt against them if
necessary. Implement only the next recorded increment; do not reopen settled
product decisions or assume access to this conversation.

## Recorded state

P4 is complete. Implementation checkpoint **`5df3083`** follows P3 `1b6576e`
and handoff `0f2a772`. The user subsequently authorized pushing this session's
completed work; `5df3083` was pushed to `origin/main`. The session-ending
evidence/handoff commit containing this prompt is intended to be committed and
pushed too; inspect git state for its actual outcome. Do not assume that this
session's push authorization applies to future sessions.

At handoff creation the uncommitted files are `README.md`, `ROADMAP.md`,
`HANDOFF.md`, `scripts/fixtures/gh`, `scripts/runtime-target.mjs`,
`scripts/target-fixture.mjs`, `scripts/smoke-preview-runtime.mjs`,
`scripts/smoke-quick.mjs` and new `scripts/smoke-publication-runtime.mjs`.
All belong to the validated final P4 evidence checkpoint and should be in the
commit containing this prompt. No unfinished or unrelated work is carried
forward. The delegated harness work is finished; no background work is pending.

**Quick `--all --comment` now really publishes.** A bare PR number remains
capture-only. Selection and authority remain independent, and reviewers stay
read-only. Only code-built COMMENT requests can be submitted.

Relevant implementation:

- `quick.mjs` owns parsing, captured binding, specialist/validator execution,
  selection/proposal and current-run publication. It retains the actual capture
  cwd and `evidenceBoundary` for publication, not a later session directory.
- `preview.mjs` constructs the exact canonical payload, checks quotations and
  anchors, and resolves current-run posting authority. `reviewRequest` can
  reconstruct a retained request but does NOT prove current source/diff/head.
- `publication.mjs` rechecks canonical selection/evidence, explicitly bound
  repository identity, PR identity, head/base SHAs, lifecycle and diff; it GETs
  PR metadata again immediately before a single POST. Drafts cannot publish.
  Upstream allows non-open publication only as summaries; all current findings
  need inline anchors, so closed/merged PRs cannot receive this payload even
  when review capture was overridden. No body-only or stale fallback exists.
- `retention.mjs` writes strict version-3 publication records, while versions
  1/2 remain inspectable without fabricated write state or new authority.
  `publication.status` is authoritative. Legacy `preview.submitted: false`
  describes only the proposal stage, NOT the actual submission outcome.
- Publication states are `not-attempted`, `in-flight`, `succeeded`, `failed`
  and `uncertain`. `persist` synchronously writes the flushed-file/atomic-rename
  journal before POST and the final outcome before awaited logging. Never
  replace this seam with an unawaited asynchronous write.
- A failed write-ahead checkpoint prevents dispatch; failed final persistence
  leaves the in-flight journal. 403/422 rejection is definite failure, whereas
  server/transport/interruption/malformed acknowledgment remains uncertain.
  There is no automatic retry. `retained-run.mjs` refuses a new quick run over
  an unresolved in-flight/uncertain record.
- Before dispatch cancellation clears IDs/authority and marks incomplete
  coverage. After dispatch `cancelPublication` preserves historical selection,
  authority and actual/uncertain write state, adding `cancelRequested`.
  Cancellation cannot undo a remote write; do not call `cancelPreview` on it.
- The final cancellation check/atomic retention write and same-microtask
  `activeRun` clearing remain intact. Inspection is session-bound, inference-free
  and read-only; it never refreshes GitHub or treats historical authority as
  permission to publish again.

## Implement P5 only

Follow the exact P5 acceptance criteria at the end of `ROADMAP.md`: explicit
publish-later for this session's retained selected findings, **without rerunning
reviewers or validators**.

Use a new explicit user publication action, not retained flag/config/confirmation
authority. A previous `--no-comment` run may be explicitly published later.
Retain original findings, canonical selected IDs, incomplete coverage and
repository/PR/reviewed-head binding. Reject missing, malformed, wrong-session,
cancelled or unselected results. Do not add a cross-session archive or editor.

Reestablish immutable source provenance and fresh diff/head/lifecycle gates
before constructing the mutation. The cache lacks the captured evidence boundary;
stored citations and `reviewRequest` reconstruction are not sufficient substitutes.
Do not use a later checkout's source or silently accept head/base/diff changes.

Preserve active-work exclusion, cancellation, write-ahead uncertainty and final
retention boundaries. Refuse blind repeats of confirmed or unresolved writes.
Fresh authorization and gates are necessary for any retry after definite failure.
Version schema changes deliberately, preserving old inspection compatibility.
Demonstrate no-inference behavior with controlled and installed-plugin probes,
including reload/supported resume. Consult installed SDK and current official
docs before choosing new runtime APIs.

No configuration, additional modes, fallback models, safeguards or source reuse.
Keep L1 pending. Do not switch branches or modify reviewed source as part of
review/publication.

## Demonstrated behavior and runtime caveats

CLI 1.0.83 / bundled SDK, Node 26.1.0, macOS arm64. Explicit native inference
assignment `gpt-5.6-terra` / `high` is evidence, not a product default.

Nine installed-plugin controlled cases passed: authorized all, stale head,
HTTP 503 uncertainty, cancellation while POST is held, HTTP 422 rejection,
final confirmation acceptance, refusal, suppression and draft transition.
Every case produced positive canonical findings, used exactly three specialists
plus a validator, stopped inference before posting, preserved exact JSON stdin,
and retained the exact record through reload/inspection. The fixture holds each
POST until the actual on-disk in-flight record is observed; cancellation checks
the owned POST process really exits. All sessions/digests/PIDs are in the roadmap.

Updated preview/selection compatibility also passed: authorized all, pending UI
cancellation with inert late acceptance, and subset selection despite `--comment`.
Session `d994ac73-b839-4c2e-9035-5b0591f2eda3` preserved its version-3 record through
conversation-backed cold resume; final digest:
`e03fe25a27c8b453d8856decd3d71941084a590b12efecb29957d7cdcf803bb4`.
One harness-only parent turn initialized resumable history. **Command-only SDK
sessions still cannot cold-resume**; do not manufacture transcript history or
spend hidden inference in plugin code.

The user authorized synthetic remote branches/commits through the GitHub API.
Playground **#1** remains open and unmerged, base
`playground/p4-base-20260907` at `155ed469b9f098e435435f020b2f4639abf9809a`,
head `playground/p4-regression-20260907` at
`a68b6cd97f2bbfdca28bda4e7fb20bcf48205b32`. Never merge these branches into main.

Real COMMENTED review `5130714400` created unresolved inline thread
`PRRT_kwDOUQilZc6f3tE8`, comment `3948685115`, at `playground/total.mjs:3` RIGHT.
The published summary correctly says INCOMPLETE because caller context was
missing. Session `ae279b4d-53e7-4116-9ccd-86248db90b73` retains the success.
**Do not repeat this POST.** The original live harness failed after publication
on its endpoint choice: per-review comments are position-only. The corrected
probe uses PR comments for line/side and verified the existing record read-only,
without another review. Live LEFT/multiline/rename/deletion acceptance remains
unproven; controlled payload gates cover those shapes.

Fresh GET/POST is not an atomic compare-and-submit transaction. Explicit
`commit_id` prevents silent head rebinding, but a concurrent update can still
make a just-submitted review outdated. Storage has no acquired cross-process
lock or power-loss guarantee; the digest detects corruption, not a writer able
to recompute it. Full F3 process-loss, human UI and other-client/platform
behavior were not re-exercised. Q4 semantic/context-window limitations remain.

## Reproduction

```sh
node scripts/smoke-publication.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-publication-runtime.mjs --cases=comment,stale,uncertain,cancel,reject,confirmed,declined,suppressed,draft
```

With the same explicit environment, run
`node scripts/smoke-preview-runtime.mjs --cases=comment,cancel-pending,subset-comment --parent-turn`
for selection/cold-resume compatibility. These native commands spend credits;
no missing positive output is silently retried. Fixture `gh` stays in child-only
PATH; never expose it to ordinary commands. Reinstall after extension edits,
then use a fresh runtime. Direct local install still works with a deprecation
warning; marketplace migration is not this increment.

For safe existing live evidence, with no SDK/inference or mutation:

```sh
node scripts/smoke-publication-live.mjs --pr=1 \
  --head=a68b6cd97f2bbfdca28bda4e7fb20bcf48205b32 \
  --verify-record="$HOME/.copilot/session-state/ae279b4d-53e7-4116-9ccd-86248db90b73/pr-review-result.json"
```

## Commit and hand off

Follow `AGENTS.md`: inspect diffs, validate meaningful progress, update the
roadmap with evidence/limitations/reproduction and commit relevant checkpoints.
Preserve unrelated changes; do not amend, rewrite history or push without new
explicit authorization.

After implementation, validation and every other documentation edit, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit. Carry
these rules forward and reference an existing checkpoint, not the future hash
containing that prompt. Report the commit outcome and point to `HANDOFF.md`.
