import React from 'react';
import { ArrowRight, Compass, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { StrategicBriefing } from '@/data';

interface StrategicBriefingCardProps {
  briefing: StrategicBriefing | null;
  missingProfileFields?: string[];
  isRefreshing?: boolean;
  onRefresh: () => void;
  onOpenAssistant: () => void;
  onOpenLife: () => void;
  onCapture: () => void;
}

export const StrategicBriefingCard: React.FC<StrategicBriefingCardProps> = ({
  briefing,
  missingProfileFields = [],
  isRefreshing = false,
  onRefresh,
  onOpenAssistant,
  onOpenLife,
  onCapture,
}) => {
  const opportunities = Array.isArray(briefing?.opportunities) ? briefing.opportunities : [];
  const risks = Array.isArray(briefing?.risks) ? briefing.risks : [];
  const actions = Array.isArray(briefing?.actions) ? briefing.actions : [];
  const sources = Array.isArray(briefing?.sources) ? briefing.sources : [];
  const sourceCount = sources.length;

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
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {briefing ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-[20px] border border-[#86a8ff]/20 bg-[#86a8ff]/[0.08] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200">
              Question
            </p>
            <p className="mt-2 text-[15px] leading-6 text-slate-100">{briefing.focusQuestion}</p>
          </div>

          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Read
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{briefing.summary}</p>
            <p className="mt-3 text-xs leading-5 text-slate-400">{briefing.profileSummary}</p>
          </div>

          <div className="grid gap-3">
            {opportunities.length > 0 && (
              <section className="rounded-[20px] border border-emerald-400/18 bg-emerald-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Sparkles size={13} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Openings</p>
                </div>
                <div className="mt-3 space-y-3">
                  {opportunities.slice(0, 2).map((item) => (
                    <article key={`${item.title}-${item.action}`} className="space-y-1">
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="text-xs leading-5 text-slate-300">{item.detail}</p>
                      <p className="text-xs text-emerald-200">Do: {item.action}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {risks.length > 0 && (
              <section className="rounded-[20px] border border-amber-300/20 bg-amber-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-amber-200">
                  <ShieldAlert size={13} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Risks</p>
                </div>
                <div className="mt-3 space-y-3">
                  {risks.slice(0, 2).map((item) => (
                    <article key={`${item.title}-${item.action}`} className="space-y-1">
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="text-xs leading-5 text-slate-300">{item.detail}</p>
                      <p className="text-xs text-amber-200">Do: {item.action}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <Compass size={13} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Next moves</p>
            </div>
            <ol className="mt-3 space-y-2">
              {actions.slice(0, 3).map((action, index) => (
                <li key={`${action}-${index}`} className="flex gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-slate-200">
                    {index + 1}
                  </span>
                  <span className="leading-6">{action}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenAssistant}
              className="inline-flex items-center gap-2 rounded-full bg-[#86a8ff] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#9ab7ff]"
            >
              Plan with Aura <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={onOpenLife}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Update life
            </button>
          </div>

          {sourceCount > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Sources
              </p>
              <div className="flex flex-wrap gap-2">
                {sources.slice(0, 3).map((source) => (
                  <a
                    key={source.uri}
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4 rounded-[20px] border border-dashed border-white/10 bg-black/20 p-4">
          <p className="text-sm leading-6 text-slate-300">
            The brief becomes sharper after a few real journal entries and one or two profile fields.
          </p>
          {missingProfileFields.length > 0 && (
            <p className="text-xs text-slate-400">
              Missing context: {missingProfileFields.slice(0, 3).join(', ').replaceAll('_', ' ')}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCapture}
              className="rounded-full bg-[#86a8ff] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#9ab7ff]"
            >
              Capture signal
            </button>
            <button
              type="button"
              onClick={onOpenLife}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Fill profile
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
