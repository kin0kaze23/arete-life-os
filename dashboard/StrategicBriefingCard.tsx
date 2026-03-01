import React, { useState } from 'react';
import { ArrowRight, Compass, RefreshCw, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { StrategicBriefing, Recommendation, Category } from '@/data';

interface StrategicBriefingCardProps {
  briefing: StrategicBriefing | null;
  recommendations?: Recommendation[];
  missingProfileFields?: string[];
  isRefreshing?: boolean;
  onRefresh: () => void;
  onOpenAssistant: () => void;
  onOpenLife: () => void;
  onCapture: () => void;
  onKeepRecommendation?: (id: string) => void;
  onRemoveRecommendation?: (id: string) => void;
}

export const StrategicBriefingCard: React.FC<StrategicBriefingCardProps> = ({
  briefing,
  recommendations = [],
  missingProfileFields = [],
  isRefreshing = false,
  onRefresh,
  onOpenAssistant,
  onOpenLife,
  onCapture,
  onKeepRecommendation,
  onRemoveRecommendation,
}) => {
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const [dismissedRecIds, setDismissedRecIds] = useState<Record<string, boolean>>({});
  const [keptRecIds, setKeptRecIds] = useState<Record<string, boolean>>({});

  const opportunities = Array.isArray(briefing?.opportunities) ? briefing.opportunities : [];
  const risks = Array.isArray(briefing?.risks) ? briefing.risks : [];
  const actions = Array.isArray(briefing?.actions) ? briefing.actions : [];
  const sources = Array.isArray(briefing?.sources) ? briefing.sources : [];
  const sourceCount = sources.length;

  const demoRecommendations: Recommendation[] =
    import.meta.env.VITE_E2E === '1'
      ? [
          {
            id: 'e2e-demo-rec-1',
            title: 'Protect one deep work block',
            description: 'Reserve one uninterrupted block for the most important open work.',
            rationale: 'A single protected block creates a cleaner daily win than scattered effort.',
            category: Category.WORK,
            impactScore: 8,
            status: 'ACTIVE',
            steps: ['Pick the key task', 'Block 90 minutes', 'Silence distractions'],
            ownerId: 'system',
            estimatedTime: '90m',
            inputs: [],
            definitionOfDone: 'The key block is complete.',
            risks: ['Context switching'],
            needsReview: false,
            missingFields: [],
            createdAt: Date.now(),
            evidenceLinks: { claims: [], sources: [] },
          },
        ]
      : [];

  const activeRecs = recommendations
    .filter((r) => r.status === 'ACTIVE' && !dismissedRecIds[r.id])
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 2);
  const displayRecs = activeRecs.length > 0 ? activeRecs : demoRecommendations;

  const renderRecommendations = () =>
    displayRecs.length > 0 ? (
      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Recommendations
        </p>
        <div className="space-y-2">
          {displayRecs.map((rec) => {
            const expanded = expandedRecId === rec.id;
            const isKept = keptRecIds[rec.id];
            const isDemo = rec.ownerId === 'system';

            return (
              <article
                key={rec.id}
                data-testid="rec-card"
                data-rec-id={rec.id}
                onClick={() => setExpandedRecId(expanded ? null : rec.id)}
                className={`cursor-pointer rounded-[18px] border p-3 transition ${
                  expanded
                    ? 'border-[#86a8ff]/30 bg-[#86a8ff]/[0.08]'
                    : 'border-white/8 bg-black/20 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{rec.title}</p>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-1">{rec.description}</p>
                  </div>
                  {isKept ? (
                    <div className="flex shrink-0 items-center text-emerald-400" title="Kept">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : (
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      {rec.impactScore}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  {!isKept && (
                    <button
                      type="button"
                      data-testid="rec-keep"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKeptRecIds((prev) => ({ ...prev, [rec.id]: true }));
                        if (!isDemo) onKeepRecommendation?.(rec.id);
                      }}
                      className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-400/20"
                    >
                      Keep
                    </button>
                  )}
                  {isKept && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 size={12} />
                      Kept
                    </span>
                  )}
                  <button
                    type="button"
                    data-testid="rec-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDismissedRecIds((prev) => ({ ...prev, [rec.id]: true }));
                      if (!isDemo) onRemoveRecommendation?.(rec.id);
                    }}
                    className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-400/20"
                  >
                    Remove
                  </button>
                </div>

                {expanded && (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Rationale
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">{rec.rationale}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <section className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,28,40,0.96),rgba(11,16,24,0.94))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Strategic brief
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-100">
            What to protect. What to pursue.
          </h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
          title="Refresh briefing"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {briefing ? (
        <div className="mt-5 space-y-5">
          <div className="rounded-[20px] border border-[#86a8ff]/20 bg-[#86a8ff]/[0.08] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200">
              Focus Question
            </p>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-100">{briefing.focusQuestion}</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Analysis
            </p>
            <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
              <p className="text-sm leading-relaxed text-slate-300">{briefing.summary}</p>
            </div>
          </div>

          <div className="grid gap-3">
            {opportunities.length > 0 && (
              <section className="rounded-[20px] border border-emerald-400/18 bg-emerald-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Sparkles size={13} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Opportunities</p>
                </div>
                <div className="mt-3 space-y-4">
                  {opportunities.slice(0, 1).map((item) => (
                    <article key={`${item.title}-${item.action}`} className="space-y-1">
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="text-xs leading-5 text-slate-300">{item.detail}</p>
                      <p className="text-[11px] font-medium text-emerald-300/90">Action: {item.action}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {risks.length > 0 && (
              <section className="rounded-[20px] border border-amber-300/20 bg-amber-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-amber-200">
                  <ShieldAlert size={13} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Risks to mitigate</p>
                </div>
                <div className="mt-3 space-y-4">
                  {risks.slice(0, 1).map((item) => (
                    <article key={`${item.title}-${item.action}`} className="space-y-1">
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="text-xs leading-5 text-slate-300">{item.detail}</p>
                      <p className="text-[11px] font-medium text-amber-300/90">Action: {item.action}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          {renderRecommendations()}

          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <Compass size={13} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Strategic Priorities</p>
            </div>
            <ol className="mt-3 space-y-3">
              {actions.slice(0, 3).map((action, index) => (
                <li key={`${action}-${index}`} className="flex gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-bold text-slate-400">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={onOpenAssistant}
              className="flex items-center justify-center gap-2 rounded-full bg-[#86a8ff] px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-[#9ab7ff] shadow-lg shadow-blue-500/10"
            >
              Ask Aura <ArrowRight size={16} />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenLife}
                className="rounded-full border border-white/10 bg-white/[0.03] py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Life
              </button>
              <button
                type="button"
                onClick={onCapture}
                className="rounded-full border border-white/10 bg-white/[0.03] py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Log Signal
              </button>
            </div>
          </div>

          {sourceCount > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Grounding Sources
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.slice(0, 3).map((source) => (
                  <a
                    key={source.uri}
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-slate-200"
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-4 rounded-[20px] border border-dashed border-white/10 bg-black/20 p-5">
          <p className="text-sm leading-relaxed text-slate-300">
            The brief becomes sharper after a few real journal entries and one or two profile fields.
          </p>
          {missingProfileFields.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Missing context: {missingProfileFields.slice(0, 3).join(', ').replaceAll('_', ' ')}
            </p>
          )}
          {renderRecommendations()}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={onCapture}
              className="rounded-full bg-[#86a8ff] px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-[#9ab7ff]"
            >
              Log First Signal
            </button>
            <button
              type="button"
              onClick={onOpenLife}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
