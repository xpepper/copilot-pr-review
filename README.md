# Copilot PR Review

An original Copilot CLI plugin prototype. **Quick reviews now include grounded
candidate validation, deduplication, finding selection, and session-bound retention.
Publication is not implemented.**
[SCOPE.md](SCOPE.md) is the authoritative product specification;
[ROADMAP.md](ROADMAP.md) records delivery status and runtime evidence.

## Install and invoke

From this checkout:

```sh
copilot plugin install "$(pwd)"
copilot plugin list
copilot --experimental
```

Wait for plugin/extension loading to finish, then enter:

```text
/pr-review
/pr-review status
/pr-review help
/pr-review models
/pr-review inspect
```

These commands are implemented in JavaScript by a plugin-shipped extension, not
a model prompt. Status/help make no model calls. `models` queries the session's
available subscription models and reasoning capabilities without inference.

### Read-only PR target capture (Q1)

```text
/pr-review 123
/pr-review 123 --include-drafts
/pr-review 123 --include-closed
```

A PR number captures the GitHub repository owning the **current session
directory**, PR metadata, base/head SHAs, and diff through `gh`. It does not
start reviewers, change branches, read local source as PR evidence, or post
anything. Without `--quick` / `--major-only`, this command remains capture-only.
The quick execution path is described below; other review modes are not yet
implemented.

Drafts are skipped unless `--include-drafts` is supplied. Obvious bot accounts
(GitHub `Bot` type or a `[bot]` login) are skipped. The conservative trivial
gate accepts only metadata proving an empty change; small diffs, documentation
filenames, and titles claiming a typo are not proof of correctness.
Closed/merged PRs require confirmation, or `--include-closed` /
`--review-closed`. If the host has no confirmation UI, the command reports
`confirmation-required` and requires an explicit override on a new invocation.
No diff is fetched while confirmation is pending; a changed target invalidates
approval instead of silently applying it to the new target.

Successful capture creates an invocation-local snapshot. The `Q1 target:` line
reports repository/PR identity, lifecycle, base/head SHAs, diff byte count, and
SHA-256. The complete diff and PR-controlled prose are not dumped into the
parent conversation. The snapshot is not retained across commands and is not
the future publish-later cache. `captured`, `skipped`, and `declined` are
**not review results**, and none claims a clean review.

Repository identity is resolved with `gh repo view` from the session directory,
ignoring `GH_REPO` and Git directory/worktree overrides; subsequent API GETs
pin the resolved host/repository/PR. Capture checks metadata before and after
the diff and verifies file counts, hunk completeness, and added/deleted line
counts. Authentication, unavailable PRs, changing metadata, inconsistent diff
responses, and responses exceeding the 32 MiB subprocess buffer fail explicitly.
There is no silent truncation or automatic capture retry. These checks are not
a GitHub transactional snapshot guarantee. `gh` must already be authenticated. The CLI
filters sensitive extension environment variables; local stored `gh`
authentication was demonstrated, not token-only environment forwarding.

### Revision-bound source context (Q2)

A successful capture immediately binds surrounding source to the captured
revisions and reports a `Q2 context:` line. Context is fetched only through
`gh` GET requests for `repos/OWNER/NAME/contents/PATH?ref=SHA`, where the ref
is always the captured head or base SHA. The local checkout supplies nothing:
its branch, its `HEAD`, and its uncommitted edits at the same paths are never
review evidence, even when they contain the same file names.

Each fetched file must arrive as a base64 `file` at the requested path, with a
size matching the delivered bytes and a `sha` equal to the Git blob hash
recomputed locally from those bytes. When the captured diff records blob
identities in its `index` line, the fetched blob must match them. The reviewed
lines of every hunk must then appear verbatim at the diff's line numbers in the
fetched revision. Any unavailable, oversized, non-UTF-8, mismatched, or shifted
source stops the command explicitly. Nothing falls back to another revision.

The head side is fetched for every surviving changed file; the base side is
added wherever the change removed lines, so deleted and rewritten code keeps
its own provenance. Files without textual hunks, including binary changes and
mode-only changes, are reported with a reason and no source. Context windows
are the hunk ranges widened by 40 lines, clamped to the fetched revision and
merged where they overlap.

The reported summary carries provenance only: repository, head/base SHAs, per
file path, status, side, blob SHA, byte and line counts, window ranges, and a
SHA-256 of the assembled context. Source text stays out of the parent
conversation. Inside the assembled context, every line is prefixed with its
line number under a provenance header. This aids legibility, not prompt-injection
isolation. Context lives only inside the invocation; it is not cached. Quick
reviewers consume it when explicitly requested.

### Three quick PR specialists (Q3)

```text
/pr-review 123 --quick --no-comment
/pr-review 123 --major-only --no-comment
/pr-review 123 --quick --no-comment --all
/pr-review 123 --quick --no-comment heavyModel=claude-sonnet-5 heavyEffort=high
/pr-review cancel
```

These commands spend Copilot subscription credits. Quick mode runs exactly three
heavy specialists concurrently: correctness, contracts, and combined
security/performance/resources. The example model is not a default. All three
use the same heavy-tier assignment. Until saved configuration is implemented,
unset `heavyModel` and `heavyEffort` inherit the current parent session's model
and reasoning effort independently. Explicit settings and inherited assignments
must be available and compatible; an unsupported effort is an error, never
silently lowered when changing models. An unset ambient effort uses the owned
runtime's resolved default. Effective settings are displayed before prompts
and checked against actual usage. The parent model is unchanged.

Use exactly one of `--quick` and `--major-only`, together with `--no-comment`.
The existing draft/closed overrides still apply. `--comment`, other review modes,
and `--verify` remain unsupported. No personal/project configuration or
fallback is saved or applied by Q3.

Dispatch returns after acceptance so cancellation remains available during capture
or reviewer execution. Capture/skip/error messages, assignments, progress, and
candidate outputs follow in the timeline. The `Q3 binding:` line identifies the
captured repository, PR, head/base SHAs, diff/context fingerprints, and allowed
paths with source provenance. Each independent reviewer receives the captured
diff and numbered context as untrusted JSON data, with code-owned system
instructions to ignore embedded requests and use no other evidence. Reviewers
have no tools, configuration discovery, or allowed permissions. No checkout
source, branch switching, source writes, GitHub mutations, or safeguards are used.

Reviewers return strict JSON candidates with severity, confidence, location,
exact source quotations, concrete triggering conditions, expected/actual behavior,
and before/after evidence of introduction. Raw candidate output remains untrusted;
only findings surviving the Q4 boundary below appear in the final findings view.
Candidate output may quote PR source; full captured input is not dumped into the
parent timeline.

`Q3 evidence:` is emitted after owned-runtime cleanup and now includes Q4
`validation` and optional `adjudicator` records. `executionComplete` reports
specialist execution separately. `complete: true` additionally requires finished
validation without unresolved evidence or cleanup errors; it never means the PR
is correct. Failed reviewers retain partial output alongside successful reviewers
and report incomplete coverage.
Skipped/declined/unconfirmed targets report `coverage: "not-started"` and start
no reviewer runtime. Setup/capture failures and cancellation never become a
clean-review result. P2 retains the settled quick result in its originating session.
Manual cancellation stops owned work without a review timeout; a pending host
confirmation UI may remain visible, but a late answer cannot resume cancelled
capture.

### Grounded findings and deduplication (Q4)

No extra flag is required. After the three quick specialists finish, code rejects
malformed output rather than extracting fragments or removing markdown fences.
Candidates must echo a digest of the code-owned review binding and use exactly the
defined schema. Only P0-P2 candidates with numeric confidence **0.8 through 1**
are eligible. This is a conservative admission threshold, not calibrated certainty.

Code checks every cited path, side, line range and verbatim quotation against Q2's
captured context windows and blob/revision provenance. The primary location must
span at most ten lines in a diff hunk and include an actually added or removed
line, not merely nearby unchanged code. Before/after evidence must describe the
same hunk, citing changed code where present; a null side is allowed only when
the hunk has no removals/additions on that side, including pure insertions and
deletions with unchanged context. Renamed paths retain their
separate base/head identities. Unsupported citations and missing evidence remain
visible coverage issues, not silent filtering into a clean result.

When eligible candidates exist, one **separate, isolated validation session**
uses the effective heavy model/effort in the same owned runtime. Its assignment
is displayed before its prompt. This uses additional subscription credits; it
does not change the three-specialist quick topology or start a fourth specialist.
The validator attempts to disprove each claim against the original diff and
source, checking guards, reachability, contract changes, pre-existing behavior,
severity/confidence, and causal impact. Acceptance requires a reason and
source citations that code checks again. A failed, malformed, incomplete, or
wrong-usage validator cannot authorize findings.

Acceptance also requires an explicit `allClaimsSupported: true` assessment.
A partly correct candidate must be rejected if any assertion is false or
overstated: a correction in the validator's rationale does not repair the
original finding text. This is an enforced decision boundary, not a guarantee
that the model's assessment is infallible.

**Exact source checks are deterministic; causal and severity adjudication is
model-based and fallible.** A matching quotation alone is not proof of a defect,
and a second model's agreement is not an executable reproduction. No PR code is
run and this is not formal verification. Claims that need absent caller/context
evidence must be rejected or marked uncertain, not accepted on assertions alone.

Duplicate reports merge only after an explicit same-root-cause/trigger/impact
decision and shared bound changed-source evidence of the cause, including
supporting citations when primary anchors differ across files. Sharing a file or location
does not itself merge anything. The strongest accepted severity/confidence report
is displayed, with original reports and reviewer attribution retained. Different
causal change evidence is conservatively left unresolved rather than silently merged.

The final view presents title, severity, location/revision, confidence, trigger,
expected/actual behavior, introduction, and validation reasoning. Rejections and
unresolved limitations remain visible. Malformed candidates do not discard valid
siblings, and a failed specialist does not discard validated findings from its
successful peers. Non-textual changes are explicitly uncovered. Empty findings,
completed execution, and skipped targets never claim a clean PR.

Validation uses the existing tool-denial, progress, cancellation, no-timeout,
usage-accounting, and cleanup machinery. Cancellation during validation stops the
owned work. P2 retains the validated findings and their source provenance, not raw
reviewer/adjudicator output. No GitHub publication or safeguards are added.

### Finding selection (P1)

After displaying validated, deduplicated findings, the plugin stops its owned
inference runtime before asking for selection. Without `--all`, a host
elicitation form lists each finding's severity, title, location/side, and
confidence. Select a subset, accept with no choices (or decline) to select none,
or cancel the run. Nothing is preselected. The reviewed head and coverage status
remain visible; incomplete runs can still have useful selectable findings.
An empty result skips the form and is never a clean-review claim.

`--all` selects every final validated finding without a form. It never selects
raw/rejected candidates or duplicate aliases and **does not authorize posting**.
`--no-comment` remains required. An unsupported host reports selection
`unavailable` explicitly and selects nothing; rerunning with `--all` is an
explicit new review, not a hidden select-all fallback or cached-result action.

Answers are bound to a unique invocation, the originating session, repository,
PR and reviewed head, plus the full Q4 review-binding digest. Unknown, duplicate,
malformed or stale choice values fail closed instead of choosing other findings.
Selection does not reread GitHub, execute PR code, or rerun reviewers.

`/pr-review cancel` remains available while the form is pending, and another
review cannot start in that session until selection ends. There is no selection
timeout. A host dialog may outlive a cancelled local waiter, but late answers
cannot revive it. `P1 evidence:` records the final selection disposition and
IDs with their binding; `Q3 evidence:` remains the post-inference/cleanup review
record. `reviewComplete` preserves that earlier coverage state, while cancellation
marks the final run incomplete and clears selected IDs. Selection failure and
coverage are separate: `complete` describes review coverage, not selection or
posting success. P2 retention follows selection, as described below.

The installed CLI's native elicitation transport is exercised with a scripted
SDK host in `scripts/runtime-selection.mjs`, not a mock extension API. This is
not a claim about visual layout, other hosts or platforms. Reproduce with:

```sh
node scripts/smoke-selection.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick --selection
```

This spends subscription credits using child-only controlled `gh` input for
synthetic target 13 (independent arithmetic and shipping regressions), not real
GitHub mutations. Use `--selection-no-ui` instead of `--selection` to demonstrate
an unsupported host. `--selection-cases=none,cancel-ui,cancel-pending,invalid`
limits the UI probe to named cases without repeating successful inference.
Model output is fallible: no validated findings stops a positive UI probe, not
the plugin's fail-closed behavior. See the roadmap for recorded evidence.

### Retained result inspection (P2)

```text
/pr-review inspect
```

Quick runs now retain **one latest result per originating local session**. This
command displays the retained findings, canonical selection IDs/disposition,
reviewer coverage and errors, and repository/PR/reviewed-head identity. It performs
no inference, GitHub requests, current-head refresh, local source reads, or
publication. It always refers to the originating repository shown in the result,
even if the session's current directory has since changed. It accepts no target
or session-ID argument; it is not a cross-session archive or publish command.
Inspection is refused while review work is active.

The plugin uses the installed SDK's local session workspace metadata and writes
`pr-review-result.json` directly in that session-state directory, never in the
checkout. Raw candidate/adjudicator output and duplicate candidate bodies are
excluded. Validated findings retain their quotations, revision/blob provenance,
attribution, deduplication IDs, and full review binding; rejection/duplicate reasons
and coverage/error state remain visible. Full captured diff/context text is not
stored. A versioned schema and digest detect incompatible/malformed records,
cross-session or inconsistent bindings, and stale/noncanonical selected IDs.
The digest is a corruption check, **not authentication against someone who can
rewrite the session files**; local session storage is not an OS sandbox.

An accepted new quick run supersedes the previous result with a non-actionable
pending marker before capture. Once inference cleanup and selection settle, a
synchronous, flushed-file/atomic-rename write records the final state without an
intervening await. Cancellation clears selected IDs and marks the result
incomplete. A process interrupted before settlement leaves an unfinished marker,
not the previous review's selection. Empty, skipped, failed, unavailable-UI, and
degraded outcomes remain distinct; none claims a clean PR. Capture-only and
fixture commands do not replace the quick-result slot.

`P2 evidence:` acknowledges a successful retained write after the run settles;
`P2 inspection:` describes the loaded record. `P1 evidence:` alone is not a
retention acknowledgement. Storage failures are explicit and never fall back to
transcripts or another session's result. Remote/missing workspaces and sessions
reported as already in use are refused. A failed replacement can leave an earlier
record or a pending marker; inspect the reported state rather than treating the
failed run as saved.

Extension reload preserves the result. **Cold resume was demonstrated for the
same session after a real parent conversation turn**, using a fresh CLI runtime.
Command-only SDK sessions in CLI 1.0.83 lack resumable event history: save/close
still leads to `Session not found`, although the retained file survives. The plugin
does not manufacture history or spend credits to make those sessions resumable.
Forked/new sessions cannot inspect the original result, even if its record was
copied into their workspace. Same-session interactive `/resume` uses the host's
session lifecycle; human UI, remote hosts, and other platforms are not demonstrated.

Reproduce controlled storage and native lifecycle probes:

```sh
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
```

The default runtime probe seeds controlled validated fixtures, then exercises real
inspection/reload and records the command-only resume limitation without inference.
For real review retention and cold resume, add explicit settings and
`--quick --parent-turn`:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-retention-runtime.mjs --quick --parent-turn
```

This spends credits for one parent-session initialization turn and the quick
review; inspection/reload/resume never rerun reviewers. It uses controlled target
12, not GitHub mutations. The existing selection runtime probe now also inspects
retained results; use `--selection-cases=subset,none,cancel-pending` to cover
subset selection, no selection, and cancellation with an inert late UI answer.
No publication or publish-later execution exists yet.

### Two-reviewer fixture experiment (F2)

After checking `/pr-review models`, supply **all four settings**:

```text
/pr-review fixture model1=claude-sonnet-5 effort1=low model2=gpt-5.6-terra effort2=high
```

These are example assignments demonstrated on the development account, not
defaults. Choose two available models and two distinct supported reasoning
levels. Missing, repeated, unknown, disabled, or unsupported settings are
rejected without substitution. No personal configuration is saved yet.

This command uses Copilot credits. It reads only the bundled original
`extensions/pr-review/fixtures/checkout.js`, not your checkout's PR code.
The plugin creates an owned SDK stdio runtime with two independent reviewer
sessions. Command dispatch returns immediately so you can issue
`/pr-review cancel`; progress and results arrive in the timeline. The plugin
displays effective assignments before sending prompts, then each reviewer's
starting/active/completed state and output. Runtime model/reasoning usage
must match the assignments or execution is reported as incomplete. A final
`F2 evidence:` JSON line records outputs, session IDs, usage, and turn timestamps
for reproduction, after runtime cleanup. Dispatch success means the command
was accepted, not that the review completed. Read the final evidence's
`complete`, `cancelled`, and `cleanupErrors` fields. It is **not** the
publish-later cache or a validated finding format.

Both reviewers are awaited without a review timeout. Normal completion stops the
runtime in `finally`. Manual cancellation force-stops it immediately, even when
it cannot acknowledge an abort RPC; incomplete coverage remains visible.
Failed reviewers retain partial output and do not discard the other reviewer's
successful output.

### Read-only and lifecycle experiments (F3)

Use the same four explicit settings with these commands:

```text
/pr-review adversarial model1=claude-sonnet-5 effort1=low model2=gpt-5.6-terra effort2=high
/pr-review failure model1=claude-sonnet-5 effort1=low model2=gpt-5.6-terra effort2=high
/pr-review cancel
```

`adversarial` asserts an empty initialized tool set, then directly attempts six
forbidden tool invocations through the runtime pipeline before sending an
original prompt-injection fixture. The observed `denied` results come from a
code-owned pre-tool hook, not a model promising to avoid tools. Probe arguments
are inert (including an empty patch); argument-validation errors are not
accepted as denial evidence.

`failure` injects an error after the first reviewer's turn starts, aborts that
reviewer, and retains the other's result with `complete: false`. These two
commands emit `F3 evidence:` JSON. Their model outputs remain unvalidated.

A single in-flight connection probe runs at most once per second while work is
active. Only an actual RPC failure interrupts the run; no elapsed duration
causes failure, cancellation, substitution, or retry. A hung but connected
reviewer may wait indefinitely until manual cancellation.

Do **not** use `copilot -p '/pr-review status'` as a substitute. On the observed
CLI, prompt mode treated this as a model prompt rather than dispatching the
extension command. The surrounding assistant may then attempt unrelated work.

During development, load the checkout without installing:

```sh
copilot --experimental --plugin-dir .
```

Restart the CLI after editing the extension. For an installed copy, reinstall
with `copilot plugin install "$(pwd)"` before restarting; installed plugins are cached.
Remove the installed plugin with `copilot plugin uninstall copilot-pr-review`.

## Runtime boundary

This prototype uses the SDK bundled with the CLI; no npm install or provider
credentials are needed. Experimental extension APIs may change. The runtime
candidate is Copilot CLI only; this is not a VS Code compatibility claim.
Local installation and interactive command dispatch have been demonstrated on
Copilot CLI 1.0.83, macOS arm64. That version warns that direct local installs
are deprecated for a future release; no marketplace packaging is implemented yet.

Two concurrent reviewers and explicit model/reasoning selection have been
demonstrated through SDK command dispatch. Agent factories were unavailable in
the observed session, so the candidate uses plugin-owned SDK sessions instead.
The SDK resolves its bundled runtime; no machine-specific SDK path is shipped.

Reviewer sessions disable configuration discovery, assert that the initialized
tool set is empty, deny pre-tool hooks, and deny permission requests. Actual
hook denials, explicit failure handling, cancellation (including a suspended
runtime), extension reload, and abrupt runtime/extension/parent loss have been
demonstrated on the recorded CLI/macOS environment. Permission denial is
defense in depth; the native denial probes hit the hook before that callback.
This is model capability isolation, **not an OS filesystem sandbox**.

The plugin-owned stdio integration is selected for the next increments.
Signal/parent-EOF handlers force-stop owned work without waiting for parent
logging. An abruptly lost parent cannot receive a final report; there is no
clean-review claim or publication. Normal SDK transcripts may persist, and
forced termination does not guarantee a final transcript flush. The prototype
can capture PRs, bind source context, run quick specialists, and validate/deduplicate
findings, but cannot publish to GitHub or execute project safeguards. It does not restrict or change the model of the surrounding Copilot session. The SDK may
retain its own session transcripts; no plugin review archive is implemented.

No upstream source has been copied. Source reuse/licensing assessment remains
pending before any upstream code is reused.

## Reproduce the runtime smoke exercise

After installing the current checkout, run the no-inference probes using
Node.js 22+ and the SDK bundled with the installed CLI (adjust its path):

```sh
node scripts/smoke-fixture.mjs
node scripts/smoke-target.mjs
node scripts/smoke-context.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-findings.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs
```

The pure probes exercise fixture guards/lifecycle, PR capture/gates, and
revision-bound context assembly, and quick orchestration without a runtime. The findings probe exercises strict
schema/provenance gates, changed-line anchors, renamed/added/deleted files,
pure insertion/deletion context, cross-file deduplication, and degraded coverage. Its semantic
accept/reject decisions are explicit test doubles, not live-model evidence.
The context probe covers
diff parsing, blob and hunk verification, window binding, an advancing PR, and
a decoy working-tree file at the reviewed path. The runtime probe discovers the **installed** extension, dispatches status/help,
model listing, and invalid settings, and asserts explicit errors without model
turns. It requires authenticated model-list access. It uses configuration
discovery to find plugins, so run it only with trusted installed configuration.
It stops its runtime in `finally`, including on failure.

To exercise Q1 through the installed plugin, use the same CLI/SDK settings with
`node scripts/smoke-runtime.mjs --targets`. This runs controlled `gh` responses
in a child-only PATH, native confirmation acceptance/decline, lifecycle/skip
gates, explicit failures, and a session-directory change after extension startup.
Its session directory is a Git checkout on another branch whose committed and
uncommitted `example.js` differs from the reviewed revision; the harness asserts
that the bound context carries the served blob identities instead. It also
captures a fixture PR that then advances, and asserts the next capture stops
explicitly rather than reviewing the moved head against the captured diff.
The harness asserts read-only requests, no model turns, and no source changes.
The `scripts/fixtures/gh` executable is a test double, not a shipped runtime
dependency; do not add its directory to your normal PATH.

Use `node scripts/smoke-runtime.mjs --target-live` separately for real `gh`
requests through the installed plugin. It creates an empty temporary Git
repository pointing to `github/copilot-sdk`, captures public merged PR #2543
with a pinned expected head/diff fingerprint and pinned head/base blob
identities, window ranges, and context SHA-256, checks the bot skip on #2545,
and verifies the unrelated local checkout stays unchanged. It also exercises
the closed gate without an elicitation UI. No PR is created and no source is
checked out; the temporary repository is removed afterwards. This fixture is
used because this project's repository had no PRs at the Q1 checkpoint.
Both Q1 runtime exercises are no-inference and require the trusted installed
configuration/model-list access described above. The live exercise additionally
requires `gh` authentication and those public PRs to remain accessible.

To exercise actual concurrent inference as well:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick
```

This Q3 probe runs explicit quick settings, the bare alias inheriting a configured
parent model/effort, and cancellation after all three reviewers become active.
It asserts actual three-way execution overlap, subscription usage, assignments
before dispatch, target binding, duplicate-run rejection, incomplete cancellation,
owned-process exit, and an unchanged checkout. Replace `--targets` with
`--target-live` to use the pinned public PR through real GitHub GETs. Do not
combine the stub and live variants. Adding `--quick` is inference-spending;
the capture-only variants without it still start no reviewers.

The controlled quick target is now synthetic PR 12, an original four-line
`total.js` multiplication-to-addition regression with an unchanged contract.
It requires an accepted finding at the changed expression and additionally
cancels an active validation session, checking owned-process exit. This is real
installed-plugin inference over controlled GitHub responses, not a real GitHub
PR. The live variant still uses public `github/copilot-sdk#2543`; it checks
pipeline results without requiring a defect to exist. Real malformed/unsupported
outputs must remain rejected rather than being repaired to make the probe pass.

For a real positive regression target, replace `--targets` with
`--regression-live`. This captures historical public `ptitSeb/box64#3902` at
pinned head/base/diff/context identities, requires a finding on its changed
normalization/CPUID code, and exercises active validation cancellation.
Its later fix, `ptitSeb/box64#3963`, independently corroborates the regression but
is not supplied to the plugin reviewers. Only captured PR source is used as
review input; no third-party code is copied into the bundled fixtures. Run this
variant separately from the other target variants. `gpt-5.6-terra` with `high`
effort is the Q4 demonstration assignment, not a product default or fallback.

The original F2 inference probe remains available separately:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_MODEL_1=claude-sonnet-5 PR_REVIEW_EFFORT_1=low \
PR_REVIEW_MODEL_2=gpt-5.6-terra PR_REVIEW_EFFORT_2=high \
node scripts/smoke-runtime.mjs --fixture
```

The opt-in probe requires two different reviewer session IDs, positive execution
overlap, matching actual subscription-model/reasoning usage, visible progress
and results, and unchanged parent model/reasoning. It does not assert the
model-generated findings are correct; validation/deduplication belong to Q4.

Replace `--fixture` with `--f3` to run the complete F2/F3 exercise. It additionally
checks native tool denials, failure retention, startup/active cancellation,
cancellation after `SIGSTOP`, owned-runtime disconnection, extension reload,
abrupt extension loss, and parent loss. The macOS/POSIX harness identifies only
its own descendant PIDs before sending signals and checks those PIDs actually
exit rather than being orphaned. Its five-second process-exit assertion starts
only after intervention; it never bounds a review.

The final parent-loss probe deliberately breaks the smoke SDK's transport, so
its printed connection-closed cleanup errors are expected. Unexpected smoke
runtime cleanup errors fail the harness; owned-runtime-loss errors are asserted
in the incomplete-review evidence.
`HARNESS CLEANUP` output means the harness had to kill leftover work and is
**not** successful plugin-cleanup evidence. The exercise spends subscription
credits and uses trusted installed configuration; it does not signal unrelated
Copilot sessions.
