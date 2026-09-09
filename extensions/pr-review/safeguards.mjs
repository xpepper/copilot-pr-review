import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// V1b: safeguard discovery and presentation. A verification-enabled run finds
// the commands this project already declares in its own instructions, shows
// them, and stops there. Nothing in this module approves a command, decides
// whether one may run, or runs one. Execution is a later increment with its own
// discussion, and the approval step between them is another.
//
// Discovery reads the checkout rather than refetching the captured revision,
// which is sound only because a verification run has already passed the
// preflight in `checkout.mjs`: local HEAD equals the captured head, no tracked
// file is modified, and no path is untracked. Outside that gate the files on
// disk would not be provably the reviewed revision, so nothing here may be
// reused by an ordinary review.

// One file's cap. A document larger than this is skipped by name rather than
// truncated, because half an instruction file is a worse source than none.
export const instructionFileMaxBytes = 64 * 1024;
// What one run may spend on discovery in total, however many files a root holds.
export const instructionBudgetBytes = 256 * 1024;

// Read first, in this order. These are the files a project writes for an agent,
// so they carry its declared commands more often than the rest of the root
// does. Every other root markdown file is still read, just after these.
export const conventionalInstructionFiles = ["AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md", "README.md"];

const markdown = (name) => name.toLowerCase().endsWith(".md");

function readingOrder(names) {
  const rank = (name) => {
    const index = conventionalInstructionFiles.indexOf(name);
    return index < 0 ? conventionalInstructionFiles.length : index;
  };
  return names.sort((left, right) =>
    rank(left) - rank(right) || left.localeCompare(right, "en", { sensitivity: "base" }));
}

// The checkout root's own markdown, and nothing else: no recursion into
// subdirectories, no file outside the root, and no link followed out of it. A
// skipped candidate is always named with its reason, because a source dropped
// in silence is indistinguishable from a project that documented nothing.
export function collectInstructionFiles(root,
  { maxBytes = instructionFileMaxBytes, budgetBytes = instructionBudgetBytes } = {}) {
  const files = [];
  const skipped = [];
  let spent = 0;
  for (const name of readingOrder(readdirSync(root).filter(markdown))) {
    const path = join(root, name);
    let stat;
    try {
      // `lstat` rather than `stat`: a link is refused for the reason project
      // configuration already refuses one, that what it points at is not this
      // file, and the refusal must not report where it pointed.
      stat = lstatSync(path, { throwIfNoEntry: false });
    } catch (error) {
      skipped.push({ name, bytes: null, reason: `cannot be inspected (${error.code ?? error.message})` });
      continue;
    }
    // Gone between the listing and the read: not a candidate at all.
    if (!stat) continue;
    if (stat.isSymbolicLink()) {
      skipped.push({ name, bytes: null, reason: "is a symbolic link" });
      continue;
    }
    if (!stat.isFile()) {
      skipped.push({ name, bytes: null, reason: "is not a regular file" });
      continue;
    }
    if (stat.size > maxBytes) {
      skipped.push({ name, bytes: stat.size, reason: `exceeds ${maxBytes} bytes` });
      continue;
    }
    if (spent + stat.size > budgetBytes) {
      skipped.push({ name, bytes: stat.size, reason: `the ${budgetBytes} byte discovery budget is already spent` });
      continue;
    }
    files.push({ name, bytes: stat.size, text: readFileSync(path, "utf8") });
    spent += stat.size;
  }
  return { files, skipped };
}
