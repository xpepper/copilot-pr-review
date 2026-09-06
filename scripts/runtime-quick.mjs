import assert from "node:assert/strict";
import { assertExited, descendants } from "./runtime-fixture.mjs";

export async function exerciseQuick(session, target, settings) {
  const original = (await session.rpc.metadata.snapshot()).workingDirectory;
  await session.rpc.metadata.setWorkingDirectory({ workingDirectory: target.workingDirectory });
  try {
    for (const mode of ["explicit", "ambient-alias", "cancel"]) {
      const before = await descendants();
      let owned = [];
      const completion = Promise.withResolvers();
      const active = Promise.withResolvers();
      const messages = [];
      const labels = new Set();
      const unsubscribe = session.on((event) => {
        if (!["session.info", "session.error"].includes(event.type)) return;
        const message = event.data.message;
        messages.push(message);
        const match = /^Reviewer ([\w-]+): active$/.exec(message);
        if (match) labels.add(match[1]);
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
        if (mode === "cancel") {
          const duplicate = await session.rpc.commands.execute({ commandName: "pr-review", args });
          assert.match(duplicate.error, /already running/);
          const cancelled = await session.rpc.commands.execute({ commandName: "pr-review", args: "cancel" });
          assert.equal(cancelled.error, undefined);
        }
        const report = await completion.promise;
        await assertExited(owned);
        assert.equal(report.mode, "quick");
        assert.equal(report.noComment, true);
        assert.equal(report.validated, false);
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
        if (mode === "cancel") {
          assert.equal(report.complete, false);
          assert.equal(report.cancelled, true);
          assert.equal(report.coverage, "incomplete");
          assert(report.reviewers.some((r) => r.status === "cancelled"));
          assert(messages.some((m) => m.includes("incomplete coverage")));
        } else {
          assert.equal(report.complete, true);
          const overlap = Math.min(...report.reviewers.map((r) => r.completedAt)) -
            Math.max(...report.reviewers.map((r) => r.startedAt));
          assert(overlap > 0, "All three actual execution intervals must overlap");
          console.log(`PASS Q3 ${mode}: three specialists overlapped ${overlap}ms`);
        }
        console.log(`Q3 ${mode} runtime evidence: ${JSON.stringify(report)}`);
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
