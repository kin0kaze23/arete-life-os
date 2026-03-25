import { Category, Goal, MemoryEntry } from '@/data';

// Re-implement the score functions that were previously in this file

// Helper function to calculate score for a specific category
export const computeScoreInternal = (memoryEntries: MemoryEntry[], goals: Goal[], category: Category): number => {
  // Base score of 50, will be adjusted based on activity
  let baseScore = 50;

  // Filter memory entries by category
  const categoryEntries = memoryEntries.filter(entry => entry.category === category);
  
  // Add points for activity in the category (max 30 points from activity)
  const activityScore = Math.min(30, categoryEntries.length * 5);
  baseScore += activityScore;
  
  // Add points based on goal progress for this category
  const categoryGoals = goals.filter(goal => goal.category === category && goal.status === 'active');
  const goalProgressScore = Math.min(20, categoryGoals.length * 10); // Max 20 points from goals
  baseScore += goalProgressScore;
  
  // Cap score between 0 and 100
  return Math.max(0, Math.min(100, Math.floor(baseScore)));
};

export const computeScore = (memoryEntries: MemoryEntry[], goals: Goal[], category: Category): number => {
  return computeScoreInternal(memoryEntries, goals, category);
};

export const computeTrend = (memoryEntries: MemoryEntry[], goals: Goal[], category: Category): 'up' | 'down' | 'stable' => {
  // Look at most recent 7 days of data
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
  
  // Entries from the last week
  const recentEntries = memoryEntries.filter(
    entry => entry.category === category && entry.timestamp >= oneWeekAgo
  );
  
  // Entries from the week before
  const olderEntries = memoryEntries.filter(
    entry => entry.category === category && entry.timestamp < oneWeekAgo && entry.timestamp >= twoWeeksAgo
  );
  
  if (recentEntries.length > olderEntries.length) {
    return 'up';
  } else if (recentEntries.length < olderEntries.length) {
    return 'down';
  } else {
    return 'stable';
  }
};

export const getTrendSymbol = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
    default: return '→';
  }
};

// Define dimension constants
export const DIMENSIONS = [
  { category: Category.HEALTH as Category, label: 'Health', icon: '🟢' },
  { category: Category.FINANCE as Category, label: 'Finance', icon: '🟡' },
  { category: Category.RELATIONSHIPS as Category, label: 'Relationships', icon: '🔵' },
  { category: Category.SPIRITUAL as Category, label: 'Spiritual', icon: '🟣' },
  { category: Category.PERSONAL as Category, label: 'Personal', icon: '🔴' },
];