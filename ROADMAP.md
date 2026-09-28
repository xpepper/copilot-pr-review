# Roadmap

[docs/decision-memo-2026-09-28.md](docs/decision-memo-2026-09-28.md) is the
decision this plan implements: read it first, because this file only sequences
what it recommends. [SCOPE.md](SCOPE.md) remains the specification of the plugin
as built. [AGENTS.md](AGENTS.md) is the workflow. [HANDOFF.md](HANDOFF.md) is the
replaceable prompt for the next session.

**The delivery roadmap is archived, not lost.** Increments `S0` through `S2`, the
`v0.2.0` release record, and the settled and open lists are in
[docs/roadmap-archive-2026-09-28.md](docs/roadmap-archive-2026-09-28.md), verbatim
as they stood at `e71a8b9`. Older completed entries are in
[docs/roadmap-archive-2026-09-10.md](docs/roadmap-archive-2026-09-10.md). Both are
the evidence of record for everything the plugin was shown to do. Do not redo,
widen or reopen anything in them.

## Where things stand

- **Phase: audit.** The plugin is complete against its scope and published as
  `v0.2.0` (tag, GitHub Release and marketplace listing). Nothing has changed under
  `extensions/` or `scripts/` after 16 September, and the memo recommends that
  nothing does until the audit below says otherwise.
- **The recommendation** is to freeze all three plugins (this one, `pr-review-gemini`,
  `pr-review-glm`), make native Copilot review plus a thin single-agent workflow the
  default, and run one zero-credit audit before deciding whether any plugin is worth
  resuming. The freeze is already the de facto state. It is not yet a confirmed
  decision: that is `DEC1`, and it belongs to the owner.
- **What is not known:** how many consequential real defects each plugin finds that
  native reviewers do not, how many real findings the exact-quote gate hides, and
  whether the plugins still load on the current Copilot CLI (validated on 1.0.83;
  1.0.88 was installed when this was written).

## Standing constraints

These were in force in the previous roadmap and `AGENTS.md`, and still bind.

1. **Everything lands on a branch and a pull request.** `main` is protected by a
   ruleset with no bypass, and merging is the owner's decision.
2. **No credit-spending action without an explicit instruction in that session:** a
   plugin review, a live probe, a bake-off run or a paid replay. The standing
   authorization of one plugin review per increment pull request applies only to
   increments that change `extensions/` or `scripts/`; none is scheduled. A
   documentation-only or `eval/`-only pull request may be reviewed at the owner's
   choice; ask, do not spend by default. Native reviewers that the repository runs on
   every pull request are outside an agent's control.
3. **Nothing is posted to GitHub without an explicit instruction:** no review
   comments, no `--comment`, no `/pr-review publish`. Playground pull requests #1 and
   #2 are never merged or republished.
4. **Frozen surfaces:** `extensions/`, `scripts/`, `plugin.json`, the marketplace
   entry, tags and releases. Every tag, release and marketplace write needs its own
   explicit authorization. Audit tooling goes under `eval/`, which changes no plugin
   behaviour.
5. **Findings are labelled by the owner, never by a model.** An agent prepares data,
   blinds it and computes results. Generated sheets, keys and any private repository
   content stay outside the repository; commit code, the sample list and aggregate
   results only.
6. **The memo's thresholds are pre-registered.** Changing one after a result has been
   seen is a deviation: record it here with the reason.
7. **A known limitation:** the plugin publishes a reviewer's own prose unredacted. Do
   not authorize publication on a repository whose diffs can carry secrets.
8. **Repository invariants that CI enforces:** every root markdown file stays under
   65536 bytes (measure with `wc -c`; `README.md` has about 8 bytes of headroom), and
   no tracked text carries a control byte (`.github/workflows/ci.yml`, step "No
   control bytes in tracked text"). Never type an escape for a control character into
   a file: build it in code with `String.fromCharCode`, as
   `extensions/pr-review/standards.mjs:24-25` does. Check new untracked files with a
   perl scan for bytes 0 to 8, 11, 12, 14 to 31 and 127, because `git grep` does not
   see untracked files and macOS `grep` has no `-P`.
9. **Copy nothing from upstream** (`pi-pr-review`): see
   [docs/upstream-licensing.md](docs/upstream-licensing.md).
10. If a rule here conflicts with `AGENTS.md`, stop and ask. The one known tension
    is the per-increment plugin review, which `AGENTS.md` scopes to behaviour changes
    under `extensions/` and `scripts/`.

## Increments

| ID | Status | Independently demonstrable outcome | Depends on |
| --- | --- | --- | --- |
| MEMO | In the pull request that introduces this file | The decision memo exists as a shareable, self-contained document; the delivery roadmap is archived verbatim; this plan replaces it. Documentation only. | none |
| DEC1 | Pending, the owner's | The owner confirms or changes the freeze recommendation and answers the three open questions in section 8 of the memo. The answer is recorded in this table. | MEMO |
| PRB1 | Optional; needs the owner's agreement first | Whether the marketplace `v0.2.0` plugin still loads and dispatches on the installed CLI, using the existing no-inference probe (`scripts/smoke-runtime.mjs --targets`), which asserts no model call. The probe needs the marketplace copy uninstalled first, which changes the owner's environment, so ask before starting and restore it exactly afterwards. | MEMO |
| EXP1a | Ready; first action | A blinded audit sheet and its scorer, built from data that already exists, with no credit spent. See "The exact next increment". | MEMO |
| EXP1b | Waits for the owner's labels | Labels applied, metrics computed, and the continue, stop or gate signal recorded against the memo's thresholds. Aggregates only. | EXP1a, owner |
| EXP2 | Not scheduled; needs a continue-signal and an explicit go-ahead | The same-snapshot bake-off on about 10 outside pull requests, five arms, human-labelled. Spends about $30 to $75 (assumption). | EXP1b, owner's list of pull requests |
| EXP3 | Conditional on the gate-signal and an explicit go-ahead | The gate ablation replay: stored reviewer outputs through today's gate and a relaxed one. Spends about $5 to $10 (assumption). | EXP1b |
| VER1 | At the end of the tranche | A short record of the verdict (continue, pivot or stop) with the numbers behind it, and the follow-on: one plugin kept, a skill or script written, or all three archived with a lessons note. | EXP1b, and EXP2 if run |

Statuses change only with evidence recorded in the entry: the pull request, what was
verified and how, what was not verified, credits spent if any, deviations from the
memo, and what remains.

### The tranche cap

The whole tranche (`EXP1a` to `VER1`) is capped at **16 developer-hours and $75 of
inference, within two calendar weeks, whichever comes first** (assumptions taken from
the memo). `EXP1a` and `EXP1b` together stay within 6 hours of the owner's time and
spend no credits. Anything beyond the cap needs a new decision.

### MEMO: what was done and verified

Built on `docs/investment-decision-memo` from `main` at `e71a8b9`. Documentation
only: no file under `extensions/` or `scripts/` changed, and no plugin review was
run (for a documentation-only pull request that is the owner's call; ask).

- The previous `ROADMAP.md` is preserved as `docs/roadmap-archive-2026-09-28.md`
  (added in this pull request's first commit, replaced at the root in its second).
  Only relative links changed, so that they resolve from `docs/`. A script undid
  those rewrites and compared the remainder byte for byte with
  `git show e71a8b9:ROADMAP.md`: identical.
- `docs/decision-memo-2026-09-28.md` is the memo. It carries no absolute local
  path, no account-level spend total, and nothing from the private work
  repositories beyond what public documents in this repository already state.
- `README.md` got three pointer fixes (its old statements that `ROADMAP.md` holds
  the evidence and the triage). It grew by 1 byte, to 65528 of 65536.
- Verified locally with an isolated `HOME` and no credential: all 19 controlled
  suites pass (218 checks); the self-readability check reads all six root files and
  skips none; 126 relative links and anchors in the four changed markdown files
  resolve; no control byte in any of them; no em-dash in the new text.
- Not verified: GitHub's controlled-suites job and the reviewers the repository runs
  on every pull request, which run when the pull request opens; any live probe.

## The exact next increment: EXP1a

Ask the owner first: confirm that `EXP1a` should start, which repositories may enter
the sample (public ones only by default; the private work pull requests named in the
memo only if the owner allows them and the resulting sheet stays local), and where
generated data may be written outside the repository.

Then build, under `eval/audit/`, with plain Node ES modules, no dependencies and no
network beyond read-only `gh` requests, in the style of the existing suites:

1. **`README.md`** covering the protocol: data sources, blinding, the label schema
   (`consequential`, `minor`, `not-real`, plus `unverifiable`, which is reported and
   excluded from precision), and the data-handling rules in constraint 5.
2. **`sample.json`**, the pull request heads to include, seeded from Appendix B of the
   memo and verified entry by entry. Each entry records repository, number, the head
   SHAs a review was made against, which sources exist, and whether the repository is
   public.
3. **A collector** that turns each source into one normalized finding shape: repository,
   pull request, head SHA, path, line or range, text, severity if given, the source
   (kept in the key, never in the sheet), and a kind (`validated`, `discarded`,
   `native`, `bot`). It reads only local files and `GET` requests:
   - plugin runs from the local Copilot session logs. Each reviewer session's first
     user message embeds the review binding (repository, pull request, head SHA) as
     JSON (`extensions/pr-review/review.mjs:361-388`), and the reply sits between
     `<<<PR_REVIEW_JSON>>>` and `<<<END_PR_REVIEW_JSON>>>`. A run that cannot be mapped
     to a head is reported as a gap, never guessed;
   - gemini results from its `.gem-pr-cache` files (post-filter, so no discards);
   - native and bot comments through `gh api`, bound to `original_commit_id`.
4. **A sheet builder** that clusters findings into one row per root cause with
   documented deterministic rules (same file, lines within 3, text overlap above a
   stated threshold, never across files), removes every tool name, orders rows with a
   recorded random seed, and writes a sheet (row id, link to the pull request at that
   head, path and line, text, an empty label column) and a separate key mapping rows to
   members and sources.
5. **A scorer** that reads a labelled sheet and the key and prints the memo's metrics
   (unique consequential share, false-positive share, the share of real findings that
   sit in discarded candidates) and which of the three signals fire, against a
   thresholds file copied from the memo and checksummed into the sheet header.
6. **A controlled suite** with fixtures and a fake `gh` (as `scripts/fixtures/gh` does
   for the plugin's suites) covering normalization, clustering, blinding and the
   scoring arithmetic, wired into CI as its own step. No network, no inference.

Acceptance: the suite passes locally and in CI; a dry run on the real data writes a
sheet outside the repository and prints counts (pull request heads found, findings by
kind, runs that could not be mapped); no finding was labelled by any model; nothing
was posted, published or run against a model; no file under `extensions/` or
`scripts/` changed. Report the counts to the owner and stop: labelling is `EXP1b`.

## What each verdict leads to

| Signal (from the memo) | Next |
| --- | --- |
| Continue: a plugin's unique consequential share is at least 30% with at most 30% false positives | `EXP2`, after the owner supplies pull requests and authorizes the spend |
| Stop: unique share under 10% and native reviewers found at least 80% of what the plugins found | `VER1` with a stop verdict: archive all three with a one-page lessons note |
| Gate: at least 25% of real findings sit in discarded candidates | `EXP3` |
| Pivot (after `EXP2`): a baseline is at or above the best plugin arm | `VER1` with a pivot verdict: a skill or script of at most 200 lines, at most 8 hours |

## Evidence and runtime caveats

The evidence for every earlier claim is in the two archives above and in
[docs/gap-analysis.md](docs/gap-analysis.md),
[docs/published-review-feedback-plan.md](docs/published-review-feedback-plan.md) and
[docs/e1-independent-reading.md](docs/e1-independent-reading.md). The runtime facts an
agent needs: the plugin is a Copilot CLI extension (documented as experimental) that
needs `--experimental` for a local checkout; reviewers run confined to `view`, `grep`
and `glob`; per-session credits are `totalNanoAiu` divided by 1e9 in the local
session logs, and one credit is $0.01. The memo's Appendix A lists every read-only
source and command.
