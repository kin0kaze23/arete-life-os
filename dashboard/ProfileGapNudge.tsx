import React, { useMemo } from 'react';
import { ProfileGap } from '@/data';

interface ProfileGapNudgeProps {
  profileGaps: ProfileGap[];
  dismissed: Record<string, number>;
  onDismiss: (key: string) => void;
  onOpenProfile?: () => void;
}

const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const ProfileGapNudge: React.FC<ProfileGapNudgeProps> = ({
  profileGaps,
  dismissed,
  onDismiss,
  onOpenProfile,
}) => {
  const visibleGaps = useMemo(() => {
    const now = Date.now();
    return profileGaps
      .filter((gap) => {
        const key = `${gap.dimension}:${gap.field}`;
        const dismissedAt = dismissed[key];
        return !dismissedAt || now - dismissedAt > DISMISS_WINDOW_MS;
      })
      .slice(0, 2);
  }, [dismissed, profileGaps]);

  if (visibleGaps.length === 0) return null;

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {visibleGaps.map((gap) => {
        const key = `${gap.dimension}:${gap.field}`;
        return (
          <article key={key} className="rounded-2xl border border-indigo-500/25 bg-indigo-500/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Profile Gap
            </p>
            <p className="mt-2 text-sm text-slate-200">{gap.prompt}</p>
            <p className="mt-2 text-xs text-slate-300">{gap.impactDescription}</p>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label={`Add details for ${gap.dimension} ${gap.field}`}
                className="text-xs font-semibold text-indigo-200 hover:text-white"
              >
                Add details {'->'}
              </button>
              <button
                type="button"
                onClick={() => onDismiss(key)}
                aria-label={`Dismiss ${gap.dimension} ${gap.field} gap`}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Dismiss
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
};
