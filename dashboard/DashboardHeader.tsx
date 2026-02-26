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
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-bold">Dashboard</p>
      <h1 className="mt-2 text-3xl xl:text-[2.1rem] font-black tracking-tight text-white">{greeting}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">{summary}</p>

      {stats.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
              <p className="mt-1 text-xl font-extrabold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
