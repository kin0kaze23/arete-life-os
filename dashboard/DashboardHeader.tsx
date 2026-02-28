import React from 'react';

interface DashboardHeaderProps {
  greeting: string;
  summary: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ greeting, summary }) => {
  return (
    <section className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,26,38,0.96),rgba(12,18,27,0.9))] px-6 py-6 shadow-[0_18px_48px_rgba(0,0,0,0.2)] xl:px-7 xl:py-7">
      <div className="max-w-4xl">
        <div className="max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Today</p>
          <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-slate-100 xl:text-[2.25rem]">
            {greeting}
          </h2>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-7 text-slate-300 text-pretty">
            {summary}
          </p>
        </div>
      </div>
    </section>
  );
};
