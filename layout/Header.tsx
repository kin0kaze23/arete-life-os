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
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  dashboard: {
    eyebrow: 'Dashboard',
    title: 'Daily command center',
    description: 'See what matters now, what is pending, and what deserves your next action.',
  },
  vault: {
    eyebrow: 'My Life',
    title: 'Identity, memory, and knowledge graph',
    description: 'Review what Areté knows about you and keep your profile grounded in reality.',
  },
  stream: {
    eyebrow: 'Journal',
    title: 'Categorized life timeline and logs',
    description: 'Search and inspect your journal history without losing the thread.',
  },
  chat: {
    eyebrow: 'Assistant',
    title: 'Ask Aura from your private context',
    description: 'Use your private vault as context and ask for guidance, summaries, or next moves.',
  },
  settings: {
    eyebrow: 'Settings',
    title: 'Workspace controls',
    description: 'Check system health, Telegram, sync, backups, and workspace behavior.',
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/88 px-6 py-4 backdrop-blur-xl xl:px-8">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {meta.eyebrow}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-100 xl:text-2xl">
            {meta.title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">{meta.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 xl:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                isGeneratingTasks ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-medium text-slate-300">
              {isGeneratingTasks ? 'Refreshing' : 'Ready'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] xl:flex"
          >
            <Search size={14} className="text-slate-400" />
            <span className="text-xs font-medium">Search or run command</span>
            <span className="ml-1 flex items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              <Command size={10} /> K
            </span>
          </button>

          <ActionTooltip label="Open My Life" side="bottom">
            <button
              type="button"
              onClick={onOpenProfile}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pl-3 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-slate-100">{userName}</p>
                <p className="text-[11px] text-slate-400">{completion.overall}% complete</p>
              </div>
              <div className="relative">
                <ProfileCompletionRing profile={profile} size={38} strokeWidth={4} showText={false} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border border-blue-300/30 bg-blue-500/20 text-[10px] font-bold text-blue-100">
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
