# Repository agent workflow

## Start from recorded state

- Read [SCOPE.md](SCOPE.md) as the authoritative product specification, then
  [ROADMAP.md](ROADMAP.md) for evidence, runtime caveats, and the exact next
  increment. Inspect the working tree and implementation before editing.
- Do not depend on previous conversations or reopen settled product decisions.
  Implement only the next small increment identified by the roadmap unless the
  user explicitly changes the task.
- Consult the installed CLI SDK and current official documentation before
  choosing runtime APIs. Demonstrate capabilities rather than inferring them
  from API declarations or plugin-format support.

## Commit meaningful progress

- The user authorizes local commits at each relevant progress checkpoint:
  a coherent, validated implementation increment or a substantive documentation
  or investigation outcome. Do not wait until the end of a long session, and
  do not create a commit for every minor edit.
- Before committing, inspect the diff, perform applicable targeted validation,
  and update the roadmap with evidence and remaining limitations. Record blocked
  work honestly; a checkpoint commit does not make an increment complete.
- Stage only files belonging to the checkpoint. Preserve unrelated changes.
  Do not amend, rewrite history, or push unless explicitly requested.
- A newer explicit instruction not to commit overrides this standing workflow.

## End with a fresh-session handoff

- Before ending each project work session, update `ROADMAP.md` with the outcome,
  reproduction commands, remaining uncertainties or blockers, and the exact
  next small increment. Keep product requirements in `SCOPE.md`, not duplicated
  in handoff notes.
- End the final response with a copyable **Handoff prompt** for the next agent.
  Include instructions to read `AGENTS.md`, `SCOPE.md`, and `ROADMAP.md`; inspect
  git state; implement only the next increment; respect the scope constraints;
  and distinguish demonstrated behavior from assumptions.
- Include the current checkpoint/commit, any uncommitted work, the next
  increment's concrete acceptance criteria, and important runtime caveats.
  Tell the next agent to follow these commit and handoff rules in turn.
  Never rely on the next agent having access to this conversation.
