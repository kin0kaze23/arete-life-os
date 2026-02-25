import { createClient } from '@supabase/supabase-js';
import { Category, UserRole, type UserProfile } from '../../data';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const getUserIdFromRequest = async (req: any): Promise<string | null> => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
};

export const sendTelegramMessage = async (chatId: number, text: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
};

export const createFallbackProfile = (userId: string): UserProfile => ({
  id: userId,
  role: UserRole.MEMBER,
  privacySettings: {
    viewFinance: true,
    viewHealth: true,
    viewSpiritual: true,
    viewRelationships: true,
  },
  relationships: [],
  lastSyncTimestamp: Date.now(),
  coherenceScore: 100,
  identify: {
    name: 'User',
    birthday: '',
    location: '',
    origin: '',
    ethnicity: '',
    lastUpdated: Date.now(),
  },
  personal: { jobRole: '', company: '', interests: [], lastUpdated: Date.now() },
  health: {
    height: '',
    weight: '',
    sleepTime: '',
    wakeTime: '',
    activities: [],
    activityFrequency: '',
    conditions: [],
    medications: [],
    lastUpdated: Date.now(),
  },
  finances: {
    assetsTotal: '',
    assetsBreakdown: { cash: '', investments: '', property: '', other: '' },
    liabilities: '',
    income: '',
    fixedCosts: '',
    variableCosts: '',
    lastUpdated: Date.now(),
  },
  relationship: {
    relationshipStatus: 'Single',
    livingArrangement: '',
    socialEnergy: '',
    dailyCommitments: [],
    socialGoals: [],
    lastUpdated: Date.now(),
  },
  spiritual: { worldview: '', coreValues: [], practicePulse: '', lastUpdated: Date.now() },
  innerCircle: [],
});

export const normalizeCategoryFromText = (text: string) => {
  const value = text.toLowerCase();
  if (/health|sleep|workout|run|gym|nutrition|meal/.test(value)) return Category.HEALTH;
  if (/money|finance|budget|salary|debt|investment/.test(value)) return Category.FINANCE;
  if (/relationship|friend|partner|family/.test(value)) return Category.RELATIONSHIPS;
  if (/faith|spiritual|prayer|church/.test(value)) return Category.SPIRITUAL;
  if (/career|work|project|learning|skill/.test(value)) return Category.PERSONAL;
  return Category.GENERAL;
};
