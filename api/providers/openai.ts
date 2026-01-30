import OpenAI from 'openai';
import type { ZodSchema } from 'zod';
import type { AIProvider, GenerateOptions, ProviderType } from './types';

const validateSchema = <T>(schema: ZodSchema<T> | undefined, data: unknown): T => {
  if (!schema) return data as T;
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new Error('AI output validation failed');
};

const logUsage = (response: any, model: string) => {
  const usage = response?.usage;
  if (usage) {
    console.info('[ai][usage]', { provider: 'openai', model, usage });
  }
};

export class OpenAIProvider implements AIProvider {
  name: ProviderType = 'openai';
  supportsFileUpload = true;
  supportsSearch = false;

  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateJSON<T>(
    prompt: string,
    schema?: ZodSchema<T>,
    options?: GenerateOptions
  ): Promise<T> {
    const response = await this.client.responses.create({
      model: this.model,
      input: prompt,
      ...(options?.jsonMode === false ? {} : { text: { format: { type: 'json_object' } } }),
      ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
      ...(typeof options?.maxTokens === 'number' ? { max_output_tokens: options.maxTokens } : {}),
    });
    logUsage(response, this.model);
    const parsed = JSON.parse(response.output_text || '{}');
    return validateSchema(schema, parsed);
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      input: prompt,
      ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
      ...(typeof options?.maxTokens === 'number' ? { max_output_tokens: options.maxTokens } : {}),
    });
    logUsage(response, this.model);
    return response.output_text || '';
  }
}
