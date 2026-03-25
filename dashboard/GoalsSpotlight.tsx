import React from 'react';
import { Goal, Recommendation } from '@/data';
import { Target, Sparkles, ThumbsDown, ThumbsUp, Play, ChevronDown } from 'lucide-react';

interface GoalsSpotlightProps {
  goals: Goal[];
  recommendations: Recommendation[];
  onKeepRecommendation?: (id: string) => void;
  onRemoveRecommendation?: (id: string) => void;
  onActivate?: (rec: Recommendation) => void;
}

export const GoalsSpotlight: React.FC<GoalsSpotlightProps> = ({
  goals,
  recommendations,
  onKeepRecommendation,
  onRemoveRecommendation,
  onActivate,
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const activeGoals = goals
    .filter((goal) => goal.status === 'active')
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  const topGoal = activeGoals[0];

  const activeRecs = recommendations.filter((rec) => rec.status === 'ACTIVE');
  const topRec = [...activeRecs].sort((a, b) => b.impactScore - a.impactScore)[0];
  const isExpanded = topRec ? expandedId === topRec.id : false;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-indigo-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Top Goal
          </span>
        </div>
        {topGoal ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">{topGoal.title}</p>
              <p className="text-xs text-slate-400">
                Target: {new Date(topGoal.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-slate-900/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${Math.min(100, topGoal.progress)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">Progress: {topGoal.progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4 gap-2">
            <Target size={20} className="text-slate-700" />
            <p className="text-sm text-slate-400 text-pretty">
              Set your first goal to make progress visible.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Top Recommendation
          </span>
        </div>
        {topRec ? (
          <div
            data-testid="rec-card"
            data-rec-id={topRec.id}
            className="space-y-3 rounded-xl border border-white/10 bg-white/[0.01] p-3"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : topRec.id)}
              className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{topRec.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{topRec.description}</p>
                </div>
                <ChevronDown
                  size={14}
                  className={`mt-1 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-3 border-t border-white/10 pt-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Rationale
                  </span>
                  <p className="text-xs text-slate-300">{topRec.rationale || 'No rationale provided.'}</p>
                </div>
                {topRec.steps && topRec.steps.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Action Plan
                    </span>
                    <ul className="space-y-1">
                      {topRec.steps.slice(0, 4).map((step, index) => (
                        <li key={index} className="text-[11px] text-slate-300">
                          {index + 1}. {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate?.(topRec);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Play size={12} fill="currentColor" /> Execute plan
              </button>
              <button
                data-testid="rec-keep"
                onClick={(e) => {
                  e.stopPropagation();
                  onKeepRecommendation?.(topRec.id);
                }}
                disabled={topRec.userFeedback === 'kept'}
                className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Keep recommendation"
              >
                <ThumbsUp size={16} />
              </button>
              <button
                data-testid="rec-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveRecommendation?.(topRec.id);
                }}
                className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                aria-label="Dismiss recommendation"
              >
                <ThumbsDown size={16} />
              </button>
              {topRec.userFeedback === 'kept' && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Kept
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            No recommendations yet. Log a check-in to unlock premium guidance.
          </div>
        )}
      </div>
    </section>
  );
};
