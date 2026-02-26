<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Areté Life OS

Local‑first Life OS with encrypted vault, AI mentor, and a three‑column execution dashboard.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` (server-side `/api/gemini` proxy; do not commit this file)
3. Optional: set `GEMINI_MODEL_RESEARCH` to a search‑grounding‑supported Gemini model for event prep grounding (e.g. `gemini-2.5-flash`)
4. Run the app:
   `npm run dev`

On first launch, set a passphrase to encrypt local data. This passphrase is not recoverable.

## Repo structure (feature folders)

- `app/` App shell + error boundary
- `layout/` Header, Sidebar
- `dashboard/` Dashboard views + components
- `vault/` Knowledge Graph + Vault UI
- `stream/` Life Stream timeline/history/audit
- `command/` Log Bar + command palette + router
- `chat/` Chat + advisor UI
- `settings/` Settings + prompts + rule of life
- `onboarding/` Onboarding flow
- `core/` State + orchestration (hooks like `useAura`)
- `ai/` Model orchestration (Gemini/OpenAI)
- `data/` Data models + storage (types, vault, file store)
- `shared/` Cross-cutting UI + tokens
- `api/` Serverless handlers (Vercel)

### Path aliases

- TS + Vite alias available: `@/` maps to repo root (e.g. `@/dashboard/DashboardView`).
- Folder barrels exist (`dashboard/index.ts`, `shared/index.ts`, etc.) for shorter imports.

## Knowledge Graph ingestion (local-first)

- Log Bar submissions flow through `core/useAura.ts` (`logMemory`), which creates `Source` + `MemoryItem` nodes in the encrypted local vault.
- File attachments are stored as blobs in IndexedDB (`data/fileStore.ts`) and referenced by `Source.storageKey` (no base64 at rest).
- AI extraction runs after the KG write; if it fails, the log still persists and the error is stored in `extractionQualityNotes`.
- Extracted facts/updates auto-commit to the knowledge graph (no verification step).

## Prompt structure

- Prompt configs live in `ai/geminiService.ts` (`DEFAULT_PROMPTS`) and are editable in-app.
- Ingestion uses the `internalization` prompt; recommendations use `deepPlanning`.
- Templates receive `{{input}}`, `{{history}}`, `{{profile}}`, and `{{family}}` as context.

## E2E tests (Playwright)

- Install dependencies: `npm install`
- Run E2E suite: `npm run test:e2e`
- Optional: run with live AI instead of stubs:
  `E2E_LIVE_AI=1 GEMINI_API_KEY=... npm run test:e2e`

## Event prep grounding (research toggle)

- Event prep plans use Google Search grounding only when explicitly requested.
- Add `#research` or `[research]` to the event title/description to enable grounded prep plans.

## Debugging ingestion

- Watch for UI toasts and the Audit Log entries after each submission.
- Confirm a new Memory item appears in the Vault, with Sources linking to any files.
- If AI extraction fails, the log persists with `needsReview` + `extractionQualityNotes`.

## Telegram Journaling Workflow

1. Open Dashboard -> Telegram card -> generate a link code.
2. Send `/link <code>` to your Telegram bot.
3. Send journal messages, links, images, or short updates in Telegram.
4. Dashboard Inbox pulls unmerged items on refresh and shows AI confidence per item.

Merge behavior:
- Auto-merge merges only entries with confidence above your configured Inbox Review Threshold (default `0.65`).
- Lower-confidence entries stay in Inbox with a `needs review` badge.
- You can merge low-confidence items manually from the Inbox card using `Merge`.
- Configure threshold in `Settings -> Telegram -> Inbox Review Threshold`.

What gets merged:
- `event` items -> Timeline event + Memory entry
- `task` or `task_request` items -> Task + Memory entry
- `profile_update` / `config_update` -> Profile field update + Memory entry
- Any extracted `facts` -> committed Claims linked to the merged memory
