import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', isVisible, onClose, onAction, actionLabel }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-[#0C0E12] border border-white/10 rounded-full shadow-2xl shadow-indigo-500/10 z-[100]"
        >
          {type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : type === 'error' ? (
            <XCircle size={16} className="text-rose-400" />
          ) : (
            <Info size={16} className="text-sky-400" />
          )}
          <span className="text-xs font-bold text-white tracking-wide">{message}</span>
          {onAction && actionLabel && (
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              className="ml-2 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400 transition-all active:scale-95"
            >
              {actionLabel}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
