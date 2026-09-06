export const repository = {
  id: "R_fixture", nameWithOwner: "fixture/repository", url: "https://github.com/fixture/repository",
};

export const diff = [
  "diff --git a/example.js b/example.js",
  "index 1111111..2222222 100644",
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

export function respond(args, cwd, history) {
  if (JSON.stringify(args) === JSON.stringify(["repo", "view", "--json", "id,nameWithOwner,url"])) {
    return JSON.stringify(repository);
  }
  const number = Number(/^repos\/fixture\/repository\/pulls\/(\d+)$/.exec(args[5])?.[1]);
  if (!number || args.length !== 8 || args[6] !== "-H" ||
      JSON.stringify(args.slice(0, 5)) !== JSON.stringify(["api", "--hostname", "github.com", "--method", "GET"])) {
    throw new Error(`Unexpected gh command: ${JSON.stringify(args)} in ${cwd}`);
  }
  return apiResponse(number, args[7], history);
}

function apiResponse(number, accept, history) {
  if (number === 8) throw new Error("fixture: HTTP 404 unavailable PR");
  if (accept === "Accept: application/vnd.github.diff") return number === 10 ? diff.slice(0, -2) : diff;
  if (accept !== "Accept: application/vnd.github+json") throw new Error("Unexpected media type");
  const result = pull(number);
  if (number === 9 && history.some((call) =>
    call.args.includes("repos/fixture/repository/pulls/9") &&
    call.args.includes("Accept: application/vnd.github.diff"))) {
    result.head.sha = "c".repeat(40);
  }
  return JSON.stringify(result);
}
