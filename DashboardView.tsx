import React, { useMemo, useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  Clock,
  ShieldCheck,
  Target as GoalIcon,
  ShieldAlert,
  Sparkles,
  Map,
  ChevronDown,
  ChevronUp,
  Settings2,
  GripVertical,
  Trash2,
  Heart,
  Wallet,
  Users,
  User,
  Globe,
  Sun,
  Moon,
  Coffee,
  BrainCircuit,
  Shield,
  CheckCircle2,
  ListChecks,
} from 'lucide-react';
import {
  BentoCard,
  RadialProgress,
  getCategoryColor,
  getProfileCompletion,
  Skeleton,
} from './SharedUI';
import { BlindSideRadarCard } from './BlindSideRadarCard';
import {
  DailyTask,
  UserProfile,
  ProactiveInsight,
  Category,
  MemoryEntry,
  Goal,
  TimelineEvent,
  BlindSpot,
  DashboardLayout,
  WidgetConfig,
  WidgetType,
  Recommendation,
  Source,
} from './types';

interface DashboardViewProps {
  memory: MemoryEntry[];
  tasks: DailyTask[];
  dailyPlan: DailyTask[];
  goals: Goal[];
  timelineEvents: TimelineEvent[];
  insights: ProactiveInsight[];
  blindSpots?: BlindSpot[];
  profile: UserProfile;
  ruleOfLife: any;
  sources: Source[];
  recommendations: Recommendation[];
  layout: DashboardLayout;
  toggleTask: (id: string) => void;
  refreshAll: () => void;
  planMyDay: () => void;
  setLayout: (layout: DashboardLayout) => void;
  getVitalityScore: (cat: Category) => number;
  dismissInsight: (insight: ProactiveInsight) => void;
  onNavigate: (tab: any) => void;
  isPlanningDay: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory,
  tasks,
  dailyPlan,
  goals,
  timelineEvents,
  insights,
  blindSpots = [],
  profile,
  ruleOfLife,
  sources,
  recommendations,
  layout,
  toggleTask,
  refreshAll,
  planMyDay,
  setLayout,
  getVitalityScore,
  dismissInsight,
  onNavigate,
  isPlanningDay,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const getLatestSignal = (categories: Category[]) => {
    const items = getPillarMemory(categories);
    if (items.length === 0) return null;
    return items.reduce((latest, item) => (item.timestamp > latest ? item.timestamp : latest), 0);
  };

  const getDoNext = (categories: Category[]) => {
    const fromPlan = dailyPlan.filter((t) => categories.includes(t.category));
    const fromTasks = tasks.filter((t) => categories.includes(t.category));
    const fromRecs = recommendations.filter((r) => categories.includes(r.category));
    const selected = fromPlan.length ? fromPlan : fromTasks.length ? fromTasks : fromRecs;
    return selected.slice(0, 2).map((item) => {
      if ('impactScore' in item) {
        return {
          title: item.title,
          why: item.rationale || item.description,
          how: item.steps?.[0] || item.definitionOfDone,
          meta: `${item.estimatedTime || '15 mins'} • Impact ${item.impactScore}`,
        };
      }
      return {
        title: item.title,
        why: item.reasoning || item.why || item.description,
        how: item.methodology || item.definitionOfDone,
        meta: item.priority ? `${item.priority.toUpperCase()} priority` : 'Action',
      };
    });
  };

  const getWatchouts = (categories: Category[]) => {
    const filteredInsights = insights.filter((i) => categories.includes(i.category));
    if (filteredInsights.length > 0) {
      return filteredInsights.slice(0, 2).map((i) => ({
        title: i.title,
        why: i.description,
      }));
    }
    return blindSpots.slice(0, 1).map((bs) => ({
      title: bs.signal,
      why: bs.why,
    }));
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

  const ritualData = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 11)
      return {
        title: 'Morning Calibration',
        subtitle: 'Align intention with capacity.',
        icon: <Coffee className="text-amber-400" />,
        action: 'Brief System',
      };
    if (hour >= 20 || hour < 5)
      return {
        title: 'Evening Audit',
        subtitle: 'Process signals and clear cache.',
        icon: <Moon className="text-indigo-400" />,
        action: 'Archive Today',
      };
    return {
      title: 'Active Execution',
      subtitle: 'Sustain high-fidelity output.',
      icon: <Sun className="text-rose-400" />,
      action: 'View Strategy',
    };
  }, [currentTime]);

  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'NEURAL_RESONANCE':
        return (
          <div className="glass-panel p-10 rounded-[3.5rem] border border-white/5 bg-slate-950/40 relative overflow-hidden group min-h-[300px] flex flex-col items-center justify-center text-center">
            <div className="relative space-y-4">
              <div className="w-20 h-20 bg-indigo-600/10 rounded-full mx-auto flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <BrainCircuit size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                Neural Resonance: {completion.overall}%
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Cross-Domain Contextual Coherence
              </p>
              <div className="flex gap-1 justify-center mt-4">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-1 rounded-full transition-all duration-700 ${i < completion.overall / 5 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-900'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case 'LIFE_PILLARS':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[Category.HEALTH, Category.FINANCE, Category.RELATIONSHIPS, Category.SPIRITUAL].map(
              (cat) => {
                const score = getVitalityScore(cat);
                return (
                  <div
                    key={cat}
                    onClick={() => onNavigate('vault')}
                    className="glass-panel p-8 rounded-[3rem] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {cat}: {score}%
                    </span>
                    <div className="mt-3 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        );
      case 'MISSION':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Active Daily Mission
                </span>
              </div>
            </div>
            <div className="relative pl-12 space-y-6">
              <div className="absolute left-[23px] top-6 bottom-6 w-px bg-slate-800" />
              {isPlanningDay ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />)
              ) : dailyPlan.length > 0 ? (
                dailyPlan.map((task) => {
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <div key={task.id} className="relative group">
                      <div
                        className={`absolute -left-[35px] top-8 w-6 h-6 rounded-full border-4 border-[#02040a] z-10 transition-all ${task.completed ? 'bg-emerald-500' : 'bg-slate-800'}`}
                      />
                      <div
                        className={`p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${task.completed ? 'bg-slate-900/40 border-slate-800 opacity-60 grayscale' : 'bg-slate-900/60 border-white/5 hover:border-indigo-500/30'}`}
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <Clock size={14} className="text-indigo-400" />
                              <span className="text-[10px] font-mono text-indigo-400 font-bold">
                                {task.start_time || '00:00'}
                              </span>
                              <span
                                className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(task.category)}`}
                              >
                                {task.category}
                              </span>
                            </div>
                            <h4
                              className={`text-xl font-black uppercase ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}
                            >
                              {task.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTask(task.id);
                              }}
                              className={`px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${task.completed ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 hover:bg-indigo-500 hover:text-white'}`}
                            >
                              {task.completed ? 'Resolved' : 'Execute'}
                            </button>
                            {isExpanded ? (
                              <ChevronUp size={20} className="text-indigo-400" />
                            ) : (
                              <ChevronDown size={20} className="text-slate-600" />
                            )}
                          </div>
                        </div>

                        {isExpanded && !task.completed && (
                          <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                  <Sun size={14} /> Strategic Methodology
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-4 rounded-2xl italic border border-white/5">
                                  "
                                  {task.methodology ||
                                    'Focus on atomic completion of the primary objective. Reduce entropy by strictly following the definition of done.'}
                                  "
                                </p>
                              </div>
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                  <ListChecks size={14} /> Definition of Done
                                </h5>
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                  <p className="text-xs text-emerald-200/60 font-medium italic">
                                    {task.definitionOfDone ||
                                      'Verified by system state change and mental audit.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <h5 className="text-lg font-black text-slate-500 uppercase tracking-widest">
                    Horizon Clear
                  </h5>
                  <button
                    onClick={planMyDay}
                    className="px-10 py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Initialize Mission
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 'RADAR':
        return (
          <BentoCard title="Risk Radar" icon={<ShieldAlert size={16} />}>
            <div className="flex flex-col gap-4 mt-4">
              {blindSpots.length > 0 ? (
                blindSpots.map((bs) => <BlindSideRadarCard key={bs.id} {...bs} />)
              ) : (
                <div className="text-center py-10 opacity-30 italic text-xs">Clear</div>
              )}
            </div>
          </BentoCard>
        );
      case 'INSIGHTS':
        return (
          <BentoCard title="Proactive Insights" icon={<Sparkles size={16} />}>
            <div className="flex gap-6 overflow-x-auto no-scrollbar mt-4">
              {insights.length > 0 ? (
                insights.map((i) => (
                  <div
                    key={i.id}
                    className="min-w-[280px] bg-slate-950 p-6 rounded-[2rem] border border-slate-800 flex flex-col justify-between hover:border-indigo-500/30 transition-all"
                  >
                    <h5 className="text-xs font-black text-white leading-relaxed italic">
                      "{i.title}"
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-2">{i.description}</p>
                    <button
                      onClick={() => dismissInsight(i)}
                      className="mt-6 py-3 bg-slate-900 rounded-xl text-[9px] font-black text-slate-500 uppercase hover:text-white transition-all"
                    >
                      Dismiss Signal
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 w-full opacity-30 italic text-xs">
                  Awaiting context ingestion...
                </div>
              )}
            </div>
          </BentoCard>
        );
      case 'GOALS':
        return (
          <BentoCard title="Primary Targets" icon={<GoalIcon size={16} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 group hover:border-indigo-500/20 transition-all"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-[11px] font-black text-white truncate">{g.title}</h5>
                    <span className="text-[8px] font-mono text-indigo-400 font-bold">
                      {g.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 px-4">
      {/* RITUAL BAR */}
      <div className="glass-panel p-8 rounded-[3.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-950/40">
        <div className="flex items-center gap-8">
          <div className="p-6 rounded-[1.8rem] bg-slate-950 border border-white/5 shadow-2xl">
            {ritualData.icon}
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              {ritualData.title}
            </h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {ritualData.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-2xl font-mono font-black text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              {currentTime.toLocaleDateString([], { weekday: 'long' })}
            </p>
          </div>
          <button
            onClick={() => onNavigate('chat')}
            className="px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl active:scale-95"
          >
            {ritualData.action}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.8)]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
              Kernel Active
            </span>
          </div>
          <h2 className="text-6xl font-black tracking-tighter text-white">
            Focus, <span className="text-indigo-400 italic">{profile.identify.name || 'User'}</span>
            .
          </h2>
        </div>
        <button
          onClick={planMyDay}
          disabled={isPlanningDay}
          className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl shadow-rose-600/30"
        >
          <Map size={16} /> Plot Mission
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                Core Aspect Intelligence
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              What to do, why it matters, and what to watch.
            </h3>
          </div>
          <button
            onClick={refreshAll}
            className="px-6 py-3 rounded-2xl bg-slate-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
          >
            Refresh Signals
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {corePillars.map((pillar) => {
            const coverage = getCoverageScore(pillar.id, pillar.categories);
            const doNext = getDoNext(pillar.categories);
            const watchouts = getWatchouts(pillar.categories);
            const latestSignal = getLatestSignal(pillar.categories);
            return (
              <div
                key={pillar.id}
                className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-slate-950/40 flex flex-col gap-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                      {pillar.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white">{pillar.title}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Signals: {coverage.memoryCount} logs • {coverage.fileCount} files • Profile{' '}
                        {coverage.profileScore}%
                      </p>
                      <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mt-1">
                        Last signal: {formatSignalTime(latestSignal)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{coverage.total}%</div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                      Data Confidence
                    </p>
                  </div>
                </div>

                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${coverage.total}%` }} />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                      What to do (Why + How)
                    </h5>
                    {doNext.length > 0 ? (
                      doNext.map((item, idx) => (
                        <div
                          key={`${pillar.id}-do-${idx}`}
                          className="p-4 rounded-2xl bg-slate-900/60 border border-white/5"
                        >
                          <p className="text-xs font-black text-white">{item.title}</p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            {item.why || 'Need more context to explain rationale.'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-2 italic">
                            How: {item.how || 'Follow the next tactical step.'}
                          </p>
                          <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-widest">
                            {item.meta}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500 space-y-3">
                        <p>No actions yet. Add signals to build guidance.</p>
                        <button
                          onClick={() => onNavigate('vault')}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-white/5 hover:border-indigo-500/30 transition-all"
                        >
                          Add Context
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
                      Watchouts (Why)
                    </h5>
                    {watchouts.length > 0 ? (
                      watchouts.map((item, idx) => (
                        <div
                          key={`${pillar.id}-watch-${idx}`}
                          className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10"
                        >
                          <p className="text-xs font-black text-white">{item.title}</p>
                          <p className="text-[10px] text-rose-200/70 mt-2">{item.why}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                        No risks detected yet. Keep logging signals.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="col-span-full">
          {renderWidgetContent({
            id: 'core-pillars',
            type: 'LIFE_PILLARS',
            w: 12,
            h: 2,
            x: 0,
            y: 0,
          })}
        </div>
        <div className="col-span-full md:col-span-6">
          {renderWidgetContent({
            id: 'resonance',
            type: 'NEURAL_RESONANCE',
            w: 6,
            h: 4,
            x: 0,
            y: 2,
          })}
        </div>
        <div className="col-span-full md:col-span-6">
          {renderWidgetContent({ id: 'horizon', type: 'GOALS', w: 6, h: 4, x: 6, y: 2 })}
        </div>
        {layout.widgets
          .filter((w) => !['LIFE_PILLARS', 'NEURAL_RESONANCE', 'GOALS'].includes(w.type))
          .map((widget) => (
            <div
              key={widget.id}
              style={{ gridColumn: `span ${widget.w}`, gridRow: `span ${widget.h}` }}
            >
              {renderWidgetContent(widget)}
            </div>
          ))}
      </div>

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
