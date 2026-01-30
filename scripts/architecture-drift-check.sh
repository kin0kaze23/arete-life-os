#!/usr/bin/env bash
set -euo pipefail

STRICT=0
BASE="HEAD"
RG_BIN=$(command -v rg || true)

usage() {
  cat <<'USAGE'
Usage: scripts/architecture-drift-check.sh [--strict] [--base <git-ref>]

Flags core/AI/backend changes without corresponding doc updates.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --strict)
      STRICT=1
      shift 1
      ;;
    --base)
      BASE="$2"
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

CHANGED=$(git diff --name-only "$BASE" || true)
STAGED=$(git diff --name-only --cached || true)
FILES=$(printf "%s\n%s" "$CHANGED" "$STAGED" | sed '/^$/d' | sort -u)

if [ -z "$FILES" ]; then
  echo "No changes detected."
  exit 0
fi

CORE_REGEX='^(core/|api/|ai/|data/)'
DOC_REGEX='^(docs/ARCHITECTURE\.md|docs/AI_PROMPT_FLOW\.md|docs/PRD\.md|\.agent/README\.md)'

match() {
  local regex="$1"
  if [ -n "$RG_BIN" ]; then
    rg -q "$regex"
  else
    grep -Eq "$regex"
  fi
}

core_touched=0
docs_touched=0

while IFS= read -r f; do
  if echo "$f" | match "$CORE_REGEX"; then
    core_touched=1
  fi
  if echo "$f" | match "$DOC_REGEX"; then
    docs_touched=1
  fi
done <<< "$FILES"

if [ "$core_touched" -eq 1 ] && [ "$docs_touched" -eq 0 ]; then
  echo "Architecture drift check: core/AI/backend files changed without doc updates."
  echo "Update one of: docs/ARCHITECTURE.md, docs/AI_PROMPT_FLOW.md, docs/PRD.md, .agent/README.md"
  if [ "$STRICT" -eq 1 ]; then
    exit 2
  fi
fi

echo "Architecture drift check passed."
