import React, { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  BrainCircuit,
  Plus,
  X,
  Check,
  Database,
  Settings,
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  familySpace,
  activeUserId,
  onSwitchUser,
  onAddMember,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && onAddMember) {
      onAddMember(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <nav className="w-20 md:w-64 bg-[#08090C] border-r border-slate-800/50 flex flex-col items-center md:items-stretch p-4 gap-8 transition-all h-full">
      <div
        className="flex items-center gap-3 px-2 mt-2 group cursor-pointer"
        onClick={() => setActiveTab('dashboard')}
      >
        <AreteLogo size={42} />
        <div className="hidden md:flex flex-col">
          <span className="font-black text-sm tracking-tighter text-white uppercase group-hover:text-indigo-400 transition-colors">
            Areté OS
          </span>
          <span className="text-[8px] font-black tracking-[0.3em] text-indigo-500 uppercase">
            Neural Kernel 3.2
          </span>
        </div>
      </div>

      <div className="px-1 space-y-4">
        <div className="flex flex-col gap-2">
          {familySpace.members.map((member) => (
            <button
              key={member.id}
              onClick={() => onSwitchUser(member.id)}
              className={`flex items-center gap-3 p-2 rounded-xl transition-all border w-full text-left group ${
                activeUserId === member.id
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                  activeUserId === member.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {member.identify.name.charAt(0)}
              </div>
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest truncate flex-1">
                {member.identify.name || 'User'}
              </span>
            </button>
          ))}

          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-3 p-2 rounded-xl border border-dashed border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700 transition-all w-full group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900/50">
                <Plus size={14} />
              </div>
              <span className="hidden md:block text-[8px] font-black uppercase tracking-widest">
                Add Node
              </span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="relative">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name..."
                className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-2 text-[10px] text-white outline-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="submit" className="text-emerald-500">
                  <Check size={12} />
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="text-slate-600">
                  <X size={12} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full mt-4">
        <NavButton
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          icon={<LayoutDashboard size={18} />}
          label="Command Center"
        />
        <NavButton
          active={activeTab === 'vault'}
          onClick={() => setActiveTab('vault')}
          icon={<Database size={18} />}
          label="The Vault"
        />
        <NavButton
          active={activeTab === 'stream'}
          onClick={() => setActiveTab('stream')}
          icon={<Activity size={18} />}
          label="Life Stream"
        />
        <NavButton
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
          icon={<BrainCircuit size={18} />}
          label="Neural Oracle"
        />
      </div>

      <div className="mt-auto w-full">
        <NavButton
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          icon={<Settings size={18} />}
          label="Operational Hub"
        />
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
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all w-full group ${
      active
        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
        : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
    }`}
  >
    <div className={`${active ? 'text-indigo-400' : 'group-hover:text-slate-300'}`}>{icon}</div>
    <span className="hidden md:block font-bold text-[11px] uppercase tracking-widest">{label}</span>
  </button>
);
