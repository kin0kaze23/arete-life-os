---
description: What to do before ending a coding session
---

## Session End Protocol

// turbo

1. Run quality gate: `npm run doctor`

2. Update `./.agent/CURRENT_STATUS.md` with:
   - What was accomplished
   - What's next
   - Any blockers

3. If discoveries made, append to `./.agent/LEARNINGS.md`

// turbo 4. Optional commit: `git add -A && git commit -m "Session end: [summary]"`
