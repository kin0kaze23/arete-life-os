import React, { useState } from 'react';
import { MemoryEntry } from '../types';

type HabitItem = {
  id: string;
  title: string;
  frequency?: string;
};

interface AlwaysPanelsProps {
  alwaysDoChips: string[];
  alwaysWatchChips: string[];
  habitItems: HabitItem[];
  onNavigate: (tab: any) => void;
  updateMemoryItem?: (id: string, updates: Partial<MemoryEntry>) => void;
  deleteMemoryItem?: (id: string) => void;
}

export const AlwaysPanels: React.FC<AlwaysPanelsProps> = ({
  alwaysDoChips,
  alwaysWatchChips,
  habitItems,
  onNavigate,
  updateMemoryItem,
  deleteMemoryItem,
}) => {
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [habitDraft, setHabitDraft] = useState<{ title: string; frequency: string }>({
    title: '',
    frequency: 'daily',
  });

  const startHabitEdit = (habit: HabitItem) => {
    setEditingHabitId(habit.id);
    setHabitDraft({
      title: habit.title || '',
      frequency: habit.frequency || 'daily',
    });
  };

  const saveHabitEdit = () => {
    if (!editingHabitId || !updateMemoryItem) return;
    const title = habitDraft.title.trim();
    if (!title) return;
    updateMemoryItem(editingHabitId, {
      content: title,
      metadata: {
        type: 'habit',
        payload: {
          title,
          frequency: habitDraft.frequency,
        },
      },
    });
    setEditingHabitId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40">
        <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
          Always-Do
        </h5>
        <div className="mt-4 flex flex-wrap gap-2">
          {alwaysDoChips.length > 0 ? (
            alwaysDoChips.map((chip) => (
              <span
                key={chip}
                className="px-3 py-2 rounded-full bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5"
              >
                {chip}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-500">No routines captured yet.</span>
          )}
        </div>
        <div className="mt-5 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Habits</p>
          {habitItems.length > 0 ? (
            <div className="flex flex-col gap-3">
              {habitItems.map((habit) => {
                const isEditing = editingHabitId === habit.id;
                return (
                  <div
                    key={habit.id}
                    className="flex flex-col gap-2 rounded-2xl border border-violet-500/10 bg-violet-500/5 px-3 py-2"
                  >
                    {isEditing ? (
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <input
                          value={habitDraft.title}
                          onChange={(e) =>
                            setHabitDraft((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-slate-200"
                          placeholder="Habit name"
                        />
                        <select
                          value={habitDraft.frequency}
                          onChange={(e) =>
                            setHabitDraft((prev) => ({ ...prev, frequency: e.target.value }))
                          }
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-slate-200"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={saveHabitEdit}
                            className="px-3 py-2 rounded-xl bg-violet-500/20 text-[9px] font-black uppercase tracking-widest text-violet-200 hover:bg-violet-500/30"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingHabitId(null)}
                            className="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-200">
                          {habit.title}
                          {habit.frequency ? ` · ${habit.frequency}` : ''}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startHabitEdit(habit)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-violet-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMemoryItem?.(habit.id)}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500">
              <span>No habits captured yet.</span>
              <button
                onClick={() => onNavigate('vault')}
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-violet-300 transition-all"
              >
                Add Habit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40">
        <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">
          Always-Watch
        </h5>
        <div className="mt-4 flex flex-wrap gap-2">
          {alwaysWatchChips.length > 0 ? (
            alwaysWatchChips.map((chip) => (
              <span
                key={chip}
                className="px-3 py-2 rounded-full bg-rose-500/5 text-[9px] font-black uppercase tracking-widest text-rose-300 border border-rose-500/10"
              >
                {chip}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-500">No guardrails set yet.</span>
          )}
        </div>
      </div>
    </div>
  );
};
