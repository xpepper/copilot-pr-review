# Next session prompt

Read `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git state and open
pull requests before editing anything. Scope is authoritative; the roadmap
records demonstrated evidence and what stays open. Do not rely on any previous
conversation or reopen settled decisions. Distinguish what has been demonstrated
from what has only been assumed.

Every completed entry through `G1` is in
`docs/roadmap-archive-2026-09-10.md`, which you need only for an older
increment's evidence. The `--verify` guide is in `docs/safeguards.md`, the
re-review guide in `docs/re-review.md`, the previous README in
`docs/readme-archive-2026-09-10.md`, and the comparison against the field in
`docs/gap-analysis.md`.

## Your job this session is `B1`, and only `B1`

**`T1` is complete and merged** as `b87bbdd` (#37), so `main` carries it and the
seventeen-suite loop. **Start `B1` from a fresh branch off `main`.**

The backlog the user agreed on 2026-09-12 is `T1`, `B1`, `W1`, `N1`, `H1`, `K1`,
in that order, and **on the same day the user scheduled one more increment, the
long-context tier, immediately after `B1`**. That one is not in `ROADMAP.md` yet;
recording it is part of your job, and building it is not.

**`B1`: a review that could not look closely at the whole pull request says
which parts it skimmed, as a coverage gap rather than as silence.**

It changes behaviour, so it needs its own branch, its own pull request, and
**one plugin review as its verification of record**. That review spends real
credits. **Ask the user before you spend them**, and ask again before requesting
GitHub's own Copilot reviewer, which is free but posts publicly.

### What a planning session established before anything was built

A session on 2026-09-12 investigated `B1` with the user, spent no credits and
changed no repository file except this one. **Everything below was read from
the installed SDK, from Copilot's session logs on disk, and from upstream's
source; none of it has been demonstrated through this extension's own code.**

**Nothing in this tool truncates.** `reviewPrompt` in `review.mjs` embeds the
whole captured diff and every context window, and no size limit exists anywhere.

**The Copilot runtime compacts reviewer sessions anyway, silently.**
`prepareReviewer` in `fixture.mjs` never sets `infiniteSessions`, so the SDK
default applies: background compaction starts at 80% of the model's prompt budget
(`backgroundCompactionThreshold`, with `bufferExhaustionThreshold` at 95%).
Compaction has a model write a summary of the conversation and replaces the
conversation with it. From that point the reviewer no longer holds the captured
diff or its context windows verbatim, yet its citations must still quote them
exactly.

**It has happened on this project's own reviews, and no run said so.** Across 36
review invocations against real pull requests found in
`~/.copilot/session-state` (grouped by pull request, head and day), **seven
reviewer sessions in four reviews were compacted**:

| Review | Passes compacted | Prompt | Diff | Context windows | Tokens at compaction, of 272k |
| --- | --- | --- | --- | --- | --- |
| #3 | four specialists | 912k chars | 203k | 669k | 255k-258k |
| #24 | the deep reviewer | 835k | 328k | 482k | 228k |
| #32, first review | the deep reviewer | 834k | 198k | 603k | 239k |
| #32, second review | the deep reviewer | 942k | 243k | 662k | 265k |

Nothing at or below 616k characters compacted: not #31 (616k), #19 (504k),
`E1`'s review of `xpepper/pr-review-gemini#28` (390k) or #37 (323k). **So where
this stops working is now measured, for these models, at somewhere between 616k
and 834k characters of prompt.**

- **The pattern was the same every time**: two turns and four to seven tool calls
  on the full input, then compaction to between 24k and 30k tokens, then the rest
  of the pass on the summary. **#32's second review made 40 of its 50 tool calls
  after compaction completed.**
- #32's first review started compaction during its second turn, and the
  compaction completed 86 s later, after that reviewer's last message. Whether
  its final answer was written from the full context or the summary cannot be
  told from the log.
- **The context windows, not the diff, fill memory**: 57-80% of every large
  prompt.
- #24 and #32 each discarded candidates that turned out to describe real defects.
  **Compaction may explain that, and that is a hypothesis, not a finding.**
- The SDK's `SessionEvent` union includes `session.compaction_start`,
  `session.compaction_complete` and `session.truncation`, and also
  `session.context_cleared`. **That those reach `runReviewer`'s `session.on`
  handler is inferred from the types and from the persisted logs, not yet
  observed through this extension.** `session-state` is Copilot's implementation
  detail and not a contract, as `E1` recorded.

Reproduce the census, which reads local files and spends nothing:

```sh
node --input-type=module -e '
import { readFileSync, readdirSync, existsSync } from "node:fs";
const root = `${process.env.HOME}/.copilot/session-state`;
for (const id of readdirSync(root)) {
  const file = `${root}/${id}/events.jsonl`;
  if (!existsSync(file)) continue;
  const raw = readFileSync(file, "utf8");
  const first = raw.split("\n").find((line) => line.includes("\"type\":\"user.message\""));
  const prompt = first ? JSON.parse(first).data?.content ?? "" : "";
  if (!/^Assigned (specialist|reviewer):/.test(prompt)) continue;
  const pr = /"nameWithOwner":"([^"]+)"[^]*?"number":(\d+)/.exec(prompt);
  if (!pr || pr[1] === "fixture/repository") continue;
  if (!raw.includes("\"session.compaction_start\"")) continue;
  console.log(id.slice(0, 8), `${pr[1]}#${pr[2]}`, `${Math.round(prompt.length / 1000)}k chars`, "COMPACTED");
}'
```

It printed seven lines on 2026-09-12. Match on the first prompt, never on a bare
instruction string: this repository's own diffs contain the reviewer
instructions, so a plain grep counts agent sessions that merely read them.

### The decisions the user took, none of which is to be reopened

1. **`B1`'s signal is the runtime's own context-loss events, measured by code.**
   Not a reviewer's self-report of the files it examined, which is not scheduled:
   a compacted reviewer cannot know what its summary lost, and in the parallel
   modes a specialist is meant to pass over files outside its focus. Not a size
   threshold either, which would be a guess where the event is a measurement.
2. **A compacted or truncated pass is a coverage gap, not an execution failure.**
   Its findings survive and are still adjudicated against bound source; the
   review's coverage becomes INCOMPLETE. It is not a failed attempt and makes no
   reviewer eligible for `C3`'s or `C5`'s fallback. Upstream's self-review child
   fails closed on compaction; the user kept the roadmap row's "coverage gap".
3. **`B1` stays the honesty half.** No transport, no `contextTier`, no change to
   `infiniteSessions` or its thresholds, no change to what is embedded, reviewer
   count unchanged, citations still bound to the captured diff and context
   windows.
4. **The long-context tier is its own increment, immediately after `B1`.**
5. **Declined, each with its reason:**
   - Letting reviewers fetch the diff with `gh` or `git`. Reviewers hold exactly
     `view`, `grep` and `glob`; a shell is not a read-only reviewer. And anything
     a reviewer reads lands in the same memory as the embedded diff, so it only
     saves memory by reading less.
   - Storing the diff in DuckDB. The same memory problem, plus a first dependency
     for a repository that has none and a fourth reviewer tool.
   - Turning compaction off (`infiniteSessions: { enabled: false }`). What the
     runtime does on overflow then is decided in native code, and it might fall
     back to dropping the oldest message, which is the diff. **Unscheduled until
     a live run shows what overflow does**, and that run is a credit decision.

### Acceptance criteria for `B1`

- **`runReviewer` records every compaction and truncation event on the pass's
  evidence**, with the figures the runtime supplies (trigger, tokens before and
  after, token limit, messages removed, success) and how many turns and tool
  calls the pass had made when each began. Read `session.context_cleared`'s
  definition and include it only if the runtime can emit it without a person
  asking; otherwise record why it was left out.
- **Every reviewer, and the adjudicator, whose context was compacted or
  truncated produces one `coverage-gap` diagnostic** naming the pass, saying when
  it happened, giving the token figures, and saying plainly that from then on the
  pass worked from a summary of the captured diff and context rather than their
  text. **Code cannot know what a summary kept**, so the gap names the pass and
  the moment, never files.
- A compaction that started and had not completed when the pass settled is
  reported, and says so. A compaction whose `success` is false is reported as
  what it was.
- **A gap changes coverage only if it reaches `validation.diagnostics`**, whose
  blocking issues decide `validation.complete` and so `outcome.complete` in
  `executeReviewRun`. A diagnostic added only in `coverageDiagnostics` is printed
  and changes nothing. Decide where it belongs with that in mind.
- A configured fallback's failed primary attempt keeps its evidence in
  `fallbackFrom`, whose fields `failedAttempt` in `fixture.mjs` copies one by one;
  `T1` had to add `billing` there for exactly this reason.
- **The safeguard discovery pass and the revalidation pass are not review
  coverage** (`V1b`, `I1c`). Leave them out and record them as a follow-up.
- The gap flows through the existing diagnostics, so the printed coverage, the
  retained record and the published body carry it **without a schema version**.
  Check that `presentationDiagnostics` does not consolidate two different passes'
  compaction gaps into one. `--quiet` suppresses nothing about it.
- **Test first.** Script the events in the test doubles, watch the suite fail for
  the right reason, then make it pass. Cover a compacted reviewer, a compacted
  adjudicator, a compaction that never completed, a truncation, a fallback, and
  a run with none of these, whose coverage must be unchanged.
- `README.md` says what a compacted pass means in its coverage section and its
  limits. It has 7630 bytes spare.
- `ROADMAP.md`, in this order: **archive `T1`'s entry verbatim first** (below);
  then write `B1`'s entry with this census and these decisions; add the `Pending`
  row for the long-context tier; update the closing section.
- **One plugin review of `B1`'s pull request, after the user authorizes it.**
  `B1`'s own diff will be far below the size that compacts, so that review can
  show that an ordinary run gains no false gap and **cannot show a real
  compaction**. Say so in the entry. Reviewing a pull request large enough to
  compact is a separate credit decision for the user, not part of this one.

### The increment after `B1`: the long-context tier

Scheduled by the user on 2026-09-12, immediately after `B1`. **Do not start
it.** Add its `Pending` row after `B1`'s and **propose an ID to the user rather
than choosing one**: the user chose mnemonic IDs, `L` is taken by `L1`, and `X1`
for extended context is one candidate.

What is known, from the installed SDK and a model listing that ran no inference:

- `createSession` and `setModel` accept `contextTier: "long_context"`, which pins
  the session to the model's long-context tier when it has one, at that tier's
  own prices.
- The runtime's model list on 2026-09-12:

| Model | Default prompt budget | Long-context budget | Input price, default then long |
| --- | --- | --- | --- |
| `gpt-5.6-terra` | 272k | 922k | 200 then 400 |
| `gpt-5.6-sol` | 272k | 922k | 400 then 800 |
| `gpt-5.6-luna` | 200k | 922k | 20 then 40 |
| `gpt-6-astra` | 272k | 872k | 1000 then 2000 |
| `claude-opus-5` | 200k | 936k | 500 then 500 |
| `claude-sonnet-5` | 200k | 936k | 200 then 200 |
| `kimi-k3` | 917k | none | 300 |

  Prices are AI credits per billing batch of input tokens as the runtime lists
  them. The fields were found by a key search over each model object after
  `client.start()` and `client.listModels()`, so read the SDK types before
  relying on their exact paths.
- **Not demonstrated**: that the runtime keeps the tier on our sessions (check it
  the way `prepareReviewer` checks model and effort), how a pinned session is
  actually billed, and how well models reason over 900k tokens.
- **It needs a `SCOPE.md` decision**: it adds a setting the scope does not
  mention and can double a model's input cost. The exact wording is the user's to
  approve before the file is edited, as `T1`'s was.
- **Unsettled, and the user's call in that session**: always on, configured per
  tier, or only when the bound input is large.
- Two further levers, recorded and not decided: the compaction threshold itself,
  and the 40-line context windows being most of every large prompt.
- **`B1`'s gap stays as the backstop**, because a long-context window can fill
  too.

### What upstream does about this, read on 2026-09-12

Read at the pinned 1.17.10 (`457e18e`) and at 1.18.1 (`502e052`), which agree on
all of it. **Nothing was copied, and `L1`'s rule binds both increments.**

- **Each reviewer is its own `pi` process**, started with `--mode json -p
  --no-session --no-context-files --no-extensions --no-skills
  --no-prompt-templates --no-themes`. None of that touches compaction, and pi
  compacts by default once context passes its window less 16384 tokens, keeping
  the last 20000 verbatim. That is pi's documentation, not its code.
- **No reviewer code upstream handles compaction.** It bounds the input instead:
  below 200000 bytes the diff is embedded, and only the diff; at 200000 bytes and
  above the same reviewers get a changed-file manifest and must `read` the diff
  file through at most 16 host-planned ranges, or are marked partial; beyond
  1 MiB or 16 ranges it refuses. Reviewers never multiply.
- **Its "complete" proves every range was read, not that it was still in memory
  when the answer was written.** That is inferred from the absence of any
  compaction handling, not observed.
- **Its self-review child disables compaction and retry**, waits for the runtime
  to acknowledge that before sending the prompt, and fails closed on any
  compaction event. `SCOPE.md` dropped self-review; the stance is the relevant
  part.

### What is scheduled after that, so you can recognise scope creep

Do not start any of these: `W1` a remediation sentence on every finding, `N1` a
seeded corpus and deterministic scorer, `H1` opt-in project standards steering
the review, `K1` a feedback channel on a published review. `ROADMAP.md` carries
the acceptance criteria for each. `W1` takes no committable suggestion block.
`N1` takes neither the collection runs that spend credits nor a baseline gate.

**Six of `G1`'s twelve were declined**, each put to the user on its own, and are
in `ROADMAP.md` under "Recorded, not scheduled" with the reason. **Declined is
not deferred-until-you-feel-like-it**, and `docs/gap-analysis.md` is not an
authorization: **`G1`'s ranking and its five-stage sequence did not survive the
triage.**

## How to work with this user on a decision

The planning session's first well-formed question was rejected twice before it
could be answered: once for examples, and once because "compaction" meant
nothing without a plain explanation. **Before asking the user to choose, explain
any runtime concept in plain terms, walked through a real run from this
project, and give worked examples of real cases where the options actually
behave differently.** Then one decision per message: what is at stake, the
recommendation and why, the alternatives.

## What `T1` left open

`extensions/pr-review/cost.mjs` is the cost line, plus a collector in
`executeReviewRun`. **If you add a stage that starts a model pass, route it
through `payFor` or the run under-reports**, and `scripts/smoke-cost.mjs` asserts
that in source. The cost line is not part of `formatCoverage`, `--quiet` does not
suppress it, and nothing reads its elapsed figures. Left open and recorded in
`ROADMAP.md`: the revalidation pass has no end-to-end run in any suite,
`scripts/runtime-quick.mjs` computes a narrower total of its own, and a retained
result does not carry what its run cost.

## Headroom

At 65536 bytes this project's own safeguard discovery stops reading a file,
silently, and **CI fails the build if any root file crosses the cap.**

- **`ROADMAP.md` has 1313 bytes spare**, less than any increment entry ever
  written there. **Archive `T1`'s 5952-byte entry before you write a word of
  `B1`'s**: move it verbatim into `docs/roadmap-archive-2026-09-10.md` with the
  same kind of pointer the earlier moves left in both files, never rewritten or
  condensed. One live entry is where that rule lands.
- **`README.md` has 7630 bytes spare** and needs no housekeeping this time.
  Housekeeping, when it is needed, is worth its own pull request and worth
  agreeing with the user first.
- Measure with `wc -c` and run the collector check below before opening a pull
  request. A file in the skipped list has crossed 65536.

## Validation and runtime caveats

The **seventeen** controlled suites (`node scripts/smoke-<name>.mjs`) need no
inference and no network, and all seventeen pass at this handoff:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost; do node scripts/smoke-$s.mjs; done
```

If you add an eighteenth, add it to `.github/workflows/ci.yml` and to this loop.
**GitHub Actions runs the same loop on every pull request and every push to
`main`**, with two invariants this repository has broken before: that the tool
can still read its own instruction files, and that no tracked text carries a
control byte. It is not a substitute for running the suites locally before a
checkpoint commit, and it runs nothing that spends Copilot credits. A red run is
a real failure; do not rerun it hoping for green.

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

**Do not `cd` out of the working directory in a Bash call.** During `G1` a call
beginning `cd /tmp && ...` narrowed the sandbox to a per-file allowlist that only
a fresh session cleared. Use the scratchpad by absolute path instead. In zsh a
bare `=====` word is expanded as a command lookup and fails, so quote separators.

**Reinstall the plugin before every review, and verify it.** #32's second review
found the installed copy stale by exactly the files its own fixes had touched.
**Check out first, then install**, and prove it:

```sh
copilot plugin install "$(pwd)"
diff -rq ~/.copilot/installed-plugins/_direct/pr-review/extensions/pr-review \
  extensions/pr-review   # expect no output
```

Run `copilot plugin list` immediately before dispatching as well; during `D1` an
install that had reported success was gone minutes later. CLI 1.0.83 warns that
direct local installs are deprecated for a future release.

**If you cannot type a Copilot slash command, dispatch it through the SDK** with
`node scripts/dogfood-review.mjs NUMBER --deep --all --no-comment --unattended`,
after exporting the two paths it asserts:

```sh
export COPILOT_CLI_PATH="$(command -v copilot)"
export COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)"
```

It requires `--all` and `--unattended`, refuses `--comment` and `--quiet`,
asserts a clean tree at the pull request head, and prints the run's own cost
line. `copilot -p "/pr-review N"` is not a substitute: prompt mode starts an
ambient model turn instead of dispatching.

**Run the review as a background process and block on the process itself.
Never add a timeout**, and a quiet timeline is not a hang. The evidence lines are
very long, so grep them narrowly. A reviewer's own tool calls and denials are in
the run's evidence line under `reviewers[].policy`.

**GitHub's own Copilot reviewer** needs GraphQL, because `gh pr edit
--add-reviewer copilot` fails with "Could not resolve user". It posts publicly,
so **it is the user's call**:

```sh
PR_ID=$(gh api graphql -f query='query { repository(owner:"xpepper",name:"copilot-pr-review"){ pullRequest(number:NN){ id } } }' --jq '.data.repository.pullRequest.id')
gh api graphql -f query='mutation($pr: ID!, $bot: ID!) { requestReviews(input: { pullRequestId: $pr, botIds: [$bot], union: true }) { clientMutationId } }' -f pr="$PR_ID" -f bot="BOT_kgDOCnlnWA"
```

Check the premise of any finding it leaves before implementing it. On `T1` three
of its points were right and one restated the plugin review's.

`node scripts/smoke-runtime.mjs --targets` **has not been run since `I1b`**,
where it passed with 75 assertions; `I1c` and `T1` added six more without
running them, so **81 is expected and unverified.** It spends no credits but
needs a live runtime connection, as did the planning session's model listing.
**Do not run either while a review is in flight.**

`scripts/smoke-reviewer-tools.mjs` must be run and reported for any increment
touching `read-only.mjs`. `B1` should not touch it.

The personal config probe fails its first assertion if personal
`pr-review/config.json` exists. Move it aside only if running that probe, restore
it afterwards, and verify with `shasum -a 256`.

**Press Space on the command before pressing Enter** in any `--verify` run, in
finding selection, and in the reply confirmation. Enter on a merely highlighted
option submits the empty default.

**Keep the source of every fixture plain text**: a raw control byte in a test is
what refused #17's review.

**Never add a timeout, deadline or stuck-reviewer heuristic**, and never add one
to bound a running safeguard. `SCOPE.md` forbids review timeouts, and `C3`, `C5`,
the watch exclusion and `V2a`'s cancellation all depend on their absence. **A
compaction event is a report about what happened to a pass, never a trigger to
stop, retry or replace it.**

**Do not weaken the shell gate.** **Do not revert to `fs.realpathSync` anywhere in
`read-only.mjs`**, and do not replace the `lstat` check in `absentInsideRoot`.
**Do not widen `F6`'s marker unwrap or reintroduce substring matching.**

No runtime API changed. CLI 1.0.83 remains the recorded runtime. Derive the SDK
path from `copilot --version`; old packages under `~/.copilot/pkg/` are never
pruned. **Do not revisit Agent Factories without a new CLI version.**

Cold resume of command-only records remains unsupported. Citations remain limited
to captured diff and context windows, which produced #32's second coverage gap.

## Settled decisions, none of which is to be reopened

- **`B1`'s design, as recorded above**: runtime events measured by code, a
  coverage gap and not a failure, the honesty half only, reviewers and the
  adjudicator only. The self-report alternative is not scheduled.
- **The long-context tier comes immediately after `B1`**, as its own increment
  with its own scope decision. Fetching the diff through `gh` or `git`, a DuckDB
  store, and turning compaction off were each declined for the reasons above.
- **The triage of 2026-09-12 is settled.** Do not re-triage, re-rank or re-argue
  it, and do not promote a declined item because the document ranks it highly.
- **`T1` is closed.** Both elapsed figures, every paid pass counted, an
  unreported charge left unavailable rather than summed, the line kept out of the
  published body and out of `--quiet`'s reach.
- **`I1c`'s six decisions stand**, as recorded in its archived entry. Upstream's
  convergence does not reopen them.
- **Code proves that a finding still stands and never that it has gone away.**
- **An unknown write outcome stops the reply set.** A definite rejection does
  not. Do not add a retry.
- **A reply must never come back as a finding or as a review this tool wrote.**
- **`/pr-review publish` answers no thread**, deliberately.
- **`I1b` is opt-in and stays opt-in**, and a confined run's confinement is a
  caveat, never a coverage gap.
- **`I1a`'s slicing is settled and is not to be re-cut.** A rewound head is
  `diverged`; an unreachable head is `unknown`.
- **`toolReviewBody` deliberately does not match the coverage prose**, only that
  a coverage sentence is present, so a new gap wording breaks no prior-review
  discovery.
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

**`main` is at `b87bbdd`**, carrying #36 and `T1`'s #37, both merged.

**This handoff is on branch `handoff-b1-compaction` and its pull request**,
which changes `HANDOFF.md` alone. It is documentation-only, so its plugin review
is the user's call. **`ROADMAP.md` was deliberately left untouched**: recording
the two decisions there needs `T1`'s archive move first, and that move is the
first step of `B1`'s session. Confirm the branch and pull request from git and
`gh` rather than from this sentence.

**No credits were spent** in the planning session, no finding was posted, and
nothing under `extensions/` or `scripts/` changed.

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
