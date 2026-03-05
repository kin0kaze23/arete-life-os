import React, { useMemo } from 'react';
import { Category, MemoryItem, Goal, Recommendation, UserProfile } from '@/data';
import { Activity, Wallet, Heart, Zap, User, ArrowLeft, TrendingUp, TrendingDown, Minus, Target, Clock, PiggyBank, Scale, Moon, Activity as ActivityIcon } from 'lucide-react';
import { computeScoreInternal, computeTrend, getScoreColor } from '@/dashboard/ScoreStrip';
import {
  calculateHealthMetrics,
  calculateFinanceMetrics,
  calculateRelationshipMetrics,
  calculateSpiritualMetrics,
  getBenchmarks,
} from './metricsCalculator';

interface DimensionConfig {
  category: Category;
  label: string;
  icon: React.ReactNode;
}

const DIMENSIONS: DimensionConfig[] = [
  { category: Category.HEALTH, label: 'Health', icon: <Activity size={14} /> },
  { category: Category.FINANCE, label: 'Finance', icon: <Wallet size={14} /> },
  { category: Category.RELATIONSHIPS, label: 'Social', icon: <Heart size={14} /> },
  { category: Category.SPIRITUAL, label: 'Spirit', icon: <Zap size={14} /> },
  { category: Category.PERSONAL, label: 'Personal', icon: <User size={14} /> },
];

interface DimensionCardProps {
  category: Category;
  label: string;
  icon: React.ReactNode;
  score: number;
  trend: 'up' | 'down' | 'stable';
  recommendations: Recommendation[];
  onLogSignal: (category: Category) => void;
}

const DimensionCard: React.FC<DimensionCardProps> = ({
  category,
  label,
  icon,
  score,
  trend,
  recommendations,
  onLogSignal,
}) => {
  const topRecommendation = recommendations.find(
    (r) => r.category === category && r.status === 'ACTIVE'
  );

  const getStatusLabel = () => {
    if (score >= 81) return 'Thriving';
    if (score >= 61) return 'Healthy';
    if (score >= 41) return 'At Risk';
    return 'Critical';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} className="text-emerald-400" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-rose-400" />;
    return <Minus size={14} className="text-slate-500" />;
  };

  return (
    <article className="rounded-[24px] border border-white/8 bg-white/[0.02] p-5 transition hover:border-white/12">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{label}</h3>
            <p className="text-xs text-slate-400">{getStatusLabel()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-2xl font-bold tabular-nums ${getScoreColor(score).split(' ')[0]}`}>
            {score > 0 ? score : '--'}
          </span>
        </div>
      </div>

      {score > 0 && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all ${getScoreColor(score).split(' ')[2].replace('border', 'bg').replace('/30', '')}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {topRecommendation && (
        <div className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Recommendation
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-100">{topRecommendation.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{topRecommendation.description}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => onLogSignal(category)}
        className="mt-4 w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
      >
        Log {label} signal
      </button>
    </article>
  );
};

interface LifeOverviewProps {
  memoryItems: MemoryItem[];
  goals: Goal[];
  recommendations: Recommendation[];
  onBack: () => void;
  onLogSignal: (category: Category) => void;
  profile?: UserProfile;
}

export const LifeOverview: React.FC<LifeOverviewProps> = ({
  memoryItems,
  goals,
  recommendations,
  onBack,
  onLogSignal,
  profile,
}) => {
  const scores = useMemo(() => {
    const result: Partial<Record<Category, number>> = {};
    DIMENSIONS.forEach((dim) => {
      result[dim.category] = computeScoreInternal(memoryItems, goals, dim.category, Date.now());
    });
    return result;
  }, [memoryItems, goals]);

  const trends = useMemo(() => {
    const result: Partial<Record<Category, 'up' | 'down' | 'stable'>> = {};
    DIMENSIONS.forEach((dim) => {
      result[dim.category] = computeTrend(memoryItems, goals, dim.category);
    });
    return result;
  }, [memoryItems, goals]);

  const healthMetrics = useMemo(() => profile ? calculateHealthMetrics(profile) : null, [profile]);
  const financeMetrics = useMemo(() => profile ? calculateFinanceMetrics(profile) : null, [profile]);
  const relationshipMetrics = useMemo(() => profile ? calculateRelationshipMetrics(profile) : null, [profile]);
  const spiritualMetrics = useMemo(() => profile ? calculateSpiritualMetrics(profile) : null, [profile]);
  const benchmarks = useMemo(() => profile ? getBenchmarks(profile) : [], [profile]);

  const overallScore = useMemo(() => {
    const validScores = Object.values(scores).filter((s): s is number => s !== undefined && s > 0);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  }, [scores]);

  const thrivingCount = Object.values(scores).filter((s) => s && s >= 81).length;
  const healthyCount = Object.values(scores).filter((s) => s && s >= 61 && s < 81).length;
  const atRiskCount = Object.values(scores).filter((s) => s && s >= 41 && s < 61).length;
  const criticalCount = Object.values(scores).filter((s) => s && s < 41).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Life Dimensions</h1>
            <p className="mt-1 text-sm text-slate-400">
              Track your progress across all life domains
            </p>
          </div>
        </div>

        {overallScore > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Overall wellbeing
            </p>
            <p className={`mt-1 text-3xl font-bold ${getScoreColor(overallScore).split(' ')[0]}`}>
              {overallScore}
            </p>
          </div>
        )}
      </header>

      {overallScore > 0 && (
        <section className="rounded-[24px] border border-white/8 bg-white/[0.02] p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
              <p className="text-2xl font-bold text-violet-300">{thrivingCount}</p>
              <p className="mt-1 text-xs text-violet-200">Thriving</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <p className="text-2xl font-bold text-emerald-300">{healthyCount}</p>
              <p className="mt-1 text-xs text-emerald-200">Healthy</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
              <p className="text-2xl font-bold text-amber-300">{atRiskCount}</p>
              <p className="mt-1 text-xs text-amber-200">At Risk</p>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
              <p className="text-2xl font-bold text-rose-300">{criticalCount}</p>
              <p className="mt-1 text-xs text-rose-200">Critical</p>
            </div>
          </div>
        </section>
      )}

      {/* Personal Metrics from Profile */}
      {(healthMetrics || financeMetrics) && (
        <section className="rounded-[24px] border border-white/8 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-slate-100">Your Personal Metrics</h2>
          <p className="mt-1 text-sm text-slate-400">
            Calculated from your profile data
          </p>
          
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {/* Health Metrics */}
            {healthMetrics && (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-rose-300">
                  <ActivityIcon size={16} />
                  <p className="text-sm font-semibold">Health</p>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">BMI</span>
                    <span className={`text-xs font-semibold ${healthMetrics.bmiColor}`}>
                      {healthMetrics.bmi ? `${healthMetrics.bmi.toFixed(1)} (${healthMetrics.bmiCategory})` : 'No data'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Sleep</span>
                    <span className={`text-xs font-semibold ${healthMetrics.sleepColor}`}>
                      {healthMetrics.sleepHours ? `${healthMetrics.sleepHours.toFixed(1)}h (${healthMetrics.sleepStatus})` : 'No data'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Activity</span>
                    <span className="text-xs font-semibold text-blue-300">
                      {healthMetrics.activityLevel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Finance Metrics */}
            {financeMetrics && (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <PiggyBank size={16} />
                  <p className="text-sm font-semibold">Finance</p>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Net Worth</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {financeMetrics.netWorthFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Savings Rate</span>
                    <span className={`text-xs font-semibold ${financeMetrics.savingsRateColor}`}>
                      {financeMetrics.savingsRateFormatted} ({financeMetrics.savingsRateStatus})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Emergency Fund</span>
                    <span className={`text-xs font-semibold ${financeMetrics.emergencyFundColor}`}>
                      {financeMetrics.emergencyFundMonths !== null ? `${financeMetrics.emergencyFundMonths.toFixed(1)} months` : 'No data'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Benchmarks */}
            {benchmarks.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-amber-300">
                  <Target size={16} />
                  <p className="text-sm font-semibold">Benchmarks</p>
                </div>
                <div className="mt-3 space-y-2">
                  {benchmarks.slice(0, 3).map((bench, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">{bench.label}</span>
                      <span className={`text-xs font-semibold ${
                        bench.status === 'above' ? 'text-emerald-400' : 
                        bench.status === 'below' ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {bench.userValue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {DIMENSIONS.map((dim) => (
          <DimensionCard
            key={dim.category}
            category={dim.category}
            label={dim.label}
            icon={dim.icon}
            score={scores[dim.category] || 0}
            trend={trends[dim.category] || 'stable'}
            recommendations={recommendations}
            onLogSignal={onLogSignal}
          />
        ))}
      </section>

      <section className="rounded-[24px] border border-white/8 bg-white/[0.02] p-6">
        <h2 className="text-lg font-semibold text-slate-100">How scores are calculated</h2>
        <p className="mt-2 text-sm text-slate-400">
          Each dimension score (0-100) is based on four factors:
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-slate-100">Quality (40 pts)</p>
            <p className="mt-1 text-xs text-slate-400">
              Sentiment of your entries. Positive logs boost your score, negatives reduce it.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-slate-100">Consistency (25 pts)</p>
            <p className="mt-1 text-xs text-slate-400">
              How regularly you log. Daily logging over 7 days maximizes this.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-slate-100">Engagement (15 pts)</p>
            <p className="mt-1 text-xs text-slate-400">
              Breadth of logging. 3+ quality logs per week scores highest.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-slate-100">Progress (20 pts)</p>
            <p className="mt-1 text-xs text-slate-400">
              Goal progress in this dimension. Active goals with progress score higher.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
