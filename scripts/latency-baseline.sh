#!/usr/bin/env bash
set -euo pipefail

MODE=""
THRESHOLD="0.15"
BUILD=0

usage() {
  cat <<'USAGE'
Usage: scripts/latency-baseline.sh --update|--check [--threshold 0.15] [--build]

Tracks a simple performance proxy using bundle sizes in dist/assets.
- --update: write baseline to .agent/metrics/latency-baseline.json
- --check: compare current bundle sizes to baseline
- --build: run npm run build before measuring
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --update)
      MODE="update"
      shift 1
      ;;
    --check)
      MODE="check"
      shift 1
      ;;
    --threshold)
      THRESHOLD="$2"
      shift 2
      ;;
    --build)
      BUILD=1
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

if [ -z "$MODE" ]; then
  usage
  exit 1
fi

if [ "$BUILD" -eq 1 ]; then
  npm run build
fi

PYTHON_BIN=$(command -v python3 || command -v python || true)
if [ -z "$PYTHON_BIN" ]; then
  echo "Missing python3/python. Please install Python to run this script." >&2
  exit 1
fi

MODE="$MODE" THRESHOLD="$THRESHOLD" \
"$PYTHON_BIN" - <<'PY'
from __future__ import annotations
import json
import os
from datetime import date
from pathlib import Path
import sys

mode = os.environ.get("MODE")
threshold = float(os.environ.get("THRESHOLD", "0.15"))

assets_dir = Path("dist") / "assets"
if not assets_dir.exists():
    print("dist/assets not found. Run a build or pass --build.")
    sys.exit(1)

files = [p for p in assets_dir.glob("*.js") if not p.name.endswith(".map")]
if not files:
    print("No JS assets found in dist/assets.")
    sys.exit(1)

sizes = [p.stat().st_size for p in files]
metrics = {
    "updated": date.today().isoformat(),
    "totalJsKb": round(sum(sizes) / 1024.0, 1),
    "largestJsKb": round(max(sizes) / 1024.0, 1),
    "fileCount": len(files),
}

baseline_path = Path(".agent/metrics/latency-baseline.json")

if mode == "update":
    baseline_path.parent.mkdir(parents=True, exist_ok=True)
    baseline_path.write_text(json.dumps(metrics, indent=2))
    print(f"Baseline updated: {baseline_path}")
    print(metrics)
    sys.exit(0)

if mode == "check":
    if not baseline_path.exists():
        print("Baseline not found. Run with --update first.")
        sys.exit(1)
    baseline = json.loads(baseline_path.read_text())
    total_ok = metrics["totalJsKb"] <= baseline["totalJsKb"] * (1 + threshold)
    largest_ok = metrics["largestJsKb"] <= baseline["largestJsKb"] * (1 + threshold)
    if total_ok and largest_ok:
        print("Latency baseline check passed.")
        print(metrics)
        sys.exit(0)
    print("Latency baseline check failed.")
    print("Baseline:", baseline)
    print("Current:", metrics)
    sys.exit(2)

print("Unknown mode.")
sys.exit(1)
PY
