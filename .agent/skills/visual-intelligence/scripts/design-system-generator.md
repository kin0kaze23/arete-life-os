---
name: Design System Generator
description: Intelligent design system generation with industry-specific reasoning
version: 1.0.0
based_on: ui-ux-pro-max-skill v2.0
---

# Design System Generator Skill

> **Capabilities**: Generate complete design systems tailored to product type and industry

---

## Features

- **67 UI Styles**: Glassmorphism, Claymorphism, Minimalism, Brutalism, Neumorphism, Bento Grid, Dark Mode, AI-Native UI
- **96 Color Palettes**: Industry-specific palettes for SaaS, E-commerce, Healthcare, Fintech, Beauty, etc.
- **57 Font Pairings**: Curated typography combinations with Google Fonts
- **100 Industry Reasoning Rules**: Automatic pattern, style, and color recommendations

---

## How It Works

```
User Request → Multi-Domain Search → Reasoning Engine → Complete Design System
```

### 1. Multi-Domain Search (5 parallel searches)

- Product type matching (100 categories)
- Style recommendations (67 styles)
- Color palette selection (96 palettes)
- Landing page patterns (24 patterns)
- Typography pairing (57 font combinations)

### 2. Reasoning Engine

- Match product → UI category rules
- Apply style priorities (BM25 ranking)
- Filter anti-patterns for industry
- Process decision rules (JSON conditions)

### 3. Output Components

- Recommended Pattern
- Style Priority
- Color Palette
- Typography Pairing
- Key Effects
- Anti-Patterns to Avoid
- Pre-Delivery Checklist

---

## Industry-Specific Rules

### SaaS/Software

- Pattern: Hero + Features + Pricing + Integration
- Style: Minimalism, Bento Grid, Glassmorphism
- Colors: Professional blues, grays, accent colors
- Typography: Inter/Roboto, clean sans-serif
- ❌ Avoid: Overly decorative, childish fonts

### Healthcare/Wellness

- Pattern: Hero + Services + Testimonials + Booking
- Style: Soft UI, Calming, Organic shapes
- Colors: Soft pastels, sage green, calming blues
- Typography: Elegant serif (Cormorant) + clean sans (Montserrat)
- ❌ Avoid: Bright neon, dark mode, harsh effects

### Fintech/Banking

- Pattern: Trust-first + Security + Features + CTA
- Style: Professional, Trustworthy, Secure
- Colors: Navy, deep blues, gold accents
- Typography: Professional sans (Inter, Helvetica)
- ❌ Avoid: AI purple/pink gradients, playful fonts

### E-commerce/Retail

- Pattern: Hero Product + Categories + Social Proof + Shop
- Style: Clean, Product-focused, High contrast
- Colors: Product-appropriate, high contrast CTAs
- Typography: Clear hierarchy, readable
- ❌ Avoid: Cluttered, low contrast

---

## Pre-Delivery Checklist

Every design system MUST include:

### Visual Elements

- [ ] No emojis as functional icons (use SVG: Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Accessibility

- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Dark mode text contrast ≥ 4.5:1
- [ ] `prefers-reduced-motion` respected
- [ ] All interactive elements keyboard accessible

### Responsive Design

- [ ] 375px (Mobile)
- [ ] 768px (Tablet)
- [ ] 1024px (Desktop)
- [ ] 1440px (Large Desktop)

### Performance

- [ ] Optimized images (WebP/AVIF)
- [ ] No render-blocking resources
- [ ] Lazy loading for below-fold content

---

## Example Output

```
+----------------------------------------------------------------+
| TARGET: Glance OS - RECOMMENDED DESIGN SYSTEM                  |
+----------------------------------------------------------------+
|                                                                |
| PATTERN: Dashboard-Centric + Quick Actions                     |
| Conversion: Efficiency-driven with glanceable insights         |
| CTA: LogBar always visible, quick templates                    |
| Sections: Daily Briefing | SWOT | Goals | Tasks | Events       |
|                                                                |
| STYLE: Glassmorphism + Dark Premium                            |
| Keywords: Glassmorphism, subtle depth, premium, calm           |
| Best For: Productivity, wellness, life management              |
| Performance: Excellent | Accessibility: WCAG AA                 |
|                                                                |
| COLORS:                                                        |
| Background: #0A0A0F (Deep Black)                               |
| Card: #14141A (Dark Slate)                                     |
| Elevated: #1A1A24 (Hover)                                      |
| Primary: #3B82F6 (Blue)                                        |
| Success: #22C55E (Green)                                       |
| Warning: #F97316 (Orange)                                      |
| Critical: #EF4444 (Red)                                        |
| Notes: Calming dark palette with status gradients             |
|                                                                |
| TYPOGRAPHY: Inter / JetBrains Mono                             |
| Mood: Modern, readable, professional                           |
| Best For: Dashboards, productivity apps, data-heavy UIs        |
| Google Fonts: https://fonts.google.com/specimen/Inter          |
|                                                                |
| KEY EFFECTS:                                                   |
| Glassmorphism (backdrop-filter: blur(12px))                    |
| Smooth transitions (200-300ms)                                 |
| Number counter animations                                      |
| Gradient progress bars                                         |
|                                                                |
| AVOID (Anti-patterns):                                         |
| Bright neon colors + Harsh animations                          |
| Light mode default + AI purple/pink gradients                  |
| Cluttered interfaces + Too many modals                         |
|                                                                |
| PRE-DELIVERY CHECKLIST:                                        |
| [✓] SVG icons (Heroicons/Lucide)                               |
| [✓] cursor-pointer on clickables                               |
| [✓] Hover states (150-300ms)                                   |
| [✓] Text contrast 4.5:1 minimum                                |
| [✓] Focus states visible                                       |
| [✓] prefers-reduced-motion respected                           |
| [✓] Responsive: 375px, 768px, 1024px, 1440px                   |
|                                                                |
+----------------------------------------------------------------+
```

---

## Usage

When designing a new feature or page:

1. **Identify the product type** (Dashboard, Landing Page, E-commerce, etc.)
2. **Generate design system** using this skill
3. **Apply recommendations** to your component
4. **Validate against checklist**
5. **Test on all breakpoints**

---

**Keywords**: Design System, UI Patterns, Color Palettes, Typography, Industry Standards
