import React from 'react';
import { Category, MemoryItem, Goal } from '@/data';
import { Activity, Wallet, Heart, Zap, User } from 'lucide-react';

export interface DimensionConfig {
  category: Category;
  label: string;
  icon: React.ReactNode;
}

export const DIMENSIONS: DimensionConfig[] = [
  { category: Category.HEALTH, label: 'Health', icon: <Activity size={14} /> },
  { category: Category.FINANCE, label: 'Finance', icon: <Wallet size={14} /> },
  { category: Category.RELATIONSHIPS, label: 'Social', icon: <Heart size={14} /> },
  { category: Category.SPIRITUAL, label: 'Spirit', icon: <Zap size={14} /> },
  { category: Category.PERSONAL, label: 'Personal', icon: <User size={14} /> },
];

export function computeScore(memoryItems: MemoryItem[], goals: Goal[], category: Category): number {
  return computeScoreInternal(memoryItems, goals, category, Date.now());
}

export function computeTrend(
  memoryItems: MemoryItem[],
  goals: Goal[],
  category: Category
): 'up' | 'down' | 'stable' {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const thisWeekScore = computeScore(memoryItems, goals, category);
  const lastWeekScore = computeScoreInternal(memoryItems, goals, category, weekAgo);

  const diff = thisWeekScore - lastWeekScore;
  if (diff >= 5) return 'up';
  if (diff <= -5) return 'down';
  return 'stable';
}

// Internal helper to avoid changing the public signature if strict,
// OR just modify the exported function to have a default param.
// Plan signature: computeScore(memoryItems: MemoryItem[], goals: Goal[], category: Category): number
// I'll add `referenceTime = Date.now()` as 4th arg.
export function computeScoreInternal(
  memoryItems: MemoryItem[],
  goals: Goal[],
  category: Category,
  referenceTime: number = Date.now()
): number {
  const windowStart = referenceTime - 7 * 24 * 60 * 60 * 1000;
  const recent = memoryItems.filter(
    (m) => m.category === category && m.timestamp > windowStart && m.timestamp <= referenceTime
  );

  const total = recent.length;
  if (total === 0) return 0;

  const positive = recent.filter((m) => m.sentiment === 'positive').length;
  const negative = recent.filter((m) => m.sentiment === 'negative').length;
  const neutral = total - positive - negative;

  // 1. Quality (40 pts) — net sentiment: negatives cost 0.6 of a positive each.
  //    A day of all-negative logs scores LOWER than no logs at all.
  const netPositive = Math.max(0, positive - negative * 0.6);
  const qualityScore = Math.min(1, netPositive / Math.max(total * 0.6, 1)) * 40;

  // 2. Consistency (25 pts) — only days with at least one non-negative entry count.
  const qualityDays = new Set(
    recent
      .filter((m) => m.sentiment !== 'negative')
      .map((m) => new Date(m.timestamp).toDateString())
  ).size;
  const consistencyScore = (qualityDays / 7) * 25;

  // 3. Engagement (15 pts) — breadth of logging (neutral or positive), capped at 3 logs.
  const engagementScore = Math.min((positive + neutral) / 3, 1) * 15;

  // 4. Progress (20 pts) — active goals with measurable progress.
  const catGoals = goals.filter((g) => g.category === category && g.status === 'active');
  const goalsWithProgress = catGoals.filter((g) => g.progress > 0).length;
  const totalGoals = catGoals.length;
  const progressScore = totalGoals > 0 ? (goalsWithProgress / totalGoals) * 20 : 0;

  return Math.min(100, Math.round(qualityScore + consistencyScore + engagementScore + progressScore));
}

// Re-export strict signature version if needed, or just use the one with default.
// I'll implement the exported one to use the internal one.

export function getScoreColor(score: number): string {
  if (score >= 81) return 'text-violet-400 border-violet-500/30 bg-violet-500/10'; // Thriving
  if (score >= 61) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'; // Healthy
  if (score >= 41) return 'text-amber-400 border-amber-500/30 bg-amber-500/10'; // At Risk
  return 'text-rose-400 border-rose-500/30 bg-rose-500/10'; // Critical
}

export function getTrendSymbol(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

interface ScoreStripProps {
  memoryItems: MemoryItem[];
  goals: Goal[];
}

export const ScoreStrip: React.FC<ScoreStripProps> = ({ memoryItems, goals }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {DIMENSIONS.map((dim) => {
        const score = computeScore(memoryItems, goals, dim.category);
        const trend = computeTrend(memoryItems, goals, dim.category);
        const colorClass = getScoreColor(score);
        return (
          <div
            key={dim.category}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClass} transition-all`}
          >
            <span className="opacity-70">{dim.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{dim.label}</span>
            <span className="text-sm font-mono font-bold tabular-nums">{score > 0 ? score : '--'}</span>
            <span className="text-[10px] font-bold opacity-70">
              {score > 0 ? getTrendSymbol(trend) : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};
