#!/usr/bin/env node

/**
 * Check available models from Gemini API
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log('🔍 Checking Gemini Available Models...\n');

try {
  const models = await genAI.models.list();

  console.log(`✅ Found ${models.length} models\n`);

  // Filter for relevant models
  const relevantModels = models
    .filter(
      (m) =>
        m.name.includes('gemini') && !m.name.includes('embedding') && !m.name.includes('vision')
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log('📋 Relevant Gemini Models:\n');
  relevantModels.forEach((model) => {
    console.log(`  - ${model.name}`);
    if (model.description) {
      console.log(`    ${model.description.substring(0, 80)}...`);
    }
  });

  // Check for specific models
  console.log('\n🔍 Checking for Specific Models:\n');
  const modelsToCheck = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  modelsToCheck.forEach((modelName) => {
    const exists = models.some((m) => m.name.includes(modelName));
    console.log(`  ${exists ? '✅' : '❌'} ${modelName}`);
  });
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full error:', error);
}
