# Current State — AreteLifeOS

**Status:** ready_for_feature_work  
**Branch policy:** `main` = production, PR preview = staging, local = development  
**Deployment target:** Vercel  
**Node version:** 20.x

## What agents should assume

- The repo should be kept deployable from `main`.
- Local-only metadata and secrets must stay untracked.
- Honor `.nvmrc` before running npm, Vite, or test commands.
- `npm run doctor` is the default verification gate.
- `/Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS` is the preserved local sandbox.
- `/Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS-mainline` is the clean daily-development checkout.

## Immediate next steps

1. Start new product work from the clean mainline checkout on a fresh feature branch.
2. Move any sandbox work over intentionally by cherry-pick or manual porting.
3. Validate every branch on a Vercel preview before merge.
4. Keep production changes flowing through GitHub `main` only.
