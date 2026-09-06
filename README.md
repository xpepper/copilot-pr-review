# Copilot PR Review

An original Copilot CLI plugin prototype. **It does not review PRs yet.**
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
anything. Other review flags (including `--quick` and `--no-comment`) remain
unsupported until their increments; this command is capture-only.

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
a GitHub transactional snapshot guarantee; immutable surrounding-source
evidence is the next increment. `gh` must already be authenticated. The CLI
filters sensitive extension environment variables; local stored `gh`
authentication was demonstrated, not token-only environment forwarding.

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
can capture PRs but does not review them, publish to GitHub, or execute project
safeguards. It does not restrict or change the model of the surrounding Copilot session. The SDK may
retain its own session transcripts; no plugin review archive is implemented.

No upstream source has been copied. Source reuse/licensing assessment remains
pending before any upstream code is reused.

## Reproduce the runtime smoke exercise

After installing the current checkout, run the no-inference probes using
Node.js 22+ and the SDK bundled with the installed CLI (adjust its path):

```sh
node scripts/smoke-fixture.mjs
node scripts/smoke-target.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs
```

The pure probes exercise fixture guards/lifecycle and PR capture/gates without
a runtime. The runtime probe discovers the **installed** extension, dispatches status/help,
model listing, and invalid settings, and asserts explicit errors without model
turns. It requires authenticated model-list access. It uses configuration
discovery to find plugins, so run it only with trusted installed configuration.
It stops its runtime in `finally`, including on failure.

To exercise Q1 through the installed plugin, use the same CLI/SDK settings with
`node scripts/smoke-runtime.mjs --targets`. This runs controlled `gh` responses
in a child-only PATH, native confirmation acceptance/decline, lifecycle/skip
gates, explicit failures, and a session-directory change after extension startup.
The harness asserts read-only requests, no model turns, and no source changes.
The `scripts/fixtures/gh` executable is a test double, not a shipped runtime
dependency; do not add its directory to your normal PATH.

Use `node scripts/smoke-runtime.mjs --target-live` separately for real `gh`
requests through the installed plugin. It creates an empty temporary Git
repository pointing to `github/copilot-sdk`, captures public merged PR #2543
with a pinned expected head/diff fingerprint, checks the bot skip on #2545,
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
