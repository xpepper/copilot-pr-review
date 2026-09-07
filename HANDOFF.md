# Next-session handoff prompt

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for evidence, runtime caveats and the exact next increment.
Inspect the working tree, recent commits and relevant implementation before
editing; reconcile stale notes against git state. Implement only the next agreed
increment, respect scope constraints, and distinguish demonstrated behavior from
assumptions. Follow the same checkpoint-commit and final-file handoff rules in
turn; do not depend on any prior conversation.

## Current priority: R1, first half

This handoff follows checkpoint `4477e2e`, which added presentation-only
consolidation of equivalent coverage gaps. That fix was manually tested this
session and **did not work**; see the ROADMAP section "Manual-feedback finding:
consolidation did not fire on real reviewer wording" for the measurements.

The current checkpoint adds `scripts/smoke-reviewer-tools.mjs`, the F4
capability probe, plus the ROADMAP evidence. Inspect git history for its
containing commit; do not infer or embed that future hash. A follow-up checkpoint
records the agreed hard revision-identity gate. At handoff creation
all uncommitted files belong to this checkpoint, no background work remains,
and nothing was pushed.

The next action is the **first half of R1**: grant quick reviewers confined
read-only access to the local checkout, gated on revision identity. The exact
acceptance criteria are in ROADMAP's "Exact next increment"; implement from
there, not from memory of this text.

## Why the direction changed

Manual testing of `primait/starsky#8126` showed the pipeline works but produces
nothing useful for that PR class. Reviewer input is the diff plus hunk-window
context for **changed files only**, so for a dependency-removal PR the reviewers
saw only `Cargo.lock` and three `Cargo.toml` files. The decisive fact — whether
any crate source still imports `lapin` — lives in unchanged files that are never
fetched, and both `quickInstructions` and `reviewerPolicy` forbid looking. All
three specialists correctly reported the same blocked assessment. Any PR whose
risk lives in unchanged callers is currently unreviewable.

Upstream at pinned commit `457e18e` tells reviewers to open surrounding files
and callers, and runs its heavy passes with repository-context tools. `SCOPE.md`
already permits reading surrounding code to establish context and confirm
impact, and F3 required enforceable **read-only** permissions, not zero tools.
So relaxing the zero-tool policy needs no scope change.

The user directed that reviewers must not be limited in what they can read, and
chose the **local checkout** as the read source. Running tests or linters is
explicitly a later increment, not this one.

## What F4 demonstrated, and what it did not

Demonstrated natively on macOS arm64 / CLI 1.0.83 / bundled SDK / Node.js 26.1.0:
the built-in catalog's real names; that `ToolSet().addBuiltIn(["view","grep",
"glob"])` grants exactly those three; that `bash`, `create`, `edit`, `task`,
`sql`, `web_fetch` and `write_agent` remain natively refused inside that session;
that a granted `view` executes against a directory set with
`metadata.setWorkingDirectory`; that the permission handler receives
`{ kind: "read", path }` and confines reads to a chosen root, rejecting an
outside path without leaking content; and that the grant does not leak into a
later zero-tool session. No inference was spent.

Not demonstrated: that a reviewer model uses read tools well or stays in PR
scope while reading; anything about revision identity; and custom plugin-owned
tools, which were read in the SDK but never exercised.

**Act on this before granting any tool:** the runtime accepts only
`approve-once`, `approve-for-session`, `approve-for-location`, `reject`,
`user-not-available` and `approved`, and refuses `approved` at orchestration
time. `read-only.mjs` returns `{ kind: "denied-no-approval-rule" }`, which the
runtime rejects as an unknown variant, turning a denial into a transport
failure. It is unreachable today only because reviewers hold no tools. Correct
it to `reject` as part of R1.

**The central risk to design against:** a checkout parked on a different branch
would give reviewers evidence about code that is not the reviewed head. That is
exactly the failure Q2 was built to prevent. The user's decision is a **hard
stop before any reviewer starts**, not a degraded fallback: local `HEAD` must
equal the captured PR head SHA, the remote PR head must still equal the captured
head at review start, and no tracked file may be modified or staged. On any
mismatch, refuse and name the failed condition plus the exact fixing command
such as `gh pr checkout <number>`. There is no override flag and no context-only
fallback. A moved remote head means the snapshot is stale: stop and let the user
re-run. Non-ignored untracked files warn only. Never switch branches, stash,
pull or clean to satisfy the gate. Accept the usability cost: `/pr-review` will
refuse on an unrelated branch, and `README.md` must say so.

## Validation and reproduction

```sh
for script in smoke-findings smoke-quick smoke-selection smoke-retention \
  smoke-preview smoke-publication smoke-publish-later; do
  node "scripts/$script.mjs" || exit
done
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-reviewer-tools.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
```

All seven controlled suites, the new probe, both native no-inference probes and
`git diff --check` passed. The plugin was reinstalled at the start of the
session; no extension file changed afterwards. Direct local plugin installation
still emits its deprecation warning. Command-only cold resume remains
unsupported.

## Boundaries and deferred work

Do not add `--verify`, test or lint execution, `bash`, revision-bound custom
tools, balanced/full/deep, fallbacks or timeouts in this increment. Balanced M1
is deferred behind R1; its plan remains in ROADMAP. Bare `/pr-review NUMBER`
stays capture-only.

Do not alter personal configuration, project trust, selection, binding/head,
lifecycle, publication or authorization gates. Do not run
`smoke-config-runtime.mjs` assuming an empty personal store; any authorized
real-store probe must snapshot and restore both personal config and
trusted-project files. Keep fixture `gh` in child-only PATH.

Leave the presentation consolidation alone for now; it is cosmetic relative to
the real cause, and reviewer reads may remove the repeated gap entirely. Keep L1
pending and copy no upstream source. Existing command-only cold-resume, locking,
non-atomic final GET/POST, live anchor, semantic/context and process-loss
limitations remain recorded in `ROADMAP.md`. Existing playground publication
evidence must not be repeated or its synthetic branches merged. Do not rerun a
private review, spend inference, publish anything or access private review
content without explicit authorization.

If a future increment needs a new runtime API, consult the installed SDK and
current official documentation and demonstrate the capability rather than
inferring it from type declarations, as F4 did.

## Commit and hand off in turn

Follow `AGENTS.md`: validate applicable changes, inspect diffs, update
`ROADMAP.md` with evidence and remaining limits, and commit coherent checkpoints.
Preserve unrelated work; do not amend, rewrite history or push without explicit
authorization. Reinstall the plugin after any extension change.

After all other implementation, validation and documentation edits, replace
`HANDOFF.md` as the final repository file edit before the session-ending commit.
If another edit becomes necessary, refresh it last again. Include it in that
commit, reference an existing checkpoint rather than its future hash, and report
the commit outcome with a pointer to this file.
