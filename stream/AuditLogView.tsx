import React, { useState, useMemo } from 'react';
import { AuditLogEntry, ActionType } from '../data/types';
import {
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  UserCog,
  Activity,
  Terminal,
  Database,
  BrainCircuit,
  Fingerprint,
} from 'lucide-react';
import { ActionTooltip } from '../shared/SharedUI';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ActionType | 'ALL'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        (log.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'ALL' || log.actionType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [logs, searchQuery, selectedType]);

  const getActionConfig = (type: ActionType) => {
    switch (type) {
      case ActionType.DIGEST:
        return {
          icon: <BrainCircuit size={16} />,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        };
      case ActionType.APPROVE:
        return {
          icon: <CheckCircle size={16} />,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      case ActionType.REJECT:
        return {
          icon: <XCircle size={16} />,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        };
      case ActionType.TASK_CREATE:
        return {
          icon: <Plus size={16} />,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        };
      case ActionType.CLAIM_ADD:
        return {
          icon: <Database size={16} />,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        };
      case ActionType.PROFILE_UPDATE:
        return {
          icon: <UserCog size={16} />,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        };
      default:
        return {
          icon: <Terminal size={16} />,
          color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 pt-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-500" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              System Trace
            </span>
          </div>
          <h3 className="text-4xl font-black tracking-tighter text-white">Audit Log</h3>
          <p className="text-slate-400 font-medium max-w-xl">
            Immutable record of all system actions, mutations, and neural ingestions.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent pl-9 pr-4 py-2 text-xs font-bold text-white outline-none w-48 placeholder-slate-600"
            />
          </div>
          <div className="w-px h-6 bg-slate-800"></div>
          <div className="relative px-2">
            <Filter
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-transparent pl-8 pr-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer appearance-none"
            >
              <option value="ALL">All Types</option>
              {Object.values(ActionType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6 space-y-4">
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-800" />

        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const config = getActionConfig(log.actionType);
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="relative animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {/* Node Dot */}
                <div
                  className={`absolute -left-[27px] top-5 w-3 h-3 rounded-full border-2 border-slate-950 z-10 ${config.color.split(' ')[0].replace('text-', 'bg-')}`}
                />

                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className={`bg-slate-900/40 border rounded-2xl p-4 transition-all cursor-pointer group ${isExpanded ? 'border-indigo-500/40 bg-slate-900/60' : 'border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2 rounded-xl ${config.color}`}>{config.icon}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <span
                            className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${config.color}`}
                          >
                            {log.actionType}
                          </span>
                        </div>
                        <p
                          className={`text-sm font-bold truncate ${isExpanded ? 'text-white' : 'text-slate-300'}`}
                        >
                          {log.summary}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`}
                    >
                      <ChevronRight size={18} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4 animate-in fade-in slide-in-from-top-1">
                      {log.details && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <FileText size={10} /> Detail Payload
                          </span>
                          <p className="text-xs font-mono text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/50 leading-relaxed whitespace-pre-wrap">
                            {log.details}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                          <Fingerprint size={12} />
                          <span className="font-mono">ID: {log.id}</span>
                        </div>
                        {log.sourceId && (
                          <div className="flex items-center gap-2 text-indigo-400/50">
                            <span>REF: {log.sourceId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl ml-4">
            <div className="inline-flex p-4 rounded-full bg-slate-900 text-slate-600 mb-4">
              <Clock size={24} />
            </div>
            <h4 className="text-slate-400 font-bold mb-1">No Trace Found</h4>
            <p className="text-slate-600 text-xs">System logs are empty for this criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
