---
description: Guardrails for UI/UX changes to avoid breaking core loops
---

## UI/UX Change Protocol

Optional fast path:

- `./scripts/run-ui-safe.sh`

1. Run UI change guardrail:
   - `./scripts/ui-change-check.sh`
   - If core/AI/backend files are touched, treat as higher risk.

2. If core/AI/backend files are touched:
   - `./scripts/architecture-drift-check.sh --strict`
   - `./scripts/cost-guardrail.sh`

3. Run quality gate:
   - `npm run doctor`

4. If core loop or navigation is affected, run UI smoke:
   - `./scripts/run-ui-smoke.sh`

5. (Optional) Check performance baseline if layout or bundle size changed:
   - `./scripts/latency-baseline.sh --check` (set baseline once with `--update`)

6. Sanity check core loop invariants:
   - LogBar ingest → daily batch → dashboard render

7. Record any risk notes in `./.agent/CURRENT_STATUS.md`.
