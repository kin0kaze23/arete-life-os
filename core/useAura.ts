import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActionType,
  AlwaysChip,
  AuditLogEntry,
  BlindSpot,
  CategorizedFact,
  Category,
  Claim,
  ClaimStatus,
  DashboardLayout,
  DailyTask,
  FamilySpace,
  FinanceMetrics,
  Goal,
  IntakeHorizon,
  IntakeIntent,
  IntakeItem,
  IntakeItemType,
  IntakeResult,
  MemoryEntry,
  MemoryItem,
  ProactiveInsight,
  PromptConfig,
  Recommendation,
  RuleOfLife,
  Source,
  TimelineEvent,
  UserProfile,
  UserRole,
  ProposedUpdate,
  calculateClaimConfidence,
  computeFinanceMetrics,
  deleteFile,
  extractFinanceMetricsFromMemory,
  putFile,
  isSupabaseConfigured,
  supabase,
  loadVaultSnapshotFromSupabase,
  syncVaultSnapshotToSupabase,
  loadInboxEntries,
  markInboxEntriesMerged,
  migrateLocalVaultToSupabase,
  InboxEntry,
} from '@/data';
import { contentHash } from '@/shared';
import { LogRouter } from '@/command';
import {
  processInput,
  generateDailyPlan,
  generateDeepTasks,
  generateDeepInitialization,
  DEFAULT_PROMPTS,
  dailyIntelligenceBatch,
} from '@/ai/geminiService';
import {
  clearVault,
  createVault,
  exportVault,
  getVaultStorageUsage,
  hasVault as hasEncryptedVault,
  importVault,
  saveVault,
  unlockVault,
  exportAllFiles,
  importAllFiles,
} from '@/data';
import { isLikelyEvent, parseDateTimeFromText, extractLinks } from './eventUtils';
import { parseLogDeterministically } from './logParser';

const APP_VERSION = '3.2.0';
const VAULT_INACTIVITY_MS = 15 * 60 * 1000;
const DEFAULT_TELEGRAM_INBOX_REVIEW_CONFIDENCE = 0.65;
const PERF_MARKERS = {
  logStart: 'arete-log-start',
  logAiEnd: 'arete-ai-initial-end',
  refreshStart: 'arete-refresh-start',
  refreshEnd: 'arete-refresh-end',
  persistStart: 'arete-persist-start',
  persistEnd: 'arete-persist-end',
};

const markPerf = (name: string) => {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') return;
  performance.mark(name);
};

const measurePerf = (name: string, start: string, end: string) => {
  if (typeof performance === 'undefined' || typeof performance.measure !== 'function') return;
  try {
    performance.measure(name, start, end);
  } finally {
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks(start);
      performance.clearMarks(end);
    }
  }
};

const INITIAL_RULE_OF_LIFE: RuleOfLife = {
  season: { name: 'Growth', intensity: 5, context: 'Standard operational focus.' },
  valuesRoles: { values: ['Integrity', 'Excellence'], roles: ['Individual'] },
  weeklyRhythm: { startOfWeek: 'Monday', blockedTimes: [] },
  nonNegotiables: { sleepWindow: '11pm - 7am', sabbath: 'Sunday', devotion: 'Morning Calibration' },
  taskPreferences: { dailyCap: 3, energyOffset: 'Balanced', includeWeekends: false },
};

const buildMissingData = (profile: UserProfile) => {
  const missing: string[] = [];
  if (!profile.finances.income) missing.push('monthly_income');
  if (!profile.finances.fixedCosts) missing.push('monthly_fixed_expenses');
  if (!profile.finances.variableCosts) missing.push('monthly_variable_expenses');
  if (!profile.health.weight) missing.push('health_weight');
  if (!profile.health.activityFrequency) missing.push('activity_frequency');
  if (!profile.health.conditions || profile.health.conditions.length === 0)
    missing.push('health_conditions');
  if (!profile.relationship.socialEnergy) missing.push('social_energy');
  if (!profile.spiritual.coreValues || profile.spiritual.coreValues.length === 0)
    missing.push('core_values');
  return missing;
};

const inferCategory = (content: string, facts: CategorizedFact[]): Category => {
  const text = content.toLowerCase();

  if (text.match(/\b(health|sleep|weight|exercise|gym|doctor|medication|clinic)\b/))
    return Category.HEALTH;
  if (text.match(/\b(money|budget|spend|income|salary|invest|save|debt)\b/))
    return Category.FINANCE;
  if (text.match(/\b(family|friend|partner|relationship|social|date)\b/))
    return Category.RELATIONSHIPS;
  if (text.match(/\b(pray|church|meditat|spiritual|faith|god|devotion)\b/))
    return Category.SPIRITUAL;
  if (text.match(/\b(work|job|meeting|project|deadline|client|career)\b/)) return Category.WORK;
  if (text.match(/\b(hobby|interest|goal|personal|self|learning)\b/)) return Category.PERSONAL;

  if (facts.length > 0 && facts[0].category && facts[0].category !== Category.GENERAL) {
    return facts[0].category;
  }

  return Category.GENERAL;
};

const normalizeCategory = (value: unknown): Category =>
  Object.values(Category).includes(value as Category) ? (value as Category) : Category.GENERAL;

const detectHabit = (input: string) => {
  if (input.trim().startsWith('/')) return null;
  const text = input.toLowerCase();
  const isHabit =
    text.includes('habit') ||
    text.includes('every day') ||
    text.includes('daily') ||
    text.includes('each day') ||
    text.includes('every morning') ||
    text.includes('every night') ||
    text.includes('weekly') ||
    text.includes('every week') ||
    text.includes('each week');
  if (!isHabit) return null;
  const frequency =
    text.includes('weekly') || text.includes('every week') || text.includes('each week')
      ? 'weekly'
      : 'daily';
  const title = input.replace(/^habit[:\s-]*/i, '').trim();
  return {
    title: title.length > 0 ? title : 'New habit',
    frequency,
  };
};

const normalizeIntakeIntent = (value: unknown): IntakeIntent => {
  const allowed: IntakeIntent[] = [
    'memory',
    'event',
    'habit',
    'health',
    'finance',
    'relationship',
    'spiritual',
    'profile_update',
    'config_update',
    'task_request',
    'query',
    'unknown',
  ];
  if (typeof value !== 'string') return 'unknown';
  return allowed.includes(value as IntakeIntent) ? (value as IntakeIntent) : 'unknown';
};

const normalizeIntakeType = (value: unknown): IntakeItemType => {
  const allowed: IntakeItemType[] = [
    'memory',
    'event',
    'task',
    'task_request',
    'habit',
    'profile_update',
    'config_update',
    'health_record',
    'finance_record',
    'relationship_note',
    'spiritual_note',
    'document',
    'link',
    'needs_review',
  ];
  if (typeof value !== 'string') return 'memory';
  return allowed.includes(value as IntakeItemType) ? (value as IntakeItemType) : 'memory';
};

const normalizeHorizon = (value: unknown): IntakeHorizon => {
  const allowed: IntakeHorizon[] = ['now', 'soon', 'always', 'unknown'];
  if (typeof value !== 'string') return 'unknown';
  return allowed.includes(value as IntakeHorizon) ? (value as IntakeHorizon) : 'unknown';
};

const coerceConfidence = (value: unknown, fallback = 0.5) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, value));
};

const buildFallbackIntent = (input: string): IntakeIntent => {
  const classified = LogRouter.classifyIntent(input);
  if (classified === 'QUERY') return 'query';
  if (classified === 'TASK') return 'task_request';
  if (classified === 'CONFIG') return 'config_update';
  return 'memory';
};

const createNewProfile = (
  id: string,
  name: string,
  role: UserRole = UserRole.MEMBER
): UserProfile => ({
  id,
  role,
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
    name,
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

const INITIAL_PROFILE = createNewProfile('admin-1', 'Admin', UserRole.ADMIN);

const INITIAL_FAMILY: FamilySpace = {
  id: 'family-root',
  familyName: 'Collective',
  members: [INITIAL_PROFILE],
  sharedResources: { vaultId: 'vault-root' },
};

const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: [
    { id: 'w-mission', type: 'MISSION', x: 0, y: 0, w: 12, h: 6, isPinned: true },
    { id: 'w-resonance', type: 'NEURAL_RESONANCE', x: 0, y: 6, w: 6, h: 4 },
    { id: 'w-goals', type: 'GOALS', x: 6, y: 6, w: 6, h: 4 },
    { id: 'w-radar', type: 'RADAR', x: 0, y: 10, w: 4, h: 6 },
    { id: 'w-insights', type: 'INSIGHTS', x: 4, y: 10, w: 8, h: 6 },
  ],
};

type VaultData = {
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
  dailyPlan: DailyTask[];
  ruleOfLife: RuleOfLife;
  prompts: PromptConfig[];
  layouts: Record<string, DashboardLayout>;
  alwaysDo?: AlwaysChip[];
  alwaysWatch?: AlwaysChip[];
  lifeContextSnapshots?: any[];
  latestDimensionSnapshots?: Record<string, any>;
  lastSessionScores?: Record<string, number>;
  dashboardPreferences?: Record<string, any>;
};

const LEGACY_KEYS = [
  'aura_onboarded',
  'aura_family_space',
  'aura_active_user_id',
  'aura_sources',
  'aura_memory_items',
  'aura_claims',
  'aura_tasks',
  'aura_recommendations',
  'aura_goals',
  'aura_audit_logs',
  'aura_timeline_events',
  'aura_insights',
  'aura_blind_spots',
  'aura_daily_plan',
  'aura_rule_of_life',
];

const buildDefaultVault = (): VaultData => ({
  version: 1,
  isOnboarded: false,
  familySpace: INITIAL_FAMILY,
  activeUserId: INITIAL_PROFILE.id,
  sources: [],
  memoryItems: [],
  claims: [],
  tasks: [],
  recommendations: [],
  goals: [],
  auditLogs: [],
  timelineEvents: [],
  insights: [],
  blindSpots: [],
  dailyPlan: [],
  ruleOfLife: INITIAL_RULE_OF_LIFE,
  prompts: DEFAULT_PROMPTS,
  layouts: { [INITIAL_PROFILE.id]: DEFAULT_LAYOUT },
  alwaysDo: [],
  alwaysWatch: [],
  lifeContextSnapshots: [],
  latestDimensionSnapshots: {},
  lastSessionScores: {},
  dashboardPreferences: {},
});

const detectLegacyData = () => {
  if (typeof window === 'undefined') return false;
  const keys = Object.keys(localStorage);
  return keys.some(
    (key) =>
      (LEGACY_KEYS.includes(key) || key.startsWith('aura_layout_')) &&
      key !== 'aura_vault_v1' &&
      key !== 'aura_vault_meta_v1'
  );
};

const readLegacyLayouts = (activeUserId: string) => {
  const layouts: Record<string, DashboardLayout> = {};
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('aura_layout_')) {
      const userId = key.replace('aura_layout_', '');
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          layouts[userId] = JSON.parse(raw);
        } catch {}
      }
    }
  });
  if (!layouts[activeUserId]) layouts[activeUserId] = DEFAULT_LAYOUT;
  return layouts;
};

const buildLegacyVault = (): VaultData => {
  const activeUserId = localStorage.getItem('aura_active_user_id') || INITIAL_PROFILE.id;
  const familySpace = (() => {
    const raw = localStorage.getItem('aura_family_space');
    return raw ? JSON.parse(raw) : INITIAL_FAMILY;
  })();
  return {
    version: 1,
    isOnboarded: localStorage.getItem('aura_onboarded') === 'true',
    familySpace,
    activeUserId,
    sources: JSON.parse(localStorage.getItem('aura_sources') || '[]'),
    memoryItems: JSON.parse(localStorage.getItem('aura_memory_items') || '[]'),
    claims: JSON.parse(localStorage.getItem('aura_claims') || '[]'),
    tasks: JSON.parse(localStorage.getItem('aura_tasks') || '[]'),
    recommendations: JSON.parse(localStorage.getItem('aura_recommendations') || '[]'),
    goals: JSON.parse(localStorage.getItem('aura_goals') || '[]'),
    auditLogs: JSON.parse(localStorage.getItem('aura_audit_logs') || '[]'),
    timelineEvents: JSON.parse(localStorage.getItem('aura_timeline_events') || '[]'),
    insights: JSON.parse(localStorage.getItem('aura_insights') || '[]'),
    blindSpots: JSON.parse(localStorage.getItem('aura_blind_spots') || '[]'),
    dailyPlan: JSON.parse(localStorage.getItem('aura_daily_plan') || '[]'),
    ruleOfLife: (() => {
      const raw = localStorage.getItem('aura_rule_of_life');
      return raw ? JSON.parse(raw) : INITIAL_RULE_OF_LIFE;
    })(),
    prompts: DEFAULT_PROMPTS,
    layouts: readLegacyLayouts(activeUserId),
  };
};

const clearLegacyData = () => {
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  Object.keys(localStorage)
    .filter((key) => key.startsWith('aura_layout_'))
    .forEach((key) => localStorage.removeItem(key));
};

export const useAura = () => {
  const keyRef = useRef<CryptoKey | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const vaultSaveTimeoutRef = useRef<number | null>(null);
  const memoryHashIndexRef = useRef<Set<string>>(new Set());
  const lastDailyBatchRef = useRef<number | null>(null);
  const lastDeepTasksRef = useRef<number | null>(null);
  const [hasVault, setHasVault] = useState<boolean>(() =>
    typeof window !== 'undefined' ? hasEncryptedVault() : false
  );
  const [hasLegacyData, setHasLegacyData] = useState<boolean>(() =>
    typeof window !== 'undefined' ? detectLegacyData() : false
  );
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [cloudUserId, setCloudUserId] = useState<string | null>(() =>
    import.meta.env.VITE_E2E ? 'e2e-user' : null
  );
  const [cloudMigration, setCloudMigration] = useState<{
    status: 'idle' | 'running' | 'done' | 'error';
    message?: string;
    migrated?: number;
  }>({ status: 'idle' });
  const [inboxEntries, setInboxEntries] = useState<InboxEntry[]>([]);
  const [inboxAutoMerge, setInboxAutoMerge] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('arete:inboxAutoMerge') === 'true';
  });
  const [inboxReviewConfidence, setInboxReviewConfidence] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_TELEGRAM_INBOX_REVIEW_CONFIDENCE;
    const raw = Number(localStorage.getItem('arete:inboxReviewConfidence'));
    const fallback = DEFAULT_TELEGRAM_INBOX_REVIEW_CONFIDENCE;
    return coerceConfidence(Number.isFinite(raw) ? raw : fallback, fallback);
  });
  const [telegram, setTelegram] = useState<{
    linked: boolean;
    username?: string;
    firstName?: string;
    linkedAt?: string;
    linkCode?: string | null;
    linkCodeExpiresAt?: number | null;
  }>({ linked: false });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [familySpace, setFamilySpace] = useState<FamilySpace>(INITIAL_FAMILY);
  const [activeUserId, setActiveUserId] = useState<string>(INITIAL_PROFILE.id);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [storageUsage, setStorageUsage] = useState<number>(0);

  const rebuildMemoryHashIndex = useCallback((items: MemoryItem[]) => {
    memoryHashIndexRef.current = new Set(items.map((item) => contentHash(item.content)));
  }, []);

  const ensureMemoryHashIndex = useCallback(
    (items: MemoryItem[]) => {
      if (memoryHashIndexRef.current.size !== items.length) {
        rebuildMemoryHashIndex(items);
      }
    },
    [rebuildMemoryHashIndex]
  );

  useEffect(() => {
    setFamilySpace((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === profile.id ? profile : m)),
    }));
  }, [profile]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    const initialize = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setCloudUserId(data.user?.id || null);
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudUserId(session?.user?.id || null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('arete:inboxAutoMerge', inboxAutoMerge ? 'true' : 'false');
  }, [inboxAutoMerge]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('arete:inboxReviewConfidence', String(inboxReviewConfidence));
  }, [inboxReviewConfidence]);

  const handleSwitchUser = (id: string) => {
    const nextProfile = familySpace.members.find((m) => m.id === id);
    if (nextProfile) {
      setActiveUserId(id);
      setProfile(nextProfile);
      setLayout(layouts[id] || DEFAULT_LAYOUT);
    }
  };

  const [sources, setSources] = useState<Source[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [prompts, setPrompts] = useState<PromptConfig[]>(DEFAULT_PROMPTS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [blindSpots, setBlindSpots] = useState<BlindSpot[]>([]);
  const [dailyPlan, setDailyPlan] = useState<DailyTask[]>([]);
  const [ruleOfLife, setRuleOfLife] = useState<RuleOfLife>(INITIAL_RULE_OF_LIFE);
  const [layouts, setLayouts] = useState<Record<string, DashboardLayout>>({
    [INITIAL_PROFILE.id]: DEFAULT_LAYOUT,
  });
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [alwaysDo, setAlwaysDo] = useState<AlwaysChip[]>([]);
  const [alwaysWatch, setAlwaysWatch] = useState<AlwaysChip[]>([]);
  const [lifeContextSnapshots, setLifeContextSnapshots] = useState<any[]>([]);
  const [latestDimensionSnapshots, setLatestDimensionSnapshots] = useState<Record<string, any>>({});
  const [lastSessionScores, setLastSessionScores] = useState<Record<string, number>>({});
  const [dashboardPreferences, setDashboardPreferences] = useState<Record<string, any>>({});
  const [lifeContextSignalHandler, setLifeContextSignalHandler] = useState<any>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlanningDay, setIsPlanningDay] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'complete' | 'delete';
    task: DailyTask;
  } | null>(null);

  const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
  const mergePrompts = (value?: PromptConfig[]) => {
    const existing = Array.isArray(value) ? value : [];
    const byId = new Map(existing.map((prompt) => [prompt.id, prompt]));
    return DEFAULT_PROMPTS.map((prompt) => byId.get(prompt.id) || prompt);
  };

  const applyVaultData = useCallback(
    (data: VaultData) => {
      setIsOnboarded(data.isOnboarded);

      // Migration: Ensure all members have relationships array (legacy vaults may not have this)
      data.familySpace.members.forEach((member) => {
        if (!Array.isArray(member.relationships)) {
          member.relationships = [];
        }
      });

      setFamilySpace(data.familySpace);
      setActiveUserId(data.activeUserId);
      const nextProfile =
        data.familySpace.members.find((m) => m.id === data.activeUserId) ||
        data.familySpace.members[0];

      setProfile(nextProfile);
      setSources(ensureArray<Source>(data.sources));
      const nextMemoryItems = ensureArray<MemoryItem>(data.memoryItems);
      setMemoryItems(nextMemoryItems);
      rebuildMemoryHashIndex(nextMemoryItems);
      setClaims(ensureArray<Claim>(data.claims));
      setTasks(ensureArray<DailyTask>(data.tasks));
      setRecommendations(ensureArray<Recommendation>(data.recommendations));
      setGoals(ensureArray<Goal>(data.goals));
      setAuditLogs(ensureArray<AuditLogEntry>(data.auditLogs));
      setTimelineEvents(ensureArray<TimelineEvent>(data.timelineEvents));
      setInsights(ensureArray<ProactiveInsight>(data.insights));
      setBlindSpots(ensureArray<BlindSpot>(data.blindSpots));
      setDailyPlan(ensureArray<DailyTask>(data.dailyPlan));
      setRuleOfLife(data.ruleOfLife || INITIAL_RULE_OF_LIFE);
      setPrompts(mergePrompts(data.prompts));
      setLayouts(data.layouts || { [data.activeUserId]: DEFAULT_LAYOUT });
      setLayout((data.layouts && data.layouts[data.activeUserId]) || DEFAULT_LAYOUT);
      setAlwaysDo(ensureArray<AlwaysChip>(data.alwaysDo));
      setAlwaysWatch(ensureArray<AlwaysChip>(data.alwaysWatch));
      setLifeContextSnapshots(Array.isArray(data.lifeContextSnapshots) ? data.lifeContextSnapshots : []);
      setLatestDimensionSnapshots(data.latestDimensionSnapshots || {});
      setLastSessionScores(data.lastSessionScores || {});
      setDashboardPreferences(data.dashboardPreferences || {});
      setStorageUsage(getVaultStorageUsage());
    },
    [rebuildMemoryHashIndex]
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      setLockError(null);
      try {
        const { key, data } = await unlockVault<VaultData>(passphrase);
        keyRef.current = key;
        setIsUnlocked(true);
        setHasVault(true);

        let nextData = data;
        if (isSupabaseConfigured && cloudUserId) {
          try {
            const cloudData = await loadVaultSnapshotFromSupabase(cloudUserId, key, data);
            if (cloudData) {
              nextData = cloudData;
            }
          } catch (error: any) {
            console.warn('[useAura] Cloud load failed, using local vault', error?.message || error);
          }
        }

        applyVaultData(nextData);
      } catch (e) {
        setLockError('Unable to unlock. Check your passphrase.');
        setIsUnlocked(false);
      }
    },
    [cloudUserId, applyVaultData]
  );

  const setupVault = useCallback(
    async (passphrase: string) => {
      setLockError(null);
      try {
        const data = hasLegacyData ? buildLegacyVault() : buildDefaultVault();
        const key = await createVault(passphrase, data);
        keyRef.current = key;
        clearLegacyData();
        setHasLegacyData(false);
        setIsUnlocked(true);
        setHasVault(true);
        applyVaultData(data);

        if (isSupabaseConfigured && cloudUserId) {
          try {
            await syncVaultSnapshotToSupabase(cloudUserId, key, data);
          } catch (error: any) {
            console.warn('[useAura] Initial cloud sync failed', error?.message || error);
          }
        }
      } catch (e) {
        setLockError('Unable to create secure vault.');
        setIsUnlocked(false);
      }
    },
    [hasLegacyData, applyVaultData, cloudUserId]
  );

  useEffect(() => {
    setLayouts((prev) => ({ ...prev, [activeUserId]: layout }));
  }, [layout, activeUserId]);

  const getVaultSnapshot = useCallback(
    (): VaultData => ({
      version: 1,
      isOnboarded,
      familySpace,
      activeUserId,
      sources,
      memoryItems,
      claims,
      tasks,
      recommendations,
      goals,
      auditLogs,
      timelineEvents,
      insights,
      blindSpots,
      dailyPlan,
      ruleOfLife,
      prompts,
      layouts,
      alwaysDo,
      alwaysWatch,
      lifeContextSnapshots,
      latestDimensionSnapshots,
      lastSessionScores,
      dashboardPreferences,
    }),
    [
      isOnboarded,
      familySpace,
      activeUserId,
      sources,
      memoryItems,
      claims,
      tasks,
      recommendations,
      goals,
      auditLogs,
      timelineEvents,
      insights,
      blindSpots,
      dailyPlan,
      ruleOfLife,
      prompts,
      layouts,
      alwaysDo,
      alwaysWatch,
      lifeContextSnapshots,
      latestDimensionSnapshots,
      lastSessionScores,
      dashboardPreferences,
    ]
  );

  const saveVaultNow = useCallback(async () => {
    if (!keyRef.current) return;
    markPerf(PERF_MARKERS.persistStart);
    const snapshot = getVaultSnapshot();
    try {
      await saveVault(keyRef.current, snapshot);
      if (isSupabaseConfigured && cloudUserId) {
        await syncVaultSnapshotToSupabase(cloudUserId, keyRef.current, snapshot);
      }
    } finally {
      markPerf(PERF_MARKERS.persistEnd);
      measurePerf('arete-persist', PERF_MARKERS.persistStart, PERF_MARKERS.persistEnd);
      setStorageUsage(getVaultStorageUsage());
    }
  }, [getVaultSnapshot, cloudUserId]);

  const scheduleVaultSave = useCallback(() => {
    if (!isUnlocked || !keyRef.current) return;
    if (vaultSaveTimeoutRef.current) {
      window.clearTimeout(vaultSaveTimeoutRef.current);
    }
    vaultSaveTimeoutRef.current = window.setTimeout(() => {
      void saveVaultNow();
    }, 1000);
  }, [isUnlocked, saveVaultNow]);

  const lockVault = useCallback(async () => {
    if (vaultSaveTimeoutRef.current) {
      window.clearTimeout(vaultSaveTimeoutRef.current);
      vaultSaveTimeoutRef.current = null;
    }
    await saveVaultNow();
    keyRef.current = null;
    setIsUnlocked(false);
    setLockError('Session locked due to inactivity.');
    applyVaultData(buildDefaultVault());
  }, [saveVaultNow, applyVaultData]);

  useEffect(() => {
    if (!isUnlocked) return;
    scheduleVaultSave();
  }, [isUnlocked, getVaultSnapshot, scheduleVaultSave]);

  useEffect(() => {
    if (!isUnlocked) return;
    const handleUnload = () => {
      if (vaultSaveTimeoutRef.current) {
        window.clearTimeout(vaultSaveTimeoutRef.current);
        vaultSaveTimeoutRef.current = null;
      }
      void saveVaultNow();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isUnlocked, saveVaultNow]);

  useEffect(() => {
    if (!isUnlocked) return;
    let timeoutId: number | undefined;
    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        lockVault();
      }, VAULT_INACTIVITY_MS);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isUnlocked, lockVault]);

  const addAuditLog = useCallback(
    (actionType: ActionType, summary: string, details?: string, sourceId?: string) => {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        actionType,
        summary,
        details,
        sourceId,
        performerId: activeUserId,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [activeUserId]
  );

  const appendMemoryItems = useCallback(
    (items: MemoryItem[]) => {
      if (items.length === 0) return;
      setMemoryItems((prev) => {
        ensureMemoryHashIndex(prev);
        const newItems = items.filter((item) => {
          const hash = contentHash(item.content);
          if (memoryHashIndexRef.current.has(hash)) return false;
          memoryHashIndexRef.current.add(hash);
          return true;
        });
        return newItems.length > 0 ? [...newItems, ...prev] : prev;
      });
    },
    [ensureMemoryHashIndex]
  );

  const updateMemoryItem = useCallback((id: string, updates: Partial<MemoryItem>) => {
    setMemoryItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const toRecord = (value: unknown) =>
          value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
        const mergedMetadata = updates.metadata
          ? {
              ...item.metadata,
              ...updates.metadata,
              payload: {
                ...toRecord(item.metadata?.payload),
                ...toRecord(updates.metadata?.payload),
              },
            }
          : item.metadata;
        return { ...item, ...updates, metadata: mergedMetadata };
      })
    );
  }, []);

  const deleteMemoryItem = useCallback(
    (id: string) => {
      setMemoryItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        if (next.length !== prev.length) {
          rebuildMemoryHashIndex(next);
        }
        return next;
      });
    },
    [rebuildMemoryHashIndex]
  );

  const getAuthHeaders = useCallback(async () => {
    if (!supabase) throw new Error('Supabase auth is not configured.');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Not authenticated.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const parseApiPayload = useCallback(async (response: Response): Promise<any> => {
    const raw = await response.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return { error: raw.length > 220 ? `${raw.slice(0, 220)}...` : raw };
    }
  }, []);

  type MergeInboxOptions = {
    mode?: 'manual' | 'auto';
  };

  const getInboxAiItems = useCallback((entry: InboxEntry) => {
    return Array.isArray((entry.ai_result as any)?.items) ? ((entry.ai_result as any).items as any[]) : [];
  }, []);

  const getInboxEntryConfidence = useCallback(
    (entry: InboxEntry) => {
      const rootConfidence = (entry.ai_result as any)?.confidence;
      if (typeof rootConfidence === 'number' && !Number.isNaN(rootConfidence)) {
        return coerceConfidence(rootConfidence, 0.6);
      }
      const items = getInboxAiItems(entry);
      if (items.length === 0) return 0.6;
      const total = items.reduce((sum, item) => sum + coerceConfidence(item?.confidence, 0.6), 0);
      return coerceConfidence(total / items.length, 0.6);
    },
    [getInboxAiItems]
  );

  const inboxNeedsReview = useCallback(
    (entry: InboxEntry) => getInboxEntryConfidence(entry) < inboxReviewConfidence,
    [getInboxEntryConfidence, inboxReviewConfidence]
  );

  const refreshTelegramStatus = useCallback(async () => {
    if (!isSupabaseConfigured || !cloudUserId || !supabase) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/telegram/status', {
        method: 'GET',
        headers: { Authorization: headers.Authorization },
      });
      const payload = await parseApiPayload(response);
      if (!response.ok) throw new Error(payload?.error || 'Failed to load Telegram status');
      const binding = payload?.binding;
      setTelegram((prev) => ({
        ...prev,
        linked: Boolean(payload?.linked),
        username: binding?.telegram_username || undefined,
        firstName: binding?.telegram_first_name || undefined,
        linkedAt: binding?.linked_at || undefined,
      }));
    } catch (error: any) {
      console.warn('[useAura] refreshTelegramStatus failed', error?.message || error);
    }
  }, [cloudUserId, getAuthHeaders, parseApiPayload]);

  const generateTelegramLinkCode = useCallback(async () => {
    if (!isSupabaseConfigured || !cloudUserId) {
      throw new Error('Cloud sync is required before linking Telegram.');
    }
    const headers = await getAuthHeaders();
    const response = await fetch('/api/telegram/generate-link-token', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const payload = await parseApiPayload(response);
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to generate link code');
    }
    setTelegram((prev) => ({
      ...prev,
      linkCode: payload.token,
      linkCodeExpiresAt: Date.now() + (payload.expires_in_minutes || 5) * 60 * 1000,
    }));
  }, [cloudUserId, getAuthHeaders, parseApiPayload]);

  const unlinkTelegram = useCallback(async () => {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/telegram/unlink', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const payload = await parseApiPayload(response);
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to unlink Telegram');
    }
    setTelegram({ linked: false });
  }, [getAuthHeaders, parseApiPayload]);

  const mergeInboxEntries = useCallback(
    async (ids?: string[], entriesOverride?: InboxEntry[], options?: MergeInboxOptions) => {
      if (!cloudUserId) return;

      const mode = options?.mode || 'manual';
      const availableEntries = entriesOverride || inboxEntries;
      const selected =
        ids && ids.length > 0
          ? availableEntries.filter((entry) => ids.includes(entry.id))
          : availableEntries;
      if (selected.length === 0) return;

      const mergeableEntries =
        mode === 'auto' ? selected.filter((entry) => !inboxNeedsReview(entry)) : selected;
      if (mergeableEntries.length === 0) return;

      const timestamp = Date.now();
      const mergedMemory: MemoryItem[] = [];
      const mergedTasks: DailyTask[] = [];
      const mergedEvents: TimelineEvent[] = [];
      const mergedClaims: Claim[] = [];
      const derivedUpdates: ProposedUpdate[] = [];

      mergeableEntries.forEach((entry, entryIndex) => {
        const aiResult = (entry.ai_result || {}) as any;
        const aiItems = getInboxAiItems(entry);
        const entryConfidence = getInboxEntryConfidence(entry);
        const entryMemoryIds: string[] = [];
        const reviewNote =
          entryConfidence < inboxReviewConfidence
            ? ['Low-confidence Telegram classification. Merged by manual review.']
            : undefined;
        const normalizedFacts = Array.isArray(aiResult?.facts)
          ? aiResult.facts.filter((fact: any) => fact && typeof fact.fact === 'string')
          : [];
        const baseMemoryId = `mem-inbox-${timestamp}-${entryIndex}`;

        if (aiItems.length === 0) {
          const memoryId = baseMemoryId;
          mergedMemory.push({
            id: memoryId,
            timestamp,
            content: entry.raw_content,
            category: inferCategory(entry.raw_content, normalizedFacts as CategorizedFact[]),
            sentiment: 'neutral',
            extractedFacts: [],
            ownerId: activeUserId,
            extractionConfidence: entryConfidence,
            extractionQualityNotes: reviewNote,
            metadata: {
              type: 'telegram_inbox',
              source: 'telegram',
              version: 1,
              payload: {
                contentType: entry.content_type,
                sourceUrl: entry.source_url,
              },
            },
          });
          entryMemoryIds.push(memoryId);
        } else {
          aiItems.forEach((item, itemIndex) => {
            const content =
              typeof item?.content === 'string' && item.content.trim().length > 0
                ? item.content.trim()
                : entry.raw_content;
            const fields =
              item?.fields && typeof item.fields === 'object'
                ? (item.fields as Record<string, unknown>)
                : {};
            const domain = normalizeCategory(item?.domain || inferCategory(content, []));
            const itemConfidence = coerceConfidence(item?.confidence, entryConfidence);
            const itemOwnerId =
              item?.ownerId === 'FAMILY_SHARED'
                ? ('FAMILY_SHARED' as const)
                : typeof item?.ownerId === 'string' && item.ownerId.length > 0
                  ? item.ownerId
                  : activeUserId;
            const intakeType = normalizeIntakeType(item?.type);

            if (intakeType === 'event') {
              const rawDate = (fields as any).date || (fields as any).startDate || (fields as any).eventDate;
              if (typeof rawDate === 'string' && rawDate.trim().length > 0) {
                const eventDate = rawDate.trim();
                const title =
                  (typeof item?.title === 'string' && item.title.trim().length > 0
                    ? item.title
                    : content) || 'Telegram event';
                const event: TimelineEvent = {
                  id: `event-inbox-${timestamp}-${entryIndex}-${itemIndex}`,
                  ownerId: String(itemOwnerId),
                  title,
                  date: eventDate,
                  category: domain,
                  description: content || title,
                  createdAt: timestamp,
                  isManual: true,
                  fields: {
                    location: typeof (fields as any).location === 'string' ? (fields as any).location : undefined,
                  },
                };
                mergedEvents.push(event);
                const eventMemoryId = `mem-event-inbox-${timestamp}-${entryIndex}-${itemIndex}`;
                mergedMemory.push({
                  id: eventMemoryId,
                  timestamp,
                  content: `Event: ${title} on ${eventDate}`,
                  category: domain,
                  sentiment: 'neutral',
                  extractedFacts: [],
                  ownerId: itemOwnerId,
                  extractionConfidence: itemConfidence,
                  extractionQualityNotes: reviewNote,
                  metadata: {
                    type: 'event',
                    source: 'telegram',
                    version: 1,
                    payload: {
                      eventId: event.id,
                      contentType: entry.content_type,
                      sourceUrl: entry.source_url,
                    },
                  },
                });
                entryMemoryIds.push(eventMemoryId);
                return;
              }
            }

            if (intakeType === 'task' || intakeType === 'task_request') {
              const title =
                (typeof item?.title === 'string' && item.title.trim().length > 0 ? item.title : content) ||
                'Telegram task';
              const task: DailyTask = {
                id: `task-inbox-${timestamp}-${entryIndex}-${itemIndex}`,
                ownerId: String(itemOwnerId),
                title,
                description: content || title,
                category: domain,
                priority:
                  item?.priority === 'high' || item?.priority === 'low' ? item.priority : 'medium',
                completed: false,
                createdAt: timestamp,
                steps: Array.isArray((fields as any).steps) ? ((fields as any).steps as string[]) : [],
                inputs: Array.isArray((fields as any).inputs) ? ((fields as any).inputs as string[]) : [],
                definitionOfDone:
                  typeof (fields as any).definitionOfDone === 'string'
                    ? (fields as any).definitionOfDone
                    : undefined,
                risks: Array.isArray((fields as any).risks) ? ((fields as any).risks as string[]) : [],
                links: {
                  claims: [],
                  sources: [],
                  risks: [],
                  goals: [],
                },
              };
              mergedTasks.push(task);
            }

            if (intakeType === 'profile_update' || intakeType === 'config_update') {
              const section = (fields as any).section;
              const field = (fields as any).field;
              const newValue = (fields as any).newValue;
              if (section && field && newValue !== undefined) {
                derivedUpdates.push({
                  id: `update-inbox-${timestamp}-${entryIndex}-${itemIndex}`,
                  section,
                  field,
                  oldValue: '',
                  newValue: String(newValue),
                  reasoning:
                    (typeof (fields as any).reasoning === 'string' && (fields as any).reasoning) ||
                    'Telegram inbox update',
                  confidence: itemConfidence,
                  targetUserId: String(itemOwnerId),
                });
              }
            }

            const finalCategory = intakeType === 'habit' ? Category.HABIT : domain;
            const memoryId = `mem-inbox-${timestamp}-${entryIndex}-${itemIndex}`;
            mergedMemory.push({
              id: memoryId,
              timestamp,
              content,
              category: finalCategory,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId: itemOwnerId,
              extractionConfidence: itemConfidence,
              extractionQualityNotes: reviewNote,
              metadata: {
                type: 'telegram_inbox',
                source: 'telegram',
                version: 1,
                payload: {
                  contentType: entry.content_type,
                  sourceUrl: entry.source_url,
                  title: item?.title,
                  fields: item?.fields,
                  intakeType,
                },
              },
            });
            entryMemoryIds.push(memoryId);
          });
        }

        const claimSourceId = entryMemoryIds[0] || baseMemoryId;
        normalizedFacts.forEach((fact: any, factIndex: number) => {
          mergedClaims.push({
            id: `claim-inbox-${timestamp}-${entryIndex}-${factIndex}`,
            sourceId: claimSourceId,
            fact: String(fact.fact),
            type: 'FACT',
            confidence: calculateClaimConfidence(fact, profile, claims),
            status: ClaimStatus.COMMITTED,
            category: normalizeCategory(fact.category),
            ownerId: fact.ownerId || activeUserId,
            timestamp,
          });
        });
      });

      if (mergedMemory.length > 0) appendMemoryItems(mergedMemory);
      if (mergedTasks.length > 0) setTasks((prev) => [...mergedTasks, ...prev]);
      if (mergedEvents.length > 0) setTimelineEvents((prev) => [...mergedEvents, ...prev]);
      if (mergedClaims.length > 0) setClaims((prev) => [...mergedClaims, ...prev]);

      if (derivedUpdates.length > 0) {
        derivedUpdates.forEach((update) => {
          setProfile((prev) => {
            if (update.targetUserId && update.targetUserId !== prev.id) return prev;
            const section = update.section as keyof UserProfile;
            return {
              ...prev,
              [section]: {
                ...(prev as any)[section],
                [update.field]: update.newValue,
                lastUpdated: Date.now(),
              },
            };
          });
        });
      }

      const mergedIds = mergeableEntries.map((entry) => entry.id);
      if (isSupabaseConfigured) {
        await markInboxEntriesMerged(cloudUserId, mergedIds);
      }
      setInboxEntries((prev) => prev.filter((entry) => !mergedIds.includes(entry.id)));

      const remainingForReview =
        mode === 'auto'
          ? selected.filter((entry) => !mergedIds.includes(entry.id) && inboxNeedsReview(entry)).length
          : 0;

      const detailSuffix =
        remainingForReview > 0
          ? ` (${remainingForReview} held for manual review)`
          : '';
      addAuditLog(
        ActionType.INGEST_SIGNAL,
        'Inbox merged',
        `${mergedIds.length} Telegram entr${mergedIds.length === 1 ? 'y' : 'ies'}${detailSuffix}`
      );
    },
    [
      cloudUserId,
      inboxEntries,
      inboxNeedsReview,
      inboxReviewConfidence,
      getInboxAiItems,
      getInboxEntryConfidence,
      appendMemoryItems,
      activeUserId,
      profile,
      claims,
      addAuditLog,
    ]
  );

  useEffect(() => {
    if (!import.meta.env.VITE_E2E || typeof window === 'undefined') return;
    (window as any).__ARETE_E2E__ = {
      setInboxEntries: (entries: InboxEntry[]) => setInboxEntries(entries),
      mergeInboxAuto: async (ids?: string[]) => {
        await mergeInboxEntries(ids, undefined, { mode: 'auto' });
      },
      mergeInboxManual: async (ids?: string[]) => {
        await mergeInboxEntries(ids, undefined, { mode: 'manual' });
      },
      setInboxReviewConfidence: (value: number) => {
        setInboxReviewConfidence(coerceConfidence(value, DEFAULT_TELEGRAM_INBOX_REVIEW_CONFIDENCE));
      },
    };
    return () => {
      delete (window as any).__ARETE_E2E__;
    };
  }, [mergeInboxEntries]);

  const refreshInbox = useCallback(async () => {
    if (!cloudUserId || !isSupabaseConfigured) return;
    try {
      const entries = await loadInboxEntries(cloudUserId);
      setInboxEntries(entries);
      if (entries.length > 0 && inboxAutoMerge) {
        await mergeInboxEntries(entries.map((entry) => entry.id), entries, { mode: 'auto' });
      }
    } catch (error: any) {
      console.warn('[useAura] refreshInbox failed', error?.message || error);
    }
  }, [cloudUserId, inboxAutoMerge, mergeInboxEntries]);

  useEffect(() => {
    if (!isUnlocked || !cloudUserId) return;
    void refreshTelegramStatus();
    void refreshInbox();
  }, [isUnlocked, cloudUserId, refreshTelegramStatus, refreshInbox]);

  const migrateToCloud = useCallback(async () => {
    if (!keyRef.current) throw new Error('Unlock your vault first.');
    if (!cloudUserId) throw new Error('Sign in to Supabase first.');
    setCloudMigration({ status: 'running', message: 'Migrating vault to cloud...' });
    try {
      const result = await migrateLocalVaultToSupabase(keyRef.current, cloudUserId, getVaultSnapshot());
      setCloudMigration({
        status: 'done',
        migrated: result.migrated,
        message: `Migration complete. ${result.migrated} entries synced.`,
      });
      await refreshInbox();
      await refreshTelegramStatus();
    } catch (error: any) {
      setCloudMigration({
        status: 'error',
        message: error?.message || 'Cloud migration failed.',
      });
      throw error;
    }
  }, [cloudUserId, getVaultSnapshot, refreshInbox, refreshTelegramStatus]);

  const keepRecommendation = useCallback(
    (id: string) => {
      const rec = recommendations.find((r) => r.id === id);
      if (!rec) return;
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, userFeedback: 'kept' } : r))
      );
      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-rec-kept-${timestamp}`,
        timestamp,
        content: `Kept recommendation: ${rec.title}`,
        category: rec.category,
        sentiment: 'positive',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'recommendation_feedback',
          source: 'dashboard',
          version: 1,
          payload: { action: 'kept', recId: id, category: rec.category },
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.APPROVE, 'Recommendation kept', rec.title, memoryItem.id);
    },
    [recommendations, activeUserId, appendMemoryItems, addAuditLog]
  );

  const removeRecommendation = useCallback(
    (id: string) => {
      const rec = recommendations.find((r) => r.id === id);
      if (!rec) return;
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'DISMISSED', userFeedback: 'removed' } : r))
      );
      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-rec-removed-${timestamp}`,
        timestamp,
        content: `Removed recommendation: ${rec.title}`,
        category: rec.category,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'recommendation_feedback',
          source: 'dashboard',
          version: 1,
          payload: { action: 'removed', recId: id, category: rec.category },
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.REJECT, 'Recommendation removed', rec.title, memoryItem.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recommendations, activeUserId, appendMemoryItems, addAuditLog]
  );

  const commitClaims = (sourceId: string, facts: CategorizedFact[], updates: ProposedUpdate[]) => {
    setClaims((prev) =>
      prev.map((c) => (c.sourceId === sourceId ? { ...c, status: ClaimStatus.COMMITTED } : c))
    );
    if (updates.length > 0) {
      const updateTimestamp = Date.now();
      setProfile((prev) => {
        let next = prev;
        let changed = false;
        for (const u of updates) {
          if (u.targetUserId && u.targetUserId !== prev.id) continue;
          const section = u.section as keyof UserProfile;
          if (!changed) {
            next = { ...prev };
            changed = true;
          }
          next = {
            ...next,
            [section]: {
              ...(next as any)[section],
              [u.field]: u.newValue,
              lastUpdated: updateTimestamp,
            },
          };
        }
        return changed ? next : prev;
      });
    }
    addAuditLog(ActionType.APPROVE, 'Neural State Commited', `Source: ${sourceId}`);
    debouncedRefreshAura();
  };

  const resolveConflict = (claimId: string, resolution: 'OVERWRITE' | 'KEEP_EXISTING') => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: resolution === 'OVERWRITE' ? ClaimStatus.COMMITTED : ClaimStatus.ARCHIVED,
            }
          : c
      )
    );
    addAuditLog(
      ActionType.RESOLVE_CONFLICT,
      `Conflict Resolved: ${resolution}`,
      `Claim: ${claimId}`
    );
  };

  const deleteClaim = (id: string) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
    addAuditLog(ActionType.REJECT, 'Knowledge Purged', `ID: ${id}`);
  };

  const updateClaim = (id: string, newFact: string) => {
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, fact: newFact } : c)));
    addAuditLog(ActionType.PROFILE_UPDATE, 'Knowledge Point Refined', `ID: ${id}`);
  };

  const logMemory = async (input: string, attachedFiles?: File[], skipVerification = true) => {
    markPerf(PERF_MARKERS.logStart);
    setIsProcessing(true);
    const timestamp = Date.now();
    const sourcePrefix = `src-${timestamp}`;
    const addedSourceIds: string[] = [];
    const addedStorageKeys: string[] = [];
    const addedMemoryIds: string[] = [];
    try {
      const files = attachedFiles || [];
      const fileMeta = files.map((file) => ({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      }));
      const newSources: Source[] = [];
      const memoryAdds: MemoryItem[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 10MB size cap.`);
        }
        const sourceId = `${sourcePrefix}-${i}`;
        const storageKey = `file-${sourcePrefix}-${i}`;
        await putFile(storageKey, file, keyRef.current || undefined);
        const source: Source = {
          id: sourceId,
          storageKey,
          mimeType: file.type || 'application/octet-stream',
          name: file.name,
          size: file.size,
          uploadedAt: timestamp,
          ownerId: activeUserId,
        };
        newSources.push(source);
        addedSourceIds.push(sourceId);
        addedStorageKeys.push(storageKey);
        memoryAdds.push({
          id: `mem-${sourceId}`,
          timestamp,
          content: `Uploaded file: ${file.name}`,
          category: Category.GENERAL,
          sentiment: 'neutral',
          extractedFacts: [],
          sourceId,
          ownerId: activeUserId,
          extractionConfidence: 0,
          metadata: {
            type: 'document',
            source: 'logbar',
            version: 1,
            payload: {
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              uploadedAt: timestamp,
              sourceId,
            },
          },
        });
        addedMemoryIds.push(`mem-${sourceId}`);
      }

      if (newSources.length > 0) {
        setSources((prev) => [...newSources, ...prev]);
      }

      const trimmed = input.trim();
      const isAuditEntry = trimmed.toLowerCase().startsWith('/audit');
      const auditContent = isAuditEntry ? trimmed.replace(/^\/audit\s*/i, '').trim() : '';
      const contentForMemory = isAuditEntry ? auditContent || 'Evening audit logged.' : trimmed;
      const mainMemoryId = contentForMemory ? `mem-${timestamp}` : null;
      const inferredCategory = contentForMemory
        ? inferCategory(contentForMemory, [])
        : Category.GENERAL;
      const detectedHabit = contentForMemory ? detectHabit(contentForMemory) : null;

      if (contentForMemory) {
        const memoryItem: MemoryItem = {
          id: mainMemoryId!,
          timestamp,
          content: contentForMemory,
          category: inferredCategory,
          sentiment: 'neutral',
          extractedFacts: [],
          sourceId: newSources.length === 1 ? newSources[0].id : undefined,
          ownerId: activeUserId,
          extractionConfidence: 0,
        };
        memoryAdds.unshift(memoryItem);
        addedMemoryIds.push(memoryItem.id);
      }

      if (contentForMemory && detectedHabit) {
        const habit = detectedHabit;
        const habitItem: MemoryItem = {
          id: `mem-habit-${timestamp}`,
          timestamp,
          content: habit.title,
          category: Category.HABIT,
          sentiment: 'neutral',
          extractedFacts: [],
          ownerId: activeUserId,
          extractionConfidence: 1,
          metadata: {
            type: 'habit',
            source: 'logbar',
            version: 1,
            payload: {
              title: habit.title,
              frequency: habit.frequency,
              trigger: '',
              desiredOutcome: '',
              startDate: timestamp,
              lastCompletedAt: null,
              streak: null,
            },
          },
        };
        memoryAdds.push(habitItem);
        addedMemoryIds.push(habitItem.id);
      }

      if (isAuditEntry) {
        const auditItem: MemoryItem = {
          id: `mem-audit-${timestamp}`,
          timestamp,
          content: contentForMemory,
          category: Category.GENERAL,
          sentiment: 'neutral',
          extractedFacts: [],
          ownerId: activeUserId,
          extractionConfidence: 1,
          metadata: {
            type: 'audit_reflection',
            source: 'logbar',
            version: 1,
            payload: {
              content: contentForMemory,
              createdAt: timestamp,
            },
          },
        };
        memoryAdds.push(auditItem);
        addedMemoryIds.push(auditItem.id);
        addAuditLog(ActionType.DIGEST, 'Evening Audit Logged', contentForMemory, auditItem.id);
      }

      const financeMetrics = computeFinanceMetrics(profile);
      if (financeMetrics) {
        const latestMetrics = extractFinanceMetricsFromMemory([...memoryItems, ...memoryAdds]);
        const metricsChanged =
          !latestMetrics ||
          latestMetrics.income !== financeMetrics.income ||
          latestMetrics.fixed !== financeMetrics.fixed ||
          latestMetrics.variable !== financeMetrics.variable ||
          latestMetrics.dailyVariableBudget !== financeMetrics.dailyVariableBudget ||
          latestMetrics.weeklyVariableBudget !== financeMetrics.weeklyVariableBudget ||
          latestMetrics.savingsRate !== financeMetrics.savingsRate;
        if (metricsChanged) {
          const metricsItem: MemoryItem = {
            id: `mem-finance-${timestamp}`,
            timestamp,
            content: `Finance metrics snapshot: daily ${financeMetrics.dailyVariableBudget}, weekly ${financeMetrics.weeklyVariableBudget}, savings rate ${financeMetrics.savingsRate}%.`,
            category: Category.FINANCE,
            sentiment: 'neutral',
            extractedFacts: [],
            ownerId: activeUserId,
            extractionConfidence: 1,
            metadata: {
              type: 'finance_metrics',
              payload: financeMetrics,
              source: 'derived',
              version: 1,
            },
          };
          memoryAdds.push(metricsItem);
          addedMemoryIds.push(metricsItem.id);
        }
      }

      if (memoryAdds.length > 0) {
        setMemoryItems((prev) => {
          ensureMemoryHashIndex(prev);
          for (const item of memoryAdds) {
            memoryHashIndexRef.current.add(contentHash(item.content));
          }
          return [...memoryAdds, ...prev];
        });
      }

      const fileSummary =
        files.length > 0 ? `Attached files: ${files.map((f) => f.name).join(', ')}` : '';
      const inputForAI = contentForMemory
        ? `${contentForMemory}${fileSummary ? `\n\n${fileSummary}` : ''}`
        : fileSummary;

      try {
        const filesForAI =
          files.length > 0
            ? await Promise.all(
                files.map(
                  (file) =>
                    new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string;
                        const base64 = result.split(',')[1];
                        resolve({
                          data: base64,
                          mimeType: file.type || 'application/octet-stream',
                        });
                      };
                      reader.onerror = () => reject(reader.error);
                      reader.readAsDataURL(file);
                    })
                )
              )
            : undefined;

        const deterministicInput = contentForMemory || inputForAI || '';
        const deterministic =
          filesForAI && filesForAI.length > 0
            ? null
            : parseLogDeterministically(deterministicInput, {
                ownerId: activeUserId,
                currentDate: new Date().toLocaleDateString('en-CA'),
              });

        const result =
          deterministic && deterministic.confidence >= 0.7
            ? deterministic
            : await processInput(
                inputForAI,
                memoryItems,
                profile,
                filesForAI,
                prompts.find((p) => p.id === 'internalization')!,
                familySpace.members,
                fileMeta
              );
        markPerf(PERF_MARKERS.logAiEnd);
        measurePerf('arete-initial-ai', PERF_MARKERS.logStart, PERF_MARKERS.logAiEnd);
        const rawFacts = Array.isArray(result?.facts) ? result.facts : [];
        const rawUpdates = Array.isArray(result?.proposedUpdates) ? result.proposedUpdates : [];
        const rawItems = Array.isArray(result?.items) ? result.items : [];
        const fallbackOwnerId = LogRouter.resolveTargetUser(
          contentForMemory || inputForAI || '',
          activeUserId,
          familySpace.members
        );
        const fallbackIntent = buildFallbackIntent(contentForMemory || inputForAI || '');
        const fallbackDomain = contentForMemory
          ? inferCategory(contentForMemory, rawFacts as CategorizedFact[])
          : Category.GENERAL;
        const intakeConfidence = coerceConfidence(result?.confidence, 0.6);

        const normalizedItems: IntakeItem[] = rawItems
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any, idx: number) => {
            const content =
              typeof item.content === 'string' && item.content.trim().length > 0
                ? item.content.trim()
                : contentForMemory || inputForAI || `Signal ${idx + 1}`;
            const ownerId =
              item.ownerId === 'FAMILY_SHARED'
                ? 'FAMILY_SHARED'
                : typeof item.ownerId === 'string' && item.ownerId.trim().length > 0
                  ? item.ownerId
                  : fallbackOwnerId;
            const tags = Array.isArray(item.tags)
              ? item.tags.filter(Boolean).map((tag: any) => String(tag))
              : [];
            const fields =
              item.fields && typeof item.fields === 'object'
                ? (item.fields as Record<string, unknown>)
                : undefined;
            return {
              id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id : '',
              type: normalizeIntakeType(item.type),
              intent: normalizeIntakeIntent(item.intent || result?.intent || fallbackIntent),
              domain: normalizeCategory(item.domain || fallbackDomain),
              ownerId,
              horizon: normalizeHorizon(item.horizon),
              title: typeof item.title === 'string' ? item.title : undefined,
              content,
              confidence: coerceConfidence(item.confidence, intakeConfidence),
              tags,
              fields,
              sourceId: typeof item.sourceId === 'string' ? item.sourceId : undefined,
              dedupeKey: typeof item.dedupeKey === 'string' ? item.dedupeKey : contentHash(content),
            };
          })
          .map((item, idx) => ({ ...item, id: item.id || `intake-${timestamp}-${idx}` }));

        const fallbackItems: IntakeItem[] = [];
        const baseContent = contentForMemory || inputForAI || '';
        if (baseContent) {
          fallbackItems.push({
            id: `intake-${timestamp}-0`,
            type: 'memory',
            intent: fallbackIntent,
            domain: fallbackDomain,
            ownerId: fallbackOwnerId,
            horizon: 'unknown',
            title: undefined,
            content: baseContent,
            confidence: intakeConfidence,
            tags: [],
            fields: undefined,
            dedupeKey: contentHash(baseContent),
          });
        }
        const links = baseContent ? extractLinks(baseContent) : [];
        links.forEach((link, idx) => {
          fallbackItems.push({
            id: `intake-link-${timestamp}-${idx}`,
            type: 'link',
            intent: 'memory',
            domain: Category.GENERAL,
            ownerId: fallbackOwnerId,
            horizon: 'unknown',
            title: 'Link',
            content: link,
            confidence: intakeConfidence,
            tags: ['link'],
            fields: { url: link },
            dedupeKey: contentHash(link),
          });
        });
        if (detectedHabit) {
          fallbackItems.push({
            id: `intake-habit-${timestamp}`,
            type: 'habit',
            intent: 'habit',
            domain: Category.HABIT,
            ownerId: fallbackOwnerId,
            horizon: 'always',
            title: detectedHabit.title,
            content: detectedHabit.title,
            confidence: intakeConfidence,
            tags: ['habit'],
            fields: { frequency: detectedHabit.frequency },
            dedupeKey: contentHash(detectedHabit.title),
          });
        }

        const intakeItems = normalizedItems.length > 0 ? normalizedItems : fallbackItems;
        const intakeMemoryAdds: MemoryItem[] = [];
        const timelineAdds: TimelineEvent[] = [];
        const taskAdds: DailyTask[] = [];
        const derivedUpdates: ProposedUpdate[] = rawUpdates.filter(
          (u: any) => u && typeof u === 'object'
        );
        const existingHabits = new Set(
          [...memoryItems, ...memoryAdds]
            .filter((item) => item.metadata?.type === 'habit')
            .map((item) => item.content.toLowerCase())
        );

        const hasEventItem = intakeItems.some((item) => item.type === 'event');
        if (!hasEventItem && contentForMemory && isLikelyEvent(contentForMemory)) {
          const parsedDateTime = parseDateTimeFromText(contentForMemory);
          if (parsedDateTime) {
            const title =
              contentForMemory.length > 60 ? `${contentForMemory.slice(0, 60)}…` : contentForMemory;
            const event: TimelineEvent = {
              id: `event-${timestamp}-fallback`,
              ownerId: activeUserId,
              title,
              date: parsedDateTime,
              category: fallbackDomain,
              description: contentForMemory,
              createdAt: timestamp,
              isManual: true,
              fields: {},
            };
            timelineAdds.push(event);
            intakeMemoryAdds.push({
              id: `mem-event-${timestamp}-fallback`,
              timestamp,
              content: `Event: ${title} on ${parsedDateTime}`,
              category: fallbackDomain,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId: activeUserId,
              extractionConfidence: intakeConfidence,
              metadata: {
                type: 'event',
                source: 'logbar',
                version: 1,
                payload: event,
              },
            });
          }
        }

        intakeItems.forEach((item, idx) => {
          const domain = normalizeCategory(item.domain);
          const fields = item.fields || {};
          const content = item.content || '';
          const ownerId = item.ownerId || activeUserId;
          const sourceId = item.sourceId;

          if (item.type === 'document') {
            if (sourceId) {
              updateMemoryItem(`mem-${sourceId}`, {
                category: domain,
                extractionConfidence: item.confidence,
                metadata: {
                  type: 'document',
                  payload: {
                    ...(fields as Record<string, unknown>),
                    title: item.title,
                    tags: item.tags,
                  },
                },
              });
              return;
            }
            intakeMemoryAdds.push({
              id: `mem-doc-${timestamp}-${idx}`,
              timestamp,
              content: item.title || content || 'Document',
              category: domain,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId,
              extractionConfidence: item.confidence,
              metadata: {
                type: 'document',
                source: 'logbar',
                version: 1,
                payload: fields,
              },
            });
            return;
          }

          if (item.type === 'memory' && mainMemoryId && contentForMemory) {
            updateMemoryItem(mainMemoryId, {
              category: domain,
              extractionConfidence: item.confidence,
              metadata: {
                type: 'memory',
                payload: {
                  ...(fields as Record<string, unknown>),
                  tags: item.tags,
                },
              },
            });
            return;
          }

          if (item.type === 'event') {
            let date =
              typeof (fields as any).date === 'string'
                ? (fields as any).date
                : typeof (fields as any).startDate === 'string'
                  ? (fields as any).startDate
                  : typeof (fields as any).eventDate === 'string'
                    ? (fields as any).eventDate
                    : '';

            const time = (fields as any).time;
            const location = (fields as any).location;

            if (date && time && typeof time === 'string') {
              // Attempt to merge date and time if date doesn't already have time
              if (!date.includes('T') || date.includes('00:00:00')) {
                const baseDate = date.split('T')[0];
                date = `${baseDate}T${time}:00`;
              }
            }

            if (!date) {
              return;
            }
            const title = item.title || content || 'New event';
            const event: TimelineEvent = {
              id: `event-${timestamp}-${idx}`,
              ownerId: String(ownerId),
              title,
              date,
              category: domain,
              description: content || title,
              createdAt: timestamp,
              isManual: true,
              fields: {
                location: typeof location === 'string' ? location : undefined,
              },
              metadata: {
                isPriority:
                  title.toLowerCase().includes('important') ||
                  title.toLowerCase().includes('urgent'),
              },
            };
            timelineAdds.push(event);
            const memoryId = `mem-event-${timestamp}-${idx}`;
            intakeMemoryAdds.push({
              id: memoryId,
              timestamp,
              content: `Event: ${title} on ${date}`,
              category: domain,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId,
              extractionConfidence: item.confidence,
              metadata: {
                type: 'event',
                source: 'logbar',
                version: 1,
                payload: event,
              },
            });
            addAuditLog(ActionType.ARM_STRATEGY, 'Event Logged', title, memoryId);
            return;
          }

          if (item.type === 'habit') {
            const title = item.title || content || 'New habit';
            const normalizedTitle = title.toLowerCase();
            if (existingHabits.has(normalizedTitle)) return;
            existingHabits.add(normalizedTitle);
            intakeMemoryAdds.push({
              id: `mem-habit-${timestamp}-${idx}`,
              timestamp,
              content: title,
              category: Category.HABIT,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId,
              extractionConfidence: item.confidence,
              metadata: {
                type: 'habit',
                source: 'logbar',
                version: 1,
                payload: {
                  title,
                  frequency: (fields as any).frequency || 'daily',
                },
              },
            });
            addAuditLog(ActionType.ARM_STRATEGY, 'Habit Logged', title);
            return;
          }

          if (item.type === 'task' || item.type === 'task_request') {
            const title = item.title || content || 'New task';
            const aiPriority = (fields as any).priority;
            const dueDateStr = (fields as any).date;
            // Convert YYYY-MM-DD string to timestamp if present
            const dueAt = dueDateStr ? new Date(dueDateStr).getTime() : undefined;
            taskAdds.push({
              id: `task-${timestamp}-${idx}`,
              ownerId: String(ownerId),
              title,
              description: content || title,
              category: domain,
              priority: aiPriority === 'high' || aiPriority === 'low' ? aiPriority : 'medium',
              completed: false,
              createdAt: timestamp,
              due_at: dueAt,
              steps: Array.isArray((fields as any).steps) ? (fields as any).steps : [],
              inputs: Array.isArray((fields as any).inputs) ? (fields as any).inputs : [],
              definitionOfDone: (fields as any).definitionOfDone,
              risks: Array.isArray((fields as any).risks) ? (fields as any).risks : [],
              links: {
                claims: [],
                sources: sourceId ? [sourceId] : [],
                risks: [],
                goals: [],
              },
            });
            intakeMemoryAdds.push({
              id: `mem-task-${timestamp}-${idx}`,
              timestamp,
              content: `Task requested: ${title}`,
              category: domain,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId,
              extractionConfidence: item.confidence,
              metadata: {
                type: 'task_request',
                source: 'logbar',
                version: 1,
                payload: {
                  title,
                  description: content,
                  fields,
                },
              },
            });
            return;
          }

          if (item.type === 'profile_update' || item.type === 'config_update') {
            const section = (fields as any).section;
            const field = (fields as any).field;
            const newValue = (fields as any).newValue;
            if (section && field && newValue !== undefined) {
              derivedUpdates.push({
                id: `update-${timestamp}-${idx}`,
                section,
                field,
                oldValue: '',
                newValue: String(newValue),
                reasoning: (fields as any).reasoning || 'User input update',
                confidence: item.confidence,
                targetUserId: String(ownerId),
              });
            }
            intakeMemoryAdds.push({
              id: `mem-update-${timestamp}-${idx}`,
              timestamp,
              content: `Profile update requested: ${content || item.title || 'Update'}`,
              category: domain,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId,
              extractionConfidence: item.confidence,
              metadata: {
                type: item.type,
                source: 'logbar',
                version: 1,
                payload: fields,
              },
            });
            return;
          }

          if (
            item.type === 'health_record' ||
            item.type === 'finance_record' ||
            item.type === 'relationship_note' ||
            item.type === 'spiritual_note'
          ) {
            intakeMemoryAdds.push({
              id: `mem-${item.type}-${timestamp}-${idx}`,
              timestamp,
              content: content || item.title || 'Record',
              category: domain,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId,
              extractionConfidence: item.confidence,
              metadata: {
                type: item.type,
                source: 'logbar',
                version: 1,
                payload: fields,
              },
            });
            return;
          }

          if (item.type === 'link') {
            const url = (fields as any).url || content;
            if (!url) return;
            intakeMemoryAdds.push({
              id: `mem-link-${timestamp}-${idx}`,
              timestamp,
              content: url,
              category: domain,
              sentiment: 'neutral',
              extractedFacts: [],
              ownerId,
              extractionConfidence: item.confidence,
              metadata: {
                type: 'link',
                source: 'logbar',
                version: 1,
                payload: { url, tags: item.tags },
              },
            });
          }
        });

        if (timelineAdds.length > 0) {
          setTimelineEvents((prev) => [...timelineAdds, ...prev]);
        }
        if (taskAdds.length > 0) {
          setTasks((prev) => [...taskAdds, ...prev]);
        }

        const shouldRefineCategory =
          mainMemoryId && contentForMemory && !intakeItems.some((item) => item.type === 'memory');
        const refinedCategory = shouldRefineCategory
          ? intakeItems.length > 0
            ? intakeItems[0].domain ||
              inferCategory(contentForMemory, rawFacts as CategorizedFact[])
            : inferCategory(contentForMemory, rawFacts as CategorizedFact[])
          : null;

        if (intakeMemoryAdds.length > 0 || shouldRefineCategory) {
          setMemoryItems((prev) => {
            let next = prev;
            if (intakeMemoryAdds.length > 0) {
              ensureMemoryHashIndex(prev);
              const newItems = intakeMemoryAdds.filter((item) => {
                const hash = contentHash(item.content);
                if (memoryHashIndexRef.current.has(hash)) return false;
                memoryHashIndexRef.current.add(hash);
                return true;
              });
              if (newItems.length > 0) {
                next = [...newItems, ...next];
              }
            }
            if (shouldRefineCategory && refinedCategory) {
              next = next.map((item) =>
                item.id === mainMemoryId ? { ...item, category: refinedCategory } : item
              );
            }
            return next;
          });
        }

        const normalizedFacts = (rawFacts as any[]).filter(
          (fact) => fact && typeof fact.fact === 'string'
        );
        const newClaims: Claim[] = normalizedFacts.map((f: any, i: number) => ({
          id: `claim-${timestamp}-${i}`,
          sourceId: addedMemoryIds[0],
          fact: f.fact,
          type: 'FACT',
          confidence: calculateClaimConfidence(f, profile, claims),
          status: skipVerification ? ClaimStatus.COMMITTED : ClaimStatus.PROPOSED,
          category: f.category || Category.GENERAL,
          ownerId: f.ownerId || activeUserId,
          timestamp,
        }));
        if (newClaims.length > 0) {
          setClaims((prev) => [...newClaims, ...prev]);
        }

        if (skipVerification && derivedUpdates.length > 0) {
          derivedUpdates.forEach((u) => {
            setProfile((prev) => {
              if (u.targetUserId && u.targetUserId !== prev.id) return prev;
              const section = u.section as keyof UserProfile;
              return {
                ...prev,
                [section]: {
                  ...(prev as any)[section],
                  [u.field]: u.newValue,
                  lastUpdated: Date.now(),
                },
              };
            });
          });
        }

        addAuditLog(ActionType.INGEST_SIGNAL, 'Signal Ingested', inputForAI, addedMemoryIds[0]);
        debouncedRefreshAura();
        return {
          ...result,
          facts: normalizedFacts,
          proposedUpdates: derivedUpdates,
          needsReview: false,
          headline: result?.headline || 'Signal logged.',
          sourceId: addedMemoryIds[0],
          intake: {
            intent: normalizeIntakeIntent(result?.intent || fallbackIntent),
            items: intakeItems,
            missingData: Array.isArray(result?.missingData) ? result.missingData : [],
            needsReview: undefined,
            confidence: intakeConfidence,
            notes: result?.notes,
          } as IntakeResult,
        };
      } catch (err: any) {
        const message = err?.message || 'AI processing failed.';
        markPerf(PERF_MARKERS.logAiEnd);
        measurePerf('arete-initial-ai', PERF_MARKERS.logStart, PERF_MARKERS.logAiEnd);
        if (addedMemoryIds.length > 0) {
          setMemoryItems((prev) =>
            prev.map((item) =>
              addedMemoryIds.includes(item.id)
                ? {
                    ...item,
                    extractionConfidence: 0,
                    extractionQualityNotes: [message],
                  }
                : item
            )
          );
        }
        addAuditLog(
          ActionType.INGEST_SIGNAL,
          'Signal Ingested (Needs Review)',
          message,
          addedMemoryIds[0]
        );
        debouncedRefreshAura();
        return {
          headline: 'Signal logged.',
          needsReview: false,
          missingFields: ['ai_processing'],
          facts: [],
          proposedUpdates: [],
          sourceId: addedMemoryIds[0],
        };
      }
    } catch (err) {
      if (addedMemoryIds.length > 0) {
        setMemoryItems((prev) => prev.filter((m) => !addedMemoryIds.includes(m.id)));
      }
      if (addedSourceIds.length > 0) {
        setSources((prev) => prev.filter((s) => !addedSourceIds.includes(s.id)));
      }
      if (addedStorageKeys.length > 0) {
        await Promise.all(addedStorageKeys.map((key) => deleteFile(key)));
      }
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const getDailyCap = () => {
    const preferred = ruleOfLife?.taskPreferences?.dailyCap;
    const fallback = typeof preferred === 'number' && preferred > 0 ? preferred : 8;
    return Math.min(8, Math.max(5, fallback));
  };

  const isSameLocalDay = (a: number, b: number) =>
    new Date(a).toDateString() === new Date(b).toDateString();

  const shouldRunDailyBatch = (force?: boolean) => {
    if (force) return true;
    const lastRun = lastDailyBatchRef.current;
    if (!lastRun) return true;
    return !isSameLocalDay(Date.now(), lastRun);
  };

  const shouldRunDeepTasks = (force?: boolean) => {
    if (force) return true;
    const lastRun = lastDeepTasksRef.current;
    if (!lastRun) return true;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - lastRun > weekMs;
  };

  const planMyDay = async () => {
    setIsPlanningDay(true);
    try {
      const plan = await generateDailyPlan(
        profile,
        timelineEvents,
        goals,
        blindSpots,
        ruleOfLife,
        prompts.find((p) => p.id === 'deepPlanning')!,
        memoryItems
      );
      const safePlan = Array.isArray(plan) ? plan : [];
      setDailyPlan(safePlan.slice(0, getDailyCap()));
    } finally {
      setIsPlanningDay(false);
    }
  };

  const refreshAura = async (options?: { force?: boolean }) => {
    const force = Boolean(options?.force);
    if (!shouldRunDailyBatch(force)) return;

    markPerf(PERF_MARKERS.refreshStart);
    setIsGeneratingTasks(true);
    try {
      const batchPrompt =
        prompts.find((p) => p.id === 'dailyBatch') ||
        DEFAULT_PROMPTS.find((p) => p.id === 'dailyBatch')!;
      const deepPrompt = prompts.find((p) => p.id === 'deepPlanning')!;
      const financeMetrics = computeFinanceMetrics(profile);
      const missingData = buildMissingData(profile);
      const context = {
        familyMembers: familySpace.members,
        financeMetrics,
        missingData,
        claims,
      };

      let batchResult: {
        tasks: DailyTask[];
        insights: ProactiveInsight[];
        blindSpots: BlindSpot[];
      };
      try {
        batchResult = await dailyIntelligenceBatch(memoryItems, profile, batchPrompt, context);
        markPerf(PERF_MARKERS.refreshEnd);
        measurePerf('arete-refresh', PERF_MARKERS.refreshStart, PERF_MARKERS.refreshEnd);
      } catch (err) {
        console.error('[refreshAura] daily batch failed', err);
        markPerf(PERF_MARKERS.refreshEnd);
        measurePerf('arete-refresh', PERF_MARKERS.refreshStart, PERF_MARKERS.refreshEnd);
        return;
      }
      const rawTasks = Array.isArray(batchResult?.tasks) ? batchResult.tasks : [];
      setTasks((prev) => {
        const now = Date.now();
        const prevById = new Map(prev.map((t) => [t.id, t]));
        const normalizedAi = rawTasks.map((task) => {
          const title = typeof task.title === 'string' ? task.title : 'New task';
          const description =
            typeof task.description === 'string' && task.description.length > 0
              ? task.description
              : title;
          const category = normalizeCategory(task.category);
          const id = `ai-${activeUserId}-${contentHash(`${title}|${description}|${category}`)}`;
          const existing = prevById.get(id);
          return {
            ...task,
            id,
            ownerId: task.ownerId || activeUserId,
            title,
            description,
            category,
            priority: task.priority || 'medium',
            completed: existing?.completed ?? Boolean(task.completed),
            createdAt: existing?.createdAt || task.createdAt || now,
          } as DailyTask;
        });
        const aiIds = new Set(normalizedAi.map((t) => t.id));
        const manualTasks = prev.filter((t) => !String(t.id || '').startsWith('ai-'));
        const completedAi = prev.filter(
          (t) => String(t.id || '').startsWith('ai-') && t.completed && !aiIds.has(t.id)
        );
        return [...manualTasks, ...normalizedAi, ...completedAi];
      });

      setInsights(Array.isArray(batchResult?.insights) ? batchResult.insights : []);
      setBlindSpots(Array.isArray(batchResult?.blindSpots) ? batchResult.blindSpots : []);
      lastDailyBatchRef.current = Date.now();

      if (shouldRunDeepTasks(force)) {
        try {
          const deepResult = await generateDeepTasks(
            profile,
            memoryItems,
            familySpace.members,
            deepPrompt,
            context
          );
          if (Array.isArray(deepResult?.recommendations) && deepResult.recommendations.length > 0) {
            setRecommendations(deepResult.recommendations);
            lastDeepTasksRef.current = Date.now();
          }
        } catch (err) {
          console.error('[refreshAura] deep tasks failed', err);
        }
      }
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const runDeepInitialization = useCallback(async () => {
    const result = await generateDeepInitialization(profile, ruleOfLife, memoryItems, claims);
    const timestamp = Date.now();

    const deepTasks = (result.doItems || []).map((task, idx) => ({
      id: `deep-task-${timestamp}-${idx}`,
      ownerId: activeUserId,
      title: task.title || 'New task',
      description: task.description || task.why || '',
      category: normalizeCategory(task.category),
      priority: task.priority || 'medium',
      completed: false,
      createdAt: timestamp,
      steps: task.steps || [],
      inputs: task.inputs || [],
      definitionOfDone: task.definitionOfDone,
      risks: task.risks || [],
      methodology: task.methodology,
      why: task.why,
      estimate_min: task.estimate_min,
      energy: task.energy,
    }));

    const deepBlindSpots = (result.watchItems || []).map((spot: any, idx: number) => ({
      id: `blind-${timestamp}-${idx}`,
      ownerId: activeUserId,
      createdAt: timestamp,
      signal: spot.signal || spot.title || 'Risk detected',
      why: spot.why || spot.description || 'Needs review.',
      confidence: spot.confidence || 50,
      severity: spot.severity || 'med',
      actions: spot.actions || spot.steps || [],
    }));

    const domainRecs = Object.values(result.domainRecommendations || {}).flat();
    const deepRecs = domainRecs.map((rec: any, idx: number) => ({
      id: `rec-init-${timestamp}-${idx}`,
      ownerId: activeUserId,
      category: normalizeCategory(rec.category),
      title: rec.title || 'Recommendation',
      description: rec.description || '',
      impactScore: rec.impactScore || 5,
      rationale: rec.rationale || rec.why || '',
      steps: rec.steps || [],
      estimatedTime: rec.estimatedTime || '15m',
      inputs: rec.inputs || [],
      definitionOfDone: rec.definitionOfDone || '',
      risks: rec.risks || [],
      status: 'ACTIVE' as const,
      needsReview: false,
      missingFields: rec.missingData || [],
      createdAt: timestamp,
      evidenceLinks: rec.evidenceLinks || { claims: [], sources: [] },
    }));

    if (deepTasks.length > 0) setTasks((prev) => [...deepTasks, ...prev]);
    if (deepBlindSpots.length > 0) setBlindSpots((prev) => [...deepBlindSpots, ...prev]);
    if (deepRecs.length > 0) setRecommendations((prev) => [...deepRecs, ...prev]);

    // Store Always-Do/Watch chips from deep initialization
    const initAlwaysDo = (result.alwaysDo || []).map((chip: any, idx: number) => ({
      id: chip.id || `always-do-${timestamp}-${idx}`,
      label: chip.label || '',
      rationale: chip.rationale || '',
      source: chip.source || 'computed',
      profileField: chip.profileField,
      priority: chip.priority || 'medium',
    }));
    const initAlwaysWatch = (result.alwaysWatch || []).map((chip: any, idx: number) => ({
      id: chip.id || `always-watch-${timestamp}-${idx}`,
      label: chip.label || '',
      rationale: chip.rationale || '',
      source: chip.source || 'computed',
      profileField: chip.profileField,
      priority: chip.priority || 'medium',
    }));
    if (initAlwaysDo.length > 0) setAlwaysDo(initAlwaysDo);
    if (initAlwaysWatch.length > 0) setAlwaysWatch(initAlwaysWatch);

    if (result.personalizedGreeting) {
      addAuditLog(ActionType.SYSTEM, 'Initialization Complete', result.personalizedGreeting);
    }

    return result.personalizedGreeting;
  }, [
    profile,
    ruleOfLife,
    memoryItems,
    claims,
    activeUserId,
    addAuditLog,
    setTasks,
    setBlindSpots,
    setRecommendations,
  ]);

  const debouncedRefreshAura = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshAura();
    }, 500);
  }, [refreshAura]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      if (vaultSaveTimeoutRef.current) {
        window.clearTimeout(vaultSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isUnlocked,
    hasVault,
    hasLegacyData,
    lockError,
    unlock,
    setupVault,
    isOnboarded,
    sources,
    memoryItems,
    claims,
    tasks,
    recommendations,
    goals,
    auditLogs,
    activeProfile: profile,
    profile,
    familySpace,
    activeUserId,
    isProcessing,
    isPlanningDay,
    storageUsage,
    cloudMigration,
    inboxEntries,
    inboxAutoMerge,
    inboxReviewConfidence,
    telegram,
    lifeContextSnapshots,
    latestDimensionSnapshots,
    lastSessionScores,
    dashboardPreferences,
    timelineEvents,
    insights,
    blindSpots,
    dailyPlan,
    ruleOfLife,
    isGeneratingTasks,
    prompts,
    layout,
    alwaysDo,
    alwaysWatch,
    setActiveUserId: handleSwitchUser,
    logMemory,
    migrateToCloud,
    mergeInboxEntries,
    refreshInbox,
    checkInbox: refreshInbox,
    generateTelegramLinkCode,
    unlinkTelegram,
    setInboxAutoMerge,
    setInboxReviewConfidence,
    planMyDay,
    resolveConflict,
    clearAllData: () => {
      clearVault();
      clearLegacyData();
      keyRef.current = null;
      setHasVault(false);
      setHasLegacyData(false);
      setIsUnlocked(false);
      applyVaultData(buildDefaultVault());
    },
    completeOnboarding: () => setIsOnboarded(true),
    exportData: async () => {
      const payload = exportVault();
      if (!payload) return;
      // Include encrypted files in export
      const files = await exportAllFiles();
      const fullBackup = {
        ...payload,
        files,
        exportedAt: new Date().toISOString(),
        version: APP_VERSION,
      };
      const blob = new Blob([JSON.stringify(fullBackup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arete-vault-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    importData: async (f: File) => {
      try {
        const text = await f.text();
        const parsed = JSON.parse(text) as {
          meta: string;
          vault: string;
          files?: { key: string; data: string }[];
        };
        if (!parsed?.meta || !parsed?.vault) throw new Error('Invalid backup');
        importVault(parsed.meta, parsed.vault);
        // Import files if present
        if (parsed.files && Array.isArray(parsed.files)) {
          await importAllFiles(parsed.files);
        }
        setHasVault(true);
        setIsUnlocked(false);
        keyRef.current = null;
        setLockError('Backup imported. Please unlock to continue.');
      } catch (e) {
        setLockError('Import failed. Invalid backup file.');
      }
    },
    refreshAura,
    exportAuditLogs: () => {
      const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arete-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    clearAuditLogs: () => setAuditLogs([]),
    copyCspReportSummary: async () => {
      const summary = `Audit logs: ${auditLogs.length}. Last entry: ${auditLogs[0]?.summary || 'none'}`;
      await navigator.clipboard.writeText(summary);
    },
    backupIdentity: null,
    backupMeta: null,
    enableBackups: async () => ({ ok: true }),
    createRemoteBackup: async () => ({ ok: true }),
    listRemoteBackups: async () => [],
    listRemoteBackupsForRecovery: async () => [],
    restoreBackupWithRecovery: async () => ({ ok: true }),
    keepRecommendation,
    removeRecommendation,
    runDeepInitialization,
    commitClaims,
    setLayout,
    addTimelineEvent: (e: any) => {
      setTimelineEvents((p) => [e, ...p]);
      const timestamp = Date.now();
      const category = Object.values(Category).includes(e?.category)
        ? e.category
        : Category.GENERAL;
      const memoryItem: MemoryItem = {
        id: `mem-event-${timestamp}`,
        timestamp,
        content: `Event added: ${e?.title || 'Untitled event'}`,
        category,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'event',
          source: 'timeline',
          version: 1,
          payload: e,
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.ARM_STRATEGY, 'Event Logged', e?.title || 'Event', memoryItem.id);
      debouncedRefreshAura();
    },
    updateTimelineEvent: (id: any, u: any) =>
      setTimelineEvents((p) => p.map((e) => (e.id === id ? { ...e, ...u } : e))),
    deleteTimelineEvent: (id: any) => setTimelineEvents((p) => p.filter((e) => e.id !== id)),
    activatePrepPlan: (p: any, eventId?: string) => {
      setRecommendations((prev) => {
        // Prevent duplicates if p.id already exists
        const filtered = prev.filter((r) => r.id !== p.id);
        return [p, ...filtered];
      });

      // Convert steps to tasks if they exist
      if (p.steps && p.steps.length > 0) {
        const prepTasks: DailyTask[] = p.steps.map((step: string, i: number) => ({
          id: `prep-${eventId || 'gen'}-${Date.now()}-${i}`,
          ownerId: activeUserId,
          title: step,
          description: `Preparation for ${p.title || 'Event'}`,
          category: p.category || Category.GENERAL,
          priority: 'high',
          completed: false,
          createdAt: Date.now(),
          eventId: eventId,
        }));
        setTasks((prev) => [...prepTasks, ...prev]);
        setDailyPlan((prev) => [...prepTasks, ...prev]);
      }

      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-prep-${timestamp}`,
        timestamp,
        content: `Prep plan activated: ${p?.title || 'Plan'}`,
        category: p?.category || Category.GENERAL,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'prep_plan',
          source: 'recommendation',
          version: 1,
          payload: p,
          eventId: eventId,
          sources: (p?.evidenceLinks?.sources as any) || [],
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(
        ActionType.ARM_STRATEGY,
        'Prep Plan Activated',
        p?.title || 'Plan',
        memoryItem.id
      );
      debouncedRefreshAura();
    },
    setProfile,
    setRuleOfLife,
    setPrompts,
    setLifeContextSnapshots,
    setLatestDimensionSnapshots,
    setLastSessionScores,
    setDashboardPreferences,
    setLifeContextSignalHandler,
    toggleTask: (id: string) => {
      const task = dailyPlan.find((t) => t.id === id) || tasks.find((t) => t.id === id);
      if (!task) return;

      const newCompleted = !task.completed;

      // Update both lists to maintain sync
      setDailyPlan((p) => p.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));

      if (newCompleted) {
        setLastAction({ type: 'complete', task });
        const timestamp = Date.now();
        const category = Object.values(Category).includes(task.category)
          ? task.category
          : Category.GENERAL;
        const memoryItem: MemoryItem = {
          id: `mem-task-done-${timestamp}`,
          timestamp,
          content: `Task completed: ${task.title}`,
          category,
          sentiment: 'positive',
          extractedFacts: [],
          ownerId: activeUserId,
          extractionConfidence: 1,
          metadata: {
            type: 'task_complete',
            source: 'daily_plan',
            version: 1,
            payload: task,
          },
        };
        appendMemoryItems([memoryItem]);
        addAuditLog(ActionType.COMPLETE_TASK, 'Task Completed', task.title, memoryItem.id);
        debouncedRefreshAura();
      } else {
        // setLastAction({ type: 'uncomplete', task }); // unsupported type
        debouncedRefreshAura();
      }
    },
    undoTaskAction: () => {
      if (!lastAction) return;
      const { type, task } = lastAction;
      if (type === 'complete') {
        setDailyPlan((p) => p.map((t) => (t.id === task.id ? { ...t, completed: false } : t)));
      } else if (type === 'delete') {
        setDailyPlan((p) => [...p, task]);
        setTasks((p) => [...p, task]);
      }
      setLastAction(null);
    },
    getVitalityScore: (c: any) => 85,
    dismissInsight: (i: any) => setInsights((p) => p.filter((ins) => ins.id !== i.id)),
    setTaskFeedback: (id: string, f: any) => {},
    setInsightFeedback: (id: string, f: any) => {},
    createTask: (t: any) => {
      setTasks((p) => [t, ...p]);
      const timestamp = Date.now();
      const category = Object.values(Category).includes(t?.category)
        ? t.category
        : Category.GENERAL;
      const memoryItem: MemoryItem = {
        id: `mem-task-${timestamp}`,
        timestamp,
        content: `Task created: ${t?.title || 'Task'}`,
        category,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'task',
          source: 'manual',
          version: 1,
          payload: t,
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.TASK_CREATE, 'Task Created', t?.title || 'Task', memoryItem.id);
      debouncedRefreshAura();
    },
    updateTask: (id: any, u: any) => {
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...u } : t)));
      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-task-update-${timestamp}`,
        timestamp,
        content: `Task updated: ${u?.title || id}`,
        category: Object.values(Category).includes(u?.category) ? u.category : Category.GENERAL,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'task_update',
          source: 'manual',
          version: 1,
          payload: { id, ...u },
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.TASK_CREATE, 'Task Updated', u?.title || id, memoryItem.id);
      debouncedRefreshAura();
    },
    deleteTask: (id: any) => {
      const task = dailyPlan.find((t) => t.id === id) || tasks.find((t) => t.id === id);
      if (task) setLastAction({ type: 'delete', task });

      setTasks((p) => p.filter((t) => t.id !== id));
      setDailyPlan((p) => p.filter((t) => t.id !== id));
      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-task-delete-${timestamp}`,
        timestamp,
        content: `Task deleted: ${id}`,
        category: Category.GENERAL,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'task_delete',
          source: 'manual',
          version: 1,
          payload: { id },
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.TASK_CREATE, 'Task Deleted', id, memoryItem.id);
      debouncedRefreshAura();
    },
    createGoal: (g: any) => {
      setGoals((p) => [g, ...p]);
      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-goal-${timestamp}`,
        timestamp,
        content: `Goal created: ${g?.title || 'Goal'}`,
        category: Object.values(Category).includes(g?.category) ? g.category : Category.GENERAL,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'goal',
          source: 'manual',
          version: 1,
          payload: g,
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.ARM_STRATEGY, 'Goal Created', g?.title || 'Goal', memoryItem.id);
      debouncedRefreshAura();
    },
    updateGoal: (id: any, u: any) => {
      setGoals((p) => p.map((g) => (g.id === id ? { ...g, ...u } : g)));
      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-goal-update-${timestamp}`,
        timestamp,
        content: `Goal updated: ${u?.title || id}`,
        category: Object.values(Category).includes(u?.category) ? u.category : Category.GENERAL,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'goal_update',
          source: 'manual',
          version: 1,
          payload: { id, ...u },
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.ARM_STRATEGY, 'Goal Updated', u?.title || id, memoryItem.id);
      debouncedRefreshAura();
    },
    deleteGoal: (id: any) => {
      setGoals((p) => p.filter((g) => g.id !== id));
      const timestamp = Date.now();
      const memoryItem: MemoryItem = {
        id: `mem-goal-delete-${timestamp}`,
        timestamp,
        content: `Goal deleted: ${id}`,
        category: Category.GENERAL,
        sentiment: 'neutral',
        extractedFacts: [],
        ownerId: activeUserId,
        extractionConfidence: 1,
        metadata: {
          type: 'goal_delete',
          source: 'manual',
          version: 1,
          payload: { id },
        },
      };
      appendMemoryItems([memoryItem]);
      addAuditLog(ActionType.ARM_STRATEGY, 'Goal Deleted', id, memoryItem.id);
      debouncedRefreshAura();
    },
    scheduleInsight: (i: any, d: any) => {},
    deleteFacts: (items: any) => {},
    addFamilyMember: (n: string) => {
      const id = `user-${Date.now()}`;
      setFamilySpace((prev) => ({ ...prev, members: [...prev.members, createNewProfile(id, n)] }));
      return id;
    },
    removeFamilyMember: (id: string) => {},
    updateMemoryItem,
    deleteMemoryItem,
    deleteClaim,
    updateClaim,
    approveClaims: (ids: string[]) =>
      setClaims((p) =>
        p.map((c) => (ids.includes(c.id) ? { ...c, status: ClaimStatus.COMMITTED } : c))
      ),
    rejectClaims: (ids: string[]) =>
      setClaims((p) =>
        p.map((c) => (ids.includes(c.id) ? { ...c, status: ClaimStatus.ARCHIVED } : c))
      ),
  };
};
