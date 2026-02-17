import type { ProviderType } from './types';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { OpenAICompatibleProvider } from './openai-compatible';
import { AnthropicProvider } from './anthropic';

export const getProvider = (type: ProviderType, apiKey: string, model: string) => {
  switch (type) {
    case 'gemini':
      return new GeminiProvider(apiKey, model);
    case 'openai':
      return new OpenAIProvider(apiKey, model);
    case 'anthropic':
      return new AnthropicProvider(apiKey, model);
    case 'xai':
    case 'mistral':
    case 'deepseek':
    case 'groq':
    case 'together':
    case 'fireworks':
      return new OpenAICompatibleProvider(type, apiKey, model);
    default:
      throw new Error(`Unsupported provider: ${type}`);
  }
};
