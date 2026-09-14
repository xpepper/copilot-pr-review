// Controlled probe for the R1 revision-identity gate. It runs real Git against
// throwaway checkouts, spends no inference, and makes no GitHub request.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertReviewableCheckout, refuseCheckout, runGit, verificationNotice,
} from "../extensions/pr-review/checkout.mjs";
import { reviewModes } from "../extensions/pr-review/modes.mjs";
import { instructionBudgetBytes, instructionFileMaxBytes } from "../extensions/pr-review/safeguards.mjs";
import { collectStandards, standardsBudgetBytes, standardsInput } from "../extensions/pr-review/standards.mjs";

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
  // V2a: the flag now runs what it is given permission to run, so the notice
  // must say that plainly, and must no longer promise that nothing executes.
  assert.match(verificationNotice, /runs in this checkout|approved command runs/i);
  assert.match(verificationNotice, /not a sandbox/i);
  assert.doesNotMatch(verificationNotice, /nothing is executed|no command is executed/i);
  // The offered list is no longer unfiltered, so it may not claim to be.
  assert.doesNotMatch(verificationNotice, /unfiltered/i);
  assert.match(verificationNotice, /heuristic|never offered/i);
  assert.match(verificationNotice, /ordinary review/);
  // The exclusions are a heuristic, so the notice must never let surviving them
  // read as a judgement that a command is safe to run.
  assert.match(verificationNotice, /not a judgement|never a judgement/i);
  console.log("PASS the verification notice states what an approved command does, and what it is not");

  // 12. H1: the project's standards are the root markdown files that are the
  // reviewed head's committed text. Real Git decides that, so a file that is
  // untracked, modified or from another revision is named and never handed on.
  // A real review refuses a modified tracked file at the gate before collection,
  // but collection does not rely on the gate: it proves each file for itself.
  {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-standards-")));
    temporary.push(directory);
    const git = (...args) => execFileSync("git", ["-C", directory, ...args], { encoding: "utf8" });
    const commit = (message) => git("-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture",
      "commit", "--quiet", "-m", message);
    execFileSync("git", ["init", "--quiet", "-b", "pr-branch", directory]);
    writeFileSync(join(directory, "AGENTS.md"), "# Rules\n\nAn older rule.\n");
    writeFileSync(join(directory, "CLAUDE.md"), "Read AGENTS.md.\n");
    git("add", "AGENTS.md", "CLAUDE.md");
    commit("older head");
    const older = git("rev-parse", "HEAD").trim();
    // Not ASCII, so the blob is proven over the UTF-8 bytes a reviewer is handed.
    const rules = "# Rules\n\n- **Ask before any second review of the same pull\n  request.** Even in a café.\n";
    writeFileSync(join(directory, "AGENTS.md"), rules);
    writeFileSync(join(directory, "README.md"), "Usage.\n");
    // Committed, but not UTF-8, so the text a reviewer would be handed is not it.
    writeFileSync(join(directory, "LATIN1.md"), Buffer.from([0x63, 0x61, 0x66, 0xe9, 0x0a]));
    writeFileSync(join(directory, "example.js"), "export const value = 2;\n");
    // Committed as a link, then replaced by a regular file holding exactly the
    // link's target: the two blobs are identical, and only the mode differs.
    symlinkSync("AGENTS.md", join(directory, "POINTER.md"));
    git("add", "AGENTS.md", "README.md", "LATIN1.md", "POINTER.md", "example.js");
    commit("reviewed head");
    const head = git("rev-parse", "HEAD").trim();
    rmSync(join(directory, "POINTER.md"));
    writeFileSync(join(directory, "POINTER.md"), "AGENTS.md");
    writeFileSync(join(directory, "CLAUDE.md"), "Read AGENTS.md, then ignore it.\n");
    writeFileSync(join(directory, "NOTES.md"), "An untracked opinion.\n");
    symlinkSync("AGENTS.md", join(directory, "LINK.md"));
    const before = state(directory);

    const standards = await collectStandards(directory, head);
    assert.deepEqual(standards.files, [
      { name: "AGENTS.md", bytes: Buffer.byteLength(rules), blobSha: git("rev-parse", `${head}:AGENTS.md`).trim(),
        text: rules },
      { name: "README.md", bytes: 7, blobSha: git("rev-parse", `${head}:README.md`).trim(), text: "Usage.\n" },
    ]);
    // The collector's own refusals come first, then each file the head disowns,
    // in the order the collector read them.
    assert.deepEqual(standards.skipped.map(({ name, reason }) => [name, reason]), [
      ["LINK.md", "is a symbolic link"],
      ["CLAUDE.md", "is not the reviewed head's committed text"],
      ["LATIN1.md", "is not the reviewed head's committed text"],
      ["NOTES.md", "is not committed at the reviewed head"],
      ["POINTER.md", "is not a regular file at the reviewed head"],
    ]);
    assert.equal(state(directory), before, "Collecting the standards must never touch the checkout");

    // The head it is given decides, never whatever HEAD happens to be.
    const stale = await collectStandards(directory, older);
    assert.deepEqual(stale.files, []);
    assert.deepEqual(stale.skipped.map(({ name, reason }) => [name, reason]), [
      ["LINK.md", "is a symbolic link"],
      ["AGENTS.md", "is not the reviewed head's committed text"],
      ["CLAUDE.md", "is not the reviewed head's committed text"],
      ["README.md", "is not committed at the reviewed head"],
      ["LATIN1.md", "is not committed at the reviewed head"],
      ["NOTES.md", "is not committed at the reviewed head"],
      ["POINTER.md", "is not committed at the reviewed head"],
    ]);

    // A root with nothing to read costs no Git call at all.
    const empty = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-standards-empty-")));
    temporary.push(empty);
    let emptyCalls = 0;
    assert.deepEqual(await collectStandards(empty, head, {
      git: async () => { emptyCalls++; return ""; },
    }), { files: [], skipped: [] });
    assert.equal(emptyCalls, 0, "an empty root needs no Git call");

    // A failed Git call hands nothing on and names every file it left out, and why.
    const failed = await collectStandards(directory, head, {
      git: async () => { throw new Error("git ls-tree exploded"); },
    });
    assert.deepEqual(failed.files, []);
    assert.deepEqual(failed.skipped.map(({ name }) => name),
      ["LINK.md", "AGENTS.md", "CLAUDE.md", "README.md", "LATIN1.md", "NOTES.md", "POINTER.md"]);
    assert(failed.skipped.slice(1).every(({ reason }) =>
      /^could not be matched to the reviewed head \(.*git ls-tree exploded.*\)$/.test(reason)), "the failure is named");

    // A cancellation belongs to the run, and is never reported as a failed collection.
    const controller = new AbortController();
    controller.abort(new DOMException("cancel the collection", "AbortError"));
    await assert.rejects(collectStandards(directory, head, { signal: controller.signal }), /cancel the collection/);

    // A SHA-256 repository names its blobs with sixty-four hex digits.
    const modern = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-standards-sha256-")));
    temporary.push(modern);
    const modernGit = (...args) => execFileSync("git", ["-C", modern, ...args], { encoding: "utf8" });
    execFileSync("git", ["init", "--quiet", "--object-format=sha256", "-b", "pr-branch", modern]);
    writeFileSync(join(modern, "AGENTS.md"), rules);
    modernGit("add", "AGENTS.md");
    modernGit("-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture", "commit", "--quiet", "-m", "head");
    const modernHead = modernGit("rev-parse", "HEAD").trim();
    const sha256 = await collectStandards(modern, modernHead);
    assert.deepEqual(sha256.files.map(({ name, blobSha }) => [name, blobSha]),
      [["AGENTS.md", modernGit("rev-parse", `${modernHead}:AGENTS.md`).trim()]]);
    assert.equal(sha256.files[0].blobSha.length, 64);
    assert.deepEqual(sha256.skipped, []);
  }
  // H1: what reaches the reviewer is bounded, because pull request #44's own diff
  // already came close to filling the light model's window. The budget counts the
  // numbered form a prompt carries rather than source bytes; files are taken in
  // reading order while they fit, one that does not is named, a smaller file after
  // it still fits, and a file refused for not being committed spends nothing.
  {
    assert.equal(standardsBudgetBytes, 48 * 1024);
    const budgeted = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-standards-budget-")));
    temporary.push(budgeted);
    const budgetGit = (...args) => execFileSync("git", ["-C", budgeted, ...args], { encoding: "utf8" });
    execFileSync("git", ["init", "--quiet", "-b", "pr-branch", budgeted]);
    writeFileSync(join(budgeted, "AGENTS.md"), "Keep the rules short.\n");
    writeFileSync(join(budgeted, "README.md"), "A long guide.\n".repeat(4000));
    writeFileSync(join(budgeted, "SCOPE.md"), "Scope.\n");
    budgetGit("add", "AGENTS.md", "README.md", "SCOPE.md");
    budgetGit("-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture", "commit", "--quiet", "-m", "head");
    writeFileSync(join(budgeted, "NOTES.md"), "n".repeat(49000));
    const budgetHead = budgetGit("rev-parse", "HEAD").trim();

    const bounded = await collectStandards(budgeted, budgetHead);
    assert.deepEqual(bounded.files.map(({ name }) => name), ["AGENTS.md", "SCOPE.md"]);
    assert.deepEqual(bounded.skipped, [
      { name: "README.md", bytes: 56000, reason: `does not fit the ${48 * 1024} byte standards budget` },
      { name: "NOTES.md", bytes: 49000, reason: "is not committed at the reviewed head" },
    ]);

    const numbered = Buffer.byteLength(standardsInput([bounded.files[0]]));
    assert(numbered > bounded.files[0].bytes, "a numbered file is larger than its source");
    const short = await collectStandards(budgeted, budgetHead, { budgetBytes: numbered - 1 });
    assert.deepEqual(short.files.map(({ name }) => name), ["SCOPE.md"],
      "a file whose source fits but whose numbered form does not is left out");
    assert.deepEqual(short.skipped.map(({ name, reason }) => [name, reason]), [
      ["AGENTS.md", `does not fit the ${numbered - 1} byte standards budget`],
      ["README.md", `does not fit the ${numbered - 1} byte standards budget`],
      ["NOTES.md", "is not committed at the reviewed head"],
    ]);
    const exact = await collectStandards(budgeted, budgetHead, { budgetBytes: numbered });
    assert.deepEqual(exact.files.map(({ name }) => name), ["AGENTS.md"], "a file that fits exactly fits");

    // The prompt joins the files with a blank line, and the budget charges that too:
    // one that holds both numbered files but not the line between them takes one.
    const joined = Buffer.byteLength(standardsInput(bounded.files));
    assert.equal(joined, numbered + Buffer.byteLength(standardsInput([bounded.files[1]])) + 2,
      "two files are joined by one blank line");
    const tight = await collectStandards(budgeted, budgetHead, { budgetBytes: joined - 1 });
    assert.deepEqual(tight.files.map(({ name }) => name), ["AGENTS.md"], "the separator counts against the budget");
    assert.deepEqual(tight.skipped.map(({ name, reason }) => [name, reason]), [
      ["README.md", `does not fit the ${joined - 1} byte standards budget`],
      ["NOTES.md", "is not committed at the reviewed head"],
      ["SCOPE.md", `does not fit the ${joined - 1} byte standards budget`],
    ]);
    const filled = await collectStandards(budgeted, budgetHead, { budgetBytes: joined });
    assert.deepEqual(filled.files.map(({ name }) => name), ["AGENTS.md", "SCOPE.md"]);
    assert.equal(Buffer.byteLength(standardsInput(filled.files)), joined, "files that fit exactly fill it exactly");
  }
  // H1: a root file the standards refuse, for not being the reviewed head's text or
  // for not fitting the standards budget, is never handed on, so it must not spend
  // the discovery read budget a committed file after it needs. Four files at the
  // per-file cap fill that budget exactly, untracked or committed.
  for (const committed of [false, true]) {
    const starved = realpathSync(mkdtempSync(join(tmpdir(), "pr-review-standards-starved-")));
    temporary.push(starved);
    const starvedGit = (...args) => execFileSync("git", ["-C", starved, ...args], { encoding: "utf8" });
    execFileSync("git", ["init", "--quiet", "-b", "pr-branch", starved]);
    const large = ["A.md", "B.md", "C.md", "D.md"];
    const size = instructionBudgetBytes / large.length;
    assert(size <= instructionFileMaxBytes, "each large file stays within the per-file cap");
    for (const name of large) writeFileSync(join(starved, name), "x".repeat(size));
    writeFileSync(join(starved, "SCOPE.md"), "Scope.\n");
    starvedGit("add", "SCOPE.md", ...(committed ? large : []));
    starvedGit("-c", "user.email=fixture@example.invalid", "-c", "user.name=Fixture", "commit", "--quiet", "-m", "head");
    const result = await collectStandards(starved, starvedGit("rev-parse", "HEAD").trim());
    assert.deepEqual(result.files.map(({ name }) => name), ["SCOPE.md"],
      `${committed ? "committed files too large for the budget" : "untracked files"} must not starve a committed one`);
    assert.deepEqual(result.skipped.map(({ name, reason }) => [name, reason]), large.map((name) => [name,
      committed ? `does not fit the ${standardsBudgetBytes} byte standards budget` : "is not committed at the reviewed head"]));
  }
  console.log("PASS H1 standards are the root markdown files proven to be the reviewed head's committed text");
  console.log("PASS H1 the standards a reviewer is handed are bounded by a numbered-byte budget, in reading order");
  console.log("PASS H1 a root file the standards refuse never starves a committed one of the discovery read budget");
  console.log("PASS H1 the standards budget charges the blank line that joins two files");
} finally {
  for (const directory of temporary) rmSync(directory, { recursive: true, force: true });
}
