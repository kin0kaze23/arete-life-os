---
name: planning-intelligence
description: Strategic planning and PRD creation for automation-ready implementation plans. Use when creating feature plans, PRDs, or any documentation that will feed into the DevOps automation loop.
---

# Planning Intelligence Skill

> **Purpose**: Create clear, conceptual plans that the DevOps automation can accurately digest and execute.

## When to Use This Skill

- Creating new feature plans
- Writing Product Requirements Documents (PRDs)
- Planning sprints or phases
- Documenting strategic initiatives

**Key principle**: Write for humans first, but structure for automation.

---

## Plan Template

### Required Sections

```markdown
# [Feature Name]: Implementation Plan

> **Priority**: P0 | P1 | P2 | P3
> **Target Completion**: YYYY-MM-DD
> **Estimated Effort**: [X hours | Y days | Z weeks]

---

## 1. Overview

What is this feature? Why does it matter? (2-3 sentences)

---

## 2. User Stories

- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

---

## 3. Features to Build

### Feature A: [Name]

**What it does**: Clear description of functionality
**Key behaviors**:

- Behavior 1
- Behavior 2
- Behavior 3

**Requirements**:

- Requirement 1
- Requirement 2

### Feature B: [Name]

(Repeat structure)

---

## 4. Design Constraints

**Design System**: Reference to design system file (e.g., `DESIGN_SYSTEM_DARK.md`)
**Responsive**: Mobile-first | Desktop-first
**Accessibility**: WCAG 2.1 AA (minimum)
**Performance Targets**:

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

**Patterns to Follow**:

- Pattern A from [skill-name]
- Pattern B from [skill-name]

---

## 5. Technical Constraints

- Stack: [React 19, TypeScript, etc.]
- Dependencies: [List existing dependencies to leverage]
- Data model: [Reference to DATA_MODEL.md or schema]
- APIs: [List any external APIs or endpoints]

---

## 6. Success Criteria

How do we know this is complete and working?

- [ ] Functional criterion 1
- [ ] Functional criterion 2
- [ ] Quality criterion 1 (e.g., "All components accessible via keyboard")
- [ ] Performance criterion 1 (e.g., "Dashboard loads in < 2s")

---

## 7. Out of Scope

What we are NOT building in this iteration:

- Feature X (deferred to Phase 2)
- Integration Y (requires external dependency)
- Edge case Z (will address if needed)

---

## 8. Implementation Phases (Optional)

| Phase | Features          | Priority     |
| ----- | ----------------- | ------------ |
| P0    | Core features     | Must-have    |
| P1    | Enhanced features | Should-have  |
| P2    | Polish            | Nice-to-have |
```

---

## Context-Aware Planning (Critical)

**Before writing any plan**, you MUST gather context about the current repository state.

### Step 1: Repository Discovery

Read these files in order:

```bash
# 1. Architecture overview
.agent/README.md           # Project structure, tech stack, commands
docs/ARCHITECTURE.md       # Design patterns, data flow

# 2. Current state
.agent/CURRENT_STATUS.md   # Latest changes, active work
.agent/LEARNINGS.md        # Past issues, solutions, gotchas

# 3. Design constraints
docs/DESIGN_SYSTEM_DARK.md # Visual design tokens
docs/DATA_MODEL.md         # Database schema
```

### Step 2: Impact Assessment

For each feature in your plan, identify:

**Files that will be affected**:

```markdown
### Feature: Daily Briefing

**New files**:

- dashboard/DailyBriefing.tsx
- dashboard/LifeBalanceStrip.tsx

**Modified files**:

- dashboard/Dashboard.tsx (add DailyBriefing import)
- core/AuraContext.tsx (may need new state)
- data/scoreCalculation.ts (if scoring logic changes)
```

**Existing patterns to follow**:

```markdown
**State Management**: Use existing AuraContext (see core/AuraContext.tsx)
**Data Access**: Use IndexedDB via data/ layer (see data/README.md)
**Styling**: Follow glassmorphism pattern (see shared/SharedUI.tsx)
```

### Step 3: Risk Identification

Identify potential issues:

```markdown
## Risks & Mitigation

### Risk 1: Breaking Existing Dashboard

**What**: Adding DailyBriefing might conflict with existing layout
**Impact**: High
**Mitigation**:

- Review current Dashboard.tsx structure first
- Use feature flag for gradual rollout
- Add tests for existing Dashboard behavior

### Risk 2: Performance Regression

**What**: Calculating 5 dimension scores on every render
**Impact**: Medium
**Mitigation**:

- Use React.memo for DimensionCard
- Implement useMemo for score calculations
- Add performance test (LCP < 2.5s)

### Risk 3: Data Migration Needed

**What**: New scoring system may require schema change
**Impact**: Low
**Mitigation**:

- Check if current schema supports 5 dimensions
- Write migration script if needed
- Version data format
```

### Step 4: Dependency Check

Before planning, verify:

```markdown
## Prerequisites

**Required to exist BEFORE this plan**:

- [ ] AuraContext with score state (check core/AuraContext.tsx)
- [ ] IndexedDB schema includes dimensions table (check data/schema.ts)
- [ ] Design system tokens defined (check docs/DESIGN_SYSTEM_DARK.md)

**Will be created BY this plan**:

- [ ] DailyBriefing component
- [ ] Score calculation logic
- [ ] Dimension-specific views
```

### Step 5: Learning Integration

Reference past learnings:

```markdown
## Learnings Applied

From `.agent/LEARNINGS.md`:

- "Always use debouncedRefreshAura for state updates" → Applied to score changes
- "Glassmorphism cards need backdrop-filter" → Applied to all new cards
- "IndexedDB writes must be in transactions" → Will use for dimension updates
```

---

## Enhanced Plan Template (Context-Aware)

```markdown
# [Feature]: Implementation Plan

## 0. Context Analysis (NEW)

**Codebase Review**:

- Read: [list files reviewed]
- Current state: [summarize relevant existing code]
- Architecture pattern: [e.g., "Context + IndexedDB + API routes"]

**Impact Assessment**:

- New files: [list]
- Modified files: [list with reason]
- Dependencies: [existing code/libraries to use]

**Risks Identified**:

1. [Risk + mitigation]
2. [Risk + mitigation]

**Learnings Applied**:

- [Learning from LEARNINGS.md + how it applies]

---

## 1. Overview

[Rest of standard template...]
```

---

## Checklist: Context-Aware Plan

Before finalizing any plan, verify:

- [ ] Reviewed `.agent/README.md` for project structure
- [ ] Reviewed `docs/ARCHITECTURE.md` for design patterns
- [ ] Checked `.agent/CURRENT_STATUS.md` for conflicts with active work
- [ ] Referenced `.agent/LEARNINGS.md` for past issues
- [ ] Identified all files to create/modify
- [ ] Listed risks with mitigation strategies
- [ ] Verified prerequisites exist in codebase
- [ ] Confirmed plan aligns with existing architecture

---

## Best Practices

### ✅ DO

1. **Be Specific About Features**

   ```markdown
   ### Daily Briefing

   - Shows all 5 life dimensions with scores (0-100) and badges (🔴🟠🟢💎)
   - Displays trend indicators (↑↓→) based on 7-day score change
   - Highlights 3 priority items in "Today's Focus"
   - Responsive: Single column on mobile, grid on desktop
   ```

2. **Reference Existing Docs**

   ```markdown
   Design System: See `docs/DESIGN_SYSTEM_DARK.md` for color tokens
   Architecture: Follow patterns in `docs/ARCHITECTURE.md`
   ```

3. **Make Success Criteria Testable**

   ```markdown
   - [ ] All interactive elements have 44px minimum touch targets
   - [ ] Color contrast meets 4.5:1 ratio (WCAG AA)
   - [ ] Dashboard renders in < 2s on 3G connection
   ```

4. **Explain "Why" for Complex Decisions**
   ```markdown
   **Why glassmorphism?** Creates premium feel while maintaining readability
   **Why 500ms debounce?** Prevents API spam while feeling responsive
   ```

### ❌ DON'T

1. **Don't Write Atomic Tasks**

   ```markdown
   ❌ Bad:

   ### Task 1: Create DailyBriefing.tsx

   Files: dashboard/DailyBriefing.tsx
   ```

   **Why**: The AI digester will break features into tasks for you.

2. **Don't Be Vague**

   ```markdown
   ❌ Bad: "Create a nice-looking dashboard"
   ✅ Good: "Create dashboard with glassmorphism cards, dark theme,
   responsive grid (1-col mobile, 3-col desktop)"
   ```

3. **Don't Skip Design Constraints**

   ```markdown
   ❌ Missing: No mention of design system, accessibility, or performance
   ✅ Include: WCAG AA, mobile-first, LCP < 2.5s
   ```

4. **Don't Mix Multiple Features**
   ```markdown
   ❌ Bad: "Dashboard and Settings and Profile"
   ✅ Good: One plan per major feature area
   ```

---

## How the Automation Uses Your Plan

```
Your Plan (Conceptual)
    ↓
AI Digester reads:
  - Features to Build → Identifies components/files
  - Design Constraints → Loads relevant skills
  - Success Criteria → Creates acceptance tests
    ↓
Generates task-breakdown.json:
  - Task 001: Create DailyBriefing.tsx
  - Task 002: Create LifeBalanceStrip.tsx
  - Task 003: Integrate with Dashboard.tsx
    ↓
Task Executor implements each task
    ↓
Quality Evaluator validates against your success criteria
```

---

## Example: Well-Structured Plan

```markdown
# P0 Dashboard: Implementation Plan

> **Priority**: P0 (Critical)
> **Target**: 2026-02-07
> **Estimated Effort**: 20 hours

## 1. Overview

Build the core dashboard UI that shows life balance across 5 dimensions
with SWOT analysis and actionable tasks.

## 2. User Stories

- As a user, I want to see my life balance at a glance so I know which
  areas need attention
- As a user, I want personalized task recommendations so I know what to
  do next
- As a user, I want to track my progress over time so I stay motivated

## 3. Features to Build

### Daily Briefing

**What it does**: Top section showing current life state
**Key behaviors**:

- Displays 5 dimensions (Health, Finance, Relationships, Spiritual, Personal)
- Shows score (0-100), badge (🔴🟠🟢💎), and trend (↑↓→) for each
- Highlights 3 priority items in "Today's Focus"
- Suggests one "Quick Win" action with CTA button

**Requirements**:

- Fixed at top (never scrolls away)
- Updates in real-time when new logs added
- Responsive across all breakpoints

### SWOT Grid

**What it does**: 2x2 grid showing Strengths, Concerns, Opportunities, Risks
**Key behaviors**:

- Each quadrant shows 3-5 items max
- Items are evidence-based (cite specific logs/events)
- Collapsible on mobile to save space
- Visual distinction between quadrants

## 4. Design Constraints

**Design System**: `docs/DESIGN_SYSTEM_DARK.md`
**Responsive**: Mobile-first (375px → 1440px)
**Accessibility**: WCAG 2.1 AA
**Performance**: LCP < 2.5s, FID < 100ms

**Patterns**:

- Glassmorphism cards (visual-intelligence skill)
- 44px touch targets (visual-intelligence skill)
- 8px spacing grid (visual-intelligence skill)

## 5. Technical Constraints

- Stack: React 19, TypeScript, Tailwind CSS
- State: Use existing AuraContext from `core/AuraContext.tsx`
- Data: Pull from IndexedDB via `data/` layer
- Skills to follow: visual-intelligence, component-analysis, performance-intelligence

## 6. Success Criteria

- [ ] Daily Briefing shows all 5 dimensions with accurate scores
- [ ] Clicking dimension navigates to detail view
- [ ] SWOT Grid shows relevant, evidence-based items
- [ ] All components responsive on 375px, 768px, 1440px
- [ ] Touch targets ≥ 44px on mobile
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Dashboard loads in < 2s

## 7. Out of Scope

- Goals panel (P1)
- Events timeline (P2)
- Mobile app (Phase 2)
```

---

## Validation Checklist

Before running automation, verify your plan has:

- [ ] Clear overview (2-3 sentences)
- [ ] User stories (3+)
- [ ] Specific feature descriptions (not vague)
- [ ] Design constraints referenced
- [ ] Testable success criteria (5+)
- [ ] Out of scope section
- [ ] References to existing docs/skills

---

## Integration with DevOps Automation

Save your plan to: `.agent/plans/[feature-name].md`

Run automation:

```bash
# Let AI digest and execute
npm run devops:auto -- .agent/plans/p0-dashboard.md

# Or digest only (no execution)
npm run devops:digest -- .agent/plans/p0-dashboard.md
```

---

**Remember**: You write the vision, the AI writes the code. Keep plans conceptual, specific, and testable.
