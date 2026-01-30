#!/usr/bin/env bash
set -euo pipefail

BASE="HEAD"

usage() {
  cat <<'USAGE'
Usage: scripts/run-ui-safe.sh [--base <git-ref>]

Runs UI-safe checks in sequence:
- ui-change-check
- architecture drift + cost guardrail (if non-UI touched)
- npm run doctor
- Playwright UI smoke
- latency baseline check (if baseline exists)
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
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

FLAGS=$(./scripts/ui-change-check.sh --print-flags --base "$BASE")
# shellcheck disable=SC2086
eval "$FLAGS"

if [ "${UI_ONLY:-0}" -ne 1 ]; then
  ./scripts/architecture-drift-check.sh --strict --base "$BASE"
  ./scripts/cost-guardrail.sh --base "$BASE"
fi

npm run doctor

./scripts/run-ui-smoke.sh

if [ -f .agent/metrics/latency-baseline.json ]; then
  ./scripts/latency-baseline.sh --check
else
  echo "Latency baseline not found. Run ./scripts/latency-baseline.sh --update --build to create it."
fi
