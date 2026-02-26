import React, { useState } from 'react';
import { Trash2, CheckCircle2, Edit3, Clock, Shield } from 'lucide-react';
import { Category } from '@/data/types';
import { getCategoryColor } from '@/shared';

export interface GridItem {
  id: string;
  timestamp: number;
  category: Category;
  content: string;
  type: 'MEMORY' | 'CLAIM' | 'TRANSACTION';
  confidence?: number;
  status?: string;
}

interface NeuralDataGridProps {
  items: GridItem[];
  onDelete: (ids: string[]) => void;
  onEdit: (id: string, newVal: string) => void;
  onVerify?: (ids: string[]) => void;
  onAdd?: () => void;
}

export const NeuralDataGrid: React.FC<NeuralDataGridProps> = ({
  items,
  onDelete,
  onEdit,
  onVerify,
  onAdd,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const handleEditStart = (item: GridItem) => {
    setEditingId(item.id);
    setEditVal(item.content);
  };

  const handleEditSave = () => {
    if (editingId && editVal.trim()) {
      onEdit(editingId, editVal.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1323] px-4 py-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/50"
            />
            <span>Select all</span>
          </label>
          {selected.size > 0 && (
            <span className="rounded-md border border-blue-300/25 bg-blue-500/12 px-2 py-0.5 text-[11px] text-blue-100">
              {selected.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <button
                onClick={() => {
                  onDelete(Array.from(selected));
                  setSelected(new Set());
                }}
                className="rounded-lg border border-rose-300/25 bg-rose-500/12 p-2 text-rose-200 transition hover:bg-rose-500/20"
                title="Delete selected"
              >
                <Trash2 size={14} />
              </button>
              {onVerify && (
                <button
                  onClick={() => {
                    onVerify(Array.from(selected));
                    setSelected(new Set());
                  }}
                  className="rounded-lg border border-emerald-300/25 bg-emerald-500/12 p-2 text-emerald-200 transition hover:bg-emerald-500/20"
                  title="Verify selected"
                >
                  <CheckCircle2 size={14} />
                </button>
              )}
            </>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="rounded-lg border border-blue-300/30 bg-blue-500/14 px-3 py-1.5 text-[11px] font-semibold text-blue-100 transition hover:bg-blue-500/22"
            >
              New Entry
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[36px_130px_96px_1fr_140px_96px] gap-3 border-b border-white/10 bg-[#0b1323]/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <span />
        <span>Timestamp</span>
        <span>Type</span>
        <span>Content</span>
        <span>Category</span>
        <span className="text-right">Action</span>
      </div>

      <div className="premium-scrollbar flex-1 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={`grid grid-cols-[36px_130px_96px_1fr_140px_96px] items-center gap-3 border-b border-white/[0.06] px-4 py-3 transition hover:bg-white/[0.03] ${selected.has(item.id) ? 'bg-blue-500/[0.08]' : ''}`}
          >
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggleSelect(item.id)}
              className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
            />

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock size={12} className="text-slate-500" />
              {new Date(item.timestamp).toLocaleString(undefined, {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </div>

            <span
              className={`w-fit rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                item.type === 'CLAIM'
                  ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-200'
                  : item.type === 'MEMORY'
                    ? 'border-blue-300/30 bg-blue-500/12 text-blue-100'
                    : 'border-white/15 bg-white/[0.02] text-slate-300'
              }`}
            >
              {item.type}
            </span>

            <div className="min-w-0 text-sm text-slate-200">
              {editingId === item.id ? (
                <input
                  type="text"
                  autoFocus
                  className="w-full rounded-lg border border-blue-300/35 bg-black/30 px-2 py-1 text-sm text-slate-100 outline-none"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                />
              ) : (
                <span className="block truncate">{item.content}</span>
              )}
            </div>

            <span className={`text-[11px] font-semibold uppercase ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>

            <div className="flex items-center justify-end gap-1">
              {editingId === item.id ? (
                <button
                  onClick={handleEditSave}
                  className="rounded-md p-1.5 text-emerald-300 transition hover:bg-emerald-500/15"
                  title="Save"
                >
                  <CheckCircle2 size={13} />
                </button>
              ) : (
                <button
                  onClick={() => handleEditStart(item)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
                  title="Edit"
                >
                  <Edit3 size={13} />
                </button>
              )}
              <button
                onClick={() => onDelete([item.id])}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-200"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-slate-500">
            <Shield size={24} className="opacity-30" />
            <span className="text-xs">No records found</span>
          </div>
        )}
      </div>
    </div>
  );
};
