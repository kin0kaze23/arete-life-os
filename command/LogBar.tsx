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
  ClipboardCheck,
  DollarSign,
  Dumbbell,
  Heart,
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

const DAILY_CHECKIN_TEMPLATE = `DAILY CHECK-IN
────────────────────────
ENERGY: [1-10]
MOOD: [1-10]
SLEEP: [hours]
HIGHLIGHT: [What went well]
STRUGGLE: [What was hard]
FOCUS: [Top priority]`;

const EXPENSE_LOG_TEMPLATE = `EXPENSE LOG
────────────────────────
AMOUNT: [Currency + amount]
CATEGORY: [Food, Travel, Bills, etc.]
MERCHANT: [Where]
REASON: [Why this mattered]`;

const WORKOUT_LOG_TEMPLATE = `WORKOUT LOG
────────────────────────
TYPE: [Run, Strength, Yoga, etc.]
DURATION: [Minutes]
INTENSITY: [Low/Med/High]
NOTES: [How it felt]`;

const RELATIONSHIP_TOUCHPOINT_TEMPLATE = `RELATIONSHIP TOUCHPOINT
────────────────────────
PERSON: [Who]
CONTEXT: [What happened]
FEELING: [Emotion]
NEXT STEP: [Follow-up]`;

const WORK_PROGRESS_TEMPLATE = `WORK PROGRESS
────────────────────────
MOVED: [What advanced]
BLOCKERS: [What slowed you]
NEXT: [Immediate next step]`;

const HEALTH_SYMPTOM_TEMPLATE = `HEALTH SYMPTOM
────────────────────────
SYMPTOM: [What you felt]
TIME: [When it started]
SEVERITY: [1-10]
NOTES: [Anything else]`;

const UPLOAD_SUMMARY_TEMPLATE = `UPLOAD SUMMARY
────────────────────────
FILES: [What you uploaded]
SUMMARY: [Key takeaways]
NEXT ACTION: [What to do next]`;

const TEMPLATE_MAP: Record<string, string> = {
  DAILY_CHECKIN: DAILY_CHECKIN_TEMPLATE,
  EXPENSE_LOG: EXPENSE_LOG_TEMPLATE,
  WORKOUT_LOG: WORKOUT_LOG_TEMPLATE,
  RELATIONSHIP_TOUCHPOINT: RELATIONSHIP_TOUCHPOINT_TEMPLATE,
  WORK_PROGRESS: WORK_PROGRESS_TEMPLATE,
  HEALTH_SYMPTOM: HEALTH_SYMPTOM_TEMPLATE,
  UPLOAD_SUMMARY: UPLOAD_SUMMARY_TEMPLATE,
  SCHEDULE_EVENT: SCHEDULE_EVENT_TEMPLATE,
  EVENING_AUDIT: EVENING_AUDIT_TEMPLATE,
};

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

  const insertTemplate = (template: string) => {
    setUserInput(template);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const templateKey = detail.template;
      if (typeof templateKey === 'string' && TEMPLATE_MAP[templateKey]) {
        insertTemplate(TEMPLATE_MAP[templateKey]);
      }
    };
    window.addEventListener('logbar:insert', handler as EventListener);
    return () => window.removeEventListener('logbar:insert', handler as EventListener);
  }, []);

  const templateOptions = [
    {
      id: 'DAILY_CHECKIN',
      label: 'Daily Check-In',
      icon: ClipboardCheck,
      className: 'text-indigo-300',
    },
    {
      id: 'SCHEDULE_EVENT',
      label: 'Schedule Event',
      icon: Sparkles,
      className: 'text-slate-300',
    },
    {
      id: 'EXPENSE_LOG',
      label: 'Expense Log',
      icon: DollarSign,
      className: 'text-emerald-300',
    },
    {
      id: 'WORKOUT_LOG',
      label: 'Workout',
      icon: Dumbbell,
      className: 'text-cyan-300',
    },
    {
      id: 'RELATIONSHIP_TOUCHPOINT',
      label: 'Relationship',
      icon: Heart,
      className: 'text-rose-300',
    },
  ];

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
                  onClick={() => insertTemplate(EVENING_AUDIT_TEMPLATE)}
                  className={`
                    px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 group
                    ${
                      now.getHours() >= 20 || now.getHours() < 5
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
                    }
                  `}
                >
                  <Cpu
                    size={10}
                    className={now.getHours() >= 20 ? 'text-indigo-400' : 'text-slate-600'}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    Evening Audit
                  </span>
                </button>
              )}

              {templateOptions.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => insertTemplate(TEMPLATE_MAP[template.id])}
                  className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 text-[11px] font-bold text-slate-400 hover:text-indigo-200 transition-all flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                >
                  <template.icon size={12} className={template.className} />
                  {template.label}
                </button>
              ))}
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
                <span className="text-[11px] text-indigo-300">Uploading…</span>
              )}
              {file.status === 'error' && (
                <span className="text-[11px] text-rose-400">{file.error}</span>
              )}
              <button
                type="button"
                onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                className="p-2 min-w-[36px] min-h-[36px] hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 rounded-lg"
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
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40`}
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
                  ? 'Saving...'
                  : 'Log your day, schedule an event, or attach a file...'
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
                  className="p-2 min-w-[42px] min-h-[42px] text-slate-500 hover:text-indigo-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-lg"
                >
                  <Paperclip size={20} />
                </button>
              </ActionTooltip>

              <button
                type="submit"
                disabled={isProcessing || (!userInput.trim() && selectedFiles.length === 0)}
                className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
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
