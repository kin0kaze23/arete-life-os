# Skills Directory

This directory contains project-specific skill guides that teach the AI agent how to write excellent code for this project.

## 🧠 How Skills Work

**Skills are automatically loaded** by the agent based on what you're working on:

- Editing an API route? → Loads `api-design-intelligence`
- Creating a component? → Loads `component-analysis` + `visual-intelligence`
- Modifying database? → Loads `data-architecture-intelligence`

**You never need to manually activate skills.**

## 📚 Available Skills (12 Total)

| Skill                                                               | When Used        | Key Patterns                             |
| ------------------------------------------------------------------- | ---------------- | ---------------------------------------- |
| [api-design-intelligence](./api-design-intelligence/)               | API routes       | Response format, validation, errors      |
| [component-analysis](./component-analysis/)                         | React components | Hooks, state, props, memoization         |
| [data-architecture-intelligence](./data-architecture-intelligence/) | IndexedDB        | Migrations, schemas, indexing            |
| [debugging-500-errors](./debugging-500-errors/)                     | Server errors    | Stack traces, async debugging            |
| [error-resilience-intelligence](./error-resilience-intelligence/)   | Error handling   | Boundaries, retry, fallbacks             |
| [performance-intelligence](./performance-intelligence/)             | All code         | Bundle size, lazy loading, Vitals        |
| [planning-intelligence](./planning-intelligence/)                   | PRDs/plans       | Clear criteria, dependencies             |
| [product-intelligence](./product-intelligence/)                     | Features         | User value, design system                |
| [prompt-flow-optimization](./prompt-flow-optimization/)             | AI code          | Model selection, token usage             |
| [security-intelligence](./security-intelligence/)                   | Sensitive code   | Encryption, OWASP Top 10                 |
| [testing-strategy-intelligence](./testing-strategy-intelligence/)   | Tests            | Pyramid, Playwright, RTL                 |
| [visual-intelligence](./visual-intelligence/)                       | UI               | Glassmorphism, accessibility, animations |

## 📖 Skill Structure

Each skill folder contains:

```
skill-name/
├── SKILL.md         ← Core instructions (required)
├── examples/        ← Code examples (optional)
└── scripts/         ← Helper scripts (optional)
```

## 🎯 Creating New Skills

To add a new skill:

1. Create directory: `.agent/skills/my-skill-intelligence/`
2. Create `SKILL.md` with frontmatter:

```markdown
---
name: My Skill Intelligence
description: When and how to apply this skill
tags: [category, relevant-tech]
---

# Core Principles

...

# Patterns to Follow

...

# Anti-Patterns to Avoid

...
```

3. Agent will auto-load when relevant files are edited

## 🔍 Skill Selection Logic

The agent chooses skills based on:

- **File extension**: `.tsx` → component-analysis, visual-intelligence
- **File path**: `api/` → api-design-intelligence
- **File content**: Detects `IndexedDB` → data-architecture-intelligence
- **Task description**: "Add auth" → security-intelligence

## 💡 Best Practices

**DO**:

- ✅ Keep skills focused on one concern
- ✅ Provide concrete examples
- ✅ Document anti-patterns
- ✅ Update when patterns evolve

**DON'T**:

- ❌ Create overly broad skills
- ❌ Duplicate patterns across skills
- ❌ Mix unrelated concerns

## 📊 Skill Coverage

Current coverage: **100%** of project domains

- Frontend: component-analysis, visual-intelligence ✅
- Backend: api-design-intelligence, debugging-500-errors ✅
- Data: data-architecture-intelligence ✅
- Security: security-intelligence ✅
- Performance: performance-intelligence ✅
- Testing: testing-strategy-intelligence ✅
- Planning: planning-intelligence, product-intelligence ✅
- AI: prompt-flow-optimization ✅
- Resilience: error-resilience-intelligence ✅
