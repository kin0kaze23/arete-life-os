import React, { useMemo, useState, useCallback } from 'react';
import {
  MemoryEntry,
  Category,
  CategorizedFact,
  UserProfile,
  TimelineEvent,
  Recommendation,
} from '@/data';
import { EmptyState, VaultInput, VaultSelect } from '@/shared';
import { TimelineChart, TimelineChartEvent } from './TimelineChart';
import { TimelineZoomControls, ZoomLevel } from './TimelineZoomControls';
import { TimelineCategoryFilter } from './TimelineCategoryFilter';
import { Calendar, Clock, Hash, History, Sparkles, Plus, X, Trash2, Edit3 } from 'lucide-react';
import { PrepPlanModal } from '@/command/PrepPlanModal';

interface TimelineViewProps {
  memory: MemoryEntry[];
  profile: UserProfile;
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (e: TimelineEvent) => void;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  activatePrepPlan: (plan: Recommendation) => void;
}

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
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(Object.values(Category));
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [prepEvent, setPrepEvent] = useState<TimelineEvent | null>(null);

  const [formEvent, setFormEvent] = useState<Partial<TimelineEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: Category.GENERAL,
    description: '',
  });

  const allEvents = useMemo(() => {
    const evs: SemanticEvent[] = [];

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

    return evs.sort((a, b) => a.primaryDate.getTime() - b.primaryDate.getTime());
  }, [memory, timelineEvents, profile]);

  const chartEvents: TimelineChartEvent[] = useMemo(() => {
    return allEvents.map((e) => ({
      id: e.id,
      date: e.primaryDate,
      title: e.displayTitle,
      category: e.category,
      facts: e.facts,
      isManual: e.isManual,
      description: e.description,
      confidence: e.confidence,
    }));
  }, [allEvents]);

  const handleCategoryToggle = useCallback((category: Category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  }, []);

  const handleCenterToday = useCallback(() => {
    setZoomLevel('month');
  }, []);

  const handleResetView = useCallback(() => {
    setZoomLevel('month');
    setSelectedCategories(Object.values(Category));
    setExpandedEventId(null);
  }, []);

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

  const handlePrep = (event: TimelineChartEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const tEvent: TimelineEvent = {
      id: event.id,
      ownerId: profile.id,
      title: event.title,
      date: event.date.toISOString().split('T')[0],
      category: event.category,
      description: event.description || '',
      createdAt: Date.now(),
      isManual: !!event.isManual,
    };
    setPrepEvent(tEvent);
  };

  const handleEventEdit = (event: TimelineChartEvent) => {
    const semanticEvent = allEvents.find((e) => e.id === event.id);
    if (semanticEvent) {
      handleOpenModal(semanticEvent);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-40 px-4 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 pt-6">
        <div className="space-y-2">
          <h3 className="text-4xl font-black tracking-tighter text-white">Life Chronology</h3>
          <p className="text-slate-500 font-medium">Map your trajectory, planned or passed.</p>
        </div>

        <TimelineZoomControls
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onCenterToday={handleCenterToday}
          onResetView={handleResetView}
        />
      </div>

      <div className="mb-6">
        <TimelineCategoryFilter
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
        />
      </div>

      <TimelineChart
        events={chartEvents}
        zoomLevel={zoomLevel}
        selectedCategories={selectedCategories}
        expandedEventId={expandedEventId}
        onEventToggle={(id) => setExpandedEventId(expandedEventId === id ? null : id)}
        onEventEdit={handleEventEdit}
        onEventDelete={handleDelete}
        onEventPrep={handlePrep}
      />

      {chartEvents.length === 0 && (
        <EmptyState
          icon={<History />}
          title="Narrative Void"
          description="No temporal markers detected. Initialize a planned milestone or record history."
          actionLabel="Initialize Record"
          onAction={() => handleOpenModal()}
          className="py-20"
        />
      )}

      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-32 right-10 w-16 h-16 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform" />
      </button>

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
