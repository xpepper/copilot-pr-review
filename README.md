# Copilot PR Review

An original, minimal Copilot CLI plugin prototype. **It does not review PRs yet.**
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
```

The command is implemented in JavaScript by a plugin-shipped extension, not a
model prompt. It reports its capability boundary directly to the CLI timeline.
It makes no model calls. Other arguments (including PR numbers and review flags)
produce an explicit error; they never start a review.

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

Parallel reviewers, model/reasoning configuration, enforceable read-only review,
failure supervision, and cancellation are still unproven. The entry point does
not fetch PRs, publish to GitHub, or execute project safeguards. It does not
establish restrictions on the surrounding Copilot session.

No upstream source has been copied. Source reuse/licensing assessment remains
pending before any upstream code is reused.

## Reproduce the runtime smoke exercise

After installing the current checkout, run the no-model probe using Node.js and
the SDK bundled with the installed CLI (adjust the SDK path for your install):

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$HOME/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk" \
node scripts/smoke-runtime.mjs
```

The probe starts an owned CLI runtime, discovers the **installed** extension,
dispatches status/help and unsupported arguments, checks timeline output and
explicit command errors, and checks that no model turns, agents, or tool
executions occurred. It stops the runtime in `finally`, including on failure.
It never sends a model prompt. It uses configuration discovery to find installed
plugins, so run it only with your trusted installed configuration. This is an F1
entry-point exercise, not proof of reviewer permissions or cancellation.
