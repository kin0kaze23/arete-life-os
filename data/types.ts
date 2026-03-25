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

export type LifeDimension =
  | Category.HEALTH
  | Category.FINANCE
  | Category.RELATIONSHIPS
  | Category.SPIRITUAL
  | Category.PERSONAL;

export const LIFE_DIMENSIONS: LifeDimension[] = [
  Category.HEALTH,
  Category.FINANCE,
  Category.RELATIONSHIPS,
  Category.SPIRITUAL,
  Category.PERSONAL,
];

export type DimensionStatus = 'thriving' | 'stable' | 'needs_attention' | 'critical' | 'no_signal';
export type DimensionTrend = 'up' | 'down' | 'stable';

export interface DimensionSwot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface DimensionScoreExplanation {
  summary: string;
  drivers: string[];
  peerComparison: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface DimensionContextSnapshot {
  dimension: LifeDimension;
  status: DimensionStatus;
  score: number;
  trend: DimensionTrend;
  delta: number;
  insight: string;
  gap: string;
  nextStep: string;
  swot?: DimensionSwot;
  scoreExplanation?: DimensionScoreExplanation;
  projection?: string;
  missingData?: string[];
  fidelityLevel: 0 | 1 | 2 | 3;
  generatedAt: string;
  triggeredBy?: string;
}

export interface CriticalPriority {
  dimension: LifeDimension;
  title: string;
  rationale: string;
  consequence: string;
}

export interface ProfileGap {
  field: string;
  dimension: LifeDimension;
  prompt: string;
  impactDescription: string;
}

export interface LifeContextSnapshot {
  id: string;
  snapshotAt: string;
  weekLabel: string;
  narrativeParagraph: string;
  dimensions: DimensionContextSnapshot[];
  criticalPriorities: CriticalPriority[];
  profileGaps: ProfileGap[];
  profileHash: string;
}

export interface LifeContextSignal {
  tier: 1 | 2 | 3;
  affectedDimensions: LifeDimension[];
  reason: string;
}

export interface ContributionDimensionDelta {
  dimension: LifeDimension;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
}

export interface ContributionGoalImpact {
  goalId?: string;
  goalTitle: string;
  progressBefore: number;
  progressAfter: number;
}

export interface ContributionStreakUpdate {
  dimension: LifeDimension;
  days: number;
  isMilestone: boolean;
}

export interface ContributionFeedback {
  logSummary: string;
  affectedDimensions: ContributionDimensionDelta[];
  goalImpacts?: ContributionGoalImpact[];
  streakUpdate?: ContributionStreakUpdate;
}

export interface DimensionLogAccumulator {
  counts: Partial<Record<LifeDimension, number>>;
  weekOf: string;
}

export interface SessionDelta {
  dimension: LifeDimension;
  previousScore: number;
  currentScore: number;
  delta: number;
  reason?: string;
}

export interface DashboardPreferences {
  isSnapshotExpanded: boolean;
  selectedDimension: LifeDimension;
  dismissedProfileGaps: Record<string, number>;
}

export interface TaskLineage {
  goalId?: string;
  goalTitle?: string;
  recommendationId?: string;
  recommendationTitle?: string;
}

export interface DailyIntelligenceDimensionGap {
  dimension: LifeDimension;
  daysSinceLastLog: number;
  label: string;
}

export interface DailyIntelligenceStreakRisk {
  dimension: LifeDimension;
  currentStreak: number;
  breaksToday: boolean;
}

export interface DailyIntelligenceEventCountdown {
  event: TimelineEvent;
  daysUntil: number;
  prepReady: boolean;
  urgencyLabel: string;
}

export interface DailyIntelligenceGoalDeadline {
  goal: Goal;
  daysLeft: number;
  onTrack: boolean;
  urgencyLabel: string;
}

export interface DailyIntelligenceCommitment {
  commitment: string;
  fulfilled: boolean;
}

export interface DailyIntelligence {
  dimensionGaps: DailyIntelligenceDimensionGap[];
  streaksAtRisk: DailyIntelligenceStreakRisk[];
  eventCountdowns: DailyIntelligenceEventCountdown[];
  goalDeadlines: DailyIntelligenceGoalDeadline[];
  todaysCommitments: DailyIntelligenceCommitment[];
  dailyPlanStale: boolean;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface PreComputedMetrics {
  bmi: number | null;
  bmiCategory: string | null;
  baselineSleepHours: number | null;
  loggedSleepAvg: number | null;
  exerciseSessionsThisWeek: number;
  exerciseTarget: number;
  exerciseAdherence: number;
  daysSinceLastExercise: number | null;
  savingsRate: number | null;
  netWorth: number | null;
  emergencyFundMonths: number | null;
  debtToIncomeRatio: number | null;
  socialInteractions14d: number;
  innerCircleGaps: { name: string; role: string; daysSinceContact: number }[];
  commitmentsFulfilled7d: number;
  commitmentsTotal: number;
  practiceSessionsThisWeek: number;
  practiceTarget: number;
  practiceAdherence: number;
  daysSinceLastPractice: number | null;
  careerLogsThisMonth: number;
  interestLogsThisMonth: number;
  growthLogsThisMonth: number;
  statedInterests: string[];
  dimensionLogCounts30d: Partial<Record<LifeDimension, number>>;
}

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

export interface Language {
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Intermediate' | 'Basic';
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
    origin: string; // Hometown
    ethnicity: string;
    languages?: Language[];
    lastUpdated?: number;
  };
  personal: {
    jobRole: string;
    company: string;
    interests: string[];
    personalityType?: string; // MBTI / Enneagram
    communicationStyle?: string; // Direct, Storyteller, etc.
    archetype?: string; // The Creator, The Sage, etc.
    lastUpdated?: number;
  };
  health: {
    height: string;
    weight: string;
    bloodPressure?: string;
    restingHeartRate?: string;
    sleepTime: string;
    wakeTime: string;
    activities: string[];
    activityFrequency: string;
    conditions: string[];
    medications: string[];
    chronotype?: string; // Lark / Owl
    healthGoals?: string[]; // Lose Weight, Build Muscle, Better Sleep, etc.
    lastUpdated?: number;
  };
  finances: {
    assetsTotal: string;
    assetsBreakdown: { cash: string; investments: string; property: string; other: string };
    liabilities: string;
    income: string;
    fixedCosts: string;
    variableCosts: string;
    investmentStrategy?: string; // Aggressive, Conservative
    financialGoals?: string[]; // Emergency Fund, Pay Off Debt, Save for House, etc.
    lastUpdated?: number;
  };
  relationship: {
    relationshipStatus: string; // Moved here/Formalized
    livingArrangement: string;
    socialEnergy: string;
    loveLanguage?: string;
    attachmentStyle?: string; // Secure, Anxious, Avoidant
    familyDynamic?: string;
    friendshipStyle?: string; // Low maintenance, High frequency
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
    sources?: string[]; // Added for multi-source grounding
    version?: number;
    eventId?: string;
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
  lifeContextSignal?: LifeContextSignal;
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
  eventId?: string;
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

export interface BaselineSwotEntry {
  dimension: Category;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  confidence: string; // e.g., "profile", "signal"
  nextAction: string;
  scoreEstimate?: number; // 0-100 profile-derived score
}

export const createEmptySnapshot = (dimension: LifeDimension): DimensionContextSnapshot => {
  const guidance: Record<
    LifeDimension,
    {
      insight: string;
      gap: string;
      nextStep: string;
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    }
  > = {
    [Category.HEALTH]: {
      insight: 'Health analysis requires your biometric and activity data to begin scoring.',
      gap: 'Missing baseline biometrics for health scoring.',
      nextStep: 'Log a workout, sleep report, or symptom to activate health tracking.',
      strengths: ['Profile includes activity preferences — a strong starting foundation.'],
      weaknesses: ['No verified health outcomes yet to score against.'],
      opportunities: ['A single workout log activates exercise adherence tracking.'],
      threats: ['Without baseline data, health risks cannot be assessed.'],
    },
    [Category.FINANCE]: {
      insight: 'Finance analysis requires income, expense, and asset data to begin scoring.',
      gap: 'Missing income or expense data for financial scoring.',
      nextStep: 'Log an expense or update your monthly budget to activate finance tracking.',
      strengths: ['Financial profile structure is in place.'],
      weaknesses: ['No spending patterns verified yet.'],
      opportunities: ['Adding your cash position unlocks emergency fund scoring.'],
      threats: ['Savings rate and debt ratio cannot be monitored without income data.'],
    },
    [Category.RELATIONSHIPS]: {
      insight: 'Relationship analysis requires social interaction data to begin scoring.',
      gap: 'No social touchpoints recorded yet.',
      nextStep: 'Log a conversation, date, or social event to activate relationship tracking.',
      strengths: ['Relationship preferences are configured.'],
      weaknesses: ['No connection frequency data to analyze.'],
      opportunities: ['One social log activates your 14-day interaction tracker.'],
      threats: ['Inner circle engagement gaps cannot be detected without data.'],
    },
    [Category.SPIRITUAL]: {
      insight: 'Spiritual analysis requires practice or reflection data to begin scoring.',
      gap: 'No practice sessions or reflections recorded.',
      nextStep: 'Log a meditation, prayer, or reflection to activate spiritual tracking.',
      strengths: ['Core values and worldview are articulated.'],
      weaknesses: ['Practice consistency cannot be measured yet.'],
      opportunities: ['A single practice log activates adherence tracking against your pulse.'],
      threats: ['Values-behavior alignment cannot be verified without practice data.'],
    },
    [Category.PERSONAL]: {
      insight: 'Personal growth analysis requires career or interest activity data to begin scoring.',
      gap: 'No career updates or skill-building logs yet.',
      nextStep: 'Log a work milestone, learning session, or project update to activate tracking.',
      strengths: ['Professional identity and interests are defined.'],
      weaknesses: ['Growth trajectory has no data points to track.'],
      opportunities: ['One career or learning log activates your monthly growth score.'],
      threats: ['Skill stagnation risk cannot be assessed without activity data.'],
    },
  };

  const g = guidance[dimension];
  return {
    dimension,
    status: 'no_signal',
    score: 0,
    trend: 'stable',
    delta: 0,
    insight: g.insight,
    gap: g.gap,
    nextStep: g.nextStep,
    swot: {
      strengths: g.strengths,
      weaknesses: g.weaknesses,
      opportunities: g.opportunities,
      threats: g.threats,
    },
    scoreExplanation: {
      summary: `${dimension} score is 0 — awaiting first data point to begin analysis.`,
      drivers: ['No outcome data available for scoring.'],
      peerComparison: 'Peer comparison activates after the first data point is logged.',
      confidence: 'low',
    },
    missingData: [],
    fidelityLevel: 0,
    generatedAt: new Date().toISOString(),
  };
};

export interface DimensionSignal {
  category: Category;
  score: number;
  delta: number;
  trend: 'up' | 'down' | 'stable';
  updatedAt: number;
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

export interface Event {
  id: string;
  title: string;
  time: string;
  location: string;
  description: string;
  prepRecommendations: string[];
}
