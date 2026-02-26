import React from 'react';
import {
  LayoutDashboard,
  Database,
  BookOpen,
  MessageSquare,
  Settings,
  Plus,
  ChevronsUpDown,
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
  return (
    <nav className="h-full w-[90px] border-r border-white/10 bg-[#0a111f]/90 p-4 backdrop-blur-xl xl:w-[290px]">
      <div className="flex h-full flex-col gap-5">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          <AreteLogo size={34} />
          <div className="hidden xl:block">
            <p className="text-sm font-semibold tracking-tight text-slate-100">Areté OS</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Personal Operating Layer
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onCapture}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_22px_rgba(37,99,235,0.35)] transition hover:bg-blue-400"
        >
          <Plus size={16} />
          <span className="hidden xl:inline">Capture</span>
        </button>

        <div className="space-y-1.5">
          <NavButton
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
          />
          <NavButton
            active={activeTab === 'vault'}
            onClick={() => setActiveTab('vault')}
            icon={<Database size={18} />}
            label="My Life"
          />
          <NavButton
            active={activeTab === 'stream'}
            onClick={() => setActiveTab('stream')}
            icon={<BookOpen size={18} />}
            label="Journal"
          />
          <NavButton
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare size={18} />}
            label="Assistant"
          />
        </div>

        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2 xl:block">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Workspace
            </p>
            <ChevronsUpDown size={12} className="text-slate-500" />
          </div>
          <div className="mb-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
            Active: <span className="font-semibold">{activeMember?.identify.name || 'User'}</span>
          </div>
          <div className="space-y-1">
            {familySpace.members.map((member) => {
              const active = activeUserId === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSwitchUser(member.id)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                    active
                      ? 'border-blue-300/40 bg-blue-500/18 text-white'
                      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                      active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {member.identify.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{member.identify.name || 'User'}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                const name = prompt('Add member name');
                if (name && name.trim()) onAddMember?.(name.trim());
              }}
              className="mt-1 w-full rounded-xl border border-dashed border-white/14 px-2.5 py-2 text-left text-xs text-slate-400 transition hover:border-white/30 hover:text-slate-200"
            >
              + Add workspace user
            </button>
          </div>
        </div>

        <div className="mt-auto hidden rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400 xl:block">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Daily Workflow</p>
          <p className="mt-1">Capture, Journal, Review, Plan</p>
        </div>

        <div className="mt-auto xl:mt-0">
          <p className="mb-1 hidden px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 xl:block">
            System
          </p>
          <NavButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={18} />}
            label="Settings"
          />
        </div>
      </div>
    </nav>
  );
};

const NavButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition ${
      active
        ? 'border-blue-300/35 bg-blue-500/14 text-white'
        : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'
    }`}
  >
    <span className={active ? 'text-blue-200' : ''}>{icon}</span>
    <span className="hidden text-[12px] font-medium tracking-[0.02em] xl:block">{label}</span>
  </button>
);
