import { expect, test } from '@playwright/test';
import { ensureAppReady } from './helpers';

test.beforeEach(async ({ page }) => {
  await ensureAppReady(page);
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('settings shows clear capability states and diagnostics', async ({ page }) => {
  await page.getByRole('button', { name: /settings/i }).click();
  await expect(page.getByText(/health and controls|workspace controls/i)).toBeVisible();
  await expect(page.getByText(/system health/i)).toBeVisible();

  await expect(page.getByText(/cloud sync is not configured|sign in and complete cloud migration/i).first()).toBeVisible();

  const generateLinkButton = page.getByRole('button', { name: /generate link code/i });
  await expect(generateLinkButton).toBeDisabled();

  const themeToggle = page.getByLabel('Toggle Theme');
  await expect(themeToggle).toBeVisible();
  await themeToggle.click();
  await expect(themeToggle).toBeVisible();
});

test('dashboard quick actions navigate and prefill log input', async ({ page }) => {
  const main = page.getByRole('main');

  await page.getByRole('navigation').getByRole('button', { name: 'Today', exact: true }).click();

  await main.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.getByText(/neural mind map/i)).toBeVisible();

  await page.getByRole('navigation').getByRole('button', { name: 'Today', exact: true }).click();
  await main.getByRole('button', { name: 'Aura', exact: true }).click();
  await expect(page.getByText(/conversation/i)).toBeVisible();

  await page.getByRole('navigation').getByRole('button', { name: 'Today', exact: true }).click();
  await main.getByRole('button', { name: 'Capture', exact: true }).click();
  await expect(page.getByTestId('log-input')).toContainText('DAILY CHECK-IN');
});
