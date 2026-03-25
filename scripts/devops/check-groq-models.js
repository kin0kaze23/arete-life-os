#!/usr/bin/env node

/**
 * Check available models from Groq API
 */

import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log('🔍 Checking Groq Available Models...\n');

try {
  const models = await groq.models.list();

  console.log(`✅ Found ${models.data.length} models\n`);

  // Sort by ID
  const sortedModels = models.data.sort((a, b) => a.id.localeCompare(b.id));

  console.log('📋 All Groq Models:\n');
  sortedModels.forEach((model) => {
    console.log(`  - ${model.id}`);
    if (model.owned_by) {
      console.log(`    Owner: ${model.owned_by}`);
    }
  });

  // Check for specific models
  console.log('\n🔍 Looking for Code Generation Models:\n');
  const codeModels = sortedModels.filter(
    (m) =>
      m.id.includes('llama') ||
      m.id.includes('mixtral') ||
      m.id.includes('gemma') ||
      m.id.includes('qwen')
  );

  codeModels.forEach((model) => {
    console.log(`  ✅ ${model.id}`);
  });
} catch (error) {
  console.error('❌ Error:', error.message);
}
