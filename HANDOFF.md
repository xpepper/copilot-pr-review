# Next-session handoff prompt

Continue this project from its recorded repository state.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for progress, runtime evidence, caveats, and the exact next
increment. Inspect git status, recent commits, and implementation before editing.
Do not depend on earlier conversations or reopen settled product decisions.

## Recorded state

The preceding checkpoint is `27816f2` (F3). The session-ending commit containing
this handoff completes Q1; inspect git log for its hash. The Q1 implementation,
smoke exercises, README/roadmap, and this handoff belong in that commit.
There was no unrelated or unfinished work when this handoff was written.

Q1 adds `/pr-review NUMBER` for read-only target capture through `gh`, using
the current session directory rather than the extension process cwd.
`extensions/pr-review/target.mjs` owns parsing, capture, gate evaluation,
consistency checks, and summary output. Its `captureTarget` returns an
invocation-local snapshot containing repository/PR identity, metadata,
base/head SHAs, complete diff, timestamp, byte count, and SHA-256.
No source context or PR reviewers run yet; there is no retained-result cache.

Drafts skip unless `--include-drafts` is supplied. Obvious bots skip. The
conservative trivial gate skips only an empty change proven by metadata; do
not treat a title, small diff, or documentation filename as proof.
Closed/merged PRs require native confirmation or `--include-closed` /
`--review-closed`. Without a host confirmation UI, the command reports that
an override is required. Accepted confirmation rechecks metadata before
fetching a diff; changed targets require a new invocation.

Both controlled and live installed-plugin Q1 exercises passed without inference.
The controlled exercise proved session cwd changes, ignored `GH_REPO`, gate
handling, native confirmation acceptance/decline, and explicit capture errors.
The live exercise captured public `github/copilot-sdk#2543` and skipped bot
PR #2545 from an empty disposable Git checkout. This project's repository had
no PRs. The live expected head/hash and all reproduction commands are recorded
in `ROADMAP.md`. Existing pure F2/F3 and native status/help/models probes passed;
the inference-spending F2/F3 scenarios were not rerun for Q1.

## Implement Q2 only

Bind surrounding-source context to the Q1 snapshot's captured repository and
head, without relying on the current checkout.

Acceptance criteria:

- Supply coordinator-owned context from immutable GitHub revisions using `gh`,
  with explicit repository/SHA/path provenance. Include base-side provenance
  where needed for deleted/changed code.
- Stop explicitly on unavailable, inconsistent, or incomplete required context.
  Never fall back to source from the local checkout or another branch.
- Demonstrate that different local branch/HEAD or dirty source cannot become
  review evidence, and that the context remains bound to the captured revision
  when the PR advances.
- Preserve Q1 gates, status/help/models, and all fixture experiment behavior.
  Cover the new context paths with targeted existing Node.js/assert exercises
  and record demonstrated behavior separately from assumptions.

Do not implement Q3-Q4 specialist execution/validation, publication, saved
configuration, retained-result caching, or safeguards. Do not switch branches,
fetch/reset the checkout, or modify reviewed source. Follow `SCOPE.md` rather
than treating this handoff as another product specification. Keep L1 pending
unless separately authorized; no upstream source copying.

## Important runtime and capture caveats

- CLI 1.0.83 / bundled SDK / Node.js 26.1.0 / macOS arm64 is the demonstrated
  environment, not a cross-platform claim. Consult the installed SDK and current
  official docs before selecting new APIs; demonstrate behavior.
- Q1 uses `session.rpc.metadata.snapshot().workingDirectory` and
  `session.ui.confirm()` when elicitation is available. Both were exercised
  through the installed plugin, not just inferred from declarations.
- Q1 metadata/diff/metadata checks detect observed changes, but do not provide
  an atomic GitHub transaction or eliminate every change-and-revert/cache race.
  A SHA-256 identifies captured bytes, not a Git object. Preserve this distinction
  when binding immutable source context in Q2.
- `gh` must already be authenticated. Local stored authentication worked inside
  the installed extension; sensitive token environment forwarding is filtered
  by the CLI and was not enabled or demonstrated. Remote sessions are rejected;
  GitHub Enterprise and other operating systems have not been demonstrated.
- A 32 MiB subprocess buffer is an explicit capture failure boundary, not silent
  truncation or a review deadline. There is no automatic capture retry.
- Target snapshots exist only during invocation. The timeline shows a bound
  summary, not the full diff/PR prose. Do not introduce P2 caching as a shortcut.
- The selected reviewer integration remains a plugin-owned SDK stdio runtime
  with independent sessions, not factories. `RuntimeConnection.forStdio()` uses
  bundled runtime resolution; no hardcoded executable/provider credentials.
- Reviewer configuration discovery is disabled, tools must initialize empty,
  pre-tool hooks deny every invocation, and permissions are denied. Native F3
  probes demonstrated the hook, not the separate permission callback.
  This is capability isolation, not an OS sandbox.
- Fixture commands return after acceptance; timeline results follow cleanup.
  Dispatch success is not review success. Partial/failed reviewers remain
  incomplete, and cleanup errors remain visible.
- `/pr-review cancel` aborts local waiters and force-stops the owned runtime.
  Keep force-stop for unresponsive runtimes; an abort RPC can hang. Normal
  completion uses `client.stop()`. SIGTERM/SIGINT/parent EOF stop owned work.
- There are no review timeouts or elapsed-time fallbacks. The single-in-flight
  connection probe detects actual RPC failure; a connected hung reviewer waits
  indefinitely until cancellation. Abrupt parent loss cannot report completion.
- Install with an absolute path and reinstall after extension edits; use a
  fresh CLI/runtime. Do not use `copilot -p '/pr-review ...'` as command dispatch.
- `node scripts/smoke-target.mjs` and `node scripts/smoke-fixture.mjs` are pure,
  no-model probes. With the documented CLI/SDK settings, runtime `--targets`
  uses a child-only `gh` test double; `--target-live` uses real GitHub requests.
  Run them separately. Do not put `scripts/fixtures` in the normal PATH.
  The macOS harness canonicalizes temporary paths with `realpath`.
- Runtime `--fixture` / `--f3` spend subscription credits and require the four
  explicit model/effort settings in `README.md`. `--f3` signals only identified
  descendant processes, including deliberate parent loss; a harness cleanup
  intervention is not successful plugin-cleanup evidence.

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
