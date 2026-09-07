# Next session prompt

Copy everything below into a fresh session.

---

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md` in this repository, then inspect
the working tree and recent commits before editing anything. `SCOPE.md` is the
authoritative product specification; `ROADMAP.md` records demonstrated evidence,
runtime caveats and the exact next increment. Do not rely on any previous
conversation and do not reopen settled product decisions.

## Where the work stands

The last checkpoint is `340ab77` "feat: let quick reviewers read the verified
checkout". The working tree was clean at that commit apart from this handoff.

That checkpoint completed the **first half of R1**: quick reviewers now receive
`view`, `grep` and `glob` confined to the local checkout, but only after a hard
revision-identity gate (`extensions/pr-review/checkout.mjs`) proves the checkout
is exactly the reviewed revision. Read the "Completed increment: R1, first half"
section of `ROADMAP.md` for the full demonstrated evidence and limitations; do
not re-derive them.

No inference has been spent on reviewer reads yet. Nothing proves a reviewer
*model* uses the read tools well.

## Your increment

Implement only the "Exact next increment" section of `ROADMAP.md`: **R1, second
half.** In short:

1. Give `scripts/runtime-target.mjs` a fixture mode whose PR head is a real
   commit in the temporary checkout, so fixture-driven `--quick` runtime probes
   can satisfy the gate again. Today `prepareTargetSmoke` builds a deliberately
   dirty checkout on `not-the-pr-branch` with the synthetic head `"b" * 40`,
   which can never pass; keep that existing mismatched-checkout refusal
   demonstration working under its own fixture.
2. Bump the `reads >= 3` drift thresholds in `scripts/target-fixture.mjs` to `4`
   (fixture PRs 11, 54 and 55), because the gate adds a third metadata read.
3. Make `preparePublicCheckout` fetch and detach the reviewed head for live
   public targets, without touching any repository the user cares about.
4. Only with the user's explicit authorization, run **one** live quick review on
   a PR whose real risk lives in code the diff does not contain, and record
   verbatim what happened: which read tools were actually called, what was read,
   whether any read was denied, whether findings improved over the diff-only
   baseline, and the credit cost. An honest negative result is a valid outcome.

Respect the increment's exclusions: no `--verify`, no test or lint execution, no
`bash`, no custom revision-bound tools, no balanced/full/deep, no fallbacks or
timeouts, and **no override flag for the gate**. Do not change personal
configuration, project trust, selection, binding, lifecycle, publication or
authorization gates. Keep L1 pending and copy no upstream source. Never switch
branches, stash, clean or pull to satisfy the gate.

## Runtime caveats that will bite you

- Consult the installed SDK (`~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`)
  and current official documentation before adopting any runtime API. Demonstrate
  capabilities; never infer them from type declarations.
- Reinstall the plugin with `copilot plugin install "$(pwd)"` after **every**
  change under `extensions/`, before running any installed-runtime probe. The
  deprecation warning is expected.
- Controlled suites (no inference, no network):
  `node scripts/smoke-<name>.mjs` for `findings`, `quick`, `selection`,
  `retention`, `preview`, `publication`, `publish-later`, `checkout`, `config`,
  `context`, `fixture`, `target`. All twelve pass today. Also run
  `git diff --check`.
- Installed-runtime probes need both variables:
  `COPILOT_CLI_PATH="$(command -v copilot)"` and
  `COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk"`.
  `scripts/smoke-reviewer-tools.mjs`,
  `scripts/smoke-runtime.mjs --targets --startup` and
  `scripts/smoke-retention-runtime.mjs` all pass today without spending
  inference.
- `--quick` runtime probes spend credits. Never run one without explicit
  authorization in the current session, and never publish a review comment
  without the authorization the code already requires.
- Cold `session.resume` of a retained record is unsupported by the runtime; do
  not invent transcript recovery.

## Working rules

Distinguish demonstrated behavior from assumptions in everything you write. If a
claim is not backed by a probe you ran in your session, say so.

Commit locally at each meaningful checkpoint with the trailer
`Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`. Stage
only the files belonging to that checkpoint, do not amend or rewrite history,
and **do not push**.

Before ending your session, update `ROADMAP.md` with the outcome, reproduction
commands, remaining limitations and the exact next small increment, update
`README.md` if user-visible behavior changed, and then rewrite this `HANDOFF.md`
as the final repository file edit before your session-ending commit. This file
is a replaceable handoff, not a history; overwrite it completely. Pass these same
commit and handoff rules on to the next agent.
