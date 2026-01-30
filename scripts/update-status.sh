#!/usr/bin/env bash
set -euo pipefail

STATUS_FILE=".agent/CURRENT_STATUS.md"

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "no commits")
UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
DATE=$(date '+%Y-%m-%d %H:%M')

PYTHON_BIN=$(command -v python3 || command -v python || true)
if [ -z "$PYTHON_BIN" ]; then
  echo "Missing python3/python. Please install Python to run this script."
  exit 1
fi

BRANCH="$BRANCH" LAST_COMMIT="$LAST_COMMIT" UNCOMMITTED="$UNCOMMITTED" DATE="$DATE" \
"$PYTHON_BIN" - <<'PY'
from __future__ import annotations
import os
import re
from pathlib import Path

path = Path(".agent/CURRENT_STATUS.md")
text = path.read_text() if path.exists() else ""


def parse_sections(source: str):
    sections = []
    matches = list(re.finditer(r"^## (.+)$", source, re.M))
    for idx, match in enumerate(matches):
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(source)
        content = source[start:end].strip("\n")
        sections.append([match.group(1).strip(), content])
    return sections


def update_repo_state(existing: str, branch: str, last_commit: str, uncommitted: str) -> str:
    lines = [line for line in existing.splitlines() if line.strip()]
    filtered = [
        line
        for line in lines
        if not line.strip().startswith(("- Branch:", "- Last commit:", "- Uncommitted changes:"))
    ]
    updated = [
        f"- Branch: `{branch}`",
        f"- Last commit: {last_commit}",
        f"- Uncommitted changes: {uncommitted} files",
    ]
    if filtered:
        updated.extend(filtered)
    return "\n".join(updated).strip()


branch = os.environ.get("BRANCH", "unknown")
last_commit = os.environ.get("LAST_COMMIT", "no commits")
uncommitted = os.environ.get("UNCOMMITTED", "0")
date = os.environ.get("DATE", "unknown")

sections = parse_sections(text)
section_names = [name for name, _ in sections]

if "Repo State" not in section_names:
    sections.insert(0, ["Repo State", ""])
    section_names.insert(0, "Repo State")

if "Recent Actions" not in section_names:
    sections.append(["Recent Actions", "<!-- Agent should update this section -->"])

if "Next Steps" not in section_names:
    sections.append(["Next Steps", "<!-- Agent should update this section -->"])

new_sections = []
for name, content in sections:
    if name == "Repo State":
        content = update_repo_state(content, branch, last_commit, uncommitted)
    if not content.strip():
        content = "<!-- Agent should update this section -->"
    new_sections.append((name, content))

out_lines = ["# Current Status Snapshot", "", f"Last updated: {date}", ""]
for name, content in new_sections:
    out_lines.append(f"## {name}")
    out_lines.append("")
    out_lines.extend(content.splitlines())
    out_lines.append("")

path.write_text("\n".join(out_lines).rstrip() + "\n")
print("Updated .agent/CURRENT_STATUS.md")
PY
