import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CalendarPlus, Target, Inbox, ShieldAlert } from 'lucide-react';
import {
  AlwaysChip,
  DailyTask,
  UserProfile,
  Category,
  MemoryEntry,
  TimelineEvent,
  BlindSpot,
  Recommendation,
  Source,
  Goal,
  InboxEntry,
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

  const profileCompletion = useMemo(() => getProfileCompletion(profile).overall, [profile]);

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

  const nextEvent = useMemo(() => {
    return [...timelineEvents]
      .filter((event) => new Date(event.date).getTime() > Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [timelineEvents]);

  const highRiskCount = useMemo(
    () => blindSpots.filter((spot) => spot.severity === 'high').length,
    [blindSpots]
  );
  const canMergeInbox = isInboxAvailable && Boolean(onMergeInbox);
  const canRefreshInbox = isInboxAvailable && Boolean(onRefreshInbox);

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
    <div className="mx-auto w-full max-w-[1560px] pb-32 space-y-8">
      <DashboardHeader greeting={greeting} summary={headerSummary} stats={headerStats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,410px)]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Quick Actions
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => handleInsertTemplate('DAILY_CHECKIN')}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-indigo-400/35"
              >
                <p className="text-sm font-semibold text-slate-100">Log Check-In</p>
                <p className="mt-1 text-xs text-slate-400">Capture mood, focus, and energy.</p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('stream')}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-indigo-400/35"
              >
                <p className="text-sm font-semibold text-slate-100">Open Journal</p>
                <p className="mt-1 text-xs text-slate-400">Review your categorized timeline.</p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('chat')}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-indigo-400/35"
              >
                <p className="text-sm font-semibold text-slate-100">Ask Assistant</p>
                <p className="mt-1 text-xs text-slate-400">Get advice from your life context.</p>
              </button>
            </div>
          </section>

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
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Life Overview
            </p>
            <div className="grid grid-cols-2 gap-3">
              <OverviewMetric label="Profile Complete" value={`${profileCompletion}%`} />
              <OverviewMetric
                label="Inbox Pending"
                value={String(inboxEntries.length)}
                icon={<Inbox size={12} className="text-emerald-300" />}
              />
              <OverviewMetric
                label="High Risks"
                value={String(highRiskCount)}
                icon={<ShieldAlert size={12} className="text-rose-300" />}
              />
              <OverviewMetric label="Active Recs" value={String(recommendations.length)} />
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Next Event</p>
              <p className="text-sm font-semibold text-slate-100">
                {nextEvent ? nextEvent.title : 'No upcoming events'}
              </p>
            </div>
          </section>

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
                  disabled={inboxEntries.length === 0 || !canMergeInbox}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-40"
                >
                  Merge all
                </button>
                <button
                  type="button"
                  onClick={() => onRefreshInbox?.()}
                  disabled={!canRefreshInbox}
                  className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200"
                >
                  Refresh
                </button>
              </div>
            </div>
            {!isInboxAvailable && (
              <div className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                {inboxUnavailableReason || 'Inbox actions are unavailable in this environment.'}
              </div>
            )}
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

          <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
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
          </section>
        </aside>
      </div>

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

const OverviewMetric: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {icon}
    </div>
    <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
  </div>
);
