# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, the open
pull requests, their comments and their checks before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume, in the roadmap and in your final report.

## First confirm that pull request #43 is merged

`N1` lives on branch `n1-seeded-corpus-scorer`, pull request #43. The session
that wrote this file was authorized to squash-merge #43 once every check on its
final head had passed, which could only happen after this file was pushed, so
this file cannot tell you whether it did. Confirm with `gh pr view 43` that #43
is merged, switch to `main`, pull with `--ff-only`, and check that `main` carries
the corpus, the scorer and this file. **If #43 is not merged, ask the user**
rather than stacking `H1` on it or merging it yourself.

What #43 carries, after `7e9ce50` archived `W1`: the corpus (`a4fa88c`), the
scorer (`baad911`), the CI loop (`33625b6`), the roadmap entry (`c205f03`, the
head the installed plugin reviewed), `bccdd06` fixing the reversed range that
review raised, two handoff commits, `230f982` fixing GitHub Copilot's comment,
and the commit containing this file.

The one authorized plugin review for this increment was spent on `c205f03`.
**Do not rerun it without fresh explicit authorization.** It ran **balanced**,
without `--long-context`, with findings kept local:

- four heavy specialists on `gpt-5.6-terra` and the overview on `gpt-5.6-luna`,
  all at high effort on `contextTier: default`, with no context loss;
- 14 reported requests over 5 paid passes, 127.050688 credits, 232.9 s of model
  time against 114.0 s elapsed;
- 32 approved permission requests for 31 confined reads, and no denial;
- INCOMPLETE coverage, 0 validated findings, and one real candidate raised by
  two reviewers, refused on its citation and fixed anyway in `bccdd06`.

What else was said on #43:

- GitHub Copilot's review of `e92f9a2` left one inline comment: the scorer
  accepted a finding location the tool refuses, so `src/paginate.js:1-999`
  detected the seeded defect at `3-4`. `230f982` fixes it test first. One reply
  naming the commit was posted on that thread, and the thread is resolved.
- `@codex[agent]` found no actionable issue at `e92f9a2`, and the
  `claude-review` action reported none.
- The user asked `@claude[agent]+claude-sonnet-5` for a review at 16:39:10Z on
  2026-09-13, and it had not replied when this was written. If it has since
  replied with something actionable, report it to the user and ask before acting
  on it. The same applies to any other new comment.

No plugin review covers `bccdd06` or `230f982`, and `ROADMAP.md` says so.

## What `N1` is, so you do not redo or widen it

`scripts/benchmark/corpus/` holds five plain-text diffs pinned by sha256 (three
seeded cases with four defects, two clean controls) and `corpus.json`, whose own
hash `scripts/smoke-benchmark.mjs` pins. `scripts/benchmark/score.mjs` loads and
checks the corpus and scores findings: a submitted location must be one the tool
could anchor (at most ten lines, inside one hunk, covering a changed line, in a
file of the diff), explicit non-findings are rejected before matching, matching
is maximum one-to-one and independent of order, recall is banded by target
severity, and unscored cases are kept apart from missed ones. **No model output
has ever been scored.** Collection runs, a mode matrix, published recall or
precision and any baseline gate are **not scheduled**; do not add them.

## Your job after #43 merges is `H1`, and only `H1`

Create a fresh named branch from the updated `main`.

`H1`, from the roadmap row: opt-in, the project's own written standards steer
the review. The checkout's instruction files, which `--verify` discovery already
collects and hands to no reviewer, reach one; a finding raised on that basis
must quote the instruction it relies on; that quote is checked against the
collected file the way a source citation is checked against bound source; and a
finding whose quoted rule cannot be found is refused. It settles what evidence a
claim not grounded in a provable code effect must carry. Pull request #42's
handoff contradicted `AGENTS.md` twice, which is its concrete acceptance case.

**`H1` needs a scope decision before any code**, because `SCOPE.md` says nothing
about convention review. That decision is the user's: put the exact `SCOPE.md`
wording to them and get it approved before editing the file, as `T1`, `X1` and
`W1` did. Settle with them, one question at a time, how it is opted into, which
reviewer receives the files, and how a quoted rule is bound.

Do **not** start `K1`, restore `docs/gap-analysis.md`'s staged plan, or revisit
the six `G1` proposals the user declined. Do not widen `N1`.

## Headroom and validation

At handoff, `ROADMAP.md` is 64881 bytes, only 655 below the 65536 bytes at which
root files stop being discovered, and `README.md` is 63643 bytes. Archive
`N1`'s entry verbatim into `docs/roadmap-archive-2026-09-10.md` before writing a
word of `H1`'s, updating the archive pointers and counts exactly as earlier
moves do. A scripted move must dry-run and refuse unless each old string matches
exactly once.

The controlled set is eighteen suites:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost benchmark; do node scripts/smoke-$s.mjs; done
```

Before every checkpoint, run the affected targeted suite plus
`smoke-safeguards.mjs` and `smoke-review.mjs`; run the whole set before opening
the pull request. Also run `git diff --check`, the tracked-control-byte check
(CI includes `*.diff`) and the real safeguard collector, which must read all six
root instruction files and skip none. Test first means watching the new test
fail for the intended reason before implementing, and disabling each new guard
in turn should fail the suite.

**Check new, untracked files for control bytes with plain `grep -rnP`**, not
`git grep`, which does not see them. In the `N1` session the file writer twice
turned a typed Unicode escape for code point 7 into a raw BEL byte, once inside
a `.mjs` test; both were caught and replaced before any commit. Build such
characters with `String.fromCharCode` instead of typing an escape.

## Pull-request workflow

Follow `AGENTS.md`: meaningful validated local checkpoint commits are
authorized. Push the `H1` branch and open its own pull request; never push
directly to `main`, amend published history or force-push.

`H1` changes `extensions/`, so its pull request needs exactly one
installed-plugin review as verification of record; the standing workflow
authorizes that first review. Ask before any additional review, rerun or other
live probe that spends credits. Keep findings local with `--no-comment`. Ask
separately before any public GitHub Copilot reviewer request, `@claude[agent]`
mention, or reply on a review thread.

Before reviewing, the local checkout must exactly equal the pushed PR head and
be clean. Reinstall and verify the plugin:

```sh
copilot plugin install "$(pwd)"
diff -rq ~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review \
  extensions/pr-review
copilot plugin list
```

CLI 1.0.83 warns that direct local installs are deprecated. Dispatch through
the SDK, not prompt mode, and never add a timeout:

```sh
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
node scripts/dogfood-review.mjs NUMBER --all --no-comment --unattended > LOG 2>&1
```

Balanced is the default unless the user chooses another mode. Run the command in
the background with no timeout, edit nothing while it reads the checkout, and
parse the mode-prefixed evidence JSON from the log. The evidence line carries no
tool-call count: read each reviewer's `sessionId` events under
`~/.copilot/session-state/` for `tool.execution_start` and `permission.completed`,
which is an implementation detail rather than a contract. Record actual model,
effort, context tier, reviewer coverage, tool calls and denials, findings,
withheld findings, context loss and reported credit cost. A refusal or
incomplete review is evidence, not a reason to weaken a gate or rerun.

## Runtime and settled constraints

No runtime API changed in `N1`; CLI 1.0.83 remains the recorded runtime.
`scripts/smoke-runtime.mjs --targets` has not run since `I1b`. Do not spend
credits or run live probes merely to close that gap.

Do not add review timeouts, weaken the shell gate, use `fs.realpathSync` in
`read-only.mjs`, change `F6`'s marker unwrap, or treat a compaction event as a
retry or stop condition. Code proves that a finding still stands and never that
it disappeared. An unknown write outcome stops the reply set. Cold resume of
command-only records remains unsupported.

Before ending the next session, update `ROADMAP.md` with evidence and the exact
next increment, then replace this file as the final repository edit. Include it
in the final branch commit and push it to the pull request. Report the commit
and pull-request outcome and point here rather than duplicating the prompt.
