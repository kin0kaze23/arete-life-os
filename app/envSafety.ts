/**
 * Environment Safety Check
 *
 * Production-safe validation that warns about dangerous environment variable
 * combinations. Does not weaken auth — only adds observability.
 *
 * Checks:
 * - VITE_E2E must not be set in production mode
 * - Clerk keys must be present in production mode
 */

type EnvSafetyReport = {
  safe: boolean;
  warnings: string[];
};

/**
 * Validates environment variables for production safety.
 * Returns a report with any warnings found.
 * Does not throw or block — only logs warnings.
 */
export function validateEnvSafety(): EnvSafetyReport {
  const warnings: string[] = [];
  const isProd = import.meta.env.PROD;
  const isE2E = import.meta.env.VITE_E2E === '1';

  // Check 1: VITE_E2E must not be active in production
  if (isProd && isE2E) {
    const msg = 'SECURITY WARNING: VITE_E2E auth bypass is active in production mode. ' +
      'This should never happen — check that VITE_E2E is not set in deployment environment.';
    console.error(msg);
    warnings.push(msg);
  }

  // Check 2: Clerk publishable key should be present in production
  if (isProd && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    const msg = 'WARNING: VITE_CLERK_PUBLISHABLE_KEY is not set in production mode. ' +
      'Clerk authentication will not work without it.';
    console.warn(msg);
    warnings.push(msg);
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
