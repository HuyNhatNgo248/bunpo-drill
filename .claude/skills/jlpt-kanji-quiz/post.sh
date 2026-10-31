#!/usr/bin/env bash
# Validate a kanji chapter or a kanji test against its schema, then POST it to the 文法ドリル app.
#
#   bash .claude/skills/jlpt-kanji-quiz/post.sh chapter <chapter.json>   # → POST /api/kanji/chapters
#   bash .claude/skills/jlpt-kanji-quiz/post.sh test <test.json>         # → POST /api/tests
#
# BUNPO_URL sets the app address (default http://localhost:3001).
# BUNPO_API_TOKEN is the app's API token (default: the one in the app's .env).
# Exit codes: 0 saved, 1 invalid file, wrong token or server error, 2 app not running.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
app="$(cd "$here/../../.." && pwd)"
url="${BUNPO_URL:-http://localhost:3001}"
url="${url%/}"
token="${BUNPO_API_TOKEN:-$(sed -n 's/^BUNPO_API_TOKEN=//p' "$app/.env" 2>/dev/null | tail -n 1)}"
auth=()
[[ -n "$token" ]] && auth=(-H "Authorization: Bearer $token")

case "${1:-}" in
  chapter) schema="$here/chapter.schema.json"; endpoint="/api/kanji/chapters" ;;
  test) schema="$here/test.schema.json"; endpoint="/api/tests" ;;
  *) echo "Usage: post.sh chapter|test <file.json>" >&2; exit 1 ;;
esac
if [[ $# -ne 2 || ! -f "$2" ]]; then
  echo "Usage: post.sh chapter|test <file.json>" >&2
  exit 1
fi
file="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"

# 1. Shape check against the schema (ajv comes from the app's node_modules).
(cd "$app" && node --input-type=module -e '
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const [schemaFile, file, kind] = process.argv.slice(1);
let body;
try {
  body = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
  console.error(`Not valid JSON: ${error.message}`);
  process.exit(1);
}
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(schemaFile, "utf8")));
if (!validate(body)) {
  console.error(`${kind}.schema.json check failed:`);
  for (const error of validate.errors) {
    const where = error.instancePath || "(root)";
    const extra = error.params?.additionalProperty ? ` "${error.params.additionalProperty}"` : "";
    console.error(`  ${where}: ${error.message}${extra}`);
  }
  process.exit(1);
}
console.log(`${kind}.schema.json check passed.`);
if (kind === "test") {
  const counts = body.sections.map((section) => section.questions.length);
  if (counts.join() !== "5,5") console.log(`Note: ${counts.join(" / ")} questions, not the standard 5 / 5. Fine if the user asked for this.`);
}
' "$schema" "$file" "$1")

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

# 3. POST. The server re-checks the shape plus the cross-field rules (and, for a test, its chapter's words).
response="$(curl -sS -w $'\n%{http_code}' -X POST -H "Content-Type: application/json" ${auth[@]+"${auth[@]}"} --data-binary @"$file" "$url$endpoint")"
status="${response##*$'\n'}"
body="${response%$'\n'*}"

if [[ "$status" == "201" ]]; then
  node -e '
    const r = JSON.parse(process.argv[1]);
    console.log(r.id ? `Saved test ${r.id}\n${r.url}` : `Saved ${r.level} chapter ${r.chapter} (${r.words} words)\n${r.url}`);
  ' "$body"
else
  echo "POST $endpoint failed ($status):" >&2
  node -e '
    const r = JSON.parse(process.argv[1]);
    console.log(r.error ?? JSON.stringify(r));
    for (const i of r.issues ?? []) console.log(`  ${i.path}: ${i.message}`);
  ' "$body" >&2 2>/dev/null || echo "$body" >&2
  exit 1
fi
