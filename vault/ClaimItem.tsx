import React, { useState } from 'react';
import { Category } from '../data/types';
import { getCategoryColor } from '../shared/SharedUI';
import {
  FileText,
  Image,
  Quote,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  ShieldCheck,
} from 'lucide-react';

interface ClaimItemProps {
  claim: string;
  category: Category;
  confidence: number;
  timestamp: string;
  sourceType: 'text' | 'pdf' | 'image';
  evidenceSnippet?: string;
}

export const ClaimItem: React.FC<ClaimItemProps> = ({
  claim,
  category,
  confidence,
  timestamp,
  sourceType,
  evidenceSnippet,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfidenceStyle = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20';
    if (score >= 50) return 'text-amber-400 bg-amber-500/5 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/5 border-rose-500/20';
  };

  const getSourceIcon = () => {
    switch (sourceType) {
      case 'image':
        return <Image size={10} />;
      case 'pdf':
        return <FileText size={10} />;
      default:
        return <AlignLeft size={10} />;
    }
  };

  return (
    <div
      className={`bg-slate-900/40 border border-white/5 rounded-3xl p-5 transition-all hover:border-white/20 group relative cursor-pointer ${isExpanded ? 'bg-slate-900/80 ring-1 ring-indigo-500/30 shadow-2xl' : 'shadow-lg'}`}
      onClick={() => evidenceSnippet && setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <p className="text-[13px] font-bold text-slate-100 leading-relaxed tracking-tight">
            {claim}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(category)}`}
            >
              {category}
            </span>
            <span
              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1.5 ${getConfidenceStyle(confidence)}`}
            >
              {confidence >= 80 && <ShieldCheck size={10} />}
              {Math.round(confidence)}% Fidelity
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
              {getSourceIcon()}
              <span>
                {timestamp
                  ? new Date(timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Now'}
              </span>
            </div>
          </div>
        </div>
        {evidenceSnippet && (
          <button className="text-slate-600 hover:text-indigo-400 transition-all p-1.5 bg-white/5 rounded-xl">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {isExpanded && evidenceSnippet && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
            <Quote size={14} className="text-indigo-500 shrink-0 mt-0.5 opacity-50" />
            <p className="text-[11px] text-slate-400 italic leading-relaxed font-medium">
              "{evidenceSnippet}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
