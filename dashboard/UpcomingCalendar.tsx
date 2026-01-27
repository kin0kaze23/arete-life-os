import React from 'react';
import { CalendarDays } from 'lucide-react';
import { TimelineEvent } from '@/data';

interface UpcomingCalendarProps {
  events: TimelineEvent[];
  onSelectEvent: (event: TimelineEvent) => void;
}

const getUpcoming = (events: TimelineEvent[]) => {
  const now = Date.now();
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  return events
    .map((event) => ({
      ...event,
      time: new Date(event.date).getTime(),
    }))
    .filter((event) => event.time >= now && event.time <= now + twoWeeks)
    .sort((a, b) => a.time - b.time)
    .slice(0, 3);
};

export const UpcomingCalendar: React.FC<UpcomingCalendarProps> = ({ events, onSelectEvent }) => {
  const upcoming = getUpcoming(events);

  if (upcoming.length === 0) return null;

  return (
    <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40">
      <div className="flex items-center gap-2">
        <CalendarDays size={14} className="text-sky-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          Upcoming
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {upcoming.map((event) => (
          <button
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-900/60 hover:border-sky-500/30 transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-white">{event.title}</p>
                <p className="text-[10px] text-slate-400 mt-1">{event.description}</p>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-slate-500">
                {new Date(event.date).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
