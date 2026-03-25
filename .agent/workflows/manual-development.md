---
description: Ad-hoc manual development with native agent
---

# Mode 1: Manual Native Development

Use this mode for quick fixes, single components, or exploratory work.

## When to Use

- Fixing a specific bug
- Adding a single component
- Understanding how something works
- Experimenting with new approaches

## Workflow

1. **Identify the Task**
   - Be specific about what you need
   - Provide context if it's a bug

2. **Ask the Agent**
   - Simply describe what you want in chat
   - Examples:
     - "Fix the TypeError in handleLog"
     - "Add a dark mode toggle to the Header"
     - "Explain how the vault encryption works"

3. **Agent Implementation**
   - Agent reads relevant files
   - Implements the change
   - Verifies with build/lint

4. **Review**
   - Check the changes in your editor
   - Test in browser if UI change

5. **Iterate if Needed**
   - Request adjustments
   - Agent fixes immediately

### Optional Quality Assurance

For critical changes, request comprehensive quality checks:

**Ask agent:**

```
"Run quality checks on these changes"
```

**Agent will execute:**

- ✅ `npm run lint`
- ✅ `npm run build`
- ✅ `./scripts/ui-change-check.sh` (if UI files changed)
- ✅ `./scripts/cost-guardrail.sh` (if AI code changed)
- ✅ `./scripts/architecture-drift-check.sh` (if core touched)
- ✅ `./scripts/latency-baseline.sh --check` (if baseline exists)
- ✅ Browser smoke test (if UI changed)

**Agent provides:**

- Comprehensive quality report
- Pass/fail for each check
- Recommendations for fixes

## Example Session

```
You: "The LifeBalanceStrip component isn't showing category colors correctly"

Agent: [Reads LifeBalanceStrip.tsx, identifies issue, fixes getCategoryColor usage]

You: [Reviews change, tests in browser]

You: "Perfect, but can you make the trend badges slightly larger?"

Agent: [Adjusts badge size]

You: "Run quality checks on these changes"

Agent: [Executes all quality scripts]
      ✅ Build: PASS
      ✅ Lint: PASS
      ✅ UI Change Guard: UI-only
      ✅ All checks passed
```

## Advantages

- ✅ Maximum control and oversight
- ✅ Instant feedback on errors
- ✅ Great for learning codebase
- ✅ No setup required
- ✅ Optional comprehensive quality checks

## Disadvantages

- ⚠️ Slowest for bulk work
- ⚠️ Requires active participation
