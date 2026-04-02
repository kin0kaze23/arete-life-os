# Areté Life OS — Agent Bootstrap Context

> **Purpose**: Single-file bootstrap for any fresh Claude agent session.
> Read this file first — it contains everything needed to operate on this codebase with full context awareness.
>
> Last updated: 2026-01-29 | Version: 3.5.0

---

## 1. Project Identity

**Areté Life OS** — A production Life Operating System with encrypted local vault, AI mentor, and premium dark UI. The app helps a high-performance individual optimize across 5 life pillars (Health, Finance, Relationships, Spiritual, Personal/Work) with hyper-personalized, data-grounded AI recommendations.

| Attribute    | Value                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Stack        | React 19, TypeScript, Vite, Tailwind CSS (CDN)                                                  |
| AI Primary   | Google Gemini API (recommended `gemini-2.5-pro` / `gemini-2.5-flash` / `gemini-2.5-flash-lite`) |
| AI Fallback  | OpenAI (`gpt-5.1`, configurable reasoning effort)                                               |
| Encryption   | AES-256-GCM + PBKDF2 (100K iterations), zero-knowledge                                          |
| Storage      | localStorage (encrypted vault) + IndexedDB (encrypted files)                                    |
| Deployment   | Vercel (`main` = production, PR previews = staging/QA)                                          |
| CI           | GitHub Actions (`npm run doctor`, UI smoke, core guardrails)                                    |
| Quality Gate | `npm run doctor` (format + lint + typecheck + test + build)                                     |

---

## 1.5 Agent Ops (Workflows + Scripts)

- Workflows live in `./.agent/workflows/` (start-session, end-session, pre-push, add-ai-generator, ui-ux-change)
- Status snapshot: `./scripts/update-status.sh`
- Learnings archive + quickref: `./scripts/archive-learnings.sh` → `./.agent/LEARNINGS_QUICKREF.md`
- Skill draft generator: `./scripts/propose-skill.sh` → `./.agent/skills/`
- User interaction guide: `./.agent/USER_INTERACTION_MANUAL.md`
- UI change guardrail: `./scripts/ui-change-check.sh`
- UI smoke test: `./scripts/run-ui-smoke.sh`
- UI-safe wrapper: `./scripts/run-ui-safe.sh`
- Cost guardrail: `./scripts/cost-guardrail.sh`
- Architecture drift check: `./scripts/architecture-drift-check.sh`
- Latency baseline: `./scripts/latency-baseline.sh`
- CI guardrails (PRs): cost + architecture checks when core/AI/backend files change
- Cost approvals: `./.agent/COST_APPROVALS.md` (regex allowlist for cost-neutral changes)

Note: The portable `./.agent/AGENT.md` uses this section for automation discovery.

## 1.6 Delivery Model

- Local checkout is for development only.
- GitHub pull requests are the review and staging boundary.
- Vercel preview deployments are the staging environment for QA.
- `main` is the only production branch and source of truth.
- Never commit `.env*` files or `.vercel/project.json`.

---

## 2. Folder Map

```
areté-life-os/
├── .agent/              # Agent docs (this file, learnings, troubleshooting)
├── ai/                  # AI service layer
│   ├── geminiService.ts # Client-side API wrapper (callGemini, all generate* fns)
│   ├── prompts.ts       # System prompts + buildMemoryContext + buildFeedbackContext
│   └── validators.ts    # Zod schemas for AI output validation
├── api/
│   └── gemini.ts        # Vercel serverless — ALL AI actions routed here
├── app/
│   └── App.tsx          # Root component, tab routing, vault gate
├── command/
│   ├── LogBar.tsx       # Main user input (sticky bottom bar)
│   ├── PrepPlanModal.tsx # Event preparation tasks modal
│   └── LogRouter.ts     # Intent classification + user resolution
├── core/
│   └── useAura.ts       # THE central hook (2200+ lines) — all state, vault, AI orchestration
├── dashboard/
│   ├── DashboardView.tsx    # 3-column dashboard layout
│   ├── FocusList.tsx        # Today's tasks + habits
│   ├── StatusSidebar.tsx    # Profile + recommendations + always chips
│   ├── UpcomingCalendar.tsx # Vertical calendar widget
│   ├── EventPrepPopup.tsx   # AI prep recommendations popup
│   ├── EventEditSheet.tsx   # Event edit sheet
│   ├── SystemStatusFooter.tsx # System health indicator
│   └── index.ts
├── data/
│   ├── types.ts          # 30+ TypeScript interfaces (466 lines)
│   ├── cryptoVault.ts    # AES-256-GCM vault
│   ├── fileStore.ts      # IndexedDB encrypted file storage
│   ├── claimUtils.ts     # Claim confidence scoring
│   └── financeUtils.ts   # Finance metric computation
├── shared/
│   ├── SharedUI.tsx      # 50+ reusable UI components
│   └── design-tokens.ts  # Design system constants
├── docs/                 # Deep reference docs (architecture, prompts, data model, PRD)
├── guide/                # User-facing guides
└── scripts/doctor.sh     # Quality gate script
```

**Import alias**: `@/` maps to repo root. Barrel files exist (`dashboard/index.ts`, etc.).

---

## 3. The Core Loop

The system runs on a continuous **Ingest → Analyze → Display → Execute** cycle:

### 3.1 Ingest (User Input)

```
LogBar → LogRouter.classifyIntent() → POST /api/gemini (action: processInput)
  → Deterministic parser (expense logs) if confidence ≥ 0.7
  → Gemini Flash‑Lite + LOG_BAR_INGEST_PROMPT → IntakeResult (fallback to Pro on schema fail)
  → Auto-commit claims + updates + appendMemoryItems()
```

- LogBar is the **sole input method** (no secondary inputs)
- Intent classified from 12 types: `memory|event|habit|health|finance|relationship|spiritual|profile_update|config_update|task_request|query|unknown`
- AI domain classification is **preferred over** client-side regex (`useAura.ts:1593`)
- KG write succeeds even if AI extraction fails (error captured in `extractionQualityNotes`)
- Dashboard auto-refreshes after log ingestion, but heavy AI work is gated to daily/weekly cadence.

**Event Prep Grounding (Search Toggle)**

- Prep plan grounding uses Google Search **only when explicitly requested**.
- Add `#research` or `[research]` to the event title/description to enable grounded prep plans.

### 3.2 Analyze (AI Inference)

```
debouncedRefreshAura() (500ms debounce after data commit)
  → dailyIntelligenceBatch() → tasks + insights + blind spots (1/day)
  → generateDeepTasks()      → recommendations (weekly unless forced)
```

**Every generator receives:**

| Context              | Source                                       | Purpose                             |
| -------------------- | -------------------------------------------- | ----------------------------------- |
| `{{history}}`        | `buildMemoryContext(memory, allCats, 30-50)` | Category-filtered, scored memories  |
| `{{feedback}}`       | `buildFeedbackContext(memory)`               | Kept/removed recommendation signals |
| `{{verifiedFacts}}`  | Top 20 COMMITTED claims                      | Highest-confidence knowledge        |
| `{{profile}}`        | Full user profile JSON                       | Identity, health, finance, etc.     |
| `{{financeMetrics}}` | `computeFinanceMetrics(profile)`             | Budget, savings rate, daily spend   |
| `{{currentDate}}`    | `new Date().toISOString()`                   | Temporal reasoning                  |

### 3.3 Display (Dashboard)

```
DashboardView (3-column grid):
  Col 1: FocusList (Execution: tasks + habits)
  Col 2: UpcomingCalendar (Timeline)
  Col 3: StatusSidebar (Intelligence: profile + recs + always chips)
  Footer: SystemStatusFooter
```

### 3.4 Execute (User Action)

```
completeTask(id)         → mark done, log audit
keepRecommendation(id)   → store feedback for AI learning
removeRecommendation(id) → dismiss, inform future AI
updateProfile(...)       → persist + trigger refresh
```

Each action: updates state → auto-persists to encrypted vault → logs audit → may trigger AI re-analysis.

---

## 4. AI Architecture

### Gemini‑Only Strategy (Default)

| Model             | Actions                                                                          | Speed  |
| ----------------- | -------------------------------------------------------------------------------- | ------ |
| Gemini Flash‑Lite | `processInput` (intake router)                                                   | Fast   |
| Gemini Flash      | `dailyIntelligenceBatch` (default), `generateDailyPlan`, `generateEventPrepPlan` | Fast   |
| Gemini Pro        | daily batch escalation, deep tasks, oracle, deep init, search tasks              | Deep   |
| OpenAI            | Automatic fallback if Gemini fails                                               | Varies |

Optional: multi‑provider routing is available behind `AI_USE_ROUTER=1` (disabled by default).

### Server Handler (`api/gemini.ts`)

Single Vercel serverless endpoint. Actions: `askAura`, `dailyIntelligenceBatch`, `generateDeepTasks`, `generateEventPrepPlan`, `generateDeepInitialization`, `processInput`, `generateTasks`, `generateInsights`, `generateBlindSpots`, `generateDailyPlan`.

### Client Wrapper (`ai/geminiService.ts`)

Thin wrapper calling `fetch('/api/gemini')` with `callGemini<T>(action, payload, fallback)`. All generate functions accept a `PromptContext` with `familyMembers`, `financeMetrics`, `missingData`, `claims`.

### Prompt Templates (`ai/prompts.ts`)

| Template                          | Purpose                               |
| --------------------------------- | ------------------------------------- |
| `LOG_BAR_INGEST_PROMPT`           | Intake router — structured extraction |
| `DAILY_INTELLIGENCE_BATCH_PROMPT` | Daily tasks + insights + blind spots  |
| `HYPER_PERSONALIZED_PROMPT`       | Chief of Staff — recommendations      |
| `DAILY_PLAN_PROMPT`               | Daily Mission — prioritized plan      |

Key helper functions:

- `buildMemoryContext(memory, categories, maxItems)` — Scores: +100 today, +50 category match, +0-100 recency (7-day decay)
- `buildFeedbackContext(memory)` — Extracts kept/removed signals from `recommendation_feedback` metadata

### Memory Limits by Generator

| Generator                    | Categories | Max Items |
| ---------------------------- | ---------- | --------- |
| `processInput`               | None       | 10        |
| `askAura`                    | None       | 30        |
| `generateTasks`              | All 6      | 30        |
| `generateInsights`           | All 6      | 50        |
| `generateBlindSpots`         | All 6      | 50        |
| `generateDeepTasks`          | All 6      | 30        |
| `generateDailyPlan`          | All 6      | 30        |
| `generateDeepInitialization` | All 6      | 30        |
| `dailyIntelligenceBatch`     | 24h digest | 12        |

---

## 5. State Management (`useAura.ts`)

All application state flows through the `useAura()` hook. Key state:

```
profile, familySpace, memoryItems, claims, sources,
tasks, recommendations, goals, blindSpots, dailyPlan,
insights, auditLogs, timelineEvents, ruleOfLife,
alwaysDo (AlwaysChip[]), alwaysWatch (AlwaysChip[]),
prompts, layouts
```

**Auto-behaviors:**

- State change → encrypt & save to localStorage
- Data commit → debounced AI refresh (500ms)
- Inactivity 15min → auto-lock vault
- Memory dedup → skip identical `contentHash()`

**Key methods exposed:**

- `logMemory(input)` — Full intake pipeline
- `planMyDay()` — Generate daily plan
- `refreshAura()` — Daily batch regeneration (tasks + insights + blind spots) + weekly deep tasks
- `runDeepInitialization()` — Post-onboarding deep analysis (receives profile + ruleOfLife + memory + claims)
- `keepRecommendation(id)` / `removeRecommendation(id)` — Feedback loop
- `commitClaims(sourceId, facts, updates)` — Knowledge graph commits

---

## 6. Encryption & Security

- **AES-256-GCM** with PBKDF2 (100K iterations, random salt + IV)
- **Zero-knowledge**: Server never sees decrypted data

---

## 7. Agent Skills (Quick Start)

Skills live in `.agent/skills/` as single markdown files. Use these first to avoid re-learning recent workflows:

- `.agent/skills/prompt-flow-optimization.md` — Daily batch + cadence gating + intake safeguards
- `.agent/skills/debugging-500-errors.md` — Server error triage and recovery steps
- `.agent/skills/component-analysis.md` — UI component diffing and analysis workflow
- **Key in memory only**: Never persisted, cleared on lock
- **Auto-lock**: 15 minutes inactivity
- **Rate limiting**: 5 failed passphrase attempts → 15-minute lockout; API: 30 req/min/IP
- **No plaintext on disk**: All stored data encrypted before write

---

## 7. Key Types (`data/types.ts`)

| Type               | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `UserProfile`      | Identity, health, finances, relationships, spiritual |
| `MemoryEntry`      | Knowledge graph node (content + metadata)            |
| `Claim`            | Verified fact (PROPOSED → COMMITTED → ARCHIVED)      |
| `DailyTask`        | Actionable task with steps, priority                 |
| `Recommendation`   | AI suggestion with rationale + evidence              |
| `BlindSpot`        | Risk/gap detected by AI                              |
| `ProactiveInsight` | Pattern/opportunity detected by AI                   |
| `AlwaysChip`       | Persistent routine/guardrail chip                    |
| `TimelineEvent`    | Calendar event                                       |
| `Source`           | Attached file metadata                               |
| `IntakeResult`     | AI intake output (items + facts + updates)           |
| `RuleOfLife`       | Season, values, rhythm, preferences                  |
| `FinanceMetrics`   | Computed budgets and savings rate                    |

---

## 8. Environment Variables (Vercel)

| Variable                  | Required | Default                             |
| ------------------------- | -------- | ----------------------------------- |
| `GEMINI_API_KEY`          | Yes      | —                                   |
| `GEMINI_MODEL_PRO`        | No       | `gemini-3-pro-preview`              |
| `GEMINI_MODEL_FLASH`      | No       | `gemini-3-flash-preview`            |
| `GEMINI_MODEL_RESEARCH`   | No       | — (set to a search-supported model) |
| `OPENAI_API_KEY`          | No       | —                                   |
| `OPENAI_MODEL`            | No       | `gpt-5.1`                           |
| `OPENAI_REASONING_EFFORT` | No       | `medium`                            |

**Never expose keys to browser** (no `VITE_` prefix).

---

## 9. Workflow & Automation

### Pre-push (required)

```bash
npm run doctor   # format + lint + typecheck + test + build — MUST pass
```

### E2E (optional but recommended before main)

```bash
npm run test:e2e
# Live AI validation:
E2E_LIVE_AI=1 GEMINI_API_KEY=... npm run test:e2e
```

### Git Rules

- Git author email: `198166775+kin0kaze23@users.noreply.github.com`
- Main branch is always green and deployable
- No secrets in git
- `npm run doctor` before every push

### Autopilot Mode

When asked to "do all the things":

1. `git status` → summarize changes
2. `npm run doctor` → verify
3. Commit with clear message
4. Push to `main` if checks pass

### Requires User Approval

- Infrastructure changes (CI, deployment, hosting)
- Dependency upgrades
- Large refactors
- Vercel dashboard changes

### Post-Fix Protocol

After resolving non-trivial issues:

1. Update `.agent/LEARNINGS.md` (issue, root cause, solution, prevention)
2. Update `.agent/TROUBLESHOOTING.md` if recurring

---

## 10. AI Generator Checklist

When adding or modifying any AI generator, ensure:

1. ✅ Category-filtered `buildMemoryContext()` with appropriate limit
2. ✅ `buildFeedbackContext()` for `{{feedback}}`
3. ✅ Committed claims for `{{verifiedFacts}}`
4. ✅ `currentDate` for temporal reasoning
5. ✅ Finance metrics and missing data for completeness
6. ✅ `Promise.allSettled` for parallel calls (never sequential `await`)
7. ✅ Zod validation on output before state updates
8. ✅ OpenAI fallback path

When adding new UI components:

1. ✅ Type defined in `data/types.ts`
2. ✅ State hook in `useAura.ts`
3. ✅ Added to `VaultData` interface + `buildDefaultVault` + `applyVaultData` + `getVaultSnapshot`
4. ✅ Rendered in parent component with props wired from `App.tsx`

---

## 11. Key Architectural Decisions

| Decision                          | Rationale                                                |
| --------------------------------- | -------------------------------------------------------- |
| Local-first encrypted storage     | Privacy, zero-knowledge, no server database              |
| Gemini Flash for intake           | Speed: structured extraction needs fast model            |
| Adaptive model routing            | Flash by default; Pro escalation on quality risk         |
| OpenAI fallback                   | Reliability: core loop stays alive if Gemini fails       |
| `Promise.allSettled` for refresh  | Speed: 3x faster than sequential; partial failure safe   |
| AI domain > regex classification  | Accuracy: AI domain from structured intake beats keyword |
| Feedback loop via memory metadata | Simplicity: no separate DB, leverages existing KG        |
| Claims as verified facts          | Trust: user-approved data = highest confidence context   |
| CDN for Tailwind/React            | Dev speed: no build step for styling; CSP tradeoff       |

---

## 12. Deep Reference Files

For detailed specifications beyond this bootstrap:

| File                        | Content                                  |
| --------------------------- | ---------------------------------------- |
| `docs/ARCHITECTURE.md`      | Full system architecture & data flow     |
| `docs/AI_PROMPT_FLOW.md`    | Complete AI prompt interaction map       |
| `docs/DATA_MODEL.md`        | Entity reference with all fields         |
| `docs/PRD.md`               | Product requirements document            |
| `docs/DASHBOARD_SPEC.md`    | Dashboard component specifications       |
| `docs/LOG_BAR_PIPELINE.md`  | Input pipeline deep dive                 |
| `.agent/LEARNINGS.md`       | Session-by-session discoveries           |
| `.agent/TROUBLESHOOTING.md` | Known issues & fixes (CSP, Vercel, git)  |
| `.agent/AGENT.md`           | Operating protocols & working agreements |

---

## 13. Common Pitfalls (Read Before Acting)

1. **CSP blocks**: If external resources fail in prod, check `vercel.json` CSP `connect-src` first
2. **Model 404s**: If Gemini returns 404, check `GEMINI_MODEL_PRO`/`GEMINI_MODEL_FLASH` env vars
3. **JSON shape mismatch**: AI may return `{ tasks: [...] }` instead of `[...]` — always handle both
4. **Dead code**: Components can exist but never be imported — always trace the full render path
5. **Prettier formatting**: After editing `api/gemini.ts` or `useAura.ts`, run `npx prettier --write <file>` to fix long-line wrapping
6. **useCallback deps**: When adding state to `runDeepInitialization` or similar, update the dependency array
7. **Never drop logs on AI failure**: Persist the log and record `extractionQualityNotes`
