import React from 'react';
import {
  Activity,
  BookOpen,
  Database,
  Folder,
  HardDrive,
  Heart,
  Layout,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { UserProfile } from '@/data/types';

interface VaultSidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  profile?: UserProfile;
}

const MENU = [
  {
    label: 'Profile',
    children: [
      { id: '/identity/core', label: 'Core Profile', icon: Folder },
      { id: '/identity/personal', label: 'Personal Profile', icon: User },
      { id: '/identity/bio', label: 'Health & Body', icon: Activity },
      { id: '/identity/finance', label: 'Financial Assets', icon: Wallet },
      { id: '/identity/social', label: 'Relationships', icon: Heart },
      { id: '/identity/spiritual', label: 'Beliefs & Values', icon: Zap },
    ],
  },
  {
    label: 'Records',
    children: [
      { id: '/stream/logs', label: 'Logs', icon: Layout },
      { id: '/stream/knowledge', label: 'Knowledge Base', icon: Database },
    ],
  },
] as const;

export const VaultSidebar: React.FC<VaultSidebarProps> = ({ activePath, onNavigate, profile }) => {
  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-white/10 bg-[#0a1426]">
      <div className="border-b border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Vault active
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {profile?.identify?.name || 'User'} Workspace
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Encrypted profile, journal records, and structured knowledge.
          </p>
        </div>
      </div>

      <div className="premium-scrollbar flex-1 overflow-y-auto p-4 text-xs">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className={`mb-6 flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
            activePath === '/'
              ? 'border-blue-300/35 bg-blue-500/16 text-blue-100'
              : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.05]'
          }`}
        >
          <HardDrive size={15} />
          <span className="font-medium tracking-[0.02em]">Overview</span>
        </button>

        {MENU.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 pl-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.children.map((item) => {
                const Icon = item.icon;
                const active = activePath === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-blue-300/35 bg-blue-500/16 text-blue-100'
                        : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <Icon
                      size={14}
                      className={active ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-300'}
                    />
                    <span className="text-[12px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-200">
            <BookOpen size={14} />
            <span className="font-semibold">Simple rule</span>
          </div>
          <p className="mt-2 leading-5">
            Keep this page factual. The cleaner your profile and records are, the better Aura behaves.
          </p>
        </div>
      </div>
    </aside>
  );
};
