import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  Paperclip,
  X,
  FileText,
  Send,
  Command,
  Cpu,
  Zap,
  Search,
} from 'lucide-react';
import { useOnlineStatus, ActionTooltip } from '@/shared';
import { MemoryEntry } from '@/data';

interface LogBarProps {
  userInput: string;
  setUserInput: (val: string) => void;
  isProcessing: boolean;
  logError?: string | null;
  onLog: (e: React.FormEvent, files?: File[]) => void;
  onExport: () => void;
  onReset: () => void;
  memory?: MemoryEntry[];
}

const EVENING_AUDIT_TEMPLATE = `🌙 EVENING AUDIT
────────────────────────
ENERGY LEVEL: [1-10]
HIGHS: [The big win]
LOWS: [The challenge]
LEARNING: [Insight]
INTENT FOR TOMORROW: [Focus]`;

const SCHEDULE_EVENT_TEMPLATE = `📅 SCHEDULE EVENT
────────────────────────
TITLE: [Event Name]
LOCATION: [Where]
DATE: [YYYY-MM-DD]
TIME: [HH:MM]`;

export const LogBar: React.FC<LogBarProps> = ({
  userInput,
  setUserInput,
  isProcessing,
  logError,
  onLog,
  onExport,
  onReset,
  memory = [],
}) => {
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ file: File; status: 'ready' | 'uploading' | 'error'; error?: string }>
  >([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingClear, setPendingClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [now, setNow] = useState(() => new Date());
  const isOnline = useOnlineStatus();

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  }, [userInput]);

  // Check if evening audit was already logged today
  const hasAuditToday = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return memory.some((m) => {
      const entryDate = new Date(m.timestamp).toISOString().split('T')[0];
      const isToday = entryDate === today;
      const isAudit = m.content?.includes('EVENING AUDIT') || m.content?.includes('🌙');
      return isToday && isAudit;
    });
  }, [memory]);

  const isNightHours = now.getHours() >= 20 || now.getHours() < 5;
  const showEveningAudit = isNightHours && !hasAuditToday;

  const addFiles = (files: FileList) => {
    const next = Array.from(files).map((file) => {
      if (file.size > MAX_FILE_SIZE) {
        return {
          file,
          status: 'error' as const,
          error: 'File too large (max 10MB).',
        };
      }
      return { file, status: 'ready' as const };
    });
    setSelectedFiles((prev) => [...prev, ...next]);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() && selectedFiles.length === 0) return;
    const files = selectedFiles.filter((f) => f.status === 'ready').map((f) => f.file);
    onLog(e || ({} as any), files.length > 0 ? files : undefined);
    setSelectedFiles((prev) =>
      prev.map((file) => (file.status === 'ready' ? { ...file, status: 'uploading' } : file))
    );
    setPendingClear(true);
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (!isProcessing && pendingClear) {
      if (logError) {
        setSelectedFiles((prev) =>
          prev.map((file) =>
            file.status === 'uploading' ? { ...file, status: 'error', error: logError } : file
          )
        );
      } else {
        setSelectedFiles([]);
      }
      setPendingClear(false);
    }
  }, [isProcessing, pendingClear, logError]);

  return (
    <div className="p-6 bg-[#050505]/90 backdrop-blur-2xl border-t border-slate-800/50 relative z-50">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-4 relative">
        <div className="flex flex-wrap gap-2">
          {selectedFiles.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-2 animate-in fade-in slide-in-from-bottom-1 duration-500">
              {showEveningAudit && (
                <button
                  type="button"
                  onClick={() => {
                    setUserInput(EVENING_AUDIT_TEMPLATE);
                    textareaRef.current?.focus();
                  }}
                  className={`
                    px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 group
                    ${
                      now.getHours() >= 20 || now.getHours() < 5
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-pulse'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
                    }
                  `}
                >
                  <Cpu
                    size={10}
                    className={now.getHours() >= 20 ? 'text-indigo-400' : 'text-slate-600'}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Evening Audit
                  </span>
                </button>
              )}

              {!userInput && (
                <button
                  type="button"
                  onClick={() => {
                    setUserInput(SCHEDULE_EVENT_TEMPLATE);
                    textareaRef.current?.focus();
                  }}
                  className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 text-[10px] font-bold text-slate-400 hover:text-indigo-300 transition-all flex items-center gap-2 group"
                >
                  <Sparkles size={10} className="text-slate-600 group-hover:text-indigo-400" />
                  Schedule Event
                </button>
              )}
            </div>
          )}
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2 animate-in zoom-in duration-300"
            >
              <FileText size={12} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-100 truncate max-w-[120px]">
                {file.file.name}
              </span>
              {file.status === 'uploading' && (
                <span className="text-[9px] text-indigo-300">Uploading…</span>
              )}
              {file.status === 'error' && (
                <span className="text-[9px] text-rose-400">{file.error}</span>
              )}
              <button
                type="button"
                onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                className="p-1 hover:text-rose-400"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        <div
          className={`flex items-end gap-3 relative rounded-2xl ${
            isDragging ? 'ring-2 ring-indigo-500/60 bg-indigo-500/5' : ''
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
          }}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-500/10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-indigo-300 pointer-events-none z-10">
              Drop files to attach
            </div>
          )}
          <div className="pb-1">
            <ActionTooltip label="System Commands" side="top">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  showMenu
                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                    : 'bg-slate-900 text-slate-500 hover:text-indigo-400 border border-slate-800'
                }`}
              >
                <Command size={20} />
              </button>
            </ActionTooltip>

            {showMenu && (
              <div className="absolute bottom-full left-0 mb-4 w-72 bg-[#0D1117] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-[100]">
                <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
                  <Cpu size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Universal Hub
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    {
                      cmd: '/ask',
                      icon: Search,
                      color: 'text-indigo-400',
                      desc: 'Neural Oracle query',
                    },
                    {
                      cmd: '/sync',
                      icon: Zap,
                      color: 'text-indigo-400',
                      desc: 'Refresh tasks & goals',
                    },
                    {
                      cmd: '/export',
                      icon: FileText,
                      color: 'text-emerald-400',
                      desc: 'System backup',
                    },
                    {
                      cmd: '/reset',
                      icon: X,
                      color: 'text-rose-500',
                      desc: 'Purge local kernel',
                      danger: true,
                    },
                  ].map((item, i) => (
                    <button
                      key={item.cmd}
                      type="button"
                      onClick={() => {
                        if (item.cmd === '/export') onExport();
                        else if (item.cmd === '/reset') onReset();
                        else setUserInput(item.cmd + ' ');
                        setShowMenu(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-colors ${
                        item.danger
                          ? 'text-rose-500 hover:bg-rose-500/10'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <item.icon size={14} className={item.color} /> {item.cmd}{' '}
                      <span className="text-slate-600 font-medium">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 relative group">
            <div
              className={`absolute left-6 bottom-4 transition-all duration-300 pointer-events-none ${
                isProcessing ? 'text-indigo-400' : 'text-slate-600'
              }`}
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : userInput.startsWith('/') ? (
                <Command size={20} />
              ) : (
                <Sparkles size={20} />
              )}
            </div>

            <textarea
              ref={textareaRef}
              data-testid="log-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                isProcessing
                  ? 'Internalizing Signal...'
                  : 'Log memory, update profile, or use /ask...'
              }
              className="w-full bg-[#0D0F14] border border-slate-800 rounded-2xl pl-16 pr-32 py-4 focus:outline-none focus:border-indigo-500 transition-all text-sm text-slate-200 placeholder-slate-600 shadow-inner disabled:opacity-50 resize-none overflow-hidden min-h-[56px] leading-relaxed block"
              disabled={isProcessing || !isOnline}
            />

            <div className="absolute right-4 bottom-2.5 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && addFiles(e.target.files)}
                className="hidden"
                multiple
              />

              <ActionTooltip label="Evidence">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-indigo-400 transition-all"
                >
                  <Paperclip size={20} />
                </button>
              </ActionTooltip>

              <button
                type="submit"
                disabled={isProcessing || (!userInput.trim() && selectedFiles.length === 0)}
                className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center min-w-[42px] min-h-[42px]"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
