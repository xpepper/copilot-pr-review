# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed.

Every completed entry through `G1` is in
`docs/roadmap-archive-2026-09-10.md`, which you need only for an older
increment's evidence. The `--verify` guide is in `docs/safeguards.md`, the
re-review guide in `docs/re-review.md`, the previous README in
`docs/readme-archive-2026-09-10.md`, and the comparison against the field in
`docs/gap-analysis.md`.

## Your job this session is `B1`, and only `B1`

**`T1` is complete.** The backlog the user agreed on 2026-09-12 is `T1`, `B1`,
`W1`, `N1`, `H1`, `K1`, in that order. `T1` was the first and its entry is the
only live one in `ROADMAP.md`. **`B1` is next. Take it and nothing else.**

**`B1`: a review that could not look closely at the whole pull request says
which parts it skimmed, as a coverage gap rather than as silence.**

- **The honesty half only.** No size-triggered transport: the diff stays
  embedded, reviewer count is unchanged, and citations stay bound to the
  captured diff and context windows. **Do not widen this on your own
  judgement.** Upstream answers the same problem with a transport and the user
  explicitly did not schedule one.
- **It needs no scope decision.** `ROADMAP.md` records that `B1` and `N1` fit
  `SCOPE.md` as written, because the absence of a large-diff path is an absence
  rather than a decision. `W1`, `H1` and `K1` each need one; `B1` does not.
- `E1`'s review of 1427 changed lines over 16 files worked, and nothing has
  established where this stops working.
- It changes behaviour, so it needs its own branch, its own pull request, and
  **one plugin review as its verification of record**. That review spends real
  credits. **Ask; do not spend by default.**

### What is scheduled after `B1`, so you can recognise scope creep

Do not start any of these: `W1` a remediation sentence on every finding, `N1` a
seeded corpus and deterministic scorer, `H1` opt-in project standards steering
the review, `K1` a feedback channel on a published review. `ROADMAP.md` carries
the acceptance criteria for each. `W1` takes no committable suggestion block.
`N1` takes neither the collection runs that spend credits nor a baseline gate.

**Six of `G1`'s twelve were declined**, each put to the user on its own, and are
in `ROADMAP.md` under "Recorded, not scheduled" with the reason. **Declined is
not deferred-until-you-feel-like-it**, and `docs/gap-analysis.md` is not an
authorization: **`G1`'s ranking and its five-stage sequence did not survive the
triage.**

## What `T1` did, and the three things it left open

A finished review prints one line beside its coverage. This is the live line
from its own review of #37:

```text
Review cost: 64.24808 AI credits over 5 request(s); 72.9 s of model work in 2 pass(es); 91.0 s elapsed.
```

`extensions/pr-review/cost.mjs` is the whole of it, plus a collector in
`executeReviewRun`. **Four stages start a model pass and only two put their
reviewers on the outcome**, so charges are collected where passes are started,
not where they are retained. **If you add a fifth stage that starts a model
pass, route it through `payFor` or the run under-reports**, and
`scripts/smoke-cost.mjs` asserts that in source.

Three things about it are settled and should not be relitigated:

- **The cost line is not part of `formatCoverage`**, because `preview.mjs`
  embeds that text in the body it publishes to GitHub. A spend must never be
  posted to a pull request. Two suites assert the separation.
- **`--quiet` does not suppress it**, per `O1`.
- **An elapsed figure is a report, never a deadline.** `SCOPE.md` still forbids
  review timeouts and nothing reads either figure.

Left open, recorded in `ROADMAP.md` rather than fixed:

- **The revalidation pass still has no end-to-end run in any suite.** Its charge
  collection is covered by a source-shape assertion, not by a run.
- **`scripts/runtime-quick.mjs` still computes a narrower cost total of its
  own**, the way `dogfood-review.mjs` did before `T1`. It is a live probe that
  spends inference, so it was left rather than changed unverified.
- **A retained result does not carry what its run cost**, so `/pr-review
  inspect` and `/pr-review publish` say nothing about the spend they replay.
  Keeping the figures out avoided a schema version.

## Headroom: `ROADMAP.md` is now the tight one

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and the tool can no longer read its own project. **CI fails the build
if any root file crosses the cap.**

- **`ROADMAP.md` has 1313 bytes spare**, which is less than any increment entry
  ever written here. **Archive `T1`'s entry before you write a word of `B1`'s**,
  the way every recent increment has: move it verbatim into
  `docs/roadmap-archive-2026-09-10.md` with the same kind of pointer, never
  rewritten or condensed. One live entry is where that rule lands.
- **`README.md` has 7630 bytes spare.** `T1`'s session solved that first, in its
  own documentation-only pull request #36, which moved the four re-review
  sections to `docs/re-review.md` and took the file from 63865 to 55675 bytes.
  The user merged it without a plugin review, as they had #30. **Housekeeping is
  worth its own pull request and worth agreeing with the user first.**
- Measure with `wc -c` and run the collector check below before opening a pull
  request. A file in the skipped list has crossed 65536.

## Validation and runtime caveats

The **seventeen** controlled suites (`node scripts/smoke-<name>.mjs`) are
findings, review, selection, retention, preview, publication, publish-later,
checkout, config, context, fixture, target, safeguards, prior, incremental,
revalidation and **cost**, which `T1` added. They need no inference and no
network, and all seventeen pass at this handoff. `git diff --check` is clean and
no tracked text carries a control byte.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost; do node scripts/smoke-$s.mjs; done
```

**GitHub Actions runs that same loop on every pull request and every push to
`main`**, in `.github/workflows/ci.yml`, with the two invariants this repository
has broken before: that the tool can still read its own instruction files, and
that no tracked text carries a control byte. It needs no secret and no
dependency install, **it is not a substitute for running the suites locally
before a checkpoint commit**, and it deliberately runs nothing that spends
Copilot credits. A red run is a real failure; do not rerun it hoping for green.

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
listing was denied, and files the session had not already opened became
unreadable even through the Read tool. A later `cd` back was stripped from the
command, so it could not be corrected from inside. **Starting a fresh session
cleared it and nothing was lost.** Use the scratchpad by absolute path instead.

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
are deprecated for a future release. **This worked cleanly for `T1`'s review.**

**If you cannot type a Copilot slash command, dispatch it through the SDK** with
`node scripts/dogfood-review.mjs NUMBER --deep --all --no-comment --unattended`.
**That runner asserts two environment variables before it does anything**, and
gives an assertion failure rather than a usage message if they are missing:

```sh
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
```

It requires `--all` and `--unattended`, refuses `--comment` and `--quiet`,
asserts a clean tree at the pull request head, and **now prints the run's own
cost line rather than recomputing a narrower total**.
`PR_REVIEW_DOGFOOD_REPOSITORY` retargets it. `copilot -p "/pr-review N"` is not a
substitute: prompt mode starts an ambient model turn instead of dispatching.

**Run the review as a background process and block on the process itself.**
`T1`'s took 91 seconds of a quiet timeline and printed four `active` lines.
**Never add a timeout**, and a quiet timeline is not a hang. An agent that
mistakes its own elapsed sleeps for the review's will report a hang that is not
there. The evidence lines are very long, so grep them narrowly or you will pull
half a megabyte of JSON into your own context. A reviewer's own tool calls and
denials are in the run's `M2 evidence` line under `reviewers[].policy`.

**Request GitHub's own Copilot reviewer too. It is free, and on `T1` it found
the same defect the plugin review did, independently.** `gh pr edit --add-reviewer
copilot` fails with "Could not resolve user"; it is a bot and needs GraphQL:

```sh
PR_ID=$(gh api graphql -f query='query { repository(owner:"xpepper",name:"copilot-pr-review"){ pullRequest(number:NN){ id } } }' --jq '.data.repository.pullRequest.id')
gh api graphql -f query='mutation($pr: ID!, $bot: ID!) { requestReviews(input: { pullRequestId: $pr, botIds: [$bot], union: true }) { clientMutationId } }' -f pr="$PR_ID" -f bot="BOT_kgDOCnlnWA"
```

It posts publicly on this repository, so **it is the user's call**. Treat what it
leaves like any other reviewer: **check the premise of a finding before
implementing it.** On `T1` three of its points were right and one restated the
plugin review's.

`node scripts/smoke-runtime.mjs --targets` **has not been run since `I1b`**,
where it passed with 75 assertions. `I1c` added four and `T1` added two, both
without running them, so **the expected count is 81 and that is still
unverified.** It spends no credits but needs a live runtime connection. **Do not
run it while a review is in flight**: a concurrent `copilot` process is the most
likely cause of `D1`'s vanished install.

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the seventeen,
must be run and reported for any increment touching `read-only.mjs`. Nothing
since `V2a` has touched it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`. `T1` did not move or edit it.

**Press Space on the command before pressing Enter** in any `--verify` run, in
finding selection, and in the reply confirmation. The host's multi-select toggles
only on Space; Enter on a merely highlighted option submits the empty default.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence. **`G1`
read upstream's deadline machinery in full and it is an argument for this refusal,
not against it.** **`T1`'s elapsed figures are reports about a finished run.
Nothing reads them and nothing may start to.**

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
**That limit is what `B1` reports honestly and does not fix.**

## Settled decisions, none of which is to be reopened

- **The triage of 2026-09-12 is settled.** Six scheduled, six declined, in the
  order and under the IDs the user chose. **Do not re-triage, re-rank or
  re-argue it**, and do not promote a declined item because the document ranks
  it highly.
- **`T1` is closed.** Both elapsed figures, every paid pass counted, an
  unreported charge left unavailable rather than summed, the line kept out of
  the published body and out of `--quiet`'s reach. Its `SCOPE.md` sentence was
  approved as exact wording before the file was edited.
- **`I1c`'s six decisions stand**, as recorded in its archived entry. **Upstream's
  convergence does not reopen them.**
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
- **`L1` is closed**, and it binds every adopted item in the backlog: `H1`, `N1`
  and the rest are re-implemented from behaviour, never copied.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s two remaining items are recorded limitations**: truncated evidence
  lines and silent per-reviewer progress. Its third was `T1` and is now closed.

## State at this handoff

**`T1` is on branch `t1-run-cost-report` and pull request #37**, in four
commits: the `SCOPE.md` sentence, the implementation, the fix for the defect its
own review found, and the roadmap. This handoff commit goes on top. Confirm that
from git rather than from this sentence.

**#36 is merged** as `09d8cdf`, so `main` already carries the README headroom.

**#37 has not been merged at this handoff.** Merging is the user's decision.
**It was reviewed once with this plugin at the user's explicit authorization**,
deep on `gpt-5.6-terra` at high effort, 64.24808 credits, completed coverage,
one validated finding that was real and is fixed on the branch. GitHub's own
reviewer was also requested, at the user's authorization, and left four points
of which three were right and are answered on the branch. **The standing
workflow authorizes exactly one plugin review per pull request and nothing
else**; any rerun or extra probe that spends credits needs a fresh explicit
instruction. No finding has been posted: no `--comment`, no publish.

**Neither `I1b` nor `I1c` has live evidence, and both are blocked on the same
thing**: a pull request this tool has published a review on and that has since
moved. The only two published reviews are on playground pull requests still at
the head they evaluated. Arranging one means publishing a real review or pushing
a commit to a playground branch. **Both are the user's call, and playground #1
and #2 must never be merged.**

If you land anything: follow `AGENTS.md`, with meaningful validated checkpoint
commits, a named branch and pull request, no direct `main` push, and no
force-push or amended published history. Keep findings local. Update `README.md`
for user-visible behaviour, and check its headroom before you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
