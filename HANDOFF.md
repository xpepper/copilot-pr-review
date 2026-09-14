# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and the open pull requests before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume, in the roadmap and in your final report.

## Where things stand

The previous session started from `main` at `f5cf573` (#48 merged) and did a
planning session, not a numbered increment, on branch
`plan/release-and-marketplace`. That branch adds
`docs/release-and-marketplace-plan.md`, an `S1` `Pending` row in `ROADMAP.md`,
and this file, documentation only. **Check whether its pull request has
merged** (`gh pr list --state all --head plan/release-and-marketplace`). If it
has not, stop and ask the user: `S1` builds on it. Open pull requests #1 and #2
remain the synthetic "do not merge" playgrounds; leave them alone. Verify with
`git status`, `git log --oneline -5` and `gh pr list --state open`.

No git tag exists in this repository, and `plugin.json`'s `version` is `0.0.1`.

## This session's task: `S1`, cut `v0.1.0` and list it

Scheduled by the user on 2026-09-14, outside the `ROADMAP.md` backlog. **Read
`docs/release-and-marketplace-plan.md` first.** It holds the evidence, the seven
decisions the user took one at a time, and `S1`'s acceptance criteria as its
section "The scheduled increment, `S1`". Do not reopen those decisions:

1. The light, glm-style release model: `plugin.json` is the only version, no
   `package.json`, no bump script, no changelog generator, no release workflow.
2. (Moot: no bump is computed from commits.)
3. The marketplace name is `copilot-pr-review`. No rename.
4. `xpepper/copilot-plugins` is changed only by a pull request the user merges,
   only after a real `v0.1.0` tag here installs, in the same session.
5. **Every tag push, GitHub Release and index pull request needs the user's
   explicit authorization in the session that does it.** Merging the
   version-bump pull request authorizes none of them.
6. The first release is `0.1.0`. Declaring `1.0.0` is a later decision of the
   user's, not part of `S1`.
7. One increment, in this order, stopping at each authorization:
   - a pull request on an `S1` branch bumping `plugin.json` to `0.1.0` and
     adding a short `docs/release.md`; the user merges it;
   - with authorization, tag the merge commit `v0.1.0` and push the tag;
   - install from the tag and confirm it loads and reports `0.1.0`;
   - with authorization, one pull request on `xpepper/copilot-plugins` adding
     the entry and its README table row; the user merges it;
   - confirm the merged manifest reads back consistent and, with the user's
     agreement, that `copilot plugin install
     copilot-pr-review@xpepper-copilot-plugins` installs `0.1.0`;
   - a closing pull request here with the `README.md` install line, the
     `ROADMAP.md` evidence and this file.

### Caveats that are easy to miss

- **Nothing on GitHub gates a tag.** The ruleset covers the default branch only
  and CI does not run on tags. Run the full controlled set at the exact commit
  you tag, before pushing the tag.
- **The install-from-a-tag command is not established.** Read `copilot plugin
  install --help` on the installed CLI rather than assuming a syntax.
- **The user already has a direct install**, `copilot-pr-review (v0.0.1)` in
  `copilot plugin list`. Replacing it, or adding a marketplace install beside
  it, changes their environment: ask first.
- **`plugin.json`'s `name` is load-bearing.** The runtime names the extension
  `plugin:copilot-pr-review:...` and `scripts/dogfood-review.mjs` plus three
  runtime probes match on it. Do not touch it.
- **`README.md` is 64674 bytes**, 862 under the 65536 bytes past which this
  tool's own discovery stops reading it. Measure it before the closing commit.
- **The index has never had a pull request**: its history is direct pushes. The
  user chose a pull request anyway; do not push to its `main`.
- **The sibling entries in the index had drifted when read on 2026-09-14**:
  `gem-pr-review` pinned `v0.3.3` while `v0.4.0` was released, and
  `z-pr-review` pinned `v0.2.7`, a tag that did not exist. That is recorded as
  evidence about the process only. **Do not fix either entry** in `S1`'s index
  pull request; mention it to the user if it is still true.
- The pull request that bumps `plugin.json` changes nothing under `extensions/`
  or `scripts/`, so its plugin review is the user's call under `AGENTS.md`:
  ask, do not spend by default.

Out of scope for `S1`: a GitHub Release unless separately authorized, a
`package.json`, any script or workflow, a marketplace consistency check, a
status line showing the version, and `1.0.0`.

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
`ROADMAP.md` and `README.md` with `wc -c` before every commit.

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
