# Dashboard Premium UX Revamp Plan

**Date**: 2026-02-01

**Goal**: Make the dashboard feel instantly valuable and worth paying for by surfacing a profile-based SWOT baseline, guiding users into high-signal logging, and showing immediate, visible improvements per life dimension after every log.

**North Star**: Within the first 3 minutes after onboarding, the user should (1) understand their baseline state, (2) take one guided log action, and (3) see a measurable change in at least one dimension.

---

## Evaluation Frameworks Applied (Mandatory)

**Usability & UX**
- Nielsen’s 10 Heuristics (system status, user control, error prevention, recognition over recall).
- Jobs‑to‑Be‑Done (baseline clarity → action → feedback loop).
- Plain‑Language UX (Grade 7–8 readability for all AI outputs and labels).

**Accessibility**
- WCAG 2.1 AA (contrast ≥ 4.5:1, focus states, keyboard navigation, touch targets ≥ 44px).
- Semantic HTML + ARIA for icon‑only actions.

**Performance**
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, FID < 100ms.
- Motion safety: `prefers-reduced-motion` support.

**Design System Consistency**
- Token‑driven color, spacing, typography (no ad‑hoc styles).
- Consistent hierarchy and CTA patterns across sections.

---

## Value-First Use Cases (What Users Pay For)

1. **Instant Baseline Clarity**: A profile-driven SWOT per life dimension (Health, Finance, Relationships, Spiritual, Personal) that feels tailored from day one.
2. **Actionable Daily Mission**: Clear “Today’s Focus” + Quick Win that feels like a premium chief-of-staff.
3. **Visible Progress Loop**: Logging produces immediate score shifts and “Dimension Pulse” alerts (improving/deteriorating).
4. **Event & Goal Leverage**: Prep plans and goal progress surfaced with context, timing, and next steps.
5. **Reduced Friction Logging**: Guided templates and contextual suggestions that make logging effortless and meaningful.

---

## Experience Principles (Design Pillars)

1. **Instant Signal**: Baseline SWOT and Dimension Pulse are visible within the first screen.
2. **Guided Action**: Clear, single‑step CTAs (“Log check‑in”, “Start quick win”).
3. **Visible Impact**: Every log creates a measurable change (delta, glow, pulse).
4. **Premium Clarity**: Short, direct language; no jargon; outcomes first.
5. **Calm + Precision**: Elegant micro‑interactions, minimal noise.

---

## Current Gaps (Post UX Prompt Enhancement)

- **No baseline SWOT** until sufficient logs exist → weak first impression.
- **Log Bar is powerful but under-guided** → templates are limited (Evening Audit + Schedule Event only).
- **No immediate “cause → effect” loop** after logging → value feels abstract.
- **Dimension deterioration/improvement** is computed but not surfaced as a primary signal.
- **Micro‑interactions are present but noisy** (small text, hover‑only actions, low contrast) → usability drag.

---

## Core User Flows (Pay‑Worthy Moments)

**Flow A — Baseline Clarity (first session)**  
Profile initialized → Baseline SWOT per dimension → “Log check‑in” CTA → Dimension Pulse update.

**Flow B — Intelligent Logging (daily habit)**  
User taps template → guided input → log ingested → toast “Updated: Health ▲ +2” → SWOT/score updates.

**Flow C — Event Leverage (intent‑to‑action)**  
Upcoming event → prep tasks auto‑generated → progress visible in Focus → confidence increases.

**Flow D — Progress Accountability (weekly)**  
Dimension trend declines → Daily Mission surfaces corrective quick win → track improvement.

---

## Revamp Strategy (Information Architecture)

**Top of Dashboard = “Value Above the Fold”**

1. **Baseline SWOT (per dimension)**
2. **Dimension Pulse** (improving / deteriorating / stable)
3. **Daily Mission** (Today’s Focus + Quick Win)
4. **Execution & Schedule** (Tasks + Events)
5. **Goals & Recommendations**
6. **Life At A Glance** (full SWOT grid, details)

**Log Bar = Primary Action**
- Promote to “command center” with visible templates and guided input.

---

## Phase 0 — Baseline SWOT + Dimension Signals (Data & Prompts)

**Goal**: Show a SWOT per dimension immediately after profile initialization.

**Tasks**
- Add a new generator: `generateBaselineSWOT(profile, goals)`
  - Output a SWOT entry for each dimension.
  - Include `confidence` (“profile‑based”) and `nextAction`.
- Add a new data slice in memory/state: `baselineSwot` and `dimensionSignals`.
- Add a “profile‑only mode” flag to render baseline even without memory logs.

**Prompt Additions**
- Create `BASELINE_SWOT_PROMPT` with strict schema:
  - `dimension`, `strengths[]`, `weaknesses[]`, `opportunities[]`, `threats[]`, `confidence`, `nextAction`.
- Enforce **Grade 7-8 readability** and **1–2 sentence max** per item.

**Acceptance Criteria**
- After onboarding with no logs, baseline SWOT renders with `confidence=profile`.
- No hallucinated data (must reference profile fields).

---

## Phase 1 — Dashboard Layout Rebuild (Premium First Impression)

**Goal**: Make the top of the dashboard feel premium, obvious, and pay‑worthy.

**Components**
- `BaselineSwotPanel` (new): per-dimension SWOT cards with confidence badge.
- `DimensionPulseBar` (new): compact, high‑signal strip showing improvements/deterioration (e.g., “Health ▲ +3, Finance ▼ −2”).
- `DailyMissionCard` (refactor DailyBriefing to align with value focus).

**UX Rules**
- Above the fold must answer: “Where am I right now?” and “What should I do next?”
- Use clear CTAs: “Log a check‑in”, “Schedule event”, “Start quick win”.

**Acceptance Criteria**
- At 375px width, user sees Baseline SWOT + Dimension Pulse + Daily Mission without scrolling.

---

## Phase 2 — Log Bar Revamp (Guided Input Templates)

**Goal**: Make logging effortless and high‑signal.

**Templates to Add**
- `Daily Check‑In` (energy, mood, sleep, highlight, struggle)
- `Expense Log` (amount, category, merchant, reason)
- `Workout` (type, duration, intensity)
- `Relationship Touchpoint` (person, context, feeling)
- `Work Progress` (what moved, blockers)
- `Health Symptom` (symptom, time, severity)
- `Upload Summary` (for files)

**UX Behavior**
- Template chips appear contextually (time‑of‑day + missing data).
- After logging, show a “Dashboard Update” toast with dimension deltas.

**Acceptance Criteria**
- At least 5 recommended template chips appear per session.
- One‑click template insertion works on mobile.

---

## Phase 3 — Feedback Loop: “Log → Dashboard Updates”

**Goal**: Make changes visible immediately so the value is felt.

**Implementation**
- After log ingestion, compute per‑dimension deltas vs previous 7‑day window.
- Show `DimensionPulse` as a transient banner/toast for 3–5 seconds.
- Highlight the affected dimension card with a subtle glow and “Updated” badge.

**Acceptance Criteria**
- Each log triggers a visible feedback signal within 1s of completion.
- Users can see which dimension improved or deteriorated.

---

## Phase 4 — Micro‑Interaction & Accessibility Upgrade

**Tasks**
- Add focus‑visible states on all interactive elements.
- Replace hover‑only actions with mobile‑friendly affordances.
- Increase minimum touch targets to ≥44px.
- Reduce ultra‑small text (9–10px) → at least 12–13px.
- Respect `prefers-reduced-motion`.

**Acceptance Criteria**
- All primary actions are keyboard accessible.
- WCAG AA contrast for key text elements.

---

## Phase 4.5 — Prompt Output Quality Gate (Readability + Relevance)

**Goal**: Ensure AI output is actionable, clear, and premium‑grade.

**Rules**
- Titles ≤ 6 words. Descriptions ≤ 2 sentences.
- Every recommendation must show: **Why** (data‑grounded) + **Next action**.
- Avoid jargon; define technical terms inline if needed.
- Each item must map to a visible UI element (no orphan output).

**Acceptance Criteria**
- 90% of recommendations are “actionable in < 60s to understand”.
- No hallucinated facts in baseline SWOT or daily insights.

---

## Phase 5 — Paid-Value Spotlight

**Goal**: Make premium value obvious.

**UI Enhancements**
- “Premium Intelligence” badge on Daily Mission + Quick Win.
- “Confidence Meter” on baseline SWOT and insights.
- CTA panel: “Unlock deeper coaching” (if applicable to pricing tier).

**Acceptance Criteria**
- Users can identify 2–3 premium‑only benefits within 60 seconds.

---

## Metrics & Success Criteria

- **Activation**: % of new users who log within first session.
- **Value Perception**: Survey prompt “This feels worth paying for” ≥ 70% agree.
- **Retention**: Week 1 retention improves by 15%.
- **Engagement**: Avg logs per week increases by 30%.

---

## Implementation Notes

- Keep `DailyBriefing` but refactor into `DailyMissionCard` with clearer hierarchy.
- Baseline SWOT should fall back to “profile‑only” until enough logs exist.
- Dimension Pulse should be driven by the same scoring logic used in `ScoreStrip`.

---

## QA & Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual pass on 375px, 768px, 1440px.
- Keyboard navigation test + Lighthouse accessibility.

---

## Design Spec Addendum (Aesthetic + Interaction)

**Typography & Hierarchy**
- Minimum body text: 12–13px.
- Headings carry intent (“Your Baseline”, “Your Focus Today”, “Pulse”).

**Micro‑Interaction Principles**
- 150–250ms transitions.
- No layout shift on hover.
- Subtle glow for updates only; no constant pulse noise.

**CTA Language**
- Primary: “Log check‑in”, “Start quick win”, “Add event”.
- Secondary: “See details”, “View plan”.

**Accessibility Must‑Haves**
- Focus‑visible rings for every button.
- Touch targets ≥ 44px.
- Keyboard access for all key flows.
