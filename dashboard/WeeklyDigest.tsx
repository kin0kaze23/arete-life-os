import React, { memo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react';

interface DimensionChange {
  dimension: string;
  change: number;
}

interface WeeklyDigestStats {
  totalLogs: number;
  logFrequency: string; // e.g., "Daily", "Every other day", "Few times per week"
  avgScore: number;
  bestDimension: string;
  bestDimensionScore: number;
  dimensionChanges: DimensionChange[];
  highlights?: string[];
  nextWeekFocus?: string;
}

interface WeeklyDigestProps {
  stats: WeeklyDigestStats;
  isMonday?: boolean; // Show only on Mondays by default
  onShare?: () => void;
}

export const WeeklyDigest: React.FC<WeeklyDigestProps> = memo(({ 
  stats, 
  isMonday = false,
  onShare 
}) => {
  // Show only on Monday or if this is the first time we have actual data to show
  const shouldShow = isMonday || stats.totalLogs > 0;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Weekly Digest
          </span>
        </div>
        
        {onShare && (
          <button
            onClick={onShare}
            className="p-1 rounded-md hover:bg-amber-500/20 transition-colors text-amber-400"
            aria-label="Share weekly digest"
          >
            <Share2 className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Logs</p>
            <p className="text-lg font-bold text-white">{stats.totalLogs}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Score</p>
            <p className="text-lg font-bold text-white">{Math.round(stats.avgScore)}%</p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-amber-500/10">
          <p className="text-xs text-slate-400 mb-2">Best Dimension</p>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">{stats.bestDimension}</span>
            <span className="text-sm font-bold text-amber-300">{stats.bestDimensionScore}%</span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-amber-500/10">
          <p className="text-xs text-slate-400 mb-2">Trends</p>
          <div className="space-y-2">
            {stats.dimensionChanges.map((change, index) => {
              const isPositive = change.change > 0;
              const isNegative = change.change < 0;
              
              return (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">{change.dimension}</span>
                  <div className="flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : isNegative ? (
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Minus className="w-3 h-3 text-slate-400" />
                    )}
                    <span 
                      className={`text-xs font-mono ${
                        isPositive 
                          ? 'text-emerald-400' 
                          : isNegative 
                            ? 'text-rose-400' 
                            : 'text-slate-400'
                      }`}
                    >
                      {change.change >= 0 ? '+' : ''}{change.change}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {stats.nextWeekFocus && (
          <div className="pt-2 border-t border-amber-500/10">
            <p className="text-xs text-slate-400 mb-1">This Week's Focus</p>
            <p className="text-xs font-medium text-amber-200">{stats.nextWeekFocus}</p>
          </div>
        )}
      </div>
    </div>
  );
});

WeeklyDigest.displayName = 'WeeklyDigest';