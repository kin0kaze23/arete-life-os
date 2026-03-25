#!/usr/bin/env bash
set -euo pipefail

# Unified Quality Script with Tiers
# Usage: ./scripts/quality.sh [--fast|--standard|--full]

TIER="standard"
VERBOSE=0
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
  cat <<'USAGE'
Usage: ./scripts/quality.sh [OPTIONS]

Quality check tiers:
  --fast       Quick checks only (build + lint) ~5s
  --standard   Standard checks (+ security, cost) ~30s [default]
  --full       Full quality gate (+ a11y, perf, visual) ~2min

Options:
  -v, --verbose  Show detailed output
  -h, --help     Show this help

Examples:
  ./scripts/quality.sh                 # Standard tier
  ./scripts/quality.sh --fast          # Quick check
  ./scripts/quality.sh --full          # Pre-push gate
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --fast)
      TIER="fast"
      shift
      ;;
    --standard)
      TIER="standard"
      shift
      ;;
    --full)
      TIER="full"
      shift
      ;;
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

TIER_UPPER=$(echo "$TIER" | tr '[:lower:]' '[:upper:]')
echo -e "${BLUE}🔍 Quality Check: ${TIER_UPPER} tier${NC}"
echo ""

# ============================================
# TIER 1: FAST (~5 seconds)
# ============================================
echo -e "${BLUE}━━━ TIER 1: Build & Lint & Typecheck ━━━${NC}"

if npm run lint 2>&1 | tail -n 5; then
  echo -e "${GREEN}✅ Lint: PASS${NC}"
else
  echo -e "${RED}❌ Lint: FAIL${NC}"
  ERRORS=$((ERRORS + 1))
fi

# CRITICAL: Vite build does NOT enforce TypeScript strict checking.
# tsc --noEmit is the ONLY way to catch type errors before they ship.
# This was the root cause of 35+ TS errors slipping through in Jan 2026.
if npm run typecheck 2>&1 | tail -n 10; then
  echo -e "${GREEN}✅ Typecheck: PASS${NC}"
else
  echo -e "${RED}❌ Typecheck: FAIL${NC}"
  ERRORS=$((ERRORS + 1))
fi

if npm run build 2>&1 | tail -n 5; then
  echo -e "${GREEN}✅ Build: PASS${NC}"
else
  echo -e "${RED}❌ Build: FAIL${NC}"
  ERRORS=$((ERRORS + 1))
fi

if [ "$TIER" = "fast" ]; then
  echo ""
  if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}══════════════════════════════${NC}"
    echo -e "${GREEN}✅ FAST Quality Check: PASS${NC}"
    echo -e "${GREEN}══════════════════════════════${NC}"
    exit 0
  else
    echo -e "${RED}══════════════════════════════${NC}"
    echo -e "${RED}❌ FAST Quality Check: FAIL${NC}"
    echo -e "${RED}══════════════════════════════${NC}"
    exit 1
  fi
fi

# ============================================
# TIER 2: STANDARD (~30 seconds)
# ============================================
echo ""
echo -e "${BLUE}━━━ TIER 2: Security & Cost ━━━${NC}"

# Dependency Security
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)
CRITICAL=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
HIGH=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$CRITICAL" -eq 0 ] && [ "$HIGH" -eq 0 ]; then
  echo -e "${GREEN}✅ Dependency Audit: PASS (0 critical, 0 high)${NC}"
else
  echo -e "${YELLOW}⚠️  Dependency Audit: $CRITICAL critical, $HIGH high${NC}"
  if [ "$CRITICAL" -gt 0 ]; then
    ERRORS=$((ERRORS + 1))
  else
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# UI Change Check
if [ -f "./scripts/ui-change-check.sh" ]; then
  if ./scripts/ui-change-check.sh 2>&1 | tail -n 3; then
    echo -e "${GREEN}✅ UI Change Guard: PASS${NC}"
  else
    echo -e "${YELLOW}⚠️  UI Change Guard: Review suggested${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Cost Guardrail
if [ -f "./scripts/cost-guardrail.sh" ]; then
  if ./scripts/cost-guardrail.sh --allow 2>&1 | tail -n 3; then
    echo -e "${GREEN}✅ Cost Guardrail: PASS${NC}"
  else
    echo -e "${YELLOW}⚠️  Cost Guardrail: New AI calls detected${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

if [ "$TIER" = "standard" ]; then
  echo ""
  if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}══════════════════════════════${NC}"
    echo -e "${GREEN}✅ STANDARD Quality Check: PASS${NC}"
    [ $WARNINGS -gt 0 ] && echo -e "${YELLOW}   ($WARNINGS warnings)${NC}"
    echo -e "${GREEN}══════════════════════════════${NC}"
    exit 0
  else
    echo -e "${RED}══════════════════════════════${NC}"
    echo -e "${RED}❌ STANDARD Quality Check: FAIL${NC}"
    echo -e "${RED}══════════════════════════════${NC}"
    exit 1
  fi
fi

# ============================================
# TIER 3: FULL (~2 minutes)
# ============================================
echo ""
echo -e "${BLUE}━━━ TIER 3: A11y, Perf & Architecture ━━━${NC}"

# Accessibility
if [ -f "./scripts/accessibility-check.sh" ]; then
  if ./scripts/accessibility-check.sh 2>&1 | tail -n 5; then
    echo -e "${GREEN}✅ Accessibility (WCAG 2.1 AA): PASS${NC}"
  else
    RESULT=$?
    if [ $RESULT -eq 2 ]; then
      echo -e "${YELLOW}⚠️  Accessibility: Violations found${NC}"
      WARNINGS=$((WARNINGS + 1))
    else
      echo -e "${RED}❌ Accessibility: Check failed${NC}"
      ERRORS=$((ERRORS + 1))
    fi
  fi
else
  echo -e "${YELLOW}⏭️  Accessibility: Script not found${NC}"
fi

# Architecture Drift
if [ -f "./scripts/architecture-drift-check.sh" ]; then
  if ./scripts/architecture-drift-check.sh 2>&1 | tail -n 3; then
    echo -e "${GREEN}✅ Architecture: PASS${NC}"
  else
    echo -e "${YELLOW}⚠️  Architecture: Drift detected${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Latency Baseline
if [ -f "./scripts/latency-baseline.sh" ] && [ -f "./.agent/metrics/latency-baseline.json" ]; then
  if ./scripts/latency-baseline.sh --check 2>&1 | tail -n 3; then
    echo -e "${GREEN}✅ Performance Baseline: PASS${NC}"
  else
    echo -e "${YELLOW}⚠️  Performance: Regression detected${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${YELLOW}⏭️  Performance Baseline: Not configured${NC}"
fi

# Git Status
echo ""
echo -e "${BLUE}━━━ Git Status ━━━${NC}"
if git diff --quiet && git diff --cached --quiet 2>/dev/null; then
  echo -e "${GREEN}✅ Working directory: Clean${NC}"
else
  echo -e "${YELLOW}⚠️  Uncommitted changes:${NC}"
  git status --short 2>/dev/null || true
fi

# Final Summary
echo ""
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}══════════════════════════════════════${NC}"
  echo -e "${GREEN}✅ FULL Quality Gate: PASS${NC}"
  [ $WARNINGS -gt 0 ] && echo -e "${YELLOW}   ($WARNINGS warnings to review)${NC}"
  echo -e "${GREEN}══════════════════════════════════════${NC}"
  exit 0
else
  echo -e "${RED}══════════════════════════════════════${NC}"
  echo -e "${RED}❌ FULL Quality Gate: FAIL ($ERRORS errors)${NC}"
  echo -e "${RED}══════════════════════════════════════${NC}"
  exit 1
fi
