import type { ZodSchema } from 'zod';
import type { AIProvider, GenerateOptions, ProviderType } from './_providers/types';
import { getProvider } from './_providers';

type ModelConfig = {
  provider: ProviderType;
  model: string;
  apiKeyEnvVar: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
  supportsSearch?: boolean;
  supportsFileUpload?: boolean;
};

type ActionModelMap = Record<
  string,
  {
    primary: ModelConfig;
    fallback?: ModelConfig;
    fallback2?: ModelConfig;
  }
>;

const parseModelEnv = (
  value: string | undefined
): { provider: ProviderType; model: string } | null => {
  if (!value) return null;
  const [providerRaw, model] = value.split(':');
  if (!providerRaw || !model) return null;
  return { provider: providerRaw as ProviderType, model };
};

const getApiKey = (envVar: string): string => {
  const value = process.env[envVar];
  if (!value) throw new Error(`Missing ${envVar}`);
  return value;
};

const defaultModelConfig = (): ModelConfig => {
  const provider = (process.env.AI_DEFAULT_PROVIDER as ProviderType) || 'openai';
  return {
    provider,
    model:
      process.env.AI_DEFAULT_MODEL || process.env.OPENAI_MODEL || 'gpt-5-mini',
    apiKeyEnvVar: `${provider.toUpperCase()}_API_KEY`,
    temperature: process.env.AI_DEFAULT_TEMPERATURE
      ? Number(process.env.AI_DEFAULT_TEMPERATURE)
      : undefined,
  };
};

const resolveActionConfig = (action: string): ModelConfig => {
  const envKey = `AI_MODEL_${action.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
  const envValue = process.env[envKey];
  const parsed = parseModelEnv(envValue);
  if (parsed) {
    return {
      provider: parsed.provider,
      model: parsed.model,
      apiKeyEnvVar: `${parsed.provider.toUpperCase()}_API_KEY`,
    } as ModelConfig;
  }
  return defaultModelConfig();
};

const resolveFallback = (): ModelConfig | undefined => {
  const provider =
    (process.env.AI_FALLBACK_PROVIDER as ProviderType | undefined) || ('xai' as ProviderType);
  const model = process.env.AI_FALLBACK_MODEL || 'grok-4-fast-non-reasoning';
  return {
    provider,
    model,
    apiKeyEnvVar: `${provider.toUpperCase()}_API_KEY`,
  };
};

const createProvider = (config: ModelConfig): AIProvider => {
  const apiKey = getApiKey(config.apiKeyEnvVar);
  return getProvider(config.provider, apiKey, config.model);
};

export const modelRouter = {
  resolve(action: string): ActionModelMap[string] {
    const primary = resolveActionConfig(action);
    const fallback = resolveFallback();
    return { primary, fallback };
  },

  async generateJSON<T>(
    action: string,
    prompt: string,
    schema?: ZodSchema<T>,
    options?: GenerateOptions
  ): Promise<T> {
    const { primary, fallback } = this.resolve(action);
    try {
      const provider = createProvider(primary);
      return await provider.generateJSON(prompt, schema, options);
    } catch (err) {
      if (!fallback) throw err;
      const provider = createProvider(fallback);
      return await provider.generateJSON(prompt, schema, options);
    }
  },

  async generateText(action: string, prompt: string, options?: GenerateOptions): Promise<string> {
    const { primary, fallback } = this.resolve(action);
    try {
      const provider = createProvider(primary);
      return await provider.generateText(prompt, options);
    } catch (err) {
      if (!fallback) throw err;
      const provider = createProvider(fallback);
      return await provider.generateText(prompt, options);
    }
  },

  async generateWithSearch(
    action: string,
    prompt: string,
    options?: GenerateOptions
  ): Promise<{ text: string; sources: { title: string; uri: string }[] }> {
    const { primary, fallback } = this.resolve(action);
    try {
      const provider = createProvider(primary);
      if (!provider.generateWithSearch) {
        throw new Error('Search not supported by provider');
      }
      return await provider.generateWithSearch(prompt, options);
    } catch (err) {
      if (!fallback) throw err;
      const provider = createProvider(fallback);
      if (!provider.generateWithSearch) {
        throw err;
      }
      return await provider.generateWithSearch(prompt, options);
    }
  },
};
