---
description: Run comprehensive quality gate before pushing
---

# Quality Gate Automation

Use this to run all quality checks natively before committing/pushing code.

## When to Use

- Before pushing to remote
- After completing a feature
- Before creating a pull request
- Periodic quality audits

## Workflow

// turbo-all

### Ask Agent

```
"Run full quality gate"
```

### Agent Execution

The agent performs comprehensive quality audit:

#### 1. Build & Lint Verification

```bash
npm run lint
npm run build
```

#### 2. Contextual Quality Scripts

**Dependency Security (Always):**

```bash
npm audit --json
# Flag CRITICAL/HIGH vulnerabilities
```

**If UI files changed:**

```bash
./scripts/ui-change-check.sh
./scripts/accessibility-check.sh
./scripts/latency-baseline.sh --check
```

**If AI/core files changed:**

```bash
./scripts/cost-guardrail.sh
./scripts/architecture-drift-check.sh --strict
```

**Always:**

```bash
npm run doctor (if exists)
```

#### 3. Browser Verification

- Opens localhost in Playwright
- Takes screenshot
- Verifies no console errors
- Checks for visual regressions

#### 4. Git Status Check

- Verifies working directory
- Lists uncommitted changes
- Checks for untracked files

#### 5. Layer 8: Skill Compliance

Manual audit of changes against project skills:

- visual-intelligence
- component-analysis
- security-intelligence
- performance-intelligence
- etc.

### Quality Report

Agent provides comprehensive report:

```markdown
## Quality Gate Results

### Build & Lint

✅ Build: PASS
✅ Lint: PASS

### Quality Scripts

✅ UI Change Guard: UI-only changes
✅ Cost Guardrail: No net-new AI calls
✅ Architecture Drift: PASS
✅ Latency Baseline: Within threshold

### Browser Verification

✅ No console errors
✅ Visual rendering: OK
📸 Screenshot captured

### Git Status

- 5 files modified
- 0 untracked files
- Working directory: clean

### Layer 8: Skill Compliance

✅ visual-intelligence: 95%
✅ component-analysis: 100%
✅ performance-intelligence: 90%
Overall: 95% compliance

### Recommendation

✅ READY TO PUSH
```

## Fast Path (Pre-Push)

For quick pre-push verification:

```
"Run pre-push checks"
```

Agent executes abbreviated version:

1. `npm run lint && npm run build`
2. `./scripts/ui-change-check.sh` (if UI)
3. `git status`
4. Quick browser smoke test

## Example Session

```
You: "Run full quality gate"

Agent: [Executing quality checks...]
  ✅ npm run lint - PASS
  ✅ npm run build - PASS
  ✅ ./scripts/ui-change-check.sh - UI-only
  ✅ ./scripts/latency-baseline.sh --check - PASS
  ✅ Browser verification - No errors
  ✅ Git status - 5 files modified
  ✅ Layer 8 audit - 95% compliance

Agent: [Quality Gate Report]
  📊 All checks passed
  ✅ Ready to push

  Recommendation: Proceed with:
  git add .
  git commit -m "Implement dashboard components"
  git push origin HEAD

You: [Review report, push if satisfied]
```

## Integration with Other Workflows

### With Manual Development (Mode 1)

After implementing changes:

```
"Implement feature X"
[Feature implemented]
"Run quality gate"
[Quality verified]
"Push changes"
```

### With Native Automation (Mode 2)

After checkpoint approval:

```
"Continue automation"
[Multiple tasks completed]
"Pause and run quality gate before final push"
[Quality verified]
"Push all changes"
```

### With Script Automation (Mode 3)

After script completes:

```
[Script automation finishes]
"Review changes and run quality gate"
[Manual verification]
"Push if all clear"
```

## Advantages

- ✅ Comprehensive quality assurance
- ✅ Prevents bad commits
- ✅ Catches issues before CI/CD
- ✅ No manual script execution needed

## Disadvantages

- ⚠️ Takes 1-2 minutes to complete
- ⚠️ May require fixes if checks fail
