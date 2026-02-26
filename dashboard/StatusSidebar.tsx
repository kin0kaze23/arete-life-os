import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Wallet,
  Zap,
} from 'lucide-react';
import { ProfileCompletionRing } from '@/shared';
import {
  FinanceMetrics,
  BlindSpot,
  UserProfile,
  Recommendation,
  AlwaysChip,
} from '@/data';

interface StatusSidebarProps {
  profile: UserProfile;
  completion: number;
  blindSpots: BlindSpot[];
  financeMetrics?: FinanceMetrics;
  recommendations: Recommendation[];
  onNavigate: (tab: any) => void;
  onActivate?: (rec: Recommendation, eventId?: string) => void;
  onKeepRecommendation?: (id: string) => void;
  onRemoveRecommendation?: (id: string) => void;
  alwaysDoChips?: AlwaysChip[];
  alwaysWatchChips?: AlwaysChip[];
}

const demoRecommendations: Recommendation[] = [
  {
    id: 'demo-1',
    title: 'Protect Deep Work Window',
    description: 'Reserve an uninterrupted block for your most important work.',
    rationale: 'Your current pattern shows context switching in the morning focus period.',
    category: 'WORK' as any,
    impactScore: 9,
    status: 'ACTIVE',
    steps: ['Block 90 minutes in calendar', 'Silence notifications during the block'],
    ownerId: 'system',
    estimatedTime: '90m',
    inputs: [],
    definitionOfDone: 'Deep work block completed',
    risks: ['Meeting interruptions'],
    needsReview: false,
    missingFields: [],
    createdAt: Date.now(),
    evidenceLinks: { claims: [], sources: [] },
  },
  {
    id: 'demo-2',
    title: 'Stabilize Energy Recovery',
    description: 'Add one midday reset to prevent late-day burnout.',
    rationale: 'Energy dips are concentrated after long uninterrupted screen sessions.',
    category: 'HEALTH' as any,
    impactScore: 8,
    status: 'ACTIVE',
    steps: ['Take a 10-minute walk', 'Drink 400ml water before next focus session'],
    ownerId: 'system',
    estimatedTime: '10m',
    inputs: [],
    definitionOfDone: 'Reset completed',
    risks: ['Back-to-back calls'],
    needsReview: false,
    missingFields: [],
    createdAt: Date.now(),
    evidenceLinks: { claims: [], sources: [] },
  },
];

export const StatusSidebar: React.FC<StatusSidebarProps> = ({
  profile,
  completion,
  blindSpots,
  financeMetrics,
  recommendations,
  onNavigate,
  onActivate,
  onKeepRecommendation,
  onRemoveRecommendation,
  alwaysDoChips = [],
  alwaysWatchChips = [],
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = React.useState<Record<string, boolean>>({});
  const highRisks = blindSpots.filter((spot) => spot.severity === 'high').slice(0, 3);
  const displayRecommendations =
    recommendations.filter((rec) => rec.status === 'ACTIVE').sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 6);
  const recs = (displayRecommendations.length > 0 ? displayRecommendations : demoRecommendations).filter(
    (rec) => !dismissedIds[rec.id]
  );

  const isDemoRec = (rec: Recommendation) =>
    rec.ownerId === 'system' || String(rec.id || '').startsWith('demo-');
  const allowDemoFeedback = import.meta.env.VITE_E2E === '1';

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Strategic Status
            </p>
            <p className="text-sm font-semibold text-slate-100">Life Signal Overview</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('vault')}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-1 transition hover:border-white/20"
          >
            <ProfileCompletionRing profile={profile} size={42} strokeWidth={3} showText={false} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <MetricItem label="Completion" value={`${completion}%`} />
          <MetricItem label="High Risks" value={String(highRisks.length)} tone="text-rose-200" />
          <MetricItem label="Active Recs" value={String(recs.length)} />
          <MetricItem
            label="Daily Budget"
            value={financeMetrics ? `$${financeMetrics.dailyVariableBudget}` : '--'}
            icon={<Wallet size={11} className="text-amber-300" />}
          />
        </div>
      </section>

      {highRisks.length > 0 && (
        <section className="rounded-2xl border border-rose-300/25 bg-rose-500/[0.08] p-4">
          <div className="mb-2 flex items-center gap-2 text-rose-200">
            <ShieldAlert size={14} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Critical Alerts</p>
          </div>
          <div className="space-y-2">
            {highRisks.map((risk) => (
              <div key={risk.id} className="rounded-xl border border-rose-300/20 bg-black/20 px-3 py-2">
                <p className="text-xs text-rose-100">{risk.signal}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(alwaysDoChips.length > 0 || alwaysWatchChips.length > 0) && (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Guardrails
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {alwaysWatchChips.slice(0, 4).map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1 rounded-md border border-rose-300/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-200"
                title={chip.rationale}
              >
                <AlertTriangle size={10} /> {chip.label}
              </span>
            ))}
            {alwaysDoChips.slice(0, 4).map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1 rounded-md border border-indigo-300/30 bg-indigo-500/12 px-2 py-1 text-[10px] font-semibold text-indigo-200"
                title={chip.rationale}
              >
                <CheckCircle2 size={10} /> {chip.label}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Recommended Next Moves
          </p>
          <Zap size={12} className="text-indigo-200" />
        </div>

        <div className="space-y-2.5">
          {recs.map((rec) => {
            const expanded = expandedId === rec.id;
            return (
              <article
                key={rec.id}
                data-testid="rec-card"
                data-rec-id={rec.id}
                onClick={() => setExpandedId(expanded ? null : rec.id)}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  expanded
                    ? 'border-indigo-300/35 bg-indigo-500/12'
                    : 'border-white/10 bg-slate-950/35 hover:border-white/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{rec.title}</p>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{rec.description}</p>
                  </div>
                  <span className="rounded-md border border-indigo-300/30 bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-200">
                    {Math.max(0, Math.round(rec.impactScore || 0))}
                  </span>
                </div>

                {expanded && (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    {rec.rationale && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Rationale
                        </p>
                        <p className="mt-1 text-xs text-slate-300">{rec.rationale}</p>
                      </div>
                    )}

                    {Array.isArray(rec.steps) && rec.steps.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Action Plan
                        </p>
                        <ul className="mt-1 space-y-1">
                          {rec.steps.slice(0, 4).map((step, idx) => (
                            <li key={`${rec.id}-step-${idx}`} className="text-xs text-slate-300">
                              {idx + 1}. {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(!isDemoRec(rec) || allowDemoFeedback) &&
                      (onKeepRecommendation || onRemoveRecommendation) && (
                        <div className="flex items-center gap-2">
                          {onKeepRecommendation && rec.userFeedback !== 'kept' && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onKeepRecommendation(rec.id);
                              }}
                              data-testid="rec-keep"
                              className="rounded-lg border border-emerald-300/30 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-semibold text-emerald-200"
                            >
                              Keep
                            </button>
                          )}
                          {onRemoveRecommendation && rec.status !== 'DISMISSED' && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDismissedIds((prev) => ({ ...prev, [rec.id]: true }));
                                onRemoveRecommendation(rec.id);
                              }}
                              data-testid="rec-remove"
                              className="rounded-lg border border-rose-300/30 bg-rose-500/12 px-2.5 py-1 text-[10px] font-semibold text-rose-200"
                            >
                              Remove
                            </button>
                          )}
                          {rec.userFeedback === 'kept' && (
                            <span className="text-[10px] font-semibold text-emerald-300">Kept</span>
                          )}
                          {rec.status === 'DISMISSED' && (
                            <span className="text-[10px] font-semibold text-rose-300">Removed</span>
                          )}
                        </div>
                      )}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onActivate?.(rec, (rec as any).metadata?.eventId);
                      }}
                      disabled={!onActivate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black disabled:opacity-40"
                    >
                      Execute <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const MetricItem: React.FC<{
  label: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}> = ({ label, value, tone, icon }) => (
  <div className="rounded-lg border border-white/10 bg-slate-950/35 px-2.5 py-2">
    <div className="flex items-center justify-between gap-1">
      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {icon}
    </div>
    <p className={`mt-1 text-sm font-semibold ${tone || 'text-slate-100'}`}>{value}</p>
  </div>
);
