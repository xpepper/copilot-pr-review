# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect the working tree,
recent commits, open pull requests and the implementation before editing
anything. `SCOPE.md` is the authoritative product specification; `ROADMAP.md`
records demonstrated evidence, runtime caveats and the exact next step.
Do not rely on previous conversations or reopen settled product decisions.

## How work lands here

Every increment lands on a branch and a pull request. `main` carries repository
ruleset `22479389`, which requires a pull request with zero approving reviews
and grants no bypass, so direct pushes to `main` are refused for admins and
agents alike. If you find yourself committing on `main`, move the commits to a
branch before pushing.

The increment's pull request is then reviewed **with this plugin**, and that
review is the increment's real integration test. The controlled suites run
against test doubles and prove logic only. The pull-request review runs the
installed plugin with the real Copilot runtime, real models, real `gh` requests,
the real revision gate against a real checkout, and real confined read tools. An
increment that changes anything under `extensions/` or `scripts/` is not
demonstrated until that review has run once and its evidence is in `ROADMAP.md`.
Read "Land every increment on a reviewed pull request" in `AGENTS.md` in full
before you start.

## Recorded state

- **You are starting on a clean `main` with no increment in flight.** `main` is
  the squash merge of pull request #12, which completed `Q5`. Nothing should be
  uncommitted and no increment branch should be open. Branch from `main`.
- Pull requests #3, #4 and #5 delivered `M1`, #6 delivered `F5`, #7 delivered
  `F6`, #8 delivered `M2`, #10 delivered `C3`, #11 delivered `C4`, #12 delivers
  `Q5`. Read `git log` and the pull requests rather than looking for hashes from
  them: merged ones are squashed, so their individual commits are not ancestors
  of `main`.
- Pull requests #1 and #2 are synthetic publication playgrounds from P4 and P5.
  **Never merge them**, and never republish to them.
- `M1`, `F5`, `F6`, `M2`, `C3`, `C4` and `Q5` are Completed. **`Q6` is the next
  increment.** `C5` stays open and still needs the user's explicit go-ahead.
  `L1` stays pending.
- Nine live reviews of this repository's own pull requests exist: #3 and #4
  balanced, #5 full, #6 balanced, #7 full, #8 deep, #10 balanced, #11 full, #12
  balanced. All nine are spent. **Any review you run needs its own
  authorization; none of these carry over.**

## What `Q5` settled, so you do not redo it

A candidate anchored on a changed line carries an optional `breaks` citation for
the code that change breaks. Read "Completed increment: Q5" in `ROADMAP.md`
before you touch `findings.mjs` or `retention.mjs`.

- **The new citation carries no anchoring rule of its own.** It may name
  unchanged code, code in another hunk, or code in another changed file. It is
  still bound, in-window and exactly quoted, because it goes through the same
  `cite()` as every other citation. Do not add an anchoring rule to it.
- **It is optional, absent or null.** `candidate()` normalizes it to an explicit
  `null` on the finding, and `retention.mjs` accepts a record that omits the key.
  The retained record's schema version was deliberately not changed: it tracks
  publication authority, not candidate shape.
- **A supplied `before`/`after` citation still belongs to the location's own
  hunk**, on its own side and file, and still has to reach changed code. That
  refusal fires unchanged, and the mis-anchored candidates from #4 and #10 are
  still refused with the same message. `Q5` removed the reason a reviewer had to
  write one; it did not accept one.
- **A null introduction side is now a claim, not a code check.** It used to be
  refused whenever the location's hunk changed that side at all, which discarded
  #5's finding. The adjudicator is now told what a null side claims and to test
  it against the captured diff. Do not restore the code check without also
  restoring what it cost.
- **Deduplication reads the new citation** alongside `before`, `after` and
  `evidence`, which keeps behaviour identical to citing the same lines in
  `evidence`, where a reviewer had to put them before.
- **The published inline comment body was deliberately not changed.** The
  citation appears in the terminal findings view and the retained record only.
- Widening `before`/`after` to any changed hunk in the file was considered and
  rejected: an introduction pair drawn from two unrelated edits stops describing
  one edit, which is the only thing those two citations exist to pin.

## What pull request #12's review found, so you inherit it

The balanced review cost 137.274102 credits, completed all five reviewers, hit no
read or tool denial across 41 tool calls, and ran **no adjudication pass**,
because its one candidate never reached one. Three things in it matter to you.

- **A live reviewer used the new citation on the first pull request that offered
  it**, citing code eleven lines away in a different hunk, and no `Q5` refusal
  fired on it. That is one candidate in one review; nothing has yet shown one
  accepted through adjudication and presented as a finding.
- **The exact-citation match discarded it anyway**, over the trailing comma on
  the last line of that very citation. A second citation in the same candidate
  began its first line mid-sentence. This is `Q6`.
- **The finding was true and it was about `Q5` itself.** Relaxing the null
  introduction side moved a deterministic check onto the adjudicator, and the
  adjudicator contract never said so: its acceptance rule enumerated the
  candidate's prose fields only. Fixed inside the same increment, with
  controlled assertions on the contract text, after the review.

## The next increment: `Q6`

**Implement `Q6`, and only `Q6`, unless the user says otherwise.**
`ROADMAP.md`'s "Exact next increment" section states it in full, with the table
of every candidate the evidence boundary has discarded and which refusal did it.
Read that table before you touch `findings.mjs`.

`cite()` requires `source.lines.slice(startLine - 1, endLine).join("\n") !== quote`
to be false, so a quote must match its bound source byte for byte. Every
remaining row in that table is this one check, and it has now discarded two true
findings at opposite ends of a quote: #11 lost two **leading** spaces on the
first line, #12 a **trailing** comma on the last.

**Weigh it against its own counter-evidence, which is real.** On #4 that same
check stopped `contracts:2` at confidence 0.99, where the reviewer had introduced
a space into its own quote and the claimed defect was about that space.
Normalizing whitespace would have let that fabrication through. **Keep exact
matching as the acceptance path**, and report or repair a near-miss from the
cited line range instead of relaxing the comparison. One shape worth weighing
first, not a decision already taken: re-derive the quote from the bound source
and line range, then require the reviewer's quote to be a contiguous span of it.
That would recover #11 and #12 and still refuse #4, whose quote is not a span of
anything in the source. Weigh its own cost: a span rule lets a reviewer quote a
fragment while naming a wider line range, so whatever survives has to keep the
anchor honest.

The acceptance criterion: both recorded near-misses reach adjudication while the
recorded fabrication still does not, reconstructed as controlled fixtures rather
than trusted from this description. A near-miss can now appear on any citation a
candidate carries, including `breaks`.

`C5` remains open and still needs the user's explicit go-ahead. A reviewer whose
output the evidence boundary cannot parse settles as `completed`, so it never
becomes eligible for its tier's one fallback attempt, while a reviewer that
returns nothing does. Five of this project's live reviews were incomplete for
exactly that reason. Do not start it, and do not fold any part of it into `Q6`.
It moves the retry decision across the evidence boundary and changes what
`completed` means for every mode.

Keep the evidence boundary's other refusals exactly as they are, keep `L1`
pending, copy no upstream source, and update `README.md` if the change is
user-visible.

## Running the real integration test

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --all --no-comment
```

Name the mode deliberately. Without a mode flag the runner takes the default,
balanced. Say in `ROADMAP.md` which mode you used and why. `C3` used `--balanced`
because it changed no mode and balanced is the default topology; `Q5` used
`--balanced` for the same reason. `M2` used `--deep` because deep was the mode it
added and is the cheapest topology. `C4` used `--full` because it changed the
shared tier-resolution seam and full is the only mode that resolves all three
tiers.

Derive the SDK path instead of pinning a version. Old packages under
`~/.copilot/pkg/` are never pruned, so a pinned path keeps resolving after a
`copilot update` and silently drives a stale SDK against a newer CLI.
`copilot --version` is the only reliable source of the running version: on the
development host `command -v copilot` resolves into a Homebrew cask directory
labelled `1.0.48` while the CLI reports `1.0.83`.

Check out before installing, never the other way round. `copilot plugin
install` copies the working tree into the plugin cache, so installing first
installs whatever was checked out at the time. The revision gate only checks
that the *checkout* is at the pull request head, so a stale installed copy
would still be reviewed and reported as a passing integration test.

`scripts/dogfood-review.mjs` dispatches the real `/pr-review` command through
the SDK's command RPC, for agents that cannot type a Copilot CLI slash command.
It refuses to run unless local `HEAD` is the pull request head with a clean
tree, refuses `--comment`, prints the whole plugin timeline, and reports the
settled outcome with the runtime's credit figure. `copilot -p "/pr-review N"` is
not a substitute: prompt mode starts an ambient model turn instead of
dispatching the command. **Runtime varies widely and a quiet timeline is not a
hang.** #11's full run took roughly forty minutes; #12's balanced run finished in
98 seconds of process wall time, with the runtime's own event timestamps putting
all five reviewers between 17:50:48 and 17:52:03, and two of them still active
long after the other three had settled. No timeout is imposed by design, so
waiting is the only correct response.

Do not modify the working tree while a review is running: the reviewer is
reading that checkout live.

Record from that run: the mode, the model and effort each reviewer actually
used, coverage, findings, withheld findings, coverage gaps, tool calls and
denials, and the reported credits. The per-reviewer `policy.toolCalls`,
`policy.reads`, `policy.permissionDenials` and `policy.toolDenials` fields in the
evidence record carry the read evidence, and `billing` carries the charge; the
per-reviewer figures sum to the reported total, so check that they do.
**Save the reviewers' verbatim output from the timeline before you analyse
anything.** `F6`'s diagnosis, `M2`'s marker evidence, `C3`'s, `C4`'s and `Q5`'s
all came from those strings, and on #10, #11 and #12 the timeline was the only
place the review's one true finding survived. Fix real findings on the same
branch and say which you rejected and why. A refusal or failure is a defect
report about the tool; never weaken a gate to make the run pass.

## Runtime and validation caveats

- Consult the installed SDK and current official documentation before adopting
  runtime APIs. Installed SDK:
  `~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`, CLI `1.0.83`. Demonstrate
  capabilities; declarations and plugin format support alone are not proof.
- Reinstall with `copilot plugin install "$(pwd)"` after every extension change,
  before running any installed-runtime probe or the integration test.
- Controlled suites (no inference/network): `node scripts/smoke-<name>.mjs` for
  `findings`, `review`, `selection`, `retention`, `preview`, `publication`,
  `publish-later`, `checkout`, `config`, `context`, `fixture`, `target`. All
  twelve passed on pull request #12, as did `git diff --check`. Re-run them
  before you start: they need no network and no inference.
- Installed probes require both `COPILOT_CLI_PATH` and `COPILOT_SDK_PATH`, set
  the same derived way as the integration test above rather than pinned to a
  version. `scripts/smoke-factory.mjs` without `--spend` was rerun on #12 and
  reported `subagents: 0` and `nanoAiu: 0`. `smoke-runtime.mjs --targets
  --startup` and `smoke-config-runtime.mjs` were last rerun on pull request #11.
  `smoke-runtime.mjs --targets --matching-checkout --startup`,
  `smoke-retention-runtime.mjs` and `smoke-reviewer-tools.mjs` with
  `PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra` and with `claude-sonnet-5` were last
  rerun on pull request #5; `F6`, `M2`, `C3`, `C4` and `Q5` changed nothing they
  exercise.
- **`smoke-config-runtime.mjs` does not refuse when a personal
  `<copilot-config-home>/pr-review/config.json` exists.** It fails its first
  assertion, which expects `not created yet`. Move the file aside, run the probe,
  move it back, and verify the restore with `shasum -a 256`; a shell that dies
  mid-script can leave it moved away. On this host the digest is
  `30794150a3db740f7dcf6f9d7a5a827d3729c5599f7456f582af735d3f297ea9`, mode
  `0600`. The probe needs two things from the subscription: a second usable model that is not the ambient one and advertises
  a configurable effort, which `C3` added, and since `C4` a model that advertises
  **no** configurable effort. Today `claude-haiku-4.5` is the only model in this
  subscription that does.
- `scripts/smoke-factory.mjs` is `F5`'s probe. Without `--spend` it starts no
  subagent and spends nothing, and it is a useful no-inference regression on the
  factory surface if you ever need to check whether the gate has lifted. With
  `--spend` it costs credits and needs explicit authorization.
- Reviewing costs real credits and scales with the diff, the reviewer count and
  whether any candidate reaches adjudication: 137.274102 for five balanced
  reviewers and no adjudication pass on a 9-file, 498-addition pull request,
  269.135657 for six full reviewers on a 10-file, 563-addition one,
  233.19659 for five balanced reviewers on a 12-file, 984-addition one,
  68.27393 for one deep reviewer on a 12-file, 385-addition one, 79.238565 for
  five balanced reviewers on a 3-file, 848-addition one, 124.2079 for six full
  reviewers on a 4-file one, 276.266849 for six full reviewers on a 13-file one,
  414.14627 for five balanced reviewers on a 27-file one, and 27.89 for three
  quick reviewers on a small one. Report the runtime's figure; never estimate it.
- Inference authorization does not accumulate. The workflow authorizes the one
  review of your increment's pull request. `smoke-factory.mjs --spend`, the
  recorded R1 live command, harness `--quick` paths, `--read-live`, fixture
  inference and any publication each still need a fresh explicit instruction in
  your own session.
- Do not revisit the Agent Factories surface without new information from GitHub.
  `F5` demonstrated three independent blockers on CLI 1.0.83 and all three would
  have to change. A new CLI version is new information; a fresh reading of the
  same documentation is not. `scripts/f5-factory-extension.mjs` mirrors the
  shipped candidate schema, so it has to follow any envelope change.
- Do not reintroduce substring matching in the `F6` marker unwrap and do not
  widen it. It now has live evidence from five runs: five of six reviewers on #7,
  both sessions on #8, all six sessions on #10, on #11 every session that
  produced an envelope at all, and all five sessions on #12.
- Cold `session.resume` of retained command-only records remains unsupported.
  Do not invent transcript recovery. The adjudicator remains zero-tool and
  citations remain restricted to captured diff/context evidence.
- Never add a timeout, a deadline, a heartbeat or a "stuck reviewer" heuristic.
  `SCOPE.md` forbids review timeouts and `C3` depends on their absence: elapsed
  time is never a fallback trigger.
- Older observations are listed in `ROADMAP.md` with their current status. The
  oldest is still the largest and still open: **no review of any mode has ever
  run against a substantial code diff**, and pull request #10 is still the
  closest at 984 additions over 12 files. Read denials have landed on the
  failing reviewers on two reviews, #6 and #11, with `insideRoot` in
  `read-only.mjs` refusing an absent path exactly like one outside the checkout;
  that is still an observation rather than an increment, and the safe direction
  is that an absent path stays refused with an accurate reason. A reviewer
  settling `completed` having produced no envelope at all is the `C5` case.
- Two sessions once worked on the same branch at the same time, and the second
  wrote a handoff from a stale premise. If that happens again, rebase rather
  than force-push, and say so in your report.

## Commit, pull-request and final-file handoff rules

Work on a branch named for the increment. Commit locally at meaningful validated
checkpoints, staging only that checkpoint's files and preserving unrelated
changes. Do not amend, rewrite published history, force-push, or push to `main`.
Update `ROADMAP.md` with evidence and remaining limitations before committing; a
checkpoint does not by itself complete an increment, and the roadmap should say
so while the increment is in flight.

Push the branch, open its pull request with `gh pr create`, run the integration
test above, record the outcome, and leave merging to the user.

Watch for one defect class that has now been the finding several reviews of this
project produced: **a list or a count that enumerates something you just
extended.** On `C3` it was a stale key count. On `C4` a draft roadmap sentence
called the new origin label "a seventh" when it was the eighth. On `Q5` it was
the adjudicator's own acceptance rule, which enumerated the candidate's prose
fields and so silently excluded both the new citation and the check that had just
moved onto the adjudicator. Grep for enumerations of whatever you add, and for
the numbers that describe them, before you push, and prefer deriving a sentence
from the list over restating its size.

Recent commits carry no attribution trailer, because those sessions were
instructed to add none. Older commits carry `Co-authored-by: Copilot`. Follow
whatever attribution rule your own session gives you; the history is
deliberately inconsistent on this point.

Before ending, finish implementation and applicable validation, update
`ROADMAP.md` with outcomes, reproduction commands, uncertainties and the exact
next small increment, and update `README.md` for user-visible changes. Then
rewrite `HANDOFF.md` as the **final repository file edit** before the
session-ending commit, include it in that commit, and push it so the next agent
reads it from the pull request the work lives on. If any later file edit is
needed, refresh the handoff last again. Pass these same rules on to the next
agent. If committing or pushing is blocked, still write the handoff last and
report it as uncommitted.

Distinguish observations from assumptions. Do not present this handoff's
historical results as probes run in your session. The final response should
report the commit and pull-request outcome and point to `HANDOFF.md`, not repeat
this prompt.
