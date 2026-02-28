import { expect, test } from '@playwright/test';
import { ensureAppReady } from './helpers';

test.beforeEach(async ({ page }) => {
  await ensureAppReady(page);
});

test('auto-merge holds low confidence inbox entries and allows manual merge', async ({ page }) => {
  const now = new Date().toISOString();

  await page.evaluate(({ createdAt }) => {
    const e2e = (window as any).__ARETE_E2E__;
    if (!e2e) throw new Error('__ARETE_E2E__ bridge is not available');

    e2e.setInboxReviewConfidence(0.65);
    e2e.setInboxEntries([
      {
        id: 'e2e-high-confidence',
        user_id: 'e2e-user',
        source: 'telegram',
        raw_content: 'E2E high confidence entry',
        content_type: 'text',
        ai_result: {
          confidence: 0.92,
          items: [
            {
              id: 'item-high',
              type: 'memory',
              intent: 'memory',
              domain: 'Personal',
              ownerId: 'e2e-user',
              content: 'High confidence memory',
              confidence: 0.92,
            },
          ],
        },
        merged: false,
        created_at: createdAt,
      },
      {
        id: 'e2e-low-confidence',
        user_id: 'e2e-user',
        source: 'telegram',
        raw_content: 'E2E low confidence entry',
        content_type: 'text',
        ai_result: {
          confidence: 0.4,
          items: [
            {
              id: 'item-low',
              type: 'memory',
              intent: 'memory',
              domain: 'Personal',
              ownerId: 'e2e-user',
              content: 'Low confidence memory',
              confidence: 0.4,
            },
          ],
        },
        merged: false,
        created_at: createdAt,
      },
    ]);
  }, { createdAt: now });

  await page.evaluate(async () => {
    const e2e = (window as any).__ARETE_E2E__;
    await e2e.mergeInboxAuto();
  });

  await expect(page.getByText(/1 pending Telegram entr(y|ies)/i)).toBeVisible();
  await expect(page.getByText(/E2E low confidence entry/i)).toBeVisible();
  await expect(page.getByText(/review/i).first()).toBeVisible();
  await expect(page.getByText(/E2E high confidence entry/i)).toBeHidden();

  await page.getByRole('button', { name: /^Open$/ }).click();
  await page.getByRole('button', { name: /^Merge$/ }).click();

  await expect(page.getByText(/pending Telegram entr(y|ies)/i)).toBeHidden();
});
