const MAX_STRING_LENGTH = 50_000;
const MAX_DEPTH = 6;

const stripControlChars = (value: string) => {
  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) continue;
    out += value[i];
  }
  return out;
};

export const sanitizeString = (value: string, maxLen = MAX_STRING_LENGTH) => {
  const cleaned = stripControlChars(value);
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen);
};

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return value;
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeValue(val, depth + 1);
    }
    return out;
  }
  return value;
};

export const sanitizePayload = <T>(payload: T): T => {
  return sanitizeValue(payload) as T;
};

export const validatePayloadSize = (payload: unknown, maxBytes: number): boolean => {
  try {
    const raw = JSON.stringify(payload);
    return Buffer.byteLength(raw, 'utf8') <= maxBytes;
  } catch {
    return false;
  }
};
