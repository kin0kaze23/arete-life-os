import React, { useMemo, useState, useEffect } from 'react';
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
import { generateInsights } from '@/api/insightEngine';
import { FocusList } from './FocusList';
import { StatusSidebar } from './StatusSidebar';
import { EventPrepPopup } from './EventPrepPopup';
import { EventEditSheet } from './EventEditSheet';
import { SystemStatusFooter } from './SystemStatusFooter';
import { UpcomingCalendar } from './UpcomingCalendar';
import { LifePulseBar } from './LifePulseBar';
import { LifeRadarChart } from './LifeRadarChart';
import { SmartSuggestions } from './SmartSuggestions';
import { WeeklyDigest } from './WeeklyDigest';
import { DimensionTrendIndicator } from './DimensionTrendIndicator';
import { InsightCard } from './InsightCard';

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
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const completion = getProfileCompletion(profile);

  // Generate insights when memory or profile changes
  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      try {
        const newInsights = await generateInsights(memory, profile);
        setInsights(newInsights);
      } catch (error) {
        console.error('Error generating insights:', error);
        // Ensure we still render with fallback insights
        setInsights([]);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();
  }, [memory, profile]);

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

  // Sample radar chart data to demonstrate
  const radarChartData = [
    { subject: 'Health', A: 80 },
    { subject: 'Finance', A: 70 },
    { subject: 'Relationships', A: 85 },
    { subject: 'Spirit', A: 55 },
    { subject: 'Personal', A: 90 },
  ];

  // Mock for SmartSuggestions (would come from actual data in implementation)
  const mockSuggestions = [
    {
      id: '1',
      title: 'Review budget this week',
      description: 'Based on your recent spending patterns, consider revising your expense categories.',
      context: 'Finance related, due to pending payment',
      cta: 'Plan now',
      score: 85
    },
    {
      id: '2',
      title: 'Schedule health check-up',
      description: 'Your last physical was 10 months ago. Time for an annual check-up.',
      context: 'Health related, based on calendar',
      cta: 'Book appointment',
      score: 78
    }
  ];

  // Mock for WeeklyDigest (would come from actual data in implementation)
  const mockWeeklyDigest = {
    totalLogs: 12,
    logFrequency: 'Daily',
    avgScore: 74,
    bestDimension: 'Personal',
    bestDimensionScore: 88,
    dimensionChanges: [
      { dimension: 'Health', change: -2 },
      { dimension: 'Finance', change: 5 },
      { dimension: 'Relationships', change: 1 },
    ],
    nextWeekFocus: 'Improve sleep consistency',
    highlights: undefined
  };

  // Mock function handlers
  const handleSuggestionAction = (id: string) => console.log('Suggestion action:', id);
  const handleSuggestionDismiss = (id: string) => console.log('Suggestion dismissed:', id);
  const handleDigestShare = () => console.log('Sharing digest');

  // Insight handling functions
  const handleInsightAction = (id: string) => {
    console.log('Insight action:', id);
    // Here we would have actual logic to respond to the insight
  };

  const handleInsightDismiss = (id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id));
    console.log('Insight dismissed:', id);
  };

  return (
    <div className="max-w-7xl mx-auto pb-32">
      {/* Added header with Life Pulse Bar (Enhanced version of LifePulseBar - similar to old DimensionPulseBar concept but enhanced) */}
      <div className="mb-8 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
        <LifePulseBar memoryEntries={memory} goals={[]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {/* Column 1: Changed to include both Tactics + Life Radar Chart */}
        <div className="space-y-8">
          {/* Radar Chart Section */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Life Radar</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">5-Dimension View</p>
              </div>
            </div>
            <div className="h-64">
              <LifeRadarChart 
                data={radarChartData} 
                onScoreUpdate={(prev, next) => console.log(`Score updated from ${prev} to ${next}`)}
              />
            </div>
          </div>

          {/* Original Focus List */}
          <div>
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
        </div>

        {/* Column 2: Horizon (Upcoming) */}
        <div className="space-y-8">
          {/* Smart Suggestions */}
          <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm">
            <SmartSuggestions
              suggestions={mockSuggestions}
              onAction={handleSuggestionAction}
              onDismiss={handleSuggestionDismiss}
            />
          </div>

          {/* Insights Section */}
          {insights.length > 0 && (
            <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Intelligence Insights</h3>
                {loadingInsights && (
                  <span className="text-xs text-slate-500 animate-pulse">Analyzing...</span>
                )}
              </div>
              <div className="space-y-2">
                {insights.slice(0, 4).map((insight) => (
                  <InsightCard 
                    key={insight.id} 
                    insight={insight} 
                    variant={insight.type as 'pattern' | 'benchmark' | 'predictive' | 'actionable' || 'pattern'}
                    onAction={handleInsightAction}
                    onDismiss={handleInsightDismiss} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Original Upcoming */}
          <div>
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
        </div>

        {/* Column 3: Insight & Status - Updated with Weekly Digest */}
        <div className="space-y-8">
          {/* Weekly Digest for Mondays */}
          <WeeklyDigest
            stats={mockWeeklyDigest}
            isMonday={new Date().getDay() === 1} // True only on Mondays
            onShare={handleDigestShare}
          />
          
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
