import { redactSensitive, serializeError } from './_aiConfig.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const payload = JSON.stringify(body);
    console.warn('[csp-report]', redactSensitive(payload));
    res.status(204).end();
  } catch (err) {
    console.error('[csp-report] failed', serializeError(err));
    res.status(204).end();
  }
}
