# Development Guide

## 1) Prerequisites

- Node.js 20.x
- npm 9+

## 2) First-time setup

```bash
nvm use 20 || nvm install 20
npm install
npm run setup:hooks
```

The repo pins Node 20 in `.nvmrc`. Run the `nvm` command above before any local npm, Vite, or test command.
`npm run setup:hooks` installs the local pre-push hook that blocks pushes unless the repo is on Node 20 and `npm run doctor` passes.

## 3) Environment variables

### Option A: Doppler (Recommended)

```bash
# Run with Doppler secrets injection
doppler run --project aretelifeos --config dev -- npm run dev
```

### Option B: Local .env.local file

1. Copy `.env.example` to `.env.local`
2. Set your `GEMINI_API_KEY`
3. (Optional) Set `GEMINI_MODEL_RESEARCH` to a search-grounding-supported Gemini model for event prep grounding (e.g. `gemini-2.5-flash`)

```bash
cp .env.example .env.local
```

**Important:** `.env`, `.env.local`, and any `.env.*` files must never be committed.
**Note:** AI requests are handled by the server-side `/api/gemini` proxy in production.
During local development, Vite serves a dev proxy at `/api/gemini` using your `.env.local` key or Doppler-injected secrets.

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
