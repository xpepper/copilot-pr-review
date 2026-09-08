# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the exact next increment. Do not rely on this
conversation or reopen settled decisions.

## Recorded state

This handoff is prepared for a fresh session on **clean `main` after the
user-authorized merge of pull request #14**. Confirm the merge, branch and
working-tree state before proceeding; if #14 is still open, report the unfinished
merge rather than starting another increment. The only other open pull requests
should be the synthetic playground ones, #1 and #2, which must never be merged or
republished.

`C5` is complete. Its branch was `c5-discarded-output-eligibility`, from `main`
at `58deae8` (the squash merge of #13). Implementation checkpoint `2bddb6c` was
reviewed with the installed plugin once, at head `761e01c`; `190004d` recorded
that review. The later checkpoints, including this handoff, change documentation
only and were not reviewed again. A squash merge need not retain those individual
commits as ancestors of `main`; use #14 and git history to reconcile state. No
uncommitted work or increment in flight is intended to remain.

`C5` makes a discarded reviewer output an eligible failed attempt. An attempt
that settled `completed` is demoted to `incomplete`, and so becomes eligible for
its tier's one configured fallback, **if and only if `envelope()` throws on its
output**. If `envelope()` returns, the attempt stays `completed` whatever becomes
of the candidates inside it. The check is an optional `verifyResult` callback on
`runAttempt`, beside the existing usage-mismatch demotion, supplied by
`review.mjs` as `envelopeVerifier(...)` for the specialists and for the
adjudicator on its own `decisions` field. It is the same `envelope()` call
collection makes, exported as a predicate, never a weaker gate.

The four choices the user approved before implementation are settled and must be
preserved: the adjudicator is in scope; an envelope whose every candidate is
refused is **not** eligible; a well-formed envelope bound to the wrong review key
**is** eligible, with no carve-out; and demotion never depends on a fallback
being configured. Do not move the check into `findings.mjs` and do not extend
eligibility below the envelope. Both were considered and rejected with reasons in
the roadmap, the second decisively: there is no timeout, so a hung reviewer never
settles, and validating after the batch would let one hung reviewer block every
other reviewer's fallback indefinitely.

Keep a candidate refused at the evidence boundary, an envelope reporting no
candidate, and a `Q6` quote repair distinct from an unusable envelope. None of
them is a failure and none is ever retried. `Q5` and `Q6` remain settled and
answer the discarded-true-finding problem by fixing the gate, which is a
different repair from retrying a reviewer; do not merge the two. No
retained-record key, status vocabulary or schema version changed for `C5`;
`C3`'s invariants already described the shape. Ask before changing the
retained-record schema version: it tracks publication authority, not candidate
shape.

## Review of record and remaining limits

`C5`'s single authorized review used explicit **balanced** mode, because it adds
no mode and balanced is the default topology. It cost **110.736851 credits**.
Four heavy reviewers ran `gpt-5.6-terra`/high; overview ran `gpt-5.6-luna`/high.
All five completed and every envelope parsed. There were 42 tool calls and 42
reads, with **no permission denial and no tool denial**.

Coverage is **INCOMPLETE**: one coverage gap and three informational caveats,
with **zero execution failures**. There were zero candidates, so no adjudicator
session ran, and no findings, withheld findings or publication. This is not a
clean-review claim. No defect candidate was proposed, so no implementation fix
followed. Do not weaken a gate or rerun to obtain a positive result.

**What the run does not show matters as much as what it does.** No reviewer was
demoted, because every envelope parsed, so the demotion path is controlled-only
evidence. **No tier had a configured fallback**, so no fallback attempt could
have started even had one been demoted; the `C3` execution path `C5` feeds
remains live-unobserved, as it was before that increment. Zero candidates means
the adjudicator never ran, so the `decisions` verifier is controlled-only too.
The narrower live result is real and worth keeping: the verifier ran on five real
outputs, on the execution seam, and demoted none, so it does not reject
well-formed live output that collection then accepts.
`performance-resources` reported the runtime-cost gap and `contracts` the
live-fallback caveat; both are preserved as reported.

The complete timeline was saved before analysis, outside the checkout, as
`c5-review-timeline.log` in the originating session's scratchpad, alongside
`c5-review-evidence.json` and the five `c5-<reviewer>-verbatim.txt` strings.
They stay local. The retained review is bound to originating session
`13aa9f39-f66d-491b-bd5a-05be35833afb`; the roadmap records its invocation,
review key, charges and exact reproduction command.

## Exact next step

**The next increment is `Q7`: an absent path is refused as absent, not as an
escape.** Read "The next increment is `Q7`" under "Exact next increment" in the
roadmap; it is authoritative and fuller than this summary.

**Discuss the boundary and present it before writing code, then wait for the
user's explicit approval.** That sequence worked for `C5` and is now expected for
any increment that touches a gate. Merging #14 is not authorization to implement
`Q7` or to spend credits.

`insideRoot` in `read-only.mjs` resolves a requested path with `realpathSync` and
returns `undefined` when that throws, so the permission handler rejects a path
that simply does not exist inside the reviewed checkout exactly as it rejects one
outside it, and the reviewer is told it may only read inside the checkout. That
has landed on a reviewer that then failed on **#6, #11 and #13**; on #13 the
`contracts` reviewer searched a nonexistent root-level `findings.mjs` and then
produced no usable output. Temporal association does not prove causation, and the
roadmap has never claimed it does.

**The safe direction is fixed in advance: an absent path stays refused. Only the
reason changes.** `Q7` must not widen what any reviewer may read. The hard part
is that the distinction must not leak: telling a reviewer that a path outside the
root does not exist would report on the host filesystem, which is what
confinement exists to prevent. The absent-path reason may only be given for a
request that would have been inside the root had it existed, decided without
resolving or stating anything outside the root. Weigh lexical containment before
any filesystem call, the symlink case that `realpathSync` is there for, whether
`permissionDenials` should record the two kinds separately and what that does to
`smoke-reviewer-tools.mjs` and the retained record, and whether relative, empty
and non-string paths keep their current refusal.

`C5` did not fix this and is not a fix for it: it makes a reviewer that fails
after such a denial eligible for a configured fallback, which is a different
attempt with the same misleading refusal.

**Do not start another increment instead.** A review against a substantial code
diff, a live review with a fallback configured, `L1` and `V1` are all recorded
as open in the roadmap and none is scheduled or authorized.

## For a future authorized increment

Work on its own branch and pull request. Commit and push first; check out that
pull request head before installing. Only after that increment is authorized:

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --balanced --all --no-comment
```

Choose the mode explicitly and justify it; balanced is the default when no other
topology is required. Capture the complete stdout timeline outside the checkout
and save original reviewer strings before analyzing. Do not modify the working
tree while reviewers read it. There is no timeout: a quiet timeline is not a
hang. Wait for completion or explicit manual cancellation.
`copilot -p "/pr-review NUMBER"` starts an ambient model turn and is not a
substitute for command dispatch. Findings stay local; no publishing is
authorized.

The standing workflow authorizes exactly one review per increment pull request,
not reruns, extra probes, or `scripts/smoke-factory.mjs --spend`. Historical
reviews are already spent and carry no authorization forward.

## Validation and runtime caveats

The twelve controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture and target. They require no inference or network. All
twelve passed before `C5` editing, at the reviewed implementation checkpoint, and
again after the documentation commits. `git diff --check` is clean.

`Q7` will also touch `scripts/smoke-reviewer-tools.mjs`, the confinement probe
outside that twelve. It spends no inference and sends no prompt, but it needs a
live runtime connection, so it must be run with the same `COPILOT_CLI_PATH` and
`COPILOT_SDK_PATH` settings the review dispatch uses, and it must be run and
reported for that increment. It passed unchanged at this handoff, including
"reads outside the reviewed checkout are denied by the permission handler",
which is the assertion `Q7` must keep true while changing only the reason.

`C5`'s focused additions are in `smoke-review.mjs`, whose harness now scripts
reviewer prose, a wrong-key envelope, a refused candidate beside a valid one and
a fallback that returns prose, and in `smoke-findings.mjs`, which holds
`envelopeVerifier` to exactly the corpus `collectCandidates` accepts and
discards. Keep those equivalence assertions: `envelope()` now has two callers
that must stay identical.

**Never add a timeout, deadline or stuck-reviewer heuristic.** `SCOPE.md` forbids
review timeouts, and both `C3` and `C5` depend on their absence: elapsed time is
never a fallback trigger, and `C5` sits beside the reviewer precisely because a
hung reviewer never settles.

No runtime API was changed. CLI 1.0.83 remains the recorded runtime. Derive the
SDK path from `copilot --version`; old packages remain installed. Consult the
installed SDK and current official documentation before adopting new APIs. Do not
revisit Agent Factories without a new CLI version. Do not widen `F6`'s marker
unwrap or reintroduce substring matching; #14 added five more well-formed
envelopes to its live evidence and changed nothing about it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. It requires a second
non-ambient model with configurable effort and a model with none. That file was
not moved or edited in the `C5` session.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. Merging remains the user's decision. Preserve unrelated
changes. Inspect enumerations and counts when extending a concept. Update
`README.md` for user-visible behaviour; `C5` did, under "Discarded output is a
failed attempt (C5)", and it also corrected the `C3` section that still promised
the asymmetry `C5` closed. `Q7` changes a user-visible refusal message and will
need its own README update.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
