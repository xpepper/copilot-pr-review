# Repository agent workflow

## Start from recorded state

- Read [SCOPE.md](SCOPE.md) as the authoritative product specification, then
  [ROADMAP.md](ROADMAP.md) for evidence, runtime caveats, and the exact next
  increment. Read [HANDOFF.md](HANDOFF.md) for the latest next-session prompt.
  Every increment lands on a pull request reviewed with this plugin; see
  "Land every increment on a reviewed pull request" below before you start.
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
  Do not amend or rewrite published history.
- A newer explicit instruction not to commit overrides this standing workflow.

### Validate before each checkpoint

Run this repository's controlled suites before a checkpoint commit. They use test
doubles, need no network and no inference, and each finishes in well under a
second. These two cover the safeguard path end to end:

    node scripts/smoke-safeguards.mjs
    node scripts/smoke-review.mjs

`HANDOFF.md` lists the full set and the loop that runs every one of them. Run the
whole set before opening a pull request.

GitHub Actions runs the same set on every pull request and on every push to
`main`, in `.github/workflows/ci.yml`, along with two invariants this repository
has broken before: that this tool can still read its own instruction files, and
that no tracked text carries a control byte. **CI is not a substitute for running
them locally before a checkpoint commit**, and a red run is a real failure to fix
rather than a flake to rerun. It deliberately runs nothing that spends Copilot
credits: the plugin review of the pull request stays the user's explicit
decision.

## Land every increment on a reviewed pull request

Every increment lands through a pull request that this plugin reviews. The
project is its own first user: dogfooding the tool on real changes is part of
the work, not an extra.

- Work on a branch named for the increment, never on `main`. A repository
  ruleset requires a pull request on `main` and grants no bypass, so a direct
  push is refused for everyone, including admins and agents using their token.
- Commit validated checkpoints on that branch under the rules above, then push
  the branch and open the pull request with `gh pr create`. Say what changed,
  what was verified and how, what was not verified, and what remains.
- Review that pull request with this plugin before asking for a merge. The
  reviewer reads the local checkout, so it must be exactly the PR head with a
  clean tree: push first, then run `/pr-review NUMBER --no-comment` from that
  branch. Balanced is the default mode; name a mode explicitly when you want a
  different one.
- If your agent cannot type a Copilot CLI slash command, dispatch the same
  command through the SDK with `node scripts/dogfood-review.mjs NUMBER --all
  --no-comment --unattended`, using the `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`
  settings the other runtime probes use. That session has no elicitation UI, so
  the runner requires `--unattended` and the flags that settle selection and
  publication without anybody. `copilot -p "/pr-review NUMBER"` is not a
  substitute: prompt mode starts an ambient model turn instead of dispatching
  the command, as the F1 integration caveats in `ROADMAP.md` record.

### That review is the increment's real integration test

The controlled suites run the code with test doubles: fake `gh` responses, a
synthetic checkout, scripted reviewer output. They prove logic, not delivery.
The pull-request review runs the **installed plugin** end to end: the real
Copilot runtime, real models, real `gh` requests against a real pull request,
the real revision gate against a real checkout, real confined read tools, and a
real charge. Nothing else in this repository demonstrates that the thing we ship
actually works.

- Treat it as the increment's verification of record. An increment that changes
  behaviour, meaning anything under `extensions/` or `scripts/`, is not
  demonstrated until the installed plugin has reviewed its own pull request at
  least once, and the roadmap entry says so with evidence.
- A documentation-only pull request still needs the pull request, but its review
  is the user's call rather than a requirement, because reviewing costs real
  credits. Ask; do not spend by default.
- Record what only a real run can tell you: which model and effort each reviewer
  actually used, reviewer coverage, tool calls and denials, findings, withheld
  findings, coverage gaps, and the credit cost the runtime reported.
- Expect it to find things. On pull request #3 the reviewers caught a stale
  documentation command left by a rename, which every controlled suite had
  passed over. That is the point of ending an increment this way.
- A failure or refusal here is a real defect report about the shipped tool, and
  outranks a green controlled suite. Record it; never weaken a gate to make the
  run succeed.
- **This standing workflow authorizes exactly one review per increment pull
  request, and nothing else.** Any further review, any rerun, and any live
  probe that spends Copilot credits still needs a fresh explicit instruction.
- Keep findings local by default. Do not use `--comment`, `/pr-review publish`
  or any other GitHub write without a new explicit instruction; posting to this
  public repository is the user's call.
- Record the review in `ROADMAP.md` with the increment's evidence: mode, model
  and effort actually used, reviewer coverage, findings and withheld findings,
  and the reported credit cost when the runtime reports one. State plainly what
  you changed in response and which findings you rejected, with the reason.
  Zero findings is never a clean-review claim.
- Fix real findings on the same branch as new validated commits, then rerun the
  affected validation. Do not amend published commits or force-push.
- Merging is the user's decision unless they say otherwise. The plugin only ever
  emits `COMMENT` reviews, so its review can never satisfy an approval
  requirement; the ruleset therefore requires zero approving reviews.
- If the tool refuses to review its own pull request, record the refusal and its
  cause as evidence. That is a real defect report about the tool, not an
  obstacle to work around by weakening a gate.

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
- Tell the next agent to follow these commit, pull-request and file-based
  handoff rules in turn. Never rely on access to this conversation. The final
  response should report the commit and pull-request outcome and point to
  `HANDOFF.md`, not duplicate the prompt.
- The handoff commit belongs to the increment's branch and pull request like any
  other. Push it, so the next agent reads the handoff from the pull request the
  work actually lives on.
- If committing is blocked or explicitly prohibited, still write `HANDOFF.md`
  last and report that it remains uncommitted; do not claim a committed handoff.
