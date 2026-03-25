import { ZodSchema } from 'zod';
import type {
  AIProvider,
  FileAttachment,
  GenerateOptions,
  Source,
  ToolDefinition,
  ProviderType,
} from './types';

export class DashScopeProvider implements AIProvider {
  name: ProviderType;
  supportsFileUpload = false; // Alibaba DashScope doesn't currently process uploads in this implementation
  supportsSearch = true; // Assuming models support search if configured

  private apiKey: string;
  private model: string;

  constructor(provider: ProviderType, apiKey: string, model: string) {
    this.name = provider;
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateJSON<T>(
    prompt: string,
    schema?: ZodSchema<T>,
    options?: GenerateOptions
  ): Promise<T> {
    // If schema is provided, we want JSON output
    const request = {
      model: this.model,
      input: {
        messages: [
          {
            role: 'system',
            content: options?.systemPrompt || 'You are a helpful assistant. Respond in JSON format as specified by the user.'
          },
          {
            role: 'user',
            content: schema 
              ? `Please respond in JSON format that matches the following schema requirements:\n\n${prompt}`
              : prompt
          }
        ]
      },
      parameters: {
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        result_format: 'json_object' // Request JSON output
      }
    };

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable' // Disable streaming for JSON responses
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DashScope API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract the actual response text
    let responseText = '';
    if (data.output && data.output.choices && data.output.choices.length > 0) {
      responseText = data.output.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from DashScope API');
    }

    try {
      // Extract JSON from response if wrapped in markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText.trim();
      
      const parsed = JSON.parse(jsonString) as T;
      
      // If schema is provided, validate the result
      if (schema) {
        return schema.parse(parsed);
      }
      
      return parsed;
    } catch (e) {
      console.error('Error parsing JSON response from DashScope API:', e);
      console.log('Raw response:', responseText);
      throw new Error(`Failed to parse JSON response from DashScope API: ${(e as Error).message}`);
    }
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const request = {
      model: this.model,
      input: {
        messages: [
          {
            role: 'system',
            content: options?.systemPrompt || 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000
      }
    };

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DashScope API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.output && data.output.choices && data.output.choices.length > 0) {
      return data.output.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from DashScope API');
    }
  }

  async generateWithSearch(
    prompt: string,
    options?: GenerateOptions
  ): Promise<{ text: string; sources: Source[] }> {
    // Alibaba Qwen models support search/retrieval capabilities
    // We'll simulate this with a standard response plus potential source attribution
    
    const request = {
      model: this.model,
      input: {
        messages: [
          {
            role: 'system',
            content: options?.systemPrompt || 'You are a helpful assistant. Provide sources when possible.'
          },
          {
            role: 'user',
            content: `Please answer this question using available information: ${prompt}\n\nIf you use external sources or references, please return them in the format: [SOURCE: title - url]`
          }
        ]
      },
      parameters: {
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000
      }
    };

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DashScope API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.output && data.output.choices && data.output.choices.length > 0) {
      const fullText = data.output.choices[0].message.content;
      
      // Extract sources from the response if present in the specific format
      const sourceRegex = /\[SOURCE:\s*(.*?)\s*-\s*(.*?)\]/g;
      const sources: Source[] = [];
      let match;
      
      while ((match = sourceRegex.exec(fullText)) !== null) {
        sources.push({
          title: match[1].trim(),
          uri: match[2].trim()
        });
      }
      
      // Remove source markers from the text
      const cleanedText = fullText.replace(/(\s*\[SOURCE:\s*.*?\s*-\s*.*?\]\s*)+/g, '').trim();
      
      return {
        text: cleanedText,
        sources
      };
    } else {
      throw new Error('Invalid response format from DashScope API');
    }
  }
}