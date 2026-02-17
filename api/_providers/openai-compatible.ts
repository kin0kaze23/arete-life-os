import OpenAI from 'openai';
import type { ZodSchema } from 'zod';
import type { AIProvider, GenerateOptions, ProviderType } from './types';

const PROVIDER_ENDPOINTS: Record<string, string> = {
  xai: 'https://api.x.ai/v1',
  mistral: 'https://api.mistral.ai/v1',
  deepseek: 'https://api.deepseek.com',
  groq: 'https://api.groq.com/openai/v1',
  together: 'https://api.together.xyz/v1',
  fireworks: 'https://api.fireworks.ai/inference/v1',
};

const validateSchema = <T>(schema: ZodSchema<T> | undefined, data: unknown): T => {
  if (!schema) return data as T;
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new Error('AI output validation failed');
};

const logUsage = (response: any, model: string, provider: ProviderType) => {
  const usage = response?.usage;
  if (usage) {
    console.info('[ai][usage]', { provider, model, usage });
  }
};

export class OpenAICompatibleProvider implements AIProvider {
  name: ProviderType;
  supportsFileUpload = false;
  supportsSearch = false;

  private client: OpenAI;
  private model: string;

  constructor(provider: ProviderType, apiKey: string, model: string) {
    const baseURL = PROVIDER_ENDPOINTS[provider];
    if (!baseURL) throw new Error(`Unsupported OpenAI-compatible provider: ${provider}`);
    if (!apiKey) throw new Error(`Missing API key for ${provider}`);
    this.name = provider;
    this.client = new OpenAI({ apiKey, baseURL });
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
    logUsage(response, this.model, this.name);
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
    logUsage(response, this.model, this.name);
    return response.output_text || '';
  }
}
