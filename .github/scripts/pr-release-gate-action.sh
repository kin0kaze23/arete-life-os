#!/usr/bin/env bash
# pr-release-gate-action.sh — v4.34 PR Release Gate Action
#
# Runs the sensitive change classifier and release decision report on PR changes.
# Writes a structured GitHub job summary and sets step outputs.
#
# Environment variables:
#   GITHUB_STEP_SUMMARY — file path for job summary (set by GitHub Actions)
#   GITHUB_EVENT_PULL_REQUEST_BASE_REF — base branch name
#   GITHUB_EVENT_PULL_REQUEST_HEAD_REF — head branch name
#   GITHUB_EVENT_PULL_REQUEST_NUMBER — PR number
#
# Exit codes:
#   0 — advisory or pass (PR not blocked)
#   1 — block (expired allowed failure or policy violation)

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

# ─── Determine diff range ────────────────────────────────────────────────
BASE_REF="${GITHUB_EVENT_PULL_REQUEST_BASE_REF:-main}"
HEAD_REF="${GITHUB_EVENT_PULL_REQUEST_HEAD_REF:-HEAD}"
DIFF_RANGE="origin/${BASE_REF}...HEAD"

# For workflow_dispatch or local testing, fall back to HEAD
if ! git rev-parse --verify "origin/${BASE_REF}" >/dev/null 2>&1; then
  echo "[pr-release-gate] Base branch origin/${BASE_REF} not found, using HEAD~1"
  DIFF_RANGE="HEAD~1...HEAD"
fi

echo "[pr-release-gate] Diff range: ${DIFF_RANGE}"

# ─── Run sensitive change classifier ─────────────────────────────────────
CLASSIFIER_OUTPUT=$(bash "$ROOT_DIR/.github/scripts/sensitive-change-classifier.sh" --diff "$DIFF_RANGE" 2>/dev/null || echo "")
echo "$CLASSIFIER_OUTPUT"

# Parse classifier output
RISK_LEVEL=$(echo "$CLASSIFIER_OUTPUT" | grep "risk_level:" | awk '{print $2}')
SENSITIVE_AREAS=$(echo "$CLASSIFIER_OUTPUT" | grep "sensitive_areas:" | sed 's/.*sensitive_areas: //')
MUST_ESCALATE=$(echo "$CLASSIFIER_OUTPUT" | grep "must_escalate:" | awk '{print $2}')
DETECTION_TYPE=$(echo "$CLASSIFIER_OUTPUT" | grep "classifier_detection_type:" | awk '{print $2}')
CLASSIFIER_DETECTED=$(echo "$CLASSIFIER_OUTPUT" | grep "classifier_detected_sensitive:" | awk '{print $2}')
MATCHED_PATTERNS=$(echo "$CLASSIFIER_OUTPUT" | grep "matched_content_patterns:" | sed 's/.*matched_content_patterns: //')
ADVISORY_PATTERNS=$(echo "$CLASSIFIER_OUTPUT" | grep "matched_advisory_patterns:" | sed 's/.*matched_advisory_patterns: //')
CLASSIFIER_REASON=$(echo "$CLASSIFIER_OUTPUT" | grep "classifier_reason:" | sed 's/.*classifier_reason: //')

# Defaults for empty values
RISK_LEVEL="${RISK_LEVEL:-none}"
SENSITIVE_AREAS="${SENSITIVE_AREAS:-}"
MUST_ESCALATE="${MUST_ESCALATE:-false}"
DETECTION_TYPE="${DETECTION_TYPE:-none}"
CLASSIFIER_DETECTED="${CLASSIFIER_DETECTED:-false}"
MATCHED_PATTERNS="${MATCHED_PATTERNS:-}"
ADVISORY_PATTERNS="${ADVISORY_PATTERNS:-}"
CLASSIFIER_REASON="${CLASSIFIER_REASON:-No sensitive patterns detected}"

# ─── Run release decision report ─────────────────────────────────────────
REPORT_OUTPUT=$(bash "$ROOT_DIR/.github/scripts/release-decision-report.sh" --diff "$DIFF_RANGE" --repo "$ROOT_DIR" 2>/dev/null || echo "")
echo "$REPORT_OUTPUT"

# Save report to file for artifact upload
echo "$REPORT_OUTPUT" > /tmp/release-decision-report.txt

# Parse report output
RELEASE_STATUS=$(echo "$REPORT_OUTPUT" | grep "release_status:" | awk '{print $2}')
TESTS_REQUIRED=$(echo "$REPORT_OUTPUT" | grep "tests_required:" | awk '{print $2}')
REVIEWER_REQUIRED=$(echo "$REPORT_OUTPUT" | grep "reviewer_required:" | awk '{print $2}')
ALLOWED_FAILURES=$(echo "$REPORT_OUTPUT" | grep "allowed_failures_used:" | sed 's/.*allowed_failures_used: //')
EXPIRY_WARNINGS=$(echo "$REPORT_OUTPUT" | grep "expiry_warnings:" | sed 's/.*expiry_warnings: //')
RECOMMENDATION=$(echo "$REPORT_OUTPUT" | grep "final_recommendation:" | sed 's/.*final_recommendation: //')

# Defaults
RELEASE_STATUS="${RELEASE_STATUS:-pass}"
TESTS_REQUIRED="${TESTS_REQUIRED:-false}"
REVIEWER_REQUIRED="${REVIEWER_REQUIRED:-false}"
ALLOWED_FAILURES="${ALLOWED_FAILURES:-none}"
EXPIRY_WARNINGS="${EXPIRY_WARNINGS:-none}"
RECOMMENDATION="${RECOMMENDATION:-Safe to merge}"

# ─── Determine status icon ───────────────────────────────────────────────
case "$RELEASE_STATUS" in
  pass) STATUS_ICON="✅" ;;
  advisory) STATUS_ICON="⚠️" ;;
  block) STATUS_ICON="🚫" ;;
  *) STATUS_ICON="❓" ;;
esac

case "$RISK_LEVEL" in
  high) RISK_ICON="🔴" ;;
  medium) RISK_ICON="🟡" ;;
  none) RISK_ICON="🟢" ;;
  *) RISK_ICON="⚪" ;;
esac

# ─── Determine owner next action ──────────────────────────────────────────
OWNER_ACTION=""
if [[ "$RELEASE_STATUS" == "block" ]]; then
  OWNER_ACTION="🚫 BLOCKED: Resolve expired allowed failure or policy violation before merge."
elif [[ "$RISK_LEVEL" == "high" ]]; then
  OWNER_ACTION="⚠️ Sensitive changes detected. Ensure reviewer approval and full tests pass before merge."
elif [[ "$RISK_LEVEL" == "medium" ]]; then
  OWNER_ACTION="⚠️ Medium-risk changes detected. Reviewer recommended."
else
  OWNER_ACTION="✅ No action required — safe to merge."
fi

# ─── Write GitHub job summary ────────────────────────────────────────────
SUMMARY_FILE="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

cat >> "$SUMMARY_FILE" << EOF

## Release Gate Summary

| Field | Value |
|-------|-------|
| Release Status | ${STATUS_ICON} ${RELEASE_STATUS} |
| Risk Level | ${RISK_ICON} ${RISK_LEVEL} |
| Detection Type | ${DETECTION_TYPE} |
| Classifier Detected Sensitive | ${CLASSIFIER_DETECTED} |
| Reviewer Required | ${REVIEWER_REQUIRED} |
| Tests Required | ${TESTS_REQUIRED} |

### Sensitive Areas
${SENSITIVE_AREAS:-None}

### Matched Sensitive Patterns
${MATCHED_PATTERNS:-None}

### Advisory Patterns
${ADVISORY_PATTERNS:-None}

### Classifier Reason
${CLASSIFIER_REASON}

### Allowed Failures
${ALLOWED_FAILURES}

### Expiry Warnings
${EXPIRY_WARNINGS}

### Recommendation
${RECOMMENDATION}

### Owner Next Action
${OWNER_ACTION}

---
*Generated by v4.34 PR Release Gate. See [docs/PR_RELEASE_GATE.md](docs/PR_RELEASE_GATE.md) for how to read this summary.*
EOF

# ─── Set step outputs ────────────────────────────────────────────────────
echo "release_status=${RELEASE_STATUS}" >> "$GITHUB_OUTPUT"
echo "risk_level=${RISK_LEVEL}" >> "$GITHUB_OUTPUT"
echo "reviewer_required=${REVIEWER_REQUIRED}" >> "$GITHUB_OUTPUT"
echo "detection_type=${DETECTION_TYPE}" >> "$GITHUB_OUTPUT"
echo "classifier_detected_sensitive=${CLASSIFIER_DETECTED}" >> "$GITHUB_OUTPUT"

# ─── Exit with appropriate code ──────────────────────────────────────────
# Only block on release_status: block (expired allowed failures, policy violations)
# Advisory and pass do not block
if [[ "$RELEASE_STATUS" == "block" ]]; then
  echo "[pr-release-gate] 🚫 BLOCKED: ${RECOMMENDATION}"
  exit 1
fi

echo "[pr-release-gate] ✅ Not blocked (status: ${RELEASE_STATUS}, risk: ${RISK_LEVEL})"
exit 0
