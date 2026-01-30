#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/propose-skill.sh --source path/to/notes.md [--name "Skill Name"]
  scripts/propose-skill.sh --stdin --name "Skill Name" < notes.md

Creates a proposed skill draft in ./.agent/skills/ from the provided notes.
USAGE
}

SOURCE=""
NAME=""
USE_STDIN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --source)
      SOURCE="$2"
      shift 2
      ;;
    --name)
      NAME="$2"
      shift 2
      ;;
    --stdin)
      USE_STDIN=1
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

if [ "$USE_STDIN" -eq 1 ]; then
  TMP_FILE=$(mktemp)
  cat > "$TMP_FILE"
  SOURCE="$TMP_FILE"
fi

if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  echo "Missing source notes. Provide --source or use --stdin." >&2
  exit 1
fi

PYTHON_BIN=$(command -v python3 || command -v python || true)
if [ -z "$PYTHON_BIN" ]; then
  echo "Missing python3/python. Please install Python to run this script." >&2
  exit 1
fi

NAME="$NAME" SOURCE="$SOURCE" \
"$PYTHON_BIN" - <<'PY'
from __future__ import annotations
import os
import re
from pathlib import Path

source_path = Path(os.environ.get("SOURCE", ""))
name = os.environ.get("NAME", "").strip()

raw = source_path.read_text()

if not name:
    match = re.search(r"^#\s+(.+)$", raw, re.M)
    if match:
        name = match.group(1).strip()

if not name:
    name = source_path.stem.replace("-", " ").title()

slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "skill"

skills_dir = Path(".agent/skills")
skills_dir.mkdir(parents=True, exist_ok=True)

out_path = skills_dir / f"{slug}.md"
if out_path.exists():
    i = 2
    while (skills_dir / f"{slug}-{i}.md").exists():
        i += 1
    out_path = skills_dir / f"{slug}-{i}.md"

source_label = str(source_path)

template = f"""# {name}

> Status: Proposed (auto-generated). Review and edit before use.

## When to use

- [ ] Define the trigger conditions
- [ ] Describe the problem this skill solves

## Inputs

- [ ] Required context and files
- [ ] Optional context

## Steps

1. [ ] Step 1
2. [ ] Step 2
3. [ ] Step 3

## Output / Checks

- [ ] Expected outcome
- [ ] Verification command(s)

## Source

- {source_label}

## Raw Notes

```
{raw.strip()}
```
"""

out_path.write_text(template)
print(f"Proposed skill created: {out_path}")
PY

if [ "$USE_STDIN" -eq 1 ]; then
  rm -f "$TMP_FILE"
fi
