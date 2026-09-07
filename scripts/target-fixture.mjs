import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

// These targets share the source fixture, not guaranteed model output.
export const publicationNumbers = {
  comment: 50, confirmed: 50, declined: 50, suppressed: 50,
  reject: 51, uncertain: 52, cancel: 53, stale: 54, draft: 55,
};

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
const shippingBaseSource = [
  "// Orders of at least 5000 cents ship free; smaller orders cost 500 cents.",
  "export function shipping(subtotal) {",
  "  return subtotal >= 5000 ? 0 : 500;",
  "}", "",
].join("\n");
const shippingHeadSource = shippingBaseSource.replace("subtotal >= 5000", "subtotal <= 5000");
const shippingDiff = [
  "diff --git a/shipping.js b/shipping.js",
  `index ${blobSha(shippingBaseSource)}..${blobSha(shippingHeadSource)} 100644`,
  "--- a/shipping.js", "+++ b/shipping.js", "@@ -1,4 +1,4 @@",
  " // Orders of at least 5000 cents ship free; smaller orders cost 500 cents.",
  " export function shipping(subtotal) {",
  "-  return subtotal >= 5000 ? 0 : 500;", "+  return subtotal <= 5000 ? 0 : 500;", " }", "",
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
    changed_files: number === 4 ? 0 : number === 13 ? 2 : 1,
    additions: number === 4 ? 0 : number === 13 ? 2 : 1,
    deletions: number === 4 ? 0 : number === 13 ? 2 : 1,
  };
}

export function contentsResponse(path, ref) {
  const text = path === "total.js"
    ? ref === "a".repeat(40) ? validationBaseSource : ref === "b".repeat(40) ? validationHeadSource : undefined
    : path === "shipping.js"
      ? ref === "a".repeat(40) ? shippingBaseSource : ref === "b".repeat(40) ? shippingHeadSource : undefined
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

const publishOptIn = () => process.env.PR_REVIEW_SMOKE_ALLOW_PUBLISH === "1";

function postScenario(number) {
  if (number === publicationNumbers.reject) return "422";
  if (number === publicationNumbers.uncertain) return "lost";
  if (number === publicationNumbers.cancel) return "cancel";
  return "success";
}

function httpResponse(status, statusText, body) {
  return `HTTP/2.0 ${status} ${statusText}\r\nContent-Type: application/json\r\n\r\n${body}`;
}

function postResponse(args, cwd, stdin) {
  if (!publishOptIn()) {
    throw new Error(`Unexpected gh command (native publication opt-in required): ${JSON.stringify(args)} in ${cwd}`);
  }
  const endpoint = /^repos\/fixture\/repository\/pulls\/(\d+)\/reviews$/.exec(args[5]);
  if (JSON.stringify(args.slice(0, 5)) !== JSON.stringify(["api", "--hostname", "github.com", "--method", "POST"]) ||
      args.length !== 13 || args[6] !== "--include" || args[7] !== "--input" || args[8] !== "-" ||
      args[9] !== "-H" || args[10] !== "Accept: application/vnd.github+json" ||
      args[11] !== "-H" || args[12] !== "X-GitHub-Api-Version: 2022-11-28" || !endpoint) {
    throw new Error(`Unexpected publication POST shape: ${JSON.stringify(args)} in ${cwd}`);
  }
  const number = Number(endpoint[1]);
  const payload = JSON.parse(stdin);
  if (payload.event !== "COMMENT" || payload.commit_id !== "b".repeat(40) || !payload.comments?.length) {
    throw new Error("Unexpected publication payload");
  }
  const marker = process.env.PR_REVIEW_SMOKE_POST_MARKER;
  if (marker) {
    writeFileSync(marker, JSON.stringify({ pid: process.pid }));
    // Hold the response until the harness observes the durable journal, or
    // cancellation kills this owned process. This never bounds reviewer work.
    const deadline = Date.now() + 10000;
    while (!existsSync(`${marker}.release`)) {
      if (Date.now() >= deadline) throw new Error("fixture: POST observation was not acknowledged");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
  }
  const scenario = postScenario(number);
  // Match gh's non-zero exit while retaining HTTP headers in stdout.
  if (scenario === "422") {
    process.exitCode = 1;
    return httpResponse(422, "Unprocessable Entity", JSON.stringify({ message: "Validation Failed" }));
  }
  if (scenario === "lost") {
    process.exitCode = 1;
    return httpResponse(503, "Service Unavailable", JSON.stringify({ message: "Service Unavailable" }));
  }
  if (scenario === "cancel") {
    throw new Error("fixture: cancellation case must kill the POST process, not release its response");
  }
  const id = 900000000 + number;
  return httpResponse(200, "OK", JSON.stringify({
    id, state: "COMMENTED", commit_id: payload.commit_id, body: payload.body,
    html_url: `${repository.url}/pull/${number}#pullrequestreview-${id}`,
  }));
}

export function respond(args, cwd, history, stdin) {
  if (JSON.stringify(args) === JSON.stringify(["repo", "view", "--json", "id,nameWithOwner,url"])) {
    return JSON.stringify(repository);
  }
  if (args[0] === "api" && args[3] === "--method" && args[4] === "POST") {
    return postResponse(args, cwd, stdin);
  }
  if (args.length !== 8 || args[6] !== "-H" ||
      JSON.stringify(args.slice(0, 5)) !== JSON.stringify(["api", "--hostname", "github.com", "--method", "GET"])) {
    throw new Error(`Unexpected gh command: ${JSON.stringify(args)} in ${cwd}`);
  }
  if (args[5] === "repos/fixture/repository") {
    if (args[7] !== "Accept: application/vnd.github+json") throw new Error("Unexpected media type");
    return JSON.stringify({ node_id: repository.id, full_name: repository.nameWithOwner, html_url: repository.url });
  }
  const number = Number(/^repos\/fixture\/repository\/pulls\/(\d+)$/.exec(args[5])?.[1]);
  if (number) return apiResponse(number, args[7], history);
  const contents = /^repos\/fixture\/repository\/contents\/([^?]+)\?ref=([0-9a-f]{40})$/.exec(args[5]);
  if (!contents) throw new Error(`Unexpected gh command: ${JSON.stringify(args)} in ${cwd}`);
  if (args[7] !== "Accept: application/vnd.github+json") throw new Error("Unexpected media type");
  return contentsResponse(decodeURIComponent(contents[1]), contents[2]);
}

const publicationDiffNumbers = new Set(Object.values(publicationNumbers));

function apiResponse(number, accept, history) {
  if (number === 8) throw new Error("fixture: HTTP 404 unavailable PR");
  if (accept === "Accept: application/vnd.github.diff") {
    return number === 13 ? validationDiff + shippingDiff
      : number === 12 || publicationDiffNumbers.has(number) ? validationDiff
        : number === 10 ? diff.slice(0, -2) : diff;
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
  // PR 54/55 stay stable through the quick run's own capture (2 metadata reads
  // + 1 diff read), then drift exactly as publication re-reads them fresh.
  if (number === publicationNumbers.stale && reads >= 3) result.head.sha = "d".repeat(40);
  if (number === publicationNumbers.draft && reads >= 3) result.draft = true;
  return JSON.stringify(result);
}
