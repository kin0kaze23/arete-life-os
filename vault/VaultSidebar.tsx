import React from 'react';
import {
  Activity,
  Database,
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
      { id: '/identity/core', label: 'Core', icon: User },
      { id: '/identity/personal', label: 'Personal', icon: HardDrive },
      { id: '/identity/bio', label: 'Health', icon: Activity },
      { id: '/identity/finance', label: 'Money', icon: Wallet },
      { id: '/identity/social', label: 'People', icon: Heart },
      { id: '/identity/spiritual', label: 'Values', icon: Zap },
    ],
  },
  {
    label: 'Library',
    children: [
      { id: '/stream/logs', label: 'Logs', icon: Layout },
      { id: '/stream/knowledge', label: 'Facts', icon: Database },
    ],
  },
] as const;

export const VaultSidebar: React.FC<VaultSidebarProps> = ({ activePath, onNavigate, profile }) => {
  return (
    <aside className="flex h-full w-[232px] flex-col border-r border-white/8 bg-[#0e151f]">
      <div className="border-b border-white/8 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">My Life</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{profile?.identify?.name || 'User'}</p>
      </div>

      <div className="premium-scrollbar flex-1 overflow-y-auto p-4 text-xs">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className={`mb-5 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
            activePath === '/'
              ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
              : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
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
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-blue-200' : 'text-slate-500'} />
                    <span className="text-[12px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
