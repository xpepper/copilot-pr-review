# Next-session handoff prompt

Continue from recorded files, not prior conversations. Read `AGENTS.md`,
`SCOPE.md` as the authoritative product specification, and `ROADMAP.md` for
progress, evidence, caveats and the exact next increment. Inspect git status,
recent commits and implementation before editing; reconcile stale notes against
them. Respect scope constraints and distinguish demonstrated behavior from
assumptions. Follow these same checkpoint-commit and final-file handoff rules
in turn.

## Current priority: classification/presentation fix, then manual testing

The user paused the feature plan to try the plugin in an ordinary interactive
session. Running `copilot --experimental --yolo` and then
`/pr-review 727 --quick --no-comment --all` failed at SDK construction because
the bundled SDK could not resolve `@github/copilot-darwin-arm64`.

Startup checkpoint **`ff78dcb`** fixed that blocker, following `0a32e77` and
C2's `56ace3f`. The user then retried the review and we inspected its saved
events/result read-only. The changes accompanying this prompt record the
subsequent agreed priorities only; the classification fix is not implemented.
At handoff creation only `ROADMAP.md` and `HANDOFF.md` are uncommitted, both
belonging to this documentation checkpoint. No unrelated or unfinished code is
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

The corrected extension is installed locally. The user's subsequent manual run
completed all three reviewers with no execution/cleanup errors or cancellation.
No candidates were returned and nothing was published. However, general caveats
about unavailable external component implementations caused the result to be
classified as incomplete. `findings.mjs` currently turns every reviewer
`limitations` entry into an issue and every issue into incomplete validation.
This is not another startup failure or evidence of an unavailable executable.
No additional inference or publication was initiated by the diagnostic session.

**Implement only the classification/presentation fix described under "Exact
next increment" in `ROADMAP.md`.** Distinguish execution failures and substantive
coverage gaps from informational caveats. Preserve true uncertainty and do not
claim that zero findings proves a PR clean. Choose explicit structured
categories, handle existing retained results conservatively, and keep final
output, retained inspection and publication-facing descriptions consistent.
Cover caveat-only, genuine-gap, failure and mixed cases with synthetic fixtures,
not private review payloads. Preserve all authority/publication gates.

After the fix, resume manual testing to surface feedback before M1. Do not
alter personal model assignments or project trust to make a run pass.

**Read-only investigation tools are deferred for a separate discussion.**
The user is interested in allowing them, but no concrete tool set or permission
design is agreed. Current reviewers have no tools at all (`read-only.mjs`);
they cannot independently investigate beyond supplied revision-bound context.
This is an implementation boundary, not a necessary property of read-only
review and not caused by omitting `--verify`, which is still unimplemented.
The user reports `gh-aw` should be available via mise; this was not tested.
Do not add tool access, automatically execute mise/gh-aw, or implement
safeguards as part of the classification fix. The relative priority of future
investigation-tool implementation and M1 remains open.

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

Once manual-feedback work is complete and the feature plan resumes, implement
only the balanced half of M1, following its recorded acceptance criteria
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
