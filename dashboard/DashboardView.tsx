import React from 'react';
import {
  UserProfile,
  MemoryEntry,
  DailyTask,
  TimelineEvent,
  ProactiveInsight,
  BlindSpot,
  Source,
  Recommendation,
  AlwaysChip,
} from '@/data';
import { getProfileCompletion } from '@/shared';
import { LifePulse, ScoreData } from './components/LifePulse';
import { SwotChips, SwotItem } from './components/SwotChips';
import { PriorityCards, PriorityAction } from './components/PriorityCards';
import { Reflection } from './components/Reflection';
import { Sparkles, ArrowRight } from 'lucide-react';

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

// Mock Data Builders
const mockScores: ScoreData[] = [
  { id: '1', label: 'Health', score: 78, change: 3, trendText: 'today', colorVar: '--dim-health' },
  {
    id: '2',
    label: 'Finance',
    score: 54,
    change: -2,
    trendText: 'this week',
    colorVar: '--dim-finance',
  },
  {
    id: '3',
    label: 'Relationships',
    score: 82,
    change: 5,
    trendText: 'today',
    colorVar: '--dim-relationships',
  },
  {
    id: '4',
    label: 'Spiritual',
    score: 31,
    change: -8,
    trendText: 'this month',
    colorVar: '--dim-spiritual',
  },
  {
    id: '5',
    label: 'Personal',
    score: 61,
    change: 0,
    trendText: 'steady',
    colorVar: '--dim-personal',
  },
];

const mockSwot: SwotItem[] = [
  { type: 'strength', points: ['Morning prayer 4/7 days', 'Core values are clear'] },
  { type: 'weakness', points: ['No practice in 5 days', 'Values mentioned 0x recently'] },
  { type: 'opportunity', points: ['10min reflection = +12%', 'Reconnect w/ community'] },
  {
    type: 'threat',
    points: ['Spiritual drift often precedes burnout', 'Said "lack of meaning" 3x'],
  },
];

const mockPriorities: PriorityAction[] = [
  {
    id: 'p1',
    dimension: 'Health',
    title: 'Protect Your Momentum',
    why: "Your 25min runs are paying off (Health ↑78%). Don't lose this.",
    firstStep: 'Evening walk 15min — you said running felt great.',
    colorVar: '--dim-health',
  },
  {
    id: 'p2',
    dimension: 'Spiritual',
    title: 'Gentle Reconnection',
    why: '5 days without practice is your longest gap in 2 months.',
    firstStep: '5min reflection: "What gave meaning today?"',
    colorVar: '--dim-spiritual',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ profile, onNavigate }) => {
  const completion = getProfileCompletion(profile).overall;

  // EMPTY STATE LOGIC
  // If the user's profile is basically empty, we show the empty state driving them to Onboarding.
  if (completion < 10) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-8 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>

        <div className="space-y-4 relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Your Life Pulse <br className="hidden sm:block" /> Needs A Baseline
          </h2>
          <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
            I don't have enough context yet. Complete your profile setup to activate your localized,
            real-time life scoring.
          </p>
        </div>

        <button
          onClick={() => onNavigate('Onboarding')}
          className="relative z-10 mx-auto bg-white text-black hover:bg-white/90 px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-transform active:scale-95"
        >
          Begin Profile Setup
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ACTIVE DASHBOARD STATE
  return (
    <div className="max-w-3xl mx-auto pb-32 pt-8 px-4 sm:px-6">
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          Good evening, {profile.identify?.name || 'there'}
        </h2>
        <p className="text-white/60 text-base leading-relaxed">
          "You've carried a lot this week. One dimension needs gentle attention."
        </p>
      </div>

      <div className="space-y-10">
        <LifePulse
          scores={mockScores}
          overallBalance={61}
          balanceText='🟡 "Some areas need care"'
        />

        <SwotChips
          dimensionName="Spiritual"
          dimensionScore={31}
          swotData={mockSwot}
          alwaysDo="Morning prayer — 5min"
          alwaysWatch="Isolation from community"
        />

        <PriorityCards priorities={mockPriorities} />

        <Reflection text="You've been action-heavy this week. Rest isn't laziness — it's part of the work." />
      </div>
    </div>
  );
};
