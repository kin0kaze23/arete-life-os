---
description: What to do when starting a new coding session
---

## Session Start Protocol

1. Check current branch: `git branch --show-current`
2. Check uncommitted changes: `git status --short`
3. Read `./.agent/core/CURRENT_STATUS.md` for last session context
4. Read `./.agent/core/DEVELOPMENT_SETUP.md` for tool roles
5. Start dev server: `npm run dev` (always http://localhost:3000)
6. If resuming planned work, open relevant plan in `./.agent/plans/`
   - **Mode 2**: Tell the agent "Implement [plan name]"
   - **Mode 3**: Run `npm run auto -- .agent/plans/<plan>.md`
7. Run quick health check: `npm run typecheck`
