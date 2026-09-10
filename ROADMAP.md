# Delivery roadmap

[SCOPE.md](SCOPE.md) is authoritative. The continuation request authorizes the
first implementation increment; the scope's earlier authorization statement is
historical. Items below target roughly 1-3 hours each, not review runtime limits.
An item is complete only with repository evidence. Later items may be split
further when their implementation context is known, without changing scope.
The standing checkpoint-commit, pull-request and fresh-session handoff workflow
is recorded in [AGENTS.md](AGENTS.md); the replaceable next-session prompt lives
in [HANDOFF.md](HANDOFF.md). Completed entries through `V1c` were moved verbatim
to [docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) by
`A1`, so this file keeps the increments table, the two most recent completed
entries and the next increment, and stays small enough for this project's own
safeguard discovery to read.

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
| L1 | Pending | Resolve applicable upstream licensing and attribution; record what can be reused. No upstream source reuse until resolved. Original prototypes need not wait. | [Upstream baseline](SCOPE.md#upstream-baseline) |
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
| D1 | Pending | Document configuration, modes, incomplete coverage, cancellation, publication, cache, and safeguards with reproducible end-to-end examples. Also fixes the reviewer prompt's "verified to be at" wording, which makes it a behaviour change needing one installed-plugin review; run that review with `--verify` and approve the safeguards suite. | A1, L1; [Release boundary](SCOPE.md#priority-and-release-boundary) |

## Completed increments `F1` through `V1c` are archived

Thirty-nine sections were here and `A1` moved every one of them verbatim to
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md) on
2026-09-10. Thirty-one are completed-increment entries, covering the twenty-nine
increments `F1`, `F2`, `F3`, `Q1`, `Q2`, `Q3`, `Q4`, `P1`, `P2`, `P3`, `P4`,
`P5`, `C1`, `C2`, `F4`, `R1`, `M1`, `F5`, `F6`, `M2`, `C3`, `C4`, `Q5`, `Q6`,
`C5`, `Q7`, `V1a`, `V1b` and `V1c`, with `R1` and `M1` each recorded in two
halves. The remaining eight are the working record kept between them:

- the `Q4` acceptance criteria recorded at the `Q3` checkpoint;
- the manual-test blocker about CLI discovery without a harness override;
- four manual-feedback sections, being the coverage classification and
  presentation feedback and its completed fix, the completed fix that
  consolidates equivalent coverage gaps, and the finding that the
  consolidation did not fire on real reviewer wording;
- the `R1` second-half harness checkpoint;
- the documentation checkpoint for pull request #4 and its review.

Nothing was rewritten, condensed or corrected in the move, so each section still
reads exactly as the session that wrote it left it, and the archive is now the
evidence of record for every increment it holds: reproduction commands, the
models and efforts actually used, credit costs, findings and rejections. Read it
for the evidence behind an older increment. Do not redo, widen or reopen
anything in it; those authorizations are spent.

The two most recent completed entries, `V2a` and `V2b`, stayed below, as did the
increments table above and the "Exact next increment" section at the end.

## Completed increment: V2a

**`V2a` runs an approved safeguard.** It is the first increment in which
pull-request controlled code executes on the user's machine, and everything
before it was built so that this one could be small. Its boundary was discussed
and approved before any code was written, one choice at a time, as `V1a`, `V1b`
and `V1c`'s were.

`V2` was split. `V2a` executes and reports to the person who approved. `V2b`
decides whether that output reaches a reviewer and what the retained record says
about what ran. The seam is clean because nothing in `V2a` needs to know a
reviewer exists, and the split keeps the largest safety boundary in the project
out of the largest diff in the project.

### The eight choices settled before implementation

| Choice | Settled as | Why |
|---|---|---|
| Slicing | **Two increments.** `V2a` executes and reports to the user alone. `V2b` takes reviewer visibility and the retained record. | Safeguard output is pull-request controlled text, so handing it to a reviewer opens an injection surface that has nothing to do with running a process. Both gates stay with `V2a`, because a slice that executes without them re-creates exactly the defect `V1c`'s argument identified. The user added a standing principle here: the smaller the increment the better, provided it stays coherent and meaningful. |
| Live evidence | **Two runnable safeguard lines in `AGENTS.md`, and the one authorized review is run interactively** by the user typing the slash command, so the host's elicitation UI can answer. | `scripts/dogfood-review.mjs` registers no elicitation handler, so it reports approval `unavailable` and can never approve or execute. Making a command discoverable is therefore not enough on its own. The interactive run closes the exact gap #18's correctness reviewer named, the untested dependency on the installed host accepting the multi-select schema and returning its documented actions. The alternative of teaching the dogfood runner an elicitation handler was refused: its current safety value is precisely that it has none. |
| Mechanism | **No shell.** Whitespace split, a strict character allowlist, `spawn` with an argument list, cwd at the checkout root, git and `gh` environment overrides scrubbed, `stdin` closed. | It is the only mechanism that makes the exclusions mean anything: against `sh -c`, `npm test && npm install` defeats any rule that reads the first word, and quoting defeats the rest. It also matches what `target.mjs` and `checkout.mjs` already do and say. The cost is stated rather than mitigated: this repository's own `for` loop is refused, which is why the live-evidence choice adds two plain lines. |
| The exclusions | **Refuse in code, before the offer.** Discovery still reports every command with its reason; approval offers only what survives; execution asserts the rule again before it spawns. | A command that may not run must never be put to a person as though it could. Reporting it anyway is what keeps a refusal distinguishable from a project that declared nothing. Re-asserting before the spawn is the belt: approval is the person's decision, and the check beside the spawn is the code's. |
| The citation check | **Token-bounded exact occurrence** in the text of the cited file, which this run read. | `V1c` dropped an exact quote on evidence that it would refuse almost everything this repository declares. That evidence no longer bites, because the shell gate already refuses every one of those shapes: a loop, a continuation, a quoted argument. What is left to check is only whether a plain single line is written where it says it is. Token bounding is what stops `npm run test` being carved out of `npm run test:unit`. |
| Output and artifacts | **Bounded capture, never a kill.** 8 MiB held per stream, the tail displayed, truncation stated. One `git status --porcelain` afterwards names what running project code left behind. | A chatty suite is not a failing one, so reaching the bound must not kill it, and the pipe is drained past the bound so nothing blocks on a reader that stopped listening. The preflight already proved the tree was clean, so the status read is an exact statement of what the safeguards changed. Nothing is reverted, stashed or cleaned, which `SCOPE.md` requires. |
| Cancellation | **Process-group `SIGKILL`, and no timer anywhere.** Commands run sequentially in discovery order; a cancelled run starts no further command. | `SCOPE.md` requires cancellation to stop owned work, and a test runner's workers are owned work. `detached: true` plus `process.kill(-pid)` is what reaches them. There is deliberately no escalation delay and no deadline: `SCOPE.md` forbids review timeouts, and `C3`, `C5` and the watch exclusion all depend on their absence. |
| A failed safeguard | **Not review coverage.** Reported loudly as its own outcome; `complete` and `coverage` stay exactly as the reviewers determined. | The same reasoning `V1b` used for discovery and `V1c` for approval. No reviewer receives safeguard output in this slice, so a safeguard grounds no finding, so a failing suite cannot make the review's own findings less trustworthy. `V2b` may change this, and would have to argue for it. |

### What the run does

`executeSafeguards` in `safeguards.mjs` runs immediately after
`approveSafeguards`, inside the same `verify` block in `review.mjs`, before any
specialist starts:

- only commands a person approved in this run reach it, and only after
  `commandRefusal` is asserted once more in the moment before the spawn;
- each runs as one process with no shell, in the checkout root, with `stdin`
  closed so a command that stops to ask a question fails instead of waiting
  forever on a review that has no timeout to rescue it;
- output is captured to a bound per stream and the end is displayed, because
  that is where a failing suite says what failed;
- cancellation kills the whole process group, so a runner's workers do not
  outlive the review, and no further command is started;
- one `git status --porcelain` afterwards reports what was left behind, and
  nothing is reverted, stashed or cleaned;
- a failed or refused safeguard is reported as itself and leaves review coverage
  alone.

**Nothing about execution enters the retained record**, exactly as discovery and
approval do not. `scripts/smoke-review.mjs` asserts `safeguards` stays out, and
no schema version moves. Answering that question by building the plumbing early
is precisely what `V2b` exists to prevent.

**Three stale statements were corrected**, all of which the controlled suites had
been asserting: the discovery presentation said this release executes none of the
commands, the approval question said nothing runs in this release, and both the
preflight timeline line and `verificationNotice` said no approved command is
executed and that the offered list is unfiltered.

### The exclusions are a heuristic, and here is what it misses

The table refuses programs that install, escalate privilege, change the machine,
move data over the network, drive version control, provision or deploy, or watch;
any token that names an installing, migrating, deploying, publishing, creating,
cleaning, serving, formatting or fixing verb; a set of write-in-place and watch
flags; a placeholder word; a shell keyword or builtin, which a wrapped construct
can present as its own first line carrying no metacharacter at all; and `vitest`
in the bare form that watches by default.
Known holes, recorded rather than papered over:

- **`node scripts/dogfood-review.mjs ...` passes every rule**, because its
  program is `node` and its arguments name nothing refused. It spends Copilot
  credits. Only an allowlist of known runners would catch it, and that was ruled
  out for the reason the exact-quote check was.
- **A project script can hide anything.** `npm run check` may install, deploy or
  watch, and nothing here can see inside it.
- **Combined short flags are not decomposed**, so `-gy` is not read as `-g -y`.
- **False refusals are expected.** `cargo test --features clean` is refused for
  the word `clean`. The refusal is visible and names its rule, and a project can
  answer it by declaring the command differently.

### Validation

Thirteen controlled suites pass, `git diff --check` is clean, and tests were
written first and confirmed red for the right reason at each implementation
commit. No new suite was added: execution is covered where discovery and approval
are, so the count is unchanged at thirteen.

`scripts/smoke-safeguards.mjs` drives the unit surface: fourteen shapes that need
a shell and ten that do not; twenty-seven exclusion cases and the two `vitest`
forms that are safeguards again; the citation check against a fragment, a
fabrication, an unread file and this repository's own shell loop; a passing and a
failing command with their exit status and output; a command that does not exist;
the re-assertion before the spawn; four approval outcomes that start no process;
a truncating capture that still passes; artifacts present, absent and unreadable;
a cancel before execution; and a cancel during execution that kills a grandchild
process the safeguard started, asserted by signalling that pid until it is gone.

`scripts/smoke-review.mjs` drives the run: an approved command runs after
approval and before the first specialist, its output reaches the timeline and no
reviewer prompt; a failing safeguard leaves `complete` true and `coverage`
completed; a refused command is never put to a person and is still reported with
its reason; an invented command is refused as uncited; an ordinary review runs
none of it; and `safeguards` stays out of the retained record.

`scripts/smoke-checkout.mjs` pins the notice the flag prints about itself, which
now states what an approved command does and that this is not a sandbox.

**`scripts/smoke-reviewer-tools.mjs` was not run and is not required**: `V2a`
does not touch `read-only.mjs`. The handoff for `V1c` predicted `V2` would touch
the question it answers. It does not: reviewer confinement is unchanged, and what
`V2a` adds is a separate path that no reviewer can reach.

### The installed-plugin review of pull request #19

**One authorized balanced review ran, with `--verify`, typed interactively so
that the host's approval UI could answer.** It reached that UI, discovery found
three commands in this repository's own files, the citation gate refused one of
them, and the person answered without approving anything. Nothing executed.

| Fact | Value |
|---|---|
| Command | `/pr-review 19 --balanced --verify --all --no-comment`, typed in an interactive Copilot session |
| Head reviewed | `8106ac3c9b80a19dc1f1fcf487054fddb73a4201` |
| Heavy reviewers | `gpt-5.6-terra`, reasoning `high`: correctness, contracts, security, performance-resources |
| Light overview | `gpt-5.6-luna`, reasoning `high` |
| Adjudicator | `gpt-5.6-terra`, reasoning `high` |
| Coverage | `incomplete` |
| Candidates | 8 produced, 4 reached adjudication |
| Validated findings | 1 |
| Withheld / rejected | 0 / 2 rejected on the merits, 4 rejected at the evidence boundary, 1 adjudication invalidated |
| Credit cost | 252.771985 |

#### What discovery and approval did, live

**The elicitation request reached a real host and a real answer came back.**
`V1c` merged with the interactive approval path demonstrated only by the
controlled suites, and #18's correctness reviewer named the untested dependency
on the installed host accepting the multi-select schema and returning one of its
documented actions. That dependency is now half closed: the host accepted the
schema and returned a documented action. What is still untested is `accept`
carrying a non-empty selection, and therefore execution itself.

**The record cannot say which answer it was.** `approveSafeguards` returns
`none` both for a decline and for an accept that selected nothing, so the
recorded `{"status":"none","approved":[],"offered":2,"refused":1}` is consistent
with either. Nothing runs in either case, so this changes no outcome; it is
recorded because a later increment reading the record should not believe it says
more than it does.

Discovery read `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md` and `SCOPE.md`, and skipped
`README.md` at 101652 bytes and `ROADMAP.md` at 444530 bytes for size, exactly as
`V1b` predicted. It reported three commands:

| Command | Cited file | Verdict |
|---|---|---|
| `node scripts/smoke-safeguards.mjs` | `AGENTS.md` | offered |
| `node scripts/smoke-review.mjs` | `AGENTS.md` | offered |
| `node scripts/smoke-reviewer-tools.mjs` | `HANDOFF.md` | refused: it is not written in that file as a command of its own |

**The two plain runnable lines this increment added to `AGENTS.md` were found,
and they were the only two offered.** That is the live-evidence choice working:
before `V2a` added them, this repository declared nothing a discovery pass could
offer, which is why #18 found no command at all.

**The citation gate refused a constructed command, live, for the reason it
exists.** `HANDOFF.md` writes `scripts/smoke-reviewer-tools.mjs` inside prose
about the confinement probe; it never writes `node` in front of it. The pass
supplied the runner itself, and the gate refused the result as uncited. This is
the first live evidence that the check catches a command a model assembled
rather than copied, and it is worth more than the controlled fabrication case
because nothing was staged to produce it.

**The exclusion table recorded no live refusal at all.** The pass reported only
those three candidates. It did not report this repository's own `for` loop,
`copilot plugin install "$(pwd)"`, `gh pr create`, or the wrapped dogfood
command, all of which the handoff predicted it might, and it did not report
`node scripts/smoke-runtime.mjs --targets`, which both gates would have accepted.
So the exclusions remain demonstrated only by the controlled suites. A discovery
pass that reports little is a safe failure and not a defect, but it is also not
evidence, and this entry must not be read as though the table had been exercised.

#### The findings, and what changed

**One candidate was validated, and its remedy is refused on the merits.**
Contracts, P1, `review.mjs:374-379`: the revision and cleanliness gate runs
before safeguards, the same checkout root then goes to the specialists, and only
an informational status read sits between them, so a reviewer can read a file an
approved safeguard changed. **The observation is true and the proposed remedy is
not adopted.** Re-asserting the checkout invariant after execution contradicts
`SCOPE.md`, which says in the same breath that these commands "may create
artifacts" and that this tool must "never automatically switch branches, pull,
stash, or clean the checkout". A re-assertion would refuse the review because the
person's own approved test suite wrote a coverage file, or it would clean the
checkout to satisfy itself. Both are forbidden. What is genuinely open is that
the reviewer prompt still tells every specialist its working directory is
"verified to be at" the head, which stays true of `HEAD` but no longer of the
working tree. **Deciding what a reviewer is told about a checkout safeguards
touched is `V2b`'s question, not a patch to `V2a`**, because it is the same
question as whether safeguard output reaches a reviewer at all; it is recorded
under the next increment below.

**Two more defects were real, were confirmed by reading and running the code,
and are fixed on this branch.** Neither was reported to the user by the tool.

- *Letter case walked past the whole denylist.* `commandRefusal` folded no case
  before its name lookups, so `Curl https://example.test/x` was neither the
  lowercase entry the table names nor an all-caps placeholder, and it passed
  every rule. `spawn("Curl")` then resolves to `curl` on a case-insensitive
  filesystem, which is the macOS default; that was confirmed on this machine,
  where it printed `curl 8.7.1`. It defeated the network exclusion the README
  promises in this same increment. Fixed in `b6fa802`, which folds case for the
  program, word and watch lookups and deliberately leaves flags exact, because
  `-w` and `-W` are two different flags and the table already carries both.
  **Security reported this, the adjudicator accepted it, and the acceptance was
  then thrown away**: `security:1: invalid adjudication: Citation does not
  exactly match a supplied context window`. The adjudicator's own citations
  failed the boundary, so a correct acceptance of a real defect produced no
  finding. This is the first recorded case of an adjudication being invalidated
  rather than a candidate.
- *The artifact scan outlived the run that started it.* `checkoutArtifacts`
  called `git` with an empty options object, so `runGit` received no signal and
  the post-execution `git status --porcelain` could not be cancelled. Fixed in
  `9c6182c`. Performance-resources and correctness reported this independently;
  neither reached the user.

**A third real defect was reported three times and surfaced zero times.** The
citation gate accepts a prefix followed by whitespace, so `npm test` passes as
cited from a file that declares `npm test --fix`, and
`node scripts/deploy.mjs` can be carved out of
`node scripts/deploy.mjs --dry-run`. Both were confirmed against the shipped
code. Correctness, contracts and overview each reported it; correctness's whole
output was discarded on a JSON syntax error, and contracts' and overview's
candidates were rejected at the evidence boundary for inexact citations. **It is
not fixed here**, because tightening the boundary also refuses prose that
declares a command mid-sentence, which is a trade-off for the user to settle
rather than a typo to patch. It is the first choice of the next increment.

**Two candidates were rejected on the merits, and both rejections are correct.**
Performance-resources argued that retaining each command's bounded output could
exhaust the host; the adjudicator answered that the 8 MiB per-stream bound is
deliberate and the run-level budget it proposed was never a contract. Overview
argued that the `V1` row still saying "Execution is `V2`" conflicts with the
`V2a`/`V2b` split; the adjudicator answered that the aggregate statement stays
true and the next-increment section is unambiguous. Both stand.

**Four candidates never reached adjudication**, three of them for inexact
citations (`contracts:2`, `performance-resources:2`, `overview:1`) and one for a
malformed candidate shape (`overview:2`, which supplied a key the schema does not
allow). `Q6`'s clipped-end repair fired once more, on `security:1`'s `breaks`
citation, restoring a truncated `README.md` quote.

#### What this run says about the tool itself

**This is the sharpest recorded measurement of what the exact-citation gate
costs.** Of three real defects in the increment, the gate let one through, threw
away a correct adjudication of the second, and rejected the third from all three
reviewers that found it. Every rejection was mechanically justified: the
citations really did not match. The gate is still the right design, because the
alternative is publishing claims nobody checked, and this review published
nothing. But "no accepted findings is not proof of a clean PR" is no longer a
disclaimer in this repository; it is a measured result. The rejected-candidate
text stays on screen for the person running the review, which is how all three
were recovered here, and that is the property to protect.

**Coverage was `incomplete` for a reason `C5` already describes.** Correctness
returned unusable output, `SyntaxError: Expected ',' or ']' after array element
in JSON at position 6519`, which makes it an eligible failed attempt with no
fallback configured on the heavy tier to take. That is the second live
observation of the `C5` path, after #18's adjudicator, and a live review with a
fallback configured remains the open question it was.

**Overview's coverage gap was accurate when written and is now closed.** It said
the installed-plugin review had not run, so the real elicitation and execution
behaviour could not be assessed from the controlled checkout. This run is that
assessment for elicitation. Execution stays unassessed live, because nothing was
approved.

#### Validation after the two fixes

All thirteen controlled suites pass at `9c6182c`, and `git diff --check` is
clean. `scripts/smoke-safeguards.mjs` gained four case-folded exclusion cases, an
assertion that the refusal names the rule rather than the spelling, an assertion
that short flags stay case-significant, and an assertion that the artifact scan
carries the run's cancellation signal.

**No second review was run.** The standing workflow authorizes exactly one review
per increment pull request, and it is spent. Both fixes are small, both are
covered by the suites, and neither is demonstrated by the installed plugin.

## Completed increment: V2b

**`V2b` is settled without code.** Its three open questions were put to the user
one at a time, as `V1a`, `V1b`, `V1c` and `V2a`'s were, and all three were
answered "no change". `V2` closes here. No file under `extensions/` or
`scripts/` was touched by this increment, so the shipped behaviour is exactly
`V2a`'s and the thirteen controlled suites are unchanged.

The user's reason for closing rather than building is recorded plainly, because
a later reader will otherwise assume the questions were never asked: the port
had grown far past the effort its goal justified, every must-have and every
costly-to-lose item in `SCOPE.md` was already complete, and the remaining
appetite belongs to `L1` and `D1` rather than to a fourth safeguard slice. That
is a judgement about scope, not a discovery that the questions were empty. Each
answer below is also defensible on its own merits, and the merits are what the
entry records.

### The three decisions

| Question | Settled as | Why |
|---|---|---|
| Whether the citation gate may accept a prefix | **No change. It still accepts one.** The behaviour is now documented as a limitation instead of being tightened. | Tightening it means demanding the match reach the end of its line, and that refuses the ordinary way a project declares a command, in prose: "run `npm test` before committing". The residual risk is real but narrow and bounded by the rules on either side of it, which the next table sets out. `V2a`'s answer to the same class of question applies here too: a project whose declaration is refused writes a plain line, and this tool does not loosen a rule to accommodate prose it cannot parse. |
| Whether safeguard output reaches a reviewer | **No. It never does, and this is now a decision rather than a deferral.** A failed safeguard therefore stays outside review coverage permanently, as `V2a` left it. | Safeguard output is pull-request controlled text produced by pull-request controlled code. Handing it to a reviewer opens a prompt-injection surface that has nothing to do with running a process, and it would let a failing suite make the review's own findings look less trustworthy when the two are unrelated. `SCOPE.md` asks the flag to ground claims in evidence; it grounds them for the person who approved the command, which is who decides what to do about a red suite. |
| What the retained record says about what ran | **Nothing. The record is unchanged and gains no schema version.** `discovery`, `approval` and `safeguards` stay out of `outcomeKeys`, as they have since `V1b`. | The record exists to let a later publish act on a settled result without rerunning reviewers. Nothing about what a safeguard did changes what may be published, so an execution record would be inert data on a durable artifact, and inert data on a durable artifact is what a later increment misreads. The argument is weaker here than for a stored approval, which is why it was asked rather than inherited, but it is the same argument and it still holds. |

### What #19's one validated finding turns out to mean

Contracts, P1 on #19 observed that the revision and cleanliness gate runs before
safeguards, so a reviewer can read a file an approved safeguard changed while
the reviewer prompt still says its working directory is "verified to be at" the
reviewed head. Re-asserting cleanliness afterwards was refused in `V2a` and stays
refused: `SCOPE.md` says these commands may create artifacts and forbids
cleaning the checkout, so a re-assertion would refuse a review because the
person's own approved tests wrote a coverage file.

**What was not established at the time is that the inaccuracy cannot produce a
finding.** `boundCitation` in `findings.mjs` resolves every citation against
`context.files`, requires the source's `ref` and `blobSha` to equal the bound
head or base fetched from GitHub, and then replaces the model's quote with the
lines of that bound content. A file a safeguard wrote or changed in the working
tree has no bound source, so a citation naming it is refused as outside bound
provenance, and a candidate without an accepted citation never becomes a
finding.

So the prompt sentence is inaccurate about the working tree and accurate about
`HEAD`, and the inaccuracy is contained by a check that was already there for
another reason. It is recorded as a wording defect, not a path. Fixing the
wording is a behaviour change under `AGENTS.md` and would cost this increment a
review it does not otherwise need, so it is left for `D1`, which revisits the
user-facing text anyway.

### The prefix limitation, stated exactly

`citationRefusal` in `safeguards.mjs` searches the cited file for the command
text, requires the character before the match to be outside `safeCharacter`, and
accepts the match when the character after it is outside `safeCharacter` too, or
is a full stop, comma or colon that ends a word. Whitespace is outside
`safeCharacter`. A prefix ending at a space therefore passes.

| Consequence | Bounded by |
|---|---|
| `npm test` is accepted as cited from a file that declares `npm test --fix`. | The offer shows the person the exact command that would run, not the line it was cited from. Approval is per command. |
| A command whose safety lives in a trailing argument can be offered without that argument. | `commandRefusal` runs first and refuses by program, word and flag, so the dangerous shapes the denylist names are refused whatever their arguments. The `--fix` case above is refused outright as an auto-fix. |
| A longer declared command can be truncated at any whitespace boundary. | No shell, so a truncated line is still one program with an argument list, and it is still asserted against `commandRefusal` again in the moment before the spawn. |

What a prefix cannot do is invent a command out of nothing, which is the check's
actual purpose and the thing #19 demonstrated live: the pass put `node` in front
of a filename that `HANDOFF.md` mentions only in prose, and the gate refused it.
Token bounding still stops `npm run test` being carved out of `npm run
test:unit`, because `:` is inside `safeCharacter`.

### What this increment changed

Documentation only. `README.md`'s safeguard section now states the settled
answers where it previously said the questions were open, and states the prefix
limitation where it previously implied the check was exact. The increments table
above records `V2b` as complete.

### Validation

All thirteen controlled suites pass and `git diff --check` is clean. They are
unchanged, because no behaviour is. `scripts/smoke-reviewer-tools.mjs` was not
run and did not need to be: `read-only.mjs` is untouched.

**No installed-plugin review was run for this increment by default.** `AGENTS.md`
makes the review the user's call for a documentation-only pull request, because
it costs real credits. Whether one ran is recorded in the pull-request entry
below.

**The live evidence gaps `V2a` recorded stay open.** Execution has never run
under the installed plugin: an `accept` carrying a non-empty selection, a real
spawn, a real capture, a real artifact line and a real cancellation are
demonstrated only by the controlled suites, and no exclusion rule has ever
refused a real discovered command. Settling `V2b` without code means there is no
review here to fold them into. They close in `D1`, whose own review is already
required and can run with `--verify`; the next-increment section below says
exactly how. Until then, do not mistake the suites for delivery evidence.

## Completed increment: A1

**`A1` makes this file readable by the tool it documents.** It is the only
increment whose subject is the repository's own paperwork, and it exists because
that paperwork had become a functional defect rather than an untidiness.

### The defect it fixes, recorded live twice

`instructionFileMaxBytes` in `extensions/pr-review/safeguards.mjs` caps one
instruction file at 65536 bytes, and `collectInstructionFiles` skips an oversized
file by name rather than truncating it, because half an instruction file is a
worse source than none. `ROADMAP.md` had reached 464771 bytes over 7489 lines, so
this project's own safeguard discovery skipped its roadmap for size. Pull request
#18's discovery pass recorded the skip and #19's recorded it again with the
figure, `ROADMAP.md` at 444530 bytes. The tool could not read its own project,
and the file saying so was the file it could not read.

### What moved, and what deliberately did not

Thirty-nine sections moved verbatim into `docs/roadmap-archive-2026-09-10.md`:
thirty-one completed-increment entries covering the twenty-nine increments from
`F1` to `V1c`, and eight sections of working record kept between them. The
pointer left in their place names all of it. Nothing was rewritten, condensed or
corrected, and the move was checked rather than trusted: the extracted range and
the archive's body hash to the same SHA-256.

Three things stayed, as the increment required: the increments table, which is
the index; the two most recent completed entries, `V2a` and `V2b`, so the closing
state of `V2` reads without following a pointer; and the "Exact next increment"
section, which is what a fresh session acts on.

### The archive is not at the checkout root, and that is the point

`collectInstructionFiles` reads the root's markdown and does not recurse into
subdirectories, so an archive under `docs/` leaves the discovery candidate set
altogether. A dated archive beside `ROADMAP.md` would have satisfied the letter
of the increment while replacing one oversized skipped candidate with another
413800-byte one, and discovery would still have named a file of this project it
could not read. The subdirectory turns the skip into nothing at all.

### Measured outcome

| File | Bytes | Against the 65536-byte cap |
| --- | --- | --- |
| `ROADMAP.md` before | 464771 | skipped, 7.1x over |
| `ROADMAP.md` after | 61264 | read, 4272 bytes spare |
| `docs/roadmap-archive-2026-09-10.md` | 413800 | not a candidate; discovery does not recurse |

Every root markdown file is now under the cap except `README.md` at 103636
bytes, which is `D1`'s to shorten. The root's readable files spend well under
half the 262144-byte discovery budget, so nothing is near being skipped for the
budget rather than for its own size.

### Validation

Documentation-only: nothing under `extensions/` or `scripts/` changed, so the
shipped behaviour is exactly `V2a`'s. All thirteen controlled suites were run
anyway and all thirteen pass, which is the evidence that they do not depend on
this file. `scripts/smoke-safeguards.mjs` asserts the oversize skip against a
synthetic project whose `ROADMAP.md` is `"x".repeat(instructionFileMaxBytes + 1)`,
so it tests the rule and never the real file; shrinking the real file could not
weaken it. `git diff --check` is clean and the diff carries no control byte.

The increment's own outcome was demonstrated rather than inferred, by running
this project's real `collectInstructionFiles` against this checkout. It now
reads five root files in `conventionalInstructionFiles` order, `AGENTS.md`,
`CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md` at 61264 bytes and `SCOPE.md`, and
skips exactly one, `README.md`, for exceeding the cap. **Before this increment
that skipped list held `ROADMAP.md` too.**
`docs/roadmap-archive-2026-09-10.md` appears in neither list, because
`collectInstructionFiles` does not recurse into subdirectories.

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards; do node scripts/smoke-$s.mjs; done
wc -c ROADMAP.md docs/roadmap-archive-2026-09-10.md
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

### Pull request #22 and its review

Pull request #22 carries this increment. **It was not reviewed by the installed
plugin.** `AGENTS.md` makes the review of a documentation-only pull request the
user's call rather than a requirement, because a review spends real credits; the
user was asked and authorized none. That is a recorded decision, not an omission
to correct. Nothing under `extensions/` or `scripts/` changed, so no behaviour of
the shipped tool went undemonstrated by not reviewing it.

### Remaining limitations

- **The headroom does not survive the next entry, and `L1` must archive before
  it writes one.** This file has 4272 bytes spare against the cap. The last
  six completed entries measured 7546, 12085, 14651, 15365, 15406 and 20969
  bytes, so even the smallest of them overruns what is left: this is not a risk
  to watch but an arithmetic certainty. **The increment that adds the next entry
  archives `V2a` and `V2b` first**, into the existing dated archive or a new one,
  leaving the same kind of pointer behind; that frees about 28KB. Keeping both
  `V2` halves here was this increment's own instruction, so `A1` did not pre-empt
  it, and `A1`'s entry is deliberately the smallest of the recent ones at about
  6KB. No size check enforces any of this. Run `wc -c ROADMAP.md` before opening
  a pull request, and treat 65536 as the number that matters.
- **`README.md` is still skipped for size** at 103636 bytes, so discovery still
  names one file of this project it cannot read. `D1` owns it.
- **`README.md`'s discovery example is now stale in one detail.** It uses
  `Skipped: ROADMAP.md (exceeds 65536 bytes)` to illustrate a skipped file, which
  no longer describes this checkout. The example is hypothetical throughout, so
  it states nothing false about a real run, but `D1` should replace that line.
- **The archive has no index.** Finding an older increment's evidence means
  searching it. None was added, because `D1` may want one and this increment was
  to stay mechanical.

## Exact next increment

**`V2` is closed. `V2a` shipped execution and `V2b` settled its three remaining
questions without code.** Their answers are recorded in the two completed
entries above and are not to be reopened: no reviewer receives safeguard output,
the retained record says nothing about what ran, the citation gate still accepts
a prefix, the shell gate does not accept a command a project wrote as a chain,
and no timeout of any kind bounds a running safeguard.

**`V1a`, `V1b`, `V1c`, `Q7`, `C5`, `V2a` and `V2b` are complete and merged, from
pull requests #19, #18, #17, #16, #15 and #14 and this increment's own.** Their
authorizations are spent. Nothing about any of them should be redone or widened.

### Every must-have is complete, and the port is feature-complete for v1

`SCOPE.md`'s must-have column and its costly-to-lose column are both entirely
delivered. `A1` has landed, so what is left of v1 is `L1` and `D1`, and neither
adds a capability. When both have landed, v1 is done, and the open items further
below are limitations to state in the release notes rather than work to
schedule.

**A later session should not invent an increment.** The user's direction, given
after #19 merged, is that the port had grown far past the effort its goal
justified, and that the remaining appetite belongs to finishing rather than to
building. Treat a new feature idea as out of scope unless the user asks for it.

### The next increment is `L1`, then `D1`

`A1` has landed, so two increments remain and this is their order. Take one,
land it on its own branch and pull request, and stop.

- **`L1`: resolve upstream licensing and attribution.** `SCOPE.md` records that
  `pi-pr-review` declares MIT but that no standalone licence text was found at
  the inspected revision, commit `457e18e30437984e2e6680802c9da25d270b82cc`. No
  upstream source has been reused and none should be until this is settled. The
  outcome is a recorded answer and, if attribution is owed, the text that
  discharges it. It needs no review and spends no credits.
- **`D1`: the user documentation.** Document configuration, modes, incomplete
  coverage, cancellation, publication, the cache and safeguards with
  reproducible end-to-end examples. `README.md` is 103636 bytes and is skipped
  by safeguard discovery for size, exactly as this file was until `A1`, so `D1`
  should shorten it at least as much as it extends it, and should replace the
  now-stale `ROADMAP.md` line in its discovery example. It also carries one
  recorded wording defect: the reviewer prompt in `review.mjs` tells every
  specialist its working directory is "verified to be at" the reviewed head,
  which stays true of `HEAD` after a safeguard runs but not of the working tree.
  Bound citations already contain the consequence, as the `V2b` entry sets out;
  the sentence is still wrong and `D1` is where it is cheapest to fix, because
  that pull request touches user-facing text anyway. **That fix is a change
  under `extensions/`, so `D1`'s pull request needs an installed-plugin review
  whatever else it contains. Run that review with `--verify` and approve `node
  scripts/smoke-safeguards.mjs` when the approval UI asks.** It is the last
  chance to give safeguard execution live evidence without spending a review on
  nothing else, and the reason is set out under "The live evidence `V2` did not
  produce" below.

Before "fixing" that wording into something stronger: **re-asserting checkout
cleanliness after execution is refused and must stay refused.** `SCOPE.md` says
these commands may create artifacts and forbids cleaning the checkout, so a
re-assertion would refuse a review because the person's own approved tests wrote
a coverage file. Fix the sentence, not the gate.

### The live evidence `V2` did not produce, now accepted for v1

**Execution has never run under the installed plugin.** #19's review reached the
host's approval UI and approved nothing, so `accept` with a non-empty selection,
a real spawn, a real capture, a real artifact line and a real cancellation are
all still demonstrated only by the controlled suites. **The exclusion table
recorded no live refusal either**, because the discovery pass reported only three
candidates and the one refusal came from the citation check.

Closing either gap costs a review, and `V2b` was settled without code and so
without a review to fold them into. **`D1` is where they should close, at no
extra cost.** `D1` fixes the reviewer prompt's "verified to be at" wording, and
that is a change under `extensions/`, so `AGENTS.md` already requires `D1`'s
pull request to be reviewed by the installed plugin. Run that one review with
`--verify` and approve `node scripts/smoke-safeguards.mjs` when the approval UI
asks: the suite finishes in well under a second and leaves the checkout clean,
so the artifact line should say the checkout is unchanged. That single run gives
execution its first live evidence, an `accept` carrying a non-empty selection, a
real spawn, a real capture and a real artifact line, without spending a review
on it. A live exclusion refusal still cannot be arranged, because what a
discovery pass reports is not ours to arrange.

Until `D1` runs, both remain demonstrated only by the controlled suites, and no
entry above may be read as though the installed plugin had executed anything.

### Recorded, not scheduled

These stay open and none is scheduled. Do not start one instead of `L1` or `D1`
without the user saying so.

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
- **A live approval that approves something.** #19 closed half of this: two
  discovered commands were offered, the host's elicitation UI accepted the
  schema and returned a documented action, and the answer approved nothing. An
  accepted subset, a cancel, and every part of execution downstream of them are
  still demonstrated only against the controlled harness. `D1`'s own required
  review closes this at no extra cost; see "The live evidence `V2` did not
  produce" above.
- **A live refusal from the exclusion table.** #19's discovery pass reported only
  three candidates and refused one of them by citation, so no exclusion rule has
  ever refused a real discovered command. No later review can close this
  deliberately, because what a discovery pass reports is not ours to arrange.
- `L1` remains pending; copy no upstream source.

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
`main` refuses direct pushes and merging stays the user's call. Playground pull
requests #1 and #2 must never be merged or republished.
