import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DimensionTrendIndicatorProps {
  trend: 'up' | 'down' | 'stable' | 'neutral';
  percentage: number;
  size?: 'sm' | 'md' | 'lg'; // Smaller for compact display
}

export const DimensionTrendIndicator: React.FC<DimensionTrendIndicatorProps> = memo(({ 
  trend, 
  percentage = 0, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16
  }[size];
  
  const arrowIcon = () => {
    switch(trend) {
      case 'up':
        return <TrendingUp className={`text-emerald-400`} size={iconSize} />;
      case 'down':
        return <TrendingDown className={`text-rose-400`} size={iconSize} />;
      case 'stable': // intentionally treat same as neutral
      case 'neutral':
      default:
        return <Minus className={`text-slate-400`} size={iconSize} />;
    }
  };
  
  const textColor = () => {
    switch(trend) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-rose-400';
      case 'stable':
      case 'neutral':
      default: return 'text-slate-400';
    }
  };
  
  const percentageText = Math.abs(percentage) >= 0.1 ? `${percentage >= 0 ? '+' : ''}${percentage}%` : '';
  
  return (
    <div className={`flex items-center gap-1 font-bold ${sizeClasses[size]} ${textColor()} tabular-nums`}>
      {arrowIcon()}
      {percentageText && <span>{percentageText}</span>}
    </div>
  );
});

DimensionTrendIndicator.displayName = 'DimensionTrendIndicator';