#!/usr/bin/env bash
set -euo pipefail

# Focused Playwright smoke for daily-use core flows.

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Install Node.js tooling first." >&2
  exit 1
fi

npx playwright test \
  e2e/core-loop.spec.ts \
  e2e/navigation-desktop.spec.ts \
  e2e/settings-ux.spec.ts \
  e2e/telegram-inbox.spec.ts
