# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then
`docs/published-review-feedback-plan.md`, then inspect git state and the open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what remains open. Do not rely on another
conversation, reopen settled product decisions or infer behavior from an API
declaration. Keep what you demonstrate apart from what you assume.

## Where things stand

The previous session was planning, not a numbered increment. The user used the
installed plugin on somebody else's pull request for the first time,
`/pr-review 65 --comment --quiet --long-context` on
`primait/prima-agent-skills#65`, and found the published review noisy and
cryptic. Five decisions and the slicing were put to the user one at a time and
answered. They are recorded, with worked examples, rejected alternatives and
evidence, in `docs/published-review-feedback-plan.md`, and scheduled as five
`Pending` rows in `ROADMAP.md`, in this order: **`Q8`, `P6`, `P7`, `Q9`, `O2`**.
`S1`'s entry was archived verbatim to make room.

That work is on branch `plan/published-review-feedback`, documentation only.
**Check whether its pull request has merged**
(`gh pr list --state all --head plan/published-review-feedback`). If it has not,
stop and ask the user. Open pull requests #1 and #2 remain the synthetic "do not
merge" playgrounds; leave them alone.

## This session's task: `Q8`, and nothing after it

A candidate discarded at the evidence boundary becomes its own diagnostic kind
instead of an execution failure. Acceptance criteria:

- `coverage.mjs`: a `discarded-candidate` kind in `diagnosticKinds`, labelled
  "Discarded candidate", counted on its own in `formatCoverage`'s count line. It
  still counts against completeness (`blockingIssues` excludes only caveats).
- `findings.mjs` `collectCandidates`: the `rejected at evidence boundary` catch
  emits the new kind. Its message names which check failed. Today one message,
  "Citation does not exactly match a supplied context window", is thrown for
  three causes in `boundCitation`, `cite` and `repairCitation`: outside a
  supplied window, a quote mismatch (give the claimed range and the quoted line
  count), and a failed clipped-end repair. Check every other caller of those
  functions (publication re-cites) keeps working.
- `retention.mjs` accepts the kind; a retained result carrying the old wording
  still loads.
- `C5` is unchanged: fallback eligibility is `envelope()` throwing on the whole
  output, never one candidate's rejection. Pin that in a test.
- Test first. `scripts/smoke-review.mjs` pins the old label in four places.
- `P6` has not landed, so `formatCoverage` is still embedded in the published
  body; `prior.mjs` recognition must still match what `Q8` publishes.
- One plugin review of the pull request at the standing authorization; record
  it in `ROADMAP.md` as every increment does.

**#65's three discarded envelopes** are readable locally in
`~/.copilot/session-state/{1c2ba35c-d25d-4bb5-9ed9-5851a1dba82e,f182b4ec-82df-468e-a607-e4bb6161cb0a,40d654c8-1fac-4c8d-b422-0f1f69486e93}/events.jsonl`.
They are private `primait` content: use them to understand the three causes,
**never copy them into this public repository** as fixtures; write synthetic ones.

### Caveats that are easy to miss

- **`ROADMAP.md` is at 64666 bytes and has no live entry left to archive.** An
  increment entry (five to eight kilobytes) will not fit. Ask the user how to
  make room before writing `Q8`'s entry; do not condense archived history.
  `README.md` is at 64855. Measure both with `wc -c` before every commit.
- **`Q9` never drops a rule citation** that `H1` requires, and **`O2` reopens
  `O1` only as far as the plan records.** Do not start either early.
- **Releasing follows `docs/release.md`**; every tag, release and index change
  needs the user's authorization in that session. `plugin.json`'s `name` is
  load-bearing. `xpepper/pr-review-gemini#58` is still open; check before raising.

## Validation

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost benchmark; do node scripts/smoke-$s.mjs; done
```

Also run `git diff --check`, the tracked-control-byte check CI runs, and
`collectInstructionFiles`, which must read all six root files and skip none.
Build control characters with `String.fromCharCode` rather than typing an escape.

## Runtime and settled constraints

CLI 1.0.83 remains the recorded runtime. Every increment lands on a branch and a
pull request, never `main`; never amend published history or force-push.
Findings stay local. Do not add review timeouts, weaken the shell gate, use
`fs.realpathSync` in `read-only.mjs`, change `F6`'s marker unwrap, or treat a
compaction event as a retry or stop condition. `K1`'s reception is information
only. GitHub review-thread ids are matched by `fullDatabaseId` as strings.

Before ending, update `ROADMAP.md` with evidence and the exact next step, then
replace this file as the final repository edit, commit both on your branch, push,
and report what changed, what was verified and how, what was not, and what
remains, pointing here.
