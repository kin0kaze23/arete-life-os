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
    description: 'The stable layer behind your dashboard and assistant.',
  },
  '/stream/logs': {
    label: 'Journal',
    description: 'Raw entries and edits.',
  },
  '/stream/knowledge': {
    label: 'Facts',
    description: 'Structured claims Aura can rely on.',
  },
  '/identity/core': {
    label: 'Core',
    description: 'Name, origin, location.',
  },
  '/identity/personal': {
    label: 'Personal',
    description: 'Role, interests, working style.',
  },
  '/identity/bio': {
    label: 'Health',
    description: 'Body and health context.',
  },
  '/identity/finance': {
    label: 'Money',
    description: 'Financial reality and commitments.',
  },
  '/identity/social': {
    label: 'People',
    description: 'Relationships and social context.',
  },
  '/identity/spiritual': {
    label: 'Values',
    description: 'Beliefs and non-negotiables.',
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
    description: 'Review and maintain your personal knowledge base.',
  };

  return (
    <div className="flex h-full overflow-hidden rounded-[28px] border border-white/8 bg-[#101824] text-slate-200">
      <VaultSidebar activePath={activePath} onNavigate={onNavigate} profile={profile} />

      <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#121b28] text-slate-300">
        <div className="shrink-0 border-b border-white/8 bg-[#101824]/88 px-6 py-4 backdrop-blur-sm xl:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-100">{meta.label}</h2>
              <p className="mt-1 text-sm text-slate-400">{meta.description}</p>
            </div>

            <div className="relative w-full xl:w-[300px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search My Life"
                onChange={(e) => onSearch?.(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-blue-300/35"
              />
            </div>
          </div>
        </div>

        <div className="premium-scrollbar relative flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
