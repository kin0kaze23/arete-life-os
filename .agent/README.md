# Agent Context Index

Keep this folder as the single source of truth for agent setup, workflows, and learnings.
This file is intentionally short for fast session initialization.

## Read Order (Session Init, ~2 min)

1. `./.agent/README.md` (this file)
2. `./.agent/CURRENT_STATUS.md` (latest snapshot)
3. `./.agent/AGENT.md` (protocols + automation rules)
4. `./.agent/TROUBLESHOOTING.md` (known issues + fixes)
5. `./.agent/LEARNINGS.md` (latest resolved issues)

## Quick Start Checklist

- Check repo status: `git status -sb`
- Run verification: `npm run doctor`
- If prod issue: check Vercel logs for `[gemini-...]` error id
- After fixing non-trivial issues: update `LEARNINGS.md`
- If issue is recurring: update `TROUBLESHOOTING.md`
- If commit fails due to local permissions, commit/push manually in terminal

## AI Runtime (Server-Side Only)

Set these in Vercel (Production + Preview as needed):

- `GEMINI_API_KEY`
- `GEMINI_MODEL_PRO` (default: `gemini-3-pro-preview`)
- `GEMINI_MODEL_FLASH` (default: `gemini-3-flash-preview`)
- `OPENAI_API_KEY` (fallback)
- `OPENAI_MODEL` (default: `gpt-5.1`)
- `OPENAI_REASONING_EFFORT` (default: `medium`)

Notes:

- Gemini is primary; OpenAI is automatic fallback.
- Never expose keys to the browser (no `VITE_` prefix).

## Automation (Autopilot)

If you ask “do all the things,” I will:

- Inspect `git status`
- Run `npm run doctor`
- Commit with a clear message
- Push to `main` if checks pass

## Minimal Troubleshooting Flow

1. Read `.agent/TROUBLESHOOTING.md`
2. Check Vercel logs for error id payloads
3. Fix root cause
4. Document in `.agent/LEARNINGS.md`
