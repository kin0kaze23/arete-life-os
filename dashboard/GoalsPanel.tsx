import React, { useEffect, useState } from 'react';
import { Goal, Recommendation, Category } from '@/data';
import { Collapsible } from '@/shared/Collapsible';
import { Target, Lightbulb, ThumbsUp, ThumbsDown, Play, ArrowRight, Zap } from 'lucide-react';

export interface GoalsPanelProps {
  goals: Goal[];
  recommendations: Recommendation[];
  onKeepRecommendation?: (id: string) => void;
  onRemoveRecommendation?: (id: string) => void;
  onActivate?: (rec: Recommendation) => void;
}

// Helper for category colors (Plan Phase 7)
const getCategoryColor = (cat: Category) => {
  switch (cat) {
    case Category.HEALTH:
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case Category.FINANCE:
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case Category.RELATIONSHIPS:
      return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    case Category.SPIRITUAL:
      return 'text-violet-400 border-violet-500/30 bg-violet-500/10';
    case Category.PERSONAL:
      return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    default:
      return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  }
};

const getCategoryLabel = (cat: Category) => {
  // Simple mapping or just use the enum value if it's readable
  return cat;
};

export const GoalsPanel: React.FC<GoalsPanelProps> = ({
  goals,
  recommendations,
  onKeepRecommendation,
  onRemoveRecommendation,
  onActivate,
}) => {
  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  const activeRecs = recommendations.filter(
    (r) => r.status === 'ACTIVE' && r.userFeedback !== 'kept' && r.userFeedback !== 'removed'
  );

  const hasGoals = activeGoals.length > 0;
  const hasRecs = activeRecs.length > 0;

  // Progress Bar Component with Animation
  const ProgressBar = ({ progress }: { progress: number }) => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
      // Small delay to ensure transition triggers
      const timer = setTimeout(() => setWidth(progress), 100);
      return () => clearTimeout(timer);
    }, [progress]);

    return (
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    );
  };

  const calculateTimeRemaining = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `in ${days} days`;
    if (days < 30) return `in ${Math.floor(days / 7)} weeks`;
    return `in ${Math.floor(days / 30)} months`;
  };

  return (
    <Collapsible title="GOALS & RECOMMENDATIONS" defaultOpen={true}>
      <div className="space-y-6">
        {/* Section 1: Active Goals */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Target size={12} className="text-violet-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Active Goals
            </span>
          </div>

          {!hasGoals ? (
            <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
              <p className="text-xs text-slate-500">
                Set your first goal to track progress across life dimensions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all hover:-translate-y-0.5 hover:shadow-lg group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md border ${getCategoryColor(goal.category)}`}
                    >
                      {getCategoryLabel(goal.category)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
                      {calculateTimeRemaining(goal.targetDate)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                    {goal.title}
                  </h4>

                  <ProgressBar progress={goal.progress} />

                  <div className="mt-2 flex justify-end">
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {goal.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: AI Suggestions */}
        {hasRecs && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1 mt-6 border-t border-white/5 pt-6">
              <Lightbulb size={12} className="text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                AI Suggestions
              </span>
            </div>

            <div className="space-y-3">
              {activeRecs.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {rec.impactScore > 7 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <Zap size={8} fill="currentColor" /> HIGH IMPACT
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                            {rec.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">{rec.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {rec.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => onActivate?.(rec)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <Play size={10} fill="currentColor" /> Execute Plan
                      </button>

                      <button
                        onClick={() => onKeepRecommendation?.(rec.id)}
                        className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        title="Keep this"
                        aria-label="Keep this recommendation"
                      >
                        <ThumbsUp size={16} />
                      </button>

                      <button
                        onClick={() => onRemoveRecommendation?.(rec.id)}
                        className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        title="Dismiss"
                        aria-label="Dismiss recommendation"
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
};
