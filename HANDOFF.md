# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and the open pull requests before editing anything. Scope is
authoritative; the roadmap records demonstrated evidence and what remains open.
Do not rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration. Keep what you demonstrate apart from what you
assume, in the roadmap and in your final report.

## Where things stand

`main` is at `51f5cb1`, working tree clean, nothing uncommitted. `K1` (#45), the
archive-K1 documentation fix (#46), and a follow-up correction to this file's
own stale `#46` note (#47) are all merged. No roadmap entry is live, nothing is
scheduled from `ROADMAP.md`'s "Recorded, not scheduled" backlog, and no
increment table row exists for anything below — **do not pick one of those
yourself; this session has a different, user-assigned task instead.** Open
pull requests #1 and #2 remain the synthetic "do not merge" playgrounds; leave
them alone. Verify with `git status`, `git log --oneline -5` and `gh pr list
--state open`.

## This session's task: plan versioning and a marketplace listing

The user asked, outside the `ROADMAP.md` backlog, to **plan** (not yet build)
two things:

1. Real semver for this plugin. `plugin.json`'s `version` has been `0.0.1`
   since the project started, and a release process modeled on two sibling
   projects the same user owns.
2. Listing this plugin on the user's Copilot CLI plugin marketplace, the same
   way those two sibling projects are listed.

**This is a planning increment, like `G1` was: produce a proposal, put its
decision points to the user one at a time, and do not build automation,
push a tag, cut a release, or write to another repository until the user has
chosen.** Do not treat any of the research below as authorization to act on it.

### The two precedents, inspected 2026-09-14 — reverify before relying on them

Both are public repos the user owns. State moves; re-check tags, workflows and
file contents rather than trusting this summary if time has passed.

**`xpepper/pr-review-gemini`** (tags to `v0.4.0`, has GitHub Releases): full
automation.
- `package.json` is the canonical version; `plugin.json`, `mcp.json`, and
  `skills/gem-pr-review/SKILL.md`'s frontmatter must carry the identical
  version, checked for drift by `scripts/bump-version.mjs --check`.
- `scripts/bump-version.mjs` (targets `auto|patch|minor|major|x.y.z`; flags
  `--check`, `--dry-run`, `--changelog`, `--tag`, `--release`) computes the
  bump from conventional commits since the last tag: a `BREAKING CHANGE:`
  footer or `!` after the type → major, `feat:` → minor, everything else →
  patch. `--release` writes all manifests atomically with rollback on
  failure, prepends `CHANGELOG.md`, commits `chore(release): vN`, and tags.
- `.github/workflows/release.yml`: pushing a `v*` tag runs a `verify` job
  (manifest sync, tag matches `package.json`'s version, full test suite).
  Publishing the GitHub Release is `workflow_dispatch`-only and explicitly
  refuses to overwrite an existing release for that tag.
- `docs/release.md` documents all of the above, and states plainly that the
  Copilot marketplace entry must be updated **by hand** at every release
  (both the entry's `version` and its `source.ref` pin); a separate GitHub
  Action listing tracks the tag automatically instead.

**`xpepper/pr-review-glm`** (tags to `v0.2.6`, no GitHub Releases objects, no
`.github/workflows`, **no `package.json`**): the lighter model, and the closer
fit to this repo's own settled "no `package.json`, no dependency, no build
step" constraint (`ROADMAP.md`'s CI section).
- `plugin.json` is the only version-bearing manifest. No bump script or
  changelog generator was found; release looks like a manual `git tag` plus a
  hand-edited marketplace entry.
- Its own controlled suite includes a **live** network check,
  `tests/smoke-m1.mjs` (unit-tested by `tests/marketplace.test.mjs`'s
  `checkMarketplaceConsistency()`): it fetches the marketplace manifest from
  `xpepper/copilot-plugins` over the network at test time and asserts, for its
  own entry: it exists; `source.repo` matches its own repo; `source.path` is
  `"."`; the entry's `version` equals `plugin.json`'s version; and
  `source.ref` equals `v<version>`. Zero dependencies, plain `node:test`.
  (Naming note: this repo already has an increment called `M1`, unrelated to
  glm's `M1` suite — a new ID here would need to avoid that collision, the
  user's call as with every other mnemonic ID.)

**`xpepper/copilot-plugins`** is the marketplace index itself (public, tiny:
just `README.md` and `.github/plugin/marketplace.json`).
- Hosting model, from its `README.md`: real plugins live in their own repos
  and are referenced by `{"source": "github", "repo": "owner/repo", "path":
  ".", "ref": "vX.Y.Z"}`, pinned to a release tag; installing pulls from the
  plugin's own repo at that tag. A `./plugins/<name>` form for small packs
  hosted directly in the index also exists but is unused so far.
- The marketplace's own `name` field is `xpepper-copilot-plugins` — **a
  marketplace literally named `copilot-plugins` collides with the CLI's own
  built-in default marketplace of that name, verified live on Copilot CLI
  1.0.83.** Do not propose that name for anything.
- `.github/plugin/marketplace.json`'s `plugins[]` array currently holds two
  entries, `z-pr-review` and `gem-pr-review`, each shaped like:
  ```json
  {
    "name": "z-pr-review",
    "description": "...",
    "version": "0.2.6",
    "author": {"name": "Pietro Di Bello", "url": "https://github.com/xpepper"},
    "homepage": "https://github.com/xpepper/pr-review-glm",
    "keywords": ["pr-review", "code-review", "copilot", "github", "tiered-review"],
    "license": "MIT",
    "repository": "https://github.com/xpepper/pr-review-glm",
    "source": {"source": "github", "repo": "xpepper/pr-review-glm", "path": ".", "ref": "v0.2.6"}
  }
  ```
- `README.md` states the versioning discipline: every release that bumps a
  plugin's own `plugin.json` version must also bump the matching marketplace
  entry (name, version, and `source.ref` together), one line, by hand in that
  repo. No `copilot-pr-review` entry exists yet — no name collision found.

### This repo's current state, for contrast

`plugin.json`'s `name` is already `copilot-pr-review`, matching the GitHub
repo name (`xpepper/copilot-pr-review`) — unlike gemini/glm, which each picked
a short name distinct from their repo name. `version` is `0.0.1`. There is no
`package.json`, no `CHANGELOG.md`, no release workflow, and no git tag exists
yet (`git tag -l` is empty).

### Decision points to put to the user, one at a time — do not decide these yourself

1. **Which release-process model to adopt.** Gemini's full automation needs
   introducing a `package.json` — a dependency-manifest file this repo has
   deliberately never had (`ROADMAP.md`'s CI section: "no `package.json`, no
   dependency and no build step") — plus a bump script, changelog generation,
   and a release workflow. glm's lighter model needs none of that, at the
   cost of a manual tag/marketplace-edit step and no generated changelog. If
   the gemini model is proposed, flag explicitly that it reopens the
   no-`package.json` decision; that is exactly the kind of settled-constraint
   change `AGENTS.md` and this file require asking about rather than assuming.
2. **Whether this repo's actual commit history is conventional-commit-shaped
   enough** for automatic bump-from-commits, if the gemini model is chosen.
   `source-control.md`'s format is conventional commits, but verify a real
   sample rather than assuming compliance.
3. **The marketplace-facing plugin name.** `copilot-pr-review` (current) is
   plausible since it matches the repo, but confirm with the user rather than
   assuming — a name in the shared `marketplace.json` needs to stay distinct
   from every other entry there, forever.
4. **Whether, and when, to actually open a pull request against
   `xpepper/copilot-plugins`.** That is a separate repository, and writing to
   it is outward-facing and hard to casually reverse. Do not do this without
   explicit authorization in the session that does it, and not before this
   repo has at least one real tagged release for the entry to point at.
5. **Whether cutting a release (pushing a tag, creating a GitHub Release)
   counts as a "publish" under this repo's standing "findings stay local
   unless asked" / "ask before outward-facing actions" norm.** Treat it as
   yes — needing explicit authorization each time — unless the user says
   otherwise.

### Acceptance criteria for this increment

A plan document (e.g. `docs/release-and-marketplace-plan.md`) recording the
proposal for both pieces and the outcome of putting the five decisions above
to the user, following the `G1` pattern: analysis and proposal now, real
implementation scheduled as its own separate increment(s) afterward, each with
its own branch, PR, and (if it changes behavior under `extensions/` or
`scripts/`) its own installed-plugin review. Land the plan document itself
through the normal branch+PR flow; it is documentation-only, so a plugin
review of that PR is the user's call, not a requirement, per `AGENTS.md`.
**Do not push a git tag, create a GitHub Release, add a `package.json`, or
open a PR on `xpepper/copilot-plugins` in this session** unless the user
explicitly authorizes that specific action after seeing the plan.

## Validation

The controlled set is eighteen suites:

```sh
for s in findings review selection retention preview publication publish-later \
  checkout config context fixture target safeguards prior incremental revalidation \
  cost benchmark; do node scripts/smoke-$s.mjs; done
```

Also run `git diff --check`, the tracked-control-byte check CI runs, and
`collectInstructionFiles`, which must read all six root files and skip none.
Check new files for control bytes with plain `grep -rnP`, and build control
characters with `String.fromCharCode` rather than typing an escape. Measure
`ROADMAP.md` with `wc -c` before every commit.

## Runtime and settled constraints

CLI 1.0.83 remains the recorded runtime; direct local installs print a
deprecation warning. Every increment lands on a branch and a pull request, never
`main`; never amend published history or force-push. Findings stay local.
Do not add review timeouts, weaken the shell gate, use `fs.realpathSync` in
`read-only.mjs`, change `F6`'s marker unwrap, or treat a compaction event as a
retry or stop condition. `K1`'s reception is information only: no reviewer,
adjudicator, `I1c` verdict, retained record or published review may read it,
and a resolved thread is never evidence of a fix. GitHub review-thread ids are
matched by `fullDatabaseId` as strings, never by the deprecated `databaseId`.

Before ending, update `ROADMAP.md` with evidence and the exact next step, then
replace this file as the final repository edit, commit both on the branch you
are working on, push, and report what changed, what was verified and how, what
was not, and what remains, pointing here.
