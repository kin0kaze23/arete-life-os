import React, { useState, useEffect } from 'react';
import { TimelineEvent, Recommendation, UserProfile, MemoryEntry } from '@/data';
import {
  X,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Package,
  Loader2,
  BrainCircuit,
  Flag,
} from 'lucide-react';
import { generateEventPrepPlan } from '@/ai/geminiService';
import { getCategoryColor } from '@/shared';

interface PrepPlanModalProps {
  event: TimelineEvent;
  profile: UserProfile;
  history: MemoryEntry[];
  onClose: () => void;
  onActivate: (plan: Recommendation) => void;
}

export const PrepPlanModal: React.FC<PrepPlanModalProps> = ({
  event,
  profile,
  history,
  onClose,
  onActivate,
}) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [plan, setPlan] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runSimulation = async () => {
      try {
        const result = await generateEventPrepPlan(event, profile, history);
        setPlan(result);
      } catch (err) {
        setError('Neural simulation failed. Horizon unstable.');
      } finally {
        setIsGenerating(false);
      }
    };
    runSimulation();
  }, [event]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="max-w-4xl w-full bg-[#0D1117] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
              <BrainCircuit size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Event Intelligence
              </span>
              <h3 className="text-xl font-black text-white uppercase italic">
                Strategic Preparation Manual
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles
                  size={32}
                  className="absolute inset-0 m-auto text-indigo-400 animate-pulse"
                />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">
                  Simulating Preparation Scenarios
                </h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                  Cross-referencing profile conditions and past behavioral data...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-rose-500 font-bold uppercase tracking-widest">
              {error}
            </div>
          ) : (
            plan && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Context Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Flag size={14} className="text-indigo-500" /> Target Objective
                    </h5>
                    <div className="p-6 bg-slate-900/60 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getCategoryColor(event.category)}`}
                        >
                          {event.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">
                        {event.title}
                      </h4>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                        "{event.description}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={14} className="text-indigo-400" /> Strategy Rationale
                    </h5>
                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                      <p className="text-sm text-indigo-100/70 font-medium leading-relaxed italic">
                        "{plan.rationale}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prep Steps Vertical Timeline */}
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-indigo-500" /> Tactical Roadmap
                  </h5>
                  <div className="space-y-4 relative">
                    <div className="absolute left-6 top-8 bottom-8 w-px bg-slate-800" />
                    {plan.steps?.map((step, i) => (
                      <div key={i} className="flex gap-6 items-start relative group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0 z-10 group-hover:border-indigo-500/50 transition-colors">
                          {i + 1}
                        </div>
                        <div className="flex-1 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                          <p className="text-sm font-bold text-slate-200">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks & Outcome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert size={14} className="text-rose-500" /> Failure Mode Risks
                    </h5>
                    <div className="space-y-3">
                      {plan.risks?.map((risk, i) => (
                        <div
                          key={i}
                          className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center gap-3"
                        >
                          <ShieldAlert size={16} className="text-rose-400 shrink-0" />
                          <span className="text-[11px] font-medium text-rose-200/70">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" /> Success Criteria (DoD)
                    </h5>
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                      <p className="text-sm text-emerald-200/70 font-medium leading-relaxed italic">
                        {plan.definitionOfDone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-[#08090C] border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">
                Time Budget
              </span>
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Clock size={12} className="text-indigo-400" /> {plan?.estimatedTime || '---'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">
                Inputs
              </span>
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Package size={12} className="text-indigo-400" /> {plan?.inputs?.[0] || 'None'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-4 text-xs font-black uppercase text-slate-500 hover:text-white transition-all"
            >
              Discard Plan
            </button>
            <button
              onClick={() => plan && onActivate(plan)}
              disabled={isGenerating || !plan}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 flex items-center gap-3 transition-all active:scale-95"
            >
              <Sparkles size={16} /> Arm Prep Mission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
