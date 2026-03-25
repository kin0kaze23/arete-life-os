import React from 'react';

interface SystemStatusFooterProps {
  completion: number;
}

export const SystemStatusFooter: React.FC<SystemStatusFooterProps> = ({ completion }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-sm border-t border-white/5 px-6 py-3 flex items-center justify-between">
    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
      Profile Coherence
    </span>
    <div className="flex items-center gap-3">
      <div className="w-36 h-1 bg-slate-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${completion}%` }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-slate-400 tabular-nums">
        {Math.round(completion)}%
      </span>
    </div>
  </div>
);
