import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContributionFeedback } from '@/data';

interface ContributionCardProps {
  contribution: ContributionFeedback | null;
  visible: boolean;
  onClose: () => void;
}

export const ContributionCard: React.FC<ContributionCardProps> = ({
  contribution,
  visible,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {visible && contribution && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="fixed bottom-24 left-1/2 z-40 w-[min(92vw,620px)] -translate-x-1/2 rounded-2xl border border-indigo-400/30 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Contribution
              </p>
              <p className="mt-1 truncate text-sm text-slate-100">{contribution.logSummary}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-400 hover:text-slate-100"
            >
              Close
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contribution.affectedDimensions.map((delta) => (
              <div key={delta.dimension} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <p className="text-xs font-semibold text-slate-100">{delta.dimension}</p>
                <p
                  className={`text-xs ${
                    delta.delta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {delta.scoreBefore} {'->'} {delta.scoreAfter} ({delta.delta >= 0 ? '+' : ''}
                  {delta.delta})
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
