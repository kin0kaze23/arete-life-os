#!/usr/bin/env node

/**
 * Test Mode 3 configuration
 * Verify Groq cascade is working correctly
 */

import { callGemini, getSessionSummary, resetSession } from './ai-client.js';

console.log('🧪 Testing Mode 3 Configuration\n');
console.log('='.repeat(70));

// Test simple cascade
async function testMode3() {
  resetSession();

  console.log('\n📝 Test 1: Simple Component Generation');
  console.log('-'.repeat(70));

  try {
    const result = await callGemini({
      prompt:
        'Create a simple React button component with TypeScript. Just the code, no explanation.',
      temperature: 0.2,
    });

    console.log('\n✅ Test 1 PASSED');
    console.log('Response preview:', result.substring(0, 100) + '...');
  } catch (error) {
    console.log('\n❌ Test 1 FAILED:', error.message);
    throw error;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('\n\n📝 Test 2: JSON Response');
  console.log('-'.repeat(70));

  try {
    const result = await callGemini({
      prompt:
        'Return a JSON object with: name (string), age (number), active (boolean). Example values.',
      json: true,
      temperature: 0.1,
    });

    console.log('\n✅ Test 2 PASSED');
    console.log('JSON result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('\n❌ Test 2 FAILED:', error.message);
    throw error;
  }

  // Summary
  const summary = getSessionSummary();

  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('📊 SESSION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Cost: ${summary.costFormatted}`);
  console.log('Model Usage:', summary.modelUsage);
  console.log('\n✅ All tests passed! Mode 3 is ready.\n');
}

testMode3().catch((err) => {
  console.error('\n❌ MODE 3 TEST FAILED:', err);
  process.exit(1);
});
