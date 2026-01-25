# Data Model (MVP)

## Entities

### Person

- id, name, role (self/spouse/child), dob/age, notes, privacy flags

### Profile

- personId
- identity/personal/health/finance/relationship/spiritual fields
- lastUpdated

### MemoryItem

- id, personId, domain, type (note/file/link/image)
- tags[], createdAt, sourceUri/attachment, extractedFields{}, summary
- versioning: parentId?, version
- status: active/archived
- confidence: high/med/low

### Event

- id, title, start/end dates, participants[], location
- prepMilestones[] (generated)
- linkedMemories[], linkedTasks[]

### Task

- id, title, domain, personId, dueAt?, durationEstimate, priority
- status: todo/doing/done/snoozed/blocked
- linkedEventId?, linkedMemoryIds[]
- executionGuidance{} (from template)

### Recommendation

- id, domain, personId, horizon (now/soon/always)
- title, rationale, score, urgency, effort, dueAt?
- sourceSignals[] (links to MemoryItem/Event/Profile fields)
- executionGuidance{} (from template)
- status: active/needs-review/dismissed/done

### Risk

- id, domain, personId, horizon
- title, impact, likelihood, mitigation
- triggerSignals[]
- status: active/needs-review/resolved

### Feedback

- date, completedTasks[], skippedTasks[] + reason
- mood/energy, notes
- adjustments (what changed)

## Reactive update rules (must hold)

- Any CRUD on Memory/Event/Profile triggers re-ranking of Recommendations and Risks.
- Completing a Task updates Recommendations/Risks and dashboard immediately.
- Needs Review resolution updates routing and recommendations immediately.
