import React, { useMemo } from 'react';
import { ArrowUpRight, ShieldAlert, Zap, Clock3, CalendarClock, Sparkles } from 'lucide-react';
import { BlindSpot, Category, Goal, MemoryEntry, Recommendation, TimelineEvent, UserProfile } from '@/data';
import { computeTrend, DIMENSIONS } from './ScoreStrip';

interface AdvanceProtectPanelProps {
  profile: UserProfile;
  memoryItems: MemoryEntry[];
  goals: Goal[];
  recommendations: Recommendation[];
  blindSpots: BlindSpot[];
  timelineEvents: TimelineEvent[];
  onActivateRecommendation?: (rec: Recommendation) => void;
  onOpenEvent?: (event: TimelineEvent) => void;
  onPlanDay?: () => void;
  onInsertTemplate?: (template: string) => void;
}

interface LaneItem {
  id: string;
  lane: 'advance' | 'protect';
  title: string;
  reason: string;
  meta: string;
  cta: string;
  onAction?: () => void;
}

const TEMPLATE_BY_CATEGORY: Record<Category, string> = {
  [Category.HEALTH]: 'HEALTH_SYMPTOM',
  [Category.FINANCE]: 'EXPENSE_LOG',
  [Category.RELATIONSHIPS]: 'RELATIONSHIP_TOUCHPOINT',
  [Category.SPIRITUAL]: 'DAILY_CHECKIN',
  [Category.PERSONAL]: 'WORK_PROGRESS',
  [Category.WORK]: 'WORK_PROGRESS',
  [Category.SOCIAL]: 'RELATIONSHIP_TOUCHPOINT',
  [Category.MEALS]: 'DAILY_CHECKIN',
  [Category.TRAVEL]: 'SCHEDULE_EVENT',
  [Category.HABIT]: 'DAILY_CHECKIN',
  [Category.GENERAL]: 'DAILY_CHECKIN',
};

const cleanLine = (value: string | undefined, fallback: string): string => {
  if (!value || value.trim().length === 0) return fallback;
  return value.trim().replace(/\s+/g, ' ').slice(0, 160);
};

const getDaysUntil = (date: string): number => {
  const now = Date.now();
  const target = new Date(date).getTime();
  return Math.max(0, Math.ceil((target - now) / (24 * 60 * 60 * 1000)));
};

export const AdvanceProtectPanel: React.FC<AdvanceProtectPanelProps> = ({
  profile,
  memoryItems,
  goals,
  recommendations,
  blindSpots,
  timelineEvents,
  onActivateRecommendation,
  onOpenEvent,
  onPlanDay,
  onInsertTemplate,
}) => {
  const { advanceItems, protectItems } = useMemo(() => {
    const advance: LaneItem[] = [];
    const protect: LaneItem[] = [];

    const activeRecommendations = recommendations
      .filter((rec) => rec.status === 'ACTIVE')
      .sort((a, b) => b.impactScore - a.impactScore);

    activeRecommendations.slice(0, 2).forEach((rec) => {
      advance.push({
        id: `advance-rec-${rec.id}`,
        lane: 'advance',
        title: rec.title,
        reason: cleanLine(rec.description || rec.rationale, 'High-impact recommendation for today.'),
        meta: `${rec.estimatedTime || 'Flexible'} · impact ${rec.impactScore}/10`,
        cta: 'Start',
        onAction: () => onActivateRecommendation?.(rec),
      });
    });

    const activeGoals = goals
      .filter((goal) => goal.status === 'active')
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    const priorityGoal = activeGoals[0];
    if (priorityGoal) {
      const days = getDaysUntil(priorityGoal.targetDate);
      advance.push({
        id: `advance-goal-${priorityGoal.id}`,
        lane: 'advance',
        title: priorityGoal.title,
        reason: `Keep momentum on your key goal before the target window closes.`,
        meta: `Due in ${days}d · progress ${priorityGoal.progress}%`,
        cta: 'Plan',
        onAction: () => onPlanDay?.(),
      });
    }

    const now = Date.now();
    const pendingEvents = timelineEvents
      .filter(
        (event) =>
          new Date(event.date).getTime() > now && event.metadata?.prepStatus !== 'ready'
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const nextPendingEvent = pendingEvents[0];
    if (nextPendingEvent) {
      const hoursUntil = Math.max(
        1,
        Math.round((new Date(nextPendingEvent.date).getTime() - now) / (60 * 60 * 1000))
      );
      advance.push({
        id: `advance-event-${nextPendingEvent.id}`,
        lane: 'advance',
        title: `Prep: ${nextPendingEvent.title}`,
        reason: `Prepared events reduce friction and preserve execution quality.`,
        meta: `Starts in ${hoursUntil}h`,
        cta: 'Prep',
        onAction: () => onOpenEvent?.(nextPendingEvent),
      });
    }

    const riskBlindSpots = blindSpots
      .filter((spot) => spot.severity === 'high' || spot.severity === 'med')
      .sort((a, b) => {
        const severityWeight = (severity: BlindSpot['severity']) =>
          severity === 'high' ? 2 : severity === 'med' ? 1 : 0;
        return severityWeight(b.severity) - severityWeight(a.severity);
      });

    riskBlindSpots.slice(0, 2).forEach((spot) => {
      protect.push({
        id: `protect-spot-${spot.id}`,
        lane: 'protect',
        title: spot.signal,
        reason: cleanLine(spot.why, 'Potential drift detected in your recent signals.'),
        meta: `Risk ${spot.severity.toUpperCase()}`,
        cta: 'Stabilize',
        onAction: () => onInsertTemplate?.('DAILY_CHECKIN'),
      });
    });

    DIMENSIONS.forEach((dimension) => {
      if (computeTrend(memoryItems, goals, dimension.category) === 'down') {
        protect.push({
          id: `protect-trend-${dimension.category}`,
          lane: 'protect',
          title: `${dimension.label} is trending down`,
          reason: `Recent signals show declining momentum. Add one targeted log to prevent further drift.`,
          meta: 'Trend alert',
          cta: 'Log',
          onAction: () => onInsertTemplate?.(TEMPLATE_BY_CATEGORY[dimension.category]),
        });
      }
    });

    const urgentEvent = pendingEvents.find((event) => {
      const hours = (new Date(event.date).getTime() - now) / (60 * 60 * 1000);
      return hours <= 24;
    });

    if (urgentEvent) {
      const hoursUntil = Math.max(
        1,
        Math.round((new Date(urgentEvent.date).getTime() - now) / (60 * 60 * 1000))
      );
      protect.push({
        id: `protect-event-${urgentEvent.id}`,
        lane: 'protect',
        title: `Unprepared event: ${urgentEvent.title}`,
        reason: `Without prep, this event can fragment your day and reduce execution quality.`,
        meta: `Starts in ${hoursUntil}h`,
        cta: 'Prep now',
        onAction: () => onOpenEvent?.(urgentEvent),
      });
    }

    return {
      advanceItems: advance.slice(0, 3),
      protectItems: protect.slice(0, 3),
    };
  }, [
    recommendations,
    goals,
    timelineEvents,
    blindSpots,
    memoryItems,
    onActivateRecommendation,
    onOpenEvent,
    onPlanDay,
    onInsertTemplate,
  ]);

  const firstName = profile.identify?.name?.trim().split(/\s+/)[0] || 'You';
  const thesis = useMemo(() => {
    if (advanceItems[0] && protectItems[0]) {
      return `${firstName}, advance with "${advanceItems[0].title}" and protect against "${protectItems[0].title}".`;
    }
    if (advanceItems[0]) return `${firstName}, your best move right now is "${advanceItems[0].title}".`;
    if (protectItems[0]) return `${firstName}, stabilize by addressing "${protectItems[0].title}".`;
    return `${firstName}, log one meaningful check-in to generate your personalized priorities.`;
  }, [advanceItems, protectItems, firstName]);

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#0B0F1A] to-slate-950 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Decision Deck
          </p>
          <h2 className="text-lg md:text-xl font-semibold text-white text-balance">
            {thesis}
          </h2>
          <p className="text-sm text-slate-400 text-pretty">
            One lane to move forward. One lane to avoid drift.
          </p>
        </div>
        <button
          type="button"
          onClick={onPlanDay}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100 hover:bg-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Sparkles size={14} />
          Plan My Day
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 text-emerald-200">
            <ArrowUpRight size={14} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Advance</p>
          </div>
          <div className="space-y-3">
            {advanceItems.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-slate-400">
                No high-priority advance moves yet. Log a check-in to generate them.
              </p>
            )}
            {advanceItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-[#0B1118] p-3">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.reason}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock3 size={12} />
                    {item.meta}
                  </p>
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100 hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {item.cta}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-200">
            <ShieldAlert size={14} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Protect</p>
          </div>
          <div className="space-y-3">
            {protectItems.length === 0 && (
              <p className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-slate-400">
                No urgent risks detected. Maintain momentum with one quality log.
              </p>
            )}
            {protectItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-[#110F0A] p-3">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.reason}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                    <CalendarClock size={12} />
                    {item.meta}
                  </p>
                  <button
                    type="button"
                    onClick={item.onAction}
                    className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100 hover:bg-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    {item.cta}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-slate-400">
        <Zap size={12} className="text-indigo-300" />
        Showing the top 3 actions per lane for clarity.
      </div>
    </section>
  );
};
