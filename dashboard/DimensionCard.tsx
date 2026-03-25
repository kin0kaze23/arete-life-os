import React from 'react';
import {
  Activity,
  Heart,
  RefreshCw,
  Sparkles,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { Category, DimensionContextSnapshot, LifeDimension } from '@/data';

type DimensionCardState = 'NO_DATA' | 'BASELINE' | 'STALE' | 'LOADING' | 'FRESH' | 'ERROR';

interface DimensionCardProps {
  dimension: LifeDimension;
  snapshot: DimensionContextSnapshot;
  selected?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onSelect?: (dimension: LifeDimension) => void;
  onRefresh?: (dimension: LifeDimension) => void;
  onInsertTemplate?: (template: string) => void;
}

const CARD_META: Record<
  LifeDimension,
  {
    label: string;
    icon: React.ReactNode;
    accentClass: string;
    borderClass: string;
    scoreClass: string;
    template: string;
  }
> = {
  [Category.HEALTH]: {
    label: 'Health',
    icon: <Activity size={16} />,
    accentClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/30',
    scoreClass: 'text-emerald-400',
    template: 'HEALTH_SYMPTOM',
  },
  [Category.FINANCE]: {
    label: 'Finance',
    icon: <Wallet size={16} />,
    accentClass: 'text-amber-300',
    borderClass: 'border-amber-500/30',
    scoreClass: 'text-amber-400',
    template: 'EXPENSE_LOG',
  },
  [Category.RELATIONSHIPS]: {
    label: 'Relationships',
    icon: <Heart size={16} />,
    accentClass: 'text-rose-300',
    borderClass: 'border-rose-500/30',
    scoreClass: 'text-rose-400',
    template: 'RELATIONSHIP_TOUCHPOINT',
  },
  [Category.SPIRITUAL]: {
    label: 'Spiritual',
    icon: <Zap size={16} />,
    accentClass: 'text-violet-300',
    borderClass: 'border-violet-500/30',
    scoreClass: 'text-violet-400',
    template: 'DAILY_CHECKIN',
  },
  [Category.PERSONAL]: {
    label: 'Personal',
    icon: <User size={16} />,
    accentClass: 'text-sky-300',
    borderClass: 'border-sky-500/30',
    scoreClass: 'text-sky-400',
    template: 'WORK_PROGRESS',
  },
};

const STATUS_STYLES: Record<string, string> = {
  thriving: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  stable: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  needs_attention: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  critical: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
  no_signal: 'bg-slate-700/30 text-slate-400 border-slate-500/30',
};

type SwotKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

const normalizeSwotItems = (value: unknown, fallback: string): string[] => {
  if (!Array.isArray(value)) return [fallback];
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 2);
  return cleaned.length > 0 ? cleaned : [fallback];
};

const getSnapshotSwot = (snapshot: DimensionContextSnapshot): Record<SwotKey, string[]> => {
  const swot = snapshot.swot;
  const defaultThreat =
    typeof snapshot.projection === 'string' && snapshot.projection.trim().length > 0
      ? snapshot.projection
      : snapshot.status === 'critical'
        ? 'Current trajectory may worsen if no corrective action is taken.'
        : 'Refresh to assess current risk trajectory.';
  return {
    strengths: normalizeSwotItems(swot?.strengths, snapshot.insight),
    weaknesses: normalizeSwotItems(
      swot?.weaknesses,
      snapshot.gap || 'Key data points needed for a precise assessment.'
    ),
    opportunities: normalizeSwotItems(swot?.opportunities, snapshot.nextStep),
    threats: normalizeSwotItems(swot?.threats, defaultThreat),
  };
};

const toCardState = (
  snapshot: DimensionContextSnapshot,
  isLoading?: boolean,
  error?: string | null
): DimensionCardState => {
  if (isLoading) return 'LOADING';
  if (error) return 'ERROR';
  if (snapshot.fidelityLevel === 0 || snapshot.status === 'no_signal') return 'NO_DATA';
  if (snapshot.fidelityLevel === 1) return 'BASELINE';
  const ageMs = Date.now() - new Date(snapshot.generatedAt).getTime();
  if (Number.isFinite(ageMs) && ageMs > 7 * 24 * 60 * 60 * 1000) return 'STALE';
  return 'FRESH';
};

const SWOT_CONFIG: Array<[SwotKey, string, string]> = [
  ['strengths', 'S', 'text-emerald-400'],
  ['weaknesses', 'W', 'text-rose-400'],
  ['opportunities', 'O', 'text-sky-400'],
  ['threats', 'T', 'text-amber-400'],
];

export const DimensionCard: React.FC<DimensionCardProps> = ({
  dimension,
  snapshot,
  selected = false,
  isLoading = false,
  error = null,
  onSelect,
  onRefresh,
  onInsertTemplate,
}) => {
  const meta = CARD_META[dimension];
  const cardState = toCardState(snapshot, isLoading, error);
  const swot = getSnapshotSwot(snapshot);
  const deltaLabel = snapshot.delta > 0 ? `+${snapshot.delta}` : `${snapshot.delta}`;

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-slate-950/80 p-4 transition-all ${
        selected ? `${meta.borderClass} shadow-[0_0_0_1px_rgba(99,102,241,.35)]` : 'border-white/10'
      }`}
    >
      {cardState === 'LOADING' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl border border-indigo-400/20">
          <div className="h-full w-full animate-pulse bg-indigo-500/5" />
        </div>
      )}

      <button
        type="button"
        onClick={() => onSelect?.(dimension)}
        className="flex w-full flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-xl"
      >
        {/* Header: icon + label + score + delta */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${meta.accentClass}`}>
            {meta.icon}
            <span className="text-sm font-semibold text-slate-100">{meta.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold tabular-nums ${meta.scoreClass}`}>
              {snapshot.score}
            </span>
            {snapshot.delta !== 0 && (
              <span
                className={`text-xs font-semibold ${snapshot.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                {deltaLabel}
              </span>
            )}
          </div>
        </div>

        {/* Insight: full width, natural text */}
        <p className="mt-2.5 text-xs leading-relaxed text-slate-300 line-clamp-2 text-pretty">
          {snapshot.insight}
        </p>

        {/* SWOT: compact 2x2 grid with letter labels */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {SWOT_CONFIG.map(([key, letter, accent]) => (
            <div key={key} className="flex items-start gap-1.5 min-w-0">
              <span className={`text-xs font-bold ${accent} shrink-0 leading-4`}>{letter}</span>
              <span className="text-xs leading-4 text-slate-300 line-clamp-2">
                {swot[key][0]}
              </span>
            </div>
          ))}
        </div>
      </button>

      {/* Footer: status badge + action buttons */}
      <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/5">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] ${STATUS_STYLES[snapshot.status] || STATUS_STYLES.stable}`}
        >
          {snapshot.status.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onInsertTemplate?.(meta.template)}
            className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 hover:border-indigo-400/40 hover:text-white transition-colors"
          >
            Log
          </button>
          <button
            type="button"
            onClick={() => onRefresh?.(dimension)}
            aria-label={`Refresh ${dimension} analysis`}
            className="inline-flex items-center justify-center rounded-full border border-white/15 p-1 text-slate-300 hover:border-indigo-400/40 hover:text-white transition-colors"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {cardState === 'ERROR' && (
        <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300">
          {error || 'Unable to refresh this dimension right now.'}
        </div>
      )}

      {selected && (
        <div className="absolute right-3 top-3 text-indigo-300" aria-hidden>
          <Sparkles size={14} />
        </div>
      )}
    </article>
  );
};
