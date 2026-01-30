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
- Lint/typecheck/build pass
- PR includes verification steps

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
