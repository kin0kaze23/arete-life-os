import {
  BASELINE_SWOT_PROMPT,
  DAILY_INTELLIGENCE_BATCH_PROMPT,
  DAILY_PLAN_PROMPT,
  DIMENSION_CONTEXT_PROMPT,
  DOMAIN_PROMPTS,
  HYPER_PERSONALIZED_PROMPT,
  LIFE_SNAPSHOT_SYNTHESIS_PROMPT,
  STRATEGIC_BRIEFING_PROMPT,
  buildCompactProfile,
  buildDailyDigest,
  buildDimensionContext,
  buildFeedbackContext,
  buildLifeContextPersonalizationContext,
  buildMemoryContext,
  buildProfileForDimension,
  normalizePreComputedMetrics,
} from '../ai/prompts.js';

import {
  BaselineSwotSchema,
  CriticalPrioritySchema,
  DimensionContextSnapshotSchema,
  LifeSnapshotSynthesisSchema,
  ProfileGapSchema,
  RecommendationSchema,
  TaskSchema,
  validateAIOutput,
} from '../ai/validators.js';
import type {
  BaselineSwotEntry,
  BlindSpot,
  CriticalPriority,
  DailyTask,
  DimensionContextSnapshot,
  DimensionSwot,
  Goal,
  LifeDimension,
  MemoryEntry,
  PreComputedMetrics,
  ProfileGap,
  PromptConfig,
  ProactiveInsight,
  Recommendation,
  StrategicBriefing,
  TimelineEvent,
  UserProfile,
  FinanceMetrics,
} from '../data/types.js';
import { Category, LIFE_DIMENSIONS, createEmptySnapshot } from '../data/types.js';
import { processInput as processInputAction } from './_aiActions/processInput.js';
import { modelRouter } from './_modelRouter.js';
import { sanitizePayload, validatePayloadSize } from './_sanitize.js';
import { fillTemplate } from './_aiConfig.js';
import { z } from 'zod';

const domainContext = Object.entries(DOMAIN_PROMPTS)
  .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
  .join('\n');

const LIFE_DIMENSION_SET = new Set<LifeDimension>(LIFE_DIMENSIONS);

const BASELINE_DIMENSIONS: LifeDimension[] = [...LIFE_DIMENSIONS];

const StrategicBriefingItemSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  action: z.string().min(1),
});

const StrategicBriefingSchema = z.object({
  profileSummary: z.string().min(1),
  focusQuestion: z.string().min(1),
  summary: z.string().min(1),
  opportunities: z.array(StrategicBriefingItemSchema).max(3).default([]),
  risks: z.array(StrategicBriefingItemSchema).max(3).default([]),
  actions: z.array(z.string().min(1)).max(5).default([]),
});

const parseJSONObject = (raw: string) => {
  const text = raw.trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text.match(/```([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced.trim());
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('Unable to parse JSON payload');
  }
};

const normalizeBaselineDimension = (value: unknown): Category => {
  if (typeof value !== 'string') return Category.GENERAL;
  const cleaned = value.toLowerCase().trim();
  if (cleaned === 'social') return Category.RELATIONSHIPS;
  const match = Object.values(Category).find((c) => c.toLowerCase() === cleaned);
  return (match as Category) || Category.GENERAL;
};

const normalizeLifeDimension = (value: unknown): LifeDimension | null => {
  const normalized = normalizeBaselineDimension(value);
  return LIFE_DIMENSION_SET.has(normalized as LifeDimension) ? (normalized as LifeDimension) : null;
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
) => {
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

const askAura = async (
  text: string,
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig
) => {
  const toFallbackMessage = (err: unknown) => {
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message?: unknown }).message || '')
        : '';
    if (/missing .*api[_\s-]?key/i.test(message)) {
      return 'Assistant unavailable: AI credentials are missing on server.';
    }
    if (/rate.?limit|quota|too many requests/i.test(message)) {
      return 'Assistant is temporarily rate limited. Please retry in a minute.';
    }
    return 'Oracle connection unstable.';
  };

  const shouldUseSearchGrounding = (() => {
    const value = text.toLowerCase();
    if (value.includes('#research') || value.includes('[research]')) return true;
    return /\b(latest|today|current|news|market|price|weather|update|trend)\b/.test(value);
  })();

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(buildMemoryContext(history, [], 30)),
    input: text,
  });

  if (shouldUseSearchGrounding) {
    try {
      return await modelRouter.generateWithSearch('askAura', finalPrompt);
    } catch (err) {
      try {
        const fallbackText = await modelRouter.generateText('askAura', finalPrompt);
        return { text: fallbackText || 'Oracle connection unstable.', sources: [] };
      } catch (fallbackErr) {
        return { text: toFallbackMessage(fallbackErr ?? err), sources: [] };
      }
    }
  }

  try {
    const textOnly = await modelRouter.generateText('askAura', finalPrompt);
    return { text: textOnly || 'Oracle connection unstable.', sources: [] };
  } catch (err) {
    return { text: toFallbackMessage(err), sources: [] };
  }
};

const generateDeepTasks = async (
  profile: UserProfile,
  history: MemoryEntry[],
  familyMembers: UserProfile[],
  promptConfig: PromptConfig,
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[],
  claims?: any[]
): Promise<{ recommendations: Recommendation[]; tasks: DailyTask[] }> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const committedClaims = (claims || [])
    .filter((c: any) => c.status === 'COMMITTED')
    .slice(0, 20)
    .map((c: any) => ({ fact: c.fact, category: c.category, confidence: c.confidence }));

  const finalPrompt = `${fillTemplate(promptConfig.template || HYPER_PERSONALIZED_PROMPT, {
    profile: JSON.stringify(profile),
    family: JSON.stringify(memberContext),
    history: JSON.stringify(
      buildMemoryContext(
        history,
        [
          Category.HEALTH,
          Category.FINANCE,
          Category.PERSONAL,
          Category.SPIRITUAL,
          Category.RELATIONSHIPS,
        ],
        30
      ).map((m) => ({ content: m.content, facts: m.extractedFacts }))
    ),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    feedback: JSON.stringify(buildFeedbackContext(history)),
    verifiedFacts: JSON.stringify(committedClaims),
  })}\n\nDOMAIN FOCUS:\n${domainContext}`;

  const normalizeResult = (result: any) => {
    const rawRecs = Array.isArray(result?.recommendations) ? result.recommendations : [];
    const rawTasks = Array.isArray(result?.tasks) ? result.tasks : [];
    const validatedRecs = rawRecs
      .map((rec: unknown) => validateAIOutput(RecommendationSchema, rec))
      .filter(Boolean) as any[];
    const validatedTasks = rawTasks
      .map((task: unknown) => validateAIOutput(TaskSchema, task))
      .filter(Boolean) as any[];
    const timestamp = Date.now();
    return {
      recommendations: validatedRecs.map((r: any) => ({
        ...r,
        id: `rec-${timestamp}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: profile.id,
        createdAt: timestamp,
        status: 'ACTIVE',
      })),
      tasks: validatedTasks.map((t: any) => ({
        ...t,
        id: `deep-task-${timestamp}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: profile.id,
        createdAt: timestamp,
        completed: false,
      })),
    };
  };

  const result = await modelRouter.generateJSON('generateDeepTasks', finalPrompt);
  return normalizeResult(result);
};

const generateEventPrepPlan = async (
  event: TimelineEvent,
  profile: UserProfile,
  history: MemoryEntry[],
  enableSearch = false
): Promise<Recommendation> => {
  const prompt = `You are Areté. Generate a concise preparation plan for this event using only verified context or grounded search results. Do not invent specific facts.

EVENT: ${event.title}
DATE: ${event.date}
LOCATION: ${event.fields?.location || 'TBD'}
CATEGORY: ${event.category}

USER: ${profile.identify.name}
CONTEXT: ${JSON.stringify(
    buildMemoryContext(history, [], 8)
      .map((m) => m.content)
      .slice(0, 5)
  )}

Return JSON with: title, description, rationale (why this matters), steps (array of 3-5 actionable items), estimatedTime, definitionOfDone, inputs (what to bring/prepare), risks (array).`;

  const normalizeCategory = (value: unknown) => {
    const allowed = new Set(Object.values(Category));
    if (typeof value === 'string' && allowed.has(value as Category)) return value as Category;
    if (typeof event.category === 'string' && allowed.has(event.category as Category)) {
      return event.category as Category;
    }
    return Category.PERSONAL;
  };

  const normalizeString = (
    value: unknown,
    fallback: string,
    minLength: number,
    missingFields: string[],
    field: string
  ) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length >= minLength) return trimmed;
    }
    missingFields.push(field);
    return fallback;
  };

  const normalizeStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const buildResult = (result: any, sources: string[] = []) => {
    type PrepPlanPayload = {
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
    };
    const missingFields: string[] = [];
    const fallbackTitle = event.title ? `${event.title} prep plan` : 'Event preparation plan';
    const fallbackDescription = 'Prepare for the upcoming event.';
    const fallbackRationale = 'Advance preparation reduces risk and stress.';
    const impactRaw = typeof result?.impactScore === 'number' ? result.impactScore : 6;
    const impactScore = Math.min(10, Math.max(1, impactRaw));
    const steps = normalizeStringArray(result?.steps);
    const inputs = normalizeStringArray(result?.inputs);
    const risks = normalizeStringArray(result?.risks);

    const normalized: PrepPlanPayload = {
      category: normalizeCategory(result?.category),
      title: normalizeString(result?.title, fallbackTitle, 3, missingFields, 'title'),
      description: normalizeString(
        result?.description,
        fallbackDescription,
        5,
        missingFields,
        'description'
      ),
      impactScore,
      rationale: normalizeString(
        result?.rationale,
        fallbackRationale,
        5,
        missingFields,
        'rationale'
      ),
      steps,
      estimatedTime: typeof result?.estimatedTime === 'string' ? result.estimatedTime : '',
      inputs,
      definitionOfDone: typeof result?.definitionOfDone === 'string' ? result.definitionOfDone : '',
      risks,
    };

    const validated = validateAIOutput(RecommendationSchema, normalized) as PrepPlanPayload | null;
    const finalResult: PrepPlanPayload = validated ?? normalized;
    const timestamp = Date.now();

    return {
      ...finalResult,
      id: `prep-${timestamp}`,
      ownerId: profile.id,
      category: normalizeCategory(finalResult.category),
      createdAt: timestamp,
      status: 'ACTIVE' as const,
      needsReview: false,
      missingFields,
      evidenceLinks: { claims: [], sources },
    };
  };

  if (enableSearch) {
    try {
      const result = await modelRouter.generateWithSearch('generateEventPrepPlan', prompt);
      return buildResult(
        JSON.parse(result.text || '{}'),
        result.sources.map((s) => s.uri)
      );
    } catch (err) {
      const fallback = await modelRouter.generateJSON('generateEventPrepPlan', prompt);
      return buildResult(fallback);
    }
  }
  const result = await modelRouter.generateJSON('generateEventPrepPlan', prompt);
  return buildResult(result);
};

const generateDeepInitialization = async (
  profile: UserProfile,
  ruleOfLife: any,
  history: MemoryEntry[] = [],
  claims: any[] = []
): Promise<Record<string, any>> => {
  const committedClaims = claims
    .filter((c: any) => c.status === 'COMMITTED')
    .slice(0, 20)
    .map((c: any) => ({ fact: c.fact, category: c.category, confidence: c.confidence }));

  const memoryContext = buildMemoryContext(
    history,
    [
      Category.HEALTH,
      Category.FINANCE,
      Category.PERSONAL,
      Category.SPIRITUAL,
      Category.RELATIONSHIPS,
    ],
    30
  );

  const prompt = `
You are performing FIRST IMPRESSION ANALYSIS for Areté Life OS.

PROFILE DATA:
${JSON.stringify(profile, null, 2)}

RULE OF LIFE:
${JSON.stringify(ruleOfLife, null, 2)}

MEMORY CONTEXT:
${JSON.stringify(memoryContext)}

VERIFIED FACTS:
${JSON.stringify(committedClaims)}

CURRENT_DATE: ${new Date().toISOString()}

GOAL: Demonstrate deep understanding of this person. Make them feel "seen." Ground every recommendation in specific profile data or memory entries.

ANALYSIS TASKS:
1. Identify 3-5 immediate actionable tasks based on their specific profile and recent memory
2. Identify 2-3 blind spots or risks based on profile gaps and behavioral patterns in memory
3. Generate 4-6 personalized "Always Do" routines. Use Personality Type and Interests to make them biologically and psychologically resonant.
4. Generate 3-5 "Always Watch" guardrails. Use Health Conditions and Financial Goals as high-priority triggers.
5. Generate 2-3 recommendations per domain (health, finance, personal, relationships, spiritual)
6. Write a personalized greeting that references their Name, Origin, or Role to make them feel truly seen (e.g. 'Welcome back, Architect of the Areté').

RETURN JSON ONLY with schema:
{
  "doItems": [],
  "watchItems": [],
  "alwaysDo": [],
  "alwaysWatch": [],
  "domainRecommendations": { "health": [], "finance": [], "personal": [], "relationships": [], "spiritual": [] },
  "personalizedGreeting": "string"
}
  `;

  return await modelRouter.generateJSON('generateDeepInitialization', prompt);
};

// Delegates to extracted module for better error isolation
const processInput = async (
  input: string,
  history: MemoryEntry[],
  activeProfile: UserProfile,
  files: { data: string; mimeType: string }[] | undefined,
  promptConfig?: PromptConfig,
  familyMembers: UserProfile[] = [],
  fileMeta: { name?: string; mimeType: string; size?: number }[] = []
): Promise<any> => {
  return processInputAction({
    input,
    history,
    activeProfile,
    files,
    promptConfig,
    familyMembers,
    fileMeta,
    currentDate: new Date().toISOString(),
  });
};

const generateTasks = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[],
  claims?: any[]
): Promise<DailyTask[]> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const committedClaims = (claims || [])
    .filter((c: any) => c.status === 'COMMITTED')
    .slice(0, 20)
    .map((c: any) => ({ fact: c.fact, category: c.category, confidence: c.confidence }));

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(
      buildMemoryContext(
        history,
        [
          Category.HEALTH,
          Category.FINANCE,
          Category.PERSONAL,
          Category.SPIRITUAL,
          Category.RELATIONSHIPS,
        ],
        30
      )
    ),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    feedback: JSON.stringify(buildFeedbackContext(history)),
    verifiedFacts: JSON.stringify(committedClaims),
    input:
      "Generate active tasks based on recent history and profile goals. Include a 'methodology' field explaining STRATEGICALLY how to complete the task accurately. Include 'valueResonance' (High/Medium/Low) compared to coreValues.\n\nDOMAIN FOCUS:\n" +
      domainContext,
  });
  const normalizeTasks = (parsed: any) => {
    const tasks = Array.isArray(parsed) ? parsed : parsed?.tasks || [];
    return tasks.map((t: any) => ({ ...t, completed: false }));
  };

  const parsed = await modelRouter.generateJSON('generateTasks', finalPrompt);
  return normalizeTasks(parsed);
};

const generateInsights = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[],
  claims?: any[]
): Promise<ProactiveInsight[]> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const committedClaims = (claims || [])
    .filter((c: any) => c.status === 'COMMITTED')
    .slice(0, 20)
    .map((c: any) => ({ fact: c.fact, category: c.category, confidence: c.confidence }));

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(
      buildMemoryContext(
        history,
        [
          Category.HEALTH,
          Category.FINANCE,
          Category.PERSONAL,
          Category.SPIRITUAL,
          Category.RELATIONSHIPS,
        ],
        50
      )
    ),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    feedback: JSON.stringify(buildFeedbackContext(history)),
    verifiedFacts: JSON.stringify(committedClaims),
    input:
      'Generate proactive insights for achieving excellence. Use google search if appropriate to find relevant news/trends in their field.\n\nDOMAIN FOCUS:\n' +
      domainContext,
  });
  const normalizeInsights = (parsed: any) =>
    Array.isArray(parsed) ? parsed : parsed?.insights || [];

  try {
    const result = await modelRouter.generateWithSearch('generateInsights', finalPrompt);
    return normalizeInsights(JSON.parse(result.text || '[]'));
  } catch (err) {
    const parsed = await modelRouter.generateJSON('generateInsights', finalPrompt);
    return normalizeInsights(parsed);
  }
};

const generateStrategicBriefing = async (
  history: MemoryEntry[],
  profile: UserProfile,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[],
  claims?: any[]
): Promise<StrategicBriefing> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const committedClaims = (claims || [])
    .filter((c: any) => c.status === 'COMMITTED')
    .slice(0, 20)
    .map((c: any) => ({ fact: c.fact, category: c.category, confidence: c.confidence }));

  const finalPrompt = fillTemplate(STRATEGIC_BRIEFING_PROMPT, {
    profile: JSON.stringify(buildCompactProfile(profile)),
    digest: JSON.stringify(buildDailyDigest(history, 14)),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    verifiedFacts: JSON.stringify(committedClaims),
    currentDate: new Date().toISOString(),
  });

  const normalizeResult = (
    value: unknown,
    sources: { title: string; uri: string }[] = []
  ): StrategicBriefing => {
    const parsed = validateAIOutput(StrategicBriefingSchema, value) as
      | z.infer<typeof StrategicBriefingSchema>
      | null;

    return {
      generatedAt: Date.now(),
      profileSummary:
        parsed?.profileSummary || 'Build a little more profile context to sharpen the briefing.',
      focusQuestion:
        parsed?.focusQuestion || 'What is the most important life domain that needs protection this week?',
      summary:
        parsed?.summary || 'Briefing unavailable. Capture more recent signals and refresh again.',
      opportunities: Array.isArray(parsed?.opportunities)
        ? parsed.opportunities.slice(0, 3).map((item) => ({
            title: item.title,
            detail: item.detail,
            action: item.action,
          }))
        : [],
      risks: Array.isArray(parsed?.risks)
        ? parsed.risks.slice(0, 3).map((item) => ({
            title: item.title,
            detail: item.detail,
            action: item.action,
          }))
        : [],
      actions: Array.isArray(parsed?.actions) ? parsed.actions.slice(0, 5) : [],
      sources,
    };
  };

  try {
    const result = await modelRouter.generateWithSearch('generateStrategicBriefing', finalPrompt);
    return normalizeResult(parseJSONObject(result.text || '{}'), result.sources || []);
  } catch (err) {
    const parsed = await modelRouter.generateJSON('generateStrategicBriefing', finalPrompt);
    return normalizeResult(parsed);
  }
};

const generateBlindSpots = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[],
  claims?: any[]
): Promise<BlindSpot[]> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const committedClaims = (claims || [])
    .filter((c: any) => c.status === 'COMMITTED')
    .slice(0, 20)
    .map((c: any) => ({ fact: c.fact, category: c.category, confidence: c.confidence }));

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(
      buildMemoryContext(
        history,
        [
          Category.HEALTH,
          Category.FINANCE,
          Category.PERSONAL,
          Category.SPIRITUAL,
          Category.RELATIONSHIPS,
        ],
        50
      )
    ),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    feedback: JSON.stringify(buildFeedbackContext(history)),
    verifiedFacts: JSON.stringify(committedClaims),
    input:
      'Analyze for potential blind spots. Be critical of discrepancies between stated values and logged behavior.\n\nDOMAIN FOCUS:\n' +
      domainContext,
  });
  const normalizeBlindSpots = (parsed: any) =>
    Array.isArray(parsed) ? parsed : parsed?.blindSpots || [];

  const parsed = await modelRouter.generateJSON('generateBlindSpots', finalPrompt);
  return normalizeBlindSpots(parsed);
};

const generateDailyIntelligenceBatch = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[],
  claims?: any[]
): Promise<{ tasks: DailyTask[]; insights: ProactiveInsight[]; blindSpots: BlindSpot[] }> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const committedClaims = (claims || [])
    .filter((c: any) => c.status === 'COMMITTED')
    .slice(0, 20)
    .map((c: any) => ({ fact: c.fact, category: c.category, confidence: c.confidence }));

  const template =
    promptConfig?.template || promptConfig?.defaultTemplate || DAILY_INTELLIGENCE_BATCH_PROMPT;
  const finalPrompt = fillTemplate(template, {
    profileSummary: JSON.stringify(buildCompactProfile(profile)),
    dailyDigest: JSON.stringify(buildDailyDigest(history, 12)),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    feedback: JSON.stringify(buildFeedbackContext(history)),
    verifiedFacts: JSON.stringify(committedClaims),
  });

  const parseResultWithMeta = (text: string) => {
    const result = JSON.parse(text || '{}');
    const rawTasks = Array.isArray(result.tasks) ? result.tasks : [];
    const validatedTasks = rawTasks
      .map((task: unknown) => validateAIOutput(TaskSchema, task))
      .filter(Boolean) as any[];
    return {
      parsed: {
        tasks: validatedTasks.map((t: any) => ({ ...t, completed: false })),
        insights: Array.isArray(result.insights) ? result.insights : [],
        blindSpots: Array.isArray(result.blindSpots) ? result.blindSpots : [],
      },
      rawTaskCount: rawTasks.length,
    };
  };

  const result = await modelRouter.generateJSON('dailyIntelligenceBatch', finalPrompt);
  return parseResultWithMeta(JSON.stringify(result)).parsed;
};

const generateBaselineSwot = async (
  profile: UserProfile,
  goals: Goal[],
  promptConfig: PromptConfig
): Promise<BaselineSwotEntry[]> => {
  const template = promptConfig?.template || promptConfig?.defaultTemplate || BASELINE_SWOT_PROMPT;
  const normalizedMetrics = normalizePreComputedMetrics({});
  const personalizationContext = buildLifeContextPersonalizationContext(profile, normalizedMetrics);
  const finalPrompt = fillTemplate(template, {
    profile: JSON.stringify(profile),
    goals: JSON.stringify(goals),
    preComputedMetrics: JSON.stringify(normalizedMetrics),
    personalizationContext: JSON.stringify(personalizationContext),
    currentDate: new Date().toISOString(),
  });

  const fallbackEntry = (dimension: Category): BaselineSwotEntry => ({
    dimension,
    strengths: ['Profile data received — baseline analysis pending.'],
    weaknesses: ['Initial assessment requires a full refresh to generate.'],
    opportunities: ['Refresh this dimension to unlock profile-grounded analysis.'],
    threats: ['Risk assessment pending initial refresh.'],
    confidence: 'profile',
    nextAction: 'Refresh this dimension to generate your personalized SWOT.',
  });

  const normalizeBaseline = (text: string): BaselineSwotEntry[] => {
    const result = JSON.parse(text || '{}');
    const raw = Array.isArray(result.baseline) ? result.baseline : [];
    const validated = raw
      .map((entry: unknown) => validateAIOutput(BaselineSwotSchema, entry))
      .filter(Boolean) as BaselineSwotEntry[];
    const normalized = validated.map((entry) => ({
      ...entry,
      dimension: normalizeBaselineDimension(entry.dimension),
    }));
    const byDimension = new Map<Category, BaselineSwotEntry>();
    normalized.forEach((entry) => {
      if (entry.dimension !== Category.GENERAL) byDimension.set(entry.dimension, entry);
    });
    return BASELINE_DIMENSIONS.map((dimension) => byDimension.get(dimension) || fallbackEntry(dimension));
  };

  const result = await modelRouter.generateJSON('generateBaselineSwot', finalPrompt);
  return normalizeBaseline(JSON.stringify(result));
};

const buildDimensionRefreshPrompt = (
  dimensions: LifeDimension[],
  profile: UserProfile,
  memoryByDimension: Partial<Record<LifeDimension, MemoryEntry[]>>,
  goalsByDimension: Partial<Record<LifeDimension, Goal[]>>,
  previousSnapshots: Partial<Record<LifeDimension, DimensionContextSnapshot>>,
  preComputedMetrics?: Partial<PreComputedMetrics> | null,
  promptConfig?: PromptConfig
) => {
  const dimensionContexts = dimensions.map((dimension) =>
    buildDimensionContext(
      memoryByDimension[dimension] || [],
      goalsByDimension[dimension] || [],
      dimension,
      30
    )
  );
  const profileByDimension = Object.fromEntries(
    dimensions.map((dimension) => [dimension, buildProfileForDimension(profile, dimension)])
  );

  const template =
    promptConfig?.template || promptConfig?.defaultTemplate || DIMENSION_CONTEXT_PROMPT;
  const normalizedMetrics = normalizePreComputedMetrics(preComputedMetrics || {});
  return fillTemplate(template, {
    dimensionsToEvaluate: JSON.stringify(dimensions),
    profile: JSON.stringify(profile),
    memoryByDimension: JSON.stringify(dimensionContexts),
    goalsByDimension: JSON.stringify(goalsByDimension),
    previousSnapshots: JSON.stringify(previousSnapshots),
    preComputedMetrics: JSON.stringify(normalizedMetrics),
    personalizationContext: JSON.stringify(
      buildLifeContextPersonalizationContext(profile, normalizedMetrics)
    ),
    currentDate: new Date().toISOString(),
    profileByDimension: JSON.stringify(profileByDimension),
  });
};

const emptyDimensionSnapshot = createEmptySnapshot;

const normalizeDimensionSnapshots = (
  text: string,
  requestedDimensions: LifeDimension[],
  previousSnapshots: Partial<Record<LifeDimension, DimensionContextSnapshot>>
): DimensionContextSnapshot[] => {
  const parsed = JSON.parse(text || '{}');
  const raw = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.snapshots) ? parsed.snapshots : [];
  const byDimension = new Map<LifeDimension, DimensionContextSnapshot>();

  raw.forEach((entry: unknown) => {
    const validated = validateAIOutput(DimensionContextSnapshotSchema, entry);
    if (!validated) return;
    const dimension = normalizeLifeDimension(validated.dimension);
    if (!dimension) return;
    const insight = validated.insight;
    const gap = validated.gap;
    const nextStep = validated.nextStep;
    const projection = validated.projection;
    const score = Math.max(0, Math.min(100, Math.round(validated.score)));
    const normalized: DimensionContextSnapshot = {
      dimension,
      status: validated.status,
      score,
      trend: validated.trend,
      delta: validated.delta,
      insight,
      gap,
      nextStep,
      swot: resolveSnapshotSwot(validated.swot, {
        insight,
        gap,
        nextStep,
        projection,
        fidelityLevel: validated.fidelityLevel,
        status: validated.status,
      }),
      scoreExplanation: resolveScoreExplanation(validated.scoreExplanation, {
        score,
        trend: validated.trend,
        delta: validated.delta,
        fidelityLevel: validated.fidelityLevel,
      }),
      projection,
      missingData: validated.missingData || [],
      fidelityLevel: validated.fidelityLevel,
      generatedAt: validated.generatedAt,
      triggeredBy: validated.triggeredBy,
    };
    byDimension.set(dimension, normalized);
  });

  return requestedDimensions.map((dimension) => {
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

const refreshDimensionContexts = async (
  dimensions: LifeDimension[],
  profile: UserProfile,
  memoryByDimension: Partial<Record<LifeDimension, MemoryEntry[]>>,
  goalsByDimension: Partial<Record<LifeDimension, Goal[]>>,
  previousSnapshots: Partial<Record<LifeDimension, DimensionContextSnapshot>>,
  preComputedMetrics?: Partial<PreComputedMetrics> | null,
  promptConfig?: PromptConfig
): Promise<DimensionContextSnapshot[]> => {
  const requestedDimensions = dimensions.filter((dimension) => LIFE_DIMENSION_SET.has(dimension));
  if (requestedDimensions.length === 0) return [];

  const finalPrompt = buildDimensionRefreshPrompt(
    requestedDimensions,
    profile,
    memoryByDimension,
    goalsByDimension,
    previousSnapshots,
    preComputedMetrics,
    promptConfig
  );

  const result = await modelRouter.generateJSON('refreshDimensionContexts', finalPrompt);
  return normalizeDimensionSnapshots(
    JSON.stringify(result),
    requestedDimensions,
    previousSnapshots
  );
};

const generateLifeSnapshot = async (
  profile: UserProfile,
  dimensionSnapshots: DimensionContextSnapshot[],
  promptConfig?: PromptConfig
): Promise<{
  narrativeParagraph: string;
  criticalPriorities: CriticalPriority[];
  profileGaps: ProfileGap[];
}> => {
  const template =
    promptConfig?.template || promptConfig?.defaultTemplate || LIFE_SNAPSHOT_SYNTHESIS_PROMPT;
  const finalPrompt = fillTemplate(template, {
    profile: JSON.stringify(profile),
    dimensionSnapshots: JSON.stringify(dimensionSnapshots),
    currentDate: new Date().toISOString(),
  });

  const fallback = {
    narrativeParagraph:
      'Not enough verified life context yet. Log more data to generate a higher-fidelity snapshot.',
    criticalPriorities: [] as CriticalPriority[],
    profileGaps: [] as ProfileGap[],
  };

  const normalizeSynthesis = (text: string) => {
    const parsed = JSON.parse(text || '{}');
    const validated = validateAIOutput(LifeSnapshotSynthesisSchema, parsed);
    if (!validated) return fallback;
    const criticalPriorities = validated.criticalPriorities
      .map((item) => {
        const dim = normalizeLifeDimension(item.dimension);
        if (!dim) return null;
        const normalized = validateAIOutput(CriticalPrioritySchema, {
          ...item,
          dimension: dim,
        });
        return normalized ? { ...normalized, dimension: dim } : null;
      })
      .filter((item): item is CriticalPriority => Boolean(item));
    const profileGaps = validated.profileGaps
      .map((item) => {
        const dim = normalizeLifeDimension(item.dimension);
        if (!dim) return null;
        const normalized = validateAIOutput(ProfileGapSchema, {
          ...item,
          dimension: dim,
        });
        return normalized ? { ...normalized, dimension: dim } : null;
      })
      .filter((item): item is ProfileGap => Boolean(item));
    return {
      narrativeParagraph: validated.narrativeParagraph || fallback.narrativeParagraph,
      criticalPriorities,
      profileGaps,
    };
  };

  const result = await modelRouter.generateJSON('generateLifeSnapshot', finalPrompt);
  return normalizeSynthesis(JSON.stringify(result));
};

const generateDailyPlan = async (
  profile: UserProfile,
  timeline: TimelineEvent[],
  goals: Goal[],
  blindSpots: BlindSpot[],
  ruleOfLife: any,
  promptConfig: PromptConfig,
  history: MemoryEntry[] = []
): Promise<DailyTask[]> => {
  const finalPrompt = fillTemplate(promptConfig.template || DAILY_PLAN_PROMPT, {
    profile: JSON.stringify(profile),
    timeline: JSON.stringify(timeline),
    goals: JSON.stringify(goals),
    blindSpots: JSON.stringify(blindSpots),
    ruleOfLife: JSON.stringify(ruleOfLife),
    history: JSON.stringify(
      buildMemoryContext(
        history,
        [
          Category.HEALTH,
          Category.FINANCE,
          Category.PERSONAL,
          Category.SPIRITUAL,
          Category.RELATIONSHIPS,
        ],
        30
      ).map((m) => m.content)
    ),
    coreValues: profile.spiritual.coreValues.join(', '),
  });

  const normalizePlan = (planText: string) => {
    const plan = JSON.parse(planText || '[]');
    const planArray = Array.isArray(plan) ? plan : (plan?.tasks ?? []);
    return planArray.map((p: any) => ({
      ...p,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ownerId: profile.id,
      completed: false,
      createdAt: Date.now(),
    }));
  };

  const result = await modelRouter.generateJSON('generateDailyPlan', finalPrompt);
  return normalizePlan(JSON.stringify(result));
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_CHARS = 50_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const getClientIp = (req: any) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.length > 0) return realIp;
  return req.socket?.remoteAddress || 'unknown';
};

const redactSensitive = (value: string) =>
  value
    .replace(/sk-ant-[A-Za-z0-9]{10,}/g, '[redacted]')
    .replace(/sk-[A-Za-z0-9]{20,}/g, '[redacted]')
    .replace(/AIza[0-9A-Za-z\-_]{10,}/g, '[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(api|auth|secret|token)[^\\s]{0,3}[:=]\\s*[A-Za-z0-9_-]{16,}/gi, '$1:[redacted]');

const getAllowedOrigins = () => {
  const origins = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ]);
  const publicUrl = process.env.PUBLIC_APP_URL?.trim();
  if (publicUrl) origins.add(publicUrl);
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) origins.add(`https://${vercelUrl}`);
  return origins;
};

const actionSchemas: Record<string, z.ZodTypeAny> = {
  askAura: z
    .object({
      text: z.string().max(MAX_TEXT_CHARS),
      history: z.any().optional(),
      profile: z.any().optional(),
      promptConfig: z.any().optional(),
    })
    .passthrough(),
  generateDeepTasks: z
    .object({
      profile: z.any().optional(),
      history: z.any().optional(),
      familyMembers: z.any().optional(),
      promptConfig: z.any().optional(),
      financeMetrics: z.any().optional(),
      missingData: z.any().optional(),
      claims: z.any().optional(),
    })
    .passthrough(),
  generateEventPrepPlan: z
    .object({
      event: z.any().optional(),
      profile: z.any().optional(),
      history: z.any().optional(),
      enableSearch: z.boolean().optional(),
    })
    .passthrough(),
  generateDeepInitialization: z
    .object({
      profile: z.any().optional(),
      ruleOfLife: z.any().optional(),
      history: z.any().optional(),
      claims: z.any().optional(),
    })
    .passthrough(),
  processInput: z
    .object({
      input: z.string().max(MAX_TEXT_CHARS),
      history: z.any().optional(),
      activeProfile: z.any().optional(),
      files: z.any().optional(),
      promptConfig: z.any().optional(),
      familyMembers: z.any().optional(),
      fileMeta: z.any().optional(),
    })
    .passthrough(),
  generateTasks: z
    .object({
      history: z.any().optional(),
      profile: z.any().optional(),
      promptConfig: z.any().optional(),
      familyMembers: z.any().optional(),
      financeMetrics: z.any().optional(),
      missingData: z.any().optional(),
      claims: z.any().optional(),
    })
    .passthrough(),
  generateInsights: z
    .object({
      history: z.any().optional(),
      profile: z.any().optional(),
      promptConfig: z.any().optional(),
      familyMembers: z.any().optional(),
      financeMetrics: z.any().optional(),
      missingData: z.any().optional(),
      claims: z.any().optional(),
    })
    .passthrough(),
  generateStrategicBriefing: z
    .object({
      history: z.any().optional(),
      profile: z.any().optional(),
      familyMembers: z.any().optional(),
      financeMetrics: z.any().optional(),
      missingData: z.any().optional(),
      claims: z.any().optional(),
    })
    .passthrough(),
  generateBlindSpots: z
    .object({
      history: z.any().optional(),
      profile: z.any().optional(),
      promptConfig: z.any().optional(),
      familyMembers: z.any().optional(),
      financeMetrics: z.any().optional(),
      missingData: z.any().optional(),
      claims: z.any().optional(),
    })
    .passthrough(),
  dailyIntelligenceBatch: z
    .object({
      history: z.any().optional(),
      profile: z.any().optional(),
      promptConfig: z.any().optional(),
      familyMembers: z.any().optional(),
      financeMetrics: z.any().optional(),
      missingData: z.any().optional(),
      claims: z.any().optional(),
    })
    .passthrough(),
  generateBaselineSwot: z
    .object({
      profile: z.any().optional(),
      goals: z.any().optional(),
      promptConfig: z.any().optional(),
    })
    .passthrough(),
  refreshDimensionContexts: z
    .object({
      dimensions: z.array(z.any()).optional(),
      profile: z.any().optional(),
      memoryByDimension: z.any().optional(),
      goalsByDimension: z.any().optional(),
      previousSnapshots: z.any().optional(),
      preComputedMetrics: z.any().optional(),
      promptConfig: z.any().optional(),
    })
    .passthrough(),
  generateLifeSnapshot: z
    .object({
      profile: z.any().optional(),
      dimensionSnapshots: z.any().optional(),
      promptConfig: z.any().optional(),
    })
    .passthrough(),
  generateDailyPlan: z
    .object({
      profile: z.any().optional(),
      timeline: z.any().optional(),
      goals: z.any().optional(),
      blindSpots: z.any().optional(),
      ruleOfLife: z.any().optional(),
      promptConfig: z.any().optional(),
      history: z.any().optional(),
    })
    .passthrough(),
};

const serializeError = (err: unknown) => {
  if (!err) return { message: 'Unknown error' };
  const anyErr = err as any;
  const payload: Record<string, unknown> = {
    name: anyErr?.name,
    message: anyErr?.message,
    status: anyErr?.status ?? anyErr?.code,
    details: anyErr?.details ?? anyErr?.error?.message,
  };
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') payload[key] = redactSensitive(value);
  }
  return payload;
};

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
};

export const handleAIAction = async (action: string, payload: any) => {
  switch (action) {
    case 'askAura':
      return await askAura(payload.text, payload.history, payload.profile, payload.promptConfig);
    case 'generateDeepTasks':
      return await generateDeepTasks(
        payload.profile,
        payload.history,
        payload.familyMembers,
        payload.promptConfig,
        payload.financeMetrics,
        payload.missingData,
        payload.claims
      );
    case 'generateEventPrepPlan':
      return await generateEventPrepPlan(
        payload.event,
        payload.profile,
        payload.history,
        Boolean(payload.enableSearch)
      );
    case 'generateDeepInitialization':
      return await generateDeepInitialization(
        payload.profile,
        payload.ruleOfLife,
        payload.history,
        payload.claims
      );
    case 'processInput':
      return await processInput(
        payload.input,
        payload.history,
        payload.activeProfile,
        payload.files,
        payload.promptConfig,
        payload.familyMembers,
        payload.fileMeta
      );
    case 'generateTasks':
      return await generateTasks(
        payload.history,
        payload.profile,
        payload.promptConfig,
        payload.familyMembers,
        payload.financeMetrics,
        payload.missingData,
        payload.claims
      );
    case 'generateInsights':
      return await generateInsights(
        payload.history,
        payload.profile,
        payload.promptConfig,
        payload.familyMembers,
        payload.financeMetrics,
        payload.missingData,
        payload.claims
      );
    case 'generateStrategicBriefing':
      return await generateStrategicBriefing(
        payload.history,
        payload.profile,
        payload.familyMembers,
        payload.financeMetrics,
        payload.missingData,
        payload.claims
      );
    case 'generateBlindSpots':
      return await generateBlindSpots(
        payload.history,
        payload.profile,
        payload.promptConfig,
        payload.familyMembers,
        payload.financeMetrics,
        payload.missingData,
        payload.claims
      );
    case 'dailyIntelligenceBatch':
      return await generateDailyIntelligenceBatch(
        payload.history,
        payload.profile,
        payload.promptConfig,
        payload.familyMembers,
        payload.financeMetrics,
        payload.missingData,
        payload.claims
      );
    case 'generateBaselineSwot':
      return await generateBaselineSwot(payload.profile, payload.goals, payload.promptConfig);
    case 'refreshDimensionContexts':
      return await refreshDimensionContexts(
        payload.dimensions || [],
        payload.profile,
        payload.memoryByDimension || {},
        payload.goalsByDimension || {},
        payload.previousSnapshots || {},
        payload.preComputedMetrics || {},
        payload.promptConfig
      );
    case 'generateLifeSnapshot':
      return await generateLifeSnapshot(
        payload.profile,
        payload.dimensionSnapshots || [],
        payload.promptConfig
      );
    case 'generateDailyPlan':
      return await generateDailyPlan(
        payload.profile,
        payload.timeline,
        payload.goals,
        payload.blindSpots,
        payload.ruleOfLife,
        payload.promptConfig,
        payload.history
      );
    default:
      throw new Error('Unknown action');
  }
};

export default async function handler(req: any, res: any) {
  const origin = req.headers?.origin;
  const requestHost = String(
    req.headers?.['x-forwarded-host'] || req.headers?.host || ''
  ).trim();
  const allowedOrigins = getAllowedOrigins();
  if (origin) {
    let isAllowed = allowedOrigins.has(origin);
    if (!isAllowed && requestHost) {
      try {
        const originHost = new URL(origin).host;
        isAllowed = originHost === requestHost;
      } catch {
        isAllowed = false;
      }
    }
    if (!isAllowed) {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.remaining).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(limit.resetAt / 1000).toString());
  if (!limit.allowed) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const body = req.body || {};
    if (!validatePayloadSize(body, MAX_BODY_BYTES)) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }
    const envelope = z.object({ action: z.string(), payload: z.any().optional() }).safeParse(body);
    if (!envelope.success) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
    const { action, payload } = envelope.data;
    const schema = actionSchemas[action];
    if (!schema) {
      res.status(400).json({ error: 'Unknown action' });
      return;
    }
    const parsed = schema.safeParse(payload ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
    const sanitizedPayload = sanitizePayload(parsed.data);
    const result = await handleAIAction(action, sanitizedPayload);
    res.status(200).json(result);
  } catch (err) {
    const errorId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.error(`[${errorId}] AI request failed`, serializeError(err));
    res.status(200).json({ error: 'AI request failed', id: errorId });
  }
}
