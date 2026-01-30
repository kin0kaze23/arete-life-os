import type { ZodSchema } from 'zod';

export type ProviderType =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'deepseek'
  | 'groq'
  | 'together'
  | 'fireworks';

export type Source = { title: string; uri: string };

export type FileAttachment = {
  mimeType: string;
  data: string;
  name?: string;
};

export type ToolDefinition = Record<string, unknown>;

export type GenerateOptions = {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  files?: FileAttachment[];
  tools?: ToolDefinition[];
};

export interface AIProvider {
  name: ProviderType;
  generateJSON<T>(prompt: string, schema?: ZodSchema<T>, options?: GenerateOptions): Promise<T>;
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateWithSearch?(
    prompt: string,
    options?: GenerateOptions
  ): Promise<{ text: string; sources: Source[] }>;
  supportsFileUpload: boolean;
  supportsSearch: boolean;
}
