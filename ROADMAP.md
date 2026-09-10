# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md).

**Since 2026-09-07, every increment lands on a branch and a pull request that is
reviewed with this plugin, and that review is the increment's real integration
test.** Controlled suites use test doubles and prove logic only; the pull-request
review exercises the installed plugin, the real runtime, real models, real `gh`
requests, the real revision gate and real confined reads. An increment is not
demonstrated until that has run once and its evidence is recorded here. `main` carries a repository ruleset requiring a pull
request with zero approving reviews and no bypass actors, so nobody pushes to it
directly. Each increment's entry below must record its pull request and the
outcome of reviewing it with the tool: mode, model and effort actually used,
coverage, findings and withheld findings, reported credit cost, and what changed
in response. The tool emits only `COMMENT` reviews, so its review never satisfies
an approval requirement, and findings stay local unless the user authorizes
posting them.

## Increments

| ID | Status | Independently demonstrable outcome | Requirements / dependencies |
| --- | --- | --- | --- |
| S0 | Completed | Confirmed product specification recorded in `SCOPE.md`, commit `6407a59`. | [Goal](SCOPE.md#goal) |
| L1 | Pending | Resolve applicable upstream licensing and attribution; record what can be reused. No upstream source reuse until resolved. Original prototypes need not wait. | [Upstream baseline](SCOPE.md#upstream-baseline) |
| F1 | Completed | Locally installable plugin with a code-owned, usable status/help entry point; runtime evidence and reproduction below. | [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F2 | Completed | Two concurrent reviewers over a tiny original local fixture; distinct explicitly configured subscription models and reasoning levels; display assignments, per-reviewer progress, and results. | F1; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F3 | Completed | Native forbidden-tool denials plus an adversarial fixture; retained incomplete coverage; startup/active/unresponsive cancellation and owned-runtime/extension/parent loss exercised with process-exit evidence. Stdio integration selected; limits below. | F2; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F4 | Completed | A reviewer child session can be granted an exact read-only built-in subset (`view`, `grep`, `glob`) while write/exec tools stay natively refused, reads are confined to a chosen directory by the permission handler, and the grant does not leak. Evidence below. | F3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| Q1 | Completed | Read-only code-owned PR capture with repository/head-bound snapshot, skip/override/confirmation gates, consistency guards, and installed-plugin controlled/live evidence below. | F3; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q2 | Completed | Source context bound to the captured head/base revisions with blob-verified provenance; local-checkout, moved-head, and inconsistent source refused. Evidence below. | Q1; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q3 | Completed | Three concurrent quick specialists consume bound PR input; explicit/ambient assignments, alias, incomplete coverage, and cancellation demonstrated below. Candidates remain unvalidated. | Q2; [Modes](SCOPE.md#review-modes-and-findings) |
| Q4 | Completed | Strict evidence/whole-claim gates, isolated adjudication, deduplication and degraded findings; positive controlled and real-PR installed-plugin inference demonstrated below. | Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| P1 | Completed | Invocation-bound validated finding selection via native elicitation or `--all`; subset/none/cancellation, invalid-answer rejection and no-UI behavior demonstrated below. No writes/cache. | Q4; [Selection/publication](SCOPE.md#selection-publication-and-cached-results) |
| P2 | Completed | Retain the latest settled quick result in its originating local session; inspect without inference/GitHub access. Reload and conversation-backed cold resume demonstrated; command-only resume caveat below. | P1; [Cached results](SCOPE.md#selection-publication-and-cached-results) |
| P3 | Completed | Independent posting authority, explicit confirmation and code-built COMMENT payload preview; native cancellation/reload/resume and no-submission evidence below. | P1; [Publication controls](SCOPE.md#selection-publication-and-cached-results) |
| P4 | Completed | Current-run COMMENT publication with fresh gates and durable uncertainty; nine native cases, reload/cold resume and real playground inline publication demonstrated below. | P3; [Publication gates](SCOPE.md#selection-publication-and-cached-results) |
| P5 | Completed | Explicit publish-later of the retained selection without rerunning reviewers; refetched evidence, fresh gates, version-4 authority, seven native cases and a real playground publication demonstrated below. | P2, P4; [Cached publication](SCOPE.md#selection-publication-and-cached-results) |
| C1 | Completed | Personal light/medium/heavy tier configuration and `autoPostReviews` inspected and updated by `/pr-review-config`; validated capabilities, nearest-tier/ambient inheritance, flag precedence and effective-assignment display demonstrated below. | F3; [Configuration](SCOPE.md#models-configuration-and-execution) |
| C2 | Completed | Explicit per-directory trust gates `.copilot/pr-review/config.json` overrides; untrusted files ignored unparsed, self-trust impossible, precedence and revocation demonstrated below. | C1; [Configuration trust](SCOPE.md#models-configuration-and-execution) |
| R1 | Completed | Verified-checkout reads and matching-head harnesses demonstrated. One authorized live quick review used unchanged source without denials; prior coverage gaps disappeared, but no additional finding was produced. GPT's `rg` alias is supported without widening the grant. | F4, Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| M1 | Completed | Balanced is the default with its four heavy specialists, light overview reviewer and three-finding P3/nit cap. `--full` adds a medium conventions/maintainability reviewer and presents every qualifying severity with no minor cap. Demonstrated by controlled probes, no-inference installed dispatch, and live reviews of this repository's own pull requests #3, #4 and #5; #5 ran all three tiers on distinct models. A Claude-family medium model's fenced output is a recorded open defect. | Q4, C1; [Modes](SCOPE.md#review-modes-and-findings) |
| F5 | Completed | Structured output is demonstrated unusable on CLI 1.0.83: the factory surface is behind a CLI feature flag and reachable only from a joined foreground session, a joining extension cannot register the permission handler that confines reviewer reads, and a custom agent's declared `view`/`grep`/`glob` grant leaks `skill` and `sql`. Retry cost, `null` failure semantics and module reach measured below. Recommendation recorded: fall back to a narrow fence unwrap, with its cost stated and the choice left to the user. No reviewer was migrated. | M1, F3; [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F6 | Completed | Reviewer output survives a model that wraps it. Reviewers and the adjudicator are asked for the envelope between two explicit markers, and code unwraps that delimiter pair, then one fence that wraps the whole response; markers and fences count only when they are the whole line, so payload text is never a wrapper. Everything after the parse is unchanged, and a table below pins what is still discarded whole. Demonstrated by the full-mode review of pull request #7, which discarded four reviewers on a substring-counting defect it also reported; that defect is fixed and the captured outputs replayed. | F5; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| M2 | Completed | `--deep` runs one integrated heavy reviewer over the whole pull request and presents every substantiated severity; a second mode flag is refused. Demonstrated by the twelve controlled suites, the installed no-inference dispatch, and the live deep review of pull request #8, which reached completed coverage on 68.27393 credits and found two real defects in its own documentation. | F6, M1; [Modes](SCOPE.md#review-modes-and-findings) |
| C3 | Completed | A tier may carry one optional fallback assignment, used for one extra attempt for the one reviewer whose own execution failed. No timer, no whole-review restart, no silent substitution, and no cross-tier inheritance. Demonstrated by the twelve controlled suites, two installed no-inference probes, and the live balanced review of pull request #10, which cost 233.19659 credits, completed all six sessions and found one real documentation defect. No fallback attempt has run live. | C1, Q3; [Fallbacks/execution](SCOPE.md#models-configuration-and-execution) |
| C4 | Completed | A tier whose resolved model supports no configurable reasoning effort resolves to no effort instead of inheriting one, so such a model can serve a tier; the same rule covers a tier's fallback model. An explicit effort is still validated and never silently lowered, and a capable model still inherits and is still refused. Demonstrated by the twelve controlled suites, two installed no-inference probes, and the live full review of pull request #11, which cost 269.135657 credits, reported incomplete coverage on three execution failures, and found one real defect in this increment's own display. | C1; [Configuration](SCOPE.md#models-configuration-and-execution) |
| Q5 | Completed | A candidate anchored on a changed line carries an optional `breaks` citation for the code that change breaks, which may be unchanged, in another hunk, or in another changed file, and which passes the same bound, in-window, exact-quote checks as every other citation. A supplied introduction citation still belongs to the location's own hunk; a null one is now a claim the adjudicator tests. Demonstrated by the twelve controlled suites, the reconstructed rejections from pull requests #4, #5 and #10, and the live balanced review of pull request #12, which cost 137.274102 credits, saw a reviewer use the new citation, and found one real defect in this increment's adjudicator contract. | Q4; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| Q6 | Completed | Candidate-only clipped-end quote repair restores exact bound source without dropping a named line. Controlled reconstructions of #11 and #12 reach adjudication; #4's inserted-space fabrication stays refused. PR #13's installed balanced review cost 134.753239 credits and was incomplete: contracts returned no usable output and correctness reported a coverage gap. The repair was first observed live on pull request #18, where it restored two clipped citations on one candidate and let it reach adjudication. Exact adjudicator/publication checks and both schema versions are unchanged. | Q5; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| C5 | Completed | A completed reviewer whose output the evidence boundary discards becomes eligible for its tier's one fallback attempt, as an empty response already is. Demonstrated by the controlled suites and the installed balanced review of pull request #14, which cost 110.736851 credits across five completed reviewers with no denial. No tier had a fallback configured there, so the demotion path itself rested on scripted output until pull request #18, where the adjudicator's unparseable output produced the eligible failure live and had no fallback to take. | C3, Q4; [Fallbacks/execution](SCOPE.md#models-configuration-and-execution) |
| V1 | Completed | `--verify` enforces matching branch/SHA/cleanliness before reviewers and presents discovered existing commands for approval. `V1a` added the preflight, `V1b` discovery and presentation from the project's own instruction files, `V1c` per-command approval that records the answer, executes nothing and outlives no run. Demonstrated by the thirteen controlled suites and pull request #18's balanced `--verify` review, which cost 166.859549 credits, found two real defects and produced the first live discovery evidence. **That pass found no command in this repository**, so the interactive approval path is demonstrated only by the controlled suites. Execution is `V2`. | Q1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| V2a | Completed | Execute only approved existing safeguards with installed dependencies, in the current checkout, and show evidence and artifacts without autofix or checkout manipulation. Carries the exclusions and the citation check that `V1c` deferred to `V2`. Demonstrated by the thirteen controlled suites and pull request #19's interactive balanced `--verify` review, which cost 252.771985 credits, reached the host's real approval UI for the first time and saw the citation gate refuse a constructed command live. **That run approved nothing, so execution itself is still demonstrated only by the controlled suites.** It found one validated defect and two more that its own evidence gate discarded; two of the three are fixed here. | V1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| V2b | Completed | Settled without code: safeguard output reaches no reviewer, the retained record says nothing about what ran, and the citation gate keeps accepting a prefix as a documented limitation. All three were answered "no change", so `V2` closes with `V2a`'s behaviour and the thirteen suites unchanged. The prompt's "verified to be at" wording is a recorded wording defect that bound citations already contain; it goes to `D1`. | V2a; [Safeguards](SCOPE.md#optional-project-safeguards) |
| A1 | Pending | Archive the completed roadmap entries into a dated file, leaving a short live `ROADMAP.md` that safeguard discovery can actually read. Mechanical and documentation-only; the increments table, the exact-next-increment section and the most recent entries stay here. | V2b; housekeeping, no scope clause |
| D1 | Pending | Document configuration, modes, incomplete coverage, cancellation, publication, cache, and safeguards with reproducible end-to-end examples. Also fixes the reviewer prompt's "verified to be at" wording, which makes it a behaviour change needing one installed-plugin review; run that review with `--verify` and approve the safeguards suite. | A1, L1; [Release boundary](SCOPE.md#priority-and-release-boundary) |

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

## Completed increment: C1

Implementation: new `extensions/pr-review/config.mjs`, a second registered
command in `extension.mjs`, tier resolution in `quick.mjs`, and the effective
posting setting threaded through `retained-run.mjs` into the existing
`finishPreview` parameter. Exercises: `scripts/smoke-config.mjs` and
`scripts/smoke-config-runtime.mjs`. No upstream source was copied; only the
upstream README's documented configuration workflow was consulted.

### Configuration boundary

- One plugin extension now registers two slash commands. `/pr-review-config`
  accepts `show` (also the empty argument), `key=value` assignments, `unset KEY`
  and `help`. There is no interactive menu and no finding editor.
- Keys are `lightModel`, `lightEffort`, `mediumModel`, `mediumEffort`,
  `heavyModel`, `heavyEffort` and `autoPostReviews`. They carry the port's
  existing invocation-setting spelling rather than upstream's `light` /
  `heavy_thinking` field names; upstream's other fields are not ported.
  `autoPostReviews` accepts only `true` or `false` and defaults to false.
- Unknown keys, malformed arguments, empty values and unsupported models or
  efforts are explicit errors. Assignments in one invocation apply together or
  not at all, and a refused command leaves the stored file byte-identical.
- Every explicit value is validated against the session's actual model list and
  each model's advertised reasoning efforts, reusing the existing
  `validateModelAssignment`. An invalid explicit model or effort is refused;
  nothing is substituted and no effort is lowered. Validation covers the
  configuration that results from the change, so a value that only becomes
  unusable through inheritance is refused too. A tier resolved entirely from the
  ambient session is not validated at update time, because it carries no
  explicit setting; the review path still validates it.
- An unset tier field takes the nearest configured tier, preferring the heavier
  tier when two are equidistant, and otherwise the ambient session model or
  reasoning effort. Model and effort resolve independently, preserving the
  recorded Q3 behavior. Quick review still uses the heavy tier only.
- `show` reports the file location, stored settings, ambient assignment, all
  three effective tier assignments with the origin of each value, and the
  effective `autoPostReviews`. A quick invocation logs the same report, with its
  flags applied, before any reviewer starts.
- Invocation flags win for that invocation only and never rewrite the file.
  `heavyModel=`/`heavyEffort=` override saved tiers; `--comment` / `--no-comment`
  override `autoPostReviews` and still conflict with each other. An effective
  `autoPostReviews=true` produces the existing `config-authorized` status, so
  `--all` can publish unattended without a confirmation UI.
- Personal configuration lives at `<copilot-config-home>/pr-review/config.json`,
  derived from the session workspace the CLI itself reported, which is a
  `session-state` sibling. The store refuses a remote session, a missing or
  wrongly shaped workspace, a symlinked file, and a location inside the session
  working directory. Records are `{"schemaVersion": 1, "settings": {...}}`,
  written through a temporary file, `fsync` and rename with mode `0600`.
- Malformed JSON, an unsupported schema version, an unknown stored key or a
  wrongly typed stored value is an explicit error that refuses both inspection
  and review. Nothing is repaired, migrated or silently ignored.
- **No repository-provided configuration is read.** A repository cannot
  authorize itself, and explicitly trusted project overrides remain C2.
- Configuration inspection and updates issue only `metadata.snapshot`,
  `model.getCurrent` and `model.list`. They start no inference, make no GitHub
  request, run no review work, and are refused while a review or publication
  holds the session's active-work slot.

### Controlled evidence

`scripts/smoke-config.mjs` passes with no runtime, no network and no inference.
It covers argument parsing and every rejected argument shape; stored-record
schema validation including malformed JSON, an incompatible version, unknown
keys and wrongly typed values; the atomic `0600` write with no surviving
temporary file; unsafe symlinked files; remote, missing and misshaped workspaces;
and a configuration directory inside the working directory.

Resolution is exercised directly: configured, inherited, ambient and unset
sources; nearest-tier preference over a farther tier; the equidistant tie
resolving to the heavier tier; independent model and effort inheritance; and
flag precedence. Refusal cases cover a missing, disabled, compound or `auto`
model, an unsupported effort, an inherited effort the configured model cannot
support, and an `unset` that would leave an explicit model unusable.

The probe then drives the real code paths: `quickAssignments` takes its heavy
assignment from a stored light tier, an invocation flag overrides it without
rewriting the file, and an unusable stored assignment rejects with
`No substitution`. A full `executeRetainedQuick` run against the skipped draft
fixture records `preview.policy.autoPostReviews` for both `true` and `false`,
proving the effective setting reaches the retained posting policy. The client
double fails the probe if any reviewer runtime starts. `smoke-quick`,
`smoke-preview`, `smoke-retention`, `smoke-publication`, `smoke-publish-later`,
`smoke-selection`, `smoke-findings`, `smoke-context`, `smoke-target` and
`smoke-fixture` still pass unchanged.

### Installed-plugin evidence

On 2026-09-07, CLI 1.0.83 with its bundled SDK, Node.js 26.1.0, macOS arm64,
`scripts/smoke-config-runtime.mjs` passed against the **installed** plugin with
the child-only controlled `gh` fixture. The probe spends no Copilot credits: the
`gpt-5.6-terra` / `high` pair it passes is session configuration that gives the
session an ambient assignment, and no prompt is ever sent. Every command was
asserted to produce no `user.message`, `assistant.*`, `subagent.*` or
`tool.execution_start` event, and each `/pr-review-config` command was asserted
to leave the descendant process list unchanged.

- `rpc.commands.list()` reported both `pr-review` and `pr-review-config`, so one
  extension really registers two slash commands on this runtime.
- The derived location was `~/.copilot/pr-review/config.json`, the sibling of the
  CLI's own `session-state` directory holding the reported workspace. No such
  file existed before the run; the probe snapshots and restores it, and removes
  the directory it created.
- `show` before any write reported `not created yet` and the ambient
  `gpt-5.6-terra` / `high` assignment for the heavy tier, and created nothing.
- Native refusals that wrote nothing: unknown key, missing `=`, empty value,
  a non-boolean `autoPostReviews`, an unavailable model, and an unsupported
  reasoning effort, plus `unset` with no key and `show` with an extra argument.
- After `lightModel=gpt-5.6-terra lightEffort=<other> autoPostReviews=true`, the
  on-disk record was exactly the version-1 schema. Reloading the extension and
  running `show` again reported the heavy tier as `inherited:light`, so the
  reloaded process read the stored file rather than run memory.
- A real `/pr-review 2 --quick --no-comment` invocation logged
  `Effective PR review configuration for this invocation.` with the heavy tier
  resolved from the stored light tier and `autoPostReviews: true [configured]`.
  PR 2 is the fixture draft, so it is skipped and no reviewer starts.
  Repeating with `heavyEffort=<ambient>` reported `[flag]` and left the stored
  file unchanged.
- A stored unavailable model made the same quick invocation fail with
  `Unavailable or disabled Copilot-subscription model`, rather than substituting
  one. Invalid JSON and schema version 99 refused both the review and `show`,
  and the refused update did not rewrite the file.
- With a closed fixture PR whose confirmation was deliberately left unanswered,
  a quick review held the session's active-work slot. Both `show` and an update
  were refused with `A review is already running in this session`, and the
  update wrote nothing. After declining the confirmation and letting the run
  settle, configuration worked again.
- The recorded `gh` request trace was byte-identical across the initial
  inspection, every refusal, and the update-plus-reload sequence, so inspection
  and updates make no GitHub request. Later assertions run beside real capture
  requests, so only that configuration-only span is compared. The decoy
  checkout, its dirty reviewed path and its branch were unchanged.

`scripts/smoke-runtime.mjs`, `scripts/smoke-runtime.mjs --targets` and
`scripts/smoke-retention-runtime.mjs` also passed after the change, without
inference.

### APIs, reproduction and remaining limits

No new runtime API was adopted. The command surface, `rpc.metadata.snapshot`,
`rpc.model.getCurrent` and `rpc.model.list` were already in use; the installed
SDK's `extension.d.ts` `JoinSessionConfig` was consulted for the second command
entry, and the upstream configuration README at the pinned revision was read for
the documented `show` / `key=value` workflow and inheritance wording. The CLI
resolves its configuration home as `configDir ?? COPILOT_HOME ?? ~/.copilot`, so
the store derives it from the reported workspace instead of re-deriving it from
the environment.

```sh
node scripts/smoke-config.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-config-runtime.mjs
```

Remaining limits:

- A configuration-authorized publication was **not** re-exercised natively. The
  effective `autoPostReviews` is proven to reach the retained posting policy by
  the controlled retained run, and `config-authorized` is proven by
  `smoke-preview.mjs`, but no native run has published under it. Doing so needs
  a real inference review; `smoke-publication-runtime.mjs --cases=comment`
  covers the flag-authorized native write.
- Only the heavy tier is consumed today, because quick is the only implemented
  mode. The light and medium tiers are stored, resolved and displayed, but no
  reviewer uses them until M1.
- Validation binds to the models this session reports. A configuration saved
  while one ambient model is selected can become unusable under another; `show`
  marks the tier `UNUSABLE` and the review refuses rather than substituting.
- The store has no cross-process lock. Two sessions writing at once still leave
  a complete file thanks to the rename, but the last writer wins.
- No fallback models, additional modes, safeguards, project trust or interactive
  menu are included. `--verify` remains unimplemented.

## Completed increment: C2

Implementation: new `extensions/pr-review/project.mjs` for the trusted-project
boundary, layered resolution and the trust store in `config.mjs`, effective
settings in `quick.mjs`, and the pre-execution report moved ahead of assignment
resolution in `extension.mjs`. Exercises: `scripts/smoke-config.mjs` and
`scripts/smoke-config-runtime.mjs`, both extended. No upstream source was copied.

### Trusted-project boundary

- A repository may carry `.copilot/pr-review/config.json`, a record of the same
  shape as the personal file, `{"schemaVersion": 1, "settings": {...}}`, with the
  same configuration keys as the personal store and no others: the seven of `C2`,
  and the six optional fallback keys `C3` added. Its own schema version is
  tracked separately from the personal record's.
- It is read **only** when the personal store holds an explicit trust record for
  that exact working directory. Without one the file is located but never parsed,
  never merged, and reported as ignored by `/pr-review-config show` and by the
  pre-execution report of every review. An untrusted file that is malformed
  therefore cannot even fail a review.
- Trust is granted only by `/pr-review-config trust` and revoked by
  `/pr-review-config untrust [ABSOLUTE_PATH]`. Records live in
  `<copilot-config-home>/pr-review/trusted-projects.json`, a second personal file
  with its own `{"schemaVersion": 1, "trustedProjects": [...]}` record, written
  through the same temporary-file, `fsync` and rename path with mode `0600`.
- **The binding is the canonical absolute path of the session working directory.**
  It proves the user explicitly trusted that exact directory on this machine. It
  does **not** prove which repository, remote, branch or file content is there
  now: a different checkout later placed at the same path inherits the trust, and
  moving or renaming the directory silently drops it. `realpathSync` resolves the
  path at both grant and use time, so one directory is never two trust decisions.
  A repository cannot forge this identity, because its own contents cannot choose
  where it is checked out.
- Nothing inside a repository can grant, widen or refresh trust. Trust is a
  separate top-level file, never part of `settings`, so a project file carrying a
  `trustedProjects` key or an extra top-level field is a validation error rather
  than a trust grant.
- Precedence is per key: invocation flags, then a trusted project's settings,
  then personal settings, then the ambient session assignment. Tier inheritance
  runs over the merged result, and the origin travels with the value:
  `flag`, `project:heavy`, `project-inherited:light`, `configured:heavy`,
  `inherited:light`, `ambient`, `unset`, and since `C4` `model`, for a tier whose
  resolved model supports no configurable reasoning effort. `autoPostReviews`
  reports `[project]`, `[configured]` or `[default]`.
- An invocation rewrites no saved file: not the personal settings, not the trust
  record, and never the project file, which is only ever read.
- A trusted project file that is malformed JSON, carries an unsupported schema
  version, an unknown key or a wrongly typed value is an explicit error that
  merges nothing and refuses both the review and any personal configuration
  update. `show` still renders the error so it is diagnosable, and `untrust`
  still works, so a repository cannot lock the user out of revoking its trust.
  This is a deliberate difference from the personal file, whose failure also
  refuses inspection: a broken personal file hides the settings themselves.
- Unavailable or disabled models and unsupported reasoning efforts are refused
  the same way and never substituted or lowered. Granting trust is itself refused
  when the file it would activate is broken or unusable, and records nothing.
- `autoPostReviews` stays overridable by a trusted project, as `SCOPE.md`
  records, so trusting a repository lets its file authorize an unattended `--all`
  publication. That consequence is stated in the trust command's own output, in
  `/pr-review-config help`, and in the README.
- A project file cannot enable safeguards or bypass a publication gate: the key
  set is closed, `--verify` is still unimplemented, and publication re-runs every
  head, lifecycle and anchor check regardless of configuration.
- Path handling refuses a symlinked component anywhere under the project path, a
  non-regular file, and a file larger than 64 KiB, without following a link out
  of the checkout.
- Configuration commands still issue only `metadata.snapshot`,
  `model.getCurrent` and `model.list`, start no inference, make no GitHub request
  and stay refused while a review or publication holds the active-work slot.

### Controlled evidence

`scripts/smoke-config.mjs` passes with no runtime, no network and no inference.
Beyond the C1 coverage it now proves: the trust-record schema and every rejected
shape; the atomic `0600` trust file; safe project-file location including a
symlinked component, a non-regular file and an oversize file; an untrusted file
ignored and never parsed for six different contents, including two that try to
record their own trust; explicit trust recording the canonical path; a trusted
file overriding a personal tier and shadowing reported by name; invocation flags
still winning; revocation restoring the personal assignment; every malformed,
unknown-key and unusable trusted file refusing and changing nothing; revocation
remaining available while the trusted file is unreadable; trust refused when it
would activate a broken or unusable file; and per-key layering with origins
preserved through tier inheritance.

Two full `executeRetainedQuick` runs against the skipped draft fixture record
`preview.policy.autoPostReviews` taken from the trusted project rather than the
opposite personal value, and assert the personal file, the trust record and the
project file are all byte-identical afterwards. The client double fails the probe
if any reviewer runtime starts.

`smoke-quick`, `smoke-preview`, `smoke-retention`, `smoke-publication`,
`smoke-publish-later`, `smoke-selection`, `smoke-findings`, `smoke-context`,
`smoke-target` and `smoke-fixture` still pass unchanged.

### Installed-plugin evidence

On 2026-09-07, CLI 1.0.83 with its bundled SDK, Node.js 26.1.0, macOS arm64,
`scripts/smoke-config-runtime.mjs` passed against the **installed** plugin,
spending no Copilot credits: the `gpt-5.6-terra` / `high` pair it passes is
session configuration and no prompt is ever sent. Every command was asserted to
produce no `user.message`, `assistant.*`, `subagent.*` or `tool.execution_start`
event, and each `/pr-review-config` command to leave the descendant process list
unchanged. The session now runs in the disposable fixture checkout, so the
project file never touches this repository.

- The trust record was written to `~/.copilot/pr-review/trusted-projects.json`
  holding exactly the canonical fixture checkout path. No such file existed
  before the run; the probe snapshots and restores both personal files and
  removes the directory it created. Nothing remained afterwards.
- Before trust, `show` reported `Project trust: NOT TRUSTED` and
  `Project configuration: IGNORED` for the real file, kept the heavy tier at
  `[configured:heavy]`, and reported `autoPostReviews: false [default]`.
- A project file declaring its own `trustedProjects`, and one putting
  `trustedProjects` inside `settings`, both left no trust record, and a real
  quick invocation still ran with the file reported as ignored, proving an
  untrusted file is never parsed.
- After `/pr-review-config trust` and an extension reload, `show` reported
  `TRUSTED`, the heavy tier as `reasoning=<ambient> [project:heavy]`,
  `autoPostReviews: true [project]`, and `overriding personal heavyEffort`, so
  the reloaded process read the stored trust and project file rather than run
  memory.
- A real `/pr-review 2 --quick --no-comment` invocation logged the effective
  configuration with `[project:heavy]` and `autoPostReviews: true [project]`.
  Repeating with `heavyEffort=` reported `[flag]`. Neither rewrote the personal
  file, the trust record or the project file.
- With trust in place, a project file that was invalid JSON, version 99, carried
  an extra top-level `trustedProjects`, put `trustedProjects` or `verify` inside
  `settings`, or named an unavailable model, each refused both the quick review
  and a personal update, leaving the personal file and trust record unchanged.
- `/pr-review-config untrust` emptied the trust list, and `show` reported the
  file as ignored again with the personal `[configured:heavy]` assignment and
  `autoPostReviews: false [default]` restored.
- The recorded `gh` request trace was byte-identical across the trust, reload and
  inspection span, and again across the refusal and revocation span, so trust,
  revocation, inspection and refused reviews make no GitHub request. The decoy
  checkout, its dirty reviewed path and its branch were unchanged.

`scripts/smoke-runtime.mjs`, `scripts/smoke-runtime.mjs --targets` and
`scripts/smoke-retention-runtime.mjs` also passed after the change, without
inference.

### APIs, reproduction and remaining limits

No new runtime API was adopted; the trusted-project boundary is plain filesystem
access plus the `metadata.snapshot` working directory already in use. The
installed SDK's experimental `rpc.permissions.folderTrust.isTrusted` /
`addTrusted` and the `enableConfigDiscovery` / added-root documentation in
`generated/rpc.d.ts` were consulted. The CLI's folder trust was deliberately
**not** reused as the authorization: it is granted for ordinary CLI use in a
folder, so reusing it would let a folder trusted for another purpose silently
change review models and posting authority, and `SCOPE.md` requires an explicit
command. Requiring it in addition was also rejected, because arming it in a probe
would write to the user's real global trust list.

```sh
node scripts/smoke-config.mjs
node scripts/smoke-quick.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-config-runtime.mjs
```

Remaining limits:

- The trust binding proves a directory, not a repository. A different checkout
  placed at a trusted path inherits the trust; a moved or renamed directory
  silently loses it. Binding to the GitHub repository identity was rejected
  because obtaining it needs a `gh` request, which configuration commands must
  not make, and because it would be verified only after the effective
  configuration is displayed.
- Trust is exact-path, never a prefix: a session whose working directory is a
  subdirectory of a trusted repository reads no project file. That is
  fail-closed, and it also prevents a symlink inside a trusted subtree from
  reaching content outside it.
- A configuration-authorized publication has still **not** been exercised
  natively, whether the authority is personal or project-supplied, because it
  needs a real inference review. `smoke-preview.mjs` proves the
  `config-authorized` status and the controlled retained runs prove the effective
  setting reaches the retained posting policy.
- Only the heavy tier is consumed until M1; light and medium are stored,
  resolved and displayed only.
- Validation binds to the models the current session reports, so a saved or
  project-supplied assignment can become unusable under a different ambient
  model; `show` marks it `UNUSABLE` and the review refuses.
- Neither personal file has a cross-process lock. Two sessions writing at once
  still leave a complete file thanks to the rename, but the last writer wins.
- No fallback models, additional modes, safeguards or interactive menu are
  included. `--verify` remains unimplemented.

## Manual-test blocker: CLI discovery without a harness override

On 2026-09-07 the user paused M1 to report that an ordinary interactive
`copilot --experimental --yolo` session failed on
`/pr-review 727 --quick --no-comment --all`, before any review work:
the bundled SDK could not resolve `@github/copilot-darwin-arm64`.
This was not a project-trust or model-assignment rejection.

The clean starting checkpoint was `0a32e77` on local `main`, after C2 at
`56ace3f`. The previous handoff's ahead-of-origin and absent-personal-config
claims were stale; do not assume them. No product increment was added.

Root cause: `startRun` constructed `CopilotClient` with
`RuntimeConnection.forStdio()` and no path. The installed SDK resolves a
platform npm package in that case; this host's bundled SDK cannot resolve one.
Every prior native harness exported `COPILOT_CLI_PATH`, which the SDK inherited,
so successful harness runs had hidden the ordinary-shell failure.

`cli-runtime.mjs` now resolves an explicit `COPILOT_CLI_PATH` first, otherwise
the installed executable in an absolute PATH directory, and passes that path
to the existing stdio connection. Unusable explicit overrides fail without
substitution; empty/relative PATH entries are not searched. No SDK dependency,
model fallback, installation mutation by the plugin, inference timeout or
publication-policy change was introduced. Both fixtures and quick reviews use
the same corrected `startRun`; publish-later still constructs no SDK client.

### Evidence and reproduction

Consulted the installed CLI 1.0.83 SDK's `docs/extensions.md`,
`types.d.ts` child-process connection definition and `index.js` constructor /
runtime startup implementation, together with current official
[bundled CLI](https://github.com/github/copilot-sdk/blob/main/docs/setup/bundled-cli.md)
and [local CLI](https://github.com/github/copilot-sdk/blob/main/docs/setup/local-cli.md)
documentation. The public local-CLI example uses `cliPath`; this installed
SDK exposes `RuntimeConnection.forStdio({ path })`, which was already in use
by our launchers and is now demonstrated here.

- With `COPILOT_CLI_PATH` unset, constructing the original SDK client reproduced
  the user's exact platform-package error.
- The new `smoke-runtime.mjs --targets --startup` regression failed against the
  previously installed plugin with the same error on actual quick dispatch.
  After reinstalling the fix, the identical command passed.
- The harness strips the launcher override from the parent's environment, so
  the extension no longer inherits it. A real installed-plugin
  `--quick --no-comment --all` invocation settles at the controlled draft skip.
  Separately, the same resolver and stdio connection start, ping and stop an
  actual CLI runtime without a prompt. Parent events contain no model turns,
  subagents or tool executions; the fixture GH requests are read-only.
- `smoke-cli-runtime.mjs` covers missing PATH entries, spaces, executable
  symlinks, explicit-path precedence/refusal, non-executable files,
  empty/relative PATH rejection and a readable explicit JS entrypoint.
  `smoke-quick.mjs` also passed unchanged.
- The corrected plugin is installed locally. Personal configuration/trust
  files were not written; the private PR was not fetched or reviewed, and no
  inference or GitHub publication was performed.

```sh
node scripts/smoke-cli-runtime.mjs
node scripts/smoke-quick.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
```

Remaining limits: native evidence is macOS arm64 / CLI 1.0.83, not Windows or
other installation layouts. PATH selects the installed executable; matching
its version to the hosting SDK remains the installer's responsibility. The
user's full private-PR review had not yet been retried at this checkpoint; this
startup regression does not claim successful end-to-end inference on that PR.
Earlier publication, retention, configuration and runtime caveats remain.

## Manual feedback: coverage classification and presentation

After startup checkpoint `ff78dcb`, the user reran the quick review and supplied
the session ID for read-only inspection. The saved events and retained result
showed all three reviewers completed with no execution errors, cancellation or
cleanup errors. There were no candidates or validated findings, and no
publication was attempted. The result settled with `executionComplete: true`
but `reviewComplete: false` and `coverage: incomplete`.

The coverage label came from the reviewers' general caveats about external
component implementations and behavior not present in their supplied evidence.
In `findings.mjs`, every output `limitations` entry becomes an issue, and any
issue makes the validation result incomplete. This conflates informational
caveats with substantive coverage gaps and failed execution.

This did not demonstrate a missing executable or a failed attempt to run one.
`read-only.mjs` gives reviewers no tools and denies execution; `quick.mjs`
supplies captured revision-bound context and prohibits independent local reads
or commands. `--verify` is not implemented and does not explain this boundary.
The user reports that `gh-aw` should be accessible, at least via mise; neither
its availability nor useful/safe invocation was established during inspection.

The user agreed to prioritize the classification/presentation fix, followed by
more manual testing to surface feedback before returning to M1.
Read-only investigation tools are a separate deferred discussion. The user is
interested in allowing them, but exact tools, revision binding, permission
boundaries and acceptance criteria remain undecided. Do not interpret this as
approval for shell access, automatic mise/gh-aw execution, or implementation
of investigation tools in the classification fix. Read-only investigation and
approved safeguard execution are distinct capabilities.

## Completed manual-feedback fix: coverage classification and presentation

Implemented from clean priority checkpoint `cbe633c`, after startup fix
`ff78dcb`, on 2026-09-07. This completes the classification increment, not M1.

### Classification and compatibility boundary

- Reviewer and adjudicator prompts now request output schema version 2.
  `limitations` entries have explicit `kind`, `reason`, and `impact` fields.
  A `coverage-gap` requires a nonempty explanation of the consequential
  assessment blocked; a `caveat` requires null impact. Generic unaudited
  dependency boundaries do not by themselves block completion. Unknown
  categories, malformed entries and unusable output fail closed.
- `findings.mjs` produces categorized diagnostics and derives the existing
  blocking `issues` array only from execution failures and coverage gaps.
  Invalid candidates/decisions remain visible output failures; uncertain
  adjudication and code-detected unavailable changed content remain gaps.
  Successful peer findings survive both kinds of incomplete coverage.
  Runtime crashes, cancellation and cleanup errors remain incomplete even
  when the validated portion contains only caveats.
- `coverage.mjs` provides shared descriptions for final findings, retained
  inspection, selection/confirmation and new COMMENT proposals/publish-later
  descriptions. It retains reasons and blocked-assessment impact, distinguishes
  failure/gap/caveat counts, and does not turn zero findings into a clean-PR
  claim. Failures before validation also receive a classified summary.
- Retained validation gains optional `diagnostics`, strictly checked against
  the blocking `issues` and completion flag. Publication/authority schema
  versions 1-4 keep their existing meanings; no migration is required.
  Version-1 model limitation strings and old unclassified retained issues stay
  conservatively incomplete, without keyword-based reinterpretation. Old
  results with no issues are not newly made incomplete.
- Legacy records without diagnostics reconstruct their exact original
  proposal text. Reading them neither adds categories nor changes historical
  authority. New classified proposals retain their exact text through reload
  and publish-later. COMMENT-only events, canonical selection, explicit
  authorization, evidence/head/lifecycle gates, write-ahead uncertainty and
  no-blind-retry behavior remain unchanged.

### Evidence and reproduction

The existing synthetic suites were extended; no private review payload was
read or copied, no private review was rerun, and no live GitHub write occurred.

```sh
for script in smoke-findings smoke-quick smoke-selection smoke-retention \
  smoke-preview smoke-publication smoke-publish-later; do
  node "scripts/$script.mjs" || exit
done
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
```

All seven controlled suites passed. Cases include zero-finding caveat-only
completion, consequential gaps with an impact explanation, reviewer/validator
failures and malformed categories/output, cancellation, cleanup failure,
uncertain adjudication despite a caveat, mixed results retaining useful
findings, and binary changed content remaining uncovered despite caveats.
Retention cases cover classified round trips, mixed inspection, unchanged old
uncertainty and rejection of inconsistent diagnostic/issue records.
Publication cases cover exact classified and legacy payload reconstruction,
gated incomplete publish-later, preserved version-4 authority and repeat-write
refusal, plus the existing selection/authorization/anchor/head/lifecycle and
uncertain-write cases. All writes in these tests use synthetic `gh` functions.

The updated plugin was installed successfully. Native no-inference retention
session `5a83028a-bb3e-4c21-af68-0b612ae917cf` inspected a synthetic caveat-bearing
result as completed, retained its caveat and finding across extension reload,
and preserved isolation and schema/interruption errors without `gh` calls or
checkout changes. This seed is retention/presentation evidence, not model
classification evidence. Command-only cold resume remained unsupported;
the retained file survived unchanged. The native startup/target probe also
passed without an extension-side `COPILOT_CLI_PATH`, model turns, subagents or
tool executions. Runtime cleanup completed.

### Remaining limitations

- Schema validation enforces explicit categories and required impact text, not
  the truth of a model's categorization. No inference was spent on the new
  prompts; ordinary model adherence and classification quality need manual
  feedback. Existing fallible semantic adjudication/context limits still apply.
- Reviewers still have no tools and cannot independently investigate beyond
  supplied revision-bound context. Read-only investigation, shell access,
  mise/gh-aw, safeguards/`--verify`, balanced/full/deep, fallbacks and timeouts
  were not implemented. No runtime API was added or changed.
- Personal configuration and project trust were not changed. The probes do
  not run `smoke-config-runtime.mjs` or require an empty personal store.
- Native evidence remains macOS arm64 / CLI 1.0.83 / Node 26.1.0, not other
  platforms. Direct local plugin install still warns about deprecation.
  Command-only cold resume, cross-process storage locking, non-atomic final
  GET/POST, live anchor coverage and configuration-authorized live publication
  limitations recorded above remain.

## Completed manual-feedback fix: consolidate equivalent coverage gaps

Implemented from clean checkpoint `3079726` on 2026-09-07 after read-only
inspection of user-selected session `138018d8-296b-4c65-9199-ec9d44c6d13a`.
That quick run against private `primait/starsky#8126` completed all three
specialists without execution failures, produced no candidates, and returned
three substantively equivalent coverage gaps: the supplied manifest/lockfile
context could not establish whether removing direct `lapin` dependencies still
left source, macro, feature-gated or build-time uses. This was correctly
incomplete rather than a clean-review claim, but the repeated presentation was
unclear. No private diff or source payload was copied into repository fixtures.

`coverage.mjs` now conservatively consolidates presentation-only coverage gaps
when their structured reviewer messages share a quoted code identifier and
have strongly overlapping blocked-assessment vocabulary. The displayed gap
names all reporters, shows one representative reason/impact, reports both the
consolidated count and raw report count, and states that full diagnostics remain
retained. Raw validation diagnostics, blocking `issues`, completion semantics,
selection, retention, publication payload identity and authorization are
unchanged. Gaps without structured reporter/impact text remain explicit, as do
same-identifier gaps whose blocked assessments are substantively different.

Synthetic regression coverage models the three dependency-removal reports and
a distinct same-identifier security assessment. It proves three equivalent raw
diagnostics become one displayed gap with all reporters, while the distinct gap
and unstructured code-owned gaps remain separate. The seven existing classified
presentation suites passed:

```sh
for script in smoke-findings smoke-quick smoke-selection smoke-retention \
  smoke-preview smoke-publication smoke-publish-later; do
  node "scripts/$script.mjs" || exit
done
```

The plugin was reinstalled successfully. Native no-inference retention and
startup/target probes passed with CLI 1.0.83 / bundled SDK / Node.js 26.1.0 on
macOS arm64:

```sh
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
```

The runtime evidence is synthetic/no-inference and does not prove how actual
model wording will cluster. Consolidation is deliberately conservative: it can
leave paraphrases separate, and lexical overlap around a shared quoted
identifier is not formal semantic equivalence. It never changes completeness
or removes the retained source diagnostics. Existing runtime, configuration,
publication and context limitations remain.

## Manual-feedback finding: consolidation did not fire on real reviewer wording

On 2026-09-07 the user ran `/pr-review 8126 --quick --no-comment --all` against
private `primait/starsky#8126` in session `281d7f76-1f51-4b0c-9aaf-eb02a6e16c3f`
with the reinstalled plugin. Read-only inspection of the retained result and
event log confirmed the pipeline works and confirmed the previous checkpoint's
recorded uncertainty was justified.

Working as intended: capture bound the repository, head `06155b5e`, base
`0547cc5c`, four changed paths and both content hashes; all three specialists
ran on `gpt-5.6-terra` at high effort, completed in about four to five seconds
with zero permission or tool denials and valid schema-v2 output; coverage was
classified `incomplete` with zero execution failures, three coverage gaps and
zero caveats; every surface repeated that this was not a clean-review claim;
`--all` over zero findings produced selection `empty`; `--no-comment` held and
no write was attempted.

Not working: the `4477e2e` presentation consolidation **did not fire**. The
installed `coverage.mjs` was byte-identical to the repository copy, so the fix
was live. Replaying the three real gap messages through `presentationDiagnostics`
returns three separate gaps. Measured Dice overlap of the blocked-assessment
clauses is 0.323, 0.207 and 0.188, all below the 0.35 threshold; shared tokens
reduce to `lapin`, `import` and `compile`, plus `target` and `determined` for one
pair. Three reviewers paraphrase one shared missing fact three different ways,
and one names crates where another names mechanisms. Raising the threshold is
not a fix; the lexical premise is what fails.

Underlying cause, established by reading the implementation and the reviewer
prompt actually sent: reviewer input is the diff plus revision-bound context
windows for **changed files only**. `context.mjs` fetches the head side of each
changed file, the base side where lines were removed, and keeps hunk windows of
radius 40. The correctness reviewer's prompt was 62 KB containing 24 context
blocks, every one of them `Cargo.lock` or one of the three `Cargo.toml` files.
The decisive fact for a dependency removal — whether any crate source still
imports `lapin` — lives in unchanged files that are never fetched, and
`quickInstructions` plus `reviewerPolicy` forbid the reviewer from looking. The
three gaps were correct and unavoidable; zero findings was a context-supply
consequence, not a model failure. This generalizes: any PR whose risk lives in
unchanged callers or consumers is currently unreviewable.

The upstream prompt at the pinned commit `457e18e` does not work this way. It
instructs reviewers to "open surrounding files, callers, and convention files
whenever it improves the review or lets you confirm a finding", and runs its
correctness, security and performance passes with `tool_policy: configured`,
while keeping in-scope and never-disturb-the-working-tree guardrails. `SCOPE.md`
likewise already permits reading surrounding code to establish context and
confirm impact, and F3's requirement was enforceable **read-only** reviewer
permissions, not a zero-tool reviewer. The zero-tool policy is therefore
stricter than both upstream and this project's own scope; relaxing it to
read-only needs no scope change. Copilot's built-in reviewer was not inspected
and no claim is made about it.

The user directed that reviewers must not be limited in what they can read, and
chose the local checkout as the read source. Running tests or linters remains a
separate later increment.

## Completed increment: F4

Implementation: `scripts/smoke-reviewer-tools.mjs`, a capability probe only. No
extension module changed, no reviewer prompt changed, no review ran and no
inference was spent. The probe answers whether the runtime can grant a reviewer
read access at all, before any reviewer behavior is built on the assumption.

### Demonstrated outcome

On 2026-09-07 with Copilot CLI 1.0.83, its bundled SDK, Node.js 26.1.0 and
macOS arm64:

- The runtime's built-in catalog is exactly `bash`, `create`, `edit`, `glob`,
  `grep`, `list_agents`, `list_bash`, `read_agent`, `read_bash`, `sql`,
  `stop_bash`, `task`, `view`, `web_fetch`, `write_agent`. These are observed
  names, not names inferred from documentation.
- The current `reviewerPolicy` still offers zero tools, unchanged.
- `availableTools: new ToolSet().addBuiltIn(["view", "grep", "glob"])` yields
  exactly those three tools and nothing else.
- `bash`, `create`, `edit`, `task`, `sql`, `web_fetch` and `write_agent` are
  refused inside that session through the native pipeline as nonexistent tools,
  not merely omitted from a list.
- A granted `view` executed against a directory set with
  `metadata.setWorkingDirectory` and returned real file content.
- The permission handler receives `{ kind: "read", path }` and is the effective
  confinement point: approving only paths inside the reviewed root let the
  in-root read succeed while a read of an outside file returned `rejected` and
  leaked no content.
- The grant is per-session; a subsequently created zero-tool policy session
  still offered nothing.
- No `user.message` or `assistant.*` event was produced.

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-reviewer-tools.mjs
```

The seven controlled suites and `git diff --check` were rerun and passed. The
plugin was reinstalled at the start of the session; no extension file changed
afterwards, so no further reinstall was required.

### Latent defect found by the probe

The runtime accepts only `approve-once`, `approve-for-session`,
`approve-for-location`, `reject`, `user-not-available` and `approved` as
permission decisions, and it rejects `approved` at orchestration time with
`unexpected user permission response`. `read-only.mjs` currently returns
`{ kind: "denied-no-approval-rule" }`, which the runtime refuses as an unknown
variant. The probe demonstrates that a session using that value turns a read
into a transport failure rather than a clean denial. This is unreachable today
only because reviewers hold no tools and therefore never raise a permission
request. It must be corrected to `reject` as part of R1, before any tool is
granted. It was deliberately left unchanged here to keep this increment a probe.

### Remaining limitations

- Feasibility is demonstrated for a granted subset, confinement and refusal.
  Nothing yet proves that a reviewer *model* uses read tools well, stays in PR
  scope while reading, or produces better findings. That needs live inference.
- The probe reads a temporary directory, not a real checkout, and does not
  address revision identity. Reading a checkout parked on a different branch
  would produce evidence about code that is not the reviewed head, which is the
  precise failure `Q2` was built to prevent.
- Custom plugin-owned tools (`Tool<>` with a handler, session `tools`,
  `ToolSet().addCustom`) were read in the SDK but not exercised. Revision-bound
  reads served from the captured SHAs remain undemonstrated.
- No reviewer prompt, policy module, configuration, trust, selection, retention,
  publication or authorization behavior changed in this increment.

## Completed increment: R1, first half

Implementation: new `extensions/pr-review/checkout.mjs`; changes to
`read-only.mjs`, `fixture.mjs`, `quick.mjs`, `target.mjs` and `extension.mjs`;
new controlled probe `scripts/smoke-checkout.mjs`; harness changes in
`smoke-quick.mjs`, `smoke-fixture.mjs`, `smoke-reviewer-tools.mjs`,
`smoke-target.mjs` and `runtime-target.mjs`. No inference was spent, and no
review was published.

Quick reviewers now receive `view`, `grep` and `glob` confined to the local
checkout, but only after the run proves the checkout is exactly the reviewed
revision. The Q4 adjudicator keeps the zero-tool policy.

### Demonstrated outcome

On 2026-09-07 with Copilot CLI 1.0.83, its bundled SDK, Node.js 26.1.0 and
macOS arm64:

- The revision-identity gate refuses on four distinct conditions, each named in
  the message together with the fixing command: `not-a-git-checkout`,
  `local-head` (local `HEAD` differs from the captured PR head, including an
  unborn branch), `working-tree` (a tracked file is modified or staged) and
  `remote-head` (the PR head moved since capture). A clean matching checkout is
  accepted, the repository root is resolved from a nested working directory, and
  non-ignored untracked files warn without blocking. `scripts/smoke-checkout.mjs`
  proves all of this against real temporary git repositories; the gate runs
  `git` resolved from `PATH` with an absolute `cwd` and with `GIT_DIR`,
  `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_INDEX_FILE` and
  `GIT_CEILING_DIRECTORIES` stripped, and it only reads: no checkout, stash,
  clean, fetch or pull.
- `readingReviewerPolicy` offers exactly `builtin:view`, `builtin:grep` and
  `builtin:glob`; its pre-tool hook denies every other tool and returns
  `undefined` for the three read tools so the permission handler stays the
  confinement point. The handler resolves real paths and approves only
  `kind: "read"` inside the verified root.
- Against the installed runtime, `scripts/smoke-reviewer-tools.mjs` now
  exercises the *shipped* policy rather than an ad-hoc copy: the plain
  `builtin:<name>` filter strings it ships are identical to
  `new ToolSet().addBuiltIn([...]).toArray()`; an in-root read succeeds; a read
  outside the root is rejected and leaks no content; write and exec tools are
  refused natively in a hook-less session and denied by the hook in the policy
  session; and the grant does not leak into a later zero-tool session.
- The latent F4 defect is fixed: `reject` denies cleanly where the unknown
  `denied-no-approval-rule` variant turned a read into a transport failure. Both
  behaviors are asserted side by side in the same probe.
- `executeQuickRun` runs the gate after capture and before `startRuntime()`. A
  refused run logs the failing condition, emits
  `coverage: "not-started"`, `disposition: "refused"`, `reviewers: []`,
  `complete: false`, and starts no reviewer session and no owned runtime.
- The installed plugin demonstrates the refusal end to end with no inference:
  `smoke-runtime.mjs --targets --startup` dispatches
  `/pr-review 1 --quick --no-comment --all` from a checkout parked on an
  unrelated branch and asserts the refusal message, zero reviewer messages, an
  unchanged descendant process set, and an unchanged checkout state.
- `quickInstructions` now permits reading surrounding files, callers and tests
  while keeping the in-scope rule (only defects introduced by this diff, no
  repository-wide audit, no writes), and the prompt states the verified checkout
  root and head. Citations are still restricted to the supplied binding and
  context windows, so `findings.mjs` evidence validation is unchanged and every
  published citation still resolves against the captured revision.

```sh
for suite in findings quick selection retention preview publication \
  publish-later checkout config context fixture target; do
  node scripts/smoke-$suite.mjs >/dev/null || echo "FAIL $suite"
done
git diff --check
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-reviewer-tools.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
```

All twelve controlled suites pass, `git diff --check` is clean, the plugin was
reinstalled after the extension changes, and the three installed-runtime probes
above pass without spending inference.

### Remaining limitations

- **No live inference ran.** It is still unproven that a reviewer *model* uses
  the read tools well, stays in PR scope while reading, or produces better
  findings than the diff-only reviewers. That is the second half of R1.
- **The controlled runtime fixture now blocks inference-spending quick probes.**
  `prepareTargetSmoke` deliberately creates a dirty checkout on
  `not-the-pr-branch` with the synthetic head `"b" * 40`, which can never
  satisfy the gate. Every fixture-driven `--quick` runtime probe
  (`smoke-runtime.mjs --targets --quick`, and the retention, preview,
  publication and publish-later `--quick` variants) will now refuse instead of
  running reviewers. The no-inference paths are unaffected and all pass. The
  live public targets have the same problem: `preparePublicCheckout` does not
  fetch or detach the reviewed head, so a live `--quick` probe would also
  refuse.
- Because the gate performs a fresh metadata read, capture-plus-gate now issues
  three metadata reads instead of two. `target-fixture.mjs` drift thresholds
  keyed on `reads >= 3` (fixture PR 11, and `publicationNumbers.stale` /
  `draft` = 54 / 55) are unchanged and therefore mis-timed for any future
  inference-spending publication probe; they need to become `4`.
- Reads are confined by plugin-owned real-path checks, not by an OS sandbox. A
  symlink is resolved before the check, but nothing prevents a granted tool from
  reading any file inside the reviewed checkout, including ignored ones.
- Untracked files are only warned about. A reviewer can therefore read a file
  that is not part of the reviewed revision, though it cannot be mistaken for
  modified reviewed code and cannot be cited.
- No custom revision-bound tool was built; reads come from the working tree, not
  from the captured SHAs. Selection, retention, publication, authorization,
  configuration and trust behavior are unchanged.

## R1 second-half harness checkpoint

On 2026-09-07, continuing from `e656ffc` / implementation checkpoint `340ab77`,
the second-half harness work is implemented. R1 remains pending until the
authorized live read experiment below is recorded.

- `prepareTargetSmoke({ matchingCheckout: true })` commits the original fixture
  head sources (`example.js`, `total.js`, `shipping.js`) in a fresh temporary
  repository. The fixture `gh` receives the real commit SHA through
  `PR_REVIEW_SMOKE_HEAD`, serves the corresponding head content, and accepts
  fixture POST payloads only at that SHA. The default fixture remains dirty on
  `not-the-pr-branch` with the synthetic head, preserving its refusal exercise.
  Request traces live in `.git`, not among reviewer-visible source files.
- All fixture-driven inference harnesses select the matching mode, including
  retention, preview, publication and publish-later. No-inference retention
  continues using its existing synthetic seed. Session cwd is explicitly the
  fixture directory; callers no longer depend on a previous capture to set it.
- Drift for fixture PRs 11, 54 and 55 now starts at `reads >= 4`. This counter
  includes the diff request and excludes the current request: capture accounts
  for three requests, the gate is the fourth, and the next request sees drift.
- `preparePublicCheckout(repository, head)` fetches the exact head and detaches
  it only in a newly allocated temporary checkout. It asserts the head,
  detached state, origin and clean tree before/after use, removes the temporary
  checkout on preparation failure or cleanup, and uses the existing sanitized
  Git runner. No user checkout is switched, stashed, cleaned or pulled.
- `smoke-runtime.mjs --quick --once` restricts the harness to one explicit quick
  run, without alias/cancellation reruns; it waits for the retained-result
  settlement. `--read-live` requires that single-run form and an explicitly
  pinned repository, PR number and head through `PR_REVIEW_LIVE_*`.
- Reviewer evidence now records each ephemeral
  `assistant.usage.data.copilotUsage.totalNanoAiu` charge in `billing`, outside
  the retained usage schema. Missing charges remain unknown. The harness prints
  a credit total only when all recorded calls have charges. This is observation,
  not a credit limit, retry, timeout or change to retention/publication gates.

Demonstrated in this session, with CLI 1.0.83 and its bundled SDK:

- `node scripts/smoke-target.mjs` passes real-commit/content/gate acceptance for
  fixture PRs 12, 13, 11, 54 and 55, stable gate reads followed by correctly
  timed drift, real-head fixture POST acceptance and synthetic-head rejection.
  No network or inference is used.
- Targeted controlled suites `target`, `context`, `fixture`, `quick` and
  `retention` pass, as does `git diff --check`. These are harness checks, not
  execution of safeguards in a reviewed project.
- Installed `smoke-runtime.mjs --targets --startup` passes the mismatched
  checkout refusal and existing capture assertions.
- Installed `smoke-runtime.mjs --targets --matching-checkout --startup` captures
  the fixture's real head and the harness calls the production checkout gate
  successfully, without starting a reviewer model. This proves capture and
  gate compatibility, not fixture reviewer output.
- Installed `smoke-runtime.mjs --target-live` passes against
  `github/copilot-sdk#2543`, including exact-head detached checkout and existing
  capture fingerprints. This contacts GitHub but spends no inference.
- Installed `smoke-reviewer-tools.mjs` and `smoke-retention-runtime.mjs` pass
  without inference. The latter still reports command-only cold resume as
  unsupported; no transcript recovery was added.

Reproduction for the installed no-inference commands above:

```sh
copilot plugin install "$(pwd)"
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk"
node scripts/smoke-runtime.mjs --targets --startup
node scripts/smoke-runtime.mjs --targets --matching-checkout --startup
node scripts/smoke-runtime.mjs --target-live
node scripts/smoke-reviewer-tools.mjs
node scripts/smoke-retention-runtime.mjs
```

API sources consulted in this session: installed SDK `docs/extensions.md`,
`session.d.ts` event subscription API and `generated/session-events.d.ts`
(`AssistantUsageEvent` is ephemeral; the charge is optional); current official
[plugin creation guide](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
and [Node SDK README](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md).
Only existing runtime integration is reused; declarations do not prove live
charge delivery. The plugin was reinstalled after the extension change.

Remaining at this checkpoint: no reviewer inference has run yet in this
session. The user explicitly authorized exactly one
`primait/starsky#8126 --quick --all --no-comment` review on
`gpt-5.6-terra` / `high`. A fresh GitHub metadata GET returned head
`06155b5ea4ed2d97656d65fc4c24a2799c0a44cd`, matching the earlier recorded
diff-only baseline. That earlier baseline has not been rerun in this session.
No fixture inference/publication runs are authorized or demonstrated by these
no-inference results. L1 remains pending; no upstream source was copied.

## Completed increment: R1, second half

Harness checkpoint: `4cc5562` ("fix: prepare revision-matched quick review
probes"). The subsequent work in this session corrected the runtime tool-name
mismatch below and completed exactly one inference-spending live quick review.
No reviewer prompt, permission scope, revision gate, configuration, trust,
selection, binding, lifecycle, retention schema or publication authority changed.
No safeguards or reviewer shell tool were added; L1 remains pending, with no
upstream source copied.

### Blocked first attempt and demonstrated alias correction

The first explicitly authorized attempt against `primait/starsky#8126` captured
the pinned revision and passed the checkout gate, then stopped before sending
any model prompt. Session `939850f4-721b-4939-a154-af67c2f377d4` reported,
verbatim:

```text
Runtime did not enforce the reviewer tool set (glob, grep, view). It offered: glob, rg, view. No review started.
```

This was a tool-catalog spelling mismatch, not a revision refusal or a model
failure. No read tool was called, no reviewer inference was spent, and no
finding improvement was observed. The harness exited nonzero. Its early-exit
path has since been changed to wait for settlement before rejecting an
unsuccessful run, rather than interrupting post-review retention.

`read-only.mjs` now canonicalizes `rg` to `grep` only for the exact-set assertion
and the read-only pre-tool hook. The granted filters remain exactly
`builtin:view`, `builtin:grep`, `builtin:glob`; raw tool-call evidence retains
the runtime spelling. It does not grant another tool or broaden confinement.
Duplicate `grep` plus `rg`, a missing tool, or an extra tool still fails the
exact-set assertion.

The no-inference `smoke-reviewer-tools.mjs` can now select a model explicitly
with `PR_REVIEW_HEAVY_MODEL`. With `gpt-5.6-terra`, it demonstrated catalog
`glob, rg, view` under the unchanged filters; with `claude-sonnet-5`, it
demonstrated `glob, grep, view`. Both actual search tools executed inside the
root, rejected a search outside it through the permission handler, and kept
zero-tool sessions empty. The GPT probe also explicitly denied its native
`apply_patch` using the string-shaped argument schema (an object-shaped probe
first failed schema validation and was not counted as denial evidence).
The extension was reinstalled after the correction, before any runtime probe.

### Authorized live outcome and verbatim evidence

After the pre-inference failure and no-inference correction, the user explicitly
authorized one new attempt. The successful invocation was:

```text
/pr-review 8126 --quick --no-comment --all heavyModel=gpt-5.6-terra heavyEffort=high
```

Target: `primait/starsky#8126`, head
`06155b5ea4ed2d97656d65fc4c24a2799c0a44cd`, base
`0547cc5cf9136344e262f1f01ea3a3331606d516`. The unchanged-source risk was whether
removing direct `lapin` dependencies left imports or feature consumers in the
three affected crates. The PR need not contain a bug to exercise that risk.
The diff-only baseline is the earlier recorded manual run in this roadmap:
zero findings, three substantive missing-source gaps, incomplete coverage. It
was not rerun in this session and is not a controlled same-session A/B result.

Successful parent session: `a6543909-e88c-4160-b44f-b90c4a7cbc76`; invocation
`c4fb3ef3-5889-4336-88e6-51402c1f0e36`. Each specialist received one prompt.
There was no alias review, cancellation review, fallback, retry after
inference, or evidence-validator call (there were no candidates).

| Reviewer | Actual calls | Read scope | Reported AI credits |
| --- | --- | --- | --- |
| correctness | 6 `rg`, 1 `glob` | Rust sources and then all file types under `audit-log`, `instrumentation_datadog`, `web_downloads`; Rust file enumeration | 7.65281 |
| contracts | 6 `rg`, 1 `glob`, 4 `view` | Those crates' Rust/all-file references, workspace manifests, and the four files listed below | 10.14754 |
| security-performance-resources | 6 `rg`, 3 `glob` | Those crates' source/manifests/file lists, workspace manifest consumers, repository Rust references and source-inclusion macros | 10.09312 |

All **27 calls** have `tool.execution_complete` events with `success: true`
in the child event files inspected after the run. All three policy records
contain exactly `"permissionDenials":[],"toolDenials":[]`. There were **no
denied reads** and no write/exec tool calls. `grep` was actually named `rg`;
no literal `grep` call occurred.

The four `view` calls opened unchanged `Cargo.toml` (`view_range: [1,220]`),
`audit-log/src/lib.rs`, `instrumentation_datadog/src/lib.rs`, and
`web_downloads/src/lib.rs`. The contracts policy's approved `reads` field,
verbatim (including repeated permission requests and their observed ordering):

```json
[".","instrumentation_datadog","audit-log",".","web_downloads","Cargo.toml","audit-log/src/lib.rs","audit-log","web_downloads/src/lib.rs",".","instrumentation_datadog/src/lib.rs","instrumentation_datadog","web_downloads"]
```

Representative search arguments, verbatim from the live evidence:

```json
{"pattern":"\\b(lapin|amq_protocol|AMQP|Channel|Consumer|BasicProperties)\\b","paths":"audit-log","output_mode":"content","glob":"**/*.rs","n":true}
{"pattern":"\\b(lapin|amq_protocol)\\b","paths":["audit-log","instrumentation_datadog","web_downloads"],"glob":"**/*","output_mode":"content","n":true,"head_limit":300}
{"pattern":"^lapin\\s*=|lapin\\s*=|lapin","paths":".","glob":"**/Cargo.toml","output_mode":"content","n":true,"head_limit":300}
```

The full unedited timeline, all 27 original tool argument objects (including
absolute temporary paths), raw reviewer JSON, and all charge values are kept
locally in this session's persistent artifacts, not copied into this repository:

```text
~/.copilot/session-state/6e124b73-aed5-4bd5-9d18-01d8712e8c2b/files/r1-live-8126.log
~/.copilot/session-state/6e124b73-aed5-4bd5-9d18-01d8712e8c2b/files/r1-live-8126-authorized-retry.log
```

The first file records only the blocked attempt. Successful child sessions, whose
`events.jsonl` files contain the actual tool completion evidence:
`470e8625-9c83-465e-adc0-b048b5205678` (correctness),
`973cbaf8-17f0-46eb-9672-4f1d89d535e6` (contracts), and
`ec45a812-4803-4280-ad92-eefa6b88301a` (security/performance/resources).
These are direct local event-file observations, not cold-resume evidence.

Verbatim final harness output:

```text
Q3 explicit credit cost: 27.89347 AI credits (reported nano-AIU / 1e9)
PASS Q3 explicit: three specialists overlapped 14354ms
Q4 explicit: 0 findings, 0 rejected, 0 duplicates, 0 coverage issues
PASS Q3 explicit: owned runtime exited (11548)
```

The eight per-request `totalNanoAiu` values were, in reviewer order:
`6369650000`, `1283160000`; `6328900000`, `1487810000`, `2330830000`;
`6670600000`, `1765740000`, `1656780000`. They sum to `27893470000`.
This is the runtime-reported charge for this review, not a cost estimate or an
independent billing-ledger reconciliation.

All three reviewers returned `"candidates":[]`. Correctness and contracts
respectively returned these informational caveat reasons, verbatim:

```text
Build resolution was not independently executed; the assessment is limited to tracing direct source references and the captured manifest/lockfile changes.
The captured context contains manifest and lockfile changes but no build or test output; the review could not independently confirm compilation under every workspace feature combination.
```

The third reviewer returned `"limitations":[]`. The result was
`executionComplete: true`, `complete: true`, `coverage: "completed"`, with zero
substantive coverage gaps and two caveats. **Findings did not improve in count
or demonstrated bug detection: they remained zero.** Access to missing context
was used and the prior three missing-source gaps disappeared, which is evidence
of improved coverage on this target, not proof that the PR compiles or is
correct. No prompt tuning was needed or attempted.

Selection was `empty`, publication was `not-attempted`, and the retained record
settled with digest
`0de659e0f9cbcf3ed1dc5d2413c952ca5072f54529489b0beee3c086040e244b`.
The harness waited for settlement, observed the owned runtime exit, checked
the disposable checkout's exact head/detached/clean state, and removed it.
No user checkout was changed; no test, compilation or lint command ran in the
reviewed project; no review was published.

### Reproduction and remaining limits

All twelve controlled suites named in the first-half reproduction passed in
this session, along with `git diff --check`. After the alias correction, both
installed fixture modes (`--targets --startup` and
`--targets --matching-checkout --startup`) passed again without inference.
Installed public capture and retained inspection evidence is recorded at the
harness checkpoint above; those results must not be mistaken for fixture
inference or a live positive-finding/publication exercise.

No-inference model-specific tool probes:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra node scripts/smoke-reviewer-tools.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 node scripts/smoke-reviewer-tools.mjs
```

The following command already spent credits. **Do not repeat it without new
explicit authorization.** The prior authorization is consumed.

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
PR_REVIEW_LIVE_REPOSITORY=primait/starsky PR_REVIEW_LIVE_NUMBER=8126 \
PR_REVIEW_LIVE_HEAD=06155b5ea4ed2d97656d65fc4c24a2799c0a44cd \
node scripts/smoke-runtime.mjs --read-live --quick --once
```

Remaining limitations: one target and one model are not general review-quality
proof. No new positive finding depending on unchanged source was adjudicated;
the adjudicator still receives zero tools and only captured diff/context
evidence. Reads and billing are in raw timeline evidence, not the retained
inspection schema. Untracked/ignored readable content and filesystem races
remain subject to the previously documented confinement limits. The matching
fixture's head is real, but its base is still synthetic; it is a controlled
GitHub response double, not a real GitHub PR. No fixture-driven
inference/publication suite was rerun. Cold retained-session resume is still
unsupported. Presentation consolidation was left untouched.

## Completed increment: M1, balanced half

Implementation: `extensions/pr-review/modes.mjs` (new), `review.mjs` (renamed
from `quick.mjs`), `findings.mjs`, `retention.mjs`, `preview.mjs`,
`checkout.mjs`, `retained-run.mjs`, `extension.mjs`, `config.mjs` and
`target.mjs` wording. Probes: `scripts/smoke-review.mjs` (renamed from
`smoke-quick.mjs`), `smoke-findings.mjs`, `smoke-retention.mjs`,
`smoke-checkout.mjs`, `smoke-config.mjs`, `retention-fixture.mjs`,
`runtime-target.mjs`, `smoke-runtime.mjs` and `smoke-config-runtime.mjs`.
No upstream source was copied. The full and deep modes, fallbacks, timeouts,
safeguards, reviewer shell tools, gate overrides and an interactive menu were
not added, and no configuration key was added. L1 remains pending.

### Mode boundary

`modes.mjs` declares each mode as data: reviewer topology with the tier each
reviewer resolves, findings policy, label, flag and evidence prefix. Quick keeps
its three heavy specialists and its P0-P2 policy. Balanced runs four heavy
specialists (correctness, contracts, security, performance/resources) and one
light overview reviewer, and presents P0-P2 plus at most three P3/nit findings.
Mode flags are mutually exclusive, `--major-only` remains the quick alias, and
**balanced is the default when no mode flag is given**.

Because a bare PR number now runs a review, the capture-only path that Q1/Q2
probes depend on moved to an explicit `--capture-only` flag. It refuses to
combine with a mode, posting, selection or model argument, starts no reviewer
and spends no inference. This flag is not in `SCOPE.md`; it is a prototype
diagnostic path that keeps the no-inference capture probes reachable, and it can
be removed at D1 if the documented surface should match upstream exactly.

The findings policy travels with the mode into the reviewer instructions, the
candidate schema, the evidence boundary, the adjudicator instructions,
presentation, retention and publication. Accepted minor findings beyond the cap
are withheld rather than dropped: they are recorded in `validation.capped` with
their id, severity, title and reason, are reported in the findings output, and
can never be selected or published. A duplicate alias of a withheld finding is
withheld with it. Withholding is a presentation policy, not a coverage failure,
so it does not make a run incomplete. Severity order is declared by the policy
rather than inferred from string comparison.

`retention.mjs` now validates the record against its own mode: the reviewer
count for a complete run, the admitted severities, the minor cap, and the
`capped` entries' identity. A quick record still rejects a P3, and a balanced
record with four presented minor findings or a missing reviewer is rejected. The
retained schema version is unchanged; `capped` is optional, so older records
stay readable. `preview.mjs` builds the same code-controlled COMMENT payload,
titled by the mode's label and admitting only the mode's severities. Selection,
retention and publication gates are otherwise untouched.

Each reviewer resolves its own tier through the existing layering, so a personal
or trusted-project light assignment is what the overview reviewer actually runs.
Before any reviewer starts, an `Effective reviewer assignments:` block names
every reviewer, its tier, model, reasoning effort and the origin of each value,
after the existing effective-configuration report. Only `heavyModel=` and
`heavyEffort=` remain invocation flags; no light-tier flag was added, so a
per-invocation light override is only possible through `/pr-review-config`.
A heavy invocation flag does not propagate to the light tier: only saved
settings inherit across tiers, which is unchanged C1 behavior. The adjudicator
still runs on the heavy tier and still holds zero tools.

### Controlled evidence

All twelve controlled suites passed in this session, and `git diff --check` is
clean. `smoke-quick.mjs` was renamed to `smoke-review.mjs`; the suite list is now
`findings`, `review`, `selection`, `retention`, `preview`, `publication`,
`publish-later`, `checkout`, `config`, `context`, `fixture`, `target`.

New demonstrations, all without inference or network access:

- Mode parsing: `--balanced`, the bare default, the `--major-only` alias,
  mutually exclusive mode flags, `--full`/`--deep` rejected as unsupported
  arguments, and `--capture-only` rejected with any mode, posting, selection or
  model argument.
- Topology and tiers: balanced resolves five reviewers, four heavy and one
  light; an unconfigured light tier falls back to the ambient assignment; a
  layered personal/trusted-project light assignment reaches the overview
  reviewer with `project:light` origins; an unusable light model refuses the
  review with no substitution.
- A settled balanced run through `executeReviewRun`: five concurrent specialist
  sessions plus one adjudicator, the overview session created with the light
  model while the adjudicator stays heavy, `M1 binding:`/`M1 evidence:`
  markers, four accepted P3 candidates reduced to three presented findings and
  one withheld record, selection of exactly the three presented findings, and a
  proposed body reading `Balanced review: 3 selected validated finding(s)`.
- Findings policy at unit level: quick admits no minor candidate at all;
  balanced admits P3/nit, orders P1 before P3 before nit, caps at three, records
  the withheld representative and its duplicate alias, and stays complete.
- Retention: a balanced record with five reviewers validates; the same record
  relabelled `quick` is rejected for incomplete reviewer coverage and for a
  severity outside the mode's policy; a fourth presented minor finding is
  rejected as exceeding the findings policy.
- The checkout gate refuses with its own mode's label and fixing command
  (`rerun /pr-review 12 --balanced`), on the same evidence as quick.

### Installed-plugin evidence

The extension was reinstalled with `copilot plugin install "$(pwd)"` (the
deprecation warning is expected) before every runtime probe. No probe below sent
a model prompt; each asserts the absence of model turns, subagents and tool
executions, or of any `Reviewer ` timeline message.

- `smoke-runtime.mjs --targets --startup` and
  `smoke-runtime.mjs --targets --matching-checkout --startup` passed. Both now
  dispatch the skipped draft in **both** modes and assert a settled
  `coverage: "not-started"` result under `Q3 evidence:` and `M1 evidence:`
  respectively, one assignment line per reviewer (three and five), the
  `overview [light]` line, the balanced findings-policy text, and that no
  reviewer started. Capture dispatches now pass `--capture-only`, including the
  advanced-head, HTTP 404, truncated-diff and invalid-number cases.
- New installed rejections without inference: `--quick --balanced`,
  `--capture-only --balanced`, `--balanced --no-comment --comment`,
  `--balanced ... heavyModel=missing-m1-model` and `--balanced ...
  heavyEffort=invalid-effort`. Each returns an explicit command error and starts
  no reviewer.
- `smoke-retention-runtime.mjs` passed; the retained record now carries
  `"capped":[]`. Command-only cold `session.resume` remains unsupported.
- `smoke-reviewer-tools.mjs` passed with `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra`
  (catalog `glob, rg, view`) and with `claude-sonnet-5` (`glob, grep, view`).
  Confinement, native write/exec denial and non-leakage are unchanged.
- `smoke-config-runtime.mjs` passed, including a new balanced case: with a saved
  personal `lightModel`/`lightEffort`, a skipped-draft balanced dispatch reported
  `overview [light]: model=<saved> [configured:light] reasoning=<saved>
  [configured:light]` and `correctness [heavy]: ... [inherited:light] ...`
  before settling, with no inference and no GitHub request. This probe requires
  an empty personal configuration store; the existing personal `config.json` was
  copied aside for the run and restored byte-identically afterwards.

### Live inference: the dogfood review of pull request #3

One live balanced review was explicitly authorized and run, against this
project's own pull request #3 at head `5c05b7c63d44f7f08a1775d4f2d601dd912c9aa1`
(base `d88774cb3fc3c5631ba1045c3623af3c780b8336`, 27 files, 1381 additions and
446 deletions). It was dispatched with
`node scripts/dogfood-review.mjs 3 --all --no-comment`, which sends the command
through the SDK command RPC from a session rooted at this checkout. Parent
session `e5845e77-1237-4a88-b0fd-2e438d251778`, invocation
`453c696d-89b3-43b2-a556-84be490fe3b6`.

Every reviewer ran `gpt-5.6-terra` at `high`, from the saved personal heavy
tier. The overview reviewer is on the light tier, but no light tier is saved, so
it inherited the heavy assignment: this run therefore exercised the balanced
topology, **not** a genuinely lighter model.

| Reviewer | Tier | Status | Requests | Reported credits | Duration | Tool calls |
| --- | --- | --- | --- | --- | --- | --- |
| correctness | heavy | completed | 6 | 88.04068 | 85596 ms | 23 |
| contracts | heavy | completed | 5 | 90.05597 | 87188 ms | 24 |
| security | heavy | completed | 4 | 82.11749 | 62526 ms | 16 |
| performance-resources | heavy | completed | 1 | 63.66150 | 17397 ms | 0 |
| overview | light | completed | 6 | 90.27063 | 76994 ms | 26 |

Five reviewers overlapped for 17397 ms inside an 87234 ms wall time. The runtime
reported **414.14627 AI credits** in total. That is the runtime's own figure for
this review, not a billing reconciliation, and it is roughly fifteen times the
27.89 credits R1 spent with three reviewers on a small diff. A doc-heavy pull
request is expensive to review this way.

The reviewers made 89 confined read-only calls (69 `view`, 18 `rg`, 2 `glob`)
with **zero permission or tool denials**, so the read grant worked on a real
repository checkout. No adjudicator ran, because no reviewer produced a
candidate. Selection was `empty`, the proposal was `empty`, publication was
`not-attempted`, and nothing was written to GitHub.

The result was **0 findings with incomplete coverage**: four coverage gaps and
two informational caveats. Coverage was incomplete for the right reason, and
zero findings is not a clean-review claim.

**The review found a real defect in its own pull request.** The `contracts` and
`overview` reviewers independently reported that the rename of
`scripts/smoke-quick.mjs` left a `README.md` reproduction command pointing at the
removed script, and that they could not present it as a candidate because the
stale line is unchanged context rather than a changed line. Verbatim, from
`contracts`:

```text
The patch renames the documented smoke suite, but the README reproduction command that still invokes the old filename is unchanged diff context rather than an added or removed source line. The required changed-line-only location schema cannot anchor that user-visible regression.
```

That gap was verified by hand and was correct: `README.md` had two references to
the old filename and the increment's edit fixed only the first. The second was
fixed on the same branch after this review, and the docs now name only scripts
that exist.

The `security` reviewer recorded that the captured source cannot demonstrate
runtime enforcement of the light reviewer's read-only boundary, and
`performance-resources` recorded that no live evidence existed for the
five-reviewer topology's operational cost. This run partly answers the second
gap with its own numbers above, and the confinement evidence for the first
remains the separate no-inference `smoke-reviewer-tools.mjs` probe.

Limitations of this single run: one pull request, one model, one effort level,
and a change set dominated by documentation. It demonstrates that balanced
executes end to end on a real pull request with real reads and a real charge. It
demonstrates nothing about balanced review quality, about minor findings, or
about the light tier, since no light model ran and no candidate was ever
adjudicated.

**Recorded tool defect: the changed-line anchoring rule hid a real regression.**
Two reviewers found a genuine, user-visible consequence of this diff and had no
compliant way to report it, because the affected line is unchanged context even
though the rename that broke it is a changed line. The rule exists to stop
reviewers auditing the repository at large, and it should not simply be relaxed.
A later increment should decide how a candidate can be anchored on the changed
line that causes the breakage while citing the unchanged line that it breaks.
Until then, expect stale-reference regressions to surface as coverage gaps
rather than findings.

### Reproduction

```sh
for suite in findings review selection retention preview publication \
  publish-later checkout config context fixture target; do
  node "scripts/smoke-$suite.mjs" || break
done
git diff --check

copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --startup
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs --targets --matching-checkout --startup
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-retention-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-config-runtime.mjs
```

`smoke-config-runtime.mjs` refuses to run while a personal
`<copilot-config-home>/pr-review/config.json` exists; move it aside and restore
it afterwards.

### Remaining limitations

- Two live balanced reviews exist, both on this project's own documentation-heavy
  pull requests: #3 at head `5c05b7c` and #4 at head `ae2c55c`. #3 produced no
  candidate and no adjudication. #4 raised seven candidates, admitted four at the
  evidence gate, and returned three validated findings. Balanced behaviour on a
  real code diff is therefore still undemonstrated, and the minor-finding cap has
  never been exercised: at most one P3 has ever been validated, against a cap of
  three. A light model has run exactly once, on #4, where `overview` used
  `gpt-5.6-luna` and produced the only finding no heavy reviewer raised. Every
  earlier balanced run inherited the heavy assignment for the light tier.
- No light-tier invocation flag, so a per-invocation light override requires
  `/pr-review-config`. Deliberate: no configuration surface was added.
- `--capture-only` is prototype surface outside `SCOPE.md`, introduced only
  because balanced became the default. Revisit at D1.
- Tier inheritance can produce an assignment the user never asked for and then
  refuse it. A model with no configurable reasoning effort, such as
  `claude-haiku-4.5`, cannot serve a tier while any other tier has an effort
  set: an unset `lightEffort` inherits `heavyEffort`, the resolved pair is
  validated against the light model, and the review is refused. Verified against
  the live model catalogue on 2026-09-07. Refusing beats silently lowering the
  effort, but there is no way to express "this tier takes no effort" today.
  Tracked as increment `C4`: an unset effort should stay unset when the resolved
  model supports none, while an explicit effort is still validated and never
  silently lowered. **Fixed by `C4`**, recorded below; an inherited effort now
  drops for such a model, and only for such a model.
- The minor-finding cap keeps the strongest three by declared severity then
  confidence. It does not spread minor findings across reviewers or files, and
  a light reviewer's minor finding can be displaced by a heavy one's.
- Fixture inference and publication suites were not rerun; the balanced payload
  body was demonstrated in controlled probes only, never posted to GitHub.
- Everything R1 recorded still holds: cold command-only resume is unsupported,
  the adjudicator receives zero tools, confinement limits for untracked and
  ignored files are unchanged, and the matching fixture's base is synthetic.

## Documentation checkpoint: pull request #4 and its review

Pull request #4 carries no behaviour change. It records the working agreement
that the increment's pull-request review is its real integration test, documents
how to run that review, tracks the effort-less tier model question as `C4`, and
rewrites the handoff. `SCOPE.md` is unchanged.

### Review of record

On 2026-09-07, at head `ae2c55c`, the installed plugin reviewed this pull
request, dispatched with `node scripts/dogfood-review.mjs 4 --all --no-comment`.
Authorized explicitly by the user; a documentation-only pull request does not
earn a review by default.

- Mode: balanced, five reviewers, default findings policy (P0-P2 plus at most
  three P3/nit findings anchored on changed lines).
- Models actually used: `correctness`, `contracts`, `security` and
  `performance-resources` on `gpt-5.6-terra` at `high`, all `[configured:heavy]`;
  `overview` on `gpt-5.6-luna` at `high`, `[configured:light]`. The adjudicator
  `evidence-validator` also ran on `gpt-5.6-terra` at `high`.
- **This is the first run in which a light model actually ran.** Every earlier
  balanced run inherited the heavy assignment for the light tier. The light
  reviewer was not decorative: `overview` produced the only finding about the
  README's remaining pinned probe commands, which no heavy reviewer raised.
- Project trust: NOT TRUSTED. Assignments came from personal configuration only.
- Diff reviewed: 205 additions, 77 deletions, 4 files.
- Coverage: **INCOMPLETE**. Three execution failures, zero coverage gaps, one
  informational caveat. Not a clean-review result.
- Credit cost: **79.82605 AI credits**, as reported by the runtime. For scale,
  the five-reviewer balanced review of the 27-file pull request #3 cost
  414.14627.
- Publication: none. `autoPostReviews` is false, the runner refuses `--comment`,
  and posting authority was suppressed because coverage was incomplete. The
  payload was built and shown as a proposal only.

### Findings, and what changed

Seven candidates were raised. The evidence gate admitted four; the adjudicator
accepted all four; deduplication merged two into one. Three validated findings
resulted, all real, all fixed in `b115b36`:

1. **P2, confidence 0.96, reported by `correctness` and `contracts`.** The
   documented integration test installed the plugin before `gh pr checkout`.
   Installation copies the working tree into the plugin cache while the revision
   gate only checks the checkout, so the run could review a stale installed copy
   and still report a passing integration test. Order swapped, reason recorded.
2. **P2, confidence 0.96, reported by `overview`.** The handoff directed every
   installed probe to derive the SDK path while the README still pinned
   `1.0.83` in eleven probe commands. All eleven swept. Prose recording which
   version was actually tested stays pinned, because it is evidence.
3. **P3, confidence 0.98, reported by `contracts`.** "Everything above runs the
   code against test doubles" was false: the `--target-live` variants make real
   GitHub requests and the inference probes spend real inference. Reworded.

### Rejected at the evidence boundary, and what that cost

Three candidates never reached adjudication. This is the gate working, and also
its price:

- `contracts:2` claimed the derived SDK path passed `/copilot-sdk` to `ls` as a
  separate operand, at confidence 0.99. **A false positive**: the reviewer
  introduced a space into its own quote. Neither file contains it, and the line
  extracted verbatim from the README executes and resolves under bash and zsh.
  The gate rejected it for a citation that did not match source, which is
  exactly the outcome the gate exists for. A 0.99-confidence fabrication was
  stopped by an exact-match check rather than by judgement.
- `performance-resources:1` observed that the handoff hands off the full half of
  M1 while documenting a command with no mode flag, which would spend the
  increment's one authorized review on balanced and never exercise `--full`.
  Rejected because its introduction citation and location named different hunks.
  **The point was substantively right**, so it was acted on anyway in `b115b36`;
  the command now passes `--full`. Recording it as a rejection that should have
  landed: the gate's citation rule discards true findings whose evidence is
  merely mis-anchored.
- `overview:1` asked that documentation-only reviews stay explicitly optional in
  the roadmap. Rejected for a citation not matching a supplied context window.
  Not acted on: `AGENTS.md` already says a documentation-only pull request's
  review is the user's call.

The informational caveat from `security` is fair and unresolved: the review could
not exercise the installed CLI, the SDK package resolution or the GitHub
authentication behind the new command, because the changed content is
documentation.

### Remaining limitations

- The medium tier still has never run. `claude-sonnet-5` at `medium` is
  configured, but only full mode assigns a medium reviewer, and full does not
  exist yet.
- Balanced's minor-finding cap was still not exercised: only one P3 was
  validated, well under the cap of three.
- One review, on a documentation pull request. Balanced behaviour on a real code
  diff remains undemonstrated.

## Completed increment: M1, full half

Implementation: `extensions/pr-review/modes.mjs`, `findings.mjs`,
`extension.mjs` and `config.mjs` wording. Probes: `scripts/smoke-review.mjs`,
`smoke-findings.mjs`, `smoke-retention.mjs`, `smoke-checkout.mjs`,
`smoke-runtime.mjs` and `smoke-config-runtime.mjs`. No upstream source was
copied. No deep mode, fallback, timeout, safeguard, reviewer shell tool, gate
override, configuration key or interactive menu was added, and no user checkout
was altered to satisfy the revision gate. L1 remains pending.

### Mode boundary

`--full` declares a sixth specialist beside the balanced five: a
`conventions-maintainability` reviewer on the **medium** tier, focused on
project conventions, naming, structure, error handling, tests, documentation
and maintainability of the changed code, judged against the surrounding
codebase. Everything else about the topology is the balanced set unchanged.
The medium tier resolves through the existing layering, so no new configuration
key and no medium invocation flag were introduced; `mediumModel=`/`mediumEffort=`
on `/pr-review NUMBER` are still rejected as invalid review settings, exactly as
the light keys are.

The full findings policy admits the same severities as balanced and presents all
of them. `minorCap` is declared `Infinity` rather than absent, so one number
still drives the cap arithmetic, the retention check and the wording. Two
predicates read it: `admitsMinor` separates quick from the rest, and `capsMinor`
separates balanced from full. A full run therefore withholds nothing, leaves
`validation.capped` empty, and keeps a duplicate of a presented minor finding as
an ordinary alias instead of withholding it alongside a capped representative.

Balanced remains the default when no mode flag is given, mode flags remain
mutually exclusive, `--major-only` remains the quick alias, and quick is
untouched. Evidence validation, deduplication, incomplete-coverage reporting,
selection, retention, publication gates and cancellation are unchanged: the only
mode-dependent inputs they read are the reviewer topology and the findings
policy, which is why full needed no change to any of them. The refactor that
made this possible is small: the four balanced specialist declarations moved to
module constants so both modes share the same objects.

### Controlled evidence

All twelve controlled suites passed in this session, and `git diff --check` is
clean. The suite list is unchanged: `findings`, `review`, `selection`,
`retention`, `preview`, `publication`, `publish-later`, `checkout`, `config`,
`context`, `fixture`, `target`.

New demonstrations, all without inference or network access:

- Mode parsing: `--full` alone, with `--all --comment`, and with
  `--include-drafts`; `--full` rejected against `--quick`, `--balanced` and
  `--major-only`; `--full --full` rejected as a duplicate; `--full` rejected
  with `--capture-only` and with conflicting posting flags; and
  `--full ... mediumModel=other` / `mediumEffort=low` rejected as invalid review
  settings.
- Topology and tiers: full resolves six reviewers, four heavy, one light and one
  medium. An unconfigured medium tier falls back to the ambient assignment. With
  only light and heavy configured, the medium tier is equidistant and inherits
  the **heavier** one, reported as `inherited:heavy`, rather than downgrading. A
  saved `mediumModel`/`mediumEffort` reaches the conventions reviewer with
  `configured:medium` origins and leaves the heavy specialists alone. An
  unusable medium model refuses the review with no substitution.
- A settled full run through `executeReviewRun`: six concurrent specialist
  sessions plus one adjudicator, the overview and conventions sessions created
  on their own tiers while the adjudicator stays heavy, `M1 binding:` markers,
  six accepted P3 candidates all presented with `capped` empty, selection of all
  six, and a proposed body reading `Full review: 6 selected validated
  finding(s)`.
- Findings policy at unit level: the full policy admits the same five candidates
  balanced admits, presents four of them (three P3 then one nit, in declared
  severity order) instead of three, records the fifth as an ordinary duplicate
  alias rather than a withheld entry, caps nothing, and reports no withheld
  section.
- Retention: a full record with six reviewers validates. The same record
  relabelled `balanced` is rejected for exceeding that mode's findings policy or
  for incomplete reviewer coverage, depending on which constraint it breaks
  first; relabelled `quick` it is rejected for a severity outside the policy; and
  dropping the conventions reviewer is rejected as incomplete reviewer coverage.
- The checkout gate refuses with full's own label and fixing command
  (`Full review refused ...`, `rerun /pr-review 12 --full`), on the same evidence
  as quick and balanced.

### Installed-plugin evidence

The extension was reinstalled with `copilot plugin install "$(pwd)"` (the
deprecation warning is expected) before every runtime probe. No probe below sent
a model prompt; each asserts the absence of model turns, subagents and tool
executions, or of any `Reviewer ` timeline message.

- `smoke-runtime.mjs --targets --startup` and
  `smoke-runtime.mjs --targets --matching-checkout --startup` passed. The
  draft-skip loop now dispatches **three** modes and asserts for each a settled
  `coverage: "not-started"` result, one assignment line per reviewer (three,
  five and six), and that no reviewer started. For `--full` it additionally
  asserts the `overview [light]` line, a
  `conventions-maintainability [medium]` line with a resolved model, effort and
  origin, and the findings-policy text `P0-P2 findings, plus every substantiated
  P3/nit finding`.
- `123 --full --no-comment` left the unsupported-arguments list, because it now
  parses. New installed rejections without inference: `--balanced --full`,
  `--full --major-only`, `--capture-only --full`, `--full --no-comment
  --comment`, `--full ... mediumModel=missing-m1-model`, `--full ...
  heavyModel=missing-m1-model` and `--full ... heavyEffort=invalid-effort`. Each
  returns an explicit command error and starts no reviewer.
- `smoke-config-runtime.mjs` passed, including a new full case: with a saved
  personal light tier and a saved medium tier at a **different** reasoning
  effort, a skipped-draft full dispatch reported `full mode, 6 reviewer(s)`, the
  uncapped findings-policy text, `conventions-maintainability [medium]:
  model=<saved> [configured:medium] reasoning=<saved> [configured:medium]`,
  `overview [light]: ... [configured:light]`, and `correctness [heavy]: ...
  [inherited:medium]`, with no inference and no GitHub request. Unsetting the
  medium tier again left the rest of the saved configuration untouched. This
  probe requires an empty personal configuration store; the existing personal
  `config.json` was moved aside for the run and restored byte-identically, which
  was verified by SHA-256.
- `smoke-retention-runtime.mjs` passed; command-only cold `session.resume`
  remains unsupported. `smoke-reviewer-tools.mjs` passed with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` (catalog `glob, rg, view`) and with
  `claude-sonnet-5` (`glob, grep, view`). Neither is affected by this increment;
  they were rerun to show confinement and non-leakage are unchanged.

### Live inference: the dogfood review of this pull request

On 2026-09-07, at head `e8da43b2d5e6f2aa651f48dd83861b7a10df3ad5`, the installed
plugin reviewed **pull request #5**, this increment's own pull request,
dispatched with `node scripts/dogfood-review.mjs 5 --full --all --no-comment`.
This is the one review the standing workflow authorizes for this increment.
Parent session `313a8616-c61c-438c-a7da-1682c0e838e8`, invocation
`0a936a64-203b-4c1d-a20e-8e46f1621bd4`. Diff reviewed: 544 additions, 94
deletions, 13 files.

- Mode: full, six reviewers, `findings policy: P0-P2 findings, plus every
  substantiated P3/nit finding anchored on this diff's changed lines`.
- Project trust: NOT TRUSTED. Assignments came from personal configuration only.
- **This is the first run in which the medium tier ever executed a model.** The
  conventions reviewer ran `claude-sonnet-5` at `medium`, `[configured:medium]`,
  while `overview` ran `gpt-5.6-luna` at `high`, `[configured:light]`, and the
  four heavy specialists ran `gpt-5.6-terra` at `high`, `[configured:heavy]`. All
  three tiers ran genuinely distinct models in one review, which no earlier run
  had done.

| Reviewer | Tier | Model | Effort | Status | Requests | Reported credits | Duration | Tool calls |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| correctness | heavy | `gpt-5.6-terra` | high | completed | 5 | 51.19701 | 62451 ms | 19 |
| contracts | heavy | `gpt-5.6-terra` | high | completed | 6 | 51.39055 | 40202 ms | 19 |
| security | heavy | `gpt-5.6-terra` | high | completed | 5 | 45.55724 | 36138 ms | 18 |
| performance-resources | heavy | `gpt-5.6-terra` | high | completed | 4 | 43.80279 | 30566 ms | 14 |
| overview | light | `gpt-5.6-luna` | high | completed | 8 | 6.50463 | 97963 ms | 19 |
| conventions-maintainability | medium | `claude-sonnet-5` | medium | completed | 7 | 77.81463 | 125063 ms | 6 |

Six reviewers overlapped for 30395 ms inside a 125521 ms wall time. The runtime
reported **276.266849 AI credits**. That is the runtime's own figure, not a
billing reconciliation. For scale, balanced cost 414.14627 on the 27-file pull
request #3 and 79.82605 on the 4-file pull request #4. The light reviewer cost
6.50463 against the heavy specialists' 43-51 each, so a genuinely light model is
what makes the extra reviewers affordable; the medium reviewer was the single
most expensive at 77.81463, and also the slowest by a wide margin.

The reviewers made **95 confined read-only calls with zero permission or tool
denials**: 59 `view`, 33 `rg` and 3 `grep`. The `grep` calls are the conventions
reviewer's, because `claude-sonnet-5` exposes the shared `builtin:grep` grant
under that name while the GPT-family sessions expose it as `rg`. The read grant
therefore works unchanged for the new tier, on a real checkout.

The result was **0 validated findings with incomplete coverage**: two execution
failures, three coverage gaps and two informational caveats. No adjudicator ran,
because no candidate survived the evidence gate. Selection was `empty`, the
proposal was `empty`, publication was `not-attempted`, and nothing was written to
GitHub. Zero findings is not a clean-review claim, and here it is emphatically
not one: both execution failures are about candidates that existed.

### Recorded tool defect: the medium tier's model fenced its JSON

`conventions-maintainability` returned its entire result wrapped in a
```` ```json ```` code fence, so `envelope` rejected the whole output:

```text
conventions-maintainability: invalid candidate output: SyntaxError: Unexpected token '`', "```json
{""... is not valid JSON
```

The parser deliberately performs no fence stripping, substring recovery or
malformed-output extraction; `SCOPE.md` drops experimental malformed-output
extraction from v1, and the reviewer instructions already say "plain JSON only,
no markdown fences". The gate is behaving as designed, and it was **not**
weakened to make this run pass. But the consequence is specific and serious:
full mode is the only mode that assigns the medium tier, so on a Claude-family
medium model the sixth reviewer's output is discarded wholesale, every time, and
the mode's own addition contributes nothing but an execution failure and a
charge. Every earlier live review used GPT-family models only, so no run had ever
met this.

**`F6` changed that parser afterwards.** This paragraph records the behaviour at
the time of pull request #5. Reviewers are now asked for the envelope between two
explicit markers, and a whole-response fence is unwrapped; see "Completed
increment: F6" for what is recovered and what still fails whole.

Read by hand afterwards, the discarded output held two `nit` candidates and two
limitations. Both candidates would have been rejected at the evidence boundary
anyway: their citations omit the required `quote` field. That does not reduce the
defect, because a compliant candidate from the same model would have been lost
the same way.

Both discarded points were nonetheless acted on, since they were about
duplication this diff introduced:

1. `scripts/smoke-checkout.mjs` carried literal `"Balanced review"`/`"--balanced"`
   and `"Full review"`/`"--full"` strings in the new refusal loop, while the loop
   immediately above reads `mode.label` and `mode.flag` from the same objects.
   The new loop now reads them the same way, so it cannot drift from the source
   of truth it verifies.
2. `full.policy` restated balanced's `severities` and `minorSeverities` arrays
   verbatim. A shared `minorPolicy(label, minorCap)` helper now declares that
   vocabulary once, so the two policies cannot silently diverge.

### Rejected at the evidence boundary, and what that cost

`correctness:1`, a P3 at confidence 0.97, was rejected:

```text
correctness:1: rejected at evidence boundary: Error: Introduction citations and location must identify the same changed hunk.
```

**The point was substantively right.** It observed that the new README sentence
"An unset medium tier sits equidistant between light and heavy, so it inherits
the heavy tier rather than downgrading to the light one" states the tie-break
unconditionally, while `resolveField` only reaches heavy first: with a light tier
configured and no heavy tier, the medium tier inherits light. Verified by hand
against `config.mjs`, and now covered by a controlled assertion in
`smoke-review.mjs`. The wording was corrected in both places it appeared.

The rejection itself is correct: the candidate passed `before: null` while its
hunk does remove base-side lines, so its introduction citations do not identify
the same changed hunk as its location. This is the second recorded instance of
the same pattern the pull request #4 review produced, and it is worth naming
plainly: **the citation rule keeps discarding true findings whose evidence is
merely mis-anchored.** Read the rejected candidates by hand; the validated list
is not the whole review.

The three coverage gaps, from `correctness`, `contracts` and `security`, all say
the same true thing: the diff they were given documents that full mode had never
run a model, so they could not settle from source whether the installed runtime
would create and complete a medium-tier session with the confined tool grant.
This run answers exactly that gap, from outside the review.

### Reproduction

```sh
for suite in findings review selection retention preview publication \
  publish-later checkout config context fixture target; do
  node "scripts/smoke-$suite.mjs" || break
done
git diff --check

copilot plugin install "$(pwd)"
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
node scripts/smoke-runtime.mjs --targets --startup
node scripts/smoke-runtime.mjs --targets --matching-checkout --startup
node scripts/smoke-retention-runtime.mjs
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra node scripts/smoke-reviewer-tools.mjs
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 node scripts/smoke-reviewer-tools.mjs
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 PR_REVIEW_HEAVY_EFFORT=high \
  node scripts/smoke-config-runtime.mjs
```

Derive the SDK path rather than pinning a version: old packages under
`~/.copilot/pkg/` are never pruned, so a pinned path keeps resolving after a
`copilot update` and silently drives a stale SDK against a newer CLI. The
recorded run used CLI `1.0.83` and SDK
`~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk` on macOS `darwin-arm64`.

`smoke-config-runtime.mjs` refuses to run while a personal
`<copilot-config-home>/pr-review/config.json` exists; move it aside and restore
it afterwards.

### Remaining limitations

- **A Claude-family medium model loses its whole output to the fence check.**
  This is the increment's most consequential open defect: full mode is the only
  mode that assigns the medium tier, so with `claude-sonnet-5` configured there
  the sixth reviewer reliably contributes an execution failure and a charge
  instead of candidates. It is recorded, not worked around; the parser was not
  relaxed. A later increment should decide between a stricter output contract the
  model actually honours and a narrowly specified envelope tolerance, and must
  demonstrate whichever it picks with its own live review. Until then, prefer a
  GPT-family medium model, or expect `--full` to spend a sixth reviewer's credits
  for nothing.
- One live full review, on this project's own pull request, with a change set
  that is roughly half documentation. It demonstrates that full executes end to
  end with three genuinely distinct tiers, real confined reads and a real charge.
  It demonstrates nothing about full review quality, and it produced no validated
  finding, so the uncapped minor policy has still never presented a real minor
  finding. Whether a medium conventions reviewer earns its cost is undecided; on
  this run it was the most expensive and the slowest of the six, and its output
  was discarded.
- The uncapped minor policy is otherwise demonstrated only against synthetic
  candidates. A real full review could present many more minor findings than a
  balanced one, and nothing bounds that number.
- No medium invocation flag, so a per-invocation medium override requires
  `/pr-review-config`. Deliberate: no configuration surface was added.
- Everything the balanced half recorded still holds: `--capture-only` is
  prototype surface outside `SCOPE.md`; a tier can inherit an assignment the user
  never asked for and then refuse it, tracked as `C4`; cold command-only resume
  is unsupported; the adjudicator receives zero tools; and the changed-line
  anchoring rule can hide a real stale-reference regression as a coverage gap.
  The pull request #5 review produced a second instance of the mis-anchored
  rejection the pull request #4 review recorded.
- The fixes made in response to this review, the corrected README wording, the
  shared severity vocabulary and the deduplicated checkout assertion, were
  verified by the twelve controlled suites only. They were not reviewed by the
  plugin, because the increment's single authorized review is spent.

## Completed increment: F5

`F5` is a feasibility spike. It changed no shipped behaviour: `envelope` is
untouched, no reviewer moved, and no mode, configuration key, fallback, timeout,
safeguard, reviewer shell tool or gate override was added. `L1` stays pending
and no upstream source was copied.

Probe: `scripts/smoke-factory.mjs`, which writes `scripts/f5-factory-extension.mjs`
into throwaway workspaces the CLI discovers for one session each. Nothing is
installed, and the shipped plugin is neither modified nor reinstalled to run it.
Without `--spend` the probe starts no subagent and spends no inference.

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-factory.mjs

# Adds the two structured-output subagents. Spends Copilot credits; it needs
# explicit authorization in the session that runs it. Set the same two paths as
# above, plus the model.
PR_REVIEW_F5_MODEL=claude-sonnet-5 \
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-factory.mjs --spend
```

The inference half ran once, on 2026-09-08, authorized in that session, against
`claude-sonnet-5`, the model whose fenced output exposed the defect on pull
request #5. It cost **15.870500 credits**: 11.661620 for the confined
structured-output reviewer and 4.208880 for the forced schema failure. Those are
the runtime's own `consumed.nanoAiu` figures, not estimates.

### The surface is not reachable from this plugin on CLI 1.0.83

Two demonstrated facts sit in front of `F5`'s four questions, and both were
found by running the surface rather than by reading its declarations.

**Agent Factories are behind a feature flag that is off for this account.** An
ordinary session, including one created with `enableExperimentalMode: true`,
answers every `session.factory.*` call with `Agent factories are not available
for this session`. The runtime reads the flag from the CLI process's own
environment: starting the CLI with `COPILOT_CLI_ENABLED_FEATURE_FLAGS=agent_factories`
makes the same call succeed, and `enableExperimentalMode` turns out to be
irrelevant either way. Passing `expAssignments` naming the feature does **not**
open it, and closes it again when combined with the flag. The probe forces the
flag on for its own child runtime so the four questions can be answered at all.
That is a local configuration, not one a user of this plugin could reach.

**A plugin cannot register a factory on a runtime it owns.** The shipped
reviewers run on a runtime this plugin starts as an SDK client, whose
environment the plugin does control, so the flag would not block it there. That
path is closed: `client.resumeSessionForExtension(...)` with a factory handle is
refused with `Only an extension connection can register factories`. Factories
register only through `joinSession`, which attaches to the **user's foreground
session**, whose CLI environment the plugin does not set.

Together those mean the structured-output surface cannot be reached in
production today by any path this plugin controls, whatever the four questions
below answer.

### Q1: tool confinement. No

Demonstrated negative, on three independent points.

**An extension cannot register a session permission handler at all.** A
`joinSession` option bisection ran four one-option extensions in one session: a
control, one passing `factories`, one passing `customAgents`, and one passing
`onPermissionRequest`. The first three reached their `joined` marker and the CLI
reported them `running`. The fourth logged `start` and never logged `joined`:
`joinSession` never settles, and the CLI reports the extension `failed`. The
shipped reviewers confine reads with exactly such a handler
(`readingReviewerPolicy` in `read-only.mjs`), so on this surface the confinement
point moves to the session host, which for a plugin is the user's interactive
CLI and its own approval flow, not code this project owns.

**A custom agent's declared tool list is not the grant the runtime enforces.**
The probe extension registers `customAgents: [{ name: "f5-confined-reviewer",
tools: ["view", "grep", "glob"] }]`. `session.agent.list` echoes exactly those
three. Selecting that agent and reading the runtime's own tool metadata, the
same instrument `assertReviewerTools` uses, reports **five**:

| Agent | Tools the runtime offers |
| --- | --- |
| default | 25, including `bash`, `create`, `edit`, `task`, `web_fetch`, `sql`, `skill` |
| `f5-confined-reviewer` | `glob`, `grep`, `skill`, `sql`, `view` |

`skill` and `sql` were never granted and are not read-only in the sense `F4`
established: `skill` loads and runs instruction bundles, and `sql` is a data
access tool. The restriction is real, since 20 of 25 tools do disappear, but it
is not exact, and `assertReviewerTools` would refuse to start a review against
that set. `R1` and `F4` are not negotiable, so this alone ends the option.

**Host-side path confinement does work, for whoever is the host.** In the
inference run the subagent called `view` twice. The harness's own permission
handler approved `checkout/src/cart.js` and rejected the file outside the
checkout, and the subagent reported the refusal as a `caveat` limitation. So the
confinement mechanism itself is sound on this surface; the plugin just is not
the party that gets to apply it.

One gap: the run detail reported the subagent's `agentType` as
`general-purpose` even though the call passed `agent: "f5-confined-reviewer"`,
so the probe did not confirm that the custom agent's grant reached the subagent
rather than the session default. The subagent used no shell or write tool and
reported none available, but that is its own account, not runtime evidence. The
leak measured above settles the question either way.

### Q2: the implicit retry. Cheaper than documented, and wasted

The documentation states that a `schema` call "retries once on a parse or match
failure, so it may spawn twice, and both spawns count toward
`maxTotalSubagents`". That was **not** reproduced.

The probe forces a guaranteed schema failure with a deliberately unsatisfiable
schema: `verdict: { allOf: [{ type: "string" }, { type: "integer" }] }`. `allOf`
is honoured structurally and no value is both, so no attempt can match. The run
consumed `subagents: 1` and reported `totalSpawnedAgentCount: 1`. The retry is
not a second spawn and does not consume a second `maxTotalSubagents` slot; the
CLI runtime carries a schema-repair message path, which is consistent with a
further turn inside the same subagent, though the run detail does not expose
that directly.

The cost is not the spawn count, it is the waste. The failing run still charged
**4.208880 credits** and returned nothing at all. A reviewer whose output fails
the schema is billed for its whole turn and yields no candidate, no limitation
and no reason.

### Q3: failure semantics. `null` is the only signal, and it carries no reason

Demonstrated, and worse than the roadmap assumed.

The forced failure resolved `null`, so a factory body can tell failure from an
empty result and keep coverage incomplete. Nothing else reports it:

- the run envelope settled `status: "completed"`, with `error`, `failure` and
  `reason` all absent;
- `terminal` carried only a `resultPreview`;
- the agent summary reported the failed subagent's `status` as `"completed"`;
- progress records carry only the factory's own `phase` and `log` lines, since
  `FactoryLogLineKind` is exactly `"log" | "phase"`, so no runtime failure
  reason reaches them either.

Incomplete coverage therefore stays visible only because the orchestrator writes
it that way. The shipped reviewers today record a specific reason for every
incomplete reviewer, from `runReviewer`'s error text; on this surface that reason
does not exist. A migration would have to degrade every schema failure to an
unexplained "reviewer produced no usable output", which is weaker reporting than
the current `envelope` rejection, whose diagnostic at least names the parse
error.

### Q4: code structure. Yes, and the premise was wrong

The "emitted verbatim into a generated module, closes over nothing, cannot use
static imports" constraint belongs to the `factories_manage` authoring path,
where a model writes a factory into a session-scoped extension at runtime. An
**extension-authored** factory is an ordinary closure: the SDK calls
`definition.run(context)` directly, in the extension process.

The probe's factory body demonstrated all of it in a run that spawned no
subagent and spent nothing, `consumed: { subagents: 0, nanoAiu: 0 }`:

- It read a module-scope constant defined outside the body and saw a statically
  imported binding, so the body does close over its module.
- It dynamically imported `modes.mjs`, `findings.mjs`, `read-only.mjs`,
  `review.mjs` and `fixture.mjs` from the shipped extension, with no failures,
  and called into them: `reviewMode("balanced")`, `describePolicy`,
  `candidateFormat` (2861 characters), `reviewInstructions` (4674 characters)
  and `readOnlyTools`.
- It replayed the defect `F5` exists to settle, through the shipped parser and
  with no inference: the plain envelope produced no diagnostic, and the same
  envelope inside a ```` ```json ```` fence produced
  `probe: invalid candidate output: SyntaxError: Unexpected token '`'`.

Orchestration code being reachable is not an obstacle. `F5`'s fourth question is
answered yes.

### What structured output would have bought

Worth recording, because it is the one clearly positive result. With
`schema` set to the shipped candidate envelope, `claude-sonnet-5` returned a
parsed object, not text: `schemaVersion: 2`, the supplied `reviewKey`, one P1
candidate with a full citation set quoting the file it read, and three `caveat`
limitations recording the refusals. `JSON.stringify` of that value feeds the
existing `envelope` unchanged. The fence problem does disappear at the source on
this surface, for the same model that caused it.

The mechanism is worth noting for whatever fix is chosen: the CLI runtime
implements `schema` by instructing the model to put a single JSON value between
two explicit markers, telling it that the text between them must be raw JSON
with "no code fences, no comments, no trailing prose", and then extracting
between the markers. Structured output here is delimiter-based extraction, not
constrained decoding.

### Recommendation: fall back to the narrow fence unwrap

Adopting structured output is not viable on CLI 1.0.83, and the blocking reason
is not the retry or the failure semantics. It is that the surface cannot be
reached, and that even with the gate forced open the confined `view`/`grep`/
`glob` grant cannot be held exactly, while the permission handler that confines
reads cannot be registered at all. `F4` and `R1` are not negotiable, so this
option is closed until GitHub ships per-subagent tool grants and an
extension-registrable permission handler, and lifts the feature flag.

The recommendation is therefore the fallback: a follow-up increment that strips
one opening fence and its matching closing fence, only when they wrap the entire
response, and changes nothing else. No prose stripping, no substring search, no
brace matching, no repair. Everything after the parse stays exactly as it is:
the exact-key check, the schema version and review-key binding, the citation,
quote and changed-line gates, adjudication, deduplication and the findings
policy.

**What that costs, plainly.** `SCOPE.md` drops "experimental malformed-output
finding extraction" from v1, and a fence unwrap sits next to that line. The
distinction it relies on is that the dropped item is mining a non-conforming
response for findings, whereas an unwrap removes a known, exactly delimited
wrapper and then parses as strictly as before: a response with prose around the
fence, a truncated object, or two fenced blocks still fails whole, as today. The
distinction is real but it is a matter of degree, and the boundary cannot be
defended on principle. The next model that adds one sentence before the fence
will produce the same wasted review and the same request to tolerate a little
more. Three separate instructions already tell reviewers to emit no fences and
`claude-sonnet-5` ignored all three, so prompt strengthening is not an
alternative.

**The choice is the user's.** If that cost is unacceptable, the alternative that
keeps `SCOPE.md` intact is to leave `envelope` strict, keep the README's
recommendation of GPT-family reviewer tiers, and treat a Claude-family tier as
unsupported until the runtime surface changes. A third shape exists and is not
the recommendation: adopt the runtime's own technique in our prompts, asking
reviewers to emit the envelope between two explicit markers and extracting
between them. It needs no experimental API and is stronger than an unwrap, but
it is a larger change to the reviewer contract than `F5` was asked to propose.

### Pull request #6 and its review

`F5` landed on branch `f5-structured-output-spike` and pull request #6. The
installed plugin reviewed it once, in **balanced** mode, named explicitly rather
than taken as the default: `F5` changes no mode, so the default topology is the
right one to exercise, and quick would have dropped two specialists for no
reason.

```sh
gh pr checkout 6
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 6 --balanced --all --no-comment
```

Reviewed head `2c725bd`, base `ccb0094`, three files, 848 additions and one
deletion. Five reviewers plus one adjudicator, every tier from saved personal
configuration:

| Reviewer | Tier | Model | Effort | Outcome |
| --- | --- | --- | --- | --- |
| correctness | heavy | `gpt-5.6-terra` | high | invalid candidate output |
| contracts | heavy | `gpt-5.6-terra` | high | completed |
| security | heavy | `gpt-5.6-terra` | high | completed |
| performance-resources | heavy | `gpt-5.6-terra` | high | no usable output |
| overview | light | `gpt-5.6-luna` | high | completed |
| evidence-validator | heavy | `gpt-5.6-terra` | high | completed |

Coverage was **incomplete**, so this is not a clean-review claim. Reviewers made
37 confined tool calls and 36 reads. Two reads were rejected by the permission
handler, one from `correctness` and one from `performance-resources`; those are
the first read denials any live review has produced, and they landed on the two
reviewers that then failed. No tool denial occurred. Cost: **79.238565 credits**.
Nothing was published.

Two findings were validated, both P2, both real, and both fixed on the branch:

- `overview:1`: the `--spend` reproduction command recorded above put a literal
  `...` between the environment assignment and `node`, so a shell would try to
  execute `...`. The command now sets both paths explicitly.
- `contracts:2`: the increments table said `F5` was Completed while the "Exact
  next increment" section still instructed the next agent to carry out `F5`. That
  section is now rewritten.

Nothing was rejected as a false positive. Four diagnostics kept coverage
incomplete: `correctness`'s invalid output, `performance-resources`'s empty
output, and two candidates rejected at the evidence boundary for citations that
did not match a supplied context window, from `contracts` and `overview`. One
coverage gap and two informational caveats recorded that the probe's live
runtime results cannot be verified from the captured diff alone, which is
accurate: they are reproducible only by running the probe.

**One diagnostic is direct evidence about `F5`'s own recommendation.**
`correctness` was discarded with `invalid candidate output: SyntaxError:
Unexpected token 'I', "I'll trace"... is not valid JSON`. That is a GPT-family
reviewer emitting prose before its JSON, not a fence. The narrowly specified
fence unwrap this increment recommends would **not** have recovered it. So the
fallback is narrower than the problem: it addresses the Claude-family fence seen
on pull request #5 and leaves prose-prefixed output failing exactly as it does
today. That strengthens the case for the marker-delimited variant noted above,
and it is a fact the user should weigh when making the choice.

### Remaining limitations

- Evidence is macOS arm64, Copilot CLI 1.0.83 and its bundled SDK, Node 26.1.0,
  on this host and account. The feature flag's default may differ elsewhere.
- The inference half ran once, on one model, on a four-line fixture. It measures
  the surface, not review quality.
- Whether the custom agent's grant applied to the factory subagent itself was
  not confirmed; see the gap noted under `Q1`.
- The one-retry behaviour was measured only through spawn counts and charges.
  The probe did not observe the repair turn directly.

## Completed increment: F6

`F6` is the decision `F5` left open. The user chose **both** recorded options
that change something: reviewers are now asked to emit the envelope between two
explicit markers, **and** code unwraps that delimiter pair deterministically,
with the narrow fence unwrap kept as a second safety net. Option 3, changing
nothing, was not taken.

The reason for taking both is in `F5`'s own evidence. Asking for markers is the
technique the CLI runtime's `schema` implementation uses, and it is what made
`claude-sonnet-5` return a clean payload in the `F5` probe, but a prompt is a
request, not a guarantee: three separate instructions already told reviewers to
emit no fences and `claude-sonnet-5` ignored all three. The unwrap is what makes
the contract survive a model that half-follows it.

### What changed, and what did not

Implementation: `extensions/pr-review/findings.mjs` only. Two exported markers,
one shared contract paragraph in both output formats, and two small unwrapping
functions in front of the single `JSON.parse` call in `envelope`.

The contract, appended to the reviewer format and to the adjudicator's
instructions, is three lines:

```
Put the JSON object between the markers <<<PR_REVIEW_JSON>>> and <<<END_PR_REVIEW_JSON>>>, each alone on its own line.
Between the markers emit raw JSON only: no code fences, no comments, no prose, and nothing after the object.
Emit each marker exactly once. Text outside them is discarded unread, and a repeated or missing marker discards your whole output.
```

The unwrap is two ordered steps, both refusing to guess:

- **Delimited payload.** A marker counts only when it is the whole line, exactly
  as the contract asks. If one line is the opening marker, one later line is the
  closing marker, and each occurs once, the lines between them are the payload.
  Any other count or order returns the response unchanged. Marker text inside the
  JSON is payload, not a second wrapper, which matters because every citation of
  the lines that define these markers carries them; the review of this increment's
  own pull request demonstrated that the hard way, recorded below.
- **One whole-response fence.** If what remains starts with ```` ``` ```` and
  ends with ```` ``` ````, the opening fence's info string is a bare label with
  no whitespace or backtick, and no further line inside starts a fence, one
  opening fence and its matching closing fence are stripped. This runs after the
  marker step, so it also removes a fence a model puts *inside* the markers, and
  a backtick run inside a JSON string is payload for the same reason a marker
  there is.

Everything after that is untouched, and the controlled suites assert it: the
exact-key check, the schema version and review-key binding, the citation, quote
and changed-line gates, adjudication, deduplication and each mode's findings
policy all apply to the unwrapped payload exactly as they applied to a bare
response. No reviewer moved, no mode, configuration key, fallback, timeout,
safeguard or gate override was added, `L1` stays pending and no upstream source
was copied.

### What still fails whole

The tolerance is exactly two known wrappers. There is no prose stripping, no
substring search for a brace, no brace matching and no repair, and the suite
pins each of these as a discarded output rather than a recovered one:

| Reviewer output | Outcome |
| --- | --- |
| Prose, then a bare JSON object, no markers | Discarded |
| A fenced block followed by a closing sentence | Discarded |
| Two fenced blocks | Discarded |
| An opening marker with no closing marker | Discarded |
| A closing marker before the opening one | Discarded |
| A marker sharing its line with prose or JSON | Discarded |
| Two complete marker pairs | Discarded |
| A truncated object between the markers | Discarded |
| Nothing between the markers | Discarded |
| A single-backtick span around the object | Discarded |
| A delimited object with the wrong review key, an extra field, or `null` | Discarded at the unchanged gates |

Recovered, and asserted to still satisfy every later gate: a delimited envelope;
a delimited envelope with prose before and after it; a fence inside the markers;
a whole-response ```` ```json ```` fence; a whole-response bare fence; a
delimited envelope with surrounding whitespace; and a bare object with no
wrapper at all, which is what every passing reviewer emits today.

**The cost against `SCOPE.md`, restated.** `SCOPE.md` drops "experimental
malformed-output finding extraction" from v1. The marker half does not touch
that line: conforming output now *includes* the markers, so reading between them
is parsing the contract, not mining a non-conforming response. The fence half is
the one that sits next to the dropped item, and `F5`'s judgement of it stands
unchanged: it removes a known, exactly delimited wrapper and then parses as
strictly as before. That distinction is real but remains a matter of degree, and
the boundary is now written down as a table of what is refused rather than left
to a later reading.

### Controlled evidence

Test-first: the assertions were added to `scripts/smoke-findings.mjs` before the
implementation and failed on the missing exports. With the contract and the
unwrap in place they pass, and reverting just the `envelope` call to
`JSON.parse(raw)` fails them again on the first delimited case, so they test the
unwrap rather than passing incidentally.

All twelve controlled suites pass on this branch, and `git diff --check` is
clean. They need no network and no inference:

```sh
for s in findings review selection retention preview publication publish-later \
         checkout config context fixture target; do node scripts/smoke-$s.mjs; done
git diff --check
```

The installed no-inference probe was rerun after the fix, against a plugin
reinstalled from this checkout, and passed: `smoke-runtime.mjs --targets
--startup` settled `--balanced` and `--full` dispatch and the owned-runtime
start, ping and stop with no model turn, subagent or tool execution. The other
installed probes were last rerun on pull request #5; this increment changes
`findings.mjs` only, and none of them exercises it.

Two pre-existing assertions are worth naming because they did not change
outcome: a fenced `{}` and a fenced empty adjudication were already asserted to
be discarded, and they still are. The unwrap now removes their fence, and the
exact-key check then rejects the payload for the reason it always should have
given.

### Pull request #7 and its review

`F6` landed on branch `f6-reviewer-output-contract` and pull request #7. The
installed plugin reviewed it once, in **full** mode, named explicitly rather than
taken as the default. Full is the only mode that assigns the medium tier, and the
saved medium model is `claude-sonnet-5`, the model whose fenced output on pull
request #5 started this whole line of work. Balanced would have exercised the new
contract on GPT-family reviewers only and left the fence half untested.

```sh
gh pr checkout 7
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 7 --full --all --no-comment
```

Reviewed head `b8e5bc4`, base `a6f7c1c`, four files, 28002 diff bytes. Six
reviewers plus one adjudicator, every tier from saved personal configuration:

| Reviewer | Tier | Model | Effort | Reads | Outcome |
| --- | --- | --- | --- | --- | --- |
| correctness | heavy | `gpt-5.6-terra` | high | 3 | invalid candidate output |
| contracts | heavy | `gpt-5.6-terra` | high | 7 | invalid candidate output |
| security | heavy | `gpt-5.6-terra` | high | 0 | completed |
| performance-resources | heavy | `gpt-5.6-terra` | high | 0 | completed |
| overview | light | `gpt-5.6-luna` | high | 0 | invalid candidate output |
| conventions-maintainability | medium | `claude-sonnet-5` | medium | 4 | invalid candidate output |
| evidence-validator | heavy | `gpt-5.6-terra` | high | 0 | completed |

Coverage was **incomplete**, so this is not a clean-review claim. Fourteen
confined tool calls and fourteen reads, no permission denial and no tool denial,
unlike pull request #6. One P2 was validated and selected; nothing was withheld,
nothing was rejected as a false positive, there were no coverage gaps and one
informational caveat. Cost: **124.2079 credits**. Nothing was published.

**The contract half worked, on every model that was asked.** Five of the six
reviewers put the envelope between the markers, on their own lines, including
`claude-sonnet-5`, which emitted one line of prose (`Confirmed line numbers
(114-119 = delimited function).`) and then a correctly delimited envelope with no
fence anywhere. That is the failure from pull request #5 gone, and the
prose-prefix failure from #6 tolerated, in the same run. The light reviewer
`gpt-5.6-luna` ignored the markers and emitted a bare JSON object, which is
exactly what the strict floor exists for.

**The unwrap half was defective, and the review proved it by failing.** Four of
six reviewers were discarded, all for one reason: `delimited` counted marker
*substrings*, and this pull request adds the lines that define the markers, so a
reviewer citing those lines carried the marker text inside its own JSON. The
count then exceeded one, the wrapper was left in place, and `JSON.parse` rejected
the response at its opening marker.

`security:1`, P2 at confidence 0.93, is that defect, and the adjudicator accepted
it with independent source evidence:

> Rejecting marker text inside an otherwise valid review payload enables
> PR-controlled review suppression. An untrusted PR adds either marker literal to
> a changed source line, and a reviewer emits an otherwise valid marked envelope
> whose required exact citation quotes that line using the literal text.

Two further reviewers found the same defect independently, and both were
discarded by it before adjudication could see them: `correctness` proposed
"Require marker lines rather than marker substrings" (P3, 0.94) and `contracts`
proposed "Enforce the advertised line boundaries for delimiter markers" (P3,
0.96). `conventions-maintainability` reported it too, as a P2. Three of the four
discarded reviewers were discarded by the very defect they were reporting.

**What changed in response.** A marker now counts only when it is the whole
line, which is what the contract already advertised and what the discarded
candidates recommended. The fence check moved the same way: a further fence only
disqualifies the wrapper when its backtick run starts a line, so a backtick run
inside a JSON string is payload. `scripts/smoke-findings.mjs` gained cases for
marker and fence text inside the payload, and for a marker sharing its line,
which is now discarded; reverting to substring counting fails them.

Nothing was rejected as a false positive, and no gate was weakened. The one
finding was fixed rather than argued with.

**Replaying the run against the fix.** The six reviewer outputs were saved
verbatim from the run log and re-parsed by both the substring version and the
line-exact one. No inference and no network: the strings are what the runtime
returned.

| Reviewer | Bare marker lines | Marker substrings | Substring parser | Line-exact parser |
| --- | --- | --- | --- | --- |
| performance-resources | 1 / 1 | 1 / 1 | parsed | parsed |
| security | 1 / 1 | 1 / 1 | parsed | parsed |
| contracts | 1 / 1 | 2 / 2 | discarded | parsed |
| conventions-maintainability | 1 / 1 | 3 / 2 | discarded | parsed |
| overview | 0 / 0 | 1 / 1 | discarded | parsed as a bare object |
| correctness | 1 / 1 | 2 / 2 | discarded | discarded |

Five of six parse under the fix, against two of six as reviewed. `correctness`
stays discarded for an unrelated reason that is the strict floor working: its own
JSON is malformed, ending `throw new Error(\"Expected result arrays.\"}]}]`. A
truncated object must fail whole, and it does.

That replay is verification of the fix, not a second live review. Whether the
same six models would produce five usable outputs on a fresh run is not
demonstrated, and rerunning the review needs its own authorization.

### Remaining limitations

- Controlled evidence proves the parser and the prompt text, not model
  behaviour. Whether reviewers actually emit the markers is only observable in a
  live run, and no model was ever asked for them before this increment.
- The markers are literal text in an untrusted context. A pull request whose
  content contains them cannot forge findings: the review-key binding and every
  citation gate are unchanged. It can no longer discard a reviewer that cites
  them either, because a citation is a JSON string and cannot produce a bare
  marker line. What remains is narrower: a reviewer that reproduces a marker as a
  whole line in its own prose, outside the JSON, still discards its own output.
- The fix for that defect is verified by the controlled suites and by replaying
  the six captured reviewer outputs, not by a second live review. Rerunning the
  review needs its own authorization.
- A model that emits neither markers nor a wrapper is unaffected: today's
  passing reviewers keep passing on exactly the path they use now.

## Completed increment: M2

Implementation: `extensions/pr-review/modes.mjs`, `review.mjs` and
`extension.mjs` wording. Probes: `scripts/smoke-review.mjs`,
`smoke-findings.mjs`, `smoke-checkout.mjs` and `smoke-runtime.mjs`. No upstream
source was copied. No fallback, timeout, safeguard, reviewer shell tool, gate
override, configuration key or interactive menu was added, and no user checkout
was altered to satisfy the revision gate. `L1` remains pending.

### Mode boundary

`--deep` declares **one** reviewer, `integrated`, on the **heavy** tier, and
that single declaration is the whole topology: deep resolves no light and no
medium tier at all. Its focus is the whole pull request as one change,
correctness, API and data contracts, security, performance and resource
lifetime and whole-change coherence together, including the interactions between
them that no single-focus reviewer sees.

Deep is the only mode declaring `holistic: true`, and two pieces of reviewer
text read that flag rather than inferring intent from the reviewer count:

- The instructions cast the reviewer as this pull request's only reviewer rather
  than a specialist, add that no specialist covers any part of the change and
  that consequences appearing only across the changed files are its own, and ask
  it to say so **for the whole change** when nothing is supported, instead of
  for an assigned focus.
- The prompt heads the assignment `Assigned reviewer: integrated. You are this
  review's only reviewer.` rather than `Assigned specialist: ...`.

Nothing else about deep is special, and that is deliberate. Its findings policy
is full's: the same severities, `minorCap` declared `Infinity`, so every
substantiated P3 and nit is presented, `capped` stays empty and a duplicate of a
presented minor finding stays an ordinary alias. Every evidence rule is shared
code that never learned about deep: the marker contract and its unwrap, the
exact-key check, the schema version and review-key binding, the citation, quote
and changed-line gates, adjudication, deduplication, selection, retention and
the publication gates. The adjudicator is still a separate zero-tool heavy
session, so deep does not become one model judging its own candidates.

Balanced remains the default when no mode flag is given, mode flags remain
mutually exclusive, `--major-only` remains the quick alias, and quick, balanced
and full are untouched.

One refactor rode along, on green and in its own commit: `mode.specialists`
became `mode.reviewers`, because deep's one reviewer is deliberately not a
specialist. It is a pure rename across `modes.mjs`, `review.mjs`,
`retention.mjs`, `retention-fixture.mjs` and `smoke-review.mjs`, with no
declaration, tier, policy or consumer behaviour change.

### Controlled evidence

Test-first: every assertion below was added before the implementation and failed
on the missing `reviewModes.deep` export, `--deep` being rejected as an
unsupported target argument, and the missing holistic wording. Setting deep's
`holistic` to `false` still fails the reviewer-instruction assertions, so they
test the flag rather than passing incidentally.

All twelve controlled suites pass on this branch, and `git diff --check` is
clean. They need no network and no inference:

```sh
for s in findings review selection retention preview publication publish-later \
         checkout config context fixture target; do node scripts/smoke-$s.mjs; done
git diff --check
```

New demonstrations, all without inference or network access:

- Mode parsing: `--deep` alone, with `--all --comment`, with `--include-drafts`
  and with `heavyModel=`/`heavyEffort=`; `--deep` rejected against `--quick`,
  `--balanced`, `--full` and `--major-only`; `--deep --deep` rejected as a
  duplicate; `--deep` rejected with `--capture-only` and with conflicting posting
  flags; and `--deep ... lightModel=`/`mediumModel=` rejected as invalid review
  settings, exactly as the other modes reject them.
- Topology and tiers: deep resolves exactly one heavy reviewer named
  `integrated`. An unconfigured tier falls back to the ambient assignment; a
  configured light tier never reaches it; invocation flags win over saved
  settings; and an unusable heavy model refuses the review with no substitution.
  Its effective-assignment display reads `deep mode, 1 reviewer(s)`, carries the
  uncapped findings-policy text, shows exactly one assignment line, and contains
  no `[light]` or `[medium]` line.
- Reviewer text: the deep instructions keep every boundary the other modes state
  (untrusted data, the three confined tools, no repository-wide audit, citations
  from bound context, no writes or commands) while dropping the specialist
  framing, and the deep prompt names its one reviewer and carries the
  whole-change focus. Quick, balanced and full still say `specialist` and still
  scope a null result to the assigned focus.
- A settled deep run through `executeReviewRun`: one integrated reviewer session
  plus one adjudicator, both on the heavy tier, `M2 binding:` and `M2 evidence:` markers,
  one accepted `nit` finding presented with `capped` empty, selection of it, and
  a proposed body reading `Deep review: 1 selected validated finding(s)`.
- Findings policy at unit level: two minor candidates from the single
  `integrated` reviewer are both presented in declared severity order, nothing
  is capped, and `formatFindings` labels the result `Deep review`. The same two
  candidates are still admitted by no quick policy at all.
- Retention: a deep record validates, and relabelling it `balanced` or `full` is
  rejected as incomplete reviewer coverage, because one reviewer cannot satisfy
  their topology; relabelled `quick` it is rejected for a severity outside that
  policy.
- The checkout gate refuses with deep's own label and fixing command
  (`Deep review refused ...`, `rerun /pr-review 12 --deep`), on the same evidence
  as quick, balanced and full.

### Installed-plugin evidence

The extension was reinstalled with `copilot plugin install "$(pwd)"` at the pull
request head before the probe, and again before the review. No probe below sent
a model prompt.

`smoke-runtime.mjs --targets --startup` passed. The draft-skip loop now
dispatches **four** modes and asserts for each a settled `coverage:
"not-started"` result, one assignment line per reviewer (three, five, six and
one), and that no reviewer started. For `--deep` it additionally asserts the
`integrated [heavy]` line with a resolved model, effort and origin, the
findings-policy text `P0-P2 findings, plus every substantiated P3/nit finding`,
and that the display contains no `[light]` or `[medium]` line at all.

`123 --deep --no-comment` left the unsupported-arguments list, because it now
parses; `--verify` took its place there, since `V1` is still pending. New
installed rejections without inference: `--balanced --deep`, `--deep
--major-only`, `--capture-only --deep`, `--deep --no-comment --comment`, `--deep
... mediumModel=missing-m2-model`, `--deep ... heavyModel=missing-m2-model` and
`--deep ... heavyEffort=invalid-effort`. Each returns an explicit command error
and starts no reviewer.

The other installed probes were last rerun on pull requests #5 and #7. This
increment adds a mode declaration and reads a flag in two instruction strings;
`smoke-reviewer-tools.mjs` and `smoke-retention-runtime.mjs` exercise neither.

### A defect this increment found in the dogfood runner

`scripts/dogfood-review.mjs` waited for a hardcoded `Q3 evidence: ` or `M1
evidence: ` line before reporting an outcome. Deep labels its evidence `M2`, so
the runner would have printed the entire review timeline, including the findings,
and then waited forever on a promise nothing could resolve. It was found by
reading the runner before spending anything, not by the review.

The fix derives the prefixes from the mode declarations, so the runner now waits
for whatever prefix the mode it dispatched actually emits, and a future mode
cannot desynchronise it. The same class of drift appeared twice more in this
increment and both were fixed here: the configuration inspector's tier note named
quick, balanced and full only, and `smoke-config.mjs` now asserts that the note
names every declared mode.

### Live inference: the deep review of pull request #8

`M2` landed on branch `m2-deep-mode` and pull request #8. The installed plugin
reviewed it once, in **deep** mode, named explicitly rather than taken as the
default. Deep is the mode this increment adds, so exercising it is the point,
and it is also the cheapest topology in the tool: one reviewer plus the
adjudicator.

```sh
gh pr checkout 8
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 8 --deep --all --no-comment
```

Reviewed head `8fd8348`, base `88e3768`, twelve files, 52846 diff bytes. One
reviewer plus one adjudicator, both from saved personal configuration:

| Reviewer | Tier | Model | Effort | Reads | Outcome |
| --- | --- | --- | --- | --- | --- |
| integrated | heavy | `gpt-5.6-terra` | high | 11 | completed |
| evidence-validator | heavy | `gpt-5.6-terra` | high | 0 | completed |

Coverage was **completed**, which no earlier review of this project's own
increment pull requests had reached: #3, #4, #5, #6 and #7 were all incomplete,
four of them because a reviewer's output was discarded. Eleven confined tool
calls and eleven reads, no permission denial and no tool denial. Two findings
were validated and selected, nothing was withheld, nothing was rejected as a
false positive, there were no coverage gaps and one informational caveat. Cost:
**68.27393 credits**, the cheapest review this project has run, against 124.2079
for six full reviewers on a four-file pull request and 276.266849 for six on a
thirteen-file one. Nothing was published.

**The `F6` contract held, live, on a second run.** Both sessions emitted the
envelope between the markers, each on its own line, and both parsed. That is the
first live evidence since `F6`'s fix that the marker contract works on a fresh
run rather than only on replayed strings, though one `gpt-5.6-terra` reviewer and
one adjudicator is a narrower test than #7's six models.

**What the reviewer read.** It opened with two `rg` searches for the renamed
field and the mode declarations, then read `review.mjs`, `retention.mjs`,
`checkout.mjs`, `findings.mjs`, `extension.mjs` and `retained-run.mjs`, in
ranges, and searched for the specialist wording across the repository. That is a
reviewer using the checkout to establish how the renamed field is consumed
everywhere, which is exactly what the whole-change assignment asks for and what a
per-file specialist has no reason to do.

**Findings, and what changed.** Both were accepted and both were real defects in
this pull request's own documentation. Neither is a code defect, which is the
same limitation every live review here has had: this remains a
documentation-heavy pull request.

- `integrated:1`, P3 at confidence 0.98, on the roadmap's increments table: the
  change marked `M2` in flight while the `Exact next increment` section still
  told the next agent to implement deep mode. Fixed: that section is rewritten
  below.
- `integrated:2`, nit at confidence 0.96, on the new `M2` controlled-evidence
  section: it described the settled deep run as `one specialist session plus one
  adjudicator`, contradicting the mode boundary a few paragraphs above, which
  exists precisely to distinguish deep's integrated reviewer from a specialist.
  Fixed: it now says one integrated reviewer session.

Nothing was rejected as a false positive, and no gate was weakened. The one
informational caveat is honest and worth keeping: the reviewer noted that it
could only read the captured diff and checkout, and could not execute the
installed runtime to demonstrate deep mode itself.

### Remaining limitations

- Deep's holistic instruction is a prompt, and a prompt is a request. That the
  reviewer actually read across files is visible in its eleven reads on this run;
  whether a holistic reviewer systematically finds cross-cutting defects that the
  parallel specialists miss is not demonstrated by one run on a
  documentation-heavy pull request, and cannot be until a review of any mode runs
  against a substantial code diff.
- One run is one sample. Completed coverage here does not establish that deep
  reaches completed coverage in general; it establishes that it did once, with
  one reviewer whose single output parsed.
- Deep is the cheapest mode in this project's records, but the comparison is
  across different diffs, not a controlled one. Cost scales with the diff as well
  as the reviewer count, and no two of these reviews reviewed the same pull
  request.
- Deep resolves the heavy tier only, so a configured light or medium tier has no
  effect on it. That is the declared topology, not an oversight, but it does mean
  `--deep` ignores two thirds of the personal configuration.
- The adjudicator is a separate session on the same tier and, in deep, on the
  same model as the reviewer. It is not the same session and does not see the
  reviewer's reasoning, so this is not self-adjudication, but it is one model
  family checking itself, which is weaker than the cross-model check a mixed-tier
  mode gets.

## Completed increment: C3

Implementation: the optional fallback assignment in
`extensions/pr-review/config.mjs`, its resolution and display in `review.mjs`,
the single attempt in `fixture.mjs`, and its evidence in `coverage.mjs` and
`retention.mjs`. Probes: `scripts/smoke-config.mjs`, `smoke-review.mjs`,
`smoke-retention.mjs` and `smoke-config-runtime.mjs`. No upstream source was
copied. No timeout, safeguard, reviewer shell tool, gate override, mode or
interactive menu was added, and no user checkout was altered to satisfy the
revision gate. `L1` remains pending.

### Configuration boundary

- Six new keys, `<tier>FallbackModel` and `<tier>FallbackEffort` for light,
  medium and heavy, alongside the six primary tier keys and `autoPostReviews`.
  They layer exactly like the others: invocation flags, then a trusted project's
  file, then personal settings.
- **A fallback never inherits from another tier.** Unset means this tier has no
  fallback, not that a neighbouring tier can stand in for it. That is the whole
  point of "optional fallbacks start unset and must be configured explicitly":
  cross-tier inheritance would hand a tier a fallback nobody configured for it.
- An unset `<tier>FallbackEffort` follows that tier's own effective effort,
  reported as source `primary`, and the resulting pair is then validated like any
  other explicit assignment. An effort the fallback model cannot support is
  refused, never lowered; the fix is to set `<tier>FallbackEffort` explicitly.
- `<tier>FallbackEffort` without `<tier>FallbackModel` configures nothing, so
  storing that pair is refused. One that arrives anyway, from a hand-edited file
  or a project file changed after it was trusted, stays inert and is reported in
  the configuration display rather than guessed at.
- A fallback that resolves to exactly this tier's own model **and** effort is not
  a fallback; it is reported `NOT OFFERED` and is never attempted. The same model
  at a different effort still is one.
- Fallbacks have no invocation flag, like `lightModel` and `mediumModel` before
  them. They are configuration only.
- The configuration report prints a `fallback:` line for every tier, so an unset
  one is visibly unset, and states the attempt policy: at most one attempt, only
  for a reviewer whose own execution failed explicitly, never a whole-review
  restart, and never triggered by elapsed time.

### Controlled evidence: the configuration surface

Test-first: every assertion below was written first and failed on the missing
`resolveFallback` and `orphanFallbackEfforts` exports and on the missing display
lines. One of them caught a wrong expectation in the test itself, which was
corrected rather than the code.

`node scripts/smoke-config.mjs` passes, with no network and no inference:

- Fallbacks start unset; configuring a tier does not configure a fallback for it;
  a light fallback is not inherited by heavy and a heavy fallback is not
  inherited by light.
- An unset fallback effort follows the tier's effective effort, including one set
  by an invocation flag; an explicit one is used as configured; a trusted
  project's fallback keeps its own origin label.
- The identical-to-primary case, including one an invocation flag creates.
- Refusals that change nothing: an unavailable, disabled, `auto` or compound
  fallback model; an unsupported explicit fallback effort; a tier effort the
  fallback model cannot support; a fallback model advertising no configurable
  effort at all (the case `C4` existed to allow, and **that one assertion is
  inverted below**: such a fallback is now accepted, while an explicit effort on
  it is still refused); an orphan fallback effort; and the same check on a
  non-heavy tier.
- The display shows one `fallback:` line per tier, the configured line with its
  origins, `NOT OFFERED`, `UNUSABLE`, and the orphan note, plus the attempt
  policy prose; the help text carries the same policy.
- Storing, replacing and clearing a fallback pair through `/pr-review-config`,
  with every refusal leaving the stored file byte-identical.

### Execution boundary

- The fallback is one extra attempt for **one** reviewer, run in place while the
  other reviewers continue. Nothing is restarted, no other reviewer is touched,
  and a reviewer gets at most one fallback attempt whatever happens to it.
- **Only that reviewer's own execution failure is eligible**, meaning the attempt
  settled `incomplete`: a session error, a shutdown before completion, no usable
  output, a forbidden tool call, or usage that did not match the assignment.
  Cancellation is never eligible, and an aborted signal stops a fallback that has
  not started.
- **Elapsed time is never eligible**, because nothing imposes a deadline. A hung
  reviewer never settles, so it is never replaced; that is the constraint
  `SCOPE.md` states, and it falls out of the design rather than being checked for.
- Setup refusals stay refusals. An unusable explicit assignment, a runtime that
  does not retain the assignment, a checkout it will not point at, or a tool set
  it will not enforce still refuses before any reviewer starts, and no fallback
  substitutes for it. The fallback answers a failure during execution, not an
  invalid configuration.
- A fallback attempt is prepared exactly like a primary one: its own session, its
  own catalog validation, the same retained-assignment check, the same working
  directory and the same confined tool set. A fallback that cannot start leaves
  the reviewer with the attempt that actually ran, and says why.
- The adjudicator resolves the heavy tier like any other reviewer, so its own
  explicit failure is eligible for that tier's one fallback attempt too.

### Evidence boundary

The evidence boundary itself is unchanged: the marker contract and its unwrap,
the exact-key check, the schema version and review-key binding, the citation,
quote and changed-line gates, adjudication, deduplication, selection, retention
and the publication gates never learned about fallbacks. What changed is what a
reviewer record says about how it was produced.

- A recovered reviewer's record describes the attempt that produced its result,
  and keeps the failed one in `fallbackFrom`. **A fallback is never invisible**:
  without that field the record would show one completed reviewer on a model
  nobody configured as its primary.
- Coverage adds a non-blocking `caveat` naming both assignments and the primary
  failure, so a recovered reviewer reports completed coverage and still says what
  happened. When the fallback also fails, the reviewer stays incomplete and both
  failures are reported.
- Retention validates the new field as an attempt: the same shape as a reviewer
  minus the label, its status must be `incomplete`, and it must not repeat the
  assignment that just failed. The optional field does not change the record
  schema version, which tracks publication authority.

### Controlled evidence: assignment, execution and retention

Test-first throughout. The execution assertions failed first on a reviewer that
stayed incomplete with no second session, and the evidence assertions on the
missing caveat and on retention rejecting the unknown `fallbackFrom` key.

All twelve controlled suites pass, and `git diff --check` is clean:

```sh
for s in findings review selection retention preview publication publish-later \
         checkout config context fixture target; do node scripts/smoke-$s.mjs; done
git diff --check
```

New demonstrations, none of which start inference or touch the network:

- Assignment: a configured tier fallback reaches every reviewer on that tier and
  no other, so a heavy fallback never reaches balanced's light overview reviewer;
  the light tier's own fallback follows the light tier's effort; deep's single
  integrated reviewer carries the heavy fallback; an unusable fallback refuses
  the review before anything starts; and one made identical by configuration or
  by an invocation flag is not offered.
- Execution: a failed reviewer recovered by its fallback reports completed
  coverage, one extra session, the fallback's model on the record and the primary
  failure in `fallbackFrom`, while the other reviewers keep their own model and
  are not retried. A fallback that also fails leaves the reviewer incomplete with
  both failures and still only one extra session. A fallback that cannot start
  creates no session and leaves the primary attempt as the outcome. A completed
  reviewer and a cancelled run start no fallback at all. The adjudicator's own
  failure gets its tier's one attempt.
- Evidence: a retained record round-trips both attempts, drops the live policy
  object from the failed one, keeps completed coverage, renders the caveat, and
  is rejected when the failed attempt claims to have completed or been cancelled,
  when it repeats the surviving assignment, when it carries a label, or when it
  loses its model.

### User-visible documentation

`README.md` gains a "Configured fallback models (C3)" section stating the whole
policy: one extra attempt for the one reviewer that failed, what is eligible and
what is not, that elapsed time never is, that fallbacks start unset and never
inherit across tiers, that they have no invocation flag, which reviewers a tier's
fallback covers in each mode, and what the timeline, the coverage report and the
retained record show when one is used. The C1 key list now names all six new
keys, the invocation-flag paragraph says there is no fallback flag, and the
runtime boundary names the capability. The extension's own `help` and `status`
text carry the same policy in short form.

### Installed-plugin evidence

The extension was reinstalled with `copilot plugin install "$(pwd)"` at the
branch head before each probe. Neither probe sent a model prompt, so neither
spent Copilot credits. CLI 1.0.83 with its bundled SDK, Node.js 26.1.0,
macOS arm64.

`smoke-runtime.mjs --targets --startup` passed unchanged. It dispatches all four
modes against a skipped draft and asserts their assignment displays; this
increment adds a line to that display only when a fallback is configured, and
that probe configures none, so its expectations are unchanged.

`smoke-config-runtime.mjs` was extended with the C3 surface and passed against
the **installed** plugin with the child-only controlled `gh` fixture:

- Native refusals that left the stored file byte-identical: an unavailable
  fallback model, an unsupported explicit fallback effort, and a fallback effort
  with no fallback model.
- `heavyFallbackModel=<alternate> heavyFallbackEffort=<effort>` stored exactly
  those two keys beside the existing settings. After an extension reload, `show`
  reported the heavy fallback line with `configured:heavy` origins, `(none)` for
  the other two tiers, and the fallback policy prose including the sentence that
  elapsed time alone never triggers one. The reloaded process therefore read the
  stored file rather than run memory.
- A real `/pr-review 2 --deep --no-comment` invocation displayed the fallback
  under the `integrated [heavy]` reviewer and the summary line `Configured
  fallbacks: 1 of 1 reviewer(s) have one`. PR 2 is the fixture draft, so it is
  skipped and no reviewer ever starts.
- A real `/pr-review 2 --balanced --no-comment` invocation displayed `Configured
  fallbacks: 4 of 5 reviewer(s) have one` and exactly four fallback lines, so the
  light overview reviewer really does resolve a tier with no fallback.
- `unset heavyFallbackModel heavyFallbackEffort` restored the rest of the saved
  configuration byte for byte.

Two notes for whoever runs that probe next. It does **not** refuse when a
personal `<copilot-config-home>/pr-review/config.json` already exists, as
`HANDOFF.md` claimed; it fails its first assertion, which expects `not created
yet`. Move the file aside and restore it afterwards. This session did, and
verified the restore with `shasum -a 256`: digest
`30794150a3db740f7dcf6f9d7a5a827d3729c5599f7456f582af735d3f297ea9`, mode `0600`,
before and after. The probe also now needs a **second** usable subscription
model, one that is not the ambient model and advertises a configurable reasoning
effort, because a fallback identical to the tier's own assignment is not offered.

The other installed probes were last rerun on pull requests #5 and #7.
`smoke-reviewer-tools.mjs` and `smoke-retention-runtime.mjs` exercise reviewer
tool confinement and retained-record reload, neither of which this increment
changes; the fallback attempt reuses the same session preparation they cover.

### Live inference: the balanced review of pull request #10

`C3` landed on branch `c3-fallback-models` and pull request #10. The installed
plugin reviewed it once, in **balanced** mode, named explicitly rather than taken
as the default. Balanced because this increment changes no mode, so the honest
choice is the topology users get by default, and because it exercises two tiers:
four heavy specialists and the light overview reviewer.

```sh
gh pr checkout 10
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 10 --balanced --all --no-comment
```

Reviewed head `6ce2a76`, base `3f24920`, twelve files, 89151 diff bytes, 984
additions and 88 deletions. Five reviewers plus one adjudicator, all from saved
personal configuration:

| Reviewer | Tier | Model | Effort | Reads | Outcome | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| correctness | heavy | `gpt-5.6-terra` | high | 18 | completed | 57.14420 |
| contracts | heavy | `gpt-5.6-terra` | high | 21 | completed | 53.84692 |
| security | heavy | `gpt-5.6-terra` | high | 9 | completed | 41.80955 |
| performance-resources | heavy | `gpt-5.6-terra` | high | 5 | completed | 39.93555 |
| overview | light | `gpt-5.6-luna` | high | 32 | completed | 7.77092 |
| evidence-validator | heavy | `gpt-5.6-terra` | high | 0 | completed | 32.68945 |

Every session completed and every output parsed, so **the `F6` marker contract
now has live evidence from a third run**, and this one is the widest: six
sessions across two model families in one review. Eighty-five reads and
seventy-nine confined tool calls, **no permission denial and no tool denial**.
Cost: **233.19659 credits**. Nothing was published.

Coverage was **incomplete**, on six blocking issues: four coverage gaps and two
candidates rejected at the evidence boundary. One finding was validated and
selected, nothing was withheld, nothing was rejected by the adjudicator as a
false positive, and one informational caveat was recorded.

**The four coverage gaps are all the same true observation**, reported
independently by correctness, contracts, security and performance-resources: the
fallback execution path has controlled coverage only, and no installed-runtime
review has ever watched a reviewer actually fall back. That is exactly right, and
it is recorded as this increment's first remaining limitation rather than argued
with. It is also a fair test of the consolidation rule added earlier: the four
were **not** consolidated, because they share no backticked identifier.

**Findings, and what changed.**

- `correctness:1` / `contracts:2`, P3 at confidence 0.99, deduplicated into one
  finding reported by both: the trusted-project section still said a project file
  carries "the same seven keys and no others", while this increment made the
  supported set thirteen. Fixed in `README.md` and in `C2`'s roadmap section, by
  deriving the sentence from the key list rather than restating its size. This is
  the fourth time a stale enumeration has been the defect a review of this
  project found, and the first time it was a **count** rather than a list.

**Rejected at the evidence boundary, and what that cost.** Both of the overview
reviewer's candidates were discarded before adjudication, neither for being
wrong:

- `overview:2` was the same key-count defect the two heavy reviewers found, with
  a citation that did not exactly match a supplied context window. No loss: the
  finding survived through the other two.
- `overview:1` was a **P2 at confidence 0.95 that nothing else found**, discarded
  because its introduction citations and its location did not identify the same
  changed hunk. Its substance is real and is recorded below and as increment
  `C5`. This is the third pull request on which the changed-line anchoring rule
  has thrown away a true finding, and the first on which it threw away the most
  valuable one in the review.

### Remaining limitations

- **No fallback attempt has ever run live.** Four reviewers said so in their own
  words, and they are right. The attempt, its second session, its confinement,
  its usage check and its recovery are demonstrated only against test doubles;
  the installed evidence covers the configuration and display surface. A live
  demonstration needs a reviewer that fails on demand in a real run, which
  nothing in this repository can arrange without weakening a gate.
- **A discarded output is not eligible, and that is the most common real
  failure.** Eligibility is tied to how the reviewer's execution settled. A
  reviewer that returns text the evidence boundary cannot parse settles as
  `completed`, so it gets no fallback, even though its output is discarded and
  its coverage is lost; an empty response does get one, because it fails during
  execution. Four of this project's own live reviews were incomplete for exactly
  the reason a fallback cannot answer. `overview:1` found this and the anchoring
  rule discarded it; it is increment `C5`, and it was deliberately not fixed
  here, because the retry decision has to move across the evidence boundary this
  increment deliberately did not touch: envelope validation happens in
  `findings.mjs` after every reviewer has settled, so the attempt would run after
  the batch rather than beside the reviewer that failed, collection would have to
  run twice, and what `completed` means would change for every mode whether or
  not a fallback is configured. That is its own increment, with its own tests and
  its own live review.
- A setup failure still fails the whole review rather than one reviewer. If
  `createSession` or one of the assignment checks throws while reviewers are
  being prepared, no reviewer starts and no fallback applies. That is deliberate,
  but it means a transient failure at preparation time is not covered.
- A fallback identical to the tier's own assignment is dropped rather than
  refused at configuration time, so `show` is the only place that says so. A user
  who configures one and never runs `show` sees `NOT OFFERED` only in the
  pre-execution report.
- The fallback effort inherits the tier's own effort when unset, so a fallback
  model advertising no configurable effort at all cannot serve a tier that has
  one. That is the same defect `C4` exists to fix, now on a second surface.
  **Fixed by `C4` below**, on both surfaces at once.
- One run is one sample. That this review reached completed execution on all six
  sessions says nothing about how often a reviewer fails in general, and
  therefore nothing about how often a fallback would fire.


## Completed increment: C4

Implementation: tier and fallback resolution in
`extensions/pr-review/config.mjs`, one catalog reading in `fixture.mjs`, and the
model catalog threaded through `review.mjs`. Probes: `scripts/smoke-config.mjs`,
`smoke-review.mjs`, `smoke-fixture.mjs` and `smoke-config-runtime.mjs`. No
upstream source was copied. No configuration key, invocation flag, timeout,
safeguard, reviewer tool, gate override or mode was added, the evidence boundary
was not touched, and no user checkout was altered. `L1` remains pending.

### Resolution boundary

- **A tier whose resolved model advertises no configurable reasoning effort
  resolves to no effort.** It no longer takes the effort a neighbouring tier, a
  trusted project or the ambient session would supply, because that effort is
  not one the model can hold. Before this, a model like `claude-haiku-4.5` could
  not serve a tier at all whenever any effort reached it, which in practice meant
  whenever any other tier was configured.
- The dropped effort reports origin `model`, one more label beside `flag`,
  `project:`, `project-inherited:`, `configured:`, `inherited:`, `ambient` and
  `unset`. It renders as `reasoning=(not configurable) [model]`, so the display
  says the model decided it rather than a configuration layer, and it counts as
  an implicit origin like `ambient` and `unset`: a purely ambient tier is still
  not validated at configuration time on its account.
- **Only an inherited effort drops.** An effort set for this tier, by
  configuration, by a trusted project's file or by an invocation flag, stays and
  is validated, so it is refused rather than dropped, substituted or lowered.
  `SCOPE.md` requires exactly that of an explicit setting.
- **A model that does advertise efforts is unchanged.** An inherited effort such
  a model cannot support still refuses the review. Nothing about inheritance,
  nearest-tier preference or flag precedence changed.
- **A model the catalog does not offer drops nothing.** That case is refused on
  the model itself, so no conclusion is drawn about its effort, and a tier whose
  model is unavailable still fails on the model.
- `C3` left the same defect on a second surface, and both are fixed together: an
  unset `<tier>FallbackEffort` follows the tier's own effective effort, and that
  is an inherited origin like any other, so a fallback model advertising no
  configurable effort no longer receives it. An explicit `<tier>FallbackEffort`
  on such a model is still refused. A fallback that resolves to the tier's own
  model with both efforts absent is still identical, so still `NOT OFFERED`.
- **The model catalog is now a required argument** of `resolveTier` and
  `resolveFallback`. Resolution cannot be completed without knowing which case a
  tier is in, and a caller that omits it is refused rather than silently given
  the old behaviour.
- `validateModelAssignment` now distinguishes the two refusals: a model that
  advertises some efforts but not this one still reports `Unsupported reasoning
  effort X for M`, while one that advertises none reports that it supports no
  configurable reasoning effort at all, which is the case a user fixes by
  unsetting rather than by choosing another value.

### Controlled evidence

Test-first: the assertions were written first and failed on the real defect,
`Unsupported reasoning effort high for plain` raised from `reviewerAssignments`,
and on the missing catalog argument. Two `C3` assertions that pinned the old
refusals were inverted deliberately, and one `F5`-era fixture assertion was split
because the two refusals now carry different messages.

All twelve controlled suites pass, and `git diff --check` is clean:

```sh
for s in findings review selection retention preview publication publish-later \
         checkout config context fixture target; do node scripts/smoke-$s.mjs; done
git diff --check
```

New demonstrations, none of which start inference or touch the network:

- Resolution: a tier on such a model reports `{ value: undefined, source: "model" }`
  whether the effort came from the ambient session, a neighbouring tier or a
  trusted project's file on a neighbouring tier; an entirely ambient tier drops
  it too; an effort configured on this tier or set by an invocation flag is kept
  verbatim; a capable model still inherits an effort it cannot support; and an
  unknown model keeps its inherited effort so the model is what gets refused.
- Configuration: `heavyModel=plain` and `lightModel=plain` are accepted, the
  second proving that every tier inheriting that model also drops its effort.
  `heavyModel=plain heavyEffort=low` and `lightModel=plain heavyEffort=low` are
  still refused, the second proving the check follows the model a tier resolves
  to rather than where the model was configured.
- Fallbacks: `heavyFallbackModel=plain` resolves with no effort and is accepted;
  `heavyFallbackModel=plain heavyFallbackEffort=low` is still refused; a fallback
  on the same effortless model as its tier is still `NOT OFFERED`; and
  `heavyFallbackModel=other`, whose model does advertise efforts, is still
  refused for the tier effort it cannot support.
- Assignment: the saved configuration reaches every quick reviewer with
  `reasoningEffort === undefined` and origin `model`, and the pre-execution
  display renders `reasoning=(not configurable) [model]` for both the reviewer
  and its fallback.
- Display and help: `show` renders the tier and the fallback line without
  `UNUSABLE`, and the policy prose that explains the origin is asserted in both
  the configuration report and `/pr-review-config help`.
- Catalog reading: `advertisesNoReasoningEffort` answers true only for a model
  the session offers that advertises none, and false for a disabled, compound,
  `auto` or absent one.

### Installed-plugin evidence

The extension was reinstalled with `copilot plugin install "$(pwd)"` at the
branch head before each probe. Neither probe sent a model prompt, so neither
spent Copilot credits. CLI 1.0.83 with its bundled SDK, Node.js 26.1.0,
macOS arm64.

The subscription catalog was read directly before any code changed, to establish
that the case exists and what the runtime reports for it. Of the fourteen usable
models this subscription listed on 2026-09-08, **exactly one advertises no
configurable reasoning effort**: `claude-haiku-4.5`. Every other model reports a
non-empty
`capabilities.supports.reasoning_effort`, and the three `gpt-5.6` models include
`none` as one of their supported values, which is a configurable effort called
none rather than the absence of one.

That reading also answered the open question this increment inherited. A session
created on `claude-haiku-4.5` reports `{"modelId":"claude-haiku-4.5"}` from
`model.getCurrent()`, **with no `reasoningEffort` field at all**. That matters
because `reviewAssignments` adopts the runtime's own resolved effort for an
assignment carrying none and revalidates it against the catalog; had the runtime
reported an effort here, the reviewer would have been refused after the
configuration surface allowed it. It does not, so `undefined` survives and no
execution-path change was needed. `smoke-config-runtime.mjs` now asserts this
against a real session rather than leaving it to a one-off reading.

`smoke-runtime.mjs --targets --startup` passed unchanged. It dispatches all four
modes against a skipped draft and asserts their assignment displays; no tier in
that probe resolves to a model without efforts, so its expectations are the same.

`smoke-config-runtime.mjs` was extended with the C4 surface and passed against
the **installed** plugin with the child-only controlled `gh` fixture:

- `heavyModel=claude-haiku-4.5` stored beside a saved light tier that carries an
  effort. Before this increment that update was refused, because the light
  tier's effort inherited onto the heavy tier's model.
- After an extension reload, `show` reported
  `heavy: model=claude-haiku-4.5 [configured:heavy] reasoning=(not configurable) [model]`
  with no `UNUSABLE` marker, so the reloaded process read the stored file rather
  than run memory.
- A real `/pr-review 2 --deep --no-comment` invocation displayed
  `integrated [heavy]: model=claude-haiku-4.5 [configured:heavy] reasoning=(not configurable) [model]`.
  PR 2 is the fixture draft, so it is skipped and no reviewer ever starts.
- `heavyEffort=<supported-elsewhere>` on that tier was refused with the new
  message and left the stored file byte-identical.
- The same pair on the fallback surface: `heavyFallbackModel=claude-haiku-4.5`
  accepted and displayed with `reasoning=(not configurable) [model]` and no
  `UNUSABLE` or `NOT OFFERED`, while
  `heavyFallbackModel=claude-haiku-4.5 heavyFallbackEffort=<effort>` was refused
  and wrote nothing.
- Every C1, C2 and C3 assertion in that probe still passed, and clearing the C4
  settings restored the saved configuration byte for byte.

The probe now needs a subscription model that advertises no configurable
reasoning effort, alongside the second effort-capable model `C3` added. It still
fails its first assertion rather than refusing when a personal
`<copilot-config-home>/pr-review/config.json` exists, so that file was moved
aside for each run and restored afterwards; the restore was verified with
`shasum -a 256` both times, digest
`30794150a3db740f7dcf6f9d7a5a827d3729c5599f7456f582af735d3f297ea9`, mode `0600`,
unchanged before and after.

The other installed probes were last rerun on pull requests #5 and #7.
`smoke-reviewer-tools.mjs` and `smoke-retention-runtime.mjs` exercise reviewer
tool confinement and retained-record reload, neither of which this increment
changes.

### User-visible documentation

`README.md` gains a "Models with no configurable reasoning effort (C4)" section
stating the whole rule: which models it applies to, that the tier and its
fallback both take none, that the origin is reported `[model]`, that an explicit
effort is still refused, and what it unblocks. The C1 trap paragraph that told
users to avoid such a model is replaced, the C1 validation paragraph points at
the new section, the C2 origin vocabulary gains `model`, and the C3 fallback
paragraph records the exception. The extension's own `help` and `status` text and
`/pr-review-config help` carry the rule in short form.

### Live inference: the full review of pull request #11

`C4` landed on branch `c4-no-configurable-effort` and pull request #11. The
installed plugin reviewed it once, in **full** mode, named explicitly rather than
taken as the default. Balanced would have been the safe default for an increment
that adds no mode, but this increment changes the shared tier-resolution seam
every mode goes through, and full is the only mode that resolves all three tiers,
so it is the only topology whose live run puts the changed resolver on the medium
tier. It also spread the review across three model families in one run.

```sh
gh pr checkout 11
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 11 --full --all --no-comment
```

Reviewed head `03b7463`, base `75c5d89`, ten files, 563 additions and 82
deletions. Six reviewers plus one adjudicator, all from saved personal
configuration:

| Reviewer | Tier | Model | Effort | Calls | Reads | Denials | Outcome | Credits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| correctness | heavy | `gpt-5.6-terra` | high | 4 | 3 | 1 read | completed, output discarded | 30.41800 |
| contracts | heavy | `gpt-5.6-terra` | high | 9 | 8 | 1 read | incomplete | 39.76305 |
| security | heavy | `gpt-5.6-terra` | high | 4 | 4 | 0 | completed | 36.72990 |
| performance-resources | heavy | `gpt-5.6-terra` | high | 4 | 4 | 0 | completed | 33.95377 |
| overview | light | `gpt-5.6-luna` | high | 12 | 12 | 0 | completed | 5.49294 |
| conventions-maintainability | medium | `claude-sonnet-5` | medium | 7 | 7 | 0 | completed | 92.93905 |
| evidence-validator | heavy | `gpt-5.6-terra` | high | 0 | 0 | 0 | completed | 29.83895 |

Forty tool calls, thirty-eight reads, **two permission denials and no tool
denial**. Cost: **269.135657 credits**, which is the sum of the per-reviewer
figures above. Nothing was published.

Coverage was **incomplete**, on three execution failures and four informational
caveats, with zero coverage gaps. No finding was validated or selected, one
candidate was rejected by the adjudicator, and one was rejected at the evidence
boundary.

**The one real defect it found was rejected at the evidence boundary, and is
fixed.** `overview:1`, P3 at confidence 0.93: `effortForModel` returned early
when there was no effort value to drop, so a tier on a model with no configurable
effort reported `(unset) [unset]` or `(unset) [ambient]` when no layer had
offered one, and a fallback whose tier already had none reported `[primary]`. The
same resolved model therefore described itself differently depending on what the
other tiers happened to hold, and `README.md` promised the `[model]` origin
unconditionally. The origin now names the model for every origin except one
chosen for this tier itself.

It was refused for a citation that did not exactly match a supplied context
window: its quote of `config.mjs` lines 223-224 was correct except that it
dropped the two leading spaces of the first line. **This is the fourth pull
request on which the evidence boundary has discarded a true finding, and the
second in a row on which the discarded finding was the overview reviewer's.** It
is increment `Q6`; the same-hunk rule that cost the other three is `Q5`, and
`Q5` is next.

**Rejected by the adjudicator, and correctly.** `security:1`, P2 at confidence
0.94, argued that `advertisesNoReasoningEffort` should treat absent or malformed
`capabilities.supports.reasoning_effort` metadata as unknown rather than as an
affirmative "no efforts", preserving the inherited effort so validation refuses
it. The adjudicator rejected it because the supplied source establishes no
contract distinguishing an explicitly empty array from absent metadata, and
`reasoningEfforts` has always normalized both to `[]`. A direct reading of the
installed catalog settles it further: `claude-haiku-4.5` carries a
`capabilities.supports` object that simply **omits** `reasoning_effort`, listing
`max_thinking_budget`, `min_thinking_budget`, `parallel_tool_calls`, `streaming`,
`tool_calls`, `vision` and `adaptive_thinking`. Absent metadata is the only shape
this runtime uses for a model with no configurable effort, so the candidate's
expected behaviour would make `C4` fail for the one model it exists for. The
malformed case it also names is real but hypothetical: no observed model produces
it, and answering it would need a second notion of the catalog beside
`reasoningEfforts`. Rejected, and recorded here rather than silently dropped.

**Three things this run demonstrated that no previous review had.**

- **A reviewer settled `completed` and emitted no envelope at all.**
  `correctness` returned one sentence of thinking-style prose, "I'm tracing the
  new resolution paths through their callers and execution handoff to distinguish
  a user-visible defect from the documented behavior", and nothing else. The
  evidence boundary discarded it with `SyntaxError: Unexpected token 'I'`. This
  is **not** an `F6` unwrap failure: there was no envelope to unwrap, wrapped or
  otherwise, so the marker contract is not implicated. It is the clearest live
  instance yet of the `C5` asymmetry: the coverage report calls it an execution
  failure, while the reviewer record says `completed`, so it could never become
  eligible for a fallback attempt.
- **A reviewer failed in exactly the way `C3` covers.** `contracts` settled
  `incomplete` with "Reviewer produced no usable output", which is an explicit
  execution failure and therefore fallback-eligible. No fallback was configured,
  so none was attempted. This is the first live occasion on which a configured
  fallback would actually have fired, which sharpens `C3`'s standing limitation
  from "never observed" to "would have fired here".
- **The medium tier's Claude-family model parsed cleanly.** `M1` recorded a
  Claude-family medium model fencing its JSON as an open defect, and `F6` answered
  it. Here `claude-sonnet-5` wrote several paragraphs of prose and then the
  marker-delimited envelope, and the unwrap took it. That is a fourth run of live
  evidence for the marker contract, and the first on the medium tier since `F6`.

**The read denials landed on the two reviewers that then failed, for the third
time, and this run shows the mechanism.** `correctness` and `contracts` each took
exactly one permission denial, and they are exactly the two reviewers whose
output was lost; the other four took none. Their tool calls say why.
`correctness` asked to `view` `extensions/pr-review/quick.mjs`, which does not
exist in this repository, and `contracts` asked `rg` for the literal path
`scripts/smoke-{config,review}.mjs`, an unexpanded brace pattern. `insideRoot` in
`read-only.mjs` calls `realpathSync` and returns `undefined` when it throws, so a
**nonexistent path inside the checkout is rejected exactly like an escape
attempt**, and the reviewer is told it may only read inside the reviewed
checkout. That is a plausible mechanism for the correlation pull request #6 first
recorded, and it is not something `C4` introduced. It is deliberately **not**
fixed here: distinguishing "absent" from "outside the root" changes a
confinement boundary and needs its own increment, its own tests and its own
review. It is recorded below as the next candidate after `C5`.

### Remaining limitations

- **No reviewer has actually run on a model with no configurable effort.** The
  configuration, display and assignment surfaces are demonstrated end to end on
  the installed plugin, and the runtime is on record reporting no effort for such
  a session, but no live review has assigned one to a tier and executed it. That
  would cost credits and needs its own authorization.
- The rule keys off what the catalog advertises at resolution time. A model whose
  advertised efforts change between a configuration update and a review would be
  resolved differently by each, which is the same latent inconsistency every
  capability check in this tool has.
- A tier that drops its inherited effort runs at whatever effort the runtime
  itself chooses for that model, which the plugin neither sets nor displays as a
  value. `(not configurable)` is honest about that, but it means two reviewers on
  the same such model cannot be given different efforts.
- `C4` adds no configuration key, so there is still no way to say "this tier
  takes no effort" for a model that *does* support efforts. Unsetting the tier's
  effort inherits one instead. Nobody has asked for that, and the `gpt-5.6`
  family already exposes `none` as an explicit value.
- The catalog argument is required at the two resolution entry points only.
  Nothing prevents a future caller from computing an assignment some other way,
  as `reviewAssignments` does when it adopts the runtime's resolved effort.
- Two of the six reviewers lost their output on this pull request, so the review
  that verifies the increment covered it less well than its coverage report's
  three execution failures might suggest. The two surviving heavy specialists,
  the light reviewer and the medium reviewer all read the changed resolution
  path, and one of them found the defect that was fixed, but correctness and
  contracts contributed nothing.
- The malformed-metadata case `security:1` raised is unanswered by design. A
  catalog entry whose `reasoning_effort` is present but not an array of strings
  is read as "no configurable effort" rather than as "unreadable". No observed
  model produces that shape, and separating the two would need a second notion of
  the catalog beside `reasoningEfforts`.

## Completed increment: Q5

**A candidate anchored on a changed line can now cite the code that change
breaks.** The citation is optional, it is called `breaks`, and it carries no
anchoring rule of its own: it may name unchanged code, code in another hunk, or
code in another changed file. Everything that makes a citation trustworthy still
applies to it, because it goes through the same `cite()` the location and the
evidence array go through.

Pull request #12's balanced review demonstrated it end to end on the installed
plugin, cost 137.274102 credits, and found one real defect in this increment's
own adjudicator contract, which is fixed on the same branch.

### The rule that cost three findings, and what replaced it

`candidate()` in `findings.mjs` required one hunk to contain the location and
both introduction citations at once:

```js
if (!file.hunks.some((hunk) => withinHunk(location, hunk) &&
    (before ? withinHunk(before, hunk) : !hunkHasChanges(file, hunk, "base")) &&
    (after ? withinHunk(after, hunk) : !hunkHasChanges(file, hunk, "head")))) {
```

That one condition carried two separate demands. The first is that a supplied
introduction citation describes the location's own edit, which is right and is
kept. The second is that `before: null` or `after: null` is a claim about the
whole hunk rather than about the changed lines the candidate points at, and that
is what discarded pull request #5's finding. The condition is now:

```js
if (!file.hunks.some((hunk) => withinHunk(location, hunk) &&
    (!before || withinHunk(before, hunk)) && (!after || withinHunk(after, hunk)))) {
```

A supplied introduction citation is still bound to the location's hunk, still to
its own side and file, and still has to reach changed code rather than nearby
unchanged context. A null side is now the reviewer's claim that this change
replaced or added nothing there, and the adjudicator settles it, as it settles
every other assertion in the candidate.

### The shape chosen, and the two that were not

The roadmap left three shapes open. The chosen one is the first: a separate
optional citation beside `before`/`after`, because it is the only one that lets
the code a change breaks be **unchanged** code, which is what pull request #10's
discarded finding needed.

- Widening `before`/`after` to any changed hunk in the file was rejected. It
  would accept the two mis-anchored candidates literally, but an introduction
  pair drawn from two unrelated edits no longer describes one edit, which is the
  only thing those two citations exist to pin. The report those candidates were
  reaching for is expressible now without giving that up.
- Reporting the near-miss and leaving the rule alone was rejected against the
  stated acceptance criterion, which requires the candidate to reach
  adjudication rather than to be recoverable from the timeline afterwards.

The root cause of all three losses was that a reviewer with something to say
about "this changed line breaks that other code" had nowhere to put the second
half, so it put it in `before`/`after`. The reviewer contract now says where it
goes, and says explicitly to anchor the location on the changed code rather than
on the code that change breaks.

### The three recorded rejections, reconstructed

`scripts/target-fixture.mjs` gains a two-hunk file, `breakage.js`, whose changed
line 5 breaks unchanged line 9 and whose second hunk changes line 17.
`smoke-findings.mjs` composes it with the existing `total.js` fixture, so a
candidate can cite another changed file as well. Each recorded rejection is
reconstructed from that fixture rather than from prose:

| Recorded on | Reconstructed shape | Now |
| --- | --- | --- |
| #4, #10 | Location in one hunk, introduction citations in another | Still refused, with the same message |
| #4, #10 | The same claim, anchored on the changed line, citing the other hunk in `breaks` | Reaches adjudication |
| #5 | `before: null` on a hunk that does remove base-side lines | Reaches adjudication |

The first row is the point worth being plain about: the mis-anchored candidates
as recorded are still rejected, and the finding each was reaching for is now
expressible in a well-formed candidate. This increment does not accept a
mis-anchored introduction; it removes the reason a reviewer had to write one.

### What did not change

- **Every citation refusal still fires on the new field.** Unbound provenance, a
  path outside the binding, a range outside a supplied context window, a
  fabricated quote, an extra or missing key, and an invalid side are each
  asserted against `breaks` in `smoke-findings.mjs`.
- **The exact-match check is untouched.** `Q6` is a different refusal with its
  own counter-evidence, and folding it in here would have relaxed the check that
  stopped pull request #4's 0.99-confidence fabrication.
- **The retained record's schema version is unchanged.** It tracks publication
  authority, not candidate shape. The field is optional in `retention.mjs`, so a
  record that carries none, or omits the key, still validates and reloads.
- **The published inline comment is unchanged.** The citation is displayed in the
  terminal findings view and kept in the retained record; the comment body still
  carries the same fields it did, so the P3/P4 publication payload contract is
  untouched.
- **Deduplication is no stricter and no looser.** `sharedChangedEvidence` now
  reads `breaks` alongside `before`, `after` and `evidence`, which keeps the
  behaviour identical to citing the same lines in `evidence`, where a reviewer
  had to put them before. Shared changed source stays necessary and never
  sufficient; the adjudicator still has to name the duplicate and explain it.

### Controlled evidence

All twelve controlled suites pass, and `git diff --check` is clean. The new
coverage is:

- `smoke-findings.mjs`: the broken-code citation accepted against unchanged code
  outside every hunk, changed code in another hunk on either side, and both
  unchanged and changed code in another changed file; the citation optional
  whether nulled or omitted, and normalized to an explicit `null` on the
  finding; the citation refusals listed above; the two reconstructed rejections; the
  introduction citations still bound to the location's hunk, side and file; and
  deduplication carried by a shared broken-code citation and refused without one.
- `smoke-review.mjs`: the reviewer contract of every mode names the new citation
  and tells reviewers what to anchor on, and a controlled quick run carries a
  citation of unchanged code outside the hunk from reviewer output through
  adjudication, selection, preview and the retained record.
- `smoke-retention.mjs`: a retained finding keeps the citation across a store
  round trip, a record that carries none or omits the key still validates, and
  every mutation of the citation is refused as unbound or malformed.

The controlled suites use test doubles for every model decision. They prove the
plumbing and the gates, not that a live reviewer will use the new citation.

### The live balanced review of pull request #12

The increment's real integration test ran the installed plugin against its own
pull request, 498 additions and 26 deletions over 9 files, at
`55696057150cfadf033e2b717521615df04d3896`. **Balanced was named explicitly**,
because `Q5` adds no mode and balanced is the default topology; the medium tier
therefore did not run.

| Reviewer | Tier, model, effort | Settled | Tool calls | Reads | Denials | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| correctness | heavy, `gpt-5.6-terra`, high | completed | 10 | 10 | none | 41.555320 |
| contracts | heavy, `gpt-5.6-terra`, high | completed | 4 | 4 | none | 30.170090 |
| security | heavy, `gpt-5.6-terra`, high | completed | 9 | 9 | none | 33.204090 |
| performance-resources | heavy, `gpt-5.6-terra`, high | completed | 3 | 3 | none | 28.011680 |
| overview | light, `gpt-5.6-luna`, high | completed | 15 | 16 | none | 4.332922 |

The run cost **137.274102 credits**, and the per-reviewer charges sum to exactly
that. It finished in 98 seconds of process wall time, and the runtime's own event
timestamps put every reviewer's turn between 17:50:48 and 17:52:03, so a balanced
run is not inherently slow; #11's full run took roughly forty minutes over a
comparable diff. Runtime varies with the reviewers' own behaviour, not with the
mode, which is one more reason no deadline is imposed on them. **No adjudication pass ran**, because the review's one candidate never
reached it, which is why a balanced run over a diff this size cost less than
pull request #10's. Every reviewer emitted a well-formed envelope between the
`F6` markers, so that contract now has live evidence from five separate runs.
**No reviewer was denied a read or a tool** on any of its calls.

**`Q5` worked, and the exact-citation match discarded the result anyway.** The
`correctness` reviewer reported one candidate, a P2 at confidence 0.88, and it
used the new citation exactly as intended: its location was the changed
comparison in `candidate()`, and its `breaks` citation named the adjudicator
instructions eleven lines in a different hunk of the same file. No `Q5` refusal
fired on it. It was rejected for `Q6`'s reason instead:

```text
correctness:1: rejected at evidence boundary: Error: Citation does not exactly match a supplied context window.
```

Two of its citations were near-misses, and `cite()` reaches them in order, so the
new field is where the check bit:

- `breaks`, `findings.mjs` head 78-88, dropped **the trailing comma of its last
  line** and was otherwise byte-exact over eleven lines.
- `evidence`, `README.md` head 416-419, began its first line at
  `Before/after evidence must describe that`, dropping the sentence fragment
  before it on the same line.

Pull request #11's loss was two **leading** spaces. This one is a **trailing**
character on the last line and a leading fragment on the first, so whatever
`Q6` does has to repair or report a near-miss at either end of a quote, not
just indentation.

**The finding was true, and it was about this increment.** Relaxing the null
introduction side moved a deterministic check onto the adjudicator, and the
adjudicator was never told. Its acceptance rule enumerated the candidate's prose
fields only, so a candidate whose `before: null` falsely presents a replacement
as a pure addition could still be accepted, and the new citation sat outside that
enumeration as well. The rule now covers the candidate's prose and its citations
alike, states what a null introduction side claims, and says to test it against
the captured diff. Fixed on this branch, with controlled assertions on the
contract text, after the review.

That is the enumeration defect class again: a list that stopped describing what
it enumerates the moment something was added to what it describes. This time it
was in the adjudicator's own acceptance rule, and it was caught by a review of
the change that made it stale.

The three informational caveats, from `contracts`, `security` and
`performance-resources`, all say the same true thing: nothing in the captured
diff could show them a live model actually using the new citation. This run
answers exactly that, from outside the review.

### Reproduction

```sh
for suite in findings review selection retention preview publication \
  publish-later checkout config context fixture target; do
  node "scripts/smoke-$suite.mjs" || break
done
git diff --check

gh pr checkout 12
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 12 --balanced --all --no-comment
```

`scripts/smoke-factory.mjs` was also rerun without `--spend`, which spends
nothing, after its mirror of the candidate schema gained the optional field. It
reported `subagents: 0` and `nanoAiu: 0`, and the shipped modules still import
from inside the factory body.

### Remaining limitations

- **One live reviewer used it, once.** Pull request #12's `correctness`
  reviewer produced a well-formed candidate whose `breaks` citation named a
  different hunk, which is the shape this increment exists for, and no `Q5`
  refusal fired on it. One candidate in one review is one sample: it does not
  say how often a reviewer will reach for the citation, and nothing has yet
  shown one being accepted through adjudication and presented as a finding.
- **The citation was still discarded, by `Q6`.** The exact-citation match
  rejected the whole candidate over a missing trailing comma in that very
  citation. Until `Q6` lands, a reviewer using the new field can lose its
  finding for a byte, exactly as before.
- **The code a change breaks must still be inside a captured context window.**
  Context is assembled only for changed files, within a radius of the hunks, so
  a victim in an unchanged file cannot be cited at all. That boundary predates
  this increment and is unchanged by it; a reviewer that needs it has to report
  the gap in `limitations` instead.
- **A null introduction side is now a model claim rather than a code check.**
  The old rule was coarse, and it discarded a true finding for it, but it did
  stop a reviewer from calling a replacement a pure addition. The adjudicator is
  now told to test that claim, after pull request #12's review found the contract
  silent on it, and the adjudicator is fallible in a way the old check was not.
- **The published comment does not carry the citation**, so a reader on GitHub
  sees the broken code only insofar as the finding's prose names it.

## Completed increment: Q6

**Implementation is on `q6-source-bound-quote-repair`, from `main` at
`ba8f0fc`, checkpoint `fb0ec79`, pull request #13.** Its one installed balanced
review has run, with incomplete coverage and the limitations recorded below.
Q5 is complete and
its own-hunk, optional `breaks`, null-side claim and publication-body decisions
stand. No C5 retry or reviewer-status change is included.

### Recorded refusals that motivated Q6

Before Q6, a candidate's quote had to match its bound source byte for byte at
ingestion or the whole candidate was discarded. This check discarded two true
findings and stopped one fabrication:

| Pull request | Candidate | Refusal | What it cost |
| --- | --- | --- | --- |
| #4 | performance-resources:1 | same changed hunk | true; acted on by hand |
| #4 | overview:1 | context-window match | not substantive |
| #4 | contracts:2 (0.99) | context-window match | **a fabrication, correctly stopped** |
| #5 | correctness:1 (P3, 0.97) | same changed hunk | true; fixed by hand |
| #10 | overview:1 (P2, 0.95) | same changed hunk | true; the best finding in that review |
| #10 | overview:2 | context-window match | duplicate; no loss |
| #11 | overview:1 (P3, 0.93) | context-window match | true; the only finding in that review |
| #12 | correctness:1 (P2, 0.88) | context-window match | true; fixed on the branch |

The same-changed-hunk rows are `Q5`, and they are closed. Every remaining row is
this one check, with counter-evidence that constrains the repair.
On #11 the overview reviewer quoted `config.mjs` lines 223-224 correctly except
that it dropped the two **leading** spaces of the first line, and the whole P3 was
discarded. On #12 the `correctness` reviewer quoted eleven lines of `findings.mjs`
byte-exactly except for the **trailing** comma on the last one, and its whole P2
was discarded; a second citation in the same candidate began its first line
mid-sentence. But on #4 that same check stopped `contracts:2` at confidence 0.99,
where the reviewer had **introduced a space into its own quote** and the claimed
defect was about that space. Normalizing whitespace would have let that
fabrication through to adjudication.

### Chosen boundary and its cost

`cite()` remains exact-only. Candidate ingestion alone may repair a quote that
is a contiguous span of the exact bound source range, has exactly the same
number of physical lines, and has non-whitespace text on both boundary lines.
The line-count constraint prevents a fragment on an unchanged line from claiming
a wider range containing a changed line. Nothing searches outside the named
range, moves an anchor, normalizes whitespace, inserts a reviewer-invented
character, or joins disjoint spans. The restored full lines go through `cite()`
before reaching the existing changed-line and same-hunk gates.

The repair applies to every candidate citation, including `breaks`. An
informational caveat records candidate ID, field, original citation and restored
citation; the adjudicator receives those diagnostics alongside the canonical
candidates. Claims are never rewritten, and the contract explicitly requires
rejecting a claim that depends on omitted text or whitespace being absent.
Adjudicator evidence and publication still call strict `cite()`, not repair.

The cost is deliberate: a very short fragment, even punctuation, can be repaired
on the physical line it actually names. That is no proof of a defect, and the
adjudicator still has to disprove the whole claim against full source. Requiring
word boundaries or permitting only whitespace clipping would miss #12's comma
and mid-sentence quote. Unrestricted substring matching was rejected because it
could discard whole lines and launder an anchor. Reporting without repairing was
rejected because the acceptance criterion requires the findings to reach
adjudication. Repair diagnostics duplicate source text in the adjudicator input
and retained diagnostics; they can increase tokens and credits when triggered.

No candidate-envelope or retained-record schema version changed; the factory
probe's schema mirror therefore needs no edit. The published inline body is
unchanged. F6's marker/fence parser, C5 eligibility and all runtime APIs are
untouched. L1 remains pending; no upstream source was copied.

### Controlled evidence at the implementation checkpoint

All twelve recorded controlled suites passed before editing. After implementing,
`smoke-findings`, `smoke-review`, `smoke-preview`, `smoke-retention` and
`smoke-publish-later` pass; `git diff --check` passes.

`scripts/q6-citation-fixture.mjs` reconstructs the original reviewer claims and
source excerpts with relocated line numbers and self-contained synthetic diffs.
It is not a full historical-review replay. Original outputs were recovered from
the local reviewer sessions identified in that file, and the source excerpts
were compared byte for byte with reviewed heads `03b7463` (#11), `5569605`
(#12) and `ae2c55c` (#4), not guessed from this roadmap's prose.

`smoke-findings.mjs` establishes that #11's location and after, and #12's breaks
and evidence, are repaired and reach controlled adjudication, while #4's
inserted-space fabrication never reaches it. It covers clipping either or both
ends of every candidate citation, refused interior edits and omitted lines,
unchanged-line and wrong-hunk refusals after repair, and exact-only adjudicator
citations. `smoke-review.mjs` carries repaired quotes and original/restored
diagnostics through the actual adjudicator prompt, selection, preview and a
retained-record disk round trip. Scripted acceptance and rejection both work:
repair does not decide the claim.

The first disk-round-trip test failed because its synthetic session workspace
did not have the session ID as basename; the fixture was corrected to obey the
existing store guard, and the guard is unchanged.

### Installed balanced review of pull request #13

On 2026-09-08 the installed plugin reviewed head
`fb0ec79a87c1cb45768de29837e9ac0f895bee4e`, 536 additions and 355 deletions over
8 files. **Balanced was explicitly selected**, because Q6 adds no mode and
balanced is the default topology. The medium tier did not run.

| Reviewer | Tier, actual model, effort | Settled | Tool calls | Reads | Permission denials | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| correctness | heavy, `gpt-5.6-terra`, high | completed | 13 | 13 | 0 | 35.073770 |
| contracts | heavy, `gpt-5.6-terra`, high | incomplete, no usable output | 14 | 13 | 1 read | 31.486510 |
| security | heavy, `gpt-5.6-terra`, high | completed | 8 | 8 | 0 | 33.436010 |
| performance-resources | heavy, `gpt-5.6-terra`, high | completed | 3 | 3 | 0 | 28.363690 |
| overview | light, `gpt-5.6-luna`, high | completed | 14 | 14 | 0 | 6.393259 |

Per-reviewer reported nano-AIU charges sum to **134.753239 credits**. There
were 52 tool calls, 51 reads, one permission denial and no tool denials.
All recorded usage matched the assignments above. Runtime reviewer events ran
from 16:17:03.117Z to 16:20:52.845Z; the overview reviewer continued after the
others settled. No timeout or intervention was applied, and the working tree
remained untouched throughout.

**Coverage is INCOMPLETE**, with one execution failure, one coverage gap and
three informational caveats. There were zero candidates, zero accepted,
rejected, duplicate or capped findings, and no adjudicator session. Nothing
was published. This is not a clean-review claim.

- `contracts` returned an empty result and settled incomplete:
  `Error: Reviewer produced no usable output.` Its last recorded tool request
  searched a nonexistent root-level `findings.mjs`, instead of
  `extensions/pr-review/findings.mjs`, and incurred the read denial. This
  repeats the absent-path denial observation from #6 and #11; temporal
  association does not prove why the model then produced no output. No
  fallback ran. The confinement refusal and retry eligibility were not changed.
- `correctness` reported that the captured changes could not establish whether
  real reviewers and adjudicators reliably use and semantically evaluate
  repaired quotations. Its wording says the installed review is pending,
  which was true of the captured documentation, but this run now exists.
  **Its underlying limitation remains real:** no candidate in this run
  exercised repair or adjudication. The reported coverage gap is preserved,
  not relabeled as a caveat to make the review complete.
- `security` noted that no installed-runtime review output was supplied.
  `performance-resources` noted the absence of workload measurements for
  additional diagnostic prompt tokens and credits. `overview` limited its
  assessment to the textual diff. These caveats are retained.

No defect candidate was proposed, so no finding was fixed or rejected by hand
and no implementation changed in response. The execution failure is evidence
about the shipped tool, not overridden by the passing controlled suites.
The review demonstrates installation, dispatch, revision gating, real
assignments, confined reads and degraded-result delivery at this checkpoint.
It does **not** demonstrate live repaired-candidate semantic acceptance.
Repair and its prompt/retention plumbing remain controlled-only observations;
the additional token and credit cost has not been measured.
All completed reviewers used the F6 markers; its parser was not changed.

The complete timeline was saved during execution, before analysis, at
`$HOME/.copilot/session-state/d6d1da8c-3f3a-4ff9-b133-3fa85f9bbd1e/files/q6-review-timeline.log`.
That directory also holds `q6-review-evidence.json` and
`q6-<reviewer>-verbatim.txt`, with the original per-reviewer result strings
extracted from the timeline's structured `M1 evidence` (including the empty
contracts result). These artifacts stay local. The originating retained session
is `b47f1b5c-38ba-4744-8512-bd6030c89b5b`, invocation
`27d7fb45-3dbb-42ce-a8bf-37d0b88a91cc`, retained digest
`b41fbdb294aa67599267fb3487e66cd3ea8d5e629d1584e74c4c2b0ec7eb3111`.

Reproduction commands (the live command below **already spent the one authorized
review**; do not repeat without new authorization):

```sh
node scripts/smoke-findings.mjs
node scripts/smoke-review.mjs
node scripts/smoke-preview.mjs
node scripts/smoke-retention.mjs
node scripts/smoke-publish-later.mjs
git diff --check

gh pr checkout 13
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 13 --balanced --all --no-comment
```

CLI 1.0.83 was used with its derived bundled SDK. No other credit-spending
probe, factory invocation or rerun was performed. The personal configuration
file was not moved or edited. The post-review checkpoints change documentation
only; they have not been reviewed again. The user subsequently authorized
merging #13 and chose a C5 boundary discussion, not implementation, for the
next fresh session.

## Completed increment: C5

`C5` makes a discarded reviewer output an eligible failed attempt. It landed on
branch `c5-discarded-output-eligibility`. The boundary was discussed and
approved before any code was written, in the session the user reserved for that
discussion on 2026-09-08; the four choices it named are recorded below with the
answers the user gave.

### The asymmetry it closes

A reviewer that finished its turn settled `completed` however unusable its
output turned out to be, because `runReviewer` only asked whether a nonempty
message arrived before the session went idle. Envelope validation then ran much
later, in `collectCandidates`, after every reviewer had settled. A reviewer
whose output could not be parsed was therefore reported as an execution failure
by the coverage report and as `completed` by its own record, so it could never
become eligible for its tier's one configured fallback, while a reviewer that
returned nothing at all could.

Pull request #11 showed both halves in one run. `correctness` settled
`completed` on one sentence of thinking-style prose and got nothing;
`contracts` settled `incomplete` on no usable output and would have been
eligible had a fallback been configured. Two reviewers lost the same way,
separated only by how the runtime reported the end of the attempt.

### The boundary, and the four choices behind it

**Eligibility is the envelope gate itself, and stops there.** An attempt that
settled `completed` is demoted to `incomplete`, and so becomes eligible for one
configured fallback attempt, if and only if `envelope()` throws on its output.
If `envelope()` returns, the attempt stays `completed` whatever becomes of the
candidates inside it.

Everything `envelope()` checks is the reviewer's compliance with a format this
tool specified: the marker pair, the fence unwrap, JSON parsing, the exact key
set, the schema version, the review-key binding, the result arrays and the
limitation entries. Everything below it, meaning `candidate()` and adjudication,
is judgment about the reviewed change. Retrying compliance is legitimate.
Retrying judgment runs a model again until the gate accepts something, which
manufactures findings, and it is the direction `SCOPE.md` closed when it dropped
experimental malformed-output finding extraction from v1.

That distinction also keeps `C5` clear of `Q5` and `Q6`. On #10 the overview
reviewer's P2 at confidence 0.95 was discarded by the changed-line anchoring
rule. That was a semantic refusal, and the correct repair was to fix the rule,
which `Q5` and `Q6` did. A retry would have papered over a gate defect instead
of fixing it. The two repairs answer different failures and must not be mixed.

Four choices were put to the user before implementation, and all four were
approved as recommended:

| Choice | Decision | Why |
| --- | --- | --- |
| The adjudicator's own discarded decisions | In scope, on the `decisions` field | A malformed adjudication accepts no candidate, which is the most expensive discard in the system |
| An envelope whose every candidate is refused | Not eligible | Indistinguishable at one attempt from retrying a single refusal; `Q5`/`Q6` answer this by fixing the gate |
| A well-formed envelope bound to the wrong review key | Eligible, with no carve-out | Nothing usable survives it, so it is structural like any other envelope failure |
| Whether demotion requires a configured fallback | Demote always | The attribution is wrong either way, and gating it would make a recorded status depend on another user's configuration |

### Where the check sits, and why not at the evidence boundary

The retry decision did **not** move into `findings.mjs`. `reviewAssignments`
takes an optional `verifyResult` callback, applied in `runAttempt` immediately
after the existing usage-mismatch demotion, and `review.mjs` supplies it as
`envelopeVerifier(reviewKey(binding), "candidates")` for the specialists and
`envelopeVerifier(boundary.key, "decisions")` for the adjudicator. The verifier
is the same `envelope()` call collection makes, exported as a predicate; it is
never a weaker gate, and `smoke-findings.mjs` holds it to exactly the corpus
collection accepts and discards.

Two reasons decided the placement, and the second is decisive:

- The hook needs only the review key, which `reviewPrompt` already computes
  before any reviewer starts, so nothing was hoisted or restructured and
  `fixture.mjs` stays evidence-agnostic. The `F2` fixture path passes no hook.
- **There is no timeout, so a hung reviewer never settles.** Validating in
  `collectCandidates` would mean no retry could start until `Promise.allSettled`
  resolved, so one hung reviewer would block every *other* reviewer's fallback
  indefinitely. Beside the reviewer, each fallback fires as soon as its own
  attempt settles, independent of its siblings. The roadmap's own earlier
  sketch of running collection twice was rejected for this reason.

`envelope()` therefore parses twice, once as an eligibility predicate and once
in collection. It is pure and deterministic, spends nothing, and keeps the
evidence boundary the single authority on what any of it means.

### What did not change

- The evidence boundary itself. The marker contract and its unwrap, the exact
  key set, the schema-version and review-key checks, the citation, quote and
  changed-line gates, `Q5`'s same-hunk rule, `Q6`'s clipped-quote repair,
  adjudication, deduplication, selection, retention and the publication gates
  are all untouched. No gate was weakened to make a retry fire.
- The one-configured-fallback limit. A reviewer still gets at most one extra
  attempt whatever happens, the review is never restarted, no other reviewer is
  affected, and a fallback that fails leaves the reviewer incomplete with both
  failures recorded. A fallback attempt is now verified exactly like the primary
  it answers, and that is still its only attempt.
- Cancellation. A cancelled attempt settles `cancelled`, never `incomplete`, so
  the verifier never runs on it and no fallback starts. Elapsed time still
  triggers nothing: no timeout, deadline or stuck-reviewer heuristic was added.
- Confinement. `read-only.mjs` is untouched; the absent-path denial observation
  stays open and unaddressed.
- **The retained record.** No key, no status vocabulary and no record schema
  version changed. `C3`'s invariants already describe this shape exactly: a
  demotion produces the `incomplete` status `fallbackFrom` requires, and a
  successful fallback produces the all-reviewers-completed state `complete`
  requires. No reviewer's raw output was ever retained, on the primary or on
  `fallbackFrom`, and `C5` does not add it: only the reason the output was
  discarded travels, in the attempt's error.

### What changes for coverage

Review-level coverage was **already** `INCOMPLETE` in every one of these cases,
because `collectCandidates` already pushed a blocking `execution-failure` for an
unparseable envelope. `C5` does not change the headline coverage word on a
failure. What it changes is attribution and recovery:

- The reviewer's own status becomes `incomplete`, and `executionComplete`
  becomes false where both previously said the attempt had completed.
- The reason the output was discarded is carried in the attempt's error, so
  demotion does not replace the specific parse failure with a generic
  incomplete-execution message.
- A successful fallback can now turn a review that would have been `INCOMPLETE`
  into a `completed` one. That is what `C5` buys.

### Controlled evidence

Test-first throughout. The acceptance assertions failed first on a reviewer that
settled `completed` with prose, which is the recorded #11 shape, and the
equivalence assertions failed before the verifier existed.

All twelve controlled suites pass and `git diff --check` is clean. None of them
starts inference or touches the network:

```sh
for s in findings review selection retention preview publication publish-later \
         checkout config context fixture target; do node scripts/smoke-$s.mjs; done
git diff --check
```

New demonstrations in `smoke-review.mjs`, on a harness extended with reviewer
prose, a wrong-key envelope, a refused candidate beside a valid one, and a
fallback attempt that returns prose too:

- Demotion without a fallback, for prose and for a wrong review key: the
  reviewer settles `incomplete`, no extra session is created, `executionComplete`
  is false, the specific parse reason reaches the coverage report, and the other
  reviewers still complete and are adjudicated.
- Useful sibling candidates survive another reviewer's fallback with their ids
  and content intact, and reach the adjudicator unchanged. Exactly one extra
  session is created, and no other reviewer is retried or reassigned.
- A candidate refused inside a valid envelope demotes nothing and retries
  nothing, and the valid sibling in that same envelope is still collected and
  adjudicated. An envelope whose every candidate is refused likewise starts no
  attempt, and still blocks completed coverage.
- A fallback that fails leaves the reviewer incomplete in all three shapes: a
  setup refusal that creates no session and keeps the attempt that ran, a run
  failure, and a fallback whose own output is discarded for the same reason as
  the primary's. None of them gets a third attempt.
- Cancellation demotes nothing and starts no fallback.
- A valid envelope reporting no candidate is a completed attempt in quick,
  balanced, full and deep alike, and starts neither an adjudicator nor a
  fallback.
- Demotion and recovery behave the same in all four modes, and a demoted
  reviewer falls back on its own tier: balanced's light `overview` and full's
  medium `conventions-maintainability` each recover on their own tier's
  configured fallback, never on the heavy one.
- A `Q6` repair leaves the attempt completed and starts no fallback.
- The adjudicator's own discarded decisions are eligible: one fallback attempt
  recovers it, and when that attempt is discarded too, no candidate is accepted
  and coverage stays incomplete.

New demonstrations in `smoke-findings.mjs`, which prove the predicate is the
gate rather than a copy of it:

- The verifier accepts exactly the seven envelope shapes `collectCandidates`
  can use, and rejects exactly the nine it discards whole plus the three that
  fail the post-parse gates.
- It does not throw on an envelope carrying a candidate below the confidence
  bar, a candidate with a severity the mode does not admit, a candidate anchored
  off the changed lines, a valid candidate beside a refused one, or no candidate
  at all, while collection still refuses each of those candidates.
- The adjudicator's field is checked as its own contract: a candidates envelope
  is refused on the decisions field and the reverse, and prose and a wrong
  review key are refused on both.

### Cost

Fallbacks start unset, so **a user with no configured fallback spends nothing
extra**; they get corrected attribution only. A fallback attempt re-sends the
full prompt and is a complete second review pass, so it costs roughly what the
primary cost rather than less.

| Tier | Recorded per-reviewer charge | Runs |
| --- | --- | --- |
| Heavy | 28.36 to 57.14 credits | #10, #11, #13 |
| Light overview | 5.49 to 7.77 credits | #10, #11, #13 |
| Medium `claude-sonnet-5` | 92.93905 credits | #11 |

The worst case is bounded by `C3` and unchanged by `C5`: at most one extra
attempt per reviewer plus one for the adjudicator, so seven in full mode and six
in balanced. Against this project's own history, a configured heavy fallback
would have added roughly 30 credits to #13's 134.753239, and would have fired
twice on #11 for roughly 70 credits against 269.135657. `C5` adds no instruction
text and no prompt tokens to any primary attempt.

### Installed balanced review of pull request #14

The installed plugin reviewed `C5`'s own pull request once, in **balanced** mode
named explicitly. Balanced is the default topology and `C5` adds no mode, so no
other topology was required; full would have added a medium reviewer without
putting the change on a seam balanced does not already cross.

```sh
gh pr checkout 14
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs 14 --balanced --all --no-comment
```

Reviewed head `761e01c`, base `58deae8`, seven files, 666 additions and 152
deletions. Five reviewers from saved personal configuration, and **no configured
fallback on any tier**:

| Reviewer | Tier, actual model, effort | Settled | Tool calls | Reads | Denials | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| correctness | heavy, `gpt-5.6-terra`, high | completed | 4 | 4 | 0 | 24.630630 |
| contracts | heavy, `gpt-5.6-terra`, high | completed | 10 | 10 | 0 | 28.570110 |
| security | heavy, `gpt-5.6-terra`, high | completed | 8 | 8 | 0 | 29.858490 |
| performance-resources | heavy, `gpt-5.6-terra`, high | completed | 4 | 4 | 0 | 23.664930 |
| overview | light, `gpt-5.6-luna`, high | completed | 16 | 16 | 0 | 4.012691 |

Per-reviewer reported nano-AIU charges sum to **110.736851 credits**, the
runtime's own figure. There were 42 tool calls and 42 reads, 24 `view`, 17 `rg`
and one `glob`, with **no permission denial and no tool denial**, as on #10 and
#12. All recorded usage matched the assignments. Runtime reviewer events ran
from 17:09:29.690Z to 17:10:33.736Z. No timeout or intervention was applied and
the working tree was untouched throughout. Nothing was published.

**Coverage is INCOMPLETE**, on one coverage gap and three informational caveats,
with **zero execution failures**. There were zero candidates, so no adjudicator
session ran, and nothing was accepted, rejected, deduplicated or capped. This is
not a clean-review claim.

**What this run does and does not demonstrate about `C5`.**

- Every reviewer completed and every envelope parsed, so **the demotion path was
  never taken**. The run shows that `C5` does not break the ordinary path; it
  does not show a live demotion.
- The verifier nevertheless ran live on five real reviewer outputs, on the
  execution seam, before collection saw any of them, and demoted none. Every one
  carried the marker pair exactly once and parsed. That is real evidence for one
  specific risk: the predicate does not reject well-formed live model output that
  collection then accepts. It is a sixth run of live evidence for `F6`'s marker
  contract, across two model families.
- **No fallback was configured on any tier**, so no fallback attempt could have
  started even had a reviewer been demoted. The `C3` execution path `C5` feeds
  remains live-unobserved, exactly as before this increment.
- Zero candidates means the adjudicator never ran, so `envelopeVerifier` on the
  `decisions` field is controlled-only evidence.

**The reviewers said the same thing about the gap, and they are right.**
`performance-resources` recorded the one coverage gap: the captured context
holds controlled assertions but no runtime trace or workload with a configured
fallback, so latency, peak concurrent-session count and the credit charge when
several unusable outputs trigger their fallbacks cannot be assessed from the
supplied evidence. `contracts` recorded the matching caveat: the checkout and
harness changes establish the verifier's source-level integration but cannot
establish how a live runtime behaves after a malformed primary output triggers a
configured fallback. `correctness` noted that the controlled assertions were
present but not executed by the review, and `security` limited itself to the
captured diff and checkout. All four are preserved as reported. They are not
relabelled to make the review complete, and they agree with the limitations this
increment already recorded for itself.

**No defect candidate was proposed**, so no finding was fixed and none was
rejected by hand, and no implementation changed in response. Zero findings is
never a clean-review claim, and the coverage gap outranks the passing controlled
suites as a statement about what is still unknown.

The complete timeline was saved before analysis, outside the checkout, in
`c5-review-timeline.log` in this session's scratchpad, alongside
`c5-review-evidence.json` and the five original `c5-<reviewer>-verbatim.txt`
strings taken from the timeline's structured evidence. They stay local. The
retained review is bound to originating session
`13aa9f39-f66d-491b-bd5a-05be35833afb`, invocation
`cfe6ad3e-fcde-4040-8030-5bf7c90a440d`, with review key
`6df48c4664395458cb89865de3d538837b74f895a902b4a04780e3d3eeca0bdf`.

CLI 1.0.83 was used with its derived bundled SDK. No other credit-spending
probe, factory invocation or rerun was performed, and the personal configuration
file was not moved or edited. The commits after this review change documentation
only and have not been reviewed again.

### Remaining limitations

- **No live run had demoted an attempt at this checkpoint.** Every reviewer on
  #14 completed and every envelope parsed, so the demotion path was demonstrated
  only by the controlled suites, with scripted reviewer output. What #14 does
  establish is the narrower converse: the verifier ran live on five real outputs
  and demoted none of them, so the predicate does not reject well-formed model
  output that collection then accepts. `Q7`'s review of #15 later demoted a live
  attempt, recorded under that increment; nothing here about #14 changes.
- **No live run has started a fallback from a demotion, and none could have.**
  No tier had a configured fallback on #14 or on #15, and the project has never
  configured one for any live review, so the whole `C3` execution path `C5` feeds remains
  live-unobserved. #11 is still the only run where one would have fired. Whether
  a real model that emitted prose once produces a usable envelope on a different
  assignment is therefore still unestablished, and the reviewers on #14 said so
  themselves. Do not read the controlled evidence as evidence about model
  behaviour.
- The adjudicator's half is controlled-only. #14 produced zero candidates, so no
  adjudicator session ran and `envelopeVerifier` on the `decisions` field has
  never been exercised live.
- Demotion is a visible change for a user with no fallback configured: a
  reviewer that previously read `completed` now reads `incomplete`. That is more
  accurate, and it is documented, but it is a behaviour change rather than a
  pure addition.
- `envelope()` runs twice per attempt. That is deliberate and costs no credits,
  but it does mean a future change to the envelope contract has two callers that
  must stay identical; the equivalence assertions in `smoke-findings.mjs` exist
  to catch a divergence.
- The absent-path read denial recorded on #6, #11 and #13 was untouched by `C5`,
  which makes a reviewer that fails after such a denial eligible for a fallback
  rather than fixing the denial. `Q7` later changed the refusal itself; it did
  not change anything recorded here about `C5`.

## Completed increment: Q7

**`Q7` makes an absent path refused as absent rather than as a boundary escape,
and corrects a confinement defect found while implementing it.** The boundary
was discussed and approved before any code was written, as `C5`'s was.

### The two refusals, and how they stay apart

`insideRoot` resolved a requested path and returned `undefined` when that threw,
so a path that simply does not exist inside the reviewed checkout was refused
exactly like one outside it. The refusal carried no reason at all, and the
reviewer's system message says reads are confined and nothing else exists, so a
reviewer that guessed at a plausible module name had every reason to read the
silence as a boundary refusal and none to look for the right path. That has
landed on a reviewer which then failed on **#6, #11 and #13**. Association is
not causation and this roadmap has never claimed otherwise; three runs was
enough to fix the message.

**The path stays refused and no reviewer gains a read it did not have.** Only
the reason changes, and only for a request that would have been inside the root
had it existed. The test is: an absolute path, lexically under the root before
any filesystem call, whose nearest existing ancestor still resolves inside the
root. The walk climbs from the requested path towards the root and stops there,
so nothing outside the root is ever resolved or named, which is what the
approved boundary required.

The walk is what closes the oracle a lexical check alone would open. A symlink
inside the checkout pointing outside would otherwise let a reviewer distinguish
a present from an absent file *outside* the root: the present one resolves
outside and is refused as an escape, the absent one throws and would be called
absent. Resolving the nearest existing ancestor sees the symlink land outside
and keeps the escape refusal.

| Request | Decision | Reason given |
|---|---|---|
| Anything resolving inside the root | approve, unchanged | none |
| Absent, ancestors inside the root | reject | absent |
| Absent, several missing ancestors | reject | absent |
| Unexpanded brace pattern inside the root | reject | absent |
| Present or absent path outside the root | reject, unchanged | none |
| Double-dot escape, verbatim | reject, unchanged | none |
| Symlink inside the root to outside, target present or absent | reject, unchanged | none |
| In-root path failing with a permission or symlink-loop error | reject, unchanged | none |
| Relative, empty, or non-string path | reject, unchanged | none |
| Any permission kind other than `read` | reject, unchanged | none |

The six choices settled before implementation, all of which hold in the shipped
code: the out-of-root refusal stays mute; the two refusals are recorded apart as
`read` and `read-absent`; the absent message names the path relative to the root
and points at `glob` and `grep`; the walk continues only on `ENOENT` and
`ENOTDIR` and refuses on anything else; a relative path keeps today's approval
behaviour and never receives the absent reason; and the live probe asserts a
stable substring rather than the whole sentence.

**No retained-record schema changed and no version was bumped.** `retainedRecord`
picks a fixed reviewer key list that does not include `policy`, so read denials
never enter the record. They do appear in the run's logged evidence JSON, which
is where earlier denial counts were read from, and that is where the two kinds
are now distinguishable.

### The confinement defect this increment found and fixed

**`fs.realpathSync` collapses `..` textually before it resolves symlinks. The
operating system does not, and neither does the `open()` the granted read tool
performs afterwards.** The permission handler therefore approved one path while
the reviewer read another:

```
request      <root>/escape/../target.txt   escape -> a directory outside the root
realpathSync <root>/target.txt             inside the root, approved
realpath(3)  <base>/target.txt             outside the root
open() reads the file outside the root
```

Run against the pre-`Q7` implementation, the handler answered `approve-once`,
the read returned content from outside the reviewed checkout, and the run's own
evidence recorded it as an in-root read of `target.txt`. Preconditions are a
symlink to a directory in the checkout, a decoy of the same relative name inside
the root, and a reviewer that asks for that path. **The checkout is the pull
request head**, so a pull request can supply both halves, and the untrusted diff
can attempt to induce the request. The reviewer system message is a defence
against that inducement, not a guarantee.

The correction is to resolve with the operating system resolver, so the answer
the handler approves is the file that is opened. It landed as its own commit,
before the `Q7` behaviour change, with the exploit shape as a controlled
regression test. It narrows what a reviewer may read and widens nothing.

This was not a planned part of `Q7`. It surfaced because the approved boundary
required covering a path that looks contained but resolves outside, and that
case turned out to be broken rather than merely untested. The user authorized
folding it into this increment rather than scheduling it separately, so that the
hole did not sit in `main` while a separate increment waited.

### Runtime facts demonstrated, not inferred

Three no-inference probes against CLI 1.0.83 settled the design. They sent no
prompt, started no model turn and spent no credits.

- Every path reaching the permission handler from `view`, `grep` and `glob` is
  already absolute. A relative argument is resolved against the session working
  directory, which is the verified root; one that climbs out arrives as an
  absolute path outside the root. The relative branch is unreachable from the
  shipped read tools on this CLI and is defensive only.
- Absolute paths arrive verbatim. Single-dot, double-dot and trailing separators
  are not normalized by the runtime, so all normalization is the plugin's.
- A nonexistent path still fires a read permission request; the runtime does not
  pre-check existence. That is why an absent path reached the same refusal.
- A non-string or missing `path` never reaches the handler: the tool schema
  fails first with `resultType: "failure"`. An empty string does reach it.
- `{ kind: "reject" }` produces exactly `The user rejected this tool call.`
  Before `Q7` the denial said nothing about the checkout at all.
- `{ kind: "reject", feedback }` puts `The user rejected this tool call. User
  feedback: <text>` into `textResultForLlm`, the model-facing field, **and flips
  `resultType` from `rejected` to `denied`**. Attaching the reason only to the
  absent case therefore leaves every escape refusal byte-identical to before,
  result type included.

### Controlled evidence

The twelve controlled suites pass, before and after each commit. `git diff
--check` is clean.

`smoke-fixture.mjs` drives `readingReviewerPolicy` directly against a real
temporary checkout that now contains a symlink out of it, a symlink within it,
and a decoy file, and asserts every row of the table above on both the decision
and the reason it carries. Its escape regression asserts first that the request
really does open a file outside the checkout, then that the handler refuses it,
then that the refused read is never recorded as an in-root read. That assertion
was confirmed red against the previous resolver, with `approve-once` where
`reject` is required.

`smoke-reviewer-tools.mjs`, the confinement probe outside the twelve, adds the
live half on the real runtime: an absent in-root read is denied with the absent
reason naming the requested path and nothing outside it, and an absent path
outside, a symlink escape with a decoy inside, and an absent path behind that
symlink are each refused exactly as before, with no absent-path wording, no file
content and a `read` denial recorded. It spends no inference and still passes
its existing assertions unchanged.

### Installed balanced review of pull request #15

The one authorized review ran in explicit **balanced** mode, the default
topology, because this increment adds no mode. It cost **106.509803 credits**:
`correctness` 23.90053, `contracts` 28.98964, `security` 22.06032,
`performance-resources` 13.81085, `overview` 2.822913 and the adjudicator
14.92555. Four heavy specialists ran `gpt-5.6-terra`/high, overview ran
`gpt-5.6-luna`/high, and the adjudicator ran `gpt-5.6-terra`. There were 36 tool
calls and 36 confined reads, with **no permission denial and no tool denial**.

Coverage is **INCOMPLETE**: three execution failures, zero coverage gaps and
five informational caveats. Two validated findings were accepted, both P2, both
real, and both fixed on this branch. This is not a clean-review claim.

**`C5`'s demotion fired live for the first time.** The `overview` reviewer
returned an envelope whose JSON was invalid at position 3101, `envelopeVerifier`
threw, and the attempt that had settled `completed` was demoted to `incomplete`
with `Discarded unusable reviewer output`. No tier had a configured fallback, so
no fallback attempt started. That closes half of `C5`'s live gap recorded above:
the demotion path is no longer controlled-only. **The other half is unchanged.**
No live run has yet started a fallback from a demotion, because no live review
has ever had one configured.

The other two execution failures were candidate citations rejected at the
evidence boundary, from `correctness` and `contracts`. Two more candidates had
clipped-end citations repaired by `Q6` before adjudication. Both mechanisms
behaved as recorded.

### The two findings, and what changed

**`contracts:1`, P2, accepted and fixed.** The refusal formatted
`relative(root, resolve(path))`, which collapses a `missing/..` segment. A
request for `<root>/missing/../present.js`, where `present.js` exists, was told
`No such path inside the reviewed checkout: present.js`. The path genuinely does
not resolve, so refusing it is right, but naming a file that does exist is
exactly the inaccuracy this increment set out to remove. The refusal now names
the path as it was requested.

**`security:1`, P2, accepted and fixed, with its stated mechanism corrected.**
The walk began at `dirname(path)`, so a symlink in the final position was never
resolved. Every final symlink under the root was classified as an absent in-root
path. The reviewer described the consequence as an existence oracle for the
symlink's target outside the checkout. **That specific claim does not
reproduce**, and it is recorded as rejected: the reviewed implementation
answered with the absent reason whether or not the external target existed, so
the two states were indistinguishable.

The underlying defect is real and worse in a different way. Measured against the
reviewed implementation:

| Request | Reviewed implementation | After the fix |
|---|---|---|
| Final symlink, target outside, absent | absent reason | mute refusal |
| Final symlink, target outside, **present** | absent reason | mute refusal |
| Path under a dangling symlink | absent reason | mute refusal |
| Final symlink, target inside, absent | absent reason | mute refusal |
| Absent path under a resolving outside directory link | mute refusal | mute refusal |

The second row is the one that mattered: a symlink resolving to an existing file
outside the checkout was told `No such path inside the reviewed checkout`, which
contradicts the boundary this increment states. The walk now starts at the
requested path and asks `lstat` whether each entry exists before resolving it,
so an entry that exists but does not resolve keeps the mute refusal. A symlink
in the checkout may point anywhere, and where it points is not this refusal's
business. A final symlink dangling **inside** the root is now also mute, which
under-delivers rather than over-delivers.

Both fixes landed as one commit after the review, with tests confirmed red
against the reviewed implementation at `ca955b4`. The twelve suites and the
confinement probe pass again, and the probe gained the live dangling-symlink
case that the `correctness` caveat asked for. **Those commits have not been
reviewed again**; this increment's single authorization is spent.

Three caveats are preserved as reported and needed no change: that the probe did
not exercise a final dangling symlink, since corrected; that the resolver
divergence is documented on macOS only, which this roadmap already records; and
that no workload evidence substantiates a performance concern about the
ancestor walk.

### Remaining limitations

- **No live review has exercised this.** The reason is demonstrated to reach the
  tool result's model-facing text on the real runtime. What a reviewer then does
  with it is model behaviour, and no reviewer has yet been refused this way in a
  live run. Whether it recovers a reviewer that would otherwise have failed is
  unproven, and a later clean run would not prove it either.
- **`Q7` does not establish causation for #6, #11 and #13.** It removes a
  plausible cause of those failures. It cannot show it was the cause.
- **A request naming the checkout through a symlinked ancestor keeps the mute
  refusal.** Lexical containment is decided against the resolved root, so a path
  expressed through a symlinked prefix, such as `/var` for `/private/var` on
  macOS, is not lexically contained and never receives the absent reason. It is
  still approved when it resolves inside, because approval resolves the path.
  This is safe and it under-delivers rather than over-delivers. In the shipped
  configuration the reviewer's working directory and the root named in its
  prompt are both the resolved root, so a request has no source for a symlinked
  prefix; the probe hit it only because its own fixture root was unresolved.
- **`C5` is unchanged and is still not a fix for this.** A reviewer that fails
  after such a denial remains eligible for its one configured fallback. `Q7`
  makes the refusal accurate for the primary attempt and for the fallback alike,
  but it does not recover the lost output and it does not make a fallback fire.
  #15 demoted a live attempt for the first time and still could not start a
  fallback, because no tier had one configured, so that path stays
  live-unobserved.
- **A final symlink under the root never receives the absent reason**, even when
  it dangles inside the checkout. Distinguishing that case would mean resolving
  where the link points, which is what the mute refusal exists to avoid.
- The resolver correction is demonstrated on macOS. `realpathSync.native` is the
  operating system resolver on every supported platform, but the divergence
  between it and Node's implementation was reproduced here only.

### Reproduction

```sh
# The twelve controlled suites. No inference, no network.
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target; do node scripts/smoke-$s.mjs; done

# The confinement probe. No inference, but it needs a live runtime connection.
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-reviewer-tools.mjs
```

## Completed increment: V1a

**`V1a` adds `--verify` and the preflight a verification-enabled run must pass,
and deliberately executes nothing.** It is the first slice of `V1`, the opt-in
project safeguards in `SCOPE.md`. The boundary was discussed and approved before
any code was written, as `C5`'s and `Q7`'s were.

No safeguard is discovered, none is presented, none is approved, and none is
run. No reviewer receives safeguard output, and no reviewer's input changes at
all: the system message and prompts of a verification-enabled run are exactly an
ordinary review's, which `scripts/smoke-review.mjs` asserts directly. A run that
passes the preflight is an ordinary review of its selected mode, and it says so
in the timeline in those words, because a flag named `--verify` must never be
readable as evidence that something verified the change.

### The five choices settled before implementation

| Choice | Settled as | Why |
|---|---|---|
| Untracked files | Refuse, under `--verify` only | Safeguards write artifacts into the checkout; afterwards nothing can tell those apart from files that were already there. Ordinary review still warns. |
| Branch identity | Refuse a detached `HEAD` and any branch other than the captured head ref | `SCOPE.md` requires the current branch to match. A detached `HEAD` is the reviewed revision without being a branch anything can land on. |
| Where the gate lives | One gate, stricter profile | A single place decides whether a checkout may be used at all. The ordinary profile runs exactly the commands it ran before. |
| Flag interactions | Orthogonal to mode and posting flags; refused with `--capture-only`; not a configuration key | Capture-only starts no reviewer and reaches no preflight. Keeping it off the configuration keys means no saved or trusted-project setting can turn verification on. |
| A passing preflight | An ordinary review, stated plainly in the run | With nothing to discover, the only risk is that the flag reads as evidence. The run denies it explicitly. |

`SCOPE.md`'s third condition, a clean working tree, and its head-SHA condition
were already enforced for every review, which is why this slice is an addition
to an existing gate rather than a new one.

### What the gate does

`assertReviewableCheckout` takes a `verify` flag. When it is set, and only then,
it asks `git symbolic-ref --quiet --short HEAD` for the current branch and
compares it to `snapshot.pull.head.ref`, and it refuses on any untracked path.
The order narrows from identity to cleanliness: repository, head SHA, branch,
tracked-file cleanliness, untracked paths, remote head. A modified tracked file
therefore still outranks an untracked one.

Three no-inference facts this increment established, all reproduced locally:

- `git symbolic-ref --quiet --short HEAD` prints the branch when attached and
  exits non-zero with empty output when detached, so it answers the question
  directly. `rev-parse --abbrev-ref HEAD` answers `HEAD` in both the detached
  case and, in principle, for a branch of that name; git refuses to create such
  a branch, but `symbolic-ref` needs no such argument to be correct.
- `git status --porcelain=v1 --untracked-files=normal`, which the gate already
  ran, never lists ignored paths. An ordinary working checkout with its
  dependencies and build output installed passes the untracked condition.
- `gh pr checkout NUMBER` names the local branch after the head branch by
  documented default, including for a fork, so the ordinary workflow satisfies
  the branch condition. Its `--detach` and `--branch` options do not, by design.

**No retained-record schema changed and no version was bumped.** `retainedRecord`
picks a fixed outcome key list that does not include `verify`, so the flag stays
out of the record; `scripts/smoke-review.mjs` asserts that it does. It appears in
the run's logged evidence JSON and in the `R1 checkout:` line. The record's
version tracks publication authority, and verification changes none: it decides
whether a review may start, not what may be published.

### Validation

The twelve controlled suites pass, as they did at each checkpoint, and
`git diff --check` is clean. Tests were written first and confirmed red for the
right reason at each of the three implementation commits.

`scripts/smoke-checkout.mjs` drives the profile against real throwaway git
checkouts: a clean checkout on the head branch passes and reports its branch; a
detached `HEAD` at the reviewed commit refuses verification **and still passes
an ordinary review**; a differently named branch at the reviewed commit refuses;
an untracked file refuses verification while an ordinary review still only
warns; an ignored path does not refuse; and a modified tracked file still
refuses first. It also asserts the checkout is byte-identical after each
refusal, so the gate demonstrably switches, stashes and cleans nothing.

`scripts/smoke-review.mjs` covers the run: the flag parses and is orthogonal to
every mode and posting flag, `--capture-only` refuses it, each of the three new
refusals stops the run with `coverage: "not-started"` and zero reviewer sessions
while the same checkout still passes an ordinary review, and a passing preflight
starts the mode's reviewers, logs the branch it confirmed, and states that no
safeguard ran.

`scripts/smoke-reviewer-tools.mjs` was not run and was not required: `V1a` does
not touch `read-only.mjs`.

Both no-inference runtime probes pass against the **installed** plugin built
from this branch, so the flag is demonstrated to reach the real dispatch and the
real gate:

- `node scripts/smoke-runtime.mjs` accepts `--verify` as a review flag and still
  rejects `123 --verify --capture-only` with the combination error, asserting no
  model turn, subagent or tool execution in the whole probe.
- `node scripts/smoke-runtime.mjs --targets` dispatches
  `/pr-review 1 --quick --no-comment --all --verify` against the controlled
  fixture checkout. The run logs the verification notice before it starts,
  records `verify: true`, refuses with `Failed condition: local-head` under the
  heading `Quick review with --verify refused`, suggests
  `rerun /pr-review 1 --quick --verify`, starts no reviewer and no owned
  runtime, and leaves the checkout byte-identical.

That fixture's local `HEAD` is not the captured head, so the refusal it reaches
is the existing head condition rather than one of the two new ones. It
demonstrates that the flag reaches the installed gate and is reported; the
branch and untracked conditions themselves are covered by the controlled suites
against real git checkouts. Neither probe spends Copilot credits.

### Installed balanced review of pull request #16

The one authorized review ran in explicit **balanced** mode, the default
topology, because `V1a` adds no mode and changes a gate every review already
passes through. It cost **152.816643 credits**: `contracts` 39.72552,
`security` 32.78638, `correctness` 28.94156, the adjudicator 23.83625,
`performance-resources` 23.20285 and `overview` 4.324083. Four heavy
specialists ran `gpt-5.6-terra`/high, `overview` ran `gpt-5.6-luna`/high, and
the adjudicator ran `gpt-5.6-terra`/high. Five reviewers came from saved
personal configuration, and there was **no configured fallback on any tier**.

Reviewed head `88400df`, base `5d9eb8c`, nine files, 612 additions and 108
deletions. There were **38 tool calls and 39 confined reads, with no permission
denial and no tool denial**: `contracts` 13, `overview` 12 calls against 13
approved reads, `security` 9, `correctness` 4, and neither
`performance-resources` nor the adjudicator read anything at all. A read is
recorded when the permission handler approves it and a call when the runtime
reports it, so the one reviewer whose output was discarded is also the only one
whose two counts differ.

Coverage is **INCOMPLETE**: two execution failures, zero coverage gaps and five
informational caveats. One validated finding was accepted, at P2. It is real,
and it is fixed on this branch. This is not a clean-review claim.

**`C5`'s demotion fired live for the second time.** `overview` returned an
envelope whose JSON was invalid at position 2137, and the attempt was demoted
to `incomplete` with `Discarded unusable reviewer output`. No tier had a
configured fallback, so no fallback attempt started. The gap `C5` and #15 both
record is therefore unchanged: **no live run has ever started a fallback from a
demotion**, because no live review has ever had one configured.

The second execution failure is the one worth keeping. `contracts` found the
same defect as `correctness`, independently, and titled it `Do not convert
symbolic-ref failures into a detached-HEAD refusal`. It was **rejected at the
evidence boundary** for a citation that did not exactly match a supplied
context window, so it never reached adjudication. `Q6` separately repaired a
clipped-end citation in `correctness:1`'s second evidence anchor, which did
reach adjudication and was accepted. Two reviewers agreeing is not what saved
the finding. One of them citing exactly is.

Four reviewers filed the same shape of caveat, that no live runtime execution
was available and the assessment is made from the captured source. All are
preserved as reported and needed no change.

### The finding, and what changed

**`correctness:1`, P2, accepted and fixed.** The verification profile asked
`git symbolic-ref --quiet --short HEAD` for the current branch inside a catch
that discarded the error and set the branch to the empty string, which is the
value that takes the detached-HEAD refusal path. Every rejection therefore
became the same confident sentence, `this checkout has a detached HEAD at
<sha>`, with no trace of what actually happened. The reviewer named
cancellation as the case that matters: the probe is signal-aware, so an
`AbortError` raised by cancelling the run was reported as a fact about the
user's checkout.

Three exit statuses were measured locally, not inferred, against a throwaway
repository and Node's `execFile`:

| Branch probe rejection | Reviewed implementation | After the fix |
|---|---|---|
| `symbolic-ref` exits 1, HEAD is not a symbolic ref | detached-HEAD refusal | detached-HEAD refusal |
| Cancelled in flight, `AbortError`/`ABORT_ERR` | detached-HEAD refusal | propagates; the run reports the cancellation |
| Any other failure, such as exit 128 outside a repository | detached-HEAD refusal | refused, naming the failure it actually got |

Exit status 1 with empty output is the answer `--quiet` gives when HEAD is not a
symbolic ref, and it is now the only rejection read as detached. The gate also
no longer needs to guess: a cancelled probe observed nothing, so it propagates,
and anything else is refused on the `head-branch` condition with the real error
message rather than a diagnosis.

**The runner stopped reporting a cancelled gate as a refused checkout.** The
`catch` around `assertReviewableCheckout` returned `disposition: "refused"` for
anything the gate threw, so even a propagated cancellation would have been
reported as a checkout that is not the reviewed revision. It now re-throws once
the signal is aborted, before logging anything, so the cancellation reaches the
owned run and is reported as the cancellation it was. That catch is older than
`V1a` and covers the gate's two `rev-parse` catches as well, which means the
run is now truthful about a cancellation anywhere in the gate.

The controlled double had to be corrected with the implementation.
`scripts/smoke-review.mjs` modelled the detached case as an unlabelled `Error`,
which real git does not produce; it now carries exit status 1, which is what
the gate reads.

The complete stdout timeline was saved before analysis, outside the checkout, as
`~/.claude/pr-review-timelines/v1a-review-16-timeline.log`, with the run's
evidence JSON beside it as `v1a-review-16-evidence.json`. They stay local.

Both fixes landed as one commit after the review, with tests confirmed red
against the reviewed implementation at `88400df`: the cancelled probe became a
`head-branch` refusal, and the run reported `disposition: "refused"`. The
twelve controlled suites pass, `git diff --check` is clean, and both
no-inference runtime probes pass again against the plugin reinstalled from the
fixed checkout. **Those commits have not been reviewed again**; this
increment's single authorization is spent.

### Remaining limitations

- **A branch name is not a lineage.** The gate proves the current branch carries
  the pull request's head branch name, not that it is that branch. Head SHA
  identity is what actually binds the revision, and it was already enforced.
- **A `gh pr checkout --detach` or `--branch other-name` workflow is refused**
  under `--verify`, and correctly so, but it is a real friction for anyone who
  uses one. The message names both the expected and the current branch.
- **Nothing about safeguard execution is demonstrated, because nothing executes.**
  The flag's whole purpose is still ahead of it.
- **The two new conditions have no installed-plugin evidence of their own.** The
  runtime fixture refuses earlier, on the head condition. Only the controlled
  suites exercise the branch and untracked refusals, against real git checkouts
  but not through the real dispatch.
- **No live run has been cancelled during the preflight.** The corrected
  cancellation path is covered by the controlled suites only. What #16 observed
  was the defect in the source, not a cancelled run.
- **Called directly, the gate still shapes a cancellation during either
  `rev-parse` as a refusal** carrying the abort message, rather than propagating
  it the way the branch probe now does. Only the run is demonstrably truthful
  about those two, because the runner re-throws once the signal is aborted.
  Making the gate itself uniform is recorded, not done: those catches predate
  `V1a` and no review has asked for them.

### Reproduction

```sh
# The controlled suites cover every V1a refusal and the pass-through. V1b added
# safeguards as the thirteenth.
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done

# The installed-plugin probes. No inference and no credits, but they need a live
# runtime connection and the plugin installed from this checkout.
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

## Completed increment: V1b

**`V1b` adds safeguard discovery and presentation, and still executes nothing.**
It is the second slice of `V1`. Like `V1a`, its boundary was discussed and
approved before any code was written, one choice at a time.

A verification-enabled run that passes `V1a`'s preflight now reads the markdown
files at the root of the checkout, asks one bounded pass which safeguard commands
those files declare, and presents each command with the file it came from. No
command is approved, none is executed, and no reviewer's input changes at all:
`scripts/smoke-review.mjs` asserts that no discovered command reaches a reviewer
prompt, and that an ordinary review starts no discovery pass whatsoever.

### The five choices settled before implementation

| Choice | Settled as | Why |
|---|---|---|
| Where commands come from | The project's own agent instructions, and only those | The user chose this over a package manifest: it is what a project actually writes for an agent, it works in every language, and a manifest-only source would find nothing in this repository. Manifest entry points and best-effort stack inference are recorded as later slices, in that order. |
| What is excluded | Nothing, in this slice | The install, auto-fix and watch-mode exclusions are rules about what may be approved and executed. Building them here would protect nothing, so they land in the approval slice, beside the thing they guard. |
| What is presented | The command and the file it came from | The quoted line and a code check that the line really appears there are deferred for the same reason: an invented command can do nothing until something can approve one. The provenance field is where they will slot in. |
| Which files are read | Conventional names plus other root markdown, size-capped, read from the checkout | The preflight already proved the checkout is the reviewed revision, so refetching would add a second source of truth that could disagree. A fixed conventional list would have missed this repository's own commands. |
| An empty or failed pass | Reported plainly; review coverage untouched | Incomplete coverage means a reviewer did not cover part of the change, and that meaning is worth keeping narrow. Discovery grounds no finding in this slice, so its failure cannot make the review less trustworthy. |

**Prompt injection through instruction files is accepted for this release, not
overlooked.** The files are read at the pull request's head, so a branch controls
what they say. The user decided the tool's use on their own and their team's
pull requests makes that acceptable for v1, which dropped the mitigation that had
been proposed, of diffing the instruction files against the base and refusing
commands from a file the branch modified. Revisit this before the tool is used on
pull requests from outside a trusted team, and note that nothing discovered can
act until the approval slice exists.

**From this slice on a `--verify` run spends one extra model turn** than the same
review without the flag, unless the checkout root holds no markdown at all, in
which case discovery costs nothing and says so.

### What the run does

`discoverSafeguards` in `review.mjs` runs after `startRuntime()` and before the
mode's specialists, so the commands are on screen before the review that does not
use them. It is deliberately not a reviewer:

- it holds no tool and is never given the checkout, exactly as the adjudicator is
  not, and decides on the supplied file text alone;
- it takes no configured fallback, because a fallback answers a gap in review
  coverage and discovery is not part of that coverage;
- a pass that fails, returns an unusable envelope, or cannot start at all is
  recorded as a failed discovery while the reviewers run on, and the run's
  `complete` and `coverage` are decided by the reviewers exactly as before;
- a cancellation is re-thrown before anything is recorded, so it reaches the
  owned run as the cancellation it was. This is the shape #16's review taught:
  a bare `catch` around a signal-aware call turns a cancelled run into a
  diagnosis of something else.

`collectInstructionFiles` reads the checkout root's markdown only: no recursion,
no symbolic link followed out of it, no file over 64KB, and a 256KB budget for
the run. Every file read and every candidate skipped is named with its reason,
because a source dropped in silence cannot be told apart from a project that
documented nothing.

Code decides what the pass's answer may say. `discoveryEnvelope` checks the
schema, the binding key, the exact field sets, the command length and that a
command is a single line without control characters, since discovered text is
printed to a terminal. **A command may only be attributed to a file this run
actually read**, which is the acceptance criterion about presenting nothing
outside the agreed sources, enforced in code rather than asked for in a prompt.
The marker unwrap is now shared from `findings.mjs` as `unwrapEnvelope` rather
than reimplemented, so the one rule about wrapper tolerance still lives in one
place.

**No retained-record schema changed and no version was bumped.** `retainedRecord`
picks a fixed outcome key list that does not include `discovery`, and
`scripts/smoke-review.mjs` asserts it stays out. Discovery decides nothing about
publication authority.

### Validation

Thirteen controlled suites now pass, `git diff --check` is clean, and tests were
written first and confirmed red for the right reason at each implementation
commit. `scripts/smoke-safeguards.mjs` is the new suite: it drives file
collection against real temporary directories, covering the size cap at and above
its edge, the run budget, a symbolic link, a directory named like a markdown
file, case-insensitive extensions, reading order and a project with no markdown
at all. It then drives the envelope against sixteen malformed answers, including
a command citing a file that was never read and one carrying a terminal escape
sequence, and checks that the presentation names its sources and never reads as
evidence that anything ran.

`scripts/smoke-review.mjs` covers the run: a passing preflight presents each
command with its file before any specialist starts; an ordinary review starts no
discovery pass and logs nothing about one; a root with no instruction file spends
no model turn; files that declare no command produce an honest empty answer; a
malformed envelope, a pass that errors and a pass that cannot start each leave
`complete` true and the reviewers running; and a cancellation during discovery is
reported as a cancellation rather than a refused checkout or a failed discovery.
The harness keeps the discovery session out of the reviewer sessions every other
assertion counts, and asserts it is zero-tool and never handed the checkout.

`scripts/smoke-reviewer-tools.mjs` was not run and was not required: `V1b` does
not touch `read-only.mjs`.

### Remaining limitations

- **Nothing about approval or execution is demonstrated, because neither
  exists.** The flag's purpose is still ahead of it.
- **The instructions tier is the only source.** A project that declares its
  commands in a package manifest, a task-runner file or a CI workflow, and
  nowhere in prose, finds nothing. That is every non-documenting project.
- **A presented command is not checked against the file it cites.** Code proves
  the file was read, not that the command appears in it, so a pass that
  misattributes or paraphrases a command is not caught. That check was
  deliberately deferred to the approval slice.
- **The discovery pass borrows the reviewer execution seam**, so the timeline
  announces it as `Reviewer safeguard-discovery`, the way the adjudicator is
  announced as a reviewer too. The intro line says it is not one. Renaming the
  noun would touch the seam every mode shares and no review has asked for it.
- **The pass runs on the heavy tier**, reusing the assignment the adjudicator
  reuses, because every mode has one. A cheaper tier for what is an extraction
  task is a possible refinement, unmeasured.
- **This increment has no installed-plugin evidence at all, and was merged
  anyway.** That is a deliberate, user-authorized departure from the rule in
  `AGENTS.md` that an increment touching `extensions/` is not demonstrated until
  the installed plugin has reviewed its own pull request. See the two sections
  below. Nothing in `V1b` has been exercised through the real dispatch, the real
  models or a real `gh` request: every claim here rests on the controlled suites.

### The first review attempt refused, and why

**The single authorized review of pull request #17 never reached a reviewer.**
The installed plugin refused during PR capture, with:

```text
Error: PR capture failed (api --hostname): Command failed: gh api --hostname
github.com --method GET repos/xpepper/copilot-pr-review/pulls/17
-H Accept: application/vnd.github.diff
the response contains terminal escape sequences; pass --allow-escape-sequences
to output it anyway
```

Coverage was `incomplete` with six execution failures, all of them
`Review did not reach specialist execution`. No reviewer session started, no
owned runtime ran, and the runtime reported no charge. The timeline is at
`~/.claude/pr-review-timelines/v1b-review-17-timeline.log`.

**The cause was this increment's own test fixture.** The case that proves a
discovered command may not carry a terminal escape sequence was written with a
raw `ESC` byte embedded in `scripts/smoke-safeguards.mjs`, rather than as a
source escape. That made the file binary to `grep` and made the repository's own
pull-request diff something `gh` refuses to print. The fixture now spells the
same byte as `\u001b`, the case under test is unchanged, and `gh` returns the
diff normally again.

**`--allow-escape-sequences` was deliberately not added to the capture.** That
refusal is `gh`'s own protection against a hostile diff writing escape sequences
into a terminal, and passing the flag to make a run succeed would be weakening a
gate for convenience, which `AGENTS.md` forbids. It is recorded here as a real
limitation instead: **this tool cannot review a pull request whose diff contains
terminal escape sequences**, and it fails at capture with a message that names
`gh`'s flag rather than explaining the situation. Whether to handle such a diff
safely, by capturing to a file rather than through a terminal-bound pipe, is a
separate question and is not scheduled.

Worth keeping: the tool refused to read a diff whose content could have attacked
the terminal it was printed to, and the content in question was a test asserting
that this tool refuses exactly that. The protection and the feature agreed.

### No second review was run, and the increment merged without one

**The user was told the increment had no verification of record and chose to
merge pull request #17 without rerunning the review.** The standing workflow
authorizes exactly one review per increment pull request; that one was spent on
the refused capture above, and a rerun needs a fresh explicit instruction, which
was not given. This is recorded as a decision, not an oversight.

What that costs, concretely. `V1b` adds a model pass to the run, and no live
evidence exists that:

- the discovery pass reaches the real dispatch at all, or that a real model
  returns the envelope contract this increment defined;
- `collectInstructionFiles` behaves against this repository's own root, where it
  should read `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md` and `SCOPE.md`, and skip
  `README.md` and `ROADMAP.md` for size;
- a real pass attributes commands to the right files, or how often it invents or
  paraphrases one, which is the risk the deferred citation check exists for;
- the extra model turn's real credit cost, which is therefore unknown.

**The next increment's review should be treated as covering `V1b` as well as its
own change.** Read the discovery output in that timeline with the scepticism due
to a path no live run has ever taken, and record what it shows here.


## Completed increment: V1c

**`V1c` adds per-command safeguard approval, and still executes nothing.** It is
the third slice of `V1` and the last one before pull-request controlled code
runs. Like `V1a` and `V1b`, its boundary was discussed and approved before any
code was written, one choice at a time.

A verification-enabled run that has discovered commands now asks which of them
may run, records that answer, and continues as an ordinary review. Nothing is
executed on the strength of the answer, no reviewer receives an approved command,
and the approval does not outlive the run that recorded it.

### The six choices settled before implementation

| Choice | Settled as | Why |
|---|---|---|
| The exclusions | **None in `V1c`.** Every discovered command is offered, including one that installs, migrates, deploys, formats in place, auto-fixes or watches. Moved to `V2`. | Reversed during the discussion, on the user's argument. Choice 5 keeps the approval out of the retained record, so a `V1c` approval can never be consumed by anything; a refusal here therefore guards nothing, which is the same reasoning `V1b` used to defer them in the first place. `SCOPE.md` prohibits *running* such commands, and this increment runs none. A refusal list is also a heuristic: the one drafted during the discussion refused this repository's own `copilot plugin install` but passed `gh pr checkout`, the dogfood review command and a bare `vitest` that watches by default. |
| The citation check | **None in `V1c`.** Code still proves only that the cited file was read. Moved to `V2`. | Reversed during the discussion on evidence from this repository. Its own safeguards are written as `node scripts/smoke-<name>.mjs` in prose, as `node scripts/smoke-$s.mjs` inside a shell loop, and, for the dogfood command, wrapped across two source lines inside one pair of backticks. An exact quote check would refuse almost all of it, or force the pass to return a loop variable as the command. The same failure mode that ruled out an allowlist of known runners. |
| Granularity | **Per command**, using the opaque invocation-scoped choices finding selection already uses. | A project declares a mix worth separating, such as a fast lint beside a suite that takes half an hour. All-or-nothing pushes a user toward accepting a command they would refuse on its own, because refusing it costs them every other command. It is the one place where the absolute cheapest option was not taken, and the user was told so. |
| Placement | **Immediately after discovery, before any reviewer starts.** | The only placement that leaves room for `V2` to run an approved command where its output could ground a reviewer's claim, which `SCOPE.md` names as the flag's purpose. Beside finding selection would foreclose it. Cheapest to build as well: it is a few lines inside the block that already runs discovery. The cost is that the run waits on a human before any reviewer starts. |
| The retained record | **Approval stays out. No schema version minted.** | The version ladder means one thing today, how much publication authority a record carries, and safeguard approval would make the number mean two unrelated things. A stored approval is also the artifact a later increment could mistake for standing permission to execute. `V1b` set the precedent with discovery. |
| Configuration and flags | **Nothing.** No key, no trusted-project allowlist, no approve-everything flag. | A saved approval is standing permission to run pull-request controlled code, granted before anyone has seen what this pull request's instruction files declare. `V1a` kept the flag itself off the configuration keys for the same reason, and `SCOPE.md` already forbids publication flags and the saved automatic-posting setting from bypassing approval. |

**Two of these reverse what `V1b` recorded.** `V1b` deferred the exclusions and
the citation check specifically to the approval slice, "beside the thing they
guard". The discussion established that the thing they guard is execution, not
approval: with choice 5 settled, an approval cannot outlive its run, so nothing
built here could ever be the gate a command passes on its way to running. They
move to `V2` for that reason, and `V2` gains the first live discovery output to
design them against, which no increment has had.

### What the run does

`approveSafeguards` in `safeguards.mjs` runs immediately after
`discoverSafeguards`, inside the same `verify` block in `review.mjs`, before any
specialist starts:

- each discovered command is one choice, titled with the command and the file it
  was declared in, keyed by an opaque `invocationId:index` value, so an answer
  cannot approve a command by its position in another run's list;
- the recorded answer keeps discovery's order, never the order the choices were
  picked in;
- an unavailable elicitation host, a decline, an empty acceptance and an answer
  code cannot account for all approve nothing and leave the reviewers to run.
  Approval grounds no finding, so an unanswered question cannot make the review
  itself less trustworthy, and none of these is incomplete review coverage;
- a cancelled approval aborts the run before any reviewer starts, and is
  reported as the cancellation it was rather than as a refused checkout or a
  failed approval. `signal.throwIfAborted()` after the log is what enforces it;
- the failure path returns `failed` rather than throwing, because failing open
  here is the one mistake this gate exists to prevent.

**No retained-record schema changed and no version was bumped.** `retainedRecord`
picks a fixed outcome key list that excludes `approval` exactly as it excludes
`discovery`, and `scripts/smoke-review.mjs` asserts both stay out and that the
schema version of a verification run equals an ordinary run's.

`verificationNotice` and the preflight's own timeline line both said no command
is approved. That was `V1b`'s boundary, not this one, and both now state this
increment's: an approval is asked for per command and recorded, nothing is
executed on it, and the offered list is unfiltered.

### Validation

Thirteen controlled suites pass, `git diff --check` is clean, and tests were
written first and confirmed red for the right reason at each implementation
commit. No new suite was added: approval is covered where discovery is, so the
suite count is unchanged at thirteen.

`scripts/smoke-safeguards.mjs` drives the approval unit surface: a subset, a
reordered acceptance, an empty acceptance, a decline, a cancel, a host with no
elicitation UI, six answers code cannot account for, a choice minted for another
invocation, a wrong originating session, three discovery outcomes with nothing to
approve, and an already-cancelled run. It checks every presentation string says
plainly that nothing ran, that none of them claims incomplete coverage, and that
none implies a command was vetted. It also asserts the module cannot spawn a
process at all, which is what keeps `V1c` executing nothing while `V2` is ahead.

`scripts/smoke-review.mjs` drives the run: the question is asked once, after
discovery and before the first specialist, and the approved subset is recorded;
no reviewer prompt carries an approved command; a decline, an empty answer and
an unaccountable answer each leave `complete` true with the reviewers running;
an absent UI approves nothing; a cancel starts no reviewer; nothing discovered
asks nothing; an ordinary review asks nothing and records no approval; and a run
with `--all --comment` and an effective `autoPostReviews=true` is still asked and
still approves nothing when declined, which is `SCOPE.md`'s requirement in one
assertion.

`scripts/smoke-checkout.mjs` pins the notice the flag prints about itself.
`scripts/smoke-reviewer-tools.mjs` was not run and was not required: `V1c` does
not touch `read-only.mjs`.

### Remaining limitations

- **Nothing about execution is demonstrated, because it does not exist.** The
  flag's purpose is still ahead of it.
- **The offered list is unfiltered, deliberately.** A command that installs,
  migrates, deploys, formats in place, auto-fixes or watches is offered like any
  other. Watching is the sharp case for `V2`: `SCOPE.md` forbids review timeouts,
  and `C3` and `C5` depend on their absence, so an approved watch command would
  have nothing to end it.
- **A presented command is still not checked against the file it cites.** Code
  proves the file was read, not that the command appears in it.
- **The run now waits on a human before any reviewer starts.** A verification run
  left unattended reaches no reviewer at all, where previously the first question
  came after they had finished. That is the accepted cost of the placement, and
  #18's performance-resources reviewer named the unmeasured resource and credit
  behaviour of a run left waiting there. A host with no elicitation UI, which is
  what the dogfood runner is, never waits at all.
- **The instructions tier is still the only discovery source**, so a project that
  declares its commands only in a manifest, a task runner or a CI workflow finds
  nothing to approve.
- **`V1b`'s discovery path now has installed-plugin evidence, and it found
  nothing.** The pass reached the real dispatch and returned a well-formed empty
  envelope against this repository's own root. See below for what that shows and
  why it is the correct answer to the contract the pass was given.
- **`V1c`'s interactive approval path has no installed-plugin evidence**, because
  discovery returned nothing to approve. Only the `not-started` branch ran live.
  Two of #18's reviewers reported that gap themselves.

### The installed-plugin review of pull request #18

**One authorized balanced review ran, with `--verify`, and it found two real
defects that all thirteen controlled suites had passed over.** The timeline is at
`~/.claude/pr-review-timelines/v1c-review-18-timeline.log`.

`--verify` was chosen deliberately over a plain balanced run. It costs one extra
model turn and it is the only way to exercise `V1b`'s discovery path live, which
merged with no installed evidence at all. It executes nothing, and the dogfood
runner registers no elicitation handler, so approval could report itself
unavailable but could never block the run.

| Fact | Value |
|---|---|
| Command | `node scripts/dogfood-review.mjs 18 --balanced --verify --all --no-comment` |
| Head reviewed | `a3d590a689d56dc9875dfe1cc9149c25bd11f46d` |
| Heavy reviewers | `gpt-5.6-terra`, reasoning `high`, four of them |
| Light overview | `gpt-5.6-luna`, reasoning `high` |
| Adjudicator | `gpt-5.6-terra`, reasoning `high` |
| Coverage | `incomplete` |
| Candidates | 2, of which 1 reached adjudication |
| Validated findings | 0 |
| Withheld / rejected | 0 / 0 |
| Credit cost | 166.859549 |

**The adjudicator's output was unparseable and was discarded**, with
`SyntaxError: Expected ',' or '}' after property value in JSON at position 1734`.
That is exactly the `C5` case: a completed reviewer whose output the evidence
boundary discards is an eligible failed attempt. No fallback is configured on the
heavy tier, so the attempt was not retried and the review stayed `incomplete`
with no validated finding. `C5` is therefore observed live for the first time,
and a live review with a fallback configured remains the open question it was.

**Both candidates were real defects, and both are fixed on this branch.**

- *contracts, P3: the discovery presentation still deferred the offer.* It closed
  with "these are the commands a later increment would offer to run" and "none of
  this was approved", which `V1c` makes false, because the approval question
  follows in the same run. **The evidence boundary rejected this candidate**, with
  "Citation does not exactly match a supplied context window", so it never reached
  adjudication. The defect is real regardless: it was confirmed by reading the
  code, and fixed in `5844da3`. This is the first recorded case of the evidence
  gate rejecting a candidate that was independently verified to be true, which is
  the accepted cost of an exact-citation gate rather than a defect in it.
- *overview, P2: the exact-next-increment section was stale.* The `V1c` entry was
  recorded as completed while the section below it still said `V1c` was next,
  which would have sent the next session to redo a finished slice. Fixed below.
  **`Q6`'s clipped-end citation repair fired on this candidate**, twice, on its
  location and on its `after` citation, restoring exact bound source and letting
  the candidate reach adjudication. `Q6` recorded that its live repair behaviour
  was unobserved; this is the first observation of it.

**Two coverage gaps were reported, and both are accurate.** Correctness named the
untested dependency on the installed host's elicitation UI accepting the
multi-select schema and returning its documented actions. Performance-resources
named the unmeasured resource and credit behaviour of a run left waiting on an
unanswered approval. Neither can be closed without a host that answers the
question; see the limitation below.

### What the live run showed about `V1b`, whose discovery path had never run

**The discovery pass reached the real dispatch, completed, and returned a
well-formed envelope.** `F6`'s marker contract and `discoveryEnvelope` both held
against a real model on the first attempt:

```text
Reading 4 instruction file(s) from this checkout: one pass, which is not a reviewer,
and nothing it reports is approved or executed by this run.
Untrusted safeguard discovery output:
<<<PR_REVIEW_JSON>>>
{"schemaVersion":1,"discoveryKey":"d86b9c...","commands":[]}
<<<END_PR_REVIEW_JSON>>>
V1b safeguard discovery found no command declared in this project's instructions.
Read: AGENTS.md, CLAUDE.md, HANDOFF.md, SCOPE.md. Skipped: README.md (exceeds 65536
bytes), ROADMAP.md (exceeds 65536 bytes).
```

`collectInstructionFiles` behaved live exactly as `V1b`'s entry predicted: the
four files under the cap were read, and `README.md` and `ROADMAP.md` were skipped
for size and named.

**It found no command at all, in the repository that is this tool's own first
user.** That is the increment's real limitation, demonstrated rather than
suspected. The cause is well supported by the source it read: this project states
its safeguards only as a two-line shell loop,
`for s in findings review ...; do node scripts/smoke-$s.mjs; done`, and as the
placeholder `node scripts/smoke-<name>.mjs`, while `node scripts/smoke-runtime.mjs
--targets` is the tail of a multi-line command carrying two environment variables.
The pass is instructed never to repair a partial command or assemble one out of
prose, and the envelope requires a single line, so reporting nothing was the
correct answer to the contract it was given.

This is the same evidence that led `V1c` to drop the citation check, reached from
the other direction. `V2` inherits both facts: a project whose commands are
written for a human reader rather than as runnable lines yields nothing today,
and no exact-quote check can fix that.

**A consequence for this increment: `V1c`'s interactive approval path has no live
evidence.** Discovery returned nothing, so only the `not-started` branch ran, and
it ran correctly. The elicitation request, an accepted subset, a decline and a
cancel have been demonstrated only against the controlled harness.

## Completed increment: V2a

**`V2a` runs an approved safeguard.** It is the first increment in which
pull-request controlled code executes on the user's machine, and everything
before it was built so that this one could be small. Its boundary was discussed
and approved before any code was written, one choice at a time, as `V1a`, `V1b`
and `V1c`'s were.

`V2` was split. `V2a` executes and reports to the person who approved. `V2b`
decides whether that output reaches a reviewer and what the retained record says
about what ran. The seam is clean because nothing in `V2a` needs to know a
reviewer exists, and the split keeps the largest safety boundary in the project
out of the largest diff in the project.

### The eight choices settled before implementation

| Choice | Settled as | Why |
|---|---|---|
| Slicing | **Two increments.** `V2a` executes and reports to the user alone. `V2b` takes reviewer visibility and the retained record. | Safeguard output is pull-request controlled text, so handing it to a reviewer opens an injection surface that has nothing to do with running a process. Both gates stay with `V2a`, because a slice that executes without them re-creates exactly the defect `V1c`'s argument identified. The user added a standing principle here: the smaller the increment the better, provided it stays coherent and meaningful. |
| Live evidence | **Two runnable safeguard lines in `AGENTS.md`, and the one authorized review is run interactively** by the user typing the slash command, so the host's elicitation UI can answer. | `scripts/dogfood-review.mjs` registers no elicitation handler, so it reports approval `unavailable` and can never approve or execute. Making a command discoverable is therefore not enough on its own. The interactive run closes the exact gap #18's correctness reviewer named, the untested dependency on the installed host accepting the multi-select schema and returning its documented actions. The alternative of teaching the dogfood runner an elicitation handler was refused: its current safety value is precisely that it has none. |
| Mechanism | **No shell.** Whitespace split, a strict character allowlist, `spawn` with an argument list, cwd at the checkout root, git and `gh` environment overrides scrubbed, `stdin` closed. | It is the only mechanism that makes the exclusions mean anything: against `sh -c`, `npm test && npm install` defeats any rule that reads the first word, and quoting defeats the rest. It also matches what `target.mjs` and `checkout.mjs` already do and say. The cost is stated rather than mitigated: this repository's own `for` loop is refused, which is why the live-evidence choice adds two plain lines. |
| The exclusions | **Refuse in code, before the offer.** Discovery still reports every command with its reason; approval offers only what survives; execution asserts the rule again before it spawns. | A command that may not run must never be put to a person as though it could. Reporting it anyway is what keeps a refusal distinguishable from a project that declared nothing. Re-asserting before the spawn is the belt: approval is the person's decision, and the check beside the spawn is the code's. |
| The citation check | **Token-bounded exact occurrence** in the text of the cited file, which this run read. | `V1c` dropped an exact quote on evidence that it would refuse almost everything this repository declares. That evidence no longer bites, because the shell gate already refuses every one of those shapes: a loop, a continuation, a quoted argument. What is left to check is only whether a plain single line is written where it says it is. Token bounding is what stops `npm run test` being carved out of `npm run test:unit`. |
| Output and artifacts | **Bounded capture, never a kill.** 8 MiB held per stream, the tail displayed, truncation stated. One `git status --porcelain` afterwards names what running project code left behind. | A chatty suite is not a failing one, so reaching the bound must not kill it, and the pipe is drained past the bound so nothing blocks on a reader that stopped listening. The preflight already proved the tree was clean, so the status read is an exact statement of what the safeguards changed. Nothing is reverted, stashed or cleaned, which `SCOPE.md` requires. |
| Cancellation | **Process-group `SIGKILL`, and no timer anywhere.** Commands run sequentially in discovery order; a cancelled run starts no further command. | `SCOPE.md` requires cancellation to stop owned work, and a test runner's workers are owned work. `detached: true` plus `process.kill(-pid)` is what reaches them. There is deliberately no escalation delay and no deadline: `SCOPE.md` forbids review timeouts, and `C3`, `C5` and the watch exclusion all depend on their absence. |
| A failed safeguard | **Not review coverage.** Reported loudly as its own outcome; `complete` and `coverage` stay exactly as the reviewers determined. | The same reasoning `V1b` used for discovery and `V1c` for approval. No reviewer receives safeguard output in this slice, so a safeguard grounds no finding, so a failing suite cannot make the review's own findings less trustworthy. `V2b` may change this, and would have to argue for it. |

### What the run does

`executeSafeguards` in `safeguards.mjs` runs immediately after
`approveSafeguards`, inside the same `verify` block in `review.mjs`, before any
specialist starts:

- only commands a person approved in this run reach it, and only after
  `commandRefusal` is asserted once more in the moment before the spawn;
- each runs as one process with no shell, in the checkout root, with `stdin`
  closed so a command that stops to ask a question fails instead of waiting
  forever on a review that has no timeout to rescue it;
- output is captured to a bound per stream and the end is displayed, because
  that is where a failing suite says what failed;
- cancellation kills the whole process group, so a runner's workers do not
  outlive the review, and no further command is started;
- one `git status --porcelain` afterwards reports what was left behind, and
  nothing is reverted, stashed or cleaned;
- a failed or refused safeguard is reported as itself and leaves review coverage
  alone.

**Nothing about execution enters the retained record**, exactly as discovery and
approval do not. `scripts/smoke-review.mjs` asserts `safeguards` stays out, and
no schema version moves. Answering that question by building the plumbing early
is precisely what `V2b` exists to prevent.

**Three stale statements were corrected**, all of which the controlled suites had
been asserting: the discovery presentation said this release executes none of the
commands, the approval question said nothing runs in this release, and both the
preflight timeline line and `verificationNotice` said no approved command is
executed and that the offered list is unfiltered.

### The exclusions are a heuristic, and here is what it misses

The table refuses programs that install, escalate privilege, change the machine,
move data over the network, drive version control, provision or deploy, or watch;
any token that names an installing, migrating, deploying, publishing, creating,
cleaning, serving, formatting or fixing verb; a set of write-in-place and watch
flags; a placeholder word; a shell keyword or builtin, which a wrapped construct
can present as its own first line carrying no metacharacter at all; and `vitest`
in the bare form that watches by default.
Known holes, recorded rather than papered over:

- **`node scripts/dogfood-review.mjs ...` passes every rule**, because its
  program is `node` and its arguments name nothing refused. It spends Copilot
  credits. Only an allowlist of known runners would catch it, and that was ruled
  out for the reason the exact-quote check was.
- **A project script can hide anything.** `npm run check` may install, deploy or
  watch, and nothing here can see inside it.
- **Combined short flags are not decomposed**, so `-gy` is not read as `-g -y`.
- **False refusals are expected.** `cargo test --features clean` is refused for
  the word `clean`. The refusal is visible and names its rule, and a project can
  answer it by declaring the command differently.

### Validation

Thirteen controlled suites pass, `git diff --check` is clean, and tests were
written first and confirmed red for the right reason at each implementation
commit. No new suite was added: execution is covered where discovery and approval
are, so the count is unchanged at thirteen.

`scripts/smoke-safeguards.mjs` drives the unit surface: fourteen shapes that need
a shell and ten that do not; twenty-seven exclusion cases and the two `vitest`
forms that are safeguards again; the citation check against a fragment, a
fabrication, an unread file and this repository's own shell loop; a passing and a
failing command with their exit status and output; a command that does not exist;
the re-assertion before the spawn; four approval outcomes that start no process;
a truncating capture that still passes; artifacts present, absent and unreadable;
a cancel before execution; and a cancel during execution that kills a grandchild
process the safeguard started, asserted by signalling that pid until it is gone.

`scripts/smoke-review.mjs` drives the run: an approved command runs after
approval and before the first specialist, its output reaches the timeline and no
reviewer prompt; a failing safeguard leaves `complete` true and `coverage`
completed; a refused command is never put to a person and is still reported with
its reason; an invented command is refused as uncited; an ordinary review runs
none of it; and `safeguards` stays out of the retained record.

`scripts/smoke-checkout.mjs` pins the notice the flag prints about itself, which
now states what an approved command does and that this is not a sandbox.

**`scripts/smoke-reviewer-tools.mjs` was not run and is not required**: `V2a`
does not touch `read-only.mjs`. The handoff for `V1c` predicted `V2` would touch
the question it answers. It does not: reviewer confinement is unchanged, and what
`V2a` adds is a separate path that no reviewer can reach.

### The installed-plugin review of pull request #19

**One authorized balanced review ran, with `--verify`, typed interactively so
that the host's approval UI could answer.** It reached that UI, discovery found
three commands in this repository's own files, the citation gate refused one of
them, and the person answered without approving anything. Nothing executed.

| Fact | Value |
|---|---|
| Command | `/pr-review 19 --balanced --verify --all --no-comment`, typed in an interactive Copilot session |
| Head reviewed | `8106ac3c9b80a19dc1f1fcf487054fddb73a4201` |
| Heavy reviewers | `gpt-5.6-terra`, reasoning `high`: correctness, contracts, security, performance-resources |
| Light overview | `gpt-5.6-luna`, reasoning `high` |
| Adjudicator | `gpt-5.6-terra`, reasoning `high` |
| Coverage | `incomplete` |
| Candidates | 8 produced, 4 reached adjudication |
| Validated findings | 1 |
| Withheld / rejected | 0 / 2 rejected on the merits, 4 rejected at the evidence boundary, 1 adjudication invalidated |
| Credit cost | 252.771985 |

#### What discovery and approval did, live

**The elicitation request reached a real host and a real answer came back.**
`V1c` merged with the interactive approval path demonstrated only by the
controlled suites, and #18's correctness reviewer named the untested dependency
on the installed host accepting the multi-select schema and returning one of its
documented actions. That dependency is now half closed: the host accepted the
schema and returned a documented action. What is still untested is `accept`
carrying a non-empty selection, and therefore execution itself.

**The record cannot say which answer it was.** `approveSafeguards` returns
`none` both for a decline and for an accept that selected nothing, so the
recorded `{"status":"none","approved":[],"offered":2,"refused":1}` is consistent
with either. Nothing runs in either case, so this changes no outcome; it is
recorded because a later increment reading the record should not believe it says
more than it does.

Discovery read `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md` and `SCOPE.md`, and skipped
`README.md` at 101652 bytes and `ROADMAP.md` at 444530 bytes for size, exactly as
`V1b` predicted. It reported three commands:

| Command | Cited file | Verdict |
|---|---|---|
| `node scripts/smoke-safeguards.mjs` | `AGENTS.md` | offered |
| `node scripts/smoke-review.mjs` | `AGENTS.md` | offered |
| `node scripts/smoke-reviewer-tools.mjs` | `HANDOFF.md` | refused: it is not written in that file as a command of its own |

**The two plain runnable lines this increment added to `AGENTS.md` were found,
and they were the only two offered.** That is the live-evidence choice working:
before `V2a` added them, this repository declared nothing a discovery pass could
offer, which is why #18 found no command at all.

**The citation gate refused a constructed command, live, for the reason it
exists.** `HANDOFF.md` writes `scripts/smoke-reviewer-tools.mjs` inside prose
about the confinement probe; it never writes `node` in front of it. The pass
supplied the runner itself, and the gate refused the result as uncited. This is
the first live evidence that the check catches a command a model assembled
rather than copied, and it is worth more than the controlled fabrication case
because nothing was staged to produce it.

**The exclusion table recorded no live refusal at all.** The pass reported only
those three candidates. It did not report this repository's own `for` loop,
`copilot plugin install "$(pwd)"`, `gh pr create`, or the wrapped dogfood
command, all of which the handoff predicted it might, and it did not report
`node scripts/smoke-runtime.mjs --targets`, which both gates would have accepted.
So the exclusions remain demonstrated only by the controlled suites. A discovery
pass that reports little is a safe failure and not a defect, but it is also not
evidence, and this entry must not be read as though the table had been exercised.

#### The findings, and what changed

**One candidate was validated, and its remedy is refused on the merits.**
Contracts, P1, `review.mjs:374-379`: the revision and cleanliness gate runs
before safeguards, the same checkout root then goes to the specialists, and only
an informational status read sits between them, so a reviewer can read a file an
approved safeguard changed. **The observation is true and the proposed remedy is
not adopted.** Re-asserting the checkout invariant after execution contradicts
`SCOPE.md`, which says in the same breath that these commands "may create
artifacts" and that this tool must "never automatically switch branches, pull,
stash, or clean the checkout". A re-assertion would refuse the review because the
person's own approved test suite wrote a coverage file, or it would clean the
checkout to satisfy itself. Both are forbidden. What is genuinely open is that
the reviewer prompt still tells every specialist its working directory is
"verified to be at" the head, which stays true of `HEAD` but no longer of the
working tree. **Deciding what a reviewer is told about a checkout safeguards
touched is `V2b`'s question, not a patch to `V2a`**, because it is the same
question as whether safeguard output reaches a reviewer at all; it is recorded
under the next increment below.

**Two more defects were real, were confirmed by reading and running the code,
and are fixed on this branch.** Neither was reported to the user by the tool.

- *Letter case walked past the whole denylist.* `commandRefusal` folded no case
  before its name lookups, so `Curl https://example.test/x` was neither the
  lowercase entry the table names nor an all-caps placeholder, and it passed
  every rule. `spawn("Curl")` then resolves to `curl` on a case-insensitive
  filesystem, which is the macOS default; that was confirmed on this machine,
  where it printed `curl 8.7.1`. It defeated the network exclusion the README
  promises in this same increment. Fixed in `b6fa802`, which folds case for the
  program, word and watch lookups and deliberately leaves flags exact, because
  `-w` and `-W` are two different flags and the table already carries both.
  **Security reported this, the adjudicator accepted it, and the acceptance was
  then thrown away**: `security:1: invalid adjudication: Citation does not
  exactly match a supplied context window`. The adjudicator's own citations
  failed the boundary, so a correct acceptance of a real defect produced no
  finding. This is the first recorded case of an adjudication being invalidated
  rather than a candidate.
- *The artifact scan outlived the run that started it.* `checkoutArtifacts`
  called `git` with an empty options object, so `runGit` received no signal and
  the post-execution `git status --porcelain` could not be cancelled. Fixed in
  `9c6182c`. Performance-resources and correctness reported this independently;
  neither reached the user.

**A third real defect was reported three times and surfaced zero times.** The
citation gate accepts a prefix followed by whitespace, so `npm test` passes as
cited from a file that declares `npm test --fix`, and
`node scripts/deploy.mjs` can be carved out of
`node scripts/deploy.mjs --dry-run`. Both were confirmed against the shipped
code. Correctness, contracts and overview each reported it; correctness's whole
output was discarded on a JSON syntax error, and contracts' and overview's
candidates were rejected at the evidence boundary for inexact citations. **It is
not fixed here**, because tightening the boundary also refuses prose that
declares a command mid-sentence, which is a trade-off for the user to settle
rather than a typo to patch. It is the first choice of the next increment.

**Two candidates were rejected on the merits, and both rejections are correct.**
Performance-resources argued that retaining each command's bounded output could
exhaust the host; the adjudicator answered that the 8 MiB per-stream bound is
deliberate and the run-level budget it proposed was never a contract. Overview
argued that the `V1` row still saying "Execution is `V2`" conflicts with the
`V2a`/`V2b` split; the adjudicator answered that the aggregate statement stays
true and the next-increment section is unambiguous. Both stand.

**Four candidates never reached adjudication**, three of them for inexact
citations (`contracts:2`, `performance-resources:2`, `overview:1`) and one for a
malformed candidate shape (`overview:2`, which supplied a key the schema does not
allow). `Q6`'s clipped-end repair fired once more, on `security:1`'s `breaks`
citation, restoring a truncated `README.md` quote.

#### What this run says about the tool itself

**This is the sharpest recorded measurement of what the exact-citation gate
costs.** Of three real defects in the increment, the gate let one through, threw
away a correct adjudication of the second, and rejected the third from all three
reviewers that found it. Every rejection was mechanically justified: the
citations really did not match. The gate is still the right design, because the
alternative is publishing claims nobody checked, and this review published
nothing. But "no accepted findings is not proof of a clean PR" is no longer a
disclaimer in this repository; it is a measured result. The rejected-candidate
text stays on screen for the person running the review, which is how all three
were recovered here, and that is the property to protect.

**Coverage was `incomplete` for a reason `C5` already describes.** Correctness
returned unusable output, `SyntaxError: Expected ',' or ']' after array element
in JSON at position 6519`, which makes it an eligible failed attempt with no
fallback configured on the heavy tier to take. That is the second live
observation of the `C5` path, after #18's adjudicator, and a live review with a
fallback configured remains the open question it was.

**Overview's coverage gap was accurate when written and is now closed.** It said
the installed-plugin review had not run, so the real elicitation and execution
behaviour could not be assessed from the controlled checkout. This run is that
assessment for elicitation. Execution stays unassessed live, because nothing was
approved.

#### Validation after the two fixes

All thirteen controlled suites pass at `9c6182c`, and `git diff --check` is
clean. `scripts/smoke-safeguards.mjs` gained four case-folded exclusion cases, an
assertion that the refusal names the rule rather than the spelling, an assertion
that short flags stay case-significant, and an assertion that the artifact scan
carries the run's cancellation signal.

**No second review was run.** The standing workflow authorizes exactly one review
per increment pull request, and it is spent. Both fixes are small, both are
covered by the suites, and neither is demonstrated by the installed plugin.

## Completed increment: V2b

**`V2b` is settled without code.** Its three open questions were put to the user
one at a time, as `V1a`, `V1b`, `V1c` and `V2a`'s were, and all three were
answered "no change". `V2` closes here. No file under `extensions/` or
`scripts/` was touched by this increment, so the shipped behaviour is exactly
`V2a`'s and the thirteen controlled suites are unchanged.

The user's reason for closing rather than building is recorded plainly, because
a later reader will otherwise assume the questions were never asked: the port
had grown far past the effort its goal justified, every must-have and every
costly-to-lose item in `SCOPE.md` was already complete, and the remaining
appetite belongs to `L1` and `D1` rather than to a fourth safeguard slice. That
is a judgement about scope, not a discovery that the questions were empty. Each
answer below is also defensible on its own merits, and the merits are what the
entry records.

### The three decisions

| Question | Settled as | Why |
|---|---|---|
| Whether the citation gate may accept a prefix | **No change. It still accepts one.** The behaviour is now documented as a limitation instead of being tightened. | Tightening it means demanding the match reach the end of its line, and that refuses the ordinary way a project declares a command, in prose: "run `npm test` before committing". The residual risk is real but narrow and bounded by the rules on either side of it, which the next table sets out. `V2a`'s answer to the same class of question applies here too: a project whose declaration is refused writes a plain line, and this tool does not loosen a rule to accommodate prose it cannot parse. |
| Whether safeguard output reaches a reviewer | **No. It never does, and this is now a decision rather than a deferral.** A failed safeguard therefore stays outside review coverage permanently, as `V2a` left it. | Safeguard output is pull-request controlled text produced by pull-request controlled code. Handing it to a reviewer opens a prompt-injection surface that has nothing to do with running a process, and it would let a failing suite make the review's own findings look less trustworthy when the two are unrelated. `SCOPE.md` asks the flag to ground claims in evidence; it grounds them for the person who approved the command, which is who decides what to do about a red suite. |
| What the retained record says about what ran | **Nothing. The record is unchanged and gains no schema version.** `discovery`, `approval` and `safeguards` stay out of `outcomeKeys`, as they have since `V1b`. | The record exists to let a later publish act on a settled result without rerunning reviewers. Nothing about what a safeguard did changes what may be published, so an execution record would be inert data on a durable artifact, and inert data on a durable artifact is what a later increment misreads. The argument is weaker here than for a stored approval, which is why it was asked rather than inherited, but it is the same argument and it still holds. |

### What #19's one validated finding turns out to mean

Contracts, P1 on #19 observed that the revision and cleanliness gate runs before
safeguards, so a reviewer can read a file an approved safeguard changed while
the reviewer prompt still says its working directory is "verified to be at" the
reviewed head. Re-asserting cleanliness afterwards was refused in `V2a` and stays
refused: `SCOPE.md` says these commands may create artifacts and forbids
cleaning the checkout, so a re-assertion would refuse a review because the
person's own approved tests wrote a coverage file.

**What was not established at the time is that the inaccuracy cannot produce a
finding.** `boundCitation` in `findings.mjs` resolves every citation against
`context.files`, requires the source's `ref` and `blobSha` to equal the bound
head or base fetched from GitHub, and then replaces the model's quote with the
lines of that bound content. A file a safeguard wrote or changed in the working
tree has no bound source, so a citation naming it is refused as outside bound
provenance, and a candidate without an accepted citation never becomes a
finding.

So the prompt sentence is inaccurate about the working tree and accurate about
`HEAD`, and the inaccuracy is contained by a check that was already there for
another reason. It is recorded as a wording defect, not a path. Fixing the
wording is a behaviour change under `AGENTS.md` and would cost this increment a
review it does not otherwise need, so it is left for `D1`, which revisits the
user-facing text anyway.

### The prefix limitation, stated exactly

`citationRefusal` in `safeguards.mjs` searches the cited file for the command
text, requires the character before the match to be outside `safeCharacter`, and
accepts the match when the character after it is outside `safeCharacter` too, or
is a full stop, comma or colon that ends a word. Whitespace is outside
`safeCharacter`. A prefix ending at a space therefore passes.

| Consequence | Bounded by |
|---|---|
| `npm test` is accepted as cited from a file that declares `npm test --fix`. | The offer shows the person the exact command that would run, not the line it was cited from. Approval is per command. |
| A command whose safety lives in a trailing argument can be offered without that argument. | `commandRefusal` runs first and refuses by program, word and flag, so the dangerous shapes the denylist names are refused whatever their arguments. The `--fix` case above is refused outright as an auto-fix. |
| A longer declared command can be truncated at any whitespace boundary. | No shell, so a truncated line is still one program with an argument list, and it is still asserted against `commandRefusal` again in the moment before the spawn. |

What a prefix cannot do is invent a command out of nothing, which is the check's
actual purpose and the thing #19 demonstrated live: the pass put `node` in front
of a filename that `HANDOFF.md` mentions only in prose, and the gate refused it.
Token bounding still stops `npm run test` being carved out of `npm run
test:unit`, because `:` is inside `safeCharacter`.

### What this increment changed

Documentation only. `README.md`'s safeguard section now states the settled
answers where it previously said the questions were open, and states the prefix
limitation where it previously implied the check was exact. The increments table
above records `V2b` as complete.

### Validation

All thirteen controlled suites pass and `git diff --check` is clean. They are
unchanged, because no behaviour is. `scripts/smoke-reviewer-tools.mjs` was not
run and did not need to be: `read-only.mjs` is untouched.

**No installed-plugin review was run for this increment by default.** `AGENTS.md`
makes the review the user's call for a documentation-only pull request, because
it costs real credits. Whether one ran is recorded in the pull-request entry
below.

**The live evidence gaps `V2a` recorded stay open.** Execution has never run
under the installed plugin: an `accept` carrying a non-empty selection, a real
spawn, a real capture, a real artifact line and a real cancellation are
demonstrated only by the controlled suites, and no exclusion rule has ever
refused a real discovered command. Settling `V2b` without code means there is no
review here to fold them into. They close in `D1`, whose own review is already
required and can run with `--verify`; the next-increment section below says
exactly how. Until then, do not mistake the suites for delivery evidence.

## Exact next increment

**`V2` is closed. `V2a` shipped execution and `V2b` settled its three remaining
questions without code.** Their answers are recorded in the two completed
entries above and are not to be reopened: no reviewer receives safeguard output,
the retained record says nothing about what ran, the citation gate still accepts
a prefix, the shell gate does not accept a command a project wrote as a chain,
and no timeout of any kind bounds a running safeguard.

**`V1a`, `V1b`, `V1c`, `Q7`, `C5`, `V2a` and `V2b` are complete and merged, from
pull requests #19, #18, #17, #16, #15 and #14 and this increment's own.** Their
authorizations are spent. Nothing about any of them should be redone or widened.

### Every must-have is complete, and the port is feature-complete for v1

`SCOPE.md`'s must-have column and its costly-to-lose column are both entirely
delivered. What is left of v1 is `A1`, `L1` and `D1`, and none of the three adds
a capability. When all three have landed, v1 is done, and the open items further
below are limitations to state in the release notes rather than work to
schedule.

**A later session should not invent an increment.** The user's direction, given
after #19 merged, is that the port had grown far past the effort its goal
justified, and that the remaining appetite belongs to finishing rather than to
building. Treat a new feature idea as out of scope unless the user asks for it.

### The next increment is `A1`, the roadmap archive, then `L1`, then `D1`

Three increments remain and this is their order. Take one, land it on its own
branch and pull request, and stop.

- **`A1`: archive the completed roadmap entries.** This file passed 445KB and is
  itself now a functional problem, because safeguard discovery skips it for
  size, so the tool cannot read its own project. Move the completed entries into
  a dated archive file and leave a short live roadmap behind. **It must not move
  the increments table, this `Exact next increment` section, or the most recent
  completed entries out of this file**, and it must leave a pointer to the
  archive where the moved entries were. Mechanical and documentation-only, so no
  review is required; ask before spending one. It goes first because `D1` has to
  read this file and rewrite `README.md`, and both are easier once this is done.
- **`L1`: resolve upstream licensing and attribution.** `SCOPE.md` records that
  `pi-pr-review` declares MIT but that no standalone licence text was found at
  the inspected revision. No upstream source has been reused and none should be
  until this is settled. The outcome is a recorded answer and, if attribution is
  owed, the text that discharges it. It needs no review and spends no credits.
- **`D1`: the user documentation.** `README.md` is already long and already
  large enough that safeguard discovery skips it for size, which is the tool
  failing to read its own project. `D1` should shorten it as much as it extends
  it. It also carries one recorded wording defect: the reviewer prompt in
  `review.mjs` tells every specialist its working directory is "verified to be
  at" the reviewed head, which stays true of `HEAD` after a safeguard runs but
  not of the working tree. Bound citations already contain the consequence, as
  the `V2b` entry sets out; the sentence is still wrong and `D1` is where it is
  cheapest to fix, because that pull request touches user-facing text anyway.
  **That fix is a change under `extensions/`, so `D1`'s pull request needs an
  installed-plugin review whatever else it contains. Run that review with
  `--verify` and approve `node scripts/smoke-safeguards.mjs` when the approval
  UI asks.** It is the last chance to give safeguard execution live evidence
  without spending a review on nothing else, and the reason is set out under
  "The live evidence `V2` did not produce" below.


### The live evidence `V2` did not produce, now accepted for v1

**Execution has never run under the installed plugin.** #19's review reached the
host's approval UI and approved nothing, so `accept` with a non-empty selection,
a real spawn, a real capture, a real artifact line and a real cancellation are
all still demonstrated only by the controlled suites. **The exclusion table
recorded no live refusal either**, because the discovery pass reported only three
candidates and the one refusal came from the citation check.

Closing either gap costs a review, and `V2b` was settled without code and so
without a review to fold them into. **`D1` is where they should close, at no
extra cost.** `D1` fixes the reviewer prompt's "verified to be at" wording, and
that is a change under `extensions/`, so `AGENTS.md` already requires `D1`'s
pull request to be reviewed by the installed plugin. Run that one review with
`--verify` and approve `node scripts/smoke-safeguards.mjs` when the approval UI
asks: the suite finishes in well under a second and leaves the checkout clean,
so the artifact line should say the checkout is unchanged. That single run gives
execution its first live evidence, an `accept` carrying a non-empty selection, a
real spawn, a real capture and a real artifact line, without spending a review
on it. A live exclusion refusal still cannot be arranged, because what a
discovery pass reports is not ours to arrange.

Until `D1` runs, both remain demonstrated only by the controlled suites, and no
entry above may be read as though the installed plugin had executed anything.

### Recorded, not scheduled

These stay open and none is scheduled. Do not start one instead of `L1` or `D1`
without the user saying so.

- **A review against a substantial code diff**, the oldest and largest open
  observation. No review of any mode has run against one; #10 is the closest at
  984 additions over 12 files, and #14 is 666 over seven. It is separately
  authorizable and nobody has spent a review on it deliberately.
- **A live review in which a reviewer is refused an absent path**, the only way
  to learn whether `Q7`'s reason changes what a reviewer does next. It cannot be
  arranged deliberately without inducing the request, so it is a matter of
  watching later reviews rather than an increment to schedule.
- **A live review with a fallback configured**, the only way to close the gap
  #14's reviewers named about `C3` and `C5`. That is a deliberate credit
  decision, because a discarded output would then spend a second attempt. #18's
  adjudicator produced exactly the eligible failure and had no fallback to take,
  which is what a configured one would have answered.
- **A live approval that approves something.** #19 closed half of this: two
  discovered commands were offered, the host's elicitation UI accepted the
  schema and returned a documented action, and the answer approved nothing. An
  accepted subset, a cancel, and every part of execution downstream of them are
  still demonstrated only against the controlled harness. `D1`'s own required
  review closes this at no extra cost; see "The live evidence `V2` did not
  produce" above.
- **A live refusal from the exclusion table.** #19's discovery pass reported only
  three candidates and refused one of them by citation, so no exclusion rule has
  ever refused a real discovered command. No later review can close this
  deliberately, because what a discovery pass reports is not ours to arrange.
- `L1` remains pending; copy no upstream source.

`F6`'s marker contract has live evidence from five of six reviewers on #7, both
sessions on #8, every session on #10, on #11 every session that produced an
envelope at all, including the medium tier's `claude-sonnet-5` writing paragraphs
of prose before the markers, every session on #12, every completed reviewer on
#13, and all five reviewers on #14. #11's one unparsed output contained no
envelope, wrapped or otherwise, so it is not evidence against the unwrap. Do not
reintroduce substring matching and do not widen it. `C5` changed nothing about
the unwrap; it changed only what an attempt whose output fails it is called.

Do not revisit the Agent Factories surface without new information from GitHub.
Three separate blockers were demonstrated on CLI 1.0.83, and all three would
have to change: the feature flag, the extension-only factory registration, and
the confined tool grant that leaks `skill` and `sql`. A new CLI version is new
information; a new reading of the same documentation is not.

Do not add a timeout, a deadline or a "stuck reviewer" heuristic to make
fallbacks fire more often. `SCOPE.md` forbids review timeouts, and both `C3` and
`C5` depend on their absence: elapsed time is never a fallback trigger, and `C5`
sits beside the reviewer precisely because a hung reviewer never settles.

Land every increment on its own branch and pull request, review that pull
request with this plugin before asking for a merge, and record the outcome here;
`main` refuses direct pushes and merging stays the user's call. Playground pull
requests #1 and #2 must never be merged or republished.
