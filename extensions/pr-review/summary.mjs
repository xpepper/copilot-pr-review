import { presentationDiagnostics } from "./coverage.mjs";
import { reviewModes } from "./modes.mjs";

// P6: the review body published on GitHub, written for the pull request's
// author. It lists what was found and says in one plain sentence whether
// coverage was partial and why; the diagnostics behind that sentence stay in the
// terminal and the retained result. Nothing imported here leads back to
// preview.mjs, so prior.mjs can read the marker written here without a cycle.
const modes = Object.values(reviewModes);

// The hidden marker that ends every summary body, written and read here so the
// two cannot drift. It is the whole last line, so nothing follows it, and its
// fields keep one order, so a body that merely mentions its words is not ours.
export const reviewMarker = ({ mode, findings, complete }) =>
  `<!-- copilot-pr-review: mode=${mode} findings=${findings} coverage=${complete ? "completed" : "incomplete"} -->`;
const markerPattern = new RegExp("(?:^|\\n)<!-- copilot-pr-review: " +
  `mode=(${[...new Set(modes.map(({ id }) => id))].join("|")}) findings=(\\d+) coverage=(?:completed|incomplete) -->$`);

export function markedReview(body) {
  const marked = typeof body === "string" ? markerPattern.exec(body) : null;
  return marked ? { mode: modes.find(({ id }) => id === marked[1]), findings: marked[2] } : undefined;
}

// I1b: the caveat incremental.mjs builds for a confined run begins with this. It
// is the one caveat whose meaning reaches GitHub, because such a run does not
// cover the whole pull request, and retention keeps no confinement, so a
// publish-later rebuild can only know it from this caveat.
export const confinedCaveatPrefix = "Fresh hunting was confined to the ";

const counted = (count, one, many) => `${count} ${count === 1 ? one : many}`;

function coverageSentence(complete, diagnostics) {
  if (complete) return "Coverage was complete.";
  // Counted as the terminal counts them, equivalent coverage gaps consolidated.
  const presented = presentationDiagnostics(diagnostics);
  const count = (kind) => presented.filter((entry) => entry.kind === kind).length;
  const discarded = count("discarded-candidate");
  const gaps = count("coverage-gap");
  const clauses = [
    // Uncounted, because one reviewer that failed can leave several behind.
    ...(count("execution-failure") ? ["part of the review did not run to completion"] : []),
    ...(discarded ? [`${counted(discarded, "more possible issue was", "more possible issues were")} dropped ` +
      `unchecked because ${discarded === 1 ? "its" : "their"} evidence could not be matched to the code`] : []),
    ...(gaps ? [`${counted(gaps, "part", "parts")} of the change could not be fully assessed`] : []),
  ];
  // An incomplete run no diagnostic explains is still never called complete.
  return `Coverage was partial${clauses.length ? `: ${clauses.join("; ")}` : ""}.`;
}

const basename = (path) => path.slice(path.lastIndexOf("/") + 1);

// A path is pull-request-controlled, as #55's review found. Inside a code span
// nothing is Markdown or HTML, so the delimiter outruns every backtick run in
// the text, and a text that starts or ends with a backtick is padded.
function codeSpan(text) {
  const fence = "`".repeat(Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length)) + 1);
  const pad = /^`|`$/.test(text) ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}

// Each finding is { severity, title, path, startLine, endLine }, in canonical
// order, with the path its inline comment is anchored on.
export function summaryBody({ mode: id, head, complete, diagnostics, findings }) {
  const mode = modes.find((entry) => entry.id === id);
  // A basename unless two different paths in this summary share it.
  const sharing = new Map();
  for (const { path } of findings) {
    if (!sharing.has(basename(path))) sharing.set(basename(path), new Set());
    sharing.get(basename(path)).add(path);
  }
  const shown = (path) => (sharing.get(basename(path)).size > 1 ? path : basename(path));
  const severities = mode.policy.severities
    .map((severity) => [severity, findings.filter((finding) => finding.severity === severity).length])
    .filter(([, count]) => count).map(([severity, count]) => `${count} × ${severity}`);
  // A title is model-written: folded onto its one line, and unable to open an
  // HTML comment that would hide the coverage sentence below it.
  const line = ({ severity, title, path, startLine, endLine }) =>
    `- ${severity} · ${title.replace(/\s+/g, " ").trim().replaceAll("<", "&lt;")} · ` +
    codeSpan(`${shown(path).replace(/[\r\n]+/g, " ")}:${startLine}${endLine === startLine ? "" : `-${endLine}`}`);
  return [
    `**${mode.label}: ${counted(findings.length, "finding", "findings")} (${severities.join(", ")})** ` +
      `at \`${head.slice(0, 7)}\``,
    findings.map(line).join("\n"),
    `${coverageSentence(complete, diagnostics)} Finding nothing elsewhere does not mean nothing is there.`,
    ...(diagnostics.some(({ kind, message }) => kind === "caveat" && message.startsWith(confinedCaveatPrefix))
      ? ["This review only looked at the commits added since this tool's earlier review, so it does not cover " +
        "the whole pull request."] : []),
    reviewMarker({ mode: mode.id, findings: findings.length, complete }),
  ].join("\n\n");
}
