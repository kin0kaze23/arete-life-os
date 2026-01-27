import React from 'react';
import { ShieldCheck, Loader2, Mic, Search, Command } from 'lucide-react';
import { UserProfile } from '@/data';
import { getProfileCompletion, ProfileCompletionRing, ActionTooltip } from '@/shared';

interface HeaderProps {
  activeTab: string;
  profile: UserProfile;
  isGeneratingTasks: boolean;
  refreshTasks: () => void;
  onOpenProfile: () => void;
  onStartVoice?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  profile,
  isGeneratingTasks,
  refreshTasks,
  onOpenProfile,
  onStartVoice,
  onOpenCommandPalette,
}) => {
  const userName = profile.identify.name || 'User';
  const completion = getProfileCompletion(profile);

  return (
    <header className="px-10 py-5 flex justify-between items-center bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-800/50">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-black uppercase tracking-[0.25em] text-white">
          {activeTab === 'dashboard'
            ? 'Dashboard'
            : activeTab.replace('vault', 'Memory Vault').toUpperCase()}
        </h2>

        <button
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all group"
        >
          <Search size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Execute Command...
          </span>
          <div className="flex items-center gap-1 ml-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <Command size={10} />
            <span className="text-[10px] font-mono">K</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
              {isGeneratingTasks ? 'Neural Processing' : 'Security Node'}
            </span>

            <div className="flex items-center gap-3">
              <div className="relative w-4 h-4">
                <div
                  className={`absolute inset-0 rounded-full border-2 border-indigo-500/20 ${isGeneratingTasks ? 'animate-ping' : ''}`}
                />
                <div
                  className={`absolute inset-0 rounded-full border-2 border-indigo-500 ${isGeneratingTasks ? 'animate-spin border-t-transparent' : 'opacity-40'}`}
                />
                {!isGeneratingTasks && (
                  <div className="absolute inset-1 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
              </div>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isGeneratingTasks ? 'text-indigo-400' : 'text-emerald-400 opacity-80'
                }`}
              >
                {isGeneratingTasks ? 'SYNCHRONIZING' : 'LINK ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {onStartVoice && (
            <ActionTooltip label="Vocal Link" side="bottom">
              <button
                onClick={onStartVoice}
                className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95"
              >
                <Mic size={18} />
              </button>
            </ActionTooltip>
          )}

          <ActionTooltip label="Identity Nodes" side="bottom">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-4 p-1 pl-4 rounded-xl border border-slate-800 bg-[#0D1117]/80 hover:bg-slate-900/90 transition-all group active:scale-[0.98]"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">
                    {completion.overall}% SECURE
                  </span>
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-80">
                  Kernel Root
                </span>
              </div>

              <div className="relative p-1">
                <ProfileCompletionRing
                  profile={profile}
                  size={38}
                  strokeWidth={4}
                  showText={false}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-[10px]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </button>
          </ActionTooltip>
        </div>
      </div>
    </header>
  );
};
