# PRD — Areté Life OS (AURA)

Version: v3.2 (Local migration from Google AI Studio)  
Owner: Jonathan Nugroho  
Timezone: Asia/Singapore  
Last updated: 2026-01-24  
Status: Active build; local Vite repo is source of truth

---

## 1) Product summary

Areté Life OS ("AURA") is a local-first personal operating system dedicated to excellence. It internalizes life signals (text + files), extracts verifiable facts into a Knowledge Graph, and produces a daily mission plan, strategic recommendations, proactive insights, and blindspot risk alerts. It also includes an Oracle chat interface and a live Voice Advisor for hands-free guidance.

**Core promise:** Make the next faithful, high-impact step obvious, explainable, and low-friction—without losing trust or calm.

---

## 2) Current implementation snapshot (repo reality)

- **Architecture:** React + Vite + Tailwind CDN.
- **AI:** Google Gemini client-side (text + search grounding + audio).
- **Storage:** localStorage only; no auth, no cloud sync, no encryption at rest.
- **Modes:** multi-profile “family space” inside a single browser; privacy toggles per domain.
- **Primary modules in navigation:** Command Center (Dashboard), Vault (Identity + Knowledge Graph), Life Stream, Neural Oracle (Chat), Settings.
- **Operational surfaces:** Log Bar ingestion, Verification Sheet, Command Palette, Voice Advisor.

---

## 3) Goals & success criteria

### Outcomes (user)

- “I know what to do next.”
- “I trust what the system believes and why.”
- “I can plan today and the near future without stress.”
- “My data stays local and under my control.”

### Product success

- Daily mission plan generated and completed without overwhelm
- High approval rate on extracted facts/updates
- Low conflict rate in Knowledge Graph
- Consistent usage of Log Bar + Verification flow

---

## 4) Product principles (non‑negotiables)

1. **Trust before automation** (verification sheet, evidence, confidence)
2. **Local-first sovereignty** (storage stays in device by default)
3. **Progressive disclosure** (overview first, details on demand)
4. **High signal density** (small outputs, deep rationale)
5. **Values alignment** (Rule of Life informs ranking & plans)
6. **Human-in-the-loop** (no silent profile mutations)

---

## 5) Target users

### Primary

- A single high-agency operator seeking a structured, AI-augmented life OS.

### Secondary

- Household / family members managed within a single local browser space.

---

## 6) Core loops (system behavior)

1. **Signal → Internalize** (Log Bar text/files)
2. **Verify → Commit** (Verification Sheet for facts + updates)
3. **Store → Recall** (Knowledge Graph + Life Stream)
4. **Plan → Execute** (Daily Mission + tasks + recommendations)
5. **Reflect → Improve** (Oracle chat + insights + blindspots)

---

## 7) Feature scope & requirements (v3.2)

### 7.1 Onboarding + Identity Vault

**Purpose:** Calibrate personal profile + Rule of Life for personalization.
**Requirements**

- 7‑step onboarding (Identity, Personal, Health, Finance, Relationship, Spiritual, Activation)
- Vault editor for ongoing updates
- Profile completion tracking (ring + freshness indicators)

### 7.2 Command Center (Dashboard)

**Purpose:** Tactical mission control.
**Includes**

- Daily Mission timeline (time-blocked tasks)
- Life Pillars (Health/Finance/Relationships/Spiritual) vitality chips
- Neural Resonance (profile completion coherence)
- Goals overview
- Blindspot Radar (risk signals)
- Proactive Insights (dismissable)
- “Plan My Day” action

### 7.3 Log Bar (Signal ingestion)

**Purpose:** Fast capture + command entry.
**Inputs**

- Text + file attachments (PDF/image/other base64)
- Command shortcuts: `/ask`, `/sync`, `/export`, `/reset`
  **Rules**
- Offline detection and clear error states
- File size cap (~15MB per file)

### 7.4 Verification Sheet

**Purpose:** Human-in-the-loop trust layer.
**Behavior**

- Shows extracted facts + proposed profile mutations
- Approve/reject per item
- Commit applies claims + updates audit log

### 7.5 Knowledge Graph (Memory Vault)

**Purpose:** Verifiable truth store.
**Requirements**

- Search + filters by category/status
- Claim cards with confidence, owner, timestamp
- Evidence preview for sources
- Status workflow: PROPOSED → COMMITTED / ARCHIVED; CONFLICT handling
- Inline edit + delete

### 7.6 Life Stream / Chronology

**Purpose:** Timeline of past and future events.
**Current**

- Life Stream view shows chronological memory + manual events
  **In repo (available but not wired as default)**
- Full Timeline view with upcoming filters, manual event CRUD, prep‑plan generation

### 7.7 Neural Oracle (Chat)

**Purpose:** Ask questions over your profile + memory history.
**Features**

- Markdown responses
- Grounding sources (Gemini search)
- Suggestion starters

### 7.8 Voice Advisor

**Purpose:** Live audio advisory session.
**Requirements**

- Microphone permission
- Real‑time audio streaming via Gemini live API
- Visual speaking state + error recovery

### 7.9 Recommendations + Tasks

**Purpose:** High‑fidelity tactical plans.
**Requirements**

- Recommendations with SOP steps, DoD, inputs, risks, rationale
- Task objects with priority, category, methodology, time blocks
- Daily mission execution tracking

### 7.10 Blindspot Radar

**Purpose:** Risk surfacing across life domains.
**Requirements**

- Severity (low/med/high), confidence badge, actions
- Explainability linked to memory/context

### 7.11 Family Space (multi‑profile)

**Purpose:** Local multi-user management with privacy controls.
**Requirements**

- Add/switch members
- Domain privacy toggles for finance/health/relationships/spiritual
- Ownership tags on claims/tasks

### 7.12 Command Palette

**Purpose:** Keyboard navigation + system actions.
**Requirements**

- Cmd/Ctrl+K
- Jump to modules + system actions (sync/export/reset)

### 7.13 Settings

**Purpose:** Operational configuration.
**Includes**

- Rule of Life task preferences
- Theme toggle
- Storage usage meter
- Export/Import hooks (stubs in current code)
- Danger zone (factory reset)

### 7.14 Audit Log (available in repo)

**Purpose:** Immutable action history.
**Current**

- Audit log model + UI view exists; not wired to navigation by default.

---

## 8) Data model (minimum viable)

- **UserProfile** (identify/personal/health/finances/relationship/spiritual + privacy settings)
- **RuleOfLife** (season, values/roles, rhythm, non‑negotiables, task prefs)
- **FamilySpace** (members + shared resources)
- **Source** (file metadata + base64)
- **MemoryItem** (raw content + extraction metadata)
- **Claim** (fact/inference, confidence, status, owner)
- **DailyTask** (methodology, DoD, time blocks, category, priority)
- **Recommendation** (rationale, steps, risks, DoD, status)
- **BlindSpot** (signal, why, severity, actions)
- **ProactiveInsight** (title, description, feedback)
- **TimelineEvent** (manual or derived)
- **AuditLogEntry** (immutable system events)

---

## 9) AI stack & prompts

- **Internalization:** Gemini 3 Flash (structured JSON output)
- **Oracle Chat:** Gemini 3 Pro (search grounding)
- **Daily Plan:** Gemini 3 Flash (time‑blocked tasks)
- **Insights/Blindspots:** Gemini 3 Pro
- **Event Prep:** Gemini 3 Pro + Google Search
- **Voice Advisor:** Gemini 2.5 Flash Native Audio (live)
- **Prompts:** default templates in `DEFAULT_PROMPTS`, editable via Prompt Management view (not wired)

---

## 10) Security & privacy (current vs target)

**Current**

- Local storage only (browser)
- API key runs client-side
- No encryption at rest
- No auth, no multi-device sync

**Target**

- Optional server proxy for keys
- Encrypted local storage (IndexedDB + WebCrypto)
- Cloud sync opt‑in

---

## 11) Non‑goals

- Autonomous actions without explicit confirmation
- Medical/financial decision automation
- Multi‑device sync (until backend exists)
- Enterprise or multi‑tenant SaaS

---

## 12) Metrics & telemetry (local/optional)

- Daily mission completion rate
- Approval/rejection ratio of facts
- Insight action rate (dismiss/apply)
- Oracle usage frequency
- Memory logging frequency

---

## 13) Risks & mitigations

1. **Hallucinated facts** → verification sheet + confidence badges
2. **LocalStorage limits** → storage meter + export options
3. **Client API key exposure** → server proxy (planned)
4. **Information overload** → strict caps + progressive disclosure
5. **Trust erosion** → explainability + evidence links

---

## 14) Open questions / next steps

- Wire TimelineView as default Life Stream and add prep-plan entry point
- Implement export/import JSON flows in Settings + Log Bar
- Add encryption-at-rest and/or server proxy
- Add tests (unit + e2e) and error boundaries for AI calls
- Decide on long-term storage (IndexedDB vs server)
