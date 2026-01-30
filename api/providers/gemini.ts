import { GoogleGenAI } from '@google/genai';
import type { ZodSchema } from 'zod';
import type { AIProvider, GenerateOptions, ProviderType, Source } from './types';

const extractGroundingSources = (response: any): Source[] => {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];
  const urls = chunks
    .map((chunk: any) => ({
      title: chunk?.web?.title,
      uri: chunk?.web?.uri,
    }))
    .filter((item: any) => typeof item?.uri === 'string' && item.uri.length > 0);
  return urls;
};

const buildContents = (prompt: string, files?: GenerateOptions['files']) => {
  if (!files || files.length === 0) return prompt;
  const parts: any[] = [{ text: prompt }];
  files.forEach((file) => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data,
      },
    });
  });
  return [{ parts }];
};

const validateSchema = <T>(schema: ZodSchema<T> | undefined, data: unknown): T => {
  if (!schema) return data as T;
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new Error('AI output validation failed');
};

const logUsage = (response: any, model: string) => {
  const usage = response?.usageMetadata;
  if (usage) {
    console.info('[ai][usage]', { provider: 'gemini', model, usage });
  }
};

export class GeminiProvider implements AIProvider {
  name: ProviderType = 'gemini';
  supportsFileUpload = true;
  supportsSearch = true;

  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateJSON<T>(
    prompt: string,
    schema?: ZodSchema<T>,
    options?: GenerateOptions
  ): Promise<T> {
    const contents = buildContents(prompt, options?.files);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        responseMimeType: 'application/json',
        ...(options?.tools ? { tools: options.tools } : {}),
        ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
        ...(typeof options?.maxTokens === 'number' ? { maxOutputTokens: options.maxTokens } : {}),
      },
    });
    logUsage(response, this.model);
    const parsed = JSON.parse(response.text || '{}');
    return validateSchema(schema, parsed);
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const contents = buildContents(prompt, options?.files);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        ...(options?.tools ? { tools: options.tools } : {}),
        ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
        ...(typeof options?.maxTokens === 'number' ? { maxOutputTokens: options.maxTokens } : {}),
      },
    });
    logUsage(response, this.model);
    return response.text || '';
  }

  async generateWithSearch(
    prompt: string,
    options?: GenerateOptions
  ): Promise<{ text: string; sources: Source[] }> {
    const contents = buildContents(prompt, options?.files);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        tools: [{ googleSearch: {} }],
        ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
        ...(typeof options?.maxTokens === 'number' ? { maxOutputTokens: options.maxTokens } : {}),
      },
    });
    logUsage(response, this.model);
    return { text: response.text || '', sources: extractGroundingSources(response) };
  }
}
