#!/usr/bin/env bash
set -euo pipefail

ALLOW=0
BASE="HEAD"
BASE_SET=0
APPROVALS_FILE=".agent/core/COST_APPROVALS.md"

usage() {
  cat <<'USAGE'
Usage: scripts/cost-guardrail.sh [--allow] [--base <git-ref>] [--approvals-file <path>]

Checks for newly added AI calls in diffs. Flags only net-new cost risk.
- Add "// cost-approved: reason" or "COST_OK" on the same line to bypass.
- Use approvals file for reusable approvals (regex per line).
- Use --allow to bypass once (not recommended).
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --allow)
      ALLOW=1
      shift 1
      ;;
    --base)
      BASE="$2"
      BASE_SET=1
      shift 2
      ;;
    --approvals-file)
      APPROVALS_FILE="$2"
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

if [ "$BASE_SET" -eq 0 ]; then
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    BASE="origin/main"
  elif git rev-parse --verify origin/master >/dev/null 2>&1; then
    BASE="origin/master"
  fi
fi

PYTHON_BIN=$(command -v python3 || command -v python || true)
if [ -z "$PYTHON_BIN" ]; then
  echo "Missing python3/python. Please install Python to run this script." >&2
  exit 1
fi

ALLOW="$ALLOW" BASE="$BASE" APPROVALS_FILE="$APPROVALS_FILE" \
"$PYTHON_BIN" - <<'PY'
from __future__ import annotations
import os
import re
import subprocess
import sys

base = os.environ.get("BASE", "HEAD")
allow = os.environ.get("ALLOW", "0") == "1"
approvals_file = os.environ.get("APPROVALS_FILE", "")


def git_diff(args: list[str]) -> str:
    try:
        return subprocess.check_output(["git", "diff", "--unified=0", *args], text=True)
    except subprocess.CalledProcessError:
        return ""


diff = "\n".join([
    git_diff([base]),
    git_diff(["--cached"]),
])

if not diff.strip():
    print("No diff detected.")
    sys.exit(0)

pattern = re.compile(
    r"(callGemini|callOpenAI|modelRouter\.generate|generateJSON\(|generateText\(|generateWithSearch\(|ai\.models\.generateContent|OpenAI\(|openai\.)"
)
allow_pattern = re.compile(r"(COST_OK|cost-approved)")

approval_rules: list[re.Pattern[str]] = []
if approvals_file and os.path.exists(approvals_file):
    for line in open(approvals_file, "r", encoding="utf-8").read().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            approval_rules.append(re.compile(line))
        except re.error:
            # Ignore invalid regex lines
            pass


def is_approved(file: str, content: str) -> bool:
    cleaned = content.strip()
    if allow_pattern.search(cleaned):
        return True
    if approval_rules:
        target = f"{file}: {cleaned}"
        for rule in approval_rules:
            if rule.search(target):
                return True
    return False


current_file = ""
additions: set[tuple[str, str]] = set()
deletions: set[tuple[str, str]] = set()

ignore_prefixes = (".agent/", "docs/", "guide/")

def should_ignore(file: str) -> bool:
    if file.endswith(".md"):
        return True
    return file.startswith(ignore_prefixes)

for line in diff.splitlines():
    if line.startswith("+++ b/"):
        current_file = line[6:].strip()
        continue
    if line.startswith("--- a/"):
        continue
    if not current_file or current_file == "/dev/null":
        continue
    if should_ignore(current_file):
        continue

    if line.startswith("+") and not line.startswith("+++"):
        content = line[1:]
        if pattern.search(content) and not is_approved(current_file, content):
            additions.add((current_file, content.strip()))
    elif line.startswith("-") and not line.startswith("---"):
        content = line[1:]
        if pattern.search(content):
            deletions.add((current_file, content.strip()))

added = len(additions)
removed = len(deletions)
net_added = added - removed

print(f"Cost guardrail base: {base}")
print(f"AI call lines added: {added}, removed: {removed}, net: {net_added}")

if added == 0 or net_added <= 0:
    print("No net-new AI calls detected.")
    sys.exit(0)

print("Potential cost-impacting changes detected (net-new AI calls):")
for file, content in sorted(additions):
    print(f"- {file}: {content}")

print("\nAdd an inline tag to approve cost impact, e.g.: // cost-approved: reason")
print("Or add an approval rule to .agent/core/COST_APPROVALS.md")

if allow:
    print("--allow used: continuing despite potential cost impact.")
    sys.exit(0)

sys.exit(2)
PY
