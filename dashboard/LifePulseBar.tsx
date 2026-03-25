import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Wallet, Heart, Zap, User } from 'lucide-react';
import { Category, Goal, MemoryEntry } from '@/data';
import { computeScoreInternal, computeTrend, getTrendSymbol } from './ScoreStrip'; // We'll need to create this as an interface

interface LifePulseBarProps {
  memoryEntries: MemoryEntry[];
  goals: Goal[];
}

const DIMENSIONS = [
  { category: Category.HEALTH, label: 'Health', icon: <Activity size={14} /> },
  { category: Category.FINANCE, label: 'Finance', icon: <Wallet size={14} /> },
  { category: Category.RELATIONSHIPS, label: 'Relationships', icon: <Heart size={14} /> },
  { category: Category.SPIRITUAL, label: 'Spiritual', icon: <Zap size={14} /> },
  { category: Category.PERSONAL, label: 'Personal', icon: <User size={14} /> },
];

interface InternalLifePulseBarProps extends LifePulseBarProps {
  // These props are to allow us to handle scores and trends internally
  // since ScoreStrip apparently got removed from the codebase
}

// Placeholder implementations until we create ScoreStrip
const computeScoreInternalStub = (entries: MemoryEntry[], goals: Goal[], category: Category): number => {
  // Placeholder logic - return a mock score based on category
  const categoryEntries = entries.filter(e => e.category === category);
  if (categoryEntries.length === 0) return 0;
  // Generate a mock score based on number of entries
  return Math.min(100, Math.floor(categoryEntries.length * 15));
};

const computeTrendStub = (entries: MemoryEntry[], goals: Goal[], category: Category): 'up' | 'down' | 'stable' => {
  // Placeholder logic
  const categoryEntries = entries.filter(e => e.category === category);
  if (categoryEntries.length < 2) return 'stable';
  
  // Check if recent entries indicate an uptick
  const recent = categoryEntries.slice(-3);
  if (recent.length > 1) {
    // Simple logic that if we have more recent entries, trending up
    if (recent.length > 2) return 'up';
  }
  return 'stable';
};

const getTrendSymbolStub = (trend: 'up' | 'down' | 'stable'): string => {
  return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
};

const getDeltaColor = (delta: number) => {
  if (delta >= 3) return 'text-emerald-400';
  if (delta <= -3) return 'text-rose-400';
  return 'text-slate-400';
};

export const LifePulseBar: React.FC<LifePulseBarProps> = ({ memoryEntries, goals }) => {
  const [highlighted, setHighlighted] = useState<Set<Category>>(new Set());
  const prevCountRef = useRef(memoryEntries.length);
  const timeoutRef = useRef<number | null>(null);

  // Highlight newly added entries as before
  useEffect(() => {
    const prevCount = prevCountRef.current;
    if (memoryEntries.length > prevCount) {
      // Note: we can't properly distinguish by category from memory entries,
      // this is best approximation
      const added = memoryEntries.slice(prevCount); // from previous count
      const next = new Set<Category>(added.map((entry) => entry.category));
      setHighlighted(next);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setHighlighted(new Set()), 4000);
    }
    prevCountRef.current = memoryEntries.length;
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [memoryEntries]);

  // Compute scores and trends for each dimension
  const pulseData = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    
    return DIMENSIONS.map((dimension) => {
      // Use placeholder functions since the source file is missing
      const latestScore = computeScoreInternalStub(memoryEntries, goals, dimension.category);
      const weekAgoScore = computeScoreInternalStub(
        memoryEntries.filter(entry => entry.timestamp >= weekAgo),
        goals,
        dimension.category
      );
      const delta = latestScore - weekAgoScore;
      const trend = computeTrendStub(memoryEntries, goals, dimension.category);
      
      return { 
        ...dimension, 
        score: latestScore, 
        delta, 
        trend 
      };
    });
  }, [memoryEntries, goals]);

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
      {pulseData.map((data) => {
        const highlight = highlighted.has(data.category);
        const hasSignificantChange = Math.abs(data.delta) >= 3;
        
        return (
          <div
            key={data.category}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all duration-300 ${
              highlight
                ? 'border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse'
                : 'border-white/5 bg-white/[0.02]'
            } ${hasSignificantChange ? 'cursor-pointer transform hover:scale-105' : ''}`}
            style={{
              userSelect: hasSignificantChange ? 'auto' : 'none',
              minWidth: '100px',
            }}
          >
            <span className="text-slate-400">{data.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {data.label}
            </span>
            <span className="text-sm font-mono font-bold text-slate-100">
              {data.score > 0 ? `${data.score}%` : '--'}
            </span>
            {data.score > 0 && (
              <span className={`text-[10px] font-bold ${getDeltaColor(data.delta)}`}>
                {getTrendSymbolStub(data.trend)}{(data.delta >= 0 ? '+' : '')}{data.delta}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};