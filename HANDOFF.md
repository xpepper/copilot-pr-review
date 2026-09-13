# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed.

Every completed entry through `B1` is in
`docs/roadmap-archive-2026-09-10.md`, which you need only for an older
increment's evidence. The `--verify` guide is in `docs/safeguards.md`, the
re-review guide in `docs/re-review.md`, the previous README in
`docs/readme-archive-2026-09-10.md`, and the comparison against the field in
`docs/gap-analysis.md`.

## Your job this session is `W1`, and only `W1`

**`X1` is complete on pull request #41**, branch `x1-long-context-window`.
Merging is the user's decision. **Confirm from `gh` that #41 is merged before
you start, and start `W1` from a fresh branch off `main`.** If it is not merged,
ask the user rather than branching off #41.

The backlog the user agreed on 2026-09-12 is `T1`, `B1`, `W1`, `N1`, `H1`, `K1`,
with `X1` inserted after `B1`. **`T1`, `B1` and `X1` are done.**

**`W1`: every validated finding carries one remediation sentence saying what to
do about it, in the presented and the published forms.** The sentence only: a
committable suggestion block is explicitly not part of it and stays unscheduled,
because code this tool proposes to write sits badly with a tool whose promise is
that it never writes source. It changes behaviour, so it needs its own branch,
its own pull request, and **one plugin review as its verification of record**.
That review spends credits: **ask the user before you spend them**, and ask
again before requesting GitHub's Copilot reviewer or mentioning
`@claude[agent]`, both of which post publicly.

### The decision that comes before any code is the user's

**The `SCOPE.md` wording.** `SCOPE.md` defers the finding editor and the
candidate schema excludes rewrite suggestions, so `W1` needs a scope change.
Put the exact text to the user and edit the file only after they approve it, as
`T1` and `X1` did. Anything else the design leaves open is theirs too; the
acceptance criteria are in `W1`'s row in `ROADMAP.md`.

## How to work with this user on a decision

**Before asking the user to choose, explain any concept in plain terms, walked
through a real run from this project, and give worked examples of real cases
where the options actually behave differently.** Then one decision per message:
what is at stake, the recommendation and why, the alternatives, ranked by
effort, cheapest viable first. Be willing to change the recommendation when the
user's reasoning is better, and say why. In `X1` the user overruled two
recommendations, per-tier settings and refusing a model with no long window,
and both overrules were sound.

## What `X1` did, so you can recognise it

`--long-context` is one invocation flag, saved nowhere. `contextWindow` in
`fixture.mjs` resolves each assignment's and fallback's window from the session
catalog: `long_context [flag]`, `default [model]` displayed as "(no long-context
window)", or `default [unset]` without the flag. `prepareReviewer` sends
`contextTier` on **every** pass, `default` included, and refuses before any send
when its own catalog lists no requested long window or `getCurrent()` reports
another tier. The display, each `Assignment` line and the fallback line name the
window; the evidence line carries `longContext` and each pass's `contextTier`.
Not retained. Decisions taken with the user, not to be reopened:

- one flag per run, not always on, not per tier, not a size condition;
- a model that lists no long-context window runs on its own window rather than
  refusing, and one that lists a window and does not keep it is refused;
- the name is `--long-context`, and `SCOPE.md` carries the approved paragraph.

**Two runtime facts `X1` established, both read live with no inference:**

- **The session catalog lists the window at `billing.token_prices.long_context`**
  (snake_case). `client.listModels()` projects it as
  `billing.tokenPrices.longContext`, which the extension does not read.
  `kimi-k3` and `claude-haiku-4.5` list none.
- **`getCurrent()` echoes whatever `contextTier` a session was created with**,
  `long_context` included, even for a model that lists no such window. It proves
  a request was kept, never that inference used the window.

**Recorded, not scheduled**: a controlled test dispatching `--long-context`
through `extension.mjs`, which no flag has; an end-to-end suite run of the
revalidation pass, which no option has; a price comparison with and without the
flag; and evidence that inference used the larger window, which only a
compaction reporting a 922000 limit would give. **Do not fold any into `W1`.**

### What the reviewers said on #41

- **This plugin, deep with `--long-context`, 45.55611 credits**: the first live
  long-context pass, INCOMPLETE on two test-coverage gaps, 0 candidates. One gap
  was closed by a discovery test; the other described the review itself.
- **GitHub's Copilot reviewer**: three items. The discovery gap was accepted, the
  `extension.mjs` dispatch harness rejected for `X1` and recorded, and the
  roadmap and handoff item was already in hand.
- **`@claude[agent]`**: six observations on `3742416`, no blocking concern and no
  commit. Three confirm the design and one repeats the `extension.mjs` item. Two
  were rejected with evidence: a fallback whose window differs is already
  displayed and run in `smoke-review`, and the tier assignment it wanted a
  comment on is needed by fixture assignments and already commented.

## What is scheduled after `W1`, so you can recognise scope creep

Do not start any of these: `N1` a seeded corpus and deterministic scorer, `H1`
opt-in project standards steering the review, `K1` a feedback channel on a
published review. `ROADMAP.md` carries the acceptance criteria for each. `N1`
takes neither the collection runs that spend credits nor a baseline gate.

**Six of `G1`'s twelve were declined** and are in `ROADMAP.md` under "Recorded,
not scheduled" with the reason. Declined is not deferred, and
`docs/gap-analysis.md` is not an authorization.

## Headroom

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and **CI fails the build if any root file crosses the cap.**

- **`ROADMAP.md` has 956 bytes spare.** Archive `X1`'s entry verbatim
  into `docs/roadmap-archive-2026-09-10.md` before you write a word of `W1`'s,
  with the same pointers the earlier moves left in both files.
- **`README.md` has 2721 bytes spare**, much less than before. A `W1` section
  may need an existing one moved to `docs/`, as the re-review and safeguards
  guides were; that move is a user decision.
- `HANDOFF.md` is a root file too.
- Measure with `wc -c` and run the collector check below before opening a pull
  request. **A scripted edit should refuse unless every old string matches
  exactly once.** `X1` used one and dry-ran it before writing.

## Validation and runtime caveats

The **seventeen** controlled suites need no inference and no network, and all
seventeen pass at this handoff:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost; do node scripts/smoke-$s.mjs; done
```

If you add an eighteenth, add it to `.github/workflows/ci.yml` and to this loop.
GitHub Actions runs the same loop on every pull request and every push to
`main`, with two invariants: that the tool can still read its own instruction
files, and that no tracked text carries a control byte. It is not a substitute
for running the suites locally before a checkpoint commit, and it spends no
Copilot credits. A red run is a real failure; do not rerun it hoping for green.

This cheap check runs the real discovery collector against this checkout:

```sh
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

**It should read all six root files and skip none.**

**Test first means watching it fail for the right reason.** In `X1` the first
red run stopped at the first missing field, so each refusal check was then
disabled in turn to prove its own test fails, and restored by checksum.
**Several suites compare assignment and option objects literally**; a new field
breaks them, correctly, and they are part of the change.

**The shell is zsh.** `PIPESTATUS` does not exist there (use `pipestatus`), a
bare `=====` word is expanded as a command lookup, an unquoted `--include=*.d.ts`
glob fails, macOS `cat` has no `-A`, and **a Bash call beginning `cd /tmp && ...`
narrowed the sandbox during `G1`**. Stay in the working directory and use the
scratchpad by absolute path.

**While a plugin review is running, edit nothing in the checkout.** The reviewer
reads it. Draft in the scratchpad and apply afterwards.

**Reinstall the plugin before every review, and verify it.** Check out first,
then install:

```sh
copilot plugin install "$(pwd)"
diff -rq ~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review \
  extensions/pr-review   # expect no output
copilot plugin list
```

CLI 1.0.83 warns that direct local installs are deprecated for a future release.

**Dispatch the review through the SDK**, exporting both paths in the same shell
call, with the log in the scratchpad so the tree stays clean:

```sh
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
node scripts/dogfood-review.mjs NUMBER --deep --all --no-comment --unattended > LOG 2>&1
```

It requires `--all` and `--unattended`, refuses `--comment` and `--quiet`, and
passes any other flag through, `--long-context` included. **Run it as a
background process and never add a timeout.** `copilot -p "/pr-review N"` is
not a substitute.

**Read the evidence from the log narrowly.** The review's own line is the one
prefixed by the mode, `M2 evidence:` for deep; parse it as JSON. Per-pass tool
calls and denials are under `reviewers[].policy` (`toolCalls`,
`permissionDenials`, `toolDenials`), and `contextLoss` and `contextTier` are on
each pass.

**GitHub's own Copilot reviewer** needs GraphQL, because `gh pr edit
--add-reviewer copilot` fails with "Could not resolve user". It posts publicly,
so it is the user's call. It replied within about five minutes on #41.

```sh
PR_ID=$(gh api graphql -f query='query { repository(owner:"xpepper",name:"copilot-pr-review"){ pullRequest(number:NN){ id } } }' --jq '.data.repository.pullRequest.id')
gh api graphql -f query='mutation($pr: ID!, $bot: ID!) { requestReviews(input: { pullRequestId: $pr, botIds: [$bot], union: true }) { clientMutationId } }' -f pr="$PR_ID" -f bot="BOT_kgDOCnlnWA"
```

**`@claude[agent]`** is asked by a pull request comment, which is public. On #41
the comment asked for review comments only and no commits, and named the one
premise it should check rather than assume. The `claude-review` check also runs
on every push and posted nothing on #41. Check the premise of anything either
bot leaves before acting on it.

`node scripts/smoke-runtime.mjs --targets` **has not been run since `I1b`**,
where it passed with 75 assertions; 81 is expected and unverified. It spends no
credits but needs a live runtime connection. **Do not run it while a review is
in flight.** A probe that creates sessions and sends no prompt spends nothing,
as `X1`'s did; say that before running one.

`scripts/smoke-reviewer-tools.mjs` must be run and reported for any increment
touching `read-only.mjs`. `W1` should not touch it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. The user's file sets `gpt-5.6-terra` high for
heavy, `gpt-5.6-luna` high for light and `claude-sonnet-5` medium for medium.
Move it aside only if running that probe, restore it afterwards, and verify with
`shasum -a 256`.

**Press Space on the option before pressing Enter** in any `--verify` run, in
finding selection, and in the reply confirmation.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review.

**Never add a timeout, deadline or stuck-reviewer heuristic.** `SCOPE.md` forbids
review timeouts, and `C3`, `C5`, the watch exclusion and `V2a`'s cancellation all
depend on their absence. **A compaction event is a report about what happened to
a pass, never a trigger to stop, retry or replace it.**

**Do not weaken the shell gate.** **Do not revert to `fs.realpathSync` anywhere in
`read-only.mjs`**, and do not replace the `lstat` check in `absentInsideRoot`.
**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned. **Do not revisit Agent Factories without a new CLI version.**

Cold resume of command-only records remains unsupported. Citations remain
limited to the captured diff and context windows.

## Settled decisions, none of which is to be reopened

- **`X1` is closed**, with the decisions listed above.
- **`B1` is closed**: runtime events measured by code, a coverage gap and not a
  failure, the honesty half only, reviewers and the adjudicator only. Its
  entry, and why the structured events are not retained, are in the archive.
- **The triage of 2026-09-12 is settled.** Do not re-triage, re-rank or re-argue
  it, and do not promote a declined item because the document ranks it highly.
- **`T1` is closed.** Both elapsed figures, every paid pass counted, an
  unreported charge left unavailable rather than summed, the line kept out of the
  published body and out of `--quiet`'s reach.
- **`I1c`'s six decisions stand**, as recorded in its archived entry.
- **Code proves that a finding still stands and never that it has gone away.**
- **An unknown write outcome stops the reply set.** A definite rejection does
  not. Do not add a retry.
- **A reply must never come back as a finding or as a review this tool wrote.**
- **`/pr-review publish` answers no thread**, deliberately.
- **`I1b` is opt-in and stays opt-in**, and a confined run's confinement is a
  caveat, never a coverage gap.
- **`I1a`'s slicing is settled and is not to be re-cut.**
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present.
- **`U1` is closed and its shape is not to be widened.** Posting authority still
  never authorizes safeguard execution.
- **`L1` is closed**, and it binds every adopted item: re-implement from
  behaviour, never copy.
- **This project is MIT licensed**, `Copyright (c) 2026 Pietro Di Bello`.
- **`V2` is closed.** No reviewer receives safeguard output, the retained record
  says nothing about what ran, the citation gate still accepts a prefix, the
  shell gate refuses a chained command, and no timeout bounds a safeguard.
- **`O1` is one flag, not a configuration key**, and verbose stays the default.
- **`E1`'s two remaining items are recorded limitations**: truncated evidence
  lines and silent per-reviewer progress.

## State at this handoff

**`main` is at `6999386`** unless #41 has since been merged. **#41 carries `X1`**:
the scope, feature and README commits the plugin reviewed at `72892c9`, then the
roadmap commits, the discovery test GitHub's reviewer asked for, and this
handoff, all pushed. CI passed on `3742416`; confirm it on the current head.

**Credits spent this session: 45.55611**, on the one authorized deep
`--long-context` review of #41. No finding was posted by this tool. The only
GitHub writes were the Copilot reviewer request and the `@claude[agent]`
comment, both at the user's authorization. Nothing is uncommitted.

**Neither `I1b` nor `I1c` has live evidence, and both are blocked on the same
thing**: a pull request this tool has published a review on and that has since
moved. Arranging one is the user's call, and **playground #1 and #2 must never be
merged.**

If you land anything: follow `AGENTS.md`, with meaningful validated checkpoint
commits, a named branch and pull request, no direct `main` push, and no
force-push or amended published history. Keep findings local. Update `README.md`
for user-visible behaviour, and check its headroom before you do.

Rewrite this file as the final repository file edit before your session-ending
commit, include it in that commit, and push it to the pull request the work lives
on. Report the commit and pull-request outcome and point here.
