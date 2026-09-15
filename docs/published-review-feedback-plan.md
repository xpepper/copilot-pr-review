# Published review feedback: plan

Status: planning, started 2026-09-15. Not a numbered increment and not an
authorization to build. Each decision below was put to the user on its own and
answered; the increments that implement them are still to be scheduled.

## Source: the first review of somebody else's pull request that was published

`/pr-review 65 --comment --quiet --long-context` on
`primait/prima-agent-skills#65`, head `83895ed`, published as
[review 5212747956](https://github.com/primait/prima-agent-skills/pull/65#pullrequestreview-5212747956).
Balanced, `gpt-5.6-terra` high for the four specialists and the adjudicator,
`gpt-5.6-luna` high for overview, long-context window. 180.88751 credits, 9
requests, 188.4 s elapsed. 4 validated P2 findings; INCOMPLETE on three
candidates discarded at the evidence boundary (quote did not match its window),
plus four informational caveats. All five reviewers completed.

The user's feedback, as the pull request's author would read it: the published
review is hard to read, poorly formatted and carries cryptic information. What an
author needs is what lets them judge the findings and decide what to do; the
rest is noise.

## Problems observed

- The summary body is `formatCoverage` posted verbatim
  (`extensions/pr-review/preview.mjs`, `reviewRequest`): tool-internal
  diagnostics, self-evident caveats, tool jargon ("selected validated
  finding(s)", "not a clean-review claim"), and no list of the findings.
- A discarded candidate is labelled "Execution failure" although every reviewer
  completed.
- Inline comments: seven plain-text labels, no Markdown, and the fields that
  justify the finding to the tool (introduction, confidence, reporter) weigh as
  much as the problem and the fix.
- Terminal under `--quiet`: about 30 lines of configuration and trust policy, a
  mid-capture "No PR review performed ... Nothing published", and the full
  payload JSON after `--comment` had already authorized posting.
- Three of five reviewers lost their candidate on a citation mismatch, as on
  #42, #43, #44 and #50.

## Decisions

### P6: the published summary (decided 2026-09-15)

**Chosen: a short Markdown summary with a hidden marker.** Worked example on #65:

```markdown
**Balanced review: 4 findings (4 × P2)** at `83895ed`

- P2 · Require an unambiguous link before associating a top-level answer · `SKILL.md:176`
- P2 · Avoid replaying one REST GET per retained follow-up on every resume · `SKILL.md:636`
- P2 · Interrupted threaded-reply recovery cannot perform the documented body verification · `SKILL.md:362-364`
- P2 · NO_ACTION-only runs can still edit the PR body · `SKILL.md:566`

Coverage was partial: 3 more possible issues were dropped unchecked because their evidence
could not be matched to the code. Finding nothing elsewhere does not mean nothing is there.

<!-- copilot-pr-review: mode=balanced findings=4 coverage=incomplete -->
```

- Headline: mode, finding count, count per severity, short reviewed head.
- One line per finding: severity, title, location.
- One plain-language coverage sentence, generated per diagnostic kind; caveats
  and internal error text are not published. Full diagnostics stay in the
  terminal and the retained result.
- Partial coverage stays visible, as `SCOPE.md` requires.
- `prior.mjs` recognises a review of ours by the marker **or** by the old three
  fixed phrases, so reviews already published stay recognisable.

Rejected alternatives: filtering the current body (keeps the jargon and no
finding list); headline and coverage sentence only (findings scattered across a
long diff); the recommended layout plus a collapsed `<details>` with the full
diagnostics (still publishes the noise).

Details to settle when building, not reopened here: the plain-language wording
for a real execution failure and for a coverage gap; whether a location shows the
basename or the full path when two files share a basename.

### P7: the inline comment format (decided 2026-09-15)

**Chosen: problem first, fix prominent, every field kept, supporting fields in a
small footer.** Worked example on #65's fourth finding:

```markdown
**[P2] NO_ACTION-only runs can still edit the PR body**

The workflow proceeds to Step 8 before this summary rule, where detected drift invokes `gh pr edit`,
so a NO_ACTION-only run can modify the PR despite the routing policy requiring no GitHub write.

**When:** The user approves only NO_ACTION items and the existing PR body has drifted from the PR commits.
**Expected:** A NO_ACTION-only approval should perform no GitHub write, including no PR-body mutation.

**Fix:** Explicitly skip Step 8 PR-body updates when the approved set contains only NO_ACTION items,
or require separate user authorization for that write.

<sub>Introduced by this diff: NO_ACTION was added as a silent, no-write category… · Confidence 0.9 · security reviewer</sub>
```

- Order: title, actual, when, expected, fix, footer (introduction, confidence,
  reporter). The footer carries the full introduction text, not an excerpt.
- No field dropped, so `SCOPE.md`'s "preserve severity, location, confidence"
  holds with no scope change.
- `I1c`'s parser (`revalidation.mjs`) accepts both the old template and the new
  one, each held to its own byte-for-byte rebuild; `commentBody` gains the new
  template and keeps the old one for the round-trip.

Rejected alternatives: keep today's format (half of the feedback unaddressed);
bold labels only in the old order (same parser cost, problem still fourth);
drop introduction, confidence and reporter (needs a `SCOPE.md` change and leaves
`I1c` less to revalidate from).

### Q8: a candidate discarded at the evidence boundary (decided 2026-09-15)

**Chosen: its own diagnostic kind, `discarded-candidate`, which still counts
against completeness.** A candidate whose citation fails the exact-quote check
(`findings.mjs`, `collectCandidates`) was never judged; it is not an execution
failure, because the reviewer ran. It keeps the review INCOMPLETE because a
possibly real issue went unchecked, and discarded candidates were real on #23,
#28, #44 and #50. Worked example on #65's terminal:

```
Review coverage: INCOMPLETE.
Execution failures: 0; discarded candidates: 3; coverage gaps: 0; informational caveats: 4.
Discarded candidate: contracts:1: its quoted evidence did not match the code, so it was not judged.
```

- `C5` is unaffected: fallback eligibility is `envelope()` throwing on the whole
  output (`envelopeVerifier`), never a single candidate's rejection. The archived
  `C5` entry records that boundary.
- `coverage.mjs` gains the kind and its label; `retention.mjs` accepts it; a
  retained result carrying the old `execution-failure` wording still loads.
- P6's coverage sentence is chosen by kind, so a discarded candidate and a
  reviewer that did not finish read differently on GitHub.

Rejected alternatives: keep the kind and reword by matching the message prefix
(P6 would rest on a string match); a non-blocking kind (would call #65
"completed" with three unchecked issues); leave it as it is.

### O2: what `--quiet` still prints (decided 2026-09-15)

**Chosen: under `--quiet`, keep what is specific to this run and drop what is
the same every time.** This reopens part of `O1`, at the user's decision; a
verbose run is unchanged. Worked example of #65's opening:

```
Configuration: personal (/Users/…/.copilot/pr-review/config.json); project not trusted. /pr-review-config show explains precedence and trust.
Balanced mode, 5 reviewers; P0-P2 findings plus at most 3 P3/nit.
  correctness, contracts, security, performance-resources: gpt-5.6-terra high, long-context
  overview: gpt-5.6-luna high, long-context
  Fallbacks: none.
Target primait/prima-agent-skills#65: captured at 83895ed, 13 changed files. Review starting.
```

- The static policy text of `describeConfiguration` (precedence, inheritance,
  fallback rules, trust caveats) is replaced by one line naming the sources and
  pointing to `/pr-review-config show`.
- Assignments are grouped by identical model, effort and window; every model,
  effort, window and fallback stays visible.
- Inside a review run the capture line says the target was captured and the
  review is starting (`target.mjs` currently prints the capture-only sentence,
  with a doubled period, and "No PR review performed").
- A flag- or config-authorized run prints `Publishing N inline comments to #N…`
  instead of the payload JSON; a confirmation-required run still shows the
  payload, because that is what is being approved.
- Unchanged from `O1`: coverage, diagnostics, findings, rejections, selection,
  every publication outcome, and every sentence saying a result is not a clean
  review.

Rejected alternatives: fix only the capture line (leaves about 25 lines of
noise); print only findings, coverage and publication (hides which models ran,
which `O1` refused to hide); leave `O1` as it is.

## Evidence: why #65's three candidates were discarded

Read at no cost from the run's local child sessions under
`~/.copilot/session-state/` (the parent session is `bf9d3018`; `--quiet` kept the
envelopes out of its timeline, not out of the reviewers' own logs), and compared
with `git show 83895ed:<path>` in the local checkout.

Every one of the three had an **exact** location citation. Each was discarded for
one wrong *supporting* citation, and each for a different transcription error:

| Candidate | Severity | Broken citation | What was wrong |
| --- | --- | --- | --- |
| `contracts:1` "Top-level clarification answers cannot be linked to their source" | P2 | `breaks` 147-163 | Range one line short: the 18-line quote is verbatim at 147-164. |
| `security:1` "Dangling approval-state symlink bypasses the safety check" | **P1** | `breaks` 624-627 | One long line (625) left out of the middle of the quote. |
| `overview:1` "Workflow-created threaded replies can be triaged as fresh reviewer feedback" | P2 | `evidence[0]` 103-113 | Every line carries one extra leading space. |

- `security:1` was the only P1 any reviewer proposed, and it was never judged.
- `contracts:1` duplicates correctness's published finding, so nothing was lost there.
- The single message "Citation does not exactly match a supplied context window"
  is thrown for three different causes (`findings.mjs` `boundCitation`, `cite`,
  `repairCitation`: outside a window, quote mismatch, failed repair), so the
  diagnostic cannot say which happened.
- `Q6`'s clipped-end repair covers none of the three: it requires the quote's line
  count to equal the range, and refuses whitespace changes (#4's inserted-space
  fabrication).

### Q9: a wrong supporting citation (decided 2026-09-15)

**Chosen: when a candidate's location citation is exact, a supporting citation
that fails the exact-quote check is dropped rather than the whole candidate, and
the candidate goes on to adjudication.**

- Supporting means every citation other than the location (`breaks`, `before`,
  `after` where it differs, `evidence` entries). A location citation that fails
  still discards the candidate, as today. So does a failing rule citation on a
  standards finding: `SCOPE.md` (`H1`) requires that quote and refuses the
  finding without it, so it is never a droppable supporting citation.
- The adjudicator is told which supporting citation was dropped and why, and
  judges on the source it already reads; it can still reject a finding that no
  longer stands.
- Code never forwards an inexact quote and never rewrites one. Every citation
  that remains passes the same bound, in-window, exact-quote checks, so `Q5` and
  `Q6` are built on, not reopened; whitespace is still never normalised.
- The diagnostic names which of the three causes applied: outside a supplied
  window, quote mismatch (with claimed and quoted line counts), or failed repair.
- The terminal reports each dropped citation; how a dropped citation is counted
  in coverage is settled when building, alongside Q8's kind.
- On #65 all three candidates, including the P1, would have reached adjudication.

Rejected alternatives: only name the cause (recovers nothing); rebind a quote
that is verbatim at a nearby range (saves only the duplicate); accept
whitespace-only differences (reverses what `Q6` refused after #4); leave it as it
is.

## Status

All five decisions are taken, and on 2026-09-15 the user chose the slicing: five
small increments, starting with what the pull request's author sees and ending
with the terminal. They are scheduled in `ROADMAP.md` as `Pending` rows, each
named after the decision it implements, in this order:

| Order | Increment | Size | Why here |
| --- | --- | --- | --- |
| 1 | `Q8`: the discarded-candidate kind, and naming which check failed | Small | Unblocks `P6` and `Q9` |
| 2 | `P6`: the published summary with its hidden marker | Small | The author's main complaint |
| 3 | `P7`: the inline comment layout, `I1c` parsing both templates | Medium | The other half of the complaint |
| 4 | `Q9`: drop a failing supporting citation, not the candidate | Medium | Recovers candidates like #65's P1 |
| 5 | `O2`: a quieter `--quiet` | Small | Affects only the operator's terminal |

Each lands on its own branch and pull request with one plugin review. None needs
a `SCOPE.md` change as decided. Rejected slicings: bundling `Q8`, `P6` and `P7`
into one increment (fewer reviews, one mixed diff); `Q9` before `P6` (lost
findings stop sooner, published reviews stay hard to read longer); scheduling
only `Q8`, `P6` and `P7`.
