# Log Bar Intake Pipeline (Source of Truth)

This document defines how Log Bar input (text, files, links) is processed into structured Knowledge Graph data and downstream updates.

## 1) Pipeline: intent → extraction → routing → storage → triggers → UI refresh

1. Capture
   - User submits text and/or attached files from Log Bar.
   - Files are stored locally (IndexedDB) and referenced by `Source` metadata.

2. Intent detection + extraction
   - AI intake prompt (LOG_BAR_INGEST_PROMPT) returns structured `IntakeResult`.
   - Output includes intent, items, missing data, confidence, and optional Needs Review questions.
   - If AI fails or is ambiguous, fallback heuristics create a minimal intake item and a Needs Review item.

3. Routing
   - Each `IntakeItem` is mapped to an entity:
     - `event` → TimelineEvent + MemoryItem
     - `habit` → MemoryItem (type: habit)
     - `task` / `task_request` → DailyTask + MemoryItem
     - `health_record` / `finance_record` / `relationship_note` / `spiritual_note` → MemoryItem
     - `profile_update` / `config_update` → ProposedUpdate + MemoryItem
     - `document` / `link` → MemoryItem (with metadata)
     - `needs_review` → MemoryItem (type: needs_review)

4. Storage + linking
   - Raw input is always preserved as a MemoryItem.
   - Structured fields are stored in `MemoryItem.metadata.payload`.
   - Evidence is linked by `sourceId` where available.

5. Triggers
   - After write, `debouncedRefreshAura()` recomputes tasks/insights/blind spots.
   - Timeline updates render immediately in dashboard and watch-outs.

6. Reactive UI updates
   - Memory vault, dashboard, and watch panels update without manual refresh.
   - Needs Review count includes intake items marked `needs_review`.

---

## 2) Data models / types

Core types (see `data/types.ts`):

- `IntakeResult`
- `IntakeItem`
- `IntakeNeedsReview`
- `IntakeIntent`, `IntakeItemType`, `IntakeHorizon`

Key storage types:

- `MemoryItem` (always stored; includes `metadata` with structured fields)
- `Source` (file metadata and storage key)
- `TimelineEvent` (future events)
- `DailyTask` (task requests)

---

## 3) Event / mutation map

| Intake item type               | State updates                         | Notes                                 |
| ------------------------------ | ------------------------------------- | ------------------------------------- |
| memory                         | MemoryItem updated or created         | Category inferred and refined         |
| document                       | Source + MemoryItem                   | Stored locally; metadata stored       |
| link                           | MemoryItem                            | Payload includes `url`                |
| event                          | TimelineEvent + MemoryItem + AuditLog | Requires date; otherwise Needs Review |
| habit                          | MemoryItem + AuditLog                 | Category `Habit`, metadata payload    |
| task / task_request            | DailyTask + MemoryItem                | Minimal fields; can be refined later  |
| health_record                  | MemoryItem                            | Category `Health`                     |
| finance_record                 | MemoryItem                            | Category `Finance`                    |
| relationship_note              | MemoryItem                            | Category `Relationships`              |
| spiritual_note                 | MemoryItem                            | Category `Spiritual`                  |
| profile_update / config_update | ProposedUpdate + MemoryItem           | Verified via Verification Sheet       |
| needs_review                   | MemoryItem                            | Questions stored in metadata          |

All writes trigger `debouncedRefreshAura()` for downstream recompute.

---

## 4) Must-pass test checklist

1. Upload a health PDF

- File stored in IndexedDB
- MemoryItem created with metadata type `document`
- Needs Review if no extractable health details

2. Add a future trip

- TimelineEvent created with correct date
- MemoryItem created and linked
- Dashboard “Watch Out” shows upcoming item

3. Add a daily habit

- MemoryItem created type `habit`
- Always-Do panel shows habit and is editable

4. Update profile field (e.g., “update my sleep to 11pm”)

- Proposed update appears in Verification Sheet
- On approve, profile updates and dashboard refreshes

5. Ambiguous upload or vague input

- Needs Review item created with 1–3 questions
- No silent failure

---

## 5) Overlaps / redundant flow to remove

- Do not create duplicate memory items for file uploads; update the existing `mem-{sourceId}` record instead.
- Keep Log Bar as the single ingestion path; other intake paths should route to `logMemory()` when possible.
