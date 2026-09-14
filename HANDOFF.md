# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, the open
pull requests, their comments and their checks before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume, in the roadmap and in your final report.

## First confirm that pull request #44 is merged

`H1` lives on branch `h1-project-standards-review`, pull request #44. Merging is
the user's decision, and this file was pushed before any merge. Confirm with
`gh pr view 44` that #44 is merged, switch to `main`, pull with `--ff-only`, and
check that `main` carries `extensions/pr-review/standards.mjs` and this file.
**If #44 is not merged, ask the user** rather than stacking `K1` on it or
merging it yourself. Open pull requests #1 and #2 are synthetic playgrounds
marked "do not merge"; leave them alone.

What #44 carries: `c72b976` archived `N1`'s entry; `d6b86a6` is the approved
`SCOPE.md` paragraph; `79aa400`, `6aa6122`, `ca5f612` and `789dcc7` build `H1`;
`c7e6220` documents it; `8e0b547` is the roadmap entry and **the head the
installed plugin reviewed**; `6b2f18f`, `b1c9af2`, `05039e1`, `a4841b1` and
`0262965` answer that review and a later comment; then the commit with this file.

The one authorized plugin review for this increment was spent on `8e0b547`.
**Do not rerun it without fresh explicit authorization.** It ran **balanced**
with findings kept local: four heavy specialists and the adjudicator on
`gpt-5.6-terra`, overview on `gpt-5.6-luna`, all at high effort on the default
window; 25 requests, 319.760535 credits, 262.4 s elapsed; 78 tool calls, no
denial; INCOMPLETE with 0 validated findings. Overview was compacted at 247,927
of its 200,000 tokens. **No plugin review covers the five commits after it.**

What else was said on #44:

- The `claude-review` action left one inline comment (id 4000826177, on
  `extensions/pr-review/findings.mjs`) saying a repaired rule quote's caveat
  printed the rule in the published review body. It was right, and `0262965`
  fixes it at the user's choice. At the user's request one reply naming that
  commit was posted (4002945201) and the thread is resolved.
- At the user's request the PR description's mutation count was corrected: 62
  across the first five code commits with four as a thrown error, 75 in all
  with five, as `ROADMAP.md` records.
- If anyone has since commented with something actionable, report it to the
  user and ask before acting.

## What `H1` is, so you do not redo or widen it

By default every review collects the markdown files at the checkout root,
keeps those one `git ls-tree` of the reviewed head proves are its committed
regular files, and hands at most 48 KiB of them, counted as numbered text and
taken in the collector's reading order, to the one reviewer that weighs the
whole change: overview in balanced and full, integrated in deep, contracts in
quick. A finding relying on a rule quotes it as exact lines of its file, bound
like a source citation; only that reviewer may. The adjudicator is handed each
cited file in full. The rule is presented and never published, and a repaired
rule quote is reported without the rule. `--no-standards` turns it all off for
one run. On this repository `README.md` and `ROADMAP.md` do not fit the budget.

The user took five decisions, none to be reopened: on by default; the
whole-change reviewer; exact lines; the 48 KiB budget; and a repair caveat that
names no rule. Recorded as limitations rather than work: an
absent rule cannot be quoted, so it is refused; a rule citation has no span
cap; a CRLF file's multi-line quote cannot match; nothing below the root is
read; no real model has yet quoted a rule; the added cost is bounded, not
measured. Overview's rejected P3, that rule repair accepts a start-clipped
quote, is identical to the source-citation repair and is not scheduled.

## Your job after #44 merges is `K1`, and only `K1`

Create a fresh named branch from the updated `main`.

`K1`, from the roadmap row: a published review asks what it found useful, and a
later run reads the reactions and the resolution state of its own threads.
`I1c` already reads an earlier review's threads fresh from GitHub on every run,
so the read path exists. **It needs a scope decision before any code**, because
`SCOPE.md` says nothing about a feedback channel. Put the exact `SCOPE.md`
wording to the user and get it approved before editing the file, as `T1`, `X1`,
`W1` and `H1` did. Take one decision per message: explain what part of the
review it affects in plain terms, walk through a worked example from this
project, then give the cheapest option that still works and the alternatives.

**Demonstrating `K1` live needs a review actually published to a pull request,
and posting is always the user's call.** Say so when you settle scope, and do not
publish anything to arrange it.

Do **not** start anything under "Recorded, not scheduled", restore
`docs/gap-analysis.md`'s staged plan, or widen `H1`, `N1`, `W1` or `B1`.

## Headroom and validation

At handoff `ROADMAP.md` is about 64 KB, too close to the 65536 bytes at which
root files stop being discovered for any increment entry. **Archive `H1`'s
entry verbatim into `docs/roadmap-archive-2026-09-10.md` before writing a word
of `K1`'s**, updating the pointers and counts exactly as `c72b976` did, with a
scripted move that dry-runs and refuses unless each old string matches exactly
once. `README.md` is 64674 bytes; documenting `K1` there needs room first, as
`09d8cdf` made by moving a guide into `docs/`.

The controlled set is eighteen suites:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost benchmark; do node scripts/smoke-$s.mjs; done
```

Before every checkpoint run the affected suite plus `smoke-safeguards.mjs` and
`smoke-review.mjs`; run the whole set before opening the pull request. Also run
`git diff --check`, the tracked-control-byte check (CI includes `*.diff`) and
the real instruction-file collector, `collectInstructionFiles`, which must read
all six root files and skip none. Test first means watching each new test fail
for the intended reason; disable each new guard in turn, with a throwaway
script outside the repository, and confirm the suite fails. **Check new files
for control bytes with plain `grep -rnP`**, not `git grep`, and build control
characters with `String.fromCharCode` rather than typing an escape.

## Pull-request workflow

Follow `AGENTS.md`: validated local checkpoint commits are authorized. Push the
`K1` branch and open its own pull request; never push to `main`, amend
published history or force-push. If `K1` changes `extensions/` or `scripts/`,
its pull request needs exactly one installed-plugin review, which the standing
workflow authorizes without asking. Ask before any further review, rerun or
live probe that spends credits, and before any GitHub write: posting findings,
`@` mentions, Copilot reviewer requests, thread replies or resolutions.

Before reviewing, the local checkout must equal the pushed PR head and be clean:

```sh
copilot plugin install "$(pwd)"
diff -rq ~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review \
  extensions/pr-review
copilot plugin list
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
node scripts/dogfood-review.mjs NUMBER --all --no-comment --unattended > LOG 2>&1
```

Run it in the background with no timeout and edit nothing while it reads the
checkout. Balanced is the default unless the user chooses another mode. Parse
the mode-prefixed evidence JSON from the log; it now carries `standards`. Read
each pass's `sessionId` events under `~/.copilot/session-state/` for tool calls,
permissions and compaction, an implementation detail rather than a contract.
Record actual models, efforts, windows, coverage, tool calls and denials,
findings, withheld findings, context loss and credits. **Standards are on by
default in that review too**, so expect overview's input to grow by up to 48 KiB.

## Runtime and settled constraints

CLI 1.0.83 remains the recorded runtime; direct local installs print a
deprecation warning. Do not add review timeouts, weaken the shell gate, use
`fs.realpathSync` in `read-only.mjs`, change `F6`'s marker unwrap, or treat a
compaction event as a retry or stop condition. Code proves a finding still
stands, never that it disappeared. An unknown write outcome stops the reply set.

Before ending, update `ROADMAP.md` with evidence and the exact next increment,
then replace this file as the final repository edit, commit both on the branch,
push, and report the commit and pull-request outcome, pointing here.
