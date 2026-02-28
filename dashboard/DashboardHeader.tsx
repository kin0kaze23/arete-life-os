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
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,rgba(17,24,39,0.88),rgba(6,10,18,0.96))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.22)] xl:p-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Today
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 xl:text-[2.1rem]">
            {greeting}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{summary}</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            What this page is for
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Start from the next meaningful action, review what needs attention, then capture new
            signals when reality changes.
          </p>
        </div>
      </div>

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
