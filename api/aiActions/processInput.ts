/**
 * Process Input AI Action
 *
 * Handles the log bar input processing with AI.
 * Extracted from api/gemini.ts for better error isolation and debugging.
 */

import type { MemoryEntry, PromptConfig, UserProfile } from '../../data/types';
import { LOG_BAR_INGEST_PROMPT, buildMemoryContext, buildCompactProfile } from '../../ai/prompts';
import {
  getGeminiClient,
  getModel,
  getFlashLiteModel,
  getOpenAIClient,
  callOpenAI,
  toJsonPrompt,
  fillTemplate,
} from '../aiConfig';
import { modelRouter } from '../modelRouter';

export interface ProcessInputParams {
  input: string;
  history: MemoryEntry[];
  activeProfile: UserProfile;
  files?: { data: string; mimeType: string }[];
  promptConfig?: PromptConfig;
  familyMembers?: UserProfile[];
  fileMeta?: { name?: string; mimeType: string; size?: number }[];
  currentDate?: string;
}

export interface ProcessInputResult {
  items?: any[];
  facts?: any[];
  proposedUpdates?: any[];
  [key: string]: any;
}

const withLatency = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.info(`[ai][latency] ${label} ${Date.now() - start}ms`);
  }
};

const logUsage = (response: any, model: string) => {
  const usage = response?.usageMetadata;
  if (usage) {
    console.info('[ai][usage]', { provider: 'gemini', action: 'processInput', model, usage });
  }
};

/**
 * Build the prompt for log bar processing
 */
const buildPrompt = (params: ProcessInputParams): string => {
  const { input, history, activeProfile, promptConfig, familyMembers = [], fileMeta = [] } = params;

  // Defensive: ensure relationships is an array (legacy vaults may not have this)
  const relationships = Array.isArray(activeProfile.relationships)
    ? activeProfile.relationships
    : [];

  const memberContext = familyMembers.map((m) => ({
    id: m.id,
    name: m.identify?.name || 'User',
    role: m.role,
    relationToActive: relationships.find((r) => r.relatedToUserId === m.id)?.type || 'Self',
  }));

  const template =
    promptConfig?.template && promptConfig.template.includes('"items"')
      ? promptConfig.template
      : LOG_BAR_INGEST_PROMPT;

  const compactProfile = buildCompactProfile(activeProfile);

  return fillTemplate(template, {
    profile: JSON.stringify(compactProfile),
    family: JSON.stringify(memberContext),
    history: JSON.stringify(buildMemoryContext(history, [], 10)),
    input,
    fileMeta: JSON.stringify(fileMeta || []),
    currentDate: params.currentDate || new Date().toISOString(),
  });
};

/**
 * Build contents for Gemini API call
 */
const buildContents = (prompt: string, files?: { data: string; mimeType: string }[]): any => {
  if (files && files.length > 0) {
    const parts: any[] = [{ text: prompt }];
    files.forEach((f) => {
      parts.push({
        inlineData: {
          mimeType: f.mimeType,
          data: f.data,
        },
      });
    });
    return [{ parts }];
  }
  return prompt;
};

/**
 * Process user input through AI
 *
 * This function:
 * 1. Validates input parameters
 * 2. Builds the prompt with context
 * 3. Calls Gemini API (or falls back to OpenAI)
 * 4. Returns structured result
 */
export async function processInput(params: ProcessInputParams): Promise<ProcessInputResult> {
  const { input, files } = params;

  // Validation
  if (!input || typeof input !== 'string') {
    console.warn('[processInput] Invalid input, returning empty result');
    return {};
  }

  const prompt = buildPrompt(params);
  const contents = buildContents(prompt, files);

  const callGemini = async (model: string) => {
    const ai = getGeminiClient();
    console.log('[processInput] Calling Gemini with model:', model);
    const response = await withLatency(`gemini:processInput:${model}`, () =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );
    logUsage(response, model);
    return JSON.parse(response.text || '{}');
  };

  const isValidResult = (result: any) => {
    if (!result || typeof result !== 'object') return false;
    if (Array.isArray(result.items)) return true;
    if (Array.isArray(result.facts)) return true;
    if (Array.isArray(result.proposedUpdates)) return true;
    if (typeof result.intent === 'string') return true;
    if (result.needsReview) return true;
    return false;
  };

  try {
    if (process.env.AI_USE_ROUTER === '1') {
      return await modelRouter.generateJSON('processInput', prompt, undefined, {
        files,
      });
    }
    const flashLiteModel = getFlashLiteModel();
    const result = await callGemini(flashLiteModel);
    if (isValidResult(result)) {
      console.log('[processInput] Success, items:', result.items?.length || 0);
      return result;
    }
    console.warn('[processInput] Flash-Lite result invalid, retrying with Pro');
    const proResult = await callGemini(getModel('pro'));
    if (isValidResult(proResult)) {
      console.log('[processInput] Pro fallback success, items:', proResult.items?.length || 0);
      return proResult;
    }
    throw new Error('Invalid AI intake output');
  } catch (geminiError) {
    console.error('[processInput] Gemini failed:', geminiError);

    // Fallback to OpenAI if available
    const openAIClient = getOpenAIClient();
    if (!openAIClient) {
      console.error('[processInput] No OpenAI fallback available, throwing');
      throw geminiError;
    }

    try {
      console.log('[processInput] Falling back to OpenAI');
      const textResult = await callOpenAI(toJsonPrompt(prompt), {
        json: true,
        label: 'processInput',
      });
      return JSON.parse(textResult || '{}');
    } catch (openAIError) {
      console.error('[processInput] OpenAI fallback also failed:', openAIError);
      throw openAIError;
    }
  }
}
