# Copilot PR Review

A GitHub Copilot CLI plugin that reviews a pull request with several specialist
reviewers at once, checks every candidate finding against the reviewed revision
before showing it to you, and publishes the ones you pick as inline `COMMENT`
review comments.

It is deliberately conservative. A reviewer may read only the pull request's own
revision and a checkout proven to be at that revision. A claim that does not
quote its evidence exactly is discarded rather than shown. An empty result is
never presented as a clean pull request. Nothing is posted to GitHub without an
explicit authorization, and nothing is executed in your checkout without your
per-command approval.

This document is the user guide: what the commands do, what the output means,
and how to reproduce each behaviour yourself.

- [SCOPE.md](SCOPE.md) is the authoritative product specification.
- [ROADMAP.md](ROADMAP.md) records what has been demonstrated, with evidence.
- [AGENTS.md](AGENTS.md) is the workflow this repository is developed under.
- [docs/safeguards.md](docs/safeguards.md) is the full `--verify` guide, which
  this one summarises.
- [docs/gap-analysis.md](docs/gap-analysis.md) compares this tool with upstream
  and with the rest of the field, and proposes what is worth adopting. Six of
  its twelve proposals are scheduled in [ROADMAP.md](ROADMAP.md), six are not,
  and its own ranking and sequence did not survive that triage.
- [docs/readme-archive-2026-09-10.md](docs/readme-archive-2026-09-10.md) is the
  previous README, kept verbatim. Look there for a harness probe invocation this
  guide no longer prints, or for how a capability read when its increment landed.

## Contents

| Section | What it covers |
| --- | --- |
| [Install](#install) | Getting the plugin into your CLI |
| [Your first review](#your-first-review) | One worked run, start to finish |
| [Revalidating findings](#revalidating-the-earlier-reviews-findings) | `--revalidate`: what became of the last review's findings |
| [Review modes](#review-modes) | Quick, balanced, full, deep, and what each costs |
| [Models and configuration](#models-and-configuration) | Tiers, precedence, fallbacks, project trust |
| [Reading the result](#reading-the-result) | Findings, the evidence boundary, coverage |
| [Selecting findings](#selecting-findings) | The selection step and `--all` |
| [Publishing](#publishing) | Posting authority, gates, uncertain writes |
| [Publishing later](#publishing-later) | The retained result and `/pr-review publish` |
| [Unattended runs](#unattended-runs-with---unattended) | `--unattended`: a run with nobody to answer it |
| [Cancelling a run](#cancelling-a-run) | `/pr-review cancel`, and why there is no timeout |
| [Project safeguards](#project-safeguards-with---verify) | `--verify`: preflight, discovery, approval, execution, and the [full guide](docs/safeguards.md) |
| [Command reference](#command-reference) | Every command, flag and configuration key |
| [What this tool will not do](#what-this-tool-will-not-do) | Deliberate limits |
| [Verify it yourself](#verify-it-yourself) | Suites and probes you can run |
| [Limits and known gaps](#limits-and-known-gaps) | What is demonstrated and what is not |

## Install

You need Copilot CLI 1.0.83 or compatible, Node.js 22 or newer, and an
authenticated `gh`. Reviews use models from your Copilot subscription; no
external provider credentials are involved and none are supported.

```sh
copilot plugin install "$(pwd)"
copilot plugin list
copilot --experimental
```

Wait for plugin loading to finish, then check the plugin answers:

```text
/pr-review status
/pr-review help
/pr-review models
```

`status`, `help` and `models` start no reviewers and spend nothing. `models`
lists what your subscription actually offers, which is where to start before
configuring anything.

Reinstall after editing the plugin and start a fresh session: installed plugins
are cached, so an old copy keeps running otherwise. During development you can
skip installing with `copilot --experimental --plugin-dir .`, and remove an
installed copy with `copilot plugin uninstall copilot-pr-review`.

CLI 1.0.83 warns that direct local installs are deprecated for a future release.
There is no marketplace packaging yet.

## Your first review

Reviewers read your checkout as well as the captured diff, so the checkout has
to be the revision under review. Check the pull request out first:

```sh
gh pr checkout 123
```

Then, in a Copilot session started from that directory:

```text
/pr-review 123 --no-comment
```

That is a balanced review, the default, with posting suppressed. It spends
credits. What you see, in order:

1. **The effective configuration**, then the per-reviewer assignments: every
   reviewer, its tier, its model, its reasoning effort, and where each value
   came from. This prints before any reviewer starts, so an unusable assignment
   refuses the review instead of quietly substituting something else.
2. **The target capture**, a `Q1 target:` line naming repository, pull request,
   lifecycle, base and head SHAs, diff size and a SHA-256 of the diff.
3. **The bound source context**, a `Q2 context:` line naming each changed file,
   the side fetched, blob identities and window ranges.
4. **Any earlier review of ours**, an `I1 prior:` line naming the head it
   evaluated and how the reviewed head relates to it, then an `I1c revalidation:`
   line saying what became of the findings it published.
5. **The revision gate**, which refuses the review unless this checkout is the
   reviewed head.
6. **Per-reviewer progress**: starting, active, completed or failed.
7. **Adjudication**, one isolated session that tries to disprove each candidate.
8. **The findings**, then the selection step, then the publication step.

**Most of that output is evidence, not findings.** On a substantial code diff a
single reviewer's raw untrusted output can fill the screen by itself, and a
terminal truncates the long JSON evidence lines at the window edge. Add
`--quiet` when you are reading a review rather than recording its evidence;
nothing about coverage, refusals, failures, safeguards or publication is
suppressed at any verbosity.

To see the target without spending anything, add `--capture-only`:

```text
/pr-review 123 --capture-only
```

That stops at the bound snapshot. It starts no reviewer, spends no inference and
takes no mode, posting, selection or model argument.

### The revision gate

Before any reviewer starts, every review requires all of:

- the working directory is inside a git checkout with a resolvable `HEAD`;
- local `HEAD` equals the captured pull request head;
- the pull request head has not moved since capture;
- no tracked file is modified or staged.

Untracked files warn but do not refuse, unless you also passed `--verify`.

A refused review reports `coverage: "not-started"` and `disposition:
"refused"`, starts no reviewer and no runtime, spends nothing, and tells you to
run `gh pr checkout NUMBER` (and to commit or stash a dirty tree). There is no
override flag and no diff-only fallback. A reviewer reading a different revision
would produce citations that do not describe the reviewed code, so this refusal
is the point rather than an inconvenience.

Nothing is ever repaired automatically. The gate does not switch branches, pull,
stash or clean.

### What is skipped without asking

Drafts are skipped unless you pass `--include-drafts`. Obvious bot authors (a
GitHub `Bot` type or a `[bot]` login) are skipped. A change proved empty by its
own metadata is skipped; a small diff, a documentation filename or a title
claiming a typo is not proof and is not skipped.

Closed and merged pull requests need confirmation, or `--include-closed` /
`--review-closed`. If your host has no confirmation UI, the run reports
`confirmation-required` and does nothing until you pass the override explicitly.
No diff is fetched while a confirmation is pending.

`captured`, `skipped` and `declined` are not review results, and none of them
claims a clean pull request.

### What an earlier review of the same pull request evaluated

Capture ends by reporting whether this tool has already reviewed this pull
request, and how the head you are about to review relates to the head that
earlier review saw. It reads GitHub only, spends no credits, and `--capture-only`
reports it too.

A review counts only when your authenticated GitHub identity submitted it **and**
it carries the review body this tool builds: one of four mode labels, a count of
selected validated findings, a stated coverage, and the closing claim sentence.
An ordinary hand-written review matches none of that and is counted as
considered rather than treated as a prior one. A body deliberately written to
imitate all four parts would still be taken for ours.

| Reported | Meaning |
| --- | --- |
| `none` | No earlier review of ours. The line says how many submitted reviews were considered |
| `same-head` | The reviewed head is exactly the head that review evaluated |
| `incremental` | Commits were added after it, and the reviewed head still descends from it |
| `diverged` | The reviewed head does not descend from it, including a head rewound behind it |
| `unknown` | GitHub could no longer reach that head, so the relationship was not measured |

Each inline comment of that review is retained with its body exactly as posted
and its anchor normalised to a fixed shape: path, side, the current line, and the
line it was written at, which GitHub keeps after an anchor falls out of the
current diff. Every other field GitHub returns is dropped.

Two things act on this. **Revalidating that review's findings happens in every
review**, for the verdicts that cost nothing, and is the section after next;
`--revalidate` buys the rest. **Confining fresh hunting happens only when you ask
for it**, with `--incremental`, in the section below. Discovery failure is
reported as itself and never refuses a review.

### Confining a re-review to the new commits

Pass `--incremental` to confine fresh hunting to the commits added since the
earlier review, so a re-review stops reporting hunks that review already
covered:

```text
/pr-review 123 --deep --no-comment --incremental
```

It is a request rather than a parse-time contract, and it is the only flag that
is: whether a forward commit range exists at all is a fact about the pull
request, and nothing knows it until capture has run. When capture reports the
relationship as `incremental`, those commits are read and their head-side line
ranges become the confined scope. On any other relationship, on a pull request
this tool has never reviewed, when the range cannot be read, or when those
commits change no file, the run narrows nothing and says which of those it was.

**Confinement is a filter over the captured binding, never a replacement for
it.** The captured base-to-head diff, the context windows, the provenance checks
and every citation rule reach the reviewers exactly as they do in any other run,
and a finding still has to anchor inside a hunk of that captured diff, because
publication would refuse anything else. What the flag changes is only what may
be reported: the reviewers are given the confined head-side line ranges and
every path those commits touched on either side, and are asked to anchor there,
and code sets aside any candidate anchored outside them, before adjudication, so
a candidate an earlier turn covered is not paid to be judged again.

A candidate set aside is **reported with its location rather than dropped**, and
is never adjudicated, so it is neither a validated finding nor a refuted one:

```text
1 candidate(s) set aside as already covered by the earlier review: each anchors outside the
commit range this run confined fresh hunting to, and none of them was adjudicated, so none is
a validated finding and none is refuted:
correctness:2: [P2] Free shipping now applies to small orders at shipping.js:3-3 (head)
```

One thing the range cannot settle is a base-side anchor, which names the
captured base revision that comparison never saw. A base-side candidate in a
file those commits did touch therefore stays in scope, and the reviewers are
told which paths those are, because **a file the new commits deleted has no
head-side line at all** and a base-side anchor is the only one such a defect can
have. The filter removes only what it can prove an earlier turn already
covered.

**A confined review does not cover the whole pull request**, and says so in the
run and in the published review body. It says it as an informational caveat
rather than as incomplete coverage, because nothing failed and `INCOMPLETE` has
to keep meaning that something did. What the run did not hunt was covered by the
earlier review, whose own coverage this run does not read and does not vouch
for.

That is why the flag is opt-in and narrowing is not the default. Two cases
decided it. A re-review in a heavier mode than the earlier one would otherwise
silently never reach the hunks that lighter mode only skimmed. And the earlier
review's own coverage cannot be read: the body signature requires a coverage
sentence and deliberately never reads what it says, because that prose is the
part most likely to change between versions of this tool.

### Revalidating the earlier review's findings

Every review that finds an earlier review of the same pull request reports what
became of the findings that review published. It reads the comments discovery
already retained, spends nothing, and settles only what it can prove:

| Verdict | Proved by |
| --- | --- |
| still open | The commits added since that review do not touch the lines the comment anchors on |
| still open | The reviewed head is exactly the head that review evaluated, so nothing has changed |
| obsolete | GitHub can no longer place the comment in the current diff |
| obsolete | Those commits deleted the file the comment anchors in |
| not settled | Anything else, including a file those commits renamed |

The asymmetry is deliberate: code proves that a finding still stands and never
that it has gone away. **Nothing is ever proved resolved without reading the
code**, because absence of evidence that a defect remains is not evidence that
somebody fixed it, and a wrongly resolved finding is one nobody looks at again.

Pass `--revalidate` to buy one model pass over exactly what is left:

```text
/pr-review 123 --deep --no-comment --revalidate
```

That pass reads the checkout the revision gate has already proved is the
reviewed head, and returns resolved, still open or obsolete for each finding it
was asked about. It is never asked about a verdict the code proved and can never
overturn one. A verdict for a finding it was not asked about, a word that is not
one of the three, and silence about a finding are each ignored rather than
trusted, and a pass that fails settles nothing and loses nothing.

Like discovery and confinement, **revalidation grounds nothing a finding depends
on**, so a failed pass is reported as itself and never becomes the review's
coverage. It reports no new finding. A comment this tool cannot read back into a
finding is named and counted rather than guessed at.

### Answering the threads that review left

A settled verdict is posted as a reply on the thread the earlier review's
comment started:

```text
Revalidated at head 4f2c9b1...: STILL OPEN.

The commits added since that review do not touch the lines this comment anchors on.

Decided by this tool, from the commit range.

This is a revalidation of a finding an earlier review by this tool published. It is not a
re-review of this pull request.
```

Replies carry **the review's own posting authority and no other**. `--no-comment`
suppresses them exactly as it suppresses the review, `--comment` and
`autoPostReviews` authorize them, a confirmed review proposal covers them, and a
declined one refuses them and is never re-asked. What they do not need is a
review: a re-review that selects no finding and has three earlier findings to
answer is the case this exists for. **When there was no review proposal to
confirm, the replies ask for themselves**, because nothing else had the chance
to. An unsettled verdict is never posted, because replying that this tool could
not tell is noise.

A thread already carrying this run's answer **at this head** is skipped rather
than answered twice. A thread answered at an older head is answered again,
because that answer was about a different revision.

**This is the only write in this tool that is more than one request**, and the
one place where partial completion is an ordinary result rather than an error.
Each reply is journalled before it is sent. A reply GitHub definitely refuses
does not stop the others, because it is known not to have been written. **An
unknown outcome stops the set**: every thread after it is deliberately left
unattempted rather than becoming a second unknown, the run says so, and the
retained record says which thread it was. Do not retry it; inspect the pull
request and reconcile the record first.

`/pr-review publish` deliberately answers no thread. A verdict about the current
code was grounded in a read of the checkout at the reviewed head, and that
command never reads a checkout.

## Review modes

Mode flags are mutually exclusive. Balanced is the default, so a bare pull
request number runs a balanced review and spends credits.

| Mode | Reviewers | Findings presented |
| --- | --- | --- |
| `--quick` (alias `--major-only`) | Three heavy specialists: correctness, contracts, combined security/performance/resources | P0-P2 only |
| `--balanced` (default) | Four heavy specialists: correctness, contracts, security, performance/resources; plus one light overview reviewer | P0-P2, plus at most three P3/nit findings |
| `--full` | The balanced five, plus one medium conventions/maintainability reviewer | Every qualifying severity, no minor cap |
| `--deep` | One integrated heavy reviewer over the whole change | Every substantiated severity, no minor cap |

Every mode adjudicates the same way, in an isolated heavy-tier session with no
tools that tries to disprove each candidate against the captured evidence. It is
not a specialist and does not change a mode's reviewer topology. **That session
starts only when at least one candidate survives the evidence boundary**, so a
review whose every candidate was refused costs nothing for adjudication and
reports no adjudicator.

**Deep is holistic, not bigger.** It is not a larger parallel review and not a
higher reasoning effort. One reviewer holds correctness, contracts, security,
performance, resource lifetime and whole-change coherence at once, so it also
sees consequences that appear only when the changed files are taken together. It
runs the fewest sessions of any mode on the same diff.

**The light overview reviewer** in balanced and full looks at whole-change
coherence: oversights, missed call sites, misleading names, and small defects on
the changed lines. It is the reviewer that most often catches what four
specialists each considered out of their lane.

**The medium conventions reviewer** in full judges naming, structure, error
handling, tests and documentation of the changed code against the surrounding
codebase.

Minor findings, in every mode that presents them, must still anchor on a line
this diff changed and must pass exactly the same evidence checks as a P0.

```text
/pr-review 123 --quick --no-comment
/pr-review 123 --balanced --no-comment
/pr-review 123 --full --no-comment
/pr-review 123 --deep --no-comment
```

### What a review costs

Reviews spend Copilot credits, and the cost is dominated by diff size and
reviewer count, not by the mode's name. These are real reported figures, all on
`gpt-5.6-terra` at `high` effort unless noted. All but one are this project's own
pull requests; the 16-file deep review is of somebody else's JavaScript, 1427
changed lines of it:

| Run | Reported AI credits |
| --- | --- |
| Deep, one reviewer, small diff (#8) | 68.27393 |
| Balanced, 4 files (#4) | 79.82605 |
| Deep, one reviewer, 16 files of real code | 81.48022 |
| Balanced, 7 files (#14) | 110.736851 |
| Balanced, 5 files, documentation-heavy (#23) | 137.46398 |
| Balanced with `--verify`, 12 files (#19) | 252.771985 |
| Balanced, 27 files (#3) | 414.14627 |

Two practical consequences. **Documentation-heavy pull requests are expensive**,
because prose diffs are large. And **if you leave the light tier unset it
inherits your heavy tier**, so a balanced review runs its "light" overview
reviewer on your heavy model at heavy effort. Configuring a genuinely light
model for that tier is the single biggest saving available.

A third consequence, measured on that deep review of real code: **adjudication
is a fixed cost, not a per-finding one.** It re-reads the whole diff and the
whole bound context, so judging a single candidate cost 29.6565 of those
81.48022 credits, in one request. A large diff pays that once any candidate
survives the evidence boundary, however few survive. A review where none
survives starts no adjudicator and pays nothing for one.

Missing charges mean unknown cost, not zero.

## Models and configuration

```text
/pr-review-config
/pr-review-config show
/pr-review-config help
```

Text commands only. There is no interactive configuration menu and no finding
editor.

### The three tiers

Reviewers resolve one of three tiers rather than naming models individually:

- **heavy**: every specialist, deep's integrated reviewer, and the adjudicator;
- **light**: balanced's and full's overview reviewer;
- **medium**: full's conventions reviewer.

Keys are `lightModel`, `lightEffort`, `mediumModel`, `mediumEffort`,
`heavyModel`, `heavyEffort`, the six optional fallback keys described below, and
`autoPostReviews`.

A worked example, starting from what your subscription actually offers:

```text
/pr-review models
/pr-review-config lightModel=gemini-3.8-flash lightEffort=low
/pr-review-config mediumModel=claude-sonnet-5 mediumEffort=medium
/pr-review-config heavyModel=gpt-5.6-terra heavyEffort=high
/pr-review-config show
```

`show` prints the file location, the stored settings, the ambient session
assignment, the effective assignment for every tier with the origin of each
value, and the effective `autoPostReviews`. Every review prints the same report
with invocation flags applied, followed by its per-reviewer assignments, before
any reviewer starts.

Every assignment in one invocation applies together or not at all. Unknown keys,
malformed arguments, empty values and unsupported models or efforts are explicit
errors that write nothing. A model must be available and enabled in your
subscription, and an effort must be supported by the model the tier actually
resolves to. **An invalid explicit value is refused, never replaced by a
different model or a lower effort.** Because clearing one half of a tier can
leave the other half unusable, clear a tier's model and effort together:

```text
/pr-review-config unset heavyModel heavyEffort
```

### Which setting wins

Precedence is per key, highest first:

1. invocation flags (`heavyModel=`, `heavyEffort=`, `--comment`, `--no-comment`);
2. an explicitly trusted project's `.copilot/pr-review/config.json`;
3. your personal configuration;
4. the ambient session's model and reasoning effort.

Tier inheritance then runs over the merged result: an unset tier field takes the
nearest configured tier, preferring the heavier tier when two are equidistant.
Model and effort resolve independently. So with only a heavy tier configured, an
unset medium tier inherits heavy, and so does light.

Every report names the origin of each value: `flag`, `project:heavy`,
`project-inherited:light`, `configured:heavy`, `inherited:light`, `ambient`,
`unset`, or `model` when the resolved model supports no configurable effort.

Only the heavy tier has invocation flags. Set light, medium and the fallbacks
with `/pr-review-config`. An invocation never rewrites the personal file, the
trust record or a project file.

Personal configuration lives at
`<copilot-config-home>/pr-review/config.json`, beside the CLI's own
`session-state` directory, so it is never inside a reviewed checkout. It is a
versioned record, `{"schemaVersion": 1, "settings": {...}}`, written atomically
with mode `0600`. Malformed JSON, an unsupported schema version, an unknown
stored key or a wrongly typed value is an explicit error that refuses both
inspection and review. Nothing is rewritten or repaired for you.

### Fallback models

```text
/pr-review-config heavyFallbackModel=claude-sonnet-5 heavyFallbackEffort=high
/pr-review-config show
/pr-review-config unset heavyFallbackModel heavyFallbackEffort
```

Each tier may carry one optional fallback assignment. It buys **one extra
attempt, for the one reviewer whose own execution failed**, and nothing else.
The review is never restarted, no other reviewer is affected, and a reviewer
that has used its fallback gets no further attempt.

**Elapsed time never triggers a fallback.** This tool imposes no review timeout
at all, so a reviewer that hangs waits indefinitely and is never replaced. Only
an explicit failure is eligible: a session error, a shutdown before completion,
no usable output, an attempted forbidden tool call, reported usage that did not
match the assignment, or output this tool could not read at all. Cancelling is
not a failure and starts nothing.

An invalid explicit setting is not eligible either. A model your subscription
cannot use still refuses the review before anything starts, exactly as it does
without a fallback configured.

Fallbacks start unset and **never inherit from another tier**: an unset
`heavyFallbackModel` means the heavy tier has no fallback, not that light's
stands in. An unset `<tier>FallbackEffort` follows that tier's own effective
effort and is validated like any other explicit assignment. It cannot be set
without its model, because alone it configures nothing. A fallback that resolves
to exactly the tier's own model *and* effort is not a fallback and is never
attempted; `show` marks it `NOT OFFERED`.

Nothing about a fallback is hidden. `show` prints a `fallback:` line for every
tier, the pre-execution report names it beside each reviewer that has one, the
timeline says which reviewer fell back and why, the coverage report carries a
caveat naming both assignments and the primary failure, and the retained record
keeps the failed attempt beside the one that produced the result. A recovered
reviewer reports completed coverage; a fallback that also fails leaves the
reviewer incomplete with both failures recorded.

### Models with no configurable reasoning effort

Not every subscription model takes a reasoning effort. `/pr-review models`
prints `reasoning=(not configurable)` for those that do not.

A tier whose resolved model is one of those takes **no** effort. It does not
inherit the effort a neighbouring tier, a trusted project or the session would
otherwise supply, because that effort is not one the model can hold. Reports
print `reasoning=(not configurable) [model]`, so the origin says the model
decided it. The same rule covers a tier's fallback model.

An effort you set yourself is still validated and still refused:
`lightEffort=low` on such a model is an error that changes nothing. Unset it
instead.

This is what makes the cheapest models usable for the light tier, which is the
tier balanced and full run their overview reviewer on.

### Trusting a project's settings

```text
/pr-review-config trust
/pr-review-config untrust
/pr-review-config untrust /absolute/path/to/a/checkout
```

A repository may carry `.copilot/pr-review/config.json`, a record of the same
shape as the personal file, carrying the same keys and no others. It is read
**only** when your personal store holds an explicit trust record for that exact
working directory. Without one the file is located but never parsed, never
merged, and reported as ignored in every configuration report and before every
review. **A repository can never trust itself**: a `trustedProjects` key or any
extra top-level field in a project file is a validation error, not a grant.

Trust records the canonical absolute path of the session's working directory in
`<copilot-config-home>/pr-review/trusted-projects.json`. It proves that you
trusted that exact directory on this machine. It does not prove which
repository, remote, branch or file contents are there now: a different checkout
later placed at the same path inherits the trust, and moving or renaming the
directory silently drops it. `untrust` accepts an absolute path so a deleted
directory can still be revoked.

Trust is deliberately not taken from the CLI's own folder-trust list, which is
granted for ordinary CLI use and would otherwise let a folder trusted for
another purpose silently change your review models and posting authority.

**Trusting a repository lets its file set `autoPostReviews=true`**, which can
publish an `--all` run unattended. Nothing else is delegated. A project file
cannot enable safeguards, cannot add a key that would, and cannot bypass any
publication gate.

A malformed or unusable trusted project file is an explicit error that merges
nothing and refuses both the review and any personal configuration update.
`show` still reports it, so the failure is diagnosable, and `untrust` still
works, so a repository cannot lock you out of revoking its own trust.

## Reading the result

Reviewers return structured candidates. Candidates are not findings. Between the
two sits a boundary that discards far more than it keeps, on purpose.

### The evidence boundary

A candidate must carry numeric confidence between 0.8 and 1, a severity the
mode's policy admits, and citations that survive these checks:

- **Bound provenance.** Every cited path, side and line range must belong to the
  captured revisions. Source is fetched from GitHub for the reviewed head and
  base, never read from your checkout.
- **Exact quotation.** Quoted text must match the fetched source exactly. This
  is the check that most often discards a real observation, because a model that
  paraphrases or normalises what it quotes loses its evidence.
- **A changed anchor.** The primary location must span at most ten lines inside
  a diff hunk and must include a line this diff actually added or removed, not
  merely nearby unchanged code.
- **Introduction evidence.** Before and after evidence must describe that
  location's own hunk. Either side may be null, which is itself a claim the
  adjudicator then has to settle.

A candidate may additionally cite **the code its changed line breaks**, which
may be unchanged code, code in another hunk, or code in another changed file.
That citation is bound, in-window and exactly quoted like any other, and it is a
claim the adjudicator must prove, never evidence that the claim holds.

One narrow repair exists. A quotation clipped at its end can be restored to the
exact full lines it is a contiguous span of, at candidate ingestion only. It
must still cover every named line and carry non-whitespace text on its first and
last lines. No inserted characters, interior edits, omitted whole lines, range
expansion or searching elsewhere. Each repair is reported as a caveat carrying
the original and restored text, and the candidate's own prose is never rewritten.

Then one **separate isolated adjudication session**, on the heavy tier with no
tools at all, tries to disprove each surviving candidate against the diff and
bound source. Acceptance needs an explicit `allClaimsSupported: true` plus
citations that code checks again. A partly correct candidate is rejected: a
correction in the adjudicator's rationale does not repair the finding text.

**The exact checks are deterministic; the causal judgement is not.** A matching
quotation is not proof of a defect, and a second model's agreement is not an
executable reproduction. No pull request code is run as part of a review, and
this is not formal verification.

### Deduplication

Two reports merge only after an explicit same-root-cause, same-trigger,
same-impact decision backed by shared bound evidence of the cause. Sharing a
file or a location merges nothing by itself. The strongest accepted
severity and confidence is displayed, with the original reports and reviewer
attribution retained. Different causal evidence is left unresolved rather than
silently merged.

### Coverage, and why zero findings is not a clean review

Every result reports coverage, and it is the part worth reading first.

| Coverage | Meaning |
| --- | --- |
| `completed` | Every reviewer ran and produced usable output, and validation finished |
| `incomplete` | At least one reviewer failed, or a substantive coverage gap was reported |
| `not-started` | Skipped, declined, unconfirmed, or refused by the revision gate |

Diagnostics distinguish three kinds of limitation. **Execution failures**,
including output this tool could not read, and **substantive coverage gaps**
both make a result incomplete. **Informational caveats** do not. A coverage gap
must say which assessment it blocks; a caveat carries no impact. Not
independently auditing a dependency is a caveat unless missing evidence blocks a
specific assessment of this diff.

A reviewer that finished its turn but delivered nothing usable counts as a
failed attempt, reports incomplete coverage, and takes its tier's fallback if
one is configured. That check stops at the outer response object and never
reaches the review's judgement about your pull request. None of these is a
failure and none is retried: a candidate the evidence boundary refuses, an
output reporting no candidate at all, an output whose every candidate is
refused, a repaired quotation, or a candidate the adjudicator rejects on the
merits. Retrying those would spend a second model on manufacturing a finding.

**Empty findings never claim a clean pull request**, and neither does completed
coverage. This project's own pull request #23 is the clearest example: all six
sessions completed, every candidate was discarded at the exact-quote gate
because the reviewers had quoted markdown with its link syntax stripped, and the
result was zero validated findings on incomplete coverage. Six real observations
existed inside those discarded candidates. Read the rejections.

### Withheld minor findings

Balanced presents at most three P3/nit findings. Accepted minor findings beyond
that limit are **withheld**, not dropped: they are listed in the result and in
the retained record, outside selection and publication. Full and deep have no
minor cap, so nothing is withheld and `capped` stays empty.

### Quieter output with `--quiet`

A review prints a great deal, and most of it is not the findings. `--quiet` asks
for the same review with less of it printed:

| Left out by `--quiet` | Why it is the verbose part |
| --- | --- |
| `Q1 target:` and `Q2 context:` | JSON dumps of the captured pull request and the bound source windows |
| The mode's `binding:` line | The same binding again, as JSON |
| Each reviewer's raw untrusted output | The single largest thing a run prints, once per reviewer |
| The adjudicator's raw output | The same, for the validation pass |
| The settled `evidence:` line, `P1` and `P2` | JSON dumps repeating most of the above |

Everything that decides whether a result can be trusted stays, at every
verbosity: the effective assignments, per-reviewer progress, every refusal and
every failure with its error, the coverage report and its diagnostics, the
sentences saying a result is not a clean-review claim, the safeguard discovery,
approval and execution summaries, the findings themselves, and every publication
outcome including an uncertain write. **A quiet run is still impossible to
mistake for a clean review.** A skipped or refused target still says which
disposition it took and why.

**Verbose is the default**, and a run without the flag prints exactly what it
printed before. The flag changes presentation and nothing else: the same review
settles the same way, and the retained record still holds every reviewer's own
output whether or not it was printed, so `/pr-review inspect` and
`/pr-review publish` are unaffected.

`--quiet` authorizes nothing and opens no gate, and it is deliberately **not a
configuration key**: it is asked for one run at a time, so no saved or trusted
project setting can make a run quieter than the person running it expects. It
cannot be combined with `--capture-only`, whose entire output is the evidence
`--quiet` would suppress. `scripts/dogfood-review.mjs` refuses it outright,
because this project reads its own increment evidence out of those lines.

## Selecting findings

The plugin stops its owned inference runtime before asking anything, so nothing
is spending credits while it waits for you.

Without `--all`, a host elicitation form lists each finding's severity, title,
location and side, and confidence. Nothing is preselected. You can select a
subset, accept with no choices (or decline) to select none, or cancel the run.
The reviewed head and the coverage status stay visible, because an incomplete
run can still have useful findings. An empty result skips the form.

```text
/pr-review 123 --balanced --no-comment --all
```

`--all` selects every validated finding without a form. It never selects raw or
rejected candidates or duplicate aliases, and it **does not authorize posting**.
A host with no elicitation support reports selection `unavailable` and selects
nothing, even with `--comment`. Rerunning with `--all` is an explicit new
review, not a hidden select-all fallback. If you know in advance that nobody
will be there, say so with [`--unattended`](#unattended-runs-with---unattended)
and the run is refused before it costs anything.

Answers are bound to a unique invocation, the originating session, repository,
pull request and reviewed head, plus the full review-binding digest. Unknown,
duplicate, malformed or stale values fail closed instead of selecting something
else. Selection rereads no GitHub state, executes no pull request code and
reruns no reviewer.

There is no selection timeout. `/pr-review cancel` stays available while the
form is pending, and no other review can start in that session until selection
ends. A host dialog may outlive a cancelled run, but a late answer cannot revive
it.

Selection success and coverage are separate: `complete` describes review
coverage, never selection or posting.

## Publishing

The only GitHub review event this tool emits is `COMMENT`. Never `APPROVE`,
never `REQUEST_CHANGES`, whatever a finding's severity says.

Posting authority is recorded separately from selection:

```text
/pr-review 123 --all --comment      # selects everything and authorizes: can publish unattended
/pr-review 123 --comment            # authorizes, but still asks which findings
/pr-review 123 --all                # selects everything, then asks for final confirmation
/pr-review 123 --all --no-comment   # shows the payload, publishes nothing
```

Without a posting flag, the effective `autoPostReviews` applies. It defaults to
false, which means the displayed proposal needs your explicit confirmation, and
the confirmation form defaults to false. Set it with
`/pr-review-config autoPostReviews=true`; there is no invocation syntax for the
key itself. `--comment --no-comment` is rejected before capture or inference.

**No posting flag and no saved posting setting ever approves a project
safeguard.**

The payload is built by code, not by a model: the reviewed `commit_id`, the
literal `event: "COMMENT"`, a concise coverage summary, and inline comments from
the canonical selected findings only. Each comment keeps severity, trigger,
expected and actual behaviour, introduction and reviewer attribution. Head and
base anchors use `RIGHT` and `LEFT`; multi-line ranges carry `start_line` and
`start_side`; a renamed file's base citation maps to the current diff path and a
deleted file keeps its old path. Every current finding requires an inline
location, and an invalid anchor is refused rather than silently converted into a
body-only comment.

Immediately before dispatch, code rereads the repository identity, the pull
request identity, head and base revisions, lifecycle and the full diff, then
checks metadata once more. A changed head, base or diff, an invalid anchor or
metadata drift stops publication with no POST. Requests pin the originating
host, repository, pull request and working directory, so a later change of
session directory cannot retarget them.

Drafts cannot publish even with `--include-drafts`, and closed or merged pull
requests cannot receive an inline payload even with `--include-closed`. Those
flags authorize review capture only.

### When a write's outcome is unknown

A write-ahead journal distinguishes `not-attempted`, `in-flight`, `succeeded`,
`failed` and `uncertain`. Only a validated `COMMENTED` acknowledgment tied to
the reviewed commit is success, and it carries the GitHub review URL. An
explicit rejection such as HTTP 403 or 422 is definite failure. Transport loss,
interrupted writes, server errors and mismatched acknowledgments stay
**uncertain**, and an `in-flight` record found after a process died is uncertain
too, not evidence that nothing was published.

**No write is ever retried automatically.** Unresolved uncertainty blocks
another review in that session from erasing the record. Inspect GitHub before
any manual recovery. There is no reconciliation command.

These fresh checks are not an atomic compare-and-submit transaction. A remote
head change can race the final read and the POST. The explicit `commit_id`
prevents comments being rebound to another head, but cannot stop GitHub
accepting a review that becomes outdated in that interval.

## Publishing later

```text
/pr-review inspect
/pr-review publish
```

Each local session retains **one latest result**. `inspect` displays it: the
findings, the canonical selection and its disposition, reviewer coverage and
errors, and the repository, pull request and reviewed head. It performs no
inference, no GitHub request, no current-head refresh and no local source read,
and it always refers to the originating repository even if the session directory
has changed since. It takes no target or session argument and is not a
cross-session archive.

`publish` publishes that retained selection without rerunning any reviewer,
validator or model. Invoking it **is** the new explicit authorization, so it can
post immediately. A previous `--no-comment` run can be published this way, and
conversely the original run's `--comment`, configuration or confirmation
authorizes nothing here. Retained authority is history, not permission.

Retention holds findings, selection and the binding, but not the captured
evidence, so publish-later refetches the repository identity, pull request
metadata, the complete diff and both reviewed source revisions, and rebuilds the
payload from that. Blob identity, diff fingerprint, context digest, quotations
and anchors must all still match the retained binding. Reconstructing the
request from the record alone is never accepted as proof. Every publication gate
reruns. There is no stale, body-only or partial fallback.

Publication is refused without contacting GitHub when there is no retained
result, or it is unfinished, cancelled, unselected, from another session,
malformed, or written by a schema older than the posting-authority record. It is
also refused for a result that already published successfully, or whose previous
write is `in-flight` or `uncertain`. A definite failure such as HTTP 422 may be
published again through a new invocation that reruns every gate. A refused
attempt leaves the retained record byte-identical.

The record lives in the CLI's own session-state directory as
`pr-review-result.json`, never in your checkout. Raw candidate and adjudicator
output and duplicate candidate bodies are excluded; validated findings keep
their quotations, provenance, attribution, deduplication identity and full
binding. The full diff and context text are not stored. A versioned schema and a
digest detect malformed records, cross-session bindings and stale selections.
That digest is a corruption check, **not authentication against someone who can
rewrite your session files.**

Extension reload preserves the result. Same-session cold resume was demonstrated
after a real parent conversation turn. Command-only SDK sessions in CLI 1.0.83
have no resumable event history, so resuming one reports `Session not found`
even though the retained file survives; the plugin does not manufacture history
or spend credits to work around that. A forked or new session cannot inspect
another session's result.

## Unattended runs with `--unattended`

A headless environment, a CI pipeline or an autonomous loop has nobody to answer
a question. Such a run already works. A host with no elicitation support reports
`unavailable` for each decision the invocation did not already settle, and an
invocation that settled all of them runs straight through: `--all --comment`
selects every validated finding and authorizes the post, so a run with both
publishes on a host that could not have asked anything. Safeguard approval is
the exception and stays `unavailable` whatever the posting flags say. The
trouble is *when* a run finds out. One that could never have finished alone
still pays for its reviewers first and reports the problem afterwards.

`--unattended` says up front that this run leaves nothing for anybody to answer.
It is checked before the target is captured and before a single credit is spent:

```text
/pr-review 123 --deep --all --no-comment --unattended
```

| Refused | Why |
| --- | --- |
| Without `--all` | Finding selection is a question, and `--all` is the only thing that settles it without a person |
| Without `--comment` or `--no-comment` | What a run may publish belongs in the invocation, not in a saved setting |
| With `--verify` | A safeguard command is approved by the question an unattended run cannot ask, and deliberately by nothing else |
| With `--capture-only` | Capture takes no review flag at all |

A closed or merged pull request is not confirmed either. An unattended run is
never offered that question, even on a host that could ask it, so it stops at
capture unless `--include-closed` or `--review-closed` was given.

**The flag authorizes nothing and relaxes nothing.** `--all` still authorizes no
posting, every publication gate still runs against the current head, reviewer
reads stay confined to the verified checkout, and no safeguard ever runs. It is
not a configuration key, so no saved or trusted project setting can turn it on.
Adding it to a run that already had everything it needed changes that run in one
way only: a closed pull request is refused instead of asked about.

## Cancelling a run

```text
/pr-review cancel
```

Cancellation stops the owned review work and its runtime, and it works even when
the runtime cannot acknowledge the abort. It stays available throughout: during
capture, during reviewer execution, while a selection or confirmation form is
pending, and while a safeguard command is running, in which case the command and
every process it started are killed, because a test runner's workers must not
outlive the review that started them.

**There is no timeout anywhere in this tool.** No review deadline, no
stuck-reviewer heuristic, no bound on a running safeguard. A quiet timeline is
not a hang, and a run waiting on an unanswered question waits indefinitely by
design. Only you end a running review. This is a deliberate scope decision, not
an omission: elapsed time is never evidence that a reviewer failed, so making it
one would let a slow model masquerade as a broken one and spend a fallback on it.

What cancellation guarantees depends on when it lands. Before dispatch it clears
the selection, revokes authority and preserves findings with incomplete
coverage. After dispatch it records the request without erasing historical
selection, authority or a confirmed or uncertain outcome: **cancellation cannot
undo a remote write**. Another review or inspection is refused until the run
settles.

## Project safeguards with `--verify`

Ordinary review is read-only. `--verify` opts into running your project's
existing safeguards, such as its tests, its compiler or its linter, so that you
have evidence beside the review rather than reading alone.

```text
/pr-review 123 --verify --no-comment
/pr-review 123 --deep --verify --all --no-comment
```

There are four steps. A stricter preflight adds the head branch and an untracked
path to the revision gate. Discovery reads the markdown files at the root of
your checkout and reports the commands they declare, and only those. You are
asked per command which of them may run. An approved command then runs in this
checkout, before any reviewer starts.

**Approval comes from that question and from nowhere else.** No flag, no
personal setting and no trusted project file approves anything, and `--comment`,
`--all` and a saved `autoPostReviews=true` grant posting authority and no
approval whatsoever. There is no shell anywhere in the path, so a line carrying
an `&&` chain, a pipe, a redirect or a glob is refused rather than run. **A
safeguard grounds no finding**: no reviewer ever receives its output, so a
failing suite is reported loudly to you and leaves the review's own coverage
exactly as it was.

`--verify` is orthogonal to the mode and posting flags. It cannot be combined
with `--capture-only`, which stops before any reviewer. **It is deliberately not
a configuration key**: no saved personal setting and no trusted project file can
turn verification on, which keeps the decision to run a repository's own
commands an explicit one made at the invocation.

**[docs/safeguards.md](docs/safeguards.md) is the full guide.** It documents
each of the four steps with the output it prints, the rules that refuse a
discovered command, the citation check that ties a command to the file it is
attributed to, and what a safeguard deliberately cannot do. It sits under
`docs/` because this README has to stay under the 65536 bytes this tool's own
discovery reads, and discovery does not recurse into a subdirectory.


## Command reference

### `/pr-review`

| Invocation | Effect |
| --- | --- |
| `/pr-review` or `/pr-review status` | Capability summary. No models, no background work |
| `/pr-review help` | Usage information |
| `/pr-review models` | Subscription models and their supported reasoning efforts |
| `/pr-review NUMBER [flags]` | Capture, bind, review. Spends credits |
| `/pr-review NUMBER --capture-only` | Capture and bind, then stop |
| `/pr-review inspect` | Show this session's retained result |
| `/pr-review publish` | Publish the retained selection under a new authorization |
| `/pr-review cancel` | Cancel active work and stop its owned runtime |
| `/pr-review fixture ...` | Two-reviewer bundled fixture experiment. Spends credits |
| `/pr-review adversarial ...` | Forbidden-tool and prompt-injection probes. Spends credits |
| `/pr-review failure ...` | Failure injection in the first active reviewer. Spends credits |

Review flags:

| Flag | Effect |
| --- | --- |
| `--balanced` | Four heavy specialists plus a light overview reviewer. The default |
| `--quick`, `--major-only` | Three heavy specialists, P0-P2 only |
| `--full` | Balanced plus a medium conventions reviewer, no minor cap |
| `--deep` | One integrated heavy reviewer over the whole change |
| `--verify` | Stricter preflight, then safeguard discovery, approval and execution |
| `--quiet` | Leave out the evidence JSON and the raw reviewer output. Suppresses nothing about coverage, refusals, failures, safeguards or publication |
| `--all` | Select every validated finding. Does not authorize posting |
| `--comment` | Authorize posting without final confirmation |
| `--no-comment` | Suppress posting for this run. Conflicts with `--comment` |
| `--include-drafts` | Review a draft. Never permits publishing one |
| `--include-closed`, `--review-closed` | Review a closed or merged pull request |
| `--unattended` | Declare that nothing is left for a person to answer. Refuses at parse time without `--all` and one of `--comment`/`--no-comment`, and refuses `--verify`. Authorizes nothing |
| `--incremental` | Confine fresh hunting to the commits added since an earlier review of this pull request by this tool. A request, not a parse-time contract: a run with no forward commit range narrows nothing and says so. Authorizes nothing |
| `--revalidate` | Buy one model pass over the earlier review's findings this tool cannot settle for free. Every review already reports the verdicts it can prove. A settled verdict is answered on the earlier review's thread under the review's own posting authority. Authorizes nothing |
| `--capture-only` | Stop after capture. Takes no mode, posting or model argument |
| `heavyModel=ID`, `heavyEffort=LEVEL` | Override the heavy tier for this invocation only |

The three fixture experiments take `model1=ID effort1=LEVEL model2=ID
effort2=LEVEL`, all four required, no substitution. They read only the bundled
`extensions/pr-review/fixtures/checkout.js` and never your pull request code.

### `/pr-review-config`

| Invocation | Effect |
| --- | --- |
| `/pr-review-config` or `show` | File location, stored settings, ambient and effective assignments with origins |
| `/pr-review-config key=value ...` | Set keys. All or nothing |
| `/pr-review-config unset key ...` | Clear keys |
| `/pr-review-config trust` | Trust this working directory's project file |
| `/pr-review-config untrust [PATH]` | Revoke trust, optionally for a path you have deleted |
| `/pr-review-config help` | Usage information |

Keys: `lightModel`, `lightEffort`, `mediumModel`, `mediumEffort`, `heavyModel`,
`heavyEffort`, `lightFallbackModel`, `lightFallbackEffort`,
`mediumFallbackModel`, `mediumFallbackEffort`, `heavyFallbackModel`,
`heavyFallbackEffort`, `autoPostReviews`.

Configuration starts no inference, makes no GitHub request, and is refused while
a review or publication holds the session's active-work slot.

## What this tool will not do

These are decisions, not gaps waiting to be filled:

- **No review timeout, deadline or stuck-reviewer heuristic**, and no bound on a
  running safeguard.
- **No `APPROVE` or `REQUEST_CHANGES` review event**, whatever a finding's
  severity says. The plugin's review can therefore never satisfy a required
  approval.
- **No branch switching, source writing, committing or pushing** as part of a
  review, and no automatic repair of a refused gate.
- **No shell for safeguards**, and no inventing a safeguard script your project
  does not declare.
- **No automatic retry of a write whose outcome is unknown.**
- **No cross-session review archive.** One retained result per local session.
- **No external model providers** and no cross-provider failover. Subscription
  models only.
- **No stale publication** and no body-only fallback when an anchor is invalid.
- **No finding editor** and no interactive configuration menu.

Reviewer confinement is **model capability isolation, not an operating system
sandbox**: a granted read tool is constrained by plugin-owned path checks.
Safeguard execution is not confined at all, which is why it needs your per
command approval.

## Verify it yourself

Fifteen controlled suites cover the shipped logic with test doubles. They need
no network, no inference and no runtime connection, and each finishes in well
under a second:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental; do node scripts/smoke-$s.mjs; done
```

They cover PR capture and its gates, revision-bound context assembly, all four
reviewer topologies, tier and fallback resolution, the evidence boundary and
citation refusals, deduplication, degraded coverage, selection, retention and
its schemas, the publication payload and its journal, publish-later, the
configuration and trust rules, prior-review discovery and its head
classification, the confinement of a re-review to the new commits, and the
safeguard path end to end.

Their limits matter as much as their coverage. Their semantic accept and reject
decisions are explicit test doubles, not live-model evidence, and their `gh` is
a fixture, not GitHub.

To exercise the **installed** plugin without spending inference:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets
```

Derive the SDK path rather than pinning it. Old packages under `~/.copilot/pkg/`
are never pruned, so a pinned path keeps resolving after an update and silently
drives a stale SDK against a newer CLI. `copilot --version` is the only reliable
source of the running version.

The archived README lists every other probe variant, including the live-target,
selection, retention, preview, publication and publish-later harnesses and the
inference-spending ones. See
[docs/readme-archive-2026-09-10.md](docs/readme-archive-2026-09-10.md).

To see which of your own files safeguard discovery can read, run the real
collector against your checkout. No network, no inference:

```sh
node --input-type=module -e '
import { collectInstructionFiles } from "./extensions/pr-review/safeguards.mjs";
const { files, skipped } = collectInstructionFiles(process.cwd());
console.log("read:", files.map((f) => `${f.name} ${f.bytes}`).join(", "));
console.log("skipped:", skipped.map((s) => `${s.name} (${s.reason})`).join(", ") || "none");
'
```

### The real integration test

Every probe above uses test doubles somewhere. Only reviewing a real pull
request through the installed plugin exercises the whole thing: the real
runtime, real models, real `gh` requests, the real revision gate, real confined
reads and a real charge.

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version \
  | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --all --no-comment --unattended
```

**Check out before installing, never the other way round.** `copilot plugin
install` copies the working tree into the plugin cache, so installing first
installs whatever was checked out at the time. The revision gate only checks the
*checkout*, so a stale installed copy would still be reviewed and reported as a
passing integration test.

The runner dispatches the command through the SDK's command RPC. `copilot -p
"/pr-review NUMBER"` is **not** a substitute: prompt mode starts an ambient
model turn instead of dispatching the command. Arguments after the number are
passed through, so name a mode when you want one.

The runner refuses to start unless local `HEAD` is the pull request head with no
tracked file modified, and it refuses `--comment`, so it can never publish. It
registers no elicitation handler either, so it answers every permission request
with a denial and can never approve a safeguard. **A `--verify` review that
should actually run something has to be typed in an interactive session.**

## Limits and known gaps

Recorded honestly, because the difference between demonstrated and assumed is
the point of this project:

- **The evidence boundary discards real observations.** A reviewer that
  paraphrases its quote loses the finding. On documentation-heavy pull requests
  this is common: reviewers normalise markdown link syntax out of a quote and
  every candidate is refused. Read the discarded candidates.
- **A live fallback attempt has never run.** The demotion path and the single
  attempt are demonstrated by the controlled suites and by a live reviewer
  failure that had no fallback configured to take.
- **No exclusion rule has ever refused a real discovered command.** The
  exclusion table is demonstrated only against the controlled suites, because
  what a discovery pass reports is not something a run can arrange.
- **Recall is unmeasured.** One review has run against a substantial code diff,
  1427 changed lines over 16 files, and its single finding was real. That is
  precision. What a review misses needs a defect corpus with agreed ground
  truth, which this project does not have.
- **No revalidation has run live.** Every verdict this tool reports about an
  earlier finding, and every reply it would post to a thread, rests on fixture
  coverage alone. Closing this needs a pull request this tool has published a
  review on and that has since moved, the same live evidence `--incremental`
  is still waiting for.
- **No confined run has been watched end to end.** `--incremental` narrows only
  where capture reports `incremental`, and no live run has ever reported that
  relationship: the only two reviews this tool has published are on playground
  pull requests still at the head they evaluated. The suites cover every branch
  of the path; live evidence covers none of it.
- **Structured runtime output is unusable on CLI 1.0.83.** Reviewers are asked
  for a marked envelope and code unwraps exactly that marker pair plus one fence
  wrapping the whole response. A missing or repeated marker, a marker sharing
  its line, prose after a fence, two fenced blocks or a truncated object each
  discard the whole output.
- **Cold resume of command-only sessions is unsupported** by CLI 1.0.83.
- **A run never reports what it cost.** Billing is collected per request and
  retained in the evidence, and nothing prints it.
- **A finding's text is published unredacted.** Nothing in this tool redacts
  anything. A reviewer's own prose is posted verbatim, so a reviewer that finds
  a credential on a changed line and writes it into its explanation publishes it
  to the pull request. The quoted source citations are not published, which
  narrows this without closing it. Weigh it before authorizing posting on a
  repository whose diffs can carry secrets.
- **No reviewer is told your project's conventions.** `--verify` reads your
  instruction files to discover safeguard commands and hands them to no reviewer,
  so a review judges your change against the code around it and never against
  what you wrote down.
- **Copilot CLI only.** Plugin-format support elsewhere does not establish
  equivalent execution, and no other client is demonstrated.

## Licence, credit, and how this project is developed

This project is MIT licensed. See [LICENSE](LICENSE).

It is an independent reimplementation for the Copilot CLI of the review workflow
of [`pi-pr-review`](https://github.com/10ego/pi-pr-review), studied at version
1.17.10. **No upstream source, prompt text or documentation has been copied**,
and a line-level audit against the published upstream package measures that
rather than asserting it. Upstream declares MIT and publishes no licence text
and no copyright notice, so nothing may be copied from it as it stands. The
answer, its evidence and the reuse rule are in
[docs/upstream-licensing.md](docs/upstream-licensing.md).

Development happens on branches. Every increment lands through a pull request
that is reviewed with this plugin before it merges, and `main` is protected by a
repository ruleset that requires it with no bypass. That review is each
increment's real integration test, and its outcome, cost and findings are
recorded in [ROADMAP.md](ROADMAP.md). [AGENTS.md](AGENTS.md) records the
workflow for humans and agents alike.
