import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Category,
  MemoryItem,
  DailyTask,
  UserProfile,
  PromptConfig,
  Goal,
  AuditLogEntry,
  ActionType,
  Claim,
  ClaimStatus,
  FamilySpace,
  UserRole,
  Recommendation,
  Source,
  TimelineEvent,
  ProactiveInsight,
  BlindSpot,
  RuleOfLife,
  CategorizedFact,
  ProposedUpdate,
  MemoryEntry,
  DashboardLayout,
  FinanceMetrics,
} from './types';
import { deleteFile, putFile } from './fileStore';
import {
  processInput,
  generateDailyPlan,
  generateTasks,
  generateInsights,
  generateBlindSpots,
  DEFAULT_PROMPTS,
} from './geminiService';
import {
  clearVault,
  createVault,
  exportVault,
  getVaultStorageUsage,
  hasVault as hasEncryptedVault,
  importVault,
  saveVault,
  unlockVault,
} from './cryptoVault';

const APP_VERSION = '3.2.0';
const VAULT_INACTIVITY_MS = 15 * 60 * 1000;

const INITIAL_RULE_OF_LIFE: RuleOfLife = {
  season: { name: 'Growth', intensity: 5, context: 'Standard operational focus.' },
  valuesRoles: { values: ['Integrity', 'Excellence'], roles: ['Individual'] },
  weeklyRhythm: { startOfWeek: 'Monday', blockedTimes: [] },
  nonNegotiables: { sleepWindow: '11pm - 7am', sabbath: 'Sunday', devotion: 'Morning Calibration' },
  taskPreferences: { dailyCap: 3, energyOffset: 'Balanced', includeWeekends: false },
};

const parseNumber = (value: string) => {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const computeFinanceMetrics = (profile: UserProfile): FinanceMetrics | null => {
  const income = profile.finances.income ? parseNumber(profile.finances.income) : null;
  const fixed = profile.finances.fixedCosts ? parseNumber(profile.finances.fixedCosts) : null;
  const variable = profile.finances.variableCosts
    ? parseNumber(profile.finances.variableCosts)
    : null;
  if (income === null || fixed === null || variable === null) return null;
  const dailyVariableBudget = Math.round(variable / 30);
  const weeklyVariableBudget = Math.round(variable / 4);
  const savingsRate = Math.max(0, (income - (fixed + variable)) / income);
  return {
    income,
    fixed,
    variable,
    dailyVariableBudget,
    weeklyVariableBudget,
    savingsRate: Math.round(savingsRate * 100),
  };
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

const extractFinanceMetrics = (payload?: Record<string, unknown> | FinanceMetrics) => {
  if (!payload) return null;
  const income = payload.income;
  const fixed = payload.fixed;
  const variable = payload.variable;
  const dailyVariableBudget = payload.dailyVariableBudget;
  const weeklyVariableBudget = payload.weeklyVariableBudget;
  const savingsRate = payload.savingsRate;
  const isNumber = (val: unknown): val is number => typeof val === 'number' && Number.isFinite(val);
  if (
    !isNumber(income) ||
    !isNumber(fixed) ||
    !isNumber(variable) ||
    !isNumber(dailyVariableBudget) ||
    !isNumber(weeklyVariableBudget) ||
    !isNumber(savingsRate)
  ) {
    return null;
  }
  return {
    income,
    fixed,
    variable,
    dailyVariableBudget,
    weeklyVariableBudget,
    savingsRate,
  };
};

const detectHabit = (input: string) => {
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

  const applyVaultData = useCallback((data: VaultData) => {
    setIsOnboarded(data.isOnboarded);
    setFamilySpace(data.familySpace);
    setActiveUserId(data.activeUserId);
    const nextProfile =
      data.familySpace.members.find((m) => m.id === data.activeUserId) ||
      data.familySpace.members[0];
    setProfile(nextProfile);
    setSources(data.sources || []);
    setMemoryItems(data.memoryItems || []);
    setClaims(data.claims || []);
    setTasks(data.tasks || []);
    setRecommendations(data.recommendations || []);
    setGoals(data.goals || []);
    setAuditLogs(data.auditLogs || []);
    setTimelineEvents(data.timelineEvents || []);
    setInsights(data.insights || []);
    setBlindSpots(data.blindSpots || []);
    setDailyPlan(data.dailyPlan || []);
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
      const newSources: Source[] = [];
      const memoryAdds: MemoryItem[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 10MB size cap.`);
        }
        const sourceId = `${sourcePrefix}-${i}`;
        const storageKey = `file-${sourcePrefix}-${i}`;
        await putFile(storageKey, file);
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
        });
        addedMemoryIds.push(`mem-${sourceId}`);
      }

      if (newSources.length > 0) {
        setSources((prev) => [...newSources, ...prev]);
      }

      const trimmed = input.trim();
      if (trimmed) {
        const memoryItem: MemoryItem = {
          id: `mem-${timestamp}`,
          timestamp,
          content: trimmed,
          category: Category.GENERAL,
          sentiment: 'neutral',
          extractedFacts: [],
          sourceId: newSources.length === 1 ? newSources[0].id : undefined,
          ownerId: activeUserId,
          extractionConfidence: 0,
        };
        memoryAdds.unshift(memoryItem);
        addedMemoryIds.push(memoryItem.id);
      }

      if (trimmed) {
        const habit = detectHabit(trimmed);
        if (habit) {
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
      }

      const financeMetrics = computeFinanceMetrics(profile);
      if (financeMetrics) {
        const latestMetricsItem = [...memoryItems, ...memoryAdds]
          .filter((item) => item.metadata?.type === 'finance_metrics')
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        const latestMetrics = extractFinanceMetrics(latestMetricsItem?.metadata?.payload);
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

      const inputForAI =
        trimmed ||
        (files.length > 0 ? `Uploaded files: ${files.map((f) => f.name).join(', ')}` : '');

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
          familySpace.members
        );
        const newClaims: Claim[] = (result.facts || []).map((f: any, i: number) => ({
          id: `claim-${timestamp}-${i}`,
          sourceId: addedMemoryIds[0],
          fact: f.fact,
          type: 'FACT',
          confidence: f.confidence || 0,
          status: ClaimStatus.PROPOSED,
          category: f.category || Category.GENERAL,
          ownerId: f.ownerId || activeUserId,
          timestamp,
        }));
        setClaims((prev) => [...newClaims, ...prev]);
        addAuditLog(ActionType.INGEST_SIGNAL, 'Signal Ingested', inputForAI, addedMemoryIds[0]);
        setTimeout(() => refreshAura(), 0);
        return { ...result, sourceId: addedMemoryIds[0] };
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
        setTimeout(() => refreshAura(), 0);
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
      setDailyPlan(plan.slice(0, getDailyCap()));
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
      setTasks(await generateTasks(memoryItems, profile, prompt, context));
      setInsights(await generateInsights(memoryItems, profile, prompt, context));
      setBlindSpots(await generateBlindSpots(memoryItems, profile, prompt, context));
    } finally {
      setIsGeneratingTasks(false);
    }
  };

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
    exportData: () => {
      const payload = exportVault();
      if (!payload) return;
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
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
        const parsed = JSON.parse(text) as { meta: string; vault: string };
        if (!parsed?.meta || !parsed?.vault) throw new Error('Invalid backup');
        importVault(parsed.meta, parsed.vault);
        setHasVault(true);
        setIsUnlocked(false);
        keyRef.current = null;
        setLockError('Backup imported. Please unlock to continue.');
      } catch (e) {
        setLockError('Import failed. Invalid backup file.');
      }
    },
    refreshAura,
    commitClaims,
    setLayout,
    addTimelineEvent: (e: any) => setTimelineEvents((p) => [e, ...p]),
    updateTimelineEvent: (id: any, u: any) =>
      setTimelineEvents((p) => p.map((e) => (e.id === id ? { ...e, ...u } : e))),
    deleteTimelineEvent: (id: any) => setTimelineEvents((p) => p.filter((e) => e.id !== id)),
    activatePrepPlan: (p: any) => setRecommendations((prev) => [p, ...prev]),
    setProfile,
    setRuleOfLife,
    setPrompts,
    toggleTask: (id: string) =>
      setDailyPlan((p) => p.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))),
    getVitalityScore: (c: any) => 85,
    dismissInsight: (i: any) => setInsights((p) => p.filter((ins) => ins.id !== i.id)),
    setTaskFeedback: (id: string, f: any) => {},
    setInsightFeedback: (id: string, f: any) => {},
    createTask: (t: any) => setTasks((p) => [t, ...p]),
    updateTask: (id: any, u: any) =>
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...u } : t))),
    deleteTask: (id: any) => setTasks((p) => p.filter((t) => t.id !== id)),
    createGoal: (g: any) => setGoals((p) => [g, ...p]),
    updateGoal: (id: any, u: any) =>
      setGoals((p) => p.map((g) => (g.id === id ? { ...g, ...u } : g))),
    deleteGoal: (id: any) => setGoals((p) => p.filter((g) => g.id !== id)),
    scheduleInsight: (i: any, d: any) => {},
    deleteFacts: (items: any) => {},
    addFamilyMember: (n: string) => {
      const id = `user-${Date.now()}`;
      setFamilySpace((prev) => ({ ...prev, members: [...prev.members, createNewProfile(id, n)] }));
      return id;
    },
    removeFamilyMember: (id: string) => {},
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
