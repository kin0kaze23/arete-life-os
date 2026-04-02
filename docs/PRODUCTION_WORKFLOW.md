# Production Workflow Guide — AreteLifeOS

> The correct flow for production fixes and feature deployments.

## Core Model

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────┐
│ Local Dev   │  →   │ PR Branch    │  →   │ Vercel      │  →   │ Production  │
│ (feature)   │      │ (feature)    │      │ Preview     │      │ (main)      │
│             │      │              │      │ (staging)   │      │             │
└─────────────┘      └──────────────┘      └─────────────┘      └─────────────┘
     │                      │                     │                    │
     │                      │                     │                    │
  npm run              git push               Auto-deploy         Git merge or
  doctor               origin/branch        on PR creation        Vercel promote
```

## Environment Model

| Environment    | Source                         | How to deploy               |
| -------------- | ------------------------------ | --------------------------- |
| **Local**      | Feature branch on your machine | `npm run dev`               |
| **Staging/QA** | Vercel Preview                 | Auto-deployed on PR         |
| **Production** | `main` branch                  | Merge PR or promote preview |

---

## Workflow A: New Feature or Fix

### Step 1: Setup

```bash
cd /Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS
nvm use 20
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Step 2: Make changes

```bash
# Make your code changes
# Then run verification
npm run doctor
```

### Step 3: Push and create PR

```bash
git add .
git commit -m "feat: your change description"
git push -u origin feature/your-feature-name
# Then create PR on GitHub
```

### Step 4: Verify Vercel Preview

1. Vercel auto-deploys a preview URL for your PR
2. Test all affected flows
3. Share preview URL with team for QA

### Step 5: Merge to main

After preview QA passes:

1. Get PR approval
2. Merge via GitHub (squash merge recommended)
3. Vercel deploys production from `main`

---

## Workflow B: Hotfix from Production

When a bug is found in production:

### Step 1: Reproduce locally

```bash
cd /Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS
git checkout main
git pull origin main
# Reproduce the bug locally
```

### Step 2: Create hotfix branch

```bash
git checkout -b hotfix/fix-description
```

### Step 3: Fix and verify

```bash
# Make the fix
npm run doctor
# Verify fix works locally
```

### Step 4: Push and PR

```bash
git add .
git commit -m "fix: describe the fix"
git push -u origin hotfix/fix-description
# Create PR with [HOTFIX] prefix in title
```

### Step 5: Fast-track QA

1. Test on Vercel Preview URL
2. Get quick approval
3. Merge to `main`
4. Vercel deploys production

### Step 6: Post-mortem (if needed)

For significant bugs:

1. Document root cause
2. Add test to prevent regression
3. Update runbook if process gap

---

## Workflow C: Rollback

If production has issues:

### Option 1: Vercel Redeploy (fastest)

1. Go to Vercel Dashboard → AreteLifeOS
2. Find last known good deployment
3. Click "Redeploy"
4. Production rolls back in ~60 seconds

### Option 2: Git Revert (permanent)

```bash
git checkout main
git pull origin main
git revert <bad-commit-hash>
git push origin main
# Vercel auto-deploys the revert
```

---

## Key Commands

### Local Development

```bash
# Standard dev flow
nvm use 20
npm install
npm run dev

# Verification before PR
npm run doctor

# Full test suite
npm run test
npm run test:e2e
```

### Doppler Secrets

```bash
# Run with Doppler secrets
doppler run --project aretelifeos --config dev -- npm run dev

# Run any command with Doppler
doppler run --project aretelifeos --config dev -- <command>
```

### Git/Deployment

```bash
# Sync with main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/name

# Push and track
git push -u origin feature/name
```

---

## Protection Rules

### main branch

- Requires PR review
- Requires build passing
- Requires Vercel deployment passing
- Direct push blocked

### Pre-push hook

Runs automatically before any push:

1. Node version check (must be 20.x)
2. `npm run doctor` (lint, typecheck, test)

If hook fails, fix issues and retry.

---

## Checklist Before Any Production Deploy

- [ ] Code is on a feature/hotfix branch from latest `main`
- [ ] `npm run doctor` passes locally
- [ ] Vercel Preview URL tested
- [ ] All affected flows verified on preview
- [ ] PR has clear description of changes
- [ ] PR has approval (for non-trivial changes)

---

## Troubleshooting

### "Pre-push hook failed"

The pre-push hook runs `npm run doctor`. Fix any failing checks:

```bash
# Run doctor manually to see errors
npm run doctor

# Fix the issues
# Then retry push
git push
```

### "Vercel deployment failed"

Check Vercel dashboard for error logs. Common causes:

- Build script error
- Environment variable missing
- TypeScript errors in CI

### "Need to test with production data"

Use the Vercel Preview deployment with production-like data:

1. Create test data in production
2. Test on Preview URL
3. Verify behavior matches expectations

---

## Best Practices

1. **Never deploy from a dirty tree** — always commit or stash first
2. **Always test on Preview first** — never skip staging
3. **One change per PR** — keep PRs focused and reviewable
4. **Write tests for new features** — prevents regressions
5. **Document breaking changes** — update README or docs

---

## Anti-Patterns to Avoid

| Anti-pattern                   | Better approach                 |
| ------------------------------ | ------------------------------- |
| Committing directly to `main`  | Use feature branches + PR       |
| Deploying prod from local tree | Let Vercel deploy from `main`   |
| Testing only locally           | Always verify on Vercel Preview |
| Large PRs with many changes    | Split into smaller PRs          |
| Skipping `npm run doctor`      | Run before every PR             |
| Secrets in `.env.local`        | Use Doppler for secrets         |

---

## Related Documents

- `AGENTS.md` — Agent workflow rules
- `NOW.md` — Current project state
- `docs/SECRETS.md` — Secrets policy
- `docs/DEPLOYMENT.md` — Vercel deployment guide
