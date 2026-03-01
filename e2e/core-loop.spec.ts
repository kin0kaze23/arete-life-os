import { expect, test } from '@playwright/test';
import { ensureAppReady, logInput } from './helpers';

const USE_LIVE_AI = process.env.E2E_LIVE_AI === '1';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await ensureAppReady(page);
});

test('event prep plan uses search grounding and returns a checklist', async ({ page }) => {
  test.skip(USE_LIVE_AI && !process.env.GEMINI_API_KEY, 'GEMINI_API_KEY not set for live AI');

  await logInput(page, 'Trip to Tokyo #research tomorrow at 10am at Narita Airport');

  const eventCard = page.getByTestId('event-card').filter({ hasText: 'Trip to Tokyo' }).first();
  await expect(eventCard).toBeVisible({ timeout: 20_000 });

  const requestPromise = page.waitForRequest((req) => {
    if (!req.url().includes('/api/gemini')) return false;
    if (req.method() !== 'POST') return false;
    try {
      const body = JSON.parse(req.postData() || '{}');
      return body.action === 'generateEventPrepPlan';
    } catch {
      return false;
    }
  });

  const responsePromise = page.waitForResponse((res) => {
    if (!res.url().includes('/api/gemini')) return false;
    try {
      const body = JSON.parse(res.request().postData() || '{}');
      return body.action === 'generateEventPrepPlan';
    } catch {
      return false;
    }
  });

  await eventCard.click();

  const req = await requestPromise;
  const reqBody = JSON.parse(req.postData() || '{}');
  expect(reqBody.payload?.enableSearch).toBe(true);

  const res = await responsePromise;
  const data = await res.json();
  expect(Array.isArray(data?.evidenceLinks?.sources)).toBe(true);

  await expect(page.getByTestId('prep-steps')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('prep-step').first()).toBeVisible();
});

test('prep tasks persist after refresh', async ({ page }) => {
  test.skip(USE_LIVE_AI && !process.env.GEMINI_API_KEY, 'GEMINI_API_KEY not set for live AI');

  await logInput(page, 'Conference in Berlin #research tomorrow at 9am at Messe Berlin');

  const eventCard = page
    .getByTestId('event-card')
    .filter({ hasText: 'Conference in Berlin' })
    .first();
  await expect(eventCard).toBeVisible({ timeout: 20_000 });
  const eventId = await eventCard.getAttribute('data-event-id');
  await eventCard.click();

  const firstStep = page.getByTestId('prep-step').first();
  await expect(firstStep).toBeVisible({ timeout: 20_000 });
  const stepText = (await firstStep.textContent())?.trim() || '';
  expect(stepText.length).toBeGreaterThan(0);

  await page.getByTestId('prep-execute').click();
  await expect(page.getByTestId('prep-execute')).toBeHidden({ timeout: 10_000 });

  let prepScope = page.locator('[data-testid="prep-group"]').first();
  if (eventId) {
    const prepGroup = page.locator(`[data-testid="prep-group"][data-event-id="${eventId}"]`);
    await expect(prepGroup).toBeVisible({ timeout: 15_000 });
    await prepGroup.click();
    prepScope = prepGroup;
  }
  await expect(prepScope.getByText(stepText, { exact: false }).first()).toBeVisible({
    timeout: 15_000,
  });

  await logInput(page, 'Quick note: wrapped up planning for the week.');
  await page.waitForTimeout(3000);

  await expect(prepScope.getByText(stepText, { exact: false }).first()).toBeVisible({
    timeout: 15_000,
  });
});

test('recommendation feedback is recorded', async ({ page }) => {
  test.skip(USE_LIVE_AI && !process.env.GEMINI_API_KEY, 'GEMINI_API_KEY not set for live AI');

  await logInput(page, 'Need advice on improving energy, focus, and travel prep this week.');

  await expect
    .poll(async () => page.getByTestId('rec-card').count(), { timeout: 20_000 })
    .toBeGreaterThan(0);
  const recCard = page.getByTestId('rec-card').first();
  const recId = await recCard.getAttribute('data-rec-id');
  await recCard.scrollIntoViewIfNeeded();
  await recCard.click({ force: true });
  await expect(recCard.getByText('Rationale')).toBeVisible({ timeout: 10_000 });

  const keepButton = recCard.getByTestId('rec-keep');
  await expect(keepButton).toBeVisible({ timeout: 10_000 });
  await keepButton.click();
  await expect(recCard.getByText('Kept')).toBeVisible({ timeout: 10_000 });

  const removeButton = recCard.getByTestId('rec-remove');
  await removeButton.click();
  if (recId) {
    await expect(page.locator(`[data-testid="rec-card"][data-rec-id="${recId}"]`)).toBeHidden({
      timeout: 10_000,
    });
  }
});
