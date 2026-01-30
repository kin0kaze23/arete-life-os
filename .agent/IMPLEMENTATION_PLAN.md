# Areté Life OS - Comprehensive Implementation Plan

> **For GPT Codex Agents** - This document provides detailed specifications for implementing UX improvements, code optimizations, and architectural enhancements.

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Critical Issues & Duplications](#2-critical-issues--duplications)
3. [Knowledge Graph Optimization](#3-knowledge-graph-optimization)
4. [Data Flow Improvements](#4-data-flow-improvements)
5. [Prompt Flow Optimization](#5-prompt-flow-optimization)
6. [UX Feature Implementations](#6-ux-feature-implementations)
7. [UI Consistency Standards](#7-ui-consistency-standards)
8. [Implementation Sequence](#8-implementation-sequence)

---

## 1. Repository Structure

```
areté-life-os/
├── app/                    # App shell & error boundary
├── layout/                 # Header & Sidebar
├── dashboard/              # Dashboard views & domain panels
│   ├── DashboardView.tsx   # Main dashboard (417 lines)
│   ├── DoWatchSection.tsx  # Do/Watch panels
│   ├── AlwaysPanels.tsx    # Always-Do/Watch chips
│   ├── DomainPanels.tsx    # 5 pillar domain cards
│   ├── corePillars.tsx     # Pillar definitions
│   └── domainUtils.ts      # Coverage scoring
├── vault/                  # Knowledge Graph & encrypted vault
├── stream/                 # Life Stream timeline
├── command/                # LogBar, CommandPalette
├── chat/                   # Chat interface
├── settings/               # Settings views
├── onboarding/             # Onboarding flow
├── core/                   # useAura.ts (1280 lines) - central state
├── ai/                     # geminiService.ts - AI client
├── data/                   # types.ts, cryptoVault.ts, fileStore.ts
├── shared/                 # SharedUI.tsx, design-tokens.ts
└── api/                    # gemini.ts (702 lines) - server handler
```

---

## 2. Critical Issues & Duplications

### 2.1 Duplicate Code Detection

| Issue                           | Files                                                                                     | Description                                                                          | Fix                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Finance Metrics Calculation** | `core/useAura.ts:65-83`, `dashboard/DashboardView.tsx:66-123`                             | `computeFinanceMetrics()` and `extractFinanceMetrics()` are duplicated in both files | Centralize in `data/financeUtils.ts`     |
| **parseNumber Helper**          | `core/useAura.ts:58-63`, `dashboard/DashboardView.tsx:66-71`                              | Identical number parsing logic                                                       | Move to `shared/utils.ts`                |
| **HYPER_PERSONALIZED_PROMPT**   | `ai/geminiService.ts:15-68`, `api/gemini.ts:16-68`                                        | Entire prompt duplicated (53 lines)                                                  | Create `ai/prompts.ts` shared module     |
| **Always Items Generation**     | `dashboard/DashboardView.tsx:180-226` (Do), `dashboard/DashboardView.tsx:272-310` (Watch) | Similar logic for generating "Always" items in both Do and Watch                     | Create unified `getAlwaysItems()` helper |
| **Category Icon Mapping**       | `stream/LifeStreamView.tsx:214-228`, `dashboard/DomainPanels.tsx` (inline)                | Icon mapping duplicated                                                              | Centralize in `shared/categoryIcons.ts`  |

### 2.2 Duplicate UI Experiences

| Issue                          | Location                                                                   | Description                                                           | Fix                                                                          |
| ------------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Timeline in multiple views** | `stream/LifeStreamView.tsx`, `dashboard/DoWatchSection.tsx` (Soon horizon) | Events shown in both LifeStream and "Soon" Watch section              | Keep both but differentiate: LifeStream = full history, Soon = upcoming only |
| **Habit display**              | `dashboard/AlwaysPanels.tsx`, `vault/MemoryVaultView.tsx`                  | Habits shown in both Always-Do panel and Memory Vault                 | AlwaysPanels = active habits only, MemoryVault = all habit history           |
| **Recommendations display**    | `dashboard/DomainPanels.tsx`, `dashboard/DoWatchSection.tsx`               | Recommendations appear in both Domain panels and Do section           | Domain = domain-specific, Do = actionable today                              |
| **Finance metrics chips**      | `dashboard/AlwaysPanels.tsx:354-358`                                       | Same daily budget shown twice ("Daily budget" + "Today spend target") | Remove duplicate chip                                                        |

### 2.3 Action Items

```typescript
// FILE: shared/utils.ts (NEW)
export const parseNumber = (value: string): number | null => {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

// FILE: data/financeUtils.ts (NEW)
import { UserProfile, FinanceMetrics, MemoryEntry } from './types';
import { parseNumber } from '../shared/utils';

export const computeFinanceMetrics = (profile: UserProfile): FinanceMetrics | null => {
  const income = profile.finances.income ? parseNumber(profile.finances.income) : null;
  const fixed = profile.finances.fixedCosts ? parseNumber(profile.finances.fixedCosts) : null;
  const variable = profile.finances.variableCosts
    ? parseNumber(profile.finances.variableCosts)
    : null;
  if (income === null || fixed === null || variable === null) return null;
  return {
    income,
    fixed,
    variable,
    dailyVariableBudget: Math.round(variable / 30),
    weeklyVariableBudget: Math.round(variable / 4),
    savingsRate: Math.round(Math.max(0, (income - (fixed + variable)) / income) * 100),
  };
};

export const extractFinanceMetricsFromMemory = (memory: MemoryEntry[]): FinanceMetrics | null => {
  const latest = memory
    .filter((item) => item.metadata?.type === 'finance_metrics')
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  // ... validation logic
};

// FILE: ai/prompts.ts (NEW)
export const HYPER_PERSONALIZED_PROMPT = `...`; // Single source of truth
export const INTERNALIZATION_PROMPT = `...`;
export const ORACLE_PROMPT = `...`;
```

---

## 3. Knowledge Graph Optimization

### 3.1 Category Misassignment Issues

**Current Problems:**

1. **Default to GENERAL** - Too many items fall back to `Category.GENERAL` instead of proper categorization
2. **No PERSONAL category** - Personal domain uses `GENERAL + WORK + SOCIAL` as proxy
3. **HABIT vs metadata.type** - Inconsistent: some habits use `Category.HABIT`, others use `metadata.type: 'habit'`
4. **Missing category inference** - AI extraction doesn't always assign categories

**Fixes:**

```typescript
// FILE: data/types.ts - Add PERSONAL category
export enum Category {
  HEALTH = 'Health',
  FINANCE = 'Finance',
  RELATIONSHIPS = 'Relationships',
  SPIRITUAL = 'Spiritual',
  WORK = 'Work',
  SOCIAL = 'Social',
  PERSONAL = 'Personal', // ADD THIS
  MEALS = 'Meals',
  TRAVEL = 'Travel',
  HABIT = 'Habit',
  GENERAL = 'General',
}

// FILE: core/useAura.ts - Improve category detection in logMemory
const inferCategory = (content: string, facts: CategorizedFact[]): Category => {
  const text = content.toLowerCase();

  // Priority order based on keywords
  if (text.match(/\b(health|sleep|weight|exercise|gym|doctor|medication)\b/))
    return Category.HEALTH;
  if (text.match(/\b(money|budget|spend|income|salary|invest|save)\b/)) return Category.FINANCE;
  if (text.match(/\b(family|friend|partner|relationship|social)\b/)) return Category.RELATIONSHIPS;
  if (text.match(/\b(pray|church|meditat|spiritual|faith|god)\b/)) return Category.SPIRITUAL;
  if (text.match(/\b(work|job|meeting|project|deadline|client)\b/)) return Category.WORK;
  if (text.match(/\b(hobby|interest|goal|personal|self)\b/)) return Category.PERSONAL;

  // Use AI-extracted category if available
  if (facts.length > 0 && facts[0].category !== Category.GENERAL) {
    return facts[0].category;
  }

  return Category.GENERAL;
};
```

### 3.2 Claim Confidence Scoring

**Current Issue:** Confidence scores are arbitrary (0-100) without clear criteria.

**Fix:** Implement evidence-based confidence scoring:

```typescript
// FILE: data/claimUtils.ts (NEW)
export const calculateClaimConfidence = (
  fact: CategorizedFact,
  profile: UserProfile,
  existingClaims: Claim[]
): number => {
  let confidence = 50; // Base confidence

  // +20 if fact references specific profile data
  if (factMatchesProfile(fact, profile)) confidence += 20;

  // +15 if corroborated by existing claims
  if (hasCorroboratingClaims(fact, existingClaims)) confidence += 15;

  // +10 if from file source (vs text input)
  if (fact.sourceType === 'pdf' || fact.sourceType === 'image') confidence += 10;

  // +5 if has specific date
  if (fact.eventDate) confidence += 5;

  // -10 if conflicts with existing claim
  if (hasConflictingClaims(fact, existingClaims)) confidence -= 10;

  return Math.max(0, Math.min(100, confidence));
};
```

### 3.3 Pillar Coverage Calculation

**Current Issue:** `domainUtils.ts:91-107` weights profile at 60%, signals at 40%, but doesn't account for data freshness.

**Fix:** Add temporal decay:

```typescript
// FILE: dashboard/domainUtils.ts
export const getCoverageScore = (
  profile: UserProfile,
  memory: MemoryEntry[],
  sources: Source[],
  pillarId: string,
  categories: Category[]
) => {
  const profileScore = getProfileCoverage(profile, pillarId);
  const pillarMemory = getPillarMemory(memory, categories);
  const fileCount = getPillarSourceCount(memory, sources, categories);

  // Apply temporal decay - recent signals worth more
  const now = Date.now();
  const DECAY_DAYS = 30;
  const weightedMemoryCount = pillarMemory.reduce((sum, item) => {
    const daysOld = (now - item.timestamp) / (1000 * 60 * 60 * 24);
    const decay = Math.max(0.1, 1 - daysOld / DECAY_DAYS);
    return sum + decay;
  }, 0);

  const signalScore = Math.min(40, weightedMemoryCount * 2 + fileCount * 6);

  return {
    total: Math.min(100, Math.round(profileScore * 0.6 + signalScore)),
    profileScore,
    memoryCount: pillarMemory.length,
    fileCount,
    freshness: weightedMemoryCount / Math.max(1, pillarMemory.length), // 0-1
  };
};
```

---

## 4. Data Flow Improvements

### 4.1 Current Data Flow

```
User Input (LogBar)
    ↓
useAura.logMemory()
    ↓
geminiService.processInput() → API /api/gemini
    ↓
AI extracts facts → Returns { facts, proposedUpdates }
    ↓
VerificationSheet (user review)
    ↓
useAura.commitClaims() → Updates claims, profile
    ↓
useAura.refreshAura() → Regenerates tasks, insights, blindSpots
    ↓
Dashboard re-renders
```

### 4.2 Issues & Fixes

| Issue                             | Location                                              | Fix                                                                    |
| --------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| **No batch processing**           | `useAura.ts:645-908`                                  | logMemory processes one input at a time; add queue for multiple inputs |
| **Redundant refreshAura calls**   | Multiple setTimeout(() => refreshAura(), 0) scattered | Debounce refreshAura with 500ms delay                                  |
| **Memory items not deduplicated** | appendMemoryItems prepends without checking           | Add deduplication by content hash                                      |
| **No optimistic updates**         | UI waits for AI response                              | Show pending state immediately, update when AI responds                |
| **Claims not linked to sources**  | Claims only link via sourceId                         | Add bidirectional links                                                |

### 4.3 Implementation

```typescript
// FILE: core/useAura.ts - Add debounced refresh
import { useMemo, useCallback, useRef } from 'react';

const useAura = () => {
  const refreshTimeoutRef = useRef<number | null>(null);

  const debouncedRefreshAura = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshAura();
    }, 500);
  }, [refreshAura]);

  // Replace all setTimeout(() => refreshAura(), 0) with debouncedRefreshAura()

  // Add content hash for deduplication
  const contentHash = (content: string) => {
    return content.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 100);
  };

  const appendMemoryItems = useCallback((items: MemoryItem[]) => {
    setMemoryItems((prev) => {
      const existingHashes = new Set(prev.map((m) => contentHash(m.content)));
      const newItems = items.filter((item) => !existingHashes.has(contentHash(item.content)));
      return [...newItems, ...prev];
    });
  }, []);
};
```

### 4.4 State Normalization

**Current:** Flat arrays for everything
**Recommended:** Normalize for O(1) lookups

```typescript
// FILE: core/useAura.ts - Normalize state
type NormalizedState = {
  memoryItems: {
    byId: Record<string, MemoryItem>;
    allIds: string[];
    byCategory: Record<Category, string[]>;
  };
  claims: {
    byId: Record<string, Claim>;
    bySourceId: Record<string, string[]>;
    byStatus: Record<ClaimStatus, string[]>;
  };
  // ... etc
};

// Selectors for derived data
const useMemoryByCategory = (category: Category) => {
  return useMemo(
    () => state.memoryItems.byCategory[category]?.map((id) => state.memoryItems.byId[id]) || [],
    [state.memoryItems, category]
  );
};
```

---

## 5. Prompt Flow Optimization

**Status (2026-01-29):** Phase 0 prompt-flow optimization shipped.

- Daily intelligence batch replaces per-log tasks/insights/blind spots.
- Cadence gating: batch runs daily, deep tasks weekly unless forced.
- Intake uses Flash‑Lite with Pro retry; compact profile + 10 memory items.
- Deterministic expense parser added with confidence gating.
- Daily plan uses Flash with Pro fallback.
- Optional model router + provider scaffolding added behind `AI_USE_ROUTER=1`.

### 5.1 Current Prompt Issues

| Issue                               | Location                                             | Impact                              |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| **No context window management**    | `api/gemini.ts:193` slices last 30 items arbitrarily | May miss important older context    |
| **No prompt caching**               | Every request rebuilds full prompt                   | Unnecessary latency and cost        |
| **Generic input instructions**      | `api/gemini.ts:384-385` hardcoded string             | Should be dynamic based on context  |
| **Missing domain-specific prompts** | Only 3 prompts defined                               | Need specialized prompts per domain |
| **No output validation**            | JSON.parse without schema validation                 | AI can return malformed data        |

### 5.2 Prompt Improvements

```typescript
// FILE: ai/prompts.ts (NEW)

// Context window management - prioritize recent + relevant
export const buildMemoryContext = (
  memory: MemoryEntry[],
  categories: Category[],
  maxTokens: number = 4000
): MemoryEntry[] => {
  // Prioritize: recent (last 24h), then relevant categories, then recency
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const scored = memory.map((m) => ({
    item: m,
    score:
      (now - m.timestamp < DAY_MS ? 100 : 0) + // Recent boost
      (categories.includes(m.category) ? 50 : 0) + // Category relevance
      (100 - Math.min(100, ((now - m.timestamp) / (7 * DAY_MS)) * 100)), // Recency decay
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((s) => s.item);
};

// Domain-specific prompts
export const DOMAIN_PROMPTS: Record<string, string> = {
  health: `Focus on: sleep quality, activity levels, condition management, medication adherence.
           Safety: Never diagnose. Suggest clinician follow-up for concerning symptoms.`,
  finance: `Focus on: budget adherence, savings rate, spending patterns, investment opportunities.
            Include specific numbers from FINANCE_METRICS.`,
  relationships: `Focus on: connection frequency, social energy management, commitment balance.
                  Consider user's stated social goals.`,
  spiritual: `Focus on: practice consistency, value alignment, meaning/purpose.
              Respect stated worldview. Never impose beliefs.`,
  personal: `Focus on: career development, skill building, interest exploration.
             Align with stated roles and interests.`,
};

// Output schema validation
import { z } from 'zod'; // Add zod dependency

export const RecommendationSchema = z.object({
  category: z.enum([
    'Health',
    'Finance',
    'Relationships',
    'Spiritual',
    'Work',
    'Personal',
    'General',
  ]),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  impactScore: z.number().min(1).max(10),
  rationale: z.string().min(20),
  steps: z.array(z.string()).min(1).max(10),
  estimatedTime: z.string(),
  inputs: z.array(z.string()),
  definitionOfDone: z.string(),
  risks: z.array(z.string()),
});

export const validateAIOutput = <T>(schema: z.ZodSchema<T>, data: unknown): T | null => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.error('AI output validation failed:', result.error);
  return null;
};
```

### 5.3 Enhanced Hyper-Personalization

```typescript
// FILE: ai/prompts.ts

export const buildHyperPersonalizedPrompt = (
  profile: UserProfile,
  memory: MemoryEntry[],
  financeMetrics: FinanceMetrics | null,
  targetDomain?: string
) => {
  const domainContext = targetDomain ? DOMAIN_PROMPTS[targetDomain] : '';

  // Extract behavioral patterns from memory
  const patterns = extractBehavioralPatterns(memory);

  // Identify value conflicts
  const valueConflicts = findValueConflicts(profile.spiritual.coreValues, memory);

  return `
You are ${profile.identify.name}'s personal Chief of Staff within the Areté framework.

## PROFILE SNAPSHOT
- Name: ${profile.identify.name}
- Location: ${profile.identify.location || 'Not specified'}
- Role: ${profile.personal.jobRole || 'Not specified'} at ${profile.personal.company || 'Not specified'}
- Core Values: ${profile.spiritual.coreValues.join(', ') || 'Not defined'}
- Worldview: ${profile.spiritual.worldview || 'Not specified'}
- Health Conditions: ${profile.health.conditions.join(', ') || 'None reported'}
- Social Energy: ${profile.relationship.socialEnergy || 'Not specified'}

## BEHAVIORAL PATTERNS DETECTED
${patterns.map((p) => `- ${p}`).join('\n')}

## VALUE ALIGNMENT CONCERNS
${valueConflicts.length > 0 ? valueConflicts.map((c) => `- ${c}`).join('\n') : 'No conflicts detected'}

## FINANCE METRICS
${
  financeMetrics
    ? `
- Monthly Income: $${financeMetrics.income.toLocaleString()}
- Fixed Costs: $${financeMetrics.fixed.toLocaleString()}
- Variable Budget: $${financeMetrics.variable.toLocaleString()}
- Daily Target: $${financeMetrics.dailyVariableBudget}
- Weekly Target: $${financeMetrics.weeklyVariableBudget}
- Savings Rate: ${financeMetrics.savingsRate}%
`
    : 'Not available - prompt user to complete financial profile'
}

${domainContext}

## CRITICAL INSTRUCTIONS
1. CITE EVIDENCE: Every recommendation MUST reference specific data from profile or memory
2. BE SPECIFIC: Use actual numbers, names, dates from the data
3. ALIGN WITH VALUES: Score recommendations against core values
4. ACTIONABLE: Every task needs atomic steps, not vague advice
5. PERSONALIZE: Reference their specific situation, not generic advice

Generate recommendations that will make ${profile.identify.name} feel understood.
`;
};

const extractBehavioralPatterns = (memory: MemoryEntry[]): string[] => {
  const patterns: string[] = [];

  // Frequency analysis
  const categoryFreq = memory.reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topCategory = Object.entries(categoryFreq).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    patterns.push(`Most active domain: ${topCategory[0]} (${topCategory[1]} entries)`);
  }

  // Time-of-day patterns
  const hourCounts = memory.reduce(
    (acc, m) => {
      const hour = new Date(m.timestamp).getHours();
      const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      acc[period] = (acc[period] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const peakTime = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  if (peakTime) {
    patterns.push(`Peak activity: ${peakTime[0]}`);
  }

  return patterns;
};
```

---

## 6. UX Feature Implementations

### 6.1 Feature 1: Vertical Calendar Widget

**Files to create:**

- `dashboard/UpcomingCalendar.tsx`
- `dashboard/EventPrepPopup.tsx`

**Implementation:**

```typescript
// FILE: dashboard/UpcomingCalendar.tsx
import React, { useState } from 'react';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { TimelineEvent, UserProfile, MemoryEntry, Recommendation } from '../data/types';
import { EventPrepPopup } from './EventPrepPopup';
import { generateEventPrepPlan } from '../ai/geminiService';

interface UpcomingCalendarProps {
  timelineEvents: TimelineEvent[];
  profile: UserProfile;
  memory: MemoryEntry[];
  onNavigate: (tab: string) => void;
}

export const UpcomingCalendar: React.FC<UpcomingCalendarProps> = ({
  timelineEvents,
  profile,
  memory,
  onNavigate,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [prepPlan, setPrepPlan] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const upcomingEvents = timelineEvents
    .map(event => ({
      ...event,
      daysUntil: Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }))
    .filter(e => e.daysUntil >= 0 && e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  const handleEventClick = async (event: TimelineEvent) => {
    setSelectedEvent(event);
    setIsLoading(true);
    try {
      const plan = await generateEventPrepPlan(event, profile, memory);
      setPrepPlan(plan);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
    };
  };

  return (
    <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40 sticky top-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar size={14} className="text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          Upcoming
        </span>
      </div>

      {upcomingEvents.length > 0 ? (
        <div className="space-y-4">
          {upcomingEvents.map(event => {
            const { month, day } = formatDate(event.date);
            return (
              <button
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-slate-900/60 hover:border-indigo-500/30 transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-black text-indigo-400 uppercase">{month}</span>
                  <span className="text-lg font-black text-white">{day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{event.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {event.daysUntil === 0 ? 'Today' :
                     event.daysUntil === 1 ? 'Tomorrow' :
                     `${event.daysUntil} days away`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[10px] text-slate-500">No upcoming events</p>
          <button
            onClick={() => onNavigate('stream')}
            className="mt-3 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
          >
            Add Event
          </button>
        </div>
      )}

      <button
        onClick={() => onNavigate('stream')}
        className="w-full mt-4 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all"
      >
        View All Events →
      </button>

      {selectedEvent && (
        <EventPrepPopup
          event={selectedEvent}
          prepPlan={prepPlan}
          isLoading={isLoading}
          onClose={() => {
            setSelectedEvent(null);
            setPrepPlan(null);
          }}
        />
      )}
    </div>
  );
};
```

```typescript
// FILE: dashboard/EventPrepPopup.tsx
import React from 'react';
import { X, CheckCircle2, AlertTriangle, Package, Sparkles } from 'lucide-react';
import { TimelineEvent, Recommendation } from '../data/types';
import { Skeleton } from '../shared/SharedUI';

interface EventPrepPopupProps {
  event: TimelineEvent;
  prepPlan: Recommendation | null;
  isLoading: boolean;
  onClose: () => void;
}

export const EventPrepPopup: React.FC<EventPrepPopupProps> = ({
  event,
  prepPlan,
  isLoading,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-[#0a0b10] border border-white/10 rounded-[2rem] p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-indigo-400 mb-1">Preparation Plan</p>
            <h3 className="text-xl font-black text-white">{event.title}</h3>
            <p className="text-[10px] text-slate-500 mt-1">{event.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : prepPlan ? (
          <div className="space-y-5">
            {/* What to Prepare */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                  What to Prepare
                </span>
              </div>
              <ul className="space-y-2">
                {prepPlan.steps?.slice(0, 4).map((step, i) => (
                  <li key={i} className="text-[10px] text-slate-300 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* What to Watch For */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                  What to Watch For
                </span>
              </div>
              <ul className="space-y-2">
                {prepPlan.risks?.slice(0, 3).map((risk, i) => (
                  <li key={i} className="text-[10px] text-slate-300">• {risk}</li>
                ))}
              </ul>
            </div>

            {/* Things Needed */}
            <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Package size={14} className="text-sky-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">
                  Things Needed Beforehand
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {prepPlan.inputs?.map((input, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-slate-900 text-[9px] font-black text-slate-400 border border-white/5">
                    {input}
                  </span>
                ))}
              </div>
            </div>

            {/* Why */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-indigo-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  AI Rationale
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{prepPlan.rationale}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[10px] text-slate-500">Unable to generate preparation plan</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 6.2 Feature 2: Enhanced Always-Do/Watch with Tooltips

**Files to modify:**

- `data/types.ts` - Add AlwaysChip interface
- `dashboard/DashboardView.tsx` - Update chip generation
- `dashboard/AlwaysPanels.tsx` - Add tooltip support

```typescript
// FILE: data/types.ts - Add new interface
export interface AlwaysChip {
  id: string;
  label: string;
  rationale: string;
  source: 'profile' | 'ruleOfLife' | 'health' | 'finance' | 'spiritual' | 'computed';
  profileField?: string;
  priority: 'high' | 'medium' | 'low';
}

// FILE: dashboard/DashboardView.tsx - Update chip generation
const alwaysDoChips = useMemo<AlwaysChip[]>(() => {
  const chips: AlwaysChip[] = [];

  if (profile.health.sleepTime && profile.health.wakeTime) {
    chips.push({
      id: 'sleep-window',
      label: `Sleep ${profile.health.sleepTime} → ${profile.health.wakeTime}`,
      rationale: `You've set ${profile.health.sleepTime} bedtime and ${profile.health.wakeTime} wake time. Consistent sleep improves cognitive performance, especially for your ${profile.personal.jobRole || 'role'}.`,
      source: 'health',
      profileField: 'health.sleepTime',
      priority: 'high',
    });
  }

  if (ruleOfLife?.nonNegotiables?.devotion && profile.spiritual.worldview) {
    chips.push({
      id: 'devotion',
      label: `${profile.spiritual.practicePulse || 'Daily'} Devotion`,
      rationale: `Your worldview is ${profile.spiritual.worldview} with ${profile.spiritual.practicePulse || 'regular'} spiritual practice. Consistency strengthens alignment with your core values.`,
      source: 'spiritual',
      profileField: 'spiritual.practicePulse',
      priority: 'medium',
    });
  }

  if (profile.spiritual.coreValues?.length > 0) {
    chips.push({
      id: 'core-values',
      label: `Values: ${profile.spiritual.coreValues.slice(0, 2).join(', ')}`,
      rationale: `These core values guide your decision-making. ${profile.spiritual.coreValues[0]} and ${profile.spiritual.coreValues[1] || 'others'} should influence daily choices.`,
      source: 'profile',
      profileField: 'spiritual.coreValues',
      priority: 'high',
    });
  }

  return chips;
}, [profile, ruleOfLife]);

// FILE: dashboard/AlwaysPanels.tsx - Add tooltip component
interface ChipWithTooltipProps {
  chip: AlwaysChip;
  colorClass: string;
}

const ChipWithTooltip: React.FC<ChipWithTooltipProps> = ({ chip, colorClass }) => (
  <div className="relative group">
    <span className={`px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest cursor-help transition-all ${colorClass}`}>
      {chip.label}
    </span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 w-72 pointer-events-none shadow-2xl">
      <p className="text-[10px] text-slate-300 leading-relaxed">{chip.rationale}</p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
        <span className="text-[8px] text-slate-500 uppercase tracking-widest">Source: {chip.source}</span>
        <span className={`text-[8px] uppercase tracking-widest ${
          chip.priority === 'high' ? 'text-rose-400' :
          chip.priority === 'medium' ? 'text-amber-400' : 'text-slate-500'
        }`}>
          {chip.priority} priority
        </span>
      </div>
    </div>
  </div>
);
```

### 6.3 Feature 3: Domain Panel Keep/Remove Actions

```typescript
// FILE: core/useAura.ts - Add recommendation feedback methods
const keepRecommendation = useCallback(
  (id: string) => {
    const rec = recommendations.find((r) => r.id === id);
    if (!rec) return;

    // Update recommendation status
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, userFeedback: 'kept' } : r))
    );

    // Log to memory for AI learning
    const memoryItem: MemoryItem = {
      id: `mem-rec-kept-${Date.now()}`,
      timestamp: Date.now(),
      content: `Kept recommendation: ${rec.title}`,
      category: rec.category,
      sentiment: 'positive',
      extractedFacts: [],
      ownerId: activeUserId,
      extractionConfidence: 1,
      metadata: {
        type: 'recommendation_feedback',
        payload: { action: 'kept', recId: id, category: rec.category },
      },
    };
    appendMemoryItems([memoryItem]);
    addAuditLog(ActionType.APPROVE, 'Recommendation kept', rec.title);
  },
  [recommendations, activeUserId]
);

const removeRecommendation = useCallback(
  (id: string) => {
    const rec = recommendations.find((r) => r.id === id);
    if (!rec) return;

    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'DISMISSED', userFeedback: 'removed' } : r))
    );

    const memoryItem: MemoryItem = {
      id: `mem-rec-removed-${Date.now()}`,
      timestamp: Date.now(),
      content: `Removed recommendation: ${rec.title}`,
      category: rec.category,
      sentiment: 'neutral',
      extractedFacts: [],
      ownerId: activeUserId,
      extractionConfidence: 1,
      metadata: {
        type: 'recommendation_feedback',
        payload: { action: 'removed', recId: id, category: rec.category },
      },
    };
    appendMemoryItems([memoryItem]);
    addAuditLog(ActionType.REJECT, 'Recommendation removed', rec.title);
  },
  [recommendations, activeUserId]
);
```

### 6.4 Feature 4: Deep AI Initialization

```typescript
// FILE: ai/geminiService.ts - Add deep initialization
export interface DeepInitializationResult {
  doItems: DailyTask[];
  watchItems: BlindSpot[];
  alwaysDo: AlwaysChip[];
  alwaysWatch: AlwaysChip[];
  domainRecommendations: Record<string, Recommendation[]>;
  personalizedGreeting: string;
}

export const generateDeepInitialization = async (
  profile: UserProfile,
  ruleOfLife: RuleOfLife
): Promise<DeepInitializationResult> =>
  callGemini(
    'generateDeepInitialization',
    { profile, ruleOfLife },
    {
      doItems: [],
      watchItems: [],
      alwaysDo: [],
      alwaysWatch: [],
      domainRecommendations: {},
      personalizedGreeting: `Welcome to Areté, ${profile.identify.name || 'there'}.`,
    }
  );

// FILE: api/gemini.ts - Add handler
const generateDeepInitialization = async (
  profile: UserProfile,
  ruleOfLife: any
): Promise<DeepInitializationResult> => {
  const prompt = `
You are performing FIRST IMPRESSION ANALYSIS for Areté Life OS.

PROFILE DATA:
${JSON.stringify(profile, null, 2)}

RULE OF LIFE:
${JSON.stringify(ruleOfLife, null, 2)}

GOAL: Demonstrate deep understanding of this person. Make them feel "seen."

ANALYSIS TASKS:
1. Identify 3-5 immediate actionable tasks based on their specific profile
2. Identify 2-3 blind spots or risks based on profile gaps
3. Generate 4-6 personalized "Always Do" routines with specific rationale
4. Generate 3-5 "Always Watch" guardrails based on their conditions, finances, values
5. Generate 2-3 recommendations per domain (health, finance, personal, relationships, spiritual)
6. Write a personalized greeting that references something SPECIFIC about them

REQUIREMENTS:
- Use ACTUAL data from their profile, not generic advice
- Reference specific numbers (income, sleep times, etc.)
- Mention their conditions, values, or goals by name
- Make it feel like you've known them for years

RETURN JSON ONLY with schema:
{
  "doItems": [...],
  "watchItems": [...],
  "alwaysDo": [...],
  "alwaysWatch": [...],
  "domainRecommendations": { "health": [...], "finance": [...], "personal": [...], "relationships": [...], "spiritual": [...] },
  "personalizedGreeting": "string"
}
  `;

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: getModel('pro'),
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    // fallback...
  }
};

// FILE: onboarding/OnboardingView.tsx - Trigger on completion
const handleComplete = async () => {
  setIsFinishing(true);
  setFinishingStage('Analyzing your profile...');

  try {
    setFinishingStage('Generating personalized guidance...');
    const deepInit = await generateDeepInitialization(profile, ruleOfLife);

    // Apply results to state
    if (deepInit.doItems?.length) {
      // Merge with existing tasks
    }
    if (deepInit.domainRecommendations) {
      const allRecs = Object.values(deepInit.domainRecommendations).flat();
      setRecommendations((prev) => [...allRecs, ...prev]);
    }

    setFinishingStage(deepInit.personalizedGreeting);
    await new Promise((r) => setTimeout(r, 2500)); // Let user read greeting

    onComplete();
  } catch (err) {
    onComplete(); // Continue even if initialization fails
  } finally {
    setIsFinishing(false);
  }
};
```

---

## 7. UI Consistency Standards

### 7.1 Design Tokens

```typescript
// FILE: shared/design-tokens.ts
export const tokens = {
  // Border Radius
  radius: {
    sm: 'rounded-xl', // 12px
    md: 'rounded-2xl', // 16px
    lg: 'rounded-[2rem]', // 32px
    xl: 'rounded-[2.5rem]', // 40px
    full: 'rounded-full',
  },

  // Button Base
  button: {
    base: 'font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50',
    sizes: {
      sm: 'px-3 py-2 text-[9px]',
      md: 'px-4 py-3 text-[10px]',
      lg: 'px-6 py-4 text-[11px]',
    },
    variants: {
      primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20',
      secondary:
        'bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/30',
      ghost: 'bg-transparent text-slate-500 hover:text-white hover:bg-white/5',
      danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20',
    },
  },

  // Chip Base
  chip: {
    base: 'px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest',
    variants: {
      emerald: 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10',
      rose: 'bg-rose-500/5 text-rose-300 border border-rose-500/10',
      indigo: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      slate: 'bg-slate-900 text-slate-400 border border-white/5',
    },
  },

  // Panel
  panel: {
    base: 'glass-panel border border-white/5 bg-slate-950/40',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },

  // Text
  text: {
    label: 'text-[9px] font-black uppercase tracking-[0.3em] text-slate-500',
    labelLg: 'text-[10px] font-black uppercase tracking-[0.4em] text-slate-500',
    body: 'text-[10px] text-slate-400',
    heading: 'text-xl font-black text-white',
    subheading: 'text-lg font-black text-white',
  },
};
```

### 7.2 Standardized Components

```typescript
// FILE: shared/SharedUI.tsx - Add Button component
export const Button: React.FC<{
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, size = 'md', variant = 'primary', onClick, disabled, className = '' }) => {
  const sizeClass = tokens.button.sizes[size];
  const variantClass = tokens.button.variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${tokens.button.base} ${sizeClass} ${variantClass} ${tokens.radius.md} ${className}`}
    >
      {children}
    </button>
  );
};

export const Chip: React.FC<{
  children: React.ReactNode;
  color?: 'emerald' | 'rose' | 'indigo' | 'amber' | 'slate';
  tooltip?: string;
}> = ({ children, color = 'slate', tooltip }) => {
  const colorClass = tokens.chip.variants[color];

  if (!tooltip) {
    return (
      <span className={`${tokens.chip.base} ${colorClass}`}>
        {children}
      </span>
    );
  }

  return (
    <div className="relative group">
      <span className={`${tokens.chip.base} ${colorClass} cursor-help`}>
        {children}
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 w-64 pointer-events-none shadow-2xl">
        <p className="text-[10px] text-slate-300 leading-relaxed">{tooltip}</p>
      </div>
    </div>
  );
};
```

---

## 8. Implementation Sequence

### Phase 1: Foundation (Priority: Critical)

1. Create `shared/utils.ts` with shared helpers
2. Create `data/financeUtils.ts` with centralized finance logic
3. Create `ai/prompts.ts` with shared prompts
4. Update imports across all affected files

### Phase 2: Knowledge Graph (Priority: High)

1. Add `PERSONAL` category to types.ts
2. Implement `inferCategory()` in useAura.ts
3. Add temporal decay to coverage scoring
4. Implement claim confidence scoring

### Phase 3: Data Flow (Priority: High)

1. Add debounced `refreshAura()`
2. Implement content deduplication in `appendMemoryItems()`
3. Remove duplicate `refreshAura()` calls

### Phase 4: UI Consistency (Priority: Medium)

1. Add design tokens to `shared/design-tokens.ts`
2. Add `Button` and `Chip` components to SharedUI.tsx
3. Refactor existing components to use standardized components

### Phase 5: UX Features (Priority: Medium)

1. Create `UpcomingCalendar.tsx` and `EventPrepPopup.tsx`
2. Update `AlwaysPanels.tsx` with tooltip support
3. Update `DomainPanels.tsx` with keep/remove actions
4. Add recommendation feedback methods to useAura.ts

### Phase 6: Deep Initialization (Priority: Medium)

1. Add `generateDeepInitialization` to geminiService.ts
2. Add handler to api/gemini.ts
3. Update OnboardingView.tsx with initialization flow

### Phase 7: Prompt Optimization (Priority: Low)

1. Implement `buildMemoryContext()` for smart context selection
2. Add domain-specific prompts
3. Add Zod schema validation for AI outputs

---

## Verification Checklist

- [ ] `npm run doctor` passes
- [ ] No TypeScript errors
- [ ] Finance metrics calculate correctly
- [ ] Category inference works for new entries
- [ ] Tooltips display on hover (desktop)
- [ ] Calendar shows upcoming events
- [ ] Event prep popup loads AI recommendations
- [ ] Keep/remove actions update recommendations
- [ ] Deep initialization triggers after onboarding
- [ ] All buttons follow consistent sizing
- [ ] No duplicate chips in Always-Watch

---

## Files Modified Summary

| File                             | Action | Changes                                                |
| -------------------------------- | ------ | ------------------------------------------------------ |
| `shared/utils.ts`                | CREATE | parseNumber, contentHash                               |
| `data/financeUtils.ts`           | CREATE | computeFinanceMetrics, extractFinanceMetricsFromMemory |
| `data/types.ts`                  | MODIFY | Add PERSONAL category, AlwaysChip interface            |
| `ai/prompts.ts`                  | CREATE | Shared prompts, buildMemoryContext                     |
| `core/useAura.ts`                | MODIFY | Dedupe, debounce, feedback methods                     |
| `dashboard/UpcomingCalendar.tsx` | CREATE | Calendar widget                                        |
| `dashboard/EventPrepPopup.tsx`   | CREATE | Event prep modal                                       |
| `dashboard/AlwaysPanels.tsx`     | MODIFY | Tooltip support                                        |
| `dashboard/DomainPanels.tsx`     | MODIFY | Keep/remove actions                                    |
| `dashboard/DashboardView.tsx`    | MODIFY | New layout, enhanced chips                             |
| `dashboard/domainUtils.ts`       | MODIFY | Temporal decay                                         |
| `api/gemini.ts`                  | MODIFY | Deep initialization handler                            |
| `ai/geminiService.ts`            | MODIFY | generateDeepInitialization                             |
| `onboarding/OnboardingView.tsx`  | MODIFY | Initialization flow                                    |
| `shared/design-tokens.ts`        | MODIFY | Add tokens                                             |
| `shared/SharedUI.tsx`            | MODIFY | Button, Chip components                                |
