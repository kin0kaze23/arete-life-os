# Mode 3: Automated Code Generation Pipeline

## What Is Mode3?

Mode3 is an automated development pipeline that takes a written plan (markdown) and executes it as code changes — digesting the plan into atomic tasks, generating code via AI, applying it to the filesystem, and running quality gates. It runs as a Node.js script from the terminal.

```
Plan (.md) → Digest → Task Loop → Quality Gate → Report
```

The goal: turn a structured plan into working code without manual intervention.

## Architecture

```
scripts/devops/
├── glance-devops.js          # Orchestrator (entry point)
├── plan-digester.js           # Phase 1: Plan → Task Breakdown (JSON)
├── task-executor.js           # Phase 2: Task → Code Generation + Apply
├── quality-evaluator.js       # Phase 3: Final Quality Gate
├── ai-client.js               # AI provider abstraction (Groq/OpenAI/Gemini)
├── skill-compliance-evaluator.js  # Checks generated code against skill docs
└── skill-mapping.json         # Maps file patterns → skill directories
```

### Supporting Files

```
.agent/plans/*.md              # Input: human-written plans
.agent/tasks/<plan>/           # Output: task-breakdown.json (auto-generated)
.agent/reports/<plan>-report.md # Output: execution report
.agent/skills/*/SKILL.md       # Context: domain knowledge injected into prompts
.agent/core/AGENT.md           # Context: HARD RULES section injected into prompts
data/types.ts                  # Context: type definitions extracted at runtime
```

## How It Works (Step by Step)

### Phase 1: Plan Digestion (`plan-digester.js`)

**Input:** A markdown plan file (e.g., `.agent/plans/dashboard-completion-2026-02-01.md`)

**What happens:**

1. Reads the entire plan markdown
2. Sends it to an AI model (Gemini Flash — fast/cheap) with a structured prompt
3. AI returns a JSON task breakdown with phases, tasks, files, acceptance criteria
4. Saves to `.agent/tasks/<plan-name>/task-breakdown.json`

**Output format:**

```json
{
  "planName": "dashboard-completion",
  "phases": [
    {
      "id": "p0-core",
      "name": "Core Implementation",
      "tasks": [
        {
          "id": "task-001",
          "title": "Fix ScoreStrip 4-factor scoring",
          "description": "Detailed description...",
          "files": ["dashboard/ScoreStrip.tsx"],
          "acceptanceCriteria": ["npm run typecheck passes", "..."],
          "dependencies": []
        }
      ]
    }
  ]
}
```

**Key detail:** The digestion prompt includes HARD RULES about data-layer-first, integration wiring, typecheck gates, and correct file paths (no `src/` prefix).

### Phase 2: Implementation Loop (`task-executor.js`)

For each task in the breakdown, the executor:

1. **Loads context:**
   - HARD RULES from `.agent/core/AGENT.md`
   - Type definitions extracted dynamically from `data/types.ts` (enums, interfaces, type aliases)
   - Codebase conventions (import patterns from existing files, barrel export patterns)
   - Relevant skill documents matched via `skill-mapping.json`
   - Current contents of all files the task will modify

2. **Builds a prompt** containing all of the above plus the task description, acceptance criteria, and explicit field-name lists for core types (BlindSpot, ProactiveInsight, Goal, etc.)

3. **Calls AI** (Groq Llama 70B) requesting JSON output:

   ```json
   {
     "changes": [
       { "file": "dashboard/ScoreStrip.tsx", "content": "...full file...", "type": "create" }
     ],
     "rationale": "..."
   }
   ```

4. **Validates changes:**
   - Rejects null/empty content
   - Strips markdown fences if model wrapped the code
   - Rejects stub overwrites of protected files (if new content is <50% the line count of existing content for critical files like DashboardView.tsx, types.ts, useAura.ts)
   - Auto-fixes `export default` → named export

5. **Applies changes** to the filesystem

6. **Runs typecheck** (`npm run typecheck`)

7. **If typecheck fails → Self-correction loop** (up to 3 total attempts):
   - Rolls back the changes
   - Captures the TypeScript error output
   - Appends errors + common fix hints to the prompt
   - Re-generates with lower temperature (0.1)
   - Re-applies and re-checks

8. **If all attempts fail → Rollback** and mark task as failed

### Phase 3: Quality Gate (`quality-evaluator.js`)

After all tasks complete, runs:

- `npm run typecheck` (TypeScript strict)
- `npm run lint` (ESLint)
- `npm run build` (Vite production build)
- Architecture drift check (`scripts/architecture-drift-check.sh`)
- Skill compliance evaluation

**Hard gate:** If typecheck, lint, or build fail, the entire run is marked as FAILED and `process.exit(1)` is called.

### Phase 4: Report Generation

Writes a markdown report to `.agent/reports/` with:

- Task completion counts
- Quality gate results
- Cost tracking (token usage per model)
- List of changed files (from `git diff`)

## How to Run

```bash
# Basic run (processes all tasks)
npm run auto -- .agent/plans/your-plan.md

# Digest only (don't execute, just create task breakdown)
npm run auto -- .agent/plans/your-plan.md --digest

# With checkpoints (pause every N tasks for review)
npm run auto -- .agent/plans/your-plan.md --checkpoint=3

# Resume from a specific task (skip first N)
npm run auto -- .agent/plans/your-plan.md --start-from=4

# Manual mode (logs more detail)
npm run auto -- .agent/plans/your-plan.md --manual
```

## AI Provider Configuration

Mode3 uses a cascade model system defined in `ai-client.js`:

| Tier     | Provider | Model                   | Use Case                                   |
| -------- | -------- | ----------------------- | ------------------------------------------ |
| Primary  | Groq     | llama-3.1-8b-instant    | Fast/cheap (digestion, simple tasks)       |
| Escalate | Groq     | llama-3.3-70b-versatile | Code generation (forced for task-executor) |
| Fallback | Groq     | llama-3.3-70b-versatile | Retry on escalate failure                  |

**Environment variables** (in `.env.local`):

```
GROQ_API_KEY=gsk_...
GROQ_MODEL_PRIMARY=llama-3.1-8b-instant
GROQ_MODEL_ESCALATE=llama-3.3-70b-versatile
```

Also supports OpenAI (`OPENAI_API_KEY`) and Gemini (`GEMINI_API_KEY`) as providers, but Groq is the primary due to speed and cost.

**Cost:** A typical run of 5-10 tasks costs ~$0.01-0.05 USD on Groq.

## Safety Mechanisms

| Mechanism                | What It Does                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Protected files list     | Prevents DashboardView.tsx, types.ts, useAura.ts, App.tsx from being overwritten with stubs |
| Stub detection           | Rejects changes where new file is <50% line count of existing file                          |
| Export default auto-fix  | Converts `export default` to named exports automatically                                    |
| Markdown fence stripping | Removes ` ```typescript ` wrappers that models sometimes add                                |
| Typecheck gate           | Every task must pass `npm run typecheck` or gets rolled back                                |
| Self-correction retry    | On typecheck failure, feeds errors back to AI for re-generation (3 attempts)                |
| Rollback on failure      | Restores original files or deletes newly created files                                      |
| Circuit breaker          | Stops after 3 consecutive task failures to prevent cascading damage                         |
| Final quality gate       | Runs full typecheck + lint + build after all tasks                                          |

## Writing Plans for Mode3

Plans should be structured markdown in `.agent/plans/`. Mode3 works best when plans are:

1. **Specific about files** — name exact file paths (`dashboard/SWOTGrid.tsx`, not "a new component")
2. **Explicit about data** — list which props/types to use, what fields exist
3. **One component per task** — mode3 handles single-file tasks well, struggles with multi-file coordination
4. **Include anti-patterns** — tell it what NOT to do (prevents common model mistakes)

Example plan structure:

```markdown
# Plan Title

## Phase 0: Prerequisites

- Task: Ensure type X exists in data/types.ts

## Phase 1: Components

- Task: Create dashboard/NewComponent.tsx
  - Props: items: ProactiveInsight[], onAction: (id: string) => void
  - Renders: list of items with title and description
  - Style: glassmorphism dark theme (bg-white/5, border-white/5)

## Data Mapping

| Component    | Data Source | Type               |
| ------------ | ----------- | ------------------ |
| NewComponent | insights    | ProactiveInsight[] |

## Anti-Patterns

- Do NOT use export default
- Do NOT invent types not in data/types.ts
```

## Current Limitations

1. **Single-file scope:** Mode3 generates one file at a time. It can't coordinate changes across multiple files in a single task (e.g., creating a component AND updating its parent AND adding barrel exports). Workaround: break multi-file work into sequential tasks with explicit dependencies.

2. **Import resolution:** The AI model doesn't have visibility into what's exported from barrel files (`index.ts`). If `@/shared` doesn't export `Collapsible`, the model can't know that. Workaround: ensure all dependencies are exported before tasks that need them.

3. **Type invention:** Even with type definitions injected, models sometimes invent enum values (e.g., `Category.STRENGTHS` instead of `Category.HEALTH`) or properties that don't exist. The self-correction loop catches some of these via typecheck errors, but not semantic mistakes.

4. **No runtime testing:** Mode3 only validates via typecheck/lint/build. It can't verify that a component renders correctly or handles edge cases. Visual review is still required.

5. **Model quality ceiling:** Groq Llama 70B is good for straightforward components but struggles with complex business logic, multi-step data transformations, or nuanced UI interactions. For complex work, direct human coding (or Claude) is more reliable.

## Porting to Other Repos

Mode3 can be adapted to other TypeScript/React projects. Here's what's repo-specific vs. generic:

### Generic (reusable as-is)

- `ai-client.js` — multi-provider AI client with cascade, retry, cost tracking
- `glance-devops.js` — orchestrator loop (digest → implement → evaluate → report)
- `task-executor.js` — core generate/validate/apply/rollback loop
- `quality-evaluator.js` — runs npm scripts for quality checks

### Repo-specific (needs customization)

- `plan-digester.js` prompt — references your tech stack, architecture, file paths
- `task-executor.js` prompt — references your types file location, import conventions, design system
- `extractRelevantTypes()` — reads from `data/types.ts`; change path for your repo
- `extractCodebaseConventions()` — reads from `dashboard/FocusList.tsx`; change to a representative file in your repo
- `PROTECTED_FILES` list — update to your critical files
- `skill-mapping.json` — maps your file patterns to your skill docs
- HARD RULES in `.agent/core/AGENT.md` — specific to your project's conventions

### Minimum setup for a new repo

1. Copy `scripts/devops/` directory
2. Install deps: `npm i groq-sdk openai @google/genai dotenv minimatch`
3. Add to `package.json`: `"auto": "node scripts/devops/glance-devops.js"`
4. Set `GROQ_API_KEY` in `.env.local`
5. Update `extractRelevantTypes()` to point at your types file
6. Update `PROTECTED_FILES` for your repo
7. Update HARD RULES section in the prompts
8. Write a plan in `.agent/plans/` and run `npm run auto -- .agent/plans/your-plan.md`

## Honest Assessment

Mode3 is a **marginal productivity unlock** in its current form. It works well for:

- Simple, self-contained component creation (single file, clear props, known types)
- Repetitive tasks (creating 5 similar components with different data)
- Scaffolding boilerplate that you'll refine manually

It does NOT replace human judgment for:

- Complex multi-file refactors
- Business logic that requires understanding context beyond type signatures
- UI/UX decisions that require visual feedback
- Debugging and troubleshooting

The main value is in the **infrastructure** — the retry loop, rollback safety, quality gates, and type injection are genuinely useful patterns. The AI code generation itself is the weakest link, limited by the model's ability to understand your specific codebase from a prompt.

As models improve (especially with longer context windows and better instruction following), the same pipeline will automatically get better results.
