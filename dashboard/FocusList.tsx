import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  RefreshCw,
  Repeat,
  Trash2,
} from 'lucide-react';
import { Category, DailyTask, MemoryEntry, TimelineEvent } from '@/data';
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

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTaskHorizon = (task: DailyTask): 'today' | 'tomorrow' | 'later' => {
  const target = formatDateKey(new Date(task.due_at || task.createdAt));
  const now = new Date();
  const today = formatDateKey(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrow = formatDateKey(tomorrowDate);

  if (target === today) return 'today';
  if (target === tomorrow) return 'tomorrow';
  return 'later';
};

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

  const { groups, priorityTasks, queueTasks, tomorrowTasks } = useMemo(() => {
    const grouped: Record<string, DailyTask[]> = {};
    const todayStandalone: DailyTask[] = [];
    const tomorrowStandalone: DailyTask[] = [];

    tasks.forEach((task) => {
      if (task.eventId) {
        if (!grouped[task.eventId]) grouped[task.eventId] = [];
        grouped[task.eventId].push(task);
        return;
      }

      const horizon = getTaskHorizon(task);
      if (horizon === 'today') todayStandalone.push(task);
      if (horizon === 'tomorrow') tomorrowStandalone.push(task);
    });

    const priority = todayStandalone
      .filter((task) => task.priority === 'high' && !task.completed)
      .slice(0, 3);
    const queue = todayStandalone.filter((task) => !priority.some((item) => item.id === task.id));

    return {
      groups: grouped,
      priorityTasks: priority,
      queueTasks: queue,
      tomorrowTasks: tomorrowStandalone,
    };
  }, [tasks]);

  const rituals = useMemo(
    () =>
      habitItems.map((habit) => ({
        id: habit.id,
        title: (habit.metadata?.payload as any)?.title || habit.content,
      })),
    [habitItems]
  );

  const renderTaskDetails = (task: DailyTask) => {
    const lines = [task.why, task.benefits, task.definitionOfDone].filter(Boolean) as string[];
    const steps = Array.isArray(task.steps) ? task.steps.slice(0, 3) : [];

    if (lines.length === 0 && steps.length === 0) return null;

    return (
      <div className="mt-3 rounded-[18px] border border-white/8 bg-black/20 p-4">
        {lines.length > 0 && (
          <div className="space-y-2">
            {lines.slice(0, 2).map((line) => (
              <p key={line} className="text-sm leading-6 text-slate-300">
                {line}
              </p>
            ))}
          </div>
        )}

        {steps.length > 0 && (
          <ol className="mt-3 space-y-2">
            {steps.map((step, index) => (
              <li key={`${task.id}-step-${index}`} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-slate-200">
                  {index + 1}
                </span>
                <span className="leading-6">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  };

  const renderTaskItem = (task: DailyTask, tone: 'priority' | 'default' = 'default') => {
    const isExpanded = expandedId === task.id;

    return (
      <article
        key={task.id}
        className={`rounded-[22px] border p-4 transition ${
          task.completed
            ? 'border-white/6 bg-white/[0.02] opacity-55'
            : tone === 'priority'
              ? 'border-[#86a8ff]/22 bg-[#86a8ff]/[0.06]'
              : 'border-white/8 bg-white/[0.03]'
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleTask(task.id)}
            aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
            className="mt-0.5 rounded-full p-1 text-slate-400 transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a8ff]"
          >
            {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p
                  className={`text-[15px] font-semibold leading-6 ${
                    task.completed ? 'text-slate-500 line-through' : 'text-slate-100'
                  }`}
                >
                  {task.title}
                </p>
                {task.description && task.description !== task.title && (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                    {task.description}
                  </p>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label="Delete task"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  aria-label={isExpanded ? 'Collapse task details' : 'Expand task details'}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a8ff]"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                {task.category}
              </span>
              {task.estimate_min && (
                <span className="text-xs text-slate-500">{task.estimate_min} min</span>
              )}
              {task.best_window && <span className="text-xs text-slate-500">{task.best_window}</span>}
            </div>

            {isExpanded && !task.completed && renderTaskDetails(task)}
          </div>
        </div>
      </article>
    );
  };

  const renderGroup = (eventId: string, groupedTasks: DailyTask[]) => {
    const event = events.find((item) => item.id === eventId);
    const title = event?.title || 'Event prep';
    const category = event?.category || Category.GENERAL;
    const emoji = getEventEmoji(title, category);
    const isExpanded = expandedGroups[eventId] ?? true;
    const completedCount = groupedTasks.filter((task) => task.completed).length;

    return (
      <section
        key={eventId}
        data-testid="prep-group"
        data-event-id={eventId}
        className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
      >
        <button
          type="button"
          onClick={() =>
            setExpandedGroups((prev) => ({
              ...prev,
              [eventId]: !isExpanded,
            }))
          }
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="text-lg">{emoji}</div>
            <div>
              <p className="text-[15px] font-semibold text-slate-100">{title}</p>
              <p className="mt-1 text-xs text-slate-400">
                {completedCount}/{groupedTasks.length} complete
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown size={16} className="text-slate-500" />
          ) : (
            <ChevronRight size={16} className="text-slate-500" />
          )}
        </button>

        {isExpanded && <div className="mt-3 space-y-3">{groupedTasks.map((task) => renderTaskItem(task))}</div>}
      </section>
    );
  };

  const renderEmpty = (label: string, actionLabel?: string, onAction?: () => void) => (
    <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center">
      <p className="text-sm text-slate-400">{label}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="focus-list">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Priority
            </p>
            <p className="mt-1 text-sm text-slate-300">The few tasks that should win the day.</p>
          </div>
          <button
            type="button"
            onClick={onRefreshPlan}
            disabled={isPlanning}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-50"
          >
            <RefreshCw size={12} className={isPlanning ? 'animate-spin' : ''} />
            {isPlanning ? 'Syncing' : 'Sync'}
          </button>
        </div>

        {Object.keys(groups).length > 0 && (
          <div className="space-y-3">{Object.entries(groups).map(([id, group]) => renderGroup(id, group))}</div>
        )}

        <div className="space-y-3">
          {priorityTasks.length > 0
            ? priorityTasks.map((task) => renderTaskItem(task, 'priority'))
            : renderEmpty('No priority tasks yet.', 'Plan today', onRefreshPlan)}
        </div>
      </section>

      {rituals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Repeat size={13} />
            <p className="text-sm font-semibold">Habits</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rituals.map((ritual) => (
              <button
                key={ritual.id}
                type="button"
                onClick={() => onToggleHabit(ritual.id)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-300/30 hover:bg-emerald-500/[0.06]"
              >
                {ritual.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-200">
            <ArrowRight size={13} />
            <p className="text-sm font-semibold">Queue</p>
          </div>
        </div>

        <div className="space-y-3">
          {queueTasks.length > 0
            ? queueTasks.map((task) => renderTaskItem(task))
            : renderEmpty('The queue is clear for today.', 'Generate tasks', onRefreshQueue)}
        </div>
      </section>

      {tomorrowTasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <CalendarClock size={13} />
            <p className="text-sm font-semibold">Tomorrow</p>
          </div>
          <div className="space-y-3">{tomorrowTasks.map((task) => renderTaskItem(task))}</div>
        </section>
      )}
    </div>
  );
};
