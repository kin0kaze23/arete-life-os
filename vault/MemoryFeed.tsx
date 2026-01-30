import React, { useMemo, useState } from 'react';
import { MemoryItem, Category, Source } from '@/data/types';
import { Clock, Tag, FileText, ChevronRight } from 'lucide-react';
import { getCategoryColor } from '@/shared'; // Assuming shared export, if not we'll inline or fix imports.

interface MemoryFeedProps {
  memoryItems: MemoryItem[];
  sources?: Source[];
}

export const MemoryFeed: React.FC<MemoryFeedProps> = ({ memoryItems, sources }) => {
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(() => {
    return memoryItems
      .filter((item) => item.content.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [memoryItems, filter]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Filter raw stream..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-indigo-500/50 transition-all sticky top-0 backdrop-blur-md z-10"
      />

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:bg-slate-900/50 transition-colors flex gap-4 group"
          >
            <div className="flex flex-col items-center gap-2 pt-1">
              <div
                className={`w-2 h-2 rounded-full ${getCategoryColor(item.category).split(' ')[0]}`}
              />
              <div className="w-px h-full bg-white/5 group-hover:bg-white/10" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(item.category)}`}
                >
                  {item.category}
                </span>
                <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                  {new Date(item.timestamp).toLocaleDateString()} <Clock size={10} />
                </span>
              </div>

              <p className="text-sm font-medium text-slate-300 leading-relaxed">{item.content}</p>

              {item.extractedFacts.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.extractedFacts.map((fact, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/10"
                    >
                      + Claim: {fact.fact.substring(0, 30)}...
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="py-20 text-center text-slate-600 text-xs">
            No signals detected in stream.
          </div>
        )}
      </div>
    </div>
  );
};
