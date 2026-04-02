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
7. Use the canonical repo path for daily development. If a preserved local copy exists, suffix it with `-sandbox`.

## Daily Workflow

1. Sync from `main`.
2. Run `nvm use 20`.
3. Run `npm run setup:hooks` once per clone/worktree.
4. Create a branch.
5. Make changes locally.
6. Run `npm run doctor`.
7. Open a PR.
8. Verify the Vercel preview deployment.
9. Merge to `main` after review and QA.

## Commands

```bash
nvm use 20
npm install
npm run setup:hooks
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
- The canonical local path for this repo should stay `/Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS`.
