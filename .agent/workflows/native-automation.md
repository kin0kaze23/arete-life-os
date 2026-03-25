---
description: Semi-automated native agent with checkpoints
---

# Mode 2: Native Agent Automation (Hybrid)

Use this mode for medium-sized features (3-10 tasks) with quality checkpoints.

## When to Use

- Implementing a feature plan
- 3-10 related tasks
- Need visual verification at milestones
- Want conversational error fixes
- **Maximum autonomy with safety checkpoints**

## Prerequisites

- Plan file exists: `.agent/plans/[name].md`
- Plan describes the feature clearly

## Workflow

// turbo-all

### 1. Prepare the Plan

- Ensure plan is in `.agent/plans/`
- Plan should include:
  - Feature goals
  - Component list
  - Acceptance criteria

### 2. Start Automation

Ask the agent:

```
"Start implementing .agent/plans/product-strategy.md with checkpoints every 3 tasks"
```

Or for a specific phase:

```
"Implement Phase 1 (P0 Core) from product-strategy.md, checkpoint after each component"
```

### 3. Agent Execution Loop (Fully Autonomous)

The agent operates autonomously with built-in quality gates:

#### A. Implementation Phase (Per Task)

1. **Read & Analyze**
   - Load relevant files
   - Identify applicable skills
   - Plan the implementation

2. **Code Generation**
   - Follow all 12 project skills
   - Apply design patterns
   - Ensure type safety

3. **Automatic Verification**
   - Run `npm run lint`
   - Run `npm run build`
   - Fix any errors automatically (up to 3 attempts)

4. **Visual Verification** (if UI change)
   - Open browser at localhost
   - Take screenshot
   - Verify rendering

#### B. Checkpoint Evaluation (Every N Tasks)

The agent performs comprehensive quality audit:

##### 🔧 Automated Quality Checks

```bash
✅ Build Verification
   npm run build

✅ Lint Verification
   npm run lint

✅ Dependency Security Audit
   npm audit --json
   Flag: CRITICAL/HIGH vulnerabilities

✅ UI Change Guard
   ./scripts/ui-change-check.sh

✅ Cost Guardrail
   ./scripts/cost-guardrail.sh --allow

✅ Architecture Drift Check
   ./scripts/architecture-drift-check.sh

✅ Accessibility (WCAG 2.1 AA)
   ./scripts/accessibility-check.sh
   (if UI changes detected)

✅ Latency Baseline (if exists)
   ./scripts/latency-baseline.sh --check
```

##### 📋 Manual Quality Audits

**Layer 8: Skill Compliance**
Agent reviews each file against applicable skills:

- `visual-intelligence` - UI/UX standards
- `component-analysis` - React patterns
- `security-intelligence` - OWASP compliance
- `performance-intelligence` - Bundle size, Core Web Vitals
- `data-architecture-intelligence` - Schema design
- `error-resilience-intelligence` - Error boundaries
- etc.

**Code Quality Review**

- Naming conventions
- Code organization
- Documentation completeness
- Test coverage (if applicable)

**Test Generation** (NEW)

- Generate unit tests for new components
- Follow `./.agent/core/TEST_GENERATION_GUIDE.md`
- Run tests: `npm test`
- Report coverage

**Git Diff Analysis**

- Files changed summary
- Lines added/removed
- Risk assessment

##### 🖼️ Visual Evidence Package

- Browser screenshots (if UI)
- Before/after comparisons
- Animation recordings (if applicable)

##### 📊 Checkpoint Report Format

```markdown
## Checkpoint: Tasks [001-003] Complete

### Summary

- ✅ 3 tasks implemented
- ✅ 5 files created/modified
- ✅ Build: PASS
- ✅ Lint: PASS
- ✅ All quality checks: PASS

### Changes

- dashboard/DailyBriefing/LifeBalanceStrip.tsx (NEW)
- dashboard/DailyBriefing/TodaysFocus.tsx (NEW)
- dashboard/DailyBriefing/QuickWin.tsx (NEW)

### Quality Gate Results

✅ UI Change Guard: UI-only changes
✅ Cost Guardrail: No net-new AI calls
✅ Architecture: No drift detected
✅ Layer 8: 95% skill compliance

### Visual Evidence

[Screenshots carousel showing components]

### Recommendation

✅ PROCEED - All checks passed
```

#### C. Autonomous Error Recovery

If errors occur, agent attempts fixes automatically:

**Build/Lint Errors**

1. Read error output
2. Identify issue (type error, import, etc.)
3. Apply fix
4. Re-verify
5. Repeat up to 3 times
6. If still failing → escalate to user

**Quality Script Failures**

- **UI Change Guard**: Review files, ensure correct categorization
- **Cost Guardrail**: Check if new AI calls are necessary
- **Architecture Drift**: Update docs if core changed
- **Latency Baseline**: Analyze bundle size increase

**Decision Framework**

```
Error Severity:
- LOW (lint warning) → Auto-fix
- MEDIUM (type error) → Auto-fix with verification
- HIGH (build failure) → Attempt fix, may escalate
- CRITICAL (security issue) → Immediate escalation
```

### 4. User Checkpoints

At defined intervals, agent calls `notify_user`:

**You Review:**

- Checkpoint report
- Visual evidence
- Quality gate results
- Agent's recommendation

**Your Options:**

- ✅ **Approve** - Agent continues autonomously
- 🔧 **Request changes** - Specify what to fix
- 📋 **Ask questions** - Agent explains decisions
- ⏸️ **Pause** - Review later, resume anytime

### 5. Completion

**Final Report Includes:**

- All tasks completed
- Total files changed
- Comprehensive quality metrics
- Visual walkthrough
- Deployment readiness checklist

## Advantages

- ✅ **Highly autonomous** - Minimal intervention needed
- ✅ **Quality guaranteed** - Multi-layer evaluation
- ✅ **Self-healing** - Auto-fixes errors
- ✅ **Comprehensive** - Covers all best practices
- ✅ **No API key** - Free to use

## Disadvantages

- ⚠️ Requires checkpoint reviews (vs fully autonomous Mode 3)
- ⚠️ Not as fast as Mode 3 for bulk work

## Example Session

```
You: "Implement .agent/plans/product-strategy.md Phase 1 with checkpoints every 3 tasks"

Agent: [Task boundary: Implementing P0-Core]

Agent: [Task-001: LifeBalanceStrip]
  ✅ Created component
  ✅ npm run lint - PASS
  ✅ npm run build - PASS
  ✅ Browser screenshot captured

Agent: [Task-002: TodaysFocus]
  ✅ Created component
  ✅ npm run lint - PASS
  ✅ npm run build - PASS
  ⚠️ Lint warning: unused import
  ✅ Auto-fixed

Agent: [Task-003: QuickWin]
  ✅ Created component
  ✅ npm run lint - PASS
  ✅ npm run build - PASS
  ✅ Browser screenshot captured

Agent: [Running checkpoint evaluation...]
  ✅ ./scripts/ui-change-check.sh - UI-only
  ✅ ./scripts/cost-guardrail.sh - No cost impact
  ✅ ./scripts/architecture-drift-check.sh - PASS
  ✅ Layer 8 audit - 95% compliance

Agent: [notify_user: Checkpoint Report]
  📊 3 components implemented
  📸 Screenshots attached
  ✅ All quality checks passed
  💡 Recommendation: PROCEED

You: "Looks great, continue"

Agent: [Task-004: DailyBriefing container...]
```

## Advanced Features

### Smart Dependency Detection

Agent automatically:

- Identifies task dependencies
- Implements in correct order
- Validates dependencies at checkpoints

### Adaptive Error Handling

Agent learns from errors:

- Recognizes similar error patterns
- Applies proven fixes first
- Escalates only when truly stuck

### Contextual Quality Checks

Agent runs relevant checks based on changes:

- UI changes → latency baseline
- AI code → cost guardrail
- Core changes → architecture drift
- Security-sensitive → extra scrutiny

### Progressive Enhancement

Agent can continue from any checkpoint:

- Resume after pause
- Retry after fixes
- Skip completed tasks
