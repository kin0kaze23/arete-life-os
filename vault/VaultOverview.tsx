import React from 'react';
import { Activity, Database, FileText, Shield, Sparkles, User } from 'lucide-react';
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
  const profileStarted = Boolean(profile.identify?.name || profile.identify?.location || profile.identify?.origin);
  const stats = [
    {
      label: 'Profile Status',
      value: profileStarted ? 'Started' : 'Needs setup',
      icon: User,
      tone: 'text-blue-200 bg-blue-500/14',
    },
    {
      label: 'Journal Logs',
      value: String(memoryCount),
      icon: FileText,
      tone: 'text-emerald-200 bg-emerald-500/14',
    },
    {
      label: 'Knowledge Claims',
      value: String(claimCount),
      icon: Database,
      tone: 'text-amber-200 bg-amber-500/14',
    },
    {
      label: 'Vault Mode',
      value: 'Encrypted',
      icon: Shield,
      tone: 'text-indigo-200 bg-indigo-500/14',
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl p-8">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,rgba(17,24,39,0.88),rgba(6,10,18,0.96))] p-6 xl:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">My Life</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Vault Overview</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          This page is the stable reference layer behind your dashboard and assistant. Keep it factual,
          current, and sparse enough that the important details stand out.
        </p>
        <p className="mt-2 text-xs text-slate-400">Active profile: {profile.identify?.name || 'User'}</p>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center gap-2 text-slate-100">
            <Sparkles size={14} className="text-blue-200" />
            <h3 className="text-sm font-semibold">What to maintain here</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>Use profile pages for facts that change slowly: identity, relationships, finances, values.</p>
            <p>Use journal records for what happened, what it meant, and what the next action is.</p>
            <p>Use the knowledge base to keep only the claims you want Aura to rely on confidently.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center gap-2 text-slate-100">
            <Activity size={14} className="text-emerald-200" />
            <h3 className="text-sm font-semibold">Best next steps</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>If your profile is incomplete, start with Core Profile and Personal Profile first.</p>
            <p>If the dashboard feels generic, add 3-5 recent journal entries before changing settings.</p>
            <p>If Aura feels inaccurate, review Knowledge Base and remove stale or weak claims.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
