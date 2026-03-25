# Plan: Dashboard Revamp — Life Context & Tracking

> **Status:** READY FOR REVIEW
> **Date:** 2026-02-11
> **Author:** The Steward
> **Project:** areté-life-os

---

## 1. Goal

Revamp the dashboard from a widget collection into a **personal life advisor** that:

1. **Analyses** the user's current life across 5 dimensions (Health, Finance, Relationships, Spirit, Personal) with deeply personalized, data-grounded insights that reference the user's age, location, career, income, and real logged data.
2. **Tracks** recommended goals and tasks per dimension with clear rationale, organized so the user always knows what to focus on and why.
3. **Rewards** logging by showing immediate, tangible progress — every significant log visibly moves the user's scores, goals, and streaks in real-time.
4. **Preserves history** so users can see their life trajectory over weeks and months, turning the dashboard into an improvement tracker they return to daily.

The result is a clean, premium, visually creative mission-control dashboard designed for web browsers.

---

## 2. Current State (Gap Analysis)

### What works well (preserve)
- **DailyTask data model** — rich metadata: `why`, `benefits`, `reasoning`, `steps`, `definitionOfDone`.
- **UserProfile** — comprehensive 6-section structure covering all 5 dimensions.
- **Onboarding wizard** — 7-step flow already collects all data needed for life analysis (identity, personal, health, finances, relationships, spiritual).
- **Score computation core** — the 4-factor weighting (consistency/quality/balance/progress) is a sensible starting foundation.
- **Existing AI prompts** — `HYPER_PERSONALIZED_PROMPT` does data-grounded recommendations; `BASELINE_SWOT_PROMPT` does per-dimension SWOT; `DAILY_PLAN_PROMPT` generates rich daily tasks.
- **Vault encryption** — solid crypto foundation.
- **DailyBriefing focus logic** — declining dimensions, unprepped events, approaching goals, blind spots.
- **FocusList event grouping** — strategic focus tier, expandable why/how sections, milestone sequences.

### What's broken or missing

| Area | Gap | Impact |
|------|-----|--------|
| **Score = Activity** | `computeScore()` rewards logging frequency (50% weight) not life quality. 5 negative logs > 1 positive log. | Dashboard misleads users about their actual life state |
| **No Life Narrative** | Dashboard shows metrics widgets but never synthesizes them into "here's where your life stands." | Users see numbers without meaning |
| **Cold Start** | New user completing onboarding sees a blank dashboard. No baseline analysis triggered. | Day-one retention death |
| **Rec → Goal → Task Pipeline** | Recommendations, Goals, and Tasks exist but aren't linked. Can't trace "why am I doing this?" | Tasks feel arbitrary, goals feel disconnected |
| **No Consequences** | Dimensions show current state but not projected trajectory ("if nothing changes, expect X"). | No urgency to act |
| **SignalGrid is static** | Text-only scores, no sparklines, no multi-timeframe trends, weak baseline use. | Can't see momentum or anomalies |
| **GoalsSpotlight shows only 1** | Top-1 goal + top-1 recommendation. Massive visibility loss. | User can't see their full goal landscape |
| **useAura.ts is 26,664 lines** | Monolithic hook. Adding more state = architectural debt. | Impossible to test, debug, or refactor |
| **No smart refresh triggers** | Dashboard refreshes on manual action or catch-all `refreshAura()`. No log-content-aware triggers. | Either stale data or wasteful full refreshes |
| **No history** | No stored snapshots. Can't show "3 weeks ago your Finance was X, now it's Y." | No improvement tracking over time |
| **Logging feels empty** | Task completion shows a toast. No visible score impact, no contribution breakdown. | Users don't feel rewarded for engaging |
| **No card-to-action bridge** | Section 1 shows "Health is critical" but no interaction path to Health tasks in Section 2. | Analysis and action are disconnected |

---

## 3. Architecture Decisions

### 3.1 Modular Dimension Refresh (not monolithic)
Each dimension refreshes independently. When Finance changes, only the Finance card re-evaluates. The narrative paragraph only regenerates when 3+ dimensions have refreshed in a session or on manual full refresh.

**Cost optimization:** The `refreshDimensionContexts()` function accepts an array of 1-5 dimensions and batches them into a single API call. So when a Tier 1 trigger hits Finance and Personal simultaneously, it's 1 API call, not 2.

### 3.2 Smart Trigger Tiers

**Tier 1 — Immediate refresh** (life-significant change detected):
- Finance: salary/income change, job change, promotion, layoff, major asset/debt event
- Health: new diagnosis, major habit start/stop, injury, significant pattern shift
- Relationships: status change, marriage, divorce, major family event
- Spiritual: new practice start/stop, values shift, spiritual crisis
- Personal: career pivot, relocation, major milestone, completed long-term goal

**Tier 2 — Accumulation (3+ dimension-relevant logs in 7 days)**:
- No single log is life-significant, but a pattern emerged
- e.g., 3 health logs this week → Health context worth refreshing

**Tier 3 — Never triggers (explicitly excluded)**:
- Event scheduling/editing
- Task completion (unless completes a major goal)
- Reminders, prep plan activation
- General diary entries without life-significant content

Classification happens inside the existing `LOG_BAR_INGEST_PROMPT` — extended with a `lifeContextSignal` output field.

### 3.3 Isolated State Hook
New `useLifeContext()` hook manages all Life Context state:
- Current dimension snapshots (5)
- Snapshot history
- Tier 2 accumulator
- Refresh orchestration
- Cold start baseline flow

This hook reads from `useAura()` (profile, memory, goals) but owns its own state. `useAura.ts` gets minimal additions — just exposing what `useLifeContext` needs.

### 3.4 Outcome-Based Scoring
Replace activity-based scoring with dimension-specific outcome factors. Each dimension evaluates actual life quality from profile data + memory signals, not just logging frequency. Full specifications in Section 5.

### 3.5 Progressive Analysis (Cold Start Solution)
The existing onboarding wizard already collects comprehensive data across all 6 profile sections. No separate "Life Context Interview" is needed. Instead:

- **Post-onboarding (Level 1):** Immediately after onboarding completes, trigger `refreshDimensionContexts(ALL_5)` using profile-only data. The AI generates a baseline assessment for each dimension grounded in the onboarding answers. The user sees their first Life Context within seconds of completing onboarding — never a blank dashboard.
- **Early usage (Level 2):** As the user logs their first 3-10 memory items, Tier 2 accumulation triggers refresh individual dimension cards. Insights start referencing real logged data alongside profile baseline.
- **Established usage (Level 3):** After 30+ days of data, full analysis with trends, projections, sparklines, and historical comparison.

Each dimension card independently shows its fidelity level and tells the user what data would deepen the analysis.

### 3.6 Recommendation → Goal → Task Traceability
Explicit pipeline with linkages:

```
AI generates Recommendation (grounded in Life Context analysis)
    ↓ user accepts
Recommendation becomes Goal (with AI-generated milestones)
    ↓ AI decomposes
Goal generates weekly Tasks (each task shows: "Serving goal X, recommended because Y")
    ↓ user completes task
Goal progress updates → dimension score updates → Life Context refreshes if threshold crossed
```

Every task the user sees can be traced back to a goal and a recommendation. Every recommendation can be traced to a specific insight from the Life Context analysis.

### 3.7 Contribution Feedback Loop
When a user logs something significant, show a **Contribution Card** (toast-like overlay):

```
  Logged: "Ran 5km this morning"
  ─────────────────────────────────
  Health score:  58 → 61  (+3)
  Goal progress: 62% → 68%  (+6%)
  Streak: 6 days
```

This card appears inline near the log bar, auto-dismisses after 5 seconds, and is the core of the "logging feels satisfying" loop. For non-significant logs (Tier 3), show a simpler "Logged" confirmation without score impact.

### 3.8 AI Accuracy Enforcement

**Problem found:** The existing `DAILY_PLAN_PROMPT` explicitly asks the AI to "Research and inject specific real-world data (e.g., clinic phone numbers, addresses)." This is a hallucination trap — the AI will invent plausible-sounding phone numbers and addresses that don't exist. The `DAILY_INTELLIGENCE_BATCH_PROMPT` similarly asks for "specific real-world resources near user's location." Both of these invite fabrication.

**Audit result:** Score computation is 100% deterministic (timestamps, sentiment counts, goal progress). But recommendations, daily plans, blind spots, and impact scores are entirely AI-generated with varying hallucination risk.

**Solution: Three-layer accuracy enforcement.**

**Layer 1 — Pre-computed metrics (client → AI).** The client computes everything it can deterministically BEFORE sending to the AI. The AI receives FACTS, not raw data to interpret. This eliminates AI calculation errors and grounds every assessment in verifiable numbers.

Pre-computed metrics passed to `DIMENSION_CONTEXT_PROMPT`:

```typescript
interface PreComputedMetrics {
  // HEALTH (computed client-side from profile + memory)
  bmi: number | null                    // weight / (height_m²)
  bmiCategory: string | null            // "underweight" | "normal" | "overweight" | "obese"
  baselineSleepHours: number | null     // wakeTime - sleepTime from profile
  loggedSleepAvg: number | null         // average from sleep-mentioning logs (if available)
  exerciseSessionsThisWeek: number      // count of exercise-related logs in 7 days
  exerciseTarget: number                // parsed from activityFrequency (e.g., "3-4x" → 3.5)
  exerciseAdherence: number             // sessionsThisWeek / target (0-1)
  daysSinceLastExercise: number | null

  // FINANCE (computed from profile fields)
  savingsRate: number | null            // (income - fixedCosts - variableCosts) / income
  netWorth: number | null               // assetsTotal - liabilities
  emergencyFundMonths: number | null    // assetsBreakdown.cash / fixedCosts
  debtToIncomeRatio: number | null      // liabilities / (income * 12)

  // RELATIONSHIPS (computed from memory)
  socialInteractions14d: number         // relationship-category logs in 14 days
  innerCircleGaps: { name: string, role: string, daysSinceContact: number }[]
  commitmentsFulfilled7d: number        // dailyCommitments mentioned in logs
  commitmentsTotal: number              // profile.relationship.dailyCommitments.length

  // SPIRITUAL (computed from memory)
  practiceSessionsThisWeek: number      // spiritual-category logs in 7 days
  practiceTarget: number                // parsed from practicePulse (Daily=7, Weekly=1, etc.)
  practiceAdherence: number             // sessions / target (0-1)
  daysSinceLastPractice: number | null

  // PERSONAL (computed from memory)
  careerLogsThisMonth: number           // personal-category career logs in 30 days
  interestLogsThisMonth: number         // logs matching stated interests
  growthLogsThisMonth: number           // learning/skill development logs
  statedInterests: string[]             // from profile for cross-reference

  // CROSS-DIMENSIONAL
  dimensionLogCounts30d: Record<Category, number>  // total logs per dimension
}
```

These metrics are injected into the prompt as structured facts:
```
PRE-COMPUTED METRICS (verified — use these numbers, do not recalculate):
  Health: BMI 26.1 (overweight), Baseline sleep 8h, Logged sleep avg 6.2h,
          Exercise 1/3.5 this week (28% adherence), Last exercise 9 days ago
  Finance: Savings rate 24%, Net worth $142,000, Emergency fund 4.2 months
  ...
```

The prompt then says: **"Use these pre-computed metrics as ground truth. Reference them directly in your output. Do NOT recalculate or contradict these numbers."**

**Layer 2 — Client-computed fidelity (not AI-decided).** The AI should NOT decide its own confidence level. Fidelity is computed deterministically:

```typescript
function computeFidelity(dimension: Category, profile: UserProfile, memory: MemoryEntry[]): 0|1|2|3 {
  const hasRequired = REQUIRED_FIELDS[dimension].every(f => getProfileField(profile, f))
  if (!hasRequired) return 0

  const count = memory.filter(m => m.category === dimension && isWithin30Days(m)).length
  if (count === 0) return 1
  if (count < 10) return 2
  return 3
}
```

The AI receives fidelityLevel as INPUT: `"Fidelity: 2 (6 memory items in 30 days). Calibrate depth accordingly: cite specific data where available, acknowledge gaps explicitly."` The AI cannot inflate its own confidence.

**Layer 3 — Anti-hallucination prompt rules.** Remove all instructions that ask the AI to "research" or invent external data:

```
GROUNDING RULES:
1. Reference ONLY data from the provided profile, memory, and pre-computed metrics.
2. Do NOT invent phone numbers, addresses, clinic names, or institutional details.
3. If a recommendation would benefit from external information (e.g., a local gym),
   say "Look up [type of resource] near [user's location]" — do not fabricate specifics.
4. Every insight MUST cite at least one pre-computed metric or specific memory entry.
5. If data is insufficient for a confident assessment, say so explicitly.
   Prefer "insufficient data" over plausible-sounding guesses.
6. nextStep must reference something the user CAN verify: a profile field, a logged
   event, a goal, an inner circle member by name — not invented external facts.
```

### 3.9 Daily Intelligence Layer (Client-Computed, No API Call)

**Problem found:** If the user doesn't log anything for 3 days, the dashboard is completely static. "Since Last Visit: No changes." Every card shows the same data. This kills daily return habit.

**Solution:** A 100% client-computed intelligence layer that surfaces fresh, relevant information every day WITHOUT requiring an API call or user input.

```typescript
interface DailyIntelligence {
  // Dimension gaps — "It's been X days since your last [dimension] log"
  dimensionGaps: {
    dimension: Category
    daysSinceLastLog: number
    label: string           // e.g., "12 days without a Health log"
  }[]

  // Streaks at risk — "Your 6-day streak breaks if you don't log today"
  streaksAtRisk: {
    dimension: Category
    currentStreak: number
    breaksToday: boolean    // true if no log today = streak reset
  }[]

  // Event countdowns with prep urgency
  eventCountdowns: {
    event: TimelineEvent
    daysUntil: number
    prepReady: boolean
    urgencyLabel: string    // "4 days — prep needed" or "12 days — on track"
  }[]

  // Goal deadline proximity
  goalDeadlines: {
    goal: Goal
    daysLeft: number
    onTrack: boolean        // progress % vs days elapsed %
    urgencyLabel: string    // "3 days left, 40% behind target"
  }[]

  // Commitment tracking — did you fulfill today's daily commitments?
  todaysCommitments: {
    commitment: string      // from profile.relationship.dailyCommitments
    fulfilled: boolean      // found matching log today
  }[]

  // Daily plan freshness
  dailyPlanStale: boolean   // true if plan is from yesterday or empty

  // Completion meter
  tasksCompleted: number
  tasksTotal: number
}
```

**What this feeds into:**

| Dashboard Element | Uses DailyIntelligence For |
|---|---|
| **Header summary** | Top-priority item: streak at risk > event prep > goal deadline > commitment gap |
| **Since Last Visit** | Even without score changes: "Health: 12 days since last log. Streak at risk." |
| **Dimension Cards** | Gap alert badge: "9 days" shown on cards with long gaps |
| **Today's Focus** | Auto-triggers `planMyDay()` if `dailyPlanStale === true` |
| **Today's Focus footer** | "3 of 8 tasks complete" progress bar |
| **Upcoming** | Event countdowns with urgency labels |

**Computation:** Runs on every dashboard mount. Pure client-side JavaScript — zero API calls, zero latency. Guarantees something fresh appears every single day.

### 3.10 Auto Daily Plan Generation

**Problem:** Today's Focus only shows tasks if the user manually clicks "Plan my day." First visit of the day shows empty focus area.

**Solution:** On dashboard mount, check:
```
if (dailyPlan is empty OR dailyPlan[0].due_at is before today):
    auto-trigger planMyDay() in background
    show shimmer loading in Today's Focus
    populate when plan arrives
```

The user ALWAYS sees fresh daily tasks without clicking anything. The "Plan my day" button remains for manual re-generation.

---

## 4. Onboarding → Dimension Data Pipeline

The existing 7-step onboarding maps directly to the 5 life dimensions. Each step feeds specific profile fields that the AI uses for dimension analysis.

### 4.1 Mapping: Onboarding Steps → Dimensions

```
Step 1: NEURAL IDENTITY (Core Identity)
  ┌─────────────────────────────────────────────────────────────┐
  │ Collects:  name, birthday, location, origin, ethnicity      │
  │ Feeds:     ALL dimensions (age, location context)           │
  │ Critical:  Age = benchmark expectations for all dimensions  │
  │            Location = cost-of-living, local resources,      │
  │              cultural context for recommendations           │
  └─────────────────────────────────────────────────────────────┘

Step 2: CONTEXTUAL LAYERS (Personal Profile)
  ┌─────────────────────────────────────────────────────────────┐
  │ Collects:  relationshipStatus, jobRole, company, interests  │
  │ Feeds:     PERSONAL (career context), RELATIONSHIPS (status)│
  │ Critical:  jobRole + company = career trajectory baseline   │
  │            relationshipStatus = relationship expectations   │
  │            interests = personal fulfillment measurement     │
  └─────────────────────────────────────────────────────────────┘

Step 3: BIOMETRIC MATRIX (Health & Body)
  ┌─────────────────────────────────────────────────────────────┐
  │ Collects:  height, weight, sleepTime, wakeTime, activities, │
  │            activityFrequency, conditions, medications       │
  │ Feeds:     HEALTH (primary data source)                     │
  │ Critical:  height + weight = BMI baseline                   │
  │            sleepTime + wakeTime = sleep duration target      │
  │            activityFrequency = exercise adherence target     │
  │            conditions = risk monitoring watchlist            │
  │            medications = adherence tracking                  │
  └─────────────────────────────────────────────────────────────┘

Step 4: RESOURCE ENGINE (Financial Assets)
  ┌─────────────────────────────────────────────────────────────┐
  │ Collects:  income, liabilities, fixedCosts, variableCosts,  │
  │            assetsTotal, assetsBreakdown, investmentStrategy  │
  │ Feeds:     FINANCE (primary data source)                    │
  │ Critical:  income - fixedCosts - variableCosts = savings    │
  │            assetsTotal - liabilities = net worth             │
  │            assetsBreakdown.cash = emergency fund check       │
  │            investmentStrategy = risk alignment               │
  └─────────────────────────────────────────────────────────────┘

Step 5: SOCIAL TOPOLOGY (Relationships)
  ┌─────────────────────────────────────────────────────────────┐
  │ Collects:  livingArrangement, socialEnergy, dailyCommitments│
  │            socialGoals, (+ innerCircle from separate flow)  │
  │ Feeds:     RELATIONSHIPS (primary data source)              │
  │ Critical:  socialEnergy = over/under-socialized detection   │
  │            dailyCommitments = commitment fulfillment target  │
  │            socialGoals = relationship growth measurement     │
  │            livingArrangement = context for recommendations  │
  └─────────────────────────────────────────────────────────────┘

Step 6: AXIOLOGICAL BASE (Beliefs & Values)
  ┌─────────────────────────────────────────────────────────────┐
  │ Collects:  worldview, coreValues, practicePulse             │
  │ Feeds:     SPIRITUAL (primary data source)                  │
  │ Critical:  worldview = framework for spiritual practices    │
  │            coreValues = values alignment detection across    │
  │              ALL dimensions (flags "moral friction")         │
  │            practicePulse = practice frequency target         │
  └─────────────────────────────────────────────────────────────┘

Step 7: ACTIVATION
  ┌─────────────────────────────────────────────────────────────┐
  │ Triggers:  runDeepInitialization() + first Life Context     │
  │            analysis via refreshDimensionContexts(ALL_5)     │
  │ Result:    User sees populated dashboard immediately        │
  └─────────────────────────────────────────────────────────────┘
```

### 4.2 Cross-Dimensional Data Usage

Some profile fields feed multiple dimensions:

| Profile Field | Primary Dimension | Also Used By |
|---------------|-------------------|--------------|
| `identify.birthday` (→ age) | ALL | Age-adjusted benchmarks for finance, health, career |
| `identify.location` | ALL | Cost-of-living (finance), local resources (health), cultural context |
| `personal.jobRole` | PERSONAL | Income expectations (finance), work-life balance (relationships) |
| `relationship.relationshipStatus` | RELATIONSHIPS | Financial planning context (finance), social baseline |
| `spiritual.coreValues` | SPIRITUAL | Values alignment checks across ALL dimensions |
| `health.chronotype` | HEALTH | Energy-optimized task scheduling (personal), optimal social times (relationships) |

### 4.3 Profile Completeness → Analysis Quality

Each dimension has required and enrichment fields:

| Dimension | Required for Level 1 | Enrichment for Level 2+ |
|-----------|---------------------|------------------------|
| Health | height, weight, sleepTime, wakeTime | activities, activityFrequency, conditions, medications, chronotype, bloodPressure, restingHeartRate |
| Finance | income, fixedCosts, variableCosts | assetsTotal, assetsBreakdown, liabilities, investmentStrategy |
| Relationships | relationshipStatus, socialEnergy | livingArrangement, dailyCommitments, socialGoals, loveLanguage, attachmentStyle, innerCircle |
| Spiritual | worldview, coreValues | practicePulse |
| Personal | jobRole | company, interests, personalityType, communicationStyle, archetype |

If required fields are empty for a dimension → fidelity Level 0 (no analysis possible). The `ProfileGapNudge` targets these fields first.

---

## 5. Dimension Analysis Specifications

Each dimension has specific outcome factors, data sources, and AI evaluation rules. These specifications are what the `DIMENSION_CONTEXT_PROMPT` uses to score and analyse each dimension.

### 5.1 HEALTH Dimension

**Profile Data Used:**
- `health.height` + `health.weight` → **BMI calculation** (height_m = height_cm / 100; BMI = weight / height_m²)
- `health.sleepTime` + `health.wakeTime` → **Sleep duration baseline** (calculated hours between bedtime and wake)
- `health.activities` → **Expected activity types** (what user says they do: running, tennis, swimming...)
- `health.activityFrequency` → **Exercise frequency target** (Rarely=0, 1-2x/wk=1.5, 3-4x/wk=3.5, Daily=7)
- `health.conditions` → **Risk monitoring watchlist** (chronic conditions to track)
- `health.medications` → **Medication adherence list** (are they being taken consistently?)
- `health.chronotype` → **Energy pattern** (Lark=morning peak, Owl=evening peak)
- `health.bloodPressure` + `health.restingHeartRate` → **Vital signs baseline** (if provided)
- `identify.birthday` → **Age context** (health benchmarks are age-dependent)

**Memory Data Used (category: HEALTH):**
- Exercise logs → actual workout sessions, type, duration
- Sleep quality mentions → good/bad sleep, insomnia, tiredness
- Energy level mentions → high/low energy, fatigue, alertness
- Symptom reports → pain, illness, discomfort
- Meal/nutrition logs → eating patterns, diet quality
- Medication mentions → took medication, missed dose

**Outcome Scoring Factors (4 sub-scores, each 0-25):**

| Factor | Score Logic | Data Source |
|--------|-----------|-------------|
| **Sleep Score** (0-25) | Baseline sleep hours from profile (wakeTime - sleepTime). Compare to 7-8h target. If logs mention sleep quality: weight positive/negative signals. Chronic deficit (<6h) = 0-8. On target (7-8h) = 18-25. | Profile + memory |
| **Exercise Score** (0-25) | Target frequency from `activityFrequency`. Count logged exercise sessions in past 7 days. Score = (actual / target) × 25. Bonus if variety matches `activities` list. No logs + high target = 0. | Profile + memory |
| **Body & Vitals Score** (0-25) | BMI in healthy range (18.5-24.9) = 15-25. Outside range = proportionally lower. If blood pressure or resting heart rate available: factor in. If `conditions` listed: check for absence of worsening symptoms in logs. | Profile + memory |
| **Vitality Score** (0-25) | Energy sentiment ratio from health logs (positive energy mentions / total). Chronotype alignment: are high-effort tasks logged during peak energy window? Medication adherence if applicable. General health sentiment. | Profile + memory |

**Example AI Output:**
```json
{
  "dimension": "HEALTH",
  "status": "needs_attention",
  "score": 52,
  "insight": "Sleep calculated at 6.2h (22:00-04:12 pattern from logs), below your 7h target. BMI 26.1 is slightly above healthy range at your height of 175cm.",
  "gap": "0 exercise sessions logged this week despite your 3-4x/week target and listed activities (running, tennis).",
  "nextStep": "Set a 9:30pm phone-down alarm tonight. Protecting 30 extra minutes of sleep compounds into measurably better energy within 5 days.",
  "projection": "At 6.2h average sleep and no exercise, expect noticeable cognitive fatigue within 2-3 weeks — right when your team offsite needs you sharp.",
  "missingData": ["Log exercise sessions for accurate fitness tracking"],
  "fidelityLevel": 2
}
```

### 5.2 FINANCE Dimension

**Profile Data Used:**
- `finances.income` → Monthly income
- `finances.fixedCosts` → Monthly fixed expenses
- `finances.variableCosts` → Monthly variable expenses
- `finances.assetsTotal` → Total assets
- `finances.assetsBreakdown` → Cash, investments, property, other
- `finances.liabilities` → Total debt
- `finances.investmentStrategy` → Risk tolerance (Aggressive/Conservative)
- `identify.birthday` → Age context (retirement timeline, savings benchmarks)
- `identify.location` → Cost-of-living context
- `relationship.relationshipStatus` → Financial planning context (single vs. family)

**Memory Data Used (category: FINANCE):**
- Income changes (raises, bonuses, job loss)
- Expense logs (purchases, bills, unexpected costs)
- Investment actions (bought/sold, rebalanced)
- Debt payments (paid off, new debt)
- Financial decisions and milestones
- Financial stress/worry sentiment

**Outcome Scoring Factors (4 sub-scores, each 0-25):**

| Factor | Score Logic | Data Source |
|--------|-----------|-------------|
| **Savings Rate** (0-25) | Calculate: `(income - fixedCosts - variableCosts) / income`. Below 10% = 0-8. 10-20% = 9-16. Above 20% = 17-25. Age-adjusted: younger users get slightly more credit for lower rates. | Profile |
| **Net Worth Health** (0-25) | `assetsTotal - liabilities`. Positive and growing = high score. Emergency fund check: `assetsBreakdown.cash >= 3 × fixedCosts` = +8. Debt-to-income ratio factored in. Location-adjusted for cost of living. | Profile + memory |
| **Income Stability** (0-25) | Consistent income signals from logs. Recent raise = positive trend. Job change/layoff risk = negative. Career trajectory signals. If no finance logs: defaults to profile baseline. | Memory |
| **Financial Behavior** (0-25) | Investment activity aligned with stated `investmentStrategy`. Budget adherence signals from spending logs. Absence of financial stress sentiment. Proactive financial actions (planning, reviewing). | Memory |

**Example AI Output:**
```json
{
  "dimension": "FINANCE",
  "status": "stable",
  "score": 72,
  "insight": "Savings rate at 24% ($4,320/month) is strong for your age in Singapore. Emergency fund covers 4.2 months of fixed costs.",
  "gap": "Investment portfolio hasn't been rebalanced since your last logged review. With your aggressive strategy, quarterly rebalancing matters.",
  "nextStep": "Spend 10 minutes reviewing your investment allocation this week. Your last review was 3+ months ago.",
  "projection": "At your current savings rate, you're on track. But unallocated cash above 6-month emergency reserves loses purchasing power to Singapore's 3.2% inflation.",
  "fidelityLevel": 3
}
```

### 5.3 RELATIONSHIPS Dimension

**Profile Data Used:**
- `relationship.relationshipStatus` → Single/Married/etc. (sets baseline expectations)
- `relationship.livingArrangement` → Alone/With Spouse/With Family/etc.
- `relationship.socialEnergy` → Introverted/Balanced/Extroverted (calibrates social activity expectations)
- `relationship.loveLanguage` → Love language (for relationship quality signals)
- `relationship.attachmentStyle` → Secure/Anxious/Avoidant (for pattern detection)
- `relationship.familyDynamic` → Family context
- `relationship.friendshipStyle` → Low maintenance / High frequency
- `relationship.dailyCommitments` → Daily relationship commitments (e.g., "dinner with wife", "call parents")
- `relationship.socialGoals` → Stated social goals (e.g., "expand professional network", "deepen friendships")
- `innerCircle` → Key relationships: name, role (Spouse/Parent/Child/Friend/Colleague), notes

**Memory Data Used (category: RELATIONSHIPS):**
- Social interaction logs (who, what, quality)
- Relationship events (dates, calls, meetups, conflicts)
- Support given/received
- Quality time indicators
- Isolation/loneliness signals
- Commitment fulfillment mentions

**Outcome Scoring Factors (4 sub-scores, each 0-25):**

| Factor | Score Logic | Data Source |
|--------|-----------|-------------|
| **Connection Quality** (0-25) | Depth of logged interactions (meaningful conversations > brief mentions). Sentiment of relationship logs. Variety of inner circle members engaged. Not just frequency — a deep 1-hour conversation scores higher than 5 "said hi" logs. | Memory |
| **Commitment Fulfillment** (0-25) | Are `dailyCommitments` being logged as completed? (e.g., "had dinner with wife" if commitment is "dinner with wife"). Progress toward `socialGoals`. Inner circle engagement regularity. | Profile + memory |
| **Social Energy Balance** (0-25) | Actual social activity vs. stated `socialEnergy`. Introverted user with 10 social events/week = over-socialized (lower score). Extroverted user with 0 social logs = under-socialized. Balanced when actual matches preference. | Profile + memory |
| **Relationship Health** (0-25) | Absence of unresolved conflict signals. Positive sentiment in relationship logs. For partnered users: quality time logged, love language expression detected. For single users: social expansion activity, dating if desired. Attachment style awareness (flag anxious/avoidant patterns). | Profile + memory |

**Example AI Output:**
```json
{
  "dimension": "RELATIONSHIPS",
  "status": "needs_attention",
  "score": 55,
  "insight": "Only 2 social interactions logged in 14 days, both surface-level. As a balanced social energy type, you typically need 4-5 meaningful connections per week.",
  "gap": "Zero contact with inner circle members (Mum, Dad, Sarah) in the past 3 weeks despite daily commitment 'call parents weekly'.",
  "nextStep": "Call your mum today. A 15-minute call fulfills your weekly commitment and she's the longest gap in your inner circle log.",
  "projection": "Extended isolation from inner circle often correlates with declining emotional resilience. With your team offsite in 12 days, emotional buffer matters.",
  "fidelityLevel": 2
}
```

### 5.4 SPIRITUAL Dimension

**Profile Data Used:**
- `spiritual.worldview` → Belief system framework (Christian, Stoic, Secular, Buddhist, etc.)
- `spiritual.coreValues` → Stated core values (e.g., ["integrity", "growth", "compassion", "excellence"])
- `spiritual.practicePulse` → Intended practice frequency (Daily/Weekly/Monthly/Occasionally/Rarely)

**Memory Data Used (category: SPIRITUAL):**
- Spiritual practice logs (meditation, prayer, reflection, journaling, worship)
- Values-aligned decision mentions (acted on integrity, chose growth over comfort)
- Meaning-making moments (gratitude, purpose reflections)
- Community/fellowship involvement
- Spiritual struggle/doubt mentions
- Reading/study (scriptures, philosophy, spiritual texts)

**Outcome Scoring Factors (4 sub-scores, each 0-25):**

| Factor | Score Logic | Data Source |
|--------|-----------|-------------|
| **Practice Consistency** (0-25) | Actual practice frequency vs. stated `practicePulse`. Daily intention = need 5+/7 days for high score. Weekly = need 1/week. Score = (actual / target) × 25. Long streaks get bonus. | Profile + memory |
| **Values Alignment** (0-25) | AI evaluates whether logged actions and decisions across ALL dimensions align with stated `coreValues`. Flag "moral friction" when actions contradict values (e.g., value "health" but no health activity). High alignment = high score. | Profile + memory (cross-dimensional) |
| **Reflection Depth** (0-25) | Quality of spiritual logs, not just frequency. Logs with genuine introspection, gratitude, meaning-making score higher. Brief check-ins count less than thoughtful reflections. Evidence of growth in understanding over time. | Memory |
| **Community & Purpose** (0-25) | Fellowship/community engagement (adapted to worldview: church, sangha, philosophy club, etc.). Sense of purpose indicators in logs. Service/contribution mentions. Worldview exploration and deepening. | Memory |

**Example AI Output:**
```json
{
  "dimension": "SPIRITUAL",
  "status": "no_signal",
  "score": 15,
  "insight": "Zero spiritual practice logged in 45 days. Your stated intention was weekly practice aligned with your Stoic worldview.",
  "gap": "Your core values include 'resilience' and 'wisdom' but no reflective practice is feeding them.",
  "nextStep": "Start a 5-minute evening reflection tonight. One journal prompt: 'What did I control today, and what did I release?'",
  "projection": "Without a grounding practice, stress tolerance typically drops during high-pressure periods. Your career is peaking — this is when spiritual grounding matters most.",
  "missingData": ["Log your first spiritual practice to begin tracking"],
  "fidelityLevel": 1
}
```

### 5.5 PERSONAL Dimension

**Profile Data Used:**
- `personal.jobRole` → Current role (career trajectory baseline)
- `personal.company` → Workplace context
- `personal.interests` → Hobbies and interests (fulfillment measurement)
- `personal.personalityType` → MBTI/Enneagram (strength/growth area identification)
- `personal.communicationStyle` → Direct/Storyteller/etc. (self-expression baseline)
- `personal.archetype` → Self-identified archetype (The Creator, The Sage, etc.)
- `identify.location` → Local opportunities for growth
- `identify.birthday` → Age-adjusted career benchmarks

**Memory Data Used (category: PERSONAL):**
- Career updates (achievements, promotions, challenges, learning)
- Skill development logs (courses, practice, certifications)
- Interest pursuit logs (hobbies, creative work, side projects)
- Personal milestone achievements
- Self-improvement activities (reading, therapy, coaching)
- Creative output and intellectual engagement

**Outcome Scoring Factors (4 sub-scores, each 0-25):**

| Factor | Score Logic | Data Source |
|--------|-----------|-------------|
| **Career Trajectory** (0-25) | Job satisfaction signals from logs. Professional growth activities (learning, networking, skill building). Career milestone achievements. Role alignment with stated interests and archetype. Stagnation detection if no career-related logs in 30 days. | Profile + memory |
| **Interest Engagement** (0-25) | Are stated `interests` being actively pursued in logs? Frequency of hobby/interest-related activity. New skill acquisition. If 0 interest-related logs despite listing interests → low score. | Profile + memory |
| **Growth Momentum** (0-25) | Learning activities (reading, courses, mentoring). Self-improvement actions logged. Personality strengths being exercised (MBTI-aligned activities). Evidence of deliberate personal development. | Memory |
| **Creative Expression** (0-25) | Output and creation logs (writing, building, making). Communication style being utilized in meaningful contexts. Personal project progress. Contribution to community or field. Archetype alignment (is The Creator creating? Is The Sage teaching?). | Profile + memory |

**Example AI Output:**
```json
{
  "dimension": "PERSONAL",
  "status": "thriving",
  "score": 81,
  "insight": "Strong growth momentum — 4 skill development logs this week including your new TypeScript course. At 32, your Senior PM role at [company] shows solid career progression.",
  "gap": "Your stated interests include 'photography' and 'writing' but neither has been logged in 6 weeks. Work is thriving but personal expression is fading.",
  "nextStep": "Spend 20 minutes on photography or writing this weekend. Keeping personal interests alive prevents career-identity fusion.",
  "projection": "Career momentum is strong. But personal identity narrowing to just 'work' at your age often leads to burnout within 6-12 months.",
  "fidelityLevel": 3
}
```

---

## 6. Dashboard Layout & Interaction Design

### 6.1 Full Layout

Web browser dashboard — mission control style, all visible at once.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  "Good morning, Jonathan" · ⚠ Health streak at risk · 3/8 done · [Log]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SINCE LAST VISIT                                                        │
│  Finance ↑8 (salary update) · Health ↓3 (missed gym 3 days)             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LIFE CONTEXT                                          [↻ Refresh] [▾]  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  "At 32, leading product at [company] in Singapore, your career   │  │
│  │   is at a peak moment. But your health has been declining for 8   │  │
│  │   weeks — if sleep stays at 5.2h, expect energy to impact work    │  │
│  │   within 3 weeks. Your spiritual dimension shows no signal."      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│  │  HEALTH    │ │  FINANCE   │ │  SOCIAL    │ │  SPIRIT    │ │PERSONAL││
│  │  ⚠ Needs   │ │  ✓ Stable  │ │  → Steady  │ │  ● No      │ │✓ Strong││
│  │  Attention │ │            │ │            │ │  Signal    │ │        ││
│  │            │ │            │ │            │ │            │ │        ││
│  │  ◐ [58]   │ │  ◐ [72]   │ │  ◐ [65]   │ │  ◐ [40]   │ │ ◐ [81] ││
│  │   ↓12     │ │   ↑3      │ │   →0       │ │   ↓5      │ │  ↑8    ││
│  │  ▁▃▅▂▂   │ │  ▂▃▃▅▅   │ │  ▃▃▃▃▃   │ │  ▅▃▂▂▁   │ │ ▂▃▅▇▇ ││
│  │           │ │           │ │           │ │           │ │        ││
│  │"avg 5.2h │ │"savings   │ │"low depth │ │"no active │ │"new    ││
│  │ sleep"   │ │ rate +4%" │ │ contact"  │ │ practice" │ │ skill  ││
│  │gap: sleep│ │gap: invest│ │gap: reach │ │gap: start │ │momen-  ││
│  │ schedule │ │ diversity │ │ out more  │ │ anything  │ │tum"    ││
│  │→ Fix 10pm│ │→ Review   │ │→ Call mum │ │→ Try 5min │ │→ Share ││
│  │  bedtime │ │  portfolio│ │ this week │ │  journal  │ │ work   ││
│  └───[click]─┘ └───[click]─┘ └───[click]─┘ └───[click]─┘ └─[click]┘│
│       │              │              │              │            │       │
│       └──────────────┴──────────────┴──────────────┴────────────┘       │
│                         clicks auto-select matching tab below ↓         │
│                                                                          │
│  [ⓘ Savings rate is 24%, but without investments, portfolio efficiency   │
│     can't be assessed. Add investment details →]                        │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LIFE TRACKING                                                           │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────┐  │
│  │                                         │  │                      │  │
│  │  TODAY'S FOCUS          3/8 done ████░░  │  │  UPCOMING             │  │
│  │  ① Book physio · Health · 15min [☐]    │  │                      │  │
│  │  ② Review Jan spend · Finance · 10m[☐] │  │  Medical checkup     │  │
│  │  ③ Call mum · Relationships · 20m [☐]  │  │  4 days · ⚠ Prep     │  │
│  │                                         │  │  [Activate prep]     │  │
│  ├─────────────────────────────────────────┤  │                      │  │
│  │                                         │  │  Team offsite        │  │
│  │  ● Health  ○ Finance  ○ Social  ...     │  │  12 days · ✓ Ready   │  │
│  │  (tab bar — status dots — click cards   │  │                      │  │
│  │   above to auto-select tab here)        │  │  Wife's birthday     │  │
│  │  ────────────────────────────────────── │  │  18 days · ○ Plan    │  │
│  │                                         │  │  [Start planning]    │  │
│  │  Goal: Run 5km by Mar ─── [62%] ██░░░  │  │                      │  │
│  │  Weekly: ████░░░ (4/7 days) 🔥 6 days  │  │                      │  │
│  │  "Best week in 3 months" ↑              │  │                      │  │
│  │                                         │  │ ┌──────────────────┐ │  │
│  │  → 30min morning run (3x this week)     │  │ │ No events?       │ │  │
│  │    Why: Energy peaks at 7am per logs.   │  │ │ [Schedule event]  │ │  │
│  │    Serves: "Run 5km" goal               │  │ └──────────────────┘ │  │
│  │    From: Health rec #4                  │  │                      │  │
│  │    [ ] Mon [✓] Tue [ ] Wed [ ] Thu      │  │                      │  │
│  │                                         │  │                      │  │
│  │  → Book physio for knee pain            │  │                      │  │
│  │    Why: 3 knee mentions in 14 days.     │  │                      │  │
│  │    [ ] Not started · 15min              │  │                      │  │
│  │                                         │  │                      │  │
│  └─────────────────────────────────────────┘  └──────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 "Since Last Visit" Micro-Summary

Sits between the header and Life Context. Shows dimension score changes since the user's last session.

- Computed by comparing current scores to scores stored at end of last session.
- Format: `"Finance ↑8 (salary update) · Health ↓3 (missed gym 3 days)"` — dimension + delta + brief reason.
- Only shows dimensions that changed ≥ 3 points.
- If no score changes: falls back to `DailyIntelligence` data instead of "nothing happened":
  - Streak at risk: `"Health: 6-day streak breaks today if no log."`
  - Dimension gap: `"12 days since your last Spiritual log."`
  - Event approaching: `"Medical checkup in 4 days — prep needed."`
  - Commitment: `"Daily commitment 'call parents' not yet fulfilled this week."`
- Only shows "No changes" as absolute last resort when truly nothing is stale or urgent.
- Auto-hides after first scroll down (doesn't permanently occupy space).

### 6.3 Click-Through: Dimension Card → Dimension Tab

When user clicks a dimension card in the Life Context section:
1. The matching tab in the Life Tracking section's `DimensionTabStrip` auto-selects.
2. The Life Tracking panel smooth-scrolls into view if not already visible.
3. The selected tab content (goals, tasks, habits for that dimension) is displayed.

This creates a direct **analysis → action bridge**. "Health needs attention" → click → "here are your Health goals and tasks."

### 6.4 CTA Map (Call-to-Action at Every Level)

| Location | Primary CTA | Secondary CTA | Purpose |
|----------|------------|---------------|---------|
| **Header** | `[Log]` button | `[Plan my day]` button + contextual status line (streak/event/completion) | Entry point + daily awareness |
| **Since Last Visit** | Implicit (tap dimension name to scroll) | — | Orient user on changes |
| **Life Snapshot** | `[↻ Refresh]` → regenerate all analysis | `[▾]` expand/collapse toggle | Manual full refresh |
| **Life Snapshot (expanded)** | — | `[View history]` link → opens history panel | Access improvement tracker |
| **Dimension Card** | Click → auto-select matching tab below | Hover shows tooltip: "View [dimension] goals & tasks" | Bridge analysis to action |
| **Profile Gap Nudge** | `[Add income details →]` → opens Settings to relevant section | `[✕]` dismiss (remembers dismissal for 7 days) | Improve analysis quality |
| **Today's Focus header** | Completion meter: "3/8 done" with progress bar | `[Plan my day]` re-generate button | Daily satisfaction tracking |
| **Today's Focus item** | `[☐]` checkbox → complete task | Expand to see rationale | Execute daily priorities |
| **Dimension Tab** | Click tab to switch dimension view | Status dot indicates urgency | Navigate between dimensions |
| **Goal Progress Card** | — (informational) | `[View full goal]` → opens goal detail | Track progress |
| **Task Card** | `[☐]` checkbox → complete task | Click to expand rationale, lineage, methodology | Execute with understanding |
| **Upcoming item** | `[Activate prep plan]` / `[Start planning]` | Click event title → view/edit event details | Prepare for upcoming events |
| **Contribution Card** | Auto-dismisses in 5s | Tap to dismiss early | Reward logging behavior |

### 6.5 Empty States

Every component has a designed empty state with a clear CTA:

| Component | When Empty | Message | CTA |
|-----------|-----------|---------|-----|
| **Life Snapshot** | No narrative generated yet (post-onboarding, pre-first-refresh) | "Your life analysis is being generated..." | Shimmer loading state, then auto-populates |
| **Life Snapshot** | Profile too incomplete for narrative | "Complete your profile to unlock your personalized life analysis." | `[Open profile →]` |
| **Dimension Card (Level 0)** | Required profile fields missing | "Add your [height/income/etc.] to unlock [Health/Finance] insights." | `[Complete profile →]` |
| **Dimension Card (Level 1)** | Profile complete, no memory logged | Shows baseline assessment with muted styling | `"Log your first [health/finance] update for deeper insights"` with template pill |
| **Since Last Visit** | First visit or no changes | "Welcome back. No dimension changes since your last visit." | `[Log a check-in]` |
| **Today's Focus** | No daily plan generated yet | "No tasks yet. Log a check-in to generate your daily plan." | `[Log check-in]` |
| **Dimension Tab (no goals)** | No goals for this dimension | "No [Health] goals yet. Accept a recommendation to set your first goal." | `[View recommendations]` |
| **Dimension Tab (no tasks)** | Goals exist but no tasks today | "No [Health] tasks for today. Your next task generates tomorrow." | — (informational) |
| **Upcoming (no events)** | No upcoming events | "No upcoming events. Schedule one for prep support." | `[Schedule event]` |
| **Contribution Card** | Never rendered when nothing to show | — | — |

### 6.6 Key User Flows

**Flow 1: First Visit After Onboarding (Day 1)**
```
Onboarding completes (Step 7: Activation)
    ↓
refreshDimensionContexts(ALL_5) fires with profile-only data
    ↓
Dashboard loads → "Since Last Visit" shows "Welcome to your life dashboard."
    ↓
Life Snapshot shows narrative (Level 1: baseline from profile)
    ↓
5 dimension cards show Level 1 assessments (profile-derived)
Cards with missing required fields show Level 0 with profile completion CTA
    ↓
ProfileGapNudge shows 1-2 most impactful missing fields
    ↓
Today's Focus shows "Log your first check-in to generate tasks"
    ↓
User logs first check-in → Contribution Card appears → dimension updates to Level 2
```

**Flow 2: Returning User, Significant Log**
```
User opens dashboard
    ↓
"Since Last Visit" shows: "Health ↓3 (2 missed gym days)"
    ↓
User reads Life Context, sees Health card amber/needs_attention
    ↓
User logs: "Got promoted, salary now $18,000/month"
    ↓
LOG_BAR_INGEST classifies: Tier 1, affectedDimensions: [FINANCE]
    ↓
Finance card enters LOADING state (shimmer animation)
Other 4 cards remain interactive
    ↓
AI returns: Finance score 72 → 80 (+8), status: "thriving"
    ↓
Finance card transitions LOADING → FRESH
Score ring animates 72 → 80, delta badge "+8 ↑" scales in
    ↓
ContributionCard slides up: "Finance +8 · Goal: Emergency fund +5%"
    ↓
Auto-dismisses after 5 seconds
    ↓
Since this is only 1 dimension, narrative paragraph does NOT regenerate (cost optimization)
```

**Flow 3: Exploring a Dimension (Analysis → Action Bridge)**
```
User sees Health card is amber (⚠ Needs Attention, score 52)
    ↓
User clicks Health dimension card
    ↓
Dashboard smooth-scrolls to Life Tracking section
Health tab auto-selects in DimensionTabStrip
    ↓
DimensionTrackPane shows:
  - Goal: "Run 5km by March" [62%] with weekly tracker
  - Task 1: "30min morning run" with rationale + lineage
  - Task 2: "Book physio for knee" with rationale
  - Habit: "Stretching" weekly grid
    ↓
User completes "Book physio" → checkbox animates → task marked done
    ↓
Simple "✓ Done" confirmation (task completion is Tier 3, no dimension refresh)
    ↓
User logs: "Booked physio at Mount Elizabeth for Friday"
    ↓
Tier 2 counter for Health increments (count: 1 → doesn't trigger yet)
```

**Flow 4: Tier 2 Accumulation**
```
Monday: User logs "Went for a 3km run" → Health Tier 2 count: 1
Tuesday: User logs "Slept 7.5 hours" → Health Tier 2 count: 2
Wednesday: User logs "Tennis with John" → Health Tier 2 count: 3 → THRESHOLD
    ↓
refreshDimensionContexts([HEALTH]) fires automatically
    ↓
Health card enters LOADING, then returns FRESH
Score may have improved: insight now references actual logged exercise and sleep
    ↓
ContributionCard: "Health +6 · 3 logs this week"
```

---

## 7. Data Model Additions

### New interfaces (in `data/types.ts`)

```typescript
// Individual dimension assessment from AI
interface DimensionContextSnapshot {
  dimension: Category
  status: 'thriving' | 'stable' | 'needs_attention' | 'critical' | 'no_signal'
  score: number                   // 0-100 (outcome-based per Section 5)
  trend: 'up' | 'down' | 'stable'
  delta: number                   // score change from last snapshot
  insight: string                 // 1 specific, data-grounded sentence (<30 words)
  gap: string                     // 1 critical gap (<20 words)
  nextStep: string                // 1 concrete action (<20 words)
  projection?: string             // "if nothing changes, expect X" (<30 words)
  missingData?: string[]          // profile fields that would improve analysis
  fidelityLevel: 0 | 1 | 2 | 3   // how much data backs this assessment
  generatedAt: string             // ISO timestamp
  triggeredBy?: string            // memoryEntry id that caused refresh
}

// Full life context snapshot (the paragraph + all 5 dimensions)
interface LifeContextSnapshot {
  id: string
  snapshotAt: string              // ISO timestamp
  weekLabel: string               // "Week of Feb 10, 2026"
  narrativeParagraph: string      // 2-4 sentence personalized life brief
  dimensions: DimensionContextSnapshot[]  // exactly 5
  criticalPriorities: CriticalPriority[]  // top 3 cross-dimensional
  profileGaps: ProfileGap[]       // what data is missing
  profileHash: string             // hash of profile at snapshot time (detects stale snapshots)
}

interface CriticalPriority {
  dimension: Category
  title: string                   // e.g. "Fix sleep schedule"
  rationale: string               // 1 sentence why this matters now
  consequence: string             // "if unaddressed, expect X within Y weeks"
}

interface ProfileGap {
  field: string                   // e.g. "finances.income"
  dimension: Category
  prompt: string                  // user-facing nudge text
  impactDescription: string       // what unlocks when filled
}

// Contribution card shown after logging
interface ContributionFeedback {
  logSummary: string              // what was logged
  affectedDimensions: {
    dimension: Category
    scoreBefore: number
    scoreAfter: number
    delta: number
  }[]
  goalImpacts?: {
    goalTitle: string
    progressBefore: number
    progressAfter: number
  }[]
  streakUpdate?: {
    dimension: Category
    days: number
    isMilestone: boolean          // true at 7, 14, 30, 60, 90 days
  }
}

// Smart trigger signal (added to IntakeResult item)
interface LifeContextSignal {
  tier: 1 | 2 | 3
  affectedDimensions: Category[]
  reason: string
}

// Tier 2 accumulation tracker (local state, not vault)
interface DimensionLogAccumulator {
  counts: Record<Category, number>
  weekOf: string                  // YYYY-WW, resets weekly
}

// Links from Task → Goal → Recommendation (traceability)
interface TaskLineage {
  goalId?: string
  goalTitle?: string
  recommendationId?: string
  recommendationTitle?: string
}

// Pre-computed metrics passed to AI (see Section 3.8 for full definition)
// Computed client-side from profile + memory BEFORE sending to AI.
// AI receives FACTS, not raw data. Eliminates calculation errors.
interface PreComputedMetrics {
  // HEALTH
  bmi: number | null
  bmiCategory: string | null
  baselineSleepHours: number | null
  loggedSleepAvg: number | null
  exerciseSessionsThisWeek: number
  exerciseTarget: number
  exerciseAdherence: number
  daysSinceLastExercise: number | null
  // FINANCE
  savingsRate: number | null
  netWorth: number | null
  emergencyFundMonths: number | null
  debtToIncomeRatio: number | null
  // RELATIONSHIPS
  socialInteractions14d: number
  innerCircleGaps: { name: string, role: string, daysSinceContact: number }[]
  commitmentsFulfilled7d: number
  commitmentsTotal: number
  // SPIRITUAL
  practiceSessionsThisWeek: number
  practiceTarget: number
  practiceAdherence: number
  daysSinceLastPractice: number | null
  // PERSONAL
  careerLogsThisMonth: number
  interestLogsThisMonth: number
  growthLogsThisMonth: number
  statedInterests: string[]
  // CROSS-DIMENSIONAL
  dimensionLogCounts30d: Record<Category, number>
}

// Client-computed daily intelligence (see Section 3.9 for full definition)
// 100% client-side, zero API calls. Guarantees fresh info every day.
interface DailyIntelligence {
  dimensionGaps: { dimension: Category, daysSinceLastLog: number, label: string }[]
  streaksAtRisk: { dimension: Category, currentStreak: number, breaksToday: boolean }[]
  eventCountdowns: { event: TimelineEvent, daysUntil: number, prepReady: boolean, urgencyLabel: string }[]
  goalDeadlines: { goal: Goal, daysLeft: number, onTrack: boolean, urgencyLabel: string }[]
  todaysCommitments: { commitment: string, fulfilled: boolean }[]
  dailyPlanStale: boolean
  tasksCompleted: number
  tasksTotal: number
}

// "Since Last Visit" delta
interface SessionDelta {
  dimension: Category
  scoreBefore: number
  scoreAfter: number
  delta: number
  reason: string                  // brief explanation of what changed
}
```

### Vault schema additions
- `lifeContextSnapshots: LifeContextSnapshot[]` — append-only history
- `latestDimensionSnapshots: Record<Category, DimensionContextSnapshot>` — current state (fast access)
- `lastSessionScores: Record<Category, number>` — scores when user last closed the dashboard (for "Since Last Visit")
- `dashboardPreferences: { lifeSnapshotExpanded: boolean, selectedDimension: Category }` — layout preferences (persist last-selected tab)

---

## 8. New AI Prompts

### 8.1 `DIMENSION_CONTEXT_PROMPT` (new)

Evaluates 1-5 dimensions in a single API call. Accepts an array of dimensions to evaluate.

**Input context:**
- `dimensions_to_evaluate`: Category[] (which of the 5 to assess)
- `profile`: full UserProfile (not compact — needs age, location, job, income for personal context)
- `memory_by_dimension`: Record<Category, MemoryEntry[]> (last 30 days, filtered per dimension)
- `goals_by_dimension`: Record<Category, Goal[]>
- `previous_snapshots`: Record<Category, DimensionContextSnapshot> (for delta calculation)
- `current_date`: ISO string

**Output:** Array of `DimensionContextSnapshot` objects (one per evaluated dimension).

**Key prompt rules:**
- Refer to the Dimension Analysis Specifications (Section 5) for each dimension's scoring factors
- `insight` MUST reference a specific data point (number, date, or fact from memory/profile)
- `nextStep` MUST be executable in under 5 minutes — no vague advice
- `projection` MUST state a consequence and a timeframe
- `fidelityLevel`: 0 = missing required profile fields, 1 = profile only, 2 = some memory (3-10 items), 3 = rich data (10+ entries)
- If fidelityLevel is 0: `status` must be `no_signal`, list required missing fields
- If fidelityLevel is 1: ground assessment purely in profile data, explicitly note what would improve with logging
- Max 30 words per text field
- Score is outcome-based per Section 5 specifications — not logging frequency
- Every field must be grounded in the user's actual data — never generic advice
- Cross-reference profile data: use age for benchmarks, location for context, job for expectations
- For Health specifically: calculate BMI from height+weight, sleep hours from sleepTime+wakeTime, exercise gap from activityFrequency vs logged sessions

### 8.2 `LIFE_SNAPSHOT_SYNTHESIS_PROMPT` (new)

Synthesizes all 5 dimension snapshots into a human-readable life narrative.

**Input context:**
- `profile`: full UserProfile
- `dimension_snapshots`: DimensionContextSnapshot[5]
- `current_date`: ISO string

**Output:**
```json
{
  "narrativeParagraph": "2-4 sentences...",
  "criticalPriorities": [
    { "dimension": "...", "title": "...", "rationale": "...", "consequence": "..." }
  ],
  "profileGaps": [
    { "field": "...", "dimension": "...", "prompt": "...", "impactDescription": "..." }
  ]
}
```

**Key prompt rules:**
- Narrative MUST weave in: user's age (calculated from birthday), location, job role, relationship status, at least 2 real numbers from dimension data
- Tone: trusted advisor — honest, specific, never condescending, never generic
- `criticalPriorities` exactly 3, sorted by urgency (most critical first)
- Each priority MUST include a consequence with a timeframe
- Never surface a `no_signal` dimension as priority #1 — suggest logging instead
- Never repeat the same priority across consecutive refreshes unless the situation genuinely hasn't changed
- `profileGaps` should list the highest-impact missing fields first (the ones that unlock the most analytical depth)

### 8.3 Extend `LOG_BAR_INGEST_PROMPT` (modify existing)

Add `lifeContextSignal` to the output schema of each intake item:

```
LIFE CONTEXT SIGNAL — for each item, classify:

TIER 1 (immediate refresh trigger — life-significant change):
  Finance:       salary/income change, job change, promotion, layoff, major asset/debt
  Health:        new diagnosis, major habit start/stop, injury, significant pattern shift
  Relationships: relationship status change, marriage, divorce, major family event
  Spiritual:     new practice start/stop, worldview change, spiritual crisis
  Personal:      career pivot, relocation, major milestone, completed long-term goal

TIER 2 (accumulation — dimension-relevant but not life-changing):
  Any dimension-relevant memory that doesn't qualify as Tier 1.
  e.g., "went for a run", "had lunch with a friend", "spent $50 on groceries"

TIER 3 (no life context signal — omit the field):
  Event scheduling/editing, task completion, reminders, prep plan activation.

Output format:
  "lifeContextSignal": { "tier": 1, "affectedDimensions": ["FINANCE"], "reason": "Salary change to $18,000/month" }
```

---

## 9. AI Service Functions

### New functions in `geminiService.ts`

```typescript
// Batch-refresh 1-5 dimension contexts in a single API call
refreshDimensionContexts(
  dimensions: Category[],
  profile: UserProfile,
  memoryByDimension: Record<Category, MemoryEntry[]>,
  goalsByDimension: Record<Category, Goal[]>,
  previousSnapshots: Record<Category, DimensionContextSnapshot>,
  promptConfig?: PromptConfig
): Promise<DimensionContextSnapshot[]>

// Synthesize narrative paragraph from all 5 current snapshots
generateLifeSnapshot(
  profile: UserProfile,
  dimensionSnapshots: DimensionContextSnapshot[]
): Promise<{
  narrativeParagraph: string,
  criticalPriorities: CriticalPriority[],
  profileGaps: ProfileGap[]
}>
```

### Modified function
- `processInput()` — parse and return `lifeContextSignal` from ingest response

### New helper functions in `prompts.ts`
- `buildDimensionContext(memoryItems, goals, dimension, days=30)` — filters memory and goals for a specific dimension + date range, returns formatted context string
- `buildProfileForDimension(profile, dimension)` — extracts the relevant profile section + cross-dimensional fields (age, location, values) for a specific dimension analysis
- `computeProfileHash(profile)` — deterministic hash of profile fields for snapshot staleness detection

---

## 10. State Management

### New hook: `useLifeContext()`

Owns all Life Context state. Reads from `useAura()` but manages its own domain.

```typescript
interface LifeContextState {
  // Current state
  currentSnapshots: Record<Category, DimensionContextSnapshot>
  currentNarrative: string | null
  criticalPriorities: CriticalPriority[]
  profileGaps: ProfileGap[]

  // History
  snapshotHistory: LifeContextSnapshot[]

  // Session
  sessionDeltas: SessionDelta[]               // "Since Last Visit" data
  lastSessionScores: Record<Category, number>  // saved on unmount

  // Refresh state
  refreshingDimensions: Set<Category>    // which cards are loading
  isRefreshingNarrative: boolean
  refreshedThisSession: Set<Category>    // tracks for auto-narrative threshold

  // Tier 2 accumulator
  accumulator: DimensionLogAccumulator

  // Preferences
  isSnapshotExpanded: boolean

  // Active dimension (for card → tab bridge)
  selectedDimension: Category

  // Client-computed layers (no API calls)
  dailyIntelligence: DailyIntelligence    // recomputed on mount + after each log
  preComputedMetrics: PreComputedMetrics   // recomputed before each AI call
}

interface LifeContextActions {
  // Trigger handling (called by useAura after each logMemory)
  handleLifeContextSignal(signal: LifeContextSignal): void

  // Manual refresh
  refreshAllDimensions(): Promise<void>
  refreshDimension(dimension: Category): Promise<void>

  // Navigation bridge
  selectDimension(dimension: Category): void

  // Preferences
  toggleSnapshotExpanded(): void

  // Contribution feedback
  computeContribution(newMemory: MemoryEntry): ContributionFeedback

  // Session tracking
  saveSessionScores(): void  // called on unmount / visibility change
}
```

### `useAura.ts` changes (minimal)
- After `logMemory()` succeeds, call `lifeContext.handleLifeContextSignal(signal)` if signal exists
- Expose `profile`, `memoryItems`, `goals` for `useLifeContext` to read
- No other structural changes to the monster hook

### Signal dispatch flow

```
logMemory() completes
    ↓
Check intake result for lifeContextSignal
    ↓
TIER 1:
  → Call refreshDimensionContexts(signal.affectedDimensions)
  → Each affected card enters LOADING state (shimmer)
  → On response: update card, show ContributionFeedback, animate score delta
  → Add to refreshedThisSession set
  → If refreshedThisSession.size >= 3: auto-trigger generateLifeSnapshot()

TIER 2:
  → Increment accumulator[dimension]
  → If count >= 3: trigger refreshDimensionContexts([dimension]), reset count

TIER 3:
  → No-op for life context (may still show simple "Logged" toast)
```

---

## 11. Component Architecture

### New components

```
dashboard/
├── SinceLastVisit.tsx                ← Session delta micro-summary
│
├── LifeContextPanel.tsx              ← Section 1 orchestrator
│   ├── LifeSnapshotCard.tsx          ← Narrative paragraph (expand/collapse)
│   ├── DimensionMissionControl.tsx   ← 5-card row container
│   │   └── DimensionCard.tsx         ← Individual card (6 states)
│   │       └── ScoreRing.tsx         ← SVG animated score arc
│   ├── ProfileGapNudge.tsx           ← Missing data prompts (conditional)
│   └── ContributionCard.tsx          ← Post-log feedback overlay
│
├── LifeTrackingPanel.tsx             ← Section 2 orchestrator (2-column layout)
│   ├── TodaysFocus.tsx               ← 3 cross-dimensional priority items (updated)
│   ├── DimensionTabStrip.tsx         ← Tab bar with status dots, FIXED order (H→F→R→S→P)
│   │   └── DimensionTrackPane.tsx    ← Goal + tasks + habits per selected dimension
│   │       ├── GoalProgressCard.tsx  ← Goal with progress bar + streak + milestone callout
│   │       ├── TaskCard.tsx          ← Task with rationale + lineage + completion
│   │       └── HabitTracker.tsx      ← Weekly habit grid (Mon-Sun checkboxes)
│   └── UpcomingEvents.tsx              ← Upcoming events with prep status (right column)
│
└── LifeContextHistory.tsx            ← Historical snapshot comparison (accessed via "View history")
```

### Component state machine: DimensionCard

```
States:
  NO_DATA     → muted card, "Add [field] to unlock [dimension] insights" + CTA
  BASELINE    → profile-only analysis, subtle label "Log more for deeper insights"
  STALE       → shows last known data, faint "Updated 3 days ago" label
  LOADING     → shimmer animation overlay, "Recalculating..." label
  FRESH       → full data, animated score delta badge, "Just updated" label
  ERROR       → last known data + subtle error indicator, retry button

Transitions:
  NO_DATA → BASELINE    (when required profile fields filled for this dimension)
  BASELINE → LOADING    (when first Tier 1/2 trigger fires)
  LOADING → FRESH       (on successful AI response)
  LOADING → ERROR       (on AI failure, shows last known data)
  FRESH → STALE         (after 7 days without refresh)
  STALE → LOADING       (on manual refresh or new trigger)
  any → LOADING         (when refresh triggered)

  Click interaction (any non-LOADING state):
    → Calls selectDimension(dimension)
    → Triggers smooth scroll to Life Tracking + auto-selects matching tab
```

### Removed components
- `SignalGrid.tsx` → replaced by `DimensionMissionControl`
- `DailyBriefing.tsx` → focus logic moves to `TodaysFocus.tsx`, narrative to `LifeSnapshotCard.tsx`
- `GoalsSpotlight.tsx` → replaced by `DimensionTrackPane.tsx`
- `UpcomingCalendar.tsx` → replaced by `UpcomingEvents.tsx`
- `FocusList.tsx` → replaced by `DimensionTrackPane.tsx` + `TaskCard.tsx`

### Preserved components (updated)
- `DashboardView.tsx` → restructured to compose `SinceLastVisit` + `LifeContextPanel` + `LifeTrackingPanel`
- `DashboardHeader.tsx` → updated with life coherence score + notification count
- `CommandStrip.tsx` → kept as-is
- `SystemStatusFooter.tsx` → updated with snapshot freshness indicator

---

## 12. Visual Design Specifications

### Dimension Card Visual Language

Each dimension has a unique visual identity:

| Dimension | Gradient | Accent | Icon |
|-----------|----------|--------|------|
| Health | emerald-50 → teal-50 | emerald-500 | Activity |
| Finance | amber-50 → yellow-50 | amber-500 | Wallet |
| Social | rose-50 → pink-50 | rose-500 | Heart |
| Spirit | violet-50 → purple-50 | violet-500 | Zap |
| Personal | sky-50 → blue-50 | sky-500 | User |

### Score Ring
- SVG animated arc (0-100 mapped to 0-360 degrees).
- Ring color matches dimension accent. Track (background) is `slate-800/20`.
- Ring fills on load with a 600ms spring animation.
- Score number centered inside the ring (`text-2xl font-bold`).
- Delta badge (+8 ↑) appears to the right with a scale-in animation.

### Sparkline
- 8-week trend line (computed from historical `computeScore()` with `referenceTime`).
- Gradient fill below the line (dimension accent color, 10% opacity).
- 48px tall, fits below the score ring.
- Current week's data point is a larger dot.
- Hover shows exact score for that week (tooltip).

### Status Badges
```
  Thriving        → emerald pill with subtle glow-shadow
  Stable          → slate pill, no glow
  Needs Attention → amber pill with slow pulse animation (1.5s)
  Critical        → rose pill with faster pulse animation (0.8s)
  No Signal       → dashed border, muted text, no background
```

### Loading State (per-card, independent)
- Shimmer animation (left-to-right gradient sweep) overlaid on the card.
- Score ring shows indeterminate spin (rotating gradient).
- "Recalculating..." label in muted text.
- Other 4 cards remain fully interactive — only the refreshing card shimmers.

### Contribution Card
- Slides up from the bottom of the viewport (300ms spring).
- Glass-morphism background (`backdrop-blur-md bg-slate-900/80`).
- Shows dimension icon + color-coded score delta (emerald for up, rose for down).
- Auto-dismisses after 5 seconds with fade-out, or tap to dismiss.
- If multiple dimensions affected, shows them side by side.

### Animations (framer-motion)
- Card state transitions: 200ms fade + 100ms scale
- Score delta badge: 400ms spring entrance (scale from 0 to 1)
- Score ring fill: 600ms spring on initial render, 400ms spring on value change
- Sparkline draw: 800ms path animation on mount
- Tab switch content: 150ms crossfade
- Contribution card: 300ms slide-up, 200ms fade-out on dismiss
- Smooth scroll to Life Tracking: 400ms ease-out
- Since Last Visit: fade-in on mount, fade-out on scroll

### Typography Hierarchy
- Since Last Visit: `text-sm text-slate-400`
- Life Snapshot paragraph: `text-base leading-relaxed text-slate-300`
- Dimension card score: `text-2xl font-bold` (inside ring)
- Dimension card label: `text-xs font-semibold uppercase tracking-wider text-slate-400`
- Dimension card insight/gap/nextStep: `text-xs text-slate-400 leading-snug`
- Today's Focus items: `text-sm font-medium text-slate-200`
- Task title: `text-sm font-medium text-slate-200`
- Task rationale: `text-xs text-slate-500 italic`
- Task lineage: `text-[10px] text-slate-600`
- Event title: `text-sm text-slate-300`
- Event meta: `text-xs text-slate-500`

---

## 13. Implementation Strategy (Crawl, Walk, Run)

### Phase 0: Foundation — Data & State (Crawl)
**Focus:** Types, state hook, and vault persistence. No UI changes yet.

**0.1 Add data models to `data/types.ts`**
- Add all interfaces from Section 7.
- **File:** `src/data/types.ts`

**0.2 Add vault persistence for snapshots**
- Add `lifeContextSnapshots`, `latestDimensionSnapshots`, `lastSessionScores`, `dashboardPreferences` to vault schema.
- Add save/load functions for snapshot history.
- **File:** `src/data/cryptoVault.ts`

**0.3 Create `useLifeContext()` hook**
- Implement full state management per Section 10.
- Implement `handleLifeContextSignal()` dispatch logic (Tier 1/2/3).
- Implement `computeContribution()` for feedback cards.
- Implement `saveSessionScores()` for "Since Last Visit" tracking.
- Implement `selectDimension()` for card → tab bridge.
- Implement `computePreComputedMetrics()` — client-side computation of BMI, sleep hours, savings rate, etc. (Section 3.8). Runs before every AI call.
- Implement `computeDailyIntelligence()` — 100% client-computed daily awareness layer (Section 3.9). Runs on every dashboard mount.
- Implement `computeFidelity()` — deterministic fidelity level per dimension (Section 3.8, Layer 2).
- Read from `useAura()` for profile, memory, goals.
- **File:** `src/core/useLifeContext.ts` (new)

**0.4 Wire `useLifeContext` into `useAura` minimally**
- After `logMemory()`, check for `lifeContextSignal` in intake result.
- Call `lifeContext.handleLifeContextSignal()` if signal present.
- **File:** `src/core/useAura.ts` (minimal additions only)

**Exit gate:** TypeScript compiles. `useLifeContext()` can be called from a component. Snapshot history persists across vault lock/unlock.

---

### Phase 1: AI Prompts & Service (Crawl)
**Focus:** The AI brain behind the new dashboard. Must work before building UI.

**1.1 Add `DIMENSION_CONTEXT_PROMPT`**
- Batch-capable (1-5 dimensions per call).
- Include the full Dimension Analysis Specifications from Section 5 as evaluation rules.
- Health: calculate BMI, sleep hours, exercise adherence from profile.
- Finance: calculate savings rate, net worth, emergency fund.
- Relationships: evaluate social energy balance, commitment fulfillment.
- Spiritual: evaluate practice consistency, values alignment.
- Personal: evaluate career trajectory, interest engagement.
- **File:** `src/ai/prompts.ts`

**1.2 Add `LIFE_SNAPSHOT_SYNTHESIS_PROMPT`**
- Narrative weaving rules (age from birthday, location, real numbers).
- Critical priority generation with consequences.
- Profile gap identification with impact descriptions.
- **File:** `src/ai/prompts.ts`

**1.3 Extend `LOG_BAR_INGEST_PROMPT` with `lifeContextSignal`**
- Add Tier classification rules per Section 8.3.
- Add output schema extension.
- **File:** `src/ai/prompts.ts`

**1.4 Add AI service functions**
- `refreshDimensionContexts()` — batch dimension evaluation.
- `generateLifeSnapshot()` — narrative synthesis.
- Update `processInput()` to parse and return `lifeContextSignal`.
- **File:** `src/ai/geminiService.ts`

**1.5 Add helper functions**
- `buildDimensionContext()` — filter memory by dimension + date range.
- `buildProfileForDimension()` — extract relevant profile fields.
- `computeProfileHash()` — deterministic hash for staleness detection.
- **File:** `src/ai/prompts.ts`

**Exit gate:** Can call `refreshDimensionContexts(['HEALTH'])` and get a valid, data-grounded `DimensionContextSnapshot` back that references specific profile data (BMI, sleep hours, etc.). Can call `generateLifeSnapshot()` and get a narrative that includes user's age, location, and real numbers.

---

### Phase 2: Life Context Panel — UI (Walk)
**Focus:** Build Section 1 of the new dashboard.

**2.1 `ScoreRing.tsx`**
- SVG arc component. Props: `score`, `maxScore`, `color`, `size`.
- Animated fill on mount and value change.
- Score number centered inside.
- **File:** `src/dashboard/ScoreRing.tsx` (new)

**2.2 `DimensionCard.tsx`**
- Score ring + sparkline + status badge + insight/gap/nextStep fields.
- 6 states per state machine (Section 11).
- Shimmer loading overlay (independent per card).
- Click handler: calls `selectDimension(dimension)`.
- Dimension-specific gradient and accent color.
- Empty state for Level 0 with profile completion CTA.
- Baseline state for Level 1 with "log more" prompt.
- **File:** `src/dashboard/DimensionCard.tsx` (new)

**2.3 `DimensionMissionControl.tsx`**
- 5-column CSS grid of `DimensionCard` components.
- Passes refresh state per card (independent loading).
- **File:** `src/dashboard/DimensionMissionControl.tsx` (new)

**2.4 `LifeSnapshotCard.tsx`**
- Narrative paragraph display with expand/collapse.
- Critical priorities list (top 3, below paragraph when expanded).
- Refresh button + "View history" link.
- Loading state: text shimmer while AI generates.
- Empty state: "Your analysis is being generated..." or "Complete profile" CTA.
- **File:** `src/dashboard/LifeSnapshotCard.tsx` (new)

**2.5 `ProfileGapNudge.tsx`**
- Renders profile gaps as soft nudge cards. Max 2 shown.
- Each gap: **contextual** prompt referencing what the user ALREADY has + what's missing + CTA to open profile.
  - NOT: "Add income to unlock financial insights."
  - YES: "Your savings rate is 24%, but without investment details, portfolio efficiency can't be assessed. [Add investments →]"
  - Context is populated by `profileGaps[].prompt` from the AI, which receives pre-computed metrics and must reference them.
- Dismissible (remembers dismissal for 7 days).
- Only renders when `profileGaps.length > 0`.
- **File:** `src/dashboard/ProfileGapNudge.tsx` (new)

**2.6 `ContributionCard.tsx`**
- Glass-morphism overlay with slide-up animation.
- Shows dimension deltas + goal impacts + streak milestones.
- Auto-dismiss 5 seconds.
- **File:** `src/dashboard/ContributionCard.tsx` (new)

**2.7 `LifeContextPanel.tsx`**
- Composes: `LifeSnapshotCard` + `DimensionMissionControl` + `ProfileGapNudge`.
- Section header with "Life Context" label + refresh button.
- **File:** `src/dashboard/LifeContextPanel.tsx` (new)

**Exit gate:** Life Context Panel renders with real data. All 5 dimension cards visible with correct states. Clicking a card logs the `selectDimension` action. Expand/collapse persists. Loading shimmer works per-card. ContributionCard slides up and auto-dismisses. Empty states render for missing data.

---

### Phase 3: Life Tracking Panel — UI (Walk)
**Focus:** Build Section 2 of the new dashboard.

**3.1 Update `TodaysFocus.tsx`**
- **Completion meter header**: "3 of 8 tasks done" with progress bar (dimension accent gradient). Updates live as tasks complete. Feeds into DashboardHeader status line.
- Max 3 highlighted items, cross-dimensional (pull from `dailyPlan` top 3 by priority).
- Each item: title + dimension color pill + estimated time + checkbox.
- Preserve focus logic from `DailyBriefing.tsx` (declining dimensions, unprepped events, approaching goals).
- Auto-triggers `planMyDay()` if `DailyIntelligence.dailyPlanStale === true` (see Section 3.10).
- Empty state: "No tasks yet. Log a check-in to generate your daily plan." + `[Log check-in]`.
- **File:** `src/dashboard/TodaysFocus.tsx` (update existing)

**3.2 `GoalProgressCard.tsx`**
- Goal title + target date + animated progress bar (dimension accent color).
- Weekly streak indicator (Mon-Sun dots) + streak count.
- Milestone callout when significant ("Best week in 3 months").
- Empty state: "No goals for [dimension]. Accept a recommendation to set your first." + `[View recommendations]`.
- **File:** `src/dashboard/GoalProgressCard.tsx` (new)

**3.3 `TaskCard.tsx`**
- Task title + checkbox.
- Expandable section: rationale (why), benefits, methodology.
- Task lineage: "Serving: [Goal title] | From: [Recommendation title]".
- Estimated time + energy level badge (LOW/MEDIUM/HIGH).
- **File:** `src/dashboard/TaskCard.tsx` (new)

**3.4 `HabitTracker.tsx`**
- Weekly grid (Mon-Sun) with fill state per day.
- Streak count badge.
- Dimension-colored fills.
- **File:** `src/dashboard/HabitTracker.tsx` (new)

**3.5 `DimensionTrackPane.tsx`**
- Content of each dimension tab.
- Composes: `GoalProgressCard` + `TaskCard[]` + `HabitTracker`.
- Shows active goal(s) for the selected dimension.
- Shows 2-3 tasks related to those goals.
- Empty states per component (see Section 6.5).
- **File:** `src/dashboard/DimensionTrackPane.tsx` (new)

**3.6 `DimensionTabStrip.tsx`**
- Horizontal tab bar with dimension icon + label + status dot per tab.
- Tab order: FIXED — Health → Finance → Relationships → Spirit → Personal. Fixed order builds muscle memory; user always knows where each dimension lives.
- Default selection: `selectedDimension` from `useLifeContext` (card click bridge) OR most critical dimension on first load. Clicking a dimension card in Section 1 overrides the default.
- Animated underline indicator on tab switch.
- **File:** `src/dashboard/DimensionTabStrip.tsx` (new)

**3.7 `UpcomingEvents.tsx`**
- Vertical list of upcoming events (next 14 days, max 5).
- Each event: title, days until, prep status badge.
- CTAs: `[Activate prep plan]` for unprepped, `[Start planning]` for no prep.
- Empty state: "No upcoming events. Schedule one for prep support." + `[Schedule event]`.
- "View all" link if > 5 events.
- **File:** `src/dashboard/UpcomingEvents.tsx` (new)

**3.8 `LifeTrackingPanel.tsx`**
- Two-column layout: left 70% (TodaysFocus + DimensionTabStrip), right 30% (UpcomingEvents).
- Section header: "Life Tracking".
- **File:** `src/dashboard/LifeTrackingPanel.tsx` (new)

**Exit gate:** Life Tracking Panel renders with real data. Tab switching works with animation. Clicking a dimension card in Section 1 auto-selects the matching tab here. Tasks show lineage. Events show prep status. All empty states render correctly.

---

### Phase 4: Cold Start & Post-Onboarding Flow (Walk)
**Focus:** First-time user experience — no blank dashboard.

**4.1 Wire onboarding completion to first analysis**
- In `OnboardingView.tsx` Step 7 (ACTIVATION): after `runDeepInitialization()`, also call `refreshDimensionContexts(ALL_5)` to generate the first Life Context analysis.
- This runs in the background while the user sees their new dashboard for the first time.
- **File:** `src/onboarding/OnboardingView.tsx` (minimal addition)

**4.2 `SinceLastVisit.tsx`**
- Computes session deltas from `lastSessionScores` vs current scores.
- Shows dimension changes ≥ 3 points with brief reason.
- First visit: "Welcome to your life dashboard."
- No changes: "No changes since your last visit. Log something to update."
- Auto-hides on first scroll.
- **File:** `src/dashboard/SinceLastVisit.tsx` (new)

**4.3 Progressive fidelity rendering**
- Each `DimensionCard` adapts based on `fidelityLevel`:
  - Level 0: Muted card with profile completion CTA
  - Level 1: Baseline assessment from profile, "Log more for deeper insights" label
  - Level 2: Real insights with some data references, sparkline starts
  - Level 3: Full analysis with trends, projections, rich sparkline
- **File:** `src/dashboard/DimensionCard.tsx` (update from Phase 2)

**4.4 Session score tracking**
- On dashboard unmount or tab/window visibility change: call `saveSessionScores()` to persist current scores.
- On next dashboard mount: compute session deltas for "Since Last Visit".
- **File:** `src/core/useLifeContext.ts` (already has the method from Phase 0)

**Exit gate:** Completing onboarding immediately shows populated dimension cards (Level 1 baseline). "Since Last Visit" shows "Welcome" on first visit and accurate deltas on return. Progressive fidelity renders correctly at each level.

---

### Phase 5: Smart Triggers & Satisfaction Loop (Run)
**Focus:** Wire the intelligent refresh system and contribution feedback.

**5.1 Tier 1 dispatch in `useLifeContext`**
- After signal received: call `refreshDimensionContexts(affectedDimensions)`.
- Affected cards enter LOADING state (independent shimmer).
- On response: update cards, compute `ContributionFeedback`, show overlay.
- Track in `refreshedThisSession`. If size >= 3: auto-trigger `generateLifeSnapshot()`.
- **File:** `src/core/useLifeContext.ts`

**5.2 Tier 2 accumulation**
- Increment counter per dimension per week.
- When counter hits 3: trigger refresh for that dimension, reset counter.
- **File:** `src/core/useLifeContext.ts`

**5.3 Contribution feedback computation**
- Compare score before/after the new memory entry.
- Compare goal progress before/after.
- Calculate streak updates. Flag milestones (7, 14, 30, 60, 90 days).
- Show `ContributionCard` with the deltas.
- **File:** `src/core/useLifeContext.ts` + `src/dashboard/ContributionCard.tsx`

**5.4 Score ring + delta animations**
- When a dimension refreshes: score ring animates from old value to new value (400ms spring).
- Delta badge scales in.
- Sparkline adds the new data point.
- **File:** `src/dashboard/DimensionCard.tsx` + `src/dashboard/ScoreRing.tsx`

**Exit gate:** Full trigger system works end-to-end. Tier 1 example: "salary now $18,000" → Finance shimmers → score updates → ContributionCard appears. Tier 2 example: 3 health logs in a week → Health auto-refreshes. Tier 3 example: "reminder: groceries" → simple toast, no dimension refresh.

---

### Phase 6: History & Trends (Run)
**Focus:** The improvement tracker.

**6.1 Sparkline data computation**
- For each dimension: call `computeScore()` with `referenceTime` for last 8 weeks.
- Cache results (recompute on dimension refresh or weekly).
- Feed into `DimensionCard` sparkline.
- **File:** `src/core/useLifeContext.ts`

**6.2 `LifeContextHistory.tsx`**
- Accessible from Life Snapshot "View history" link.
- Shows weekly comparison table with dimension score deltas.
- Reads directly from `lifeContextSnapshots[]`.
- Shows narrative changes over time.
- **File:** `src/dashboard/LifeContextHistory.tsx` (new)

**6.3 Milestone detection**
- Weekly score improvement > 10 points: "Best week in X months" callout.
- Streak milestones (7, 14, 30, 60, 90 days): achievement callout.
- These appear in `GoalProgressCard` as motivational highlights.
- **File:** `src/core/useLifeContext.ts` + `src/dashboard/GoalProgressCard.tsx`

**Exit gate:** Sparklines show 8 weeks of data. History view shows weekly comparisons with narrative changes. Milestones surface on significant improvements.

---

### Phase 7: Assembly & Polish (Run)
**Focus:** Wire everything into the dashboard and remove old components.

**7.1 Update `DashboardView.tsx`**
- Replace old composition with: `SinceLastVisit` + `LifeContextPanel` + `LifeTrackingPanel`.
- Wire `useLifeContext()` hook.
- Pass `selectedDimension` through for card → tab bridge.
- **File:** `src/dashboard/DashboardView.tsx`

**7.2 Update `DashboardHeader.tsx`**
- Replace abstract "Life coherence: 64" with contextual, client-computed header summary from `DailyIntelligence`.
- Priority cascade for header line: streak at risk > event prep needed > goal deadline > commitment gap > completion meter.
  - e.g., "⚠ Health streak at risk" or "Medical checkup in 4 days — prep needed" or "3/8 tasks done today"
- If nothing urgent: show completion meter: "3 of 8 tasks complete" with mini progress bar.
- Add `[Log]` and `[Plan my day]` buttons.
- **File:** `src/dashboard/DashboardHeader.tsx`

**7.3 Remove replaced components**
- `SignalGrid.tsx` → deleted
- `DailyBriefing.tsx` → deleted (focus logic preserved in TodaysFocus)
- `GoalsSpotlight.tsx` → deleted
- `UpcomingCalendar.tsx` → deleted
- `FocusList.tsx` → deleted

**7.4 Visual polish sweep**
- Consistent spacing rhythm across all new components.
- Animation timing audit (no janky transitions).
- Dark mode class consistency audit.
- Screen width breakpoints for different monitors.
- Loading state audit (every async operation has visible feedback).
- Empty state audit (every component handles zero-data gracefully).
- CTA audit (every interaction point has clear affordance per Section 6.4).

**7.5 Performance audit**
- Memoize expensive computations (sparkline data, score history, session deltas).
- Lazy-load `LifeContextHistory` (only loaded when user clicks "View history").
- Debounce rapid trigger signals (e.g., user logs 3 items in 10 seconds → batch into single refresh).
- Profile hash comparison to skip redundant narrative regeneration.

**Exit gate:** Full dashboard renders with both sections. All old components removed. No visual regressions. Complete user flows work (onboarding → baseline → logging → refresh → tracking → history). Performance smooth. All empty states, CTAs, and loading states correct.

---

## 14. Technical Requirements

### New Files (17)
| File | Purpose |
|------|---------|
| `src/core/useLifeContext.ts` | Life Context state management hook |
| `src/dashboard/SinceLastVisit.tsx` | Session delta micro-summary |
| `src/dashboard/LifeContextPanel.tsx` | Section 1 orchestrator |
| `src/dashboard/LifeSnapshotCard.tsx` | Narrative paragraph (expand/collapse) |
| `src/dashboard/DimensionMissionControl.tsx` | 5-card row container |
| `src/dashboard/DimensionCard.tsx` | Individual dimension card (6 states) |
| `src/dashboard/ScoreRing.tsx` | SVG animated score arc component |
| `src/dashboard/ProfileGapNudge.tsx` | Missing data prompts |
| `src/dashboard/ContributionCard.tsx` | Post-log feedback overlay |
| `src/dashboard/LifeTrackingPanel.tsx` | Section 2 orchestrator (2-column) |
| `src/dashboard/DimensionTabStrip.tsx` | Tab bar with status dots |
| `src/dashboard/DimensionTrackPane.tsx` | Goal + tasks + habits per tab |
| `src/dashboard/GoalProgressCard.tsx` | Goal with progress + streak |
| `src/dashboard/TaskCard.tsx` | Task with rationale + lineage |
| `src/dashboard/HabitTracker.tsx` | Weekly habit grid |
| `src/dashboard/UpcomingEvents.tsx` | Upcoming events with prep status |
| `src/dashboard/LifeContextHistory.tsx` | Historical snapshot comparison |

### Modified Files (8)
| File | Changes |
|------|---------|
| `src/data/types.ts` | Add 11 new interfaces (Section 7) — includes PreComputedMetrics, DailyIntelligence |
| `src/data/cryptoVault.ts` | Add snapshot persistence + session scores to vault schema |
| `src/ai/prompts.ts` | Add 2 new prompts, extend ingest prompt, add 3 helper functions |
| `src/ai/geminiService.ts` | Add 2 new functions, update processInput |
| `src/core/useAura.ts` | Wire lifeContextSignal dispatch (minimal) |
| `src/onboarding/OnboardingView.tsx` | Trigger first Life Context analysis on completion |
| `src/dashboard/DashboardView.tsx` | Restructure composition with new panels |
| `src/dashboard/DashboardHeader.tsx` | Replace abstract score with contextual DailyIntelligence status line + completion meter |
| `src/dashboard/TodaysFocus.tsx` | Update with cross-dimensional focus logic + empty states |

### Removed Files (5)
| File | Replaced By |
|------|-------------|
| `src/dashboard/SignalGrid.tsx` | `DimensionMissionControl.tsx` |
| `src/dashboard/DailyBriefing.tsx` | `TodaysFocus.tsx` + `LifeSnapshotCard.tsx` |
| `src/dashboard/GoalsSpotlight.tsx` | `DimensionTrackPane.tsx` |
| `src/dashboard/UpcomingCalendar.tsx` | `UpcomingEvents.tsx` |
| `src/dashboard/FocusList.tsx` | `DimensionTrackPane.tsx` + `TaskCard.tsx` |

### Constraints
- Framer-motion for animations (already in deps).
- No new npm dependencies required.
- All data persists in existing encrypted vault (IndexedDB + Web Crypto API).
- AI calls go through existing `/api/gemini` Vercel serverless endpoint.
- Dark theme (existing Tailwind dark classes).
- Web-first layout (not mobile-optimized).
