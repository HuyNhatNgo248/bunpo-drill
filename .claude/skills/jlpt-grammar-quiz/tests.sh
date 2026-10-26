#!/usr/bin/env bash
# Print every saved test with its review chips (GET /api/tests) from the 文法ドリル app.
#
#   bash .claude/skills/jlpt-grammar-quiz/tests.sh
#
# BUNPO_URL and BUNPO_API_TOKEN work as in post.sh.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
app="$(cd "$here/../../.." && pwd)"
url="${BUNPO_URL:-http://localhost:3001}"
url="${url%/}"
token="${BUNPO_API_TOKEN:-$(sed -n 's/^BUNPO_API_TOKEN=//p' "$app/.env" 2>/dev/null | tail -n 1)}"
auth=()
[[ -n "$token" ]] && auth=(-H "Authorization: Bearer $token")

curl -fsS ${auth[@]+"${auth[@]}"} "$url/api/tests"
