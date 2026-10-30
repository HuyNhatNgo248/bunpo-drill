#!/usr/bin/env bash
# `pnpm run i18n:check` (part of precommit): fails when a string in the code has no Japanese translation.
# Extract adds the strings that are new in the code to the catalogs, and updates their line references;
# then a strict compile fails on any string that has no translation.
set -euo pipefail
cd "$(dirname "$0")/.."

# The compiled .js catalogs are only a by-product: Vite compiles the .po files itself.
trap 'rm -f app/locales/*.js' EXIT
pnpm exec lingui extract --clean > /dev/null
if ! pnpm exec lingui compile --strict; then
  echo "i18n:check: fill in the empty msgstr entries in app/locales/ja.po." >&2
  exit 1
fi
