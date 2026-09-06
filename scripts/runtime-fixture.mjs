import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";

const exec = promisify(execFile);
function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
    return false;
  }
}

async function assertExited(rows) {
  // Harness-only exit observation bound, not a reviewer execution deadline.
  for (let attempt = 0; attempt < 100 && rows.some((row) => isAlive(row.pid)); attempt++) {
    await delay(50);
  }
  for (const row of rows) {
    assert.equal(isAlive(row.pid), false, `Owned process ${row.pid} must exit, not be orphaned`);
  }
}

async function descendants() {
  const { stdout } = await exec("ps", ["-axo", "pid=,ppid=,command="]);
  const rows = stdout.trim().split("\n").map((line) => {
    const [, pid, ppid, command] = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
    return { pid: Number(pid), ppid: Number(ppid), command };
  });
  const owned = new Set([process.pid]);
  for (let changed = true; changed;) {
    changed = false;
    for (const row of rows) {
      if (owned.has(row.ppid) && !owned.has(row.pid)) {
        owned.add(row.pid);
        changed = true;
      }
    }
  }
  return rows.filter((row) => owned.has(row.pid) && row.pid !== process.pid && !row.command.startsWith("ps "));
}

export async function startFixture(session, args) {
  const completion = Promise.withResolvers();
  const unsubscribe = session.on((event) => {
    if (event.type === "session.info" && /^F[23] evidence: /.test(event.data.message)) {
      completion.resolve(JSON.parse(event.data.message.slice("F3 evidence: ".length)));
    }
  });
  try {
    const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
    if (result.error) throw new Error(result.error);
    return { done: completion.promise, unsubscribe };
  } catch (error) {
    unsubscribe();
    throw error;
  }
}

export async function exerciseF3(session, args, parentModel, onParentKilled) {
  for (const experiment of ["cancel-startup", "adversarial", "failure", "cancel", "cancel-unresponsive", "disconnect", "shutdown", "extension-loss", "parent-loss"]) {
    const interrupt = !["cancel-startup", "adversarial", "failure"].includes(experiment);
    const messages = [];
    const bothActive = Promise.withResolvers();
    const active = new Set();
    const unsubscribe = session.on((event) => {
      if (!["session.info", "session.error"].includes(event.type)) return;
      const message = event.data.message;
      messages.push(message);
      console.log(message);
      const match = message.match(/^Reviewer (\w+): active$/);
      if (match) active.add(match[1]);
      if (active.size === 2) bothActive.resolve();
    });
    const before = await descendants();
    let during = [];
    let run;
    try {
      run = await startFixture(session, `${["adversarial", "failure"].includes(experiment) ? experiment : "fixture"} ${args}`);
      if (experiment === "cancel-startup") {
        const cancelled = await session.rpc.commands.execute({ commandName: "pr-review", args: "cancel" });
        assert.equal(cancelled.error, undefined);
      }
      if (interrupt) {
        await Promise.race([
          bothActive.promise,
          run.done.then(() => { throw new Error("Review finished before two active reviewers were observed"); }),
        ]);
        assert.deepEqual(await session.rpc.model.getCurrent(), parentModel);
        during = (await descendants()).filter((row) => !before.some((old) => old.pid === row.pid));
        assert.equal(during.length, 1, "Must identify exactly one new owned reviewer runtime");
        console.log(`F3 ${experiment} active processes: ${JSON.stringify(during)}`);
        if (["cancel", "cancel-unresponsive"].includes(experiment)) {
          const duplicate = await session.rpc.commands.execute({ commandName: "pr-review", args: `fixture ${args}` });
          assert.match(duplicate.error, /already running/);
          if (experiment === "cancel-unresponsive") process.kill(during[0].pid, "SIGSTOP");
          const cancelled = await session.rpc.commands.execute({ commandName: "pr-review", args: "cancel" });
          assert.equal(cancelled.error, undefined);
        } else if (experiment === "disconnect") {
          process.kill(during[0].pid, "SIGKILL");
        } else if (["extension-loss", "parent-loss"].includes(experiment)) {
          const extensionProcess = before.find((row) => row.pid === during[0].ppid);
          assert(extensionProcess, "Reviewer runtime must belong to an observed extension");
          const target = experiment === "extension-loss"
            ? extensionProcess : before.find((row) => row.pid === extensionProcess.ppid);
          assert(target, "Loss target must belong to the smoke process tree");
          process.kill(target.pid, "SIGKILL");
          if (experiment === "parent-loss") onParentKilled();
          await assertExited([...during, extensionProcess]);
          if (experiment === "extension-loss") await session.rpc.extensions.reload();
        } else {
          await session.rpc.extensions.reload();
        }
      }
      if (["shutdown", "extension-loss", "parent-loss"].includes(experiment)) {
        if (experiment !== "parent-loss") {
          const result = await session.rpc.commands.execute({ commandName: "pr-review", args: "status" });
          assert.equal(result.error, undefined, "Reload must leave a responsive extension");
        }
        assert(!messages.some((message) => /^F[23] evidence: /.test(message)),
          "Shutdown must not claim completed execution");
      } else {
        const report = await run.done;
        if (experiment === "adversarial") {
          assert.equal(report.complete, true);
          assert.equal(report.enforcement.length, 2);
          for (const entry of report.enforcement) {
            assert.equal(entry.probes.length, 6);
            assert(entry.probes.every((probe) => probe.resultType === "denied"));
          }
        } else {
          assert.equal(report.complete, false);
          assert(messages.some((message) => /incomplete coverage/.test(message)));
          if (experiment === "failure") {
            assert.equal(report.reviewers[0].status, "incomplete");
            assert.match(report.reviewers[0].error, /Injected reviewer failure/);
            assert.equal(report.reviewers[0].abortAcknowledged, true);
            assert.equal(report.reviewers[1].status, "completed");
            assert(report.reviewers[1].result.trim());
          } else if (experiment === "disconnect") {
            assert(report.reviewers.every((reviewer) =>
              reviewer.status === "incomplete" && /Owned runtime disconnected/.test(reviewer.error)));
            assert(report.cleanupErrors.length > 0, "Disconnected cleanup errors must remain visible");
          } else if (experiment === "cancel-startup") {
            assert.equal(report.cancelled, true);
            assert(!messages.some((message) => /Reviewer \w+: active/.test(message)));
            during = (await descendants()).filter((row) => !before.some((old) => old.pid === row.pid));
          } else {
            assert.equal(report.cancelled, true);
            assert(report.reviewers.every((reviewer) => reviewer.status === "cancelled"));
            assert.deepEqual(report.cleanupErrors, []);
          }
        }
      }
      await assertExited(during);
      console.log(`PASS F3 ${experiment}`);
    } finally {
      run?.unsubscribe();
      unsubscribe();
      for (const row of during) {
        if (isAlive(row.pid)) {
          console.error(`HARNESS CLEANUP: killing leftover runtime ${row.pid}; not plugin cleanup evidence.`);
          process.kill(row.pid, "SIGKILL");
        }
      }
    }
  }
}
