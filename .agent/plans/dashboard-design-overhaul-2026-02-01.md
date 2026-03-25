# Dashboard Design Overhaul Plan (Karri-Level)

**Date**: 2026-02-01  
**Goal**: Replace the current cluttered dashboard with a calm, high‑signal, premium layout that feels decisive, personal, and worth paying for.

---

## 1) Diagnosis (From Screens)

**Core Problems**
- Too many sections compete for attention (Baseline SWOT + Pulse + Daily Mission + Life at a Glance + Goals + Focus + Calendar).
- Visual density is high (tiny labels, repeated chips, heavy borders) → “noisy cockpit.”
- Redundant signal: Baseline SWOT + Life at a Glance + Pulse all describe “state” in different formats.
- “Daily Mission” is visually similar to other areas; it doesn’t dominate.
- Logging is buried in the bottom bar; it should be the primary action.

**Impact**
User doesn’t know where to look first, what to do next, or why it matters.

---

## 2) New Information Architecture (Single Path)

**Always visible, in order:**

1. **Mission Header**  
   Personalized greeting + “1 sentence reality” + primary CTA.

2. **Command Strip**  
   The only primary action: **Log** (with 4–6 key templates).

3. **Mission Panel (Hero)**  
   - Today’s Focus (max 3)  
   - Quick Win (1)  
   - “Why it matters” (1 line)

4. **Life Signals (Unified)**  
   Replace all baseline/pulse/swot fragmentation with **one** component:
   - **Signal Cards** per dimension: score + delta + 1‑line insight + next action.

5. **Execution Zone**  
   - Focus List (tasks) + Upcoming Events (compact, not equal weight)

6. **Recommendations (Optional / collapsed)**  
   Only show top 1–2; rest behind “View more.”

---

## 3) Section Consolidation (Remove Dupes)

**Remove / Merge**
- **Baseline SWOT** → merged into Life Signals (one card per dimension).
- **Dimension Pulse** → merged into each Signal Card (delta + trend).
- **Life at a Glance SWOT Grid** → keep only if expanded view is requested.
- **Goals + Recommendations** → reduce to “Top Goal + Top AI Rec.”

**Result**: 1 hero + 2 primary blocks + 1 optional block.

---

## 4) Visual System (Karri‑style: calm, crisp, purposeful)

**Typography**
- Raise all labels to 12–14px.
- Only 2 sizes for metadata: 12px and 14px.
- Clear typographic hierarchy (Hero 24–28, Section 14–16, Meta 12).

**Card Design**
- Remove heavy borders.
- Use **soft elevation** + subtle gradient edges.
- Introduce spacing: each card must “breathe.”

**Color**
- Use one accent color for action (indigo).
- Reserve red/orange for risk.
- Only show green for clear wins (avoid constant positive signal).

**Micro‑Interactions**
- Short fades (150–200ms).
- No pulsing text.
- Animate only the action or updated section.

---

## 5) Hyper‑Personalization Surface

Every visible insight must include one of:
- **Profile hook** (“Because you’re an INFJ / Night Owl…”)
- **Recent log hook** (“Based on yesterday’s sleep log…”)
- **Upcoming event hook** (“Ahead of your Trip to Korea…”)

If none exists → show “Log a check‑in to personalize this.”

---

## 6) UX & Flow Improvements

**Primary CTA hierarchy**
1. Log check‑in (big, always visible)
2. Start quick win
3. Schedule event

**User flow**
On opening dashboard:
1. See “Today’s Mission.”
2. Log check‑in or do quick win.
3. See dimension update immediately.

---

## 7) Proposed Component Map (New)

**New Components**
- `MissionHeader`  
- `CommandStrip`  
- `MissionPanel` (Today’s focus + Quick Win)  
- `SignalGrid` (5 dimension cards, each with score + delta + 1 insight + next action)  
- `ExecutionZone` (Tasks + Events)  

**Retained**
- `FocusList` (simplified)
- `UpcomingCalendar` (compact)

---

## 8) Step‑by‑Step Execution Plan

### Phase 1 — Layout Restructure
- Remove Baseline SWOT + Dimension Pulse + SWOT Grid from main flow.
- Add Mission Header + Mission Panel + Signal Grid.
- Move Log templates into Command Strip.

### Phase 2 — Signal Grid
- Each dimension card shows:
  - Score
  - Trend delta
  - 1 insight (profile/log)
  - Next action (1 line)

### Phase 3 — Execution Zone
- Focus List simplified (no repeated strategic copy).
- Calendar reduced to 2–3 upcoming events.

### Phase 4 — Visual Pass
- Normalize spacing, line heights, contrast.
- Reduce label clutter.
- Ensure each block has a clear title + CTA.

---

## 9) Success Criteria

- User can answer in 5 seconds:  
  “What matters today?” and “What should I do next?”
- Above‑the‑fold: Mission + CTA + Signal Grid visible.
- Visual clutter reduced by 50% (count of labels + chips).

---

## 10) Implementation Checklist

- [ ] Remove redundant sections.
- [ ] Build new Mission Header + Command Strip.
- [ ] Build Signal Grid (5 cards).
- [ ] Simplify Focus List + Calendar.
- [ ] Replace noisy animations with subtle transitions.
- [ ] Verify typography sizes (min 12px).
- [ ] Verify clear CTA hierarchy.

---

## QA

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual 375px / 768px / 1440px pass
- Accessibility: focus states + contrast
