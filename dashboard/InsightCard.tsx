import React, { useState } from 'react';
import { ProactiveInsight, Category } from '@/data';

interface InsightCardProps {
  insight: ProactiveInsight;
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  variant?: 'pattern' | 'benchmark' | 'predictive' | 'actionable';
  className?: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onDismiss,
  onAction,
  variant = 'pattern', // Default to pattern
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Dismiss handler
  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      if (onDismiss) onDismiss(insight.id);
    }, 300); // Allow for animation
  };

  // Action handler
  const handleAction = () => {
    if (onAction) onAction(insight.id);
  };

  // Skip rendering if card is marked for dismissal
  if (isDismissed) return null;

    // Determine styling based on variant
  const getVariantStyles = () => {
    let bgColor = 'bg-white/[0.02]';
    let border = 'border-white/5';
    let iconColor = 'text-indigo-400';
    
    switch (variant) {
      case 'pattern':
        iconColor = 'text-emerald-400';
        break;
      case 'benchmark':
        bgColor = 'bg-amber-500/10'; // Amber-themed background
        border = 'border-amber-500/30';
        iconColor = 'text-amber-400';
        break;
      case 'predictive':
        bgColor = 'bg-sky-500/10'; // Sky-themed background
        border = 'border-sky-500/30';
        iconColor = 'text-sky-400';
        break;
      case 'actionable':
        bgColor = 'bg-red-500/10'; // Red-themed background
        border = 'border-red-500/30';
        iconColor = 'text-red-400';
        break;
      default:
        iconColor = 'text-indigo-400';
    }
    
    return { bgColor, border, iconColor };
  };

  const { bgColor, border, iconColor } = getVariantStyles();

  // Get icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'pattern':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'benchmark':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'predictive':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'actionable':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get action button text based on insight type
  const getActionButtonText = () => {
    switch (insight.type) {
      case 'pattern':
        return 'Learn More';
      case 'benchmark':
        return 'See Details';
      case 'predictive':
        return 'Plan';
      case 'actionable':
        return 'Take Action';
      default:
        return insight.type === 'onboarding' ? 'Get Started' : 'View';
    }
  };

  return (
    <div 
      className={`
        ${bgColor} ${border} border rounded-xl p-4 transition-all duration-300 ease-in-out
        hover:bg-white/[0.04] cursor-default
        transform hover:-translate-y-0.5
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate">{insight.title}</h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {insight.description}
            </p>
            
            {/* Category tag */}
            <div className="mt-2 inline-block">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                {insight.category}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex space-x-2 ml-2">
          {/* Action button (if applicable) */}
          {onAction && (
            <button
              onClick={handleAction}
              className={`
                inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium
                rounded-full shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2
                ${variant === 'actionable' 
                  ? 'bg-red-800 hover:bg-red-700 focus:ring-red-500' 
                  : variant === 'benchmark'
                  ? 'bg-amber-800 hover:bg-amber-700 focus:ring-amber-500'
                  : variant === 'pattern'
                  ? 'bg-emerald-800 hover:bg-emerald-700 focus:ring-emerald-500'
                  : variant === 'predictive'
                  ? 'bg-sky-800 hover:bg-sky-700 focus:ring-sky-500'
                  : 'bg-indigo-800 hover:bg-indigo-700 focus:ring-indigo-500'
                }
              `}
            >
              {getActionButtonText()}
            </button>
          )}
          
          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              aria-label="Dismiss insight"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};