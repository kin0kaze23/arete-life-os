import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { generateLifeSnapshot, refreshDimensionContexts } from '@/ai';
import { computeProfileHash, normalizePreComputedMetrics } from '@/ai/prompts';
import {
  Category,
  ContributionFeedback,
  DailyIntelligence,
  DashboardPreferences,
  DailyTask,
  DimensionContextSnapshot,
  DimensionLogAccumulator,
  Goal,
  LIFE_DIMENSIONS,
  LifeContextSignal,
  LifeContextSnapshot,
  LifeDimension,
  MemoryEntry,
  PreComputedMetrics,
  ProfileGap,
  PromptConfig,
  SessionDelta,
  TimelineEvent,
  UserProfile,
  createEmptySnapshot,
} from '@/data';

type SignalHandler = (signal: LifeContextSignal) => void | Promise<void>;
type SnapshotMap = Partial<Record<LifeDimension, DimensionContextSnapshot>>;

type UseLifeContextOptions = {
  isOnboarded: boolean;
  profile: UserProfile;
  memoryItems: MemoryEntry[];
  goals: Goal[];
  timelineEvents: TimelineEvent[];
  dailyPlan: DailyTask[];
  prompts: PromptConfig[];
  lifeContextSnapshots: LifeContextSnapshot[];
  latestDimensionSnapshots: SnapshotMap;
  lastSessionScores: Partial<Record<LifeDimension, number>>;
  dashboardPreferences: DashboardPreferences;
  setLifeContextSnapshots: Dispatch<SetStateAction<LifeContextSnapshot[]>>;
  setLatestDimensionSnapshots: Dispatch<SetStateAction<SnapshotMap>>;
  setLastSessionScores: Dispatch<SetStateAction<Partial<Record<LifeDimension, number>>>>;
  setDashboardPreferences: Dispatch<SetStateAction<DashboardPreferences>>;
  setLifeContextSignalHandler?: (handler: SignalHandler | null) => void;
};

export type LifeContextController = {
  currentSnapshots: Record<LifeDimension, DimensionContextSnapshot>;
  currentNarrative: string | null;
  criticalPriorities: LifeContextSnapshot['criticalPriorities'];
  profileGaps: ProfileGap[];
  snapshotHistory: LifeContextSnapshot[];
  sessionDeltas: SessionDelta[];
  lastSessionScores: Partial<Record<LifeDimension, number>>;
  refreshingDimensions: Set<LifeDimension>;
  isRefreshingNarrative: boolean;
  refreshedThisSession: Set<LifeDimension>;
  accumulator: DimensionLogAccumulator;
  isSnapshotExpanded: boolean;
  selectedDimension: LifeDimension;
  dailyIntelligence: DailyIntelligence;
  preComputedMetrics: PreComputedMetrics;
  dismissedProfileGaps: Record<string, number>;
  error: string | null;
  handleLifeContextSignal: (signal: LifeContextSignal) => Promise<void>;
  refreshAllDimensions: () => Promise<void>;
  refreshDimension: (dimension: LifeDimension) => Promise<void>;
  selectDimension: (dimension: LifeDimension) => void;
  toggleSnapshotExpanded: () => void;
  dismissProfileGap: (key: string) => void;
  computeContribution: (newMemory: MemoryEntry) => ContributionFeedback;
  saveSessionScores: () => void;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const THRESHOLD_TIER2 = 3;

const emptySnapshot = createEmptySnapshot;

const toLifeDimension = (category: Category | string | undefined): LifeDimension | null => {
  if (category === Category.HEALTH) return Category.HEALTH;
  if (category === Category.FINANCE) return Category.FINANCE;
  if (category === Category.RELATIONSHIPS || category === Category.SOCIAL) {
    return Category.RELATIONSHIPS;
  }
  if (category === Category.SPIRITUAL) return Category.SPIRITUAL;
  if (category === Category.PERSONAL) return Category.PERSONAL;
  return null;
};

const weekOf = (date: Date): string => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((target.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7);
  return `${target.getUTCFullYear()}-${String(weekNum).padStart(2, '0')}`;
};

const getWeekLabel = (isoDate: string): string => {
  const dt = new Date(isoDate);
  const start = new Date(dt.getTime() - dt.getDay() * DAY_MS);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${formatter.format(start)}`;
};

const parseNumeric = (value: string | undefined): number | null => {
  if (!value) return null;
  const normalized = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseHeightMeters = (value: string | undefined): number | null => {
  if (!value) return null;
  const cmMatch = value.match(/(\d+(?:\.\d+)?)\s*cm/i);
  if (cmMatch) return Number.parseFloat(cmMatch[1]) / 100;
  const mMatch = value.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (mMatch) return Number.parseFloat(mMatch[1]);
  const feetInchMatch = value.match(/(\d+)\s*'\s*(\d+)?/);
  if (feetInchMatch) {
    const feet = Number.parseInt(feetInchMatch[1], 10);
    const inches = Number.parseInt(feetInchMatch[2] || '0', 10);
    return (feet * 12 + inches) * 0.0254;
  }
  return null;
};

const parseSleepDuration = (sleepTime: string, wakeTime: string): number | null => {
  if (!sleepTime || !wakeTime) return null;
  const [sleepHour, sleepMinute] = sleepTime.split(':').map((v) => Number.parseInt(v, 10));
  const [wakeHour, wakeMinute] = wakeTime.split(':').map((v) => Number.parseInt(v, 10));
  if (
    !Number.isFinite(sleepHour) ||
    !Number.isFinite(sleepMinute) ||
    !Number.isFinite(wakeHour) ||
    !Number.isFinite(wakeMinute)
  ) {
    return null;
  }
  const sleepMinutes = sleepHour * 60 + sleepMinute;
  const wakeMinutes = wakeHour * 60 + wakeMinute;
  const diff = wakeMinutes >= sleepMinutes ? wakeMinutes - sleepMinutes : 24 * 60 - sleepMinutes + wakeMinutes;
  return Number((diff / 60).toFixed(1));
};

const parseExerciseTarget = (activityFrequency: string | undefined): number => {
  if (!activityFrequency) return 0;
  const rangeMatch = activityFrequency.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const low = Number.parseFloat(rangeMatch[1]);
    const high = Number.parseFloat(rangeMatch[2]);
    return Number(((low + high) / 2).toFixed(1));
  }
  const numeric = activityFrequency.match(/(\d+(?:\.\d+)?)/);
  if (numeric) return Number.parseFloat(numeric[1]);
  if (/daily/i.test(activityFrequency)) return 7;
  if (/weekly/i.test(activityFrequency)) return 1;
  return 0;
};

const parsePracticeTarget = (practicePulse: string | undefined): number => {
  if (!practicePulse) return 0;
  if (/daily/i.test(practicePulse)) return 7;
  if (/weekly/i.test(practicePulse)) return 1;
  const numeric = practicePulse.match(/(\d+(?:\.\d+)?)/);
  return numeric ? Number.parseFloat(numeric[1]) : 0;
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const daysSince = (timestamp: number | null): number | null => {
  if (!timestamp) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / DAY_MS));
};

const mentionsCommitment = (content: string, commitment: string): boolean => {
  const contentNormalized = content.toLowerCase();
  const commitmentNormalized = commitment.toLowerCase();
  if (contentNormalized.includes(commitmentNormalized)) return true;
  return commitmentNormalized
    .split(/\s+/)
    .filter((token) => token.length > 3)
    .every((token) => contentNormalized.includes(token));
};

const computeDimensionStreak = (memoryItems: MemoryEntry[], dimension: LifeDimension): number => {
  const relevant = memoryItems
    .filter((item) => toLifeDimension(item.category) === dimension)
    .sort((a, b) => b.timestamp - a.timestamp);
  if (relevant.length === 0) return 0;
  const uniqueDays = new Set(relevant.map((item) => new Date(item.timestamp).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (uniqueDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const computeAge = (birthday?: string): number | null => {
  if (!birthday) return null;
  const dob = new Date(birthday);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  const dayDelta = now.getDate() - dob.getDate();
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) age -= 1;
  return age >= 0 ? age : null;
};

const buildFallbackNarrative = (
  profile: UserProfile,
  dimensionSnapshots: DimensionContextSnapshot[]
): string => {
  const age = computeAge(profile.identify?.birthday);
  const name = profile.identify?.name || 'You';
  const location = profile.identify?.location || 'your location';
  const role = profile.personal?.jobRole || 'your role';
  const top = [...dimensionSnapshots].sort((a, b) => b.score - a.score)[0];
  const bottom = [...dimensionSnapshots].sort((a, b) => a.score - b.score)[0];
  const avg = Math.round(
    dimensionSnapshots.reduce((s, i) => s + (i.score || 0), 0) /
      Math.max(1, dimensionSnapshots.length)
  );
  const agePart = typeof age === 'number' ? ` (${age})` : '';
  return (
    `${name}${agePart}, ${role} in ${location}: overall score ${avg}. ` +
    `${top.dimension} leads at ${top.score}, while ${bottom.dimension} (${bottom.score}) is the primary constraint. ` +
    `Focus: stabilize ${bottom.dimension.toLowerCase()} without sacrificing ${top.dimension.toLowerCase()} momentum.`
  );
};

const buildFallbackPriorities = (dimensionSnapshots: DimensionContextSnapshot[]) => {
  const sorted = [...dimensionSnapshots]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  return sorted.map((snapshot) => ({
    dimension: snapshot.dimension,
    title: `${snapshot.dimension} Stabilization`,
    rationale: `Current score ${snapshot.score} with trend ${snapshot.trend}; this is the highest leverage constraint now.`,
    consequence: `If ignored for 1-2 weeks, ${snapshot.dimension.toLowerCase()} drag can reduce overall execution stability.`,
  }));
};

const isNarrativeFallback = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.includes('not enough verified life context') ||
    normalized.includes('log a few check-ins to unlock a full snapshot') ||
    normalized.length < 40
  );
};

const computeFidelity = (
  dimension: LifeDimension,
  profile: UserProfile,
  memoryItems: MemoryEntry[]
): 0 | 1 | 2 | 3 => {
  const requiredFields: Record<LifeDimension, Array<string | string[]>> = {
    [Category.HEALTH]: [['health', 'height'], ['health', 'weight'], ['health', 'activityFrequency']],
    [Category.FINANCE]: [['finances', 'income'], ['finances', 'fixedCosts'], ['finances', 'variableCosts']],
    [Category.RELATIONSHIPS]: [['relationship', 'relationshipStatus'], ['relationship', 'socialEnergy']],
    [Category.SPIRITUAL]: [['spiritual', 'worldview'], ['spiritual', 'practicePulse']],
    [Category.PERSONAL]: [['personal', 'jobRole'], ['personal', 'interests']],
  };

  const hasRequired = requiredFields[dimension].every((path) => {
    const [section, field] = path as [keyof UserProfile, string];
    const value = (profile[section] as Record<string, unknown>)?.[field];
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });

  if (!hasRequired) return 0;
  const windowStart = Date.now() - 30 * DAY_MS;
  const dimensionLogs = memoryItems.filter(
    (item) => toLifeDimension(item.category) === dimension && item.timestamp >= windowStart
  ).length;
  if (dimensionLogs === 0) return 1;
  if (dimensionLogs < 10) return 2;
  return 3;
};

const computeMetrics = (profile: UserProfile, memoryItems: MemoryEntry[]): PreComputedMetrics => {
  const now = Date.now();
  const weekStart = now - 7 * DAY_MS;
  const fourteenDaysStart = now - 14 * DAY_MS;
  const monthStart = now - 30 * DAY_MS;

  const heightM = parseHeightMeters(profile.health?.height);
  const weightKg = parseNumeric(profile.health?.weight);
  const bmi = heightM && weightKg ? Number((weightKg / (heightM * heightM)).toFixed(1)) : null;
  const bmiCategory =
    bmi === null
      ? null
      : bmi < 18.5
        ? 'underweight'
        : bmi < 25
          ? 'normal'
          : bmi < 30
            ? 'overweight'
            : 'obese';

  const healthLogs = memoryItems.filter(
    (item) => toLifeDimension(item.category) === Category.HEALTH && item.timestamp >= monthStart
  );
  const sleepMentions = healthLogs
    .map((item) => {
      const match = item.content.match(/(\d+(?:\.\d+)?)\s*(h|hours?)/i);
      return match ? Number.parseFloat(match[1]) : null;
    })
    .filter((value): value is number => value !== null);
  const exerciseWeek = healthLogs.filter(
    (item) => item.timestamp >= weekStart && /run|workout|gym|swim|cycle|tennis|exercise/i.test(item.content)
  );
  const lastExerciseLog = exerciseWeek.length > 0
    ? Math.max(...exerciseWeek.map((item) => item.timestamp))
    : healthLogs
        .filter((item) => /run|workout|gym|swim|cycle|tennis|exercise/i.test(item.content))
        .map((item) => item.timestamp)
        .sort((a, b) => b - a)[0] || null;

  const income = parseNumeric(profile.finances?.income);
  const fixedCosts = parseNumeric(profile.finances?.fixedCosts);
  const variableCosts = parseNumeric(profile.finances?.variableCosts);
  const assetsTotal = parseNumeric(profile.finances?.assetsTotal);
  const liabilities = parseNumeric(profile.finances?.liabilities);
  const cash = parseNumeric(profile.finances?.assetsBreakdown?.cash);

  const relationships14d = memoryItems.filter(
    (item) => toLifeDimension(item.category) === Category.RELATIONSHIPS && item.timestamp >= fourteenDaysStart
  );
  const commitments = asArray<string>(profile.relationship?.dailyCommitments).filter(
    (commitment): commitment is string =>
      typeof commitment === 'string' && commitment.trim().length > 0
  );
  const commitmentsFulfilled7d = commitments.filter((commitment) =>
    memoryItems.some(
      (item) =>
        item.timestamp >= weekStart &&
        toLifeDimension(item.category) === Category.RELATIONSHIPS &&
        mentionsCommitment(item.content, commitment)
    )
  ).length;

  const spiritualLogs = memoryItems.filter(
    (item) => toLifeDimension(item.category) === Category.SPIRITUAL && item.timestamp >= weekStart
  );
  const lastPractice = memoryItems
    .filter((item) => toLifeDimension(item.category) === Category.SPIRITUAL)
    .map((item) => item.timestamp)
    .sort((a, b) => b - a)[0] || null;

  const personalLogs = memoryItems.filter(
    (item) => toLifeDimension(item.category) === Category.PERSONAL && item.timestamp >= monthStart
  );
  const interests = asArray<string>(profile.personal?.interests).filter(
    (interest): interest is string => typeof interest === 'string' && interest.trim().length > 0
  );
  const innerCircle = asArray<Record<string, unknown>>(profile.innerCircle);
  const interestLogs = personalLogs.filter((item) =>
    interests.some((interest) => item.content.toLowerCase().includes(interest.toLowerCase()))
  );
  const growthLogs = personalLogs.filter((item) =>
    /learn|study|practice|course|skill|reading|training/i.test(item.content)
  );
  const dimensionLogCounts30d = LIFE_DIMENSIONS.reduce((acc, dimension) => {
    acc[dimension] = memoryItems.filter(
      (item) => toLifeDimension(item.category) === dimension && item.timestamp >= monthStart
    ).length;
    return acc;
  }, {} as Partial<Record<LifeDimension, number>>);

  return normalizePreComputedMetrics({
    bmi,
    bmiCategory,
    baselineSleepHours: parseSleepDuration(profile.health?.sleepTime || '', profile.health?.wakeTime || ''),
    loggedSleepAvg:
      sleepMentions.length > 0
        ? Number((sleepMentions.reduce((sum, value) => sum + value, 0) / sleepMentions.length).toFixed(1))
        : null,
    exerciseSessionsThisWeek: exerciseWeek.length,
    exerciseTarget: parseExerciseTarget(profile.health?.activityFrequency),
    exerciseAdherence:
      parseExerciseTarget(profile.health?.activityFrequency) > 0
        ? Number((exerciseWeek.length / parseExerciseTarget(profile.health?.activityFrequency)).toFixed(2))
        : 0,
    daysSinceLastExercise: daysSince(lastExerciseLog),
    savingsRate:
      income && income > 0 && fixedCosts !== null && variableCosts !== null
        ? Number((((income - fixedCosts - variableCosts) / income)).toFixed(3))
        : null,
    netWorth:
      assetsTotal !== null && liabilities !== null ? Number((assetsTotal - liabilities).toFixed(2)) : null,
    emergencyFundMonths:
      cash !== null && fixedCosts && fixedCosts > 0 ? Number((cash / fixedCosts).toFixed(2)) : null,
    debtToIncomeRatio:
      liabilities !== null && income && income > 0 ? Number((liabilities / (income * 12)).toFixed(3)) : null,
    socialInteractions14d: relationships14d.length,
    innerCircleGaps: innerCircle.map((contact) => {
      const identifier =
        typeof contact.id === 'string' && contact.id.length > 0
          ? contact.id
          : typeof contact.name === 'string' && contact.name.length > 0
            ? contact.name
            : 'Inner circle contact';
      const role = typeof contact.type === 'string' ? contact.type : 'Contact';
      return {
        name: identifier,
        role,
        daysSinceContact: Math.min(
          999,
          daysSince(
            memoryItems
              .filter((item) => toLifeDimension(item.category) === Category.RELATIONSHIPS)
              .find((item) => item.content.toLowerCase().includes(identifier.toLowerCase()))
              ?.timestamp || null
          ) || 999
        ),
      };
    }),
    commitmentsFulfilled7d,
    commitmentsTotal: commitments.length,
    practiceSessionsThisWeek: spiritualLogs.length,
    practiceTarget: parsePracticeTarget(profile.spiritual?.practicePulse),
    practiceAdherence:
      parsePracticeTarget(profile.spiritual?.practicePulse) > 0
        ? Number((spiritualLogs.length / parsePracticeTarget(profile.spiritual?.practicePulse)).toFixed(2))
        : 0,
    daysSinceLastPractice: daysSince(lastPractice),
    careerLogsThisMonth: personalLogs.filter((item) => /work|career|project|promotion|manager/i.test(item.content)).length,
    interestLogsThisMonth: interestLogs.length,
    growthLogsThisMonth: growthLogs.length,
    statedInterests: interests,
    dimensionLogCounts30d,
  });
};

const computeDailyIntelligenceState = (
  memoryItems: MemoryEntry[],
  goals: Goal[],
  timelineEvents: TimelineEvent[],
  dailyPlan: DailyTask[],
  profile: UserProfile
): DailyIntelligence => {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();

  const dimensionGaps = LIFE_DIMENSIONS.map((dimension) => {
    const last = memoryItems
      .filter((item) => toLifeDimension(item.category) === dimension)
      .map((item) => item.timestamp)
      .sort((a, b) => b - a)[0];
    const days = last ? Math.max(0, Math.floor((now - last) / DAY_MS)) : 999;
    return {
      dimension,
      daysSinceLastLog: days,
      label: days >= 999 ? `No ${dimension} logs yet` : `${days} days without a ${dimension} log`,
    };
  }).sort((a, b) => b.daysSinceLastLog - a.daysSinceLastLog);

  const streaksAtRisk = LIFE_DIMENSIONS.map((dimension) => {
    const streak = computeDimensionStreak(memoryItems, dimension);
    const hasTodayLog = memoryItems.some(
      (item) => toLifeDimension(item.category) === dimension && item.timestamp >= todayStart
    );
    return {
      dimension,
      currentStreak: streak,
      breaksToday: streak > 0 && !hasTodayLog,
    };
  }).filter((item) => item.currentStreak > 0);

  const eventCountdowns = timelineEvents
    .filter((event) => new Date(event.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
    .map((event) => {
      const daysUntil = Math.max(0, Math.ceil((new Date(event.date).getTime() - now) / DAY_MS));
      const prepReady = event.metadata?.prepStatus === 'ready';
      return {
        event,
        daysUntil,
        prepReady,
        urgencyLabel: prepReady
          ? `${daysUntil} day${daysUntil === 1 ? '' : 's'} - prep ready`
          : `${daysUntil} day${daysUntil === 1 ? '' : 's'} - prep needed`,
      };
    });

  const goalDeadlines = goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => {
      const target = new Date(goal.targetDate).getTime();
      const daysLeft = Number.isFinite(target) ? Math.ceil((target - now) / DAY_MS) : 999;
      const elapsedDays = Math.max(1, Math.ceil((now - goal.createdAt) / DAY_MS));
      const durationDays = Number.isFinite(target) ? Math.max(1, Math.ceil((target - goal.createdAt) / DAY_MS)) : 1;
      const expectedProgress = Math.min(100, Number(((elapsedDays / durationDays) * 100).toFixed(1)));
      const onTrack = goal.progress >= expectedProgress;
      return {
        goal,
        daysLeft,
        onTrack,
        urgencyLabel:
          daysLeft < 0
            ? `${Math.abs(daysLeft)} days overdue`
            : `${daysLeft} days left${onTrack ? ' - on track' : ' - behind target'}`,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const todaysCommitments = asArray<string>(profile.relationship?.dailyCommitments)
    .filter((commitment): commitment is string => typeof commitment === 'string')
    .map((commitment) => ({
      commitment,
      fulfilled: memoryItems.some(
        (item) => item.timestamp >= todayStart && mentionsCommitment(item.content, commitment)
      ),
    }));

  const tasksTotal = dailyPlan.length;
  const tasksCompleted = dailyPlan.filter((task) => task.completed).length;
  const dailyPlanStale =
    tasksTotal === 0 || !dailyPlan.some((task) => task.createdAt >= todayStart);

  return {
    dimensionGaps,
    streaksAtRisk,
    eventCountdowns,
    goalDeadlines,
    todaysCommitments,
    dailyPlanStale,
    tasksCompleted,
    tasksTotal,
  };
};

export const useLifeContext = ({
  isOnboarded,
  profile,
  memoryItems,
  goals,
  timelineEvents,
  dailyPlan,
  prompts,
  lifeContextSnapshots,
  latestDimensionSnapshots,
  lastSessionScores,
  dashboardPreferences,
  setLifeContextSnapshots,
  setLatestDimensionSnapshots,
  setLastSessionScores,
  setDashboardPreferences,
  setLifeContextSignalHandler,
}: UseLifeContextOptions): LifeContextController => {
  const [refreshingDimensions, setRefreshingDimensions] = useState<Set<LifeDimension>>(new Set());
  const [isRefreshingNarrative, setIsRefreshingNarrative] = useState(false);
  const [refreshedThisSession, setRefreshedThisSession] = useState<Set<LifeDimension>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [accumulator, setAccumulator] = useState<DimensionLogAccumulator>({
    counts: {},
    weekOf: weekOf(new Date()),
  });
  const accumulatorRef = useRef<DimensionLogAccumulator>({ counts: {}, weekOf: weekOf(new Date()) });
  const refreshedThisSessionRef = useRef<Set<LifeDimension>>(new Set());
  const didColdStartRunRef = useRef(false);
  const didNarrativeBootstrapRef = useRef(false);
  const didNarrativeRepairRef = useRef(false);

  useEffect(() => {
    refreshedThisSessionRef.current = refreshedThisSession;
  }, [refreshedThisSession]);

  useEffect(() => {
    accumulatorRef.current = accumulator;
  }, [accumulator]);

  const preComputedMetrics = useMemo(
    () => computeMetrics(profile, memoryItems),
    [profile, memoryItems]
  );

  const currentSnapshots = useMemo(() => {
    const map: Record<LifeDimension, DimensionContextSnapshot> = {
      [Category.HEALTH]: latestDimensionSnapshots[Category.HEALTH] || emptySnapshot(Category.HEALTH),
      [Category.FINANCE]: latestDimensionSnapshots[Category.FINANCE] || emptySnapshot(Category.FINANCE),
      [Category.RELATIONSHIPS]:
        latestDimensionSnapshots[Category.RELATIONSHIPS] || emptySnapshot(Category.RELATIONSHIPS),
      [Category.SPIRITUAL]:
        latestDimensionSnapshots[Category.SPIRITUAL] || emptySnapshot(Category.SPIRITUAL),
      [Category.PERSONAL]:
        latestDimensionSnapshots[Category.PERSONAL] || emptySnapshot(Category.PERSONAL),
    };
    return map;
  }, [latestDimensionSnapshots]);

  const latestSnapshot = lifeContextSnapshots[0];
  const currentNarrative = latestSnapshot?.narrativeParagraph || null;
  const criticalPriorities = latestSnapshot?.criticalPriorities || [];
  const profileGaps: ProfileGap[] = latestSnapshot?.profileGaps || [];
  const selectedDimension = dashboardPreferences.selectedDimension;
  const isSnapshotExpanded = dashboardPreferences.isSnapshotExpanded;
  const dismissedProfileGaps = dashboardPreferences.dismissedProfileGaps || {};
  const snapshotHistory = lifeContextSnapshots;

  const sessionDeltas: SessionDelta[] = useMemo(() => {
    return LIFE_DIMENSIONS.map((dimension) => {
      const previous = lastSessionScores[dimension] ?? 0;
      const current = currentSnapshots[dimension]?.score ?? 0;
      return {
        dimension,
        previousScore: previous,
        currentScore: current,
        delta: current - previous,
      };
    }).filter((delta) => Math.abs(delta.delta) >= 1);
  }, [currentSnapshots, lastSessionScores]);

  const dailyIntelligence: DailyIntelligence = useMemo(
    () => computeDailyIntelligenceState(memoryItems, goals, timelineEvents, dailyPlan, profile),
    [memoryItems, goals, timelineEvents, dailyPlan, profile]
  );

  const buildDimensionPayload = useCallback(
    (dimensions: LifeDimension[]) => {
      const memoryByDimension: Partial<Record<LifeDimension, MemoryEntry[]>> = {};
      const goalsByDimension: Partial<Record<LifeDimension, Goal[]>> = {};
      const previousSnapshots: SnapshotMap = {};

      dimensions.forEach((dimension) => {
        memoryByDimension[dimension] = memoryItems
          .filter((item) => toLifeDimension(item.category) === dimension)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 80);
        goalsByDimension[dimension] = goals
          .filter((goal) => toLifeDimension(goal.category) === dimension)
          .slice(0, 20);
        previousSnapshots[dimension] = latestDimensionSnapshots[dimension];
      });

      return { memoryByDimension, goalsByDimension, previousSnapshots };
    },
    [goals, latestDimensionSnapshots, memoryItems]
  );

  const createLifeSnapshot = useCallback(
    async (snapshotsMap: SnapshotMap) => {
      setIsRefreshingNarrative(true);
      const dimensionSnapshots = LIFE_DIMENSIONS.map(
        (dimension) => snapshotsMap[dimension] || emptySnapshot(dimension)
      );
      const fallbackNarrative = buildFallbackNarrative(profile, dimensionSnapshots);
      const fallbackPriorities = buildFallbackPriorities(dimensionSnapshots);
      try {
        const lifeSnapshotPrompt = prompts.find((prompt) => prompt.id === 'lifeSnapshotSynthesis');
        const synthesis = await generateLifeSnapshot(profile, dimensionSnapshots, lifeSnapshotPrompt);
        const narrativeParagraph =
          typeof synthesis.narrativeParagraph === 'string' &&
          synthesis.narrativeParagraph.trim().length > 0 &&
          !isNarrativeFallback(synthesis.narrativeParagraph)
            ? synthesis.narrativeParagraph
            : fallbackNarrative;
        const criticalPriorities =
          Array.isArray(synthesis.criticalPriorities) && synthesis.criticalPriorities.length > 0
            ? synthesis.criticalPriorities.slice(0, 3)
            : fallbackPriorities;
        const snapshotAt = new Date().toISOString();
        const snapshot: LifeContextSnapshot = {
          id: `life-snapshot-${Date.now()}`,
          snapshotAt,
          weekLabel: getWeekLabel(snapshotAt),
          narrativeParagraph,
          dimensions: dimensionSnapshots,
          criticalPriorities,
          profileGaps: synthesis.profileGaps,
          profileHash: computeProfileHash(profile),
        };
        setLifeContextSnapshots((prev) => [snapshot, ...prev].slice(0, 64));
      } catch (err: any) {
        setError(err?.message || 'Failed to generate life snapshot.');
        const snapshotAt = new Date().toISOString();
        const snapshot: LifeContextSnapshot = {
          id: `life-snapshot-fallback-${Date.now()}`,
          snapshotAt,
          weekLabel: getWeekLabel(snapshotAt),
          narrativeParagraph: fallbackNarrative,
          dimensions: dimensionSnapshots,
          criticalPriorities: fallbackPriorities,
          profileGaps: [],
          profileHash: computeProfileHash(profile),
        };
        setLifeContextSnapshots((prev) => [snapshot, ...prev].slice(0, 64));
      } finally {
        setIsRefreshingNarrative(false);
      }
    },
    [profile, prompts, setLifeContextSnapshots]
  );

  const refreshDimensionsBatch = useCallback(
    async (dimensions: LifeDimension[], reason: string) => {
      const unique = [...new Set(dimensions)];
      if (!isOnboarded || unique.length === 0) return;

      setRefreshingDimensions((prev) => {
        const next = new Set(prev);
        unique.forEach((dimension) => next.add(dimension));
        return next;
      });

      try {
        const { memoryByDimension, goalsByDimension, previousSnapshots } =
          buildDimensionPayload(unique);
        const promptConfig = prompts.find((prompt) => prompt.id === 'dimensionContext');
        const snapshots = await refreshDimensionContexts(
          unique,
          profile,
          memoryByDimension,
          goalsByDimension,
          previousSnapshots,
          preComputedMetrics,
          promptConfig
        );

        const normalizedSnapshots = snapshots.map((snapshot) => {
          const fidelity = computeFidelity(snapshot.dimension, profile, memoryItems);
          return { ...snapshot, fidelityLevel: fidelity, triggeredBy: reason };
        });

        let nextSnapshotMap: SnapshotMap = {};
        setLatestDimensionSnapshots((prev) => {
          const next = { ...prev };
          normalizedSnapshots.forEach((snapshot) => {
            next[snapshot.dimension] = snapshot;
          });
          nextSnapshotMap = next;
          return next;
        });

        setRefreshedThisSession((prev) => {
          const next = new Set(prev);
          unique.forEach((dimension) => next.add(dimension));
          refreshedThisSessionRef.current = next;
          return next;
        });

        const shouldRefreshNarrative =
          unique.length === LIFE_DIMENSIONS.length || refreshedThisSessionRef.current.size >= 3;
        if (shouldRefreshNarrative) {
          await createLifeSnapshot(nextSnapshotMap);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to refresh life context.');
      } finally {
        setRefreshingDimensions((prev) => {
          const next = new Set(prev);
          unique.forEach((dimension) => next.delete(dimension));
          return next;
        });
      }
    },
    [
      buildDimensionPayload,
      createLifeSnapshot,
      isOnboarded,
      memoryItems,
      preComputedMetrics,
      profile,
      prompts,
      setLatestDimensionSnapshots,
    ]
  );

  const refreshAllDimensions = useCallback(async () => {
    await refreshDimensionsBatch(LIFE_DIMENSIONS, 'manual_full_refresh');
  }, [refreshDimensionsBatch]);

  const refreshDimension = useCallback(
    async (dimension: LifeDimension) => {
      await refreshDimensionsBatch([dimension], `manual_${dimension.toLowerCase()}_refresh`);
    },
    [refreshDimensionsBatch]
  );

  const handleLifeContextSignal = useCallback(
    async (signal: LifeContextSignal) => {
      if (!signal || signal.affectedDimensions.length === 0) return;
      if (signal.tier === 1) {
        await refreshDimensionsBatch(signal.affectedDimensions, signal.reason);
        return;
      }
      if (signal.tier === 3) return;

      const currentWeek = weekOf(new Date());
      const nextCounts =
        accumulatorRef.current.weekOf === currentWeek
          ? { ...accumulatorRef.current.counts }
          : ({} as Partial<Record<LifeDimension, number>>);
      const dueDimensions: LifeDimension[] = [];
      signal.affectedDimensions.forEach((dimension) => {
        const nextCount = (nextCounts[dimension] || 0) + 1;
        nextCounts[dimension] = nextCount;
        if (nextCount >= THRESHOLD_TIER2) {
          dueDimensions.push(dimension);
          nextCounts[dimension] = 0;
        }
      });
      const nextAccumulator: DimensionLogAccumulator = {
        counts: nextCounts,
        weekOf: currentWeek,
      };
      accumulatorRef.current = nextAccumulator;
      setAccumulator(nextAccumulator);

      if (dueDimensions.length > 0) {
        await refreshDimensionsBatch(dueDimensions, signal.reason);
      }
    },
    [refreshDimensionsBatch]
  );

  const selectDimension = useCallback(
    (dimension: LifeDimension) => {
      setDashboardPreferences((prev) => ({ ...prev, selectedDimension: dimension }));
    },
    [setDashboardPreferences]
  );

  const toggleSnapshotExpanded = useCallback(() => {
    setDashboardPreferences((prev) => ({
      ...prev,
      isSnapshotExpanded: !prev.isSnapshotExpanded,
    }));
  }, [setDashboardPreferences]);

  const dismissProfileGap = useCallback(
    (key: string) => {
      if (!key) return;
      setDashboardPreferences((prev) => ({
        ...prev,
        dismissedProfileGaps: {
          ...(prev.dismissedProfileGaps || {}),
          [key]: Date.now(),
        },
      }));
    },
    [setDashboardPreferences]
  );

  const saveSessionScores = useCallback(() => {
    const scores = LIFE_DIMENSIONS.reduce((acc, dimension) => {
      acc[dimension] = currentSnapshots[dimension]?.score || 0;
      return acc;
    }, {} as Partial<Record<LifeDimension, number>>);
    setLastSessionScores(scores);
  }, [currentSnapshots, setLastSessionScores]);

  const computeContribution = useCallback(
    (newMemory: MemoryEntry): ContributionFeedback => {
      const affectedDimension = toLifeDimension(newMemory.category);
      const dimensions = affectedDimension ? [affectedDimension] : [];
      const affectedDimensions = dimensions.map((dimension) => {
        const scoreAfter = currentSnapshots[dimension]?.score || 0;
        const scoreBefore = lastSessionScores[dimension] ?? scoreAfter;
        return {
          dimension,
          scoreBefore,
          scoreAfter,
          delta: scoreAfter - scoreBefore,
        };
      });
      const goalImpacts = goals
        .filter((goal) => dimensions.includes(goal.category as LifeDimension))
        .slice(0, 2)
        .map((goal) => ({
          goalId: goal.id,
          goalTitle: goal.title,
          progressBefore: goal.progress,
          progressAfter: goal.progress,
        }));
      const streakDimension = dimensions[0];
      const streakDays = streakDimension ? computeDimensionStreak(memoryItems, streakDimension) : 0;
      const streakUpdate =
        streakDimension && streakDays > 0
          ? {
              dimension: streakDimension,
              days: streakDays,
              isMilestone: [7, 14, 30, 60, 90].includes(streakDays),
            }
          : undefined;
      return {
        logSummary: newMemory.content,
        affectedDimensions,
        goalImpacts,
        streakUpdate,
      };
    },
    [currentSnapshots, goals, lastSessionScores, memoryItems]
  );

  useEffect(() => {
    if (!setLifeContextSignalHandler) return;
    setLifeContextSignalHandler(handleLifeContextSignal);
    return () => setLifeContextSignalHandler(null);
  }, [handleLifeContextSignal, setLifeContextSignalHandler]);

  useEffect(() => {
    if (!isOnboarded) return;
    if (didColdStartRunRef.current) return;
    const hasAnySnapshot = LIFE_DIMENSIONS.some((dimension) => Boolean(latestDimensionSnapshots[dimension]));
    if (hasAnySnapshot) return;
    didColdStartRunRef.current = true;
    void refreshAllDimensions();
  }, [isOnboarded, latestDimensionSnapshots, refreshAllDimensions]);

  useEffect(() => {
    if (!isOnboarded) return;
    if (didNarrativeBootstrapRef.current) return;
    if (lifeContextSnapshots.length > 0) return;
    const hasAnySnapshot = LIFE_DIMENSIONS.some((dimension) => Boolean(latestDimensionSnapshots[dimension]));
    if (!hasAnySnapshot) return;
    didNarrativeBootstrapRef.current = true;
    void createLifeSnapshot(latestDimensionSnapshots);
  }, [createLifeSnapshot, isOnboarded, latestDimensionSnapshots, lifeContextSnapshots.length]);

  useEffect(() => {
    if (!isOnboarded) return;
    if (didNarrativeRepairRef.current) return;
    if (!currentNarrative) return;
    if (!isNarrativeFallback(currentNarrative)) return;
    didNarrativeRepairRef.current = true;
    void createLifeSnapshot(currentSnapshots);
  }, [createLifeSnapshot, currentNarrative, currentSnapshots, isOnboarded]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveSessionScores();
      }
    };
    const handleUnload = () => saveSessionScores();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [saveSessionScores]);

  return {
    currentSnapshots,
    currentNarrative,
    criticalPriorities,
    profileGaps,
    snapshotHistory,
    sessionDeltas,
    lastSessionScores,
    refreshingDimensions,
    isRefreshingNarrative,
    refreshedThisSession,
    accumulator,
    isSnapshotExpanded,
    selectedDimension,
    dailyIntelligence,
    preComputedMetrics,
    dismissedProfileGaps,
    error,
    handleLifeContextSignal,
    refreshAllDimensions,
    refreshDimension,
    selectDimension,
    toggleSnapshotExpanded,
    dismissProfileGap,
    computeContribution,
    saveSessionScores,
  };
};
