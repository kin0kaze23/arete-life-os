import React, { useState } from 'react';
import {
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  Edit3,
  Clock,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Category } from '@/data/types';
import { getCategoryColor } from '@/shared';

// Generic Type for Grid Items
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
      onEdit(editingId, editVal);
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050608]/50 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
      {/* Grid Toolbar */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-slate-950/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50"
            />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Select All
            </span>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                {selected.size} SELECTED
              </span>
              <button
                onClick={() => {
                  onDelete(Array.from(selected));
                  setSelected(new Set());
                }}
                className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded transition-colors"
                title="Bulk Delete"
              >
                <Trash2 size={14} />
              </button>
              {onVerify && (
                <button
                  onClick={() => {
                    onVerify(Array.from(selected));
                    setSelected(new Set());
                  }}
                  className="p-1 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-500 rounded transition-colors"
                  title="Bulk Verify"
                >
                  <CheckCircle2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Add Button */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md transition-colors group"
            >
              <span className="text-indigo-400 group-hover:text-indigo-300 text-[10px] font-bold tracking-wider">
                NEW ENTRY
              </span>
            </button>
          )}
          <div className="text-[10px] text-slate-600 font-mono">SHOWING {items.length} RECORDS</div>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-[40px_140px_100px_1fr_100px_60px] gap-4 px-4 py-2 border-b border-white/5 bg-slate-950/20 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
        <div></div>
        <div>Timestamp</div>
        <div>Type</div>
        <div>Content Description</div>
        <div>Category</div>
        <div className="text-right">Action</div>
      </div>

      {/* Grid Body */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className={`
                 grid grid-cols-[40px_140px_100px_1fr_100px_60px] gap-4 px-4 py-3 border-b border-white/[0.02] hover:bg-white/[0.02] group transition-colors items-center
                 ${selected.has(item.id) ? 'bg-indigo-500/[0.03]' : ''}
               `}
          >
            {/* Checkbox */}
            <div>
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Timestamp */}
            <div className="font-mono text-[10px] text-slate-500 flex items-center gap-2">
              <Clock size={10} className="opacity-50" />
              {new Date(item.timestamp)
                .toLocaleString(undefined, {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
                .replace(',', '')}
            </div>

            {/* Type Badge */}
            <div>
              <span
                className={`
                    text-[9px] font-bold px-1.5 py-0.5 rounded border
                    ${
                      item.type === 'CLAIM'
                        ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                        : item.type === 'MEMORY'
                          ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5'
                          : 'border-slate-700 text-slate-500'
                    }
                  `}
              >
                {item.type}
              </span>
            </div>

            {/* Content */}
            <div className="text-xs text-slate-300 truncate pr-4">
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    className="w-full bg-black border border-indigo-500/50 rounded px-2 py-1 text-white outline-none"
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                  />
                </div>
              ) : (
                <span className="opacity-90">{item.content}</span>
              )}
            </div>

            {/* Category */}
            <div>
              <span
                className={`text-[9px] uppercase tracking-wider font-bold ${getCategoryColor(item.category)}`}
              >
                {item.category}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editingId === item.id ? (
                <button
                  onClick={handleEditSave}
                  className="text-emerald-400 hover:text-emerald-300 p-1"
                >
                  <CheckCircle2 size={12} />
                </button>
              ) : (
                <button
                  onClick={() => handleEditStart(item)}
                  className="text-slate-500 hover:text-indigo-400 p-1"
                >
                  <Edit3 size={12} />
                </button>
              )}
              <button
                onClick={() => onDelete([item.id])}
                className="text-slate-500 hover:text-rose-400 p-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <Shield size={24} className="opacity-20" />
            <span className="text-xs font-mono">NO RECORDS FOUND IN SECTOR</span>
          </div>
        )}
      </div>
    </div>
  );
};
