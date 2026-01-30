---
description: What to do when starting a new coding session
---

## Session Start Protocol

// turbo

1. Check current branch: `git branch --show-current`

// turbo 2. Check uncommitted changes: `git status --short`

3. Read `./.agent/CURRENT_STATUS.md` for last session context

4. If resuming planned work, open relevant plan in `./.agent/plans/`

5. Refresh status snapshot: `./scripts/update-status.sh`
