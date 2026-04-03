# Design Specification Template

> **For Antigravity IDE:** Write design specs here after visual exploration
> **For Claude Code:** Read specs from this folder before implementation

---

## Metadata

- **Date:** YYYY-MM-DD
- **Design Topic:** [e.g., Glassmorphism UI Improvements]
- **Designer:** [Antigravity IDE / Human]
- **Status:** draft | approved | implemented

---

## Overview

[Brief description of what this design does and why]

---

## Visual Design

### Design Tokens

```typescript
// Example: Update these values based on design exploration
const tokens = {
  glassmorphism: {
    blur: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  animation: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  typography: {
    radii: '8px',
  },
};
```

### Component Changes

| Component        | Change         | Before              | After               |
| ---------------- | -------------- | ------------------- | ------------------- |
| [Component Name] | [What changed] | [description/image] | [description/image] |

---

## Files to Modify

[List all files that need changes]

```
src/design-system/tokens.ts
src/components/dashboard/Card.tsx
src/components/shared/Button.tsx
...
```

---

## Implementation Notes

[Any special considerations for implementation]

---

## Review Checklist

- [ ] Design previewed in Antigravity IDE
- [ ] Claude Code implementation plan reviewed
- [ ] All affected files identified
- [ ] Verification profile selected (ui-surface)

---

## Approval

- [ ] Human designer approved
- [ ] Claude Code `/plan` contract created
- [ ] Implementation complete
- [ ] Gates passed (lint + typecheck + build + visual)
