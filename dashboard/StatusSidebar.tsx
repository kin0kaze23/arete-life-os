import React from 'react';
import {
  Activity,
  AlertTriangle,
  Wallet,
  Zap,
  Heart,
  ShieldCheck,
  Brain,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { ProfileCompletionRing } from '@/shared';
import { FinanceMetrics, BlindSpot, UserProfile, Recommendation, Category } from '@/data';

interface StatusSidebarProps {
  profile: UserProfile;
  completion: number;
  blindSpots: BlindSpot[];
  financeMetrics?: FinanceMetrics;
  recommendations: Recommendation[];
  onNavigate: (tab: any) => void;
  onLog?: (input: string) => void;
  onActivate?: (rec: Recommendation) => void;
}

export const StatusSidebar: React.FC<StatusSidebarProps> = ({
  profile,
  completion,
  blindSpots,
  financeMetrics,
  recommendations,
  onNavigate,
  onLog,
  onActivate,
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const highRisks = blindSpots.filter((b) => b.severity === 'high');

  // Demo Data for Visualization if empty
  const demoRecs: Recommendation[] = [
    {
      id: 'demo-1',
      title: 'Optimize Deep Work Block',
      description: 'Your focus metrics show fragmentation in morning sessions.',
      rationale:
        'Cognitive load is highest between 9AM-11AM. Protecting this window yields 3x productivity.',
      category: Category.WORK,
      impactScore: 9,
      status: 'ACTIVE',
      steps: ['Enable "Monk Mode" at 9 AM', 'Decline all meetings until 11 AM'],
      ownerId: 'system',
      estimatedTime: '120m',
      inputs: [],
      definitionOfDone: 'Deep work block completed',
      risks: ['Meeting noise', 'Email distractions'],
      needsReview: false,
      missingFields: [],
      createdAt: Date.now(),
      evidenceLinks: { claims: [], sources: [] },
    },
    {
      id: 'demo-2',
      title: 'Hydration Interval',
      description: 'Bio-rhythm suggests energy dip in 20 mins.',
      rationale:
        'Dehydration acts as a lead indicator for fatigue. Pre-emptive intake prevents the crash.',
      category: Category.HEALTH,
      impactScore: 8,
      status: 'ACTIVE',
      steps: ['Drink 500ml water now', 'Step outside for 2 mins'],
      ownerId: 'system',
      estimatedTime: '5m',
      inputs: [],
      definitionOfDone: 'Water consumed',
      risks: ['No water access'],
      needsReview: false,
      missingFields: [],
      createdAt: Date.now(),
      evidenceLinks: { claims: [], sources: [] },
    },
  ];

  const displayRecs = recommendations.length > 0 ? recommendations : demoRecs;

  const getDimensionRecs = (cat: Category) =>
    displayRecs.filter((r) => r.category === cat && r.status === 'ACTIVE');

  const DimensionSection = ({
    label,
    icon,
    recs,
    metricValue,
    metricLabel,
    color,
  }: {
    label: string;
    icon: React.ReactNode;
    recs: Recommendation[];
    metricValue?: string;
    metricLabel?: string;
    color: string;
  }) => {
    const hasRecs = recs.length > 0;

    return (
      <div className="space-y-2">
        <div className={`flex items-center gap-2 ${color} opacity-80 pl-1`}>
          {icon}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        </div>

        <div className="space-y-2">
          {hasRecs ? (
            recs.map((rec) => {
              const isExpanded = expandedId === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  className={`group relative p-3 bg-slate-900/50 border rounded-xl transition-all cursor-pointer ${isExpanded ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 hover:border-indigo-500/30'}`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-white leading-snug mb-1">{rec.title}</h4>
                    {rec.impactScore > 7 && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-[9px] font-bold text-indigo-300">
                        HIGH
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {rec.description}
                  </p>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      {rec.rationale && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                            Rationale
                          </span>
                          <p className="text-[10px] text-slate-300 leading-relaxed italic">
                            "{rec.rationale}"
                          </p>
                        </div>
                      )}

                      {rec.steps && rec.steps.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                            Action Plan
                          </span>
                          <ul className="space-y-1">
                            {rec.steps.map((step, idx) => (
                              <li key={idx} className="flex gap-2 text-[10px] text-slate-300">
                                <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() => onActivate?.(rec)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold tracking-wide transition-colors flex items-center justify-center gap-2"
                      >
                        Execute Protocol <ArrowRight size={10} />
                      </button>
                    </div>
                  )}

                  {!isExpanded && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-medium text-indigo-400 flex items-center gap-1">
                        View Details
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Fallback Status Card
            <div className="p-3 bg-slate-900/20 border border-white/5 rounded-xl flex items-center justify-between opacity-60">
              <div>
                <div className="text-sm font-bold text-white">{metricValue || '--'}</div>
                <div className="text-[9px] text-slate-500">{metricLabel || 'Nominal'}</div>
              </div>
              <CheckCircle2 size={14} className="text-emerald-500/50" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Identity */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/5">
        <div className="relative group cursor-pointer" onClick={() => onNavigate('vault')}>
          <ProfileCompletionRing profile={profile} size={48} strokeWidth={3} showText={false} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-black text-white">{completion}%</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Life Status</h3>
          <p className="text-[10px] text-slate-500 font-medium">Insights & Signals</p>
        </div>
      </div>

      {/* Evening Audit Prompt (After 8PM) */}
      {(new Date().getHours() >= 20 || new Date().getHours() < 4) && (
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start gap-3 relative z-10">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/40 animate-pulse">
              <Zap size={16} className="text-white" fill="currentColor" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
                System Audit
              </h4>
              <p className="text-[10px] text-indigo-200 leading-relaxed mb-3">
                Daily cycle complete. Initiate closing protocol to consolidate memory and metrics.
              </p>
              <button
                onClick={() => onLog?.('/audit Closing the day.')}
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg text-left pl-3 flex items-center justify-between group/btn"
              >
                Initiate Protocol{' '}
                <div className="pr-3 group-hover/btn:translate-x-1 transition-transform">→</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Critical Risks (Pinned) */}
      {highRisks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-rose-500 pl-1">
            <AlertTriangle size={12} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Critical Alerts
            </span>
          </div>
          {highRisks.map((risk) => (
            <div key={risk.id} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <p className="text-xs font-bold text-rose-200 leading-snug">{risk.signal}</p>
            </div>
          ))}
        </div>
      )}

      {/* 3. Dimension Feeds */}
      <div className="space-y-6">
        <DimensionSection
          label="Finance"
          icon={<Wallet size={12} />}
          recs={getDimensionRecs(Category.FINANCE)}
          metricValue={financeMetrics ? `$${financeMetrics.dailyVariableBudget}` : undefined}
          metricLabel="Daily Available"
          color="text-amber-500"
        />

        <DimensionSection
          label="Health"
          icon={<Activity size={12} />}
          recs={getDimensionRecs(Category.HEALTH)}
          metricValue={profile.health.sleepTime}
          metricLabel="Sleep Schedule"
          color="text-emerald-500"
        />

        <DimensionSection
          label="Relationships"
          icon={<Heart size={12} />}
          recs={getDimensionRecs(Category.RELATIONSHIPS)}
          metricValue={profile.relationship.socialEnergy}
          metricLabel="Social Energy"
          color="text-cyan-500"
        />

        <DimensionSection
          label="Growth"
          icon={<Brain size={12} />}
          recs={getDimensionRecs(Category.PERSONAL)}
          metricValue={profile.personal.jobRole}
          metricLabel="Career Track"
          color="text-indigo-500"
        />

        <DimensionSection
          label="Spiritual"
          icon={<Zap size={12} />}
          recs={getDimensionRecs(Category.SPIRITUAL)}
          metricValue={profile.spiritual.practicePulse}
          metricLabel="Practice Pulse"
          color="text-violet-500"
        />
      </div>
    </div>
  );
};
