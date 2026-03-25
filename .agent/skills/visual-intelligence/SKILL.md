---
name: visual-intelligence
description: UI/UX design intelligence and evaluation for premium, accessible, and high-performance interfaces. Use when designing, building, or reviewing UI code.
---

# Visual Intelligence Skill

> **Based on**: Nielsen's 10 Heuristics, WCAG 2.1 AA, Apple HIG, UI-UX Pro Max  
> **Aesthetic Target**: Premium Dark, Glassmorphism, Micro-interactions

## 1. Professional Design Intelligence (Checklists)

Before delivering any UI code, systematically verify against these high-priority categories.

### 🔴 Priority 1: Accessibility & Interaction (Critical)

- [ ] **Contrast**: Minimum 4.5:1 ratio for text (use Chrome DevTools to verify).
- [ ] **Focus States**: Visible focus rings/outlines for all interactive elements.
- [ ] **Aria Labels**: Descriptive labels for icon-only buttons (e.g., `aria-label="Delete Event"`).
- [ ] **Touch Targets**: Minimum 44px x 44px for mobile interaction.
- [ ] **No Emojis as Icons**: Use Lucide or Heroicons (SVG) for functional icons.
- [ ] **Keyboard Nav**: Tab order matches visual order; no keyboard traps.

### 🟠 Priority 2: Layout & Spacing (High)

- [ ] **Responsive**: Verified at 375px (Mobile), 768px (Tablet), 1440px (Desktop).
- [ ] **Edge Spacing**: Floating elements have consistent padding from screen edges.
- [ ] **Navbar Obstruction**: No content hidden behind fixed/absolute headers or footers.
- [ ] **No Horizontal Scroll**: Ensure `overflow-x-hidden` or proper container sizing on mobile.
- [ ] **Consistent Max-Width**: Use standard containers (e.g., `max-w-6xl`) across pages.

### 🟡 Priority 3: Aesthetics & Micro-interactions (High)

- [ ] **Glassmorphism**: Cards use `bg-white/5` or `bg-black/40` with `backdrop-filter: blur(12px)`.
- [ ] **Hover States**: Clear visual feedback; transitions are smooth (150-300ms).
- [ ] **No Layout Shift**: Hover/Active states do not cause adjacent elements to move.
- [ ] **Gradients**: Use HSL-curated subtle gradients, not harsh neon colors.
- [ ] **Typography**: Standard pairings (e.g., Inter for UI, JetBrains Mono for data).

---

## 2. Semantic Design System (Stitch-Inspired)

Describe the design language using **evocative, natural language** paired with technical values. This approach ensures consistency when generating or reviewing UI components.

### Atmosphere & Energy

- **Minimalist Calm**: The UI prioritizes whitespace and progressive disclosure. Nothing is cluttered; every element serves a purpose.
- **Premium Performance**: Glassmorphism and subtle gradients convey sophistication without overwhelming the user.
- **Dark-First Intelligence**: Deep blacks (`#0A0A0F`) create a canvas for focus, while vibrant gradients signal status.

### Color Semantics (Functional Naming)

Instead of raw hex codes, describe colors by their **purpose**:

- **Aura Primary (`#3B82F6`)**: The color of focused action. Used for primary CTAs and interactive elements.
- **Aura Elevated (`#1A1A24`)**: The hover state for cards, signaling interactivity without brightness.
- **Status Critical (`linear-gradient(135deg, #EF4444, #DC2626)`)**: The red gradient reserved for alerts and warnings.
- **Status Thriving (`linear-gradient(135deg, #8B5CF6, #6D28D9)`)**: The purple gradient for peak performance indicators.

### Visual Atoms

- **Edges**: Generously rounded corners (`border-radius: 12px`) for cards; subtle rounding (`6px`) for buttons.
- **Depth**: Cards float with `backdrop-filter: blur(12px)` and soft shadows (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)`).
- **Spacing**: Consistent 8px grid system; primary containers use `padding: 24px`.
- **Typography**: Inter for body text (clean, readable); JetBrains Mono for data (fixed-width for alignment).

---

## 3. Core Design Principles for Areté Life OS

### User-Centered Design

- **Prioritize user needs** over aesthetic preferences
- **Simplicity over complexity** - Every element must serve a purpose
- **Emotional appeal** - Premium feel with smooth animations and transitions
- **Intuitive navigation** - Users should know where they are and how to get where they want

### Nielsen's 10 Usability Heuristics (Mandatory)

1. **Visibility of System Status**
   - Show loading indicators for all async operations
   - Provide feedback for user actions within 100ms
   - Display progress for long-running tasks
   - ❌ Avoid: Silent failures, no loading states

2. **Match Between System and Real World**
   - Use familiar terminology (not technical jargon)
   - Follow real-world conventions (e.g., red = danger)
   - Use metaphors users understand (trash can for delete)
   - ❌ Avoid: Developer terms, unclear icons

3. **User Control and Freedom**
   - Provide undo/redo for destructive actions
   - Allow users to cancel long operations
   - Offer clear exit paths from modals/flows
   - ❌ Avoid: No Way to cancel, forced flows

4. **Consistency and Standards**
   - Use consistent terminology across app
   - Follow platform conventions (iOS/Web/Android)
   - Maintain visual consistency (colors, spacing, typography)
   - ❌ Avoid: Different terms for same action, inconsistent button styles

5. **Error Prevention**
   - Use constraints to prevent invalid input
   - Confirm destructive actions (delete, clear data)
   - Provide input validation before submission
   - ❌ Avoid: Allowing impossible states, no confirmation

6. **Recognition Rather Than Recall**
   - Make actions and options visible
   - Use tooltips for icon-only buttons
   - Provide contextual help
   - ❌ Avoid: Hidden functionality, unclear icons

7. **Flexibility and Efficiency of Use**
   - Offer keyboard shortcuts for power users
   - Provide quick actions/shortcuts
   - Allow customization of frequently used features
   - ❌ Avoid: Mouse-only interactions, no shortcuts

8. **Aesthetic and Minimalist Design**
   - Remove unnecessary elements
   - Use whitespace effectively
   - Focus attention on primary actions
   - ❌ Avoid: Cluttered interfaces, too many options

9. **Help Users Recognize, Diagnose, and Recover from Errors**
   - Error messages in plain language
   - Suggest solutions, not just problems
   - Indicate what field has error
   - ❌ Avoid: Technical error codes, vague messages

10. **Help and Documentation**
    - Provide contextual help
    - Include searchable docs
    - Show examples for complex features
    - ❌ Avoid: No help, hard-to-find docs

---

## 2. Accessibility Standards (WCAG 2.1 AA - Mandatory)

### Semantic HTML

- ✅ Use `<button>` for clickable actions
- ✅ Use `<a>` for navigation
- ✅ Use `<nav>`, `<main>`, `<aside>`, `<section>`, `<article>`
- ❌ Avoid: `<div>` with onClick for everything

### ARIA Labels

- ✅ Add `aria-label` to icon-only buttons
- ✅ Use `aria-describedby` for form help text
- ✅ Set `role` for custom components
- ❌ Avoid: Unlabeled interactive elements

### Keyboard Navigation

- ✅ All interactive elements focusable via Tab
- ✅ Visible focus indicators (ring/outline)
- ✅ Logical tab order
- ✅ Keyboard shortcuts don't conflict with browser/screen reader
- ❌ Avoid: Keyboard traps, hidden focus

### Color Contrast

- ✅ Text: 4.5:1 ratio (normal), 3:1 (large 18px+)
- ✅ UI components: 3:1 ratio
- ✅ Test with Lighthouse/axe DevTools
- ❌ Avoid: Low contrast text, color-only indicators

### Screen Reader Support

- ✅ Alt text for all images
- ✅ Form labels associated with inputs
- ✅ Meaningful link text (not "click here")
- ❌ Avoid: Empty alt text for important images

### Testing Tools

- Lighthouse (Chrome DevTools)
- axe DevTools browser extension
- WAVE accessibility tool
- Keyboard navigation testing

---

## 3. Responsive Design

### Mobile-First Approach

- ✅ Design for 375px mobile first
- ✅ Scale up to tablet (768px), desktop (1024px, 1440px)
- ✅ Use CSS Grid/Flexbox for layouts
- ❌ Avoid: Desktop-first, fixed widths

### Breakpoints (Standard)

```css
/* Mobile: 375px-767px (default) */
/* Tablet: 768px-1023px */
@media (min-width: 768px) { ... }

/* Desktop: 1024px-1439px */
@media (min-width: 1024px) { ... }

/* Large Desktop: 1440px+ */
@media (min-width: 1440px) { ... }
```

### Touch Targets

- ✅ Minimum 44px × 44px (Apple HIG)
- ✅ Minimum 48px × 48px (Material Design)
- ✅ Adequate spacing between clickable elements
- ❌ Avoid: Tiny buttons on mobile, crowded interfaces

### Responsive Images

- ✅ Use `srcset` for different resolutions
- ✅ Lazy load off-screen images
- ✅ Optimize image sizes (WebP, AVIF)
- ❌ Avoid: Pixelated scaling, large unoptimized images

---

## 4. Design System Consistency

### Color Palette (Glance OS Dark)

```css
--bg-primary: #0a0a0f; /* Deep black */
--bg-card: #14141a; /* Card surface */
--bg-elevated: #1a1a24; /* Hover state */

--text-primary: #ffffff; /* Primary text */
--text-secondary: #9ca3af; /* Secondary text */
--text-muted: #6b7280; /* Muted text */

--status-critical: linear-gradient(135deg, #ef4444, #dc2626);
--status-at-risk: linear-gradient(135deg, #f97316, #ea580c);
--status-healthy: linear-gradient(135deg, #22c55e, #16a34a);
--status-thriving: linear-gradient(135deg, #8b5cf6, #6d28d9);

--accent-primary: #3b82f6; /* Primary actions */
--accent-secondary: #8b5cf6; /* Secondary actions */
```

### Typography Scale

```css
--font-family-sans: 'Inter', -apple-system, system-ui;
--font-family-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
```

### Spacing System (8px grid)

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
```

### No Ad-Hoc Styles

- ✅ Use design tokens (CSS variables)
- ✅ Follow spacing system
- ✅ Use predefined colors
- ❌ Avoid: Random hex codes, arbitrary spacing, inline styles

---

## 5. Performance Standards

### Load Time Budgets

- ✅ First Contentful Paint (FCP): < 1.8s
- ✅ Largest Contentful Paint (LCP): < 2.5s
- ✅ Time to Interactive (TTI): < 3.8s
- ✅ First Input Delay (FID): < 100ms
- ✅ Cumulative Layout Shift (CLS): < 0.1

### Optimization Techniques

- ✅ Code splitting with dynamic imports
- ✅ Lazy load images and heavy components
- ✅ Minify CSS/JS in production
- ✅ Use CSS containment for complex components
- ❌ Avoid: Importing entire libraries, unoptimized images

### Animation Performance

- ✅ Use `transform` and `opacity` for animations
- ✅ Keep animations under 300ms
- ✅ Respect `prefers-reduced-motion`
- ❌ Avoid: Animating `width`, `height`, `top`, `left`

---

## 6. Modern UI Patterns

### Progressive Disclosure

- Show only essential information initially
- Reveal details on demand
- Use expand/collapse for secondary content
- Example: SWOT grid with collapsible sections

### Micro-Interactions

- ✅ Hover states (150-300ms transition)
- ✅ Click feedback (scale, color change)
- ✅ Success animations (confetti, checkmark)
- ✅ Loading skeletons (not just spinners)
- ❌ Avoid: No feedback, jarring animations

### Visual Hierarchy

```
Primary Action (large, bold, high contrast)
  ↓
Secondary Action (medium, less prominent)
  ↓
Tertiary Action (small, subtle)
```

### Clear CTAs (Call-to-Action)

- ✅ Above the fold for key actions
- ✅ High contrast button
- ✅ Action-oriented text ("Log Workout", not "Submit")
- ❌ Avoid: Hidden CTAs, vague labels

---

## 7. Glance OS Specific Guidelines

### Premium Dark Theme

- ✅ Glassmorphism for cards (`backdrop-filter: blur(12px)`)
- ✅ Subtle shadows for depth
- ✅ Smooth gradients for status colors
- ✅ Soft transitions (200-300ms)
- ❌ Avoid: Harsh neon colors, overwhelming effects

### Dashboard Layout

- ✅ Daily Briefing fixed at top (always visible)
- ✅ Collapsible sections (SWOT, Goals) with state persistence
- ✅ LogBar fixed at bottom (always accessible)
- ✅ Responsive grid (1-col mobile, 2-col tablet, 3-col desktop)

### Score Visualization

- ✅ Trend indicators (↑↓→) with color coding
- ✅ Gradient progress bars
- ✅ Badge indicators (🔴🟠🟢💎)
- ✅ Number counter animations

### Empty States

- ✅ Illustrative icon or graphic
- ✅ Clear explanation of what's empty
- ✅ Suggested action to fill it
- ❌ Avoid: Blank screens, confusing messages

---

## 8. Enforcement Checklist

### Before Implementation

- [ ] Reviewed against Nielsen's 10 Heuristics
- [ ] Checked WCAG 2.1 AA compliance
- [ ] Verified responsive design (mobile, tablet, desktop)
- [ ] Used design system tokens (no ad-hoc styles)
- [ ] Added appropriate micro-interactions
- [ ] Tested keyboard navigation
- [ ] Verified color contrast (4.5:1 minimum)
- [ ] Added loading states
- [ ] Provided error recovery
- [ ] Optimized for performance

### Testing Requirements

- [ ] Lighthouse score ≥ 90 (Accessibility, Best Practices)
- [ ] axe DevTools: 0 violations
- [ ] Keyboard navigation: All features accessible
- [ ] Screen reader: Meaningful announcements
- [ ] Mobile: Touch targets ≥ 44px
- [ ] Performance: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Code Quality

- [ ] No inline styles
- [ ] Uses design tokens
- [ ] Semantic HTML
- [ ] Accessible ARIA labels
- [ ] Proper focus management
- [ ] Respects reduced motion preference

---

## 9. Anti-Patterns (Do NOT Use)

### Design Anti-Patterns

- ❌ Bright neon colors on dark backgrounds
- ❌ Harsh animations or excessive motion
- ❌ Generic AI gradients (purple/pink)
- ❌ Emoji as functional icons (use SVG)
- ❌ Mystery meat navigation (unclear icons)
- ❌ Modal hell (too many modals)
- ❌ Wall of text (no visual hierarchy)

### Code Anti-Patterns

- ❌ `<div>` for everything
- ❌ Inline styles
- ❌ No accessibility attributes
- ❌ Fixed pixel widths
- ❌ Missing alt text
- ❌ No error boundaries
- ❌ Unoptimized images

---

## 10. Reference Standards

### Design Systems

- Material Design 3 (Google)
- Apple Human Interface Guidelines
- Fluent Design (Microsoft)
- Carbon Design System (IBM)

### Accessibility

- WCAG 2.1 Level AA (minimum)
- WCAG 2.1 Level AAA (aspirational)
- ARIA Authoring Practices Guide

### Performance

- Core Web Vitals (Google)
- Lighthouse CI
- Performance budgets

---

## Enforcement

**This document is MANDATORY for all UI/UX development.**

Before implementing any UI/UX feature:

1. Review against these rules
2. Identify potential violations
3. Suggest improvements if needed
4. **Do NOT proceed if standards are violated**

After implementation:

1. Run Lighthouse audit
2. Test keyboard navigation
3. Verify responsive design
4. Check accessibility with axe DevTools
5. Get user feedback

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-31  
**Maintained By**: Glance OS Team
