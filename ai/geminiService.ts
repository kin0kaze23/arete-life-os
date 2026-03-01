import {
  Category,
  BlindSpot,
  DailyTask,
  Goal,
  GuidanceDigest,
  GuidanceQuestion,
  MemoryEntry,
  PromptConfig,
  ProactiveInsight,
  Recommendation,
  StrategicBriefing,
  TimelineEvent,
  UserProfile,
  FinanceMetrics,
  AlwaysChip,
  Claim,
  RuleOfLife,
} from '../data/types';
import {
  HYPER_PERSONALIZED_PROMPT,
  LOG_BAR_INGEST_PROMPT,
  DAILY_INTELLIGENCE_BATCH_PROMPT,
  GUIDANCE_DIGEST_PROMPT,
} from './prompts';

const callGemini = async <T>(action: string, payload: Record<string, unknown>, fallback: T) => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return fallback;
    }
    const response = await fetch('/api/gemini', {
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

export const askAura = async (
  text: string,
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig
): Promise<{ text: string; sources: { title: string; uri: string }[] }> =>
  callGemini(
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
  callGemini(
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
  callGemini(
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
): Promise<any> =>
  callGemini(
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

export const generateTasks = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  context?: PromptContext
): Promise<DailyTask[]> =>
  callGemini(
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
  callGemini(
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
  callGemini(
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
  callGemini(
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

export const generateStrategicBriefing = async (
  history: MemoryEntry[],
  profile: UserProfile,
  context?: PromptContext
): Promise<StrategicBriefing | null> =>
  callGemini(
    'generateStrategicBriefing',
    {
      history,
      profile,
      familyMembers: context?.familyMembers,
      financeMetrics: context?.financeMetrics,
      missingData: context?.missingData,
      claims: context?.claims,
    },
    null
  );

export const generateGuidanceDigest = async (
  history: MemoryEntry[],
  profile: UserProfile,
  doCandidates: Recommendation[],
  watchCandidates: BlindSpot[],
  questionCandidates: GuidanceQuestion[],
  context?: PromptContext & { externalScanEnabled?: boolean }
): Promise<GuidanceDigest | null> =>
  callGemini(
    'generateGuidanceDigest',
    {
      history,
      profile,
      doCandidates,
      watchCandidates,
      questionCandidates,
      familyMembers: context?.familyMembers,
      financeMetrics: context?.financeMetrics,
      missingData: context?.missingData,
      claims: context?.claims,
      externalScanEnabled: context?.externalScanEnabled,
    },
    null
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
  callGemini(
    'generateDailyPlan',
    { profile, timeline, goals, blindSpots, ruleOfLife, promptConfig, history },
    []
  );

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
  callGemini(
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
    id: 'guidanceDigest',
    name: 'Guidance Digest',
    purpose: 'Ranks the best Do, Watch, and Ask items and adds grounded external context.',
    template: GUIDANCE_DIGEST_PROMPT,
    defaultTemplate: GUIDANCE_DIGEST_PROMPT,
  },
];
