#!/usr/bin/env bash
set -euo pipefail

# Comprehensive quality gate script
# Runs all quality checks before pushing code

echo "🔍 Running Quality Gate..."

ERRORS=0

# 1. Build & Lint
echo ""
echo "--- Build & Lint Verification ---"
if npm run lint; then
  echo "✅ Lint: PASS"
else
  echo "❌ Lint: FAIL"
  ERRORS=$((ERRORS + 1))
fi

if npm run build; then
  echo "✅ Build: PASS"
else
  echo "❌ Build: FAIL"
  ERRORS=$((ERRORS + 1))
fi

# 2. Dependency Security
echo ""
echo "--- Dependency Security Audit ---"
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)
CRITICAL=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
HIGH=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$CRITICAL" -eq 0 ] && [ "$HIGH" -eq 0 ]; then
  echo "✅ Dependency Audit: PASS (0 critical, 0 high)"
else
  echo "⚠️  Dependency Audit: WARNINGS ($CRITICAL critical, $HIGH high)"
  echo "   Run: npm audit fix"
  if [ "$CRITICAL" -gt 0 ]; then
    ERRORS=$((ERRORS + 1))
  fi
fi

# 3. Git Status
echo ""
echo "--- Git Status ---"
if git diff --quiet && git diff --cached --quiet; then
  echo "✅ Working directory clean"
else
  echo "⚠️  Uncommitted changes detected"
  git status --short
fi

# 4. UI Change Check (if exists)
echo ""
echo "--- UI Change Guard ---"
if [ -f "./scripts/ui-change-check.sh" ]; then
  if ./scripts/ui-change-check.sh; then
    echo "✅ UI Change Guard: PASS"
  else
    echo "⚠️  UI Change Guard: Review required"
  fi
else
  echo "⏭️  UI Change Guard: Script not found (skipping)"
fi

# 5. Cost Guardrail (if exists)
echo ""
echo "--- Cost Guardrail ---"
if [ -f "./scripts/cost-guardrail.sh" ]; then
  if ./scripts/cost-guardrail.sh --allow; then
    echo "✅ Cost Guardrail: PASS"
  else
    echo "⚠️  Cost Guardrail: New AI calls detected"
  fi
else
  echo "⏭️  Cost Guardrail: Script not found (skipping)"
fi

# 6. Architecture Drift (if exists)
echo ""
echo "--- Architecture Drift Check ---"
if [ -f "./scripts/architecture-drift-check.sh" ]; then
  if ./scripts/architecture-drift-check.sh; then
    echo "✅ Architecture: PASS"
  else
    echo "⚠️  Architecture: Drift detected, update docs"
  fi
else
  echo "⏭️  Architecture Drift: Script not found (skipping)"
fi

# 7. Latency Baseline (if exists)
echo ""
echo "--- Performance Baseline ---"
if [ -f "./scripts/latency-baseline.sh" ] && [ -f "./.agent/metrics/latency-baseline.json" ]; then
  if ./scripts/latency-baseline.sh --check; then
    echo "✅ Latency Baseline: PASS"
  else
    echo "⚠️  Latency Baseline: Performance regression detected"
  fi
else
  echo "⏭️  Latency Baseline: Not configured (run with --update first)"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ Quality Gate: PASS"
  echo "================================"
  exit 0
else
  echo "❌ Quality Gate: FAIL ($ERRORS critical issues)"
  echo "================================"
  exit 1
fi
