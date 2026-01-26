import React from 'react';
import { ShieldAlert, AlertTriangle, Eye } from 'lucide-react';

export const BlindSideRadarCard: React.FC<{
  signal: string;
  why: string;
  confidence: number;
  severity: 'low' | 'med' | 'high';
  actions: string[];
  onViewEvidence?: () => void;
}> = ({ signal, why, confidence, severity, actions, onViewEvidence }) => {
  const severityColors = {
    high: 'border-l-rose-500 shadow-[inset_10px_0_20px_-10px_rgba(244,63,94,0.1)]',
    med: 'border-l-amber-500 shadow-[inset_10px_0_20px_-10px_rgba(245,158,11,0.1)]',
    low: 'border-l-slate-500 shadow-[inset_10px_0_20px_-10px_rgba(100,116,139,0.1)]',
  };

  const confidenceLevel = confidence >= 80 ? 'High' : confidence >= 50 ? 'Med' : 'Low';
  const confidenceColor =
    confidence >= 80
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : confidence >= 50
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  return (
    <div
      className={`relative flex flex-col p-5 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all duration-300 group border-l-[3px] ${severityColors[severity]}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {severity === 'high' ? (
            <ShieldAlert size={14} className="text-rose-500" />
          ) : (
            <AlertTriangle size={14} className="text-amber-500" />
          )}
          <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">{signal}</h4>
        </div>
        <span
          className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${confidenceColor}`}
        >
          {confidenceLevel} Conf
        </span>
      </div>

      <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4 min-h-[2.5em]">
        {why}
      </p>

      <div className="space-y-2 mb-5 flex-1">
        {actions.map((action, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default"
          >
            <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-[9px] font-bold text-slate-300 truncate">{action}</span>
          </div>
        ))}
      </div>

      {onViewEvidence && (
        <button
          onClick={onViewEvidence}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800/50 hover:bg-indigo-500/10 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/20"
        >
          <Eye size={12} /> View Evidence
        </button>
      )}
    </div>
  );
};
