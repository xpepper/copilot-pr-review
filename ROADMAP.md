# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md). Completed entries through `O1` were moved verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) by
`A1`, `L1`, `D1`, `O1` and `U1`, so this file keeps the increments table, the
two most recent completed entries and the closing section, and stays small
enough for this project's own safeguard discovery to read. **With `D1` complete v1 is done,
and `O1`, `E1` and `U1` have since landed on top of it.** Two further increments
remain scheduled, `I1` and `G1`, to be taken in that order; the closing section
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
| E1 | Completed | The tool is used for real, on work that is not this repository. One authorized deep review of `xpepper/pr-review-gemini#28`, 1427 changed lines over 16 files: 81.48022 credits, 93 s of model work, 16 approved tool calls and no denial, one validated finding that is real and exact, and one blocked assessment reported twice. Six items came out of it; the coverage-gap consolidation defect is fixed here, two are documentation fixes, and three are recorded as limitations with reasons. Pull request #26, reviewed once with this plugin at the user's instruction: deep, 45.98955 credits, incomplete coverage, 3 validated findings all real and all fixed here, and one discarded candidate that was also right and is also fixed. | O1; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| U1 | Completed | Unattended, non-interactive execution. All four questions a review can ask already had a no-person branch and none of them blocked, so `--unattended` is a declaration checked at parse time rather than a new capability: it refuses, before capture and before a credit is spent, any invocation that would need somebody. Without `--all`, without `--comment` or `--no-comment`, with `--verify`, or with `--capture-only`. An unattended capture also offers no closed-PR confirmation even where the host has one. It grants no authority, opens no gate and is not a configuration key; `scripts/dogfood-review.mjs` requires it. Pull request #28, reviewed once with this plugin at the user's authorization: deep, 77.45399 credits, 114.5 s of model work, 13 approved tool calls and no denial, incomplete coverage on one execution failure, 0 validated findings and one accepted candidate the evidence boundary discarded because the adjudicator's own citation named fifteen lines for a sixteen-line quote. That candidate was right and is fixed here. | E1; [Publication controls](SCOPE.md#selection-publication-and-cached-results), [Safeguards](SCOPE.md#optional-project-safeguards) |
| I1 | Pending | Incremental re-reviews: when a pull request has moved on since a previous review, confine fresh hunting to the new commit range and revalidate the prior findings as resolved, still open, or obsolete. Requires discovering the prior review and the head it evaluated, and classifying the relationship between that head and the current one. Several increments rather than one, so the first step is slicing it. The second half of issue #21. It touches head binding and the evidence boundary, which are the most settled parts of the design; changing either needs the user to say so. | U1; [Targets](SCOPE.md#targets-and-local-behavior), [Modes/findings](SCOPE.md#review-modes-and-findings) |
| G1 | Pending | Gap analysis against the field, then a proposal. Compare this tool behaviourally with upstream `pi-pr-review` and with other code-review agents and skills now in the open, on capability and on user experience, and propose what is worth adopting. Research is extensive and the output is a written analysis plus a recommendation, not code. **`L1`'s rule binds this absolutely: no upstream or third-party source, prompt text or documentation may be copied.** Any adoption is behavioural and re-implemented. Anything it proposes is a scope decision for the user. | I1; [Upstream baseline](SCOPE.md#upstream-baseline) |

## Completed increments `F1` through `O1` are archived

Forty-five sections were here and five increments moved every one of them
verbatim to
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md): `A1`
moved the thirty-nine through `V1c`, `L1` moved `V2a` and `V2b` because this
file had 4272 bytes of headroom left and the smaller of the two is 7547, `D1`
moved `A1`'s entry and then `L1`'s, `O1` moved `D1`'s, and **`U1` moved `O1`'s**,
which is the last in that file. Thirty-seven are completed-increment entries,
covering the thirty-five increments `F1`, `F2`, `F3`, `Q1`, `Q2`, `Q3`, `Q4`,
`P1`, `P2`, `P3`, `P4`, `P5`, `C1`, `C2`, `F4`, `R1`, `M1`, `F5`, `F6`, `M2`,
`C3`, `C4`, `Q5`, `Q6`, `C5`, `Q7`, `V1a`, `V1b`, `V1c`, `V2a`, `V2b`, `A1`,
`L1`, `D1` and `O1`, with `R1` and `M1` each recorded in two halves. The remaining eight are the
working record kept between them:

- the `Q4` acceptance criteria recorded at the `Q3` checkpoint;
- the manual-test blocker about CLI discovery without a harness override;
- four manual-feedback sections, being the coverage classification and
  presentation feedback and its completed fix, the completed fix that
  consolidates equivalent coverage gaps, and the finding that the
  consolidation did not fire on real reviewer wording;
- the `R1` second-half harness checkpoint;
- the documentation checkpoint for pull request #4 and its review.

Nothing was rewritten, condensed or corrected in any of the five moves, so each
section still reads exactly as the session that wrote it left it, and the
archive is the evidence of record for every increment it holds: reproduction
commands, the models and efforts actually used, credit costs, findings and
rejections. Read it for the evidence behind an older increment. Do not redo,
widen or reopen anything in it; those authorizations are spent. **`V2a`, `V2b`,
`A1`, `L1` and `O1` are all there now**, so the safeguard decisions `V2` settled,
the archiving `A1` performed, the upstream licence answer `L1` established and
the quiet-output decisions `O1` settled are read from the archive rather than
from this file.
[docs/upstream-licensing.md](docs/upstream-licensing.md) is still the record of
that licence work and did not move.

**`E1`'s and `U1`'s entries are the ones kept live**, along with the increments
table above and the closing section at the end. The rule these moves established is to keep
the most recent entries and archive the rest, measuring this file with `wc -c`
against the 65536-byte cap before opening a pull request. `O1` archived `D1`
after its second review found the live file contradicting itself: `D1`'s
remaining-limitations list still said a quieter review was undesigned and
unscheduled, directly above the entry that shipped `--quiet`. **That sentence was
true when `D1` wrote it**, which is why the entry moved verbatim rather than
being corrected; the archive is history, and the live file is the answer.
`U1` archived `O1` for headroom alone: the live file had 3679 bytes spare and an
increment entry is five to eight kilobytes, so `O1`'s had to move before this
one could be written. It moved verbatim for the same reason every earlier one
did.

## Completed increment: E1

**`E1` is the first time this tool reviewed code that nobody here wrote for it.**
Every increment before it was demonstrated on this repository's own pull
requests, which are small and mostly prose; the largest was #10 at 984 additions
over twelve files. The one earlier exception is in the archive: a `--quick` run
against private `primait/starsky#8126` on 2026-09-07, four changed paths, zero
findings, recorded as manual feedback rather than as an increment.

**The target was agreed with the user before anything was spent**:
`xpepper/pr-review-gemini#28`, a sibling port of this tool to another CLI, merged
the same day. 1427 changed lines over 16 files, of which about 510 lines are new
production JavaScript and 650 are new tests. The user chose deep, and chose not
to run `--verify`.

### The run

Reviewed from a clone pinned at the pull request head rather than from the
user's own working copy of that repository, because another session was
committing in it while we worked. `/pr-review 28 --deep --no-comment`, typed
interactively, with the installed plugin byte-identical to `main` at `6de2d75`.
A free `--capture-only` dispatch went first and proved the capture before any
credit was spent.

| Measure | Value |
| --- | --- |
| Bound input | 92844 byte diff, 279673 bytes of context over 29 blobs |
| Reviewer `integrated`, heavy, `gpt-5.6-terra` high | 76.3 s, 5 requests, 51.82372 credits |
| Adjudicator, `gpt-5.6-terra` high | 12.3 s, 1 request, 29.6565 credits |
| Total | 81.48022 credits, 93 s of model work |
| Tool calls | 16, all approved, zero denials: `view` x8, `rg` x8 |
| Result | 1 candidate, 1 validated finding, 0 rejected, 0 capped, 0 duplicates |
| Coverage | INCOMPLETE: 0 execution failures, 2 coverage gaps, 0 caveats |

**The largest input this tool has ever bound cost less than any balanced review
of this repository's own small pull requests.** Reviewer count dominates, as the
README said; this run is the first measurement that isolates it.

### What the reviewers did well

**The one finding is real, and it is the sharpest defect in the diff.** [P2]
"Preserve a signal-terminated child review as failure", `scripts/dogfood-pr.mjs`
lines 79-80, confidence 0.96: the new wrapper's `code ?? 0` turns the null exit
code Node reports for a signal-killed child into a successful exit, so an
interrupted review reports success to whatever called it. The anchor, the exact
quote and the blob identity are all correct, and the claim was verified by hand
against Node's documented behaviour rather than taken from the adjudicator.

**It engaged with the riskiest new code and declined to assert.** The diff's
`isModelUnavailableError` matches model-catalog failures by regular expression
over error text, and the reviewer's coverage gap says exactly why it could not
be judged: the repository contains only synthetic fixtures, so whether the
matcher recognises the host's real failures cannot be established from the
captured revision. That is the evidence boundary working as designed, at the
reviewer's own initiative.

**Three gates ran live on someone else's repository for the first time**: the
merged pull request confirmation, which asked and was answered yes; the revision
gate against a foreign checkout; and finding selection, where the user selected
the finding with Space and submitted with Enter. `O1`'s fix to that question
carried over, and nothing was published.

### What it did badly, and the honest limit on saying so

**One finding from 1427 changed lines.** Nothing was discarded, so this was the
reviewer's own output rather than a gate: `rejected` and `capped` are both
empty. An independent reading of the same production diff, written down
before the run settled and kept verbatim in
[docs/e1-independent-reading.md](docs/e1-independent-reading.md), raised six
further candidates, the strongest being basename-only file matching in the new
`isMatchingFile`, which lets a finding about any same-named file in any directory
satisfy a benchmark. **That reading is one reader's opinion and is not ground
truth**, and its own author later weakened two of its seven entries, so what this
increment establishes is precision, which was 1 for 1, and not recall, which
remains unmeasured. A recall number needs a defect corpus with agreed ground
truth, which this project does not have and has not scheduled. The design trades recall for precision deliberately;
this is the first evidence of what that costs on a substantial diff.

**Coverage read INCOMPLETE with zero execution failures.** Both gaps were the
same honest statement about unverifiable evidence. On real code a reviewer will
usually have something it cannot verify, so the headline word will usually be
INCOMPLETE, and the breakdown line underneath is what actually distinguishes a
failed reviewer from a caveat.

### The six items this run produced, and what was done about each

| # | Item | Disposition |
| --- | --- | --- |
| 1 | Coverage-gap consolidation could not fire on real wording | **Fixed here** |
| 2 | A review never reports what it cost | Recorded; scope defers usage reports |
| 3 | Evidence lines are unreadable in the interactive UI | Recorded |
| 4 | Per-reviewer progress says nothing for 76 seconds | Recorded |
| 5 | Verbose is the wrong default for reading | **Fixed here**, in `README.md` |
| 6 | Adjudication is a fixed cost, not a per-finding one | **Recorded in `README.md`** |

**Item 1 is a defect with two live instances and a measured cause.** The
reviewer and the adjudicator blocked the same assessment in almost the same
words, and the user was shown both. `presentationDiagnostics` refused the merge
because `equivalentGaps` required a backticked identifier shared between the two
messages, and neither reviewer used backticks. The similarity rule was never
reached: the Dice overlap of the two impact clauses is 0.645 against a 0.35
threshold, and the shared tokens include the function's own name. A bare name
now counts as a name when it has a shape prose does not, being an internal
capital after a lowercase letter or an underscore. Naming the same code still
only makes two gaps comparable, the impact clauses still have to agree, and raw
diagnostics are still retained unmerged. Replaying this run's two real gaps
through the fixed module yields one gap with two reports. The archive's earlier
instance, `primait/starsky#8126`, still does not merge and should not: its
overlaps were 0.323, 0.207 and 0.188, all genuinely below the threshold.

**Item 2 is the one a user feels every time.** Billing is collected per request
and retained in the evidence, but nothing prints it, and the host's own status
bar reports the ambient session's zero rather than what the reviewers spent.
This run's 81.48022 was recovered afterwards from Copilot's session state on
disk. `SCOPE.md` defers detailed timing and usage reports to nice-to-have, so a
cost line is a scope decision rather than a defect to fix inside `E1`.

**Item 3 is why item 2 was hard.** Each evidence line is a single very long line
of JSON, and the interactive UI truncates it at the window edge, so this
increment's own evidence could not be read from the screen at all. The project's
record-keeping depends on those lines. The workaround used here was to parse
`~/.copilot/session-state/<id>/events.jsonl`, which is a Copilot implementation
detail and not a contract.

**Item 4**: five identical `active` lines over 76 seconds, while the reviewer was
making sixteen tool calls. `SCOPE.md` requires basic per-reviewer progress and
defers a live scrolling view, and this sits between them.

**Items 5 and 6 are documentation.** The first-review walkthrough now says that
most of a run's output is evidence rather than findings and points at `--quiet`
for reading, and the cost table carries this review as its one row from another
repository together with the adjudicator's 29.6565 share of it.

### This increment's own pull request, and the review that improved it

Pull request #26, reviewed once with this plugin at the user's instruction.
Dispatched with `node scripts/dogfood-review.mjs 26 --deep --no-comment`, which
is how `AGENTS.md` says to send the same slash command when the agent cannot type
one. The installed plugin was reinstalled from the branch head and diffed against
the checkout first, so the review exercised the changed `coverage.mjs` and not a
stale copy.

| Measure | Value |
| --- | --- |
| Diff | 279 additions, 8 deletions, 5 files |
| Reviewer `integrated`, `gpt-5.6-terra` high | 113.3 s, 4 requests, 31.54985 credits |
| Adjudicator, `gpt-5.6-terra` high | 17.4 s, 1 request, 14.4397 credits |
| Total | 45.98955 credits |
| Result | 3 validated findings, 0 withheld, 0 adjudicator rejections |
| Coverage | INCOMPLETE, on one candidate the evidence boundary discarded |

**All three validated findings were real and all three are fixed here.** Two were
defects in this increment's own new prose: the cost table's caption said the
foreign-code row was last when it is third, and the added adjudication paragraph
said a large diff pays that cost whatever its reviewers found, when a review with
no surviving candidate starts no adjudicator at all. The third is the one this
project keeps making: **the closing section still told the next agent to run an
authorized external review**, directly below the entry recording that it had
already happened. That is the fifth review in a row to catch this repository's
paperwork disagreeing with itself, after #18, #23, #24 and #25.

**The best candidate of the four was discarded, and it was right.** It reported
that extracting a bare identifier kept an unbounded substring test, so `loadUser`
would match inside `loadUserProfile` and two gaps about different code could be
folded into one. Five of its six citations were exact. The sixth, an optional
`breaks` citation, named lines 96-105 for a nine-line quote covering 96-104, and
the exact-quote gate refused the whole candidate. `Q6`'s clipped-end repair
cannot rescue it by design: it restores a quote clipped inside the last named
line, and refuses one whose line count does not match its range, because a
repair that drops a named line could drop the very line that authorizes the
anchor. **The rule behaved exactly as designed and a true finding was still
lost.** The defect it reported is fixed here, with its own failing test first,
after checking the claim against the source.

**A boundary-discarded candidate is not counted in `rejected`.** It is an
execution-failure diagnostic, and `validation.rejected` holds only adjudicator
rejections, so a summary reading `rejected=0` beside incomplete coverage is
accurate and easy to misread. That is worth knowing when reading any run's
evidence; it is not a defect.

**Selection reported `unavailable`.** The SDK runner creates a session with no
elicitation UI, so there was nothing to answer and nothing published, which is
the shape `U1` has to make deliberate.

## Completed increment: U1

**`U1` is a run that completes with nobody there to answer anything.** The
surprise on opening the code was that this already worked. Four places in a
review can ask a person something: the closed or merged confirmation at capture,
safeguard approval under `--verify`, finding selection, and the final
publication confirmation. **All four already had a no-person branch, and none of
them blocked.** A host with no elicitation UI reported `unavailable` for each
decision the invocation had not settled, and carried on.

So `U1` is not about unblocking anything, and it deliberately widened no
authority. It is about *when* a run finds out. **A run that could never have
finished alone still paid for its reviewers first and reported the problem
afterwards**: `E1`'s review of pull request #26 reported selection `unavailable`
after spending 45.98955 credits.

### The shape, agreed with the user before anything was built

Three decisions, each taken by the user before a line was written, because the
first half of issue #21 is a description rather than a design.

- **Preflight only.** The flag is a declaration and a precondition check. It does
  not make the run behave differently on a host that has a UI, and it adds no
  machine-readable outcome for a caller to branch on. Those were the other two
  options and both were declined as larger.
- **`--all` is always required**, rather than only when the run can publish.
  Selection is a question like any other, and a flag that means "nothing is left
  for a person" cannot mean two different things depending on `--comment`.
- **An explicit posting flag is always required.** A saved `autoPostReviews` may
  never be what makes a headless run publish. This narrows nothing outside the
  new flag: `--all` with `autoPostReviews=true` still publishes unattended on a
  host with no UI, exactly as `SCOPE.md` allows.

### What `--unattended` refuses

Checked at parse time, before the target is captured and before a credit is
spent. Each refusal names the single missing thing, because nobody is there to
interpret a general complaint.

| Refused | Why |
| --- | --- |
| Without `--all` | Selection is a question, and `--all` is the only thing that settles it without a person. It authorizes no posting |
| Without `--comment` or `--no-comment` | What a run may publish belongs in the invocation, not in saved state |
| With `--verify` | A safeguard command is approved by the question an unattended run cannot ask, and deliberately by nothing else |
| With `--capture-only` | Capture takes no review flag at all |

**One behaviour changed**, in the free capture step: an unattended run is offered
no closed or merged confirmation even on a host that has one, so such a pull
request stops at capture unless `--include-closed` or `--review-closed` was
given. Withholding that question can only refuse a capture, never accept one on
somebody's behalf, and it is what makes the contract exact: an unattended run
asks nothing, ever.

**No gate was relaxed.** `--all` still authorizes no posting, every publication
gate still runs, reviewer reads stay confined, posting authority still never
authorizes safeguard execution, and the flag is not a configuration key, so no
saved or trusted-project setting can turn it on.

**`scripts/dogfood-review.mjs` now requires it.** That runner creates a session
with no elicitation UI at all, which is how `E1`'s review came to report
selection `unavailable`, so this project's own headless runner is the
declaration's first user. `AGENTS.md` and `README.md` prescribe that command and
both say so.

### Validation

The thirteen controlled suites pass. `scripts/smoke-review.mjs` gained the parse
refusals with their exact messages, and a settled unattended run **on a harness
that does have an elicitation UI and is asked nothing**, which is the contract
rather than an accident of the host. `scripts/smoke-target.mjs` gained the
closed-PR case in both directions, proving an open capture is unchanged.

`node scripts/smoke-runtime.mjs --targets` passes with 71 assertions and no
inference, against the plugin reinstalled from the checkout and `diff -rq`'d
against it. Seven of those send the new refusals through the runtime's own
command RPC, and none reaches a capture, so the coverage is free.

**It also reads back one sentence of `help` and one of `status`, which is the
first check this repository has ever had on either.** Three false user-facing
strings have shipped from here, each surviving several increments because
nothing dispatched those commands and looked at the text.
`scripts/smoke-reviewer-tools.mjs` was not run: nothing here touches
`read-only.mjs`.

### Pull request #28 and its review

Reviewed once with this plugin at the user's authorization, dispatched with
`node scripts/dogfood-review.mjs 28 --deep --all --no-comment --unattended`,
which is the first live run of the flag itself.

| Measure | Value |
| --- | --- |
| Diff | 552 additions, 295 deletions, 11 files |
| Bound input | 72767 byte diff, 322949 bytes of context over 22 blobs |
| Reviewer `integrated`, heavy, `gpt-5.6-terra` high | 94.0 s, 3 requests, 46.70139 credits |
| Adjudicator, `gpt-5.6-terra` high | 20.5 s, 1 request, 30.7526 credits |
| Total | 77.45399 credits, 114.5 s of model work |
| Tool calls | 13, all approved, zero denials: `view` x9, GPT's `rg` alias x4 |
| Result | 1 candidate, 0 validated findings, 0 rejected, 0 capped, 0 duplicates |
| Coverage | INCOMPLETE: 1 execution failure, 0 coverage gaps, 2 informational caveats |

**The one candidate was real, and it was this increment's own new prose.** [P2],
confidence 0.99: the added section and the matching `help` line both claimed that
a host with no elicitation support publishes nothing. That is false, and the
README's own command contract said so four hundred lines earlier. `--all
--comment` resolves to `flag-authorized` posting authority, which never reaches
the final-confirmation branch, so such a run publishes on a host that could not
have asked anything. **Both statements are corrected here**, and the accurate one
is that a no-UI host reports `unavailable` for each decision the invocation did
not settle, with safeguard approval the one exception whatever the posting flags
say.

**The adjudicator accepted it, and the evidence boundary discarded it anyway.**
The candidate reached adjudication, the verdict was `accept` with
`allClaimsSupported` true, and then the adjudication itself was refused: its
third citation quoted sixteen lines of `review.mjs` while naming the range
88-102, which spans fifteen. That is `E1`'s shape exactly, a line count
disagreeing with its range, **but on the adjudicator's own citation rather than a
reviewer's, and after the finding had already been accepted.** The gate behaved
as designed and a true, accepted finding was still lost. Do not weaken it; `Q6`'s
repair cannot rescue this shape by design, because a repair that drops a named
line could drop the line authorizing the anchor.

**So the run reported 0 findings and `rejected=0` on incomplete coverage**, which
is the reading `E1` warned about: a boundary discard is an execution-failure
diagnostic and never appears in `validation.rejected`. The breakdown line
underneath is what says a reviewer failed rather than merely caveated.

**`Q6`'s repair fired live again**, on the reviewer's own citation of the `help`
lines, restoring a quote whose trailing comma the model had dropped. That
candidate then reached adjudication, so the repair did its job in the same run
the boundary refused a different citation for a different reason.

**This is the sixth review in a row to catch this repository's paperwork
disagreeing with itself**, after #18, #23, #24, #25 and #26. This time it was not
a stale instruction but a false claim written in the same commit as the feature
it described, contradicted by a section of the same file.

## v1 is complete, `U1` is done, and two increments remain

**`D1` delivered v1, and `O1`, `E1` and `U1` have landed on top of it.**
`SCOPE.md`'s must-have column, its costly-to-lose column and its additional
agreed v1 capability are all delivered.

**The user scheduled four increments, in this order: `E1`, `U1`, `I1`, `G1`.**
The first two are complete and their entries are above. **Take the remaining two
one at a time and in order**, and do not start a later one early. Treat any other
feature idea as out of scope unless the user asks for it in your own session.

### The next increment is `I1`, incremental re-reviews

**`E1` and `U1` are done: do not redo either.** `E1`'s three recorded items stay
recorded and none of them is scheduled: a run still never reports its own cost,
the evidence lines are still truncated by the interactive UI, and per-reviewer
progress still says nothing while a reviewer works. `U1` is settled as one
preflight flag that refuses, and its shape is not to be reopened.

**`I1` is the second half of issue #21**: when a pull request has moved on since
a previous review, confine fresh hunting to the new commit range and revalidate
the prior findings as resolved, still open, or obsolete. Its row in the table
above says what it needs, and the row is deliberately cautious.

- **It is several increments rather than one**, so the first step is slicing it,
  not building it. Discovering the prior review and the head it evaluated,
  classifying the relationship between that head and the current one, and
  revalidating prior findings are separable pieces.
- **It touches head binding and the evidence boundary**, which are the two most
  settled parts of the design. Every publication gate and every citation check
  rests on them. Changing either needs the user to say so, explicitly, in your
  own session.
- **Agree the slicing with the user before building anything**, as `U1` did.

**`G1` follows**, and its row in the table above says what it is. Do not start it
before `I1` is recorded.

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

**Nothing above `U1` is to be redone, widened or reopened.** Every increment's
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

- ~~**A review against a substantial code diff.**~~ **`E1` did this**, on
  `xpepper/pr-review-gemini#28`: 1427 changed lines over 16 files, one real
  finding, 81.48022 credits. The entry above records what it revealed. What stays
  open after it is recall: nobody has measured what a review misses, and doing so
  needs a defect corpus with agreed ground truth that this project does not have.
- **A run that reports what it cost.** `E1` found that billing is collected per
  request and retained, and never printed, so a person cannot tell what they
  spent without reading Copilot's session state from disk. `SCOPE.md` defers
  detailed timing and usage reports, so a cost line is a scope decision for the
  user rather than a defect.
- **Evidence lines a person can actually read.** Each is one very long line of
  JSON, and the interactive UI truncates it at the window edge, so `E1`'s own
  evidence had to be recovered from `~/.copilot/session-state/<id>/events.jsonl`,
  which is a Copilot implementation detail and not a contract.
- **Progress that says anything while a reviewer works.** `E1`'s reviewer printed
  five identical `active` lines over 76 seconds while making sixteen tool calls.
  `SCOPE.md` requires basic per-reviewer progress and defers a live scrolling
  view; this sits between them.
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
- **An unattended run that actually publishes.** `U1`'s live evidence is
  `--all --no-comment --unattended`, because that is what the dogfood runner
  permits and it deliberately never posts. `--all --comment --unattended` is
  accepted by the parser and resolves to `flag-authorized`, so nothing asks and
  the publication gates decide, but no run has been watched doing it. Closing
  this means authorizing a real post to a real pull request, which is the user's
  call and not a defect to fix unasked.
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
