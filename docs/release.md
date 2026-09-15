# Releasing

How a version of this plugin is cut and listed. The reasoning and the decisions
behind it are in [release-and-marketplace-plan.md](release-and-marketplace-plan.md);
this file is only the procedure.

## What a version means

`plugin.json`'s `version` is the only version. There is no `package.json`, no
bump script, no changelog generator and no release workflow.

- **Breaking**: something that worked stops working or means something else,
  such as a removed or renamed command or flag, configuration that no longer
  loads, a retained result an older release wrote that is now refused, or a
  change to the published comment text a later review reads back.
- **Capability**: a new command, flag or mode, with everything that existed
  still working.
- **Fix**: a correction or a documentation change with no new capability.

While the major version is `0`, a breaking change or a new capability bumps the
minor version and a fix bumps the patch. Declaring `1.0.0` is the user's own
decision, not a consequence of any change. A documentation-only merge need not
produce a release.

**Never change `plugin.json`'s `name`.** The runtime names the extension
`plugin:copilot-pr-review:...`, and `scripts/dogfood-review.mjs` and the runtime
probes find it by that prefix.

## Cutting a release

1. On a branch, bump `plugin.json`'s `version` in a pull request titled for the
   release. It is not documentation-only, so it gets its one plugin review
   before a merge is asked for. The user merges it.
2. **With the user's explicit authorization for this release**, run the full
   controlled set at the commit the merge put on `main` (a squash merge makes a
   new commit, not a merge commit), then tag that commit `vX.Y.Z` and push the
   tag. Nothing on GitHub gates a tag and CI does not run on tags, so the local
   run is the only check. Never move, delete or re-push a published tag: the
   index pins it by name. A GitHub Release is optional and needs its own
   authorization.
3. **With the user's agreement**, install from the tag and check the plugin
   loads and reports the new version, before anything points at the tag.
   Replacing their existing install, or adding one beside it, changes their
   environment, so ask first. Read `copilot plugin install --help` first: on
   CLI 1.0.83 it names no syntax for a ref.
4. **With the user's explicit authorization**, open one pull request on
   `xpepper/copilot-plugins` that sets this plugin's entry `version` and
   `source.ref` together and updates the index README's table in the same
   change. The user merges it. Never push to that repository's `main`.
5. Read the merged manifest back and check `version`, `source.ref` and the tag
   agree.

Merging the version bump authorizes none of steps 2 to 4, and none of them
authorizes the next: each is asked for in its turn. Doing them in this
order means the index never names a tag that does not exist yet. It does trail
the new tag from step 2 until the index pull request merges, so do steps 2 to 5
in the same sitting.

## The marketplace entry

In `.github/plugin/marketplace.json` of `xpepper/copilot-plugins`, whose
marketplace name is `xpepper-copilot-plugins`:

```json
{
  "name": "copilot-pr-review",
  "version": "X.Y.Z",
  "source": {"source": "github", "repo": "xpepper/copilot-pr-review", "path": ".", "ref": "vX.Y.Z"}
}
```

The entry also carries `description` (`plugin.json`'s own), `author`,
`homepage`, `keywords`, `license` and `repository`, shaped like its sibling
entries. Once listed, it installs as
`copilot plugin install copilot-pr-review@xpepper-copilot-plugins`.
