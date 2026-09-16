# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and the open pull requests before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume.

## Where things stand

`H2` is built on branch `h2/help-orientation`, pull request #59, in eight
commits: `06548ae` moves the help text into an importable module, `c6095e0`
exports the parsers' flag lists, `86241c6` the behaviour, `e8baa84` the runtime
probe, `b7008be` CI, `5130629` the README, `4c2d43e` the roadmap, and the
records commit.

`/pr-review help` answers in 35 lines: the five modes, the options grouped by
the decision each one makes, and the lifecycle commands. The 155 lines it used
to print are behind `/pr-review help --all`, verbatim except a first line that
called this plugin a runtime feasibility prototype. A mistyped flag appends the
orientation, not the reference. `status` and a bare `/pr-review` are unchanged.
`ROADMAP.md`'s `H2` entry has the evidence. **Check whether #59 has merged**
(`gh pr list --state all --head h2/help-orientation`). If it has not, stop and
ask the user. Open pull requests #1 and #2 remain the synthetic "do not merge"
playgrounds; leave them alone.

#59 was reviewed once, at the standing authorization and with the user's
agreement to swap installs, on a direct install `diff -rq` showed identical to
the checkout: balanced, 119.146906 credits, 12 requests, 137.6 s of model work,
57.8 s elapsed, INCOMPLETE, 0 validated. **No reviewer raised a single
candidate.** Its only signal was unanimous and about evidence, not code: 3
coverage gaps and 2 caveats all said no installed-plugin execution of the new
dispatcher was in the captured evidence, reading back the limitation the
roadmap recorded. The user then authorized the probe that closes it, once its
cost was shown to be zero: `smoke-runtime.mjs --targets --startup` gave 94 PASS
lines at exit 0 against a verified-identical install, covering all six help
spellings including `help  --all`, and asserting **no model turns, subagents,
or tool executions**. The marketplace install was restored, identical to
`git archive v0.1.0`. Nothing was posted.

## This session's task: nothing is scheduled

**`H2` was the only thing the user scheduled on 2026-09-16, and it is done.**
The backlog is empty. **Ask the user what to work on; do not pick it yourself.**

`ROADMAP.md`'s "Recorded, not scheduled" items are candidates, not a queue:

- **A bare `/pr-review` and `/pr-review status` print a 57-line essay**, and
  `case ""` falls through to `status`, so that essay is the true first thing
  anybody sees. The user scoped it out of `H2` to keep the increment reviewable.
  Splitting `case ""` from `case "status"` is one line; giving `status` the
  orientation treatment is larger, and would rewrite the prose
  `smoke-runtime.mjs` pins in status/help pairs.
- **The posting flags are read as literals** at their `seen.has()` sites.
  `postingFlags` covers the membership checks, but `seen.has("--commnt")` would
  silently never match. Naming the three constants would close it.
- Unchanged and untouched by `H2`: `Q9`'s adjudication-citation item, and `P7`'s
  item about model prose holding `<!--` or `</sub>`.

### Caveats that are easy to miss

- **Sizes**: `README.md` is at 65527 bytes, **9 spare** against the 65536-byte
  cap. That is the tightest it has been: almost any README wording must now
  replace text of the same length. `H2` fitted its command-reference change by
  naming both `help` spellings in one row rather than two, 39 bytes instead of
  78, so that no documentation was cut to buy space. `ROADMAP.md` is at 64900,
  **636 spare**, even after `H2` moved `O2`'s 7187-byte section to the archive
  verbatim: this increment's own record took back most of what that freed.
  Archive before writing if the next entry does not fit, and never condense
  archived history. **Measure both with `wc -c` before every commit.**
  `collectInstructionFiles` skips an oversized file silently; that is what the
  CI invariant catches.
- **An increment's section contains `### The exact next step`**, so archiving
  the previous increment's section moves that subsection too. The live
  increment section supplies the new one.
- **Both help texts live only in `help.mjs`**, and `extension.mjs` does nothing
  but call `helpTextFor`. Keep it that way: `extension.mjs` calls `joinSession`
  at the top level, so anything defined there cannot be read by a controlled
  suite, which is how three false user-facing strings shipped.
- **`smoke-help.mjs` imports the parsers' own exported lists** (`modeFlags`,
  `postingFlags`, `settingKeys`, `supportedTargetFlags` and the six flag
  constants), so an undocumented flag fails CI. Its `orientationOmits` set
  excuses only aliases and is itself checked against the parsers. Do not
  replace those imports with a retyped list: an early version of this suite
  could not detect a control missing from the orientation, and only a mutation
  check caught it.
- **`supportedTargetFlags` is deliberately not named `targetFlags`**:
  `parseReviewArgs` has a local of that name for the tokens it forwards, and an
  import would shadow it silently.
- **`dogfood-review.mjs` refuses `--quiet`**, so the standing review can never
  show a quiet run's output. Still not demonstrated live.
- **The review runs the installed plugin, and `dogfood-review.mjs` only checks
  that some copy is running.** With the user's agreement: `copilot plugin
  uninstall copilot-pr-review`, `copilot plugin install "$(pwd)"`, then `diff
  -rq --exclude=.git ~/.copilot/installed-plugins/_direct/pr-review .` must
  print nothing. Afterwards `copilot plugin uninstall copilot-pr-review` and
  `copilot plugin install copilot-pr-review@xpepper-copilot-plugins`, and
  compare with `git archive v0.1.0`. Do not edit repository files while the
  review runs. The runner needs `COPILOT_CLI_PATH="$(command -v copilot)"` and
  `COPILOT_SDK_PATH="$HOME/.copilot/pkg/<platform>/<version>/copilot-sdk"`.
- **`smoke-runtime.mjs --targets --startup` spends nothing** and proves it, so
  an increment that changes dispatch can demonstrate itself on the installed
  plugin without credits. Every inference-spending path in that file is behind
  an explicit flag. Ask before any run that is not one of these.
- **Import cycles**: `preview.mjs` must not import `prior.mjs` or
  `incremental.mjs`.
- **Releasing follows `docs/release.md`**; every tag, release and index change
  needs the user's authorization in that session.
- In zsh, a bare `====` argument is expanded and aborts a chained command, an
  unquoted `--include=*.mjs` glob aborts `grep`, and `$PIPESTATUS` is
  `$pipestatus`; quote globs and check exit codes directly. On macOS `cat -A`
  does not exist and `sed -i` needs an argument, so prefer `perl -pi -e` or a
  temporary file, and the builtin `echo` interprets `\n`, so build file content
  with quoted heredocs. A guard regex that must match a heading like
  ``### `G1`'s references`` needs the apostrophe too.

## Validation

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost benchmark help; do node scripts/smoke-$s.mjs; done
```

Nineteen suites; `help` is the newest, and CI runs it. Also run `git diff
--check`, the tracked-control-byte check CI runs, and `collectInstructionFiles`,
which must read all six root files and skip none. Build control characters with
`String.fromCharCode` rather than typing an escape.

`scripts/smoke-runtime.mjs` is **not** in that loop: it needs
`COPILOT_SDK_PATH`, `COPILOT_CLI_PATH` and an installed plugin. Run it when the
increment changes dispatch or shipped text, and see the caveat above for the
invocation that costs nothing.

## Runtime and settled constraints

CLI **1.0.85** was the runtime `H2`'s review and probe ran on; the roadmap's
older entries record 1.0.83. Every increment lands on a branch and a pull
request, never `main`; never amend published history or force-push. Findings
stay local. Do not add review timeouts, weaken the shell gate, use
`fs.realpathSync` in `read-only.mjs`, change `F6`'s marker unwrap, or treat a
compaction event as a retry or stop condition. `K1`'s reception is information
only. GitHub review-thread ids are matched by `fullDatabaseId` as strings.

Before ending, update `ROADMAP.md` with evidence and the exact next step, then
replace this file as the final repository edit, commit both on your branch, push,
and report what changed, what was verified and how, what was not, and what
remains, pointing here.
