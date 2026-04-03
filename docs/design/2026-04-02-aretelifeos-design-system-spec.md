---
title: 'AreteLifeOS Premium Design Guidelines & Specs'
date: '2026-04-02'
version: '1.0.0'
---

# AreteLifeOS Design System: "Life Pulse"

This living document serves as the master contract for the visual styling, topography, and interaction design of the AreteLifeOS dashboard.

## 1. Typography (The Voice)

The app must speak with a premium, minimalist, and deeply human voice. We have completely abandoned the "hacker/terminal" vibe.

- **Primary Font**: `Inter` (sans-serif)
  - Lightweight (300/400) for calming body text.
  - Heavyweight (800/900) for aggressive headers (tightened tracking `-tracking-tight`).
- **Data Font**: `SF Pro Rounded` or native sans-serif numeric rendering (no monospace fonts, no JetBrains Mono) for Life Pulse percentages.

## 2. Color Palette (The Atmosphere)

We use a deeply immersive dark mode entirely decoupled from pure blacks or generic grays.

### Base Ambience

- **Canvas Base**: `#02040a` (Vantablack / Deep Space Blue)
- **Glass Panel**: `rgba(255, 255, 255, 0.03)` with `backdrop-blur-xl`
- **Subtle Borders**: `rgba(255, 255, 255, 0.1)` fading to `0.05`.

### Dimension Color Coding (The Pulse)

- **Health**: `emerald-500` (Renewal, physical grounding)
- **Finance**: `blue-500` (Flow, stability)
- **Relationships**: `purple-500` (Connection, depth)
- **Spiritual**: `amber-500` (Meaning, inner fire)
- **Personal**: `rose-500` (Growth, passion)

## 3. Topography & Spatial Flow

Topography relates to the physical "elevation" (`z-index`) and scrolling layout of our elements.

- **Z-Index Standards**:
  - `z-0` Background Canvas & ambient blur gradients.
  - `z-10` Main scrolling components (Dashboards, forms).
  - `z-50` Action bars and Footer navigations.
  - `z-[100]` Modal overlays and Onboarding gates.
- **Bottom Bar Safe Areas**:
  - Web screens often chop the bottom `4rem` due to OS docks or browser footers.
  - _Rule_: Any floating bottom action bar must add `pb-safe` or equivalent bottom spacing, AND the main scrolling area above it MUST have a padding-bottom (`pb-32` or `pb-40`) that exceeds the height of the floating bar.
- **Max Widths**:
  - Reading content: `max-w-2xl`
  - Dashboard panels: `max-w-5xl`

## 4. Interactivity & "The Premium Feel"

Forms should not feel like forms. They should feel like a guided conversation.

- **Input Evolution**: Transition to heavy usage of 'Suggestion Chips' rather than standard text inputs where possible.
- **Micro-animations (Framer Motion)**:
  - Entering elements fade and slide up (`y: 20` to `y: 0`).
  - Interactive buttons hover smoothly (`scale-105`, `active:scale-95`).
- **Input Focus**: Deep glowing borders rather than sharp, standard blue browser outlines. Focus states must match the active `Dimension Color` being edited.
