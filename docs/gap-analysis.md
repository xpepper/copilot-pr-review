# Gap analysis against the field, and a proposal

Increment `G1`. This compares this tool behaviourally with upstream
`pi-pr-review` and with the code-review agents and skills now in the open, on
capability and on user experience, and proposes what is worth adopting.

**It is analysis and a proposal. It is not work that has started, and nothing in
it is scheduled.** Every adoption named below is a scope decision for the user.
Several would change [SCOPE.md](../SCOPE.md), and those are marked.

**Nothing here was copied.** [docs/upstream-licensing.md](upstream-licensing.md)
records why that rule exists and that it is not specific to upstream. Every
source below was read; every behaviour worth adopting is described in this
project's own words and would be re-implemented here. No upstream or third-party
source, prompt text, configuration or documentation appears in this file or
anywhere in this repository.

## What was read

The user named five starting references and then chose the widest sweep, so the
field beyond them was searched as well. Read on 2026-09-12:

| Source | What it is | How it was read |
|---|---|---|
| `pi-pr-review` at `457e18e` (1.17.10) | The upstream baseline `SCOPE.md` pins | Repository tree, README, prompt, benchmark corpus, results and docs |
| `pi-pr-review` at `main` (1.18.1) | Upstream today, four releases later | README, to measure drift since the pinned baseline |
| `openai/codex` `.codex/skills` | Six review skills in a large real repository | All five `code-review-*` skills plus `babysit-pr` |
| `channingwalton/skills` `code-reviewer` | A read-only review skill | Complete |
| `JPeetz/agent-skills` `code-quality` | Two skills: a review skill and a five-gate framework | Both complete |
| `unclecatvn/agent-skills` `code-review` | Review practice for the agent and the person | Complete |
| Claude Code's official `code-review` plugin | The closest peer to this tool | Command and README, from the local plugin cache |
| GitHub Copilot code review | The reviewer this project already meets | Official documentation |
| CodeRabbit, Qodo, Greptile, Cursor BugBot, Graphite Diamond, PR-Agent | The hosted and open-source field | Product documentation and comparisons |
| Martian "Code Review Bench" | An independent benchmark of review agents, February 2026 | Methodology and reported results, second-hand |

The numbers attributed to hosted products below come from vendor material or
from comparisons written by vendors, and are reported as claims rather than as
measurements. The upstream benchmark numbers are different in kind: upstream
published its corpus, its scorer and its raw result bundles, and those numbers
were read out of the committed result files directly.

## The short version

**This tool is built on the axis the field is worst at, and it has never
measured itself on that axis.**

Independent 2026 benchmarking reports false-positive rates between 40 and 70
per cent among the leading review agents, and one real-world study found
developers rejecting 56.3 per cent of the comments one popular tool left. False
positives are the field's dominant complaint. This tool answers that complaint
harder than anything else read here: bound provenance, exact quotation, a
changed anchor, introduction evidence, then a separate isolated adjudication
that has to prove the whole claim. Nothing else in the field refuses a real
observation because a model normalised a markdown link out of its own quote.

That refusal is the design, and it is defensible. What is missing is the other
half of the sentence. Precision bought at unknown cost in recall is not yet a
result. Upstream publishes recall, precision, per-lens and cross-file numbers
over a seeded corpus with ground truth. This project's own README says recall is
unmeasured, and it is right.

**Upstream has converged on this project's last three increments.** After the
baseline `SCOPE.md` pins, upstream shipped incremental re-review with the same
four head relationships and the same three prior-finding verdicts that `I1a`,
`I1b` and `I1c` arrived at independently. That is worth knowing: it is
corroboration of a design that until now rested on this project's own reasoning.

**The clearest single defect the sweep found is a publication one**, and it is
described under "A reviewer can publish a secret" below.

## Where this tool stands against upstream

Upstream is a much larger program: roughly 500 KB of TypeScript across
extensions and libraries, against this project's 7054 lines of JavaScript. Size
is not the interesting comparison. These are.

### What the port preserved, and preserved well

Modes, reviewer topology, tiers, inheritance, publication authority, the draft
and closed gates and the trusted-project rule all behave as upstream behaves,
and in several places this port is stricter. Nothing below asks to change any of
it.

### What upstream has that this tool deliberately refuses

Each of these is a decision already taken and recorded, not a gap. They are
listed so that the proposal section cannot be read as reopening them.

| Upstream behaviour | This tool | Why |
|---|---|---|
| A configurable deadline for every attempt, batch, synthesis and a 15-minute invocation hard cap | No timeout of any kind | `SCOPE.md` forbids review timeouts; cancellation and several increments depend on their absence |
| A gated `APPROVE` review event, with a severity ceiling and a stale-approval setting | `COMMENT` only, always | `SCOPE.md`; the plugin's review can never satisfy a required approval, on purpose |
| Stale publication enabled by default, and a body-only fallback when anchors are invalid | Refuses to publish when the head has moved | `SCOPE.md` drops both |
| A reviewer tool allowlist the user configures, which may contain a shell | A fixed read-only subset with plugin-owned path confinement | A configurable shell in a reviewer is not a read-only reviewer |
| An experimental model pass that extracts findings from degraded output | Discards output it cannot read, and says so | `SCOPE.md` drops it; the evidence boundary is the point |
| Self-review of an in-progress coding task's own git delta | Not present | `SCOPE.md` drops coding-task self-review |
| Multiple fallback models per tier | Exactly one attempt, for the one reviewer that failed | `SCOPE.md` preserves the bounded policy |

Reading upstream's deadline machinery is a good argument for this project's
refusal of it. It is several hundred lines of interacting budgets, reserves,
grace periods and truncation rules, with its own validation ranges and its own
failure taxonomy, and it exists to answer a question this tool answers by
waiting.

### What upstream has that is genuinely missing here

**A seeded semantic benchmark with ground truth, and published numbers.** This
is the big one. Upstream pins a corpus of twelve cases by content hash, ten with
seeded defects and two clean controls. Every expected finding carries a stable
identity, a target severity and a set of allowed severities, acceptable diff
locations, the concept groups a matching report has to contain, patterns that
count as asserting the relationship, and patterns that contradict it. Matching
is deterministic and order-independent. Explicit non-findings are rejected
before matching, so a reviewer saying a thing is safe cannot score as having
found it. Recall denominators use the target severity, so reordering the allowed
severities cannot move an opportunity between severity bands.

Around that sit three things that matter as much as the corpus:

- A plan that fixes every mode-repetition-case tuple in advance, interleaves
  modes per case and rotates which mode goes first, so a provider's bad half
  hour cannot be confounded with one whole mode.
- A collector that accepts exactly one plan entry per invocation and refuses to
  rerun it, so a provider failure is a durable observation rather than an
  opportunity to try again until the number improves.
- Gates that are not embedded in the scorer. A report is `baseline_required`
  until a human reviews repeated baseline runs and writes a versioned gate file
  binding the corpus hash, the report hash, the plan, the environment and the
  scorer's own source hash.

The last point is the one this project would find most familiar. It is the same
instinct as refusing to let a review's own evidence gate be weakened to make a
run succeed.

**The numbers upstream published are also directly interesting to us**, because
they bear on a default this project inherited rather than measured. From
upstream's committed topology results, 72 runs, 24 per mode:

| Mode | P0/P1 recall | P2 recall | Cross-file recall | False-positive rate | Clean controls that produced a finding | Lane completion | p50 |
|---|---|---|---|---|---|---|---|
| balanced | 0.857 | 0.500 | 0.833 | 0.037 | 1 in 4 | 0.777 | 155 s |
| full | 0.929 | 0.833 | 0.833 | 0.194 | 4 in 4 | 0.859 | 237 s |
| deep | 0.929 | 1.000 | 0.833 | 0.000 | 0 in 4 | 0.958 | 156 s |

Read the deep row again. On that corpus the single integrated reviewer matched
the best recall in every band, produced no false positive at all, left every
clean control alone, completed the most reliably, and was no slower at the
median than the five-reviewer default. The full mode, which runs the most
reviewers, was the worst on precision by a wide margin: every clean control
drew a finding.

Upstream itself labels these diagnostic, not accepted: no baseline gate has been
adopted, the sample is small, and an earlier corpus gave balanced a better
recall number than this one does. So this is not proof. But it is a published,
reproducible result that points somewhere specific, and this project has nothing
of the kind pointing anywhere.

**A large-diff transport.** Above a size threshold upstream stops embedding the
diff and instead hands reviewers a bounded changed-file manifest plus enforced
read access to the complete captured diff, with a capped read plan and a
fail-closed rule beyond it. Reviewer count never multiplies. This tool has no
large-diff path at all, and its citations are limited to the captured diff and
context windows, which is exactly what produced a coverage gap on pull request
#32: a reviewer could read an unchanged file from the checkout and still could
not cite it.

**A live reviewer viewer**, with per-pass focus, scrolling, sanitised and
byte-capped output, and no ability to steer the reviewer it is watching.
`SCOPE.md` defers this deliberately, so it is a known deferral rather than an
oversight. It is worth recording that upstream's is read-only by construction,
which is the shape this project would want.

**Telemetry and a cost story.** Upstream records timing per attempt and
publishes latency targets and percentiles. This tool prints neither cost nor
duration, which `E1` recorded and nothing has scheduled.

**A revalidation-only run.** When an earlier review's head has not moved,
upstream skips the reviewer passes entirely and revalidates the prior findings
as they stand. This tool has every piece needed for that and does not do it.

### Where upstream converged on this project

Upstream shipped incremental re-review after the pinned baseline. It classifies
the prior head against the current one into the same four relationships this
project named, uses the same rule that only a review carrying the tool's own
marker and the authenticated identity counts, and revalidates prior findings
into the same three verdicts: resolved, still open, obsolete. Two independent
implementations reaching the same vocabulary is the strongest evidence either
has that the vocabulary is right.

The differences are choices rather than gaps, and this project's are mostly the
more conservative:

- Upstream adds a prior-findings section to the published review body. `I1c`
  decided the opposite, deliberately: an answer belongs on the thread that asked
  the question. Threads are the better user experience, and they cost more
  requests, which `I1c` recorded and the user accepted.
- Upstream lets a still-open prior finding re-enter the findings list as a
  normal finding, and lets an unresolved blocking one keep blocking. This tool
  answers it on its thread and does not resurface it.
- Upstream's revalidation happens inside the model validation step. This tool
  splits it: every review reports the verdicts code can prove and spends nothing
  on them, and `--revalidate` buys one model pass over what is left. Nothing is
  ever proved resolved without reading the code. That asymmetry is this
  project's and is worth keeping.
- Upstream bounds discovery at 200 prior findings. This tool paginates without a
  cap and only bounds what it displays.

## Where this tool stands against the rest of the field

The five references the user named, plus the closest peer and the hosted
products, converge on a small number of behaviours this tool does not have.

### Every serious reviewer in the field reads the project's own standards

Claude Code's plugin collects the repository's `CLAUDE.md` files, gives two of
its five reviewers the job of auditing the change against them, and requires a
finding raised on that basis to quote the instruction it relies on. GitHub
Copilot reads `AGENTS.md`, its own instructions file, and path-scoped
instruction files, and takes them from the head branch rather than the base.
CodeRabbit points at whatever standards file a project already has and adds
path-scoped instructions by glob. Qodo mines recurring patterns out of a team's
own pull-request history and turns them into enforced rules.

**This tool reads its checkout's instruction files and hands them to nobody.**
Safeguard discovery under `--verify` collects the root markdown files, and the
code that does it says in as many words that it hands nothing to any reviewer.
No reviewer is ever told what this project's conventions are. That is the
single largest capability gap the sweep found.

It is also a scope question rather than a bug. A convention finding is a
different kind of claim from a defect finding: the evidence for it is a sentence
in a document, not a provable effect in code, and this tool's entire validation
apparatus is built for the second kind. Adopting this means deciding what
evidence a convention finding must carry.

### The field's lenses are not this tool's four specialists

This tool runs correctness, contracts, security and performance-resources, plus
a light overview, and those are fixed. The field does three other things.

**Lenses that read history rather than the diff.** Claude Code's plugin devotes
three of its five reviewers to history and convention: the git blame and history
of the modified code, the comments left on previous pull requests that touched
these same files, and the code comments in the modified files. The second of
those is the most striking idea in the sweep. A reviewer comment on last
quarter's pull request against the same file is cheap to fetch, is written by a
person who knew the code, and frequently applies again. This tool reads none of
it.

**Lenses the repository owns.** The Codex skills make the reviewer set a
property of the repository: an orchestrator fans out one subagent per sibling
review skill, so adding a lens is adding a file. The lenses themselves are house
rules, not universal ones, and they are specific in a way a universal specialist
cannot be: named integration surfaces that must not break, a change-size ceiling
with a request to propose the smallest coherent stage to land first, invariants
about what may enter the model's context, and where tests must live.

**Lenses that fire on what the diff touched.** The five-gate framework runs its
code gate always, its test gate when test files changed, its docs gate when
documentation changed, its infrastructure gate when workflow files, Dockerfiles
or infrastructure-as-code changed, and calls out findings that cross two gates.
This tool runs the same reviewers whatever the pull request contains. A
documentation-only pull request gets a security reviewer; a pull request that
rewrites a CI workflow gets no reviewer that knows what a dangerous workflow
trigger looks like.

Two lens ideas from that framework deserve separate mention because of what
they target. One is a set of failure modes specific to code an AI wrote:
swallowed exceptions, invented APIs, a mock fallback reported as success,
abstraction added before it was needed, documentation written from memory rather
than from the source, and tests that assert the implementation instead of the
behaviour. That is an increasingly large share of what any reviewer now reads.
The other is documentation-against-code drift, which this project hits
repeatedly in its own work: the handoff instructs every session to grep the
roadmap and README for claims its own change has made false, and the last
session's run of that check found four.

### The field demands a reproduction, or a fix, or both

The read-only review skill requires every critical finding to carry a concrete
reproduction: a failing test, a snippet, or a step-by-step trace with specific
input values, and says to downgrade or drop a finding that cannot be proved.
The quality skill requires every blocking or major finding to carry a concrete,
actionable fix. PR-Agent and Copilot emit committable suggestion blocks.

This tool requires neither, and one of the two is deliberate: a rewrite
suggestion is explicitly excluded from what a candidate may be. A finding
carries a title, when it triggers, what was expected, what happens instead, how
this diff introduced it, a confidence and the reviewers that reported it. That
is a good structure, and a reader who wants to act on it still has to work out
what to do.

The reproduction requirement is the more interesting of the two, because this
tool already has the machinery. `--verify` runs the project's own safeguards in
the reviewed checkout under per-command approval. Nothing connects that to a
finding: `V2` settled that no reviewer receives safeguard output and the
retained record says nothing about what ran. That settlement should stand as
written, but it does leave the tool one step away from something the field asks
for and mostly does not deliver either.

### The field has a feedback channel, and this tool has none

Claude Code's plugin ends every posted review by asking for a thumbs up or down.
Qodo prioritises findings resembling ones a team has fixed and quiets ones the
team consistently dismisses. CodeRabbit accumulates suggested path instructions
out of past reviews and will hand them back on request.

This tool learns nothing from any review it has ever run. That matters twice
over: it forgoes the precision improvement, and it forgoes the cheapest source
of the ground truth its own recall gap needs. Which is exactly the insight
behind the independent benchmark described next.

### How the field measures itself, and the one honest benchmark in it

Martian's Code Review Bench, published in February 2026 and positioned as the
first genuinely independent benchmark of review agents, runs two prongs. The
offline prong runs every tool over the same small set of pull requests against a
curated gold set of known bugs. The online prong watches roughly 300,000 real
open-source pull requests and takes the ground truth from developer behaviour:
a comment that got acted on was useful, a comment that got ignored was not. It
reports precision and recall under an adjustable weighting so a reader can
decide how much precision is worth. The dataset, judge prompts and pipeline are
said to be open.

The behavioural-ground-truth idea is the transferable one, and it is cheap. A
finding this tool published that the author then fixed is a true positive with
no adjudication panel required. A finding that sat untouched until merge is
weaker evidence but is evidence. This project already retains, per review, the
findings it validated, the candidates it discarded and why, and the exact head
it evaluated. What it does not do is ever look back.

### What this tool has that the field does not

Recorded plainly, because a gap analysis that only lists gaps misleads.

- **An evidence boundary that refuses its own reviewers.** Nothing else read
  here discards a real observation because the model paraphrased its own
  quotation. The field's central complaint is noise; this is the strongest
  answer to it in the sample.
- **A separate isolated adjudication with no tools**, which must return an
  explicit whole-claim support decision, whose citations are then checked again
  by code, and which cannot repair a partly correct finding by correcting it in
  its rationale.
- **Coverage as a first-class result that outranks the findings.** Zero findings
  never claims a clean pull request, an execution failure is visible as
  incomplete coverage, and the distinction between a coverage gap and an
  informational caveat is enforced. Most of the field reports findings and says
  nothing about what it failed to look at.
- **Publication that is code-controlled end to end.** The model never selects
  the event, the repository, the commit, the API path or an anchor, the head is
  rechecked before the write, and an unknown write outcome is never retried.
- **Honest refusal.** The tool refuses rather than degrades in more places than
  anything else read here, and the project records the refusals as evidence.

Two of the hosted products are positioned near this end of the spectrum on
selectivity, one reporting roughly one comment per pull request and another
described as catching little and misfiring rarely. Neither publishes what it
misses either.

## A reviewer can publish a secret

This is the most concrete defect the sweep produced, and it is small.

The quality skill's absolute rules include never echoing a secret found during
review into any shared channel: flag the location, and show a redacted form if
anything is shown at all.

This tool has no redaction anywhere. The published inline comment carries the
reviewer's own prose in five fields, and nothing constrains what that prose
contains. The citation quotes are not published, which narrows the exposure, but
it does not close it: a security reviewer that finds a hardcoded credential on a
changed line and writes it into its "what happens instead" sentence will have
that sentence posted verbatim as a comment on a public pull request, under the
user's identity.

The probability is low and the blast radius is the maximum this tool has. The
security specialist is explicitly pointed at secrets, which is precisely the
reviewer most likely to quote one.

## The menu

Ranked by value against effort. Each entry says what it would change, what the
evidence for it is, and whether it fits `SCOPE.md` as written.

### 1. Redact credential-shaped text before publication

**Fits the scope as written.** `SCOPE.md` requires publication to be
code-controlled and safe; this is that requirement applied to the body bytes.

Code already builds the published body in one place. A deterministic redaction
over the five prose fields, applied at the same boundary, with the redaction
reported as a caveat so nothing disappears silently. It must not touch the
retained record, which is local. Small, testable without a model, and the
existing suite already covers the function that builds the body.

The risk to manage is a redaction that makes an innocent finding unreadable.
The answer is the same one the quote repair took: narrow, reported, and never
rewriting the finding's meaning.

### 2. Report what a run cost and how long it took

**Needs a small scope decision.** `SCOPE.md` defers detailed timing and usage
reports as nice-to-have. One line is not a detailed report, and `E1` recorded
that billing is collected per request and retained, then never printed, so a
person cannot tell what they spent without reading session state off disk.

Every hosted competitor prices per review. Upstream publishes latency
percentiles. This tool asks the user to authorize a spend and then never tells
them what it was. The dogfood runner already prints a credit total, which is
evidence the number is reachable.

### 3. Skip the reviewers when nothing has moved

**Fits the scope as written.** Capture already reports `same-head`. Today that
relationship narrows nothing and a full review runs again at full cost.

Upstream short-circuits this case into a revalidation-only run. This project has
every piece: the relationship, the retained prior findings, the code-provable
verdicts and the reply path. What it lacks is the decision to treat `same-head`
as a reason to spend nothing on fresh hunting.

This one is cheap and it directly saves credits on the exact case this project
hits most, which is re-reviewing its own pull request after a fix.

### 4. Let the project's own standards steer the review

**Needs a scope decision.** `SCOPE.md` says nothing about convention review, and
the only reviewer with a conventions brief is `--full`'s medium-tier one, which
judges against the surrounding codebase rather than against a written rule.

Four independent tools do this and it is the field's clearest consensus. The
hard part is not fetching the files; the tool already collects them. The hard
part is what evidence a convention finding must carry. The workable shape,
borrowing the peer's discipline rather than its implementation, is that such a
finding must quote the instruction it relies on, that the quote is checked
against the collected file the same way a source citation is checked against
bound source, and that a finding whose quoted rule cannot be found is refused.
That keeps the evidence boundary's character: the claim is checkable, and an
unverifiable one is discarded.

A decision is also needed on whether this is a new reviewer or a brief added to
an existing one, and on whether it is opt-in. Given `I1b` and `I1c` both landed
opt-in, opt-in is the consistent answer.

### 5. Measure recall and precision against a seeded corpus

**Fits the scope as written**, in that it changes no product behaviour. It is
the largest item here by effort and the one everything else depends on for
evidence.

The shape upstream demonstrated, re-implemented here, would be: a corpus of
small synthetic diffs pinned by content hash, each carrying seeded defects with
a stable identity, target and allowed severities, acceptable locations and the
concepts a matching report must contain, plus clean controls that must draw
nothing. A deterministic scorer that needs no model and no network. A plan that
fixes every mode-case pair in advance and interleaves modes. A collector that
accepts one entry at a time and refuses to rerun it. And no accepted threshold
until a human has looked at repeated baselines and written one down.

Two properties matter more than the rest for this project. The scorer and corpus
cost nothing to run, which means they belong in the existing controlled suite
and in continuous integration. The collection runs cost real credits, which
means each is an explicit authorization exactly like a pull-request review.

Done honestly this answers the question the README currently declines to answer,
and it would tell us whether the evidence boundary's refusals cost real findings.

### 6. Decide the default mode on evidence

**Needs a scope decision**, because `SCOPE.md` fixes balanced as the default.

**Blocked on item 5.** Upstream's published numbers have deep matching the best
recall with no false positives and no clean-control noise, at a median latency
no worse than balanced, while the five-reviewer default trails it on both. If
that replicates here, the default is wrong and one reviewer is both cheaper and
better than five. If it does not replicate, we will know that too.

This costs no implementation at all. It costs a measurement and a decision.

### 7. Add the history lenses

**Needs a scope decision.** `SCOPE.md` fixes the reviewer assignments per mode.

The cheapest and most distinctive is the one that reads the review comments
left on earlier pull requests touching the same files. The others are the git
history of the changed lines and the code comments in the changed files. All
three are read-only, all three are `gh` or `git` reads, and none of them needs a
new trust boundary.

The open question is whether a finding grounded in a past comment can pass this
tool's evidence boundary at all, since its supporting evidence is a person's
sentence on another pull request rather than code. That is the same question
item 4 raises, and they should be answered together.

### 8. Fire reviewers on what the diff actually touched

**Needs a scope decision**, for the same reason as item 7.

A documentation-only pull request does not need a security reviewer, and a pull
request that changes a workflow file needs one that knows about workflow
triggers, token scopes and unpinned actions. The five-gate framework's rule is
simple and mechanical: the gate fires on the paths that changed.

The saving is real and so is the risk. A rule that skips a reviewer is a rule
that can skip the reviewer that would have found the defect, and this project
reports coverage honestly enough that a skipped reviewer would have to appear as
reduced coverage rather than silently not run.

### 9. Give findings somewhere to go next

**Needs a scope decision.** `SCOPE.md` defers the finding editor, and the
candidate schema explicitly excludes rewrite suggestions.

Two separable pieces. A remediation sentence on each finding is the field norm
and is cheap. A committable suggestion block is a different thing: it is code
this tool would be proposing to write, and it sits badly with a tool whose
defining promise is that it never writes source. The first is worth considering;
the second probably is not, and saying so explicitly would be worth a line in
the README.

### 10. Anchor findings that land outside the diff

**Needs a scope decision**, and it is the deepest change here.

The primary anchor must today span at most ten lines inside a diff hunk and
include a line the diff changed. `Q5` already permits citing the unchanged code
a changed line breaks, so the tool can describe a one-file-away effect as long
as the anchor stays on the change. What it cannot do is report a defect whose
only honest location is unchanged code.

The read-only skill names that class as the one an outside reviewer keeps
finding first, and two hosted products sell whole-repository context as their
main differentiator. Against that, the anchor rule is load-bearing: it is what
keeps a review about this pull request instead of about the repository, and
`SCOPE.md` asks for exactly that. This is listed because the sweep found it, not
because it looks safe.

### 11. Handle a large diff as a large diff

**Fits the scope as written.** Nothing in `SCOPE.md` promises a size limit, and
the current behaviour is not a decision so much as an absence.

Upstream switches transport above a threshold; the quality skill has a human
triage protocol that ends by stating what was not reviewed in detail. The second
half of that is the part this project would want regardless: a review that could
not look closely at everything should say which parts it skimmed, as a coverage
gap rather than as silence.

`E1`'s single real-world review ran against 1427 changed lines over 16 files and
worked. Nothing has established where this stops working.

### 12. Ask what the review found useful

**Needs a scope decision**, and it is the smallest of the scope-touching items.

A published review could ask for a reaction, the way the closest peer does, and
a later run could read the reactions and the resolution state of its own threads.
`I1c` already reads the earlier review's threads fresh from GitHub on every run,
so the read path exists.

This is the cheap approximation of the independent benchmark's online prong, and
it is the only item here that would produce evidence about real pull requests
rather than about a synthetic corpus.

## A proposed sequence

**This is a proposal, not a plan, and nothing in it is authorized.** It is
ordered so that each stage either stands alone or unblocks the next.

**Stage one, before anything else: items 1 and 2.** Both are small, neither
changes what a review decides, and one closes a publication safety hole. They
could share a single pull request; they touch different files and both are
covered by suites that already exist. Item 2 needs a one-line scope
confirmation first.

**Stage two: item 3.** Independent of everything else, saves credits
immediately, and the only real work is deciding what a `same-head` run reports
so that skipping the reviewers never reads as coverage it did not have.

**Stage three: item 5.** The long pole, and the one that turns the rest of this
document from argument into evidence. Sliced the way `I1` was sliced: the corpus
and the deterministic scorer first, running in the existing suite and in
continuous integration at zero cost; then the plan and single-entry collector;
then one authorized collection campaign; then a human-written baseline gate.
Nothing after this stage should be scheduled before it produces numbers.

**Stage four, blocked on stage three: item 6.** A decision, not an
implementation. If deep dominates here as it does upstream, the default changes
and `SCOPE.md` changes with it.

**Stage five, and only with a scope decision on each: items 4, 7 and 8
together.** They are one question wearing three hats. All three widen what a
reviewer may consider beyond the diff and its bound source, and all three raise
the same problem of what evidence a non-code claim must carry. Answering that
once, for convention rules, past review comments and path-conditioned lenses at
the same time, is much cheaper than answering it three times and ending with
three different answers.

**Not sequenced: items 9, 10, 11 and 12.** Item 11 could be taken at any point
and probably should be taken the first time a review is run against something
substantially larger than `E1`'s. Items 9, 10 and 12 each need the user to say
whether the tool should move in that direction at all, and none of them is
blocked on anything except that.

## What this analysis did not establish

- **Nothing here was run.** No review was executed, no credit was spent, and no
  measurement of this tool was taken. Every claim about this tool's behaviour
  was read out of its source and its recorded evidence; every claim about
  another tool was read out of that tool's own material.
- **The hosted products were read, not used.** Their detection rates, comment
  volumes and false-positive rates are vendor claims or vendor-authored
  comparisons.
- **The independent benchmark was read second-hand.** Its methodology is
  reported as described; its dataset was not obtained and its results were not
  reproduced.
- **Upstream's numbers are upstream's.** They were read from its committed
  result files rather than from a vendor page, which makes them better evidence
  than anything else here, but they measure upstream on upstream's corpus.
  Nothing licenses transferring them to this tool, which is the whole argument
  for item 5.
- **No estimate of effort is given in hours.** The rankings are relative.
