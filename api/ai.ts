import { generateInsights } from './insightEngine';
import { MemoryEntry, UserProfile, ProactiveInsight } from '@/data';

/**
 * Central AI endpoint that coordinates different intelligence layers
 */
export interface IntelRequestBody {
  action: 'generate_insights' | 'process_memory' | 'analyze_patterns' | 'benchmark_comparison';
  memory: MemoryEntry[];
  profile: UserProfile;
  options?: any;
}

export interface IntelResponseBody {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Main API endpoint for all intelligence operations
 */
export const handleIntelRequest = async (
  req: IntelRequestBody
): Promise<IntelResponseBody> => {
  try {
    switch (req.action) {
      case 'generate_insights': {
        // Generate proactive insights using the intelligence engine
        const insights = await generateInsights(req.memory, req.profile, req.options);
        return {
          success: true,
          data: { insights }
        };
      }
      
      case 'analyze_patterns': {
        // This would be a new function that just analyzes patterns without generating full insights
        // Importing here to prevent circular dependencies
        const { detectPatterns } = await import('./patternDetection');
        const patterns = detectPatterns(req.memory, req.profile);
        return {
          success: true,
          data: { patterns }
        };
      }
        
      case 'benchmark_comparison': {
        const { getBenchmark } = await import('./benchmarks');
        const benchmarks = getBenchmark(req.memory, req.profile);
        return {
          success: true,
          data: { benchmarks }
        };
      }

      default:
        throw new Error(`Unknown action: ${req.action}`);
    }
  } catch (error) {
    console.error('Error processing AI request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Convenience function for generating insights directly
 */
export const generateProactiveInsights = async (
  memory: MemoryEntry[],
  profile: UserProfile
): Promise<ProactiveInsight[]> => {
  try {
    const result = await handleIntelRequest({
      action: 'generate_insights',
      memory,
      profile
    });

    if (!result.success || !result.data || !Array.isArray(result.data.insights)) {
      console.warn('Failed to generate insights, returning empty array', result.error);
      return [];
    }

    return result.data.insights as ProactiveInsight[];
  } catch (error) {
    console.error('Error in generateProactiveInsights:', error);
    return [];
  }
};