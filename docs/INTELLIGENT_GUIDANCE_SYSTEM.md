# Intelligent Guidance System

Updated: 2026-03-01

## Objective

Turn Areté from a journal + dashboard into a calm, proactive life operating system that:

- knows the user across health, personal/career, relationships, spiritual, and finance
- converts logs into actionable `Do` and `Watch` guidance
- asks clarifying questions when confidence is low
- surfaces internal and external opportunities/risks
- nudges the user through Telegram without becoming spammy

This design extends the current architecture. It does not create a parallel product.

---

## Product Thesis

1. The user returns daily when the app answers three questions quickly:
   - What should I do now?
   - What should I watch?
   - What do you still need to know from me?
2. Recommendations should not be generic inspiration. They must be grounded, executable, and traceable to real user data.
3. Clarifying questions are part of the product, not an error state. If confidence is weak, the app should ask one useful question instead of pretending certainty.
4. Telegram should be a low-friction intake and nudge channel, not a second dashboard.
5. Cost must stay bounded by using deterministic scoring and batching before escalating to expensive models.

---

## Existing Primitives To Extend

Already present in the app:

- `Recommendation` -> action candidate
- `BlindSpot` -> watch/risk item
- `StrategicBriefing` -> daily synthesis
- `DailyTask` -> execution unit
- `InboxEntry` -> untrusted input queue
- `useAura` -> orchestration hook
- `api/telegram/webhook.ts` -> Telegram ingestion

This system should build on those primitives rather than replace them.

---

## Proposed System

### 1. Signal Digestion Layer

Purpose: turn logs, inbox items, profile changes, and completed tasks into structured signals.

Inputs:

- log bar entries
- Telegram inbox entries
- profile updates
- task completion / task slippage
- calendar events
- finance metrics
- rule of life / non-negotiables

Implementation:

- keep `processInput` as the first-pass parser
- add deterministic post-processing in `useAura`:
  - dimension delta scoring
  - recurring pattern detection
  - deadline proximity
  - missed habit / over-budget / sleep drift / relationship silence heuristics

Why:

- many high-value triggers do not need a full LLM call
- this keeps the system cheaper and more reliable

### 2. Guidance Candidate Engine

Purpose: create candidate `Do`, `Watch`, and `Ask` items before synthesis.

Output buckets:

- `Do` -> actions the user should take
- `Watch` -> threats / drift / exposure / risk
- `Ask` -> clarifying questions needed to improve confidence

Generation order:

1. deterministic rules create candidates
2. cached AI synthesis ranks and rewrites the top candidates
3. low-confidence candidates become clarifying questions

### 3. Clarification Loop

Purpose: let the system ask just enough to get smarter.

Add a lightweight entity:

```ts
interface GuidanceQuestion {
  id: string;
  ownerId: string;
  category: Category;
  prompt: string;
  reason: string;
  sourceType: 'recommendation' | 'blind_spot' | 'profile_gap' | 'external_scan';
  sourceId?: string;
  urgency: 'low' | 'medium' | 'high';
  channel: 'dashboard' | 'telegram';
  answerType: 'text' | 'yes_no' | 'single_choice' | 'number';
  status: 'open' | 'answered' | 'dismissed' | 'snoozed';
  askedAt?: number;
  answeredAt?: number;
  snoozedUntil?: number;
}
```

Rules:

- max 1 primary question visible on dashboard at a time
- max 1 proactive Telegram question per day unless urgent
- answered questions should immediately improve the next refresh cycle

### 4. Strategic Guidance Synthesizer

Purpose: generate the daily brief from the best candidates.

It should output:

- top 3 `Do` items
- top 3 `Watch` items
- 1 `Question`
- domain pulse summary
- 1 external opportunity
- 1 external risk

This should replace the current longer strategic briefing as the default daily surface. The full narrative can still exist behind `View brief`.

### 5. Delivery Orchestrator

Channels:

- dashboard -> primary decision surface
- Telegram -> proactive reminders and clarification
- chat -> deep follow-up and planning

Cadence:

- on log commit: update local candidates immediately
- every morning: refresh daily guidance digest
- every evening: generate shutdown / reflection prompt
- weekly: deeper strategic scan and domain rebalance

---

## Data Model Changes

### Extend Recommendation

Add:

```ts
horizon: 'now' | 'soon' | 'always';
kind: 'do' | 'opportunity';
confidence?: number;
trigger: 'log' | 'pattern' | 'event' | 'external' | 'profile_gap';
staleAt?: number;
questionId?: string;
```

### Extend BlindSpot

Add:

```ts
category: Category;
horizon: 'now' | 'soon' | 'always';
trigger: 'behavior' | 'deadline' | 'health' | 'finance' | 'relationship' | 'external';
nextPreventionStep?: string;
linkedTaskId?: string;
```

### Add Guidance Preferences

In settings:

```ts
guidance: {
  telegramMode: 'off' | 'digest' | 'important_only' | 'coach';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  dailyTelegramLimit: number;
  externalScanEnabled: boolean;
  externalScanCategories: Category[];
}
```

---

## Dashboard UX

The dashboard should follow the existing north star: `Do + Watch` across `Now / Soon / Always`.

### Above the fold

1. `Question strip`
   - one clarifying question
   - short reason
   - answer inline
   - dismiss / snooze

2. `Do`
   - top 3 actionable items
   - each shows title, why, effort, next step
   - quick convert to `DailyTask` if not already planned

3. `Watch`
   - top 3 threats/opportunities
   - each shows why it matters, impact, next prevention/opportunity step

4. `Horizon switcher`
   - `Now`
   - `Soon`
   - `Always`

### Below the fold

1. `Domain pulse`
   - 5 life dimensions only
   - status: stable / attention / at risk / opportunity

2. `Inbox`
   - still visible because trust and review remain core

3. `Upcoming`
   - event prep stays here

4. `View full brief`
   - opens the current long-form strategic synthesis if needed

### Anti-clutter rules

- no more than 3 `Do`
- no more than 3 `Watch`
- only 1 visible question
- no duplicate capture CTAs
- raw recommendation feeds stay secondary

---

## Telegram UX

Telegram should support four message types only:

1. `Morning brief`
   - one-line summary
   - top 1 do
   - top 1 watch
   - optional quick reply buttons

2. `Clarifying question`
   - only when a missing answer blocks recommendation quality
   - short, single-purpose, quick to answer

3. `Important reminder`
   - deadline / health / finance / event risk
   - only for high-confidence or user-configured important items

4. `Evening review`
   - 1-2 reflection prompts
   - supports shutdown flow

Anti-spam rules:

- quiet hours enforced
- daily Telegram cap default: `2`
- digest mode default
- urgent alerts bypass cap only for explicit high-risk conditions
- no long AI essays in Telegram

Privacy rules:

- default Telegram copy should be concise and not expose sensitive details
- allow optional `detailed prompts` only if user opts in

---

## External Risk / Opportunity Layer

The user explicitly wants external trends/news that might affect life decisions.

This should be implemented as a separate, rate-limited scan:

- driven by user profile + goals + current active domains
- cached daily
- only returns:
  - 1 relevant opportunity
  - 1 relevant risk
  - 1 concrete action each

Examples:

- finance -> rates, taxes, market regime changes
- career -> hiring trend, industry movement, skill demand
- health -> seasonal risk, local air quality, public health advisories
- travel -> visa/weather/disruption

This should feed the `Watch` and `Opportunity` surfaces, not chatty news cards.

---

## Model Routing

### Deterministic / no model

Use rules first for:

- missed habits
- overdue tasks
- event lead-time triggers
- budget drift
- inactivity in relationship domains
- profile completeness gaps

### Cheap default lane

Use `gemini-2.5-flash-lite` for:

- ingestion classification
- short clarification questions
- short Telegram copy generation
- recommendation summarization

Use `gemini-2.5-flash` for:

- daily guidance digest
- strategic brief rewrite
- external daily scan with grounding

### Expensive lane only on escalation

Use `gemini-2.5-pro` only for:

- weekly deep strategic review
- multi-domain planning
- major life change / quarterly reset

Keep `askAura` as the conversational deep-dive lane, not the default scheduled engine.

---

## Implementation Plan

### Phase 1. Guidance Core

- add `GuidanceQuestion` type
- extend `Recommendation` and `BlindSpot` with horizon/trigger/confidence metadata
- add guidance preferences to settings

### Phase 2. Orchestration

- add deterministic candidate generation in `useAura`
- add a batched `generateGuidanceDigest` action
- wire recommendation feedback and question answers back into future ranking

### Phase 3. Dashboard

- replace the long right-rail brief with:
  - `Question strip`
  - `Do`
  - `Watch`
  - compact `View brief`
- add horizon switcher

### Phase 4. Telegram

- add outbound reminder scheduler
- support morning brief, clarification, important reminder, evening review
- add snooze / done / not now handling

### Phase 5. External Scan

- add daily grounded scan for selected domains
- cache results and surface only top 1 risk + top 1 opportunity

### Phase 6. Trust + Metrics

Track:

- keep/remove rate per recommendation type
- question answer rate
- Telegram prompt response rate
- recommendation-to-task completion rate
- repeat-dismissal rate

---

## Acceptance Criteria

The system is working when:

1. The dashboard answers `Do`, `Watch`, and `Ask` within 10 seconds.
2. Recommendations cite real user data or grounded sources.
3. Telegram nudges feel helpful, not noisy.
4. Clarifying questions improve later recommendations.
5. The user can see progress across all life dimensions without reading dense walls of text.

