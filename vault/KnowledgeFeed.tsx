import React, { useMemo, useState } from 'react';
import { Claim, Category, Source, ClaimStatus, MemoryItem } from '@/data/types';
import {
  User,
  Activity,
  Wallet,
  Compass,
  Globe,
  Briefcase,
  Database,
  Search,
  Edit3,
  ExternalLink,
  Trash2,
  CheckCircle2,
  X,
  AlertTriangle,
  Save,
  Clock,
} from 'lucide-react';
import { getCategoryColor } from '@/shared';
import { getFile } from '@/data';

interface KnowledgeFeedProps {
  claims: Claim[];
  sources: Source[];
  memoryItems: MemoryItem[];
  onApprove: (ids: string[]) => void;
  onReject: (ids: string[]) => void;
  onResolve: (id: string, resolution: 'OVERWRITE' | 'KEEP_EXISTING') => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, fact: string) => void;
}

export const KnowledgeFeed: React.FC<KnowledgeFeedProps> = ({
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

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => c.fact.toLowerCase().includes(search.toLowerCase()));
  }, [claims, search]);

  const getIcon = (cat: Category) => {
    switch (cat) {
      case Category.HEALTH:
        return <Activity size={14} />;
      case Category.FINANCE:
        return <Wallet size={14} />;
      case Category.RELATIONSHIPS:
        return <Compass size={14} />;
      case Category.SPIRITUAL:
        return <Globe size={14} />;
      case Category.PERSONAL:
        return <User size={14} />;
      default:
        return <Database size={14} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          type="text"
          placeholder="Search knowledge graph..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition-all sticky top-0 backdrop-blur-md z-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredClaims.map((claim) => {
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
        })}
      </div>
    </div>
  );
};

// Reusing ClaimCard Logic (simplified/inline for this file to be self-contained or copied from MemoryVaultView)
// Ideally we'd extract ClaimCard to shared, but for "Minimal" execution I'll duplicate the simplified version here.
// I will just paste the ClaimCard component code here.

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

  const handleSave = () => {
    if (editVal.trim() && onUpdate) {
      onUpdate(editVal.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group relative p-4 rounded-2xl border transition-all ${
        claim.status === ClaimStatus.CONFLICT
          ? 'bg-rose-500/5 border-rose-500/20'
          : claim.status === ClaimStatus.PROPOSED
            ? 'bg-indigo-500/5 border-indigo-500/20'
            : 'bg-slate-900/30 border-white/5 hover:bg-slate-900/50'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${getCategoryColor(claim.category)}`}>
            {getIcon(claim.category)}
          </div>
          <span
            className={`text-[8px] font-black uppercase tracking-wider ${getCategoryColor(claim.category)}`}
          >
            {claim.category}
          </span>
        </div>
        <span className="text-[8px] font-mono text-slate-600">{claim.confidence}% CONF</span>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg p-2 text-xs text-white outline-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="text-[9px] uppercase font-bold text-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-[9px] uppercase font-bold text-emerald-400"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs font-medium text-slate-200 leading-relaxed">{claim.fact}</p>
      )}

      {/* Actions Footer */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] text-slate-600 font-mono">
          {new Date(claim.timestamp).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-slate-500 hover:text-white"
          >
            <Edit3 size={12} />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="text-slate-500 hover:text-rose-400">
              <Trash2 size={12} />
            </button>
          )}

          {claim.status === ClaimStatus.PROPOSED && (
            <>
              <button
                onClick={onApprove}
                className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded"
              >
                <CheckCircle2 size={14} />
              </button>
              <button onClick={onReject} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
