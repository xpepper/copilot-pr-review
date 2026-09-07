# Next-session handoff prompt

Continue from recorded files, not prior conversations.

Read `AGENTS.md`, `SCOPE.md` as the authoritative product specification, and
`ROADMAP.md` as the progress/evidence record. Inspect git status, recent commits
and implementation before editing. Reconcile this prompt against them if
necessary. Implement only the next recorded increment; do not reopen settled
product decisions or assume access to this conversation.

## Recorded state

C1 is complete. Implementation checkpoint **`47c8901`** follows the P5 evidence
commit `3a4ead9`. `origin/main` is at `3a4ead9`, so local `main` is ahead.
**Do not push without new explicit authorization.**

At handoff creation the only uncommitted file is `HANDOFF.md`, which belongs in
the commit containing this prompt. No unfinished or unrelated work is carried
forward, and no background work is pending. The installed plugin currently
matches this checkout; reinstall after any edit and use a fresh runtime.

**One extension now registers two slash commands.** `/pr-review-config` accepts
`show` (also the empty argument), `key=value` assignments, `unset KEY` and
`help`. `rpc.commands.list()` confirmed both commands on CLI 1.0.83.

Relevant implementation:

- `config.mjs` owns parsing, the personal store, tier resolution and the
  effective-configuration report. Keys are `lightModel`, `lightEffort`,
  `mediumModel`, `mediumEffort`, `heavyModel`, `heavyEffort` and
  `autoPostReviews`. Upstream's other fields are deliberately not ported.
- Values are validated against `rpc.model.list()` through the existing
  `validateModelAssignment`. An invalid explicit model or effort is refused;
  nothing is substituted and no effort is lowered. Validation covers the
  configuration that results from a change, so a value that only becomes
  unusable through inheritance is refused too. A tier resolved purely from the
  ambient session carries no explicit setting and is validated at review time
  instead.
- An unset tier field takes the nearest configured tier, preferring the heavier
  tier when two are equidistant, then the ambient model or effort. Model and
  effort resolve independently. Quick review consumes the heavy tier only.
- Storage is `<copilot-config-home>/pr-review/config.json`, derived from the
  session workspace the CLI reported, which is a `session-state` sibling.
  Records are `{"schemaVersion": 1, "settings": {...}}`, written atomically with
  mode `0600`. Malformed JSON, an unsupported version, an unknown stored key or
  a wrongly typed value refuses both inspection and review without repair.
- Invocation flags win for that invocation only and never rewrite the file.
  `describeConfiguration` is logged before any reviewer starts, and
  `executeRetainedQuick` now takes an `effectiveConfig` that supplies
  `autoPostReviews` to the existing `finishPreview` parameter.
- Configuration commands issue only `metadata.snapshot`, `model.getCurrent` and
  `model.list`, and call `assertIdle()`, so they are refused while a review or
  publication holds the session's active-work slot.
- **No repository-provided configuration is read anywhere.** Publish-later still
  consults no configuration at all.

## Implement C2 only

Follow the exact C2 acceptance criteria at the end of `ROADMAP.md`: explicitly
trusted project configuration overrides, with a repository unable to authorize
itself.

Do not implement other review modes, fallbacks, safeguards or an interactive
menu, and do not change publication gates. Keep L1 pending and copy no upstream
source. Prefer the existing no-inference probes over new inference spend for
plumbing evidence. Consult the installed SDK and current official documentation
before choosing new runtime APIs, and demonstrate capabilities instead of
inferring them.

## Demonstrated behavior and runtime caveats

CLI 1.0.83 / bundled SDK, Node 26.1.0, macOS arm64. Explicit native assignment
`gpt-5.6-terra` / `high` is evidence, not a product default.

`scripts/smoke-config-runtime.mjs` passed against the installed plugin **without
spending any credits**: the model and effort it passes are session configuration
and no prompt is ever sent. It proved two registered commands, the derived
`~/.copilot/pr-review/config.json` location, native refusals that write nothing,
a stored tier surviving an extension reload and driving a real quick invocation,
an invocation flag overriding it without rewriting the file, an unusable stored
model refusing the review, malformed and version-99 files refusing both review
and inspection, and configuration refused while a review held the session slot.
It snapshots and restores any pre-existing configuration file. No such file
exists now. `smoke-runtime.mjs`, `smoke-runtime.mjs --targets` and
`smoke-retention-runtime.mjs` also passed without inference.

Known limits carried forward: a configuration-authorized publication has **not**
been exercised natively, only through controlled probes, because it needs a real
inference review. Only the heavy tier is consumed until M1. Validation binds to
the models the current session reports, so a saved configuration can become
unusable under a different ambient model; `show` marks it `UNUSABLE` and the
review refuses. The personal store has no cross-process lock.

Publication limits are unchanged: the final GET/POST is not an atomic
compare-and-submit transaction, retained storage has no cross-process lock or
power-loss guarantee, live LEFT/multiline/rename/deletion anchors remain
unproven, command-only SDK sessions still cannot cold-resume, and Q4
semantic/context-window and F3 process-loss limits stand.

The user authorized synthetic remote branches/commits/PRs through the GitHub
API. **Both playground PRs already hold a published plugin review; do not repeat
either POST and never merge these branches.**

- PR **#1** (P4), open, base `playground/p4-base-20260907` at
  `155ed469b9f098e435435f020b2f4639abf9809a`, head
  `playground/p4-regression-20260907` at
  `a68b6cd97f2bbfdca28bda4e7fb20bcf48205b32`. Review `5130714400`, comment
  `3948685115`, thread `PRRT_kwDOUQilZc6f3tE8`, INCOMPLETE coverage.
- PR **#2** (P5), open, base `playground/p5-base-20260907` at
  `160ec104c5fcd9f6028acd76e4a421a153dbc743`, head
  `playground/p5-publish-later-20260907` at
  `64383e445ffff9677f1958a83829232f2089f0ce`. Review `5131451227`, comment
  `3949275074` at `playground/discount.mjs:5` RIGHT, thread
  `PRRT_kwDOUQilZc6f5Mm6`, completed coverage. Session
  `835f1310-a525-42be-a496-e31926ec008c`, version-4 digest
  `240ad077014d16e3fd48d843d3cdefe0983e6015efcbf4245ce3f8517163841d`.

## Reproduction

```sh
node scripts/smoke-config.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-retention.mjs
node scripts/smoke-publication.mjs
node scripts/smoke-publish-later.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-config-runtime.mjs
```

Fixture `gh` stays in child-only PATH; never expose it to ordinary commands.
Reinstall after extension edits, then use a fresh runtime. Direct local install
still works with a deprecation warning; marketplace migration is not this
increment. Any probe that touches the real personal configuration file must
snapshot and restore it, as `smoke-config-runtime.mjs` does.

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
