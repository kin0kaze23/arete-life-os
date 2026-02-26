import React from 'react';
import {
  Folder,
  FileText,
  Database,
  Activity,
  Wallet,
  Heart,
  Zap,
  Layout,
  HardDrive,
  User,
} from 'lucide-react';

import { UserProfile } from '@/data/types';

interface VaultSidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  profile?: UserProfile;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({ activePath, onNavigate, profile }) => {
  const menu = [
    {
      label: 'My Identity',
      icon: Folder,
      type: 'folder',
      children: [
        { id: '/identity/core', label: 'Core Profile', icon: FileText },
        { id: '/identity/personal', label: 'Personal Profile', icon: User },
        { id: '/identity/bio', label: 'Health & Body', icon: Activity },
        { id: '/identity/finance', label: 'Financial Assets', icon: Wallet },
        { id: '/identity/social', label: 'Relationships', icon: Heart },
        { id: '/identity/spiritual', label: 'Beliefs & Values', icon: Zap },
      ],
    },
    {
      label: 'Data Stream',
      icon: Database,
      type: 'folder',
      children: [
        { id: '/stream/logs', label: 'Daily Logs', icon: Layout },
        { id: '/stream/knowledge', label: 'Knowledge Base', icon: FileText },
      ],
    },
  ];

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-[#0a1426]">
      <div className="border-b border-white/10 p-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Vault Active
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {profile?.identify?.name || 'User'} Workspace
          </p>
        </div>
      </div>

      <div className="premium-scrollbar flex-1 overflow-y-auto p-4 text-xs">
        <div
          className="mb-6 flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-200 transition hover:border-white/20"
          onClick={() => onNavigate('/')}
        >
          <HardDrive size={14} />
          <span className="font-medium tracking-[0.02em]">Overview</span>
        </div>

        {menu.map((item) => (
          <div key={item.label} className="mb-6">
            <div className="mb-2 flex items-center gap-2 pl-2 text-slate-500">
              <item.icon size={12} />
              <span className="font-semibold uppercase tracking-[0.14em] text-[10px]">{item.label}</span>
            </div>
            <div className="space-y-0.5">
              {item.children.map((child) => (
                <div
                  key={child.id}
                  onClick={() => onNavigate(child.id)}
                  className={`group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    activePath === child.id
                      ? 'border-blue-300/35 bg-blue-500/16 text-blue-100'
                      : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <child.icon
                    size={14}
                    className={
                      activePath === child.id ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-300'
                    }
                  />
                  <span className="text-[12px]">{child.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Storage Usage</span>
          <span>2.4 GB</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-[24%] bg-blue-400" />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>Used</span>
          <span>Unlimited</span>
        </div>
      </div>
    </aside>
  );
};
