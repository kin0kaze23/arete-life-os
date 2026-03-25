# Quality Tiers Reference

Your guide to the 3-tier quality system.

---

## Quick Reference

| Tier         | Time  | Command                  | When to Use     |
| ------------ | ----- | ------------------------ | --------------- |
| **FAST**     | ~5s   | `npm run check`          | After each edit |
| **STANDARD** | ~30s  | `npm run check:standard` | Before commits  |
| **FULL**     | ~2min | `npm run check:full`     | Before pushing  |

---

## Tier 1: FAST

**Time**: ~5 seconds  
**Trigger**: `npm run check` or "Quick check"

### What It Checks

```
✅ npm run lint       (syntax, style)
✅ npm run typecheck  (TypeScript strict type checking — tsc --noEmit)
✅ npm run build      (bundle compilation)
```

> **CRITICAL**: `npm run build` (Vite) does NOT enforce TypeScript strict checking.
> `npm run typecheck` is the ONLY reliable type safety gate. This was added after
> 35+ TS errors shipped undetected through build-only checks in Jan 2026.

### When to Use

- After making a code change
- Quick sanity check
- Mode 1 default (automatic)

### What It Catches

- Syntax errors
- **Type mismatches** (via typecheck, NOT build)
- Unused imports
- Missing exports
- Missing type definitions
- References to non-existent properties

---

## Tier 2: STANDARD

**Time**: ~30 seconds  
**Trigger**: `npm run check:standard` or "Run quality check"

### What It Checks

```
✅ Everything in FAST
✅ npm audit              (dependency vulnerabilities)
✅ ui-change-check.sh     (UI vs core changes)
✅ cost-guardrail.sh      (new AI calls)
```

### When to Use

- Before committing
- At Mode 2 checkpoints (automatic)
- After finishing a component

### What It Catches

- All FAST issues
- Security vulnerabilities in packages
- Unintended core changes
- Cost-increasing AI additions

---

## Tier 3: FULL

**Time**: ~2 minutes  
**Trigger**: `npm run check:full` or "Run full quality gate"

### What It Checks

```
✅ Everything in STANDARD
✅ accessibility-check.sh    (WCAG 2.1 AA)
✅ architecture-drift-check.sh
✅ latency-baseline.sh       (performance)
✅ git status                (uncommitted files)
```

### When to Use

- Before pushing to remote
- End of feature work
- Mode 3 final evaluation (automatic)
- Before creating PR

### What It Catches

- All STANDARD issues
- Accessibility violations (alt text, ARIA, contrast)
- Architecture documentation drift
- Performance regressions
- Uncommitted changes

---

## Agent Behavior by Mode

| Mode                 | Default Tier | When                |
| -------------------- | ------------ | ------------------- |
| Mode 1 (Manual)      | FAST         | Every change        |
| Mode 2 (Native Auto) | STANDARD     | At checkpoints      |
| Mode 3 (Script Auto) | FULL         | At final evaluation |

### Upgrading Tiers

In Mode 1, you can request higher tiers:

```
"Fix X"                      → FAST
"Fix X and run quality"      → STANDARD
"Fix X and run full check"   → FULL
```

---

## Output Examples

### FAST (Pass)

```
🔍 Quality Check: FAST tier

━━━ TIER 1: Build & Lint ━━━
✅ Lint: PASS
✅ Build: PASS

══════════════════════════════
✅ FAST Quality Check: PASS
══════════════════════════════
```

### STANDARD (Pass with Warning)

```
🔍 Quality Check: STANDARD tier

━━━ TIER 1: Build & Lint ━━━
✅ Lint: PASS
✅ Build: PASS

━━━ TIER 2: Security & Cost ━━━
✅ Dependency Audit: PASS
⚠️  UI Change Guard: Review suggested
✅ Cost Guardrail: PASS

══════════════════════════════
✅ STANDARD Quality Check: PASS
   (1 warning)
══════════════════════════════
```

### FULL (Fail)

```
🔍 Quality Check: FULL tier

━━━ TIER 1: Build & Lint ━━━
✅ Lint: PASS
❌ Build: FAIL

══════════════════════════════
❌ FULL Quality Gate: FAIL
══════════════════════════════
```

---

## Troubleshooting

### "Latency Baseline Not Configured"

Run once to set baseline:

```bash
npm run build
./scripts/latency-baseline.sh --update
```

### "Accessibility Script Not Found"

Ensure axe-core is installed:

```bash
npm install --save-dev @axe-core/playwright
```

### "npm audit shows vulnerabilities"

```bash
npm audit fix            # Safe fixes
npm audit fix --force    # All fixes (may break)
```

---

## See Also

- [MODES.md](./MODES.md) - Development mode details
- [CHECKLISTS.md](./CHECKLISTS.md) - Session workflows
