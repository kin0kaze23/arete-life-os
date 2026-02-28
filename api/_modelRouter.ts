import type { ZodSchema } from 'zod';
import type { AIProvider, GenerateOptions, ProviderType } from './_providers/types.js';
import { getProvider } from './_providers/index.js';

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

const PROVIDER_KEY_ENV: Record<ProviderType, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  xai: 'XAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  groq: 'GROQ_API_KEY',
  together: 'TOGETHER_API_KEY',
  fireworks: 'FIREWORKS_API_KEY',
};

const PROVIDERS = Object.keys(PROVIDER_KEY_ENV) as ProviderType[];

const isProviderType = (value: string | undefined | null): value is ProviderType =>
  Boolean(value) && PROVIDERS.includes(value as ProviderType);

const parseModelEnv = (
  value: string | undefined
): { provider: ProviderType; model: string } | null => {
  if (!value) return null;
  const [providerRaw, modelRaw] = value.split(':');
  const providerCandidate = providerRaw?.trim().toLowerCase();
  const model = modelRaw?.trim();
  if (!isProviderType(providerCandidate) || !model) return null;
  return { provider: providerCandidate, model };
};

const getApiKey = (envVar: string): string => {
  const value = process.env[envVar];
  if (!value) throw new Error(`Missing ${envVar}`);
  return value;
};

const hasApiKey = (provider: ProviderType): boolean => {
  const envVar = PROVIDER_KEY_ENV[provider];
  return Boolean(process.env[envVar]);
};

const providerDefaultModel = (provider: ProviderType): string => {
  switch (provider) {
    case 'gemini':
      return (
        process.env.GEMINI_MODEL_FLASH_LITE ||
        process.env.GEMINI_MODEL_FLASH ||
        process.env.GEMINI_MODEL_PRO ||
        'gemini-2.5-flash'
      );
    case 'openai':
      return process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    case 'xai':
      return process.env.XAI_MODEL || 'grok-3-mini';
    case 'anthropic':
      return process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';
    case 'mistral':
      return process.env.MISTRAL_MODEL || 'mistral-small-latest';
    case 'deepseek':
      return process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    case 'groq':
      return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    case 'together':
      return process.env.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
    case 'fireworks':
      return process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/llama-v3p1-70b-instruct';
    default:
      return 'gemini-2.5-flash';
  }
};

const lowCostGeminiActionModel = (action: string): string => {
  const flashLite = process.env.GEMINI_MODEL_FLASH_LITE || 'gemini-2.5-flash-lite';
  const flash = process.env.GEMINI_MODEL_FLASH || 'gemini-2.5-flash';
  const pro = process.env.GEMINI_MODEL_PRO || 'gemini-2.5-pro';

  switch (action) {
    case 'processInput':
      return flashLite;
    case 'generateStrategicBriefing':
      return flash;
    case 'generateDeepTasks':
    case 'generateDeepInitialization':
      return pro;
    default:
      return flash;
  }
};

const defaultModelConfig = (action?: string): ModelConfig => {
  const providerCandidate = process.env.AI_DEFAULT_PROVIDER?.trim().toLowerCase();
  const provider = isProviderType(providerCandidate) ? providerCandidate : 'gemini';
  const model =
    process.env.AI_DEFAULT_MODEL ||
    (provider === 'gemini' ? lowCostGeminiActionModel(action || '') : providerDefaultModel(provider));

  return {
    provider,
    model,
    apiKeyEnvVar: PROVIDER_KEY_ENV[provider],
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
      apiKeyEnvVar: PROVIDER_KEY_ENV[parsed.provider],
    };
  }
  return defaultModelConfig(action);
};

const resolveFallback = (primaryProvider: ProviderType): ModelConfig | undefined => {
  const explicitProviderRaw = process.env.AI_FALLBACK_PROVIDER?.trim().toLowerCase();
  const explicitProvider = isProviderType(explicitProviderRaw) ? explicitProviderRaw : undefined;
  if (explicitProvider) {
    const explicitModel = process.env.AI_FALLBACK_MODEL || providerDefaultModel(explicitProvider);
    if (hasApiKey(explicitProvider)) {
      return {
        provider: explicitProvider,
        model: explicitModel,
        apiKeyEnvVar: PROVIDER_KEY_ENV[explicitProvider],
      };
    }
  }

  const fallbackCandidates: ProviderType[] = [
    'openai',
    'gemini',
    'xai',
    'anthropic',
    'mistral',
    'deepseek',
    'groq',
    'together',
    'fireworks',
  ];

  const provider = fallbackCandidates.find((candidate) => candidate !== primaryProvider && hasApiKey(candidate));
  if (!provider) return undefined;
  return {
    provider,
    model: providerDefaultModel(provider),
    apiKeyEnvVar: PROVIDER_KEY_ENV[provider],
  };
};

const createProvider = (config: ModelConfig): AIProvider => {
  const apiKey = getApiKey(config.apiKeyEnvVar);
  return getProvider(config.provider, apiKey, config.model);
};

export const modelRouter = {
  resolve(action: string): ActionModelMap[string] {
    const primary = resolveActionConfig(action);
    const fallback = resolveFallback(primary.provider);
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
