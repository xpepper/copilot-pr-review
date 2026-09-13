# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, the open
pull requests and their checks before editing anything. Scope is authoritative;
the roadmap records demonstrated evidence and what remains open. Do not rely on
another conversation, reopen settled product decisions or infer behavior from
an API declaration.

## First settle pull request #42

`W1` is complete on branch `w1-remediation-sentence`, pull request #42. The
five-commit implementation head the installed plugin reviewed was `9896b23`.
The commit containing this handoff is the later review-response checkpoint:
inspect `git log` for its hash and confirm it is pushed, the tree is clean and
GitHub checks pass. Merging is the user's decision.

The one authorized plugin review for this increment has already been spent.
**Do not rerun it without fresh explicit authorization.** It ran deep, without
`--long-context`, with findings kept local:

- integrated reviewer and adjudicator: `gpt-5.6-terra`, high effort,
  `contextTier: default`, no context loss;
- 3 reported requests over 2 paid passes, 81.62026 credits, 89.115 s model time
  against 113.423 s elapsed;
- 6 approved confined read calls, no permission or tool denial;
- INCOMPLETE coverage, 0 validated/rejected/duplicate/capped/outside findings,
  and no withheld finding.

It produced two candidate signals whose citation paths failed validation. The
first described the already-recorded parser ambiguity: a pre-`W1` introduction
ending in a one-line `Fix:` paragraph is byte-identical to the new encoding.
That stays a limitation because refusing the shape would also refuse every real
post-`W1` comment without version evidence. The second correctly observed that
two sentences on one physical line passed. The adjudicator accepted it but its
own citation was invalid, so it was not a finding; the branch fixed it anyway
with one shared `Intl.Segmenter` check at ingestion and publication. Tests first
failed on `"Multiply instead. Then retest."`, and disabling either guard makes
its own suite fail. Ordinary abbreviations and inline code remain accepted.

`ROADMAP.md` carries the complete review record, disposition, limitations and
reproduction evidence. Before this handoff was written, all seventeen
controlled suites passed, `git diff --check` was clean, no tracked text carried
a control byte, and safeguard discovery read all six root files and skipped
none. The old five-commit PR head passed both GitHub checks; inspect checks on
the review-response commit rather than assuming they followed.

No finding was posted. No GitHub Copilot reviewer or `@claude[agent]` review was
requested. The review log is a session artifact, not repository state.

## Your job after #42 merges is `N1`, and only `N1`

Confirm with `gh` that #42 is merged, update `main`, and create a fresh named
branch from `main`. If #42 is not merged, ask the user rather than stacking
`N1` on it.

`N1` is the free, deterministic half of the benchmark proposed by `G1`:

1. Add a small corpus of synthetic diffs pinned by content hash.
2. Give each seeded defect a stable identity, target severity, allowed
   severities, acceptable locations and the concepts a matching report must
   contain.
3. Include clean controls that must draw no finding.
4. Add a deterministic scorer that uses no model and no network.
5. Reject an explicit non-finding before matching, so prose saying a case is
   safe cannot score as detecting its defect.
6. Run the corpus and scorer in a new controlled smoke suite and CI. If this is
   an eighteenth suite, add it to `.github/workflows/ci.yml` and every documented
   full-suite loop.

The scorer must make its matching and failure output reproducible enough that a
bad corpus entry or score can be diagnosed without inference. Pin fixtures as
plain text and keep their expected metadata explicit; do not make a hidden
heuristic stand in for ground truth.

### Hard boundary

Do **not** add a collection runner, spend credits collecting model outputs,
choose a review-mode matrix, publish recall/precision numbers, or add a baseline
threshold or gate. Those are not scheduled. `N1` changes no product behavior
and needs no scope decision. `H1` and `K1` remain later increments; do not start
either.

The user deliberately scheduled only the corpus and scorer. `docs/gap-analysis.md`
is evidence and argument, not authorization to restore its larger staged plan.
The six declined `G1` proposals remain declined, not deferred.

## Headroom and validation

At handoff, `ROADMAP.md` is 63250 bytes and `README.md` is 63502 bytes; root
files stop being discovered at 65536 bytes. Archive `W1`'s entry verbatim into
`docs/roadmap-archive-2026-09-10.md` before writing `N1`'s live entry, updating
the archive pointers and counts exactly as earlier moves do. A scripted move
must dry-run and refuse unless each old string matches exactly once.

The current controlled set is:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost; do node scripts/smoke-$s.mjs; done
```

Add the benchmark suite to that loop when it exists. Before every checkpoint,
run the affected targeted suite and the repository-required
`smoke-safeguards.mjs` and `smoke-review.mjs`; run the whole set before opening
the pull request. Also run `git diff --check`, the tracked-control-byte check and
the real safeguard collector, which must read all six root instruction files
and skip none.

Test first means observing the scorer tests fail for the intended reason before
implementation. Keep fixture source plain text; a raw control byte previously
caused this tool to refuse its own review.

## Pull-request workflow

Follow `AGENTS.md`: meaningful validated local checkpoint commits are
authorized, each with the required co-author trailer. Push the `N1` branch and
open its own pull request; never push directly to `main`, amend published
history or force-push.

Because `N1` changes `scripts/`, its pull request still needs exactly one
installed-plugin review as verification of record under this repository's
workflow, even though the benchmark itself spends nothing. **Ask before that
review spends credits.** Keep findings local with `--no-comment`. Ask separately
before any public GitHub Copilot reviewer request or `@claude[agent]` mention.

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

Balanced is the default unless the user chooses another mode. Run the command
in the background with no timeout, edit nothing while it reads the checkout,
and parse the mode-prefixed evidence JSON from the log. Record actual model,
effort, context tier, reviewer coverage, tool calls and denials, findings,
withheld findings, context loss and reported credit cost. A refusal or
incomplete review is evidence, not a reason to weaken a gate or rerun.

## Runtime and settled constraints

No runtime API changed in `W1`; CLI 1.0.83 remains the recorded runtime.
`scripts/smoke-runtime.mjs --targets` has not run since `I1b` and is unrelated
to `N1`. Do not spend credits or run live probes merely to close that gap.

Do not widen `N1` into product behavior. Do not add review timeouts, weaken the
shell gate, use `fs.realpathSync` in `read-only.mjs`, change `F6`'s marker unwrap,
or treat a compaction event as a retry or stop condition. Code proves that a
finding still stands and never that it disappeared. An unknown write outcome
stops the reply set. Cold resume of command-only records remains unsupported.

Before ending the next session, update `ROADMAP.md` with evidence and the exact
next increment, then replace this file as the final repository edit. Include it
in the final branch commit and push it to the pull request. Report the commit
and pull-request outcome and point here rather than duplicating the prompt.
