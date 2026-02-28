import React from 'react';
import {
  LayoutDashboard,
  Database,
  BookOpen,
  MessageSquare,
  Settings,
  Plus,
} from 'lucide-react';
import { FamilySpace } from '@/data';
import { AreteLogo } from '@/shared';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  familySpace: FamilySpace;
  activeUserId: string;
  onSwitchUser: (id: string) => void;
  onAddMember?: (name: string) => void;
  onCapture?: () => void;
}

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Today, priorities, and inbox',
    icon: LayoutDashboard,
  },
  {
    id: 'vault',
    label: 'My Life',
    description: 'Profile, knowledge, and records',
    icon: Database,
  },
  {
    id: 'stream',
    label: 'Journal',
    description: 'Logs organized by category',
    icon: BookOpen,
  },
  {
    id: 'chat',
    label: 'Assistant',
    description: 'Ask Aura from your context',
    icon: MessageSquare,
  },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  familySpace,
  activeUserId,
  onSwitchUser,
  onAddMember,
  onCapture,
}) => {
  const activeMember = familySpace.members.find((member) => member.id === activeUserId);
  const canShowMembers = familySpace.members.length > 1 || Boolean(onAddMember);

  return (
    <nav className="hidden h-full w-[288px] shrink-0 border-r border-white/10 bg-[#08111d] px-5 py-5 xl:flex xl:flex-col">
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
      >
        <div className="flex items-center gap-3">
          <AreteLogo size={36} />
          <div>
            <p className="text-base font-semibold tracking-tight text-slate-100">Areté Life OS</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Personal command center
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onCapture}
        className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400"
      >
        <Plus size={16} /> Capture
      </button>

      <div className="mt-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-blue-300/35 bg-blue-500/14 text-white'
                  : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active ? 'bg-blue-500/20 text-blue-100' : 'bg-white/[0.04] text-slate-400'
                }`}
              >
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {canShowMembers && (
        <section className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Active workspace
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {activeMember?.identify.name || 'User'}
          </p>
          <div className="mt-3 space-y-2">
            {familySpace.members.map((member) => {
              const active = member.id === activeUserId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSwitchUser(member.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-xs transition ${
                    active
                      ? 'border-blue-300/35 bg-blue-500/14 text-white'
                      : 'border-transparent bg-black/20 text-slate-300 hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                      active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {member.identify.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{member.identify.name || 'User'}</span>
                </button>
              );
            })}
          </div>
          {onAddMember && (
            <button
              type="button"
              onClick={() => {
                const name = prompt('Add member name');
                if (name && name.trim()) onAddMember(name.trim());
              }}
              className="mt-3 w-full rounded-xl border border-dashed border-white/14 px-3 py-2 text-left text-xs text-slate-400 transition hover:border-white/30 hover:text-slate-200"
            >
              + Add workspace user
            </button>
          )}
        </section>
      )}

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Daily loop
          </p>
          <p className="mt-1">Capture, review, ask, then plan the next move.</p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
            activeTab === 'settings'
              ? 'border-blue-300/35 bg-blue-500/14 text-white'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
            <Settings size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">Settings</span>
            <span className="block text-xs text-slate-400">Health, sync, Telegram, and storage</span>
          </span>
        </button>
      </div>
    </nav>
  );
};
