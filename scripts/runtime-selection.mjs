import assert from "node:assert/strict";
import { assertExited, descendants } from "./runtime-fixture.mjs";
import { reviewKey } from "../extensions/pr-review/findings.mjs";

export function selectionProbe() {
  let pending;
  return {
    async answer(request) {
      assert(pending, "Selection request must belong to the active probe");
      pending.request.resolve(request);
      return pending.answer.promise;
    },
    async exercise(session, target, settings, { noUi = false, cases } = {}) {
      const original = (await session.rpc.metadata.snapshot()).workingDirectory;
      await session.rpc.metadata.setWorkingDirectory({ workingDirectory: target.workingDirectory });
      const invocations = new Set();
      try {
        const modes = ["all", "subset", "none", "cancel-ui", "cancel-pending", "invalid"];
        assert(!cases || cases.every((mode) => modes.includes(mode)), "Unknown selection probe case");
        for (const mode of noUi ? ["unavailable"] : cases ?? modes) {
          pending = { request: Promise.withResolvers(), answer: Promise.withResolvers() };
          const finished = Promise.withResolvers();
          const retained = Promise.withResolvers();
          const active = Promise.withResolvers();
          const activeLabels = new Set();
          const messages = [];
          let review;
          const before = await descendants();
          const unsubscribe = session.on((event) => {
            if (!["session.info", "session.error"].includes(event.type)) return;
            const message = event.data.message;
            messages.push(message);
            const match = /^Reviewer ([\w-]+): active$/.exec(message);
            if (match) activeLabels.add(match[1]);
            if (activeLabels.size === 3) active.resolve();
            if (message.startsWith("Q3 evidence: ")) {
              review = JSON.parse(message.slice("Q3 evidence: ".length));
              console.log(`P1 ${mode} review evidence: ${JSON.stringify(review)}`);
            }
            if (message.startsWith("P1 evidence: ")) finished.resolve(JSON.parse(message.slice("P1 evidence: ".length)));
            if (message.startsWith("P2 evidence: ")) retained.resolve(JSON.parse(message.slice("P2 evidence: ".length)));
            if (message.startsWith("Review/publication failed:")) retained.reject(new Error(message));
          });
          try {
            const args = `${target.args} --quick --no-comment${mode === "all" ? " --all" : ""}` +
              ` heavyModel=${settings.model} heavyEffort=${settings.reasoningEffort}`;
            assert.equal((await session.rpc.commands.execute({ commandName: "pr-review", args })).error, undefined);
            await Promise.race([
              active.promise,
              finished.promise.then(() => { throw new Error("Selection run did not reach reviewers"); }),
            ]);
            const owned = (await descendants()).filter((row) => !before.some((old) => old.pid === row.pid));
            assert.equal(owned.length, 1, `Expected one owned runtime: ${JSON.stringify(owned)}`);
            let cancelDispatch;
            if (!["all", "unavailable"].includes(mode)) {
              const request = await Promise.race([
                pending.request.promise,
                finished.promise.then((result) => { throw new Error(`Run ended without selection UI: ${JSON.stringify(result)}`); }),
              ]);
              await assertExited(owned);
              assert(review, "Q3 cleanup evidence must precede selection UI");
              assert.equal(request.sessionId, session.sessionId);
              const choices = request.requestedSchema.properties.findingIds.items.anyOf;
              assert.equal(choices.length, review.validation.findings.length);
              assert(choices.length >= (mode === "subset" ? 2 : 1), "Need validated findings for native selection");
              assert.deepEqual(choices.map((choice) => choice.const),
                review.validation.findings.map((finding) => `${review.invocation.invocationId}:${finding.id}`));
              assert.match(request.message, new RegExp(`head ${target.head}`));
              const duplicate = await session.rpc.commands.execute({ commandName: "pr-review", args });
              assert.match(duplicate.error, /already running/, "Keep the run active while its UI is pending");
              if (mode === "cancel-pending") {
                cancelDispatch = session.rpc.commands.execute({ commandName: "pr-review", args: "cancel" });
              } else {
                pending.answer.resolve(mode === "cancel-ui" ? { action: "cancel" } : {
                  action: "accept", content: {
                    findingIds: mode === "none" ? [] : mode === "invalid" ? ["unknown-finding"] : [choices[0].const],
                  },
                });
              }
            }
            const result = await finished.promise;
            const retention = await retained.promise;
            if (cancelDispatch) {
              assert.equal((await cancelDispatch).error, undefined);
              pending.answer.resolve({ action: "accept", content: {
                findingIds: [`${review.invocation.invocationId}:${review.validation.findings[0].id}`],
              } });
              await new Promise(setImmediate);
              assert.equal(messages.filter((m) => m.startsWith("P1 evidence: ")).length, 1);
            }
            await assertExited(owned);
            assert(review.validation.findings.length >= (mode === "subset" ? 2 : 1));
            assert.deepEqual(result.cleanupErrors, []);
            assert.equal(result.noComment, true);
            assert.equal(result.invocation.sessionId, session.sessionId);
            assert(!invocations.has(result.invocation.invocationId));
            invocations.add(result.invocation.invocationId);
            assert.equal(result.binding.repository.nameWithOwner, target.repository);
            assert.equal(result.binding.head, target.head);
            assert.equal(result.selection.status, mode.startsWith("cancel") ? "cancelled"
              : mode === "invalid" ? "failed" : mode === "none" ? "none" : mode === "unavailable" ? "unavailable" : "selected");
            const expected = mode === "all" ? review.validation.findings.map((finding) => finding.id)
              : mode === "subset" ? [review.validation.findings[0].id] : [];
            assert.deepEqual(result.selection.findingIds, expected);
            if (expected.length) {
              assert.equal(result.selection.binding.reviewKey, reviewKey(review.binding));
              assert.equal(result.selection.binding.invocationId, result.invocation.invocationId);
              assert.equal(result.selection.binding.sessionId, session.sessionId);
            }
            assert.equal(result.cancelled, mode.startsWith("cancel"));
            assert.equal(result.complete, review.complete && !result.cancelled);
            assert.equal(messages.filter((m) => /^Reviewer [\w-]+: starting$/.test(m)).length, 4,
              "Selection must not rerun specialists or adjudication");
            assert(messages.some((m) => m.startsWith("Finding selection:")));
            assert.equal(retention.invocation.invocationId, result.invocation.invocationId);
            const beforeInspection = messages.length;
            assert.equal((await session.rpc.commands.execute({ commandName: "pr-review", args: "inspect" })).error, undefined);
            const stored = JSON.parse(messages.slice(beforeInspection)
              .find((message) => message.startsWith("P2 inspection: ")).slice("P2 inspection: ".length));
            assert.equal(stored.digest, retention.digest);
            assert.deepEqual(stored.outcome.selection, result.selection);
            assert.equal(stored.outcome.complete, result.complete);
            assert.equal(stored.outcome.cancelled, result.cancelled);
            assert.deepEqual(stored.outcome.validation.findings, review.validation.findings);
            console.log(`P1 ${mode} runtime evidence: ${JSON.stringify({ ...result, findings: review.validation.findings, issues: review.validation.issues })}`);
            console.log(`PASS P2 ${mode}: settled selection retained/inspected; session=${session.sessionId}; digest=${retention.digest}`);
            console.log(`PASS P1 ${mode}: ${expected.length}/${review.validation.findings.length} selected; runtime ${owned[0].pid} exited${["all", "unavailable"].includes(mode) ? "" : " before UI"}`);
          } finally {
            pending.answer.resolve({ action: "cancel" });
            pending = undefined;
            unsubscribe();
          }
        }
        await target.check();
      } finally {
        await session.rpc.metadata.setWorkingDirectory({ workingDirectory: original });
      }
    },
  };
}
