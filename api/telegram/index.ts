// Consolidated Telegram API - reduces from 8 functions to 1
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserIdFromRequest, sendTelegramMessage } from './_helpers.js';
import { handleIncomingMessage } from './_guidance.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/telegram - Check link status
  if (req.method === 'GET' && req.query.action === 'status') {
    return handleGetStatus(req, res);
  }
  
  // POST /api/telegram - Generate link token
  if (req.method === 'POST' && req.query.action === 'link') {
    return handleGenerateLink(req, res);
  }
  
  // POST /api/telegram - Unlink
  if (req.method === 'POST' && req.query.action === 'unlink') {
    return handleUnlink(req, res);
  }
  
  // POST /api/telegram/webhook - Webhook handler
  if (req.method === 'POST' && !req.query.action) {
    return handleWebhook(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGetStatus(req: VercelRequest, res: VercelResponse) {
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

async function handleGenerateLink(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const linkToken = crypto.randomUUID();
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('telegram_bindings')
      .upsert({
        user_id: userId,
        link_token: linkToken,
        is_active: false,
        linked_at: new Date().toISOString()
      });

    if (error) return res.status(500).json({ error: error.message });
    
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'AreteLifeOSBot';
    return res.status(200).json({
      linkToken,
      telegramUrl: `https://t.me/${botUsername}?start=${linkToken}`
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}

async function handleUnlink(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('telegram_bindings')
      .update({ is_active: false, unlinked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  try {
    const update = req.body;
    
    // Verify webhook secret
    const secret = req.headers['x-telegram-bot-api-secret'];
    if (secret !== process.env.TELEGRAM_BOT_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Handle message
    if (update.message?.text) {
      await handleIncomingMessage(update);
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error?.message || 'Internal error' });
  }
}
