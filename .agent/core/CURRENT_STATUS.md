# Current Status Snapshot

Last updated: 2026-02-01 22:34

## Repo State

- Branch: `feature/ui-ux-enhancements`
- Last commit: f82005a chore: update agent status and learnings
- Uncommitted changes: 100 files
- Tests: `npm run doctor` pass (2026-01-30). Build succeeds.
- Recent Changes:
  - **Agent Intelligence Upgrade (Phase 1-3)**:
    - Standardized all 11 skills into `.agent/skills/<name>/SKILL.md` structure.
    - Upgraded `visual-intelligence` with semantic design system and Priority 1-3 checklists.
    - Created 5 new industry-standard skills (2026): `performance`, `data-architecture`, `testing`, `api-design`, `error-resilience`.
    - Embedded **"Skill Gate" mandate** in `AGENT.md` for mandatory intelligence checks.
    - Verified 11/11 skills locked and loaded for independent operation.
  - **Prompt Flow Optimization (Phase 0)**: Daily intelligence batch + cadence gating; deep tasks run weekly unless forced.
- **Docs**: Walkthrough, Skills Status Report, and Initialization Guide created in `.agent/`.
  ... (rest of the file)
  - **Intake Cost Reduction**: `processInput` uses compact profile + 10 memory items and Gemini Flash‑Lite with Pro retry.
  - **Deterministic Parser**: High‑confidence expense logs parsed without AI; AI fallback remains.
  - **Daily Plan**: Uses Gemini Flash first with Pro fallback.
  - **Latency Optimizations**: Debounced vault persistence, batched memory/profile updates, adaptive daily batch routing (Flash → Pro on quality risk).
  - **Usage Logging**: Gemini usage metadata logged for server actions.
  - **Model Router (Optional)**: Provider abstraction + router added behind `AI_USE_ROUTER=1` (disabled by default).
  - **CSP**: Added provider endpoints to `connect-src` for future multi‑provider use.
- **Docs**: Prompt flow updated to reflect new batch + intake settings.
- **Security Hardening**:
  - CSP tightened (script-src no inline/eval) with report-only endpoint.
  - Tailwind moved to build-time pipeline; inline styles removed.
  - Payload schemas + size checks added for AI API.
  - Expanded secret/PII redaction.
  - Passphrase guidance + blocklist + progressive lockouts.
  - Security audit logging for vault actions.
  - Encrypted backups via Vercel Blob (10 MB cap, 10 versions, 90-day retention).
  - Backup restore with recovery code + passphrase, rate limits, and backoff.
  - Settings Security panel (audit logs + CSP summary copy).

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

1. **System Utility**: Use the new `performance-intelligence` and `testing-strategy-intelligence` skills to harden the core loop.
2. **Security**: Decide when to implement key rotation (Phase 6.2).
3. **Docs**: Maintain the Skills Status Report as new capabilities are added.

## Recent Actions

- Shipped agent automation framework (workflows + scripts) and portability rules.
- Added UI safety guardrails, cost/architecture checks, and UI smoke workflow.
- Enabled CI guardrails on PRs (UI smoke + core cost/arch checks).
- Implemented code-splitting in `app/App.tsx`, added test IDs for e2e stability.
- Established latency baseline and cost approvals workflow.
- Ran full `run-ui-safe` chain; all checks passed.
- **Mode 3 Automation (Pure Groq Strategy)**:
  - **Status**: 🟢 PRODUCTION READY (Feb 1, 2026)
  - **Configuration**:
    - Primary: `llama-3.1-8b-instant` (Fast/Cheap - 70% of tasks)
    - Escalate: `llama-3.3-70b-versatile` (Quality/Reasoning - 30% of tasks)
  - **Performance**: 1.6s avg speed (20x faster than GPT-5), 77% cost savings ($0.27/mo projected).
  - **Usage**: `npm run devops:auto -- .agent/plans/your-plan.md`

## Tool Strategy (Feb 1, 2026)

- **Primary**: Anti-Gravity + Gemini 3 Pro/Flash (highest usage limits, agentic, reads .agent/ natively)
- **Secondary**: Cursor + Codex GPT 5.2 (fallback for complex tasks)
- **Reserve**: Cursor + Claude Opus 4.5 (planning, architecture, hard debugging only)
- **Mode 3**: Terminal-only, uses Groq Llama 70B. See `.agent/core/MODE3.md`.
- **Sync rule**: Commit before switching tools. Git is the shared brain.
- **Dev server**: Always http://localhost:3000 (strictPort enabled)

See `.agent/core/DEVELOPMENT_SETUP.md` for full details.

## Next Steps

- Build remaining dashboard components: SWOTGrid, GoalsPanel, QuickWin
- Fix empty state UX for new users (no SWOT analysis showing on init)
- Push completed features to Vercel production
