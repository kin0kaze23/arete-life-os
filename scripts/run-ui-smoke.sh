#!/usr/bin/env bash
set -euo pipefail

# Minimal Playwright smoke for the core loop UI flow.

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Install Node.js tooling first." >&2
  exit 1
fi

npx playwright test e2e/core-loop.spec.ts
