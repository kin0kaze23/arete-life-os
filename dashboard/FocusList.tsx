import React, { useState, useMemo } from 'react';
import {
  Circle,
  CheckCircle2,
  ChevronRight,
  Crown,
  Repeat,
  ArrowRight,
  Rocket,
  Trash2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { DailyTask, Category, MemoryEntry, TimelineEvent } from '@/data';
import { getEventEmoji } from '@/shared';

interface FocusListProps {
  tasks: DailyTask[];
  habitItems: MemoryEntry[];
  events?: TimelineEvent[];
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
  events = [],
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Group tasks by eventId
  const { groups, standalone } = useMemo(() => {
    const groups: Record<string, DailyTask[]> = {};
    const standalone: DailyTask[] = [];

    tasks.forEach((task) => {
      if (task.eventId) {
        if (!groups[task.eventId]) groups[task.eventId] = [];
        groups[task.eventId].push(task);
      } else {
        standalone.push(task);
      }
    });

    return { groups, standalone };
  }, [tasks]);

  // Helper to determine task horizon based on due_at or createdAt (using local time)
  const getTaskHorizon = (task: DailyTask): 'today' | 'tomorrow' | 'later' => {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const targetDateStr = formatDate(new Date(task.due_at || task.createdAt));
    const now = new Date();
    const todayStr = formatDate(now);

    const tom = new Date(now);
    tom.setDate(now.getDate() + 1);
    const tomorrowStr = formatDate(tom);

    if (targetDateStr === todayStr) return 'today';
    if (targetDateStr === tomorrowStr) return 'tomorrow';
    return 'later';
  };

  // Separate tasks by date horizon
  const todayStandalone = standalone.filter((t) => getTaskHorizon(t) === 'today');
  const tomorrowStandalone = standalone.filter((t) => getTaskHorizon(t) === 'tomorrow');

  // Derived tasks for legacy rendering logic
  const activeTasks = tasks.map((t) => ({ ...t, type: 'task' as const }));
  const uncompletedTasks = activeTasks.filter((t) => !t.completed);

  // Strategic Focus: Top 3 High Priority Standalone Tasks (Today only)
  const strategicTasks = todayStandalone
    .filter((t) => t.priority === 'high' && !t.completed)
    .slice(0, 3);

  // The Queue: Today's standalone tasks minus strategic ones
  const queueTasks = todayStandalone.filter((t) => !strategicTasks.find((s) => s.id === t.id));

  // Tomorrow's tasks for Upcoming section
  const upcomingTasks = tomorrowStandalone;

  // Process Rituals
  const rituals = habitItems.map((h) => ({
    id: h.id,
    type: 'habit' as const,
    title: (h.metadata?.payload as any)?.title || h.content,
    completed: false,
    category: Category.HABIT,
  }));

  // handleTaskClick removed for single-click toggle simplicity

  const renderTaskItem = (task: DailyTask, isStrategic = false) => {
    const isExpanded = expandedId === task.id;

    return (
      <div
        key={task.id}
        className={`group relative flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 ${
          task.completed
            ? 'opacity-40 bg-slate-900/20 border-white/5'
            : isStrategic
              ? 'bg-gradient-to-r from-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40'
              : 'bg-white/[0.02] border-white/5 hover:border-white/10'
        } ${isExpanded ? 'ring-1 ring-indigo-500/30 ring-inset' : ''}`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={() => onToggleTask(task.id)}
            aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
            className={`mt-1 flex-shrink-0 p-2 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              task.completed ? 'text-indigo-500' : 'text-slate-500 group-hover:text-indigo-400'
            }`}
          >
            {task.completed ? (
              <CheckCircle2 size={20} fill="currentColor" className="text-black" />
            ) : (
              <Circle size={20} />
            )}
          </button>

          <div
            role="button"
            tabIndex={0}
            className="flex-1 min-w-0 space-y-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 rounded-lg"
            onClick={() => setExpandedId(isExpanded ? null : task.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpandedId(isExpanded ? null : task.id);
              }
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h4
                className={`text-sm font-bold tracking-tight leading-tight ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}
              >
                {task.title}
              </h4>
              <div className="flex items-center gap-2">
                <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    aria-label="Delete task"
                    className="p-2 min-w-[36px] min-h-[36px] hover:text-red-400 text-slate-600 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
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
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-[0.2em] ${
                  isStrategic
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20'
                    : 'bg-slate-800 text-slate-400 border-white/5'
                }`}
              >
                {task.category}
              </span>
              {task.estimate_min && (
                <span className="text-[11px] text-slate-500 font-medium uppercase tracking-[0.2em]">
                  {task.estimate_min}m
                </span>
              )}
              {!isExpanded && (
                <span className="text-[11px] text-indigo-400/60 font-semibold uppercase tracking-[0.2em] ml-auto">
                  View Strategy
                </span>
              )}
            </div>
          </div>
        </div>

        {isExpanded && !task.completed && (
          <div className="pl-9 pb-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
            {/* THE WHY - Strategic Motivator */}
            {(task.why || task.benefits) && (
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
                    Strategic Rationale
                  </p>
                </div>
                {task.why && (
                  <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
                    Goal Alignment:{' '}
                    <span className="text-slate-400 font-normal italic">"{task.why}"</span>
                  </p>
                )}
                {task.benefits && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
                      Expected Benefit
                    </p>
                    <p className="text-[12px] text-slate-300 leading-relaxed italic">
                      "{task.benefits}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* THE HOW - Tactical Brief */}
            {((task.steps && task.steps.length > 0) || task.definitionOfDone) && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Tactical Brief
                </p>

                {task.steps && task.steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600/80">
                      Milestone Sequence
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {task.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 group/step">
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover/step:border-indigo-500 transition-colors">
                            <span className="text-[10px] font-bold text-slate-500 leading-none">
                              {idx + 1}
                            </span>
                          </div>
                          <span className="text-[12px] text-slate-400 leading-tight group-hover/step:text-slate-200 transition-colors">
                            {step}
                          </span>
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-500/80 mb-0.5 leading-none">
                        Target Outcome
                      </p>
                      <p className="text-[12px] text-slate-200 font-semibold leading-snug">
                        {task.definitionOfDone}
                      </p>
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

  const renderGroupedTasks = (eventId: string, groupedTasks: DailyTask[]) => {
    const event = events.find((e) => e.id === eventId);
    const title = event?.title || 'Event Preparation';
    const category = event?.category || Category.GENERAL;
    const emoji = getEventEmoji(title, category);
    const isExpanded = expandedGroups[eventId];

    // Calculate progress
    const completedCount = groupedTasks.filter((t) => t.completed).length;
    const totalCount = groupedTasks.length;
    const isFullyComplete = completedCount === totalCount;

    return (
      <div key={eventId} className="space-y-2.5">
      <div
        onClick={() => toggleGroup(eventId)}
        data-testid="prep-group"
        data-event-id={eventId}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleGroup(eventId);
          }
        }}
        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
          isFullyComplete
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40'
        }`}
      >
          <div className="flex items-center gap-3">
            <div className="text-xl">{emoji}</div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight italic flex items-center gap-2">
                {title}
                {isFullyComplete && (
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500 animate-in zoom-in duration-300"
                  />
                )}
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.2em]">
                Prep Mission • {completedCount}/{totalCount} Complete
              </p>
            </div>
          </div>
          <div className="text-slate-600">
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
            {groupedTasks.map((t) => renderTaskItem(t))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6 no-scrollbar" data-testid="focus-list">
      {/* STRATEGIC MISSION */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
            <Crown size={12} /> Strategic Focus
          </h3>
          <button
            onClick={onRefreshPlan}
            disabled={isPlanning}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg px-2 py-1"
          >
            <RefreshCw size={10} className={isPlanning ? 'animate-spin' : ''} />
            {isPlanning ? 'Syncing...' : 'Refresh Strategy'}
          </button>
        </div>

        {/* Grouped Event Prep Tasks */}
        {Object.keys(groups).length > 0 && (
          <div className="space-y-4">
            {Object.entries(groups).map(([id, gTasks]) => renderGroupedTasks(id, gTasks))}
          </div>
        )}

        <div className="space-y-3">
          {strategicTasks.length > 0 ? (
            strategicTasks.map((t) => renderTaskItem(t, true))
          ) : uncompletedTasks.length > 0 ? (
            <div className="text-center py-6 border border-dashed border-indigo-500/20 rounded-2xl bg-indigo-500/[0.02]">
              <p className="text-[11px] font-semibold text-indigo-400/60 uppercase tracking-[0.2em] leading-none">
                Priority tasks done
              </p>
              <p className="text-[11px] text-slate-600 mt-2">
                All high-priority work cleared. Moving to the queue.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* RITUALS CHIPS */}
      {rituals.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
            <Repeat size={12} /> Habits
          </h3>
          <div className="flex flex-wrap gap-2">
            {rituals.map((ritual) => (
              <button
                key={ritual.id}
                onClick={() => onToggleHabit(ritual.id)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-500 transition-colors" />
                <span className="text-[12px] font-bold text-slate-400 group-hover:text-slate-200">
                  {ritual.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THE QUEUE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <ArrowRight size={12} /> The Queue
          </h3>
          <button
            onClick={onRefreshQueue}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg px-2 py-1"
          >
            <RefreshCw size={10} />
            Refill Queue
          </button>
        </div>

        <div className="space-y-3">
          {queueTasks.length > 0 ? (
            queueTasks.map((t) => renderTaskItem(t))
          ) : (
            <div className="text-center py-10 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center gap-2">
              <Rocket size={24} className="text-slate-800" />
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-[0.2em]">
                  No tasks yet
                </p>
                <button
                  onClick={onRefreshQueue}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg px-2 py-1"
                >
                  Generate today's tasks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UPCOMING TASKS (Tomorrow) */}
      {upcomingTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-500/80 flex items-center gap-2">
            <ArrowRight size={12} /> Upcoming Tasks
          </h3>
          <div className="space-y-3">{upcomingTasks.map((t) => renderTaskItem(t))}</div>
        </div>
      )}
    </div>
  );
};
