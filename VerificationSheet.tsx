import React from 'react';
import {
  X,
  BrainCircuit,
  Database,
  ShieldAlert,
  Check,
  Lock,
  User,
  ShieldCheck,
  Cpu,
  Zap,
} from 'lucide-react';
import { CategorizedFact, ProposedUpdate, UserProfile } from './types';
import { ClaimItem } from './ClaimItem';
import { DiffRow } from './DiffRow';

interface VerificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  facts: CategorizedFact[];
  updates: ProposedUpdate[];
  members: UserProfile[];
  onCommit: () => void;
  onRejectFact: (idx: number) => void;
  onRejectUpdate: (idx: number) => void;
}

export const VerificationSheet: React.FC<VerificationSheetProps> = ({
  isOpen,
  onClose,
  facts,
  updates,
  members,
  onCommit,
  onRejectFact,
  onRejectUpdate,
}) => {
  if (!isOpen) return null;

  const getUserName = (id: string) =>
    members.find((m) => m.id === id)?.identify.name || 'Unknown User';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-[#0D1117]/90 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-400">
        {/* Premium Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
              <div className="relative p-4 bg-indigo-600/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                <BrainCircuit size={28} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                  Neural Synthesis
                </span>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight italic flex items-center gap-3">
                Verification Engine <span className="text-slate-700 not-italic font-light">|</span>{' '}
                <span className="text-indigo-400">Sync Review</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 hover:bg-white/5 rounded-[1.5rem] text-slate-500 hover:text-white transition-all group active:scale-90"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 overflow-hidden">
          {/* Section: Atomic Facts */}
          <div className="p-10 space-y-8 bg-[#0D1117]/40 overflow-y-auto no-scrollbar max-h-[50vh]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-xl text-indigo-400 border border-white/5">
                  <Database size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Knowledge Points
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                {facts.length} Signals
              </div>
            </div>

            <div className="space-y-4">
              {facts.length > 0 ? (
                facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="relative group/item animate-in slide-in-from-left-4 duration-500"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <div className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center">
                        <User size={10} className="text-indigo-500" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                        {getUserName(fact.ownerId!)}
                      </span>
                    </div>
                    <div className="transition-all duration-300 hover:translate-x-1">
                      <ClaimItem
                        claim={fact.fact}
                        category={fact.category}
                        confidence={fact.confidence}
                        timestamp={new Date().toISOString()}
                        sourceType="text"
                      />
                    </div>
                    <button
                      onClick={() => onRejectFact(idx)}
                      className="absolute -right-2 top-2 opacity-0 group-hover/item:opacity-100 p-2.5 text-slate-400 hover:text-rose-500 bg-slate-900 border border-white/10 rounded-xl transition-all shadow-2xl hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-600 italic text-sm border-2 border-dashed border-white/5 rounded-[2rem]">
                  No new knowledge points extracted.
                </div>
              )}
            </div>
          </div>

          {/* Section: Vault Mutations */}
          <div className="p-10 space-y-8 bg-[#0D1117]/40 overflow-y-auto no-scrollbar max-h-[50vh]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-xl text-emerald-400 border border-white/5">
                  <ShieldAlert size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Vault Mutations
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                {updates.length} Mutations
              </div>
            </div>

            <div className="space-y-4">
              {updates.length > 0 ? (
                updates.map((update, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 animate-in slide-in-from-right-4 duration-500"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-1 px-2">
                      <div className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center">
                        <Zap size={10} className="text-emerald-500" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                        Target: {getUserName(update.targetUserId!)}
                      </span>
                    </div>
                    <div className="transition-all duration-300 hover:translate-x-1">
                      <DiffRow
                        field={`${update.section}.${update.field}`}
                        oldValue={update.oldValue || 'None'}
                        newValue={update.newValue}
                        confidence={update.confidence}
                        evidence={update.reasoning}
                        onApprove={() => {}}
                        onReject={() => onRejectUpdate(idx)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-600 italic text-sm border-2 border-dashed border-white/5 rounded-[2rem]">
                  No profile refinements suggested.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* High-Tech Footer */}
        <div className="p-10 bg-[#08090C] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">
                System Integrity
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full border-2 border-emerald-500/20 animate-ping"></div>
                  <div className="relative w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white block">
                    Ready for Kernel Commit
                  </span>
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
                    Zero conflicts detected in sync buffer
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px h-12 bg-white/5 mx-2" />

            <div className="hidden lg:flex flex-col">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">
                Neural Load
              </p>
              <div className="flex items-center gap-2">
                <Cpu size={12} className="text-indigo-500" />
                <span className="text-[10px] font-mono text-indigo-400 font-bold">
                  L1/L2 Cache Primed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              Abort Sync
            </button>
            <button
              onClick={onCommit}
              disabled={facts.length === 0 && updates.length === 0}
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:grayscale text-white px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] shadow-[0_20px_50px_-10px_rgba(99,102,241,0.5)] flex items-center justify-center gap-4 transition-all active:scale-[0.98] group"
            >
              <Zap
                size={18}
                fill="currentColor"
                className="group-hover:scale-125 transition-transform"
              />
              Synchronize State
              <Check size={20} strokeWidth={4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
