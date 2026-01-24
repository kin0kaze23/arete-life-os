import React from 'react';
import { AlertTriangle, RefreshCcw, WifiOff, ShieldAlert } from 'lucide-react';

interface APIErrorCardProps {
  message: string;
  onRetry?: () => void;
  onClose?: () => void;
  isOffline?: boolean;
}

export const APIErrorCard: React.FC<APIErrorCardProps> = ({
  message,
  onRetry,
  onClose,
  isOffline,
}) => {
  return (
    <div className="w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="p-2.5 bg-rose-500/10 rounded-xl flex-shrink-0">
        {isOffline ? (
          <WifiOff size={18} className="text-rose-400" />
        ) : (
          <ShieldAlert size={18} className="text-rose-400" />
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">
          {isOffline ? 'Connection Severed' : 'Transmission Failed'}
        </h4>
        <p className="text-xs text-rose-300/80 font-medium leading-relaxed mb-3">{message}</p>

        <div className="flex items-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-300 uppercase tracking-wider transition-colors active:scale-95"
            >
              <RefreshCcw size={10} /> Retry
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-[10px] font-bold text-rose-500/60 hover:text-rose-400 uppercase tracking-wider transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
