# Session Learnings

Chronological log of issues resolved and knowledge gained. Claude should append to this file after resolving non-trivial issues.

---

## 2026-01-25: Vercel Deployment & CSP Fix

### Issue

UI completely broken on Vercel production - app rendered but without any Tailwind CSS styling.

### Root Causes (Multiple)

1. **CSP `connect-src` too restrictive**
   - `vercel.json` had `connect-src 'self'`
   - Tailwind CDN needs to make network requests for runtime CSS compilation
   - Fix: Added `https://cdn.tailwindcss.com https://esm.sh https://generativelanguage.googleapis.com`

2. **Vercel not auto-deploying**
   - "Require Verified Commits" was enabled but commits weren't GPG-signed
   - Git author email didn't match GitHub account
   - Fix: Disabled verified commits requirement, configured GitHub noreply email

3. **Git author email mismatch**
   - Local git config used personal email not linked to GitHub
   - Vercel check failed: "No GitHub account was found matching the commit author email"
   - Fix: `git config user.email "198166775+kin0kaze23@users.noreply.github.com"`

### Key Learnings

- **Always check CSP first** when external resources fail to load in production
- **Vercel silently ignores** commits that don't meet its verification requirements
- **Use GitHub noreply email** to ensure commit attribution works with Vercel
- **Browser DevTools Console** shows CSP violations - check there first for styling issues

### Prevention

- CSP configuration documented in TROUBLESHOOTING.md
- Git email configured globally with GitHub noreply format
- Vercel "Require Verified Commits" disabled

### Time to Resolution

~45 minutes (would be <5 minutes with this documentation)

---

## Template for Future Entries

```markdown
## YYYY-MM-DD: Brief Title

### Issue

[What went wrong]

### Root Cause

[Why it happened]

### Solution

[What fixed it]

### Key Learnings

[What to remember]

### Prevention

[How to avoid in future]
```
