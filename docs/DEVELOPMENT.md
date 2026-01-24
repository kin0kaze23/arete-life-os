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

```bash
cp .env.example .env.local
```

**Important:** `.env.local` must never be committed.
**Note:** AI requests are handled by the server-side `/api/gemini` proxy in production.
During local development, Vite serves a dev proxy at `/api/gemini` using your `.env.local` key.

## 4) Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

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
- `npm run build` completes successfully
