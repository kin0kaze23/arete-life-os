import React from 'react';

interface DashboardHeaderProps {
  greeting: string;
  summary: string;
  stats?: Array<{
    label: string;
    value: string;
  }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  greeting,
  summary,
  stats = [],
}) => {
  return (
    <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,34,50,0.92),rgba(16,22,32,0.88))] px-6 py-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)] xl:px-7 xl:py-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Today</p>
          <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-slate-100 xl:text-[2.35rem]">
            {greeting}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-300">{summary}</p>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3 xl:min-w-[360px]">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                <p className="mt-1 text-base font-semibold text-slate-100">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
