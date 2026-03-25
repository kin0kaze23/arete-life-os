# Areté Life OS — Agent Instructions

## Stack
- React 19 + TypeScript, Vite, Tailwind CSS, Vercel serverless
- AI: Model router (`api/modelRouter.ts`) with provider abstraction (OpenAI primary, xAI fallback)
- Client: `ai/aiService.ts` → `/api/ai` endpoint

## Build & Test
- `npx vite build` — must pass before shipping
- `npx playwright test` — e2e tests

## UI/UX Design Rules

**When creating, modifying, or reviewing any UI component:**

Load and apply the design skill stack from the workspace `.agent/skills/` directory:

1. **Design decisions** → `../../.agent/skills/ui-ux-pro-max.md`
2. **Implementation constraints** → `../../.agent/skills/baseline-ui.md`
3. **Accessibility compliance** → `../../.agent/skills/fixing-accessibility.md`
4. **Final QA** → `../../.agent/skills/rams-design-review.md`

Master router: `../../.agent/skills/design-system.md`

### Quick Rules (Always Apply)
- Tailwind CSS only — no custom hex values, use project tokens
- `text-balance` on headings, `text-pretty` on body, `tabular-nums` on data
- 4.5:1 contrast minimum, 44x44px touch targets, focus-visible states
- Compositor-only animation (transform + opacity), max 200ms for interaction feedback
- `prefers-reduced-motion` respected on all animations
- No emojis as UI icons — use Lucide icons
- One accent color per view, Tailwind shadow scale only
- `h-dvh` not `h-screen`, consistent z-index scale (10, 20, 30, 40, 50)
- Responsive at 375px, 768px, 1024px, 1440px
- All interactive elements need `cursor-pointer` + keyboard support
- Icon-only buttons must have `aria-label`
