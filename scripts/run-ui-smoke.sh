#!/usr/bin/env bash
set -euo pipefail

# run-ui-smoke.sh — Playwright smoke tests for UI verification.
#
# Runs two test suites:
#   1. screenshot.spec.ts — visual verification (REQUIRED, always blocking)
#   2. core-loop.spec.ts — full E2E core loop (ALLOWED-FAILURE: pre-existing)
#
# The core-loop test has a known pre-existing failure because the vault unlock
# and onboarding flow does not complete correctly in CI without full Clerk
# secrets and Gemini API configuration. Instead of broadly swallowing all
# failures, this script uses an explicit allowed-failure mechanism that:
#   - Matches the known failure signature
#   - Fails CI on unknown/new failures
#   - Expires after ALLOWED_FAILURE_EXPIRY to force resolution

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Install Node.js tooling first." >&2
  exit 1
fi

# ─── Allowed-failure metadata ─────────────────────────────────────────────
# This metadata documents the known pre-existing core-loop failure.
# If the expiry date passes, the allowed failure becomes a hard failure
# to force resolution.
ALLOWED_FAILURE_NAME="core-loop-vault-onboarding-timeout"
ALLOWED_FAILURE_REASON="Vault unlock + onboarding flow does not complete in CI without full Clerk secrets and Gemini API config"
ALLOWED_FAILURE_SIGNATURE="log-input.*toBeVisible|ensureAppReady"
ALLOWED_FAILURE_OWNER="kin0kaze23"
ALLOWED_FAILURE_DATE="2026-07-06"
ALLOWED_FAILURE_EXPIRY="2026-08-06"  # 30 days — must be resolved by this date
ALLOWED_FAILURE_FOLLOWUP="Needs vault/onboarding mock or Clerk test authentication in CI"

# Check expiry (inclusive — allowed through end-of-day on the expiry date)
CURRENT_DATE=$(date +%Y%m%d)
EXPIRY_DATE=$(echo "$ALLOWED_FAILURE_EXPIRY" | tr -d '-')
if [[ "$CURRENT_DATE" -gt "$EXPIRY_DATE" ]]; then
  echo "ERROR: Allowed failure '$ALLOWED_FAILURE_NAME' has EXPIRED on $ALLOWED_FAILURE_EXPIRY." >&2
  echo "The pre-existing failure must be resolved before CI can pass." >&2
  echo "Follow-up: $ALLOWED_FAILURE_FOLLOWUP" >&2
  exit 1
fi

# ─── 1. Screenshot test (REQUIRED — always blocking) ─────────────────────
# Self-test: verify signature matches known Playwright failure output
echo "expect(page.getByTestId('log-input')).toBeVisible()" | grep -qE "$ALLOWED_FAILURE_SIGNATURE" || {
  echo "FATAL: Allowed-failure signature does not match expected Playwright output" >&2
  exit 1
}

echo "==> Running screenshot visual verification (required)..."
npx playwright test e2e/screenshot.spec.ts
echo "✓ Screenshot test passed"

# ─── 2. Core-loop test (ALLOWED-FAILURE — pattern-matched) ───────────────
echo ""
echo "==> Running core-loop E2E test (allowed-failure: $ALLOWED_FAILURE_NAME)..."

# Capture output and exit code separately
CORE_LOOP_EXIT=0
CORE_LOOP_OUTPUT=$(npx playwright test e2e/core-loop.spec.ts 2>&1) || CORE_LOOP_EXIT=$?

if [[ "$CORE_LOOP_EXIT" -eq 0 ]]; then
  echo "✓ Core-loop test passed — pre-existing issue may be resolved!"
  exit 0
fi

# Core-loop failed — check if failure matches the known signature
echo "$CORE_LOOP_OUTPUT" >&2

if echo "$CORE_LOOP_OUTPUT" | grep -qE "$ALLOWED_FAILURE_SIGNATURE"; then
  echo "" >&2
  echo "ALLOWED FAILURE: '$ALLOWED_FAILURE_NAME'" >&2
  echo "  Reason: $ALLOWED_FAILURE_REASON" >&2
  echo "  Owner: $ALLOWED_FAILURE_OWNER" >&2
  echo "  Date: $ALLOWED_FAILURE_DATE" >&2
  echo "  Expiry: $ALLOWED_FAILURE_EXPIRY (must be resolved by this date)" >&2
  echo "  Follow-up: $ALLOWED_FAILURE_FOLLOWUP" >&2
  echo "" >&2
  echo "  Screenshot test passed — visual verification is functional." >&2
  echo "  Core-loop failure matches known signature — CI will pass." >&2
  exit 0
fi

# Failure does NOT match known signature — this is a new regression
echo "" >&2
echo "UNEXPECTED FAILURE: core-loop.spec.ts failed with an unknown error." >&2
echo "This does not match the allowed failure signature '$ALLOWED_FAILURE_NAME'." >&2
echo "The failure output is shown above — investigate and fix the regression." >&2
exit 1
