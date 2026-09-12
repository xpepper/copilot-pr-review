# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. Completed entries
through `I1c` are in `docs/roadmap-archive-2026-09-10.md`, which you need only
for an older increment's evidence. The README material that used to carry them
is in `docs/readme-archive-2026-09-10.md`, the `--verify` guide is in
`docs/safeguards.md`, and `G1`'s comparison against the field is in
`docs/gap-analysis.md`.

## There is nothing scheduled, and that is the important part

**`G1` is complete, and it was the last increment the user scheduled.** `E1`,
`U1`, `I1` and `G1` were the four; `I1` was sliced into three with the user and
`I1a`, `I1b` and `I1c` are all done.

**So do not start anything without the user saying so in your own session.** In
particular, `docs/gap-analysis.md` proposes twelve adoptions and orders them into
a five-stage sequence. **None of that is scheduled work.** A proposal in that
document is not an authorization to start it, and neither is the sequence it sits
in. If the user asks what to do next, the document is the menu to offer them; it
is not a backlog to work through.

Two of the twelve would change `SCOPE.md`'s settled text if the user ever wants
them: **the default mode**, which `SCOPE.md` fixes as balanced, and **a timing
and cost line**, which `SCOPE.md` defers as nice-to-have. Both are argued in the
document. Neither is started.

## Headroom first, and `README.md` is now the tight one

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and the tool can no longer read its own project. **`README.md` has
1785 bytes spare and `ROADMAP.md` has 7872.** **CI fails the build if any root
file crosses the cap**, so this is a thing you cannot miss rather than a thing
you have to remember.

- **`README.md` is now the binding constraint, not the roadmap.** 1785 bytes is
  less than one paragraph of user-facing documentation. **The next increment
  that changes user-visible behaviour has to solve that before it can document
  it.** Its escape is `docs/`, which discovery does not recurse into. `D1` moved
  the old README there and `I1b` moved the 12922-byte `--verify` section to
  `docs/safeguards.md` in its own documentation-only pull request, #30, which the
  user merged without a plugin review. That is the pattern: **housekeeping is
  worth its own pull request, and it is worth agreeing with the user first.** Do
  not start it unasked.
- **`ROADMAP.md`'s escape is archiving.** `G1`'s live entry is **8864 bytes** and
  is the only completed entry left in the file. If your own entry does not fit in
  the 7872 spare, and no increment entry here has ever been that small, archive
  `G1`'s the same way every earlier move was done:
  verbatim, with the same kind of pointer, not rewritten or condensed on the way.
  **One live completed entry rather than two is where that rule lands.**
- Measure with `wc -c`, and run the collector check below before opening a pull
  request. A file that starts appearing in the skipped list has crossed 65536.

## What `G1` did, and the seven things worth carrying forward

`G1` compares this tool behaviourally with upstream and with the code-review
agents and skills now in the open, then proposes what is worth adopting. Pull
request #33 carries all of it.

- **Two decisions were taken with the user before anything was written**, each
  put as a separate question. The user chose **the widest sweep** of three
  offered, so ten sources were read rather than the five the roadmap named, and
  **a ranked menu plus a proposed sequence** rather than a menu alone or one
  recommendation argued in depth. Both are recorded in the roadmap entry.
- **`L1`'s rule held, and it binds you too.** No upstream or third-party source,
  prompt text, configuration or documentation was copied. Everything was read
  into a scratchpad outside the working tree and described in this project's own
  words. `docs/upstream-licensing.md` records why. **Read them; copy nothing.**
- **Upstream has converged on `I1a` through `I1c`.** After the baseline
  `SCOPE.md` pins, upstream shipped incremental re-review with the same four head
  relationships and the same three prior-finding verdicts this project reached
  independently. **That is corroboration, not an instruction to change anything**,
  and `I1c`'s six decisions stay settled. Where the two differ, this project's
  choices are the more conservative and stay as they are.
- **The field's dominant complaint is false positives**, at 40 to 70 per cent
  among leading agents, and that is the axis this tool is built on. **It has
  never measured itself on it.** Upstream publishes recall against a seeded
  corpus; this project has nothing equivalent, and its README is right to say
  recall is unmeasured. Item five of the menu describes the shape a
  re-implementation would take. It is unscheduled.
- **Upstream's own numbers put this project's default in question.** Over 72
  runs, deep matched the best recall in every band, produced no false positive,
  left every clean control alone and was no slower at the median than the
  five-reviewer default; full was worst on precision. Upstream labels these
  diagnostic and no baseline gate has been accepted, so **this is a question
  raised, not a default refuted.** `SCOPE.md` fixes balanced and `G1` changed
  nothing.
- **A reviewer can publish a credential it found, and this is not fixed.** There
  is no redaction anywhere in this tool. The published inline comment carries the
  reviewer's own prose in five fields and nothing constrains what that prose
  contains; the citation quotes are not published, which narrows the exposure
  without closing it. The security specialist is the reviewer explicitly pointed
  at secrets and therefore the one most likely to quote one. It is recorded in
  `ROADMAP.md` under "Recorded, not scheduled", in `README.md` under limits, and
  it is item one of the menu. **`G1` did not fix it because its authorization was
  analysis**, and a change under `extensions/` would have needed an
  installed-plugin review it was not authorized to spend.
- **No reviewer is told this project's conventions.** `--verify` collects the
  checkout's instruction files for safeguard discovery and `review.mjs` says in
  as many words that it hands them to no reviewer. Four independent tools in the
  field steer reviews with the project's own written standards. That is the
  largest capability gap found, and it is a scope question rather than a defect,
  because a convention finding's evidence is a sentence in a document and this
  tool's validation is built for provable effects in code.

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
`main`**, in `.github/workflows/ci.yml`, together with the two invariants this
repository has broken before: that the tool can still read its own instruction
files, and that no tracked text carries a control byte. **It went green on #33.**
It needs no secret, no network beyond the checkout and no dependency install.
**It is not a substitute for running the suites locally before a checkpoint
commit**, and it deliberately runs nothing that spends Copilot credits. A red run
is a real failure; do not rerun it hoping for green.

This cheap check runs the real discovery collector against this checkout, needs
no network and no inference, and tells you which of your own files the tool can
read:

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
reset the shell's directory and the sandbox then narrowed to a per-file
allowlist: `git` and `node` both failed with `Operation not permitted` on
`getcwd`, directory listing of the project and of `docs/` was denied, and files
the session had not already opened became unreadable even through the Read tool.
A later `cd` back was stripped from the command, so it could not be corrected
from inside, and disabling the sandbox changed nothing. **Starting a fresh
session cleared it and nothing was lost.** Use the scratchpad by absolute path
instead of changing directory.

**Reinstall the plugin before every review, and verify it.** #32's second review
found the installed copy stale by exactly the four files its own fixes had
touched, which means the first review had reviewed code that was no longer there.
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
pull request head and prints the credit total the interactive run does not.
`PR_REVIEW_DOGFOOD_REPOSITORY` retargets it. `copilot -p "/pr-review N"` is not
a substitute: prompt mode starts an ambient model turn instead of dispatching.
It passes every other flag straight through, so `--incremental` and
`--revalidate` both reach it.

**A review takes minutes of wall time and prints almost nothing while it runs.**
#32's second reviewer printed eleven `active` lines over 137 seconds and nothing
else. If you poll for completion, block on the process itself rather than timing
your own waits; an agent that mistakes its own elapsed sleeps for the review's
can report a hang that is not there. **Never add a timeout**, and a quiet
timeline is not a hang. The evidence lines are also very long, so grep them
narrowly or you will pull half a megabyte of JSON into your own context. A
reviewer's own tool calls and denials are in the run's `M2 evidence` line under
`reviewers[].policy`, which is the plugin's own record and is easier to read than
Copilot's session state.

`node scripts/smoke-runtime.mjs --targets` **has not been run since `I1b`**,
where it passed with 75 assertions. `I1c` added four without running them, two
`help`/`status` sentences for `--revalidate` and two parse refusals, so **the
expected count is 79 and that is still unverified.** `G1` changed no string and
added none. It spends no credits but needs a live runtime connection. If you
change a `help` or `status` string, change the probe with it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the sixteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1`, `D1`, `O1`, `E1`, `U1`, `I1a`, `I1b`, `I1c` and `G1` did not
touch it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. That file was not moved or edited
during `G1`, which ran no review at all.

**Press Space on the command before pressing Enter** in any `--verify` run, in
finding selection, and in the reply confirmation. The host's multi-select toggles
only on Space; Enter on a merely highlighted option submits the empty default.
The question says so.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence.
**`G1` read upstream's deadline machinery in full and it is an argument for this
refusal, not against it**: several hundred lines of interacting budgets,
reserves, grace periods and truncation rules, with its own validation ranges and
failure taxonomy, to answer a question this tool answers by waiting.

**Do not weaken the shell gate.** A project that declares `npm run lint && npm
test` gets a refusal, and the answer is for that project to declare two lines.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop a refusal from saying where a symlink points. That absent-path
refusal now has live evidence and it works: see the roadmap's `Q7` entry.

**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**
`safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs` so the one
rule stays in one place.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned, so a pinned path silently drives a stale SDK. **Do not revisit Agent
Factories without a new CLI version**; three separate blockers were demonstrated
on 1.0.83 and all three would have to change.

Cold resume of command-only records remains unsupported. Citations remain limited
to captured diff and context windows, which is what produced #32's second
coverage gap: the reviewer could read an unchanged file from the checkout and
still could not cite it. **`G1` found that upstream answers this with a
size-triggered transport**, which is item eleven of the menu and unscheduled.

## Settled decisions, none of which is to be reopened

- **`I1c`'s six decisions stand**, as recorded in its archived entry: the hybrid
  verdict, the free half in every review with the model pass behind
  `--revalidate`, replies on threads rather than a line in the review body, both
  halves in one increment, the review's own posting authority, and skipping a
  thread already answered at this head. **Upstream's convergence does not reopen
  them**, including where upstream chose differently.
- **Code proves that a finding still stands and never that it has gone away.**
  Nothing is ever proved resolved without reading the code. The retained record
  enforces it: a `decidedBy: "code"` entry claiming `resolved` is refused.
- **An unknown write outcome stops the reply set**, and every thread after it
  stays unattempted. A definite rejection does not stop it. **Do not add a
  retry.** The retained journal is a record, never a resume point.
- **A reply must never come back as a finding or as a review this tool wrote.**
  Both exclusions are asserted in `scripts/smoke-revalidation.mjs`; keep both.
- **`/pr-review publish` answers no thread**, deliberately.
- **`I1b` is opt-in and stays opt-in**, and a confined run's confinement is a
  caveat, never a coverage gap.
- **`I1a`'s slicing is settled and is not to be re-cut.** Discovery runs in every
  run rather than behind a flag; both identity and body are required.
- **A rewound head is `diverged`.** An unreachable head is `unknown`.
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present.
- **`U1` is closed and its shape is not to be widened.** Posting authority still
  never authorizes safeguard execution.
- **`L1` is closed**, and it bound `G1` absolutely. Upstream declares MIT and
  publishes no licence text and no copyright notice, so nothing may be copied and
  a line-level audit shows none has been.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s three unfixed items are recorded limitations, not a backlog.** `G1`
  ranked two of them in its menu and neither became scheduled by that.

## State at this handoff

**`G1` is complete and pull request #33 is open**, one commit on branch
`g1-gap-analysis`, with this handoff a second commit on the same branch. Confirm
that from git rather than from this sentence, and reconcile anything that
disagrees. **CI went green on #33** before the handoff commit.

**#33 has not been reviewed with this plugin.** It is documentation-only, so
`AGENTS.md` leaves that review to the user rather than requiring it, because it
costs real credits. **The user was asked and had not answered when the session
ended.** If they want it: push first, then `/pr-review 33 --no-comment` from that
branch, and record mode, model, effort, coverage, findings, withheld findings and
credit cost in the roadmap entry. **The standing workflow authorizes exactly one
review per pull request and nothing else.**

**Merging #33 is the user's decision.** The plugin only ever emits `COMMENT`
reviews, so its review can never satisfy an approval requirement.

**Neither `I1b` nor `I1c` has live evidence, and both are blocked on the same
thing**: a pull request this tool has published a review on and that has since
moved. The only two published reviews are on playground pull requests still at
the head they evaluated. Arranging one means publishing a real review or pushing
a commit to a playground branch. **Both are the user's call, and playground #1
and #2 must never be merged.**

**GitHub's own Copilot reviewer is slower than the plugin review but free**, and
on #31 it found three things the plugin review and every suite had missed. **It
reviews only when it is requested.** It was not requested on #32 or #33.
Consider requesting it on your own pull request, and treat what it leaves like
any other reviewer: **check the premise of a finding before implementing it.**

If you land anything at all: follow `AGENTS.md`, with meaningful validated
checkpoint commits, a named branch and pull request, no direct `main` push, and
no force-push or amended published history. Keep findings local: no `--comment`
and no publish without an explicit instruction. Preserve unrelated changes.
Update `README.md` for user-visible behaviour, and solve its 1785 bytes of
headroom before you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
