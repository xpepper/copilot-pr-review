import { realpathSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";

// Reviewers may read surrounding source, so the granted set is exactly
// these three built-ins; every other built-in stays natively unavailable.
export const readOnlyTools = ["view", "grep", "glob"];
export const readOnlyToolFilters = readOnlyTools.map((name) => `builtin:${name}`);
// The same builtin:grep grant is exposed as rg by GPT-family sessions.
const canonicalToolName = (name) => name === "rg" ? "grep" : name;

const refusal = "PR reviewers cannot execute tools.";
const readRefusal = "PR reviewers may only read inside the reviewed checkout.";

export function reviewerPolicy(evidence) {
  return {
    enableConfigDiscovery: false,
    availableTools: [],
    onPermissionRequest: async (request) => {
      evidence.permissionDenials.push(request.kind);
      return { kind: "reject" };
    },
    hooks: {
      onPreToolUse: async ({ toolName }) => {
        evidence.toolDenials.push(toolName);
        return {
          permissionDecision: "deny",
          permissionDecisionReason: refusal,
        };
      },
    },
  };
}

function insideRoot(root, path) {
  if (typeof path !== "string" || !path) return undefined;
  let real;
  try {
    // The operating system resolver, not Node's: fs.realpathSync collapses ".."
    // textually before it resolves symlinks, so a checkout containing a symlink
    // to a directory could make it answer for a path inside the root while the
    // tool that opens the request reads the file the kernel resolves to,
    // outside it. This must agree with the open that follows it.
    real = realpathSync.native(path);
  } catch {
    return undefined;
  }
  if (real !== root && !real.startsWith(`${root}${sep}`)) return undefined;
  return relative(root, real) || ".";
}

// The permission handler, not the prompt, is the confinement point: a read must
// resolve to a real path inside the reviewed checkout or it is rejected.
export function readingReviewerPolicy(evidence, root) {
  if (typeof root !== "string" || !isAbsolute(root)) {
    throw new Error("Read-only reviewers require the absolute reviewed checkout root.");
  }
  return {
    enableConfigDiscovery: false,
    availableTools: [...readOnlyToolFilters],
    onPermissionRequest: async (request) => {
      const contained = request.kind === "read" ? insideRoot(root, request.path) : undefined;
      if (contained === undefined) {
        evidence.permissionDenials.push(request.kind);
        return { kind: "reject" };
      }
      evidence.reads.push(contained);
      return { kind: "approve-once" };
    },
    hooks: {
      // Read tools fall through to the permission handler instead of being
      // hook-approved, so path confinement still applies to every read.
      onPreToolUse: async ({ toolName }) => {
        if (readOnlyTools.includes(canonicalToolName(toolName))) return undefined;
        evidence.toolDenials.push(toolName);
        return {
          permissionDecision: "deny",
          permissionDecisionReason: readRefusal,
        };
      },
    },
  };
}

export function reviewerEvidence(access) {
  return access
    ? { permissionDenials: [], toolDenials: [], reads: [], toolCalls: [] }
    : { permissionDenials: [], toolDenials: [] };
}

export async function assertReviewerTools(session, expected) {
  await session.rpc.tools.initializeAndValidate();
  const { tools } = await session.rpc.tools.getCurrentMetadata();
  const offered = Array.isArray(tools) ? tools.map((tool) => canonicalToolName(tool.name)).sort() : undefined;
  const wanted = [...expected].sort();
  if (!offered || offered.length !== wanted.length || offered.some((name, index) => name !== wanted[index])) {
    throw new Error(`Runtime did not enforce the reviewer tool set (${wanted.join(", ") || "none"}). ` +
      `It offered: ${offered?.join(", ") ?? "(unreadable)"}. No review started.`);
  }
}

export async function assertNoReviewerTools(session) {
  await assertReviewerTools(session, []);
}

// This exercises the native tool pipeline, not the model's willingness to obey.
export async function probeForbiddenTools(session) {
  await assertNoReviewerTools(session);
  const probes = [];
  for (const name of ["create_file", "apply_patch", "bash", "task", "skill", "tool_search"]) {
    let rejection;
    let result;
    try {
      result = await session.rpc.tools.execute({
        name,
        arguments: name === "apply_patch" ? "*** Begin Patch\n*** End Patch\n" : {},
      });
    } catch (error) {
      rejection = String(error);
    }
    // A schema error, transport error, or permission prompt is not allowlist evidence.
    if (result?.resultType === "denied" && result.error === `Denied by preToolUse hook: ${refusal}`) {
      probes.push({ name, resultType: result.resultType, rejection: result.error });
      continue;
    }
    if (!rejection || !/not (available|found)|unknown tool/i.test(rejection)) {
      throw new Error(`Forbidden tool ${name} did not produce an unavailable-tool rejection: ${rejection}`);
    }
    probes.push({ name, rejection });
  }
  return probes;
}
