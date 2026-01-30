# Areté Life OS Latency Optimization Plan (Rev 2026-01-29)

## Executive Summary

The pipeline now centers on a **single daily batch call** (`dailyIntelligenceBatch`) plus a **weekly deep tasks** call, so the previous 4-call parallel model is outdated. This revised plan targets measurable improvements without sacrificing recommendation quality:

1. **No-regression latency wins** (batch state writes, reduce redundant persistence)
2. **AI request optimization** (prompt slimming + adaptive model routing)
3. **Infra readiness for scale** (cold-start mitigation, observability, strict latency budgets)
4. **Perceived speed** improvements (progressive UI updates where safe)

---

## Current Flow (Updated)

```
LogBar → processInput (Gemini Flash-Lite) → local commit → debounced refresh
refreshAura → dailyIntelligenceBatch (Gemini Pro)
weekly: generateDeepTasks (Gemini Pro)
```

**Critical path today:** AI latency + vault persistence. Multiple state updates trigger multiple `saveVault()` calls.

---

## Goals and Quality Guardrails

- **No quality regression**: keep Zod validation and fallback behavior.
- **Zero-knowledge intact**: no plaintext at rest, no cross-user caching.
- **Perceived latency**: tasks visible faster without skipping evidence grounding.

---

## Phase 0: Measurement and Guardrails (Must-do)

**Goal:** establish reliable baselines and prevent regressions.

1. **Add perf markers** in `core/useAura.ts`:
   - `logMemory()` start → `processInput()` end
   - `refreshAura()` start → `dailyIntelligenceBatch` end
   - `saveVault()` start → end
2. **Track two scenarios**:
   - First log of day (daily batch runs)
   - Subsequent logs (no batch)
3. **Define SLOs**:
   - First log: tasks visible ≤ 4.5s
   - Subsequent logs: ≤ 1.2s perceived
4. **Quality gates**:
   - Zod validation required (no change)
   - AI failures must still persist logs with `extractionQualityNotes`

---

## Phase 1: Safe Quick Wins (250-700ms)

### 1.1 Batch memory updates in `logMemory()`

**Problem:** multiple `setMemoryItems()` calls trigger multiple vault saves.

**Safe approach:** keep immediate insert for UX, but merge later updates into a single batched call.

**Impact:** 100-400ms

---

### 1.2 Use `Set` for category lookup in `buildMemoryContext()`

**Problem:** `Array.includes()` is O(n) per item.

**Impact:** 20-120ms for large memory sets

---

### 1.3 Batch profile updates in `commitClaims()`

**Problem:** `setProfile()` called inside a loop.

**Impact:** 50-100ms, fewer vault persists

---

## Phase 2: Vault Optimization (300-800ms)

### 2.1 Debounce vault persistence

**Problem:** every state change triggers `saveVault()`.

**Solution:** debounce to 1s and flush on lock/unload.

**Impact:** 200-600ms

---

### 2.2 Incremental deduplication for memory appends

**Problem:** full `contentHash()` scan on every append.

**Solution:** maintain a hash index in a ref; sync on load/delete.

**Impact:** 5-50ms per append

---

## Phase 3: AI Request Optimization (300-900ms)

### 3.1 Prompt slimming for daily batch

**Goal:** reduce prompt size without losing relevance.

- Use `buildCompactProfile()` consistently
- Keep memory context to top-N by relevance
- Avoid full content for batch if summaries suffice

**Impact:** 100-300ms

---

### 3.2 Adaptive model routing with quality fallback

**Goal:** use faster model when safe, escalate on risk.

**Strategy:**

- Default to Flash for daily batch when data is stable
- Escalate to Pro when:
  - Missing data is high
  - Memory volume spikes
  - Zod validation fails
- Keep OpenAI fallback for reliability

**Impact:** 200-600ms, quality preserved via fallback

---

## Phase 4: Infra and Scaling Readiness (High leverage)

### 4.1 Cold start mitigation

- Warm serverless endpoints on a schedule (if policy allows)
- Prefer region affinity to reduce cross-region hops

### 4.2 Structured observability

- Log: `action`, `model`, `promptTokens`, `latencyMs`, `fallbackUsed`
- Alert on model error spikes and cold start bursts

### 4.3 Latency budgeting

- Hard latency budgets per action; defer non-critical tasks if exceeded

---

## Implementation Order (Updated)

| Phase | Change                      | Files             | Est. Time | Savings     |
| ----- | --------------------------- | ----------------- | --------- | ----------- |
| 1.1   | Batch memory updates        | `core/useAura.ts` | 1h        | 100-400ms   |
| 1.2   | Set for category lookup     | `ai/prompts.ts`   | 15m       | 20-120ms    |
| 1.3   | Batch profile updates       | `core/useAura.ts` | 30m       | 50-100ms    |
| 2.1   | Debounced vault persistence | `core/useAura.ts` | 1h        | 200-600ms   |
| 2.2   | Incremental dedup           | `core/useAura.ts` | 1h        | 5-50ms      |
| 3.1   | Prompt slimming             | `api/gemini.ts`   | 1h        | 100-300ms   |
| 3.2   | Model routing w/ fallback   | `api/gemini.ts`   | 2h        | 200-600ms   |
| 4.x   | Infra + observability       | `api/gemini.ts`   | 2-4h      | 200-800ms\* |

\*Measured as reduced cold-start and tail latency.

---

## Expected Results (Ranges)

### Baseline (first log of day)

```
Log Input → Initial Response:  2.0-3.0s
Full Dashboard Update:         4.5-5.5s
```

### After Phase 1-2

```
Full Dashboard Update:         3.9-4.6s
```

### After Phase 3-4

```
Full Dashboard Update:         3.4-4.0s
```

---

## Risks and Mitigations

| Risk                               | Impact          | Mitigation                                |
| ---------------------------------- | --------------- | ----------------------------------------- |
| Debounce causes data loss on crash | Low (1s window) | Flush on lock/unload                      |
| Model routing lowers quality       | Medium          | Escalate on Zod failure or low confidence |
| Race conditions in batching        | Medium          | Use `useRef` + merge carefully            |

---

## Verification Steps

1. `npm run doctor` after each phase
2. Manual tests:
   - Log 1 sentence → measure task appearance time
   - Log with 3 attachments → measure total time
   - Run onboarding → measure deep init time
3. Quality checks:
   - Spot-check grounding in recommendations
   - Confirm fallback behavior on AI failure

---

## Recommended AI Backend Strategy (Scaled to Millions)

**Best-practice approach for an AI BE dev focused on latency and reliability:**

1. **Hard SLOs with error budgets**
   - Strict budgets per action; defer non-critical work when exceeded.

2. **Request shaping and prompt budgeting**
   - Deterministic truncation rules and compact summaries.
   - Cap prompt tokens per action to prevent tail latency spikes.

3. **Adaptive routing with quality guardrails**
   - Fast model by default, auto-escalate on validation failure.
   - Multi-provider fallback to maintain uptime.

4. **Queue non-critical work**
   - Deep tasks or enrichment should run in background jobs.
   - Use idle-time processing to avoid blocking UX.

5. **Strong observability**
   - Structured tracing with `action`, `model`, `latencyMs`, `tokens`.
   - Alert on cold starts and model error spikes.

6. **Cold start mitigation**
   - Regional warmers or scheduled pings.
   - Keep serverless payloads small to reduce startup time.

7. **Quality-first fallback**
   - Zod validation as a gate.
   - Confidence-driven escalation before surfacing output.
