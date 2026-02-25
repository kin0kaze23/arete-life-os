import React from 'react';

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
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
            Advance & Protect
          </p>
          <p className="text-sm text-slate-300">Plan today and capture a high-signal check-in.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPlanDay}
            className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            Plan Day
          </button>
          <button
            type="button"
            onClick={() => onInsertTemplate?.('Health check-in: sleep, training, nutrition')}
            className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-200"
          >
            Insert Template
          </button>
        </div>
      </div>
    </section>
  );
};
