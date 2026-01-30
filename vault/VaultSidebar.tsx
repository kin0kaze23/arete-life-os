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
    <div className="w-64 bg-[#09090b] border-r border-white/5 flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-indigo-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] tracking-widest">SYSTEM ONLINE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        <div
          className="mb-6 pl-2 opacity-80 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 cursor-pointer"
          onClick={() => onNavigate('/')}
        >
          <HardDrive size={14} />
          <span className="font-bold tracking-wider">SYSTEM OVERVIEW</span>
        </div>

        {menu.map((item) => (
          <div key={item.label} className="mb-6">
            <div className="flex items-center gap-2 text-slate-500 mb-2 pl-2">
              <item.icon size={12} />
              <span>{item.label}</span>
            </div>
            <div className="space-y-0.5">
              {item.children.map((child) => (
                <div
                  key={child.id}
                  onClick={() => onNavigate(child.id)}
                  className={`
                        group flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors
                        ${
                          activePath === child.id
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                        }
                      `}
                >
                  <child.icon
                    size={14}
                    className={
                      activePath === child.id
                        ? 'text-indigo-400'
                        : 'text-slate-600 group-hover:text-slate-400'
                    }
                  />
                  <span>{child.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="text-[10px] text-slate-600 font-mono flex justify-between">
          <span>SYSTEM USAGE (DEMO)</span>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
          <div className="bg-indigo-500 w-[24%] h-full" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>2.4 GB</span>
          <span>UNLIMITED</span>
        </div>
      </div>
    </div>
  );
};
