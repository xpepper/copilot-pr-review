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

## Take `E1`, and nothing else

**v1 is delivered, `O1` landed on top of it, and the user has since scheduled
four increments: `E1`, `U1`, `I1`, `G1`, in that order.** `ROADMAP.md`'s section
"The next increment is `E1`" is the authoritative version of what follows, and
the increments table describes the other three.

**`E1` is feedback from real execution.** Every review this project has ever run
has been of its own pull requests, which are small and mostly documentation. The
largest is #10 at 984 additions over twelve files. **Nobody knows how this tool
behaves on a substantial code diff**, and that is the oldest open observation in
the roadmap.

- **Run at least one review against a substantial code diff in another
  repository.** Agree the target with the user first and do not spend a review
  unasked. The tool takes a pull request number for the repository owning the
  current directory, so this means a checkout of that repository with the plugin
  installed from this project's head.
- **Record what the reviewers actually did**, well and badly: which findings were
  real, which were noise, what the evidence boundary discarded that should have
  survived, what the adjudicator accepted that it should not have, the time and
  the credit cost.
- **Collect usability problems, not only defects.** What was hard to read, hard
  to answer or hard to trust belongs in this increment.
- **Fix what is small and clearly right** on a branch and a pull request; record
  the rest with a reason rather than widening the increment.

**Do not start `U1`, `I1` or `G1` before `E1` is recorded**, and do not invent a
fifth. `E1` exists so that what comes after it is informed by real behaviour.

## What `O1` did

`--quiet` leaves out the evidence JSON lines (`Q1 target:`, `Q2 context:`, the
mode's `binding:`, the settled `evidence:`, `P1` and `P2`) and every raw
untrusted model envelope, including the safeguard discovery pass's. **Verbose is
the default**, `scripts/dogfood-review.mjs` refuses the flag outright, and
`--capture-only` refuses it too.

**Nothing about trustworthiness is suppressed at any verbosity**, and no later
change may weaken that: coverage and its diagnostics, every refusal and failure,
the not-a-clean-review statements, the safeguard discovery, approval and
execution summaries, and every publication outcome all print. A skipped target
states its disposition and reason in words where the suppressed JSON used to
carry them. **The user chose one flag and deliberately no configuration key**;
do not add one without being asked.

## The approval gap is closed: a safeguard has finally run live

**The installed plugin has now approved, spawned and captured a real safeguard.**
#25's second review approved `node scripts/smoke-safeguards.mjs`, ran it to exit
0 in 500 ms, showed its ten `PASS` lines, and reported the checkout unchanged.
That is a non-empty `accept`, a real spawn, a real capture and a real artifact
line, none of which any controlled suite can prove.

**What is left of that gap is one thing: cancelling a running safeguard**,
including killing a grandchild. `scripts/smoke-safeguards.mjs` covers it and
nothing else does, because arranging it live means cancelling a real review
mid-command. Do not go looking for it; note it if it ever happens.

**Three earlier `--verify` reviews approved nothing** (#19, #24, #25's first
run), the last two against the operator's own account of what they picked.
`O1`'s session found out why, at the user's request, by asking Copilot CLI about
its own SDK for 56.63 credits and then checking the answer by hand against the
installed bundle:

- **The schema was never wrong.** `copilot-sdk/generated/rpc.d.ts:20500` names
  our `array` / `items.anyOf` / `const` shape `UIElicitationArrayAnyOfField`,
  "Multi-select string field", and nothing in the SDK or transport drops a
  selection.
- **The host toggles only on Space.** In `app.js` at byte offset `5750008` the
  multi-select changes its array only in the `Y.code === "space"` branch. Up and
  down move the highlight; Enter submits whatever is toggled. **Enter on a merely
  highlighted command submits the empty default**, which is a valid accepted
  answer and produces exactly the `empty` message.
- **The question now says so**, and `README.md` says it at the approval step.
  **That fix is what closed the gap**: same person, same commands, same schema,
  and the approval went from `empty` to `approved` on the next attempt.
- **`minItems` was deliberately not added and must not be.** The suite asserts
  its absence. Approving nothing must stay expressible and stay the default.

**Press Space on the command before pressing Enter** in any future `--verify`
run. If the `empty` message appears, the selection did not arrive; say so and ask
rather than recording a decline.

**Reinstall before any review, and prove it.** The second review only tested the
fix because the plugin was reinstalled from the new head first: the stale
installed copy did not carry it. `diff -rq` the installed
`extensions/pr-review` against the checkout and expect no output.

## What #25's two reviews showed, and two things to learn from them

Both deep, `--verify --all --no-comment`, `gpt-5.6-terra` at high throughout,
completed coverage both times, zero denials, nothing published. The first cost
**57.6814 credits** over 10 tool calls; the second **98.84322** over 28.

- **Three findings across the two runs, two of them real and fixed**: `--quiet`
  did not reach the discovery pass, and the live roadmap contradicted itself
  about whether quiet output existed.
- **One finding was false, and the adjudicator accepted it.** It claimed the
  quiet capture line drops the "No PR review performed; no clean-review claim"
  notice. That sentence is appended by the outer template literal after the
  ternary closes, so both arms carry it, and the reviewer's own citation quotes
  the proof. **`allClaimsSupported: true` means a model said so.** Check a
  finding against the source before acting on it, and **read the discarded
  candidates too**: on #23 and #24 zero validated findings sat on top of several
  correct observations.
- **Four reviews in a row have now caught this project's paperwork disagreeing
  with itself**: #18, #23, #24 and #25. Writing the warning down has not worked.
  **Before you finish, grep the live roadmap for claims your own change has made
  false**, especially present-tense sentences about what has never been
  demonstrated.

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

**It should read all six root files and skip none.** If a file starts appearing
in the skipped list it has crossed 65536 bytes. **`O1` archived `D1`'s entry**,
so `ROADMAP.md` has 20911 bytes spare again; `README.md` has 6610, which is
the tighter of the two now. Measure with `wc -c` before extending either. When
the roadmap next runs short, archive the oldest live entry into
`docs/roadmap-archive-2026-09-10.md` verbatim, leaving the same kind of pointer,
rather than rewriting or condensing it. Put new material in `docs/`, which
discovery does not recurse into, rather than growing a root file.

**Check `copilot plugin list` immediately before dispatching any review.** During
`D1` an install that had reported success, and that the list then showed, was
gone minutes later, most likely clobbered by a concurrent `copilot` process. The
installed copy is what a review actually exercises, so a missing or stale one
would be reviewed as though it were your branch. **Reinstall whenever the
checkout changes**, and check out before installing, never the other way round.
`O1` reinstalled with `copilot plugin install "$(pwd)"` and then diffed
`~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review` against the
checkout to prove the copy was byte-identical; do the same. CLI 1.0.83 warns that
direct local installs are deprecated for a future release.

Both no-inference runtime probes spend no credits but need a live runtime
connection. `node scripts/smoke-runtime.mjs --targets` was **not** rerun during
`O1`, although `extension.mjs` changed: its `help` and `status` text grew a
`--quiet` paragraph. Rerun it if you touch that file again.

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
Since `O1` it also asserts the approval question names both Space and Enter and
that the schema carries no `minItems`. **Everything it covers except the
cancellation has now also been seen live**, on #25's second review. Its oversize-skip assertion uses a
synthetic project whose `ROADMAP.md` is `"x".repeat(instructionFileMaxBytes + 1)`,
so it tests the rule and never the real file.

**Case is folded for the denylist's name lookups and deliberately not for
flags.** `-w` and `-W` are two different flags and the table carries both; do not
"simplify" that by lowercasing every word.

`scripts/smoke-review.mjs` covers the run, including that an approved command
runs after approval and before the first specialist, that no reviewer prompt
carries its output, that a failing safeguard leaves coverage completed, that
`safeguards` stays out of the retained record, that no reviewer prompt claims the
working tree is still the reviewed revision, and, since `O1`, the whole quiet
contract: the same settled run printed twice and compared line by line, a quiet
run with a failing reviewer, a quiet run of a skipped draft, and a quiet
`--verify` run whose discovery envelope is gone while its discovery summary
stays. **All of those are settled behaviour rather than a slice's temporary
state; keep every one.**

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1`, `L1`, `D1` and `O1` did not touch it. Reviewer confinement is
unchanged, and execution is a separate path no reviewer can reach.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited during `O1`, and #25's run read it: the personal store sets
`heavyModel=gpt-5.6-terra`, `lightModel=gpt-5.6-luna`, `mediumModel=claude-sonnet-5`
with efforts high, high and medium.

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

## Settled decisions, none of which is to be reopened

- **`L1` is closed.** Upstream declares MIT and publishes no licence text and no
  copyright notice, so no upstream source, prompt text or documentation may be
  copied, and a line-level audit shows none has been. The evidence and the reuse
  rule are in `docs/upstream-licensing.md`.
- **This project is MIT licensed**, with `Copyright (c) 2026 Pietro Di Bello` in
  `LICENSE`. Settled during `D1`; do not reopen it.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a command a project wrote as a chain, and no timeout of any
  kind bounds a running safeguard.
- **Re-asserting checkout cleanliness after execution stays refused.** `SCOPE.md`
  says approved commands may create artifacts and forbids cleaning the checkout,
  so a re-assertion would refuse a review because the person's own approved tests
  wrote a coverage file. `D1` fixed the prompt sentence that over-claimed here;
  do not "improve" it back into a gate.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`L1`'s no-copying rule is not specific to upstream.** `G1` will compare this
  tool with other code-review agents and skills; anything worth adopting is
  adopted as behaviour and re-implemented here. Copy no source, prompt text or
  documentation from any of them.

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
Three separate reviews have caught this project's paperwork disagreeing with
itself: #18's overview reviewer found the next-increment section naming a
completed increment, #23's found the `L1` row promising a record that did not
exist, and #24's found the roadmap declaring v1 done while the table still said
Pending. Recording an entry is only half of it.

Rewrite `HANDOFF.md` as the final repository file edit before the session-ending
commit, include it in that commit, and push it to the pull request the work
lives on. Refresh it again last if any further edit becomes necessary. Report the
commit and pull-request outcome and point here.
