import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Inbox, Sparkles } from 'lucide-react';
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
import { LifePulseBar } from './LifePulseBar';
import { LifeOverview } from '@/vault/LifeOverview';
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
  refreshAll?: (options?: { force?: boolean }) => Promise<void> | void;
  onAnswerGuidanceQuestion?: (id: string, answer: string) => void;
  onDismissGuidanceQuestion?: (id: string) => void;
  onSnoozeGuidanceQuestion?: (id: string, hours?: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory = [],
  tasks,
  dailyPlan,
  timelineEvents,
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
  alwaysDoChips = [],
  alwaysWatchChips = [],
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
  refreshAll,
  onAnswerGuidanceQuestion,
  onDismissGuidanceQuestion,
  onSnoozeGuidanceQuestion,
}) => {
  const [activePrepEvent, setActivePrepEvent] = useState<TimelineEvent | null>(null);
  const [showLifeOverview, setShowLifeOverview] = useState(false);
  const [reviewEntryId, setReviewEntryId] = useState<string | null>(null);
  const prevScoresRef = useRef<Record<string, number> | null>(null);
  const prevMemoryCountRef = useRef<number>(memory.length);

  const scores = useMemo(() => {
    const result: Partial<Record<Category, number>> = {};
    const categories = [
      Category.HEALTH,
      Category.FINANCE,
      Category.RELATIONSHIPS,
      Category.SPIRITUAL,
      Category.PERSONAL,
    ];
    categories.forEach((cat) => {
      result[cat] = computeScoreInternal(memory, goals, cat, Date.now());
    });
    return result as Record<Category, number>;
  }, [memory, goals]);

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
        .slice(0, 3),
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
    Array.isArray((entry.ai_result as any)?.items)
      ? ((entry.ai_result as any).items as any[]) || []
      : [];

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

  if (showLifeOverview) {
    return (
      <LifeOverviewWrapper
        memory={memory}
        goals={goals}
        recommendations={recommendations}
        onBack={() => setShowLifeOverview(false)}
        onLogSignal={(category) => {
          onNavigate('dashboard');
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('logbar:insert', {
                detail: { template: `DAILY_CHECKIN_${category.toUpperCase()}` },
              })
            );
          }, 100);
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1420px] space-y-3 pb-32 pt-3">
      {/* Merged Compact Header */}
      <header className="flex items-center justify-between gap-4 rounded-[16px] border border-white/8 bg-white/[0.02] p-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{greeting}</h1>
          <p className="text-sm text-slate-400">{headerSummary}</p>
        </div>
        <LifePulseBar scores={scores} onViewDetails={() => setShowLifeOverview(true)} />
      </header>

      {/* TWO-COLUMN LAYOUT - Main Content + Sidebar */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Left: Do & Watch (2/3 width) */}
        <section className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Today
              </p>
              <h2 className="text-lg font-semibold text-slate-100">Do &amp; Watch</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-slate-400">
              {openTasks} open
            </span>
          </div>

          {/* Note: Log entries via Stream tab, Aura via Chat tab */}

          {memory.length === 0 && (
            <div className="mt-2 rounded-[12px] border border-dashed border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
              Start with check-in, expense, or event. Board useful after few signals.
            </div>
          )}

          <div className="mt-3 max-h-[500px] overflow-y-auto pr-1 premium-scrollbar xl:max-h-[550px]">
            <FocusList
              tasks={focusTasks}
              habitItems={habitItems}
              onToggleTask={toggleTask}
              onToggleHabit={(id) => updateMemoryItem?.(id, { timestamp: Date.now() })}
              onDeleteTask={deleteTask}
              onRefreshPlan={planMyDay}
              onRefreshQueue={planMyDay}
              isPlanning={isPlanningDay}
              events={timelineEvents}
            />
          </div>
        </section>

        {/* Right: Sidebar (1/3 width) - Stacked */}
        <aside className="space-y-2.5">
          {/* Upcoming Events */}
          <section className="rounded-[16px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,22,31,0.95),rgba(10,14,21,0.92))] p-3">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-blue-200" />
              <p className="text-sm font-semibold text-slate-100">Upcoming</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {upcomingEvents.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-white/10 bg-black/20 px-2.5 py-2 text-center text-xs text-slate-500">
                  Nothing scheduled
                </div>
              ) : (
                upcomingEvents.slice(0, 3).map((event) => {
                  const date = new Date(event.date);
                  const prepStatus = event.metadata?.prepStatus === 'ready' ? 'Ready' : 'Prep';
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setActivePrepEvent(event)}
                      className="flex w-full items-center justify-between gap-2 rounded-[12px] border border-white/8 bg-black/20 px-2.5 py-2 text-left transition-all duration-150 hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{event.title}</p>
                        <p className="mt-0.5 text-[9px] text-slate-400">
                          {date.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-blue-300/20 bg-blue-500/[0.08] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-blue-200">
                        {prepStatus}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Inbox - Compact Preview */}
          <section className="rounded-[16px] border border-white/8 bg-black/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Inbox size={12} className="text-emerald-200" />
                <p className="text-sm font-semibold text-slate-100">Inbox</p>
              </div>
              {inboxEntries.length > 0 && (
                <span className="rounded-full border border-amber-300/20 bg-amber-500/[0.08] px-1.5 py-0.5 text-[9px] font-semibold text-amber-200">
                  {inboxEntries.length}
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1.5">
              {inboxEntries.length === 0 ? (
                <div className="rounded-[12px] border border-dashed border-white/10 bg-black/20 px-2.5 py-2 text-center text-xs text-slate-500">
                  Inbox clear
                </div>
              ) : (
                <>
                  {inboxEntries.slice(0, 2).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setReviewEntryId(entry.id)}
                      className="w-full rounded-[12px] border border-white/8 bg-white/[0.03] px-2.5 py-2 text-left text-xs text-slate-200 transition-all duration-150 hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98]"
                    >
                      <p className="line-clamp-2 text-[10px] leading-tight">
                        {(entry.raw_content || '').slice(0, 60) || 'Inbox entry'}
                      </p>
                    </button>
                  ))}
                  {inboxEntries.length > 0 && canMergeInbox && (
                    <button
                      type="button"
                      onClick={() => onMergeInbox?.()}
                      className="mt-1 w-full rounded-full bg-emerald-400 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition-all duration-150 hover:bg-emerald-300 active:scale-[0.98]"
                    >
                      Merge all
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Always-Do Chips */}
          {alwaysDoChips.length > 0 && (
            <section className="rounded-[16px] border border-emerald-300/18 bg-emerald-500/[0.06] p-2.5">
              <div className="flex items-center gap-1.5 text-emerald-200">
                <Sparkles size={10} />
                <p className="text-xs font-semibold">Always-Do</p>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {alwaysDoChips.slice(0, 4).map((chip) => (
                  <span
                    key={chip.id}
                    className="rounded-full border border-emerald-300/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[9px] font-medium text-emerald-200"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Always-Watch Chips */}
          {alwaysWatchChips.length > 0 && (
            <section className="rounded-[16px] border border-amber-300/18 bg-amber-500/[0.06] p-2.5">
              <div className="flex items-center gap-1.5 text-amber-200">
                <Sparkles size={10} />
                <p className="text-xs font-semibold">Always-Watch</p>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {alwaysWatchChips.slice(0, 4).map((chip) => (
                  <span
                    key={chip.id}
                    className="rounded-full border border-amber-300/20 bg-amber-500/[0.08] px-2 py-0.5 text-[9px] font-medium text-amber-200"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

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
          confidence={
            (reviewEntry.ai_result as any)?.confidence ||
            Array.isArray((reviewEntry.ai_result as any)?.items)
              ? ((reviewEntry.ai_result as any).items as any[]).reduce(
                  (sum, item) => sum + (item?.confidence || 0.6),
                  0
                ) / ((reviewEntry.ai_result as any).items as any[]).length
              : 0.6
          }
          onClose={() => setReviewEntryId(null)}
          onMerge={async () => {
            await onMergeInbox?.([reviewEntry.id]);
            setReviewEntryId(null);
            onToast?.('Inbox entry merged', 'success');
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
  onClose: () => void;
  onMerge: () => Promise<void> | void;
}> = ({ entry, confidence, onClose, onMerge }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#05070d]/72 p-6 backdrop-blur-sm">
    <div className="w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#0f1722] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
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

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
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

          {Array.isArray((entry.ai_result as any)?.items) &&
            (entry.ai_result as any).items.length > 0 && (
              <div className="mt-4 space-y-3">
                {(entry.ai_result as any).items.slice(0, 4).map((item: any, index: number) => (
                  <div
                    key={`${item?.title || 'item'}-${index}`}
                    className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
                  >
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
        </section>
      </div>
    </div>
  </div>
);

const LifeOverviewWrapper: React.FC<{
  memory: MemoryEntry[];
  goals: Goal[];
  recommendations: Recommendation[];
  onBack: () => void;
  onLogSignal: (category: Category) => void;
}> = ({ memory, goals, recommendations, onBack, onLogSignal }) => {
  return (
    <LifeOverview
      memoryItems={memory}
      goals={goals}
      recommendations={recommendations}
      onBack={onBack}
      onLogSignal={onLogSignal}
    />
  );
};
