import React, { useState } from 'react';
import {
  LayoutDashboard,
  Database,
  BookOpen, // Changed from Activity for Journal
  MessageSquare, // Changed from BrainCircuit for Assistant
  Settings,
  Plus,
  X,
  Check,
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
    <nav className="w-20 md:w-64 bg-[#08090C] border-r border-slate-800/50 flex flex-col items-center md:items-stretch p-4 gap-6 transition-all h-full">
      <div
        className="flex items-center gap-3 px-2 mt-2 group cursor-pointer"
        onClick={() => setActiveTab('dashboard')}
      >
        <AreteLogo size={36} />
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
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
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
        </div>
      </div>

      <button
        onClick={onCapture}
        className="w-full bg-slate-100 hover:bg-white text-slate-900 rounded-xl p-3 flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 group border border-transparent hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus size={18} className="text-slate-900" />
        <span className="hidden md:block font-black uppercase tracking-widest text-[10px]">
          Capture
        </span>
      </button>

      <div className="flex flex-col gap-1 w-full mt-2">
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

      <div className="mt-auto w-full">
        <NavButton
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          icon={<Settings size={18} />}
          label="Settings"
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
        ? 'bg-white/5 text-white border border-white/10 shadow-lg shadow-black/20'
        : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent'
    }`}
  >
    <div className={`transition-colors ${active ? 'text-indigo-400' : 'group-hover:text-white'}`}>
      {icon}
    </div>
    <span className="hidden md:block font-bold text-[11px] uppercase tracking-widest transition-opacity duration-300">
      {label}
    </span>
  </button>
);
