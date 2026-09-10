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

## v1 is finished, and there is no next increment

**`D1` was the last increment, and it has landed on pull request #24.** Every
row in the roadmap's increments table now reads Completed. `SCOPE.md`'s
must-have column, its costly-to-lose column and its additional agreed v1
capability are all delivered.

**So there is nothing scheduled, and you should not invent something.** The
user's standing direction, given after #19 merged, is that this port had already
grown far past the effort its goal justified and that the remaining appetite
belonged to finishing rather than building. Treat any new feature idea as out of
scope unless the user asks for it in this session.

**Note that issue #21 exists**, a feature request about incremental re-reviews
and unattended non-interactive execution. It is not scheduled and it is not in
the increments table. Do not start it.

**Confirm git state before anything else.** Check whether #24 is merged and
start from `main` if it is. The only open pull requests should then be the
synthetic playground pair, **#1 and #2, which must never be merged or
republished**. Several merged increment branches still exist on the remote;
deleting them is tidying, not work, and needs the user to ask.

If the user does schedule further work, it lands the same way as every increment
before it: a branch, a pull request, one review of that pull request with this
plugin, and the outcome recorded in `ROADMAP.md`. `main` refuses direct pushes
and grants no bypass. Merging stays the user's call.

## What `D1` did, and the one thing it failed to do

`D1` replaced `README.md` with a task-organised user guide, moved the previous
one verbatim to `docs/readme-archive-2026-09-10.md`, fixed three shipped strings
that told the user something false, corrected the reviewer prompt's claim about
the working tree, archived `A1`'s roadmap entry, and recorded the user's decision
to license this project MIT.

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
- Closing that needs a review authorized for the purpose, because approval sits
  after discovery inside a running review. **Do not spend it unasked.** The
  cheapest honest version is one `--deep --verify` review of a small pull
  request, approving one fast command.

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
appearing in the skipped list it has crossed 65536 bytes. **The margins are
thin now**: `README.md` has about 10KB spare and `ROADMAP.md` about 7KB. Measure
with `wc -c` before extending either, and put new material in `docs/`, which
discovery does not recurse into, rather than growing a root file.

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
