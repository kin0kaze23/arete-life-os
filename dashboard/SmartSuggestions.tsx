import React, { memo } from 'react';
import { X, Sparkles } from 'lucide-react';

interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  context: string; // time of day, recent logs, etc
  cta: string;     // call to action
  score: number;   // relevance score
}

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = memo(({ 
  suggestions, 
  onDismiss, 
  onAction 
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Only show first 2 suggestions
  const displaySuggestions = suggestions.slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Smart Suggestions
        </span>
      </div>
      
      <div className="space-y-3">
        {displaySuggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm group"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{suggestion.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {suggestion.description}
                </p>
                <div className="mt-2 text-[10px] text-slate-500 italic">
                  {suggestion.context}
                </div>
              </div>
              
              <button
                onClick={() => onDismiss(suggestion.id)}
                className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Dismiss suggestion"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            
            <button
              onClick={() => onAction(suggestion.id)}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors border border-indigo-500/30"
            >
              {suggestion.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

SmartSuggestions.displayName = 'SmartSuggestions';