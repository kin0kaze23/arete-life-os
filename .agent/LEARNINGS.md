# Session Learnings

Chronological log of issues resolved and knowledge gained. Claude should append to this file after resolving non-trivial issues.

---

## 2026-01-25: Vercel Deployment & CSP Fix

### Issue

UI completely broken on Vercel production - app rendered but without any Tailwind CSS styling.

### Root Causes (Multiple)

1. **CSP `connect-src` too restrictive**
   - `vercel.json` had `connect-src 'self'`
   - Tailwind CDN needs to make network requests for runtime CSS compilation
   - Fix: Added `https://cdn.tailwindcss.com https://esm.sh https://generativelanguage.googleapis.com`

2. **Vercel not auto-deploying**
   - "Require Verified Commits" was enabled but commits weren't GPG-signed
   - Git author email didn't match GitHub account
   - Fix: Disabled verified commits requirement, configured GitHub noreply email

3. **Git author email mismatch**
   - Local git config used personal email not linked to GitHub
   - Vercel check failed: "No GitHub account was found matching the commit author email"
   - Fix: `git config user.email "198166775+kin0kaze23@users.noreply.github.com"`

### Key Learnings

- **Always check CSP first** when external resources fail to load in production
- **Vercel silently ignores** commits that don't meet its verification requirements
- **Use GitHub noreply email** to ensure commit attribution works with Vercel
- **Browser DevTools Console** shows CSP violations - check there first for styling issues

### Prevention

- CSP configuration documented in TROUBLESHOOTING.md
- Git email configured globally with GitHub noreply format
- Vercel "Require Verified Commits" disabled

### Time to Resolution

~45 minutes (would be <5 minutes with this documentation)

---

## 2026-01-25: Security Audit & Hardening

### Issue

User wanted to ensure the app was secure for storing sensitive personal data before daily use.

### Findings (Positive)

1. **Encryption implementation is solid**
   - AES-256-GCM with PBKDF2 (100,000 iterations)
   - Random salt (16 bytes) and IV (12 bytes) per operation
   - Key held only in memory, never persisted

2. **API key properly secured**
   - `.env.local` correctly gitignored via `*.local` pattern
   - API key accessed server-side only (`process.env.GEMINI_API_KEY`)
   - No secrets in git history

3. **Session security**
   - 15-minute inactivity auto-lock
   - Key wiped from memory on lock

### Issues Fixed

1. **VoiceAdvisor.tsx wrong env var**
   - Used `process.env.API_KEY` instead of `process.env.GEMINI_API_KEY`
   - Fix: Updated to correct env var name

2. **No passphrase strength enforcement**
   - Users could create weak passphrases
   - Fix: Added minimum 8 chars + strength meter requiring "Fair" or better

3. **Missing user security documentation**
   - No guidance on backup strategy, data persistence
   - Fix: Added comprehensive `guide/SECURITY.md`

### Key Learnings

- **CDN architecture requires proper CSP** - already documented from earlier session
- **Passphrase is single point of failure** - no recovery if forgotten
- **localStorage is browser-specific** - data doesn't sync, export backups critical
- **VoiceAdvisor feature was silently broken** - wrong env var meant it would fail in prod

### Prevention

- Security architecture documented in `guide/SECURITY.md`
- Passphrase strength now enforced in UI
- User guide created for backup best practices

---

## 2026-01-25: Gemini Reliability + OpenAI Fallback

### Issue

Gemini requests intermittently failed on Vercel with 500s, including model errors and JSON parsing errors.

### Root Causes

1. **Model not available in prod**
   - Defaulted to `gemini-1.5-flash` which returned 404 in `v1beta`.
2. **Non-array JSON response**
   - Gemini returned a non-array payload for daily plan, causing `plan.map` to crash.

### Solution

- Default Gemini models set to `gemini-3-pro-preview` and `gemini-3-flash-preview`.
- Added model configuration via env vars: `GEMINI_MODEL_PRO`, `GEMINI_MODEL_FLASH`.
- Hardened daily plan parsing to accept `{ tasks: [...] }` or fallback to `[]`.
- Added sanitized error logging with an error id to trace Vercel failures.
- Added OpenAI fallback (Responses API) when Gemini fails.
- Added OpenAI model configuration and reasoning effort envs: `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`.

### Key Learnings

- **Model defaults matter in prod**: missing/unsupported model IDs return 404.
- **GenAI JSON can be malformed**: guard all array parses defensively.
- **Fallbacks increase reliability**: OpenAI fallback keeps core flows alive.

### Prevention

- Configure all AI models via Vercel env vars.
- Keep OpenAI fallback enabled and use reasoning effort `medium` by default.
- Use error ids in logs to pinpoint failure types quickly.

---

## 2026-01-26: Core Loop Stability + Dashboard Declutter + Habits

### Issue

Core loop needed to be reliable (no silent failures), dashboard was noisy, and habits needed a real KG path.

### Root Cause

- Log ingestion mixed KG write and AI extraction, causing lost logs on AI failure.
- Dashboard accumulated legacy widgets beyond the high‑signal panels.
- Habit signals had no schema/category.

### Solution

- Split KG write from AI extraction; on AI failure, keep the log and mark `needsReview`.
- Added automatic `refreshAura()` after log ingestion to keep Do/Watch current.
- Decluttered dashboard to Do / Watch / Always Do / Always Watch / Domain Panels.
- Added `Category.HABIT` + habit detection on input; stored as structured `MemoryItem` metadata.
- Finance metrics derived on each log and stored as a `finance_metrics` MemoryItem.
- Evening Audit moved to a small Log Bar reminder.

### Key Learnings

- **Never drop logs on AI failure** — mark and surface `needsReview` instead.
- **Derived metrics belong in KG** for consistent UI + prompt grounding.
- **Habit detection can be lightweight** (pattern-based) yet useful.

### Prevention

- Always run `npm run doctor` after core loop changes.
- Keep .agent docs updated when changing ingestion or dashboard structure.

---

## 2026-01-27: UI/UX Aesthetic Overhaul (Linear-Style / Intelligence First)

### Issue

Dashboard was visually cluttered (too many borders, glass panels). User input flow was ambiguous (Log Bar vs Dashboard Input). "Widgets" hid improved recommendations (e.g. Finance alerts hidden in small cards).

### Solution

- **Nomenclature Upgrade:** Simpler terms ("Dashboard", "Assistant").
- **Focus Engine (Left Col):** Read-only "Execution View" (Task + Habits). Removing input reinforced "Log Bar is King".
- **Intelligence Feed (Right Col):** Pivoted from "Status Widgets" to a **Feed of Recommendations**.
  - If Recs exist -> Render list of actions.
  - If Recs empty -> Render minimal Status Card.
- **Visuals:** High contrast, low border density (Linear style).
- **Upcoming Timeline:** Moved to left column, styled as a list to match tasks.

### Key Learnings

- **Don Norman (Feedback):** If the system has a recommendation (feedback), it must be immediately visible, not hidden behind a click or a small icon.
- **Lists vs Cards:** For high-density information (like tasks or feed items), a clean list is often superior to a grid of cards.
- **Input Constraint:** Removing secondary input methods clarifies the primary input method (Log Bar).

### Prevention

- Avoid "Widgetization" (Dashboard widgets) for content that flows (Recs, Tasks). Use Feed/List patterns instead.

---

## 2026-01-28: AI Prompt Flow Optimization (9-Gap Analysis & Fix)

---

## 2026-01-29: Cost Optimization + Daily Batch + Optional Router

### Issue

Daily logging (10–15 logs/day) caused redundant Pro calls and inflated cost; prompts sent full profile + large memory contexts on every log.

### Solution

- **Daily intelligence batch**: bundled tasks + insights + blind spots into one daily Pro call.
- **Cadence gating**: daily batch runs once/day; deep tasks run weekly unless forced.
- **Intake optimization**: Flash‑Lite primary with Pro retry; compact profile + 10 memory items.
- **Deterministic parser**: high‑confidence expense logs parsed without AI; AI fallback for low confidence.
- **Daily plan**: Flash primary with Pro fallback.
- **Usage logging**: Gemini usage metadata logged server‑side for cost tracking.
- **Optional router**: provider abstraction + model router added behind `AI_USE_ROUTER=1` (disabled by default).
- **Docs updated**: prompt flow + model changes documented.

### Key Learnings

- **Batching + cadence** cuts cost without losing quality when outputs are structured and validated.
- **Deterministic parsing** is safe when confidence‑gated and combined with AI fallback.
- **Feature-flagged routing** lets us prepare for multi‑provider without destabilizing core loops.

### Prevention

- Keep `AI_USE_ROUTER=0` in local until explicitly testing multi‑provider.
- Monitor `[ai][usage]` logs to validate token usage and cost assumptions.

### Issue

Comprehensive evaluation of the AI prompt pipeline revealed 9 gaps preventing the AI from delivering truly hyper-personalized, data-grounded recommendations. The system was losing context at multiple stages.

### Root Causes

1. **P0 — Missing `{{currentDate}}`**: `processInput` (intake router) didn't pass `currentDate`, so the AI couldn't resolve relative dates ("tomorrow", "next Friday").
2. **P0 — Sequential AI calls**: `refreshAura()` ran `generateTasks`, `generateInsights`, `generateBlindSpots` sequentially. Each call took 2-5s, totaling 6-15s.
3. **P1 — Client regex overriding AI domain**: `LogRouter.classifyIntent()` used keyword regex, ignoring the AI's more accurate domain classification from `processInput`.
4. **P1 — No category filtering**: All generators received unfiltered memory. A Finance-heavy memory set would crowd out Health context.
5. **P1 — Always-Do/Watch disconnected**: `AlwaysPanels` component existed but was never imported/rendered. `AlwaysChip` state not persisted in vault.
6. **P1 — No feedback loop**: AI never knew which recommendations users kept or removed, leading to repeated dismissed recommendations.
7. **P2 — Deep init lacked memory**: `generateDeepInitialization` only received `profile` + `ruleOfLife`, missing the user's entire memory history.
8. **P2 — Recommendations never refreshed**: `refreshAura()` regenerated tasks/insights/blindSpots but NOT recommendations.
9. **P2 — Claims never passed to AI**: Committed claims (highest-confidence knowledge) were never included in any AI context.

### Solution

**P0 Fixes:**

- Added `currentDate: new Date().toISOString()` to `processInput` template fill
- Parallelized `refreshAura` with `Promise.allSettled` (3x faster)

**P1 Fixes:**

- Prefer AI domain over regex: `const refinedCategory = aiDomain || inferCategory(...)`
- Category-filtered memory: All generators now filter by all 6 life categories with appropriate limits (30-50 items)
- Wired `AlwaysPanels`: Added `AlwaysChip` state to vault, rendered in `DashboardView`, passed from `App.tsx`
- Feedback loop: Added `buildFeedbackContext()` extracting kept/removed signals, passed as `{{feedback}}` to all generators

**P2 Fixes:**

- Deep init now receives `memoryItems` + `claims` for data-grounded first impressions
- `refreshAura()` now includes `generateDeepTasks()` in parallel batch for recommendation regeneration
- All generators receive `{{verifiedFacts}}` — top 20 COMMITTED claims from knowledge graph

### Key Learnings

- **AI context is everything**: The AI can only be as good as the context it receives. Missing `currentDate`, claims, or feedback degrades output quality.
- **Parallel > sequential**: `Promise.allSettled` is the right pattern for independent AI calls — handles partial failures gracefully.
- **Feedback loops compound**: Even simple kept/removed signals dramatically improve recommendation relevance over time.
- **Trust AI over regex**: AI domain classification from structured intake is more accurate than client-side keyword matching.
- **Dead code detection**: Components can exist but be disconnected (e.g., `AlwaysPanels` was never imported). Always trace the full render path.
- **Claims are underused gold**: COMMITTED claims represent user-verified facts — highest confidence data that should ground all AI output.

### Prevention

- When adding new AI generators, use this checklist:
  1. ✅ Category-filtered `buildMemoryContext()` with appropriate limit
  2. ✅ `buildFeedbackContext()` for `{{feedback}}`
  3. ✅ Committed claims for `{{verifiedFacts}}`
  4. ✅ `currentDate` for temporal reasoning
  5. ✅ Finance metrics and missing data for completeness
- When adding new UI components, verify the full wiring: type → state → vault → render → props
- Always use `Promise.allSettled` for parallel AI calls, never sequential `await`

---

## 2026-01-28: Debugging 500 Errors + Codebase Refactoring for Stability

### Issue

User reported persistent 500 Internal Server Errors when logging events via the Log Bar. Events were not appearing in "Upcoming Events" despite being event-like inputs (e.g., "tennis tomorrow with dexter at 10 PM"). Console showed errors but the root cause was hidden.

### Root Causes (Multiple Layers)

1. **Hidden server errors in dev proxy**
   - `vite.config.ts` dev proxy caught errors but didn't log them
   - Only returned generic `{ error: 'Gemini request failed' }` with no details
   - Made debugging impossible — couldn't see stack traces or error messages

2. **Large monolithic files**
   - `useAura.ts`: 2311 lines ("God Hook")
   - `api/gemini.ts`: 886 lines (monolithic API)
   - Mixed concerns made it hard to isolate failures
   - Event utilities buried inside `useAura.ts` (165 lines)
   - `processInput` function had 80 lines of inline logic

3. **Function hoisting issues**
   - Event parsing functions (`parseTimeFromText`, etc.) were arrow functions
   - Caused "not defined" errors when called before declaration
   - Required careful ordering or hoisted `function` declarations

4. **No error isolation**
   - Single try/catch in `processInput` meant any error killed the entire request
   - No granular logging to identify which step failed
   - Fallback to OpenAI was buried in the same try/catch

5. **Stale server session**
   - User was testing against an old dev server instance
   - Changes to error handling weren't picked up until restart
   - Browser cache compounded the issue

### Solution (3-Phase Refactoring)

**Phase 1: Extract Event Utilities**

- Created `core/eventUtils.ts` (~200 lines)
  - `isLikelyEvent()` — 60+ keyword regex
  - `parseTimeFromText()` — "10 PM" → "22:00"
  - `parseDateFromText()` — "tomorrow" → ISO date
  - `parseDateTimeFromText()` — combined parsing
  - `extractLinks()` — URL extraction
- Updated `useAura.ts` to import from `eventUtils.ts`
- **Result**: 2311 → 2146 lines (7% reduction)

**Phase 2: Centralize AI Configuration**

- Created `api/aiConfig.ts` (~120 lines)
  - `getModel()`, `getGeminiClient()`, `getOpenAIClient()`
  - `callOpenAI()`, `fillTemplate()`, `toJsonPrompt()`
  - `serializeError()` — safe error logging with redaction
- Extracted shared utilities from `api/gemini.ts`

**Phase 3: Isolate Process Input**

- Created `api/aiActions/processInput.ts` (~140 lines)
  - **Explicit validation**: Input type checking
  - **Detailed logging**: `[processInput]` prefixed console logs
  - **Clear error boundaries**: Separate try/catch for Gemini and OpenAI
  - **Type-safe interface**: `ProcessInputParams` and `ProcessInputResult`
- Updated `api/gemini.ts` to delegate to the new module
- **Result**: 887 → 828 lines (7% reduction)

**Critical: Enhanced Dev Proxy Logging**

```typescript
// vite.config.ts
catch (err: any) {
  console.error('[DEV PROXY ERROR]', err?.message || err);
  console.error('[DEV PROXY STACK]', err?.stack);
  res.statusCode = 500;
  res.end(JSON.stringify({ error: 'Gemini request failed', details: err?.message }));
}
```

### Key Learnings

1. **Always log errors in dev proxies**
   - Silent failures are debugging nightmares
   - Log both message AND stack trace
   - Return error details in response for client visibility

2. **Restart dev server after config changes**
   - `vite.config.ts` changes require full restart
   - `pkill -f "vite" && npm run dev` is safer than manual Ctrl+C
   - Old server sessions can show stale behavior

3. **Modular code is debuggable code**
   - 80-line inline functions → hard to debug
   - Extracted modules with logging → easy to trace
   - Each module can be tested independently

4. **Function hoisting matters**
   - Arrow functions: `const fn = () => {}` — not hoisted
   - Function declarations: `function fn() {}` — hoisted
   - For utilities called during initialization, use `function`

5. **Browser cache + stale sessions = confusion**
   - Hard refresh (`Cmd+Shift+R`) is not enough if server is stale
   - Clear localStorage if vault state is corrupted
   - Fresh vault creation can reveal if issue is session-specific

6. **Test with automation when manual testing is unreliable**
   - Browser subagent can create fresh vault and test end-to-end
   - Eliminates user session state as a variable
   - Provides reproducible test case

### Prevention Checklist

**For Dev Environment:**

- [ ] All API proxies log errors with stack traces
- [ ] Error responses include `details` field with error message
- [ ] Dev server restart after `vite.config.ts` changes

**For Code Organization:**

- [ ] No single file exceeds 500 lines (extract modules)
- [ ] AI actions isolated in `api/aiActions/` with individual logging
- [ ] Shared utilities in dedicated modules (`aiConfig.ts`, `eventUtils.ts`)
- [ ] Each module exports type-safe interfaces

**For Error Handling:**

- [ ] Granular try/catch blocks with specific error messages
- [ ] Prefix all console logs with `[moduleName]` for traceability
- [ ] Log success cases too: `[processInput] Success, items: 1`
- [ ] Separate error boundaries for primary and fallback services

**For Testing:**

- [ ] Test with fresh vault to eliminate session state issues
- [ ] Hard refresh + clear localStorage before reporting bugs
- [ ] Use browser automation for reproducible test cases
- [ ] Check server terminal logs, not just browser console

### File Structure After Refactoring

```
core/
├── useAura.ts              # 2146 lines (was 2311)
└── eventUtils.ts           # [NEW] ~200 lines

api/
├── gemini.ts               # 828 lines (was 887)
├── aiConfig.ts             # [NEW] ~120 lines
└── aiActions/
    └── processInput.ts     # [NEW] ~140 lines
```

### Verification

- ✅ `npm run doctor` passes (format, lint, typecheck, build)
- ✅ Browser automation test: Event "Tennis with Dexter" appeared correctly
- ✅ Server logs show: `[processInput] Success, items: 1`
- ✅ No 500 errors after dev server restart

### Time to Resolution

~2 hours (would be <30 minutes with proper error logging from the start)

### Impact

| Metric           | Before     | After         | Improvement |
| ---------------- | ---------- | ------------- | ----------- |
| `useAura.ts`     | 2311 lines | 2146 lines    | 7% smaller  |
| `api/gemini.ts`  | 887 lines  | 828 lines     | 7% smaller  |
| Error visibility | Hidden     | Detailed logs | Debuggable  |
| Testability      | Hard       | Easy          | Modular     |

---

## 2026-01-28: Dashboard Consolidation + Duplicate Key Fixes

### Issue

1.  **Duplicate Keys**: React console errors about duplicate keys for recommendations after activating a prep plan.
2.  **404 AlwaysPanels**: Console error `Failed to load AlwaysPanels.tsx` even after the file was deleted.
3.  **ToggleTask Logic**: Massive code duplication found in `toggleTask` causing maintenance risks.

### Root Causes

1.  **Blind State Prepending**: `activatePrepPlan` was blindly adding recommendations to the state array without checking if the ID already existed.
2.  **Barrel File Zombie**: The component `AlwaysPanels.tsx` was deleted, but `dashboard/index.ts` still exported it. `vite` tried to resolve the missing file via the barrel export.
3.  **Copy-Paste Error**: A block of code in `toggleTask` was accidentally duplicated inside itself during a previous refactor.

### Solution

1.  **Filter-Before-Add**: Updated `activatePrepPlan` in `useAura.ts` to filter out any existing recommendation with the same ID before prepending the new/updated one.
2.  **Clean Barrel File**: Removed `export { AlwaysPanels }` from `dashboard/index.ts`.
3.  **Consolidate Logic**: Removed the duplicated block in `toggleTask` and fixed the `LastAction` type mismatch (removed unsupported 'uncomplete' type).

### Key Learnings

- **State Arrays need ID checks**: Never blindly `[new, ...prev]`. Always `[new, ...prev.filter(i => i.id !== new.id)]`.
- **Barrel Files hide zombies**: Deleting a component file is not enough; you MUST check `index.ts` (barrel files) for lingering exports.
- **Deleted components cause 404s**: If the browser tries to load a module that the clean build thinks is there (via barrel), it fails at runtime.
- **DRY (Don't Repeat Yourself)**: Large functions like `useAura` are prone to copy-paste errors. Regular "doctor" scan and code review is vital.

### Prevention

- [ ] Check `index.ts` whenever deleting a file.
- [ ] Use `npm run doctor` to catch build errors (though regular 404s might slip through if types pass).
- [ ] Use `filter` pattern for all state array updates in `useAura`.

---

## 2026-01-28: E2E Harness + Grounded Event Prep

### Issue

Core loop changes needed automated validation (event prep grounding, task merge persistence, feedback loop). No E2E harness existed.

### Solution

- Added Playwright E2E tests (`npm run test:e2e`) with deterministic stubs for `/api/gemini`.
- Introduced `E2E_LIVE_AI=1` to run against real Gemini; otherwise tests use stable mocks.
- Added `VITE_E2E=1` in Playwright dev server to enable feedback actions on demo recommendations.
- Added `data-testid` hooks for LogBar, UpcomingCalendar event cards, PrepPlanModal steps, FocusList prep groups, and StatusSidebar rec cards.
- Implemented Gemini Google Search grounding for `generateEventPrepPlan`, with fallback to non-search if grounding fails.

### Key Learnings

- **Grounding models must be non-preview**: Use `GEMINI_MODEL_RESEARCH` with a search-supported Gemini model (e.g., `gemini-2.5-flash`).
- **Deterministic tests need mocks**: Stub `/api/gemini` by default to keep E2E stable and fast.
- **UI affordances matter for testing**: Collapsible prep groups require explicit expansion before asserting task presence.
- **Local dev server permissions**: If Playwright fails to bind `127.0.0.1:4173` (EPERM), re-run with escalated permissions.

### Prevention

- Keep E2E stubs in place for core loop smoke tests.
- Use `E2E_LIVE_AI=1` periodically to validate live grounding and API behavior.

---

## 2026-01-28: Grounding Toggle + Source Capture

### Issue

Grounding added latency/cost when always enabled; sources were stored but not tracked in prep-plan activation history.

### Solution

- Added explicit grounding toggle via event markers (`#research` / `[research]`).
- Stored grounded source URLs in prep-plan activation memory metadata for traceability.

### Key Learnings

- **Explicit grounding beats default**: search should be opt-in to avoid unnecessary latency/cost.
- **Persist sources in memory**: even without UI, keep citations in the KG for auditability.

### Prevention

- Keep grounding opt-in and document markers in agent/docs.

---

## 2026-01-29: Latency Optimizations + Adaptive Daily Batch Routing

### Issue

Perceived latency remained high due to repeated vault persistence and conservative Pro-only daily batch usage. Performance baselines were not consistently measured.

### Solution

- Added performance markers for log intake, daily batch refresh, and vault persistence.
- Debounced vault saves and batched memory/profile updates to reduce redundant persistence.
- Added incremental memory dedup with a hash index for faster appends.
- Implemented adaptive routing for `dailyIntelligenceBatch` (Flash default → Pro on validation risk).
- Trimmed oversized daily digest entries to avoid prompt bloat.

### Key Learnings

- **Vault persistence is a latency multiplier**: redundant saves materially slow perceived responsiveness.
- **Adaptive routing preserves quality** when paired with schema validation and Pro fallback.
- **Prompt size control** reduces tail latency without sacrificing core context.

### Prevention

- Keep perf markers in place and track SLOs for first log vs subsequent logs.
- Maintain Pro escalation criteria and schema-validation gate for daily batch.

---

## 2026-01-30: Agent Automation + UI Safety Framework

### Summary

Implemented a portable agent workflow system with automation discovery, UI safety guardrails, CI checks, and latency/cost baselines.

### Key Learnings

- **Cost guardrails must be net-new only** to avoid false positives on refactors.
- **Approvals should be centralized** in a regex allowlist for cost-neutral AI call refactors.
- **UI smoke tests are more stable** when they target `data-testid` anchors instead of text content.
- **Code-splitting across major views** removes build chunk warnings and reduces load risk.
- **Single wrapper scripts** reduce cognitive overhead and ensure consistent safety checks.

### Prevention / Process

- Use `./scripts/run-ui-safe.sh` for UI/UX changes.
- Use `.agent/COST_APPROVALS.md` for known cost-neutral AI call additions.
- CI guardrails enforce cost/architecture checks on core changes.
