import React from 'react';
import { UserProfile, MemoryItem, Claim } from '@/data/types';
import { Activity, Database, Shield, HardDrive, Users, Zap, FileText } from 'lucide-react';

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
      label: 'Identity Coherence',
      value: '98%',
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Neural Logs',
      value: memoryCount.toString(),
      icon: FileText,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Knowledge Nodes',
      value: claimCount.toString(),
      icon: Database,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'System Storage',
      value: '2.4 GB',
      icon: HardDrive,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-mono text-white mb-2">VAULT OVERVIEW</h1>
        <p className="text-slate-500 text-xs font-mono">
          System Status: ONLINE // Encryption: AES-256
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-[#050608] border border-white/5 p-4 rounded-xl flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg}`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-0.5">
                {stat.label}
              </div>
              <div className="text-xl font-mono text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity / Quick Actions Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#050608] border border-white/5 rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity size={14} /> System Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-start border-l-2 border-white/5 pl-3 py-1">
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">Today 14:0{i}</div>
                <div className="text-xs text-slate-400">
                  System synchronized with {i * 12} new signals.
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#050608] border border-white/5 rounded-xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={14} /> Optimization
          </h3>
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
            <div className="text-indigo-400 font-bold text-sm mb-1">Backup Recommended</div>
            <div className="text-slate-400 text-xs mb-3">
              Last full encryption backup was 7 days ago.
            </div>
            <button className="text-[10px] bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded transition-colors">
              INITIATE BACKUP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
