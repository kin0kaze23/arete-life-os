import React, { useEffect, useMemo, useState } from 'react';
import type { MemoryEntry, UserProfile } from '@/data';

type ReportType = 'health' | 'financial' | 'faith' | 'habits';

type ReportCacheRecord = {
  generatedAt: number;
  data: any;
};

type ReportsCache = Partial<Record<ReportType, ReportCacheRecord>>;

const CACHE_KEY = 'arete_reports_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const endpointByType: Record<ReportType, string> = {
  health: '/api/reports/health',
  financial: '/api/reports/financial',
  faith: '/api/reports/faith',
  habits: '/api/reports/habits',
};

const labels: Record<ReportType, string> = {
  health: 'Health',
  financial: 'Financial',
  faith: 'Faith',
  habits: 'Habits',
};

interface ReportsSectionProps {
  memory: MemoryEntry[];
  profile: UserProfile;
}

const safeJsonParse = (value: string | null): ReportsCache => {
  if (!value) return {};
  try {
    return JSON.parse(value) as ReportsCache;
  } catch {
    return {};
  }
};

export const ReportsSection: React.FC<ReportsSectionProps> = ({ memory, profile }) => {
  const [cache, setCache] = useState<ReportsCache>({});
  const [expanded, setExpanded] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState<ReportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = safeJsonParse(localStorage.getItem(CACHE_KEY));
    setCache(next);
  }, []);

  const persistCache = (next: ReportsCache) => {
    setCache(next);
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  };

  const generateReport = async (type: ReportType, force = false) => {
    setError(null);
    const existing = cache[type];
    if (!force && existing && Date.now() - existing.generatedAt < CACHE_TTL_MS) {
      setExpanded(type);
      return;
    }

    setLoading(type);
    try {
      const bodyByType: Record<ReportType, any> = {
        health: {
          memories: memory.filter((m) => String(m.category).toLowerCase() === 'health'),
          profile,
          period: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
        },
        financial: {
          memories: memory.filter((m) => String(m.category).toLowerCase() === 'finance'),
          profile,
          period: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
        },
        faith: {
          memories: memory.filter((m) => String(m.category).toLowerCase() === 'spiritual'),
          profile,
          relationships: profile.innerCircle,
        },
        habits: {
          memories: memory,
          profile,
          period_days: 30,
        },
      };

      const response = await fetch(endpointByType[type], {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(bodyByType[type]),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to generate report');

      const next: ReportsCache = {
        ...cache,
        [type]: { generatedAt: Date.now(), data: payload },
      };
      persistCache(next);
      setExpanded(type);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  const cards = useMemo(() => {
    return (Object.keys(labels) as ReportType[]).map((type) => {
      const record = cache[type];
      const generatedAt = record?.generatedAt ? new Date(record.generatedAt) : null;
      const ageLabel = generatedAt
        ? `${Math.max(1, Math.round((Date.now() - generatedAt.getTime()) / (24 * 60 * 60 * 1000)))}d ago`
        : 'Never';
      return { type, label: labels[type], record, ageLabel };
    });
  }, [cache]);

  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5 space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Reports</p>
        <p className="text-sm text-slate-300">Generate health, financial, faith, and habits reports.</p>
      </div>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.type} className="rounded-xl border border-white/10 bg-black/20 p-4 flex min-h-[188px] flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">{card.label}</p>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.14em]">{card.ageLabel}</span>
            </div>

            <p className="mt-2 min-h-[34px] text-xs text-slate-400 line-clamp-2">
              {card.record?.data?.summary || card.record?.data?.personalFaithState || 'No report generated yet.'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => generateReport(card.type)}
                disabled={loading === card.type}
                className="rounded-lg border border-indigo-500/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-300 disabled:opacity-60"
              >
                {loading === card.type ? 'Generating...' : 'Open'}
              </button>
              <button
                type="button"
                onClick={() => generateReport(card.type, true)}
                disabled={loading === card.type}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200 disabled:opacity-60"
              >
                Regenerate
              </button>
            </div>

            {expanded === card.type && card.record?.data && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-black/45 p-3 text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(card.record.data, null, 2)}
              </pre>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
