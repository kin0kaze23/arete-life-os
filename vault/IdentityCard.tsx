import React from 'react';
import { UserProfile, UserRole } from '@/data/types';
import { Shield, Zap, Fingerprint, Activity, Edit2 } from 'lucide-react';
// import { ProfileCompletionRing } from '@/shared';

interface IdentityCardProps {
  profile: UserProfile;
  role: UserRole;
  isEditing?: boolean;
  onEditToggle?: () => void;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({
  profile,
  role,
  isEditing,
  onEditToggle,
}) => {
  const coherenceScore = profile.coherenceScore || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0A0C14] border border-slate-800/80 p-6 group">
      {/* Glitch/Grid Effect Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Avatar / Coherence Ring */}
        <div className="mb-4 relative">
          <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl shadow-indigo-900/20">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent" />
            <span className="text-3xl font-black text-indigo-100 tracking-tighter">
              {profile.identify.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#02040a] rounded-full p-1 border border-slate-800">
            <svg width="32" height="32" viewBox="0 0 32 32" className="transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - coherenceScore / 100)}
                className="text-indigo-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Name & Role */}
        <h2 className="text-xl font-bold text-white tracking-tight mb-1">
          {profile.identify.name || 'Anonymous User'}
        </h2>
        <div className="flex items-center gap-2 mb-6">
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {profile.personal.jobRole || 'Architect'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
            Lvl {Math.floor(coherenceScore / 10)}
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-1 hover:border-indigo-500/30 transition-colors">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Origin</span>
            <span className="text-xs font-semibold text-slate-300 truncate w-full text-center">
              {profile.identify.origin || 'Unknown'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col items-center gap-1 hover:border-indigo-500/30 transition-colors">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Birthday</span>
            <span className="text-xs font-semibold text-slate-300">
              {profile.identify.birthday || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Edit Toggle */}
        <button
          onClick={onEditToggle}
          className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-slate-800 hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all text-xs font-medium"
        >
          <Edit2 size={12} />
          {isEditing ? 'Exit Edit Mode' : 'Edit Identity'}
        </button>
      </div>
    </div>
  );
};
