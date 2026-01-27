# Data Model & Entity Reference

> Last updated: 2026-01-27 | Version: 3.2.0
> Source of truth: `data/types.ts` (466 lines, 30+ interfaces)

---

## Enums

### Category (11 life domains)

```typescript
enum Category {
  HEALTH = 'Health',
  FINANCE = 'Finance',
  RELATIONSHIPS = 'Relationships',
  SPIRITUAL = 'Spiritual',
  WORK = 'Work',
  SOCIAL = 'Social',
  PERSONAL = 'Personal',
  MEALS = 'Meals',
  TRAVEL = 'Travel',
  HABIT = 'Habit',
  GENERAL = 'General',
}
```

### ActionType (17 audit actions)

```typescript
enum ActionType {
  INGEST_SIGNAL,
  APPROVE_FACTS,
  REJECT_FACTS,
  APPLY_PROFILE_UPDATE,
  RESOLVE_CONFLICT,
  ARM_STRATEGY,
  PLAN_MISSION,
  COMPLETE_TASK,
  MERGE_DUPLICATES,
  IMPORT_EXPORT,
  PURGE_KERNEL,
  SYSTEM,
  DIGEST,
  APPROVE,
  REJECT,
  TASK_CREATE,
  CLAIM_ADD,
  PROFILE_UPDATE,
}
```

### ClaimStatus (knowledge lifecycle)

```
PROPOSED → COMMITTED → ARCHIVED
              ↕
           CONFLICT
```

### UserRole

```typescript
enum UserRole {
  ADMIN,
  MEMBER,
  CHILD,
}
```

### IntakeIntent (12 input intent types)

```typescript
type IntakeIntent =
  | 'memory'
  | 'event'
  | 'habit'
  | 'health'
  | 'finance'
  | 'relationship'
  | 'spiritual'
  | 'profile_update'
  | 'config_update'
  | 'task_request'
  | 'query'
  | 'unknown';
```

### IntakeItemType (14 item types)

```typescript
type IntakeItemType =
  | 'memory'
  | 'event'
  | 'task'
  | 'task_request'
  | 'habit'
  | 'profile_update'
  | 'config_update'
  | 'health_record'
  | 'finance_record'
  | 'relationship_note'
  | 'spiritual_note'
  | 'document'
  | 'link'
  | 'needs_review';
```

### IntakeHorizon

```typescript
type IntakeHorizon = 'now' | 'soon' | 'always' | 'unknown';
```

### RelationshipType

```typescript
type RelationshipType =
  | 'Spouse'
  | 'Parent'
  | 'Child'
  | 'Sibling'
  | 'Partner'
  | 'Friend'
  | 'Colleague'
  | 'Self';
```

---

## Core Entities

### UserProfile

The central identity record. Contains all structured data about a user across 6 sections.

```typescript
interface UserProfile {
  id: string;
  role: UserRole;
  isArchived?: boolean;
  privacySettings: PrivacySettings;
  relationships: RelationshipContact[];
  lastSyncTimestamp: number;
  coherenceScore: number;

  identify: {
    name: string;
    birthday: string;
    location: string;
    origin: string;
    ethnicity: string;
    lastUpdated?: number;
  };

  personal: {
    status: string;
    jobRole: string;
    company: string;
    interests: string[];
    lastUpdated?: number;
  };

  health: {
    height: string;
    weight: string;
    sleepTime: string;
    wakeTime: string;
    activities: string[];
    activityFrequency: string;
    conditions: string[];
    medications: string[];
    lastUpdated?: number;
  };

  finances: {
    assetsTotal: string;
    assetsBreakdown: { cash: string; investments: string; property: string; other: string };
    liabilities: string;
    income: string;
    fixedCosts: string;
    variableCosts: string;
    lastUpdated?: number;
  };

  relationship: {
    livingArrangement: string;
    socialEnergy: string;
    dailyCommitments: string[];
    socialGoals: string[];
    lastUpdated?: number;
  };

  spiritual: {
    worldview: string;
    coreValues: string[];
    practicePulse: string;
    lastUpdated?: number;
  };

  innerCircle: RelationshipContact[];
}
```

**Privacy Controls:**

```typescript
interface PrivacySettings {
  viewFinance: boolean;
  viewHealth: boolean;
  viewSpiritual: boolean;
  viewRelationships: boolean;
}
```

### MemoryItem

A signal logged by the user or extracted by AI. The primary input to the knowledge graph.

```typescript
interface MemoryItem {
  id: string;
  timestamp: number;
  content: string; // Raw or cleaned text
  category: Category;
  sentiment: string;
  extractedFacts: CategorizedFact[]; // AI-extracted facts
  extractionQualityNotes?: string[]; // AI quality warnings
  sourceId?: string; // Link to Source (file)
  ownerId: string | 'FAMILY_SHARED';
  extractionConfidence: number; // 0-1
  metadata?: {
    type?: string;
    payload?: unknown;
    source?: string;
    version?: number;
  };
}
```

**Alias:** `MemoryEntry = MemoryItem`

### Claim

A discrete fact in the knowledge graph with lifecycle tracking.

```typescript
interface Claim {
  id: string;
  sourceId: string; // Link to MemoryItem
  fact: string; // The factual statement
  type: 'FACT' | 'INFERENCE';
  confidence: number; // 0-100 (see claimUtils.ts for scoring)
  status: ClaimStatus; // PROPOSED → COMMITTED → ARCHIVED (or CONFLICT)
  category: Category;
  ownerId: string;
  timestamp: number;
}
```

**Confidence Scoring** (`claimUtils.ts`):

```
Base: 50
+20 if fact matches profile data (name, location, job, conditions)
+15 if corroborating claim exists
+10 if from PDF or image source
+5  if has event date
-10 if conflicting claim exists
```

### Source

A file or document uploaded by the user, stored encrypted in IndexedDB.

```typescript
interface Source {
  id: string;
  data?: string; // Base64 (legacy/preview)
  storageKey?: string; // IndexedDB key for encrypted binary
  mimeType: string;
  name: string;
  size?: number;
  uploadedAt?: number;
  ownerId: string | 'FAMILY_SHARED';
}
```

### DailyTask

An AI-generated or user-created task with execution guidance.

```typescript
interface DailyTask {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  why?: string; // Rationale
  reasoning?: string; // AI reasoning chain
  methodology?: string; // Approach
  estimate_min?: number; // Duration estimate
  energy?: 'LOW' | 'MEDIUM' | 'HIGH';
  category: Category;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: number;
  due_at?: number;
  best_window?: string; // Optimal time to execute
  start_time?: string; // "09:30"
  end_time?: string; // "11:00"
  steps?: string[];
  inputs?: string[]; // Prerequisites
  definitionOfDone?: string;
  risks?: string[];
  links?: {
    claims: string[];
    sources: string[];
    risks: string[];
    goals: string[];
  };
}
```

### Recommendation

An AI-generated actionable recommendation with full execution template.

```typescript
interface Recommendation {
  id: string;
  ownerId: string;
  category: Category;
  title: string;
  description: string;
  impactScore: number; // 1-10
  rationale: string; // Must reference profile/memory data
  steps: string[];
  estimatedTime: string;
  inputs: string[];
  definitionOfDone: string;
  risks: string[];
  status: 'ACTIVE' | 'DISMISSED' | 'APPLIED';
  userFeedback?: 'kept' | 'removed';
  needsReview: boolean;
  missingFields: string[];
  createdAt: number;
  evidenceLinks: {
    claims: string[];
    sources: string[];
  };
}
```

### BlindSpot

A risk or blind spot the AI detects the user may be missing.

```typescript
interface BlindSpot {
  id: string;
  ownerId: string;
  createdAt: number;
  signal: string; // What the AI detected
  why: string; // Why it matters
  confidence: number; // 0-1
  severity: 'low' | 'med' | 'high';
  actions: string[]; // Suggested actions
}
```

### Goal

A user-defined goal with progress tracking.

```typescript
interface Goal {
  id: string;
  ownerId: string;
  title: string;
  targetDate: string;
  category: Category;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'on-hold';
  createdAt: number;
}
```

### TimelineEvent

A calendar/timeline event.

```typescript
interface TimelineEvent {
  id: string;
  ownerId: string;
  title: string;
  date: string; // ISO date string
  category: Category;
  description: string;
  createdAt: number;
  isManual: boolean; // true = user-created, false = AI-generated
}
```

### ProactiveInsight

An AI-generated observation about patterns or opportunities.

```typescript
interface ProactiveInsight {
  id: string;
  title: string;
  description: string;
  type: string;
  category: Category;
  feedback?: 'like' | 'dislike';
}
```

---

## Configuration Entities

### RuleOfLife

User-defined life operating principles that constrain AI recommendations.

```typescript
interface RuleOfLife {
  season: {
    name: string; // e.g., "Growth", "Recovery"
    intensity: number; // 0-100
    context: string; // Explanation
  };
  valuesRoles: {
    values: string[]; // Core values
    roles: string[]; // Life roles
  };
  weeklyRhythm: {
    startOfWeek: string;
    blockedTimes: string[];
  };
  nonNegotiables: {
    sleepWindow: string; // e.g., "11pm-7am"
    sabbath: string;
    devotion: string;
  };
  taskPreferences: {
    dailyCap: number;
    energyOffset: string;
    includeWeekends: boolean;
  };
}
```

### AlwaysChip

A persistent routine/guardrail displayed in the Always panels.

```typescript
interface AlwaysChip {
  id: string;
  label: string; // Display text
  rationale: string; // Why this matters
  source: 'profile' | 'ruleOfLife' | 'health' | 'finance' | 'spiritual' | 'computed';
  profileField?: string; // Source profile field
  priority: 'high' | 'medium' | 'low';
}
```

### PromptConfig

User-customizable AI prompt template.

```typescript
interface PromptConfig {
  id: string; // 'internalization' | 'oracle' | 'deepPlanning'
  name: string;
  purpose: string;
  template: string; // Current (user-editable)
  defaultTemplate: string; // Original (for reset)
}
```

---

## Intake Pipeline Entities

### IntakeItem

A structured item extracted from user input by the AI intake router.

```typescript
interface IntakeItem {
  id: string;
  type: IntakeItemType; // 14 possible types
  intent: IntakeIntent; // 12 possible intents
  domain: Category;
  ownerId: string | 'FAMILY_SHARED';
  horizon?: IntakeHorizon; // now | soon | always | unknown
  title?: string;
  content: string;
  confidence: number; // 0-1
  tags?: string[];
  fields?: Record<string, unknown>; // date, amount, location, people, etc.
  sourceId?: string;
  dedupeKey?: string;
  needsReview?: IntakeNeedsReview;
  links?: IntakeEntityLink[];
}
```

### IntakeResult

The complete output from the AI intake router.

```typescript
interface IntakeResult {
  intent: IntakeIntent;
  items: IntakeItem[];
  missingData: string[];
  needsReview?: IntakeNeedsReview;
  confidence: number;
  notes?: string;
}
```

### Supporting Types

```typescript
interface IntakeNeedsReview {
  questions: string[]; // Clarifying questions
  reason: string; // Why review is needed
}

interface IntakeEntityLink {
  id: string;
  type: 'claim' | 'source' | 'memory' | 'event' | 'task' | 'profile';
}

interface CategorizedFact {
  fact: string;
  category: Category;
  confidence: number;
  ownerId?: string;
  eventDate?: string;
  sourceType?: 'text' | 'pdf' | 'image';
  evidence?: string;
}

interface ProposedUpdate {
  id: string;
  targetUserId?: string;
  section: string;
  field: string;
  oldValue: string;
  newValue: string;
  reasoning: string;
  confidence: number;
}
```

---

## Financial Model

### FinanceMetrics (computed)

Derived from `profile.finances` by `financeUtils.ts`:

```typescript
interface FinanceMetrics {
  income: number;
  fixed: number;
  variable: number;
  dailyVariableBudget: number; // variable / 30
  weeklyVariableBudget: number; // variable / 4
  savingsRate: number; // (income - (fixed + variable)) / income * 100
}
```

---

## System Entities

### AuditLogEntry

Every state mutation is logged for audit trail.

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: number;
  actionType: ActionType; // 17 possible types
  summary: string;
  details?: string;
  sourceId?: string;
  performerId?: string;
}
```

### FamilySpace

Multi-user family container.

```typescript
interface FamilySpace {
  id: string;
  familyName: string;
  members: UserProfile[];
  sharedResources: {
    vaultId: string;
  };
}
```

### RelationshipContact

A person in the user's inner circle.

```typescript
interface RelationshipContact {
  id: string;
  relatedToUserId: string;
  type: RelationshipType; // Spouse, Parent, Child, etc.
  notes?: string;
}
```

### PillarStatus

Domain health indicator used by dashboard.

```typescript
interface PillarStatus {
  category: Category;
  score: number; // 0-100
  status: 'OPTIMAL' | 'DEGRADED' | 'NO_SIGNAL';
  lastSync: number;
}
```

---

## Dashboard Layout Entities

### WidgetConfig & DashboardLayout

Configurable dashboard widget placement.

```typescript
type WidgetType =
  | 'VITALITY'
  | 'RADAR'
  | 'HORIZON'
  | 'INSIGHTS'
  | 'GOALS'
  | 'MISSION'
  | 'LIFE_PILLARS'
  | 'NEURAL_RESONANCE';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  x: number; // 1-12 grid column
  y: number;
  w: number; // Grid units wide
  h: number; // Grid units tall
  isPinned?: boolean;
}

interface DashboardLayout {
  widgets: WidgetConfig[];
}
```

---

## Entity Relationships

```
UserProfile ─────────────────────────┐
  │                                  │
  ├── owns → MemoryItem[]           │
  │            ├── extractedFacts[]  │
  │            └── sourceId → Source │
  │                                  │
  ├── owns → Claim[]                │
  │            └── sourceId → MemoryItem
  │                                  │
  ├── owns → DailyTask[]            │
  │            └── links.claims → Claim[]
  │            └── links.sources → Source[]
  │            └── links.goals → Goal[]
  │                                  │
  ├── owns → Recommendation[]       │
  │            └── evidenceLinks.claims → Claim[]
  │            └── evidenceLinks.sources → Source[]
  │                                  │
  ├── owns → BlindSpot[]            │
  ├── owns → Goal[]                 │
  ├── owns → TimelineEvent[]        │
  ├── owns → ProactiveInsight[]     │
  │                                  │
  ├── has → innerCircle: RelationshipContact[]
  ├── has → relationships: RelationshipContact[]
  └── has → privacySettings: PrivacySettings

FamilySpace
  └── members: UserProfile[]

RuleOfLife (per user, constrains AI output)
PromptConfig[] (customizable AI prompts)
AuditLogEntry[] (mutation audit trail)
DashboardLayout → WidgetConfig[] (UI layout)
```

---

## Data Ownership Model

| Entity           | Default Owner  | Sharable?             | Notes          |
| ---------------- | -------------- | --------------------- | -------------- |
| UserProfile      | Self           | No                    | One per user   |
| MemoryItem       | `activeUserId` | Yes → `FAMILY_SHARED` | Via LogRouter  |
| Source           | `activeUserId` | Yes → `FAMILY_SHARED` | Files          |
| Claim            | `ownerId`      | No                    | Tied to source |
| DailyTask        | `activeUserId` | No                    | Per-user       |
| Recommendation   | `activeUserId` | No                    | Per-user       |
| BlindSpot        | `activeUserId` | No                    | Per-user       |
| Goal             | `activeUserId` | No                    | Per-user       |
| TimelineEvent    | `activeUserId` | No                    | Per-user       |
| ProactiveInsight | Global         | N/A                   | System-level   |
| AuditLogEntry    | Global         | N/A                   | System-level   |

---

## Vault Persistence Model

All entities are stored in a single encrypted vault blob:

```typescript
type VaultData = {
  version: number;
  isOnboarded: boolean;
  familySpace: FamilySpace;
  activeUserId: string;
  sources: Source[];
  memoryItems: MemoryItem[];
  claims: Claim[];
  tasks: DailyTask[];
  recommendations: Recommendation[];
  goals: Goal[];
  auditLogs: AuditLogEntry[];
  timelineEvents: TimelineEvent[];
  insights: ProactiveInsight[];
  blindSpots: BlindSpot[];
  dailyPlan: DailyTask[];
  ruleOfLife: RuleOfLife;
  prompts: PromptConfig[];
  layouts: Record<string, DashboardLayout>;
};
```

**Storage:**

- `localStorage['aura_vault_v1']` → AES-256-GCM encrypted VaultData
- `localStorage['aura_vault_meta_v1']` → `{ version, salt, iterations }`
- `IndexedDB['arete-file-store']['files']` → Encrypted file blobs (per-file IV)

---

## Reactive Update Rules

1. Any CRUD on Memory/Event/Profile → triggers `debouncedRefreshAura()` (1s debounce)
2. Completing a Task → updates state + logs AuditLogEntry
3. Commit Claims → creates Claim records + updates profile + logs audit
4. Keep/Remove Recommendation → stores `userFeedback` + informs future AI
5. NeedsReview resolution → updates routing and recommendations
6. All state changes → auto-persist to encrypted vault
