# AreteLifeOS - Agent Instructions

## Run Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Quality Gates
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Build: `npm run build`

## Architecture Hotspots
- `api/` - serverless handlers and provider routing are constrained by deployment limits
- `core/` and `command/` - orchestration logic and command routing shape app behavior
- `data/` and `vault/` - encrypted local data and knowledge graph state must remain stable

## Coding Conventions
- Preserve the local-first data flow and encrypted vault assumptions
- Route AI and server interactions through the existing service and API boundaries instead of ad hoc calls

## Dangerous Areas
- `api/` - function count and routing changes can break Vercel deployment limits
- `core/useAura.ts` and related ingestion paths - memory logging and extraction must not corrupt local state
- `data/` persistence layers - schema or storage changes can damage encrypted user data

## Definition of Done
- Quality gates pass (lint -> typecheck -> test -> build)
- No new TypeScript errors
- PR created with description
- API surface stays within current deployment constraints and local vault integrity is preserved
