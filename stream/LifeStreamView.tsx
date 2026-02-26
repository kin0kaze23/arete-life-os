import React, { useEffect, useMemo, useState } from 'react';
import {
  Category,
  MemoryEntry,
  Recommendation,
  TimelineEvent,
  UserProfile,
} from '@/data';
import { EmptyState, getCategoryIcon } from '@/shared';
import { CalendarClock, Search, Sparkles } from 'lucide-react';

interface LifeStreamViewProps {
  memory: MemoryEntry[];
  profile: UserProfile;
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (e: TimelineEvent) => void;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  activatePrepPlan: (plan: Recommendation) => void;
  onDeleteFacts: (items: Array<{ memoryId: string; factText: string }>) => void;
}

type SourceFilter = 'all' | 'memory' | 'telegram' | 'event';
type CategoryFilter = Category | 'ALL';

interface JournalLog {
  id: string;
  timestamp: number;
  category: Category;
  source: 'memory' | 'telegram' | 'event';
  title: string;
  body: string;
  confidence: number | null;
  facts: string[];
}

const ALL_CATEGORY_FILTER: CategoryFilter = 'ALL';
const CATEGORY_ORDER: Category[] = [
  Category.HEALTH,
  Category.FINANCE,
  Category.RELATIONSHIPS,
  Category.SPIRITUAL,
  Category.PERSONAL,
  Category.WORK,
  Category.SOCIAL,
  Category.MEALS,
  Category.TRAVEL,
  Category.HABIT,
  Category.GENERAL,
];

const categoryTone = (category: Category) => {
  switch (category) {
    case Category.HEALTH:
      return {
        pill: 'text-emerald-200 border-emerald-300/30 bg-emerald-500/14',
        node: 'border-emerald-300/40 bg-emerald-500/16 text-emerald-100',
      };
    case Category.FINANCE:
      return {
        pill: 'text-amber-200 border-amber-300/30 bg-amber-500/14',
        node: 'border-amber-300/40 bg-amber-500/16 text-amber-100',
      };
    case Category.RELATIONSHIPS:
      return {
        pill: 'text-cyan-200 border-cyan-300/30 bg-cyan-500/14',
        node: 'border-cyan-300/40 bg-cyan-500/16 text-cyan-100',
      };
    case Category.SPIRITUAL:
      return {
        pill: 'text-indigo-200 border-indigo-300/30 bg-indigo-500/14',
        node: 'border-indigo-300/40 bg-indigo-500/16 text-indigo-100',
      };
    case Category.WORK:
      return {
        pill: 'text-sky-200 border-sky-300/30 bg-sky-500/14',
        node: 'border-sky-300/40 bg-sky-500/16 text-sky-100',
      };
    case Category.SOCIAL:
      return {
        pill: 'text-teal-200 border-teal-300/30 bg-teal-500/14',
        node: 'border-teal-300/40 bg-teal-500/16 text-teal-100',
      };
    case Category.PERSONAL:
      return {
        pill: 'text-fuchsia-200 border-fuchsia-300/30 bg-fuchsia-500/14',
        node: 'border-fuchsia-300/40 bg-fuchsia-500/16 text-fuchsia-100',
      };
    case Category.MEALS:
      return {
        pill: 'text-orange-200 border-orange-300/30 bg-orange-500/14',
        node: 'border-orange-300/40 bg-orange-500/16 text-orange-100',
      };
    case Category.TRAVEL:
      return {
        pill: 'text-blue-200 border-blue-300/30 bg-blue-500/14',
        node: 'border-blue-300/40 bg-blue-500/16 text-blue-100',
      };
    case Category.HABIT:
      return {
        pill: 'text-lime-200 border-lime-300/30 bg-lime-500/14',
        node: 'border-lime-300/40 bg-lime-500/16 text-lime-100',
      };
    default:
      return {
        pill: 'text-slate-200 border-slate-300/30 bg-slate-500/14',
        node: 'border-slate-300/40 bg-slate-500/16 text-slate-100',
      };
  }
};

const sourceTone = (source: JournalLog['source']) => {
  if (source === 'telegram') return 'text-sky-200 border-sky-300/30 bg-sky-500/14';
  if (source === 'event') return 'text-indigo-200 border-indigo-300/30 bg-indigo-500/14';
  return 'text-slate-200 border-slate-300/30 bg-slate-500/14';
};

const toConfidencePercent = (value: unknown): number | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  if (value <= 1) return Math.round(Math.max(0, Math.min(1, value)) * 100);
  return Math.round(Math.max(0, Math.min(100, value)));
};

const formatLogTime = (timestamp: number) =>
  new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getOrbitPosition = (index: number, total: number) => {
  if (total <= 0) return { x: 50, y: 50 };
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = total <= 4 ? 32 : 38;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
};

export const LifeStreamView: React.FC<LifeStreamViewProps> = (props) => {
  const { memory, profile, timelineEvents } = props;
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(ALL_CATEGORY_FILTER);
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const allLogs = useMemo<JournalLog[]>(() => {
    const logs: JournalLog[] = [];

    memory.forEach((item) => {
      const metaSource = typeof item.metadata?.source === 'string' ? item.metadata.source : '';
      const source: JournalLog['source'] = metaSource === 'telegram' ? 'telegram' : 'memory';
      const facts = Array.isArray(item.extractedFacts)
        ? item.extractedFacts.map((fact) => String(fact.fact)).filter(Boolean)
        : [];
      logs.push({
        id: item.id,
        timestamp: item.timestamp,
        category: item.category || Category.GENERAL,
        source,
        title: item.content || 'Journal log',
        body: item.content || '',
        confidence: toConfidencePercent(item.extractionConfidence),
        facts,
      });
    });

    timelineEvents.forEach((event) => {
      const ts = Number.isFinite(new Date(event.date).getTime())
        ? new Date(event.date).getTime()
        : event.createdAt || Date.now();
      logs.push({
        id: event.id,
        timestamp: ts,
        category: event.category || Category.GENERAL,
        source: 'event',
        title: event.title || 'Timeline event',
        body: event.description || '',
        confidence: null,
        facts: [],
      });
    });

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [memory, timelineEvents]);

  const querySourceLogs = useMemo(() => {
    const queryValue = query.trim().toLowerCase();
    return allLogs.filter((log) => {
      if (selectedSource !== 'all' && log.source !== selectedSource) return false;
      if (!queryValue) return true;
      const searchable = `${log.title}\n${log.body}\n${log.facts.join('\n')}`.toLowerCase();
      return searchable.includes(queryValue);
    });
  }, [allLogs, query, selectedSource]);

  const filteredLogs = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY_FILTER) return querySourceLogs;
    return querySourceLogs.filter((log) => log.category === selectedCategory);
  }, [querySourceLogs, selectedCategory]);

  const categoryStats = useMemo(() => {
    const stats = new Map<Category, { count: number; latestTimestamp: number }>();
    querySourceLogs.forEach((log) => {
      const current = stats.get(log.category) || { count: 0, latestTimestamp: 0 };
      stats.set(log.category, {
        count: current.count + 1,
        latestTimestamp: Math.max(current.latestTimestamp, log.timestamp),
      });
    });
    return stats;
  }, [querySourceLogs]);

  const mapCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((category) => (categoryStats.get(category)?.count || 0) > 0);
  }, [categoryStats]);

  const groupedByCategory = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      logs: filteredLogs.filter((log) => log.category === category),
    })).filter((group) => group.logs.length > 0);
  }, [filteredLogs]);

  useEffect(() => {
    if (filteredLogs.length === 0) {
      setSelectedLogId(null);
      return;
    }
    if (!selectedLogId || !filteredLogs.some((log) => log.id === selectedLogId)) {
      setSelectedLogId(filteredLogs[0].id);
    }
  }, [filteredLogs, selectedLogId]);

  const selectedLog = filteredLogs.find((log) => log.id === selectedLogId) || null;
  const selectedIndex = selectedLog
    ? filteredLogs.findIndex((log) => log.id === selectedLog.id)
    : -1;

  const totalConfidenceLogs = filteredLogs.filter((log) => log.confidence !== null);
  const averageConfidence = totalConfidenceLogs.length
    ? Math.round(
        totalConfidenceLogs.reduce((sum, log) => sum + Number(log.confidence || 0), 0) /
          totalConfidenceLogs.length
      )
    : 0;
  const telegramCount = filteredLogs.filter((log) => log.source === 'telegram').length;

  if (allLogs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-32">
        <EmptyState
          icon={<CalendarClock />}
          title="Neural Journal Is Empty"
          description="Start logging from Dashboard or Telegram and this map will organize your life signals automatically."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1460px] space-y-6 pb-32">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(165deg,rgba(17,24,39,0.9),rgba(8,12,24,0.9))] p-6 xl:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200">
              Journal Intelligence
            </p>
            <h3 className="mt-1 text-3xl font-semibold tracking-tight text-slate-100 xl:text-[2.1rem]">
              Neural Mind Map
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Visualize all logs by category and inspect each entry with source confidence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <MetricCard label="Visible Logs" value={String(filteredLogs.length)} />
            <MetricCard label="Categories" value={String(groupedByCategory.length)} />
            <MetricCard label="Telegram" value={String(telegramCount)} />
            <MetricCard label="Avg Confidence" value={`${averageConfidence}%`} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search logs, facts, events..."
              className="w-full rounded-xl border border-white/15 bg-black/25 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-300/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'memory', 'telegram', 'event'] as SourceFilter[]).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setSelectedSource(source)}
                className={`rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                  selectedSource === source
                    ? 'border-blue-300/40 bg-blue-500/18 text-blue-100'
                    : 'border-white/15 bg-black/20 text-slate-300 hover:border-white/30'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(ALL_CATEGORY_FILTER)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
              selectedCategory === ALL_CATEGORY_FILTER
                ? 'border-white/50 bg-white/15 text-slate-100'
                : 'border-white/20 bg-black/20 text-slate-300 hover:border-white/35'
            }`}
          >
            All
          </button>
          {mapCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                setSelectedCategory((prev) => (prev === category ? ALL_CATEGORY_FILTER : category))
              }
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                selectedCategory === category
                  ? categoryTone(category).pill
                  : 'border-white/20 bg-black/20 text-slate-300 hover:border-white/35'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 xl:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Map</p>
              <h4 className="text-xl font-semibold text-slate-100">Category Graph</h4>
            </div>
            <Sparkles size={16} className="text-blue-200" />
          </div>

          <div className="relative mt-5 h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(15,23,42,0.9),rgba(2,6,23,0.95))]">
            <div className="absolute inset-0 opacity-25 [background-size:24px_24px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)]" />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {mapCategories.map((category, index) => {
                const { x, y } = getOrbitPosition(index, mapCategories.length);
                return (
                  <line
                    key={`line-${category}`}
                    x1="50"
                    y1="50"
                    x2={x}
                    y2={y}
                    stroke={
                      selectedCategory === category
                        ? 'rgba(191,219,254,0.85)'
                        : 'rgba(148,163,184,0.26)'
                    }
                    strokeWidth={selectedCategory === category ? 0.44 : 0.22}
                  />
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/30 bg-blue-500/18 px-5 py-4 text-center text-blue-100">
              <p className="text-[10px] uppercase tracking-[0.14em] text-blue-200">Core</p>
              <p className="text-sm font-semibold">
                {profile.identify?.name
                  ? `${profile.identify.name.split(' ')[0]}'s Vault`
                  : 'Your Vault'}
              </p>
            </div>

            {mapCategories.map((category, index) => {
              const stats = categoryStats.get(category);
              const count = stats?.count || 0;
              const maxCount = Math.max(
                ...mapCategories.map((cat) => categoryStats.get(cat)?.count || 0),
                1
              );
              const size = 72 + Math.round((count / maxCount) * 24);
              const { x, y } = getOrbitPosition(index, mapCategories.length);
              const tone = categoryTone(category);
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory((prev) => (prev === category ? ALL_CATEGORY_FILTER : category))
                  }
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-2 py-2 text-center transition hover:scale-105 ${tone.node} ${
                    isActive ? 'ring-2 ring-white/55' : ''
                  }`}
                  style={{ left: `${x}%`, top: `${y}%`, width: `${size}px`, minHeight: '56px' }}
                >
                  <div className="mx-auto mb-1 flex w-fit items-center justify-center">
                    {getCategoryIcon(category, 14)}
                  </div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.11em]">{category}</p>
                  <p className="text-[11px] font-semibold">{count}</p>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 xl:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Focus</p>
          <h4 className="text-xl font-semibold text-slate-100">Selected Log</h4>
          {!selectedLog ? (
            <p className="mt-4 text-sm text-slate-400">
              No entry matches your current filters. Adjust search, source, or category.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${categoryTone(selectedLog.category).pill}`}
                >
                  {selectedLog.category}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${sourceTone(selectedLog.source)}`}
                >
                  {selectedLog.source}
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] text-slate-400">{formatLogTime(selectedLog.timestamp)}</p>
                <h5 className="mt-1 text-base font-semibold text-slate-100">{selectedLog.title}</h5>
                {selectedLog.body && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedLog.body}</p>
                )}
              </div>

              {selectedLog.confidence !== null && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Confidence</span>
                    <span>{selectedLog.confidence}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-300 to-indigo-300"
                      style={{ width: `${selectedLog.confidence}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedLog.facts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Extracted Facts
                  </p>
                  {selectedLog.facts.slice(0, 4).map((fact, index) => (
                    <div
                      key={`${selectedLog.id}-fact-${index}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs text-slate-200"
                    >
                      {fact}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => selectedIndex > 0 && setSelectedLogId(filteredLogs[selectedIndex - 1].id)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={selectedIndex >= filteredLogs.length - 1}
                  onClick={() =>
                    selectedIndex >= 0 &&
                    selectedIndex < filteredLogs.length - 1 &&
                    setSelectedLogId(filteredLogs[selectedIndex + 1].id)
                  }
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 xl:p-6">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ledger</p>
          <h4 className="text-2xl font-semibold text-slate-100">Categorized Journal Logs</h4>
          <p className="text-sm text-slate-400">
            Review history grouped by category with quick detail selection.
          </p>
        </div>

        <div className="space-y-4">
          {groupedByCategory.map(({ category, logs }) => {
            const expanded = Boolean(expandedCategories[category]);
            const visibleLogs = expanded ? logs : logs.slice(0, 6);
            return (
              <article key={category} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${categoryTone(category).pill}`}
                    >
                      {category}
                    </span>
                    <span className="text-xs text-slate-400">{logs.length} logs</span>
                  </div>
                  {logs.length > 6 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategories((prev) => ({ ...prev, [category]: !expanded }))
                      }
                      className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300 hover:text-white"
                    >
                      {expanded ? 'Show less' : `Show all ${logs.length}`}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {visibleLogs.map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedLogId(log.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selectedLog?.id === log.id
                          ? 'border-blue-300/40 bg-blue-500/14'
                          : 'border-white/10 bg-slate-950/35 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">{log.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {formatLogTime(log.timestamp)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${sourceTone(log.source)}`}
                        >
                          {log.source}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="text-xl font-semibold text-slate-100">{value}</p>
  </div>
);
