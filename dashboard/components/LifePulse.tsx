import React from 'react';
import { motion } from 'framer-motion';

export interface ScoreData {
  id: string;
  label: string;
  score: number;
  change: number; // e.g. +3, -2
  trendText: string;
  colorVar: string;
}

interface LifePulseProps {
  scores: ScoreData[];
  overallBalance: number;
  balanceText: string;
}

export const LifePulse: React.FC<LifePulseProps> = ({ scores, overallBalance, balanceText }) => {
  return (
    <div className="glass-panel p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white">Your Life Pulse</h3>
          <p className="text-sm text-white/50 font-medium">Real-time dimension tracking</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black">{overallBalance}%</span>
          <span className="text-xs uppercase tracking-widest text-[#fbbf24] font-bold">
            {balanceText}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {scores.map((s) => (
          <div key={s.id} className="group relative">
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span className="text-white/80">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{s.score}%</span>
                {s.change !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: s.change > 0 ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs ${
                      s.change > 0 ? 'text-emerald-400' : 'text-rose-400'
                    } flex items-center font-bold`}
                  >
                    {s.change > 0 ? '↑' : '↓'} {Math.abs(s.change)}% {s.trendText}
                  </motion.span>
                )}
                {s.change === 0 && (
                  <span className="text-xs text-white/40 flex items-center">→ steady</span>
                )}
              </div>
            </div>

            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.score}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: `var(${s.colorVar})` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
