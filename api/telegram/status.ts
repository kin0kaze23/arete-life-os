import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildGuidanceTelegramMessage, canSendGuidanceMessage } from './_guidance.js';
import { getSupabaseAdmin, getUserIdFromRequest, sendTelegramMessage } from './_helpers.js';

const listRecentGuidanceDeliveries = async (supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('inbox_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'guidance_delivery')
    .gte('created_at', since);
  return Array.isArray(data) ? data.length : 0;
};

const publishGuidanceSnapshot = async (req: VercelRequest, res: VercelResponse, userId: string) => {
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
};

const sendGuidance = async (req: VercelRequest, res: VercelResponse, userId: string) => {
  const digest = req.body?.digest;
  if (!digest || typeof digest !== 'object') {
    return res.status(400).json({ error: 'Missing digest payload' });
  }

  const supabase = getSupabaseAdmin();
  const { data: binding } = await supabase
    .from('telegram_bindings')
    .select('telegram_chat_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!binding?.telegram_chat_id) {
    return res.status(200).json({ sent: false, reason: 'not_linked' });
  }

  const { data: profile } = await supabase.from('user_profiles').select('timezone').eq('id', userId).single();
  const deliveryCount = await listRecentGuidanceDeliveries(supabase, userId);
  const decision = canSendGuidanceMessage({
    timeZone: profile?.timezone || 'UTC',
    preferences: req.body?.preferences || {},
    deliveryCount,
    digest,
    question: req.body?.question || null,
    force: Boolean(req.body?.force),
  });

  if (!decision.allowed) {
    return res.status(200).json({ sent: false, reason: decision.reason });
  }

  const message = buildGuidanceTelegramMessage(
    digest,
    req.body?.question || null,
    decision.messageType
  );
  await sendTelegramMessage(binding.telegram_chat_id, message);

  await supabase.from('inbox_entries').insert({
    user_id: userId,
    source: 'guidance_delivery',
    raw_content: `guidance_delivery:${decision.messageType}`,
    content_type: 'text',
    ai_result: {
      messageType: decision.messageType,
      reason: req.body?.reason || 'manual',
      sentAt: new Date().toISOString(),
      digestGeneratedAt: digest.generatedAt,
    },
    merged: true,
    merged_at: new Date().toISOString(),
  });

  return res.status(200).json({ sent: true, messageType: decision.messageType });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'GET') {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('telegram_bindings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ linked: Boolean(data), binding: data || null });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const action = req.body?.action;
    if (action === 'publish_guidance') {
      return await publishGuidanceSnapshot(req, res, userId);
    }
    if (action === 'send_guidance') {
      return await sendGuidance(req, res, userId);
    }

    return res.status(400).json({ error: 'Unsupported action' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}
