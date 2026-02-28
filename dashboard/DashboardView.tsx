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
  missingProfileFields?: string[];
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
  missingProfileFields = [],
  onMergeInbox,
  onRefreshInbox,
  isInboxAvailable = false,
  inboxUnavailableReason,
  alwaysDoChips = [],
  alwaysWatchChips = [],
}) => {
  const [activePrepEvent, setActivePrepEvent] = useState<TimelineEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('arete:dashboardFocusMode') === 'true';
  });
  const [reviewEntryId, setReviewEntryId] = useState<string | null>(null);
  const [showShutdownFlow, setShowShutdownFlow] = useState(false);
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
  const isEveningWindow = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 5;
  }, []);

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
  const reviewEntry = useMemo(
    () => inboxEntries.find((entry) => entry.id === reviewEntryId) || null,
    [inboxEntries, reviewEntryId]
  );

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

  const getInboxItems = (entry: InboxEntry) =>
    Array.isArray((entry.ai_result as any)?.items) ? (((entry.ai_result as any).items as any[]) || []) : [];

  const getInboxReviewQuestions = (entry: InboxEntry) => {
    const itemQuestions = getInboxItems(entry).flatMap((item) =>
      Array.isArray(item?.needsReview?.questions) ? item.needsReview.questions : []
    );
    const resultQuestions = Array.isArray((entry.ai_result as any)?.needsReview?.questions)
      ? ((entry.ai_result as any).needsReview.questions as string[])
      : [];
    return [...new Set([...itemQuestions, ...resultQuestions])].slice(0, 4);
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

  const scrollToSection = (id: string) => {
    if (typeof document === 'undefined') return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('arete:dashboardFocusMode', isFocusMode ? 'true' : 'false');
  }, [isFocusMode]);

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
    <div className="mx-auto w-full max-w-[1460px] space-y-6 pb-32">
      <DashboardHeader greeting={greeting} summary={headerSummary} stats={headerStats} />

      {memory.length === 0 && (
        <section className="rounded-[24px] border border-[#7ea3ff]/20 bg-[#7ea3ff]/[0.07] px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-200">
                Start here
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Add a few real signals so this page can become specific.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionPill
                label="Log Check-In"
                icon={<BookOpen size={14} />}
                onClick={() => handleInsertTemplate('DAILY_CHECKIN')}
              />
              <ActionPill
                label="Schedule Event"
                icon={<CalendarPlus size={14} />}
                onClick={() => handleInsertTemplate('SCHEDULE_EVENT')}
              />
              <ActionPill
                label="Log Work"
                icon={<Target size={14} />}
                onClick={() => handleInsertTemplate('WORK_PROGRESS')}
              />
            </div>
          </div>
        </section>
      )}

      {isEveningWindow && (
        <section className="rounded-[24px] border border-amber-300/20 bg-amber-500/[0.08] px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-200">
                Daily shutdown
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Close the day before the context gets noisy.
              </h2>
              <p className="mt-2 text-sm text-amber-50/85">
                Review inbox, clear the last open loop, capture reflection, then preview tomorrow.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowShutdownFlow(true)}
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Start shutdown
            </button>
          </div>
        </section>
      )}

      <section
        className={`grid grid-cols-1 gap-6 ${
          isFocusMode ? '' : 'xl:grid-cols-[minmax(0,1.2fr)_360px]'
        }`}
      >
        <div className="space-y-6">
          <section className="rounded-[26px] border border-white/8 bg-white/[0.025] p-5 xl:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Execution board
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
                  Focus for today
                </h2>
                <p className="mt-2 text-sm text-slate-400">One main queue. One clear next step.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
                {openTasks} open item{openTasks === 1 ? '' : 's'}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ActionPill
                label="Log Check-In"
                icon={<BookOpen size={14} />}
                onClick={() => handleInsertTemplate('DAILY_CHECKIN')}
              />
              <ActionPill
                label="Open Journal"
                icon={<BookOpen size={14} />}
                onClick={() => onNavigate('stream')}
              />
              <ActionPill
                label="Ask Assistant"
                icon={<Sparkles size={14} />}
                onClick={() => onNavigate('chat')}
              />
              <ActionPill
                label={isFocusMode ? 'Show Overview' : 'Focus Mode'}
                icon={<Target size={14} />}
                onClick={() => setIsFocusMode((prev) => !prev)}
              />
              <ActionPill
                label="Shutdown"
                icon={<ShieldAlert size={14} />}
                onClick={() => setShowShutdownFlow(true)}
              />
            </div>

            <div className="mt-5 xl:max-h-[900px] xl:overflow-y-auto xl:pr-1">
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

        {!isFocusMode && (
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,34,50,0.9),rgba(16,22,32,0.84))] p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-blue-200" />
              <p className="text-sm font-semibold text-slate-100">Life pulse</p>
            </div>
            <div className="mt-4 space-y-3">
              <PulseRow
                label="Profile"
                value={`${profileCompletion}% complete`}
                onClick={() => onNavigate('vault')}
              />
              <PulseRow
                label="Inbox"
                value={inboxEntries.length > 0 ? `${inboxEntries.length} pending` : 'Clear'}
                onClick={() => scrollToSection('dashboard-inbox')}
              />
              <PulseRow
                label="Next event"
                value={nextEvent ? nextEvent.title : 'None scheduled'}
                onClick={() => scrollToSection('dashboard-upcoming')}
              />
              <PulseRow
                label="Top recommendation"
                value={recommendedMoves[0]?.title || 'No recommendation yet'}
                onClick={() => scrollToSection('dashboard-recommendations')}
              />
              <PulseRow
                label="Risks"
                value={highRiskCount > 0 ? `${highRiskCount} high` : 'Stable'}
                onClick={() => scrollToSection('dashboard-recommendations')}
              />
            </div>
          </section>

          <section
            id="dashboard-inbox"
            className="rounded-[26px] border border-white/8 bg-white/[0.025] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-300">
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
                  onClick={() => setReviewEntryId(inboxEntries[0]?.id || null)}
                  disabled={inboxEntries.length === 0}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200 disabled:opacity-40"
                >
                  Review mode
                </button>
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
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewEntryId(entry.id)}
                          className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200 hover:bg-white/[0.04]"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => void onMergeInbox?.([entry.id])}
                          disabled={!canMergeInbox}
                          className="rounded-md border border-emerald-400/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40"
                        >
                          Merge
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            id="dashboard-upcoming"
            className="rounded-[26px] border border-white/8 bg-white/[0.025] p-5"
          >
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

          <div id="dashboard-recommendations">
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
          </div>
          </aside>
        )}
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

      {reviewEntry && (
        <InboxReviewModal
          entry={reviewEntry}
          confidence={estimateInboxConfidence(reviewEntry)}
          preview={getInboxPreview(reviewEntry)}
          items={getInboxItems(reviewEntry)}
          questions={getInboxReviewQuestions(reviewEntry)}
          onClose={() => setReviewEntryId(null)}
          onMerge={async () => {
            await onMergeInbox?.([reviewEntry.id]);
            setReviewEntryId(null);
            onToast?.('Inbox entry merged', 'success');
          }}
        />
      )}

      {showShutdownFlow && (
        <DailyShutdownModal
          inboxCount={inboxEntries.length}
          openTasks={openTasks}
          missingFieldCount={missingProfileFields.length}
          nextEventTitle={nextEvent?.title}
          onClose={() => setShowShutdownFlow(false)}
          onReviewInbox={() => {
            setShowShutdownFlow(false);
            setReviewEntryId(inboxEntries[0]?.id || null);
          }}
          onFocus={() => {
            setIsFocusMode(true);
            setShowShutdownFlow(false);
          }}
          onGuidedInterview={() => {
            onNavigate('chat');
            setShowShutdownFlow(false);
          }}
          onEveningAudit={() => {
            handleInsertTemplate('EVENING_AUDIT');
            setShowShutdownFlow(false);
          }}
        />
      )}
    </div>
  );
};

const ActionPill: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ label, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-300/35 hover:bg-blue-500/[0.08]"
  >
    {icon}
    {label}
  </button>
);

const PulseRow: React.FC<{ label: string; value: string; onClick?: () => void }> = ({
  label,
  value,
  onClick,
}) => {
  const classes =
    'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.04]';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
      </button>
    );
  }

  return (
    <div className={classes}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
};

const InboxReviewModal: React.FC<{
  entry: InboxEntry;
  confidence: number;
  preview: string;
  items: any[];
  questions: string[];
  onClose: () => void;
  onMerge: () => Promise<void> | void;
}> = ({ entry, confidence, preview, items, questions, onClose, onMerge }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#05070d]/72 p-6 backdrop-blur-sm">
    <div className="w-full max-w-5xl rounded-[28px] border border-white/10 bg-[#0f1722] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Review mode
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-100">Telegram intake review</h3>
          <p className="mt-2 text-sm text-slate-400">
            Compare the raw message with the AI interpretation before merging it into your vault.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void onMerge()}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Merge
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-100">Raw content</p>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
              {entry.content_type}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{entry.raw_content}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">AI interpretation</p>
              <p className="mt-1 text-xs text-slate-400">
                {preview || 'No direct preview available'}
              </p>
            </div>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-500/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-indigo-200">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {items.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-4 text-sm text-slate-500">
                No structured items were extracted.
              </div>
            )}
            {items.map((item, index) => (
              <div key={`${entry.id}-item-${index}`} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {item?.type || 'memory'}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {item?.domain || 'General'}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {Math.round(((item?.confidence as number) || confidence) * 100)}%
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">{item?.content || 'No content'}</p>
              </div>
            ))}
          </div>

          {questions.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/[0.08] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-200">
                Needs review
              </p>
              <div className="mt-2 space-y-1.5">
                {questions.map((question, index) => (
                  <p key={`${entry.id}-question-${index}`} className="text-sm text-amber-100">
                    {index + 1}. {question}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  </div>
);

const DailyShutdownModal: React.FC<{
  inboxCount: number;
  openTasks: number;
  missingFieldCount: number;
  nextEventTitle?: string;
  onClose: () => void;
  onReviewInbox: () => void;
  onFocus: () => void;
  onGuidedInterview: () => void;
  onEveningAudit: () => void;
}> = ({
  inboxCount,
  openTasks,
  missingFieldCount,
  nextEventTitle,
  onClose,
  onReviewInbox,
  onFocus,
  onGuidedInterview,
  onEveningAudit,
}) => (
  <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#05070d]/72 p-6 backdrop-blur-sm">
    <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#0f1722] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-200">
            Daily shutdown
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-100">Finish today cleanly</h3>
          <p className="mt-2 text-sm text-slate-400">
            Use this to close loops, preserve context, and make tomorrow easier to start.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04]"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ShutdownStep
          step="1"
          title="Clear the inbox"
          detail={
            inboxCount > 0
              ? `${inboxCount} Telegram entr${inboxCount === 1 ? 'y' : 'ies'} still need attention.`
              : 'Inbox is already clear.'
          }
          ctaLabel={inboxCount > 0 ? 'Review inbox' : 'Done'}
          disabled={inboxCount === 0}
          onClick={onReviewInbox}
        />
        <ShutdownStep
          step="2"
          title="Reduce open loops"
          detail={
            openTasks > 0
              ? `${openTasks} focus item${openTasks === 1 ? '' : 's'} still open.`
              : 'Your focus list is already clean.'
          }
          ctaLabel={openTasks > 0 ? 'Enter focus mode' : 'Done'}
          disabled={openTasks === 0}
          onClick={onFocus}
        />
        <ShutdownStep
          step="3"
          title="Fill one missing context field"
          detail={
            missingFieldCount > 0
              ? `${missingFieldCount} profile field${missingFieldCount === 1 ? '' : 's'} still missing.`
              : 'Your key profile context is already grounded.'
          }
          ctaLabel={missingFieldCount > 0 ? 'Open assistant' : 'Done'}
          disabled={missingFieldCount === 0}
          onClick={onGuidedInterview}
        />
        <ShutdownStep
          step="4"
          title="Capture reflection"
          detail="Run the Evening Audit so the day becomes usable context tomorrow."
          ctaLabel="Open evening audit"
          onClick={onEveningAudit}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          Tomorrow preview
        </p>
        <p className="mt-2 text-sm text-slate-200">
          {nextEventTitle ? `Next scheduled event: ${nextEventTitle}.` : 'No upcoming event is scheduled yet.'}
        </p>
      </div>
    </div>
  </div>
);

const ShutdownStep: React.FC<{
  step: string;
  title: string;
  detail: string;
  ctaLabel: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ step, title, detail, ctaLabel, onClick, disabled = false }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-slate-100">
        {step}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="mt-4 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-40"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  </div>
);
