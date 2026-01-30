---
name: Component Analysis & Separation Decision Framework
description: Framework for evaluating when to optimize or separate components for better reliability and maintainability
---

# Component Analysis & Separation Decision Framework

Use this framework to decide whether a component needs optimization, separation, or refactoring before making changes.

---

## When to Analyze Components

Analyze components before making changes if:

- The component is >300 lines
- Multiple unrelated responsibilities exist
- Debugging is difficult or errors are frequent
- Changes require understanding complex state interactions

---

## Decision Matrix

### ✅ Keep as Single Component

- Single clear responsibility (e.g., display event card)
- < 300 lines with clear sections
- State is tightly coupled and interdependent
- No performance issues
- Easy to test and debug

### ⚠️ Optimize Current Component

**Signs:**

- 300-500 lines
- Multiple `useState` or `useEffect` hooks (>5)
- Nested conditional rendering (>3 levels)
- Repeated logic or code duplication

**Actions:**

- Extract helper functions to separate file
- Use `useMemo`/`useCallback` for expensive operations
- Extract inline styles to constants
- Consolidate related state with `useReducer`

### 🔄 Separate into Multiple Components

**Signs:**

- > 500 lines
- Mixing data fetching, business logic, and UI
- Difficult to understand data flow
- Multiple independent features in one file
- Hard to test specific behaviors

**Actions:**

- Extract UI sections into presentation components
- Separate data fetching into custom hooks
- Create container/presentation component pattern
- Split by feature domain (e.g., EventCard, EventEditor, EventList)

---

## Component Separation Patterns

### Pattern 1: Container / Presentation

```tsx
// Container (logic + data)
export const EventListContainer = () => {
  const { events, updateEvent, deleteEvent } = useEvents();
  return <EventList events={events} onUpdate={updateEvent} onDelete={deleteEvent} />;
};

// Presentation (UI only)
export const EventList = ({ events, onUpdate, onDelete }) => {
  return events.map((e) => <EventCard event={e} onUpdate={onUpdate} onDelete={onDelete} />);
};
```

### Pattern 2: Custom Hooks for Logic

```tsx
// Hook handles all business logic
const useEventManager = () => {
  const [events, setEvents] = useState([]);
  const addEvent = (e) => {
    /* logic */
  };
  const updateEvent = (id, updates) => {
    /* logic */
  };
  return { events, addEvent, updateEvent };
};

// Component only handles rendering
const EventDashboard = () => {
  const { events, addEvent, updateEvent } = useEventManager();
  return <UI />;
};
```

### Pattern 3: Feature-Based Modules

```
events/
  EventCard.tsx          # Display single event
  EventEditor.tsx        # Edit event form
  EventList.tsx          # List of events
  useEventManager.ts     # Business logic
  eventUtils.ts          # Pure utility functions
  types.ts               # Type definitions
```

---

## Anti-Patterns to Avoid

❌ **God Components** — Single file doing everything (data, logic, UI, side effects)
❌ **Prop Drilling** — Passing props through 3+ levels (use Context or composition)
❌ **Tight Coupling** — Component can't be used without specific parent
❌ **Mixed Concerns** — API calls, state management, and rendering in one component
❌ **Inline Complexity** — Complex logic directly in JSX return statement

---

## Analysis Checklist

Before making changes to a component, ask:

- [ ] What is this component's **single responsibility**?
- [ ] Can I describe it in one sentence?
- [ ] How many **state variables** does it manage? (>5 = red flag)
- [ ] How many **useEffect** hooks? (>3 = consider separation)
- [ ] Is there **duplicated logic** that could be extracted?
- [ ] Would **testing** this component be difficult?
- [ ] Does it have **multiple reasons to change**? (Violates Single Responsibility)
- [ ] Could I **reuse** parts of this elsewhere?

---

## Specific to Areté Life OS

### Current Architecture Patterns

1. **State in `useAura.ts`** — Central state management (good for shared state)
2. **View Components** — `DashboardView`, `VaultView` (container pattern)
3. **Feature Components** — `UpcomingCalendar`, `FocusList` (presentation)
4. **Modals/Sheets** — `PrepPlanModal`, `EventEditSheet` (isolated features)

### When Working on Event Features

**Event Detection Flow** (logMemory → AI → processInput):

- If fixing detection: Work in `core/useAura.ts` + `ai/geminiService.ts`
- If fixing display: Work in `dashboard/UpcomingCalendar.tsx`
- If fixing editing: Work in `dashboard/EventEditSheet.tsx`

**Clear boundaries:**

- **Data Layer**: `core/useAura.ts` (state management)
- **AI Layer**: `ai/geminiService.ts`, `api/gemini.ts` (LLM calls)
- **UI Layer**: `dashboard/*` components (presentation)

---

## Action Template

When you identify a component needs work:

```markdown
## Component: [Name]

**Current State**: [lines of code, responsibilities]
**Issues**: [specific problems]
**Decision**: [Keep / Optimize / Separate]
**Action Plan**:

1. [specific step]
2. [specific step]
```

---

## Quality Gates

After refactoring, verify:

- [ ] Each component has **one clear purpose**
- [ ] **No duplicated logic** across files
- [ ] **Type safety** maintained
- [ ] **Imports** are clean (no circular dependencies)
- [ ] **Tests** pass (or manual testing successful)
- [ ] **Build** succeeds without warnings
