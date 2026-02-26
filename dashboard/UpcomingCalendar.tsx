import React from 'react';
import { TimelineEvent } from '@/data';
import { Calendar, Clock, MapPin, ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface UpcomingCalendarProps {
  events: TimelineEvent[];
  onSelectEvent: (event: TimelineEvent) => void;
  onEditEvent?: (event: TimelineEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  maxEvents?: number;
}

const truncateTitle = (title: string, maxWords = 4): string => {
  const words = title.split(' ');
  if (words.length <= maxWords) return title;
  return words.slice(0, maxWords).join(' ') + '…';
};

export const UpcomingCalendar: React.FC<UpcomingCalendarProps> = ({
  events,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  maxEvents,
}) => {
  const upcomingEvents = events
    .filter((e) => new Date(e.date).getTime() > Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxEvents || events.length);

  if (upcomingEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
        <Calendar size={20} className="mb-2 opacity-30" />
        <span className="text-[10px] uppercase font-black tracking-widest opacity-50">
          Zero Horizon Events
        </span>
      </div>
    );
  }

  // Grouping Logic: Resolve week/month buckets
  const getGroupLabel = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return 'This Week';
    if (diffDays < 14) return 'Next Week';

    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const grouped = upcomingEvents.reduce(
    (acc, event) => {
      const label = getGroupLabel(new Date(event.date));
      if (!acc[label]) acc[label] = [];
      acc[label].push(event);
      return acc;
    },
    {} as Record<string, TimelineEvent[]>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-700">
      {Object.entries(grouped).map(([group, groupEvents]) => (
        <div key={group} className="space-y-4">
          <div className="flex items-center gap-3">
            <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-500/80 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
              {group}
            </h4>
            <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {groupEvents.map((event) => {
              const d = new Date(event.date);
              const day = d.getDate();
              const month = d.toLocaleDateString('en-US', { month: 'short' });
              const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  data-testid="event-card"
                  data-event-id={event.id}
                  className="group flex items-stretch gap-4 p-3 bg-[#0A0C10] border border-white/5 rounded-2xl hover:bg-indigo-500/[0.03] hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                >
                  {/* Date Pillar */}
                  <div className="flex flex-col items-center justify-center min-w-[3.5rem] py-1 bg-slate-900/40 rounded-xl border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                    <span className="text-lg font-black text-white leading-none mb-0.5">{day}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">
                      {month}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="text-[13px] font-bold text-slate-200 group-hover:text-white transition-colors"
                        title={event.title}
                      >
                        {truncateTitle(event.title, 6)}
                      </h4>
                      {event.metadata?.isPriority && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {hasTime && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock size={10} className="text-indigo-500/60" />
                          <span className="text-[10px] font-medium tracking-tight">{time}</span>
                        </div>
                      )}
                      {event.fields?.location && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin size={10} className="text-slate-600" />
                          <span className="text-[10px] font-medium tracking-tight truncate max-w-[120px]">
                            {event.fields.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 pr-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    {onEditEvent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event);
                        }}
                        className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-amber-500/20 flex items-center justify-center text-slate-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/30 transition-all"
                        title="Edit event"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {onDeleteEvent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEvent(event.id);
                        }}
                        className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all"
                        title="Delete event"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
