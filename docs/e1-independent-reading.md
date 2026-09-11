# E1: one reader's independent reading of `xpepper/pr-review-gemini#28`

`E1` measured this tool against a substantial code diff. Precision is easy to
state from the run itself: one candidate, one validated finding, and the finding
is real. **Recall is not measurable without an independent opinion about what
else was there**, so this file records one, and records its limits honestly.

It was written from `git diff 0f95f7e..3bd86cb -- src/ scripts/` while the review
was still running, by the agent that prepared the run, and was not revised after
the reviewer's output arrived. It is **one reader's opinion and not ground
truth**: nobody has adjudicated it, and two of its entries were weakened by the
author's own later checking, which is noted against each.

## Candidates raised

1. `scripts/dogfood-pr.mjs:79-80`, `child.on('exit', (code) => process.exit(code ?? 0))`.
   A child killed by a signal reports a null exit code, so the wrapper exits 0 and
   the caller reads a killed review as a successful one. **P2. This is the finding
   the review reported**, at the same lines, with the same reasoning.
2. `src/calibration.js`, `isMatchingFile`: `path.basename(a) === path.basename(b)`
   makes any same-named file in any directory a match, so a finding about
   `server/index.js` satisfies a benchmark about `src/index.js` and inflates
   recall. P2. Not reported.
3. `src/calibration.js`, `evaluateCalibrationSuite`: the inner loop stops at the
   first matching finding and never excludes findings an earlier benchmark
   consumed, so one finding can satisfy several benchmarks. P2 as written, but
   **the author later weakened this**: the benchmarks live in different files with
   distant line numbers, so triggering it needs entry 2's basename matching as
   well. It is a consequence of 2 rather than an independent defect. Not reported.
4. `src/subagents.js`, `isModelUnavailableError`: a 400, 403 or 404 whose text
   contains the bare word "model" is treated as model unavailability and retried
   through every fallback and then through `auto`, so an ordinary bad request is
   retried as a capacity problem. P2. Not reported as a finding. **The review
   engaged with exactly this code and declared a coverage gap on it instead**,
   saying it could not establish from the captured revision whether the matcher
   recognises the host's real catalog failures. That is a defensible answer to a
   different question, and it is the reason this entry is not simply a miss.
5. `src/calibration.js`: an unrecognised severity leaves the rank undefined and
   skips the severity comparison entirely, so an unknown severity passes rather
   than failing. P3. Not reported.
6. `scripts/dogfood-pr.mjs:57`, `rawArgs.find((a) => /^\d+$/.test(a))` takes the
   first bare number anywhere on the command line, so a numeric value belonging to
   another option is read as the pull request number. P3. Not reported.
7. `src/calibration.js`: `Number(finding.line) || 0` turns a missing line into 0,
   which is within `maxLineDistance` of any benchmark line at or below 15. No
   current benchmark is that low, so it is latent. nit. Not reported.

## Deliberate, and not raised

- `modelCandidates.push('auto')` inside `for (let i = 0; i < modelCandidates.length; i++)`
  extends the live loop on purpose, and `!modelCandidates.includes('auto')` bounds it.
- The six-spelling `fallbackToAuto` check is a uniform opt-out, which the branch's
  own commit message says was the fix for an earlier dogfood finding.
- `precision` of 0.0 beside `recall` of 1.0 on an empty finding set is odd, but
  only reachable with an empty benchmark list.

## What this supports, and what it does not

It supports one sentence: on this diff the tool reported the strongest defect one
reader found, and did not report six weaker ones, of which one was answered by a
coverage gap and one was a consequence of another. It does not establish a recall
rate, because a single unadjudicated reader is not a benchmark. Anyone wanting a
recall number needs a defect corpus with agreed ground truth, which this project
does not have and has not scheduled.
