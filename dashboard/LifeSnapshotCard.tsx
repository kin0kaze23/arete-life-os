import React from 'react';
import { RefreshCw } from 'lucide-react';
import { CriticalPriority } from '@/data';

interface LifeSnapshotCardProps {
  narrative: string | null;
  priorities: CriticalPriority[];
  isExpanded: boolean;
  isLoading?: boolean;
  onToggleExpanded: () => void;
  onRefresh: () => void;
  onViewHistory?: () => void;
}

export const LifeSnapshotCard: React.FC<LifeSnapshotCardProps> = ({
  narrative,
  priorities,
  isExpanded,
  isLoading = false,
  onToggleExpanded,
  onRefresh,
  onViewHistory,
}) => {
  const emptyMessage =
    'Analyzing your profile to generate a personalized life snapshot. This takes a few seconds.';

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Life Snapshot
          </p>
          <p className="mt-1 text-sm text-slate-300">Narrative synthesis across all dimensions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-indigo-400/40"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-indigo-400/40"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 rounded bg-slate-700/40" />
            <div className="h-3 rounded bg-slate-700/30" />
            <div className="h-3 w-2/3 rounded bg-slate-700/40" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-200 text-pretty">{narrative || emptyMessage}</p>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Critical Priorities
          </p>
          {priorities.length === 0 && (
            <p className="text-xs text-slate-400">No critical priorities identified yet.</p>
          )}
          {priorities.slice(0, 3).map((priority) => (
            <div key={`${priority.dimension}-${priority.title}`} className="rounded-xl border border-white/8 bg-slate-900/60 p-3">
              <p className="text-xs font-semibold text-slate-100">
                {priority.dimension}: {priority.title}
              </p>
              <p className="mt-1 text-xs text-slate-300">{priority.rationale}</p>
              <p className="mt-1 text-xs text-rose-200/90">{priority.consequence}</p>
            </div>
          ))}
          <button
            type="button"
            onClick={onViewHistory}
            className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
          >
            View history
          </button>
        </div>
      )}
    </article>
  );
};

