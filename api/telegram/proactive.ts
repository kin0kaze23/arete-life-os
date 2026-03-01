import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildGuidanceTelegramMessage, canSendGuidanceMessage } from './_guidance.js';
import { getSupabaseAdmin, sendTelegramMessage } from './_helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dryRun = req.query?.dryRun === '1';
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!dryRun && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseAdmin();
  const { data: bindings, error: bindingError } = await supabase
    .from('telegram_bindings')
    .select('user_id, telegram_chat_id')
    .eq('is_active', true);

  if (bindingError) {
    return res.status(500).json({ error: bindingError.message });
  }

  const results: Array<{ userId: string; sent: boolean; reason: string; messageType?: string }> = [];

  for (const binding of bindings || []) {
    const userId = binding.user_id as string;
    const { data: snapshots } = await supabase
      .from('inbox_entries')
      .select('ai_result, created_at')
      .eq('user_id', userId)
      .eq('source', 'guidance_snapshot')
      .order('created_at', { ascending: false })
      .limit(1);

    const latest = snapshots?.[0] as { ai_result?: any } | undefined;
    const payload = latest?.ai_result;
    if (!payload?.digest) {
      results.push({ userId, sent: false, reason: 'no_snapshot' });
      continue;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('timezone')
      .eq('id', userId)
      .single();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: deliveries } = await supabase
      .from('inbox_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'guidance_delivery')
      .gte('created_at', since);

    const decision = canSendGuidanceMessage({
      timeZone: profile?.timezone || 'UTC',
      preferences: payload.preferences || {},
      deliveryCount: Array.isArray(deliveries) ? deliveries.length : 0,
      digest: payload.digest,
      question: payload.question || null,
      force: false,
    });

    if (!decision.allowed) {
      results.push({ userId, sent: false, reason: decision.reason || 'skipped' });
      continue;
    }

    if (!dryRun) {
      const message = buildGuidanceTelegramMessage(
        payload.digest,
        payload.question || null,
        decision.messageType
      );
      await sendTelegramMessage(binding.telegram_chat_id as number, message);
      await supabase.from('inbox_entries').insert({
        user_id: userId,
        source: 'guidance_delivery',
        raw_content: `guidance_delivery:${decision.messageType}`,
        content_type: 'text',
        ai_result: {
          messageType: decision.messageType,
          reason: 'cron',
          sentAt: new Date().toISOString(),
          digestGeneratedAt: payload.digest?.generatedAt,
        },
        merged: true,
        merged_at: new Date().toISOString(),
      });
    }

    results.push({ userId, sent: !dryRun, reason: dryRun ? 'dry_run' : 'sent', messageType: decision.messageType });
  }

  return res.status(200).json({
    ok: true,
    dryRun,
    processed: results.length,
    results,
  });
}
