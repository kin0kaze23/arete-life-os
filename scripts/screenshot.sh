#!/usr/bin/env bash
# screenshot.sh — Take a screenshot of the AreteLifeOS app
#
# Usage:
#   ./scripts/screenshot.sh [url] [output_path]
#
# Defaults:
#   url: http://127.0.0.1:4173
#   output: screenshots/screenshot-$(date +%Y%m%d-%H%M%S).png
#
# Requirements:
#   - Dev server must be running (npm run dev -- --host 127.0.0.1 --port 4173)
#   - Playwright chromium browser must be installed (npx playwright install chromium)

set -euo pipefail

URL="${1:-http://127.0.0.1:4173}"
OUTPUT_DIR="screenshots"
OUTPUT="${2:-$OUTPUT_DIR/screenshot-$(date +%Y%m%d-%H%M%S).png}"

mkdir -p "$OUTPUT_DIR"

# Check if Playwright browsers are installed
if ! npx playwright screenshot --help &>/dev/null 2>&1; then
  echo "Playwright browsers not installed. Installing chromium..."
  npx playwright install chromium
fi

echo "Taking screenshot of $URL → $OUTPUT"
npx playwright screenshot --viewport-size="1280,800" --full-page "$URL" "$OUTPUT"

echo "Screenshot saved to: $OUTPUT"
