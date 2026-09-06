import assert from "node:assert/strict";
import {
  parseFixtureArgs, reasoningEfforts, subscriptionModels, validateAssignments,
} from "../extensions/pr-review/fixture.mjs";

const command = "fixture model1=model-a effort1=low model2=model-b effort2=high";
const settings = parseFixtureArgs(command);
const catalog = [
  { id: "model-a", policy: { state: "enabled" }, capabilities: { supports: { reasoning_effort: ["low", "high"] } } },
  { id: "model-b", capabilities: { supports: { reasoning_effort: ["high"] } } },
  { id: "disabled", policy: { state: "disabled" } },
  { id: "unconfigured", policy: { state: "unconfigured" } },
  { id: "external/model-a" },
  { id: "auto" },
  { id: "no-reasoning" },
];
assert.deepEqual(validateAssignments(settings, catalog), [
  { label: "rounding", model: "model-a", reasoningEffort: "low" },
  { label: "shipping", model: "model-b", reasoningEffort: "high" },
]);
assert.deepEqual(parseFixtureArgs(`  ${command}  `), settings);
assert.deepEqual(subscriptionModels(catalog).map((model) => model.id),
  ["model-a", "model-b", "no-reasoning"]);
assert.deepEqual(reasoningEfforts({}), []);
assert.deepEqual(reasoningEfforts({ capabilities: { supports: { reasoning_effort: true } } }), []);

for (const args of [
  "fixture",
  "fixture model1=model-a",
  `${command} model1=model-a`,
  `${command} extra=value`,
  command.replace("effort1=low", "effort1="),
  command.replace("effort1=low", "effort1=low=high"),
  command.replace("model2=model-b", "model2=model-a"),
  command.replace("effort2=high", "effort2=low"),
]) {
  assert.throws(() => parseFixtureArgs(args), /requires|requires explicit|Invalid/);
}
for (const model1 of ["missing", "disabled", "unconfigured", "external/model-a", "auto"]) {
  assert.throws(() => validateAssignments({ ...settings, model1 }, catalog), /No substitution/);
}
for (const override of [
  { effort1: "max" },
  { model1: "no-reasoning" },
]) {
  assert.throws(() => validateAssignments({ ...settings, ...override }, catalog), /Unsupported reasoning/);
}
assert.throws(() => validateAssignments({ ...settings, extra: "value" }, catalog), /requires explicit/);
assert.throws(() => validateAssignments(settings, []), /Unavailable/);
console.log("PASS fixture argument, subscription policy, and reasoning validation (no models run)");
