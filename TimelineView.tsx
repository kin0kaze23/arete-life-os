import React, { useMemo, useState } from 'react';
import {
  MemoryEntry,
  Category,
  CategorizedFact,
  UserProfile,
  TimelineEvent,
  Recommendation,
} from './types';
import { getCategoryColor, VaultInput, VaultSelect } from './SharedUI';
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
  Save,
  Trash2,
  Edit3,
  Flag,
  ArrowRight,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { PrepPlanModal } from './PrepPlanModal';

interface TimelineViewProps {
  memory: MemoryEntry[];
  profile: UserProfile;
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (e: TimelineEvent) => void;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  activatePrepPlan: (plan: Recommendation) => void;
}

// Group facts and manual events into "Events"
interface SemanticEvent {
  id: string;
  primaryDate: Date;
  displayTitle: string;
  category: Category;
  facts: CategorizedFact[];
  sentiment: string;
  confidence: number;
  originalContent: string;
  isManual?: boolean;
  description?: string;
}

type QuickFilter = 'All Time' | 'This Year' | 'This Month' | 'Upcoming';

// Added helper function for date calculations to fix the "Cannot find name 'daysUntil'" error
const daysUntil = (date: Date | string) => {
  const target = typeof date === 'string' ? new Date(date) : date;
  const diff = target.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  memory,
  profile,
  timelineEvents,
  addTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  activatePrepPlan,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('All Time');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [prepEvent, setPrepEvent] = useState<TimelineEvent | null>(null);

  // Form State
  const [formEvent, setFormEvent] = useState<Partial<TimelineEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: Category.GENERAL,
    description: '',
  });

  const allEvents = useMemo(() => {
    const evs: SemanticEvent[] = [];
    const now = new Date();

    // 1. Convert Memories to Semantic Events
    memory.forEach((entry) => {
      const dates = entry.extractedFacts
        .map((f) => (f.eventDate ? new Date(f.eventDate).getTime() : null))
        .filter((d) => d !== null) as number[];
      const primaryTime = dates.length > 0 ? Math.min(...dates) : entry.timestamp;

      evs.push({
        id: entry.id,
        primaryDate: new Date(primaryTime),
        displayTitle:
          entry.content.length > 60 ? entry.content.substring(0, 60) + '...' : entry.content,
        category: entry.category,
        facts: entry.extractedFacts,
        sentiment: entry.sentiment,
        confidence: entry.extractionConfidence,
        originalContent: entry.content,
      });
    });

    // 2. Add Manual Events
    timelineEvents.forEach((e) => {
      evs.push({
        id: e.id,
        primaryDate: new Date(e.date),
        displayTitle: e.title,
        category: e.category,
        facts: [],
        sentiment: 'neutral',
        confidence: 100,
        originalContent: e.description,
        isManual: true,
        description: e.description,
      });
    });

    // 3. Add "Birth" as an Event
    if (profile.identify.birthday) {
      evs.push({
        id: 'birth-anchor',
        primaryDate: new Date(profile.identify.birthday),
        displayTitle: `${profile.identify.name}'s Identity Inception`,
        category: Category.GENERAL,
        facts: [
          {
            fact: 'Biological life cycle initiated.',
            category: Category.GENERAL,
            confidence: 100,
            eventDate: profile.identify.birthday,
          },
        ],
        sentiment: 'positive',
        confidence: 100,
        originalContent: 'Profile Identity Seed',
      });
    }

    // Apply Filters
    return evs
      .filter((e) => {
        const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
        if (!matchesCategory) return false;

        if (quickFilter === 'Upcoming') return e.primaryDate > now;
        if (quickFilter === 'This Year') return e.primaryDate.getFullYear() === now.getFullYear();
        if (quickFilter === 'This Month')
          return (
            e.primaryDate.getMonth() === now.getMonth() &&
            e.primaryDate.getFullYear() === now.getFullYear()
          );
        return true;
      })
      .sort((a, b) => b.primaryDate.getTime() - a.primaryDate.getTime());
  }, [memory, timelineEvents, profile, categoryFilter, quickFilter]);

  const groupedByYear = useMemo(() => {
    const grouped: Record<string, SemanticEvent[]> = {};
    const now = new Date();
    const upcoming: SemanticEvent[] = [];

    allEvents.forEach((event) => {
      if (event.primaryDate > now) {
        upcoming.push(event);
      } else {
        const year = event.primaryDate.getFullYear().toString();
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(event);
      }
    });

    return { grouped, upcoming };
  }, [allEvents]);

  const years = Object.keys(groupedByYear.grouped).sort((a, b) => Number(b) - Number(a));

  const handleOpenModal = (event?: SemanticEvent) => {
    if (event && event.isManual) {
      setEditingEventId(event.id);
      setFormEvent({
        title: event.displayTitle,
        date: event.primaryDate.toISOString().split('T')[0],
        category: event.category,
        description: event.description || '',
      });
    } else {
      setEditingEventId(null);
      setFormEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        category: Category.GENERAL,
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEvent.title || !formEvent.date) return;

    if (editingEventId) {
      updateTimelineEvent(editingEventId, formEvent);
    } else {
      addTimelineEvent({
        id: `manual-evt-${Date.now()}`,
        ownerId: profile.id,
        title: formEvent.title!,
        date: formEvent.date!,
        category: formEvent.category || Category.GENERAL,
        description: formEvent.description || '',
        createdAt: Date.now(),
        isManual: true,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this event from your chronology?')) {
      deleteTimelineEvent(id);
    }
  };

  const handlePrep = (e: React.MouseEvent, event: SemanticEvent) => {
    e.stopPropagation();
    const tEvent: TimelineEvent = {
      id: event.id,
      ownerId: profile.id,
      title: event.displayTitle,
      date: event.primaryDate.toISOString().split('T')[0],
      category: event.category,
      description: event.description || event.originalContent,
      createdAt: Date.now(),
      isManual: !!event.isManual,
    };
    setPrepEvent(tEvent);
  };

  const QuickFilterButton: React.FC<{ filter: QuickFilter }> = ({ filter }) => (
    <button
      onClick={() => setQuickFilter(filter)}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
        quickFilter === filter
          ? 'bg-indigo-600 text-white border-transparent shadow-lg'
          : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-indigo-500/30'
      }`}
    >
      {filter}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto pb-40 px-4 relative">
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 pt-6">
        <div className="space-y-2">
          <h3 className="text-4xl font-black tracking-tighter text-white">Life Chronology</h3>
          <p className="text-slate-500 font-medium">Map your trajectory, planned or passed.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <QuickFilterButton filter="Upcoming" />
          <QuickFilterButton filter="This Month" />
          <QuickFilterButton filter="This Year" />
          <QuickFilterButton filter="All Time" />
          <div className="w-px h-6 bg-slate-800 mx-1 hidden sm:block"></div>
          <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <div className="px-3 text-slate-600">
              <Filter size={14} />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest pr-4 py-1.5 cursor-pointer text-slate-400"
            >
              <option value="All">All Domains</option>
              {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- TIMELINE CONTENT --- */}
      <div className="space-y-12 relative">
        {allEvents.length > 0 && (
          <div className="absolute left-[31px] top-10 bottom-0 w-1 bg-slate-800/50 rounded-full" />
        )}

        {/* UPCOMING SECTION */}
        {groupedByYear.upcoming.length > 0 && (
          <div className="relative group mb-16">
            <div className="sticky top-24 z-20 mb-8">
              <div className="inline-flex items-center gap-4 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl font-black text-sm tracking-[0.2em] ml-[10px] uppercase">
                Upcoming Trajectory <Sparkles size={16} fill="currentColor" />
              </div>
            </div>
            <div className="space-y-6 ml-8 pl-8">
              {groupedByYear.upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isExpanded={expandedEventId === event.id}
                  onToggle={() =>
                    setExpandedEventId(expandedEventId === event.id ? null : event.id)
                  }
                  onEdit={() => handleOpenModal(event)}
                  onDelete={() => handleDelete(event.id)}
                  onPrep={(e) => handlePrep(e, event)}
                  daysUntilLabel={`${daysUntil(event.primaryDate)} days until`}
                  isUpcoming
                />
              ))}
            </div>
          </div>
        )}

        {/* YEARLY GROUPED SECTION */}
        {years.map((year) => (
          <div key={year} className="relative group">
            <div className="sticky top-24 z-20 mb-8">
              <div className="inline-flex items-center gap-4 bg-slate-900 text-slate-300 border border-slate-800 px-6 py-2 rounded-2xl shadow-xl font-black text-lg tracking-tighter ml-[10px]">
                {year}
              </div>
            </div>

            <div className="space-y-6 ml-8 pl-8">
              {groupedByYear.grouped[year].map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isExpanded={expandedEventId === event.id}
                  onToggle={() =>
                    setExpandedEventId(expandedEventId === event.id ? null : event.id)
                  }
                  onEdit={() => handleOpenModal(event)}
                  onDelete={() => handleDelete(event.id)}
                  onPrep={(e) => handlePrep(e, event)}
                />
              ))}
            </div>
          </div>
        ))}

        {allEvents.length === 0 && (
          <EmptyState
            icon={<History />}
            title="Narrative Void"
            description="No temporal markers detected. Initialize a planned milestone or record history."
            actionLabel="Initialize Record"
            onAction={() => handleOpenModal()}
            className="py-40"
          />
        )}
      </div>

      {/* --- ADD EVENT FAB --- */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-32 right-10 w-16 h-16 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform" />
      </button>

      {/* --- EVENT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-white">
                {editingEventId ? 'Modify Event' : 'New Chronology Node'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-6">
              <VaultInput
                label="Event Title"
                value={formEvent.title || ''}
                onChange={(v) => setFormEvent({ ...formEvent, title: v })}
                placeholder="Climb Everest, Graduation, etc."
              />

              <div className="grid grid-cols-2 gap-4">
                <VaultInput
                  label="Occurrence Date"
                  type="date"
                  value={formEvent.date || ''}
                  onChange={(v) => setFormEvent({ ...formEvent, date: v })}
                />
                <VaultSelect
                  label="Domain"
                  value={formEvent.category || Category.GENERAL}
                  options={Object.values(Category)}
                  onChange={(v) => setFormEvent({ ...formEvent, category: v as Category })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Context / Description
                </label>
                <textarea
                  value={formEvent.description || ''}
                  onChange={(e) => setFormEvent({ ...formEvent, description: e.target.value })}
                  className="w-full bg-slate-950/50 border border-slate-800/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500/50 transition-all text-[13px] text-slate-300 min-h-[120px]"
                  placeholder="Additional temporal details..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-4 text-xs font-black uppercase text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                >
                  Save Chronology
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREP PLAN MODAL --- */}
      {prepEvent && (
        <PrepPlanModal
          event={prepEvent}
          profile={profile}
          history={memory}
          onClose={() => setPrepEvent(null)}
          onActivate={(plan) => {
            activatePrepPlan(plan);
            setPrepEvent(null);
          }}
        />
      )}
    </div>
  );
};

const EventCard: React.FC<{
  event: SemanticEvent;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrep: (e: React.MouseEvent) => void;
  daysUntilLabel?: string;
  isUpcoming?: boolean;
}> = ({ event, isExpanded, onToggle, onEdit, onDelete, onPrep, daysUntilLabel, isUpcoming }) => {
  const catColor = getCategoryColor(event.category).split(' ')[0];
  const isManual = !!event.isManual;

  return (
    <div className="relative">
      {/* Node Dot */}
      <div
        className={`absolute -left-[45px] top-4 w-6 h-6 rounded-full border-4 border-slate-900 z-10 transition-all ${catColor} ${isExpanded ? 'scale-125 ring-4 ring-indigo-500/10' : ''}`}
      />

      <div
        onClick={onToggle}
        className={`group/item p-6 rounded-[2rem] border transition-all cursor-pointer bg-slate-900/40 relative ${
          isExpanded
            ? 'border-indigo-500/50 shadow-2xl scale-[1.01]'
            : isUpcoming
              ? 'border-indigo-500/20 hover:border-indigo-500/40'
              : 'border-slate-800 hover:border-slate-700 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-5">
            <div
              className={`p-3 rounded-2xl ${catColor} flex-shrink-0 opacity-80 group-hover/item:opacity-100 transition-opacity`}
            >
              {getIconForCategory(event.category, event.id)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {event.primaryDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${catColor}`}
                >
                  {event.category}
                </span>
                {isManual && (
                  <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 rounded-md border border-indigo-500/20 uppercase tracking-tighter">
                    Planned
                  </span>
                )}
              </div>
              <h4
                className={`text-lg font-bold leading-tight transition-colors ${isExpanded ? 'text-indigo-400' : 'text-slate-200'}`}
              >
                {event.displayTitle}
              </h4>
              {daysUntilLabel && (
                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold text-indigo-400 uppercase">
                  <Clock size={10} /> {daysUntilLabel}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
              {isUpcoming && (
                <button
                  onClick={onPrep}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                >
                  <Sparkles size={12} /> Plan Mission
                </button>
              )}
              {isManual && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-2 text-slate-500 hover:text-indigo-400 bg-slate-800 rounded-xl"
                >
                  <Edit3 size={14} />
                </button>
              )}
              {event.id !== 'birth-anchor' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 text-slate-500 hover:text-rose-500 bg-slate-800 rounded-xl"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div
              className={`p-2 rounded-full transition-transform ${isExpanded ? 'rotate-90 bg-slate-800' : 'text-slate-600'}`}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-8 pt-8 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                    Temporal Detail
                  </span>
                </div>
                {event.facts.length > 0 ? (
                  event.facts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2"
                    >
                      <p className="text-xs font-semibold leading-relaxed text-slate-300">
                        "{fact.fact}"
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          {fact.category}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-900/10 px-2 py-0.5 rounded-md">
                          {fact.confidence}% Match
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {event.description || 'Manual chronology node created for system context.'}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <History size={14} className="text-slate-500" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Metadata
                  </span>
                </div>
                <div className="p-5 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Status</span>
                      <span className={isUpcoming ? 'text-indigo-400' : 'text-emerald-400'}>
                        {isUpcoming ? 'Projected' : 'Historical'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Origin</span>
                      <span>{isManual ? 'Manual Entry' : 'Extracted from Log'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Timestamp</span>
                      <span>{event.primaryDate.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {event.originalContent && !isManual && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-[10px] text-slate-600 italic leading-relaxed">
                        "{event.originalContent}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getIconForCategory = (cat: Category, id: string) => {
  if (id === 'birth-anchor') return <Baby size={18} />;
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
    case Category.SOCIAL:
      return <Globe size={18} />;
    case Category.MEALS:
      return <Coffee size={18} />;
    case Category.TRAVEL:
      return <Plane size={18} />;
    default:
      return <Hash size={18} />;
  }
};
