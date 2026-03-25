# Plans Directory

This directory contains feature plans, PRDs (Product Requirement Documents), and implementation roadmaps.

## 📋 Current Plans (10)

| Plan                                                                               | Status      | Type                 |
| ---------------------------------------------------------------------------------- | ----------- | -------------------- |
| [product-strategy.md](./product-strategy.md)                                       | Active      | Product strategy     |
| [agent-workflow-optimization-plan.md](./agent-workflow-optimization-plan.md)       | ✅ Complete | Workflow enhancement |
| [ai-model-cost-optimization-research.md](./ai-model-cost-optimization-research.md) | Reference   | Research             |
| [ai-model-strategy-plan.md](./ai-model-strategy-plan.md)                           | Reference   | Strategy             |
| [ai-prompt-optimization-plan.md](./ai-prompt-optimization-plan.md)                 | Reference   | Optimization         |
| [glance-devops-automation-2026-01-31.md](./glance-devops-automation-2026-01-31.md) | ✅ Complete | DevOps automation    |
| [latency-optimization-plan.md](./latency-optimization-plan.md)                     | Reference   | Performance          |
| [mobile-app-plan.md](./mobile-app-plan.md)                                         | Future      | Mobile app           |
| [p0-dashboard-implementation.md](./p0-dashboard-implementation.md)                 | ✅ Complete | Dashboard P0         |
| [security-enhancement-plan.md](./security-enhancement-plan.md)                     | Pending     | Security             |

## 📝 Plan Format

Plans should follow this structure:

```markdown
# [Plan Name]

## Overview

Brief description of the goal

## User Value

Why this matters

## Proposed Changes

### Phase 1: [Name]

- [ ] Task 1
- [ ] Task 2

### Phase 2: [Name]

- [ ] Task 3

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification Plan

How to test success
```

## 🚀 Using Plans

### Mode 2 (Native Automation)

```
"Implement product-strategy.md Phase 1"
```

### Mode 3 (Script Automation)

```bash
npm run auto -- .agent/plans/product-strategy.md
```

Optionally digest first to preview:

```bash
npm run devops:digest -- .agent/plans/product-strategy.md
```

## 📂 Organization

**Active plans**: Keep in this directory  
**Completed plans**: Move to `.agent/archive/plans/` (optional)  
**Reference plans**: Keep for future reference

## 🎯 Creating New Plans

1. Copy template (if exists) or start from scratch
2. Name with meaningful identifier: `feature-name-plan.md`
3. Break down into phases with clear tasks
4. Define acceptance criteria
5. Add verification steps

## ✅ Plan Quality Checklist

- [ ] Clear user value statement
- [ ] Tasks are specific and measurable
- [ ] Dependencies identified
- [ ] Acceptance criteria defined
- [ ] Verification plan included
- [ ] Phases are logical groupings
