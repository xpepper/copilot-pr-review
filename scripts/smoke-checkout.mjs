// Controlled probe for the R1 revision-identity gate. It runs real Git against
// throwaway checkouts, spends no inference, and makes no GitHub request.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertReviewableCheckout, refuseCheckout, runGit } from "../extensions/pr-review/checkout.mjs";
import { reviewModes } from "../extensions/pr-review/modes.mjs";

const temporary = [];
function repositoryFixture({ commit = true } = {}) {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-checkout-")));
  temporary.push(directory);
  execFileSync("git", ["init", "--quiet", "-b", "pr-branch", directory]);
  if (!commit) return { directory };
  writeFileSync(join(directory, "example.js"), "export const value = 2;\n");
  execFileSync("git", ["-C", directory, "add", "example.js"]);
  execFileSync("git", ["-C", directory, "-c", "user.email=fixture@example.invalid",
    "-c", "user.name=Fixture", "commit", "--quiet", "-m", "reviewed head"]);
  const head = execFileSync("git", ["-C", directory, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  return { directory, head };
}

const repository = {
  id: "R_fixture", nameWithOwner: "fixture/repository",
  host: "github.com", url: "https://github.com/fixture/repository",
};
const snapshotFor = (head, number = 12) => ({ repository, pull: { number, head: { sha: head } } });

function fakeGh(head, { calls = [] } = {}) {
  return async (args, cwd) => {
    calls.push({ args, cwd });
    assert.deepEqual(args, [
      "api", "--hostname", "github.com", "--method", "GET",
      "repos/fixture/repository/pulls/12", "-H", "Accept: application/vnd.github+json",
    ]);
    return JSON.stringify({ number: 12, head: { sha: head } });
  };
}

const state = (directory) =>
  execFileSync("git", ["-C", directory, "status", "--porcelain=v1", "--branch"], { encoding: "utf8" });

try {
  // 1. A matching, clean checkout is accepted and reports its real root.
  const matching = repositoryFixture();
  const before = state(matching.directory);
  const calls = [];
  const accepted = await assertReviewableCheckout(snapshotFor(matching.head),
    { cwd: matching.directory, gh: fakeGh(matching.head, { calls }) });
  assert.deepEqual(accepted, { root: matching.directory, head: matching.head, untracked: [] });
  assert.equal(calls.length, 1, "Exactly one fresh remote head confirmation");
  assert.equal(state(matching.directory), before, "The gate must never touch the checkout");
  console.log(`PASS matching clean checkout accepted at ${accepted.head}`);

  // 2. A session opened in a subdirectory still confines reads to the root.
  const nested = join(matching.directory, "src", "deep");
  mkdirSync(nested, { recursive: true });
  const fromNested = await assertReviewableCheckout(snapshotFor(matching.head),
    { cwd: nested, gh: fakeGh(matching.head) });
  assert.equal(fromNested.root, matching.directory);
  rmSync(join(matching.directory, "src"), { recursive: true, force: true });
  console.log("PASS the checkout root is resolved from a nested working directory");

  // 3. Non-ignored untracked files warn only; they cannot be reviewed content.
  writeFileSync(join(matching.directory, "scratch.txt"), "local scratch\n");
  const warned = await assertReviewableCheckout(snapshotFor(matching.head),
    { cwd: matching.directory, gh: fakeGh(matching.head) });
  assert.deepEqual(warned.untracked, ["scratch.txt"]);
  rmSync(join(matching.directory, "scratch.txt"));
  console.log("PASS untracked files warn without blocking");

  // 4. A checkout parked on another revision is refused, with the fixing command.
  execFileSync("git", ["-C", matching.directory, "-c", "user.email=fixture@example.invalid",
    "-c", "user.name=Fixture", "commit", "--quiet", "--allow-empty", "-m", "later work"]);
  const movedHead = execFileSync("git", ["-C", matching.directory, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  assert.notEqual(movedHead, matching.head);
  await assert.rejects(
    assertReviewableCheckout(snapshotFor(matching.head), { cwd: matching.directory, gh: fakeGh(matching.head) }),
    (error) => {
      assert.match(error.message, /Failed condition: local-head/);
      assert.match(error.message, new RegExp(`local HEAD is ${movedHead}`));
      assert.match(error.message, /gh pr checkout 12/);
      assert.match(error.message, /no override flag/);
      return true;
    });
  console.log("PASS mismatched local HEAD refused before any reviewer");

  // 5. Modified or staged tracked files are refused: the tree is not the revision.
  const dirty = repositoryFixture();
  writeFileSync(join(dirty.directory, "example.js"), "export const value = 3;\n");
  await assert.rejects(
    assertReviewableCheckout(snapshotFor(dirty.head), { cwd: dirty.directory, gh: fakeGh(dirty.head) }),
    (error) => {
      assert.match(error.message, /Failed condition: working-tree/);
      assert.match(error.message, /example\.js/);
      return true;
    });
  execFileSync("git", ["-C", dirty.directory, "add", "example.js"]);
  await assert.rejects(
    assertReviewableCheckout(snapshotFor(dirty.head), { cwd: dirty.directory, gh: fakeGh(dirty.head) }),
    /Failed condition: working-tree/);
  console.log("PASS modified and staged tracked files refuse the review");

  // 6. A moved remote head means the captured snapshot is stale.
  const stale = repositoryFixture();
  await assert.rejects(
    assertReviewableCheckout(snapshotFor(stale.head), { cwd: stale.directory, gh: fakeGh("f".repeat(40)) }),
    (error) => {
      assert.match(error.message, /Failed condition: remote-head/);
      assert.match(error.message, new RegExp(`now has head ${"f".repeat(40)}`));
      assert.match(error.message, /rerun \/pr-review 12 --quick/);
      return true;
    });
  console.log("PASS a moved remote head stops the run instead of re-capturing");

  // 7. Directories that are not Git checkouts, and repositories without a commit.
  const bare = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-not-git-")));
  temporary.push(bare);
  await assert.rejects(
    assertReviewableCheckout(snapshotFor("a".repeat(40)), { cwd: bare, gh: fakeGh("a".repeat(40)) }),
    /Failed condition: not-a-git-checkout/);
  const unborn = repositoryFixture({ commit: false });
  await assert.rejects(
    assertReviewableCheckout(snapshotFor("a".repeat(40)), { cwd: unborn.directory, gh: fakeGh("a".repeat(40)) }),
    /Failed condition: local-head/);
  console.log("PASS non-checkouts and unborn branches refuse the review");

  // 8. Cancellation and unusable working directories stop before Git runs.
  const controller = new AbortController();
  controller.abort(new DOMException("cancelled", "AbortError"));
  await assert.rejects(assertReviewableCheckout(snapshotFor(matching.head),
    { cwd: matching.directory, gh: fakeGh(matching.head), signal: controller.signal }), { name: "AbortError" });
  await assert.rejects(runGit(["status"], "relative/path"), /absolute working directory/);
  console.log("PASS cancellation and non-absolute working directories are refused");

  // 9. The refusal text always names the failed condition, the mode and the fix.
  for (const mode of [reviewModes.quick, reviewModes.balanced, reviewModes.full]) {
    for (const condition of ["local-head", "working-tree", "remote-head", "not-a-git-checkout"]) {
      const message = refuseCheckout(condition, "detail", 7, mode);
      assert.match(message, new RegExp(`Failed condition: ${condition}`));
      assert.match(message, new RegExp(`^${mode.label} refused before any reviewer started`));
      assert.match(message, condition === "remote-head"
        ? new RegExp(`rerun /pr-review 7 ${mode.flag}`) : /gh pr checkout 7/);
      assert.match(message, /no local file was touched/);
    }
  }
  // The balanced and full gates refuse on exactly the same evidence, each
  // naming its own mode; no mode gets an override or a degraded fallback.
  for (const mode of [reviewModes.balanced, reviewModes.full]) {
    await assert.rejects(
      assertReviewableCheckout(snapshotFor("c".repeat(40)),
        { cwd: matching.directory, gh: fakeGh("c".repeat(40)), mode }),
      (error) => {
        assert.match(error.message, new RegExp(`^${mode.label} refused before any reviewer started`));
        assert.match(error.message, /Failed condition: local-head/);
        assert.match(error.message, new RegExp(`rerun /pr-review 12 ${mode.flag}`));
        return true;
      });
  }
  console.log("PASS every refusal names its mode, its failed condition and the exact fixing command");
} finally {
  for (const directory of temporary) rmSync(directory, { recursive: true, force: true });
}
