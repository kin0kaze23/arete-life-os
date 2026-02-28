import React from 'react';
import { Activity, Database, FileText, Shield, User } from 'lucide-react';
import { UserProfile } from '@/data/types';

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
}) => {
  const profileStarted = Boolean(
    profile.identify?.name || profile.identify?.location || profile.identify?.origin
  );

  const stats = [
    {
      label: 'Profile',
      value: profileStarted ? 'Started' : 'Needs setup',
      icon: User,
      tone: 'text-blue-200 bg-blue-500/14',
    },
    {
      label: 'Journal',
      value: String(memoryCount),
      icon: FileText,
      tone: 'text-emerald-200 bg-emerald-500/14',
    },
    {
      label: 'Facts',
      value: String(claimCount),
      icon: Database,
      tone: 'text-amber-200 bg-amber-500/14',
    },
    {
      label: 'Security',
      value: 'Encrypted',
      icon: Shield,
      tone: 'text-indigo-200 bg-indigo-500/14',
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl p-8">
      <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,34,50,0.92),rgba(16,22,32,0.88))] p-6 xl:p-7">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">Vault Overview</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Keep this layer factual, current, and sparse enough that the important details stand out.
        </p>
        <p className="mt-2 text-xs text-slate-500">Active profile: {profile.identify?.name || 'User'}</p>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
          <h3 className="text-sm font-semibold text-slate-100">What belongs here</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>Profile pages hold slow-changing facts.</p>
            <p>Journal holds what happened and what it meant.</p>
            <p>Facts hold the claims Aura should trust confidently.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
          <div className="flex items-center gap-2 text-slate-100">
            <Activity size={14} className="text-emerald-200" />
            <h3 className="text-sm font-semibold">Best next steps</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>Finish Core and Personal first.</p>
            <p>Add 3-5 real journal entries before judging the dashboard.</p>
            <p>Remove stale facts when Aura feels inaccurate.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
