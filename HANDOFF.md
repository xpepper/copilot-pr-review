# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and the open pull requests before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume, in the roadmap and in your final report.

## Where things stand

`S1` is complete. The previous session merged #50 (`5f63241`, `plugin.json` at
`0.1.0`), pushed the annotated tag `v0.1.0` on it, and listed the plugin through
`xpepper/copilot-plugins#1`, merged as `642dde5`. The user's install is now
`copilot-pr-review@xpepper-copilot-plugins (v0.1.0)`. `ROADMAP.md`'s `S1` entry
holds the evidence for every step, and for every step not taken.

The closing pull request, branch `s1/close-v0.1.0`, is documentation only: the
marketplace install in `README.md`, the demonstrated install commands in
`docs/release.md`, the `S1` evidence in `ROADMAP.md`, and this file. **Check
whether it has merged** (`gh pr list --state all --head s1/close-v0.1.0`). If it
has not, stop and ask the user. Open pull requests #1 and #2 remain the
synthetic "do not merge" playgrounds; leave them alone. Verify with
`git status`, `git log --oneline -5` and `gh pr list --state open`.

## This session's task

None is scheduled. Every increment in `ROADMAP.md`'s table is complete, and its
closing section lists what stays open as a limitation rather than as work. Ask
the user what to do next, one decision at a time; do not pick an item yourself.

### Caveats that are easy to miss

- **Releasing follows `docs/release.md`.** Every tag push, GitHub Release, index
  pull request and change to the user's install needs the user's authorization
  in the session that does it; merging a version bump authorizes none of them.
  Never move, delete or re-push a published tag: the index pins it by name.
- **The index entry moves with every release**: `version` and `source.ref`
  together, plus the index README's table row, by a pull request the user
  merges. Never push to `xpepper/copilot-plugins`'s `main`.
- **Not demonstrated for this plugin**: that the entry's ref pin is honored,
  because the tag and `main` held the same tree when it was installed, and
  `copilot plugin update`.
- **`plugin.json`'s `name` is load-bearing.** The runtime names the extension
  `plugin:copilot-pr-review:...` and `scripts/dogfood-review.mjs` plus three
  runtime probes match on it. Do not touch it.
- **`README.md` and `ROADMAP.md` both sit within a kilobyte of 65536 bytes**,
  past which this tool's own discovery stops reading them. Measure with `wc -c`
  before every commit, and archive a `ROADMAP.md` entry under its recorded rule
  before writing a new one.
- **Sibling drift in the index**: `xpepper/pr-review-gemini#58` is open;
  `xpepper/pr-review-glm#45` was closed as completed on 2026-09-15. Check their
  state before raising them again, and do not fix those entries from here.

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
