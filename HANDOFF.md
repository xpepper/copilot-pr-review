# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then
`docs/published-review-feedback-plan.md`, then inspect git state and the open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what remains open. Do not rely on another
conversation, reopen settled product decisions or infer behavior from an API
declaration. Keep what you demonstrate apart from what you assume.

## Where things stand

`Q9` is built on branch `q9/drop-supporting-citation`, pull request #57: when a
candidate's location is exact, a `breaks`, `before`, `after` or `evidence`
citation failing one of `Q8`'s three exact-quote checks is dropped, reported as
an informational caveat (the user's choice) that the adjudicator reads, and the
candidate is judged. The location, an `H1` rule citation, provenance and shape
refusals, and a candidate left with no exact evidence entry still discard.
`ROADMAP.md`'s `Q9` entry has the evidence and both reviews. **Check whether #57
has merged** (`gh pr list --state all --head q9/drop-supporting-citation`). If it
has not, stop and ask the user. Open pull requests #1 and #2 remain the synthetic
"do not merge" playgrounds; leave them alone.

#57 was reviewed once, at the standing authorization, on a direct install that
`diff -rq` showed identical to the checkout: 170.841755 credits, 0 validated,
INCOMPLETE. `Q9` ran live: correctness's P2 lost an 8-line `evidence[0]` quoting
9 lines and was still adjudicated. Its claim (a dropped wrong-side `before`
skips the side check) and contracts'/overview's P3 (a confined, set-aside
candidate reports no drop) were rejected as deliberate. The user's separate
GitHub Copilot review left two comments, both accepted: the README drop
sentence was reworded, and the review record and this handoff were added. The
marketplace install was restored, identical to `git archive v0.1.0`. Nothing was
posted.

## This session's task: `O2`, and nothing after it

Decided in the plan's `O2` section, with its worked example of #65's opening.
Acceptance criteria:

- Only under `--quiet`; a verbose run is unchanged. `O2` reopens `O1` only as
  far as the plan records.
- `describeConfiguration`'s static policy text (precedence, inheritance,
  fallback rules, trust caveats) becomes one line naming the configuration
  sources and pointing to `/pr-review-config show`.
- Assignments are grouped by identical model, effort and window; every model,
  effort, window and fallback stays visible.
- Inside a review run the capture line says the target was captured and the
  review is starting (`target.mjs` prints the capture-only sentence, with a
  doubled period, and "No PR review performed").
- A flag- or config-authorized run prints `Publishing N inline comments to #N…`
  instead of the payload JSON; a confirmation-required run still shows the
  payload, because that is what is being approved.
- Unchanged from `O1`: coverage, diagnostics, findings, rejections, selection,
  every publication outcome, and every sentence saying a result is not a clean
  review. Test first; one plugin review of the pull request; record it.

**`O2` is the last scheduled increment.** After it nothing is scheduled: record
that and ask the user; do not pick the next work yourself.

### Caveats that are easy to miss

- **`dogfood-review.mjs` refuses `--quiet`**, so the one standing review cannot
  show `O2`'s output. Controlled suites must pin it; say plainly in the roadmap
  that the live quiet timeline was not demonstrated, and ask before spending on
  any separate run.
- **The review runs the installed plugin, and `dogfood-review.mjs` only checks
  that some copy is running.** With the user's agreement: `copilot plugin
  uninstall copilot-pr-review`, `copilot plugin install "$(pwd)"`, then `diff -rq
  --exclude=.git ~/.copilot/installed-plugins/_direct/pr-review .` must print
  nothing. Afterwards `copilot plugin uninstall copilot-pr-review` and `copilot
  plugin install copilot-pr-review@xpepper-copilot-plugins`, and compare with
  `git archive v0.1.0`. Do not edit repository files while the review runs. An
  unparsed reviewer's candidates can be read free from its `events.jsonl` under
  `~/.copilot/session-state/`; a run without `--quiet` also prints them.
- **Sizes**: `README.md` is at 65468 bytes, 68 spare, so any README wording
  must replace text rather than add it; `ROADMAP.md` is at 64144 bytes, so archive
  `Q9`'s entry verbatim just before the archive's last section, as `Q9` did
  `P7`'s (check with `cmp`), before writing `O2`'s. Measure both with `wc -c`
  before every commit against the 65536-byte cap; never condense archived history.
- **Recorded, not scheduled** by `P7`: model prose holding `<!--` or `</sub>` can
  hide or unwrap the rest of an inline comment. Do not fix it inside `O2`.
- **Import cycles**: `preview.mjs` must not import `prior.mjs` or
  `incremental.mjs`.
- **Releasing follows `docs/release.md`**; every tag, release and index change
  needs the user's authorization in that session.
- In zsh, a bare `====` argument is expanded and aborts a chained command, an
  unquoted `--include=*.mjs` glob aborts `grep`, and `$PIPESTATUS` is
  `$pipestatus`; quote globs and check exit codes directly.

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
