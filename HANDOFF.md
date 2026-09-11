# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. Completed entries
through `D1` are in `docs/roadmap-archive-2026-09-10.md`, which you need only for
an older increment's evidence. The README that used to carry them is in
`docs/readme-archive-2026-09-10.md`.

## Before you add anything to `ROADMAP.md`, archive `O1`

**The live roadmap has 3679 bytes of headroom**, and a normal increment entry is
five to eight kilobytes. At 65536 bytes this project's own safeguard discovery
stops reading the file, silently. **Move `O1`'s entry verbatim into
`docs/roadmap-archive-2026-09-10.md`** before you write your own, leaving the
same kind of pointer the earlier moves left, and do not rewrite or condense it on
the way. `E1`'s entry then becomes the oldest live one. Measure with `wc -c`.
`README.md` has 5614 bytes spare, which is now the tighter of the two per entry.
Put new material in `docs/`, which discovery does not recurse into.

## Take `U1`, and nothing else

**v1 is delivered, `O1` and `E1` have landed on top of it, and three of the
user's four scheduled increments remain: `U1`, `I1`, `G1`, in that order.**
`ROADMAP.md`'s section "The next increment is `U1`" is authoritative and the
increments table describes the other two.

**`U1` is unattended, non-interactive execution**: a run that completes with
nobody there to answer anything, while every existing gate still holds.

- `SCOPE.md` already allows `--all --comment`, and `--all` with
  `autoPostReviews=true`, to publish unattended. `U1` is about what a run does
  when **no elicitation UI exists at all**, not about widening that authority.
- **Posting authority never authorizes safeguard execution**, and no gate may be
  relaxed to let a headless run past it.
- `E1` supplied the first piece of evidence: `scripts/dogfood-review.mjs` already
  dispatches into a session with no UI, and `E1`'s own review of pull request #26
  ran that way. Selection reported `unavailable` and nothing published. `U1` has
  to make that deliberate rather than incidental.
- **Agree the shape with the user before building it.** The first half of issue
  #21 is a description, not a design.

**Do not start `I1` or `G1` early, and do not invent a fifth increment.**

## What `E1` did, and the four things worth carrying forward

`E1` used the tool for real on `xpepper/pr-review-gemini#28`, 1427 changed lines
over 16 files: 81.48022 credits, 93 s of model work, 16 approved tool calls, no
denial, **one validated finding, real and exact**. Its entry records the six
items that came out of it. Pull request #26 carries all of it.

- **Read the discarded candidates. Always.** #26's review produced four
  candidates. The best one was discarded at the evidence boundary because an
  optional `breaks` citation named ten lines for a nine-line quote, while its
  other five citations were exact. The claim was true, and is fixed on the
  branch. `Q6`'s repair cannot rescue that shape by design, because a repair that
  drops a named line could drop the line authorizing the anchor. **The rule
  behaved as designed and a true finding was still lost**; do not weaken the rule
  to catch it.
- **A boundary-discarded candidate is not in `validation.rejected`.** It is an
  execution-failure diagnostic. A summary reading `rejected=0` beside incomplete
  coverage is accurate and easy to misread.
- **The interactive UI truncates every evidence line at the window edge**, so you
  cannot read a run's own evidence from the screen. Recover it from
  `~/.copilot/session-state/<session-id>/events.jsonl`, which holds the `Q1`,
  `Q2`, `M2`/mode, `P1` and `P2` lines in full. That is a Copilot implementation
  detail, not a contract.
- **No run reports what it cost.** Billing is collected per request and retained
  in the evidence, and never printed; the host status bar shows the ambient
  session's zero. `SCOPE.md` defers usage reports, so a cost line is a scope
  decision for the user, not a defect to fix unasked.

**Five reviews in a row have now caught this project's paperwork disagreeing with
itself**: #18, #23, #24, #25 and #26. #26's was the closing section still telling
the next agent to run the external review the entry above it had just recorded.
**Before you finish, grep the live roadmap for claims your own change has made
false**, especially present-tense sentences about what has never been done.

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
gone minutes later, most likely clobbered by a concurrent `copilot` process. `E1`
reinstalled with `copilot plugin install "$(pwd)"` and then ran `diff -rq` of
`~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review` against the
checkout, expecting no output; do the same. CLI 1.0.83 warns that direct local
installs are deprecated for a future release.

**If you cannot type a Copilot slash command, dispatch it through the SDK** with
`node scripts/dogfood-review.mjs NUMBER --deep --no-comment`, as `AGENTS.md` says.
It refuses `--comment` and `--quiet`, asserts a clean tree at the pull request
head, and prints the credit total the interactive run does not.
`PR_REVIEW_DOGFOOD_REPOSITORY` retargets it. `copilot -p "/pr-review N"` is not a
substitute: prompt mode starts an ambient model turn instead of dispatching.

Both no-inference runtime probes spend no credits but need a live runtime
connection. `node scripts/smoke-runtime.mjs --targets` was **not** rerun during
`E1`, which changed no file it covers.

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

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
merely highlighted option submits the empty default. `E1`'s selection worked
first time because the question now says so.

`scripts/smoke-review.mjs` covers the run, including that an approved command
runs after approval and before the first specialist, that no reviewer prompt
carries its output, that a failing safeguard leaves coverage completed, that
`safeguards` stays out of the retained record, that no reviewer prompt claims the
working tree is still the reviewed revision, and the whole quiet contract. **All
of those are settled behaviour; keep every one.**

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1`, `D1`, `O1` and `E1` did not touch it. `E1`'s live run is fresh
evidence that confinement holds: 16 tool calls, `view` and GPT's `rg` alias, all
approved by the permission handler, zero denials.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. That file was not moved or edited
during `E1`, and both of `E1`'s reviews read it: `heavyModel=gpt-5.6-terra`,
`lightModel=gpt-5.6-luna`, `mediumModel=claude-sonnet-5`, efforts high, high and
medium.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence. A quiet
timeline is not a hang. `E1`'s reviewer printed five identical `active` lines over
76 seconds while making sixteen tool calls; that is the tool working.

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

`E1` landed through pull request **#26**, seven commits on branch
`e1-real-execution-feedback`, reviewed once with this plugin. The user chose to
merge it at the end of that session, so **you should be starting from `main`
with no increment branch open**. Confirm that from git state rather than from
this sentence, and reconcile anything that disagrees.

**Merging is always the user's decision**, and `main` refuses direct pushes for
everyone. Playground pull requests #1 and #2 must never be merged.

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
