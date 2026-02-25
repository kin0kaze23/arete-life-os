import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserIdFromRequest } from './_helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('telegram_bindings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ linked: Boolean(data), binding: data || null });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}
