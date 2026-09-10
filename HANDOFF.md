# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. The completed
entries it used to carry are in `docs/roadmap-archive-2026-09-10.md`, which you
do not need unless you want an older increment's evidence. The README that used
to carry them is in `docs/readme-archive-2026-09-10.md`, which you need only for
a harness probe invocation the live `README.md` no longer prints.

## Take `O1`, and nothing else

**v1 is delivered. `D1` was its last increment and it merged on pull request
#24.** The user then scheduled exactly one more increment, **`O1`: quieter review
output**, which is yours. The roadmap's "The next increment is `O1`" section is
the authoritative version of what follows.

**A review prints a great deal and the user has asked for a way to quieten it.**
The request has been recorded and deferred since `V2b`. Deliver **one opt-in
flag** that suppresses the evidence JSON lines (`Q1 target:`, `Q2 context:`, the
mode's `binding:` line, the `evidence:` lines) and the raw untrusted model
envelopes. Between them they dwarf the findings, which is what the reader came
for.

Four things bound it, and the roadmap says why:

- **Verbose stays the default.** This project reads its own increment evidence
  out of those lines: models and efforts actually used, credit cost, tool calls,
  denials, coverage diagnostics. **`scripts/dogfood-review.mjs` must keep
  printing the whole timeline**, so an increment's own review is never the run
  that hid its own evidence.
- **Nothing about trustworthiness may be suppressed at any verbosity**: coverage
  and its diagnostics, incomplete coverage, every refusal and failure, the "not a
  clean-review claim" statements, the safeguard discovery, approval and execution
  summaries, and every publication outcome including an uncertain write. A quiet
  run must still be impossible to mistake for a clean review.
- **Settle the flag against a configuration key deliberately, and ask first.**
  `--verify` is deliberately not a configuration key because it authorizes
  execution; verbosity authorizes nothing, so a personal key is defensible. One
  flag is the smaller step and satisfies the request. Do not build both unasked.
- **Acceptance**: a quiet run prints the effective assignments, per-reviewer
  progress, the findings, the coverage report and the settled outcome, and omits
  the envelopes and the evidence JSON. **A run without the flag is unchanged.**
  Both are covered by the thirteen suites, written test-first.

**`O1` is the whole of what is scheduled.** Do not invent a second increment.
**Issue #21 exists**, a feature request about incremental re-reviews and
unattended execution: it is not scheduled and you should not start it. Treat any
other feature idea as out of scope unless the user asks for it in your session.

## `O1`'s review is pre-authorized, and it must approve a safeguard

`O1` changes `extensions/`, so `AGENTS.md` requires one installed-plugin review
of its pull request. **The user has already authorized that one review, and has
asked that it be `--verify` with a command approved at the question**, because
that is the only way left to capture live safeguard-execution evidence. Do not
spend a second review on anything without asking.

    /pr-review NUMBER --deep --verify --all --no-comment

**You cannot dispatch it yourself.** `scripts/dogfood-review.mjs` registers no
elicitation handler and answers every permission request with
`denied-no-approval-rule`, so it can never approve a command. Ask the user to
type it in an interactive Copilot session and to **approve `node
scripts/smoke-safeguards.mjs`** when the question appears; that suite finishes in
well under a second and leaves the checkout clean, so the artifact line should
say the checkout is unchanged.

Before they run it: the tree must be clean with **no untracked path**, on the
pull request's head branch, at its head commit, and **`copilot plugin list` must
show the plugin**, reinstalled from that head. `--verify` refuses otherwise.

**Watch the approval outcome.** If it prints the `empty` message, the selection
did not reach the run and nothing was approved; say so and ask whether to try
again rather than recording a decline. That distinction exists because #24 lost
its approval exactly that way.

What a successful run finally demonstrates, none of which any suite can prove: a
non-empty `accept`, a real spawn, a real capture, a real artifact line. Record it
in `ROADMAP.md` with the rest of the review's evidence.

## What `D1` did, and the one thing it failed to do

`D1` replaced `README.md` with a task-organised user guide, moved the previous
one verbatim to `docs/readme-archive-2026-09-10.md`, fixed three shipped strings
that told the user something false, corrected the reviewer prompt's claim about
the working tree, archived the `A1` and `L1` roadmap entries, and recorded the
user's decision to license this project MIT.

**It did not deliver the live safeguard-execution evidence it was meant to.**
Read that part of the roadmap before you form any impression of the safeguard
path from the controlled suites.

- #24's review was `--deep --verify --all --no-comment`, typed interactively. It
  cost **136.8324 reported credits** and returned **0 validated findings on
  incomplete coverage**, which is not a clean-review claim and is not recorded as
  one.
- Discovery read all six root instruction files, **skipped none**, and offered
  two commands. **Neither was approved**, so nothing ran.
- **Safeguard execution has still never run under the installed plugin.** A
  non-empty `accept`, a spawn, a capture, an artifact line and a cancellation are
  demonstrated only by `scripts/smoke-safeguards.mjs`. The `--verify` path is
  demonstrated live as far as the approval gate and no further.
- **Why it did not run is itself a defect, now fixed.** The operator selected a
  command and the run recorded none approved. `V1c` reported a decline and an
  accepted answer naming nothing identically, as `none`, so nothing on screen
  said the selection had failed to arrive, and the raw answer is unrecoverable
  because no elicitation payload is logged anywhere. `declined` and `empty` are
  now separate statuses and the `empty` message tells you to rerun. **Execution
  still keys only on `approved`; no gate changed.** If you run a `--verify`
  review and see the `empty` message, your pick did not reach the run.
- **`O1`'s review is where that gets bought**, and the user has authorized it in
  advance. Approval sits after discovery inside a running review, so there is no
  cheaper way to reach it. See the section above for how to set that run up.

Both of #24's discarded candidates described real defects and were fixed on the
branch: a roadmap that contradicted itself about `D1`'s own status, and the
archived README's root-relative links no longer resolving from `docs/`. Its
coverage gap was a third real defect, about an over-claim in the new README.
**Read the discarded candidates of any review you run.** On #23 and again on #24,
zero validated findings sat on top of several correct observations.

## Settled decisions, none of which is to be reopened

- **`L1` is closed.** Upstream declares MIT and publishes no licence text and no
  copyright notice, so no upstream source, prompt text or documentation may be
  copied, and a line-level audit shows none has been. The evidence and the reuse
  rule are in `docs/upstream-licensing.md`.
- **This project is MIT licensed.** The user took that decision during `D1` and
  `LICENSE` carries the canonical text with `Copyright (c) 2026 Pietro Di Bello`.
  The question `L1` left open is answered; do not reopen it.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a command a project wrote as a chain, and no timeout of any
  kind bounds a running safeguard.
- **Re-asserting checkout cleanliness after execution stays refused.** `SCOPE.md`
  says approved commands may create artifacts and forbids cleaning the checkout,
  so a re-assertion would refuse a review because the person's own approved tests
  wrote a coverage file. `D1` fixed the prompt sentence that over-claimed here;
  do not "improve" it back into a gate.

## Validation and runtime caveats

The **thirteen** controlled suites (`node scripts/smoke-<name>.mjs`) are
findings, review, selection, retention, preview, publication, publish-later,
checkout, config, context, fixture, target and safeguards. They need no
inference and no network, and all thirteen pass at this handoff. `git diff
--check` is clean and the branch diff carries no control byte.

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

**It should read all six root files and skip none**, which is `D1`'s own
outcome and was confirmed live by #24's discovery pass. If a file starts
appearing in the skipped list it has crossed 65536 bytes. **The margins are thin
now**: `README.md` has 9463 bytes spare and `ROADMAP.md` has 16030,
against a 65536-byte cap. Measure with `wc -c` before extending either, and put
new material in `docs/`, which discovery does not recurse into, rather than
growing a root file. `D1` archived both the `A1` and `L1` entries so `O1` has room to write its
own; a session after `O1` archives `D1`'s the same way, leaving the same kind of
pointer.

**Check `copilot plugin list` immediately before dispatching any review.** During
`D1` an install that had reported success, and that the list then showed, was
gone minutes later, most likely clobbered by a concurrent `copilot` process. The
installed copy is what a review actually exercises, so a missing or stale one
would be reviewed as though it were your branch. **Reinstall whenever the
checkout changes**, and check out before installing, never the other way round.
CLI 1.0.83 warns that direct local installs are deprecated for a future release.

Both no-inference runtime probes spend no credits but need a live runtime
connection. `node scripts/smoke-runtime.mjs --targets` was rerun during `D1`,
against a freshly installed copy diffed against the checkout, because
`extension.mjs` changed; it passes.

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
grandchild process the safeguard started. It also asserts the module can never
open a shell; **keep that assertion**, and do not replace it with a weaker one.
Its oversize-skip assertion uses a synthetic project whose `ROADMAP.md` is
`"x".repeat(instructionFileMaxBytes + 1)`, so it tests the rule and never the
real file. Neither `A1`, `L1` nor `D1` could have weakened it and neither should
you.

**Case is folded for the denylist's name lookups and deliberately not for
flags.** `-w` and `-W` are two different flags and the table carries both; do not
"simplify" that by lowercasing every word.

`scripts/smoke-review.mjs` covers the run, including that an approved command
runs after approval and before the first specialist, that no reviewer prompt
carries its output, that a failing safeguard leaves coverage completed, that
`safeguards` stays out of the retained record, and, since `D1`, that no reviewer
prompt claims the working tree is still the reviewed revision. **All of those are
settled behaviour rather than a slice's temporary state; keep every one.**

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1` and `D1` did not touch it. Reviewer confinement is unchanged,
and execution is a separate path no reviewer can reach.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

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
both exist to stop a refusal from saying where a symlink points. The same
`lstat` reasoning is why `collectInstructionFiles` refuses a symbolic link rather
than following it.

**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**
`safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs` precisely so
the one rule stays in one place.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited during `D1`, and #24's run read it: the personal store sets
`heavyModel=gpt-5.6-terra`, `lightModel=gpt-5.6-luna`, `mediumModel=claude-sonnet-5`
with efforts high, high and medium.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned, so a pinned path silently drives a stale SDK. Consult the installed SDK
and current official documentation before adopting new APIs. **Do not revisit
Agent Factories without a new CLI version**; three separate blockers were
demonstrated on 1.0.83 and all three would have to change.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool, and it starts only when a candidate survives the evidence boundary,
so a review whose candidates are all refused runs none. Citations remain limited
to captured diff and context windows.

The review output is very verbose, and the user has asked for a way to quieten
it. Nothing is designed and nothing is scheduled. `D1` deliberately did not start
it, because it is a capability rather than documentation. Do not start it on your
own.

## If you land anything at all

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named branch and
pull request, never a direct `main` push, no force-push or amended published
history. **The standing workflow authorizes exactly one review per pull request
and nothing else**; any rerun or extra probe that spends credits needs a fresh
explicit instruction. Keep findings local: no `--comment` and no publish without
a new explicit instruction. Preserve unrelated changes. Inspect enumerations and
counts when extending a concept. Update `README.md` for user-visible behaviour,
and watch its size while you do.

**Reconcile this file and the roadmap's own status text before you finish.**
Three separate reviews have now caught this project's paperwork disagreeing with
itself: #18's overview reviewer found the next-increment section naming a
completed increment, #23's found the `L1` row promising a record that did not
exist, and #24's found the roadmap declaring v1 done while the table still said
Pending. Recording an entry is only half of it.

Rewrite `HANDOFF.md` as the final repository file edit before the session-ending
commit, include it in that commit, and push it to the pull request the work
lives on. Refresh it again last if any further edit becomes necessary. Report the
commit and pull-request outcome and point here.
