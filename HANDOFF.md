# Next-session handoff prompt

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for evidence, runtime caveats and the exact next increment.
Inspect the working tree, recent commits and relevant implementation before
editing; reconcile stale notes against git state. Implement only the next
agreed increment, respect scope constraints, and distinguish demonstrated
behavior from assumptions. Follow the same checkpoint-commit and final-file
handoff rules in turn; do not depend on this conversation.

## Current priority: manual testing and feedback, not M1

The classification/presentation fix accompanying this handoff is complete.
It started from clean checkpoint **`cbe633c`**, which recorded the agreed
priority after startup fix **`ff78dcb`**. It did not implement balanced mode
or investigation tools.

At handoff creation, all uncommitted files belong to this implementation,
its synthetic regression cases and documentation; they are intended for the
session-ending checkpoint containing this prompt. No unrelated or unfinished
work is carried forward, no background work remains, and nothing was pushed.
Inspect git state for the actual containing commit; do not infer remote/ahead
status or embed this future commit's hash.

The next action is **more manual testing and feedback** with the reinstalled
plugin in a fresh ordinary interactive runtime. The user chooses and authorizes
any review target. Do not automatically rerun private reviews, spend inference,
publish anything, or start the older M1 plan merely because this fix is complete.
Inspect user-provided results read-only when requested. Address only the next
concrete feedback item once identified.

Manual-feedback acceptance criteria:

- A caveat-only result can complete while its caveats remain visible.
- Relevant missing evidence, unavailable changed content, unusable output,
  crashes, cancellation and cleanup errors still make coverage incomplete.
- Genuine gaps explain which consequential assessment is blocked. Zero
  findings never implies that a PR is clean.
- Final summaries, retained inspection and publication-facing descriptions
  distinguish execution failures, coverage gaps and informational caveats.
- Preserve all selection, authorization, binding/head/lifecycle and
  uncertain-publication gates; do not change personal settings or project trust.

## Implemented boundary and compatibility

- `findings.mjs` requests reviewer/adjudicator output schema version 2.
  Each limitation has `kind`, `reason`, and `impact`. A `coverage-gap` needs
  nonempty impact explaining the blocked consequential assessment; a `caveat`
  needs null impact. Version-1 strings remain accepted as unclassified gaps,
  never guessed into caveats from their wording.
- Validation now carries `diagnostics` entries (`kind`, `message`) and derives
  the existing blocking `issues` only from execution failures and coverage
  gaps. Invalid output remains a failure, uncertain adjudication a gap, and
  unavailable changed content a code-owned gap regardless of model caveats.
  Validated peer findings can survive incomplete coverage.
- `coverage.mjs` shares classified descriptions across findings/inspection,
  selection/confirmation, new COMMENT proposals and publish-later descriptions.
  Runtime failures/cancellation/cleanup are also represented, including errors
  before validation.
- Retained `diagnostics` is optional and strictly checked against `issues`.
  Record schema versions 1-4 retain their existing publication/authority
  meanings. Older unclassified issues remain incomplete. Records without
  diagnostics reconstruct their exact historical proposal text; inspection
  does not migrate them or upgrade/reuse historical posting authority.
- Legacy and classified publish-later retain the exact canonical proposal,
  refetch source/head/lifecycle evidence, and require new explicit authority.
  Uncertain outcomes still block blind retries and result replacement.

## Evidence and reproduction

The seven controlled suites below passed with synthetic data only. They cover
caveat-only zero findings, substantive gaps, failure/malformed-output cases,
mixed results, binary changed content, retained round trips and conservative
legacy handling, exact publication descriptions, and existing authorization,
head/anchor/lifecycle, cancellation and uncertain-write gates.

```sh
for script in smoke-findings smoke-quick smoke-selection smoke-retention \
  smoke-preview smoke-publication smoke-publish-later; do
  node "scripts/$script.mjs" || exit
done
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
```

The updated implementation is installed locally. Native no-inference
inspection/reload preserved a completed caveat-bearing synthetic result, its
finding, isolation and schema/interruption guards. Native startup/target
plumbing also passed without the extension inheriting `COPILOT_CLI_PATH`.
Runtime cleanup completed. Detailed evidence is in the roadmap's completed
manual-feedback section.

No private payload was read/copied, no private review was rerun, and no live
GitHub write or inference occurred. These cases demonstrate classification
logic and presentation, not model adherence to the new prompts. Semantic
categorization remains fallible and awaits manual feedback.

## Boundaries and runtime caveats

Reviewers still have **no tools** and only supplied revision-bound context.
Read-only investigation tools are deferred for a separate discussion; their
tool set, permission design and priority relative to M1 are not agreed. Do not
add shell access, execute mise/gh-aw, implement `--verify`, balanced/full/deep,
fallbacks or timeouts. Bare `/pr-review NUMBER` remains capture-only.

No runtime API was changed. Consult the installed SDK and current official
documentation before choosing new runtime APIs and demonstrate capabilities
rather than inferring them. Startup fix `ff78dcb` resolves explicit
`COPILOT_CLI_PATH` or an installed executable in an absolute PATH directory;
explicit errors do not fall back. Publish-later constructs no inference client.

Native evidence remains macOS arm64 / CLI 1.0.83 / Node 26.1.0. Direct local
plugin installation works with a deprecation warning. Command-only SDK sessions
still cannot cold-resume; the retained file survives, and no transcript recovery
was invented. Configuration-authorized live publication, cross-process
config/retention locking, non-atomic final GET/POST, live LEFT/multiline/rename/
deletion anchors and Q4 semantic/context/F3 process-loss limitations remain as
recorded in `ROADMAP.md`.

Personal configuration and trust were not modified. Do not run
`smoke-config-runtime.mjs` assuming an empty store: it still asserts that state
despite snapshotting it. Any future authorized real-store probe must snapshot
and restore BOTH `~/.copilot/pr-review/config.json` and
`~/.copilot/pr-review/trusted-projects.json`, including directory cleanup only
if it created that directory. Project probes belong in disposable checkouts.
Keep fixture `gh` in child-only PATH, never ordinary shell commands.

Existing playground publication evidence remains in `ROADMAP.md`; do not
repeat its live POSTs or merge those synthetic branches. L1 remains pending;
copy no upstream source. The M1 criteria remain recorded for a later explicitly
resumed feature plan, not automatic continuation from this checkpoint.

## Commit and hand off in turn

Follow `AGENTS.md`: validate applicable changes, inspect diffs, update
`ROADMAP.md` with evidence, reproduction, remaining limits and the exact next
increment, and commit coherent checkpoints. Preserve unrelated work; do not
amend, rewrite history or push without explicit authorization.

After all other implementation, validation and documentation edits, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. If another edit becomes necessary,
refresh this handoff last again. Include it in the commit, reference an existing
checkpoint rather than its future hash, and report the commit outcome with a
pointer to this file.
