import { expect, Page } from '@playwright/test';

const DEFAULT_PASSPHRASE = process.env.E2E_PASSPHRASE || 'TestPass123!';
const USE_LIVE_AI = process.env.E2E_LIVE_AI === '1';

const isVisible = async (locator: ReturnType<Page['locator']>, timeout = 2000) => {
  try {
    await locator.first().waitFor({ timeout });
    return await locator.first().isVisible();
  } catch {
    return false;
  }
};

export const ensureAppReady = async (page: Page) => {
  await page.route('**/api/gemini', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST') {
      await route.continue();
      return;
    }
    let body: any = {};
    try {
      body = JSON.parse(request.postData() || '{}');
    } catch {
      body = {};
    }
    const action = body?.action;
    if (USE_LIVE_AI && action === 'generateEventPrepPlan') {
      await route.continue();
      return;
    }
    if (USE_LIVE_AI) {
      await route.continue();
      return;
    }

    const makeRec = () => ({
      id: `rec-e2e-${Date.now()}`,
      ownerId: 'user',
      category: 'Work',
      title: 'E2E Recommendation',
      description: 'Synthetic recommendation for tests.',
      impactScore: 6,
      rationale: 'Generated for test stability.',
      steps: ['Step 1', 'Step 2'],
      estimatedTime: '10m',
      inputs: [],
      definitionOfDone: 'Task done.',
      risks: [],
      status: 'ACTIVE',
      userFeedback: undefined,
      needsReview: false,
      missingFields: [],
      createdAt: Date.now(),
      evidenceLinks: { claims: [], sources: [] },
    });

    let payload: any = {};
    switch (action) {
      case 'processInput':
        payload = {
          intent: 'memory',
          items: [],
          facts: [],
          proposedUpdates: [],
          missingData: [],
          needsReview: null,
          confidence: 0.7,
          notes: '',
        };
        break;
      case 'generateDeepInitialization':
        payload = {
          doItems: [],
          watchItems: [],
          alwaysDo: [],
          alwaysWatch: [],
          domainRecommendations: {},
          personalizedGreeting: 'Welcome.',
        };
        break;
      case 'generateDeepTasks':
        payload = { recommendations: [makeRec()], tasks: [] };
        break;
      case 'generateGuidanceDigest':
        payload = {
          summary: 'Synthetic guidance digest for tests.',
          question: {
            category: 'Personal',
            prompt: 'What matters most this week?',
            reason: 'Improves prioritization.',
            urgency: 'low',
            answerType: 'text',
          },
          doItems: [makeRec()],
          watchItems: [
            {
              signal: 'Synthetic watch item',
              why: 'Generated for test stability.',
              category: 'Personal',
              severity: 'med',
              actions: ['Review priorities'],
              nextPreventionStep: 'Clarify the next move.',
              horizon: 'now',
              trigger: 'behavior',
              confidence: 0.8,
            },
          ],
        };
        break;
      case 'generateEventPrepPlan':
        payload = {
          ...makeRec(),
          title: 'Prep Plan',
          steps: ['Pack documents', 'Confirm itinerary', 'Charge devices'],
          evidenceLinks: { claims: [], sources: ['https://example.com'] },
        };
        break;
      case 'generateTasks':
      case 'generateInsights':
      case 'generateBlindSpots':
      case 'generateDailyPlan':
        payload = [];
        break;
      case 'askAura':
        payload = { text: 'E2E response', sources: [] };
        break;
      default:
        payload = {};
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  await page.goto('/');

  const createHeading = page.getByRole('heading', { name: /create secure vault/i });
  const unlockHeading = page.getByRole('heading', { name: /unlock secure vault/i });

  const resetVaultState = async () => {
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases
            .map((database) => database.name)
            .filter((name): name is string => Boolean(name))
            .map(
              (name) =>
                new Promise<void>((resolve) => {
                  const request = indexedDB.deleteDatabase(name);
                  request.onsuccess = () => resolve();
                  request.onerror = () => resolve();
                  request.onblocked = () => resolve();
                })
            )
        );
      }
    });
    await page.reload();
  };

  const createVault = async () => {
    const passphraseInput = page.getByPlaceholder('Enter passphrase');
    await passphraseInput.fill(DEFAULT_PASSPHRASE);
    await page.getByPlaceholder('Confirm passphrase').fill(DEFAULT_PASSPHRASE);
    await page.getByRole('button', { name: /create vault/i }).click();
  };

  if (await isVisible(createHeading)) {
    await createVault();
  } else if (await isVisible(unlockHeading)) {
    await page.getByPlaceholder('Enter passphrase').fill(DEFAULT_PASSPHRASE);
    await page.getByRole('button', { name: /unlock/i }).click();
    if (await isVisible(unlockHeading, 1500)) {
      await resetVaultState();
      if (await isVisible(createHeading, 3000)) {
        await createVault();
      }
    }
  }

  const onboardingHeader = page.getByText('Neural Identity');
  if (await isVisible(onboardingHeader, 3000)) {
    const skipButton = page.getByRole('button', { name: /skip for later/i });
    let safety = 0;
    while ((await isVisible(skipButton, 500)) && safety < 10) {
      await skipButton.click();
      await page.waitForTimeout(200);
      safety += 1;
    }

    const activateButton = page.getByRole('button', { name: /activate system/i });
    if (await isVisible(activateButton, 2000)) {
      await activateButton.click();
    }
  }

  await expect(page.getByTestId('log-input')).toBeVisible({ timeout: 20_000 });

  const dashboardNav = page.getByRole('button', { name: /dashboard/i });
  if (await isVisible(dashboardNav, 2000)) {
    await dashboardNav.click();
  }

  await expect(page.getByTestId('focus-list')).toBeVisible({ timeout: 30_000 });
};

export const logInput = async (page: Page, text: string) => {
  const input = page.getByTestId('log-input');
  await expect(input).toBeVisible();
  await input.fill(text);
  await input.press('Enter');
  await expect(input).toHaveValue('', { timeout: 20_000 });
};
