# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md). Completed entries through `I1b` were moved verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) by
`A1`, `L1`, `D1`, `O1`, `U1`, `I1a`, `I1b` and `I1c`, so this file keeps the increments
table, the most recent completed entry and the closing section, and stays
small enough for this project's own safeguard discovery to read. **With `D1`
complete v1 is done, and `O1`, `E1`, `U1`, `I1a`, `I1b` and `I1c` have since
landed on top of it.** `I1` was sliced into three with the user before anything was built,
and `G1` alone remains scheduled; the closing section
describes it and records what stays open as a limitation rather than
as work.

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
| I1a | Completed | Prior-review discovery. Capture reports whether this tool has already reviewed this pull request, the head that review evaluated, its inline comments retained with verbatim bodies and normalised anchors, and how the reviewed head relates to that one: `none`, `same-head`, `incremental`, `diverged` or an honestly unmeasured `unknown`. A review counts only when the authenticated identity submitted it and it carries the body `preview.mjs` builds, so a hand-written review is considered and never treated as a prior one. Read-only, no credits, no change to any reviewer's input, and a failed discovery is reported as itself. The first of `I1`'s three slices, agreed with the user before anything was built. | U1; [Targets](SCOPE.md#targets-and-local-behavior) |
| I1b | Completed | `--incremental` confines fresh hunting to the commits added since an earlier review of the same pull request, so a re-review stops reporting hunks that review already covered. A range diff that cannot be shown complete refuses rather than confines, and the reviewers are told both the confined head-side ranges and every path those commits touched, because a deleted file's only possible anchor is base-side. Opt-in, at the user's decision, and a request rather than a parse-time contract: any relationship but `incremental`, an unreadable range, or added commits that change no file each narrow nothing and say which it was. The captured binding, its context windows, the provenance checks and every citation rule are unchanged; the reviewers are given the confined head-side ranges and code sets aside any candidate anchored outside them, before adjudication, reported with its location and never refuted. One informational caveat carries the confinement into the published body, because a confined review does not cover the whole pull request. Pull request #31, reviewed once with this plugin at the user's authorization: deep, 68.53836 credits, 91.5 s of model work, 16 approved tool calls and no denial, 0 candidates and 0 validated findings, and one coverage gap that is exact and unfixable here, namely that the confinement path has fixture coverage only and no live run has ever reported the incremental relationship. | I1a; [Targets](SCOPE.md#targets-and-local-behavior), [Modes/findings](SCOPE.md#review-modes-and-findings) |
| I1c | Completed | Revalidating the findings an earlier review of the same pull request published, as resolved, still open or obsolete. The parser `I1a` deferred reads this tool's own emitted comment prose back into a structured finding, and is held to the emitter's own template: a parse counts only when rebuilding it reproduces the body byte for byte. Every review then reports the verdicts code can prove and spends nothing on them: lines the newer commits never touched are still open, an anchor GitHub can no longer place or a file those commits deleted is obsolete, and nothing is ever proved resolved without reading the code. `--revalidate` buys one model pass over exactly what is left; a proved verdict is never put to it and never overturned by it, and a pass that fails settles nothing. A settled verdict is answered on the earlier review's own thread, under the review's own posting authority and never any other, which makes this the first write set in this tool that is more than one request: each reply is journalled before it is sent, a definite rejection does not stop the others, and one unknown outcome stops the set with every thread after it left unattempted. The retained record carries the verdicts and the reply dispositions, which is the schema change `I1a` and `I1b` each deferred to the increment that would consume it. Pull request #32, reviewed twice with this plugin, each time at the user's explicit authorization: deep on `gpt-5.6-terra` at high effort both times, 144.23376 then 115.0322 credits. The first found 0 validated findings on INCOMPLETE coverage and three discarded or uncertain candidates that all described real defects and are all fixed here, one of them a crash that would have thrown whenever a review settled less than every earlier finding. The second covered those fixes, reported 0 candidates on INCOMPLETE coverage, and produced the live absent-path refusal `Q7` had never seen. | I1a, I1b; [Modes/findings](SCOPE.md#review-modes-and-findings), [Publication controls](SCOPE.md#selection-publication-and-cached-results) |
| G1 | Pending | Gap analysis against the field, then a proposal. Compare this tool behaviourally with upstream `pi-pr-review` and with other code-review agents and skills now in the open, on capability and on user experience, and propose what is worth adopting. Research is extensive and the output is a written analysis plus a recommendation, not code. **`L1`'s rule binds this absolutely: no upstream or third-party source, prompt text or documentation may be copied.** Any adoption is behavioural and re-implemented. Anything it proposes is a scope decision for the user. | I1c; [Upstream baseline](SCOPE.md#upstream-baseline) |

## Completed increments `F1` through `I1b` are archived

Forty-nine sections were here and eight increments moved every one of them
verbatim to
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md): `A1`
moved the thirty-nine through `V1c`, `L1` moved `V2a` and `V2b` because this
file had 4272 bytes of headroom left and the smaller of the two is 7547, `D1`
moved `A1`'s entry and then `L1`'s, `O1` moved `D1`'s, `U1` moved `O1`'s, `I1a`
moved `E1`'s, `I1b` moved `U1`'s and then `I1a`'s, and **`I1c` moved `I1b`'s
15018 bytes**, the last in that
file. Forty-one are completed-increment entries,
covering the thirty-nine increments `F1`, `F2`, `F3`, `Q1`, `Q2`, `Q3`, `Q4`,
`P1`, `P2`, `P3`, `P4`, `P5`, `C1`, `C2`, `F4`, `R1`, `M1`, `F5`, `F6`, `M2`,
`C3`, `C4`, `Q5`, `Q6`, `C5`, `Q7`, `V1a`, `V1b`, `V1c`, `V2a`, `V2b`, `A1`,
`L1`, `D1`, `O1`, `E1`, `U1`, `I1a` and `I1b`, with `R1` and `M1` each recorded in two halves. The remaining eight are the
working record kept between them:

- the `Q4` acceptance criteria recorded at the `Q3` checkpoint;
- the manual-test blocker about CLI discovery without a harness override;
- four manual-feedback sections, being the coverage classification and
  presentation feedback and its completed fix, the completed fix that
  consolidates equivalent coverage gaps, and the finding that the
  consolidation did not fire on real reviewer wording;
- the `R1` second-half harness checkpoint;
- the documentation checkpoint for pull request #4 and its review.

Nothing was rewritten, condensed or corrected in any of the eight moves, so each
section still reads exactly as the session that wrote it left it, and the
archive is the evidence of record for every increment it holds: reproduction
commands, the models and efforts actually used, credit costs, findings and
rejections. Read it for the evidence behind an older increment. Do not redo,
widen or reopen anything in it; those authorizations are spent. **`V2a`, `V2b`,
`A1`, `L1`, `O1`, `E1`, `U1`, `I1a` and `I1b` are all there now**, so the safeguard
decisions `V2` settled, the archiving `A1` performed, the upstream licence answer
`L1` established, the quiet-output decisions `O1` settled, everything `E1` learned
from reviewing somebody else's code, the unattended shape `U1` fixed, the
three slicing decisions `I1a` took with the user and the six things `I1b` asked
the next session to carry forward are read from the archive rather
than from this file.
[docs/upstream-licensing.md](docs/upstream-licensing.md) is still the record of
that licence work and did not move.

**`I1c`'s entry is the one kept live**, along with the increments
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
did. `I1a` archived `E1` under the same rule and for the same reason, `E1` being
the largest live entry at 10988 bytes. **`I1b` archived `U1`'s 7925 bytes and
then `I1a`'s 15217** under that same rule. The first move was forced before a
word could be written: this file had 2766 bytes spare, less than any increment
entry ever written here. The second was forced once the entry existed, because
it left 1369 bytes spare and the review evidence an entry ends with does not fit
in that. **One live entry rather than two is where that rule now lands**, and the
archive holds the rest. **`I1c` archived `I1b`'s 15018 bytes** before writing a
word of its own, on that same rule and for that same reason: 7364 bytes were
spare and no increment entry has ever been that small.

## Completed increment: I1c

**`I1c` is the last of `I1`'s three slices, and the one that consumes what the
first two deliberately left unconsumed.** `I1a` retained every inline comment of
an earlier review with its body exactly as posted and shipped no parser, because
nothing there read one. `I1b` still read none: confinement reasons about commit
ranges and never about what an earlier comment said. `I1c` reads them.

### Six decisions taken with the user before anything was built

Every one of them was put to the user as a separate question, as `U1`, `I1a` and
`I1b` each did, and the answers shaped the increment rather than decorating it.

- **Code proves what it can; one model pass judges the rest.** The alternatives
  offered were a code-only increment that never reaches "resolved", and a single
  model pass over every finding. The hybrid was chosen, and it keeps this
  project's own rule that code decides what a model may only propose.
- **The free half runs in every review; the model pass waits for a flag.** An
  alternative gating both behind one flag was offered and declined. The verdicts
  code can prove cost nothing, and withholding a free answer behind a flag would
  be withholding it for no reason.
- **A settled verdict is answered on the earlier review's own thread.** One
  summary line in the published review body was offered and declined, as was
  posting nothing at all. The user chose the largest of the three.
- **Both halves land in one increment.** This session recorded the sizing
  concern first, plainly: per-comment replies are a new GitHub mutation class
  that `SCOPE.md` does not cover, and every safety property `publication.mjs`
  states is stated for exactly one write. The user reaffirmed after reading it,
  so the concern is recorded here and the full request was built.
- **Replies carry the review's own posting authority and no other.** They are
  their own write set under it, so `--no-comment` suppresses both, one
  confirmation covers both, and a run that selects no finding still answers the
  threads. A separate posting flag was offered and declined.
- **A thread already answered at this head is skipped.** Posting regardless, and
  refusing the whole set, were both offered and declined.

### The parser is held to the emitter's template, not to a guess about it

`preview.mjs` now builds every published comment body through one exported
function, and the pattern that reads one back is that same template with its six
parts captured and anchored at both ends. **A parse counts only when rebuilding
it reproduces the input byte for byte.** An emitted body therefore always reads
back, and a template change that forgot this parser fails the round-trip in the
suite rather than misreading somebody's comment.

A comment this tool cannot read back is **named and counted rather than guessed
at**, exactly as an unparseable reviewer envelope is.

### The asymmetry, which is the same one `I1b` kept

Code proves that a finding still stands and never that it has gone away:

| Verdict | Proved by |
| --- | --- |
| still open | The newer commits do not touch the lines the comment anchors on, or the heads are identical |
| obsolete | GitHub can no longer place the anchor, or those commits deleted the file |
| unsettled | Everything else |

**Nothing is ever proved resolved without reading the code**, because absence of
evidence that a defect remains is not evidence that somebody fixed it, and a
wrongly resolved finding is one nobody looks at again. The retained record
enforces exactly that: a `decidedBy: "code"` entry claiming `resolved` is
refused by the validator.

**A rename is not a deletion.** Writing this increment's own suite caught the
first version calling a renamed file's anchor untouched, which was a false proof:
the path had no head side left at all. A path those commits moved out from under
an anchor now proves nothing either way.

### The commit range is read once and serves both consumers

`I1b` read the comparison only behind its flag. `I1c` needs the same range in
every re-review, so the read moved into `readRangeOnce` and both consumers take
its outcome. **A relationship with no forward range still costs no request**, and
a pull request with nothing to revalidate and no confinement asked for costs none
either. A run that confines and revalidates reads it once between them.

### Replies: the first write set that is more than one request

Everything before this wrote one review in one request, and every safety property
`publication.mjs` states is stated for exactly one write. Partial completion is
therefore an ordinary result here rather than an error case, and the record says
which it was per thread.

- Each reply is **journalled before it is sent**, so a process that dies
  mid-request leaves a record naming the thread it was on.
- **A definite rejection does not stop the others**, because it is known not to
  have been written. **One unknown outcome stops the set**, and every thread
  after it stays unattempted rather than becoming a second unknown. The record
  admits at most one unknown, and the validator enforces that.
- The review's own gates run again for this write set, so a moved head refuses a
  reply exactly as it refuses an inline comment.
- **A reply never comes back as a finding or as a review this tool wrote.**
  Discovery keeps only the comments of the review it recognised, and recognising
  a review reads the body this tool builds, so a reply is excluded twice over.
  Both are asserted, because either one changing would make a re-review
  revalidate its own answers.
- **`/pr-review publish` deliberately answers no thread.** A verdict about the
  current code was grounded in a read of the checkout at the reviewed head, and
  that command never reads a checkout, so it says so instead of publishing a
  claim it cannot stand behind.

### The paperwork this increment made false, and fixed

`I1b` asked the next session to grep the live roadmap and the README for claims
its own change had made false. That check found four: three README sentences and
the shipped `describePrior` string, each saying the earlier findings are never
revalidated. Each was true when it was written. **`describePrior`'s second clause
is now derived from the stage that settled it** rather than asserted ahead of
one, exactly as `I1b` made the first clause conditional.

### Validation

The **sixteen** controlled suites pass, `smoke-revalidation` being the new one.
`git diff --check` is clean and the branch diff carries no control byte. The
discovery collector reads all six root files and skips none.

`ROADMAP.md` archived `I1b`'s 15018-byte entry verbatim before a word of this one
was written, on the one-live-entry rule: 7364 bytes were spare and no increment
entry has ever been that small.

### Pull request #32 and its review

`I1c` landed through pull request **#32**, on branch
`i1c-prior-finding-revalidation`, reviewed **twice** with this plugin, each time
at the user's explicit authorization. The first run: **deep, `gpt-5.6-terra` at
high effort, 144.23376 credits**, one integrated reviewer and one adjudicator,
**0 validated findings on INCOMPLETE coverage** from two execution failures and
three coverage gaps.

**Zero validated findings, and three real defects.** Two candidates were
discarded at the evidence boundary because their citations did not exactly match
a supplied context window, and the third was adjudicated `uncertain` because the
captured context did not include `finishPreview`. **All three described real
defects, and all three are fixed on this branch**, each with a test written to
reproduce it first.

| Reported | Verdict | Disposition |
| --- | --- | --- |
| The retained record refuses the proof an unsettled verdict carries | Real | Fixed; `codeProofs` now admits `touched` |
| The parser accepts a body that admits more than one split | Real | Fixed; ambiguity is refused |
| Replies read the review's selection rather than its posting authority | Real | Fixed; authority comes from the policy |

- **The first was a crash.** `codeVerdict` returns `proof: "touched"` for an
  ordinary unsettled finding, and the retained record's code-proof list did not
  admit it, so **any review that revalidated and settled less than everything
  would have thrown when it journalled itself.** Every test in this increment's
  own suite had missed it by judging its unsettled entries away before retaining
  them.
- **The second is the one this increment argued itself into.** Anchoring the
  parse pattern at both ends makes the round-trip check automatic for any match,
  which is exactly why it proves nothing about *which* split was chosen. A field
  whose prose opens a paragraph with one of the five labels admits several
  splits and every one rebuilds the same bytes. A body that admits more than one
  split is now unreadable, which is the contract the parser states.
- **The third contradicted a decision the user had taken.** Replies read
  `preview.authorized`, which an empty selection leaves false, so a re-review
  that found nothing new answered no thread. That is the case the feature exists
  for. Authority now comes from the posting policy; what an empty selection
  really removes is the *confirmation*, so in that one case the replies ask for
  themselves, and `--unattended` still cannot reach that question.

**The coverage gap is exact and nothing was changed in response, because nothing
can be.** Both the reviewer and the adjudicator reported, independently, that the
reply flow has fixture coverage only and that no live run has ever exercised the
real replies endpoint, the paginated comment response shape or the
acknowledgment payload. **That is the honest limit on what #32 demonstrates.**

**This is the second review in ten to find nothing its own evidence gate would
let through, and the first whose discarded candidates were all correct.** Read
the run's own word, which is INCOMPLETE.

### The second review of #32, which covered the three fixes

**The three fixes changed `extensions/`, so the user authorized a second review
of #32 on 2026-09-12**, the standing workflow having spent the first. It ran
`--deep --all --no-comment --unattended` through `scripts/dogfood-review.mjs` on
the same model and effort as the first: **`gpt-5.6-terra` at high effort,
115.0322 credits, 137.4 s of model work, 50 tool calls of which 49 were approved,
0 candidates and 0 validated findings on INCOMPLETE coverage** from 0 execution
failures, one coverage gap and one informational caveat. Nothing was published.

**The installed plugin was stale when that session found it**, differing from the
checkout in exactly the four files the three fixes touched, so the first review
had never seen them. It was reinstalled from the branch head and verified with a
`diff -rq` that printed nothing, before dispatch. **Check the install before
every review rather than assuming the last one left it current.**

**Nothing was changed in response, because the run reported no candidate at
all.** Its one coverage gap says the supplied revision-bound context does not
include the unchanged retained-run entry point, so the captured evidence cannot
establish whether a later run preserves or overwrites the journal of uncertain
replies. That is the recorded citation limitation rather than a new one: the
reviewer read `retained-run.mjs` from the checkout and still could not cite an
unchanged file. The informational caveat repeats the first review's live-evidence
gap about the reply mutation path and is still exact.

**The question behind that gap was answered by reading the code, and the answer
is that the journal is a record and never a resume point.** A later run's skip
decision comes from a fresh paginated read of GitHub's comments rather than from
the retained record, and `replies.mjs` says so where it does it: whether a thread
already carries our answer "is a fact about GitHub now, not about when this run
started". So an uncertain reply is never blindly retried. A later run either
finds our reply on the thread and skips it, or does not and makes a fresh
determination from live state. Neither `retained-run.mjs` nor `publication.mjs`
holds any reply path at all, so a retained record can never drive a write.

**This run produced the live `Q7` evidence that no review could arrange.** The
reviewer passed a shell brace expansion as an `rg` path,
`{README.md,HANDOFF.md,ROADMAP.md,.github/workflows/ci.yml}`, which nothing
expands, and the permission handler refused it with `Q7`'s absent-path reason
instead of a mute rejection. **It then reissued five separate `rg` calls with
real paths, which is exactly what that reason told it to do.** The run's own
evidence records the refusal as `policy.permissionDenials: ["read-absent"]`, so
the plugin reported it without anyone reading Copilot's session state.
`enforcement` stayed empty and correctly so: it carries deliberate
forbidden-tool probes, not refusals that happened.

## v1 is complete, `I1` is sliced, and two increments remain

**`D1` delivered v1, and `O1`, `E1`, `U1`, `I1a`, `I1b` and `I1c` have landed on
top of it.**
`SCOPE.md`'s must-have column, its costly-to-lose column and its additional
agreed v1 capability are all delivered.

**The user scheduled four increments, in this order: `E1`, `U1`, `I1`, `G1`.**
The first three are complete: `I1` was sliced into three with the user before
anything was built, and `I1a`, `I1b` and `I1c` are all done. **`G1` is the only
one left.** Treat any other feature idea as out of scope unless the user asks for
it in your own session.

### The next increment is `G1`, and it is the last one scheduled

**`E1`, `U1`, `I1a`, `I1b` and `I1c` are done: do not redo any of them.** `E1`'s
three recorded items stay recorded and none of them is scheduled: a run still
never reports its own cost, the evidence lines are still truncated by the
interactive UI, and per-reviewer progress still says nothing while a reviewer
works. `U1` is settled as one preflight flag that refuses. **`I1a`'s slicing is
settled and is not to be re-cut.** **`I1b` is settled as one opt-in flag that
confines**, and **`I1c` is settled as one opt-in flag that judges**, with its six
decisions recorded in the entry above and none of them to be reopened.

**`I1` is complete, so `G1` is next and it is the last increment the user
scheduled.** Do not start anything after it without the user saying so, and do
not treat a feature idea that surfaced during `I1c` as scheduled work.

**Both `I1b` and `I1c` still need one live review to be demonstrated end to
end.** Neither has had one, and both are blocked on the same thing: a pull
request this tool has published a review on and that has since moved. The only
two published reviews are on playground pull requests still at the head they
evaluated. Arranging one means publishing a real review or pushing a commit to a
playground branch. **Both are the user's call, and playground #1 and #2 must
never be merged.**

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

**Nothing above `I1c` is to be redone, widened or reopened.** Every increment's
authorization is spent, and the evidence for each is either in the entry
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

### Continuous integration, added outside the increment sequence

**The user asked for a minimal CI pipeline in the `I1b` session**, so
`.github/workflows/ci.yml` runs on every pull request and every push to `main`.
It is not an increment, has no roadmap row, and was not part of what the plugin
reviewed. **It went green on #31 before that pull request was merged**, running
all fifteen suites, reading all six instruction files and skipping none.

It runs the fifteen controlled suites and two invariants this repository has
broken before: that safeguard discovery still reads every instruction file at
the checkout root, which fails the job if one crosses 65536 bytes, and that no
tracked text carries a control byte, which is what refused #17's review. There
is no `package.json`, no dependency and no build step, so the job checks out,
installs Node and runs `.mjs` files directly.

**It deliberately runs nothing that spends Copilot credits.** The plugin review
of a pull request stays the increment's real integration test and stays the
user's explicit decision, as it has been since 2026-09-07. CI proves logic, the
same way the suites it runs do, and proves nothing about delivery.

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
- ~~**A live review in which a reviewer is refused an absent path.**~~ **The
  second review of #32 did this**, on 2026-09-12, and nobody arranged it: the
  reviewer passed a shell brace expansion as an `rg` path, was refused with
  `Q7`'s reason, and immediately reissued five `rg` calls with real paths. What
  `Q7`'s reason changes is therefore settled: the reviewer follows it. The
  entry above records the evidence.
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
- **A live confined run, and a live revalidated one.** `I1b`'s whole path and
  `I1c`'s both have fixture coverage and no live evidence: `incremental` has
  never been reported end to end, so the real compare-diff response, its
  head-side line coordinates, a real candidate set aside, a real verdict and a
  real reply write have never been seen. #31's reviewer named this as a coverage gap of its
  own accord and was right to. Closing it needs a pull request this tool has
  published a review on and that has since moved, which means publishing a real
  review or pushing a commit to a playground branch. Both are the user's call,
  and **playground #1 and #2 must never be merged.**
- **A rename inside the confined commit range.** #31's reviewer checked for one
  and reported nothing. `newRangeFrom` collects both sides' paths and keys the
  changed lines by the head path, so it is handled by construction, but no suite
  pins it and no live run has produced one.
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
