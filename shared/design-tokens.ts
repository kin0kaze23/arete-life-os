/**
 * AURA LIFE OS | DARK PREMIUM DESIGN SYSTEM
 * The source of truth for all aesthetic constants.
 */

export const TOKENS = {
  colors: {
    background: {
      void: '#02040a', // Primary page background
      deep: '#08090C', // Sidebars and drawers
      elevated: '#0D1117', // Bento cards and modals
      active: '#181b21', // Hover and active states
    },
    brand: {
      indigo: '#6366f1', // Primary action / system brand
      rose: '#f43f5e', // Risk / Danger / Urgency
      emerald: '#10b981', // Success / Health / Verification
      amber: '#f59e0b', // Warning / Insight / Calibration
      cyan: '#06b6d4', // Social / Relationships
    },
    text: {
      primary: '#e6edf3', // High contrast body
      secondary: '#8b949e', // Dimmed descriptions
      muted: '#484f58', // Small metadata / disabled
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      focus: 'rgba(99, 102, 241, 0.4)',
    },
  },
  radius: {
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px (Inputs / Items)
    xl: '2rem', // 32px (Bento Sections)
    full: '3rem', // 48px (Primary View Panels)
  },
  blur: {
    standard: '40px',
    heavy: '80px',
  },
  animations: {
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    pulse: 'neural-pulse 4s infinite ease-in-out',
  },
};

export const tokens = {
  radius: {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-[2rem]',
    xl: 'rounded-[2.5rem]',
    full: 'rounded-full',
  },
  button: {
    base: 'font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50',
    sizes: {
      sm: 'px-3 py-2 text-[9px]',
      md: 'px-4 py-3 text-[10px]',
      lg: 'px-6 py-4 text-[11px]',
    },
    variants: {
      primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20',
      secondary:
        'bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/30',
      ghost: 'bg-transparent text-slate-500 hover:text-white hover:bg-white/5',
      danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20',
    },
  },
  chip: {
    base: 'px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest',
    variants: {
      emerald: 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10',
      rose: 'bg-rose-500/5 text-rose-300 border border-rose-500/10',
      indigo: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      slate: 'bg-slate-900 text-slate-400 border border-white/5',
      violet: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
    },
  },
  panel: {
    base: 'glass-panel border border-white/5 bg-slate-950/40',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  text: {
    label: 'text-[9px] font-black uppercase tracking-[0.3em] text-slate-500',
    labelLg: 'text-[10px] font-black uppercase tracking-[0.4em] text-slate-500',
    body: 'text-[10px] text-slate-400',
    heading: 'text-xl font-black text-white',
    subheading: 'text-lg font-black text-white',
  },
};

export default TOKENS;
