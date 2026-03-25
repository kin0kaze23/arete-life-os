---
name: data-architecture-intelligence
description: IndexedDB schema design, migrations, and offline-first data patterns. Use when designing database schemas or planning data migrations.
---

# Data Architecture Intelligence Skill

Use this skill when designing IndexedDB schemas, planning migrations, or architecting offline-first data flows.

## 1. Schema Migration with `onupgradeneeded`

**Version Numbering**:

- Start at version `1`, increment on every schema change
- Always increment version to trigger `onupgradeneeded`

**Migration Pattern**:

```typescript
const request = indexedDB.open('GlanceDB', 3); // Increment version

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  // Handle incremental migrations
  if (oldVersion < 1) {
    // Initial schema
    const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
    eventsStore.createIndex('by-date', 'date');
  }

  if (oldVersion < 2) {
    // Add new index
    const eventsStore = event.target.transaction.objectStore('events');
    eventsStore.createIndex('by-status', 'status');
  }

  if (oldVersion < 3) {
    // Migrate existing data
    const eventsStore = event.target.transaction.objectStore('events');
    eventsStore.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const event = cursor.value;
        event.newField = 'default'; // Add new field
        cursor.update(event);
        cursor.continue();
      }
    };
  }
};
```

## 2. Normalization vs Denormalization

**Normalization** (relationships via IDs):

- **Use when**: Data is frequently updated, needs referential integrity
- **Example**: `events` table with `questId` foreign key
- **Trade-off**: Requires multiple queries to fetch related data

**Denormalization** (embed related data):

- **Use when**: Data is read-heavy, relationships are stable
- **Example**: Embed quest title directly in event object
- **Trade-off**: Risk of stale data if parent updates

**Recommendation for Areté Life OS**:

- **Normalize**: Quests, Habits, Tasks (these change independently)
- **Denormalize**: AI-generated metadata (rarely changes, read-heavy)

## 3. Relationship Modeling

**One-to-Many** (Quest → Events):

```typescript
// Quest
{ id: 'q1', title: 'Season of Faith' }

// Events with foreign key
{ id: 'e1', questId: 'q1', title: 'Morning Prayer' }
{ id: 'e2', questId: 'q1', title: 'Bible Study' }

// Query: Get all events for a quest
const events = await db.getAllFromIndex('events', 'by-questId', 'q1');
```

**Many-to-Many** (Tags ↔ Events):

- Use a **junction table**: `event_tags` with `{ eventId, tagId }`
- Or **embed array**: `event.tags = ['faith', 'morning']`
- Prefer embedding for small, stable sets

## 4. Backup and Restore

**Export Strategy**:

```typescript
async function exportDatabase() {
  const db = await openDB();
  const data = {};

  for (const storeName of db.objectStoreNames) {
    const tx = db.transaction(storeName, 'readonly');
    data[storeName] = await tx.objectStore(storeName).getAll();
  }

  return JSON.stringify(data);
}
```

**Restore Strategy**:

- Clear existing data (or use versioning to avoid conflicts)
- Validate imported data before writing
- Preserve `createdAt` timestamps

## 5. Synchronization Patterns

**Conflict Resolution**:

- **Last Write Wins**: Use `updatedAt` timestamp
- **User Preference**: Prompt user to choose version
- **Merge Strategy**: For non-overlapping fields (e.g., tags)

**Offline Queue**:

- Store pending changes in `syncQueue` object store
- On reconnect, replay queue in order
- Mark as synced only after server confirmation

## 6. Data Integrity Without SQL

**Referential Integrity**:

- Manually validate foreign keys before insert
- Use transactions to ensure atomicity
- Cascade deletes in application logic

**Example**:

```typescript
async function deleteQuest(questId: string) {
  const tx = db.transaction(['quests', 'events'], 'readwrite');

  // Delete quest
  await tx.objectStore('quests').delete(questId);

  // Delete related events
  const eventStore = tx.objectStore('events');
  const events = await eventStore.index('by-questId').getAll(questId);
  for (const event of events) {
    await eventStore.delete(event.id);
  }

  await tx.done;
}
```
