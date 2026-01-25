# Log Bar Spec (Universal Command Center)

## Supported inputs

- text (notes, tasks, reflections, decisions)
- file upload (pdf/doc/image/csv)
- link paste
- screenshot paste

## Intents (auto-detect)

- Add Memory
- Add Future Event
- Add Task
- Update Profile
- Update Config (core loops)
- Ask for Plan My Day
- Export/Import

## Routing rules

- Must assign: person (me/spouse/child), domain, and entity type.
- If uncertain -> Needs Review item with 1–3 clarifying questions.

## Log Item model

- id, timestamp, source, person, domain, type
- content preview + attachments
- status: draft/processing/success/needs-review/failed
- actions: summarize, convert to task, attach to goal, save to vault, export, delete

## CRUD requirements

From Log Bar user can:

- add/update/delete memory entries
- add/update/delete profile fields
- add/update/delete future events + milestones
- add/update/delete recurring routines and thresholds

## UX requirements

- always accessible (sticky/floating)
- suggestions chips after input (3–5 next actions)
- no blocking modal unless necessary
- progress indicators for processing

## Acceptance criteria

- User can add a future event and see milestone tasks appear in Soon/Now appropriately
- User can upload a file, confirm classification if needed, and see it linked to a recommendation
- Any action from Log Bar updates the dashboard without refresh
