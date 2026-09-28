# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md`, `ROADMAP.md` and
`docs/decision-memo-2026-09-28.md`, then inspect git state and open pull requests
before editing anything. The memo is the decision this repository now follows and
the roadmap sequences it. Do not rely on another conversation, reopen anything in
the two roadmap archives, or infer behavior from an API declaration. Say which
claims you demonstrated and which you assumed.

## Where things stand

The plugin is complete against `SCOPE.md` and published as `v0.2.0`. Nothing under
`extensions/` or `scripts/` has changed after 16 September, and nothing there is
scheduled: the audit phase has begun instead.

The documentation increment `MEMO` is complete on branch
`docs/investment-decision-memo`, opened as a pull request from it. Check its number
and state with `gh pr list`; the owner merges. Its checkpoints are `6e7f983` (the
decision memo, and the old roadmap archived as
`docs/roadmap-archive-2026-09-28.md`) and `86ffb06` (the new `ROADMAP.md` and three
`README.md` pointer fixes). This handoff is the last commit on the branch. If the
pull request is still open when you start, work from `main` only after it merges;
otherwise branch from `main` as usual.

What the memo concluded, in one paragraph: freeze all three plugins, make native
Copilot review plus a thin single-agent workflow the default, and run one
zero-credit audit of existing runs before deciding whether any plugin is worth
resuming. The reasons are that the exact-quote gate is recorded discarding real
findings, that recall and comparative value were never measured, and that native
reviewers matched or beat the plugins on the few same-pull-request comparisons. The
freeze is the de facto state, but the owner has not confirmed it (`DEC1`) or
answered the memo's three open questions (section 8).

## Exact next step

**Nothing spends credits or changes plugin code.** Ask the owner three things before
building, then start `EXP1a` as `ROADMAP.md` specifies:

1. Confirm that `EXP1a` should start, and record the answer to `DEC1` if the owner
   gives one.
2. Which repositories may enter the sample. Public ones only by default; the private
   work pull requests the memo names only with the owner's permission, and then the
   generated sheet stays local.
3. Where generated data may be written outside the repository.

`EXP1a` in short (the full specification is in `ROADMAP.md`): under `eval/audit/`,
plain Node ES modules and no dependencies, build a collector, a blinding sheet
builder, a scorer and a controlled suite with a fake `gh`, wired into CI as its own
step. It reads local session logs, the gemini result cache and read-only `gh api`
responses; it labels nothing; it writes sheets and keys outside the repository.
Acceptance: the suite passes locally and in CI, a dry run on real data prints counts
(pull request heads found, findings by kind, runs it could not map), and no file under
`extensions/` or `scripts/` changed. Then stop and report: the owner labels the sheet
(`EXP1b`).

## Caveats

- **Spend and posting.** No plugin review, probe, bake-off run or paid replay without
  the owner's explicit instruction in that session, and nothing posted to GitHub.
  Opening a pull request triggers the reviewers this repository runs on every pull
  request (GitHub's Copilot review and a Claude review action); that is outside an
  agent's control, and the Claude one has already failed for lack of credits.
- **A documentation-only or `eval/`-only pull request** needs no plugin review;
  ask the owner rather than spending by default.
- **Root file sizes.** `README.md` is 65528 bytes, 8 below the 65536-byte cap that
  the plugin's own reader and CI enforce. `ROADMAP.md` is about 13 KB. Measure with
  `wc -c` before opening a pull request.
- **Platform drift.** The plugin was validated on Copilot CLI 1.0.83; 1.0.88 was
  installed when this was written and whether the plugin still loads there is
  unverified (`PRB1`, which needs the owner's agreement because the probe needs the
  marketplace copy uninstalled). The installed plugin is the marketplace `v0.2.0`
  build.
- **Local data is perishable.** The raw reviewer outputs live in
  `~/.copilot/session-state` on the owner's machine and can be pruned, and gemini's
  results are in its untracked `.gem-pr-cache`. Copy what the audit needs early and
  report any run that cannot be mapped to a pull request head.
- **Private material.** Two work pull requests named in the memo are in private
  repositories. Keep anything from them out of the repository.
- Open pull requests #1 and #2 are synthetic "do not merge" playgrounds. Every future
  tag, GitHub Release publication and marketplace-index write needs its own explicit
  authorization.

Follow the checkpoint, pull-request and handoff rules in `AGENTS.md` in turn. Before
ending any later project session, update `ROADMAP.md`, then refresh this file as the
final repository edit, commit and push. Never rely on this conversation.
