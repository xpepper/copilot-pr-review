import assert from "node:assert/strict";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { baseSource, blobSha, headSource, shippingHeadSource, validationHeadSource } from "./target-fixture.mjs";
import { descendants } from "./runtime-fixture.mjs";
import { assertReviewableCheckout, runGit } from "../extensions/pr-review/checkout.mjs";
import { captureTarget, parseTargetArgs, runGh } from "../extensions/pr-review/target.mjs";
import { assembleContext } from "../extensions/pr-review/context.mjs";

async function dispatchTarget(session, args) {
  const before = (await session.getEvents()).length;
  const result = await session.rpc.commands.execute({ commandName: "pr-review", args });
  assert.equal(result.error, undefined);
  const messages = (await session.getEvents()).slice(before)
    .filter((event) => event.type === "session.info").map((event) => event.data.message);
  const target = messages.find((message) => message.startsWith("Q1 target: "));
  const context = messages.find((message) => message.startsWith("Q2 context: "));
  assert(target, `Missing capture outcome for ${args}`);
  return {
    ...JSON.parse(target.split("\n")[0].slice("Q1 target: ".length)),
    contextMessage: context,
    context: context ? JSON.parse(context.split("\n")[0].slice("Q2 context: ".length)) : undefined,
  };
}

export async function preparePublicCheckout(repository, head) {
  assert.match(repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  assert.match(head, /^[0-9a-f]{40}$/);
  const directory = await realpath(await mkdtemp(join(tmpdir(), "pr-review-live-target-")));
  try {
    await runGit(["init", "--quiet"], directory);
    await runGit(["remote", "add", "origin", `https://github.com/${repository}.git`], directory);
    await runGit(["fetch", "--quiet", "--depth=1", "origin", head], directory);
    // Only populate this newly allocated disposable checkout, never the user's.
    await runGit(["-c", "core.hooksPath=/dev/null", "checkout", "--quiet", "--detach", head], directory);
    const check = async () => {
      assert.equal((await runGit(["rev-parse", "HEAD"], directory)).trim(), head);
      assert.equal(await runGit(["branch", "--show-current"], directory), "");
      assert.equal(await runGit(["status", "--porcelain=v1", "--untracked-files=all"], directory), "");
      assert.equal((await runGit(["remote", "get-url", "origin"], directory)).trim(),
        `https://github.com/${repository}.git`);
    };
    await check();
    return { directory, check, async cleanup() { await rm(directory, { recursive: true }); } };
  } catch (error) {
    await rm(directory, { recursive: true });
    throw error;
  }
}

export async function prepareRegressionTargetSmoke() {
  const head = "4796469dc5ee55a8327cdffffc1da7f0050c54ad";
  const checkout = await preparePublicCheckout("ptitSeb/box64", head);
  const base = "df37f6acf0e5becb3b73fb546768273d29813053";
  return {
    sessionOptions: { workingDirectory: checkout.directory },
    quickTarget: {
      args: "3902 --include-closed", workingDirectory: checkout.directory,
      repository: "ptitSeb/box64", head, check: checkout.check,
      // Either the removed normalization or its changed CPUID consumers can anchor the same regression.
      expectedFinding: { paths: ["src/tools/env.c", "src/os/my_cpuid.c"] },
    },
    async exercise(session) {
      const outcome = await dispatchTarget(session, "3902 --include-closed");
      assert.equal(outcome.disposition, "captured");
      assert.equal(outcome.repository.nameWithOwner, "ptitSeb/box64");
      assert.equal(outcome.state, "MERGED");
      assert.equal(outcome.head, head);
      assert.equal(outcome.context.head, head);
      assert.equal(outcome.context.base, base);
      assert.equal(outcome.context.files, 6);
      assert.equal(outcome.diffSha256, "87b7e554a1445005395d4d6f8962e740c94a48dba89a7f0c9cc583ae5803b02b");
      assert.equal(outcome.diffBytes, 5251);
      assert.equal(outcome.context.contextSha256, "3a8814f10b25da28cae6939252a834893e7ee7ec64c275a05844758b3518e9fe");
      assert.equal(outcome.context.contextBytes, 52582);
      assert.equal(outcome.context.sources, 12);
      await checkout.check();
      console.log(`PASS public regression capture: ${JSON.stringify({ ...outcome, contextMessage: undefined })}`);
    },
    cleanup: checkout.cleanup,
  };
}

export async function prepareLiveTargetSmoke() {
  const checkout = await preparePublicCheckout("github/copilot-sdk", "7525814ae7de890acf63b0eb665531292adaf96d");
  const directory = checkout.directory;
  return {
    sessionOptions: { workingDirectory: directory },
    quickTarget: {
      args: "2543 --include-closed", workingDirectory: directory, repository: "github/copilot-sdk",
      head: "7525814ae7de890acf63b0eb665531292adaf96d",
      check: checkout.check,
    },
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
      assert.deepEqual({ ...outcome.context, entries: undefined }, {
        head: "7525814ae7de890acf63b0eb665531292adaf96d",
        base: "e90856093760d95793d8211219b883dfce08862c",
        radius: 40, files: 1, sources: 2, contextBytes: 14903,
        contextSha256: "2be6f0cf8e28d8e6383439dd3c24900e8cc7730ad0cb47e1414a1e20b19876d4",
        entries: undefined,
      });
      assert.deepEqual(outcome.context.entries, [{
        path: ".github/workflows/java-publish-maven.yml", status: "modified",
        sources: [
          { side: "head", blob: "d1ef78f66b7831e43d2833ce6e7cd73fb03d8395", bytes: 37420, lines: 800, windows: ["50-224"] },
          { side: "base", blob: "fd07aae155d07658f8a1654a601b5c80fff3b26a", bytes: 36577, lines: 781, windows: ["50-205"] },
        ],
      }], "Both blob identities are the ones recorded in the captured diff");
      const bot = await dispatchTarget(session, "2545 --include-closed");
      assert.equal(bot.disposition, "skipped");
      assert.equal(bot.reason, "obvious-bot");
      assert.equal(bot.context, undefined, "Skipped PRs assemble no context");
      await checkout.check();
      console.log(`PASS live github/copilot-sdk#2543: head=${outcome.head} bytes=${outcome.diffBytes} sha256=${outcome.diffSha256}`);
      console.log(`PASS live head/base source bound to ${outcome.context.head}/${outcome.context.base}, context sha256=${outcome.context.contextSha256}`);
      console.log("PASS live bot skip #2545, no-UI closed gate, and unchanged detached reviewed checkout");
    },
    cleanup: checkout.cleanup,
  };
}

export async function prepareReadTargetSmoke({ repository, number, head }) {
  assert(Number.isSafeInteger(number) && number > 0, "Set a positive live PR number");
  const checkout = await preparePublicCheckout(repository, head);
  return {
    sessionOptions: { workingDirectory: checkout.directory },
    quickTarget: {
      args: String(number), workingDirectory: checkout.directory, repository, head, check: checkout.check,
    },
    async exercise(session) {
      const outcome = await dispatchTarget(session, String(number));
      assert.equal(outcome.disposition, "captured");
      assert.equal(outcome.repository.nameWithOwner, repository);
      assert.equal(outcome.head, head);
      await checkout.check();
      console.log(`PASS pinned read target: ${repository}#${number} at ${head}`);
    },
    cleanup: checkout.cleanup,
  };
}

export async function prepareTargetSmoke({ allowPublish = false, coordinatePost = false, matchingCheckout = false } = {}) {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "pr-review-runtime-target-")));
  const trace = join(directory, ".git", "requests.jsonl");
  const sentinel = join(directory, "source.txt");
  const previousPath = process.env.PATH;
  const previousRepo = process.env.GH_REPO;
  const previousTrace = process.env.PR_REVIEW_SMOKE_TRACE;
  const previousAllowPublish = process.env.PR_REVIEW_SMOKE_ALLOW_PUBLISH;
  const previousPostMarker = process.env.PR_REVIEW_SMOKE_POST_MARKER;
  const previousHead = process.env.PR_REVIEW_SMOKE_HEAD;
  await runGit(["init", "--quiet", "-b", matchingCheckout ? "feature" : "not-the-pr-branch"], directory);
  await writeFile(trace, "");
  await writeFile(sentinel, "Unrelated local source remains unchanged.\n");
  // A local checkout on another branch, holding different source at the reviewed path.
  const decoy = "export const value = 999;\nexport const label = \"local checkout\";\n";
  const reviewed = join(directory, "example.js");
  const totalDecoy = join(directory, "total.js");
  await writeFile(reviewed, matchingCheckout ? headSource : decoy);
  if (matchingCheckout) {
    await writeFile(totalDecoy, validationHeadSource);
    await writeFile(join(directory, "shipping.js"), shippingHeadSource);
  }
  await runGit(["add", ...(matchingCheckout
    ? ["example.js", "total.js", "shipping.js", "source.txt"] : ["example.js"])], directory);
  await runGit(["-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture",
    "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false",
    "commit", "--quiet", "-m", matchingCheckout ? "reviewed fixture head" : "local only"], directory);
  const dirty = `${decoy}export const uncommitted = true;\n`;
  if (!matchingCheckout) {
    await writeFile(reviewed, dirty);
    await writeFile(totalDecoy, "Do not use local source as evidence.\n");
  }
  const localHead = (await runGit(["rev-parse", "HEAD"], directory)).trim();
  const head = matchingCheckout ? localHead : "b".repeat(40);
  const localState = () => runGit(["status", "--porcelain=v1", "--branch"], directory);
  const localBefore = await localState();
  process.env.PATH = `${fileURLToPath(new URL("fixtures", import.meta.url))}${delimiter}${previousPath}`;
  process.env.GH_REPO = "wrong/repository";
  process.env.PR_REVIEW_SMOKE_TRACE = trace;
  process.env.PR_REVIEW_SMOKE_HEAD = head;
  const postMarker = coordinatePost ? join(directory, ".git", "pr-review-post-marker") : undefined;
  if (allowPublish) process.env.PR_REVIEW_SMOKE_ALLOW_PUBLISH = "1";
  else delete process.env.PR_REVIEW_SMOKE_ALLOW_PUBLISH;
  if (postMarker) process.env.PR_REVIEW_SMOKE_POST_MARKER = postMarker;
  else delete process.env.PR_REVIEW_SMOKE_POST_MARKER;
  let confirmation = false;
  const questions = [];
  const calls = async () => (await readFile(trace, "utf8")).split("\n").filter(Boolean).map(JSON.parse);
  const checkGate = async (number = 12) => {
    assert(matchingCheckout, "Use the real-head fixture for gate acceptance");
    const { snapshot } = await captureTarget(parseTargetArgs(String(number)), { cwd: directory });
    const context = await assembleContext(snapshot, { cwd: directory, gh: runGh });
    for (const file of context.files) {
      for (const source of file.sources.filter((entry) => entry.side === "head")) {
        assert.equal(blobSha(await readFile(join(directory, file.path), "utf8")), source.blobSha);
      }
    }
    const access = await assertReviewableCheckout(snapshot, { cwd: directory, gh: runGh });
    assert.equal(access.head, head);
    assert.equal(access.root, directory);
    assert.deepEqual(access.untracked, []);
    return { snapshot, context, access };
  };
  return {
    checkGate,
    quickTarget: {
      args: "12", workingDirectory: directory, repository: "fixture/repository", head,
      expectedFinding: { path: "total.js", line: 3 },
      postMarker,
      resetPost() {
        assert(postMarker, "Publication opt-in was not enabled for this fixture");
        rmSync(postMarker, { force: true });
        rmSync(`${postMarker}.release`, { force: true });
      },
      releasePost() {
        assert(postMarker, "Publication coordination was not enabled for this fixture");
        writeFileSync(`${postMarker}.release`, "");
      },
      async awaitPost(signal) {
        assert(postMarker, "Publication opt-in was not enabled for this fixture");
        while (!existsSync(postMarker)) {
          signal.throwIfAborted();
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
      },
      async check() {
        assert.equal(await localState(), localBefore);
        assert.equal((await runGit(["rev-parse", "HEAD"], directory)).trim(),
          matchingCheckout ? head : localHead);
        assert.equal(await readFile(reviewed, "utf8"), matchingCheckout ? headSource : dirty);
        assert.equal(await readFile(totalDecoy, "utf8"), matchingCheckout ? validationHeadSource : "Do not use local source as evidence.\n");
        assert.equal(await readFile(sentinel, "utf8"), "Unrelated local source remains unchanged.\n");
        assert((await calls()).every(({ args }) => args[0] === "repo" ||
          (args[0] === "api" && args[3] === "--method" && (args[4] === "GET" ||
            (allowPublish && args[4] === "POST" && /\/reviews$/.test(args[5] ?? "") &&
              args[6] === "--include" && args[7] === "--input" && args[8] === "-")))));
      },
    },
    sessionOptions: {
      workingDirectory: directory,
      onElicitationRequest: async (request) => {
        questions.push(request.message);
        assert.equal(request.requestedSchema.properties.confirmed.type, "boolean");
        return { action: "accept", content: { confirmed: confirmation } };
      },
    },
    async exercise(session) {
      if (matchingCheckout) {
        const outcome = await dispatchTarget(session, "12");
        assert.equal(outcome.head, head);
        assert.equal(outcome.context.head, head);
        assert.equal(outcome.context.entries[0].sources[0].blob, blobSha(validationHeadSource));
        await checkGate();
        console.log(`PASS installed capture at real fixture commit ${head}`);
        return;
      }
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
          if (expected !== "captured") {
            assert.equal(report.context, undefined, "Only captured targets assemble context");
          } else {
            assert(report.diffBytes > 0);
            assert.equal(report.context.head, "b".repeat(40));
            assert.equal(report.context.base, "a".repeat(40));
            assert.deepEqual(report.context.entries, [{
              path: "example.js", status: "modified",
              sources: [
                { side: "head", blob: blobSha(headSource), bytes: Buffer.byteLength(headSource), lines: 5, windows: ["1-5"] },
                { side: "base", blob: blobSha(baseSource), bytes: Buffer.byteLength(baseSource), lines: 5, windows: ["1-5"] },
              ],
            }]);
            assert(!report.contextMessage.includes("999"), "The local branch's source is not review evidence");
          }
          console.log(`PASS /pr-review ${args}: ${expected}`);
        }
        assert.equal(questions.length, 2, "Overrides must not request confirmation");
        confirmation = true;
        const accepted = await dispatchTarget(session, "5");
        assert.equal(accepted.disposition, "captured");
        assert.equal(questions.length, 3);
        assert(questions.every((message) => /head b{40}/.test(message)));
        console.log("PASS native closed/merged confirmation decline and acceptance");

        const localHead = (await runGit(["rev-parse", "HEAD"], directory)).trim();
        assert.notEqual(localHead, "b".repeat(40), "The local HEAD is not the reviewed revision");
        assert.equal(await readFile(reviewed, "utf8"), dirty, "The dirty working tree is untouched");
        assert.equal(await localState(), localBefore);
        assert.notEqual(blobSha(dirty), blobSha(headSource));
        console.log(`PASS local branch not-the-pr-branch at ${localHead} contributed no review evidence`);

        // R1: reviewers read the checkout, so a checkout that is not the
        // reviewed revision refuses the whole run before any reviewer starts.
        // This spends no inference: no owned runtime is ever launched.
        const beforeRefusal = await descendants();
        const refusal = Promise.withResolvers();
        const refusalMessages = [];
        const unsubscribe = session.on((event) => {
          if (!["session.info", "session.error"].includes(event.type)) return;
          refusalMessages.push(event.data.message);
          if (event.data.message.startsWith("Q3 evidence: ")) {
            refusal.resolve(JSON.parse(event.data.message.slice("Q3 evidence: ".length)));
          }
        });
        try {
          const dispatched = await session.rpc.commands.execute({
            commandName: "pr-review", args: "1 --quick --no-comment --all",
          });
          assert.equal(dispatched.error, undefined);
          const outcome = await refusal.promise;
          assert.equal(outcome.coverage, "not-started");
          assert.equal(outcome.disposition, "refused");
          assert.deepEqual(outcome.reviewers, []);
          assert.equal(outcome.complete, false);
          const refused = refusalMessages.find((message) => message.startsWith("Quick review refused"));
          assert.match(refused, /Failed condition: (local-head|working-tree)/);
          assert.match(refused, /gh pr checkout 1/);
          assert(!refusalMessages.some((message) => /^Reviewer /.test(message)), "No reviewer may start");
          assert.deepEqual(await descendants(), beforeRefusal, "A refused review starts no owned runtime");
          assert.equal(await localState(), localBefore, "The gate never touches the checkout");
          console.log(`PASS /pr-review 1 --quick refused on a mismatched checkout: ${refused.split("\n")[1]}`);
        } finally { unsubscribe(); }

        const bound = await dispatchTarget(session, "11");
        assert.equal(bound.disposition, "captured");
        assert.equal(bound.context.head, "b".repeat(40));
        assert.equal(bound.context.entries[0].sources[0].blob, blobSha(headSource));
        await runGh(["api", "--hostname", "github.com", "--method", "GET",
          "repos/fixture/repository/pulls/11", "-H", "Accept: application/vnd.github+json"], directory);
        const advanced = await session.rpc.commands.execute({ commandName: "pr-review", args: "11" });
        assert.match(advanced.error, /not the blob recorded in the captured diff/);
        assert.match(advanced.error, /cccccccc/, "The advanced head is refused, not silently reviewed");
        console.log("PASS context stays bound to the captured revision after the PR advances");

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
        const contents = requests.filter(({ args }) => args[5]?.includes("/contents/"));
        assert(contents.length > 0);
        assert(contents.every(({ args }) =>
          args[5].endsWith(`ref=${"a".repeat(40)}`) || args[5].endsWith(`ref=${"b".repeat(40)}`) ||
          args[5].endsWith(`ref=${"c".repeat(40)}`)),
          "Source is requested only at captured revisions");
        assert.equal(await readFile(sentinel, "utf8"), "Unrelated local source remains unchanged.\n");
        console.log("PASS session cwd change, ambient repository override ignored, only read-only gh commands");
      } finally {
        await session.rpc.metadata.setWorkingDirectory({ workingDirectory: original });
      }
    },
    async cleanup() {
      for (const [key, value] of [
        ["PATH", previousPath], ["GH_REPO", previousRepo], ["PR_REVIEW_SMOKE_TRACE", previousTrace],
        ["PR_REVIEW_SMOKE_ALLOW_PUBLISH", previousAllowPublish], ["PR_REVIEW_SMOKE_POST_MARKER", previousPostMarker],
        ["PR_REVIEW_SMOKE_HEAD", previousHead],
      ]) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      await rm(directory, { recursive: true });
    },
  };
}
