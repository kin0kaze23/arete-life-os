import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Skeleton } from '../shared/SharedUI';

type DoItem = {
  id: string;
  title: string;
  why?: string;
  steps: string[];
  time: string;
  effort: string;
  when: string;
  inputs: string[];
  definition?: string;
  risks: string[];
  followUp?: string;
};

type WatchItem = {
  id: string;
  title: string;
  why: string;
  impact: string;
  prevention: string;
};

interface DoWatchSectionProps {
  horizon: 'now' | 'soon' | 'always';
  setHorizon: (value: 'now' | 'soon' | 'always') => void;
  doItems: DoItem[];
  watchItems: WatchItem[];
  isPlanningDay: boolean;
  isGeneratingTasks: boolean;
  planMyDay: () => void;
  refreshAll: () => void;
  onNavigate: (tab: any) => void;
  needsReviewCount: number;
  showLowConfidence: boolean;
}

export const DoWatchSection: React.FC<DoWatchSectionProps> = ({
  horizon,
  setHorizon,
  doItems,
  watchItems,
  isPlanningDay,
  isGeneratingTasks,
  planMyDay,
  refreshAll,
  onNavigate,
  needsReviewCount,
  showLowConfidence,
}) => {
  const [expandedDoId, setExpandedDoId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              Do + Watch Command
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            What to do, why it matters, and what to watch.
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            AI guidance grounded in your profile, memory vault, and uploaded files.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900/80 border border-white/5 rounded-2xl p-1">
            {[
              { id: 'now', label: 'Now' },
              { id: 'soon', label: 'Soon' },
              { id: 'always', label: 'Always' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setHorizon(item.id as typeof horizon)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  horizon === item.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {needsReviewCount > 0 && (
            <button
              onClick={() => onNavigate('vault')}
              className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-400 hover:bg-amber-500/20 transition-all"
            >
              Needs Review · {needsReviewCount}
            </button>
          )}
          <button
            onClick={refreshAll}
            className="px-6 py-3 rounded-2xl bg-slate-900 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
          >
            Refresh Signals
          </button>
        </div>
      </div>

      {showLowConfidence && (
        <div className="glass-panel p-5 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
              Low Data Confidence
            </p>
            <p className="text-xs text-amber-200/70 mt-2">
              We need more signals to personalize your Do/Watch guidance. Add a quick note or upload
              a file to improve accuracy.
            </p>
          </div>
          <button
            onClick={() => onNavigate('vault')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
          >
            Add Context
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-slate-950/40 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Do</h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {horizon === 'now'
                  ? 'Today priorities'
                  : horizon === 'soon'
                    ? 'Next 7–14 days'
                    : 'Evergreen routines'}
              </p>
            </div>
            <button
              onClick={planMyDay}
              className="px-5 py-2 rounded-xl bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
            >
              Plan My Day
            </button>
          </div>

          {isPlanningDay ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : doItems.length > 0 ? (
            <div className="space-y-4">
              {doItems.slice(0, 3).map((item) => {
                const isExpanded = expandedDoId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-white/5 bg-slate-900/60 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <h5 className="text-sm font-black text-white">{item.title}</h5>
                        <p className="text-[10px] text-slate-400">
                          {item.why || 'Needs more context to explain rationale.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-widest text-slate-500">
                          <span>{item.time}</span>
                          <span>{item.effort}</span>
                          <span>{item.when}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedDoId(isExpanded ? null : item.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        {isExpanded ? 'Hide' : 'Start'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-4 border-t border-white/5 pt-4 text-[10px] text-slate-300">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500">
                            Steps
                          </span>
                          <ul className="mt-2 space-y-2">
                            {(item.steps.length ? item.steps : ['Define first step.']).map(
                              (step, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[9px] font-black">
                                    {idx + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">
                              Inputs
                            </span>
                            <p className="mt-2 text-slate-400">
                              {item.inputs.length ? item.inputs.join(', ') : 'None listed.'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest text-slate-500">
                              Definition of done
                            </span>
                            <p className="mt-2 text-slate-400">
                              {item.definition || 'Completion confirmed by a logged outcome.'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500">
                            Risks / Watch-outs
                          </span>
                          <p className="mt-2 text-slate-400">
                            {item.risks.length ? item.risks.join(' • ') : 'No major risks noted.'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500">
                            Follow-up
                          </span>
                          <p className="mt-2 text-slate-400">{item.followUp}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {doItems.length > 3 && (
                <button
                  onClick={() => onNavigate('vault')}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all"
                >
                  +{doItems.length - 3} more • View all
                </button>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500 space-y-3">
              <p>No actions yet. Add signals or run Plan My Day.</p>
              <button
                onClick={() => onNavigate('vault')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white border border-white/5 hover:border-indigo-500/30 transition-all"
              >
                Add Context
              </button>
            </div>
          )}
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-slate-950/40 flex flex-col gap-6">
          <div>
            <h4 className="text-xl font-black text-white uppercase tracking-tight">Watch</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {horizon === 'now'
                ? 'Today watch-outs'
                : horizon === 'soon'
                  ? 'Upcoming risks'
                  : 'Baseline guardrails'}
            </p>
          </div>

          {isGeneratingTasks ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : watchItems.length > 0 ? (
            <div className="space-y-4">
              {watchItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-rose-500/10 bg-rose-500/5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-black text-white">{item.title}</h5>
                    <span className="text-[9px] uppercase tracking-widest text-rose-300">
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-200/70">{item.why}</p>
                  <p className="text-[10px] text-rose-200/70 italic">
                    Next prevention step: {item.prevention}
                  </p>
                </div>
              ))}
              {watchItems.length > 3 && (
                <button
                  onClick={() => onNavigate('vault')}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-all"
                >
                  +{watchItems.length - 3} more • View all
                </button>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
              No risks detected yet. Keep logging signals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
