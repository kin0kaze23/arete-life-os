import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { BlindSpot, UserProfile, Recommendation, AlwaysChip } from '@/data';

interface StatusSidebarProps {
  profile: UserProfile;
  completion: number;
  blindSpots: BlindSpot[];
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
    title: 'Protect one deep-work block',
    description: 'Reserve 90 minutes today for the most important unfinished work.',
    rationale: 'A single protected block usually creates the clearest daily win.',
    category: 'WORK' as any,
    impactScore: 9,
    status: 'ACTIVE',
    steps: ['Block 90 minutes in your calendar', 'Silence notifications during the block'],
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
    title: 'Capture the biggest open loop',
    description: 'Log the one unresolved item that is taking the most mental space.',
    rationale: 'The dashboard becomes more useful when your biggest open loops are explicit.',
    category: 'PERSONAL' as any,
    impactScore: 7,
    status: 'ACTIVE',
    steps: ['Write the open loop', 'Add the next action'],
    ownerId: 'system',
    estimatedTime: '5m',
    inputs: [],
    definitionOfDone: 'Open loop captured',
    risks: ['Avoiding vague wording'],
    needsReview: false,
    missingFields: [],
    createdAt: Date.now(),
    evidenceLinks: { claims: [], sources: [] },
  },
];

export const StatusSidebar: React.FC<StatusSidebarProps> = ({
  blindSpots,
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

  const highRisks = blindSpots.filter((spot) => spot.severity === 'high').slice(0, 2);
  const displayRecommendations = recommendations
    .filter((rec) => rec.status === 'ACTIVE')
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 4);
  const recs = (displayRecommendations.length > 0 ? displayRecommendations : demoRecommendations).filter(
    (rec) => !dismissedIds[rec.id]
  );

  const isDemoRec = (rec: Recommendation) =>
    rec.ownerId === 'system' || String(rec.id || '').startsWith('demo-');
  const allowDemoFeedback = import.meta.env.VITE_E2E === '1';

  return (
    <div className="space-y-4">
      {(highRisks.length > 0 || alwaysWatchChips.length > 0 || alwaysDoChips.length > 0) && (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-slate-100">
            <ShieldAlert size={14} className="text-rose-300" />
            <p className="text-sm font-semibold">Keep in view</p>
          </div>
          <div className="mt-3 space-y-2">
            {highRisks.map((risk) => (
              <div key={risk.id} className="rounded-xl border border-rose-300/20 bg-rose-500/[0.08] px-3 py-2">
                <p className="text-xs text-rose-100">{risk.signal}</p>
              </div>
            ))}
            {alwaysWatchChips.slice(0, 3).map((chip) => (
              <div
                key={chip.id}
                className="rounded-xl border border-rose-300/20 bg-black/20 px-3 py-2 text-xs text-rose-100"
              >
                <span className="mr-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-200">
                  <AlertTriangle size={10} /> Watch
                </span>
                {chip.label}
              </div>
            ))}
            {alwaysDoChips.slice(0, 3).map((chip) => (
              <div
                key={chip.id}
                className="rounded-xl border border-indigo-300/20 bg-black/20 px-3 py-2 text-xs text-slate-200"
              >
                <span className="mr-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-200">
                  <CheckCircle2 size={10} /> Keep steady
                </span>
                {chip.label}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-100">Recommended next moves</p>
            <p className="mt-1 text-xs text-slate-400">
              Fewer suggestions, ranked by likely usefulness.
            </p>
          </div>
          <Zap size={14} className="text-blue-200" />
        </div>

        <div className="mt-3 space-y-2.5">
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
                    ? 'border-blue-300/35 bg-blue-500/12'
                    : 'border-white/10 bg-slate-950/35 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{rec.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{rec.description}</p>
                  </div>
                  <span className="rounded-md border border-blue-300/30 bg-blue-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-blue-200">
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
                        <p className="mt-1 text-xs leading-5 text-slate-300">{rec.rationale}</p>
                      </div>
                    )}

                    {Array.isArray(rec.steps) && rec.steps.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Next steps
                        </p>
                        <ul className="mt-1 space-y-1">
                          {rec.steps.slice(0, 3).map((step, idx) => (
                            <li key={`${rec.id}-step-${idx}`} className="text-xs text-slate-300">
                              {idx + 1}. {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onActivate?.(rec, (rec as any).metadata?.eventId);
                        }}
                        disabled={!onActivate}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-blue-400 disabled:opacity-40"
                      >
                        Activate <ArrowRight size={10} />
                      </button>

                      {(!isDemoRec(rec) || allowDemoFeedback) && onKeepRecommendation && rec.userFeedback !== 'kept' && (
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

                      {(!isDemoRec(rec) || allowDemoFeedback) && onRemoveRecommendation && rec.status !== 'DISMISSED' && (
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
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Ask Aura for a clearer recommendation
        </button>
      </section>
    </div>
  );
};
