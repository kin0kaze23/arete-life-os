import { head } from '@vercel/blob';
import { z } from 'zod';
import { sanitizePayload, validatePayloadSize } from '../_sanitize.js';
import {
  applyCors,
  ensureMethod,
  fetchBlobJson,
  getBlobToken,
  logApiError,
  putJsonBlob,
  redact,
} from './_utils.js';

const MAX_DAILY_RESTORE = 10;

type RateLimits = {
  backupCounts: Record<string, number>;
  restoreCounts: Record<string, number>;
  updatedAt: string;
};

const identitySchema = z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid identity');
const keySchema = z.string().min(8);

export default async function handler(req: any, res: any) {
  if (!applyCors(req, res)) return;
  if (!ensureMethod(req, res)) return;

  try {
    const token = getBlobToken();
    const body = req.body || {};
    if (!validatePayloadSize(body, 1024 * 128)) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }

    const envelope = z.object({ identity: identitySchema, key: keySchema }).safeParse(body);
    if (!envelope.success) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }

    const sanitized = sanitizePayload(envelope.data);
    const identity = sanitized.identity;
    const key = sanitized.key;
    const prefix = `backups/${identity}/`;
    if (!key.startsWith(prefix)) {
      res.status(400).json({ error: 'Invalid backup key' });
      return;
    }

    const limitsKey = `backups/${identity}/limits.json`;
    const limits =
      (await fetchBlobJson<RateLimits>(limitsKey, token)) ||
      ({
        backupCounts: {},
        restoreCounts: {},
        updatedAt: new Date().toISOString(),
      } satisfies RateLimits);
    const today = new Date().toISOString().slice(0, 10);
    const count = limits.restoreCounts?.[today] || 0;
    if (count >= MAX_DAILY_RESTORE) {
      res.status(429).json({ error: 'Daily restore limit reached' });
      return;
    }

    limits.restoreCounts[today] = count + 1;
    limits.updatedAt = new Date().toISOString();
    await putJsonBlob(limitsKey, limits, token);

    let metadata;
    try {
      metadata = await head(key, { token });
    } catch {
      res.status(404).json({ error: 'Backup not found' });
      return;
    }
    const response = await fetch(metadata.url);
    if (!response.ok) {
      res.status(404).json({ error: 'Backup not found' });
      return;
    }
    const backup = await response.json();
    res.status(200).json({ backup, key });
  } catch (err) {
    const errorId = logApiError('backup-download', err);
    res.status(500).json({ error: 'Restore failed', id: errorId, details: redact(String(err)) });
  }
}
