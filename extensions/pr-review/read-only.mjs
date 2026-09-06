export function reviewerPolicy(evidence) {
  return {
    enableConfigDiscovery: false,
    availableTools: [],
    onPermissionRequest: async (request) => {
      evidence.permissionDenials.push(request.kind);
      return { kind: "denied-no-approval-rule" };
    },
    hooks: {
      onPreToolUse: async ({ toolName }) => {
        evidence.toolDenials.push(toolName);
        return {
          permissionDecision: "deny",
          permissionDecisionReason: "PR reviewers cannot execute tools.",
        };
      },
    },
  };
}

export async function assertNoReviewerTools(session) {
  await session.rpc.tools.initializeAndValidate();
  const { tools } = await session.rpc.tools.getCurrentMetadata();
  if (!Array.isArray(tools) || tools.length !== 0) {
    throw new Error("Runtime did not enforce the empty reviewer tool set. No review started.");
  }
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
    if (result?.resultType === "denied" &&
        result.error === "Denied by preToolUse hook: PR reviewers cannot execute tools.") {
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
