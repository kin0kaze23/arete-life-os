# Dashboard UX & Prompt Enhancement Plan

**Goal**: Transform the dashboard from showing empty/generic content to delivering hyper-personalized, identity-aware intelligence from the moment the user logs in. Fix the "no useful information on login" problem by enriching AI prompts with full user identity context and adding UI components that surface this intelligence.

**Prerequisite**: Dashboard revamp plan (dashboard-revamp-2026-02-01.md) has been executed.

**Dev server**: http://localhost:3000 (run `npm run dev`)

---

## Current State (Verified Audit)

### Dashboard Components In Use

| Component | File | Status | What It Renders |
|-----------|------|--------|-----------------|
| **DashboardView** | `dashboard/DashboardView.tsx` | ✅ ACTIVE | Main container, 5 sections |
| **DailyBriefing** | `dashboard/DailyBriefing.tsx` | ✅ ACTIVE | Life Balance Strip + Today's Focus + Quick Win |
| **ScoreStrip** | `dashboard/ScoreStrip.tsx` | ✅ ACTIVE (helper) | Scoring logic used by DailyBriefing |
| **SWOTGrid** | `dashboard/SWOTGrid.tsx` | ✅ ACTIVE | Strengths / Concerns / Opportunities / Risks |
| **GoalsPanel** | `dashboard/GoalsPanel.tsx` | ✅ ACTIVE | Active goals + AI suggestions with keep/dismiss |
| **FocusList** | `dashboard/FocusList.tsx` | ✅ ACTIVE | Task groups + habits + strategic focus |
| **UpcomingCalendar** | `dashboard/UpcomingCalendar.tsx` | ✅ ACTIVE | Timeline events by date range |
| **EventPrepPopup** | `dashboard/EventPrepPopup.tsx` | ✅ ACTIVE | Event prep planning modal |
| **EventEditSheet** | `dashboard/EventEditSheet.tsx` | ✅ ACTIVE | Event editing modal |
| **SystemStatusFooter** | `dashboard/SystemStatusFooter.tsx` | ✅ ACTIVE | Fixed footer: Security + Neural Sync + Coherence bar |
| **LogBar** | `command/LogBar.tsx` | ✅ ACTIVE (app-level) | Global fixed bottom bar for logging — rendered in `App.tsx`, NOT inside DashboardView |
| **StatusSidebar** | `dashboard/StatusSidebar.tsx` | ❌ RETIRED | Exported but NOT imported in DashboardView |
| **TodaysFocus** | `dashboard/TodaysFocus.tsx` | ❌ RETIRED | Superseded by DailyBriefing focus logic |

### Dashboard Layout (Current)

```
DashboardView (max-w-5xl, pb-32)
├── 1. DailyBriefing
│   ├── Life Balance Strip (5 dimension chips with scores + trends)
│   ├── Today's Focus (3 items: declining dims, unprepped events, goal deadlines, high risks)
│   └── Quick Win (highest-impact recommendation ≤30min)
├── 2. SWOTGrid (Collapsible)
│   ├── Strengths (insights.feedback === 'like')
│   ├── Concerns (blindSpots.severity !== 'high')
│   ├── Opportunities (insights.feedback !== 'like' && !== 'dislike')
│   └── Risks (blindSpots.severity === 'high')
├── 3. GoalsPanel (Collapsible)
│   ├── Active Goals (with animated progress bars + category chips + time remaining)
│   └── AI Suggestions (top 3 ACTIVE recommendations with Execute/Keep/Dismiss)
├── 4. Two-Column Grid (md:grid-cols-2)
│   ├── FocusList (left) — tasks + habits
│   └── UpcomingCalendar (right) — events by date
├── 5. EventPrepPopup (modal)
├── 6. EventEditSheet (modal)
└── 7. SystemStatusFooter (fixed bottom, z-50)

--- Below dashboard, rendered in App.tsx ---
LogBar (fixed bottom, command/LogBar.tsx — global component with textarea, file upload, templates)
```

### Prop Flow

```
useAura() → App.tsx ({...(aura as any)}) → DashboardView
                                          ├── memory={aura.memoryItems}
                                          ├── profile (via spread)
                                          ├── insights (via spread)
                                          ├── blindSpots (via spread)
                                          ├── recommendations (via spread)
                                          ├── goals (via spread)
                                          ├── dailyPlan (via spread)
                                          ├── timelineEvents (via spread)
                                          ├── logMemory={handleLog}
                                          └── ... (handlers)
```

### AI Prompt Flow (Current)

| Function | Prompt Used | Profile Data Passed | Personalization Level |
|----------|-------------|--------------------|-----------------------|
| `dailyIntelligenceBatch` | `DAILY_INTELLIGENCE_BATCH_PROMPT` | `buildCompactProfile()` — STRIPPED (missing identity) | ❌ Generic |
| `generateDeepTasks` | `HYPER_PERSONALIZED_PROMPT` | Full `{{profile}}` | ⚠️ Has data but no identity instructions |
| `generateInsights` | Per-prompt template | Full `{{profile}}` | ⚠️ Has data but no identity instructions |
| `generateBlindSpots` | Per-prompt template | Full `{{profile}}` | ⚠️ Has data but no identity instructions |
| `generateDailyPlan` | `DAILY_PLAN_PROMPT` | Full `{{profile}}` | ✅ Has "HYPER-PERSONALIZATION" instruction (location-aware) |
| `generateDeepInitialization` | Inline prompt | Full `JSON.stringify(profile)` | ⚠️ Generates greeting but it's orphaned |

### useAura Return (Relevant Fields)

`personalizedGreeting` is **NOT** returned from the hook. It's computed in `runDeepInitialization()` (line ~1944) and logged to audit but never stored in state or returned.

---

## Root Cause Analysis

The dashboard shows "nothing useful" because:

1. **`buildCompactProfile()` strips identity data** — `ai/prompts.ts:260`. The daily batch prompt only receives: name, location, jobRole, company, interests, sleep/wake times, activities, conditions, income, fixedCosts, variableCosts, relationshipStatus, socialEnergy, socialGoals, coreValues, worldview, practicePulse. It NEVER sees: `origin`, `ethnicity`, `languages`, `personalityType`, `communicationStyle`, `archetype`, `chronotype`, `loveLanguage`, `attachmentStyle`, `familyDynamic`, `dailyCommitments`, `innerCircle`, `investmentStrategy`.

2. **`DAILY_INTELLIGENCE_BATCH_PROMPT` has no personalization instruction** — `ai/prompts.ts:121`. Just says "Ground every output in PROFILE_SUMMARY" without directing the AI to use location/culture/personality for contextual recommendations. Compare to `DAILY_PLAN_PROMPT` which explicitly says "Research and inject specific, real-world data based on Profile/Location."

3. **`personalizedGreeting` is orphaned** — Generated by `generateDeepInitialization` but never stored in useAura state or returned from the hook. No UI displays it.

4. **Empty states are dead ends** — When `memoryItems.length === 0`:
   - DailyBriefing: "Log your first entry to generate insights" (blank wall)
   - SWOTGrid: "Your SWOT analysis will appear after you log a few entries" (blank wall)
   - GoalsPanel: "Set your first goal" (acceptable)
   - No profile-based intelligence is shown even though `profile` has rich data.

5. **No dashboard greeting or header** — No time-aware "Good morning, Jonathan". No date. No summary of what's happening today. The dashboard just starts with the Life Balance Strip with no orientation.

6. **`HYPER_PERSONALIZED_PROMPT` lacks identity-aware instructions** — `ai/prompts.ts:3`. Has the full profile data but instructions only cover data-grounding, value alignment, tactical precision, finance, health safety, missing data, and feedback learning. No instruction to use origin, personality, language, communication style, or inner circle for personalization.

7. **AI output uses complex language** — No "readability" instruction in any prompt. Descriptions often use jargon and long sentences that are hard to quickly parse on a dashboard.

---

## Phase 0: Enrich buildCompactProfile with Identity Data

**Files**: `ai/prompts.ts`

### Task
Expand `buildCompactProfile()` to include identity-relevant fields that the AI needs for personalization. This function is used by `DAILY_INTELLIGENCE_BATCH_PROMPT` — the main daily generation call that populates tasks, insights, and blindSpots.

### Current Code (line ~260 in ai/prompts.ts)
```typescript
export const buildCompactProfile = (profile: UserProfile) => ({
  id: profile.id,
  name: profile.identify?.name,
  location: profile.identify?.location,
  role: profile.role,
  personal: { jobRole, company, interests },
  health: { sleepTime, wakeTime, activities, activityFrequency, conditions },
  finances: { income, fixedCosts, variableCosts },
  relationship: { relationshipStatus, socialEnergy, socialGoals },
  spiritual: { coreValues, worldview, practicePulse },
});
```

### Target Code
Add these fields to the existing object (do NOT remove any existing fields):

```typescript
export const buildCompactProfile = (profile: UserProfile) => ({
  id: profile.id,
  name: profile.identify?.name,
  location: profile.identify?.location,
  origin: profile.identify?.origin,           // ADD: hometown/cultural context
  ethnicity: profile.identify?.ethnicity,     // ADD: cultural context
  languages: profile.identify?.languages,     // ADD: language context
  role: profile.role,
  personal: {
    jobRole: profile.personal?.jobRole,
    company: profile.personal?.company,
    interests: profile.personal?.interests,
    personalityType: profile.personal?.personalityType,       // ADD: MBTI/Enneagram
    communicationStyle: profile.personal?.communicationStyle, // ADD: Direct/Storyteller
    archetype: profile.personal?.archetype,                   // ADD: Creator/Sage/etc.
  },
  health: {
    sleepTime: profile.health?.sleepTime,
    wakeTime: profile.health?.wakeTime,
    activities: profile.health?.activities,
    activityFrequency: profile.health?.activityFrequency,
    conditions: profile.health?.conditions,
    chronotype: profile.health?.chronotype,   // ADD: Lark/Owl
  },
  finances: {
    income: profile.finances?.income,
    fixedCosts: profile.finances?.fixedCosts,
    variableCosts: profile.finances?.variableCosts,
    investmentStrategy: profile.finances?.investmentStrategy, // ADD
  },
  relationship: {
    relationshipStatus: profile.relationship?.relationshipStatus,
    socialEnergy: profile.relationship?.socialEnergy,
    socialGoals: profile.relationship?.socialGoals,
    loveLanguage: profile.relationship?.loveLanguage,           // ADD
    attachmentStyle: profile.relationship?.attachmentStyle,     // ADD
    familyDynamic: profile.relationship?.familyDynamic,         // ADD
    dailyCommitments: profile.relationship?.dailyCommitments,   // ADD
  },
  spiritual: {
    coreValues: profile.spiritual?.coreValues,
    worldview: profile.spiritual?.worldview,
    practicePulse: profile.spiritual?.practicePulse,
  },
  innerCircle: (profile.innerCircle || []).map(c => ({
    type: c.type,
    notes: c.notes,
  })),
});
```

### Anti-Patterns
- Do NOT include `profile.id` or `relatedToUserId` from innerCircle contacts (privacy leak)
- Do NOT include raw `birthday` — compute age externally if needed
- Do NOT remove existing fields — only ADD new ones

### Completion Gate
```bash
npm run typecheck && npm run lint && npm run build && echo "PHASE 0 PASS" || echo "PHASE 0 FAIL"
```
**Paste the terminal output before proceeding.**

---

## Phase 1: Enhance DAILY_INTELLIGENCE_BATCH_PROMPT with Personalization Instructions

**Files**: `ai/prompts.ts`

### Task
Add hyper-personalization rules to the batch prompt so the AI uses the enriched profile data from Phase 0. This is the prompt that generates the tasks, insights, and blindSpots shown on the dashboard.

### Current Prompt Location
`ai/prompts.ts`, line ~121, `DAILY_INTELLIGENCE_BATCH_PROMPT` constant.

### Exact Change
After existing rule `5. If data is insufficient, return empty arrays (do not hallucinate).`, add:

```
PERSONALIZATION RULES:
6. CULTURAL CONTEXT: If origin/ethnicity data exists, adapt recommendations to be culturally relevant — reference local customs, foods, practices, or community resources from their origin and current location.
7. PERSONALITY-AWARE: If personalityType is set (MBTI), adjust task framing. Introverts → prefer solo tasks. Extraverts → prefer collaborative tasks. Thinkers → lead with data. Feelers → lead with people impact.
8. ENERGY-AWARE: If chronotype is set, schedule high-impact tasks during peak energy. Lark → morning (6-10am). Owl → afternoon (2-6pm).
9. COMMUNICATION STYLE: Match description tone to communicationStyle. Direct → short action-first sentences. Storyteller → brief narrative context. Analytical → include metrics.
10. LOCATION INTELLIGENCE: Reference specific real-world resources near the user's location (clinics, gyms, banks, parks, venues).
11. INNER CIRCLE: If innerCircle contacts exist, reference them by relationship type (e.g., "date night with spouse" not "social time").
12. READABILITY: Write all descriptions at Grade 8 reading level. Short sentences. No jargon. If a technical term is needed, define it in parentheses.
```

### Anti-Patterns
- Do NOT exceed 8 new lines — token budget matters for this frequently-called prompt
- Do NOT instruct the AI to assume cultural traits — only use specific profile fields
- Do NOT use the word "stereotyping" in prompts — frame positively as "if data is available, use it"

### Completion Gate
```bash
npm run typecheck && npm run lint && npm run build && echo "PHASE 1 PASS" || echo "PHASE 1 FAIL"
```
**Paste the terminal output before proceeding.**

---

## Phase 2: Add Personalized Dashboard Header

**Files**: `dashboard/DashboardHeader.tsx` (NEW), `dashboard/DashboardView.tsx`, `dashboard/index.ts`, `core/useAura.ts`

### Context
- There is NO DashboardHeader component currently
- The global `layout/Header.tsx` handles the app-level header but has no dashboard-specific greeting
- `personalizedGreeting` from `generateDeepInitialization` is computed (line ~1944 in useAura.ts) and logged to audit but NOT stored in state or returned from the hook

### Task
1. Store `personalizedGreeting` in useAura state and return it from the hook
2. Create a `DashboardHeader` component with time-aware greeting, date, and status summary
3. Wire it into DashboardView as the first child

### Step 1: Store personalizedGreeting in useAura

In `core/useAura.ts`:
- Add state: `const [personalizedGreeting, setPersonalizedGreeting] = useState<string>('');`
- In `runDeepInitialization` callback (~line 1944), after `addAuditLog(...)`, add: `setPersonalizedGreeting(result.personalizedGreeting || '');`
- Add `personalizedGreeting` to the return object (~line 1981)

### Step 2: Create DashboardHeader Component

```typescript
// dashboard/DashboardHeader.tsx
interface DashboardHeaderProps {
  profile: UserProfile;
  insights: ProactiveInsight[];
  blindSpots: BlindSpot[];
  goals: Goal[];
  personalizedGreeting?: string;
}
```

**UI Specification:**
- Full-width, no card wrapper — sits at the very top of DashboardView
- **Line 1**: Time-aware greeting:
  - Before 12pm: "Good morning, {profile.identify.name.split(' ')[0]}"
  - 12pm-5pm: "Good afternoon, {firstName}"
  - After 5pm: "Good evening, {firstName}"
  - Font: `text-2xl font-bold text-white`
- **Line 2** (only if `personalizedGreeting` is non-empty): The AI-generated greeting
  - Font: `text-sm text-slate-400 mt-1`
- **Line 3**: Today's date: `new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })`
  - Font: `text-xs text-slate-500 uppercase tracking-wider mt-2`
- **Line 4**: Status summary chips (flex row, gap-2, mt-3):
  - `{goals.filter(g => g.status === 'active').length} active goals` — `bg-violet-500/10 text-violet-400`
  - `{blindSpots.filter(b => b.severity === 'high').length} risks` — `bg-rose-500/10 text-rose-400` (only show if > 0)
  - `{insights.length} insights` — `bg-cyan-500/10 text-cyan-400` (only show if > 0)
  - Chip style: `text-[10px] font-bold px-2 py-1 rounded-full`

### Step 3: Wire-Up in DashboardView.tsx

- Import `DashboardHeader` from `./DashboardHeader`
- Add `personalizedGreeting?: string;` to `DashboardViewProps`
- Place `<DashboardHeader profile={profile} insights={insights} blindSpots={blindSpots ?? []} goals={goals} personalizedGreeting={personalizedGreeting} />` BEFORE `<DailyBriefing>`

### Step 4: Pass through App.tsx

In `App.tsx`, the `{...(aura as any)}` spread already passes everything from useAura. Since `personalizedGreeting` will now be in the hook return, it will automatically flow through the spread to DashboardView. No App.tsx change needed.

### Barrel Export
Add `export { DashboardHeader } from './DashboardHeader';` to `dashboard/index.ts`.

### Anti-Patterns
- Do NOT use mock greeting text
- Do NOT add complex animations — fade-in at most
- Named export only (`export const DashboardHeader`)
- Do NOT render personalizedGreeting if it's an empty string

### Completion Gate
```bash
npm run typecheck && npm run lint && npm run build && echo "PHASE 2 PASS" || echo "PHASE 2 FAIL"
```
**Paste the terminal output before proceeding.**

---

## Phase 3: Profile-Powered Empty States

**Files**: `dashboard/DailyBriefing.tsx`, `dashboard/SWOTGrid.tsx`

### Context
Current empty states when `memoryItems.length === 0`:
- DailyBriefing: "Welcome to Your Daily Briefing. Log your first entry to generate insights and see your life balance score."
- SWOTGrid: "Your SWOT analysis will appear after you log a few entries."
- GoalsPanel: "Set your first goal to track progress across life dimensions." (acceptable — no change needed)

### Task
Replace dead-end messages with profile-derived intelligence that shows value even with zero memory entries.

### DailyBriefing.tsx Changes

**Add `profile` prop to the interface:**
```typescript
export interface DailyBriefingProps {
  // ... existing props
  profile: UserProfile; // ADD
}
```

**Pass from DashboardView:** Add `profile={profile}` to the `<DailyBriefing>` call.

**Replace the empty state block** (currently lines 138-147, the `if (!hasHistory)` block):

When `memoryItems.length === 0`, instead of the blank welcome message, render:

1. **Profile Completeness Strip** — Same visual as Life Balance Strip but shows profile data status per dimension:
   - Health: Check if `profile.health.height`, `weight`, `activities.length > 0`, `sleepTime` exist → show count like "3/4 fields set"
   - Finance: Check `income`, `fixedCosts`, `variableCosts` → "2/3 fields set"
   - Social: Check `relationshipStatus`, `socialEnergy` → "1/2 fields set"
   - Spiritual: Check `coreValues.length > 0`, `worldview` → "2/2 fields set"
   - Personal: Check `jobRole`, `interests.length > 0` → "1/2 fields set"
   - Use same dimension colors and icons from `DIMENSIONS` in ScoreStrip
   - Label as "PROFILE STATUS" not "LIFE BALANCE"

2. **Profile-Derived Focus Items** (same Today's Focus visual):
   - If `profile.health.conditions.length > 0`: "You have {n} health condition(s) — log your latest check-up to track"
   - If `profile.finances.income` exists but not `fixedCosts`: "Complete your financial profile for budget analysis"
   - If `profile.relationship.dailyCommitments.length > 0`: Show first commitment as a focus item
   - If none of the above apply: "Log your first entry to activate your life intelligence"

3. **Quick Win area**: Show "Complete your profile" as the quick win with a call-to-action, OR "Log your first thought" if profile is mostly complete

### SWOTGrid.tsx Changes

**Add `profile` prop:**
```typescript
export interface SWOTGridProps {
  insights: ProactiveInsight[];
  blindSpots: BlindSpot[];
  profile?: UserProfile; // ADD (optional so existing callers don't break)
}
```

**Pass from DashboardView:** Add `profile={profile}` to the `<SWOTGrid>` call.

**Replace empty state** (currently lines 86-89):

When `!hasData` and `profile` is provided, show the 4 quadrants with profile-derived placeholder content:
- **Strengths**: "Log activities to discover your strengths" (keep generic)
- **Concerns**: If `profile.health.conditions.length > 0`, show "Monitor: {conditions.join(', ')}" — else "No concerns detected"
- **Opportunities**: If `profile.personal.interests.length > 0`, show "Explore: {interests.slice(0,3).join(', ')}" — else "Log entries to uncover opportunities"
- **Risks**: Count missing profile fields (use same logic as `buildMissingData` from useAura.ts). If > 0: "{n} profile fields incomplete" — else "No risks detected"

### Anti-Patterns
- Do NOT fabricate percentage scores — show "X/Y fields set" or data status, not fake wellness scores
- Do NOT show the profile-powered empty states when there IS real data — these are fallback only for `memoryItems.length === 0`
- Do NOT duplicate `buildMissingData` logic — extract it to a shared utility or import from `core/useAura.ts` (currently it's a module-level function, may need to export it or move to shared)
- Do NOT change GoalsPanel — its empty state is already fine

### Completion Gate
```bash
npm run typecheck && npm run lint && npm run build && echo "PHASE 3 PASS" || echo "PHASE 3 FAIL"
```
**Paste the terminal output before proceeding.**

---

## Phase 4: Enhance HYPER_PERSONALIZED_PROMPT for Contextual Recommendations

**Files**: `ai/prompts.ts`

### Context
`HYPER_PERSONALIZED_PROMPT` (line ~3) receives full `{{profile}}` including all identity data. It has 8 instructions covering data-grounding, value alignment, tactical precision, DoD, finance, health safety, missing data, and feedback learning. But NO instruction about using identity fields (origin, personality, communication style, languages, inner circle) for personalization.

### Task
Add 2 new instructions (9 and 10) for identity-aware recommendations and readability.

### Exact Change

After instruction 8 (FEEDBACK LEARNING), add:

```
9. IDENTITY-AWARE RECOMMENDATIONS: Use the user's identity data for deep personalization:
   a) ORIGIN & CULTURE: If origin/ethnicity is available, reference culturally relevant practices, foods, or traditions in health and spiritual recommendations (e.g., Indonesian origin → suggest "tempe and tahu" for protein, not generic "lean protein").
   b) LANGUAGE: If the user speaks multiple languages, include key terms in their native language where natural (e.g., Indonesian → "Morning Doa (prayer) + journaling").
   c) PERSONALITY: Adapt task framing to personalityType if available (e.g., INTJ → "Design a systematic approach to..." vs ENFP → "Explore creative ways to...").
   d) CHRONOTYPE: Schedule high-impact recommendations during peak energy windows. Lark → morning. Owl → afternoon/evening.
   e) INNER CIRCLE: Reference specific relationship types from the profile (e.g., "Schedule quality time with your spouse" not "Improve social connections").
   f) LOCATION: Include specific local resources (clinics, banks, parks, venues) based on the user's current location.
10. READABILITY: Write all descriptions at Grade 8 reading level. Short sentences. No jargon. Define technical terms in parentheses (e.g., "Your savings rate (how much of your income you keep) is 23%").
```

### Anti-Patterns
- Do NOT add more than 2 new numbered instructions
- Do NOT change the output schema
- Do NOT stereotype — always frame as "if data is available, use it"

### Completion Gate
```bash
npm run typecheck && npm run lint && npm run build && echo "PHASE 4 PASS" || echo "PHASE 4 FAIL"
```
**Paste the terminal output before proceeding.**

---

## Phase 5: Enhance generateDeepInitialization Prompt

**Files**: `api/gemini.ts`

### Context
The `generateDeepInitialization` function (line ~489 in `api/gemini.ts`) uses an inline prompt that says "GOAL: Demonstrate deep understanding of this person. Make them feel 'seen.'" It passes full profile JSON. The output includes `personalizedGreeting` (now surfaced via Phase 2). But the prompt lacks specific instructions about HOW to use identity data.

### Task
Add identity-driven personalization and quality bar instructions to the inline prompt.

### Exact Change

In `api/gemini.ts`, in the `generateDeepInitialization` function, find the prompt string (starts ~line 512). After the line `GOAL: Demonstrate deep understanding of this person. Make them feel "seen." Ground every recommendation in specific profile data or memory entries.`, add:

```
IDENTITY-DRIVEN PERSONALIZATION:
- Reference the user's ORIGIN and ETHNICITY in health/spiritual recommendations (e.g., cultural foods, local practices from their homeland)
- Adapt communication tone to their communicationStyle and personalityType if available
- If LOCATION is set, include specific local resources (clinics, gyms, banks, restaurants, parks) with real names
- If LANGUAGES are set, include greetings or key terms in their native language where natural
- Reference INNER_CIRCLE members by relationship type in social recommendations
- Adapt scheduling suggestions to CHRONOTYPE if set (Lark = morning focus, Owl = afternoon focus)

QUALITY BAR:
- Every recommendation MUST reference at least ONE specific field from the profile
- The personalizedGreeting MUST mention the user's name AND reference something specific (their job, location, interest, or a value they hold)
- Tasks should be immediately actionable TODAY, not vague aspirations
- Write at Grade 8 reading level. Short sentences. No jargon.
```

### Anti-Patterns
- Do NOT change the output JSON schema (`doItems`, `watchItems`, `alwaysDo`, `alwaysWatch`, `domainRecommendations`, `personalizedGreeting`)
- Do NOT add more than 15 lines of new instruction — the prompt is already substantial
- Do NOT remove the existing ANALYSIS TASKS section

### Completion Gate
```bash
npm run typecheck && npm run lint && npm run build && echo "PHASE 5 PASS" || echo "PHASE 5 FAIL"
```
**Paste the terminal output before proceeding.**

---

## Phase 6: Visual Polish and Micro-Interactions

**Files**: `dashboard/DailyBriefing.tsx`, `dashboard/SWOTGrid.tsx`, `dashboard/GoalsPanel.tsx`, `dashboard/DashboardHeader.tsx`

### Task
Add subtle CSS animations and visual refinements to make the dashboard feel alive and responsive. Do NOT use framer-motion — use Tailwind CSS transitions only.

### Specifications

1. **DashboardHeader**: Fade-in on mount (`animate-in fade-in duration-700`)
2. **Life Balance Strip chips**: Stagger fade-in using inline `style={{ animationDelay: '${index * 100}ms' }}` with `animate-in fade-in` class
3. **SWOT Grid quadrants**: Subtle hover lift (`hover:-translate-y-1 transition-transform duration-200`) — already partially present, verify and enhance
4. **GoalsPanel progress bars**: Already animated (width transition from 0) — verify it works
5. **Quick Win card**: Subtle gradient intensity increase on hover (`hover:from-indigo-500/15 hover:to-violet-500/15`)
6. **DashboardHeader status chips**: Gentle pulse animation on risks chip if risks > 0 (`animate-pulse` with reduced opacity)

### Anti-Patterns
- Do NOT use framer-motion — CSS transitions are zero-bundle-cost
- Do NOT add loading skeleton placeholders
- Do NOT add sound effects or haptic feedback
- Keep all transition durations ≤ 700ms
- Do NOT animate on every re-render — use CSS animation classes that run once on mount

### Completion Gate
```bash
npm run typecheck && npm run lint && npm run build && echo "PHASE 6 PASS" || echo "PHASE 6 FAIL"
```
**Paste the terminal output before proceeding.**

---

## Final Gate (MANDATORY)

**Do NOT say "done" until ALL of these pass:**

### Step 1: Quality Gate
```bash
npm run check:standard
```
Paste the full output.

### Step 2: Visual Verification
Open http://localhost:3000 and verify:
- [ ] Dashboard header shows time-appropriate greeting with user's name
- [ ] personalizedGreeting is displayed below greeting (if available)
- [ ] Date is shown in full format
- [ ] Status summary chips show goal/risk/insight counts
- [ ] Life Balance Strip shows scores (or profile completeness strip if no memory)
- [ ] Today's Focus shows items (or profile-derived focus items if no memory)
- [ ] SWOT Grid shows insights/blindspots (or profile-aware placeholders if no data)
- [ ] GoalsPanel shows goals and recommendations
- [ ] LogBar (global, at bottom) is visible and accepts input
- [ ] All animations are smooth and ≤ 700ms

### Step 3: Integration Trace
Verify data flows correctly:
- [ ] `buildCompactProfile` includes origin, ethnicity, languages, personalityType, communicationStyle, archetype, chronotype, investmentStrategy, loveLanguage, attachmentStyle, familyDynamic, dailyCommitments, innerCircle
- [ ] `personalizedGreeting` is stored in useAura state and returned from hook
- [ ] `DashboardHeader` receives and displays `personalizedGreeting`
- [ ] `DailyBriefing` receives `profile` prop and shows profile-powered empty state
- [ ] `SWOTGrid` receives `profile` prop and shows profile-aware placeholders

### Step 4: Security Check
- [ ] No user PII logged to console (search for `console.log(profile)` or `console.log(JSON.stringify(profile)`)
- [ ] No raw profile JSON rendered in visible DOM elements
- [ ] innerCircle in buildCompactProfile does NOT include `id` or `relatedToUserId`

### Step 5: Commit
```bash
git add <changed files> && git commit -m "feat: enhance dashboard UX with identity-aware prompts and personalized UI"
```

### Step 6: Report
Post the Final Gate results in this format:
```
## Final Report
- Quality Gate: PASS/FAIL
- Visual Verification: X/10 checks passed
- Integration Trace: X/5 checks passed
- Security: X/3 checks passed
- Files Changed: list
- Files Created: list
```

---

## Anti-Pattern Reference

| Anti-Pattern | Why It's Bad | What To Do Instead |
|---|---|---|
| Treating `estimatedTime` as number | It's a string like "120m" | Use `parseEstimatedMinutes()` from DailyBriefing.tsx |
| Adding mock/demo data | User sees fake data and loses trust | Show empty state with real profile data or "No data" |
| Using `export default` | Project convention is named exports only | Use `export const ComponentName` |
| Forgetting barrel export | Component exists but can't be imported | Add to `dashboard/index.ts` |
| Console.log with profile data | PII leak in production | Never log full profile objects |
| Animations over 700ms | Feels sluggish | Keep CSS transitions ≤ 700ms |
| Adding framer-motion imports | Bundle size increase for CSS-achievable effects | Use Tailwind animate-in utilities |
| Stereotyping in prompts | Offensive and inaccurate | Only use specific profile data fields, never assume |
| Changing output schema in prompts | Breaks existing parsers in gemini.ts and useAura.ts | Keep exact same JSON structure |
| Skipping completion gate | Bad code ships unverified | Paste terminal output before each phase |
| Creating a LogBar in dashboard/ | LogBar already exists at `command/LogBar.tsx`, rendered globally in App.tsx | Do NOT create a duplicate — the LogBar is already on the dashboard |
| Modifying App.tsx for prop passthrough | `{...(aura as any)}` already spreads all useAura return values | Just add new fields to useAura return — they auto-flow |
