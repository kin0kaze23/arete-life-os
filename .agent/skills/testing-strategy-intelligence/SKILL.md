---
name: testing-strategy-intelligence
description: Testing pyramid, Playwright E2E, and React Testing Library patterns. Use when setting up tests or debugging test failures.
---

# Testing Strategy Intelligence Skill

Use this skill when creating tests, debugging test failures, or planning test coverage.

## 1. Testing Pyramid (80/15/5 Rule)

**Distribution**:

- **80% Unit Tests**: Individual functions, hooks, utilities
- **15% Integration Tests**: Component interactions, API routes
- **5% E2E Tests**: Critical user flows (signup, core loop)

**Rationale**: Unit tests are fast and pinpoint failures; E2E tests are slow but catch real-world bugs.

## 2. Playwright Setup for Next.js

**Install**:

```bash
npm install -D @playwright/test
npx playwright install
```

**Config** (`playwright.config.ts`):

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

## 3. User-Centric Locators (Priority Order)

1. **`getByRole()`**: Preferred, aligns with accessibility

   ```typescript
   await page.getByRole('button', { name: 'Submit' }).click();
   ```

2. **`getByLabel()`**: For form inputs

   ```typescript
   await page.getByLabel('Email').fill('user@example.com');
   ```

3. **`getByText()`**: For static content

   ```typescript
   await page.getByText('Welcome back').isVisible();
   ```

4. **`getByTestId()`**: Last resort for dynamic content
   ```typescript
   await page.getByTestId('dashboard-header').isVisible();
   ```

**Avoid**: CSS selectors (`.class-name`), XPath (brittle)

## 4. Test Independence

**Pattern**:

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Fresh state for each test
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    indexedDB.deleteDatabase('GlanceDB');
  });
});

test('user can create an event', async ({ page }) => {
  // Test runs in isolation
  await page.getByRole('button', { name: 'New Event' }).click();
  // ...
});
```

## 5. AI Extraction Testing

**Challenge**: AI outputs are non-deterministic

**Solution 1: Mock the API**:

```typescript
await page.route('**/api/chat', async (route) => {
  await route.fulfill({
    json: {
      events: [{ title: 'Mocked Event', date: '2026-02-01' }],
    },
  });
});
```

**Solution 2: Validate Structure, Not Content**:

```typescript
test('AI extraction returns valid events', async ({ page }) => {
  await page.getByLabel('Log input').fill('Tomorrow I have a meeting');
  await page.getByRole('button', { name: 'Process' }).click();

  // Don't assert exact title, just structure
  const eventCard = page.locator('[data-testid="event-card"]').first();
  await expect(eventCard).toBeVisible();
  await expect(eventCard.locator('.event-title')).not.toBeEmpty();
  await expect(eventCard.locator('.event-date')).toContainText(/\d{4}/); // Year format
});
```

## 6. IndexedDB Testing

**Pattern**:

```typescript
test('events are persisted to IndexedDB', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Event' }).click();
  await page.getByLabel('Title').fill('Test Event');
  await page.getByRole('button', { name: 'Save' }).click();

  // Verify in IndexedDB
  const events = await page.evaluate(async () => {
    const db = await indexedDB.open('GlanceDB', 1);
    return new Promise((resolve) => {
      const tx = db.transaction('events', 'readonly');
      const request = tx.objectStore('events').getAll();
      request.onsuccess = () => resolve(request.result);
    });
  });

  expect(events).toHaveLength(1);
  expect(events[0].title).toBe('Test Event');
});
```

## 7. Page Object Model (for complex apps)

**Structure**:

```typescript
// e2e/pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async createEvent(title: string) {
    await this.page.getByRole('button', { name: 'New Event' }).click();
    await this.page.getByLabel('Title').fill(title);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async getEventCount() {
    return await this.page.locator('[data-testid="event-card"]').count();
  }
}

// Usage in test
test('dashboard displays events', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.createEvent('Test');
  expect(await dashboard.getEventCount()).toBe(1);
});
```

## 8. Visual Regression Testing

**Setup**:

```typescript
test('dashboard layout is consistent', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

**First run**: Generates baseline
**Subsequent runs**: Compares against baseline, fails if different
