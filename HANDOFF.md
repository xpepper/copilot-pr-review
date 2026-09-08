# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions.

## Recorded state

This handoff is prepared for a fresh session on **clean `main` after the
user-authorized merge of pull request #15**, which carried `Q7` from branch
`q7-absent-path-refusal`, branched from `main` at `bf7d390`. Confirm the merge,
branch and working-tree state before proceeding; if #15 is still open, report the
unfinished merge rather than starting another increment. The only other open
pull requests should be the synthetic playground ones, #1 and #2, which must
never be merged or republished. A squash merge need not retain the individual
commits as ancestors of `main`; use #15 and git history to reconcile state. No
uncommitted work or increment in flight is intended to remain.

`Q7` is complete. Its boundary was discussed and approved before any code was
written, which is now the expected sequence for an increment that touches a
gate. The implementation checkpoint `ca955b4` was reviewed once with the
installed plugin. `4db18e1` fixes the two findings that review produced;
`0df867d` and `a3be435` record evidence, and this handoff is documentation only.
**Nothing after `ca955b4` has been reviewed again**, and this increment's single
authorization is spent.

## What `Q7` settled

**An absent path is refused as absent, not as an escape.** The path stays
refused, no reviewer gains a read it did not have, and only the reason changes.
The reason is given only for a request that would have been inside the root had
it existed: an absolute path, lexically under the root before any filesystem
call, whose nearest existing entry still resolves inside the root. Everything
else keeps the mute refusal it had, because saying that a path outside the root
does not exist would report on the host filesystem.

Six choices are settled and must be preserved: the out-of-root refusal stays
mute; the two refusals are recorded apart as `read` and `read-absent`; the
message names the path **as it was requested**, never a normalized form; the
walk climbs only past an entry that is genuinely missing; a relative path keeps
its previous approval behaviour and never receives the absent reason; and the
live probe asserts a stable substring rather than a whole sentence.

**No retained-record schema changed and no version was bumped.**
`retainedRecord` picks a reviewer key list that excludes `policy`, so read
denials never enter the record. They appear in the run's logged evidence JSON.
Ask before changing the retained-record schema version: it tracks publication
authority, not candidate shape.

## The confinement defect this increment found

`fs.realpathSync` collapses `..` textually before it resolves symlinks; the
operating system does not, and neither does the `open()` the read tool performs.
A checkout containing a symlink to a directory, plus a decoy of the same
relative name inside the root, was enough to have the handler approve one path
while the reviewer read another, outside the checkout, recorded in the evidence
as an in-root read. The checkout is the pull request head, so a pull request can
supply both halves. The fix, `6575e9e`, resolves with the operating system
resolver. It was found while implementing `Q7`, and the user explicitly
authorized folding it into this increment rather than scheduling it separately.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop the refusal from saying where a symlink points.

## Review of record and remaining limits

`Q7`'s single authorized review used explicit **balanced** mode, the default
topology, because the increment adds no mode. It cost **106.509803 credits**.
Four heavy reviewers ran `gpt-5.6-terra`/high, overview ran `gpt-5.6-luna`/high,
the adjudicator ran `gpt-5.6-terra`. There were 36 tool calls and 36 confined
reads, with **no permission denial and no tool denial**.

Coverage is **INCOMPLETE**: three execution failures, zero coverage gaps, five
informational caveats, and two accepted P2 findings. This is not a clean-review
claim. Both findings were real defects in the new code and both are fixed, with
tests confirmed red against the reviewed implementation. One reviewer claim was
rejected with reasons and recorded as rejected: the described existence oracle
does not reproduce, because the reviewed implementation answered with the absent
reason whether or not the external target existed. The underlying defect it
pointed at was real and is fixed.

**`C5`'s demotion fired live for the first time.** The `overview` reviewer
returned invalid JSON, `envelopeVerifier` threw, and an attempt that had settled
`completed` was demoted to `incomplete`. No tier had a configured fallback, so
none started. That closes half of `C5`'s live gap. **The other half is
unchanged**: no live review has ever had a fallback configured, so no fallback
has ever started from a demotion.

What the run does not show: no reviewer was refused an absent path, so `Q7`'s
own behaviour has no live evidence. The reason is demonstrated to reach the tool
result's model-facing text on the real runtime, by no-inference probe. What a
reviewer does with it is model behaviour and is unproven. `Q7` removes a
plausible cause of the reviewer failures on #6, #11 and #13; it does not
establish causation, and a later clean run would not either.

The complete timeline was saved before analysis, outside the checkout, as
`q7-review-timeline.log` in the originating session's scratchpad, alongside
`q7-review-evidence.json` and the per-reviewer verbatim strings. They stay
local. The roadmap records the invocation, binding, charges and reproduction.

## Exact next step

**The next increment is `V1a`: the `--verify` flag and its preflight refusal.**
Read "The next increment is `V1a`" under "Exact next increment" in the roadmap;
it is authoritative and fuller than this summary.

`V1` in `SCOPE.md`, the opt-in project safeguards, is the last agreed v1
capability not started, and far too large for one increment. `V1a` is its first
slice and deliberately the one that **executes nothing**: no safeguard
discovery, no approval prompt, no command execution, no change to what any
reviewer receives. A verification-enabled run either passes the preflight and
proceeds as an ordinary review, or stops before any reviewer starts.

Two of the three preconditions `SCOPE.md` requires already hold for every
review: `assertReviewableCheckout` in `checkout.mjs` refuses unless local `HEAD`
equals the captured head and no tracked file is modified or staged. **It never
reads the current branch name**, so a detached `HEAD` at the right commit passes
today, and untracked files warn rather than refuse. `V1a` is a bounded addition
to that existing gate.

**Discuss the boundary and present it before writing code, then wait for the
user's explicit approval.** That sequence worked for `C5` and `Q7` and is now
expected for any increment that touches a gate. The roadmap names five choices
to settle first, with a recommendation for each: untracked files under
`--verify`, branch identity and detached `HEAD`, where the gate lives, flag
interactions, and what a passing preflight does when nothing can run yet.

**Do not start another increment instead**, and do not pull safeguard discovery,
approval or execution into `V1a`. Executing pull-request controlled code is the
largest safety boundary in this project and needs its own increment, discussion,
tests and review. A review against a substantial code diff, a live review with a
fallback configured, a live review in which a reviewer is refused an absent
path, and `L1` are all recorded as open in the roadmap and none is scheduled.

## Validation and runtime caveats

The twelve controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture and target. They require no inference or network. All
twelve pass at this handoff, as they did at each checkpoint. `git diff --check`
is clean.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside that twelve,
must be run and reported for any increment touching `read-only.mjs`. It spends
no inference and sends no prompt, but it needs a live runtime connection, so it
needs `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-reviewer-tools.mjs
```

It passes at this handoff, including the assertions that reads outside the
checkout are denied, that an absent in-root read is refused as absent, and that
a dangling symlink in the checkout keeps the mute refusal.

`Q7`'s controlled cases live in `scripts/smoke-fixture.mjs`, which drives the
permission handler against a real temporary checkout containing a symlink out of
it, a symlink within it, dangling symlinks, and a decoy file. Its escape
regression asserts first that the request really opens a file outside the
checkout, then that the handler refuses it. Keep that ordering: without the
first assertion the test can pass while testing nothing.

**Never add a timeout, deadline or stuck-reviewer heuristic.** `SCOPE.md`
forbids review timeouts, and both `C3` and `C5` depend on their absence.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`. Consult the installed SDK and current official
documentation before adopting new APIs. Do not revisit Agent Factories without a
new CLI version. Do not widen `F6`'s marker unwrap or reintroduce substring
matching. The three no-inference runtime facts `Q7` established are recorded in
the roadmap: every path reaching the permission handler is already absolute,
absolute paths arrive verbatim, and a rejection's `feedback` reaches the
model-facing tool result while flipping `resultType` from `rejected` to
`denied`.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited in the `Q7` session.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows.

## For a future authorized increment

Work on its own branch and pull request. Commit and push first; check out that
pull request head before installing.

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
hang. `copilot -p "/pr-review NUMBER"` starts an ambient model turn and is not a
substitute for command dispatch. Findings stay local; no publishing is
authorized.

The standing workflow authorizes exactly one review per increment pull request,
not reruns, extra probes, or `scripts/smoke-factory.mjs --spend`. Historical
reviews are already spent and carry no authorization forward.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. Merging remains the user's decision. Preserve unrelated
changes. Inspect enumerations and counts when extending a concept. Update
`README.md` for user-visible behaviour; `Q7` did, under "An absent path is
refused as absent (Q7)" and in the confinement paragraph above it.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
