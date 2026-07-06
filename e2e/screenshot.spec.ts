import { test, expect } from '@playwright/test';

test('visual verification screenshot', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173');

  // Wait for app to render (either vault unlock, onboarding, or main app)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Take screenshot of whatever state the app is in
  await page.screenshot({ path: 'screenshots/visual-verification.png', fullPage: true });

  // Verify the app rendered (not a blank page)
  const bodyText = await page.textContent('body');
  expect(bodyText).not.toBe('');
});
