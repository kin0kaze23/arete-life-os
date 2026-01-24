import React, { useState } from 'react';
// Added X to imports from lucide-react
import { ArrowRight, CheckCircle2, XCircle, HelpCircle, Check, Sparkles, X } from 'lucide-react';
import { ActionTooltip } from './SharedUI';

interface DiffRowProps {
  field: string;
  oldValue: string;
  newValue: string;
  confidence: number;
  evidence: string;
  onApprove: () => void;
  onReject: () => void;
}

export const DiffRow: React.FC<DiffRowProps> = ({
  field,
  oldValue,
  newValue,
  confidence,
  evidence,
  onApprove,
  onReject,
}) => {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const handleApprove = () => {
    if (status !== 'pending') return;
    setStatus('approved');
    onApprove();
  };

  const handleReject = () => {
    if (status !== 'pending') return;
    setStatus('rejected');
    onReject();
  };

  return (
    <div
      className={`relative p-5 rounded-[2rem] border transition-all duration-500 group ${
        status === 'approved'
          ? 'bg-emerald-900/10 border-emerald-500/40 border-l-4 border-l-emerald-500 shadow-xl'
          : status === 'rejected'
            ? 'bg-slate-900/20 border-white/5 opacity-50 grayscale'
            : 'bg-slate-900/40 border-white/5 hover:border-white/20 shadow-lg'
      }`}
    >
      {status === 'approved' && (
        <div className="absolute top-4 right-4 text-emerald-500 animate-in fade-in zoom-in">
          <CheckCircle2 size={20} strokeWidth={3} />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-500/40 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
            {field}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ActionTooltip label={evidence} side="left">
            <div className="p-1.5 bg-white/5 rounded-lg text-slate-600 hover:text-indigo-400 cursor-help transition-all">
              <HelpCircle size={14} />
            </div>
          </ActionTooltip>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
              confidence > 80
                ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                : confidence > 50
                  ? 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                  : 'text-rose-400 border-rose-500/20 bg-rose-500/5'
            }`}
          >
            <Sparkles size={10} className={confidence > 80 ? 'animate-pulse' : ''} />
            {Math.round(confidence)}% Match
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-4 text-sm ${status === 'rejected' ? 'line-through decoration-slate-600' : ''}`}
      >
        <div className="flex-1 min-w-0 bg-black/20 p-3 rounded-xl border border-white/5">
          <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">
            Baseline
          </div>
          <div
            className="text-rose-400/60 line-through decoration-rose-500/30 truncate font-bold text-xs italic"
            title={oldValue}
          >
            {oldValue || '∅ Void'}
          </div>
        </div>

        <div className="p-2 bg-indigo-600/10 rounded-full border border-indigo-500/20">
          <ArrowRight size={14} className="text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20">
          <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">
            Proposed
          </div>
          <div className="text-white font-black truncate text-xs" title={newValue}>
            {newValue}
          </div>
        </div>
      </div>

      {status === 'pending' && (
        <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-900/90 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl scale-95 group-hover:scale-100">
          <button
            onClick={handleApprove}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-all hover:bg-emerald-500/10 rounded-xl"
          >
            <Check size={18} strokeWidth={3} />
          </button>
          <button
            onClick={handleReject}
            className="p-2 text-slate-400 hover:text-rose-400 transition-all hover:bg-rose-500/10 rounded-xl"
          >
            {/* X was used here but not imported */}
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
};
