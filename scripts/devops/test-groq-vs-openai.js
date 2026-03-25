#!/usr/bin/env node

/**
 * Comparative test: Groq llama-3.1-8b vs OpenAI gpt-5-mini
 * Tests typical Mode 3 automation tasks
 */

import Groq from 'groq-sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test cases representing typical Mode 3 tasks
const TEST_CASES = [
  {
    name: 'React Component Generation',
    prompt: `Create a React component for a user profile card with avatar, name, email, and a follow button. Use TypeScript and Tailwind CSS.`,
    expectedFeatures: ['TypeScript', 'Tailwind', 'button', 'avatar'],
  },
  {
    name: 'API Route Implementation',
    prompt: `Write a Next.js API route that handles GET /api/users/:id. It should fetch user data from IndexedDB, handle errors, and return JSON. Use TypeScript.`,
    expectedFeatures: ['GET', 'IndexedDB', 'error', 'TypeScript'],
  },
  {
    name: 'Data Validation Logic',
    prompt: `Create a TypeScript function to validate a user registration form with email, password (8+ chars, 1 number, 1 special char), and username (3-20 chars). Return detailed error messages.`,
    expectedFeatures: ['email', 'password', 'validation', 'error'],
  },
  {
    name: 'State Management',
    prompt: `Create a Zustand store for managing a todo list with add, remove, toggle, and filter actions. Use TypeScript with proper types.`,
    expectedFeatures: ['zustand', 'TypeScript', 'add', 'remove'],
  },
];

console.log('🧪 Comparative Test: Groq vs OpenAI\n');
console.log('Testing llama-3.1-8b-instant vs gpt-5-mini\n');
console.log('='.repeat(70));

const results = [];

for (const testCase of TEST_CASES) {
  console.log(`\n${testCase.name}`);
  console.log('-'.repeat(70));

  const result = {
    name: testCase.name,
    groq: {},
    openai: {},
  };

  // Test Groq
  try {
    console.log('\n🔥 Testing Groq (llama-3.1-8b-instant)...');
    const groqStart = Date.now();

    const groqResponse = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: testCase.prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const groqDuration = Date.now() - groqStart;
    const groqOutput = groqResponse.choices[0].message.content;
    const groqTokens = groqResponse.usage;

    // Check quality
    const groqHasFeatures = testCase.expectedFeatures.filter((f) =>
      groqOutput.toLowerCase().includes(f.toLowerCase())
    );

    result.groq = {
      duration: groqDuration,
      tokens: groqTokens,
      output: groqOutput,
      featuresFound: groqHasFeatures.length,
      quality: (groqHasFeatures.length / testCase.expectedFeatures.length) * 10,
    };

    console.log(`   ⏱️  Duration: ${groqDuration}ms`);
    console.log(
      `   📊 Tokens: ${groqTokens.prompt_tokens} in, ${groqTokens.completion_tokens} out`
    );
    console.log(
      `   💰 Cost: $${((groqTokens.prompt_tokens * 0.05 + groqTokens.completion_tokens * 0.08) / 1_000_000).toFixed(6)}`
    );
    console.log(`   ✅ Features: ${groqHasFeatures.length}/${testCase.expectedFeatures.length}`);
    console.log(`   📝 Preview: ${groqOutput.substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    result.groq.error = error.message;
  }

  // Test OpenAI
  try {
    console.log('\n🤖 Testing OpenAI (gpt-5-mini)...');
    const openaiStart = Date.now();

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: testCase.prompt }],
      // No temperature for gpt-5-mini (uses default)
    });

    const openaiDuration = Date.now() - openaiStart;
    const openaiOutput = openaiResponse.choices[0].message.content;
    const openaiTokens = openaiResponse.usage;

    // Check quality
    const openaiHasFeatures = testCase.expectedFeatures.filter((f) =>
      openaiOutput.toLowerCase().includes(f.toLowerCase())
    );

    result.openai = {
      duration: openaiDuration,
      tokens: openaiTokens,
      output: openaiOutput,
      featuresFound: openaiHasFeatures.length,
      quality: (openaiHasFeatures.length / testCase.expectedFeatures.length) * 10,
    };

    console.log(`   ⏱️  Duration: ${openaiDuration}ms`);
    console.log(
      `   📊 Tokens: ${openaiTokens.prompt_tokens} in, ${openaiTokens.completion_tokens} out`
    );
    console.log(
      `   💰 Cost: $${((openaiTokens.prompt_tokens * 0.25 + openaiTokens.completion_tokens * 2.0) / 1_000_000).toFixed(6)}`
    );
    console.log(`   ✅ Features: ${openaiHasFeatures.length}/${testCase.expectedFeatures.length}`);
    console.log(`   📝 Preview: ${openaiOutput.substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    result.openai.error = error.message;
  }

  results.push(result);

  // Brief pause between tests
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

// Summary
console.log('\n');
console.log('='.repeat(70));
console.log('📊 SUMMARY');
console.log('='.repeat(70));

let groqTotalCost = 0;
let openaiTotalCost = 0;
let groqTotalDuration = 0;
let openaiTotalDuration = 0;
let groqAvgQuality = 0;
let openaiAvgQuality = 0;

results.forEach((r) => {
  if (!r.groq.error) {
    groqTotalCost +=
      (r.groq.tokens.prompt_tokens * 0.05 + r.groq.tokens.completion_tokens * 0.08) / 1_000_000;
    groqTotalDuration += r.groq.duration;
    groqAvgQuality += r.groq.quality;
  }
  if (!r.openai.error) {
    openaiTotalCost +=
      (r.openai.tokens.prompt_tokens * 0.25 + r.openai.tokens.completion_tokens * 2.0) / 1_000_000;
    openaiTotalDuration += r.openai.duration;
    openaiAvgQuality += r.openai.quality;
  }
});

groqAvgQuality /= results.length;
openaiAvgQuality /= results.length;

console.log('\n🔥 Groq (llama-3.1-8b-instant):');
console.log(`   Total Cost: $${groqTotalCost.toFixed(6)}`);
console.log(`   Avg Duration: ${(groqTotalDuration / results.length).toFixed(0)}ms`);
console.log(`   Avg Quality: ${groqAvgQuality.toFixed(1)}/10`);

console.log('\n🤖 OpenAI (gpt-5-mini):');
console.log(`   Total Cost: $${openaiTotalCost.toFixed(6)}`);
console.log(`   Avg Duration: ${(openaiTotalDuration / results.length).toFixed(0)}ms`);
console.log(`   Avg Quality: ${openaiAvgQuality.toFixed(1)}/10`);

console.log('\n💡 Comparison:');
const costSavings = (((openaiTotalCost - groqTotalCost) / openaiTotalCost) * 100).toFixed(1);
const speedImprovement = (
  ((openaiTotalDuration - groqTotalDuration) / openaiTotalDuration) *
  100
).toFixed(1);
const qualityDiff = (openaiAvgQuality - groqAvgQuality).toFixed(1);

console.log(
  `   💰 Cost Savings: ${costSavings}% (Groq ${groqTotalCost < openaiTotalCost ? 'cheaper' : 'more expensive'})`
);
console.log(
  `   ⚡ Speed: ${speedImprovement > 0 ? '+' : ''}${speedImprovement}% (Groq ${groqTotalDuration < openaiTotalDuration ? 'faster' : 'slower'})`
);
console.log(
  `   📊 Quality: ${qualityDiff > 0 ? '-' : '+'}${Math.abs(qualityDiff)} points (Groq ${groqAvgQuality > openaiAvgQuality ? 'better' : 'worse'})`
);

console.log('\n🎯 RECOMMENDATION:');
if (groqAvgQuality >= 7 && costSavings > 50) {
  console.log('   ✅ USE GROQ as primary - Quality acceptable, massive cost savings');
} else if (groqAvgQuality >= 8 && costSavings > 0) {
  console.log('   ✅ USE GROQ as primary - Good quality, cost effective');
} else if (groqAvgQuality < 7) {
  console.log('   ⚠️  CAUTION - Quality below threshold, use GPT-5-mini as primary');
} else {
  console.log('   ℹ️  MIXED - Consider case-by-case usage');
}

console.log('\n✅ Test completed!\n');
