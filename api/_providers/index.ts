import type { ProviderType } from './types.js';
import { GeminiProvider } from './gemini.js';
import { OpenAIProvider } from './openai.js';
import { OpenAICompatibleProvider } from './openai-compatible.js';
import { AnthropicProvider } from './anthropic.js';

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
