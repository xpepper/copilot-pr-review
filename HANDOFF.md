# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then
`docs/published-review-feedback-plan.md`, then inspect git state and the open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what remains open. Do not rely on another
conversation, reopen settled product decisions or infer behavior from an API
declaration. Keep what you demonstrate apart from what you assume.

## Where things stand

`P6` is built on branch `p6/published-summary`, pull request #55: the published
review body is a short Markdown summary built by `extensions/pr-review/summary.mjs`
and ending in a hidden marker, and `prior.mjs` recognises the marker or the old
three phrases. `ROADMAP.md`'s `P6` entry has the evidence, the three details the
user settled while building, and the plugin review. **Check whether #55 has
merged** (`gh pr list --state all --head p6/published-summary`). If it has not,
stop and ask the user. Open pull requests #1 and #2 remain the synthetic "do not
merge" playgrounds; leave them alone.

#55 was reviewed once, at the standing authorization, on a direct install of the
branch that `diff -rq` showed identical to the checkout: 191.475878 credits, two
validated findings (a backtick in a path breaking the location's code span, a
Set copied per finding), both fixed test first in `bb25dac`; its two discarded
candidates were the same path defect. The fixes were not re-reviewed. The user's
marketplace install was restored, identical to `git archive v0.1.0`. Nothing was
posted, so the marker has had no live GitHub round trip.

## This session's task: `P7`, and nothing after it

Each inline comment leads with the problem and a prominent fix, keeps every
field, and puts introduction, confidence and reporter in a small footer, as
decided in the plan's `P7` section, with its worked example. Acceptance criteria:

- Order: title, actual, when, expected, fix, footer (introduction, confidence,
  reporter). The footer carries the full introduction text, not an excerpt. No
  field is dropped, so `SCOPE.md`'s "preserve severity, location, confidence"
  holds with no scope change.
- `commentBody` (`preview.mjs`) writes the new template. `I1c`'s parser
  (`revalidation.mjs`) accepts both the old template and the new one, each held to
  its own byte-for-byte rebuild; the old template stays for the round-trip,
  including a body published before `W1` with no `Fix:`.
- A comment published before `P7` stays readable by revalidation. Test both
  templates, the old one with and without `Fix:`.
- A proposal retained before `P7` carries old comment bodies. An invalid record
  refuses every later review in its session (`executeRetainedReview` reads it
  first), so it must still load, as `P6`'s `matchesRetainedProposal` does for the
  summary body, or be refused cleanly; test it.
- `P6`'s summary is unchanged; do not revisit its wording or marker.
- Test first. One plugin review of the pull request at the standing
  authorization; record it in `ROADMAP.md` as every increment does.

### Caveats that are easy to miss

- **The review runs the installed plugin, and `dogfood-review.mjs` only checks
  that some copy is running.** Before the review, and with the user's agreement
  because it changes their environment: `copilot plugin uninstall
  copilot-pr-review`, `copilot plugin install "$(pwd)"`, then `diff -rq
  --exclude=.git ~/.copilot/installed-plugins/_direct/pr-review .` must print
  nothing. Afterwards restore with `copilot plugin uninstall copilot-pr-review`
  and `copilot plugin install copilot-pr-review@xpepper-copilot-plugins`. Do not
  edit repository files while the review runs; the reviewers read the checkout.
- **Sizes**: `README.md` is at 65220 bytes, 316 spare, and documents the
  published body and inline comments; `ROADMAP.md` is at 63922 bytes, so archive
  `P6`'s entry verbatim, just before the archive's last section as `P6` did
  `Q8`'s, before writing `P7`'s. Measure both with `wc -c` before every commit
  against the 65536-byte cap; never condense archived history.
- **Import cycles**: `preview.mjs` must not import `prior.mjs` or
  `incremental.mjs` (a cycle through `target.mjs` and `revalidation.mjs`, which
  imports `commentBody`). Shared text goes in a module with no such imports, as
  `summary.mjs` does.
- **`Q9` never drops a rule citation** that `H1` requires, and **`O2` reopens
  `O1` only as far as the plan records.** Do not start either early.
- **Releasing follows `docs/release.md`**; every tag, release and index change
  needs the user's authorization in that session.
- In zsh, a bare `====` argument is expanded and aborts a chained command; quote
  separators.

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
