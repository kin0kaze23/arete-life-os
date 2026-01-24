import React, { useMemo, useState } from 'react';
import {
  MemoryEntry,
  Category,
  CategorizedFact,
  UserProfile,
  TimelineEvent,
  Recommendation,
} from './types';
import { getCategoryColor } from './SharedUI';
import {
  Calendar,
  Clock,
  Hash,
  Heart,
  Wallet,
  Users,
  Compass,
  Briefcase,
  Coffee,
  Plane,
  Globe,
  CheckCircle2,
  Baby,
  Search,
  Filter,
  History,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Plus,
  X,
  Trash2,
  Edit3,
  Flag,
  Database,
  FileText,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { PrepPlanModal } from './PrepPlanModal';

interface LifeStreamViewProps {
  memory: MemoryEntry[];
  profile: UserProfile;
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (e: TimelineEvent) => void;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  activatePrepPlan: (plan: Recommendation) => void;
  onDeleteFacts: (items: Array<{ memoryId: string; factText: string }>) => void;
}

interface StreamEvent {
  id: string;
  date: Date;
  title: string;
  category: Category;
  facts: CategorizedFact[];
  isManual?: boolean;
  description?: string;
  sourceId?: string;
  confidence?: number;
}

export const LifeStreamView: React.FC<LifeStreamViewProps> = ({
  memory,
  profile,
  timelineEvents,
  addTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  activatePrepPlan,
  onDeleteFacts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const stream = useMemo(() => {
    const events: StreamEvent[] = [];
    memory.forEach((m) => {
      events.push({
        id: m.id,
        date: new Date(m.timestamp),
        title: m.content,
        category: m.category,
        facts: m.extractedFacts,
        sourceId: m.id,
        confidence: m.extractionConfidence,
      });
    });
    timelineEvents.forEach((e) => {
      events.push({
        id: e.id,
        date: new Date(e.date),
        title: e.title,
        category: e.category,
        facts: [],
        isManual: true,
        description: e.description,
      });
    });
    return events
      .filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [memory, timelineEvents, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-4xl font-black tracking-tighter text-white">Life Stream</h3>
          <p className="text-slate-500 font-medium">Historical trace & projected trajectory.</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Filter chronology..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-indigo-500 transition-all text-sm text-slate-200 placeholder-slate-700"
        />
      </div>

      <div className="space-y-6">
        {stream.map((event) => (
          <div
            key={event.id}
            onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
            className={`group p-6 rounded-[2rem] border transition-all cursor-pointer ${expandedEventId === event.id ? 'bg-indigo-600/5 border-indigo-500/50 shadow-2xl' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl ${getCategoryColor(event.category).split(' ')[0]} bg-opacity-20`}
                >
                  {getIconForCategory(event.category)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {event.date.toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getCategoryColor(event.category)}`}
                    >
                      {event.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-100">{event.title}</h4>
                </div>
              </div>
              <ChevronRight
                className={`text-slate-700 transition-transform ${expandedEventId === event.id ? 'rotate-90 text-indigo-500' : ''}`}
              />
            </div>

            {expandedEventId === event.id && (
              <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                      <Sparkles size={12} /> Intelligence Payload
                    </h5>
                    {event.facts.length > 0 ? (
                      event.facts.map((f, i) => (
                        <div
                          key={i}
                          className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800"
                        >
                          <p className="text-xs font-medium text-slate-300">"{f.fact}"</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        {event.description || 'Historical anchor point.'}
                      </p>
                    )}
                  </div>
                  <div className="p-6 bg-slate-950 rounded-2xl border border-dashed border-slate-800 flex flex-col justify-center">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 mb-2">
                      <span>Integrity</span>
                      <span>{event.confidence || 100}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${event.confidence || 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {stream.length === 0 && (
          <EmptyState
            icon={<History />}
            title="Stream Vacant"
            description="Capture life events in the Log Bar to build your chronology."
          />
        )}
      </div>
    </div>
  );
};

const getIconForCategory = (cat: Category) => {
  switch (cat) {
    case Category.HEALTH:
      return <Heart size={18} />;
    case Category.FINANCE:
      return <Wallet size={18} />;
    case Category.RELATIONSHIPS:
      return <Users size={18} />;
    case Category.SPIRITUAL:
      return <Compass size={18} />;
    case Category.WORK:
      return <Briefcase size={18} />;
    default:
      return <Hash size={18} />;
  }
};
