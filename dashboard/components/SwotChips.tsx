import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Lightbulb, Flame } from 'lucide-react';

export interface SwotItem {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  points: string[];
}

interface SwotChipsProps {
  dimensionName: string;
  dimensionScore: number;
  swotData: SwotItem[];
  alwaysDo: string;
  alwaysWatch: string;
}

export const SwotChips: React.FC<SwotChipsProps> = ({
  dimensionName,
  dimensionScore,
  swotData,
  alwaysDo,
  alwaysWatch,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <CheckCircle2 className="text-emerald-400 w-4 h-4" />;
      case 'weakness':
        return <AlertTriangle className="text-amber-400 w-4 h-4" />;
      case 'opportunity':
        return <Lightbulb className="text-indigo-400 w-4 h-4" />;
      case 'threat':
        return <Flame className="text-rose-400 w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'strength':
        return 'Strengths';
      case 'weakness':
        return 'Weaknesses';
      case 'opportunity':
        return 'Opportunities';
      case 'threat':
        return 'Threats';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Deep Dive: {dimensionName} ({dimensionScore}% — Needs Attention)
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {swotData.map((item, idx) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel p-5 hover:-translate-y-1 transition-transform duration-200"
          >
            <div className="flex items-center gap-2 mb-3">
              {getIcon(item.type)}
              <h5 className="font-bold text-sm text-white/90">{getTitle(item.type)}</h5>
            </div>
            <ul className="space-y-2">
              {item.points.map((point, i) => (
                <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                  <span className="text-white/30 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Always Do / Watch Pills */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-3 flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
            Always-Do
          </span>
          <span className="text-xs text-emerald-100/80 font-medium truncate">{alwaysDo}</span>
        </div>
        <div className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-3 flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">
            Always-Watch
          </span>
          <span className="text-xs text-rose-100/80 font-medium truncate">{alwaysWatch}</span>
        </div>
      </div>
    </div>
  );
};
