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
} from './types';

const HYPER_PERSONALIZED_PROMPT = `
You are the Chief of Staff for a high-performance individual within the Areté framework. Your task is to provide hyper-personalized, tactical guidance based on a deep analysis of their Life OS data to achieve excellence (Areté).

INPUT DATA:
- ACTIVE_PROFILE: {{profile}}
- MEMORY_CONTEXT: {{history}}
- FAMILY_CONTEXT: {{family}}
- FINANCE_METRICS: {{financeMetrics}}
- MISSING_DATA: {{missingData}}
- CURRENT_DATE: {{currentDate}}

INSTRUCTIONS:
1. DATA-GROUNDED RATIONALE: Every recommendation MUST reference a specific fact from MEMORY_CONTEXT or a field in ACTIVE_PROFILE.
2. VALUE ALIGNMENT: Check if tasks align with the user's Spiritual coreValues. Flag "Moral Friction" if they contradict.
3. TACTICAL PRECISION: Provide an "Operating Manual" for every task. Never leave the user hanging.
4. DEFINITION OF DONE (DoD): Specify exactly what "completed" looks like for every item.
5. FINANCE NUMBERS: If FINANCE_METRICS is present, include daily/weekly budgets and savings rate in finance guidance.
6. HEALTH SAFETY: If ACTIVE_PROFILE.health.conditions includes "fatty liver", provide non-diagnostic guidance (diet pattern, alcohol avoidance, activity targets) and suggest clinician follow-up for symptoms or abnormal labs.
7. MISSING DATA: If MISSING_DATA is non-empty, include a "missingData" list with up to 3 items that would improve confidence.

OUTPUT SCHEMA:
{
  "recommendations": [
    {
      "category": "Health|Finance|Relationships|Spiritual|Work",
      "title": "Tactical Headline",
      "description": "Short objective summary",
      "impactScore": 1-10,
      "rationale": "Direct citation from memory/profile",
      "steps": ["Atomic step 1", "Atomic step 2"],
      "estimatedTime": "e.g. 15 mins",
      "inputs": ["Required tools, files, or people"],
      "definitionOfDone": "Clear verification criteria",
      "risks": ["Potential failure mode 1"],
      "resonanceScore": 1-100, // How well this aligns with core values
      "confidence": 0-100,
      "missingData": ["string"]
    }
  ],
  "tasks": [
    {
      "title": "Headline",
      "category": "Domain",
      "priority": "low|medium|high",
      "methodology": "The high-fidelity SOP string on HOW to execute this perfectly",
      "steps": ["Step 1", "Step 2"],
      "definitionOfDone": "Specific success signal",
      "valueResonance": "High|Medium|Low",
      "confidence": 0-100,
      "missingData": ["string"]
    }
  ]
}
`;

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
  familyMembers: UserProfile[] = []
): Promise<any> =>
  callGemini(
    'processInput',
    { input, history, activeProfile, files, promptConfig, familyMembers },
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
  promptConfig: PromptConfig
): Promise<DailyTask[]> =>
  callGemini(
    'generateDailyPlan',
    { profile, timeline, goals, blindSpots, ruleOfLife, promptConfig },
    []
  );

export const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: 'internalization',
    name: 'Neural Internalization',
    purpose: 'Extracts atomic facts and vault updates from user input for the Areté OS.',
    template:
      'Analyze: {{input}}. Resolve Owner: names/pronouns in {{family}}. Current Facts: {{history}}. Active: {{profile}}. Output facts and mutations.',
    defaultTemplate:
      'Analyze: {{input}}. Resolve Owner: names/pronouns in {{family}}. Current Facts: {{history}}. Active: {{profile}}. Output facts and mutations.',
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
