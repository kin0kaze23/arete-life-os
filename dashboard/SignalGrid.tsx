import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Wallet, Heart, Zap, User } from 'lucide-react';
import {
  BaselineSwotEntry,
  BlindSpot,
  Category,
  Goal,
  MemoryItem,
  ProactiveInsight,
  Recommendation,
} from '@/data';
import { computeScoreInternal, computeTrend, getTrendSymbol } from './ScoreStrip';

interface SignalGridProps {
  memoryItems: MemoryItem[];
  goals: Goal[];
  baseline: BaselineSwotEntry[];
  insights: ProactiveInsight[];
  blindSpots: BlindSpot[];
  recommendations: Recommendation[];
  onInsertTemplate?: (template: string) => void;
}

const DIMENSIONS = [
  { category: Category.HEALTH, label: 'Health', icon: <Activity size={16} /> },
  { category: Category.FINANCE, label: 'Finance', icon: <Wallet size={16} /> },
  { category: Category.RELATIONSHIPS, label: 'Relationships', icon: <Heart size={16} /> },
  { category: Category.SPIRITUAL, label: 'Spiritual', icon: <Zap size={16} /> },
  { category: Category.PERSONAL, label: 'Personal', icon: <User size={16} /> },
];

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

const getDeltaColor = (delta: number) => {
  if (delta >= 3) return 'text-emerald-400';
  if (delta <= -3) return 'text-rose-400';
  return 'text-slate-400';
};

const getBaselineEntry = (baseline: BaselineSwotEntry[], category: Category) =>
  baseline.find((entry) => entry.dimension === category);

const FIRST_STEP_BY_CATEGORY: Record<Category, string> = {
  [Category.HEALTH]: 'Log a workout, sleep hours, or how your body feels today.',
  [Category.FINANCE]: 'Log an expense, your current income, or a financial goal.',
  [Category.RELATIONSHIPS]: 'Log a conversation, a connection you made, or how someone made you feel.',
  [Category.SPIRITUAL]: 'Log a reflection, a practice, or what gave you meaning today.',
  [Category.PERSONAL]: 'Log work progress, a skill you practised, or a personal win.',
  [Category.WORK]: 'Log what you moved forward and any blockers you hit.',
  [Category.SOCIAL]: 'Log a social interaction or a community moment.',
  [Category.MEALS]: 'Log what you ate and how it made you feel.',
  [Category.TRAVEL]: 'Log a trip, location, or travel experience.',
  [Category.HABIT]: 'Log a habit you completed or are working on.',
  [Category.GENERAL]: 'Log anything on your mind — Areté will categorise it.',
};

const getInsightLine = (
  category: Category,
  insights: ProactiveInsight[],
  blindSpots: BlindSpot[],
  baseline?: BaselineSwotEntry,
  hasData?: boolean
) => {
  const insight = insights.find((item) => item.category === category);
  if (insight) return insight.description || insight.title;
  const risk = blindSpots.find((item) => item.severity === 'high');
  if (risk && category === Category.PERSONAL) return `Risk: ${risk.signal}`;
  if (baseline?.strengths?.length) return `Strength: ${baseline.strengths[0]}`;
  if (baseline?.weaknesses?.length) return `Watch: ${baseline.weaknesses[0]}`;
  if (!hasData) return FIRST_STEP_BY_CATEGORY[category] ?? 'Log a check-in to personalise this signal.';
  return 'Log a check-in to personalise this signal.';
};

const getNextAction = (
  category: Category,
  baseline?: BaselineSwotEntry,
  recommendations?: Recommendation[]
) => {
  const rec = recommendations?.find((item) => item.category === category);
  if (rec) return rec.title;
  if (baseline?.nextAction) return baseline.nextAction;
  return 'Log a check-in.';
};

export const SignalGrid: React.FC<SignalGridProps> = ({
  memoryItems,
  goals,
  baseline,
  insights,
  blindSpots,
  recommendations,
  onInsertTemplate,
}) => {
  const [highlighted, setHighlighted] = useState<Set<Category>>(new Set());
  const prevCountRef = useRef(memoryItems.length);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    if (memoryItems.length > prevCount) {
      const added = memoryItems.slice(0, memoryItems.length - prevCount);
      const next = new Set<Category>(added.map((item) => item.category));
      setHighlighted(next);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setHighlighted(new Set()), 3500);
    }
    prevCountRef.current = memoryItems.length;
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [memoryItems]);

  const rows = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return DIMENSIONS.map((dimension) => {
      const score = computeScoreInternal(memoryItems, goals, dimension.category, now);
      const lastWeek = computeScoreInternal(memoryItems, goals, dimension.category, weekAgo);
      const delta = score - lastWeek;
      const trend = computeTrend(memoryItems, goals, dimension.category);
      const baselineEntry = getBaselineEntry(baseline, dimension.category);
      const hasData = score > 0;
      return {
        ...dimension,
        score,
        delta,
        trend,
        baselineEntry,
        hasData,
        insight: getInsightLine(dimension.category, insights, blindSpots, baselineEntry, hasData),
        nextAction: getNextAction(dimension.category, baselineEntry, recommendations),
      };
    });
  }, [memoryItems, goals, baseline, insights, blindSpots, recommendations]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Life Signals
          </p>
          <p className="text-sm text-slate-300">
            One card per dimension. Clear signal. Clear next step.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {rows.map((row) => {
          const highlight = highlighted.has(row.category);
          return (
            <div
              key={row.category}
              className={`min-h-[206px] rounded-2xl border p-4 transition-all ${
                highlight
                  ? 'border-blue-300/40 bg-blue-500/14 shadow-[0_0_20px_rgba(59,130,246,0.22)]'
                  : row.hasData
                    ? 'border-white/10 bg-white/[0.03] hover:border-blue-300/30'
                    : 'border-dashed border-white/10 bg-white/[0.015] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200">
                  <span className={row.hasData ? 'text-slate-400' : 'text-slate-600'}>{row.icon}</span>
                  <span className={`text-sm font-semibold ${row.hasData ? '' : 'text-slate-500'}`}>{row.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`text-sm font-mono font-bold ${row.hasData ? 'text-white' : 'text-slate-700'}`}>
                    {row.score > 0 ? `${row.score}%` : '--'}
                  </span>
                  <span className={`text-[11px] font-bold ${getDeltaColor(row.delta)}`}>
                    {row.score > 0
                      ? `${getTrendSymbol(row.trend)} ${row.delta >= 0 ? '+' : ''}${row.delta}`
                      : ''}
                  </span>
                </div>
              </div>

              <p className={`mt-3 text-[13px] line-clamp-2 ${row.hasData ? 'text-slate-300' : 'text-slate-500'}`}>
                {row.insight}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3">
                {row.hasData ? (
                  <div className="text-[12px] text-slate-400 line-clamp-1">
                    Next: <span className="text-slate-200">{row.nextAction}</span>
                  </div>
                ) : (
                  <div className="text-[12px] text-slate-600">No data yet</div>
                )}
                <button
                  type="button"
                  onClick={() => onInsertTemplate?.(TEMPLATE_BY_CATEGORY[row.category])}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-slate-200 transition-all hover:border-blue-300/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  {row.hasData ? 'Log' : 'Start'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
