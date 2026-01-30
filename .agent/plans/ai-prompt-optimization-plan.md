# AI Prompt & Architecture Optimization Plan

> **Last updated**: 2026-01-30 | **Status**: Proposed  
> **Dependencies**: None (does not overlap with `latency-optimization-plan.md`)

---

## Executive Summary

This plan optimizes the AI system for **clarity** and **cost** without impacting latency (handled separately). Key improvements:

1. **Prompt Humanization** — AI outputs use everyday language, not developer jargon
2. **Expanded Deterministic Parsing** — Handle 30%+ more logs without AI calls
3. **Unit Tests** — Safe iteration on parsing logic
4. **Documentation** — Updated agent context

**Estimated Impact:**

- 📉 ~30% reduction in AI API calls (cost savings)
- 👤 Clearer recommendations users can understand immediately
- 🧪 Reliable parser changes via test coverage

---

## Problem Statement

### Issue 1: Technical Jargon in User-Facing Outputs

Current prompts produce outputs with developer-oriented language that confuse users:

| Field              | Current AI Output                                               | User Confusion               |
| ------------------ | --------------------------------------------------------------- | ---------------------------- |
| `rationale`        | "Leverage morning energy optimization for cognitive throughput" | "What does this mean?"       |
| `definitionOfDone` | "Atomic task completion state achieved"                         | "Unclear when I'm done"      |
| `methodology`      | "Apply Pareto prioritization cadence"                           | "How do I actually do this?" |

**UI Impact Verified:** These fields are displayed directly in:

- `dashboard/StatusSidebar.tsx` (recommendations, chips)
- `dashboard/FocusList.tsx` (task details)
- `command/PrepPlanModal.tsx` (event prep)

### Issue 2: Limited Deterministic Parsing

The existing `core/logParser.ts` only handles **expense logs** (e.g., "spent $50 at Starbucks"). Many other common patterns require AI calls when they could be parsed deterministically:

| Pattern Type     | Example                   | Current    | Proposed |
| ---------------- | ------------------------- | ---------- | -------- |
| Expenses         | "spent $50"               | ✅ Parsed  | ✅ Keep  |
| Date/time events | "meeting tomorrow at 3pm" | ❌ AI call | ✅ Parse |
| Simple meals     | "had lunch at McDonald's" | ❌ AI call | ✅ Parse |
| Time expressions | "at 10am", "next Friday"  | ❌ AI call | ✅ Parse |

**Cost Impact:** With 9-10 logs/day, ~30% could bypass AI:

- Current: ~10 AI calls/day × $0.001 = $0.01/day
- After: ~7 AI calls/day × $0.001 = $0.007/day
- **Savings: ~30% on per-log AI costs**

### Issue 3: No Unit Tests for Parsers

Changes to parsing logic are risky because there are no tests. This blocks safe iteration.

---

## Proposed Changes

### Phase A: Prompt Output Humanization

#### A.1 — Add TONE instruction to all prompts

**Files:** `ai/prompts.ts`

Add this instruction block to each prompt template:

```
TONE GUIDELINES:
- Write for a busy professional, not a developer
- Use everyday words: "each day" not "daily cadence"
- Avoid jargon: "leverage", "optimize", "atomic", "horizon", "cadence"
- Be warm and direct: "You should..." not "It is recommended that..."
- For rationale: explain WHY in 1-2 simple sentences a friend would understand
- For definitionOfDone: write "Done when [specific outcome]"
```

**Specific prompt updates:**

| Prompt                            | Change                                           |
| --------------------------------- | ------------------------------------------------ |
| `HYPER_PERSONALIZED_PROMPT`       | Add tone guidelines + update schema descriptions |
| `LOG_BAR_INGEST_PROMPT`           | Add clarifying question tone instruction         |
| `DAILY_INTELLIGENCE_BATCH_PROMPT` | Add tone guidelines for insights/tasks           |
| `DAILY_PLAN_PROMPT`               | Update methodology and rationale instructions    |

#### A.2 — Add humanize() post-processor

**Files:** `api/gemini.ts`

Create a utility function to clean jargon from AI outputs:

```typescript
const JARGON_MAP: Record<string, string> = {
  leverage: 'use',
  optimize: 'improve',
  cadence: 'schedule',
  atomic: 'small',
  'cognitive throughput': 'focus',
  'operating methodology': 'approach',
  execute: 'do',
  actionable: 'clear',
};

function humanize(text: string): string {
  let result = text;
  for (const [jargon, plain] of Object.entries(JARGON_MAP)) {
    result = result.replace(new RegExp(jargon, 'gi'), plain);
  }
  return result;
}
```

Apply to:

- `recommendation.rationale`
- `recommendation.methodology`
- `task.definitionOfDone`
- `task.methodology`
- `insight.description`

---

### Phase B: Expand Deterministic Parsing

#### B.1 — Add date/time event parser

**Files:** `core/logParser.ts`

```typescript
const DATE_PATTERNS = [
  /\b(today|tomorrow|tonight)\b/i,
  /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bon\s+(\d{1,2}(?:\/|-)\d{1,2})/i,
];

const TIME_PATTERNS = [
  /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
];

export function parseDateTimeEvent(
  input: string,
  meta: DeterministicParseInput
): DeterministicParseResult | null {
  // Implementation with date resolution
}
```

**Examples handled:**

- "meeting tomorrow at 3pm" → event with date + time
- "dentist next Friday" → event with resolved date
- "call John at 10am" → task with time

#### B.2 — Add simple meal parser

**Files:** `core/logParser.ts`

```typescript
const MEAL_PATTERNS = [
  /\b(had|ate|eating|grabbed)\s+(breakfast|lunch|dinner|snack)\b/i,
  /\b(breakfast|lunch|dinner)\s+at\s+([^,]+)/i,
];

export function parseSimpleMeal(
  input: string,
  meta: DeterministicParseInput
): DeterministicParseResult | null {
  // Implementation
}
```

**Examples handled:**

- "had lunch at McDonald's" → health_record with location
- "ate breakfast" → health_record
- "dinner with Sarah at 7pm" → could be event (pass to AI)

#### B.3 — Wire parsers in useAura

**Files:** `core/useAura.ts`

Update the parsing chain:

```typescript
const deterministic =
  parseLogDeterministically(input, meta) || // expenses
  parseDateTimeEvent(input, meta) || // events with dates/times
  parseSimpleMeal(input, meta); // simple meals

if (deterministic && deterministic.confidence >= 0.7) {
  // Use deterministic result, skip AI
}
```

---

### Phase C: Unit Tests

#### C.1 — Create parser test file

**Files:** `core/logParser.test.ts` [NEW]

```typescript
import { describe, it, expect } from 'vitest';
import { parseLogDeterministically, parseDateTimeEvent, parseSimpleMeal } from './logParser';

describe('parseLogDeterministically', () => {
  it('parses expense with currency symbol', () => {
    const result = parseLogDeterministically('spent $50 at lunch', {
      ownerId: 'user1',
      currentDate: '2026-01-30',
    });
    expect(result?.intent).toBe('finance');
    expect(result?.items[0].fields.amount).toBe(50);
  });

  it('returns null for non-expense', () => {
    const result = parseLogDeterministically('I love coffee', {
      ownerId: 'user1',
      currentDate: '2026-01-30',
    });
    expect(result).toBeNull();
  });
});

describe('parseDateTimeEvent', () => {
  it('parses "tomorrow at 3pm"', () => {
    const result = parseDateTimeEvent('meeting tomorrow at 3pm', {
      ownerId: 'user1',
      currentDate: '2026-01-30',
    });
    expect(result?.intent).toBe('event');
    expect(result?.items[0].fields.time).toBe('15:00');
  });
});

describe('parseSimpleMeal', () => {
  it('parses meal with location', () => {
    const result = parseSimpleMeal("had lunch at McDonald's", {
      ownerId: 'user1',
      currentDate: '2026-01-30',
    });
    expect(result?.intent).toBe('health');
    expect(result?.items[0].fields.location).toBe("McDonald's");
  });
});
```

#### C.2 — Add test script

**Files:** `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

### Phase D: Documentation

#### D.1 — Update .agent/README.md

Add sections:

```markdown
## AI Output Humanization

All AI outputs are post-processed to use everyday language. The `humanize()`
function in `api/gemini.ts` replaces jargon with plain words.

## Deterministic Parsing

The system bypasses AI for these patterns (faster + cheaper):

- **Expenses**: "spent $50 at X" → finance_record
- **Date/time events**: "meeting tomorrow at 3pm" → event
- **Simple meals**: "had lunch at X" → health_record

Parsers are in `core/logParser.ts` with tests in `core/logParser.test.ts`.
```

---

## Implementation Order

| Phase | Task                | Files                    | Time | Risk |
| ----- | ------------------- | ------------------------ | ---- | ---- |
| A.1   | Add TONE to prompts | `ai/prompts.ts`          | 45m  | Low  |
| A.2   | Add humanize()      | `api/gemini.ts`          | 30m  | Low  |
| B.1   | Date/time parser    | `core/logParser.ts`      | 1.5h | Low  |
| B.2   | Meal parser         | `core/logParser.ts`      | 45m  | Low  |
| B.3   | Wire parsers        | `core/useAura.ts`        | 15m  | Low  |
| C.1   | Add unit tests      | `core/logParser.test.ts` | 1h   | Low  |
| D.1   | Update docs         | `.agent/README.md`       | 20m  | Low  |

**Total: ~5 hours**

---

## Verification Plan

### Automated

```bash
npm run test          # Unit tests pass
npm run doctor        # Build + lint + typecheck pass
```

### Manual Tests

| Test    | Input                                                            | Expected Behavior           |
| ------- | ---------------------------------------------------------------- | --------------------------- |
| Expense | "spent $45 at Starbucks"                                         | Deterministic parse (no AI) |
| Event   | "meeting tomorrow at 3pm"                                        | Deterministic parse (no AI) |
| Meal    | "had lunch at McDonald's"                                        | Deterministic parse (no AI) |
| Complex | "I should schedule a call with John next week about the project" | Falls back to AI            |
| Clarity | Log any task, check rationale                                    | Should use everyday words   |

### Quality Checks

1. **No regressions**: Existing expense parsing still works
2. **Fallback works**: Complex inputs still route to AI
3. **UI clarity**: Open dashboard, read a recommendation — should make sense immediately

---

## Non-Overlap Confirmation

This plan **does not touch** items in `latency-optimization-plan.md`:

| Latency Plan Item              | This Plan    |
| ------------------------------ | ------------ |
| ❌ Batch memory updates        | Not included |
| ❌ Debounced vault persistence | Not included |
| ❌ Model routing               | Not included |
| ❌ Prompt slimming             | Not included |
| ❌ Set for category lookup     | Not included |

---

## Expected Outcomes

| Metric                            | Before    | After |
| --------------------------------- | --------- | ----- |
| AI calls per log                  | ~100%     | ~70%  |
| User understanding of "rationale" | Confusing | Clear |
| Parser test coverage              | 0%        | ~80%  |
| Safe to iterate on parsers        | No        | Yes   |

---

## Risks & Mitigations

| Risk                                  | Impact | Mitigation                                           |
| ------------------------------------- | ------ | ---------------------------------------------------- |
| Date parsing edge cases               | Medium | Confidence threshold (0.7) falls back to AI          |
| Humanize() removes useful specificity | Low    | Review before applying; keep technical terms in logs |
| New parsers have bugs                 | Low    | Unit tests + gradual rollout                         |
