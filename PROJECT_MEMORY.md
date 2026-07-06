# Project Memory — AreteLifeOS

> Auto-maintained by /checkpoint. Read this first for project context instead of reconstructing from scratch.
> Last updated: 2026-07-04

## Purpose

Premium life operating system — an AI-powered personal productivity platform for iOS. Privacy-first with local-first storage, AI that feels like a thoughtful human, mobile-first (iOS via Capacitor).

## Stack

- Framework: React 19 + Vite + TypeScript
- Styling: Tailwind CSS v4
- Mobile: Capacitor (iOS)
- AI: AI mentor with chat interface
- Deploy target: Vercel (web) + iOS App Store
- Package manager: npm

## Architecture Notes

- `app/` — Main application views and routing
- `core/` — Core domain logic and state management
- `chat/` — AI chat interface
- `dashboard/` — Dashboard views
- `data/` — Data layer and persistence
- `api/` — API integration layer
- `ai/` — AI prompt and response handling
- `command/` — Command palette or action system
- `docs/` — Architecture, data model, dashboard spec, AI prompt flow docs
- Local-first storage with encrypted vault
- Premium, calming aesthetic — not generic AI

## Key Decisions

- 2026-04-02: Migration to canonical checkout convention; sandbox split documented
- Premium aesthetic is a core requirement — do not produce generic AI visuals

## Known Risks

- `AreteLifeOS-sandbox/` is a dirty/in-progress copy — do not use for production tasks
- Encrypted vault — never weaken encryption or expose secrets
- Premium aesthetic — visual regressions can quickly break the brand feel
- iOS Capacitor wrapper — generated native artifacts should not be hand-edited casually

## Testing Commands

- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm run test`
- build: `npm run build`
- dev: `npm run dev`
- e2e: `npm run test:e2e`
- format check: `npm run format:check`
- doctor: `npm run doctor`

## Deployment Notes

- Vercel for web deployment
- iOS App Store via Capacitor
- Preview deployments via Vercel before merge
- Keep main deployable; route every change through a Vercel preview

## Secrets/Env Handling

- `.env.example` and `.env.local` exist
- Unknown if Doppler is configured — needs owner confirmation
- Encrypted vault keys must never be exposed

## What the Agent Should Read First

1. `AreteLifeOS/AGENTS.md` — repo-specific instructions
2. `AreteLifeOS/NOW.md` — current task status
3. This file
4. `docs/ARCHITECTURE.md` — architecture details
5. `docs/DATA_MODEL.md` — data model
6. `docs/AI_PROMPT_FLOW.md` — AI prompt flow

## What Not to Touch Casually

- Encrypted vault — never weaken encryption
- `ios/` Capacitor output — generated native artifacts
- Premium visual design — do not produce generic AI visuals
- `AreteLifeOS-sandbox/` — dirty copy, not for production
