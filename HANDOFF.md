# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and open pull requests before editing anything. Scope is authoritative;
the roadmap records demonstrated evidence and the exact next step. Do not rely
on another conversation, reopen settled product decisions or infer behavior
from an API declaration.

## Where things stand

`S2` is complete. `v0.2.0` is tagged, listed and installed from the marketplace.
The only current repository work is the documentation-only closing branch
`s2/release-evidence`, which records the completed release evidence and this
fresh-session handoff.

Pull request #60 squash-merged as `3889064`, bumping `plugin.json` from `0.1.0`
to `0.2.0`. Its one authorized plugin review used the exact branch install:
balanced, `gpt-5.6-terra`/high for four heavy reviewers and the adjudicator,
`gpt-5.6-luna`/high for overview, 75.476181 credits, 17 requests, 205.4 seconds
of model work, 82.6 seconds elapsed, INCOMPLETE coverage, 0 validated findings,
0 execution failures, 3 discarded candidates, 3 coverage gaps and 1
informational caveat. Nothing was published.

Three reviewers incorrectly claimed H2 had not been archived; the unchanged
archive already contained it. The adjudicator rejected the one candidate that
reached it because the captured context could not prove the claimed loss. A
fourth reviewer correctly noticed a stale "open the PR" next step; its candidate
failed the exact quote gate, but the wording was fixed. No second review ran.

GitHub's controlled-suites job passed. `claude-review` failed twice before any
model call because the user's Claude five-hour credits were exhausted. At the
user's explicit instruction, #60 was merged regardless. Those zero-usage
failures are neither a review nor evidence about the release.

## Release evidence

- All 19 controlled suites, manifest assertions, self-readability, control-byte
  and diff checks passed at merged commit `3889064`.
- Annotated tag `v0.2.0` points to `3889064`.
- A detached tag checkout installed as v0.2.0, matched its cached copy
  byte-for-byte and passed `scripts/smoke-runtime.mjs --targets`, which asserted
  no model calls, subagents or tool executions.
- xpepper/copilot-plugins#3 updated the marketplace manifest version and ref
  together to `0.2.0`/`v0.2.0` and updated its README row. It squash-merged as
  `8e8f113`.
- The merged marketplace manifest and README were read back and agree.
- After marketplace refresh, `copilot-pr-review@xpepper-copilot-plugins`
  installed as v0.2.0, matched `git archive v0.2.0` byte-for-byte and passed the
  same no-inference runtime probe. This marketplace copy remains installed.
- A GitHub Release for `v0.2.0` exists as an unpublished draft. Publishing it
  requires a new explicit instruction.

## Exact next step

Complete the documentation-only closing pull request from
`s2/release-evidence`. If it is already open, inspect its state. Documentation-
only work still lands through a pull request, but its plugin review costs
credits and is the user's choice rather than a requirement. Do not run one
unless the user explicitly asks. The user merges the closing PR.

After that, **nothing is scheduled**. Ask the user what to work on; do not pick
anything under ROADMAP's "Recorded, not scheduled" list. The draft GitHub
Release is not queued work and must remain unpublished unless the user asks.

Follow the checkpoint, pull-request and handoff rules in `AGENTS.md`. Before
ending any later project session, update `ROADMAP.md`, then refresh this file as
the final repository edit, commit and push. Never rely on this conversation.

## Caveats

- `README.md` is 65527 bytes, only 9 below the 65536-byte safeguard limit.
- Open pull requests #1 and #2 are synthetic "do not merge" playgrounds.
- The installed plugin is the marketplace v0.2.0 build.
- Every future tag, GitHub Release publication and marketplace-index write needs
  its own explicit authorization.
