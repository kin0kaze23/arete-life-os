# Claude Code Context

> This file is automatically read by Claude at the start of every session.

## Quick Reference

| Resource          | Location                                               |
| ----------------- | ------------------------------------------------------ |
| Operating Manual  | [.agent/AGENT.md](.agent/AGENT.md)                     |
| Troubleshooting   | [.agent/TROUBLESHOOTING.md](.agent/TROUBLESHOOTING.md) |
| Session Learnings | [.agent/LEARNINGS.md](.agent/LEARNINGS.md)             |
| User Guide        | [guide/README.md](guide/README.md)                     |

## Project Overview

**Areté Life OS** - A production Life OS app with encrypted local vault, AI mentor, and premium dark UI.

- **Stack**: React 19, TypeScript, Vite, Tailwind (CDN)
- **Deployment**: Vercel (auto-deploy from GitHub main branch)
- **AI**: Google Gemini API

## Critical Knowledge (Read Before Acting)

### Deployment

1. **CSP Configuration** - This app uses CDN-loaded dependencies. The `vercel.json` CSP must allow:
   - `connect-src`: cdn.tailwindcss.com, esm.sh, generativelanguage.googleapis.com
   - See [TROUBLESHOOTING.md](.agent/TROUBLESHOOTING.md) for full CSP reference

2. **Git Author Email** - Must use GitHub noreply email for Vercel to recognize commits:

   ```
   198166775+kin0kaze23@users.noreply.github.com
   ```

3. **Vercel Settings** - "Require Verified Commits" should be OFF unless using GPG signing

### Before Every Push

```bash
npm run doctor  # Must pass before pushing
```

### After Issues Are Resolved

**Always document learnings** in [.agent/LEARNINGS.md](.agent/LEARNINGS.md) to prevent repeating mistakes.

## Automation Rules

### What Claude Should Do Automatically

1. **Pre-push**: Run `npm run doctor` before any git push
2. **Post-fix**: Document new learnings in `.agent/LEARNINGS.md`
3. **Deployment issues**: Check [TROUBLESHOOTING.md](.agent/TROUBLESHOOTING.md) first
4. **CI failures**: Check GitHub Actions, fix, and re-push until green

### What Requires User Approval

- Infrastructure changes (CI, deployment config)
- Dependency upgrades
- Large refactors
- Vercel dashboard changes

## Learning Protocol

When resolving any non-trivial issue:

1. **Check existing knowledge** - Read TROUBLESHOOTING.md and LEARNINGS.md first
2. **Solve the issue** - Apply fix
3. **Document the learning** - Add to LEARNINGS.md with:
   - Issue summary
   - Root cause
   - Solution
   - Prevention tips
4. **Update TROUBLESHOOTING.md** if it's a common/recurring issue type

## Session Continuity

To maintain context across sessions:

- Key decisions are documented in `.agent/` files
- Learnings accumulate in `LEARNINGS.md`
- This file (CLAUDE.md) provides instant context on session start

## File Structure

```
.agent/
├── AGENT.md           # Operating manual & protocols
├── TROUBLESHOOTING.md # Common issues & solutions
└── LEARNINGS.md       # Session-by-session discoveries

guide/
├── README.md          # User guide index
├── GETTING_STARTED.md # First-time setup
├── DAILY_USAGE.md     # Daily workflows
├── SECURITY.md        # Data protection guide
└── FAQ.md             # Common questions
```
