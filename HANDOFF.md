# Next-session handoff prompt

Continue from recorded files, not prior conversations.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification and
`ROADMAP.md` as the progress/evidence record. Inspect git status, recent commits
and implementation before editing. Reconcile this prompt against those sources
if necessary. Implement only the next recorded increment; do not reopen settled
product decisions.

## Recorded state

Implementation checkpoint **`083684a`** completes P2 after P1's `c0d3d16` and
handoff `55a3a8a`. The session-ending documentation commit containing this prompt
adds that checkpoint reference to the roadmap and replaces this handoff; inspect
git log for its hash. At handoff creation, only `ROADMAP.md` and `HANDOFF.md` are
uncommitted, both belonging to that final commit. No unfinished/unrelated work
is carried forward. No GitHub mutation, push, or merge was performed.

Quick review still requires exactly one of `--quick` / `--major-only` and
`--no-comment`. It runs three heavy specialists, validates and deduplicates,
stops inference, selects through native elicitation or `--all`, and now retains
the settled result. A bare PR number remains capture-only. No posting authority,
payload, GitHub publication, publish-later execution, saved configuration, other
mode, fallback or safeguards exist.

Relevant implementation:

- `quick.mjs` owns parsing, assignments, captured input and review orchestration.
  It accepts an optional invocation identity from the retention wrapper.
- `findings.mjs` owns strict candidate/adjudication schemas, `reviewKey`, exact
  evidence checks, whole-claim support, deduplication and formatting. Only
  `validation.findings` is selectable; raw/rejected/duplicate aliases are not.
- `selection.mjs` owns invocation/session/repository/PR/head-bound choice values
  and canonical selected IDs. `interaction.mjs` makes late cancelled UI answers
  inert. `reviewComplete` and final `complete` describe coverage, not publication.
- `retained-run.mjs` creates a pending record before capture, then executes quick
  review and selection. After the last awaited log, cancellation is checked and
  the final record is synchronously written with no intervening await.
- `retention.mjs` owns strict version-1 record projection/validation and storage.
  It uses the SDK's host-reported local session workspace, not a guessed home
  path. `pr-review-result.json` is one latest-result slot per originating session.
  Files are mode 0600, flushed and atomically renamed. New accepted quick runs
  supersede old results; capture-only/fixture commands do not.
- `extension.mjs` keeps `activeRun` until the entire run, selection and retention
  settle; its `.finally(clearRun)` runs in the same microtask checkpoint as the
  final synchronous write. Keep this cancellation boundary intact. Only then is
  `P2 evidence:` logged. Retention failures are explicit timeline errors.
- `/pr-review inspect` reads the latest record without inference, GitHub calls,
  head refresh or source reads. It accepts no PR/session argument, refuses active
  review work and displays the originating target even if cwd changed. It is not
  a current-head check or a publish command.

Retention keeps canonical findings with quotations/source provenance, complete
Q4 binding, selection status/IDs/binding, reviewer/model/usage attribution,
rejection/duplicate reasons and coverage/error state. It drops raw outputs and
duplicate candidate bodies; full captured diff/context is not stored. Pending
records from interruption have no actionable selection. Cancellation clears IDs.
Remote/missing/mismatched workspaces and sessions reported already in use fail
explicitly. The host's in-use flag is not a lock acquired by this plugin.

P3 will need to update the parser's required `--no-comment` rule and coordinate
with the strict retention schema (`noComment` currently must be true); do not
silently reinterpret incompatible records or pretend a preview was submitted.

## Implement P3 only

Resolve posting authority/conflicting flags and display a code-built inline
review payload **without submitting it**. Follow the exact next increment in
`ROADMAP.md` and the settled controls in `SCOPE.md`.

- Keep selection separate from authority: `--all` selects validated findings,
  `--comment` bypasses final confirmation but not selection, `--no-comment`
  suppresses posting, and the two posting flags conflict. With neither flag,
  consume effective `autoPostReviews`, default false. Do not implement saved
  configuration yet; leave the authority calculation ready for C1/C2.
- Without automatic authority, require explicit final confirmation before
  treating a proposed payload as authorized. Missing UI, decline, cancellation,
  empty selection and incomplete coverage must remain visible. Posting flags
  never authorize project safeguards.
- Build the preview in code from canonical selected findings and their exact
  repository/PR/head binding and validated diff anchors. Preserve applicable
  concise-summary behavior for non-inline findings. Only COMMENT is allowed;
  never APPROVE or REQUEST_CHANGES. Make non-submission explicit even for
  `--all --comment`.
- Preserve P1/P2 cancellation, no-timeout, coverage, selection, storage and
  reload/resume behavior. Extend probes for authority combinations, UI refusal,
  invalid selections/bindings and exact payload shape. Demonstrate native
  code-owned preview without GitHub mutation or hidden reviewer reruns.
- Consult installed SDK and current official docs before choosing runtime APIs.
  Record evidence and limitations rather than inferring support from declarations.

Do not implement GitHub submission (P4), retained publish-later execution (P5),
configuration, additional modes, fallbacks or safeguards. Keep L1 pending; copy
no upstream source. Do not modify reviewed source, switch branches, or fetch/reset
the checkout as part of review. The user permits `xpepper/copilot-pr-review` as a
synthetic PR playground, but never merge synthetic PRs into main. That permission
does not override the current no-push instruction; P3 needs no remote PR.

## Demonstrated behavior and caveats

CLI 1.0.83, bundled SDK, Node.js 26.1.0 and macOS arm64. Native P2 inference used
explicit `gpt-5.6-terra` / `high`, not a product default or fallback.

Real quick target 12 retained one validated P2 finding, merged a duplicate, and
completed coverage. Extension reload and **same-session cold resume in a fresh
runtime preserved the exact record** for session
`802d0a8b-b17b-4fc3-a214-539dc3d958f8`. This session included one ordinary parent
model turn solely to initialize a resumable conversation.

**Command-only SDK sessions cannot cold-resume in this CLI:** they lack resumable
event history and return `Session not found`, even after native save/close.
The retained file survives and extension reload works. The plugin does not
fabricate history, bootstrap a model turn, or substitute another session.
`--parent-turn` is a harness-only option; it is not plugin behavior.

Native target 13 probes retained and inspected subset (1/2), none (0/2), and
pending-form cancellation (zero selected; findings and incomplete coverage
preserved). Owned inference PIDs exited before UI; duplicate invocations were
refused; late acceptance after cancellation was inert. Native lifecycle probes
also demonstrated new-session isolation, copied wrong-session record rejection,
incompatible schemas, and controlled pending-marker inspection. Exact IDs,
digests, PIDs and commands are in the P2 roadmap section.

Controlled storage probes cover malformed records, changed binding/selection IDs,
raw/rejected/duplicate exclusion, degraded/empty/cancelled states, write/read
failure, unavailable/remote/in-use workspaces, and interrupted replacement.
Positive controlled adjudication is fixture plumbing, not semantic inference.
The digest detects corruption, not a malicious local writer who can recompute it.
No OS sandbox, plugin-acquired cross-process lock, or power-loss guarantee exists.

Human terminal resume interactions, native mid-write crashes, real forks,
remote/other-OS/other-client behavior, and the full F3 loss/SIGSTOP suite were not
retested in P2. The SDK-host lifecycle evidence is real RPC/process behavior, not
human clicks. Existing Q4 semantic fallibility/context-window limits remain.
Useful validated findings may survive incomplete peers; no accepted findings
never means a clean PR. No elapsed time triggers cancellation or fallback.

Reinstall after extension changes and use a fresh runtime:

```sh
node scripts/smoke-retention.mjs
node scripts/smoke-selection.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-findings.mjs
node scripts/smoke-fixture.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-retention-runtime.mjs --quick --parent-turn
```

The no-flag lifecycle probe seeds controlled findings without inference and
records command-only resume as unsupported. `--parent-turn` without `--quick`
uses seeded findings plus one parent turn for cheaper native resume evidence.
The quick form spends credits on actual specialists/validation as well.
`scripts/smoke-runtime.mjs --targets --quick --selection
--selection-cases=subset,none,cancel-pending` additionally covers native UI
selection and retained inspection using the same environment settings.
Never put fixture `gh` in the normal PATH. Do not use `copilot -p '/pr-review ...'`
as deterministic command dispatch. A harness kill is not plugin-cleanup evidence.

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
