import React from 'react';
import { GitCompare, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Category } from '../data/types';
import { getCategoryColor } from '../shared/SharedUI';

export interface ConflictData {
  id: string;
  category: Category;
  field: string;
  currentValue: string;
  newValue: string;
  sourceDate: string;
  confidence: number;
}

interface ConflictModalProps {
  conflict: ConflictData;
  onResolve: (selected: 'current' | 'new') => void;
  onCancel: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({ conflict, onResolve, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-amber-500/10 px-8 py-6 border-b border-amber-500/20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
              <GitCompare size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Reality Conflict
              </h3>
              <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest">
                Contradictory data detected in {conflict.category}
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full border border-amber-500/30 bg-slate-900 text-amber-500 text-[10px] font-black uppercase tracking-widest">
            Manual Resolution Required
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
              Disputed Field
            </p>
            <p className="text-white text-xl font-bold font-mono bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
              {conflict.field}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900 border-4 border-slate-800 rounded-full flex items-center justify-center z-10 shadow-xl">
              <span className="text-[10px] font-black text-slate-500">VS</span>
            </div>

            {/* Current Value Option */}
            <div
              onClick={() => onResolve('current')}
              className="relative p-6 rounded-3xl bg-slate-950/50 border border-slate-800 hover:border-slate-600 cursor-pointer group transition-all hover:bg-slate-900"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <CheckCircle2 size={20} className="text-slate-500" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                Current Reality
              </p>
              <div className="min-h-[80px] flex items-center">
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  {conflict.currentValue}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-600">
                <span>Existing Data</span>
                <span>Established</span>
              </div>
            </div>

            {/* New Value Option */}
            <div
              onClick={() => onResolve('new')}
              className="relative p-6 rounded-3xl bg-indigo-950/10 border border-indigo-500/30 hover:border-indigo-400 cursor-pointer group transition-all hover:bg-indigo-900/20"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <CheckCircle2 size={20} className="text-indigo-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                <Sparkles size={12} /> Proposed Update
              </p>
              <div className="min-h-[80px] flex items-center">
                <p className="text-sm text-white font-bold leading-relaxed">{conflict.newValue}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-indigo-500/20 flex justify-between items-center text-[10px] font-bold text-indigo-400/60">
                <span>{new Date(conflict.sourceDate).toLocaleDateString()}</span>
                <span>{Math.round(conflict.confidence)}% Confidence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-8 py-4 flex justify-between items-center border-t border-slate-800">
          <button
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors"
          >
            Defer Resolution
          </button>
          <div className="flex gap-2">{/* Indicators or steps could go here */}</div>
        </div>
      </div>
    </div>
  );
};
