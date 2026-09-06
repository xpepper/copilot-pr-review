# Next-session handoff prompt

Continue this project from its recorded repository state.

Read `AGENTS.md` first, `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for completed work, evidence, runtime caveats, and the exact
next increment. Inspect git status and the implementation before editing.
Do not rely on previous conversations or reopen settled product decisions.

## Recorded state

Implementation checkpoint: `103d215`
(`feat: add minimal Copilot PR review plugin entry point`).
The session-ending documentation commit containing this handoff adds the
file-based handoff workflow; inspect git log for its hash. No unrelated or
unfinished implementation changes were present when this handoff was written.

F1 is complete: a locally installable Copilot CLI plugin with a code-owned
`/pr-review` status/help entry point and explicit unsupported-argument errors.
It does not perform reviews. Runtime evidence and reproduction commands are
recorded in `ROADMAP.md` and `README.md`.

## Implement F2 only

- Add a tiny original local fixture.
- Run two reviewers concurrently from the plugin.
- Use distinct explicitly configured Copilot-subscription models and reasoning
  levels, validated against actual available capabilities.
- Display effective assignments before execution, per-reviewer progress,
  and results.
- Demonstrate execution overlap and actual model/reasoning selection; do not
  treat SDK declarations as proof.

Consult the installed CLI SDK and current official documentation before
choosing APIs. Agent factories are a candidate, not a settled integration.

Preserve `SCOPE.md`: no plugin-imposed review timeouts, silent substitutions,
external-provider credentials, speculative cross-platform abstraction,
PR fetching, GitHub publication, or project safeguard execution in this
prototype. Licensing assessment remains pending before upstream source reuse;
original implementation need not wait.

## Important runtime caveats

- Use an absolute path for local installation, and reinstall after edits.
- Start a fresh CLI session after installing the plugin.
- Do not use `copilot -p '/pr-review ...'` as command dispatch: the observed
  CLI treated it as a model prompt.
- Follow the SDK discovery requirements documented in `ROADMAP.md`.

Full read-only enforcement, failure supervision, and cancellation evidence
belong to F3. Do not claim them from F2's happy path. If blocked, record the
concrete limitation without weakening requirements.

## Commit and hand off

Follow `AGENTS.md`: exercise the changed behavior, update `ROADMAP.md` with
evidence, reproduction commands, uncertainties, and the exact next increment;
commit coherent meaningful progress while preserving unrelated changes.
Do not push.

After finishing all implementation, validation, and other documentation updates,
write the next fresh-session prompt into `HANDOFF.md` as your final repository
file edit before the session-ending commit. You may completely replace this
file; it is not an append-only log. Include the updated handoff in that commit,
then report the commit outcome and point to `HANDOFF.md` in your final response
instead of repeating the prompt. Carry these workflow rules forward for the
next agent.
