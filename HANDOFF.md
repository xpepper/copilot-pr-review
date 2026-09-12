# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed.

Completed entries through `I1c` are in `docs/roadmap-archive-2026-09-10.md`,
which you need only for an older increment's evidence. The `--verify` guide is
in `docs/safeguards.md`, the previous README in
`docs/readme-archive-2026-09-10.md`.

## Your job this session is to agree a backlog, not to build one

**`G1` is merged and every increment the user scheduled is complete.** The queue
is empty on purpose. `G1`'s output, `docs/gap-analysis.md`, proposes twelve
adoptions ranked against the field, with a five-stage sequence, and says in its
own opening that every one is a scope decision for the user.

**The user has asked to review that plan and pick what is worth building.** That
is this session's work:

1. **Read `docs/gap-analysis.md` in full first.** It is 35 KB and it is the whole
   basis of the conversation you are about to have. Do not triage from the
   summary below; it exists so you know what is coming, not so you can skip the
   evidence.
2. **Put the items to the user one at a time**, with a recommendation and the
   alternatives, smallest viable step first. Do not present a combined wall of
   twelve. Batching them is how this goes wrong.
3. **Record what the user decides** in `ROADMAP.md`'s increments table as
   `Pending` rows, with IDs agreed with the user, and rewrite the closing
   section, which currently says there is no next increment. **That is the
   deliverable.**
4. **Then ask whether to start the first agreed increment in this same session.**
   Do not assume either answer. `U1`, `I1a`, `I1b` and `I1c` each decided with
   the user and then built in one session, so building is the pattern; an empty
   queue being refilled is not, so ask.

**Triage itself is not a numbered increment.** It is a substantive planning
outcome, which `AGENTS.md` authorizes committing, the way the CI pipeline landed
without a roadmap row. It still lands on a branch and a pull request, because the
`main` ruleset admits no exception.

### The user's steers so far, which are decisions and not suggestions

- **Item 1, redacting a credential before publication, is a nice-to-have and
  moves later in the backlog.** The user said so explicitly when merging #33.
  `G1` ranked it first; **the user has overruled that ranking and it is not to be
  argued back to the top.** It stays recorded as open in `ROADMAP.md` under
  "Recorded, not scheduled" and in `README.md` under limits, which is where a
  deferred item belongs. Offer it in its new place; do not lead with it.
- **The proposal is a menu, not a plan.** `G1`'s five-stage sequence is one
  agent's ordering and carries no authority. If the user's ordering differs,
  the user's ordering wins and the document's stays as the record of what was
  argued at the time.

### The twelve, in `G1`'s order, so you know the shape

Read the document for the evidence behind each. `Scope` says whether it fits
`SCOPE.md` as written or needs a scope decision from the user.

| # | Item | Scope |
|---|---|---|
| 1 | Redact credential-shaped text before publication. **User has deferred this.** | Fits |
| 2 | Report what a run cost and how long it took | Small decision |
| 3 | Skip the reviewers when nothing has moved, on a `same-head` re-review | Fits |
| 4 | Let the project's own standards steer the review | Decision |
| 5 | Measure recall and precision against a seeded corpus | Fits |
| 6 | Decide the default mode on evidence. **Blocked on 5** | Decision |
| 7 | Add the history lenses: git blame, comments on earlier pull requests | Decision |
| 8 | Fire reviewers on what the diff actually touched | Decision |
| 9 | Give findings somewhere to go next: a remediation sentence | Decision |
| 10 | Anchor findings that land outside the diff | Decision |
| 11 | Handle a large diff as a large diff | Fits |
| 12 | Ask what the review found useful | Decision |

**Two would change `SCOPE.md`'s settled text**: item 6, because `SCOPE.md` fixes
balanced as the default, and item 2, because `SCOPE.md` defers timing and usage
reports. A `SCOPE.md` edit is the user's decision and nobody else's.

**Items 4, 7 and 8 are one question wearing three hats.** All three widen what a
reviewer may consider beyond the diff and its bound source, and all three raise
the same problem: what evidence a claim not grounded in provable code effect must
carry. Answering it once is much cheaper than answering it three times. Put them
to the user together for that reason, as one decision with three parts, rather
than as three separate ones.

**Item 5 is the long pole and unblocks item 6.** Its collection runs cost real
credits, so each would be an explicit authorization exactly like a pull-request
review. Its corpus and scorer cost nothing and belong in the existing suite.

## What `G1` established, and what stays settled

`G1` read ten sources at the user's choice of the widest sweep, and copied
nothing. **`L1`'s rule bound it and binds you: read them, copy nothing**;
anything adopted is adopted as behaviour and re-implemented here.

- **Upstream has converged on `I1a` through `I1c`**, shipping incremental
  re-review with the same four head relationships and the same three
  prior-finding verdicts this project reached independently. **That is
  corroboration, not an instruction to change anything.** `I1c`'s six decisions
  stay settled, including where upstream chose differently.
- **The field's dominant complaint is false positives**, at 40 to 70 per cent
  among leading agents. That is the axis this tool is built on and it has never
  measured itself on it. Item 5 is the answer and it is unscheduled.
- **Upstream's own numbers put this project's default in question.** Over 72
  runs, deep matched the best recall in every band, produced no false positive,
  left every clean control alone and was no slower at the median than the
  five-reviewer default. Upstream labels these diagnostic and accepted no gate,
  so **this is a question raised, not a default refuted.** `SCOPE.md` fixes
  balanced and nothing has changed it.
- **No reviewer is told this project's conventions.** `--verify` collects the
  checkout's instruction files for safeguard discovery and `review.mjs` hands
  them to no reviewer. Four independent tools in the field steer reviews with the
  project's own written standards. That is item 4.
- **A reviewer can publish a credential it found.** No redaction exists anywhere.
  Deferred by the user, recorded in both files, and still true.

## Headroom first: `README.md` is the tight one now

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and the tool can no longer read its own project. **`README.md` has
1785 bytes spare and `ROADMAP.md` has 7872.** **CI fails the build if any root
file crosses the cap.**

- **`README.md` is the binding constraint.** 1785 bytes is less than one
  paragraph. **The next increment that changes user-visible behaviour has to
  solve that before it can document it.** Its escape is `docs/`, which discovery
  does not recurse into: `D1` moved the old README there and `I1b` moved the
  12922-byte `--verify` section to `docs/safeguards.md` in its own
  documentation-only pull request, #30, which the user merged without a plugin
  review. **Housekeeping is worth its own pull request, and it is worth agreeing
  with the user first.** Do not start it unasked.
- **`ROADMAP.md`'s escape is archiving.** `G1`'s live entry is **8864 bytes** and
  is the only completed entry left. Adding `Pending` rows is cheap, a completed
  entry is not. If a later entry does not fit the spare, archive `G1`'s verbatim,
  with the same kind of pointer, not rewritten or condensed. **One live completed
  entry rather than two is where that rule lands.**
- Measure with `wc -c` and run the collector check below before opening a pull
  request. A file that appears in the skipped list has crossed 65536.

## Validation and runtime caveats

The **sixteen** controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture, target, safeguards, prior, incremental and
revalidation. They need no inference and no network, and all sixteen pass at
this handoff. `git diff --check` is clean and no tracked text carries a control
byte.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation; do node scripts/smoke-$s.mjs; done
```

**GitHub Actions runs that same loop on every pull request and every push to
`main`**, in `.github/workflows/ci.yml`, with the two invariants this repository
has broken before: that the tool can still read its own instruction files, and
that no tracked text carries a control byte. **It went green on #33.** It needs
no secret and no dependency install, **it is not a substitute for running the
suites locally before a checkpoint commit**, and it deliberately runs nothing
that spends Copilot credits. A red run is a real failure; do not rerun it hoping
for green.

This cheap check runs the real discovery collector against this checkout and
tells you which of your own files the tool can read:

```sh
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

**It should read all six root files and skip none.**

**Do not `cd` out of the working directory in a Bash call.** During `G1` one call
began `cd /tmp && gh api ...` to keep scratch work out of the tree. The harness
reset the shell's directory and the sandbox narrowed to a per-file allowlist:
`git` and `node` failed with `Operation not permitted` on `getcwd`, directory
listing of the project and of `docs/` was denied, and files the session had not
already opened became unreadable even through the Read tool. A later `cd` back
was stripped from the command, so it could not be corrected from inside, and
disabling the sandbox changed nothing. **Starting a fresh session cleared it and
nothing was lost.** Use the scratchpad by absolute path instead of changing
directory.

**Reinstall the plugin before every review, and verify it.** #32's second review
found the installed copy stale by exactly the four files its own fixes had
touched, so the first review had reviewed code that was no longer there.
**Check out first, then install, never the other way round**, and prove it:

```sh
copilot plugin install "$(pwd)"
diff -rq ~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review \
  extensions/pr-review   # expect no output
```

Run `copilot plugin list` immediately before dispatching as well. During `D1` an
install that had reported success was gone minutes later, most likely clobbered
by a concurrent `copilot` process. CLI 1.0.83 warns that direct local installs
are deprecated for a future release.

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
It passes every other flag straight through, so `--incremental` and
`--revalidate` both reach it.

**A review takes minutes of wall time and prints almost nothing while it runs.**
#32's second reviewer printed eleven `active` lines over 137 seconds and nothing
else. If you poll for completion, block on the process itself rather than timing
your own waits; an agent that mistakes its own elapsed sleeps for the review's
can report a hang that is not there. **Never add a timeout**, and a quiet
timeline is not a hang. The evidence lines are very long, so grep them narrowly
or you will pull half a megabyte of JSON into your own context. A reviewer's own
tool calls and denials are in the run's `M2 evidence` line under
`reviewers[].policy`.

`node scripts/smoke-runtime.mjs --targets` **has not been run since `I1b`**,
where it passed with 75 assertions. `I1c` added four without running them, so
**the expected count is 79 and that is still unverified.** `G1` changed no string
and added none. It spends no credits but needs a live runtime connection. If you
change a `help` or `status` string, change the probe with it.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the sixteen,
must be run and reported for any increment touching `read-only.mjs`. Nothing
since `V2a` has touched it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. It was not moved or edited during
`G1`, which ran no review at all.

**Press Space on the command before pressing Enter** in any `--verify` run, in
finding selection, and in the reply confirmation. The host's multi-select toggles
only on Space; Enter on a merely highlighted option submits the empty default.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence. **`G1`
read upstream's deadline machinery in full and it is an argument for this refusal,
not against it**: several hundred lines of interacting budgets, reserves, grace
periods and truncation rules, with its own validation ranges and failure
taxonomy, to answer a question this tool answers by waiting.

**Do not weaken the shell gate.** A project that declares `npm run lint && npm
test` gets a refusal, and the answer is for that project to declare two lines.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop a refusal from saying where a symlink points.

**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**
`safeguards.mjs` shares it as `unwrapEnvelope` from `findings.mjs`.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned, so a pinned path silently drives a stale SDK. **Do not revisit Agent
Factories without a new CLI version**; three blockers were demonstrated on
1.0.83 and all three would have to change.

Cold resume of command-only records remains unsupported. Citations remain limited
to captured diff and context windows, which produced #32's second coverage gap.
**Upstream answers this with a size-triggered transport**, which is item 11.

## Settled decisions, none of which is to be reopened

- **`I1c`'s six decisions stand**, as recorded in its archived entry: the hybrid
  verdict, the free half in every review with the model pass behind
  `--revalidate`, replies on threads rather than a line in the review body, both
  halves in one increment, the review's own posting authority, and skipping a
  thread already answered at this head. **Upstream's convergence does not reopen
  them.**
- **Code proves that a finding still stands and never that it has gone away.** A
  `decidedBy: "code"` entry claiming `resolved` is refused.
- **An unknown write outcome stops the reply set.** A definite rejection does
  not. **Do not add a retry.** The retained journal is a record, never a resume
  point.
- **A reply must never come back as a finding or as a review this tool wrote.**
  Both exclusions are asserted in `scripts/smoke-revalidation.mjs`; keep both.
- **`/pr-review publish` answers no thread**, deliberately.
- **`I1b` is opt-in and stays opt-in**, and a confined run's confinement is a
  caveat, never a coverage gap.
- **`I1a`'s slicing is settled and is not to be re-cut.**
- **A rewound head is `diverged`.** An unreachable head is `unknown`.
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present.
- **`U1` is closed and its shape is not to be widened.** Posting authority still
  never authorizes safeguard execution.
- **`L1` is closed**, and it bound `G1` absolutely. Nothing may be copied and a
  line-level audit shows none has been.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s three unfixed items are recorded limitations.** `G1` ranked two of
  them in its menu and neither became scheduled by that.

## State at this handoff

**`G1` is complete and pull request #33 is merged into `main`** as `eb06078`,
two commits on branch `g1-gap-analysis`. Confirm that from git rather than from
this sentence, and reconcile anything that disagrees. **Start from a fresh branch
off `main`.**

**#33 was never reviewed with this plugin.** It was documentation-only, so
`AGENTS.md` left that review to the user, and the user merged without one. **No
credits were spent during `G1` at all.** CI went green on both its commits.

**Neither `I1b` nor `I1c` has live evidence, and both are blocked on the same
thing**: a pull request this tool has published a review on and that has since
moved. The only two published reviews are on playground pull requests still at
the head they evaluated. Arranging one means publishing a real review or pushing
a commit to a playground branch. **Both are the user's call, and playground #1
and #2 must never be merged.**

**GitHub's own Copilot reviewer is slower than the plugin review but free**, and
on #31 it found three things the plugin review and every suite had missed. **It
reviews only when it is requested**, and it was not requested on #32 or #33.
Consider requesting it on your own pull request, and treat what it leaves like
any other reviewer: **check the premise of a finding before implementing it.**

If you land anything: follow `AGENTS.md`, with meaningful validated checkpoint
commits, a named branch and pull request, no direct `main` push, and no
force-push or amended published history. **The standing workflow authorizes
exactly one plugin review per pull request and nothing else**; any rerun or extra
probe that spends credits needs a fresh explicit instruction. Keep findings
local: no `--comment` and no publish without one. Update `README.md` for
user-visible behaviour, and solve its 1785 bytes of headroom before you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
