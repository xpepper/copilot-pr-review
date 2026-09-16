// H2: what `/pr-review` tells somebody who asks what it can do.
//
// Three false user-facing strings have shipped in this text, each surviving
// several increments, because nothing cheap ever read it: `extension.mjs`
// calls `joinSession` at the top level, so the only suite that could reach the
// help was a runtime probe needing an installed plugin and a CLI path, which
// CI deliberately does not run. These checks read the text directly, for free,
// on every pull request.
//
// The flag lists come from the parsers themselves rather than being retyped
// here. A list maintained beside this file would agree with the documentation
// by construction and catch nothing, which is the whole failure being fixed.
import assert from "node:assert/strict";
import { helpOrientation, helpReference, helpTextFor } from "../extensions/pr-review/help.mjs";
import { captureOnlyFlag, modeFlags, modeIds, reviewModes } from "../extensions/pr-review/modes.mjs";
import { verifyFlag } from "../extensions/pr-review/checkout.mjs";
import { incrementalFlag } from "../extensions/pr-review/incremental.mjs";
import { revalidateFlag } from "../extensions/pr-review/revalidation.mjs";
import { noStandardsFlag } from "../extensions/pr-review/standards.mjs";
import {
  longContextFlag, postingFlags, quietFlag, settingKeys, unattendedFlag,
} from "../extensions/pr-review/review.mjs";
import { supportedTargetFlags } from "../extensions/pr-review/target.mjs";

// Exact tokens, never substrings: `includes("--quick")` would also be satisfied
// by a longer flag that happens to contain it, so a flag could go undocumented
// while this suite stayed green.
const flagsIn = (text) => new Set(text.match(/--[a-z][a-z-]*/g) ?? []);
const orientationFlags = flagsIn(helpOrientation);
const referenceFlags = flagsIn(helpReference);
const orientationLines = helpOrientation.split("\n");
const referenceLines = helpReference.split("\n");

// A flag the help does not mention is a flag nobody can find. This is the
// invariant `smoke-runtime.mjs` carried, moved somewhere that actually runs.
const accepted = [
  ...modeFlags, captureOnlyFlag, verifyFlag, quietFlag, unattendedFlag,
  incrementalFlag, revalidateFlag, longContextFlag, noStandardsFlag,
  ...postingFlags, ...supportedTargetFlags,
];
for (const flag of accepted) {
  assert(referenceFlags.has(flag),
    `The reference help never mentions ${flag}, so nobody running this plugin can find it`);
}
for (const key of settingKeys) {
  assert(helpReference.includes(`${key}=`),
    `The reference help never mentions the ${key}= setting, so nobody can find it`);
}
console.log(`PASS H2 the reference documents all ${accepted.length} accepted flags and ${settingKeys.length} settings`);

// The orientation answers "what are my options?", so every mode must be in it.
// Aliases need not be: `--major-only` is another spelling of `--quick`, and
// listing both in a short answer costs a line and teaches nothing.
for (const id of modeIds) {
  assert(orientationFlags.has(reviewModes[id].flag),
    `The orientation never names the ${id} mode, which is one of the options being asked about`);
}
assert(orientationFlags.has(captureOnlyFlag), "The orientation never names --capture-only");
assert(/default/i.test(helpOrientation),
  "The orientation lists five modes without saying which one a run gets by default");
for (const flag of postingFlags) {
  assert(orientationFlags.has(flag),
    `The orientation never names ${flag}, so what a run may publish is not visible in it`);
}
for (const key of settingKeys) {
  assert(helpOrientation.includes(`${key}=`), `The orientation never mentions the ${key}= setting`);
}
// The orientation groups the controls by purpose, so a flag missing from it is
// a control nobody browsing the options will discover. Only an alias of a flag
// it already shows may be left out, and each excuse is checked against the
// parsers, so the list cannot outlive the flag it excuses.
const orientationOmits = new Set(["--major-only", "--review-closed"]);
for (const flag of orientationOmits) {
  assert(accepted.includes(flag), `${flag} is excused from the orientation but no parser accepts it`);
  assert(referenceFlags.has(flag), `${flag} is excused from the orientation but missing from the reference too`);
}
for (const flag of accepted) {
  if (orientationOmits.has(flag)) continue;
  assert(orientationFlags.has(flag),
    `The orientation never names ${flag}, so nobody browsing the options will find that control`);
}
console.log("PASS H2 the orientation names every mode, the default, and what a run may publish");

// Which text each spelling gets. `extension.mjs` cannot be imported, so the
// choice lives here where it can be checked for free; the dispatch does nothing
// but call this. Whitespace is normalised, because `help  --all` is the same
// question as `help --all` and an exact-match switch would quietly refuse it.
assert.equal(helpTextFor("help"), helpOrientation);
assert.equal(helpTextFor("--help"), helpOrientation);
assert.equal(helpTextFor("  help  "), helpOrientation);
assert.equal(helpTextFor("help --all"), helpReference);
assert.equal(helpTextFor("help all"), helpReference);
assert.equal(helpTextFor("help  --all"), helpReference);
assert.equal(helpTextFor("--help --all"), helpReference);
// Everything else is somebody else's command, and must stay so: a bare
// invocation is `status`, and `help me` is an unsupported argument rather than
// a request for help that silently succeeds.
for (const args of ["", "  ", "status", "help me", "helpful", "all", "--all", "123 --quiet", "publish"]) {
  assert.equal(helpTextFor(args), undefined, `${JSON.stringify(args)} is not a request for help`);
}
console.log("PASS H2 help, --help and their --all forms choose the right text, and nothing else does");

// An orientation that grew back into reference prose is not an orientation.
// The budget is what makes this increment stay true after it ships.
assert(orientationLines.length <= 40,
  `The orientation is ${orientationLines.length} lines; it is meant to be read at a glance, not studied`);
assert(referenceLines.length > 100,
  `The reference is only ${referenceLines.length} lines, so detail was lost rather than moved`);
assert(helpOrientation.includes("help --all"),
  "The orientation does not say where the full reference is, so moving it there hides it");
console.log(`PASS H2 the orientation is ${orientationLines.length} lines and points at the ${referenceLines.length}-line reference`);

// The plugin ships from a marketplace listing at a tagged release. Calling
// itself a prototype was false, and false user-facing text in exactly this
// constant is why this suite exists.
for (const [name, text] of [["orientation", helpOrientation], ["reference", helpReference]]) {
  assert(!/feasibility prototype/i.test(text),
    `The ${name} still calls this plugin a runtime feasibility prototype`);
}
assert.equal(referenceLines[0], "Copilot PR Review - full reference");
assert(/^Review a pull request/.test(orientationLines[0]),
  `The orientation opens with ${JSON.stringify(orientationLines[0])} rather than what it is for`);

// The lifecycle commands are the rest of the answer an agent gives today.
for (const command of ["status", "models", "inspect", "publish", "cancel", "/pr-review-config"]) {
  assert(helpOrientation.includes(command),
    `The orientation never mentions ${command}, which is part of using this plugin`);
}
console.log("PASS H2 neither text claims to be a prototype, and the orientation names the lifecycle commands");

console.log("PASS smoke-help");
