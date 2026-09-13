import { createHash } from "node:crypto";
import { runGit } from "./checkout.mjs";
import { collectInstructionFiles } from "./safeguards.mjs";

// H1: the project's own written rules steer the review. By default the markdown
// files at the checkout root that are the reviewed head's committed text reach
// the one reviewer each mode names as weighing the whole change, and a finding
// that relies on one of those rules must quote it as exact lines of a named file.
//
// The flag turns that off for one run. Like --long-context it is a flag and
// deliberately not a configuration key: nothing saved decides what a reviewer is
// handed, and it grants nothing, opens no gate and selects no mode.
export const noStandardsFlag = "--no-standards";

// Built rather than typed, so no editor can turn an escape into a raw byte.
const nul = String.fromCharCode(0);
const tab = String.fromCharCode(9);

// Git's own object id for a blob holding these bytes, in whichever hash the
// repository uses: forty hex digits for SHA-1 and sixty-four for SHA-256.
const blobId = (bytes, objectId) => createHash(objectId.length === 64 ? "sha256" : "sha1")
  .update(`blob ${bytes.length}${nul}`).update(bytes).digest("hex");

// `git ls-tree -z` prints one record per root entry: mode, type and object id
// separated by spaces, a tab, then the name, with a NUL after each record.
function rootEntries(listing) {
  const entries = new Map();
  for (const record of listing.split(nul)) {
    const at = record.indexOf(tab);
    if (at < 0) continue;
    const [mode, type, object] = record.slice(0, at).split(" ");
    entries.set(record.slice(at + 1), { mode, type, object });
  }
  return entries;
}

// The checkout gate proves HEAD is the reviewed head and no tracked file is
// modified, but it only warns about an untracked one, and the collector reads
// whatever markdown sits at the root. So each file is proven for itself: it is
// handed on only when the reviewed head commits a regular file of that name
// whose blob is exactly the text that was read. One Git call covers the root.
// Anything else is named with its reason and never reaches a reviewer.
export async function collectStandards(root, head, { git = runGit, signal } = {}) {
  const collected = collectInstructionFiles(root);
  if (!collected.files.length) return { files: [], skipped: collected.skipped };
  let entries;
  try {
    entries = rootEntries(await git(["ls-tree", "-z", "--full-tree", head], root, { signal }));
  } catch (error) {
    // A cancellation is the run's, and is never a failed collection.
    if (signal?.aborted) throw error;
    const reason = `could not be matched to the reviewed head (${String(error?.message ?? error)})`;
    return {
      files: [],
      skipped: [...collected.skipped, ...collected.files.map(({ name, bytes }) => ({ name, bytes, reason }))],
    };
  }
  const files = [];
  const skipped = [...collected.skipped];
  for (const { name, bytes, text } of collected.files) {
    const entry = entries.get(name);
    if (!entry) {
      skipped.push({ name, bytes, reason: "is not committed at the reviewed head" });
    } else if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
      // A committed link's blob is its target's name, which a regular file can
      // hold byte for byte, so the mode is what tells them apart.
      skipped.push({ name, bytes, reason: "is not a regular file at the reviewed head" });
    } else if (blobId(Buffer.from(text, "utf8"), entry.object) !== entry.object) {
      skipped.push({ name, bytes, reason: "is not the reviewed head's committed text" });
    } else {
      files.push({ name, bytes, blobSha: entry.object, text });
    }
  }
  return { files, skipped };
}
