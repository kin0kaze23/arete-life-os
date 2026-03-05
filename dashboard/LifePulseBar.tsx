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
    <section className="rounded-[16px] border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {categories.map((category) => {
            const score = scores[category];
            const dim = DIMENSIONS.find((d) => d.category === category);
            const dotColor = getDotColor(score);
            
            return (
              <div
                key={category}
                className="group relative flex flex-col items-center gap-1 cursor-pointer"
                title={`${dim?.label}: ${score > 0 ? score : 'No data'} (${score > 0 ? getStatusLabel(score) : 'No data'})`}
                onClick={onViewDetails}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${dotColor} text-slate-950 transition-all hover:scale-110`}
                >
                  {dim?.icon}
                </div>
              </div>
            );
          })}
          
          {focusLabel && (
            <div className="ml-2 hidden items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-500/[0.06] px-2.5 py-1 md:flex">
              <span className="text-[10px] font-medium text-amber-200">{focusLabel}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Details
        </button>
      </div>
    </section>
  );
};
