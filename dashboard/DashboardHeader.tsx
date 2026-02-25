import React from 'react';

interface DashboardHeaderProps {
  greeting: string;
  summary: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ greeting, summary }) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Dashboard</p>
      <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">{greeting}</h1>
      <p className="mt-2 text-sm text-slate-300">{summary}</p>
    </section>
  );
};
