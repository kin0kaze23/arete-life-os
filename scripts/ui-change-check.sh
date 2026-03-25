#!/usr/bin/env bash
set -euo pipefail

# UI/UX change guardrail: classify changes and warn if core/AI/backend/security files are touched.

STRICT=0
PRINT_FLAGS=0
DIFF_TARGET="HEAD"
RG_BIN=$(command -v rg || true)

usage() {
  cat <<'USAGE'
Usage: scripts/ui-change-check.sh [--strict] [--print-flags] [--base <git-ref>]

- --strict: exit non-zero if non-UI files are changed
- --print-flags: output UI_ONLY/CORE_TOUCHED/OTHER_TOUCHED values only
- --base: compare against a git ref (default: HEAD)
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --strict)
      STRICT=1
      shift 1
      ;;
    --base)
      DIFF_TARGET="$2"
      shift 2
      ;;
    --print-flags)
      PRINT_FLAGS=1
      shift 1
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

CHANGED=$(git diff --name-only "$DIFF_TARGET" || true)
STAGED=$(git diff --name-only --cached || true)
FILES=$(printf "%s\n%s" "$CHANGED" "$STAGED" | sed '/^$/d' | sort -u)

if [ -z "$FILES" ]; then
  if [ "$PRINT_FLAGS" -eq 1 ]; then
    echo "UI_ONLY=1 CORE_TOUCHED=0 OTHER_TOUCHED=0"
    exit 0
  fi
  echo "No changes detected."
  exit 0
fi

# Allowlist of UI-focused paths
UI_PATHS_REGEX='^(app/|dashboard/|command/|shared/|layout/|public/|stream/|onboarding/|vault/|index.html|index.tsx|metadata.json|vite.config.ts|tailwind|styles/|assets/)'

# Core/AI/backend/security-sensitive paths
CORE_PATHS_REGEX='^(core/|api/|ai/|data/|scripts/|vercel.json|package.json|package-lock.json|tsconfig.json|e2e/|docs/|\\.agent/core/)'

match() {
  local regex="$1"
  if [ -n "$RG_BIN" ]; then
    rg -q "$regex"
  else
    grep -Eq "$regex"
  fi
}

ui_only=1
core_touched=0
other_touched=0

while IFS= read -r f; do
  if echo "$f" | match "$CORE_PATHS_REGEX"; then
    core_touched=1
    ui_only=0
  elif echo "$f" | match "$UI_PATHS_REGEX"; then
    :
  else
    other_touched=1
    ui_only=0
  fi
done <<< "$FILES"

if [ "$PRINT_FLAGS" -eq 0 ]; then
  echo "UI change check"
  echo "- Files changed:"
  while IFS= read -r f; do
    echo "  - $f"
  done <<< "$FILES"
fi

if [ "$ui_only" -eq 1 ]; then
  if [ "$PRINT_FLAGS" -eq 1 ]; then
    echo "UI_ONLY=1 CORE_TOUCHED=0 OTHER_TOUCHED=0"
    exit 0
  fi
  echo "Result: UI-only changes detected."
  exit 0
fi

if [ "$core_touched" -eq 1 ]; then
  if [ "$PRINT_FLAGS" -eq 0 ]; then
    echo "Result: Core/AI/backend-sensitive files touched. Review required."
  fi
fi

if [ "$other_touched" -eq 1 ]; then
  if [ "$PRINT_FLAGS" -eq 0 ]; then
    echo "Result: Non-UI files touched. Review required."
  fi
fi

if [ "$STRICT" -eq 1 ]; then
  exit 2
fi

if [ "$PRINT_FLAGS" -eq 1 ]; then
  echo "UI_ONLY=0 CORE_TOUCHED=$core_touched OTHER_TOUCHED=$other_touched"
  exit 0
fi

exit 0
