import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  LayoutDashboard,
  Database,
  Activity,
  BrainCircuit,
  Zap,
  Download,
  Trash2,
  X,
  ChevronRight,
  Settings,
  UserCircle,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
  onSync: () => void;
  onExport: () => void;
  onReset: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSync,
  onExport,
  onReset,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    {
      id: 'dash',
      label: 'Go to Command Center',
      icon: <LayoutDashboard size={16} />,
      action: () => onNavigate('dashboard'),
      category: 'Navigation',
    },
    {
      id: 'vault',
      label: 'Manage Identity Vault',
      icon: <Database size={16} />,
      action: () => onNavigate('vault'),
      category: 'Navigation',
    },
    {
      id: 'stream',
      label: 'View Life Stream',
      icon: <Activity size={16} />,
      action: () => onNavigate('stream'),
      category: 'Navigation',
    },
    {
      id: 'oracle',
      label: 'Ask Neural Oracle',
      icon: <BrainCircuit size={16} />,
      action: () => onNavigate('chat'),
      category: 'Navigation',
    },
    {
      id: 'sync',
      label: 'Sync Neural Context',
      icon: <Zap size={16} className="text-amber-500" />,
      action: onSync,
      category: 'System',
    },
    {
      id: 'export',
      label: 'Export OS Backup',
      icon: <Download size={16} className="text-emerald-500" />,
      action: onExport,
      category: 'System',
    },
    {
      id: 'reset',
      label: 'Purge Local Kernel',
      icon: <Trash2 size={16} className="text-rose-500" />,
      action: onReset,
      category: 'Danger',
    },
  ];

  const filtered = commands.filter(
    (c) =>
      (c.label || '').toLowerCase().includes(query.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0D1117] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-5 border-b border-white/5 bg-slate-900/40">
          <Search className="text-slate-500 mr-4" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands or modules..."
            className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder-slate-600"
          />
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500">
            ESC to Close
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-4 space-y-6 no-scrollbar">
          {filtered.length > 0 ? (
            ['Navigation', 'System', 'Danger'].map((category) => {
              const catCommands = filtered.filter((c) => c.category === category);
              if (catCommands.length === 0) return null;

              return (
                <div key={category} className="space-y-2">
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {catCommands.map((cmd) => {
                      const globalIdx = filtered.findIndex((f) => f.id === cmd.id);
                      const isSelected = globalIdx === selectedIndex;

                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left group ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]'
                              : 'bg-transparent text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-white/20' : 'bg-slate-900 text-slate-500'}`}
                            >
                              {cmd.icon}
                            </div>
                            <span className="text-sm font-bold">{cmd.label}</span>
                          </div>
                          {isSelected && (
                            <ChevronRight size={18} className="animate-in slide-in-from-left-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-500 font-medium">No results found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#08090C] border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-900 border border-white/10 flex items-center justify-center">
                ↓
              </div>{' '}
              Move
            </span>
            <span className="flex items-center gap-2">
              <div className="w-6 h-4 rounded bg-slate-900 border border-white/10 flex items-center justify-center font-mono">
                ENT
              </div>{' '}
              Execute
            </span>
          </div>
          <span>Areté Neural Kernel v3.1</span>
        </div>
      </div>
    </div>
  );
};
