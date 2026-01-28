import {
  Category,
  BlindSpot,
  DailyTask,
  Goal,
  MemoryEntry,
  PromptConfig,
  ProactiveInsight,
  Recommendation,
  TimelineEvent,
  UserProfile,
  FinanceMetrics,
  AlwaysChip,
  RuleOfLife,
} from '../data/types';
import { HYPER_PERSONALIZED_PROMPT, LOG_BAR_INGEST_PROMPT } from './prompts';

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
    },
    { recommendations: [], tasks: [] }
  );

export const generateEventPrepPlan = async (
  event: TimelineEvent,
  profile: UserProfile,
  history: MemoryEntry[]
): Promise<Recommendation> =>
  callGemini(
    'generateEventPrepPlan',
    { event, profile, history },
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
      currentDate: new Date().toISOString()
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
    },
    []
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
  ruleOfLife: RuleOfLife
): Promise<DeepInitializationResult> =>
  callGemini(
    'generateDeepInitialization',
    { profile, ruleOfLife },
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
];
