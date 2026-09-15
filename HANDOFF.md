# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then
`docs/published-review-feedback-plan.md`, then inspect git state and the open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what remains open. Do not rely on another
conversation, reopen settled product decisions or infer behavior from an API
declaration. Keep what you demonstrate apart from what you assume.

## Where things stand

`Q8` is built on branch `q8/discarded-candidate`, pull request #54: a candidate
refused at the evidence boundary is a `discarded-candidate` diagnostic, still
blocking completed coverage, and its message names the failing field and which
of three citation checks failed. `ROADMAP.md`'s `Q8` entry has the evidence and
the plugin review. **Check whether #54 has merged**
(`gh pr list --state all --head q8/discarded-candidate`). If it has not, stop
and ask the user. Open pull requests #1 and #2 remain the synthetic "do not
merge" playgrounds; leave them alone.

#54 was reviewed twice. The first run used the stale marketplace `v0.1.0`
install, so the user authorized a second run on a direct install of the branch;
both runs, their costs and every finding kept or rejected are in `Q8`'s entry.
The user's marketplace install was restored afterwards. Nothing was posted.

## This session's task: `P6`, and nothing after it

The published review body becomes a short Markdown summary, as decided in the
plan's `P6` section, with its worked example. Acceptance criteria:

- Headline: mode, finding count, count per severity, short reviewed head. One
  line per finding: severity, title, location. One plain-language coverage
  sentence chosen by diagnostic kind (`execution-failure`, `discarded-candidate`,
  `coverage-gap`); caveats and internal error text are not published. Partial
  coverage stays visible, as `SCOPE.md` requires. A hidden marker ends the body.
- `formatCoverage` stays the terminal and retained-result presentation; only the
  published body (`preview.mjs` `reviewRequest`) changes.
- `prior.mjs` recognises a review of ours by the marker **or** by the old three
  fixed phrases, so reviews already published stay recognisable. Test both.
- Settle, while building, the two details the plan leaves open: the wording for a
  real execution failure and for a coverage gap, and basename versus full path
  when two files share a basename. Ask the user if either is a real choice.
- `publish-later` rebuilds the same body from a retained result; a result
  retained before `P6` must still publish or be refused cleanly, never with a
  body `prior.mjs` cannot recognise.
- Test first. One plugin review of the pull request at the standing
  authorization; record it in `ROADMAP.md` as every increment does.

### Caveats that are easy to miss

- **The review runs the installed plugin, and `dogfood-review.mjs` only checks
  that some copy is running.** On #54 the first review ran the marketplace
  `v0.1.0`, not the branch. Before the review, and with the user's agreement
  because it changes their environment: `copilot plugin uninstall
  copilot-pr-review`, `copilot plugin install "$(pwd)"`, then `diff -rq
  --exclude=.git ~/.copilot/installed-plugins/_direct/pr-review .` must print
  nothing. Afterwards restore with `copilot plugin uninstall copilot-pr-review`
  and `copilot plugin install copilot-pr-review@xpepper-copilot-plugins`.
- **Sizes**: `README.md` is at 64960 bytes, 576 spare, and it documents the
  published body; `ROADMAP.md` is at 63523 bytes, so archive `Q8`'s entry
  verbatim before writing `P6`'s. Measure both with `wc -c` before every commit; never condense
  archived history.
- **`Q9` never drops a rule citation** that `H1` requires, and **`O2` reopens
  `O1` only as far as the plan records.** Do not start either early.
- **Releasing follows `docs/release.md`**; every tag, release and index change
  needs the user's authorization in that session.

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
