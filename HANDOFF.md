# Next-session handoff prompt

Continue this project from its recorded repository state.

Read `AGENTS.md`, then `SCOPE.md` as the authoritative product specification,
and `ROADMAP.md` for progress, runtime evidence, caveats, and the exact next
increment. Inspect git status, recent commits, and implementation before editing.
Do not depend on earlier conversations or reopen settled product decisions.

## Recorded state

The preceding checkpoint is `6446c44` (file-based handoff workflow), following
F1 implementation `103d215`. The session-ending commit containing this handoff
implements F2; inspect git log for its hash. No unrelated or unfinished changes
were present when this handoff was written. All F2 implementation, documentation,
and this handoff are intended to be included in that commit.

F2 is complete: `/pr-review models` lists current subscription capabilities;
`/pr-review fixture model1=ID effort1=LEVEL model2=ID effort2=LEVEL` runs two
reviewers of a tiny bundled original fixture. There are no default assignments.
Both models and reasoning efforts must be explicitly supplied and distinct.
The plugin validates catalogs and effective settings, displays assignments and
progress, checks actual usage, and labels all output unvalidated.

Real installed-plugin runs demonstrated `claude-sonnet-5` / `low` and
`gpt-5.6-terra` / `high`, both with `isByok=false`, independent reviewer session
IDs, and 2164 ms and 1912 ms execution overlap. These are reproduction inputs,
not future defaults. Commands and event evidence are in `ROADMAP.md`.

## Implement F3 only

Use the plugin-owned SDK-session candidate to:

- Add an original adversarial fixture and demonstrate that reviewers cannot
  perform forbidden writes/commands/delegation. Distinguish denied capabilities
  from a model merely choosing not to call tools.
- Inject explicit reviewer failures; keep failure and incomplete coverage
  visible, with useful successful outputs retained and no clean-review claim.
- Add and demonstrate manual cancellation while both reviewers are active.
  Confirm owned sessions/runtime stop without abandoned work. Cover extension
  shutdown and relevant disconnect/error paths as well as normal completion.
- Record reproducible evidence or concrete limitations before selecting the
  integration. No review timeouts or elapsed-time fallbacks.

Do not add PR fetching, publication, personal/project configuration persistence,
or safeguard execution. Respect all `SCOPE.md` constraints. Licensing L1 remains
pending before upstream source reuse; original fixtures/code need not wait.

## Runtime details to preserve

- On CLI 1.0.83, factories failed with "Agent factories are not available for
  this session" before execution. No feature/entitlement gate was bypassed.
  SDK factory declarations are not proof of usability or reasoning support.
- The extension instead constructs `CopilotClient` from the injected SDK;
  default bundled-runtime resolution worked without hardcoded executable paths.
  It creates two independent sessions in that owned runtime, not parent
  factory/task subagents. It uses local CLI auth, not external-provider keys.
- Reviewer sessions set `enableConfigDiscovery: false`, `availableTools: []`,
  and deny permission requests. The benign fixture used no tools, but F3
  adversarial enforcement is still unproven.
- Session `model.list()` returns raw CAPI reasoning arrays at
  `capabilities.supports.reasoning_effort`, not the normalized
  `client.listModels()` projection. Usage must match explicit settings.
- `sendAndWait` has a default timeout. The implementation subscribes to events
  before `send` and awaits idle/error without timers.
- Normal `client.stop()` in `finally` succeeded. There is no cancel command yet;
  extension shutdown, transport loss, and active cancellation cleanup are
  unproven. Do not equate stopping an extension with stopping its child runtime.
- SDK transcripts may persist normally. The `F2 evidence:` timeline JSON is
  prototype evidence, not the future P2 review cache or a cross-session archive.
- Install with an absolute path and reinstall after edits; start a fresh CLI.
  Do not use `copilot -p '/pr-review ...'` as command dispatch. Follow
  `README.md` for the runtime probes and trusted configuration discovery.
- `node scripts/smoke-fixture.mjs` runs pure guards. The runtime probe without
  `--fixture` exercises no-inference command paths; adding `--fixture` and the
  four explicit environment settings spends subscription credits.

Consult the installed SDK and current official documentation before choosing
new runtime APIs. Preserve F1/F2 behavior while establishing F3.

## Commit and hand off

Follow `AGENTS.md`: validate meaningful progress, inspect the diff, update
`ROADMAP.md` with outcomes, reproduction commands, limitations, and the exact
next increment, and commit coherent checkpoints. Preserve unrelated changes.
Do not amend, rewrite history, or push.

After all implementation, validation, and other documentation updates, replace
`HANDOFF.md` with the next agent's ready-to-use prompt as the final repository
file edit before the session-ending commit. Include it in that commit. Carry
these commit/handoff rules forward, reference an existing checkpoint rather
than the hash of the commit being written, and note any remaining uncommitted
work honestly. Report the commit outcome and point to `HANDOFF.md` instead of
repeating the prompt.
