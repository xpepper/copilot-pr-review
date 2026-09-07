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
| Q4 | Completed | Strict evidence/whole-claim gates, isolated adjudication, deduplication and degraded findings; positive controlled and real-PR installed-plugin inference demonstrated below. | Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| P1 | Completed | Invocation-bound validated finding selection via native elicitation or `--all`; subset/none/cancellation, invalid-answer rejection and no-UI behavior demonstrated below. No writes/cache. | Q4; [Selection/publication](SCOPE.md#selection-publication-and-cached-results) |
| P2 | Completed | Retain the latest settled quick result in its originating local session; inspect without inference/GitHub access. Reload and conversation-backed cold resume demonstrated; command-only resume caveat below. | P1; [Cached results](SCOPE.md#selection-publication-and-cached-results) |
| P3 | Completed | Independent posting authority, explicit confirmation and code-built COMMENT payload preview; native cancellation/reload/resume and no-submission evidence below. | P1; [Publication controls](SCOPE.md#selection-publication-and-cached-results) |
| P4 | Completed | Current-run COMMENT publication with fresh gates and durable uncertainty; nine native cases, reload/cold resume and real playground inline publication demonstrated below. | P3; [Publication gates](SCOPE.md#selection-publication-and-cached-results) |
| P5 | Completed | Explicit publish-later of the retained selection without rerunning reviewers; refetched evidence, fresh gates, version-4 authority, seven native cases and a real playground publication demonstrated below. | P2, P4; [Cached publication](SCOPE.md#selection-publication-and-cached-results) |
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

## Q4 acceptance criteria recorded at the Q3 checkpoint

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

## Completed increment: Q4

Starting checkpoint: `de4f00a` (Q3); the working tree was clean. The Q4 code is
original; L1 remains pending and no upstream source was copied. Implementation
checkpoint `a4d3b35` records the initial boundary and native evidence. The
session-ending commit adds the whole-claim correction, final evidence, and handoff.

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
  citations are checked again by code. Acceptance requires explicit boolean
  `allClaimsSupported: true`: partly true reports must be rejected, not
  displayed with a correction buried in the validator's reason. The original
  candidate text is not silently edited.
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

### Real-positive target and implementation corrections

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

Those corrections were exercised through the installed plugin. Independent
inspection then caught a second problem despite passing harness assertions:
the validator accepted reports containing false details while acknowledging
the errors in its rationale. One report incorrectly treated C's `&&` as if it
preserved integer 2, and another claimed that all AVX bits disappeared despite
overlapping OR contributions. A true BMI1/XSAVE defect does not validate those
extra claims.

The final correction adds the required whole-claim support assessment and
explicitly rejects partial truth rather than rewriting the candidate. Pure
probes cover contradictory acceptance, missing/nonboolean assessment, and
retention of fully supported peers. Model judgment remains fallible; the flag
enforces the decision contract, not an independent semantic proof.

### Final Q4 installed-plugin evidence

The final implementation was reinstalled and exercised in fresh runtimes with
explicit `gpt-5.6-terra` / `high` assignments and the alias inheriting those
parent settings. All completed specialist/validator usage matched that
subscription model and effort (`isByok: false`), with independent session IDs.
The parent assignment, checkout state, and read-only request invariant held.

| Final exercise | Specialist overlap | Accepted findings | Duplicate reports merged | Coverage |
| --- | --- | --- | --- | --- |
| Controlled PR 12, explicit | 2359 ms | One P2, confidence 0.99 | 0 | Incomplete: an invalid reject-plus-duplicate decision was refused; the valid peer survived |
| Controlled PR 12, ambient alias | 3897 ms | One P2, confidence 0.99 | 0 | Completed; one overstated candidate was rejected |
| Public `ptitSeb/box64#3902`, explicit | 22502 ms | One P2, confidence 0.99 | 2 | Incomplete: unshown environment parsing/consumers remain uncovered |
| Public `ptitSeb/box64#3902`, ambient alias | 25582 ms | One P2, confidence 0.99 | 2 | Incomplete: the same source-window limitation remains visible |

The controlled alias explicitly rejected a claim that *every* numeric call
fails: `total(2, 2)` has equal sum and product. The retained correctness report
excluded those coincidental inputs and accurately described `total(100, 2)`
returning 102 instead of 200. The explicit run also demonstrated native
invalid-adjudication containment without losing the supported finding.

Both final public findings anchor the deleted normalization at
`src/tools/env.c`, **base lines 270-273**, blob
`500368b2305812b654f4f72d73fe8ab1de9b13d4`. They describe AVX mode 2 reaching
the unchanged raw CPUID shifts, omitting XSAVE and BMI1 at their documented
positions and setting the next bit instead. These accepted texts were assessed
against the captured before/after source, including the full OR expressions:
the aggregate leaf-1 mask loses XSAVE, not every adjacent AVX-related flag.
The later public fix `ptitSeb/box64#3963` booleanizes precisely the four leaf-1
shifts and the BMI1 shift. It corroborates the regression independently but was
never supplied to the model reviewers or validator. No fetched PR code,
project safeguard, or dependency installation was executed.

| Final public explicit role | Independent session | Turn start (epoch ms) | Idle (epoch ms) |
| --- | --- | --- | --- |
| correctness | `21e87b2d-cfde-4760-9c71-6079a002050c` | 1788765728716 | 1788765763548 |
| contracts | `5b46d6f7-a5a1-4ddd-af24-edd101356f6b` | 1788765728682 | 1788765752627 |
| security/performance/resources | `0a94af67-af80-4799-99fb-c290ca22719a` | 1788765728747 | 1788765751249 |
| evidence validator | `c5ceb76b-83c4-4018-b7f4-76db10229d98` | 1788765764657 | 1788765779622 |

Public alias sessions in that order:
`6219f694-c122-4056-947a-26be2a986bda`,
`62b6ae86-07ef-4b09-a063-fd0c6806983b`,
`521e2789-6323-4429-bb5c-2ce8b5d11016`,
`f45fe773-c589-4877-b3a8-7583f9bb580c`.

Final controlled owned-runtime PIDs **38284**, **39748**, **40619**, **41093**
exited after explicit completion, alias completion, active-specialist
cancellation, and active-validator cancellation. Final public PIDs **39409**,
**42658**, **44494**, **45295** exited for the same four cases. No harness kill
was needed; cleanup errors were empty. Validation cancellation retained three
completed specialist reports and a cancelled validator, with no accepted
findings. The public cancelled validator was
`9f121831-bc7d-4ec7-a928-d7bb59be7786`. Disposed-connection abort errors after
force-stop remain visible, as in F3/Q3.

This completes Q4's real `--quick --no-comment` demonstration with grounded,
deduplicated findings and explicit degraded coverage. It is not a clean-PR,
perfect-model, universal-recall, or full-repository-coverage claim. Model
noncompliance can still produce incomplete runs; no gate was relaxed to hide
those failures.

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

## Completed increment: P1

Implementation checkpoint `c0d3d16` continues Q4's `d794b71`. Implements selection
only, not publication or retention.
No upstream source, new dependency, review mode, fallback or safeguard was added.

### Implementation and boundaries

- `selection.mjs` consumes only `validation.findings`, after Q4's validation and
  deduplication. `--all` is accepted with either quick spelling and selects exactly
  those final IDs. `--no-comment` is still required; `--comment` is still rejected.
- Otherwise `session.ui.elicitation()` presents a labeled multi-select array,
  initially empty. Accepting an empty array or declining selects none. Cancelling
  the form cancels the run. Empty validated results skip the form without a
  clean-review claim. Missing host elicitation capability reports `unavailable`,
  never an implicit select-all.
- A UUID created at invocation start and `parent.sessionId` accompany the Q3
  record. Selection binds them to repository/PR identity, reviewed head and the
  digest of the full review binding. Each UI value includes the invocation UUID;
  reused candidate IDs cannot make a stale answer valid in another invocation.
  Unknown IDs, duplicates, malformed content and changed bindings fail closed.
  IDs remain invocation-local, not archive IDs.
- Full human-readable Q4 findings remain in the timeline; selection labels show
  severity/title, location/side and confidence. The form shows the captured head
  and completed/incomplete coverage. Useful findings from degraded runs remain
  selectable. Selection never rereads GitHub or starts more inference.
- `executeOwnedRun` stops the inference runtime and calls `onStopped(outcome)`
  before any selection UI. The extension now retains `activeRun` until the whole
  quick run finishes instead of clearing it at cleanup. Cancellation is still
  dispatchable during a pending form; a competing review is rejected. A cleanly
  stopped runtime is not force-stopped again. Failed cleanup does not mark it
  cleanly stopped or suppress a later cancellation force-stop attempt.
- `interaction.mjs` extracts Q1's cancellation-aware UI wait for reuse by both
  confirmation and selection. Cancellation settles the local waiter without
  waiting for a host answer; a later acceptance/rejection cannot resume it.
  No elapsed-time cancellation or timeout was added.
- `Q3 evidence:` remains the post-inference/cleanup review report. Final
  `P1 evidence:` contains invocation/binding, selection status and IDs,
  `reviewComplete`, final `complete`/`coverage`/`cancelled`, and cleanup errors.
  Selection failure and coverage are independent; `complete` is not a claim
  that selection or posting succeeded. Cancellation invalidates selected IDs
  and marks final coverage incomplete without erasing earlier review evidence.
- No result cache exists. SDK timeline/transcripts may persist, but the extension
  retains no selectable result after the invocation. No GitHub mutation occurs.

### Controlled evidence

`node scripts/smoke-selection.mjs` uses controlled final-result objects, not
semantic evidence. It covers all/subset/none/decline/cancel, empty/skipped results,
degraded coverage, absent UI, missing/malformed/duplicate/unknown values, raw and
rejected IDs, stale values from a prior invocation, repository/PR/head/session
binding changes, UI transport failure, pre-cancellation, pending cancellation,
late acceptance/rejection, and cancellation while completion is being logged.

`node scripts/smoke-quick.mjs` adds parsing and complete orchestration coverage:
selection consumes accepted final findings only after runtime cleanup and
listener removal; exactly three specialists plus one validator are started,
with no new inference during selection. Its positive semantic decision is
deliberately mocked and is not evidence that the constant-change fixture is a bug.
The existing target, context, findings, fixture and quick assertion probes pass.

### Installed-plugin evidence

On 2026-09-07 with CLI 1.0.83, bundled SDK, Node.js 26.1.0 and macOS arm64, the
locally installed plugin ran actual subscription inference with explicit
`gpt-5.6-terra` / `high`, not a product default or automatic fallback.
The SDK host handled actual native elicitation requests; the extension's
`session.ui` was not mocked. This demonstrates the form schema/transport and
command lifecycle, not terminal visual layout or portability to other hosts.

`scripts/target-fixture.mjs` adds controlled target 13 with two independent
original regressions: `total.js:3` changes multiplication to addition, and
`shipping.js:3` reverses the free-shipping threshold. Fixture `gh` is child-only;
these are not real GitHub PRs and no synthetic remote PR was created or merged.
Both sides have exact blob checks. The captured head/base are `b`/`a` repeated
40 times, with:

- Diff SHA-256: `5261fde91f3fa84d3a16e17a7de202c4d0ddb8e3b930cb4bbec33231dd172128`
- Context SHA-256: `98f09c437b92d61c97f7be6ded9cb3c46e4213bf39cc5eca9d9c9be1a1192ec0`
- Full review key: `3181ca216e5017a1ad57d19f565007a70a627520677272fb4e1b906149cbf018`

| Native case | Selection | Coverage/result | Owned PID observed exited |
| --- | --- | --- | --- |
| `--all` | 2 of 2 | Incomplete; two invalid reject-plus-duplicate decisions stayed visible | 76562 |
| Subset | 1 of 2 | Completed coverage, no clean-review claim | 77449 |
| Accept empty array | 0 of 2, `none` | Completed review coverage preserved | 81730 |
| UI cancel | 0 of 2, `cancelled` | Incomplete; existing invalid decisions preserved | 82706 |
| `/pr-review cancel` during pending UI | 0 of 2, `cancelled` | Earlier completed review became a cancelled/incomplete run; late acceptance inert | 83644 |
| Unknown choice | 0 of 2, `failed` | Missing caller/test context remained visible | 84494 |
| No UI capability | 0 of 2, `unavailable` | Completed review coverage, explicit selection refusal | 81053 |

Interactive cases observed owned-runtime exit **before answering the form**,
rejected a competing invocation while the form was pending, and started only
three specialists plus the validator. Every successful case reported empty
cleanup errors. The controlled checkout's branch, local HEAD, dirty decoy source
and sentinel stayed unchanged; traced `gh` commands were repository lookup or GET.

The all/subset host session was `00f8a7dc-6978-4362-9d83-0585bb3a7029`;
the remaining UI cases used `224512ed-4271-46f5-bf08-c099929738f9`;
the no-UI host used `8765c214-cd1f-46af-bf1c-7c1a762ab6c2`.
After the final cancellation-at-completion guard and cleanup callback adjustment,
reinstallation and subset/pending-cancel probes passed again in host session
`7a7de5f5-d234-4647-a670-0ad361798dbb`, invocation IDs
`1f7e90e1-6aba-4d4d-bcfe-3db839ce9004` and
`58e81aaa-d477-4499-bc0a-c8230e11e301`. The latter retained a missing-context issue
while clearing selections on cancellation. The existing native target-12 quick
probe also passed explicit, ambient alias, active-specialist cancellation and
active-validator cancellation, now awaiting final P1 evidence and using `--all`.
The full F3 adversarial/loss/SIGSTOP suite was not rerun for P1.

Two initial probe attempts are not successful UI evidence: observing processes
after only the first specialist became active caught transient startup children
and failed the harness's one-process assertion; the harness now waits for all
three active specialists, matching the existing Q3 probe. A later inference run
produced an empty, incomplete validated result and correctly did not open a form.
That positive-case harness stopped; the remaining named cases were explicitly
rerun. No gates were weakened, malformed output repaired or automatic retry added.

Local session artifacts hold the detailed native transcripts:
`files/p1-runtime-selection.log`, `files/p1-runtime-remaining.log`,
`files/p1-runtime-no-ui.log`, `files/p1-runtime-final.log`, and
`files/p1-quick-regression.log` under session
`989399ba-92b8-4f98-86e6-fe3f3833da16`. These artifacts are not a plugin cache
or required for subsequent work; reproduce from the committed harness.

### Reproduction and remaining caveats

```sh
node scripts/smoke-selection.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-target.mjs
node scripts/smoke-context.mjs
node scripts/smoke-findings.mjs
node scripts/smoke-fixture.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick --selection
```

Use `--selection-no-ui` instead of `--selection` for native unsupported-host
evidence; append `--selection-cases=subset,cancel-pending` to run selected UI cases.
Omit both selection options to run the existing explicit/alias/reviewer-cancel/
validator-cancel Q3/Q4 probe with `--all`. These quick probes spend credits;
omitting `--quick` from ordinary target probes remains no-inference.

Consulted current official plugin-creation documentation and the extension
author guide, installed SDK `docs/extensions.md`, `session.d.ts` and
`types.d.ts` (`ElicitationSchemaField`, `ElicitationResult`, `SessionUi` and
`sessionId`) before choosing the API. No SDK declaration was treated as
runtime proof. Reinstall after extension edits and use a fresh runtime; prompt
mode is not slash-command dispatch. No terminal visual-layout, other-OS, remote
host, Enterprise, token-only authentication or cross-client claim is added.

Model adjudication remains fallible and sometimes yields no eligible findings
or degraded coverage. Native UI answers here were scripted through the real
transport, not human clicks. Pending host dialogs may outlive cancelled local
waiters. Cancellation prevents later selection from a late answer, not the host's
own storage of that UI response. Q2 source-window and provider limits, Q4
whole-claim requirements and read-only capability-isolation caveats still apply.

## Completed increment: P2

Implementation checkpoint **`083684a`** completes P2 after implementation
`c0d3d16` and handoff `55a3a8a`. No upstream source was copied, no GitHub mutation
was performed, and nothing was pushed.

### Implementation boundary

- `retention.mjs` owns the versioned record schema, whitelisted projection,
  local session storage and `/pr-review inspect`. `retained-run.mjs` wraps quick
  execution with retention; `quick.mjs` accepts the wrapper's invocation identity
  without changing candidate validation or selection. `extension.mjs` dispatches
  inspection and reports asynchronous retention failures to the user.
- Exactly one latest quick-result slot is retained in the originating session's
  `pr-review-result.json`, outside the checkout. Accepted new quick runs replace
  the old result with a pending marker before capture. Capture-only and fixture
  commands do not replace it. There is no list/archive or session-ID selector.
- Settled records contain canonical validated/deduplicated findings, their exact
  citations and source provenance, the complete Q4 binding, invocation/session
  identity, selection disposition/IDs/binding, reviewer/model/usage attribution,
  rejection/duplicate reasons, and execution/validation/cleanup/error coverage.
  Raw outputs and duplicate candidate bodies are dropped; full diff/context text
  is not stored. Duplicate aliases cannot be selected.
- Storage uses host-reported `metadata.snapshot()` local session workspace
  identity, not a guessed home path or the working directory. Remote/missing
  workspaces, mismatched session paths/IDs, and sessions already reported in use
  are refused. Files are written with mode 0600 through a flushed temporary file
  and same-directory atomic rename. No storage API fallback exists.
- The final cancellation check and write are synchronous, with no await before
  `activeRun` clears in the same microtask checkpoint. No settled selected record
  is written while waiting on UI/log RPCs. Cancellation clears IDs and marks the
  result incomplete. Abrupt exit before settlement leaves the pending marker
  non-actionable; interrupted work is not reconstructed from transcripts.
- Inspection makes no model or GitHub requests and does not read reviewed local
  source. It displays the originating target regardless of the current directory,
  rejects active runs and invalid/stale/binding-inconsistent records, and keeps
  empty/skipped/failed/degraded/cancelled states visible. It is not a current-head
  check or publication command.
- `P2 evidence:` is emitted after successful storage and run settlement.
  `P2 inspection:` carries the loaded record. P1/Q3 evidence alone does not prove
  retention. A failed initial replacement can leave the older result; a failed
  final write leaves a pending marker. Errors explicitly direct the user to
  inspect state rather than treating the new result as saved.

### Controlled evidence

`node scripts/smoke-retention.mjs` exercises strict schemas, corruption, binding
changes, malformed/incompatible records, raw/rejected/duplicate/stale IDs,
selection states, degraded/empty/cancelled coverage, fresh-store reload,
pending replacement, missing/remote/in-use workspace refusal, unsafe files,
read/write failures, and retained-run skip/pre-cancel/final-log cancellation.
The fixture uses Q4's actual deterministic gates with controlled adjudication,
not native semantic inference. `smoke-quick.mjs` additionally projects/loads its
completed, failed, missing-usage, startup, tool-denial and cleanup-error outcomes.

Selection, quick, findings and fixture assertion probes passed. The existing
native selection harness now waits for P2 acknowledgement and compares loaded
findings/selection/coverage to the actual run, instead of stopping at P1 logs.

### Installed-plugin evidence and lifecycle limitation

CLI 1.0.83, bundled SDK, Node.js 26.1.0, macOS arm64. Explicit
`gpt-5.6-terra` / `high` was used for native inference, not a default or fallback.

The end-to-end native review used controlled target 12 (child-only read-only `gh`
responses, no remote PR). Session `802d0a8b-b17b-4fc3-a214-539dc3d958f8`,
invocation `84452191-cca5-4146-8a6b-84d395020d47` retained one P2 finding at head
`bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`, `total.js:3`, confidence 0.99;
one duplicate was merged and coverage completed. Owned inference PID `68410`
exited before inspection. Result digest:
`962847cd1208953e2f224af784186bc98856b3991f8f34e15c1cba00bba8f353`.
Diff/context hashes remained
`f4a7078c1142d622d880b65bf864235c11c4c2ddf334e57eb1633c942ea80632` /
`9a06c36ac953b92decd1d7c5378e75c3b498120928d7ee7e3abbe0998d54854d`.

Reload replaced extension PID `67940` with `69184` and preserved the exact
record. After explicit native session save/close and owned parent exit, a fresh
runtime resumed the same session and workspace with the same digest/findings/
selection. Reloaded resumed extension PID `69479` served inspection. This is
plugin-file reload/resume evidence, not a claim inferred from transcript storage.

**Important runtime limit:** a command-only SDK session has no resumable event
history in this CLI. Initial attempts, including explicit `sessions.save` and
`sessions.close`, failed cold resume with `Session not found`; the retained file
still existed. The reproducible no-inference controlled run
`988cada5-a92d-4eb8-87ee-cdac75f6cd07` demonstrated that limitation and successful
extension reload. The successful end-to-end session above included one ordinary
parent model turn solely to initialize a resumable conversation. The plugin does
not add that turn, fabricate history, or create a replacement session.

Final native local/in-use guards and cold resume were also exercised with a
controlled seeded result plus one real parent turn in session
`db006474-9cb6-470c-94f4-868af4505e74`; digest
`be6a0763a422337d93d5f88db4d2c44384671b171b3e9fd0e7f8c2fa087f1b0b`.
Those findings were fixtures, not a second real review. All lifecycle probes
asserted no inference/owned processes from inspection, no additional `gh`
requests, unchanged checkout, new-session isolation, copied wrong-session and
incompatible-record rejection, and non-actionable pending-marker inspection.

Real native selection/retention used controlled target 13 in session
`1d52c498-2826-4cb2-a63c-52cabb0bc60d`:

| Case | Invocation | Retained result | Owned inference PID |
| --- | --- | --- | --- |
| Subset | `9ce6cfc2-daf3-4a1b-829f-696452b3502a` | 1 of 2 selected, completed coverage | `71580`, exited before UI |
| None | `e463e751-d2c6-4758-bd9f-f6c7fd8a04c8` | 0 of 2 selected, completed coverage | `72462`, exited before UI |
| Pending-form cancellation | `c1a5c933-b881-4be8-97cf-2715262f829f` | 2 validated findings retained, zero selected, cancelled/incomplete; two validation issues already made review coverage incomplete | `73367`, exited before UI |

Their result digests respectively were
`442af0426a828b4bb944a2e5ac383a3d25ba706f9d4f5ebfe6e86b5da4f88540`,
`8d89df2889fa69f7ba3d251fd37ff103205611bdf59ea55843aa498eb4bfc256`,
and `bc7c2465c79eee8d6cb8ae6460e57bbe32071da2ca236f5a8b84b53b0af4c162`.
Late acceptance after cancellation was inert; reload/inspection does not turn
the retained cancelled findings into selected ones. Cleanup errors were empty.

### APIs, reproduction and remaining boundaries

Consulted the current official
[plugin creation docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
and [session lifecycle docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/work-with-multiple-sessions),
plus installed SDK `docs/extensions.md`, `extension.d.ts`, `session.d.ts`,
`client.d.ts` and `generated/rpc.d.ts` (`SessionMetadataSnapshot`,
`extensions.reload`, `sessions.save`/`close`, `resumeSession`). SDK/API declarations
were treated as candidates; actual native behavior above determines support.

```sh
node scripts/smoke-retention.mjs
node scripts/smoke-selection.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-findings.mjs
node scripts/smoke-fixture.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-retention-runtime.mjs --quick --parent-turn
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick --selection --selection-cases=subset,none,cancel-pending
```

`--parent-turn` without `--quick` uses a seeded fixture plus one parent turn for
cheap native cold-resume evidence; no flags spends no credits. The real quick
probe deliberately requires a positive validated result and never auto-retries
fallible model output. No fixture `gh` enters the ordinary shell PATH.

The record digest detects corruption/inconsistency, not deliberate tampering by
someone able to rewrite local session files and recompute it. There is no OS
sandbox, malicious-local-writer protection, cross-process locking, remote storage
support, or power-loss atomicity claim. Known already-in-use sessions are refused;
the host flag is not a lock acquired by this plugin. Human terminal `/resume`
clicks, session forks, other OS/clients, and the full F3 loss/SIGSTOP suite were not
exercised in P2. Interrupted-marker handling was controlled, not a new native
mid-write crash test. Existing permission/cancellation/Q4 limitations remain.
No posting authority, payload, publication, publish-later execution, saved
configuration, other modes, fallbacks or safeguards were added. L1 remains pending.

## Completed increment: P3

Implementation checkpoint `1b6576e`, after P2 checkpoint `083684a` and handoff
`cf2db2f`. No upstream source was copied; L1 remains pending. No GitHub mutation,
push or merge was performed. P3 authorizes proposals, not actual submission.

### Implementation boundary

`preview.mjs` owns independent posting policy, request construction, explicit
confirmation and strict retained-preview validation. `quick.mjs` accepts exactly
one quick-mode flag with optional `--comment` or `--no-comment`, rejecting their
conflict before capture. It preserves the captured evidence boundary through
selection, then calls preview only after inference cleanup. A bare number remains
capture-only. `--all` selects, never authorizes. `--comment` authorizes without
skipping selection; `--no-comment` suppresses authority without a final form.
Without either flag the boolean effective `autoPostReviews` calculation defaults
false; its injectable calculation is ready for C1/C2, but no configuration or new
setting syntax was implemented.

Selected proposals are displayed before final confirmation. The form defaults
false and accepts only a literal boolean; missing UI, refusal, malformed answers,
empty selection and cancellation are explicit non-authorized states. Incomplete
coverage is independent of authority: useful validated findings can survive.
The exact invocation/session/repository/PR/head/review binding and proposal input
are guarded across payload display and confirmation waits. No timeout exists.

The code-owned request envelope carries the selection binding and a REST-shaped
payload: captured `commit_id`, literal `event: "COMMENT"`, concise coverage body
and canonical-only inline comments. It rechecks quotations/source provenance,
changed-line inclusion and a single captured hunk before creating RIGHT/LEFT
anchors. Multiline comments use `start_line`/`start_side`; base citations for
renamed files use the current diff path, deleted files retain the old path.
Comments preserve severity, causal explanation, confidence and reviewer
attribution. All current findings require inline anchors; there is no eligible
non-inline finding category yet. Invalid anchors fail instead of becoming
body-only fallback comments.

`retention.mjs` now accepts strict version-2 records containing posting policy,
status, authority and the exact unsubmitted request. It reconstructs the expected
payload from canonical findings on inspection, detecting incompatible or altered
payload/authority fields. That reconstruction is not a source/current-head check.
Legacy version-1 P2 records remain inspectable only with their original
`noComment: true` boundary and no invented authority/preview. Unknown versions
and incompatible records fail explicitly. Inspect labels retained authority
historical, never permission for a future invocation.

Cancellation through final confirmation and the last retention log clears
selected IDs, revokes authority and removes the actionable request. Findings and
coverage evidence survive. The existing synchronous final cancellation
check/write and same-microtask `activeRun` clearing remain intact. No publication
API, hidden reviewer rerun, lifecycle refresh or safeguards were added.

### Controlled evidence

`scripts/smoke-preview.mjs` covers all posting-flag/effective-setting combinations,
invalid booleans/conflicting flags, confirmation acceptance/refusal/false/invalid
content/transport failure, missing UI, empty/skipped/unavailable selections and
degraded coverage. Exact payload assertions cover single and multiline ranges,
RIGHT/LEFT, and controlled rename/deletion path mapping. Corrupt citations,
unbound/stale IDs, raw/rejected/duplicate aliases, changed target identities and
invalid anchors fail closed; there is no body-only fallback.

Pending confirmation cancellation, inert late acceptance/rejection, cancellation
during payload/status logs and mutated proposal/session bindings are exercised.
Version-2 schema probes reject altered COMMENT event, head, location, text,
summary, selection and authority even when the record digest is recomputed.
Legacy records acquire neither preview nor posting authority.

`scripts/smoke-quick.mjs` now drives all/interactive selection with each posting
choice through controlled specialist/adjudicator execution, checking exactly four
sessions and owned-runtime cleanup before any UI. Its retained-run integration
cancels an already authorized proposal during the final retention log and proves
the atomically stored record has no selected IDs, authority or request while
keeping the validated finding. Existing retention, selection, findings and
fixture probes passed. Controlled positive adjudication is plumbing evidence,
not a semantic inference claim.

### Installed-plugin evidence

CLI 1.0.83, bundled SDK, Node.js 26.1.0, macOS arm64; explicit
`gpt-5.6-terra` / `high` was used, not a product default or fallback.
`scripts/smoke-preview-runtime.mjs` exercised actual specialists and validation
against child-only controlled `gh` target input, through the installed extension
and native SDK-host forms. Each case is an explicit new review, not a preview
action rerunning inference. All cases required positive validated findings.

Session `0c15e99d-3e02-45b2-8aca-1b2a4ca65733`:

- `--all --comment`: one canonical `total.js:3 RIGHT` P2 comment, completed
  coverage, `flag-authorized`, `submitted: false`. Owned PID `92606` exited;
  retained digest `edfd51e31f15e010ea46f4fd015f65f2d5d099a133542e247bafd2ba54787283`.
- Pending final confirmation cancelled through `/pr-review cancel`: PID `93501`
  had already exited before UI; retained selection empty, authority false,
  request absent, coverage incomplete. Late acceptance was inert. Digest
  `9d4fbba4c2d67988f58494296d4678fc11d805ea5c32c8dcff4337a6d6591f1f`.
- Final confirmation accepted: one canonical P2 comment, completed coverage,
  `confirmed`, still unsubmitted; PID `94303` exited. Digest
  `1ba86e9186d97479b1ceeaa80e942bb0f58338c80c808c4a8451b55ddf7dcc94`.
  Reload and cold resume in a fresh runtime preserved this exact version-2
  record. One harness-only parent turn initialized resumable history.

Session `5c48345a-be18-476f-99c0-cb4262198d87`:

- `--comment` without `--all` still opened selection for target 13's two defects;
  selecting one produced exactly one canonical comment. PID `96955` exited
  before selection; `flag-authorized`, completed coverage, unsubmitted. Digest
  `abeb9b95be26d5f989f1837aa397f1ef82e58fb04da4bde085525d56ea9aa5f9`.
- A final boolean false retained the displayed proposal but no authority:
  `declined`, `submitted: false`, PID `97872` exited, digest
  `9b599cffe6c279c99b61b7ec28c82bcaac3aaed655955529b18c99fe1623d9a7`.

UI-less session `20f02b81-c073-4c8f-96f2-d84b89157bbb` selected all but could not
confirm: `unavailable`, authority false, unsubmitted. Its valid finding survived
incomplete coverage because contracts reported missing caller/integration
context; the payload explicitly said INCOMPLETE. PID `99103` exited; digest
`f3995fd31966dead8f2aa9231330ea0a89f594ba1fc3ded5358c8624d683105e`.

Every case checked one owned inference runtime, three specialists plus one
validator with no hidden rerun, duplicate invocation/inspection refusal during
forms where applicable, and exact retained payload after reload. Inspection
made no model turns or `gh` requests. Controlled target assertions accepted only
read-only `gh` requests and verified the deliberately unrelated dirty checkout
was unchanged. Native command/target probes also passed after updating conflicting
flag expectations. Legacy P2 reload/inspection/session-isolation probes passed;
command-only cold resume remains unsupported, as previously recorded.

### APIs, reproduction and remaining limits

Consulted installed SDK `docs/extensions.md`, `docs/agent-author.md`,
`types.d.ts` (`ElicitationSchema`, `ElicitationResult`, `ElicitationParams`,
`ElicitationHandler`), current official
[plugin creation documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
and [REST review request documentation](https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request).
Native behavior, not declarations, establishes form and lifecycle support.

```sh
node scripts/smoke-preview.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-retention.mjs
node scripts/smoke-selection.mjs
node scripts/smoke-findings.mjs
node scripts/smoke-fixture.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-preview-runtime.mjs --cases=comment,cancel-pending,confirmed --parent-turn
```

Using the same explicit environment, run the native probe with
`--cases=subset-comment,declined`, or separately `--cases=unavailable` without
`--parent-turn`. `scripts/smoke-runtime.mjs --targets` and
`scripts/smoke-retention-runtime.mjs` use only the CLI/SDK environment and no
inference settings. Native inference spends credits; no positive result is
silently retried. The controlled `gh` executable must not enter ordinary PATH.
Reinstall after extension edits and use a fresh runtime. Direct local plugin
installation works but this CLI now warns that direct installs are deprecated
in favor of future marketplace-only installs; packaging migration was not P3.

No GitHub review endpoint was invoked. Remote acceptance of inline paths/ranges,
current lifecycle/head checks, handling of a write in flight and uncertain
outcomes are **not demonstrated by a preview**. P4 must supply those gates.
The current non-inline category is empty; do not invent findings or downgrade
bad anchors to manufacture body comments. Retained authority remains historical.
Native human terminal clicks, forked/remote/other-platform sessions, mid-write
crashes and the full F3 process-loss/SIGSTOP suite were not rerun in P3. P2's
storage/no-lock/no-power-loss and Q4's semantic/context-window limitations remain.
No publish-later execution, configuration, additional mode, fallback or safeguard
was added.

## Completed increment: P4

Implementation checkpoint `5df3083` continues from P3 `1b6576e` and handoff
`0f2a772`. The user subsequently authorized pushing the completed checkpoint;
`5df3083` was pushed to `origin/main`. The session-ending evidence/handoff
checkpoint follows it. No synthetic branch was merged and no upstream source
was copied. The implementation is current-run publication only, not cached
publish-later.

### Publication and retention boundary

`publication.mjs` consumes only the current invocation's authorized canonical
selection and code-built COMMENT request. It revalidates the captured evidence,
then GETs the explicitly bound repository identity, PR metadata, complete diff
and PR metadata again. Repository/PR identity, head/base SHAs, diff fingerprint
and lifecycle must still match. The original capture working directory is used,
not a later parent-session directory. The final request is a single `gh api
--hostname HOST --method POST repos/OWNER/REPO/pulls/N/reviews --include --input -`
with JSON stdin, reviewed `commit_id`, literal `COMMENT` and validated inline
comments. There is no retry loop or model-built mutation command.

Pinned upstream `lib/pr-review-publish.ts:1993-2005,2259-2275,2324-2343`
distinguishes explicit non-open permission, rejects drafts and allows inline
comments only on open PRs. Since all current canonical findings need inline
anchors and there is no eligible standalone summary finding category, P4
refuses draft/closed/merged publication even when review capture was overridden.
It does not introduce stale or non-open body-only fallback.

Version-3 records retain a separate `publication` state:
`not-attempted`, `in-flight`, `succeeded`, `failed` or `uncertain`.
The synchronous flushed-file/atomic-rename `in-flight` checkpoint precedes POST.
A failed checkpoint prevents dispatch; a failed final write leaves the earlier
uncertainty journal. Only a well-formed matching COMMENTED response produces
success with a review ID/URL. Explicit rejection statuses including 403/422 are
definite failures; server errors, transport loss, timeout responses, malformed
or mismatched acknowledgments and interrupted writes remain uncertain.
`gh` has no plugin-imposed timeout; cancellation kills the owned subprocess.

After dispatch, cancellation adds `cancelRequested` without clearing historical
selection/authority or claiming the remote mutation was undone. Before dispatch
the existing cancellation model still clears IDs and revokes authority.
Publication is checkpointed before awaited final logging; the final cancellation
check/atomic retention and same-microtask `activeRun` clearing remain intact.
An unresolved `in-flight`/`uncertain` result blocks a new quick run from erasing
the journal. There is no automatic reconciliation/retry command.

Versions 1 and 2 remain inspectable without fabricating authority or a write.
The proposal's legacy `submitted: false` is unchanged and is not the actual
write state; version-3 `publication.status` is authoritative. Inspection displays
the distinction and does not refresh GitHub or rerun inference. User messages
and README now warn that `--all --comment` can really publish.

### Controlled evidence

`node scripts/smoke-publication.mjs` demonstrates exact endpoint/host/stdin
requests, captured cwd, atomic write-ahead state visible before dispatch, success
retention and no second dispatch for the same invocation. It covers suppressed,
missing/refused/malformed confirmation, explicit acceptance, invalid canonical
IDs/events/anchors/quotes, repository/PR/head/base/diff drift, draft/non-open
gates, final-head drift and preflight cancellation.

It distinguishes 403/422 rejection, 503/transport/malformed/mismatched response
uncertainty, cancellation in flight and success received despite cancellation.
Storage failures before and after dispatch, inspectable in-flight state,
overwrite prevention, post-success cancellation and strict schema tampering
checks pass. `smoke-preview`, `smoke-quick`, `smoke-retention`, `smoke-selection`,
`smoke-findings`, `smoke-target` and `smoke-context` also passed after the changes.
These controlled proofs do not by themselves demonstrate remote acceptance or
native process-loss behavior.

### Real playground publication

On 2026-09-07 the user explicitly approved synthetic branches/commits through
the GitHub API after confirming there was no existing PR/branch target. No
`git push`, local checkout switch, main update or merge was performed.
The original four-line cents fixture lives only on two isolated remote branches:

- Base `playground/p4-base-20260907`:
  `155ed469b9f098e435435f020b2f4639abf9809a`.
- Head `playground/p4-regression-20260907`:
  `a68b6cd97f2bbfdca28bda4e7fb20bcf48205b32`.
- Synthetic PR [#1](https://github.com/xpepper/copilot-pr-review/pull/1) remains
  open, unmerged and based on the synthetic base, never main.

Installed CLI 1.0.83 / bundled SDK, Node 26.1.0, macOS arm64, explicit
`gpt-5.6-terra` / `high` executed three specialists and one validator, stopped
the owned runtime, retained one deduplicated finding and submitted real review
[`5130714400`](https://github.com/xpepper/copilot-pr-review/pull/1#pullrequestreview-5130714400)
as COMMENTED at the reviewed head. The contracts specialist explicitly reported
missing caller context, so both retained coverage and the published summary say
INCOMPLETE; useful validated findings survived.

Session `ae279b4d-53e7-4116-9ccd-86248db90b73`, invocation
`6c220206-b1c6-4075-a245-b0402c134542`, durable digest
`9d70e24259fa5accaa8da2fbcad87d7b7e6824fcdf0b6e1b4ca947d0292cdcae`.
Remote comment
[`3948685115`](https://github.com/xpepper/copilot-pr-review/pull/1#discussion_r3948685115)
matches the exact retained text at `playground/total.mjs:3`, RIGHT. GraphQL
confirms unresolved thread `PRRT_kwDOUQilZc6f3tE8`; PR head is unchanged.

The first live harness failed **after successful publication and retention**
because `/reviews/ID/comments` returns legacy position-only objects without
line/side fields. The harness now queries PR comments and filters by review ID.
Read-only verification against the existing durable record and remote review
passed; no inference or POST was repeated. The failed harness had already
asserted reviewer count and owned-runtime exit, but did not reach its final
native reload/local-state assertions. Do not claim those from this live run.

### APIs, reproduction and remaining work

Consulted installed SDK `extension.d.ts` and `docs/extensions.md` for extension
lifecycle (SIGTERM then SIGKILL), official
[plugin creation/cache documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating),
and the current
[REST review endpoint documentation](https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request).
No new SDK integration was chosen. GitHub requests pin API version 2022-11-28.

```sh
node scripts/smoke-publication.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
# The following already published once. Do NOT repeat against PR 1/head below.
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-publication-live.mjs --publish --pr=1 \
  --head=a68b6cd97f2bbfdca28bda4e7fb20bcf48205b32
# Safe read-only verification of the existing live result, no SDK or inference:
node scripts/smoke-publication-live.mjs --pr=1 \
  --head=a68b6cd97f2bbfdca28bda4e7fb20bcf48205b32 \
  --verify-record="$HOME/.copilot/session-state/ae279b4d-53e7-4116-9ccd-86248db90b73/pr-review-result.json"
```

### Final installed-plugin evidence

All nine cases in `scripts/smoke-publication-runtime.mjs` passed against the
installed plugin with actual `gpt-5.6-terra` / `high` inference and opt-in,
child-only controlled `gh` responses. Each starts three specialists and one
validator and requires positive canonical findings. For every POST the fixture
holds its response until the harness reads the actual version-3 `in-flight`
record from the host-reported session workspace and confirms owned inference
already exited. It then releases the response or cancels the run while the
owned `gh` process is held; the cancellation case also verifies that PID exits.
Exact posted stdin equals the retained canonical COMMENT payload.

| Case | Session | Owned inference PID | Result | Durable digest |
| --- | --- | --- | --- | --- |
| comment | `2759fec3-2f78-4a65-a9c6-1fe72b5ef801` | 64360 | succeeded | `b3d0ae02b2a16ef8305ea002f5c0850c3edac6174592066305f541cc555aceb9` |
| stale | `5d752a69-4b98-411e-a4a3-3f615dec428b` | 65247 | not-attempted | `5d7c023038cabfff1675c92e87ae251898f34f68550f6e53b83edff58ded51a6` |
| uncertain | `b71dfecb-7f63-4de0-8d9e-3581afb6dc11` | 66199 | uncertain (HTTP 503) | `8962b425ca4099ac971bae4e27f554781e24a7ce348a38f096cd65d442fcc561` |
| cancel | `272bb619-4b0e-4aab-8726-c084ed1a9123` | 67112 | uncertain + cancelRequested | `8f524c1197bedc518ed047273b361e7f723b48675c608d1c2295be0e9bc7ff81` |
| reject | `76d430f2-8a5b-4a20-aaf4-b4cda3be4d09` | 68038 | failed (HTTP 422) | `d7f92ed8692f5b6fface7d05904239dea01f06a88cd71486a12b2c196436284c` |
| confirmed | `22e460a8-3581-4100-9553-c16d4ce9d0f1` | 69042 | succeeded after final UI acceptance | `483ec6a96d8c662b14aa24132b25d107067fd523d89830b99202d1713a47159c` |
| declined | `94d6bd55-9b07-4cfa-a5cf-c6a40a32dcf0` | 69914 | not-attempted | `4f65fd17e0dd11bca86e5f87ed9ed46664b842e5f315b3e6cc33ea7ebdb541ab` |
| suppressed | `3e9edec4-4a79-421f-b278-779b9da4dc8f` | 70819 | not-attempted | `12658f5f48a360f9e88aa03971f75fb2e80d0410d81f7f0e964420a22176e271` |
| draft | `26794ad8-50fa-4044-88c1-19b3ef7679e9` | 71818 | not-attempted after draft transition | `357b49ecdd2ca6c1888dcd684924aa4518a9d08f3139ca781b9680b86f5ee77c` |

Every case preserved its exact record through native extension reload and
inspection, with no inference, GitHub requests or source changes during
inspection. Rejected publication retained incomplete review coverage; the other
eight completed their review coverage. Post-inference cancellation correctly
preserved the completed historical review instead of pretending to undo it.
No case retried its POST. The first controlled native attempt stopped on a
harness-only source-status assertion because its coordination marker was in
the untracked checkout. Markers now live inside the fixture's `.git` directory;
the successful nine-case run followed that correction. No real GitHub mutation
was repeated by these controlled probes.

The updated `smoke-preview-runtime.mjs` additionally demonstrated one shared
native session `d994ac73-b839-4c2e-9035-5b0591f2eda3` with authorized all,
pending-confirmation cancellation/inert late acceptance, and subset selection
despite `--comment`. The selected subset published only one of multiple validated
findings, with incomplete coverage preserved. Owned inference PIDs
73301/74287/75173 exited; each exact record survived reload. With one
harness-only parent initialization turn, cold resume in a fresh runtime preserved
the final version-3 record digest
`e03fe25a27c8b453d8856decd3d71941084a590b12efecb29957d7cdcf803bb4`.
No plugin-created transcript history or hidden inference was introduced.

`smoke-runtime.mjs --targets` and `smoke-retention-runtime.mjs` also passed
without inference. Legacy version-1 inspection/reload remained available, while
command-only cold resume still honestly reported `Session not found`.
`smoke-quick.mjs` now exercises the actual final-retention-log cancellation
boundary both before dispatch and after confirmed success, checking the atomic
record rather than only calling the cancellation helper.

Reproduce with the explicit environment from above:

```sh
node scripts/smoke-publication-runtime.mjs --cases=comment,stale,uncertain,cancel,reject,confirmed,declined,suppressed,draft
node scripts/smoke-preview-runtime.mjs --cases=comment,cancel-pending,subset-comment --parent-turn
```

These native cases deliberately spend inference credits and start no automatic
positive-output retries. Fixture publication requires an explicit harness opt-in;
never put the fixture `gh` on ordinary PATH. Reinstall only after extension edits
and use a fresh runtime. Direct-install deprecation remains a CLI caveat.

### Remaining limitations

Remote RIGHT single-line anchor acceptance is demonstrated; real
LEFT/multiline/rename/deletion acceptance is not yet demonstrated (controlled
payload/citation gates cover them). The final GET/POST is not an atomic compare-and-submit operation:
a concurrent remote update can still make the explicitly head-bound review
outdated. No stale fallback is used. P2's command-only cold-resume/no-lock/
no-power-loss guarantees and Q4 semantic/context-window limits remain. Full F3
process-loss exercises are not rerun here. No P5, configuration, additional mode,
fallback or safeguard work is included.

## Completed increment: P5

Implementation checkpoint `f698df6` continues from P4 `157747b`. No upstream
source was copied and no reviewer, validator or parent inference participates in
publish-later. Nothing was pushed in this session.

### Publish-later boundary

`/pr-review publish` takes no argument. It publishes only the current local
originating session's retained result, so there is no cross-session archive,
target argument or finding editor. Invoking the command is itself the new
explicit publication action that `SCOPE.md` allows in place of a final
confirmation; retained `--comment`, configuration or confirmation authority is
historical and grants nothing. A `--no-comment` run is therefore publishable
later, while a retained `flag-authorized` proposal still needs this new action.

`publish-later.mjs` refuses, before any GitHub request, a missing, pending,
malformed, wrong-session, cancelled or unselected record, and a record older
than schema version 2, which predates posting authority. It refuses a result
that already succeeded and one whose previous write is `in-flight` or
`uncertain`. A definite `failed` outcome may be published again only through a
new invocation that reruns every gate under a new authorization.

Retention deliberately holds no captured `evidenceBoundary`, so reconstruction
from stored citations is not accepted as provenance. Publication refetches the
bound repository identity, PR metadata, complete diff and both reviewed source
revisions through `assembleContext`, rebuilds the boundary with
`evidenceBoundary`, and rebuilds the payload with `buildReviewPreview`. Blob
identity, diff fingerprint, context digest, quotations and changed-line anchors
must still match the retained binding; when the record also holds a proposal,
the rebuilt request must equal it. The local checkout is never read: every
request names the captured host, repository and PR explicitly, so the session's
current working directory only hosts `gh`.

P4's gates and durability are shared code, not reimplemented.
`verifyPublicationTarget` reruns repository/PR identity, head/base, draft and
non-open lifecycle and the diff fingerprint, and `recheck()` reads PR metadata
again immediately before dispatch. `dispatchPublication` writes the flushed-file
atomic `in-flight` journal before the single POST and the final outcome after
it, and stamps both with the authorizing invocation. There is no stale,
body-only or partial fallback and no retry loop.

Version 4 marks a record whose write came from this command; versions 1 to 3
stay readable exactly as written, and a current-run write stays version 3.
`publication.authority` records `kind`, the authorizing invocation and the
session, must differ from the review invocation, and is rejected on any other
shape. An attempted write now requires either historical run authority or this
explicit authorization, never neither. Refused attempts write nothing, leaving
the retained record byte-identical, and never mark a historical review
cancelled. Cancellation before dispatch stops without a write; after dispatch it
adds `cancelRequested` without claiming the remote write was undone. The final
cancellation check and atomic rewrite still precede no awaited call, and
publication holds the session's active-work slot without owning a runtime.

### Controlled evidence

`node scripts/smoke-publish-later.mjs` retains a real suppressed `--no-comment`
result in a session workspace, then publishes it with the explicit command.
It asserts the exact refetch sequence, repository, PR metadata, diff, both
reviewed source revisions and a final metadata read before one POST whose stdin
equals the retained canonical payload; the durable version-4 `in-flight` journal
is observed from disk during that POST. The published record keeps the original
invocation, findings, canonical selection, coverage and historical
`suppressed`/`authorized=false` proposal, and inspection reports that the write
came from the later explicit command.

The probe also covers offline refusals for missing, pending, legacy version-1,
wrong-session, corrupt, cancelled, unselected and unresolved records; fresh
repository, PR identity, head, base, draft, closed, merged, diff, source-blob
and final-head drift; pre-dispatch cancellation; HTTP 422 rejection versus 503,
transport and malformed-acknowledgment uncertainty; post-dispatch cancellation;
refusal to repeat a succeeded or unresolved write; a gated retry with a distinct
authorization after a definite failure; storage failure before and after
dispatch; and tampered version-4 authority schemas. The parent double throws on
any model or UI request, so no inference or elicitation can hide in the path.
`smoke-context`, `smoke-target`, `smoke-findings`, `smoke-selection`,
`smoke-retention`, `smoke-preview`, `smoke-quick` and `smoke-publication` still
pass after the shared-gate refactor.

These controlled proofs demonstrate neither remote acceptance nor native
installed-plugin behavior on their own; both are covered below.

### Installed-plugin evidence

All seven cases in `scripts/smoke-publish-later-runtime.mjs` passed against the
installed plugin with actual `gpt-5.6-terra` / `high` inference and the
child-only controlled `gh` fixture. Every case first runs a real
`--quick --all --no-comment` review, so the retained result carries no posting
authority, then publishes it with `/pr-review publish`. Each case requires
positive canonical findings, exactly three specialists plus a validator, and an
exited owned runtime before publication. For every POST the fixture holds its
response until the harness reads the actual version-4 `in-flight` record from
the host-reported session workspace.

| Case | Session | Review inference PID | Publish-later result | Final digest |
| --- | --- | --- | --- | --- |
| publish | `43156406-c7b2-40a8-bf74-08cdf5ccb5ce` | 11329 | succeeded | `6d347f20afbadbe8566639bd2fa3a1be0488759a37ad182d108f6b0ce35e51a0` |
| stale | `3281d598-03fb-4c28-a833-e9ef4cc8c9ff` | 14701 | refused; record unchanged at version 3 | `f93cb86f4387b6d4ac8eea6f84fe528baad92842734d9c1edb8e92b6cc80e275` |
| uncertain | `01b002c5-1bd8-4fcb-9b9b-33718442a322` | 16062 | uncertain (HTTP 503) | `d4e2202db57901da7b9565cf38ee1f16f706111c4f63519721adf5ce0a3922c9` |
| cancel | `92ee5b19-f196-4aeb-90b8-55f1c836acd7` | 17454 | uncertain + cancelRequested | `2cee32976fd1c49e045bbc27ef88587b333587ca3cf2f7907908143dd3b75e71` |
| reject | `704dcc74-049d-4c06-98bd-beb6fb489ab6` | 18862 | failed (HTTP 422), then a gated retry failed again | `4a8123577232621769fae4c055523f33af394a3c1c53b3abe55700f82cf4d69d` |
| draft | `2cd41217-a488-4aa6-adde-1229326f6caa` | 20171 | refused; record unchanged at version 3 | `d8df7efc52d87320c67ec258fb72a3dbb6304d68f58b28aa381abec1b5a3bb2d` |
| resume | `4684084a-2096-4e4b-83ab-81bcfbff5041` | 21868 | succeeded after conversation-backed cold resume | `6017c43971e17c57c2c391cd1e6326d98b3f71a05ffc05818c152f5de415cd01` |

Every publish command produced no `user.message`, `assistant.*`, `subagent.*` or
`tool.execution_start` event, no `Reviewer ... starting` message, and no
surviving owned process; the harness rejects any elicitation request outright.
Each case reloaded the extension between the review and the publication, so the
published record was reloaded from disk rather than run memory, and inspection
after publication survived another reload. Each posted stdin equalled the
retained canonical payload, and every dispatching case refetched
`/contents/` source at the reviewed revisions.

A second `/pr-review publish` ran in every case. It dispatched again only for
`reject`, with a different authorizing invocation and a full gate rerun; it
refused the succeeded, uncertain and cancelled records without contacting
GitHub, and left them byte-identical. The `cancel` case verified that the owned
`gh` POST process really exits when cancellation arrives while the response is
held. The `resume` case saved and closed the session, stopped the runtime,
reconnected and resumed it, and published from the resumed session; its one
harness-only parent turn initialized resumable history and is not plugin
behavior.

The first `stale` attempt stopped because that inference run validated no
finding, so there was nothing to publish later. That is fallible model output,
not plugin behavior; the case was rerun deliberately and the harness performs no
automatic positive-output retry. `smoke-publication-runtime.mjs --cases=comment`
passed unchanged after the shared-gate refactor, retaining a version-3 record
with no authority (session `034b88cb-91f2-4bba-9a13-24353227451c`, digest
`08279c4e97b4098e9a5ce3219876ee5fe8807f224d1e59834b4a97cd6f4d8400`).
`smoke-runtime.mjs --targets` and `smoke-retention-runtime.mjs` also passed
without inference, and legacy version-1 inspection still works.

### Real playground publish-later

The user authorized synthetic playground branches, commits and PRs through the
GitHub API. Fixture setup used the API only, separately from the review
workflow: no `git push`, no local checkout switch, no main update and no merge.
The new synthetic percentage-discount fixture lives only on two isolated remote
branches:

- Base `playground/p5-base-20260907`:
  `160ec104c5fcd9f6028acd76e4a421a153dbc743`.
- Head `playground/p5-publish-later-20260907`:
  `64383e445ffff9677f1958a83829232f2089f0ce`.
- Synthetic PR [#2](https://github.com/xpepper/copilot-pr-review/pull/2) remains
  open, unmerged and based on the synthetic base, never main.

Installed CLI 1.0.83 / bundled SDK, Node 26.1.0, macOS arm64, explicit
`gpt-5.6-terra` / `high` ran `2 --quick --all --no-comment`, which retained a
version-3 record with `preview.status=suppressed` and no write. After an
extension reload, `/pr-review publish` refetched the identity, metadata, diff
and both reviewed revisions from real GitHub and submitted review
[`5131451227`](https://github.com/xpepper/copilot-pr-review/pull/2#pullrequestreview-5131451227)
as COMMENTED at the reviewed head.

Session `835f1310-a525-42be-a496-e31926ec008c`, review invocation
`969958b6-0cec-48f4-a2ee-66271b949b11`, publish authorization
`58861588-87b8-4f60-96bc-5ad2ef05dab0`, durable version-4 digest
`240ad077014d16e3fd48d843d3cdefe0983e6015efcbf4245ce3f8517163841d`.
The single P1 finding, confidence 0.99, was reported by the correctness and
contracts specialists and deduplicated; because the changed function's caller
lives in the same file, review coverage was **completed**, unlike P4's
incomplete run. Remote comment
[`3949275074`](https://github.com/xpepper/copilot-pr-review/pull/2#discussion_r3949275074)
matches the exact retained text at `playground/discount.mjs:5`, RIGHT. GraphQL
confirms unresolved, non-outdated thread `PRRT_kwDOUQilZc6f5Mm6`; the PR head is
unchanged and the PR is not merged. Read-only re-verification of both the new
version-4 record and P4's existing version-3 record passed without inference or
mutation. **Do not repeat either POST.**

### APIs, reproduction and remaining limits

No new runtime API was adopted: publish-later reuses the extension command
surface, the session metadata snapshot and the same read-only `gh` requests, and
consulted the installed SDK `extension.d.ts` and the current
[REST review endpoint documentation](https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request)
before reusing the pinned 2022-11-28 API version.

```sh
node scripts/smoke-publish-later.mjs
node scripts/smoke-publication.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-publish-later-runtime.mjs --cases=publish,stale,uncertain,cancel,reject,draft
# Cold resume runs alone; it initializes its own resumable history.
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-publish-later-runtime.mjs --cases=resume
# Already published once. Do NOT repeat against PR 2 at the head below.
# node scripts/smoke-publication-live.mjs --publish-later --pr=2 \
#   --head=64383e445ffff9677f1958a83829232f2089f0ce
node scripts/smoke-publication-live.mjs --pr=2 \
  --head=64383e445ffff9677f1958a83829232f2089f0ce \
  --verify-record="$HOME/.copilot/session-state/835f1310-a525-42be-a496-e31926ec008c/pr-review-result.json"
```

Remaining limits are inherited rather than new. The final GET and POST are still
not an atomic compare-and-submit operation, so a concurrent remote update can
still make an explicitly head-bound review outdated. Retained storage still has
no cross-process lock or power-loss guarantee; the digest detects corruption,
not a writer able to recompute it. Real LEFT, multiline, rename and deletion
anchors remain undemonstrated remotely; controlled payload gates cover them.
Command-only cold resume is still unsupported by the CLI, so publish-later after
a resume needs conversation-backed history. There is still no automatic
reconciliation or retry command for an uncertain write, and a definite failure
must be republished deliberately. Q4 semantic and context-window limits and F3
process-loss limits are unchanged and were not re-exercised here. No
configuration, additional mode, fallback or safeguard work is included.

## Exact next increment

**C1 only:** Inspect and update personal tier configuration through text
commands, with validated capabilities, tier inheritance and flag precedence.
Do not implement project-override trust (C2), other review modes, fallbacks or
safeguards, and do not change publication behavior.

Acceptance criteria:

- Add a code-owned configuration command following the upstream
  `show` and `key=value` workflow, with no interactive menu and no finding
  editor. Unknown keys, malformed assignments and unsupported values must be
  explicit errors that change nothing.
- Support light, medium and heavy model and reasoning-effort assignments.
  Validate every explicit value against the session's actual available models
  and their supported efforts. Never silently substitute a model or lower an
  effort; refuse instead.
- Preserve upstream nearest-configured-tier and ambient-model inheritance for
  unset tiers, and display the resulting effective assignments before execution.
  Keep `autoPostReviews` retained and inspectable, defaulting to false.
- Persist personal configuration outside the reviewed checkout, in a documented
  location, with a versioned schema and an explicit error for malformed or
  incompatible stored settings. Do not read or trust any repository-provided
  configuration file yet: a repository must not authorize itself, and project
  overrides remain C2.
- Explicit invocation flags must take precedence over saved settings for that
  invocation only, without rewriting the saved configuration. `--comment` /
  `--no-comment` must still conflict, and effective `autoPostReviews=true` with
  `--all` must remain able to publish unattended, as recorded in `SCOPE.md`.
- Configuration inspection and updates must start no inference, no GitHub
  request and no review work, and must be refused while review or publication
  work is active.
- Demonstrate through controlled probes and installed-plugin probes that saved
  settings actually drive quick reviewer assignments, that flags override them,
  and that invalid explicit settings are refused rather than downgraded. Reuse
  the existing no-inference runtime probes where possible instead of spending
  new inference credits for plumbing.
- Consult the installed SDK and current official documentation before adopting
  new runtime APIs, then record evidence, remaining limits and the next small
  increment. Follow `AGENTS.md` checkpoint and final-file handoff rules in turn.

Keep L1 pending, copy no upstream source and implement no additional modes,
fallbacks or safeguards. Do not switch branches or modify reviewed source as
part of review or publication. No push authorization exists in this session;
do not assume one.
