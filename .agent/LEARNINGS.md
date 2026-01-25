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

## 2026-01-25: Security Audit & Hardening

### Issue

User wanted to ensure the app was secure for storing sensitive personal data before daily use.

### Findings (Positive)

1. **Encryption implementation is solid**
   - AES-256-GCM with PBKDF2 (100,000 iterations)
   - Random salt (16 bytes) and IV (12 bytes) per operation
   - Key held only in memory, never persisted

2. **API key properly secured**
   - `.env.local` correctly gitignored via `*.local` pattern
   - API key accessed server-side only (`process.env.GEMINI_API_KEY`)
   - No secrets in git history

3. **Session security**
   - 15-minute inactivity auto-lock
   - Key wiped from memory on lock

### Issues Fixed

1. **VoiceAdvisor.tsx wrong env var**
   - Used `process.env.API_KEY` instead of `process.env.GEMINI_API_KEY`
   - Fix: Updated to correct env var name

2. **No passphrase strength enforcement**
   - Users could create weak passphrases
   - Fix: Added minimum 8 chars + strength meter requiring "Fair" or better

3. **Missing user security documentation**
   - No guidance on backup strategy, data persistence
   - Fix: Added comprehensive `guide/SECURITY.md`

### Key Learnings

- **CDN architecture requires proper CSP** - already documented from earlier session
- **Passphrase is single point of failure** - no recovery if forgotten
- **localStorage is browser-specific** - data doesn't sync, export backups critical
- **VoiceAdvisor feature was silently broken** - wrong env var meant it would fail in prod

### Prevention

- Security architecture documented in `guide/SECURITY.md`
- Passphrase strength now enforced in UI
- User guide created for backup best practices

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
