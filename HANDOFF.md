# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state, open pull
requests and implementation before editing. Scope is authoritative; the roadmap
records demonstrated evidence and the open work. Do not rely on this
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed, in your own reporting as well as in the code.

## Recorded state

This handoff is prepared for a fresh session on **clean `main` after the
user-authorized merge of pull request #17**, which carried `V1b` from branch
`v1b-safeguard-discovery`, branched from `main` at `d88df68`. Confirm the merge,
branch and working-tree state before proceeding; if #17 is still open, report the
unfinished merge rather than starting another increment. A squash merge need not
retain the individual commits as ancestors of `main`; use #17 and git history to
reconcile state. The only other open pull requests should be the synthetic
playground ones, #1 and #2, which must never be merged or republished. No
uncommitted work or increment in flight is intended to remain.

**Start `V1c` by discussing its boundary with the user, not by writing code.**
That is the whole of the next step; everything below is the context for it.

## What `V1b` settled

**`--verify` now discovers and presents safeguard commands, and still executes
nothing.** A run that passes `V1a`'s preflight reads the markdown at the checkout
root, asks one bounded pass which safeguard commands those files declare, and
presents each command with the file it came from. No command is approved, none is
executed, and no reviewer receives one. `scripts/smoke-review.mjs` asserts that
no discovered command reaches a reviewer prompt and that an ordinary review
starts no discovery pass at all.

Five choices are settled and must be preserved. The source is the project's own
agent instructions and nothing else, with manifest entry points and best-effort
stack inference recorded as later slices in that order. Nothing is filtered out
of the presentation, because the install, auto-fix and watch exclusions are rules
about what may be approved. A presented command carries the file it came from,
not a quoted line. Files are read from the checkout the preflight already proved,
capped at 64KB each with a 256KB budget for the run, with every skipped candidate
named. An empty or failed pass is reported plainly and leaves review coverage
untouched.

**Prompt injection through instruction files is accepted for this release**, on
the user's explicit decision, because the tool runs on their own and their team's
pull requests. It is recorded in the roadmap as a decision. Revisit before the
tool reviews pull requests from outside a trusted team. The mitigation that was
proposed and dropped was diffing the instruction files against the base and
refusing commands from a file the branch modified.

**A `--verify` run now spends one extra model turn**, unless the checkout root
holds no markdown, in which case discovery costs nothing and says so.

**No retained-record schema changed and no version was bumped.** `retainedRecord`
picks a fixed outcome key list that excludes `discovery`, and
`scripts/smoke-review.mjs` asserts it stays out.

Discovery is not a reviewer. It holds no tool, is never given the checkout, takes
no configured fallback, and a pass that fails or cannot start is reported as
itself while the reviewers run on. **Its cancellation is re-thrown before
anything is recorded**, which is the shape #16's review taught: do not put a bare
`catch` around a signal-aware call.

## The gap this increment leaves, and what to do about it

**`V1b` has no installed-plugin evidence and was merged without any.** Its one
authorized review refused during PR capture, because a raw `ESC` byte in this
increment's own test fixture made the repository's diff something `gh` refuses to
print. The fixture was fixed to spell that byte as `\u001b`, `gh` reads the diff
normally again, and the user chose to merge rather than authorize a rerun. Both
the refusal and the decision are recorded in the roadmap.

Consequences you must carry:

- Nothing in `V1b` has run through the real dispatch, the real models or a real
  `gh` request. Every claim about it rests on the controlled suites.
- No live run has ever produced a discovery envelope, so the contract this
  increment defined is unproven against a real model.
- The extra model turn's real credit cost is unknown.
- **Treat your own increment's review as covering `V1b` too.** Read the discovery
  output in that timeline with the scepticism due to a path no live run has taken,
  and record what it shows in the roadmap.

**`--allow-escape-sequences` was deliberately not added to PR capture.** That
refusal is `gh` protecting a terminal from a hostile diff. Do not add the flag to
make a run succeed. The real limitation, that this tool cannot review a pull
request whose diff carries escape sequences, is recorded and unscheduled.

## Exact next step

**The next increment is `V1c`: command approval.** Read "The next increment is
`V1c`" under "Exact next increment" in the roadmap; it is authoritative and
fuller than this summary.

**It still needs the user's explicit go-ahead, and it must not begin with code.**
Present its choices **one at a time**, each with your recommendation, the reason,
and every alternative. Lead with which option is cheapest and which is cheapest
while still pointing the right way; that is how `V1b`'s boundary was settled and
what the user asked for. Do not present all the choices at once.

`V1c` is approval and still not execution: a run that has discovered commands
asks which of them may run, records that answer, and stops. Two things `V1b`
deliberately deferred land here. The exclusions for commands that install,
migrate, deploy, format in place, auto-fix or watch, where watching is the sharp
one because `SCOPE.md` forbids review timeouts and an approved watch command
would wait forever. And the citation check, since code currently proves a
command's file was read but not that the command appears in it.

Also settle whether approval is per command or all-or-nothing, whether it enters
the retained record and so touches a schema version that currently tracks
publication authority only, and whether anything about approval may come from
configuration, given that `V1a` kept `--verify` itself off the configuration keys.

**Do not pull execution into `V1c`.** Executing pull-request controlled code is
the largest safety boundary in this project and needs its own increment, its own
discussion, its own tests and its own review. A review against a substantial code
diff, a live review with a fallback configured, a live review in which a reviewer
is refused an absent path, and `L1` are all recorded as open in the roadmap and
none is scheduled.

## Validation and runtime caveats

The **thirteen** controlled suites (`node scripts/smoke-<name>.mjs`) are findings,
review, selection, retention, preview, publication, publish-later, checkout,
config, context, fixture, target and **safeguards**, the last added by `V1b`.
They require no inference or network. All thirteen pass at this handoff, as they
did at each checkpoint. `git diff --check` is clean.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
```

`scripts/smoke-safeguards.mjs` covers file collection against real temporary
directories and the envelope against malformed answers, including a command
citing a file that was never read. **Keep the source of every fixture plain
text**: a raw control byte in a test is what refused #17's review.

`scripts/smoke-checkout.mjs` drives the verification profile against real
throwaway git checkouts, including a detached `HEAD` that refuses verification
and **still passes an ordinary review of the same checkout**. It also asserts the
checkout is byte-identical after every refusal. Keep that assertion when
extending it.

Both no-inference runtime probes passed before `V1b`, against the plugin built
from `V1a`'s checkout. **They were not rerun for `V1b`.** They spend no credits
but need a live runtime connection, and `copilot plugin install "$(pwd)"` must be
rerun whenever the checkout changes, or the probe measures the previous build:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

`scripts/smoke-reviewer-tools.mjs`, the confinement probe outside the thirteen,
must be run and reported for any increment touching `read-only.mjs`. `V1b` does
not touch it, so it was not run and was not required.

**Never add a timeout, deadline or stuck-reviewer heuristic.** `SCOPE.md` forbids
review timeouts, and `C3`, `C5` and `V1c`'s watch-command exclusion all depend on
their absence. There is no timeout: a quiet timeline is not a hang.

**Do not revert to `fs.realpathSync` anywhere in `read-only.mjs`**, and do not
replace the `lstat` check in `absentInsideRoot` with a `stat` or a plain resolve:
both exist to stop the refusal from saying where a symlink points. The same
`lstat` reasoning is why `collectInstructionFiles` refuses a symbolic link rather
than following it.

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`. Consult the installed SDK and current official
documentation before adopting new APIs. Do not revisit Agent Factories without a
new CLI version. **Do not widen `F6`'s marker unwrap or reintroduce substring
matching**; `V1b` shares it as `unwrapEnvelope` from `findings.mjs` precisely so
the one rule stays in one place.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify the restore with `shasum -a 256`. That file was not
moved or edited in the `V1b` session.

Cold resume of command-only records remains unsupported. The adjudicator is
zero-tool; citations remain limited to captured diff/context windows.

## For a future authorized increment

Work on its own branch and pull request. Commit and push first; check out that
pull request head before installing, so the reviewer reads exactly the reviewed
revision from a clean tree.

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --balanced --all --no-comment
```

Choose the mode explicitly and justify it; balanced is the default when no other
topology is required. Capture the complete stdout timeline outside the checkout
and save original reviewer strings before analyzing. Do not modify the working
tree while reviewers read it. `copilot -p "/pr-review NUMBER"` starts an ambient
model turn and is not a substitute for command dispatch. Findings stay local; no
publishing is authorized.

The standing workflow authorizes exactly one review per increment pull request,
not reruns, extra probes, or `scripts/smoke-factory.mjs --spend`. Historical
reviews are already spent and carry no authorization forward. **If that one
review refuses before any reviewer starts, record the refusal and ask; do not
rerun on your own judgment.**

## Landing and handoff

Follow `AGENTS.md`: meaningful validated checkpoint commits, a named increment
branch and pull request, never direct `main` pushes, no force-push or amended
published history. Merging remains the user's decision. Preserve unrelated
changes. Inspect enumerations and counts when extending a concept; `V1b` had to
update the suite count from twelve to thirteen in several places. Update
`README.md` for user-visible behaviour; `V1b` did, under its own section.

Finish implementation, validation and roadmap evidence first. Rewrite
`HANDOFF.md` as the final repository file edit before the session-ending commit,
include it in that commit, and push it to that pull request. Refresh it last
again if any further edit is necessary. Report commit and pull-request outcome
and point to this handoff.
