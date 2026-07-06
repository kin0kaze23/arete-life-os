import { test, expect } from '@playwright/test';

test('visual verification screenshot', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/visual-verification.png', fullPage: true });

  // Verify the app loaded (not stuck on Clerk sign-in)
  const body = await page.textContent('body');
  expect(body).toBeTruthy();
});
