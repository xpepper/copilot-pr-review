# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

## Recorded state

This handoff is prepared on branch **`v1a-verify-preflight`**, with **pull
request #16 open and awaiting the user's merge decision**. It carries `V1a`,
branched from `main` at `5d9eb8c`. Confirm the branch, the pull request and the
working tree before proceeding. If #16 has been merged, start from clean `main`
and reconcile against git history; a squash merge need not retain the individual
commits as ancestors. If it is still open, the merge is the user's call and is
not yours to request again unless they ask. The only other open pull requests
should be the synthetic playground ones, #1 and #2, which must never be merged
or republished. No uncommitted work or increment in flight is intended to remain.

`V1a` is complete. Its boundary was discussed and approved before any code was
written, which is now the expected sequence for an increment that touches a
gate. Five commits carried the implementation and its evidence, ending at
`88400df`, which is **the revision the installed plugin reviewed**. `5b2d897`
fixes the one finding that review produced, and `2e86bbb` records the review and
its outcome. This handoff is documentation only. **Nothing after `88400df` has
been reviewed again**, and this increment's single authorization is spent.

## What `V1a` settled

**`--verify` adds a preflight and deliberately executes nothing.** No safeguard
is discovered, none is presented, none is approved, and none is run. No
reviewer's input changes at all: the system message and prompts of a
verification-enabled run are exactly an ordinary review's, which
`scripts/smoke-review.mjs` asserts directly. A run that passes the preflight is
an ordinary review of its mode, and the timeline says so in those words, because
a flag named `--verify` must never read as evidence that something verified the
change.

Five choices are settled and must be preserved: untracked paths refuse under
`--verify` only, while an ordinary review still warns; a detached `HEAD` and any
branch other than the captured head ref are refused; the stricter conditions
live in the one existing gate as a profile, never in a second gate; the flag is
orthogonal to the mode and posting flags, is refused with `--capture-only`, and
is **deliberately not a configuration key**, so no saved or trusted-project
setting can turn verification on; and a passing preflight is an ordinary review
that says so.

**No retained-record schema changed and no version was bumped.**
`retainedRecord` picks a fixed outcome key list that excludes `verify`, and
`scripts/smoke-review.mjs` asserts it stays out. Ask before changing the
retained-record schema version: it tracks publication authority, not whether a
review may start.

Three no-inference facts underpin the gate and are recorded in the roadmap:
`git symbolic-ref --quiet --short HEAD` prints the branch when attached and
exits **1** with empty output when detached; `git status --porcelain=v1
--untracked-files=normal` never lists ignored paths, so an ordinary working
checkout with dependencies installed passes; and `gh pr checkout NUMBER` names
the local branch after the head branch by documented default, including for a
fork.

## Review of record and the finding it found

`V1a`'s single authorized review used explicit **balanced** mode, the default
topology, because the increment adds no mode and changes a gate. It cost
**152.816643 credits**. Four heavy reviewers ran `gpt-5.6-terra`/high, overview
ran `gpt-5.6-luna`/high, and the adjudicator ran `gpt-5.6-terra`/high. There
were 38 tool calls and 39 confined reads, with **no permission denial and no
tool denial**.

Coverage is **INCOMPLETE**: two execution failures, zero coverage gaps, five
informational caveats, and one accepted P2 finding. This is not a clean-review
claim. The finding was a real defect in the new code and is fixed, with tests
confirmed red against the reviewed implementation at `88400df`.

**The defect: a blanket `catch` around the new branch probe.** Every rejection
became an empty branch, which takes the detached-HEAD refusal path, so a
cancelled run and a broken git alike were reported as `this checkout has a
detached HEAD at <sha>`. Exit status 1 is now the only rejection read as
detached; a cancelled probe propagates, and any other failure is refused naming
what actually happened. The runner also stopped reporting a cancelled gate as
`disposition: "refused"`: it re-throws once the signal is aborted, before
logging anything, so the cancellation reaches the owned run as one. **Do not
reintroduce a bare `catch` around a signal-aware call**; that is the shape this
review caught.

The controlled double in `scripts/smoke-review.mjs` had to be corrected with the
implementation: it modelled the detached case as an unlabelled `Error`, which
real git does not produce, and now carries exit status 1.

**`C5`'s demotion fired live for the second time.** Overview returned invalid
JSON and its completed attempt was demoted to `incomplete`. No tier had a
configured fallback, so none started. `C5`'s live gap is unchanged: **no live
review has ever had a fallback configured, so none has ever started from a
demotion.**

Worth remembering: `contracts` found the same defect independently and was
**rejected at the evidence boundary** for a citation that did not exactly match
a supplied window, so it never reached adjudication. Two reviewers agreeing did
not save the finding. One of them citing exactly did.

The complete timeline was saved before analysis, outside the checkout, as
`~/.claude/pr-review-timelines/v1a-review-16-timeline.log`, with the run's
evidence JSON beside it. They stay local. The roadmap records the invocation,
binding, charges and reproduction.

What the run does not show: no live run has been cancelled during the preflight,
and no live run has exercised the branch or untracked refusals, because the
runtime fixture refuses earlier on the head condition. Those have controlled
evidence against real git checkouts only.

## Exact next step

**The next increment is `V1b`: safeguard discovery and presentation.** Read "The
next increment is `V1b`" under "Exact next increment" in the roadmap; it is
authoritative and fuller than this summary.

**It still needs the user's explicit go-ahead, and it must not begin with code.**
Like `V1a`, discuss and present the boundary first and wait for approval,
because the slice after it executes pull-request controlled code.

`V1b` is discovery and presentation, and nothing else. A verification-enabled
run that passes `V1a`'s preflight finds this project's existing safeguard
commands, shows the user the exact commands it would run, and stops. No approval
prompt, no execution, and still no change to what any reviewer receives. The
roadmap names five choices to settle first, each with a recommendation: where
commands come from, what "existing" excludes, what is presented, whether
discovery reads the checkout or the captured revision, and what a run does after
presenting.

Acceptance is: a run that passes the preflight presents the discovered commands
and their source, presents nothing outside the agreed sources, changes no
reviewer input, executes nothing, and the controlled suites cover discovery
against fixture projects including one with no safeguards at all. Ordinary
review behaviour stays byte-identical.

**Do not pull approval or execution into `V1b`**, and do not widen `V1a`'s flag.
Executing pull-request controlled code is the largest safety boundary in this
project and needs its own increment, discussion, tests and review. A review
against a substantial code diff, a live review with a fallback configured, a
live review in which a reviewer is refused an absent path, and `L1` are all
recorded as open in the roadmap and none is scheduled.

## Validation and runtime caveats

The twelve controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture and target. They require no inference or network. All
twelve pass at this handoff, as they did at each checkpoint. `git diff --check`
is clean.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target; do node scripts/smoke-$s.mjs; done
```

`scripts/smoke-checkout.mjs` drives the verification profile against real
throwaway git checkouts, including the case that matters most: a detached `HEAD`
refuses verification and **still passes an ordinary review of the same
checkout**. It also asserts the checkout is byte-identical after every refusal,
so the gate demonstrably switches, stashes and cleans nothing. Keep that
assertion when extending it.

Both no-inference runtime probes pass against the installed plugin built from
this branch. They spend no credits but need a live runtime connection:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the twelve,
must be run and reported for any increment touching `read-only.mjs`. `V1a` does
not touch it, so it was not run and was not required. Run it for `V1b` only if
that increment reaches into the read tools, which it should not.

**Never add a timeout, deadline or stuck-reviewer heuristic.** `SCOPE.md`
forbids review timeouts, and both `C3` and `C5` depend on their absence. There
is no timeout: a quiet timeline is not a hang.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain
resolve: both exist to stop the refusal from saying where a symlink points.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`. Consult the installed SDK and current official
documentation before adopting new APIs. Do not revisit Agent Factories without a
new CLI version. Do not widen `F6`'s marker unwrap or reintroduce substring
matching.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited in the `V1a` session.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows.

## For a future authorized increment

Work on its own branch and pull request. Commit and push first; check out that
pull request head before installing, so the reviewer reads exactly the reviewed
revision from a clean tree.

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
tree while reviewers read it. `copilot -p "/pr-review NUMBER"` starts an ambient
model turn and is not a substitute for command dispatch. Findings stay local; no
publishing is authorized.

The standing workflow authorizes exactly one review per increment pull request,
not reruns, extra probes, or `scripts/smoke-factory.mjs --spend`. Historical
reviews are already spent and carry no authorization forward.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. Merging remains the user's decision. Preserve unrelated
changes. Inspect enumerations and counts when extending a concept. Update
`README.md` for user-visible behaviour; `V1a` did, under its `--verify` section.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
