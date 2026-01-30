import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import {
  DOMAIN_PROMPTS,
  HYPER_PERSONALIZED_PROMPT,
  DAILY_PLAN_PROMPT,
  buildMemoryContext,
  buildFeedbackContext,
  DAILY_INTELLIGENCE_BATCH_PROMPT,
  buildCompactProfile,
  buildDailyDigest,
} from '../ai/prompts';
import { RecommendationSchema, TaskSchema, validateAIOutput } from '../ai/validators';
import type {
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
} from '../data/types';
import { Category } from '../data/types';
import { processInput as processInputAction } from './aiActions/processInput';
import { modelRouter } from './modelRouter';

const DEFAULT_PRO_MODEL = 'gemini-3-pro-preview';
const DEFAULT_FLASH_MODEL = 'gemini-3-flash-preview';

const domainContext = Object.entries(DOMAIN_PROMPTS)
  .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
  .join('\n');

const getModel = (kind: 'pro' | 'flash') => {
  const raw = kind === 'pro' ? process.env.GEMINI_MODEL_PRO : process.env.GEMINI_MODEL_FLASH;
  const value = raw?.trim();
  if (value && value.length > 0) return value;
  return kind === 'pro' ? DEFAULT_PRO_MODEL : DEFAULT_FLASH_MODEL;
};

const getResearchModel = () => {
  const value = process.env.GEMINI_MODEL_RESEARCH?.trim();
  if (value && value.length > 0) return value;
  return getModel('pro');
};

const getOpenAIModel = () => {
  const value = process.env.OPENAI_MODEL?.trim();
  if (value && value.length > 0) return value;
  return 'gpt-5.1';
};

type OpenAIReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

const getOpenAIReasoningEffort = (): OpenAIReasoningEffort => {
  const value = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  const allowed: OpenAIReasoningEffort[] = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];
  if (value && (allowed as string[]).includes(value)) return value as OpenAIReasoningEffort;
  return 'medium';
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

const toJsonPrompt = (prompt: string) => `${prompt}\n\nReturn JSON only.`;

const withLatency = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.info(`[ai][latency] ${label} ${Date.now() - start}ms`);
  }
};

const shouldUseProForDailyBatch = (params: {
  history: MemoryEntry[];
  missingData?: string[];
  familyMembers?: UserProfile[];
}): boolean => {
  const missingCount = params.missingData?.length ?? 0;
  if (missingCount >= 4) return true;
  if (params.history.length > 200) return true;
  if ((params.familyMembers?.length || 0) > 2) return true;
  return false;
};

const logUsage = (response: any, action: string, model: string) => {
  const usage = response?.usageMetadata;
  if (usage) {
    console.info('[ai][usage]', { provider: 'gemini', action, model, usage });
  }
};

const callOpenAI = async (input: string, options?: { json?: boolean; label?: string }) => {
  const client = getOpenAIClient();
  if (!client) throw new Error('Missing OPENAI_API_KEY');
  const model = getOpenAIModel();
  const reasoningEffort = getOpenAIReasoningEffort();
  const label = options?.label ? `openai:${options.label}:${model}` : `openai:${model}`;
  const response = await withLatency(label, () =>
    client.responses.create({
      model,
      reasoning: { effort: reasoningEffort },
      input,
      ...(options?.json ? { text: { format: { type: 'json_object' } } } : {}),
    })
  );
  return response.output_text || '';
};

const fillTemplate = (template: string, data: Record<string, string>) => {
  let res = template;
  for (const [key, value] of Object.entries(data)) {
    res = res.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return res;
};

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  return new GoogleGenAI({ apiKey });
};

const askAura = async (
  text: string,
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig
) => {
  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(buildMemoryContext(history, [], 30)),
    input: text,
  });

  if (process.env.AI_USE_ROUTER === '1') {
    try {
      return await modelRouter.generateWithSearch('askAura', finalPrompt);
    } catch (err) {
      const fallbackText = await modelRouter.generateText('askAura', finalPrompt);
      return { text: fallbackText || 'Oracle connection unstable.', sources: [] };
    }
  }

  try {
    const ai = getClient();
    const model = getResearchModel();
    const response = await withLatency(`gemini:askAura:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })
    );
    logUsage(response, 'askAura', model);

    const urls: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          urls.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return {
      text: response.text || 'Oracle connection unstable.',
      sources: urls,
    };
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(finalPrompt, { label: 'askAura' });
    return { text: textResult || 'Oracle connection unstable.', sources: [] };
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
          Category.WORK,
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

  if (process.env.AI_USE_ROUTER === '1') {
    const result = await modelRouter.generateJSON('generateDeepTasks', finalPrompt);
    return normalizeResult(result);
  }

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await withLatency(`gemini:generateDeepTasks:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );
    logUsage(response, 'generateDeepTasks', model);

    const result = JSON.parse(response.text || '{}');
    return normalizeResult(result);
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), {
      json: true,
      label: 'generateDeepTasks',
    });
    const result = JSON.parse(textResult || '{}');
    return normalizeResult(result);
  }
};

const extractGroundingSources = (response: any): string[] => {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];
  const urls = chunks
    .map((chunk: any) => chunk?.web?.uri)
    .filter((uri: any) => typeof uri === 'string' && uri.length > 0);
  return Array.from(new Set(urls));
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

  if (process.env.AI_USE_ROUTER === '1') {
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
    const fallback = await modelRouter.generateJSON('generateEventPrepPlan', prompt);
    return buildResult(fallback);
  }

  try {
    const ai = getClient();
    const model = enableSearch ? getResearchModel() : getModel('flash');
    const response = await withLatency(`gemini:generateEventPrepPlan:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          ...(enableSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      })
    );
    logUsage(response, 'generateEventPrepPlan', model);

    const sources = enableSearch ? extractGroundingSources(response) : [];
    return buildResult(JSON.parse(response.text || '{}'), sources);
  } catch (err) {
    if (enableSearch) {
      try {
        const ai = getClient();
        const model = getModel('flash');
        const response = await withLatency(`gemini:generateEventPrepPlan:${model}`, () =>
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          })
        );
        logUsage(response, 'generateEventPrepPlan', model);
        return buildResult(JSON.parse(response.text || '{}'));
      } catch (fallbackErr) {
        if (!getOpenAIClient()) throw fallbackErr;
        const textResult = await callOpenAI(toJsonPrompt(prompt), {
          json: true,
          label: 'generateEventPrepPlan',
        });
        return buildResult(JSON.parse(textResult || '{}'));
      }
    }
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(prompt), {
      json: true,
      label: 'generateEventPrepPlan',
    });
    return buildResult(JSON.parse(textResult || '{}'));
  }
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
      Category.WORK,
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
3. Generate 4-6 personalized "Always Do" routines with specific rationale referencing profile data
4. Generate 3-5 "Always Watch" guardrails based on their conditions, finances, values
5. Generate 2-3 recommendations per domain (health, finance, personal, relationships, spiritual)
6. Write a personalized greeting that references something SPECIFIC about them

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

  if (process.env.AI_USE_ROUTER === '1') {
    return await modelRouter.generateJSON('generateDeepInitialization', prompt);
  }

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await withLatency(`gemini:generateDeepInitialization:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      })
    );
    logUsage(response, 'generateDeepInitialization', model);
    return JSON.parse(response.text || '{}');
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(prompt, { label: 'generateDeepInitialization' });
    return JSON.parse(textResult || '{}');
  }
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
          Category.WORK,
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

  if (process.env.AI_USE_ROUTER === '1') {
    const parsed = await modelRouter.generateJSON('generateTasks', finalPrompt);
    return normalizeTasks(parsed);
  }

  try {
    const ai = getClient();
    const model = getModel('flash');
    const response = await withLatency(`gemini:generateTasks:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );
    logUsage(response, 'generateTasks', model);
    const parsed = JSON.parse(response.text || '[]');
    return normalizeTasks(parsed);
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), {
      json: true,
      label: 'generateTasks',
    });
    const parsed = JSON.parse(textResult || '[]');
    return normalizeTasks(parsed);
  }
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
          Category.WORK,
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

  if (process.env.AI_USE_ROUTER === '1') {
    try {
      const result = await modelRouter.generateWithSearch('generateInsights', finalPrompt);
      return normalizeInsights(JSON.parse(result.text || '[]'));
    } catch (err) {
      const parsed = await modelRouter.generateJSON('generateInsights', finalPrompt);
      return normalizeInsights(parsed);
    }
  }

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await withLatency(`gemini:generateInsights:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
        },
      })
    );
    logUsage(response, 'generateInsights', model);
    const parsed = JSON.parse(response.text || '[]');
    return normalizeInsights(parsed);
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), {
      json: true,
      label: 'generateInsights',
    });
    const parsed = JSON.parse(textResult || '[]');
    return normalizeInsights(parsed);
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
          Category.WORK,
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

  if (process.env.AI_USE_ROUTER === '1') {
    const parsed = await modelRouter.generateJSON('generateBlindSpots', finalPrompt);
    return normalizeBlindSpots(parsed);
  }

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await withLatency(`gemini:generateBlindSpots:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );
    logUsage(response, 'generateBlindSpots', model);
    const parsed = JSON.parse(response.text || '[]');
    return normalizeBlindSpots(parsed);
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), {
      json: true,
      label: 'generateBlindSpots',
    });
    const parsed = JSON.parse(textResult || '[]');
    return normalizeBlindSpots(parsed);
  }
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

  if (process.env.AI_USE_ROUTER === '1') {
    const result = await modelRouter.generateJSON('dailyIntelligenceBatch', finalPrompt);
    return parseResultWithMeta(JSON.stringify(result)).parsed;
  }

  const ai = getClient();
  const usePro = shouldUseProForDailyBatch({
    history,
    missingData,
    familyMembers,
  });
  const primaryModel = usePro ? getModel('pro') : getModel('flash');

  const callGemini = async (model: string) => {
    const response = await withLatency(`gemini:dailyIntelligenceBatch:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );
    logUsage(response, 'dailyIntelligenceBatch', model);
    return response.text || '{}';
  };

  const runModel = async (model: string) => {
    const text = await callGemini(model);
    return parseResultWithMeta(text);
  };

  try {
    const primaryResult = await runModel(primaryModel);
    if (!usePro && primaryResult.rawTaskCount > 0 && primaryResult.parsed.tasks.length === 0) {
      console.warn('[dailyIntelligenceBatch] Flash output invalid, retrying with Pro');
      const proResult = await runModel(getModel('pro'));
      return proResult.parsed;
    }
    return primaryResult.parsed;
  } catch (err) {
    let lastError = err;
    if (!usePro) {
      try {
        const proResult = await runModel(getModel('pro'));
        return proResult.parsed;
      } catch (proErr) {
        lastError = proErr;
      }
    }
    if (!getOpenAIClient()) throw lastError;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), {
      json: true,
      label: 'dailyIntelligenceBatch',
    });
    return parseResultWithMeta(textResult || '{}').parsed;
  }
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
          Category.WORK,
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

  if (process.env.AI_USE_ROUTER === '1') {
    const result = await modelRouter.generateJSON('generateDailyPlan', finalPrompt);
    return normalizePlan(JSON.stringify(result));
  }

  try {
    const ai = getClient();
    const model = getModel('flash');
    const response = await withLatency(`gemini:generateDailyPlan:${model}`, () =>
      ai.models.generateContent({
        model,
        contents: finalPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );
    logUsage(response, 'generateDailyPlan', model);
    return normalizePlan(response.text || '[]');
  } catch (err) {
    try {
      const ai = getClient();
      const model = getModel('pro');
      const response = await withLatency(`gemini:generateDailyPlan:${model}`, () =>
        ai.models.generateContent({
          model,
          contents: finalPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        })
      );
      logUsage(response, 'generateDailyPlan', model);
      return normalizePlan(response.text || '[]');
    } catch (fallbackErr) {
      if (!getOpenAIClient()) throw fallbackErr;
      const textResult = await callOpenAI(toJsonPrompt(finalPrompt), {
        json: true,
        label: 'generateDailyPlan',
      });
      return normalizePlan(textResult || '[]');
    }
  }
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
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
    .replace(/AIza[0-9A-Za-z\-_]{10,}/g, '[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]');

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

export const handleGeminiAction = async (action: string, payload: any) => {
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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
    const { action, payload } = req.body || {};
    if (!action) {
      res.status(400).json({ error: 'Missing action' });
      return;
    }
    const result = await handleGeminiAction(action, payload);
    res.status(200).json(result);
  } catch (err) {
    const errorId = `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.error(`[${errorId}] Gemini request failed`, serializeError(err));
    res.status(200).json({ error: 'Gemini request failed', id: errorId });
  }
}
