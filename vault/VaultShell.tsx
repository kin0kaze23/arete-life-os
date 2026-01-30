import React, { useState } from 'react';
import { UserProfile, Claim, MemoryItem, Source, RuleOfLife } from '@/data/types';
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
    <div className="h-full flex bg-[#030405] text-slate-300 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <VaultSidebar activePath={activePath} onNavigate={onNavigate} profile={profile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#09090b] text-slate-300">
        {/* Top Command Bar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#050608]/80 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <span className="font-mono text-xs text-slate-500 opacity-50">PATH:</span>
            <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
              {activePath}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group flex items-center bg-slate-900 border border-white/5 rounded-md px-2 py-1.5 focus-within:border-indigo-500/50 transition-colors w-64">
              <Search size={14} className="text-slate-500 mr-2" />
              <input
                type="text"
                placeholder="EXECUTE SEARCH..."
                onChange={(e) => onSearch && onSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-mono text-white w-full placeholder-slate-600"
              />
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-3">
              <button
                onClick={onNotification}
                className="hover:bg-slate-800 p-1.5 rounded transition-colors group relative"
              >
                <Bell
                  size={14}
                  className="text-slate-600 group-hover:text-indigo-400 transition-colors"
                />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              </button>
              <button
                onClick={onSettings}
                className="hover:bg-slate-800 p-1.5 rounded transition-colors"
              >
                <Settings
                  size={14}
                  className="text-slate-600 hover:text-indigo-400 cursor-pointer transition-colors"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto relative">{children}</div>
      </div>
    </div>
  );
};
