# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

## Recorded state

This handoff is written on branch `v2b-settled-without-code`, which carries
`V2b` on **pull request #20**. **Confirm before anything else** whether #20 is
merged, and start from `main` if it is. The only open pull requests should then
be the synthetic playground ones, #1 and #2, which must never be merged or
republished.

**`V2` is closed. `V2b` was settled without code.** Its three questions were put
to the user one at a time and all three were answered "no change": safeguard
output reaches no reviewer, the retained record says nothing about what ran, and
the citation gate still accepts a prefix, now documented as a limitation instead
of tightened. Nothing under `extensions/` or `scripts/` changed, so the shipped
behaviour is exactly `V2a`'s and the thirteen suites are untouched. The reasoning
is under "Completed increment: `V2b`" in the roadmap, which is authoritative. Do
not reopen any of the three.

**The port is feature-complete for v1.** Every must-have and every
costly-to-lose item in `SCOPE.md` is delivered. The user's direction, given after
#19 merged, is that the project had grown far past the effort its goal
justified. **Do not invent an increment, and treat a new feature idea as out of
scope unless the user asks for it.** Finishing is the work now.

## What is left, in order

1. **The roadmap archive.** Agreed with the user and not yet started. This file
   passed 445KB, which is itself a functional problem: safeguard discovery skips
   it for size, so the tool cannot read its own project. Move the completed
   entries into a dated archive file and keep a short live roadmap. **Its own
   pull request**, separate from #20, mechanical and documentation-only. Do not
   move the increments table, the "Exact next increment" section, or the most
   recent completed entries out of `ROADMAP.md`.
2. **`L1`: upstream licensing and attribution.** `SCOPE.md` records that
   `pi-pr-review` declares MIT but that no standalone licence text was found at
   the inspected revision. No upstream source has been reused and none should be
   until this is settled. It needs no review and spends no credits.
3. **`D1`: the user documentation.** `README.md` is over 100KB and is skipped by
   discovery for the same reason the roadmap is, so `D1` should shorten it at
   least as much as it extends it.

### `D1` carries the last live-evidence opportunity, so do not waste it

`D1` must fix one recorded wording defect: `reviewPrompt` in `review.mjs` tells
every specialist its working directory is "verified to be at" the reviewed head,
which stays true of `HEAD` after a safeguard runs but not of the working tree.
That is a change under `extensions/`, so **`D1`'s pull request needs an
installed-plugin review whatever else it contains.**

**Run that review with `--verify`, and approve `node
scripts/smoke-safeguards.mjs` when the host's approval UI asks.** Safeguard
execution has never run under the installed plugin: a non-empty `accept`, a real
spawn, a real capture, a real artifact line and a real cancellation are all
demonstrated only by the controlled suites. That suite finishes in well under a
second and leaves the checkout clean, so the artifact line should say the
checkout is unchanged. It closes the gap at no extra cost. A live refusal from
the exclusion table cannot be arranged deliberately, because what a discovery
pass reports is not ours to choose.

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
inference and no network. All thirteen pass at this handoff, as they did at each
checkpoint. `git diff --check` is clean.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
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

**Case is folded for the denylist's name lookups and deliberately not for
flags.** `-w` and `-W` are two different flags and the table carries both; do not
"simplify" that by lowercasing every word.

`scripts/smoke-review.mjs` covers the run, including that an approved command
runs after approval and before the first specialist, that no reviewer prompt
carries its output, that a failing safeguard leaves coverage completed, and that
`safeguards` stays out of the retained record. **All four are now settled
behaviour rather than a slice's temporary state; keep every one of them.**

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. Neither
`V2a` nor `V2b` touched it. Reviewer confinement is unchanged, and execution is a
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
increment pull request and nothing else.** #20 is documentation-only, so
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
