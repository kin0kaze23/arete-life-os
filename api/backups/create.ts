import { del, list, put } from '@vercel/blob';
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

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const MAX_VERSIONS = 10;
const MAX_DAILY_BACKUPS = 3;
const RETENTION_DAYS = 90;

type RateLimits = {
  backupCounts: Record<string, number>;
  restoreCounts: Record<string, number>;
  updatedAt: string;
};

const limitsForToday = (limits: RateLimits, key: 'backupCounts' | 'restoreCounts') => {
  const today = new Date().toISOString().slice(0, 10);
  const counts = limits[key] || {};
  return { today, count: counts[today] || 0 };
};

const identitySchema = z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid identity');
const deviceSchema = z.string().regex(/^[a-f0-9]{8,64}$/i, 'Invalid device id');
const backupSchema = z
  .object({
    meta: z.string(),
    vault: z.string(),
    files: z.array(z.any()).optional(),
    exportedAt: z.string().optional(),
    version: z.string().optional(),
    deviceId: z.string().optional(),
  })
  .passthrough();

export default async function handler(req: any, res: any) {
  if (!applyCors(req, res)) return;
  if (!ensureMethod(req, res)) return;

  try {
    const token = getBlobToken();
    const body = req.body || {};
    if (!validatePayloadSize(body, MAX_BACKUP_BYTES + 1024 * 1024)) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }
    const envelope = z
      .object({
        identity: identitySchema,
        deviceId: deviceSchema,
        backup: backupSchema,
      })
      .safeParse(body);
    if (!envelope.success) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }

    const sanitized = sanitizePayload(envelope.data);
    const identity = sanitized.identity;
    const deviceId = sanitized.deviceId;
    const backup = sanitized.backup;
    if (!backup?.meta || !backup?.vault) {
      res.status(400).json({ error: 'Invalid backup payload' });
      return;
    }

    const raw = JSON.stringify(backup);
    const sizeBytes = new TextEncoder().encode(raw).length;
    if (sizeBytes > MAX_BACKUP_BYTES) {
      res.status(413).json({ error: 'Backup exceeds 10 MB limit' });
      return;
    }

    const prefix = `backups/${identity}`;
    const limitsKey = `${prefix}/limits.json`;
    const limits =
      (await fetchBlobJson<RateLimits>(limitsKey, token)) ||
      ({
        backupCounts: {},
        restoreCounts: {},
        updatedAt: new Date().toISOString(),
      } satisfies RateLimits);

    const { today, count } = limitsForToday(limits, 'backupCounts');
    if (count >= MAX_DAILY_BACKUPS) {
      res.status(429).json({ error: 'Daily backup limit reached' });
      return;
    }

    const timestampSlug = new Date().toISOString().replace(/[:.]/g, '-');
    const baseKey = `${prefix}/vault-${timestampSlug}-dev${deviceId}.json`;
    const stored = await put(baseKey, raw, {
      access: 'public',
      contentType: 'application/json',
      token,
      addRandomSuffix: true,
    });

    limits.backupCounts[today] = count + 1;
    limits.updatedAt = new Date().toISOString();
    await putJsonBlob(limitsKey, limits, token);

    const latestKey = `${prefix}/latest.json`;
    const uploadedAt = new Date().toISOString();
    await putJsonBlob(latestKey, { key: stored.pathname, uploadedAt }, token);

    const listed = await list({ prefix: `${prefix}/`, token });
    const now = Date.now();
    const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const backups = listed.blobs.filter(
      (blob) =>
        blob.pathname.includes('/vault-') &&
        !blob.pathname.endsWith('latest.json') &&
        !blob.pathname.endsWith('limits.json')
    );
    const buckets = new Map<string, typeof backups>();
    backups.forEach((blob) => {
      const match = blob.pathname.match(/-dev([a-f0-9]{8,64})/i);
      const deviceKey = match?.[1] || 'unknown';
      const existing = buckets.get(deviceKey) || [];
      existing.push(blob);
      buckets.set(deviceKey, existing);
    });

    const deletions: typeof backups = [];
    buckets.forEach((bucket) => {
      bucket.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      bucket.forEach((blob, index) => {
        const isExpired = new Date(blob.uploadedAt).getTime() < cutoff;
        if (index >= MAX_VERSIONS || isExpired) deletions.push(blob);
      });
    });
    if (deletions.length > 0) {
      await del(deletions.map((blob) => blob.url));
    }

    res.status(200).json({
      key: stored.pathname,
      uploadedAt,
      size: sizeBytes,
    });
  } catch (err) {
    const errorId = logApiError('backup-create', err);
    res.status(500).json({ error: 'Backup failed', id: errorId, details: redact(String(err)) });
  }
}
