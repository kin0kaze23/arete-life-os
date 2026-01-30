# Agent Workflow Optimization Plan

> **Goal**: Make the agent system portable, smarter, faster, and error-resistant so that dropping `.agent/AGENT.md` + a project `README.md` boots any session optimally.

---

## Executive Summary

This plan focuses on **portability, automation, and error‑reduction** by adding repeatable workflows, updating the portable agent manual, and introducing scripts that keep status and learnings current.

**Estimated effort:** ~2 hours

---

## Current State Evaluation (2026-01-29)

### ✅ What’s Working Well

| Component                     | Status    | Notes                                                 |
| ----------------------------- | --------- | ----------------------------------------------------- |
| `./.agent/README.md`          | Good      | Comprehensive project context (389 lines)             |
| `./.agent/LEARNINGS.md`       | Valuable  | 571 lines of accumulated knowledge                    |
| `./scripts/doctor.sh`         | Essential | Quality gate script                                   |
| `./scripts/setup-hooks.sh`    | Useful    | Installs pre-push check                               |
| `./.agent/skills/`            | Useful    | 3 skills (debugging, component analysis, prompt flow) |
| `./.agent/TROUBLESHOOTING.md` | Helpful   | Common issues documented                              |

### ❌ Issues Found

| Issue                               | Impact                                   | Severity |
| ----------------------------------- | ---------------------------------------- | -------- |
| **1. No workflows folder**          | No reusable start/end/pre‑push templates | Medium   |
| **2. AGENT.md is project‑specific** | Not portable across repos                | High     |
| **3. CURRENT_STATUS.md is manual**  | Gets stale quickly                       | Medium   |
| **4. No session handoff script**    | Each session starts cold                 | High     |
| **5. LEARNINGS.md is long**         | Hard to scan; needs archiving            | Medium   |
| **6. No archive folder**            | No structured retention                  | Low      |
| **7. No portability kit**           | Hard to initialize agent in new repo     | Medium   |

> Note: `.claude/plans/` does not exist in this repo; plan consolidation is already done in `./.agent/plans/`.

---

## Target Structure

```
.agent/
├── AGENT.md              # [PORTABLE] Operating manual (project‑agnostic)
├── README.md             # [PROJECT‑SPECIFIC] Context, folder map, architecture
├── CURRENT_STATUS.md     # [AUTO‑UPDATED] Session state (branch, last actions)
├── LEARNINGS.md          # Session discoveries (quarterly archive)
├── LEARNINGS_QUICKREF.md # [NEW] Short, curated highlights
├── TROUBLESHOOTING.md    # Common issues & solutions
│
├── workflows/            # [NEW] Repeatable workflows
│   ├── start-session.md
│   ├── end-session.md
│   ├── pre-push.md
│   └── add-ai-generator.md
│
├── plans/                # All plans consolidated here
│   └── ...
│
└── archive/              # [NEW] Old learnings, completed plans
    └── learnings-2026-q1.md

scripts/
├── update-status.sh      # [NEW] Auto update CURRENT_STATUS.md
└── archive-learnings.sh  # [NEW] Archive old learnings + refresh quickref
```

---

## Proposed Changes

### Phase 1: Create Workflows (Automation)

Create `./.agent/workflows/` with the following templates:

- `start-session.md`
- `end-session.md` (no auto‑commit by default)
- `pre-push.md`
- `add-ai-generator.md`

### Phase 2: Make AGENT.md Portable

Refactor `./.agent/AGENT.md` to be **project‑agnostic**:

**Remove:**

- Project mission statements
- Product architecture/core loop descriptions
- Provider‑specific env var lists and model names

**Keep:**

- Session init protocol
- Working protocol & input format
- Guardrails & definition of done
- Git automation rules

**Add:**

- Portability header and explicit pointer to `./.agent/README.md`

### Phase 3: Auto‑Update CURRENT_STATUS.md

Add `./scripts/update-status.sh` that:

- Captures branch, last commit, and uncommitted count
- Preserves “Recent Actions” and “Next Steps” sections if present
- Writes a fresh timestamp

### Phase 4: Learnings Archival + Quickref

Add:

- `./.agent/archive/` directory
- `./scripts/archive-learnings.sh` that:
  - Archives entries older than 90 days **only when** `LEARNINGS.md` > 600 lines
  - Keeps the most recent 30 entries in `LEARNINGS.md`
  - Regenerates `LEARNINGS_QUICKREF.md` (top 10–20 bullet learnings)

### Phase 5: Update README Index

Add a short section in `./.agent/README.md` listing:

- Workflows
- Status/update scripts
- Learnings archive + quickref

---

## Implementation Order

| Phase | Task                                | Files                            | Priority |
| ----- | ----------------------------------- | -------------------------------- | -------- |
| 1.1   | Create workflows folder + templates | `./.agent/workflows/*`           | High     |
| 2.1   | Refactor AGENT.md for portability   | `./.agent/AGENT.md`              | High     |
| 3.1   | Create status update script         | `./scripts/update-status.sh`     | Medium   |
| 4.1   | Create archive folder               | `./.agent/archive/`              | Low      |
| 4.2   | Create learnings archive script     | `./scripts/archive-learnings.sh` | Medium   |
| 4.3   | Create LEARNINGS_QUICKREF.md        | `./.agent/LEARNINGS_QUICKREF.md` | Medium   |
| 5.1   | Update agent README index           | `./.agent/README.md`             | Low      |

---

## Verification

```bash
./scripts/update-status.sh
./scripts/archive-learnings.sh
ls .agent/workflows
ls .agent/archive
cat .agent/LEARNINGS_QUICKREF.md
```

---

## Risks & Mitigations

| Risk                                       | Impact | Mitigation                                            |
| ------------------------------------------ | ------ | ----------------------------------------------------- |
| Overwriting CURRENT_STATUS.md manual notes | Medium | Preserve “Recent Actions” & “Next Steps” blocks       |
| Losing learning history                    | High   | Archive to dated files before trimming                |
| Portability breaks local context           | Medium | Keep all project specifics in README + CURRENT_STATUS |
