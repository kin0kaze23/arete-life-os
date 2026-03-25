import { MemoryEntry, UserProfile, Category, LifeDimension } from '@/data';

export interface BenchmarkData {
  age: Record<string, {
    score?: number;
    count?: number;
    trend?: 'improving' | 'declining' | 'stable';
    recommendation?: string;
  }>;
  role: Record<string, any>; // Role-based averages
  location: Record<string, any>; // Location-based averages (if available)
  global: Record<string, any>; // Global averages
}

// Mock benchmark datasets for demonstration
const MOCK_AGE_BENCHMARKS: Record<string, BenchmarkData['age']> = {
  '20-30': {
    [Category.HEALTH]: { score: 42, count: 18, trend: 'improving' },
    [Category.FINANCE]: { score: 35, count: 12, trend: 'stable' },
    [Category.RELATIONSHIPS]: { score: 55, count: 22, trend: 'stable' },
    [Category.SPIRITUAL]: { score: 30, count: 10, trend: 'improving' },
    [Category.PERSONAL]: { score: 40, count: 25, trend: 'stable' }
  },
  '30-40': {
    [Category.HEALTH]: { score: 50, count: 16, trend: 'stable' },
    [Category.FINANCE]: { score: 55, count: 18, trend: 'improving' },
    [Category.RELATIONSHIPS]: { score: 45, count: 20, trend: 'stable' },
    [Category.SPIRITUAL]: { score: 35, count: 14, trend: 'stable' },
    [Category.PERSONAL]: { score: 52, count: 20, trend: 'improving' }
  },
  '40-50': {
    [Category.HEALTH]: { score: 45, count: 15, trend: 'declining' },
    [Category.FINANCE]: { score: 60, count: 20, trend: 'improving' },
    [Category.RELATIONSHIPS]: { score: 65, count: 25, trend: 'stable' },
    [Category.SPIRITUAL]: { score: 40, count: 16, trend: 'stable' },
    [Category.PERSONAL]: { score: 48, count: 18, trend: 'stable' }
  },
  '50+': {
    [Category.HEALTH]: { score: 55, count: 18, trend: 'declining' },
    [Category.FINANCE]: { score: 65, count: 22, trend: 'stable' },
    [Category.RELATIONSHIPS]: { score: 70, count: 28, trend: 'stable' },
    [Category.SPIRITUAL]: { score: 55, count: 20, trend: 'improving' },
    [Category.PERSONAL]: { score: 52, count: 15, trend: 'stable' }
  }
};

const MOCK_ROLE_BENCHMARKS: Record<string, any> = {
  'ADMIN': {},
  'MEMBER': {
    [Category.HEALTH]: { score: 48 },
    [Category.FINANCE]: { score: 45 },
    [Category.RELATIONSHIPS]: { score: 50 },
    [Category.SPIRITUAL]: { score: 38 },
    [Category.PERSONAL]: { score: 46 }
  },
  'CHILD': {}
};

// Map birthdays to age bracket
const getAgeBracket = (birthday: string): keyof typeof MOCK_AGE_BENCHMARKS => {
  const birthDate = new Date(birthday);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  if (age < 20) return '20-30'; // Treat under 20 as 20-30
  if (age < 30) return '20-30';
  if (age < 40) return '30-40';
  if (age < 50) return '40-50';
  return '50+';
};

/**
 * Calculate benchmarks based on user's demographics and profile
 */
export const getBenchmark = (
  memory: MemoryEntry[],
  profile: UserProfile
): BenchmarkData => {
  const ageBracket = getAgeBracket(profile.identify.birthday);
  
  // Start with age-based benchmarks as primary
  const ageBasedBenchmarks = MOCK_AGE_BENCHMARKS[ageBracket] || MOCK_AGE_BENCHMARKS['30-40']; // Fallback to 30-40 bracket
  
  // Incorporate role-based benchmarks
  const roleBasedBenchmarks = MOCK_ROLE_BENCHMARKS[profile.role] || {};
  
  // Calculate global (overall) benchmarks as secondary
  const globalBenchmarks = calcGlobalBenchmarks(memory);
  
  // Calculate role-based benchmarks
  const roleBenchmarks = calcRoleBenchmarks(memory, profile);
  
  // Combine and return all benchmarks
  return {
    age: ageBasedBenchmarks,
    role: roleBenchmarks,
    location: {}, // Would derive from location in profile if implemented
    global: globalBenchmarks
  };
};

/**
 * Calculate global benchmarks across all users (simplified)
 */
const calcGlobalBenchmarks = (memory: MemoryEntry[]): BenchmarkData['global'] => {
  // This would connect to a larger dataset in a real app
  const totalEntries = memory.length;
  
  // Simplified calculation: return basic statistics across the memory entries
  if (totalEntries === 0) {
    return {};
  }
  
  // Count entries by category
  const categoryCounts: Record<string, number> = {};
  memory.forEach(entry => {
    if (!categoryCounts[entry.category]) {
      categoryCounts[entry.category] = 0;
    }
    categoryCounts[entry.category]++;
  });
  
  // Convert counts to average scores (simplified - normally would correlate to actual metrics)
  const globalAvg = Object.keys(categoryCounts).reduce((sum, cat) => {
    return sum + categoryCounts[cat]; 
  }, 0) / Math.max(Object.keys(categoryCounts).length, 1);
  
  // Generate mock results
  const result: BenchmarkData['global'] = {};
  Object.values(Category).forEach(cat => {
    result[cat] = categoryCounts[cat] ? {
      avgEntries: Math.round(categoryCounts[cat]),
      trend: 'stable' // Would be calculated in real app
    } : {
      avgEntries: globalAvg,
      trend: 'stable'
    };
  });
  
  return result;
};

/**
 * Calculate benchmarks specific to user's role
 */
const calcRoleBenchmarks = (
  memory: MemoryEntry[],
  profile: UserProfile
): any => {
  // In a real app, this would aggregate data for users of the same role
  // For now returning mock data based on the user's own data
  const categoryCounts: Record<string, number> = {};
  
  memory.forEach(entry => {
    if (!categoryCounts[entry.category]) {
      categoryCounts[entry.category] = 0;
    }
    categoryCounts[entry.category]++;
  });
  
  const roleBenchmarks: any = {};
  Object.values(Category).forEach(cat => {
    roleBenchmarks[cat] = {
      logCount: categoryCounts[cat] || 0,
      percentile: calculatePercentile(categoryCounts[cat] || 0, memory.length)
    };
  });
  
  return roleBenchmarks;
};

/**
 * Helper to calculate rough percentile ranking
 */
const calculatePercentile = (userValue: number, total: number): number => {
  if (total === 0) return 50; // Default to 50th percentile if no data
  // Simple calculation: (userValue / maxPossible) * 100
  // This is a simplified version - in practice we'd compare against others in the role
  return Math.min(99, Math.round((userValue / Math.max(total, 10)) * 100));
};