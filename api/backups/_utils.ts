import { head, put } from '@vercel/blob';
import { redactSensitive, serializeError } from '../_aiConfig.js';

const MAX_BODY_BYTES = 11 * 1024 * 1024;

export const getAllowedOrigins = () => {
  const origins = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ]);
  const publicUrl = process.env.PUBLIC_APP_URL?.trim();
  if (publicUrl) origins.add(publicUrl);
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) origins.add(`https://${vercelUrl}`);
  return origins;
};

export const applyCors = (req: any, res: any) => {
  const origin = req.headers?.origin;
  const allowedOrigins = getAllowedOrigins();
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (origin) {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
};

export const ensureMethod = (req: any, res: any) => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'Payload too large' });
    return false;
  }
  return true;
};

export const getBlobToken = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  return token;
};

export const fetchBlobJson = async <T>(pathname: string, token: string): Promise<T | null> => {
  try {
    const meta = await head(pathname, { token });
    const response = await fetch(meta.url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const putJsonBlob = async (pathname: string, data: unknown, token: string) => {
  const body = JSON.stringify(data);
  return put(pathname, body, {
    access: 'public',
    contentType: 'application/json',
    token,
    addRandomSuffix: false,
  });
};

export const logApiError = (label: string, err: unknown) => {
  const errorId = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.error(`[${errorId}] Backup request failed`, serializeError(err));
  return errorId;
};

export const redact = (value: string) => redactSensitive(value);
