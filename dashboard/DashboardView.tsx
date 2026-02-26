import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, BookOpen, CalendarPlus, Target } from 'lucide-react';
import {
  AlwaysChip,
  BaselineSwotEntry,
  ContributionFeedback,
  DailyTask,
  UserProfile,
  ProactiveInsight,
  Category,
  MemoryEntry,
  TimelineEvent,
  BlindSpot,
  Recommendation,
  Source,
  Goal,
  InboxEntry,
} from '@/data';
import type { LifeContextController } from '@/core/useLifeContext';
import { FocusList } from './FocusList';
import { EventPrepPopup } from './EventPrepPopup';
import { EventEditSheet } from './EventEditSheet';
import { UpcomingCalendar } from './UpcomingCalendar';
import { SignalGrid } from './SignalGrid';
import { DashboardHeader } from './DashboardHeader';
import { computeScoreInternal } from './ScoreStrip';
import { LifeContextPanel } from './LifeContextPanel';
import { AdvanceProtectPanel } from './AdvanceProtectPanel';
import { ReportsSection } from './ReportsSection';

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
  goals: Goal[];
  baselineSwot?: BaselineSwotEntry[];
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  refreshAll: () => void;
  planMyDay: () => void;
  onNavigate: (tab: any) => void;
  updateMemoryItem?: (id: string, updates: Partial<MemoryEntry>) => void;
  deleteMemoryItem?: (id: string) => void;
  keepRecommendation?: (id: string) => void;
  removeRecommendation?: (id: string) => void;
  activatePrepPlan?: (plan: Recommendation, eventId?: string) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  logMemory?: (input: string) => Promise<void>;
  alwaysDoChips?: AlwaysChip[];
  alwaysWatchChips?: AlwaysChip[];
  isPlanningDay: boolean;
  isGeneratingTasks: boolean;
  undoTaskAction?: () => void;
  updateTimelineEvent?: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent?: (id: string) => void;
  personalizedGreeting?: string;
  lifeContext?: LifeContextController;
  inboxEntries?: InboxEntry[];
  inboxReviewConfidence?: number;
  onMergeInbox?: (ids?: string[]) => Promise<void> | void;
  onRefreshInbox?: () => Promise<void> | void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory = [],
  tasks,
  dailyPlan,
  timelineEvents,
  insights,
  blindSpots = [],
  profile,
  recommendations,
  goals,
  baselineSwot = [],
  toggleTask,
  deleteTask,
  planMyDay,
  onNavigate,
  updateMemoryItem,
  activatePrepPlan,
  onToast,
  isPlanningDay,
  updateTimelineEvent,
  deleteTimelineEvent,
  personalizedGreeting = 'Welcome',
  lifeContext,
  inboxEntries = [],
  inboxReviewConfidence = 0.65,
  onMergeInbox,
  onRefreshInbox,
}) => {
  const [activePrepEvent, setActivePrepEvent] = useState<TimelineEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [contribution, setContribution] = useState<ContributionFeedback | null>(null);
  const [showContribution, setShowContribution] = useState(false);
  const [isDeepAnalysisExpanded, setIsDeepAnalysisExpanded] = useState(() => {
    try {
      return localStorage.getItem('arete:deepAnalysisExpanded') !== 'false';
    } catch {
      return true;
    }
  });
  const prevScoresRef = useRef<Record<string, number> | null>(null);
  const prevMemoryCountRef = useRef<number>(memory.length);
  const contributionMemoryCountRef = useRef<number>(memory.length);
  const contributionTimeoutRef = useRef<number | null>(null);

  // Derived Habits
  const habitItems = useMemo(() => {
    const items = memory.filter(
      (item) => item.category === Category.HABIT || item.metadata?.type === 'habit'
    );
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [memory]);

  const estimateInboxConfidence = (entry: InboxEntry) => {
    const root = (entry.ai_result as any)?.confidence;
    if (typeof root === 'number' && !Number.isNaN(root)) return Math.max(0, Math.min(1, root));
    const items = Array.isArray((entry.ai_result as any)?.items) ? ((entry.ai_result as any).items as any[]) : [];
    if (items.length === 0) return 0.6;
    const total = items.reduce((sum, item) => {
      const value = typeof item?.confidence === 'number' && !Number.isNaN(item.confidence) ? item.confidence : 0.6;
      return sum + Math.max(0, Math.min(1, value));
    }, 0);
    return total / items.length;
  };

  const getInboxPreview = (entry: InboxEntry) => {
    const items = Array.isArray((entry.ai_result as any)?.items) ? ((entry.ai_result as any).items as any[]) : [];
    if (items.length === 0) return '';
    const top = items[0];
    const title = typeof top?.title === 'string' ? top.title.trim() : '';
    const content = typeof top?.content === 'string' ? top.content.trim() : '';
    return title || content;
  };

  // Derived Tasks (Focus)
  // Combine dailyPlan and tasks, prioritizing plan
  const focusTasks = useMemo(() => {
    // If we have a daily plan, that IS the focus.
    if (dailyPlan.length > 0) return dailyPlan;
    return tasks;
  }, [dailyPlan, tasks]);

  const handleToggleHabit = (id: string) => {
    // For now, we'll try to update the item to indicate completion for today
    // This depends on backend logic, but UI will optimize optimistically
    if (updateMemoryItem) {
      // Just a placeholder update for visual feedback or sorting
      updateMemoryItem(id, { timestamp: Date.now() });
    }
  };

  const handleInsertTemplate = (template: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('logbar:insert', { detail: { template } }));
  };

  const greeting = useMemo(() => {
    const name = profile.identify?.name?.split(' ')[0] || 'there';
    const hour = new Date().getHours();
    const timeLabel =
      hour < 5
        ? 'Late night'
        : hour < 12
          ? 'Good morning'
          : hour < 17
            ? 'Good afternoon'
            : hour < 21
              ? 'Good evening'
              : 'Late night';
    if (personalizedGreeting && personalizedGreeting !== 'Welcome') return personalizedGreeting;
    return `${timeLabel}, ${name}`;
  }, [profile.identify?.name, personalizedGreeting]);

  const headerSummary = useMemo(() => {
    const upcoming = [...timelineEvents]
      .filter((event) => new Date(event.date).getTime() > Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const hours = Math.max(
        1,
        Math.round((new Date(next.date).getTime() - Date.now()) / (60 * 60 * 1000))
      );
      const prepStatus = next.metadata?.prepStatus === 'ready' ? 'prep ready' : 'prep pending';
      return `Next: ${next.title} in ${hours}h · ${prepStatus}.`;
    }
    if (focusTasks.length > 0) {
      const remaining = Math.max(0, focusTasks.length - 1);
      return remaining > 0
        ? `Top focus: ${focusTasks[0].title} + ${remaining} more.`
        : `Top focus: ${focusTasks[0].title}.`;
    }
    return 'Log a check-in to personalize today’s mission.';
  }, [timelineEvents, focusTasks]);

  const headerStats = useMemo(() => {
    const now = Date.now();
    const openTasks = focusTasks.filter((task) => !task.completed).length;
    const upcomingEvents = timelineEvents.filter((event) => new Date(event.date).getTime() > now).length;
    return [
      { label: 'Signals Logged', value: String(memory.length) },
      { label: 'Open Focus', value: String(openTasks) },
      { label: 'Upcoming Events', value: String(upcomingEvents) },
    ];
  }, [focusTasks, memory.length, timelineEvents]);

  useEffect(() => {
    const now = Date.now();
    const categories = [
      Category.HEALTH,
      Category.FINANCE,
      Category.RELATIONSHIPS,
      Category.SPIRITUAL,
      Category.PERSONAL,
    ];
    const currentScores: Record<string, number> = {};
    categories.forEach((cat) => {
      currentScores[cat] = computeScoreInternal(memory, goals, cat, now);
    });

    if (prevScoresRef.current && memory.length > prevMemoryCountRef.current) {
      const changes = categories
        .map((cat) => ({
          cat,
          delta: currentScores[cat] - (prevScoresRef.current?.[cat] || 0),
        }))
        .filter((entry) => Math.abs(entry.delta) >= 1);

      if (changes.length > 0) {
        const summary = changes
          .slice(0, 3)
          .map(
            (entry) =>
              `${entry.cat} ${entry.delta >= 0 ? '▲' : '▼'} ${entry.delta >= 0 ? '+' : ''}${entry.delta}`
          )
          .join(', ');
        onToast?.(`Dashboard updated: ${summary}`, 'success');
      }
    }

    prevScoresRef.current = currentScores;
    prevMemoryCountRef.current = memory.length;
  }, [memory, goals, onToast]);

  useEffect(() => {
    if (!lifeContext) return;
    if (memory.length <= contributionMemoryCountRef.current) {
      contributionMemoryCountRef.current = memory.length;
      return;
    }
    const deltas = lifeContext.sessionDeltas
      .filter((delta) => Math.abs(delta.delta) >= 1)
      .slice(0, 3);
    contributionMemoryCountRef.current = memory.length;
    if (deltas.length === 0) return;

    const payload: ContributionFeedback = {
      logSummary: memory[0]?.content || 'Signal logged',
      affectedDimensions: deltas.map((delta) => ({
        dimension: delta.dimension,
        scoreBefore: delta.previousScore,
        scoreAfter: delta.currentScore,
        delta: delta.delta,
      })),
    };
    setContribution(payload);
    setShowContribution(true);
    if (contributionTimeoutRef.current) {
      window.clearTimeout(contributionTimeoutRef.current);
    }
    contributionTimeoutRef.current = window.setTimeout(() => {
      setShowContribution(false);
    }, 5000);
  }, [lifeContext, memory]);

  useEffect(() => {
    return () => {
      if (contributionTimeoutRef.current) {
        window.clearTimeout(contributionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1560px] pb-32 space-y-8">
      <DashboardHeader greeting={greeting} summary={headerSummary} stats={headerStats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,410px)]">
        <div className="space-y-6">
          {/* Getting Started — shown only when no memory items exist */}
          {memory.length === 0 && (
            <section className="rounded-[24px] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/6 to-transparent p-6 animate-in fade-in duration-500">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Getting Started
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white text-balance">
                Your dashboard personalises as you log. Start with one of these:
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('DAILY_CHECKIN')}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <BookOpen size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Daily check-in</p>
                    <p className="text-[12px] text-slate-400 mt-0.5 text-pretty">
                      Log your energy, mood, and top focus for the day.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('SCHEDULE_EVENT')}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <CalendarPlus size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Schedule an event</p>
                    <p className="text-[12px] text-slate-400 mt-0.5 text-pretty">
                      Add an upcoming event so Areté can help you prepare.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('WORK_PROGRESS')}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <Target size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Log work progress</p>
                    <p className="text-[12px] text-slate-400 mt-0.5 text-pretty">
                      Record what you moved forward and what&apos;s next.
                    </p>
                  </div>
                </button>
              </div>
              <p className="mt-4 text-[11px] text-slate-500">
                Type anything into the log bar below. Areté will categorise and analyse it.
              </p>
            </section>
          )}

          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <SignalGrid
              memoryItems={memory}
              goals={goals}
              baseline={baselineSwot}
              insights={insights}
              blindSpots={blindSpots}
              recommendations={recommendations}
              onInsertTemplate={handleInsertTemplate}
            />
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Execution Board
            </p>
            <div className="xl:max-h-[860px] xl:overflow-y-auto xl:pr-1">
              <FocusList
                tasks={focusTasks}
                habitItems={habitItems}
                onToggleTask={(id) => toggleTask(id)}
                onToggleHabit={handleToggleHabit}
                onDeleteTask={(id) => deleteTask(id)}
                onRefreshPlan={planMyDay}
                onRefreshQueue={planMyDay}
                isPlanning={isPlanningDay}
                events={timelineEvents}
              />
            </div>
          </section>

          <ReportsSection memory={memory} profile={profile} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Inbox
                </p>
                <p className="text-sm text-slate-200">
                  {inboxEntries.length > 0
                    ? `${inboxEntries.length} new entr${inboxEntries.length === 1 ? 'y' : 'ies'} from Telegram`
                    : 'No pending entries'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onMergeInbox?.()}
                  disabled={inboxEntries.length === 0}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-40"
                >
                  Merge all
                </button>
                <button
                  type="button"
                  onClick={() => onRefreshInbox?.()}
                  className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {inboxEntries.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-5 text-center text-xs text-slate-500">
                  Inbox is clear. New Telegram logs will appear here.
                </div>
              )}
              {inboxEntries.slice(0, 8).map((entry) => {
                const confidence = estimateInboxConfidence(entry);
                const needsReview = confidence < inboxReviewConfidence;
                const preview = getInboxPreview(entry);
                return (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-emerald-300">•</span>
                          <span className="rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                            {entry.content_type}
                          </span>
                          <span className="rounded-md border border-indigo-400/30 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-indigo-200">
                            {Math.round(confidence * 100)}% confidence
                          </span>
                          {needsReview && (
                            <span className="rounded-md border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-200">
                              needs review
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200">{(entry.raw_content || '').slice(0, 140) || 'Inbox entry'}</p>
                        {preview && <p className="text-[11px] text-slate-400 line-clamp-2">AI: {preview}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => void onMergeInbox?.([entry.id])}
                        className="shrink-0 rounded-md border border-emerald-400/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-500/10"
                      >
                        Merge
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">
              Event Radar
            </p>
            <UpcomingCalendar
              events={timelineEvents}
              onSelectEvent={setActivePrepEvent}
              onEditEvent={setEditingEvent}
              onDeleteEvent={deleteTimelineEvent}
              maxEvents={5}
            />
          </section>

          <AdvanceProtectPanel
            profile={profile}
            memoryItems={memory}
            goals={goals}
            recommendations={recommendations}
            blindSpots={blindSpots}
            timelineEvents={timelineEvents}
            onPlanDay={planMyDay}
            onInsertTemplate={handleInsertTemplate}
            onOpenEvent={setActivePrepEvent}
            onActivateRecommendation={(rec) => activatePrepPlan?.(rec, (rec as any).metadata?.eventId)}
          />
        </aside>
      </div>

      {/* Deep Analysis — collapsible, defaults to expanded */}
      {lifeContext && (
        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <button
            type="button"
            onClick={() => {
              const next = !isDeepAnalysisExpanded;
              setIsDeepAnalysisExpanded(next);
              try {
                localStorage.setItem('arete:deepAnalysisExpanded', String(next));
              } catch {}
            }}
            className="w-full flex flex-wrap items-center justify-between gap-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-xl"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Deep Analysis
              </p>
              <p className="text-sm text-slate-300">
                Narrative, diagnostics, and profile gap intelligence.
              </p>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-300 ${isDeepAnalysisExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isDeepAnalysisExpanded && (
            <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <LifeContextPanel
                snapshots={lifeContext.currentSnapshots}
                narrative={lifeContext.currentNarrative}
                priorities={lifeContext.criticalPriorities}
                profileGaps={lifeContext.profileGaps}
                dismissedProfileGaps={lifeContext.dismissedProfileGaps}
                selectedDimension={lifeContext.selectedDimension}
                isSnapshotExpanded={lifeContext.isSnapshotExpanded}
                isRefreshingNarrative={lifeContext.isRefreshingNarrative}
                refreshingDimensions={lifeContext.refreshingDimensions}
                error={lifeContext.error}
                contribution={contribution}
                showContribution={showContribution}
                onCloseContribution={() => setShowContribution(false)}
                onRefreshAll={lifeContext.refreshAllDimensions}
                onRefreshDimension={lifeContext.refreshDimension}
                onSelectDimension={(dimension) => {
                  lifeContext.selectDimension(dimension);
                  onToast?.(`${dimension} selected.`, 'info');
                }}
                onToggleExpanded={lifeContext.toggleSnapshotExpanded}
                onDismissGap={lifeContext.dismissProfileGap}
                onOpenProfile={() => onNavigate('vault')}
                onViewHistory={() => onToast?.('History viewer coming soon.', 'info')}
                onInsertTemplate={handleInsertTemplate}
              />
            </div>
          )}
        </section>
      )}

      <EventPrepPopup
        event={activePrepEvent}
        profile={profile}
        memory={memory}
        onClose={() => setActivePrepEvent(null)}
        onActivate={(plan, id) => {
          activatePrepPlan?.(plan, id);
          onToast?.(`Armed: ${plan.title}. Tasks added to Today's Focus.`, 'success');
          setActivePrepEvent(null);
        }}
      />

      {editingEvent && updateTimelineEvent && (
        <EventEditSheet
          event={editingEvent}
          onSave={updateTimelineEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};
