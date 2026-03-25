import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Wallet, Heart, Zap, User } from 'lucide-react';
import { Category, Goal, MemoryItem } from '@/data';
import { computeScoreInternal, computeTrend, getTrendSymbol } from './ScoreStrip';

interface DimensionPulseBarProps {
  memoryItems: MemoryItem[];
  goals: Goal[];
}

const DIMENSIONS = [
  { category: Category.HEALTH, label: 'Health', icon: <Activity size={14} /> },
  { category: Category.FINANCE, label: 'Finance', icon: <Wallet size={14} /> },
  { category: Category.RELATIONSHIPS, label: 'Relationships', icon: <Heart size={14} /> },
  { category: Category.SPIRITUAL, label: 'Spiritual', icon: <Zap size={14} /> },
  { category: Category.PERSONAL, label: 'Personal', icon: <User size={14} /> },
];

const getDeltaColor = (delta: number) => {
  if (delta >= 3) return 'text-emerald-400';
  if (delta <= -3) return 'text-rose-400';
  return 'text-slate-400';
};

export const DimensionPulseBar: React.FC<DimensionPulseBarProps> = ({ memoryItems, goals }) => {
  const [highlighted, setHighlighted] = useState<Set<Category>>(new Set());
  const prevCountRef = useRef(memoryItems.length);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    if (memoryItems.length > prevCount) {
      const added = memoryItems.slice(prevCount); // Changed from slice(0, ...) to slice(prevCount) 
      const next = new Set<Category>(added.map((item) => item.category));
      setHighlighted(next);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setHighlighted(new Set()), 4000);
    }
    prevCountRef.current = memoryItems.length;
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [memoryItems]);

  const rows = DIMENSIONS.map((dimension) => {
    const score = computeScoreInternal(memoryItems, goals, dimension.category);
    // For now, since there's no previous week score calculation that actually uses time range
    // We're calculating the score as of a week ago by omitting recent entries
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const pastWeekMemories = memoryItems.filter(item => item.timestamp < weekAgo);
    const scoreWeekAgo = computeScoreInternal(pastWeekMemories, goals, dimension.category);
    const delta = score - scoreWeekAgo;
    const trend = computeTrend(memoryItems, goals, dimension.category);
    return { ...dimension, score, delta, trend };
  });

  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row) => {
        const highlight = highlighted.has(row.category);
        return (
          <div
            key={row.category}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all ${
              highlight
                ? 'border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <span className="text-slate-400">{row.icon}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {row.label}
            </span>
            <span className="text-sm font-mono font-bold text-slate-100">
              {row.score > 0 ? `${row.score}%` : '--'}
            </span>
            <span className={`text-[11px] font-bold ${getDeltaColor(row.delta)}`}>
              {row.score > 0 ? `${getTrendSymbol(row.trend)} ${row.delta >= 0 ? '+' : ''}${row.delta}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};
