# Project safeguards with `--verify`

**This is the `--verify` guide. It is documentation of record, not an archive.**
`README.md` summarises what `--verify` does and points here; everything about
how it behaves is kept current in this file.

It lives under `docs/` for the same reason the two archives do. This project's
own safeguard discovery reads the markdown files at the root of a checkout and
skips any one over 65536 bytes, silently, so a `README.md` that crosses that cap
is a README this tool can no longer read. Discovery does not recurse into a
subdirectory, so a file here is never a candidate it has to skip for size. The
section below was 12922 bytes of a 64885-byte README with 651 bytes spare.

Two things changed on the way here, and nothing else did. The section's own
`##` heading became this file's title, and its four `###` step headings became
`##`. The text is otherwise exactly as `README.md` carried it.

A link below that names `SCOPE.md`, `ROADMAP.md`, `AGENTS.md` or a
`docs/`-prefixed file means that path **relative to the repository root**, one
level up from here.

---

Ordinary review is read-only. `--verify` opts into running your project's
existing safeguards, such as its tests, its compiler or its linter, so that you
have evidence beside the review rather than reading alone.

```text
/pr-review 123 --verify --no-comment
/pr-review 123 --deep --verify --all --no-comment
```

`--verify` is orthogonal to the mode and posting flags. It cannot be combined
with `--capture-only`, which stops before any reviewer. **It is deliberately not
a configuration key**: no saved personal setting and no trusted project file can
turn verification on, which keeps the decision to run a repository's own
commands an explicit one made at the invocation.

There are four steps, and you are between the third and the fourth.

## 1. A stricter preflight

`--verify` adds two conditions to the revision gate every review already passes:

- the current branch is the pull request's head branch, so a detached `HEAD` at
  the right commit is still refused;
- no path in the checkout is untracked.

Both exist because commands are about to run here. Artifacts a test run leaves
behind could not afterwards be told apart from files that were already lying
around, and a detached `HEAD` is the reviewed revision without being a branch
anything can land on. Ignored paths are not untracked, so an ordinary checkout
with its dependencies and build output installed still passes.

A refusal names the flag that applied it, so a checkout that is perfectly
reviewable without `--verify` does not look broken, and it repeats the flag in
the command it suggests. Nothing is repaired automatically: the gate does not
switch branches, pull, stash or clean, and an untracked refusal tells you to
remove or ignore those paths yourself.

## 2. Discovery

The run reads the markdown files at the root of your checkout and presents the
safeguard commands they declare, each with the file it came from:

```text
V1b safeguard discovery found 3 command(s) declared in this project's instructions.
  npm test  [declared in AGENTS.md]
  npm run typecheck  [declared in CONTRIBUTING.md]
  npm install  [declared in AGENTS.md]  not offered: `install` is not a check: a safeguard never installs, migrates, deploys, publishes, creates, cleans, serves, formats in place or watches
Read: AGENTS.md, CLAUDE.md, CONTRIBUTING.md. Skipped: NOTES.md (exceeds 65536 bytes).
2 of 3 can be run by this tool. The rest are not offered at all. A refusal is a rule about
the kind of command it is, and passing those rules is never a judgement that a command is
safe to run.
Nothing here has run. You are asked next which of these may run in this checkout; an
approved command runs before any reviewer starts, no reviewer receives its output, and
this stays an ordinary review of the selected mode.
```

**The source is your project's own instructions, and only those.** A package
manifest's scripts and a guess from your stack are not consulted, so a project
that declares nothing in prose finds nothing here.

Reading is confined to the checkout root: no subdirectory, no symbolic link
followed out of it, nothing that is not markdown, nothing over 65536 bytes, and
a total budget for the run. Every file read and every candidate skipped is
named, because a source dropped in silence cannot be told apart from a project
that documented nothing. If a file of yours starts appearing in the skipped
list, it has crossed the size cap and the tool can no longer read it.

A model reads the prose and code decides what its answer may say. The schema,
the binding, the command text and above all the file a command is attributed to
are checked before anything reaches your screen: a command can only cite a file
this run actually read, and must be a single line with no control characters.
Every command the pass read is reported, including one this tool refuses to run,
because a command that vanished from the report could not be told apart from one
your project never declared.

Discovery is not a reviewer. It holds no tool, is never given the checkout to
read, takes no configured fallback, and is not part of review coverage. A pass
that fails is reported as itself and the review continues. A checkout root with
no markdown at all spends no model turn; everything else costs one extra model
turn compared to the same review without the flag.

The files are read at the pull request's head, so a branch can change what they
say. For this release that is accepted rather than mitigated: nothing discovered
can act until you approve it in that same run.

## 3. Approval

```text
V1c safeguard approval: 1 of 2 offered command(s) approved.
  npm test  [declared in AGENTS.md]
These run now, in this checkout, before any reviewer starts.
Nothing else approves a command: there is no flag, no configuration key and no saved
posting setting that can, and an approval does not outlive the run that recorded it.
```

Approval is per command, so a fast check can be taken without the suite that
takes half an hour. Each choice is bound to the invocation that discovered the
list, so an answer can never approve a command by its position in some other
run.

**Approval comes from that question and from nowhere else.** No flag approves
everything. No personal setting and no trusted project file pre-approves
anything. `--comment`, `--all` and a saved `autoPostReviews=true` grant posting
authority and no approval whatsoever.

A host with no elicitation UI approves nothing and says so, and there is
deliberately nothing to suggest instead. Declining, answering without naming a
command, or returning an answer this run cannot account for all approve nothing
and leave the reviewers to run: approval grounds no finding, so an unanswered
question cannot make the review less trustworthy. None of them is incomplete
coverage. Cancelling the question cancels the run, before any reviewer starts.

**An answer that names no command is reported apart from a decline**, because
they are different events. If your selection does not reach the run, you see
this rather than a refusal, and the review continues as an ordinary review:

```text
V1c safeguard approval: the answer named none of the 2 offered command(s), so nothing
runs. If you meant to approve one, it did not reach this run; rerun the review to be
asked again.
```

The two were once reported identically, and a real run lost its approval that
way: the person selected a command, the run recorded that none was approved, and
nothing on screen distinguished that from their having said no.

**Press Space to select, then Enter to submit.** The question is a multi-select,
and the terminal UI toggles a command only on Space. Up and down move the
highlight without selecting anything, and Enter submits whatever is currently
toggled. Pressing Enter on a merely highlighted command therefore submits an
empty answer, which is a valid way of approving nothing and reads exactly like
the message above. Three real reviews of this project approved nothing for that
reason before the question started saying so. An empty answer stays a real
answer, deliberately: nothing here requires you to select something, because the
safe reply to "may I run this?" is no.

The approval is not written to the retained result, so a publish-later of that
result carries no approval and never could.

Only what this tool would actually run is offered. A command it refuses is
already on your screen with the reason, and asking permission it could not act
on would be theatre.

## 4. Execution

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
it runs as you, in your checkout, with the dependencies you already have.
Approve one only if you would run it yourself.

**There is no shell anywhere in the path.** A command is split on whitespace and
handed to the operating system as an argument list, so a line carrying anything
only a shell could interpret is refused rather than run: an `&&` chain, a pipe,
a redirect, a variable, a glob, a quoted argument, a loop. That refusal is what
makes every other rule worth anything, because against a shell a first word
tells you nothing about what a line will do. If your project declares `npm run
lint && npm test`, the answer is to declare two lines; this tool will not open a
shell for it and will not invent a script to fix it for you.

On top of that, code refuses a command that is not a check at all: anything that
installs, migrates, deploys, publishes, creates, cleans, serves, formats in
place, auto-fixes or watches, and any program that changes the machine, moves
data over the network, drives version control, or provisions and deploys. Names
are matched without regard to letter case, because a case-insensitive filesystem
would otherwise run `Curl` after the rule refused `curl`. Watching is the sharp
case: this tool imposes no timeout, so an approved watch command would have
nothing to end it. **The rule is a heuristic**, it will refuse checks that were
perfectly reasonable, and surviving it is never a judgement that a command is
safe.

Code also checks that a command really appears in the file it cites, as a
command of its own, so an invented command cannot borrow a real file's name.
`npm run test` is not carved out of `npm run test:unit`. **That check accepts a
prefix, deliberately**, so `npm test` passes as cited from a file that declares
`npm test --fix`. The alternative is to demand the match reach the end of its
line, which refuses the ordinary way projects declare commands in prose. Three
things bound what a prefix can do: the offer shows the exact command that would
run rather than the line it came from; the rules above run first, so the shapes
they name are refused whatever arguments follow, and `--fix` is refused outright
as an auto-fix; and with no shell, a truncated line is still one program with an
argument list, re-checked immediately before it starts.

Commands run one at a time in the order they were discovered. Output is captured
with a bound per stream and the end of it is shown, which is where a failing
suite says what failed. Reaching the bound truncates the capture and says so,
and never kills a command that is otherwise passing. Standard input is closed,
so a command that stops to ask a question fails at once instead of waiting
forever on a review that has no timeout to rescue it.

One `git status --porcelain` afterwards reports what running project code left
behind. The preflight already proved the tree was clean, so anything named there
was left by a safeguard. **Nothing is reverted, stashed or cleaned.** That status
read belongs to the review, so cancelling stops it too, and the run then says
the checkout could not be inspected rather than waiting on it.

## What a safeguard cannot do

**A safeguard grounds no finding.** No reviewer ever receives safeguard output,
so a failing suite is reported loudly to you and leaves the review's own
coverage exactly as it was. That output is text produced by the code under
review, and handing it to a reviewer would open a prompt-injection surface that
has nothing to do with running a process. It grounds claims for the person who
approved the command, which is who decides what a red suite means.

The retained result says nothing about what ran, for the same reason discovery
and approval are absent from it: what a safeguard did changes nothing about what
may be published later.

One consequence is worth stating plainly. An approved safeguard may leave
artifacts in your checkout, and a reviewer reads that checkout, so **a reviewer
can read a file a safeguard wrote. It cannot report one.** Every citation
resolves against the head and base blobs fetched from GitHub for the reviewed
commit, and a file outside that bound source is refused as outside provenance.

The checkout is not re-checked for cleanliness after execution, and that is
deliberate. These commands are expected to write artifacts, and re-asserting
cleanliness would refuse a review because your own approved tests wrote a
coverage file. The reviewer prompt is worded accordingly: it says the checkout's
`HEAD` was verified before the review started, and never that the working tree
still equals it.
