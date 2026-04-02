# Agent Instructions — AreteLifeOS

## Purpose

Operate this repo with one clean delivery model:

- Local machine = development only
- Vercel preview deployments = staging/QA
- `main` = production

## Startup

Read in this order:

1. `AGENTS.md`
2. `NOW.md`
3. `docs/DEVELOPMENT.md`
4. `docs/DEPLOYMENT.md`
5. `GATES.md`

## Non-negotiables

1. Never commit `.env`, `.env.local`, `.env.*`, or `.vercel/project.json`.
2. Never deploy production from a dirty local working tree.
3. Treat GitHub as the source of truth for production.
4. Use a feature branch for all work. Validate on a Vercel preview before merge.
5. Honor `.nvmrc` and switch to Node 20 before running npm, Vite, or test commands.
6. Run `npm run doctor` before handoff, PR, or release.

## Daily Workflow

1. Sync from `main`.
2. Run `nvm use 20`.
3. Create a branch.
4. Make changes locally.
5. Run `npm run doctor`.
6. Open a PR.
7. Verify the Vercel preview deployment.
8. Merge to `main` after review and QA.

## Commands

```bash
nvm use 20
npm install
npm run dev
npm run doctor
npm run test
npm run test:e2e
npm run build
vercel link
```

## Release Rule

- Only `main` should move production forward.
- If a preview deployment is fully verified, it can be promoted to production in Vercel.
- Roll back by redeploying a known-good Vercel deployment or reverting the Git commit on `main`.
