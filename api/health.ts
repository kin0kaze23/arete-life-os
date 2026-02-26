export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const defaultProvider = (process.env.AI_DEFAULT_PROVIDER || 'openai').toLowerCase();
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasXAIKey = Boolean(process.env.XAI_API_KEY);

  const providerKeyMap: Record<string, boolean> = {
    openai: hasOpenAIKey,
    gemini: hasGeminiKey,
    xai: hasXAIKey,
  };

  const aiConfigured =
    Boolean(providerKeyMap[defaultProvider]) || hasOpenAIKey || hasGeminiKey || hasXAIKey;

  const hasTelegramBotToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasTelegramWebhookSecret = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);

  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      ai: {
        configured: aiConfigured,
        defaultProvider,
        hasOpenAIKey,
        hasGeminiKey,
        hasXAIKey,
      },
      telegram: {
        configured: hasTelegramBotToken && hasTelegramWebhookSecret,
        hasBotToken: hasTelegramBotToken,
        hasWebhookSecret: hasTelegramWebhookSecret,
      },
      storage: {
        hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      },
      runtime: {
        node: process.version,
        vercelEnv: process.env.VERCEL_ENV || null,
        region: process.env.VERCEL_REGION || null,
      },
    },
  });
}
