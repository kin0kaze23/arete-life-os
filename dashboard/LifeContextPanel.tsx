import React from 'react';

interface LifeContextPanelProps {
  narrative?: string;
  profileGaps?: Array<{ id?: string; title?: string; description?: string }>;
  onDismissGap?: (id: string) => void;
  onRefreshAll?: () => void;
  [key: string]: any;
}

export const LifeContextPanel: React.FC<LifeContextPanelProps> = ({
  narrative,
  profileGaps = [],
  onDismissGap,
  onRefreshAll,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Life Context</p>
        <button
          type="button"
          onClick={onRefreshAll}
          className="rounded-lg border border-indigo-500/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-indigo-300"
        >
          Refresh
        </button>
      </div>
      <p className="text-sm text-slate-300">{narrative || 'No life context generated yet.'}</p>
      {profileGaps.length > 0 && (
        <div className="space-y-2">
          {profileGaps.map((gap) => (
            <div
              key={gap.id || gap.title}
              className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-xs font-bold text-white">{gap.title || 'Profile gap'}</p>
                <p className="text-xs text-slate-400">{gap.description || ''}</p>
              </div>
              {gap.id && onDismissGap && (
                <button
                  type="button"
                  onClick={() => onDismissGap(gap.id as string)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
