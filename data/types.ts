export enum Category {
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

export enum ActionType {
  INGEST_SIGNAL = 'INGEST_SIGNAL',
  APPROVE_FACTS = 'APPROVE_FACTS',
  REJECT_FACTS = 'REJECT_FACTS',
  APPLY_PROFILE_UPDATE = 'APPLY_PROFILE_UPDATE',
  RESOLVE_CONFLICT = 'RESOLVE_CONFLICT',
  ARM_STRATEGY = 'ARM_STRATEGY',
  PLAN_MISSION = 'PLAN_MISSION',
  COMPLETE_TASK = 'COMPLETE_TASK',
  MERGE_DUPLICATES = 'MERGE_DUPLICATES',
  IMPORT_EXPORT = 'IMPORT_EXPORT',
  PURGE_KERNEL = 'PURGE_KERNEL',
  SYSTEM = 'SYSTEM',
  DIGEST = 'DIGEST',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  TASK_CREATE = 'TASK_CREATE',
  CLAIM_ADD = 'CLAIM_ADD',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  CHILD = 'CHILD',
}

export enum ClaimStatus {
  PROPOSED = 'PROPOSED',
  COMMITTED = 'COMMITTED',
  CONFLICT = 'CONFLICT',
  ARCHIVED = 'ARCHIVED',
}

export type IntentType = 'QUERY' | 'TASK' | 'CONFIG' | 'MEMORY';
export type IntakeIntent =
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
export type IntakeItemType =
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
export type IntakeHorizon = 'now' | 'soon' | 'always' | 'unknown';
export type RelationshipType =
  | 'Spouse'
  | 'Parent'
  | 'Child'
  | 'Sibling'
  | 'Partner'
  | 'Friend'
  | 'Colleague'
  | 'Self';

export interface PrivacySettings {
  viewFinance: boolean;
  viewHealth: boolean;
  viewSpiritual: boolean;
  viewRelationships: boolean;
}

export interface Source {
  id: string;
  data?: string; // Base64 (preview or legacy)
  storageKey?: string; // IndexedDB/OPFS key for binary
  mimeType: string;
  name: string;
  size?: number;
  uploadedAt?: number;
  ownerId: string | 'FAMILY_SHARED';
}

export interface Claim {
  id: string;
  sourceId: string; // Link to MemoryItem
  fact: string;
  type: 'FACT' | 'INFERENCE';
  confidence: number; // 0-100
  status: ClaimStatus;
  category: Category;
  ownerId: string;
  timestamp: number;
}

export interface UserProfile {
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

export interface PillarStatus {
  category: Category;
  score: number; // 0-100
  status: 'OPTIMAL' | 'DEGRADED' | 'NO_SIGNAL';
  lastSync: number;
}

export interface CategorizedFact {
  fact: string;
  category: Category;
  confidence: number;
  ownerId?: string;
  eventDate?: string;
  sourceType?: 'text' | 'pdf' | 'image';
  evidence?: string;
}

export interface ProposedUpdate {
  id: string;
  targetUserId?: string;
  section: string;
  field: string;
  oldValue: string;
  newValue: string;
  reasoning: string;
  confidence: number;
}

export interface MemoryItem {
  id: string;
  timestamp: number;
  content: string;
  category: Category;
  sentiment: string;
  extractedFacts: CategorizedFact[];
  extractionQualityNotes?: string[];
  sourceId?: string; // Link to Source
  ownerId: string | 'FAMILY_SHARED';
  extractionConfidence: number;
  metadata?: {
    type?: string;
    payload?: unknown;
    source?: string;
    version?: number;
  };
}
export type MemoryEntry = MemoryItem;

export interface IntakeNeedsReview {
  questions: string[];
  reason: string;
}

export interface IntakeEntityLink {
  id: string;
  type: 'claim' | 'source' | 'memory' | 'event' | 'task' | 'profile';
}

export interface IntakeItem {
  id: string;
  type: IntakeItemType;
  intent: IntakeIntent;
  domain: Category;
  ownerId: string | 'FAMILY_SHARED';
  horizon?: IntakeHorizon;
  title?: string;
  content: string;
  confidence: number;
  tags?: string[];
  fields?: Record<string, unknown>;
  sourceId?: string;
  dedupeKey?: string;
  needsReview?: IntakeNeedsReview;
  links?: IntakeEntityLink[];
}

export interface IntakeResult {
  intent: IntakeIntent;
  items: IntakeItem[];
  missingData: string[];
  needsReview?: IntakeNeedsReview;
  confidence: number;
  notes?: string;
}

export interface FinanceMetrics {
  income: number;
  fixed: number;
  variable: number;
  dailyVariableBudget: number;
  weeklyVariableBudget: number;
  savingsRate: number;
}

export interface Recommendation {
  id: string;
  ownerId: string;
  category: Category;
  title: string;
  description: string;
  impactScore: number;
  rationale: string;
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

export interface AlwaysChip {
  id: string;
  label: string;
  rationale: string;
  source: 'profile' | 'ruleOfLife' | 'health' | 'finance' | 'spiritual' | 'computed';
  profileField?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DailyTask {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  why?: string;
  benefits?: string;
  reasoning?: string;
  methodology?: string;
  estimate_min?: number;
  energy?: 'LOW' | 'MEDIUM' | 'HIGH';
  category: Category;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: number;
  due_at?: number;
  best_window?: string;
  start_time?: string; // e.g., "09:30"
  end_time?: string; // e.g., "11:00"
  steps?: string[];
  inputs?: string[];
  definitionOfDone?: string;
  risks?: string[];
  links?: {
    claims: string[];
    sources: string[];
    risks: string[];
    goals: string[];
  };
}

export interface Goal {
  id: string;
  ownerId: string;
  title: string;
  targetDate: string;
  category: Category;
  progress: number;
  status: 'active' | 'completed' | 'on-hold';
  createdAt: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actionType: ActionType;
  summary: string;
  details?: string;
  sourceId?: string;
  performerId?: string;
}

export interface PromptConfig {
  id: string;
  name: string;
  purpose: string;
  template: string;
  defaultTemplate: string;
}

export interface FamilySpace {
  id: string;
  familyName: string;
  members: UserProfile[];
  sharedResources: {
    vaultId: string;
  };
}

export interface BlindSpot {
  id: string;
  ownerId: string;
  createdAt: number;
  signal: string;
  why: string;
  confidence: number;
  severity: 'low' | 'med' | 'high';
  actions: string[];
}

export interface ProactiveInsight {
  id: string;
  title: string;
  description: string;
  type: string;
  category: Category;
  feedback?: 'like' | 'dislike';
}

export interface TimelineEvent {
  id: string;
  ownerId: string;
  title: string;
  date: string; // ISO string
  category: Category;
  description: string;
  createdAt: number;
  isManual: boolean;
  fields?: {
    location?: string;
    people?: string[];
  };
  metadata?: {
    isPriority?: boolean;
    prepStatus?: 'pending' | 'ready';
  };
}

export interface RelationshipContact {
  id: string;
  relatedToUserId: string;
  type: RelationshipType;
  notes?: string;
}

export interface RuleOfLife {
  season: {
    name: string;
    intensity: number;
    context: string;
  };
  valuesRoles: {
    values: string[];
    roles: string[];
  };
  weeklyRhythm: {
    startOfWeek: string;
    blockedTimes: string[];
  };
  nonNegotiables: {
    sleepWindow: string;
    sabbath: string;
    devotion: string;
  };
  taskPreferences: {
    dailyCap: number;
    energyOffset: string;
    includeWeekends: boolean;
  };
}

export interface SourceFile {
  name: string;
  mimeType: string;
  data: string; // base64
}

export type WidgetType =
  | 'VITALITY'
  | 'RADAR'
  | 'HORIZON'
  | 'INSIGHTS'
  | 'GOALS'
  | 'MISSION'
  | 'LIFE_PILLARS'
  | 'NEURAL_RESONANCE';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  x: number; // 1-12
  y: number;
  w: number; // grid units
  h: number; // grid units
  isPinned?: boolean;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}
