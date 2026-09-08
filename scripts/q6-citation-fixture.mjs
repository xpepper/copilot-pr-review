// Original repository source, not upstream code. These excerpts reconstruct the
// discarded quotes from the reviewed heads, with line numbers rebased locally.
// #11: 03b7463, config.mjs:223-224; reviewer cfabc608-e0c1-4a77-8e29-88c3932fc4c4.
// #12: 5569605, findings.mjs:78-88 and README.md:416-419;
// reviewer d62fdb5b-c925-4d94-92bd-86c05dd73cad.
// #4: ae2c55c, README.md:1114; reviewer 09829c22-836b-48db-8aa8-6e799ca17152.
const effortSource = [
  "  if (reasoningEffort.value === undefined || !inheritedEffort(reasoningEffort.source)) return reasoningEffort;",
  "  return advertisesNoReasoningEffort(model, models) ? { value: undefined, source: noEffortSource } : reasoningEffort;",
].join("\n");
const effortQuote = [
  "if (reasoningEffort.value === undefined || !inheritedEffort(reasoningEffort.source)) return reasoningEffort;",
  "  return advertisesNoReasoningEffort(model, models) ? { value: undefined, source: noEffortSource } : reasoningEffort;",
].join("\n");
const adjudicatorSource = [
  '  "Independently trace each trigger, required contract, actual effect, and before/after behavior in the source.",',
  '  "Actively disprove each claim: look for guards, unreachable conditions, intentional contract changes, and pre-existing failures.",',
  '  "A valid quote or another reviewer\'s agreement is NOT proof of impact or of introduction by this diff.",',
  '  "A candidate\'s breaks citation only names the code it claims this change breaks, and may be unchanged code:",',
  '  "it is the claim you must disprove or confirm from source, never evidence that the claim holds.",',
  '  "Reject false positives, pre-existing issues, speculative impact, inappropriate severity, and inflated confidence.",',
  '  "Use uncertain when the supplied context cannot settle a claim. Never accept on the candidate\'s assertions alone.",',
  '  "For accept, cite independent source evidence establishing the causal argument and explain it in reason.",',
  '  "Accept ONLY if EVERY assertion in the candidate\'s title, trigger, expected, actual, introduction, severity and confidence is supported.",',
  '  "If the core defect is real but any detail is false or overstated, reject the ENTIRE candidate and set allClaimsSupported=false.",',
  '  "Do not accept with a caveat/correction in reason: the original candidate text is displayed unchanged. Finding editing is not implemented.",',
].join("\n");
const introductionSource = [
  "  if (!file.hunks.some((hunk) => withinHunk(location, hunk) &&",
  "      (!before || withinHunk(before, hunk)) && (!after || withinHunk(after, hunk)))) {",
  '    throw new Error("Introduction citations and location must identify the same changed hunk.");',
].join("\n");
const introductionBefore = [
  "  if (!file.hunks.some((hunk) => withinHunk(location, hunk) &&",
  '      (before ? withinHunk(before, hunk) : !hunkHasChanges(file, hunk, "base")) &&',
  '      (after ? withinHunk(after, hunk) : !hunkHasChanges(file, hunk, "head")))) {',
  '    throw new Error("Introduction citations and location must identify the same changed hunk.");',
].join("\n");
const introductionContract = [
  "line, not merely nearby unchanged code. Before/after evidence must describe that",
  "location's own hunk, citing changed code where present; either side may be null,",
  "which claims this change replaced or added nothing there and leaves the",
  "adjudicator to settle whether that is true.",
].join("\n");
const sdkSource = String.raw`COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')"/copilot-sdk)" \
`.slice(0, -1);
const sdkQuote = String.raw`COPILOT_SDK_PATH="$(ls -d "$HOME"/.copilot/pkg/*/"$(copilot --version | sed -n 's/.*CLI \([0-9][0-9.]*[0-9]\).*/\1/p')" /copilot-sdk)" \
`.slice(0, -1);
const cite = (path, quote, startLine = 1, side = "head") => ({
  path, side, startLine, endLine: startLine + quote.split("\n").length - 1, quote,
});
const effortLocation = cite("config.mjs", effortQuote);
const introductionLocation = cite("findings.mjs", introductionSource, 13);
const sdkLocation = cite("README.md", sdkQuote);

export const q6CitationCases = [
  {
    pr: 11, label: "overview", repairedFields: ["location", "after"],
    files: [
      { path: "config.mjs", head: effortSource },
      { path: "README.md", head: [
        "A tier whose resolved model is one of those takes **no** effort. It does not",
        "inherit the effort a neighbouring tier, a trusted project or the ambient session",
        "would otherwise supply, because that effort is not one the model can hold.",
        "`show` and the pre-execution report print `reasoning=(not configurable) [model]`",
        "for such a tier, so the origin says the model decided it rather than a",
        "configuration layer. The same rule applies to a tier's optional fallback model:",
        "the tier's own effort reaches its fallback the way an inherited effort reaches a",
        "tier, so a fallback model that advertises none does not receive it either.",
      ].join("\n") },
    ],
    candidate: {
      title: "Effortless models do not consistently receive the `model` origin",
      severity: "P3", confidence: 0.93, location: effortLocation,
      trigger: "A tier resolves to an enabled model with no configurable reasoning effort while the effective effort is already undefined, such as an ambient session on that model with no reasoningEffort field, or a fallback whose primary effort is undefined.",
      expected: "The tier or fallback should report no effort with origin `model`, rendering `reasoning=(not configurable) [model]` as documented for every model that supports no configurable effort.",
      actual: "The early return preserves the prior source (`unset`, `ambient`, or `primary`), so the configuration display can show `reasoning=(unset) [unset]` or another non-model origin even though the resolved model is not configurable.",
      introduction: "The new `effortForModel` helper only assigns the `model` origin when it drops a defined inherited effort; it leaves undefined efforts untouched, so the new origin contract is not applied when there is no value to drop.",
      before: null, after: effortLocation,
    },
  },
  {
    pr: 12, label: "correctness", repairedFields: ["breaks", "evidence[0]"],
    files: [
      { path: "findings.mjs",
        base: `${adjudicatorSource}\n\n${introductionBefore}`,
        head: `${adjudicatorSource}\n\n${introductionSource}` },
      { path: "README.md", head: introductionContract },
    ],
    candidate: {
      title: "Tell the adjudicator that a null introduction side is a claim",
      severity: "P2", confidence: 0.88, location: introductionLocation,
      trigger: "A reviewer supplies before: null or after: null for a replacement hunk, while the candidate prose otherwise describes a real defect and the validator accepts it.",
      expected: "The validator must treat the null field as the claim that the diff did not remove or add that side and reject the candidate when the captured hunk disproves it.",
      actual: "The relaxed boundary forwards the candidate to adjudication, but the validator instructions never define a null introduction citation as an absence claim or require it to test that claim; their exhaustive acceptance list omits before and after. A validator can therefore accept a finding that falsely presents a replacement as a pure addition or deletion.",
      introduction: "This diff removed the deterministic changed-side check and assigned its enforcement to adjudication, without adding the corresponding null-side semantics to the adjudicator contract.",
      before: cite("findings.mjs", introductionBefore, 13, "base"), after: introductionLocation,
      breaks: cite("findings.mjs", adjudicatorSource.slice(0, -1)),
      evidence: [cite("README.md", introductionContract.slice("line, not merely nearby unchanged code. ".length))],
    },
  },
  {
    pr: 4, label: "contracts", repairedFields: null,
    files: [
      { path: "README.md", head: sdkSource },
      { path: "HANDOFF.md", head: "`~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`. Demonstrate capabilities;" },
    ],
    candidate: {
      title: "The documented SDK path command passes `/copilot-sdk` as a separate `ls` operand",
      severity: "P2", confidence: 0.99, location: sdkLocation,
      trigger: "A user runs the documented integration-test command on a normal host where `/copilot-sdk` does not exist.",
      expected: "`COPILOT_SDK_PATH` resolves to the installed SDK directory, such as `~/.copilot/pkg/darwin-arm64/1.0.83/copilot-sdk`.",
      actual: "The space before `/copilot-sdk` makes it a second argument to `ls`; `ls` reports that path as missing and the command substitution returns the parent version directory rather than the SDK directory, so the dispatcher receives an invalid SDK path.",
      introduction: "This newly added command attempts to derive the SDK path but separates the SDK suffix from the version path.",
      before: null, after: sdkLocation,
    },
  },
].map((fixture) => ({
  ...fixture,
  candidate: { ...fixture.candidate,
    evidence: fixture.candidate.evidence ?? [cite(fixture.files[1].path, fixture.files[1].head)] },
}));
