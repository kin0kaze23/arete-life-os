#!/usr/bin/env bash
set -euo pipefail

# Accessibility testing script using Playwright + axe-core
# Usage: ./scripts/accessibility-check.sh [--url http://localhost:5173]

URL="http://localhost:5173"
STRICT=0

usage() {
  cat <<'USAGE'
Usage: scripts/accessibility-check.sh [--url URL] [--strict]

Runs accessibility audit using axe-core WCAG 2.1 AA standards.
- --url: Target URL (default: http://localhost:5173)
- --strict: Exit non-zero if violations found
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --url)
      URL="$2"
      shift 2
      ;;
    --strict)
      STRICT=1
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

echo "🔍 Running Accessibility Audit..."
echo "   Target: $URL"
echo "   Standard: WCAG 2.1 AA"
echo ""

if ! curl -fsS --max-time 5 "$URL" >/dev/null 2>&1; then
  echo "⚠️  Target URL is not reachable: $URL"
  echo "   Start the app first or pass --url for an active environment."
  if [ "$STRICT" -eq 1 ]; then
    exit 1
  fi
  exit 2
fi

# Check if @axe-core/playwright is installed
if ! npm list @axe-core/playwright >/dev/null 2>&1; then
  echo "❌ @axe-core/playwright not installed"
  echo "   Run: npm install --save-dev @axe-core/playwright"
  exit 1
fi

# Create temporary test file inside project so Node can resolve local devDependencies.
TMPFILE=$(mktemp "${PWD}/.a11y-check.XXXXXX.mjs")
cat > "$TMPFILE" <<'PLAYWRIGHT'
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const url = process.argv[2] || 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    const violations = accessibilityScanResults.violations;
    
    console.log(`\n📊 Accessibility Report`);
    console.log(`   URL: ${url}`);
    console.log(`   Violations: ${violations.length}`);
    
    if (violations.length === 0) {
      console.log(`\n✅ No accessibility violations found!`);
      await browser.close();
      process.exit(0);
    }
    
    console.log(`\n❌ Accessibility Violations:\n`);
    
    violations.forEach((violation, idx) => {
      console.log(`${idx + 1}. ${violation.id} (${violation.impact})`);
      console.log(`   Description: ${violation.description}`);
      console.log(`   Help: ${violation.helpUrl}`);
      console.log(`   Affected elements: ${violation.nodes.length}`);
      violation.nodes.slice(0, 3).forEach(node => {
        console.log(`   - ${node.html.substring(0, 80)}...`);
      });
      console.log('');
    });
    
    await browser.close();
    process.exit(violations.length > 0 ? 2 : 0);
    
  } catch (error) {
    console.error(`\n❌ Error during accessibility check:`);
    console.error(`   ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();
PLAYWRIGHT

# Run the test
if node "$TMPFILE" "$URL"; then
  RESULT=0
else
  RESULT=$?
fi

# Cleanup
rm -f "$TMPFILE"

if [ $RESULT -eq 0 ]; then
  echo ""
  echo "✅ Accessibility: PASS"
  exit 0
elif [ $RESULT -eq 2 ]; then
  echo ""
  if [ $STRICT -eq 1 ]; then
    echo "❌ Accessibility: FAIL (violations found)"
    exit 2
  else
    echo "⚠️  Accessibility: Violations found (non-blocking)"
    exit 0
  fi
else
  echo ""
  echo "❌ Accessibility check failed"
  exit 1
fi
