#!/usr/bin/env bash
# Validate a mock-test payload against schema.json, then POST it to the 文法ドリル app.
#
#   bash .claude/skills/jlpt-grammar-quiz/post.sh <payload.json>
#
# BUNPO_URL sets the app address (default http://localhost:3000).
# BUNPO_API_TOKEN is the app's API token (default: the one in the app's .env).
# Exit codes: 0 saved, 1 invalid payload, wrong token or server error, 2 app not running.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app="$(cd "$here/../../.." && pwd)"
url="${BUNPO_URL:-http://localhost:3000}"
url="${url%/}"
token="${BUNPO_API_TOKEN:-$(sed -n 's/^BUNPO_API_TOKEN=//p' "$app/.env" 2>/dev/null | tail -n 1)}"
auth=()
[[ -n "$token" ]] && auth=(-H "Authorization: Bearer $token")

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: post.sh <payload.json>" >&2
  exit 1
fi
payload="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"

# 1. Shape check against schema.json (ajv comes from the app's node_modules).
(cd "$app" && node --input-type=module -e '
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const [schemaFile, payloadFile] = process.argv.slice(1);
let payload;
try {
  payload = JSON.parse(readFileSync(payloadFile, "utf8"));
} catch (error) {
  console.error(`Not valid JSON: ${error.message}`);
  process.exit(1);
}
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(schemaFile, "utf8")));
if (!validate(payload)) {
  console.error("schema.json check failed:");
  for (const error of validate.errors) {
    const where = error.instancePath || "(root)";
    const extra = error.params?.additionalProperty ? ` "${error.params.additionalProperty}"` : "";
    console.error(`  ${where}: ${error.message}${extra}`);
  }
  process.exit(1);
}
console.log("schema.json check passed.");
const [fill, order, passage] = payload.sections;
const counts = [fill.questions.length, order.questions.length, passage.passages.reduce((n, p) => n + p.questions.length, 0)];
if (counts.join() !== "15,15,15") {
  console.log(`Note: ${counts.join(" / ")} questions, not the standard 15 / 15 / 15. Fine if the user asked for this.`);
}
' "$here/schema.json" "$payload")

# 2. Is the app running, and does it take the token?
check="$(curl -sS -o /dev/null -w '%{http_code}' ${auth[@]+"${auth[@]}"} "$url/api/tests" 2>/dev/null || true)"
if [[ -z "$check" || "$check" == "000" ]]; then
  echo "The app is not running at $url. Start it with: cd \"$app\" && pnpm dev" >&2
  exit 2
fi
if [[ "$check" == "401" ]]; then
  echo "The app at $url refused the API token. Set BUNPO_API_TOKEN in $app/.env to the app's value." >&2
  exit 1
fi

# 3. POST. The server re-checks the shape plus the cross-field rules.
response="$(curl -sS -w $'\n%{http_code}' -X POST -H "Content-Type: application/json" ${auth[@]+"${auth[@]}"} --data-binary @"$payload" "$url/api/tests")"
status="${response##*$'\n'}"
body="${response%$'\n'*}"

if [[ "$status" == "201" ]]; then
  node -e 'const r = JSON.parse(process.argv[1]); console.log(`Saved test ${r.id}\n${r.url}`)' "$body"
else
  echo "POST /api/tests failed ($status):" >&2
  node -e '
    const r = JSON.parse(process.argv[1]);
    console.log(r.error ?? JSON.stringify(r));
    for (const i of r.issues ?? []) console.log(`  ${i.path}: ${i.message}`);
  ' "$body" >&2 2>/dev/null || echo "$body" >&2
  exit 1
fi
