# Next-session handoff prompt

Continue from recorded files, not prior conversations.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification and
`ROADMAP.md` as the progress/evidence record. Inspect git status, recent commits
and implementation before editing. Reconcile this prompt against those sources
if necessary. Implement only the next recorded increment; do not reopen settled
product decisions.

## Recorded state

Implementation checkpoint **`c0d3d16`** completes P1 after Q4's `d794b71`.
The session-ending documentation commit containing this prompt adds the
checkpoint reference to the roadmap and replaces this handoff; inspect git log
for its hash. At handoff creation, those are the only uncommitted changes and
belong to that final commit. No unrelated or unfinished work is carried forward.

Quick review now runs three heavy specialists, validates and deduplicates their
findings, stops inference, displays the findings, and selects them through a
native elicitation form or `--all`. Exactly one of `--quick` / `--major-only` and
`--no-comment` remain required. `--all` selects final findings, not raw candidates,
and never authorizes publication. A bare PR number remains capture-only.

Relevant implementation:

- `quick.mjs` owns parsing, assignments, captured input, UUID/session invocation
  identity, review orchestration and the call to `finishSelection`.
- `findings.mjs` owns strict candidate/adjudication schemas, `reviewKey`, evidence
  checks, whole-claim support, deduplication and human-readable findings.
- `selection.mjs` consumes **only `validation.findings`**. The form uses
  invocation-scoped choice values; selection results retain canonical finding IDs
  plus session/repository/PR/head and full review-digest binding. None, cancellation,
  empty results, unsupported UI and invalid responses are distinct dispositions.
- `interaction.mjs` is the shared cancellation-aware waiter for Q1 confirmation
  and P1 selection. Late UI answers cannot revive cancelled work.
- `executeOwnedRun` in `fixture-run.mjs` stops inference before selection and
  calls `onStopped(outcome)`. In `extension.mjs`, `activeRun` now survives that
  callback and is cleared only when the entire run settles. A pending UI is
  cancellable and blocks another review; no inference stays alive to wait for it.
  Cleanup errors do not mark the runtime cleanly stopped.

`Q3 evidence:` is the post-inference/cleanup Q3/Q4 report, now also carrying
`invocation`. `P1 evidence:` reports selection, binding and final coverage.
`reviewComplete` preserves pre-selection coverage; `complete` is review coverage,
not selection or posting success. Cancellation clears selected IDs and makes
the final run incomplete. Use the returned outcome for future retention, not
reparsed timeline logs or raw reviewer output.

No plugin cache, publication, configuration, extra mode, fallback or safeguards
exist. SDK transcripts can persist independently; they are not a retained-result
implementation.

## Implement P2 only

Retain results with originating-session/repository/PR/head binding and inspect
them without rerunning reviewers. The exact next increment and acceptance
criteria are also in `ROADMAP.md`.

- Retain the validated/deduplicated result, selection status and IDs, binding,
  attribution and coverage/error state. Rejected/raw candidates and duplicate
  aliases cannot become selectable through retention. Cancellation must not
  leave an actionable selected result.
- Add a minimal code-owned inspection command and document its syntax. Inspection
  must not run inference, fetch a replacement head, modify source or write GitHub.
  Preserve incomplete/empty/cancelled states without clean-review claims.
- Consult current official documentation and the installed SDK before choosing
  storage and lifecycle APIs. Demonstrate extension reload and same-session resume
  where supported. Record unsupported behavior explicitly; transcript persistence
  is not proof that a plugin cache works.
- Keep data scoped to the originating session, repository, PR and reviewed commit.
  Reject wrong-session/binding, malformed/incompatible records and stale selection
  IDs. Do not introduce a cross-session archive or substitute local checkout
  contents/current PR head for the reviewed snapshot.
- Make retention/inspection failures explicit. Preserve cancellation, cleanup,
  no-timeout and no-comment guarantees. Extend existing assertion probes and
  separate native lifecycle evidence from controlled storage tests.

Do not implement posting authority/payloads (P3), GitHub publication (P4),
publish-later execution (P5), saved configuration, other modes, fallbacks or
safeguards. Keep L1 pending; copy no upstream source. Do not modify reviewed
source or switch/fetch/reset the checkout.

## Demonstrated behavior and caveats

The installed-plugin probes use CLI 1.0.83, bundled SDK, Node.js 26.1.0 and macOS
arm64. P1 inference explicitly used `gpt-5.6-terra` / `high`; that is not a product
default or fallback. Official plugin docs and installed SDK elicitation types
were consulted, then exercised through the real installed plugin.

Native scripted SDK-host requests demonstrated all, proper subset (1 of 2),
none, UI cancel, command cancel during a pending form with inert late acceptance,
unknown selection rejection and unsupported-host refusal. Owned PIDs exited
before UI answers; duplicate invocations were refused while selection was pending.
Detailed sessions, invocation IDs, hashes and process evidence are in the roadmap.
These were real native elicitation requests, not mocked extension methods, but
not human clicks or a terminal visual-layout assessment.

Two-defect controlled target 13 in `scripts/target-fixture.mjs` uses child-only
`gh` responses and original arithmetic/shipping regressions. It creates no remote
PR. Target 12 remains the single arithmetic regression for existing Q3/Q4 probes.
Local checkout state and read-only request tracing passed. Native quick explicit/
ambient-alias and active-specialist/active-validator cancellation were rerun after
the lifecycle changes. The full F3 adversarial/loss/SIGSTOP suite was not rerun.

The deterministic selection probe includes malformed/duplicate/raw/rejected/stale
answers, changed bindings, degraded results and cancellation at completion.
Positive decisions in the controlled orchestration test are mocks, not semantic
proof. Native inference independently sometimes returned empty/incomplete results
or invalid reject-plus-duplicate decisions. Gates stayed strict; positive UI
probes were explicitly rerun by case, not automatically retried by the plugin.

Q4 boundaries remain mandatory: exact JSON only, exact source/diff provenance,
actual changed-line anchors, P0-P2 and confidence 0.8-1, whole-claim support before
acceptance, and explicit same-cause/trigger/impact decisions plus shared changed
evidence for deduplication. Exact grounding is deterministic; causal/severity
judgments remain model-based and fallible. Useful findings survive degraded peers.
No accepted findings never means a clean PR.

Pending host dialogs may outlive cancelled local waiters. No elapsed time triggers
cancellation/fallback. Force-stop is still needed when abort RPCs cannot complete.
Reviewer tool discovery is disabled and tools/permissions denied; this is capability
isolation, not an OS sandbox or prompt-injection immunity. Q2 window/provider
limits remain; absent context is never replaced by local checkout evidence.

Reinstall after extension edits and use a fresh runtime:

```sh
node scripts/smoke-selection.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-target.mjs
node scripts/smoke-context.mjs
node scripts/smoke-findings.mjs
node scripts/smoke-fixture.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick --selection
```

Use `--selection-no-ui` instead of `--selection` for unsupported-host evidence.
Append `--selection-cases=subset,cancel-pending` for selected UI cases. Omit both
selection options for existing explicit/alias/active-cancel probes with `--all`.
These quick probes spend credits; ordinary target probes without `--quick` do not.
Never put fixture `gh` in the normal PATH. Do not use `copilot -p '/pr-review ...'`
as deterministic command dispatch. A harness kill is not plugin-cleanup evidence.

Local stored `gh` authentication is demonstrated. Token-only forwarding,
Enterprise, remote sessions, other operating systems and cross-client behavior
remain unproven or rejected. Public pinned regression probes remain documented
in the roadmap. The user also permits `xpepper/copilot-pr-review` as a synthetic
PR playground, but **never merge synthetic PRs into main**. This permission does
not override the current no-push instruction; P2 need not create any remote PR.

## Commit and hand off

Follow `AGENTS.md`: inspect diffs, validate meaningful progress, update the roadmap
with evidence/limitations/reproduction and commit relevant checkpoints. Preserve
unrelated changes. Do not amend, rewrite history or push.

After implementation, validation and every other documentation update, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit. Carry
these rules forward, reference an existing checkpoint rather than the future
commit containing the handoff, and identify uncommitted work honestly. Report
the commit outcome and point to `HANDOFF.md` without duplicating its prompt.
