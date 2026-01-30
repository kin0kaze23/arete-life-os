import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Category, CategorizedFact, TimelineEvent } from '@/data';
import { ZoomLevel } from './TimelineZoomControls';
import { TimelineEventNode } from './TimelineEventNode';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export interface TimelineChartEvent {
  id: string;
  date: Date;
  title: string;
  category: Category;
  facts: CategorizedFact[];
  isManual?: boolean;
  description?: string;
  confidence?: number;
}

interface TimelineChartProps {
  events: TimelineChartEvent[];
  zoomLevel: ZoomLevel;
  selectedCategories: Category[];
  expandedEventId: string | null;
  onEventToggle: (id: string) => void;
  onEventEdit?: (event: TimelineChartEvent) => void;
  onEventDelete?: (id: string) => void;
  onEventPrep?: (event: TimelineChartEvent, e: React.MouseEvent) => void;
}

const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;

const getCategoryColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    [Category.HEALTH]: 'bg-rose-500',
    [Category.FINANCE]: 'bg-amber-500',
    [Category.RELATIONSHIPS]: 'bg-violet-500',
    [Category.SPIRITUAL]: 'bg-indigo-500',
    [Category.WORK]: 'bg-sky-500',
    [Category.SOCIAL]: 'bg-emerald-500',
    [Category.PERSONAL]: 'bg-pink-500',
    [Category.MEALS]: 'bg-orange-500',
    [Category.TRAVEL]: 'bg-cyan-500',
    [Category.HABIT]: 'bg-lime-500',
    [Category.GENERAL]: 'bg-slate-500',
  };
  return colors[category] || 'bg-slate-500';
};

export const TimelineChart: React.FC<TimelineChartProps> = ({
  events,
  zoomLevel,
  selectedCategories,
  expandedEventId,
  onEventToggle,
  onEventEdit,
  onEventDelete,
  onEventPrep,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(50);

  const now = new Date();
  const today = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => selectedCategories.includes(e.category));
  }, [events, selectedCategories]);

  const { timeRange, ticks } = useMemo(() => {
    let startDate: Date;
    let endDate: Date;
    const tickDates: Date[] = [];

    if (filteredEvents.length === 0) {
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      const dates = filteredEvents.map((e) => e.date.getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);

      startDate = new Date(minDate);
      endDate = new Date(maxDate);

      const buffer = (maxDate - minDate) * 0.1;
      startDate = new Date(minDate - buffer);
      endDate = new Date(maxDate + buffer);
    }

    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (zoomLevel === 'week') {
      const daysBeforeToday = Math.ceil(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysBeforeToday + (daysBeforeToday % 7));
      startDate = weekStart;
      endDate = new Date(weekStart);
      endDate.setDate(weekStart.getDate() + DAYS_IN_WEEK);

      for (let i = 0; i <= DAYS_IN_WEEK; i++) {
        const tick = new Date(startDate);
        tick.setDate(startDate.getDate() + i);
        tickDates.push(tick);
      }
    } else if (zoomLevel === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = monthStart;
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const daysInMonth = endDate.getDate();
      const tickInterval = Math.ceil(daysInMonth / 6);
      for (let i = 0; i <= daysInMonth; i += tickInterval) {
        const tick = new Date(startDate);
        tick.setDate(startDate.getDate() + i);
        tickDates.push(tick);
      }
    } else {
      const yearStart = new Date(today.getFullYear() - 1, 0, 1);
      startDate = yearStart;
      endDate = new Date(today.getFullYear() + 1, 11, 31);

      for (let i = 0; i <= 24; i++) {
        const tick = new Date(startDate);
        tick.setMonth(startDate.getMonth() + i);
        tickDates.push(tick);
      }
    }

    return { timeRange: { start: startDate, end: endDate }, ticks: tickDates };
  }, [filteredEvents, zoomLevel, today]);

  const totalDuration = timeRange.end.getTime() - timeRange.start.getTime();

  const getEventPosition = (date: Date): number => {
    const eventTime = date.getTime();
    if (eventTime < timeRange.start.getTime()) return 0;
    if (eventTime > timeRange.end.getTime()) return 100;
    return ((eventTime - timeRange.start.getTime()) / totalDuration) * 100;
  };

  const getTodayPosition = (): number => {
    return getEventPosition(today);
  };

  const groupedEvents = useMemo(() => {
    const groups: TimelineChartEvent[][] = [];
    const sortedEvents = [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());

    sortedEvents.forEach((event) => {
      const position = getEventPosition(event.date);
      let placed = false;

      for (const group of groups) {
        const lastEvent = group[group.length - 1];
        const lastPosition = getEventPosition(lastEvent.date);
        if (Math.abs(position - lastPosition) > 3) {
          group.push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        groups.push([event]);
      }
    });

    return groups;
  }, [filteredEvents, timeRange]);

  const handleScroll = (direction: 'left' | 'right') => {
    const step = zoomLevel === 'week' ? 7 : zoomLevel === 'month' ? 30 : 365;
    const newStart = new Date(timeRange.start);
    newStart.setDate(newStart.getDate() + (direction === 'right' ? step : -step));

    const event = new CustomEvent('timelineNavigate', {
      detail: { date: newStart, zoomLevel },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="relative h-[400px] bg-slate-950/30 rounded-2xl border border-slate-800 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
          <div className="relative min-w-full h-full px-8">
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-slate-800 via-indigo-900/50 to-slate-800 rounded-full transform -translate-y-1/2">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent animate-pulse" />
            </div>

            {ticks.map((tick, idx) => {
              const position = getEventPosition(tick);
              return (
                <div
                  key={idx}
                  className="absolute top-1/2 transform -translate-y-1/2"
                  style={{ left: `${position}%` }}
                >
                  <div className="w-px h-8 bg-slate-700/50" />
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 whitespace-nowrap">
                    {zoomLevel === 'year'
                      ? tick.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                      : tick.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}

            <div
              className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500 to-transparent z-10"
              style={{ left: `${getTodayPosition()}%` }}
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-1 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-wider shadow-lg">
                Today
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Clock size={14} className="text-indigo-400" />
              </div>
            </div>

            {groupedEvents.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className="absolute top-1/2 transform -translate-y-1/2"
                style={{
                  top: `${50 + ((groupIdx % 3) - 1) * 15}%`,
                }}
              >
                {group.map((event) => {
                  const position = getEventPosition(event.date);
                  const isUpcoming = event.date > today;
                  const daysUntil = Math.ceil(
                    (event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <TimelineEventNode
                      key={event.id}
                      id={event.id}
                      date={event.date}
                      title={event.title}
                      category={event.category}
                      facts={event.facts}
                      isManual={event.isManual}
                      description={event.description}
                      confidence={event.confidence}
                      isExpanded={expandedEventId === event.id}
                      isUpcoming={isUpcoming}
                      daysUntilLabel={isUpcoming ? `${daysUntil}d` : undefined}
                      position={position}
                      onToggle={() => onEventToggle(event.id)}
                      onEdit={onEventEdit ? () => onEventEdit(event) : undefined}
                      onDelete={onEventDelete ? () => onEventDelete(event.id) : undefined}
                      onPrep={onEventPrep ? (e) => onEventPrep(event, e) : undefined}
                    />
                  );
                })}
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Clock size={24} className="text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm">No events in this view</p>
                  <p className="text-slate-600 text-xs mt-1">Try adjusting filters or add events</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => handleScroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/90 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all z-20"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => handleScroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/90 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all z-20"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            {timeRange.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            {timeRange.end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="text-[10px] text-slate-600">{filteredEvents.length} events visible</div>
      </div>
    </div>
  );
};
