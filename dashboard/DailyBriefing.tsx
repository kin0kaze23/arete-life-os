import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MemoryEntry, Goal, TimelineEvent, BlindSpot, Recommendation, UserProfile } from '@/data';
import { computeScore, computeTrend, DIMENSIONS } from './ScoreStrip';
import { CheckCircle2, AlertCircle, ArrowRight, Zap, Trophy, ShieldAlert, User, Sparkles } from 'lucide-react';
import { getProfileCompletion } from '@/shared';

export interface DailyBriefingProps {
  memoryItems: MemoryEntry[];
  goals: Goal[];
  timelineEvents: TimelineEvent[];
  blindSpots: BlindSpot[];
  recommendations: Recommendation[];
  profile: UserProfile;
  onActivate?: (rec: Recommendation) => void;
}

function parseEstimatedMinutes(est: string): number {
  const match = est.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({
  memoryItems,
  goals,
  timelineEvents,
  blindSpots,
  recommendations,
  profile,
  onActivate,
}) => {
  const hasHistory = memoryItems.length > 0;

  // --- 1. Life Balance Strip Computation ---
  const balanceData = DIMENSIONS.map((dim) => {
    const score = computeScore(memoryItems, goals, dim.category);
    const trend = computeTrend(memoryItems, goals, dim.category);
    return { ...dim, score, trend };
  });

  // --- 2. Today's Focus Logic ---
  const focusItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      message: string;
      type: 'declining' | 'event' | 'goal' | 'risk';
      icon: React.ReactNode;
      urgent: boolean;
    }> = [];

    // Rule 1: Declining dimensions
    balanceData.forEach((dim) => {
      if (dim.trend === 'down') {
        items.push({
          id: `decline-${dim.category}`,
          title: dim.label,
          message: `Your ${dim.label} needs attention`,
          type: 'declining',
          icon: <AlertCircle size={16} className="text-amber-400" />,
          urgent: true,
        });
      }
    });

    // Rule 2: Unprepped events within 48h
    const now = Date.now();
    const twoDays = 48 * 60 * 60 * 1000;
    timelineEvents.forEach((evt) => {
      const evtTime = new Date(evt.date).getTime();
      const diff = evtTime - now;
      if (diff > 0 && diff < twoDays && evt.metadata?.prepStatus !== 'ready') {
        const hours = Math.round(diff / (60 * 60 * 1000));
        items.push({
          id: `evt-${evt.id}`,
          title: evt.title,
          message: `In ${hours} hours, no prep plan`,
          type: 'event',
          icon: <CheckCircle2 size={16} className="text-cyan-400" />,
          urgent: true,
        });
      }
    });

    // Rule 3: Overdue/Upcoming goals (within 7 days)
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    goals.forEach((g) => {
      if (g.status === 'active') {
        const targetTime = new Date(g.targetDate).getTime();
        const diff = targetTime - now;
        if (diff > 0 && diff < sevenDays) {
          items.push({
            id: `goal-${g.id}`,
            title: g.title,
            message: 'Deadline approaching',
            type: 'goal',
            icon: <Trophy size={16} className="text-violet-400" />,
            urgent: false,
          });
        }
      }
    });

    // Rule 4: High severity blind spots
    blindSpots.forEach((bs) => {
      if (bs.severity === 'high') {
        items.push({
          id: `bs-${bs.id}`,
          title: bs.signal,
          message: 'High risk detected',
          type: 'risk',
          icon: <ShieldAlert size={16} className="text-rose-400" />,
          urgent: true,
        });
      }
    });

    return items.slice(0, 3);
  }, [balanceData, timelineEvents, goals, blindSpots]);

  // --- 3. Quick Win Logic ---
  const quickWin = useMemo(() => {
    const candidates = recommendations.filter(
      (r) => r.status === 'ACTIVE' && parseEstimatedMinutes(r.estimatedTime) <= 30
    );
    // Sort by impact score descending
    candidates.sort((a, b) => b.impactScore - a.impactScore);
    return candidates[0];
  }, [recommendations]);

  // --- Render ---

  if (!hasHistory) {
    const completion = getProfileCompletion(profile);
    const firstName = profile.identify.name.split(' ')[0] || 'User';

    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={64} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-3">
          <div className="p-3 rounded-full bg-white/5 border border-white/10">
            <User size={24} className="text-indigo-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white text-balance">Welcome, {firstName}</h3>
            <p className="text-sm text-indigo-200/80 max-w-md mx-auto mt-1 text-pretty">
              Your profile is <span className="text-white font-bold">{Math.round(completion.overall)}% complete</span>.
              As you log your day, I'll tune my guidance to your {profile.personal.personalityType || 'personality'} style
              and {profile.health.chronotype || 'energy'} rhythms.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-white/40 bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Waiting for first log entry...
          </div>
        </div>
      </div>
    );
  }

  const missionLine =
    focusItems.length > 0
      ? focusItems[0].message
      : 'All systems nominal. Keep momentum with a quick win.';

  return (
    <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Today's Mission
          </p>
          <p className="text-sm text-slate-300">{missionLine}</p>
        </div>
        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-200">
          Premium Intelligence
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Focus */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-950 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-amber-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Today's Focus
            </span>
          </div>

          <div className="space-y-3">
            {focusItems.length > 0 ? (
              focusItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-200 group border border-white/0 hover:border-white/5"
                >
                  <div className="p-2 rounded-lg bg-white/5">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.message}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center gap-3 p-3 opacity-70">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="text-sm text-slate-400">
                  All systems nominal. You’re on track.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Win */}
        <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} className="text-indigo-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300/70">
              Quick Win
            </span>
          </div>

          {quickWin ? (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{quickWin.title}</h4>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{quickWin.description}</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Confidence</span>
                  <span className="font-mono">{quickWin.impactScore}/10</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-900/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${Math.min(100, quickWin.impactScore * 10)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-md">
                  {quickWin.estimatedTime}
                </span>
                <button
                  onClick={() => onActivate?.(quickWin)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-lg shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Do this now <ArrowRight size={10} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-2">
              No quick wins available right now. Keep pushing!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
