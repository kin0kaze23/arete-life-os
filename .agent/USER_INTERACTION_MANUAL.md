# User Interaction Manual

> Purpose: Help you work with Codex efficiently and predictably on any repo.

---

## 1) Quick Start (Best Results)

When you request work, include:

- Goal: the exact outcome you want
- Scope: files/areas affected (or “unknown”)
- Constraints: “minimal change”, “no refactor”, “UI unchanged”, “no new deps”
- Verification: preferred command(s) or “none”
- Evidence: errors/logs/screenshots if something is broken
- Priority: “ship now” vs “safe & clean”

Example:

```
Goal: fix failing e2e test for core loop
Scope: e2e/core-loop.spec.ts + related UI
Constraints: minimal change, no new deps
Verification: npm run test:e2e
Evidence: attach test-results/.last-run.json
Priority: ship now
```

---

## 2) How I Will Respond (Default Behavior)

- I’ll summarize changes and why they were made
- I’ll give one verification command (prefer repo standard)
- I’ll explain what success looks like
- I’ll ask before infra changes, refactors, or dependency upgrades

### Automation Decision Rules I’ll Apply

If the repo provides the scripts/workflows, I will automatically propose (or run, if you ask) the most relevant ones:

- UI/UX changes → UI-safe checks (guardrail + doctor + smoke + baseline if available)
- Core/AI/backend changes → cost guardrail + architecture drift check
- Performance/latency changes → latency baseline update/check
- New AI generators → add-ai-generator checklist
- Session end → update status + archive learnings if needed

---

## 2.5) Explicit Overrides (So You Stay In Control)

Use these phrases to control automation precisely:

- “Skip guardrails.” (I will not run ui-change-check/cost/architecture scripts.)
- “Run only UI smoke.” (I will run Playwright smoke only.)
- “Run only doctor.” (I will run `npm run doctor` only.)
- “Skip latency baseline.” (I will not run baseline checks.)
- “Run all UI-safe checks.” (I will run the UI-safe wrapper.)
- “Dry-run only.” (I will not execute scripts; I will only propose.)

## 3) Autopilot Requests (Optional)

If you say “do all the things,” I will:

- Check repo status
- Run the quality gate
- Make the changes
- Commit with a clear message (optional)
- Push only if checks pass

---

## 4) Automation Catalog

These scripts/workflows keep the agent session accurate and fast:

- `./scripts/update-status.sh`
  - Updates `./.agent/CURRENT_STATUS.md` without losing manual sections

- `./scripts/archive-learnings.sh`
  - Archives older learnings when file grows large
  - Regenerates `./.agent/LEARNINGS_QUICKREF.md`

- `./scripts/propose-skill.sh`
  - Creates a proposed skill draft from notes or pasted lessons
  - Example: `scripts/propose-skill.sh --source notes.md --name "Skill Name"`

- `./scripts/ui-change-check.sh`
  - Classifies UI-only vs core/AI/backend changes
  - Use `--strict` to block mixed changes

- `./scripts/run-ui-smoke.sh`
  - Runs Playwright smoke: `e2e/core-loop.spec.ts`

- `./scripts/run-ui-safe.sh`
  - Runs UI-safe checks in sequence (guardrail + doctor + smoke + optional baseline)

- `./scripts/cost-guardrail.sh`
  - Flags newly added AI calls unless explicitly approved
  - Uses net-new AI call lines; approvals in `./.agent/COST_APPROVALS.md` or inline tags

- `./scripts/architecture-drift-check.sh`
  - Warns if core/AI/backend changes lack doc updates

- `./scripts/latency-baseline.sh`
  - Tracks bundle-size baseline as a latency proxy
  - Use `--update` after a known-good build, then `--check` on later changes

Workflows (docs only):

- `./.agent/workflows/start-session.md`
- `./.agent/workflows/end-session.md`
- `./.agent/workflows/pre-push.md`
- `./.agent/workflows/add-ai-generator.md`
- `./.agent/workflows/ui-ux-change.md`

CI guardrails:

- On PRs, cost + architecture checks run automatically when core/AI/backend files change.

---

## 5) How to Add a New Skill

When you paste a skill or lesson in chat, tell me the name and any constraints.
I will:

1. Save your notes
2. Run `scripts/propose-skill.sh` to draft a skill file
3. Ask you to review/approve the draft

Example request:

```
Create a skill from the lesson below. Name it: "Playwright Core Loop Testing".
[PASTE SKILL CONTENT]
```

---

## 6) Common Pitfalls to Avoid

- Missing logs or error output
- Vague requests (“it’s broken”) without scope
- Changing requirements mid‑task without stating the new priority
- Asking for “quick fix” while requesting refactors

---

## 7) Best Ways to Ask

- “Fix X, minimal change, run Y to verify.”
- “Investigate A; report risks; implement only if safe.”
- “Refactor B; update docs; ensure tests pass.”

## 7.5) UI/UX Change Requests (Safe Pattern)

Use this format for UI work:

- Goal: describe the UX change
- Scope: components/screens
- Constraints: “no AI changes”, “no core loop change”, “no new deps”
- Risk check: “run ui-change-check + smoke; if core touched run cost-guardrail + architecture-drift-check”

Example:

```
Goal: tighten spacing in FocusList and align buttons
Scope: dashboard/FocusList.tsx, shared/SharedUI.tsx
Constraints: no AI changes, no core loop changes
Risk check: run ui-change-check + ui smoke; if core touched run cost-guardrail + architecture-drift-check
```

---

## 8) When You Want Me to Run Automation

Tell me explicitly:

- “Run update-status.”
- “Archive learnings and refresh quickref.”
- “Generate a skill draft from this lesson.”
- “Run UI change guardrail.”
- “Run UI smoke test.”
- “Run UI-safe checks.”
- “Run cost guardrail.”
  - Optional: add approvals to `./.agent/COST_APPROVALS.md` for known cost-neutral changes
- “Run architecture drift check.”
- “Run latency baseline check.”
