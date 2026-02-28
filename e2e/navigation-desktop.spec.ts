import { expect, test } from '@playwright/test';
import { ensureAppReady } from './helpers';

test.beforeEach(async ({ page }) => {
  await ensureAppReady(page);
});

test('desktop navigation remains clear and stable across core pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const nav = page.getByRole('navigation');

  await nav.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.getByText(/what matters now|daily command center/i)).toBeVisible();
  await expect(page.getByTestId('focus-list')).toBeVisible();

  await nav.getByRole('button', { name: 'Life', exact: true }).click();
  await expect(page.getByText(/facts, profile, and memory|identity, memory, and knowledge graph/i)).toBeVisible();
  await expect(page.getByText(/vault overview/i)).toBeVisible();

  await nav.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.getByText(/signals and timeline|categorized life timeline and logs/i)).toBeVisible();
  await expect(page.getByText(/neural mind map/i)).toBeVisible();

  await nav.getByRole('button', { name: 'Aura', exact: true }).click();
  await expect(page.getByText(/ask from your private context|ask aura from your private context/i)).toBeVisible();
  await expect(page.getByText(/conversation/i)).toBeVisible();

  await nav.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByText(/health and controls|workspace controls/i)).toBeVisible();
  await expect(page.getByText('Backups', { exact: true })).toBeVisible();
});
