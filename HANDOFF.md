# Next-session handoff prompt

Continue from recorded files, not prior conversations. Read `AGENTS.md`,
`SCOPE.md` as the authoritative product specification, and `ROADMAP.md` for
progress, evidence, caveats and the exact next increment. Inspect git status,
recent commits and implementation before editing; reconcile stale notes against
them. Respect scope constraints and distinguish demonstrated behavior from
assumptions. Follow these same checkpoint-commit and final-file handoff rules
in turn.

## Current priority: finish manual testing before M1

The user paused the feature plan to try the plugin in an ordinary interactive
session. Running `copilot --experimental --yolo` and then
`/pr-review 727 --quick --no-comment --all` failed at SDK construction because
the bundled SDK could not resolve `@github/copilot-darwin-arm64`.

This session fixed only that startup blocker. The starting checkpoint was
`0a32e77` on local `main`, following C2's `56ace3f`. The changes accompanying
this prompt belong to one fix checkpoint. No unrelated or unfinished work is
carried forward, no background work is pending, and nothing was pushed.
Do not infer current remote/ahead status from earlier handoffs.

- `extensions/pr-review/cli-runtime.mjs` resolves an explicit
  `COPILOT_CLI_PATH`, otherwise `copilot` in an absolute PATH directory.
  Explicit errors do not fall back; empty/relative PATH entries are skipped.
- `extension.mjs` passes the resolved path to
  `RuntimeConnection.forStdio({ path })` for both quick and fixture runs.
  Publish-later still constructs no inference client.
- The old bare `forStdio()` relied on npm platform-package resolution unless
  `COPILOT_CLI_PATH` was inherited. All previous native harnesses exported that
  variable, masking the ordinary-shell bug.
- `smoke-runtime.mjs` now removes the override from its child's environment.
  Its new `--targets --startup` case failed against the old installed plugin
  with the exact reported error and passed after installing this fix.
  It dispatches a skipped quick review and separately starts/pings/stops the
  actual SDK runtime with the plugin resolver, without a model prompt.
- `smoke-cli-runtime.mjs` and `smoke-quick.mjs` also passed. Full evidence,
  consulted official/installed APIs and reproduction are in the roadmap's
  "Manual-test blocker" section.

The corrected extension is installed locally; the user needs a **fresh
interactive Copilot session** to retry the original invocation. The private PR
was not fetched or reviewed in this session; no inference or publication was
performed. Successful startup plumbing is not evidence of a complete review on
the user's target. Investigate further manual-test failures before continuing
M1. Do not alter personal model assignments or project trust to make a run pass.

Native evidence is macOS arm64 / CLI 1.0.83 / Node 26.1.0, not other platforms.
PATH selects the installed CLI; compatibility with the hosting SDK remains the
installer's responsibility. Consult installed SDK and current official docs
before adopting new runtime APIs; demonstrate rather than infer support.

## Reproduction

```sh
node scripts/smoke-cli-runtime.mjs
node scripts/smoke-quick.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
```

The override above is only for the harness launcher, not the installed
extension's environment. Fixture `gh` stays in child-only PATH; never expose it
to ordinary commands. Reinstall after extension edits and use a fresh runtime.
Direct local install still works with a deprecation warning; marketplace
migration is not this task.

Personal configuration exists now; older "neither file exists" notes are stale.
This session did not write either personal configuration or trust.
Any future probe touching the real store must snapshot and restore BOTH
`~/.copilot/pr-review/config.json` and
`~/.copilot/pr-review/trusted-projects.json`, including directory cleanup only
if it created the directory. Do not run `smoke-config-runtime.mjs` assuming an
empty initial store: it currently asserts that state despite snapshotting it.
Project-file probes belong in disposable fixture checkouts, not this repo.

## Feature plan after manual testing

Implement only the balanced half of M1, following the exact acceptance criteria
at the end of `ROADMAP.md`. Balanced uses four heavy specialists (correctness,
contracts, security, performance/resources) plus one light overview reviewer,
becomes the default, and permits at most three direct-diff P3/nit findings in
addition to P0-P2. Resolve the light tier through existing layered configuration.
M1 stays Pending until full's conventions reviewer and policy also land later.
Do not implement full, deep, fallbacks, safeguards or a menu now. Keep L1 pending
and copy no upstream source.

Bare `/pr-review NUMBER` is still capture-only. When balanced becomes default,
decide and record how bare-number invocation changes while keeping capture-only
reachable for existing probes. Do not change publication or configuration gates.

C2 precedence remains per key: invocation flags, trusted project, personal,
ambient; nearest-tier inheritance runs over the merged result. Trust is exact
canonical directory identity, not repository identity, and cannot be self-granted
by project content. Only heavy is consumed until M1.

Remaining caveats from the roadmap still apply: configuration-authorized live
publication is unproven; no cross-process config/retention lock exists; final
GET/POST is not atomic; live LEFT/multiline/rename/deletion anchors remain
unproven; command-only SDK sessions cannot cold-resume; Q4 semantic/context
limits and F3 process-loss limits stand.

Playground PRs #1 and #2 already have published plugin reviews. Do not repeat
their POSTs or merge their branches. Existing live-publication evidence and
identifiers remain in `ROADMAP.md`; no playground change was made here.

## Commit and hand off

Follow `AGENTS.md`: inspect diffs, validate relevant changes, record evidence and
remaining limitations in `ROADMAP.md`, and commit coherent checkpoints.
Preserve unrelated changes; do not amend, rewrite history or push without new
explicit authorization.

After implementation, validation and all other documentation edits, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit, reference
an existing checkpoint rather than that future commit's hash, and report the
commit outcome with a pointer to this file.
