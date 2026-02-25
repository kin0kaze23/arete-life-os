import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserIdFromRequest } from './_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('user_profiles').upsert({
      id: userId,
      telegram_link_token: token,
      telegram_link_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      token,
      instruction: `Send this to your bot: /link ${token}`,
      expires_in_minutes: 5,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}
