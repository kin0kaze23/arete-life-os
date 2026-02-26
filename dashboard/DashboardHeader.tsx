import React from 'react';

interface DashboardHeaderProps {
  greeting: string;
  summary: string;
  stats?: Array<{
    label: string;
    value: string;
  }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ greeting, summary, stats = [] }) => {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,rgba(17,24,39,0.82),rgba(8,12,22,0.9))] p-7 shadow-[0_16px_46px_rgba(0,0,0,0.25)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 xl:text-[2.1rem]">
        {greeting}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">{summary}</p>

      {stats.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
