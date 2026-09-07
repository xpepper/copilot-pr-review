# Next-session handoff prompt

Continue from recorded files, not prior conversations.

Read `AGENTS.md`, `SCOPE.md` as the authoritative product specification, and
`ROADMAP.md` as the progress/evidence record. Inspect git status, recent commits
and implementation before editing. Reconcile this prompt against them if
necessary. Implement only the next recorded increment; do not reopen settled
product decisions or assume access to this conversation. Distinguish demonstrated
behavior from assumptions.

## Recorded state

C2 is complete. Implementation checkpoint **`56ace3f`** follows the C1 checkpoint
`47c8901` and the C1 handoff commit `bef39bf`. `origin/main` is at `bef39bf`, so
local `main` is one commit ahead. **Do not push without new explicit
authorization.**

At handoff creation the only uncommitted file is `HANDOFF.md`, which belongs in
the commit containing this prompt. No unfinished or unrelated work is carried
forward, and no background work is pending. The installed plugin currently
matches this checkout; reinstall after any edit and use a fresh runtime.

Relevant implementation:

- `config.mjs` owns the personal store, the trust store, layered resolution and
  the effective-configuration report. `project.mjs` owns the trusted-project
  boundary: project-file location, safe reading, and trust-record validation.
- Keys are `lightModel`, `lightEffort`, `mediumModel`, `mediumEffort`,
  `heavyModel`, `heavyEffort` and `autoPostReviews`. A project file may carry the
  same keys and nothing else.
- `/pr-review-config` accepts `show` (also the empty argument), `key=value`
  assignments, `unset KEY`, `trust`, `untrust [ABSOLUTE_PATH]` and `help`.
- **Precedence is per key: invocation flags, then a trusted project's settings,
  then personal settings, then ambient.** Tier inheritance runs over the merged
  result and each value reports its origin: `flag`, `project:heavy`,
  `project-inherited:light`, `configured:heavy`, `inherited:light`, `ambient`,
  `unset`. `loadConfiguration` returns `effective: { settings, origins }`, which
  is what `quickAssignments` resolves; `configuration.settings` is still the
  personal layer only.
- Trust is bound to the canonical absolute path of the session working
  directory, recorded in `<copilot-config-home>/pr-review/trusted-projects.json`.
  It proves the user trusted that exact directory, not which repository is there.
  Exact path only, never a prefix. An untrusted repository's file is located but
  never parsed. Nothing inside a repository can grant, widen or refresh trust.
- A broken or unusable trusted project file refuses the review and any personal
  update, but `show` still renders the error and `untrust` still works.
- The pre-execution report is now logged **before** `quickAssignments`, so a
  refused review still explains itself.
- Quick review consumes the heavy tier only. Light and medium are stored,
  resolved and displayed but unused; M1 is where the light tier first runs.

## Implement the balanced half of M1 only

Follow the exact acceptance criteria at the end of `ROADMAP.md`. In short:
`--balanced` runs four heavy specialists (correctness, contracts, security,
performance/resources) plus one light overview reviewer; balanced becomes the
default mode; the findings policy adds at most three direct-diff P3/nit findings
to the existing P0-P2 set; the light reviewer must actually resolve the light
tier through the existing layered configuration.

M1 stays Pending until the full mode's conventions reviewer and findings policy
also land, which is the increment after. Do not add full or deep now, nor
fallbacks, safeguards or an interactive menu. Do not change publication gates or
the configuration surface. Keep L1 pending and copy no upstream source.

**One decision this increment forces, which is not yet settled:** today a bare
`/pr-review NUMBER` is capture-only, but `SCOPE.md` says balanced is the default
mode. Decide and record what a bare number does, and keep a capture-only path
reachable for the existing probes, which depend on it heavily
(`scripts/smoke-runtime.mjs --targets`, `runtime-target.mjs`).

Prefer the existing no-inference probes for plumbing. Spend inference only for
the one live balanced review needed to prove real reviewer output, and record
whether it was run. Consult the installed SDK and current official documentation
before adopting new runtime APIs, and demonstrate capabilities instead of
inferring them.

## Demonstrated behavior and runtime caveats

CLI 1.0.83 / bundled SDK, Node 26.1.0, macOS arm64. Explicit native assignment
`gpt-5.6-terra` / `high` is evidence, not a product default.

`scripts/smoke-config-runtime.mjs` passed against the installed plugin **without
spending any credits**: the model and effort it passes are session configuration
and no prompt is ever sent. It proved an untrusted project file ignored and never
parsed, two self-trust attempts recording nothing, explicit trust recording the
canonical path, the override surviving an extension reload, a real quick
invocation driven by the project file with `autoPostReviews: true [project]`, an
invocation flag still winning, six broken or unusable trusted files refusing both
the review and a personal update, and revocation restoring the personal
assignment. It now runs the session in the disposable fixture checkout.
`smoke-config.mjs`, `smoke-runtime.mjs`, `smoke-runtime.mjs --targets` and
`smoke-retention-runtime.mjs` also passed without inference.

Known limits carried forward:

- The trust binding proves a directory, not a repository. A different checkout
  placed at a trusted path inherits the trust; a moved directory loses it.
- A configuration-authorized publication has **not** been exercised natively,
  whether the authority is personal or project-supplied, because it needs a real
  inference review. The controlled retained runs prove the effective setting
  reaches the retained posting policy, and `smoke-preview.mjs` proves the
  `config-authorized` status.
- Validation binds to the models the current session reports, so a saved or
  project-supplied assignment can become unusable under a different ambient
  model; `show` marks it `UNUSABLE` and the review refuses.
- Neither personal file has a cross-process lock; the last writer wins.

Publication limits are unchanged: the final GET/POST is not an atomic
compare-and-submit transaction, retained storage has no cross-process lock or
power-loss guarantee, live LEFT/multiline/rename/deletion anchors remain
unproven, command-only SDK sessions still cannot cold-resume, and Q4
semantic/context-window and F3 process-loss limits stand.

The user authorized synthetic remote branches/commits/PRs through the GitHub
API. **Both playground PRs already hold a published plugin review; do not repeat
either POST and never merge these branches.** C2 needed no playground change, so
this state is unchanged from the previous handoff.

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
increment.

**Any probe that touches the real personal store must snapshot and restore it.**
That now means two files, `~/.copilot/pr-review/config.json` and
`~/.copilot/pr-review/trusted-projects.json`, and removing the directory if the
probe created it, as `smoke-config-runtime.mjs` does. Neither file exists now.
A probe that needs a project configuration file must write it inside a disposable
fixture checkout and set the session working directory there, never into this
repository.

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
