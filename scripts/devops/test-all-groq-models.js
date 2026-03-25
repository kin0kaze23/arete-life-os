#!/usr/bin/env node

/**
 * Test ALL Groq models for Mode 3 quality
 * Find the best quality/cost/speed balance
 */

import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq models to test
const MODELS = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    pricing: { input: 0.05, output: 0.08 },
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    pricing: { input: 0.59, output: 0.79 },
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    pricing: { input: 0.11, output: 0.34 },
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    pricing: { input: 0.2, output: 0.6 },
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen3 32B',
    pricing: { input: 0.3, output: 0.4 },
  },
];

// Test cases
const TESTS = [
  {
    name: 'React Component',
    prompt: `Create a TypeScript React component for a user dashboard card showing: avatar, name, email, stats (followers/following), and action buttons (Edit/Message). Use Tailwind CSS. Make it responsive and accessible.`,
    features: ['TypeScript', 'Tailwind', 'responsive', 'accessible', 'button'],
  },
  {
    name: 'Complex Validation',
    prompt: `Create a TypeScript validator for user registration with: email (valid format), password (12+ chars, uppercase, lowercase, number, special char), username (3-20 alphanumeric), age (18-120), and phone (international). Return detailed validation errors with field names.`,
    features: ['email', 'password', 'validation', 'error', 'TypeScript'],
  },
];

console.log('🧪 Testing All Groq Models for Quality\n');
console.log('='.repeat(70));

const results = {};

for (const model of MODELS) {
  console.log(`\n\n📊 Testing: ${model.name} (${model.id})`);
  console.log('='.repeat(70));

  results[model.id] = {
    name: model.name,
    tests: [],
    totalCost: 0,
    totalDuration: 0,
    avgQuality: 0,
    errors: 0,
  };

  for (const test of TESTS) {
    console.log(`\n  Test: ${test.name}`);

    try {
      const start = Date.now();

      const response = await groq.chat.completions.create({
        model: model.id,
        messages: [{ role: 'user', content: test.prompt }],
        temperature: 0.2,
        max_tokens: 2000,
      });

      const duration = Date.now() - start;
      const output = response.choices[0].message.content;
      const tokens = response.usage;

      // Calculate cost
      const cost =
        (tokens.prompt_tokens * model.pricing.input +
          tokens.completion_tokens * model.pricing.output) /
        1_000_000;

      // Check quality
      const featuresFound = test.features.filter((f) =>
        output.toLowerCase().includes(f.toLowerCase())
      );
      const quality = (featuresFound.length / test.features.length) * 10;

      // Count code blocks
      const codeBlocks = (output.match(/```/g) || []).length / 2;

      results[model.id].tests.push({
        name: test.name,
        duration,
        cost,
        quality,
        featuresFound: featuresFound.length,
        totalFeatures: test.features.length,
        codeBlocks,
        outputLength: output.length,
      });

      results[model.id].totalCost += cost;
      results[model.id].totalDuration += duration;
      results[model.id].avgQuality += quality;

      console.log(`    ✅ Duration: ${duration}ms`);
      console.log(`    💰 Cost: $${cost.toFixed(6)}`);
      console.log(`    📊 Features: ${featuresFound.length}/${test.features.length}`);
      console.log(`    🎯 Quality: ${quality.toFixed(1)}/10`);
      console.log(`    📝 Output: ${output.length} chars, ${codeBlocks} code blocks`);
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      results[model.id].errors++;
    }

    // Brief pause
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Calculate averages
  const testCount = results[model.id].tests.length;
  if (testCount > 0) {
    results[model.id].avgQuality /= testCount;
    results[model.id].avgDuration = results[model.id].totalDuration / testCount;
  }
}

// Final Summary
console.log('\n\n');
console.log('='.repeat(70));
console.log('📊 FINAL COMPARISON');
console.log('='.repeat(70));

// Sort by quality
const sortedByQuality = Object.entries(results)
  .filter(([_, r]) => r.tests.length > 0)
  .sort((a, b) => b[1].avgQuality - a[1].avgQuality);

console.log('\n🏆 RANKED BY QUALITY:\n');
sortedByQuality.forEach(([id, r], i) => {
  console.log(`${i + 1}. ${r.name}`);
  console.log(`   Quality: ${r.avgQuality.toFixed(1)}/10`);
  console.log(`   Speed: ${r.avgDuration.toFixed(0)}ms avg`);
  console.log(`   Cost: $${r.totalCost.toFixed(6)} total`);
  console.log(`   Errors: ${r.errors}`);
  console.log('');
});

// Cost efficiency (quality per dollar)
console.log('\n💰 COST EFFICIENCY (Quality per $0.001):\n');
const costEfficiency = sortedByQuality
  .map(([id, r]) => ({
    ...r,
    id,
    efficiency: r.totalCost > 0 ? r.avgQuality / (r.totalCost * 1000) : 0,
  }))
  .sort((a, b) => b.efficiency - a.efficiency);

costEfficiency.forEach((r, i) => {
  console.log(`${i + 1}. ${r.name}: ${r.efficiency.toFixed(0)} quality points per $0.001`);
});

// Speed leaders
console.log('\n⚡ FASTEST MODELS:\n');
const sortedBySpeed = Object.entries(results)
  .filter(([_, r]) => r.tests.length > 0)
  .sort((a, b) => a[1].avgDuration - b[1].avgDuration);

sortedBySpeed.slice(0, 3).forEach(([id, r], i) => {
  console.log(`${i + 1}. ${r.name}: ${r.avgDuration.toFixed(0)}ms`);
});

// Recommendations
console.log('\n\n🎯 RECOMMENDATIONS:\n');

const best = sortedByQuality[0][1];
const cheapest = sortedBySpeed.find(([_, r]) => r.avgQuality >= 8)?.[1] || sortedBySpeed[0][1];
const balanced = costEfficiency[0];

console.log(`🏆 HIGHEST QUALITY: ${best.name}`);
console.log(`   - Quality: ${best.avgQuality.toFixed(1)}/10`);
console.log(`   - Cost: $${best.totalCost.toFixed(6)}`);
console.log(`   - Speed: ${best.avgDuration.toFixed(0)}ms`);

console.log(`\n💎 BEST VALUE: ${balanced.name}`);
console.log(`   - Efficiency: ${balanced.efficiency.toFixed(0)} quality/$0.001`);
console.log(`   - Quality: ${balanced.avgQuality.toFixed(1)}/10`);
console.log(`   - Cost: $${balanced.totalCost.toFixed(6)}`);

console.log(`\n⚡ FASTEST (8+ quality): ${cheapest.name}`);
console.log(`   - Speed: ${cheapest.avgDuration.toFixed(0)}ms`);
console.log(`   - Quality: ${cheapest.avgQuality.toFixed(1)}/10`);
console.log(`   - Cost: $${cheapest.totalCost.toFixed(6)}`);

console.log('\n✅ Test completed!\n');
