#!/usr/bin/env bash
set -euo pipefail

echo "==> format:check"
npm run format:check

echo "==> lint"
npm run lint

echo "==> typecheck"
npm run typecheck

echo "==> test"
npm run test

echo "==> build"
npm run build
