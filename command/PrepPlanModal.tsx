import React, { useState, useEffect } from 'react';
import { TimelineEvent, Recommendation, UserProfile, MemoryEntry } from '@/data';
import {
  X,
  Sparkles,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  MapPin,
  Circle,
} from 'lucide-react';
import { generateEventPrepPlan } from '@/ai';
import { getEventEmoji } from '@/shared';

interface PrepPlanModalProps {
  event: TimelineEvent;
  profile: UserProfile;
  history: MemoryEntry[];
  onClose: () => void;
  onActivate: (plan: Recommendation, eventId?: string) => void;
}

export const PrepPlanModal: React.FC<PrepPlanModalProps> = ({
  event,
  profile,
  history,
  onClose,
  onActivate,
}) => {
  const shouldEnableSearch = (evt: TimelineEvent) => {
    const text = `${evt.title} ${evt.description} ${evt.fields?.location || ''}`.toLowerCase();
    const markers = [
      '#research',
      '[research]',
      'research:',
      'with sources',
      'grounded',
      'citations',
    ];
    return markers.some((marker) => text.includes(marker));
  };

  const enableSearch = shouldEnableSearch(event);
  const [isGenerating, setIsGenerating] = useState(true);
  const [plan, setPlan] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // In-memory cache to avoid re-fetching for same event
  const cacheRef = React.useRef<Map<string, Recommendation>>(new Map());

  useEffect(() => {
    const runSimulation = async () => {
      // Check cache first
      const cached = cacheRef.current.get(event.id);
      if (cached) {
        setPlan(cached);
        setIsGenerating(false);
        return;
      }

      // Create timeout controller (5 seconds max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const result = await generateEventPrepPlan(event, profile, history, enableSearch);
        clearTimeout(timeoutId);

        // Cache the result and pre-select all steps
        cacheRef.current.set(event.id, result);
        setPlan(result);
        if (result.steps) {
          setSelectedIndices(new Set(result.steps.map((_, i) => i)));
        }
      } catch (err: any) {
        clearTimeout(timeoutId);

        // On timeout or error, show graceful fallback
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          setError('Request timed out. Try again later.');
        } else {
          setError('Unable to generate prep plan.');
        }
      } finally {
        setIsGenerating(false);
      }
    };
    runSimulation();
  }, [event.id, enableSearch]);

  const eventEmoji = getEventEmoji(event.title, event.category);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-[#0A0C10] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Simplified Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{eventEmoji}</div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight italic">
                {event.title}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-2">
                <Calendar size={10} />{' '}
                {new Date(event.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {event.fields?.location && (
                  <span className="flex items-center gap-1">
                    • <MapPin size={10} /> {event.fields.location}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-slate-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-8">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Sparkles
                  size={24}
                  className="absolute inset-0 m-auto text-indigo-400 animate-pulse"
                />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-black text-white uppercase italic mb-1">
                  Synthesizing Strategy
                </h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  Analyzing past performance & constraints...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em]">
              {error}
            </div>
          ) : (
            plan && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* One-line AI Insight */}
                <div className="flex items-start gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mb-6">
                  <Sparkles size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-indigo-200/80 font-semibold leading-relaxed italic">
                    {plan.rationale.split('.')[0]}.
                  </p>
                </div>

                {/* Checklist Style Steps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight size={14} className="text-indigo-500" />
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Prep Checklist
                    </h5>
                  </div>
                  <div className="space-y-2" data-testid="prep-steps">
                    {plan.steps?.map((step, i) => {
                      const isSelected = selectedIndices.has(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          data-testid="prep-step"
                          onClick={(e) => {
                            e.preventDefault();
                            const next = new Set(selectedIndices);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            setSelectedIndices(next);
                          }}
                          className={`w-full flex gap-3 items-center text-left group p-4 border rounded-2xl transition-all ${
                            isSelected
                              ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                              : 'bg-white/[0.02] border-white/5 opacity-50 hover:opacity-100 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                                : 'border-slate-700'
                            }`}
                          >
                            {isSelected && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <p
                            className={`text-xs font-bold leading-relaxed transition-colors ${
                              isSelected ? 'text-indigo-100' : 'text-slate-500'
                            }`}
                          >
                            {step}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simplified Success Criteria */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Success Outcome
                    </h5>
                  </div>
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <p className="text-xs text-emerald-200/80 font-bold leading-relaxed italic">
                      {plan.definitionOfDone.split('.')[0]}.
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Simplified Footer with no overlap */}
        <div className="px-8 py-6 bg-[#08090C] border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-1 items-center gap-8 min-w-0 overflow-hidden">
            <div className="flex flex-col shrink-0">
              <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">
                Prep Time
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 whitespace-nowrap">
                <Clock size={12} className="text-indigo-500" /> {plan?.estimatedTime || '---'}
              </span>
            </div>

            <div className="w-[1px] h-8 bg-white/5 shrink-0 hidden sm:block" />

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest mb-1">
                Key Asset
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 truncate">
                <Package size={12} className="text-indigo-500 shrink-0" />
                <span className="truncate">{plan?.inputs?.[0] || '---'}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (plan && selectedIndices.size > 0) {
                const filteredPlan = {
                  ...plan,
                  steps: plan.steps.filter((_, i) => selectedIndices.has(i)),
                };
                onActivate(filteredPlan, event.id);
              }
            }}
            disabled={isGenerating || !plan || selectedIndices.size === 0}
            data-testid="prep-execute"
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all whitespace-nowrap"
          >
            {selectedIndices.size === 0
              ? 'Select Tasks'
              : `Add ${selectedIndices.size} ${selectedIndices.size === 1 ? 'Task' : 'Tasks'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
