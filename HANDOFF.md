# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. Completed entries
through `I1b` are in `docs/roadmap-archive-2026-09-10.md`, which you need only
for an older increment's evidence. The README material that used to carry them
is in `docs/readme-archive-2026-09-10.md`, and the `--verify` guide now lives in
`docs/safeguards.md`.

## Headroom first, and `README.md` is still the problem

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and the tool can no longer read its own project. **`README.md` has 2665
bytes spare and `ROADMAP.md` has 7916.** Neither is one increment's writing, and
the next increment that touches either has to solve that first. **CI fails the
build if any root file crosses the cap**, so this is a thing you cannot miss
rather than a thing you have to remember.

- **`README.md`'s escape is `docs/`, which discovery does not recurse into.**
  `D1` moved the old README there, and `I1b` moved the 12922-byte `--verify`
  section to `docs/safeguards.md` in its own documentation-only pull request,
  #30, which the user merged without a plugin review. That is the pattern:
  **housekeeping is worth its own pull request, and it is worth agreeing with the
  user first.** Do not start it unasked.
- **`ROADMAP.md`'s escape is archiving.** `I1c`'s live entry is **13015 bytes**
  and is the only completed entry left in the file. If your own entry does not
  fit in the 7916 spare, archive `I1c`'s the same way every earlier move was
  done: verbatim, with the same kind of pointer, not rewritten or condensed on
  the way. **One live completed entry rather than two is where that rule lands.**
- Measure with `wc -c`, and run the collector check below before opening a pull
  request. A file that starts appearing in the skipped list has crossed 65536.

## Take `G1`, and nothing else

**`I1` is complete and merged. `G1` is the only increment the user scheduled that
is left**, and `ROADMAP.md`'s section "The next increment is `G1`" is
authoritative.

`G1` is gap analysis against the field, then a proposal: compare this tool
behaviourally with upstream `pi-pr-review` and with other code-review agents and
skills now in the open, on capability and on user experience, and propose what is
worth adopting. **The output is a written analysis and a recommendation, not
code.** Its starting references are listed in `ROADMAP.md`; the list is a start,
not a boundary.

- **`L1`'s rule binds it absolutely.** No upstream or third-party source, prompt
  text or documentation may be copied. Read them; copy nothing. Anything worth
  adopting is adopted as behaviour and re-implemented here.
- **Anything it proposes is a scope decision for the user**, not work to start.
- Its written output is long, and `README.md` has no room for it. **`docs/` is
  where it belongs**, and agreeing that with the user first is the pattern.
- A documentation-only pull request still needs the pull request, but its plugin
  review is the user's call rather than a requirement, because reviewing costs
  real credits. **Ask; do not spend by default.**
- **Ask the user before building anything unsettled**, as `U1`, `I1a`, `I1b` and
  `I1c` each did. Do not start anything after `G1` without the user saying so.

## What `I1c` did, and the eight things worth carrying forward

`I1c` revalidates the findings an earlier review of the same pull request
published, and answers each settled one on its own thread. Pull request #32
carried all of it and is merged.

- **Six decisions were taken with the user before anything was built**, each put
  as a separate question, and the roadmap entry records all six with the
  alternatives that were declined. **None is to be reopened.** In particular:
  the free half runs in every review and the model pass is opt-in behind
  `--revalidate`; replies go on the earlier review's own threads and *not* as a
  line in the published review body; replies carry the review's own posting
  authority and never a separate one.
- **A sizing concern was recorded and the user reaffirmed anyway.** Per-comment
  replies are a new GitHub mutation class `SCOPE.md` does not cover, and they
  made this the first write set in the tool that is more than one request. That
  was the user's call, it is in the roadmap entry, and it is not to be
  relitigated.
- **Code proves that a finding still stands and never that it has gone away.**
  Nothing is ever proved resolved without reading the code, because absence of
  evidence that a defect remains is not evidence that somebody fixed it. The
  retained record enforces it: a `decidedBy: "code"` entry claiming `resolved` is
  refused. **Keep that asymmetry**; it is the same one `withinNewRange` keeps.
- **A round-trip check on an anchored pattern proves nothing about which split
  it chose.** That increment argued itself into believing otherwise and #32's
  first reviewer caught it. The parser now refuses a body that admits more than
  one split. **Do not reintroduce the idea that rebuilding the same bytes proves
  the fields were right.**
- **An unknown write outcome stops the reply set**, and every thread after it
  stays unattempted rather than becoming a second unknown. A definite rejection
  does not stop it, because it is known not to have been written. The retained
  record admits at most one unknown and the validator enforces that. **Do not
  add a retry.**
- **The retained journal is a record, never a resume point.** #32's second
  reviewer asked whether a later run preserves or overwrites it. It overwrites,
  and that is harmless: whether a thread already carries our answer is read fresh
  from GitHub's paginated comment listing each run, not from the record, and
  neither `retained-run.mjs` nor `publication.mjs` holds any reply path at all.
  So an uncertain reply is never blindly retried. **Keep the fresh read**; it is
  what makes that true.
- **A reply must never come back as a finding or as a review this tool wrote.**
  Discovery keeps only the comments of the review it recognised, and recognising
  a review reads the body this tool builds, so a reply is excluded twice over.
  Both are asserted in `scripts/smoke-revalidation.mjs`; **keep both**, because
  either changing would make a re-review revalidate its own answers.
- **Before you finish, grep the live roadmap and the README for claims your own
  change has made false**, and for claims that were already false. `I1b` asked
  for this check, `I1c`'s run of it found four, and #32's second review made
  three more false in a session that changed no behaviour at all.

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
files, and that no tracked text carries a control byte. It needs no secret, no
network beyond the checkout and no dependency install. **It is not a substitute
for running the suites locally before a checkpoint commit**, and it deliberately
runs nothing that spends Copilot credits. A red run is a real failure; do not
rerun it hoping for green.

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

`scripts/smoke-revalidation.mjs` covers the round-trip parser and the twelve
shapes it refuses, ambiguity among the five labels, every code verdict including
the rename that is not a deletion and the unsettled proofs that reach the record,
the model pass and the four things it ignores rather than trusts, the retained
schema through fifteen tamper cases and the reply set through nine more, the
reply signature and the skip rule, the whole set written thread by thread with
its journal, one unknown outcome stopping it, a definite rejection not stopping
it, the posting authority in all seven of its states, and the capture wiring
verbosely, quietly and with each flag. **Keep every one.**

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
expected count is now 79 and that is unverified.** It spends no credits but needs
a live runtime connection. If you change a `help` or `status` string, change the
probe with it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the sixteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1`, `D1`, `O1`, `E1`, `U1`, `I1a`, `I1b` and `I1c` did not touch
it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. That file was not moved or edited
during `I1c`, and both of #32's reviews ran on `heavyModel=gpt-5.6-terra` at high
effort.

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
still could not cite it.

## Settled decisions, none of which is to be reopened

- **`I1c`'s six decisions stand**, as recorded in its roadmap entry: the hybrid
  verdict, the free half in every review with the model pass behind
  `--revalidate`, replies on threads rather than a line in the review body, both
  halves in one increment, the review's own posting authority, and skipping a
  thread already answered at this head.
- **`/pr-review publish` answers no thread**, deliberately. A verdict about the
  current code was grounded in a read of the checkout at the reviewed head, and
  that command never reads a checkout.
- **`I1b` is opt-in and stays opt-in** unless the user says otherwise, and a
  confined run's confinement is a caveat, never a coverage gap. Do not make a
  confined review report INCOMPLETE.
- **`I1a`'s slicing is settled and is not to be re-cut.** Discovery runs in every
  run rather than behind a flag; both identity and body are required; comment
  bodies are kept verbatim and their anchors normalised.
- **A rewound head is `diverged`.** Only GitHub's `ahead` leaves a forward range,
  so `behind` folds in with it. An unreachable head is `unknown`, never
  `diverged`.
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present. A body written to imitate all four fixed parts
  is taken for ours, and `README.md` says so rather than promising otherwise.
- **`U1` is closed and its shape is not to be widened.** `--unattended` is a
  preflight declaration that only refuses. **Posting authority still never
  authorizes safeguard execution**, and no gate may be relaxed to let a headless
  run past one.
- **`L1` is closed.** Upstream declares MIT and publishes no licence text and no
  copyright notice, so no upstream source, prompt text or documentation may be
  copied, and a line-level audit shows none has been. `docs/upstream-licensing.md`
  holds the evidence and the rule. **It binds `G1` absolutely.**
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s three unfixed items are recorded limitations, not a backlog**: no cost
  line, truncated evidence lines, and silent progress. None is scheduled.

## State at this handoff

**`I1c` is complete and pull request #32 is merged into `main`**, twelve commits
on branch `i1c-prior-finding-revalidation`. Confirm that from git rather than
from this sentence, and reconcile anything that disagrees. **Start `G1` from a
fresh branch off `main`.**

**#32 was reviewed twice with this plugin, each time at the user's explicit
authorization**, both deep on `gpt-5.6-terra` at high effort.

- The **first** cost 144.23376 credits and reported 0 validated findings on
  INCOMPLETE coverage. Its three discarded or uncertain candidates all described
  real defects, all three are fixed, one of them a crash. **Read the discarded
  candidates of a review, not only its validated findings.**
- The **second** was authorized because those three fixes changed `extensions/`
  and nothing had reviewed them. It cost 115.0322 credits, reported 0 candidates
  on INCOMPLETE coverage, and changed nothing. It still bought two things: the
  stale-install lesson above, and the live `Q7` absent-path refusal the roadmap
  had recorded as impossible to arrange.

**Neither `I1b` nor `I1c` has live evidence, and both are blocked on the same
thing**: a pull request this tool has published a review on and that has since
moved. The only two published reviews are on playground pull requests still at
the head they evaluated. Arranging one means publishing a real review or pushing
a commit to a playground branch. **Both are the user's call, and playground #1
and #2 must never be merged.**

**GitHub's own Copilot reviewer is slower than the plugin review but free**, and
on #31 it found three things the plugin review and every suite had missed. **It
reviews only when it is requested.** It was never requested on #32 and therefore
left nothing there. Consider requesting it on your own pull request, and treat
what it leaves like any other reviewer: **check the premise of a finding before
implementing it.**

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
