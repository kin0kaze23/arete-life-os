---
description: Guardrails for UI/UX changes to avoid breaking core loops and orphaning components
---

## UI/UX Change Protocol

Optional fast path:

- `./scripts/run-ui-safe.sh`

### Pre-Implementation Checks (BEFORE writing any component)

1. **Verify data sources exist**:
   - Open `core/useAura.ts` and confirm every property the component will use is actually exported
   - If the property doesn't exist → implement it in useAura FIRST
   - If a new type is needed → define it in `data/types.ts` FIRST
   - Run `npm run typecheck` to verify the import resolves

2. Run UI change guardrail:
   - `./scripts/ui-change-check.sh`
   - If core/AI/backend files are touched, treat as higher risk.

### Per-Component Verification (MANDATORY after every component)

3. **Typecheck gate** (Vite build does NOT catch type errors):

   ```bash
   npm run typecheck
   ```

   If this fails, the component is NOT done. Fix all errors before proceeding.

4. **Integration wiring** — the component MUST be:
   - Imported in its parent component (e.g., `DashboardView.tsx`)
   - Rendered with real props from `useAura` (not mock data)
   - Added to the barrel export (`index.ts`) if needed
   - Trace the chain: `App.tsx` → parent → your component. If broken, fix it.

5. **Visual rendering check**:
   - Run `npm run dev`
   - Open the app in browser
   - Confirm the component renders with real data (or a proper empty state)
   - If it shows placeholder text like "Content Here" → NOT done

### Post-Implementation Checks

6. If core/AI/backend files are touched:
   - `./scripts/architecture-drift-check.sh --strict`
   - `./scripts/cost-guardrail.sh`

7. Run quality gate:
   - `npm run check` (which now includes typecheck)

8. If core loop or navigation is affected, run UI smoke:
   - `./scripts/run-ui-smoke.sh`

9. (Optional) Check performance baseline if layout or bundle size changed:
   - `./scripts/latency-baseline.sh --check` (set baseline once with `--update`)

10. Sanity check core loop invariants:
    - LogBar ingest → daily batch → dashboard render

11. Record any risk notes in `./.agent/core/CURRENT_STATUS.md`.

### Common Failures to Avoid

| Failure                                            | Prevention                                         |
| -------------------------------------------------- | -------------------------------------------------- |
| Component references non-existent useAura property | Verify data source exists in useAura before coding |
| Component file exists but is never rendered        | Wire into parent in the same task                  |
| TypeScript errors pass because "build succeeded"   | `npm run typecheck` is the gate, not build         |
| Hardcoded mock data ships as "feature"             | Use real data or empty state, never mock           |
| New types imported but never defined               | Define in `data/types.ts` first                    |
