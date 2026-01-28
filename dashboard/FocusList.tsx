import React, { useState } from 'react';
import { Circle, CheckCircle2, ChevronRight, Crown, Repeat, ArrowRight, Rocket, Trash2, RefreshCw, Check, X } from 'lucide-react';
import { DailyTask, Category, MemoryEntry } from '@/data';

interface FocusListProps {
  tasks: DailyTask[];
  habitItems: MemoryEntry[];
  onToggleTask: (id: string) => void;
  onToggleHabit: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRefreshPlan?: () => void;
  onRefreshQueue?: () => void;
  isPlanning?: boolean;
}

export const FocusList: React.FC<FocusListProps> = ({
  tasks,
  habitItems,
  onToggleTask,
  onToggleHabit,
  onDeleteTask,
  onRefreshPlan,
  onRefreshQueue,
  isPlanning,
}) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Separate tasks into Strategic (Top 3 or Priority high) and Queue
  const activeTasks = tasks.map(t => ({ ...t, type: 'task' as const }));
  const uncompletedTasks = activeTasks.filter(t => !t.completed);

  const strategicTasks = uncompletedTasks.filter(t => t.priority === 'high').slice(0, 3);
  const queueTasks = activeTasks.filter(t => !strategicTasks.find(s => s.id === t.id));

  // Process Rituals
  const rituals = habitItems.map((h) => ({
    id: h.id,
    type: 'habit' as const,
    title: (h.metadata?.payload as any)?.title || h.content,
    completed: false,
    category: Category.HABIT,
  }));

  const handleTaskClick = (id: string) => {
    if (confirmingId === id) {
      onToggleTask(id);
      setConfirmingId(null);
    } else {
      setConfirmingId(id);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmingId(prev => prev === id ? null : prev), 3000);
    }
  };

  const renderTaskItem = (task: DailyTask, isStrategic = false) => {
    const isConfirming = confirmingId === task.id;
    const isExpanded = expandedId === task.id;

    return (
      <div
        key={task.id}
        className={`group relative flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 ${task.completed
          ? 'opacity-40 bg-slate-900/20 border-white/5'
          : isStrategic
            ? 'bg-gradient-to-r from-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40'
            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
          } ${isExpanded ? 'ring-1 ring-indigo-500/30 ring-inset' : ''}`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={() => handleTaskClick(task.id)}
            className={`mt-1 flex-shrink-0 transition-all duration-300 ${isConfirming ? 'scale-110 text-emerald-400' : task.completed ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-400'
              }`}
          >
            {isConfirming ? (
              <div className="flex flex-col items-center gap-1">
                <Check size={20} className="animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Done?</span>
              </div>
            ) : task.completed ? (
              <CheckCircle2 size={20} fill="currentColor" className="text-black" />
            ) : (
              <Circle size={20} />
            )}
          </button>

          <div
            className="flex-1 min-w-0 space-y-1 cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : task.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className={`text-sm font-black tracking-tight leading-tight ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="p-1 hover:text-red-400 text-slate-600 transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border uppercase tracking-widest ${isStrategic ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-white/5'
                }`}>
                {task.category}
              </span>
              {task.estimate_min && (
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{task.estimate_min}m</span>
              )}
              {!isExpanded && (
                <span className="text-[9px] text-indigo-400/60 font-black uppercase tracking-widest ml-auto animate-pulse">View Strategy</span>
              )}
            </div>
          </div>
        </div>

        {isExpanded && !task.completed && (
          <div className="pl-9 pb-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* THE WHY - Strategic Motivator */}
            {(task.why || task.benefits) && (
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Strategic Rationale</p>
                </div>
                {task.why && (
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">Goal Alignment: <span className="text-slate-400 font-normal italic">"{task.why}"</span></p>
                )}
                {task.benefits && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Expected Benefit</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic">"{task.benefits}"</p>
                  </div>
                )}
              </div>
            )}

            {/* THE HOW - Tactical Brief */}
            {(task.steps && task.steps.length > 0 || task.definitionOfDone) && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tactical Brief</p>

                {task.steps && task.steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600/80">Milestone Sequence</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {task.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 group/step">
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover/step:border-indigo-500 transition-colors">
                            <span className="text-[8px] font-bold text-slate-500 leading-none">{idx + 1}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 leading-tight group-hover/step:text-slate-200 transition-colors">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.definitionOfDone && (
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80 mb-0.5 leading-none">Target Outcome</p>
                      <p className="text-[11px] text-slate-200 font-semibold leading-snug">{task.definitionOfDone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-8 no-scrollbar">

      {/* STRATEGIC MISSION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
            <Crown size={12} /> Strategic Focus
          </h3>
          <button
            onClick={onRefreshPlan}
            disabled={isPlanning}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={10} className={isPlanning ? 'animate-spin' : ''} />
            {isPlanning ? 'Syncing...' : 'Refresh Strategy'}
          </button>
        </div>

        <div className="space-y-3">
          {strategicTasks.length > 0 ? (
            strategicTasks.map(t => renderTaskItem(t, true))
          ) : uncompletedTasks.length > 0 ? (
            <div className="text-center py-6 border border-dashed border-indigo-500/20 rounded-2xl bg-indigo-500/[0.02]">
              <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest leading-none">High Priority Cleared</p>
              <p className="text-[9px] text-slate-600 mt-2">Executive focus shifting to secondary objectives.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* RITUALS CHIPS */}
      {rituals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <Repeat size={12} /> Habits
          </h3>
          <div className="flex flex-wrap gap-2">
            {rituals.map(ritual => (
              <button
                key={ritual.id}
                onClick={() => onToggleHabit(ritual.id)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-xl transition-all group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-500 transition-colors" />
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200">{ritual.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THE QUEUE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <ArrowRight size={12} /> The Queue
          </h3>
          <button
            onClick={onRefreshQueue}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw size={10} />
            Refill Queue
          </button>
        </div>

        <div className="space-y-3">
          {queueTasks.length > 0 ? (
            queueTasks.map(t => renderTaskItem(t))
          ) : (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center gap-2">
              <Rocket size={24} className="text-slate-800" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Queue Vacuum</p>
                <button
                  onClick={onRefreshQueue}
                  className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Generate Daily Mission
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
