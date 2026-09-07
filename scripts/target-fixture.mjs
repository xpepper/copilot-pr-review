import { createHash } from "node:crypto";

export const repository = {
  id: "R_fixture", nameWithOwner: "fixture/repository", url: "https://github.com/fixture/repository",
};

export function blobSha(text) {
  const bytes = Buffer.from(text, "utf8");
  return createHash("sha1")
    .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]))
    .digest("hex");
}

export const baseSource = [
  "export const value = 1;",
  "export const label = \"fixture\";",
  "export function describe() {",
  "  return `${label}:${value}`;",
  "}",
  "",
].join("\n");
export const headSource = baseSource.replace("value = 1;", "value = 2;");
export const advancedSource = baseSource.replace("value = 1;", "value = 3;");
export const validationBaseSource = [
  "// Total is unit cents multiplied by quantity.",
  "export function total(cents, quantity) {",
  "  return cents * quantity;",
  "}", "",
].join("\n");
export const validationHeadSource = validationBaseSource.replace("cents * quantity", "cents + quantity");
export const validationDiff = [
  "diff --git a/total.js b/total.js",
  `index ${blobSha(validationBaseSource)}..${blobSha(validationHeadSource)} 100644`,
  "--- a/total.js", "+++ b/total.js", "@@ -1,4 +1,4 @@",
  " // Total is unit cents multiplied by quantity.",
  " export function total(cents, quantity) {",
  "-  return cents * quantity;", "+  return cents + quantity;", " }", "",
].join("\n");

const sources = new Map([
  ["a".repeat(40), baseSource],
  ["b".repeat(40), headSource],
  ["c".repeat(40), advancedSource],
]);

export const diff = [
  "diff --git a/example.js b/example.js",
  `index ${blobSha(baseSource).slice(0, 7)}..${blobSha(headSource).slice(0, 7)} 100644`,
  "--- a/example.js",
  "+++ b/example.js",
  "@@ -1 +1 @@",
  "-export const value = 1;",
  "+export const value = 2;",
  "",
].join("\n");

export function pull(number = 1) {
  return {
    number, node_id: `PR_${number}`, html_url: `${repository.url}/pull/${number}`,
    state: number === 5 || number === 6 ? "closed" : "open", merged: number === 6,
    draft: number === 2, title: "Small change", body: null,
    updated_at: "2026-09-06T20:00:00Z",
    user: { login: number === 3 ? "automation" : "human", type: number === 3 ? "Bot" : "User" },
    base: { repo: { node_id: repository.id, full_name: repository.nameWithOwner }, sha: "a".repeat(40), ref: "main" },
    head: { sha: "b".repeat(40), ref: "feature" },
    changed_files: number === 4 ? 0 : 1,
    additions: number === 4 ? 0 : 1,
    deletions: number === 4 ? 0 : 1,
  };
}

export function contentsResponse(path, ref) {
  const text = path === "total.js"
    ? ref === "a".repeat(40) ? validationBaseSource : ref === "b".repeat(40) ? validationHeadSource : undefined
    : path === "example.js" ? sources.get(ref) : undefined;
  if (!text) {
    throw new Error(`fixture: HTTP 404 no content for ${path} at ${ref}`);
  }
  const bytes = Buffer.from(text, "utf8");
  return JSON.stringify({
    name: path, path, sha: blobSha(text), size: bytes.length,
    type: "file", encoding: "base64", content: bytes.toString("base64"),
  });
}

export function respond(args, cwd, history) {
  if (JSON.stringify(args) === JSON.stringify(["repo", "view", "--json", "id,nameWithOwner,url"])) {
    return JSON.stringify(repository);
  }
  if (args.length !== 8 || args[6] !== "-H" ||
      JSON.stringify(args.slice(0, 5)) !== JSON.stringify(["api", "--hostname", "github.com", "--method", "GET"])) {
    throw new Error(`Unexpected gh command: ${JSON.stringify(args)} in ${cwd}`);
  }
  const number = Number(/^repos\/fixture\/repository\/pulls\/(\d+)$/.exec(args[5])?.[1]);
  if (number) return apiResponse(number, args[7], history);
  const contents = /^repos\/fixture\/repository\/contents\/([^?]+)\?ref=([0-9a-f]{40})$/.exec(args[5]);
  if (!contents) throw new Error(`Unexpected gh command: ${JSON.stringify(args)} in ${cwd}`);
  if (args[7] !== "Accept: application/vnd.github+json") throw new Error("Unexpected media type");
  return contentsResponse(decodeURIComponent(contents[1]), contents[2]);
}

function apiResponse(number, accept, history) {
  if (number === 8) throw new Error("fixture: HTTP 404 unavailable PR");
  if (accept === "Accept: application/vnd.github.diff") {
    return number === 12 ? validationDiff : number === 10 ? diff.slice(0, -2) : diff;
  }
  if (accept !== "Accept: application/vnd.github+json") throw new Error("Unexpected media type");
  const result = pull(number);
  const reads = history.filter((call) =>
    call.args.includes(`repos/fixture/repository/pulls/${number}`)).length;
  if (number === 9 && history.some((call) =>
    call.args.includes("repos/fixture/repository/pulls/9") &&
    call.args.includes("Accept: application/vnd.github.diff"))) {
    result.head.sha = "c".repeat(40);
  }
  // PR 11 advances only after a complete capture, never mid-capture.
  if (number === 11 && reads >= 3) result.head.sha = "c".repeat(40);
  return JSON.stringify(result);
}
