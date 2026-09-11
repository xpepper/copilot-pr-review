# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. Completed entries
through `I1a` are in `docs/roadmap-archive-2026-09-10.md`, which you need only
for an older increment's evidence. The README material that used to carry them
is in `docs/readme-archive-2026-09-10.md`, and the `--verify` guide now lives in
`docs/safeguards.md`.

## Headroom first, as always, but you have some this time

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and the tool can no longer read its own project. **`README.md` has
7217 bytes spare and `ROADMAP.md` has 7507.** That is room for one increment's
writing and not obviously two, so measure before you write and do not assume.
**CI now fails the build if either crosses the cap**, so this stops being a thing
you have to remember and starts being a thing you cannot miss.

- **`ROADMAP.md`'s escape is archiving, and `I1b` used it twice.** `U1`'s entry
  moved before a word of `I1b`'s could be written, and `I1a`'s moved once
  `I1b`'s existed and left 1369 bytes spare. **One live completed entry rather
  than two is where that rule now lands.** If your entry does not fit, archive
  `I1b`'s the same way: verbatim, with the same kind of pointer, not rewritten
  or condensed on the way.
- **`README.md`'s escape is `docs/`, which discovery does not recurse into.**
  `D1` moved the old README there, and `I1b` moved the 12922-byte `--verify`
  section to `docs/safeguards.md` in its own documentation-only pull request,
  #30, which the user merged without a plugin review. That is the pattern:
  housekeeping is worth its own pull request, and it is worth agreeing with the
  user first.
- Measure with `wc -c`, and run the collector check below before opening a pull
  request. A file that starts appearing in the skipped list has crossed 65536.

## Take `I1c`, and nothing else

**`I1` was sliced into three with the user before anything was built, and `I1a`
and `I1b` are done.** `ROADMAP.md`'s section "The next increment is `I1c`" is
authoritative, and the increments table describes `I1c` and `G1`.

**`I1c` revalidates the prior findings `I1a` retains** as resolved, still open or
obsolete. It needs the parser that reads this tool's own emitted comment prose
back into a structured finding, which `I1a` deliberately did not ship because
nothing consumed it there, and `I1b` still does not: confinement reasons about
commit ranges and never about what an earlier comment said.

- **`I1a` hands it the input.** Every inline comment of the prior review is
  retained with its body exactly as posted and its anchor normalised, including
  the line it was written at for a comment GitHub can no longer place.
- **The retained record is where the schema change lands.** `I1a` retains none of
  the discovery and `I1b` retains none of the confinement, on the rule that the
  increment which consumes something is the one that puts it in the schema.
  `I1c` is that increment. `retention.mjs` validates the retained shape strictly
  and carries schema versions; read it before you add a field.
- **Ask the user before building anything unsettled**, as `U1`, `I1a` and `I1b`
  each did. Do not invent a fourth slice and do not start `G1` early.

## What `I1b` did, and the six things worth carrying forward

`I1b` added `--incremental`, which confines fresh hunting to the commits added
since an earlier review of the same pull request, so a re-review stops reporting
hunks that review already covered. Pull request #31 carries all of it.

- **It is opt-in, and that was the user's decision after worked examples.** Two
  cases decided it: a re-review in a heavier mode than the earlier one would
  silently never reach the hunks the lighter mode skimmed, and the earlier
  review's own coverage cannot be read, because `toolReviewBody` requires a
  coverage sentence and deliberately never reads what it says. **Do not flip the
  default without the user saying so**, and note that a forgotten flag costs
  credits a person can see while a wrong narrowing loses a finding silently.
- **Narrowing is a filter over the captured binding and never a replacement for
  it.** The captured diff, the context windows, the provenance checks and every
  citation rule are untouched, which is what keeps this off head binding and off
  the evidence boundary. **Changing either still needs the user to say so,
  explicitly, in your own session.**
- **The confinement is an informational caveat, never a coverage gap.** A gap
  makes the run INCOMPLETE, and INCOMPLETE has to keep meaning that something
  failed rather than that somebody asked for less. The caveat reaches the
  published review body, so a confined review says there that it does not cover
  the whole pull request.
- **`describePrior` now says what the run actually did.** `I1a`'s sentence
  promising that the run acts on none of the prior review was true when it was
  written and `I1b` made it false, so it is conditional now and the confinement
  is settled before the prior review is reported so the two lines agree. **Before
  you finish, grep the live roadmap and the README for claims your own change has
  made false**, and for claims that were already false. This is the check that
  caught it.
- **A base-side anchor cannot be placed in the new range at all**, because it
  names the captured base revision the comparison never saw. The filter removes
  only what it can prove an earlier turn covered, which is the safe direction for
  a feature whose job is to cover less. Keep that asymmetry, and keep the
  reviewer contract agreeing with it: `confinedTo` carries `basePaths` as well as
  `paths` because **a file the new commits deleted has no head-side line at all**,
  so a base-side anchor is the only one such a defect can have.
- **A parser is not a completeness check.** `parseDiffFiles` accepts a diff cut
  mid-hunk and reports fewer changed lines rather than failing, which would set
  every candidate in the truncated file aside as already covered.
  `assertCompleteDiff` in `target.mjs` is the shared structural rule and
  `newRangeFrom` asserts it; **do not confine to a range that has not passed
  it.** It caught an arithmetic error in this increment's own fixture on its
  first run.

## Validation and runtime caveats

The **fifteen** controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture, target, safeguards, prior and **incremental**. They
need no inference and no network, and all fifteen pass at this handoff. `git diff
--check` is clean and the branch diff carries no control byte.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental; do node scripts/smoke-$s.mjs; done
```

**GitHub Actions now runs that same loop on every pull request and every push to
`main`**, in `.github/workflows/ci.yml`, together with the two invariants this
repository has broken before: that the tool can still read its own instruction
files, and that no tracked text carries a control byte. It needs no secret, no
network beyond the checkout and no dependency install, because this repository
has no `package.json` and no build step. **It is not a substitute for running the
suites locally before a checkpoint commit**, and it deliberately runs nothing
that spends Copilot credits. A red run is a real failure; do not rerun it hoping
for green.

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

`scripts/smoke-incremental.mjs` covers the range parse and its head-side line
grouping, four shapes of incomplete range diff and the parser's silence on one of
them, a range that deletes a file and the base-side anchor that is then the only
one such a defect can have, all five cases the filter decides, all four
non-confined outcomes with their prose, the `gh` call shape and its diff media
type, the four relationships that cost no request at all, a cancellation
re-thrown rather than reported, a set-aside candidate at a real evidence boundary
with its caveat and its untouched coverage, what `formatFindings` and the
published body then say, the reviewer instruction and prompt with and without a
confinement, both branches of the prior-review sentence, and the capture wiring
verbosely, quietly and not at all. **Keep every one.**

**Check `copilot plugin list` immediately before dispatching any review**, and
**reinstall whenever the checkout changes**, checking out before installing and
never the other way round. During `D1` an install that had reported success was
gone minutes later, most likely clobbered by a concurrent `copilot` process.
`I1b` reinstalled with `copilot plugin install "$(pwd)"` and then ran `diff -rq`
of `~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review` against
the checkout, expecting no output; do the same. CLI 1.0.83 warns that direct
local installs are deprecated for a future release.

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
It passes every other flag straight through, so `--incremental` reaches it.

**A review takes minutes of wall time and prints almost nothing while it runs.**
#31's reviewer emitted four identical `active` lines over 91.5 seconds. If you
poll for completion, block on the process itself rather than timing your own
waits; an agent that mistakes its own elapsed sleeps for the review's can report
a hang that is not there. **Never add a timeout**, and a quiet timeline is not a
hang.

`node scripts/smoke-runtime.mjs --targets` **passed with 75 assertions during
`I1b`**, up from `U1`'s 71. It spends no credits but needs a live runtime
connection. It reads back one sentence of `help` and one of `status`; if you
change those strings, change the probe with them, and if you add a flag, add its
sentence and assert it. `I1b` added four assertions this way.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the fifteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1`, `D1`, `O1`, `E1`, `U1`, `I1a` and `I1b` did not touch it.
#31's run is fresh evidence that confinement holds: 16 tool calls, `view`,
`glob` and GPT's `rg` alias, all approved, zero denials.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. That file was not moved or edited
during `I1b`, and #31's review ran on `heavyModel=gpt-5.6-terra` at high effort.

**Press Space on the command before pressing Enter** in any `--verify` run, and
in finding selection. The host's multi-select toggles only on Space; Enter on a
merely highlighted option submits the empty default. The question says so.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence.

**Do not weaken the shell gate.** A project that declares `npm run lint && npm
test` gets a refusal, and the answer is for that project to declare two lines.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop a refusal from saying where a symlink points.

**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**
`safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs` so the one
rule stays in one place.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned, so a pinned path silently drives a stale SDK. **Do not revisit Agent
Factories without a new CLI version**; three separate blockers were demonstrated
on 1.0.83 and all three would have to change.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool, and it starts only when a candidate survives the evidence boundary, so
#31's review, which produced no candidate at all, ran none and paid nothing for
one. Citations remain limited to captured diff and context windows.

## Settled decisions, none of which is to be reopened

- **`I1b` is opt-in and stays opt-in** unless the user says otherwise. An
  opt-out flag over a default narrowing was the other serious option and was
  declined; the roadmap entry records why.
- **A confined run's confinement is a caveat, not a coverage gap.** Do not make
  a confined review report INCOMPLETE.
- **`I1a`'s slicing is settled and is not to be re-cut.** Three slices;
  discovery in every run rather than behind a flag; both identity and body
  required; comment bodies kept verbatim and their anchors normalised, with the
  parser that reads this tool's emitted comment prose back into a finding left
  to `I1c`.
- **`I1a` retains nothing and `I1b` retains nothing.** The discovery and the
  confinement are reported, not written into the session's retained record.
  Putting either there is a schema change and belongs to the increment that
  consumes it.
- **A rewound head is `diverged`.** Only GitHub's `ahead` leaves a forward range
  to confine hunting to, so `behind` folds in with it; GitHub's own status stays
  in the record beside the classification. An unreachable head is `unknown`,
  never `diverged`.
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present. A review published by an older version of this
  tool has to stay recognisable, and that prose is the part most likely to
  change. A body written to imitate all four fixed parts is taken for ours, and
  `README.md` says so rather than promising otherwise.
- **`U1` is closed and its shape is not to be widened.** `--unattended` is a
  preflight declaration that only refuses. **Posting authority still never
  authorizes safeguard execution**, and no gate may be relaxed to let a headless
  run past one.
- **`L1` is closed.** Upstream declares MIT and publishes no licence text and no
  copyright notice, so no upstream source, prompt text or documentation may be
  copied, and a line-level audit shows none has been. `docs/upstream-licensing.md`
  holds the evidence and the rule. It binds `G1` absolutely: anything worth
  adopting is adopted as behaviour and re-implemented here.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s three unfixed items are recorded limitations, not a backlog**: no cost
  line, truncated evidence lines, and silent progress. None is scheduled, and the
  first is a scope decision for the user.

## State at this handoff

`I1b` landed through pull request **#31**, eleven commits on branch
`i1b-incremental-confinement`, and was reviewed once with this plugin at the
user's authorization: deep, 68.53836 credits, 91.5 s of model work, 16 approved
tool calls and no denial, **0 candidates and 0 validated findings**, on
INCOMPLETE coverage from one coverage gap.

**That gap is exact and nothing was changed in response, because nothing can
be.** The reviewer reported that the confinement path has fixture coverage only
and that no live run has ever reported the `incremental` relationship, so the
real compare-diff response and its head-side line coordinates are unestablished.
**That is the honest limit on what #31 demonstrates**, and closing it needs live
evidence that does not exist yet: a pull request this tool has published a review
on and that has since moved. Arranging one means publishing a real review or
pushing a commit to a playground branch. **Both are the user's call, and
playground #1 and #2 must never be merged.**

**This is the first review of this repository in eight to find nothing wrong with
its paperwork**, after #18, #23, #24, #25, #26, #28 and #29 each caught it
disagreeing with itself. **Do not read that as a clean result**; read the run's
own words, which say INCOMPLETE.

**GitHub's own Copilot reviewer then found three things the plugin review and
all fifteen suites had missed**, for no cost, arriving after the plugin review
had finished and after this file had already recorded its silence. Two were
defects in the shipped behaviour and one was this branch's paperwork; all three
are fixed, replied to and resolved, and the roadmap entry records each with its
disposition. **It is slower than the plugin review, so do not conclude from an
empty pull request that it is not coming.** Check again before you finish, and
treat what it leaves like any other reviewer: **check the premise of a finding
before implementing it**, because the first of these three was right about the
harm and wrong about its stated cause, and the fix that followed was different
from the one it asked for.

**The three fixes changed `extensions/` and have not been reviewed by this
plugin**, because the standing workflow authorizes one review per pull request
and #31 has spent it. A further review needs the user's explicit authorization.

**The user chose to merge #31 at the end of that session, so you should be
starting from `main` with no increment branch open.** Confirm that from git state
rather than from this sentence, and reconcile anything that disagrees. **Merging
is always the user's decision**, and `main` refuses direct pushes for everyone,
including admins and agents using their token.

**A minimal CI pipeline landed with it**, at the user's request and outside the
increment sequence. `.github/workflows/ci.yml` runs the fifteen suites and the
two invariants on every pull request and on every push to `main`. It went green
on #31 before the merge, reading all six instruction files and skipping none.

If you land anything at all: follow `AGENTS.md`, with meaningful validated
checkpoint commits, a named branch and pull request, no direct `main` push, and
no force-push or amended published history. **The standing workflow authorizes
exactly one review per pull request and nothing else**; any rerun or extra probe
that spends credits needs a fresh explicit instruction. Keep findings local: no
`--comment` and no publish without one. Preserve unrelated changes. Update
`README.md` for user-visible behaviour, and solve its headroom before you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
