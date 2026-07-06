import React from 'react';

/**
 * LoadingFallback — Premium loading state for lazy-loaded views.
 * Matches AreteLifeOS design language: calming, minimal, indigo accents.
 */
const LoadingFallback: React.FC = () => (
  <div
    className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
    role="status"
    aria-label="Loading content"
  >
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-2 border-slate-700/40" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-400 animate-[spin_0.8s_linear_infinite]" />
    </div>
    <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500 animate-pulse">
      Loading
    </p>
  </div>
);

export default LoadingFallback;
