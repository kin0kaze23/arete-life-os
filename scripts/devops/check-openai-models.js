#!/usr/bin/env node

/**
 * Check available models from OpenAI API
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('🔍 Checking OpenAI Available Models...\n');

try {
  const models = await openai.models.list();

  console.log(`✅ Found ${models.data.length} models\n`);

  // Filter for relevant models
  const relevantModels = models.data
    .filter(
      (m) =>
        m.id.includes('gpt') ||
        m.id.includes('o1') ||
        m.id.includes('o3') ||
        m.id.includes('o4') ||
        m.id.includes('gpt-5')
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  console.log('📋 Relevant Models for Code Generation:\n');
  relevantModels.forEach((model) => {
    console.log(
      `  - ${model.id} (created: ${new Date(model.created * 1000).toISOString().split('T')[0]})`
    );
  });

  // Check for specific models
  console.log('\n🔍 Checking for Specific Models:\n');
  const modelsToCheck = ['gpt-5-mini', 'gpt-5.2', 'gpt-4o-mini', 'gpt-4o', 'o3-mini', 'o1-mini'];

  modelsToCheck.forEach((modelName) => {
    const exists = models.data.some((m) => m.id === modelName);
    console.log(`  ${exists ? '✅' : '❌'} ${modelName}`);
  });
} catch (error) {
  console.error('❌ Error:', error.message);
}
