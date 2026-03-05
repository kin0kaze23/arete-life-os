import React from 'react';
import { Category } from '@/data';
import { Activity, Wallet, Heart, Zap, User, ArrowRight } from 'lucide-react';

export interface DimensionConfig {
  category: Category;
  label: string;
  icon: React.ReactNode;
}

export const DIMENSIONS: DimensionConfig[] = [
  { category: Category.HEALTH, label: 'Health', icon: <Activity size={12} /> },
  { category: Category.FINANCE, label: 'Finance', icon: <Wallet size={12} /> },
  { category: Category.RELATIONSHIPS, label: 'Social', icon: <Heart size={12} /> },
  { category: Category.SPIRITUAL, label: 'Spirit', icon: <Zap size={12} /> },
  { category: Category.PERSONAL, label: 'Personal', icon: <User size={12} /> },
];

export function getScoreColor(score: number): string {
  if (score >= 81) return 'text-violet-400 bg-violet-500/10 border-violet-500/30';
  if (score >= 61) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (score >= 41) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
}

export function getStatusLabel(score: number): string {
  if (score >= 81) return 'Thriving';
  if (score >= 61) return 'Healthy';
  if (score >= 41) return 'At Risk';
  return 'Critical';
}

export function getDotColor(score: number): string {
  if (score >= 81) return 'bg-violet-400';
  if (score >= 61) return 'bg-emerald-400';
  if (score >= 41) return 'bg-amber-400';
  return 'bg-rose-400';
}

interface LifePulseBarProps {
  scores: Record<Category, number>;
  onViewDetails: () => void;
}

export const LifePulseBar: React.FC<LifePulseBarProps> = ({ scores, onViewDetails }) => {
  const categories = [
    Category.HEALTH,
    Category.FINANCE,
    Category.RELATIONSHIPS,
    Category.SPIRITUAL,
    Category.PERSONAL,
  ];

  const needsAttention = categories.filter((cat) => scores[cat] < 61);
  const focusDimension = needsAttention.length > 0 ? needsAttention[0] : null;

  const getFocusLabel = () => {
    if (!focusDimension) return null;
    const dim = DIMENSIONS.find((d) => d.category === focusDimension);
    if (scores[focusDimension] < 41) return `${dim?.label} needs urgent attention`;
    return `${dim?.label} needs attention this week`;
  };

  const focusLabel = getFocusLabel();

  return (
    <section className="rounded-[20px] border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {categories.map((category) => {
                const score = scores[category];
                const dim = DIMENSIONS.find((d) => d.category === category);
                const dotColor = getDotColor(score);
                
                return (
                  <div
                    key={category}
                    className="group relative flex flex-col items-center gap-1.5"
                    title={`${dim?.label}: ${score > 0 ? score : 'No data'} (${score > 0 ? getStatusLabel(score) : 'No data'})`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${dotColor} text-slate-950 transition-all hover:scale-110`}
                    >
                      {dim?.icon}
                    </div>
                    <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {dim?.label.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>

            {focusLabel && (
              <div className="ml-4 flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-500/[0.06] px-3 py-1.5">
                <span className="text-xs font-medium text-amber-200">{focusLabel}</span>
              </div>
            )}
          </div>

          {!focusLabel && (
            <p className="mt-3 text-xs text-emerald-300">
              All dimensions are healthy. Keep maintaining your rhythms.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          View Details
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
};
