import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

async function dispatchTarget(session, args) {
  const before = (await session.getEvents()).length;
  const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
  assert.equal(result.error, undefined);
  const output = (await session.getEvents()).slice(before)
    .find((event) => event.type === "session.info" && event.data.message.startsWith("Q1 target: "));
  assert(output, `Missing capture outcome for ${args}`);
  return JSON.parse(output.data.message.split("\n")[0].slice("Q1 target: ".length));
}

export async function prepareLiveTargetSmoke() {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "pr-review-live-target-")));
  execFileSync("git", ["init", "--quiet", directory]);
  execFileSync("git", ["-C", directory, "remote", "add", "origin", "https://github.com/github/copilot-sdk.git"]);
  const sentinel = join(directory, "not-the-reviewed-source.txt");
  await writeFile(sentinel, "Different local checkout; do not use as PR evidence.\n");
  const state = () => execFileSync("git", ["-C", directory, "status", "--porcelain=v1", "--branch"], { encoding: "utf8" });
  const before = state();
  return {
    sessionOptions: { workingDirectory: directory },
    async exercise(session) {
      const pending = await dispatchTarget(session, "2543");
      assert.equal(pending.disposition, "confirmation-required", "No elicitation UI: require an explicit override");
      const outcome = await dispatchTarget(session, "2543 --include-closed");
      assert.equal(outcome.disposition, "captured");
      assert.equal(outcome.repository.nameWithOwner, "github/copilot-sdk");
      assert.equal(outcome.state, "MERGED");
      assert.equal(outcome.head, "7525814ae7de890acf63b0eb665531292adaf96d");
      assert.equal(outcome.diffSha256, "7a343fbb2f05089c786d0e8bfeea6a3471a86e8b4d94c6744bb7d2f8af40c883");
      assert.equal(outcome.diffBytes, 3168);
      const bot = await dispatchTarget(session, "2545 --include-closed");
      assert.equal(bot.disposition, "skipped");
      assert.equal(bot.reason, "obvious-bot");
      assert.equal(state(), before);
      assert.equal(await readFile(sentinel, "utf8"), "Different local checkout; do not use as PR evidence.\n");
      console.log(`PASS live github/copilot-sdk#2543: head=${outcome.head} bytes=${outcome.diffBytes} sha256=${outcome.diffSha256}`);
      console.log("PASS live bot skip #2545, no-UI closed gate, and unchanged empty local Git checkout");
    },
    async cleanup() { await rm(directory, { recursive: true }); },
  };
}

export async function prepareTargetSmoke() {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "pr-review-runtime-target-")));
  const trace = join(directory, "requests.jsonl");
  const sentinel = join(directory, "source.txt");
  const previousPath = process.env.PATH;
  const previousRepo = process.env.GH_REPO;
  const previousTrace = process.env.PR_REVIEW_SMOKE_TRACE;
  await writeFile(trace, "");
  await writeFile(sentinel, "Unrelated local source remains unchanged.\n");
  process.env.PATH = `${fileURLToPath(new URL("fixtures", import.meta.url))}${delimiter}${previousPath}`;
  process.env.GH_REPO = "wrong/repository";
  process.env.PR_REVIEW_SMOKE_TRACE = trace;
  let confirmation = false;
  const questions = [];
  const calls = async () => (await readFile(trace, "utf8")).split("\n").filter(Boolean).map(JSON.parse);
  return {
    sessionOptions: {
      onElicitationRequest: async (request) => {
        questions.push(request.message);
        assert.equal(request.requestedSchema.properties.confirmed.type, "boolean");
        return { action: "accept", content: { confirmed: confirmation } };
      },
    },
    async exercise(session) {
      const original = (await session.rpc.metadata.snapshot()).workingDirectory;
      try {
        await session.rpc.metadata.setWorkingDirectory({ workingDirectory: directory });
        for (const [args, expected] of [
          ["1", "captured"], ["2", "skipped"], ["2 --include-drafts", "captured"],
          ["3", "skipped"], ["4", "skipped"], ["5", "declined"], ["6", "declined"],
          ["5 --include-closed", "captured"], ["6 --review-closed", "captured"],
        ]) {
          const report = await dispatchTarget(session, args);
          assert.equal(report.disposition, expected, args);
          assert.equal(report.repository.nameWithOwner, "fixture/repository");
          assert.equal(report.head, "b".repeat(40));
          if (expected === "captured") assert(report.diffBytes > 0);
          console.log(`PASS /pr-review ${args}: ${expected}`);
        }
        assert.equal(questions.length, 2, "Overrides must not request confirmation");
        confirmation = true;
        const accepted = await dispatchTarget(session, "5");
        assert.equal(accepted.disposition, "captured");
        assert.equal(questions.length, 3);
        assert(questions.every((message) => /head b{40}/.test(message)));
        console.log("PASS native closed/merged confirmation decline and acceptance");

        for (const [args, expected] of [
          ["8", /HTTP 404/], ["9", /changed during capture/], ["10", /truncated/i],
          ["0", /positive safe integer/], ["1 --verify", /Unsupported arguments/],
        ]) {
          const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
          assert.match(result.error, expected);
          console.log(`PASS explicit capture error /pr-review ${args}`);
        }
        const requests = await calls();
        assert(requests.length > 0);
        assert.deepEqual(requests.filter((request) => request.cwd !== directory || request.repoOverride !== null), [],
          "Resolve each invocation's session cwd, not the extension cwd or GH_REPO");
        assert(requests.every(({ args }) => args[0] === "repo" ||
          (args[0] === "api" && args[3] === "--method" && args[4] === "GET")));
        assert.equal(await readFile(sentinel, "utf8"), "Unrelated local source remains unchanged.\n");
        console.log("PASS session cwd change, ambient repository override ignored, only read-only gh commands");
      } finally {
        await session.rpc.metadata.setWorkingDirectory({ workingDirectory: original });
      }
    },
    async cleanup() {
      for (const [key, value] of [
        ["PATH", previousPath], ["GH_REPO", previousRepo], ["PR_REVIEW_SMOKE_TRACE", previousTrace],
      ]) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      await rm(directory, { recursive: true });
    },
  };
}
