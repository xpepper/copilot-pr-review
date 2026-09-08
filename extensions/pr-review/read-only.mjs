import { realpathSync } from "node:fs";
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
// anything outside: lexical containment first, then a walk that stops at the
// root. The walk resolves the requested path rather than its normalized form,
// because a symlink inside the checkout that points outside must be followed,
// never collapsed textually; a partially resolvable chain whose nearest
// existing ancestor lands outside is an escape, not an absent file.
function absentInsideRoot(root, path) {
  if (typeof path !== "string" || !isAbsolute(path) || !within(root, resolve(path))) return false;
  let cursor = dirname(path);
  while (within(root, resolve(cursor))) {
    try {
      return within(root, realpathSync.native(cursor));
    } catch (error) {
      // Keep walking only while the ancestor is missing. Any other failure,
      // such as an unreadable directory or a symlink loop, keeps the refusal
      // this handler gives when it cannot tell.
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") return false;
    }
    const parent = dirname(cursor);
    if (parent === cursor) return false;
    cursor = parent;
  }
  return false;
}

const absentRefusal = (root, path) =>
  `No such path inside the reviewed checkout: ${relative(root, resolve(path))}. It does not exist in the ` +
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
