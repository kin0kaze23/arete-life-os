# Secrets Policy (Strict)

## Rules

1. **Never commit secrets** (API keys, tokens, credentials).
2. **Only store secrets in local `.env*` files** or in the deploy platform’s secret manager.
3. **`.env`, `.env.local`, and `.env.*` must remain untracked** (except `.env.example`).
4. **Rotate immediately** if a secret is ever pasted into git history or shared publicly.
5. **Vault passphrases are unrecoverable** — store them safely.

## Allowed locations

- Local dev: `.env.local` or another ignored `.env.*` file
- CI/Production: Vercel Environment Variables

**Never expose secrets in the browser bundle.** All AI calls must go through server-side APIs.

## If a secret is exposed

1. **Rotate the key immediately** in the provider dashboard.
2. Update `.env.local` and Vercel env vars.
3. If committed, remove it from git history and force-push (ask for help).

## How to verify

- `git status` should never show `.env`, `.env.local`, or `.env.doppler`
- `git grep -n "GEMINI_API_KEY"` should not reveal real keys
- `git grep -n "OPENAI_API_KEY"` should not reveal real keys
