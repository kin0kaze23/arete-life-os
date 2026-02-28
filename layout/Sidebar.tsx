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
  { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
  { id: 'vault', label: 'Life', icon: Database },
  { id: 'stream', label: 'Journal', icon: BookOpen },
  { id: 'chat', label: 'Aura', icon: MessageSquare },
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
    <nav className="hidden h-full w-[232px] shrink-0 border-r border-white/8 bg-[#0c131c] px-4 py-4 xl:flex xl:flex-col">
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className="rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-4 text-left transition hover:border-white/16 hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <AreteLogo size={34} />
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-slate-100">Areté</p>
            <p className="text-[11px] text-slate-500">Life OS</p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onCapture}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#86a8ff] px-4 text-sm font-semibold text-slate-950 transition hover:bg-[#99b6ff]"
      >
        <Plus size={16} /> Capture
      </button>

      <div className="mt-5 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm transition ${
                active
                  ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active ? 'bg-[#7ea3ff] text-slate-950' : 'bg-white/[0.04] text-slate-400'
                }`}
              >
                <Icon size={16} />
              </span>
              <span className="font-medium tracking-[0.01em]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {canShowMembers && (
        <section className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.025] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Workspace
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {activeMember?.identify.name || 'User'}
              </p>
            </div>
            {onAddMember && (
              <button
                type="button"
                onClick={() => {
                  const name = prompt('Add member name');
                  if (name && name.trim()) onAddMember(name.trim());
                }}
                className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 transition hover:border-white/20 hover:text-slate-200"
              >
                Add
              </button>
            )}
          </div>

          <div className="mt-3 space-y-1.5">
            {familySpace.members.map((member) => {
              const active = member.id === activeUserId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSwitchUser(member.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition ${
                    active
                      ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                      active ? 'bg-[#7ea3ff] text-slate-950' : 'bg-[#1a2533] text-slate-300'
                    }`}
                  >
                    {member.identify.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{member.identify.name || 'User'}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm transition ${
            activeTab === 'settings'
              ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
          }`}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              activeTab === 'settings' ? 'bg-[#7ea3ff] text-slate-950' : 'bg-white/[0.04] text-slate-400'
            }`}
          >
            <Settings size={16} />
          </span>
          <span className="font-medium tracking-[0.01em]">Settings</span>
        </button>
      </div>
    </nav>
  );
};
