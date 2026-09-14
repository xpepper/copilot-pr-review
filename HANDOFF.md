# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and the open pull requests before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume, in the roadmap and in your final report.

## Where things stand

- `K1` is merged as pull request #45 (`8f2fcfa`), and CI on `main` passed.
  Every increment the user scheduled on 2026-09-12 is complete: `T1`, `B1`,
  `X1`, `W1`, `N1`, `H1` and `K1`.
- `K1`'s roadmap entry was moved verbatim into
  `docs/roadmap-archive-2026-09-10.md` on `archive-k1-entry` (`d742fae`),
  following `d9a837a`. It is open as pull request #46, **not merged**, and is
  documentation only. Nothing is uncommitted.
- **#46 has had no plugin review.** It is documentation only, so a review is the
  user's call and spends credits; do not run one unasked.
- `@claude[agent]` and `@codex[agent]` were asked to review #45 and had not
  answered when it merged, so nothing from them was triaged.
- The review loop's summary comment on #45 was never posted. Posting it is the
  user's call; do not retry it unasked.
- Merging #46 is the user's decision. Do not merge it, edit its description,
  reply to or resolve threads, request reviews or `@`-mention anyone on it
  without an explicit instruction.
- Open pull requests #1 and #2 are synthetic playgrounds marked "do not merge";
  leave them alone.

Verify with `git log --oneline main..archive-k1-entry`, `git status`,
`gh pr view 46 --comments`, `gh pr checks 46` and `gh pr list --state open`.

## Nothing is scheduled

No increment is scheduled and no roadmap entry is live. **Do not start anything
under "Recorded, not scheduled" in `ROADMAP.md`, and do not pick the next item
yourself.** Ask the user, one decision at a time.

**`ROADMAP.md` is 60769 bytes, 4767 under the 65536 cap.** No live entry is
left to archive, and the last three archived entries were 4586 to 4982 bytes,
so a new entry with review evidence may not fit. If it does not, ask the user
what should move before writing it.

Small things the user may want, each needing their word first:

- **A live read of a review this tool published.** No run has made one; only
  playgrounds #1 and #2 carry such a review. A read-only `discoverPriorReview`
  call against one spends no credits and writes nothing, but using a playground
  is the user's call.
- **Documenting the feedback line in `README.md`**, which has 862 bytes spare,
  so room has to be made first, as `09d8cdf` did by moving a guide into `docs/`.

## Validation

The controlled set is eighteen suites:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost benchmark; do node scripts/smoke-$s.mjs; done
```

Also run `git diff --check`, the tracked-control-byte check CI runs, and
`collectInstructionFiles`, which must read all six root files and skip none.
Check new files for control bytes with plain `grep -rnP`, and build control
characters with `String.fromCharCode` rather than typing an escape. Measure
`ROADMAP.md` with `wc -c` before every commit.

## Runtime and settled constraints

CLI 1.0.83 remains the recorded runtime; direct local installs print a
deprecation warning. Every increment lands on a branch and a pull request, never
`main`; never amend published history or force-push. Findings stay local.
Do not add review timeouts, weaken the shell gate, use `fs.realpathSync` in
`read-only.mjs`, change `F6`'s marker unwrap, or treat a compaction event as a
retry or stop condition. `K1`'s reception is information only: no reviewer,
adjudicator, `I1c` verdict, retained record or published review may read it,
and a resolved thread is never evidence of a fix. GitHub review-thread ids are
matched by `fullDatabaseId` as strings, never by the deprecated `databaseId`.

Before ending, update `ROADMAP.md` with evidence and the exact next step, then
replace this file as the final repository edit, commit both on the branch you
are working on, push, and report what changed, what was verified and how, what
was not, and what remains, pointing here.
