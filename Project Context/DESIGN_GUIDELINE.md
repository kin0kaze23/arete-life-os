# DESIGN_GUIDELINE — Areté Life OS (AURA)

Version: v3.2  
Last updated: 2026-01-24  
Theme: Dark premium, neural cockpit, glass + glow  
Primary goal: **Clarity → Trust → Action**

---

## 0) Design North Star

### What the UI must deliver in ~10 seconds

1. Today’s mission focus (daily plan)
2. What’s at risk (Blindspot Radar)
3. What changed / what to do next

### Core feeling

- Premium, calm, and precise
- Dense but breathable
- High‑trust, no noise
- Tactical, not guilty

---

## 1) Visual language — “Neural cockpit”

**Aesthetic anchors**

- Dark void backgrounds + soft gradients (see `index.html` `.animate-flow`)
- Glass panels (`.glass-panel`) with subtle blur and low-contrast borders
- Large-radius bento cards (2–3rem) with minimal borders
- Ambient noise overlay + scanline for subtle texture

**Never**

- Flat, stark UIs
- Rainbow charts or loud color collisions
- Thin, fragile typography

---

## 2) Color system (design-tokens.ts)

**Base**

- Void: `#02040a`
- Deep: `#08090C`
- Elevated: `#0D1117`
- Border: `rgba(255,255,255,0.08)`

**Brand**

- Indigo (primary): `#6366f1`
- Rose (risk/danger): `#f43f5e`
- Emerald (success/health): `#10b981`
- Amber (warning/insight): `#f59e0b`
- Cyan (relationships): `#06b6d4`

**Domain mapping**

- Health → Emerald
- Finance → Amber
- Relationships → Cyan
- Spiritual → Indigo
- Risk/alerts → Rose

**Confidence badges**

- High: Emerald
- Medium: Amber
- Low: Rose/Slate

---

## 3) Typography

**Primary:** Inter  
**Mono:** JetBrains Mono (metrics + badges)

**Hierarchy**

- Hero titles: 36–64px, heavy weight, tight tracking, occasional italic
- Section titles: 12–16px, uppercase, tracking‑wide
- Micro-labels: 8–10px, uppercase, bold, high tracking
- Body: 12–14px, high contrast, calm tone

---

## 4) Layout & density

**Shell layout**

- Left vertical sidebar (navigation + member switch)
- Sticky top header (status + command palette)
- Main scroll surface
- Bottom Log Bar for capture

**Grid**

- Desktop: bento grid (12‑col)
- Mobile: single column with progressive disclosure

**Spacing**

- Use consistent spacing ramps: 4/8/12/16/24/32/40
- Large cards require internal padding ≥ 24px

---

## 5) Core components & patterns

**Foundational**

- `BentoCard` (glass panel, section header + icon)
- `VaultSection` (large panel with form inputs)
- `ClaimCard` (confidence + evidence + actions)
- `BlindSideRadarCard` (severity rail + actions)
- `Task` cards (methodology + DoD, expandable)
- `ProfileCompletionRing` (trust & coherence indicator)

**Key surfaces**

- **Verification Sheet** (dual column, approve/reject)
- **Command Palette** (Cmd/Ctrl+K)
- **Log Bar** (text + file attachments + command menu)
- **Voice Advisor** (live audio)
- **EmptyState** (encouraging, actionable)

**Interaction rule:** default compact, expand on demand.

---

## 6) Motion & feedback

**Use**

- Subtle pulse for “live” or “sync” states
- Slide-in + fade for modal/drawer entries
- Hover lifts on cards (very slight)

**Avoid**

- Long transitions
- Excessive bouncing or jitter

---

## 7) Trust & verification layer (non‑negotiable)

Every system output must show:

- Confidence badge
- Evidence link (when applicable)
- Timestamp
- Owner attribution (family space)

Verification flows:

- Proposed facts + profile updates always reviewed before commit
- Conflicts are explicit (no silent overrides)

---

## 8) Accessibility & performance

- Maintain 4.5:1 contrast on text
- Clear focus rings (indigo, 2px)
- Keyboard navigation for command palette and forms
- Avoid CLS; use skeletons where possible
- Keep animations GPU‑friendly (opacity/transform)

---

## 9) Microcopy & tone

- Tactical, calm, precise
- “Signal”, “Kernel”, “Mission”, “Sovereignty” lexicon is acceptable
- Avoid guilt or shame language
- Always offer a next action

---

## 10) Do / Don’t

**Do**

- Keep cards minimal; expand for details
- Use indigo for primary actions only
- Surface critical signals without shouting

**Don’t**

- Overuse charts on home
- Present AI output without confidence/evidence
- Expose raw JSON to users in core flows
