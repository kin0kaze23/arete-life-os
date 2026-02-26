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
        pill: 'text-emerald-200 border-emerald-300/40 bg-emerald-500/20',
        node: 'border-emerald-300/50 bg-emerald-500/20 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.22)]',
      };
    case Category.FINANCE:
      return {
        pill: 'text-amber-200 border-amber-300/40 bg-amber-500/20',
        node: 'border-amber-300/50 bg-amber-500/20 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.22)]',
      };
    case Category.RELATIONSHIPS:
      return {
        pill: 'text-cyan-200 border-cyan-300/40 bg-cyan-500/20',
        node: 'border-cyan-300/50 bg-cyan-500/20 text-cyan-100 shadow-[0_0_30px_rgba(6,182,212,0.22)]',
      };
    case Category.SPIRITUAL:
      return {
        pill: 'text-indigo-200 border-indigo-300/40 bg-indigo-500/20',
        node: 'border-indigo-300/50 bg-indigo-500/20 text-indigo-100 shadow-[0_0_30px_rgba(99,102,241,0.22)]',
      };
    case Category.WORK:
      return {
        pill: 'text-sky-200 border-sky-300/40 bg-sky-500/20',
        node: 'border-sky-300/50 bg-sky-500/20 text-sky-100 shadow-[0_0_30px_rgba(14,165,233,0.22)]',
      };
    case Category.SOCIAL:
      return {
        pill: 'text-teal-200 border-teal-300/40 bg-teal-500/20',
        node: 'border-teal-300/50 bg-teal-500/20 text-teal-100 shadow-[0_0_30px_rgba(20,184,166,0.22)]',
      };
    case Category.PERSONAL:
      return {
        pill: 'text-fuchsia-200 border-fuchsia-300/40 bg-fuchsia-500/20',
        node: 'border-fuchsia-300/50 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_30px_rgba(217,70,239,0.22)]',
      };
    case Category.MEALS:
      return {
        pill: 'text-orange-200 border-orange-300/40 bg-orange-500/20',
        node: 'border-orange-300/50 bg-orange-500/20 text-orange-100 shadow-[0_0_30px_rgba(249,115,22,0.22)]',
      };
    case Category.TRAVEL:
      return {
        pill: 'text-blue-200 border-blue-300/40 bg-blue-500/20',
        node: 'border-blue-300/50 bg-blue-500/20 text-blue-100 shadow-[0_0_30px_rgba(59,130,246,0.22)]',
      };
    case Category.HABIT:
      return {
        pill: 'text-lime-200 border-lime-300/40 bg-lime-500/20',
        node: 'border-lime-300/50 bg-lime-500/20 text-lime-100 shadow-[0_0_30px_rgba(132,204,22,0.22)]',
      };
    default:
      return {
        pill: 'text-slate-200 border-slate-300/30 bg-slate-500/20',
        node: 'border-slate-300/40 bg-slate-500/20 text-slate-100 shadow-[0_0_30px_rgba(148,163,184,0.2)]',
      };
  }
};

const sourceTone = (source: JournalLog['source']) => {
  if (source === 'telegram') return 'text-sky-200 border-sky-300/40 bg-sky-500/20';
  if (source === 'event') return 'text-indigo-200 border-indigo-300/40 bg-indigo-500/20';
  return 'text-slate-200 border-slate-300/30 bg-slate-500/20';
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
    <div className="max-w-6xl mx-auto pb-32 space-y-8">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.95))] p-6 md:p-8">
        <div className="absolute inset-0 opacity-25 [background-size:28px_28px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-300">
                Journal Intelligence
              </p>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                Neural Mind Map
              </h3>
              <p className="text-sm text-slate-300">
                Explore every log in a categorized graph and inspect each entry with full context.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-slate-400 uppercase tracking-[0.12em]">Visible Logs</p>
                <p className="text-xl font-black text-white">{filteredLogs.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-slate-400 uppercase tracking-[0.12em]">Categories</p>
                <p className="text-xl font-black text-white">{groupedByCategory.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-slate-400 uppercase tracking-[0.12em]">Telegram</p>
                <p className="text-xl font-black text-white">{telegramCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                <p className="text-slate-400 uppercase tracking-[0.12em]">Avg Confidence</p>
                <p className="text-xl font-black text-white">{averageConfidence}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search logs, facts, events..."
                className="w-full rounded-xl border border-white/15 bg-black/30 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-300/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'memory', 'telegram', 'event'] as SourceFilter[]).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setSelectedSource(source)}
                  className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                    selectedSource === source
                      ? 'border-sky-300/40 bg-sky-500/20 text-sky-100'
                      : 'border-white/15 bg-black/20 text-slate-300 hover:border-white/30'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(ALL_CATEGORY_FILTER)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                selectedCategory === ALL_CATEGORY_FILTER
                  ? 'border-white/60 bg-white/20 text-white'
                  : 'border-white/20 bg-black/20 text-slate-300 hover:border-white/40'
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
                className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                  selectedCategory === category
                    ? categoryTone(category).pill
                    : 'border-white/20 bg-black/20 text-slate-300 hover:border-white/40'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Map</p>
              <h4 className="text-xl font-black text-white">Category Neural Graph</h4>
            </div>
            <Sparkles size={16} className="text-sky-300" />
          </div>

          <div className="relative mt-5 h-[420px] rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.9),rgba(2,6,23,0.95))] overflow-hidden">
            <div className="absolute inset-0 opacity-30 [background-size:22px_22px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />

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
                    stroke={selectedCategory === category ? 'rgba(125,211,252,0.85)' : 'rgba(148,163,184,0.25)'}
                    strokeWidth={selectedCategory === category ? 0.45 : 0.24}
                  />
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/40 bg-sky-500/20 px-5 py-4 text-center text-sky-100 shadow-[0_0_35px_rgba(56,189,248,0.24)]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-sky-200">Core</p>
              <p className="text-sm font-black">
                {profile.identify?.name ? `${profile.identify.name.split(' ')[0]}'s Vault` : 'Your Vault'}
              </p>
            </div>

            {mapCategories.map((category, index) => {
              const stats = categoryStats.get(category);
              const count = stats?.count || 0;
              const maxCount = Math.max(...mapCategories.map((cat) => categoryStats.get(cat)?.count || 0), 1);
              const size = 70 + Math.round((count / maxCount) * 28);
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-2 py-2 text-center transition-all duration-200 hover:scale-105 ${tone.node} ${isActive ? 'ring-2 ring-white/60 scale-105' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%`, width: `${size}px`, minHeight: '56px' }}
                >
                  <div className="mx-auto mb-1 flex w-fit items-center justify-center">
                    {getCategoryIcon(category, 14)}
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em]">{category}</p>
                  <p className="text-[11px] font-black">{count}</p>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 md:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Focus</p>
          <h4 className="text-xl font-black text-white">Selected Log</h4>
          {!selectedLog ? (
            <p className="mt-4 text-sm text-slate-400">
              No entry matches your current filters. Adjust search/category/source.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${categoryTone(selectedLog.category).pill}`}>
                  {selectedLog.category}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${sourceTone(selectedLog.source)}`}>
                  {selectedLog.source}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">{formatLogTime(selectedLog.timestamp)}</p>
                <h5 className="mt-1 text-base font-black text-white">{selectedLog.title}</h5>
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
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-400"
                      style={{ width: `${selectedLog.confidence}%` }}
                    />
                  </div>
                </div>
              )}
              {selectedLog.facts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Extracted Facts
                  </p>
                  {selectedLog.facts.slice(0, 4).map((fact, index) => (
                    <div key={`${selectedLog.id}-fact-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs text-slate-200">
                      {fact}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => selectedIndex > 0 && setSelectedLogId(filteredLogs[selectedIndex - 1].id)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 disabled:opacity-40"
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
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 md:p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger</p>
            <h4 className="text-2xl font-black text-white">Categorized Journal Logs</h4>
            <p className="text-sm text-slate-400">
              Full log history grouped by category for clean daily review.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {groupedByCategory.map(({ category, logs }) => {
            const expanded = Boolean(expandedCategories[category]);
            const visibleLogs = expanded ? logs : logs.slice(0, 6);
            return (
              <article key={category} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${categoryTone(category).pill}`}>
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
                      className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 hover:text-white"
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
                          ? 'border-sky-300/40 bg-sky-500/15'
                          : 'border-white/10 bg-slate-950/35 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-100">{log.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{formatLogTime(log.timestamp)}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${sourceTone(log.source)}`}>
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

