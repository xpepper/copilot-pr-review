# README archive, 2026-09-10

**This is the previous `README.md`, kept verbatim.** `D1` replaced it with a
task-organised user guide, and moved this copy here for three reasons: it was
103903 bytes, which is over the 65536-byte cap this project's own safeguard
discovery applies to one instruction file, so the tool could not read the
README of the project it documents; it was organised by increment ID rather
than by what a reader wants to do; and it carried the full catalogue of harness
probe invocations, which is reference material rather than documentation.

Nothing below was rewritten, condensed or corrected, so it still reads exactly
as the session that last edited it left it, stale sentences included. Two are
worth naming, because they are why the rewrite happened rather than defects to
fix here: the verification section says "**Nothing is executed yet**", which
`V2a` made false, and the runtime boundary says the prototype "cannot execute
project safeguards", which `V2a` made false too. The live `README.md` states
the current behaviour.

**Its links do not resolve from this directory, and that is the cost of keeping
it verbatim.** The body was written to sit at the repository root, so a link
below that names `SCOPE.md`, `ROADMAP.md`, `AGENTS.md` or `docs/`-prefixed file
means that path **relative to the repository root**, one level up from here.
Rewriting those targets would have made the copy no longer identical to the file
it was cut from, and that identity is what makes this an archive rather than a
retelling, so the targets were left alone and named here instead.

Read this file for a harness probe invocation the live README no longer prints,
or for how a capability was described when its increment landed. The evidence
of record for any increment is [ROADMAP.md](../ROADMAP.md) and
[roadmap-archive-2026-09-10.md](roadmap-archive-2026-09-10.md), not this file.
This archive is under `docs/` deliberately: safeguard discovery reads the
checkout root and does not recurse, so a file here is not a candidate it must
skip for size.

---

# Copilot PR Review

An original Copilot CLI plugin prototype. **Balanced (the default), full and
quick reviews include grounded candidate validation, deduplication, finding selection,
posting-authority controls, code-controlled COMMENT publication, and session-bound
retention with uncertain-write protection. A retained selection can also be published later by
an explicit command, without rerunning reviewers. Personal model tiers, optional
per-tier fallback models and `autoPostReviews` are inspected and updated with
`/pr-review-config`.**
[SCOPE.md](SCOPE.md) is the authoritative product specification;
[ROADMAP.md](ROADMAP.md) records delivery status and runtime evidence.

Development happens on branches: every increment lands through a pull request
that is reviewed with this plugin before it merges, and `main` is protected by a
repository ruleset that requires it. [AGENTS.md](AGENTS.md) records that
workflow for humans and agents alike.

## Install and invoke

From this checkout:

```sh
copilot plugin install "$(pwd)"
copilot plugin list
copilot --experimental
```

Wait for plugin/extension loading to finish, then enter:

```text
/pr-review
/pr-review status
/pr-review help
/pr-review models
/pr-review inspect
/pr-review publish
/pr-review-config
```

These commands are implemented in JavaScript by a plugin-shipped extension, not
a model prompt. Status/help make no model calls. `models` queries the session's
available subscription models and reasoning capabilities without inference.
One extension registers both `/pr-review` and `/pr-review-config`.

Reviewer startup uses the installed `copilot` executable from an absolute
directory on `PATH`; no npm SDK/platform-package installation is required.
An explicit `COPILOT_CLI_PATH` takes precedence and must point to a usable CLI
file (a JavaScript CLI entrypoint is also supported). An invalid override is
an error, not permission to choose a different executable. Empty and relative
`PATH` entries are ignored to avoid implicitly executing a checkout-local file.
Reinstall after plugin edits and start a fresh Copilot session before retrying.

The no-inference startup regression can be reproduced with:

```sh
node scripts/smoke-cli-runtime.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs --targets --startup
```

Adjust the SDK path to your installed version. The harness uses the explicit
CLI path only for its launcher; it removes `COPILOT_CLI_PATH` from the runtime
environment inherited by the installed plugin. It dispatches a skipped quick
review and separately starts, pings and stops the real owned-runtime transport
using the plugin's resolver, without sending a model prompt.

### Read-only PR target capture (Q1)

```text
/pr-review 123 --capture-only
/pr-review 123 --capture-only --include-drafts
/pr-review 123 --capture-only --include-closed
```

A PR number captures the GitHub repository owning the **current session
directory**, PR metadata, base/head SHAs, and diff through `gh`. Capture never
changes branches, reads local source as PR evidence, or posts anything.

`--capture-only` stops there: it starts no reviewer, spends no inference, and
takes no mode, posting, selection or model argument. **Without it, a PR number
runs a review**, balanced by default, and spends Copilot credits. Capture-only
is a diagnostic path of this prototype, not an upstream mode.

Drafts are skipped unless `--include-drafts` is supplied. Obvious bot accounts
(GitHub `Bot` type or a `[bot]` login) are skipped. The conservative trivial
gate accepts only metadata proving an empty change; small diffs, documentation
filenames, and titles claiming a typo are not proof of correctness.
Closed/merged PRs require confirmation, or `--include-closed` /
`--review-closed`. If the host has no confirmation UI, the command reports
`confirmation-required` and requires an explicit override on a new invocation.
No diff is fetched while confirmation is pending; a changed target invalidates
approval instead of silently applying it to the new target.

Successful capture creates an invocation-local snapshot. The `Q1 target:` line
reports repository/PR identity, lifecycle, base/head SHAs, diff byte count, and
SHA-256. The complete diff and PR-controlled prose are not dumped into the
parent conversation. The snapshot is not retained across commands; only a
settled review result is retained for publish-later. `captured`, `skipped`, and `declined` are
**not review results**, and none claims a clean review.

Repository identity is resolved with `gh repo view` from the session directory,
ignoring `GH_REPO` and Git directory/worktree overrides; subsequent API GETs
pin the resolved host/repository/PR. Capture checks metadata before and after
the diff and verifies file counts, hunk completeness, and added/deleted line
counts. Authentication, unavailable PRs, changing metadata, inconsistent diff
responses, and responses exceeding the 32 MiB subprocess buffer fail explicitly.
There is no silent truncation or automatic capture retry. These checks are not
a GitHub transactional snapshot guarantee. `gh` must already be authenticated. The CLI
filters sensitive extension environment variables; local stored `gh`
authentication was demonstrated, not token-only environment forwarding.

### Revision-bound source context (Q2)

A successful capture immediately binds surrounding source to the captured
revisions and reports a `Q2 context:` line. Context is fetched only through
`gh` GET requests for `repos/OWNER/NAME/contents/PATH?ref=SHA`, where the ref
is always the captured head or base SHA. The local checkout supplies nothing:
its branch, its `HEAD`, and its uncommitted edits at the same paths are never
review evidence, even when they contain the same file names.

Each fetched file must arrive as a base64 `file` at the requested path, with a
size matching the delivered bytes and a `sha` equal to the Git blob hash
recomputed locally from those bytes. When the captured diff records blob
identities in its `index` line, the fetched blob must match them. The reviewed
lines of every hunk must then appear verbatim at the diff's line numbers in the
fetched revision. Any unavailable, oversized, non-UTF-8, mismatched, or shifted
source stops the command explicitly. Nothing falls back to another revision.

The head side is fetched for every surviving changed file; the base side is
added wherever the change removed lines, so deleted and rewritten code keeps
its own provenance. Files without textual hunks, including binary changes and
mode-only changes, are reported with a reason and no source. Context windows
are the hunk ranges widened by 40 lines, clamped to the fetched revision and
merged where they overlap.

The reported summary carries provenance only: repository, head/base SHAs, per
file path, status, side, blob SHA, byte and line counts, window ranges, and a
SHA-256 of the assembled context. Source text stays out of the parent
conversation. Inside the assembled context, every line is prefixed with its
line number under a provenance header. This aids legibility, not prompt-injection
isolation. Context lives only inside the invocation; it is not cached.
Reviewers consume it when a review is explicitly requested.

### Three quick PR specialists (Q3)

```text
/pr-review 123 --quick --no-comment
/pr-review 123 --major-only --no-comment
/pr-review 123 --quick --no-comment --all
/pr-review 123 --quick --no-comment heavyModel=claude-sonnet-5 heavyEffort=high
/pr-review cancel
```

These commands spend Copilot subscription credits. Quick mode runs exactly three
heavy specialists concurrently: correctness, contracts, and combined
security/performance/resources. The example model is not a default. All three
use the same heavy-tier assignment. Unset `heavyModel` and `heavyEffort`
independently fall back to the saved personal configuration described below, and
then to the current parent session's model and reasoning effort.
Explicit settings and inherited assignments
must be available and compatible; an unsupported effort is an error, never
silently lowered when changing models. An unset ambient effort uses the owned
runtime's resolved default. Effective settings are displayed before prompts
and checked against actual usage. The parent model is unchanged.

`--quick` and `--major-only` are the same mode; mode flags are mutually
exclusive. The existing draft/closed overrides still apply to reviewing, not
inline publication. Every mode accepts `--comment`, `--no-comment`, or neither;
the posting flags conflict. Authorized selections can publish, as described
below. `--verify` opts into a stricter preflight, described under its own
heading below; it executes nothing. Personal and
explicitly trusted project configuration are applied; fallback models are not.

Dispatch returns after acceptance so cancellation remains available during capture
or reviewer execution. Capture/skip/error messages, assignments, progress, and
candidate outputs follow in the timeline. The `Q3 binding:` line identifies the
captured repository, PR, head/base SHAs, diff/context fingerprints, and allowed
paths with source provenance. Each independent reviewer receives the captured
diff and numbered context as untrusted JSON data, with code-owned system
instructions to ignore embedded requests.

Reviewers additionally get `view`, `grep` (exposed as `rg` by GPT-family
sessions), and `glob`, confined to the
local checkout, so they can read unchanged callers, callees, and tests that the
captured diff and context windows do not include. That access requires the
checkout to be exactly the reviewed revision. Before any reviewer starts, the
run re-reads the PR head and inspects the checkout, and it refuses unless all of
the following hold:

- the working directory is inside a git checkout with a resolvable `HEAD`;
- local `HEAD` equals the captured PR head;
- the PR head has not moved since capture;
- no tracked file is modified or staged.

Untracked files are reported as a warning, not a refusal. A `--verify` run adds
two more conditions to this same gate, described under "The verification
preflight" below. There is no override
flag and no degraded diff-only fallback: a refused review reports
`coverage: "not-started"`, `disposition: "refused"`, starts no reviewer session
and no owned runtime, and tells you to run `gh pr checkout NUMBER` (and, for a
dirty tree, to commit or stash). Refusal is deliberate — a reviewer reading a
different revision would produce citations that do not describe the reviewed
code.

The read grant is per reviewer session and confined by a permission handler that
resolves real paths and denies anything outside the verified checkout root; a
pre-tool-use hook denies every other tool, and no other tool is even offered.
Paths are resolved with the operating system resolver, so the path the handler
approves is the file the read tool then opens. Node's own `fs.realpathSync`
collapses `..` textually before it resolves symlinks, which let a checkout
containing a symlink to a directory, plus a decoy of the same relative name
inside the root, have a read approved for one path and performed on another
outside it. The checkout is the pull request head, so a pull request could
supply both halves.
The Q4 adjudicator keeps zero tools and decides only on captured evidence, so
every published citation still resolves against the captured revision. Branch
switching, source writes, GitHub mutations, and safeguards remain unavailable to
reviewers. Publication is a separate code-controlled step.

### An absent path is refused as absent (Q7)

A reviewer that asks for a path which does not exist inside the checkout is
still refused, and still reads nothing, but it is now told which refusal it
got. It used to receive the same silent rejection as an attempt to read outside
the checkout, so a reviewer that guessed at a plausible module name could not
tell that the file was simply absent, and had no reason to look for the right
path. The refusal names the requested path relative to the root and points at
`glob` and `grep`.

That reason is given only for a request that would have been inside the root
had it existed: an absolute path lexically under the root whose nearest
existing ancestor still resolves inside it. Everything else keeps exactly the
refusal it had before, message included, because telling a reviewer that a path
outside the root does not exist would report on the host filesystem, which is
what confinement is for. A path that only looks contained, and one that reaches
outside through a symlink in the checkout, are both refused as escapes. The
run's evidence records the two apart; the retained record does not carry read
denials, so its schema is unchanged.

This is a message change, not a confinement change: no reviewer gains a read it
did not have.

One authorized live quick review demonstrated all three read tools being used
on unchanged source, with no read denials. It removed the earlier missing-source
coverage gaps but produced no additional findings; this is not proof of better
bug detection. See the R1 evidence in [ROADMAP.md](ROADMAP.md).

Reviewers return strict JSON candidates with severity, confidence, location,
exact source quotations, concrete triggering conditions, expected/actual behavior,
before/after evidence of introduction, and optionally a citation of the code that
change breaks. Raw candidate output remains untrusted;
only findings surviving the Q4 boundary below appear in the final findings view.
Candidate output may quote PR source; full captured input is not dumped into the
parent timeline.

`Q3 evidence:` (`M1 evidence:` for balanced and full, `M2 evidence:` for deep) is emitted after
owned-runtime cleanup and now includes Q4
`validation` and optional `adjudicator` records. `executionComplete` reports
specialist execution separately. `complete: true` additionally requires finished
validation without unresolved evidence or cleanup errors; it never means the PR
is correct. Failed reviewers retain partial output alongside successful reviewers
and report incomplete coverage.
Skipped/declined/unconfirmed targets, and checkouts that fail the revision
identity gate above, report `coverage: "not-started"` and start no reviewer
runtime. Setup/capture failures and cancellation never become a
clean-review result. P2 retains the settled quick result in its originating session.
The raw timeline evidence also includes per-call `billing` charges when the
runtime reports them (`totalNanoAiu`, divided by 1e9 for AI credits). Missing
charges mean unknown cost, not zero. Billing details and read-tool traces are
not part of the retained inspection record.
Manual cancellation stops owned work without a review timeout; a pending host
confirmation UI may remain visible, but a late answer cannot resume cancelled
capture.

### The verification preflight (V1a)

```text
/pr-review 123 --verify --no-comment
/pr-review 123 --deep --verify --all --no-comment
```

`--verify` is the opt-in for running this project's existing safeguards, such as
its tests, compilation or linting, so that a reviewer's claims can be grounded
in evidence rather than reading alone. **Nothing is executed yet.** Three slices
exist: the gate a verification-enabled run must pass, the discovery that shows
which commands the project declares, and the approval that asks which of them
may run. That answer is recorded and nothing acts on it, so no command is run
and no reviewer receives one. A run that passes the preflight is an ordinary review of whichever mode
it selected, and the timeline says so in those words, so the flag can never be
mistaken for evidence that something verified the change.

The preflight is the same revision gate every review already passes, with two
conditions added:

- the current branch is the pull request's head branch, so a detached `HEAD` at
  the reviewed commit is refused even though the revision is right;
- no path in the checkout is untracked.

Both exist because safeguards would run commands in this checkout. Artifacts a
test run leaves behind could not afterwards be told apart from files that were
already lying there, and a detached `HEAD` is the reviewed revision without
being a branch anything can land on. Ignored paths are not untracked files, so
an ordinary working checkout with its dependencies and build output installed
still passes. An untracked path warns during an ordinary review, exactly as it
always has, and refuses only under `--verify`.

A refusal names the flag that applied it, so a checkout that is perfectly
reviewable without `--verify` does not look broken, and it repeats the flag in
the command it suggests. Nothing is ever repaired automatically: the gate does
not switch branches, pull, stash or clean, and the untracked refusal says to
remove or ignore those paths yourself. A refused verification run reports
`coverage: "not-started"` and `disposition: "refused"`, starts no reviewer
session and no owned runtime, and spends nothing. Cancelling a run while the
gate is still working is reported as the cancellation it was, never as a
refused checkout, and the branch check reports a detached `HEAD` only when git
actually answered that HEAD is not a symbolic ref.

`--verify` is orthogonal to the mode flags and to the posting flags. It cannot
be combined with `--capture-only`, which stops before any reviewer and so
reaches no preflight. It is deliberately not a configuration key: no saved
personal setting and no trusted project file can turn verification on, which
keeps the decision to run a repository's own commands an explicit one, made at
the invocation. Posting authority grants nothing here either: neither posting
flag and no saved automatic-posting setting can approve a command, which
`SCOPE.md` requires by name.

### Safeguard discovery (V1b)

Once the preflight passes, the run reads the markdown files at the root of your
checkout and presents the safeguard commands they declare, each with the file it
came from:

```text
V1b safeguard discovery found 3 command(s) declared in this project's instructions.
  npm test  [declared in AGENTS.md]
  npm run typecheck  [declared in CONTRIBUTING.md]
  npm install  [declared in AGENTS.md]  not offered: `install` is not a check: a safeguard never installs, migrates, deploys, publishes, creates, cleans, serves, formats in place or watches
Read: AGENTS.md, CLAUDE.md, CONTRIBUTING.md. Skipped: ROADMAP.md (exceeds 65536 bytes).
2 of 3 can be run by this tool. The rest are not offered at all. A refusal is a rule about
the kind of command it is, and passing those rules is never a judgement that a command is
safe to run.
Nothing here has run. You are asked next which of these may run in this checkout; an
approved command runs before any reviewer starts, no reviewer receives its output, and
this stays an ordinary review of the selected mode.
```

The source is your project's own instructions, and only those. A package
manifest's scripts and a best-effort guess from the project's stack are both
recorded as later slices, so a project that declares nothing in prose finds
nothing here today. Reading is confined to the root of the checkout: no
subdirectory, no symbolic link followed out of it, nothing that is not markdown,
and nothing over 64KB, with a total budget for the run. Every file that was read
and every candidate skipped is named, because a source dropped in silence cannot
be told apart from a project that documented nothing.

A model reads the prose, and code decides what its answer may say. The schema,
the binding, the command text and above all the file a command is attributed to
are all checked before anything reaches your screen: a command can only cite a
file this run actually read, and must be a single line without control
characters. Every command the pass read is reported, including one this tool
refuses to run, because a command that vanished from the report could not be
told apart from one your project never declared.

Discovery is not a reviewer and is not part of review coverage. It holds no
tool, is never given the checkout to read, and takes no configured fallback. A
pass that fails, returns an unusable answer or cannot start is reported as
itself, and the review continues and reports its own coverage exactly as it
would have. A checkout root with no markdown at all spends no model turn.
Everything else does: from this slice on, a verification run costs one extra
model turn compared to the same review without the flag.

Reading these files is safe here only because the preflight already proved this
checkout is the reviewed revision, which is why discovery never runs during an
ordinary review. The files are read at the pull request's head, so a branch can
change what they say. For this release that is accepted rather than mitigated:
the tool is used on its author's own pull requests and those of their team, and
nothing discovered can act until you approve it in that same run.

### Command approval (V1c)

With commands discovered, the run asks which of them may run, one choice per
command, before any reviewer starts:

```text
V1c safeguard approval: 1 of 2 offered command(s) approved.
  npm test  [declared in AGENTS.md]
These run now, in this checkout, before any reviewer starts.
Nothing else approves a command: there is no flag, no configuration key and no saved
posting setting that can, and an approval does not outlive the run that recorded it.
```

Approval is per command, so a fast check can be taken without the suite that
takes half an hour. Each choice is scoped to the invocation that discovered the
list, so an answer can never approve a command by its position in some other
run, and the recorded answer keeps the order the commands were discovered in
rather than the order you happened to pick them.

The question sits between discovery and the reviewers rather than beside finding
selection. That is where an approved command has to run for its output to be
able to ground a reviewer's claim, so the gate is put where execution follows
it. The cost is that the run waits for you before any reviewer starts.

Approval comes from that question and from nowhere else. There is no flag that
approves everything, no personal setting and no trusted project file that
pre-approves a command. `--comment`, `--all` and a saved `autoPostReviews=true`
grant posting authority and no approval whatsoever, which `SCOPE.md` requires by
name. A host with no elicitation UI approves nothing and says so, and there is
deliberately nothing to suggest instead.

Declining, approving nothing, or returning an answer this run cannot account for
all approve nothing and leave the reviewers to run: approval grounds no finding,
so an unanswered question cannot make the review itself less trustworthy. None
of them is incomplete review coverage. Cancelling the question cancels the run,
before any reviewer starts.

The approval does not outlive the run. It is not written to the retained result,
so no schema version moves for it, and a publish-later of that result carries no
approval and never could.

Only what this tool would actually run is offered. A command it refuses is
already on your screen with the reason, and asking for permission it could not
act on would be theatre.

### Running an approved safeguard (V2a)

An approved command runs immediately, in this checkout, before any reviewer
starts:

```text
V2a safeguard execution: 2 approved command(s), 1 of which did not pass.
  npm test  [declared in AGENTS.md]  passed, exit 0, 8214 ms
    stdout:
      142 passing
  npm run typecheck  [declared in CONTRIBUTING.md]  failed, exit 2, 1190 ms
    stderr:
      src/session.ts(31,7): error TS2322: Type 'string' is not assignable to type 'number'.
Running these left the checkout changed. Nothing was reverted, stashed or cleaned:
  ?? tsconfig.tsbuildinfo
No reviewer receives any of this, so a failed safeguard does not make this review's
coverage incomplete and changes nothing about what the review found.
```

**This is not a sandbox.** The command is declared by the code under review, and
it runs as you, in your checkout, with the dependencies you already have
installed. Approve one only if you would run it yourself.

There is no shell anywhere in the path. A command is split on whitespace and
handed to the operating system as an argument list, so a line carrying anything
only a shell could interpret is refused rather than run: a `&&` chain, a pipe, a
redirect, a variable, a glob, a quoted argument, a loop. That refusal is what
makes the rest of the rules worth anything, because against a shell a first word
tells you nothing about what a line will do.

On top of that, code refuses a command that is not a check at all: anything that
installs, migrates, deploys, publishes, creates, cleans, serves, formats in place,
auto-fixes or watches, and any program that changes the machine, moves data over
the network, drives version control, or provisions and deploys. Those names are
matched without regard to letter case, because a filesystem that ignores case
would otherwise run `Curl` after the rule refused `curl`. Watching is the
sharp case, because this tool imposes no review timeout by design and an approved
watch command would have nothing to end it. **The rule is a heuristic**, and
surviving it is never a judgement that a command is safe. It will refuse checks
that were perfectly reasonable, and a project can answer that by declaring the
command as a plain single line.

Code also checks that a command really appears in the file it cites, as a command
of its own, so an invented command cannot borrow a real file's name. `npm run
test` is not carved out of `npm run test:unit`.

**That check accepts a prefix, deliberately.** A match may end at whitespace, so
`npm test` passes as cited from a file that declares `npm test --fix`, and a
command whose safety lives in a trailing argument can be offered without it. The
alternative is to demand that the match reach the end of its line, and that
refuses the ordinary way a project declares a command, in prose: "run `npm test`
before committing". Three things bound what a prefix can do. The offer shows you
the exact command that would run, not the line it came from. The rules above run
first, so the shapes they name are refused whatever arguments follow, and the
`--fix` case is refused outright as an auto-fix. And there is no shell, so a
truncated line is still one program with an argument list, re-checked against
those rules in the moment before it starts.

Commands run one at a time, in the order they were discovered. Output is captured
with a bound per stream and the end of it is shown, which is where a failing
suite says what failed; reaching the bound truncates the capture and says so, and
never kills a command that is otherwise passing. Standard input is closed, so a
command that stops to ask a question fails at once instead of waiting forever on
a review that has no timeout to rescue it.

One `git status --porcelain` afterwards reports what running project code left in
your checkout. The preflight already proved the tree was clean, so anything named
there was left by a safeguard. Nothing is reverted, stashed or cleaned.

That status read belongs to the review, so cancelling stops it too, and the run
then says the checkout could not be inspected rather than waiting on it.

Cancelling the review kills the running command and every process it started,
because a test runner's workers must not outlive the review that started them.
There is no timer anywhere in this: only you end a running safeguard.

**A safeguard grounds no finding, and this is settled rather than pending.** No
reviewer ever receives safeguard output, so a failing suite is reported loudly
to you and still leaves the review's own coverage exactly as it was. The output
is text produced by the code under review, and handing it to a reviewer would
open a prompt-injection surface that has nothing to do with running a process.
It grounds claims for the person who approved the command, which is who decides
what a red suite means.

The retained result says nothing about what ran, for the same reason discovery
and approval are absent from it: what a safeguard did changes nothing about what
may be published later, so recording it would put inert data on a durable
artifact.

One consequence is worth stating. An approved safeguard may leave artifacts in
your checkout, and a reviewer reads that checkout, so a reviewer can read a file
a safeguard wrote. It cannot report one. Every citation is resolved against the
head and base blobs fetched from GitHub for the reviewed commit, and a file that
is not part of that bound source is refused as outside provenance, so a claim
about a safeguard's leftovers never becomes a finding.

### Balanced review mode (M1)

```text
/pr-review 123 --no-comment
/pr-review 123 --balanced --no-comment
/pr-review 123 --balanced --no-comment --all
```

Balanced is the default when no mode flag is given, so a bare PR number runs a
review and spends credits; add `--capture-only` for the capture-only path. It
runs five reviewers concurrently: four heavy specialists (correctness,
contracts, security, performance/resources) and one light overview reviewer for
whole-change coherence, missed call sites, misleading names, and small defects
on the changed lines.

Each reviewer resolves the tier its mode assigns, through the same layering as
quick: invocation flags, then a trusted project's settings, then personal
settings, then the ambient session assignment, with unset tiers inheriting the
nearest configured tier. Before any reviewer starts, an `Effective reviewer
assignments:` line names every reviewer, its tier, its model and reasoning
effort, and the origin of each value. Only `heavyModel=` and `heavyEffort=` are
invocation flags; set the light tier with `/pr-review-config lightModel=...
lightEffort=...`.

The balanced findings policy presents P0-P2 findings plus at most three P3/nit
findings; quick presents P0-P2 only. Minor findings must still anchor on a line
this diff changed and pass the same validation and deduplication. Accepted minor
findings beyond the limit are **withheld** from presentation, selection and
publication, and are listed in the result and the retained record rather than
dropped. The retained schema enforces the mode's reviewer count and findings
policy, so a record cannot claim complete coverage with a missing reviewer or an
over-limit minor finding.

Everything else is unchanged: the same revision gate, confined read-only
reviewer tools, evidence boundary, isolated adjudication, selection, retention
and publication gates. Cancellation still stops all owned work, no timeout is
imposed, and incomplete coverage is still reported as incomplete.

Balanced execution is demonstrated by controlled probes, no-inference installed
dispatch, and the live balanced reviews of this project's own pull requests #3,
#4, #6, #10 and #12. Two of them are worth describing here. #3 ran five
reviewers, made 89 confined reads with no denials, returned zero findings with
incomplete coverage, and cost 414.14627 reported AI credits; its light reviewer
inherited the heavy assignment because no light tier was saved. #4 did run a
light model, and that light reviewer produced a finding no heavy reviewer
raised. Both pull requests were documentation-heavy, so neither says much about
review quality on a code diff. See [ROADMAP.md](ROADMAP.md).

### Full review mode (M1)

```text
/pr-review 123 --full --no-comment
/pr-review 123 --full --no-comment --all
```

Full runs the balanced five plus one **medium conventions/maintainability
reviewer**, which looks at project conventions, naming, structure, error
handling, tests, documentation and maintainability of the changed code, judged
against the surrounding codebase. Six reviewers run concurrently, so a full
review costs more than a balanced one on the same diff.

The medium tier resolves through exactly the same layering as the others, and
the `Effective reviewer assignments:` block names its model, effort and origin
before any reviewer starts. There is no medium invocation flag; set it with
`/pr-review-config mediumModel=... mediumEffort=...`. An unset medium tier takes
the nearest configured tier, and light and heavy are equidistant from it, so a
configured heavy tier wins that tie. With only a light tier configured, the
conventions reviewer inherits the light one.

The full findings policy presents **every qualifying severity with no minor
cap**: accepted P3 and nit findings are all presented, so nothing is withheld
and `capped` stays empty. Minor findings still have to anchor on a line this
diff changed and pass the same evidence gate, adjudication and deduplication.
Everything else is unchanged from balanced: the same revision gate, confined
read-only reviewer tools, incomplete-coverage reporting, selection, retention,
publication gates and cancellation. Mode flags remain mutually exclusive, and
balanced remains the default.

**Wrapped reviewer output, and how it is handled.** Full mode was demonstrated by
the live review of this project's own pull request #5, which ran all three tiers
on distinct models for the first time: four heavy specialists on `gpt-5.6-terra`,
the light overview reviewer on `gpt-5.6-luna`, and the conventions reviewer on
`claude-sonnet-5`. That run made 95 confined reads with no denials and cost
276.266849 reported AI credits. It also found that `claude-sonnet-5` wraps its
candidate JSON in a ```` ```json ```` fence, so the conventions reviewer's whole
output was discarded as an execution failure. The review of pull request #6 then
discarded a `gpt-5.6-terra` specialist that emitted a sentence of prose before
its JSON, the same way, so this was never specific to one model family.

`F6` addresses both. Reviewers and the adjudicator are asked to put the JSON
object between the markers `<<<PR_REVIEW_JSON>>>` and `<<<END_PR_REVIEW_JSON>>>`,
each alone on its line, the technique the CLI runtime's own structured output
uses. Code then unwraps exactly that delimiter pair, plus one fence that wraps
the whole response. Prose outside the markers is discarded unread instead of
discarding the review. A marker counts only as a whole line, so marker text
inside the JSON, which any citation of these lines carries, stays payload.

The full-mode review of pull request #7 demonstrated it: five of six reviewers
emitted the markers, `claude-sonnet-5` among them, with no fence anywhere. The
full-mode review of pull request #11 went further: `claude-sonnet-5` wrote
several paragraphs of prose and then the markers, and its envelope was taken
whole. That same review also shows the limit. One `gpt-5.6-terra` specialist
returned a single sentence of prose and **no markers at all**, and that is
discarded whole, because there is no envelope to unwrap. An attempt whose output
is discarded that way is a failed attempt, eligible for its tier's one configured
fallback; the marker contract itself is unchanged.

Nothing else is recovered. A repeated or missing marker, a marker sharing its
line, a fence with prose after it, two fenced blocks, a truncated object, and a
bare object preceded by prose with no markers each still discard the whole
output, and every check after the parse is unchanged. `F5` investigated whether the runtime could return parsed
structured output instead and found it unusable on Copilot CLI 1.0.83; that
evidence, this increment's boundary, and the exact list of what still fails whole
are in [ROADMAP.md](ROADMAP.md).

### Deep review mode (M2)

```text
/pr-review 123 --deep --no-comment
/pr-review 123 --deep --no-comment --all
```

Deep replaces the parallel specialists with **one integrated heavy reviewer**
that holds the whole pull request at once. Correctness, API and data contracts,
security, performance and resource lifetime, and whole-change coherence are all
its responsibility, and so are the consequences that appear only when the
changed files are taken together. Deep is holistic review: it is not a larger
parallel review, not a further specialist, and not a higher reasoning effort.

The reviewer resolves the heavy tier through exactly the same layering as every
other mode, so `heavyModel=` and `heavyEffort=` apply, and no light or medium
tier is resolved at all. The `Effective reviewer assignments:` block names the
integrated reviewer, its tier, model, effort and the origin of each value before
anything starts. With one reviewer and the adjudicator, deep runs the fewest
sessions of any mode on the same diff, and it is the least parallel: nothing
overlaps with anything else.

The deep findings policy presents **every substantiated severity**. Accepted P3
and nit findings are all presented, nothing is withheld and `capped` stays
empty, as in full. Minor findings still have to anchor on a line this diff
changed and pass the same evidence gate, adjudication and deduplication.

Everything else is unchanged from the parallel modes: the same revision gate,
the same confined `view`/`grep`/`glob` reads, the same marker contract and
unwrap on reviewer output, the same isolated adjudication in a separate
zero-tool session rather than the reviewer judging its own candidates,
incomplete-coverage reporting, selection, retention, publication gates and
cancellation. The retained schema holds a deep record to deep's own topology, so
a one-reviewer record cannot claim balanced or full coverage. Mode flags remain
mutually exclusive, and balanced remains the default.

Deep was demonstrated by the live review of this project's own pull request #8,
its first run. One `gpt-5.6-terra` reviewer at high effort made 11 confined reads
with no denials, and the run cost 68.27393 reported AI credits, the cheapest
review this project has run. It is also the first review of one of this
project's own increment pull requests to reach **completed** coverage: the
single reviewer and the adjudicator both emitted the `F6` markers on their own
lines, and both parsed. It returned two validated findings, both real
documentation defects in this pull request, which were fixed on the branch.
See [ROADMAP.md](ROADMAP.md).

### Grounded findings and deduplication (Q4)

No extra flag is required. After the selected mode's specialists finish, code
unwraps the marker pair described above, and one fence that wraps the whole
response, then rejects anything else malformed rather than extracting fragments
from it. Candidates must echo a digest of the code-owned review binding and use
exactly the defined schema. Candidates must carry numeric confidence **0.8
through 1** and a severity the mode's findings policy admits: P0-P2 for quick,
P0-P2 plus P3/nit for balanced, full and deep. This is a conservative admission
threshold, not calibrated certainty.

Code checks every cited path, side, line range and verbatim quotation against Q2's
captured context windows and blob/revision provenance. The primary location must
span at most ten lines in a diff hunk and include an actually added or removed
line, not merely nearby unchanged code. Before/after evidence must describe that
location's own hunk, citing changed code where present; either side may be null,
which claims this change replaced or added nothing there and leaves the
adjudicator to settle whether that is true.

A candidate may also cite the code its changed line breaks, in an optional
`breaks` citation, so the common report "this changed line breaks that other
code" no longer has to mis-anchor its introduction to be expressed. That citation
carries no anchoring rule of its own: it may be unchanged code, code in another
hunk, or code in another changed file, though it is still bound, in-window and
exactly quoted like every other citation. It is displayed and retained with the
finding, and it is a claim the adjudicator must prove from source, never evidence
that the claim holds. A live reviewer used it on the first pull request that
offered it, #12, citing code eleven lines away in a different hunk. Renamed paths retain their
separate base/head identities. Unsupported citations and missing evidence remain
visible coverage issues, not silent filtering into a clean result.

**Clipped quotation ends (Q6).** Exact full-line matching remains the acceptance
path. At candidate ingestion only, a quote that is a contiguous span of its bound
source range can be restored to those exact full lines. It must still cover
every named line and include non-whitespace text on its first and last lines:
no inserted characters, interior edits, omitted whole lines, range expansion or
search elsewhere in the file. This applies to any candidate citation, including
`breaks`; changed-line and same-hunk requirements remain unchanged.

Each repair is reported as an informational caveat with the field, original
quote and restored source, passed to adjudication and retained with the result.
The candidate's prose is never rewritten. The adjudicator must reject a claim
that relies on omitted text or whitespace being absent. A short fragment can
still be repaired on its actual line; that proves provenance, not its meaning.
Adjudicator evidence and publication checks stay exact-only, and the published
inline comment body is unchanged.

When eligible candidates exist, one **separate, isolated validation session**
uses the effective heavy model/effort in the same owned runtime. Its assignment
is displayed before its prompt. This uses additional subscription credits; it
does not change the selected mode's reviewer topology or add a specialist.
The validator attempts to disprove each claim against the original diff and
source, checking guards, reachability, contract changes, pre-existing behavior,
severity/confidence, and causal impact. Acceptance requires a reason and
source citations that code checks again. A failed, malformed, incomplete, or
wrong-usage validator cannot authorize findings.

Acceptance also requires an explicit `allClaimsSupported: true` assessment.
A partly correct candidate must be rejected if any assertion is false or
overstated: a correction in the validator's rationale does not repair the
original finding text. This is an enforced decision boundary, not a guarantee
that the model's assessment is infallible.

**Exact source checks are deterministic; causal and severity adjudication is
model-based and fallible.** A matching quotation alone is not proof of a defect,
and a second model's agreement is not an executable reproduction. No PR code is
run and this is not formal verification. Claims that need absent caller/context
evidence must be rejected or marked uncertain, not accepted on assertions alone.

Duplicate reports merge only after an explicit same-root-cause/trigger/impact
decision and shared bound changed-source evidence of the cause, including
supporting citations when primary anchors differ across files. Sharing a file or location
does not itself merge anything. The strongest accepted severity/confidence report
is displayed, with original reports and reviewer attribution retained. Different
causal change evidence is conservatively left unresolved rather than silently merged.

The final view presents title, severity, location/revision, confidence, any cited
broken code, trigger, expected/actual behavior, introduction, and validation
reasoning. Rejections and
unresolved limitations remain visible. Malformed candidates do not discard valid
siblings, and a failed specialist does not discard validated findings from its
successful peers. Non-textual changes are explicitly uncovered. Empty findings,
completed execution, and skipped targets never claim a clean PR.

Coverage diagnostics distinguish **execution failures** (including invalid
output), **substantive coverage gaps**, and **informational caveats**. Only the
first two make validation incomplete. Reviewer and adjudicator output schema
version 2 uses explicit `limitations` entries with `kind`, `reason`, and
`impact`: a `coverage-gap` requires a nonempty impact explaining which
consequential assessment is blocked; a `caveat` requires `impact: null`.
Not independently auditing a dependency is informational unless relevant
missing evidence blocks a specific assessment of this diff. Code-detected
unavailable changed content and uncertain adjudication remain coverage gaps.
Classification of model-reported limitations is still fallible; structured
output does not prove that the model chose the right category.

Final summaries, retained inspection, and new publication proposals show these
categories and their reasons. When multiple specialists report the same blocked
assessment about the same quoted code identifier, the presentation conservatively
consolidates those reports, names their reporters, and keeps the full raw
diagnostics unchanged in retention. Distinct, unstructured, code-owned, and
legacy gaps remain separate. Retention keeps optional structured `diagnostics`
alongside the existing blocking `issues`; caveats do not enter that blocking
list. The publication/authorization record versions remain unchanged. Older
unclassified issues and version-1 output limitations stay conservatively
incomplete, without guessing from wording. Legacy publication proposals retain
their exact original text for inspection and gated publish-later; no historical
authority is upgraded or reused.

Validation uses the existing tool-denial, progress, cancellation, no-timeout,
usage-accounting, and cleanup machinery. Cancellation during validation stops the
owned work. P2 retains the validated findings and their source provenance, not raw
reviewer/adjudicator output. No GitHub publication or safeguards are added.

### Finding selection (P1)

After displaying validated, deduplicated findings, the plugin stops its owned
inference runtime before asking for selection. Without `--all`, a host
elicitation form lists each finding's severity, title, location/side, and
confidence. Select a subset, accept with no choices (or decline) to select none,
or cancel the run. Nothing is preselected. The reviewed head and coverage status
remain visible; incomplete runs can still have useful selectable findings.
An empty result skips the form and is never a clean-review claim.

`--all` selects every final validated finding without a form. It never selects
raw/rejected candidates or duplicate aliases and **does not authorize posting**.
An unsupported host reports selection `unavailable` explicitly and selects
nothing, even with `--comment`; rerunning with `--all` is an
explicit new review, not a hidden select-all fallback or cached-result action.

Answers are bound to a unique invocation, the originating session, repository,
PR and reviewed head, plus the full Q4 review-binding digest. Unknown, duplicate,
malformed or stale choice values fail closed instead of choosing other findings.
Selection does not reread GitHub, execute PR code, or rerun reviewers.

`/pr-review cancel` remains available while the form is pending, and another
review cannot start in that session until selection ends. There is no selection
timeout. A host dialog may outlive a cancelled local waiter, but late answers
cannot revive it. `P1 evidence:` records the final selection disposition and
IDs with their binding; `Q3 evidence:` remains the post-inference/cleanup review
record. `reviewComplete` preserves that earlier coverage state, while cancellation
marks the final run incomplete and clears selected IDs. Selection failure and
coverage are separate: `complete` describes review coverage, not selection or
posting success. P3 preview/confirmation and P2 retention follow selection.

The installed CLI's native elicitation transport is exercised with a scripted
SDK host in `scripts/runtime-selection.mjs`, not a mock extension API. This is
not a claim about visual layout, other hosts or platforms. Reproduce with:

```sh
node scripts/smoke-selection.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick --selection
```

This spends subscription credits using child-only controlled `gh` input for
synthetic target 13 (independent arithmetic and shipping regressions), not real
GitHub mutations. Use `--selection-no-ui` instead of `--selection` to demonstrate
an unsupported host. `--selection-cases=none,cancel-ui,cancel-pending,invalid`
limits the UI probe to named cases without repeating successful inference.
Model output is fallible: no validated findings stops a positive UI probe, not
the plugin's fail-closed behavior. See the roadmap for recorded evidence.

### Retained result inspection (P2)

```text
/pr-review inspect
```

Reviews retain **one latest result per originating local session**. This
command displays the retained findings, canonical selection IDs/disposition,
reviewer coverage and errors, and repository/PR/reviewed-head identity. It performs
no inference, GitHub requests, current-head refresh, local source reads, or
publication. It always refers to the originating repository shown in the result,
even if the session's current directory has since changed. It accepts no target
or session-ID argument; it is not a cross-session archive, and it publishes
nothing. Publishing a retained result requires `/pr-review publish` below.
Inspection is refused while review work is active.

The plugin uses the installed SDK's local session workspace metadata and writes
`pr-review-result.json` directly in that session-state directory, never in the
checkout. Raw candidate/adjudicator output and duplicate candidate bodies are
excluded. Validated findings retain their quotations, revision/blob provenance,
attribution, deduplication IDs, and full review binding; rejection/duplicate reasons
and coverage/error state remain visible. Full captured diff/context text is not
stored. A versioned schema and digest detect incompatible/malformed records,
cross-session or inconsistent bindings, and stale/noncanonical selected IDs.
The digest is a corruption check, **not authentication against someone who can
rewrite the session files**; local session storage is not an OS sandbox.

An accepted new quick run supersedes the previous result with a non-actionable
pending marker before capture, unless an unresolved publication journal blocks
replacement. Once inference cleanup, selection, confirmation and publication
settle, a synchronous, flushed-file/atomic-rename write records the final state
without an intervening await. Before any submission, a separate atomic checkpoint
records `in-flight` uncertainty. A process interrupted before that checkpoint
leaves an unfinished marker; after it, inspection warns that GitHub may have
received a write. Cancellation before dispatch clears selected IDs and marks the
result incomplete; cancellation after dispatch preserves the historical payload
and actual/uncertain publication outcome. Empty, skipped, failed, unavailable-UI, and
degraded outcomes remain distinct; none claims a clean PR. Capture-only and
fixture commands do not replace the quick-result slot.

`P2 evidence:` acknowledges a successful retained write after the run settles;
`P2 inspection:` describes the loaded record. `P1 evidence:` alone is not a
retention acknowledgement. Storage failures are explicit and never fall back to
transcripts or another session's result. Remote/missing workspaces and sessions
reported as already in use are refused. A failed replacement can leave an earlier
record or a pending marker; inspect the reported state rather than treating the
failed run as saved.

Extension reload preserves the result. **Cold resume was demonstrated for the
same session after a real parent conversation turn**, using a fresh CLI runtime.
Command-only SDK sessions in CLI 1.0.83 lack resumable event history: save/close
still leads to `Session not found`, although the retained file survives. The plugin
does not manufacture history or spend credits to make those sessions resumable.
Forked/new sessions cannot inspect the original result, even if its record was
copied into their workspace. Same-session interactive `/resume` uses the host's
session lifecycle; human UI, remote hosts, and other platforms are not demonstrated.

Reproduce controlled storage and native lifecycle probes:

```sh
node scripts/smoke-retention.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-retention-runtime.mjs
```

The default runtime probe seeds controlled validated fixtures, then exercises real
inspection/reload and records the command-only resume limitation without inference.
For real review retention and cold resume, add explicit settings and
`--quick --parent-turn`:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-retention-runtime.mjs --quick --parent-turn
```

This spends credits for one parent-session initialization turn and the quick
review; inspection/reload/resume never rerun reviewers. It uses controlled target
12, not GitHub mutations. The existing selection runtime probe now also inspects
retained results; use `--selection-cases=subset,none,cancel-pending` to cover
subset selection, no selection, and cancellation with an inert late UI answer.

### Posting authority and COMMENT publication (P3/P4)

After selection the plugin displays a code-built, repository/PR/head-bound
COMMENT payload and records posting authority separately from selection.
**`--all --comment` can now publish a real GitHub review without either form.**

```text
/pr-review 123 --quick --all --comment
/pr-review 123 --quick --comment
/pr-review 123 --quick --all
/pr-review 123 --quick --all --no-comment
```

The first example selects all validated findings and authorizes the proposal
without either form. The second still requires finding selection. The third
requires explicit final confirmation of the displayed proposal; the form
defaults to false. The fourth displays the payload but suppresses authority and
does not ask for final confirmation. `--comment --no-comment` is rejected before
capture or inference.

Without a posting flag, the authority calculation consumes effective
`autoPostReviews`, default false. It is now supplied by the saved personal
configuration below, so `--all` with an effective `autoPostReviews=true`
publishes unattended, while `--no-comment` still suppresses posting and
`--comment` still conflicts with it. There is no invocation syntax for
`autoPostReviews` itself. No posting flag or authority decision approves project
safeguards. Missing UI, refusal, malformed answers, cancellation and empty
selection never authorize a proposal. Incomplete coverage remains explicit;
surviving validated findings may still be selected and authorized.

Code constructs `commit_id`, literal `event: "COMMENT"`, a concise coverage
summary, and inline comments from canonical selected findings only. The comment
preserves severity, trigger, expected/actual behavior, introduction, confidence
and reviewer attribution; a finding's broken-code citation stays in the terminal
view and the retained record rather than being repeated in the comment. Source
quotations, provenance and captured changed
hunks are checked again before preview. Head/base anchors use RIGHT/LEFT;
multi-line ranges include `start_line` and `start_side`. Renamed-file base
citations map to the current diff path; deleted files keep the old path.
Every current finding requires an inline location, so there are no qualifying
non-inline findings to summarize separately. Invalid anchors are refused, never
silently converted into body-only comments.

No GitHub refresh or mutation occurs during preview/confirmation. This is
**captured-head evidence, not a current-head or publication-lifecycle check**.
Publication follows with fresh code-controlled checks. There is no separate
preview command; `/pr-review inspect` displays the stored proposal without
rerunning anything, and `/pr-review publish` republishes nothing by itself.

New records use schema version 3, or version 4 once the explicit publish-later
command has written, and retain the policy, historical authority, exact proposal
and a separate publication disposition. The proposal's legacy
`submitted: false` describes the proposal stage, not the final write outcome;
`publication.status` is authoritative. Inspection reconstructs the expected request to
reject changed payloads, anchors or authority combinations. It does not reload
source or prove the head still matches. Valid P2 version-1 and P3 version-2 records remain
inspectable without inventing publication outcomes or new posting authority; unknown schemas
fail explicitly. **Retained authority is historical, not permission for a later
run.**

Immediately before dispatch, code rereads the captured repository's identity,
PR identity, head/base revisions, lifecycle and full diff, then checks PR metadata
again. Requests explicitly pin the originating host/repository/PR and captured
working directory, never a later session directory. Changed head/base/diff,
invalid anchors or metadata drift stop publication without a POST. The payload
always specifies the reviewed `commit_id` and literal `COMMENT`: no approvals,
change requests, body-only fallback or model-created mutation commands.

Drafts cannot publish even with `--include-drafts`. Upstream restricts non-open
publication to summaries; all current findings require inline anchors, so
closed/merged PRs cannot receive this payload, including with `--include-closed`
or `--review-closed`. Those flags authorize review capture only.

The write-ahead journal distinguishes `not-attempted`, `in-flight`, `succeeded`,
`failed` and `uncertain`. Only a validated COMMENTED acknowledgment tied to the
reviewed commit yields success with a GitHub review URL. Explicit rejection
responses such as HTTP 403/422 yield definite failure. Transport loss, interrupted
writes, server errors and malformed/mismatched acknowledgments remain uncertain.
No write is retried automatically. An `in-flight` record after process loss is
also uncertain, not evidence of no publication. A failed final disk write leaves
that earlier journal intact. Unresolved uncertainty blocks another quick run in
the session from erasing the record; inspect GitHub before any manual recovery.
No automated reconciliation/retry command exists yet.

Cancellation remains available without a timeout. Before dispatch it clears
selection IDs, revokes authority and preserves findings with incomplete coverage.
After dispatch it records `cancelRequested` without erasing historical selection,
authority or a confirmed/uncertain outcome: cancellation cannot undo a remote write.
A late UI answer cannot resume a cancelled run. Another review or inspection is
refused until the run settles. Owned inference has stopped before either form.

Fresh checks are not an atomic GitHub compare-and-submit transaction: a remote
head/lifecycle change can race the final GET and POST. The explicit `commit_id`
prevents silently rebinding comments to another head, but cannot prevent GitHub
from accepting a review that becomes outdated during that interval.

Reproduce controlled and native probes:

```sh
node scripts/smoke-preview.mjs
node scripts/smoke-publication.mjs
node scripts/smoke-review.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-preview-runtime.mjs --cases=comment,cancel-pending,confirmed --parent-turn
```

The native harness uses actual inference with child-only controlled `gh` input;
it makes no GitHub mutation. Every case is an explicit new review and requires a
positive validated result, without automatic retries. Optional cases
`subset-comment,declined` exercise selection under posting authority and final
refusal. Run `--cases=unavailable` alone without `--parent-turn` for a UI-less
host. The optional parent turn only initializes resumable conversation history
for the harness; it is not plugin behavior. Reload and conversation-backed cold
resume preserve the exact version-3 record. These are native SDK-host
interactions, not a claim about human terminal clicks or other clients.

Using the same CLI/SDK/model environment, run
`node scripts/smoke-publication-runtime.mjs --cases=comment,stale,uncertain,cancel,reject,confirmed,declined,suppressed,draft`
for the P4 publication boundary. The controlled `gh` process holds each response
until the harness observes the actual `in-flight` record and stopped inference.
The cancellation case kills that owned POST process and preserves uncertainty.
Each case has its own session, because unresolved publication journals must not
be overwritten. The default cases are `comment,stale,uncertain`; all listed cases
have been demonstrated. These fixture POSTs never contact GitHub.

The permitted playground PR [#1](https://github.com/xpepper/copilot-pr-review/pull/1)
demonstrates a real COMMENT review and unresolved inline thread on the reviewed
head, with incomplete coverage explicitly preserved. Both synthetic branches are
isolated from main and must not be merged. `scripts/smoke-publication-live.mjs`
requires explicit `--publish --pr=NUMBER --head=SHA` for an authorized isolated
playground target, refuses an existing plugin review at that head, and spends
inference credits. Do not rerun it to manufacture another acknowledgment.
Use `--verify-record=/absolute/path/to/pr-review-result.json` instead of
`--publish` to compare an existing retained result to GitHub without inference
or mutation. The per-review comments API returns legacy position-only objects;
the probe checks line/side fields through the PR comments API.

### Cached publish-later (P5)

```text
/pr-review publish
```

This publishes **this session's retained selected findings** without rerunning
reviewers, validators, or any model. It takes no PR, session, or authority
argument: the retained result is the only publishable target, and it must belong
to the current local session. A previous `--no-comment` run can be published this
way; conversely, retained `--comment`, configuration, or confirmation authority
from the original run authorizes nothing here. Invoking the command **is** the
new explicit publication action, so it can post immediately.

Retention holds findings, canonical selection, and the review binding, but not
the captured evidence. Publication therefore refetches the repository identity,
PR metadata, complete diff, and both reviewed source revisions, and rebuilds the
payload from that refetched evidence. Blob identity, diff fingerprint, context
digest, quotations, and diff anchors must all still match the retained binding.
Reconstructing the request from the record alone is never accepted as proof.
Requests name the captured host, repository, and PR explicitly, so a changed
session directory cannot retarget them; the local checkout is never read.

Every P4 gate reruns: repository/PR identity, reviewed head and base, draft and
non-open lifecycle, the diff fingerprint, and a final metadata read immediately
before the single POST. There is no stale, body-only, or partial fallback.

Publication is refused, without contacting GitHub, when there is no retained
result, when it is unfinished, cancelled, unselected, from another session,
malformed, or written by a schema older than the posting-authority record. It is
also refused for a result that already published successfully, or whose previous
write is `in-flight`/`uncertain`. A **definite** failure such as HTTP 422 may be
published again, but only through a new invocation that reruns every gate under
a new authorization. Refused attempts leave the retained record byte-identical.

A successful, failed, or uncertain publish-later write upgrades the record to
schema version 4 and stores the authorizing invocation, so inspection shows that
the write came from this command rather than the original run's flags. Version 1
to 3 records stay readable exactly as written. The write-ahead journal, uncertain
outcomes, and post-dispatch cancellation behave exactly as in P4: cancellation
after dispatch records `cancelRequested` and never claims the remote write was
undone. Publishing holds the session's active-work slot, so a concurrent review
is refused and `/pr-review cancel` still applies.

Reproduce the controlled and native probes:

```sh
node scripts/smoke-publish-later.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-publish-later-runtime.mjs --cases=publish,stale,uncertain,cancel,reject,draft
```

Every native case runs one real `--all --no-comment` review, reloads the
extension, and then publishes the reloaded on-disk record. The controlled `gh`
process holds each response until the harness observes the durable version-4
`in-flight` record; the cancellation case kills that owned POST process. Add
`--cases=resume` on its own to publish from a conversation-backed cold resume.
Each case then invokes the command a second time, which dispatches again only
after a definite failure. These fixture POSTs never contact GitHub, the harness
rejects any elicitation request, and a run that validates no finding stops
instead of retrying.

The permitted playground PR [#2](https://github.com/xpepper/copilot-pr-review/pull/2)
holds a real publish-later review and unresolved inline thread, published from a
suppressed run with completed coverage. Its branches are isolated from main and
must not be merged. `scripts/smoke-publication-live.mjs --publish-later` performs
that live exercise and refuses a repeat at the same head; use
`--verify-record=/absolute/path/to/pr-review-result.json` to re-check an existing
record without inference or mutation.

### Personal tier configuration (C1)

```text
/pr-review-config
/pr-review-config show
/pr-review-config heavyModel=gpt-5.6-terra heavyEffort=high
/pr-review-config autoPostReviews=true
/pr-review-config unset heavyModel heavyEffort
/pr-review-config help
```

Text commands only: there is no interactive menu and no finding editor. Keys are
`lightModel`, `lightEffort`, `mediumModel`, `mediumEffort`, `heavyModel`,
`heavyEffort`, the optional `lightFallbackModel`, `lightFallbackEffort`,
`mediumFallbackModel`, `mediumFallbackEffort`, `heavyFallbackModel` and
`heavyFallbackEffort` described under [Configured fallback
models](#configured-fallback-models-c3), and `autoPostReviews`. The tier keys
correspond to the upstream `light`, `medium`, `heavy`, `*_thinking`, and
`autoPostReviews` settings; upstream's other fields are not ported.
`autoPostReviews` accepts only `true` or `false` and defaults to false.

Every assignment in one invocation applies together or not at all. Unknown keys,
malformed arguments, empty values, and unsupported models or reasoning efforts
are explicit errors that write nothing. Models must be available and enabled in
this session's Copilot subscription, and an effort must be supported by the model
the tier actually resolves to. An invalid explicit value is refused, never
replaced by a different model or a lower effort. A model that supports no
configurable reasoning effort takes none rather than inheriting one; see [Models
with no configurable reasoning
effort](#models-with-no-configurable-reasoning-effort-c4). Because clearing one half of a
tier can leave the other half unusable, clear a tier's model and effort together.

An unset tier field takes the nearest configured tier, preferring the heavier
tier when two are equidistant, and otherwise the ambient session model or
reasoning effort. Model and effort resolve independently. `show` prints the file
location, the stored settings, the ambient assignment, the effective light,
medium, and heavy assignments with the origin of each value, and the effective
`autoPostReviews`. Every review prints the same report, with invocation flags
applied, followed by its per-reviewer assignments, before any reviewer starts.

A worked example. List what your subscription actually offers with
`/pr-review models`, then set the three tiers together:

```text
/pr-review models
/pr-review-config lightModel=gemini-3.8-flash lightEffort=low
/pr-review-config mediumModel=claude-sonnet-5 mediumEffort=medium
/pr-review-config heavyModel=gpt-5.6-terra heavyEffort=high
/pr-review-config show
```

`show` prints the effective assignment for every tier with the origin of each
value, so you can see which tier a review will actually use. Quick uses the
heavy tier only. Balanced adds the light tier for its overview reviewer, and
full adds the medium tier for its conventions reviewer. **If you leave the
light tier unset, it inherits the nearest configured tier**, so a balanced
review runs its "light" reviewer on your heavy model at heavy effort, which is
what makes a balanced review expensive. An unset medium tier inherits heavy over
light when both are configured, because a tie prefers the heavier tier.

One thing worth knowing before you pick a light model. A model that supports no
configurable reasoning effort, such as `claude-haiku-4.5`, serves a tier with no
effort at all: it does not inherit the effort another tier or this session would
otherwise supply, so it is a usable light model. Setting that tier's own effort
explicitly is still refused. See [Models with no configurable reasoning
effort](#models-with-no-configurable-reasoning-effort-c4).

Invocation flags win over saved settings for that invocation only and never
rewrite the file: `heavyModel=`/`heavyEffort=` on `/pr-review NUMBER`, and
`--comment`/`--no-comment` over `autoPostReviews`. There is no light-tier,
medium-tier or fallback invocation flag; balanced and full take those assignments
from saved configuration or the ambient session, and deep resolves neither tier.

Configuration is personal and lives at `<copilot-config-home>/pr-review/config.json`,
beside the CLI's own `session-state` directory, so it is never inside a reviewed
checkout. The file is a versioned record, `{"schemaVersion": 1, "settings": {...}}`,
written atomically with mode `0600`. Malformed JSON, an unsupported schema
version, an unknown stored key, or a wrongly typed value is an explicit error
that refuses both inspection and review; nothing is rewritten or repaired.
A repository-provided file is read only after the explicit trust command
described below, and a repository can never authorize itself.

Inspection and updates start no inference, make no GitHub request, and run no
review work. They are refused while a review or publication holds the session's
active-work slot.

Reproduce the controlled and native probes:

```sh
node scripts/smoke-config.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-config-runtime.mjs
```

The native probe spends no inference credits: the model and effort it passes are
session configuration, and no prompt is ever sent. It snapshots and restores any
pre-existing personal configuration file, and uses the controlled `gh` fixture
plus draft and closed fixture PRs so that no reviewer ever starts.

### Trusted project configuration (C2)

```text
/pr-review-config trust
/pr-review-config untrust
/pr-review-config untrust /absolute/path/to/a/checkout
```

A repository may carry `.copilot/pr-review/config.json`, a record of the same
shape as the personal file: `{"schemaVersion": 1, "settings": {...}}` carrying
the same configuration keys as the personal store and no others, which since
`C3` means the six tier keys, the six optional fallback keys, and
`autoPostReviews`. It is read **only** when the personal store holds
an explicit trust record for that exact working directory. Without one the file
is located but never parsed, never merged, and reported as ignored in every
configuration report and before every review.

Trust is granted only by `/pr-review-config trust`, which records the canonical
absolute path of the session's working directory in
`<copilot-config-home>/pr-review/trusted-projects.json`, a second personal file
with its own versioned record and `0600` mode. Nothing inside a repository can
grant, widen, or refresh trust: the project file may carry configuration keys and
nothing else, and a `trustedProjects` key or extra top-level field is a validation
error rather than a trust grant.

**What the binding proves.** It proves that you explicitly trusted that exact
directory on this machine. It does not prove which repository, remote, branch, or
file contents are there now. A different checkout later placed at the same path
inherits the trust, and moving or renaming the directory silently drops it.
Revoke with `/pr-review-config untrust`, which also accepts an absolute path so a
deleted directory can still be revoked. Trust is deliberately not taken from the
CLI's own folder-trust list: that trust is granted for ordinary CLI use, and
reusing it would let a folder trusted for another purpose silently change review
models and posting authority.

Precedence is per key: invocation flags, then a trusted project's settings, then
personal settings, then the ambient session assignment. Tier inheritance then
runs over the merged result, and `show` and the pre-execution report name the
origin of every value: `flag`, `project:heavy`, `project-inherited:light`,
`configured:heavy`, `inherited:light`, `ambient`, `unset`, or `model` when the
resolved model supports no configurable reasoning effort. An invocation never
rewrites the personal file, the trust record, or the project file.

`autoPostReviews` is overridable by a trusted project, as the scope records.
**Trusting a repository therefore lets its file set `autoPostReviews=true`, which
can publish an `--all` run unattended.** Nothing else is delegated: a project file
cannot enable project safeguards, cannot add a key that would, and cannot bypass
any publication gate, because publication reads no configuration beyond the
effective posting setting and re-runs every head, lifecycle, and anchor check.

A trusted project file that is malformed JSON, carries an unsupported schema
version, an unknown key, or a wrongly typed value is an explicit error that
merges nothing and refuses both the review and any personal configuration update.
`show` still reports it, so the failure is diagnosable, and `untrust` still works,
so a repository cannot lock you out of revoking its trust. An unavailable or
disabled model, or an unsupported reasoning effort, is refused the same way and
is never substituted or lowered. Granting trust is itself refused when the file
it would activate is broken or unusable, and records nothing.

Reproduce the controlled and native probes:

```sh
node scripts/smoke-config.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-config-runtime.mjs
```

Both probes cover an ignored untrusted file, a repository trying to trust itself,
a trusted file overriding a personal tier and `autoPostReviews`, invocation flags
still winning, an extension reload, revoked trust, and malformed or unusable
project files refusing the review. Neither spends inference credits. The native
probe runs in a disposable fixture checkout, and snapshots and restores both
personal files before and after the run.

### Configured fallback models (C3)

```text
/pr-review-config heavyFallbackModel=claude-sonnet-5 heavyFallbackEffort=high
/pr-review-config show
/pr-review-config unset heavyFallbackModel heavyFallbackEffort
```

Each tier may carry one optional fallback assignment, `<tier>FallbackModel` and
`<tier>FallbackEffort`, for all three tiers. It buys **one extra attempt, for the
one reviewer whose own execution failed**, and nothing else. The review is never
restarted, no other reviewer is affected, and a reviewer that has used its
fallback gets no further attempt whatever happens next.

**Elapsed time never triggers a fallback.** This tool imposes no review timeout
at all, so a reviewer that hangs waits indefinitely and is never replaced; only
an explicit failure is eligible. In practice that means the attempt settled as a
failure: a session error, a shutdown before completion, no usable output, an
attempted forbidden tool call, reported usage that did not match the assignment,
or output this tool could not use at all, described under [Discarded output is a
failed attempt](#discarded-output-is-a-failed-attempt-c5). Cancelling the run is
not a failure and starts no fallback.

An invalid explicit setting is not eligible either. A model your subscription
cannot use, or an effort a model does not support, still refuses the review
before anything starts, exactly as it does without a fallback configured. The
fallback answers a failure during execution, never a configuration you cannot
run, and nothing is ever silently substituted.

Fallbacks start unset and must be configured explicitly, per tier. **A fallback
never inherits from another tier**, unlike a tier's own model and effort: an
unset `heavyFallbackModel` means the heavy tier has no fallback, not that the
light tier's fallback stands in for it. An unset `<tier>FallbackEffort` follows
that tier's own effective effort, and the resulting pair is validated like any
other explicit assignment, so an effort the fallback model cannot support is
refused rather than quietly lowered. The exception is a fallback model that
supports no configurable effort at all: it takes none, exactly as a tier does.
Set `<tier>FallbackEffort` when the fallback model supports a different set of
efforts from the primary. It cannot be set without `<tier>FallbackModel`, because
on its own it configures nothing.

A fallback that resolves to exactly the tier's own model *and* effort is not a
fallback and is never attempted; `show` marks it `NOT OFFERED`. The same model at
a different effort still counts, so a lower-effort retry of the same model is a
legitimate fallback.

Fallbacks have no invocation flag, like the light and medium tiers before them:
`/pr-review-config` is the only place to set them. A `heavyModel=` flag overrides
the tier's own assignment for that invocation while the configured fallback
stays as saved. An explicitly trusted project's file may carry the fallback keys
like any other configuration key, and they layer the same way, so trusting a
repository lets it choose which model answers a failed reviewer.

Which reviewers get one follows the tier, so it follows the mode. A heavy
fallback covers quick's three specialists, balanced's and full's four heavy
specialists, deep's one integrated reviewer, and the evidence adjudicator, which
resolves the heavy tier like any other reviewer and so gets its own single
attempt. It never covers balanced's light overview reviewer or full's medium
conventions reviewer; configure `lightFallbackModel` and `mediumFallbackModel`
for those.

Nothing about a fallback is hidden. `show` prints a `fallback:` line for every
tier, so an unset one is visibly unset, and the pre-execution report names the
fallback beside each reviewer that has one. When one is used, the timeline says
which reviewer fell back and why, the review's coverage report carries an
informational caveat naming both assignments and the primary failure, and the
retained record keeps the failed attempt beside the one that produced the
result. A recovered reviewer reports completed coverage; a fallback that fails
too leaves the reviewer incomplete with both failures recorded.

Eligibility once depended on how the reviewer's execution settled rather than on
whether its output turned out usable, so a reviewer that returned text this tool
could not read counted as completed and got no fallback, while an empty response
got one. Discarded output is the most common way a reviewer has failed in this
project's own live reviews, and that asymmetry is now closed: see [Discarded
output is a failed attempt](#discarded-output-is-a-failed-attempt-c5).

Reproduce the controlled probes:

```sh
node scripts/smoke-config.mjs
node scripts/smoke-review.mjs
node scripts/smoke-retention.mjs
```

They cover resolution and refusal, the single attempt for a failed reviewer, a
fallback that also fails, one that cannot start, a completed reviewer and a
cancelled run starting none, the adjudicator's own attempt, and the retained
record that keeps both attempts. None of them starts inference or touches the
network.

### Discarded output is a failed attempt (C5)

A reviewer can finish its turn and still deliver nothing this tool can read: a
paragraph of thinking-style prose instead of the result object, a missing or
repeated marker, JSON that does not parse, or an object bound to a different
review. That output is discarded whole, and the attempt that produced it counts
as a failure. It reports incomplete coverage, and if that reviewer's tier has a
configured fallback, it gets its one attempt.

This is the same check that decides whether the output can be used at all, asked
one step earlier so the answer arrives beside the reviewer rather than after
every reviewer has finished. It applies to the adjudicator too.

**It stops at that outer object, and never reaches the review's judgment about
your pull request.** These are not failures and are never retried:

- A candidate the evidence boundary refuses, for a quote that does not match the
  source, an anchor that is not on a changed line, or confidence below the bar.
  Other candidates in the same output are still kept and still adjudicated.
- An output that reports no candidate at all. That is an answer, not a failure.
  Retrying it would spend a second model on manufacturing a finding.
- An output whose every candidate is refused. Retrying that would run a model
  again until the gate accepted something.
- A repaired clipped quotation, which stays a note on a surviving candidate.
- A candidate the adjudicator rejects on the merits.

A reviewer whose output was discarded now reports `incomplete` whether or not a
fallback is configured, because the attempt failed either way. With no fallback
configured nothing is retried and nothing extra is spent, and the review reports
the same incomplete coverage it always did, now attributed to the reviewer that
caused it.

### Models with no configurable reasoning effort (C4)

```text
/pr-review models
/pr-review-config lightModel=claude-haiku-4.5
/pr-review-config show
```

Not every subscription model takes a reasoning effort. `/pr-review models` prints
`reasoning=(not configurable)` for those that do not, and on the development
subscription `claude-haiku-4.5` is one of them.

A tier whose resolved model is one of those takes **no** effort. It does not
inherit the effort a neighbouring tier, a trusted project or the ambient session
would otherwise supply, because that effort is not one the model can hold.
`show` and the pre-execution report print `reasoning=(not configurable) [model]`
for such a tier, so the origin says the model decided it rather than a
configuration layer. The same rule applies to a tier's optional fallback model:
the tier's own effort reaches its fallback the way an inherited effort reaches a
tier, so a fallback model that advertises none does not receive it either.

**An effort you set yourself is still validated and still refused.**
`lightEffort=low` on a model that supports no effort is an explicit setting, so
it is an error that changes nothing, exactly like an unsupported effort on a
model that does support some. Nothing is dropped, substituted or lowered to make
an explicit value fit; unset it instead. Inheritance is likewise unchanged for
every model that does advertise efforts: an inherited effort such a model cannot
support still refuses the review rather than being quietly lowered.

Before this, a model with no configurable effort could not serve a tier at all
whenever any effort reached it, which in practice meant whenever any other tier
was configured. That made the cheapest models unusable for the light tier, which
is the one balanced and full reviews run their overview reviewer on.

Reproduce the controlled and native probes:

```sh
node scripts/smoke-config.mjs
node scripts/smoke-review.mjs
node scripts/smoke-fixture.mjs
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=gpt-5.6-terra PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-config-runtime.mjs
```

The native probe needs your subscription to offer at least one model that
advertises no configurable reasoning effort; it stores that model as the heavy
tier, reloads the extension, dispatches a real review that displays the
assignment, and then does the same on the fallback surface. It spends no
inference credits and restores your personal configuration afterwards.

### Two-reviewer fixture experiment (F2)

After checking `/pr-review models`, supply **all four settings**:

```text
/pr-review fixture model1=claude-sonnet-5 effort1=low model2=gpt-5.6-terra effort2=high
```

These are example assignments demonstrated on the development account, not
defaults. Choose two available models and two distinct supported reasoning
levels. Missing, repeated, unknown, disabled, or unsupported settings are
rejected without substitution. No personal configuration is saved yet.

This command uses Copilot credits. It reads only the bundled original
`extensions/pr-review/fixtures/checkout.js`, not your checkout's PR code.
The plugin creates an owned SDK stdio runtime with two independent reviewer
sessions. Command dispatch returns immediately so you can issue
`/pr-review cancel`; progress and results arrive in the timeline. The plugin
displays effective assignments before sending prompts, then each reviewer's
starting/active/completed state and output. Runtime model/reasoning usage
must match the assignments or execution is reported as incomplete. A final
`F2 evidence:` JSON line records outputs, session IDs, usage, and turn timestamps
for reproduction, after runtime cleanup. Dispatch success means the command
was accepted, not that the review completed. Read the final evidence's
`complete`, `cancelled`, and `cleanupErrors` fields. It is **not** a retained
review result or a validated finding format.

Both reviewers are awaited without a review timeout. Normal completion stops the
runtime in `finally`. Manual cancellation force-stops it immediately, even when
it cannot acknowledge an abort RPC; incomplete coverage remains visible.
Failed reviewers retain partial output and do not discard the other reviewer's
successful output.

### Read-only and lifecycle experiments (F3)

Use the same four explicit settings with these commands:

```text
/pr-review adversarial model1=claude-sonnet-5 effort1=low model2=gpt-5.6-terra effort2=high
/pr-review failure model1=claude-sonnet-5 effort1=low model2=gpt-5.6-terra effort2=high
/pr-review cancel
```

`adversarial` asserts an empty initialized tool set, then directly attempts six
forbidden tool invocations through the runtime pipeline before sending an
original prompt-injection fixture. The observed `denied` results come from a
code-owned pre-tool hook, not a model promising to avoid tools. Probe arguments
are inert (including an empty patch); argument-validation errors are not
accepted as denial evidence.

`failure` injects an error after the first reviewer's turn starts, aborts that
reviewer, and retains the other's result with `complete: false`. These two
commands emit `F3 evidence:` JSON. Their model outputs remain unvalidated.

A single in-flight connection probe runs at most once per second while work is
active. Only an actual RPC failure interrupts the run; no elapsed duration
causes failure, cancellation, substitution, or retry. A hung but connected
reviewer may wait indefinitely until manual cancellation.

Do **not** use `copilot -p '/pr-review status'` as a substitute. On the observed
CLI, prompt mode treated this as a model prompt rather than dispatching the
extension command. The surrounding assistant may then attempt unrelated work.

During development, load the checkout without installing:

```sh
copilot --experimental --plugin-dir .
```

Restart the CLI after editing the extension. For an installed copy, reinstall
with `copilot plugin install "$(pwd)"` before restarting; installed plugins are cached.
Remove the installed plugin with `copilot plugin uninstall copilot-pr-review`.

## Runtime boundary

This prototype uses the SDK bundled with the CLI; no npm install or provider
credentials are needed. Experimental extension APIs may change. The runtime
candidate is Copilot CLI only; this is not a VS Code compatibility claim.
Local installation and interactive command dispatch have been demonstrated on
Copilot CLI 1.0.83, macOS arm64. That version warns that direct local installs
are deprecated for a future release; no marketplace packaging is implemented yet.

Two concurrent reviewers and explicit model/reasoning selection have been
demonstrated through SDK command dispatch. Agent factories were unavailable in
the observed session, so the candidate uses plugin-owned SDK sessions instead.
The SDK resolves its bundled runtime; no machine-specific SDK path is shipped.

Reviewer sessions disable configuration discovery and deny pre-tool hooks.
The Q4 adjudicator and every fixture reviewer session assert an empty
initialized tool set and deny all permission requests. PR reviewers offer
only `builtin:view`, `builtin:grep`, and `builtin:glob`; their hook denies every
other tool, and their permission handler rejects reads whose real path escapes
the verified checkout root, resolved as the operating system resolves it, so the
handler — not a model promise — is the confinement point. A read refused because
the path does not exist inside the checkout says so, and every other refusal is
unchanged. Actual hook denials, native exclusion of unoffered tools,
out-of-root read rejection, explicit failure handling, cancellation (including a
suspended runtime), extension reload, and abrupt runtime/extension/parent loss
have been demonstrated on the recorded CLI/macOS environment.
This is model capability isolation, **not an OS filesystem sandbox**: a granted
read tool is constrained by plugin-owned path checks, not by the operating
system.

The plugin-owned stdio integration is selected for the next increments.
Signal/parent-EOF handlers force-stop owned work without waiting for parent
logging. An abruptly lost parent cannot receive a final report; there is no
clean-review claim or publication. Normal SDK transcripts may persist, and
forced termination does not guarantee a final transcript flush. The prototype
can capture PRs, bind source context, resolve personal and explicitly trusted
project configuration, run the quick, balanced and full specialists or
deep's single integrated reviewer, attempt one configured fallback for a reviewer
whose own execution failed, and validate/deduplicate findings, but cannot execute project safeguards. It does not restrict or change the model of the surrounding Copilot session. The SDK may
retain its own session transcripts; no plugin review archive is implemented.

No upstream source has been copied, and a line-level audit against the published
upstream package confirms it rather than assuming it. The licensing assessment is
settled: upstream declares MIT and publishes no licence text or copyright notice,
so no upstream source may be copied into this port. See
[docs/upstream-licensing.md](docs/upstream-licensing.md) for the evidence and the
rule.

## Reproduce the runtime smoke exercise

After installing the current checkout, run the no-inference probes using
Node.js 22+ and the SDK bundled with the installed CLI (adjust its path):

```sh
node scripts/smoke-fixture.mjs
node scripts/smoke-target.mjs
node scripts/smoke-context.mjs
node scripts/smoke-review.mjs
node scripts/smoke-findings.mjs
node scripts/smoke-config.mjs
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/smoke-runtime.mjs
```

The pure probes exercise fixture guards/lifecycle, PR capture/gates,
revision-bound context assembly, and quick/balanced/full/deep orchestration
without a runtime, including mode parsing, all four reviewer topologies, tier
resolution, the balanced minor-finding cap, and full's and deep's uncapped
policy. The findings probe exercises strict
schema/provenance gates, changed-line anchors, the broken-code citation and the
citation refusals that still apply to it, renamed/added/deleted files,
pure insertion/deletion context, cross-file deduplication, and degraded coverage. Its semantic
accept/reject decisions are explicit test doubles, not live-model evidence.
The context probe covers
diff parsing, blob and hunk verification, window binding, an advancing PR, and
a decoy working-tree file at the reviewed path. The runtime probe discovers the **installed** extension, dispatches status/help,
model listing, and invalid settings, and asserts explicit errors without model
turns. It requires authenticated model-list access. It uses configuration
discovery to find plugins, so run it only with trusted installed configuration.
It stops its runtime in `finally`, including on failure.

To exercise Q1 through the installed plugin, use the same CLI/SDK settings with
`node scripts/smoke-runtime.mjs --targets`. This runs controlled `gh` responses
in a child-only PATH, native confirmation acceptance/decline, lifecycle/skip
gates, explicit failures, and a session-directory change after extension startup.
Its session directory is a Git checkout on another branch whose committed and
uncommitted `example.js` differs from the reviewed revision; the harness asserts
that the bound context carries the served blob identities instead. It also
captures a fixture PR that then advances, and asserts the next capture stops
explicitly rather than reviewing the moved head against the captured diff.
Its capture dispatches all use `--capture-only`. With `--startup` it also
dispatches a skipped draft in quick, balanced, full and deep modes, asserting the
displayed per-reviewer assignments, that no reviewer starts, and a settled
`coverage: "not-started"` result without inference.
The harness asserts read-only requests, no model turns, and no source changes.
The `scripts/fixtures/gh` executable is a test double, not a shipped runtime
dependency; do not add its directory to your normal PATH.

Use `node scripts/smoke-runtime.mjs --target-live` separately for real `gh`
requests through the installed plugin. It creates an empty temporary Git
repository pointing to `github/copilot-sdk`, captures public merged PR #2543
with a pinned expected head/diff fingerprint and pinned head/base blob
identities, window ranges, and context SHA-256, checks the bot skip on #2545,
and verifies the unrelated local checkout stays unchanged. It also exercises
the closed gate without an elicitation UI. No PR is created and no source is
checked out; the temporary repository is removed afterwards. This fixture is
used because this project's repository had no PRs at the Q1 checkpoint.
Both Q1 runtime exercises are no-inference and require the trusted installed
configuration/model-list access described above. The live exercise additionally
requires `gh` authentication and those public PRs to remain accessible.

To exercise actual concurrent inference as well:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_HEAVY_MODEL=claude-sonnet-5 PR_REVIEW_HEAVY_EFFORT=high \
node scripts/smoke-runtime.mjs --targets --quick
```

This Q3 probe runs explicit quick settings, the bare alias inheriting a configured
parent model/effort, and cancellation after all three reviewers become active.
It asserts actual three-way execution overlap, subscription usage, assignments
before dispatch, target binding, duplicate-run rejection, incomplete cancellation,
owned-process exit, and an unchanged checkout. Replace `--targets` with
`--target-live` to use the pinned public PR through real GitHub GETs. Do not
combine the stub and live variants. Adding `--quick` is inference-spending;
the probe variants without it still start no reviewers. There is no balanced or
full harness probe: their execution is demonstrated by the controlled suites,
the no-inference installed dispatch above, and the review each increment's own
pull request receives. Any further live review needs its own explicit
authorization.

The controlled quick target is now synthetic PR 12, an original four-line
`total.js` multiplication-to-addition regression with an unchanged contract.
It requires an accepted finding at the changed expression and additionally
cancels an active validation session, checking owned-process exit. This is real
installed-plugin inference over controlled GitHub responses, not a real GitHub
PR. The live variant still uses public `github/copilot-sdk#2543`; it checks
pipeline results without requiring a defect to exist. Real malformed/unsupported
outputs must remain rejected rather than being repaired to make the probe pass.

For a real positive regression target, replace `--targets` with
`--regression-live`. This captures historical public `ptitSeb/box64#3902` at
pinned head/base/diff/context identities, requires a finding on its changed
normalization/CPUID code, and exercises active validation cancellation.
Its later fix, `ptitSeb/box64#3963`, independently corroborates the regression but
is not supplied to the plugin reviewers. Only captured PR source is used as
review input; no third-party code is copied into the bundled fixtures. Run this
variant separately from the other target variants. `gpt-5.6-terra` with `high`
effort is the Q4 demonstration assignment, not a product default or fallback.

### Real integration test: review a real pull request

The probes above stop short of a real end-to-end run: most use test doubles,
and the ones that do not, the `--target-live` variants and the inference
probes, still exercise single pieces against a synthetic or borrowed target.
None of them reviews a real pull request of this repository through the
installed plugin. This does:

```sh
gh pr checkout NUMBER
copilot plugin install "$(pwd)"
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
node scripts/dogfood-review.mjs NUMBER --all --no-comment
```

Check out before installing, never the other way round. `copilot plugin
install` copies the working tree into the plugin cache, so installing first
installs whatever was checked out at the time. The revision gate only checks
that the *checkout* is at the pull request head, so a stale installed copy
would still be reviewed and reported as a passing integration test.

It dispatches `/pr-review NUMBER --all --no-comment` through the SDK's command
RPC, so the real extension, runtime, models, `gh` requests, revision gate and
confined read tools all take part. `copilot -p "/pr-review NUMBER"` is **not** a
substitute: prompt mode starts an ambient model turn instead of dispatching the
command. Every argument after the number is passed through, so add a mode flag
when you want one: without it the runner takes the default, balanced.

Derive the SDK path instead of pinning a version. Old packages under
`~/.copilot/pkg/` are never pruned, so a pinned path keeps resolving after a
`copilot update` and silently drives a stale SDK against a newer CLI.
`copilot --version` is the only reliable source of the running version: on the
development host `command -v copilot` resolves into a Homebrew cask directory
labelled `1.0.48` while the CLI reports `1.0.83`.

The runner refuses to start unless local `HEAD` is the pull request head and no
tracked file is modified, and it refuses `--comment`, so it can never publish.
It prints the whole plugin timeline, then the settled outcome and the credit
cost the runtime reported.

**It spends real credits, and doc-heavy pull requests are expensive.** Reviewing
this project's own 27-file pull request #3 with five balanced reviewers on
`gpt-5.6-terra` at `high` cost 414.14627 reported AI credits; the 4-file pull
request #4 cost 79.82605. Full adds a sixth reviewer, so it costs more again on
the same diff. Choose the mode and the tier assignments deliberately before
dispatching.

The original F2 inference probe remains available separately:

```sh
COPILOT_CLI_PATH="$(command -v copilot)" \
COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
PR_REVIEW_MODEL_1=claude-sonnet-5 PR_REVIEW_EFFORT_1=low \
PR_REVIEW_MODEL_2=gpt-5.6-terra PR_REVIEW_EFFORT_2=high \
node scripts/smoke-runtime.mjs --fixture
```

The opt-in probe requires two different reviewer session IDs, positive execution
overlap, matching actual subscription-model/reasoning usage, visible progress
and results, and unchanged parent model/reasoning. It does not assert the
model-generated findings are correct; validation/deduplication belong to Q4.

Replace `--fixture` with `--f3` to run the complete F2/F3 exercise. It additionally
checks native tool denials, failure retention, startup/active cancellation,
cancellation after `SIGSTOP`, owned-runtime disconnection, extension reload,
abrupt extension loss, and parent loss. The macOS/POSIX harness identifies only
its own descendant PIDs before sending signals and checks those PIDs actually
exit rather than being orphaned. Its five-second process-exit assertion starts
only after intervention; it never bounds a review.

The final parent-loss probe deliberately breaks the smoke SDK's transport, so
its printed connection-closed cleanup errors are expected. Unexpected smoke
runtime cleanup errors fail the harness; owned-runtime-loss errors are asserted
in the incomplete-review evidence.
`HARNESS CLEANUP` output means the harness had to kill leftover work and is
**not** successful plugin-cleanup evidence. The exercise spends subscription
credits and uses trusted installed configuration; it does not signal unrelated
Copilot sessions.
