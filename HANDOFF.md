# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed.

Every completed entry, `F1` through `G1`, is now in
`docs/roadmap-archive-2026-09-10.md`, which you need only for an older
increment's evidence. The `--verify` guide is in `docs/safeguards.md`, the
previous README in `docs/readme-archive-2026-09-10.md`, and the comparison
against the field in `docs/gap-analysis.md`.

## Your job this session is `T1`, and only `T1`

**The backlog is no longer empty.** On 2026-09-12 the user triaged `G1`'s twelve
proposals one at a time and scheduled six, which are the `Pending` rows in
`ROADMAP.md`: `T1`, `B1`, `W1`, `N1`, `H1`, `K1`, in that order. **`T1` is the
next increment. Take it and nothing else.**

**`T1`: a finished review reports what it cost and how long it took.** One line,
alongside coverage rather than buried in the evidence lines.

- `E1` established that billing is collected per request and retained, and then
  never printed, so a person cannot tell what they spent without reading
  Copilot's session state off disk. `scripts/dogfood-review.mjs` already prints a
  credit total, **so start by reading how it gets one**; that is evidence the
  number is reachable, not a design to copy blindly.
- **`--quiet` must not suppress it.** `O1` settled that `--quiet` suppresses the
  evidence JSON lines and the raw untrusted model envelopes, and suppresses
  nothing about coverage, refusals, failures, safeguards or publication. A cost
  line belongs with the second group. `scripts/dogfood-review.mjs` refuses
  `--quiet` anyway.
- **The number must be the runtime's, reported honestly.** If the runtime
  reports no total for a run, say so rather than computing a plausible one, and
  a run that fails or is cancelled still spent what it spent.
- Decide with the user whether the elapsed figure is wall time, model time, or
  both. `E1`'s evidence used model time and `I1c`'s entries record both.

**`T1` needs a one-line `SCOPE.md` change and that is the user's decision, not
yours.** `SCOPE.md` defers detailed timing and usage reports as a nice-to-have.
The argument the user already accepted is that one summary line is not a
detailed report. **Put the exact wording to them and get a yes before you edit
the file.** Do not treat the `Pending` row as the authorization.

It changes user-visible behaviour, so it needs `README.md` updated, its own
branch and pull request, and **one plugin review, which is its verification of
record**. That review spends real credits and needs the user's explicit
authorization. Ask; do not spend by default.

### What is scheduled after `T1`, so you can recognise scope creep

Do not start any of these. They are listed so you know what is already someone
else's increment: `B1` large-diff honesty, `W1` a remediation sentence on every
finding, `N1` a seeded corpus and deterministic scorer, `H1` opt-in project
standards steering the review, `K1` a feedback channel on a published review.
`ROADMAP.md` carries the acceptance criteria for each.

**Three of the six carry a named half and an explicitly unscheduled other
half.** `B1` takes no size-triggered transport. `W1` takes no committable
suggestion block. `N1` takes neither the collection runs that spend credits nor
a baseline gate. **Do not widen any of them on your own judgement**, and do not
read `docs/gap-analysis.md` as authorization: **`G1`'s ranking and its five-stage
sequence did not survive the triage**, and the document stands as the record of
what was argued at the time.

**Six of the twelve were declined**, each put to the user on its own: credential
redaction, the `same-head` short-circuit, the default-mode decision, the two
history lenses, path-conditioned reviewer firing, and anchoring findings outside
the diff. They are in `ROADMAP.md` under "Recorded, not scheduled" with the
reason. **Declined is not deferred-until-you-feel-like-it.** The default-mode one
is additionally blocked: nothing can settle it until `N1`'s collection runs
exist, and those are not scheduled.

## Headroom: `README.md` is still the tight one, `ROADMAP.md` is not

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and the tool can no longer read its own project. **CI fails the build
if any root file crosses the cap.**

- **`README.md` has 1671 bytes spare and `T1` has to document itself there.**
  That is less than one paragraph. Solve it before you write the documentation,
  not after. Its escape is `docs/`, which discovery does not recurse into: `D1`
  moved the old README there and `I1b` moved the 12922-byte `--verify` section
  to `docs/safeguards.md` in its own documentation-only pull request, #30, which
  the user merged without a plugin review. **Housekeeping is worth its own pull
  request and worth agreeing with the user first. Do not start it unasked.**
- **`ROADMAP.md` has 7718 bytes spare and no live completed entry at all**,
  which is new. The backlog triage archived `G1`'s 8863 bytes after the six
  `Pending` rows and the rewritten closing section left 181 bytes spare. So
  **`T1`'s entry is written into an empty space and will be the only live one**,
  and you should not need to archive anything. If you somehow do, move an entry
  verbatim with the same kind of pointer, never rewritten or condensed.
- Measure with `wc -c` and run the collector check below before opening a pull
  request. A file that appears in the skipped list has crossed 65536.

## Validation and runtime caveats

The **sixteen** controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture, target, safeguards, prior, incremental and
revalidation. They need no inference and no network, and all sixteen pass at
this handoff. `git diff --check` is clean and no tracked text carries a control
byte.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation; do node scripts/smoke-$s.mjs; done
```

**GitHub Actions runs that same loop on every pull request and every push to
`main`**, in `.github/workflows/ci.yml`, with the two invariants this repository
has broken before: that the tool can still read its own instruction files, and
that no tracked text carries a control byte. It needs no secret and no
dependency install, **it is not a substitute for running the suites locally
before a checkpoint commit**, and it deliberately runs nothing that spends
Copilot credits. A red run is a real failure; do not rerun it hoping for green.

This cheap check runs the real discovery collector against this checkout and
tells you which of your own files the tool can read:

```sh
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

**It should read all six root files and skip none.**

**Do not `cd` out of the working directory in a Bash call.** During `G1` one call
began `cd /tmp && gh api ...` to keep scratch work out of the tree. The harness
reset the shell's directory and the sandbox narrowed to a per-file allowlist:
`git` and `node` failed with `Operation not permitted` on `getcwd`, directory
listing of the project and of `docs/` was denied, and files the session had not
already opened became unreadable even through the Read tool. A later `cd` back
was stripped from the command, so it could not be corrected from inside, and
disabling the sandbox changed nothing. **Starting a fresh session cleared it and
nothing was lost.** Use the scratchpad by absolute path instead of changing
directory.

**Reinstall the plugin before every review, and verify it.** #32's second review
found the installed copy stale by exactly the four files its own fixes had
touched, so the first review had reviewed code that was no longer there.
**Check out first, then install, never the other way round**, and prove it:

```sh
copilot plugin install "$(pwd)"
diff -rq ~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review \
  extensions/pr-review   # expect no output
```

Run `copilot plugin list` immediately before dispatching as well. During `D1` an
install that had reported success was gone minutes later, most likely clobbered
by a concurrent `copilot` process. CLI 1.0.83 warns that direct local installs
are deprecated for a future release.

**If you cannot type a Copilot slash command, dispatch it through the SDK** with
`node scripts/dogfood-review.mjs NUMBER --deep --all --no-comment --unattended`,
as `AGENTS.md` says. **That runner asserts two environment variables before it
does anything**, and gives an assertion failure rather than a usage message if
they are missing:

```sh
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
```

It requires `--all` and `--unattended`, because its session has no elicitation
UI, and it refuses `--comment` and `--quiet`. It asserts a clean tree at the
pull request head and **prints the credit total the interactive run does not**,
which is exactly the number `T1` is about. `PR_REVIEW_DOGFOOD_REPOSITORY`
retargets it. `copilot -p "/pr-review N"` is not a substitute: prompt mode
starts an ambient model turn instead of dispatching. It passes every other flag
straight through, so `--incremental` and `--revalidate` both reach it.

**A review takes minutes of wall time and prints almost nothing while it runs.**
#32's second reviewer printed eleven `active` lines over 137 seconds and nothing
else. If you poll for completion, block on the process itself rather than timing
your own waits; an agent that mistakes its own elapsed sleeps for the review's
can report a hang that is not there. **Never add a timeout**, and a quiet
timeline is not a hang. The evidence lines are very long, so grep them narrowly
or you will pull half a megabyte of JSON into your own context. A reviewer's own
tool calls and denials are in the run's `M2 evidence` line under
`reviewers[].policy`.

`node scripts/smoke-runtime.mjs --targets` **has not been run since `I1b`**,
where it passed with 75 assertions. `I1c` added four without running them, so
**the expected count is 79 and that is still unverified.** Neither `G1` nor the
backlog triage changed a string or added one. It spends no credits but needs a
live runtime connection. **`T1` adds a line to a shipped output, so if it touches
a `help` or `status` string, change the probe with it.**

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the sixteen,
must be run and reported for any increment touching `read-only.mjs`. Nothing
since `V2a` has touched it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. It was not moved or edited by
`G1` or by the triage, neither of which ran a review at all.

**Press Space on the command before pressing Enter** in any `--verify` run, in
finding selection, and in the reply confirmation. The host's multi-select toggles
only on Space; Enter on a merely highlighted option submits the empty default.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence. **`G1`
read upstream's deadline machinery in full and it is an argument for this refusal,
not against it**: several hundred lines of interacting budgets, reserves, grace
periods and truncation rules, with its own validation ranges and failure
taxonomy, to answer a question this tool answers by waiting. **An elapsed-time
line is a report, never a deadline**, and `T1` must not become one.

**Do not weaken the shell gate.** A project that declares `npm run lint && npm
test` gets a refusal, and the answer is for that project to declare two lines.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop a refusal from saying where a symlink points.

**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**
`safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs`.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned, so a pinned path silently drives a stale SDK. **Do not revisit Agent
Factories without a new CLI version**; three blockers were demonstrated on
1.0.83 and all three would have to change.

Cold resume of command-only records remains unsupported. Citations remain limited
to captured diff and context windows, which produced #32's second coverage gap.
**Upstream answers this with a size-triggered transport, and the user explicitly
did not schedule one**: `B1` takes the honesty half only.

## Settled decisions, none of which is to be reopened

- **The triage of 2026-09-12 is settled.** Six scheduled, six declined, in the
  order and under the IDs the user chose. **Do not re-triage, re-rank or
  re-argue it**, and do not promote a declined item because the document ranks
  it highly.
- **`I1c`'s six decisions stand**, as recorded in its archived entry: the hybrid
  verdict, the free half in every review with the model pass behind
  `--revalidate`, replies on threads rather than a line in the review body, both
  halves in one increment, the review's own posting authority, and skipping a
  thread already answered at this head. **Upstream's convergence does not reopen
  them.**
- **Code proves that a finding still stands and never that it has gone away.** A
  `decidedBy: "code"` entry claiming `resolved` is refused.
- **An unknown write outcome stops the reply set.** A definite rejection does
  not. **Do not add a retry.** The retained journal is a record, never a resume
  point.
- **A reply must never come back as a finding or as a review this tool wrote.**
  Both exclusions are asserted in `scripts/smoke-revalidation.mjs`; keep both.
- **`/pr-review publish` answers no thread**, deliberately.
- **`I1b` is opt-in and stays opt-in**, and a confined run's confinement is a
  caveat, never a coverage gap.
- **`I1a`'s slicing is settled and is not to be re-cut.**
- **A rewound head is `diverged`.** An unreachable head is `unknown`.
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present.
- **`U1` is closed and its shape is not to be widened.** Posting authority still
  never authorizes safeguard execution.
- **`L1` is closed**, and it bound `G1` absolutely. Nothing may be copied and a
  line-level audit shows none has been. **It binds every adopted item in the
  backlog too**: `H1`, `N1` and the rest are re-implemented from behaviour, never
  copied.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s two remaining items are recorded limitations**: truncated evidence
  lines and silent per-reviewer progress. Its third, a run that reports its own
  cost, is `T1`.

## State at this handoff

**The backlog triage is on branch `backlog-triage` and pull request #35**, with
the roadmap commit `1ce8a70` and this handoff commit on top of it. Confirm that
from git rather than from this sentence, and reconcile anything that disagrees.
**#35 is not merged at this handoff**; if it still is not, say so and ask,
because `T1` should start from a `main` that carries its `Pending` row. **Start
`T1` from a fresh branch off `main`.**

**#35 is documentation-only and no credits were spent during the triage at
all.** `AGENTS.md` leaves a documentation-only pull request's plugin review to
the user, and the user was asked rather than charged.

**Neither `I1b` nor `I1c` has live evidence, and both are blocked on the same
thing**: a pull request this tool has published a review on and that has since
moved. The only two published reviews are on playground pull requests still at
the head they evaluated. Arranging one means publishing a real review or pushing
a commit to a playground branch. **Both are the user's call, and playground #1
and #2 must never be merged.**

**GitHub's own Copilot reviewer is slower than the plugin review but free**, and
on #31 it found three things the plugin review and every suite had missed. **It
reviews only when it is requested**, and it was not requested on #32, #33 or #35.
Consider requesting it on your own pull request, and treat what it leaves like
any other reviewer: **check the premise of a finding before implementing it.**

If you land anything: follow `AGENTS.md`, with meaningful validated checkpoint
commits, a named branch and pull request, no direct `main` push, and no
force-push or amended published history. **The standing workflow authorizes
exactly one plugin review per pull request and nothing else**; any rerun or extra
probe that spends credits needs a fresh explicit instruction. Keep findings
local: no `--comment` and no publish without one. Update `README.md` for
user-visible behaviour, and solve its 1671 bytes of headroom before you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
