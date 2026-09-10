# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is now short enough to read in full, and you should. The completed
entries it used to carry are in `docs/roadmap-archive-2026-09-10.md`, which you
do not need unless you want an older increment's evidence.

## Recorded state

This handoff is written on branch `a1-roadmap-archive`, which carries `A1` on
**pull request #22**. That pull request is being merged into `main` in the same
session that wrote this, and nothing is left uncommitted. **Confirm that before
anything else**: check whether #22 is merged, and start from `main` if it is. The
only open pull requests should then be the synthetic playground ones, #1 and #2,
which must never be merged or republished.

**#22 was deliberately not reviewed by the installed plugin.** It is
documentation-only, and `AGENTS.md` makes that review the user's call rather than
a requirement because it spends real credits. The user was asked and authorized
none. That is a recorded decision, not an omission to correct.

**Note that issue #21 exists**, a feature request about incremental re-reviews
and unattended non-interactive execution. It is why #22 is numbered #22. It is
**not** scheduled, it is not in the increments table, and the user's standing
direction is to treat a new feature idea as out of scope unless they ask for it.
Do not start it.

**`A1` is complete.** `ROADMAP.md` had reached 464771 bytes, over seven times the
65536-byte `instructionFileMaxBytes` cap, so this project's own safeguard
discovery skipped its roadmap for size and the tool could not read its own
project. Thirty-nine sections moved verbatim into
`docs/roadmap-archive-2026-09-10.md`, under `docs/` rather than at the root
because `collectInstructionFiles` does not recurse. Discovery now reads
`ROADMAP.md` and skips only `README.md`. Nothing under `extensions/` or
`scripts/` changed, so shipped behaviour is exactly `V2a`'s and the thirteen
suites are untouched.

**The port is feature-complete for v1.** Every must-have and every
costly-to-lose item in `SCOPE.md` is delivered. The user's direction, given after
#19 merged, is that the project had grown far past the effort its goal justified.
**Do not invent an increment, and treat a new feature idea as out of scope unless
the user asks for it.** Finishing is the work now.

## Before you write a roadmap entry, archive `V2a` and `V2b`

`ROADMAP.md` has **4272 bytes spare** against the 65536-byte cap. The last six
completed entries measured 7546, 12085, 14651, 15365, 15406 and 20969 bytes, so
even the smallest of them overruns what is left. This is arithmetic, not a risk
to watch.

**So the increment that adds the next completed entry archives `V2a` and `V2b`
first**, into `docs/roadmap-archive-2026-09-10.md` or a new dated file, leaving
the same kind of pointer `A1` left. That frees about 28KB. `A1` kept both `V2`
halves because keeping the most recent entries was its own instruction, so it
could not pre-empt this.

No size check enforces any of it. Run `wc -c ROADMAP.md` before opening a pull
request and treat 65536 as the number that matters. The `A1` entry also records
its own size and headroom in two places, so if you edit that entry, re-settle
those figures or delete them rather than leaving them wrong.

## Two increments are left, and `L1` is yours

**Take `L1`. Land it on its own branch and pull request, and stop.** The
roadmap's "Exact next increment" section is the authoritative version of this.

1. **`L1`: upstream licensing and attribution. This is your increment.**
   `SCOPE.md` records that `pi-pr-review` declares MIT but that no standalone
   licence text was found at the inspected revision, commit
   `457e18e30437984e2e6680802c9da25d270b82cc`. **No upstream source has been
   reused and none should be until this is settled.** The outcome is a recorded
   answer and, if attribution is owed, the text that discharges it. It needs no
   installed-plugin review and spends no Copilot credits.

   Acceptance criteria: a recorded, sourced answer to what the upstream licence
   actually is at the inspected revision and what it obliges; a statement of
   what may and may not be reused, consistent with the fact that nothing has
   been; and, if attribution is owed, the file or text that discharges it. If
   the answer cannot be established from primary sources, **record that as the
   answer** rather than assuming MIT from the package listing. Whether this
   project should also carry a licence of its own is a question for the user,
   not something to decide inside `L1`.

2. **`D1`: the user documentation.** Document configuration, modes, incomplete
   coverage, cancellation, publication, the cache and safeguards with
   reproducible end-to-end examples. `README.md` is 103636 bytes and is the one
   root file discovery still skips for size, exactly as `ROADMAP.md` was before
   `A1`, so `D1` should shorten it at least as much as it extends it. Its
   safeguard-discovery example still uses `Skipped: ROADMAP.md (exceeds 65536
   bytes)` to illustrate a skipped file, which no longer describes this
   checkout; replace that line. The next section is about `D1`'s review and
   matters more than it looks.

When both have landed, v1 is done. What remains open after that is a set of
limitations to state in the release notes, not work to schedule.

### `D1` carries the last live-evidence opportunity, so do not waste it

`D1` must fix one recorded wording defect: `reviewPrompt` in `review.mjs` tells
every specialist its working directory is "verified to be at" the reviewed head,
which stays true of `HEAD` after a safeguard runs but not of the working tree.
That is a change under `extensions/`, so **`D1`'s pull request needs an
installed-plugin review whatever else it contains.**

**Run that review with `--verify`, and approve `node scripts/smoke-safeguards.mjs`
when the host's approval UI asks.** Safeguard execution has never run under the
installed plugin: a non-empty `accept`, a real spawn, a real capture, a real
artifact line and a real cancellation are all demonstrated only by the
controlled suites. That suite finishes in well under a second and leaves the
checkout clean, so the artifact line should say the checkout is unchanged. It
closes the gap at no extra cost. A live refusal from the exclusion table cannot
be arranged deliberately, because what a discovery pass reports is not ours to
choose.

Note also, before you "fix" the wording defect into something stronger:
**re-asserting checkout cleanliness after execution is refused and must stay
refused.** `SCOPE.md` says these commands may create artifacts and forbids
cleaning the checkout, so a re-assertion would refuse a review because the
person's own approved tests wrote a coverage file. The inaccuracy is contained
already: `boundCitation` in `findings.mjs` resolves every citation against the
head and base blobs fetched from GitHub, so a reviewer can read a file a
safeguard wrote and can never cite one. Fix the sentence, not the gate.

## Validation and runtime caveats

The **thirteen** controlled suites (`node scripts/smoke-<name>.mjs`) are
findings, review, selection, retention, preview, publication, publish-later,
checkout, config, context, fixture, target and safeguards. They require no
inference and no network. All thirteen pass at this handoff, as they did at the
`A1` checkpoint. `git diff --check` is clean.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
```

`A1` added one cheap check worth keeping. It runs this project's real discovery
collector against this checkout, needs no network and no inference, and tells
you which of your own files the tool can read:

```sh
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

It should read `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md` and
`SCOPE.md`, and skip only `README.md`. If it starts skipping another file, that
file has crossed 65536 bytes.

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
real file; `A1` could not have weakened it and neither should you.

**Case is folded for the denylist's name lookups and deliberately not for
flags.** `-w` and `-W` are two different flags and the table carries both; do not
"simplify" that by lowercasing every word.

`scripts/smoke-review.mjs` covers the run, including that an approved command
runs after approval and before the first specialist, that no reviewer prompt
carries its output, that a failing safeguard leaves coverage completed, and that
`safeguards` stays out of the retained record. **All four are settled behaviour
rather than a slice's temporary state; keep every one of them.**

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a`, `V2b`
and `A1` did not touch it. Reviewer confinement is unchanged, and execution is a
separate path no reviewer can reach.

Both no-inference runtime probes passed before `V1b` and **have not been rerun
since**. They spend no credits but need a live runtime connection, and
`copilot plugin install "$(pwd)"` must be rerun whenever the checkout changes, or
the probe measures the previous build:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

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
both exist to stop the refusal from saying where a symlink points. The same
`lstat` reasoning is why `collectInstructionFiles` refuses a symbolic link rather
than following it.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`. Consult the installed SDK and current official
documentation before adopting new APIs. Do not revisit Agent Factories without a
new CLI version. **Do not widen `F6`'s marker unwrap or reintroduce substring
matching**; `safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs`
precisely so the one rule stays in one place.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited in this session.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows.

The review output is very verbose, and the user has asked for a way to quieten
it. Nothing is designed and nothing is scheduled. It is a plausible part of `D1`
if the user wants it; do not start it on your own.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. **The standing workflow authorizes exactly one review per
increment pull request and nothing else.** `L1` is documentation-only, so
`AGENTS.md` makes its review the user's call rather than a requirement; ask, and
do not spend by default. Merging remains the user's decision. Preserve unrelated
changes. Inspect enumerations and counts when extending a concept. Update
`README.md` for user-visible behaviour.

**Reconcile the roadmap's own handoff text before you finish.** #18's overview
reviewer found the exact-next-increment section still naming the increment that
had just been completed, which would have sent the next session to redo finished
work. Recording a completed entry is only half of it.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
