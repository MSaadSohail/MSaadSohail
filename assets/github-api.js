// GitHub GraphQL access for the data-driven cards. Uses GITHUB_TOKEN when set
// (the daily workflow), otherwise `gh auth token` for local builds.
const { execSync } = require("child_process");

const LOGIN = process.env.GH_LOGIN || "MSaadSohail";
const TOKEN = process.env.GITHUB_TOKEN || execSync("gh auth token").toString().trim();

async function graphql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`GitHub API: ${JSON.stringify(body.errors || body)}`);
  return body.data;
}

module.exports = { LOGIN, graphql };
