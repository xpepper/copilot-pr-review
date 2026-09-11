# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md). Completed entries through `A1` were moved verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) by
`A1`, `L1` and `D1`, so this file keeps the increments table, the two most
recent completed entries and the closing section, and stays small enough for
this project's own safeguard discovery to read. **With `D1` complete v1 is done,
and `O1` has since landed on top of it.** Four further increments are scheduled,
`E1`, `U1`, `I1` and `G1`, to be taken in that order; the closing section
describes the next one and records what stays open as a limitation rather than as
work.

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
| L1 | Completed | Upstream declares MIT in every place it publishes metadata and publishes no licence text and no copyright notice anywhere, so MIT's notice condition cannot be discharged from upstream material. Nothing may be copied; a line-level audit of 5544 upstream lines against 56 local files confirms nothing has been, the only overlap being seven boilerplate strings. Answer, evidence and rule recorded in `docs/upstream-licensing.md`. Pull request #23, reviewed once with this plugin at the user's authorization: 0 validated findings on incomplete coverage, 137.46398 credits, and six discarded candidates of which most were real and are fixed on the branch. | [Upstream baseline](SCOPE.md#upstream-baseline) |
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
| D1 | Completed | User documentation: `README.md` reorganised by task with reproducible examples for configuration, modes, incomplete coverage, cancellation, publication, the cache and safeguards, shortened from 103903 to 55195 bytes so this project's own discovery now reads every root file and skips none. Also fixes the reviewer prompt's "verified to be at" wording and two shipped `help`/`status` strings that denied safeguards are ever executed, which makes it a behaviour change needing one installed-plugin review; that review is `--verify` with the safeguards suite approved. Pull request #24, reviewed once with this plugin at the user's authorization: deep with `--verify`, 136.8324 credits, 0 validated findings on incomplete coverage, and two discarded candidates that both described real defects, fixed on the branch. The offered safeguards were not approved, so `D1` bought no live execution evidence; `O1`'s second review did. | A1, L1; [Release boundary](SCOPE.md#priority-and-release-boundary) |
| O1 | Completed | A review's output can be asked to be quiet: `--quiet` suppresses the evidence JSON lines and every raw untrusted model envelope, including the safeguard discovery pass's, and suppresses nothing about coverage, refusals, failures, safeguards or publication. Verbose stays the default and `scripts/dogfood-review.mjs` refuses the flag, because this project's own roadmap evidence is read from those lines. The user chose one flag and no configuration key. Pull request #25, reviewed once with this plugin at the user's authorization: deep with `--verify`, 57.6814 credits, completed coverage, 2 validated findings of which one was real and is fixed here and one was false and is rejected with a reproduction. Reviewed a second time at the user's further authorization after the approval fix, 98.84322 credits, completed coverage, one real finding: **that run approved and executed a safeguard, which is the first time the installed plugin has ever run one.** | D1; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| E1 | Pending | The tool is used for real, on work that is not this repository, and what that use reveals is collected and acted on. Deliver: at least one authorized review of a substantial code diff in another repository, a written record of what the reviewers actually did well and badly on it, and the defects and usability problems that surfaced, fixed or recorded with a reason. This is the first scheduled increment because everything after it should be informed by how the tool behaves on real work rather than on its own small diffs. | O1; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| U1 | Pending | Unattended, non-interactive execution: a run that completes in a headless environment without a person answering anything, while every existing gate still holds. `SCOPE.md` already allows `--all --comment` and `--all` with `autoPostReviews=true` to publish unattended, so this is about what a run does when no elicitation UI exists at all, and about making that explicit rather than incidental. Posting authority still never authorizes safeguard execution. The first half of issue #21, taken first because it is the smaller half. | E1; [Publication controls](SCOPE.md#selection-publication-and-cached-results), [Safeguards](SCOPE.md#optional-project-safeguards) |
| I1 | Pending | Incremental re-reviews: when a pull request has moved on since a previous review, confine fresh hunting to the new commit range and revalidate the prior findings as resolved, still open, or obsolete. Requires discovering the prior review and the head it evaluated, and classifying the relationship between that head and the current one. Several increments rather than one, so the first step is slicing it. The second half of issue #21. It touches head binding and the evidence boundary, which are the most settled parts of the design; changing either needs the user to say so. | U1; [Targets](SCOPE.md#targets-and-local-behavior), [Modes/findings](SCOPE.md#review-modes-and-findings) |
| G1 | Pending | Gap analysis against the field, then a proposal. Compare this tool behaviourally with upstream `pi-pr-review` and with other code-review agents and skills now in the open, on capability and on user experience, and propose what is worth adopting. Research is extensive and the output is a written analysis plus a recommendation, not code. **`L1`'s rule binds this absolutely: no upstream or third-party source, prompt text or documentation may be copied.** Any adoption is behavioural and re-implemented. Anything it proposes is a scope decision for the user. | I1; [Upstream baseline](SCOPE.md#upstream-baseline) |

## Completed increments `F1` through `D1` are archived

Forty-four sections were here and four increments moved every one of them
verbatim to
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md): `A1`
moved the thirty-nine through `V1c`, `L1` moved `V2a` and `V2b` because this
file had 4272 bytes of headroom left and the smaller of the two is 7547, `D1`
moved `A1`'s entry and then `L1`'s, and **`O1` moved `D1`'s**, which is the last
in that file. Thirty-six are completed-increment entries, covering the
thirty-four increments `F1`, `F2`, `F3`, `Q1`, `Q2`, `Q3`, `Q4`, `P1`, `P2`,
`P3`, `P4`, `P5`, `C1`, `C2`, `F4`, `R1`, `M1`, `F5`, `F6`, `M2`, `C3`, `C4`,
`Q5`, `Q6`, `C5`, `Q7`, `V1a`, `V1b`, `V1c`, `V2a`, `V2b`, `A1`, `L1` and `D1`,
with `R1` and `M1` each recorded in two halves. The remaining eight are the
working record kept between them:

- the `Q4` acceptance criteria recorded at the `Q3` checkpoint;
- the manual-test blocker about CLI discovery without a harness override;
- four manual-feedback sections, being the coverage classification and
  presentation feedback and its completed fix, the completed fix that
  consolidates equivalent coverage gaps, and the finding that the
  consolidation did not fire on real reviewer wording;
- the `R1` second-half harness checkpoint;
- the documentation checkpoint for pull request #4 and its review.

Nothing was rewritten, condensed or corrected in any of the three moves, so each
section still reads exactly as the session that wrote it left it, and the
archive is the evidence of record for every increment it holds: reproduction
commands, the models and efforts actually used, credit costs, findings and
rejections. Read it for the evidence behind an older increment. Do not redo,
widen or reopen anything in it; those authorizations are spent. **`V2a`, `V2b`,
`A1` and `L1` are all there now**, so the safeguard decisions `V2` settled, the
archiving `A1` performed and the upstream licence answer `L1` established are
read from the archive rather than from this file.
[docs/upstream-licensing.md](docs/upstream-licensing.md) is still the record of
that licence work and did not move.

**`O1`'s entry is the only one kept live**, along with the increments table above
and the closing section at the end. The rule these moves established is to keep
the most recent entries and archive the rest, measuring this file with `wc -c`
against the 65536-byte cap before opening a pull request. `O1` archived `D1`
after its second review found the live file contradicting itself: `D1`'s
remaining-limitations list still said a quieter review was undesigned and
unscheduled, directly above the entry that shipped `--quiet`. **That sentence was
true when `D1` wrote it**, which is why the entry moved verbatim rather than
being corrected; the archive is history, and the live file is the answer.

## Completed increment: O1

**`O1` is the one increment the user scheduled after v1, and it is a quieter
review.** A run printed a great deal, and the largest part of it was never the
findings. `--quiet` leaves out the evidence JSON lines and the raw untrusted
model envelopes, and leaves everything else exactly where it was.

### One flag, and deliberately not a configuration key

The roadmap left this open and told the session to ask rather than build both.
**The user chose one flag and no configuration key**, on the reasoning the
roadmap itself recorded: one flag is the smaller step and satisfies the request,
and a saved key can still be added later if typing it per run turns out to
annoy. `--quiet` is declared as `quietFlag` in `extensions/pr-review/review.mjs`
beside the parser that reads it.

The flag is the right shape for a second reason that is not about cost.
Verbosity authorizes nothing, so a key would have been defensible where
`--verify`'s is not; but a saved key can make a run quieter than the person
running it expects, and the thing it would hide is the evidence that run was
trustworthy. Asking for it one run at a time removes that possibility entirely.

### What it leaves out, and what it can never leave out

| Suppressed by `--quiet` | Where it is printed |
| --- | --- |
| `Q1 target:` and `Q2 context:` JSON | `executeTargetCapture` in `target.mjs` |
| The mode's `binding:` JSON | `executeReviewRun` in `review.mjs` |
| Every completed reviewer's raw envelope, and the adjudicator's | `reviewAssignments` in `fixture.mjs` |
| The settled `<prefix> evidence:` JSON | `executeOwnedRun` in `fixture-run.mjs` |
| `P1 evidence:` JSON | `finishSelection` in `selection.mjs` |
| `P2 evidence:` JSON | `startRun` in `extension.mjs` |

Nothing else changed. The effective configuration and assignments, the
verification notice, the `R1 checkout:` line, per-reviewer progress, the `Q4
evidence gate` count, the findings and their rejections, the coverage report and
its diagnostics, finding selection, the review proposal and every publication
outcome all print at both verbosities. So do the sentences that say what a
result may not be read as: **a quiet run is still impossible to mistake for a
clean review.**

Two of the suppressed lines carried a sentence that is not evidence, and those
sentences stay when the JSON goes: the capture's "No PR review performed; no
clean-review claim", the context's statement that source comes only from the
captured revisions, and the binding's rule that unvalidated candidates cannot
publish.

**A skipped or refused target needed more than that.** When capture skips a
draft or a bot, `Q1 target:` was the only line that named the disposition and
the reason, and no later stage prints them: a `not-started` outcome reaches
neither `formatFindings` nor the incomplete-coverage report. A quiet run
therefore states them in words instead, as `Target owner/repo#N: skipped;
draft.` with the state, head and changed-file count. Suppressing that would have
turned a skip into silence, which is exactly what the rule forbids.

### The two places the flag is refused

`--capture-only` refuses it, alongside the mode, posting, selection and model
arguments it already refuses. A capture-only run's entire output is the two
evidence lines `--quiet` would suppress, so the combination asks for nothing.

**`scripts/dogfood-review.mjs` refuses it outright**, in the same shape as its
existing refusal of `--comment`. That runner exists to capture an increment's
own evidence, and the models and efforts actually used, the credit cost, the
tool calls and denials and the coverage diagnostics are all read out of the
lines this flag removes. A dogfood run may never be the run that hid its own
evidence, and now it cannot be.

### Validation

All thirteen controlled suites pass. `scripts/smoke-review.mjs` carries the new
assertions, written first and seen to fail for the right reason: the parsing
block failed on a missing `quiet` field before the parser knew the flag, and the
output block failed on `Q1 target:` still being printed before the suppression
existed. Four cases were added:

- the same settled balanced run printed twice, asserting that each suppressed
  line and envelope is present by default and absent under `--quiet`, that
  fourteen kept lines survive both, that both runs settle identically, and that
  the retained record still holds every reviewer's own untrusted output;
- a quiet run with a failing reviewer, asserting the reviewer names itself and
  its error, that the run reports incomplete coverage twice over, and that
  suppression does not resume because the run failed;
- a quiet run of the fixture's draft pull request, asserting the skip states its
  disposition and reason and that no reviewer session was created;
- a quiet `--verify` run with an approved command, asserting the preflight, the
  discovery, the approval and the execution summary with the command's own
  output all still print.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
git diff --check
wc -c README.md ROADMAP.md
```

`git diff --check` is clean and the branch diff carries no control byte. The
discovery collector still reads all six root files and skips none; `README.md`
grew to 58261 bytes and has 7275 spare against the 65536-byte cap.

`scripts/smoke-reviewer-tools.mjs` was not run and did not need to be:
`read-only.mjs` was not touched, reviewer confinement is unchanged, and nothing
about what a reviewer may read or do depends on how much the run prints.

### Pull request #25 and its review

Pull request #25 carries this increment, and the user authorized one review of
it in advance, as `--deep --verify --all --no-comment`, typed in an interactive
Copilot session because `scripts/dogfood-review.mjs` can never approve a
command. The plugin was reinstalled from the reviewed head first and diffed
byte-identical against the checkout, after the vanishing install `D1` recorded.

    /pr-review 25 --deep --verify --all --no-comment

| What the run actually used | |
| --- | --- |
| Mode | deep, 1 integrated reviewer plus the adjudicator, `--verify --all --no-comment` |
| Heavy tier | `gpt-5.6-terra` at reasoning `high`, for the reviewer, the adjudicator and the discovery pass |
| Fallbacks | none configured, so a discarded output had no second attempt |
| Diff reviewed | 10 files, 42480 diff bytes, 208370 context bytes over 20 sources |
| Reviewer reads | 10 confined tool calls, five `rg` and five `view`, **zero permission denials and zero tool denials** |
| Credit cost | **57.6814 reported AI credits**, being 36.20905 for the integrated reviewer over three turns and 21.47235 for the adjudicator. The discovery pass's own charge is not reported on the evidence line |
| Outcome | **2 validated findings, coverage `completed`**, 0 rejected, 0 withheld, 1 informational caveat, nothing published |

**This is the first review of this project's own work to reach `completed`
coverage with validated findings since #8.** Both findings were P2, both were
accepted by the adjudicator, and `--all` selected both. Nothing was published.

#### One finding was real and is fixed here

**`--quiet` did not reach the safeguard discovery pass.**
`discoverSafeguards` called `reviewAssignments` without the option, so a quiet
`--verify` run still printed `Untrusted safeguard discovery output` with the
whole raw envelope, which is exactly the kind of line the flag promises to leave
out. The reviewer found it by reading the call sites the change had touched and
noticing the one it had not.

It is fixed on this branch. The discovery pass is a model pass, so its raw output
now goes quiet with the reviewers' and the adjudicator's; **what it found still
does not**, because the commands and the file each came from are what a person is
asked to approve. `scripts/smoke-review.mjs` asserts the envelope is absent under
`--quiet`, present without it, and that the discovery summary survives both. The
test was written first and seen to fail.

#### The other was false, and the adjudicator accepted it

**"Keep the capture's no-review notice in quiet output"** claimed the quiet arm
of the capture log drops `No PR review performed; no clean-review claim. Nothing
published.` It does not. That sentence is appended by the outer template literal
**after** the ternary closes, so both arms carry it, and the reviewer's own
`after` citation quotes the line that proves it.

It is rejected, and it was demonstrated false rather than argued away:

```sh
node --input-type=module -e '
import { executeTargetCapture } from "./extensions/pr-review/target.mjs";
import { respond } from "./scripts/target-fixture.mjs";
const messages = []; const history = [];
const session = { async log(m) { messages.push(m); },
  rpc: { metadata: { async snapshot() { return { workingDirectory: process.cwd() }; } } }, capabilities: {} };
const gh = async (a, c) => { const r = respond(a, c, history); history.push({ args: a, cwd: c }); return r; };
for (const quiet of [false, true]) { messages.length = 0;
  await executeTargetCapture(session, "2", { gh, quiet }); console.log(quiet, messages.at(-1)); }
'
```

Both verbosities print the notice; only the JSON differs. Two suite assertions
already covered it, one on a settled quiet run and one on a quiet skipped draft,
and both passed throughout.

**That is worth recording as what it is.** The adjudicator is a fallible
source-grounded judgment, not a proof, and here it accepted a claim contradicted
by the source it quoted in its own evidence. `V2b`'s decision that no reviewer
sees safeguard output is unaffected; so is every gate. What this shows is that
`allClaimsSupported: true` means a model said so, which is why the result still
says validation is not execution or formal proof.

#### The approval question came back `empty` for the second time

**At this point safeguard execution still had no live evidence**; the second
review below is what changed that. Discovery read all six root files, skipped
none, and offered both `node scripts/smoke-safeguards.mjs` and
`node scripts/smoke-review.mjs`, refusing neither. The recorded approval is
`{"status":"empty","approved":[],"offered":2,"refused":0}` and the run printed
the `empty` message `D1` added, which says the selection did not reach the run
and to rerun to be asked again.

**This is now the third `--verify` review to reach the host's approval UI and
approve nothing**, and the second in which the operator reports having picked a
command. #19 offered two and approved none, #24 offered two and recorded an
answer naming neither, and #25's first run did the same. At that point a
non-empty `accept`, a real spawn, a real capture, a real artifact line and a live
cancellation were all demonstrated only by `scripts/smoke-safeguards.mjs`, and
nothing here could be read as though the installed plugin had ever executed a
safeguard. **The second review changed all of that except the cancellation.**

`D1`'s fix did its job: the run said plainly that nothing arrived rather than
recording a decline. **What it did not do is explain why.** No elicitation
payload is logged anywhere, so the raw answer remains unrecoverable, and with
three runs and no live approval the question of whether the fault is in the host
UI, the array-of-`const` schema shape or the plugin's reading of the answer
cannot be settled from what exists. It is recorded below as an open limitation,
not scheduled.

### The second review, and the first safeguard this tool has ever run

The user authorized a second review of #25 after the approval fix landed, to find
out whether the fix worked. **It did.** The plugin was reinstalled from the new
head first and diffed byte-identical; the stale installed copy did not carry the
fix, so that step was the difference between a real test and a meaningless one.

    /pr-review 25 --deep --verify --all --no-comment

| What the second run actually used | |
| --- | --- |
| Mode | deep, 1 integrated reviewer plus the adjudicator, `--verify --all --no-comment` |
| Heavy tier | `gpt-5.6-terra` at reasoning `high`, for the reviewer, the adjudicator and discovery |
| Diff reviewed | 13 files, 95214 diff bytes, 355049 context bytes over 26 sources |
| Reviewer reads | 28 confined tool calls, `rg` and `view`, **zero permission denials and zero tool denials** |
| Credit cost | **98.84322 reported AI credits**, being 66.00162 for the reviewer over six turns and 32.8416 for the adjudicator |
| Outcome | **1 validated finding, coverage `completed`**, 0 rejected, 0 withheld, no caveat, nothing published |

**The safeguard ran.** This is the thing three previous reviews could not buy,
and no controlled suite can prove:

| What only a live run could show | What #25's second run showed |
| --- | --- |
| A non-empty `accept` | `{"status":"approved","approved":[{"command":"node scripts/smoke-safeguards.mjs","file":"AGENTS.md"}],"offered":2,"refused":0}` |
| A real spawn | `node scripts/smoke-safeguards.mjs`, exit 0, 500 ms |
| A real capture | its ten `PASS` lines on stdout, empty stderr, nothing truncated |
| A real artifact line | `artifacts.paths: []`, printed as "The checkout is unchanged: no safeguard left a modified or untracked path behind" |
| The ordering the design promises | the `V2a` block printed after approval and before the reviewer started |

**The Space diagnosis was right.** The same person, the same two offered
commands, the same schema; the only thing that changed was a sentence telling
them which key selects. The approval status went from `empty` to `approved` on
the next attempt.

**One thing downstream is still unproven live: cancelling a running safeguard**,
including killing a grandchild process. `scripts/smoke-safeguards.mjs` covers it
and nothing else does, because arranging it live means cancelling a real review
mid-command.

#### What the second review found

One P3, and it was real: **the live roadmap contradicted itself.** `D1`'s
remaining-limitations list still said a quieter review output was undesigned and
unscheduled, sitting directly above the completed `O1` entry that ships
`--quiet`. **This is the fourth review in a row to catch this project's paperwork
disagreeing with itself**, after #18, #23 and #24. The lesson has not been
learned by writing it down; take it as a standing check rather than a warning.

It is fixed by archiving `D1`'s entry, which this file needed anyway for
headroom. The entry moved verbatim, because the sentence was true when `D1`
wrote it, and the live file now answers the question on its own.

## v1 is complete, and four increments are scheduled after it

**`D1` delivered v1 and `O1` has landed on top of it.** `SCOPE.md`'s must-have
column, its costly-to-lose column and its additional agreed v1 capability are all
delivered.

**The user has since scheduled four increments, in this order: `E1`, `U1`, `I1`,
`G1`.** They are described below. **Take them one at a time and in order**, and
do not start a later one early: `E1` exists precisely so that what comes after it
is informed by how the tool behaves on real work. Treat any other feature idea as
out of scope unless the user asks for it in your own session.

### The next increment is `E1`, feedback from real execution

**Use the tool for real, on work that is not this repository, and act on what
that reveals.** Every review this project has run has been of its own pull
requests, which are small and mostly documentation. The largest is #10 at 984
additions over twelve files. Nobody knows how the reviewers behave on a
substantial code diff, and that is the oldest open observation in this file.

- **Run at least one authorized review against a substantial code diff in another
  repository.** The user authorizes each review; do not spend one unasked, and
  agree the target with them first. `SCOPE.md` accepts a pull request number for
  the repository owning the current directory, so this means working from a
  checkout of that repository with the plugin installed.
- **Record what the reviewers actually did**, well and badly: which findings were
  real, which were noise, what the evidence boundary discarded that should have
  survived, what the adjudicator accepted that it should not have, how long it
  took, and what it cost.
- **Collect the usability problems too**, not only the defects. What was hard to
  read, hard to answer, or hard to trust is in scope for this increment.
- **Fix what is small and clearly right**, on a branch and a pull request as
  usual. Record the rest with a reason rather than widening the increment.
- **Acceptance**: a written record in this file of a real review of real code,
  with the evidence a review entry always carries, plus the list of what it
  revealed and what was done about each item.

**`U1`, `I1` and `G1` follow**, and their rows in the table above say what each
one is. Do not start them before `E1` is recorded.

### `G1`'s starting references, recorded now so they are not lost

The user named these when scheduling `G1`. The list is a starting point for
extensive research, not its boundary, and the comparison covers user experience
as well as capability.

- Upstream: [`pi-pr-review`](https://pi.dev/packages/pi-pr-review?name=review),
  the baseline `SCOPE.md` pins.
- [openai/codex `.codex/skills`](https://github.com/openai/codex/tree/main/.codex/skills)
- [channingwalton `code-reviewer`](https://github.com/channingwalton/skills/blob/main/skills/code-reviewer/SKILL.md)
- [JPeetz `code-quality`](https://github.com/JPeetz/agent-skills/tree/main/skills/code-quality)
- [unclecatvn `code-review`](https://github.com/unclecatvn/agent-skills/blob/main/skills/code-review/SKILL.md)

**Read them; copy nothing.** `docs/upstream-licensing.md` records why, and the
rule is not specific to upstream: anything adopted is adopted as behaviour and
re-implemented here.

**Nothing above `O1` is to be redone, widened or reopened.** Every increment's
authorization is spent, and the evidence for each is either in the two entries
kept here or in
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md).

**`V2` is closed**, and its answers are not to be reopened: no reviewer receives
safeguard output, the retained record says nothing about what ran, the citation
gate still accepts a prefix, the shell gate does not accept a command a project
wrote as a chain, and no timeout of any kind bounds a running safeguard.
**`L1` is closed**: upstream declares MIT and publishes no licence text or
copyright notice, so no upstream source may be copied and none has been. This
project's own licence is settled and is MIT, and `LICENSE` carries the text.

### Why the approval question keeps coming back empty, and it is not the schema

**Three `--verify` reviews have reached the host's approval UI and approved
nothing**: #19, #24 and #25. In the last two the operator reports having picked a
command, and the run recorded none. `D1` made `empty` and `declined` separate
statuses so the run says which happened, but nothing said *why*.

**`O1`'s session bought the answer, at the user's request and for no review.**
The user proposed asking Copilot CLI about its own SDK, which cost **56.63 AI
credits** in one `copilot -p` prompt-mode turn, run against a copy of the working
tree with no `.git` directory so the agent could read everything and write
nothing. Its `app.js` line numbers and some quoted identifiers were wrong, but
its byte offsets into the installed bundle were right and were checked by hand.

**The schema is correct and is the supported shape.** `ElicitationSchemaField` in
`copilot-sdk/types.d.ts` admits exactly seven field shapes, one of which is an
`array` whose `items.anyOf` carries `{const, title}` pairs, and
`generated/rpc.d.ts:20500` names that shape `UIElicitationArrayAnyOfField`,
"Multi-select string field where each option pairs a value with a display label".
The CLI classifies it as `multi-enum` and renders it as a checkbox list.
`ElicitationFieldValue` includes `string[]`, and nothing in the SDK or the
transport drops a selection.

**The cause is the key binding.** In the installed bundle at byte offset
`5750008`, the multi-select component toggles membership only in its
`Y.code === "space"` branch; up and down move the focus, and Enter submits the
form. **Pressing Enter while an option is merely focused submits the untouched
`default: []`**, which is a valid accepted answer. That is exactly the recorded
outcome three times over.

    else if (Y.code === "space") { ... toggle this option into the array ... }

**This was our defect, and it is fixed here.** The question this tool asks never
said that Space toggles, so a person who highlighted a command and pressed Enter
approved nothing and was told only that their answer named none. The question now
carries one sentence: press Space to select a command, then Enter to submit, and
Enter on its own submits nothing because a highlighted command is not a selected
one. `README.md` says the same where it describes the approval step, and
`scripts/smoke-safeguards.mjs` asserts both keys are named.

**`minItems` was deliberately not added, and must not be.** The CLI's own bundled
example uses `minItems: 1`; we do not, and the suite now asserts its absence.
Approving nothing must stay expressible and must stay the default, because the
safe answer to "may I run this?" is no.

**The next attempt worked**, and the evidence is in the section below. Before it,
safeguard execution had no live evidence at all and the `--verify` path was
demonstrated only as far as the approval gate.

**A live refusal from the exclusion table is still not demonstrated either.**
#24's discovery pass read a `README.md` full of command lines the exclusion table
would refuse, including `copilot plugin install` and `gh pr checkout`, and
reported neither: it reported two commands and refused none. What a discovery
pass reports is a model's judgment over prose, so no later review can arrange
this deliberately.

### Recorded, not scheduled

These stay open and none is scheduled. They are limitations of a finished v1,
not a backlog. Do not start one without the user saying so.

- ~~**A review against a substantial code diff.**~~ **This is now scheduled as
  `E1`** and is no longer merely recorded. #10 remains the closest any review has
  come, at 984 additions over 12 files.
- **A live review in which a reviewer is refused an absent path**, the only way
  to learn whether `Q7`'s reason changes what a reviewer does next. It cannot be
  arranged deliberately without inducing the request, so it is a matter of
  watching later reviews rather than an increment to schedule.
- **A live review with a fallback configured**, the only way to close the gap
  #14's reviewers named about `C3` and `C5`. That is a deliberate credit
  decision, because a discarded output would then spend a second attempt. #18's
  adjudicator produced exactly the eligible failure and had no fallback to take,
  which is what a configured one would have answered.
- **Cancelling a running safeguard, including its grandchildren.** This is what
  is left of the old approval gap. **The gap itself is closed**: #25's second
  review approved `node scripts/smoke-safeguards.mjs`, spawned it, captured its
  output and reported the checkout unchanged, after three reviews (#19, #24 and
  #25's first run) approved nothing because the host's multi-select toggles on
  Space and Enter on a merely focused option submits the empty default. The
  question now says which key selects, and the next attempt worked. What no live
  run has shown is a cancellation while a safeguard is running, because arranging
  one means cancelling a real review mid-command;
  `scripts/smoke-safeguards.mjs` covers it and nothing else does.
- **A live refusal from the exclusion table.** #19's discovery pass reported only
  three candidates and refused one of them by citation, so no exclusion rule has
  ever refused a real discovered command. No later review can close this
  deliberately, because what a discovery pass reports is not ours to arrange.
- **Upstream's own licence position could change.** `L1` settled the inspected
  revision, not upstream in perpetuity. A later revision could add a `LICENSE`
  file or change the declaration. Recheck before relying on the answer for any
  revision other than the one `SCOPE.md` pins. `L1` itself is closed: copy no
  upstream source. This project's own licence is settled and is MIT.

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
`main` refuses direct pushes and merging stays the user's call. That applies to
any later work the user does schedule, not only to the increments above.
Playground pull requests #1 and #2 must never be merged or republished.
