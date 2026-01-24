# Secrets Policy (Strict)

## Rules

1. **Never commit secrets** (API keys, tokens, credentials).
2. **Only store secrets in local `.env.local`** or in the deploy platform’s secret manager.
3. **`.env.local` must remain untracked** (already ignored by `.gitignore`).
4. **Rotate immediately** if a secret is ever pasted into git history or shared publicly.
5. **Vault passphrases are unrecoverable** — store them safely.

## Allowed locations

- Local dev: `.env.local`
- CI/Production: Vercel Environment Variables

**Never expose secrets in the browser bundle.** All AI calls must go through server-side APIs.

## If a secret is exposed

1. **Rotate the key immediately** in the provider dashboard.
2. Update `.env.local` and Vercel env vars.
3. If committed, remove it from git history and force-push (ask for help).

## How to verify

- `git status` should never show `.env.local`
- `git grep -n "GEMINI_API_KEY"` should not reveal real keys
