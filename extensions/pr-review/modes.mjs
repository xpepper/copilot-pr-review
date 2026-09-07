// Review modes are pure declarations: reviewer topology, the tier each reviewer
// resolves, and the findings policy the mode presents. Nothing here executes,
// so every consumer (instructions, adjudication, retention, publication) reads
// the same source for what a mode is allowed to report.
const correctness = { label: "correctness", tier: "heavy",
  focus: "Logic, state transitions, edge cases, and functional correctness." };
const contracts = { label: "contracts", tier: "heavy",
  focus: "API and data contracts, compatibility, callers, and integration boundaries." };

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
      severities: ["P0", "P1", "P2"],
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
    specialists: [
      correctness,
      contracts,
      { label: "security", tier: "heavy",
        focus: "Untrusted input, authentication and authorization, secrets, injection, and unsafe defaults." },
      { label: "performance-resources", tier: "heavy",
        focus: "Algorithmic cost, hot paths, blocking work, allocation, and resource lifetime or leaks." },
      { label: "overview", tier: "light",
        focus: "Whole-change coherence: oversights, missed call sites, misleading names, and small " +
          "defects on the changed lines that a narrow specialist may pass over." },
    ],
    policy: {
      label: "Balanced review",
      severities: ["P0", "P1", "P2", "P3", "nit"],
      minorSeverities: ["P3", "nit"],
      minorCap: 3,
    },
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

export function describePolicy(policy) {
  const major = policy.severities.filter((severity) => !isMinor(policy, severity));
  const range = `${major[0]}-${major.at(-1)}`;
  return policy.minorCap
    ? `${range} findings, plus at most ${policy.minorCap} ${policy.minorSeverities.join("/")} ` +
      "finding(s) anchored on this diff's changed lines"
    : `${range} findings only`;
}
