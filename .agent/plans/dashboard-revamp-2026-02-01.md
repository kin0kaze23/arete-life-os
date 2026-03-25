# Dashboard Revamp: Strategy Alignment

**Goal**: Rebuild the dashboard layout from 3-column to the stacked single-column layout defined in `glanceOS-revamp-strategy.md`. This transforms the dashboard from a fragmented status view into a daily command center.

**Source of truth**: `.agent/plans/glanceOS-revamp-strategy.md` Section 4 (Dashboard Layout)

**Dev server**: http://localhost:3000 (run `npm run dev`)

---

## Current State (What Exists)

| File                               | Purpose                                                                                | Status                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `dashboard/DashboardView.tsx`      | 3-column grid layout (Mission Control \| Events \| Life Status)                        | MODIFY                                                    |
| `dashboard/FocusList.tsx`          | Task list with habits (Strategic Focus + Queue sections)                               | KEEP                                                      |
| `dashboard/UpcomingCalendar.tsx`   | Event list with date/time grouping                                                     | KEEP                                                      |
| `dashboard/StatusSidebar.tsx`      | 5-dimension sections with recommendations per category                                 | RETIRE from dashboard (replaced by SWOTGrid + GoalsPanel) |
| `dashboard/ScoreStrip.tsx`         | Score badges per dimension (broken scoring algorithm)                                  | REWRITE                                                   |
| `dashboard/TodaysFocus.tsx`        | Simple 3-item task focus list                                                          | RETIRE (absorbed into DailyBriefing)                      |
| `dashboard/SystemStatusFooter.tsx` | Profile completion footer                                                              | KEEP                                                      |
| `dashboard/EventPrepPopup.tsx`     | Event prep overlay                                                                     | KEEP                                                      |
| `dashboard/EventEditSheet.tsx`     | Event edit overlay                                                                     | KEEP                                                      |
| `shared/Collapsible.tsx`           | Collapsible section wrapper                                                            | FIX BUG first                                             |
| `shared/Animations.tsx`            | Framer-motion animations (CheckmarkAnimation, ConfettiAnimation, ProgressBarAnimation) | REUSE                                                     |

## Target Layout (From Strategy)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DAILY BRIEFING (Fixed at top, never collapses)            │
│    - Life Balance Strip: 5 dimension scores + trend arrows   │
│    - Today's Focus: 3 prioritized items                      │
│    - Quick Win: 1 action achievable in <30 min               │
├─────────────────────────────────────────────────────────────┤
│ 2. LIFE AT A GLANCE - SWOT Grid [Collapsible]               │
│    - Strengths | Concerns | Opportunities | Risks            │
│    - Maps: insights → S/O, blindSpots → C/R                 │
├─────────────────────────────────────────────────────────────┤
│ 3. GOALS & RECOMMENDATIONS [Collapsible]                     │
│    - Active Goals with progress bars                         │
│    - AI Recommendations with Keep/Remove                     │
├─────────────────────────────────────────────────────────────┤
│ 4. TASKS & EVENTS (2-column within this section)             │
│    - Left: Daily tasks (FocusList)                           │
│    - Right: Upcoming events (UpcomingCalendar)               │
├─────────────────────────────────────────────────────────────┤
│ 5. LOG BAR (Already exists at app level, no changes)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Fix Collapsible Bug (CRITICAL — blocks Phase 3, 4)

**File**: `shared/Collapsible.tsx`

**Bug**: Template literal interpolation is broken on lines 29 and 35. The code uses `$` instead of `${` inside backtick strings:

```tsx
// BROKEN (current):
className={`text-slate-600 transition-transform duration-300 $
  {open ? 'rotate-180' : 'rotate-0'}
`}

// FIXED:
className={`text-slate-600 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
```

Same bug on the collapse container div (line 35-37):

```tsx
// BROKEN:
className={`transition-all duration-300 ease-in-out $
  {open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
  overflow-hidden
`}

// FIXED:
className={`transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
```

**Acceptance criteria**:

- Collapsible sections animate open/close correctly
- ChevronDown rotates on toggle
- `npm run typecheck` passes

---

## Phase 1: Fix ScoreStrip Algorithm

**File**: `dashboard/ScoreStrip.tsx`

**Problem**: The `computeScore` function has `consistencyScore`, `qualityScore`, `balanceScore`, `progressScore` that all compute the identical thing — `recent.filter(m => m.sentiment === 'positive' && m.category === category).length * 10`. The score is unbounded (not 0-100). The `getScoreColor` thresholds are wrong (>=140, >=100, >=60).

**Fix**: Implement the 4-factor scoring from Section 3 of the strategy:

| Factor            | Weight | How to Compute                                                                                                                                                                                                               |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consistency (30%) | 30     | `uniqueDaysWithActivity / 7 * 30` — count distinct days (by date string) in `recent` items                                                                                                                                   |
| Quality (30%)     | 30     | `positiveEntries / totalEntries * 30` — entries where `sentiment === 'positive'`                                                                                                                                             |
| Balance (20%)     | 20     | Count unique sub-categories touched. Use this mapping: Health → sleep/exercise/nutrition/conditions (check `extractedFacts[].category` or content keywords). If no sub-area data available: `min(recent.length / 3, 1) * 20` |
| Progress (20%)    | 20     | `goalsWithProgress / totalGoalsInCategory * 20` — goals where `status === 'active'` AND `progress > 0`                                                                                                                       |

**Score scale**: 0-100 (clamped). Use `Math.min(100, Math.round(consistency + quality + balance + progress))`.

**Color thresholds** (REPLACE current getScoreColor):

- 0-40: Critical → `text-rose-400 border-rose-500/30 bg-rose-500/10`
- 41-60: At Risk → `text-amber-400 border-amber-500/30 bg-amber-500/10`
- 61-80: Healthy → `text-emerald-400 border-emerald-500/30 bg-emerald-500/10`
- 81-100: Thriving → `text-violet-400 border-violet-500/30 bg-violet-500/10`

**Trend** (REPLACE current computeTrend — use score-based, not count-based):

- Compute `thisWeekScore` and `lastWeekScore` (same algorithm, different date windows)
- ↑ if `thisWeekScore - lastWeekScore >= 5`
- ↓ if `lastWeekScore - thisWeekScore >= 5`
- → otherwise

**Export the scoring function** so DailyBriefing can reuse it:

```typescript
export function computeScore(memoryItems: MemoryItem[], goals: Goal[], category: Category): number;
export function computeTrend(
  memoryItems: MemoryItem[],
  goals: Goal[],
  category: Category
): 'up' | 'down' | 'stable';
export const DIMENSIONS: DimensionConfig[];
```

**Acceptance criteria**:

- Score is 0-100 (clamped)
- 4 factors are computed independently
- Color matches strategy thresholds
- Trend uses score comparison, not entry count
- Functions are exported for reuse
- `npm run typecheck` passes

---

## Phase 2: Create DailyBriefing Component

**New file**: `dashboard/DailyBriefing.tsx`

This is the top section the user sees. It has 3 sub-parts. This component **replaces** the existing `TodaysFocus.tsx` (which only showed 3 tasks without context).

### 2a: Life Balance Strip

Import and reuse `computeScore`, `computeTrend`, `DIMENSIONS` from `./ScoreStrip`.

Render as a horizontal row of dimension pills:

```
[❤️ Health 72% ↑] [💰 Finance 45% ↓] [👥 Social 68% →] [🙏 Spirit 80% ↑] [🎨 Personal 55% →]
```

Each pill: icon + label + score% + badge color (from score threshold) + trend arrow.

**Micro-interaction**: When score changes, use a CSS counter animation:

```css
.score-value {
  transition: all 0.5s ease-out;
}
```

### 2b: Today's Focus

Show up to 3 prioritized items chosen by this logic (first match wins, fill up to 3):

1. **Declining dimensions** (trend === 'down') → "Your [dimension] needs attention"
2. **Unprepped events within 48 hours** — filter `timelineEvents` where `metadata?.prepStatus !== 'ready'` AND date is within 48 hours → "[Event title] in [X] hours, no prep plan"
3. **Overdue goals** — filter `goals` where `status === 'active'` AND `targetDate` is within 7 days → "[Goal title] deadline approaching"
4. **High-severity blind spots** — `blindSpots` where `severity === 'high'` → "[signal]"

If no items match any rule, show: "All systems nominal. You're on track."

### 2c: Quick Win

Show 1 high-impact action from recommendations.

**IMPORTANT**: `Recommendation.estimatedTime` is a **string** (e.g., "120m", "5m", "30 min"), NOT a number. Parse it:

```typescript
function parseEstimatedMinutes(est: string): number {
  const match = est.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}
```

Filter: `recommendations.filter(r => r.status === 'ACTIVE' && parseEstimatedMinutes(r.estimatedTime) <= 30)`

Sort by `impactScore` descending, take the first one. Show title + description + CTA button "Do This Now".

**DO NOT** copy demo data from StatusSidebar. Only show real recommendations or the empty state.

### Full Props Interface:

```typescript
interface DailyBriefingProps {
  memoryItems: MemoryEntry[];
  goals: Goal[];
  dailyPlan: DailyTask[];
  timelineEvents: TimelineEvent[];
  blindSpots: BlindSpot[];
  recommendations: Recommendation[];
  onToggleTask: (id: string) => void;
  onActivate?: (rec: Recommendation) => void;
}
```

**Empty state** (no memory items): "Log your first entry to see your life balance"

**Acceptance criteria**:

- Renders Life Balance Strip with 5 dimension scores (colored pills with trend arrows)
- Shows up to 3 Today's Focus items with contextual messages
- Shows 1 Quick Win with CTA button (parses estimatedTime string correctly)
- Handles empty state gracefully
- Named export: `export const DailyBriefing`
- `npm run typecheck` passes

---

## Phase 3: Create SWOTGrid Component

**New file**: `dashboard/SWOTGrid.tsx`

A 2x2 grid showing the user's life SWOT analysis.

**Data mapping** (use EXISTING types only):

The `ProactiveInsight.type` field is typed as `string` (not a union). Its actual values depend on what the AI generates. Use the `feedback` field as the **primary** classifier since it's more reliable:

- **Strengths**: `insights.filter(i => i.feedback === 'like')` — user has validated these
- **Opportunities**: `insights.filter(i => i.feedback !== 'like')` — unvalidated insights are opportunities
- **Concerns**: `blindSpots.filter(b => b.severity !== 'high')` — low/med severity
- **Risks**: `blindSpots.filter(b => b.severity === 'high')` — high severity items

If insights have no `feedback` set (undefined), treat them as Opportunities.

**Props**:

```typescript
interface SWOTGridProps {
  insights: ProactiveInsight[];
  blindSpots: BlindSpot[];
}
```

**Layout**: 2x2 grid using Tailwind CSS grid. Each quadrant has:

- Header with icon + label + count badge
- Color-coded left border (Strengths=emerald, Opportunities=blue, Concerns=amber, Risks=rose)
- List of items (max 3 per quadrant, with "+N more" if overflow)
- Each item shows:
  - For insights: `title` + `description` (truncated to 2 lines)
  - For blindSpots: `signal` + `why` (truncated to 2 lines). **DO NOT** reference `description` or `type` on BlindSpot.

**Micro-interactions**:

- Card hover: `hover:translate-y-[-2px]` + shadow increase (from strategy Section 6)
- Each quadrant item: `hover:bg-white/[0.02]` subtle highlight

**Empty state**: "Your SWOT analysis will appear after you log a few entries."

Wrap entire grid in `<Collapsible title="LIFE AT A GLANCE" defaultOpen={true}>` from `@/shared`.

**Field names** (EXACT — from data/types.ts):

- `ProactiveInsight`: `id`, `title`, `description`, `type` (string), `category` (Category), `feedback?` ('like' | 'dislike')
- `BlindSpot`: `id`, `signal`, `why`, `severity` ('low'|'med'|'high'), `actions` (string[]), `ownerId`, `createdAt`, `confidence`

**DO NOT** invent fields like `BlindSpot.description`, `BlindSpot.type`, `Insight.risk`, etc.

**Acceptance criteria**:

- 2x2 grid renders with correct data mapping
- Uses Collapsible wrapper from @/shared
- Each quadrant has color-coded border and icon
- Items capped at 3 per quadrant with overflow indicator
- Hover micro-interactions on quadrant items
- Empty state when no insights/blindSpots
- Named export: `export const SWOTGrid`
- `npm run typecheck` passes

---

## Phase 4: Create GoalsPanel Component

**New file**: `dashboard/GoalsPanel.tsx`

Shows active goals with progress bars and AI recommendations.

**Props**:

```typescript
interface GoalsPanelProps {
  goals: Goal[];
  recommendations: Recommendation[];
  onKeepRecommendation?: (id: string) => void;
  onRemoveRecommendation?: (id: string) => void;
  onActivate?: (rec: Recommendation) => void;
}
```

**Layout**:

### Section 1: Active Goals

Filter: `goals.filter(g => g.status === 'active')`. Sort by `targetDate` ascending (most urgent first).

Each goal card:

- Title (bold)
- Category badge (colored by dimension)
- Progress bar: use `progress` field (0-100). **Reuse** `ProgressBarAnimation` from `@/shared/Animations` if framer-motion is available, otherwise use a Tailwind-based animated bar:

```tsx
<div className="h-2 bg-slate-800 rounded-full overflow-hidden">
  <div
    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
    style={{ width: `${goal.progress}%` }}
  />
</div>
```

- Target date with relative label ("in 3 days", "in 2 weeks")
- Progress percentage text

**Micro-interaction**: Progress bar animates from 0 to actual value on mount (CSS transition).

### Section 2: AI Suggestions

Filter: `recommendations.filter(r => r.status === 'ACTIVE' && r.userFeedback !== 'kept' && r.userFeedback !== 'removed')`

Each recommendation card:

- Title + description
- Impact badge if `impactScore > 7`
- Keep button (emerald) + Remove button (rose)
- "Execute" CTA button that calls `onActivate`

**DO NOT** copy or migrate the `demoRecs` array from StatusSidebar. Only show real data or empty state.

Wrap in `<Collapsible title="GOALS & RECOMMENDATIONS" defaultOpen={true}>`.

**Field names** (EXACT):

- `Goal`: `id`, `title`, `targetDate` (string), `category` (Category), `progress` (number 0-100), `status` ('active'|'completed'|'on-hold'), `ownerId`, `createdAt`
- `Recommendation`: `id`, `title`, `description`, `category`, `impactScore`, `rationale`, `steps`, `estimatedTime` (string), `status` ('ACTIVE'|'DISMISSED'|'APPLIED'), `userFeedback?` ('kept'|'removed'), and more — see `data/types.ts`

**Empty state**: "Set your first goal to track progress across life dimensions."

**Acceptance criteria**:

- Active goals render with animated progress bars
- Recommendations render with Keep/Remove/Execute buttons
- No demo data included
- Collapsible wrapper
- Named export: `export const GoalsPanel`
- `npm run typecheck` passes

---

## Phase 5: Rebuild DashboardView Layout

**File**: `dashboard/DashboardView.tsx` (MODIFY — do not rewrite from scratch)

**Changes**:

1. Add imports: `DailyBriefing`, `SWOTGrid`, `GoalsPanel` (from same directory)
2. Remove imports: `StatusSidebar`, `ScoreStrip` (no longer used in layout)
3. Replace the 3-column grid with single-column stacked layout
4. Wire all props correctly

**Prop wiring** (critical — App.tsx passes `{...(aura as any)}` so most props flow automatically):

```tsx
// DailyBriefing — needs explicit prop wiring since names differ
<DailyBriefing
  memoryItems={memory}      // NOTE: DashboardView receives "memory", DailyBriefing expects "memoryItems"
  goals={goals}
  dailyPlan={focusTasks}    // The computed focus tasks (dailyPlan or tasks)
  timelineEvents={timelineEvents}
  blindSpots={blindSpots}
  recommendations={recommendations}
  onToggleTask={toggleTask}
  onActivate={(rec) => activatePrepPlan?.(rec, (rec as any).metadata?.eventId)}
/>

// SWOTGrid
<SWOTGrid
  insights={insights}
  blindSpots={blindSpots ?? []}  // blindSpots is optional (?) in props, default to []
/>

// GoalsPanel
<GoalsPanel
  goals={goals}
  recommendations={recommendations}
  onKeepRecommendation={keepRecommendation}
  onRemoveRecommendation={removeRecommendation}
  onActivate={(rec) => activatePrepPlan?.(rec, (rec as any).metadata?.eventId)}
/>
```

**New layout structure** (full):

```tsx
<div className="max-w-5xl mx-auto pb-32 space-y-8">
  {/* 1. Daily Briefing — always visible, never collapses */}
  <DailyBriefing ... />

  {/* 2. SWOT Grid — collapsible */}
  <SWOTGrid ... />

  {/* 3. Goals & Recommendations — collapsible */}
  <GoalsPanel ... />

  {/* 4. Tasks & Events — side by side on desktop, stacked on mobile */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div>
      <FocusList
        tasks={focusTasks}
        habitItems={habitItems}
        onToggleTask={(id) => toggleTask(id)}
        onToggleHabit={handleToggleHabit}
        onDeleteTask={(id) => deleteTask(id)}
        onRefreshPlan={planMyDay}
        onRefreshQueue={planMyDay}
        isPlanning={isPlanningDay}
        events={timelineEvents}
      />
    </div>
    <div>
      <UpcomingCalendar
        events={timelineEvents}
        onSelectEvent={setActivePrepEvent}
        onEditEvent={setEditingEvent}
        onDeleteEvent={deleteTimelineEvent}
      />
    </div>
  </div>

  {/* 5. Footer */}
  <SystemStatusFooter completion={completion.overall} />
</div>
```

**KEEP** all existing state, handlers, overlays, and useMemo computations:

- `activePrepEvent` / `editingEvent` state
- `financeMetrics` useMemo
- `habitItems` useMemo
- `focusTasks` useMemo
- `handleToggleHabit` handler
- `EventPrepPopup` overlay (after the main layout)
- `EventEditSheet` overlay (after the main layout)

**REMOVE** from the component:

- `StatusSidebar` usage (data is now in SWOTGrid + GoalsPanel)
- `ScoreStrip` usage (scoring is now inside DailyBriefing)
- The 3-column grid structure
- The "Mission Control" and "Upcoming Events" manual headers (components handle their own headers)

**DO NOT REMOVE** the `insights` prop from DashboardViewProps — it's needed for SWOTGrid.

**Responsive behavior** (from strategy Section 6):

- Desktop (>1200px): Full layout, Tasks & Events side by side
- Tablet (768-1199px): Tasks & Events stack vertically (already handled by `md:grid-cols-2`)
- Mobile (<768px): All sections stack, Collapsible sections start collapsed

Add `defaultOpen` control for mobile:

```tsx
// At the top of the component:
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Then in SWOTGrid/GoalsPanel, you could pass defaultOpen via a wrapper, or just let Collapsible default to true (desktop) and users manually collapse on mobile. This is NOT required for Phase 5 — it's a polish item.
```

**Acceptance criteria**:

- Layout is single-column stacked (not 3-column grid)
- All 5 sections render in correct order
- `insights` prop correctly wired to SWOTGrid
- `blindSpots` uses `?? []` fallback (it's optional in props)
- `memory` → `memoryItems` prop rename handled in DailyBriefing wire-up
- Existing functionality preserved (task toggle, event prep, recommendations, overlays)
- `financeMetrics` useMemo kept (may be needed later)
- `npm run typecheck` passes

---

## Phase 6: Wire Barrel Exports + Cleanup

**File**: `dashboard/index.ts` (MODIFY)

Add new exports:

```typescript
export { DailyBriefing } from './DailyBriefing';
export { SWOTGrid } from './SWOTGrid';
export { GoalsPanel } from './GoalsPanel';
```

**DO NOT remove** `StatusSidebar` or `ScoreStrip` exports — they may be imported elsewhere. Only remove if you verify zero other imports exist (search the codebase first).

`TodaysFocus` is not currently in `dashboard/index.ts` so no cleanup needed there.

**Acceptance criteria**:

- All new components exported from barrel
- `npm run typecheck` passes
- `npm run check` passes (typecheck + lint + build)

---

## Phase 7: Visual Polish & Micro-Interactions

**Files**: All new components created in Phases 2-4

Apply the micro-interactions from strategy Section 6:

| Trigger         | Animation                                 | Where                            |
| --------------- | ----------------------------------------- | -------------------------------- |
| Score change    | Number counter transition (0.5s ease-out) | DailyBriefing Life Balance Strip |
| Card hover      | `hover:-translate-y-0.5 hover:shadow-lg`  | SWOTGrid items, GoalsPanel goals |
| Collapse/Expand | Already handled by Collapsible (0.3s)     | SWOTGrid, GoalsPanel             |
| Progress bar    | Width transition from 0 to value (0.5s)   | GoalsPanel goal cards            |
| Badge pulse     | `animate-pulse` on score change           | DailyBriefing dimension pills    |

**Glassmorphism card style** (match existing design system):

```tsx
className = 'bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl';
```

**Typography rules** (from strategy):

- Headers: `text-[9px] font-black uppercase tracking-[0.3em] text-slate-500` (matches Collapsible)
- Body: `text-xs text-slate-300`
- Meta: `text-[10px] text-slate-500`
- Numbers: `font-mono font-bold` (scores, percentages)

**Color consistency** (use these exact Tailwind classes for dimension colors):
| Dimension | Color Class |
|-----------|-------------|
| Health | `text-emerald-400` / `border-emerald-500/30` / `bg-emerald-500/10` |
| Finance | `text-amber-400` / `border-amber-500/30` / `bg-amber-500/10` |
| Relationships | `text-cyan-400` / `border-cyan-500/30` / `bg-cyan-500/10` |
| Spiritual | `text-violet-400` / `border-violet-500/30` / `bg-violet-500/10` |
| Personal | `text-indigo-400` / `border-indigo-500/30` / `bg-indigo-500/10` |

**Acceptance criteria**:

- Cards have glassmorphism styling consistent with existing UI
- Hover states on interactive elements
- Progress bars animate on mount
- Typography follows the established pattern
- Visual test at http://localhost:3000 — dashboard looks cohesive
- `npm run typecheck` passes

---

## Anti-Patterns (DO NOT)

| Do NOT                                                              | Why                                                                                                                   |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Use `export default`                                                | Project uses named exports only                                                                                       |
| Invent types like `SWOTItem`, `LifeDimension`, `ConcernItem`        | Only use types from `data/types.ts`                                                                                   |
| Reference `BlindSpot.description` or `BlindSpot.type`               | BlindSpot has `signal`, `why`, `severity`, `actions` — no `description` or `type`                                     |
| Reference `useAura()` directly in dashboard components              | Props are passed from App.tsx → DashboardView → child components                                                      |
| Hardcode mock data in production components                         | Show empty state or real data only. DO NOT copy `demoRecs` from StatusSidebar                                         |
| Rewrite DashboardView from scratch                                  | Modify the existing file, preserve all handlers and overlays                                                          |
| Use `src/` prefix in imports                                        | Imports use `@/data`, `@/shared`, `./ComponentName`                                                                   |
| Treat `Recommendation.estimatedTime` as a number                    | It's a `string` like "120m" or "5m". Parse with regex                                                                 |
| Assume `ProactiveInsight.type` has specific enum values             | It's typed as `string`. Use `feedback` field for SWOT classification                                                  |
| Add new props to App.tsx DashboardView usage                        | App.tsx already spreads `{...(aura as any)}` — all useAura fields flow through                                        |
| Import `Animations.tsx` without checking framer-motion availability | `framer-motion` is in package.json — safe to use, but CSS transitions are lighter and preferred for simple animations |

---

## Data Available in DashboardView Props

These are already passed as props — use them, don't fetch new data:

| Prop              | Type                 | Use For                                | Notes                                                                      |
| ----------------- | -------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| `memory`          | `MemoryEntry[]`      | Score computation, habit tracking      | Renamed to `memoryItems` when passing to children                          |
| `tasks`           | `DailyTask[]`        | Task list                              | Combined with dailyPlan in `focusTasks` useMemo                            |
| `dailyPlan`       | `DailyTask[]`        | AI-generated daily plan                | Takes priority over tasks in focusTasks                                    |
| `timelineEvents`  | `TimelineEvent[]`    | Upcoming events, Today's Focus         | Has `metadata?.prepStatus` for prep check                                  |
| `insights`        | `ProactiveInsight[]` | SWOT Strengths/Opportunities           | Use `feedback` field for classification                                    |
| `blindSpots`      | `BlindSpot[]`        | SWOT Concerns/Risks                    | **OPTIONAL** prop (has `?`) — always use `?? []`                           |
| `profile`         | `UserProfile`        | Profile completion, dimension data     | Has `health`, `finances`, `relationship`, `spiritual`, `personal` sections |
| `recommendations` | `Recommendation[]`   | AI suggestions, Goals panel, Quick Win | `estimatedTime` is a string                                                |
| `goals`           | `Goal[]`             | Goals panel, score computation         | `progress` is 0-100, `status` is string union                              |

---

## Prop Flow Architecture (DO NOT BREAK)

```
useAura() hook (core/useAura.ts)
    ↓ returns all state
App.tsx
    ↓ spreads {...(aura as any)} + explicit overrides
DashboardView.tsx (DashboardViewProps interface)
    ↓ passes specific props to each child
DailyBriefing / SWOTGrid / GoalsPanel / FocusList / UpcomingCalendar
```

**Key**: `App.tsx` line 205 does `<DashboardView {...(aura as any)} ...>`. This means ALL `useAura()` return values are available as props in DashboardView, even if not listed in `DashboardViewProps`. However, only use props that ARE in the interface — don't reach for unlisted ones.

---

## Security Checklist

- [ ] No API keys or secrets in new components
- [ ] No `dangerouslySetInnerHTML` usage
- [ ] No external URLs or CDN references in new components
- [ ] All user-generated content (goal titles, event titles, recommendation text) rendered as text nodes, not HTML
- [ ] No `eval()` or `new Function()` usage
- [ ] Event handlers use `onClick` with proper `stopPropagation` where nested

---

## Per-Phase Completion Gate (MANDATORY)

After completing EACH phase, you MUST run this block and paste the output before proceeding:

```bash
npm run typecheck && echo "✅ TYPECHECK: PASS" || echo "❌ TYPECHECK: FAIL"
npm run lint && echo "✅ LINT: PASS" || echo "❌ LINT: FAIL"
npm run build && echo "✅ BUILD: PASS" || echo "❌ BUILD: FAIL"
```

**Rules**:
- If ANY check shows FAIL → fix the errors and re-run until ALL pass
- Do NOT proceed to the next phase with any FAIL
- Paste the terminal output as proof — do not just say "all checks pass"

---

## Final Gate (MANDATORY — do not say "done" without completing ALL steps)

After Phase 7, run this complete verification:

### Step 1: Full Quality Gate
```bash
npm run check:standard
```
Paste the FULL output. If any FAIL → fix and re-run.

### Step 2: Visual Verification
Run `npm run dev` and open http://localhost:3000. Verify:
- [ ] Daily Briefing renders at top with 5 dimension pills
- [ ] SWOT Grid shows 2x2 layout (or empty state if no data)
- [ ] Goals Panel shows goals with progress bars (or empty state)
- [ ] Tasks & Events render side by side on desktop
- [ ] Collapsible sections open/close with animation
- [ ] No console errors in browser DevTools
- [ ] Empty states display correctly when no data is present

Describe what you see or take a screenshot.

### Step 3: Integration Trace
Verify the import chain is complete (no orphaned components):
```
App.tsx → DashboardView → DailyBriefing ✓
App.tsx → DashboardView → SWOTGrid ✓
App.tsx → DashboardView → GoalsPanel ✓
App.tsx → DashboardView → FocusList ✓ (existing)
App.tsx → DashboardView → UpcomingCalendar ✓ (existing)
```

### Step 4: Security Quick Check
Confirm:
- [ ] No `dangerouslySetInnerHTML` in new files
- [ ] No hardcoded API keys or secrets
- [ ] No demo/mock data in production components

### Step 5: Commit
```bash
git add dashboard/DailyBriefing.tsx dashboard/SWOTGrid.tsx dashboard/GoalsPanel.tsx dashboard/ScoreStrip.tsx dashboard/DashboardView.tsx dashboard/index.ts shared/Collapsible.tsx
git commit -m "feat: dashboard revamp — single-column layout with DailyBriefing, SWOTGrid, GoalsPanel"
```

### Step 6: Report
Provide a summary:
- Files created (with line counts)
- Files modified
- All quality gate results
- What works
- Any known limitations or items deferred

**Only after completing ALL 6 steps can you say the task is done.**

---

## Execution Notes

- **Model recommendation**: Use **Gemini 3 Pro** for this work. The tasks involve multi-file coordination (bug fix + 3 new components + DashboardView modification + barrel exports + visual polish), which requires stronger reasoning than Flash.
- **Mode**: Native automation (Mode 2) — have the agent read this plan and execute phase by phase with checkpoints.
- **Test after each phase** at http://localhost:3000
- **Run the Per-Phase Completion Gate** after every phase before moving to the next
- **Phase order matters**: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Phase 0 and 1 must be done first (dependencies).
- **Total new files**: 3 (DailyBriefing.tsx, SWOTGrid.tsx, GoalsPanel.tsx)
- **Total modified files**: 4 (Collapsible.tsx, ScoreStrip.tsx, DashboardView.tsx, dashboard/index.ts)
- **Files to verify still work**: FocusList.tsx, UpcomingCalendar.tsx, EventPrepPopup.tsx, EventEditSheet.tsx
- **Read `.agent/core/AGENT.md` before starting** — it has 8 hard rules from past failures
