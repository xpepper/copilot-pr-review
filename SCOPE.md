# Copilot PR Review: Agreed Scope

Status: confirmed on 2026-09-06. This document records the product scope;
implementation has not started. Recording this scope does not authorize the
runtime prototype or subsequent implementation.

## Goal

Port the useful review workflow of `pi-pr-review` to GitHub Copilot CLI:

- Configurable review modes with the original parallel specialist assignments.
- Configurable light, medium, and heavy models and reasoning levels.
- Evidence-based validation and deduplication of findings.
- Finding selection and publication as resolvable GitHub inline review comments.

The first release serves personal use, with packaging suitable for sharing later.
Copilot CLI is the acceptance target. Package the tool as a plugin, preserving
portable components where inexpensive. VS Code and other Agent Plugins clients
are opportunistic targets, not v1 compatibility commitments.

## Upstream baseline

The inspected upstream is `pi-pr-review` 1.17.10 at commit
`457e18e30437984e2e6680802c9da25d270b82cc`.

- [Package listing](https://pi.dev/packages/pi-pr-review?name=review)
- [Source repository at the inspected revision](https://github.com/10ego/pi-pr-review/tree/457e18e30437984e2e6680802c9da25d270b82cc)
- [README and configuration](https://github.com/10ego/pi-pr-review/blob/457e18e30437984e2e6680802c9da25d270b82cc/README.md)
- [Review prompt and reviewer assignments](https://github.com/10ego/pi-pr-review/blob/457e18e30437984e2e6680802c9da25d270b82cc/prompts/pr-review.md)

Upstream combines a prompt-driven orchestrator with code-owned reviewer topology,
execution supervision, result handling, and publication gates. It is not merely
a prompt template. Its live reviewer viewer is read-only; interactive finding
selection is an addition in this port.

Preserve upstream behavior unless this document explicitly changes it. This is
behavioral guidance, not a requirement to copy pi-specific implementation details
or reproduce every upstream configuration field. Later upstream changes do not
silently alter this scope.

The package declares MIT licensing, but a standalone license text was not found
during research. Confirm applicable licensing and attribution obligations before
reusing or redistributing source.

## Review modes and findings

Balanced is the default. Mode flags are mutually exclusive.

| Mode | Reviewer assignment | Findings policy |
|---|---|---|
| `--quick` | Three heavy reviewers: correctness, contracts, combined security/performance/resources | Substantiated P0-P2 only |
| `--balanced` | Four heavy specialists: correctness, contracts, security, performance/resources; one light overview | P0-P2 plus at most three direct-diff P3/nit findings |
| `--full` | Balanced reviewers plus one medium conventions/maintainability reviewer | All qualifying severities |
| `--deep` | One integrated heavy reviewer considering the whole PR | All substantiated severities |

Preserve `--major-only` as the upstream alias for `--quick`.
Deep means holistic review, not a larger parallel review or an ascending fourth
effort level. Reviewer count and concurrency follow the selected mode.

Every mode must validate candidate evidence and deduplicate before presenting
findings for selection. Review the PR's changes and their provable effects, not
unrelated pre-existing repository problems. Reading surrounding code is permitted
to establish context and confirm impact.

Preserve the original severity, location, confidence, and human-readable review
structure. A failed or incomplete reviewer must remain visible as incomplete
coverage; it must never become a clean-review claim. Useful validated findings
may survive incomplete execution, following the original degraded-review
behavior.

## Targets and local behavior

- Accept a PR number for the GitHub repository owning the current directory.
- Preserve upstream draft, obvious bot, and clearly trivial-change skip behavior.
- Add an explicit option to bypass draft skipping; its exact flag name is not
  yet fixed. Drafts remain skipped by default.
- Preserve confirmation before reviewing closed or merged PRs, including the
  upstream `--include-closed` / `--review-closed` override.
- Keep review context bound to the captured PR and reviewed head. Do not mistake
  a different local branch's code for evidence about the reviewed revision.
- Do not switch branches, modify source, commit, or push as part of review.

Cross-repository invocation, local-diff review, arbitrary commit-range review,
and non-GitHub hosting are not additions required for v1.

## Models, configuration, and execution

Use models available through the Copilot subscription only. External-provider
credentials and cross-provider failover are out of scope.

Support configurable light, medium, and heavy model assignments and reasoning
levels. The model names discussed during discovery were illustrative, not
hardcoded defaults. When a tier is unset, preserve upstream nearest-configured-
tier and ambient-model inheritance. Display effective assignments before
execution.

Validate explicit model and reasoning settings against available capabilities.
Do not silently lower reasoning effort or substitute a different model for an
invalid explicit setting. Optional fallback models start unset and must be
configured explicitly. Preserve the upstream bounded fallback-attempt policy
for eligible explicit failures: at most one configured fallback attempt per
affected reviewer, rather than restarting the whole review.

**Do not impose review timeouts.** Wait for completion or manual cancellation.
A hung reviewer may therefore wait indefinitely; elapsed time alone must not
trigger a fallback. Copilot or provider limits are external constraints, not
plugin-imposed deadlines. Upstream deadline settings and its overall hard cap
are intentionally not ported.

Cancellation must stop owned review work and prevent unintended publication.
Provide basic per-reviewer progress, explicit failure reporting, and completion
state. A live scrolling view of reviewer output is not required.

Provide text-based configuration inspection and updates, following the
`/pr-review-config show` and `key=value` workflow. Persist personal configuration
and support explicitly trusted project overrides. A repository cannot establish
its own trust merely by containing a configuration file. Explicit invocation
flags take precedence over saved settings.

An interactive configuration menu is deferred. Exact configuration file paths
and implementation language are not fixed by this scope.

## Selection, publication, and cached results

Present findings for selection before publication. Editing findings is optional
and deferred. The exact selection UI is an implementation choice; recreating
pi's terminal UI is not required.

Publish primarily resolvable inline comments in a GitHub review, retaining the
original concise-summary behavior for applicable non-inline findings. The only
GitHub review event emitted by the port is `COMMENT`: never `APPROVE` or
`REQUEST_CHANGES`. Finding severity does not authorize a different event.

| Control | Behavior |
|---|---|
| `--all` | Select every validated finding; does not itself authorize posting |
| `--comment` | Authorize posting without final confirmation; does not bypass selection |
| `--no-comment` | Suppress posting during this run |
| Neither posting flag | Follow effective `autoPostReviews`, which defaults to false |
| Explicit publish-later command | Authorize publication of a retained result without rerunning reviewers |

Reject `--comment` together with `--no-comment`, as upstream does.
Without automatic posting authority, publication requires explicit user
confirmation or a later explicit publish request.

Retain the original `autoPostReviews` setting in personal and explicitly trusted
project configuration. This was the final decision and supersedes the earlier
proposal that only `--comment` could bypass final confirmation.

Consequently, `--all --comment` can publish unattended, and `--all` with effective
`autoPostReviews=true` can also publish unattended. Without `--all`, finding
selection still applies. Posting authority does not authorize safeguard execution.

Publication must be code-controlled, not an instruction for the model to assemble
arbitrary GitHub mutations. Preserve repository/PR binding, valid diff anchors,
head identity, lifecycle gates, and safe handling of uncertain write outcomes.
Do not blindly retry a write whose outcome is unknown.

Reject publication if the PR head has changed. Do not port upstream's stale,
body-only publication fallback or stale approvals. Reviewing a draft through
the new override does not implicitly bypass publication lifecycle gates.

Include cached publish-later in v1. Retain the reviewed result and findings,
bound to the originating session, repository, PR, and reviewed commit. Preserve
the original session-scoped reload/resume behavior where supported; do not
introduce a cross-session review archive. Publishing the cache must not rerun
reviewers or silently accept a changed head.

## Optional project safeguards

Ordinary review is read-only. `--verify` opts into running existing project
safeguards such as tests, compilation, or linting to ground claims in evidence.

Before starting reviewers for a verification-enabled run, require all of:

- The current branch matches the PR's head branch.
- Local HEAD equals the captured PR head SHA.
- The working tree is clean.

Otherwise stop with a clear error. Never automatically switch branches, pull,
stash, or clean the checkout.

Discover existing project safeguard commands, present the exact commands, and
obtain approval before executing them. Run in the current checkout using already
installed dependencies. Do not install dependencies, use auto-fix options, or
invent new safeguard scripts.

These commands execute PR-controlled code and may create artifacts. This is not
a sandbox or a filesystem-read-only operation. The checkout-based policy
deliberately differs from upstream's trusted verification profiles and isolated
worktrees. Publication flags and saved automatic-posting settings do not bypass
command approval.

## Priority and release boundary

| Classification | Scope |
|---|---|
| Must-have | Original review modes; configurable models/reasoning; parallel specialists; evidence validation; deduplication; finding selection; inline publication and authority controls; correct anchors/head binding; cancellation; incomplete-coverage reporting |
| Costly-to-lose, included in v1 | Cached publish-later; basic per-reviewer progress; configured Copilot-model fallbacks |
| Additional agreed v1 capability | Opt-in safeguards with the branch/SHA/cleanliness and command-approval rules above |
| Nice-to-have, deferred | Interactive configuration menu; finding editor; live scrolling reviewer viewer; detailed timing/usage reports |
| Dropped from v1 | Coding-task self-review; automatic approvals; stale publication; experimental malformed-output finding extraction; external model providers |

The earlier proposal to require bounded execution was explicitly superseded by
the decision not to impose timeouts.

## Technical uncertainties and proposed sequence

Experimental CLI APIs are acceptable if needed to deliver the core behavior.
The installed SDK documents agent factories with per-agent model/reasoning
selection and parallel execution, but research is not proof of a working port.

A small future prototype must establish:

- Local plugin loading and access to the chosen runtime integration.
- Distinct per-agent models and reasoning levels during parallel execution.
- Enforceable read-only reviewer permissions.
- Progress, failure propagation, and cancellation without abandoned work.

Choose the runtime integration after those capabilities are demonstrated.
Do not build a cross-platform execution abstraction speculatively.

Proposed delivery sequence, subject to subsequent implementation authorization:

1. Record scope and assess source reuse/licensing.
2. Demonstrate CLI execution capabilities in small, reversible prototypes.
3. Deliver a real `--quick --no-comment` review with validated findings.
4. Add selection, retained results, and gated inline publication.
5. Complete remaining modes, configuration, fallbacks, safeguards, and user docs.

Implementation work should be sliced into approximately 1-3-hour increments.
These are planning targets, not delivery estimates or review runtime limits.

Platform references:

- [Agent Plugins specification](https://agent-plugins.org/specification)
- [Copilot CLI plugin creation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
- [VS Code agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)

Plugin-format support does not establish equivalent execution behavior across
clients. Other-client compatibility remains optional until demonstrated.
