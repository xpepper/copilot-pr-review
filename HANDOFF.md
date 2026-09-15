# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then
`docs/published-review-feedback-plan.md`, then inspect git state and the open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what remains open. Do not rely on another
conversation, reopen settled product decisions or infer behavior from an API
declaration. Keep what you demonstrate apart from what you assume.

## Where things stand

`P7` is built on branch `p7/inline-comment-layout`, pull request #56: each inline
comment is `**[P2] title**`, the actual behaviour, `**When:**`/`**Expected:**`,
`**Fix:**`, and a `<sub>` footer with introduction, confidence and reporter.
`commentBodyBeforeP7` keeps the old template; `parseCommentFinding` reads both,
and `matchesRetainedProposal` still loads a proposal retained before `P7`.
`ROADMAP.md`'s `P7` entry has the evidence and the review. **Check whether #56 has
merged** (`gh pr list --state all --head p7/inline-comment-layout`). If it has
not, stop and ask the user. Open pull requests #1 and #2 remain the synthetic
"do not merge" playgrounds; leave them alone.

#56 was reviewed once, at the standing authorization, on a direct install of the
branch that `diff -rq` showed identical to the checkout: 125.319325 credits, 0
validated, INCOMPLETE. Overview's JSON did not parse; its one candidate (a `**`
title unreadable) was disproved by running the parser, and pinned. Contracts' P2
(an introduction holding ` · Confidence ` is unreadable) was **discarded for an
11-line quote on a 10-line `evidence[1]` range, exactly what `Q9` recovers**, and
rejected as deliberate. The marketplace install was restored, identical to
`git archive v0.1.0`. Nothing was posted.

## This session's task: `Q9`, and nothing after it

Decided in the plan's `Q9` section, with #65's three discarded candidates as the
evidence. Acceptance criteria:

- When a candidate's **location** citation passes, a **supporting** citation
  (`breaks`, `before`, `after` where it differs from the location, `evidence`
  entries) that fails the exact-quote check is dropped, and the candidate goes
  on to adjudication. A failing location still discards the candidate, and so
  does a failing `H1` rule citation: it is never a droppable supporting citation.
- The adjudicator is told which supporting citation was dropped and why, and can
  still reject a finding that no longer stands.
- Code never forwards or rewrites an inexact quote; every remaining citation
  passes the same bound, in-window, exact-quote checks. Whitespace is never
  normalised; `Q5` and `Q6` are built on, not reopened.
- The terminal reports each dropped citation, naming which of `Q8`'s three causes
  applied. **How a dropped citation counts in coverage is to be settled with the
  user while building**: put it to them as one decision with a recommendation.
- Fixtures shaped like #65's three (a range one line short, one line missing
  from the middle of a quote, an extra leading space on every line) all reach
  adjudication; test first. One plugin review of the pull request; record it.

### Caveats that are easy to miss

- **The review runs the installed plugin, and `dogfood-review.mjs` only checks
  that some copy is running.** With the user's agreement: `copilot plugin
  uninstall copilot-pr-review`, `copilot plugin install "$(pwd)"`, then `diff -rq
  --exclude=.git ~/.copilot/installed-plugins/_direct/pr-review .` must print
  nothing. Afterwards `copilot plugin uninstall copilot-pr-review` and `copilot
  plugin install copilot-pr-review@xpepper-copilot-plugins`, and compare with
  `git archive v0.1.0`. Do not edit repository files while the review runs. An
  unparsed reviewer's candidates can be read free from its `events.jsonl` under
  `~/.copilot/session-state/`.
- **Sizes**: `README.md` is at 65285 bytes, 251 spare; `ROADMAP.md` at 63324, so
  archive `P7`'s entry verbatim, just before the archive's last section as `P7`
  did `P6`'s (check with `cmp`), before writing `Q9`'s. Measure both with `wc -c`
  before every commit against the 65536-byte cap; never condense archived history.
- **Recorded, not scheduled** by `P7`: model prose holding `<!--` or `</sub>` can
  hide or unwrap the rest of an inline comment. Do not fix it inside `Q9`.
- **Import cycles**: `preview.mjs` must not import `prior.mjs` or
  `incremental.mjs`. **`O2` reopens `O1` only as far as the plan records**; do
  not start it early.
- **Releasing follows `docs/release.md`**; every tag, release and index change
  needs the user's authorization in that session.
- In zsh, a bare `====` argument is expanded and aborts a chained command, and
  an unquoted `--include=*.mjs` glob aborts `grep`; quote both.

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
