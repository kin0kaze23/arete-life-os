---
description: Fully autonomous script-based automation (requires API key)
---

# Mode 3: Script-Based Autonomous Automation

Use this mode for bulk implementation (20+ tasks) when you have clear requirements.

## When to Use

- 20+ tasks to implement
- Clear, unambiguous requirements
- Repetitive/mechanical work
- Want to minimize active oversight

## Prerequisites

### 1. API Key Setup

Create `.env.local` in project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 2. Verify Installation

```bash
npm run devops:digest -- .agent/plans/test-plan.md
```

If you see errors about missing packages:

```bash
npm install
```

## Workflow

// turbo-all

### 1. Create or Verify Plan

Ensure plan exists:

```bash
ls .agent/plans/product-strategy.md
```

Plan should be comprehensive with:

- Clear task boundaries
- File modification targets
- Acceptance criteria

### 2. Digest Plan (Optional)

Preview the task breakdown:

```bash
npm run devops:digest -- .agent/plans/product-strategy.md
```

Review output:

```bash
cat .agent/tasks/product-strategy/task-breakdown.json
```

### 3. Run Automation

Full autonomous execution:

```bash
npm run devops:auto -- .agent/plans/product-strategy.md
```

With checkpoints every N tasks:

```bash
npm run devops:auto -- .agent/plans/product-strategy.md --checkpoint=5
```

Manual approval mode (pause after each task):

```bash
npm run devops:manual -- .agent/plans/product-strategy.md
```

### 4. Monitor Execution

The script will:

1. Parse plan into tasks
2. For each task:
   - Identify relevant skills
   - Generate code with AI
   - Apply changes to files
   - Run `npm run lint`
   - Auto-fix any errors
3. At checkpoints:
   - Pause for approval
   - Display progress summary
4. Generate final report

### 5. Review Output

Check generated files:

```bash
git status
git diff
```

Verify build:

```bash
npm run build
npm run lint
```

Test in browser:

```bash
npm run dev
```

## Execution Output

You'll see terminal output like:

```
🚀 Starting Glance DevOps [Plan: product-strategy.md]

--- PHASE 1: Plan Digestion ---
✅ Parsed 21 tasks across 4 phases

--- PHASE 2: Implementation ---
  🎯 Task-001: LifeBalanceStrip component
  📚 Loaded skills: visual-intelligence, component-analysis
  🧠 AI is writing code...
  ✅ Created: dashboard/DailyBriefing/LifeBalanceStrip.tsx
  ✅ Build: PASS
  ✅ Lint: PASS

  🎯 Task-002: TodaysFocus component
  ...

⏸️  CHECKPOINT: 5 tasks complete. Press ENTER to continue...

--- PHASE 3: Final Evaluation ---
✅ Layer 1 (Build): PASS
✅ Layer 2 (Tests): PASS (0 tests)
✅ Layer 3 (UI/UX): Manual review required
✅ Layer 4 (Latency): 2.3s avg
✅ Layer 5 (Security): No critical issues
✅ Layer 6 (Cost): $1.47 API spend
✅ Layer 7 (Resilience): Error rate 0%
✅ Layer 8 (Skills): 94% compliance

📊 Final Report: .agent/reports/product-strategy-2026-01-31.md
```

## Advantages

- ✅ Fastest for bulk work
- ✅ Fully autonomous
- ✅ Auto-fix loops
- ✅ Comprehensive reporting

## Disadvantages

- ⚠️ Requires API key (~$0.50-2 cost)
- ⚠️ Less oversight
- ⚠️ May need manual cleanup

## Troubleshooting

### Error: API key not found

- Verify `.env.local` exists
- Check key is correct
- Restart terminal

### Error: Tasks failing consistently

- Check plan clarity
- Verify skills are loaded
- Run in `--manual` mode first

### Build errors after automation

- Review `git diff`
- Run agent in Mode 1 to fix
- Or: `git checkout -- .` and retry
