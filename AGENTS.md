# Agent Instructions — AreteLifeOS

> **Universal AI Agent Configuration**
> This file is read by all AI agents (Google Antigravity IDE, Claude Code, etc.)
> Last updated: 2026-04-02

---

## Project Identity

**AreteLifeOS** is a premium life operating system — an AI-powered personal productivity platform for iOS.

**Core Philosophy:**

- Premium, calming aesthetic (not generic AI)
- Privacy-first with local-first storage
- AI that feels like a thoughtful human, not a robot
- Mobile-first (iOS via Capacitor)

---

## Agent Roles

### Google Antigravity IDE — Design & Prototyping

**When to use:** Visual design, UI exploration, component prototyping, real-time preview

**Capabilities:**

- Visual design iteration (glassmorphism, animations, typography)
- Component-level prototyping with live preview
- Micro-interaction design
- Rapid UI experimentation

**Reads:** This file, `NOW.md`, design docs in `docs/design/`

**Writes to:** `docs/design/YYYY-MM-DD-<topic>-spec.md` (design specifications)

**Does NOT:**

- Commit to git
- Run production deployments
- Modify contract files (NOW.md, PLAN.md, GATES.md)

---

### Claude Code — Implementation & Verification

**When to use:** Feature implementation, refactoring, debugging, code review, commits

**Capabilities:**

- Multi-file coordinated changes
- Verification gates (lint → typecheck → test → build)
- Git operations with proper branching
- Session state tracking (NOW.md, memory)
- Security and quality review

**Reads:** This file, `CLAUDE.md`, `.claude/rules/workflow.md`, `NOW.md`, `PLAN.md`

**Writes to:** Source files, contract files, git commits

**Does NOT:**

- Deploy without verification gates passing
- Commit directly to main
- Skip preflight planning

---

## Handoff Protocol: Antigravity IDE → Claude Code

### Step 1: Design in Antigravity IDE

```
Antigravity IDE session:
1. Explore visual options (glassmorphism, animations, etc.)
2. Prototype components with live preview
3. Write design spec to: docs/design/YYYY-MM-DD-<topic>-spec.md
4. Note files that need changes
```

### Step 2: Implementation in Claude Code

```
Claude Code session:
1. Read design spec from docs/design/
2. /plan → Creates PLAN.md with touch list, risk, gates
3. /implement → Edits files, runs verification
4. /gates → Runs lint → typecheck → test → build
5. /checkpoint → Updates NOW.md, writes memory
6. Commit with proper message
```

### Step 3: Review Loop

```
1. Preview changes in Antigravity IDE
2. Request tweaks if needed
3. Claude Code implements tweaks + re-runs gates
4. Repeat until done
```

---

## Non-negotiables

1. **Never commit `.env`, `.env.local`, `.env.*`, or `.vercel/project.json`**
2. **Never deploy production from a dirty local working tree**
3. **Treat GitHub as the source of truth for production**
4. **Use a feature branch for all work** — Validate on Vercel preview before merge
5. **Honor `.nvmrc`** — Switch to Node 20 before running npm, Vite, or test commands
6. **Run `npm run doctor` before handoff, PR, or release**
7. **Canonical local path:** `/Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS`

---

## Daily Workflow

1. Sync from `main`
2. Run `nvm use 20`
3. Run `npm run setup:hooks` once per clone/worktree
4. Create a feature branch
5. Design in Antigravity IDE (if UI work) → write spec to `docs/design/`
6. Implement with Claude Code → follows `/plan` → `/implement` → `/gates`
7. Run `npm run doctor`
8. Open a PR
9. Verify Vercel preview deployment
10. Merge to `main` after review and QA

---

## Commands

```bash
# Setup
nvm use 20
npm install
npm run setup:hooks

# Development
npm run dev

# Quality gates
npm run doctor           # Pre-commit validation
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run test             # Unit tests
npm run test:e2e         # E2E tests (Playwright)

# Build
npm run build            # Production build
npm run preview          # Preview build
vercel link
```

---

## Contract Files

| File                              | Purpose                                  | Updated By                  |
| --------------------------------- | ---------------------------------------- | --------------------------- |
| `NOW.md`                          | Current task status, session state       | Claude Code (`/checkpoint`) |
| `PLAN.md`                         | Implementation contract for current task | Claude Code (`/plan`)       |
| `GATES.md`                        | Quality gate definitions                 | Humans (rarely)             |
| `docs/design/*.md`                | Design specifications                    | Antigravity IDE             |
| `vault/projects/AreteLifeOS/*.md` | Project memory, decisions, lessons       | Claude Code                 |

---

## Design System Location

- **Design specs:** `docs/design/YYYY-MM-DD-<topic>-spec.md`
- **Design tokens:** `src/design-system/tokens.ts` (or equivalent)
- **Component library:** `src/components/`

---

## Release Rule

- Only `main` should move production forward
- If a preview deployment is fully verified, it can be promoted to production in Vercel
- Roll back by redeploying a known-good Vercel deployment or reverting the Git commit on `main`

---

## Known Paths

| Purpose                  | Path                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| Canonical repo           | `/Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS`         |
| Sandbox clone            | `/Users/jonathannugroho/Developer/PersonalProjects/AreteLifeOS-sandbox` |
| Stale clone (DO NOT USE) | `/Users/jonathannugroho/Documents/Personal Projects/AreteLifeOS`        |

---

## Related

- `CLAUDE.md` — Claude Code specific configuration
- `.claude/rules/workflow.md` — Detailed workflow rules for Claude Code
- `docs/DEVELOPMENT.md` — Development setup guide
- `docs/DEPLOYMENT.md` — Deployment guide
- `GATES.md` — Quality gate definitions
