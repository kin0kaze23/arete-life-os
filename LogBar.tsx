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
import { useOnlineStatus, ActionTooltip } from './SharedUI';

interface LogBarProps {
  userInput: string;
  setUserInput: (val: string) => void;
  isProcessing: boolean;
  onLog: (e: React.FormEvent, files?: File[]) => void;
  onExport: () => void;
  onReset: () => void;
}

export const LogBar: React.FC<LogBarProps> = ({
  userInput,
  setUserInput,
  isProcessing,
  onLog,
  onExport,
  onReset,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ file: File; status: 'ready' | 'uploading' | 'error'; error?: string }>
  >([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingClear, setPendingClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() && selectedFiles.length === 0) return;
    const files = selectedFiles.filter((f) => f.status === 'ready').map((f) => f.file);
    onLog(e, files.length > 0 ? files : undefined);
    setSelectedFiles((prev) =>
      prev.map((file) => (file.status === 'ready' ? { ...file, status: 'uploading' } : file))
    );
    setPendingClear(true);
    setShowMenu(false);
  };

  useEffect(() => {
    if (!isProcessing && pendingClear) {
      setSelectedFiles([]);
      setPendingClear(false);
    }
  }, [isProcessing, pendingClear]);

  return (
    <div className="p-6 bg-[#050505]/90 backdrop-blur-2xl border-t border-slate-800/50 relative z-50">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-4 relative">
        <div className="flex flex-wrap gap-2">
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
          className={`flex items-center gap-4 relative rounded-2xl ${
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
            <div className="absolute inset-0 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-500/10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-indigo-300 pointer-events-none">
              Drop files to attach
            </div>
          )}
          <div className="relative">
            <ActionTooltip label="System Commands" side="top">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${showMenu ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-indigo-400 border border-slate-800'}`}
              >
                <Command size={20} />
              </button>
            </ActionTooltip>

            {showMenu && (
              <div className="absolute bottom-full left-0 mb-4 w-72 bg-[#0D1117] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-[100]">
                <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Universal Hub
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserInput('/ask ');
                      setShowMenu(false);
                    }}
                    className="w-full text-left p-3 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-3"
                  >
                    <Search size={14} className="text-indigo-400" /> /ask{' '}
                    <span className="text-slate-600 font-medium">Neural Oracle query</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserInput('/sync');
                      setShowMenu(false);
                    }}
                    className="w-full text-left p-3 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-3"
                  >
                    <Zap size={14} className="text-indigo-400" /> /sync{' '}
                    <span className="text-slate-600 font-medium">Refresh tasks & goals</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExport}
                    className="w-full text-left p-3 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-3"
                  >
                    <FileText size={14} className="text-emerald-400" /> /export{' '}
                    <span className="text-slate-600 font-medium">System backup</span>
                  </button>
                  <div className="h-px bg-slate-800 my-1 mx-2" />
                  <button
                    type="button"
                    onClick={onReset}
                    className="w-full text-left p-3 hover:bg-rose-500/10 rounded-xl text-xs font-bold text-rose-500 flex items-center gap-3"
                  >
                    <X size={14} /> /reset{' '}
                    <span className="text-rose-900/50 font-medium">Purge local kernel</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <div
              className={`absolute left-6 top-1/2 -translate-y-1/2 transition-opacity pointer-events-none ${isProcessing ? 'text-indigo-400' : 'text-slate-600'}`}
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : userInput.startsWith('/') ? (
                <Command size={20} />
              ) : (
                <Sparkles size={20} />
              )}
            </div>

            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                isProcessing
                  ? 'Internalizing Signal...'
                  : 'Log memory, update profile, or use /ask...'
              }
              className="w-full bg-[#0D0F14] border border-slate-800 rounded-2xl pl-16 pr-32 py-4 focus:outline-none focus:border-indigo-500 transition-all text-sm text-slate-200 placeholder-slate-600 shadow-inner disabled:opacity-50"
              disabled={isProcessing || !isOnline}
            />

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
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
                className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center min-w-[42px]"
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
