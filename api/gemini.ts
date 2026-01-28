import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import {
  DOMAIN_PROMPTS,
  HYPER_PERSONALIZED_PROMPT,
  LOG_BAR_INGEST_PROMPT,
  DAILY_PLAN_PROMPT,
  buildMemoryContext,
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

const callOpenAI = async (input: string, options?: { json?: boolean }) => {
  const client = getOpenAIClient();
  if (!client) throw new Error('Missing OPENAI_API_KEY');
  const model = getOpenAIModel();
  const reasoningEffort = getOpenAIReasoningEffort();
  const response = await client.responses.create({
    model,
    reasoning: { effort: reasoningEffort },
    input,
    ...(options?.json ? { text: { format: { type: 'json_object' } } } : {}),
  });
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
    history: JSON.stringify(buildMemoryContext(history, [], 20)),
    input: text,
  });

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

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
    const textResult = await callOpenAI(finalPrompt);
    return { text: textResult || 'Oracle connection unstable.', sources: [] };
  }
};

const generateDeepTasks = async (
  profile: UserProfile,
  history: MemoryEntry[],
  familyMembers: UserProfile[],
  promptConfig: PromptConfig,
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[]
): Promise<{ recommendations: Recommendation[]; tasks: DailyTask[] }> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const finalPrompt = `${fillTemplate(promptConfig.template || HYPER_PERSONALIZED_PROMPT, {
    profile: JSON.stringify(profile),
    family: JSON.stringify(memberContext),
    history: JSON.stringify(
      buildMemoryContext(history, []).map((m) => ({ content: m.content, facts: m.extractedFacts }))
    ),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
  })}\n\nDOMAIN FOCUS:\n${domainContext}`;

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    const rawRecs = Array.isArray(result.recommendations) ? result.recommendations : [];
    const rawTasks = Array.isArray(result.tasks) ? result.tasks : [];
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
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), { json: true });
    const result = JSON.parse(textResult || '{}');
    const rawRecs = Array.isArray(result.recommendations) ? result.recommendations : [];
    const rawTasks = Array.isArray(result.tasks) ? result.tasks : [];
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
  }
};

const generateEventPrepPlan = async (
  event: TimelineEvent,
  profile: UserProfile,
  history: MemoryEntry[]
): Promise<Recommendation> => {
  const prompt = `
    You are the Areté Chief of Staff. Generate a high-fidelity "Preparation Strategy" for an upcoming event.
    Use Google Search to find specific checklists or requirements if the event is a known public activity (e.g. Marathons, specific travel destinations).

    EVENT: ${JSON.stringify(event)}
    USER_PROFILE: ${JSON.stringify(profile)}
    HISTORY_CONTEXT: ${JSON.stringify(buildMemoryContext(history, [], 15).map((m) => m.content))}

    RETURN ONLY JSON.
  `;

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      id: `prep-${Date.now()}`,
      ownerId: profile.id,
      createdAt: Date.now(),
      status: 'ACTIVE',
      needsReview: false,
      evidenceLinks: { claims: [], sources: [] },
    };
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(prompt), { json: true });
    const result = JSON.parse(textResult || '{}');
    return {
      ...result,
      id: `prep-${Date.now()}`,
      ownerId: profile.id,
      createdAt: Date.now(),
      status: 'ACTIVE',
      needsReview: false,
      evidenceLinks: { claims: [], sources: [] },
    };
  }
};

const generateDeepInitialization = async (
  profile: UserProfile,
  ruleOfLife: any
): Promise<Record<string, any>> => {
  const prompt = `
You are performing FIRST IMPRESSION ANALYSIS for Areté Life OS.

PROFILE DATA:
${JSON.stringify(profile, null, 2)}

RULE OF LIFE:
${JSON.stringify(ruleOfLife, null, 2)}

GOAL: Demonstrate deep understanding of this person. Make them feel "seen."

ANALYSIS TASKS:
1. Identify 3-5 immediate actionable tasks based on their specific profile
2. Identify 2-3 blind spots or risks based on profile gaps
3. Generate 4-6 personalized "Always Do" routines with specific rationale
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

  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(prompt);
    return JSON.parse(textResult || '{}');
  }
};

const processInput = async (
  input: string,
  history: MemoryEntry[],
  activeProfile: UserProfile,
  files: { data: string; mimeType: string }[] | undefined,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  fileMeta: { name?: string; mimeType: string; size?: number }[] = []
): Promise<any> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
    relationToActive:
      activeProfile.relationships.find((r) => r.relatedToUserId === m.id)?.type || 'Self',
  }));

  const template =
    promptConfig.template && promptConfig.template.includes('"items"')
      ? promptConfig.template
      : LOG_BAR_INGEST_PROMPT;
  const finalPrompt = fillTemplate(template, {
    profile: JSON.stringify(activeProfile),
    family: JSON.stringify(memberContext),
    history: JSON.stringify(buildMemoryContext(history, [], 10)),
    input,
    fileMeta: JSON.stringify(fileMeta || []),
  });

  const parts: any[] = [{ text: finalPrompt }];
  if (files && files.length > 0) {
    files.forEach((f) => {
      parts.push({
        inlineData: {
          mimeType: f.mimeType,
          data: f.data,
        },
      });
    });
  }

  try {
    const ai = getClient();
    const model = getModel('flash');
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), { json: true });
    return JSON.parse(textResult || '{}');
  }
};

const generateTasks = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[]
): Promise<DailyTask[]> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(buildMemoryContext(history, [], 10)),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    input:
      "Generate active tasks based on recent history and profile goals. Include a 'methodology' field explaining STRATEGICALLY how to complete the task accurately. Include 'valueResonance' (High/Medium/Low) compared to coreValues.\n\nDOMAIN FOCUS:\n" +
      domainContext,
  });
  try {
    const ai = getClient();
    const model = getModel('flash');
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const parsed = JSON.parse(response.text || '[]');
    const tasks = Array.isArray(parsed) ? parsed : parsed?.tasks || [];
    return tasks.map((t: any) => ({ ...t, completed: false }));
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), { json: true });
    const parsed = JSON.parse(textResult || '[]');
    const tasks = Array.isArray(parsed) ? parsed : parsed?.tasks || [];
    return tasks.map((t: any) => ({ ...t, completed: false }));
  }
};

const generateInsights = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[]
): Promise<ProactiveInsight[]> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(buildMemoryContext(history, [], 30)),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    input:
      'Generate proactive insights for achieving excellence. Use google search if appropriate to find relevant news/trends in their field.\n\nDOMAIN FOCUS:\n' +
      domainContext,
  });
  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });
    const parsed = JSON.parse(response.text || '[]');
    return Array.isArray(parsed) ? parsed : parsed?.insights || [];
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), { json: true });
    const parsed = JSON.parse(textResult || '[]');
    return Array.isArray(parsed) ? parsed : parsed?.insights || [];
  }
};

const generateBlindSpots = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = [],
  financeMetrics?: FinanceMetrics | null,
  missingData?: string[]
): Promise<BlindSpot[]> => {
  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(buildMemoryContext(history, [], 30)),
    family: JSON.stringify(memberContext),
    financeMetrics: JSON.stringify(financeMetrics || null),
    missingData: JSON.stringify(missingData || []),
    currentDate: new Date().toISOString(),
    input:
      'Analyze for potential blind spots. Be critical of discrepancies between stated values and logged behavior.\n\nDOMAIN FOCUS:\n' +
      domainContext,
  });
  try {
    const ai = getClient();
    const model = getModel('pro');
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    const parsed = JSON.parse(response.text || '[]');
    return Array.isArray(parsed) ? parsed : parsed?.blindSpots || [];
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), { json: true });
    const parsed = JSON.parse(textResult || '[]');
    return Array.isArray(parsed) ? parsed : parsed?.blindSpots || [];
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
    history: JSON.stringify(buildMemoryContext(history, [], 20).map(m => m.content)),
    coreValues: profile.spiritual.coreValues.join(', '),
  });

  try {
    const ai = getClient();
    const model = getModel('pro'); // Use Pro for strategic planning
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const plan = JSON.parse(response.text || '[]');
    const planArray = Array.isArray(plan) ? plan : (plan?.tasks ?? []);
    return planArray.map((p: any) => ({
      ...p,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ownerId: profile.id,
      completed: false,
      createdAt: Date.now(),
    }));
  } catch (err) {
    if (!getOpenAIClient()) throw err;
    const textResult = await callOpenAI(toJsonPrompt(finalPrompt), { json: true });
    const plan = JSON.parse(textResult || '[]');
    const planArray = Array.isArray(plan) ? plan : (plan?.tasks ?? []);
    return planArray.map((p: any) => ({
      ...p,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ownerId: profile.id,
      completed: false,
      createdAt: Date.now(),
    }));
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
        payload.missingData
      );
    case 'generateEventPrepPlan':
      return await generateEventPrepPlan(payload.event, payload.profile, payload.history);
    case 'generateDeepInitialization':
      return await generateDeepInitialization(payload.profile, payload.ruleOfLife);
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
        payload.missingData
      );
    case 'generateInsights':
      return await generateInsights(
        payload.history,
        payload.profile,
        payload.promptConfig,
        payload.familyMembers,
        payload.financeMetrics,
        payload.missingData
      );
    case 'generateBlindSpots':
      return await generateBlindSpots(
        payload.history,
        payload.profile,
        payload.promptConfig,
        payload.familyMembers,
        payload.financeMetrics,
        payload.missingData
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
