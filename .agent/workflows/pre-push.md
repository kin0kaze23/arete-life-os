---
description: Quality gate before pushing to remote
---

## Pre-Push Checklist

// turbo-all

1. Run: `npm run doctor`
2. Run: `git status` (should be clean)
3. Run: `git log -1 --oneline` (verify commit message)
4. Push: `git push origin HEAD`

Notes:

- If UI/UX changes: `./scripts/run-ui-safe.sh`
- If core/AI/backend changes: `./scripts/architecture-drift-check.sh --strict` and `./scripts/cost-guardrail.sh`
