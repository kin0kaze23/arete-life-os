# System Architecture

> Last updated: 2026-01-27 | Version: 3.2.0

## Overview

Areté Life OS is a **local-first, encryption-native** personal operating system that uses AI to transform raw life signals into executable daily guidance. All data lives in the browser (localStorage + IndexedDB), encrypted with AES-256-GCM. The AI layer runs via serverless functions on Vercel, calling Google Gemini (primary) with OpenAI fallback.

**Key principles:**

- Zero-knowledge: server never sees decrypted user data
- Local-first: works offline, no database server required
- AI-native: every data pathway flows through structured AI analysis
- Reactive: state changes auto-persist and trigger AI re-analysis

---

## Technology Stack

| Layer         | Technology               | Notes                                             |
| ------------- | ------------------------ | ------------------------------------------------- |
| Frontend      | React 19, TypeScript     | Single-page app                                   |
| Styling       | Tailwind CSS (CDN)       | Dark-first design system                          |
| Build         | Vite                     | Fast HMR, ESM-native                              |
| AI (Primary)  | Google Gemini API        | `gemini-3-pro-preview` / `gemini-3-flash-preview` |
| AI (Fallback) | OpenAI API               | `gpt-5.1` with configurable reasoning effort      |
| Encryption    | Web Crypto API           | AES-256-GCM + PBKDF2 (100K iterations)            |
| Storage       | localStorage + IndexedDB | Encrypted vault + encrypted file blobs            |
| Deployment    | Vercel                   | Auto-deploy from GitHub `main`                    |
| CI            | GitHub Actions           | Lint + typecheck + build gate                     |

---

## Folder Structure

```
areté-life-os/
├── .agent/                    # Agent operating docs (AGENT.md, LEARNINGS.md, etc.)
├── .github/                   # GitHub Actions CI/CD
├── ai/                        # AI service layer (client-side)
│   ├── geminiService.ts       # API client wrapper (callGemini, all generate* fns)
│   ├── prompts.ts             # System prompts (HYPER_PERSONALIZED, LOG_BAR_INGEST)
│   ├── validators.ts          # Zod schemas for AI output validation
│   └── index.ts
├── api/                       # Vercel serverless functions
│   └── gemini.ts              # POST /api/gemini - all AI actions
├── app/                       # Application root
│   ├── App.tsx                # Main app (routing, tab logic, vault gate)
│   ├── ErrorBoundary.tsx      # React error boundary
│   └── index.ts
├── chat/                      # Oracle chat interface
│   ├── ChatView.tsx           # Conversation UI
│   ├── VoiceAdvisor.tsx       # Voice input
│   └── index.ts
├── command/                   # Input & command processing
│   ├── CommandPalette.tsx     # Cmd+K command palette
│   ├── LogBar.tsx             # Main input interface (sticky bottom)
│   ├── LogRouter.ts           # Semantic intent classification
│   ├── PrepPlanModal.tsx      # Event preparation planner
│   └── index.ts
├── core/                      # Central state management
│   ├── useAura.ts             # THE central hook (1200+ lines)
│   └── index.ts
├── dashboard/                 # Dashboard components
│   ├── DashboardView.tsx      # Main layout
│   ├── AlwaysPanels.tsx       # Always-do / always-watch chips
│   ├── DomainPanels.tsx       # 5-pillar domain cards
│   ├── DoWatchSection.tsx     # Daily tasks + blind spots
│   ├── DigestView.tsx         # Daily digest
│   ├── RecommendationsWidget.tsx
│   ├── ReviewCard.tsx         # Task/recommendation card
│   ├── UpcomingCalendar.tsx   # Calendar widget
│   ├── EventPrepPopup.tsx     # AI prep recommendations
│   ├── BlindSideRadarCard.tsx # Blind spot radar
│   ├── FamilyDashboardView.tsx
│   ├── APIErrorCard.tsx       # Error state
│   ├── SystemStatusFooter.tsx # System health indicator
│   ├── corePillars.tsx        # Pillar visualization
│   └── domainUtils.ts         # Coverage scoring
├── data/                      # Data model & persistence
│   ├── types.ts               # Complete domain types (466 lines, 30+ interfaces)
│   ├── cryptoVault.ts         # AES-256-GCM vault encryption
│   ├── fileStore.ts           # IndexedDB encrypted file storage
│   ├── claimUtils.ts          # Claim confidence scoring
│   ├── financeUtils.ts        # Finance metric computation
│   ├── migration.ts           # Data migration utilities
│   └── index.ts
├── docs/                      # Project documentation
├── guide/                     # User-facing guides
├── layout/                    # Layout components
│   ├── Header.tsx             # Top bar (profile ring, neural sync)
│   ├── Sidebar.tsx            # Navigation sidebar
│   └── index.ts
├── onboarding/                # First-time experience
│   └── OnboardingView.tsx     # Onboarding flow + deep AI init
├── scripts/
│   └── doctor.sh              # Pre-push quality gate
├── settings/                  # Settings interface
│   ├── SettingsView.tsx       # Main settings
│   ├── RuleOfLifeView.tsx     # Rule of Life config
│   ├── PromptManagementView.tsx # Custom prompt editor
│   └── index.ts
├── shared/                    # Shared UI & utilities
│   ├── SharedUI.tsx           # 50+ reusable components
│   ├── design-tokens.ts       # Design system constants
│   ├── categoryIcons.tsx      # Category icon map
│   ├── utils.ts               # Helpers (parseNumber, contentHash)
│   └── index.ts
├── stream/                    # Life stream & timeline
│   ├── LifeStreamView.tsx     # Main stream view
│   ├── TimelineView.tsx       # Timeline visualization
│   ├── HistoryView.tsx        # Chronological history
│   ├── AuditLogView.tsx       # Audit trail viewer
│   └── index.ts
├── vault/                     # Vault & knowledge management
│   ├── VaultView.tsx          # Profile editor
│   ├── MemoryVaultView.tsx    # Knowledge graph browser
│   ├── VaultLockView.tsx      # Lock screen (passphrase + rate limit)
│   ├── VerificationSheet.tsx  # Fact verification workflow
│   ├── ConflictModal.tsx      # Claim conflict resolution
│   ├── SourceViewer.tsx       # Source file viewer
│   ├── ClaimItem.tsx          # Individual claim display
│   └── index.ts
├── index.tsx                  # React mount point
├── index.html                 # HTML entry
├── CLAUDE.md                  # Claude agent instructions
├── package.json               # Dependencies & scripts
├── vite.config.ts             # Vite config
├── vercel.json                # Vercel deployment + CSP headers
└── tsconfig.json              # TypeScript config
```

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│  │ Dashboard │   │  Stream  │   │   Chat   │   │  Vault   │   │
│  │   View    │   │   View   │   │   View   │   │   View   │   │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   │
│       │               │               │               │         │
│       └───────────────┴───────┬───────┴───────────────┘         │
│                               │                                 │
│                    ┌──────────┴──────────┐                      │
│                    │   useAura() Hook    │ ← Central state      │
│                    │   (core/useAura.ts) │   management         │
│                    └──────────┬──────────┘                      │
│                               │                                 │
│              ┌────────────────┼────────────────┐                │
│              │                │                │                │
│   ┌──────────┴──┐  ┌────────┴────────┐  ┌───┴──────────┐     │
│   │ cryptoVault │  │  geminiService  │  │  fileStore   │     │
│   │ (AES-256)   │  │  (AI client)    │  │  (IndexedDB) │     │
│   └──────┬──────┘  └────────┬────────┘  └───┬──────────┘     │
│          │                  │                │                 │
│   localStorage        fetch('/api/gemini')   IndexedDB         │
│   (encrypted)               │                (encrypted)       │
│                             │                                  │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Vercel Edge     │
                    │   /api/gemini.ts  │
                    └─────────┬─────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
          ┌──────┴──────┐          ┌──────┴──────┐
          │  Gemini API │          │ OpenAI API  │
          │  (primary)  │          │ (fallback)  │
          └─────────────┘          └─────────────┘
```

---

## The Core Loop

The system runs on a continuous **Ingest → Analyze → Display → Execute** cycle:

### Cycle 1: Ingest (User Input)

```
LogBar (text/files) → LogRouter.classifyIntent()
                    → LogRouter.resolveTargetUser()
                    → POST /api/gemini (action: processInput)
                    → LOG_BAR_INGEST_PROMPT → IntakeResult
                    → VerificationSheet (user approval)
                    → commitClaims() + appendMemoryItems()
```

1. User enters text or attaches files in the LogBar
2. `LogRouter` classifies intent (`MEMORY | QUERY | TASK | CONFIG`) and resolves target user
3. Serverless function sends input + profile context to Gemini with `LOG_BAR_INGEST_PROMPT`
4. AI returns structured `IntakeResult` with extracted facts, proposed updates, confidence
5. User reviews and approves via `VerificationSheet`
6. Approved data is committed to knowledge graph (Claims + MemoryItems)

### Cycle 2: Analyze (AI Inference)

```
debouncedRefreshAura() (triggered after commit)
  → generateDeepTasks()       → Recommendation[] + DailyTask[]
  → generateBlindSpots()      → BlindSpot[]
  → generateInsights()        → ProactiveInsight[]
  → generateDailyPlan()       → DailyTask[] (prioritized)
```

1. After data changes, a debounced (1s) refresh triggers
2. AI generates personalized recommendations grounded in profile + memory
3. Blind spots and proactive insights are detected
4. Daily plan is generated with priority ordering
5. All results stored in reactive state

### Cycle 3: Display (Dashboard)

```
DashboardView renders reactive state:
  ├─ AlwaysPanels       (always-do / always-watch chips)
  ├─ DoWatchSection     (daily tasks + blind spots)
  ├─ DomainPanels       (5 life pillars with coverage scores)
  ├─ Recommendations    (actionable suggestions per domain)
  └─ Calendar           (upcoming events)
```

### Cycle 4: Execute (User Action)

```
User interaction:
  → completeTask(id)         → mark done, log audit
  → keepRecommendation(id)   → store feedback for AI learning
  → removeRecommendation(id) → dismiss, inform future AI
  → updateProfile(...)       → immediate persist + trigger refresh
```

Each action updates reactive state, auto-persists to encrypted vault, logs an audit entry, and may trigger AI re-analysis.

---

## Encryption Architecture

### Vault Encryption (localStorage)

```
Passphrase → PBKDF2(passphrase, salt, 100K iterations, SHA-256) → CryptoKey
CryptoKey  → AES-256-GCM(key, random_IV, JSON.stringify(VaultData)) → ciphertext
Storage    → localStorage['aura_vault_v1'] = IV + ciphertext
Metadata   → localStorage['aura_vault_meta_v1'] = { version, salt, iterations }
```

### File Encryption (IndexedDB)

```
CryptoKey  → AES-256-GCM(key, random_IV, file_blob) → encrypted_blob
Storage    → IndexedDB['arete-file-store']['files'][key] = {
               blob: encrypted_blob,
               encrypted: true,
               originalType: mime_type,
               originalSize: byte_count
             }
```

### Security Properties

- **Zero-knowledge**: Server functions never receive decrypted vault data
- **Non-extractable keys**: CryptoKey object cannot be serialized or exported
- **Rate limiting**: 5 failed passphrase attempts → 15-minute lockout (sessionStorage)
- **Auto-lock**: 15 minutes of inactivity → vault locked, decrypted state cleared
- **No plaintext persistence**: All stored data is encrypted before write

---

## State Management

All application state flows through the `useAura()` hook in `core/useAura.ts`:

```
┌────────────────────────────────────────────────────────┐
│                    useAura() Hook                      │
│                                                        │
│  State (reactive):                                     │
│  ├─ profile: UserProfile                               │
│  ├─ familySpace: FamilySpace                           │
│  ├─ memoryItems: MemoryItem[]                          │
│  ├─ claims: Claim[]                                    │
│  ├─ sources: Source[]                                   │
│  ├─ tasks: DailyTask[]                                 │
│  ├─ recommendations: Recommendation[]                  │
│  ├─ goals: Goal[]                                      │
│  ├─ blindSpots: BlindSpot[]                            │
│  ├─ dailyPlan: DailyTask[]                             │
│  ├─ insights: ProactiveInsight[]                       │
│  ├─ auditLogs: AuditLogEntry[]                         │
│  ├─ timelineEvents: TimelineEvent[]                    │
│  ├─ ruleOfLife: RuleOfLife                              │
│  └─ prompts: PromptConfig[]                            │
│                                                        │
│  Auto-behaviors:                                       │
│  ├─ State change → encrypt & save to localStorage      │
│  ├─ Data commit → debounced AI refresh (1s)            │
│  ├─ Inactivity 15min → auto-lock vault                 │
│  └─ Memory dedup → skip identical contentHash()        │
└────────────────────────────────────────────────────────┘
```

### Persistence Flow

```
setState() (React)
  → useEffect detects change
  → JSON.stringify(vaultData)
  → AES-256-GCM encrypt with CryptoKey
  → localStorage.setItem('aura_vault_v1', payload)
```

---

## AI Service Architecture

### Dual-Model Strategy

| Model             | Use Case                           | Speed  | Depth                         |
| ----------------- | ---------------------------------- | ------ | ----------------------------- |
| Gemini Flash      | Input processing (LOG_BAR_INGEST)  | Fast   | Structured extraction         |
| Gemini Pro        | Deep analysis (HYPER_PERSONALIZED) | Slower | Nuanced reasoning             |
| OpenAI (fallback) | Any action if Gemini fails         | Varies | Configurable reasoning effort |

### API Route: `/api/gemini`

Single serverless endpoint handling all AI actions:

| Action                       | Prompt                    | Model                         | Returns                        |
| ---------------------------- | ------------------------- | ----------------------------- | ------------------------------ |
| `processInput`               | LOG_BAR_INGEST_PROMPT     | Flash                         | IntakeResult                   |
| `generateDeepTasks`          | HYPER_PERSONALIZED_PROMPT | Pro                           | Recommendation[] + DailyTask[] |
| `generateTasks`              | Task generation           | Pro                           | DailyTask[]                    |
| `generateInsights`           | Insight detection         | Pro                           | ProactiveInsight[]             |
| `generateBlindSpots`         | Blind spot analysis       | Pro                           | BlindSpot[]                    |
| `generateDailyPlan`          | Daily planning            | Pro                           | DailyTask[]                    |
| `generateDeepInitialization` | Onboarding init           | Pro                           | DeepInitializationResult       |
| `generateEventPrepPlan`      | Event prep                | Pro                           | Prep recommendations           |
| `askAura`                    | Oracle conversation       | Pro + Google Search grounding | Chat response                  |

### Validation Pipeline

```
AI raw output → JSON.parse() → Zod schema validation → typed result or null
```

Zod schemas enforce:

- `RecommendationSchema`: category, title (min 3), description (min 5), impactScore (1-10), rationale, steps[], etc.
- `TaskSchema`: title (min 3), category, priority, methodology, steps[], etc.

---

## Component Hierarchy

```
App.tsx
├─ VaultLockView           (if locked)
│  ├─ Passphrase input + strength meter
│  ├─ Rate limiting UI (countdown, attempts warning)
│  └─ Create / Unlock / Import options
│
└─ Main Layout             (if unlocked)
   ├─ Header.tsx           (profile ring, neural sync, Cmd+K)
   ├─ Sidebar.tsx          (tab navigation, domain health)
   ├─ Content Area
   │  ├─ DashboardView     (tab: dashboard)
   │  │  ├─ AlwaysPanels
   │  │  ├─ DoWatchSection
   │  │  ├─ DomainPanels
   │  │  ├─ RecommendationsWidget
   │  │  └─ UpcomingCalendar
   │  ├─ LifeStreamView    (tab: stream)
   │  │  ├─ TimelineView
   │  │  ├─ HistoryView
   │  │  └─ AuditLogView
   │  ├─ ChatView           (tab: chat)
   │  ├─ VaultView           (tab: vault > identity)
   │  ├─ MemoryVaultView     (tab: vault > knowledge)
   │  └─ SettingsView        (tab: settings)
   ├─ LogBar.tsx             (sticky bottom, all tabs)
   ├─ CommandPalette.tsx     (Cmd+K overlay)
   └─ VerificationSheet.tsx  (modal: fact approval)
```

---

## Data Flow Summary

```
Layer              │ Files                │ Responsibility
───────────────────┼──────────────────────┼─────────────────────────
Presentation       │ dashboard/, vault/,  │ UI rendering, user events
                   │ chat/, stream/       │
───────────────────┼──────────────────────┼─────────────────────────
State Management   │ core/useAura.ts      │ Central state, vault lifecycle,
                   │                      │ auto-persist, auto-lock
───────────────────┼──────────────────────┼─────────────────────────
AI Processing      │ ai/geminiService.ts  │ Client-side API calls
                   │ ai/prompts.ts        │ System prompt templates
                   │ ai/validators.ts     │ Zod output validation
───────────────────┼──────────────────────┼─────────────────────────
API Gateway        │ api/gemini.ts        │ Serverless: Gemini + OpenAI
───────────────────┼──────────────────────┼─────────────────────────
Input Routing      │ command/LogRouter.ts │ Intent classification,
                   │ command/LogBar.tsx    │ user resolution, file handling
───────────────────┼──────────────────────┼─────────────────────────
Encryption         │ data/cryptoVault.ts  │ AES-256-GCM vault
                   │ data/fileStore.ts    │ Encrypted IndexedDB files
───────────────────┼──────────────────────┼─────────────────────────
Data Model         │ data/types.ts        │ 30+ TypeScript interfaces
                   │ data/claimUtils.ts   │ Confidence scoring
                   │ data/financeUtils.ts │ Finance computation
───────────────────┼──────────────────────┼─────────────────────────
Shared             │ shared/SharedUI.tsx   │ 50+ reusable components
                   │ shared/design-tokens │ Design system constants
```

---

## Deployment Pipeline

```
Developer Machine
  │
  ├─ npm run doctor         (lint + typecheck + build)
  ├─ git commit + push      (to GitHub main)
  │
  ↓
GitHub Actions CI
  ├─ ESLint check
  ├─ TypeScript typecheck
  └─ Build verification
  │
  ↓
Vercel Auto-Deploy
  ├─ Build: vite build
  ├─ CSP headers applied (vercel.json)
  ├─ Environment variables injected
  └─ Live at production URL
```

### Environment Variables (Vercel)

| Variable                  | Required | Default                  | Purpose               |
| ------------------------- | -------- | ------------------------ | --------------------- |
| `GEMINI_API_KEY`          | Yes      | -                        | Google AI API key     |
| `GEMINI_MODEL_PRO`        | No       | `gemini-3-pro-preview`   | Deep analysis model   |
| `GEMINI_MODEL_FLASH`      | No       | `gemini-3-flash-preview` | Fast processing model |
| `OPENAI_API_KEY`          | No       | -                        | Fallback AI provider  |
| `OPENAI_MODEL`            | No       | `gpt-5.1`                | Fallback model        |
| `OPENAI_REASONING_EFFORT` | No       | `medium`                 | Reasoning depth       |

---

## Key Invariants

1. **No plaintext on disk** - All persistent data is AES-256-GCM encrypted
2. **No API keys in client code** - Keys only exist in Vercel env vars, accessed via serverless functions
3. **AI output always validated** - Zod schemas enforce structure before state updates
4. **Memory deduplication** - `contentHash()` prevents duplicate MemoryItems
5. **Audit trail** - Every state mutation logged with `ActionType` enum
6. **Main branch always green** - `npm run doctor` must pass before push
7. **Auto-lock on inactivity** - 15-minute timeout clears decrypted state from memory
