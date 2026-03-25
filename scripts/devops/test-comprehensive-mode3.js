#!/usr/bin/env node

/**
 * COMPREHENSIVE MODE 3 TEST
 * Tests: Context, Reasoning, Instruction Following, Memory
 */

import Groq from 'groq-sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Models to test
const MODELS = [
  {
    provider: 'groq',
    name: 'llama-3.1-8b-instant',
    label: 'Groq Llama 3.1 8B',
    contextLimit: 128000,
  },
  {
    provider: 'groq',
    name: 'llama-3.3-70b-versatile',
    label: 'Groq Llama 3.3 70B',
    contextLimit: 128000,
  },
  { provider: 'openai', name: 'gpt-5-mini', label: 'OpenAI GPT-5-mini', contextLimit: 400000 },
  { provider: 'openai', name: 'o3-mini', label: 'OpenAI o3-mini', contextLimit: 200000 },
];

// Test scenarios simulating real Mode 3 usage
const TESTS = [
  {
    name: 'Large Context Test',
    description: 'Handle large PRD-like input (simulating real Mode 3)',
    setup: () => {
      // Simulate a large PRD/plan
      const largePRD = `
# Product Requirement Document: User Authentication System

## Executive Summary
Build a comprehensive authentication system with OAuth, 2FA, and session management.

## Technical Requirements

### User Model
- id: UUID
- email: string (unique, validated)
- password: hashed with bcrypt (12 rounds)
- firstName: string (2-50 chars)
- lastName: string (2-50 chars)
- phoneNumber: optional, E.164 format
- emailVerified: boolean
- phoneVerified: boolean
- twoFactorEnabled: boolean
- twoFactorSecret: encrypted string
- createdAt: timestamp
- updatedAt: timestamp
- lastLoginAt: timestamp
- loginAttempts: number (max 5 before lockout)
- lockedUntil: timestamp or null

### API Endpoints

#### POST /api/auth/register
- Input: email, password, firstName, lastName, phone (optional)
- Validation: email format, password strength (12+ chars, uppercase, lowercase, number, special)
- Process: hash password, create user, send verification email
- Output: user object (no password), access token, refresh token
- Errors: 400 (validation), 409 (email exists), 500 (server)

#### POST /api/auth/login
- Input: email, password, twoFactorCode (if enabled)
- Process: verify credentials, check 2FA, create session, update lastLoginAt
- Output: user object, access token, refresh token
- Errors: 401 (invalid credentials), 423 (account locked), 400 (2FA required)

#### POST /api/auth/verify-email
- Input: token (JWT with email claim)
- Process: verify token, update emailVerified
- Output: success message
- Errors: 400 (invalid token), 410 (expired token)

#### POST /api/auth/enable-2fa
- Input: access token
- Process: generate TOTP secret, return QR code
- Output: secret, QR code data URL
- Errors: 401 (unauthorized)

#### POST /api/auth/verify-2fa
- Input: access token, code
- Process: verify TOTP code, enable 2FA
- Output: backup codes (10x 8-char alphanumeric)
- Errors: 401 (unauthorized), 400 (invalid code)

### Database Schema (IndexedDB)
Store: users
Index: email (unique)
Index: phoneNumber (unique, sparse)

Store: sessions
Index: userId
Index: token
TTL: 7 days

Store: refreshTokens
Index: userId
Index: token
TTL: 30 days

### Security Requirements
1. All passwords MUST be hashed with bcrypt (12 rounds minimum)
2. JWT tokens MUST expire in 15 minutes (access) and 7 days (refresh)
3. Rate limiting: 5 login attempts per hour per IP
4. CORS: only allow specified origins
5. CSRF protection on all state-changing requests
6. Password reset tokens expire in 1 hour
7. 2FA backup codes must be hashed and single-use

### Testing Requirements
- Unit tests for all validation functions (>95% coverage)
- Integration tests for auth flow
- E2E tests with Playwright for login/register
- Security testing: SQL injection, XSS, CSRF
`.repeat(3); // Triple it to simulate large context

      return {
        prompt: `${largePRD}

## Your Task
Based on the PRD above, create the TypeScript types for the User model and the POST /api/auth/register endpoint handler for Next.js.

CRITICAL REQUIREMENTS:
1. Use EXACT field names from the PRD
2. Include ALL validation mentioned
3. Add proper error handling with EXACT status codes from PRD
4. Use bcrypt with EXACTLY 12 rounds
5. Return EXACTLY the fields specified in Output section
6. NO extra fields, NO missing fields

Respond ONLY with TypeScript code, no explanations.`,
        validation: {
          mustInclude: [
            'bcrypt',
            '12',
            'emailVerified',
            'phoneVerified',
            'twoFactorEnabled',
            'loginAttempts',
            'lockedUntil',
          ],
          mustNotInclude: ['// TODO', 'placeholder', 'example'],
          statusCodes: ['400', '409', '500'],
          exactNames: ['firstName', 'lastName', 'phoneNumber'],
        },
      };
    },
  },
  {
    name: 'Reasoning & Architectural Decision',
    description: 'Make complex architectural decisions',
    setup: () => ({
      prompt: `You are designing a real-time collaborative editor (like Google Docs). 

CONSTRAINTS:
- Must work offline
- Must handle conflicts when users reconnect
- Must be performant with 50+ concurrent users
- Must preserve edit history
- IndexedDB for local storage
- Next.js frontend, no separate backend

QUESTION: Choose the optimal conflict resolution strategy and explain your reasoning.

OPTIONS:
A) Last Write Wins (LWW) - simplest, but loses data
B) Operational Transformation (OT) - complex, proven
C) Conflict-Free Replicated Data Types (CRDT) - newer, simpler than OT
D) Vector Clocks with manual merge - most control, most complex

Provide:
1. Your choice (A, B, C, or D)
2. 3 specific technical reasons WHY
3. 2 specific risks and how to mitigate them
4. Sample TypeScript interface for the data structure

Format:
CHOICE: [letter]
REASONS:
1. [reason]
2. [reason]
3. [reason]
RISKS:
1. [risk] - Mitigation: [how]
2. [risk] - Mitigation: [how]
CODE: [TypeScript interface]`,
      validation: {
        mustInclude: ['CHOICE:', 'REASONS:', 'RISKS:', 'Mitigation:', 'interface'],
        mustHaveChoice: ['A', 'B', 'C', 'D'],
        mustHaveCount: { REASONS: 3, RISKS: 2 },
      },
    }),
  },
  {
    name: 'Instruction Following Precision',
    description: 'Follow specific format requirements exactly',
    setup: () => ({
      prompt: `Create a TypeScript Zod schema for user registration with EXACT specifications:

RULES (MUST FOLLOW EXACTLY):
1. Schema name MUST be: RegisterUserSchema
2. Email: MUST use z.string().email()
3. Password: MUST be 12-64 characters
4. Password: MUST require: 1 uppercase, 1 lowercase, 1 number, 1 special char
5. Username: MUST be 3-20 characters, alphanumeric only
6. Age: MUST be number, minimum 18, maximum 120
7. Terms: MUST be z.literal(true) - user must explicitly agree
8. Newsletter: MUST be z.boolean().default(false) - optional newsletter opt-in

OUTPUT FORMAT (MUST MATCH EXACTLY):
\`\`\`typescript
export const RegisterUserSchema = z.object({
  // fields here
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
\`\`\`

PROVIDE ONLY THE CODE. NO EXPLANATIONS.`,
      validation: {
        exactStrings: [
          'RegisterUserSchema',
          'z.literal(true)',
          '.default(false)',
          'RegisterUserInput',
          'z.infer',
        ],
        mustInclude: ['email()', 'min(18)', 'max(120)', 'min(3)', 'max(20)', 'min(12)', 'max(64)'],
        format: 'typescript',
        noExtraText: true,
      },
    }),
  },
];

console.log('🧪 COMPREHENSIVE MODE 3 EVALUATION\n');
console.log('Testing: Context, Reasoning, Instruction Following\n');
console.log('='.repeat(70));

const results = {};

for (const model of MODELS) {
  console.log(`\n\n📊 Model: ${model.label}`);
  console.log('='.repeat(70));

  results[model.label] = {
    tests: {},
    scores: {
      context: 0,
      reasoning: 0,
      following: 0,
      overall: 0,
    },
    errors: [],
  };

  for (const test of TESTS) {
    console.log(`\n  📝 ${test.name}...`);

    const testSetup = test.setup();
    const start = Date.now();

    try {
      let response;

      if (model.provider === 'groq') {
        response = await groq.chat.completions.create({
          model: model.name,
          messages: [{ role: 'user', content: testSetup.prompt }],
          temperature: 0.1,
          max_tokens: 3000,
        });
      } else {
        const config = {
          model: model.name,
          messages: [{ role: 'user', content: testSetup.prompt }],
          max_tokens: 3000,
        };

        // No temperature for gpt-5-mini and o3-mini
        if (!model.name.includes('gpt-5-mini') && !model.name.includes('o3')) {
          config.temperature = 0.1;
        }

        response = await openai.chat.completions.create(config);
      }

      const duration = Date.now() - start;
      const output = response.choices[0].message.content;
      const tokens = response.usage;

      // Score the response
      let score = 0;
      const feedback = [];

      // Check validation criteria
      if (testSetup.validation.mustInclude) {
        const included = testSetup.validation.mustInclude.filter((term) =>
          output.toLowerCase().includes(term.toLowerCase())
        );
        const includeScore = (included.length / testSetup.validation.mustInclude.length) * 30;
        score += includeScore;
        feedback.push(
          `Included: ${included.length}/${testSetup.validation.mustInclude.length} required terms`
        );
      }

      if (testSetup.validation.mustNotInclude) {
        const excluded = testSetup.validation.mustNotInclude.filter(
          (term) => !output.toLowerCase().includes(term.toLowerCase())
        );
        const excludeScore = (excluded.length / testSetup.validation.mustNotInclude.length) * 20;
        score += excludeScore;
        feedback.push(
          `Avoided: ${excluded.length}/${testSetup.validation.mustNotInclude.length} forbidden terms`
        );
      }

      if (testSetup.validation.exactStrings) {
        const exact = testSetup.validation.exactStrings.filter((str) => output.includes(str));
        const exactScore = (exact.length / testSetup.validation.exactStrings.length) * 30;
        score += exactScore;
        feedback.push(`Exact matches: ${exact.length}/${testSetup.validation.exactStrings.length}`);
      }

      if (testSetup.validation.mustHaveChoice) {
        const hasChoice = testSetup.validation.mustHaveChoice.some((choice) =>
          output.includes(`CHOICE: ${choice}`)
        );
        score += hasChoice ? 20 : 0;
        feedback.push(`Choice format: ${hasChoice ? 'correct' : 'missing'}`);
      }

      // Context handling (did it process the large input?)
      const contextScore = tokens.prompt_tokens > 1000 ? 100 : (tokens.prompt_tokens / 1000) * 100;

      results[model.label].tests[test.name] = {
        score: Math.min(score, 100),
        duration,
        tokens,
        feedback,
        contextTokens: tokens.prompt_tokens,
        contextScore: Math.min(contextScore, 100),
        output: output.substring(0, 500),
      };

      // Update category scores
      if (test.name.includes('Context')) {
        results[model.label].scores.context = Math.min(score, 100);
      } else if (test.name.includes('Reasoning')) {
        results[model.label].scores.reasoning = Math.min(score, 100);
      } else if (test.name.includes('Following')) {
        results[model.label].scores.following = Math.min(score, 100);
      }

      console.log(`    ✅ Score: ${Math.round(score)}/100`);
      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Tokens: ${tokens.prompt_tokens} in, ${tokens.completion_tokens} out`);
      feedback.forEach((f) => console.log(`    📝 ${f}`));
    } catch (error) {
      console.log(`    ❌ ERROR: ${error.message}`);
      results[model.label].errors.push({ test: test.name, error: error.message });
      results[model.label].tests[test.name] = { score: 0, error: error.message };
    }

    // Pause between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Calculate overall score
  const scores = Object.values(results[model.label].scores).filter((s) => s > 0);
  results[model.label].scores.overall = scores.reduce((a, b) => a + b, 0) / scores.length;
}

// Final Summary
console.log('\n\n');
console.log('='.repeat(70));
console.log('📊 FINAL EVALUATION');
console.log('='.repeat(70));

const rankings = Object.entries(results)
  .map(([label, data]) => ({
    label,
    ...data.scores,
    errorCount: data.errors.length,
  }))
  .sort((a, b) => b.overall - a.overall);

console.log('\n🏆 OVERALL RANKINGS:\n');
rankings.forEach((r, i) => {
  console.log(`${i + 1}. ${r.label}`);
  console.log(`   Overall: ${r.overall.toFixed(1)}/100`);
  console.log(`   Context Handling: ${r.context.toFixed(1)}/100`);
  console.log(`   Reasoning: ${r.reasoning.toFixed(1)}/100`);
  console.log(`   Instruction Following: ${r.following.toFixed(1)}/100`);
  console.log(`   Errors: ${r.errorCount}`);
  console.log('');
});

console.log('\n🎯 RECOMMENDATION:\n');
const best = rankings[0];
const secondBest = rankings[1];

console.log(`✅ PRIMARY: ${best.label}`);
console.log(`   - Overall score: ${best.overall.toFixed(1)}/100`);
console.log(
  `   - Best for: ${
    best.context >= best.reasoning && best.context >= best.following
      ? 'Large Context'
      : best.reasoning >= best.context && best.reasoning >= best.following
        ? 'Complex Reasoning'
        : 'Precision & Following Instructions'
  }`
);

if (secondBest && secondBest.overall >= 70) {
  console.log(`\n⚠️  FALLBACK: ${secondBest.label}`);
  console.log(
    `   - Use if primary fails on: ${
      secondBest.reasoning > best.reasoning
        ? 'reasoning tasks'
        : secondBest.context > best.context
          ? 'large context'
          : 'precision requirements'
    }`
  );
}

console.log('\n✅ Test completed!\n');
