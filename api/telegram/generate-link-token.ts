import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserIdFromRequest } from './_helpers.js';

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
    const updatePayload = {
      telegram_link_token: token,
      telegram_link_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileLookupError) {
      return res.status(500).json({ error: profileLookupError.message });
    }

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', userId);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
    } else {
      const { error: insertError } = await supabase.from('user_profiles').insert({
        id: userId,
        vault_salt: crypto.randomBytes(16).toString('hex'),
        vault_iterations: 100000,
        ...updatePayload,
      });

      if (insertError) {
        const duplicateProfile = /duplicate key|violates unique constraint/i.test(
          insertError.message || ''
        );

        if (!duplicateProfile) {
          return res.status(500).json({ error: insertError.message });
        }

        const { error: retryUpdateError } = await supabase
          .from('user_profiles')
          .update(updatePayload)
          .eq('id', userId);

        if (retryUpdateError) {
          return res.status(500).json({ error: retryUpdateError.message });
        }
      }
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
