import { MemoryEntry, UserProfile, Category, LifeDimension } from '@/data';

export interface TimePattern {
  pattern: string;
  description: string;
  frequency: number; // How often it occurs
  confidence: number; // 0-100
  insightTitle?: string;
  category: Category;
}

export interface Correlation {
  factorA: string;
  factorB: string;
  strength: number; // -1 to 1, with negative meaning inverse correlation
  description: string;
  confidence: number; // 0-100
  category: Category;
}

export interface GapPattern {
  area: string; // Area with missing data
  reason: string; // Why it might be missing
  duration: number; // Duration in days
  category: Category;
}

export interface StreakPattern {
  type: string; // Type of streak
  duration: number; // Current streak length
  isPositive: boolean;
  description: string;
  category: Category;
}

export interface PatternDetectionResult {
  timeBasedPatterns: TimePattern[];
  correlations: Correlation[];
  gaps: GapPattern[];
  streaks: StreakPattern[];
}

/**
 * Detects various patterns in user's memory entries
 */
export const detectPatterns = (
  memory: MemoryEntry[],
  profile: UserProfile
): PatternDetectionResult => {
  const now = Date.now();
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

  // 1. Time-based patterns
  const timeBasedPatterns = analyzeTimeBasedPatterns(memory);

  // 2. Correlations between different life dimensions
  const correlations = analyzeCorrelations(memory);

  // 3. Identify gaps in data collection
  const gaps = analyzeGaps(memory, oneWeekAgo, oneMonthAgo);

  // 4. Track streaks in logging behavior
  const streaks = analyzeStreaks(memory);

  return {
    timeBasedPatterns,
    correlations,
    gaps,
    streaks
  };
};

/**
 * Analyzes time-based patterns in memory entries
 */
const analyzeTimeBasedPatterns = (memory: MemoryEntry[]): TimePattern[] => {
  const patterns: TimePattern[] = [];

  if (memory.length === 0) return patterns;

  // Group memories by day of week
  const dayOfWeekCounts: Record<number, number> = {};
  const hourOfDayCounts: Record<number, number> = {};

  memory.forEach(entry => {
    const date = new Date(entry.timestamp);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hourOfDay = date.getHours();

    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    hourOfDayCounts[hourOfDay] = (hourOfDayCounts[hourOfDay] || 0) + 1;
  });

  // Find dominant day for logging
  let dominantDay = -1;
  let maxDayCount = 0;
  for (let i = 0; i < 7; i++) {
    if ((dayOfWeekCounts[i] || 0) > maxDayCount) {
      maxDayCount = dayOfWeekCounts[i] || 0;
      dominantDay = i;
    }
  }

  if (maxDayCount > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    patterns.push({
      pattern: `Most logs happen on ${dayNames[dominantDay]}`,
      description: `You tend to reflect on your life primarily on ${dayNames[dominantDay]}s${maxDayCount > 2 ? `, with an average of ${Math.round(maxDayCount/(memory.length/7))} entries` : ''}.`,
      frequency: maxDayCount,
      insightTitle: 'Reflection Timing',
      confidence: Math.min(100, maxDayCount * 10),
      category: Category.GENERAL
    });
  }

  // Find dominant hour for logging
  let dominantHour = -1;
  let maxHourCount = 0;
  for (let i = 0; i < 24; i++) {
    if ((hourOfDayCounts[i] || 0) > maxHourCount) {
      maxHourCount = hourOfDayCounts[i] || 0;
      dominantHour = i;
    }
  }

  if (maxHourCount > 0) {
    patterns.push({
      pattern: `Most logs happen at ${dominantHour}:00`,
      description: `You typically engage with your life reflection around ${dominantHour}:00${maxHourCount > 2 ? ` with ${maxHourCount} entries` : ''}.`,
      frequency: maxHourCount,
      insightTitle: 'Engagement Patterns',
      confidence: Math.min(100, maxHourCount * 10),
      category: Category.GENERAL
    });
  }

  // Find category concentration patterns
  const categoryCounts: Record<string, number> = {};
  memory.forEach(entry => {
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
  });

  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count > 2) {
      return [
        {
          insightId: 'initial-insight-'+Math.random(),
          title: `Focus on ${category}`,
          description: `You are focusing heavily on ${category.toLowerCase()}, with ${count} entries.`, 
          category: category as Category,
          confidence: Math.min(100, count * 5)
        }
      ];
    }
  });

  return patterns;
};

/**
 * Analyzes correlations between different life dimensions
 */
const analyzeCorrelations = (memory: MemoryEntry[]): Correlation[] => {
  const correlations: Correlation[] = [];

  // We'll calculate correlations between similar time periods
  const groupedByDate: Record<string, MemoryEntry[]> = {};
  memory.forEach(entry => {
    const dateStr = new Date(entry.timestamp).toISOString().split('T')[0];
    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = [];
    }
    groupedByDate[dateStr].push(entry);
  });

  // For correlation analysis, we'll look for common combinations
  const categoryPairs: Record<string, number> = {}; // Tracks co-occurrences

  Object.values(groupedByDate).forEach(dayEntries => {
    if (dayEntries.length > 1) {
      // Compare every pair of categories in the same day
      for (let i = 0; i < dayEntries.length; i++) {
        for (let j = i + 1; j < dayEntries.length; j++) {
          const cats = [dayEntries[i].category, dayEntries[j].category].sort();
          const pairKey = `${cats[0]}-${cats[1]}`;
          categoryPairs[pairKey] = (categoryPairs[pairKey] || 0) + 1;
        }
      }
    }
  });

  // Convert pairs to correlations - simplified method
  Object.entries(categoryPairs).forEach(([pair, count]) => {
    if (count > 1) { // At least 2 co-occurrences
      const [catA, catB] = pair.split('-');
      let description = '';
      
      // Customize descriptions based on categories
      if (catA === Category.HEALTH && catB === Category.FINANCE) {
        description = `Health and finance concerns often arise together in your entries`;
      } else if (catA === Category.RELATIONSHIPS && catB === Category.SPIRITUAL) {
        description = `Relationships and spiritual matters frequently appear in the same reflection sessions`;
      } else {
        description = `${catA} and ${catB} topics often occur together in your life reflections`;
      }
      
      correlations.push({
        factorA: catA,
        factorB: catB,
        strength: Math.min(0.8, count / (memory.length * 0.1)), // Normalize strength
        description: description,
        confidence: Math.min(100, count * 10),
        category: catA as Category
      });
    }
  });

  return correlations;
};

/**
 * Identifies gaps in data collection
 */
const analyzeGaps = (
  memory: MemoryEntry[], 
  oneWeekAgo: number, 
  oneMonthAgo: number
): GapPattern[] => {
  const gaps: GapPattern[] = [];
  const now = Date.now();

  // Check for gaps by category within the week
  const categories = Object.values(Category).filter(cat => typeof cat === 'string') as string[];
  
  categories.forEach(category => {
    const categoryEntries = memory.filter(m => m.category === category);
    if (categoryEntries.length > 0) {
      const newestEntry = Math.max(...categoryEntries.map(m => m.timestamp));
      const daysSinceLastEntry = Math.floor((now - newestEntry) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastEntry >= 7) {
        let reason = '';
        if (daysSinceLastEntry >= 30) {
          reason = `No recent logs in ${category} (${daysSinceLastEntry} days ago)`;
        } else if (daysSinceLastEntry >= 14) {
          reason = `Missing updates in ${category} for ${daysSinceLastEntry} days`;
        } else {
          reason = `No recent ${category} activities logged in the past week`;
        }
        
        gaps.push({
          area: category,
          reason: reason,
          duration: daysSinceLastEntry,
          category: category as Category
        });
      }
    } else {
      // Category never logged
      gaps.push({
        area: category,
        reason: `No logs recorded yet for ${category}`,
        duration: -1, // Special case for never logged
        category: category as Category
      });
    }
  });

  return gaps;
};

/**
 * Analyzes streaks in logging behavior
 */
const analyzeStreaks = (memory: MemoryEntry[]): StreakPattern[] => {
  const streaks: StreakPattern[] = [];

  if (memory.length < 2) return streaks;

  // Sort entries by timestamp
  const sortedMemories = [...memory].sort((a, b) => a.timestamp - b.timestamp);

  // Create an array of unique dates for streak calculation
  const uniqueDates = Array.from(new Set(
    sortedMemories.map(entry => new Date(entry.timestamp).toISOString().split('T')[0])
  )).sort();

  // Calculate consecutive days streak in the most recent period
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30); // Look at last 30 days

  let maxRecentStreak = 0;
  let currentStreak = 0;
  let expectedDay = startDate;
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const actualDate = new Date(uniqueDates[i]);
    
    while (expectedDay <= actualDate && 
           expectedDay.getTime() <= now.getTime()) {
      if (actualDate.toDateString() === expectedDay.toDateString()) {
        // Found a day that matches our expected streak day
        currentStreak++;
        break;
      } else {
        // Missing a day in the streak
        if (currentStreak > maxRecentStreak) {
          maxRecentStreak = currentStreak;
        }
        currentStreak = 0;
        expectedDay.setDate(expectedDay.getDate() + 1);
      }
    }
  }
  
  if (currentStreak > maxRecentStreak) {
    maxRecentStreak = currentStreak;
  }

  let description = '';
  let isPositive = true;

  if (maxRecentStreak > 0) {
    if (maxRecentStreak >= 14) {
      description = `Maintaining a ${maxRecentStreak}-day streak in life logging (outstanding consistency)`;
      isPositive = true;
    } else if (maxRecentStreak >= 7) {
      description = `Consistent ${maxRecentStreak}-day streak in documenting your life experiences`;
      isPositive = true;
    } else {
      description = `You've had a ${maxRecentStreak}-day logging streak recently`;
      isPositive = true;
    }
  } else {
    description = `Currently not in a logging streak - consider forming a daily habit`;
    isPositive = false;
  }

  streaks.push({
    type: 'logging_consistency',
    duration: maxRecentStreak,
    isPositive: isPositive,
    description: description,
    category: Category.GENERAL
  });

  // Also detect pattern-specific streaks (like Health)
  const healthEntries = memory.filter(m => m.category === Category.HEALTH);
  if (healthEntries.length >= 3) {
    const healthSorted = [...healthEntries].sort((a, b) => a.timestamp - b.timestamp);
    const healthUniqueDates = Array.from(new Set(
      healthSorted.map(entry => new Date(entry.timestamp).toISOString().split('T')[0])
    )).sort();
    
    const currentHealthStreak = calculateConsecutiveDays(healthUniqueDates);
    
    if (currentHealthStreak >= 3) {
      streaks.push({
        type: `health_${currentHealthStreak}_day_streak`,
        duration: currentHealthStreak,
        isPositive: true,
        description: `Maintaining ${currentHealthStreak}-day streak tracking your health`,
        category: Category.HEALTH
      });
    }
  }

  return streaks;
};

/**
 * Helper function to calculate the longest consecutive streak from a list of date strings
 */
const calculateConsecutiveDays = (dateStrings: string[]): number => {
  if (dateStrings.length === 0) return 0;
  
  // Convert date strings to timestamps and sort
  const timestamps = dateStrings.map(dateStr => new Date(dateStr).getTime()).sort((a, b) => a - b);
  
  if (timestamps.length === 1) return 1;
  
  let currentStreak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < timestamps.length; i++) {
    const prev = new Date(timestamps[i - 1]);
    const curr = new Date(timestamps[i]);
    
    // Reset the date to ignore time
    prev.setHours(0, 0, 0, 0);
    curr.setHours(0, 0, 0, 0);
    
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diff === 1) { // Consecutive days
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diff > 1) { // Gap of more than 1 day
      currentStreak = 1;
    } else { // Same day (shouldn't happen with unique dates, but handle anyway)
      // Do nothing
    }
  }
  
  return maxStreak;
};