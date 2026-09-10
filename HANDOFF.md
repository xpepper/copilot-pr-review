# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

`ROADMAP.md` is short enough to read in full, and you should. The completed
entries it used to carry are in `docs/roadmap-archive-2026-09-10.md`, which you
do not need unless you want an older increment's evidence.

## Recorded state

This handoff is written on branch `l1-upstream-licensing`, which carries `L1` on
**pull request #23**. **Confirm before anything else**: check whether #23 is
merged, and start from `main` if it is. The only open pull requests should then
be the synthetic playground ones, #1 and #2, which must never be merged or
republished.

**Note that issue #21 exists**, a feature request about incremental re-reviews
and unattended non-interactive execution. It is **not** scheduled, it is not in
the increments table, and the user's standing direction is to treat a new
feature idea as out of scope unless they ask for it. Do not start it.

**`L1` is complete.** Upstream declares MIT in its manifest at the inspected
commit, in the manifest inside the verified published tarball, in npm registry
metadata and on the `pi.dev` listing, and publishes no licence text and no
copyright notice anywhere. So MIT's notice condition cannot be discharged from
upstream material as it stands, nothing may be copied from it, and a line-level
audit shows nothing has been. The answer, the evidence, the reuse rule, the
credit paragraph and every command needed to recheck it are in
`docs/upstream-licensing.md`. `SCOPE.md` and `README.md` point at it. **Do not
reopen this, and copy no upstream source.**

**One question `L1` deliberately left open belongs to the user, not to an
increment: whether this project should carry a licence of its own.** The
repository is public and has no `LICENSE` file, so default copyright applies and
nobody may reuse it, which may be exactly right for a personal tool. **Do not
add a `LICENSE` file, and do not decide this, unless the user says so.**

**The port is feature-complete for v1.** Every must-have and every
costly-to-lose item in `SCOPE.md` is delivered. The user's direction, given after
#19 merged, is that the project had grown far past the effort its goal justified.
**Do not invent an increment, and treat a new feature idea as out of scope unless
the user asks for it.** Finishing is the work now.

## `D1` is the only increment left, and it is yours

**Take `D1`. Land it on its own branch and pull request, and stop.** The
roadmap's "Exact next increment" section is the authoritative version of this.

Document configuration, modes, incomplete coverage, cancellation, publication,
the cache and safeguards with reproducible end-to-end examples. `README.md` is
103903 bytes and is the one root file discovery still skips for size, exactly as
`ROADMAP.md` was before `A1`, so `D1` should shorten it at least as much as it
extends it. Its safeguard-discovery example still uses `Skipped: ROADMAP.md
(exceeds 65536 bytes)` to illustrate a skipped file, which no longer describes
this checkout; replace that line.

`D1` must also fix one recorded wording defect: `reviewPrompt` in `review.mjs`
tells every specialist its working directory is "verified to be at" the reviewed
head, which stays true of `HEAD` after a safeguard runs but not of the working
tree. That is a change under `extensions/`, so **`D1`'s pull request needs an
installed-plugin review whatever else it contains.**

Before you "fix" that wording into something stronger: **re-asserting checkout
cleanliness after execution is refused and must stay refused.** `SCOPE.md` says
these commands may create artifacts and forbids cleaning the checkout, so a
re-assertion would refuse a review because the person's own approved tests wrote
a coverage file. The inaccuracy is contained already: `boundCitation` in
`findings.mjs` resolves every citation against the head and base blobs fetched
from GitHub, so a reviewer can read a file a safeguard wrote and can never cite
one. Fix the sentence, not the gate.

### `D1` carries the last live-evidence opportunity, and only a human can spend it

**Run `D1`'s review with `--verify`, and approve `node
scripts/smoke-safeguards.mjs` when the host's approval UI asks.** Safeguard
execution has never run under the installed plugin: a non-empty `accept`, a real
spawn, a real capture, a real artifact line and a real cancellation are all
demonstrated only by the controlled suites. That suite finishes in well under a
second and leaves the checkout clean, so the artifact line should say the
checkout is unchanged.

**The agent cannot do this part.** `scripts/dogfood-review.mjs` registers no
elicitation handler and answers every permission request with
`denied-no-approval-rule`, so it reports approval `unavailable` and can never
approve or execute. That is deliberate: its safety value is precisely that it has
none, and teaching it a handler was refused when `V2a` considered it. **So the
one authorized `D1` review must be typed by the user in an interactive Copilot
session**, as #19's was:

    /pr-review NUMBER --balanced --verify --all --no-comment

Ask the user to run it and paste the result back. A live refusal from the
exclusion table cannot be arranged deliberately, because what a discovery pass
reports is not ours to choose.

## What #23's review demonstrated, and what to expect from yours

The user authorized one balanced review of #23. It cost **137.46398 AI credits**
across six completed sessions, four heavy specialists and the adjudicator on
`gpt-5.6-terra` at reasoning `high` and the overview on `gpt-5.6-luna` at `high`,
with no fallback configured. It returned **0 validated findings on incomplete
coverage**, which is not a clean-review claim and is not recorded as one.

**Every reviewer completed, and the evidence gate discarded every candidate**,
almost all with `Citation does not exactly match a supplied context window`. The
cause was one habit: **the reviewers quoted this repository's own markdown with
the link syntax stripped**, citing `docs/upstream-licensing.md` where the file
says `[docs/upstream-licensing.md](docs/upstream-licensing.md)`. The gate behaved
exactly as `Q4` and `C5` specify, on reviewer error rather than a tool defect.

**Expect the same on a documentation-heavy pull request, and do not treat it as a
defect to fix.** Read the discarded candidates anyway: on #23 six were produced
and most described real defects, which were fixed on the branch rather than
dismissed, the same course `V2a` took. Two were wrong, and the entry says which
and why. Zero findings is never a clean review.

## Before you write a roadmap entry, check the arithmetic again

`ROADMAP.md` has **16283 bytes spare** against the 65536-byte
`instructionFileMaxBytes` cap. The `A1` entry is 7086 bytes and the `L1` entry is
14359. `D1`'s entry will carry a full review record like `L1`'s, so **plan to
archive `A1`, and probably `L1` too, into `docs/roadmap-archive-2026-09-10.md`
before you write it**, leaving the same kind of pointer those increments left.

No size check enforces any of it. Run `wc -c ROADMAP.md` before opening a pull
request and treat 65536 as the number that matters. The `A1` and `L1` entries
each record their own measured sizes; if you edit one, re-settle those figures or
delete them rather than leaving them wrong. `A1`'s figures are already labelled
as measured at `A1` rather than current.

## Validation and runtime caveats

The **thirteen** controlled suites (`node scripts/smoke-<name>.mjs`) are
findings, review, selection, retention, preview, publication, publish-later,
checkout, config, context, fixture, target and safeguards. They require no
inference and no network. All thirteen pass at this handoff. `git diff --check`
is clean and the branch diff carries no control byte.

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

It should read `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md` and
`SCOPE.md`, and skip only `README.md`. If it starts skipping another file, that
file has crossed 65536 bytes.

**The plugin is now installed on this machine from this checkout.** It was not
installed at all before `L1`; `copilot plugin list` showed only unrelated
plugins, and `copilot plugin install "$(pwd)"` was run as the documented
prerequisite for the review. **Rerun that install whenever the checkout changes**,
or a review or probe measures the previous build. CLI 1.0.83 warns that direct
local installs are deprecated for a future release.

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
real file; neither `A1` nor `L1` could have weakened it and neither should you.

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
must be run and reported for any increment touching `read-only.mjs`. `V2a`,
`V2b`, `A1` and `L1` did not touch it. Reviewer confinement is unchanged, and
execution is a separate path no reviewer can reach.

Both no-inference runtime probes passed before `V1b` and **have not been rerun
since**. They spend no credits but need a live runtime connection:

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
moved or edited in this session, and the review read it: the personal store
currently sets `heavyModel=gpt-5.6-terra`, `lightModel=gpt-5.6-luna`,
`mediumModel=claude-sonnet-5` with efforts high, high and medium.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows.

The review output is very verbose, and the user has asked for a way to quieten
it. Nothing is designed and nothing is scheduled. It is a plausible part of `D1`
if the user wants it; do not start it on your own.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. **The standing workflow authorizes exactly one review per
increment pull request and nothing else.** `D1` changes `extensions/`, so its
review is required rather than optional, but it is still one review, and any
rerun or extra probe needs a fresh explicit instruction. Keep findings local: no
`--comment` and no publish without a new explicit instruction. Merging remains
the user's decision. Preserve unrelated changes. Inspect enumerations and counts
when extending a concept. Update `README.md` for user-visible behaviour.

**Reconcile the roadmap's own handoff text before you finish.** #18's overview
reviewer found the exact-next-increment section still naming the increment that
had just been completed, and #23's overview reviewer found the `L1` row promising
a pull-request record that did not exist yet. Recording a completed entry is only
half of it. When `D1` lands, v1 is done, and what remains open is a set of
limitations to state in release notes rather than work to schedule.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
