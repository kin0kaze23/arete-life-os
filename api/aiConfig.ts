/**
 * AI Configuration Module
 *
 * Centralized configuration for AI model selection, clients, and utilities.
 * Extracted from api/gemini.ts for better modularity.
 */

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const DEFAULT_PRO_MODEL = 'gemini-3-pro-preview';
const DEFAULT_FLASH_MODEL = 'gemini-3-flash-preview';

const withLatency = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.info(`[ai][latency] ${label} ${Date.now() - start}ms`);
  }
};

/**
 * Get the configured Gemini model name
 */
export const getModel = (kind: 'pro' | 'flash'): string => {
  const raw = kind === 'pro' ? process.env.GEMINI_MODEL_PRO : process.env.GEMINI_MODEL_FLASH;
  const value = raw?.trim();
  if (value && value.length > 0) return value;
  return kind === 'pro' ? DEFAULT_PRO_MODEL : DEFAULT_FLASH_MODEL;
};

export const getFlashLiteModel = (): string => {
  const value = process.env.GEMINI_MODEL_FLASH_LITE?.trim();
  if (value && value.length > 0) return value;
  return getModel('flash');
};

/**
 * Get the configured OpenAI model name
 */
export const getOpenAIModel = (): string => {
  const value = process.env.OPENAI_MODEL?.trim();
  if (value && value.length > 0) return value;
  return 'gpt-5.1';
};

export type OpenAIReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

/**
 * Get the configured OpenAI reasoning effort level
 */
export const getOpenAIReasoningEffort = (): OpenAIReasoningEffort => {
  const value = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  const allowed: OpenAIReasoningEffort[] = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];
  if (value && (allowed as string[]).includes(value)) return value as OpenAIReasoningEffort;
  return 'medium';
};

/**
 * Get OpenAI client (returns null if API key not configured)
 */
export const getOpenAIClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

/**
 * Get Gemini client (throws if API key not configured)
 */
export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  return new GoogleGenAI({ apiKey });
};

/**
 * Add JSON instruction to prompt
 */
export const toJsonPrompt = (prompt: string): string => `${prompt}\n\nReturn JSON only.`;

/**
 * Fill template placeholders with data
 */
export const fillTemplate = (template: string, data: Record<string, string>): string => {
  let res = template;
  for (const [key, value] of Object.entries(data)) {
    res = res.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return res;
};

/**
 * Call OpenAI API with optional JSON mode
 */
export const callOpenAI = async (
  input: string,
  options?: { json?: boolean; label?: string }
): Promise<string> => {
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

/**
 * Redact sensitive information from strings (API keys, tokens)
 */
export const redactSensitive = (value: string): string =>
  value
    .replace(/AIza[0-9A-Za-z\-_]{10,}/g, '[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]');

/**
 * Serialize error for logging (with sensitive data redacted)
 */
export const serializeError = (err: unknown): Record<string, unknown> => {
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
