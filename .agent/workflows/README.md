# Workflows Directory

This directory contains reusable workflow definitions for common development tasks.

## 📚 Consolidated Reference Docs (Read These)

Start with these for quick reference:

1. **[MODES.md](./MODES.md)** - 3 development modes explained
2. **[QUALITY.md](./QUALITY.md)** - 3 quality tiers explained
3. **[CHECKLISTS.md](./CHECKLISTS.md)** - Common task checklists

## 📋 Mode-Specific Workflows

Detailed guides for each development mode:

- **[manual-development.md](./manual-development.md)** - Mode 1: Ad-hoc fixes
- **[native-automation.md](./native-automation.md)** - Mode 2: Semi-automated
- **[script-automation.md](./script-automation.md)** - Mode 3: Fully automated
- **[quality-automation.md](./quality-automation.md)** - Quality gate workflow

## 🎯 Specialized Workflows

Task-specific protocols:

- **[ui-ux-change.md](./ui-ux-change.md)** - UI change guardrails
- **[add-ai-generator.md](./add-ai-generator.md)** - New AI call checklist

## ⚡ Slash Command Workflows

Short workflows triggered by slash commands (e.g., /start-session):

- **[start-session.md](./start-session.md)** - Session startup
- **[end-session.md](./end-session.md)** - Session shutdown
- **[pre-push.md](./pre-push.md)** - Pre-push checks

## 🔄 How Workflows Work

Workflows are markdown files with:

- **Frontmatter**: Description
- **Instructions**: Step-by-step guide
- **Turbo annotations**: Auto-run commands

Example:

```markdown
---
description: What to do when starting a session
---

## Steps

// turbo

1. Check git status: `git status`
```

The `// turbo` annotation tells the agent to auto-run that step.

## 📖 Usage

**For Users**: Read MODES.md, QUALITY.md, CHECKLISTS.md

**For Agent**: Automatically loads relevant detailed workflows

**For Slash Commands**: Type `/start-session` in chat to trigger
