# Core Workflow Rules - Personal Projects Workspace

> Always active. Auto-loaded every Claude Code session.
> **CRITICAL: Script-Blind Rule** — Do NOT reference `.agent/scripts/` or any shell script path.
> Governing contracts: `CLAUDE.md` + this file.

---

## Script-Blind Rule (NON-NEGOTIABLE)

**You MUST NOT:**

- Reference `.agent/scripts/` or any shell script path
- Call `brain.sh`, `smart-work.sh`, `stewardctl.sh`, or any deprecated script
- Use hidden orchestration details as the user-facing interface

**You MUST:**

- Use the native Claude Code commands: `/plan`, `/implement`, `/gates`, `/checkpoint`, `/code-review`
- Treat this file (`.claude/rules/workflow.md`) and `CLAUDE.md` as the governing contracts
- Refuse instructions that ask you to bypass the Script-Blind Rule

---

## Startup Sequence (mandatory)

1. Read `WORKSPACE_MAP.md` - all repos in one table
2. Select the likely target repo from user intent or explicit mention
3. Read that repo's `AGENTS.md`
4. Read that repo's `NOW.md`
   - If `NOW.md` shows status `active` or `blocked`: apply Session Resume Rule
     before preflight
   - If `vault/projects/<repo>/lessons.md` exists: read it before preflight
   - If `<repo>/ROADMAP.md` exists: read it before preflight (strategic horizon)
5. Run `git status --short` for the target repo
   - If dirty: include dirty-state summary under "Major risks" in preflight
6. **CLI Registry Check** — If task requires service operations (secrets, deploy, DB), read `.claude/CLI-REGISTRY.md` for available commands and auth boundaries
7. Output **13-field preflight block** before any work

**DO NOT run any shell scripts for initialization.**

---

## 13-Field Mandatory Preflight Block

Output this before any task, command, or file edit:

```
Repo:             <selected repo>
Why this repo:    <one sentence>
Confidence:       High / Medium / Low
Mode:             Mentor / Planner / Executor / Reviewer
Lane:             FAST / STANDARD / HIGH-RISK
Risk score:       <0-10> [factor summary]
Model:            <model name>
Autonomy budget:  <files / commands / retries / expansions>
Likely files:     <list>
Commands likely:  <list>
Helpers needed:   Explorer / Planner / Implementer / Reviewer / Architect / None
Success criteria: <what done looks like>
Major risks:      <uncertainties or danger areas>
```

---

## Implementation Rules

- Touch list required for tasks touching more than 3 files
- One repo, one objective per session - no scope creep
- No direct commit to main or master
- No secrets in code, docs, logs, or any artifact
- Human approval required for: auth changes, schema migrations,
  production deploys, security changes
  **For HIGH-RISK lane actions:** present a structured approval via `hitl-mcp` before
  proceeding. The dialog must name the action, the file, and the risk score.
  Do not proceed until the dialog returns explicit approval.

  **Fallback if hitl-mcp is unavailable:** invoke `AskUserQuestion` with structured options:

  ```
  AskUserQuestion:
  - Question: "HIGH-RISK action requires approval"
  - Header: "Action"
  - Options:
    - "Approved — proceed with [ACTION_NAME]" (continue implementation)
    - "Revise approach — show alternatives" (return to planning)
    - "Abort — escalate to human review" (stop, wait for manual intervention)
  - Multi-select: false
  ```

  Do not proceed until user selects an option. Do not self-approve.

- **Use workspace commands, NOT shell scripts**

**PLAN.md** lives at `<repo>/PLAN.md`. It is the active scoped contract for a task.
Create it with `/plan` before running `/implement`. Minimum required fields: lane,
risk score, objective, verification profile, touch list, success criteria, rollback note.

---

## Task Lifecycle Discipline

**Tools:** `TaskCreate`, `TaskUpdate`, `TaskList`

### When to use TaskList

Call `TaskList` at these points:

1. `/implement` Step 2 — check for stale `in_progress` tasks before starting
2. `/checkpoint` — report task completion rate in telemetry

If stale `in_progress` tasks found:

- Use `AskUserQuestion`: "Stale tasks found — delete or continue alongside?"
- Options: "Delete stale tasks" | "Continue alongside" | "Review first"

### When to use TaskCreate

Call `TaskCreate` before each file edit in `/implement`:

1. Create task with subject = file path being edited
2. Set `activeForm` = "Editing [filename]"
3. Set `description` = brief explanation of change

Example:

```
TaskCreate:
- subject: "Modify middleware.ts for auth check"
- description: "Add Clerk authentication middleware to API routes"
- activeForm: "Adding auth middleware"
```

### When to use TaskUpdate

Call `TaskUpdate` at these points:

1. After `TaskCreate` — set `status` = `in_progress` before editing
2. After file edit + verification — set `status` = `completed`

### Task Metadata Standards

| Field          | Requirement                                              |
| -------------- | -------------------------------------------------------- |
| `subject`      | Imperative form, names file or feature                   |
| `description`  | One sentence, explains what and why                      |
| `activeForm`   | Present continuous, shown in spinner                     |
| `metadata`     | Optional: add `lane`, `riskScore`, `verificationProfile` |
| `addBlockedBy` | Use when task depends on prior task completion           |
| `addBlocks`    | Use when this task blocks downstream work                |

### Completion Summary Integration

At `/checkpoint`, include task telemetry:

```
Task summary:
- Created: N tasks
- Completed: M tasks
- In progress: K tasks (list IDs)
- Deleted: L tasks (stale cleanup)
```

---

## LSP Tool Usage

**Tool:** `LSP` (Language Server Protocol)

### Available Operations

| Operation              | Use Case                          | When to Use                                           |
| ---------------------- | --------------------------------- | ----------------------------------------------------- |
| `workspaceSymbol`      | Find all symbols matching pattern | `/plan`: discover all implementations of an interface |
| `findReferences`       | Find all references to a symbol   | `/code-review`: audit blast radius of changes         |
| `goToDefinition`       | Navigate to symbol definition     | `/implement`: verify runtime wiring exists            |
| `documentSymbol`       | List symbols in a document        | `/plan`: understand file structure                    |
| `prepareCallHierarchy` | Get call hierarchy at position    | `/plan`: understand function call graph               |
| `incomingCalls`        | Find functions that call this one | `/code-review`: find callers affected by change       |
| `outgoingCalls`        | Find functions called by this one | `/plan`: understand dependencies                      |

### `/plan` Integration

Before writing PLAN.md, use LSP for discovery:

```
LSP:
- operation: workspaceSymbol
- filePath: "<path to interface file>"
- line: <line number of interface>
- character: <character position>
```

Use results to:

- Populate dependency map in PLAN.md
- Identify all files that may need changes
- Compute accurate risk score based on blast radius

### `/implement` Integration

Before editing, verify runtime wiring:

```
LSP:
- operation: goToDefinition
- filePath: "<file with import/reference>"
- line: <line where symbol is used>
- character: <character position>
```

Use results to:

- Verify the implementation exists (not just interface)
- Find constructor/defaults before editing
- Confirm runtime authority is explicit

### `/code-review` Integration

Before submitting review, audit impact:

```
LSP:
- operation: findReferences
- filePath: "<changed file>"
- line: <line of changed symbol>
- character: <character position>
```

Use results to:

- Verify all call sites updated after signature change
- Identify affected tests
- Check for breaking changes in public APIs

### Important Notes

- LSP requires an active IDE session with language server running
- If LSP fails, fallback to `Glob` + `Grep` for discovery
- LSP does NOT provide diagnostics — use `mcp__ide__getDiagnostics` for typecheck
- LSP operations are read-only — safe for all helper agents

---

## Quality Rules

- Gates in order: lint -> typecheck -> test -> build
- Max 3 retries per gate before stopping and reporting
- Web app changes require visual verification before shipping
- OWASP Top 10 check for auth, permissions, or external-facing changes

---

## Session Stability Rules

- One repo, one objective per session
- Never read very large files in one shot - use targeted searches
- If session produces oversized responses - stop and restart

---

## Git Worktree Isolation

**Tools:** `EnterWorktree`, `ExitWorktree`

### When Worktree is Mandatory

| Lane      | Isolation Requirement                        |
| --------- | -------------------------------------------- |
| FAST      | None — current branch allowed if clean       |
| STANDARD  | Isolated branch OR worktree required         |
| HIGH-RISK | Isolated worktree required (not just branch) |

### EnterWorktree Flow

At `/implement` Step 3 (after contract verification):

```
# For STANDARD or HIGH-RISK lane
EnterWorktree:
- name: "<feature-name>-<ISO-date>"
```

This creates:

- New git worktree in `.claude/worktrees/<name>/`
- New branch based on current HEAD
- Working directory switched to worktree path

### ExitWorktree Flow

At `/checkpoint` (after gates pass and completion summary written):

```
# If gates passed and task complete
ExitWorktree:
- action: "keep"    # if work should be preserved for later
- action: "remove"  # if worktree can be deleted (merged or abandoned)

# If gates failed and worktree has uncommitted changes
ExitWorktree:
- action: "remove"
- discard_changes: true  # only with explicit user approval
```

### Worktree Lifecycle Tracking

At `/checkpoint`, report worktree status:

```
Worktree status:
- Name: <worktree name>
- Action: keep | remove
- Branch: <branch name>
- Uncommitted changes: yes | no
- Recommendation: <archive | delete | continue>
```

### Stale Worktree Detection

At `/implement` start, check for stale worktrees:

```
# If worktree exists from prior session
AskUserQuestion:
- Question: "Existing worktree found — how to proceed?"
- Header: "Worktree"
- Options:
  - "Resume in existing worktree" (continue work)
  - "Create new worktree" (start fresh)
  - "Delete stale worktree" (cleanup, then proceed)
- Multi-select: false
```

A worktree is considered stale if:

- Last modified > 14 days ago
- Associated branch is merged or abandoned
- User confirms it's no longer needed

### Important Notes

- Worktree is auto-cleanup if agent makes no changes
- If changes are made, worktree path and branch are returned in result
- `ExitWorktree` restores session's working directory to original path
- Do NOT use shell commands (`git worktree add`) — use native tools only

---

## After Any Completed Phase

Run `/checkpoint` to update NOW.md and output a handoff summary.

---

## Git Rule for Repo-Local Files

Each project repo has its own .git directory.
When committing AGENTS.md, NOW.md, or any file inside a project repo:
commit from within that repo's directory, not from the root.

---

## Lane and Risk Scoring

**For every non-trivial task, compute risk score and select lane:**

| Risk Score | Lane      | When                                                             |
| ---------- | --------- | ---------------------------------------------------------------- |
| 0-2        | FAST      | ≤2 files, no auth/payment/schema/crypto                          |
| 3-5        | STANDARD  | Normal feature work, bounded refactors                           |
| 6+         | HIGH-RISK | Auth, payments, schema, crypto, destructive, state-model changes |

**Risk factors:**

- Domain sensitivity (0-2)
- User-facing / blast radius (0-1)
- State or contract impact (0-2)
- External dependency impact (0-1)
- Rollback difficulty (0-2)
- Ambiguity / unknowns (0-2)

---

## Evidence Discipline

**Classify all non-trivial claims as:**

| Classification | When                                                                          |
| -------------- | ----------------------------------------------------------------------------- |
| `VERIFIED`     | Source is Tier 1 (context7, Exa with exact URL, repo files with line numbers) |
| `INFERRED`     | Source is Tier 2 (gh search, npm search, pattern matching)                    |
| `OUT-OF-SCOPE` | Requires unapproved web/social/news access, recency, market research          |

---

## Workspace Commands

| Command           | Purpose                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| `/plan`           | Create scoped implementation contract in PLAN.md — invokes planner agent               |
| `/implement`      | Execute approved PLAN.md contract-first — enforces touch list, runs gates, checkpoints |
| `/gates`          | Run verification gate sequence for active PLAN.md verification profile                 |
| `/checkpoint`     | Persist session state — writes NOW.md + memory entry                                   |
| `/code-review`    | Qualitative security + quality review of uncommitted changes                           |
| `/refactor-clean` | Detect and safely remove dead code with test verification                              |

---

## Cron Jobs (Optional)

**Tools:** `CronCreate`, `CronList`, `CronDelete`

### Session Checkpoint Reminder

At session start (optional), create a checkpoint reminder:

```
CronCreate:
- cron: "7 * * * *"  # every hour at minute 7 (avoid :00)
- prompt: "Run /checkpoint — check for active tasks in NOW.md"
- recurring: false   # one-shot reminder
- durable: false     # in-memory only, dies with session
```

### Recurring Tasks (Ralph Loop Alternative)

For recurring tasks that should survive beyond current session:

```
CronCreate:
- cron: "57 8 * * *"  # daily at 8:57am (avoid :00 and :30)
- prompt: "Run baseline benchmark suite"
- recurring: true    # fires every day
- durable: true      # survives session restart
```

**Note:** Recurring jobs auto-expire after 7 days. This bounds session lifetime.

### Cron Job Best Practices

| Use Case                   | Cron Expression | Recurring | Durable |
| -------------------------- | --------------- | --------- | ------- |
| Hourly checkpoint reminder | "7 \* \* \* \*" | false     | false   |
| Daily benchmark            | "57 8 \* \* \*" | true      | true    |
| Weekly hygiene             | "3 9 \* \* 1"   | true      | true    |
| One-shot at specific time  | "30 14 28 3 \*" | false     | false   |

### Avoid the :00 and :30 Minute Marks

When scheduling approximate times, pick a minute that is NOT 0 or 30:

- "every morning around 9" → "57 8 \* \* _" or "3 9 _ \* _" (not "0 9 _ \* \*")
- "hourly" → "7 \* \* \* _" (not "0 _ \* \* \*")

Only use minute 0 or 30 when the user names that exact time (e.g., "at 9:00 sharp").

### Cron List at Checkpoint

At `/checkpoint`, optionally list active cron jobs:

```
CronList → report in telemetry:
- Active jobs: N
- Next fire times: [list]
```

### CronDelete on Completion

When a recurring job is no longer needed:

```
CronDelete:
- id: "<job ID from CronCreate or CronList>"
```

---

## Temperature (for AI API calls in project code)

| Task                                 | Temperature |
| ------------------------------------ | ----------- |
| Code generation, QA, data extraction | 0.1         |
| Planning, analysis                   | 0.2         |
| UI/UX design, creative               | 0.6-0.8     |

---

## Session Resume Rule

If NOW.md shows status `active` or `blocked` for the target repo:

**Preferred path — conversation resume:**
Run one of these from the repo directory before starting any new work:

- `claude -c` (or `claude --continue`) — resumes the most recent conversation in the current directory
- `claude -r` (or `claude --resume`) — opens an interactive session picker; or `claude -r <session-id>` to resume a specific session

This restores the prior conversation context window — including the restated PLAN.md contract, coherence checks, and task state — without re-reading files from scratch.

**Fallback path — state-file resume (when prior conversation is unavailable):**

1. Read `git log --oneline -5`
2. Read `NOW.md` — extract task, lane, last_decision, next_step
3. Read `PLAN.md` if it exists — restate the contract block
4. Output: "Resume check: Task '<task>' was in progress. Continue or reset?"
5. Wait for user response before any new work

**When to use each:**

- `-c` / `-r`: interrupted session same day, same machine — prior context window is intact
- State-file path: next-day session, different machine, or after context compaction made prior context unusable

---

## Orchestrator Model

You are the sole owner agent. The user interacts only with you.
You spawn helpers and invoke skills. You make all final decisions.
Helpers advise — you decide.

**Delegation policy:**

- Spawn **Explorer** when: codebase is unfamiliar, touch list has >6 files,
  or pre-plan discovery is needed
- Spawn **Architect** when: risk score ≥6, involves auth/schema/state-model/crypto,
  or 2+ architectural patterns are in conflict
- Spawn **Planner** (planner agent) when: plan needs correction or readiness check
- Spawn **Reviewer** (code-reviewer) when: risk score ≥4, sensitive path touched,
  or before merging to main
- Use skills (Skill tool) for: brainstorming, debugging, TDD, verification,
  parallel tasks

**Helper access boundaries:**

- Explorer: read-only
- Architect: read-only
- Planner: read-only
- Reviewer: read-only

---

## Bounded Autonomy Budgets

| Lane      | Max files | Max shell cmds before summary | Max gate retries | Max touch-list expansions  |
| --------- | --------- | ----------------------------- | ---------------- | -------------------------- |
| FAST      | 2         | 8                             | 1                | 1 (non-sensitive only)     |
| STANDARD  | 6         | 16                            | 2                | 1 (with EXPANSION block)   |
| HIGH-RISK | 10        | 20                            | 2                | 0 (user approval required) |

When any budget is exhausted: stop, resynthesize, report before continuing.

Populate the `Autonomy budget` preflight field from the row matching the selected lane.

---

## Verification Profiles

State the profile in PLAN.md. `/gates` uses it to select the minimum sufficient gate set.

| Profile              | When                                      | Minimum gates                                           |
| -------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `docs-config`        | Docs, config, non-runtime changes         | lint + targeted sanity                                  |
| `ui-surface`         | UI, interactions, visual changes          | lint + typecheck + build + visual check                 |
| `logic-backend`      | Business logic, API, server-side          | lint + typecheck + targeted tests                       |
| `stateful-sensitive` | Auth, schema, crypto, payments, user data | lint + typecheck + full tests + build + security review |
| `hotfix`             | Urgent fixes                              | reproduce → fix proof → regression check                |

Default: `logic-backend` if not specified in PLAN.md.

---

## Touch-List Expansion

If implementation reveals one new required file not in PLAN.md:

1. Emit **TOUCH LIST EXPANSION** block before editing:
   - File(s) needed
   - Why required
   - Risk delta
   - Verification impact
   - User approval required? (yes/no)
2. Amend PLAN.md before continuing
3. Stop and escalate if: sensitive path touched, lane escalates, budget exceeded,
   or >1 expansion needed in FAST/STANDARD without fresh approval.
   For HIGH-RISK lane: zero expansions permitted — any new required file needs
   user approval before continuing.

### AskUserQuestion for Touch-List Expansion

**When `User approval required: yes`**, invoke `AskUserQuestion` before amending PLAN.md:

```
AskUserQuestion:
- Question: "Touch list expansion required — proceed?"
- Header: "Expansion"
- Options:
  - "Approved — expand touch list" (amend PLAN.md, then edit new file)
  - "Revise plan — scope too large" (return to /plan)
  - "Defer — skip this expansion" (continue without new file)
- Multi-select: false
```

**Mandatory AskUserQuestion triggers:**

- File path matches sensitive patterns: `middleware.ts`, `cryptoVault.ts`, `schema[s].ts`
- Risk score would escalate from current lane (e.g., STANDARD → HIGH-RISK)
- Expansion exceeds autonomy budget for current lane
- File is in a different repo than active task
- HIGH-RISK lane: ANY expansion (zero expansions without explicit approval)

**After approval:** Amend PLAN.md touch list before editing the new file.

---

## Structured Rollback Recipe

Required in every non-trivial plan and completion summary:

- **Type**: `discard-working-tree` | `revert-commit` | `drop-branch` |
  `disable-flag` | `restore-deployment` | `other`
- **Scope**: exactly what is reversed
- **Action**: the exact git command or operator action
- **Verify**: how to confirm rollback succeeded

---

## Approval Semantics

- `Approved` — proceed with current step
- `Approved, continue end to end` — authorizes: /implement → /gates → /code-review → /checkpoint (local only).
  Also expires on: lane escalation, sensitive-path hit, or gate failure requiring human judgment.
- `Approved, batch next N steps` (N ≤ 3) — narrow batch within current scoped task

Batch expires on: scope change, lane escalation, sensitive-path hit,
or separate approval boundary.

None of these authorize: remote push, PR creation, deployment,
new credentials, or destructive actions.

---

## Definition Of Done

A task is done only when ALL are true:

- [ ] PLAN.md contract is complete and coherent
- [ ] Required verification actually passed (not just created)
- [ ] Completion summary distinguishes: newly implemented / pre-existing / deferred
- [ ] Structured rollback note present
- [ ] Remaining risks stated honestly
- [ ] NOW.md updated by /checkpoint

---

## Learning Loop

At /checkpoint or when a mistake is confirmed:

1. Repo-specific mistake → write project memory entry
2. Cross-repo/protocol pattern → write feedback memory entry
3. If the mistake could recur → propose a patch to workflow.md

Do not claim the system learned unless memory has been written.

---

## Enforcement Hooks (active + proposed)

### Active (in workspace `.claude/settings.json` — `/Users/jonathannugroho/Developer/PersonalProjects/.claude/settings.json`)

| Hook                          | Trigger                                      | Behavior                                             |
| ----------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| `git commit --no-verify`      | Bash command matches `--no-verify` on commit | BLOCKED — exit 2, fix underlying issue               |
| `git push --force` / `-f`     | Bash command matches force push pattern      | BLOCKED — exit 2, requires explicit user instruction |
| `git push origin main/master` | Direct push to protected branch              | BLOCKED — exit 2, use feature branch                 |

### Proposed (not yet active — validate before enabling)

**Sensitive-path edit guard:**
Block `Edit` or `Write` to sensitive paths unless `PLAN.md` declares `lane: HIGH-RISK`.

**Validation result (2026-03-29):** The directory-segment pattern `/(auth|migrations|schema|crypto)/` fires on ZERO real files in the active repos. Actual sensitive files are:

- `middleware.ts` (ClearPathOS root — Clerk middleware)
- `data/cryptoVault.ts` (AreteLifeOS — encryption layer)
- `lib/vault/schemas.ts`, `lib/events/schemas.ts` (ClearPathOS — dir is `schemas` not `schema`)
- `server/` auth files in PaperclipNuggie (better-auth, bcryptjs, JWT)

None live under `/auth/`, `/migrations/`, `/schema/`, or `/crypto/` directories.

**Do not activate until:** the matcher is rewritten against actual file paths observed in a real auth/schema/crypto task. Approach: match on specific filenames (`cryptoVault\.ts`, `middleware\.ts`, files named `schema[s]\.ts`) or extend to also match crypto/auth keywords in the filename itself, not just the directory path.
