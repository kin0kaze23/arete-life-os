# Deployment Guide (Vercel)

## Why Vercel

This repo is a Vite + React static web app. Vercel provides zero‑config builds, PR previews, and production deployments.

## 1) Vercel project setup (one-time)

1. Create a new Vercel project from the GitHub repo.
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Install command: `npm install`

## 2) Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

Required AI keys:

- `GEMINI_API_KEY` (primary)
- `OPENAI_API_KEY` (fallback recommended)

Recommended model defaults (cost-optimized):

- `AI_DEFAULT_PROVIDER=gemini`
- `AI_DEFAULT_MODEL=gemini-2.5-flash`
- `AI_FALLBACK_PROVIDER=openai`
- `AI_FALLBACK_MODEL=gpt-4.1-mini`
- `GEMINI_MODEL_PRO=gemini-2.5-pro`
- `GEMINI_MODEL_FLASH=gemini-2.5-flash`
- `GEMINI_MODEL_FLASH_LITE=gemini-2.5-flash-lite`

Per-action routing (optional but recommended):

- `AI_MODEL_PROCESS_INPUT=gemini:gemini-2.5-flash-lite`
- `AI_MODEL_ASK_AURA=gemini:gemini-2.5-flash`
- `AI_MODEL_GENERATE_DEEP_TASKS=gemini:gemini-2.5-pro`

Telegram + sync (required for live Telegram journaling):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_SECRET`

**Do not** add secrets to git or `.env.example`.

The app calls Gemini through a server-side `/api/gemini` proxy so the API key never reaches the browser.

Users must set a local passphrase on first launch to encrypt data stored in the browser.

## 3) Branch deploy behavior

- **Preview deploys:** every pull request automatically
- **Production deploys:** every push to `main`

## 4) Rollback

- In Vercel, go to **Deployments**, select a previous successful deployment, click **Redeploy**.
- Or revert the problematic commit and push to `main`.

## 5) Local reproducibility

```bash
npm run build
npm run preview
```

Ensure the app behaves the same as production.

## How to verify (production)

- A PR creates a Preview URL in Vercel
- Merging PR into `main` creates/updates the Production URL
- Production site loads and functions normally
- `GET /api/health` returns `200` with service status JSON
- In app, `Settings -> System Health` shows expected readiness states for AI, Telegram, Cloud Sync, and Blob Storage
- Run `./scripts/run-prod-smoke.sh` to validate live AI endpoints (`health`, `askAura`, `processInput`)
- Confirm `services.telegram.configured` is `true` in `/api/health` before testing Telegram bot flows
