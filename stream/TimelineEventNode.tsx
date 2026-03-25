import React from 'react';
import { Category, CategorizedFact } from '@/data';
import { getCategoryColor, getCategoryIcon } from '@/shared';
import {
  Heart,
  Wallet,
  Users,
  Compass,
  Briefcase,
  Coffee,
  Plane,
  Globe,
  Baby,
  Hash,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  ChevronRight,
} from 'lucide-react';

interface TimelineEventNodeProps {
  id: string;
  date: Date;
  title: string;
  category: Category;
  facts: CategorizedFact[];
  isManual?: boolean;
  description?: string;
  confidence?: number;
  isExpanded: boolean;
  isUpcoming: boolean;
  daysUntilLabel?: string;
  position: number;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrep?: (e: React.MouseEvent) => void;
}

const getIconForCategory = (cat: Category, id: string) => {
  if (id === 'birth-anchor') return <Baby size={16} />;
  switch (cat) {
    case Category.HEALTH:
      return <Heart size={16} />;
    case Category.FINANCE:
      return <Wallet size={16} />;
    case Category.RELATIONSHIPS:
      return <Users size={16} />;
    case Category.SPIRITUAL:
      return <Compass size={16} />;
    case Category.PERSONAL:
      return <Briefcase size={16} />;
    default:
      return <Hash size={16} />;
  }
};

export const TimelineEventNode: React.FC<TimelineEventNodeProps> = ({
  id,
  date,
  title,
  category,
  facts,
  isManual,
  description,
  confidence,
  isExpanded,
  isUpcoming,
  daysUntilLabel,
  position,
  onToggle,
  onEdit,
  onDelete,
  onPrep,
}) => {
  const catColorClass = getCategoryColor(category);
  const colorParts = catColorClass.split(' ');
  const bgColor = colorParts[0];
  const textColor = colorParts[1] || 'text-slate-300';
  const borderColor = colorParts[2] || 'border-slate-700';

  return (
    <div className="absolute top-1/2 -translate-y-1/2 z-20" style={{ left: `${position}%` }}>
      <div className="relative group">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
            isExpanded
              ? `${bgColor} ${borderColor} scale-125 ring-4 ring-indigo-500/20`
              : isUpcoming
                ? `${bgColor} ${borderColor} opacity-60 hover:opacity-100`
                : `${bgColor} ${borderColor} hover:scale-110`
          }`}
          title={title}
        />

        <div
          className={`absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300 ${
            isExpanded
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          <div
            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${bgColor} ${textColor} border ${borderColor} shadow-lg`}
          >
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        {isUpcoming && daysUntilLabel && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded text-[8px] font-bold uppercase tracking-wider border border-indigo-500/30">
              {daysUntilLabel}
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-80">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-xl ${bgColor} ${textColor}`}>
                {getIconForCategory(category, id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${catColorClass}`}
                  >
                    {category}
                  </span>
                  {isManual && (
                    <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 rounded border border-indigo-500/20 uppercase tracking-tighter">
                      Planned
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-200 leading-tight">{title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button onClick={onToggle} className="text-slate-500 hover:text-slate-300">
                <ChevronRight size={18} className="rotate-90" />
              </button>
            </div>

            {facts.length > 0 ? (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={10} className="text-indigo-400" />
                  <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                    Extracted Intelligence
                  </span>
                </div>
                {facts.slice(0, 3).map((fact, idx) => (
                  <div key={idx} className="p-2 bg-slate-950/50 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-300 leading-relaxed">"{fact.fact}"</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[8px] text-slate-500 uppercase">{fact.category}</span>
                      <span className="text-[8px] text-emerald-400">{fact.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : description ? (
              <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800 mb-3">
                <p className="text-[10px] text-slate-300 leading-relaxed">{description}</p>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {isUpcoming && onPrep && (
                  <button
                    onClick={onPrep}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles size={10} />
                    Plan
                  </button>
                )}
                {isManual && onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
                {id !== 'birth-anchor' && onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="text-[9px] text-slate-500">
                {confidence ? `${confidence}% confidence` : 'Manual entry'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
