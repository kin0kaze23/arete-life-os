# Dashboard UX Optimization Plan

**Goal**: Reduce scrolling, show more above the fold, optimize for user viewing patterns

## Current Issues

1. **Too much vertical space wasted**
   - Header + LifePulseBar = 2 separate sections
   - Large padding everywhere (p-5, p-6, space-y-6)
   - Action pills take full row
   - Empty descriptions under section headers

2. **Poor visual hierarchy**
   - Everything has equal weight
   - User must scroll to see priority tasks
   - Sidebar at bottom instead of right

3. **Inefficient layout**
   - Single column on desktop initially
   - 2-column only at bottom
   - Doesn't use 1420px width effectively

## Optimal User Flow

**What users need to see FIRST (above fold on 1080p):**
1. Greeting + summary (2 lines max)
2. Life dimensions status (compact)
3. Top 3 priority tasks
4. Next upcoming event
5. Quick capture button

**What can be below fold:**
- Remaining tasks
- Inbox details  
- Recommendations
- Habits

## Proposed Changes

### 1. Merge Header + LifePulseBar
**Current**: 2 separate sections, ~120px vertical  
**Proposed**: Single header bar, LifePulse on right, ~60px vertical

```tsx
<header className="flex items-center justify-between gap-4 rounded-[20px] border border-white/8 bg-white/[0.02] p-4">
  <div>
    <h1 className="text-2xl font-semibold">{greeting}</h1>
    <p className="text-sm text-slate-400">{headerSummary}</p>
  </div>
  <LifePulseBar /> {/* Desktop only, 5 dots compact */}
</header>
```

### 2. Compact LifePulseBar
**Current**: Large dots (h-8 w-8), labels below, ~80px height  
**Proposed**: Smaller dots (h-7 w-7), no labels, ~40px height

### 3. Two-Column Desktop Layout
**Current**: Single column, then 2-column at bottom  
**Proposed**: 2-column from top (2/3 tasks + 1/3 sidebar)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <section className="lg:col-span-2">
    {/* Tasks */}
  </section>
  <aside className="space-y-3">
    {/* Upcoming, Inbox, Always-Do/Watch */}
  </aside>
</div>
```

### 4. Reduce Padding Everywhere
**Changes**:
- `space-y-6` → `space-y-4`
- `p-5` / `p-6` → `p-4`
- `gap-4` → `gap-3`
- `rounded-[26px]` → `rounded-[20px]`
- Remove unnecessary description text

### 5. Compact Task Cards
**Current**: p-4, large gaps  
**Proposed**: p-3, tighter spacing

### 6. Action Buttons Inline
**Current**: 3 large action pills in a row  
**Proposed**: Compact buttons, Capture primary

```tsx
<div className="flex gap-2">
  <button className="flex-1 bg-blue-500 text-slate-950">+ Capture</button>
  <button className="border">Journal</button>
  <button className="border">Aura</button>
</div>
```

### 7. Sidebar Optimization
Stack vertically on right:
1. Upcoming Events (compact, 3 items)
2. Inbox (compact, 2 items preview)
3. Always-Do chips
4. Always-Watch chips

Each section: `p-4` max, minimal headers

## Expected Result

**Before**: User scrolls 2-3 times to see tasks  
**After**: All priority tasks visible on first screen

**Before**: Life dimensions separate from header  
**After**: Integrated, glanceable

**Before**: 1420px width underutilized  
**After**: Two-column uses full width

**Viewport Usage** (1080p = ~800px usable):
- Header: 60px
- LifePulse: 40px  
- Task section header: 40px
- Actions: 40px
- 3 Priority tasks: 300px
- Habits: 60px
- **Total above fold: ~540px** ✅

Leaves 260px for scrollbar buffer = perfect!

## Files to Modify

1. `dashboard/DashboardView.tsx` - Main layout
2. `dashboard/LifePulseBar.tsx` - Compact version
3. `dashboard/FocusList.tsx` - Tighter spacing
4. `dashboard/DashboardHeader.tsx` - Merge or remove

## Testing

Test at these viewport heights:
- 1080p (800px usable) - target
- 900p (700px usable) - minimum
- 1440p (1000px+ usable) - extra space OK
