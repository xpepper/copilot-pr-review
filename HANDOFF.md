# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

## Recorded state

This handoff is written on branch `v2a-safeguard-execution`, which carries `V2a`
on **pull request #19**, branched from `main` at `fc8558c` after the merge of
#18. Confirm the branch, the pull request and the working tree before doing
anything. The only other open pull requests should be the synthetic playground
ones, #1 and #2, which must never be merged or republished.

**`V2a` is implemented and its one authorized review has not run.** That review
is the outstanding work, and it is described below. Do not start `V2b`, and do
not start anything else, until it has run and its evidence is recorded.

## What `V2a` does

**An approved safeguard command now runs, in this checkout, before any reviewer
starts.** It is the first thing this tool does that is not a confined read.
Eight choices were settled with the user before any code, and all eight are
recorded in the table under "Implemented increment: `V2a`" in the roadmap, which
is authoritative and fuller than this summary. Carry these:

- **`V2` was split.** `V2a` executes and reports to the person who approved.
  `V2b` decides whether that output reaches a reviewer and what the retained
  record says about what ran. `V2a` builds no plumbing for either, deliberately.
- **No shell, ever.** A command is split on whitespace and spawned as an
  argument list. A chain, a pipe, a redirect, a variable, a glob, a quoted
  argument or a loop is refused rather than run. Every other rule depends on
  this one, because against `sh -c` the first word of a line tells you nothing.
- **The exclusions and the citation check landed here**, as `V1b` and `V1c` both
  said they would. A refused command is still reported with its reason and is
  never offered for approval. The exclusion table is a heuristic and the roadmap
  names four holes it knows about; do not present it as anything more.
- **A failed safeguard is not review coverage.** It is reported loudly and
  leaves `complete` and `coverage` exactly as the reviewers determined.
- **Cancellation kills the process group**, and there is no timer anywhere.

The user's standing principle, added during this discussion: the smaller the
increment the better, provided it stays coherent and meaningful.

## The outstanding work: review pull request #19 interactively

**`scripts/dogfood-review.mjs` registers no elicitation handler**, so it reports
approval `unavailable`, approves nothing and executes nothing. It therefore
cannot demonstrate this increment at all. The review must be run interactively,
by a person typing the command in a Copilot CLI session:

```sh
gh pr checkout 19
copilot plugin install "$(pwd)"
```

then, inside an interactive `copilot` session started in this checkout:

```text
/pr-review 19 --balanced --verify --all --no-comment
```

`--verify` is the point of the run. Balanced is the default and no other
topology is required here.

**What to expect.** Discovery should read `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`
and `SCOPE.md`, skip `README.md` and `ROADMAP.md` for size, and find
`node scripts/smoke-safeguards.mjs` and `node scripts/smoke-review.mjs` in
`AGENTS.md`, which this increment added there as plain runnable lines for
exactly this reason. Both suites finish in well under a second and leave the
checkout clean, which the artifact line should confirm.

Most of what else it reads should be refused and shown with the rule that
refused it: this repository's own `for` loop by shape or, if the pass reports
only its first line, as a shell keyword; `copilot plugin install "$(pwd)"` by its
program and its `install` token; `gh pr create` by its program; and the wrapped
dogfood command as uncited. **One more may legitimately be offered.** This file
states `node scripts/smoke-runtime.mjs --targets` as a line of its own, below the
two environment variables it needs, so the pass may report it and the gates
accept it. That is the contract working rather than a defect: it is a runnable
line this project declares. Decline it, and record that it was offered.

**Record the outcome** in the roadmap section "The installed-plugin review of
pull request #19": mode, model and effort actually used, coverage, what
discovery found, what was offered and what was refused with its rule, what was
approved, what ran and what it printed, what the artifact line said, findings
and withheld findings, and the reported credit cost. A refusal or a failure
there is a real defect report about the shipped tool and outranks the green
suites; never weaken a gate to make the run succeed.

**The standing workflow authorizes exactly one review of this pull request.** If
it refuses before any reviewer starts, record the refusal and ask. Do not rerun
on your own judgement, and do not run `scripts/smoke-factory.mjs --spend` or any
other probe that spends credits.

## Then the next increment is `V2b`

**It needs the user's go-ahead before implementation, and it must not begin with
code.** Present its choices one at a time, each with your recommendation, the
reason, and every alternative. Lead with which option is cheapest and which is
cheapest while still pointing the right way. Be willing to change a
recommendation when the cheap option is defensible on the merits, and say why
rather than flipping silently: that is how `V1c`'s exclusions and `V2a`'s
slicing were settled.

`V2b` has two questions, both deliberately unanswered by `V2a`:

- **Whether safeguard output reaches a reviewer.** `SCOPE.md` says the flag
  exists to ground claims in evidence, and both `V1c`'s placement and `V2a`'s
  execution point were chosen to keep that possible. It is not foregone:
  safeguard output is pull-request controlled text, so handing it to a reviewer
  is an injection surface, and it would also reopen whether a failed safeguard
  stays outside review coverage.
- **What the retained record says about what ran.** This is where a record of
  execution is evidence rather than authority, so it may finally deserve a
  schema version. `V1b` and `V1c` stayed out of the record because a stored
  approval is the artifact a later increment could mistake for standing
  permission. A record of what already ran does not carry that risk in the same
  way, and the argument should be made explicitly rather than inherited.

## Validation and runtime caveats

The **thirteen** controlled suites (`node scripts/smoke-<name>.mjs`) are
findings, review, selection, retention, preview, publication, publish-later,
checkout, config, context, fixture, target and safeguards. `V2a` added no suite:
execution is covered where discovery and approval are. They require no inference
and no network. All thirteen pass at this handoff, as they did at each
checkpoint. `git diff --check` is clean.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
```

`scripts/smoke-safeguards.mjs` covers the gates and execution: shapes that need a
shell and shapes that do not, the exclusion cases including both `vitest` forms,
the citation check against a fragment, a fabrication, an unread file and this
repository's own shell loop, a passing and a failing command, a command that does
not exist, the re-assertion before the spawn, four approval outcomes that start no
process, a truncating capture that still passes, artifacts present, absent and
unreadable, and a cancellation that kills a grandchild process the safeguard
started. It also asserts the module can never open a shell; **keep that
assertion**, and do not replace it with a weaker one.

`scripts/smoke-review.mjs` covers the run, including that an approved command
runs after approval and before the first specialist, that no reviewer prompt
carries its output, that a failing safeguard leaves coverage completed, and that
`safeguards` stays out of the retained record.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a` does
not touch it, so it was not run and was not required. `V1c`'s handoff predicted
`V2` would touch the question it answers; it does not. Reviewer confinement is
unchanged, and execution is a separate path no reviewer can reach.

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

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard either. `SCOPE.md` forbids review timeouts, and
`C3`, `C5`, the watch exclusion and `V2a`'s cancellation all depend on their
absence. A quiet timeline is not a hang. A run waiting on an unanswered approval
waits indefinitely by design, and so does a long safeguard.

**Do not weaken the shell gate.** A project that declares `npm run lint && npm
test` gets a refusal, and the answer is for that project to declare two lines,
not for this tool to open a shell. `SCOPE.md` also forbids inventing a safeguard
script to fix it for them.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop the refusal from saying where a symlink points. The same
`lstat` reasoning is why `collectInstructionFiles` refuses a symbolic link rather
than following it.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`. Consult the installed SDK and current official
documentation before adopting new APIs. Do not revisit Agent Factories without a
new CLI version. **Do not widen `F6`'s marker unwrap or reintroduce substring
matching**; `safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs`
precisely so the one rule stays in one place.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited in this session.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. Merging remains the user's decision. Preserve unrelated
changes. Inspect enumerations and counts when extending a concept. Update
`README.md` for user-visible behaviour; `V2a` did, under its own section.

**Reconcile the roadmap's own handoff text before you finish.** #18's overview
reviewer found the exact-next-increment section still naming the increment that
had just been completed, which would have sent the next session to redo finished
work. Recording a completed entry is only half of it.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
