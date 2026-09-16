# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md). Completed entries through `S1` were moved verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) by
the moves listed under "Every completed increment" below, so this file keeps
the increments table and the closing section, and stays
small enough for this project's own safeguard discovery to read. **With `D1`
complete v1 is done, and `O1`, `E1`, `U1`, `I1a`, `I1b`, `I1c` and `G1` have since
landed on top of it.** `I1` was sliced into three with the user before anything was built,
and `G1` was the last increment scheduled before the backlog was agreed; **every
increment scheduled up to `G1` is complete.** On 2026-09-12 the user triaged
`G1`'s twelve proposals one at a time and scheduled six of them: `T1`, `B1`,
`W1`, `N1`, `H1` and `K1`, in that order, and the same day scheduled `X1`
immediately after `B1`. **`T1`, `B1`, `X1`, `W1`, `N1`, `H1` and `K1` are
complete and archived.** On 2026-09-14, outside that backlog, the user
scheduled `S1`, now complete and archived. On 2026-09-15 the user scheduled five
more from the first review published on somebody else's pull request: `Q8`,
`P6`, `P7`, `Q9` and `O2`, in that order; **all five are complete.** On
2026-09-16 the user scheduled one thing, `H2`, so that the plugin is easy to
start using through its own help; **it is complete.** After #59 merged, the user
scheduled `S2`: cut and list `v0.2.0`. **It is complete, and nothing is
scheduled after it.**
The closing section records what was decided, and what stays open as a
limitation rather than as work.

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
| G1 | Completed | Gap analysis against the field, then a proposal, recorded in `docs/gap-analysis.md`. Ten sources read at the user's choice of the widest sweep: upstream at the pinned baseline and again at its current head, the four skills the roadmap named, the closest peer plugin, GitHub's own reviewer, the hosted field, and the one independent benchmark in it. Nothing was copied and `L1`'s rule held. Upstream has since converged on `I1a`-`I1c`, shipping the same four head relationships and the same three prior-finding verdicts independently. The field's dominant complaint is false positives at 40-70 per cent, which is the axis this tool is built on and has never measured; upstream publishes recall against a seeded corpus and this project has nothing equivalent. Upstream's own committed numbers have deep matching the best recall with no false positive and no clean-control noise at a median no slower than the five-reviewer default, which makes this project's inherited default a question rather than a setting. Four tools steer reviews with the project's own written standards and this one hands its collected instruction files to no reviewer. One concrete publication defect was found: no redaction exists anywhere, so a reviewer that writes a credential into its own prose publishes it. Twelve adoptions are ranked with a proposed five-stage sequence; every one was a scope decision for the user and **none was scheduled by `G1` itself**. The user triaged all twelve one at a time on 2026-09-12 and scheduled six of them, which are the `Pending` rows below; `G1`'s ranking and its sequence did not survive that triage and the document stands as the record of what was argued, not as a plan. Documentation-only pull request #33. | I1c; [Upstream baseline](SCOPE.md#upstream-baseline) |
| T1 | Completed | A finished review reports what it cost and how long it took, on one line beside its coverage: the credit total the runtime reported, the model time its passes spent and the time the run took. Both elapsed figures, at the user's choice, because in a parallel mode summed model time far exceeds the clock and neither answers the other's question. Every pass the run paid for is counted, also at the user's choice: four stages start one and only two put their reviewers on the outcome, so the safeguard discovery pass, the revalidation pass and the failed attempt a fallback replaced were each dropping their charge, and a total read off the outcome alone under-reported every `--verify` and every `--revalidate` run. An unreported charge leaves the total unavailable rather than a partial sum. Not part of `formatCoverage`, which `preview.mjs` embeds in the published body, so a spend is never posted to a pull request; not suppressed by `--quiet`; and a report about a finished run rather than a budget, so nothing reads it and no timeout exists. The one-line `SCOPE.md` change was put to the user as exact wording and approved before the file was edited. Pull request #37, reviewed once with this plugin at the user's authorization: deep on `gpt-5.6-terra` at high effort, 64.24808 credits over 5 requests, 72.9 s of model work in 2 passes against 91.0 s elapsed, 12 approved tool calls and no denial, completed coverage, one informational caveat, and 1 validated finding that was real, exact, and is fixed here. | G1; [Release boundary](SCOPE.md#priority-and-release-boundary) |
| B1 | Completed | A pass whose context the runtime compacted or truncated is a coverage gap rather than silence: `runReviewer` records the runtime's own events, and a reviewer or adjudicator with any adds one gap naming the pass, never a file. Findings survive, the review is INCOMPLETE, and nothing stops, retries or falls back. **The honesty half only.** This project's own logs held seven compacted reviewer sessions in four reviews that no run reported. Pull request #39, reviewed once with this plugin at the user's authorization: deep, 31.73861 credits, INCOMPLETE on one exact gap and one refused candidate, rejected, and no false gap. No live compaction has run through this code. `G1`'s menu item 11. | T1; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| X1 | Completed | `--long-context`, one flag chosen per run and saved nowhere, asks every model pass for its model's long-context window when its session catalog lists one. A model that lists none keeps its own window and says so; a window the runtime does not keep is refused before any send. Every pass names its window in the display and on the evidence line. A probe spending nothing found `getCurrent()` echoes any tier, so the catalog decides. `SCOPE.md` gained one paragraph the user approved. Pull request #41, reviewed once at the user's authorization: deep with `--long-context` on `gpt-5.6-terra` at high effort, 45.55611 credits, the first live long-context pass, INCOMPLETE on two test-coverage gaps and 0 findings. | B1; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| W1 | Completed | Every validated finding carries one adjudicated remediation sentence in its presented and published forms. Missing, multi-line, multi-sentence and code-block-bearing prose is refused at ingestion and again before publication; older retained results still load but cannot publish without a new review. No committable suggestion block. Pull request #42, reviewed once with this plugin at the user's authorization: deep on `gpt-5.6-terra` at high effort and its default window, 81.62026 credits, INCOMPLETE on two invalid citation paths, 0 validated findings and two useful candidate signals, one fixed and one retained as an explicit parser limitation. | X1; [Selection/publication](SCOPE.md#selection-publication-and-cached-results) |
| N1 | Completed | A seeded corpus and a deterministic scorer, **the free half only**: five plain-text diffs pinned by content hash, three seeded cases carrying four defects with stable ids, target and allowed severities, acceptable locations and concept groups, and two clean controls; a scorer needing no model or network that rejects explicit non-findings before matching and pairs findings with defects one-to-one, run by an eighteenth controlled suite and CI. No collection run, recall number or gate. Pull request #43, reviewed once with this plugin at the standing authorization: balanced, 127.050688 credits, INCOMPLETE, 0 validated findings, and one real candidate raised by two reviewers and refused on its citation, fixed anyway. | W1; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| H1 | Completed | By default the project's own written rules steer the review: the root instruction files the reviewed head commits reach the one reviewer that weighs the whole change, up to a 48 KiB budget; a finding relying on one must quote the rule as exact lines of its file, bound like a source citation; `--no-standards` turns it off for one run. The user reversed the opt-in this row first proposed and approved the `SCOPE.md` paragraph word for word. **It settles what a claim not grounded in a provable code effect must carry: a quotable rule**, which the history and path-conditioned lenses would inherit. Pull request #44, reviewed once at the standing authorization: balanced, 319.760535 credits, INCOMPLETE, 0 validated findings; three refused candidates were real and are fixed, one through the user's budget decision. `G1`'s menu item 4. | N1; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| K1 | Completed | A later review reports how this tool's earlier review of the same pull request was received, on one line under `Prior review:` at every verbosity: threads resolved, unresolved and unread, and the thumbs counts. Reactions come from the listing `I1a` already reads; resolution is one paginated GraphQL read matched by database id. Unread is never unresolved or zero, a failed read is reported and the review proceeds, and nothing reaches a reviewer, the adjudicator, a verdict, the retained record or the published review. Built test first and mutation-checked. Pull request #45, reviewed once at the standing authorization: balanced, 184.483837 credits, INCOMPLETE, 0 validated findings, and one refused candidate, declined; Copilot's `databaseId` finding was fixed after it. No read of a review this tool published has run. `G1`'s menu item 12. | H1, I1c; [Publication controls](SCOPE.md#selection-publication-and-cached-results) |
| S1 | Completed | Cut `v0.1.0` and list it, in one session: a pull request bumps `plugin.json` to `0.1.0`, the merge commit is tagged `v0.1.0`, an install from that tag is shown to load, and a `copilot-pr-review` entry pinned to that tag reaches `xpepper/copilot-plugins` through a pull request the user merges. Every tag, release and write to the index needs the user's explicit authorization in that session. Planned in `docs/release-and-marketplace-plan.md`, which records the seven decisions the user took on 2026-09-14 and the acceptance criteria. Pull request #50, reviewed once: balanced, 34.887503 credits, 1 validated finding, fixed. Listed by xpepper/copilot-plugins#1; the marketplace install is `0.1.0` and loads. | K1; outside the backlog, at the user's request; no scope clause |
| Q8 | Completed | A candidate discarded at the evidence boundary is its own diagnostic kind, `discarded-candidate`, still counting against completeness, not an execution failure; its message names the failing field and which citation check failed. `C5` eligibility unchanged. Pull request #54, reviewed twice with the user's authorization, the second run on the branch install. | S1; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| P6 | Completed | The published body is a short Markdown summary: severity counts and head, one line per finding, one plain coverage sentence chosen by kind, a hidden marker; no caveats or internal errors, but a confined run still says it covers less. `prior.mjs` accepts the marker or the old phrases. Pull request #55, one plugin review on the branch install. | Q8; [Publication](SCOPE.md#selection-publication-and-cached-results) |
| P7 | Completed | Each inline comment leads with the problem and a prominent fix, keeps every field, and footers introduction, confidence and reporter; `I1c` parses old and new templates byte for byte, and a proposal retained before `P7` still loads. Pull request #56, one plugin review on the branch install. | P6; [Publication](SCOPE.md#selection-publication-and-cached-results) |
| Q9 | Completed | With an exact location citation, a failing supporting citation is dropped instead of the candidate, reported as a caveat the adjudicator reads; the location and an `H1` rule citation never are. Pull request #57, one plugin review on the branch install. | Q8; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| O2 | Completed | `--quiet` replaces the static configuration policy with one line naming the sources this run read, groups reviewers by identical model, effort and window, says a captured target's review is starting, and says what an authorized run will publish instead of printing its payload JSON; every model, effort, window, fallback, coverage and publication line stays. Pull request #58, one plugin review on the branch install: 193.076478 credits, INCOMPLETE, 0 validated, one real finding fixed here. The standing review cannot print quiet output, because `dogfood-review.mjs` refuses the flag. | Q9; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| H2 | Completed | `/pr-review help` answers the question people actually open with, in 35 lines: the five modes, the options grouped by the decision each one makes, and the lifecycle commands. The 155 lines it used to print keep every word behind `help --all`, minus a first line that called this plugin a runtime feasibility prototype; a mistyped flag now appends the orientation rather than the reference. Both texts moved to `help.mjs`, which a controlled suite can import, because `extension.mjs` calls `joinSession` at the top level and nothing cheap could ever read this text: three false user-facing strings had shipped in it. `smoke-help.mjs` checks it against the parsers' own exported flag lists, so an undocumented flag fails CI. `status` and a bare `/pr-review` are deliberately unchanged. Pull request #59, one plugin review on the branch install: balanced, 119.146906 credits, INCOMPLETE, 0 validated and no candidate raised at all; its only signal, that the dispatch was not shown end to end, was closed by a zero-inference `smoke-runtime.mjs --targets --startup` run against a verified-identical install. | O2; user-scheduled 2026-09-16; no scope clause |
| S2 | Completed | Cut and listed `v0.2.0`, the first release after #54-#59. Pull request #60 was reviewed once on the verified branch install, then merged; the tagged build and marketplace build both matched the tag and passed the no-inference runtime probe. Listed by xpepper/copilot-plugins#3. The GitHub Release is published. | H2; [Release boundary](SCOPE.md#priority-and-release-boundary); [release procedure](docs/release.md) |

## Every completed increment, `F1` through `H2`, is archived

Every completed increment entry, `F1` through `H2`, and the working record kept
between them are in
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md),
verbatim, as the evidence of record. Read it for the evidence behind an older
increment; do not redo, widen or reopen anything in it. **`Q8` moved this
section's own record of the seventeen earlier moves there too**, verbatim, as
that file's last section, because 870 bytes were spare here and no live entry
was left to archive; the user chose that move on 2026-09-15. **`P6` moved
`Q8`'s 4105 bytes** verbatim, just before that section, because `P6`'s entry did
not fit beside it; **`P7` moved `P6`'s 4273 bytes**, **`Q9` moved `P7`'s 3510**,
**`O2` moved `Q9`'s 4220**, **`H2` moved `O2`'s 7187** and **`S2` moved
`H2`'s section** the same way. **`O2`
also moved `G1`'s 2685-byte reference list** there, verbatim and just before
that last section, when its own
review record left this file 1033 bytes over the cap and this project's own
discovery stopped reading it. The rule stands:
keep the most recent entries live, archive the rest verbatim, and measure this
file with `wc -c` against the 65536-byte cap before opening a pull request.
[docs/upstream-licensing.md](docs/upstream-licensing.md) did not move.

## `S2`: cut and list `v0.2.0`, complete

**Built on `release/v0.2.0`**, after #59 merged. The user asked to draft a new
release and make sure it becomes available from the marketplace.

### Release boundary

`v0.2.0` is the required next version under [docs/release.md](docs/release.md).
Since `v0.1.0`, #54-#59 added new user-visible capabilities, and #55-#56 changed
publication formats that later reviews read back. While the major version is
zero, either category bumps the minor version. The compatibility path remains:
`prior.mjs` recognises both the marker introduced by #55 and the exact older
summary shape, and the controlled prior-review suite pins both.

The release contains:

- #54: discarded candidates have their own diagnostic kind;
- #55: published reviews use a short summary with a hidden identity marker;
- #56: inline comments lead with the problem and a prominent fix;
- #57: one failing supporting citation no longer drops the whole candidate;
- #58: `--quiet` reports compact, useful progress and publication intent;
- #59: short orientation help, with the full reference behind `help --all`.

This pull request changes only the canonical version and release records. The
controlled suites are regression evidence, not evidence that the manifest says
the intended version, so validation separately parses `plugin.json`, asserts
`version === "0.2.0"`, and asserts the load-bearing name is unchanged.

### The installed-plugin review

Pull request #60 was reviewed once at the standing authorization, after the user
agreed to replace the marketplace install temporarily. The direct install was
byte-identical to commit `e97aea4`. Balanced used `gpt-5.6-terra`/high for four
heavy reviewers and the adjudicator, and `gpt-5.6-luna`/high for overview:
75.476181 credits over 17 requests, 205.4 seconds of model work in six passes,
82.6 seconds elapsed. Coverage was INCOMPLETE, with 0 validated findings, 0
execution failures, 3 discarded candidates, 3 coverage gaps and 1 informational
caveat. Nothing was published.

Three reviewers independently claimed the removed live H2 record was absent
from the archive. That was false: the unchanged archive already contains the
complete H2 section, and the adjudicator rejected the one candidate that reached
it because the captured context could not establish the claimed loss. The
fourth reviewer correctly noticed that this section still told readers to open
the pull request which was already open; its candidate failed the exact quote
gate and is fixed below anyway. No rerun is authorized or needed for that
documentation correction. The marketplace `v0.1.0` install was restored and
verified byte-for-byte against `git archive v0.1.0`.

GitHub's controlled-suites job passed. The separate `claude-review` workflow
failed twice before making any model call because the user's Claude five-hour
credits were exhausted. At the user's explicit instruction, #60 was merged
regardless; those zero-usage failures remain neither a review nor evidence about
the change.

### Release and marketplace evidence

- #60 squash-merged as `3889064`. All 19 controlled suites, manifest assertions,
  self-readability, control-byte and diff checks passed again at that exact
  commit.
- Annotated tag `v0.2.0` points to `3889064` and was pushed only after those
  checks.
- A detached checkout of the tag installed as `copilot-pr-review (v0.2.0)`;
  its cached copy matched the tag byte-for-byte and
  `smoke-runtime.mjs --targets` passed, including its assertion that no model,
  subagent or tool execution occurred.
- xpepper/copilot-plugins#3 changed the entry's version and source ref together
  to `0.2.0`/`v0.2.0` and updated the README row. It squash-merged as
  `8e8f113`; the merged manifest and README were read back and agree.
- After refreshing the marketplace, the marketplace install listed
  `copilot-pr-review@xpepper-copilot-plugins (v0.2.0)`, matched
  `git archive v0.2.0` byte-for-byte, and passed the same no-inference probe.
- The user first authorized a draft GitHub Release, then explicitly chose it as
  the next action. It was published for tag `v0.2.0` on 2026-09-16:
  <https://github.com/xpepper/copilot-pr-review/releases/tag/v0.2.0>.

### The exact next step

**Nothing is scheduled.** `S2` is complete and the marketplace installation is
the verified `v0.2.0` release. Ask the user what to work on; do not pick from
the "Recorded, not scheduled" list.

## v1 is complete, and five more increments are scheduled on top of it

**`D1` delivered v1, and `O1`, `E1`, `U1`, `I1a`, `I1b`, `I1c` and `G1` have
landed on top of it.**
`SCOPE.md`'s must-have column, its costly-to-lose column and its additional
agreed v1 capability are all delivered.

**The user scheduled four increments, in this order: `E1`, `U1`, `I1`, `G1`.**
All four are complete: `I1` was sliced into three with the user before anything
was built, and `I1a`, `I1b` and `I1c` are all done.

### The backlog the user agreed on 2026-09-12

`G1` ended with twelve proposals and none of them scheduled. The user was put
through all twelve one at a time, cheapest first, and **scheduled six**: `T1`,
`B1`, `W1`, `N1`, `H1`, `K1`, in that order, which is the order of the remaining
rows above and the order the next session works in, with `X1` inserted after
`B1` the same day. **`T1`, `B1`, `X1`, `W1`, `N1`, `H1` and `K1` are done.** The user chose that order over starting with the measurement and
over starting with the largest capability gap, and chose the mnemonic IDs over
one series off `G1`.

**`S1` followed, outside this backlog, and is complete**; the user asked for
it on 2026-09-14. A planning session that was not a numbered increment, like the
triage, put seven decisions to the user and recorded them in
[docs/release-and-marketplace-plan.md](docs/release-and-marketplace-plan.md): the
light glm-style release model with no `package.json`, the name
`copilot-pr-review`, `0.1.0` first, the index changed only by a pull request the
user merges, and a fresh authorization for every tag, release and index change.
**Do not reopen them.** Do not start anything under "Recorded, not scheduled"
below, and do not pick one yourself. `K1`'s archived entry records what it did not demonstrate,
including any read of a review this tool published.

**Three of the six were scheduled as a named half, and the other half of each is
not scheduled.** `B1` takes the honesty half of the large-diff item and not the
size-triggered transport. `W1` takes the remediation sentence and not the
committable suggestion block. `N1` takes the corpus and the scorer, which cost
nothing to run, and not the collection runs that spend credits, and not a
baseline gate. **Do not widen any of the three on your own judgement.**

**Six of `G1`'s twelve were not scheduled** and are listed under "Recorded, not
scheduled" below with the reason: credential redaction, the `same-head`
short-circuit, the default-mode decision, the history lenses, path-conditioned
reviewer firing, and anchoring findings outside the diff. **A proposal in
`docs/gap-analysis.md` is still not an authorization**, and neither is a row in
that list. **The triage itself was not a numbered increment.**

**Five of the seven need a scope decision, and that decision is the user's every
time, taken in the session that builds the increment and never assumed from this
row.** `T1` took its as one approved sentence, and `X1`, `W1` and `H1` each took
an approved paragraph. `K1` took an approved paragraph on 2026-09-14, in
`dc3a14b`. **`B1` and `N1` fit
`SCOPE.md` as written** and need no decision at all.

### The published-review feedback the user agreed on 2026-09-15

The first review this tool published on somebody else's pull request,
`primait/prima-agent-skills#65`, read as noise to its author. The user took five
decisions one at a time, then the slicing, and **scheduled `Q8`, `P6`, `P7`,
`Q9` and `O2`, in that order**. Each decision, its worked example, the rejected
alternatives, and the evidence that #65's only P1 candidate was discarded
unjudged are in
[docs/published-review-feedback-plan.md](docs/published-review-feedback-plan.md).
**Do not reopen them.** None needs a `SCOPE.md` change as decided; `O2` reopens
part of `O1` by the user's decision. The planning was not a numbered increment.

### What is settled and must not be redone

**`E1`, `U1`, `I1a`, `I1b`, `I1c`, `G1`, `T1`, `B1`, `X1`, `W1`, `N1`, `H1` and `K1` are done: do not redo any.**
**`E1` raised three items and `T1` closed the first**, a run that never reported
its own cost. The other two stay recorded and stay unscheduled: the evidence lines are still truncated by the interactive UI, and
per-reviewer progress still says nothing while a reviewer works. `U1` is settled as one preflight flag that refuses. **`I1a`'s slicing is
settled and is not to be re-cut.** **`I1b` is settled as one opt-in flag that
confines**, and **`I1c` is settled as one opt-in flag that judges**, with its six
decisions recorded in
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) and none
of them to be reopened.

**`G1` is complete and its analysis stands as written.** Its ranking and its
five-stage sequence do not: **the user's triage supersedes both**, and
[docs/gap-analysis.md](docs/gap-analysis.md) stays as the record of what was
argued at the time rather than as a plan. Where the user's ordering differs from
the document's, the user's wins.

**Both `I1b` and `I1c` still need one live review to be demonstrated end to
end.** Neither has had one, and both are blocked on the same thing: a pull
request this tool has published a review on and that has since moved. The only
two published reviews are on playground pull requests still at the head they
evaluated. Arranging one means publishing a real review or pushing a commit to a
playground branch. **Both are the user's call, and playground #1 and #2 must
never be merged.**

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

It runs every controlled suite, eighteen of them since `N1`, and two
invariants this repository has
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

**The six of `G1`'s twelve the user did not schedule on 2026-09-12**, each put
to them on its own and each answered:

- **Redacting credential-shaped text before publication.** No redaction exists
  anywhere, so a reviewer that writes a credential it found into its own prose
  has that sentence published verbatim. The user deferred it when merging #33
  and left it deferred at triage. It is named as a limit in `README.md`.
- **Skipping the reviewers when nothing has moved.** Capture already reports
  `same-head` and that relationship still narrows nothing, so a re-review at an
  unchanged head runs at full cost. The user chose to record it rather than
  schedule it.
- **Deciding the default mode on evidence.** `SCOPE.md` fixes balanced.
  Upstream's own numbers put that in question and **nothing can settle it until
  `N1`'s collection runs exist, which are not scheduled.** Blocked, not queued.
- **The history lenses**, meaning git blame on the changed lines and the review
  comments left on earlier pull requests touching the same files, and **firing
  reviewers on what the diff actually touched.** Both were put with `H1` as one
  question; the user took `H1` alone. **`H1` settles the evidence rule these
  would inherit**, and it has landed, so that no longer holds either back.
- **Anchoring findings that land outside the diff.** The deepest change on the
  menu, and the anchor rule it would loosen is what keeps a review about this
  pull request rather than about the repository. Not scheduled.

**The limitations recorded before the triage**, which the triage did not change
except where a bullet says so:

- ~~**A review against a substantial code diff.**~~ **`E1` did this**, on
  `xpepper/pr-review-gemini#28`: 1427 changed lines over 16 files, one real
  finding, 81.48022 credits. The archived entry records what it revealed. What
  stays open after it is recall: nobody has measured what a review misses, and
  doing so needs a defect corpus with agreed ground truth that this project does
  not have. **`G1` established that upstream has exactly that** and publishes
  numbers from it, and **`N1` has delivered the half of that which costs
  nothing**: the corpus and the deterministic scorer. **The collection runs that
  would actually produce a recall number are not scheduled**, so recall stays
  unmeasured until the user authorizes them.
- ~~**A run that reports what it cost.**~~ **Closed by `T1`**, whose entry is
  archived. The scope decision it needed was taken on 2026-09-12 and the sentence
  was approved before the file was edited.
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
  `Q7`'s reason changes is therefore settled: the reviewer follows it. `I1c`'s
  archived entry records the evidence.
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
- **A reviewer can publish a credential it found.** **`G1` found this by
  reading and did not fix it**, because its authorization was analysis and a
  change under `extensions/` would have needed an installed-plugin review it was
  not authorized to spend. There is no redaction anywhere in this tool. The
  published inline comment carries the reviewer's own prose in five fields and
  nothing constrains what that prose contains; the citation quotes are not
  published, which narrows the exposure without closing it. The security
  specialist is the reviewer explicitly pointed at secrets and therefore the one
  most likely to quote one into its own sentence, which would then be posted
  verbatim on a public pull request under the user's identity. `G1` ranked it
  first of its twelve and first in the proposed sequence; **the user has since
  overruled that ranking, calling it a nice-to-have to be taken later**, so it
  stays here as open and deferred rather than as the next thing to build. It is
  still the one item here a reader should weigh before authorizing a publishing
  run on a repository that holds secrets.
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
