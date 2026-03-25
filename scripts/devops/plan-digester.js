import fs from 'fs';
import path from 'path';
import { callGemini } from './ai-client.js';

/**
 * Digests a conceptual product strategy into a structured task breakdown.
 */
export async function digestPlan(planPath) {
  console.log(`\n  📖 Reading plan: ${planPath}`);

  if (!fs.existsSync(planPath)) {
    throw new Error(`Plan file not found: ${planPath}`);
  }

  const planContent = fs.readFileSync(planPath, 'utf-8');
  const planName = path.basename(planPath, '.md');
  const tasksDir = path.join(process.cwd(), '.agent/tasks', planName);

  if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir, { recursive: true });
  }

  const prompt = `
You are a senior software architect for Glance OS. Your task is to digest the following Product Strategy into an actionable, atomic task breakdown for an automated developer agent.

STRATEGY PLAN:
${planContent}

CONTEXT:
- Tech Stack: React 19, TypeScript, Vite, Tailwind
- Architecture: Local-first, encryption-native (AES-256-GCM), AI-native.
- Main Hook: useAura (centralized life state).
- UI Framework: shared/SharedUI.tsx (glassmorphism dark theme).

OUTPUT FORMAT (JSON ONLY):
{
    "planName": "${planName}",
    "phases": [
        {
            "id": "p0-core",
            "name": "Core Implementation",
            "priority": 0,
            "tasks": [
                {
                    "id": "task-001",
                    "title": "Create [Component Name]",
                    "description": "...",
                    "dependencies": [],
                    "estimatedComplexity": "low|medium|high",
                    "files": ["src/dashboard/...", "..."],
                    "acceptanceCriteria": ["Criterion 1", "Criterion 2"]
                }
            ]
        }
    ]
}

RULES:
1. Each task must be ATOMIC (completable in one AI context window).
2. Group related tasks into PHASES (P0, P1, P2, P3 per the strategy).
3. Identify all FILES to be created or modified.
4. Include clear ACCEPTANCE CRITERIA for verification.
5. Identify dependencies (e.g., Task 2 depends on Task 1).
6. Prioritize P0 tasks first.

HARD RULES (MANDATORY — violations cause broken builds):
7. DATA LAYER FIRST: Before creating any UI component, verify every useAura() property it needs actually exists in core/useAura.ts. If missing, add a task to define it FIRST.
8. INTEGRATION WIRING: Every component task MUST include: (a) importing in the parent component, (b) rendering with real props, (c) adding to the barrel export (index.ts). A file that exists but is never imported = INCOMPLETE task.
9. TYPECHECK GATE: Every task's acceptance criteria MUST include "npm run typecheck passes with zero errors". Vite build does NOT catch TypeScript errors.
10. NO PHANTOM TYPES: Only import types that exist in data/types.ts. If a new type is needed, define it there FIRST in a prerequisite task.
11. NO MOCK DATA: Components must render real data from useAura props, or show a proper empty state. Never hardcode fake/placeholder content.
12. USE EXISTING DATA: Map to existing useAura properties before inventing new ones. Available state: profile, memoryItems, dailyPlan, timelineEvents, blindSpots, recommendations, goals, insights, claims, tasks, ruleOfLife, alwaysDo, alwaysWatch, sources, auditLogs.

CRITICAL FILE PATHS (no "src/" prefix — files are at repo root):
- Components: dashboard/*.tsx, stream/*.tsx, vault/*.tsx, settings/*.tsx, shared/*.tsx
- Types: data/types.ts
- State: core/useAura.ts (return object at ~line 1973)
- App shell: app/App.tsx
- Barrel exports: dashboard/index.ts, data/index.ts
`;

  console.log('  🧠 AI is digesting the plan...');
  const breakdown = await callGemini({
    prompt,
    json: true,
    model: 'gemini-2.0-flash', // Use Flash for speed/cost
    temperature: 0.1,
  });

  const breakdownPath = path.join(tasksDir, 'task-breakdown.json');
  fs.writeFileSync(breakdownPath, JSON.stringify(breakdown, null, 2));

  console.log(
    `  ✅ Plan digested: ${breakdown.phases.length} phases, ${breakdown.phases.reduce((acc, p) => acc + p.tasks.length, 0)} tasks.`
  );
  console.log(`  💾 Saved to: ${breakdownPath}`);

  return breakdown;
}

// Allow running directly
if (process.argv[1] === import.meta.url) {
  const planPath = process.argv[2] || '.agent/plans/product-strategy.md';
  digestPlan(planPath).catch(console.error);
}
