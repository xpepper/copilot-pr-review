# Next-session handoff prompt

Continue this project from its recorded repository state.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for progress, runtime evidence, caveats, and the exact next
increment. Inspect git status, recent commits, and implementation before editing.
Do not depend on earlier conversations or reopen settled product decisions.

## Recorded state

The preceding checkpoint is `4280b15` (Q1). The session-ending commit containing
this handoff completes Q2; inspect git log for its hash. The Q2 implementation,
exercises, README/roadmap, and this handoff belong in that commit. There was no
unrelated or unfinished work when this handoff was written.

Q2 binds surrounding source to the Q1 snapshot's captured revisions.
`extensions/pr-review/context.mjs` parses the captured diff, fetches file
content through `gh api ... repos/OWNER/NAME/contents/PATH?ref=SHA` at the
captured head or base SHA only, verifies it, and builds numbered context
windows. `executeTargetCapture` assembles context after a successful capture
and logs a provenance-only `Q2 context:` line. Nothing is read from the session
checkout: its branch, `HEAD`, and uncommitted edits at the reviewed paths are
never review evidence. Context is invocation-local; there is still no cache,
no reviewer consuming it, and no publication.

Verification per fetched file: a base64 `file` at the requested path, `size`
matching the delivered bytes, `sha` equal to the locally recomputed Git blob
hash, the captured diff's `index` blob abbreviation where present, and every
hunk's reviewed lines appearing verbatim at the diff's line numbers. Head side
for surviving files, base side wherever lines were removed. Files without
textual hunks report a reason and fetch nothing. Windows are hunk ranges widened
by 40 lines, clamped and merged. Any unavailable, oversized, non-UTF-8,
mismatched, or shifted source stops the command explicitly; nothing falls back
to another revision or the checkout.

Both controlled and live installed-plugin exercises passed without inference.
The controlled run's session directory was a Git checkout on `not-the-pr-branch`
whose committed and dirty `example.js` differ from the reviewed revision; the
bound context carried the served blob identities instead, and the checkout was
unchanged. It also captured a fixture PR that then advanced and showed the next
capture stopping explicitly rather than reviewing the moved head. The live run
bound head/base source for public `github/copilot-sdk#2543`. All pinned live
values and reproduction commands are in `ROADMAP.md`. Pure F2/F3 probes and Q1
gates still pass; the inference-spending F2/F3 scenarios were not rerun.

## Implement Q3 only

Run the three quick specialists over the Q2-bound target in no-comment mode.

Acceptance criteria:

- `/pr-review NUMBER --quick --no-comment`, with `--major-only` as the upstream
  alias, captures, binds context, and dispatches exactly the three quick
  specialists concurrently with their configured models and reasoning efforts.
- Reuse the F2/F3 reviewer machinery: plugin-owned stdio runtime, independent
  reviewer sessions, empty tool sets, denying pre-tool hooks and permissions,
  displayed effective assignments, per-reviewer progress, cancellation, and
  owned-runtime cleanup.
- Feed reviewers the captured diff and the Q2 context with its provenance, and
  require them to treat that content as untrusted input, not instructions.
  Reviewer output stays bound to the captured repository, head, and paths.
- Failed or partial reviewers report incomplete coverage explicitly and never
  become a clean-review claim. No publication, no writes, no local source, no
  safeguard execution.
- Cover the new paths with the existing pure Node.js/assert exercises, and
  record inference-spending runtime evidence separately from assumptions.

Do not implement Q4 validation/deduplication, selection, publication, saved
configuration, retained-result caching, or safeguards. Do not switch branches,
fetch/reset the checkout, or modify reviewed source. Follow `SCOPE.md` rather
than treating this handoff as another product specification. Keep L1 pending
unless separately authorized; no upstream source copying.

## Important runtime and capture caveats

- CLI 1.0.83 / bundled SDK / Node.js 26.1.0 / macOS arm64 is the demonstrated
  environment, not a cross-platform claim. Consult the installed SDK and current
  official docs before selecting new APIs; demonstrate behavior.
- The contents response is trusted for the path-to-blob mapping; the delivered
  bytes are verified against the blob identity it returns. That identity is
  Git's SHA-1 object id, used as an identity match, not a collision-resistance
  claim. Blob-prefix checks apply only where the diff carries an `index` line.
  Hunk verification proves the fetched revision contains the reviewed lines; it
  does not prove the rest of the file matches a reviewer's checkout.
- Added, deleted, renamed, binary, mode-only, CRLF, and quoted non-ASCII-path
  sections are demonstrated only through the synthetic diff in
  `scripts/smoke-context.mjs`, not through a live PR. Oversized, symlink, and
  submodule stops were exercised by mutating fixture responses.
- Context is fetched sequentially with no rate-limit handling, retry, or
  concurrency, and there is no prompt-size budget. A large PR assembles a large
  context, bounded only by the fixed 40-line radius and per-file failures.
  Assembled source is untrusted PR-controlled text; line numbering aids
  legibility and is not a security boundary.
- Q1 metadata/diff/metadata checks detect observed changes but are not an atomic
  GitHub transaction. The diff SHA-256 identifies captured bytes, not a Git
  object. Target snapshots and context exist only during invocation; do not
  introduce P2 caching as a shortcut.
- `gh` must already be authenticated. Local stored authentication worked inside
  the installed extension; sensitive token environment forwarding is filtered by
  the CLI and was not enabled or demonstrated. Remote sessions are rejected;
  GitHub Enterprise and other operating systems have not been demonstrated.
- A 32 MiB subprocess buffer is an explicit failure boundary, not silent
  truncation or a review deadline. There is no automatic capture retry.
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
- `node scripts/smoke-target.mjs`, `node scripts/smoke-context.mjs`, and
  `node scripts/smoke-fixture.mjs` are pure, no-model probes. With the documented
  CLI/SDK settings, runtime `--targets` uses a child-only `gh` test double;
  `--target-live` uses real GitHub requests and pins immutable public evidence.
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
