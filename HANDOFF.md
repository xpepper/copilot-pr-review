# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, the open
pull requests, their comments and their checks before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume, in the roadmap and in your final report.

## Your job: finish pull request #43, hand off `H1`, then merge

`N1` is on branch `n1-seeded-corpus-scorer`, pull request #43. The user
scheduled this session for exactly these steps, in this order, all on that
branch:

1. Address GitHub Copilot's inline review comment on #43, test first.
2. Record the response in `ROADMAP.md`, then replace this file with the prompt
   for the `H1` session as the last repository edit, and push.
3. Merge #43 once every check on that final head has passed.

The user chose to write the roadmap and handoff **before** merging, so they land
on `main` with #43 and no separate documentation pull request is needed; `main`
refuses direct pushes. The user authorized merging #43 in this session, and
addressing that one comment, which includes one short reply on its thread and
resolving it. Nothing else: do not start `H1` or `K1`, and do not widen `N1`.

## State when this was written

Commits on the branch, oldest first: `7e9ce50` archives `W1`, `a4fa88c` adds the
corpus, `baad911` the scorer, `33625b6` the CI loop, `c205f03` the roadmap entry
and is the head the installed plugin reviewed, `bccdd06` fixes the reversed
range that review raised, `e92f9a2` records it and hands off `H1`, and then the
commit containing this file. On `e92f9a2` both checks passed:
`Controlled suites and self-readability` and `claude-review`.

What has been said on #43:

- the `claude-review` action commented "No issues found";
- `@codex[agent]` reviewed `e92f9a2` and found no actionable issue;
- GitHub Copilot's review `5191377384`, state COMMENTED, left one inline
  comment, `4000178733`, which is this session's job;
- the user asked `@claude[agent]+claude-sonnet-5` for a review at 16:39:10Z on
  2026-09-13, and it had not replied when this was written. If it has replied
  with something actionable, report it to the user and ask before acting on it.
  The same applies to any other new comment.

**The one authorized plugin review of #43 is spent. Do not rerun it**, and ask
before any other review or live probe that spends credits. The fix below
changes `scripts/`, so no plugin review covers it; record that plainly.

## The comment

GitHub Copilot, on `scripts/benchmark/score.mjs` line 309 at `e92f9a2`, verbatim:

> `checkFinding` only validates that the range is positive; it does not enforce
> the actual validated-finding location contract. For example, a report at
> `src/paginate.js:1-999` passes this gate, overlaps the seeded `3-4` location,
> and is counted as a detection even though product validation rejects
> locations over ten lines or outside one hunk
> (`extensions/pr-review/findings.mjs:310-314`). Validate each submitted
> location against `entry.files` with the same anchor rule and add a regression
> for an over-broad range.

**Demonstrated** against `e92f9a2`: a pagination finding at `src/paginate.js`
lines `1-999`, and one at `3-13`, each score as detecting
`pagination-inclusive-bound`. The product refuses both: `findings.mjs:310`
refuses a location spanning more than ten lines, and `:314` one that is not on
changed lines inside one hunk, using `includesChangedLine` at `:266` and
`withinHunk` at `:268`. The scorer's `checkFinding`, at `score.mjs:210`, checks
only shape and `1 <= startLine <= endLine`. The loader's `checkLocation`, at
`:117`, already applies a hunk and changed-line rule, but only to acceptable
locations.

**Not yet checked**: whether the loader's hunk rule agrees exactly with the
product's `withinHunk`. Read `findings.mjs:260-320` before reusing either.

Acceptance criteria:

- Refuse, before matching, a submitted finding whose location the product would
  refuse: more than ten lines, a path naming no file in that case's diff on its
  side, not inside one hunk, or covering no changed line. The message names the
  case, the finding number and which rule failed. This follows `bccdd06`: a
  report is meant to hold validated findings, so a malformed one is refused
  rather than scored. If you conclude a false positive is the better outcome,
  ask the user before choosing.
- One shared anchor check for both uses, not a second copy. Acceptable locations
  in the corpus keep no ten-line cap; only submitted findings take it.
- Test first: regressions for `1-999`, `3-13` and a location inside the hunk
  that covers no changed line, such as head `5-6`, each seen failing for the
  intended reason before the fix.
- **Expect existing scripted findings to break.** By the diff parse recorded in
  `N1`'s session, `src/client.js` changes only head lines 2 and 4 and
  `src/paginate.js` only 3 and 4, so the suite's timeout findings at
  `client.js:5-5` and its location-mismatch finding at `paginate.js:7-7` are
  not valid anchors. Move them onto changed lines. A location-mismatch test then
  needs a valid anchor outside every acceptable range, and the pinned
  `formatScore` text may move with it.
- Disable each new rule in turn and confirm the suite fails, as `N1` did for
  every earlier guard.
- `README.md`, the corpus and its pinned hash should not need to change. If one
  does, say why.

Commit the fix on its own, for example
`fix(benchmark): refuse a finding location no validated finding could have`.
Push, then reply once on thread `4000178733` with one plain sentence naming the
commit, with no em-dash because it posts under the user's name, and resolve it:

```sh
gh api repos/xpepper/copilot-pr-review/pulls/43/comments/4000178733/replies \
  -f body='Fixed in COMMIT: ...'
gh api graphql -f query='query { repository(owner: "xpepper", name: "copilot-pr-review") {
  pullRequest(number: 43) { reviewThreads(first: 20) { nodes { id isResolved
  comments(first: 1) { nodes { databaseId } } } } } } }'
gh api graphql -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) {
  thread { isResolved } } }' -f id=THREAD_NODE_ID
```

## Record, hand off, merge

`ROADMAP.md` is 64116 bytes at `e92f9a2`, **only 1420 below** the 65536 bytes at
which this tool's own discovery stops reading it. Add to `N1`'s entry one short
paragraph: the comment, the reproduction, the fix commit, that no plugin review
covers it, and the Codex and `@claude[agent]` outcomes. Keep the file under the
cap with room to spare, and **do not archive `N1` here**: the `H1` session does
that before writing its own entry.

Then replace this file with the `H1` prompt, as the last repository edit. Build
it from the `H1` handoff this file replaced, `git show e92f9a2:HANDOFF.md`: keep
its `H1` job, its scope-decision rule, and its headroom, validation, workflow and
runtime sections, and update whatever this session changed. It must tell the
next agent to confirm #43 is merged rather than embed the merge commit, which
does not exist yet.

Before each commit, run `smoke-safeguards.mjs`, `smoke-review.mjs` and the
affected suite; before the final push, the whole eighteen-suite set listed in
`README.md` and CI. Also run `git diff --check`, the tracked-control-byte check
including `*.diff`, plain `grep -rnP '[\x00-\x08\x0B\x0C\x0E-\x1F]'` over any
new or untracked file, and the safeguard collector, which must read all six root
instruction files and skip none. In `N1`'s session a typed unicode escape for
code point 7 twice landed on disk as a raw BEL byte; build such characters with
`String.fromCharCode`.

Commit `ROADMAP.md` and `HANDOFF.md` together as the final branch commit and
push. Before merging, confirm:

- the checkout is clean and exactly the pushed head;
- every check on that head has passed. Take snapshots with `gh pr checks 43`
  rather than a long `--watch`: `claude-review` took almost seven minutes on
  `e92f9a2`. If a check fails, do not merge; record it and report to the user;
- no new comment asks for a change. If one does, stop and ask.

Merge the way every earlier increment was merged: a squash whose subject is the
pull-request title followed by its number. The repository deletes the branch on
merge.

```sh
gh pr merge 43 --squash --subject "N1: a seeded review corpus and a deterministic scorer (#43)"
```

Then switch to `main`, pull with `--ff-only`, and confirm that `main`'s tree
equals the merged head's tree and that CI passes on `main`. Make no further
repository edit, because `main` refuses direct pushes. Report the fix commit, the
thread reply and resolution, the merge commit and the checks, and point to
`HANDOFF.md` rather than repeating it.

## Settled constraints

Follow `AGENTS.md` throughout: validated checkpoint commits on the branch; never
push to `main`, amend published history or force-push; keep review findings
local; and ask before any GitHub write this prompt does not name. No runtime API
changed; CLI 1.0.83 remains the recorded runtime. Do not add review timeouts,
weaken the shell gate, use `fs.realpathSync` in `read-only.mjs`, change `F6`'s
marker unwrap, or treat a compaction event as a retry or stop condition.
