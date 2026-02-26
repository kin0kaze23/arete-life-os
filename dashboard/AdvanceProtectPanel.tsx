import React from 'react';
import { CalendarCheck2, ShieldCheck, Sparkles } from 'lucide-react';

interface AdvanceProtectPanelProps {
  onPlanDay?: () => void;
  onInsertTemplate?: (template: string) => void;
  [key: string]: any;
}

export const AdvanceProtectPanel: React.FC<AdvanceProtectPanelProps> = ({
  onPlanDay,
  onInsertTemplate,
}) => {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-300" />
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
          Advance & Protect
        </p>
      </div>
      <p className="text-sm text-slate-300">
        Plan the day and capture one high-signal check-in to keep the dashboard accurate.
      </p>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onPlanDay}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white"
        >
          <CalendarCheck2 size={14} />
          Plan Day
        </button>
        <button
          type="button"
          onClick={() => onInsertTemplate?.('Health check-in: sleep, training, nutrition')}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-200"
        >
          <Sparkles size={14} />
          Insert Template
        </button>
      </div>
    </section>
  );
};
