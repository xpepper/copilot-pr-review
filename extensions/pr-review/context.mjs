import { createHash } from "node:crypto";

const blobPattern = /^[0-9a-f]{40}$/;
const abbreviatedBlob = /^[0-9a-f]{4,40}$/;
const escapes = { n: 10, t: 9, r: 13, b: 8, f: 12, v: 11, a: 7, '"': 34, "\\": 92 };

// Git quotes unusual paths in diff headers; decode them instead of guessing bytes.
function decodeDiffPath(raw) {
  if (!raw.startsWith('"')) return raw;
  if (!raw.endsWith('"') || raw.length < 2) throw new Error("Malformed quoted path in the PR diff.");
  const body = raw.slice(1, -1);
  const bytes = [];
  let index = 0;
  while (index < body.length) {
    const escape = body.indexOf("\\", index);
    const literal = escape < 0 ? body.slice(index) : body.slice(index, escape);
    if (literal) bytes.push(...Buffer.from(literal, "utf8"));
    if (escape < 0) break;
    const octal = body.slice(escape + 1, escape + 4);
    if (/^[0-7]{3}$/.test(octal)) {
      bytes.push(Number.parseInt(octal, 8));
      index = escape + 4;
      continue;
    }
    const simple = escapes[body[escape + 1]];
    if (simple === undefined) throw new Error("Unsupported escape in a PR diff path.");
    bytes.push(simple);
    index = escape + 2;
  }
  return Buffer.from(bytes).toString("utf8");
}

function sidePath(raw, prefix) {
  const value = decodeDiffPath(raw);
  if (value === "/dev/null") return null;
  if (!value.startsWith(prefix)) throw new Error(`Unsupported PR diff path header: ${raw}`);
  return value.slice(prefix.length);
}

// Binary and mode-only sections carry no ---/+++ headers and need no source fetch.
function headerPaths(rest) {
  const separator = " b/";
  for (let index = rest.indexOf(separator); index >= 0; index = rest.indexOf(separator, index + 1)) {
    if (rest.slice(0, 2) === "a/" && rest.slice(2, index) === rest.slice(index + separator.length)) {
      const path = decodeDiffPath(rest.slice(index + separator.length));
      return { oldPath: path, newPath: path };
    }
  }
  return { oldPath: null, newPath: null };
}

export function parseDiffFiles(diff) {
  const files = [];
  let file;
  let hunk;
  let oldRemaining = 0;
  let newRemaining = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      file = {
        ...headerPaths(line.slice("diff --git ".length)),
        status: "modified", binary: false, oldBlob: null, newBlob: null, hunks: [],
      };
      files.push(file);
      hunk = undefined;
      continue;
    }
    if (!file || line === "\\ No newline at end of file") continue;
    if (hunk && (oldRemaining > 0 || newRemaining > 0)) {
      if (line.startsWith("+")) { hunk.newText.push(line.slice(1)); newRemaining--; }
      else if (line.startsWith("-")) { hunk.oldText.push(line.slice(1)); oldRemaining--; }
      else if (line.startsWith(" ")) {
        hunk.oldText.push(line.slice(1));
        hunk.newText.push(line.slice(1));
        oldRemaining--;
        newRemaining--;
      } else throw new Error("Unexpected line inside a PR diff hunk.");
      continue;
    }
    const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (header) {
      hunk = {
        oldStart: Number(header[1]), oldLines: Number(header[2] ?? 1),
        newStart: Number(header[3]), newLines: Number(header[4] ?? 1),
        oldText: [], newText: [],
      };
      oldRemaining = hunk.oldLines;
      newRemaining = hunk.newLines;
      file.hunks.push(hunk);
      continue;
    }
    if (line.startsWith("--- ")) file.oldPath = sidePath(line.slice(4), "a/");
    else if (line.startsWith("+++ ")) file.newPath = sidePath(line.slice(4), "b/");
    else if (line.startsWith("new file mode ")) file.status = "added";
    else if (line.startsWith("deleted file mode ")) file.status = "deleted";
    else if (line.startsWith("rename from ")) file.status = "renamed";
    else if (line.startsWith("Binary files ") || line.startsWith("GIT binary patch")) file.binary = true;
    else if (line.startsWith("index ")) {
      const blobs = /^index ([0-9a-f]+)\.\.([0-9a-f]+)/.exec(line);
      if (blobs) {
        file.oldBlob = /^0+$/.test(blobs[1]) ? null : blobs[1];
        file.newBlob = /^0+$/.test(blobs[2]) ? null : blobs[2];
      }
    }
  }
  return files;
}

// Fetch the head side of surviving files, and the base side wherever the diff removed code.
export function requiredSources(file) {
  if (!file.hunks.length) return [];
  const needs = [];
  if (file.newPath !== null) needs.push({ side: "head", path: file.newPath, blob: file.newBlob });
  if (file.oldPath !== null && (file.status === "deleted" || file.hunks.some((hunk) => hunk.oldText.length))) {
    needs.push({ side: "base", path: file.oldPath, blob: file.oldBlob });
  }
  return needs;
}

export function contextWindows(hunks, side, lineCount, radius) {
  const merged = [];
  const ranges = hunks
    .map((hunk) => {
      const start = side === "head" ? hunk.newStart : hunk.oldStart;
      const length = side === "head" ? hunk.newLines : hunk.oldLines;
      return {
        start: Math.max(1, start - radius),
        end: Math.min(lineCount, Math.max(1, start) + Math.max(1, length) - 1 + radius),
      };
    })
    .filter((range) => range.end >= range.start)
    .sort((left, right) => left.start - right.start);
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end + 1) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

function splitLines(text) {
  const lines = text.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function gitBlobSha(bytes) {
  return createHash("sha1")
    .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]))
    .digest("hex");
}

const encodePath = (path) => path.split("/").map(encodeURIComponent).join("/");

export async function fetchSource({ repository, ref, path, blob }, { gh, cwd } = {}) {
  if (typeof gh !== "function") throw new Error("Context assembly requires an explicit gh runner.");
  if (!blobPattern.test(ref)) throw new Error("Context requires a full captured revision SHA.");
  const where = `${repository.nameWithOwner}@${ref}:${path}`;
  const raw = JSON.parse(await gh([
    "api", "--hostname", repository.host, "--method", "GET",
    `repos/${repository.nameWithOwner}/contents/${encodePath(path)}?ref=${ref}`,
    "-H", "Accept: application/vnd.github+json",
  ], cwd));
  if (raw?.type !== "file" || raw.path !== path) {
    throw new Error(`Context path is not a file at the captured revision (${where}).`);
  }
  if (raw.encoding !== "base64" || typeof raw.content !== "string") {
    throw new Error(`Context is unavailable in verifiable form (${where}, encoding ${raw.encoding}).`);
  }
  const bytes = Buffer.from(raw.content, "base64");
  if (!Number.isSafeInteger(raw.size) || raw.size !== bytes.length) {
    throw new Error(`Context size does not match the delivered bytes (${where}).`);
  }
  const blobSha = gitBlobSha(bytes);
  if (!blobPattern.test(raw.sha) || raw.sha !== blobSha) {
    throw new Error(`Context blob identity mismatch (${where}).`);
  }
  if (blob !== null && blob !== undefined) {
    if (!abbreviatedBlob.test(blob)) throw new Error(`Unreadable diff blob identity (${where}).`);
    if (!blobSha.startsWith(blob)) {
      throw new Error(`Context blob ${blobSha} is not the blob recorded in the captured diff (${where}).`);
    }
  }
  const text = bytes.toString("utf8");
  if (text.includes("\0") || !Buffer.from(text, "utf8").equals(bytes)) {
    throw new Error(`Context is not reviewable UTF-8 text (${where}).`);
  }
  return {
    repository: repository.nameWithOwner, host: repository.host, ref, path, blobSha,
    bytes: bytes.length, lines: splitLines(text),
  };
}

// The fetched revision must literally contain the captured diff's lines.
function verifyAgainstDiff(file, side, source) {
  for (const hunk of file.hunks) {
    const expected = side === "head" ? hunk.newText : hunk.oldText;
    const start = side === "head" ? hunk.newStart : hunk.oldStart;
    if (!expected.length) continue;
    const actual = source.lines.slice(start - 1, start - 1 + expected.length);
    if (actual.length !== expected.length || actual.some((line, index) => line !== expected[index])) {
      throw new Error(
        `Context at ${source.repository}@${source.ref}:${source.path} line ${start} ` +
        "does not match the captured diff; no local or alternative revision is substituted.",
      );
    }
  }
}

export function formatContext(context) {
  const blocks = [];
  for (const file of context.files) {
    for (const source of file.sources) {
      for (const window of source.windows) {
        blocks.push([
          `--- context ${source.repository} ${source.side} ${source.ref}`,
          `--- path ${source.path} blob ${source.blobSha} lines ${window.start}-${window.end}`,
          // Numbering every line keeps PR-controlled text from imitating a provenance header.
          ...source.lines.slice(window.start - 1, window.end)
            .map((line, index) => `${window.start + index}| ${line}`),
        ].join("\n"));
      }
    }
  }
  return blocks.length ? `${blocks.join("\n\n")}\n` : "";
}

export async function assembleContext(snapshot, { gh, cwd, radius = 40 } = {}) {
  if (typeof gh !== "function") throw new Error("Context assembly requires an explicit gh runner.");
  const { repository, pull, diff } = snapshot;
  const parsed = parseDiffFiles(diff);
  if (parsed.length !== pull.changedFiles) {
    throw new Error("Diff sections do not match the captured changed file count.");
  }
  const files = [];
  for (const file of parsed) {
    const entry = { path: file.newPath ?? file.oldPath, status: file.status, sources: [] };
    if (!file.hunks.length) {
      entry.reason = file.binary ? "binary change; no textual context" : "no textual hunks";
      files.push(entry);
      continue;
    }
    for (const need of requiredSources(file)) {
      const ref = need.side === "head" ? pull.head.sha : pull.base.sha;
      const source = await fetchSource({ repository, ref, path: need.path, blob: need.blob }, { gh, cwd });
      verifyAgainstDiff(file, need.side, source);
      entry.sources.push({
        ...source, side: need.side,
        windows: contextWindows(file.hunks, need.side, source.lines.length, radius),
      });
    }
    files.push(entry);
  }
  const context = { repository, head: pull.head.sha, base: pull.base.sha, radius, files };
  context.text = formatContext(context);
  context.bytes = Buffer.byteLength(context.text);
  context.sha256 = createHash("sha256").update(context.text).digest("hex");
  return context;
}
