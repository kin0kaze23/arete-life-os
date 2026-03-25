# Checklists Reference

Quick checklists for common workflows.

---

## Starting a Session

```
// turbo-all
```

1. Check git status: `git status`
2. Pull latest: `git pull`
3. Install deps if needed: `npm install`
4. Start dev server: `npm run dev`
5. Read status: `.agent/core/CURRENT_STATUS.md`

**Or just say**: "Let's start a session"

---

## Ending a Session

1. Run quality check: `npm run check:standard`
2. Commit changes: `git add . && git commit -m "message"`
3. Update status doc (agent does this)

**Or just say**: "End session"

---

## Pre-Push Checklist

```bash
# Option 1: One command
npm run check:full

# Option 2: Step by step
npm run lint
npm run build
npm audit
./scripts/ui-change-check.sh
./scripts/architecture-drift-check.sh
git status
```

**Or just say**: "Run pre-push checks"

---

## UI/UX Changes

Before making UI changes:

1. Identify scope: "Is this UI-only or touching core?"
2. Run: `./scripts/ui-change-check.sh`
3. If touching core → Extra review needed

After making UI changes:

1. Visual check in browser
2. Run: `./scripts/accessibility-check.sh`
3. Check performance: `./scripts/latency-baseline.sh --check`

**Or just say**: "I'm making UI changes to [component]"

---

## Adding AI Generator

Checklist when adding new AI call:

- [ ] Add memory context (relevant user data)
- [ ] Handle streaming/feedback properly
- [ ] Verify facts (no hallucinations)
- [ ] Handle temporal reasoning (dates/times)
- [ ] Schema validation (Zod)
- [ ] Model fallback (flash → pro → flash)
- [ ] Update AI_PROMPT_FLOW.md
- [ ] Run: `npm run doctor`
- [ ] Run: `./scripts/cost-guardrail.sh`

**Or just say**: "I'm adding an AI generator"

---

## Quick Commands

| Task                | Command                                    |
| ------------------- | ------------------------------------------ |
| Quick quality check | `npm run check`                            |
| Standard quality    | `npm run check:standard`                   |
| Full quality gate   | `npm run check:full`                       |
| Start automation    | `npm run auto`                             |
| Digest plan         | `npm run devops:digest -- path/to/plan.md` |
| Check accessibility | `./scripts/accessibility-check.sh`         |
| Set perf baseline   | `./scripts/latency-baseline.sh --update`   |

---

## See Also

- [MODES.md](./MODES.md) - Development mode details
- [QUALITY.md](./QUALITY.md) - Quality tier details
