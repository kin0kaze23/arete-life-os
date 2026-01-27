import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  DailyTask,
  FinanceMetrics,
  MemoryEntry,
  Recommendation,
  Source,
  SourceFile,
  UserProfile,
} from '@/data';
import { SourceViewer } from '@/vault/SourceViewer';
import { getFile } from '@/data';
import { Button } from '@/shared';
import { corePillars } from './corePillars';
import {
  formatSignalTime,
  getCoverageScore,
  getLatestSignal,
  getPillarMemory,
  getPillarSources,
} from './domainUtils';

interface DomainPanelsProps {
  memory: MemoryEntry[];
  tasks: DailyTask[];
  recommendations: Recommendation[];
  sources: Source[];
  profile: UserProfile;
  financeMetrics: FinanceMetrics | null;
  hasFattyLiver: boolean;
  onKeepRecommendation?: (id: string) => void;
  onRemoveRecommendation?: (id: string) => void;
}

export const DomainPanels: React.FC<DomainPanelsProps> = ({
  memory,
  tasks,
  recommendations,
  sources,
  profile,
  financeMetrics,
  hasFattyLiver,
  onKeepRecommendation,
  onRemoveRecommendation,
}) => {
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const [drawerPillarId, setDrawerPillarId] = useState<string | null>(null);
  const [viewerSourceId, setViewerSourceId] = useState<string | null>(null);
  const [viewerFile, setViewerFile] = useState<SourceFile | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadViewer = async () => {
      if (!viewerSourceId) {
        setViewerFile(null);
        return;
      }
      const source = sources.find((s) => s.id === viewerSourceId);
      if (!source) {
        setViewerFile(null);
        return;
      }
      if (source.data) {
        setViewerFile({ name: source.name, mimeType: source.mimeType, data: source.data });
        return;
      }
      if (source.storageKey) {
        const blob = await getFile(source.storageKey);
        if (!blob || !isActive) return;
        const dataUrl = await blobToDataUrl(blob);
        if (!isActive) return;
        setViewerFile({
          name: source.name,
          mimeType: source.mimeType,
          data: dataUrl.split(',')[1],
        });
      }
    };
    loadViewer();
    return () => {
      isActive = false;
    };
  }, [viewerSourceId, sources]);

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          Domain Panels
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {corePillars.map((pillar) => {
          const coverage = getCoverageScore(profile, memory, sources, pillar.id, pillar.categories);
          const latestSignal = getLatestSignal(memory, pillar.categories);
          const recs = recommendations.filter(
            (r) => pillar.categories.includes(r.category) && r.status === 'ACTIVE'
          );
          const fallbackTasks = tasks.filter((t) => pillar.categories.includes(t.category));
          const items = recs.length ? recs.slice(0, 2) : fallbackTasks.slice(0, 2);
          const pillarSources = getPillarSources(memory, sources, pillar.categories);
          const metricLine =
            pillar.id === 'finance' && financeMetrics
              ? `Savings rate ${financeMetrics.savingsRate}%`
              : pillar.id === 'health' && hasFattyLiver
                ? 'Condition: fatty liver'
                : pillar.id === 'personal' && profile.personal.jobRole
                  ? `Role: ${profile.personal.jobRole}`
                  : pillar.id === 'relationships' && profile.relationship.socialEnergy
                    ? `Social energy: ${profile.relationship.socialEnergy}`
                    : pillar.id === 'spiritual' && profile.spiritual.coreValues.length > 0
                      ? `Core values: ${profile.spiritual.coreValues.slice(0, 2).join(', ')}`
                      : null;
          const status = coverage.total < 40 ? 'At Risk' : coverage.total < 70 ? 'Attention' : 'OK';
          const statusClass =
            status === 'OK'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : status === 'Attention'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

          return (
            <div
              key={pillar.id}
              className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-slate-950/40 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                    {pillar.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{pillar.title}</h4>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                      Last signal: {formatSignalTime(latestSignal)}
                    </p>
                    {metricLine && (
                      <p className="text-[9px] uppercase tracking-widest text-slate-600 mt-1">
                        {metricLine}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusClass}`}
                >
                  {status}
                </span>
              </div>

              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${coverage.total}%` }} />
              </div>

              <div className="space-y-3">
                {items.length > 0 ? (
                  items.map((item) => {
                    const id = item.id;
                    const isExpanded = expandedRecId === id;
                    const title = item.title;
                    const description =
                      'impactScore' in item
                        ? item.description
                        : item.methodology || item.description;
                    const rationale = 'impactScore' in item ? item.rationale : item.reasoning;
                    const evidenceCount =
                      'impactScore' in item
                        ? (item.evidenceLinks?.sources?.length || 0) +
                          (item.evidenceLinks?.claims?.length || 0)
                        : 0;
                    const isRec = 'impactScore' in item;
                    return (
                      <div
                        key={id}
                        className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-900/60 hover:border-indigo-500/30 transition-all"
                      >
                        <button
                          onClick={() => setExpandedRecId(isExpanded ? null : id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-black text-white">{title}</p>
                            <span className="text-[8px] uppercase tracking-widest text-slate-500">
                              {isExpanded ? 'Hide' : 'View'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                            {description}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-widest text-slate-500">
                            <span>{getPillarMemory(memory, pillar.categories).length} signals</span>
                            <span>•</span>
                            <span>{pillarSources.length} files</span>
                            {evidenceCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{evidenceCount} evidence</span>
                              </>
                            )}
                          </div>
                          {isExpanded && (
                            <p className="text-[10px] text-slate-500 mt-2">
                              {rationale || 'Grounded in recent signals.'}
                            </p>
                          )}
                        </button>
                        {isRec && (
                          <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-widest">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onKeepRecommendation?.(id)}
                              className="rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            >
                              Keep
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveRecommendation?.(id)}
                              className="rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                    No recommendations yet. Log more signals.
                  </div>
                )}
              </div>

              <button
                onClick={() => setDrawerPillarId(pillar.id)}
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-all"
              >
                View all
              </button>
            </div>
          );
        })}
      </div>

      {drawerPillarId && (
        <div className="fixed inset-0 z-[120] flex items-end lg:items-stretch justify-end bg-black/60 backdrop-blur-md">
          <div className="w-full lg:w-[520px] bg-[#0a0b10] border-l border-white/5 p-6 lg:p-8 overflow-y-auto no-scrollbar animate-in slide-in-from-right-6 duration-300">
            {(() => {
              const pillar = corePillars.find((p) => p.id === drawerPillarId)!;
              const pillarRecs = recommendations.filter(
                (r) => pillar.categories.includes(r.category) && r.status === 'ACTIVE'
              );
              const pillarTasks = tasks.filter((t) => pillar.categories.includes(t.category));
              const items = pillarRecs.length ? pillarRecs : pillarTasks;
              const evidenceSources = getPillarSources(memory, sources, pillar.categories);
              const evidenceSignals = getPillarMemory(memory, pillar.categories).slice(0, 5);
              const coverage = getCoverageScore(
                profile,
                memory,
                sources,
                pillar.id,
                pillar.categories
              );

              return (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">
                        Domain detail
                      </p>
                      <h3 className="text-2xl font-black text-white">{pillar.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Data confidence {coverage.total}% • {evidenceSignals.length} signals •{' '}
                        {evidenceSources.length} files
                      </p>
                    </div>
                    <button
                      onClick={() => setDrawerPillarId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                      Recommendations
                    </p>
                    {items.length > 0 ? (
                      items.map((item) => {
                        const id = item.id;
                        const isExpanded = expandedRecId === id;
                        const isRec = 'impactScore' in item;
                        const title = item.title;
                        const description = isRec
                          ? item.description
                          : item.methodology || item.description;
                        const rationale = isRec ? item.rationale : item.reasoning;
                        const steps = isRec ? item.steps || [] : item.steps || [];
                        return (
                          <div
                            key={id}
                            className="p-4 rounded-2xl border border-white/5 bg-slate-900/60 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-black text-white">{title}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{description}</p>
                              </div>
                              <button
                                onClick={() => setExpandedRecId(isExpanded ? null : id)}
                                className="text-[9px] uppercase tracking-widest text-indigo-400 font-black"
                              >
                                {isExpanded ? 'Hide' : 'Detail'}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="border-t border-white/5 pt-3 space-y-3 text-[10px] text-slate-400">
                                <div>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-500">
                                    Why
                                  </span>
                                  <p className="mt-2">
                                    {rationale || 'Grounded in recent signals.'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-500">
                                    Steps
                                  </span>
                                  <ul className="mt-2 space-y-2">
                                    {(steps.length ? steps : ['Define next step.']).map(
                                      (step, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[9px] font-black">
                                            {idx + 1}
                                          </span>
                                          <span>{step}</span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                        No recommendations yet. Log more signals.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                      Evidence
                    </p>
                    {evidenceSources.length > 0 ? (
                      <div className="space-y-3">
                        {evidenceSources.slice(0, 4).map((source) => (
                          <button
                            key={source.id}
                            onClick={() => setViewerSourceId(source.id)}
                            className="w-full text-left p-4 rounded-2xl border border-white/5 bg-slate-900/60 hover:border-indigo-500/30 transition-all"
                          >
                            <p className="text-xs font-black text-white">{source.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{source.mimeType}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500">
                        No files linked yet.
                      </div>
                    )}
                    {evidenceSignals.length > 0 && (
                      <div className="space-y-2">
                        {evidenceSignals.map((signal) => (
                          <div
                            key={signal.id}
                            className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-[10px] text-slate-400"
                          >
                            {signal.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {viewerSourceId && viewerFile && (
        <SourceViewer files={[viewerFile]} onClose={() => setViewerSourceId(null)} />
      )}
    </div>
  );
};
