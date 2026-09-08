import { lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

// Reviewers may read surrounding source, so the granted set is exactly
// these three built-ins; every other built-in stays natively unavailable.
export const readOnlyTools = ["view", "grep", "glob"];
export const readOnlyToolFilters = readOnlyTools.map((name) => `builtin:${name}`);
// The same builtin:grep grant is exposed as rg by GPT-family sessions.
const canonicalToolName = (name) => name === "rg" ? "grep" : name;

const refusal = "PR reviewers cannot execute tools.";
const readRefusal = "PR reviewers may only read inside the reviewed checkout.";
// A read refused because the path does not exist inside the checkout, kept
// apart from a refused boundary escape in the run's recorded evidence.
export const absentDenial = "read-absent";

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

const within = (root, path) => path === root || path.startsWith(`${root}${sep}`);

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
  if (!within(root, real)) return undefined;
  return relative(root, real) || ".";
}

// Would this request have been inside the root had it existed? Only then may a
// refusal say the path is absent. Saying "that does not exist" about a path
// outside the root would report on the host filesystem, which is exactly what
// confinement prevents, so the question is settled without resolving or naming
// anything outside: lexical containment first, then a walk from the requested
// path towards the root, stopping there.
//
// The walk asks whether each entry exists with lstat, which does not follow a
// final symlink, before it resolves anything. An entry that exists but cannot
// be resolved is a dangling or looping symlink, and it keeps the refusal this
// handler gives when it cannot tell: a symlink in the checkout may point
// anywhere, so calling it absent would say whether its target exists. Only an
// entry that is genuinely missing lets the walk climb, and only a resolved
// ancestor inside the root makes the missing remainder an absent in-root path.
function absentInsideRoot(root, path) {
  if (typeof path !== "string" || !isAbsolute(path) || !within(root, resolve(path))) return false;
  let cursor = path;
  while (within(root, resolve(cursor))) {
    let missing = false;
    try {
      lstatSync(cursor);
    } catch (error) {
      // Climb only past an entry that is not there. Any other failure, such as
      // an unreadable directory, is not an absence this refusal can claim.
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") return false;
      missing = true;
    }
    if (!missing) {
      try {
        return within(root, realpathSync.native(cursor));
      } catch {
        return false;
      }
    }
    const parent = dirname(cursor);
    if (parent === cursor) return false;
    cursor = parent;
  }
  return false;
}

// Name the path as it was requested, never a normalized form of it: collapsing
// a "missing/.." segment would report a file that does exist as absent.
const relativeToRoot = (root, path) =>
  path.startsWith(`${root}${sep}`) ? path.slice(root.length + sep.length) : path;

const absentRefusal = (root, path) =>
  `No such path inside the reviewed checkout: ${relativeToRoot(root, path)}. It does not exist in the ` +
  "reviewed revision, so this is not a confinement refusal; use glob or grep to find the path you meant.";

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
      if (contained !== undefined) {
        evidence.reads.push(contained);
        return { kind: "approve-once" };
      }
      // A path the reviewer guessed at is refused like a boundary escape, and
      // used to be refused just as mutely, so the reviewer could not tell that
      // the file was simply absent and look for the right one. It still reads
      // nothing; only the reason it is given changes, and only for a request
      // that never pointed outside the checkout.
      if (request.kind === "read" && absentInsideRoot(root, request.path)) {
        evidence.permissionDenials.push(absentDenial);
        return { kind: "reject", feedback: absentRefusal(root, request.path) };
      }
      evidence.permissionDenials.push(request.kind);
      return { kind: "reject" };
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
