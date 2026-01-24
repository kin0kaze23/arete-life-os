import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 animate-in fade-in zoom-in-95 duration-700 ${className}`}
    >
      <div className="mb-6 p-8 rounded-[2.5rem] bg-slate-100 dark:bg-slate-900/50 text-slate-300 dark:text-slate-800 border border-slate-200 dark:border-slate-800 shadow-inner">
        {/* Cast to any React.ReactElement to allow dynamic prop injection for icons during cloning */}
        {React.cloneElement(icon as React.ReactElement<any>, { size: 64, strokeWidth: 1.5 })}
      </div>

      <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">
        {title}
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium leading-relaxed mb-8">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
