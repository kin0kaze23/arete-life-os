# Product Requirements Document (PRD)

> Last updated: 2026-01-27 | Version: 3.2.0

## 1. Product Summary

**Areté Life OS** is a local-first, AI-powered personal operating system that helps users manage their entire life across health, finance, relationships, spiritual growth, and personal development. It transforms raw life signals (text, files, voice) into executable daily guidance through a secure encrypted vault.

**Target User:** Intentional individuals who want a structured, AI-assisted system to optimize their daily life across multiple domains.

**Core Thesis:** Most productivity tools focus on tasks. Areté focuses on _life operating patterns_ — combining what you should **DO** today, what you should **WATCH** for, and what you should **ALWAYS** maintain, across every life domain.

---

## 2. Problem Statement

People manage their lives across fragmented tools — separate apps for health, finance, tasks, goals, and relationships. No single system:

- Understands the **whole person** (profile, values, constraints)
- Generates **personalized, grounded** recommendations (not generic)
- Maintains a **knowledge graph** of life facts with confidence tracking
- Encrypts everything **client-side** with zero-knowledge architecture
- Provides an **auditable trail** of every AI decision and data change

---

## 3. Product Vision

A personal Chief of Staff that:

1. **Knows you deeply** — builds a knowledge graph from every signal you share
2. **Acts on your behalf** — generates daily tasks, recommendations, and blind spot alerts
3. **Respects your values** — grounds all advice in your Rule of Life and worldview
4. **Protects your data** — AES-256-GCM encryption, no cloud database, zero-knowledge
5. **Gets smarter over time** — learns from feedback, tracks claim confidence, detects patterns

---

## 4. Core Features

### 4.1 Encrypted Vault

| Requirement                                       | Status | Implementation      |
| ------------------------------------------------- | ------ | ------------------- |
| AES-256-GCM encryption for all data               | Done   | `cryptoVault.ts`    |
| PBKDF2 key derivation (100K iterations)           | Done   | `cryptoVault.ts`    |
| Encrypted file storage (IndexedDB)                | Done   | `fileStore.ts`      |
| Rate-limited unlock (5 attempts / 15-min lockout) | Done   | `VaultLockView.tsx` |
| Auto-lock after 15 min inactivity                 | Done   | `useAura.ts`        |
| Export/Import vault with files                    | Done   | `useAura.ts`        |
| Password strength meter                           | Done   | `VaultLockView.tsx` |
| Legacy data migration (plaintext → encrypted)     | Done   | `migration.ts`      |

### 4.2 Knowledge Graph

| Requirement                                                    | Status | Implementation            |
| -------------------------------------------------------------- | ------ | ------------------------- |
| Memory items with category, sentiment, confidence              | Done   | `types.ts: MemoryItem`    |
| Claims with lifecycle (PROPOSED → COMMITTED → ARCHIVED)        | Done   | `types.ts: Claim`         |
| Conflict detection and resolution                              | Done   | `ConflictModal.tsx`       |
| Confidence scoring (profile match, corroboration, source type) | Done   | `claimUtils.ts`           |
| Source tracking (text, PDF, image)                             | Done   | `types.ts: Source`        |
| Content deduplication via hash                                 | Done   | `utils.ts: contentHash()` |
| User verification workflow (auto-commit)                       | Done   | —                         |

### 4.3 AI-Powered Analysis

| Requirement                                | Status | Implementation                      |
| ------------------------------------------ | ------ | ----------------------------------- |
| Input processing → structured IntakeResult | Done   | `processInput` action               |
| Personalized task generation               | Done   | `generateDeepTasks` action          |
| Blind spot detection                       | Done   | `generateBlindSpots` action         |
| Proactive insight generation               | Done   | `generateInsights` action           |
| Daily plan generation                      | Done   | `generateDailyPlan` action          |
| Event preparation recommendations          | Done   | `generateEventPrepPlan` action      |
| Deep initialization (onboarding)           | Done   | `generateDeepInitialization` action |
| Oracle Q&A with Google Search grounding    | Done   | `askAura` action                    |
| Dual-model strategy (Gemini Pro + Flash)   | Done   | `api/gemini.ts`                     |
| OpenAI fallback                            | Done   | `api/gemini.ts`                     |
| Zod schema validation on all AI output     | Done   | `validators.ts`                     |

### 4.4 Dashboard

| Requirement                                        | Status | Implementation           |
| -------------------------------------------------- | ------ | ------------------------ |
| Do items (daily tasks with priority, steps, risks) | Done   | `FocusList.tsx`          |
| Watch items (blind spots with severity, actions)   | Done   | `StatusSidebar.tsx`      |
| Always-Do / Always-Watch chips                     | Done   | `StatusSidebar.tsx`      |
| Recommendations with keep/remove feedback          | Done   | `StatusSidebar.tsx`      |
| Upcoming calendar                                  | Done   | `UpcomingCalendar.tsx`   |
| Event prep popup                                   | Done   | `EventPrepPopup.tsx`     |
| System status footer                               | Done   | `SystemStatusFooter.tsx` |

### 4.5 Input System (LogBar)

| Requirement                                          | Status | Implementation       |
| ---------------------------------------------------- | ------ | -------------------- |
| Universal text input (sticky bottom)                 | Done   | `LogBar.tsx`         |
| Multi-file attachment                                | Done   | `LogBar.tsx`         |
| Voice input                                          | Done   | `VoiceAdvisor.tsx`   |
| Semantic intent classification                       | Done   | `LogRouter.ts`       |
| Target user resolution (self, family member, shared) | Done   | `LogRouter.ts`       |
| File drag-and-drop                                   | Done   | `LogBar.tsx`         |
| Command palette (Cmd+K)                              | Done   | `CommandPalette.tsx` |

### 4.6 Life Stream

| Requirement            | Status  | Implementation     |
| ---------------------- | ------- | ------------------ |
| Timeline visualization | Done    | `TimelineView.tsx` |
| Chronological history  | Done    | `HistoryView.tsx`  |
| Audit log viewer       | Done    | `AuditLogView.tsx` |
| Daily digest           | Removed | —                  |

### 4.7 Vault Management

| Requirement                    | Status | Implementation             |
| ------------------------------ | ------ | -------------------------- |
| Profile editor (all 5 domains) | Done   | `VaultView.tsx`            |
| Memory/knowledge browser       | Done   | `MemoryVaultView.tsx`      |
| Claim browser with confidence  | Done   | `ClaimItem.tsx`            |
| Source file viewer             | Done   | `SourceViewer.tsx`         |
| Rule of Life configuration     | Done   | `RuleOfLifeView.tsx`       |
| Custom prompt management       | Done   | `PromptManagementView.tsx` |

### 4.8 Multi-User (Family Space)

| Requirement                         | Status  | Implementation                          |
| ----------------------------------- | ------- | --------------------------------------- |
| Family space with multiple profiles | Done    | `types.ts: FamilySpace`                 |
| Per-user data ownership             | Done    | `ownerId` on all entities               |
| FAMILY_SHARED ownership             | Done    | `LogRouter.resolveTargetUser()`         |
| Family dashboard view               | Removed | —                                       |
| Privacy settings per user           | Done    | `types.ts: UserProfile.privacySettings` |

---

## 5. Life Domain Model (5 Pillars)

| Pillar        | Category Enum      | Profile Section        | Key Metrics                                              |
| ------------- | ------------------ | ---------------------- | -------------------------------------------------------- |
| Health        | `HEALTH`           | `profile.health`       | Sleep window, weight, conditions, medications            |
| Finance       | `FINANCE`          | `profile.finances`     | Income, fixed/variable costs, savings rate, daily budget |
| Relationships | `RELATIONSHIPS`    | `profile.relationship` | Living arrangement, social energy, inner circle          |
| Spiritual     | `SPIRITUAL`        | `profile.spiritual`    | Worldview, core values, practice pulse                   |
| Work/Personal | `WORK`, `PERSONAL` | `profile.personal`     | Job role, company, interests                             |

Additional categories: `MEALS`, `TRAVEL`, `HABIT`, `SOCIAL`, `GENERAL`

---

## 6. AI Behavior Requirements

### 6.1 Grounding Rules

- All recommendations must cite specific profile data or memory items
- Financial advice must use actual numbers from `financeUtils.computeFinanceMetrics()`
- Health advice must respect user conditions and medications
- Spiritual guidance must align with declared worldview and values

### 6.2 Quality Standards

- Every task must include: title, description, why, steps, inputs, definition of done, risks
- Every recommendation must include: impact score (1-10), rationale, estimated time
- Blind spots must include: signal, why, confidence, severity, actions
- Missing data must be flagged (not hallucinated)

### 6.3 Personalization

- The `HYPER_PERSONALIZED_PROMPT` acts as a "Chief of Staff" role
- Checks for Moral Friction (alignment with stated values)
- Integrates Rule of Life constraints (non-negotiables, weekly rhythm)
- Considers current life season (season.intensity, season.context)

### 6.4 Safety

- `NeedsReview` flag on uncertain extractions (confidence < threshold)
- User must approve all profile updates before commit
- Conflict detection when new facts contradict existing claims
- No hallucinated data — AI must say "I don't know" when uncertain

---

## 7. Security Requirements

| Requirement                             | Status | Notes                       |
| --------------------------------------- | ------ | --------------------------- |
| Client-side encryption (AES-256-GCM)    | Done   | Zero-knowledge architecture |
| PBKDF2 key derivation (100K iterations) | Done   | 16-byte salt                |
| No API keys in client code              | Done   | Server-side only            |
| Rate-limited vault unlock               | Done   | 5 attempts / 15-min lockout |
| Auto-lock on inactivity                 | Done   | 15 minutes                  |
| Encrypted file storage                  | Done   | IndexedDB with per-file IV  |
| Export/import with encryption           | Done   | Files included in export    |
| Audit trail for all mutations           | Done   | ActionType enum logging     |
| Input validation (Zod)                  | Done   | All AI output validated     |
| CSP headers                             | Done   | vercel.json configuration   |

---

## 8. Non-Functional Requirements

| Requirement            | Target                 | Current Status           |
| ---------------------- | ---------------------- | ------------------------ |
| Build passes cleanly   | `npm run doctor` green | Enforced via CI          |
| TypeScript strict mode | Zero type errors       | Enforced via CI          |
| ESLint compliance      | Zero warnings          | Enforced via CI          |
| Offline detection      | NetworkBanner shown    | Done                     |
| Error boundaries       | Graceful error UI      | Done (ErrorBoundary.tsx) |
| Auto-deploy on merge   | Vercel auto-deploy     | Done                     |
| Mobile responsive      | Basic responsive       | Partial (xl breakpoints) |

---

## 9. User Journeys

### Morning Flow

1. Open app → Dashboard shows today's Do items + Watch alerts
2. Review Always-Do / Always-Watch chips
3. Optionally click "Plan My Day" → AI generates prioritized daily plan

### Daytime Flow

1. Log signals via LogBar (text, files, voice)
2. AI extracts facts → User verifies → Knowledge graph updated
3. Dashboard reactively updates with new recommendations

### Evening Flow

1. Review completed tasks, dismiss irrelevant recommendations
2. Log reflections (mood, energy, gratitude)
3. System learns from feedback for next day

### Onboarding Flow

1. Set vault passphrase (8+ chars, strength meter)
2. Fill profile across 5 domains
3. Deep AI initialization generates personalized content
4. Dashboard populated with initial guidance

---

## 10. Future Roadmap

### Phase 2: Cloud Sync (Planned)

- Supabase authentication (email/password + OAuth)
- Encrypted cloud backup (vault export → cloud storage)
- Cross-device sync with conflict resolution
- Row-level security per user

### Phase 3: Advanced Features (Conceptual)

- Nightly review automation
- Calendar integrations (Google Calendar, Outlook)
- Wearable data integration (health metrics)
- Advanced family collaboration tools
- Mobile-native app (React Native)

---

## 11. Success Metrics

| Metric                    | Description                          |
| ------------------------- | ------------------------------------ |
| Daily Active Usage        | User opens app and interacts daily   |
| Signal Ingestion Rate     | Number of logs/signals per day       |
| Knowledge Graph Depth     | Number of committed claims per user  |
| Task Completion Rate      | % of generated tasks completed       |
| Recommendation Acceptance | Keep vs. Remove ratio                |
| Profile Completeness      | % of profile fields filled           |
| Vault Health              | Successful unlock rate, no data loss |
