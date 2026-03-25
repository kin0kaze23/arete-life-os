# Agent Operating Manual (Portable)

> **Portable**: Copy this file to any project. Pair with `./.agent/README.md` for project‑specific context.

## Session Init (Fast)

1. Read `./.agent/README.md` for project context and commands.
2. Read `./.agent/CURRENT_STATUS.md` for last session state.
3. If resuming planned work, open the relevant file in `./.agent/plans/`.
4. Refresh the snapshot: `./scripts/update-status.sh` (if available).

## Automation Discovery (Repo-Agnostic)

When a task is requested, discover and prefer existing automations before manual steps:

1. Read `./.agent/README.md` for the automation index.
2. Scan `./.agent/workflows/` for relevant checklists.
3. Scan `./.agent/skills/` for task-specific procedures.
4. Check `./scripts/` for executable helpers (if present).

If a workflow or script fits the task, propose or run it explicitly (per user preference).

## Automation Decision Rules (Repo-Agnostic)

When applicable, use these default mappings (only if the script/workflow exists):

- UI/UX changes → run UI guardrails (prefer a single UI-safe wrapper if present).
- Core/AI/backend changes → run cost guardrail + architecture drift check.
- Performance/latency changes → check/update latency baseline.
- New AI generators → run the add-ai-generator workflow/checklist.
- End of session → update status and archive learnings if needed.

### Skill Gate (Mandatory Intelligence Checks)

Before executing any work phase, I MUST consult the relevant skill in `.agent/skills/`:

- **Design Phase** (UI/UX creation or modification):
  - Read `.agent/skills/visual-intelligence/SKILL.md`
  - Apply the Priority 1-3 checklists before delivering code.
  - Use semantic color naming and visual atoms from the skill.

- **Strategic Phase** (PRD evaluation, feature planning):
  - Read `.agent/skills/planning-intelligence/SKILL.md` (for creating plans)
  - Read `.agent/skills/product-intelligence/SKILL.md` (for evaluating features)
  - Validate against User Journey Sentiment and Strategic Alignment.
  - MUST perform context analysis (review codebase, identify risks, check learnings).

- **Verification Phase** (Testing, QA, code review):
  - Re-apply the checklists from the relevant skill.
  - Ensure all enforcement gates pass before marking work as "Done".

**This is non-negotiable.** Skills are my "Design Intelligence" and ensure consistency across the project.

## Working Protocol

### How to ask for work

Provide:

- Goal: what you want to achieve (feature, fix, deploy)
- Context: which screen or flow is affected
- Constraints: “minimal change”, “no refactor”, “keep UI the same”, etc.
- Evidence: exact error logs or screenshots

### What I do each iteration

- Summarize what changed and why
- Provide one verification command (from `./.agent/README.md`)
- Explain what success looks like

### Autopilot (when you say “do all the things”)

I will:

- Check `git status` and summarize changes
- Run the repo quality gate before any push
- Commit with a clear message (optional)
- Push to the default branch if checks pass

I will still ask for approval before:

- Infra changes (CI, deployment, hosting, env policy)
- Refactors or large structure changes
- Dependency upgrades

## Definition of Done

- UI has empty/loading/error states
- State updates are reactive; no manual refresh
- Edge cases considered
- `npm run typecheck` passes (NOT just build — Vite build skips type checking)
- `npm run lint` passes
- `npm run build` passes
- PR includes verification steps

## HARD RULES (Non-Negotiable — Read Before Every Task)

These rules exist because previous agent sessions violated them, producing 14 broken orphaned components and 35+ TypeScript errors. They are mandatory.

### Rule 1: Data Layer First

**BEFORE creating any UI component**, verify the data source exists:

- If the component needs `useAura().swot`, confirm `swot` is an actual exported property of useAura
- If the property doesn't exist, implement it in `useAura.ts` FIRST, then build the UI
- NEVER reference useAura properties that don't exist — this creates dead components

**Verification step**: Run `npm run typecheck` after creating the component. If it fails, the data source is missing.

### Rule 2: Integration Verification

**EVERY new component must be imported and rendered in its parent within the same task.**

- Creating `SWOTGrid.tsx` without importing it in `DashboardView.tsx` = INCOMPLETE task
- A component file that exists but is never rendered = dead code, not a feature
- After wiring, run the dev server and verify the component appears on screen

**Definition**: A component is "done" when it renders real data in the running app, not when the file exists.

### Rule 3: Typecheck Is The Gate (Not Build)

- Vite build succeeds even with TypeScript errors — it intentionally skips type checking
- `npm run typecheck` (`tsc --noEmit`) is the ONLY reliable type safety gate
- Run `npm run typecheck` after EVERY file creation or modification
- If typecheck fails, the task is NOT complete — fix the errors before moving on

### Rule 4: No Orphaned Components

- Every component MUST be reachable from `App.tsx` through the import chain
- Before marking a task done, trace: `App.tsx` → `DashboardView.tsx` → your component
- If the component isn't in this chain, it's dead code
- Add new components to the barrel export (`index.ts`) if they'll be imported elsewhere

### Rule 5: No Phantom Types

- NEVER import types that don't exist in `data/types.ts` (e.g., `AISuggestion`, `ConcernItem`, `Risk`, `Strength`, `LifeDimension`)
- If a component needs a new type, define it in `data/types.ts` FIRST
- Run `npm run typecheck` to verify the import resolves

### Rule 6: No Mock Data in Production Components

- Hardcoded mock data is NOT acceptable for shipped components
- If real data isn't available yet, show an empty state or "No data" message
- Mock data masks integration failures — the component looks "done" but isn't connected

### Rule 7: Documentation Budget

- Agent self-documentation (`.agent/` files) must not exceed 10% of total work per session
- Prioritize shipping working features over updating agent docs
- Status updates and learnings should be brief (< 5 minutes per session)

### Rule 8: Use Existing Data Before Inventing New Properties

- `useAura` already exposes: `insights`, `blindSpots`, `goals`, `dailyPlan`, `recommendations`, `memoryItems`, `claims`, `timelineEvents`
- Map new UI components to EXISTING data — don't invent new property names
- Example: SWOT "Risks" should use `blindSpots`, not a non-existent `swot.risks`

## Safety and Secrets

- Never paste real API keys into chat
- Keep `.env.local` and secret files untracked

## Git Automation Rules (Always Enforced)

### Pre‑push checklist (required)

- Run repo quality gate (`npm run doctor` if defined)
- Ensure Git status is clean

### Post‑push verification (required)

- Check CI for the latest default-branch run and confirm it is green
- If any failure is detected, fix it and re‑run CI

### Automation I will perform

- Commit changes with clear messages
- Push only after local checks pass
- Re‑run failed CI jobs and apply fixes until green

## Related Documentation

- `./.agent/README.md` — Project‑specific context, folder map, commands
- `./.agent/CURRENT_STATUS.md` — Current session snapshot
- `./.agent/LEARNINGS.md` — Session discoveries and fixes
- `./.agent/TROUBLESHOOTING.md` — Common issues and solutions
