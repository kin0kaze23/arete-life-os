import React from 'react';
import { Shield, Zap } from 'lucide-react';

interface SystemStatusFooterProps {
  completion: number;
}

export const SystemStatusFooter: React.FC<SystemStatusFooterProps> = ({ completion }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#02040a]/80 backdrop-blur-xl border-t border-white/5 px-10 py-4 flex items-center justify-between">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-3">
        <Shield size={14} className="text-emerald-500" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Security Mode: Sovereignty
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Zap size={14} className="text-indigo-500" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Neural Sync: High Fidelity
        </span>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
        Coherence
      </span>
      <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
          style={{ width: `${completion}%` }}
        />
      </div>
    </div>
  </div>
);
