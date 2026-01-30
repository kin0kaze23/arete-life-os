# Skill: Prompt Flow Optimization (Daily Batch + Cadence Gating)

## When to use

Use this skill when changing AI prompt flow, cadence, or model assignments to reduce cost without degrading quality.

## Core invariants (do not break)

- Logs must be persisted even if AI extraction fails.
- Intake must be schema-safe: Flash‑Lite primary, Pro retry on invalid output.
- Daily batch runs once/day; deep tasks run weekly unless forced.
- Manual refresh must still force a full run.
- AI fallback remains available (OpenAI) if Gemini fails.

## Primary files

- `core/useAura.ts` (cadence gating, daily batch wiring)
- `ai/prompts.ts` (daily batch prompt, compact profile, daily digest)
- `api/gemini.ts` (daily batch action + model fallbacks)
- `api/aiActions/processInput.ts` (Flash‑Lite intake + Pro retry)
- `docs/AI_PROMPT_FLOW.md` (keep in sync)
- `.agent/README.md` + `.agent/CURRENT_STATUS.md`

## Checklist

1. **Cadence gating**
   - `dailyIntelligenceBatch` runs once/day.
   - `generateDeepTasks` runs weekly unless `force` is true.
2. **Intake optimization**
   - Compact profile and reduced memory context for intake.
   - Flash‑Lite primary, Pro retry on invalid output.
3. **Deterministic parsing**
   - Only bypass AI when confidence >= 0.7.
   - Always fallback to AI if uncertain.
4. **Daily plan**
   - Flash primary, Pro fallback.
5. **Docs**
   - Update `docs/AI_PROMPT_FLOW.md` and `.agent/README.md`.
6. **Verification**
   - Run `npm run doctor`.

## Commands

```bash
npm run doctor
```

## Notes

- Keep `AI_USE_ROUTER=0` unless explicitly testing multi‑provider routing.
- Update `.env.local` and `.env.example` together for model defaults.
