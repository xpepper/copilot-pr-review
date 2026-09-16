# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and the open pull requests before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume.

## Where things stand

`O2` is built on branch `o2/quieter-quiet`, pull request #58, in three commits:
`03d8e89` the behaviour, `3bf1831` the documentation, `007b6bb` the fix its own
review found. Under `--quiet` only, the static configuration policy became one
line naming the sources this run read, reviewers are grouped by identical model,
effort and window, a captured target says the review is starting instead of the
capture-only sentence, and a flag- or config-authorized run says what it will
publish instead of printing the payload. A verbose run is unchanged.
`ROADMAP.md`'s `O2` entry has the evidence. **Check whether #58 has merged**
(`gh pr list --state all --head o2/quieter-quiet`). If it has not, stop and ask
the user. Open pull requests #1 and #2 remain the synthetic "do not merge"
playgrounds; leave them alone.

#58 was reviewed once, at the standing authorization and with the user's
agreement to swap installs, on a direct install `diff -rq` showed identical to
the checkout: 193.076478 credits, 29 requests, 167.6 s, INCOMPLETE, 0 validated.
**Its one real finding was accepted by the adjudicator and then lost by it**: a
fallback configured identical to its tier's own assignment is dropped by
`reviewerAssignments`, so a quiet run said `Fallbacks: none.` while the tier
block reporting it as `NOT OFFERED` is exactly what quiet leaves out. The
adjudicator's own citation quoted 10 lines for a 9-line range, so the candidate
was discarded as `invalid adjudication`. It was right; `007b6bb` fixes it, test
first. `security:1` (quiet omits `autoPostReviews`) was rejected as not
established: posting authority is stated at the proposal. The marketplace
install was restored, identical to `git archive v0.1.0`. Nothing was posted.

## This session's task: the help orientation, and nothing after it

**Scheduled by the user on 2026-09-16, and the only thing scheduled.** They want
the plugin easy to start using. Today they open by asking an agent "I want to use
the /pr-review plugin to review this PR, what options do I have?", and the agent
reads the installed plugin and answers with a modes table, the useful controls
grouped by purpose, and the lifecycle commands. That answer is what
`/pr-review help` should give.

**Demonstrated, not assumed**: `/pr-review help` already exists. `extension.mjs`
has `case "help"` and a `help` constant spanning lines 18-172, about 155 lines,
opening "Copilot PR Review - runtime feasibility prototype". It is exhaustive
reference prose, not an orientation. So this is not a new command.

**The scope decision is the user's, taken in the session that builds it**, as
`T1`, `X1`, `W1`, `H1` and `K1` each took theirs. Put the choices to them one at
a time, cheapest first, with a recommendation: what the short help says and in
what order; whether the long-form text moves behind something else, moves to
`README.md`, or stays; whether `status` changes too; and whether the stale
"runtime feasibility prototype" line simply goes. Do not assume any of it from
this file. Agree the acceptance criteria before building, then test first; one
plugin review of the pull request; record it.

**After it nothing is scheduled**: record that and ask the user; do not pick the
next work yourself.

### Caveats that are easy to miss

- **Sizes**: `README.md` is at 65489 bytes, 47 spare against the 65536-byte cap,
  so any README wording must replace text rather than add it. `ROADMAP.md` is at
  63884 after `O2` moved `Q9`'s entry and `G1`'s reference list to the archive
  verbatim; archive before writing if the next entry does not fit, and never
  condense archived history. **Measure both with `wc -c` before every commit.**
  `O2` put each of them over the cap once, and `collectInstructionFiles` then
  skips the file silently: that is what the CI invariant catches.
- **The help text is shipped user-facing text.** Changing it is a behaviour
  change, so it needs the installed-plugin review, and `F1`'s archived entry
  records that the status/help entry point is code-owned.
- **`dogfood-review.mjs` refuses `--quiet`**, so the standing review can never
  show `O2`'s own output. The live quiet timeline is still not demonstrated; the
  controlled suites are the only evidence for what a quiet run prints. Ask
  before spending on any separate run.
- **The review runs the installed plugin, and `dogfood-review.mjs` only checks
  that some copy is running.** With the user's agreement: `copilot plugin
  uninstall copilot-pr-review`, `copilot plugin install "$(pwd)"`, then `diff -rq
  --exclude=.git ~/.copilot/installed-plugins/_direct/pr-review .` must print
  nothing. Afterwards `copilot plugin uninstall copilot-pr-review` and `copilot
  plugin install copilot-pr-review@xpepper-copilot-plugins`, and compare with
  `git archive v0.1.0`. Do not edit repository files while the review runs. The
  runner needs `COPILOT_CLI_PATH="$(command -v copilot)"` and
  `COPILOT_SDK_PATH="$HOME/.copilot/pkg/<platform>/<version>/copilot-sdk"`.
- **Recorded, not scheduled** by `O2`: `Q9` drops a reviewer's failing supporting
  citation rather than the candidate, but an *adjudication's* own citation has no
  such treatment, so one miscounted range discards a candidate the adjudicator
  had already accepted. Do not fix it inside the help increment.
- **Recorded, not scheduled** by `P7`: model prose holding `<!--` or `</sub>` can
  hide or unwrap the rest of an inline comment.
- **Import cycles**: `preview.mjs` must not import `prior.mjs` or
  `incremental.mjs`.
- **Releasing follows `docs/release.md`**; every tag, release and index change
  needs the user's authorization in that session.
- In zsh, a bare `====` argument is expanded and aborts a chained command, an
  unquoted `--include=*.mjs` glob aborts `grep`, and `$PIPESTATUS` is
  `$pipestatus`; quote globs and check exit codes directly. A guard regex that
  must match a heading like ``### `G1`'s references`` needs the apostrophe too.

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

CLI **1.0.85** was the runtime `O2`'s review actually ran on; the roadmap's older
entries record 1.0.83. Every increment lands on a branch and a pull request,
never `main`; never amend published history or force-push. Findings stay local.
Do not add review timeouts, weaken the shell gate, use `fs.realpathSync` in
`read-only.mjs`, change `F6`'s marker unwrap, or treat a compaction event as a
retry or stop condition. `K1`'s reception is information only. GitHub
review-thread ids are matched by `fullDatabaseId` as strings.

Before ending, update `ROADMAP.md` with evidence and the exact next step, then
replace this file as the final repository edit, commit both on your branch, push,
and report what changed, what was verified and how, what was not, and what
remains, pointing here.
