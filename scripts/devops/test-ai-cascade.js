#!/usr/bin/env node

/**
 * Test script for AI client cascade logic
 * Usage: node scripts/devops/test-ai-cascade.js
 */

import { callGemini, getSessionSummary, getModelConfig } from './ai-client.js';

console.log('🧪 Testing AI Client Cascade Logic\n');

// Show configuration
console.log('📋 Model Configuration:');
const config = getModelConfig();
Object.entries(config).forEach(([tier, details]) => {
  console.log(`   ${tier}: ${details.provider}/${details.name} (${details.description})`);
});

console.log('\n' + '='.repeat(60) + '\n');

// Test 1: Simple prompt
console.log('Test 1: Simple Code Generation');
console.log('Prompt: "Write a JavaScript function that adds two numbers"\n');

try {
  const result = await callGemini({
    prompt: 'Write a JavaScript function that adds two numbers. Return only the function code.',
    json: false,
    temperature: 0.2,
  });

  console.log('\n✅ Result:');
  console.log(result.substring(0, 200) + '...\n');
} catch (error) {
  console.error('\n❌ Error:', error.message);
}

console.log('='.repeat(60) + '\n');

// Test 2: JSON response
console.log('Test 2: JSON Response');
console.log('Prompt: "Return a JSON object with user profile"\n');

try {
  const result = await callGemini({
    prompt:
      'Return a JSON object with fields: name (string), age (number), hobbies (array of strings). Example data.',
    json: true,
    temperature: 0.2,
  });

  console.log('\n✅ Result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('\n❌ Error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Show session summary
const summary = getSessionSummary();
console.log('📊 Session Summary:');
console.log(`   Total Cost: ${summary.costFormatted}`);
console.log(`   Model Usage:`, summary.modelUsage);
console.log('\n✅ All tests completed!\n');
