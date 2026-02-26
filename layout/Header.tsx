import React from 'react';
import { Mic, Search, Command } from 'lucide-react';
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
  onOpenProfile,
  onStartVoice,
  onOpenCommandPalette,
}) => {
  const userName = profile.identify.name || 'User';
  const completion = getProfileCompletion(profile);
  const tabLabel =
    activeTab === 'dashboard'
      ? 'Dashboard'
      : activeTab === 'vault'
        ? 'My Life'
        : activeTab === 'stream'
          ? 'Journal'
          : activeTab === 'chat'
            ? 'Assistant'
            : 'Settings';
  const tabDescription =
    activeTab === 'dashboard'
      ? 'Daily command center'
      : activeTab === 'vault'
        ? 'Identity, memory, and knowledge graph'
        : activeTab === 'stream'
          ? 'Categorized life timeline and logs'
          : activeTab === 'chat'
            ? 'Ask Aura from your private context'
            : 'Workspace controls';

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/72 px-6 py-4 backdrop-blur-xl xl:px-10">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {tabLabel}
          </p>
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-100 xl:text-xl">
            {tabDescription}
          </h2>
        </div>

        <button
          onClick={onOpenCommandPalette}
          className="group hidden items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] xl:flex"
        >
          <Search size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-300">Search or run command</span>
          <span className="ml-2 flex items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            <Command size={10} />
            K
          </span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 md:flex">
          <span
            className={`h-2 w-2 rounded-full ${
              isGeneratingTasks ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-300">
            {isGeneratingTasks ? 'Refreshing plan' : 'Synced'}
          </span>
        </div>

        {onStartVoice && (
          <ActionTooltip label="Voice Input" side="bottom">
            <button
              onClick={onStartVoice}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:border-blue-300/40 hover:bg-blue-500/15 hover:text-blue-100"
            >
              <Mic size={16} />
            </button>
          </ActionTooltip>
        )}

        <ActionTooltip label="Open My Life" side="bottom">
          <button
            onClick={onOpenProfile}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-1 pl-3 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-[11px] font-semibold text-slate-100">{userName}</span>
              <span className="text-[10px] text-slate-400">{completion.overall}% complete</span>
            </div>

            <div className="relative p-1">
              <ProfileCompletionRing profile={profile} size={36} strokeWidth={4} showText={false} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-blue-300/30 bg-blue-500/20 text-[10px] font-bold text-blue-100">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </button>
        </ActionTooltip>
      </div>
    </header>
  );
};
