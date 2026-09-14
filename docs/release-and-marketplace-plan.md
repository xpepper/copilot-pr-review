# Versioning, releases and a marketplace listing: a plan

A planning session, not a numbered increment, in the pattern `G1`'s analysis
set: a proposal, and every decision in it put to the user one at a time. **Its
outcome schedules one increment, `S1`**, described at the end. Nothing here is
built yet, and nothing in it authorizes an outward-facing action: no tag has
been pushed, no GitHub Release created, no `package.json` added, and nothing
written to another repository.

The user asked for this outside the `ROADMAP.md` backlog on 2026-09-14: real
semantic versioning for this plugin, a release process modeled on two sibling
projects the same user owns, and a listing on the user's Copilot CLI plugin
marketplace the way those two are listed.

## What was inspected, 2026-09-14

Everything below was read from the repositories or the installed CLI on that
date. State in the other repositories moves; recheck it before relying on it.

### This repository

- `plugin.json` is the only version-bearing file: `name` is
  `copilot-pr-review`, `version` is `0.0.1`, unchanged since the project began.
- No git tag exists. No `package.json`, no `CHANGELOG.md`, no release workflow.
- Nothing under `extensions/` or `scripts/` reads `plugin.json`'s version, so
  a version bump changes no behaviour.
- `plugin.json`'s `name` is load-bearing, unlike its version: the runtime names
  the extension `plugin:copilot-pr-review:...`, and `scripts/dogfood-review.mjs`,
  `scripts/smoke-runtime.mjs`, `scripts/smoke-config-runtime.mjs` and
  `scripts/smoke-retention-runtime.mjs` find it by that prefix. `README.md`'s
  uninstall command names it too. **Renaming the plugin is therefore a change
  under `scripts/`**, needing its own installed-plugin review and a local
  reinstall.
- The ruleset `Increments land through reviewed pull requests` targets the
  default branch only. **Nothing restricts creating or pushing a tag**, and
  `.github/workflows/ci.yml` does not run on tags.
- The repository allows merge, squash and rebase merges, and a squash takes the
  pull request's title.
- Installed locally on Copilot CLI 1.0.83, `copilot plugin list` shows
  `copilot-pr-review (v0.0.1)` as a direct install, beside the two sibling
  plugins installed from the marketplace.

### Commit history shape

78 commits on `main`. The first 34, made directly on `main` up to
2026-09-07, are all conventional commits. **From pull request #3 onward, every
commit on `main` is a pull request's squash title**, and 41 of those 44 take the
form `ID: what it does (#N)`, for example `K1: a later review reports how the
earlier one was received (#45)`. Only #40, #47 and #48 carry a conventional
type. A bump computed from conventional commits would read almost the whole
product history as untyped, which makes every release a patch.

### `xpepper/pr-review-gemini`: full automation

Tags up to `v0.4.0`, with GitHub Releases for the recent ones.

- `package.json` is the canonical version, and `plugin.json`, `mcp.json` and a
  skill's frontmatter must match it, checked by `scripts/bump-version.mjs
  --check`.
- That script computes the bump from conventional commits since the last tag
  (a breaking footer or `!` is major, `feat` is minor, anything else is patch),
  writes every manifest with rollback on failure, prepends `CHANGELOG.md`,
  commits `chore(release): vN` and tags.
- `.github/workflows/release.yml` verifies a pushed `v*` tag (manifests in
  sync, tag equals the version, full test suite). Publishing the GitHub Release
  is `workflow_dispatch` only and refuses to overwrite an existing one.
- `docs/release.md` says the marketplace entry is updated **by hand** at every
  release, `version` and `source.ref` together.
- Its `package.json` `name` is `copilot-pr-review`, the same string as this
  plugin's `name`. It is not a marketplace name, so it collides with nothing
  there, but the two are easy to confuse.

### `xpepper/pr-review-glm`: the light model

Tags up to `v0.2.6`; no GitHub Releases, no workflows, no `package.json`.

- `plugin.json` is the only version-bearing manifest, and
  `extensions/z-pr-review/version.mjs` reads it so `/z-pr-review status` shows
  the running version, informational only.
- No bump script and no changelog. A release is a hand edit, a tag pushed at
  the increment's merge, and a hand edit of the marketplace entry.
- `tests/smoke-m1.mjs` **fetches the marketplace manifest over the network** and
  checks its own entry: present, `source.source` is `github`, `source.repo` is
  its repository, `source.path` is `"."`, `version` equals `plugin.json`'s, and
  `source.ref` is `v<version>`. `tests/marketplace.test.mjs` unit-tests the rule
  function. It deliberately does not check that the tag exists, because the tag
  is pushed only at merge.

### `xpepper/copilot-plugins`: the marketplace index

- Public, holding only `README.md` and `.github/plugin/marketplace.json`. No
  ruleset, no branch protection, and **no pull request in its history: every
  change so far is a direct push by the owner.**
- The marketplace's `name` is `xpepper-copilot-plugins`. A marketplace named
  `copilot-plugins` collides with the CLI's built-in default; the index's
  README records that as verified live on CLI 1.0.83.
- Plugins live in their own repositories and are referenced as
  `{"source": "github", "repo": "owner/repo", "path": ".", "ref": "vX.Y.Z"}`.
  The README records that `copilot plugin install` and `update` honor the ref
  pin.
- Two entries: `z-pr-review` and `gem-pr-review`. No `copilot-pr-review` entry.

**The hand-maintained step has already drifted, in both directions**, as read
on 2026-09-14:

| Entry | Manifest pins | Plugin repository | Index README table |
| --- | --- | --- | --- |
| `gem-pr-review` | `0.3.3`, ref `v0.3.3` | tagged and released `v0.4.0` | `0.4.0` |
| `z-pr-review` | `0.2.7`, ref `v0.2.7` | newest tag `v0.2.6`; **no `v0.2.7` tag exists** | `0.2.5` |

The commit that updated gemini to `0.4.0` changed only the README table. glm
pins its entry before its tag exists, by design, so for that window the entry
names a ref that is not there. What an install does against a missing ref was
**not tested**: doing so would change the user's installed plugins. This is
recorded as evidence about the process, and nothing was changed in either
repository.

## Proposal

### What a version number means for this plugin

A plugin has no library API, so the contract a user relies on is what they type
and what they keep. Proposed meaning:

- **Major**: something that worked stops working or means something else. A
  removed or renamed command or flag, a configuration key or file layout that
  no longer loads, a retained result an older release wrote that the new one
  refuses, or a change to the published comment text that `I1c`'s parser reads
  back byte for byte, which would stop a later review recognising an earlier
  one.
- **Minor**: a new capability, flag or mode, with everything that existed
  still working.
- **Patch**: a fix or a documentation change with no new capability.

**The first release is `0.1.0`, the user's choice (decision 6)**, so while the
major version is 0 the meaning moves down one place: a breaking change or a new
capability bumps the minor version, and a fix bumps the patch. The three
categories above keep their definitions, so declaring `1.0.0` later means only
that a break starts costing a major bump. That declaration is its own decision
for the user, not a consequence of any increment.

Documentation-only merges need not produce a release at all; a release is cut
when there is something worth installing.

### The release process

**Chosen by the user (decision 1): the light model, glm's shape, with the order
of steps corrected.** It fits this repository's settled "no `package.json`, no dependency,
no build step" constraint as written, and the history above gives an
automatic bump from commits nothing to work with.

1. On a branch, bump `plugin.json`'s `version` in a pull request titled for the
   release. It lands like every other change, through the ruleset, and gets its
   one plugin review before a merge is asked for: `plugin.json` is not
   documentation, so `AGENTS.md`'s optional review for documentation-only pull
   requests does not apply, even though nothing under `extensions/` or
   `scripts/` changes.
2. After it merges, and only with the user's explicit authorization for that
   release, tag the merge commit `vX.Y.Z` and push the tag. A GitHub Release is
   optional and is a separate authorization.
3. Install from that tag and check it loads, before anything points at it.
4. Only then, and again only with explicit authorization, update the marketplace
   entry's `version` and `source.ref` together, and the index README's table in
   the same change.

That order removes both kinds of drift seen above: the entry never names a tag
that does not exist yet, and it moves in the same sitting as the tag rather than
afterwards.

**The alternative, gemini's full automation**, would need a `package.json`,
which reopens a settled constraint and is the user's decision to make, plus a
bump script, changelog generation and a release workflow. Its automatic bump
would also need either a change to how pull requests are titled here, or a
bump chosen by hand anyway.

### The marketplace entry

Shaped like the two existing entries, with the name still to be decided:

```json
{
  "name": "copilot-pr-review",
  "description": "Reviews a GitHub pull request with parallel Copilot specialists, validates the findings against the reviewed revision, and publishes the ones you select as inline COMMENT review comments.",
  "version": "X.Y.Z",
  "author": {"name": "Pietro Di Bello", "url": "https://github.com/xpepper"},
  "homepage": "https://github.com/xpepper/copilot-pr-review",
  "keywords": ["pr-review", "code-review", "copilot", "github"],
  "license": "MIT",
  "repository": "https://github.com/xpepper/copilot-pr-review",
  "source": {"source": "github", "repo": "xpepper/copilot-pr-review", "path": ".", "ref": "vX.Y.Z"}
}
```

`description` is `plugin.json`'s own. The keywords are a suggestion.

### A consistency check, if one is wanted later

glm's check needs the network, and this repository's controlled suites must not,
so it could not join the controlled set as it stands. The pure rule function
could be a controlled suite over a fixture, with the live fetch as a separate
script run on demand. That is recorded as an option, not proposed for the first
release.

## Decisions put to the user

Each is the user's to take, one at a time. Outcomes are recorded here as they
are given.

| # | Decision | Recommendation | Outcome |
| --- | --- | --- | --- |
| 1 | Which release-process model | The light model, corrected order | **The light model, corrected order**, chosen 2026-09-14 over a light model with a zero-dependency helper script and over gemini's full automation. No `package.json`, no script, no workflow; the settled constraint stands. |
| 2 | Whether the history suits an automatic bump from commits | Only asked if the full model is chosen; the history above says no | **Not asked**: moot once decision 1 chose the light model, which computes no bump. The history finding above stands as recorded. |
| 3 | The marketplace-facing plugin name | `copilot-pr-review`, matching the repository | **`copilot-pr-review`**, chosen 2026-09-14 over a short sibling-style name. No rename, so no change under `scripts/`, no reinstall, and the entry installs as `copilot-pr-review@xpepper-copilot-plugins`. |
| 4 | Whether and when to change `xpepper/copilot-plugins`, and whether by pull request or by direct push as so far | Not before a real tagged release exists here | **By a pull request on the index that the user merges**, chosen 2026-09-14 over a direct push, a hand edit by the user, and not listing yet. Timing: only once a real `vX.Y.Z` tag here has been installed and loads, in the same sitting, and opening that pull request needs the user's explicit authorization then. The one pull request adds the entry and the index README's table row together. It would be the index's first pull request. |
| 5 | Whether cutting a release counts as publishing, needing explicit authorization each time | Yes | **Yes**, chosen 2026-09-14 over letting a merged version bump authorize its own tag. Pushing a tag, creating a GitHub Release and opening the index pull request each need the user's explicit authorization in the session that does it. Merging a version-bump pull request authorizes none of them. |
| 6 | The first release's number, added to the handoff's five because the release increment cannot be written without it | `1.0.0`, since `ROADMAP.md` records v1 delivered | **`0.1.0`**, chosen 2026-09-14 over `1.0.0` and over tagging `0.0.1` unchanged. `SCOPE.md` says the first release serves personal use; the stability claim `1.0.0` would make is deferred to a later decision of the user's. |
| 7 | How the implementation is sliced and scheduled | One increment, scheduled next | **One increment, scheduled next**, chosen 2026-09-14 over two increments (release first, listing later) and over recording without scheduling. Keeps the tag and the entry in the same sitting, as decision 4 set. Its ID is `S1`. |

## The scheduled increment, `S1`

Cut `v0.1.0` and list it, in one session, stopping at each authorization.

1. On its own branch, a pull request that bumps `plugin.json`'s `version` from
   `0.0.1` to `0.1.0` and adds `docs/release.md`, a short reference for the
   process this plan chose. It is not documentation-only, so it is reviewed
   once with this plugin before a merge is asked for, under the standing
   authorization, and that review is recorded in `ROADMAP.md`.
2. The user merges it.
3. **With the user's explicit authorization**, tag that merge commit `v0.1.0`
   and push the tag. No GitHub Release unless separately authorized.
4. Install from the tag and confirm the plugin loads and reports `0.1.0`.
   Establish the exact install-from-a-tag command from the CLI's own help
   first rather than assuming it. The user already has a direct install at
   `v0.0.1`, so replacing or adding an install changes their environment and
   is asked about first.
5. **With the user's explicit authorization**, open one pull request on
   `xpepper/copilot-plugins` adding the `copilot-pr-review` entry (shaped as
   above, `version` `0.1.0`, `source.ref` `v0.1.0`) and its README table row.
6. The user merges it. Confirm the merged manifest reads back consistent, and,
   with the user's agreement, that `copilot plugin install
   copilot-pr-review@xpepper-copilot-plugins` installs `0.1.0`.
7. A closing pull request here: the marketplace install line in `README.md`,
   now true, and the `ROADMAP.md` evidence and `HANDOFF.md`. `README.md` was
   64674 bytes on 2026-09-14, 862 under the 65536 bytes past which this tool's
   own discovery stops reading it, so measure it with `wc -c` and keep the
   `collectInstructionFiles` check skipping nothing.

Done when the entry is live, installs `0.1.0` from the tag, and the evidence
of every step, and of every step not taken, is recorded in `ROADMAP.md`.

Out of scope for it: a GitHub Release unless authorized, a `package.json`, any
script or workflow, a consistency check, a status line showing the version, and
declaring `1.0.0`.

## Demonstrated and assumed

Demonstrated by reading, on 2026-09-14: every fact under "What was inspected".
Assumed and not tested here: that the ref pin is honored (the index's own
README records it as verified; this session did not repeat it), what an install
does against a missing ref, and that installing this plugin from a tag works the
way it does for the siblings.
