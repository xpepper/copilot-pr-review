# Investment decision: three AI code-review plugins

Assessed 2026-09-28. Status: **recommendation, adopted as the working plan for
the next steps at the owner's instruction.** The freeze it recommends is already
the de facto state (no plugin commit after 17 September), but it is not yet
confirmed as a decision. Whether to resume any development is decided by the
gates in section 6, not by this document.

This memo is self-contained: a fresh reader, human or agent, should not need the
conversation that produced it. The forward plan that implements it is
[../ROADMAP.md](../ROADMAP.md).

## Contents

1. [Recommendation](#1-recommendation)
2. [Evidence comparison](#2-evidence-comparison)
3. [Diagnosis](#3-diagnosis)
4. [Platform coupling](#4-platform-coupling)
5. [Keep, remove, stop](#5-keep-remove-stop)
6. [Next tranche: experiments, gates, caps](#6-next-tranche-experiments-gates-caps)
7. [What would change the recommendation](#7-what-would-change-the-recommendation)
8. [Open questions for the owner](#8-open-questions-for-the-owner)
9. [Basis and limits](#9-basis-and-limits)
10. [Appendix A: data map and safe reproduction](#appendix-a-data-map-and-safe-reproduction)
11. [Appendix B: seed list for Experiment 1](#appendix-b-seed-list-for-experiment-1)
12. [Appendix C: sources](#appendix-c-sources)

## The question and the objective

Three projects by the same owner implement the same idea: a multi-reviewer AI
review of a GitHub pull request, run through GitHub Copilot CLI and its SDK, with
code-gated publication of inline `COMMENT` reviews.

| Short name | Repository | Head assessed |
| --- | --- | --- |
| main | `xpepper/copilot-pr-review` (this repository) | `e71a8b9` |
| gemini | `xpepper/pr-review-gemini` (plugin `gem-pr-review`) | `3be7997` |
| glm | `xpepper/pr-review-glm` (plugin `z-pr-review`) | `d55561b` |

Repository names say nothing about runtime models. The `gem` and `glm` names are
labels; `glm` honours the GLM models used by that project's development loop.
Section 2 lists the models the reviewers actually used.

The decision is not how to rescue these projects. It is: **given what exists,
is further investment justified, in which approach, toward what outcome, and
with what explicit limit?** The provisional objective is practical developer
utility with sustainable personal maintenance: consequential defects found per
hour of the owner's attention, at low noise, a few dollars per pull request at
most, and a few minutes of waiting. Learning value and broader product ambition
are real but are not counted as return on the reviews.

### Terms used

- **Credit.** One GitHub AI credit is $0.01 (usage-based billing since
  2026-06-01, per GitHub's billing docs). The credits these tools print are the
  same unit as the runtime's per-session usage field.
- **Native review.** GitHub's own Copilot code review of a pull request, and the
  Claude Code review action or CodeRabbit where a repository runs them. They cost
  the plugins' author no development effort.
- **Candidate / validated finding.** A candidate is what a reviewer proposes. A
  validated finding survived the plugin's filters.
- **Exact-quote gate.** In main, a candidate is discarded unless every code
  quotation it cites is character-for-character the source lines it names, drawn
  only from pre-supplied windows of the changed files.
- **Adjudicator.** A final model pass with no tools that tries to disprove each
  candidate and, in main, rejects the whole candidate if any detail is unsupported.
- **INCOMPLETE.** The state main reports when any reviewer failed, any candidate
  was discarded, or any reviewer noted a coverage gap. It is never a claim that a
  pull request is clean.
- **Consequential.** A finding the owner would want fixed before merge (P0 to P2
  in the plugins' severity scale), as opposed to minor or a nit.

## 1. Recommendation

**Freeze all three (no further feature work). Make native Copilot review plus a
thin single-agent workflow the default. Spend at most 6 developer-hours on one
zero-credit audit of existing runs (Experiment 1) before deciding whether any
plugin is worth resuming.**

Confidence: moderate that more feature investment is unjustified on today's
evidence; low that the evidence can say which asset, if any, should survive. No
winner among the three is named, because nothing compares them. The engineering
is sound and the ledgers are unusually honest; the doubt is about return, not
craft.

Why, in order of weight:

1. **The core filter loses real findings by design, and the project's own ledger
   says so.** At least nine main reviews had real candidates discarded over
   citation mismatches, and 19 of the 24 reviews whose coverage state the ledger
   records ended INCOMPLETE.
2. **Recall and comparative value were never measured.** Main has 54 increments in
   11 days; 12 changed what reviewers see or how candidates are judged (by this
   memo's classification), and none has a labelled before/after.
3. **On the few same-pull-request comparisons, the zero-effort native reviewer
   matched or beat the plugins.**
4. **Three implementations of one idea, no adoption signal, and no commits to any
   of them after 17 September.** The owner's next commits went to the review skills
   repository (18 to 21 September). Two of the three depend on an API that the
   docs label experimental.
5. **Cost is not the pressure.** Across 33 recorded main reviews the median is 119
   credits ($1.19), range $0.32 to $4.14. Freezing costs almost nothing and keeps
   the option open.

Options, cheapest first (effort figures are assumptions, not measurements):

| Option | Benefit and effort | Main risk | Evidence needed |
| --- | --- | --- | --- |
| **Freeze** (recommended) | No upkeep; about 1 h to mark repositories paused | Silent rot, since the CLI ships weekly | None |
| Stop | Zero upkeep; about 2 h | Lose an on-demand second opinion that has found real bugs | Experiment 1: unique share under 10% |
| Change approach: native review plus a one-page skill or script | Most of the value for about 4 to 8 h; near-zero upkeep | Loses per-role model choice and gated posting under the owner's identity | Experiment 2: baseline within noise of the best plugin arm |
| Simplify one plugin (main `--deep`, discarded candidates shown as "unverified") | Fewer lost findings; about 10 to 20 h | Still an experimental API; benefit unproven | Experiment 3 |
| Consolidate onto one | One codebase; about 20 to 40 h of porting | Choosing a winner without a measurement | Experiment 2 winner |
| Continue as is | None shown | More machinery, still no measurement | Not recommended |

## 2. Evidence comparison

Line references are to the heads in the table above and will drift; re-verify
before relying on one.

| | main | gemini | glm |
| --- | --- | --- | --- |
| Surface | Copilot CLI extension (docs: experimental) | Agent Plugins 1.0 skill plus MCP server (generally available), plus GitHub Action, CLI, pre-commit hook | Copilot CLI extension (experimental), plus a separate autopilot development loop |
| Size | 8.2k lines, 19 offline suites | 15.9k lines (src and server), 914 tests | 4.5k lines (extension), 528 tests |
| Reviewer models seen in the owner's September logs (share of that project's reviewer session credits) | gpt-5.6-terra 94%; light tier gpt-5.6-luna; medium tier claude-sonnet-5 | claude-opus-5 57%, claude-sonnet-5 28%, gpt-5.6 family, mai-code-1.1-flash; no Gemini model | gpt-5.6-terra 100% |
| What a finding can rest on | Exact quotes from 40-line windows around each hunk of changed files only | The diff in the prompt | Anchors on the diff |
| Filter | Exact-quote gate, then a no-tools adjudicator that must prove every claim | Confidence at least 0.7, dedup, anchor and head gates; no adjudicator | Anchors, evidence for P0 and P1, one adjudicator |

Gemini's code defaults are stale (`claude-3.5` and `claude-3.7`, gemini
`src/config.js:46-52`), with a fallback to `auto`.

### main (`xpepper/copilot-pr-review`)

- **Demonstrated.**
  - A review published on an outside pull request produced 4 P2 findings, all of
    which the author acted on or consciously deferred (181 credits, 188 s). That
    repository is private; see `docs/published-review-feedback-plan.md` for what
    is already public.
  - On gemini#28 it reported the strongest of seven defects one reader found and
    did not report the other six (`docs/e1-independent-reading.md:57-64`).
  - Costs: 33 recorded reviews, median 119 credits, range 32 to 414. `--deep`
    (n=14) has median 73 and `--balanced` (n=15) median 167, on different pull
    requests, so not a controlled comparison. Latency 80 to 215 s.
  - Publication is code-gated and `COMMENT`-only, and its 19 offline suites pass.
- **Recorded failures.**
  - That outside review's only P1 candidate was dropped unjudged over one wrong
    supporting quotation (`docs/published-review-feedback-plan.md:172-196`). The
    archive concludes "the citation rule keeps discarding true findings whose
    evidence is merely mis-anchored"
    (`docs/roadmap-archive-2026-09-10.md:3764-3766`).
  - At least nine reviews (#4, #5, #23, #24, #28, #32, #43, #44, #50) had real
    candidates discarded. Of about 24 reviews with a stated outcome, 19 ended
    INCOMPLETE and about 15 validated no finding.
  - The review of the v0.2.0 version bump cost 75 credits, validated nothing, and
    three reviewers falsely claimed a document was missing
    (`docs/roadmap-archive-2026-09-28.md`, section "The installed-plugin review").
- **Unknown.** Recall (`docs/roadmap-archive-2026-09-28.md`, "Recorded, not
  scheduled"). The N1 corpus is five diffs of 10 to 28 lines and was never run
  against a model. Whether the plugin still loads on CLI 1.0.88: `README.md`
  validated 1.0.83.

### gemini (`xpepper/pr-review-gemini`)

- **Demonstrated.** The widest real use and the most valuable findings: a real P0
  token exposure in its own CI (#62), a P1 command injection through a prompt echo
  (#57), and integrity pinning of an install (#64)
  (gemini `docs/dogfooding-feedback.md:174-223,297-419`). It sits on the
  generally available plugin format.
- **Recorded failures.**
  - Reviews of #52 to #56 said "no defects" while every lens had died with
    `spawn copilot ENOENT` (gemini `docs/dogfooding-feedback.md:131-172`).
  - On #26 its lenses returned 0 findings where native Copilot found 11 valid
    (issue #27; 5 findings once `--model auto` was used).
  - On a work pull request it found one valid P1 and one false P1, while native
    Copilot found two different valid regressions and a weak test (issue #75).
  - It missed a stale-test regression on #46
    (gemini `docs/dogfooding-feedback.md:71-76`).
  - 19 of the last 60 runs of its Action workflow failed (causes not classified).
- **Unknown.** Recall. Its calibration set is a handful of synthetic diffs from
  one pull request.

### glm (`xpepper/pr-review-glm`)

- **Demonstrated.** The smallest core. Its ground test ran four reviews of merged
  pull requests: 20 of 20 lanes completed, 2.7 to 58 credits per lane, 9 to 216 s
  per review (glm `ROADMAP.md`, row `V2`). Dogfood rounds on its own increments
  found real P1s, for example that every open-pull-request publication was
  refused (glm `ROADMAP.md`, row `I7`).
- **Recorded failures.** Of 10 P2s on merged pull requests, about three were
  fixed; the rest were settled design or already fixed. The README still says
  "pre-alpha, no reviews yet" (glm `README.md:9-12`).
- **Unknown.** Any review of outside code, and any comparison with native
  reviewers.

### Baselines that already exist

- **Native Copilot review.** Billed in credits ($0.05 to $1 for a lite review,
  $0.25 to $5 for a balanced one) plus Actions minutes on private repositories. It
  reads `AGENTS.md` and repository instructions, cannot switch models, and already
  reviews the owner's pull requests. On main it left 29 inline comments on 13 pull
  requests; the author's replies accepted 23, disputed the premise of 2, parked 1,
  and 3 got no reply. Those replies came from the same agent-assisted workflow, so
  they are not independent ground truth.
- **Claude review action** (Claude Code `code-review` plugin). On main: two inline
  findings (#44, accepted and fixed; #48, no recorded disposition) and "no issues
  found" on five pull requests.
- **Copilot CLI `/review`** exists, and `/security-review` is in preview. The docs
  fetched for this memo do not say whether `/review` takes a pull request number.

## 3. Diagnosis

Five explanations matter to the decision. Type, confidence, and the smallest test
follow each.

1. **The filter is the product, and it is lossy** (design limitation; high
   confidence).
   - Reviewers may read the checkout but can cite only pre-supplied windows of
     changed files (`extensions/pr-review/findings.mjs:70,244-263`,
     `extensions/pr-review/context.mjs:234-259`). The adjudicator has no tools and
     rejects a whole candidate if any detail is unsupported
     (`findings.mjs:91-92,114-118`). Evidence in an unchanged file, such as a caller
     or a test, cannot be cited at all (`docs/gap-analysis.md:158-165`). Gemini has
     the same class of cross-file miss for a different reason: its prompt is
     diff-only.
   - Test: replay stored outputs through a relaxed gate (Experiment 3). Worth
     resolving only if the audit shows real findings hiding in the discards.
2. **No measurement, so machinery won** (evaluation gap; high).
   - 42 of main's 54 increments are capture, publication, retention,
     configuration, release, help and documentation. The repository bends to its
     own tool: the README was 65,527 of the 65,536 bytes the plugin's own reader
     allows at `e71a8b9` (`.github/workflows/ci.yml:43-59` checks it).
   - Fix: measure first.
3. **Free reviewers already cover much of the same ground** (product and need
   mismatch; medium confidence, small sample).
   - On main #43 to #45 the plugin validated nothing while native comments were
     fixed (1, 5 and 2). gemini#26 and the work-pull-request comparison point the
     same way. The caveat is that "accepted" was decided inside the same
     agent-assisted workflow.
   - Test: blind human labels (Experiment 1).
4. **The evidence base is self-review of agent-written work** (evaluation gap;
   medium to high).
   - 20 of 58 main pull requests are documentation-only and 37 more mix code with
     roadmap and handoff edits; 19 of native Copilot's 29 comments were on
     markdown. Three outside reviews are recorded. "Disappointing" may be a fair
     reading of thin data.
   - Test: outside pull requests (Experiment 2).
5. **Friction, reliability and a triple maintenance surface** (usability and
   maintenance; high that it exists, medium that it is decisive).
   - A run needs a CLI in a narrow range, `--experimental`, and the pull request
     checked out clean at its head (`README.md:56-149`). Most runs end "INCOMPLETE,
     not a clean-review claim", so the signal stops informing. Gemini failed open
     once. About 250 commits went into three codebases in 11 days, and the CLI
     shipped 1.0.84 to 1.0.89 in the same window, touching extension permission
     handlers and plugin output shapes.
   - Test: run the plugins on the current CLI with the no-inference probes, if any
     is kept.

Unrealistic expectations are a partial factor. The gap analysis puts field
false-positive rates at 40 to 70 percent, and the upstream project's own numbers
show recall of 0.86 for P0 and P1 but 0.5 for P2 on a seeded corpus
(`docs/gap-analysis.md:42-60,135-156`). That makes any reviewer a second opinion,
not a gate. It is not the main cause, because the comparison with free reviewers
has not been made.

## 4. Platform coupling

| Actual constraint (docs) | Self-imposed choice |
| --- | --- |
| Extensions are experimental, JavaScript-only, and need `--experimental` | Using extensions in main and glm; gemini shows the skill plus MCP route on the stable standard |
| All inference is metered in credits; native review cannot switch models | Copilot models only (`SCOPE.md:111-112`), though the SDK is generally available and supports bring-your-own-key |
| The CLI releases weekly | Pinning findings to CLI 1.0.83; the "agent factories unusable" blocker predates 1.0.84's Agent Factory changes (unverified) |
| | Checkout must equal the pull request head; window-only citations; no timeouts |

The coupling is shallow in code. main imports the SDK in one file
(`extensions/pr-review/extension.mjs:1-2`) and gemini has one seam
(gemini `src/subagents.js:736-853`; that whole file is 853 of its 15.9k lines). A
provider-abstraction layer is not worth building: bring-your-own-key already sits
below that seam, and nothing suggests model access limits the results.

## 5. Keep, remove, stop

**Keep** (small, portable):

- A one-page lessons note: the filter loses real findings; INCOMPLETE noise; fail-open
  silent green; hung reviewers versus no timeouts; install drift.
- Prompts worth porting to a skill: main's "try to disprove each candidate" pass
  (`findings.mjs:89-136`), but with tools and without whole-candidate rejection;
  gemini's lens checklists (gemini `src/reviewer.js:276-349`), which encode misses
  found in practice.
- The cost-and-time line (main increment `T1`): trivial to copy.
- Publication safety code (`COMMENT`-only, head-bound, uncertain-write handling) only
  if auto-posting is kept. Main has no credential redaction before publishing, so
  do not publish on repositories that hold secrets.
- The labelled audit set produced by Experiment 1, not the N1 toy diffs.

**Remove:**

- The exact-quote gate as a hard filter, window-only citations, and whole-candidate
  rejection.
- Multi-reviewer defaults until Experiment 2 supports them. Upstream's own numbers
  favour one reviewer (`docs/gap-analysis.md:135-156`), unverified for these plugins.
- Feature backlogs: `--verify` execution, incremental and revalidate, long-context,
  unattended, help, marketplace and release machinery, glm's development loop, and
  gemini's Action, architecture diagrams and pre-commit hook.

**Stop:**

- New increments and releases.
- The rule that every increment gets a paid plugin review (`AGENTS.md:53-123`). It
  produced most of the recorded review spend and mostly documentation-consistency
  signals. It only binds increments under `extensions/` or `scripts/`, which are
  frozen.
- Keeping all three plugins installed; keep one or none.

## 6. Next tranche: experiments, gates, caps

Cap for the whole tranche: **16 developer-hours and $75 of inference, two calendar
weeks, whichever comes first, with no feature work on the plugins** (all
assumptions). Experiment 1 alone is at most 6 hours and costs no credits. Any step
that spends credits needs the owner's explicit instruction in that session.

**Pre-registration.** The thresholds below were fixed on 2026-09-28 before any
result was examined. Changing one afterwards is a deviation and must be recorded
with its reason in the roadmap.

### Experiment 1 (first): audit what already exists

- **Hypothesis.** At least one plugin surfaces consequential real defects that
  native reviewers did not, at a tolerable false-positive rate. Competing
  explanations: its unique finds are documentation nits; its real finds sit in its
  own discarded candidates (so the fix is the filter, not the model); the labels
  are contaminated by agent-written replies.
- **Setup.** About 20 pull request heads that have two or more reviewers' outputs
  (seed list: Appendix B). Sources: main's raw candidates from the local Copilot
  session logs, gemini's `.gem-pr-cache` results, and native comments via `gh`.
  Every finding is bound to the head SHA it was made against. A preparer (an agent)
  strips tool names, clusters duplicates, and writes a blinded sheet; the owner
  labels each finding **consequential**, **minor** or **not real** (2 to 4 minutes
  each, code-heavy pull requests over-sampled). Neither the preparer nor any other
  model labels. Generated sheets and keys stay outside the repository.
- **Cost.** About 6 hours of the owner's time, 1 to 2 hours of preparation, no
  credits.
- **Metrics.** Per tool: unique consequential share (consequential findings that
  no native reviewer also found, over the consequential findings in the union);
  false-positive share (not real over all judged); for main, the share of real
  findings that sit in discarded candidates.
- **Criteria (assumptions, fixed now).**
  - Continue-signal: a plugin's unique consequential share is at least 30% of the
    union and its false-positive share is at most 30%.
  - Stop-signal: unique share under 10%, and native reviewers found at least 80% of
    what the plugins found.
  - Gate-signal: at least 25% of real findings sit in discarded candidates.
- **Effect.** Continue-signal leads to Experiment 2. Stop-signal leads to archive
  plus native review and a skill. Gate-signal leads to Experiment 3.

### Experiment 2: same-snapshot bake-off on outside pull requests

- **Hypothesis.** One capable agent with a short prompt matches the plugins'
  known-defect hits at half the cost. Competing explanations: adjudication cuts
  false positives enough to pay for itself; model choice explains the gap; the
  native reviewer wins because of its undisclosed model.
- **Setup.** 10 pull requests from repositories outside these projects. Six have a
  known defect (a later fix or revert names it; include at least two cross-file or
  test-regression cases, one security case, one concurrency case). Four should draw
  no finding. Arms on identical snapshots: (A) native Copilot review; (B) baseline
  of a prompt under 15 lines with read tools; (C) main `--deep`; (D) main
  `--balanced`; (E) gemini `balanced`, whose pipeline differs most (no adjudicator,
  no quotations). B, C and D use the same model so orchestration is separable from
  model. Repeat B and C twice on three pull requests to see run-to-run spread.
  Arm A may need a replay (for example a fork that recreates the pull request); if
  that is not possible, use the review stored at the time and say so, since its
  model is undisclosed. Record models, effort, credits, wall time and findings.
  Humans label; report known-defect hits and precision, never "recall", and read a
  sample of every rejected candidate.
- **Cost.** 5 to 7 hours; about $30 to $75 of inference (assumed from recorded
  medians: deep $0.73, balanced $1.67, native $0.25 to $5).
- **Criteria.** A plugin arm is worth keeping only if it hits at least 1.5 times
  the baseline's known defects across the six, or has at most half the baseline's
  false positives at equal hits, at no more than twice the cost. With ten pull
  requests, a gap under two defects is noise.
- **Effect.** Baseline at or above the plugins: write the skill. C about equal to D:
  drop multi-reviewer topologies. E beating C: consolidate on the simpler pipeline.

### Experiment 3 (only if the gate-signal fires): gate ablation replay

- **Hypothesis.** Showing rescued candidates as "unverified" recovers real findings
  at tolerable added noise. Competing explanation: the rescued ones are mostly
  duplicates or nits, or the adjudicator is what discards them.
- **Setup.** Replay stored reviewer outputs for the Experiment 1 pull requests
  through today's gate and through a gate that only requires a changed-line anchor,
  then the same adjudicator with tools. Human labels.
- **Cost.** 4 to 6 hours; adjudicator passes only, about $5 to $10.
- **Criteria.** At least 25% more real findings for at most 15 percentage points
  more false positives.
- **Effect.** Pass: one bounded increment of at most 8 hours on main, then rerun
  arm C. Fail: the filter is not the problem; pivot.

### Tranche verdict

- **Continue** (one plugin, at most 20 more hours, the others archived):
  continue-signal in Experiment 1 and a pass in Experiment 2.
- **Pivot** (a skill or script of at most 200 lines, at most 8 hours): baseline at
  or above the best plugin arm.
- **Stop** (archive all three with the lessons note): stop-signal in Experiment 1.

## 7. What would change the recommendation

- Experiment 1 shows a high unique share of consequential findings on code pull
  requests. Then invest, in one simplified plugin.
- The owner's real work pull requests show native and skill workflows drowning in
  noise or missing repo-specific rules that per-lens models and guidelines would fix.
- A need native tools cannot meet: per-role models, an audit trail, pre-push local
  review, or gated posting under the owner's own identity.
- The current CLI loads the plugins fine and Agent Factory or structured output now
  work, which lowers the cost of a simpler build. If the plugins fail to load, the
  case for stopping strengthens.

## 8. Open questions for the owner

1. **Where would a reviewer be used?** Which repositories and pull request types
   (work code or personal projects), and do they already get native Copilot review
   and a human reviewer? This decides whether any plugin has a job.
2. **Budget.** Weekly hours available for this, and who bears the Copilot credits
   and what monthly amount is acceptable.
3. **Outside pull requests.** A source of 8 to 12 pull requests with known defects
   (fix or revert history) that the owner can label; public repositories are fine
   if work code is off limits.

## 9. Basis and limits

Basis: the three repositories at the heads above (each equal to origin), their
recorded runs, pull request and issue history through `gh`, the owner's local
Copilot session logs for cost and runtime models, and GitHub's current
documentation (Appendix C).

Executed: only the offline tests, in scratch clones with an empty `HOME` (main: 19
suites, 218 passing checks; gemini: 914 tests; glm: 528 tests, all passing). That
shows the machinery works, not that the reviews are good. No review, probe or paid
evaluation was run, and nothing was published.

Limits:

- "Accepted" and "fixed" replies on pull requests came from the same
  agent-assisted workflow, so they are not independent ground truth. The tallies
  (coverage states, native dispositions, pull request types) are hand and regex
  counts, good to roughly plus or minus 10%.
- Credit figures come from the runtime's reports and one machine's logs; CI runners
  and other tools' usage are not visible. Three review-session totals for
  September, for scale: main 6.5k credits, gemini lens sessions 17.8k, glm 10.0k;
  interactive development sessions in the main directory used a further 16.3k.
- Two work pull requests are private and were not opened; the memo relies on the
  owner's own public issue text and on the outcome of the owner's own published
  review.
- Not verified: that any plugin still loads on CLI 1.0.88, and whether `/review`
  takes a pull request number. Documentation was read through a summarising fetch
  tool.
- Assertions about a reviewer's model come from session logs on one machine in
  September, not from configuration.

## Appendix A: data map and safe reproduction

Everything here is read-only and spends no credits. Do not run a review, a probe
or the plugins' publish paths to reproduce it.

**Runtime credit accounting.**

- `~/.copilot/session-state/<id>/events.jsonl` holds one `session.shutdown` event
  per finished session; `data.totalNanoAiu` divided by 1e9 is the session's credits,
  and `data.modelMetrics` splits it by model.
- `~/.copilot/session-state/<id>/workspace.yaml` holds `cwd`, `client_name` and
  `created_at`. In main and glm, `client_name: sdk` marks the sessions the plugin's
  runtime started and `github/cli` marks interactive sessions. Gemini's lens
  sessions also appear as `github/cli`; they are told apart by a `name` that starts
  with `# Specialist Code Review`. Group by `cwd`.
- A review's reported cost is the sum over its child sessions (`client_name: sdk`:
  the reviewers and the adjudicator). Checked on one outside review: its six child
  sessions sum to 180.888 credits against the ledger's 180.88751. The interactive
  parent session's own turns (12.5 credits there) are not part of a review's
  reported cost, so a project's true spend is higher than the sum of its ledger.

**Raw reviewer output, discarded candidates included.** Reviewer sessions keep the
model's reply in `events.jsonl`, wrapped between `<<<PR_REVIEW_JSON>>>` and
`<<<END_PR_REVIEW_JSON>>>`. A `--quiet` run keeps envelopes out of the parent
timeline but not out of the child sessions. Checked for one outside review: 7
sessions (parent, five reviewers, adjudicator), 6 holding reviewer JSON. Sessions
belonging to one run share a `created_at` window and a `cwd`; map a run to a pull
request through the head SHA in the retained binding and the ledger's pull request
number. Logs are local and can be pruned, so copy what an audit needs early.

**gemini results.** `.gem-pr-cache/pr_<n>_<sha>.json` in that checkout (untracked)
holds `prNumber`, `headSha`, `mode`, `findings[]` (title, severity, file, line,
confidence, lens), `rawFindingsCount`, `lensesExecuted`. It is post-filter, so it
cannot show discards.

**Native and bot reviews.** For each repository:

```sh
gh api repos/OWNER/REPO/pulls/comments --paginate \
  --jq '.[] | {id, in_reply_to_id, pr: (.pull_request_url|split("/")|last),
               user: .user.login, path, line, original_commit_id, body}'
gh api repos/OWNER/REPO/issues/comments --paginate   # summary comments (Claude action)
gh api repos/OWNER/REPO/pulls/N/reviews              # review-level bodies and commit_id
```

`original_commit_id` is the head a comment was written against; bind every finding
to it. Thread resolution needs GraphQL `reviewThreads { isResolved isOutdated }`.
Replies by the repository owner's account were written by agents; use them to see
what was done, never as a label.

**Offline tests.**

```sh
# main: the same loop as CI (.github/workflows/ci.yml)
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental \
  revalidation cost benchmark help; do node "scripts/smoke-$s.mjs"; done
# gemini and glm
node --test tests/*.test.mjs
```

Run them with `PATH` including `node` and an empty `HOME` so no credential is
reachable.

**Ledger tallies.** The 24 main reviews with a stated coverage state are the
increment rows and pull request records that say INCOMPLETE or completed:
`L1 C4 Q6 D1 E1 U1 I1b I1c(x2) B1 X1 W1 N1 H1 K1 O2 H2 S2` and the published
outside review are INCOMPLETE (19); `M2 C3 O1(x2) T1` are completed (5). Reviews
with real candidates discarded: pull requests #4, #5, #23, #24, #28, #32, #43,
#44, #50. The 12 increments that change what reviewers see or how candidates are
judged are `Q3 Q4 Q5 Q6 Q9 R1 M1 M2 H1 W1 F6 C5`; the other 42 of the 54 are
capture, publication, retention, configuration, verification, release, help and
documentation work. All of it is in
[roadmap-archive-2026-09-28.md](roadmap-archive-2026-09-28.md) and
[roadmap-archive-2026-09-10.md](roadmap-archive-2026-09-10.md).

**Pull request and comment tallies.** A main pull request counts as
documentation-only when no changed file is under `extensions/` or `scripts/`, is
`plugin.json`, or is a workflow (20 of 58), and as mixed otherwise (37 mixed, 1
code-only). A native comment's disposition is read from the first 300 to 400
characters of the reply on its thread: fixed, agreed, right or confirmed counts as
accepted; "premise does not hold" as disputed; "parked" or "declined" as parked. It
is a crude regex classification, so read the threads before quoting a count.

## Appendix B: seed list for Experiment 1

A starting point, not a sample. Verify each entry; heads differ per review.

**main (`xpepper/copilot-pr-review`).**

- Native Copilot inline comments: #29, #31, #37, #41, #42, #43, #44, #45, #46, #49,
  #50, #55, #57 (29 comments).
- Claude action inline findings: #44, #48; "no issues found" summaries: #39, #41,
  #43, #46, #54. CodeRabbit: #38.
- Plugin reviews of record: one per increment pull request that the archived
  roadmaps list with a review (their numbers and costs are in those files).
- Both a plugin review and native comments exist for: #31, #37, #41, #42, #43, #44,
  #45, #50, #55, #57 (checked against the ledger and the comment counts above).
  Prefer the code-heavy ones (#31, #44, #45, #55, #57).

**gemini (`xpepper/pr-review-gemini`).**

- Native Copilot inline comments: #24, #26, #33, #57, #59. CodeRabbit: #37.
- Plugin comments published from the owner's account: for example #26, #30, #32,
  #47, #48, #51, #53. By the hosted Action: #62, #64, #73, #78 to #83, #85, #86.
- Cached local results (`.gem-pr-cache`) include: #26, #28, #30, #32, #33, #37,
  #39, #40, #46 to #48, #52 to #57, #60, #62, #64, #73, #78. The directory also
  holds synthetic entries written by tests (names that start with `org__repo__` or
  end in a label such as `-mock` instead of a commit SHA prefix); skip those.
- Code-heavy candidates with real defects on record in gemini
  `docs/dogfooding-feedback.md`: #57, #62, #64. #78 has a cached result and no
  recorded verdict.

**glm (`xpepper/pr-review-glm`).** The plugin did not publish inline comments on
its own pull requests (the only inline comments are CodeRabbit's on #32 and
Copilot's on #48). Its runs live in the local session logs only, and its ledger
records four ground-test reviews (pull requests #37, #41, #43 and #44 of that
repository).

**Outside.** The owner's published review on a private work pull request, and the
work pull request compared in gemini issue #75, are candidates only if the owner
allows them and the resulting sheet stays local.

## Appendix C: sources

- [About GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review)
- [Usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing)
- [About extensions for GitHub Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-extensions)
- [GitHub Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
- [Requesting a code review with GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-agents/agentic-code-review)
- [Copilot SDK is now generally available](https://github.blog/changelog/2026-06-02-copilot-sdk-is-now-generally-available/)
- [Agent Plugins 1.0 in VS Code, Copilot CLI, and the Copilot app](https://github.blog/changelog/2026-08-12-agent-plugins-1-0-in-vs-code-copilot-cli-and-the-copilot-app/)
- [Request Copilot code review from GitHub CLI](https://github.blog/changelog/2026-03-11-request-copilot-code-review-from-github-cli/)
- [Copilot CLI releases](https://github.com/github/copilot-cli/releases)
