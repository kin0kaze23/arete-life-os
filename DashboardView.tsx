import React, { useMemo, useState, useEffect } from 'react';
import {
  Zap,
  ShieldCheck,
  Sparkles,
  Heart,
  Wallet,
  Users,
  User,
  Globe,
  Shield,
} from 'lucide-react';
import { getProfileCompletion, Skeleton } from './SharedUI';
import {
  DailyTask,
  UserProfile,
  ProactiveInsight,
  Category,
  MemoryEntry,
  TimelineEvent,
  BlindSpot,
  Recommendation,
  Source,
  SourceFile,
  FinanceMetrics,
} from './types';
import { SourceViewer } from './SourceViewer';
import { getFile } from './fileStore';

interface DashboardViewProps {
  memory: MemoryEntry[];
  tasks: DailyTask[];
  dailyPlan: DailyTask[];
  timelineEvents: TimelineEvent[];
  insights: ProactiveInsight[];
  blindSpots?: BlindSpot[];
  profile: UserProfile;
  ruleOfLife: any;
  sources: Source[];
  recommendations: Recommendation[];
  toggleTask: (id: string) => void;
  refreshAll: () => void;
  planMyDay: () => void;
  onNavigate: (tab: any) => void;
  updateMemoryItem?: (id: string, updates: Partial<MemoryEntry>) => void;
  deleteMemoryItem?: (id: string) => void;
  isPlanningDay: boolean;
  isGeneratingTasks: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory = [],
  tasks,
  dailyPlan,
  timelineEvents,
  insights,
  blindSpots = [],
  profile,
  ruleOfLife,
  sources,
  recommendations,
  toggleTask,
  refreshAll,
  planMyDay,
  onNavigate,
  updateMemoryItem,
  deleteMemoryItem,
  isPlanningDay,
  isGeneratingTasks,
}) => {
  const [expandedDoId, setExpandedDoId] = useState<string | null>(null);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<'now' | 'soon' | 'always'>('now');
  const [drawerPillarId, setDrawerPillarId] = useState<string | null>(null);
  const [viewerSourceId, setViewerSourceId] = useState<string | null>(null);
  const [viewerFile, setViewerFile] = useState<SourceFile | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [habitDraft, setHabitDraft] = useState<{ title: string; frequency: string }>({
    title: '',
    frequency: 'daily',
  });

  useEffect(() => {
    let isActive = true;
    const loadViewer = async () => {
      if (!viewerSourceId) {
        setViewerFile(null);
        return;
      }
      const source = sources.find((s) => s.id === viewerSourceId);
      if (!source) {
        setViewerFile(null);
        return;
      }
      if (source.data) {
        setViewerFile({ name: source.name, mimeType: source.mimeType, data: source.data });
        return;
      }
      if (source.storageKey) {
        const blob = await getFile(source.storageKey);
        if (!blob || !isActive) return;
        const dataUrl = await blobToDataUrl(blob);
        if (!isActive) return;
        setViewerFile({
          name: source.name,
          mimeType: source.mimeType,
          data: dataUrl.split(',')[1],
        });
      }
    };
    loadViewer();
    return () => {
      isActive = false;
    };
  }, [viewerSourceId, sources]);

  const completion = getProfileCompletion(profile);

  const corePillars = useMemo(
    () => [
      {
        id: 'health',
        title: 'Health',
        categories: [Category.HEALTH],
        icon: <Heart className="text-emerald-400" size={18} />,
        accent: 'emerald',
      },
      {
        id: 'finance',
        title: 'Finance',
        categories: [Category.FINANCE],
        icon: <Wallet className="text-sky-400" size={18} />,
        accent: 'sky',
      },
      {
        id: 'personal',
        title: 'Personal',
        categories: [Category.GENERAL, Category.WORK, Category.SOCIAL],
        icon: <User className="text-violet-400" size={18} />,
        accent: 'violet',
      },
      {
        id: 'relationships',
        title: 'Relationships',
        categories: [Category.RELATIONSHIPS],
        icon: <Users className="text-rose-400" size={18} />,
        accent: 'rose',
      },
      {
        id: 'spiritual',
        title: 'Spiritual',
        categories: [Category.SPIRITUAL],
        icon: <Sparkles className="text-amber-300" size={18} />,
        accent: 'amber',
      },
    ],
    []
  );

  const isFilled = (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return Boolean(value);
  };

  const parseNumber = (value: string) => {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const extractFinanceMetrics = (payload?: unknown): FinanceMetrics | null => {
    if (!payload || typeof payload !== 'object') return null;
    const data = payload as Record<string, unknown>;
    const { income, fixed, variable, dailyVariableBudget, weeklyVariableBudget, savingsRate } =
      data;
    const isNumber = (val: unknown): val is number =>
      typeof val === 'number' && Number.isFinite(val);
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

  const financeMetrics = useMemo(() => {
    const latestMetrics = memory
      .filter((item) => item.metadata?.type === 'finance_metrics')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    const fromMemory = extractFinanceMetrics(latestMetrics?.metadata?.payload);
    if (fromMemory) return fromMemory;
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
  }, [memory, profile.finances]);

  const hasFattyLiver = useMemo(
    () => profile.health.conditions?.some((c) => c.toLowerCase().includes('fatty liver')) || false,
    [profile.health.conditions]
  );

  const getProfileCoverage = (pillarId: string) => {
    const profileFieldSets: Record<string, unknown[]> = {
      health: [
        profile.health.height,
        profile.health.weight,
        profile.health.sleepTime,
        profile.health.wakeTime,
        profile.health.activities,
        profile.health.activityFrequency,
        profile.health.conditions,
        profile.health.medications,
      ],
      finance: [
        profile.finances.assetsTotal,
        profile.finances.assetsBreakdown.cash,
        profile.finances.assetsBreakdown.investments,
        profile.finances.assetsBreakdown.property,
        profile.finances.assetsBreakdown.other,
        profile.finances.liabilities,
        profile.finances.income,
        profile.finances.fixedCosts,
        profile.finances.variableCosts,
      ],
      personal: [
        profile.identify.name,
        profile.identify.location,
        profile.identify.origin,
        profile.personal.status,
        profile.personal.jobRole,
        profile.personal.company,
        profile.personal.interests,
      ],
      relationships: [
        profile.relationship.livingArrangement,
        profile.relationship.socialEnergy,
        profile.relationship.dailyCommitments,
        profile.relationship.socialGoals,
        profile.innerCircle,
      ],
      spiritual: [
        profile.spiritual.worldview,
        profile.spiritual.coreValues,
        profile.spiritual.practicePulse,
      ],
    };
    const fields = profileFieldSets[pillarId] || [];
    const filled = fields.filter(isFilled).length;
    return fields.length === 0 ? 0 : Math.round((filled / fields.length) * 100);
  };

  const getPillarMemory = (categories: Category[]) =>
    memory.filter((item) => categories.includes(item.category));

  const getPillarSourceCount = (categories: Category[]) => {
    const knownSources = new Set(sources.map((s) => s.id));
    const sourceIds = new Set(
      getPillarMemory(categories)
        .map((item) => item.sourceId)
        .filter((id): id is string => Boolean(id) && knownSources.has(id))
    );
    return sourceIds.size;
  };

  const getPillarSources = (categories: Category[]) => {
    const sourceIds = new Set(
      getPillarMemory(categories)
        .map((item) => item.sourceId)
        .filter((id): id is string => Boolean(id))
    );
    return sources.filter((s) => sourceIds.has(s.id));
  };

  const getLatestSignal = (categories: Category[]) => {
    const items = getPillarMemory(categories);
    if (items.length === 0) return null;
    return items.reduce((latest, item) => (item.timestamp > latest ? item.timestamp : latest), 0);
  };

  const priorityRank = (priority: DailyTask['priority']) =>
    priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;

  const buildDoFromTask = (task: DailyTask) => ({
    id: task.id,
    title: task.title,
    why: task.why || task.reasoning || task.description,
    steps: task.steps || [],
    time: task.estimate_min ? `${task.estimate_min}m` : '15m',
    effort: task.energy || 'MEDIUM',
    when: task.start_time
      ? `${task.start_time}${task.end_time ? `–${task.end_time}` : ''}`
      : task.best_window || 'Today',
    inputs: task.inputs || [],
    definition: task.definitionOfDone,
    risks: task.risks || [],
    followUp: 'Log outcome and update vault.',
    type: 'task' as const,
  });

  const buildDoFromRec = (rec: Recommendation) => ({
    id: rec.id,
    title: rec.title,
    why: rec.rationale || rec.description,
    steps: rec.steps || [],
    time: rec.estimatedTime || '15m',
    effort: rec.impactScore >= 8 ? 'HIGH' : rec.impactScore >= 5 ? 'MEDIUM' : 'LOW',
    when: 'Next available block',
    inputs: rec.inputs || [],
    definition: rec.definitionOfDone,
    risks: rec.risks || [],
    followUp: 'Confirm completion in nightly review.',
    type: 'rec' as const,
  });

  const getHorizonDo = () => {
    if (horizon === 'now') {
      const plan = dailyPlan.filter((t) => !t.completed);
      const fallback = tasks.filter((t) => !t.completed);
      const selected = plan.length ? plan : fallback;
      return selected
        .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
        .map(buildDoFromTask);
    }
    if (horizon === 'soon') {
      return tasks
        .filter((t) => !t.completed)
        .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
        .map(buildDoFromTask);
    }
    const always: Array<ReturnType<typeof buildDoFromTask>> = [];
    if (profile.health.sleepTime || profile.health.wakeTime) {
      always.push(
        buildDoFromTask({
          id: `always-sleep`,
          ownerId: profile.id,
          title: 'Protect sleep window',
          description: 'Maintain consistent sleep and wake times.',
          category: Category.HEALTH,
          priority: 'high',
          completed: false,
          createdAt: Date.now(),
          start_time: profile.health.sleepTime || undefined,
          end_time: profile.health.wakeTime || undefined,
        } as DailyTask)
      );
    }
    if (ruleOfLife?.nonNegotiables?.devotion) {
      always.push(
        buildDoFromTask({
          id: `always-devotion`,
          ownerId: profile.id,
          title: 'Daily devotion',
          description: ruleOfLife.nonNegotiables.devotion,
          category: Category.SPIRITUAL,
          priority: 'medium',
          completed: false,
          createdAt: Date.now(),
        } as DailyTask)
      );
    }
    if (ruleOfLife?.nonNegotiables?.sabbath) {
      always.push(
        buildDoFromTask({
          id: `always-sabbath`,
          ownerId: profile.id,
          title: 'Weekly sabbath',
          description: ruleOfLife.nonNegotiables.sabbath,
          category: Category.SPIRITUAL,
          priority: 'medium',
          completed: false,
          createdAt: Date.now(),
        } as DailyTask)
      );
    }
    return always;
  };

  const getWatchFromBlindSpot = (bs: BlindSpot) => ({
    id: bs.id,
    title: bs.signal,
    why: bs.why,
    impact: bs.severity === 'high' ? 'High impact' : bs.severity === 'med' ? 'Moderate' : 'Low',
    prevention: bs.actions?.[0] || 'Define a guardrail and check in.',
  });

  const getWatchFromInsight = (insight: ProactiveInsight) => ({
    id: insight.id,
    title: insight.title,
    why: insight.description,
    impact: 'Moderate',
    prevention: 'Log a quick check-in to confirm status.',
  });

  const getHorizonWatch = () => {
    if (horizon === 'now') {
      const spots = blindSpots
        .slice()
        .sort((a, b) => (a.severity === 'high' ? -1 : b.severity === 'high' ? 1 : 0))
        .map(getWatchFromBlindSpot);
      if (spots.length > 0) return spots;
      return insights.map(getWatchFromInsight);
    }
    if (horizon === 'soon') {
      const upcoming = timelineEvents
        .map((event) => ({
          ...event,
          daysAway: Math.floor(
            (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        }))
        .filter((event) => event.daysAway >= 1 && event.daysAway <= 14)
        .map((event) => ({
          id: event.id,
          title: `Upcoming: ${event.title}`,
          why: `${event.daysAway} days away • ${event.description}`,
          impact: 'Time-sensitive',
          prevention: 'Run a prep plan and allocate time.',
        }));
      const spots = blindSpots.map(getWatchFromBlindSpot);
      return [...upcoming, ...spots];
    }
    const always: Array<ReturnType<typeof getWatchFromBlindSpot>> = [];
    if (profile.finances.fixedCosts || profile.finances.variableCosts) {
      always.push({
        id: 'always-budget',
        title: 'Monthly spend guardrail',
        why: 'Maintain budget discipline to prevent drift.',
        impact: 'High impact',
        prevention: 'Review spend weekly and adjust.',
      });
    }
    if (financeMetrics) {
      always.push({
        id: 'always-budget-daily',
        title: `Daily budget target: ${financeMetrics.dailyVariableBudget}`,
        why: `Weekly budget ${financeMetrics.weeklyVariableBudget} • savings rate ${financeMetrics.savingsRate}%`,
        impact: 'Moderate',
        prevention: 'Track variable spending daily.',
      });
    }
    if (hasFattyLiver) {
      always.push({
        id: 'always-fatty-liver',
        title: 'Fatty liver support plan',
        why: 'Prioritize liver-friendly habits and monitor symptoms.',
        impact: 'High impact',
        prevention: 'Limit alcohol, favor high-fiber meals, add light activity.',
      });
    }
    if (profile.relationship.socialEnergy) {
      always.push({
        id: 'always-relationship',
        title: 'Relational drift',
        why: 'Low social energy can reduce connection quality.',
        impact: 'Moderate',
        prevention: 'Schedule one intentional check-in.',
      });
    }
    return always;
  };

  const getCoverageScore = (pillarId: string, categories: Category[]) => {
    const profileScore = getProfileCoverage(pillarId);
    const memoryCount = getPillarMemory(categories).length;
    const fileCount = getPillarSourceCount(categories);
    const signalScore = Math.min(40, memoryCount * 2 + fileCount * 6);
    return {
      total: Math.min(100, Math.round(profileScore * 0.6 + signalScore)),
      profileScore,
      memoryCount,
      fileCount,
    };
  };

  const formatSignalTime = (timestamp: number | null) => {
    if (!timestamp) return 'No signals yet';
    const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 48) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const doItems = useMemo(() => getHorizonDo(), [horizon, dailyPlan, tasks, recommendations]);
  const watchItems = useMemo(
    () => getHorizonWatch(),
    [horizon, blindSpots, insights, timelineEvents, profile, financeMetrics, hasFattyLiver]
  );
  const needsReviewCount = useMemo(
    () => recommendations.filter((r) => r.needsReview).length,
    [recommendations]
  );
  const alwaysDoChips = useMemo(() => {
    const chips: string[] = [];
    if (ruleOfLife?.nonNegotiables?.sleepWindow)
      chips.push(`Sleep window: ${ruleOfLife.nonNegotiables.sleepWindow}`);
    if (ruleOfLife?.nonNegotiables?.devotion) chips.push('Daily devotion');
    if (ruleOfLife?.nonNegotiables?.sabbath) chips.push('Weekly sabbath');
    if (profile.spiritual.coreValues?.length)
      chips.push(`Core values: ${profile.spiritual.coreValues.slice(0, 3).join(', ')}`);
    return chips.slice(0, 6);
  }, [ruleOfLife, profile]);

  const habitItems = useMemo(() => {
    const items = memory.filter(
      (item) => item.category === Category.HABIT || item.metadata?.type === 'habit'
    );
    const sorted = items.sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(0, 4).map((item) => {
      const title =
        (item.metadata?.payload as { title?: string } | undefined)?.title || item.content;
      const frequency = (item.metadata?.payload as { frequency?: string } | undefined)?.frequency;
      return {
        id: item.id,
        title,
        frequency,
        raw: item,
      };
    });
  }, [memory]);

  const startHabitEdit = (habit: (typeof habitItems)[number]) => {
    setEditingHabitId(habit.id);
    setHabitDraft({
      title: habit.title || '',
      frequency: habit.frequency || 'daily',
    });
  };

  const saveHabitEdit = () => {
    if (!editingHabitId) return;
    const title = habitDraft.title.trim();
    if (!title) return;
    updateMemoryItem?.(editingHabitId, {
      content: title,
      metadata: {
        type: 'habit',
        payload: {
          title,
          frequency: habitDraft.frequency,
        },
      },
    });
    setEditingHabitId(null);
  };

  const alwaysWatchChips = useMemo(() => {
    const chips: string[] = [];
    if (profile.health.conditions?.length)
      chips.push(`Health watch: ${profile.health.conditions[0]}`);
    if (hasFattyLiver) chips.push('Fatty liver: avoid alcohol + prioritize fiber + movement');
    if (financeMetrics) {
      chips.push(`Daily budget: ${financeMetrics.dailyVariableBudget}`);
      chips.push(`Weekly budget: ${financeMetrics.weeklyVariableBudget}`);
      chips.push(`Savings rate: ${financeMetrics.savingsRate}%`);
      chips.push(`Today spend target: ${financeMetrics.dailyVariableBudget}`);
    }
    if (profile.finances.fixedCosts) chips.push('Review fixed costs monthly');
    if (profile.relationship.socialEnergy) chips.push('Monitor social energy');
    if (blindSpots.length > 0) chips.push('Review blind spots weekly');
    return chips.slice(0, 6);
  }, [profile, blindSpots, financeMetrics, hasFattyLiver]);

  const overallConfidence = useMemo(() => {
    if (corePillars.length === 0) return 0;
    const total = corePillars.reduce(
      (sum, pillar) => sum + getCoverageScore(pillar.id, pillar.categories).total,
      0
    );
    return Math.round(total / corePillars.length);
  }, [corePillars, memory, sources, profile]);

  const showLowConfidence = overallConfidence < 55 || memory.length < 3;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 px-4">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                Do + Watch Command
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              What to do, why it matters, and what to watch.
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              AI guidance grounded in your profile, memory vault, and uploaded files.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/5 rounded-2xl p-1">
              {[
                { id: 'now', label: 'Now' },
                { id: 'soon', label: 'Soon' },
                { id: 'always', label: 'Always' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setHorizon(item.id as typeof horizon)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    horizon === item.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {needsReviewCount > 0 && (
              <button
                onClick={() => onNavigate('vault')}
                className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                Needs Review · {needsReviewCount}
              </button>
            )}
            <button
              onClick={refreshAll}
              className="px-6 py-3 rounded-2xl bg-slate-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
            >
              Refresh Signals
            </button>
          </div>
        </div>

        {showLowConfidence && (
          <div className="glass-panel p-5 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
                Low Data Confidence
              </p>
              <p className="text-xs text-amber-200/70 mt-2">
                We need more signals to personalize your Do/Watch guidance. Add a quick note or
                upload a file to improve accuracy.
              </p>
            </div>
            <button
              onClick={() => onNavigate('vault')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
            >
              Add Context
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-slate-950/40 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Do</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  {horizon === 'now'
                    ? 'Today priorities'
                    : horizon === 'soon'
                      ? 'Next 7–14 days'
                      : 'Evergreen routines'}
                </p>
              </div>
              <button
                onClick={planMyDay}
                className="px-5 py-2 rounded-xl bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
              >
                Plan My Day
              </button>
            </div>

            {isPlanningDay ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : doItems.length > 0 ? (
              <div className="space-y-4">
                {doItems.slice(0, 3).map((item) => {
                  const isExpanded = expandedDoId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-white/5 bg-slate-900/60 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-black text-white">{item.title}</h5>
                          <p className="text-[10px] text-slate-400">
                            {item.why || 'Needs more context to explain rationale.'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-widest text-slate-500">
                            <span>{item.time}</span>
                            <span>{item.effort}</span>
                            <span>{item.when}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedDoId(isExpanded ? null : item.id)}
                          className="px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          {isExpanded ? 'Hide' : 'Start'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4 border-t border-white/5 pt-4 text-[10px] text-slate-300">
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">
                              Steps
                            </span>
                            <ul className="mt-2 space-y-2">
                              {(item.steps.length ? item.steps : ['Define first step.']).map(
                                (step, idx) => (
                                  <li key={idx} className="flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[9px] font-black">
                                      {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] uppercase tracking-widest text-slate-500">
                                Inputs
                              </span>
                              <p className="mt-2 text-slate-400">
                                {item.inputs.length ? item.inputs.join(', ') : 'None listed.'}
                              </p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-widest text-slate-500">
                                Definition of done
                              </span>
                              <p className="mt-2 text-slate-400">
                                {item.definition || 'Completion confirmed by a logged outcome.'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">
                              Risks / Watch-outs
                            </span>
                            <p className="mt-2 text-slate-400">
                              {item.risks.length ? item.risks.join(' • ') : 'No major risks noted.'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">
                              Follow-up
                            </span>
                            <p className="mt-2 text-slate-400">{item.followUp}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {doItems.length > 3 && (
                  <button
                    onClick={() => onNavigate('vault')}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all"
                  >
                    +{doItems.length - 3} more • View all
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500 space-y-3">
                <p>No actions yet. Add signals or run Plan My Day.</p>
                <button
                  onClick={() => onNavigate('vault')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-white/5 hover:border-indigo-500/30 transition-all"
                >
                  Add Context
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-slate-950/40 flex flex-col gap-6">
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Watch</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {horizon === 'now'
                  ? 'Today watch-outs'
                  : horizon === 'soon'
                    ? 'Upcoming risks'
                    : 'Baseline guardrails'}
              </p>
            </div>

            {isGeneratingTasks ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : watchItems.length > 0 ? (
              <div className="space-y-4">
                {watchItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-rose-500/10 bg-rose-500/5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h5 className="text-sm font-black text-white">{item.title}</h5>
                      <span className="text-[9px] uppercase tracking-widest text-rose-300">
                        {item.impact}
                      </span>
                    </div>
                    <p className="text-[10px] text-rose-200/70">{item.why}</p>
                    <p className="text-[10px] text-rose-200/70 italic">
                      Next prevention step: {item.prevention}
                    </p>
                  </div>
                ))}
                {watchItems.length > 3 && (
                  <button
                    onClick={() => onNavigate('vault')}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-all"
                  >
                    +{watchItems.length - 3} more • View all
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                No risks detected yet. Keep logging signals.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40">
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
              Always-Do
            </h5>
            <div className="mt-4 flex flex-wrap gap-2">
              {alwaysDoChips.length > 0 ? (
                alwaysDoChips.map((chip) => (
                  <span
                    key={chip}
                    className="px-3 py-2 rounded-full bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-500">No routines captured yet.</span>
              )}
            </div>
            <div className="mt-5 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                Habits
              </p>
              {habitItems.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {habitItems.map((habit) => {
                    const isEditing = editingHabitId === habit.id;
                    return (
                      <div
                        key={habit.id}
                        className="flex flex-col gap-2 rounded-2xl border border-violet-500/10 bg-violet-500/5 px-3 py-2"
                      >
                        {isEditing ? (
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <input
                              value={habitDraft.title}
                              onChange={(e) =>
                                setHabitDraft((prev) => ({ ...prev, title: e.target.value }))
                              }
                              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-slate-200"
                              placeholder="Habit name"
                            />
                            <select
                              value={habitDraft.frequency}
                              onChange={(e) =>
                                setHabitDraft((prev) => ({ ...prev, frequency: e.target.value }))
                              }
                              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-slate-200"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={saveHabitEdit}
                                className="px-3 py-2 rounded-xl bg-violet-500/20 text-[9px] font-black uppercase tracking-widest text-violet-200 hover:bg-violet-500/30"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingHabitId(null)}
                                className="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-violet-200">
                              {habit.title}
                              {habit.frequency ? ` · ${habit.frequency}` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startHabitEdit(habit)}
                                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-violet-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMemoryItem?.(habit.id)}
                                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500">
                  <span>No habits captured yet.</span>
                  <button
                    onClick={() => onNavigate('vault')}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-violet-300 transition-all"
                  >
                    Add Habit
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40">
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
              Always-Watch
            </h5>
            <div className="mt-4 flex flex-wrap gap-2">
              {alwaysWatchChips.length > 0 ? (
                alwaysWatchChips.map((chip) => (
                  <span
                    key={chip}
                    className="px-3 py-2 rounded-full bg-rose-500/5 text-[9px] font-black uppercase tracking-widest text-rose-300 border border-rose-500/10"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-500">No guardrails set yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            Domain Panels
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {corePillars.map((pillar) => {
            const coverage = getCoverageScore(pillar.id, pillar.categories);
            const latestSignal = getLatestSignal(pillar.categories);
            const recs = recommendations.filter(
              (r) => pillar.categories.includes(r.category) && r.status === 'ACTIVE'
            );
            const fallbackTasks = tasks.filter((t) => pillar.categories.includes(t.category));
            const items = recs.length ? recs.slice(0, 2) : fallbackTasks.slice(0, 2);
            const pillarSources = getPillarSources(pillar.categories);
            const metricLine =
              pillar.id === 'finance' && financeMetrics
                ? `Savings rate ${financeMetrics.savingsRate}%`
                : pillar.id === 'health' && hasFattyLiver
                  ? 'Condition: fatty liver'
                  : pillar.id === 'personal' && profile.personal.jobRole
                    ? `Role: ${profile.personal.jobRole}`
                    : pillar.id === 'relationships' && profile.relationship.socialEnergy
                      ? `Social energy: ${profile.relationship.socialEnergy}`
                      : pillar.id === 'spiritual' && profile.spiritual.coreValues.length > 0
                        ? `Core values: ${profile.spiritual.coreValues.slice(0, 2).join(', ')}`
                        : null;
            const status =
              coverage.total < 40 ? 'At Risk' : coverage.total < 70 ? 'Attention' : 'OK';
            const statusClass =
              status === 'OK'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : status === 'Attention'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

            return (
              <div
                key={pillar.id}
                className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40 flex flex-col gap-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                      {pillar.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">{pillar.title}</h4>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">
                        Last signal: {formatSignalTime(latestSignal)}
                      </p>
                      {metricLine && (
                        <p className="text-[9px] uppercase tracking-widest text-slate-600 mt-1">
                          {metricLine}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusClass}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${coverage.total}%` }} />
                </div>

                <div className="space-y-3">
                  {items.length > 0 ? (
                    items.map((item) => {
                      const id = 'impactScore' in item ? item.id : item.id;
                      const isExpanded = expandedRecId === id;
                      const title = item.title;
                      const description =
                        'impactScore' in item
                          ? item.description
                          : item.methodology || item.description;
                      const rationale = 'impactScore' in item ? item.rationale : item.reasoning;
                      const evidenceCount =
                        'impactScore' in item
                          ? (item.evidenceLinks?.sources?.length || 0) +
                            (item.evidenceLinks?.claims?.length || 0)
                          : 0;
                      return (
                        <button
                          key={id}
                          onClick={() => setExpandedRecId(isExpanded ? null : id)}
                          className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-900/60 hover:border-indigo-500/30 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-black text-white">{title}</p>
                            <span className="text-[8px] uppercase tracking-widest text-slate-500">
                              {isExpanded ? 'Hide' : 'View'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                            {description}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-widest text-slate-500">
                            <span>{getPillarMemory(pillar.categories).length} signals</span>
                            <span>•</span>
                            <span>{pillarSources.length} files</span>
                            {evidenceCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{evidenceCount} evidence</span>
                              </>
                            )}
                          </div>
                          {isExpanded && (
                            <p className="text-[10px] text-slate-500 mt-2">
                              {rationale || 'Grounded in recent signals.'}
                            </p>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                      No recommendations yet. Log more signals.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setDrawerPillarId(pillar.id)}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all"
                >
                  View all
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {drawerPillarId && (
        <div className="fixed inset-0 z-[120] flex items-end lg:items-stretch justify-end bg-black/60 backdrop-blur-md">
          <div className="w-full lg:w-[520px] bg-[#0a0b10] border-l border-white/5 p-6 lg:p-8 overflow-y-auto no-scrollbar animate-in slide-in-from-right-6 duration-300">
            {(() => {
              const pillar = corePillars.find((p) => p.id === drawerPillarId)!;
              const pillarRecs = recommendations.filter(
                (r) => pillar.categories.includes(r.category) && r.status === 'ACTIVE'
              );
              const pillarTasks = tasks.filter((t) => pillar.categories.includes(t.category));
              const items = pillarRecs.length ? pillarRecs : pillarTasks;
              const evidenceSources = getPillarSources(pillar.categories);
              const evidenceSignals = getPillarMemory(pillar.categories).slice(0, 5);
              const coverage = getCoverageScore(pillar.id, pillar.categories);

              return (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">
                        Domain detail
                      </p>
                      <h3 className="text-2xl font-black text-white">{pillar.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Data confidence {coverage.total}% • {evidenceSignals.length} signals •{' '}
                        {evidenceSources.length} files
                      </p>
                    </div>
                    <button
                      onClick={() => setDrawerPillarId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                      Recommendations
                    </p>
                    {items.length > 0 ? (
                      items.map((item) => {
                        const id = item.id;
                        const isExpanded = expandedRecId === id;
                        const isRec = 'impactScore' in item;
                        const title = item.title;
                        const description = isRec
                          ? item.description
                          : item.methodology || item.description;
                        const rationale = isRec ? item.rationale : item.reasoning;
                        const steps = isRec ? item.steps || [] : item.steps || [];
                        return (
                          <div
                            key={id}
                            className="p-4 rounded-2xl border border-white/5 bg-slate-900/60 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black text-white">{title}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{description}</p>
                              </div>
                              <button
                                onClick={() => setExpandedRecId(isExpanded ? null : id)}
                                className="text-[9px] uppercase tracking-widest text-indigo-400 font-black"
                              >
                                {isExpanded ? 'Hide' : 'Detail'}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="border-t border-white/5 pt-3 space-y-3 text-[10px] text-slate-400">
                                <div>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-500">
                                    Why
                                  </span>
                                  <p className="mt-2">
                                    {rationale || 'Grounded in recent signals.'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-500">
                                    Steps
                                  </span>
                                  <ul className="mt-2 space-y-2">
                                    {(steps.length ? steps : ['Define next step.']).map(
                                      (step, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[9px] font-black">
                                            {idx + 1}
                                          </span>
                                          <span>{step}</span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                        No recommendations yet. Log more signals.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                      Evidence
                    </p>
                    {evidenceSources.length > 0 ? (
                      <div className="space-y-3">
                        {evidenceSources.slice(0, 4).map((source) => (
                          <button
                            key={source.id}
                            onClick={() => setViewerSourceId(source.id)}
                            className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-900/60 hover:border-indigo-500/30 transition-all"
                          >
                            <p className="text-xs font-black text-white">{source.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{source.mimeType}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                        No files linked yet.
                      </div>
                    )}
                    {evidenceSignals.length > 0 && (
                      <div className="space-y-2">
                        {evidenceSignals.map((signal) => (
                          <div
                            key={signal.id}
                            className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-[10px] text-slate-400"
                          >
                            {signal.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {viewerSourceId && viewerFile && (
        <SourceViewer files={[viewerFile]} onClose={() => setViewerSourceId(null)} />
      )}

      {/* SYSTEM STATUS FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#02040a]/80 backdrop-blur-xl border-t border-white/5 px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Shield size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Security Mode: Sovereignty
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Zap size={14} className="text-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Neural Sync: High Fidelity
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Coherence
          </span>
          <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
              style={{ width: `${completion.overall}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
