#!/usr/bin/env bash
# reviewer-evidence-detector.sh — v4.35 Reviewer Evidence Detector
#
# Detects trusted reviewer evidence for a PR using GitHub CLI.
# Checks for:
#   1. GitHub PR review approval (APPROVED state)
#   2. Maintainer-applied label "reviewer-approved"
#
# Does NOT trust:
#   - PR body text claiming reviewer was used
#   - Changed telemetry files in the PR diff
#   - Any file modified by the PR author
#
# Usage:
#   bash reviewer-evidence-detector.sh --pr <number> [--repo <owner/repo>]
#   bash reviewer-evidence-detector.sh --evidence-file <file>  (for testing)
#
# Non-blocking: exits 0 always (advisory output only).

set -uo pipefail

PR_NUMBER=""
REPO=""
EVIDENCE_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr) PR_NUMBER="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --evidence-file) EVIDENCE_FILE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Default values
EVIDENCE_FOUND="false"
EVIDENCE_TYPE="none"
REVIEWER_IDENTITY="unknown"
EVIDENCE_TRUSTED="false"
REASON="No reviewer evidence found"

# ─── Mode 1: Read from precomputed evidence file (for testing) ──────────
if [[ -n "$EVIDENCE_FILE" && -f "$EVIDENCE_FILE" ]]; then
  EVIDENCE_FOUND=$(grep "reviewer_evidence_found:" "$EVIDENCE_FILE" | awk '{print $2}')
  EVIDENCE_TYPE=$(grep "evidence_type:" "$EVIDENCE_FILE" | awk '{print $2}')
  REVIEWER_IDENTITY=$(grep "reviewer_identity:" "$EVIDENCE_FILE" | awk '{print $2}')
  EVIDENCE_TRUSTED=$(grep "evidence_trusted:" "$EVIDENCE_FILE" | awk '{print $2}')
  REASON=$(grep "reason:" "$EVIDENCE_FILE" | sed 's/.*reason: //')

  echo "REVIEWER_EVIDENCE:"
  echo "  reviewer_evidence_found: ${EVIDENCE_FOUND:-false}"
  echo "  evidence_type: ${EVIDENCE_TYPE:-none}"
  echo "  reviewer_identity: ${REVIEWER_IDENTITY:-unknown}"
  echo "  evidence_trusted: ${EVIDENCE_TRUSTED:-false}"
  echo "  reason: ${REASON:-No reviewer evidence found}"
  exit 0
fi

# ─── Mode 2: Query GitHub via gh CLI ─────────────────────────────────────
if [[ -z "$PR_NUMBER" ]]; then
  # No PR number — likely local testing or workflow_dispatch
  REASON="No PR number provided — cannot check reviewer evidence"
  echo "REVIEWER_EVIDENCE:"
  echo "  reviewer_evidence_found: $EVIDENCE_FOUND"
  echo "  evidence_type: $EVIDENCE_TYPE"
  echo "  reviewer_identity: $REVIEWER_IDENTITY"
  echo "  evidence_trusted: $EVIDENCE_TRUSTED"
  echo "  reason: $REASON"
  exit 0
fi

# Check if gh CLI is available
if ! command -v gh &>/dev/null; then
  REASON="gh CLI not available — cannot check reviewer evidence"
  echo "REVIEWER_EVIDENCE:"
  echo "  reviewer_evidence_found: $EVIDENCE_FOUND"
  echo "  evidence_type: $EVIDENCE_TYPE"
  echo "  reviewer_identity: $REVIEWER_IDENTITY"
  echo "  evidence_trusted: $EVIDENCE_TRUSTED"
  echo "  reason: $REASON"
  exit 0
fi

GH_ARGS=""
if [[ -n "$REPO" ]]; then
  GH_ARGS="--repo $REPO"
fi

# ─── Check 1: GitHub PR review approval (APPROVED state) ─────────────────
REVIEWS_JSON=$(gh pr view "$PR_NUMBER" $GH_ARGS --json reviews 2>/dev/null || echo "")

if [[ -n "$REVIEWS_JSON" && "$REVIEWS_JSON" != "null" ]]; then
  # Extract approving reviewers using jq if available, otherwise grep
  if command -v jq &>/dev/null; then
    APPROVED_REVIEWERS=$(echo "$REVIEWS_JSON" | jq -r '.reviews[] | select(.state == "APPROVED") | .author.login' 2>/dev/null | head -1 || echo "")
  else
    APPROVED_REVIEWERS=$(echo "$REVIEWS_JSON" | grep -o '"state":"APPROVED"' | head -1 || echo "")
  fi

  if [[ -n "$APPROVED_REVIEWERS" ]]; then
    EVIDENCE_FOUND="true"
    EVIDENCE_TYPE="github_review"
    if command -v jq &>/dev/null; then
      REVIEWER_IDENTITY="$APPROVED_REVIEWERS"
    else
      REVIEWER_IDENTITY="approved-reviewer"
    fi
    EVIDENCE_TRUSTED="true"
    REASON="GitHub approving review from $REVIEWER_IDENTITY"
  fi
fi

# ─── Check 2: Trusted label "reviewer-approved" ──────────────────────────
if [[ "$EVIDENCE_FOUND" == "false" ]]; then
  LABELS_JSON=$(gh pr view "$PR_NUMBER" $GH_ARGS --json labels 2>/dev/null || echo "")

  if [[ -n "$LABELS_JSON" && "$LABELS_JSON" != "null" ]]; then
    if command -v jq &>/dev/null; then
      HAS_LABEL=$(echo "$LABELS_JSON" | jq -r '.labels[].name' 2>/dev/null | grep -qi "reviewer-approved" && echo "true" || echo "false")
    else
      HAS_LABEL=$(echo "$LABELS_JSON" | grep -qi "reviewer-approved" && echo "true" || echo "false")
    fi

    if [[ "$HAS_LABEL" == "true" ]]; then
      EVIDENCE_FOUND="true"
      EVIDENCE_TYPE="trusted_label"
      REVIEWER_IDENTITY="maintainer"
      EVIDENCE_TRUSTED="true"
      REASON="Trusted label 'reviewer-approved' applied by maintainer"
    fi
  fi
fi

# ─── Output ──────────────────────────────────────────────────────────────
echo "REVIEWER_EVIDENCE:"
echo "  reviewer_evidence_found: $EVIDENCE_FOUND"
echo "  evidence_type: $EVIDENCE_TYPE"
echo "  reviewer_identity: $REVIEWER_IDENTITY"
echo "  evidence_trusted: $EVIDENCE_TRUSTED"
echo "  reason: $REASON"
