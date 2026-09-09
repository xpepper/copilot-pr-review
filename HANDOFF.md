# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

## Recorded state

This handoff is prepared for a fresh session on **clean `main` after the
user-authorized merge of pull request #18**, which carried `V1c` from branch
`v1c-command-approval`, branched from `main` at `3c0483e`. Confirm the merge,
branch and working-tree state before proceeding; if #18 is still open, report the
unfinished merge rather than starting another increment. A squash merge need not
retain the individual commits as ancestors of `main`; use #18 and git history to
reconcile state. The only other open pull requests should be the synthetic
playground ones, #1 and #2, which must never be merged or republished. No
uncommitted work or increment in flight is intended to remain.

**Start `V2` by discussing its boundary with the user, not by writing code.**
That is the whole of the next step; everything below is the context for it.

## What `V1c` settled

**A `--verify` run that discovered commands now asks which of them may run,
records that answer, and still executes nothing.** The question sits immediately
after discovery, before any reviewer starts. No reviewer receives an approved
command, and the approval does not outlive the run.

Six choices are settled and must be preserved.

- **No exclusions.** Every discovered command is offered, including one that
  installs, migrates, deploys, formats in place, auto-fixes or watches.
- **No citation check.** Code still proves only that the cited file was read.
- **Per command**, using the opaque invocation-scoped choices finding selection
  already uses, with the answer recorded in discovery's order.
- **Placed after discovery, before the reviewers.**
- **Out of the retained record.** No schema version was minted.
- **Nothing from configuration or a flag.** No key, no trusted-project allowlist,
  no approve-everything flag. The posting flags and a saved `autoPostReviews=true`
  grant no approval, which a suite case asserts.

**The first two reverse what `V1b` recorded**, which deferred them to this slice.
The discussion established that the thing they guard is execution, not approval:
with approval kept out of the retained record it cannot outlive its run, so
nothing built here could ever be the gate a command passes on its way to running.
They belong to `V2`. Do not add them back into approval.

A host with no elicitation UI, a decline, an empty acceptance and an answer code
cannot account for all approve nothing and leave the reviewers to run. A cancel
stops the run before any reviewer starts. None of these is incomplete review
coverage: approval grounds no finding.

## What pull request #18's review showed, and what it did not

**The one authorized review ran balanced with `--verify`, cost 166.859549 credits,
reached `incomplete` coverage with zero validated findings, and found two real
defects that all thirteen controlled suites had passed over.** Both are fixed on
that branch. Read the full record under "The installed-plugin review of pull
request #18" in the roadmap; it is authoritative and fuller than this summary.

Carry these facts:

- **`V1b`'s discovery pass finally ran live, and found no command at all in this
  repository.** It read `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md` and `SCOPE.md`,
  skipped `README.md` and `ROADMAP.md` for size, and returned a well-formed empty
  envelope. That is the correct answer to its contract: this project states its
  safeguards only as a two-line shell loop and a placeholder, and the pass is
  instructed never to assemble a command out of prose.
- **`V1c`'s interactive approval path therefore has no live evidence.** Only the
  `not-started` branch ran. The elicitation request, an accepted subset, a decline
  and a cancel are demonstrated only against the controlled harness, and two of
  #18's reviewers reported that gap themselves.
- **The adjudicator's output was unparseable and was discarded**, which is exactly
  `C5`'s case. No fallback is configured on the heavy tier, so nothing was retried
  and the review stayed incomplete. A live review with a fallback configured is
  still open.
- **`Q6`'s clipped-end repair fired live for the first time**, twice on one
  candidate, restoring exact bound source so it reached adjudication.
- **The evidence boundary rejected a candidate that was independently verified to
  be true**, for an inexact citation. That is the accepted cost of an exact gate,
  not a defect in it, and it is the first recorded instance.

**`scripts/dogfood-review.mjs` registers no elicitation handler**, so an approval
in a dogfood run reports itself `unavailable` and never waits. That is why
`--verify` was safe to spend the review on, and it is also why that runner can
never demonstrate an approval being given.

**The cheapest way to unblock live approval evidence, recorded and not done:**
state one safeguard as a single runnable line in an instruction file at the
checkout root, for example `node scripts/smoke-safeguards.mjs` on its own line in
`HANDOFF.md`, rather than only inside the `for` loop. It is a real documentation
improvement as well. It was deliberately not done in `V1c`, because it changes
what the next review discovers and that is the user's call, not an agent's.

## Exact next step

**The next increment is `V2`: executing an approved safeguard.** Read "The next
increment is `V2`" under "Exact next increment" in the roadmap; it is
authoritative and fuller than this summary. Earlier prose called this increment
`V1d`; it is the same one.

**It still needs the user's explicit go-ahead, and it must not begin with code.**
Present its choices **one at a time**, each with your recommendation, the reason,
and every alternative. Lead with which option is cheapest and which is cheapest
while still pointing the right way. Be willing to change your recommendation when
the cheap option is defensible on the merits, and say why rather than flipping
silently: that is how `V1c`'s exclusions and citation check were settled, and both
reversed a recommendation this session had already made.

`V2` is the first increment in which pull-request controlled code executes on the
user's machine. Everything before it was built so that this one could be small.
`SCOPE.md` binds it: run only approved existing safeguards, in the current
checkout, with already installed dependencies; do not install dependencies, use
auto-fix options, or invent safeguard scripts; show evidence and artifacts; never
switch branches, pull, stash or clean. Posting flags and the saved
automatic-posting setting authorize none of it.

Three deferred things land here: the exclusions, the citation check, and whether
safeguard output reaches a reviewer at all. Also settle what a failed safeguard
means for review coverage, how output and artifacts are captured and bounded,
whether execution is cancellable and how given there is no timeout by design, and
what the retained record says about what ran.

**Do not build the exclusions as a proof.** The list drafted during `V1c`'s
discussion refused this repository's own `copilot plugin install` while passing
`gh pr checkout`, the dogfood review command, and a bare `vitest` that watches by
default. Expect a heuristic and record it as one.

## Validation and runtime caveats

The **thirteen** controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture, target and safeguards. `V1c` added no suite: approval is
covered where discovery is, so the count is unchanged. They require no inference
or network. All thirteen pass at this handoff, as they did at each checkpoint.
`git diff --check` is clean.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
```

`scripts/smoke-safeguards.mjs` covers approval against a subset, a reordered
acceptance, an empty acceptance, a decline, a cancel, a host with no elicitation
UI, six answers code cannot account for, a choice minted for another invocation, a
wrong originating session, three discovery outcomes with nothing to approve, and
an already-cancelled run. It also asserts the module cannot spawn a process at
all; keep that assertion until `V2` deliberately removes it.

`scripts/smoke-review.mjs` covers the run, including that a run with `--all
--comment` and an effective `autoPostReviews=true` is still asked and still
approves nothing when declined.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before spending
a review on it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V1c` does
not touch it, so it was not run and was not required. **`V2` will touch the
question it answers**, because executing a command is the first thing this tool
does that is not a confined read.

Both no-inference runtime probes passed before `V1b` and **have not been rerun
since**. They spend no credits but need a live runtime connection, and
`copilot plugin install "$(pwd)"` must be rerun whenever the checkout changes, or
the probe measures the previous build:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

**Never add a timeout, deadline or stuck-reviewer heuristic.** `SCOPE.md` forbids
review timeouts, and `C3`, `C5` and `V2`'s watch-command exclusion all depend on
their absence. There is no timeout: a quiet timeline is not a hang. This now also
covers a run waiting on an unanswered approval, which waits indefinitely by
design on a host that has an elicitation UI.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop the refusal from saying where a symlink points. The same
`lstat` reasoning is why `collectInstructionFiles` refuses a symbolic link rather
than following it.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`. Consult the installed SDK and current official
documentation before adopting new APIs. Do not revisit Agent Factories without a
new CLI version. **Do not widen `F6`'s marker unwrap or reintroduce substring
matching**; it held against a real model on #18's discovery pass on the first
attempt, and `safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs`
precisely so the one rule stays in one place.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited in the `V1c` session.

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
topology is required. `V1c` added `--verify` to that command and recorded why:
it costs one extra model turn and is the only way to exercise discovery live.
Capture the complete stdout timeline outside the checkout and save original
reviewer strings before analyzing. Do not modify the working tree while reviewers
read it. `copilot -p "/pr-review NUMBER"` starts an ambient model turn and is not
a substitute for command dispatch. Findings stay local; no publishing is
authorized.

The standing workflow authorizes exactly one review per increment pull request,
not reruns, extra probes, or `scripts/smoke-factory.mjs --spend`. Historical
reviews are already spent and carry no authorization forward. **If that one
review refuses before any reviewer starts, record the refusal and ask; do not
rerun on your own judgment.**

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. Merging remains the user's decision. Preserve unrelated
changes. Inspect enumerations and counts when extending a concept. Update
`README.md` for user-visible behaviour; `V1c` did, under its own section.

**Reconcile the roadmap's own handoff text before you finish.** #18's overview
reviewer found the exact-next-increment section still naming the increment that
had just been completed, which would have sent the next session to redo finished
work. Recording a completed entry is only half of it.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
