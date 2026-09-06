# Next-session handoff prompt

Continue this project from its recorded repository state.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for progress, runtime evidence, caveats, and the exact next
increment. Inspect git status, recent commits, and implementation before editing.
Do not depend on earlier conversations or reopen settled product decisions.

## Recorded state

The preceding checkpoint is `430afd2` (F2). The session-ending commit containing
this handoff completes F3; inspect git log for its hash. All implementation,
smoke exercises, documentation, and this handoff belong in that commit.
There was no unrelated or unfinished work when this handoff was written.

F3 established native forbidden-tool denials, original adversarial-fixture
execution, explicit reviewer failure with retained successful output, startup
and active cancellation, cancellation of a suspended runtime, and cleanup after
owned-runtime loss, extension reload, abrupt extension loss, and parent loss.
The process probes checked that owned PIDs exited rather than being orphaned.
The final complete exercise passed with 2661 ms F2 reviewer overlap.
Detailed reproduction evidence and limitations are in `ROADMAP.md`.

The selected integration is a plugin-owned SDK stdio runtime with two independent
sessions, not parent factory subagents. Factories remain unavailable on the
observed account/runtime. No licensing decision or upstream source reuse occurred.

## Implement Q1 only

Capture a PR number's repository, lifecycle, head identity, and diff for the
GitHub repository owning the current directory, without changing the checkout.

Acceptance criteria:

- A code-owned command produces a repository/PR/head-bound snapshot and reports
  failed or inconsistent capture explicitly. Use `gh` for GitHub operations.
- Draft, obvious-bot, and clearly-trivial skip gates are demonstrated, with an
  explicit draft override. Closed/merged PRs require confirmation or the
  `--include-closed` / `--review-closed` override, as specified in `SCOPE.md`.
- Demonstrate that target capture and gate handling do not start reviewers,
  post to GitHub, switch branches, or modify reviewed source/the checkout.
- Preserve status/help/models and all fixture experiment behavior. Cover the
  capture/gate paths with targeted existing-runner exercises and record evidence.

Do not implement Q2-Q4 reviewer/context/validation work, publication, saved
configuration, retained-result caching, or safeguards. Follow `SCOPE.md` rather
than treating this handoff as another product specification. Keep L1 pending
unless separately authorized; no upstream source copying.

## Runtime details to preserve

- CLI 1.0.83 / bundled SDK / Node.js 26.1.0 / macOS arm64 is the demonstrated
  environment, not a cross-platform claim. Consult the installed SDK and current
  official docs before selecting new APIs; demonstrate behavior.
- The extension explicitly uses `RuntimeConnection.forStdio()` and bundled
  runtime resolution. No hardcoded executable path or provider key is shipped.
- Reviewer configuration discovery is disabled. The initialized tool set must
  be empty; a pre-tool hook denies every invocation, and the permission callback
  also denies requests. Native probes demonstrated hook denial, not runtime
  invocation of the separate permission callback. This is not an OS sandbox.
- Fixture commands now return after validated acceptance, not after completion.
  Progress and final `F2 evidence:` / `F3 evidence:` arrive through the timeline.
  Final evidence follows cleanup; dispatch success is not review success.
- `/pr-review cancel` aborts local waiters and force-stops the owned runtime.
  Do not replace it with an abort RPC that can hang against an unresponsive
  runtime. SIGTERM/SIGINT/parent-EOF paths also force-stop owned work.
- Normal completion uses `client.stop()`. Cleanup errors remain visible and
  prevent `complete: true`; failed/partial reviewers do not become clean results.
- The SDK lacks a public client-disconnect event. A single-in-flight connection
  probe runs at most once per second and interrupts only on an actual RPC error.
  There are no review deadlines, elapsed-time fallbacks, or silent model retries.
  A connected hung reviewer waits indefinitely until manual cancellation.
- Parent loss cannot receive a terminal report. Forced termination may skip a
  final SDK transcript flush. P2 remains responsible for future retained state.
- Both model IDs and reasoning levels remain explicit and distinct. Raw session
  catalogs use `capabilities.supports.reasoning_effort`; verify actual usage.
- Install with an absolute path and reinstall after code edits; use a fresh CLI
  or extension reload. Do not use `copilot -p '/pr-review ...'` as command dispatch.
- `node scripts/smoke-fixture.mjs` uses no models. The SDK runtime smoke without
  flags uses no inference. `--fixture` and `--f3` spend subscription credits and
  require the four explicit environment settings documented in `README.md`.
  `--f3` signals only its identified descendant processes, including deliberate
  parent loss; expected connection-closed cleanup errors are printed. Any
  `HARNESS CLEANUP` intervention is not successful plugin-cleanup evidence.

## Commit and hand off

Follow `AGENTS.md`: validate meaningful progress, inspect the diff, update
`ROADMAP.md` with evidence, limitations, reproduction, and the exact next
increment, and commit coherent checkpoints. Preserve unrelated changes.
Do not amend, rewrite history, or push.

After implementation, validation, and all other documentation edits, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit. Carry
these rules forward, reference an existing checkpoint rather than the commit
being written, and note any remaining uncommitted work honestly. Report the
commit outcome and point to `HANDOFF.md` without repeating the prompt.
