# AreteLifeOS Dashboard Vision Document

**Version:** 1.0  
**Date:** 2026-04-02  
**Status:** Ready for Design Review  
**Handoff Target:** Google Antigravity / Human Designer

---

## 1. Product Vision

### One-Line Essence

> AreteLifeOS is a personal life operating system that helps users understand themselves, see what matters now, and take the next best step each day.

### The Hook

**Not another dashboard. A living mirror of your life.**

The dashboard is an **addictive, real-time pulse** of all 5 life dimensions. Users should feel:
- "What's my score now?" after every log (like a fitness tracker for your whole life)
- Immediate feedback: did what I just did help or hurt?
- A wise companion who knows them deeply — not a cold analytics tool

### What It Is NOT

- ❌ A to-do list with categories
- ❌ A wellness tracker with streaks
- ❌ A Notion-style database dashboard
- ❌ Generic AI output with templated cards

### What It IS

- ✅ A calm, premium personal sanctuary
- ✅ A trusted guide that speaks with warmth AND tactical clarity
- ✅ A real-time life pulse that updates after every interaction
- ✅ Hyper-personalized to age, location, life season, values

---

## 2. Core Experience Principles

### 2.1 Tone: Balanced Companion

| Moment | Tone |
|--------|------|
| **Greeting / Opening** | Warm, gentle, emotionally aware |
| **Action Steps** | Tactical, clear, specific (with local context) |
| **Closing / Reflection** | Warm, grounding, non-judgmental |

**Example:**
> "Good morning. You've been carrying a lot this week — I see it in your logs.
>
> Today, one meaningful step: **Call Mount Elizabeth Clinic at +65 6735 5000** to schedule that checkup. At 34 in Singapore, you're in a high-pressure phase. Your Health score (78%) is strong, but spiritual drift (31%) often precedes burnout for professionals in your context.
>
> Rest isn't laziness. It's part of the work."

### 2.2 Visual Qualities

| Quality | Description |
|---------|-------------|
| **Calm** | Low cognitive load, generous whitespace, no visual noise |
| **Warm** | Soft color palette, rounded corners, gentle gradients |
| **Premium** | Refined typography, intentional spacing, no clutter |
| **Mobile-First** | Thumb-friendly tap targets, vertical scrolling, single-column |
| **Alive** | Subtle animations on score updates (↑↓ arrows, color transitions) |

### 2.3 Addictive Loop

```
User logs something
    ↓
AI processes (100-500ms)
    ↓
Dimension scores recalculate in REAL-TIME
    ↓
User sees impact immediately ("My Health score went up 3%!")
    ↓
User wants to check again → Hook established
```

---

## 3. Dashboard Structure

### 3.1 Information Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Greeting + Contextual Orientation                  │
│  "Good evening. You've carried a lot today."                │
├─────────────────────────────────────────────────────────────┤
│  SECTION 1: Life Pulse (The Hook)                           │
│  - 5 dimension bars with real-time scores                   │
│  - ↑↓ arrows showing change direction                       │
│  - Overall Balance score (one number to chase)              │
├─────────────────────────────────────────────────────────────┤
│  SECTION 2: Deep Dive — Lowest Dimension (SWOT Chips)       │
│  - Auto-shows the dimension needing most attention          │
│  - 4 SWOT chips in 2x2 grid                                 │
│  - Always-Do / Always-Watch pills at bottom                 │
├─────────────────────────────────────────────────────────────┤
│  SECTION 3: What Matters Most Today                         │
│  - 1-2 priority cards with why + first step                 │
├─────────────────────────────────────────────────────────────┤
│  SECTION 4: One Reflection                                  │
│  - Grounding thought or question                            │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Section Details

#### Section 1: Life Pulse

**Purpose:** The addictive hook — users check this like a fitness tracker.

**Content:**
```
Health        ████████░░  78%  ↑ +3% today
Finance       █████░░░░░  54%  ↓ -2% this week
Relationships ████████░░  82%  ↑ +5% today
Spiritual     ███░░░░░░░  31%  ↓ -8% this month
Personal      ██████░░░░  61%  → steady

Overall Balance: 61% (🟡 "Some areas need care")
```

**Visual treatment:**
- Horizontal progress bars with gradient fill (red → yellow → green)
- Color-coded dots: 🟢 (70-100), 🟡 (40-69), 🔴 (0-39)
- Animated ↑↓ arrows on score change
- Clicking a dimension expands its SWOT panel

**Update frequency:** Real-time (debounced 30s to batch multiple logs)

---

#### Section 2: Deep Dive — SWOT Chips

**Purpose:** Show why a dimension scored the way it did — like a wise friend who knows you.

**Auto-focus:** Lowest-scoring dimension shown first (expandable to see others).

**Layout (2x2 grid):**
```
┌──────────────────────────────────────────────────────────────┐
│  🔴 Spiritual — 31% (Needs Attention)                        │
├──────────────────────────────────────────────────────────────┤
│  ✅ Strengths              ⚠️ Weaknesses                     │
│  • Morning prayer 4/7 days • No practice in 5 days           │
│  • Core values clear       • Values mentioned 0x recently    │
│                                                              │
│  💡 Opportunities          🚨 Threats                        │
│  • 10min reflection = +12% • Spiritual drift → burnout       │
│  • Reconnect w/ community  • "Lack of meaning" 3x this month │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│  ALWAYS-DO: Morning prayer — 5min                            │
│  ALWAYS-WATCH: Isolation from community                      │
└──────────────────────────────────────────────────────────────┘
```

**Chip design:**
- Each SWOT quadrant is a card with icon header
- Bullet points are short (1 line each)
- "Always-Do/Watch" are pill badges at bottom

---

#### Section 3: What Matters Most Today

**Purpose:** Translate insight into action — 1-2 priorities max.

**Format per priority:**
```
┌──────────────────────────────────────────────────────────────┐
│  🎯 [Dimension] — Priority Title                             │
│                                                              │
│  Why it matters: Specific reason citing user's data          │
│                                                              │
│  First step: One small action to start                       │
│  Example: "Call Mount Elizabeth Clinic at +65 6735 5000"     │
└──────────────────────────────────────────────────────────────┘
```

**Personalization example:**
> 🎯 Health — Protect Your Momentum
>
> Why: Your 25min runs are paying off (Health ↑78%). Don't lose this.
>
> First step: Evening walk 15min — you said running felt great today.

---

#### Section 4: One Reflection

**Purpose:** End with warmth — grounding, not guilt.

**Examples:**
- "You've been action-heavy this week. Rest isn't laziness — it's part of the work."
- "Small steps compound. You're doing better than you think."
- "What gave you energy today? Do more of that."

---

## 4. Life Dimension Scoring Model

### 4.1 The 5 Dimensions

| Dimension | What It Measures | Key Signals |
|-----------|------------------|-------------|
| **Health** | Physical wellbeing, energy, activity | Sleep, exercise, conditions, mood |
| **Finance** | Money stress, budget adherence, savings | Income, spending, savings rate |
| **Relationships** | Connection quality, social energy | Partner time, friend contact, goals |
| **Spiritual** | Meaning, values alignment, practice | Prayer/meditation, values referenced |
| **Personal** | Career, growth, life direction | Job satisfaction, skill building |

### 4.2 Score Calculation

```
Dimension Score (0-100) =
  (Profile Completeness × 0.30) +
  (Recent Signal Quality × 0.30) +
  (Task Completion Rate × 0.20) +
  (Value Alignment Score × 0.20)
```

**Profile Completeness:** % of dimension-specific profile fields filled

**Recent Signal Quality:** Sentiment and frequency of logs in past 7 days
- Positive logs (exercise completed, wins) → score up
- Negative logs (stress, struggles) → score down

**Task Completion Rate:** % of dimension-related tasks completed

**Value Alignment:** AI-calculated alignment between logs and stated values

### 4.3 Score Change Triggers

| Event | Score Impact |
|-------|--------------|
| User logs a win (e.g., "completed 5km run") | +2-5% to Health |
| User logs struggle (e.g., "stressed about money") | -3-8% to Finance |
| User completes a task | +1-3% to dimension |
| User ignores "Always-Do" for 5+ days | -5-10% to dimension |
| New "Always-Watch" triggered | -5% to dimension |

---

## 5. Onboarding: Full Wizard (28 Questions)

### 5.1 Design Goal

Collect all 28 questions in one session, but make it feel **fast, warm, and progress-driven** — not a medical intake form.

### 5.2 Wizard Structure

**Progress indicator:** 5 dimension tabs at top, fill animation as user completes each section.

```
┌──────────────────────────────────────────────────────────────┐
│  Help Arete Understand You                                   │
│  "A few details help me give you better guidance"            │
│                                                              │
│  [🟢 Health] [🟡 Finance] [⚪ Relationships] [⚪ Spiritual] [⚪ Personal] │
│                                                              │
│  ────────────────────────────────────────────────────────    │
│  Progress: ████████░░░░░░░░░░░░ 40%                         │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Question Flow (28 Questions Total)

#### Section 1: Identity (3 questions)
1. What's your name?
2. Where do you live? (City, Country)
3. What's your age? (or decade: 20s/30s/40s/50s+)

#### Section 2: Health (5 questions)
4. What time do you usually wake up?
5. What time do you usually go to bed?
6. How would you describe your activity level? (Sedentary / Light / Moderate / Active)
7. Do you have any health conditions I should know about?
8. What does a good day of self-care look like for you?

#### Section 3: Finance (5 questions)
9. What's your monthly income range? (<$3k / $3-5k / $5-10k / $10k+)
10. What are your typical monthly fixed costs? (rent, loans, etc.)
11. What are your typical monthly variable costs? (food, entertainment, etc.)
12. What's your current savings rate goal? (10% / 20% / 30%+)
13. What's your biggest money stress right now?

#### Section 4: Relationships (5 questions)
14. What's your relationship status? (Single / Dating / Committed / Married)
15. Do you live alone, with partner, with family, or with roommates?
16. How often do you want to connect with important people? (Daily / Weekly / Monthly)
17. What's your social energy like? (Introvert / Ambivert / Extrovert)
18. What's one relationship goal you have?

#### Section 5: Spiritual (5 questions)
19. Do you have a spiritual or religious practice? (Yes/No — describe if yes)
20. What core values guide your decisions? (Select 3-5 from list + custom)
21. How often do you want to engage in spiritual practices? (Daily / Weekly / Occasionally)
22. What gives your life meaning right now?
23. What does "living well" mean to you?

#### Section 6: Personal (5 questions)
24. What's your current role at work? (or "Not currently employed")
25. What company or industry are you in?
26. What are your main interests or hobbies?
27. What's one skill you're working on building?
28. What's your biggest life challenge right now?

### 5.4 Microcopy Guidelines

**Instead of:** "Enter your wake time"  
**Use:** "When do you usually wake up?"

**Instead of:** "Complete this field"  
**Use:** "This helps me personalize your guidance"

**Instead of:** "Required"  
**Use:** "Recommended — you can skip if you prefer"

### 5.5 Post-Onboarding: Initial Analysis

After 28 questions, AI generates:

```
┌──────────────────────────────────────────────────────────────┐
│  Your Life Snapshot                                          │
│                                                              │
│  "At [age] in [location], you're navigating [life phase].   │
│  Here's where you stand today:"                              │
│                                                              │
│  [5 dimension scores with initial baseline]                  │
│                                                              │
│  Early Insights:                                             │
│  • Your Health foundation is strong (active lifestyle)       │
│  • Spiritual dimension needs building (no current practice)  │
│  • Finance: Your 23% savings rate is solid for your income  │
│                                                              │
│  [Begin My Journey Button]                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. AI Personalization Rules

### 6.1 Context-Aware Output

The AI should reference:

| Context | Example Output |
|---------|----------------|
| **Age** | "At 34, your metabolism is still resilient — but recovery matters more than in your 20s." |
| **Location** | "Singapore's humidity may affect your sleep quality. Consider..." |
| **Life Phase** | "You're in a high-pressure career build phase. This is normal, but watch for..." |
| **Values** | "This aligns with your value of [family] — you mentioned wanting more time with them." |
| **Struggles** | "You've reported 'lack of meaning' 3x this month. Let's address this gently." |

### 6.2 Hyper-Local Examples

When giving action steps, include real local context:

| Dimension | Example |
|-----------|---------|
| **Health** | "Call Mount Elizabeth Clinic at +65 6735 5000" |
| **Finance** | "Check your DBS NAV Planner for cashflow visibility" |
| **Relationships** | "Book a table at [local restaurant] for a date night" |
| **Spiritual** | "Visit [local temple/church] this weekend" |
| **Personal** | "Sign up for [local course/event] to build that skill" |

---

## 7. Visual Design Guidelines

### 7.1 Color System

| Use Case | Palette |
|----------|---------|
| **Health** | Green gradient: #22c55e → #4ade80 |
| **Finance** | Blue gradient: #3b82f6 → #60a5fa |
| **Relationships** | Purple gradient: #a855f7 → #c084fc |
| **Spiritual** | Amber gradient: #f59e0b → #fbbf24 |
| **Personal** | Rose gradient: #f43f5e → #fb7185 |
| **Score High (70-100)** | #22c55e (green) |
| **Score Medium (40-69)** | #fbbf24 (amber) |
| **Score Low (0-39)** | #ef4444 (red) |
| **Background** | Dark: #1a1a2e → #16213e gradient |
| **Cards** | rgba(255, 255, 255, 0.05-0.10) |
| **Text Primary** | #ffffff |
| **Text Secondary** | #a0a0a0 |
| **Text Muted** | #666666 |

### 7.2 Typography

| Element | Font Size | Weight |
|---------|-----------|--------|
| Page Title | 24px | 600 |
| Section Header | 18px | 600 |
| Card Title | 14px | 600 |
| Body Text | 13px | 400 |
| Small Text | 11px | 400 |
| Micro Text | 9px | 500 |

### 7.3 Spacing Scale

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 48px |

### 7.4 Corner Radius

| Element | Radius |
|---------|--------|
| Cards | 12px |
| Small Cards / Chips | 8px |
| Pills / Badges | 16px (fully rounded) |
| Buttons | 8px |

### 7.5 Animations

| Trigger | Animation |
|---------|-----------|
| Score change | Smooth bar fill (300ms ease-out) |
| ↑ Arrow | Slide up + fade in (200ms) |
| ↓ Arrow | Slide down + fade in (200ms) |
| Card expand | Height transition (250ms ease) |
| Button hover | Scale 1.02 (150ms) |

---

## 8. Interaction States

### 8.1 Dimension Bar Click

**Default:** Shows bar + score + change indicator  
**Clicked:** Expands SWOT panel for that dimension with smooth height animation

### 8.2 SWOT Chip Hover

**Desktop:** Slight lift (transform: translateY(-2px)), shadow increase  
**Mobile:** Tap to expand full details

### 8.3 Score Update

When a score changes:
1. Bar animates to new width (300ms)
2. ↑ or ↓ arrow fades in next to score (color: green/red)
3. Change percentage shown (+3%, -2%, etc.)
4. After 3s, arrow fades out, score remains

---

## 9. Mobile Considerations

### 9.1 Breakpoints

| Screen | Layout |
|--------|--------|
| < 640px | Single column, stacked sections |
| 640-1024px | 2-column SWOT grid |
| > 1024px | Max-width 800px container, centered |

### 9.2 Mobile-First Choices

- SWOT chips: Stack 2x2 on mobile, expand to 4-acrow on desktop
- Dimension bars: Full width, thumb-friendly tap targets (44px min height)
- Priority cards: Single column, full-width buttons
- Wizard: One question per screen on mobile, multi-question on desktop

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users | 70%+ of onboarded users return daily |
| Logs per Day | 3+ average |
| Dashboard Dwell Time | 2+ minutes per session |
| Dimension Check Rate | 80%+ of users tap to expand at least 1 dimension |
| Onboarding Completion | 60%+ finish all 28 questions |
| Profile Completeness | 80%+ of users have 70%+ profile filled after week 1 |

---

## 11. Open Questions for Designer

1. **Life Pulse visualization:** Should the 5 bars be stacked vertically, or arranged radially around a central "Overall Balance" score?

2. **SWOT chip density:** Is 4 chips (one per SWOT quadrant) too much for mobile? Should we show top 2 and "See all" expand?

3. **Onboarding progress:** Should the progress indicator show % complete, or "X of 28 questions"?

4. **Empty states:** What do we show for a new user with no data yet? (Placeholder scores? "Get started" CTA?)

5. **Dark mode:** This spec assumes dark-first. Should light mode be designed too, or is dark-only acceptable for MVP?

---

## 12. Handoff Checklist

- [ ] Designer reviews this vision doc
- [ ] Designer creates high-fidelity mockups (mobile + desktop)
- [ ] Mockups include: Life Pulse, SWOT chips, Priority cards, Reflection
- [ ] Onboarding wizard screens designed (all 6 sections)
- [ ] Interaction states documented (hover, click, update animations)
- [ ] Empty states designed
- [ ] Color system finalized (design tokens exported)
- [ ] Typography scale confirmed
- [ ] Developer handoff: Figma → React/Tailwind implementation

---

## 13. Appendix: Example Outputs

### 13.1 Full Dashboard Copy Example

```
Good evening, Jonathan

"You've carried a lot this week. One dimension needs gentle attention."

════════════════════════════════════════════════════════════════

⚡ YOUR LIFE PULSE — Updated 2m ago

🟢 Health        ████████░░  78%  ↑ +3% today
🟡 Finance       █████░░░░░  54%  ↓ -2% this week
🟢 Relationships ████████░░  82%  ↑ +5% today
🔴 Spiritual     ███░░░░░░░  31%  ↓ -8% this month
🟡 Personal      ██████░░░░  61%  → steady

Overall Balance: 61% (🟡 "Some areas need care")

════════════════════════════════════════════════════════════════

📊 DEEP DIVE: Spiritual (31% — Needs Attention)

✅ Strengths               ⚠️ Weaknesses
• Morning prayer 4/7 days  • No practice in 5 days
• Core values are clear    • Values mentioned 0x in recent logs

💡 Opportunities           🚨 Threats
• 10min reflection = +12%  • Spiritual drift often precedes burnout
• Reconnect w/ community   • You've said "lack of meaning" 3x

ALWAYS-DO: Morning prayer — 5min
ALWAYS-WATCH: Isolation from community

════════════════════════════════════════════════════════════════

🎯 What Matters Most Today

1. 🟢 Health — Protect Your Momentum
   Why: Your 25min runs are paying off. Don't lose this.
   First step: Evening walk 15min — you said running felt great.

2. 🔴 Spiritual — Gentle Reconnection
   Why: 5 days without practice is your longest gap in 2 months.
   First step: 5min reflection: "What gave meaning today?"

════════════════════════════════════════════════════════════════

💡 One Reflection

"You've been action-heavy this week. Rest isn't laziness —
it's part of the work."
```

---

**END OF VISION DOCUMENT**

---

**Next Steps:**
1. Designer reviews this document
2. Designer creates high-fidelity mockups
3. Developer implements in React + Tailwind
4. User tests on Preview environment
5. Iterate based on feedback
