#!/usr/bin/env bash
set -euo pipefail

STAY=0
REMOTE="origin"
MAIN_BRANCH="main"

usage() {
  cat <<'USAGE'
Usage: scripts/sync-main.sh [--stay] [--remote <name>] [--branch <main>]

Safely syncs local main with remote:
- requires clean working tree
- checks out main, pulls --ff-only, then returns to previous branch (unless --stay)
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --stay)
      STAY=1
      shift 1
      ;;
    --remote)
      REMOTE="$2"
      shift 2
      ;;
    --branch)
      MAIN_BRANCH="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash before syncing main." >&2
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)

git fetch "$REMOTE"

if ! git show-ref --verify --quiet "refs/heads/$MAIN_BRANCH"; then
  git checkout -b "$MAIN_BRANCH" "$REMOTE/$MAIN_BRANCH"
else
  git checkout "$MAIN_BRANCH"
fi

git pull --ff-only "$REMOTE" "$MAIN_BRANCH"

if [ "$STAY" -eq 0 ] && [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "$MAIN_BRANCH" ]; then
  git checkout "$CURRENT_BRANCH"
fi

echo "Synced $MAIN_BRANCH with $REMOTE/$MAIN_BRANCH"
