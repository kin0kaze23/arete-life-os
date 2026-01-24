import React, { useState, useRef } from 'react';
import {
  Check,
  X,
  FileText,
  Upload,
  BrainCircuit,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Loader2,
  ListTodo,
  Database,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { BentoCard, Skeleton, getCategoryColor } from './SharedUI';
import { CategorizedFact, DailyTask, ProposedUpdate, Category } from './types';
import { EmptyState } from './EmptyState';
import { ClaimItem } from './ClaimItem';
import { DiffRow } from './DiffRow';

interface DigestViewProps {
  claims: CategorizedFact[];
  proposedUpdates: ProposedUpdate[];
  proposedTasks: DailyTask[];
  isProcessing: boolean;
  onApprove: (type: 'claim' | 'update' | 'task', id: string) => void;
  onReject: (type: 'claim' | 'update' | 'task', id: string) => void;
  onApplyAll: () => void;
  onDismissAll: () => void;
  onDigest: (input: string, files?: File[]) => void;
}

export const DigestView: React.FC<DigestViewProps> = ({
  claims,
  proposedUpdates,
  proposedTasks,
  isProcessing,
  onApprove,
  onReject,
  onApplyAll,
  onDismissAll,
  onDigest,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDigest = () => {
    if (!inputText.trim() && selectedFiles.length === 0) return;
    onDigest(inputText, selectedFiles);
  };

  const hasResults = claims.length > 0 || proposedUpdates.length > 0 || proposedTasks.length > 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 pb-32">
      {/* Header & Capture Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Internalization Engine
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
            Neural Digest
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl">
            Ingest unstructured data to update your Vault, log memories, and generate tasks in one
            atomic operation.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste journal entries, meeting notes, or health reports here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-indigo-500/50 text-sm text-slate-200 placeholder-slate-600 transition-all font-medium"
            disabled={isProcessing}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <Upload size={14} />
                {selectedFiles.length > 0 ? `${selectedFiles.length} Files` : 'Upload Assets'}
              </button>
              {selectedFiles.length > 0 && (
                <button
                  onClick={() => setSelectedFiles([])}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={handleDigest}
              disabled={isProcessing || (!inputText && selectedFiles.length === 0)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Process Stream
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column Results Grid */}
      {(hasResults || isProcessing) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Column 1: Extracted Claims (Memory) */}
          <BentoCard
            title="Extracted Claims"
            icon={<Database size={16} />}
            className="md:h-[600px] border-slate-800 bg-slate-950/30"
          >
            <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 mt-4">
              {isProcessing ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : claims.length > 0 ? (
                claims.map((claim, idx) => (
                  <div key={idx} className="relative group">
                    <ClaimItem
                      claim={claim.fact}
                      category={claim.category}
                      confidence={claim.confidence}
                      timestamp={claim.eventDate || new Date().toISOString()}
                      sourceType={claim.sourceType || 'text'}
                      evidenceSnippet={claim.evidence || ''}
                    />
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded-lg backdrop-blur-sm p-1 flex gap-1 border border-slate-700 shadow-lg">
                      <button
                        onClick={() => onApprove('claim', String(idx))}
                        className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => onReject('claim', String(idx))}
                        className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                  <Database size={32} />
                  <span className="text-xs font-bold uppercase mt-2">No Claims</span>
                </div>
              )}
            </div>
          </BentoCard>

          {/* Column 2: Proposed Updates (Vault) */}
          <BentoCard
            title="Profile Updates"
            icon={<ShieldAlert size={16} />}
            className="md:h-[600px] border-slate-800 bg-slate-950/30"
          >
            <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 mt-4">
              {isProcessing ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : proposedUpdates.length > 0 ? (
                proposedUpdates.map((update) => (
                  <DiffRow
                    key={update.id}
                    field={`${update.section} / ${update.field}`}
                    oldValue={update.oldValue}
                    newValue={update.newValue}
                    confidence={update.confidence}
                    evidence={update.reasoning}
                    onApprove={() => onApprove('update', update.id)}
                    onReject={() => onReject('update', update.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                  <ShieldAlert size={32} />
                  <span className="text-xs font-bold uppercase mt-2">No Updates</span>
                </div>
              )}
            </div>
          </BentoCard>

          {/* Column 3: Proposed Tasks (Action) */}
          <BentoCard
            title="Generated Tasks"
            icon={<ListTodo size={16} />}
            className="md:h-[600px] border-slate-800 bg-slate-950/30"
          >
            <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 mt-4">
              {isProcessing ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              ) : proposedTasks.length > 0 ? (
                proposedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex gap-3 group hover:border-indigo-500/30 transition-all"
                  >
                    <div className="mt-1">
                      <div
                        className={`w-2 h-2 rounded-sm ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-slate-200 font-bold leading-tight">{task.title}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{task.description}</p>
                      <span
                        className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border inline-block mt-1 ${getCategoryColor(task.category)}`}
                      >
                        {task.category}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onApprove('task', task.id)}
                        className="p-1 hover:text-emerald-400 text-slate-600 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => onReject('task', task.id)}
                        className="p-1 hover:text-rose-400 text-slate-600 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                  <ListTodo size={32} />
                  <span className="text-xs font-bold uppercase mt-2">No Tasks</span>
                </div>
              )}
            </div>
          </BentoCard>
        </div>
      )}

      {/* Summary Footer */}
      {hasResults && !isProcessing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-12 fade-in duration-500 w-[90%] max-w-2xl">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] border border-slate-700 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex flex-col pl-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Pending Review
                </span>
                <span className="text-sm font-bold text-white">
                  {claims.length + proposedUpdates.length + proposedTasks.length} Items
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onDismissAll}
                className="px-6 py-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={onApplyAll}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check size={16} strokeWidth={3} /> Apply All
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasResults && !isProcessing && (
        <EmptyState
          icon={<BrainCircuit />}
          title="Ready to Ingest"
          description="Aura is ready to break down your inputs into atomic data points. Use the box above."
          className="py-20"
        />
      )}
    </div>
  );
};
