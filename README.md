<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cuj7akXL5dISmQasbU6DwZz0E_nhigma

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key (used by the server-side `/api/gemini` proxy; do not commit this file)
3. Run the app:
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
- AI extraction runs after the KG write; if it fails, the log still persists and is flagged `needsReview` with notes.

## Prompt structure

- Prompt configs live in `ai/geminiService.ts` (`DEFAULT_PROMPTS`) and are editable in-app.
- Ingestion uses the `internalization` prompt; recommendations use `deepPlanning`.
- Templates receive `{{input}}`, `{{history}}`, `{{profile}}`, and `{{family}}` as context.

## Debugging ingestion

- Watch for UI toasts and the Audit Log entries after each submission.
- Confirm a new Memory item appears in the Vault, with Sources linking to any files.
- If AI extraction fails, the log persists with `needsReview` + `extractionQualityNotes`.
