# Current State — AreteLifeOS

**Status:** baseline_stabilization  
**Branch policy:** `main` = production, PR preview = staging, local = development  
**Deployment target:** Vercel  
**Node version:** 20.x

## What agents should assume

- The repo should be kept deployable from `main`.
- Local-only metadata and secrets must stay untracked.
- `npm run doctor` is the default verification gate.

## Immediate next steps

1. Land the repo hygiene baseline.
2. Verify the Vercel preview from that branch.
3. Merge to `main`.
4. Resume product work on top of the clean baseline.
