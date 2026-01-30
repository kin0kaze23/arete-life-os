import React, { useMemo, useState } from 'react';
import { getProfileCompletion } from '@/shared';
import {
  AlwaysChip,
  DailyTask,
  UserProfile,
  ProactiveInsight,
  Category,
  MemoryEntry,
  TimelineEvent,
  BlindSpot,
  Recommendation,
  Source,
  computeFinanceMetrics,
  extractFinanceMetricsFromMemory,
} from '@/data';
import { FocusList } from './FocusList';
import { StatusSidebar } from './StatusSidebar';
import { EventPrepPopup } from './EventPrepPopup';
import { EventEditSheet } from './EventEditSheet';
import { SystemStatusFooter } from './SystemStatusFooter';
import { UpcomingCalendar } from './UpcomingCalendar';

interface DashboardViewProps {
  memory: MemoryEntry[];
  tasks: DailyTask[];
  dailyPlan: DailyTask[];
  timelineEvents: TimelineEvent[];
  insights: ProactiveInsight[];
  blindSpots?: BlindSpot[];
  profile: UserProfile;
  ruleOfLife: any;
  sources: Source[];
  recommendations: Recommendation[];
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  refreshAll: () => void;
  planMyDay: () => void;
  onNavigate: (tab: any) => void;
  updateMemoryItem?: (id: string, updates: Partial<MemoryEntry>) => void;
  deleteMemoryItem?: (id: string) => void;
  keepRecommendation?: (id: string) => void;
  removeRecommendation?: (id: string) => void;
  activatePrepPlan?: (plan: Recommendation, eventId?: string) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  logMemory?: (input: string) => Promise<void>;
  alwaysDoChips?: AlwaysChip[];
  alwaysWatchChips?: AlwaysChip[];
  isPlanningDay: boolean;
  isGeneratingTasks: boolean;
  undoTaskAction?: () => void;
  updateTimelineEvent?: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory = [],
  tasks,
  dailyPlan,
  timelineEvents,
  blindSpots = [],
  profile,
  recommendations,
  toggleTask,
  deleteTask,
  logMemory,
  planMyDay,
  onNavigate,
  updateMemoryItem,
  deleteMemoryItem,
  activatePrepPlan,
  onToast,
  alwaysDoChips = [],
  alwaysWatchChips = [],
  keepRecommendation,
  removeRecommendation,
  isPlanningDay,
  isGeneratingTasks,
  updateTimelineEvent,
  deleteTimelineEvent,
}) => {
  const [activePrepEvent, setActivePrepEvent] = useState<TimelineEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  const completion = getProfileCompletion(profile);

  const financeMetrics = useMemo(() => {
    const fromMemory = extractFinanceMetricsFromMemory(memory);
    if (fromMemory) return fromMemory;
    return computeFinanceMetrics(profile);
  }, [memory, profile.finances]);

  // Derived Habits
  const habitItems = useMemo(() => {
    const items = memory.filter(
      (item) => item.category === Category.HABIT || item.metadata?.type === 'habit'
    );
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [memory]);

  // Derived Tasks (Focus)
  // Combine dailyPlan and tasks, prioritizing plan
  const focusTasks = useMemo(() => {
    // If we have a daily plan, that IS the focus.
    if (dailyPlan.length > 0) return dailyPlan;
    return tasks;
  }, [dailyPlan, tasks]);

  const handleToggleHabit = (id: string) => {
    // For now, we'll try to update the item to indicate completion for today
    // This depends on backend logic, but UI will optimize optimistically
    if (updateMemoryItem) {
      // Just a placeholder update for visual feedback or sorting
      updateMemoryItem(id, { timestamp: Date.now() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {/* Column 1: Tactics (Focus) */}
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Mission Control</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Horizon Focus</p>
            </div>
          </div>
          <FocusList
            tasks={focusTasks}
            habitItems={habitItems}
            onToggleTask={(id) => toggleTask(id)}
            onToggleHabit={handleToggleHabit}
            onDeleteTask={(id) => deleteTask(id)}
            onRefreshPlan={planMyDay}
            onRefreshQueue={planMyDay} // Re-using planMyDay for simplicity, or could be generateTasks
            isPlanning={isPlanningDay}
            events={timelineEvents}
          />
        </div>

        {/* Column 2: Horizon (Upcoming) */}
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Upcoming Events</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Schedule</p>
            </div>
          </div>
          <UpcomingCalendar
            events={timelineEvents}
            onSelectEvent={setActivePrepEvent}
            onEditEvent={setEditingEvent}
            onDeleteEvent={deleteTimelineEvent}
          />
        </div>

        {/* Column 3: Insight & Status */}
        <div className="space-y-8">
          {/* StatusSidebar (Header handled internally) */}
          <StatusSidebar
            profile={profile}
            completion={completion.overall}
            blindSpots={blindSpots}
            financeMetrics={financeMetrics}
            recommendations={recommendations}
            onNavigate={onNavigate}
            onActivate={(rec) => activatePrepPlan?.(rec, (rec as any).metadata?.eventId)}
            onKeepRecommendation={keepRecommendation}
            onRemoveRecommendation={removeRecommendation}
            alwaysDoChips={alwaysDoChips}
            alwaysWatchChips={alwaysWatchChips}
          />
        </div>
      </div>

      <div className="mt-10">{/* AlwaysPanels removed and merged into StatusSidebar */}</div>

      <EventPrepPopup
        event={activePrepEvent}
        profile={profile}
        memory={memory}
        onClose={() => setActivePrepEvent(null)}
        onActivate={(plan, id) => {
          activatePrepPlan?.(plan, id);
          onToast?.(`Armed: ${plan.title}. Tasks added to Today's Focus.`, 'success');
          setActivePrepEvent(null);
        }}
      />

      {editingEvent && updateTimelineEvent && (
        <EventEditSheet
          event={editingEvent}
          onSave={updateTimelineEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      <div className="mt-12">
        <SystemStatusFooter completion={completion.overall} />
      </div>
    </div>
  );
};
