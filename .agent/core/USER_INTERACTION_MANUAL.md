# How to Develop Areté Life OS

**Last Updated**: February 1, 2026

---

## Your Role

You are the **Product Owner + QA**. You describe what to build, review the output, and test at localhost:3000. You do NOT need to write code.

---

## Quick Start

### Start a Session

Paste this into Anti-Gravity (or any agent):

```
Read .agent/core/AGENT.md and .agent/core/CURRENT_STATUS.md. Start dev server with npm run dev. Run npm run typecheck to confirm health.
```

### Start Fresh (No Prior Context)

```
Fresh session. Read .agent/core/AGENT.md and .agent/core/DEVELOPMENT_SETUP.md. Start dev server with npm run dev.
```

### Execute a Plan

```
Read .agent/plans/dashboard-revamp-2026-02-01.md and implement it phase by phase. Run the Per-Phase Completion Gate after each phase and paste the output.
```

### Fix Something

```
On the dashboard at localhost:3000, the SWOT grid shows no data. I expected Strengths/Concerns/Opportunities/Risks from insights and blindSpots. Fix it.
```

### End a Session

```
End session. Run npm run check:standard and paste the full output. Commit all changes. Update .agent/core/CURRENT_STATUS.md with what was done and what's next.
```

---

## The One Rule That Matters

**Every interaction should end with proof the code works.** Not "it should work" — actual terminal output.

The minimum proof is:
```bash
npm run typecheck && echo "PASS" || echo "FAIL"
```

For finished features, the proof is:
```bash
npm run check:standard
```

If the agent says "done" without pasting output, say: **"Paste the output of `npm run check:standard`."**

---

## Your Three Tools

| Tool | Role | Use For |
|------|------|---------|
| **Anti-Gravity (Gemini 3 Pro)** | Primary | All development. Reads `.agent/` automatically. Highest usage limits. |
| **Cursor + Codex (GPT 5.2)** | Secondary | When Anti-Gravity fails after 2 attempts. Quick inline edits. |
| **Cursor + Claude (Opus 4.5)** | Reserve | Writing plans, architecture decisions, evaluating strategies. Limited credits. |

**Sync rule**: Commit before switching tools. Git is the shared brain.

---

## How Plans Work

Plans are the most reliable way to get quality output from Anti-Gravity.

### The Pattern

```
Claude writes a plan  →  You review  →  Anti-Gravity executes  →  You test at :3000
```

### What Makes a Good Plan

Plans live in `.agent/plans/`. A good plan has:
- **Phases** with exact files to create/modify
- **Props interfaces** with exact field names from `data/types.ts`
- **Anti-patterns** (what NOT to do)
- **Per-Phase Completion Gate** — forces the agent to run quality checks after each phase
- **Final Gate** — forces the agent to prove everything works before saying "done"

### Current Active Plan

- `dashboard-revamp-2026-02-01.md` — Dashboard layout revamp (8 phases)
- `glanceOS-revamp-strategy.md` — Product strategy (source of truth)

---

## Enforcing Quality

The agent has quality scripts but won't always run them unless you ask. Here's how to enforce:

### During Development (after each change)

Say: **"Run typecheck."** Or for more thorough checking: **"Run `npm run check` and paste the output."**

### Before Committing

Say: **"Run `npm run check:standard` and paste the full output."**

This runs: typecheck + lint + build + security audit + UI change guard + cost guardrail.

### Before Pushing / PR

Say: **"Run `npm run check:full` and paste the full output."**

This adds: accessibility check + architecture drift + performance baseline + git status.

### Quality Tiers at a Glance

| Command | Checks | When |
|---------|--------|------|
| `npm run typecheck` | TypeScript only | After every edit |
| `npm run check` | typecheck + lint + build | After each feature |
| `npm run check:standard` | + security, cost, UI guard | Before commits |
| `npm run check:full` | + a11y, architecture, perf | Before push/PR |

---

## What the Agent Brain Contains

The `.agent/` directory is the agent's memory. You don't need to read any of this — but here's what's in there if you're curious:

### Core Files

| File | Purpose |
|------|---------|
| `AGENT.md` | 8 hard rules from past failures (no orphans, typecheck gate, no phantom types, etc.) |
| `CURRENT_STATUS.md` | Last session state — what was done, what's next |
| `DEVELOPMENT_SETUP.md` | Tool roles, sync protocol |
| `LEARNINGS.md` | Full history of mistakes and fixes |

### Skills (Auto-Loaded)

12 skill files that auto-activate based on which files the agent edits. You never need to mention them — but if the agent produces bad UI, you can say: **"Read `.agent/skills/visual-intelligence/SKILL.md` and apply it."**

Key skills: `visual-intelligence` (design system), `security-intelligence` (OWASP), `performance-intelligence` (bundle size), `data-architecture-intelligence` (schema).

### Workflows

Step-by-step protocols the agent follows:

| Workflow | Triggers When |
|----------|---------------|
| `start-session.md` | You say "start session" |
| `end-session.md` | You say "end session" |
| `native-automation.md` | You say "implement [plan]" |
| `ui-ux-change.md` | Agent detects UI file changes |

### Scripts

Shell scripts that run quality checks:

| Script | What It Does |
|--------|-------------|
| `quality.sh` | Unified 3-tier quality gate |
| `doctor.sh` | Full health check |
| `ui-change-check.sh` | Detects UI vs core changes |
| `cost-guardrail.sh` | Flags new AI calls |
| `architecture-drift-check.sh` | Flags core changes without doc updates |

---

## Common Problems and What to Say

| Problem | What to Say |
|---------|-------------|
| Agent says "done" without proof | "Paste the output of `npm run check:standard`." |
| Component doesn't render | "Is [Component] imported in its parent and added to the barrel export?" |
| Type errors | "Run `npm run typecheck` and fix all errors before proceeding." |
| Agent invents types | "Only use types from `data/types.ts`. Check the actual interface." |
| Agent adds mock/demo data | "No mock data. Show empty state or real data only." |
| Port 3000 not working | "Run `pkill -f vite && npm run dev`" |
| Agent forgot last session | "Read `.agent/core/CURRENT_STATUS.md` for context." |
| Bad UI/design | "Read `.agent/skills/visual-intelligence/SKILL.md` and fix the design." |
| Agent skipped quality checks | "Run the Per-Phase Completion Gate from the plan and paste output." |
| Different tool doesn't see changes | "Commit first: `git add -A && git commit -m 'sync'`" |

---

## Productivity Tips

1. **Claude writes plans, Anti-Gravity executes.** Best reasoning for planning, highest limits for doing.
2. **Always ask for pasted output.** "Run typecheck" is good. "Run typecheck and paste the output" is better.
3. **Test at localhost:3000 after every feature.** "It compiles" is not proof it works.
4. **One feature at a time.** Sequential focus beats parallel chaos.
5. **Reference plans explicitly.** Say "read `.agent/plans/X.md`" so the agent has full context.
6. **Be specific about issues.** Include which page, what you expected, what you see. Screenshots help.

---

## Dev Server

`http://localhost:3000` with `strictPort: true`. If port is occupied: `pkill -f vite && npm run dev`
