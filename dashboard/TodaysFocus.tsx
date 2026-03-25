import React from 'react';
import { DailyTask, Category } from '@/data';
import { CheckCircle2, Circle, Target } from 'lucide-react';

interface TodaysFocusProps {
  dailyPlan: DailyTask[];
  onToggleTask: (id: string) => void;
}

const priorityColor: Record<string, string> = {
  high: 'text-rose-400',
  medium: 'text-amber-400',
  low: 'text-slate-400',
};

export const TodaysFocus: React.FC<TodaysFocusProps> = ({ dailyPlan, onToggleTask }) => {
  const topItems = dailyPlan.filter((t) => !t.completed).slice(0, 3);

  if (topItems.length === 0) {
    return (
      <div className="p-4 bg-slate-900/30 border border-white/5 rounded-xl text-center">
        <Target size={20} className="mx-auto text-slate-600 mb-2" />
        <p className="text-xs text-slate-500">
          No focus items today. Use the log bar to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topItems.map((task, idx) => (
        <button
          key={task.id}
          onClick={() => onToggleTask(task.id)}
          className="w-full flex items-start gap-3 p-3 bg-slate-900/40 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all text-left group"
        >
          <div className="mt-0.5 flex-shrink-0">
            {task.completed ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <Circle
                size={16}
                className="text-slate-600 group-hover:text-indigo-400 transition-colors"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-400 opacity-60">{idx + 1}</span>
              <h4
                className={`text-xs font-bold leading-snug truncate ${
                  task.completed ? 'line-through text-slate-600' : 'text-white'
                }`}
              >
                {task.title}
              </h4>
            </div>
            {task.why && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{task.why}</p>}
          </div>
          <span
            className={`text-[8px] font-black uppercase tracking-widest ${
              priorityColor[task.priority] || 'text-slate-400'
            }`}
          >
            {task.priority}
          </span>
        </button>
      ))}
    </div>
  );
};
