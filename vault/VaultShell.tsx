import React from 'react';
import { UserProfile } from '@/data/types';
import { VaultSidebar } from './VaultSidebar';
import { Search, Bell, Settings } from 'lucide-react';

interface VaultShellProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  profile: UserProfile;
  onSearch?: (query: string) => void;
  onSettings?: () => void;
  onNotification?: () => void;
}

export const VaultShell: React.FC<VaultShellProps> = ({
  children,
  activePath,
  onNavigate,
  profile,
  onSearch,
  onSettings,
  onNotification,
}) => {
  return (
    <div className="flex h-full overflow-hidden rounded-[28px] border border-white/10 bg-[#091122] text-slate-200">
      <VaultSidebar activePath={activePath} onNavigate={onNavigate} profile={profile} />

      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#0d162a] text-slate-300">
        <div className="shrink-0 border-b border-white/10 bg-[#0b1426]/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Path
            </span>
            <span className="rounded-lg border border-blue-300/25 bg-blue-500/10 px-2 py-1 font-mono text-xs text-blue-200">
              {activePath}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex w-64 items-center rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 transition-colors focus-within:border-blue-300/35">
              <Search size={14} className="mr-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search profile, memory, knowledge..."
                onChange={(e) => onSearch && onSearch(e.target.value)}
                className="w-full border-none bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-3">
              <button
                onClick={onNotification}
                className="group relative rounded-lg border border-white/10 bg-black/20 p-2 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <Bell size={14} className="text-slate-400 group-hover:text-slate-100" />
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
              </button>
              <button
                onClick={onSettings}
                className="rounded-lg border border-white/10 bg-black/20 p-2 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <Settings size={14} className="cursor-pointer text-slate-400 hover:text-slate-100" />
              </button>
            </div>
          </div>
        </div>

        <div className="premium-scrollbar relative flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
