# Repository agent workflow

## Start from recorded state

- Read [SCOPE.md](SCOPE.md) as the authoritative product specification, then
  [ROADMAP.md](ROADMAP.md) for evidence, runtime caveats, and the exact next
  increment. Read [HANDOFF.md](HANDOFF.md) for the latest next-session prompt.
  Inspect the working tree and implementation before editing; if the handoff
  is stale, reconcile it against git state and the authoritative scope/roadmap.
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
- Write the next agent's ready-to-use prompt into `HANDOFF.md` as the final
  repository file edit before the session-ending commit. Complete implementation,
  validation, and other documentation updates first; if further edits become
  necessary, refresh `HANDOFF.md` again last. Include it in that commit before
  declaring the session ended.
- `HANDOFF.md` is a replaceable handoff, not an append-only history. Each agent
  may completely overwrite it for the next fresh session; git preserves history.
- Include instructions to read `AGENTS.md`, `SCOPE.md`, and `ROADMAP.md`; inspect
  git state; implement only the next increment; respect the scope constraints;
  and distinguish demonstrated behavior from assumptions. Include the existing
  checkpoint reference, any remaining uncommitted work, concrete next-increment
  acceptance criteria, and important runtime caveats. Do not try to embed the
  hash of the commit that will contain the handoff itself.
- Tell the next agent to follow these commit and file-based handoff rules in
  turn. Never rely on access to this conversation. The final response should
  report the commit outcome and point to `HANDOFF.md`, not duplicate the prompt.
- If committing is blocked or explicitly prohibited, still write `HANDOFF.md`
  last and report that it remains uncommitted; do not claim a committed handoff.
