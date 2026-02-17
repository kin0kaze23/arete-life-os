import { list } from '@vercel/blob';
import { z } from 'zod';
import { sanitizePayload, validatePayloadSize } from '../_sanitize';
import { applyCors, ensureMethod, fetchBlobJson, getBlobToken, logApiError, redact } from './_utils';

const identitySchema = z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid identity');

type LatestPointer = {
  key: string;
  uploadedAt?: string;
};

export default async function handler(req: any, res: any) {
  if (!applyCors(req, res)) return;
  if (!ensureMethod(req, res)) return;

  try {
    const token = getBlobToken();
    const body = req.body || {};
    if (!validatePayloadSize(body, 1024 * 64)) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }

    const envelope = z.object({ identity: identitySchema }).safeParse(body);
    if (!envelope.success) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }

    const sanitized = sanitizePayload(envelope.data);
    const identity = sanitized.identity;
    const prefix = `backups/${identity}`;
    const latest = await fetchBlobJson<LatestPointer>(`${prefix}/latest.json`, token);

    const listed = await list({ prefix: `${prefix}/`, token });
    const items = listed.blobs
      .filter(
        (blob) =>
          blob.pathname.includes('/vault-') &&
          !blob.pathname.endsWith('latest.json') &&
          !blob.pathname.endsWith('limits.json')
      )
      .map((blob) => ({
        key: blob.pathname,
        uploadedAt: blob.uploadedAt,
        size: blob.size,
        isLatest: latest?.key === blob.pathname,
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    res.status(200).json({ items });
  } catch (err) {
    const errorId = logApiError('backup-list', err);
    res
      .status(500)
      .json({ error: 'Unable to list backups', id: errorId, details: redact(String(err)) });
  }
}
