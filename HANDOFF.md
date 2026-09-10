# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

## Recorded state

This handoff is written on branch `v2a-safeguard-execution`, which carries `V2a`
on **pull request #19**. That pull request was reviewed, its findings were
answered, and it is being merged into `main` in the same session that wrote
this. **Confirm that before anything else**: check whether #19 is merged, and
start from `main` if it is. The only open pull requests should then be the
synthetic playground ones, #1 and #2, which must never be merged or republished.

**`V2a` is complete.** An approved safeguard command runs in the checkout before
any reviewer starts, with no shell anywhere in the path. Its eight choices are
settled and recorded in the roadmap under "Completed increment: `V2a`", which is
authoritative. Do not reopen them, do not weaken the shell gate to accept a
command a project wrote as a chain, and do not add a timeout of any kind.

**The next increment is `V2b`, and it must not begin with code.** It needs the
user's go-ahead and it has three questions, all recorded under "Exact next
increment". Present them one at a time, each with a recommendation, the reason,
and every alternative, and lead with which option is cheapest. Expect `V2b` to be
split further rather than taken whole: the user's standing principle is that the
smaller the increment the better, provided it stays coherent and meaningful.

## What #19's review actually demonstrated, and what it did not

Read the roadmap section "The installed-plugin review of pull request #19" in
full before planning `V2b`. The short version:

- **It reached the host's real approval UI**, which #18 could not, because it was
  typed interactively rather than dispatched through `scripts/dogfood-review.mjs`.
  That runner registers no elicitation handler and can never approve anything.
- **It approved nothing**, so execution has never run under the installed plugin.
  A real spawn, a real capture, a real artifact line and a real cancellation are
  demonstrated only by the controlled suites.
- **The citation gate refused a constructed command live**: the pass supplied
  `node` in front of a filename `HANDOFF.md` mentions in prose, and the gate
  refused the result as uncited. That is the check working on something nobody
  staged.
- **No exclusion rule refused anything live.** The pass reported only three
  candidates. The table remains demonstrated by the controlled suites alone.
- **The evidence gate surfaced one of the three real defects in the increment.**
  It invalidated a correct adjudication of the second and rejected the third from
  all three reviewers that reported it, every time for a citation that genuinely
  did not match. Two of the three are fixed on this branch; the third is `V2b`'s
  first question. Keep the rejected-candidate text on screen: it is how the other
  two were recovered.

## `V2b`'s three questions

1. **Whether the citation gate may accept a prefix.** It does today: whitespace
   ends a match, so `npm test` passes as cited from a file declaring
   `npm test --fix`, and a command whose safety lives in a trailing argument can
   be offered without it. Tightening it also refuses a command declared
   mid-sentence, which is how projects ordinarily write one. This is the cheapest
   of the three and it is a rule to settle, not a patch to apply.
2. **Whether safeguard output reaches a reviewer.** Safeguard output is
   pull-request controlled text, so this is an injection surface, and it reopens
   whether a failed safeguard stays outside review coverage. #19's one validated
   finding belongs here: the reviewer prompt tells every specialist its working
   directory is "verified to be at" the reviewed head, which stays true of `HEAD`
   after a safeguard runs but need not stay true of the working tree.
   **Re-asserting cleanliness after execution is refused and must stay refused**:
   `SCOPE.md` says these commands may create artifacts and forbids cleaning the
   checkout, so a re-assertion would refuse a review because the person's own
   approved tests wrote a coverage file. Telling the reviewer what changed is an
   option here, and it is not free, because a path list is still safeguard-derived.
3. **What the retained record says about what ran.** `V1b` and `V1c` stayed out
   of the record because a stored approval is the artifact a later increment
   could mistake for standing permission. A record of what already ran does not
   carry that risk in the same way; make the argument explicitly rather than
   inheriting it. If the record is opened, note that `approveSafeguards` returns
   `none` for both a decline and an accept that selected nothing, which #19 hit
   live.

**When `V2b`'s own review is proposed, offer to approve
`node scripts/smoke-safeguards.mjs` during it.** That is the cheapest way to
give execution its first live evidence: the suite finishes in well under a
second and leaves the checkout clean, so the artifact line should say so. Do not
spend a review on that alone.

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
`safeguards` stays out of the retained record.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review. Check a branch's diff for control bytes before
spending a review on it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V2a` did
not touch it. Reviewer confinement is unchanged, and execution is a separate path
no reviewer can reach.

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
it. Nothing is designed and nothing is scheduled; record it if it comes up, and
do not start it instead of `V2b`.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. **The standing workflow authorizes exactly one review per
increment pull request and nothing else**; #19's is spent, and #19's two fixes
were therefore never reviewed by the installed plugin. Merging remains the user's
decision. Preserve unrelated changes. Inspect enumerations and counts when
extending a concept. Update `README.md` for user-visible behaviour.

**Reconcile the roadmap's own handoff text before you finish.** #18's overview
reviewer found the exact-next-increment section still naming the increment that
had just been completed, which would have sent the next session to redo finished
work. Recording a completed entry is only half of it.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
