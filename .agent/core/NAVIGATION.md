# .agent Navigation

**For users**: Read [USER_INTERACTION_MANUAL.md](./USER_INTERACTION_MANUAL.md) — it's the only doc you need.

**For agents**: Read [AGENT.md](./AGENT.md) for HARD RULES, then [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) for tool strategy.

## Quick Commands

```bash
npm run dev            # Dev server at :3000
npm run typecheck      # TypeScript gate
npm run check          # Fast quality (typecheck + lint + build)
npm run check:full     # Full quality (all checks)
npm run auto           # Mode 3 script automation
```

## Core Files (.agent/core/)

| File                                                       | Purpose                                       |
| ---------------------------------------------------------- | --------------------------------------------- |
| [AGENT.md](./AGENT.md)                                     | HARD RULES + agent operating manual           |
| [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)             | Tool strategy (Anti-Gravity / Codex / Claude) |
| [MODE3.md](./MODE3.md)                                     | Mode 3 script automation architecture         |
| [USER_INTERACTION_MANUAL.md](./USER_INTERACTION_MANUAL.md) | User-facing development guide                 |
| [CURRENT_STATUS.md](./CURRENT_STATUS.md)                   | Session state snapshot                        |
| [LEARNINGS.md](./LEARNINGS.md)                             | Historical learnings                          |
| [LEARNINGS_QUICKREF.md](./LEARNINGS_QUICKREF.md)           | One-line learning summaries                   |
| [TEST_GENERATION_GUIDE.md](./TEST_GENERATION_GUIDE.md)     | Testing reference                             |
| [COST_APPROVALS.md](./COST_APPROVALS.md)                   | AI cost tracking rules                        |
| [README.md](./README.md)                                   | Project overview                              |

## Subdirectories

| Directory                   | Purpose                              |
| --------------------------- | ------------------------------------ |
| [workflows/](../workflows/) | Development workflows and checklists |
| [skills/](../skills/)       | Domain knowledge (12 skill folders)  |
| [plans/](../plans/)         | Feature plans and PRDs               |
