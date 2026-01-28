import React, { useState, useEffect } from 'react';
import { TimelineEvent, Recommendation, UserProfile, MemoryEntry } from '@/data';
import {
  X,
  Sparkles,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Package,
  BrainCircuit,
  MapPin,
  Calendar,
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-2xl w-full bg-[#0A0C10] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Simplified Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic">
                Preparation Manual
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                Event Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-slate-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-8">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles
                  size={24}
                  className="absolute inset-0 m-auto text-indigo-400 animate-pulse"
                />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-black text-white uppercase italic mb-1">
                  Synthesizing Strategy
                </h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  Analyzing past performance & constraints...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em]">
              {error}
            </div>
          ) : (
            plan && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Simplified Event Title Section */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(event.date).toLocaleDateString()}</span>
                      {event.fields?.location && (
                        <span className="flex items-center gap-1 truncate max-w-[150px]"><MapPin size={10} /> {event.fields.location}</span>
                      )}
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-white tracking-tight uppercase italic mb-3">
                    {event.title}
                  </h4>
                  <div className="flex items-start gap-2 p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                    <Sparkles size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-indigo-200/70 font-medium leading-relaxed italic">
                      {plan.rationale}
                    </p>
                  </div>
                </div>

                {/* Simplified Steps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-indigo-500" />
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactical Roadmap</h5>
                  </div>
                  <div className="space-y-3">
                    {plan.steps?.map((step, i) => (
                      <div key={i} className="flex gap-4 items-center group">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-indigo-400 font-black text-xs shrink-0 group-hover:border-indigo-500/30 transition-colors">
                          {i + 1}
                        </div>
                        <div className="flex-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:bg-white/[0.04] transition-all">
                          <p className="text-xs font-bold text-slate-300">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simplified Success Criteria */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Success Criteria</h5>
                  </div>
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                    <p className="text-[11px] text-emerald-200/70 font-medium leading-relaxed italic">
                      {plan.definitionOfDone}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Streamlined Footer */}
        <div className="px-8 py-6 bg-[#08090C] border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-0.5">Time</span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                <Clock size={10} className="text-indigo-500" /> {plan?.estimatedTime || '---'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-0.5">Resources</span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                <Package size={10} className="text-indigo-500" /> {plan?.inputs?.[0] || 'Standard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => plan && onActivate(plan)}
              disabled={isGenerating || !plan}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
            >
              Arm Mission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
