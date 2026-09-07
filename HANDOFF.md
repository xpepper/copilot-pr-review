# Next-session handoff prompt

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for evidence, runtime caveats and the exact next increment.
Inspect the working tree, recent commits and relevant implementation before
editing; reconcile stale notes against git state. Implement only the next
agreed increment, respect scope constraints, and distinguish demonstrated
behavior from assumptions. Follow the same checkpoint-commit and final-file
handoff rules in turn; do not depend on any prior conversation.

## Current priority: manual testing and feedback, not M1

This handoff follows checkpoint `3079726`, which implemented explicit coverage
classification and presentation after startup fix `ff78dcb`. The current
checkpoint adds presentation-only consolidation of equivalent coverage gaps in
response to user feedback. Inspect git history for its containing commit; do
not infer or embed that future hash.

At handoff creation, all uncommitted files belong to this consolidation change,
its regression coverage and documentation. They are intended for the
session-ending checkpoint containing this prompt. No unrelated or unfinished
work is carried forward, no background work remains, and nothing was pushed.

The next action remains **more user-run manual testing and feedback** with the
reinstalled plugin. Do not automatically continue to balanced mode/M1, rerun a
private review, spend inference, publish anything, or access private review
content without explicit authorization. The user chooses the target and may
provide a session ID; local session discovery is available when asked.

## Feedback and implementation in this checkpoint

The user authorized read-only inspection of session
`138018d8-296b-4c65-9199-ec9d44c6d13a`, a quick review of private
`primait/starsky#8126`. The parent session had no stored turns, but its three
specialist child sessions were identifiable by time/repository. All three
specialists completed successfully with valid schema-v2 output, no candidates,
and no execution failures. Each reported a substantive coverage gap: supplied
manifest/lockfile context could not establish whether removing direct `lapin`
dependencies left source, macro, feature-gated or build-time uses. This was
correctly incomplete rather than a clean-review claim, but three near-identical
gaps made behavior unclear. No private diff/source payload was copied into
fixtures or repository documentation.

`extensions/pr-review/coverage.mjs` now consolidates only the displayed form of
structured reviewer coverage gaps when they share a quoted code identifier and
have strongly overlapping blocked-assessment vocabulary. The output names all
reporters, displays one representative reason/impact, reports one consolidated
gap plus its raw report count, and says full diagnostics remain retained.

The implementation deliberately leaves raw `validation.diagnostics`, blocking
`issues`, completeness, selection, retention, publication payload identity and
authorization unchanged. Distinct same-identifier assessments remain separate.
Unstructured, code-owned and legacy gaps are never clustered. The heuristic is
conservative and fallible: paraphrases can remain separate, and lexical overlap
is not proof of semantic identity. It must never turn incomplete coverage into
completed coverage or imply that zero findings means a clean PR.

`README.md` documents this presentation behavior. `ROADMAP.md` records the
manual evidence, implementation boundary, validation and remaining uncertainty.
`scripts/smoke-findings.mjs` covers three equivalent dependency-removal gaps, a
distinct same-identifier security gap, and unstructured diagnostics.

## Validation and reproduction

All seven controlled suites passed:

```sh
for script in smoke-findings smoke-quick smoke-selection smoke-retention \
  smoke-preview smoke-publication smoke-publish-later; do
  node "scripts/$script.mjs" || exit
done
```

After the final defensive adjustment, `node scripts/smoke-findings.mjs` and
`git diff --check` passed again.

The plugin was reinstalled successfully. Native no-inference retention and
startup/target probes passed:

```sh
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
```

Native evidence remains macOS arm64 / CLI 1.0.83 / Node.js 26.1.0. Direct local
plugin installation still emits its deprecation warning. Runtime cleanup
completed. These probes are synthetic/no-inference and do not demonstrate
actual model wording or live consolidation.

## Exact next increment

Wait for a user-selected manual review result. The most direct verification is
a fresh user-run quick review of `primait/starsky#8126`, but do not initiate it.
When authorized, inspect the selected session read-only and determine whether:

- equivalent dependency-removal gaps appear once with all reporters and the raw
  report count;
- distinct coverage gaps, execution failures and informational caveats remain
  separately visible;
- the review remains incomplete when a consequential assessment is blocked;
- zero findings is not presented as evidence that the PR is clean.

Distinguish actual model behavior from synthetic evidence and preserve genuine
uncertainty. Address only the next concrete feedback item once identified.

## Boundaries and deferred work

Reviewers still have no tools and only supplied revision-bound context.
Read-only investigation tools remain a separate undecided discussion. Do not
add shell access, execute mise/gh-aw, implement `--verify`, balanced/full/deep,
fallbacks or timeouts. Bare `/pr-review NUMBER` remains capture-only.

Do not alter personal configuration, project trust, selection, binding/head,
lifecycle, publication or authorization gates. Do not run
`smoke-config-runtime.mjs` assuming an empty personal store. Any future
authorized real-store probe must snapshot and restore both personal config and
trusted-project files. Keep fixture `gh` in child-only PATH.

No runtime API changed. If future work needs one, consult the installed SDK and
current official documentation and demonstrate capability rather than inferring
it. Existing command-only cold-resume, locking, non-atomic final GET/POST, live
anchor, semantic/context and process-loss limitations remain recorded in
`ROADMAP.md`. Existing playground publication evidence must not be repeated or
its synthetic branches merged. Keep L1 pending and copy no upstream source.

## Commit and hand off in turn

Follow `AGENTS.md`: validate applicable changes, inspect diffs, update
`ROADMAP.md` with evidence and remaining limits, and commit coherent checkpoints.
Preserve unrelated work; do not amend, rewrite history or push without explicit
authorization.

After all other implementation, validation and documentation edits, replace
`HANDOFF.md` as the final repository file edit before the session-ending commit.
If another edit becomes necessary, refresh it last again. Include it in that
commit, reference an existing checkpoint rather than its future hash, and report
the commit outcome with a pointer to this file.
