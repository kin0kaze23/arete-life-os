#!/usr/bin/env bash
set -euo pipefail

LEARNINGS_FILE=".agent/LEARNINGS.md"
QUICKREF_FILE=".agent/LEARNINGS_QUICKREF.md"
ARCHIVE_DIR=".agent/archive"
LINE_LIMIT=600
KEEP_RECENT=30

if [ ! -f "$LEARNINGS_FILE" ]; then
  echo "Missing $LEARNINGS_FILE"
  exit 1
fi

PYTHON_BIN=$(command -v python3 || command -v python || true)
if [ -z "$PYTHON_BIN" ]; then
  echo "Missing python3/python. Please install Python to run this script."
  exit 1
fi

LEARNINGS_FILE="$LEARNINGS_FILE" QUICKREF_FILE="$QUICKREF_FILE" ARCHIVE_DIR="$ARCHIVE_DIR" \
LINE_LIMIT="$LINE_LIMIT" KEEP_RECENT="$KEEP_RECENT" \
"$PYTHON_BIN" - <<'PY'
from __future__ import annotations
from datetime import date, datetime, timedelta
from pathlib import Path
import re
import os

learnings_path = Path(os.environ.get("LEARNINGS_FILE", ".agent/LEARNINGS.md"))
quickref_path = Path(os.environ.get("QUICKREF_FILE", ".agent/LEARNINGS_QUICKREF.md"))
archive_dir = Path(os.environ.get("ARCHIVE_DIR", ".agent/archive"))
line_limit = int(os.environ.get("LINE_LIMIT", "600"))
keep_recent = int(os.environ.get("KEEP_RECENT", "30"))

text = learnings_path.read_text()
line_count = len(text.splitlines())

entry_header = re.compile(r"^## (\d{4}-\d{2}-\d{2}):.*$", re.M)
match = entry_header.search(text)
if not match:
    print("No dated entries found. Skipping archive.")
else:
    header = text[: match.start()].rstrip() + "\n\n"

    entries = []
    matches = list(entry_header.finditer(text))
    for idx, m in enumerate(matches):
        start = m.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        entry_text = text[start:end].strip() + "\n\n"
        entry_date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
        entries.append((entry_date, entry_text))

    entries_sorted = sorted(entries, key=lambda x: x[0])
    keep_set = set(entries_sorted[-keep_recent:]) if entries_sorted else set()
    cutoff = date.today() - timedelta(days=90)

    to_archive = [e for e in entries_sorted if e not in keep_set and e[0] < cutoff]
    kept = [e for e in entries_sorted if e in keep_set or e[0] >= cutoff]

    if line_count > line_limit and to_archive:
        archive_dir.mkdir(parents=True, exist_ok=True)
        for entry_date, entry_text in to_archive:
            year = entry_date.year
            quarter = ((entry_date.month - 1) // 3) + 1
            archive_file = archive_dir / f"learnings-{year}-q{quarter}.md"
            if not archive_file.exists():
                archive_file.write_text(f"# Learnings Archive — {year} Q{quarter}\n\n")
            with archive_file.open("a") as f:
                f.write(entry_text)
        # Rebuild learnings file with kept entries
        rebuilt = header + "".join([e[1] for e in kept]).rstrip() + "\n"
        learnings_path.write_text(rebuilt)
        print(f"Archived {len(to_archive)} entries; kept {len(kept)}.")
    else:
        print("No archiving needed.")

    # Regenerate quickref from current learnings file
    current_text = learnings_path.read_text()
    matches = list(entry_header.finditer(current_text))
    entries = []
    for idx, m in enumerate(matches):
        start = m.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(current_text)
        entry_text = current_text[start:end].strip()
        entry_date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
        entries.append((entry_date, entry_text))

    bullets = []
    for entry_date, entry_text in sorted(entries, key=lambda x: x[0], reverse=True):
        key_section = re.search(r"^### Key Learnings\s*$", entry_text, re.M)
        if key_section:
            segment = entry_text[key_section.end():]
            next_section = re.search(r"^### ", segment, re.M)
            if next_section:
                segment = segment[: next_section.start()]
            for line in segment.splitlines():
                line = line.strip()
                if line.startswith("- "):
                    bullets.append(f"[{entry_date}] {line[2:].strip()}")
                    if len(bullets) >= 20:
                        break
        if len(bullets) >= 20:
            break

    if not bullets:
        for entry_date, entry_text in sorted(entries, key=lambda x: x[0], reverse=True)[:20]:
            heading = entry_text.splitlines()[0].strip()
            bullets.append(f"[{entry_date}] {heading.replace('## ', '').strip()}")

    quickref = "# Learnings Quickref\n\n"
    quickref += f"Updated: {date.today().isoformat()}\n\n"
    for item in bullets[:20]:
        quickref += f"- {item}\n"

    quickref_path.write_text(quickref)
PY
