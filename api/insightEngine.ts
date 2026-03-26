import { MemoryEntry, ProactiveInsight, UserProfile, Category, LifeDimension } from '@/data';
import { detectPatterns } from './patternDetection';
import { getBenchmark } from './benchmarks';

interface InsightTier {
  minLogs: number;
  generateInsights: (
    memory: MemoryEntry[], 
    profile: UserProfile, 
    patterns: ReturnType<typeof detectPatterns>,
    benchmarks: ReturnType<typeof getBenchmark>
  ) => ProactiveInsight[];
}

export const INSIGHT_TIERS: InsightTier[] = [
  {
    minLogs: 0,
    generateInsights: (memory, profile, patterns, benchmarks) => [
      {
        id: 'baseline-insight-1',
        title: 'Welcome to AreteLifeOS',
        description: 'Begin logging life activities across different dimensions to unlock personalized insights.',
        type: 'onboarding',
        category: Category.GENERAL
      }
    ]
  },
  {
    minLogs: 3,
    generateInsights: (memory, profile, patterns, benchmarks) => [
      {
        id: 'pattern-insight-1',
        title: 'Early Pattern Detected',
        description: `We noticed a ${patterns.timeBasedPatterns[0]?.pattern || 'recurring theme'} in your entries.`,
        type: 'pattern',
        category: Category.GENERAL
      }
    ]
  },
  {
    minLogs: 10,
    generateInsights: (memory, profile, patterns, benchmarks) => {
      const insights: ProactiveInsight[] = [];
      
      // Pattern-based insights
      patterns.timeBasedPatterns.forEach(pattern => {
        insights.push({
          id: `pattern-${Date.now()}-${Math.random()}`,
          title: 'Pattern Recognition',
          description: pattern.description || pattern.pattern,
          type: 'pattern',
          category: pattern.category || Category.GENERAL
        });
      });
      
      // Correlation insights
      patterns.correlations.forEach(correlation => {
        insights.push({
          id: `correlation-${Date.now()}-${Math.random()}`,
          title: 'Correlation Found',
          description: correlation.description || `${correlation.factorA} correlates with ${correlation.factorB}`,
          type: 'pattern',
          category: correlation.category || Category.GENERAL
        });
      });
      
      return insights;
    }
  },
  {
    minLogs: 50,
    generateInsights: (memory, profile, patterns, benchmarks) => {
      const insights: ProactiveInsight[] = [];
      
      // Advanced pattern insights
      patterns.timeBasedPatterns.forEach(pattern => {
        insights.push({
          id: `advanced-pattern-${Date.now()}-${Math.random()}`,
          title: pattern.insightTitle || 'Pattern Recognition',
          description: pattern.description || pattern.pattern,
          type: 'pattern',
          category: pattern.category || Category.GENERAL
        });
      });
      
      // Benchmark insights
      Object.entries(benchmarks.age).forEach(([dimension, benchmark]) => {
        if (benchmark && benchmark.score) {
          // Find user's score for this dimension
          const userScore = memory.filter(m => m.category === dimension).length || 10; // Simplified calculation
          if (typeof benchmark.score === 'number' && userScore !== benchmark.score) {
            insights.push({
              id: `benchmark-${Date.now()}-${Math.random()}`,
              title: 'Benchmark Comparison',
              description: `Your focus on ${dimension} is ${
                userScore > (benchmark.score as number) ? 'above' : 'below'
              } average for your age group.`,
              type: 'benchmark',
              category: dimension as Category || Category.GENERAL
            });
          }
        }
      });
      
      // Gap detection insights
      patterns.gaps.forEach(gap => {
        insights.push({
          id: `gap-${Date.now()}-${Math.random()}`,
          title: 'Activity Gap',
          description: gap.reason || `Missing logs in ${gap.area}`,
          type: 'actionable',
          category: gap.category || Category.GENERAL
        });
      });
      
      // Streak insights
      patterns.streaks.forEach(streak => {
        insights.push({
          id: `streak-${Date.now()}-${Math.random()}`,
          title: streak.isPositive ? 'Positive Streak' : 'Area for Improvement',
          description: streak.description || `Continuing with ${streak.type}`,
          type: streak.isPositive ? 'predictive' : 'actionable',
          category: streak.category || Category.GENERAL
        });
      });
      
      return insights;
    }
  }
];

export interface InsightGenerationOptions {
  timeRange?: 'day' | 'week' | 'month';
  categories?: string[];
  includePatternInsights?: boolean;
  includeBenchmarkInsights?: boolean;
  includePredictiveInsights?: boolean;
  includeActionableInsights?: boolean;
}

/**
 * Main function to generate insights based on user's memory and profile
 */
export const generateInsights = async (
  memory: MemoryEntry[], 
  profile: UserProfile, 
  options: InsightGenerationOptions = {}
): Promise<ProactiveInsight[]> => {
  try {
    const logCount = memory.length;
    
    // Determine the appropriate tier based on log count
    const applicableTier = [...INSIGHT_TIERS]
      .reverse()
      .find(tier => logCount >= tier.minLogs) || INSIGHT_TIERS[0];
    
    // Detect patterns in the memory data
    const patterns = detectPatterns(memory, profile);
    
    // Calculate user benchmarks
    const benchmarks = getBenchmark(memory, profile);
    
    // Generate insights based on the determined tier
    const insights = applicableTier.generateInsights(memory, profile, patterns, benchmarks);
    
    // If we hit the 10+ log threshold, add additional sophisticated insights
    if (logCount >= 10) {
      // Add more complex insights based on correlations and advanced patterns
      patterns.correlations.forEach(correlation => {
        if (Math.abs(correlation.strength) > 0.5) { // Strong correlation
          insights.push({
            id: `strong-correlation-${Date.now()}-${Math.random()}`,
            title: 'Strong Connection Identified',
            description: correlation.description || `We found a notable correlation between ${correlation.factorA} and ${correlation.factorB}.`,
            type: 'pattern',
            category: correlation.category || Category.GENERAL
          });
        }
      });
    }
    
    // If we have 50+ logs, add benchmark comparison insights
    if (logCount >= 50) {
      // Compare to age-based benchmarks in different areas
      Object.entries(benchmarks.age).filter(([_, b]) => b).forEach(([dimension, benchmark]) => {
        // Placeholder for actual benchmark comparison logic
        insights.push({
          id: `compared-to-others-${Date.now()}-${Math.random()}`,
          title: `${dimension} Benchmark`,
          description: `Your activity in ${dimension} trends ${benchmark?.trend || 'neutral'} compared to others your age.`,
          type: 'benchmark',
          category: dimension as Category || Category.GENERAL
        });
      });
    }
    
    return validateInsights(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    // Return basic insights as fallback
    return [
      {
        id: 'fallback-insight',
        title: 'Life Tracking Tip',
        description: 'Continue logging life activities to unlock deeper insights.',
        type: 'onboarding',
        category: Category.GENERAL
      }
    ];
  }
};

/**
 * Validate and filter insights to ensure quality
 */
const validateInsights = (insights: ProactiveInsight[]): ProactiveInsight[] => {
  // Remove duplicates based on description
  const seenDescriptions = new Set<string>();
  return insights.filter(insight => {
    if (seenDescriptions.has(insight.description)) {
      return false;
    }
    seenDescriptions.add(insight.description);
    // Apply quality checks
    return insight.title.trim().length > 0 && 
           insight.description.trim().length > 0 && 
           insight.title.length < 100 && 
           insight.description.length < 300;
  }).slice(0, 10); // Limit to 10 insights max
};