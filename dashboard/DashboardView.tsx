import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto pb-32 space-y-8">
      <DashboardHeader greeting={greeting} summary={headerSummary} />

      {/* Life Intelligence — always visible above the Decision Deck */}
      <SignalGrid
        memoryItems={memory}
        goals={goals}
        baseline={baselineSwot}
        insights={insights}
        blindSpots={blindSpots}
        recommendations={recommendations}
        onInsertTemplate={handleInsertTemplate}
      />

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

      {/* Execution Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
        <div>
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
        <div>
          <UpcomingCalendar
            events={timelineEvents}
            onSelectEvent={setActivePrepEvent}
            onEditEvent={setEditingEvent}
            onDeleteEvent={deleteTimelineEvent}
            maxEvents={3}
          />
        </div>
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
