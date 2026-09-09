// Controlled probe for the R1 revision-identity gate. It runs real Git against
// throwaway checkouts, spends no inference, and makes no GitHub request.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertReviewableCheckout, refuseCheckout, runGit, verificationNotice,
} from "../extensions/pr-review/checkout.mjs";
import { reviewModes } from "../extensions/pr-review/modes.mjs";

const temporary = [];
function repositoryFixture({ commit = true, ignore } = {}) {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-checkout-")));
  temporary.push(directory);
  execFileSync("git", ["init", "--quiet", "-b", "pr-branch", directory]);
  if (!commit) return { directory };
  writeFileSync(join(directory, "example.js"), "export const value = 2;\n");
  if (ignore) writeFileSync(join(directory, ".gitignore"), ignore);
  execFileSync("git", ["-C", directory, "add", ...(ignore ? [".gitignore"] : []), "example.js"]);
  execFileSync("git", ["-C", directory, "-c", "user.email=fixture@example.invalid",
    "-c", "user.name=Fixture", "commit", "--quiet", "-m", "reviewed head"]);
  const head = execFileSync("git", ["-C", directory, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  return { directory, head };
}

const repository = {
  id: "R_fixture", nameWithOwner: "fixture/repository",
  host: "github.com", url: "https://github.com/fixture/repository",
};
// The captured head carries its branch name, which only the verification
// profile reads; an ordinary review never asks which branch is checked out.
const snapshotFor = (head, number = 12, ref = "pr-branch") =>
  ({ repository, pull: { number, head: { sha: head, ref } } });

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
  for (const mode of [reviewModes.quick, reviewModes.balanced, reviewModes.full, reviewModes.deep]) {
    for (const condition of ["local-head", "working-tree", "remote-head", "not-a-git-checkout"]) {
      const message = refuseCheckout(condition, "detail", 7, mode);
      assert.match(message, new RegExp(`Failed condition: ${condition}`));
      assert.match(message, new RegExp(`^${mode.label} refused before any reviewer started`));
      assert.match(message, condition === "remote-head"
        ? new RegExp(`rerun /pr-review 7 ${mode.flag}`) : /gh pr checkout 7/);
      assert.match(message, /no local file was touched/);
    }
  }
  // Every non-default mode's gate refuses on exactly the same evidence, each
  // naming its own mode; no mode gets an override or a degraded fallback.
  for (const mode of [reviewModes.balanced, reviewModes.full, reviewModes.deep]) {
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

  // 10. V1a: --verify selects a stricter profile of this same gate. It adds the
  // head-branch and untracked conditions, refuses before any reviewer starts,
  // and changes nothing about an ordinary review of the same checkout.
  const verified = repositoryFixture();
  const target = snapshotFor(verified.head);
  const passed = await assertReviewableCheckout(target,
    { cwd: verified.directory, gh: fakeGh(verified.head), verify: true });
  assert.deepEqual(passed,
    { root: verified.directory, head: verified.head, untracked: [], branch: "pr-branch" });
  console.log(`PASS a clean checkout on the head branch passes the verification preflight at ${passed.branch}`);

  // A detached HEAD at the reviewed commit is the case an ordinary review has
  // always accepted, because the revision is right. Safeguards would run here,
  // so verification refuses it and says which branch it wanted.
  execFileSync("git", ["-C", verified.directory, "checkout", "--quiet", "--detach", "HEAD"]);
  const detachedState = state(verified.directory);
  await assert.rejects(
    assertReviewableCheckout(target,
      { cwd: verified.directory, gh: fakeGh(verified.head), verify: true, mode: reviewModes.balanced }),
    (error) => {
      assert.match(error.message, /Failed condition: head-branch/);
      assert.match(error.message, /detached HEAD/);
      assert.match(error.message, /pr-branch/);
      assert.match(error.message, /gh pr checkout 12/);
      assert.match(error.message, /rerun \/pr-review 12 --balanced --verify/);
      return true;
    });
  assert.equal(state(verified.directory), detachedState, "The gate must never switch branches");
  const detachedOrdinary = await assertReviewableCheckout(target,
    { cwd: verified.directory, gh: fakeGh(verified.head) });
  assert.deepEqual(detachedOrdinary, { root: verified.directory, head: verified.head, untracked: [] });
  console.log("PASS a detached HEAD refuses verification and still passes an ordinary review");

  // A local branch of another name at the reviewed commit is refused too: the
  // scope requires the PR's head branch, and the message names both.
  execFileSync("git", ["-C", verified.directory, "checkout", "--quiet", "-b", "local-work"]);
  await assert.rejects(
    assertReviewableCheckout(target, { cwd: verified.directory, gh: fakeGh(verified.head), verify: true }),
    (error) => {
      assert.match(error.message, /Failed condition: head-branch/);
      assert.match(error.message, /current branch is local-work/);
      assert.match(error.message, /head branch is pr-branch/);
      return true;
    });
  execFileSync("git", ["-C", verified.directory, "checkout", "--quiet", "pr-branch"]);
  console.log("PASS a differently named branch at the reviewed commit refuses verification");

  // The branch probe answers exactly one question, so only its own answer may be
  // read as one. `git symbolic-ref --quiet` exits 1 with no output when HEAD is
  // not a symbolic ref; a cancellation and an operational failure are different
  // facts, and reporting either as a detached HEAD would be a false diagnosis.
  const branchProbeRejects = (failure) => async (args, cwd, gitOptions) =>
    (args[0] === "symbolic-ref" ? Promise.reject(failure) : runGit(args, cwd, gitOptions));
  const cancellation = Object.assign(new Error("The operation was aborted"),
    { name: "AbortError", code: "ABORT_ERR" });
  const cancelling = new AbortController();
  const cancellingGit = async (args, cwd, gitOptions) => {
    if (args[0] !== "symbolic-ref") return runGit(args, cwd, gitOptions);
    // Cancelling aborts the signal and rejects the call that was in flight.
    cancelling.abort(cancellation);
    throw cancellation;
  };
  await assert.rejects(
    assertReviewableCheckout(target, {
      cwd: verified.directory, gh: fakeGh(verified.head), verify: true,
      git: cancellingGit, signal: cancelling.signal,
    }),
    (error) => {
      assert.equal(error, cancellation, "A cancelled branch probe propagates rather than becoming a refusal");
      return true;
    });
  const brokenGit = Object.assign(new Error("fatal: not a git repository"), { code: 128 });
  await assert.rejects(
    assertReviewableCheckout(target, {
      cwd: verified.directory, gh: fakeGh(verified.head), verify: true, git: branchProbeRejects(brokenGit),
    }),
    (error) => {
      assert.match(error.message, /Failed condition: head-branch/);
      assert.match(error.message, /not a git repository/,
        "An operational failure is reported as itself, not as a detached HEAD");
      assert.doesNotMatch(error.message, /detached HEAD/);
      return true;
    });
  // Exit status 1 is the detached answer itself, and still refuses as one.
  const notSymbolic = Object.assign(new Error("Command failed: git symbolic-ref"), { code: 1 });
  await assert.rejects(
    assertReviewableCheckout(target, {
      cwd: verified.directory, gh: fakeGh(verified.head), verify: true, git: branchProbeRejects(notSymbolic),
    }),
    (error) => {
      assert.match(error.message, /Failed condition: head-branch/);
      assert.match(error.message, /detached HEAD/);
      return true;
    });
  console.log("PASS only the branch probe's own exit status 1 is read as a detached HEAD");

  // Untracked files warn for an ordinary review and refuse verification: a
  // safeguard's own artifacts could not be told apart from them afterwards.
  writeFileSync(join(verified.directory, "scratch.txt"), "local scratch\n");
  const untrackedState = state(verified.directory);
  await assert.rejects(
    assertReviewableCheckout(target, { cwd: verified.directory, gh: fakeGh(verified.head), verify: true }),
    (error) => {
      assert.match(error.message, /Failed condition: untracked/);
      assert.match(error.message, /scratch\.txt/);
      assert.match(error.message, /remove or ignore/);
      assert.doesNotMatch(error.message, /git clean|stash/,
        "A refusal never offers to clean the checkout for the user");
      return true;
    });
  assert.equal(state(verified.directory), untrackedState, "The gate must never remove an untracked file");
  const stillWarned = await assertReviewableCheckout(target,
    { cwd: verified.directory, gh: fakeGh(verified.head) });
  assert.deepEqual(stillWarned.untracked, ["scratch.txt"]);
  rmSync(join(verified.directory, "scratch.txt"));
  console.log("PASS untracked files refuse verification while an ordinary review still only warns");

  // Ignored paths are not untracked files, so an ordinary working checkout with
  // dependencies or build output installed still passes the preflight.
  const ignored = repositoryFixture({ ignore: "artifacts/\n" });
  mkdirSync(join(ignored.directory, "artifacts"));
  writeFileSync(join(ignored.directory, "artifacts", "report.xml"), "<testsuite/>\n");
  const withIgnored = await assertReviewableCheckout(snapshotFor(ignored.head),
    { cwd: ignored.directory, gh: fakeGh(ignored.head), verify: true });
  assert.deepEqual(withIgnored.untracked, []);
  console.log("PASS ignored paths are not untracked files and do not refuse verification");

  // A modified tracked file is still the stronger refusal: verification adds
  // conditions to the gate, it never reorders or replaces the existing ones.
  writeFileSync(join(ignored.directory, "example.js"), "export const value = 4;\n");
  writeFileSync(join(ignored.directory, "extra.txt"), "untracked as well\n");
  await assert.rejects(
    assertReviewableCheckout(snapshotFor(ignored.head),
      { cwd: ignored.directory, gh: fakeGh(ignored.head), verify: true }),
    /Failed condition: working-tree/);
  console.log("PASS a modified tracked file outranks the untracked refusal under verification");

  // 11. Both new refusals name the verification-enabled invocation, so a run
  // refused by the stricter profile can never be mistaken for an ordinary one.
  for (const mode of [reviewModes.quick, reviewModes.balanced, reviewModes.full, reviewModes.deep]) {
    for (const condition of ["head-branch", "untracked"]) {
      const message = refuseCheckout(condition, "detail", 7, mode, { verify: true });
      assert.match(message, new RegExp(`^${mode.label} with --verify refused before any reviewer started`));
      assert.match(message, new RegExp(`Failed condition: ${condition}`));
      assert.match(message, new RegExp(`rerun /pr-review 7 ${mode.flag} --verify`));
      assert.match(message, condition === "untracked" ? /remove or ignore/ : /gh pr checkout 7/);
      assert.match(message, /no local file was touched/);
    }
    // An existing condition reached by a verification run says so too, and still
    // offers exactly the fix it always offered.
    const dirtyVerify = refuseCheckout("working-tree", "detail", 7, mode, { verify: true });
    assert.match(dirtyVerify, new RegExp(`^${mode.label} with --verify refused`));
    assert.match(dirtyVerify, /gh pr checkout 7/);
    assert.match(dirtyVerify, new RegExp(`rerun /pr-review 7 ${mode.flag} --verify`));
  }
  console.log("PASS a verification refusal names the flag that caused it and the fix it never applies");

  // The notice is what the flag says about itself before a run starts, so it
  // must state V1c's boundary exactly: an approval is asked for and recorded,
  // and nothing is executed on the strength of it.
  assert.match(verificationNotice, /--verify/);
  assert.match(verificationNotice, /head branch/);
  assert.match(verificationNotice, /untracked/);
  assert.match(verificationNotice, /approv/i);
  assert.match(verificationNotice, /nothing is executed|no command is executed|nothing runs/i);
  assert.match(verificationNotice, /ordinary review/);
  // No exclusion rule exists yet, so the notice must not imply the offered list
  // was filtered or judged by anything.
  assert.match(verificationNotice, /unfiltered|not .*judged/i);
  console.log("PASS the verification notice states that an approval is recorded and nothing is executed");
} finally {
  for (const directory of temporary) rmSync(directory, { recursive: true, force: true });
}
