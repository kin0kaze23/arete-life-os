# Development Guide

## 1) Prerequisites

- Node.js 20.x
- npm 9+

## 2) First-time setup

```bash
npm install
```

## 3) Environment variables

1. Copy `.env.example` to `.env.local`
2. Set your `GEMINI_API_KEY`
3. (Optional) Set your `OPENAI_API_KEY` to enable fallback
4. (Optional) Set `OPENAI_MODEL` (default: `gpt-5.1`)
5. (Optional) Set `OPENAI_REASONING_EFFORT` (default: `medium`)
6. (Optional) Set `GEMINI_MODEL_PRO` / `GEMINI_MODEL_FLASH`

```bash
cp .env.example .env.local
```

**Important:** `.env`, `.env.local`, and any `.env.*` files must never be committed.
**Note:** AI requests are handled by the server-side `/api/gemini` proxy in production.
During local development, Vite serves a dev proxy at `/api/gemini` using your `.env.local` key.

## 4) Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (by default http://127.0.0.1:3000).

On first launch, set a passphrase to encrypt local data. This passphrase is never recoverable.

## 5) Quality checks

```bash
npm run doctor
npm run lint
npm run typecheck
npm run test
```

## 6) Build locally (production simulation)

```bash
npm run build
npm run preview
```

## How to verify

- App loads without errors in the browser
- `npm run lint` passes (0 warnings)
- `npm run typecheck` passes
- `npm run test` passes
- `npm run build` completes successfully
