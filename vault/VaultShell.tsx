import React from 'react';
import { Search } from 'lucide-react';
import { UserProfile } from '@/data/types';
import { VaultSidebar } from './VaultSidebar';

interface VaultShellProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  profile: UserProfile;
  onSearch?: (query: string) => void;
}

const PATH_META: Record<string, { label: string; description: string }> = {
  '/': {
    label: 'Overview',
    description: 'Start here to understand what your vault already contains and what needs filling in.',
  },
  '/stream/logs': {
    label: 'Journal Records',
    description: 'Browse raw memory entries and edit what should stay in your vault.',
  },
  '/stream/knowledge': {
    label: 'Knowledge Base',
    description: 'Review structured claims and keep only what is accurate and useful.',
  },
  '/identity/core': {
    label: 'Core Profile',
    description: 'Your name, origin, location, and foundational identity details.',
  },
  '/identity/personal': {
    label: 'Personal Profile',
    description: 'Your role, interests, personality, and working style.',
  },
  '/identity/bio': {
    label: 'Health & Body',
    description: 'Biological and health details that help Areté personalize guidance.',
  },
  '/identity/finance': {
    label: 'Financial Assets',
    description: 'Financial reality, commitments, and resources.',
  },
  '/identity/social': {
    label: 'Relationships',
    description: 'Important people, family context, and social dynamics.',
  },
  '/identity/spiritual': {
    label: 'Beliefs & Values',
    description: 'Convictions, non-negotiables, and deeper guiding principles.',
  },
};

export const VaultShell: React.FC<VaultShellProps> = ({
  children,
  activePath,
  onNavigate,
  profile,
  onSearch,
}) => {
  const meta = PATH_META[activePath] || {
    label: 'My Life',
    description: 'Review and maintain the personal knowledge that powers Areté.',
  };

  return (
    <div className="flex h-full overflow-hidden rounded-[28px] border border-white/10 bg-[#091122] text-slate-200">
      <VaultSidebar activePath={activePath} onNavigate={onNavigate} profile={profile} />

      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#0d162a] text-slate-300">
        <div className="shrink-0 border-b border-white/10 bg-[#0b1426]/88 px-6 py-5 backdrop-blur-sm xl:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">My Life</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">{meta.label}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{meta.description}</p>
            </div>

            <div className="relative w-full xl:w-[320px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search profile, memory, or knowledge..."
                onChange={(e) => onSearch?.(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-blue-300/35"
              />
            </div>
          </div>
        </div>

        <div className="premium-scrollbar relative flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
