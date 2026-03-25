#!/usr/bin/env node

/**
 * COMPREHENSIVE GROQ-ONLY TEST
 * Test ALL Groq models for: Quality, Cost, Context, Reasoning
 */

import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ALL Groq models with pricing
const MODELS = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    pricing: { input: 0.05, output: 0.08 },
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
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
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', pricing: { input: 0.3, output: 0.4 } },
  { id: 'groq/compound', name: 'Groq Compound', pricing: { input: 0.5, output: 0.5 } }, // estimate
  { id: 'groq/compound-mini', name: 'Groq Compound Mini', pricing: { input: 0.25, output: 0.25 } }, // estimate
];

// Comprehensive test scenarios
const TESTS = [
  {
    category: 'Quality',
    name: 'React Component Quality',
    weight: 25,
    prompt: `Create a production-ready TypeScript React component for a Todo List with:
- Add todo (input + button)
- List todos (with checkbox to toggle done)
- Delete todo
- Filter: All/Active/Completed
- TypeScript interfaces
- Tailwind CSS styling
- Responsive design
- Accessibility (ARIA labels)

REQUIREMENTS: Include ALL features, proper TypeScript, clean code, no placeholders.`,
    scoring: {
      mustHave: ['TypeScript', 'interface', 'Tailwind', 'aria-label', 'filter', 'onClick'],
      quality: ['useState', 'map', 'className', 'button', 'input'],
    },
  },
  {
    category: 'Cost',
    name: 'Cost Efficiency Test',
    weight: 20,
    prompt: `Write a simple TypeScript function that validates an email address using regex. Return true if valid, false otherwise.`,
    scoring: {
      mustHave: ['typescript', 'email', 'regex'],
      preferShort: true, // Shorter output = more cost efficient for simple tasks
    },
  },
  {
    category: 'Context',
    name: 'Large Context Handling',
    weight: 25,
    prompt: `You are given this API specification:

${generateLargeContext()}

Based on the full specification above, create the TypeScript types for ALL endpoints and a centralized error handler that returns the correct status codes for each error type mentioned in the spec.

CRITICAL: Use EXACT names and codes from the spec.`,
    scoring: {
      mustHave: ['interface', 'type', 'error', '400', '401', '404', '500'],
      contextAware: true, // Must reference specific details from the large context
    },
  },
  {
    category: 'Reasoning',
    name: 'Architectural Reasoning',
    weight: 30,
    prompt: `SCENARIO: You're building a real-time chat app with Next.js. Users can send messages, see typing indicators, and get notifications.

CONSTRAINTS:
- No separate backend (Next.js only)
- Must work offline
- Must sync when back online
- Must handle 100+ concurrent users per room

OPTIONS:
A) WebSockets with in-memory state
B) Server-Sent Events + API routes
C) Polling + IndexedDB
D) WebRTC data channels

TASK: Choose the BEST option and explain:
1. Why it's optimal for these constraints
2. One major technical challenge and solution
3. Trade-offs vs other options

FORMAT:
CHOICE: [A/B/C/D]
REASONING: [2-3 sentences why]
CHALLENGE: [specific challenge]
SOLUTION: [how to solve it]
TRADEOFFS: [vs alternatives]`,
    scoring: {
      mustHave: ['CHOICE:', 'REASONING:', 'CHALLENGE:', 'SOLUTION:', 'TRADEOFFS:'],
      hasChoice: true,
      logical: true,
    },
  },
];

function generateLargeContext() {
  return `
# API Specification: E-commerce Platform

## Authentication Endpoints

### POST /api/auth/login
Input: { email: string, password: string }
Success: 200 { token: string, user: { id, email, name } }
Errors: 400 (invalid input), 401 (wrong credentials), 429 (rate limit)

### POST /api/auth/register
Input: { email: string, password: string, name: string }
Success: 201 { token: string, user: { id, email, name } }
Errors: 400 (validation failed), 409 (email exists), 500 (server error)

## Product Endpoints

### GET /api/products
Query: { page?: number, limit?: number, category?: string }
Success: 200 { products: Product[], total: number, page: number }
Errors: 400 (invalid query), 500 (server error)

### GET /api/products/:id
Success: 200 { product: Product }
Errors: 404 (not found), 500 (server error)

### POST /api/products
Input: { name: string, price: number, category: string, stock: number }
Success: 201 { product: Product }
Errors: 400 (validation), 401 (not authenticated), 403 (not authorized), 500

### PUT /api/products/:id
Input: Partial<Product>
Success: 200 { product: Product }
Errors: 400, 401, 403, 404, 500

### DELETE /api/products/:id
Success: 204
Errors: 401, 403, 404, 500

## Order Endpoints

### POST /api/orders
Input: { items: { productId: string, quantity: number }[], shippingAddress: Address }
Success: 201 { order: Order }
Errors: 400 (invalid items), 401 (not authenticated), 402 (payment failed), 409 (out of stock), 500

### GET /api/orders/:id
Success: 200 { order: Order }
Errors: 401, 403 (not your order), 404, 500

## Error Response Format
ALL errors return: { error: string, message: string, statusCode: number }

## Types
Product: { id: string, name: string, price: number, category: string, stock: number, createdAt: Date }
Order: { id: string, userId: string, items: OrderItem[], total: number, status: string, createdAt: Date }
OrderItem: { productId: string, quantity: number, price: number }
Address: { street: string, city: string, country: string, postalCode: string }
`.repeat(2); // Double it for larger context
}

console.log('🧪 COMPREHENSIVE GROQ MODEL EVALUATION\n');
console.log('Testing: Quality, Cost, Context, Reasoning\n');
console.log('='.repeat(70));

const results = {};

for (const model of MODELS) {
  console.log(`\n\n📊 Model: ${model.name}`);
  console.log('='.repeat(70));

  results[model.id] = {
    name: model.name,
    pricing: model.pricing,
    scores: {
      quality: 0,
      cost: 0,
      context: 0,
      reasoning: 0,
      weighted: 0,
    },
    tests: {},
    totalCost: 0,
    totalDuration: 0,
    errors: [],
  };

  for (const test of TESTS) {
    console.log(`\n  📝 ${test.name} (${test.category})...`);

    try {
      const start = Date.now();

      const response = await groq.chat.completions.create({
        model: model.id,
        messages: [{ role: 'user', content: test.prompt }],
        temperature: 0.2,
        max_tokens: 2500,
      });

      const duration = Date.now() - start;
      const output = response.choices[0].message.content;
      const tokens = response.usage;

      // Calculate cost
      const cost =
        (tokens.prompt_tokens * model.pricing.input +
          tokens.completion_tokens * model.pricing.output) /
        1_000_000;

      // Score based on test criteria
      let score = 0;

      if (test.scoring.mustHave) {
        const found = test.scoring.mustHave.filter((term) =>
          output.toLowerCase().includes(term.toLowerCase())
        );
        score = (found.length / test.scoring.mustHave.length) * 100;
      }

      if (test.scoring.hasChoice) {
        const hasValidChoice = /CHOICE:\s*[A-D]/.test(output);
        score = hasValidChoice ? 100 : 50;
      }

      if (test.scoring.preferShort && tokens.completion_tokens < 100) {
        score = 100; // Efficient for simple tasks
      } else if (test.scoring.preferShort) {
        score = Math.max(50, 100 - (tokens.completion_tokens - 100) / 5);
      }

      results[model.id].tests[test.name] = {
        score,
        duration,
        tokens,
        cost,
        outputLength: output.length,
      };

      results[model.id].scores[test.category.toLowerCase()] += score * (test.weight / 100);
      results[model.id].totalCost += cost;
      results[model.id].totalDuration += duration;

      console.log(`    ✅ Score: ${Math.round(score)}/100`);
      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    💰 Cost: $${cost.toFixed(6)}`);
      console.log(`    📊 Tokens: ${tokens.prompt_tokens} in, ${tokens.completion_tokens} out`);
    } catch (error) {
      console.log(`    ❌ ERROR: ${error.message}`);
      results[model.id].errors.push({ test: test.name, error: error.message });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Calculate weighted overall score
  const scores = results[model.id].scores;
  scores.weighted =
    scores.quality * 0.35 + scores.cost * 0.15 + scores.context * 0.25 + scores.reasoning * 0.25;
}

// Final Rankings
console.log('\n\n');
console.log('='.repeat(70));
console.log('📊 FINAL RANKINGS');
console.log('='.repeat(70));

const rankings = Object.values(results)
  .filter((r) => r.tests && Object.keys(r.tests).length > 0)
  .sort((a, b) => b.scores.weighted - a.scores.weighted);

console.log('\n🏆 OVERALL SCORES (Weighted):\n');
rankings.forEach((r, i) => {
  console.log(`${i + 1}. ${r.name}`);
  console.log(`   Overall: ${r.scores.weighted.toFixed(1)}/100`);
  console.log(`   Quality: ${r.scores.quality.toFixed(1)}/100 (35% weight)`);
  console.log(`   Cost Efficiency: ${r.scores.cost.toFixed(1)}/100 (15% weight)`);
  console.log(`   Context: ${r.scores.context.toFixed(1)}/100 (25% weight)`);
  console.log(`   Reasoning: ${r.scores.reasoning.toFixed(1)}/100 (25% weight)`);
  console.log(`   Total Cost: $${r.totalCost.toFixed(6)}`);
  console.log(`   Avg Duration: ${Math.round(r.totalDuration / Object.keys(r.tests).length)}ms`);
  console.log(`   Errors: ${r.errors.length}`);
  console.log('');
});

// Cost per quality point
console.log('\n💰 VALUE RANKING (Quality per $):\n');
const valueRanking = rankings
  .filter((r) => r.totalCost > 0)
  .map((r) => ({
    name: r.name,
    value: r.scores.weighted / (r.totalCost * 1000),
  }))
  .sort((a, b) => b.value - a.value);

valueRanking.forEach((r, i) => {
  console.log(`${i + 1}. ${r.name}: ${r.value.toFixed(0)} points per $0.001`);
});

// Category Winners
console.log('\n\n🏅 CATEGORY WINNERS:\n');
const categories = ['quality', 'cost', 'context', 'reasoning'];
categories.forEach((cat) => {
  const winner = rankings.reduce((best, current) =>
    current.scores[cat] > best.scores[cat] ? current : best
  );
  console.log(`${cat.toUpperCase()}: ${winner.name} (${winner.scores[cat].toFixed(1)}/100)`);
});

// Recommendations
console.log('\n\n🎯 GROQ-ONLY RECOMMENDATIONS:\n');

const best = rankings[0];
const secondBest = rankings[1];
const fastestQuality = rankings
  .filter((r) => r.scores.quality >= 70)
  .sort(
    (a, b) =>
      a.totalDuration / Object.keys(a.tests).length - b.totalDuration / Object.keys(b.tests).length
  )[0];

console.log(`✅ PRIMARY MODEL: ${best.name}`);
console.log(`   - Overall score: ${best.scores.weighted.toFixed(1)}/100`);
console.log(`   - Best for: Balanced quality and cost`);
console.log(`   - Monthly cost (200 tasks): $${(best.totalCost * 50).toFixed(3)}`);

if (secondBest.scores.reasoning > best.scores.reasoning) {
  console.log(`\n🧠 REASONING MODEL: ${secondBest.name}`);
  console.log(`   - Reasoning score: ${secondBest.scores.reasoning.toFixed(1)}/100`);
  console.log(`   - Use for: Complex architectural decisions`);
}

if (fastestQuality && fastestQuality.name !== best.name) {
  console.log(`\n⚡ FAST TRACK: ${fastestQuality.name}`);
  console.log(
    `   - Speed: ${Math.round(fastestQuality.totalDuration / Object.keys(fastestQuality.tests).length)}ms avg`
  );
  console.log(`   - Use for: Simple, speed-critical tasks`);
}

console.log('\n✅ Test completed!\n');
