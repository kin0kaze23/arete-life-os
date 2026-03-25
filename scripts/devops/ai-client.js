import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the root directory
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GEMINI_API_KEY && !OPENAI_API_KEY && !GROQ_API_KEY) {
  console.error('❌ Error: No AI API key set in .env.local (GEMINI/OPENAI/GROQ)');
  process.exit(1);
}

// Initialize clients
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Model cascade configuration - Pure Groq Strategy
const MODEL_CASCADE = {
  primary: {
    provider: 'groq',
    name: process.env.GROQ_MODEL_PRIMARY || 'llama-3.1-8b-instant',
    maxRetries: 2,
    description: 'Primary (fast & cheap)',
  },
  escalate: {
    provider: 'groq',
    name: process.env.GROQ_MODEL_ESCALATE || 'llama-3.3-70b-versatile',
    maxRetries: 2,
    description: 'Escalate (quality & reasoning)',
  },
  fallback: {
    provider: 'groq',
    name: process.env.GROQ_MODEL_ESCALATE || 'llama-3.3-70b-versatile',
    maxRetries: 1,
    description: 'Ultimate fallback',
  },
};

// Pricing table ($/1M tokens) - Updated Feb 2026
const PRICING = {
  // Groq models (primary)
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'meta-llama/llama-4-scout-17b-16e-instruct': { input: 0.11, output: 0.34 },
  'meta-llama/llama-4-maverick-17b-128e-instruct': { input: 0.2, output: 0.6 },
  'qwen/qwen3-32b': { input: 0.3, output: 0.4 },
  // OpenAI models (legacy)
  'gpt-5-mini': { input: 0.25, output: 2.0 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'gpt-5.2': { input: 1.75, output: 14.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'o1-mini': { input: 3.0, output: 12.0 },
  // Gemini models (legacy)
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.0-flash': { input: 0.075, output: 0.3 },
  'gemini-2.0-flash-thinking-exp': { input: 0.075, output: 0.3 },
};

// Session tracking
let sessionCost = 0;
let sessionUsage = {};

/**
 * Main AI call with automatic cascade and retry logic
 */
export async function callGemini(params) {
  const {
    prompt,
    model = null, // If specified, use this model directly
    json = false,
    temperature = 0.2,
    skipCascade = false,
  } = params;

  // Direct model call (legacy compatibility)
  if (model || skipCascade) {
    const targetModel = model || MODEL_CASCADE.primary.name;
    let provider = 'groq'; // Default to groq
    if (targetModel.startsWith('gpt') || targetModel.startsWith('o')) provider = 'openai';
    else if (targetModel.startsWith('gemini')) provider = 'gemini';
    return await executeSingleCall({ prompt, model: targetModel, provider, json, temperature });
  }

  // Cascade through tiers
  const cascade = ['primary', 'escalate', 'complex', 'fallback'];

  for (const tier of cascade) {
    const config = MODEL_CASCADE[tier];

    // Skip if provider not available
    if (config.provider === 'openai' && !openai) continue;
    if (config.provider === 'gemini' && !genAI) continue;
    if (config.provider === 'groq' && !groq) continue;

    console.log(`\n🤖 Tier: ${tier} - ${config.description}`);
    console.log(`   Model: ${config.provider}/${config.name}`);

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await executeSingleCall({
          prompt,
          model: config.name,
          provider: config.provider,
          json,
          temperature,
        });

        console.log(`   ✅ Success on attempt ${attempt}/${config.maxRetries}`);
        return result;
      } catch (error) {
        const isLastAttempt = attempt === config.maxRetries;
        const isLastTier = tier === cascade[cascade.length - 1];

        console.log(`   ⚠️  Attempt ${attempt}/${config.maxRetries} failed: ${error.message}`);

        if (!isLastAttempt) {
          // Retry with exponential backoff
          const backoff = 1000 * Math.pow(2, attempt - 1);
          console.log(`   ⏳ Retrying in ${backoff}ms...`);
          await sleep(backoff);
        } else if (isLastTier) {
          // All cascade tiers exhausted
          throw new Error(`All AI providers exhausted. Last error: ${error.message}`);
        } else {
          // Move to next tier
          console.log(`   ⬆️  Escalating to next tier...`);
          break;
        }
      }
    }
  }
}

/**
 * Execute single API call
 */
async function executeSingleCall({ prompt, model, provider, json, temperature }) {
  const startTime = Date.now();
  let result;
  let inputTokens = 0;
  let outputTokens = 0;

  if (provider === 'openai') {
    // Some models (gpt-5-mini, o3-mini) only support default temperature
    const modelConfig = {
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: json ? { type: 'json_object' } : undefined,
    };

    // Only add temperature for models that support it
    if (!model.includes('gpt-5-mini') && !model.includes('o3')) {
      modelConfig.temperature = temperature;
    }

    const response = await openai.chat.completions.create(modelConfig);

    result = response.choices[0].message.content;
    inputTokens = response.usage?.prompt_tokens || 0;
    outputTokens = response.usage?.completion_tokens || 0;
  } else if (provider === 'gemini') {
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: json ? 'application/json' : 'text/plain',
      },
    });

    result = response.text;
    inputTokens = response.usageMetadata?.promptTokenCount || 0;
    outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  } else if (provider === 'groq') {
    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 8192,
      response_format: json ? { type: 'json_object' } : undefined,
    });

    result = response.choices[0].message.content;
    inputTokens = response.usage?.prompt_tokens || 0;
    outputTokens = response.usage?.completion_tokens || 0;
  }

  // Track cost
  trackCost(model, inputTokens, outputTokens);

  const duration = Date.now() - startTime;
  console.log(`   ⏱️  Duration: ${duration}ms`);

  // Parse JSON if requested
  if (json) {
    try {
      return JSON.parse(result);
    } catch (parseError) {
      console.error('   ⚠️  Failed to parse JSON. Raw response:', result.substring(0, 200));
      throw new Error('Invalid JSON response from AI');
    }
  }

  return result;
}

/**
 * Track cost for this session
 */
function trackCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model] || { input: 0, output: 0 };
  const cost = (inputTokens * pricing.input) / 1000000 + (outputTokens * pricing.output) / 1000000;

  sessionCost += cost;
  sessionUsage[model] = (sessionUsage[model] || 0) + 1;

  console.log(`   💰 Cost: $${cost.toFixed(5)} (Input: ${inputTokens}, Output: ${outputTokens})`);
  console.log(`   📊 Session total: $${sessionCost.toFixed(5)}`);
}

/**
 * Get session summary
 */
export function getSessionSummary() {
  return {
    totalCost: sessionCost,
    modelUsage: sessionUsage,
    costFormatted: `$${sessionCost.toFixed(3)}`,
  };
}

/**
 * Reset session tracking
 */
export function resetSession() {
  sessionCost = 0;
  sessionUsage = {};
}

/**
 * Helper for implementation-specific prompts (legacy compatibility)
 */
export async function generateCode(prompt, context = {}) {
  return await callGemini({
    prompt,
    json: true,
    temperature: 0.2,
  });
}

/**
 * Utility: Sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Export model configuration for reference
 */
export function getModelConfig() {
  return MODEL_CASCADE;
}
