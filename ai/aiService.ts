import {
  Category,
  CriticalPriority,
  DimensionContextSnapshot,
  DimensionScoreExplanation,
  DimensionSwot,
  BlindSpot,
  DailyTask,
  BaselineSwotEntry,
  Goal,
  IntakeResult,
  LIFE_DIMENSIONS,
  LifeDimension,
  LifeContextSignal,
  MemoryEntry,
  PreComputedMetrics,
  ProfileGap,
  PromptConfig,
  ProactiveInsight,
  Recommendation,
  TimelineEvent,
  UserProfile,
  FinanceMetrics,
  AlwaysChip,
  Claim,
  RuleOfLife,
  createEmptySnapshot,
} from '../data/types';
import {
  HYPER_PERSONALIZED_PROMPT,
  LOG_BAR_INGEST_PROMPT,
  DAILY_INTELLIGENCE_BATCH_PROMPT,
  BASELINE_SWOT_PROMPT,
  DIMENSION_CONTEXT_PROMPT,
  LIFE_SNAPSHOT_SYNTHESIS_PROMPT,
} from './prompts';

const callAI = async <T>(action: string, payload: Record<string, unknown>, fallback: T) => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return fallback;
    }
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    const json = (await response.json()) as T & { error?: string };
    if (!response.ok || (json && typeof json === 'object' && 'error' in json)) {
      return fallback;
    }
    return json as T;
  } catch (e) {
    return fallback;
  }
};

type PromptContext = {
  familyMembers?: UserProfile[];
  financeMetrics?: FinanceMetrics | null;
  missingData?: string[];
  claims?: Claim[];
};

type ProcessInputResult = IntakeResult & {
  facts?: unknown[];
  proposedUpdates?: unknown[];
  headline?: string;
  sourceId?: string;
  missingFields?: string[];
  [key: string]: unknown;
};

const LIFE_DIMENSION_SET = new Set<LifeDimension>(LIFE_DIMENSIONS);

const normalizeLifeDimension = (value: unknown): LifeDimension | null => {
  if (typeof value !== 'string') return null;
  if (value === Category.HEALTH) return Category.HEALTH;
  if (value === Category.FINANCE) return Category.FINANCE;
  if (value === Category.RELATIONSHIPS || value === 'Social') return Category.RELATIONSHIPS;
  if (value === Category.SPIRITUAL) return Category.SPIRITUAL;
  if (value === Category.PERSONAL) return Category.PERSONAL;
  return null;
};

const normalizeLifeContextSignal = (value: unknown): LifeContextSignal | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const signal = value as Record<string, unknown>;
  const tier = signal.tier;
  if (tier !== 1 && tier !== 2 && tier !== 3) return undefined;
  const affected = Array.isArray(signal.affectedDimensions)
    ? signal.affectedDimensions
        .map((dim) => normalizeLifeDimension(dim))
        .filter((dim): dim is LifeDimension => Boolean(dim))
    : [];
  const reason = typeof signal.reason === 'string' ? signal.reason.trim() : '';
  if (affected.length === 0 || reason.length === 0) return undefined;
  return { tier, affectedDimensions: affected, reason };
};

const normalizeProcessInputResult = (result: unknown): ProcessInputResult => {
  const fallback: ProcessInputResult = {
    intent: 'unknown',
    items: [],
    missingData: [],
    confidence: 0,
  };
  if (!result || typeof result !== 'object') return fallback;
  const raw = result as Record<string, unknown>;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const normalizedItems = items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => {
      const lifeContextSignal = normalizeLifeContextSignal(item.lifeContextSignal);
      return {
        ...item,
        ...(lifeContextSignal ? { lifeContextSignal } : {}),
      };
    });
  const normalized: ProcessInputResult = {
    ...raw,
    intent: typeof raw.intent === 'string' ? (raw.intent as IntakeResult['intent']) : 'unknown',
    items: normalizedItems as IntakeResult['items'],
    missingData: Array.isArray(raw.missingData)
      ? raw.missingData.filter((v): v is string => typeof v === 'string')
      : [],
    needsReview:
      raw.needsReview && typeof raw.needsReview === 'object'
        ? (raw.needsReview as IntakeResult['needsReview'])
        : undefined,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
  };
  if (Array.isArray(raw.facts)) {
    normalized.facts = raw.facts.filter(
      (fact): fact is Record<string, unknown> => Boolean(fact) && typeof fact === 'object'
    );
  }
  if (Array.isArray(raw.proposedUpdates)) {
    normalized.proposedUpdates = raw.proposedUpdates.filter(
      (update): update is Record<string, unknown> => Boolean(update) && typeof update === 'object'
    );
  }
  if (typeof raw.headline === 'string') {
    normalized.headline = raw.headline;
  }
  if (typeof raw.sourceId === 'string') {
    normalized.sourceId = raw.sourceId;
  }
  if (Array.isArray(raw.missingFields)) {
    normalized.missingFields = raw.missingFields.filter(
      (field): field is string => typeof field === 'string'
    );
  }
  return normalized;
};

const normalizeSwotItems = (value: unknown, fallback: string): string[] => {
  if (!Array.isArray(value)) return [fallback];
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 2);
  return cleaned.length > 0 ? cleaned : [fallback];
};

const resolveSnapshotSwot = (
  swot: unknown,
  fallback: {
    insight: string;
    gap: string;
    nextStep: string;
    projection?: string;
    fidelityLevel: 0 | 1 | 2 | 3;
    status: DimensionContextSnapshot['status'];
  }
): DimensionSwot => {
  const value = swot && typeof swot === 'object' ? (swot as Record<string, unknown>) : {};
  const defaultWeakness =
    fallback.gap && fallback.gap.trim().length > 0
      ? fallback.gap
      : 'Key data points needed for a precise assessment.';
  const defaultThreat =
    typeof fallback.projection === 'string' && fallback.projection.trim().length > 0
      ? fallback.projection
      : fallback.status === 'critical'
        ? 'Current trajectory may worsen if no corrective action is taken.'
        : 'Refresh to assess current risk trajectory.';

  return {
    strengths: normalizeSwotItems(value.strengths, fallback.insight),
    weaknesses: normalizeSwotItems(value.weaknesses, defaultWeakness),
    opportunities: normalizeSwotItems(value.opportunities, fallback.nextStep),
    threats: normalizeSwotItems(value.threats, defaultThreat),
  };
};

const resolveScoreConfidence = (value: unknown, fidelityLevel: 0 | 1 | 2 | 3) => {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  if (fidelityLevel >= 3) return 'high' as const;
  if (fidelityLevel >= 2) return 'medium' as const;
  return 'low' as const;
};

const resolveScoreExplanation = (
  scoreExplanation: unknown,
  fallback: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    delta: number;
    fidelityLevel: 0 | 1 | 2 | 3;
  }
): DimensionScoreExplanation => {
  const value =
    scoreExplanation && typeof scoreExplanation === 'object'
      ? (scoreExplanation as Record<string, unknown>)
      : {};
  const summary =
    typeof value.summary === 'string' && value.summary.trim().length > 0
      ? value.summary.trim()
      : `Score ${fallback.score} — refresh for a detailed breakdown based on your data.`;
  const drivers = Array.isArray(value.drivers)
    ? value.drivers
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 3)
    : [];
  const peerComparison =
    typeof value.peerComparison === 'string' && value.peerComparison.trim().length > 0
      ? value.peerComparison.trim()
      : 'Peer comparison available after first dimension refresh.';
  return {
    summary,
    drivers:
      drivers.length > 0
        ? drivers
        : [
            `Trend is ${fallback.trend} (${fallback.delta >= 0 ? '+' : ''}${fallback.delta}).`,
          ],
    peerComparison,
    confidence: resolveScoreConfidence(value.confidence, fallback.fidelityLevel),
  };
};

const emptyDimensionSnapshot = createEmptySnapshot;

export const askAura = async (
  text: string,
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig
): Promise<{ text: string; sources: { title: string; uri: string }[] }> =>
  callAI(
    'askAura',
    { text, history, profile, promptConfig },
    { text: 'Oracle connection unstable.', sources: [] }
  );

export const generateDeepTasks = async (
  profile: UserProfile,
  history: MemoryEntry[],
  familyMembers: UserProfile[],
  promptConfig: PromptConfig,
  context?: PromptContext
): Promise<{ recommendations: Recommendation[]; tasks: DailyTask[] }> =>
  callAI(
    'generateDeepTasks',
    {
      profile,
      history,
      familyMembers,
      promptConfig,
      financeMetrics: context?.financeMetrics,
      missingData: context?.missingData,
      claims: context?.claims,
    },
    { recommendations: [], tasks: [] }
  );

export const generateEventPrepPlan = async (
  event: TimelineEvent,
  profile: UserProfile,
  history: MemoryEntry[],
  enableSearch = true
): Promise<Recommendation> =>
  callAI(
    'generateEventPrepPlan',
    { event, profile, history, enableSearch },
    {
      id: `prep-${Date.now()}`,
      ownerId: profile.id,
      category: Category.GENERAL,
      title: 'Preparation Plan',
      description: 'Unable to generate a preparation plan.',
      impactScore: 0,
      rationale: 'AI request failed.',
      steps: [],
      estimatedTime: 'N/A',
      inputs: [],
      definitionOfDone: 'Plan generated successfully.',
      risks: [],
      createdAt: Date.now(),
      status: 'ACTIVE',
      needsReview: true,
      missingFields: ['category', 'title', 'description', 'steps'],
      evidenceLinks: { claims: [], sources: [] },
    }
  );

export const processInput = async (
  input: string,
  history: MemoryEntry[],
  activeProfile: UserProfile,
  files: any[] | undefined,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  fileMeta?: { name?: string; mimeType: string; size?: number }[]
): Promise<any> => {
  const raw = await callAI(
    'processInput',
    {
      input,
      history,
      activeProfile,
      files,
      promptConfig,
      familyMembers,
      fileMeta,
      currentDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD in local time
    },
    {}
  );
  return normalizeProcessInputResult(raw);
};

export const generateTasks = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  context?: PromptContext
): Promise<DailyTask[]> =>
  callAI(
    'generateTasks',
    {
      history,
      profile,
      promptConfig,
      familyMembers: context?.familyMembers,
      financeMetrics: context?.financeMetrics,
      missingData: context?.missingData,
      claims: context?.claims,
    },
    []
  );

export const generateInsights = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  context?: PromptContext
): Promise<ProactiveInsight[]> =>
  callAI(
    'generateInsights',
    {
      history,
      profile,
      promptConfig,
      familyMembers: context?.familyMembers,
      financeMetrics: context?.financeMetrics,
      missingData: context?.missingData,
      claims: context?.claims,
    },
    []
  );

export const generateBlindSpots = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  context?: PromptContext
): Promise<BlindSpot[]> =>
  callAI(
    'generateBlindSpots',
    {
      history,
      profile,
      promptConfig,
      familyMembers: context?.familyMembers,
      financeMetrics: context?.financeMetrics,
      missingData: context?.missingData,
      claims: context?.claims,
    },
    []
  );

export const dailyIntelligenceBatch = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  context?: PromptContext
): Promise<{ tasks: DailyTask[]; insights: ProactiveInsight[]; blindSpots: BlindSpot[] }> =>
  callAI(
    'dailyIntelligenceBatch',
    {
      history,
      profile,
      promptConfig,
      familyMembers: context?.familyMembers,
      financeMetrics: context?.financeMetrics,
      missingData: context?.missingData,
      claims: context?.claims,
    },
    { tasks: [], insights: [], blindSpots: [] }
  );

export const generateDailyPlan = async (
  profile: UserProfile,
  timeline: TimelineEvent[],
  goals: Goal[],
  blindSpots: BlindSpot[],
  ruleOfLife: any,
  promptConfig: PromptConfig,
  history: MemoryEntry[]
): Promise<DailyTask[]> =>
  callAI(
    'generateDailyPlan',
    { profile, timeline, goals, blindSpots, ruleOfLife, promptConfig, history },
    []
  );

export const generateBaselineSwot = async (
  profile: UserProfile,
  goals: Goal[],
  promptConfig: PromptConfig
): Promise<BaselineSwotEntry[]> =>
  callAI(
    'generateBaselineSwot',
    { profile, goals, promptConfig },
    []
  );

export const refreshDimensionContexts = async (
  dimensions: LifeDimension[],
  profile: UserProfile,
  memoryByDimension: Partial<Record<LifeDimension, MemoryEntry[]>>,
  goalsByDimension: Partial<Record<LifeDimension, Goal[]>>,
  previousSnapshots: Partial<Record<LifeDimension, DimensionContextSnapshot>>,
  preComputedMetrics?: Partial<PreComputedMetrics> | null,
  promptConfig?: PromptConfig
): Promise<DimensionContextSnapshot[]> => {
  const requested = dimensions.filter((dimension) => LIFE_DIMENSION_SET.has(dimension));
  if (requested.length === 0) return [];

  const payload = {
    dimensions: requested,
    profile,
    memoryByDimension,
    goalsByDimension,
    previousSnapshots,
    preComputedMetrics,
    promptConfig,
    currentDate: new Date().toISOString(),
  };

  const raw = await callAI(
    'refreshDimensionContexts',
    payload,
    { snapshots: [] as DimensionContextSnapshot[] }
  );

  const rawSnapshots = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.snapshots)
      ? (raw as any).snapshots
      : [];

  const byDimension = new Map<LifeDimension, DimensionContextSnapshot>();

  rawSnapshots.forEach((snapshot: any) => {
    const dimension = normalizeLifeDimension(snapshot?.dimension);
    if (!dimension) return;
    const status = ['thriving', 'stable', 'needs_attention', 'critical', 'no_signal'].includes(
      snapshot?.status
    )
      ? snapshot.status
      : 'no_signal';
    const trend = ['up', 'down', 'stable'].includes(snapshot?.trend) ? snapshot.trend : 'stable';
    const fidelity = [0, 1, 2, 3].includes(snapshot?.fidelityLevel) ? snapshot.fidelityLevel : 0;
    const insight =
      typeof snapshot?.insight === 'string' && snapshot.insight.trim().length > 0
        ? snapshot.insight
        : 'No current insight available.';
    const gap =
      typeof snapshot?.gap === 'string' && snapshot.gap.trim().length > 0
        ? snapshot.gap
        : 'No primary gap identified.';
    const nextStep =
      typeof snapshot?.nextStep === 'string' && snapshot.nextStep.trim().length > 0
        ? snapshot.nextStep
        : 'Log a short update for this dimension.';
    const projection = typeof snapshot?.projection === 'string' ? snapshot.projection : undefined;
    const score =
      typeof snapshot?.score === 'number'
        ? Math.max(0, Math.min(100, Math.round(snapshot.score)))
        : 0;
    const normalized: DimensionContextSnapshot = {
      dimension,
      status,
      score,
      trend,
      delta: typeof snapshot?.delta === 'number' ? snapshot.delta : 0,
      insight,
      gap,
      nextStep,
      swot: resolveSnapshotSwot(snapshot?.swot, {
        insight,
        gap,
        nextStep,
        projection,
        fidelityLevel: fidelity,
        status,
      }),
      scoreExplanation: resolveScoreExplanation(snapshot?.scoreExplanation, {
        score,
        trend,
        delta: typeof snapshot?.delta === 'number' ? snapshot.delta : 0,
        fidelityLevel: fidelity,
      }),
      projection,
      missingData: Array.isArray(snapshot?.missingData)
        ? snapshot.missingData.filter((x: unknown): x is string => typeof x === 'string')
        : [],
      fidelityLevel: fidelity,
      generatedAt:
        typeof snapshot?.generatedAt === 'string' ? snapshot.generatedAt : new Date().toISOString(),
      triggeredBy: typeof snapshot?.triggeredBy === 'string' ? snapshot.triggeredBy : undefined,
    };
    byDimension.set(dimension, normalized);
  });

  return requested.map((dimension) => {
    const resolved = byDimension.get(dimension) || previousSnapshots[dimension] || emptyDimensionSnapshot(dimension);
    return {
      ...resolved,
      swot: resolveSnapshotSwot(resolved.swot, {
        insight: resolved.insight,
        gap: resolved.gap,
        nextStep: resolved.nextStep,
        projection: resolved.projection,
        fidelityLevel: resolved.fidelityLevel,
        status: resolved.status,
      }),
      scoreExplanation: resolveScoreExplanation(resolved.scoreExplanation, {
        score: resolved.score,
        trend: resolved.trend,
        delta: resolved.delta,
        fidelityLevel: resolved.fidelityLevel,
      }),
    };
  });
};

export const generateLifeSnapshot = async (
  profile: UserProfile,
  dimensionSnapshots: DimensionContextSnapshot[],
  promptConfig?: PromptConfig
): Promise<{
  narrativeParagraph: string;
  criticalPriorities: CriticalPriority[];
  profileGaps: ProfileGap[];
}> => {
  const fallback = {
    narrativeParagraph: 'Not enough verified life context yet. Log a few check-ins to unlock a full snapshot.',
    criticalPriorities: [] as CriticalPriority[],
    profileGaps: [] as ProfileGap[],
  };

  const raw = await callAI(
    'generateLifeSnapshot',
    {
      profile,
      dimensionSnapshots,
      promptConfig,
      currentDate: new Date().toISOString(),
    },
    fallback
  );

  if (!raw || typeof raw !== 'object') return fallback;
  const value = raw as Record<string, unknown>;
  const narrativeParagraph =
    typeof value.narrativeParagraph === 'string' && value.narrativeParagraph.trim().length > 0
      ? value.narrativeParagraph
      : fallback.narrativeParagraph;
  const criticalPriorities = Array.isArray(value.criticalPriorities)
    ? (value.criticalPriorities.filter(
        (p): p is CriticalPriority =>
          p &&
          typeof p === 'object' &&
          Boolean(normalizeLifeDimension((p as any).dimension)) &&
          typeof (p as any).title === 'string' &&
          typeof (p as any).rationale === 'string' &&
          typeof (p as any).consequence === 'string'
      ) as CriticalPriority[])
    : [];
  const profileGaps = Array.isArray(value.profileGaps)
    ? (value.profileGaps.filter(
        (g): g is ProfileGap =>
          g &&
          typeof g === 'object' &&
          typeof (g as any).field === 'string' &&
          Boolean(normalizeLifeDimension((g as any).dimension)) &&
          typeof (g as any).prompt === 'string' &&
          typeof (g as any).impactDescription === 'string'
      ) as ProfileGap[])
    : [];

  return {
    narrativeParagraph,
    criticalPriorities,
    profileGaps,
  };
};

export interface DeepInitializationResult {
  doItems: DailyTask[];
  watchItems: BlindSpot[];
  alwaysDo: AlwaysChip[];
  alwaysWatch: AlwaysChip[];
  domainRecommendations: Record<string, Recommendation[]>;
  personalizedGreeting: string;
}

export const generateDeepInitialization = async (
  profile: UserProfile,
  ruleOfLife: RuleOfLife,
  history: MemoryEntry[] = [],
  claims: Claim[] = []
): Promise<DeepInitializationResult> =>
  callAI(
    'generateDeepInitialization',
    { profile, ruleOfLife, history, claims },
    {
      doItems: [],
      watchItems: [],
      alwaysDo: [],
      alwaysWatch: [],
      domainRecommendations: {},
      personalizedGreeting: `Welcome to Areté, ${profile.identify.name || 'there'}.`,
    }
  );

export const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: 'internalization',
    name: 'Neural Internalization',
    purpose: 'Extracts atomic facts and vault updates from user input for the Areté OS.',
    template: LOG_BAR_INGEST_PROMPT,
    defaultTemplate: LOG_BAR_INGEST_PROMPT,
  },
  {
    id: 'oracle',
    name: 'Areté Oracle',
    purpose: 'Personal advisor speaking from data context with a focus on excellence.',
    template: 'Areté Oracle. Context: {{profile}}, History: {{history}}. Query: {{input}}',
    defaultTemplate: 'Areté Oracle. Context: {{profile}}, History: {{history}}. Query: {{input}}',
  },
  {
    id: 'deepPlanning',
    name: 'Executive Operations',
    purpose:
      'Generates hyper-personalized recommendations with tactical steps and success criteria for Areté.',
    template: HYPER_PERSONALIZED_PROMPT,
    defaultTemplate: HYPER_PERSONALIZED_PROMPT,
  },
  {
    id: 'dailyBatch',
    name: 'Daily Intelligence Batch',
    purpose: 'Generates daily tasks, insights, and blind spots in a single batch.',
    template: DAILY_INTELLIGENCE_BATCH_PROMPT,
    defaultTemplate: DAILY_INTELLIGENCE_BATCH_PROMPT,
  },
  {
    id: 'baselineSwot',
    name: 'Baseline SWOT',
    purpose: 'Generates a profile-based SWOT for each life dimension.',
    template: BASELINE_SWOT_PROMPT,
    defaultTemplate: BASELINE_SWOT_PROMPT,
  },
  {
    id: 'dimensionContext',
    name: 'Dimension Context',
    purpose: 'Evaluates life dimensions with grounded scoring and fidelity levels.',
    template: DIMENSION_CONTEXT_PROMPT,
    defaultTemplate: DIMENSION_CONTEXT_PROMPT,
  },
  {
    id: 'lifeSnapshotSynthesis',
    name: 'Life Snapshot Synthesis',
    purpose: 'Synthesizes all dimension snapshots into a narrative and critical priorities.',
    template: LIFE_SNAPSHOT_SYNTHESIS_PROMPT,
    defaultTemplate: LIFE_SNAPSHOT_SYNTHESIS_PROMPT,
  },
];
