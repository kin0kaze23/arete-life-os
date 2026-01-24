import React, { useState, useMemo, useRef } from 'react';
import { Claim, Category, Source, ClaimStatus, MemoryItem } from './types';
import {
  Database,
  Search,
  Filter,
  ShieldCheck,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  User,
  Activity,
  Wallet,
  Compass,
  Globe,
  Briefcase,
  ChevronRight,
  X,
  Edit3,
  Save,
} from 'lucide-react';
import { BentoCard, getCategoryColor, Skeleton } from './SharedUI';

interface MemoryVaultViewProps {
  claims: Claim[];
  sources: Source[];
  memoryItems: MemoryItem[];
  onApprove: (ids: string[]) => void;
  onReject: (ids: string[]) => void;
  onResolve: (id: string, resolution: 'OVERWRITE' | 'KEEP_EXISTING') => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, fact: string) => void;
}

export const MemoryVaultView: React.FC<MemoryVaultViewProps> = ({
  claims,
  sources,
  memoryItems,
  onApprove,
  onReject,
  onResolve,
  onDelete,
  onUpdate,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'ALL'>('ALL');

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchesSearch = c.fact.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || c.category === activeCategory;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [claims, search, activeCategory, statusFilter]);

  const stats = useMemo(
    () => ({
      total: claims.length,
      proposed: claims.filter((c) => c.status === ClaimStatus.PROPOSED).length,
      conflicts: claims.filter((c) => c.status === ClaimStatus.CONFLICT).length,
      committed: claims.filter((c) => c.status === ClaimStatus.COMMITTED).length,
    }),
    [claims]
  );

  const getIcon = (cat: Category) => {
    switch (cat) {
      case Category.HEALTH:
        return <Activity size={18} />;
      case Category.FINANCE:
        return <Wallet size={18} />;
      case Category.RELATIONSHIPS:
        return <Compass size={18} />;
      case Category.SPIRITUAL:
        return <Globe size={18} />;
      case Category.WORK:
        return <Briefcase size={18} />;
      default:
        return <Database size={18} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/20 w-fit">
            <ShieldCheck size={14} /> Knowledge Graph Sovereignty
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Knowledge Graph</h2>
          <p className="text-slate-500 font-medium max-w-xl">
            Atomic truths extracted from your life stream. Every claim is verifiable and can be
            manually edited or purged to maintain record integrity.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Total Claims" value={stats.total} />
          <StatBox label="Proposed" value={stats.proposed} color="text-indigo-400" />
          <StatBox label="Conflicts" value={stats.conflicts} color="text-rose-400" />
          <StatBox label="Committed" value={stats.committed} color="text-emerald-400" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-4 rounded-[2rem] border border-white/5 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search knowledge graph..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-6 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['ALL', ...Object.values(Category)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-slate-800 hidden md:block" />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer appearance-none min-w-[140px]"
        >
          <option value="ALL">All Status</option>
          {Object.values(ClaimStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => {
            const memoryItem = memoryItems.find((m) => m.id === claim.sourceId);
            const source = memoryItem?.sourceId
              ? sources.find((s) => s.id.startsWith(memoryItem.sourceId!))
              : null;

            return (
              <ClaimCard
                key={claim.id}
                claim={claim}
                source={source}
                onApprove={() => onApprove([claim.id])}
                onReject={() => onReject([claim.id])}
                onResolve={onResolve}
                onDelete={() => onDelete?.(claim.id)}
                onUpdate={(val) => onUpdate?.(claim.id, val)}
                getIcon={getIcon}
              />
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem] opacity-40">
            <History size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-[0.2em]">
              No atomic claims detected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; color?: string }> = ({
  label,
  value,
  color = 'text-white',
}) => (
  <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px] text-center">
    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">
      {label}
    </span>
    <span className={`text-xl font-black ${color}`}>{value}</span>
  </div>
);

const ClaimCard: React.FC<{
  claim: Claim;
  source: Source | null;
  onApprove: () => void;
  onReject: () => void;
  onResolve: (id: string, res: 'OVERWRITE' | 'KEEP_EXISTING') => void;
  onDelete?: () => void;
  onUpdate?: (fact: string) => void;
  getIcon: (cat: Category) => React.ReactNode;
}> = ({ claim, source, onApprove, onReject, onResolve, onDelete, onUpdate, getIcon }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(claim.fact);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    if (editVal.trim() && onUpdate) {
      onUpdate(editVal.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative p-6 rounded-[2.5rem] border transition-all duration-300 ${
        claim.status === ClaimStatus.CONFLICT
          ? 'bg-rose-500/5 border-rose-500/20'
          : claim.status === ClaimStatus.PROPOSED
            ? 'bg-indigo-500/5 border-indigo-500/20'
            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow-lg'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${getCategoryColor(claim.category)}`}>
            {getIcon(claim.category)}
          </div>
          <div className="flex flex-col">
            <span
              className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border inline-block w-fit mb-1 ${getCategoryColor(claim.category)}`}
            >
              {claim.category}
            </span>
            <div className="flex items-center gap-1">
              <User size={10} className="text-slate-600" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                Self
              </span>
            </div>
          </div>
        </div>

        <div
          className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${
            claim.confidence > 80
              ? 'text-emerald-400 border-emerald-500/20'
              : claim.confidence > 50
                ? 'text-amber-400 border-amber-500/20'
                : 'text-rose-400 border-rose-500/20'
          }`}
        >
          {claim.confidence}% Conf
        </div>
      </div>

      {isEditing ? (
        <div className="mb-6 space-y-2">
          <textarea
            ref={inputRef}
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl p-3 text-sm text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5"
            >
              <Save size={12} /> Save Refinement
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm font-bold text-white leading-relaxed mb-6">{claim.fact}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          <Clock size={12} /> {new Date(claim.timestamp).toLocaleDateString()}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-slate-600 hover:text-indigo-400 transition-colors"
            title="Edit Fact"
          >
            <Edit3 size={12} />
          </button>
          {source && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
            >
              <ExternalLink size={12} /> Evidence
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-rose-500/60 hover:text-rose-400 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && source && (
        <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-white/5 animate-in slide-in-from-top-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
            Original Context
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Database size={14} />
            </div>
            <p className="text-xs text-slate-300 font-medium truncate">{source.name}</p>
          </div>
          <button
            onClick={() => window.open(`data:${source.mimeType};base64,${source.data}`, '_blank')}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300 rounded-xl border border-white/5 transition-all"
          >
            Open Resource
          </button>
        </div>
      )}

      {claim.status === ClaimStatus.PROPOSED && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 p-1 rounded-lg backdrop-blur-sm border border-slate-700">
          <button
            onClick={onApprove}
            className="p-1.5 hover:text-emerald-400 text-slate-500 transition-colors"
          >
            <CheckCircle2 size={16} />
          </button>
          <button
            onClick={onReject}
            className="p-1.5 hover:text-rose-500 text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {claim.status === ClaimStatus.CONFLICT && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Reality Conflict
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onResolve(claim.id, 'OVERWRITE')}
              className="flex-1 py-2 bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg"
            >
              Overwrite
            </button>
            <button
              onClick={() => onResolve(claim.id, 'KEEP_EXISTING')}
              className="flex-1 py-2 bg-slate-800 text-slate-300 text-[8px] font-black uppercase tracking-widest rounded-lg"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
