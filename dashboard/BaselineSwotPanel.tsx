import React from 'react';
import { Activity, Wallet, Heart, Zap, User, ArrowRight } from 'lucide-react';
import { BaselineSwotEntry, Category, UserProfile } from '@/data';

interface BaselineSwotPanelProps {
  baseline: BaselineSwotEntry[];
  profile: UserProfile;
  onInsertTemplate?: (template: string) => void;
}

const DIMENSIONS = [
  { category: Category.HEALTH, label: 'Health', icon: <Activity size={14} /> },
  { category: Category.FINANCE, label: 'Finance', icon: <Wallet size={14} /> },
  { category: Category.RELATIONSHIPS, label: 'Relationships', icon: <Heart size={14} /> },
  { category: Category.SPIRITUAL, label: 'Spiritual', icon: <Zap size={14} /> },
  { category: Category.PERSONAL, label: 'Personal', icon: <User size={14} /> },
];

const getEntry = (baseline: BaselineSwotEntry[], category: Category) =>
  baseline.find((entry) => entry.dimension === category);

const getItem = (items?: string[], fallback = 'Not enough data yet.') =>
  items && items.length > 0 ? items[0] : fallback;

export const BaselineSwotPanel: React.FC<BaselineSwotPanelProps> = ({
  baseline,
  profile,
  onInsertTemplate,
}) => {
  const hasBaseline = baseline.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Baseline SWOT
          </p>
          <p className="text-sm text-slate-300">
            Snapshot for {profile.identify.name || 'you'} — profile-based until you log more data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onInsertTemplate?.('DAILY_CHECKIN')}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-200 transition-all hover:bg-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Log check-in <ArrowRight size={12} />
        </button>
      </div>

      {!hasBaseline ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-400">
          Your baseline will appear after onboarding. Start with a quick check-in to unlock it.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {DIMENSIONS.map((dimension) => {
            const entry = getEntry(baseline, dimension.category);
            const confidence = entry?.confidence || 'profile';
            return (
              <div
                key={dimension.category}
                className="min-w-[240px] rounded-2xl border border-white/5 bg-slate-950 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-slate-400">{dimension.icon}</span>
                    <span className="text-sm font-semibold">{dimension.label}</span>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {confidence}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">S</span>
                    <span className="line-clamp-2">{getItem(entry?.strengths)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">W</span>
                    <span className="line-clamp-2">{getItem(entry?.weaknesses)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">O</span>
                    <span className="line-clamp-2">{getItem(entry?.opportunities)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">T</span>
                    <span className="line-clamp-2">{getItem(entry?.threats)}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-400">
                  Next: <span className="text-slate-200">{entry?.nextAction || 'Log a check-in.'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
