# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit and fresh-session handoff workflow is recorded
in [AGENTS.md](AGENTS.md).

## Increments

| ID | Status | Independently demonstrable outcome | Requirements / dependencies |
| --- | --- | --- | --- |
| S0 | Completed | Confirmed product specification recorded in `SCOPE.md`, commit `6407a59`. | [Goal](SCOPE.md#goal) |
| L1 | Pending | Resolve applicable upstream licensing and attribution; record what can be reused. No upstream source reuse until resolved. Original prototypes need not wait. | [Upstream baseline](SCOPE.md#upstream-baseline) |
| F1 | Completed | Locally installable plugin with a code-owned, usable status/help entry point; runtime evidence and reproduction below. | [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F2 | Pending | Two concurrent reviewers over a tiny original local fixture; distinct explicitly configured subscription models and reasoning levels; display assignments, per-reviewer progress, and results. | F1; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F3 | Pending | Adversarial fixture demonstrates read-only enforcement; explicit reviewer failures remain incomplete coverage; manual cancellation stops owned work with no abandoned agents. Record runtime limitations before selecting the integration. | F2; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| Q1 | Pending | Capture a PR number's repository, lifecycle, head, and diff without altering the checkout; demonstrate skip and override gates. | F3; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q2 | Pending | Bind reviewer evidence to the captured head, including surrounding code; reject mismatched local evidence. | Q1; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q3 | Pending | Run the three quick specialists, with `--major-only` alias and explicit incomplete coverage, in no-comment mode. | Q2; [Modes](SCOPE.md#review-modes-and-findings) |
| Q4 | Pending | Validate evidence, severity/location/confidence, and deduplicate candidates; demonstrate real `--quick --no-comment` findings. | Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
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

### Remaining uncertainties

Distinct per-reviewer subscription models/reasoning, simultaneous execution,
per-reviewer progress/results, read-only enforcement, reviewer failure
propagation, and cancellation remain unproven and are reserved for F2/F3.
The surrounding interactive Copilot session is not made read-only by this
extension. No cross-client or other-OS compatibility is claimed.
Future CLI/API compatibility, marketplace migration, and source licensing remain
open. L1 blocks upstream source copying, not this original code. No current
runtime blocker prevents starting F2; documented factory APIs alone remain
insufficient evidence for completing it.

### Exact next increment

**F2 only:** Add a tiny original local fixture and run two reviewers concurrently
from the plugin. Require distinct explicitly configured Copilot-subscription
models and reasoning levels, validate them against actual available capabilities
without substitution, show effective assignments before execution, and display
per-reviewer progress plus results. Record evidence of overlap and actual model/
reasoning selection, or a concrete runtime limitation. Do not impose review
timeouts. Do not add PR fetching, publication, or project safeguard execution.
Full adversarial permissions, failure, and cancellation demonstrations follow
in F3; do not claim them from F2's happy path.
