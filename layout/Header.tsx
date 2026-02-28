import React from 'react';
import { Search, Command } from 'lucide-react';
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

const TAB_META: Record<
  string,
  {
    title: string;
    subtitle: string;
  }
> = {
  dashboard: {
    title: 'Today',
    subtitle: 'What matters now.',
  },
  vault: {
    title: 'Life',
    subtitle: 'Facts, profile, and memory.',
  },
  stream: {
    title: 'Journal',
    subtitle: 'Signals and timeline.',
  },
  chat: {
    title: 'Aura',
    subtitle: 'Ask from your private context.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Health and controls.',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  profile,
  isGeneratingTasks,
  onOpenProfile,
  onOpenCommandPalette,
}) => {
  const meta = TAB_META[activeTab] || TAB_META.dashboard;
  const userName = profile.identify.name || 'User';
  const completion = getProfileCompletion(profile);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0d141d]/90 px-6 py-3 backdrop-blur-xl xl:px-8">
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-100 xl:text-[1.65rem]">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{meta.subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 xl:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                isGeneratingTasks ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-medium text-slate-300">
              {isGeneratingTasks ? 'Thinking' : 'Ready'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-slate-300 transition hover:border-white/18 hover:bg-white/[0.05] xl:flex"
          >
            <Search size={14} className="text-slate-400" />
            <span className="text-xs font-medium">Search</span>
            <span className="ml-1 flex items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              <Command size={10} /> K
            </span>
          </button>

          <ActionTooltip label="Open My Life" side="bottom">
            <button
              type="button"
              onClick={onOpenProfile}
              className="group flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] p-1.5 pl-3 transition hover:border-white/18 hover:bg-white/[0.05]"
            >
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-slate-100">{userName}</p>
                <p className="text-[11px] text-slate-500">{completion.overall}% complete</p>
              </div>
              <div className="relative">
                <ProfileCompletionRing profile={profile} size={36} strokeWidth={4} showText={false} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7ea3ff] text-[10px] font-bold text-slate-950">
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
