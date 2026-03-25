import React from 'react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  greeting: string;
  summary: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  greeting,
  summary,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel = 'Log check-in',
  secondaryLabel = 'Schedule event',
}) => {
  const showActions = Boolean(onPrimaryAction || onSecondaryAction);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400"
          >
            {dateStr}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-semibold text-white tracking-tight text-balance"
          >
            {greeting}
          </motion.h1>
          <p className="text-sm text-slate-400 max-w-2xl text-pretty">{summary}</p>
        </div>

        {showActions && (
          <div className="flex flex-wrap gap-2">
            {onPrimaryAction && (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {primaryLabel}
              </button>
            )}
            {onSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-[12px] font-bold uppercase tracking-wider text-slate-200 hover:text-white hover:border-indigo-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
