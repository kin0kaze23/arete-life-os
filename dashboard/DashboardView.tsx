import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CalendarPlus, Inbox, ShieldAlert, Sparkles, Target } from 'lucide-react';
import {
  AlwaysChip,
  BlindSpot,
  Category,
  DailyTask,
  Goal,
  InboxEntry,
  MemoryEntry,
  Recommendation,
  Source,
  TimelineEvent,
  UserProfile,
} from '@/data';
import { FocusList } from './FocusList';
import { EventPrepPopup } from './EventPrepPopup';
import { EventEditSheet } from './EventEditSheet';
import { UpcomingCalendar } from './UpcomingCalendar';
import { DashboardHeader } from './DashboardHeader';
import { computeScoreInternal } from './ScoreStrip';
import { StatusSidebar } from './StatusSidebar';
import { getProfileCompletion } from '@/shared';

interface DashboardViewProps {
  memory: MemoryEntry[];
  tasks: DailyTask[];
  dailyPlan: DailyTask[];
  timelineEvents: TimelineEvent[];
  blindSpots?: BlindSpot[];
  profile: UserProfile;
  ruleOfLife: any;
  sources: Source[];
  recommendations: Recommendation[];
  goals: Goal[];
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
  inboxEntries?: InboxEntry[];
  inboxReviewConfidence?: number;
  onMergeInbox?: (ids?: string[]) => Promise<void> | void;
  onRefreshInbox?: () => Promise<void> | void;
  isInboxAvailable?: boolean;
  inboxUnavailableReason?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory = [],
  tasks,
  dailyPlan,
  timelineEvents,
  blindSpots = [],
  profile,
  recommendations,
  goals,
  toggleTask,
  deleteTask,
  planMyDay,
  onNavigate,
  updateMemoryItem,
  keepRecommendation,
  removeRecommendation,
  activatePrepPlan,
  onToast,
  isPlanningDay,
  updateTimelineEvent,
  deleteTimelineEvent,
  personalizedGreeting = 'Welcome',
  inboxEntries = [],
  inboxReviewConfidence = 0.65,
  onMergeInbox,
  onRefreshInbox,
  isInboxAvailable = false,
  inboxUnavailableReason,
  alwaysDoChips = [],
  alwaysWatchChips = [],
}) => {
  const [activePrepEvent, setActivePrepEvent] = useState<TimelineEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const prevScoresRef = useRef<Record<string, number> | null>(null);
  const prevMemoryCountRef = useRef<number>(memory.length);

  const habitItems = useMemo(() => {
    const items = memory.filter(
      (item) => item.category === Category.HABIT || item.metadata?.type === 'habit'
    );
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [memory]);

  const focusTasks = useMemo(() => {
    if (dailyPlan.length > 0) return dailyPlan;
    return tasks;
  }, [dailyPlan, tasks]);

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
      return `Next: ${next.title} in ${hours}h. ${prepStatus}.`;
    }
    if (focusTasks.length > 0) {
      const remaining = Math.max(0, focusTasks.filter((task) => !task.completed).length - 1);
      return remaining > 0
        ? `Top focus: ${focusTasks[0].title} plus ${remaining} more open items.`
        : `Top focus: ${focusTasks[0].title}.`;
    }
    return 'Log a short check-in and this dashboard will become more specific to your life.';
  }, [focusTasks, timelineEvents]);

  const profileCompletion = useMemo(() => getProfileCompletion(profile).overall, [profile]);
  const openTasks = useMemo(
    () => focusTasks.filter((task) => !task.completed).length,
    [focusTasks]
  );
  const nextEvent = useMemo(() => {
    return [...timelineEvents]
      .filter((event) => new Date(event.date).getTime() > Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [timelineEvents]);
  const highRiskCount = useMemo(
    () => blindSpots.filter((spot) => spot.severity === 'high').length,
    [blindSpots]
  );
  const headerStats = useMemo(
    () => [
      { label: 'Signals Logged', value: String(memory.length) },
      { label: 'Open Focus', value: String(openTasks) },
      {
        label: 'Next Event',
        value: nextEvent ? nextEvent.title.slice(0, 20) : 'None',
      },
    ],
    [memory.length, nextEvent, openTasks]
  );

  const recommendedMoves = useMemo(
    () =>
      recommendations
        .filter((rec) => rec.status === 'ACTIVE')
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, 3),
    [recommendations]
  );

  const canMergeInbox = isInboxAvailable && Boolean(onMergeInbox);
  const canRefreshInbox = isInboxAvailable && Boolean(onRefreshInbox);

  const estimateInboxConfidence = (entry: InboxEntry) => {
    const root = (entry.ai_result as any)?.confidence;
    if (typeof root === 'number' && !Number.isNaN(root)) return Math.max(0, Math.min(1, root));
    const items = Array.isArray((entry.ai_result as any)?.items)
      ? ((entry.ai_result as any).items as any[])
      : [];
    if (items.length === 0) return 0.6;
    const total = items.reduce((sum, item) => {
      const value =
        typeof item?.confidence === 'number' && !Number.isNaN(item.confidence)
          ? item.confidence
          : 0.6;
      return sum + Math.max(0, Math.min(1, value));
    }, 0);
    return total / items.length;
  };

  const getInboxPreview = (entry: InboxEntry) => {
    const items = Array.isArray((entry.ai_result as any)?.items)
      ? ((entry.ai_result as any).items as any[])
      : [];
    if (items.length === 0) return '';
    const top = items[0];
    const title = typeof top?.title === 'string' ? top.title.trim() : '';
    const content = typeof top?.content === 'string' ? top.content.trim() : '';
    return title || content;
  };

  const handleToggleHabit = (id: string) => {
    if (updateMemoryItem) {
      updateMemoryItem(id, { timestamp: Date.now() });
    }
  };

  const handleInsertTemplate = (template: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('logbar:insert', { detail: { template } }));
  };

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

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 pb-32">
      <DashboardHeader greeting={greeting} summary={headerSummary} stats={headerStats} />

      {memory.length === 0 && (
        <section className="rounded-[24px] border border-blue-400/20 bg-blue-500/[0.06] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Start here
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            The dashboard gets better after your first few real signals.
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => handleInsertTemplate('DAILY_CHECKIN')}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-blue-300/35"
            >
              <BookOpen size={16} className="mt-0.5 shrink-0 text-blue-200" />
              <div>
                <p className="text-sm font-semibold text-white">Daily check-in</p>
                <p className="mt-1 text-xs text-slate-400">
                  Log energy, focus, mood, and what feels most important today.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleInsertTemplate('SCHEDULE_EVENT')}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-blue-300/35"
            >
              <CalendarPlus size={16} className="mt-0.5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-white">Schedule an event</p>
                <p className="mt-1 text-xs text-slate-400">
                  Add a real upcoming event so Areté can prepare you for it.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleInsertTemplate('WORK_PROGRESS')}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-blue-300/35"
            >
              <Target size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-white">Log work progress</p>
                <p className="mt-1 text-xs text-slate-400">
                  Capture what moved and what the next step should be.
                </p>
              </div>
            </button>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.12fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 xl:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Today at a glance
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-100">Start with the next best move</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Use one of these direct actions, then work from the execution board below.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:w-[300px]">
                <SummaryMetric label="Open focus" value={String(openTasks)} />
                <SummaryMetric label="Inbox pending" value={String(inboxEntries.length)} />
                <SummaryMetric label="High risks" value={String(highRiskCount)} />
                <SummaryMetric label="Active recs" value={String(recommendations.length)} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <QuickActionCard
                title="Log Check-In"
                description="Capture mood, focus, and energy."
                onClick={() => handleInsertTemplate('DAILY_CHECKIN')}
              />
              <QuickActionCard
                title="Open Journal"
                description="Review your categorized timeline."
                onClick={() => onNavigate('stream')}
              />
              <QuickActionCard
                title="Ask Assistant"
                description="Get advice from your private context."
                onClick={() => onNavigate('chat')}
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 xl:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Execution board
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-100">Focus for today</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
                {openTasks} open item{openTasks === 1 ? '' : 's'}
              </div>
            </div>

            <div className="mt-5 xl:max-h-[860px] xl:overflow-y-auto xl:pr-1">
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
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Worth attention
            </p>
            <div className="mt-4 space-y-3">
              <AttentionRow label="Profile completion" value={`${profileCompletion}%`} />
              <AttentionRow label="Next event" value={nextEvent ? nextEvent.title : 'No upcoming events'} />
              <AttentionRow
                label="Best recommendation"
                value={recommendedMoves[0]?.title || 'Ask Aura for a recommendation'}
              />
              <AttentionRow
                label="Inbox state"
                value={inboxEntries.length > 0 ? `${inboxEntries.length} pending` : 'Clear'}
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  Inbox
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {inboxEntries.length > 0
                    ? `${inboxEntries.length} new entr${inboxEntries.length === 1 ? 'y' : 'ies'} from Telegram`
                    : 'No pending entries'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onMergeInbox?.()}
                  disabled={inboxEntries.length === 0 || !canMergeInbox}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-40"
                >
                  Merge all
                </button>
                <button
                  type="button"
                  onClick={() => onRefreshInbox?.()}
                  disabled={!canRefreshInbox}
                  className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200 disabled:opacity-40"
                >
                  Refresh
                </button>
              </div>
            </div>

            {!isInboxAvailable && (
              <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                {inboxUnavailableReason || 'Inbox actions are unavailable in this environment.'}
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              {inboxEntries.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-5 text-center text-xs text-slate-500">
                  Inbox is clear. New Telegram logs will appear here.
                </div>
              )}
              {inboxEntries.slice(0, 5).map((entry) => {
                const confidence = estimateInboxConfidence(entry);
                const needsReview = confidence < inboxReviewConfidence;
                const preview = getInboxPreview(entry);
                return (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                            {entry.content_type}
                          </span>
                          <span className="rounded-md border border-indigo-400/30 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-indigo-200">
                            {Math.round(confidence * 100)}% confidence
                          </span>
                          {needsReview && (
                            <span className="rounded-md border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-200">
                              Needs review
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-slate-200">
                          {(entry.raw_content || '').slice(0, 140) || 'Inbox entry'}
                        </p>
                        {preview && <p className="text-[11px] text-slate-400 line-clamp-2">AI: {preview}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => void onMergeInbox?.([entry.id])}
                        disabled={!canMergeInbox}
                        className="shrink-0 rounded-md border border-emerald-400/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
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
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-blue-200" />
              <p className="text-sm font-semibold text-slate-100">Upcoming</p>
            </div>
            <UpcomingCalendar
              events={timelineEvents}
              onSelectEvent={setActivePrepEvent}
              onEditEvent={setEditingEvent}
              onDeleteEvent={deleteTimelineEvent}
              maxEvents={4}
            />
          </section>

          <StatusSidebar
            profile={profile}
            completion={profileCompletion}
            blindSpots={blindSpots}
            recommendations={recommendations}
            onNavigate={onNavigate}
            onActivate={(rec) => activatePrepPlan?.(rec, (rec as any).metadata?.eventId)}
            onKeepRecommendation={keepRecommendation}
            onRemoveRecommendation={removeRecommendation}
            alwaysDoChips={alwaysDoChips}
            alwaysWatchChips={alwaysWatchChips}
          />
        </aside>
      </section>

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

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  onClick: () => void;
}> = ({ title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:border-blue-300/35 hover:bg-blue-500/[0.08]"
  >
    <p className="text-sm font-semibold text-slate-100">{title}</p>
    <p className="mt-1 text-xs text-slate-400">{description}</p>
  </button>
);

const SummaryMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
  </div>
);

const AttentionRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
  </div>
);
