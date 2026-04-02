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

Set these in **Vercel → Project → Settings → Environment Variables**:

- `GEMINI_API_KEY` = your Gemini API key
- `OPENAI_API_KEY` = your OpenAI API key (optional fallback)
- `OPENAI_MODEL` = OpenAI model name (optional, default: `gpt-5.1`)
- `OPENAI_REASONING_EFFORT` = OpenAI reasoning effort (optional, default: `medium`)
- `GEMINI_MODEL_PRO` = Gemini pro model name (optional, default: `gemini-3-pro-preview`)
- `GEMINI_MODEL_FLASH` = Gemini flash model name (optional, default: `gemini-3-flash-preview`)

**Do not** add secrets to git or `.env.example`.

The app calls Gemini through a server-side `/api/gemini` proxy so the API key never reaches the browser.

Users must set a local passphrase on first launch to encrypt data stored in the browser.

## 3) Branch deploy behavior

- **Local development:** your machine only. Use `npm run dev`.
- **Preview deploys:** every pull request automatically. Treat these as staging/QA.
- **Production deploys:** every push to `main`
- **Do not** deploy production from a dirty local working tree. Land reviewed changes in GitHub first.
- If a preview deployment has been fully verified, you can promote it in Vercel instead of rebuilding production.

## 3.1) Source-of-truth policy

- `main` is the only production branch.
- GitHub is the source of truth for what is in production.
- `.vercel/project.json` is local machine metadata and should not be committed.
- If you need a persistent shared staging environment later, add a dedicated `staging` branch and map it to a non-production Vercel environment. Until then, PR previews are enough.

## 4) Rollback

- In Vercel, go to **Deployments**, select a previous successful deployment, click **Redeploy**.
- Or revert the problematic commit and push to `main`.

## 5) Local reproducibility

```bash
npm run build
npm run preview
```

Ensure the app behaves the same as production.

## 6) First-time local Vercel link

```bash
vercel link
```

This creates a local `.vercel/project.json` file for your machine. Keep it untracked.

## How to verify

- A PR creates a Preview URL in Vercel
- Merging PR into `main` creates/updates the Production URL
- Production site loads and functions normally
