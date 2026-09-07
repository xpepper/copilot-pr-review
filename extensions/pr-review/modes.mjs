// Review modes are pure declarations: reviewer topology, the tier each reviewer
// resolves, and the findings policy the mode presents. Nothing here executes,
// so every consumer (instructions, adjudication, retention, publication) reads
// the same source for what a mode is allowed to report.
const correctness = { label: "correctness", tier: "heavy",
  focus: "Logic, state transitions, edge cases, and functional correctness." };
const contracts = { label: "contracts", tier: "heavy",
  focus: "API and data contracts, compatibility, callers, and integration boundaries." };
const security = { label: "security", tier: "heavy",
  focus: "Untrusted input, authentication and authorization, secrets, injection, and unsafe defaults." };
const performanceResources = { label: "performance-resources", tier: "heavy",
  focus: "Algorithmic cost, hot paths, blocking work, allocation, and resource lifetime or leaks." };
const overview = { label: "overview", tier: "light",
  focus: "Whole-change coherence: oversights, missed call sites, misleading names, and small " +
    "defects on the changed lines that a narrow specialist may pass over." };

// Every mode ranks the same severities in the same order. Balanced and full
// admit the minor ones too and differ only in how many they present, so the
// vocabulary is declared once and cannot drift between them.
const majorSeverities = ["P0", "P1", "P2"];
const minorSeverities = ["P3", "nit"];
const minorPolicy = (label, minorCap) => ({
  label, severities: [...majorSeverities, ...minorSeverities], minorSeverities, minorCap,
});

export const reviewModes = {
  quick: {
    id: "quick",
    flag: "--quick",
    aliases: ["--major-only"],
    label: "Quick review",
    evidencePrefix: "Q3",
    specialists: [
      correctness,
      contracts,
      { label: "security-performance-resources", tier: "heavy",
        focus: "Security, performance, resource lifetime, and leaks." },
    ],
    policy: {
      label: "Quick review",
      severities: majorSeverities,
      minorSeverities: [],
      minorCap: 0,
    },
  },
  balanced: {
    id: "balanced",
    flag: "--balanced",
    aliases: [],
    label: "Balanced review",
    evidencePrefix: "M1",
    specialists: [correctness, contracts, security, performanceResources, overview],
    policy: minorPolicy("Balanced review", 3),
  },
  full: {
    id: "full",
    flag: "--full",
    aliases: [],
    label: "Full review",
    evidencePrefix: "M1",
    specialists: [
      correctness, contracts, security, performanceResources, overview,
      { label: "conventions-maintainability", tier: "medium",
        focus: "Project conventions, naming, structure, error handling, tests and documentation; " +
          "maintainability of the changed code, judged against the surrounding codebase." },
    ],
    // Full presents every qualifying severity, so its minor allowance is
    // unbounded rather than absent: the cap arithmetic stays one number.
    policy: minorPolicy("Full review", Infinity),
  },
};

export const defaultModeId = "balanced";
export const captureOnlyFlag = "--capture-only";
export const modeIds = Object.keys(reviewModes);
export const modeFlags = modeIds.flatMap((id) => [reviewModes[id].flag, ...reviewModes[id].aliases]);

export function reviewMode(id) {
  const mode = Object.hasOwn(reviewModes, id) ? reviewModes[id] : undefined;
  if (!mode) throw new Error(`Unknown review mode: ${JSON.stringify(id)}.`);
  return mode;
}

export function modeForFlag(flag) {
  return modeIds.map((id) => reviewModes[id])
    .find((mode) => mode.flag === flag || mode.aliases.includes(flag));
}

// Severity order is declared, not inferred from string comparison, so the
// presentation order and the minor-finding cap agree with the policy.
export function severityRank(policy, severity) {
  const rank = policy.severities.indexOf(severity);
  if (rank < 0) throw new Error(`Severity ${JSON.stringify(severity)} is outside the ${policy.label} policy.`);
  return rank;
}

export const isMinor = (policy, severity) => policy.minorSeverities.includes(severity);
// A mode either admits no minor finding at all, presents a bounded number of
// them, or presents every one it accepts. Both predicates read the declared cap,
// so the wording, the reviewer instructions and the retention check agree.
export const admitsMinor = (policy) => policy.minorSeverities.length > 0 && policy.minorCap > 0;
export const capsMinor = (policy) => Number.isFinite(policy.minorCap);

export function describePolicy(policy) {
  const major = policy.severities.filter((severity) => !isMinor(policy, severity));
  const range = `${major[0]}-${major.at(-1)}`;
  if (!admitsMinor(policy)) return `${range} findings only`;
  const minor = policy.minorSeverities.join("/");
  return capsMinor(policy)
    ? `${range} findings, plus at most ${policy.minorCap} ${minor} finding(s) anchored on ` +
      "this diff's changed lines"
    : `${range} findings, plus every substantiated ${minor} finding anchored on ` +
      "this diff's changed lines";
}
