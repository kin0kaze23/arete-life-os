import type { ZodSchema } from 'zod';
import type { AIProvider, GenerateOptions, ProviderType } from './types';

const validateSchema = <T>(schema: ZodSchema<T> | undefined, data: unknown): T => {
  if (!schema) return data as T;
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new Error('AI output validation failed');
};

export class AnthropicProvider implements AIProvider {
  name: ProviderType = 'anthropic';
  supportsFileUpload = false;
  supportsSearch = false;

  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
    this.apiKey = apiKey;
    this.model = model;
  }

  private async callAnthropic(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic error: ${response.status} ${text}`);
    }
    const json = (await response.json()) as any;
    const content = Array.isArray(json?.content) ? json.content : [];
    const text = content.map((c: any) => c?.text || '').join('');
    return text;
  }

  async generateJSON<T>(
    prompt: string,
    schema?: ZodSchema<T>,
    options?: GenerateOptions
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nReturn JSON only.`;
    const text = await this.callAnthropic(jsonPrompt, options);
    const parsed = JSON.parse(text || '{}');
    return validateSchema(schema, parsed);
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    return this.callAnthropic(prompt, options);
  }
}
