import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processInput as processInputAction } from '../_aiActions/processInput.js';
import {
  analyzePhotoWithGemini,
  extractUrls,
  fetchJinaReader,
  isYouTubeUrl,
  processVideoUrl,
} from '../_contentExtractors.js';
import {
  createFallbackProfile,
  getSupabaseAdmin,
  normalizeCategoryFromText,
  sendTelegramMessage,
} from './_helpers.js';

const parseChatId = (message: any): number | null => {
  const chatId = message?.chat?.id;
  return typeof chatId === 'number' ? chatId : null;
};

const getTelegramApiBase = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
  return `https://api.telegram.org/bot${token}`;
};

const getTelegramFileBase = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
  return `https://api.telegram.org/file/bot${token}`;
};

const downloadTelegramFile = async (fileId: string): Promise<Buffer> => {
  const apiBase = getTelegramApiBase();
  const response = await fetch(`${apiBase}/getFile?file_id=${encodeURIComponent(fileId)}`);
  if (!response.ok) throw new Error(`Telegram getFile failed: ${response.status}`);
  const json = (await response.json()) as { ok: boolean; result?: { file_path?: string } };
  const filePath = json?.result?.file_path;
  if (!filePath) throw new Error('Telegram file path missing');

  const fileUrl = `${getTelegramFileBase()}/${filePath}`;
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Telegram file download failed: ${fileRes.status}`);
  const bytes = await fileRes.arrayBuffer();
  return Buffer.from(bytes);
};

const uploadToInboxMedia = async (userId: string, fileBuffer: Buffer, extension = 'jpg') => {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from('inbox-media')
    .upload(path, fileBuffer, { contentType: 'image/jpeg', upsert: false });

  if (error) {
    throw new Error(`Failed to upload image to Supabase storage: ${error.message}`);
  }

  return path;
};

const formatAiResultSummary = (result: any): string => {
  const items = Array.isArray(result?.items) ? result.items : [];
  if (items.length === 0) return 'Captured. Open dashboard Inbox to review and merge.';
  const top = items.slice(0, 3).map((item: any) => item.title || item.content || 'Entry');
  return `Detected ${items.length} item(s): ${top.join(' · ')}`;
};

const handleLinkCommand = async (chatId: number, token: string, message: any) => {
  const supabase = getSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, telegram_link_token, telegram_link_expires_at')
    .eq('telegram_link_token', token)
    .single();

  if (error || !profile) {
    await sendTelegramMessage(chatId, 'Invalid or expired link token. Generate a new one in Settings.');
    return;
  }

  const expiresAt = profile.telegram_link_expires_at
    ? new Date(profile.telegram_link_expires_at).getTime()
    : 0;

  if (!expiresAt || Date.now() > expiresAt) {
    await sendTelegramMessage(chatId, 'That link token has expired. Generate a fresh code in Settings.');
    return;
  }

  const { error: bindingError } = await supabase.from('telegram_bindings').upsert(
    {
      user_id: profile.id,
      telegram_chat_id: chatId,
      telegram_username: message?.from?.username || null,
      telegram_first_name: message?.from?.first_name || null,
      is_active: true,
    },
    { onConflict: 'telegram_chat_id' }
  );

  if (bindingError) {
    await sendTelegramMessage(chatId, `Link failed: ${bindingError.message}`);
    return;
  }

  await supabase
    .from('user_profiles')
    .update({ telegram_link_token: null, telegram_link_expires_at: null })
    .eq('id', profile.id);

  await sendTelegramMessage(chatId, 'Linked successfully. Send text, URLs, photos, or YouTube links anytime.');
};

const processInputForUser = async (rawContent: string, userId: string) => {
  return await processInputAction({
    input: rawContent,
    history: [],
    activeProfile: createFallbackProfile(userId),
    familyMembers: [],
    fileMeta: [],
    currentDate: new Date().toISOString(),
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (!secret || secret !== process.env.TELEGRAM_BOT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const update = req.body;
  const message = update?.message;
  if (!message) return res.status(200).end();

  const chatId = parseChatId(message);
  if (!chatId) return res.status(200).end();

  const supabase = getSupabaseAdmin();

  if (typeof message?.text === 'string' && message.text.startsWith('/link ')) {
    const token = message.text.replace('/link ', '').trim();
    await handleLinkCommand(chatId, token, message);
    return res.status(200).end();
  }

  const { data: binding } = await supabase
    .from('telegram_bindings')
    .select('user_id')
    .eq('telegram_chat_id', chatId)
    .eq('is_active', true)
    .single();

  if (!binding) {
    await sendTelegramMessage(
      chatId,
      "I don't recognise you yet. Open Areté > Settings > Telegram and generate a link code."
    );
    return res.status(200).end();
  }

  const userId = binding.user_id as string;

  try {
    let rawContent = '';
    let contentType: 'text' | 'image' | 'url' | 'video' = 'text';
    let sourceUrl: string | undefined;
    let mediaStoragePath: string | undefined;

    if (Array.isArray(message.photo) && message.photo.length > 0) {
      const photo = message.photo[message.photo.length - 1];
      const buffer = await downloadTelegramFile(photo.file_id);
      rawContent = await analyzePhotoWithGemini(buffer, message.caption);
      contentType = 'image';
      mediaStoragePath = await uploadToInboxMedia(userId, buffer);
    } else if (typeof message.text === 'string') {
      const urls = extractUrls(message.text);
      if (urls.length > 0) {
        const url = urls[0];
        sourceUrl = url;
        if (isYouTubeUrl(url)) {
          const transcript = await processVideoUrl(url);
          rawContent = `[Video] ${url}\n\n${transcript}`;
          contentType = 'video';
        } else {
          const pageContent = await fetchJinaReader(url);
          rawContent = `[URL] ${url}\n\n${pageContent}`;
          contentType = 'url';
        }
      } else {
        rawContent = message.text;
      }
    } else if (message.caption) {
      rawContent = message.caption;
    } else {
      rawContent = 'Telegram entry';
    }

    if (message.voice || message.audio) {
      await sendTelegramMessage(chatId, 'Voice notes are not supported yet. Please send text for now.');
      return res.status(200).end();
    }

    const aiResult = await processInputForUser(rawContent, userId);

    const { error } = await supabase.from('inbox_entries').insert({
      user_id: userId,
      source: 'telegram',
      raw_content: rawContent,
      content_type: contentType,
      source_url: sourceUrl,
      media_storage_path: mediaStoragePath,
      ai_result: aiResult,
    });

    if (error) {
      throw new Error(error.message);
    }

    const summary = formatAiResultSummary(aiResult);
    await sendTelegramMessage(chatId, `✓ Logged\n${summary}`);
  } catch (error: any) {
    console.error('[telegram:webhook] error', error?.message || error);
    await sendTelegramMessage(chatId, "Sorry, I couldn't process that. Please try again.");

    const fallbackCategory = normalizeCategoryFromText(String(message.text || message.caption || ''));
    await supabase.from('inbox_entries').insert({
      user_id: userId,
      source: 'telegram',
      raw_content: String(message.text || message.caption || 'Telegram entry'),
      content_type: 'text',
      ai_result: {
        intent: 'memory',
        items: [
          {
            id: `fallback-${Date.now()}`,
            type: 'memory',
            intent: 'memory',
            domain: fallbackCategory,
            ownerId: userId,
            content: String(message.text || message.caption || 'Telegram entry'),
            confidence: 0.5,
          },
        ],
        missingData: [],
        confidence: 0.5,
      },
    });
  }

  return res.status(200).end();
}
