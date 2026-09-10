# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md). Completed entries through `V1c` were moved verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) by
`A1`, so this file keeps the increments table, the two most recent completed
entries and the next increment, and stays small enough for this project's own
safeguard discovery to read.

**Since 2026-09-07, every increment lands on a branch and a pull request that is
reviewed with this plugin, and that review is the increment's real integration
test.** Controlled suites use test doubles and prove logic only; the pull-request
review exercises the installed plugin, the real runtime, real models, real `gh`
requests, the real revision gate and real confined reads. An increment is not
demonstrated until that has run once and its evidence is recorded here. `main` carries a repository ruleset requiring a pull
request with zero approving reviews and no bypass actors, so nobody pushes to it
directly. Each increment's entry below must record its pull request and the
outcome of reviewing it with the tool: mode, model and effort actually used,
coverage, findings and withheld findings, reported credit cost, and what changed
in response. The tool emits only `COMMENT` reviews, so its review never satisfies
an approval requirement, and findings stay local unless the user authorizes
posting them.

## Increments

| ID | Status | Independently demonstrable outcome | Requirements / dependencies |
| --- | --- | --- | --- |
| S0 | Completed | Confirmed product specification recorded in `SCOPE.md`, commit `6407a59`. | [Goal](SCOPE.md#goal) |
| L1 | Pending | Resolve applicable upstream licensing and attribution; record what can be reused. No upstream source reuse until resolved. Original prototypes need not wait. | [Upstream baseline](SCOPE.md#upstream-baseline) |
| F1 | Completed | Locally installable plugin with a code-owned, usable status/help entry point; runtime evidence and reproduction below. | [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F2 | Completed | Two concurrent reviewers over a tiny original local fixture; distinct explicitly configured subscription models and reasoning levels; display assignments, per-reviewer progress, and results. | F1; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F3 | Completed | Native forbidden-tool denials plus an adversarial fixture; retained incomplete coverage; startup/active/unresponsive cancellation and owned-runtime/extension/parent loss exercised with process-exit evidence. Stdio integration selected; limits below. | F2; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F4 | Completed | A reviewer child session can be granted an exact read-only built-in subset (`view`, `grep`, `glob`) while write/exec tools stay natively refused, reads are confined to a chosen directory by the permission handler, and the grant does not leak. Evidence below. | F3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| Q1 | Completed | Read-only code-owned PR capture with repository/head-bound snapshot, skip/override/confirmation gates, consistency guards, and installed-plugin controlled/live evidence below. | F3; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q2 | Completed | Source context bound to the captured head/base revisions with blob-verified provenance; local-checkout, moved-head, and inconsistent source refused. Evidence below. | Q1; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q3 | Completed | Three concurrent quick specialists consume bound PR input; explicit/ambient assignments, alias, incomplete coverage, and cancellation demonstrated below. Candidates remain unvalidated. | Q2; [Modes](SCOPE.md#review-modes-and-findings) |
| Q4 | Completed | Strict evidence/whole-claim gates, isolated adjudication, deduplication and degraded findings; positive controlled and real-PR installed-plugin inference demonstrated below. | Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| P1 | Completed | Invocation-bound validated finding selection via native elicitation or `--all`; subset/none/cancellation, invalid-answer rejection and no-UI behavior demonstrated below. No writes/cache. | Q4; [Selection/publication](SCOPE.md#selection-publication-and-cached-results) |
| P2 | Completed | Retain the latest settled quick result in its originating local session; inspect without inference/GitHub access. Reload and conversation-backed cold resume demonstrated; command-only resume caveat below. | P1; [Cached results](SCOPE.md#selection-publication-and-cached-results) |
| P3 | Completed | Independent posting authority, explicit confirmation and code-built COMMENT payload preview; native cancellation/reload/resume and no-submission evidence below. | P1; [Publication controls](SCOPE.md#selection-publication-and-cached-results) |
| P4 | Completed | Current-run COMMENT publication with fresh gates and durable uncertainty; nine native cases, reload/cold resume and real playground inline publication demonstrated below. | P3; [Publication gates](SCOPE.md#selection-publication-and-cached-results) |
| P5 | Completed | Explicit publish-later of the retained selection without rerunning reviewers; refetched evidence, fresh gates, version-4 authority, seven native cases and a real playground publication demonstrated below. | P2, P4; [Cached publication](SCOPE.md#selection-publication-and-cached-results) |
| C1 | Completed | Personal light/medium/heavy tier configuration and `autoPostReviews` inspected and updated by `/pr-review-config`; validated capabilities, nearest-tier/ambient inheritance, flag precedence and effective-assignment display demonstrated below. | F3; [Configuration](SCOPE.md#models-configuration-and-execution) |
| C2 | Completed | Explicit per-directory trust gates `.copilot/pr-review/config.json` overrides; untrusted files ignored unparsed, self-trust impossible, precedence and revocation demonstrated below. | C1; [Configuration trust](SCOPE.md#models-configuration-and-execution) |
| R1 | Completed | Verified-checkout reads and matching-head harnesses demonstrated. One authorized live quick review used unchanged source without denials; prior coverage gaps disappeared, but no additional finding was produced. GPT's `rg` alias is supported without widening the grant. | F4, Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| M1 | Completed | Balanced is the default with its four heavy specialists, light overview reviewer and three-finding P3/nit cap. `--full` adds a medium conventions/maintainability reviewer and presents every qualifying severity with no minor cap. Demonstrated by controlled probes, no-inference installed dispatch, and live reviews of this repository's own pull requests #3, #4 and #5; #5 ran all three tiers on distinct models. A Claude-family medium model's fenced output is a recorded open defect. | Q4, C1; [Modes](SCOPE.md#review-modes-and-findings) |
| F5 | Completed | Structured output is demonstrated unusable on CLI 1.0.83: the factory surface is behind a CLI feature flag and reachable only from a joined foreground session, a joining extension cannot register the permission handler that confines reviewer reads, and a custom agent's declared `view`/`grep`/`glob` grant leaks `skill` and `sql`. Retry cost, `null` failure semantics and module reach measured below. Recommendation recorded: fall back to a narrow fence unwrap, with its cost stated and the choice left to the user. No reviewer was migrated. | M1, F3; [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F6 | Completed | Reviewer output survives a model that wraps it. Reviewers and the adjudicator are asked for the envelope between two explicit markers, and code unwraps that delimiter pair, then one fence that wraps the whole response; markers and fences count only when they are the whole line, so payload text is never a wrapper. Everything after the parse is unchanged, and a table below pins what is still discarded whole. Demonstrated by the full-mode review of pull request #7, which discarded four reviewers on a substring-counting defect it also reported; that defect is fixed and the captured outputs replayed. | F5; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| M2 | Completed | `--deep` runs one integrated heavy reviewer over the whole pull request and presents every substantiated severity; a second mode flag is refused. Demonstrated by the twelve controlled suites, the installed no-inference dispatch, and the live deep review of pull request #8, which reached completed coverage on 68.27393 credits and found two real defects in its own documentation. | F6, M1; [Modes](SCOPE.md#review-modes-and-findings) |
| C3 | Completed | A tier may carry one optional fallback assignment, used for one extra attempt for the one reviewer whose own execution failed. No timer, no whole-review restart, no silent substitution, and no cross-tier inheritance. Demonstrated by the twelve controlled suites, two installed no-inference probes, and the live balanced review of pull request #10, which cost 233.19659 credits, completed all six sessions and found one real documentation defect. No fallback attempt has run live. | C1, Q3; [Fallbacks/execution](SCOPE.md#models-configuration-and-execution) |
| C4 | Completed | A tier whose resolved model supports no configurable reasoning effort resolves to no effort instead of inheriting one, so such a model can serve a tier; the same rule covers a tier's fallback model. An explicit effort is still validated and never silently lowered, and a capable model still inherits and is still refused. Demonstrated by the twelve controlled suites, two installed no-inference probes, and the live full review of pull request #11, which cost 269.135657 credits, reported incomplete coverage on three execution failures, and found one real defect in this increment's own display. | C1; [Configuration](SCOPE.md#models-configuration-and-execution) |
| Q5 | Completed | A candidate anchored on a changed line carries an optional `breaks` citation for the code that change breaks, which may be unchanged, in another hunk, or in another changed file, and which passes the same bound, in-window, exact-quote checks as every other citation. A supplied introduction citation still belongs to the location's own hunk; a null one is now a claim the adjudicator tests. Demonstrated by the twelve controlled suites, the reconstructed rejections from pull requests #4, #5 and #10, and the live balanced review of pull request #12, which cost 137.274102 credits, saw a reviewer use the new citation, and found one real defect in this increment's adjudicator contract. | Q4; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| Q6 | Completed | Candidate-only clipped-end quote repair restores exact bound source without dropping a named line. Controlled reconstructions of #11 and #12 reach adjudication; #4's inserted-space fabrication stays refused. PR #13's installed balanced review cost 134.753239 credits and was incomplete: contracts returned no usable output and correctness reported a coverage gap. The repair was first observed live on pull request #18, where it restored two clipped citations on one candidate and let it reach adjudication. Exact adjudicator/publication checks and both schema versions are unchanged. | Q5; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| C5 | Completed | A completed reviewer whose output the evidence boundary discards becomes eligible for its tier's one fallback attempt, as an empty response already is. Demonstrated by the controlled suites and the installed balanced review of pull request #14, which cost 110.736851 credits across five completed reviewers with no denial. No tier had a fallback configured there, so the demotion path itself rested on scripted output until pull request #18, where the adjudicator's unparseable output produced the eligible failure live and had no fallback to take. | C3, Q4; [Fallbacks/execution](SCOPE.md#models-configuration-and-execution) |
| V1 | Completed | `--verify` enforces matching branch/SHA/cleanliness before reviewers and presents discovered existing commands for approval. `V1a` added the preflight, `V1b` discovery and presentation from the project's own instruction files, `V1c` per-command approval that records the answer, executes nothing and outlives no run. Demonstrated by the thirteen controlled suites and pull request #18's balanced `--verify` review, which cost 166.859549 credits, found two real defects and produced the first live discovery evidence. **That pass found no command in this repository**, so the interactive approval path is demonstrated only by the controlled suites. Execution is `V2`. | Q1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| V2a | Completed | Execute only approved existing safeguards with installed dependencies, in the current checkout, and show evidence and artifacts without autofix or checkout manipulation. Carries the exclusions and the citation check that `V1c` deferred to `V2`. Demonstrated by the thirteen controlled suites and pull request #19's interactive balanced `--verify` review, which cost 252.771985 credits, reached the host's real approval UI for the first time and saw the citation gate refuse a constructed command live. **That run approved nothing, so execution itself is still demonstrated only by the controlled suites.** It found one validated defect and two more that its own evidence gate discarded; two of the three are fixed here. | V1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| V2b | Completed | Settled without code: safeguard output reaches no reviewer, the retained record says nothing about what ran, and the citation gate keeps accepting a prefix as a documented limitation. All three were answered "no change", so `V2` closes with `V2a`'s behaviour and the thirteen suites unchanged. The prompt's "verified to be at" wording is a recorded wording defect that bound citations already contain; it goes to `D1`. | V2a; [Safeguards](SCOPE.md#optional-project-safeguards) |
| A1 | Completed | Completed entries `F1` through `V1c` moved verbatim into `docs/roadmap-archive-2026-09-10.md`, leaving a live `ROADMAP.md` that this project's own safeguard discovery reads instead of skipping for size. The increments table, the two most recent completed entries and the exact-next-increment section stayed. Pull request #22; documentation-only, so no installed-plugin review, and the user was asked rather than charged. | V2b; housekeeping, no scope clause |
| D1 | Pending | Document configuration, modes, incomplete coverage, cancellation, publication, cache, and safeguards with reproducible end-to-end examples. Also fixes the reviewer prompt's "verified to be at" wording, which makes it a behaviour change needing one installed-plugin review; run that review with `--verify` and approve the safeguards suite. | A1, L1; [Release boundary](SCOPE.md#priority-and-release-boundary) |

## Completed increments `F1` through `V2b` are archived

Forty-one sections were here and two increments moved every one of them verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) on
2026-09-10: `A1` moved the thirty-nine through `V1c`, and `L1` moved `V2a` and
`V2b` because this file had 4272 bytes of headroom left and the smaller of the
two is 7547. Thirty-three are completed-increment entries, covering the
thirty-one increments `F1`, `F2`, `F3`, `Q1`, `Q2`, `Q3`, `Q4`, `P1`, `P2`,
`P3`, `P4`, `P5`, `C1`, `C2`, `F4`, `R1`, `M1`, `F5`, `F6`, `M2`, `C3`, `C4`,
`Q5`, `Q6`, `C5`, `Q7`, `V1a`, `V1b`, `V1c`, `V2a` and `V2b`, with `R1` and `M1`
each recorded in two halves. The remaining eight are the working record kept
between them:

- the `Q4` acceptance criteria recorded at the `Q3` checkpoint;
- the manual-test blocker about CLI discovery without a harness override;
- four manual-feedback sections, being the coverage classification and
  presentation feedback and its completed fix, the completed fix that
  consolidates equivalent coverage gaps, and the finding that the
  consolidation did not fire on real reviewer wording;
- the `R1` second-half harness checkpoint;
- the documentation checkpoint for pull request #4 and its review.

Nothing was rewritten, condensed or corrected in either move, so each section
still reads exactly as the session that wrote it left it, and the archive is now
the evidence of record for every increment it holds: reproduction commands, the
models and efforts actually used, credit costs, findings and rejections. Read it
for the evidence behind an older increment. Do not redo, widen or reopen
anything in it; those authorizations are spent. **`V2a` and `V2b` are there
now**, so the safeguard decisions they settled are read from the archive rather
than from this file; the "Exact next increment" section below still summarises
what they answered.

The two most recent completed entries, `A1` and `L1`, stayed below, as did the
increments table above and the "Exact next increment" section at the end. The
same arithmetic will face the session that records `D1`: measure this file with
`wc -c` against the 65536-byte cap before opening a pull request, and archive
`A1` if the next entry will not fit.

## Completed increment: A1

**`A1` makes this file readable by the tool it documents.** It is the only
increment whose subject is the repository's own paperwork, and it exists because
that paperwork had become a functional defect rather than an untidiness.

### The defect it fixes, recorded live twice

`instructionFileMaxBytes` in `extensions/pr-review/safeguards.mjs` caps one
instruction file at 65536 bytes, and `collectInstructionFiles` skips an oversized
file by name rather than truncating it, because half an instruction file is a
worse source than none. `ROADMAP.md` had reached 464771 bytes over 7489 lines, so
this project's own safeguard discovery skipped its roadmap for size. Pull request
#18's discovery pass recorded the skip and #19's recorded it again with the
figure, `ROADMAP.md` at 444530 bytes. The tool could not read its own project,
and the file saying so was the file it could not read.

### What moved, and what deliberately did not

Thirty-nine sections moved verbatim into `docs/roadmap-archive-2026-09-10.md`:
thirty-one completed-increment entries covering the twenty-nine increments from
`F1` to `V1c`, and eight sections of working record kept between them. The
pointer left in their place names all of it. Nothing was rewritten, condensed or
corrected, and the move was checked rather than trusted: the extracted range and
the archive's body hash to the same SHA-256.

Three things stayed, as the increment required: the increments table, which is
the index; the two most recent completed entries, `V2a` and `V2b`, so the closing
state of `V2` reads without following a pointer; and the "Exact next increment"
section, which is what a fresh session acts on.

### The archive is not at the checkout root, and that is the point

`collectInstructionFiles` reads the root's markdown and does not recurse into
subdirectories, so an archive under `docs/` leaves the discovery candidate set
altogether. A dated archive beside `ROADMAP.md` would have satisfied the letter
of the increment while replacing one oversized skipped candidate with another
413800-byte one, and discovery would still have named a file of this project it
could not read. The subdirectory turns the skip into nothing at all.

### Measured outcome

Every figure in this table was measured at `A1`'s checkpoint and is kept as
`A1`'s evidence. `L1` has since archived `V2a` and `V2b` and changed two of
them; the `L1` entry below carries the current measurement.

| File | Bytes at `A1` | Against the 65536-byte cap |
| --- | --- | --- |
| `ROADMAP.md` before | 464771 | skipped, 7.1x over |
| `ROADMAP.md` after | 61264 | read, 4272 bytes spare |
| `docs/roadmap-archive-2026-09-10.md` | 413800 | not a candidate; discovery does not recurse |

Every root markdown file is now under the cap except `README.md` at 103636
bytes, which is `D1`'s to shorten. The root's readable files spend well under
half the 262144-byte discovery budget, so nothing is near being skipped for the
budget rather than for its own size.

### Validation

Documentation-only: nothing under `extensions/` or `scripts/` changed, so the
shipped behaviour is exactly `V2a`'s. All thirteen controlled suites were run
anyway and all thirteen pass, which is the evidence that they do not depend on
this file. `scripts/smoke-safeguards.mjs` asserts the oversize skip against a
synthetic project whose `ROADMAP.md` is `"x".repeat(instructionFileMaxBytes + 1)`,
so it tests the rule and never the real file; shrinking the real file could not
weaken it. `git diff --check` is clean and the diff carries no control byte.

The increment's own outcome was demonstrated rather than inferred, by running
this project's real `collectInstructionFiles` against this checkout. It now
reads five root files in `conventionalInstructionFiles` order, `AGENTS.md`,
`CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md` at 61264 bytes as measured at this
increment's checkpoint, and `SCOPE.md`, and skips exactly one, `README.md`, for
exceeding the cap. **Before this increment
that skipped list held `ROADMAP.md` too.**
`docs/roadmap-archive-2026-09-10.md` appears in neither list, because
`collectInstructionFiles` does not recurse into subdirectories.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
wc -c ROADMAP.md docs/roadmap-archive-2026-09-10.md
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

### Pull request #22 and its review

Pull request #22 carries this increment. **It was not reviewed by the installed
plugin.** `AGENTS.md` makes the review of a documentation-only pull request the
user's call rather than a requirement, because a review spends real credits; the
user was asked and authorized none. That is a recorded decision, not an omission
to correct. Nothing under `extensions/` or `scripts/` changed, so no behaviour of
the shipped tool went undemonstrated by not reviewing it.

### Remaining limitations

- **The headroom does not survive the next entry, and `L1` must archive before
  it writes one.** This file has 4272 bytes spare against the cap. The last
  six completed entries measured 7546, 12085, 14651, 15365, 15406 and 20969
  bytes, so even the smallest of them overruns what is left: this is not a risk
  to watch but an arithmetic certainty. **The increment that adds the next entry
  archives `V2a` and `V2b` first**, into the existing dated archive or a new one,
  leaving the same kind of pointer behind; that frees about 28KB. Keeping both
  `V2` halves here was this increment's own instruction, so `A1` did not pre-empt
  it, and `A1`'s entry is deliberately the smallest of the recent ones at about
  6KB. No size check enforces any of this. Run `wc -c ROADMAP.md` before opening
  a pull request, and treat 65536 as the number that matters. **`L1` did this**,
  archiving both `V2` halves before writing its own entry; the arithmetic held
  and the freed 28517 bytes are recorded below.
- **`README.md` is still skipped for size** at 103636 bytes, so discovery still
  names one file of this project it cannot read. `D1` owns it.
- **`README.md`'s discovery example is now stale in one detail.** It uses
  `Skipped: ROADMAP.md (exceeds 65536 bytes)` to illustrate a skipped file, which
  no longer describes this checkout. The example is hypothetical throughout, so
  it states nothing false about a real run, but `D1` should replace that line.
- **The archive has no index.** Finding an older increment's evidence means
  searching it. None was added, because `D1` may want one and this increment was
  to stay mechanical.

## Exact next increment

**`V2` is closed. `V2a` shipped execution and `V2b` settled its three remaining
questions without code.** Their answers are recorded in the two completed
entries above and are not to be reopened: no reviewer receives safeguard output,
the retained record says nothing about what ran, the citation gate still accepts
a prefix, the shell gate does not accept a command a project wrote as a chain,
and no timeout of any kind bounds a running safeguard.

**`V1a`, `V1b`, `V1c`, `Q7`, `C5`, `V2a` and `V2b` are complete and merged, from
pull requests #19, #18, #17, #16, #15 and #14 and this increment's own.** Their
authorizations are spent. Nothing about any of them should be redone or widened.

### Every must-have is complete, and the port is feature-complete for v1

`SCOPE.md`'s must-have column and its costly-to-lose column are both entirely
delivered. `A1` has landed, so what is left of v1 is `L1` and `D1`, and neither
adds a capability. When both have landed, v1 is done, and the open items further
below are limitations to state in the release notes rather than work to
schedule.

**A later session should not invent an increment.** The user's direction, given
after #19 merged, is that the port had grown far past the effort its goal
justified, and that the remaining appetite belongs to finishing rather than to
building. Treat a new feature idea as out of scope unless the user asks for it.

### The next increment is `L1`, then `D1`

`A1` has landed, so two increments remain and this is their order. Take one,
land it on its own branch and pull request, and stop.

- **`L1`: resolve upstream licensing and attribution.** `SCOPE.md` records that
  `pi-pr-review` declares MIT but that no standalone licence text was found at
  the inspected revision, commit `457e18e30437984e2e6680802c9da25d270b82cc`. No
  upstream source has been reused and none should be until this is settled. The
  outcome is a recorded answer and, if attribution is owed, the text that
  discharges it. It needs no review and spends no credits.
- **`D1`: the user documentation.** Document configuration, modes, incomplete
  coverage, cancellation, publication, the cache and safeguards with
  reproducible end-to-end examples. `README.md` is 103636 bytes and is skipped
  by safeguard discovery for size, exactly as this file was until `A1`, so `D1`
  should shorten it at least as much as it extends it, and should replace the
  now-stale `ROADMAP.md` line in its discovery example. It also carries one
  recorded wording defect: the reviewer prompt in `review.mjs` tells every
  specialist its working directory is "verified to be at" the reviewed head,
  which stays true of `HEAD` after a safeguard runs but not of the working tree.
  Bound citations already contain the consequence, as the `V2b` entry sets out;
  the sentence is still wrong and `D1` is where it is cheapest to fix, because
  that pull request touches user-facing text anyway. **That fix is a change
  under `extensions/`, so `D1`'s pull request needs an installed-plugin review
  whatever else it contains. Run that review with `--verify` and approve `node
  scripts/smoke-safeguards.mjs` when the approval UI asks.** It is the last
  chance to give safeguard execution live evidence without spending a review on
  nothing else, and the reason is set out under "The live evidence `V2` did not
  produce" below.

Before "fixing" that wording into something stronger: **re-asserting checkout
cleanliness after execution is refused and must stay refused.** `SCOPE.md` says
these commands may create artifacts and forbids cleaning the checkout, so a
re-assertion would refuse a review because the person's own approved tests wrote
a coverage file. Fix the sentence, not the gate.

### The live evidence `V2` did not produce, now accepted for v1

**Execution has never run under the installed plugin.** #19's review reached the
host's approval UI and approved nothing, so `accept` with a non-empty selection,
a real spawn, a real capture, a real artifact line and a real cancellation are
all still demonstrated only by the controlled suites. **The exclusion table
recorded no live refusal either**, because the discovery pass reported only three
candidates and the one refusal came from the citation check.

Closing either gap costs a review, and `V2b` was settled without code and so
without a review to fold them into. **`D1` is where they should close, at no
extra cost.** `D1` fixes the reviewer prompt's "verified to be at" wording, and
that is a change under `extensions/`, so `AGENTS.md` already requires `D1`'s
pull request to be reviewed by the installed plugin. Run that one review with
`--verify` and approve `node scripts/smoke-safeguards.mjs` when the approval UI
asks: the suite finishes in well under a second and leaves the checkout clean,
so the artifact line should say the checkout is unchanged. That single run gives
execution its first live evidence, an `accept` carrying a non-empty selection, a
real spawn, a real capture and a real artifact line, without spending a review
on it. A live exclusion refusal still cannot be arranged, because what a
discovery pass reports is not ours to arrange.

Until `D1` runs, both remain demonstrated only by the controlled suites, and no
entry above may be read as though the installed plugin had executed anything.

### Recorded, not scheduled

These stay open and none is scheduled. Do not start one instead of `L1` or `D1`
without the user saying so.

- **A review against a substantial code diff**, the oldest and largest open
  observation. No review of any mode has run against one; #10 is the closest at
  984 additions over 12 files, and #14 is 666 over seven. It is separately
  authorizable and nobody has spent a review on it deliberately.
- **A live review in which a reviewer is refused an absent path**, the only way
  to learn whether `Q7`'s reason changes what a reviewer does next. It cannot be
  arranged deliberately without inducing the request, so it is a matter of
  watching later reviews rather than an increment to schedule.
- **A live review with a fallback configured**, the only way to close the gap
  #14's reviewers named about `C3` and `C5`. That is a deliberate credit
  decision, because a discarded output would then spend a second attempt. #18's
  adjudicator produced exactly the eligible failure and had no fallback to take,
  which is what a configured one would have answered.
- **A live approval that approves something.** #19 closed half of this: two
  discovered commands were offered, the host's elicitation UI accepted the
  schema and returned a documented action, and the answer approved nothing. An
  accepted subset, a cancel, and every part of execution downstream of them are
  still demonstrated only against the controlled harness. `D1`'s own required
  review closes this at no extra cost; see "The live evidence `V2` did not
  produce" above.
- **A live refusal from the exclusion table.** #19's discovery pass reported only
  three candidates and refused one of them by citation, so no exclusion rule has
  ever refused a real discovered command. No later review can close this
  deliberately, because what a discovery pass reports is not ours to arrange.
- `L1` remains pending; copy no upstream source.

`F6`'s marker contract has live evidence from five of six reviewers on #7, both
sessions on #8, every session on #10, on #11 every session that produced an
envelope at all, including the medium tier's `claude-sonnet-5` writing paragraphs
of prose before the markers, every session on #12, every completed reviewer on
#13, and all five reviewers on #14. #11's one unparsed output contained no
envelope, wrapped or otherwise, so it is not evidence against the unwrap. Do not
reintroduce substring matching and do not widen it. `C5` changed nothing about
the unwrap; it changed only what an attempt whose output fails it is called.

Do not revisit the Agent Factories surface without new information from GitHub.
Three separate blockers were demonstrated on CLI 1.0.83, and all three would
have to change: the feature flag, the extension-only factory registration, and
the confined tool grant that leaks `skill` and `sql`. A new CLI version is new
information; a new reading of the same documentation is not.

Do not add a timeout, a deadline or a "stuck reviewer" heuristic to make
fallbacks fire more often. `SCOPE.md` forbids review timeouts, and both `C3` and
`C5` depend on their absence: elapsed time is never a fallback trigger, and `C5`
sits beside the reviewer precisely because a hung reviewer never settles.

Land every increment on its own branch and pull request, review that pull
request with this plugin before asking for a merge, and record the outcome here;
`main` refuses direct pushes and merging stays the user's call. Playground pull
requests #1 and #2 must never be merged or republished.
