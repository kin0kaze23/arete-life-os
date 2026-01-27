import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Activity,
  Wallet,
  Users,
  Compass,
  ArrowUpRight,
  X,
  WifiOff,
  ChevronDown,
  Sparkles,
  BrainCircuit,
} from 'lucide-react';
import { DailyTask, Category, UserProfile } from '@/data';
import { tokens } from './design-tokens';

export const NeuralProcessor: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-6">
    <div className="relative">
      <div className="w-24 h-24 rounded-full border border-indigo-500/20 animate-[spin_3s_linear_infinite]" />
      <div className="absolute inset-0 w-24 h-24 rounded-full border-t-2 border-indigo-500 animate-[spin_1s_linear_infinite]" />
      <div className="absolute inset-4 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
      <BrainCircuit className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
    </div>
    <div className="text-center space-y-1">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">
        Synthesizing Neural Signal
      </p>
      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
        Assembly of personal context in progress...
      </p>
    </div>
  </div>
);

export const AreteLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <div
    className={`relative flex items-center justify-center ${className}`}
    style={{ width: size, height: size }}
  >
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]"
    >
      <path
        d="M20 85L45 20"
        stroke="url(#arete-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        className="animate-in fade-in slide-in-from-bottom duration-1000"
      />
      <path
        d="M80 85L55 20"
        stroke="url(#arete-grad)"
        strokeWidth="10"
        strokeLinecap="round"
        className="animate-in fade-in slide-in-from-bottom duration-1000 delay-150"
      />
      <path
        d="M35 60H65"
        stroke="url(#arete-grad)"
        strokeWidth="8"
        strokeLinecap="round"
        className="animate-in fade-in slide-in-from-left duration-1000 delay-300"
      />
      <circle cx="50" cy="45" r="4" fill="#818cf8" className="animate-pulse shadow-lg" />
      <defs>
        <linearGradient
          id="arete-grad"
          x1="20"
          y1="85"
          x2="50"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#a5b4fc" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
};

export const NetworkBanner: React.FC = () => (
  <div
    role="alert"
    className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 text-center backdrop-blur-md fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 border-b border-rose-500/20"
  >
    <WifiOff size={12} />
    Neural Link Severed. Edge Computing Active.
  </div>
);

export const BentoCard: React.FC<{
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  onAction?: () => void;
  actionLabel?: string;
  noPadding?: boolean;
}> = ({ children, title, icon, className = '', onAction, actionLabel, noPadding }) => (
  <div
    className={`glass-panel rounded-[3.5rem] overflow-hidden flex flex-col transition-all duration-500 hover:border-white/20 active:scale-[0.99] group ${className}`}
    role="region"
  >
    {(title || icon) && (
      <div className="px-10 pt-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="text-slate-500 group-hover:text-indigo-400 transition-colors duration-500">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 group-hover:text-slate-200 transition-colors duration-500">
              {title}
            </h3>
          )}
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-2"
          >
            {actionLabel || 'Expedite'} <ArrowUpRight size={12} />
          </button>
        )}
      </div>
    )}
    <div className={`flex-1 ${noPadding ? '' : 'px-10 pb-10 pt-2'}`}>{children}</div>
  </div>
);

export const VaultInput: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (v: string) => void;
}> = ({ label, value, placeholder, type = 'text', onChange }) => (
  <div className="group space-y-3">
    <label className="text-[9px] font-black text-slate-500 group-focus-within:text-indigo-400 uppercase tracking-[0.25em] ml-1 transition-colors">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-6 py-5 focus:outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all text-[13px] text-slate-200 placeholder-slate-800 shadow-inner"
    />
  </div>
);

export const RadialProgress: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
}> = ({ value, size = 60, strokeWidth = 4, colorClass = 'text-indigo-500' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-950"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-white">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

export const TaskItem: React.FC<{ task: DailyTask; onToggle: () => void }> = ({
  task,
  onToggle,
}) => (
  <div
    className={`flex items-start gap-5 p-6 rounded-[2rem] border transition-all duration-400 relative group/item ${task.completed ? 'bg-slate-950/40 border-white/5 opacity-40 grayscale' : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60 shadow-lg'}`}
  >
    <button onClick={onToggle} className="mt-1 z-10 transition-transform active:scale-90">
      {task.completed ? (
        <CheckCircle2 className="text-indigo-500" size={22} />
      ) : (
        <Circle className="text-slate-700 hover:text-indigo-400 transition-colors" size={22} />
      )}
    </button>
    <div className="flex-1 min-w-0 pr-10">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h4
          className={`text-sm font-bold truncate transition-all ${task.completed ? 'line-through text-slate-600' : 'text-slate-100'}`}
        >
          {task.title}
        </h4>
        <span
          className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${getCategoryColor(task.category)}`}
        >
          {task.priority}
        </span>
      </div>
      {task.description && !task.completed && (
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">
          {task.description}
        </p>
      )}
    </div>
  </div>
);

export const getCategoryColor = (cat: Category) => {
  switch (cat) {
    case Category.HEALTH:
      return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    case Category.FINANCE:
      return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    case Category.RELATIONSHIPS:
      return 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5';
    case Category.SPIRITUAL:
      return 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5';
    case Category.PERSONAL:
      return 'text-violet-400 border-violet-500/20 bg-violet-500/5';
    case Category.HABIT:
      return 'text-violet-400 border-violet-500/20 bg-violet-500/5';
    default:
      return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
  }
};

export const getProfileCompletion = (profile: UserProfile) => {
  const sections = ['identify', 'personal', 'health', 'finances', 'relationship', 'spiritual'];
  let filled = 0;
  sections.forEach((s) => {
    const data = (profile as any)[s];
    if (
      data &&
      Object.values(data).some((v) =>
        Array.isArray(v) ? v.length > 0 : v !== '' && v !== undefined
      )
    )
      filled++;
  });
  return { overall: Math.round((filled / sections.length) * 100) };
};

export const ProfileCompletionRing: React.FC<{
  profile: UserProfile;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
  showText?: boolean;
}> = ({ profile, size = 120, strokeWidth = 8, onClick, showText = true }) => {
  const completion = getProfileCompletion(profile);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completion.overall / 100) * circumference;
  return (
    <div
      className="relative flex items-center justify-center cursor-pointer group transition-transform hover:scale-105"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-900"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-indigo-500 transition-all duration-1000 ease-out"
        />
      </svg>
      {showText && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
          {completion.overall}%
        </span>
      )}
    </div>
  );
};

export const Button: React.FC<{
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}> = ({
  children,
  size = 'md',
  variant = 'primary',
  onClick,
  type = 'button',
  disabled,
  className = '',
}) => {
  const sizeClass = tokens.button.sizes[size];
  const variantClass = tokens.button.variants[variant];

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`${tokens.button.base} ${sizeClass} ${variantClass} ${tokens.radius.md} ${className}`}
    >
      {children}
    </button>
  );
};

export const Chip: React.FC<{
  children: React.ReactNode;
  color?: 'emerald' | 'rose' | 'indigo' | 'amber' | 'slate' | 'violet';
  tooltip?: string;
}> = ({ children, color = 'slate', tooltip }) => {
  const colorClass = tokens.chip.variants[color];

  if (!tooltip) {
    return <span className={`${tokens.chip.base} ${colorClass}`}>{children}</span>;
  }

  return (
    <div className="relative group">
      <span className={`${tokens.chip.base} ${colorClass} cursor-help`}>{children}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 w-64 pointer-events-none shadow-2xl">
        <p className="text-[10px] text-slate-300 leading-relaxed">{tooltip}</p>
      </div>
    </div>
  );
};

export const ChipInput: React.FC<{
  label: string;
  selected?: string[];
  suggestions?: string[];
  onUpdate: (items: string[]) => void;
}> = ({ label, selected = [], suggestions = [], onUpdate }) => {
  const [inputValue, setInputValue] = useState('');
  const safeSelected = Array.isArray(selected) ? selected : [];
  const add = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !safeSelected.includes(trimmed)) {
      onUpdate([...safeSelected, trimmed]);
      setInputValue('');
    }
  };
  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-slate-950/40 border border-white/5 rounded-2xl focus-within:border-indigo-500/40 transition-all shadow-inner">
        {safeSelected.map((item) => (
          <span
            key={item}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300"
          >
            {item}
            <button
              type="button"
              onClick={() => onUpdate(safeSelected.filter((i) => i !== item))}
              className="hover:text-rose-400 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(inputValue);
            }
          }}
          placeholder="Inject metric..."
          className="flex-1 bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-800 min-w-[140px]"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions
            .filter((s) => !safeSelected.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-xl transition-all border border-white/5"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export const VaultSelect: React.FC<{
  label: string;
  value: string;
  options: readonly string[] | string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="group space-y-3">
    <label className="text-[9px] font-black text-slate-500 group-focus-within:text-indigo-400 uppercase tracking-[0.25em] ml-1 transition-colors">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-6 py-5 focus:outline-none focus:border-indigo-500/40 transition-all text-[13px] text-slate-200 cursor-pointer appearance-none shadow-inner"
      >
        <option value="" disabled>
          Select Path...
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-900">
            {opt}
          </option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-indigo-400 transition-colors">
        <ChevronDown size={16} />
      </div>
    </div>
  </div>
);

export const VaultSlider: React.FC<{
  label: string;
  value: string | number;
  min: number;
  max: number;
  onChange: (v: string) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div className="group space-y-5">
    <div className="flex justify-between items-center px-1">
      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
        {label}
      </label>
      <span className="text-xs font-mono text-indigo-400 font-black tracking-tighter bg-indigo-500/5 px-2 py-1 rounded-lg border border-indigo-500/10">
        {value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
    />
  </div>
);

export const VaultSection: React.FC<{
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  color: string;
  isStale?: boolean;
}> = ({ children, title, icon, color, isStale }) => (
  <div
    className={`glass-panel rounded-[3rem] p-10 border transition-all duration-700 ${isStale ? 'border-amber-500/30 bg-amber-500/[0.01]' : 'border-white/5 bg-white/[0.01]'} space-y-10`}
    role="group"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div
          className={`p-5 rounded-[1.5rem] bg-slate-950 border border-white/5 shadow-2xl ${color}`}
        >
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
        <div>
          <h4 className="text-2xl font-black tracking-tighter text-white uppercase italic">
            {title}
          </h4>
          <div
            className={`h-1 w-16 ${isStale ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500/40'} rounded-full mt-2`}
          ></div>
        </div>
      </div>
      {isStale && (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <Sparkles size={10} className="text-amber-500" />
          <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">
            Signal Fading - Update Required
          </span>
        </div>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">{children}</div>
  </div>
);

export const ActionTooltip: React.FC<{
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ label, children, side = 'top' }) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div
      className={`absolute ${side === 'top' ? 'bottom-full mb-3' : side === 'bottom' ? 'top-full mt-3' : side === 'left' ? 'right-full mr-3' : 'left-full ml-3'} px-4 py-2 bg-slate-900/95 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/10 scale-95 group-hover:scale-100`}
    >
      {label}
    </div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
);
