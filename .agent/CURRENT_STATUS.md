# Current Status Snapshot

Last updated: 2026-01-26

## Repo State

- Branch: `main`
- Tests: `npm run doctor` passes
- Pending: staged changes (commit blocked in this environment due to `.git/index.lock` permission)

## Core Loop

- Log Bar writes are atomic; logs persist even if AI extraction fails (needsReview set).
- File uploads are local-first (IndexedDB), referenced via `Source.storageKey`.
- Finance metrics derived each log and stored as `finance_metrics` MemoryItem.
- Habit detection writes `Category.HABIT` MemoryItem with structured metadata.
- Dashboard auto-refreshes after log ingestion.
- Evening Audit moved to small Log Bar reminder.

## Dashboard Scope

Only high-signal panels remain:

- Do / Watch
- Always Do / Always Watch (includes Habit chips)
- Domain Panels

## AI Prompting

- Deep planning prompt includes finance metrics + missing data + fatty liver guidance.
- OpenAI fallback remains enabled.

## Immediate Next Steps

1. Commit + push staged changes locally:
   ```bash
   git commit -m "Update agent docs with latest core loop learnings"
   git push
   ```
2. Redeploy on Vercel.
3. Optional: add Habit edit UI and loop interconnect detail (events/tasks/audit nodes).
