# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, the open
pull requests and their checks before editing anything. Scope is authoritative;
the roadmap records demonstrated evidence and what remains open. Do not rely on
another conversation, reopen settled product decisions or infer behavior from
an API declaration.

## First settle pull request #43

`N1` is complete on branch `n1-seeded-corpus-scorer`, pull request #43. The
five-commit head the installed plugin reviewed was `c205f03`. Two later commits
follow it: `bccdd06` fixes the defect that review raised, and the commit
containing this handoff records the review. Inspect `git log`, confirm both are
pushed, the tree is clean and GitHub checks pass on the handoff commit rather
than assuming they followed. Merging is the user's decision.

The one authorized plugin review for this increment has already been spent.
**Do not rerun it without fresh explicit authorization.** It ran **balanced**,
without `--long-context`, with findings kept local:

- four heavy specialists on `gpt-5.6-terra` and the overview on `gpt-5.6-luna`,
  all at high effort on `contextTier: default`, with no context loss;
- 14 reported requests over 5 paid passes, 127.050688 credits, 232.9 s of model
  time against 114.0 s elapsed;
- 32 approved permission requests for 31 confined reads, and no denial;
- INCOMPLETE coverage, 0 validated, rejected, duplicate, capped or outside
  findings, and no withheld finding.

Correctness and contracts each raised one P2 candidate describing the same real
defect: the scorer accepted a reversed or non-positive finding range, so a
location of `4-3` detected the seeded defect at `3-4`. Both were refused at the
evidence boundary because each cited a four-line range with a five-line quote,
which is correct gate behavior. `bccdd06` fixes it anyway, test first, and
disabling either half of the new guard fails the suite. The overview's envelope
failed to parse at character 2789 and is an execution failure. The remaining
two coverage gaps and one caveat all observe that no collection runner exists,
which is `N1`'s boundary rather than a defect. The fix and this record postdate
the reviewed head, so the review does not cover them.

`ROADMAP.md` carries the full record. No finding was posted, and no GitHub
Copilot reviewer or `@claude[agent]` review was requested. The pull-request
description still says the review is pending: updating it would publish the
findings, which is the user's call. The review log is a session artifact, not
repository state.

## What `N1` is, so you do not redo or widen it

`scripts/benchmark/corpus/` holds five plain-text diffs pinned by sha256 (three
seeded cases with four defects, two clean controls) and `corpus.json`, whose own
hash `scripts/smoke-benchmark.mjs` pins. `scripts/benchmark/score.mjs` loads and
checks the corpus and scores findings: explicit non-findings rejected before
matching, maximum one-to-one matching independent of order, recall banded by
target severity, and unscored cases kept apart from missed ones. **No model
output has ever been scored.** Collection runs, a mode matrix, published
recall or precision and any baseline gate are **not scheduled**; do not add them.

## Your job after #43 merges is `H1`, and only `H1`

Confirm with `gh` that #43 is merged, update `main`, and create a fresh named
branch from `main`. If #43 is not merged, ask the user rather than stacking `H1`
on it.

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

At handoff, `ROADMAP.md` is 64116 bytes, only 1420 below the 65536 bytes at
which root files stop being discovered, and `README.md` is 63643 bytes. Archive
`N1`'s entry verbatim into `docs/roadmap-archive-2026-09-10.md` before writing a
word of `H1`'s, updating the archive pointers and counts exactly as earlier
moves do. A scripted move must dry-run and refuse unless each old string matches
exactly once.

The controlled set is now eighteen suites:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost benchmark; do node scripts/smoke-$s.mjs; done
```

Before every checkpoint, run the affected targeted suite plus
`smoke-safeguards.mjs` and `smoke-review.mjs`; run the whole set before opening
the pull request. Also run `git diff --check`, the tracked-control-byte check
(CI now includes `*.diff`) and the real safeguard collector, which must read all
six root instruction files and skip none. Test first means watching the new
test fail for the intended reason before implementing.

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
separately before any public GitHub Copilot reviewer request or
`@claude[agent]` mention.

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
