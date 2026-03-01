import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Inbox, ShieldAlert, Sparkles, Target } from 'lucide-react';
import {
  AlwaysChip,
  BlindSpot,
  Category,
  DailyTask,
  Goal,
  GuidanceDigest,
  GuidanceQuestion,
  InboxEntry,
  MemoryEntry,
  Recommendation,
  Source,
  StrategicBriefing,
  TimelineEvent,
  UserProfile,
} from '@/data';
import { FocusList } from './FocusList';
import { EventPrepPopup } from './EventPrepPopup';
import { DashboardHeader } from './DashboardHeader';
import { GuidanceConsoleCard } from './GuidanceConsoleCard';
import { computeScoreInternal } from './ScoreStrip';

interface DashboardViewProps {
  memory: MemoryEntry[];
  tasks: DailyTask[];
  dailyPlan: DailyTask[];
  timelineEvents: TimelineEvent[];
  blindSpots?: BlindSpot[];
  profile: UserProfile;
  ruleOfLife: any;
  sources: Source[];
  recommendations?: Recommendation[];
  goals: Goal[];
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  planMyDay: () => void;
  onNavigate: (tab: any) => void;
  updateMemoryItem?: (id: string, updates: Partial<MemoryEntry>) => void;
  activatePrepPlan?: (plan: any, eventId?: string) => void;
  keepRecommendation?: (id: string) => void;
  removeRecommendation?: (id: string) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  alwaysDoChips?: AlwaysChip[];
  alwaysWatchChips?: AlwaysChip[];
  isPlanningDay: boolean;
  personalizedGreeting?: string;
  inboxEntries?: InboxEntry[];
  inboxReviewConfidence?: number;
  missingProfileFields?: string[];
  onMergeInbox?: (ids?: string[]) => Promise<void> | void;
  onRefreshInbox?: () => Promise<void> | void;
  isInboxAvailable?: boolean;
  inboxUnavailableReason?: string;
  strategicBriefing?: StrategicBriefing | null;
  guidanceDigest?: GuidanceDigest | null;
  guidanceQuestions?: GuidanceQuestion[];
  isRefreshingBriefing?: boolean;
  onRefreshStrategicBriefing?: (options?: { force?: boolean }) => Promise<void> | void;
  onAnswerGuidanceQuestion?: (id: string, answer: string) => void;
  onDismissGuidanceQuestion?: (id: string) => void;
  onSnoozeGuidanceQuestion?: (id: string, hours?: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory = [],
  tasks,
  dailyPlan,
  timelineEvents,
  blindSpots = [],
  profile,
  recommendations = [],
  goals,
  toggleTask,
  deleteTask,
  planMyDay,
  onNavigate,
  updateMemoryItem,
  activatePrepPlan,
  keepRecommendation,
  removeRecommendation,
  onToast,
  isPlanningDay,
  personalizedGreeting = 'Welcome',
  inboxEntries = [],
  inboxReviewConfidence = 0.65,
  missingProfileFields = [],
  onMergeInbox,
  onRefreshInbox,
  isInboxAvailable = false,
  inboxUnavailableReason,
  strategicBriefing = null,
  guidanceDigest = null,
  guidanceQuestions = [],
  isRefreshingBriefing = false,
  onRefreshStrategicBriefing,
  onAnswerGuidanceQuestion,
  onDismissGuidanceQuestion,
  onSnoozeGuidanceQuestion,
}) => {
  const [activePrepEvent, setActivePrepEvent] = useState<TimelineEvent | null>(null);
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

  const upcomingEvents = useMemo(
    () =>
      [...timelineEvents]
        .filter((event) => new Date(event.date).getTime() > Date.now())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4),
    [timelineEvents]
  );

  const nextEvent = upcomingEvents[0];
  const openTasks = useMemo(
    () => focusTasks.filter((task) => !task.completed).length,
    [focusTasks]
  );

  const headerSummary = useMemo(() => {
    if (nextEvent) {
      const hours = Math.max(
        1,
        Math.round((new Date(nextEvent.date).getTime() - Date.now()) / (60 * 60 * 1000))
      );
      return `You have ${openTasks} open item${openTasks === 1 ? '' : 's'} and ${nextEvent.title} is in ${hours}h.`;
    }
    if (openTasks > 0) {
      return `${openTasks} open item${openTasks === 1 ? '' : 's'} are shaping today. Keep the board tight and the next move obvious.`;
    }
    return 'Capture a few real signals and the system will turn them into a clearer plan.';
  }, [nextEvent, openTasks]);

  const isEveningWindow = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 5;
  }, []);

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
    <div className="mx-auto w-full max-w-[1420px] space-y-6 pb-32">
      <DashboardHeader greeting={greeting} summary={headerSummary} />

      <section
        className={`grid grid-cols-1 gap-6 ${
          isFocusMode ? '' : 'xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,380px)]'
        }`}
      >
        <div className="space-y-6">
          <section className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 xl:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  Focus
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
                  Today&apos;s board
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Keep the next move obvious.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFocusMode((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20"
                >
                  <Target size={14} />
                  {isFocusMode ? 'Overview' : 'Focus mode'}
                </button>

                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-400">
                  {openTasks} open
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ActionPill
                label="Capture"
                icon={<BookOpen size={14} />}
                onClick={() => handleInsertTemplate('DAILY_CHECKIN')}
              />
              <ActionPill
                label="Journal"
                icon={<BookOpen size={14} />}
                onClick={() => onNavigate('stream')}
              />
              <ActionPill
                label="Aura"
                icon={<Sparkles size={14} />}
                onClick={() => onNavigate('chat')}
              />
              {isEveningWindow && (
                <ActionPill
                  label="Shutdown"
                  icon={<ShieldAlert size={14} />}
                  onClick={() => setShowShutdownFlow(true)}
                />
              )}
            </div>


            {memory.length === 0 && (
              <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-slate-300">
                Start with a short check-in, a recent expense, or an upcoming event. The board becomes useful after a few real signals.
              </div>
            )}

            <div className="mt-5 xl:max-h-[920px] xl:overflow-y-auto xl:pr-1 premium-scrollbar">
              <FocusList
                tasks={focusTasks}
                habitItems={habitItems}
                onToggleTask={toggleTask}
                onToggleHabit={handleToggleHabit}
                onDeleteTask={deleteTask}
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
            <GuidanceConsoleCard
              digest={guidanceDigest}
              recommendations={recommendations}
              guidanceQuestions={guidanceQuestions}
              strategicBriefing={strategicBriefing}
              missingProfileFields={missingProfileFields}
              isRefreshing={isRefreshingBriefing}
              onRefresh={() => {
                void onRefreshStrategicBriefing?.({ force: true });
              }}
              onOpenAssistant={() => onNavigate('chat')}
              onOpenLife={() => onNavigate('vault')}
              onCapture={() => handleInsertTemplate('DAILY_CHECKIN')}
              onKeepRecommendation={keepRecommendation}
              onRemoveRecommendation={removeRecommendation}
              onAnswerQuestion={onAnswerGuidanceQuestion}
              onDismissQuestion={onDismissGuidanceQuestion}
              onSnoozeQuestion={onSnoozeGuidanceQuestion}
            />


            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5" id="dashboard-inbox">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Inbox size={14} className="text-emerald-200" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Inbox</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {inboxEntries.length > 0
                        ? `${inboxEntries.length} pending Telegram entr${inboxEntries.length === 1 ? 'y' : 'ies'}`
                        : 'No pending entries'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewEntryId(inboxEntries[0]?.id || null)}
                    disabled={inboxEntries.length === 0}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-40"
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => onMergeInbox?.()}
                    disabled={inboxEntries.length === 0 || !canMergeInbox}
                    className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
                  >
                    Merge all
                  </button>
                </div>
              </div>

              {!isInboxAvailable && (
                <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100">
                  {inboxUnavailableReason || 'Inbox actions are unavailable in this environment.'}
                </div>
              )}

              <div className="mt-4 space-y-2.5">
                {inboxEntries.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-white/10 bg-black/20 px-3 py-4 text-center text-xs text-slate-500">
                    Inbox is clear.
                  </div>
                )}

                {inboxEntries.slice(0, 3).map((entry) => {
                  const confidence = estimateInboxConfidence(entry);
                  const needsReview = confidence < inboxReviewConfidence;
                  const preview = getInboxPreview(entry);
                  return (
                    <div
                      key={entry.id}
                      className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3 text-xs text-slate-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                              {entry.content_type}
                            </span>
                            {needsReview && (
                              <span className="rounded-full border border-amber-300/25 bg-amber-500/[0.08] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-200">
                                Review
                              </span>
                            )}
                          </div>
                          <p className="mt-2 line-clamp-2 leading-5 text-slate-200">
                            {(entry.raw_content || '').slice(0, 140) || 'Inbox entry'}
                          </p>
                          {preview && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-400">
                              AI: {preview}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setReviewEntryId(entry.id)}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRefreshInbox?.()}
                  disabled={!canRefreshInbox}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-40"
                >
                  Refresh inbox
                </button>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-200" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">Upcoming</p>
                  <p className="mt-1 text-xs text-slate-400">What needs prep next.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {upcomingEvents.length === 0 && (
                  <div className="rounded-[18px] border border-dashed border-white/10 bg-black/20 px-3 py-4 text-center text-xs text-slate-500">
                    Nothing scheduled yet.
                  </div>
                )}

                {upcomingEvents.map((event) => {
                  const date = new Date(event.date);
                  const prepStatus = event.metadata?.prepStatus === 'ready' ? 'Ready' : 'Prep';
                  return (
                    <button
                      key={event.id}
                      type="button"
                      data-testid="event-card"
                      data-event-id={event.id}
                      onClick={() => setActivePrepEvent(event)}
                      className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-black/20 px-3 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {date.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-300/20 bg-blue-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-200">
                        {prepStatus}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
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
          onToast?.(`Armed: ${plan.title}. Tasks added to today.`, 'success');
          setActivePrepEvent(null);
        }}
      />

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
    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
  >
    {icon}
    {label}
  </button>
);

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
            Review
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-100">Inbox entry</h3>
          <p className="mt-2 text-sm text-slate-400">
            Compare the raw message with the AI interpretation before it enters the vault.
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
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
            {entry.raw_content || 'No raw content available.'}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-100">AI interpretation</p>
            <span className="rounded-full border border-indigo-400/25 bg-indigo-500/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-indigo-200">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>

          {preview && <p className="mt-4 text-sm leading-7 text-slate-300">{preview}</p>}

          {items.length > 0 && (
            <div className="mt-4 space-y-3">
              {items.slice(0, 4).map((item, index) => (
                <div key={`${item?.title || 'item'}-${index}`} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-sm font-semibold text-slate-100">
                    {item?.title || item?.content || `Item ${index + 1}`}
                  </p>
                  {item?.content && item?.content !== item?.title && (
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                Needs clarification
              </p>
              <ul className="mt-2 space-y-1.5">
                {questions.map((question) => (
                  <li key={question} className="text-xs leading-5 text-amber-50/90">
                    {question}
                  </li>
                ))}
              </ul>
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
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#05070d]/72 p-6 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#0f1722] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Shutdown
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-100">Close the day cleanly</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04]"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        <ShutdownStep
          title="Review intake"
          detail={
            inboxCount > 0
              ? `${inboxCount} inbox entr${inboxCount === 1 ? 'y is' : 'ies are'} waiting for review.`
              : 'Inbox is already clear.'
          }
          actionLabel={inboxCount > 0 ? 'Open inbox' : undefined}
          onAction={inboxCount > 0 ? onReviewInbox : undefined}
        />
        <ShutdownStep
          title="Reduce open loops"
          detail={
            openTasks > 0
              ? `${openTasks} task${openTasks === 1 ? '' : 's'} remain open. Switch to focus mode and close one more loop.`
              : 'Task board is clear enough for the day.'
          }
          actionLabel={openTasks > 0 ? 'Enter focus mode' : undefined}
          onAction={openTasks > 0 ? onFocus : undefined}
        />
        <ShutdownStep
          title="Fill one gap"
          detail={
            missingFieldCount > 0
              ? `${missingFieldCount} profile field${missingFieldCount === 1 ? '' : 's'} are still missing.`
              : 'Profile context is already in good shape.'
          }
          actionLabel={missingFieldCount > 0 ? 'Open Aura' : undefined}
          onAction={missingFieldCount > 0 ? onGuidedInterview : undefined}
        />
        <ShutdownStep
          title="Write the audit"
          detail={
            nextEventTitle
              ? `Capture the day and glance at ${nextEventTitle} before you stop.`
              : 'Capture the day and leave a clean handoff for tomorrow.'
          }
          actionLabel="Evening audit"
          onAction={onEveningAudit}
        />
      </div>
    </div>
  </div>
);

const ShutdownStep: React.FC<{
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, detail, actionLabel, onAction }) => (
  <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);
