import { GoogleGenAI } from '@google/genai';
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
} from '../types';

const HYPER_PERSONALIZED_PROMPT = `
You are the Chief of Staff for a high-performance individual within the Areté framework. Your task is to provide hyper-personalized, tactical guidance based on a deep analysis of their Life OS data to achieve excellence (Areté).

INPUT DATA:
- ACTIVE_PROFILE: {{profile}}
- MEMORY_CONTEXT: {{history}}
- FAMILY_CONTEXT: {{family}}
- CURRENT_DATE: {{currentDate}}

INSTRUCTIONS:
1. DATA-GROUNDED RATIONALE: Every recommendation MUST reference a specific fact from MEMORY_CONTEXT or a field in ACTIVE_PROFILE.
2. VALUE ALIGNMENT: Check if tasks align with the user's Spiritual coreValues. Flag "Moral Friction" if they contradict.
3. TACTICAL PRECISION: Provide an "Operating Manual" for every task. Never leave the user hanging.
4. DEFINITION OF DONE (DoD): Specify exactly what "completed" looks like for every item.

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
      "resonanceScore": 1-100 // How well this aligns with core values
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
      "valueResonance": "High|Medium|Low"
    }
  ]
}
`;

const DEFAULT_PRO_MODEL = 'gemini-3-pro-preview';
const DEFAULT_FLASH_MODEL = 'gemini-3-flash-preview';

const getModel = (kind: 'pro' | 'flash') => {
  const raw = kind === 'pro' ? process.env.GEMINI_MODEL_PRO : process.env.GEMINI_MODEL_FLASH;
  const value = raw?.trim();
  if (value && value.length > 0) return value;
  return kind === 'pro' ? DEFAULT_PRO_MODEL : DEFAULT_FLASH_MODEL;
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
  const ai = getClient();
  const model = getModel('pro');

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(history.slice(-20)),
    input: text,
  });

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
};

const generateDeepTasks = async (
  profile: UserProfile,
  history: MemoryEntry[],
  familyMembers: UserProfile[],
  promptConfig: PromptConfig
): Promise<{ recommendations: Recommendation[]; tasks: DailyTask[] }> => {
  const ai = getClient();
  const model = getModel('pro');

  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
  }));

  const finalPrompt = fillTemplate(promptConfig.template || HYPER_PERSONALIZED_PROMPT, {
    profile: JSON.stringify(profile),
    family: JSON.stringify(memberContext),
    history: JSON.stringify(
      history.slice(-30).map((m) => ({ content: m.content, facts: m.extractedFacts }))
    ),
    currentDate: new Date().toISOString(),
  });

  const response = await ai.models.generateContent({
    model,
    contents: finalPrompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const result = JSON.parse(response.text || '{}');
  const timestamp = Date.now();

  return {
    recommendations: (result.recommendations || []).map((r: any) => ({
      ...r,
      id: `rec-${timestamp}-${Math.random().toString(36).substr(2, 5)}`,
      ownerId: profile.id,
      createdAt: timestamp,
      status: 'ACTIVE',
    })),
    tasks: (result.tasks || []).map((t: any) => ({
      ...t,
      id: `deep-task-${timestamp}-${Math.random().toString(36).substr(2, 5)}`,
      ownerId: profile.id,
      createdAt: timestamp,
      completed: false,
    })),
  };
};

const generateEventPrepPlan = async (
  event: TimelineEvent,
  profile: UserProfile,
  history: MemoryEntry[]
): Promise<Recommendation> => {
  const ai = getClient();
  const model = getModel('pro');

  const prompt = `
    You are the Areté Chief of Staff. Generate a high-fidelity "Preparation Strategy" for an upcoming event.
    Use Google Search to find specific checklists or requirements if the event is a known public activity (e.g. Marathons, specific travel destinations).

    EVENT: ${JSON.stringify(event)}
    USER_PROFILE: ${JSON.stringify(profile)}
    HISTORY_CONTEXT: ${JSON.stringify(history.slice(-15).map((m) => m.content))}

    RETURN ONLY JSON.
  `;

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
};

const processInput = async (
  input: string,
  history: MemoryEntry[],
  activeProfile: UserProfile,
  files: { data: string; mimeType: string }[] | undefined,
  promptConfig: PromptConfig,
  familyMembers: UserProfile[] = []
): Promise<any> => {
  const ai = getClient();
  const model = getModel('flash');

  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify.name,
    role: m.role,
    relationToActive:
      activeProfile.relationships.find((r) => r.relatedToUserId === m.id)?.type || 'Self',
  }));

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(activeProfile),
    family: JSON.stringify(memberContext),
    history: JSON.stringify(history.slice(-10)),
    input,
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

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text || '{}');
};

const generateTasks = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig
): Promise<DailyTask[]> => {
  const ai = getClient();
  const model = getModel('flash');
  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(history.slice(-10)),
    input:
      "Generate active tasks based on recent history and profile goals. Include a 'methodology' field explaining STRATEGICALLY how to complete the task accurately. Include 'valueResonance' (High/Medium/Low) compared to coreValues.",
  });
  const response = await ai.models.generateContent({
    model,
    contents: finalPrompt,
    config: {
      responseMimeType: 'application/json',
    },
  });
  const tasks = JSON.parse(response.text || '[]');
  return tasks.map((t: any) => ({ ...t, completed: false }));
};

const generateInsights = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig
): Promise<ProactiveInsight[]> => {
  const ai = getClient();
  const model = getModel('pro');
  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(history.slice(-30)),
    input:
      'Generate proactive insights for achieving excellence. Use google search if appropriate to find relevant news/trends in their field.',
  });
  const response = await ai.models.generateContent({
    model,
    contents: finalPrompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
    },
  });
  return JSON.parse(response.text || '[]');
};

const generateBlindSpots = async (
  history: MemoryEntry[],
  profile: UserProfile,
  promptConfig: PromptConfig
): Promise<BlindSpot[]> => {
  const ai = getClient();
  const model = getModel('pro');
  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    history: JSON.stringify(history.slice(-30)),
    input:
      'Analyze for potential blind spots. Be critical of discrepancies between stated values and logged behavior.',
  });
  const response = await ai.models.generateContent({
    model,
    contents: finalPrompt,
    config: {
      responseMimeType: 'application/json',
    },
  });
  return JSON.parse(response.text || '[]');
};

const generateDailyPlan = async (
  profile: UserProfile,
  timeline: TimelineEvent[],
  goals: Goal[],
  blindSpots: BlindSpot[],
  ruleOfLife: any,
  promptConfig: PromptConfig
): Promise<DailyTask[]> => {
  const ai = getClient();
  const model = getModel('flash');

  const prompt = `
    Synthesize a time-blocked "Daily Mission".
    MANDATORY: Rank tasks by their resonance with the user's Core Values: ${profile.spiritual.coreValues.join(', ')}.
    Include high-fidelity "methodology" for every task.
    Slot into specific start/end times.
    RETURN AN ARRAY OF DailyTask OBJECTS.
  `;

  const finalPrompt = fillTemplate(promptConfig.template || promptConfig.defaultTemplate, {
    profile: JSON.stringify(profile),
    timeline: JSON.stringify(timeline),
    goals: JSON.stringify(goals),
    blindSpots: JSON.stringify(blindSpots),
    ruleOfLife: JSON.stringify(ruleOfLife),
    input: prompt,
  });

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
        payload.promptConfig
      );
    case 'generateEventPrepPlan':
      return await generateEventPrepPlan(payload.event, payload.profile, payload.history);
    case 'processInput':
      return await processInput(
        payload.input,
        payload.history,
        payload.activeProfile,
        payload.files,
        payload.promptConfig,
        payload.familyMembers
      );
    case 'generateTasks':
      return await generateTasks(payload.history, payload.profile, payload.promptConfig);
    case 'generateInsights':
      return await generateInsights(payload.history, payload.profile, payload.promptConfig);
    case 'generateBlindSpots':
      return await generateBlindSpots(payload.history, payload.profile, payload.promptConfig);
    case 'generateDailyPlan':
      return await generateDailyPlan(
        payload.profile,
        payload.timeline,
        payload.goals,
        payload.blindSpots,
        payload.ruleOfLife,
        payload.promptConfig
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
    res.status(500).json({ error: 'Gemini request failed', id: errorId });
  }
}
