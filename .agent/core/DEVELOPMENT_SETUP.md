# Development Setup & Tool Strategy

## Local Dev

```bash
npm run dev          # Always http://localhost:3000 (strictPort)
npm run typecheck    # TypeScript gate (MUST pass before commit)
npm run check        # Fast quality (typecheck + lint + build)
npm run check:full   # Full quality (all checks)
```

## Tool Roles

This project is developed across multiple AI-assisted environments. Each has a specific role to avoid overlap and credit waste.

### Primary: Anti-Gravity (Gemini 3 Pro/Flash)

- **Use for**: All day-to-day development — features, fixes, refactors, styling
- **Why primary**: Highest usage limits, agentic (reads .agent/ skills + workflows natively), sustainable for full sessions
- **Reads automatically**: .agent/core/AGENT.md, .agent/skills/_, .agent/workflows/_
- **Quality gate**: Always run `npm run typecheck` after changes

### Secondary: Cursor + Codex (GPT 5.2)

- **Use for**: When Anti-Gravity fails after 2 attempts on a task, complex refactors, quick inline edits
- **Why secondary**: Strong code generation but lower credit limits than Anti-Gravity
- **Note**: Does NOT auto-read .agent/ files. Reference them explicitly when needed.

### Reserve: Cursor + Claude (Opus 4.5 / Sonnet 4.5)

- **Use for**: Architecture planning, writing .agent/plans/, debugging hard problems, improving .agent/ infrastructure
- **Why reserve**: Best reasoning quality but lowest usage limits. Use for highest-leverage decisions only.
- **Note**: Does NOT auto-read .agent/ files. Reference them explicitly when needed.

## Sync Protocol

Git is the single source of truth. All tools read the same filesystem.

**Rule: Commit before switching tools.**

1. Finish your current change in Tool A
2. Run `npm run typecheck` to verify
3. Commit: `git add -A && git commit -m "description"`
4. Switch to Tool B — it sees the latest state

## Session Flow

```
1. Open Anti-Gravity (primary)
2. Run `npm run dev` → test at http://localhost:3000
3. Develop features/fixes (Anti-Gravity handles most work)
4. Test at :3000 after each change
5. If stuck → switch to Codex (secondary) or Claude (reserve)
6. Commit before switching
7. When ready → npm run check:full → push → deploy
```

## When to Use Claude (Reserve)

Save Claude credits for these high-leverage tasks:

- Writing and evaluating plans in .agent/plans/
- Debugging issues other tools can't resolve
- Architecture decisions (new data models, state management changes)
- Improving the .agent/ infrastructure (skills, workflows, scripts)
- Code review before production push

## File Paths (No src/ Prefix)

All paths are from repo root:

- Components: `dashboard/*.tsx`, `stream/*.tsx`, `vault/*.tsx`, `settings/*.tsx`, `shared/*.tsx`
- Types: `data/types.ts`, `data/index.ts`
- State: `core/useAura.ts`
- App shell: `app/App.tsx`
- Config: `vite.config.ts`, `package.json`
