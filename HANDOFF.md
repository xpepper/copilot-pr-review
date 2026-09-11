# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. Completed entries
through `O1` are in `docs/roadmap-archive-2026-09-10.md`, which you need only for
an older increment's evidence. The README that used to carry them is in
`docs/readme-archive-2026-09-10.md`.

## `README.md` is now the tight file, not `ROADMAP.md`

**`README.md` has 3017 bytes spare and `ROADMAP.md` has 9132.** At 65536 bytes
this project's own safeguard discovery stops reading a file, silently. A normal
roadmap entry is five to eight kilobytes, so **archive `E1`'s entry into
`docs/roadmap-archive-2026-09-10.md` before you write your own**, leaving the
same kind of pointer the earlier moves left and not rewriting or condensing it on
the way. `U1`'s entry then becomes the oldest live one.

**The README has no such escape.** If your increment adds user-visible behaviour,
it needs README prose, and there is not much room left for it. Measure with
`wc -c`, put new material in `docs/`, which discovery does not recurse into, and
if you cannot fit it, say so rather than shipping a README the tool cannot read.

## Take `I1`, and nothing else

**v1 is delivered, `O1`, `E1` and `U1` have landed on top of it, and two of the
user's four scheduled increments remain: `I1` then `G1`.** `ROADMAP.md`'s section
"The next increment is `I1`" is authoritative and the increments table describes
both.

**`I1` is incremental re-reviews**: when a pull request has moved on since a
previous review, confine fresh hunting to the new commit range and revalidate the
prior findings as resolved, still open, or obsolete. It is the second half of
issue #21.

- **It is several increments, not one. Slice it first and build nothing until the
  user has agreed the slicing.** Discovering the prior review and the head it
  evaluated, classifying the relationship between that head and the current one,
  and revalidating prior findings are separable pieces.
- **It touches head binding and the evidence boundary**, the two most settled
  parts of the design. Every publication gate and every citation check rests on
  them. Changing either needs the user to say so explicitly in your own session.
- `U1` agreed its shape through three questions before a line was written. Do the
  same.

**Do not start `G1` early, and do not invent a fifth increment.**

## What `U1` did, and the four things worth carrying forward

`U1` added `--unattended`, a declaration checked at parse time that refuses any
invocation that would need a person: without `--all`, without `--comment` or
`--no-comment`, with `--verify`, or with `--capture-only`. It grants no
authority, opens no gate and is not a configuration key. Pull request #28 carries
all of it.

- **Read the discarded candidates. Always.** #28 produced one candidate, the
  adjudicator accepted it with `allClaimsSupported` true, and the evidence
  boundary discarded it anyway, because the adjudicator's own third citation
  quoted sixteen lines of `review.mjs` while naming the range 88-102. **`E1` saw
  that shape on a reviewer's citation; this is the first time it has happened
  after a verdict.** The finding was true and is fixed on the branch. Do not
  weaken the rule to catch it: `Q6`'s repair cannot rescue this shape by design,
  because a repair that drops a named line could drop the line authorizing the
  anchor.
- **A run reporting `0 findings, rejected=0` on incomplete coverage is still
  accurate and still easy to misread.** A boundary discard is an
  execution-failure diagnostic and never reaches `validation.rejected`. The
  breakdown line underneath is what separates a failed reviewer from a caveat.
- **`Q6`'s clipped-end repair fired live again** on #28, restoring a quote whose
  trailing comma the model had dropped, in the same run whose other citation the
  boundary refused. Both behaviours are working as designed.
- **The defect was false prose written in the same commit as the feature.** The
  new section claimed a no-UI host publishes nothing, which the README's own
  command contract contradicted four hundred lines earlier. **Six reviews in a
  row have now caught this project's paperwork disagreeing with itself**: #18,
  #23, #24, #25, #26 and #28. Before you finish, grep the live roadmap and the
  README for claims your own change has made false.

## Validation and runtime caveats

The **thirteen** controlled suites (`node scripts/smoke-<name>.mjs`) are
findings, review, selection, retention, preview, publication, publish-later,
checkout, config, context, fixture, target and safeguards. They need no inference
and no network, and all thirteen pass at this handoff. `git diff --check` is
clean and the branch diff carries no control byte.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
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

**It should read all six root files and skip none.** A file that starts appearing
in the skipped list has crossed 65536 bytes.

**Check `copilot plugin list` immediately before dispatching any review**, and
**reinstall whenever the checkout changes**, checking out before installing and
never the other way round. During `D1` an install that had reported success was
gone minutes later, most likely clobbered by a concurrent `copilot` process.
`U1` reinstalled with `copilot plugin install "$(pwd)"` and then ran `diff -rq` of
`~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review` against the
checkout, expecting no output; do the same. CLI 1.0.83 warns that direct local
installs are deprecated for a future release.

**If you cannot type a Copilot slash command, dispatch it through the SDK** with
`node scripts/dogfood-review.mjs NUMBER --deep --all --no-comment --unattended`,
as `AGENTS.md` says. **That runner now requires `--all` and `--unattended`**,
because its session has no elicitation UI, and it still refuses `--comment` and
`--quiet`. It asserts a clean tree at the pull request head and prints the credit
total the interactive run does not. `PR_REVIEW_DOGFOOD_REPOSITORY` retargets it.
`copilot -p "/pr-review N"` is not a substitute: prompt mode starts an ambient
model turn instead of dispatching.

Both no-inference runtime probes spend no credits but need a live runtime
connection. `node scripts/smoke-runtime.mjs --targets` **was rerun during `U1`**
and passes with 71 assertions, seven of which dispatch the new refusals through
the runtime's own command RPC without reaching a capture.

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

**That probe now reads back one sentence of `help` and one of `status`**, which
is the first check this repository has ever had on either, after three false
user-facing strings shipped from here. If you change those strings, change the
probe with them; if you add a flag, add its sentence and assert it.

`scripts/smoke-safeguards.mjs` covers the gates and execution: shapes that need a
shell and shapes that do not, the exclusion cases including both `vitest` forms
and four spellings that differ only in letter case, the citation check against a
fragment, a fabrication, an unread file and this repository's own shell loop, a
passing and a failing command, a command that does not exist, the re-assertion
before the spawn, four approval outcomes that start no process, a truncating
capture that still passes, artifacts present, absent and unreadable, an artifact
scan that carries the run's cancellation signal, and a cancellation that kills a
grandchild process. It also asserts the module can never open a shell; **keep
that assertion**, and do not replace it with a weaker one. It asserts the
approval question names both Space and Enter and that the schema carries no
`minItems`. **Everything it covers except the cancellation has also been seen
live**, on #25's second review.

**Press Space on the command before pressing Enter** in any `--verify` run, and
in finding selection. The host's multi-select toggles only on Space; Enter on a
merely highlighted option submits the empty default. The question now says so.

`scripts/smoke-review.mjs` covers the run, including that an approved command
runs after approval and before the first specialist, that no reviewer prompt
carries its output, that a failing safeguard leaves coverage completed, that
`safeguards` stays out of the retained record, that no reviewer prompt claims the
working tree is still the reviewed revision, the whole quiet contract, and
`U1`'s settled unattended run on a harness that **does** have an elicitation UI
and is asked nothing. **All of those are settled behaviour; keep every one.**

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1`, `D1`, `O1`, `E1` and `U1` did not touch it. #28's run is fresh
evidence that confinement holds: 13 tool calls, `view` and GPT's `rg` alias, all
approved by the permission handler, zero denials.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. That file was not moved or edited
during `U1`, and #28's review read it: `heavyModel=gpt-5.6-terra`,
`lightModel=gpt-5.6-luna`, `mediumModel=claude-sonnet-5`, efforts high, high and
medium.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence. A quiet
timeline is not a hang. #28's reviewer printed three identical `active` lines
over 94 seconds while making thirteen tool calls; that is the tool working.

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

- **`U1` is closed, and its shape is not to be widened.** `--unattended` is a
  preflight declaration that only refuses. It does not change what a run does on
  a host that has a UI, beyond withholding the closed-PR confirmation, and it
  adds no machine-readable outcome. Both of those were offered to the user and
  declined as larger. **Posting authority still never authorizes safeguard
  execution**, and no gate may be relaxed to let a headless run past one.
- **An unattended run must always name its posting decision.** A saved
  `autoPostReviews` may never be what makes a headless run publish. This narrows
  nothing outside the flag: `--all` with `autoPostReviews=true` still publishes
  unattended on a host with no UI, exactly as `SCOPE.md` allows.
- **`L1` is closed.** Upstream declares MIT and publishes no licence text and no
  copyright notice, so no upstream source, prompt text or documentation may be
  copied, and a line-level audit shows none has been. `docs/upstream-licensing.md`
  holds the evidence and the rule.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **Re-asserting checkout cleanliness after execution stays refused.**
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`L1`'s no-copying rule is not specific to upstream.** `G1` will compare this
  tool with other code-review agents and skills; anything worth adopting is
  adopted as behaviour and re-implemented here.
- **`E1`'s three unfixed items are recorded limitations, not a backlog**: no cost
  line, truncated evidence lines, and silent progress. None is scheduled, and the
  first is a scope decision for the user.

## State at this handoff

`U1` landed on branch `u1-unattended-execution` through pull request **#28**,
reviewed once with this plugin at the user's authorization. **Merging is the
user's decision**, so confirm from git state whether #28 is merged and whether
you are starting from `main` with no increment branch open, and reconcile
anything that disagrees with this sentence.

`main` refuses direct pushes for everyone. Playground pull requests #1 and #2
must never be merged.

If you land anything at all: follow `AGENTS.md`, with meaningful validated
checkpoint commits, a named branch and pull request, no direct `main` push, and
no force-push or amended published history. **The standing workflow authorizes
exactly one review per pull request and nothing else**; any rerun or extra probe
that spends credits needs a fresh explicit instruction. Keep findings local: no
`--comment` and no publish without one. Preserve unrelated changes. Update
`README.md` for user-visible behaviour, and watch its size while you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
