# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the exact next increment. Do not rely on this
conversation or reopen Q5's settled decisions.

## Recorded state

This handoff is prepared for a fresh session on **clean `main` after the
user-authorized merge of pull request #13**. Confirm the merge, branch and
working-tree state before proceeding; if #13 is still open, report the
unfinished merge rather than starting another increment.

Q6 is complete. Its branch was `q6-source-bound-quote-repair`, from `main` at
`ba8f0fc` (the squash merge of #12). Implementation checkpoint `fb0ec79` was
reviewed with the installed plugin once; `6e5b420` recorded that review.
The later checkpoints, including this handoff, change documentation only and
were not reviewed again. A squash merge need not retain those individual
commits as ancestors of main; use #13 and git history to reconcile state.
No uncommitted work or increment in flight is intended to remain.

Q6 repairs candidate-only clipped quote ends from the exact bound source range.
It requires a contiguous span, the same physical line count, and non-whitespace
text on both boundary lines. The restored citation goes through strict `cite()`;
line ranges, changed-line anchors and Q5's same-hunk rule never move. Each repair
is a caveat carrying original and restored citations, passed to the adjudicator
and retained. Candidate claims are never rewritten. Adjudicator evidence and
publication still use exact-only citations.

The controlled fixtures reconstruct #11's missing leading spaces, #12's missing
trailing comma and mid-sentence evidence quote, and #4's inserted-space
fabrication. Original source excerpts were compared against the reviewed heads.
Both real findings reach controlled adjudication; the fabrication does not.
This proves plumbing, not live model judgment. The retained-record and candidate
schema versions are unchanged, so the F5 candidate-schema mirror is unchanged.

Q5 remains settled: `breaks` is optional and normalized to null, may cite
unchanged code or another hunk/file inside the captured windows, and has no
anchor rule of its own. Supplied before/after citations still belong to the
location's hunk; null introduction sides are claims for adjudication.
Deduplication includes `breaks`, and the inline comment body stays unchanged.
Ask before changing the retained-record schema version: it tracks publication
authority, not candidate shape.

## Review of record and remaining limits

The single authorized review used explicit **balanced** mode, because Q6 adds
no mode and balanced is the default topology. It cost **134.753239 credits**.
Heavy reviewers ran `gpt-5.6-terra`/high; overview ran `gpt-5.6-luna`/high.
Four reviewers completed; contracts returned no usable output after a read
denial on a nonexistent root-level `findings.mjs`. There were 52 tool calls,
51 reads, one permission denial and no tool denials.

Coverage is **incomplete**: one execution failure, one coverage gap and three
caveats. Correctness reported that real repaired-candidate semantic behavior
could not be established from the captured changes. There were no candidates,
no adjudicator, no findings or withheld findings, and no publication. No live
repair was exercised. This is not a clean-review claim, and it does not measure
repair-diagnostic token/credit overhead. No implementation fix followed because
no defect candidate was proposed. Do not weaken a gate or rerun to obtain a
positive result.

The complete timeline was saved before analysis in:
`$HOME/.copilot/session-state/d6d1da8c-3f3a-4ff9-b133-3fa85f9bbd1e/files/q6-review-timeline.log`.
That directory also contains `q6-review-evidence.json` and the original
`q6-<reviewer>-verbatim.txt` strings from the timeline's structured evidence,
including the empty contracts output. They stay local. The retained review is
in originating session `b47f1b5c-38ba-4744-8512-bd6030c89b5b`; the roadmap
records its invocation, digest, charges and exact reproduction command.

## Exact next step

**Discuss C5's boundary, then wait for approval before implementation.**
The user explicitly chose that next step on 2026-09-08. Merge authorization is
not authorization to implement C5, run another review of #13, or spend credits.
Do not redo Q6 or widen it; its one-review authorization is spent.

C5 moves retry eligibility across the evidence boundary and changes what
completed means. Read "Exact next increment" in the roadmap and inspect the
current execution/collection seam. Explain the difference between an invalid
envelope, a valid envelope with an invalid candidate, and a valid empty result.
Propose a precise eligibility rule and a decision table, including no configured
fallback, failed fallback, cancellation, useful sibling candidates, coverage
and retained statuses across every mode. Keep Q6 repair and semantic rejection
distinct from malformed output. Explain the cost of an additional attempt.

The session's acceptance criterion is a source-grounded proposal with controlled
acceptance cases and unresolved choices identified, followed by an explicit
approval gate. **Do not edit implementation or run inference before approval.**
Any later implementation must preserve the one-configured-fallback limit,
no whole-review restart, no silent substitution, no cancellation retry and no
timer. Keep L1 pending and copy no upstream source. Do not start V1 or another
increment instead.

## For a future authorized increment

Work on its own branch and PR. Commit and push first; check out that PR head
before installing. Only after that increment is authorized:

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --balanced --all --no-comment
```

Choose the mode explicitly and justify it; balanced is the default when no
other topology is required. Capture the complete stdout timeline outside the
checkout and save original reviewer strings before analyzing. Do not modify the
working tree while reviewers read it. There is no timeout: a quiet timeline is
not a hang. Wait for completion or explicit manual cancellation.
`copilot -p "/pr-review NUMBER"` starts an ambient model turn and is not a
substitute for command dispatch. Findings stay local; no publishing is authorized.

The standing workflow authorizes exactly one review per increment PR, not
reruns, extra probes, or `scripts/smoke-factory.mjs --spend`. Historical reviews
are already spent and carry no authorization forward. Playground PRs #1 and #2
must never be merged or republished.

## Validation and runtime caveats

The twelve controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture and target. They require no inference/network.
All passed before Q6 editing. Findings, review, preview, retention and
publish-later passed after implementation; the focused additions and outcomes
are in the roadmap. No inference was used by those controlled suites.
Do not describe historical installed probes as rerun in this session.

No runtime API was changed. CLI 1.0.83 remains the recorded runtime. Derive the
SDK path from `copilot --version`; old packages remain installed. Consult the
installed SDK and current official documentation before adopting new APIs.
Do not revisit Agent Factories without a new CLI version. Do not widen F6's
marker unwrap or reintroduce substring matching; #13 added well-formed envelopes
from every completed reviewer to its existing live evidence. Never add a
timeout, deadline or stuck-reviewer heuristic.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe,
restore it afterwards, and verify the restore with `shasum -a 256`. It requires
a second non-ambient model with configurable effort and a model with none.
Q6 changes no configuration/runtime API and needs no such probe.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows. Absent
checkout paths still produce the same denial as paths outside the checkout;
#13 repeated this observation, which is not authorization to change confinement.

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and PR, never direct `main` pushes, no force-push or amended published
history. Merging remains the user's decision. Preserve unrelated changes.
Inspect enumerations and counts when extending a concept; do not repeat the Q5
adjudicator-contract omission. Update README for user-visible behavior.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to this PR. Refresh it last again if any
further edit is necessary. Report commit/PR outcome and point to this handoff.
