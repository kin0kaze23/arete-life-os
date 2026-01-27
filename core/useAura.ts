import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActionType,
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
  IntakeNeedsReview,
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
} from '@/data';
import { contentHash } from '@/shared';
import { LogRouter } from '@/command';
import {
  processInput,
  generateDailyPlan,
  generateTasks,
  generateInsights,
  generateBlindSpots,
  generateDeepInitialization,
  DEFAULT_PROMPTS,
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

const APP_VERSION = '3.2.0';
const VAULT_INACTIVITY_MS = 15 * 60 * 1000;

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

const buildNeedsReview = (reason: string, questions: string[]): IntakeNeedsReview => ({
  reason,
  questions: questions.filter((q) => typeof q === 'string' && q.trim().length > 0).slice(0, 3),
});

const buildFallbackIntent = (input: string): IntakeIntent => {
  const classified = LogRouter.classifyIntent(input);
  if (classified === 'QUERY') return 'query';
  if (classified === 'TASK') return 'task_request';
  if (classified === 'CONFIG') return 'config_update';
  return 'memory';
};

const extractLinks = (input: string) =>
  input.match(/https?:\/\/[^\s)]+/gi)?.map((link) => link.trim()) ?? [];

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
  personal: { status: '', jobRole: '', company: '', interests: [], lastUpdated: Date.now() },
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
  const [hasVault, setHasVault] = useState<boolean>(() =>
    typeof window !== 'undefined' ? hasEncryptedVault() : false
  );
  const [hasLegacyData, setHasLegacyData] = useState<boolean>(() =>
    typeof window !== 'undefined' ? detectLegacyData() : false
  );
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [familySpace, setFamilySpace] = useState<FamilySpace>(INITIAL_FAMILY);
  const [activeUserId, setActiveUserId] = useState<string>(INITIAL_PROFILE.id);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [storageUsage, setStorageUsage] = useState<number>(0);

  useEffect(() => {
    setFamilySpace((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === profile.id ? profile : m)),
    }));
  }, [profile]);

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

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlanningDay, setIsPlanningDay] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  const applyVaultData = useCallback((data: VaultData) => {
    setIsOnboarded(data.isOnboarded);
    setFamilySpace(data.familySpace);
    setActiveUserId(data.activeUserId);
    const nextProfile =
      data.familySpace.members.find((m) => m.id === data.activeUserId) ||
      data.familySpace.members[0];
    setProfile(nextProfile);
    setSources(ensureArray<Source>(data.sources));
    setMemoryItems(ensureArray<MemoryItem>(data.memoryItems));
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
    setPrompts(data.prompts?.length ? data.prompts : DEFAULT_PROMPTS);
    setLayouts(data.layouts || { [data.activeUserId]: DEFAULT_LAYOUT });
    setLayout((data.layouts && data.layouts[data.activeUserId]) || DEFAULT_LAYOUT);
    setStorageUsage(getVaultStorageUsage());
  }, []);

  const unlock = useCallback(async (passphrase: string) => {
    setLockError(null);
    try {
      const { key, data } = await unlockVault<VaultData>(passphrase);
      keyRef.current = key;
      setIsUnlocked(true);
      setHasVault(true);
      applyVaultData(data);
    } catch (e) {
      setLockError('Unable to unlock. Check your passphrase.');
      setIsUnlocked(false);
    }
  }, []);

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
      } catch (e) {
        setLockError('Unable to create secure vault.');
        setIsUnlocked(false);
      }
    },
    [hasLegacyData, applyVaultData]
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
    ]
  );

  const lockVault = useCallback(async () => {
    if (keyRef.current) {
      await saveVault(keyRef.current, getVaultSnapshot());
    }
    keyRef.current = null;
    setIsUnlocked(false);
    setLockError('Session locked due to inactivity.');
    applyVaultData(buildDefaultVault());
  }, [getVaultSnapshot, applyVaultData]);

  useEffect(() => {
    if (!isUnlocked || !keyRef.current) return;
    saveVault(keyRef.current, getVaultSnapshot()).then(() =>
      setStorageUsage(getVaultStorageUsage())
    );
  }, [isUnlocked, getVaultSnapshot]);

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

  const appendMemoryItems = useCallback((items: MemoryItem[]) => {
    if (items.length === 0) return;
    setMemoryItems((prev) => {
      const existingHashes = new Set(prev.map((item) => contentHash(item.content)));
      const newItems = items.filter((item) => !existingHashes.has(contentHash(item.content)));
      return [...newItems, ...prev];
    });
  }, []);

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

  const deleteMemoryItem = useCallback((id: string) => {
    setMemoryItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

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
    updates.forEach((u) => {
      setProfile((prev) => {
        if (u.targetUserId && u.targetUserId !== prev.id) return prev;
        const section = u.section as keyof UserProfile;
        return {
          ...prev,
          [section]: { ...(prev as any)[section], [u.field]: u.newValue, lastUpdated: Date.now() },
        };
      });
    });
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

  const logMemory = async (input: string, attachedFiles?: File[]) => {
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
        setMemoryItems((prev) => [...memoryAdds, ...prev]);
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

        const result = await processInput(
          inputForAI,
          memoryItems,
          profile,
          filesForAI,
          prompts.find((p) => p.id === 'internalization')!,
          familySpace.members,
          fileMeta
        );
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
        const intakeNeedsReview =
          result?.needsReview && Array.isArray(result.needsReview?.questions)
            ? buildNeedsReview(
                String(result.needsReview?.reason || 'Needs clarification'),
                result.needsReview.questions
              )
            : null;

        const intakeMemoryAdds: MemoryItem[] = [];
        const timelineAdds: TimelineEvent[] = [];
        const taskAdds: DailyTask[] = [];
        const derivedUpdates: ProposedUpdate[] = rawUpdates.filter(
          (u: any) => u && typeof u === 'object'
        );
        const reviewQuestions: string[] = [];
        const existingHabits = new Set(
          [...memoryItems, ...memoryAdds]
            .filter((item) => item.metadata?.type === 'habit')
            .map((item) => item.content.toLowerCase())
        );

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
            const date =
              typeof (fields as any).date === 'string'
                ? (fields as any).date
                : typeof (fields as any).startDate === 'string'
                  ? (fields as any).startDate
                  : typeof (fields as any).eventDate === 'string'
                    ? (fields as any).eventDate
                    : '';
            if (!date) {
              reviewQuestions.push('When is this event scheduled?');
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
            taskAdds.push({
              id: `task-${timestamp}-${idx}`,
              ownerId: String(ownerId),
              title,
              description: content || title,
              category: domain,
              priority: 'medium',
              completed: false,
              createdAt: timestamp,
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
            } else {
              reviewQuestions.push('Which profile field should be updated?');
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

        if (intakeMemoryAdds.length > 0) {
          appendMemoryItems(intakeMemoryAdds);
        }
        if (timelineAdds.length > 0) {
          setTimelineEvents((prev) => [...timelineAdds, ...prev]);
        }
        if (taskAdds.length > 0) {
          setTasks((prev) => [...taskAdds, ...prev]);
        }

        const shouldReview =
          intakeNeedsReview || reviewQuestions.length > 0 || intakeItems.length === 0;
        if (shouldReview) {
          const review =
            intakeNeedsReview || buildNeedsReview('Needs clarification', reviewQuestions);
          const reviewItem: MemoryItem = {
            id: `mem-review-${timestamp}`,
            timestamp,
            content: `Needs review: ${contentForMemory || inputForAI}`,
            category: Category.GENERAL,
            sentiment: 'neutral',
            extractedFacts: [],
            ownerId: activeUserId,
            extractionConfidence: 0,
            metadata: {
              type: 'needs_review',
              source: 'logbar',
              version: 1,
              payload: review,
            },
          };
          appendMemoryItems([reviewItem]);
        }

        if (
          mainMemoryId &&
          contentForMemory &&
          !intakeItems.some((item) => item.type === 'memory')
        ) {
          const refinedCategory = inferCategory(contentForMemory, rawFacts as CategorizedFact[]);
          setMemoryItems((prev) =>
            prev.map((item) =>
              item.id === mainMemoryId ? { ...item, category: refinedCategory } : item
            )
          );
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
          status: ClaimStatus.PROPOSED,
          category: f.category || Category.GENERAL,
          ownerId: f.ownerId || activeUserId,
          timestamp,
        }));
        if (newClaims.length > 0) {
          setClaims((prev) => [...newClaims, ...prev]);
        }
        addAuditLog(ActionType.INGEST_SIGNAL, 'Signal Ingested', inputForAI, addedMemoryIds[0]);
        debouncedRefreshAura();
        return {
          ...result,
          facts: normalizedFacts,
          proposedUpdates: derivedUpdates,
          needsReview: shouldReview || result?.needsReview,
          headline:
            result?.headline || (shouldReview ? 'Signal logged. Needs review.' : 'Signal logged.'),
          sourceId: addedMemoryIds[0],
          intake: {
            intent: normalizeIntakeIntent(result?.intent || fallbackIntent),
            items: intakeItems,
            missingData: Array.isArray(result?.missingData) ? result.missingData : [],
            needsReview: intakeNeedsReview || undefined,
            confidence: intakeConfidence,
            notes: result?.notes,
          } as IntakeResult,
        };
      } catch (err: any) {
        const message = err?.message || 'AI processing failed.';
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
          headline: 'Signal logged. Needs review.',
          needsReview: true,
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

  const planMyDay = async () => {
    setIsPlanningDay(true);
    try {
      const plan = await generateDailyPlan(
        profile,
        timelineEvents,
        goals,
        blindSpots,
        ruleOfLife,
        prompts.find((p) => p.id === 'deepPlanning')!
      );
      const safePlan = Array.isArray(plan) ? plan : [];
      setDailyPlan(safePlan.slice(0, getDailyCap()));
    } finally {
      setIsPlanningDay(false);
    }
  };

  const refreshAura = async () => {
    setIsGeneratingTasks(true);
    try {
      const prompt = prompts.find((p) => p.id === 'deepPlanning')!;
      const financeMetrics = computeFinanceMetrics(profile);
      const missingData = buildMissingData(profile);
      const context = {
        familyMembers: familySpace.members,
        financeMetrics,
        missingData,
      };
      const nextTasks = await generateTasks(memoryItems, profile, prompt, context);
      const nextInsights = await generateInsights(memoryItems, profile, prompt, context);
      const nextBlindSpots = await generateBlindSpots(memoryItems, profile, prompt, context);
      setTasks(Array.isArray(nextTasks) ? nextTasks : []);
      setInsights(Array.isArray(nextInsights) ? nextInsights : []);
      setBlindSpots(Array.isArray(nextBlindSpots) ? nextBlindSpots : []);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const runDeepInitialization = useCallback(async () => {
    const result = await generateDeepInitialization(profile, ruleOfLife);
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

    if (result.personalizedGreeting) {
      addAuditLog(ActionType.SYSTEM, 'Initialization Complete', result.personalizedGreeting);
    }

    return result.personalizedGreeting;
  }, [profile, ruleOfLife, activeUserId, addAuditLog, setTasks, setBlindSpots, setRecommendations]);

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
    timelineEvents,
    insights,
    blindSpots,
    dailyPlan,
    ruleOfLife,
    isGeneratingTasks,
    prompts,
    layout,
    setActiveUserId: handleSwitchUser,
    logMemory,
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
    activatePrepPlan: (p: any) => {
      setRecommendations((prev) => [p, ...prev]);
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
    toggleTask: (id: string) => {
      const task = dailyPlan.find((t) => t.id === id);
      setDailyPlan((p) => p.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
      if (task && !task.completed) {
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
      }
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
      setTasks((p) => p.filter((t) => t.id !== id));
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
