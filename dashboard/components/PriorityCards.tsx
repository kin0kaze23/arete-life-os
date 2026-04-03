import React from 'react';
import { Target } from 'lucide-react';

export interface PriorityAction {
  id: string;
  dimension: string;
  title: string;
  why: string;
  firstStep: string;
  colorVar: string;
}

interface PriorityCardsProps {
  priorities: PriorityAction[];
}

export const PriorityCards: React.FC<PriorityCardsProps> = ({ priorities }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2 border-b border-white/5 pb-4">
        <Target className="text-white/40 w-5 h-5" />
        <h3 className="text-xl font-black text-white tracking-tight">What Matters Most Today</h3>
      </div>

      <div className="space-y-4">
        {priorities.map((item, idx) => (
          <div key={item.id} className="glass-panel p-6 relative overflow-hidden group">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 opacity-50 transition-opacity duration-300 group-hover:opacity-100"
              style={{ backgroundColor: `var(${item.colorVar})` }}
            />

            <div className="flex flex-col gap-4 pl-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/50">
                  {item.dimension}
                </span>
                <span className="text-white/30 mx-1">—</span>
                <h4 className="font-bold text-white tracking-tight">{item.title}</h4>
              </div>

              <div className="space-y-3 bg-black/20 rounded-xl p-4 border border-white/5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-white/40 mb-1 block">
                    Why it matters
                  </span>
                  <p className="text-sm text-white/80 leading-relaxed">{item.why}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-white/40 mb-1 block">
                    First step
                  </span>
                  <p className="text-sm font-medium text-white leading-relaxed">{item.firstStep}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
