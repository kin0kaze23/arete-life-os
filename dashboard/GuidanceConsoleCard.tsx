import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  BlindSpot,
  GuidanceDigest,
  GuidanceQuestion,
  Recommendation,
  StrategicBriefing,
} from '@/data';

interface GuidanceConsoleCardProps {
  digest: GuidanceDigest | null;
  recommendations?: Recommendation[];
  guidanceQuestions?: GuidanceQuestion[];
  strategicBriefing?: StrategicBriefing | null;
  missingProfileFields?: string[];
  isRefreshing?: boolean;
  onRefresh: () => void;
  onOpenAssistant: () => void;
  onOpenLife: () => void;
  onCapture: () => void;
  onKeepRecommendation?: (id: string) => void;
  onRemoveRecommendation?: (id: string) => void;
  onAnswerQuestion?: (id: string, answer: string) => void;
  onDismissQuestion?: (id: string) => void;
  onSnoozeQuestion?: (id: string, hours?: number) => void;
}

export const GuidanceConsoleCard: React.FC<GuidanceConsoleCardProps> = ({
  digest,
  recommendations = [],
  guidanceQuestions = [],
  strategicBriefing,
  missingProfileFields = [],
  isRefreshing = false,
  onRefresh,
  onOpenAssistant,
  onOpenLife,
  onCapture,
  onKeepRecommendation,
  onRemoveRecommendation,
  onAnswerQuestion,
  onDismissQuestion,
  onSnoozeQuestion,
}) => {
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const [dismissedRecIds, setDismissedRecIds] = useState<Record<string, boolean>>({});
  const [keptRecIds, setKeptRecIds] = useState<Record<string, boolean>>({});
  const [answerDraft, setAnswerDraft] = useState('');
  const [horizon, setHorizon] = useState<'now' | 'soon' | 'always'>('now');

  const activeQuestion = useMemo(
    () =>
      digest?.question && digest.question.status === 'open'
        ? digest.question
        : guidanceQuestions.find(
            (question) =>
              question.status === 'open' &&
              (!question.snoozedUntil || question.snoozedUntil < Date.now())
          ) || null,
    [digest?.question, guidanceQuestions]
  );

  const activeDoItems = useMemo(() => {
    const digestItems = (digest?.doItems || []).filter(
      (item) => (item.horizon || 'now') === horizon && !dismissedRecIds[item.id]
    );
    const fallback = recommendations.filter(
      (item) =>
        item.status === 'ACTIVE' &&
        (item.horizon || 'now') === horizon &&
        !dismissedRecIds[item.id]
    );
    return (digestItems.length > 0 ? digestItems : fallback).slice(0, 3);
  }, [digest?.doItems, recommendations, horizon, dismissedRecIds]);

  const activeWatchItems = useMemo(
    () => (digest?.watchItems || []).filter((item) => (item.horizon || 'now') === horizon).slice(0, 3),
    [digest?.watchItems, horizon]
  );

  const renderRecommendationCard = (rec: Recommendation) => {
    const expanded = expandedRecId === rec.id;
    const isKept = Boolean(keptRecIds[rec.id] || rec.userFeedback === 'kept');
    const isDemo = rec.ownerId === 'system';
    const steps = Array.isArray(rec.steps) ? rec.steps : [];
    return (
      <article
        key={rec.id}
        data-testid="rec-card"
        data-rec-id={rec.id}
        onClick={() => setExpandedRecId(expanded ? null : rec.id)}
        className={`cursor-pointer rounded-[18px] border p-3 transition ${
          expanded ? 'border-[#86a8ff]/30 bg-[#86a8ff]/[0.08]' : 'border-white/8 bg-black/20 hover:border-white/15'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100">{rec.title}</p>
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">{rec.description}</p>
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

        <div className="mt-3 flex flex-wrap gap-2">
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
            {steps.length > 0 && (
              <ol className="space-y-1.5">
                {steps.slice(0, 3).map((step, index) => (
                  <li key={`${rec.id}-step-${index}`} className="text-xs leading-5 text-slate-400">
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </article>
    );
  };

  const renderWatchCard = (item: BlindSpot) => (
    <article
      key={item.id}
      className="rounded-[18px] border border-amber-300/18 bg-amber-500/[0.06] p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">{item.signal}</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{item.why}</p>
        </div>
        <span className="rounded-full border border-amber-300/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-200">
          {item.severity}
        </span>
      </div>
      {item.nextPreventionStep && (
        <p className="mt-3 text-[11px] font-medium text-amber-100/85">
          Next: {item.nextPreventionStep}
        </p>
      )}
    </article>
  );

  const briefingRisks = Array.isArray(strategicBriefing?.risks) ? strategicBriefing.risks : [];

  return (
    <section className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,28,40,0.96),rgba(11,16,24,0.94))] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            Guidance
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-100">
            Do. Watch. Clarify.
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {digest?.summary || 'The system will sharpen after a few more real signals.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05]"
          title="Refresh guidance"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/20 p-1">
        {(['now', 'soon', 'always'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setHorizon(item)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
              horizon === item ? 'bg-[#86a8ff] text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {activeQuestion && (
        <section className="mt-5 rounded-[20px] border border-[#86a8ff]/20 bg-[#86a8ff]/[0.08] p-4">
          <div className="flex items-center gap-2 text-blue-200">
            <Compass size={13} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Ask</p>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-100">{activeQuestion.prompt}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{activeQuestion.reason}</p>
          <div className="mt-3 flex gap-2">
            <input
              value={answerDraft}
              onChange={(event) => setAnswerDraft(event.target.value)}
              placeholder="Answer here..."
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#86a8ff]"
            />
            <button
              type="button"
              onClick={() => {
                if (!answerDraft.trim()) return;
                onAnswerQuestion?.(activeQuestion.id, answerDraft);
                setAnswerDraft('');
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#86a8ff] px-4 py-2 text-sm font-semibold text-slate-950"
            >
              <Send size={14} />
              Answer
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onSnoozeQuestion?.(activeQuestion.id, 24)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-300"
            >
              Snooze
            </button>
            <button
              type="button"
              onClick={() => onDismissQuestion?.(activeQuestion.id)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-300"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      <div className="mt-5 space-y-5">
        <section>
          <div className="flex items-center gap-2 text-slate-200">
            <Sparkles size={13} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Do</p>
          </div>
          <div className="mt-3 space-y-2">
            {activeDoItems.length > 0 ? (
              activeDoItems.map((item) => renderRecommendationCard(item))
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/10 bg-black/20 px-3 py-4 text-xs text-slate-500">
                No strong actions yet. Capture a few more signals or refresh guidance.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-slate-200">
            <AlertTriangle size={13} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Watch</p>
          </div>
          <div className="mt-3 space-y-2">
            {activeWatchItems.length > 0 ? (
              activeWatchItems.map((item) => renderWatchCard(item))
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/10 bg-black/20 px-3 py-4 text-xs text-slate-500">
                No major watch-outs right now.
              </div>
            )}
          </div>
        </section>

        {strategicBriefing && (
          <details className="rounded-[20px] border border-white/8 bg-black/20 p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">
              View full brief
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-6 text-slate-300">{strategicBriefing.summary}</p>
              {briefingRisks.length > 0 && (
                <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Full brief watch
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {briefingRisks[0].title}: {briefingRisks[0].detail}
                  </p>
                </div>
              )}
            </div>
          </details>
        )}

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
              Log signal
            </button>
          </div>
          {missingProfileFields.length > 0 && (
            <div className="rounded-[18px] border border-white/8 bg-black/20 p-3 text-[11px] text-slate-400">
              Missing context: {missingProfileFields.slice(0, 3).join(', ').replaceAll('_', ' ')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
