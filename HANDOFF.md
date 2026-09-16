# Next session prompt

Read `CLAUDE.md`, `AGENTS.md`, `SCOPE.md` and `ROADMAP.md`, then inspect git
state and pull request #60 before editing anything. Scope is authoritative; the
roadmap records demonstrated evidence and the exact release sequence. Do not
rely on another conversation, reopen settled product decisions or infer
behavior from an API declaration.

## Where things stand

`S2` is in progress on branch `release/v0.2.0`, pull request #60. Check whether
it has merged:

```sh
gh pr view 60 --json state,mergedAt,mergeCommit,headRefOid,url
```

The implementation checkpoint is `e97aea4`. It changes `plugin.json` from
`0.1.0` to `0.2.0` and records the release boundary. `v0.2.0` is a minor bump
under the repository's pre-1.0 rules: #54-#59 include new capabilities and
breaking-category publication-format changes. Compatibility is preserved:
`prior.mjs` recognises both old review summaries and the marker introduced by
#55, and the controlled suite pins both formats.

The release contains:

- #54: discarded candidates have their own diagnostic kind;
- #55: short published summaries with a hidden identity marker;
- #56: problem-first inline comments with a prominent fix;
- #57: a bad supporting citation no longer drops the whole candidate;
- #58: more useful compact output under `--quiet`;
- #59: short orientation help and `help --all` reference help.

All 19 controlled suites passed before the checkpoint. `plugin.json` was parsed
and asserted to have name `copilot-pr-review` and version `0.2.0`.
`git diff --check`, the tracked-control-byte check and the self-readability
check passed. `README.md` remains unchanged at 65527 bytes, only 9 below the
65536-byte safeguard limit; `ROADMAP.md` is below the limit after its completed
H2 section was removed from the live file. The complete H2 section was already
present verbatim in `docs/roadmap-archive-2026-09-10.md`, so that archive did
not need to change.

## Pull request review

#60 has had its one review authorized by the standing workflow. With the user's
explicit agreement, the marketplace `v0.1.0` install was replaced temporarily
by a direct install proven byte-identical to `e97aea4`.

The balanced review used `gpt-5.6-terra`/high for the four heavy reviewers and
adjudicator, and `gpt-5.6-luna`/high for overview. It cost 75.476181 credits
over 17 requests, with 205.4 seconds of model work in six passes and 82.6
seconds elapsed. Coverage was INCOMPLETE: 0 validated findings, 0 execution
failures, 3 discarded candidates, 3 coverage gaps and 1 informational caveat.
Nothing was published.

Three reviewers claimed the removed live H2 record had not been archived. That
was false because the unchanged archive already contains it; the adjudicator
rejected the one candidate that reached it because the supplied context could
not prove the claimed loss. One reviewer correctly noticed that the roadmap
still said to open the already-open PR. Its candidate failed the exact quote
gate, but the stale instruction was fixed after the review. No second review is
authorized. The marketplace install was restored and verified byte-for-byte
against `git archive v0.1.0`.

GitHub's controlled-suites job passed on the final review-evidence checkpoint.
The separate `claude-review` workflow failed twice before making any model call:
the action initialized, returned `is_error:true`, reported zero usage and no
permission denial, and exposed no further diagnostic. The user confirmed their
Claude five-hour credits were exhausted. Treat this as an external quota blocker,
not as a completed review and not as evidence about the release change.

## Exact next step

If #60 is not merged, first wait for the user's Claude five-hour quota to reset
and obtain a fresh successful `claude-review` check. Do not treat either existing
zero-usage failure as a flake to ignore. Once both required checks are green, ask
the user to merge #60. Do not tag the branch commit: `docs/release.md` requires
tagging the new squash commit on `main`.

After #60 merges, ask for explicit authorization to:

1. update local `main` to the merge commit;
2. rerun all 19 controlled suites and the manifest, self-readability,
   control-byte and `git diff --check` checks at that exact commit;
3. create an annotated `v0.2.0` tag and push it.

Creating a GitHub Release is optional and separately authorized. If the user
wants one, draft release notes from #54-#59 but do not publish it without that
authorization.

After the tag exists, ask for agreement to replace the installed marketplace
copy temporarily with a detached checkout of `v0.2.0`. Follow
`docs/release.md`: verify `copilot plugin list`, compare the cached install
byte-for-byte with the tag, and run the no-inference
`scripts/smoke-runtime.mjs --targets` probe. Remove the worktree afterwards.

Then ask for explicit authorization to open a pull request on
`xpepper/copilot-plugins`. Never push its `main`. In that one PR, update the
`copilot-pr-review` entry's `version` to `0.2.0`, its `source.ref` to `v0.2.0`,
and the README table row to the same version. The user merges it.

Read the merged marketplace manifest back. With the user's agreement, run
`copilot plugin marketplace update xpepper-copilot-plugins`, uninstall the
direct copy, install `copilot-pr-review@xpepper-copilot-plugins`, verify the
listed version, compare it with `git archive v0.2.0`, and run the no-inference
probe again.

Finally update `ROADMAP.md` with every demonstrated result and every step not
taken. Refresh this file as the final repository edit, commit and push the
closing evidence on the S2 branch/PR if it is still open, or use the repository's
documented closing-PR pattern if #60 has already merged. Follow the checkpoint,
pull-request and handoff rules in `AGENTS.md`; never rely on this conversation.

## Caveats

- Every tag, GitHub Release and marketplace-index change needs its own explicit
  authorization in the session that performs it. One does not authorize the
  next.
- Steps after tagging should proceed in the same sitting so the marketplace
  trails the new tag for as little time as possible.
- The current marketplace entry and local install remain at `v0.1.0`.
- Open pull requests #1 and #2 are synthetic "do not merge" playgrounds.
- Do not start any item under ROADMAP's "Recorded, not scheduled" list.
- Do not edit `README.md` without first removing at least as many bytes as are
  added.
