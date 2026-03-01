import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserIdFromRequest } from '../telegram/_helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const digest = req.body?.digest;
  if (!digest || typeof digest !== 'object') {
    return res.status(400).json({ error: 'Missing digest payload' });
  }

  const supabase = getSupabaseAdmin();
  const payload = {
    digest,
    question: req.body?.question || null,
    preferences: req.body?.preferences || null,
    publishedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('inbox_entries').insert({
    user_id: userId,
    source: 'guidance_snapshot',
    raw_content: 'guidance_snapshot',
    content_type: 'text',
    ai_result: payload,
    merged: true,
    merged_at: new Date().toISOString(),
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
