# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md). Completed entries through `A1` were moved verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) by
`A1`, `L1` and `D1`, so this file keeps the increments table, the two most
recent completed entries and the closing section, and stays small enough for
this project's own safeguard discovery to read. **With `D1` complete, v1 is
done.** One further increment, `O1`, is scheduled after it at the user's
request; every other row in the table is complete. The closing section records
what stays open as a limitation rather than as work.

**Since 2026-09-07, every increment lands on a branch and a pull request that is
reviewed with this plugin, and that review is the increment's real integration
test.** Controlled suites use test doubles and prove logic only; the pull-request
review exercises the installed plugin, the real runtime, real models, real `gh`
requests, the real revision gate and real confined reads. An increment is not
demonstrated until that has run once and its evidence is recorded here. `main` carries a repository ruleset requiring a pull
request with zero approving reviews and no bypass actors, so nobody pushes to it
directly. Each increment's entry below must record its pull request and the
outcome of reviewing it with the tool: mode, model and effort actually used,
coverage, findings and withheld findings, reported credit cost, and what changed
in response. The tool emits only `COMMENT` reviews, so its review never satisfies
an approval requirement, and findings stay local unless the user authorizes
posting them.

## Increments

| ID | Status | Independently demonstrable outcome | Requirements / dependencies |
| --- | --- | --- | --- |
| S0 | Completed | Confirmed product specification recorded in `SCOPE.md`, commit `6407a59`. | [Goal](SCOPE.md#goal) |
| L1 | Completed | Upstream declares MIT in every place it publishes metadata and publishes no licence text and no copyright notice anywhere, so MIT's notice condition cannot be discharged from upstream material. Nothing may be copied; a line-level audit of 5544 upstream lines against 56 local files confirms nothing has been, the only overlap being seven boilerplate strings. Answer, evidence and rule recorded in `docs/upstream-licensing.md`. Pull request #23, reviewed once with this plugin at the user's authorization: 0 validated findings on incomplete coverage, 137.46398 credits, and six discarded candidates of which most were real and are fixed on the branch. | [Upstream baseline](SCOPE.md#upstream-baseline) |
| F1 | Completed | Locally installable plugin with a code-owned, usable status/help entry point; runtime evidence and reproduction below. | [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F2 | Completed | Two concurrent reviewers over a tiny original local fixture; distinct explicitly configured subscription models and reasoning levels; display assignments, per-reviewer progress, and results. | F1; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F3 | Completed | Native forbidden-tool denials plus an adversarial fixture; retained incomplete coverage; startup/active/unresponsive cancellation and owned-runtime/extension/parent loss exercised with process-exit evidence. Stdio integration selected; limits below. | F2; [Models/execution](SCOPE.md#models-configuration-and-execution) |
| F4 | Completed | A reviewer child session can be granted an exact read-only built-in subset (`view`, `grep`, `glob`) while write/exec tools stay natively refused, reads are confined to a chosen directory by the permission handler, and the grant does not leak. Evidence below. | F3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| Q1 | Completed | Read-only code-owned PR capture with repository/head-bound snapshot, skip/override/confirmation gates, consistency guards, and installed-plugin controlled/live evidence below. | F3; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q2 | Completed | Source context bound to the captured head/base revisions with blob-verified provenance; local-checkout, moved-head, and inconsistent source refused. Evidence below. | Q1; [Targets](SCOPE.md#targets-and-local-behavior) |
| Q3 | Completed | Three concurrent quick specialists consume bound PR input; explicit/ambient assignments, alias, incomplete coverage, and cancellation demonstrated below. Candidates remain unvalidated. | Q2; [Modes](SCOPE.md#review-modes-and-findings) |
| Q4 | Completed | Strict evidence/whole-claim gates, isolated adjudication, deduplication and degraded findings; positive controlled and real-PR installed-plugin inference demonstrated below. | Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| P1 | Completed | Invocation-bound validated finding selection via native elicitation or `--all`; subset/none/cancellation, invalid-answer rejection and no-UI behavior demonstrated below. No writes/cache. | Q4; [Selection/publication](SCOPE.md#selection-publication-and-cached-results) |
| P2 | Completed | Retain the latest settled quick result in its originating local session; inspect without inference/GitHub access. Reload and conversation-backed cold resume demonstrated; command-only resume caveat below. | P1; [Cached results](SCOPE.md#selection-publication-and-cached-results) |
| P3 | Completed | Independent posting authority, explicit confirmation and code-built COMMENT payload preview; native cancellation/reload/resume and no-submission evidence below. | P1; [Publication controls](SCOPE.md#selection-publication-and-cached-results) |
| P4 | Completed | Current-run COMMENT publication with fresh gates and durable uncertainty; nine native cases, reload/cold resume and real playground inline publication demonstrated below. | P3; [Publication gates](SCOPE.md#selection-publication-and-cached-results) |
| P5 | Completed | Explicit publish-later of the retained selection without rerunning reviewers; refetched evidence, fresh gates, version-4 authority, seven native cases and a real playground publication demonstrated below. | P2, P4; [Cached publication](SCOPE.md#selection-publication-and-cached-results) |
| C1 | Completed | Personal light/medium/heavy tier configuration and `autoPostReviews` inspected and updated by `/pr-review-config`; validated capabilities, nearest-tier/ambient inheritance, flag precedence and effective-assignment display demonstrated below. | F3; [Configuration](SCOPE.md#models-configuration-and-execution) |
| C2 | Completed | Explicit per-directory trust gates `.copilot/pr-review/config.json` overrides; untrusted files ignored unparsed, self-trust impossible, precedence and revocation demonstrated below. | C1; [Configuration trust](SCOPE.md#models-configuration-and-execution) |
| R1 | Completed | Verified-checkout reads and matching-head harnesses demonstrated. One authorized live quick review used unchanged source without denials; prior coverage gaps disappeared, but no additional finding was produced. GPT's `rg` alias is supported without widening the grant. | F4, Q3; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| M1 | Completed | Balanced is the default with its four heavy specialists, light overview reviewer and three-finding P3/nit cap. `--full` adds a medium conventions/maintainability reviewer and presents every qualifying severity with no minor cap. Demonstrated by controlled probes, no-inference installed dispatch, and live reviews of this repository's own pull requests #3, #4 and #5; #5 ran all three tiers on distinct models. A Claude-family medium model's fenced output is a recorded open defect. | Q4, C1; [Modes](SCOPE.md#review-modes-and-findings) |
| F5 | Completed | Structured output is demonstrated unusable on CLI 1.0.83: the factory surface is behind a CLI feature flag and reachable only from a joined foreground session, a joining extension cannot register the permission handler that confines reviewer reads, and a custom agent's declared `view`/`grep`/`glob` grant leaks `skill` and `sql`. Retry cost, `null` failure semantics and module reach measured below. Recommendation recorded: fall back to a narrow fence unwrap, with its cost stated and the choice left to the user. No reviewer was migrated. | M1, F3; [Technical feasibility](SCOPE.md#technical-uncertainties-and-proposed-sequence) |
| F6 | Completed | Reviewer output survives a model that wraps it. Reviewers and the adjudicator are asked for the envelope between two explicit markers, and code unwraps that delimiter pair, then one fence that wraps the whole response; markers and fences count only when they are the whole line, so payload text is never a wrapper. Everything after the parse is unchanged, and a table below pins what is still discarded whole. Demonstrated by the full-mode review of pull request #7, which discarded four reviewers on a substring-counting defect it also reported; that defect is fixed and the captured outputs replayed. | F5; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| M2 | Completed | `--deep` runs one integrated heavy reviewer over the whole pull request and presents every substantiated severity; a second mode flag is refused. Demonstrated by the twelve controlled suites, the installed no-inference dispatch, and the live deep review of pull request #8, which reached completed coverage on 68.27393 credits and found two real defects in its own documentation. | F6, M1; [Modes](SCOPE.md#review-modes-and-findings) |
| C3 | Completed | A tier may carry one optional fallback assignment, used for one extra attempt for the one reviewer whose own execution failed. No timer, no whole-review restart, no silent substitution, and no cross-tier inheritance. Demonstrated by the twelve controlled suites, two installed no-inference probes, and the live balanced review of pull request #10, which cost 233.19659 credits, completed all six sessions and found one real documentation defect. No fallback attempt has run live. | C1, Q3; [Fallbacks/execution](SCOPE.md#models-configuration-and-execution) |
| C4 | Completed | A tier whose resolved model supports no configurable reasoning effort resolves to no effort instead of inheriting one, so such a model can serve a tier; the same rule covers a tier's fallback model. An explicit effort is still validated and never silently lowered, and a capable model still inherits and is still refused. Demonstrated by the twelve controlled suites, two installed no-inference probes, and the live full review of pull request #11, which cost 269.135657 credits, reported incomplete coverage on three execution failures, and found one real defect in this increment's own display. | C1; [Configuration](SCOPE.md#models-configuration-and-execution) |
| Q5 | Completed | A candidate anchored on a changed line carries an optional `breaks` citation for the code that change breaks, which may be unchanged, in another hunk, or in another changed file, and which passes the same bound, in-window, exact-quote checks as every other citation. A supplied introduction citation still belongs to the location's own hunk; a null one is now a claim the adjudicator tests. Demonstrated by the twelve controlled suites, the reconstructed rejections from pull requests #4, #5 and #10, and the live balanced review of pull request #12, which cost 137.274102 credits, saw a reviewer use the new citation, and found one real defect in this increment's adjudicator contract. | Q4; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| Q6 | Completed | Candidate-only clipped-end quote repair restores exact bound source without dropping a named line. Controlled reconstructions of #11 and #12 reach adjudication; #4's inserted-space fabrication stays refused. PR #13's installed balanced review cost 134.753239 credits and was incomplete: contracts returned no usable output and correctness reported a coverage gap. The repair was first observed live on pull request #18, where it restored two clipped citations on one candidate and let it reach adjudication. Exact adjudicator/publication checks and both schema versions are unchanged. | Q5; [Modes/findings](SCOPE.md#review-modes-and-findings) |
| C5 | Completed | A completed reviewer whose output the evidence boundary discards becomes eligible for its tier's one fallback attempt, as an empty response already is. Demonstrated by the controlled suites and the installed balanced review of pull request #14, which cost 110.736851 credits across five completed reviewers with no denial. No tier had a fallback configured there, so the demotion path itself rested on scripted output until pull request #18, where the adjudicator's unparseable output produced the eligible failure live and had no fallback to take. | C3, Q4; [Fallbacks/execution](SCOPE.md#models-configuration-and-execution) |
| V1 | Completed | `--verify` enforces matching branch/SHA/cleanliness before reviewers and presents discovered existing commands for approval. `V1a` added the preflight, `V1b` discovery and presentation from the project's own instruction files, `V1c` per-command approval that records the answer, executes nothing and outlives no run. Demonstrated by the thirteen controlled suites and pull request #18's balanced `--verify` review, which cost 166.859549 credits, found two real defects and produced the first live discovery evidence. **That pass found no command in this repository**, so the interactive approval path is demonstrated only by the controlled suites. Execution is `V2`. | Q1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| V2a | Completed | Execute only approved existing safeguards with installed dependencies, in the current checkout, and show evidence and artifacts without autofix or checkout manipulation. Carries the exclusions and the citation check that `V1c` deferred to `V2`. Demonstrated by the thirteen controlled suites and pull request #19's interactive balanced `--verify` review, which cost 252.771985 credits, reached the host's real approval UI for the first time and saw the citation gate refuse a constructed command live. **That run approved nothing, so execution itself is still demonstrated only by the controlled suites.** It found one validated defect and two more that its own evidence gate discarded; two of the three are fixed here. | V1; [Safeguards](SCOPE.md#optional-project-safeguards) |
| V2b | Completed | Settled without code: safeguard output reaches no reviewer, the retained record says nothing about what ran, and the citation gate keeps accepting a prefix as a documented limitation. All three were answered "no change", so `V2` closes with `V2a`'s behaviour and the thirteen suites unchanged. The prompt's "verified to be at" wording is a recorded wording defect that bound citations already contain; it goes to `D1`. | V2a; [Safeguards](SCOPE.md#optional-project-safeguards) |
| A1 | Completed | Completed entries `F1` through `V1c` moved verbatim into `docs/roadmap-archive-2026-09-10.md`, leaving a live `ROADMAP.md` that this project's own safeguard discovery reads instead of skipping for size. The increments table, the two most recent completed entries and the exact-next-increment section stayed. Pull request #22; documentation-only, so no installed-plugin review, and the user was asked rather than charged. | V2b; housekeeping, no scope clause |
| D1 | Completed | User documentation: `README.md` reorganised by task with reproducible examples for configuration, modes, incomplete coverage, cancellation, publication, the cache and safeguards, shortened from 103903 to 55195 bytes so this project's own discovery now reads every root file and skips none. Also fixes the reviewer prompt's "verified to be at" wording and two shipped `help`/`status` strings that denied safeguards are ever executed, which makes it a behaviour change needing one installed-plugin review; that review is `--verify` with the safeguards suite approved. Pull request #24, reviewed once with this plugin at the user's authorization: deep with `--verify`, 136.8324 credits, 0 validated findings on incomplete coverage, and two discarded candidates that both described real defects, fixed on the branch. The offered safeguards were not approved, so execution still has no live evidence. | A1, L1; [Release boundary](SCOPE.md#priority-and-release-boundary) |
| O1 | Pending | A review's output can be asked to be quiet: one opt-in flag suppresses the evidence JSON lines and the raw untrusted model envelopes, and suppresses nothing about coverage, refusals, failures or publication. Verbose stays the default, because this project's own roadmap evidence is read from those lines. | D1; [Modes/findings](SCOPE.md#review-modes-and-findings) |

## Completed increments `F1` through `L1` are archived

Forty-three sections were here and three increments moved every one of them
verbatim to
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) on
2026-09-10: `A1` moved the thirty-nine through `V1c`, `L1` moved `V2a` and `V2b`
because this file had 4272 bytes of headroom left and the smaller of the two is
7547, and `D1` moved `A1`'s entry and then `L1`'s, in that order, which are the
last two in that file. Thirty-five are completed-increment entries, covering the
thirty-three increments `F1`, `F2`, `F3`, `Q1`, `Q2`, `Q3`, `Q4`, `P1`, `P2`,
`P3`, `P4`, `P5`, `C1`, `C2`, `F4`, `R1`, `M1`, `F5`, `F6`, `M2`, `C3`, `C4`,
`Q5`, `Q6`, `C5`, `Q7`, `V1a`, `V1b`, `V1c`, `V2a`, `V2b`, `A1` and `L1`, with
`R1` and `M1` each recorded in two halves. The remaining eight are the working
record kept between them:

- the `Q4` acceptance criteria recorded at the `Q3` checkpoint;
- the manual-test blocker about CLI discovery without a harness override;
- four manual-feedback sections, being the coverage classification and
  presentation feedback and its completed fix, the completed fix that
  consolidates equivalent coverage gaps, and the finding that the
  consolidation did not fire on real reviewer wording;
- the `R1` second-half harness checkpoint;
- the documentation checkpoint for pull request #4 and its review.

Nothing was rewritten, condensed or corrected in any of the three moves, so each
section still reads exactly as the session that wrote it left it, and the
archive is the evidence of record for every increment it holds: reproduction
commands, the models and efforts actually used, credit costs, findings and
rejections. Read it for the evidence behind an older increment. Do not redo,
widen or reopen anything in it; those authorizations are spent. **`V2a`, `V2b`,
`A1` and `L1` are all there now**, so the safeguard decisions `V2` settled, the
archiving `A1` performed and the upstream licence answer `L1` established are
read from the archive rather than from this file.
[docs/upstream-licensing.md](docs/upstream-licensing.md) is still the record of
that licence work and did not move.

**`D1`'s entry is the only one kept live**, along with the increments table above
and the closing section at the end. The rule these moves established is to keep
the most recent entries and archive the rest, measuring this file with `wc -c`
against the 65536-byte cap before opening a pull request. `D1` archived `L1` as
well as `A1` so that **`O1` starts with room to write its own entry**; a session
after `O1` should archive `D1` the same way and leave the same kind of pointer.

## Completed increment: D1

**`D1` is the last increment, and it is the user documentation.** It ships no
capability. It rewrites the documentation a reader actually uses, fixes three
shipped strings that told the user something false, settles the licence question
`L1` left to the user, and gives safeguard execution its first live evidence.

### The README was the tool's own blind spot

`README.md` was 103903 bytes. `instructionFileMaxBytes` in
`extensions/pr-review/safeguards.mjs` caps one instruction file at 65536 bytes
and `collectInstructionFiles` skips an oversized file by name rather than
truncating it, so this project's own safeguard discovery skipped its README, and
after `A1` it was the only root file it still skipped. That is exactly the
defect `A1` fixed for `ROADMAP.md`, and it is fixed the same way.

The previous README is kept verbatim in
[docs/readme-archive-2026-09-10.md](docs/readme-archive-2026-09-10.md), under
`docs/` because `collectInstructionFiles` reads the root and does not recurse,
so a file there is not a candidate that must be skipped. The move was checked
rather than trusted: the archived body hashes to the same SHA-256 as the file it
was cut from, `b60e985e05728b559022732fb7cb1ccdf71d9be5c566e4fa9b2f4625d1a66ea1`.

The live `README.md` is organised by what a reader wants to do rather than by
increment ID: install, a first review, the modes and what they cost, models and
configuration, reading a result, selection, publication, the cache,
cancellation, safeguards, a command reference, the deliberate limits, and how to
reproduce each behaviour. Every section `D1` was asked to document is there with
a runnable or typeable example, and the stale `Skipped: ROADMAP.md (exceeds
65536 bytes)` line in the discovery example is replaced with a hypothetical file
that describes no real checkout.

### Three shipped strings were false, and one was the tool lying about itself

The README was not the only stale documentation. Two strings shipped inside the
plugin told the user that safeguards are never executed, which `V2a` made false:

- `/pr-review help` said "Project safeguards are discovered and presented under
  `--verify`; approving and running one is not implemented", and its `--verify`
  paragraph said "Nothing is approved, nothing is run".
- `/pr-review status` said "It executes nothing: no project safeguard is
  approved or run in any mode".
- `plugin.json`'s description, which `copilot plugin list` prints, still read
  "Copilot CLI PR review runtime feasibility prototype. No reviews yet."

**The first two are the serious ones.** A person reading `/pr-review help`
before their first `--verify` run was told the tool would not run their project's
commands, and then it asked to run them. All three now describe what the tool
does. `verificationNotice`, which a `--verify` run prints at the start, was
already correct and is unchanged.

### The wording fix, and the gate that stays as it is

`V2b` recorded that the reviewer prompt tells every specialist its working
directory is "verified to be at" the reviewed head. That stays true of `HEAD`
after an approved safeguard runs and stops being true of the working tree, which
such a command may write into. The same over-claim appeared twice: in
`reviewPrompt`, which `V2b` named, and in `reviewInstructions`, which says the
checkout "has been verified to be exactly the reviewed head revision".

Both now claim what was actually proven: the checkout's `HEAD` was verified to
be the reviewed head revision **before this review started**. Test-first, in
`scripts/smoke-review.mjs`: the new assertions were written and run first and
failed on the old wording, and the same suite additionally asserts that no
reviewer prompt carries the old sentence.

**The gate did not change and must not.** `SCOPE.md` says these commands may
create artifacts and forbids cleaning the checkout, so re-asserting cleanliness
after execution would refuse a review because the person's own approved tests
wrote a coverage file. The consequence was contained already: `boundCitation` in
`findings.mjs` resolves every citation against the head and base blobs fetched
from GitHub, so a reviewer can read a file a safeguard wrote and can never cite
one. The sentence was what was wrong, so the sentence is what changed.

### The licence question is answered, by the user

`L1` deliberately left one question open and called it the user's rather than an
increment's: whether this project should carry a licence of its own. **The user
answered it during `D1`. This project is MIT licensed**, and `LICENSE` carries
the canonical MIT text with `Copyright (c) 2026 Pietro Di Bello`.

Nothing was copied from upstream to produce it: the text is the standard
template, which is why it can be used at all given that upstream publishes no
licence text. The decision changes nothing `L1` settled, and
`docs/upstream-licensing.md` now records both the answer and that fact. The
reuse rule stands exactly as written: behaviour and interfaces yes, source no.
The repository is no longer in the position it documented upstream being in.

### The archiving this entry required

`L1` left 16283 bytes of headroom against the 65536-byte cap, and a completed
entry does not fit in that. `A1`'s entry, at 7086 bytes, moved verbatim into the
existing dated archive under the rule the two earlier moves established: keep the
most recent completed entries live and archive the rest.

**`L1`'s own entry, 14359 bytes, moved too, once `O1` was scheduled**, so that
the next increment starts with room to write its own entry rather than having to
archive before it can record anything. `docs/upstream-licensing.md` is the record
of that licence work and did not move. Both copies were verified byte-identical
against the extracted block before the live copy was cut, and both pointers were
widened to cover them.

| File | Bytes after `D1` | Against the 65536-byte cap |
| --- | --- | --- |
| `README.md` | 56073, from 103903 | read, was the only root file still skipped |
| `ROADMAP.md` | 49506 | read, 16030 bytes spare |
| `HANDOFF.md` | 17620 | read |
| `docs/readme-archive-2026-09-10.md` | 105975 | not a candidate; discovery does not recurse |
| `docs/roadmap-archive-2026-09-10.md` | 464544 | not a candidate; discovery does not recurse |

**Discovery now reads every root markdown file of this project and skips none.**
That was demonstrated rather than inferred, by running the real
`collectInstructionFiles` against this checkout; the six files it reads spend
145971 bytes of the 262144-byte budget, so nothing is near being
skipped for the budget either.

### Validation

All thirteen controlled suites pass. `scripts/smoke-review.mjs` carries the new
assertions for both prompt sentences, written first and seen to fail on the old
wording. `git diff --check` is clean and the branch diff carries no control
byte, which matters because a raw control byte is what refused #17's review.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
wc -c README.md ROADMAP.md docs/readme-archive-2026-09-10.md
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

`scripts/smoke-reviewer-tools.mjs` was not run and did not need to be:
`read-only.mjs` was not touched, reviewer confinement is unchanged, and
execution is a separate path no reviewer can reach. **The no-inference installed-plugin probe was rerun**, because
`extension.mjs` changed and its `help` and `status` text is what that probe
dispatches. The plugin was reinstalled from this checkout first, then
`node scripts/smoke-runtime.mjs --targets` passed in full: command dispatch,
every argument refusal, the capture and lifecycle gates, the refusal of both an
ordinary and a `--verify` review on a mismatched checkout, and its assertions
that no model turn, subagent or tool execution occurred. It spends no credits.
It had not been rerun since before `V1b`.

**One operational caveat came out of that**, and it is not a defect in this
project. An install that had reported success, and that `copilot plugin list`
then showed, was gone from the list and from
`~/.copilot/installed-plugins/_direct/` minutes later, with a concurrent
`copilot` process the likeliest cause. The install was repeated, the installed
`extension.mjs` and `review.mjs` were diffed against this checkout and are
byte-identical, the probe was rerun against that copy and passed, and the copy
survived. **Check `copilot plugin list` immediately before dispatching a review**:
the installed copy is what a review actually exercises, and a silently missing
or stale one would be reviewed as though it were this branch.

### Pull request #24 and its review

Pull request #24 carries this increment, and the user authorized one review of
it. **They chose `--deep` over the `--balanced` run the handoff had prescribed**,
because this pull request's diff is 328477 bytes, 3.3 times #23's, and deep runs
two sessions where balanced runs six. It was typed in an interactive Copilot
session, as it had to be: `scripts/dogfood-review.mjs` registers no elicitation
handler and answers every permission request with `denied-no-approval-rule`, so
it can never approve a command.

    /pr-review 24 --deep --verify --all --no-comment

| What the run actually used | |
| --- | --- |
| Mode | deep, 1 integrated reviewer plus the adjudicator, `--verify --all --no-comment` |
| Heavy tier | `gpt-5.6-terra` at reasoning `high`, for the reviewer, the adjudicator and the discovery pass |
| Fallbacks | none configured, so a discarded output had no second attempt |
| Diff reviewed | 10 files, 328477 diff bytes, 482503 context bytes over 18 sources |
| Reviewer reads | 21 confined tool calls, `rg` and `view`, **zero permission denials and zero tool denials** |
| Credit cost | **136.8324 reported AI credits**, being 82.56705 for the integrated reviewer over five turns and 54.26535 for the adjudicator. The discovery pass's own charge is not reported on the evidence line |
| Outcome | **0 validated findings, coverage INCOMPLETE**, 0 withheld, nothing published |

**The safeguard suite was offered and not approved, so execution still has no
live evidence.** This was the run that was meant to close that gap, and it did
not. The `--verify` path ran to the gate and stopped there:

| The `--verify` path, step by step | What happened |
| --- | --- |
| Preflight | passed on head branch `d1-user-documentation`, no untracked path |
| Discovery | read `AGENTS.md`, `CLAUDE.md`, `README.md`, `HANDOFF.md`, `ROADMAP.md`, `SCOPE.md`; **skipped none** |
| Commands found | `node scripts/smoke-safeguards.mjs` and `node scripts/smoke-review.mjs`, both cited to `AGENTS.md` |
| Exclusion table | **0 refused**, so no exclusion rule fired live here either |
| Approval | **none of the 2 offered commands approved** |
| Execution | `not-started`; no command ran, and no artifact line was printed |

Two things follow, and both are worth keeping. **Making `README.md` readable did
not widen what discovery reported.** The README now inside discovery's reach
contains lines like `copilot plugin install "$(pwd)"` and `gh pr checkout
NUMBER`, which the exclusion table would refuse, and the pass reported neither.
What a discovery pass reports is a model's judgment over prose, not an
enumeration of every command-shaped line, which is exactly why this roadmap has
always said a live exclusion refusal cannot be arranged deliberately. And
**approval remains the one gate nothing else can open**: the run offered, waited
127 seconds, received an answer naming no command, and ran nothing, which is the
behaviour `V1c` specifies. **This is
also the first run in which discovery read every root file of this project**,
which is `D1`'s own outcome observed live rather than in a probe.

**Zero validated findings here is not a clean review, and this entry does not
read it as one.** The reviewer completed and produced two candidates. One was
refused at the evidence boundary with `Citation does not exactly match a
supplied context window`, the same reviewer habit #23 recorded. The other reached
the adjudicator and was rejected. **Both described real defects in this
increment's own new files, and both were fixed on this branch rather than
dismissed**, which is the course `V2a` and `L1` also took:

- **The roadmap contradicted itself about `D1`'s own status.** The introduction
  said v1 was done while the increments table still said `Pending` and this entry
  said the review had not run. The adjudicator **rejected** the candidate, on the
  ground that it called the table row newly added when the diff modified an
  existing row. The rejection is fair on its own terms and the contradiction was
  real: it is resolved here, in the direction the review itself made true.
- **The archived README's links no longer resolved.** Moving the file under
  `docs/` left root-relative targets such as `[SCOPE.md](SCOPE.md)` pointing at
  `docs/SCOPE.md`. This candidate never reached adjudication, because its own
  citation did not match exactly. The defect is real and newly introduced; the
  roadmap archive never had it, because those entries carry no markdown links at
  all. **The fix was deliberately not to rewrite the targets**: the archive's
  body is byte-identical to the README it was cut from, that identity is what
  makes it evidence rather than a retelling, and rewriting links would end it.
  The header now states that a root-relative link in the body means that path
  from the repository root.
- **The coverage gap was a real defect too, and the reviewer could not prove
  it.** It reported that the bound context for `review.mjs` did not include the
  block deciding whether to start the adjudicator, so it could not assess the new
  README's claim that every mode runs one. Checked directly here: `review.mjs`
  starts that session only `if (collected.candidates.length && !signal.aborted)`,
  so a review whose every candidate is refused runs no adjudicator and is charged
  for none. **The README's claim was an over-claim** and now says so. This is the
  clearest case yet of a coverage gap carrying a finding the evidence boundary
  would not let a reviewer make.

The clipped-quote repair fired live again, restoring one citation on the
candidate that reached adjudication. That is `Q6` observed live for the second
time, after #18.

**The run also produced a defect no reviewer found, and it is the most valuable
thing this review returned.** The operator reports having selected `node
scripts/smoke-safeguards.mjs`, and the run recorded that nothing was approved.
The session's own event log shows the question was open for **127 seconds**, so
nothing auto-answered it, and `approveSafeguards` returned a status rather than
an error, so the answer was well formed. What could not be determined is which
well-formed answer it was, **because `V1c` reported a decline and an accepted
answer naming nothing identically, both as `none`**. No elicitation payload is
logged by the session events, the process log or the extension log, so the raw
answer is unrecoverable and the two cases cannot be told apart after the fact.

The gate behaved correctly throughout: an answer naming no command approves no
command, and failing open is the one mistake this gate exists to prevent. **The
reporting was the defect.** A person whose selection never arrived was told, in
the same words a refusal gets, that nothing was approved, with nothing to
suggest their own answer had been empty rather than negative. That is very
likely why this review did not produce the live execution evidence it was run
for.

`D1` fixes it, test-first, and changes no gate. `declined` and `empty` are now
distinct statuses, execution still keys only on `approved`, and the `empty`
message says what happened and what to do:

    V1c safeguard approval: the answer named none of the 2 offered command(s), so nothing
    runs. If you meant to approve one, it did not reach this run; rerun the review to be
    asked again.

**This is the clearest vindication of the dogfooding workflow this project has
recorded.** No controlled suite could have found it, because both cases were
asserted to produce exactly the status the code produced; the suite agreed with
the code about a distinction neither of them drew. It took a person approving a
command in a real run and noticing that the tool disagreed with them.

The thirteen suites were rerun after these fixes and all thirteen still pass.

### Remaining limitations

- **`D1` did not deliver the live safeguard-execution evidence it was meant to.**
  Its one review offered both discovered commands and neither was approved, so a
  non-empty `accept`, a spawn, a capture and an artifact line are all still
  demonstrated only by the controlled suites. The `--verify` path is now
  demonstrated live as far as the approval gate and no further. This was the last
  increment, so there is no later increment's review to fold it into: closing it
  needs a review authorized for that purpose, and the closing section says what
  the cheapest one would be.
- **`README.md` has 9463 bytes of headroom, not a lot.** It is 56073 bytes
  against the 65536-byte cap, so roughly 10KB of further documentation would put
  it back where `D1` found it, skipped by this project's own discovery. Measure
  with `wc -c` before extending it, and move material into `docs/` rather than
  growing the root file.
- **The two archives have no index.** Finding an older increment's evidence, or
  an older description of a capability, means searching
  `docs/roadmap-archive-2026-09-10.md` or
  `docs/readme-archive-2026-09-10.md`. `A1` recorded this and left it to `D1`;
  `D1` leaves it undone deliberately, because the increments table above already
  indexes the roadmap archive by increment and the finished project does not
  need a second index to maintain.
- **The README's example outputs are illustrative.** The discovery, approval and
  execution transcripts show the real shapes those steps print, with a
  hypothetical project's files in them. They are not captured from a run of this
  repository, and the discovery example deliberately describes no real checkout.
- **The review output is still verbose.** The user has asked for a way to
  quieten it. Nothing is designed and nothing is scheduled, and `D1` did not
  start it, because it is a capability rather than documentation.
- **The stale-string class is not closed by a check.** Three false user-facing
  strings survived several increments because nothing tests the text of
  `help`, `status` or `plugin.json`. They cannot be asserted by a controlled
  suite as things stand, because `extension.mjs` joins a session at module load
  and cannot be imported without a runtime. The no-inference runtime probe
  dispatches those commands and asserts only their first lines.

## v1 is complete, and `O1` is the one increment scheduled after it

**`D1` has landed, so v1 is delivered.** `SCOPE.md`'s must-have column and its
costly-to-lose column are both entirely delivered, and so is its additional
agreed v1 capability. Everything in the table above except `O1` is complete.

**The user then scheduled exactly one more increment, `O1`.** It is described
under "The next increment" below. **`O1` is the whole of what is scheduled**: a
later session should not invent a second one, and should treat any other feature
idea as out of scope unless the user asks for it in that session. **Issue #21
exists** as a feature request about incremental re-reviews and unattended
execution; it is not scheduled and nobody should start it.

### The next increment is `O1`, quieter review output

**A review prints a great deal, and the user has asked for a way to quieten
it.** That request has been recorded and deferred since `V2b`; it is now
scheduled. `D1` deliberately did not start it, because it is a capability rather
than documentation.

The verbose part is not the useful part. A run prints `Q1 target:`, `Q2
context:`, the mode's `binding:` line, every reviewer's raw untrusted envelope,
the adjudicator's envelope, then a settled `evidence:` line that repeats most of
it, plus `P1 evidence:` and `P2 evidence:`. **Between them they dwarf the
findings**, which is what the person actually came for.

- **Deliver one opt-in flag** that suppresses the evidence JSON lines and the
  raw untrusted model envelopes. Verbose stays the default.
- **Verbose must stay the default**, because this project reads its own
  increment evidence out of those lines: the models and efforts actually used,
  the credit cost, tool calls and denials, coverage diagnostics. Every roadmap
  entry's evidence table comes from them. **`scripts/dogfood-review.mjs` must
  keep printing the whole timeline**, so an increment's own review is never the
  run that hid its evidence.
- **Nothing about trustworthiness may be suppressed, at any verbosity.** The
  coverage state and its diagnostics, incomplete coverage, every refusal and
  failure, the statements that a result is not a clean-review claim, the
  safeguard discovery, approval and execution summaries, and every publication
  outcome including an uncertain write all stay. A quiet run must still be
  impossible to mistake for a clean review.
- **Settle the flag against configuration deliberately.** `--verify` is
  deliberately not a configuration key because it authorizes execution;
  verbosity authorizes nothing, so a personal `/pr-review-config` key is
  defensible and may be what the user wants. **Ask before building both**; one
  flag is the smaller step and is enough to satisfy the request.
- **Acceptance**: a quiet run prints the effective assignments, per-reviewer
  progress, the findings, the coverage report and the settled outcome, and omits
  the envelopes and the evidence JSON. A run without the flag is unchanged. The
  thirteen suites cover both, written test-first.

**`O1`'s pull request is where the live safeguard evidence is finally bought.**
The user has authorized that review in advance, and it is `--verify` with a
command approved at the question. See below for why that matters and what to
watch.

**Nothing above is to be redone, widened or reopened.** Every increment's
authorization is spent, and the evidence for each is either in the two entries
kept here or in
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md).

**`V2` is closed**, and its answers are not to be reopened: no reviewer receives
safeguard output, the retained record says nothing about what ran, the citation
gate still accepts a prefix, the shell gate does not accept a command a project
wrote as a chain, and no timeout of any kind bounds a running safeguard.
**`L1` is closed**: upstream declares MIT and publishes no licence text or
copyright notice, so no upstream source may be copied and none has been. The one
question `L1` left to the user, whether this project should carry a licence of
its own, **has since been answered: it is MIT, and `LICENSE` carries the text.**

### What only a live run could show, and what it showed

Safeguard execution had never run under the installed plugin. #19's review
reached the host's approval UI and approved nothing, so a non-empty `accept`, a
real spawn, a real capture, a real artifact line and a real cancellation were
all demonstrated only by the controlled suites. `D1`'s own required review was
the last chance to close that inside an increment's own budget, and it was run
with `--verify` for exactly that reason.

**It did not close it.** The run offered both discovered commands, waited 127
seconds, and received an answer that named none of them, so nothing was approved
and nothing ran. **The person at the keyboard reports having selected
`node scripts/smoke-safeguards.mjs`**, and the recorded outcome is a defect in
its own right; see the entry above. **Safeguard execution is
therefore still demonstrated only by the controlled suites, and no entry in this
file may be read as though the installed plugin had ever executed anything.**
The `--verify` path is now demonstrated live as far as the approval gate and no
further: preflight, discovery over every root file, presentation, the question,
and a refusal that ran nothing.

Closing it now costs a review of its own, because approval sits after discovery
inside a running review and there is no cheaper way to reach it. **That is the
user's call and nobody should spend it unasked.** The cheapest honest way to buy
it, if it is ever wanted, is one `--deep --verify` review of a small pull
request, approving one fast command.

**A live refusal from the exclusion table is still not demonstrated either.**
#24's discovery pass read a `README.md` full of command lines the exclusion table
would refuse, including `copilot plugin install` and `gh pr checkout`, and
reported neither: it reported two commands and refused none. What a discovery
pass reports is a model's judgment over prose, so no later review can arrange
this deliberately.

### Recorded, not scheduled

These stay open and none is scheduled. They are limitations of a finished v1,
not a backlog. Do not start one without the user saying so.

- **A review against a substantial code diff**, the oldest and largest open
  observation. No review of any mode has run against one; #10 is the closest at
  984 additions over 12 files, and #14 is 666 over seven. It is separately
  authorizable and nobody has spent a review on it deliberately.
- **A live review in which a reviewer is refused an absent path**, the only way
  to learn whether `Q7`'s reason changes what a reviewer does next. It cannot be
  arranged deliberately without inducing the request, so it is a matter of
  watching later reviews rather than an increment to schedule.
- **A live review with a fallback configured**, the only way to close the gap
  #14's reviewers named about `C3` and `C5`. That is a deliberate credit
  decision, because a discarded output would then spend a second attempt. #18's
  adjudicator produced exactly the eligible failure and had no fallback to take,
  which is what a configured one would have answered.
- **A live approval that approves something, and everything downstream of it.**
  Two reviews have now reached the host's approval UI and approved nothing: #19
  offered two commands, and #24 offered two and received an answer naming
  neither, against the operator's own account of what they picked. So a non-empty
  `accept`, a real spawn, a real capture, a real artifact line, and cancelling a
  running command and its grandchildren are all still demonstrated only against
  the controlled harness. This is the largest remaining gap between what the
  suites prove and what the shipped tool has been seen to do.
- **A live refusal from the exclusion table.** #19's discovery pass reported only
  three candidates and refused one of them by citation, so no exclusion rule has
  ever refused a real discovered command. No later review can close this
  deliberately, because what a discovery pass reports is not ours to arrange.
- **Upstream's own licence position could change.** `L1` settled the inspected
  revision, not upstream in perpetuity. A later revision could add a `LICENSE`
  file or change the declaration. Recheck before relying on the answer for any
  revision other than the one `SCOPE.md` pins. `L1` itself is closed: copy no
  upstream source. This project's own licence is settled and is MIT.

`F6`'s marker contract has live evidence from five of six reviewers on #7, both
sessions on #8, every session on #10, on #11 every session that produced an
envelope at all, including the medium tier's `claude-sonnet-5` writing paragraphs
of prose before the markers, every session on #12, every completed reviewer on
#13, and all five reviewers on #14. #11's one unparsed output contained no
envelope, wrapped or otherwise, so it is not evidence against the unwrap. Do not
reintroduce substring matching and do not widen it. `C5` changed nothing about
the unwrap; it changed only what an attempt whose output fails it is called.

Do not revisit the Agent Factories surface without new information from GitHub.
Three separate blockers were demonstrated on CLI 1.0.83, and all three would
have to change: the feature flag, the extension-only factory registration, and
the confined tool grant that leaks `skill` and `sql`. A new CLI version is new
information; a new reading of the same documentation is not.

Do not add a timeout, a deadline or a "stuck reviewer" heuristic to make
fallbacks fire more often. `SCOPE.md` forbids review timeouts, and both `C3` and
`C5` depend on their absence: elapsed time is never a fallback trigger, and `C5`
sits beside the reviewer precisely because a hung reviewer never settles.

Land every increment on its own branch and pull request, review that pull
request with this plugin before asking for a merge, and record the outcome here;
`main` refuses direct pushes and merging stays the user's call. That applies to
any later work the user does schedule, not only to the increments above.
Playground pull requests #1 and #2 must never be merged or republished.
