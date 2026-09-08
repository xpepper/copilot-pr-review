# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the exact next increment. Do not rely on this
conversation or reopen Q5's settled decisions.

## Recorded state

Q6 is in progress on `q6-source-bound-quote-repair`, branched from `main` at
`ba8f0fc` (the squash merge of #12). Implementation and controlled evidence are
ready for the checkpoint containing this handoff. The increment's pull request
and its installed-plugin review are still pending at this checkpoint. Inspect
GitHub and the roadmap before acting: this handoff will be replaced after the
review. No unrelated work was present when the increment started.

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

## Exact next step

Finish Q6's pull request and its one authorized installed **balanced** review.
Balanced is deliberate: Q6 adds no mode and it is the default topology. Save the
reviewers' verbatim timeline output before analyzing anything. Record actual
models and efforts, coverage, tool calls/reads/denials, findings and withheld
findings, gaps, reported credits and responses to findings in `ROADMAP.md`.
Fix real findings with validated new commits on this branch, not amendments.
Do not rerun inference without fresh user authorization.

After Q6, stop and ask before C5. It moves retry eligibility across the evidence
boundary and changes what completed means; it is not part of Q6. Its acceptance
and design questions are in the roadmap. Keep L1 pending and copy no upstream
source. Do not start V1 or another increment to avoid the C5 authorization gate.

## Running the review

Commit and push first; check out the PR head before installing:

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --balanced --all --no-comment
```

Capture the complete stdout timeline outside the checkout. Do not modify the
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
All passed before editing; the focused Q6 suites and outcomes are in the roadmap.
Do not describe historical installed probes as rerun in this session.

No runtime API was changed. CLI 1.0.83 remains the recorded runtime. Derive the
SDK path from `copilot --version`; old packages remain installed. Consult the
installed SDK and current official documentation before adopting new APIs.
Do not revisit Agent Factories without a new CLI version. Do not widen F6's
marker unwrap or reintroduce substring matching; it has live evidence from five
runs. Never add a timeout, deadline or stuck-reviewer heuristic.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe,
restore it afterwards, and verify the restore with `shasum -a 256`. It requires
a second non-ambient model with configurable effort and a model with none.
Q6 changes no configuration/runtime API and needs no such probe.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows. Absent
checkout paths still produce the same denial as paths outside the checkout;
that observation is not authorization to change confinement.

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
