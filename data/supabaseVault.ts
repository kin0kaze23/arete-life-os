import {
  ActionType,
  AlwaysChip,
  AuditLogEntry,
  BlindSpot,
  Category,
  Claim,
  DailyTask,
  DashboardLayout,
  GuidanceDigest,
  GuidancePreferences,
  GuidanceQuestion,
  Goal,
  MemoryItem,
  ProactiveInsight,
  PromptConfig,
  Recommendation,
  RuleOfLife,
  Source,
  TimelineEvent,
  FamilySpace,
} from './types';
import { requireSupabase } from './supabaseClient';
import type { EntrySource, InboxEntry, EntryType, VaultEntryRow } from './supabaseTypes';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const encryptEntry = async (plaintext: string, key: CryptoKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  return { ciphertext: toBase64(new Uint8Array(cipher)), iv: toBase64(iv) };
};

export const decryptEntry = async (ciphertext: string, iv: string, key: CryptoKey) => {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext)
  );
  return decoder.decode(plain);
};

export interface CloudVaultSnapshot {
  version: number;
  isOnboarded: boolean;
  familySpace: FamilySpace;
  activeUserId: string;
  sources: Source[];
  memoryItems: MemoryItem[];
  claims: Claim[];
  tasks: DailyTask[];
  recommendations: Recommendation[];
  goals: Goal[];
  auditLogs: AuditLogEntry[];
  timelineEvents: TimelineEvent[];
  insights: ProactiveInsight[];
  blindSpots: BlindSpot[];
  guidanceDigest?: GuidanceDigest | null;
  guidanceQuestions?: GuidanceQuestion[];
  guidancePreferences?: GuidancePreferences;
  dailyPlan: DailyTask[];
  ruleOfLife: RuleOfLife;
  prompts: PromptConfig[];
  layouts: Record<string, DashboardLayout>;
  alwaysDo?: AlwaysChip[];
  alwaysWatch?: AlwaysChip[];
}

type EntryPayload = {
  entry_type: EntryType;
  entry_id: string;
  payload: unknown;
  category?: string;
  sentiment?: string;
  loggedAt: string;
};

const buildEntryPayloads = (snapshot: CloudVaultSnapshot): EntryPayload[] => {
  const payloads: EntryPayload[] = [];

  snapshot.memoryItems.forEach((item) => {
    payloads.push({
      entry_type: 'memory',
      entry_id: item.id,
      payload: item,
      category: item.category || Category.GENERAL,
      sentiment: item.sentiment,
      loggedAt: new Date(item.timestamp || Date.now()).toISOString(),
    });
  });

  snapshot.claims.forEach((item) => {
    payloads.push({
      entry_type: 'claim',
      entry_id: item.id,
      payload: item,
      category: item.category,
      loggedAt: new Date(item.timestamp || Date.now()).toISOString(),
    });
  });

  snapshot.tasks.forEach((item) => {
    payloads.push({
      entry_type: 'task',
      entry_id: item.id,
      payload: item,
      category: item.category,
      loggedAt: new Date(item.createdAt || Date.now()).toISOString(),
    });
  });

  snapshot.timelineEvents.forEach((item) => {
    payloads.push({
      entry_type: 'event',
      entry_id: item.id,
      payload: item,
      category: item.category,
      loggedAt: new Date(item.createdAt || Date.now()).toISOString(),
    });
  });

  snapshot.goals.forEach((item) => {
    payloads.push({
      entry_type: 'goal',
      entry_id: item.id,
      payload: item,
      category: item.category,
      loggedAt: new Date(item.createdAt || Date.now()).toISOString(),
    });
  });

  snapshot.recommendations.forEach((item) => {
    payloads.push({
      entry_type: 'recommendation',
      entry_id: item.id,
      payload: item,
      category: item.category,
      loggedAt: new Date(item.createdAt || Date.now()).toISOString(),
    });
  });

  snapshot.blindSpots.forEach((item) => {
    payloads.push({
      entry_type: 'blindspot',
      entry_id: item.id,
      payload: item,
      loggedAt: new Date(item.createdAt || Date.now()).toISOString(),
    });
  });

  payloads.push({
    entry_type: 'profile',
    entry_id: 'main',
    payload: {
      isOnboarded: snapshot.isOnboarded,
      familySpace: snapshot.familySpace,
      activeUserId: snapshot.activeUserId,
      sources: snapshot.sources,
      auditLogs: snapshot.auditLogs,
      insights: snapshot.insights,
      guidanceDigest: snapshot.guidanceDigest || null,
      guidanceQuestions: snapshot.guidanceQuestions || [],
      guidancePreferences: snapshot.guidancePreferences || null,
      dailyPlan: snapshot.dailyPlan,
      prompts: snapshot.prompts,
      layouts: snapshot.layouts,
      alwaysDo: snapshot.alwaysDo || [],
      alwaysWatch: snapshot.alwaysWatch || [],
      version: snapshot.version,
    },
    loggedAt: new Date().toISOString(),
  });

  payloads.push({
    entry_type: 'rule_of_life',
    entry_id: 'main',
    payload: snapshot.ruleOfLife,
    loggedAt: new Date().toISOString(),
  });

  return payloads;
};

const insertRows = async (
  userId: string,
  rows: EntryPayload[],
  key: CryptoKey,
  source: EntrySource
) => {
  const supabase = requireSupabase();
  const payloadRows: Array<{
    user_id: string;
    entry_type: EntryType;
    entry_id: string;
    encrypted_data: string;
    iv: string;
    category?: string;
    sentiment?: any;
    source: EntrySource;
    logged_at: string;
  }> = [];

  for (const row of rows) {
    const encrypted = await encryptEntry(JSON.stringify(row.payload), key);
    payloadRows.push({
      user_id: userId,
      entry_type: row.entry_type,
      entry_id: row.entry_id,
      encrypted_data: encrypted.ciphertext,
      iv: encrypted.iv,
      category: row.category,
      sentiment: row.sentiment as any,
      source,
      logged_at: row.loggedAt,
    });
  }

  if (payloadRows.length === 0) return;

  const { error } = await (supabase as any)
    .from('vault_entries')
    .upsert(payloadRows, { onConflict: 'user_id,entry_type,entry_id' });

  if (error) {
    throw new Error(`Failed to write vault entries: ${error.message}`);
  }
};

const deleteRemovedRows = async (userId: string, desiredRows: EntryPayload[]) => {
  const supabase = requireSupabase();
  const desiredKeys = new Set(desiredRows.map((row) => `${row.entry_type}:${row.entry_id}`));

  const { data, error } = await (supabase as any)
    .from('vault_entries')
    .select('entry_type,entry_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to read existing vault entries: ${error.message}`);
  }

  const stale = (data || []).filter(
    (row) => !desiredKeys.has(`${row.entry_type as EntryType}:${row.entry_id as string}`)
  );

  if (stale.length === 0) return;

  for (const row of stale) {
    const { error: deleteError } = await (supabase as any)
      .from('vault_entries')
      .delete()
      .eq('user_id', userId)
      .eq('entry_type', row.entry_type)
      .eq('entry_id', row.entry_id);

    if (deleteError) {
      throw new Error(`Failed to remove stale vault entry: ${deleteError.message}`);
    }
  }
};

export const syncVaultSnapshotToSupabase = async (
  userId: string,
  key: CryptoKey,
  snapshot: CloudVaultSnapshot,
  source: EntrySource = 'dashboard'
) => {
  const rows = buildEntryPayloads(snapshot);
  await insertRows(userId, rows, key, source);
  await deleteRemovedRows(userId, rows);
};

const safeParse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const sortByDesc = <T extends { createdAt?: number; timestamp?: number }>(items: T[]) =>
  [...items].sort((a, b) => {
    const aTime = a.timestamp || a.createdAt || 0;
    const bTime = b.timestamp || b.createdAt || 0;
    return bTime - aTime;
  });

export const loadVaultSnapshotFromSupabase = async (
  userId: string,
  key: CryptoKey,
  fallbackSnapshot: CloudVaultSnapshot
): Promise<CloudVaultSnapshot | null> => {
  const supabase = requireSupabase();
  const { data, error } = await (supabase as any)
    .from('vault_entries')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load vault entries: ${error.message}`);
  }

  const rows = (data || []) as VaultEntryRow[];
  if (rows.length === 0) return null;

  const snapshot: CloudVaultSnapshot = {
    ...fallbackSnapshot,
    memoryItems: [],
    claims: [],
    tasks: [],
    timelineEvents: [],
    goals: [],
    recommendations: [],
    blindSpots: [],
  };

  for (const row of rows) {
    try {
      const decrypted = await decryptEntry(row.encrypted_data, row.iv, key);
      const parsed = safeParse<any>(decrypted, null);
      if (!parsed) continue;

      switch (row.entry_type) {
        case 'memory':
          snapshot.memoryItems.push(parsed as MemoryItem);
          break;
        case 'claim':
          snapshot.claims.push(parsed as Claim);
          break;
        case 'task':
          snapshot.tasks.push(parsed as DailyTask);
          break;
        case 'event':
          snapshot.timelineEvents.push(parsed as TimelineEvent);
          break;
        case 'goal':
          snapshot.goals.push(parsed as Goal);
          break;
        case 'recommendation':
          snapshot.recommendations.push(parsed as Recommendation);
          break;
        case 'blindspot':
          snapshot.blindSpots.push(parsed as BlindSpot);
          break;
        case 'profile':
          snapshot.isOnboarded = Boolean(parsed.isOnboarded);
          snapshot.familySpace = parsed.familySpace || snapshot.familySpace;
          snapshot.activeUserId = parsed.activeUserId || snapshot.activeUserId;
          snapshot.sources = Array.isArray(parsed.sources) ? parsed.sources : snapshot.sources;
          snapshot.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : snapshot.auditLogs;
          snapshot.insights = Array.isArray(parsed.insights) ? parsed.insights : snapshot.insights;
          snapshot.guidanceDigest = parsed.guidanceDigest || snapshot.guidanceDigest;
          snapshot.guidanceQuestions = Array.isArray(parsed.guidanceQuestions)
            ? parsed.guidanceQuestions
            : snapshot.guidanceQuestions;
          snapshot.guidancePreferences =
            parsed.guidancePreferences || snapshot.guidancePreferences;
          snapshot.dailyPlan = Array.isArray(parsed.dailyPlan) ? parsed.dailyPlan : snapshot.dailyPlan;
          snapshot.prompts = Array.isArray(parsed.prompts) ? parsed.prompts : snapshot.prompts;
          snapshot.layouts = parsed.layouts || snapshot.layouts;
          snapshot.alwaysDo = Array.isArray(parsed.alwaysDo) ? parsed.alwaysDo : snapshot.alwaysDo;
          snapshot.alwaysWatch = Array.isArray(parsed.alwaysWatch)
            ? parsed.alwaysWatch
            : snapshot.alwaysWatch;
          snapshot.version = typeof parsed.version === 'number' ? parsed.version : snapshot.version;
          break;
        case 'rule_of_life':
          snapshot.ruleOfLife = parsed as RuleOfLife;
          break;
      }
    } catch {
      // Ignore corrupted rows and continue loading remaining data.
    }
  }

  snapshot.memoryItems = sortByDesc(snapshot.memoryItems);
  snapshot.claims = sortByDesc(snapshot.claims);
  snapshot.tasks = sortByDesc(snapshot.tasks);
  snapshot.timelineEvents = sortByDesc(snapshot.timelineEvents);
  snapshot.goals = sortByDesc(snapshot.goals);
  snapshot.recommendations = sortByDesc(snapshot.recommendations);
  snapshot.blindSpots = sortByDesc(snapshot.blindSpots);

  return snapshot;
};

export const loadInboxEntries = async (userId: string): Promise<InboxEntry[]> => {
  const supabase = requireSupabase();
  const { data, error } = await (supabase as any)
    .from('inbox_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('merged', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load inbox entries: ${error.message}`);
  }

  return (data || []) as InboxEntry[];
};

export const markInboxEntriesMerged = async (userId: string, ids: string[]) => {
  if (ids.length === 0) return;
  const supabase = requireSupabase();
  const { error } = await (supabase as any)
    .from('inbox_entries')
    .update({ merged: true, merged_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to merge inbox entries: ${error.message}`);
  }
};
