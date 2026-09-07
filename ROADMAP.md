# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit and fresh-session handoff workflow is recorded
in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives in
[HANDOFF.md](HANDOFF.md).

## Increments

| ID | Status | Independently demonstrable outcome | Requirements / dependencies |
| --- | --- | --- | --- |
| S0 | Completed | Confirmed product specification recorded in `SCOPE.md`, commit `6407a59`. | [Goal](SCOPE.md#goal) |
| L1 | Pending | Resolve applicable upstream licensing and attribution; record what can be reused. No upstream source reuse until resolved. Original prototypes need not wait. | [Upstream baseline](SCOPE.md#upstream-baseline) |
| F1 | Completed | Locally installable plugin with a code-owned, usable status/help entry point; runtime evidence and reproduction below. | [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F2 | Completed | Two concurrent reviewers over a tiny original local fixture; distinct explicitly configured subscription models and reasoning levels; display assignments, per-reviewer progress, and results. | F1; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F3 | Completed | Native forbidden-tool denials plus an adversarial fixture; retained incomplete coverage; startup/active/unresponsive cancellation and owned-runtime/extension/parent loss exercised with process-exit evidence. Stdio integration selected; limits below. | F2; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| Q1 | Completed | Read-only code-owned PR capture with repository/head-bound snapshot, skip/override/confirmation gates, consistency guards, and installed-plugin controlled/live evidence below. | F3; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q2 | Completed | Source context bound to the captured head/base revisions with blob-verified provenance; local-checkout, moved-head, and inconsistent source refused. Evidence below. | Q1; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q3 | Completed | Three concurrent quick specialists consume bound PR input; explicit/ambient assignments, alias, incomplete coverage, and cancellation demonstrated below. Candidates remain unvalidated. | Q2; [Modes](SCOPE.md#review-modes-and-findings) |
| Q4 | In progress | Strict candidate/evidence boundary, isolated adjudication, deduplication, degraded findings and positive installed-plugin controlled inference implemented; real positive PR demonstration pending. | Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| P1 | Pending | Select validated findings with a minimal UI and `--all`; no writes yet. | Q4; [Selection/publication](SCOPE.md#selection-publication-and-cached-results) |
| P2 | Pending | Retain results with session/repository/PR/head binding and reload/resume where supported; inspect without rerunning reviewers. | P1; [Cached results](SCOPE.md#selection-publication-and-cached-results) |
| P3 | Pending | Resolve posting authority and conflicting flags; display a code-built inline review payload without submitting it. | P1; [Publication controls](SCOPE.md#selection-publication-and-cached-results) |
| P4 | Pending | Submit only COMMENT reviews with valid anchors and lifecycle/head gates; surface uncertain write outcomes without blind retry. | P3; [Publication gates](SCOPE.md#selection-publication-and-cached-results) |
| P5 | Pending | Publish retained selected findings without rerunning reviewers; reject changed heads and prevent publication after cancellation. | P2, P4; [Cached publication](SCOPE.md#selection-publication-and-cached-results) |
| C1 | Pending | Inspect/update personal tier configuration via text commands; validate capabilities, inheritance, and flag precedence; show effective assignments. | F3; [Configuration](SCOPE.md#models-configuration-and-execution) |
| C2 | Pending | Explicit trust gates project overrides; prove a repository cannot authorize itself. | C1; [Configuration trust](SCOPE.md#models-configuration-and-execution) |
| M1 | Pending | Balanced becomes default with required topology and P3 cap; full adds conventions reviewer and its findings policy. | Q4, C1; [Modes](SCOPE.md#review-modes-and-findings) |
| M2 | Pending | Deep uses one holistic reviewer; reject conflicting mode flags. | M1; [Modes](SCOPE.md#review-modes-and-findings) |
| C3 | Pending | Explicit optional fallback with at most one eligible retry per failed reviewer; no timers or silent substitutions. | C1, Q3; [Fallbacks/execution](SCOPE.md#models-configuration-and-execution) |
| V1 | Pending | `--verify` enforces matching branch/SHA/cleanliness before reviewers and presents discovered existing commands for approval. | Q1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| V2 | Pending | Execute only approved existing safeguards with installed dependencies; show evidence and artifacts without autofix or checkout manipulation. | V1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| D1 | Pending | Document configuration, modes, incomplete coverage, cancellation, publication, cache, and safeguards with reproducible end-to-end examples. | Remaining v1 items; [Release boundary](SCOPE.md#priority-and-release-boundary) |

## Completed increment: F1

Implementation: `plugin.json`, `extensions/pr-review/extension.mjs`, and
installation/invocation instructions in `README.md`. A reproducible, no-model
runtime probe is in `scripts/smoke-runtime.mjs`.

The extension candidate uses `joinSession({ commands })` and `session.log()`.
No factory, reviewer, model configuration, PR fetching, GitHub write, or project
safeguard execution is included in F1. No upstream source was reused.

### Demonstrated outcome

On 2026-09-06, using Copilot CLI 1.0.83, its bundled SDK, Node.js 26.1.0, and
macOS arm64:

- Absolute-path local installation succeeded. `copilot plugin list` reported
  `copilot-pr-review (v0.0.1)`, enabled. The installed copy remains available.
- The CLI runtime discovered and launched
  `plugin:copilot-pr-review:pr-review` from its installed plugin cache with
  status `running`, not a project extension or mock SDK.
- `scripts/smoke-runtime.mjs` dispatched the empty/default argument, `status`,
  whitespace-padded `status`, `help`, and `--help`, asserting actual timeline
  output. PR/review flags and extra arguments returned explicit command errors.
- The same probe asserted that the session contained no model turns, subagents,
  or tool executions. The extension performs no target reads or writes and
  declares no model/tool workflow. Runtime cleanup returned no errors.
- A real interactive CLI in a sized pseudo-terminal displayed the expected
  status, help, and unsupported-argument error after typing the slash commands.
  `/exit` then exited successfully. This does not establish cancellation of
  active reviewers, which remains F3.

These observations demonstrate plugin loading, SDK access, slash-command
registration/dispatch, and visible output only. They do not choose the eventual
reviewer execution integration.

### Reproduction

From the repository root:

```sh
copilot --version
copilot plugin install "$(pwd)"
copilot plugin list
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs
copilot --experimental
```

Adjust the SDK path to the installed version; do not install a different SDK as
a silent substitute. In the interactive session, wait for extension loading,
then enter `/pr-review`, `/pr-review help`, and `/pr-review --comment`.
Expect status, usage, and an explicit unsupported-arguments error respectively,
not a review. Reinstall before reproducing after code changes.

### Concrete integration caveats

- `copilot plugin install .` failed with "Invalid plugin spec" on this runtime;
  the absolute-path command above succeeded. The runtime also warns that direct
  installs are deprecated in favor of marketplace installs in a future version.
- The native manifest's `extensions` path is the **parent search directory**:
  the demonstrated layout uses `extensions/`, containing
  `pr-review/extension.mjs`.
- An SDK session with `enableConfigDiscovery: false` did not discover the
  installed plugin, even with `requestExtensions: true`. The successful probe
  explicitly enables configuration discovery and extension support, and awaits
  extension reload before dispatch. It makes no `send`/`sendAndWait` calls.
- Reloading extensions in the already-running development session did not pick
  up the newly installed plugin. Use a fresh CLI session for these instructions.
- `copilot -p '/pr-review status'` did **not** exercise the command: it started
  an ambient model turn and produced an unrelated review-status response.
  This failed probe is not capability evidence. Do not use prompt mode as a
  deterministic slash-command dispatcher; use the interactive entry point or
  the SDK smoke script above.

### API sources consulted

Consulted on 2026-09-06:

- [Official plugin creation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating):
  local installation, cached copies, and reinstall behavior.
- [Official plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference):
  native `extensions` manifest field (not Open Plugin Spec `$schema` semantics).
- Installed Copilot CLI `1.0.83`, macOS arm64: `copilot --help`,
  `copilot plugin install --help`, and `copilot help environment`.
- Bundled `copilot-sdk/docs/extensions.md`, `docs/agent-author.md`,
  `extension.d.ts`, and `types.d.ts`: injected SDK, extension lifecycle,
  `JoinSessionConfig`, `CommandDefinition`, `CommandContext`, and `session.log`.
- Bundled `copilot-sdk/docs/factories.md`: candidate for F2 only; documented
  agent factories are not evidence of working reviewers.

The installed SDK is under
`~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk/` on the development host.
No SDK copy or machine-specific import is shipped in the plugin.

### Uncertainties at the F1 checkpoint

Distinct per-reviewer subscription models/reasoning, simultaneous execution,
per-reviewer progress/results, read-only enforcement, reviewer failure
propagation, and cancellation remain unproven and are reserved for F2/F3.
The surrounding interactive Copilot session is not made read-only by this
extension. No cross-client or other-OS compatibility is claimed.
Future CLI/API compatibility, marketplace migration, and source licensing remain
open. L1 blocks upstream source copying, not this original code. No runtime
blocker was known before starting F2; its outcome is recorded below.

## Completed increment: F2

Implementation: the extension's `models` and `fixture` commands,
`extensions/pr-review/fixture.mjs`, and a tiny original
`extensions/pr-review/fixtures/checkout.js`. `scripts/smoke-fixture.mjs`
exercises pure guards, and `scripts/smoke-runtime.mjs --fixture` exercises the
installed plugin with real inference. No upstream source was reused.

### Runtime candidate and demonstrated outcome

On 2026-09-06, on the same CLI 1.0.83 / bundled SDK / Node.js 26.1.0 /
macOS arm64 environment as F1:

- Agent factory registration did not establish usability. Calling
  `session.factory.run` from the installed extension failed with
  **"Agent factories are not available for this session"**, before model
  execution. Runtime inspection located an availability check in the session
  quota projection. No entitlement/feature gate was overridden.
- Instead, the plugin successfully constructed `CopilotClient` using the
  injected SDK and its default bundled runtime resolution. It created two
  separate sessions with explicit model and reasoning settings, local CLI
  authentication, configuration discovery disabled, an empty tool allowlist,
  and permission denial. No provider credentials were requested or supplied.
- The parent and owned sessions' available-model catalogs were validated before
  prompts. Each owned session's `model.getCurrent()` matched its assignment.
  Actual `assistant.usage` events then confirmed these settings:

| Reviewer | Actual model | Actual reasoning | BYOK | Turn start (epoch ms) | Session idle (epoch ms) |
| --- | --- | --- | --- | --- | --- |
| rounding | `claude-sonnet-5` | `low` | false | 1788730143771 | 1788730147939 |
| shipping | `gpt-5.6-terra` | `high` | false | 1788730143771 | 1788730145935 |

The two independent reviewer session IDs were
`58141075-2af4-4c0e-a342-935bb72d4c78` and
`f1bddcde-b37b-45df-9888-6cc0603632e9`. The observed execution intervals
overlapped by **2164 ms**. These are runtime turn/idle timestamps, not estimates
from the coordinator's promise scheduling and not a provider-side timing claim.

- The CLI timeline displayed both assignments before execution, per-reviewer
  starting/completed messages, and both outputs. Shipping identified the
  incorrect free-shipping basis with `[5000], 10` yielding 5000 instead of
  4500 cents. Rounding reported fractional cents, and also duplicated the
  shipping issue. Outputs remain explicitly **unvalidated**; this demonstrates
  review execution, not Q4 evidence validation or deduplication.
- No reviewer tool execution was observed. The runner treats a tool start as
  an error, not permission-enforcement evidence. Normal `client.stop()` cleanup
  returned no errors for the plugin-owned and smoke runtimes.
- Pure guards cover malformed/missing/duplicate keys, non-distinct assignments,
  unavailable/disabled/unconfigured/BYOK/auto models, and unsupported reasoning.
  Runtime command probes reject malformed settings, an unavailable model, and
  an unsupported effort without starting reviewers. The parent model/reasoning
  remains unchanged.
- A final run after expanding the progress-order and parent-setting assertions
  also completed successfully, with **1912 ms** overlap and the same actual
  model/reasoning assignments. Its reviewer sessions were
  `0cdf64d2-3136-4d09-ba90-536cd697db69` and
  `26fc5a2d-e047-4dec-b702-590946d7133c`.

### Reproduction

```sh
copilot plugin install "$(pwd)"
node scripts/smoke-fixture.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs

COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_MODEL_1=claude-sonnet-5 PR_REVIEW_EFFORT_1=low \
PR_REVIEW_MODEL_2=gpt-5.6-terra PR_REVIEW_EFFORT_2=high \
node scripts/smoke-runtime.mjs --fixture
```

The final command uses subscription credits. The model names are reproduction
inputs, not hardcoded defaults; use `/pr-review models` in a fresh CLI to inspect
current availability. The equivalent invocation is:

```text
/pr-review fixture model1=claude-sonnet-5 effort1=low model2=gpt-5.6-terra effort2=high
```

### API sources and concrete caveats

Consulted current official [plugin creation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating),
[plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference),
and [SDK getting started](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md)
documentation, plus the installed SDK's extension/factory guides,
`extension.d.ts`, `factory.d.ts`, `types.d.ts`, `session.d.ts`, and generated
RPC/event definitions before choosing APIs.

- Factories remain unavailable on the observed account/session. Their RPC types
  also describe `reasoningEffort` and `agent` as accepted but not honored;
  factory reasoning/permission behavior was **not** reached or demonstrated.
  The unsuccessful factory implementation was replaced, not shipped as a
  fallback or silently selected alternative.
- Session-scoped `model.list()` exposes raw CAPI
  `capabilities.supports.reasoning_effort` arrays, not the normalized
  `supportedReasoningEfforts` field from `client.listModels()`. The code uses
  the demonstrated session shape, excludes provider-qualified IDs, and refuses
  unsupported values rather than guessing.
- `sendAndWait` defaults to a 60-second wait timeout, so reviewers instead
  subscribe to events before `send` and wait for idle/error without a timer.
  There is no plugin review deadline, fallback, or elapsed-time retry.
- The plugin owns a separate runtime, not factory subagents in the parent.
  Parent log output bridges progress/results. SDK session transcripts may
  persist normally; this is not the P2 session-bound review cache or a plugin
  cross-session archive.
- Explicit error paths preserve incomplete coverage and normal cleanup exists,
  but failure injection, transport loss, manual cancellation, and extension
  shutdown have **not** been demonstrated. There is no cancel command yet.
  In particular, an extension stopping is not proof its owned runtime and
  reviewers stop; F3 must establish this before selecting the integration.
- Empty tools/configuration isolation plus a benign no-tool result do not prove
  adversarial read-only enforcement. The parent assistant remains unrestricted.
  No PR fetching, publication, safeguard execution, or other-client support
  was added. L1 still blocks upstream source reuse only.

## Completed increment: F3

Continues F2 checkpoint `430afd2`. Original implementation:
`extensions/pr-review/read-only.mjs`, `fixture-run.mjs`,
`fixtures/adversarial.txt`, and updates to the entry point/reviewer runner.
The existing smoke scripts now cover lifecycle behavior with
`scripts/runtime-fixture.mjs` as the runtime scenario helper.
No upstream source was reused.

### Demonstrated outcome and integration selection

On 2026-09-06, using CLI 1.0.83, its bundled SDK, Node.js 26.1.0, and
macOS arm64, the recorded installed-plugin `--f3` run passed all nine F3 scenarios
and the preceding F1/F2 regression exercise. The F2 reviewers again used
`claude-sonnet-5` / `low` and `gpt-5.6-terra` / `high`, both `isByok=false`,
with 2338 ms observed turn/idle overlap. These remain reproduction inputs, not
defaults.

**Select the plugin-owned SDK stdio runtime for subsequent increments.**
The extension explicitly uses `RuntimeConnection.forStdio()` with bundled
runtime resolution; ambient transport overrides cannot silently select an
unproven in-process integration. Factories remain unavailable as recorded in F2.

| Scenario | Observed evidence |
| --- | --- |
| Adversarial | Both initialized reviewer tool catalogs were empty. Each native `tools.execute` call for `create_file`, `apply_patch`, `bash`, `task`, `skill`, and `tool_search` returned `resultType: denied` with `Denied by preToolUse hook: PR reviewers cannot execute tools.` Both reviewers then processed the original hostile fixture without model tool execution. |
| Injected reviewer failure | Rounding failed after its turn began and acknowledged abort; shipping completed with its unvalidated finding retained. Final `complete` was false, with visible incomplete coverage. |
| Startup cancellation | Immediate `/pr-review cancel` after accepted dispatch produced `cancelled: true`, incomplete coverage, and no active reviewer. |
| Active cancellation | Both turn-start events were observed before cancellation. Both reviewers became cancelled; owned runtime PID `94893` exited, with no cleanup errors. |
| Unresponsive cancellation | After both turn-start events, the harness suspended only owned runtime PID `95257` using `SIGSTOP`. `/pr-review cancel` still returned and that PID exited. No abort-RPC acknowledgement is required for manual cancellation. |
| Owned-runtime loss | Killing owned PID `95606` produced an actual failed connection probe. Both reviewers became incomplete; abort and graceful-cleanup RPC errors remained in the evidence, rather than a successful cleanup claim. |
| Extension reload | Reload while both reviewers were active stopped owned PID `96031`. The reloaded extension answered status, with no completed-review claim for interrupted work. |
| Abrupt extension loss | Killing extension PID `96359` while reviewers were active also ended its owned runtime PID `96396`; reloading restored the command. This was not a graceful signal-handler test. |
| Abrupt parent loss | Killing the smoke parent runtime while both reviewers were active ended extension PID `96723` and owned reviewer runtime PID `96745`. No terminal report can be delivered to a dead parent. |

The harness checks PID existence, not just absence from the current process
tree, to distinguish exit from orphaning. No `HARNESS CLEANUP` intervention was
needed in either of the final two complete runs. Signals were restricted to
processes identified in the smoke process's descendant tree, not other CLI
sessions. The SDK's own smoke-parent cleanup errors after the final deliberate
parent kill are printed and expected; unexpected smoke-runtime cleanup errors
fail the probe. Expected owned-runtime-loss errors are asserted in its report.

Representative adversarial reviewer sessions:
`bac0a05e-ca7c-42e3-8c65-ef12a7c4a03f` and
`722dacb7-3a94-41a9-bdeb-b55b524c55a7`.
The failed-reviewer session was `b9ee1ebd-5444-4aa7-a664-47fcdb51f514`;
the retained successful shipping session was
`7d5e65a5-fd0b-4954-881a-1a281044e31c`.
Its example was `[5000], 10`: expected 4500 cents, actual 5000.
These remain prototype transcripts/evidence, not the P2 review cache.
A subsequent final run with the startup-exit and idle-cancel assertions also
passed all scenarios, with 2661 ms F2 overlap and no harness cleanup intervention.

### Runtime findings that changed the implementation

- Keeping the command handler awaiting the full review left the smoke's command
  RPC unresolved after extension reload, even though the extension and its
  reviewer runtime had exited. The final implementation instead returns after
  validated command acceptance and performs supervised work asynchronously.
  Results and cleanup status are delivered through the timeline. Consumers must
  not interpret dispatch success as review completion.
- The SDK does not surface transport closure as a reviewer `session.error`,
  and exposes no public client disconnect subscription. Waiting only for
  idle/error can therefore hang after runtime loss. A single-in-flight
  `client.ping()` probe at one-second intervals now detects actual RPC failures.
  There is no response deadline, review timer, retry, or model fallback.
- Waiting for `session.abort()` is insufficient if the runtime is unresponsive.
  Manual cancellation and extension shutdown directly use `client.forceStop()`;
  ordinary reviewer failures still attempt a per-session abort so the other
  reviewer can finish. Failed aborts are retained in evidence. Normal completion
  uses `client.stop()`. Explicit cleanup errors remain errors even if force-stop
  is subsequently attempted.
- Native tool invocation returns a canonical `denied` result, not necessarily
  an exception. `apply_patch` also requires a string argument before reaching
  the hook; its probe uses an inert empty patch. Other probe arguments are empty
  objects. Schema/transport failures are not counted as permission enforcement.
  The actual pre-tool hook ran for all six probes in both sessions. The
  permission handler was not reached, so runtime enforcement of that separate
  defense-in-depth layer is not claimed from these probes.
- Cancellation and early errors now settle reviewer waiters, retain available
  output/usage, remove listeners, and surface incomplete coverage. Pure probes
  cover send/error/shutdown/tool-start/empty-result failures, cancellation before
  send, partial output, startup failure, and cleanup failure. Runtime reports
  are emitted after cleanup, and cleanup errors prevent `complete: true`.

### Reproduction and sources

```sh
copilot plugin install "$(pwd)"
node scripts/smoke-fixture.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_MODEL_1=claude-sonnet-5 PR_REVIEW_EFFORT_1=low \
PR_REVIEW_MODEL_2=gpt-5.6-terra PR_REVIEW_EFFORT_2=high \
node scripts/smoke-runtime.mjs --f3
```

Use current available explicit assignments, reinstall after code edits, and run
only with trusted discovered configuration. The last command spends subscription
credits. Without `--f3` or `--fixture`, the runtime smoke remains no-inference.
The process-exit assertion allows five seconds **after intervention**; this is
a harness assertion about cleanup, never a reviewer deadline.

Consulted the current official
[SDK getting-started documentation](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md)
and the installed SDK's `docs/extensions.md`, `docs/agent-author.md`,
`extension.d.ts`, `client.d.ts`, `session.d.ts`, `types.d.ts`, and generated
tool RPC definitions. Inspected bundled SDK implementation behavior for
`stop`, `forceStop`, connection closure, and extension joining; API declarations
alone were not treated as runtime evidence.

### Remaining limits

This selects an experimental CLI/macOS stdio integration, not general
cross-platform support or an OS sandbox. Reviewers have no tools at all;
surrounding-source context will be supplied by the coordinator in later work.
The surrounding assistant is unchanged. SDK transcript persistence remains
normal; forced termination may skip a final transcript flush. No claims are
made about stopping a provider's already-accepted remote computation/billing,
only the owned local runtime and sessions.

A hung but connected reviewer can wait indefinitely. The connection probe
does not treat silence as failure; manual cancellation ends even a suspended
runtime. Future SDK versions must re-demonstrate their cleanup behavior.
Abrupt parent loss cannot deliver final logs, and cross-reload retained review
state belongs to P2, not this fixture prototype. Startup cancellation is
demonstrated, not an exhaustive proof of every OS/process-startup interleaving.

No PR fetching, publication, saved configuration, or safeguard execution was
added. L1 still blocks upstream source reuse only.

## Completed increment: Q1

Continues F3 checkpoint `27816f2`. Original implementation:
`extensions/pr-review/target.mjs`, wired into the existing extension command.
Exercises use the existing Node.js/assert approach in `scripts/smoke-target.mjs`
and the extended `scripts/smoke-runtime.mjs`, with
`scripts/runtime-target.mjs`, `scripts/target-fixture.mjs`, and a child-only
`scripts/fixtures/gh` test double. No upstream source was reused.

### Implemented and demonstrated outcome

On 2026-09-07 (local time), CLI 1.0.83 / bundled SDK / Node.js 26.1.0 /
macOS arm64:

- `/pr-review NUMBER` resolves the session's current directory using the native
  `session.rpc.metadata.snapshot()` API, rather than the extension process cwd.
  `gh repo view` resolves repository ID, host, and name from that directory;
  API requests explicitly bind host, repository, PR number, and GET method.
  Ambient `GH_REPO` and Git directory/worktree overrides cannot redirect it.
  PR metadata must match the resolved repository/number/URL and include valid
  lifecycle, author, base/head SHAs, and change counts.
- Capture returns an invocation-local snapshot containing metadata, the entire
  diff, byte count, timestamp, and SHA-256. The command displays only its bound
  summary, never PR prose or the full diff in the parent timeline. It does not
  retain a result/cache or claim that a review occurred.
- Metadata is read before and after the diff; observable changes in identity,
  base/head, lifecycle, prose, update timestamp, or counts reject the attempt.
  File counts, hunk completeness, and added/deleted line counts are checked.
  Missing/malformed/unavailable data and the 32 MiB subprocess buffer limit
  fail explicitly, rather than producing a partial successful snapshot.
- Drafts skip by default; `--include-drafts` bypasses only that gate.
  GitHub Bot accounts and `[bot]` logins skip. The deliberately conservative
  trivial gate skips only a provably empty change: zero files/additions/deletions.
  Titles, documentation suffixes, small diffs, and zero textual changes with
  changed files do not prove correctness. This follows the upstream prompt's
  direction to review rather than skip when metadata cannot prove triviality.
- Closed/merged PRs first use `session.ui.confirm()` when the host supports
  elicitation. The installed plugin demonstrated both decline and acceptance,
  and both closed/merged override aliases without a prompt. A host without UI
  returns `confirmation-required`, with the override as the explicit next action.
  No diff is held during a pending question. Accepted confirmation re-reads
  metadata, rejecting changes instead of transferring approval to another head.
  Draft/bot/trivial gates still apply after non-open authorization.
- The controlled installed-plugin smoke changed the session cwd after extension
  startup and deliberately supplied a wrong `GH_REPO`. All traced capture
  calls used the new cwd, had no repository override, and were either repository
  inspection or API GETs. It demonstrated eligible capture, draft skip/override,
  bot/empty skips, closed/merged decline/override, accepted confirmation, HTTP
  failure, head drift, and truncated diff errors. The parent events showed no
  model turns, subagents, or tool execution; the parent model stayed unchanged.
- The live installed-plugin smoke used a temporary, empty Git repository with
  a remote to public `github/copilot-sdk`, because this project's repository had
  no PRs. It captured merged PR **#2543**, head
  `7525814ae7de890acf63b0eb665531292adaf96d`, **3168 diff bytes**, SHA-256
  `7a343fbb2f05089c786d0e8bfeea6a3471a86e8b4d94c6744bb7d2f8af40c883`.
  It also demonstrated the real bot skip on merged PR **#2545** and the
  no-UI closed gate. Local Git branch/status and the unrelated source sentinel
  were unchanged. No PR was created, branches switched, source checked out,
  GitHub mutations sent, or reviewers started. Temporary fixtures were removed.
- Existing status/help/models, invalid fixture setting probes, and pure F2/F3
  permission/error/cancellation/cleanup exercises passed. Reviewer implementation
  was not changed; the inference-spending F2/F3 scenarios were not rerun for Q1.

An initial controlled-runtime assertion compared macOS `/var` and
`/private/var` spellings of the same temporary directory and failed. The harness
now canonicalizes its directory with `realpath`; the repeated runtime exercise
passed. This was a harness path comparison, not a capture-directory fallback.

### Reproduction and consulted APIs

```sh
copilot plugin install "$(pwd)"
node scripts/smoke-fixture.mjs
node scripts/smoke-target.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --target-live
```

The two runtime variants intentionally run separately: controlled child-only
`gh` versus real authenticated `gh`. Neither starts inference. Both include the
existing entry-point/model-list rejection exercise, so require authenticated
Copilot model access and trusted installed configuration. The live probe pins
known public PR evidence and fails if that evidence becomes unavailable/changes.
Its Git setup is only in a disposable harness directory, never capture behavior.

Consulted the installed SDK's `docs/extensions.md`, `types.d.ts`,
`generated/rpc.d.ts`, and `extension.js` confirmation implementation, along with
the current official
[SDK getting-started documentation](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md)
and [GitHub pull-request REST documentation](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request).
Inspected `gh repo view --help`, `gh api --help`, and `gh help environment`.
Read only the upstream prompt's target/skip behavior at the scope's pinned
revision; no upstream implementation source was copied.

### Remaining limitations

The metadata/diff/metadata capture is an observed-consistency check, not an
atomic GitHub transaction or a proof against every change-and-revert/cache race.
The SHA-256 identifies fetched bytes; it is not a Git object identity. Q2 must
bind surrounding source to immutable revisions, not the current local branch.
Binary-only changes are capturable when GitHub supplies consistent counts,
but their payload is not textual review evidence. Oversized/unavailable GitHub
diff responses stop explicitly; no silent subset is reviewed.

Only local sessions are supported. `gh` authentication must already work;
stored local authentication worked inside the installed extension. The SDK
filters sensitive environment variables, so token-only forwarding was not
demonstrated or enabled implicitly. Remote-session execution, GitHub Enterprise,
and other operating systems were not demonstrated. There is no review timeout,
automatic retry, reviewer/context assembly, publication, saved configuration,
retained cache, or safeguard execution in Q1. L1 remains pending.

## Completed increment: Q2

Continues Q1 checkpoint `4280b15`. Original implementation:
`extensions/pr-review/context.mjs`, wired into `executeTargetCapture` in
`extensions/pr-review/target.mjs`. Exercises use the existing Node.js/assert
approach: new `scripts/smoke-context.mjs`, extended `scripts/smoke-target.mjs`,
`scripts/target-fixture.mjs`, `scripts/fixtures/gh`, and
`scripts/runtime-target.mjs`. No upstream source was reused.

### Implemented and demonstrated outcome

On 2026-09-07 (local time), CLI 1.0.83 / bundled SDK / Node.js 26.1.0 /
macOS arm64:

- After a successful capture, the command assembles source context and reports
  a `Q2 context:` line. Every request is
  `gh api --hostname HOST --method GET repos/OWNER/NAME/contents/PATH?ref=SHA`,
  where `SHA` is always the captured head or base SHA from the Q1 snapshot.
  Nothing is read from the session's checkout, its branch, its `HEAD`, or its
  uncommitted edits, including files with the reviewed paths.
- Each response must be a base64 `file` at the requested path whose `size`
  equals the delivered bytes and whose `sha` equals the Git blob hash
  recomputed locally from those bytes. Where the captured diff's `index` line
  records blob identities, the fetched blob must match the recorded abbreviation.
  Every hunk's reviewed lines must then appear verbatim at the diff's line
  numbers in the fetched revision. Failures stop the command explicitly and
  name repository, revision, and path.
- The head side is fetched for every surviving changed file; the base side is
  added wherever the change removed lines, so deleted and rewritten code keeps
  its own repository/SHA/path provenance. Files without textual hunks (binary
  and mode-only changes) are reported with a reason and no source fetch.
  Windows are hunk ranges widened by 40 lines, clamped to the fetched
  revision's real line count and merged where they overlap.
- The timeline summary carries provenance only: head/base SHAs, per-file path,
  status, side, blob SHA, byte/line counts, window ranges, a context SHA-256,
  and an undisplayed-file count beyond 20 entries. Source text and PR prose
  stay out of the parent conversation. Inside the assembled context each line
  is numbered under its provenance header, so PR-controlled text cannot imitate
  a header. Context is invocation-local; nothing is cached and no reviewer
  consumes it yet.
- The controlled installed-plugin exercise ran with its session directory on a
  Git branch `not-the-pr-branch`, holding a committed **and** dirty `example.js`
  that differs from the reviewed revision. Every captured dispatch reported the
  served head/base blob identities, never the local file, and the local branch,
  `HEAD`, working tree, and unrelated sentinel were unchanged afterwards.
  All traced context requests were read-only GETs at the captured revisions.
- The same exercise captured fixture PR 11, whose head then advanced. The
  assembled context stayed on the captured revisions, and the next capture of
  the moved head stopped explicitly with the blob mismatch rather than
  reviewing new source against the captured diff.
- The live installed-plugin exercise bound context for public merged PR
  **github/copilot-sdk#2543** from an empty temporary checkout: head
  `7525814ae7de890acf63b0eb665531292adaf96d`, base
  `e90856093760d95793d8211219b883dfce08862c`, file
  `.github/workflows/java-publish-maven.yml`, head blob
  `d1ef78f66b7831e43d2833ce6e7cd73fb03d8395` (37420 bytes, 800 lines, window
  50-224), base blob `fd07aae155d07658f8a1654a601b5c80fff3b26a` (36577 bytes,
  781 lines, window 50-205), **14903** context bytes, context SHA-256
  `2be6f0cf8e28d8e6383439dd3c24900e8cc7730ad0cb47e1414a1e20b19876d4`.
  Both blob identities are the ones recorded in that PR's diff `index` line.
  The skipped bot PR #2545 assembled no context.
- Existing Q1 gates, status/help/models, invalid-setting rejections, and the
  pure F2/F3 permission/error/cancellation/cleanup exercises still pass. The
  parent session started no model turns, subagents, or tool executions. The
  inference-spending F2/F3 scenarios were not rerun for Q2.

Demonstrated versus assumed: the checks above ran against real GitHub responses
for one modified UTF-8 file with both sides, and against fixture responses for
the failure paths. Added, deleted, renamed, binary, mode-only, CRLF, and quoted
non-ASCII-path sections are covered only by the pure exercise's synthetic diff,
not by a live PR. Files above the contents API's inline limit, symlinks, and
submodules are handled as explicit stops that were exercised by mutating
fixture responses, not by real repository objects.

### Reproduction and consulted APIs

```sh
copilot plugin install "$(pwd)"
node scripts/smoke-fixture.mjs
node scripts/smoke-target.mjs
node scripts/smoke-context.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --target-live
```

The two runtime variants still run separately, and neither starts inference.
The live probe pins immutable public evidence and fails if that evidence
changes or becomes unavailable.

Consulted the current official
[repository contents REST documentation](https://docs.github.com/en/rest/repos/contents#get-repository-content)
and [Git blob documentation](https://docs.github.com/en/rest/git/blobs), plus
`gh api --help`. Verified the response shape, the base64 encoding, and the
returned `sha` against a real revision before implementing the check.
No upstream implementation source was read or copied.

### Remaining limitations

The contents response is trusted for the path-to-blob mapping; the delivered
bytes are then verified against the blob identity it returns, which is Git's
SHA-1 object id, used here as an identity match rather than a collision-
resistance claim. Blob-prefix verification applies only where the captured diff
carries an `index` line. Hunk verification proves the fetched revision contains
the reviewed lines; it does not prove the rest of the file is unchanged from
what a reviewer would see in a checkout.

Sources are fetched sequentially with no rate-limit handling, retry, or
concurrency. There is no prompt-size budget: a large PR assembles a large
context, bounded only by the fixed 40-line radius and the per-file failure
boundaries. Assembled source is untrusted PR-controlled text; line numbering
is a legibility measure, not a security boundary, and reviewer-side handling
of untrusted content stays with Q3. Context is not cached, not retained across
invocations, and not yet consumed by any reviewer. Q1's limits on remote
sessions, GitHub Enterprise, other operating systems, `gh` authentication, and
the 32 MiB subprocess buffer are unchanged. L1 remains pending.

## Completed increment: Q3

Implementation: `extensions/pr-review/quick.mjs`, command dispatch in
`extension.mjs`, shared `reviewAssignments` / `validateModelAssignment` in
`fixture.mjs`, and shared `executeOwnedRun` in `fixture-run.mjs`. The fixture
experiments use those same helpers. `target.mjs` accepts cancellation for `gh`
execution and pending closed-PR confirmation when invoked by quick review.
Exercises: `scripts/smoke-quick.mjs`, `scripts/runtime-quick.mjs`, and the
existing runtime/target/fixture harnesses. No upstream source was reused.

### Implemented boundary

- `NUMBER --quick --no-comment` and `NUMBER --major-only --no-comment` capture
  and bind the target, then dispatch exactly correctness, contracts, and
  combined security/performance/resources specialists concurrently. Exactly one
  quick-mode spelling is required. The bare number remains capture-only.
- Optional invocation-local `heavyModel=ID` and `heavyEffort=LEVEL` assign the
  same heavy tier to all three reviewers. Unset fields independently inherit
  the parent session's current model/effort. No saved configuration is loaded
  or written; C1/C2 remain pending. Missing/unavailable subscription models,
  incompatible inherited effort, and invalid explicit effort stop without
  substitution. When ambient effort is unset, the owned runtime's resolved
  default is displayed and checked before prompts. That last default-resolution
  branch is pure-test evidence only, not a live non-reasoning-model claim.
- Both runtime catalogs, initialized empty tools, and effective model/effort
  are checked before any prompt. Assignments are displayed before reviewer
  starts; actual usage must match model, effort, and `isByok: false`.
  Independent sessions retain the F3 denying hooks/permissions, disabled
  configuration discovery, no-timeout waiting, connection-failure supervision,
  cancellation, and owned-runtime shutdown.
- Each prompt carries captured metadata, diff, and numbered source context as
  JSON data. An appended system instruction marks all PR-controlled content as
  untrusted, forbids tools/local evidence, and requests substantiated P0-P2
  candidates with severity, confidence, location, and concrete evidence.
  JSON encoding and instructions aid interpretation; capability restrictions
  are the enforcement boundary, not a promise of prompt-injection immunity.
- Code-owned `Q3 binding:` and result envelopes identify repository/PR,
  head/base SHAs, diff/context hashes, paths, and per-source blob provenance.
  Model-written citations are **not validated by that envelope**. Outputs are
  explicitly untrusted, unvalidated candidates; no selection, publication,
  safeguards, source changes, or result cache was added.
- `Q3 evidence:` follows cleanup. `complete` means successful specialist
  execution and cleanup, not a validated or clean review. Partial/failed
  reviewers retain their output and do not discard successful peers. Capture
  skips/declines/pending confirmation report `coverage: "not-started"` with no
  reviewer runtime. Capture/setup failures, mismatched usage, cleanup errors,
  and cancellation report incomplete coverage.
- Quick dispatch returns after acceptance. Cancellation also aborts an active
  `gh` subprocess and the local confirmation waiter; a late confirmation
  cannot resume capture. A host-owned confirmation dialog may remain visible.
  Confirmation cancellation is demonstrated with a controlled pure probe, not
  a native UI exercise.

### Demonstrated outcome

On 2026-09-07 (local time), using CLI 1.0.83 / bundled SDK / Node.js 26.1.0 /
macOS arm64:

- All four pure probes passed. Q3 covers parsing/aliases/conflicts, exact
  specialist topology, ambient and explicit assignment resolution, three
  simultaneous in-flight prompts, input/envelope binding, untrusted metadata
  encoding, read-only session configuration, partial-result retention, tool
  attempts, missing/wrong usage, capture gates/failures, startup/setup errors,
  cancellation before/during capture and execution, late confirmation, and
  visible cleanup failures with force-stop.
- The installed-plugin controlled exercise ran against the Q2 fixture on a
  different dirty local branch. Both explicit quick and bare alias commands
  completed with three independent sessions using `claude-sonnet-5` / `high`.
  Final-run three-way overlap was **2006 ms** and **2445 ms**, respectively.
  The dirty reviewed-path decoy and checkout state remained unchanged; traced
  `gh` operations were read-only and source refs stayed captured. Owned runtime
  PIDs **60328**, **60861**, and **61387** exited after explicit completion,
  alias completion, and active cancellation, respectively.
- The live exercise reviewed public merged **github/copilot-sdk#2543** via
  `--include-closed`, using the same immutable head/base/diff/context identities
  recorded for Q2. The only captured path was
  `.github/workflows/java-publish-maven.yml`. All three specialists' actual
  usage was `claude-sonnet-5`, reasoning `high`, `isByok: false`.
  Explicit quick execution had **87406 ms** three-way overlap; the bare alias
  inheriting the configured parent had **74162 ms** overlap. The parent model
  and the unrelated empty checkout remained unchanged.

| Live explicit specialist | Independent session | Turn start (epoch ms) | Session idle (epoch ms) |
| --- | --- | --- | --- |
| correctness | `51b1e4b4-eb4b-443b-b9bb-6f8eab07b752` | 1788734231889 | 1788734392717 |
| contracts | `5a730b2d-2d04-4444-855f-c443acc189d2` | 1788734231879 | 1788734319310 |
| security-performance-resources | `97d638c9-67c4-4cd1-9d55-22d43b488623` | 1788734231904 | 1788734351778 |

Live alias session IDs: `fe0c136e-cf43-4526-9082-d77a275ccd69`,
`c75139e2-39d4-4a59-8b60-b5c247c8df06`, and
`ae84f2a5-b788-4660-947c-09806f302d38`, in specialist order.

- Live explicit and alias owned-runtime PIDs **52866** and **55651** exited
  after normal cleanup. Cancellation after all three live reviewers were active
  rejected a duplicate invocation, returned `complete: false`,
  `cancelled: true`, and three cancelled reviewer entries, and stopped PID
  **58412**. No harness kill was needed; cleanup errors were empty. Individual
  abort RPCs reported a disposed connection after force-stop, retained as
  reviewer error detail rather than hidden or mistaken for completed coverage.
- Live output included low-confidence candidates (for example, confidence
  **0.4**) and potential duplicate/pre-existing claims. These are evidence
  that the inference plumbing works, **not accepted findings or proof of a
  defect in that PR**. Q4 must independently reject unsupported/pre-existing
  claims and validate/deduplicate the rest.
- The refactored F2 real-inference probe also passed: `claude-sonnet-5` / `low`
  and `gpt-5.6-terra` / `high`, with **1970 ms** execution overlap. Existing
  pure F3 error/denial/cancellation checks passed. The complete native F3
  adversarial/loss/SIGSTOP suite was not rerun for Q3; its earlier evidence
  remains recorded above. New Q3 partial-failure scenarios are pure probes,
  while live Q3 cancellation and normal cleanup have process-exit evidence.

### Reproduction and consulted APIs

```sh
copilot plugin install "$(pwd)"
node scripts/smoke-fixture.mjs
node scripts/smoke-target.mjs
node scripts/smoke-context.mjs
node scripts/smoke-quick.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --target-live --quick
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_MODEL_1=claude-sonnet-5 PR_REVIEW_EFFORT_1=low \
PR_REVIEW_MODEL_2=gpt-5.6-terra PR_REVIEW_EFFORT_2=high \
node scripts/smoke-runtime.mjs --fixture
```

The pure scripts use existing Node.js/assert only. Runtime `--quick` and
`--fixture` spend subscription credits; the `--targets` and `--target-live`
variants without `--quick` remain no-inference. Use stub/live separately,
with a fresh runtime and reinstalled plugin. The live Q3 probe took several
minutes without imposing any review deadline.

Consulted current official
[plugin creation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating),
the extension authoring guide, installed SDK `docs/extensions.md`,
`docs/agent-author.md`, `types.d.ts` (`systemMessage` append mode), and
`generated/rpc.d.ts` (`model.getCurrent`, `CurrentModel.reasoningEffort`).
The existing stdio/session integration was reused, not replaced by factories
or a new runtime abstraction.

### Remaining limitations

At the Q3 checkpoint, no evidence-validation or deduplication implementation existed. The
reviewer's human-readable structure, claimed severity/confidence, and cited
paths/lines are requests in the prompt, not a trusted findings schema. The
code-owned envelope cannot make a hallucinated location valid or prove a
candidate was introduced by the diff. Q4 is the next increment.

Only all-heavy quick mode is wired. Saved tier configuration, trust, inheritance
across saved tiers, fallback, other modes, selection, retained results, and
publication remain their later increments. The large-input/context limitations
from Q2 remain: no prompt-size budget or truncation strategy; oversized input
can fail explicitly at the runtime/provider boundary. No timing-based fallback
or timeout was added. Remote/Enterprise/other-OS support and robust handling of
all provider behaviors have not been demonstrated. SDK transcripts may persist;
the plugin still has no cross-command or cross-session cache. L1 remains pending.

## Exact next increment

**Q4 only:** Validate evidence, severity/location/confidence, and deduplicate
quick specialist candidates; demonstrate a real `--quick --no-comment` result
with validated findings.

Acceptance criteria:

- Define a strict candidate/result boundary for the Q3 output. Malformed,
  incomplete, unsupported, or out-of-binding claims must not silently become
  accepted findings or clean coverage. Do not add the dropped experimental
  malformed-output extraction behavior.
- Validate each accepted candidate against the captured diff and Q2 source
  evidence, including repository/head/path/side/line provenance, concrete
  impact, confidence and severity, and whether the change introduced the
  defect. Quick results contain substantiated P0-P2 only.
- Deduplicate overlapping specialist reports of the same defect without
  merging distinct issues merely because they share a file or line. Preserve
  human-readable severity, location, confidence, and review structure.
- Preserve useful validated findings from degraded runs, with failed or partial
  coverage explicitly visible. Never turn execution completion or zero accepted
  candidates into an unjustified clean-review claim.
- Add deterministic Node.js/assert exercises for accepted/rejected candidates,
  provenance, false positives/pre-existing claims, deduplication, malformed
  output, and incomplete coverage. Separately record installed-plugin real-PR
  inference evidence; do not label model assertions as validated by default.

Keep the Q3 model assignment, isolation, progress, cancellation, no-timeout,
and cleanup guarantees. Do not add selection, caching, publication, saved
configuration, other modes, fallback, or safeguards. Do not modify reviewed
source, switch branches, or fetch/reset the checkout. Respect `SCOPE.md`,
keep L1 pending unless separately authorized, and copy no upstream source.

## Q4 implementation checkpoint

Starting checkpoint: `de4f00a` (Q3); the working tree was clean. The Q4 code is
original; L1 remains pending and no upstream source was copied.

### Implemented boundary

- `findings.mjs` defines strict versioned candidate/adjudication JSON. A SHA-256
  key binds responses to the code-owned repository/PR/head/base/diff/context
  envelope. Unknown fields, fenced/malformed JSON, invalid confidence/severity,
  missing evidence and wrong binding are rejected with visible coverage issues.
  No malformed-output extraction or silent repair is used.
- Candidate admission requires P0-P2, numeric confidence 0.8-1, concrete trigger,
  expected/actual behavior and introduction reasoning. The 0.8 threshold is a
  conservative policy, not calibrated confidence or proof of impact.
- Every quotation is compared byte-for-byte with the delivered Q2 source window,
  with exact path/side/line/ref/blob provenance. Primary locations are at most
  ten lines, inside one captured hunk, and intersect an actually changed line.
  The diff parser now retains added/removed line numbers separately from context.
  Introduction evidence compares the same hunk on base/head, including rename
  paths; null is permitted only on a side with no removed/added lines, including
  pure insertions/deletions that retain unchanged hunk context.
- Eligible candidates receive a separate tool-isolated heavy-tier adjudication
  pass, reusing `reviewAssignments` and the existing owned runtime. This is not
  a fourth specialist: the three quick reviewers still run concurrently first.
  The validator's effective model/effort is displayed and actual subscription
  usage checked. It is instructed to challenge reachability, guards, contracts,
  pre-existing behavior, causal impact, severity and confidence. Its acceptance
  citations are checked again by code.
- Deterministic grounding is distinct from fallible model judgment. Neither a
  matching quotation nor a second model's assertion is standalone proof of a
  defect. The final result explicitly says that no code execution/formal proof
  occurred. Missing context leads to rejection/uncertainty, not invented evidence.
- Deduplication requires an explicit same-cause/trigger/impact verdict and
  shared bound changed-source evidence; location equality alone never merges
  findings. The strongest accepted severity/confidence representative is shown,
  with original reports and reviewer attribution retained. Supporting citations
  allow the same cause to be identified across different primary anchors/files.
  Without shared causal change evidence, a merge is conservatively refused.
- Completed reviewers' useful findings survive failed peers and invalid sibling
  candidates/decisions. Unresolved/malformed output and uncovered non-textual
  changes keep coverage incomplete. Validator setup failures preserve specialist
  reports. Cancellation during validation uses the existing force-stop path.
  No review timeout, fallback, configuration, selection, cache, publication, or
  safeguards were added.
- The existing `Q3 evidence:` diagnostic now carries `executionComplete`,
  `validation`, and optional `adjudicator` evidence after cleanup. `complete`
  additionally requires resolved validation and clean cleanup. A target-bound
  human-readable findings view follows. Neither completed nor empty results
  claim a clean PR.

### Demonstrated before the real-positive PR exercise

On 2026-09-07, with the same CLI 1.0.83 / bundled SDK / macOS arm64 runtime:

- Existing Node.js/assert probes passed, including new `smoke-findings.mjs`.
  Coverage includes strict parsing, exact quotes, provenance tampering, unchanged
  anchors, confidence/severity rejection, missing context, renames/additions/
  deletions/zero-length hunk sides, same-defect versus distinct same-line reports,
  varying quote ranges, stronger duplicate representatives, failed-peer retention,
  and validator failure/malformed output/cancellation/cleanup. Semantic accept/
  reject judgments in pure probes are mocks, not actual-model evidence.
- The first installed `claude-sonnet-5` / `high` live exercise on the existing
  `github/copilot-sdk#2543` fixture returned fenced JSON from all three
  specialists in both explicit and alias runs. All were rejected, with zero
  findings and incomplete coverage. Three-way overlap was 54288 ms / 124841 ms;
  owned PIDs 98862 / 3802 / 7672 exited on explicit/alias/cancellation. This is
  native failure-containment evidence, **not** a positive review demonstration.
  No output was unfenced, repaired, extracted, or accepted to make a probe pass.
- The prompt was clarified, and a separate explicitly configured
  `gpt-5.6-terra` / `high` experiment was used. This is manual development
  configuration, not plugin fallback or a hardcoded product model default.
- Controlled PR 12 serves an original `total.js` regression: the unchanged
  comment requires unit cents multiplied by quantity, while head changes `*`
  to `+`. No fetched third-party source is stored in the fixture. Both explicit
  quick and ambient alias runs accepted one P2 finding at head line 3 with
  confidence 0.99, merging the correctness/contracts duplicate. The concrete
  example `total(100, 2)` changes from 200 to 102; both validator explanations
  match the actual original source. Each run had zero coverage issues and
  `complete: true`.
- Controlled three-way overlap was **2828 ms** / **1911 ms**. Owned PIDs
  **13829**, **14829**, **16077**, **16660** exited on explicit completion,
  alias completion, specialist cancellation, and validation cancellation.
  The last case retained three completed specialists and a cancelled validator,
  with no accepted findings. Cleanup errors were empty; no harness kill was used.
  The dirty decoy checkout and traced read-only GitHub request invariant held.
- Controlled explicit sessions: correctness
  `a80b5d3f-a909-47a7-b52b-63846935bd44`, contracts
  `502d859e-5d2e-4ee3-bcb5-8823054f2c42`, combined specialist
  `64cc9a19-7dd2-43c9-ba76-119cc2927b98`, validator
  `cb46fe30-e896-4a37-a478-a36a3f3ac535`. Validator ran after specialist
  completion. All actual usage was the explicitly assigned subscription model
  and high effort, `isByok: false`.

### Real-positive target and remaining acceptance

Read-only investigation identified public merged `ptitSeb/box64#3902`, a small
six-file change with a later regression fix in `ptitSeb/box64#3963`. No source
from either PR was copied into the repository. The latter PR is independent
historical corroboration for the demonstration, not supplied to the reviewers.

The no-inference installed-plugin capture passed with these pinned identities:

| Identity | Value |
| --- | --- |
| Head | `4796469dc5ee55a8327cdffffc1da7f0050c54ad` |
| Base | `df37f6acf0e5becb3b73fb546768273d29813053` |
| Diff SHA-256 | `87b7e554a1445005395d4d6f8962e740c94a48dba89a7f0c9cc583ae5803b02b` |
| Context SHA-256 | `3a8814f10b25da28cae6939252a834893e7ee7ec64c275a05844758b3518e9fe` |
| Size | 5251 diff bytes; 52582 context bytes; six files and twelve revision-bound sources |

The new `--regression-live` harness creates an empty temporary Git repository
owning this remote, never checks out source, and asserts those identities. Its
inference variant requires a finding on the changed normalization/CPUID source
and exercises validation cancellation as well.

The first real-positive explicit run accepted one P2 CPUID finding (confidence
0.98), merging correctness/contracts reports, with 24776 ms specialist overlap.
It identified `BOX64_AVX=2` surviving the removed normalization and reaching
raw shifts: `2 << 3` sets bit 4, not BMI1 bit 3. The same change drops XSAVE
bit 26 from the combined leaf-1 mask. Other adjacent shifted contributions
overlap, so do not incorrectly claim that every AVX/F16C feature disappears.
This matches the later recorded fix, without executing PR code.

That run correctly retained a coverage issue for the combined specialist's
`after: null`; the subsequent alias produced no accepted findings and failed
the positive harness assertion. Investigation found the boundary unnecessarily
treated unchanged hunk context as replacement code. It now permits null on a
side with no actual additions/removals, rather than requiring zero context
lines. The strict JSON schema and no-repair policy are unchanged. This also
motivated shared changed-source evidence for duplicate reports anchored in
different files. Deterministic probes cover both cases.

Final native inference after these corrections is still pending at this
implementation checkpoint; **Q4 is not yet marked complete**.

### Q4 reproduction and runtime limits

```sh
node scripts/smoke-fixture.mjs
node scripts/smoke-target.mjs
node scripts/smoke-context.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-findings.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --regression-live --quick
```

Use `--targets`, `--target-live`, and `--regression-live` separately; omitting
`--quick` remains no-inference. The original live fixture still demonstrates
strict rejection but is not expected to contain a proven defect. Positive
native runs use subscription credits; model compliance is not guaranteed.
Malformed output stays incomplete rather than triggering a repair/fallback.

Consulted the current official plugin-creation documentation, extension author
guide, installed SDK `docs/extensions.md`, and installed typings for output-format
support (no structured-output setting was found). Q4 reuses demonstrated session
APIs instead of assuming an SDK response-schema capability. No new dependency or
runtime abstraction was introduced. SDK transcripts may persist, but results are
not plugin-cached. Q2 context/window and GitHub path-to-blob trust caveats remain.
The complete native F3 adversarial/loss/SIGSTOP suite was not rerun; existing pure
F3 checks and new native quick/validation cancellation are separate evidence.

## Next work after the Q4 implementation checkpoint

Finish **Q4 only**: inspect the real-positive installed-plugin inference,
independently assess its accepted claims against the pinned source and known
regression, and record actual evidence and remaining caveats. Do not mark Q4
complete merely because the harness captures a target or models agree.
Only after Q4 acceptance is demonstrated does P1 finding selection become next.
