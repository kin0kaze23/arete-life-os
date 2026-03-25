# Glance OS: Product Strategy

> **Version 4.1.0** | Last Updated: 2026-01-31 (Automation-Ready)

---

## 0. Context Analysis (Automation Preparation)

### Codebase Review

**Files Reviewed**: `.agent/core/README.md`, `docs/ARCHITECTURE.md`, `.agent/core/CURRENT_STATUS.md`, `.agent/core/LEARNINGS.md`, `dashboard/DashboardView.tsx`

**Current State**:

- **Architecture**: useAura hook (2146 lines) + IndexedDB vault + Daily AI batch (Flash → Pro)
- **Existing Dashboard**: 3-column layout (Focus, Schedule, Life Status)
- **Design System**: Glassmorphism dark theme (`shared/SharedUI.tsx`)

### Impact Assessment

**Modified Files**: `dashboard/DashboardView.tsx`, `core/useAura.ts`, `data/types.ts`, `ai/prompts.ts`  
**New Files**: Dashboard components (DailyBriefing, SwotGrid, GoalsPanel, etc.) - determined by digester  
**Patterns**: Use debounced refreshAura, integrate into daily batch, follow glassmorphism design

### Risks & Mitigation

1. **useAura Complexity** (HIGH): Extract utils to `dimensionUtils.ts`, `swotUtils.ts`
2. **Performance** (MEDIUM): Use React.memo, useMemo, daily batch (not per-render)
3. **Schema Migration** (MEDIUM): Review types, write migration if needed
4. **AI Context Bloat** (LOW): Keep SWOT prompts concise, use Flash model

### Learnings Applied

From `.agent/core/LEARNINGS.md`: Debounced refreshAura, backdrop-filter for cards, lists > cards, Promise.allSettled, ID filtering, IndexedDB transactions, category-filtered memory, data-testid for E2E

---

## 1. Vision & Value Proposition

### Vision

> **Your life at a glance—see clearly, act decisively.**

Glance OS is an **intelligent life dashboard** that synthesizes your world—events, goals, reflections—into actionable clarity. Users open it daily to **understand their life balance** and **know exactly what to do next**.

### The Problem

People manage their lives across fragmented tools—separate apps for health, finance, tasks, goals, and relationships. No single system:

- Understands the **whole person** (profile, values, constraints)
- Generates **personalized, grounded** recommendations (not generic)
- Maintains a **knowledge graph** of life facts with confidence tracking
- Encrypts everything **client-side** with zero-knowledge architecture
- Provides a **dashboard view** that surfaces what matters today

### The Solution

A personal **Life Operating System** that:

1. **Knows you deeply** — builds a knowledge graph from every signal you share
2. **Shows your life at a glance** — 5 dimensions + SWOT + actionable tasks
3. **Tells you what to do next** — AI-generated tasks linked to goals and events
4. **Respects your values** — grounds all advice in your Rule of Life
5. **Protects your data** — AES-256-GCM encryption, zero-knowledge

### Target User

Intentional individuals who want a structured, AI-assisted system to optimize their daily life across multiple domains—without the friction of managing 10+ apps.

---

## 2. The 5 Life Dimensions

| Dimension         | Icon | Core Question                    | Sub-areas                              |
| ----------------- | ---- | -------------------------------- | -------------------------------------- |
| **Health**        | ❤️   | "Am I taking care of my body?"   | Sleep, exercise, nutrition, conditions |
| **Finance**       | 💰   | "Am I financially secure?"       | Income, expenses, savings, investments |
| **Relationships** | 👥   | "Am I nurturing my connections?" | Family, friends, colleagues, community |
| **Spiritual**     | 🙏   | "Am I grounded in purpose?"      | Devotion, values, worldview, practice  |
| **Personal**      | 🎨   | "Am I growing as a person?"      | Work, learning, hobbies, energy        |

---

## 3. Scoring System

### 4-Factor Wellness Score

| Factor          | Weight | What It Measures                           |
| --------------- | ------ | ------------------------------------------ |
| **Consistency** | 30%    | Regular engagement (days active in last 7) |
| **Quality**     | 30%    | Positive vs negative signals in logs       |
| **Balance**     | 20%    | Coverage across sub-areas within dimension |
| **Progress**    | 20%    | Movement toward active goals               |

### Optimal Zones

| Score   | Status   | Badge | Visual          |
| ------- | -------- | ----- | --------------- |
| 0-40%   | Critical | 🔴    | Red gradient    |
| 41-60%  | At Risk  | 🟠    | Orange gradient |
| 61-80%  | Healthy  | 🟢    | Green gradient  |
| 81-100% | Thriving | 💎    | Purple gradient |

**61-80% = "Healthy"** prevents perfectionism burnout.

### Trend Indicators

| Trend     | Symbol | Meaning                            |
| --------- | ------ | ---------------------------------- |
| Improving | ↑      | Score increased 5%+ in last 7 days |
| Stable    | →      | Score within ±5%                   |
| Declining | ↓      | Score decreased 5%+ in last 7 days |

---

## 4. Dashboard Layout

### Information Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DAILY BRIEFING (Fixed at top, never collapses)               │
├─────────────────────────────────────────────────────────────────┤
│ 2. LIFE AT A GLANCE (SWOT Grid) [Collapsible]                   │
├─────────────────────────────────────────────────────────────────┤
│ 3. GOALS & RECOMMENDATIONS [Collapsible]                        │
├─────────────────────────────────────────────────────────────────┤
│ 4. TASKS & EVENTS (Side-by-side columns)                        │
├─────────────────────────────────────────────────────────────────┤
│ 5. LOG BAR (Fixed at bottom, always visible)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Section Details

#### Daily Briefing

- **Life Balance Strip**: All 5 dimensions with score + badge + trend (↑↓→)
- **Today's Focus**: 3 prioritized items (declining dimensions → unprepped events → overdue goals)
- **Quick Win**: One high-impact action achievable in <30 min with CTA button

#### SWOT Grid (All visible at once)

| Section           | Content Rule                | Example                              |
| ----------------- | --------------------------- | ------------------------------------ |
| **Strengths**     | Positive patterns with data | "Gym 3x/week (consistent)"           |
| **Concerns**      | Gaps + consequence          | "No exercise 5 days → Score ↓8%"     |
| **Opportunities** | Time-bound windows          | "Tomorrow 7am free → schedule jog"   |
| **Risks**         | If-then warnings            | "Late fee $35 if CC not paid by Fri" |

#### Goals Panel

- **Active Goals**: Progress bar + Why + How
- **AI Suggestions**: Evidence-based new goals with Accept/Modify/Dismiss

#### Tasks & Events

| Element           | Purpose                                      |
| ----------------- | -------------------------------------------- |
| **Urgency Badge** | 🔴 Critical / 🟠 Important / 🟢 Nice-to-have |
| **Source**        | Where task came from (Event/Goal/Alert)      |
| **Why**           | Personal reason this matters NOW             |
| **How**           | Specific action steps                        |

---

## 5. Key Features

### Input System (Log Bar)

- Universal text input (sticky bottom)
- 6 quick templates: Event, Workout, Expense, Social, Devotion, Sleep
- Voice input support
- Semantic intent classification

### AI-Powered Analysis

| Capability           | Description                                |
| -------------------- | ------------------------------------------ |
| Input processing     | Natural language → structured IntakeResult |
| Task generation      | Personalized daily tasks with why/how      |
| Blind spot detection | Risks the user may be missing              |
| Event preparation    | Countdown + prep recommendations           |
| Goal suggestions     | Evidence-based new goals                   |

### Knowledge Graph

- Memory items with category, sentiment, confidence
- Claims with lifecycle (PROPOSED → COMMITTED → ARCHIVED)
- Confidence scoring based on corroboration and source type
- Conflict detection and resolution

### Encrypted Vault

- AES-256-GCM encryption for all data
- PBKDF2 key derivation (100K iterations)
- Auto-lock after 15 min inactivity
- Rate-limited unlock (5 attempts / 15-min lockout)

---

## 6. UI/UX Design Guidelines

### Visual Design

```css
/* Backgrounds */
--bg-primary: #0a0a0f; /* Deep black */
--bg-card: #14141a; /* Card surface */
--bg-elevated: #1a1a24; /* Hover state */

/* Text */
--text-primary: #ffffff;
--text-secondary: #9ca3af;
--text-muted: #6b7280;

/* Status Colors */
--status-critical: linear-gradient(135deg, #ef4444, #dc2626);
--status-at-risk: linear-gradient(135deg, #f97316, #ea580c);
--status-healthy: linear-gradient(135deg, #22c55e, #16a34a);
--status-thriving: linear-gradient(135deg, #8b5cf6, #6d28d9);
```

### Typography

- **Font**: Inter (headings + body), JetBrains Mono (code/numbers)
- **Sizes**: 0.75rem (meta) → 1.5rem (headers)

### Glassmorphism Cards

```css
.card {
  background: rgba(20, 20, 26, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}
```

### Micro-Interactions

| Trigger         | Animation                                         |
| --------------- | ------------------------------------------------- |
| Score change    | Number counter (0.5s), badge pulse (0.3s)         |
| Task completion | Checkmark draw, confetti burst, progress bar fill |
| Card hover      | translateY(-2px), shadow increase                 |
| Collapse/Expand | Smooth height transition (0.3s)                   |

### Responsive Breakpoints

| Breakpoint          | Layout                            |
| ------------------- | --------------------------------- |
| Desktop (>1200px)   | Full layout                       |
| Tablet (768-1199px) | Tasks & Events stack              |
| Mobile (<768px)     | Single column, sections collapsed |

---

## 7. Architecture

### Technology Stack

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Frontend      | React 19, TypeScript, Tailwind CSS       |
| Build         | Vite                                     |
| AI (Primary)  | Groq (llama-3.1-8b-instant)              |
| AI (Escalate) | Groq (llama-3.3-70b-versatile)           |
| Encryption    | Web Crypto API (AES-256-GCM + PBKDF2)    |
| Storage       | localStorage (vault) + IndexedDB (files) |
| Deployment    | Vercel                                   |

### Data Flow

```
User Input (LogBar)
    ↓
LogRouter (classify intent)
    ↓
POST /api/gemini (processInput)
    ↓
IntakeResult → Auto-commit claims + memory
    ↓
debouncedRefreshAura() (500ms)
    ↓
Promise.allSettled([
  generateTasks(),
  generateInsights(),
  generateBlindSpots(),
  generateDeepTasks()
])
    ↓
Dashboard renders reactive state
```

### Encryption Architecture

- **Vault**: PBKDF2 → CryptoKey → AES-256-GCM → localStorage
- **Files**: CryptoKey → AES-256-GCM → IndexedDB
- **Zero-knowledge**: Server never sees decrypted data

---

## 8. Cost Optimization

### AI Model Strategy

| Use Case         | Model         | Cost              |
| ---------------- | ------------- | ----------------- |
| Input processing | Llama 3.1 8B  | < $0.10/1M tokens |
| Deep analysis    | Llama 3.3 70B | ~$0.70/1M tokens  |
| Fallback         | Llama 3.3 70B | Same              |

### Optimization Techniques

1. **Flash for intake**: Use cheaper Flash model for log processing
2. **Parallel generation**: All 4 generators run simultaneously (3x faster)
3. **Debounced refresh**: 500ms debounce prevents API spam
4. **Memory context limits**: 30-50 items max per category
5. **Caching**: Store AI results, regenerate only on data change

### Estimated Monthly Cost (Active User)

| Activity          | Calls/Day | Tokens/Call | Monthly Cost          |
| ----------------- | --------- | ----------- | --------------------- |
| Log processing    | 10        | 2K          | $0.10                 |
| Dashboard refresh | 5         | 5K          | $0.15                 |
| Oracle chat       | 3         | 3K          | $0.02                 |
| **Total**         | —         | —           | **~$0.27/user/month** |

---

## 9. Security

### Core Security Properties

| Property             | Implementation                             |
| -------------------- | ------------------------------------------ |
| Zero-knowledge       | Server never receives decrypted vault data |
| Non-extractable keys | CryptoKey cannot be serialized/exported    |
| Rate limiting        | 5 failed attempts → 15-min lockout         |
| Auto-lock            | 15 min inactivity → vault locked           |
| Encrypted storage    | All data encrypted before write            |
| Audit trail          | Every mutation logged with ActionType      |
| No client API keys   | Keys exist only in Vercel env vars         |

### CSP Headers

Configured in `vercel.json` to prevent XSS and unauthorized scripts.

---

## 10. Implementation Priority

| Phase  | Features                                        | Goal            |
| ------ | ----------------------------------------------- | --------------- |
| **P0** | Daily Briefing, Score Strip, SWOT Grid, Log Bar | Core dashboard  |
| **P1** | Goals Panel, Task-Goal linking, Why/How display | Behavior change |
| **P2** | Events Panel, Prep Wizard, Task animations      | Event readiness |
| **P3** | Collapsibles, Persistence, Mobile responsive    | Polish          |

---

## 11. Success Metrics

| Metric                    | Target                  |
| ------------------------- | ----------------------- |
| Daily Active Usage        | 80%+ days/week          |
| Signal Ingestion          | 5+ logs/day             |
| Task Completion           | 60%+ of generated tasks |
| Recommendation Acceptance | 40%+ kept               |
| Profile Completeness      | 80%+ fields filled      |

---

## 12. Future Roadmap

### Phase 2: Cloud Sync

- Supabase authentication
- Encrypted cloud backup
- Cross-device sync

### Phase 3: Integrations

- Calendar sync (Google, Outlook)
- Wearable data (health metrics)
- Mobile-native app

---

> **This document is the source of truth for Glance OS product direction.**
