# Agent Operating Manual

## Mission

Ship a production-ready Life OS app with stable core loops, premium dark UI, and reliable deployment.

## Session Init (Fast)

Start with `./.agent/README.md` for the current context index and quick start.

## Current Core Loop Status

- Log Bar writes are atomic: KG write succeeds even if AI extraction fails (needsReview set).
- Files are stored local-first in IndexedDB and referenced via `Source.storageKey`.
- Finance metrics are derived on each log and stored as a `finance_metrics` MemoryItem.
- Habit signals are classified into `Category.HABIT` with structured metadata.
- Dashboard auto-refreshes after log ingestion to keep Do/Watch current.
- Evening Audit appears as a small Log Bar reminder (no large dashboard card).

## Guardrails

- main is always green and deployable
- no secrets in git
- minimal changes, iterative
- tests/build must pass before merge

## AI Runtime Configuration (Server-side)

Set these in Vercel (Production + Preview as needed):

- `GEMINI_API_KEY`
- `GEMINI_MODEL_PRO` (default: `gemini-3-pro-preview`)
- `GEMINI_MODEL_FLASH` (default: `gemini-3-flash-preview`)
- `OPENAI_API_KEY` (fallback)
- `OPENAI_MODEL` (default: `gpt-5.1`)
- `OPENAI_REASONING_EFFORT` (default: `medium`)

Notes:

- Gemini is primary; OpenAI is automatic fallback.
- Keys must remain server-side only (never in client code).

## Definition of Done (for any task)

- UI has empty/loading/error states
- state updates are reactive; no manual refresh
- edge cases considered
- lint/typecheck/build pass
- PR includes verification steps

## Working Protocol (Non-Developer Friendly)

### 1) How to ask for work

Provide:

- Goal: what you want to achieve (feature, fix, deploy)
- Context: which screen or flow is affected
- Constraints: "minimal change", "no refactor", "keep UI the same", etc.
- Evidence: copy/paste exact error logs or screenshots

### 2) What I will do each iteration

- Summarize what changed and why
- Give exactly one verification command (prefer `npm run doctor`)
- Explain what success looks like

### 2.5) Autopilot (when you say "do all the things")

When you ask me to take over routine workflow, I will:

- Check `git status` and summarize changes
- Run `npm run doctor` before any push
- Commit with a clear message
- Push to `main` if checks pass

I will still ask for approval before:

- Infra changes (CI, deployment, hosting, env policy)
- Refactors or large structure changes
- Dependency upgrades

If a git commit fails due to local filesystem permissions (e.g., `.git/index.lock`), I will
report it and ask you to run the commit/push manually in your terminal.

### 3) When I need your approval

I will wait for approval before:

- Infra changes (CI, deployment, hosting, env policy)
- Refactors or large structure changes
- Dependency upgrades

### 4) How to report issues (template)

Use this format:

```
Issue summary:
Steps taken:
Expected:
Actual:
Logs:
```

### 5) Default verification

- Preferred command: `npm run doctor`
- If it fails, paste the full output and I will fix it

### 6) Deployment flow (high level)

- Run `npm run doctor`
- Confirm CI green on PR
- Merge to main
- Verify Vercel deployment
- If deployment issues occur, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 7) Safety and secrets

- Never paste real API keys into chat
- Keep `.env.local` untracked

## GitHub Automation Rules (Always Enforced)

### Pre-push checklist (required)

- Run `npm run doctor`
- Ensure Git status is clean

### Post-push verification (required)

- Check GitHub Actions for the latest `main` run and confirm it is green
- If any failure is detected, fix it immediately and re-run CI

### Automation I will perform

- Commit changes with clear messages
- Push to `main` only after local `npm run doctor` passes
- Re-run failed CI jobs and apply fixes until green

### Git Hooks (Automated Quality Gates)

Pre-push hook automatically runs `npm run doctor` before each push.

**Setup (run once after cloning):**

```bash
./scripts/setup-hooks.sh
```

### Suggested improvements (optional)

- Set branch protection to require CI passing before merge

## Related Documentation

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions (CSP, Vercel deployment, git config)
- [LEARNINGS.md](./LEARNINGS.md) - Session-by-session discoveries and resolved issues
- [../CLAUDE.md](../CLAUDE.md) - Quick reference loaded at session start
