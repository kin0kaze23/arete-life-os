# Current Status Snapshot

Last updated: 2026-01-30 02:45

## Repo State

- Branch: `feature/ui-ux-enhancements`
- Last commit: 1f1a38c chore: apply prettier formatting
- Uncommitted changes: 80 files
- Tests: `npm run doctor` pass (2026-01-29). Build warns about large chunk size (>500kB) but succeeds.
- Recent Changes:
  - **Prompt Flow Optimization (Phase 0)**: Daily intelligence batch + cadence gating; deep tasks run weekly unless forced.
  - **Intake Cost Reduction**: `processInput` uses compact profile + 10 memory items and Gemini Flash‑Lite with Pro retry.
  - **Deterministic Parser**: High‑confidence expense logs parsed without AI; AI fallback remains.
  - **Daily Plan**: Uses Gemini Flash first with Pro fallback.
  - **Latency Optimizations**: Debounced vault persistence, batched memory/profile updates, adaptive daily batch routing (Flash → Pro on quality risk).
  - **Usage Logging**: Gemini usage metadata logged for server actions.
  - **Model Router (Optional)**: Provider abstraction + router added behind `AI_USE_ROUTER=1` (disabled by default).
  - **CSP**: Added provider endpoints to `connect-src` for future multi‑provider use.
  - **Docs**: Prompt flow updated to reflect new batch + intake settings.

## Core Loop

- Log Bar writes are atomic; logs persist even if AI extraction fails (notes captured in `extractionQualityNotes`).
- Intake facts/updates auto-commit (no VerificationSheet/needsReview).
- File uploads are local-first (IndexedDB), referenced via `Source.storageKey`.
- Finance metrics derived each log and stored as `finance_metrics` MemoryItem.
- Habit detection writes `Category.HABIT` MemoryItem with structured metadata.
- Dashboard auto-refreshes after log ingestion, but heavy AI work is gated to daily/weekly cadence.
- **Event Prep**: "Prep Plan" activation correctly adds tasks to `dailyPlan` and prevents duplicates.
- **Task Refresh**: AI tasks are merged (not replaced), preserving manual/prep tasks.
- **Daily Batch**: `dailyIntelligenceBatch` replaces per-log tasks/insights/blind spots.
- **Search Grounding**: Prep plan can use Google Search via `GEMINI_MODEL_RESEARCH`.

## Dashboard Scope

**Streamlined 3-Column Layout:**

1.  **Focus (Left)**: Daily Tasks + Habits (Execution)
2.  **Schedule (Center)**: Upcoming Calendar (Timeline)
3.  **Life Status (Right)**: Profile + Dimension Signal Cards + Recommendations (Intelligence)

_Note: "Always Do/Watch" chips are now integrated inside the Dimension Cards in Life Status._

## Component Naming Convention (Current)

**Views (routed screens)**  
Use `*View` for top-level routes: `DashboardView`, `LifeStreamView`, `ChatView`, `VaultView`, `SettingsView`.

**Column sections (Dashboard)**  
Use descriptive noun components for column blocks:

- Left (Execution): `FocusList`
- Center (Schedule): `UpcomingCalendar`
- Right (Intelligence): `StatusSidebar`

**Overlays & sheets**  
Use `*Modal` / `*Sheet` / `*Popup`:

- `PrepPlanModal`, `EventEditSheet`, `EventPrepPopup`

**Deprecated names (mapping)**

- `AlwaysPanels` → merged into `StatusSidebar` (Always Do/Watch chips live per-dimension)
- `DoWatchSection` → replaced by `FocusList`
- `RecommendationsWidget` → replaced by `StatusSidebar` recommendation feed

## AI Prompting

- Intake uses **Flash‑Lite → Pro** fallback and compact context.
- Daily intelligence batch runs **once/day**; deep tasks run **weekly** unless forced.
- Daily plan uses **Flash → Pro** fallback.
- OpenAI fallback remains available for Gemini failures.

## Immediate Next Steps

1.  **Local validation**: Run app with new Gemini 2.5 models; watch `[ai][usage]` logs.
2.  **Router optional**: Enable `AI_USE_ROUTER=1` only if you want multi‑provider routing.
3.  **Performance**: Consider code-splitting if the build chunk warning becomes an issue.

## Recent Actions

<!-- Agent should update this section -->

## Next Steps

<!-- Agent should update this section -->
