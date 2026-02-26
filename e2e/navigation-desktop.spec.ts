import { expect, test } from '@playwright/test';
import { ensureAppReady } from './helpers';

test.beforeEach(async ({ page }) => {
  await ensureAppReady(page);
});

test('desktop navigation remains clear and stable across core pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.getByRole('button', { name: /dashboard/i }).click();
  await expect(page.getByText(/daily command center/i)).toBeVisible();
  await expect(page.getByTestId('focus-list')).toBeVisible();

  await page.getByRole('button', { name: /my life/i }).click();
  await expect(page.getByText(/identity, memory, and knowledge graph/i)).toBeVisible();
  await expect(page.getByText(/vault overview/i)).toBeVisible();

  await page.getByRole('button', { name: /journal/i }).click();
  await expect(page.getByText(/categorized life timeline and logs/i)).toBeVisible();
  await expect(page.getByText(/neural mind map/i)).toBeVisible();

  await page.getByRole('button', { name: /assistant/i }).click();
  await expect(page.getByText(/ask aura from your private context/i)).toBeVisible();
  await expect(page.getByText(/conversation/i)).toBeVisible();

  await page.getByRole('button', { name: /settings/i }).click();
  await expect(page.getByText(/workspace controls/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /data portability/i })).toBeVisible();
});
