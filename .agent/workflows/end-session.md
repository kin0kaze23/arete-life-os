---
description: What to do before ending a coding session
---

## Session End Protocol

1. Run quality gate and **paste the output** (do not just say "it passed"):
   ```bash
   npm run check:standard
   ```
   If any check FAILS → fix and re-run until all pass.

2. Verify at http://localhost:3000 — confirm the UI renders without console errors.

3. Commit all changes: `git add <files> && git commit -m "description"`

4. Update `./.agent/core/CURRENT_STATUS.md` with:
   - What was accomplished
   - What's next
   - Any blockers

5. If non-trivial issues were resolved, append a one-liner to `./.agent/core/LEARNINGS_QUICKREF.md`

6. If major discoveries made, append full entry to `./.agent/core/LEARNINGS.md`
