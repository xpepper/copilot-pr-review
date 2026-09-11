# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. Completed entries
through `E1` are in `docs/roadmap-archive-2026-09-10.md`, which you need only for
an older increment's evidence. The README that used to carry them is in
`docs/readme-archive-2026-09-10.md`.

## `README.md` has 763 bytes left, and that is the first thing to solve

**`README.md` has 763 bytes spare and `ROADMAP.md` has 6018.** At 65536 bytes
this project's own safeguard discovery stops reading a file, silently.

- **`ROADMAP.md` has an escape and you should use it.** A normal increment entry
  is five to eight kilobytes, so **archive `U1`'s entry into
  `docs/roadmap-archive-2026-09-10.md` before you write your own**, leaving the
  same kind of pointer the six earlier moves left and not rewriting or condensing
  it on the way. `I1a`'s entry then becomes the oldest live one.
- **`README.md` has no escape, and 763 bytes is not an increment's worth of
  prose.** `I1b` changes what a reviewer may report, which is user-visible and
  needs documenting. **Solve the headroom before you write the prose**, not
  after. `D1` shortened this file from 103903 to 55195 bytes by moving material
  into `docs/`, which discovery does not recurse into, and
  `docs/readme-archive-2026-09-10.md` is where that went. Doing the same again is
  the obvious move and is worth agreeing with the user first, because it is
  housekeeping rather than `I1b`.
- Measure with `wc -c`, and run the collector check below before opening a pull
  request. A file that starts appearing in the skipped list has crossed 65536.

## Take `I1b`, and nothing else

**`I1` was sliced into three with the user before anything was built, and `I1a`
is done.** `ROADMAP.md`'s section "The next increment is `I1b`" is
authoritative, and the increments table describes `I1b`, `I1c` and `G1`.

**`I1b` confines fresh hunting to the new commit range** when `I1a` reports the
relationship as `incremental`, so a re-review stops reporting hunks an earlier
turn already covered. `I1a` already hands it the reviewed-before head, the
comparison and the earlier review's anchors, on `target.prior`.

- **Narrowing is a filter over the captured binding, never a replacement for
  it.** Publication requires every finding to anchor inside a hunk of the
  captured base-to-head diff, so swapping in a range diff would produce anchors
  GitHub refuses. Leave the binding, the context windows and every citation rule
  exactly as they are. **That is what keeps `I1b` off head binding and off the
  evidence boundary, and changing either still needs the user to say so,
  explicitly, in your own session.**
- **Whether it is opt-in is not settled and is the user's decision.** `I1a`
  deliberately shipped no `--incremental` flag, because a flag that narrowed
  nothing would have been a false name. Ask before building.
- **`incremental` has never been reported end to end by a real run.** The only
  two reviews this tool has ever published are on playground pull requests #1 and
  #2, both still at the head they evaluated, so live evidence exists for
  `same-head` and `none` only. Arranging an `incremental` run means publishing a
  real review or pushing a commit to a playground branch. Both are the user's
  call; **playground #1 and #2 must never be merged.**

**Do not start `I1c` or `G1` early, and do not invent another increment.**

## What `I1a` did, and the four things worth carrying forward

`I1a` made capture report whether this tool has already reviewed this pull
request, the head that review evaluated, its inline comments retained with
verbatim bodies and normalised anchors, and
how the reviewed head relates to that one: `none`, `same-head`, `incremental`,
`diverged`, or `unknown` when GitHub can no longer reach the earlier head. It
narrows nothing and revalidates nothing, and its own output says so. Pull
request #29 carries all of it.

- **Read the discarded candidates. Always.** #29 produced two candidates and the
  evidence boundary discarded the better one, because its location quoted the
  nine lines of `toolReviewBody` while naming a range that spans eight. **That
  is the third increment running to lose a true finding to that exact shape**,
  after `E1`'s reviewer citation and `U1`'s adjudicator citation. All three were
  recovered by reading what was discarded. Do not weaken the rule: `Q6`'s repair
  cannot rescue this shape by design, because a repair that drops a named line
  could drop the line authorizing the anchor.
- **Seven reviews in a row have now caught this project's paperwork disagreeing
  with itself**: #18, #23, #24, #25, #26, #28 and #29. Twice running the false
  sentence was written in the same commit as the code it described. **Before you
  finish, grep the live roadmap and the README for claims your own change has
  made false**, and for claims that were already false. `I1a` found two of those
  in the README: a limits bullet denying a quieter mode four hundred lines below
  the documentation of `--quiet`, and one saying no review had run against a
  substantial code diff, which `E1` did.
- **Free live evidence is worth gathering and this increment is the proof.**
  Discovery spends no credits and needs no inference, so it was exercised against
  real GitHub before the paid review: two playground pull requests, two of this
  repository's own, and five real commit pairs covering every comparison status.
  Look for that kind of evidence before reaching for a review.
- **A live transient discovery failure was seen**, once, against playground #2,
  with three surrounding runs succeeding. The reason was not captured. What it
  showed is the designed behaviour: a failed discovery reported itself and
  refused nothing.

## Validation and runtime caveats

The **fourteen** controlled suites (`node scripts/smoke-<name>.mjs`) are
findings, review, selection, retention, preview, publication, publish-later,
checkout, config, context, fixture, target, safeguards and **prior**. They need
no inference and no network, and all fourteen pass at this handoff. `git diff
--check` is clean and the branch diff carries no control byte.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior; do node scripts/smoke-$s.mjs; done
```

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

`scripts/smoke-prior.mjs` covers the body signature against all four mode labels
and eleven near misses, both halves of the identity rule, review and comment
validation including an outdated anchor that keeps the line it was written at,
all four comparison statuses, pagination across two pages, the same-head
shortcut that asks nothing, an unreachable head, a failed discovery, a
cancellation re-thrown rather than reported, and the wiring into capture both
verbosely and quietly. **Keep every one.** `scripts/smoke-target.mjs` now
expects eight `gh` calls in a capture rather than six, the two extra being the
identity read and the review listing.

**Check `copilot plugin list` immediately before dispatching any review**, and
**reinstall whenever the checkout changes**, checking out before installing and
never the other way round. During `D1` an install that had reported success was
gone minutes later, most likely clobbered by a concurrent `copilot` process.
`I1a` reinstalled with `copilot plugin install "$(pwd)"` and then ran `diff -rq`
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

Both no-inference runtime probes spend no credits but need a live runtime
connection. `node scripts/smoke-runtime.mjs --targets` passed with 71 assertions
during `U1` and **was not rerun during `I1a`**, which changed no user-facing
`help` or `status` string and added no flag. It reads back one sentence of each;
if you change those strings, change the probe with them, and if you add a flag,
add its sentence and assert it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the fourteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1`, `D1`, `O1`, `E1`, `U1` and `I1a` did not touch it. #29's run
is fresh evidence that confinement holds: 22 tool calls, `view`, `glob` and
GPT's `rg` alias, all approved, zero denials.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. That file was not moved or edited
during `I1a`, and #29's review read it: `heavyModel=gpt-5.6-terra`,
`lightModel=gpt-5.6-luna`, `mediumModel=claude-sonnet-5`, efforts high, high and
medium.

**Press Space on the command before pressing Enter** in any `--verify` run, and
in finding selection. The host's multi-select toggles only on Space; Enter on a
merely highlighted option submits the empty default. The question says so.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence. A quiet
timeline is not a hang.

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
a review whose candidates are all refused runs none, and pays nothing for one.
Citations remain limited to captured diff and context windows.

## Settled decisions, none of which is to be reopened

- **`I1a`'s slicing is settled and is not to be re-cut.** Three slices, not two
  or four; discovery in every run rather than behind a flag that would narrow
  nothing; both identity and body required; comment bodies kept verbatim and
  their anchors normalised, with the
  parser that reads this tool's emitted comment prose back into a finding left
  to `I1c` because nothing consumed it in `I1a`.
- **`I1a` retains nothing.** The discovery is reported, not written into the
  session's retained record. Putting it there is a schema change and belongs to
  the increment that consumes it, not to `I1a`.
- **A rewound head is `diverged`.** Only GitHub's `ahead` leaves a forward range
  to confine hunting to, so `behind` folds in with it; GitHub's own status stays
  in the record beside the classification, so the fold loses nothing. An
  unreachable head is `unknown`, never `diverged`.
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present. A review published by an older version of this
  tool has to stay recognisable, and that prose is the part most likely to
  change. A body written to imitate all four fixed parts is taken for ours, and
  `README.md` says so rather than promising otherwise.
- **`U1` is closed and its shape is not to be widened.** `--unattended` is a
  preflight declaration that only refuses. **Posting authority still never
  authorizes safeguard execution**, and no gate may be relaxed to let a headless
  run past one. An unattended run must always name its posting decision.
- **`L1` is closed.** Upstream declares MIT and publishes no licence text and no
  copyright notice, so no upstream source, prompt text or documentation may be
  copied, and a line-level audit shows none has been. `docs/upstream-licensing.md`
  holds the evidence and the rule. It is not specific to upstream: `G1` will
  compare this tool with other code-review agents and skills, and anything worth
  adopting is adopted as behaviour and re-implemented here.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
  Re-asserting checkout cleanliness after execution stays refused.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s three unfixed items are recorded limitations, not a backlog**: no cost
  line, truncated evidence lines, and silent progress. None is scheduled, and the
  first is a scope decision for the user.

## State at this handoff

`I1a` landed through pull request **#29**, on branch
`i1a-prior-review-discovery`, reviewed once with this plugin at the user's
authorization: deep, 76.55215 credits, 1 validated finding and 1 discarded
candidate, both real and both fixed on the branch. **Merging is the user's
decision and had not happened when this was written**, so confirm the branch and
pull request state from git rather than from this sentence, and reconcile
anything that disagrees. `main` refuses direct pushes for everyone.

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
