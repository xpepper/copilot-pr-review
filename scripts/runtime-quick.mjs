import assert from "node:assert/strict";
import { assertExited, descendants } from "./runtime-fixture.mjs";

export async function exerciseQuick(session, target, settings) {
  const original = (await session.rpc.metadata.snapshot()).workingDirectory;
  await session.rpc.metadata.setWorkingDirectory({ workingDirectory: target.workingDirectory });
  try {
    for (const mode of ["explicit", "ambient-alias", "cancel", ...(target.expectedFinding ? ["cancel-validation"] : [])]) {
      const before = await descendants();
      let owned = [];
      const completion = Promise.withResolvers();
      const active = Promise.withResolvers();
      const validationActive = Promise.withResolvers();
      const messages = [];
      const labels = new Set();
      const unsubscribe = session.on((event) => {
        if (!["session.info", "session.error"].includes(event.type)) return;
        const message = event.data.message;
        messages.push(message);
        const match = /^Reviewer ([\w-]+): active$/.exec(message);
        if (match) labels.add(match[1]);
        if (match?.[1] === "evidence-validator") validationActive.resolve();
        if (labels.size === 3) active.resolve();
        if (message.startsWith("Q3 evidence: ")) {
          completion.resolve(JSON.parse(message.slice("Q3 evidence: ".length)));
        }
      });
      try {
        const args = `${target.args} ${mode === "ambient-alias" ? "--major-only" : "--quick"} --no-comment` +
          (mode === "ambient-alias" ? "" : ` heavyModel=${settings.model} heavyEffort=${settings.reasoningEffort}`);
        const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
        assert.equal(result.error, undefined);
        await Promise.race([
          active.promise,
          completion.promise.then(() => { throw new Error("Review ended before three active specialists were observed"); }),
        ]);
        owned = (await descendants()).filter((row) => !before.some((old) => old.pid === row.pid));
        assert.equal(owned.length, 1, "Exactly one new owned reviewer runtime");
        if (mode === "cancel-validation") {
          await Promise.race([
            validationActive.promise,
            completion.promise.then(() => { throw new Error("Review ended before validation became active"); }),
          ]);
        }
        const cancelling = mode === "cancel" || mode === "cancel-validation";
        if (cancelling) {
          const duplicate = await session.rpc.commands.execute({ commandName: "pr-review", args });
          assert.match(duplicate.error, /already running/);
          const cancelled = await session.rpc.commands.execute({ commandName: "pr-review", args: "cancel" });
          assert.equal(cancelled.error, undefined);
        }
        const report = await completion.promise;
        console.log(`Q3 ${mode} runtime evidence: ${JSON.stringify(report)}`);
        await assertExited(owned);
        assert.equal(report.mode, "quick");
        assert.equal(report.noComment, true);
        assert.deepEqual(report.cleanupErrors, []);
        assert.equal(report.binding.repository.nameWithOwner, target.repository);
        assert.equal(report.binding.head, target.head);
        assert.deepEqual(report.reviewers.map((r) => r.label),
          ["correctness", "contracts", "security-performance-resources"]);
        assert.equal(new Set(report.reviewers.map((r) => r.sessionId)).size, 3);
        const firstStart = messages.findIndex((m) => /^Reviewer [\w-]+: starting$/.test(m));
        assert(firstStart >= 0);
        assert.equal(messages.slice(0, firstStart).filter((m) => m.startsWith("Assignment ")).length, 3);
        for (const reviewer of report.reviewers) {
          assert.equal(reviewer.model, settings.model);
          assert.equal(reviewer.reasoningEffort, settings.reasoningEffort);
          assert.deepEqual(reviewer.binding, report.binding);
          if (mode !== "cancel") {
            assert.equal(reviewer.status, "completed");
            assert(reviewer.result.trim());
            assert(reviewer.usage.length);
            assert(reviewer.usage.every((usage) =>
              usage.model === settings.model && usage.reasoningEffort === settings.reasoningEffort && usage.isByok === false));
          }
        }
        if (cancelling) {
          assert.equal(report.complete, false);
          assert.equal(report.cancelled, true);
          assert.equal(report.coverage, "incomplete");
          if (mode === "cancel") assert(report.reviewers.some((r) => r.status === "cancelled"));
          else assert.equal(report.adjudicator.status, "cancelled");
          assert(messages.some((m) => m.includes("incomplete coverage")));
        } else {
          assert.equal(report.executionComplete, true, "All specialists must finish; validation coverage is separate");
          assert(report.validation, "A completed specialist run must cross the Q4 boundary");
          assert.equal(report.complete, report.validation.complete);
          assert.equal(report.coverage, report.complete ? "completed" : "incomplete");
          for (const finding of report.validation.findings) {
            assert(["P0", "P1", "P2"].includes(finding.severity));
            assert(finding.confidence >= 0.8 && finding.confidence <= 1);
            assert.equal(finding.location.ref, report.binding[finding.location.side]);
            assert.equal(finding.validation.kind, "source-grounded-model-adjudication");
            assert.equal(finding.validation.allClaimsSupported, true);
            assert(finding.validation.evidence.length);
          }
          if (target.expectedFinding) {
            assert(report.validation.findings.some((finding) => target.expectedFinding.paths
              ? target.expectedFinding.paths.includes(finding.location.path)
              : finding.location.path === target.expectedFinding.path &&
                finding.location.startLine <= target.expectedFinding.line &&
                finding.location.endLine >= target.expectedFinding.line),
            "The pinned regression must produce a validated finding on its changed source");
          }
          if (report.adjudicator) {
            assert.equal(report.adjudicator.status, "completed");
            assert(!report.reviewers.some((reviewer) => reviewer.sessionId === report.adjudicator.sessionId));
            assert(report.adjudicator.usage.length);
            assert(report.adjudicator.usage.every((usage) =>
              usage.model === settings.model && usage.reasoningEffort === settings.reasoningEffort && usage.isByok === false));
            assert(messages.some((message) => message.startsWith("Assignment evidence-validator:")));
          }
          const overlap = Math.min(...report.reviewers.map((r) => r.completedAt)) -
            Math.max(...report.reviewers.map((r) => r.startedAt));
          assert(overlap > 0, "All three actual execution intervals must overlap");
          console.log(`PASS Q3 ${mode}: three specialists overlapped ${overlap}ms`);
          console.log(`Q4 ${mode}: ${report.validation.findings.length} findings, ${report.validation.rejected.length} rejected, ` +
            `${report.validation.duplicates.length} duplicates, ${report.validation.issues.length} coverage issues`);
        }
        console.log(`PASS Q3 ${mode}: owned runtime exited (${owned[0].pid})`);
      } finally {
        unsubscribe();
      }
    }
    await target.check();
  } finally {
    await session.rpc.metadata.setWorkingDirectory({ workingDirectory: original });
  }
}
