/**
 * AI Configuration Module
 *
 * Centralized utilities for AI operations.
 * Provider-specific logic lives in api/providers/ and api/modelRouter.ts.
 */

/**
 * Fill template placeholders with data
 */
export const fillTemplate = (template: string, data: Record<string, string>): string => {
  let res = template;
  for (const [key, value] of Object.entries(data)) {
    res = res.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return res;
};

/**
 * Redact sensitive information from strings (API keys, tokens)
 */
export const redactSensitive = (value: string): string =>
  value
    .replace(/sk-ant-[A-Za-z0-9]{10,}/g, '[redacted]')
    .replace(/sk-[A-Za-z0-9]{20,}/g, '[redacted]')
    .replace(/AIza[0-9A-Za-z\-_]{10,}/g, '[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(api|auth|secret|token)[^\s]{0,3}[:=]\s*[A-Za-z0-9_-]{16,}/gi, '$1:[redacted]');

/**
 * Serialize error for logging (with sensitive data redacted)
 */
export const serializeError = (err: unknown): Record<string, unknown> => {
  if (!err) return { message: 'Unknown error' };

  const anyErr = err as any;
  const payload: Record<string, unknown> = {
    name: anyErr?.name,
    message: anyErr?.message,
    status: anyErr?.status ?? anyErr?.code,
    details: anyErr?.details ?? anyErr?.error?.message,
  };

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') payload[key] = redactSensitive(value);
  }

  return payload;
};
