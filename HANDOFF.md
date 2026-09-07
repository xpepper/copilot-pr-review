# Next-session handoff prompt

Continue from recorded files, not prior conversations.

Read `AGENTS.md`, `SCOPE.md` as the authoritative product specification, and
`ROADMAP.md` as the progress/evidence record. Inspect git status, recent commits
and implementation before editing. Reconcile this prompt against them if
necessary. Implement only the next recorded increment; do not reopen settled
product decisions or assume access to this conversation.

## Recorded state

P5 is complete. Implementation checkpoint **`f698df6`** follows P4 `5df3083` and
its evidence/handoff commit `157747b`. Nothing was pushed in the P5 session:
`origin/main` was still at `157747b`, so local `main` is ahead. **Do not push
without new explicit authorization.**

At handoff creation the uncommitted files are `HANDOFF.md`, `README.md`,
`ROADMAP.md`, `scripts/runtime-selection.mjs`, `scripts/smoke-preview-runtime.mjs`,
`scripts/smoke-publication-live.mjs`, `scripts/smoke-publication-runtime.mjs`,
`scripts/smoke-retention-runtime.mjs` and new
`scripts/smoke-publish-later-runtime.mjs`. All belong to the validated final P5
evidence checkpoint and should be in the commit containing this prompt. No
unfinished or unrelated work is carried forward, and no background work is
pending.

**`/pr-review publish` really publishes.** It takes no argument, publishes only
this session's retained selected findings, and starts no inference. Selection,
run authority and this later authorization remain independent, and reviewers
stay read-only.

Relevant implementation:

- `publish-later.mjs` owns the command. It refuses offline a missing, pending,
  malformed, wrong-session, cancelled or unselected record, a record older than
  schema version 2, a result that already succeeded, and an unresolved
  `in-flight`/`uncertain` write. A definite `failed` write may be republished
  only by a new invocation that reruns every gate under a new authorization.
- Invoking the command **is** the new explicit authorization that `SCOPE.md`
  allows in place of a final confirmation. It never consults a UI and never
  reuses retained `--comment`, configuration or confirmation authority; a
  `--no-comment` run is therefore publishable later.
- Retention holds no captured `evidenceBoundary`. Publication refetches the
  repository identity, PR metadata, diff and both reviewed source revisions via
  `assembleContext`, rebuilds `evidenceBoundary` and `buildReviewPreview`, and
  compares the result with the retained proposal when one exists. Stored
  citations and `reviewRequest` reconstruction alone are never accepted.
- `publication.mjs` now exposes shared `verifyPublicationTarget` (repository/PR
  identity, head/base, draft, non-open, diff fingerprint, plus a `recheck()`
  used immediately before dispatch) and `dispatchPublication` (write-ahead
  journal, single POST, outcome interpretation). `publishCurrent` is unchanged
  behaviorally and still stamps no authority.
- Records are version 4 only when `publication.authority` is present, which
  requires an attempted write and an invocation distinct from the review's.
  Versions 1-3 stay readable exactly as written; a current-run write stays
  version 3. `publication.status` is authoritative; legacy `preview.submitted`
  is not the write state.
- A refused publish-later writes nothing, leaving the retained record
  byte-identical, and never marks a historical review cancelled. Cancellation
  before dispatch stops without a write; after dispatch it adds `cancelRequested`
  without claiming the remote write was undone. The final cancellation check and
  atomic rewrite still precede no awaited call.
- Publication holds the session's active-work slot through `startRun(...,
  { ownsRuntime: false })`, so a concurrent review is refused and
  `/pr-review cancel` still stops it. The generic failure log is now
  `Review/publication failed:`; harnesses listen for that string.

## Implement C1 only

Follow the exact C1 acceptance criteria at the end of `ROADMAP.md`: personal
tier configuration inspection and updates through text commands, with validated
capabilities, inheritance and flag precedence.

Do not implement project-override trust (C2), other review modes, fallbacks or
safeguards, and do not change publication behavior. Keep L1 pending and copy no
upstream source. A repository must not be able to authorize itself, so do not
read repository-provided configuration in this increment. Prefer the existing
no-inference runtime probes over new inference spend for plumbing evidence.
Consult the installed SDK and current official documentation before choosing new
runtime APIs, and demonstrate capabilities instead of inferring them.

## Demonstrated behavior and runtime caveats

CLI 1.0.83 / bundled SDK, Node 26.1.0, macOS arm64. Explicit native inference
assignment `gpt-5.6-terra` / `high` is evidence, not a product default.

Seven installed-plugin publish-later cases passed: publish, stale, uncertain
(HTTP 503), cancel, reject (HTTP 422 plus a gated retry), draft and cold resume.
Each ran a real `--all --no-comment` review first, reloaded the extension, then
published the reloaded on-disk record. No publish command produced any
`assistant.*`, `subagent.*`, `tool.execution_start` or `user.message` event, and
none left an owned process. Sessions, PIDs and digests are in the roadmap. One
earlier `stale` attempt stopped because that inference run validated no finding;
that is fallible model output, and the harness performs no automatic retry.
`smoke-publication-runtime.mjs --cases=comment`, `smoke-runtime.mjs --targets`
and `smoke-retention-runtime.mjs` also passed after the shared-gate refactor.

The user authorized synthetic remote branches/commits/PRs through the GitHub
API. **Both playground PRs already hold a published plugin review; do not repeat
either POST and never merge these branches.**

- PR **#1** (P4), open, base `playground/p4-base-20260907` at
  `155ed469b9f098e435435f020b2f4639abf9809a`, head
  `playground/p4-regression-20260907` at
  `a68b6cd97f2bbfdca28bda4e7fb20bcf48205b32`. Review `5130714400`, comment
  `3948685115`, thread `PRRT_kwDOUQilZc6f3tE8`, INCOMPLETE coverage. Session
  `ae279b4d-53e7-4116-9ccd-86248db90b73`.
- PR **#2** (P5), open, base `playground/p5-base-20260907` at
  `160ec104c5fcd9f6028acd76e4a421a153dbc743`, head
  `playground/p5-publish-later-20260907` at
  `64383e445ffff9677f1958a83829232f2089f0ce`. Review `5131451227`, comment
  `3949275074` at `playground/discount.mjs:5` RIGHT, thread
  `PRRT_kwDOUQilZc6f5Mm6`, completed coverage. Session
  `835f1310-a525-42be-a496-e31926ec008c`, version-4 digest
  `240ad077014d16e3fd48d843d3cdefe0983e6015efcbf4245ce3f8517163841d`.

Command-only SDK sessions still cannot cold-resume; the resume case needs one
harness-only parent turn. Do not manufacture transcript history or spend hidden
inference in plugin code. The final GET/POST is still not an atomic
compare-and-submit transaction, storage has no cross-process lock or power-loss
guarantee, live LEFT/multiline/rename/deletion anchors remain unproven, and Q4
semantic/context-window and F3 process-loss limits are unchanged.

## Reproduction

```sh
node scripts/smoke-publish-later.mjs
node scripts/smoke-publication.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-publish-later-runtime.mjs --cases=publish,stale,uncertain,cancel,reject,draft
```

Run `--cases=resume` alone for the cold-resume case. These native commands spend
credits and are never retried automatically. Fixture `gh` stays in child-only
PATH; never expose it to ordinary commands. Reinstall after extension edits,
then use a fresh runtime. Direct local install still works with a deprecation
warning; marketplace migration is not this increment.

For safe existing live evidence, with no SDK/inference or mutation:

```sh
node scripts/smoke-publication-live.mjs --pr=2 \
  --head=64383e445ffff9677f1958a83829232f2089f0ce \
  --verify-record="$HOME/.copilot/session-state/835f1310-a525-42be-a496-e31926ec008c/pr-review-result.json"
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
