import React, { useMemo, useState } from 'react';
import { getProfileCompletion } from '../shared/SharedUI';
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
  FinanceMetrics,
} from '../data/types';
import { DoWatchSection } from './DoWatchSection';
import { AlwaysPanels } from './AlwaysPanels';
import { DomainPanels } from './DomainPanels';
import { SystemStatusFooter } from './SystemStatusFooter';
import { corePillars } from './corePillars';
import { getCoverageScore } from './domainUtils';

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
  refreshAll,
  planMyDay,
  onNavigate,
  updateMemoryItem,
  deleteMemoryItem,
  isPlanningDay,
  isGeneratingTasks,
}) => {
  const [horizon, setHorizon] = useState<'now' | 'soon' | 'always'>('now');

  const completion = getProfileCompletion(profile);

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
      };
    });
  }, [memory]);

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
      (sum, pillar) =>
        sum + getCoverageScore(profile, memory, sources, pillar.id, pillar.categories).total,
      0
    );
    return Math.round(total / corePillars.length);
  }, [memory, profile, sources]);

  const showLowConfidence = overallConfidence < 55 || memory.length < 3;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32 px-4">
      <DoWatchSection
        horizon={horizon}
        setHorizon={setHorizon}
        doItems={doItems}
        watchItems={watchItems}
        isPlanningDay={isPlanningDay}
        isGeneratingTasks={isGeneratingTasks}
        planMyDay={planMyDay}
        refreshAll={refreshAll}
        onNavigate={onNavigate}
        needsReviewCount={needsReviewCount}
        showLowConfidence={showLowConfidence}
      />

      <AlwaysPanels
        alwaysDoChips={alwaysDoChips}
        alwaysWatchChips={alwaysWatchChips}
        habitItems={habitItems}
        onNavigate={onNavigate}
        updateMemoryItem={updateMemoryItem}
        deleteMemoryItem={deleteMemoryItem}
      />

      <DomainPanels
        memory={memory}
        tasks={tasks}
        recommendations={recommendations}
        sources={sources}
        profile={profile}
        financeMetrics={financeMetrics}
        hasFattyLiver={hasFattyLiver}
      />

      <SystemStatusFooter completion={completion.overall} />
    </div>
  );
};
