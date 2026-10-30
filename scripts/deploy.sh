#!/usr/bin/env bash
# `pnpm run deploy`: runs precommit on main, then pushes it to the production branch, which Northflank builds and deploys.
# (`pnpm deploy` alone runs pnpm's own deploy command, so this one needs `run`.)
set -euo pipefail
cd "$(dirname "$0")/.."

# The checks must run on exactly what gets deployed: the committed main.
if [ "$(git branch --show-current)" != "main" ]; then
  echo "deploy: switch to main first." >&2
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "deploy: commit or stash your changes first, so the checks run on what gets deployed." >&2
  exit 1
fi

pnpm run precommit
# The tree was clean, so the only change left is the catalogs' line references that the translation check updated.
git checkout -- app/locales

# Atomic: main and production move together, or neither does (say, when GitHub has commits that main lacks).
git push --atomic origin main main:production
echo "deploy: pushed main to production. Northflank builds and deploys it now."
