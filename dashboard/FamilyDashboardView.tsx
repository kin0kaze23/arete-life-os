import React, { useMemo, useState } from 'react';
import {
  Users,
  Sparkles,
  Target,
  Zap,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  TrendingUp,
  Lock,
  Map,
} from 'lucide-react';
import { UserProfile, DailyTask, Goal, Recommendation, Category, BlindSpot } from '../data/types';
import { BentoCard, getCategoryColor, RadialProgress, Skeleton } from '../shared/SharedUI';
import { RecommendationsWidget } from './RecommendationsWidget';
import { BlindSideRadarCard } from './BlindSideRadarCard';
import { ReviewCard } from './ReviewCard';

interface FamilyDashboardProps {
  members: UserProfile[];
  tasks: DailyTask[];
  recommendations: Recommendation[];
  goals: Goal[];
  blindSpots: BlindSpot[];
  activeUserId: string;
  isPlanningDay: boolean;
  onPlanDay: () => void;
  onSwitchUser: (id: string) => void;
  onNavigate: (tab: any) => void;
  onToggleTask: (id: string) => void;
  onFinalizeRecommendation: (recId: string, data: Record<string, string>) => Promise<void>;
  onArmRecommendation: (id: string) => void;
  onDismissRecommendation: (id: string) => void;
}

export const FamilyDashboardView: React.FC<FamilyDashboardProps> = ({
  members,
  tasks,
  recommendations,
  goals,
  blindSpots,
  activeUserId,
  isPlanningDay,
  onPlanDay,
  onSwitchUser,
  onNavigate,
  onToggleTask,
  onFinalizeRecommendation,
  onArmRecommendation,
  onDismissRecommendation,
}) => {
  const [filterId, setFilterId] = useState<string | 'FAMILY'>('FAMILY');

  const visibleMembers = useMemo(() => members.filter((m) => !m.isArchived), [members]);
  const activeProfile = members.find((m) => m.id === activeUserId)!;

  // Filtering Logic
  const filteredData = useMemo(() => {
    const isFamily = filterId === 'FAMILY';
    return {
      tasks: tasks.filter((t) => {
        const belongs = isFamily || t.ownerId === filterId;
        if (!belongs) return false;
        // Respect privacy settings in Family view
        if (isFamily && t.ownerId !== activeUserId) {
          const owner = members.find((m) => m.id === t.ownerId);
          if (owner) {
            if (t.category === Category.FINANCE && !owner.privacySettings.viewFinance) return false;
            if (t.category === Category.HEALTH && !owner.privacySettings.viewHealth) return false;
          }
        }
        return true;
      }),
      // Casing of 'ACTIVE' must match type definition
      recs: recommendations.filter(
        (r) => (isFamily || r.ownerId === filterId) && r.status === 'ACTIVE' && !r.needsReview
      ),
      drafts: recommendations.filter(
        (r) => (isFamily || r.ownerId === filterId) && r.status === 'ACTIVE' && r.needsReview
      ),
      goals: goals.filter((g) => isFamily || g.ownerId === filterId),
      radar: blindSpots.filter((b) => isFamily || b.ownerId === filterId),
    };
  }, [filterId, tasks, recommendations, goals, blindSpots, activeUserId, members]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      {/* 1. Avatar Switcher Rail */}
      <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilterId('FAMILY')}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${filterId === 'FAMILY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
          >
            <Users size={24} />
            <span className="text-[8px] font-black uppercase tracking-widest">Collective</span>
          </button>
          <div className="w-px h-10 bg-slate-800" />
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {visibleMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setFilterId(member.id)}
                className={`group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${filterId === member.id ? 'bg-slate-800' : 'hover:bg-white/5'}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all ${filterId === member.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 bg-slate-900 text-slate-500'}`}
                >
                  {member.identify.name.charAt(0)}
                </div>
                <span
                  className={`text-[8px] font-black uppercase tracking-tighter ${filterId === member.id ? 'text-white' : 'text-slate-600'}`}
                >
                  {member.identify.name.split(' ')[0]}
                </span>
                {/* Vitality Indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onPlanDay}
          disabled={isPlanningDay}
          className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-600/30 flex items-center gap-2"
        >
          <Map size={14} className={isPlanningDay ? 'animate-spin' : ''} />
          {isPlanningDay ? 'Plotting Mission...' : 'Plan Day'}
        </button>
      </div>

      {/* Draft Strategies (Needs Review Flow) */}
      {filteredData.drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Draft Strategies / Neural Resolution Required
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredData.drafts.map((draft) => (
              <ReviewCard
                key={draft.id}
                recommendation={draft}
                profile={activeProfile}
                onFinalize={onFinalizeRecommendation}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recommendations & Intelligence */}
        <div className="lg:col-span-8 space-y-8">
          <RecommendationsWidget
            recommendations={filteredData.recs}
            isPlanning={isPlanningDay}
            onArm={onArmRecommendation}
            onDismiss={onDismissRecommendation}
          />

          <BentoCard
            title="Mission Tasks"
            icon={<TrendingUp size={18} className="text-indigo-400" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {filteredData.tasks.length > 0 ? (
                filteredData.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 ${task.completed ? 'bg-slate-950/40 opacity-40 grayscale' : 'bg-slate-900/60 border-white/5 hover:border-indigo-500/30'}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(task.category)}`}
                        >
                          {task.category}
                        </span>
                        {task.ownerId !== activeUserId && (
                          <Lock size={10} className="text-slate-600" />
                        )}
                      </div>
                      <h5 className="text-sm font-black text-white truncate">{task.title}</h5>
                      <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-1">
                        {task.methodology || task.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center opacity-30 italic text-sm">
                  No active mission tasks.
                </div>
              )}
            </div>
          </BentoCard>
        </div>

        {/* Right Column: Blindspots & Vitality */}
        <div className="lg:col-span-4 space-y-8">
          <BentoCard
            title="Blindspot Radar"
            icon={<ShieldAlert size={18} className="text-rose-500" />}
          >
            <div className="space-y-4 mt-4">
              {filteredData.radar.map((bs) => (
                <BlindSideRadarCard key={bs.id} {...bs} />
              ))}
              {filteredData.radar.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                  <ShieldCheck size={40} className="opacity-20 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Sky Clear
                  </span>
                </div>
              )}
            </div>
          </BentoCard>

          <BentoCard title="Vitality Score" icon={<Zap size={18} className="text-amber-500" />}>
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <RadialProgress value={78} size={140} strokeWidth={12} colorClass="text-indigo-500" />
              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">
                  78% Optimal
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Consistency Index High
                </p>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
};
