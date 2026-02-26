import React from 'react';
import { UserProfile } from '@/data/types';
import { Activity, Database, Shield, HardDrive, Zap, FileText } from 'lucide-react';

interface VaultOverviewProps {
  profile: UserProfile;
  memoryCount: number;
  claimCount: number;
  storageUsage: number;
}

export const VaultOverview: React.FC<VaultOverviewProps> = ({
  profile,
  memoryCount,
  claimCount,
  storageUsage,
}) => {
  const stats = [
    {
      label: 'Identity Completion',
      value: '98%',
      icon: Shield,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/12',
    },
    {
      label: 'Journal Logs',
      value: memoryCount.toString(),
      icon: FileText,
      color: 'text-blue-200',
      bg: 'bg-blue-500/14',
    },
    {
      label: 'Knowledge Nodes',
      value: claimCount.toString(),
      icon: Database,
      color: 'text-amber-300',
      bg: 'bg-amber-500/12',
    },
    {
      label: 'Storage Used',
      value: `${storageUsage} GB`,
      icon: HardDrive,
      color: 'text-slate-300',
      bg: 'bg-slate-500/12',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8 rounded-3xl border border-white/10 bg-[linear-gradient(165deg,rgba(17,24,39,0.82),rgba(6,10,18,0.92))] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">My Life</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Vault Overview</h1>
        <p className="mt-2 text-sm text-slate-300">
          Encrypted personal knowledge, organized by identity and timeline context.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Active profile: {profile.identify?.name || 'User'}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {stat.label}
              </div>
              <div className="text-2xl font-semibold text-slate-100">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Activity size={14} /> System Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
              >
                <div className="mt-0.5 text-[10px] text-slate-500">Today 14:0{i}</div>
                <div className="text-sm text-slate-300">Synchronized {i * 12} new life signals.</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Zap size={14} /> Recommended Action
          </h3>
          <div className="rounded-xl border border-blue-300/25 bg-blue-500/10 p-4">
            <div className="mb-1 text-sm font-semibold text-blue-100">Backup Recommended</div>
            <div className="mb-3 text-sm text-slate-300">
              Last full encrypted backup is older than 7 days. Create one to keep your vault safe.
            </div>
            <button className="rounded-lg bg-blue-500 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-400">
              Create Backup
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Insight
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Journal quality improves when each entry includes category + outcome + next action.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
