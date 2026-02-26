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
    <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-[#07101d] to-[#0c1625] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
      <div className="pointer-events-none absolute -top-28 right-[-8%] h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-35%] left-[-12%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative space-y-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/70 font-bold">Dashboard</p>
        <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-white">{greeting}</h1>
        <p className="max-w-3xl text-sm text-slate-300">{summary}</p>

        {stats.length > 0 && (
          <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                <p className="mt-1 text-xl font-extrabold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
