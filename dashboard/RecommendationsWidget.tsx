import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Zap,
} from 'lucide-react';
import { Recommendation } from '../data/types';
import { getCategoryColor } from '../shared/SharedUI';

interface RecommendationsWidgetProps {
  recommendations: Recommendation[];
  isPlanning: boolean;
  onArm: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({
  recommendations,
  isPlanning,
  onArm,
  onDismiss,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeRecs = recommendations.filter((r) => r.status === 'ACTIVE');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-indigo-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Strategic Intelligence
          </h3>
        </div>
        {activeRecs.length > 0 && (
          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {activeRecs.length} Neural Nodes
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isPlanning ? (
          [1, 2].map((i) => (
            <div
              key={i}
              className="h-48 rounded-[2.5rem] bg-slate-900/40 animate-pulse border border-white/5"
            />
          ))
        ) : activeRecs.length > 0 ? (
          activeRecs.map((rec) => {
            const isExpanded = expandedId === rec.id;

            return (
              <div
                key={rec.id}
                className={`group relative p-6 rounded-[2.5rem] bg-slate-900/60 border transition-all duration-500 flex flex-col ${
                  isExpanded
                    ? 'md:col-span-2 border-indigo-500/50 bg-indigo-500/5 shadow-2xl'
                    : 'border-white/5 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(rec.category)}`}
                    >
                      {rec.category}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <TrendingUp size={10} />
                      <span className="text-[10px] font-black">{rec.impactScore}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(rec.id)}
                    className="p-1 text-slate-700 hover:text-rose-500 transition-colors"
                  >
                    <Info size={14} />
                  </button>
                </div>

                <div
                  className="cursor-pointer space-y-2"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                      {rec.title}
                    </h4>
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-indigo-400" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic pr-8">
                    {rec.description}
                  </p>
                </div>

                {isExpanded && (
                  <div className="mt-8 pt-8 border-t border-white/5 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                          <ArrowUpRight size={14} /> Operating Manual (SOP)
                        </h5>
                        <div className="space-y-4">
                          {rec.steps?.map((step, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 group/step hover:bg-white/[0.04] transition-all"
                            >
                              <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[10px] font-black shrink-0 border border-indigo-500/20">
                                {i + 1}
                              </div>
                              <span className="text-sm text-slate-200 font-medium">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                          <h5 className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-3">
                            <CheckCircle size={14} /> Completion Criterion (DoD)
                          </h5>
                          <p className="text-sm text-emerald-200/70 leading-relaxed italic font-medium">
                            {rec.definitionOfDone || 'Objective verified via future signal.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                            <span className="text-[8px] font-black uppercase text-slate-600 block mb-2">
                              Time Budget
                            </span>
                            <span className="text-sm text-white font-black flex items-center gap-2">
                              <Clock size={14} className="text-indigo-500" />{' '}
                              {rec.estimatedTime || '15m'}
                            </span>
                          </div>
                          <div className="p-4 bg-slate-900 rounded-2xl border border-white/5">
                            <span className="text-[8px] font-black uppercase text-slate-600 block mb-2">
                              Primary Input
                            </span>
                            <span className="text-sm text-white font-black flex items-center gap-2 truncate">
                              <Package size={14} className="text-indigo-500" />{' '}
                              {rec.inputs?.[0] || 'None'}
                            </span>
                          </div>
                        </div>

                        {rec.risks && rec.risks.length > 0 && (
                          <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-3xl">
                            <h5 className="text-[9px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2 mb-3">
                              <AlertTriangle size={14} /> Critical Risk Vectors
                            </h5>
                            <ul className="space-y-2">
                              {rec.risks.map((risk, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-rose-300/70 font-medium flex items-start gap-2 leading-relaxed"
                                >
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-600/5 rounded-3xl border border-indigo-500/20">
                      <span className="text-[9px] font-black uppercase text-indigo-400/60 block mb-2">
                        System Rationale
                      </span>
                      <p className="text-sm text-indigo-200/60 leading-relaxed italic font-medium">
                        "{rec.rationale}"
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          Evidence:
                        </span>
                        <div className="flex gap-1">
                          {rec.evidenceLinks.claims.map((cid) => (
                            <div
                              key={cid}
                              className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-black text-slate-400"
                              title={`Claim ${cid}`}
                            >
                              F
                            </div>
                          ))}
                          {rec.evidenceLinks.sources.map((sid) => (
                            <div
                              key={sid}
                              className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-black text-slate-400"
                              title={`Source ${sid}`}
                            >
                              S
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => onArm(rec.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 flex items-center gap-3 transition-all active:scale-95"
                      >
                        <Zap size={16} fill="currentColor" /> Arm Strategy
                      </button>
                    </div>
                  </div>
                )}

                {!isExpanded && (
                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedId(rec.id)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 group-hover:translate-x-1 transition-all"
                    >
                      Compute Manual <ArrowUpRight size={14} />
                    </button>
                    <div className="flex -space-x-2">
                      {rec.evidenceLinks.claims.slice(0, 3).map((i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500"
                        >
                          C
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-20 bg-slate-950/40 rounded-[3rem] border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center">
            <div className="p-6 rounded-full bg-slate-900 mb-6 border border-white/5">
              <Sparkles size={40} className="text-slate-800" />
            </div>
            <h4 className="text-lg font-black text-slate-500 uppercase tracking-tighter">
              Strategic Vacuum
            </h4>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-2 max-w-xs leading-relaxed">
              Log more biometric or financial signals to generate high-fidelity tactical maneuvers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
