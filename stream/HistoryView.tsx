import React from 'react';
import { MemoryEntry } from '@/data';
import { EmptyState, getCategoryColor } from '@/shared';
import {
  Hash,
  Target,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Microscope,
  Info,
} from 'lucide-react';

interface HistoryViewProps {
  memory: MemoryEntry[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ memory }) => {
  const formatConfidence = (score: number) => {
    // If the score is between 0 and 1, it's likely a decimal probability
    if (score > 0 && score <= 1) return Math.round(score * 100);
    return Math.round(score);
  };

  const getConfidenceInfo = (score: number) => {
    const normalizedScore = formatConfidence(score);
    if (normalizedScore >= 85)
      return {
        color:
          'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900',
        label: 'Verified',
        icon: <CheckCircle size={10} />,
      };
    if (normalizedScore >= 50)
      return {
        color:
          'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900',
        label: 'Probable',
        icon: <Target size={10} />,
      };
    return {
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900',
      label: 'Tentative',
      icon: <AlertTriangle size={10} />,
    };
  };

  const getIntegrityColor = (score: number) => {
    const normalizedScore = formatConfidence(score);
    if (normalizedScore >= 90) return 'text-emerald-500';
    if (normalizedScore >= 75) return 'text-indigo-500';
    if (normalizedScore >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-3xl font-bold">Life Stream</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Historical archive with diagnostic cognitive tracking.
          </p>
        </div>
      </div>
      <div className="space-y-8">
        {memory.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border dark:border-slate-700 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-500 transition-all overflow-hidden relative"
          >
            {/* Integrity Meter Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b dark:border-slate-700 pb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed ${getIntegrityColor(entry.extractionConfidence || 0).replace('text-', 'border-')}`}
                >
                  <span
                    className={`text-lg font-black ${getIntegrityColor(entry.extractionConfidence || 0)}`}
                  >
                    {formatConfidence(entry.extractionConfidence || 0)}
                  </span>
                  <span className="text-[7px] font-black uppercase opacity-60 tracking-tighter">
                    Integrity
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getCategoryColor(entry.category)}`}
                    >
                      {entry.category} Log
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h4 className="text-xs text-slate-500 mt-1 font-medium">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </h4>
                </div>
              </div>

              {/* Quality Notes Badge */}
              {entry.extractionQualityNotes && entry.extractionQualityNotes.length > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <Microscope size={14} className="text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest">
                      Digestion Notes
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium truncate max-w-[150px]">
                      {entry.extractionQualityNotes[0]}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <p className="text-slate-700 dark:text-slate-200 text-xl leading-relaxed font-semibold mb-8 pr-12">
                "{entry.content}"
              </p>
              <div className="absolute top-0 right-0 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <ShieldCheck
                  className={
                    formatConfidence(entry.extractionConfidence) > 90
                      ? 'text-emerald-500'
                      : 'text-slate-300'
                  }
                  size={20}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Internalized Intelligence
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entry.extractedFacts.map((factObj, idx) => {
                  const conf = getConfidenceInfo(factObj.confidence || 0);
                  const displayScore = formatConfidence(factObj.confidence || 0);
                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-800 group/fact hover:border-indigo-100 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <Hash size={12} className="text-indigo-400 mt-1 flex-shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {factObj.fact}
                        </p>
                      </div>
                      <div className="mt-auto pt-3 border-t dark:border-slate-800/50 flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${getCategoryColor(factObj.category)}`}
                        >
                          {factObj.category}
                        </span>
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold ${conf.color}`}
                        >
                          {conf.icon}
                          {displayScore}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actionable Feedback for Low Integrity */}
              {formatConfidence(entry.extractionConfidence) < 75 && (
                <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                  <div className="w-10 h-10 bg-white dark:bg-rose-900 rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-rose-700 dark:text-rose-400">
                      Optimization Required
                    </h5>
                    <p className="text-[10px] text-rose-600 dark:text-rose-300 mt-0.5">
                      Integrity is low. Please re-upload with smaller file sizes or clearer scans
                      for 100% accuracy.
                    </p>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {memory.length === 0 && (
          <EmptyState
            icon={<Microscope />}
            title="Stream Empty"
            description="Your life stream is awaiting data input. Internalize a document or log an event to see your cognitive archive."
            actionLabel="Initialize Record"
            onAction={() =>
              (
                document.querySelector('input[placeholder*="ate nasi"]') as HTMLInputElement | null
              )?.focus()
            }
            className="py-32"
          />
        )}
      </div>
    </div>
  );
};
