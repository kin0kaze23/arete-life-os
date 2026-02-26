# Areté Life OS — Claude Code Instructions

> Auto-loaded on every session in this project. These rules override default behaviour. Follow exactly.

---

## Identity

Areté is a **local-first Life OS** — private by design, intelligent by default.
Three-column execution dashboard + encrypted knowledge vault + AI mentor (Aura) + Telegram inbox.
Data lives in encrypted IndexedDB. Supabase is the multi-device sync layer only.

---

## Architecture

```
React 19 + Vite 6 + TypeScript
  └── Feature-based folders at repo root (NO src/ directory)
  └── @/ path alias → repo root

Vercel serverless backend
  └── api/           ← Node.js 22 runtime (@vercel/node), NOT edge runtime
  └── api/_modelRouter.ts  ← AI provider + model routing (canonical)
  └── api/ai.ts      ← Main AI action handler

Storage layers:
  1. IndexedDB (encrypted)  ← primary vault, local-first
  2. Supabase Postgres       ← multi-device sync (tables: user_profiles, vault_entries,
                                inbox_entries, telegram_bindings, dimension_snapshots)
  3. Vercel Blob             ← file storage (@vercel/blob)
```

---

## Folder Map

| Folder | Purpose |
|--------|---------|
| `core/` | State + orchestration — `useAura.ts` is the main ingestion hook |
| `ai/` | Model orchestration — `geminiService.ts` holds DEFAULT_PROMPTS |
| `api/` | Vercel serverless handlers |
| `api/_providers/` | Provider adapters: gemini, openai, anthropic, openai-compatible |
| `data/` | Data models + IndexedDB storage — `fileStore.ts` for blob storage |
| `dashboard/` | Three-column dashboard views |
| `vault/` | Knowledge Graph + Vault UI |
| `stream/` | Life Stream timeline / history / audit |
| `command/` | Log Bar + command palette + router |
| `chat/` | Chat + Aura advisor UI |
| `settings/` | Settings, prompts, rule of life editor |
| `onboarding/` | First-run flow |
| `shared/` | Cross-cutting UI components + design tokens |
| `layout/` | Header, Sidebar |

**Barrel imports:** `dashboard/index.ts`, `shared/index.ts` etc. — use barrels, not deep paths.

---

## Supabase Schema (multi-device sync)

File: `docs/supabase/001_multi_device_journaling.sql`

| Table | Purpose |
|-------|---------|
| `user_profiles` | Display name, vault salt, timezone, Telegram link token |
| `vault_entries` | Encrypted vault items (memory/claim/task/event/goal/etc.) |
| `inbox_entries` | Telegram + other incoming content (pending AI merge) |
| `telegram_bindings` | Telegram chat ↔ user account bindings |
| `dimension_snapshots` | Periodic life dimension score snapshots |

All tables have **RLS enabled** — `auth.uid() = user_id` policies.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 6 |
| Language | TypeScript (target ES2022, `bundler` module resolution) |
| Backend | Vercel serverless Node.js 22 (`@vercel/node` ^5.6.6) |
| Storage | IndexedDB (encrypted) + Supabase JS v2 + Vercel Blob |
| AI primary | Gemini 2.5 (pro / flash / flash-lite) via `@google/genai` |
| AI fallback | OpenAI gpt-4.1 via `openai` SDK |
| AI chat (Aura) | xAI Grok-3 |
| AI routing | `api/_modelRouter.ts` — format: `PROVIDER:MODEL` per action |
| UI | Tailwind **v4** (Vite) + Framer Motion + Lucide React |
| Testing | Playwright E2E only (no unit tests yet) |
| Lint / Format | ESLint + Prettier (`eslint --max-warnings=0`) |
| Port | **3000** (strict) |

---

## AI Model Router

All AI model assignments live in env vars — format `PROVIDER:MODEL`:

```
AI_MODEL_PROCESS_INPUT=gemini:gemini-2.5-flash-lite
AI_MODEL_ASK_AURA=xai:grok-3
AI_MODEL_GENERATE_INSIGHTS=gemini:gemini-2.5-pro
AI_MODEL_GENERATE_DAILY_PLAN=gemini:gemini-2.5-flash
# etc — see .env.example for full list
```

**Never hardcode model names in components or API handlers.** All routing goes through `api/_modelRouter.ts`.

---

## Key Files

| File | Role |
|------|------|
| `core/useAura.ts` | Main orchestration hook — memory ingestion → KG write |
| `data/fileStore.ts` | IndexedDB blob storage (no base64 at rest) |
| `api/_modelRouter.ts` | Canonical AI provider + model selection |
| `api/ai.ts` | Main AI serverless entry point (`handleAIAction`) |
| `ai/geminiService.ts` | Prompt templates (`DEFAULT_PROMPTS`), editable in-app |
| `api/telegram/webhook.ts` | Telegram bot webhook handler |
| `vercel.json` | Security headers (CSP, HSTS) — security-critical |
| `vite.config.ts` | Dev proxy for `/api/ai`, 2MB payload limit, `@/` alias |

---

## Current State (as of 2026-02-25)

- **Phases 1–3:** Complete
- **Pending:** Supabase project config + Telegram webhook registration
- **Branch:** `feature/ui-ux-enhancements` — 139 pending changes
- **Supabase schema:** Ready in `docs/supabase/001_multi_device_journaling.sql` — not yet applied to project
- **Blockers:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` must be set before Supabase features work

---

## Commands

```bash
npm run dev        # Dev server → localhost:3000 (strict port)
npm run lint       # ESLint — 0 warnings policy (all warnings = errors)
npm run typecheck  # tsc --noEmit
npm run build      # Vite production build
npm run test:e2e   # Playwright E2E tests
npm run doctor     # scripts/doctor.sh — system health check
npm run format     # Prettier write
```

---

## Non-Negotiable Rules

1. **Never send unencrypted vault data to any server** — local-first encryption is the core promise
2. **VITE_ prefix required for any client-accessible env var** — server-only vars (GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY etc.) must NOT have `VITE_` prefix
3. **Serverless = Node.js runtime, NOT edge** — `@vercel/node` handles api/; do not use edge-only APIs
4. **2MB payload limit** in vite.config.ts dev proxy — respect this in serverless handlers too
5. **vercel.json CSP headers are security-critical** — never add `*` domains or `unsafe-eval`
6. **AI model changes go through `api/_modelRouter.ts`** — never hardcode model names elsewhere
7. **Supabase is sync layer only** — primary data path is always IndexedDB; Supabase is secondary

---

## Gotchas

- **Feature folders, NOT src/** — `@/` alias resolves to repo root, not `@/src/`
- **ESLint config is `.eslintrc.cjs`** (CommonJS) even though the project is `"type": "module"` — this is intentional
- **Dev proxy is vite middleware** — `/api/ai` routes to local handler in dev; in production it's a real Vercel serverless function
- **Two sets of Supabase env vars:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (browser) AND `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server) — both required
- **`SUPABASE_ACCESS_TOKEN`** (used by the Supabase MCP) is a **personal access token** from `dashboard.supabase.com → Account → Access Tokens` — it is NOT the service role key
- **Tailwind v4** — unlike ClearPathOS which uses v3; use v4 syntax here

---

## Canonical Docs

| Working on... | Read first |
|---------------|-----------|
| Architecture | `docs/ARCHITECTURE.md` (25KB — comprehensive) |
| AI prompt flow | `docs/AI_PROMPT_FLOW.md` (24KB) |
| Data model | `docs/DATA_MODEL.md` |
| Log Bar | `docs/LOG_BAR_SPEC.md` + `docs/LOG_BAR_PIPELINE.md` |
| Dashboard layout | `docs/DASHBOARD_SPEC.md` |
| Design system | `docs/DESIGN_SYSTEM_DARK.md` |
| Supabase schema | `docs/supabase/001_multi_device_journaling.sql` |
| Deployment | `docs/DEPLOYMENT.md` |
| Product vision | `docs/PRODUCT_NORTH_STAR.md` + `docs/PRD.md` |

---

## Global Agent System

Part of the multi-repo portfolio managed by `../../.agent/`.
Global rules: `../../.agent/MASTER.md` · Phases: `../../.agent/ORCHESTRATION.md`
For UI work: load `../../.agent/skills/design-system.md` (master router).
